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
`custom-elements.json` this package ships, turned into controls: the seven attributes an author
writes and the seven custom properties the theme takes, each with what the manifest says its
type is. An attribute knob rewrites the markup above it, so the code tab stays the truth; a
custom property is not part of the sample, so it writes a rule into the frame and prints that
rule for you to copy. The thirteen attributes the element writes for itself are left out — a
knob spliced into the markup would not survive the next `play`.

<!-- One line, and it has to be: markdown treats an unknown tag as a block only when its
     whole opening tag sits on a line of its own. Broken over four, the page prints it.
     The frame's own padding drops to nothing on a narrow screen. That keeps the sample
     honest rather than tidy: 1.5rem a side renders it 48px narrower than the page a reader
     would paste this markup onto, which is enough to wrap the video row to a third line on
     a phone and show a defect the markup does not have. -->
<code-preview manifest="custom-elements.json" css="css/prose.min.css" theme-attribute="data-theme" head="&lt;style&gt;body{margin:0;padding:1.5rem}@media(max-width:30rem){body{padding:0}}&lt;/style&gt;&lt;script type='module' src='dist/media-player.min.mjs'&gt;&lt;/script&gt;">

```html
<media-player tabindex="0" role="region" aria-label="Audio player" keys="ArrowUp:volumeUp;ArrowDown:volumeDown" on="keydown:onKeyDown">
  <audio controls src="sample/tone.wav" preload="metadata"></audio>

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
      <!-- The buffered bar, behind the input. Only the buffered bar: the played fill is
           the slider's own, which the element catches up itself after every scripted
           write — a range input fires no event for one. -->
      <progress-elemental>
        <progress
          value="0"
          max="1"
          bind="buffered:prop#value;duration:prop#max"
        ></progress>
      </progress-elemental>
      <!-- `step="any"` lets the clock's fractional writes land unsnapped, so the thumb
           glides with playback instead of jumping once a second. A hand is the exception:
           `beginScrub` flips the step to whole seconds the moment a pointer or a seek key
           lands, and `endScrub` puts `any` back — a drag and the arrows move per second,
           the tooltip reads whole seconds regardless.
           `pointerup@document` as well as `change`: a thumb picked up and put back where it
           started fires no `change`, and the clock would stay stopped over playing audio. -->
      <input
        type="range"
        min="0"
        step="any"
        value="0"
        aria-label="Seek"
        disabled
        bind="duration:attr#max;currentTime:prop#value"
        on="pointerdown:beginScrub;keydown:beginScrub;input:scrub;change:seek;pointerup@document:endScrub;keyup:endScrub"
      />
    </slider-elemental>

    <!-- Lucide, inline. The sample is the page's only copy of this markup, so the icons a
         reader sees above are the icons the sample carries — swap them for yours and the
         preview swaps with them. -->
    <tooltip-elemental>
      <button
        on="click:skipBackward"
        key="ArrowLeft"
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
      <button on="click:togglePlay" key=" " bind="playLabel:attr#aria-label" disabled>
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
        key="ArrowRight"
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
      <input
        type="range"
        min="0"
        max="100"
        step="5"
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

<p>That is the whole wiring model. <code>on</code> says what fires, <code>bind</code> says
  where state lands, and both hold names — never code — so there is nothing to evaluate and
  nothing for a Content Security Policy to object to. It sits on
  <a href="https://github.com/stamat/hydrargyri">hydrargyri</a> for the binding and
  <a href="https://github.com/stamat/book-of-elementals">book-of-elementals</a> for the
  sliders.</p>
{# The rest of the page is captured, then rendered twice: once through `toc` for its
   headings, once as itself. The docs layout does this around its own `{% block content %}`;
   this page is a prose layout, so it does it here. The filter reads ids off rendered html,
   which the markdown heading renderer emits — which is why the sections below stay markdown
   rather than becoming html like the paragraph above. No blank line above this: the capture
   opens against that paragraph's run, and a blank line would end it. #}
{% set body %}

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
wrapped and turns on the video half — poster, click-to-play overlay, click-to-pause on the
picture, captions, fullscreen, controls that fade out while playing — only when it wrapped a
`<video>`.

<!-- One line, and it has to be: markdown treats an unknown tag as a block only when its
     whole opening tag sits on a line of its own. Broken over four, the page prints it.
     The frame's own padding drops to nothing on a narrow screen. That keeps the sample
     honest rather than tidy: 1.5rem a side renders it 48px narrower than the page a reader
     would paste this markup onto, which is enough to wrap the video row to a third line on
     a phone and show a defect the markup does not have. -->
<code-preview manifest="custom-elements.json" css="css/prose.min.css" theme-attribute="data-theme" head="&lt;style&gt;body{margin:0;padding:1.5rem}@media(max-width:30rem){body{padding:0}}&lt;/style&gt;&lt;script type='module' src='dist/media-player.min.mjs'&gt;&lt;/script&gt;">

```html
<media-player
  tabindex="0"
  role="region"
  aria-label="Video player"
  keys="ArrowUp:volumeUp;ArrowDown:volumeDown"
  on="mousemove:showControls;fullscreenchange@document:onFullscreenChange;keydown:onKeyDown"
>
  <video
    controls
    playsinline
    preload="metadata"
    src="sample/rollout.mp4"
    poster="sample/rollout.jpg"
  >
    <track
      kind="captions"
      src="sample/rollout.en.vtt"
      srclang="en"
      label="English"
    />
    <!-- Scrubber frame previews, from a sprite sheet and the WebVTT mapping time onto it —
         script/thumbs in this repository generates both. The browser parses the file; the
         element only reads the cues. -->
    <track kind="metadata" src="sample/rollout-thumbs.vtt" />
  </video>

  <!-- Both go when playback starts and they come back differently. The poster is gone for
       good — the element sets `poster-hidden` the first time playback starts — while the
       overlay follows `is-playing`, so clicking the picture pauses the video and puts the
       big play button back over the frame it stopped on. Both leave with `display` rather
       than fading, so an invisible button is never sitting over the picture swallowing
       clicks. -->
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
      on="pointermove:preview;pointerleave:endPreview"
    >
      <!-- The frame under the pointer, painted and placed by the element from the
           kind="metadata" track's cues. `hidden` until there is a frame to show. -->
      <div class="media-player-preview" hidden></div>
      <progress-elemental>
        <progress
          value="0"
          max="1"
          bind="buffered:prop#value;duration:prop#max"
        ></progress>
      </progress-elemental>
      <input
        type="range"
        min="0"
        step="any"
        value="0"
        aria-label="Seek"
        disabled
        bind="duration:attr#max;currentTime:prop#value"
        on="pointerdown:beginScrub;keydown:beginScrub;input:scrub;change:seek;pointerup@document:endScrub;keyup:endScrub"
      />
    </slider-elemental>

    <!-- Lucide, inline. The sample is the page's only copy of this markup, so the icons a
         reader sees above are the icons the sample carries — swap them for yours and the
         preview swaps with them. -->
    <tooltip-elemental>
      <button
        on="click:skipBackward"
        key="ArrowLeft"
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
      <button
        on="click:togglePlay"
        key=" "
        bind="playLabel:attr#aria-label"
        disabled
      >
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
        key="ArrowRight"
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
      <input
        type="range"
        min="0"
        max="100"
        step="5"
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

