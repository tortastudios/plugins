# Proofmarks

Proofmarks marks what reads like AI slop on your page, says why, and rewrites it with the agent you already use. It runs on your machine, next to your site's development server, and shows proofreading marks on the real page. Accept writes a rewrite straight into your source file, and Undo puts it back.

This plugin connects Claude Code or Codex to Proofmarks and adds two skills: one sets Proofmarks up on your site, and one proofs a page for you.

## Install

Claude Code:

```sh
claude plugin marketplace add tortastudios/plugins
claude plugin install proofmarks@tortastudios
```

Codex:

```sh
codex plugin marketplace add tortastudios/plugins
codex plugin add proofmarks@tortastudios
```

## What to ask

- "Set up Proofmarks on this site."
- "Proof this page."
- "Watch Proofmarks." Your agent takes the rewrite requests you send from the page.

In Claude Code, requests can also arrive on their own, with no watch loop, through its channels research preview:

```sh
claude --dangerously-load-development-channels plugin:proofmarks@tortastudios
```

## Privacy

Reviews send the page's text to Torta's relay, which passes it to Jev, the decision model, and stores none of it. Usage counts are off until you turn them on. [TELEMETRY.md](https://github.com/tortastudios/proofmarks/blob/main/TELEMETRY.md) lists every request Proofmarks makes.

## More

- [proofmarks.dev](https://proofmarks.dev)
- [Source and documentation](https://github.com/tortastudios/proofmarks)
- License: [FSL-1.1-MIT](LICENSE.md)
