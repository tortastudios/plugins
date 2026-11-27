# Torta Studios plugins

Torta Studios' tools for Claude Code and Codex, in one catalog. Add it once, then install any of them.

## Add the catalog

Claude Code:

```sh
claude plugin marketplace add tortastudios/plugins
```

Codex:

```sh
codex plugin marketplace add tortastudios/plugins
```

## Plugins

| Plugin | What it does | Install in Claude Code | Install in Codex |
| --- | --- | --- | --- |
| [Proofmarks](plugins/proofmarks) | Marks what reads like AI slop on your page, says why, and rewrites it with the agent you already use. | `claude plugin install proofmarks@tortastudios` | `codex plugin add proofmarks@tortastudios` |

Each plugin is a thin folder: its manifests, its MCP server config, its skills and an icon. The code lives in each product's own repository, and each folder carries that product's license.
