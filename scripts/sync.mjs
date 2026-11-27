// Brings a plugin's folder up to its product's latest release: the files it copies from that tag, and the version in
// both manifests. Prints the new version, or nothing when the folder is already current.
// Usage: node scripts/sync.mjs <plugin>
import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// Each product's public repository, and what its folder copies from a release.
// npm names the package an MCP server's launcher runs, so the pin in .mcp.json moves with the version.
const sources = {
  proofmarks: { repo: 'tortastudios/proofmarks', copy: ['skills', 'LICENSE.md'], npm: '@tortastudios/proofmarks' },
};

const name = process.argv[2];
const source = sources[name];
if (!source) {
  console.error(`No source for ${name}. Add one to scripts/sync.mjs.`);
  process.exit(2);
}
const github = async url => {
  const response = await fetch(url, {
    headers: {
      accept: 'application/vnd.github+json',
      ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status} for ${url}`);
  return response;
};
const tag = (await (await github(`https://api.github.com/repos/${source.repo}/releases/latest`)).json()).tag_name;
const version = tag.replace(/^v/, '');
const folder = path.join('plugins', name);
const manifests = ['.claude-plugin/plugin.json', '.codex-plugin/plugin.json'].map(file => path.join(folder, file));
if (JSON.parse(await readFile(manifests[0], 'utf8')).version === version) process.exit(0);

const temp = await mkdtemp(path.join(os.tmpdir(), 'sync-'));
try {
  const tarball = await github(`https://api.github.com/repos/${source.repo}/tarball/${tag}`);
  await writeFile(path.join(temp, 'release.tgz'), Buffer.from(await tarball.arrayBuffer()));
  execFileSync('tar', ['-xzf', 'release.tgz'], { cwd: temp });
  const [top] = (await readdir(temp, { withFileTypes: true })).filter(entry => entry.isDirectory());
  for (const item of source.copy) {
    await rm(path.join(folder, item), { recursive: true, force: true });
    await cp(path.join(temp, top.name, item), path.join(folder, item), { recursive: true });
  }
  for (const file of manifests) {
    const manifest = JSON.parse(await readFile(file, 'utf8'));
    manifest.version = version;
    await writeFile(file, JSON.stringify(manifest, null, 2) + '\n');
  }
  if (source.npm) {
    const file = path.join(folder, '.mcp.json');
    const config = JSON.parse(await readFile(file, 'utf8'));
    for (const server of Object.values(config.mcpServers))
      server.args = server.args?.map(arg =>
        arg === source.npm || arg.startsWith(`${source.npm}@`) ? `${source.npm}@${version}` : arg,
      );
    await writeFile(file, JSON.stringify(config, null, 2) + '\n');
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}
console.log(version);
