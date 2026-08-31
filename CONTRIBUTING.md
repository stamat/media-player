# Contributing to media-player

Issues and pull requests are welcome. Taking part means keeping to the
[Code of Conduct](CODE_OF_CONDUCT.md).

media-player is one idea kept small: the control bar is the author's markup, and the element
only wires it. A change that sharpens that is welcome; a change that grows the surface belongs
in a different library.

## What media-player refuses to become

- **No generated controls.** There is no control bar to configure and no `controls` option
  taking names or an HTML string. The moment the element can draw a control row, every
  question about it becomes a config question — the thing this exists to avoid.
- **No streaming formats and no embeds of its own.** HLS, DASH, YouTube and Vimeo each need
  a third-party script, and nothing here ships one or knows one by name. What the element
  accepts is any child that speaks the media API — the author's `<video>` with hls.js on it,
  or a `<youtube-video>` from [media-elements](https://github.com/muxinc/media-elements)
  marked `media-player-media` — and what a blocked script leaves behind is then that child's
  to decide. A provider, a `src` naming a platform, or a list of known tags is refused: the
  seam is the media API, one selector wide.
- **No shadow DOM.** The light DOM is the point: the page's CSS, the page's semantics, the
  page working before the script arrives.
- **No re-implementing the platform.** The scrubber is an `<input type="range">` and the
  buffered bar is a `<progress>`. Anything that adds `role="slider"`, `aria-valuenow` or a
  keyboard handler for what a native control already answers is a bug, not a feature.
- **No creating the media element.** A `src` on the wrapper would mean no media element at
  all until the script arrives. The author writes the `<audio>` or `<video>`, with
  `controls` on it, and that is the fallback.
- **No keyboard binding off the markup.** A key is written as `key="k"` on the author's own
  button and presses it, so a binding has a visible thing naming it wherever a visible thing
  exists. The `keys` attribute maps a key straight to a method and is only for the action no
  control names — `volumeUp` behind a volume that is a slider. A control's `key` outranks a
  `keys` entry for the same press, and a `keys` entry duplicating what a button could carry
  is the undiscoverable version and gets refused in review.
- **No floating panels the element positions.** The fold opens in the control row's own line,
  in flow. A panel anchored over the picture clips on any ratio the CSS did not foresee — a
  box inside `overflow: hidden` cannot know how much picture stands above the row — and
  escaping the clip means script-measured `position: fixed` with scroll and resize listeners,
  outside-tap dismissal and Escape handling. That is a menu framework; the elementals own that
  machinery, so a change wanting it goes there. This was tried, measured against the 2.4:1
  player in the manual, and taken back out.

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

## Checking HLS by hand

jsdom implements no Media Source Extensions, so nothing about a streaming source can be
covered by `script/test`. A change to the live-stream or rewind-window code wants ten minutes
against a real manifest instead:

1. `script/server`, and a scratch page under `_sitecheck/` — the directory is gitignored, so
   nothing there ships and hls.js can come off a CDN without becoming a dependency.
2. A `<media-player>` whose scrubber binds `seekableStart` and `seekableEnd` rather than
   `duration`, plus one line of `media-player[is-live] .media-player-scrubber { visibility:
   visible; }`, which the optional theme otherwise hides.
3. Load a live manifest in Safari, which plays HLS natively, and in Chrome, which reaches it
   through hls.js. Only one of those two paths is hls.js, so a check in one browser proves
   half of it.

A pass looks like this: the first duration the element sees is `Infinity`, so `is-live` comes
on; `seekableStart`–`seekableEnd` spans the manifest's window; `behindLive` falls to zero at
the edge; a skip backwards lands inside the window and stays there; and `goLive` returns.

No manifest URL is pinned here on purpose. Public test streams rot — one 404'd mid-session
while this page was being written — and a URL kept in a repository that refuses HLS is a
maintenance promise nobody made.

## How a release works

`script/publish [version]` bumps `package.json`, runs `script/changelog` to cut
`[Unreleased]` into a released entry, builds, commits, tags and pushes. Pushing the tag
triggers [publish.yml](.github/workflows/publish.yml), which publishes to npm via trusted
publishing — OIDC, no tokens stored anywhere.
