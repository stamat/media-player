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

- **Keys the buttons carry.** Write `key="k"` on a control you already wrote and an `on=`
  naming `onKeyDown` on the player, and <kbd>k</kbd> clicks that control — everything hanging
  off its `on=` firing as though it had been pressed. The binding lives on the button rather
  than in a map, so there is no second list to keep in step with the first and nothing to
  announce separately from the buttons; a disabled button ignores its key the same way it
  ignores a click. Which `keydown` you bind is the whole of the scope:
  `keydown:onKeyDown` answers while focus is inside the player, and
  `keydown@document:onKeyDown` answers anywhere on the page — the form a shortcut usually
  means, at the price of the page giving those letters up, and of two players so bound both
  answering one press. Neither is a default and no sample on the page turns one on, because a
  page-wide <kbd>k</kbd> is the page's call and not this element's. Presses that are somebody
  else's are left where they are: the arrows, <kbd>Home</kbd> and <kbd>End</kbd> belong to the
  sliders and the control row, a modified press to the browser, and a key typed into a text
  field, a `<select>` or anything `contenteditable` to what is being typed into — including
  one inside an open shadow root, which a `keydown` reports as the component rather than the
  field, so the focused element is consulted as well as the event's target. A *closed* root
  offers no way in and its letters are taken; a page with one wants the focused binding.

- **Tooltips on the controls.** The samples wrap each button in `<tooltip-elemental>`, so
  hovering or focusing one says what it does — and it is where a `<kbd>` naming a key goes on
  a page that binds one. Hover and focus each hold the bubble open, <kbd>Escape</kbd>
  dismisses it per
  [WCAG 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html),
  and touch is ignored outright rather than half-handled — nothing essential belongs in a
  tooltip. The play and mute bubbles bind `playLabel` and `muteLabel`, the same state the
  buttons announce themselves by, so what is read and what is heard cannot drift. The button
  keeps its `aria-label`, so the bubble is a description and the control stays named with or
  without it. Importing `media-player` defines the element; its stylesheet and theme join the
  install list, and unlike the other elementals it is the theme that paints the bubble at all.

- **Both kinds of bubble now agree.** The scrubber's value bubble is the page's two colours
  swapped — white on a dark page, black on a light one — which is what `<tooltip-elemental>`
  was already doing on the buttons beside it; it used to be a light card either way. The fix
  was to stop overriding the slider's own two colours in `theme.css`, which had also been
  outranking that sheet's `forced-colors` branch, where the pair has to turn back the right
  way up. The caret comes off a bubble inside a player at the same time: a row of buttons
  a few pixels apart is not ambiguous about which one it points at, and the player this
  rewrites drew a plain rounded box too. One more CSS change: the control row's two clusters
  are split by `margin-inline-end: auto` on the clock rather than an auto margin on whatever
  followed the clock, because a button wrapped in a tooltip is no longer the flex item — the
  wrapper is `display: contents`, and a margin on it lands on no box.

- **The look is optional.** Structure and look ship as separate stylesheets, the way the
  elementals do: `style.css` alone is a working player, and `theme.css` brings the flat
  compact bar, the accent flooding a button on hover, the slim track with its accent thumb,
  the video gradient with its centred play chip, a stripe march while
  buffering and a scrubber that hides on a live stream — in `Canvas` and `CanvasText`
  rather than hardcoded white and slate, so dark mode and forced colours need no palette.

- **A two-row bar that needs no breakpoint.** The scrubber comes first in the sample markup
  and takes a whole flex line, so the buttons and the clock wrap beneath it without a width
  query — the same shape on a phone and on a page-wide video. It is ordered in the markup
  rather than moved with CSS `order`, which would have left a keyboard user tabbing the bar in
  the opposite direction from the one they read it in. The row beneath falls into two clusters
  — the transport and its clock at the start, the rest at the end — opened by a single `auto`
  margin on the clock's end edge, so the clock and everything before it goes left, everything
  after it goes right, and moving the clock moves the divide. One thing gives way
  under a coarse pointer: the volume slider is hidden — 72px is not draggable by thumb, the
  device has volume keys, and the mute button stays. The buttons do not grow with it. They
  are 32px on every pointer, which clears the AA minimum of
  [WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) and
  gives up the AAA 44px of
  [2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) — a
  deliberate trade, because 44px buttons put the row 6px past what a 393px phone gives the
  bar and wrapped the fullscreen button to a third line. At 32px the video sample's six
  buttons and clock measure 306px and hold two rows down to a 360px phone; `theme.css`
  documents the two declarations that buy the AAA size back for a shorter row.

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
  rather than dropped, so nothing offers you `endDrag`. The samples on the page read the same
  file: their Options tab is generated from it, one knob per authored attribute and one per
  custom property, which is the argument for shipping the ecosystem's format rather than
  inventing one — the controls cannot describe an element the package no longer has. The
  twelve attributes the element writes for itself carry an `x-code-preview` key marking them
  hidden there, since a knob spliced into the markup would not survive the next `play`; the
  key is namespaced, the schema allows it, and every other tool ignores it.
