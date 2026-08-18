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
press **Edit** and what you type is what plays. The **Options** tab beside it is the same
`custom-elements.json` this package ships, turned into controls: the six attributes an author
writes and the seven custom properties the theme takes, each with what the manifest says its
type is. An attribute knob rewrites the markup above it, so the code tab stays the truth; a
custom property is not part of the sample, so it writes a rule into the frame and prints that
rule for you to copy. The twelve attributes the element writes for itself are left out — a
knob spliced into the markup would not survive the next `play`.

<!-- One line, and it has to be: markdown treats an unknown tag as a block only when its
     whole opening tag sits on a line of its own. Broken over four, the page prints it.
     The frame's own padding drops to nothing on a narrow screen. That keeps the sample
     honest rather than tidy: 1.5rem a side renders it 48px narrower than the page a reader
     would paste this markup onto, which is enough to wrap the video row to a third line on
     a phone and show a defect the markup does not have. -->
<code-preview manifest="custom-elements.json" css="css/prose.min.css" theme-attribute="data-theme" head="&lt;style&gt;body{margin:0;padding:1.5rem}@media(max-width:30rem){body{padding:0}}&lt;/style&gt;&lt;script type='module' src='dist/media-player.min.mjs'&gt;&lt;/script&gt;">

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
    <tooltip-elemental>
      <button
        on="click:skipBackward"
        aria-label="Skip backward 10 seconds"
        disabled
      >
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
      <span>Skip backward</span>
    </tooltip-elemental>
    <tooltip-elemental>
      <button on="click:togglePlay" bind="playLabel:attr#aria-label" disabled>
        <span class="media-player-play-icon"
          ><svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              fill="currentColor"
              d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"
            /></svg
        ></span>
        <span class="media-player-pause-icon"
          ><svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect
              fill="currentColor"
              x="14"
              y="3"
              width="5"
              height="18"
              rx="1"
            />
            <rect
              fill="currentColor"
              x="5"
              y="3"
              width="5"
              height="18"
              rx="1"
            /></svg
        ></span>
      </button>
      <span bind="playLabel">Play</span>
    </tooltip-elemental>
    <tooltip-elemental>
      <button
        on="click:skipForward"
        aria-label="Skip forward 10 seconds"
        disabled
      >
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      </button>
      <span>Skip forward</span>
    </tooltip-elemental>

    <span class="media-player-time">
      <span bind="currentTime|time">00:00</span> /
      <span bind="duration|time">00:00</span>
    </span>

    <tooltip-elemental>
      <button on="click:toggleMute" bind="muteLabel:attr#aria-label" disabled>
        <span class="media-player-volume-icon media-player-volume-icon-mute"
          ><svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              fill="currentColor"
              d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"
            />
            <line x1="22" x2="16" y1="9" y2="15" />
            <line x1="16" x2="22" y1="9" y2="15" /></svg
        ></span>
        <span class="media-player-volume-icon media-player-volume-icon-mid"
          ><svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              fill="currentColor"
              d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"
            />
            <path d="M16 9a5 5 0 0 1 0 6" /></svg
        ></span>
        <span class="media-player-volume-icon media-player-volume-icon-full"
          ><svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              fill="currentColor"
              d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"
            />
            <path d="M16 9a5 5 0 0 1 0 6" />
            <path d="M19.364 18.364a9 9 0 0 0 0-12.728" /></svg
        ></span>
      </button>
      <span bind="muteLabel">Mute</span>
    </tooltip-elemental>

    <slider-elemental class="media-player-volume" tooltip="thumb">
      <progress-elemental>
        <progress
          value="100"
          max="100"
          bind="volumePercent:prop#value"
        ></progress>
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
import "media-player-element";
```

<!-- The `-hljs` build, not the small one: this page's fences are highlighted at build time
     and it ships no runtime highlighter, so without the bundled copy the code would keep the
     colour it was baked with and stop recolouring the moment a reader typed. -->
<script src="js/code-preview-hljs.min.js" defer></script>

<!-- The options panel, a second bundle carrying no copy of the element. It is what turns the
     `manifest` on the previews above into controls; without it that attribute is inert and
     the samples render exactly as they did. -->
<script src="js/code-preview-options.min.js" defer></script>

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
the buttons and the clock wrap under it and the bar is two rows with no breakpoint to tune —
a phone and a page-wide video get the same shape. Squeezed into one row instead, the
fixed-width parts alone outgrow a 375px viewport and the scrubber is left with about twenty
pixels of something meant to be dragged.

Two is the floor rather than a promise. The line under the scrubber wraps again when what it
carries outgrows it, and the theme's buttons are 32px: the video sample's six of them and
the clock come to 306px, which is what a 360px phone leaves. Below that they wrap to a third
row, and the fix is to drop a control from the row or move the clock out of it.

Which is also why the scrubber is moved in the markup rather than with `order`. Reordering a
flex line visually leaves the tab sequence in the old order, and a keyboard user would read
the bar top-to-bottom while tabbing it bottom-to-top. Put it where you want it and both agree.

The row under it falls into two clusters — the transport with its clock at the start,
everything else at the end. What opens the gap is a single `margin-inline-end: auto` on the
clock, so the arrangement stays yours: the clock and everything before it goes left,
everything after it goes right, and moving the clock moves the divide. It sits on the clock
rather than on the control after it because a button wrapped in `<tooltip-elemental>` is not
the flex item any more — that element is `display: contents` — and a margin on the wrapper
would land on a box that does not exist. A row written without a clock matches that rule
nowhere and comes out as one cluster at the start — visibly wrong rather than quietly broken
— and the fix is to put the same `auto` on whichever control should close the left-hand
group.

One thing changes under a coarse pointer — a phone, a tablet — and it is opt-out by
overriding the rule:

| What                        | Sheet       | Why                                                                                                                            |
| --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| The volume slider is hidden | `style.css` | 72px is not draggable by thumb, and the device has hardware volume keys that are. The mute button stays, so muting still works |

The buttons do not grow for the finger, and that is a choice with a cost. `theme.css` draws
a 32px button on every pointer: past [WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
the AA minimum of 24px, and short of [2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html),
the AAA 44px that Apple and Google both ask for as well. 44px was tried and the row could
not afford it — six targets and the clock come to 343px where a 393px phone gives the bar
338px, so the fullscreen button wrapped to a third line and clawing it back cost the gap
between every button. If your row is short enough to pay for it, the AAA size is two
declarations:

```css
@media (pointer: coarse) {
  media-player .media-player-controls button {
    min-width: 2.75rem;
    min-height: 2.75rem;
  }
}
```

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
     whole opening tag sits on a line of its own. Broken over four, the page prints it.
     The frame's own padding drops to nothing on a narrow screen. That keeps the sample
     honest rather than tidy: 1.5rem a side renders it 48px narrower than the page a reader
     would paste this markup onto, which is enough to wrap the video row to a third line on
     a phone and show a defect the markup does not have. -->
<code-preview manifest="custom-elements.json" css="css/prose.min.css" theme-attribute="data-theme" head="&lt;style&gt;body{margin:0;padding:1.5rem}@media(max-width:30rem){body{padding:0}}&lt;/style&gt;&lt;script type='module' src='dist/media-player.min.mjs'&gt;&lt;/script&gt;">

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
    <tooltip-elemental>
      <button
        on="click:skipBackward"
        aria-label="Skip backward 10 seconds"
        disabled
      >
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
      <span>Skip backward</span>
    </tooltip-elemental>
    <tooltip-elemental>
      <button on="click:togglePlay" bind="playLabel:attr#aria-label" disabled>
        <span class="media-player-play-icon"
          ><svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              fill="currentColor"
              d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"
            /></svg
        ></span>
        <span class="media-player-pause-icon"
          ><svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect
              fill="currentColor"
              x="14"
              y="3"
              width="5"
              height="18"
              rx="1"
            />
            <rect
              fill="currentColor"
              x="5"
              y="3"
              width="5"
              height="18"
              rx="1"
            /></svg
        ></span>
      </button>
      <span bind="playLabel">Play</span>
    </tooltip-elemental>
    <tooltip-elemental>
      <button
        on="click:skipForward"
        aria-label="Skip forward 10 seconds"
        disabled
      >
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      </button>
      <span>Skip forward</span>
    </tooltip-elemental>

    <span class="media-player-time">
      <span bind="currentTime|time">00:00</span> /
      <span bind="duration|time">00:00</span>
    </span>

    <tooltip-elemental>
      <button on="click:toggleMute" bind="muteLabel:attr#aria-label" disabled>
        <span class="media-player-volume-icon media-player-volume-icon-mute"
          ><svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              fill="currentColor"
              d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"
            />
            <line x1="22" x2="16" y1="9" y2="15" />
            <line x1="16" x2="22" y1="9" y2="15" /></svg
        ></span>
        <span class="media-player-volume-icon media-player-volume-icon-mid"
          ><svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              fill="currentColor"
              d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"
            />
            <path d="M16 9a5 5 0 0 1 0 6" /></svg
        ></span>
        <span class="media-player-volume-icon media-player-volume-icon-full"
          ><svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              fill="currentColor"
              d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"
            />
            <path d="M16 9a5 5 0 0 1 0 6" />
            <path d="M19.364 18.364a9 9 0 0 0 0-12.728" /></svg
        ></span>
      </button>
      <span bind="muteLabel">Mute</span>
    </tooltip-elemental>

    <slider-elemental class="media-player-volume" tooltip="thumb">
      <progress-elemental>
        <progress
          value="100"
          max="100"
          bind="volumePercent:prop#value"
        ></progress>
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
    <tooltip-elemental>
      <button
        on="click:toggleCaptions"
        aria-label="Captions"
        bind="captionsVisible:attr#aria-pressed|pressed"
        disabled
      >
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect width="18" height="14" x="3" y="5" rx="2" ry="2" />
          <path d="M7 15h4M15 15h2M7 11h2M13 11h4" />
        </svg>
      </button>
      <span><span bind="captionsLabel">Enable captions</span></span>
    </tooltip-elemental>
    <tooltip-elemental>
      <button
        on="click:toggleFullscreen"
        aria-label="Fullscreen"
        bind="isFullscreen:attr#aria-pressed|pressed"
        disabled
      >
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M8 3H5a2 2 0 0 0-2 2v3" />
          <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
          <path d="M3 16v3a2 2 0 0 0 2 2h3" />
          <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
        </svg>
      </button>
      <span>Fullscreen</span>
    </tooltip-elemental>
  </toolbar-elemental>
</media-player>
```

