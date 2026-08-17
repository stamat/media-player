---
layout: poops-docs-theme/prose
title: Media Player
description: A media player you write in HTML — one custom element over the <audio> or <video> you already wrote.
---

# ▶ media-player

Every media player library starts by taking the player away from you. You hand over a
`<video>` and a config object, and what comes back is someone else's control bar — their
button order, their icons, their class names, their idea of where the time label goes.
Wanting a different arrangement means learning a `controls` array, or passing an HTML string
into a config option, which is templating in JavaScript wearing a smaller hat.

This one goes the other way. **You write the controls.** They are buttons and range inputs
in your page, styled by your stylesheet, in the order you put them. The element wires them
by name and never touches their arrangement.

It is a rewrite of the media player I built at GitHub in 2022 as a passion project — the one still
[playing on long forgotten github.com pages](https://github.com/readme/podcast/powering-public-goods),
it was written in Catalyst and TypeScript, before the React era.
Now it is given a new life as open source, dogfooding [hydrargyri](https://github.com/stamat/hydrargyri) and
[book-of-elementals](https://github.com/stamat/book-of-elementals).

```html
<media-player>
  <audio
    controls
    src="/episode.mp3"
    on="loadedmetadata:onLoaded;durationchange:onLoaded;canplay:onLoaded;
             play:onPlay;pause:onPause;waiting:onWaiting;playing:onPlaying;
             ended:onEnded;progress:onProgress;volumechange:onVolumeChange"
  ></audio>

  <toolbar-elemental
    class="media-player-controls"
    aria-label="Playback"
    bind="isReady:if"
  >
    <button on="click:togglePlay" bind="playLabel:attr#aria-label" disabled>
      <span class="media-player-play-icon">▶</span>
      <span class="media-player-pause-icon">⏸</span>
    </button>

    <span class="media-player-time" bind="currentTime|time">00:00</span>

    <slider-elemental
      class="media-player-scrubber"
      tooltip="thumb track"
      bind="timeFormatter:prop#format"
    >
      <!-- The played and buffered bars. A <progress> rather than the slider's own fill:
           an <input type="range">'s `value` does not reflect to an attribute, so writing
           it from script moves the thumb and nothing else. -->
      <progress-elemental bind="buffered:attr#buffer">
        <progress
          value="0"
          max="1"
          bind="currentTime:prop#value|floor;duration:prop#max|floor"
        ></progress>
      </progress-elemental>
      <!-- `|floor` on both nodes, which is the whole trick: a `step="1"` range snaps what it
           is assigned to the nearest step, so an unfloored 3.6 is a thumb at 4 beside a bar
           at 3.6. One floored number, and they step together.
           `pointerup@document` as well as `change`: a thumb picked up and put back where it
           started fires no `change`, and the clock would stay stopped over playing audio. -->
      <input
        type="range"
        min="0"
        step="1"
        value="0"
        aria-label="Seek"
        disabled
        bind="duration:attr#max|floor;currentTime:prop#value|floor"
        on="input:scrub;change:seek;pointerup@document:endScrub;keyup:endScrub"
      />
    </slider-elemental>

    <span class="media-player-time" bind="duration|time">00:00</span>
  </toolbar-elemental>
</media-player>
```

```js
import 'media-player';
```

Which runs, here, on this page:

<!-- A blank line inside a raw HTML block ends it, and markdown turns whatever is indented
     after it into a code sample. Keep this one contiguous. -->
<div class="sample">
<media-player storage-key="demo">
<audio controls src="sample/tone.wav" preload="metadata" on="loadedmetadata:onLoaded;durationchange:onLoaded;canplay:onLoaded;play:onPlay;pause:onPause;waiting:onWaiting;playing:onPlaying;ended:onEnded;progress:onProgress;volumechange:onVolumeChange"></audio>
<toolbar-elemental class="media-player-controls" aria-label="Playback" bind="isReady:if">
<button on="click:skipBackward" aria-label="Skip backward 10 seconds" disabled>↺</button>
<button on="click:togglePlay" bind="playLabel:attr#aria-label" disabled><span class="media-player-play-icon">▶</span><span class="media-player-pause-icon">⏸</span></button>
<button on="click:skipForward" aria-label="Skip forward 10 seconds" disabled>↻</button>
<span class="media-player-time" bind="currentTime|time">00:00</span>
<slider-elemental class="media-player-scrubber" tooltip="thumb track" bind="timeFormatter:prop#format"><progress-elemental bind="buffered:attr#buffer"><progress value="0" max="1" bind="currentTime:prop#value|floor;duration:prop#max|floor"></progress></progress-elemental><input type="range" min="0" step="1" value="0" aria-label="Seek" disabled bind="duration:attr#max|floor;currentTime:prop#value|floor" on="input:scrub;change:seek;pointerup@document:endScrub;keyup:endScrub"></slider-elemental>
<span class="media-player-time media-player-duration" bind="duration|time">00:00</span>
<button on="click:toggleMute" bind="muteLabel:attr#aria-label" disabled><span class="media-player-volume-icon media-player-volume-icon-mute">🔇</span><span class="media-player-volume-icon media-player-volume-icon-mid">🔉</span><span class="media-player-volume-icon media-player-volume-icon-full">🔊</span></button>
<slider-elemental class="media-player-volume"><progress-elemental><progress value="100" max="100" bind="volumePercent:prop#value"></progress></progress-elemental><input type="range" min="0" max="100" step="1" aria-label="Volume" disabled bind="volumePercent:prop#value" on="input:setVolume"></slider-elemental>
</toolbar-elemental>
</media-player>
</div>

<script type="module" src="dist/media-player.min.mjs"></script>

Block the script and that block is a plain `<audio controls>` — which is the point, and
worth trying with JavaScript off before taking the claim on trust.

That is the whole wiring model. `on` says what fires, `bind` says where state lands, and
both hold names — never code — so there is nothing to evaluate and nothing for a Content
Security Policy to object to. It sits on
[hydrargyri](https://github.com/stamat/hydrargyri) for the binding and
[book-of-elementals](https://github.com/stamat/book-of-elementals) for the sliders.

## The part that matters most

**Delete the `<script>` tag and the page still plays.** The `controls` attribute you wrote
is on the media element until the moment this element upgrades and takes over; a script that
404s, a CDN that is down, a browser that stopped at the first parse error — all of them leave
a working native player rather than a row of dead buttons.

That is not a nice-to-have here, it is the reason the markup looks the way it does. A
`<media-player src="…">` that built its own `<audio>` would be a player that does not exist
until JavaScript says so.

## One element, both media

There is no separate audio player and video player. `<media-player>` reads which element you
wrapped and turns on the video half — poster, click-to-play overlay, captions, fullscreen,
controls that fade out while playing — only when it wrapped a `<video>`.

```html
<media-player
  on="mousemove:showControls;fullscreenchange@document:onFullscreenChange"
>
  <video
    controls
    playsinline
    src="/talk.mp4"
    poster="/talk.jpg"
    on="loadedmetadata:onLoaded;play:onPlay;pause:onPause;progress:onProgress"
  >
    <track
      kind="captions"
      src="/talk.en.vtt"
      srclang="en"
      label="English"
      on="cuechange:onCue"
    />
  </video>

  <!-- Both go when playback starts: the element sets `poster-hidden` and the stylesheet
       takes them off. The overlay leaves entirely rather than fading, so an invisible
       button is never sitting over the controls swallowing their clicks. -->
  <img class="media-player-poster" src="/talk.jpg" alt="" />
  <button
    class="media-player-overlay"
    on="click:togglePlay"
    aria-label="Play"
  ></button>

  <div class="media-player-captions" bind="captionText:if">
    <span bind="captionText"></span>
  </div>

  <toolbar-elemental
    class="media-player-controls"
    aria-label="Playback"
    bind="isReady:if"
  >
    <!-- the same controls as above, plus: -->
    <button
      on="click:toggleCaptions"
      bind="captionsLabel:attr#aria-label"
      disabled
    >
      CC
    </button>
    <button on="click:toggleFullscreen" aria-label="Fullscreen" disabled>
      ⛶
    </button>
  </toolbar-elemental>
</media-player>
```

Which runs here too, over twelve seconds of NASA's Artemis II rollout:

<div class="sample">
<media-player storage-key="demo-video" on="mousemove:showControls;fullscreenchange@document:onFullscreenChange">
<video controls playsinline preload="metadata" src="sample/rollout.mp4" poster="sample/rollout.jpg" on="loadedmetadata:onLoaded;durationchange:onLoaded;canplay:onLoaded;play:onPlay;pause:onPause;waiting:onWaiting;playing:onPlaying;ended:onEnded;progress:onProgress;volumechange:onVolumeChange"><track kind="captions" src="sample/rollout.en.vtt" srclang="en" label="English" on="cuechange:onCue" /></video>
<img class="media-player-poster" src="sample/rollout.jpg" alt="" />
<button class="media-player-overlay" on="click:togglePlay" aria-label="Play"></button>
<div class="media-player-captions" bind="captionText:if"><span bind="captionText"></span></div>
<toolbar-elemental class="media-player-controls" aria-label="Playback" bind="isReady:if">
<button on="click:skipBackward" aria-label="Skip backward 10 seconds" disabled>↺</button>
<button on="click:togglePlay" bind="playLabel:attr#aria-label" disabled><span class="media-player-play-icon">▶</span><span class="media-player-pause-icon">⏸</span></button>
<button on="click:skipForward" aria-label="Skip forward 10 seconds" disabled>↻</button>
<span class="media-player-time" bind="currentTime|time">00:00</span>
<slider-elemental class="media-player-scrubber" tooltip="thumb track" bind="timeFormatter:prop#format"><progress-elemental bind="buffered:attr#buffer"><progress value="0" max="1" bind="currentTime:prop#value|floor;duration:prop#max|floor"></progress></progress-elemental><input type="range" min="0" step="1" value="0" aria-label="Seek" disabled bind="duration:attr#max|floor;currentTime:prop#value|floor" on="input:scrub;change:seek;pointerup@document:endScrub;keyup:endScrub"></slider-elemental>
<span class="media-player-time media-player-duration" bind="duration|time">00:00</span>
<button on="click:toggleMute" bind="muteLabel:attr#aria-label" disabled><span class="media-player-volume-icon media-player-volume-icon-mute">🔇</span><span class="media-player-volume-icon media-player-volume-icon-mid">🔉</span><span class="media-player-volume-icon media-player-volume-icon-full">🔊</span></button>
<slider-elemental class="media-player-volume"><progress-elemental><progress value="100" max="100" bind="volumePercent:prop#value"></progress></progress-elemental><input type="range" min="0" max="100" step="1" aria-label="Volume" disabled bind="volumePercent:prop#value" on="input:setVolume"></slider-elemental>
<button on="click:toggleCaptions" bind="captionsLabel:attr#aria-label" disabled>CC</button>
<button on="click:toggleFullscreen" aria-label="Fullscreen" disabled>⛶</button>
</toolbar-elemental>
</media-player>
</div>

Video and captions are NASA's, [public domain](https://www.nasa.gov/nasa-brand-center/images-and-media/):
the [Artemis II rollout](https://images.nasa.gov/details/KSC-20260117-MH-DNS01-0001-Artemis_II_Rollout_Timelapse_LC_39_Press_Site-M18870)
to Launch Complex 39B on 17 January 2026. The one caption cue reads `[Ambient sounds]`, so the CC
button proves the wiring rather than putting on a show. The controls fade out while it plays
and come back on the next mouse move — that is `mousemove:showControls`, below.

The two handlers on the `<media-player>` itself are the video half's housekeeping.
`mousemove:showControls` is what makes the control row behave the way a video player's does:
up while the pointer moves, gone five seconds after it stops, and always up while the video
is paused or something inside has focus. `fullscreenchange@document:onFullscreenChange`
keeps `is-fullscreen` honest when <kbd>Escape</kbd> leaves fullscreen without the button
being pressed.

Captions render into whatever binds `captionText`, with the track held `hidden` so the
browser's own caption box stays out of the way — which is what leaves your stylesheet in
charge of what captions look like.

## What it borrows

The player draws almost nothing itself. The parts that have an
[APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/) behind them are elementals, each
usable on its own and documented in its own right:

| Part               | Element                                                                                               | What it brings                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Scrubber, volume   | [`<slider-elemental>`](https://stamat.github.io/book-of-elementals/elementals/slider.html)            | a native `<input type="range">` and the whole APG Slider pattern — arrows, <kbd>Home</kbd>, <kbd>End</kbd>, touch, the value bubble |
| Buffered-ahead bar | [`<progress-elemental buffer>`](https://stamat.github.io/book-of-elementals/elementals/progress.html) | a native `<progress>` with a second value beside the first                                                                          |
| Control row        | [`<toolbar-elemental>`](https://stamat.github.io/book-of-elementals/elementals/toolbar.html)          | one tab stop, arrow keys between the buttons                                                                                        |

So there is no `role="slider"` and no `aria-valuenow` anywhere in this element. The platform
already says both, and saying them again is how they end up disagreeing.

## Attributes it writes

These land on the `<media-player>` element as CSS hooks. You do not set them — you style
against them.

| Attribute                                          | When                                                              |
| -------------------------------------------------- | ----------------------------------------------------------------- |
| `is-ready`                                         | metadata arrived; the duration is known and the controls are live |
| `is-playing`                                       | playing — the hook the play/pause icon swap hangs on              |
| `is-buffering`                                     | waiting on data                                                   |
| `is-live`                                          | the duration says endless stream, so there is nothing to seek     |
| `is-video`                                         | it wrapped a `<video>`                                            |
| `is-fullscreen`, `controls-shown`, `poster-hidden` | the video half                                                    |
| `has-captions`, `captions-visible`                 | a `<track>` was found; captions are on                            |
| `volume-state`                                     | `mute`, `mid` or `full`, for a three-icon volume button           |

Two you do set: `skip` is how many seconds a skip button moves (default `10`), and
`storage-key` is the prefix for the remembered volume, mute and captions state — set it per
player, or two players on one page will share one volume.

## State you can bind

| Key                                       | Holds                                                                                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `currentTime`, `duration`, `remaining`    | seconds; pipe them through `\|time` for `mm:ss`                                                                                     |
| `buffered`                                | how far ahead the browser has loaded, **in seconds** — same scale as `duration`, so it goes straight on the `<progress>`'s `buffer` |
| `volumePercent`                           | `0`–`100`, for a volume slider's `value` — and for the `<progress>` behind it, which is what redraws when a mute lands from script  |
| `playLabel`, `muteLabel`, `captionsLabel` | what the button should say it does next                                                                                             |
| `captionText`                             | the active cue                                                                                                                      |

## Events

`media-player-ready` when the duration is known, and `media-player-interaction` for
everything a person did — `{ type, value }` in `detail`, where `type` is one of `play`,
`pause`, `seek`, `skip-forward`, `skip-backward`, `volume`, `mute`, `unmute`, `fullscreen`,
`captions-on`, `captions-off`. Both bubble from the element, not from `document`.
A `fullscreen` event says which way in `value` — `true` entering, `false` leaving — and a
volume drag settles into one `volume` event, not one per pixel.

## Against the alternatives

Drawn on this player's axes, which is the caveat to read it with: a row is here because this
project has an opinion about it, and the rows it has no answer for are the ones the others
win.

|                                    | media-player                                            | [Plyr](https://github.com/sampotts/plyr)             | [media-chrome](https://github.com/muxinc/media-chrome) | [Vidstack](https://vidstack.io)      | [Video.js](https://videojs.com)        |
| ---------------------------------- | ------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ | ------------------------------------ | -------------------------------------- |
| **Size, gzipped**                  | **8.8 kB**                                              | 32 kB                                                | 42 kB                                                  | 40 kB                                | 196 kB                                 |
| **You write the controls**         | yes, as the only way                                    | no — a `controls` array, or an HTML string in config | yes, from its components                               | no — layouts                         | no                                     |
| **Shadow DOM**                     | never                                                   | never                                                | yes                                                    | yes                                  | no                                     |
| **Page plays with no script**      | yes                                                     | yes, if you keep `controls`                          | no — its starter `<video>` has none                    | no                                   | yes                                    |
| **Your CSS reaches every part**    | yes                                                     | yes                                                  | through `::part()` and the variables it chose          | partly                               | yes                                    |
| **Built from reusable primitives** | yes — the sliders ship separately                       | no                                                   | no                                                     | no                                   | no                                     |
| **YouTube, Vimeo, HLS, DASH**      | **no**                                                  | YouTube, Vimeo                                       | via a provider                                         | all of them                          | via plugins                            |
| **Ecosystem**                      | none                                                    | large                                                | Mux's                                                  | large                                | the largest                            |
| **Pick it when**                   | the markup is yours and must survive without the script | you want one line and a good default                 | you want composable parts and accept a shadow root     | you are building an app around media | you need every format and every plugin |

Sizes are each package's browser bundle, gzipped: Plyr and Video.js as published
(`dist/plyr.min.js`, `dist/video.min.js`), media-chrome bundled from its package entry with
esbuild, Vidstack from `cdn.vidstack.io/player`. This one is `dist/media-player.min.mjs`,
which carries hydrargyri and the three elementals inside it — everything the player needs
except the stylesheets: its own are another 1.4 kB, and the elementals' about 2.5 kB more
with their themes. Every one of those numbers moves with a release; measure before quoting.

Where this loses is the bottom of that table, and it loses there on purpose. **Plyr and
Vidstack are the right answer for YouTube and Vimeo**, and Video.js for the long tail of
formats and plugins. None of that is planned here.

## What it does not do

Each of these is a decision, not a gap waiting for a pull request.

- **Generate controls.** There is no control bar to configure, because configuring one is
  the problem this exists to avoid. The sample above is the starter — copy it and delete
  what you do not want.
- **Streaming formats.** HLS, DASH and the YouTube and Vimeo iframe APIs are all a
  third-party script driving an element you did not write, which is the opposite of the
  bargain here.
- **Its own keyboard map.** Every control is a `<button>` or an `<input type="range">`, so
  the platform already answers <kbd>Space</kbd>, <kbd>Enter</kbd>, the arrows,
  <kbd>Home</kbd> and <kbd>End</kbd> on whichever one has focus. A player-wide
  <kbd>k</kbd>/<kbd>j</kbd>/<kbd>l</kbd> map is a second, undiscoverable set of bindings.
- **Sanitize anything.** It writes text and attributes, never HTML.

## Install

```bash
npm install media-player
```

```js
import 'media-player';
```

The elementals ride along — importing `media-player` defines the slider, the progress bar
and the toolbar too. Their stylesheets do not: each elemental draws its own track, thumb or
bar, so its sheet loads beside this one.

```html
<link rel="stylesheet" href="media-player/style.css" />
<link rel="stylesheet" href="book-of-elementals/slider/style.css" />
<link rel="stylesheet" href="book-of-elementals/progress/style.css" />
<link rel="stylesheet" href="book-of-elementals/toolbar/style.css" />

<link
  rel="stylesheet"
  href="media-player/theme.css"
/><!-- the look; optional -->
<link
  rel="stylesheet"
  href="book-of-elementals/slider/theme.css"
/><!-- optional -->
<link
  rel="stylesheet"
  href="book-of-elementals/progress/theme.css"
/><!-- optional -->
```

Or from a CDN as a module, no install and no build step:

```html
<script type="module">
  import 'https://cdn.jsdelivr.net/npm/media-player/dist/media-player.min.mjs';
</script>
```

## License

[MIT](https://github.com/stamat/media-player/blob/main/LICENSE) © [Stamat](https://github.com/stamat)
