# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**How to use it:** land changes under `## [Unreleased]`, grouped under _Added_, _Changed_,
_Deprecated_, _Removed_, _Fixed_ or _Security_. Write entries for the person upgrading, not
for the person who wrote the code.

## [Unreleased]

### Fixed

- **A mute survives a reload on its own.** Muting a volume nobody had dragged stores
  `muted` and no level — `rememberVolume` never writes a zero — and `restore` waited for a
  stored level before acting on either flag, so the one mute a fresh player could make was
  forgotten by the next visit. The flag is restored on its own now; unmuting after it
  returns to full, there being no remembered level to return to. No DOM or CSS output
  changes.

## [1.1.0] - 2026-08-21

### Added

- **A live stream is seekable as far as the browser says it is.** `is-live` used to turn
  seeking off wholesale — `seekTo`, `seekBy`, `skipForward`, `skipBackward` and a drag on the
  scrubber all refused the moment a duration came back endless. That is right for a stream
  with nothing behind the live edge and wrong for one with a rewind window, which is what a
  DVR manifest serves: the browser reports the reachable seconds in `seekable`, and the
  element was ignoring an answer it already had. Now the window decides. Where there is one,
  all five work inside it, clamped by the same range walk that has always kept a seek where a
  server can serve it; where there is none, all five still decline, and so does the new
  `goLive`. `stop` refuses either way — a window gives a stream an oldest second, not a
  beginning. Three properties carry the window for markup to bind: `seekableStart` and
  `seekableEnd`, in absolute seconds, so a scrubber over a stream binds them where a file's
  scrubber binds `duration`, and `behindLive` for how far back playback sits. They refresh on
  `timeupdate` — newly in `static wires` — and on `progress`, about four times a second,
  which is the rate a window sliding in whole segments moves at; a file's clock still comes
  off the animation frame. New interaction type: `go-live`. **Watch for:** the optional theme
  still hides the scrubber on any live stream, which a DVR player does not want — one line of
  your own CSS puts it back, and the manual says which. No other DOM or CSS output changes.


- **Clicking the picture pauses the video.** A click anywhere on a playing `<video>` now
  pauses it, wired by the element itself the way the media element's events are — there is
  no pair to add to the markup, and a `<video>` already carrying `on="click:…"` keeps
  exactly what it wrote. Video only: an `<audio>` with its controls off draws no box, so a
  click reaching one came from the page around it. DOM output changes: a `click` listener is
  attached to the `<video>` at upgrade.

- **Docs: what happens with a live stream, and how HLS composes.** The manual gained
  _Live, and the streams it does not carry_ — what `is-live` turns off and why, and a
  worked hls.js sample for the case the element refuses to ship. No code changed: the
  element never creates or replaces the media element, so a third-party script attaching to
  the `<video>` you wrote already worked, in either order, and the page now says so along
  with the cost — with the script blocked, a bare `.m3u8` plays on Safari and nowhere else.
  Not covered by a test: jsdom implements no Media Source Extensions.

- **Frames on the scrubber.** Hovering the scrubber can now show the frame for the second
  under the pointer, out of markup the author writes: a `<track kind="metadata">` on the
  media element naming a WebVTT of `sprite.jpg#xywh=…` cues — the format Plyr, Vidstack
  and media-chrome read, so thumbnails cut for any of them work here — and a
  `.media-player-preview` box inside the scrubber, wired
  `on="pointermove:preview;pointerleave:endPreview"`. The browser fetches and parses the
  VTT itself (the element flips the track `hidden`, which is what makes a browser load
  one); the element reads only the `#xywh` fragment, sizes the box to the tile — a tile is
  shown at the size it was cut, never scaled — and slides it along the track, clamped to
  the player's edges. A relative image path in the VTT resolves against the VTT file, and
  URL serialisation is the escaping boundary that keeps a quote in a filename from closing
  the `url("…")` it is painted into. No track, no box, unloaded cues or a live stream each
  mean no preview and no error. Generating the sprite and the VTT is `script/thumbs` in
  the repository — bash over ffmpeg/ffprobe, not shipped in the npm package. DOM output
  changes: the element writes `background-image`, `background-position`,
  `background-size`, `width`, `height`, `left` and the `hidden` attribute on the preview
  box, and a captions `<track>` is now found by `track:not([kind=metadata])` rather than
  `track`, so a thumbnails track never lands behind the captions button. CSS output
  changes: `style.css` positions `.media-player-preview` above the scrubber and takes it
  out of hit-testing; `theme.css` gives it the surface, the buttons' radius and a
  `CanvasText` rim — dark on a light scheme, white on a dark one, following the page's
  `color-scheme` the way the rest of the theme already does.