</code-preview>

Which runs here too, over twelve seconds of NASA's Artemis II rollout.

Video and captions are NASA's, [public domain](https://www.nasa.gov/nasa-brand-center/images-and-media/):
the [Artemis II rollout](https://images.nasa.gov/details/KSC-20260117-MH-DNS01-0001-Artemis_II_Rollout_Timelapse_LC_39_Press_Site-M18870)
to Launch Complex 39B on 17 January 2026. The clip is silent — it carries an audio track, but
every sample in it is zero — so the mute button and the volume slider on this row have
nothing to act on here. They are in the sample anyway, because a video player's row is not
complete without them and this page is where the row gets copied from; the player further
down is where they do something. Its one caption cue reads
`[Ambient sounds]`, which belongs to a longer cut of the same footage and is left as NASA
wrote it: enough to prove the CC wiring, no more. The controls fade out while it plays and
come back on the next mouse move — that is `mousemove:showControls`, below.

The two handlers on the `<media-player>` itself are the video half's housekeeping.
`mousemove:showControls` is what makes the control row behave the way a video player's does:
up while the pointer moves, gone five seconds after it stops, and always up while the video
is paused or something inside has focus. `fullscreenchange@document:onFullscreenChange`
keeps `is-fullscreen` honest when <kbd>Escape</kbd> leaves fullscreen without the button
being pressed. A third would bind the keyboard — [Keys the buttons carry](#keys-the-buttons-carry),
below — which no sample on this page switches on.

Captions render into whatever binds `captionText`, with the track held `hidden` so the
browser's own caption box stays out of the way — which is what leaves your stylesheet in
charge of what captions look like.

## Ten minutes, from someone else's server

Twelve seconds proves the wiring and proves nothing about the seeking. A local file that
short never buffers, and a clock reading `00:00 / 00:12` never needs the minutes it can show.
So here is the same row over ten minutes of Big Buck Bunny, and this one is not in an editable
frame — it is the page's own DOM, upgraded by the one module tag sitting under it. Block that
tag and what is left is a plain `<video controls>`, which makes the claim this page opens with
testable right here rather than in a file you have to build yourself.

<!-- One line, and it has to be: the whole opening tag of an unknown element must sit on a
     line of its own or markdown prints it instead of rendering it. Same trap as code-preview
     above, and the reason this player's attributes are not broken up for readability. -->
<media-player media-title="Big Buck Bunny" artist="Blender Foundation" on="mousemove:showControls;fullscreenchange@document:onFullscreenChange">
  <video controls playsinline preload="metadata" src="https://media.w3.org/2010/05/bunny/movie.mp4" poster="https://media.w3.org/2010/05/bunny/poster.png" on="loadedmetadata:onLoaded;durationchange:onLoaded;canplay:onLoaded;play:onPlay;pause:onPause;waiting:onWaiting;playing:onPlaying;ended:onEnded;progress:onProgress;volumechange:onVolumeChange"></video>
  <img class="media-player-poster" src="https://media.w3.org/2010/05/bunny/poster.png" alt="" />
  <button class="media-player-overlay" on="click:togglePlay" aria-label="Play"></button>
  <toolbar-elemental class="media-player-controls" aria-label="Playback" bind="isReady:if">
    <slider-elemental class="media-player-scrubber" tooltip="thumb track" bind="timeFormatter:prop#format">
      <progress-elemental bind="buffered:attr#buffer"><progress value="0" max="1" bind="currentTime:prop#value|floor;duration:prop#max|floor"></progress></progress-elemental>
      <input type="range" min="0" step="1" value="0" aria-label="Seek" disabled bind="duration:attr#max|floor;currentTime:prop#value|floor" on="input:scrub;change:seek;pointerup@document:endScrub;keyup:endScrub" />
    </slider-elemental>
    <tooltip-elemental>
      <button on="click:skipBackward" aria-label="Skip backward 10 seconds" disabled><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></button>
      <span>Skip backward</span>
    </tooltip-elemental>
    <tooltip-elemental>
      <button on="click:togglePlay" bind="playLabel:attr#aria-label" disabled><span class="media-player-play-icon"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg></span><span class="media-player-pause-icon"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect fill="currentColor" x="14" y="3" width="5" height="18" rx="1"/><rect fill="currentColor" x="5" y="3" width="5" height="18" rx="1"/></svg></span></button>
      <span bind="playLabel">Play</span>
    </tooltip-elemental>
    <tooltip-elemental>
      <button on="click:skipForward" aria-label="Skip forward 10 seconds" disabled><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg></button>
      <span>Skip forward</span>
    </tooltip-elemental>
    <span class="media-player-time"><span bind="currentTime|time">00:00</span> / <span bind="duration|time">00:00</span></span>
    <tooltip-elemental>
      <button on="click:toggleMute" bind="muteLabel:attr#aria-label" disabled><span class="media-player-volume-icon media-player-volume-icon-mute"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg></span><span class="media-player-volume-icon media-player-volume-icon-mid"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/></svg></span><span class="media-player-volume-icon media-player-volume-icon-full"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/></svg></span></button>
      <span bind="muteLabel">Mute</span>
    </tooltip-elemental>
    <slider-elemental class="media-player-volume" tooltip="thumb"><progress-elemental><progress value="100" max="100" bind="volumePercent:prop#value"></progress></progress-elemental><input type="range" min="0" max="100" step="1" aria-label="Volume" disabled bind="volumePercent:prop#value" on="input:setVolume" /></slider-elemental>
    <tooltip-elemental>
      <button on="click:toggleFullscreen" aria-label="Fullscreen" bind="isFullscreen:attr#aria-pressed|pressed" disabled><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg></button>
      <span>Fullscreen</span>
    </tooltip-elemental>
  </toolbar-elemental>
</media-player>

<!-- The page's own copy. The previews above each load this inside their frame; this player is
     in the document, so the document needs it too. One tag: the bundle carries the elementals
     it imports, and the stylesheets are already in `prose.css`. -->
<script type="module" src="dist/media-player.min.mjs"></script>

There is no captions button on this row, because this file ships no caption track and a
button whose handler has nothing to toggle is a lie in the shape of a control. Mute and volume
_are_ here, and unlike the Artemis clip this one has sound for them to move.

What it costs is worth naming. The file is not mine — it is on
[W3C's media server](https://media.w3.org/), so this page makes a third-party request for it,
and `preload="metadata"` means that request happens on load rather than on your first click.

Which is a deliberate choice, and the reason is the flaw in the file. It is 238 MiB laid out
`ftyp free mdat moov` — the index is the _last_ 441 KiB of it, at byte 248,773,025 — so it is
not "fast start", and nothing can know the duration until a range request for the tail comes
back. `preload="none"` would defer that to the first click, and the click would then look
broken: the control row is bound `isReady:if`, readiness needs a duration, so there would be
no row to press and nothing on screen would change for as long as the tail took to arrive.
Fetching the index up front costs 441 KiB and buys a player that is a player before you touch
it. The stripe march and the buffered bar then have something real to show, which a
twelve-second local file never gives them.

Attribution: _Big Buck Bunny_ is © the Blender Foundation, released under
[CC-BY 3.0](https://peach.blender.org/about/).

## A background loop, and the one button it owes you

A video behind a headline is not a player. Nothing on it is meant to be pressed — no
scrubber, no clock, no volume on a track that is silent — and the markup for it is four
attributes the platform answered on its own long before this element existed:

```html
<video autoplay muted loop playsinline src="sample/rollout.mp4"></video>
```

`muted` is the condition every browser puts on autoplay rather than a stylistic choice:
without it the loop never starts. `playsinline` is what keeps iOS from taking the whole
screen the moment it does.

So the honest first answer is that a background video does not need this element. What it
needs is the one thing those four attributes cannot say: **motion that runs longer than five
seconds has to be stoppable** —
[WCAG 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
— and a twelve-second loop is past that line the second time it plays. That is one button,
and wiring one button is the smallest thing `<media-player>` does.

```html
<media-player class="video-background">
  <video
    autoplay
    muted
    loop
    playsinline
    src="sample/rollout.mp4"
    on="loadedmetadata:onLoaded;canplay:onLoaded;play:onPlay;pause:onPause"
  ></video>

  <button
    class="video-background-toggle"
    on="click:togglePlay"
    bind="playLabel:attr#aria-label"
    disabled
  >
    <span class="media-player-play-icon">…</span>
    <span class="media-player-pause-icon">…</span>
  </button>
</media-player>
```

Four handler names and no more. `loadedmetadata` and `canplay` route to `onLoaded`, which is
what takes `disabled` off the button once there is something to press; `play` and `pause`
keep `playLabel` and the `is-playing` attribute honest, and those two are the accessible name
and the icon swap. The two icon spans carry the same class names as the play button further
up the page, because the rule that swaps them is in `style.css` and asks nothing of
where the button sits. Every other handler in the samples above drives a control this one
does not have.

```css
.hero {
  position: relative;
  isolation: isolate;
}

.hero .video-background {
  position: absolute;
  inset: 0;
}

.hero .video-background video {
  height: 100%;
  object-fit: cover;
}

.hero-content {
  position: relative;
}

.video-background-toggle {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
}
```

`media-player` is already `display: block; position: relative` and `media-player[is-video]`
already clips, so what a background adds is the crop — `height: 100%` and `object-fit: cover`
over the `width: 100%` the stylesheet sets. There is no `z-index: -1` anywhere in that, on
purpose: the toggle is a child of the player, and a player pushed behind the page takes its
own button with it. The content is written after the player and positioned, which is enough
to paint it on top — and it is also what decides the collision, so keep the toggle in a
corner your text does not reach.

Two things it costs, both worth knowing before pasting it.

**The lock screen.** `play:onPlay` claims the OS media panel; it is the same handler as
everywhere else on this page and it does not know this video is wallpaper. Leave
`media-title`, `artist`, `album` and `artwork` off and there is nothing to name it with, so
the metadata is cleared rather than set. `poster` is the one to watch: a `<video poster>` is
read as artwork, so a background video that carries one puts a picture on the panel with no
title beside it.

**No `controls`, which is where this page's own rule bends.** Every other sample writes
`controls` on the media element so that a blocked script leaves a working native player
behind. Here there is nothing for a control bar to be the fallback _for_ — a scrubber across
your hero is not what you meant — so the button carries `disabled` in the markup instead, and
a page whose script never ran shows a control that is visibly unavailable rather than one
that silently does nothing. The loop still plays; `autoplay` is the browser's and owes this
element nothing. What that leaves is motion with no way to stop it on a page with no
JavaScript, and if that matters for yours, the markup that survives is a `<video controls>`
with no `autoplay` — a different design, not this one with a flag flipped.

Nothing here reads `prefers-reduced-motion`, this element included: `autoplay` is an
attribute and no media query reaches it. The button is the mechanism WCAG asks for, and a
page that wants the preference honoured on top of it starts the video from its own script
rather than from the attribute.

## What it borrows

The player draws almost nothing itself. The parts that have an
[APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/) behind them are elementals, each
usable on its own and documented in its own right:

| Part               | Element                                                                                               | What it brings                                                                                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scrubber, volume   | [`<slider-elemental>`](https://stamat.github.io/book-of-elementals/elementals/slider.html)            | a native `<input type="range">` and the whole APG Slider pattern — arrows, <kbd>Home</kbd>, <kbd>End</kbd>, touch, the value bubble                                         |
| Buffered-ahead bar | [`<progress-elemental buffer>`](https://stamat.github.io/book-of-elementals/elementals/progress.html) | a native `<progress>` with a second value beside the first                                                                                                                  |
| Control row        | [`<toolbar-elemental>`](https://stamat.github.io/book-of-elementals/elementals/toolbar.html)          | one tab stop, arrow keys between the buttons                                                                                                                                |
| Button tooltips    | [`<tooltip-elemental>`](https://stamat.github.io/book-of-elementals/elementals/tooltip.html)          | hover and focus both, <kbd>Escape</kbd> to dismiss per [WCAG 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html), and no half-handled touch |

So there is no `role="slider"` and no `aria-valuenow` anywhere in this element. The platform
already says both, and saying them again is how they end up disagreeing.

## Keys the buttons carry

Every control here is a `<button>` or an `<input type="range">`, so whichever one has focus
already answers <kbd>Space</kbd>, <kbd>Enter</kbd>, the arrows, <kbd>Home</kbd> and
<kbd>End</kbd> with no help from this element. What that leaves missing is the key that works
without tabbing to anything first — and the reason this player went without one for so long
is that a <kbd>k</kbd> nobody can see is a binding nobody can find.

So it is not a map. The key goes on the control it presses, and the player is told to listen:

```html
<media-player on="keydown@document:onKeyDown">
  …
  <button
    on="click:skipBackward"
    key="j"
    aria-label="Skip backward 10 seconds"
    disabled
  >
    …
  </button>
  <button
    on="click:togglePlay"
    key="k"
    bind="playLabel:attr#aria-label"
    disabled
  >
    …
  </button>
  <button
    on="click:skipForward"
    key="l"
    aria-label="Skip forward 10 seconds"
    disabled
  >
    …
  </button>
  <button
    on="click:toggleMute"
    key="m"
    bind="muteLabel:attr#aria-label"
    disabled
  >
    …
  </button>
</media-player>
```

`key` is what a press looks for: <kbd>k</kbd> clicks the button carrying `key="k"`, and
everything hanging off that button's `on=` fires as though it had been pressed. Case does not
matter, <kbd>K</kbd> presses the same button.

Two things follow from the key living on the button rather than in a list somewhere:

- **A key can only name an action a control already names.** There is nothing to document
  apart from the buttons and nothing to drift from them. Showing a binding is then a matter
  of showing it on the button it belongs to — a `<kbd>k</kbd>` in the button's tooltip, or
  `[key]::after { content: attr(key) }` in your own stylesheet, which needs no markup at all.
- **A disabled button ignores its key,** because a disabled button ignores a click. Nothing
  answers before `is-ready`.

### Which keydown you bind is the whole scope

`on=` says where the listener goes, so the reach of the keys is one attribute and not an
option:

| Written as                        | Answers                          | Costs                                                                                                         |
| --------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| nothing                           | nothing — there is no listener   | none, and this is the default                                                                                 |
| `on="keydown:onKeyDown"`          | while focus is inside the player | the reader has to tab or click into the player first, which for a keyboard shortcut is most of the point gone |
| `on="keydown@document:onKeyDown"` | anywhere on the page             | the page gives up those keys, and two players both bound this way both answer one press                       |

The last one is what a shortcut usually means, and it is the one to write on a page built
around a single player — an episode page, a video page. hydrargyri puts the listener on
`document` and takes it off when the element leaves the DOM, so nothing outlives the player
it belongs to. What it cannot do is share: two players bound page-wide both hear the same
<kbd>k</kbd> and both press their own play button. With more than one on a page, bind the
focused form, or bind the page-wide form on exactly one of them.

No sample on this page binds either, and the reason is the page: three players and several
thousand words of prose is precisely where a page-wide <kbd>k</kbd> is somebody else's key.
Copy a sample and the decision is yours to make once, in markup.

### What a press has to get past first

| Press                                                                     | Who it belongs to                                                                                                                                                                                                 |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The arrows, <kbd>Home</kbd>, <kbd>End</kbd>                               | the sliders and the control row, which answer them already                                                                                                                                                        |
| Anything with <kbd>Ctrl</kbd>, <kbd>⌘</kbd> or <kbd>Alt</kbd> held        | the browser                                                                                                                                                                                                       |
| A key typed into a text field, a `<select>` or anything `contenteditable` | whatever is being typed into — a comment box under a player is the ordinary case, not the odd one. Found through an open shadow root too, since a `keydown` reports the component rather than the field inside it |
| A key already handled by something else                                   | whatever called `preventDefault` first                                                                                                                                                                            |

A press that gets past all four and finds a `key` is taken off the page with
`preventDefault`, which is the part to weigh before binding `@document`: a letter the player
claims is a letter the page no longer sees. One field it cannot see is one inside a _closed_
shadow root — the platform reports the component and offers no way in, so its letters are
taken. A page with one of those wants the focused binding.

## Tooltips on the controls

The bubbles in the samples are `<tooltip-elemental>` wrapped round each button, which is
where hover, focus, <kbd>Escape</kbd> to dismiss and the decision to ignore touch outright
already live. Two of them bind rather than say: the play and mute bubbles carry `playLabel`
and `muteLabel`, the same state the buttons announce themselves by, so the words in the
bubble and the words a screen reader hears cannot drift apart.

```html
<tooltip-elemental>
  <button on="click:togglePlay" bind="playLabel:attr#aria-label" disabled>
    …
  </button>
  <span bind="playLabel">Play</span>
</tooltip-elemental>
```

The button keeps its `aria-label`, so the bubble is a description rather than the name and
the control is named with or without it. Importing `media-player` defines the tooltip along
with the rest, so the part a page can miss is the stylesheet — and unlike the other
elementals it is the _theme_ that paints the bubble at all, which the install list says
beside it. `theme.css` then takes the caret back off the bubbles inside a player: a row of
buttons a few pixels apart is not ambiguous about which one a bubble belongs to, and the
player this is a rewrite of drew a plain rounded box too.

## Attributes it writes

These land on the `<media-player>` element as CSS hooks. You do not set them — you style
against them.

| Attribute                                          | When                                                                                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `is-ready`                                         | metadata arrived; the duration is known and the controls are live                                                            |
| `is-playing`                                       | playing — the hook the play/pause icon swap hangs on                                                                         |
| `is-buffering`                                     | waiting on data                                                                                                              |
| `is-live`                                          | the duration says endless stream, so there is nothing to seek                                                                |
| `is-video`                                         | it wrapped a `<video>`                                                                                                       |
| `is-fullscreen`, `controls-shown`, `poster-hidden` | the video half                                                                                                               |
| `no-fullscreen`                                    | fullscreen has no door to open — an iframe without `allow="fullscreen"` is the common way; hide your fullscreen button on it |
| `has-captions`, `captions-visible`                 | a `<track>` was found; captions are on                                                                                       |
| `volume-state`                                     | `mute`, `mid` or `full`, for a three-icon volume button                                                                      |

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

| Attribute     | Holds                                                                             |
| ------------- | --------------------------------------------------------------------------------- |
| `media-title` | what the panel calls it; wins over the media element's `title`                    |
| `artist`      | who made it                                                                       |
| `album`       | what it came from                                                                 |
| `artwork`     | cover image; wins over `poster`, and a relative path is resolved against the page |

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
into dark mode and forced colours. It reaches one thing it does not own: the caret comes off
a `<tooltip-elemental>` bubble inside a player, because a row of buttons a few pixels apart
is not ambiguous about which one a bubble points at. What it takes from you are custom
properties — the first five live in the theme, the last two in the structure sheet:

| Property                    | Default      | Paints                                                                                                                                         |
| --------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `--media-player-accent`     | `#22c55e`    | the played fill, the hover that floods a button, a toggle held on, the thumbs, the overlay chip, the focus ring                                |
| `--media-player-accent-ink` | `#fff`       | what sits on the accent — the flooded button's glyph, the chip's triangle; change it with the accent                                           |
| `--media-player-surface`    | `Canvas`     | behind the control row                                                                                                                         |
| `--media-player-color`      | `CanvasText` | labels, and every neutral mixed from it — tracks, the buffered bar, disabled buttons; the video half swaps it to white and everything re-mixes |
| `--media-player-radius`     | `0.5rem`     | the control row's corners, and the video's                                                                                                     |
| `--media-player-gap`        | `0.5rem`     | between controls                                                                                                                               |
| `--media-player-fade`       | `0.2s`       | how long the video controls take to fade out                                                                                                   |

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
    <span aria-hidden="true">⏸</span>
    <span class="visually-hidden">Pauziraj</span>
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
- **Keep a keyboard map of its own.** `key` on a button is the whole of it, and that is the
  refusal rather than a shortcut around one: the key presses a control the page already
  shows, already names and already disables. An attribute mapping a key straight to a method
  would reach further — `volumeUp` and `volumeDown` have no button in these samples, so no
  key either — at the price of a second set of bindings with nothing on the page announcing
  them, which is the half worth refusing.
- **Sanitize anything.** It writes text and attributes, never HTML.

## Install

```bash
npm install media-player-element
```

```js
import "media-player-element";
```

The elementals ride along — importing `media-player-element` defines the slider, the progress bar,
the toolbar and the tooltip too. Their stylesheets do not: each elemental draws its own
track, thumb, bar or bubble, so its sheet loads beside this one. The tooltip is the one
whose theme is not really optional: its own sheet places the bubble and leaves the painting
to the theme, so without it there is unpainted text over the control row.

```html
<link rel="stylesheet" href="media-player-element/style.css" />
<link rel="stylesheet" href="book-of-elementals/slider/style.css" />
<link rel="stylesheet" href="book-of-elementals/progress/style.css" />
<link rel="stylesheet" href="book-of-elementals/toolbar/style.css" />
<link rel="stylesheet" href="book-of-elementals/tooltip/style.css" />

<link
  rel="stylesheet"
  href="media-player-element/theme.css"
/><!-- the look; optional -->
<link
  rel="stylesheet"
  href="book-of-elementals/slider/theme.css"
/><!-- optional -->
<link
  rel="stylesheet"
  href="book-of-elementals/progress/theme.css"
/><!-- optional -->
<link
  rel="stylesheet"
  href="book-of-elementals/tooltip/theme.css"
/><!-- optional, but a bubble nothing paints is text over the row -->
```

Or from a CDN as a module, no install and no build step — the stylesheets come the same
way, from each package's `dist/`:

```html
<script type="module">
  import "https://cdn.jsdelivr.net/npm/media-player-element/dist/media-player.min.mjs";
</script>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/media-player-element/dist/media-player.min.css"
/>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/book-of-elementals/dist/elementals/slider.min.css"
/>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/book-of-elementals/dist/elementals/progress.min.css"
/>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/book-of-elementals/dist/elementals/toolbar.min.css"
/>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/book-of-elementals/dist/elementals/tooltip.min.css"
/>
```

## What editors read

The package ships a
[custom elements manifest](https://github.com/webcomponents/custom-elements-manifest) as
`custom-elements.json`, named by the `customElements` field in `package.json` and generated
from the element's source on every build. It carries what this page carries — the
attributes, the two events, the seven custom properties — and marks everything the samples
do not name as private, so an editor offering completions offers `togglePlay` and not
`endDrag`.

The samples at the top of this page read it too. Their **Options** tab is generated from
this file and nothing else, which is the reason to ship one rather than invent a format: the
knobs cannot describe an element this page no longer has. What the panel leaves out is in
the file as well, under an `x-code-preview` key the schema permits and every other tool
ignores — the twelve CSS hooks stay documented for a stylesheet and are marked hidden for
the panel, because they are the element's to write and not an author's.

What any given editor does with it is its own business, and none of it is required to use
the element: the manifest is a description, not a runtime.

## License

[MIT](https://github.com/stamat/media-player/blob/main/LICENSE) © [Stamat](https://github.com/stamat).
The icons in the samples are [Lucide](https://lucide.dev), ISC.
