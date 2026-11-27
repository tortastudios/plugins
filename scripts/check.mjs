// Checks what no client's validator does: both catalogs list the same plugins in the same folders, each plugin's
// Claude Code and Codex manifests agree on its name and version, and every file a manifest names exists.
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const read = async file => JSON.parse(await readFile(file, 'utf8'));
const exists = file =>
  access(file).then(
    () => true,
    () => false,
  );
const problems = [];
const claude = await read('.claude-plugin/marketplace.json');
const codex = await read('.agents/plugins/marketplace.json');
if (claude.name !== codex.name) problems.push(`The catalogs have different names: ${claude.name} and ${codex.name}.`);
const names = catalog => catalog.plugins.map(entry => entry.name).sort();
if (names(claude).join() !== names(codex).join()) problems.push('The two catalogs list different plugins.');

for (const entry of codex.plugins) {
  const folder = entry.source?.path;
  const label = entry.name;
  if (claude.plugins.find(other => other.name === label)?.source !== folder) {
    problems.push(`${label}: the catalogs point at different folders.`);
    continue;
  }
  const manifests = {};
  for (const client of ['.claude-plugin', '.codex-plugin']) {
    const file = path.join(folder, client, 'plugin.json');
    if (!(await exists(file))) {
      problems.push(`${label}: ${file} is missing.`);
      continue;
    }
    manifests[client] = await read(file);
    if (manifests[client].name !== label) problems.push(`${label}: ${file} names it ${manifests[client].name}.`);
  }
  const versions = new Set(Object.values(manifests).map(manifest => manifest.version));
  if (versions.size > 1) problems.push(`${label}: its manifests have different versions: ${[...versions].join(', ')}.`);
  // Paths a manifest names, such as ./.mcp.json, ./skills/ and the icon.
  const paths = Object.values(manifests).flatMap(manifest =>
    [
      manifest.mcpServers,
      manifest.skills,
      manifest.icon,
      manifest.interface?.logo,
      manifest.interface?.composerIcon,
    ].filter(value => typeof value === 'string'),
  );
  for (const named of new Set(paths))
    if (!(await exists(path.join(folder, named)))) problems.push(`${label}: ${named} is named but missing.`);
  // Anthropic's directory refuses a launcher that runs a package without an exact version, such as npx -y name.
  const mcp = path.join(folder, '.mcp.json');
  if (await exists(mcp))
    for (const [server, entry] of Object.entries((await read(mcp)).mcpServers ?? {}))
      if (['npx', 'uvx', 'bunx', 'pnpx'].includes(path.basename(entry.command ?? ''))) {
        const target = (entry.args ?? []).find(arg => !arg.startsWith('-'));
        const pinned = target?.match(/^(@?[^@]+)(?:@|==)(\d+\.\d+\.\d+[\w.+-]*)$/);
        if (!pinned) problems.push(`${label}: ${server} runs ${target} without an exact version.`);
        else if (pinned[2] !== manifests['.claude-plugin']?.version)
          problems.push(
            `${label}: ${server} runs ${pinned[2]}, but the plugin is ${manifests['.claude-plugin']?.version}.`,
          );
      }
  for (const [what, files] of [
    ['a README', ['README.md']],
    ['a license', ['LICENSE', 'LICENSE.md']],
  ])
    if (!(await Promise.all(files.map(file => exists(path.join(folder, file))))).includes(true))
      problems.push(`${label}: there's no ${what} in ${folder}.`);
}

if (problems.length) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}
console.log(`Both catalogs list ${codex.plugins.length} plugin(s), and every manifest agrees.`);