A click on the picture itself needs no handler in the markup: the element wires it, the same
way it wires the media element's events. Clicking a playing video pauses it and the overlay
returns over the frame it stopped on, so the big play button is up whenever there is
something to start — including while a paused video is being scrubbed.

Captions render into whatever binds `captionText`, with the track held `hidden` so the
browser's own caption box stays out of the way — which is what leaves your stylesheet in
charge of what captions look like.

## Twelve minutes, from someone else's server

Twelve seconds proves the wiring and proves nothing about the seeking. A local file that
short never buffers, and a clock reading `00:00 / 00:12` never needs the minutes it can show.
So here is the same row over twelve minutes of Tears of Steel, and this one is not in an editable
frame — it is the page's own DOM, upgraded by the one module tag sitting under it. Block that
tag and what is left is a plain `<video controls>`, which makes the claim this page opens with
testable right here rather than in a file you have to build yourself.

<!-- One line, and it has to be: the whole opening tag of an unknown element must sit on a
     line of its own or markdown prints it instead of rendering it. Same trap as code-preview
     above, and the reason this player's attributes are not broken up for readability. -->
<media-player tabindex="0" role="region" aria-label="Video player" keys="ArrowUp:volumeUp;ArrowDown:volumeDown" media-title="Tears of Steel" artist="Blender Foundation" on="mousemove:showControls;fullscreenchange@document:onFullscreenChange;keydown:onKeyDown">
  <video controls playsinline preload="metadata" src="https://download.blender.org/demo/movies/ToS/tears_of_steel_720p.mov" poster="sample/tears-of-steel.jpg">
    <track kind="captions" src="sample/tears-of-steel.en.vtt" srclang="en" label="English" />
    <track kind="metadata" src="sample/tears-of-steel-thumbs.vtt" />
  </video>
  <img class="media-player-poster" src="sample/tears-of-steel.jpg" alt="" />
  <button class="media-player-overlay" on="click:togglePlay" aria-label="Play"></button>
  <div class="media-player-captions" bind="captionText:if"><span bind="captionText"></span></div>
  <toolbar-elemental class="media-player-controls" aria-label="Playback" bind="isReady:if">
    <slider-elemental class="media-player-scrubber" tooltip="thumb track" bind="timeFormatter:prop#format" on="pointermove:preview;pointerleave:endPreview">
      <div class="media-player-preview" hidden></div>
      <progress-elemental><progress value="0" max="1" bind="buffered:prop#value;duration:prop#max"></progress></progress-elemental>
      <input type="range" min="0" step="any" value="0" aria-label="Seek" disabled bind="duration:attr#max;currentTime:prop#value" on="pointerdown:beginScrub;keydown:beginScrub;input:scrub;change:seek;pointerup@document:endScrub;keyup:endScrub" />
    </slider-elemental>
    <tooltip-elemental>
      <button on="click:skipBackward" key="ArrowLeft" aria-label="Skip backward 10 seconds" disabled><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></button>
      <span>Skip backward</span>
    </tooltip-elemental>
    <tooltip-elemental>
      <button on="click:togglePlay" key=" " bind="playLabel:attr#aria-label" disabled><span class="media-player-play-icon"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg></span><span class="media-player-pause-icon"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect fill="currentColor" x="14" y="3" width="5" height="18" rx="1"/><rect fill="currentColor" x="5" y="3" width="5" height="18" rx="1"/></svg></span></button>
      <span bind="playLabel">Play</span>
    </tooltip-elemental>
    <tooltip-elemental>
      <button on="click:skipForward" key="ArrowRight" aria-label="Skip forward 10 seconds" disabled><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg></button>
      <span>Skip forward</span>
    </tooltip-elemental>
    <span class="media-player-time"><span bind="currentTime|time">00:00</span> / <span bind="duration|time">00:00</span></span>
    <tooltip-elemental>
      <button on="click:toggleMute" bind="muteLabel:attr#aria-label" disabled><span class="media-player-volume-icon media-player-volume-icon-mute"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg></span><span class="media-player-volume-icon media-player-volume-icon-mid"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/></svg></span><span class="media-player-volume-icon media-player-volume-icon-full"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/></svg></span></button>
      <span bind="muteLabel">Mute</span>
    </tooltip-elemental>
    <slider-elemental class="media-player-volume" tooltip="thumb"><input type="range" min="0" max="100" step="5" aria-label="Volume" disabled bind="volumePercent:prop#value" on="input:setVolume" /></slider-elemental>
    <tooltip-elemental>
      <button on="click:toggleCaptions" aria-label="Captions" bind="captionsVisible:attr#aria-pressed|pressed" disabled><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="14" x="3" y="5" rx="2" ry="2"/><path d="M7 15h4M15 15h2M7 11h2M13 11h4"/></svg></button>
      <span bind="captionsLabel">Enable captions</span>
    </tooltip-elemental>
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

The captions are the Blender Foundation's own English subtitles, and they are served from
this repository rather than from Blender's. A `<track>` cannot read the file that is up
there: it is SRT, it comes back as `application/octet-stream` under `nosniff`, and it carries
no `access-control-allow-origin` while a track fetch is CORS-mode whatever the media element
says. So the cues were converted to WebVTT once and committed beside the poster, which is the
trip a third-party caption track takes onto any page. The last one ends at `09:27` and the
closing minutes carry none — that is what the file has, not something the element dropped.