### Changed

- **The thumb glides.** The clock has always painted every animation frame, but the
  scrubber's `step="1"` snapped each write to a whole second, so the thumb jumped once a
  second over a smoothly filling bar. The samples now write `step="any"` and drop the
  `|floor` pipes from the scrubber's binds, and the thumb moves with the frame. A hand
  still works per second: the new `beginScrub` handler — wired as
  `pointerdown:beginScrub;keydown:beginScrub` in every sample — flips the step to whole
  seconds before a press moves the value, and `endScrub` puts the resting step back, so a
  drag and the arrow keys land on whole seconds and the tooltip reads a whole-second clock
  either way. Markup from an earlier version keeps exactly the behaviour it wrote:
  `beginScrub` restores whatever step it found, and `|floor` stays a public formatter. No
  CSS output changes; the DOM change is the scrubber input's `step` attribute moving
  between `any` and `1` while a press holds it.

### Fixed

- **The big play button comes back when a video pauses, and stays up while it is scrubbed.**
  The click-to-play overlay was taken off by `poster-hidden`, which is set once and never
  cleared — so the button that starts a video vanished the first time it started and never
  returned, and scrubbing a video that had never been played took it away too, leaving a
  paused picture with nothing on it to press. It now follows `is-playing`: out while there is
  something to pause, back over the frame the moment there is not. `poster-hidden` still
  hides the poster and still means what it did. **Upgrading:** a stylesheet of your own that
  hides `.media-player-overlay` on `media-player[poster-hidden]` now hides it over a paused
  video too — key it on `[is-playing]` instead. CSS output changes: that one selector in
  `media-player.css`.

- **A caption track is found however it arrives, and `default` decides which one.** The
  track was read once with `querySelector`, at upgrade — so the first `<track>` in the
  markup won even when the author marked a different one `default`, and a track added
  afterwards was never seen at all. That second half is what a streaming library does: hls.js
  and dash.js put captions on the media element as an in-band track with no `<track>` element
  behind it, long after this element has upgraded, and the captions button stayed dark
  forever. Now `default` is preferred over document order, the media element's own track list
  is read when the markup has nothing, and `addtrack` says when to look again — the button
  lights up when the track lands, carrying whatever captions choice the page remembered. The
  first track found still wins and keeps winning; switching language needs a control to
  switch with, and there is none to name. **Upgrading:** the `track` property now holds the
  `TextTrack` rather than the `<track>` element that used to carry it, because an in-band
  track has no element — `player.track.mode` where it was `player.track.track.mode`. No DOM
  or CSS output changes.

## [1.0.0] - 2026-08-20

### Added

- **The media element wires itself.** The ten `on=` pairs every sample carried on its
  `<audio>` or `<video>` — metadata, play state, buffering, `progress`, `volumechange` —
  and the track's `cuechange:onCue` were plumbing an author had to transcribe and could get
  silently wrong: forget `pause:onPause` and the play icon wedges the first time the OS
  panel pauses it, with nothing on screen saying why. The element now declares them in
  `static wires` (hydrargyri 2.2.0, the dependency bump this rides on) and they attach when
  the element upgrades, so the media element and its track take no `on=` at all. Markup from
  an earlier version keeps working — a pair the attribute already carries is wired once, not
  twice. The samples and the handler reference shrink to match; the `on=` you still write
  are the ones that are choices: your controls, and the keyboard, pointer and fullscreen
  listeners on `<media-player>` itself.

- **A background loop, and the one button it owes you.** The manual gains a guide for the
  muted autoplaying `<video>` used as decoration: no wiring on the video, no
  scrubber and no clock, and a play/pause button that is not optional — an autoplaying
  animation longer than five seconds needs a way to stop it under
  [WCAG 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), and the
  element already has the button for it.

- **A reference for the `on=` names.** Twenty-two of the twenty-nine appeared in a working
  sample somewhere on the page and none of them appeared in a list — which is enough while
  you are copying a sample and nothing at all the moment you build a control row no sample
  draws; `stop`, `volumeUp` and `volumeDown` were reachable only by reading the manifest. `Handlers you can name`
  is that list, split by which element the `on=` belongs on, because a name from one list
  does nothing on the other: a listener written on a button, or `click:togglePlay`
  written on the `<video>`, fails silently. It also says which two names never appear in an
  `on=` — `seekTo` and `seekBy` take a number, which an event listener has none of.

