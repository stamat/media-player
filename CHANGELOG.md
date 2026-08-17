# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**How to use it:** land changes under `## [Unreleased]`, grouped under _Added_, _Changed_,
_Deprecated_, _Removed_, _Fixed_ or _Security_. Write entries for the person upgrading, not
for the person who wrote the code.

## [Unreleased]

### Added

- **`<media-player>`, the first cut.** One custom element over the `<audio>` or `<video>`
  already in the page. Which of the two it wrapped decides the video half — poster, overlay,
  captions, fullscreen and controls that fade while playing — read off the child element
  rather than off a `src`, so there is never a moment where the page has no media element in
  it. Play, pause, stop, skip, seek, volume — slider or `volumeUp`/`volumeDown` buttons —
  mute, buffering and live-stream detection; volume, mute and captions state remembered per
  `storage-key`.

- **It claims the OS media panel.** Starting playback points the lock screen, the hardware
  media keys and the headphone buttons at the player. Play and pause were always there —
  every browser draws them for any media that plays — so what this adds is the rest: skip
  buttons moving by the same `skip` seconds the page's buttons use, a working scrubber
  through `seekto`, `stop`, and a name for what is playing. The name comes out of markup you
  already wrote, a `title` on the media element and a `<video poster>` for artwork, with new
  `media-title`, `artist`, `album` and `artwork` attributes on `<media-player>` for what that
  cannot say. Nothing is invented: with none of them the panel keeps its own default rather
  than showing a file name. The panel is one per document and follows whichever player
  started last; a live stream gets no seek buttons, and a browser without the API plays on
  unchanged.

- **The controls are the author's markup.** No generated control bar and no option that
  takes one: buttons and range inputs are written in the page and wired by name through
  [hydrargyri](https://github.com/stamat/hydrargyri) — `on` for what fires, `bind` for where
  state lands. The `controls` attribute the author wrote stays on the media element until
  the element upgrades, so a script that never loads leaves a working native player.

- **The look is optional.** Structure and look ship as separate stylesheets, the way the
  elementals do: `style.css` alone is a working player, and `theme.css` brings the flat
  compact bar, the accent flooding a button on hover, the slim track with its accent thumb,
  the video gradient with its centred play chip, a stripe march while
  buffering and a scrubber that hides on a live stream — in `Canvas` and `CanvasText`
  rather than hardcoded white and slate, so dark mode and forced colours need no palette.

- **A two-row bar that needs no breakpoint.** The scrubber comes first in the sample markup
  and takes a whole flex line, so the buttons and the clock wrap beneath it at every width —
  the same shape on a phone and on a page-wide video. It is ordered in the markup rather than
  moved with CSS `order`, which would have left a keyboard user tabbing the bar in the
  opposite direction from the one they read it in. The row beneath falls into two clusters —
  the transport and its clock at the start, the rest at the end — opened by a single `auto`
  margin on whatever follows the clock, so the clock and everything before it goes left,
  everything after it goes right, and moving the clock moves the divide. Under a coarse
  pointer two more things
  give way to the finger: the volume slider is hidden — 72px is not draggable by thumb, the
  device has volume keys, and the mute button stays — and the buttons grow from 32px to the
  44px [WCAG 2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
  asks for, the box only, with the icon left the size it was.

- **The scrubber never claims a position the browser refused.** A seek is clamped to
  `seekable` — what this browser can actually reach — rather than to `duration`, which is only
  how long the file is. The two differ whenever a server answers a `Range` request with the
  whole file, and the old behaviour drew the thumb where the seek aimed instead of where
  playback landed. Disjoint ranges are walked rather than bracketed, so a seek into the gap a
  previous seek left behind lands on the nearer edge of a range that exists.

- **A refused play says so.** `play()` returns a promise, and a rejected one is the only report
  a browser makes that a gesture did not count, a source will not decode, or a load gave up.
  It used to be dropped, which made "pressing play does nothing" impossible to tell apart from
  a slow network. It is caught and warned now, with the browser's own message.

- **The parts with an APG pattern are borrowed, not rewritten.** The scrubber and volume are
  [`<slider-elemental>`](https://github.com/stamat/book-of-elementals) around a native
  `<input type="range">`, the buffered bar is `<progress-elemental buffer>`, and the control
  row is `<toolbar-elemental>`. This element writes no `role` and no `aria-valuenow` of its
  own.

- **A custom elements manifest, generated on every build.** `custom-elements.json` ships in
  the package and is named by the `customElements` field, so an editor or a docs generator
  can read the attributes, the events and the custom properties without this page open
  beside it. Only what the samples name is public in it — `togglePlay`, the skips, the
  sliders' handlers and the media listeners; the machinery behind them is marked private
  rather than dropped, so nothing offers you `endDrag`.