There is no language picker, though that server holds twenty-four translations. The element
takes the first caption track and keeps it, because switching language needs a control to
switch it with and there is no such control here to name. What it does remember is whether
you had captions on, along with the volume, so this row comes back the way you left it. Mute
and volume are here too, and unlike the Artemis clip this one has sound for them to move.

What it costs is worth naming. The file is not mine — it is on
[Blender's download server](https://download.blender.org/), so this page makes a third-party
request for it, and `preload="metadata"` means that request happens on load rather than on
your first click.

Which is a deliberate choice, and the reason is the flaw in the file. It is 355 MiB laid out
`ftyp wide mdat moov` — the index is the _last_ 585 KiB of it, at byte 371,579,659 — so it is
not "fast start", and nothing can know the duration until a range request for the tail comes
back. `preload="none"` would defer that to the first click, and the click would then look
broken: the control row is bound `isReady:if`, readiness needs a duration, so there would be
no row to press and nothing on screen would change for as long as the tail took to arrive.
Fetching the index up front costs 585 KiB and buys a player that is a player before you touch
it. The stripe march and the buffered bar then have something real to show, which a
twelve-second local file never gives them.

Attribution: _Tears of Steel_ and its subtitles are © the Blender Foundation, released under
[CC-BY 3.0](https://mango.blender.org/sharing/).

## Frames on the scrubber

A scrubber names a second; a frame says what is there. Every big player draws one on hover,
and every one of them makes you pay for it the same way, because there is no way not to: **the
frames have to be cut from the video beforehand.** No browser API hands out the picture at an
arbitrary second without seeking there, so the preview is a build step and a markup choice,
never a flag.

The format is the one the field already settled on — a WebVTT file whose cues map a time
range to a slice of a sprite sheet, `sprite.jpg#xywh=x,y,width,height` — which means
thumbnails cut for [Plyr](https://github.com/sampotts/plyr),
[Vidstack](https://www.vidstack.io) or
[media-chrome](https://www.media-chrome.org/docs/en/components/media-preview-thumbnail) work
here unchanged, and the other way round. Where those parse the file themselves, this element
hands it to the browser: the author writes it as a `<track kind="metadata">` — the same
element media-chrome asks for — the element flips the track `hidden` so the browser fetches
and parses it, and the only syntax read here is the `#xywh` fragment. Both video players
above carry the whole wiring — the twelve-minute one is the one worth hovering, since
twelve seconds of frames barely change; the three lines that are it:

```html
<video controls preload="metadata" src="movie.mp4">
  <track kind="metadata" src="movie-thumbs.vtt" />
</video>
```

```html
<slider-elemental
  class="media-player-scrubber"
  tooltip="thumb track"
  bind="timeFormatter:prop#format"
  on="pointermove:preview;pointerleave:endPreview"
>
  <div class="media-player-preview" hidden></div>
  …
</slider-elemental>
```

The box is yours, like every control on this page — position and paint come from
`style.css` and `theme.css`, and the element writes only what a stylesheet cannot know: the
slice, the tile's size, and where along the track the pointer is. A relative image path in
the VTT resolves against the VTT file, not against the page, so the pair travels as one
directory. What the element never does is scale: **a tile is shown at the size it was cut**,
because scaling needs the sprite's natural size, which is unknown until the image loads, and
a box that resizes itself mid-hover is a bubble jumping under a still pointer. Cut the
frames at the size the box should be.

Cutting them is one command —
[`script/thumbs`](https://github.com/stamat/media-player/blob/main/script/thumbs) in this
repository, a bash script over `ffmpeg` and `ffprobe`, which is what wrote both sprites
the players above hover — the twelve-minute film cuts to 147 frames in a 637 KiB sheet.
Each frame is cut from the middle of its cue rather than the start, so a hover is never
more than half an interval away from the second it names:

```bash
script/thumbs movie.mp4          # movie-thumbs.jpg + movie-thumbs.vtt, a frame every 5 s
script/thumbs movie.mp4 2 160 5  # every 2 s, 160px wide, 5 to a sprite row
```

The interval is the cost knob, and the trade is lopsided: the sheet grows linearly with
the frame count while what a finer grid buys shrinks. Every frame is cut from the middle
of its cue, so a hover is off by at most half the interval — and the click seeks
frame-exact regardless, so the bubble only has to orient. One pixel of a page-wide
scrubber already spans about a second of a feature-length film. Tears of Steel above, cut
at every interval with 160px tiles:

| Interval                | Frames | Sheet   | A hover is off by at most |
| ----------------------- | ------ | ------- | ------------------------- |
| 10 s                    | 74     | 332 KiB | 5 s                       |
| **5 s** — the default   | 147    | 637 KiB | 2.5 s                     |
| 2 s                     | 368    | 1.6 MiB | 1 s                       |
| 1 s                     | 735    | 3.2 MiB | 0.5 s                     |

`script/thumbs movie.mp4 1` is the whole of getting the last row — nothing in the element
cares which you pick. It is the sheet your visitors pay for on their first hover, which is
why this page ships the middle of the table: below two seconds it outweighs the player's
entire bundle several times over, spent on a bubble whose job is orientation.

Copy it out of the repository — it is not in the npm package, because a bash script in a
browser library's tarball is a file nobody runs from there. Anything else that emits the
`#xywh` format works the same; hosted pipelines like Mux and Cloudflare Stream generate it
for you.

The degradation is the usual bargain. No `<track kind="metadata">`, no
`.media-player-preview` box, cues not loaded yet, a live stream — each means no preview and
no error, and the scrubber's own value bubble still reads the time. A captions `<track>` is
untouched by any of this: the captions button looks only for `captions`, `subtitles` and the
bare `<track>` the platform reads as subtitles, so the two tracks sit in one `<video>`
without stepping on each other. Blocked script never enters
into it — the preview box is `hidden` in the markup and the native player the fallback
leaves behind never had hover previews to lose.

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
  <video autoplay muted loop playsinline src="sample/rollout.mp4"></video>

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

Nothing on the `<video>` but what the platform reads — the element listens to it by itself,
here as everywhere. Metadata arriving is what takes `disabled` off the button once there is
something to press; `play` and `pause` keep `playLabel` and the `is-playing` attribute
honest, and those two are the accessible name and the icon swap. The two icon spans carry
the same class names as the play button further up the page, because the rule that swaps
them is in `style.css` and asks nothing of where the button sits.

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

**The lock screen.** Playing claims the OS media panel — the element's own `play` listener,
the same one behind every player on this page — and it does not know this video is wallpaper. Leave
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
| Buffered-ahead bar | [`<progress-elemental>`](https://stamat.github.io/book-of-elementals/elementals/progress.html)        | a native `<progress>` whose fill CSS can place — here it carries the buffered edge, on the duration's own scale                                                             |
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
- **A disabled button ignores its key,** because a disabled button ignores a click, and the
  press stays the page's — a claimed <kbd>Space</kbd> that did nothing would still have
  stopped the page scrolling. Nothing answers before `is-ready`.

One binding has no button to live on: the samples' volume is a slider, so `volumeUp` and
`volumeDown` have nothing to carry a `key`. The `keys` attribute on the player covers exactly
that gap — `keys="ArrowUp:volumeUp;ArrowDown:volumeDown"` maps a key straight to a handler
from the reference below, which is how a focused player answers all four arrows the way
YouTube does. It is the fallback, never the override: a control's own `key` wins the same
press, every guard in the table further down applies unchanged, and a pair naming no handler
warns in the console rather than dying silent. Reach for it only when no control names the
action — a `keys` entry duplicating a button is a binding nothing on screen can show.

### Which keydown you bind is the whole scope

`on=` says where the listener goes, so the reach of the keys is one attribute and not an
option:

| Written as                        | Answers                          | Costs                                                                                                                                         |
| --------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| nothing                           | nothing — there is no listener   | none, and this is the default                                                                                                                 |
| `on="keydown:onKeyDown"`          | while focus is inside the player | the reader has to tab or click into the player first, which for a keyboard shortcut is most of the point gone                                 |
| `on="keydown@document:onKeyDown"` | anywhere on the page             | the page gives up those keys — <kbd>Space</kbd> included, which is its scroll key — and two players both bound this way both answer one press |

The last one is what a shortcut usually means, and it is the one to write on a page built
around a single player — an episode page, a video page. hydrargyri puts the listener on
`document` and takes it off when the element leaves the DOM, so nothing outlives the player
it belongs to. What it cannot do is share: two players bound page-wide both hear the same
<kbd>k</kbd> and both press their own play button. With more than one on a page, bind the
focused form, or bind the page-wide form on exactly one of them.

Focus is yours to place, and the focused form depends on where it lands: a click leaves focus
on the nearest focusable thing, and `<media-player>` is not one until you say so. Write
`tabindex="0"` on it and the player is a Tab stop of its own as well as the place a click on
the video — or anywhere in the row that is not itself a control — leaves focus, which is what
makes <kbd>Space</kbd> answer afterwards. A focusable element with no role reads out its
entire contents to a screen reader, so the samples pair it with `role="region"` and an
`aria-label` naming the player; `tabindex="-1"` is the same click behaviour without the Tab
stop, for a page where one more stop before the controls is one too many. The element never
moves focus itself: pulling it back after a button press would move a screen reader's cursor
mid-sentence, and there is no quiet way to do that.

It does move focus in one place, and it is the opposite case: the click-to-play overlay is a
real button, so pressing it to play leaves focus on it — and starting playback is the moment
the overlay is hidden, which drops that focus to `<body>` and takes every key on this player
with it. The next <kbd>Space</kbd> would scroll the page rather than pause. So focus moves to
the player instead, which is not taking focus but declining to lose it. It needs the
`tabindex` to land on: without one there is nowhere to put it, and the element leaves it
alone rather than pretend.

`theme.css` draws a ring on a player that keyboard focus reaches, so a reader who Tabbed in —
and therefore holds the keys — can see that they do. On `:focus-visible`, the same heuristic
as the buttons, the one that
[hides a ring you placed with a finger](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)
on the grounds that you know where you clicked: a click on the picture or the bar focuses the
player too, and an accent ring around the whole box on every click reads as a glitch rather
than a ring. One case pays for that quiet — the focus the element catches when the overlay
goes at playback start draws no ring after a mouse press, so a mouse reader gets no sign the
keys went live; Tab in once and it shows. The ring sits
outside the box because inside it is invisible: on a video the overlay button covers the whole
player and the poster sits under that, and both paint over it. Style
`media-player:focus-visible { outline: none }` if you would rather it stayed quiet.

With it on, a `key=" "` answers from every place a reader is likely to leave focus: the
player, the media element, the scrubber, and the big overlay button on a video — none of
which scroll on <kbd>Space</kbd> any more, which is the trade it is buying. The overlay
is the one the player keeps its hands off — a focused button is activated by the press it
already owns — and it lands on the same action regardless, since the overlay in these samples
is the play button. That is only worth knowing for the button it is not: focus parked on mute
or fullscreen spends <kbd>Space</kbd> there, which is the point of the rule and the thing
YouTube gets asked about.

The audio and video samples above both bind the focused form, so this is one to press rather
than read: `keydown:onKeyDown` on the player, `key=" "` on its play button,
`key="ArrowLeft"` and `key="ArrowRight"` on its skip buttons,
`keys="ArrowUp:volumeUp;ArrowDown:volumeDown"` on the player for the pair with no button,
and `tabindex="0"` so the player is a stop on the Tab order and a click on the bar leaves
focus inside. Tab to one, or put focus anywhere in it — the scrubber, the picture, the row —
and <kbd>Space</kbd> plays and pauses, except on a button, where it presses the button; the
sideways arrows skip and the vertical ones move the volume the same way, except on the
scrubber and the volume slider, which keep their own arrows.

No sample binds the page-wide form. Not because it would misbehave here: a preview runs in
its own frame, so a <kbd>k</kbd> claimed inside one never reaches this page. It is that the
markup a sample hands you is markup you paste, and page-wide is the decision worth making
once, on your own page, with the scroll key in mind.

### What a press has to get past first

| Press                                                                                           | Who it belongs to                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The arrows, <kbd>Home</kbd>, <kbd>End</kbd> or a Page key with a slider or a radio group focused | the focused control — a slider spends them on its own value, a radio group on its own walk. Everywhere else an arrow is free to claim: `key="ArrowRight"` on the skip button skips while the player holds focus, and still nudges the scrubber by one second when focus is on it. The control row's arrows land in the already-handled line below                       |
| <kbd>Space</kbd> or <kbd>Enter</kbd> with a button, a checkbox, a link or a `<summary>` focused | whatever the press does there already — it activates a button, a checkbox or a `<summary>`, it follows a link on <kbd>Enter</kbd>, and on <kbd>Space</kbd> over a link it scrolls the page. It is the split [YouTube documents](https://support.google.com/youtube/answer/7631406): Space pauses when the player holds focus and presses the button when a button does |
| Anything with <kbd>Ctrl</kbd>, <kbd>⌘</kbd> or <kbd>Alt</kbd> held                              | the browser                                                                                                                                                                                                                                                                                                                                                            |
| A key typed into a text field, a `<select>` or anything `contenteditable`                       | whatever is being typed into — a comment box under a player is the ordinary case, not the odd one. Found through an open shadow root too, since a `keydown` reports the component rather than the field inside it                                                                                                                                                      |
| A key already handled by something else                                                         | whatever called `preventDefault` first                                                                                                                                                                                                                                                                                                                                 |

A press that gets past all five and finds a `key` is taken off the page with
`preventDefault`, which is the part to weigh before binding `@document`: a letter the player
claims is a letter the page no longer sees. <kbd>Space</kbd> is the expensive one to claim
that way, because unclaimed it scrolls — bound `@document` it stops scrolling the whole page,
not only the player. That is the reason YouTube's always-works key is <kbd>k</kbd> and its
<kbd>Space</kbd> reaches no further than the player: a page that has given up its scroll key
has given up more than a shortcut is worth. One field it cannot see is one inside a _closed_
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
| `is-error`                                         | the media gave up — a 404, a refused codec, a failed decode; the native controls come back for the browser's own error state |
| `is-live`                                          | the duration says endless stream; what can be reached inside it is `seekableStart`–`seekableEnd`                             |
| `is-video`                                         | it wrapped a `<video>`                                                                                                       |
| `is-fullscreen`, `controls-shown`, `poster-hidden` | the video half — `poster-hidden` covers the poster only, the overlay follows `is-playing`                                     |
| `no-fullscreen`                                    | fullscreen has no door to open — an iframe without `allow="fullscreen"` is the common way; hide your fullscreen button on it |
| `has-captions`, `captions-visible`                 | a caption track was found, in the markup or in the media element's track list; captions are on                               |
| `volume-state`                                     | `mute`, `mid` or `full`, for a three-icon volume button                                                                      |

Three you do set: `skip` is how many seconds a skip button moves (default `10`);
`storage-key` is the prefix for the remembered volume, mute and captions state — set it per
player, or two players on one page will share one volume; and `keys` maps a key to an action
no visible control names, covered under the keys section above. Four more, for what the lock
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
| `--media-player-accent`     | `#16a34a`    | the played fill, the hover that floods a button, a toggle held on, the thumbs, the overlay chip, the focus ring                                |
| `--media-player-accent-ink` | `#fff`       | what sits on the accent — the flooded button's glyph, the chip's triangle; change it with the accent                                           |
| `--media-player-surface`    | `Canvas`     | behind the control row                                                                                                                         |
| `--media-player-color`      | `CanvasText` | labels, and every neutral mixed from it — tracks, the buffered bar, disabled buttons; the video half swaps it to white and everything re-mixes |
| `--media-player-radius`     | `0.5rem`     | the control row's corners, and the video's                                                                                                     |
| `--media-player-gap`        | `0.5rem`     | between controls                                                                                                                               |
| `--media-player-fade`       | `0.2s`       | how long the video controls take to fade out                                                                                                   |

## Handlers you can name

The samples above are the working answer; this is the index — every name `on=` can call, for
the moment you are building a control row no sample here draws. It is the list
`custom-elements.json` publishes minus the handlers the element wires itself, which an
editor still reads.

Which element you write the `on=` on matters as much as which name you write in it. There are
two places to write one — your controls and the `<media-player>` itself — and a name from one
list does nothing on the other.

The `<audio>`, the `<video>` and a `<track>` inside them take no `on=` at all. The listeners
that keep the element in step with playback — the five metadata events, `play` and `pause`,
`waiting` and `playing`, `ended`, `progress`, `timeupdate` for a live stream's window,
`volumechange`, and a track's `cuechange` into
`captionText` — are the element's own plumbing, declared in its `static wires` and attached
by [hydrargyri](https://github.com/stamat/hydrargyri) when the element upgrades. Markup from
an earlier version that still carries those pairs keeps firing once: a pair the attribute
already wired is skipped, never doubled.

**On your controls** — a `<button>`, a range input, anything a person presses:

| Write                                           | Does                                                                                                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `click:togglePlay`                              | plays a paused player, pauses a playing one                                                                                                      |
| `click:stop`                                    | pauses and returns to the start — a live stream has no start to return to, so there it only pauses                                               |
| `click:skipForward`, `click:skipBackward`       | move by the `skip` attribute's seconds, ten by default; on a live stream they move inside the rewind window, and decline when there is none      |
| `pointerdown:beginScrub`, `keydown:beginScrub`  | a hand landed: flip the scrubber's `step="any"` to whole seconds before the press moves the value, so a drag and the arrows move per second while playback between them glides free — a keydown that is not a seek key is ignored |
| `input:scrub`                                   | the thumb moved: paint the clock, and do not seek until the drag ends                                                                            |
| `change:seek`                                   | the drag committed: seek to the value under the thumb                                                                                            |
| `pointerup@document:endScrub`, `keyup:endScrub` | the drag ended, whatever it did to the value — on the document because a drag very often ends with the pointer somewhere else; puts the resting step back |
| `pointermove:preview`                           | on the scrubber: paint the frame whose cue covers the second under the pointer into `.media-player-preview` — [Frames on the scrubber](#frames-on-the-scrubber); no metadata track, no box or a live stream each mean nothing shown |
| `pointerleave:endPreview`                       | the pointer left the scrubber; the frame goes with it                                                                                            |
| `input:setVolume`                               | the sound follows the thumb immediately; the write to storage waits for the drag to settle                                                       |
| `click:volumeUp`, `click:volumeDown`            | one tenth of full per press, climbing from zero when muted rather than jumping back — for a volume UI with no slider, or a `keys` entry; the samples bind them to the up and down arrows |
| `click:toggleMute`                              | mute, and back to the level it remembered                                                                                                        |
| `click:toggleCaptions`                          | captions on and off; there has to be a caption track for the button to have anything to toggle — the one marked `default`, or the first written  |
| `click:goLive`                                  | back to the live edge of a stream with a rewind window; does nothing on a file, or on a stream with no window to have left                       |
| `click:toggleFullscreen`                        | the player element, or the video itself on an iPhone, which has never allowed anything else                                                      |

**On `<media-player>` itself:**

| Write                                             | Does                                                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `keydown:onKeyDown`, `keydown@document:onKeyDown` | a press clicks the control whose `key` claims it — the two scopes are [Keys the buttons carry](#keys-the-buttons-carry)        |
| `mousemove:showControls`                          | video only: bring the faded control row back, and start the timer that takes it away again                                     |
| `fullscreenchange@document:onFullscreenChange`    | keeps `is-fullscreen` honest when the browser leaves fullscreen without going through your button — <kbd>Escape</kbd>, usually |

Two names never appear in an `on=`: `seekTo(seconds)` and `seekBy(seconds)` take a number,
which is the one thing an event listener has none of, so they are for script. `play()` and
`pause()` are public beside them for script too — on a button it is `togglePlay` you want,
which is the pair of them behind one control.

## State you can bind

| Key                                       | Holds                                                                                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `currentTime`, `duration`, `remaining`    | seconds; pipe them through `\|time` for `mm:ss`                                                                                     |
| `buffered`                                | how far ahead the browser has loaded, **in seconds** — same scale as `duration`, so it goes straight on the `<progress>`'s `value`  |
| `seekableStart`, `seekableEnd`            | the reachable window of a live stream, in absolute seconds — a scrubber's `min` and `max` on a stream with a rewind window          |
| `behindLive`                              | seconds between playback and the live edge; `0` at the edge                                                                         |
| `volumePercent`                           | `0`–`100`, for a volume slider's `value`                                                                                            |
| `playLabel`, `muteLabel`, `captionsLabel` | what the button should say it does next                                                                                             |
| `captionText`                             | the active cue                                                                                                                      |
| `timeFormatter`                           | the `formatTime` function itself — hand it to the scrubber's `prop#format` and the value bubble reads `01:12` instead of `72`       |

Three formatters pipe a bind: `|time` writes seconds as a clock, `|floor` a whole number,
and `|pressed` a boolean as the literal `"true"`/`"false"` that a toggle's `aria-pressed`
wants — the captions and fullscreen buttons in the video sample are wired with it. No
sample pipes `|floor` any more — the scrubber's `step="any"` wants the fraction — but it
stays for markup written against an earlier version, which piped it on the scrubber's
binds.

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
`volume-down`, `mute`, `unmute`, `fullscreen`, `go-live`, `captions-on`, `captions-off`. Both
bubble
from the element, not from `document`. A `fullscreen` event says which way in `value` —
`true` entering, `false` leaving — and a volume drag settles into one `volume` event, not
one per pixel.

## Against the alternatives

Drawn on this player's axes, which is the caveat to read it with: a row is here because this
project has an opinion about it, and the rows it has no answer for are the ones the others
win.

|                                    | media-player                                            | [Plyr](https://github.com/sampotts/plyr)             | [media-chrome](https://github.com/muxinc/media-chrome) | [Vidstack](https://vidstack.io)      | [Video.js](https://videojs.com)        |
| ---------------------------------- | ------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ | ------------------------------------ | -------------------------------------- |
| **Size, gzipped**                  | **13.5 kB**                                             | 32 kB                                                | 42 kB                                                  | 40 kB                                | 196 kB                                 |
| **You write the controls**         | yes, as the only way                                    | no — a `controls` array, or an HTML string in config | yes, from its components                               | no — layouts                         | no                                     |
| **Shadow DOM**                     | never                                                   | never                                                | yes                                                    | yes                                  | no                                     |
| **Page plays with no script**      | yes                                                     | yes, if you keep `controls`                          | no — its starter `<video>` has none                    | no                                   | yes                                    |
| **Your CSS reaches every part**    | yes                                                     | yes                                                  | through `::part()` and the variables it chose          | partly                               | yes                                    |
| **Scrubber frame previews**        | yes — your box, the browser's VTT parser                | yes — its own VTT parser                             | yes, inside its time range                             | yes — VTT, sprites, storyboards      | a community plugin                     |
| **Built from reusable primitives** | yes — the sliders ship separately                       | no                                                   | no                                                     | no                                   | no                                     |
| **YouTube, Vimeo, HLS, DASH**      | **no**                                                  | YouTube, Vimeo                                       | via a provider                                         | all of them                          | via plugins                            |
| **Ecosystem**                      | none                                                    | large                                                | Mux's                                                  | large                                | the largest                            |
| **Pick it when**                   | the markup is yours and must survive without the script | you want one line and a good default                 | you want composable parts and accept a shadow root     | you are building an app around media | you need every format and every plugin |

Sizes are each package's browser bundle, gzipped: Plyr and Video.js as published
(`dist/plyr.min.js`, `dist/video.min.js`), media-chrome bundled from its package entry with
esbuild, Vidstack from `cdn.vidstack.io/player`. This one is `dist/media-player.min.mjs`,
which carries hydrargyri and the four elementals inside it — everything the player needs
except the stylesheets: its own structure sheet is 0.8 kB and the theme 1.4 kB more, the
elementals' four structure sheets 1.3 kB and their three themes 2.5 kB more, each gzipped on
its own the way a browser fetches it. Every one of those numbers moves with a release;
measure before quoting.

Where this loses is the bottom of that table, and it loses there on purpose. **Plyr and
Vidstack are the right answer for YouTube and Vimeo**, and Video.js for the long tail of
formats and plugins. None of that is planned here.

## Live, and the streams it does not carry

A live stream has no end, and browsers disagree about how to say that: some report
`Infinity` for the duration, some a number in the billions. Anything at or above 2³² is read
as endless here. `is-live` goes on the element and `duration` reads `0` rather than a bogus
number, so a clock bound to it stays honest. Bind `isLive:if` on a **Live** badge and the row
says which kind of thing it is holding.

What can be reached inside that stream is a separate question, and the browser answers it.
`seekable` is the platform saying which seconds still exist — a stream with a rewind window
reports one range that slides forward as segments expire, and a stream without one reports
something too narrow to call a window, or nothing at all before the first segment lands. So
the window is what decides, not the endlessness: `seekTo`, `skipForward`, `skipBackward` and
a drag on the scrubber all work inside it and all decline without it. `goLive` is the way
back to the edge. `stop` refuses either way — a window does not give a stream a beginning,
only an oldest second that has not expired yet, and landing a listener there is not going
home.

That is the whole of what ships. HLS and DASH are not here and are not coming: a manifest
needs a third-party script driving Media Source Extensions, and a script driving the media
element is the opposite of the bargain this page opens with.

It composes anyway, and nothing here was written to make it. The element never creates, moves
or replaces the media element and never touches its `src`: it reads the one you wrote and
wires your controls to it, and a third-party script writing that same `src` is invisible to
it — which is why the recipe below needs no seam to hold hls.js, and why hls.js is the only
part of it this project does not ship.

The scale is the markup's, which is what keeps `duration` meaning one thing everywhere. The
element publishes three absolute numbers — `seekableStart`, `seekableEnd` and `behindLive` —
and a scrubber over a rewind window binds the first two where a file's scrubber binds
`duration`. Here is a whole live player, that binding and hls.js included:

```html
<media-player
  tabindex="0"
  role="region"
  aria-label="Live stream"
  on="keydown:onKeyDown"
>
  <video controls playsinline></video>

  <toolbar-elemental class="media-player-controls" aria-label="Playback" bind="isReady:if">
    <slider-elemental class="media-player-scrubber" bind="timeFormatter:prop#format">
      <input
        type="range"
        step="any"
        aria-label="Seek"
        disabled
        bind="seekableStart:attr#min;seekableEnd:attr#max;currentTime:prop#value"
        on="pointerdown:beginScrub;keydown:beginScrub;input:scrub;change:seek;pointerup@document:endScrub;keyup:endScrub"
      />
    </slider-elemental>

    <button on="click:togglePlay" bind="playLabel:attr#aria-label" key="k" disabled>▶</button>
    <button on="click:skipBackward" aria-label="Back ten seconds" disabled>−10s</button>
    <button on="click:goLive" disabled>Go live</button>
    <span bind="isLive:if">LIVE</span>
    <span bind="behindLive|time">00:00</span>
  </toolbar-elemental>
</media-player>

<style>
  /* The optional theme hides the scrubber on any live stream — it was written when a live
     stream had nothing to seek. A rewind window wants it back. */
  media-player[is-live] .media-player-scrubber {
    visibility: visible;
  }
</style>

<script type="module">
  import "media-player-element";
  import Hls from "hls.js";

  const video = document.querySelector("media-player video");
  const manifest = "/live.m3u8";

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = manifest; // Safari and iOS play HLS without help
  } else if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(manifest);
    hls.attachMedia(video);
    addEventListener("pagehide", () => hls.destroy(), { once: true });
  }
</script>
```

The `disabled` attributes are the author being honest: nothing on that row can do anything
until a manifest resolves, and the element takes them off when it does. `hls.destroy()` on
the way out is the one piece of housekeeping a stream needs that a file does not — a live
loader keeps refetching the manifest otherwise.

Those three refresh on `timeupdate` and on `progress` — about four times a second while
playing, which is the rate a window that slides in whole segments actually changes at, rather
than the sixty a second a file's clock is painted at. What is deliberately absent is a live
edge tolerance: nothing here decides how many seconds behind still counts as *at* the edge,
because that number is a design decision about a badge, and the badge is yours. Bind
`behindLive` and pick it in your own stylesheet.

Two more things stay off on a stream, window or not: the OS lock screen gets no position, and
the scrubber's frame previews do nothing — the spec wants a finite duration for the first,
and a thumbnail sheet is cut from a file that has ended for the second.

**DASH swaps the script and nothing else.** The markup above, the `<style>` and every binding
stay exactly as they are — only the loader changes, and the native branch goes, because no
browser plays DASH without a library:

```js
import "media-player-element";
import { MediaPlayer } from "dashjs";

const video = document.querySelector("media-player video");
const player = MediaPlayer().create();

player.initialize(video, "/live.mpd", false);
addEventListener("pagehide", () => player.destroy(), { once: true });
```

What that swap does not carry is the live half. Where hls.js reports `Infinity` for a live
manifest, dash.js reports the length of the rewind window instead: a manifest declaring
`timeShiftBufferDepth="PT10M"` arrived here as `634.566`, a number rather than an
endlessness. `is-live` therefore never comes on, and a live DASH stream plays as a ten-minute
file — the scrubber above works, but there is no **Live** badge, no `goLive`, no
`behindLive`, and the duration slides as segments expire. Telling the two apart would mean
asking a library what kind of stream it is, and this element knows about no libraries. So:
either loader for playback, hls.js if the live half matters. And with the script blocked a
DASH page shows an empty box in every browser, Safari included — there is no native path to
degrade onto at all.

Order does not matter, which is the part that usually costs a library an option. Metadata
arriving is five different events and all of them route to the same idempotent handler, so
the controls come up whenever the manifest resolves — before this element upgrades or long
after. A live manifest reports `Infinity`, which lands on `is-live` with no extra wiring.

What you give up is the promise at the top of this page, and it is HLS that takes it rather
than this element:

| With the `<script>` blocked | A bare `<video src="stream.m3u8" controls>` |
| --------------------------- | ------------------------------------------- |
| Safari, iOS                 | plays — HLS is native there                 |
| Chrome, Edge, Firefox       | nothing; an empty box                       |

A progressive file listed after the manifest is the fallback, and hls.js overrides it by
setting `src` in the browsers that need it:

```html
<video controls playsinline>
  <source src="/stream.m3u8" type="application/vnd.apple.mpegurl" />
  <source src="/episode.mp4" type="video/mp4" />
</video>
```

Captions come along. A streaming library adds its caption track to the media element rather
than as a `<track>` you wrote, and it arrives after this element has upgraded — so the track
list is what is read, and `addtrack` is what says to read it again. The captions button
lights up when the track lands, on whatever the page remembered from last visit. What is not
here is a language picker: the first caption track found is the one that stays, because
switching between them would need a control to switch with, and naming that control is a
decision for markup rather than for this element.

The late track is covered by a test, against a stated `textTracks` list. Nothing else here
can be, because jsdom implements no Media Source Extensions — so what stands in for the test
is a check by hand, and this one was run: a live manifest with a ten-minute rewind window, in
Safari, which plays HLS natively, and in Chrome, which reaches it through hls.js. In both the
first duration the element saw was `Infinity`, so `is-live` came on rather than latching a
bogus number; the window drove the scrubber; skipping backwards landed inside it and stayed.
The DASH figure above came out of the same check, in Chrome, against two dynamic manifests.
[CONTRIBUTING.md](https://github.com/stamat/media-player/blob/main/CONTRIBUTING.md) says how
to run that check yourself. It is not run on every release, so if it breaks for you, that is
an issue worth filing.

## What it does not do

Each of these is a decision, not a gap waiting for a pull request.

- **Generate controls.** There is no control bar to configure, because configuring one is
  the problem this exists to avoid. The sample above is the starter — copy it and delete
  what you do not want.
- **Streaming formats.** HLS, DASH and the YouTube and Vimeo iframe APIs are all a
  third-party script driving an element you did not write, which is the opposite of the
  bargain here. Live streams themselves are handled, and hls.js composes with this element
  without it shipping a line about it —
  [Live, and the streams it does not carry](#live-and-the-streams-it-does-not-carry) says how,
  and what it costs.
- **Ship a keyboard map of its own.** Nothing is bound until the author writes it: `key` on
  a control the page already shows, already names and already disables, and `keys` for the
  action no visible control carries — `volumeUp` behind a volume that is a slider. A `keys`
  entry is the expensive half: a binding nothing on the page announces, so what it maps is
  the author's to say. What stays refused is the ready-made set — a default `k`, `m`, `f`
  map would spend letters on every page that never asked for them.
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
ignores — the thirteen CSS hooks stay documented for a stylesheet and are marked hidden for
the panel, because they are the element's to write and not an author's.

What any given editor does with it is its own business, and none of it is required to use
the element: the manifest is a description, not a runtime.

## Questions

<div class="faq">
<details>
<summary id="faq-no-js"><h3>Does the page still play with the script blocked?</h3></summary>

Yes, and that is the one claim everything else is arranged around. You write
`<audio controls>` or `<video controls>`; this element takes `controls` off when it upgrades
and puts it back if it is ever removed from the DOM. It never creates, moves or replaces the
media element, so with no script there is still a working native player where you put one.

The exception is a streaming manifest, and it is the format's doing rather than this
element's — see [Live, and the streams it does not carry](#live-and-the-streams-it-does-not-carry).

</details>
<details>
<summary id="faq-streaming"><h3>Can I use it with HLS or DASH?</h3></summary>

Nothing here ships either, and neither is coming. But both compose, and no seam was written
to make them: attach hls.js or dash.js to the `<video>` you wrote, because this element only
ever reads the media element and never touches its `src`.

One half does not survive DASH. hls.js reports an endless duration for a live manifest and
dash.js reports the rewind window's length, so `is-live` never comes on there. The worked
recipe and that limit are in
[Live, and the streams it does not carry](#live-and-the-streams-it-does-not-carry).

</details>
<details>
<summary id="faq-controls"><h3>Where is the default control bar?</h3></summary>

There is not one, and there will not be. A control bar this element could draw would need an
option to reorder it, an option to drop a button, an option to pass an icon — which is
templating in JavaScript wearing a smaller hat, and the thing this exists to avoid. The
samples on this page are the starter: copy one, delete what you do not want, and it is
already your markup in your stylesheet.

</details>
<details>
<summary id="faq-live-scrubber"><h3>My scrubber disappeared on a live stream</h3></summary>

The optional theme hides it — `media-player[is-live] .media-player-scrubber` — because it was
written when a live stream had nothing to seek. A stream with a rewind window does, so one
line in your own sheet brings it back. It is in the live recipe, with the reason.

</details>
<details>
<summary id="faq-captions"><h3>The captions button never appears</h3></summary>

There has to be a caption track for the button to have anything to toggle — `captions`,
`subtitles`, or a bare `<track>`, which the platform reads as subtitles. A
`<track kind="metadata">` for thumbnails is not one, and neither are chapters or
descriptions. If several are written, the one marked `default` wins, and otherwise the
first. A track a streaming library adds after the upgrade
counts too — the element watches `addtrack` for exactly that — but the button only lights
once the track lands, which on a stream can be a moment after playback starts.

</details>
<details>
<summary id="faq-two-players"><h3>Two players on one page share a volume</h3></summary>

They share a `storage-key`, which defaults to `media-player`. Set it per player and each
remembers its own volume, mute and captions choice. Storage failing outright — a Safari
private window, a blocking cookie policy — is swallowed on purpose: remembering a volume is a
nicety, and taking the page down over one is not.

</details>
<details>
<summary id="faq-shadow"><h3>Why light DOM rather than a shadow root?</h3></summary>

Because the page's CSS, the page's semantics and the page working before the script arrives
are the whole point. A shadow root would take your stylesheet's reach away from controls you
wrote yourself, which is a strange thing to do to markup that is already yours.

</details>
<details>
<summary id="faq-frameworks"><h3>Does it work inside React, Vue or Svelte?</h3></summary>

It is a standard custom element in the light DOM, so any framework that renders plain HTML
renders it. What this project does not ship is a wrapper component for any of them — the
markup contract is `on` and `bind` attributes, and those are attributes wherever they are
written.

</details>
</div>

## License

<p><a href="https://github.com/stamat/media-player/blob/main/LICENSE">MIT</a> ©
  <a href="https://github.com/stamat">Stamat</a>. The icons in the samples are
  <a href="https://lucide.dev">Lucide</a>, ISC.</p>
{% endset %}
{# The filter emits a bare `<nav><ul>`, so the disclosure is wrapped around it here rather
   than asked of it. Open, because twenty-two sections are the reason this exists — but two
   columns on a wide viewport, or the map is a screenful before the article starts. #}
<details class="toc-disclosure" open>
  <summary>On this page</summary>
  {{ body | toc }}
</details>
{{ body }}