- **The arrows skip, where nothing else spends them.** The samples write `key="ArrowLeft"`
  and `key="ArrowRight"` on the skip buttons, so a player holding focus skips by its `skip`
  seconds — and a new guard is what makes an arrow honest to bind at all: a key a focused
  control spends on itself (a slider's arrows, Home, End and the Page keys; a radio group's
  walk) is never claimed off it, so a focused scrubber still nudges by one second and the
  volume slider keeps its arrows. The volume's own arrows move by five now instead of one —
  `step="5"` on the sample's input, which also quantises a drag to the same twenty notches,
  invisible at the slider's size.

- **`keys`, for the action with no button — and YouTube's volume arrows with it.** The
  samples bind `keys="ArrowUp:volumeUp;ArrowDown:volumeDown"` on the player, so a focused
  player answers all four arrows the way YouTube does: sideways skips, vertical volume. The
  attribute exists because `key` deliberately cannot reach this — `volumeUp` has no button
  to carry a key when the volume is a slider, which is the deferral the `NOTE:` above the
  class carried. It is the fallback, never the override: a control's `key` wins the same
  press, every guard protecting a focused control applies unchanged, and a pair naming no
  method warns instead of dying silent. CONTRIBUTING's refusal moves with it — a `keys`
  entry duplicating what a button could carry is still the undiscoverable version and still
  gets refused.

- **The README wears the gzip size, measured by a machine.** The hand-quoted number has
  been wrong twice now — the comparison table said 11.4 kB while the bundle on `main` was
  already 12.2 — so the badge row gains a shield that gzips `dist/media-player.min.mjs`
  straight off the branch and moves with every commit. The table's number is corrected and
  stays hand-measured, because its five players have to be measured one way; its
  measure-before-quoting warning stands.

### Changed

- **The sample players are Tab stops now.** They carried `tabindex="-1"`, which takes a
  click but no Tab — so the focus ring, and the keys that ride on focus, were reachable
  only by pointer, and the ring first showed when the element caught the focus the overlay
  drops as playback starts. The samples now write `tabindex="0"`, paired with
  `role="region"` and an `aria-label`, because a focusable element with no role reads out
  its entire contents to a screen reader. The theme's ring moved with it, from `:focus` to
  `:focus-visible` — Tab shows it, a click on the picture no longer flashes it, and the
  focus caught at playback start draws it only when the press was a keyboard's. In the
  element itself nothing changed — `tabindex` was always the author's to choose, and `-1`
  stays documented as the click-only variant.

### Fixed

- **The played bar missed the knob at both ends of a long file.** The played fill was a
  full-width `<progress>` behind the range input, but a thumb's centre travels from half a
  thumb in to half a thumb short of the far end — so the bar sat `thumb × (position − ½)`
  off the knob: a visible gap between fill and knob early in a twelve-minute file, a
  squared-off knob near its end. The played fill is now the slider's own, which
  slider-elemental places with that same thumb-centre arithmetic, and the element calls the
  slider's public `apply()` after every scripted write — a range input fires no event for
  one, which is why the `<progress>` was standing in to begin with. The markup changes with
  it: the scrubber's `<progress>` now carries only the buffered bar
  (`bind="buffered:prop#value;duration:prop#max"`, no more `buffer` attribute), inset half
  a thumb to sit on the thumb's travel, and the volume slider drops its
  `<progress-elemental>` entirely. The buffered bar gets its easing back too — it was
  turned off because one duration eased both bars and the played one was written per
  animation frame, and only the buffered bar is left.

- **The long-form demo played in Safari and errored in Chrome.** The ten minutes of Big Buck
  Bunny came from W3C's 2010 encode, and Chrome's decoder rejects that file mid-stream with
  `PIPELINE_ERROR_DECODE` — H.264 Main@3.0, so the codec is not the problem; the encode is,
  and Safari's decoder happens to tolerate it. Every stable host of a good Big Buck Bunny
  encode is gone — Google's sample bucket answers 403, Blender's own `peach/` directory 404s,
  and archive.org's copy 500s from its storage node — so the demo is now twelve minutes of
  _Tears of Steel_ from Blender's download server, verified playing in Chrome, WebKit and
  Firefox. Same shape as before: H.264 in a container with the index at the tail, so
  everything the page says about `preload="metadata"` and the late `moov` stays true, with
  the numbers re-measured for the new file. The poster is a frame from the film, committed
  as `sample/tears-of-steel.jpg` rather than hotlinked.

