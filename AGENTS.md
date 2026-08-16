# media-player — agent notes

One custom element wrapping the `<audio>` or `<video>` the author already wrote. Read
[CONTRIBUTING.md](CONTRIBUTING.md) first — it defines what belongs here and what a pull
request needs.

Stack: vanilla ES modules — no framework, no TypeScript. SCSS, Jest, built with
[poops](https://github.com/stamat/poops). Runtime dependencies are
[hydrargyri](https://github.com/stamat/hydrargyri) for the binding and
[book-of-elementals](https://github.com/stamat/book-of-elementals) for the sliders, progress
bar and toolbar. Browser support is pinned by `.browserslistrc`; `npm run lint:es` checks
the built output against it.

## Commands

```bash
script/bootstrap # npm ci, from a fresh clone
script/server    # build + serve with live reload, http://localhost:4040
script/build     # compile dist/ and index.html
script/test      # jest
script/lint      # eslint + stylelint (the authority; CI runs it)
```

## Layout

- `src/scripts/media-player.js` — the element, one file.
- `src/styles/index.scss` — structure only, no colours. `theme.scss` — the optional look.
- `src/markup/index.md` — the whole site, one page, built to `index.html` at the root.
- `test/media-player.test.js` — the spec.
- `dist/`, `css/`, `js/`, `index.html` are generated **and committed**, because the
  published page loads them from this repository.

## The three rules that decide most questions

1. **The page must play with the script blocked.** The author writes `controls` on the
   media element; the upgrade takes it off and `disconnected` puts it back. Any change that
   makes the element create, move or replace the media element breaks this and is refused.
2. **The controls are the author's markup.** No generated control bar, no option that takes
   one. If a feature needs new markup, it goes in `src/markup/index.md` as a sample the
   author copies — never in a template string here.
3. **Do not re-implement the platform.** The scrubber is an `<input type="range">` inside
   `<slider-elemental>`, the buffered bar is a `<progress>`. Adding `role="slider"`,
   `aria-valuenow` or a keyboard handler for something a native control already answers is a
   bug.

## Non-obvious rules

- **Attributes are CSS hooks; properties are state.** A value that moves per animation frame
  (`currentTime`, `buffered`, `volumePercent`) goes in `static properties`, which never
  touch the DOM. Only the flags a stylesheet needs go in `static attributes`. Reflecting
  `currentTime` would be sixty `setAttribute` calls a second.
- **hydrargyri refuses a name that already answers on the element.** An attribute or
  property colliding with a method on this class is dropped with a warning at definition —
  which is why `storage-key` is read with `getAttribute` rather than declared: there is a
  `get storageKey()` here already.
- **`false` removes an attribute; an absent one reads `null`.** Assert against
  `hasAttribute()` in tests rather than `toBe(false)`.
- **Five events mean "metadata arrived".** `durationchange`, `loadedmetadata`, `loadeddata`,
  `canplay` and `canplaythrough` are used differently across browsers, and a small file can
  fire all of them before the element upgrades. They all route to `loaded()`, which is
  idempotent, and `connected()` calls it once more for the file that was ready first.
- **jsdom implements no playback.** Tests define `duration`, `currentTime`, `paused`,
  `volume` and `muted` on the element instance and stub `play`/`pause`. Fullscreen and
  `cuechange` are not testable here and are documented as uncovered at the top of the test
  file.
- **`localStorage` throws** in a Safari private window and under a blocking cookie policy.
  `store` and `read` swallow it — remembering a volume is a nicety, taking the page down
  over one is not.

## Boundaries

- **Always:** run `script/lint` and `script/test` before calling work done; pair every fix
  or feature with a test; note DOM or CSS output changes in the changelog entry.
- **Ask first:** changing the markup contract (the `on` and `bind` names the author writes,
  or the class names the stylesheet targets — that is the public API); adding a dependency.
- **Never:** edit `dist/`, `css/`, `js/` or `index.html` by hand; weaken, skip or delete a
  test to make it pass; bump the version or publish — a tag does that.
