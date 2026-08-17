# Contributing to media-player

Issues and pull requests are welcome. Taking part means keeping to the
[Code of Conduct](CODE_OF_CONDUCT.md).

media-player is one idea kept small: the control bar is the author's markup, and the element
only wires it. A change that sharpens that is welcome; a change that grows the surface is
probably for a different library.

## What media-player refuses to become

- **No generated controls.** There is no control bar to configure and no `controls` option
  taking names or an HTML string. The moment the element can draw a control row, every
  question about it becomes a config question, which is the thing this exists to avoid.
- **No streaming formats and no third-party embeds.** HLS, DASH, YouTube and Vimeo are all
  a third-party script driving an element the author did not write. Nothing degrades without
  JavaScript there, so the central promise cannot be kept — and
  [Plyr](https://github.com/sampotts/plyr) and [Vidstack](https://vidstack.io) already do it
  well. Send people there.
- **No shadow DOM.** The light DOM is the point: the page's CSS, the page's semantics, the
  page working before the script arrives.
- **No re-implementing the platform.** The scrubber is an `<input type="range">` and the
  buffered bar is a `<progress>`. Anything that adds `role="slider"`, `aria-valuenow` or a
  keyboard handler for what a native control already answers is a bug, not a feature.
- **No creating the media element.** A `src` on the wrapper would mean no media element at
  all until the script arrives. The author writes the `<audio>` or `<video>`, with
  `controls` on it, and that is the fallback.
- **No player-wide keyboard map** until it can be discoverable. See the `ponytail:` note in
  the source.

## Getting set up

```bash
git clone https://github.com/stamat/media-player.git
cd media-player
script/bootstrap
```

```bash
script/server    # build + serve with live reload, http://localhost:4040
script/build     # compile dist/ and index.html
script/test      # jest
script/lint      # eslint + stylelint
```

The library is one file, `src/scripts/media-player.js`, with its test in `test/`.
`src/markup/index.md` is the whole site and builds to `index.html` at the repository root;
`dist/`, `css/` and `js/` are built and committed, because the page loads them from here —
`js/code-preview-hljs.min.js` among them, copied out of `node_modules` by the build rather
than compiled, because the live samples need it and no CDN should be in the way.

## Pull requests

- **A test per change**, in `test/media-player.test.js`. Test names are sentences stating
  the guarantee. A failing test means the code is wrong — never weaken or delete one to make
  it pass; if the test itself is wrong, say so in the pull request and let review decide.
- **Docs in the same change.** A new attribute or bindable key lands in `src/markup/index.md`
  in the table that already covers its kind. The README carries no reference — it is the
  pitch and only changes when the pitch does.
- **Progressive enhancement intact.** Every sample must play with the script blocked, which
  means the `controls` attribute stays in every example.
- **Accessibility is the point.** WCAG and the matching
  [APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/) are the standard. No change
  trades a role, a state, focus order or keyboard handling away for looks.
- **Run `script/lint`.** eslint and stylelint are the authority, and CI runs them on Node 22
  and 24.
- **Add a changelog entry** under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md).
- **Keep the diff about one thing.**
- `dist/`, `css/`, `js/` and `index.html` are generated — never edit them by hand.

Commit messages are freeform; write something that says what changed.

## How a release works

`script/publish [version]` bumps `package.json`, runs `script/changelog` to cut
`[Unreleased]` into a released entry, builds, commits, tags and pushes. Pushing the tag
triggers [publish.yml](.github/workflows/publish.yml), which publishes to npm via trusted
publishing — OIDC, no tokens stored anywhere.