- **Playing from the overlay dropped focus, and the next <kbd>Space</kbd> scrolled the page.**
  The click-to-play overlay is a real button, so pressing it left focus on it — and that press
  is exactly what sets `poster-hidden`, whose stylesheet rule takes the overlay out with
  `display: none`. A browser drops focus from an element it has just stopped rendering, so
  focus landed on `<body>`, the player's own `keydown` listener never saw the next press, and
  <kbd>Space</kbd> did what Space does on a page with focus nowhere: it scrolled. It reads as
  keys that stopped working for no reason, one press after they worked. Focus now moves to the
  player as the overlay goes, which is the one thing this element does with focus, and the one
  case where moving it is correct rather than rude: it is not taking focus, it is declining to
  lose it. It needs a `tabindex` on the player to land on — without one the element leaves
  focus alone rather than call a `focus()` that silently does nothing. The three places that
  hid the poster now go through one method, so none of them can forget.

- **The samples answer <kbd>Space</kbd>.** Everything the manual said about keys was
  a thing to read rather than press: no sample bound a `keydown`, no control carried a `key`,
  and no player was focusable, so a reader who tried it on this page got nothing and no way to
  tell a documented feature from a broken one. The audio and video samples now carry
  `keydown:onKeyDown`, `key=" "` on their play buttons and `tabindex="-1"` on the player — the
  focused scope, which reaches no further than the sample it is in. The page-wide form still
  appears only as markup to copy.

- **A focused player shows a ring.** `tabindex="-1"` on `<media-player>` is what makes a
  click leave focus inside it, and the keys answer from there — but nothing said so: `style.css`
  paints nothing and `theme.css` had a ring for every button and none for the player around
  them. `theme.css` draws one now, on `:focus` — deliberately not the `:focus-visible` the
  buttons use, because a `tabindex="-1"` player cannot be reached by Tab, so the pointer is
  nearly the only way focus arrives and `:focus-visible` is the heuristic that hides exactly
  that. The two rings say different things anyway: on a button, where you are; on the player,
  that the keys are live. It sits two pixels outside the box rather than inside it, because a
  video's overlay button covers the whole player with the poster under it, and both paint over
  a ring drawn inside. `media-player:focus { outline: none }` turns it off.

- **A claimed <kbd>Space</kbd> pressed the wrong control.** `key` matched whatever an author
  wrote in it, `key=" "` included, and a claimed press was taken off the page with
  `preventDefault` wherever it landed — including on a focused button, which then never
  activated, and on a focused checkbox, whose only key it is. Space and Enter now belong to a
  focused button, checkbox, link or `<summary>`, the way the arrows already belong to the
  sliders — activating it, or in the one case of Space over a link, scrolling the page, which
  is the browser's just as much. Every other key is unchanged, and a control that claims Space
  and holds focus is clicked by the platform instead, which is the same click by a shorter
  route. It is the
  split [YouTube documents](https://support.google.com/youtube/answer/7631406) — Space pauses
  when the player holds focus and activates the button when a button does. No sample binds
  either key, so nothing on the page behaves differently; this was waiting for the first
  author who wrote one. The manual gains the other half of it: where focus lands is yours to
  place, `tabindex="-1"` on the player is what makes a click leave focus inside it, and the
  element still never moves focus itself.

- **The published page's Options tabs were empty.** `custom-elements.json` was not among the
  files staged for GitHub Pages, so every sample's generated knobs had nothing to read —
  working locally, where the file sits beside `index.html`, and broken on the site. It is
  copied and asserted now, like the other three.

- **The volume slider sat a hair off the scrubber above it.** It carries the same
  `margin-right` the scrubber does, so the two right edges line up in the audio sample rather
  than missing each other by 7px.

- **The size numbers said 9.4 kB.** The comparison table's first row, and the paragraph under
  it, were quoting figures the build had outgrown: `dist/media-player.min.mjs` gzips to
  11.4 kB, and did at 0.1.1 too, so the number was already wrong when it shipped. The
  stylesheet line beneath it counted the elementals' three themes and not the four structure
  sheets under them, and called a bundle that carries four elementals three. Every sheet is
  named with its own figure now, each gzipped on its own the way a browser fetches it. The
  four columns beside this one are as they were — they were not re-measured.

- **The README never said the look was optional.** `media-player-theme.css` is named in the
  install paragraph now, so the sheet you can leave out is visible from the pitch and not
  only from the manual.

## [0.1.1] - 2026-08-18

### Changed

- **The package is `media-player-element` on npm.** The element is still `<media-player>` and
  nothing in a page changes; only the install line and the import specifier do. 0.1.0 was
  tagged but never reached the registry, so `media-player-element` is the first and only name
  anything was published under — there is nothing to migrate from.

## [0.1.0] - 2026-08-18

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
