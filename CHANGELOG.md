# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**How to use it:** land changes under `## [Unreleased]`, grouped under _Added_, _Changed_,
_Deprecated_, _Removed_, _Fixed_ or _Security_. Write entries for the person upgrading, not
for the person who wrote the code.

## [Unreleased]

### Added

- **The control row folds its last four controls behind one button where it runs out of
  width — and unfolding them takes the line rather than adding one.** Speed, captions,
  picture-in-picture and the device button sit in a `<disclosure-elemental
  open-when="(min-width: 30rem)">` in the samples: above the query the region is held open
  and `style.css` reads the `data-mode="pinned"` it reflects to take the button away and
  give the region `display: contents`, so a wide row is exactly the row it was, in the
  markup's order. Below it the button owns the region, and opening it swaps the line under
  the scrubber instead of growing the bar: the transport, the clock and the mute step out,
  the four unfurl into their space the way a search field expands, and the caret slides
  along with them — turned around while open, which with the disclosure's own
  `aria-expanded` is the whole of the state: the button keeps the `aria-label` you wrote,
  named to its tooltip by `for` because the disclosure wants its button as a direct child
  and a wrapper would take that from it. Whatever control the row ends
  with — fullscreen in the samples — keeps its corner in both states, and the scrubber
  never leaves. On a video, the fade that takes the row folds an open fold with it — unless
  focus is inside it, which closing would drop on nothing — so the reveal after is the
  compact row, not four unfolded controls over a transport that stepped out for them. The
  region also carries 4px of ring room, padding handed back as negative margin: its
  `overflow: hidden` bounds the unfurl, and without the allowance it cut the focus rings
  inside the fold on all four sides — a keyboard could land on the speed `<select>` with
  nothing on screen saying so. The samples write the breakpoint as
  `open-when="container:(min-width: 30rem)"` — the disclosure's `container:` notation, so
  the fold arranges by the player's width the way the volume drop and the clock swap do,
  and a 400px player embedded in a desktop page folds like the phone it is as wide as; it
  needs a book-of-elementals with `container:` support, and against an older one the fold
  stays with its button at every width. A menu floating over the picture was the version
  that did not survive: inside the player's own `overflow: hidden` it clips on any ratio
  shorter than 16:9, which the manual's own 2.4:1 player is. A fold worth one control is
  not folded at all:
  the button would take the slot that control gave up and charge a tap for it, so the
  element counts the region on connect and rewrites `open-when` to `all` where it holds one
  or none, which pins it at every width. The count is the markup's — a control you hide at
  some width, or on `no-airplay`, is still one of the fold's — and the attribute goes back
  as you wrote it if the player leaves the page.

  **Markup:** new, and yours to copy — nothing folds unless you write it. **CSS:**
  `.media-player-more` and `.media-player-more-region` are the hooks, `data-mode` and
  `[open]` the states. **DOM:** the module imports book-of-elementals' disclosure and the
  structure bundle carries its sheet, 0.4 kB gzipped measured on its own; the arrows
  skip a folded control, and `container:` is the disclosure's own ruler — both
  book-of-elementals **3.2.1**, now the floor: 3.2.0 introduced the ruler, 3.2.1 ships the
  file it lives in to source importers. Folding the
  AirPlay button is what pins the row's width: a control that appears by network weather no
  longer decides whether the row wraps.

- **The clock counts down where there is room for only one number.** Below 21.25rem of
  player width the `current / duration` pair hands the line to a single remaining-time
  figure, ending on zero when the track does — `remaining` is ceiled whole seconds now, the
  countdown convention, since floored it read 00:00 for the last fraction of a second with
  audio still playing; it was always there to bind, and new is
  the pair of spans the swap needs. **Markup:** the clock in the samples is two spans now,
  `.media-player-elapsed` around the pair and `.media-player-remaining` for the countdown;
  copy the new clock if you took the old one. **CSS:** the swap lives in `style.css`, keyed
  on the same container the volume drop reads.

