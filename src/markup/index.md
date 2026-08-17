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

The sample below is not a picture of one. It is the page's only copy of that markup, rendered
in an isolated frame by [`<code-preview>`](https://github.com/stamat/code-preview-element) —
press **Edit** and what you type is what plays.

<!-- One line, and it has to be: markdown treats an unknown tag as a block only when its
     whole opening tag sits on a line of its own. Broken over four, the page prints it. -->
<code-preview css="css/prose.min.css" theme-attribute="data-theme" head="&lt;style&gt;body{margin:0;padding:1.5rem}&lt;/style&gt;&lt;script type='module' src='dist/media-player.min.mjs'&gt;&lt;/script&gt;">

```html
<media-player>
  <audio
    controls
    src="sample/tone.wav"
    preload="metadata"
    on="loadedmetadata:onLoaded;durationchange:onLoaded;canplay:onLoaded;
             play:onPlay;pause:onPause;waiting:onWaiting;playing:onPlaying;
             ended:onEnded;progress:onProgress;volumechange:onVolumeChange"
  ></audio>

  <toolbar-elemental
    class="media-player-controls"
    aria-label="Playback"
    bind="isReady:if"
  >
    <!-- First, and the stylesheet counts on it: the scrubber takes a whole flex line, so
         everything after it in this markup falls to the row below. Written here rather than
         moved with `order`, which would leave a keyboard user tabbing the row bottom-to-top
         while reading it top-to-bottom. -->
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

    <!-- Lucide, inline. The sample is the page's only copy of this markup, so the icons a
         reader sees above are the icons the sample carries — swap them for yours and the
         preview swaps with them. -->
    <button on="click:skipBackward" aria-label="Skip backward 10 seconds" disabled>
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
    </button>
    <button on="click:togglePlay" bind="playLabel:attr#aria-label" disabled>
      <span class="media-player-play-icon"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg></span>
      <span class="media-player-pause-icon"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect fill="currentColor" x="14" y="3" width="5" height="18" rx="1"/><rect fill="currentColor" x="5" y="3" width="5" height="18" rx="1"/></svg></span>
    </button>
    <button on="click:skipForward" aria-label="Skip forward 10 seconds" disabled>
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
    </button>

    <span class="media-player-time">
      <span bind="currentTime|time">00:00</span> /
      <span bind="duration|time">00:00</span>
    </span>

    <button on="click:toggleMute" bind="muteLabel:attr#aria-label" disabled>
      <span class="media-player-volume-icon media-player-volume-icon-mute"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg></span>
      <span class="media-player-volume-icon media-player-volume-icon-mid"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/></svg></span>
      <span class="media-player-volume-icon media-player-volume-icon-full"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/></svg></span>
    </button>

    <slider-elemental class="media-player-volume" tooltip="thumb">
      <progress-elemental>
        <progress value="100" max="100" bind="volumePercent:prop#value"></progress>
      </progress-elemental>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        aria-label="Volume"
        disabled
        bind="volumePercent:prop#value"
        on="input:setVolume"
      />
    </slider-elemental>
  </toolbar-elemental>
</media-player>
```

</code-preview>

```js
import 'media-player';
```

<!-- The `-hljs` build, not the small one: this page's fences are highlighted at build time
     and it ships no runtime highlighter, so without the bundled copy the code would keep the
     colour it was baked with and stop recolouring the moment a reader typed. -->
<script src="js/code-preview-hljs.min.js" defer></script>

Block the script and that markup is a plain `<audio controls>` — which is the point, and
worth trying with JavaScript off before taking the claim on trust. Not on this page, though:
the preview above is itself a custom element, so with scripting off there is nothing here but
the code block it was built from. Paste the sample into a file of your own and the claim is
one browser setting from proof.

That is the whole wiring model. `on` says what fires, `bind` says where state lands, and
both hold names — never code — so there is nothing to evaluate and nothing for a Content
Security Policy to object to. It sits on
[hydrargyri](https://github.com/stamat/hydrargyri) for the binding and
[book-of-elementals](https://github.com/stamat/book-of-elementals) for the sliders.

## Two rows, and what a phone changes

The scrubber is first in that markup on purpose. `style.css` gives it a whole flex line, so
the buttons and the clock wrap under it and the bar is two rows at every width — a phone and
a page-wide video get the same shape, and there is no breakpoint to tune. Squeezed into one
row instead, the fixed-width parts alone outgrow a 375px viewport and the scrubber is left
with about twenty pixels of something meant to be dragged.

Which is also why the scrubber is moved in the markup rather than with `order`. Reordering a
flex line visually leaves the tab sequence in the old order, and a keyboard user would read
the bar top-to-bottom while tabbing it bottom-to-top. Put it where you want it and both agree.

The row under it falls into two clusters — the transport with its clock at the start,
everything else at the end. What opens the gap is a single `margin-inline-start: auto` on
whatever follows the clock, so the arrangement stays yours: the clock and everything before
it goes left, everything after it goes right, and moving the clock moves the divide. A row
written without a clock matches that rule nowhere and comes out as one cluster at the start
— visibly wrong rather than quietly broken — and the fix is to put the same `auto` on
whichever control should open the right-hand group.

Two things change under a coarse pointer — a phone, a tablet — and both are opt-out by
overriding the rule:

| What                            | Sheet       | Why                                                                                 |
| ------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| The volume slider is hidden      | `style.css` | 72px is not draggable by thumb, and the device has hardware volume keys that are. The mute button stays, so muting still works |
| Buttons grow to 44px            | `theme.css` | The glyph and its padding make a 32px box — fine for a mouse, under [WCAG 2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) for a finger. Only the box grows; the icon keeps its size |

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

<!-- One line, and it has to be: markdown treats an unknown tag as a block only when its
     whole opening tag sits on a line of its own. Broken over four, the page prints it. -->
<code-preview css="css/prose.min.css" theme-attribute="data-theme" head="&lt;style&gt;body{margin:0;padding:1.5rem}&lt;/style&gt;&lt;script type='module' src='dist/media-player.min.mjs'&gt;&lt;/script&gt;">

```html
<media-player
  on="mousemove:showControls;fullscreenchange@document:onFullscreenChange"
>
  <video
    controls
    playsinline
    preload="metadata"
    src="sample/rollout.mp4"
    poster="sample/rollout.jpg"
    on="loadedmetadata:onLoaded;durationchange:onLoaded;canplay:onLoaded;
        play:onPlay;pause:onPause;waiting:onWaiting;playing:onPlaying;
        ended:onEnded;progress:onProgress;volumechange:onVolumeChange"
  >
    <track
      kind="captions"
      src="sample/rollout.en.vtt"
      srclang="en"
      label="English"
      on="cuechange:onCue"
    />
  </video>

  <!-- Both go when playback starts: the element sets `poster-hidden` and the stylesheet
       takes them off. The overlay leaves entirely rather than fading, so an invisible
       button is never sitting over the controls swallowing their clicks. -->
  <img class="media-player-poster" src="sample/rollout.jpg" alt="" />
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
    <!-- Every control the audio player has, carried over whole — none of them knows which
         element it wrapped, and a video needs its sound turned down as much as a podcast
         does. Captions and fullscreen are the only two this row adds. The scrubber leads
         here for the same reason it does there: it takes a whole flex line, so the buttons
         fall to the row beneath it. -->
    <slider-elemental
      class="media-player-scrubber"
      tooltip="thumb track"
      bind="timeFormatter:prop#format"
    >
      <progress-elemental bind="buffered:attr#buffer">
        <progress
          value="0"
          max="1"
          bind="currentTime:prop#value|floor;duration:prop#max|floor"
        ></progress>
      </progress-elemental>
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

    <!-- Lucide, inline. The sample is the page's only copy of this markup, so the icons a
         reader sees above are the icons the sample carries — swap them for yours and the
         preview swaps with them. -->
    <button on="click:skipBackward" aria-label="Skip backward 10 seconds" disabled>
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
    </button>
    <button on="click:togglePlay" bind="playLabel:attr#aria-label" disabled>
      <span class="media-player-play-icon"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg></span>
      <span class="media-player-pause-icon"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect fill="currentColor" x="14" y="3" width="5" height="18" rx="1"/><rect fill="currentColor" x="5" y="3" width="5" height="18" rx="1"/></svg></span>
    </button>
    <button on="click:skipForward" aria-label="Skip forward 10 seconds" disabled>
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
    </button>

    <span class="media-player-time">
      <span bind="currentTime|time">00:00</span> /
      <span bind="duration|time">00:00</span>
    </span>

    <button on="click:toggleMute" bind="muteLabel:attr#aria-label" disabled>
      <span class="media-player-volume-icon media-player-volume-icon-mute"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg></span>
      <span class="media-player-volume-icon media-player-volume-icon-mid"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/></svg></span>
      <span class="media-player-volume-icon media-player-volume-icon-full"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/></svg></span>
    </button>

    <slider-elemental class="media-player-volume" tooltip="thumb">
      <progress-elemental>
        <progress value="100" max="100" bind="volumePercent:prop#value"></progress>
      </progress-elemental>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        aria-label="Volume"
        disabled
        bind="volumePercent:prop#value"
        on="input:setVolume"
      />
    </slider-elemental>

    <!-- The two a video adds. The label stays put and `aria-pressed` carries the state —
         which is also the hook the theme keeps the hover flood on. `|pressed` turns the
         bind's boolean into ARIA's "true"/"false". -->
    <button
      on="click:toggleCaptions"
      aria-label="Captions"
      bind="captionsVisible:attr#aria-pressed|pressed"
      disabled
    >
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="14" x="3" y="5" rx="2" ry="2"/><path d="M7 15h4M15 15h2M7 11h2M13 11h4"/></svg>
    </button>
    <button
      on="click:toggleFullscreen"
      aria-label="Fullscreen"
      bind="isFullscreen:attr#aria-pressed|pressed"
      disabled
    >
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
    </button>
  </toolbar-elemental>
</media-player>
```

</code-preview>

Which runs here too, over twelve seconds of NASA's Artemis II rollout.

Video and captions are NASA's, [public domain](https://www.nasa.gov/nasa-brand-center/images-and-media/):
the [Artemis II rollout](https://images.nasa.gov/details/KSC-20260117-MH-DNS01-0001-Artemis_II_Rollout_Timelapse_LC_39_Press_Site-M18870)
to Launch Complex 39B on 17 January 2026. The clip is silent — it carries an audio track, but
every sample in it is zero — which is why the mute button and the volume slider are not on
this row; the audio player above is where they are worth trying. Its one caption cue reads
`[Ambient sounds]`, which belongs to a longer cut of the same footage and is left as NASA
wrote it: enough to prove the CC wiring, no more. The controls fade out while it plays and
come back on the next mouse move — that is `mousemove:showControls`, below.

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
| `no-fullscreen`                                    | fullscreen has no door to open — an iframe without `allow="fullscreen"` is the common way; hide your fullscreen button on it |
| `has-captions`, `captions-visible`                 | a `<track>` was found; captions are on                            |
| `volume-state`                                     | `mute`, `mid` or `full`, for a three-icon volume button           |

Two you do set: `skip` is how many seconds a skip button moves (default `10`), and
`storage-key` is the prefix for the remembered volume, mute and captions state — set it per
player, or two players on one page will share one volume. Four more, for what the lock
screen shows, are in the next section.

## On the lock screen

Start playing and the player claims the operating system's media panel — the lock screen,
the hardware media keys, the button on a pair of headphones. Play and pause are there with
or without this element; every browser draws them for any media that plays. What the player
adds is the rest: skip buttons that move by the same `skip` seconds the buttons on your page
use, a scrubber that goes where you drop it, and a name for what is playing.

The name comes out of markup you have probably already written. A `title` on the `<audio>`
or `<video>` is what the panel calls the track, and a `<video poster>` is the artwork.
Nothing is invented — with neither, the panel keeps its own default rather than showing
`tone.wav` on your lock screen. Four attributes on `<media-player>` cover what that markup
cannot say:

| Attribute      | Holds                                                            |
| -------------- | ---------------------------------------------------------------- |
| `media-title`  | what the panel calls it; wins over the media element's `title`   |
| `artist`       | who made it                                                      |
| `album`        | what it came from                                                |
| `artwork`      | cover image; wins over `poster`, and a relative path is resolved against the page |

```html
<media-player media-title="Rollout" artist="Stamat" artwork="sample/cover.jpg">
  <audio controls src="sample/tone.wav"></audio>
</media-player>
```

The panel is one per document, so on a page with two players it follows whichever started
last. A live stream gets no seek buttons, because there is nowhere on it to seek to.

## What the theme takes

`theme.css` speaks the register Plyr made the standard: a flat compact bar, controls that
flood with the accent under the pointer, a slim rounded track carrying an accent thumb,
video controls on a bottom gradient with a centred play chip. Where Plyr hardcodes white
and slate, this sheet uses `Canvas` and `CanvasText`, so the same look follows the page
into dark mode and forced colours. What it takes from you are custom properties — the
first four live in the theme, the last two in the structure sheet:

| Property                 | Default      | Paints                                          |
| ------------------------ | ------------ | ----------------------------------------------- |
| `--media-player-accent`  | `#22c55e`    | the played fill, the hover that floods a button, a toggle held on, the thumbs, the overlay chip, the focus ring |
| `--media-player-accent-ink` | `#fff`    | what sits on the accent — the flooded button's glyph, the chip's triangle; change it with the accent |
| `--media-player-surface` | `Canvas`     | behind the control row, and the value bubble    |
| `--media-player-color`   | `CanvasText` | labels, and every neutral mixed from it — tracks, the buffered bar, disabled buttons; the video half swaps it to white and everything re-mixes |
| `--media-player-radius`  | `0.5rem`     | the control row's corners, and the video's      |
| `--media-player-gap`     | `0.5rem`     | between controls                                |
| `--media-player-fade`    | `0.2s`       | how long the video controls take to fade out    |

## State you can bind

| Key                                       | Holds                                                                                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `currentTime`, `duration`, `remaining`    | seconds; pipe them through `\|time` for `mm:ss`                                                                                     |
| `buffered`                                | how far ahead the browser has loaded, **in seconds** — same scale as `duration`, so it goes straight on the `<progress>`'s `buffer` |
| `volumePercent`                           | `0`–`100`, for a volume slider's `value` — and for the `<progress>` behind it, which is what redraws when a mute lands from script  |
| `playLabel`, `muteLabel`, `captionsLabel` | what the button should say it does next                                                                                             |
| `captionText`                             | the active cue                                                                                                                      |
| `timeFormatter`                           | the `formatTime` function itself — hand it to the scrubber's `prop#format` and the value bubble reads `01:12` instead of `72`       |

Beside `togglePlay`, `stop`, the skips and the sliders' handlers, two more answer `on=` for
a volume UI without a slider: `volumeUp` and `volumeDown`, one tenth of full per press.

Three formatters pipe a bind: `|time` writes seconds as a clock, `|floor` a whole number,
and `|pressed` a boolean as the literal `"true"`/`"false"` that a toggle's `aria-pressed`
wants — the captions and fullscreen buttons in the video sample are wired with it.

## Labels in another language

`playLabel`, `muteLabel` and `captionsLabel` speak English. To localize, skip the bind and
let the button name itself from its content — the attribute hooks already swap which half is
visible, and `display: none` takes the hidden half out of the accessible name with it:

```html
<button on="click:togglePlay" disabled>
  <span class="media-player-play-icon">
    <span aria-hidden="true">▶</span> <span class="visually-hidden">Pusti</span>
  </span>
  <span class="media-player-pause-icon">
    <span aria-hidden="true">⏸</span> <span class="visually-hidden">Pauziraj</span>
  </span>
</button>
```

`visually-hidden` is your utility class — every design system carries one. The same swap
hangs on `volume-state` for the mute button and `captions-visible` for the captions one:
two spans and one `display` rule of your own.

## Events

`media-player-ready` when the duration is known, and `media-player-interaction` for
everything a person did — `{ type, value }` in `detail`, where `type` is one of `play`,
`pause`, `stop`, `seek`, `skip-forward`, `skip-backward`, `volume`, `volume-up`,
`volume-down`, `mute`, `unmute`, `fullscreen`, `captions-on`, `captions-off`. Both bubble
from the element, not from `document`. A `fullscreen` event says which way in `value` —
`true` entering, `false` leaving — and a volume drag settles into one `volume` event, not
one per pixel.

## Against the alternatives

Drawn on this player's axes, which is the caveat to read it with: a row is here because this
project has an opinion about it, and the rows it has no answer for are the ones the others
win.

|                                    | media-player                                            | [Plyr](https://github.com/sampotts/plyr)             | [media-chrome](https://github.com/muxinc/media-chrome) | [Vidstack](https://vidstack.io)      | [Video.js](https://videojs.com)        |
| ---------------------------------- | ------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ | ------------------------------------ | -------------------------------------- |
| **Size, gzipped**                  | **9.4 kB**                                              | 32 kB                                                | 42 kB                                                  | 40 kB                                | 196 kB                                 |
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
except the stylesheets: its own are another 2 kB, and the elementals' about 2.5 kB more
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

Or from a CDN as a module, no install and no build step — the stylesheets come the same
way, from each package's `dist/`:

```html
<script type="module">
  import 'https://cdn.jsdelivr.net/npm/media-player/dist/media-player.min.mjs';
</script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/media-player/dist/media-player.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/book-of-elementals/dist/elementals/slider.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/book-of-elementals/dist/elementals/progress.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/book-of-elementals/dist/elementals/toolbar.min.css">
```

## What editors read

The package ships a
[custom elements manifest](https://github.com/webcomponents/custom-elements-manifest) as
`custom-elements.json`, named by the `customElements` field in `package.json` and generated
from the element's source on every build. It carries what this page carries — the
attributes, the two events, the seven custom properties — and marks everything the samples
do not name as private, so an editor offering completions offers `togglePlay` and not
`endDrag`.

What any given editor does with it is its own business, and none of it is required to use
the element: the manifest is a description, not a runtime.

## License

[MIT](https://github.com/stamat/media-player/blob/main/LICENSE) © [Stamat](https://github.com/stamat).
The icons in the samples are [Lucide](https://lucide.dev), ISC.
