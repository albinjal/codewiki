# codewiki

Unofficial CLI for fetching and reading [Code Wiki](https://codewiki.google) docs for any GitHub repo. Docs are cached locally so repeated reads are instant and context-efficient — read the whole doc or just a single section.

## Install

```sh
npm install -g @albinjal/codewiki
```

Chromium is downloaded automatically on install.

## Usage

### Fetch docs

```sh
codewiki fetch torvalds/linux
codewiki fetch getzep/graphiti vectorize-io/hindsight --concurrency 3
```

### Read docs

```sh
# Full doc
codewiki read getzep/graphiti

# List available sections
codewiki read getzep/graphiti --list-sections

# Read a single section
codewiki read getzep/graphiti --section "Architectural Overview and Core Components"
```

If a repo hasn't been fetched yet, `read` will fetch and cache it automatically.

## Cache

Docs are cached at `~/.codewiki/repos/<owner>/<repo>.md` as structured markdown with YAML frontmatter. Re-fetch anytime with `codewiki fetch` to refresh the cache.

## Development

```sh
bun install
bun run typecheck
bun run build
node dist/cli.js read getzep/graphiti --list-sections
```

## Publishing

Push a `v*` tag to trigger CI and auto-publish to npm:

```sh
# Bump version in package.json, then:
git tag v0.2.0
git push origin v0.2.0
```

Requires an `NPM_TOKEN` secret set in the GitHub repo settings.

## License

MIT