- **A custom element that speaks the media API is the third thing the player wraps.**
  [`<video-background>`](https://github.com/stamat/video-background-element), or one of the
  [media-elements](https://github.com/muxinc/media-elements) family — `<youtube-video>`,
  `<vimeo-video>`, `<hls-video>` — each an `HTMLMediaElement`-shaped element over a
  third-party player, go inside the way a `<video>` does, marked `class="media-player-media"`
  because no tag name can say what an element answers to. Same wires, same properties, same bargain: `controls` off at upgrade and back on
  removal, which on those elements reloads their iframe with the platform's own chrome. One
  that upgrades after the player did is left alone until it has — `controls` written first
  would be an own property shadowing the accessor the definition brings, and the platform's
  chrome would load under yours with nothing warning. The structure sheet sizes such an
  element like a `<video>` — full width, `16 / 9` until you say otherwise. What the element
  does to itself is its own business:
  [`<video-background>`](https://github.com/stamat/video-background-element) lays itself over
  its parent as a background, and `unstyled fit-box` with `autoplay`, `loop` and `muted` all
  `"false"` is what talks it into being a player instead. That one answers for YouTube, Vimeo
  and a video file from a single tag, chosen by `src`, where media-elements ships an element
  and a script per platform. The manual leads with it and carries both recipes as **live,
  editable players** — a YouTube and a Vimeo under markup identical but for the link — plus
  the measured trade between the two routes. Those two frames are the first thing on that page
  to load a script it did not build, and the page says so where they sit: the embeds come from
  the privacy-preserving domains, the posters do not, and the way out is an
  `<img class="media-player-poster">` you host instead.

  **What stays out:** the elements themselves. Nothing here loads a platform script or knows
  a platform by name, so the page with the script blocked is now that element's promise to
  keep — a `<youtube-video>` is a blank box until its own module runs, the way a
  `<video src="stream.m3u8">` is in Chrome until hls.js runs. The embed itself gets no pointer
  input — `pointer-events: none` in the structure sheet, since a cross-origin iframe keeps
  every click — so a click on the picture lands on the player's box and pauses, as on a
  `<video>`. `is-video` reads off the name now — a custom
  element counts as video unless it ends in `-audio`.

- **Picture-in-picture, on a button you write.** `click:togglePictureInPicture` opens the
  floating window the browser keeps above everything else, and `is-pip` is the hook a
  stylesheet holds the button down with. The attribute follows the platform's own
  `enterpictureinpicture` and `leavepictureinpicture` rather than the press, so a window
  opened — or taken away — from the browser's own control, or by a second video claiming the
  one slot a document has, moves it too. `no-pip` says there is no window to open at all:
  an `<audio>`, an embed standing in for a `<video>`, a media element carrying
  `disablePictureInPicture`, or a browser without the API. A request the browser refuses
  warns the way a refused `play` does — no user gesture behind the call is the usual reason —
  rather than leaving a button that looks like it worked.

- **AirPlay and Chromecast, on a button you write.** `click:showAirplayPicker` opens the
  system device picker through the standard
  [Remote Playback API](https://w3c.github.io/remote-playback/) — one door onto an AirPlay
  receiver in Safari and a Chromecast in Chrome — and `is-airplay` is the hook a stylesheet
  holds the button down with. It follows the route rather than the press, so a device picked
  in the picker, dropped by the system, or claimed by another page moves it too, and
  `connecting` is not yet `connected`. Not a toggle, and the name says so: the picker is the
  way back to the device as well as the way out to it, so there is one direction to ask for
  and the platform owns the other. Unlike the window and the fullscreen, it is not the video
  half — the route carries an `<audio>` to a speaker the same way. The attributes and the
  handler keep the short name because that is what people search for; the sample's *label*
  says "Play on a device", because the same button lists Chromecasts.

  `no-airplay` is the hook for hiding it, and it starts **set** on every connect.
  `watchAvailability` hands back the current answer the moment the element registers for it,
  so a move in the DOM re-answers itself and there is no stale attribute to carry across one.
  Firefox has no Remote Playback API at all and the button stays hidden rather than sitting
  there dead. Two rejections are opposite answers and are treated as such:
  `disableRemotePlayback` on your media element takes the button away — the exact twin of the
  `disablePictureInPicture` `no-pip` already reads — while a user agent that cannot watch
  *continuously* keeps it, because its picker still opens on demand. A picker someone closes
  without choosing says nothing; every other refusal warns the way a refused `play` does.

  The manual writes the rule that hides the button once, off the handler name rather than a
  class you have to invent, and this page uses that same rule on its own samples.

  The cost is a row one control longer where the button shows. The video sample's six 32px
  buttons and its clock already come to the 306px a 360px phone leaves; a seventh is 40px
  more, so that phone with a device on the network wraps to a third line. The manual says so
  where it measures the row, and the fix is the one it already names — drop a control or move
  the clock.

- **Playback speed, as a `<select>` you write.** `change:setRate` takes the speed off the
  control's own `value` and `playbackRate` is the state to bind back to it. The rates are
  `<option>`s in your markup, not a list this element holds, which is the same bargain as the
  rest of the row: the dropdown, its keyboard handling and the picker a phone puts up are all
  the platform's, and nothing here re-implements them. `playbackRate` follows the *media
  element* rather than the control, so a rate changed anywhere else — the browser's own speed
  menu, a script, a second player — lands on the bound control instead of drifting from it.
  Anything that is not a positive, finite number is dropped: zero is `pause()` spelled so the
  button lies about it.

  `no-rate` is the hook for hiding the control where there is nothing to set. An embed that
  stands in for a `<video>` has no `playbackRate`, so the write lands as an own property,
  changes nothing, and reads the new number back — a speed control that reports a lie is worse
  than one that is not there.

  The optional theme dresses it as one more button on the row. `appearance: none` takes the
  platform's chrome off, so the control follows `--media-player-color` like everything beside
  it rather than landing as a bevelled grey box on the video bar's gradient, and it floods
  with the accent under the pointer the way the buttons do, sized to the rate showing rather
  than to the longest one in the list — `field-sizing: content`, Baseline since June 2026,
  and a browser without it gets the roomier box it would have had anyway. No arrow is drawn back in:
  `currentColor` reaches neither a `background-image` nor a pseudo-element, which a `<select>`
  does not render anyway — so the value is the whole label. The dropdown itself is painted
  `Canvas` on `CanvasText`, because the platform's window takes its ink from the control and
  white on nothing is an invisible list over a video. The structure sheet ships none of this:
  without the theme you get the browser's own select, which is what the split promises.

- **The captions button is a CC badge now, outlined off and solid on.** The Lucide `captions`
  glyph said *captions* by drawing a box with dashes in it; the state was carried entirely by
  the accent flood the theme puts behind a pressed toggle. That is nothing at all on a page
  that took the theme's colours off, and nothing in a forced-colours mode. Two badges swapped
  off `captions-visible` — the same trick the play/pause button already used — say it in
  shape instead. **If your stylesheet targeted the old single `<svg>` inside that button, it
  now finds `.media-player-captions-icon-off` and `.media-player-captions-icon-on` around
  two.** The letters are knocked out of the solid badge with `fill-rule="evenodd"` rather
  than painted in a second colour, so whatever is behind the button shows through them and no
  accent override can leave them invisible.

- **`pause-offscreen` stops playback once the player has scrolled out of view.** Off unless
  you write it, and the default is the whole argument: the opposite one would have this
  element decide that a podcast stops when the page scrolls past its controls, which is the
  one thing an audio player is most often left running for. On a video it is usually what you
  want — a listener who scrolls away gets silence rather than a soundtrack over the next
  section.

  It pauses and does nothing else. What scrolls back into view is a paused player with its
  controls up, because starting again would need the element to tell a scroll-pause from your
  own press, and that is state to keep in step for a behaviour nobody can ask for separately.
  The observer is built and torn down as the attribute is written and removed, so toggling it
  at runtime works rather than silently doing nothing; a browser with no
  `IntersectionObserver` gets no gate at all, which is the behaviour of leaving it off.

  **Not to be confused with the attribute of the same name on
  [`<video-background>`](https://github.com/stamat/video-background-element), which defaults
  to `true`.** Same name, opposite default, and both are right: a background is decoration
  that should yield the moment it is out of sight, and a player is something a listener
  started on purpose. The samples on the manual page write `pause-offscreen="false"` on the
  embed for exactly that reason.

### Changed

- **The prose in the manual, the README and CONTRIBUTING.md is shorter.** Every fact, table,
  measurement and markup sample is unchanged; what went is the essayistic register around
  them — metaphors, restated points and asides. Four headings are renamed to say what their
  section covers: "The part that matters most" is now "Playing with the script blocked",
  "Two rows, and what a phone changes" is "Two rows, and narrow screens", "Twelve minutes,
  from someone else's server" is "A twelve-minute file, and what preload costs", and "A
  background loop, and the one button it owes you" is "Background video, and the pause button
  it needs". None of the four was linked to; every anchor on the page still resolves.

- **The speed control carries a tooltip.** Closed, the `<select>` reads `1×` and nothing
  else — a value with no name on it, next to a row of buttons that each explain themselves on
  hover. **Markup:** the samples wrap it in `<tooltip-elemental>` with a `<span>Speed</span>`,
  the same shape the buttons use; copy it if you want it, nothing here writes it for you.
  **Layout:** unchanged — `<tooltip-elemental>` is `display: contents`, so the chip is still
  the flex item it was and the row's measured widths hold. The
  `aria-label` stays on the `<select>`, so the bubble is a description rather than the name.

- **The speed control's value is semibold**, to carry its label's weight beside a row of
  icons.

- **The volume slider also goes when the row is too narrow for it, not only where the pointer
  is coarse.** A container query on the control row rather than a breakpoint, because the width
  that decides is the player's own: a 400px player in a wide page crowds exactly the way a phone
  does, and a window's width knows nothing about either. Measured on the video sample with the
  theme loaded — the buttons wrapped to a third line at 505px of player width with the slider in
  the row and at 425px without it, so the row now holds two lines down to about 425px instead of
  505px. **CSS:** `.media-player-controls` gains `container-type: inline-size`, safe there for
  the reason it is on the scrubber — the row's width never came from its contents — and
  `container-type` rather than `contain: layout`, which would make the row the containing block
  for the `position: fixed` tooltip bubbles inside it. The mute button stays at every width.

- **`theme.css` draws the knobs only where the pointer is** — the scrubber's and the
  volume's both, because two bars in one row with a knob on only one of them reads as the
  other being broken. A bar nobody is aiming at is a position line; the knob is what says the
  thing can be dragged, and it now says it where you already are. Only the thumb's colour
  changes, so the track, the played fill and the buffered bar — all three inset by half a
  thumb — stay exactly where they were and nothing shifts as one appears. Keyboard focus
  counts as aiming at it, and so does a drag still holding the button after the pointer has
  slid off the track. Two exemptions: a touch device, which has no hover to bring a knob
  back, and forced colours, where the mode's own thumb colour is the one thing making the
  control findable. `--slider-elemental-thumb: var(--slider-elemental-fill)` on
  `media-player slider-elemental` puts the old behaviour back in one declaration.

- **book-of-elementals moved to 3.x, from the `^2.0.1` of 2.0.0.** The 3.0 break drops a
  deprecated attribute from the disclosure, menu and navbar and redraws the splitter's seam,
  none of which this package loads. The custom properties, the element names and the SCSS
  entry points are the same ones, so nothing on the page changes shape.

### Fixed

- **The fold's unfurl actually plays.** The 0.2s width animation rode `@starting-style`,
  which only applies to a box returning from unrendered — and in every current stable
  browser `hidden="until-found"` keeps the closed region's box rendered, so the fold
  snapped open everywhere and the animation had only ever played in the browsers between
  `@starting-style` shipping and `until-found` shipping. The closed width now sits at
  `max-width: 0` on the rendered box and the reveal is a plain transition;
  `@starting-style` stays for the browsers on the `display: none` fallback. **CSS output:**
  one added rule on `.media-player-more-region[data-mode="free"][hidden]`.

- **Find-in-page can reach the fold again: `hidden="until-found"` is no longer flattened to
  `display: none`.** The structure sheet's `media-player [hidden] { display: none
  !important }` — there so hydrargyri's `if`/`unless` binds out-hide any author `display` —
  also caught the disclosure's closed region, whose `until-found` value exists precisely so
  find-in-page and fragment links still reach what is inside; `display: none` made the
  region unsearchable and the disclosure's `beforematch` reveal dead code. The plain-hidden
  rule now excludes `until-found`, which instead gets the UA's own `content-visibility:
  hidden` restated with weight — hiding it just as firmly in browsers that know
  `content-visibility` but not `until-found` (Safari 18–26.1, Firefox ESR 128), where the
  attribute reads as plain hidden and the region's own `display` would have leaked it into
  the row — plus `position: absolute`, because the kept box is a flex item that would
  otherwise charge one `gap` beside the caret. Browsers with neither (Safari 17) fall back
  to `display: none`: closed and unfindable beats standing in the row. **CSS output:** the
  one `[hidden]` rule in `media-player.css` is three rules now.

- **The video controls fade out on a desktop too: one press of play no longer pins them up
  for the rest of the film.** The row was held by `.media-player-controls:focus-within`,
  which is there so a keyboard user tabbing to the mute button does not lose it from under
  the focus ring — but every browser except Safari focuses a button on a mouse click as
  well, so the click that started the video left focus in the row and the hide timer had
  nothing to hide. It reads `:has(:focus-visible, :active)` now, which is the platform's own
  line between a keyboard's focus and a mouse's: the ring still pins the row, a held thumb
  mid-drag still pins it, a click does not. **CSS output:** that one selector in
  `media-player.css`.

- **The caption drops to the picture's edge when the control row goes.** It sat 5.5rem up
  whether or not there was a bar beneath it to clear, so on a playing video — where the row
  fades out after five seconds — the subtitle floated in open frame. It rests 2rem off the
  bottom now and lifts the remaining 3.5rem for as long as the row is up, on the row's own
  fade duration so the two move as one. **CSS output / upgrading:**
  `.media-player-captions` carries `padding-bottom: 2rem` rather than `5.5rem`, and the
  clearance is a `translate` on `media-player[is-video][controls-shown]`; a sheet of yours
  that overrode the padding to clear a taller bar wants to override the lift instead.

- **The documented rule for hiding an unavailable control no longer hides the whole control
  row.** `:has([on*="showAirplayPicker"])` matches every ancestor holding that button, not just
  the `<tooltip-elemental>` around it — so wherever `no-airplay` is set, which is every reader
  with no receiver on the network, the row and the player went with it. The rule is
  `:has(> [on*="showAirplayPicker"])` now, in the manual and in this page's own stylesheet;
  copy it again if you took the old one.

- **The video controls come back on a touch, and reaching them no longer costs you the
  playback.** The row fades in on `mousemove`, which a touch device never sends, so five
  seconds into playback it was gone and the only way back was a tap on the picture — which
  paused the video to do it, that tap being the play toggle. **Markup:** the video samples wire
  `pointerdown:showControls` beside the mouse one — `pointerdown` and not `touchstart`,
  which would be a scroll-blocking listener the binding cannot mark `passive`; copy the new
  `on=` if you took the old one. **DOM:** where the pointer cannot hover, a click on the
  picture starts a stopped video, otherwise reveals the row and leaves playback alone — so
  the first tap reveals, even in markup that wires no reveal of its own, and the second
  presses what it revealed. Asked of `(hover: none)` at the click rather than of the user
  agent at upgrade, so a touchscreen laptop keeps the toggle it can drive. **CSS:** the
  faded row also takes `pointer-events: none` — opacity alone left an invisible row fully
  tappable, and the reveal tap could seek, mute or fullscreen blind on whatever sat under
  the finger; `visibility` would have done it by locking keyboard users out of the
  `:focus-visible` pin that holds the row up.

- **The captions badge is the size of the buttons beside it.** Both states carried a viewBox
  cropped to the glyph, `1 3 22 18`, on the theory that a wide short icon in a square box is
  scaled by its height — `meet` scales by whichever axis fits worse, which in a 22-wide box is
  the width, so the crop shrank the badge by 8% rather than enlarging it. The two states did
  not match each other either: the outline was drawn 20 by 16 units and the solid one 18 by
  14, against 22 by 20 for the AirPlay icon and 22 by 18 for picture-in-picture. **Markup:**
  both badges are `0 0 24 24` now and both fill `0..24` by `3..21` — the full width of the
  viewBox at picture-in-picture's height — the outline stroking to that edge and the solid
  filling to it; the letters grew with the badge, a fifth larger, and stay centred in it. Copy
  the new `<svg>` pair if you took the old one. Matching AirPlay's screen rectangle instead,
  which is the obvious reading of "the same size", is the version that looks wrong: AirPlay
  hangs a triangle below its screen and picture-in-picture an inset one, the badge hangs
  nothing, so at the screen's own size it reads as the smaller button. The volume icon keeps its cropped viewBox — a different glyph,
  and its own call to make.

- **The arrow keys reach the controls sitting past a hidden one.** `<toolbar-elemental>`
  walked every control in the row whether it was on screen or not, and `focus()` on a hidden
  button does nothing — so on every browser but Safari, where `no-airplay` takes the AirPlay
  button out of the row, a right arrow from picture-in-picture moved nothing and fullscreen
  was off the keyboard altogether, the bar's roving `tabindex` having already taken it out of
  Tab's reach. Fixed in book-of-elementals 3.1.1, inside the 3.2.1 floor this release asks
  for; nothing in this repository changed.

- **The scrubber's value bubble no longer gets a slice cut off it at either end of the
  track.** `<slider-elemental>` centres the bubble on the thumb and lets it hang off its own
  box, which is right for a slider in a page and wrong inside a video player: the player
  clips its box to keep the corners over the picture, so the last thumb-width of the track
  showed a chopped bubble — measured at 2px on `0:00` and 5px on `12:14`, growing with the
  label. **CSS:** `style.css` clamps it inside the track, off `--slider-elemental-at`, and
  `.media-player-scrubber` gains `container-type: inline-size`, which the clamp needs to
  weigh the bubble's own width against the track's length. Nothing measures and no script
  runs; the middle of the track is untouched, and a track narrower than the bubble parks it
  at the start. The clamp lives here rather than in book-of-elementals because a bubble
  hanging off a slider is only wrong where something clips it.

- **A custom media element that fires `play` before its own `paused` flips no longer freezes
  the clock.** The animation frame that paints the position bails on a paused element and
  does not schedule the frame that would try again, and `play` was the only way into that
  loop — so an element announcing playback a beat ahead of its own state left the clock on
  `00:00` and the thumb at the start for the whole track, with the picture playing above it
  and every other reading correct. A `<video>` cannot do this; the platform settles `paused`
  before it fires. A wrapper around someone else's player can and does — `<video-background>`
  on a Vimeo link is where this was found. `playing`, which means playback actually began, is
  a second way into the loop now; it cancels before it schedules, so the two entry points
  cannot leave two loops running.

## [2.0.0] - 2026-08-24

### Added

- **Two bundled stylesheets, so a page links two sheets instead of nine.**
  `media-player-element/bundle.css` is `style.css` with the four elemental structure sheets
  folded in, and `bundle-theme.css` is `theme.css` with theirs — the same CSS, compiled
  together, declaration for declaration. Nine files gzip to 6.0KB because each compresses
  alone; the two bundles gzip to 4.4KB, so the shorter block is the smaller download as
  well. Nothing is removed: every sheet is still published on its own, and the script was
  already one file with the elementals compiled into it.

  **Not for a project that already uses book-of-elementals.** The elemental CSS inside a
  bundle is frozen at the version this package was built against, and the file cannot tell
  you which — so linking one beside your own copy puts two versions of the same selectors on
  the page, with link order deciding and nothing reporting it. Take `style.scss` and
  `theme.scss` there and `@use` them next to the sheets you already have. Both bundles say so
  in a comment at the top for whoever meets the duplicate rules in devtools first.

  One more catch if you take `bundle.css` without the look: the split is by kind, not by what
  you can live without, so the tooltip's colours are in the theme bundle while its structure
  sheet only places the bubble. Set `--tooltip-elemental-surface` and
  `--tooltip-elemental-color` yourself, or there is unpainted text over the control row.

### Changed

- **book-of-elementals and hydrargyri are `peerDependencies` now, not `dependencies`.**
  Both register into globals a page has only one of — `customElements` for the elemental
  tags, and hydrargyri's own register of which tags are hydrargyri's — so a second copy is
  never harmless. The elemental case is quiet: registration is guarded, the second
  `slider-elemental` is dropped, and whichever script ran first owns the tag. The hydrargyri
  case is not quiet at all, because that register is how an element tells a node of its own
  from one belonging to a nested element; split across two copies, an outer element writes
  into a nested `<media-player>`'s `bind` nodes and overwrites its controls, with nothing but
  a confusing console warning to go on. As peers, an installer that cannot reconcile your
  version with this one says so at install time instead. **If you install with something that
  does not add peers for you, add both yourself** — and if you were on book-of-elementals 1.x,
  you now have to move to 2.x rather than silently getting a nested second copy.

- **book-of-elementals moved to 2.x.** It left 0.x and then 1.x while this element sat
  on `^1.0.0`, so the install block's `@0.11` patch pin — right while a 0.x minor could break
  — was withholding fixes rather than refusing breakage. The 2.0 break is a slider that turns
  down the page with `writing-mode`, which renamed arguments on functions this element does
  not call and added attributes to a bubble it does not style; the custom properties, the
  element names and the SCSS entry points are the same ones, so nothing on the page changes
  shape.

## [1.2.0] - 2026-08-21

### Changed

- **The accent is one step darker: `#16a34a`.** The old `#22c55e` held 2.3:1 against the
  white ink that floods onto a button under hover, focus and a held toggle, and against a
  light `Canvas` behind the focus ring — under the 3:1 that WCAG 1.4.11 asks of non-text
  states and focus indicators. The new green holds 3.3:1 on white and 6.4:1 on black, so
  glyph and ring clear the line on either scheme. Every accent use shifts with the token;
  set `--media-player-accent` yourself if you want the brighter green back.

### Added

- **`is-error` says the media gave up.** A 404, a refused codec or a decode failure used to
  be a black box: the upgrade takes the native controls off at connect, readiness never
  arrives to show the custom row, and nothing anywhere said why. The element now sets
  `is-error` — a CSS hook like its siblings — hands the native controls back so the
  browser's own error state has something to draw it, and warns in the console with the
  platform's message. All of it is undone the moment a later load succeeds.

### Fixed

- **The dead button-cluster rule is gone.** The theme's
  `.media-player-controls button + button` negative margin never matched the documented
  markup: every control-row button sits inside a `<tooltip-elemental>`, so no two buttons
  are ever siblings — `display: contents` changes layout, not selector matching. Every page
  always rendered the untightened spacing, so nothing shifts by removing it. If the
  skip-play-skip trio should read as one control after all, the selector that does it is
  `tooltip-elemental + tooltip-elemental > button`.

- **The page plays with the script blocked, theme or no theme.** The `:not(:defined)` rule
  hiding the custom controls until the element upgrades lived in `media-player-theme.css` —
  the sheet the install labels optional — so structure-without-theme served a blocked-script
  visitor a live flex row of dead buttons, a poster over the frame, and a full-bleed overlay
  button sitting on top of the native controls. The rule ships in `media-player.css` now,
  the sheet the player cannot run without. CSS output moves between files; the selectors are
  unchanged.

- **A sub-threshold level in the store cannot wedge the mute button.** `applyVolume` snaps
  a level under 0.1 to zero, but `restore` remembered the raw stored value — an entry
  another script wrote as `0.05` on the shared key muted the player and handed every unmute
  a level that clamped straight back to silence. The remembered level is clamped now, and a
  level that clamps to zero is not remembered at all; this element itself never stores one.
  No DOM or CSS output changes.

- **An author's `muted` outranks the shared store.** The default storage key is shared by
  every player on a site, so the level a visitor dragged on one page unmuted the background
  video another page deliberately ships `muted` — and an autoplaying loop is stopped by its
  browser the moment it makes sound. `restore` now leaves a `muted` attribute muted; give
  the player its own `storage-key` where a visitor's unmute should win instead. No new DOM
  or CSS hooks, but `volume-state` reads `mute` on load for such a player.

- **The CDN install carries the theme.** The copy-paste block loaded the structure sheets
  alone — and with the no-script guard living in the theme until this release, the copied
  install was precisely the arrangement that broke the blocked-script fallback. The block
  now lists the theme links the npm instructions always had, the tooltip theme the row
  cannot really go without included, optional comments and all. The URLs are pinned, too —
  `@1`, with the elementals at `@0.11` since a 0.x minor may break — where they used to
  resolve to latest, which would have walked the next major straight onto every page that
  copied the block.

- **A reconnect resumes only the element it went ready with.** A morph or a framework
  re-render can put the player back in the DOM with a fresh media element inside; the
  reconnect path resumed regardless, keeping the clock, the caption track and the volume of
  the element that was gone while the new one played at platform defaults — a slider
  reading muted over an element playing at full. A different element now re-initialises the
  way a first connect does; the same element resumes exactly as before. No new DOM or CSS
  hooks.

- **The manual says only true things about the element again.** The refusals list described
  `keys` — an attribute that shipped in 1.1.0 and is documented at length two sections up —
  as the feature this project declined to build; the bullet now names what is actually
  refused, the ready-made key map. The claim that nothing reads `prefers-reduced-motion` is
  scoped to the playback it was about — the theme has honoured the preference for its own
  transitions all along. Google's touch target is 48dp, not the 44px the sizing note lent
  it, and a twelve-second loop crosses WCAG 2.2.2's five seconds during its first play, not
  its second. The dark-mode claim names its condition now: `Canvas` follows `color-scheme`,
  not a class. And the `click:toggleCaptions` reference row speaks the same kind rule as the
  code — it still described the pre-1.1.x pick, any track but metadata — with the FAQ as the
  one place the rule is written out. `.media-player-buffering`, the box a spinner goes in,
  is in the hooks table at last, and the npm block says its bare-specifier `href`s want a
  bundler. Letter keys are named for what they are: `event.key` matches the character
  the layout produced, so a letter binding does not exist on a non-Latin layout — Space and
  the arrows, which the samples bind, are layout-free. And the caption box's `5.5rem`
  clearance says what it assumes — a two-row bar — and that a different bar overrides it on
  `.media-player-captions` in your own sheet.

- **A `<track>` appended after the upgrade renders its cues.** The cue listener rode
  `static wires`, which hydrargyri scans once at upgrade — a `<track>` a script appends
  later was found by `addtrack` and earned its button, and its cues never arrived,
  silently. The adopted `TextTrack` is listened to directly now, whatever stands behind
  it, which is also what keeps a track the button declined from reaching the caption box.
  No DOM or CSS output changes.

- **A mute survives a reload on its own.** Muting a volume nobody had dragged stores
  `muted` and no level — `rememberVolume` never writes a zero — and `restore` waited for a
  stored level before acting on either flag, so the one mute a fresh player could make was
  forgotten by the next visit. The flag is restored on its own now; unmuting after it
  returns to the level the element already had — a page may have set one before the
  upgrade — and to full only where there is truly nothing to return to. No new DOM or CSS
  hooks, but `volume-state` now reads `mute` at first paint for that returning visitor,
  where it read the unmuted state before.

- **`goLive` is public in the manifest again.** The 1.1.0 handler shipped marked private in
  `custom-elements.json`: the live recipe writes `on="click:goLive"` and the reference lists
  it, but the manifest's allow-list was never told — the silent privatisation the manifest
  test warns about and could not catch, because it walks the allow-list to the prototype and
  not the markup to the allow-list. A new test walks the other way — every name the manual's
  markup calls, through `on=`, `data-on=` or `keys=`, in either quoting, must be in the
  list, each attribute read with its own grammar — so the next forgotten handler fails the
  build instead of quietly dropping out of editors.

- **The Options panel offers `keys`.** The attribute fell through to the hidden marking
  meant for the CSS hooks, so the panel showed six knobs where seven attributes are the
  author's to write — and the manual said six in its intro while its own reference counted
  seven. The panel and the intro both say seven now, and the allow-list has the same markup
  walk the handlers got: every attribute a sample writes on a `<media-player>` tag must be
  in it, so the next authored attribute cannot vanish the way `keys` did.

- **A disabled control's key leaves the press with the page.** The press was claimed with
  `preventDefault` before the click a disabled control ignores, so a `key=" "` on a
  not-yet-ready play button stopped the page scrolling in exchange for nothing. Declined
  before the claim now — a disabled control still outranks a `keys` entry for the same
  press, and the press stays the page's. The decline asks the platform's own question:
  `:disabled`, so a control inside a `<fieldset disabled>` is declined even though its
  `disabled` property reads false, and `[disabled]` beside it, so a keyed link or custom
  element the author marked unpressable is declined rather than clicked anyway. On a video
  the declined press still brings a faded control row back — feedback the shorter path had
  silently dropped.

- **Only captions earn the captions button.** The markup path took any `<track>` but the
  metadata one, so a chapters or descriptions track ended up behind the captions button,
  its cues rendered as captions text — while the in-band path already filtered to captions
  and subtitles, and the two disagreed. Both speak one rule now: `captions`, `subtitles`,
  or a bare `<track>`, which the platform itself reads as subtitles. The cue wire asks the
  same rule — a declined track's cues no longer paint into the caption box, where they used
  to be unremovable precisely because the button had refused the track — and the rule reads
  `kind` the way the platform does, case-insensitively, so `kind="Captions"` keeps its
  button and its `default` standing. Two output changes: a
  different track can now sit behind the button, and a player whose only track is chapters
  or descriptions no longer writes `has-captions` at all — a stylesheet keyed on it loses
  the button there, by design.

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
