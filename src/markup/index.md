---
layout: poops-docs-theme/prose
title: Media Player
description: A media player you write in HTML — one custom element over the <audio> or <video> you already wrote.
---

# ▶ `<media-player>`

Most media player libraries take the player away from you. You hand over a `<video>` and a
config object, and get back someone else's control bar — their button order, their icons,
their class names. Changing the arrangement means learning a `controls` array, or passing an
HTML string into a config option.

This one works the other way. **You write the controls.** Buttons and range inputs in your
page, styled by your stylesheet, in the order you put them. The element wires them by name
and never touches their arrangement.

It is a rewrite of the media player I built at GitHub in 2022 as a passion project — the one still
[playing on long forgotten github.com pages](https://github.com/readme/podcast/powering-public-goods),
it was written in Catalyst and TypeScript, before the React era.
Now it is given a new life as open source, dogfooding [hydrargyri](https://github.com/stamat/hydrargyri) and
[book-of-elementals](https://github.com/stamat/book-of-elementals).

The sample below is the page's only copy of that markup, rendered in an isolated frame by
[`<code-preview>`](https://github.com/stamat/code-preview-element): press **Edit** and what
you type is what plays. The **Options** tab is generated from the `custom-elements.json` this
package ships — the eight attributes an author writes and the seven custom properties the
theme takes, each with its declared type. An attribute knob rewrites the markup above it, so
the code tab stays the truth; a custom property is not part of the sample, so it writes a
rule into the frame and prints that rule for you to copy. The sixteen attributes the element
writes for itself are left out: a knob spliced into the markup would not survive the next
`play`.

<!-- One line, and it has to be: markdown treats an unknown tag as a block only when its
     whole opening tag sits on a line of its own. Broken over four, the page prints it.
     The frame's padding drops to nothing on a narrow screen: 1.5rem a side renders it 48px
     narrower than the page a reader would paste this markup onto, enough to wrap the video
     row to a third line on a phone and show a defect the markup does not have. -->
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
           glides with playback instead of jumping once a second. `beginScrub` flips the
           step to whole seconds the moment a pointer or a seek key lands, and `endScrub`
           puts `any` back — a drag and the arrows move per second, the tooltip reads whole
           seconds regardless.
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
      <span class="media-player-elapsed"><span bind="currentTime|time">00:00</span> / <span bind="duration|time">00:00</span></span>
      <span class="media-player-remaining" bind="remaining|time">00:00</span>
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

    <!-- Speed, and an audio player is where it earns its place. A native `<select>`: the
         dropdown, its keyboard handling and the picker a phone puts up are the platform's,
         and the rates are `<option>`s you edit rather than a list this element holds. -->
    <tooltip-elemental>
      <select
        class="media-player-rate"
        aria-label="Speed"
        disabled
        bind="playbackRate:prop#value"
        on="change:setRate"
      >
        <option value="0.5">0.5&times;</option>
        <option value="1" selected>1&times;</option>
        <option value="1.25">1.25&times;</option>
        <option value="1.5">1.5&times;</option>
        <option value="2">2&times;</option>
      </select>
      <span>Speed</span>
    </tooltip-elemental>
  </toolbar-elemental>
</media-player>
```

</code-preview>

```js
import 'media-player-element';
```

<!-- The `-hljs` build, not the small one: this page's fences are highlighted at build time
     and it ships no runtime highlighter, so without the bundled copy the code would keep the
     colour it was baked with and stop recolouring the moment a reader typed. -->
<script src="js/code-preview-hljs.min.js" defer></script>

<!-- The options panel, a second bundle carrying no copy of the element. It is what turns the
     `manifest` on the previews above into controls; without it that attribute is inert and
     the samples render exactly as they did. -->
<script src="js/code-preview-options.min.js" defer></script>

Block the script and that markup is a plain `<audio controls>`. Not testable on this page:
the preview above is itself a custom element, so with scripting off there is nothing here but
the code block it was built from. Paste the sample into a file of your own to check it.

<p>That is the whole wiring model. <code>on</code> says what fires, <code>bind</code> says
  where state lands, and both hold names — never code — so there is nothing to evaluate and
  nothing for a Content Security Policy to object to. It rests on
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

## Two rows, and narrow screens

The scrubber is first in that markup on purpose. `style.css` gives it a whole flex line, so
the buttons and the clock wrap under it: the bar is two rows with no breakpoint to tune, and
a phone and a page-wide video get the same shape. In one row instead, the fixed-width parts
alone outgrow a 375px viewport and the scrubber is left with about twenty pixels to drag.

Two is the floor, not a promise. The line under the scrubber wraps again when what it carries
outgrows it, and the theme's buttons are 32px: the video sample's six of them and the clock
come to 306px, which is what a 360px phone leaves. Below that they wrap to a third row, and
the fix is to drop a control or fold part of the row away.

That is what the fold is for. Measured on the video sample with the theme loaded and the
volume slider already gone, the row still wraps to a third line at 425px of player width, and
dropping one control does not clear a 375px phone: speed takes it to 387px, picture-in-picture
to 385px. Two have to go, and the button costs a slot of its own — folding two buys back one
— so three go together: speed, captions, picture-in-picture. AirPlay makes four for a
different reason: it appears only when there is a device on the network, and folded, a phone
standing near a receiver is no longer the one phone whose row wraps. What is left is a 324px
row that keeps its second line down to 340px of player width.

```html
<disclosure-elemental class="media-player-more" open-when="container:(min-width: 30rem)">
  <button type="button" aria-label="More controls">…</button>
  <div class="media-player-more-region">
    <!-- speed, captions, picture-in-picture, play on a device -->
  </div>
</disclosure-elemental>
```

`open-when` is the whole arrangement, and the breakpoint is written once. `container:` in
front makes it measure the player rather than the viewport — the disclosure's own notation,
resolved against the same containment the volume drop and the clock swap read — because a
400px player in a wide desktop page crowds exactly like a phone, and a plain media query
cannot see that. Above the breakpoint the region is held open and the element reflects
`data-mode="pinned"`, which `style.css` reads to take the button away and give the region
`display: contents` — so a wide row is the row it always was, in the markup's own order,
with no extra box in the middle. It needs the disclosure's `container:` support; against an
older book-of-elementals the query reads as no query at all and the fold stays with its
button at every width — everything still reachable, one press further away.

Below it the button owns the region. Opening it swaps the line rather than growing the bar:
the transport, the clock and the mute step out, the four unfurl into their space, and the
caret slides along with them — turned around while open. The turn is the visible state and
the disclosure's own `aria-expanded` the announced one, so the button keeps the one name
written on it: a label that flipped to "Fewer controls" would tell a screen reader twice
what `aria-expanded` already said once. Whatever control ends the row, fullscreen
here, keeps its corner in both states, and the scrubber never leaves: seeking is not the
fold's to take away. A menu floating over the picture was rejected: inside the player's
`overflow: hidden` it clips on any ratio shorter than 16:9, and the player at the top of this
page is 2.4:1. The button comes first in the disclosure and the region after it, so the
sequence reads the way the row does. The tooltip cannot wrap this one button, because the
disclosure wants it as a direct child, so it names it with `for` instead — which makes
`more-controls` the one `id` in these samples: a page with two players renames it in one of
them, or both tooltips find the first.

Width is not the only thing that can make a fold pointless. One control behind the button
saves nothing — the button takes the slot the control gave up and charges a tap for what used
to be one press — so the element counts the region on connect, and a fold holding one or none
has its `open-when` rewritten to `all`. That pins it at every width. The count is the
markup's: a control the author hides at some width, or on `no-airplay`, is still one of the
fold's, so a row that empties out at runtime keeps its button. The attribute goes back the way
it was written if the player leaves the page.

The clock turns around at almost the same width. Below 21.25rem of player — where a 324px row
stops fitting with the duration in it — `current / duration` gives way to a single countdown
that ends on zero when the track does. `.media-player-elapsed` holds the pair,
`.media-player-remaining` the countdown, and the swap is two container-query rules in
`style.css`. That keeps the second line down to 294px of player width, which a 320px phone
clears.

The arrows skip what is folded, so a closed region is not a stretch of dead arrow presses:
`<toolbar-elemental>` walks only the controls that are on screen, and it walks onto the
speed `<select>` — part of the row's single tab stop, ←/→ stepping onto and off it while
↑/↓ stay the select's own, opening and stepping its list. Both need book-of-elementals
3.3.0, the floor this version asks for: 3.2.0 gave `open-when` its `container:` ruler,
3.2.1 shipped the file it lives in to source importers, and 3.3.0 taught the walk the
select — against an older one the select stands as a second tab stop the arrows step past.
`<media-player>` imports the
disclosure for you. A page that blocks the script has no control row at all; one whose
disclosure never defines gets the four controls sitting in the open — plus the caret, a
button that toggles nothing, since only the upgrade wires it and only the `data-mode` it
reflects hides it. The row this section started with, with one dead control in it.

The scrubber is moved in the markup rather than with `order` for the same reason. Reordering
a flex line visually leaves the tab sequence in the old order, and a keyboard user would read
the bar top-to-bottom while tabbing it bottom-to-top.

The row under it falls into two clusters: the transport with its clock at the start,
everything else at the end. A single `margin-inline-end: auto` on the clock opens the gap, so
the arrangement stays yours — the clock and everything before it goes left, everything after
it goes right, and moving the clock moves the divide. It sits on the clock rather than on the
control after it because a button wrapped in `<tooltip-elemental>` is not the flex item any
more, that element being `display: contents`, and a margin on the wrapper would land on a box
that does not exist. A row written without a clock matches that rule nowhere and comes out as
one cluster at the start — visibly wrong rather than quietly broken — and the fix is to put
the same `auto` on whichever control should close the left-hand group.

One thing changes under a coarse pointer — a phone, a tablet — and it is opt-out by
overriding the rule:

| What                        | Sheet       | Why                                                                                                                            |
| --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| The volume slider is hidden | `style.css` | 72px is not draggable by thumb, and the device has hardware volume keys that are. The mute button stays, so muting still works |

The buttons do not grow for the finger, and that is a choice with a cost. `theme.css` draws
a 32px button on every pointer: past [WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
the AA minimum of 24px, and short of [2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html),
the AAA 44px — Apple asks the same 44pt, Google 48dp. 44px was tried and the row could not
afford it: six targets and the clock come to 343px where a 393px phone gives the bar 338px,
so the fullscreen button wrapped to a third line and clawing it back cost the gap between
every button. If your row is short enough to pay for it, the AAA size is two declarations:

```css
@media (pointer: coarse) {
  media-player .media-player-controls button {
    min-width: 2.75rem;
    min-height: 2.75rem;
  }
}
```

## Playing with the script blocked

**Delete the `<script>` tag and the page still plays.** The `controls` attribute you wrote is
on the media element until this element upgrades and takes over. A script that 404s, a CDN
that is down, a browser that stopped at the first parse error — all of them leave a working
native player rather than a row of dead buttons.

That is not a nice-to-have, it is why the markup looks the way it does. A
`<media-player src="…">` that built its own `<audio>` would be a player that does not exist
until JavaScript says so.

## One element, both media

There is no separate audio player and video player. `<media-player>` reads which element you
wrapped and turns on the video half — poster, click-to-play overlay, click-to-pause on the
picture, captions, fullscreen, controls that fade out while playing — only when it wrapped a
`<video>`, or a custom element standing in for one, covered at the end of this section.

<!-- One line, and it has to be: markdown treats an unknown tag as a block only when its
     whole opening tag sits on a line of its own. Broken over four, the page prints it.
     The frame's padding drops to nothing on a narrow screen: 1.5rem a side renders it 48px
     narrower than the page a reader would paste this markup onto, enough to wrap the video
     row to a third line on a phone and show a defect the markup does not have. -->
<code-preview manifest="custom-elements.json" css="css/prose.min.css" theme-attribute="data-theme" head="&lt;style&gt;body{margin:0;padding:1.5rem}@media(max-width:30rem){body{padding:0}}&lt;/style&gt;&lt;script type='module' src='dist/media-player.min.mjs'&gt;&lt;/script&gt;">

```html
<media-player
  tabindex="0"
  role="region"
  aria-label="Video player"
  keys="ArrowUp:volumeUp;ArrowDown:volumeDown"
  on="mousemove:showControls;pointerdown:showControls;fullscreenchange@document:onFullscreenChange;keydown:onKeyDown"
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
      <span class="media-player-elapsed"><span bind="currentTime|time">00:00</span> / <span bind="duration|time">00:00</span></span>
      <span class="media-player-remaining" bind="remaining|time">00:00</span>
    </span>

    <tooltip-elemental>
      <button on="click:toggleMute" bind="muteLabel:attr#aria-label" disabled>
        <span class="media-player-volume-icon media-player-volume-icon-mute"
          ><svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="1 3 22 18"
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

    <!-- The four the row sheds first when it runs out of width for them. `open-when` holds
         them in the open on anything wider than a phone and hands them to the button below
         that, which the stylesheet takes away while the query holds — so a wide row is the row
         it always was, in the order written here. Needs book-of-elementals' disclosure, which
         this element imports for you. -->
    <!-- The button comes first so the tab order is the reading order: opening it puts the
         four controls right after it in the sequence. Unfolding still reads like a search
         field expanding — the caret slides left and the controls follow out of it — and
         the caret points at the fold, turning around while it is open. -->
    <disclosure-elemental class="media-player-more" open-when="container:(min-width: 30rem)">
      <!-- The one control whose tooltip cannot wrap it: the disclosure wants its button as
           a direct child and its region as the button's next sibling, so the tooltip sits
           after the region and names the button by `for` instead. -->
      <button type="button" id="more-controls" aria-label="More controls">
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
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <div class="media-player-more-region">
        <!-- Speed is a native `<select>`: the dropdown, its keyboard handling and the picker a
             phone puts up are the platform's, and the rates are `<option>`s you edit rather
             than a list this element holds. `no-rate` is the hook for hiding it where the
             media element has no `playbackRate` to set. -->
        <tooltip-elemental>
          <select
            class="media-player-rate"
            aria-label="Speed"
            disabled
            bind="playbackRate:prop#value"
            on="change:setRate"
          >
            <option value="0.5">0.5&times;</option>
            <option value="1" selected>1&times;</option>
            <option value="1.25">1.25&times;</option>
            <option value="1.5">1.5&times;</option>
            <option value="2">2&times;</option>
          </select>
          <span>Speed</span>
        </tooltip-elemental>

        <!-- The four a video adds, though the last of them is not video-only. The label stays
             put and `aria-pressed` carries the state — which is also the hook the theme keeps
             the hover flood on. `|pressed` turns the bind's boolean into ARIA's "true"/"false". -->
        <tooltip-elemental>
          <button
            on="click:toggleCaptions"
            aria-label="Captions"
            bind="captionsVisible:attr#aria-pressed|pressed"
            disabled
          >
            <!-- Two badges, one shown at a time off `captions-visible` — the same trick the
                 play/pause button uses. Outlined while captions are off, solid while they are
                 on, so the state survives a stylesheet with no accent in it. Both badges fill
                 the width of the `0 0 24 24` and the height of the picture-in-picture glyph —
                 `0..24` by `3..21`, the outline stroking to that edge and the solid filling to
                 it. Matching AirPlay's screen rather than its silhouette is the version that
                 looks wrong: the badge hangs nothing below itself, so at the screen's own size
                 it reads as the smaller button. Cropping the viewBox to the glyph does the
                 opposite of what it looks like — `meet` scales by whichever axis fits worse, so
                 a 22-wide crop comes out smaller than the square icons, not larger. -->
            <span class="media-player-captions-icon-off">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <rect x="1" y="4" width="22" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2" />
                <path d="M10.32 9.72A3 3 0 1 0 10.32 14.28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <path d="M17.52 9.72A3 3 0 1 0 17.52 14.28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </span>
            <!-- The letters are knocked out of the badge with `fill-rule="evenodd"` rather than
                 painted in a second colour, so whatever is behind the button shows through them
                 — the accent flood when it is pressed, the page when it is not. -->
            <span class="media-player-captions-icon-on">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" fill-rule="evenodd" d="M3 3h18a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm7.72 6.24A3.6 3.6 0 1 0 10.72 14.76L9.64 13.48A1.92 1.92 0 1 1 9.64 10.52Zm7.2 0A3.6 3.6 0 1 0 17.92 14.76L16.84 13.48A1.92 1.92 0 1 1 16.84 10.52Z" />
              </svg>
            </span>
          </button>
          <span><span bind="captionsLabel">Enable captions</span></span>
        </tooltip-elemental>
        <tooltip-elemental>
          <button
            on="click:togglePictureInPicture"
            aria-label="Picture in picture"
            bind="isPip:attr#aria-pressed|pressed"
            disabled
          >
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
              <rect width="10" height="7" x="12" y="13" rx="2" />
            </svg>
          </button>
          <span>Picture in picture</span>
        </tooltip-elemental>

        <!-- The one control here that is not the video's: the route carries an `<audio>` to
             a speaker the same way it carries a `<video>` to a screen. It is also the one
             with no second direction to press — the system picker is the way back as well as
             the way out — so it is `aria-haspopup` beside its `aria-pressed`, and the label
             never changes. The label says device rather than AirPlay because the same button
             lists Chromecasts in Chrome; the handler keeps the shorter name. Hidden where
             there is nothing to send to: the rule for that is under Attributes it writes.
             In the fold because it appears by network weather: out in the row, the one phone
             whose row wrapped was the one standing near a receiver. -->
        <tooltip-elemental>
          <button
            on="click:showAirplayPicker"
            aria-label="Play on a device"
            aria-haspopup="true"
            bind="isAirplay:attr#aria-pressed|pressed"
            disabled
          >
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1" />
              <path d="m12 15 5 6H7z" />
            </svg>
          </button>
          <span>Play on a device</span>
        </tooltip-elemental>
      </div>

      <tooltip-elemental for="more-controls">
        <span>More controls</span>
      </tooltip-elemental>
    </disclosure-elemental>
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
every sample in it is zero — so the mute button and the volume slider have nothing to act on
here. They are in the sample anyway, because this page is where a video player's row gets
copied from; the player further down is where they do something. Its one caption cue reads
`[Ambient sounds]`, which belongs to a longer cut of the same footage and is left as NASA
wrote it: enough to prove the CC wiring, no more.

The three handlers on the `<media-player>` itself are the video half's housekeeping.
`mousemove:showControls` makes the control row behave the way a video player's does: up while
the pointer moves, gone five seconds after it stops, and always up while the video is paused
or a focus ring is inside the row. A ring, not focus: a mouse click leaves focus on the button
it pressed, and a row pinned by that never fades once you have pressed play. The fade takes an
open fold with it, so the row that comes back is the compact one — unless focus is inside the
fold, which closing would drop on nothing.
`pointerdown:showControls` is the same for a pointer that cannot hover — a touch sends no
`mousemove` — and it reveals on the finger landing rather than lifting: the first tap
reveals and the second presses what it lands on, because the element will not pause on a tap
while the pointer cannot hover, and a row faded out takes no taps until it is back. Without
the wire the element still reveals on the tap's click, one beat later. `pointerdown` and not
`touchstart`, because a `touchstart` listener is one the browser must wait on before it may
scroll a page that starts the gesture on the player; a pointer listener never blocks the
scroll, with no option needed to say so.
`fullscreenchange@document:onFullscreenChange` keeps `is-fullscreen` honest when
<kbd>Escape</kbd> leaves fullscreen without the button being pressed. A fourth would bind the
keyboard — [Keys the buttons carry](#keys-the-buttons-carry) — which no sample on this page
switches on.

A click on the picture needs no handler in the markup: the element wires it, the same way it
wires the media element's events. Clicking a playing video pauses it and the overlay returns
over the frame it stopped on, so the big play button is up whenever there is something to
start, including while a paused video is being scrubbed.

Captions render into whatever binds `captionText`, with the track held `hidden` so the
browser's own caption box stays out of the way — which leaves your stylesheet in charge of
what captions look like. Position included: the structure sheet rests `.media-player-captions`
2rem off the bottom edge and lifts it `3.5rem` more, 5.5rem in all, which clears a two-row
control bar. The lift lasts as long as that bar is up, so a caption never sits held above a
row that has faded out. A taller bar, or one wrapped to a third row on a narrow phone, wants
the lift overridden in your own sheet.

The third thing it wraps is not a native element. YouTube, Vimeo, HLS and the rest each need a
third-party script, and this element ships none and knows none by name — what it knows is the
media API. Any element carrying that API goes where the `<video>` goes, marked
`class="media-player-media"`, because no tag name can say what an element answers to. Same
wires, same properties, same bargain: `controls` comes off at upgrade and goes back on
removal, which on these elements reloads their iframe with the platform's own chrome, and the
video half comes on unless the name ends in `-audio`. The structure sheet sizes it like a
`<video>` — full width, `16 / 9` until your sheet says otherwise; what the element does to
itself is its own.

### YouTube and Vimeo, from one tag

[`<video-background>`](https://github.com/stamat/video-background-element) speaks that API and
answers for all three sources from a single tag: the `src` decides whether the thing behind it
is YouTube, Vimeo or a plain video file. It is mine, so weigh the preference accordingly —
everything claimed for it below was measured in a browser, and the two players under this
paragraph are the measurement.

<code-preview css="css/prose.min.css" theme-attribute="data-theme" head="&lt;style&gt;body{margin:0;padding:1.5rem}@media(max-width:30rem){body{padding:0}}&lt;/style&gt;&lt;script src='https://cdn.jsdelivr.net/npm/video-background-element@1.1.0'&gt;&lt;/script&gt;&lt;script type='module' src='dist/media-player.min.mjs'&gt;&lt;/script&gt;">

```html
<style>
  /* `unstyled` drops the element's own sheet, and `load-background` places the thumbnail
     through it. Two declarations buy that back; without them the picture tiles. */
  media-player video-background { background-size: cover; background-position: center; }
</style>

<media-player tabindex="0" role="region" aria-label="YouTube player" media-title="Family Guy: McStroke (Clip)" artist="TBS" on="mousemove:showControls;pointerdown:showControls;fullscreenchange@document:onFullscreenChange">
  <video-background class="media-player-media" unstyled fit-box load-background lazyloading pause-offscreen="false" autoplay="false" loop="false" muted="false" src="https://www.youtube.com/watch?v=UIyoNvInzCI"></video-background>
  <button class="media-player-overlay" on="click:togglePlay" aria-label="Play"></button>
  <toolbar-elemental class="media-player-controls" aria-label="Playback" bind="isReady:if">
    <slider-elemental class="media-player-scrubber" tooltip="thumb track" bind="timeFormatter:prop#format">
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
    <span class="media-player-time"><span class="media-player-elapsed"><span bind="currentTime|time">00:00</span> / <span bind="duration|time">00:00</span></span> <span class="media-player-remaining" bind="remaining|time">00:00</span></span>
    <tooltip-elemental>
      <button on="click:toggleMute" bind="muteLabel:attr#aria-label" disabled><span class="media-player-volume-icon media-player-volume-icon-mute"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg></span><span class="media-player-volume-icon media-player-volume-icon-mid"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/></svg></span><span class="media-player-volume-icon media-player-volume-icon-full"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/></svg></span></button>
      <span bind="muteLabel">Mute</span>
    </tooltip-elemental>
    <slider-elemental class="media-player-volume" tooltip="thumb"><input type="range" min="0" max="100" step="5" aria-label="Volume" disabled bind="volumePercent:prop#value" on="input:setVolume" /></slider-elemental>
    <tooltip-elemental>
      <button on="click:toggleFullscreen" aria-label="Fullscreen" bind="isFullscreen:attr#aria-pressed|pressed" disabled><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg></button>
      <span>Fullscreen</span>
    </tooltip-elemental>
  </toolbar-elemental>
</media-player>
```

</code-preview>

Vimeo is that markup with a Vimeo link in it. Nothing else moves — not the script tag, not
the attributes, not one line of the control row. Press **Edit** on either and paste the other
platform's link over the `src` to watch that happen:

<code-preview css="css/prose.min.css" theme-attribute="data-theme" head="&lt;style&gt;body{margin:0;padding:1.5rem}@media(max-width:30rem){body{padding:0}}&lt;/style&gt;&lt;script src='https://cdn.jsdelivr.net/npm/video-background-element@1.1.0'&gt;&lt;/script&gt;&lt;script type='module' src='dist/media-player.min.mjs'&gt;&lt;/script&gt;">

```html
<style>
  /* `unstyled` drops the element's own sheet, and `load-background` places the thumbnail
     through it. Two declarations buy that back; without them the picture tiles. */
  media-player video-background { background-size: cover; background-position: center; }
</style>

<media-player tabindex="0" role="region" aria-label="Vimeo player" media-title="Minions: Paint" artist="Vimeo Staff Picks" on="mousemove:showControls;pointerdown:showControls;fullscreenchange@document:onFullscreenChange">
  <video-background class="media-player-media" unstyled fit-box load-background lazyloading pause-offscreen="false" autoplay="false" loop="false" muted="false" src="https://vimeo.com/137250145"></video-background>
  <button class="media-player-overlay" on="click:togglePlay" aria-label="Play"></button>
  <toolbar-elemental class="media-player-controls" aria-label="Playback" bind="isReady:if">
    <slider-elemental class="media-player-scrubber" tooltip="thumb track" bind="timeFormatter:prop#format">
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
    <span class="media-player-time"><span class="media-player-elapsed"><span bind="currentTime|time">00:00</span> / <span bind="duration|time">00:00</span></span> <span class="media-player-remaining" bind="remaining|time">00:00</span></span>
    <tooltip-elemental>
      <button on="click:toggleMute" bind="muteLabel:attr#aria-label" disabled><span class="media-player-volume-icon media-player-volume-icon-mute"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg></span><span class="media-player-volume-icon media-player-volume-icon-mid"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/></svg></span><span class="media-player-volume-icon media-player-volume-icon-full"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/></svg></span></button>
      <span bind="muteLabel">Mute</span>
    </tooltip-elemental>
    <slider-elemental class="media-player-volume" tooltip="thumb"><input type="range" min="0" max="100" step="5" aria-label="Volume" disabled bind="volumePercent:prop#value" on="input:setVolume" /></slider-elemental>
    <tooltip-elemental>
      <button on="click:toggleFullscreen" aria-label="Fullscreen" bind="isFullscreen:attr#aria-pressed|pressed" disabled><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg></button>
      <span>Fullscreen</span>
    </tooltip-elemental>
  </toolbar-elemental>
</media-player>
```

</code-preview>

Both frames load one plain `<script>`, not a module, and there is no `/+esm` to remember: the
published bundle carries its one dependency inside it, so no bare import is left for the
browser to resolve.

```html
<script src="https://cdn.jsdelivr.net/npm/video-background-element@1.1.0"></script>
```

The eight attributes talk the element out of being a background, which is the one thing it was
written to be. `unstyled` drops the absolute, full-bleed positioning it would otherwise take,
and the `position: relative` it would write onto its parent, so it sits in the flow and the
structure sheet's `16 / 9` sizes it. `fit-box` fills that box instead of overscanning past it:
the overscan exists to push a platform's edge chrome out of a background's crop, and here the
box _is_ the picture. A background autoplays, loops and starts muted; a player does none of
the three until told to, which is what `autoplay="false"`, `loop="false"` and `muted="false"`
say. `load-background` is the poster — the element hides its own first frame until playback
starts, so without it the box is blank until you press play. `lazyloading` puts
`loading="lazy"` on the iframe, which keeps the two embeds off this page until they scroll
into view. `pause-offscreen="false"` takes the scroll gate off: a background stops itself the
moment it leaves the viewport, which is unwanted once somebody has pressed play. Written off,
the element builds no `IntersectionObserver` at all. It cannot start anything on its own
either, because that path is gated on `autoplay`, which is off. This element has an attribute
of the same name and the opposite default, [below](#attributes-it-writes).

**What those two frames cost.** Every other sample on this page runs on files this repository
built, and the only thing the page itself fetches from elsewhere is the Tears of Steel video
further down. These two do not: inside each frame the browser pulls
`video-background-element` from jsdelivr, then an embed from `youtube-nocookie.com` or
`player.vimeo.com` — the privacy-preserving domains, that element's `no-cookie` default, with
`dnt=1` on the Vimeo one. The posters go further: YouTube's thumbnail comes from
`img.youtube.com`, Vimeo's from `vumbnail.com`, a proxy the element falls back on because
Vimeo publishes no thumbnail URL you can build from an id. The frames are not a sandbox:
`<code-preview>` renders through `srcdoc` with no `sandbox` attribute, so the element's script
runs on this origin like every other script here. What the nesting does buy is that the embed
inside is cross-origin and can reach nothing out here, and that neither iframe loads until you
scroll to it. If that is not a trade you want on your own page, drop `load-background`, put an
`<img class="media-player-poster">` you host in its place, and nothing else in the recipe
moves.

### Every other platform

`<video-background>` stops at three sources. HLS, DASH, Wistia, Twitch and the long tail live
in [media-elements](https://github.com/muxinc/media-elements) instead — one element per
platform, `<youtube-video>`, `<vimeo-video>`, `<hls-video>` and a dozen more, each with the
media API on it, each dropped in the same slot and marked the same way.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/youtube-video-element@1/+esm"></script>

<media-player tabindex="0" on="mousemove:showControls;pointerdown:showControls;fullscreenchange@document:onFullscreenChange">
  <youtube-video
    class="media-player-media"
    controls
    src="https://www.youtube.com/watch?v=UIyoNvInzCI"
  ></youtube-video>
  <!-- the overlay and the control row from the samples above, copied whole -->
</media-player>
```

`/+esm` is not decoration: the package's plain build imports a helper by bare name, which a
browser cannot resolve, so the element never defines — this one waits on it and nothing
appears in the console. The `+esm` build has the import rewritten.

Which route to take, both measured under this player against the same 58-second YouTube clip:

| | `<video-background>` | media-elements |
| --- | --- | --- |
| **YouTube, Vimeo, a video file** | one tag, chosen by `src` | `<youtube-video>`, `<vimeo-video>`, and a plain `<video>` — a separate script each |
| **HLS, DASH, and the long tail** | no | `<hls-video>`, `<dash-video>`, and a dozen more |
| **How it loads** | one plain `<script>`, dependency bundled in | `<script type="module">`, and `/+esm` on jsdelivr or it never defines |
| **Gzipped** | 10.2 kB, all three sources | 3.8 kB for YouTube alone, and again for each further platform |
| **Clock and scrubber** | yes | yes |
| **Buffered bar** | never fills | fills — 37s of 58 read on the clip above |
| **Captions** | no `textTracks` at all | a `textTracks` list that stayed empty here |
| **Whose it is** | mine | Mux's |

Take media-elements when the format decides it: HLS and DASH have no other answer here, and
one platform on a page is the smaller download either way.

### What the embed costs, either way

**Playing without the script goes first**, and it is now the embed's to keep rather than this
element's. Until the third-party script runs, the box is blank the way a
`<video src="stream.m3u8">` is in Chrome until hls.js runs: a poster stands there, with
nothing under it to play.

The click on the picture changes hands too. The structure sheet gives a `.media-player-media`
no pointer input, because a cross-origin iframe keeps every click it gets and passes nothing
out, so the click lands on the player's own box and pauses, as on a `<video>`. `is-live` never
comes on for either route: that reads `seekable`, and an embed has none.

The buffered bar is `<video-background>`'s alone, and it is silent rather than broken: the bar
is painted from `progress`, which that element does not emit, so it never fills. YouTube's
loaded fraction sits on the element the whole time with no event announcing it. A
`<youtube-video>` does emit one, and its bar fills.

Captions are neither route's. A `<video-background>` has no `textTracks` at all, so the button
toggles nothing. A `<youtube-video>` has the list and it came back empty on this clip; on
another video it filled with five entries carrying no cues, which put none on screen. Whatever
the platform is drawing over its own picture is not arriving here as a track this element can
read, so the captions button and the scrubber's frame previews have nothing behind them on
either route.

Speed and picture-in-picture go the same way, and the element says so. An embed gets
`no-rate`, because writing `playbackRate` on an element that does not implement it lands as an
own property and reads the new number back — a control that lies is worse than one that is
missing — and `no-pip`, because the floating window is the browser's to open over a `<video>`
and there is no `<video>` here. That is why the rows in those two frames are three controls
shorter than the starter above. Bind them anyway and they render, focus and announce
themselves correctly while doing nothing.

Script order does not matter: an embed that upgrades after the player did is left alone until
it has, then read the same way. Neither frame above controls which script the browser finishes
with first, so both are the demonstration.

Two of those costs are visible in the frames rather than described: the buffered bar never
fills, and the captions button is the one control missing from a row otherwise copied whole
from the starter. Put it back and it renders, focuses and announces itself correctly, and
toggles nothing — which is worse than not shipping it.

## A twelve-minute file, and what preload costs

Twelve seconds proves the wiring and nothing about the seeking. A file that short never
buffers, and a clock reading `00:00 / 00:12` never needs the minutes it can show. So here is
the same row over twelve minutes of Tears of Steel, and this one is not in an editable frame:
it is the page's own DOM, upgraded by the module tag sitting under it. Block that tag and what
is left is a plain `<video controls>`, so
[playing with the script blocked](#playing-with-the-script-blocked) is testable right here.

<!-- One line, and it has to be: the whole opening tag of an unknown element must sit on a
     line of its own or markdown prints it instead of rendering it. Same trap as code-preview
     above, and the reason this player's attributes are not broken up for readability. -->
<media-player tabindex="0" role="region" aria-label="Video player" keys="ArrowUp:volumeUp;ArrowDown:volumeDown" media-title="Tears of Steel" artist="Blender Foundation" on="mousemove:showControls;pointerdown:showControls;fullscreenchange@document:onFullscreenChange;keydown:onKeyDown">
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
    <span class="media-player-time"><span class="media-player-elapsed"><span bind="currentTime|time">00:00</span> / <span bind="duration|time">00:00</span></span> <span class="media-player-remaining" bind="remaining|time">00:00</span></span>
    <tooltip-elemental>
      <button on="click:toggleMute" bind="muteLabel:attr#aria-label" disabled><span class="media-player-volume-icon media-player-volume-icon-mute"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg></span><span class="media-player-volume-icon media-player-volume-icon-mid"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/></svg></span><span class="media-player-volume-icon media-player-volume-icon-full"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="currentColor" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/></svg></span></button>
      <span bind="muteLabel">Mute</span>
    </tooltip-elemental>
    <slider-elemental class="media-player-volume" tooltip="thumb"><input type="range" min="0" max="100" step="5" aria-label="Volume" disabled bind="volumePercent:prop#value" on="input:setVolume" /></slider-elemental>
    <!-- Speed, picture-in-picture, captions and the device button fold away under one button
         where the row runs out of width; `open-when` puts them back in the row above 30rem.
         Captions moved up beside them, so the four the button carries are the four written
         together. -->
    <disclosure-elemental class="media-player-more" open-when="container:(min-width: 30rem)">
      <button type="button" id="more-controls" aria-label="More controls"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
      <div class="media-player-more-region">
        <tooltip-elemental>
          <select class="media-player-rate" aria-label="Speed" disabled bind="playbackRate:prop#value" on="change:setRate"><option value="0.5">0.5&times;</option><option value="1" selected>1&times;</option><option value="1.25">1.25&times;</option><option value="1.5">1.5&times;</option><option value="2">2&times;</option></select>
          <span>Speed</span>
        </tooltip-elemental>
        <tooltip-elemental>
          <button on="click:togglePictureInPicture" aria-label="Picture in picture" bind="isPip:attr#aria-pressed|pressed" disabled><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"/><rect width="10" height="7" x="12" y="13" rx="2"/></svg></button>
          <span>Picture in picture</span>
        </tooltip-elemental>
        <tooltip-elemental>
          <button on="click:toggleCaptions" aria-label="Captions" bind="captionsVisible:attr#aria-pressed|pressed" disabled><span class="media-player-captions-icon-off"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10.32 9.72A3 3 0 1 0 10.32 14.28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M17.52 9.72A3 3 0 1 0 17.52 14.28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span><span class="media-player-captions-icon-on"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M3 3h18a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm7.72 6.24A3.6 3.6 0 1 0 10.72 14.76L9.64 13.48A1.92 1.92 0 1 1 9.64 10.52Zm7.2 0A3.6 3.6 0 1 0 17.92 14.76L16.84 13.48A1.92 1.92 0 1 1 16.84 10.52Z"/></svg></span></button>
          <span bind="captionsLabel">Enable captions</span>
        </tooltip-elemental>
        <tooltip-elemental>
          <button on="click:showAirplayPicker" aria-label="Play on a device" aria-haspopup="true" bind="isAirplay:attr#aria-pressed|pressed" disabled><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/><path d="m12 15 5 6H7z"/></svg></button>
          <span>Play on a device</span>
        </tooltip-elemental>
      </div>
      <tooltip-elemental for="more-controls"><span>More controls</span></tooltip-elemental>
    </disclosure-elemental>
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

The captions are the Blender Foundation's own English subtitles, served from this repository
rather than from Blender's. A `<track>` cannot read the file up there: it is SRT, it comes
back as `application/octet-stream` under `nosniff`, and it carries no
`access-control-allow-origin` while a track fetch is CORS-mode whatever the media element
says. So the cues were converted to WebVTT once and committed beside the poster, which is the
trip a third-party caption track takes onto any page. The last cue ends at `09:27` and the
closing minutes carry none — that is what the file has, not something the element dropped.

There is no language picker, though that server holds twenty-four translations. The element
takes the first caption track and keeps it: switching language needs a control to switch it
with, and there is none here to name. It does remember whether you had captions on, along
with the volume, so this row comes back the way you left it. Unlike the Artemis clip, this one
has sound for the mute button and volume slider to move.

The file is not mine — it is on [Blender's download server](https://download.blender.org/), so
this page makes a third-party request for it, and `preload="metadata"` means that request
happens on load rather than on your first click.

That is deliberate, and the reason is a flaw in the file. It is 355 MiB laid out
`ftyp wide mdat moov`: the index is the _last_ 585 KiB, at byte 371,579,659, so the file is
not "fast start" and nothing can know the duration until a range request for the tail comes
back. `preload="none"` would defer that to the first click, and the click would look broken —
the control row is bound `isReady:if`, readiness needs a duration, so there would be no row to
press and nothing on screen would change until the tail arrived. Fetching the index up front
costs 585 KiB and buys a player that is a player before you touch it. The buffered bar and
the theme's buffering stripes then have something real to show, which a twelve-second local
file never gives them.

Attribution: _Tears of Steel_ and its subtitles are © the Blender Foundation, released under
[CC-BY 3.0](https://mango.blender.org/sharing/).

## Frames on the scrubber

A scrubber names a second; a frame says what is there. Every player that draws one charges the
same price, because there is no way around it: **the frames have to be cut from the video
beforehand.** No browser API hands out the picture at an arbitrary second without seeking
there, so the preview is a build step and a markup choice, never a flag.

The format is the one the field settled on — a WebVTT file whose cues map a time range to a
slice of a sprite sheet, `sprite.jpg#xywh=x,y,width,height` — so thumbnails cut for
[Plyr](https://github.com/sampotts/plyr), [Vidstack](https://www.vidstack.io) or
[media-chrome](https://www.media-chrome.org/docs/en/components/media-preview-thumbnail) work
here unchanged, and the other way round. Where those parse the file themselves, this element
hands it to the browser: the author writes it as a `<track kind="metadata">`, the same element
media-chrome asks for, and the element flips the track `hidden` so the browser fetches and
parses it. The only syntax read here is the `#xywh` fragment. Both video players above carry
the wiring — hover the twelve-minute one, since twelve seconds of frames barely change:

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

The box is yours, like every control on this page: position and paint come from `style.css`
and `theme.css`, and the element writes only what a stylesheet cannot know — the slice, the
tile's size, and where along the track the pointer is. A relative image path in the VTT
resolves against the VTT file, not against the page, so the pair travels as one directory.
The element never scales: **a tile is shown at the size it was cut**, because scaling needs
the sprite's natural size, which is unknown until the image loads, and a box that resizes
itself mid-hover is a bubble jumping under a still pointer. Cut the frames at the size the box
should be.

Cutting them is one command:
[`script/thumbs`](https://github.com/stamat/media-player-element/blob/main/script/thumbs) in this
repository, a bash script over `ffmpeg` and `ffprobe`, which wrote both sprites the players
above hover. The twelve-minute film cuts to 147 frames in a 637 KiB sheet. Each frame comes
from the middle of its cue rather than the start, so a hover is never more than half an
interval from the second it names:

```bash
script/thumbs movie.mp4          # movie-thumbs.jpg + movie-thumbs.vtt, a frame every 5 s
script/thumbs movie.mp4 2 160 5  # every 2 s, 160px wide, 5 to a sprite row
```

The interval is the cost knob, and the trade is lopsided: the sheet grows linearly with the
frame count while what a finer grid buys shrinks. A hover is off by at most half the interval,
and the click seeks frame-exact regardless, so the bubble only has to orient. One pixel of a
page-wide scrubber already spans about a second of a feature-length film. Tears of Steel
above, cut at every interval with 160px tiles:

| Interval                | Frames | Sheet   | A hover is off by at most |
| ----------------------- | ------ | ------- | ------------------------- |
| 10 s                    | 74     | 332 KiB | 5 s                       |
| **5 s** — the default   | 147    | 637 KiB | 2.5 s                     |
| 2 s                     | 368    | 1.6 MiB | 1 s                       |
| 1 s                     | 735    | 3.2 MiB | 0.5 s                     |

`script/thumbs movie.mp4 1` gets the last row; nothing in the element cares which you pick.
Your visitors pay for the sheet on their first hover, which is why this page ships the middle
of the table: below two seconds it outweighs the player's entire bundle several times over,
spent on a bubble whose job is orientation.

Copy the script out of the repository — it is not in the npm package, because a bash script in
a browser library's tarball is a file nobody runs from there. Anything else that emits the
`#xywh` format works the same; hosted pipelines like Mux and Cloudflare Stream generate it for
you.

Degradation: no `<track kind="metadata">`, no `.media-player-preview` box, cues not loaded
yet, or a live stream — each means no preview and no error, and the scrubber's own value
bubble still reads the time. A captions `<track>` is untouched by any of this, since a
`kind="metadata"` track is not one the captions button takes
([the FAQ names which are](#faq-captions)), so the two sit in one `<video>` without stepping
on each other. A blocked script does not enter into it: the preview box is `hidden` in the
markup, and the native player the fallback leaves behind never had hover previews to lose.

## Background video, and the pause button it needs

A video behind a headline is not a player. Nothing on it is meant to be pressed — no scrubber,
no clock, no volume on a silent track — and the markup for it is four attributes the platform
answered long before this element existed:

```html
<video autoplay muted loop playsinline src="sample/rollout.mp4"></video>
```

`muted` is the condition every browser puts on autoplay rather than a stylistic choice:
without it the loop never starts. `playsinline` is what keeps iOS from taking the whole
screen the moment it does.

So a background video does not need this element. What it needs is the one thing those four
attributes cannot say: **motion that runs longer than five seconds has to be stoppable**
([WCAG 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)),
and a twelve-second loop crosses that line five seconds into its first play. That is one
button, and wiring one button is the smallest thing `<media-player>` does.

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

Nothing on the `<video>` but what the platform reads; the element listens to it by itself,
here as everywhere. Metadata arriving takes `disabled` off the button once there is something
to press. `play` and `pause` keep `playLabel` and the `is-playing` attribute honest, which are
the accessible name and the icon swap. The two icon spans carry the same class names as the
play button further up the page, because the rule that swaps them is in `style.css` and asks
nothing of where the button sits.

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
already clips, so what a background adds is the crop: `height: 100%` and `object-fit: cover`
over the `width: 100%` the stylesheet sets. There is no `z-index: -1`, on purpose — the toggle
is a child of the player, and a player pushed behind the page takes its own button with it.
The content is written after the player and positioned, which is enough to paint it on top,
and it is also what decides the collision, so keep the toggle in a corner your text does not
reach.

Two costs, both worth knowing before pasting it.

**The lock screen.** Playing claims the OS media panel — the element's own `play` listener,
the same one behind every player on this page — and it does not know this video is wallpaper.
Leave `media-title`, `artist`, `album` and `artwork` off and there is nothing to name it with,
so the metadata is cleared rather than set. `poster` is the one to watch: a `<video poster>`
is read as artwork, so a background video carrying one puts a picture on the panel with no
title beside it.

**No `controls`, which is where this page's own rule bends.** Every other sample writes
`controls` on the media element so a blocked script leaves a working native player behind.
Here there is nothing for a control bar to be the fallback _for_ — a scrubber across your hero
is not what you meant — so the button carries `disabled` in the markup instead, and a page
whose script never ran shows a control that is visibly unavailable rather than one that
silently does nothing. The loop still plays; `autoplay` is the browser's. What that leaves is
motion with no way to stop it on a page with no JavaScript. If that matters for yours, the
markup that survives is a `<video controls>` with no `autoplay` — a different design, not this
one with a flag flipped.

`prefers-reduced-motion` cannot reach the playback: `autoplay` is an attribute and no media
query undoes one. The theme does read the preference — its transitions and the overlay chip's
hover go still under it — but the video plays regardless. The button is the mechanism WCAG
asks for; a page that wants the preference honoured on top of it starts the video from its own
script rather than from the attribute.

## What it borrows

The player draws almost nothing itself. The parts with an
[APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/) behind them are elementals, each
usable on its own and documented separately:

| Part               | Element                                                                                               | What it brings                                                                                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scrubber, volume   | [`<slider-elemental>`](https://stamat.github.io/book-of-elementals/elementals/slider.html)            | a native `<input type="range">` and the whole APG Slider pattern — arrows, <kbd>Home</kbd>, <kbd>End</kbd>, touch, the value bubble                                         |
| Buffered-ahead bar | [`<progress-elemental>`](https://stamat.github.io/book-of-elementals/elementals/progress.html)        | a native `<progress>` whose fill CSS can place — here it carries the buffered edge, on the duration's own scale                                                             |
| Control row        | [`<toolbar-elemental>`](https://stamat.github.io/book-of-elementals/elementals/toolbar.html)          | one tab stop, arrow keys between the controls — the speed `<select>` included, which keeps ↑/↓ for its own list                                                             |
| Control tooltips   | [`<tooltip-elemental>`](https://stamat.github.io/book-of-elementals/elementals/tooltip.html)          | hover and focus both, <kbd>Escape</kbd> to dismiss per [WCAG 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html), and no half-handled touch |

So there is no `role="slider"` and no `aria-valuenow` anywhere in this element. The platform
already says both, and saying them again is how they end up disagreeing.

## Keys the buttons carry

Every control here is a `<button>`, an `<input type="range">` or a `<select>`, so whichever
one has focus already answers <kbd>Space</kbd>, <kbd>Enter</kbd>, the arrows, <kbd>Home</kbd>
and <kbd>End</kbd> with no help from this element. What is missing is the key that works without
tabbing to anything first.

It is not a map. The key goes on the control it presses, and the player is told to listen:

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
matter; <kbd>K</kbd> presses the same button.

Two things follow from the key living on the button rather than in a list:

- **A key can only name an action a control already names.** There is nothing to document
  apart from the buttons and nothing to drift from them. Show a binding on the button it
  belongs to — a `<kbd>k</kbd>` in the button's tooltip, or
  `[key]::after { content: attr(key) }` in your own stylesheet, which needs no markup at all.
- **A disabled button ignores its key,** because a disabled button ignores a click, and the
  press stays the page's — a claimed <kbd>Space</kbd> that did nothing would still have
  stopped the page scrolling. Nothing answers before `is-ready`.

One binding has no button to live on: the samples' volume is a slider, so `volumeUp` and
`volumeDown` have nothing to carry a `key`. The `keys` attribute on the player covers that
gap. `keys="ArrowUp:volumeUp;ArrowDown:volumeDown"` maps a key straight to a handler from the
reference below, so a focused player answers all four arrows the way YouTube does. It is a
fallback, never an override: a control's own `key` wins the same press, every guard in the
table further down applies unchanged, and a pair naming no handler warns in the console rather
than failing silently. Reach for it only when no control names the action — a `keys` entry
duplicating a button is a binding nothing on screen can show.

Letters carry a cost the arrows do not. The match reads `event.key`, the character the layout
produced rather than the physical key, so `key="k"` answers on a Latin layout and silently
does not exist on a Cyrillic, Greek, Hebrew or Arabic one, where the same finger produces a
different letter. <kbd>Space</kbd> and the arrows are layout-free, which is why the samples
bind those; a letter shortcut is a Latin-layout feature, worth saying wherever the page
announces it.

### Which keydown you bind is the whole scope

`on=` says where the listener goes, so the reach of the keys is one attribute and not an
option:

| Written as                        | Answers                          | Costs                                                                                                                                         |
| --------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| nothing                           | nothing — there is no listener   | none, and this is the default                                                                                                                 |
| `on="keydown:onKeyDown"`          | while focus is inside the player | the reader has to tab or click into the player first, which for a keyboard shortcut is most of the point gone                                 |
| `on="keydown@document:onKeyDown"` | anywhere on the page             | the page gives up those keys — <kbd>Space</kbd> included, which is its scroll key — and two players both bound this way both answer one press |

The last is what a shortcut usually means, and the one to write on a page built around a
single player. hydrargyri puts the listener on `document` and takes it off when the element
leaves the DOM, so nothing outlives the player it belongs to. What it cannot do is share: two
players bound page-wide both hear the same <kbd>k</kbd> and both press their own play button.
With more than one on a page, bind the focused form, or bind the page-wide form on exactly one
of them.

Focus is yours to place, and the focused form depends on where it lands. A click leaves focus
on the nearest focusable thing, and `<media-player>` is not one until you say so. Write
`tabindex="0"` on it and the player becomes a Tab stop as well as the place a click on the
video — or anywhere in the row that is not itself a control — leaves focus, which is what
makes <kbd>Space</kbd> answer afterwards. A focusable element with no role reads out its
entire contents to a screen reader, so the samples pair it with `role="region"` and an
`aria-label` naming the player. `tabindex="-1"` is the same click behaviour without the Tab
stop, for a page where one more stop before the controls is one too many. The element never
moves focus itself: pulling it back after a button press would move a screen reader's cursor
mid-sentence.

There is one exception. The click-to-play overlay is a real button, so pressing it to play
leaves focus on it — and starting playback hides the overlay, which drops that focus to
`<body>` and takes every key on this player with it. The next <kbd>Space</kbd> would scroll
the page rather than pause, so focus moves to the player instead. It needs the `tabindex` to
land on; without one there is nowhere to put it, and the element leaves focus alone.

`theme.css` draws a ring on a player that keyboard focus reaches, so a reader who Tabbed in —
and therefore holds the keys — can see that they do. On `:focus-visible`, the same heuristic
as the buttons, the one that
[hides a ring you placed with a finger](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible):
a click on the picture or the bar focuses the player too, and an accent ring around the whole
box on every click reads as a glitch. One case pays for that quiet — the focus the element
catches when the overlay goes at playback start draws no ring after a mouse press, so a mouse
reader gets no sign the keys went live; Tab in once and it shows. The ring sits outside the
box because inside it is invisible: on a video the overlay button covers the whole player and
the poster sits under that, and both paint over it. Style
`media-player:focus-visible { outline: none }` to turn it off.

With it on, a `key=" "` answers from every place a reader is likely to leave focus: the
player, the media element, the scrubber, and the big overlay button on a video — none of which
scroll on <kbd>Space</kbd> any more, which is the trade. The overlay is the one the player
keeps its hands off, since a focused button is activated by the press it already owns, and it
lands on the same action regardless: the overlay in these samples is the play button. That
matters for the buttons it is not — focus parked on mute or fullscreen spends <kbd>Space</kbd>
there.

The audio and video samples above both bind the focused form, so this is one to press rather
than read: `keydown:onKeyDown` on the player, `key=" "` on its play button, `key="ArrowLeft"`
and `key="ArrowRight"` on its skip buttons,
`keys="ArrowUp:volumeUp;ArrowDown:volumeDown"` on the player for the pair with no button, and
`tabindex="0"` so the player is a Tab stop and a click on the bar leaves focus inside. Tab to
one, or put focus anywhere in it — the scrubber, the picture, the row — and <kbd>Space</kbd>
plays and pauses, except on a button, where it presses the button. The sideways arrows skip
and the vertical ones move the volume — from the picture, the overlay or the player itself.
Inside the control row every arrow is the row's: the walk between the buttons, the ends it
refuses to wrap past, the cross axis it leaves to the page's scroll, and the sliders' own
steps — none of them a press a `key` may take, or the row's ends would seek and
<kbd>↑</kbd> over any button would move the volume under a reader who was only walking
the bar.

No sample binds the page-wide form. Not because it would misbehave here — a preview runs in
its own frame, so a <kbd>k</kbd> claimed inside one never reaches this page — but because the
markup a sample hands you is markup you paste, and page-wide is a decision to make once, on
your own page, with the scroll key in mind.

### What a press has to get past

| Press                                                                                           | Who it belongs to                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The arrows, <kbd>Home</kbd>, <kbd>End</kbd> or a Page key with a slider or a radio group focused, or pressed anywhere inside a `role="toolbar"` | the focused control or the row around it — a slider spends them on its own value, a radio group on its own walk, and the toolbar owns its arrows whole: the steps its walk takes, the ends it refuses to wrap past, and the cross axis it leaves to the page's scroll. Everywhere else an arrow is free to claim: `key="ArrowRight"` on the skip button skips while the player holds focus                       |
| <kbd>Space</kbd> or <kbd>Enter</kbd> with a button, a checkbox, a link or a `<summary>` focused | whatever the press does there already — it activates a button, a checkbox or a `<summary>`, it follows a link on <kbd>Enter</kbd>, and on <kbd>Space</kbd> over a link it scrolls the page. It is the split [YouTube documents](https://support.google.com/youtube/answer/7631406): Space pauses when the player holds focus and presses the button when a button does |
| Anything with <kbd>Ctrl</kbd>, <kbd>⌘</kbd> or <kbd>Alt</kbd> held                              | the browser                                                                                                                                                                                                                                                                                                                                                            |
| A key typed into a text field, a `<select>` or anything `contenteditable`                       | whatever is being typed into — a comment box under a player is the ordinary case, not the odd one. Found through an open shadow root too, since a `keydown` reports the component rather than the field inside it                                                                                                                                                      |
| A key already handled by something else                                                         | whatever called `preventDefault` first                                                                                                                                                                                                                                                                                                                                 |

A press that gets past all five and finds a `key` is taken off the page with
`preventDefault`. That is the part to weigh before binding `@document`: a letter the player
claims is a letter the page no longer sees. <kbd>Space</kbd> is the expensive one, because
unclaimed it scrolls — bound `@document` it stops scrolling the whole page, not only the
player. That is why YouTube's always-works key is <kbd>k</kbd> and its <kbd>Space</kbd>
reaches no further than the player. One field the element cannot see is one inside a _closed_
shadow root: the platform reports the component and offers no way in, so its letters are
taken. A page with one of those wants the focused binding.

## Tooltips on the controls

The bubbles in the samples are `<tooltip-elemental>` wrapped round each button and round the
speed `<select>`, which is where hover, focus, <kbd>Escape</kbd> to dismiss and the decision
to ignore touch already live. The `<select>` is not a button and needs the bubble most:
closed, it reads `1×` and says nothing about what it changes.

Three of the bubbles bind rather than state: the play, mute and captions ones carry
`playLabel`, `muteLabel` and `captionsLabel`, the same state the buttons announce themselves
by, so the words in the bubble and the words a screen reader hears cannot drift apart.

```html
<tooltip-elemental>
  <button on="click:togglePlay" bind="playLabel:attr#aria-label" disabled>
    …
  </button>
  <span bind="playLabel">Play</span>
</tooltip-elemental>
```

The button keeps its `aria-label`, so the bubble is a description rather than the name and the
control is named with or without it. Importing `media-player` defines the tooltip along with
the rest, so the part a page can miss is the stylesheet — and unlike the other elementals, it
is the _theme_ that paints the bubble at all, as the install list says. `theme.css` then takes
the caret back off the bubbles inside a player: a row of buttons a few pixels apart is not
ambiguous about which one a bubble belongs to.

The bubble on the scrubber is not one of these. It is `<slider-elemental>`'s own, asked for by
`tooltip="thumb track"`, and it reads out the second under the pointer. Centred on the thumb,
at either end of the track it puts half of itself outside the slider's box, where a video
player clips it — a player clips its own box to get the corners right over the picture.
`style.css` clamps it inside the track instead, off `--slider-elemental-at`, the ratio that
slider publishes for the purpose. Nothing measures and no script runs: the bound is `clamp()`
against the track's own length, so a number that grows from `9:59` to `10:00` is held on the
width it actually has. In the middle of the track the bubble stays exactly where the slider
put it, and a player too narrow to hold the bubble parks it at the start.

## Attributes it writes

These land on the `<media-player>` element as CSS hooks. You do not set them — you style
against them.

| Attribute                                          | When                                                                                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `is-ready`                                         | metadata arrived; the duration is known and the controls are live                                                            |
| `is-playing`                                       | playing — the hook the play/pause icon swap hangs on                                                                         |
| `is-buffering`                                     | waiting on data; `.media-player-buffering` in your markup is the box a spinner goes in — shown under this hook, drawn by your stylesheet     |
| `is-error`                                         | the media gave up — a 404, a refused codec, a failed decode; the native controls come back for the browser's own error state |
| `is-live`                                          | the duration says endless stream; what can be reached inside it is `seekableStart`–`seekableEnd`                             |
| `is-video`                                         | it wrapped a `<video>`                                                                                                       |
| `is-fullscreen`, `controls-shown`, `poster-hidden` | the video half — `poster-hidden` covers the poster only, the overlay follows `is-playing`                                     |
| `no-fullscreen`                                    | fullscreen has no door to open — an iframe without `allow="fullscreen"` is the common way; hide your fullscreen button on it |
| `is-pip`                                           | the video is in the browser's picture-in-picture window — it follows the platform, so a window opened or closed from the browser's own control moves it too |
| `no-pip`                                           | no picture-in-picture window to open — an `<audio>`, an embed, a media element carrying `disablePictureInPicture`, or a browser without it; hide the button on it |
| `is-airplay`                                       | playback is going to a device — an AirPlay receiver on WebKit, a Chromecast on Chrome. It follows the route, so a device picked or dropped outside this page moves it too; `connecting` is not yet `connected` |
| `no-airplay`                                       | nothing to send to: no device on the network, a media element carrying `disableRemotePlayback`, or a browser without the [Remote Playback API](https://w3c.github.io/remote-playback/) — Firefox, at time of writing. It starts set on every connect and the platform answers, so hide the button on it |
| `no-rate`                                          | the media element has no `playbackRate` to set, which an embed standing in for a `<video>` does not; hide the speed control on it |
| `has-captions`, `captions-visible`                 | a caption track was found, in the markup or in the media element's track list; captions are on                               |
| `volume-state`                                     | `mute`, `mid` or `full`, for a three-icon volume button                                                                      |

The four `no-` hooks are yours to act on, and one rule covers a control however it is
wrapped — the handler you already wrote is the selector, so there is no class to invent and
nothing to keep in step with the markup:

```css
media-player[no-airplay] :is([on*="showAirplayPicker"], :has(> [on*="showAirplayPicker"])) {
  display: none;
}
```

The `:has()` half is for the `<tooltip-elemental>` around the button: hiding the button alone
would leave its bubble's gap in the row. Keep the `>` in it — written bare, `:has()` matches
every ancestor holding that button, so the control row and the player go with it. This page
writes that rule for its own samples, which is why the device button in the row above appears
only when there is an Apple TV or a Chromecast to reach. `no-airplay` is the only one of the
four that is not about video: the route carries an `<audio>` to a speaker, so an audio row can
offer it too.

Four you do set: `skip` is how many seconds a skip button moves (default `10`); `storage-key`
is the prefix for the remembered volume, mute and captions state — set it per player, or two
players on one page share one volume; `keys` maps a key to an action no visible control names,
covered in the keys section above; and `pause-offscreen` stops playback once the player has
scrolled out of view. Four more, for what the lock screen shows, are in the next section.

`pause-offscreen` is off unless you write it. On by default, it would decide that a podcast
stops when the page scrolls past the controls, which is what an audio player is most often
left running for. Write it on a video and a listener who scrolls away gets silence instead of
a soundtrack over the next section. It pauses and nothing more: what scrolls back into view is
a paused player with its controls up, because playing again would need the element to tell a
scroll-pause from your own press. A browser without `IntersectionObserver` never pauses, which
is the behaviour of leaving the attribute off.

## On the lock screen

Start playing and the player claims the operating system's media panel — the lock screen, the
hardware media keys, the button on a pair of headphones. Play and pause are there with or
without this element; every browser draws them for any media that plays. The player adds the
rest: skip buttons that move by the same `skip` seconds the buttons on your page use, a
scrubber that goes where you drop it, and a name for what is playing.

The name comes out of markup you have probably already written. A `title` on the `<audio>` or
`<video>` is what the panel calls the track, and a `<video poster>` is the artwork. Nothing is
invented: with neither, the panel keeps its own default rather than showing `tone.wav` on your
lock screen. Four attributes on `<media-player>` cover what that markup cannot say:

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

`theme.css` follows the register Plyr made standard: a flat compact bar, controls that flood
with the accent under the pointer, a slim rounded track whose accent thumb comes up with it,
video controls on a bottom gradient with a centred play chip. The speed `<select>` loses its
native chrome to `appearance: none` and is drawn as one more button in that row — the rate and
no arrow, because `currentColor` reaches neither a `background-image` nor a pseudo-element a
`<select>` renders.

Where Plyr hardcodes white and slate, this sheet uses `Canvas` and `CanvasText`, so the look
follows the page into dark mode and forced colours. Dark mode as the page declares it:
`color-scheme: dark` is what flips the system pair, and a class-toggled theme that never sets
it keeps a light bar on a dark page. The sheet reaches one thing it does not own — the caret
comes off a `<tooltip-elemental>` bubble inside a player, because a row of buttons a few
pixels apart is not ambiguous about which one a bubble points at. What it takes from you are
custom properties; the first five live in the theme, the last two in the structure sheet:

| Property                    | Default      | Paints                                                                                                                                         |
| --------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `--media-player-accent`     | `#16a34a`    | the played fill, the hover that floods a button, a toggle held on, the thumbs, the overlay chip, the focus ring                                |
| `--media-player-accent-ink` | `#fff`       | what sits on the accent — the flooded button's glyph, the chip's triangle; change it with the accent                                           |
| `--media-player-surface`    | `Canvas`     | behind the control row                                                                                                                         |
| `--media-player-color`      | `CanvasText` | labels, and every neutral mixed from it — tracks, the buffered bar, disabled buttons; the video half swaps it to white and everything re-mixes |
| `--media-player-radius`     | `0.5rem`     | the control row's corners, and the video's                                                                                                     |
| `--media-player-gap`        | `0.5rem`     | between controls                                                                                                                               |
| `--media-player-fade`       | `0.2s`       | how long the video controls take to fade out                                                                                                   |

Neither knob is drawn all the time. A bar nobody is aiming at is a position line, so the knob
— the scrubber's and the volume's alike — appears when the pointer arrives over its slider.
Nothing moves when it does; only its colour changes, so the track, the played fill and the
buffered bar, all three inset by half a thumb, stay where they sat. Keyboard focus counts as
aiming at it, and so does a drag still holding the button after the pointer has slid off the
track. Two cases are exempt: a touch device, which has no hover to bring a knob back, and
forced colours, where the mode's own thumb colour is what makes the control findable. To have
them always, put the colour back:

```css
media-player slider-elemental {
  --slider-elemental-thumb: var(--slider-elemental-fill);
}
```

## Handlers you can name

The samples above are the working answer; this is the index — every name `on=` can call, for
when you are building a control row no sample here draws. It is the list
`custom-elements.json` publishes, minus the handlers the element wires itself, which an editor
still reads.

Which element you write the `on=` on matters as much as which name you write in it. There are
two places to write one — your controls and the `<media-player>` itself — and a name from one
list does nothing on the other.

The `<audio>`, the `<video>` and a `<track>` inside them take no `on=` at all. The listeners
that keep the element in step with playback — the five metadata events, `play` and `pause`,
`waiting` and `playing`, `ended`, `progress`, `timeupdate` for a live stream's window,
`volumechange`, and a track's `cuechange` into `captionText` — are the element's own
plumbing, declared in its `static wires` and attached by
[hydrargyri](https://github.com/stamat/hydrargyri) when the element upgrades. Markup from an
earlier version that still carries those pairs keeps firing once: a pair the attribute already
wired is skipped, never doubled.

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
| `click:toggleCaptions`                          | captions on and off; needs a track the button governs — `captions`, `subtitles` or a bare `<track>`, the `default` one or the first written: [the FAQ names the rule](#faq-captions) |
| `click:goLive`                                  | back to the live edge of a stream with a rewind window; does nothing on a file, or on a stream with no window to have left                       |
| `click:toggleFullscreen`                        | the player element, or the video itself on an iPhone, which has never allowed anything else                                                      |
| `click:togglePictureInPicture`                  | the floating window the browser keeps above everything else; video only, and it warns rather than going quiet when the browser refuses — a request with no user gesture behind it is the usual reason |
| `click:showAirplayPicker`                       | the system device picker, off the standard [Remote Playback API](https://w3c.github.io/remote-playback/) — AirPlay in Safari, Chromecast in Chrome. Audio as well as video, and not a toggle: the picker is the way back to the device as well as the way out, so the platform owns that half. It needs a gesture behind it, does nothing at all while `no-airplay` is set, and warns on a refusal that is not simply someone closing the picker |
| `change:setRate`                                | playback speed, off the control's own `value` — a `<select>`'s in the samples; anything that is not a positive, finite number is dropped |

**On `<media-player>` itself:**

| Write                                             | Does                                                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `keydown:onKeyDown`, `keydown@document:onKeyDown` | a press clicks the control whose `key` claims it — the two scopes are [Keys the buttons carry](#keys-the-buttons-carry)        |
| `mousemove:showControls`                          | video only: bring the faded control row back, and start the timer that takes it away again                                     |
| `pointerdown:showControls`                         | the same for a pointer that cannot hover, which sends no `mousemove` — the reveal lands on the finger's touch rather than a beat later on its click |
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
| `playbackRate`                            | the speed the media is playing at, `1` being normal — bound to a `<select>`'s `value` in the samples, and it follows the media element rather than the control, so a rate changed anywhere else lands on it |
| `timeFormatter`                           | the `formatTime` function itself — hand it to the scrubber's `prop#format` and the value bubble reads `01:12` instead of `72`       |

Three formatters pipe a bind: `|time` writes seconds as a clock, `|floor` a whole number, and
`|pressed` a boolean as the literal `"true"`/`"false"` that a toggle's `aria-pressed` wants —
the captions, picture-in-picture and fullscreen buttons in the video sample use it. No sample
pipes `|floor` any more, since the scrubber's `step="any"` wants the fraction, but it stays
for markup written against an earlier version.

## Labels in another language

`playLabel`, `muteLabel` and `captionsLabel` speak English. To localize, skip the bind and
let the button name itself from its content: the attribute hooks already swap which half is
visible, and `display: none` takes the hidden half out of the accessible name with it. The
fold's button never binds a label — the `aria-label` you write on it is the name it keeps,
in whatever language you wrote it.

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

`visually-hidden` is your utility class; every design system carries one. The same swap hangs
on `volume-state` for the mute button, `captions-visible` for the captions one, and, for the
fold's caret, on its own disclosure's `[open]` — two spans and one `display` rule of your
own.

## Events

`media-player-ready` when the duration is known, and `media-player-interaction` for everything
a person did — `{ type, value }` in `detail`, where `type` is one of `play`, `pause`, `stop`,
`seek`, `skip-forward`, `skip-backward`, `volume`, `volume-up`, `volume-down`, `mute`,
`unmute`, `fullscreen`, `pip`, `airplay`, `rate`, `go-live`, `captions-on`, `captions-off`.
Both bubble from the element, not from `document`. A `fullscreen` or `pip` event says which
way in `value` — `true` entering, `false` leaving — a `rate` event carries the new speed, and
a volume drag settles into one `volume` event, not one per pixel. An `airplay` event carries
no value: it reports that the picker was opened, and whether a receiver was picked is
`is-airplay` afterwards.

## Against the alternatives

Drawn on this player's axes, which is the caveat to read it with: a row is here because this
project has an opinion about it, and the rows it has no answer for are the ones the others
win.

|                                    | media-player                                            | [Plyr](https://github.com/sampotts/plyr)             | [media-chrome](https://github.com/muxinc/media-chrome) | [Vidstack](https://vidstack.io)      | [Video.js](https://videojs.com)        |
| ---------------------------------- | ------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ | ------------------------------------ | -------------------------------------- |
| **Size, gzipped**                  | **16.4 kB**                                             | 32 kB                                                | 42 kB                                                  | 40 kB                                | 196 kB                                 |
| **You write the controls**         | yes, as the only way                                    | no — a `controls` array, or an HTML string in config | yes, from its components                               | no — layouts                         | no                                     |
| **Shadow DOM**                     | never                                                   | never                                                | yes                                                    | yes                                  | no                                     |
| **Page plays with no script**      | yes                                                     | yes, if you keep `controls`                          | no — its starter `<video>` has none                    | no                                   | yes                                    |
| **Your CSS reaches every part**    | yes                                                     | yes                                                  | through `::part()` and the variables it chose          | partly                               | yes                                    |
| **Scrubber frame previews**        | yes — your box, the browser's VTT parser                | yes — its own VTT parser                             | yes, inside its time range                             | yes — VTT, sprites, storyboards      | a community plugin                     |
| **Built from reusable primitives** | yes — the sliders ship separately                       | no                                                   | no                                                     | no                                   | no                                     |
| **YouTube, Vimeo, HLS, DASH**      | via `<video-background>` or media-elements, hls.js on your `<video>` | YouTube, Vimeo                                       | via a provider                                         | all of them                          | via plugins                            |
| **Ecosystem**                      | none                                                    | large                                                | Mux's                                                  | large                                | the largest                            |
| **Pick it when**                   | the markup is yours and must survive without the script | you want one line and a good default                 | you want composable parts and accept a shadow root     | you are building an app around media | you need every format and every plugin |

Sizes are each package's browser bundle, gzipped: Plyr and Video.js as published
(`dist/plyr.min.js`, `dist/video.min.js`), media-chrome bundled from its package entry with
esbuild, Vidstack from `cdn.vidstack.io/player`. This one is `dist/media-player.min.mjs`,
which carries hydrargyri and the five elementals inside it — everything except the
stylesheets: its own structure sheet is 1.1 kB and the theme 1.6 kB more, the elementals' five
structure sheets 1.8 kB and their three themes 2.6 kB more, each gzipped on its own the way a
browser fetches it. Every one of those numbers moves with a release; measure before quoting.

Where this loses is the bottom of that table, on purpose. YouTube and Vimeo arrive the way
they arrive in media-chrome — an element that speaks the media API, dropped in where the
`<video>` goes, from [`<video-background>`](https://github.com/stamat/video-background-element)
or from [media-elements](https://github.com/muxinc/media-elements) — and with the script
blocked that element is a blank box, so playing without the script becomes someone else's
promise. **[Plyr](https://github.com/sampotts/plyr) is the answer when the embed must play
with no script at all**, since it enhances the `<iframe>` you already wrote, and Video.js for
the long tail of formats and plugins. Neither is planned here.

## Live, and the streams it does not carry

A live stream has no end, and browsers disagree about how to say that: some report `Infinity`
for the duration, some a number in the billions. Anything at or above 2³² is read as endless
here. `is-live` goes on the element and `duration` reads `0` rather than a bogus number, so a
clock bound to it stays honest. Bind `isLive:if` on a **Live** badge and the row says which
kind of thing it is holding.

What can be reached inside that stream is a separate question, and the browser answers it.
`seekable` is the platform saying which seconds still exist: a stream with a rewind window
reports one range that slides forward as segments expire, and a stream without one reports
something too narrow to call a window, or nothing before the first segment lands. So the
window decides, not the endlessness — `seekTo`, `skipForward`, `skipBackward` and a drag on
the scrubber all work inside it and all decline without it. `goLive` is the way back to the
edge. `stop` refuses either way: a window does not give a stream a beginning, only an oldest
second that has not expired yet.

HLS and DASH are not here and are not coming. A manifest needs a third-party script driving
Media Source Extensions, and a script driving the media element is the opposite of this
element's bargain.

They compose anyway, and nothing here was written to make them. The element never creates,
moves or replaces the media element and never touches its `src`: it reads the one you wrote
and wires your controls to it, so a third-party script writing that same `src` is invisible to
it. That is why the recipe below needs no seam to hold hls.js.

The scale is the markup's, which keeps `duration` meaning one thing everywhere. The element
publishes three absolute numbers — `seekableStart`, `seekableEnd` and `behindLive` — and a
scrubber over a rewind window binds the first two where a file's scrubber binds `duration`.
A whole live player, that binding and hls.js included:

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
  import 'media-player-element';
  import Hls from 'hls.js';

  const video = document.querySelector('media-player video');
  const manifest = '/live.m3u8';

  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = manifest; // Safari and iOS play HLS without help
  } else if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(manifest);
    hls.attachMedia(video);
    addEventListener('pagehide', () => hls.destroy(), { once: true });
  }
</script>
```

The `disabled` attributes say that nothing on that row can do anything until a manifest
resolves; the element takes them off when it does. `hls.destroy()` on the way out is the one
piece of housekeeping a stream needs that a file does not — a live loader keeps refetching the
manifest otherwise.

Those three numbers refresh on `timeupdate` and `progress`, about four times a second while
playing, which is the rate a window sliding in whole segments actually changes at. There is
deliberately no live edge tolerance: nothing here decides how many seconds behind still counts
as *at* the edge, because that is a design decision about a badge, and the badge is yours.
Bind `behindLive` and pick the number in your own stylesheet.

Two more things stay off on a stream, window or not: the OS lock screen gets no position, and
the scrubber's frame previews do nothing. The spec wants a finite duration for the first, and
a thumbnail sheet is cut from a file that has ended for the second.

**DASH swaps the script and nothing else.** The markup above, the `<style>` and every binding
stay as they are — only the loader changes, and the native branch goes, because no browser
plays DASH without a library:

```js
import 'media-player-element';
import { MediaPlayer } from 'dashjs';

const video = document.querySelector('media-player video');
const player = MediaPlayer().create();

player.initialize(video, '/live.mpd', false);
addEventListener('pagehide', () => player.destroy(), { once: true });
```

What that swap does not carry is the live half. Where hls.js reports `Infinity` for a live
manifest, dash.js reports the length of the rewind window instead: a manifest declaring
`timeShiftBufferDepth="PT10M"` arrived here as `634.566`. `is-live` therefore never comes on,
and a live DASH stream plays as a ten-minute file — the scrubber above works, but there is no
**Live** badge, no `goLive`, no `behindLive`, and the duration slides as segments expire.
Telling the two apart would mean asking a library what kind of stream it is, and this element
knows no libraries. So: either loader for playback, hls.js if the live half matters. With the
script blocked a DASH page shows an empty box in every browser, Safari included; there is no
native path to degrade onto.

Script order does not matter. Metadata arriving is five different events and all of them route
to the same idempotent handler, so the controls come up whenever the manifest resolves, before
this element upgrades or long after. A live manifest reports `Infinity`, which lands on
`is-live` with no extra wiring.

What you give up is playing without the script, and it is HLS that takes it rather than this
element:

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
than as a `<track>` you wrote, and it arrives after this element has upgraded, so the track
list is what is read and `addtrack` is what says to read it again. The captions button lights
up when the track lands, on whatever the page remembered from last visit. There is no language
picker: the first caption track found is the one that stays, because switching between them
would need a control to switch with, and naming that control is a decision for markup.

The late track is covered by a test, against a stated `textTracks` list. Nothing else here can
be, because jsdom implements no Media Source Extensions, so a check by hand stands in for it.
That check was run: a live manifest with a ten-minute rewind window, in Safari, which plays
HLS natively, and in Chrome, which reaches it through hls.js. In both, the first duration the
element saw was `Infinity`, so `is-live` came on rather than latching a bogus number; the
window drove the scrubber; skipping backwards landed inside it and stayed. The DASH figure
above came out of the same check, in Chrome, against two dynamic manifests.
[CONTRIBUTING.md](https://github.com/stamat/media-player-element/blob/main/CONTRIBUTING.md) says how
to run that check yourself. It is not run on every release, so if it breaks for you, file an
issue.

## What it does not do

Each of these is a decision, not a gap waiting for a pull request.

- **Generate controls.** There is no control bar to configure, because configuring one is the
  problem this exists to avoid. The sample above is the starter: copy it and delete what you
  do not want.
- **Streaming formats and embeds of its own.** HLS, DASH, YouTube and Vimeo each need a
  third-party script, and nothing here ships one or knows one by name. What composes is
  anything that speaks the media API: hls.js on the `<video>` you wrote, or a
  `<video-background>`, which answers for YouTube and Vimeo from one tag, or a
  `<youtube-video>` from media-elements for the rest — marked `media-player-media`.
  [One element, both media](#one-element-both-media) shows the second,
  [Live, and the streams it does not carry](#live-and-the-streams-it-does-not-carry) the
  first, and both say what a blocked script leaves behind.
- **Ship a keyboard map of its own.** Nothing is bound until the author writes it: `key` on a
  control the page already shows, names and disables, and `keys` for the action no visible
  control carries — `volumeUp` behind a volume that is a slider. A `keys` entry is the
  expensive half, a binding nothing on the page announces, so what it maps is the author's to
  say. What stays refused is the ready-made set: a default `k`, `m`, `f` map would spend
  letters on every page that never asked for them.
- **Sanitize anything.** It writes text and attributes, never HTML.

## Install

```bash
npm install media-player-element
```

```js
import 'media-player-element';
```

The elementals ride along: importing `media-player-element` defines the slider, the progress
bar, the toolbar, the tooltip and the disclosure too. Their stylesheets do not — each
elemental draws its own track, thumb, bar, bubble or fold, so every one of those sheets would
otherwise be a `<link>` of its own. Two bundles carry them instead: `bundle.css` is this
element's `style.css` with the five elemental structure sheets folded in, and
`bundle-theme.css` is its `theme.css` with theirs.
The rest of this page names the two halves unbundled, which is the same CSS.

```html
<link rel="stylesheet" href="media-player-element/bundle.css" />
<link
  rel="stylesheet"
  href="media-player-element/bundle-theme.css"
/><!-- the look; optional -->
```

`bundle-theme.css` is optional the way `theme.css` alone is: a page that already has a design
system takes the first and writes its own colours. One catch, because the split is by kind
rather than by what you can live without — the tooltip's colours are in the theme bundle, and
the tooltip's structure sheet only places the bubble. Take the structure bundle alone and
there is unpainted text floating over the control row rather than a bubble, so paint
`--tooltip-elemental-surface` and `--tooltip-elemental-color` yourself if you skip the look.
Nothing else in here needs you to.

**If book-of-elementals or hydrargyri is already in your project, install from npm and take
`style.scss` and `theme.scss` — not the CDN module, and not the bundles.** Both bake a copy
of those packages in, and a second copy of either is a problem the page will not report.

In the stylesheets it is version skew. Three quarters of `bundle-theme.css` is elemental CSS,
frozen at whatever version this element was built against, and nothing in the file says which
— the banner carries this package's version, not that one. Load it beside your own copy and
two versions of the same selectors are on one page, link order deciding which wins.

In the module it is worse. Nothing throws: registration is guarded, so the second
`slider-elemental` is dropped and whichever script ran first owns the tag, leaving you a mix.
But two copies of hydrargyri keep two separate registers of which tags are hydrargyri's, and
that register is how an element knows a node belongs to a nested element rather than to
itself. Split it and the outer element writes into the inner one's `bind` nodes: a
`<media-player>` nested inside an element of your own has its controls written over by that
element, and the only sign is a console warning about a bind naming a property the wrong
element does not have.

Installing from npm fixes both. This package's main entry is unbundled source importing
`hydrargyri` and `book-of-elementals/*` by bare specifier, so your bundler resolves them to
your copy — one of each, at the version you picked. Both are `peerDependencies` here, so an
installer that cannot reconcile your version with this one says so rather than quietly nesting
a second. That does mean your book-of-elementals major has to match the one this package
declares.

The `href`s above are bare specifiers for a bundler to resolve. From a CDN they are two full
URLs, no install and no build step, and the module beside them is one file with the elementals
compiled in:

```html
<script type="module">
  import 'https://cdn.jsdelivr.net/npm/media-player-element@2/dist/media-player.min.mjs';
</script>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/media-player-element@2/dist/media-player.bundle.min.css"
/>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/media-player-element@2/dist/media-player-theme.bundle.min.css"
/><!-- the look; optional -->
```

That pin takes fixes and refuses breakage: `@2` follows every 2.x release and stops at the
next major.

Every sheet is published on its own either way — this package's `style.css` and `theme.css`,
and `style.css`/`theme.css` under each elemental in
[book-of-elementals](https://github.com/stamat/book-of-elementals) — so a page wanting only
some of them links those. For a page wanting all of them, the bundles turn ten `<link>`s into
two and 7.2KB of gzip into 5.3KB, because ten files each compress alone and share no window
with the next.

## What editors read

The package ships a
[custom elements manifest](https://github.com/webcomponents/custom-elements-manifest) as
`custom-elements.json`, named by the `customElements` field in `package.json` and generated
from the element's source on every build. It carries what this page carries — the attributes,
the two events, the seven custom properties — and marks everything the samples do not name as
private, so an editor offering completions offers `togglePlay` and not `endDrag`.

The samples at the top of this page read it too. Their **Options** tab is generated from this
file and nothing else, which is the reason to ship one rather than invent a format: the knobs
cannot describe an element this page no longer has. What the panel leaves out is in the file
as well, under an `x-code-preview` key the schema permits and every other tool ignores — the
sixteen CSS hooks stay documented for a stylesheet and are marked hidden for the panel,
because they are the element's to write and not an author's.

The manifest is a description, not a runtime; nothing here requires an editor to read it.

## Questions

<!-- The accordion, on its own rather than in the player's bundle: it is this page's furniture
     and no part of the element, so it is the prebuilt file from book-of-elementals copied into
     `js/` rather than an import that would ride along in everyone's `dist/media-player.mjs`.
     Block it and the questions below are still native `<details>` — they just open at once
     instead of sliding. -->
<script src="js/accordion.min.js" defer></script>

<accordion-elemental class="faq">
<details>
<summary id="faq-no-js"><h3>Does the page still play with the script blocked?</h3></summary>

Yes, and that is the claim everything else is arranged around. You write `<audio controls>` or
`<video controls>`; this element takes `controls` off when it upgrades and puts it back if it
is ever removed from the DOM. It never creates, moves or replaces the media element, so with
no script there is still a working native player where you put one.

The exception is a streaming manifest, which is the format's doing rather than this element's
— see [Live, and the streams it does not carry](#live-and-the-streams-it-does-not-carry).

</details>
<details>
<summary id="faq-streaming"><h3>Can I use it with HLS, DASH, YouTube or Vimeo?</h3></summary>

Nothing here ships any of them, and none is coming. All four compose anyway, and no seam was
written to make them: attach hls.js or dash.js to the `<video>` you wrote, because this
element only ever reads the media element and never touches its `src`. For YouTube and Vimeo,
[`<video-background>`](https://github.com/stamat/video-background-element) answers for both
from one tag, and media-elements ships `<youtube-video>`, `<vimeo-video>` and a dozen more
with the media API on them; this element wraps either marked `class="media-player-media"` the
way it wraps a `<video>`. [One element, both media](#one-element-both-media) has both recipes
as live players, measured side by side, with what each costs.

One half does not survive DASH. hls.js reports an endless duration for a live manifest and
dash.js reports the rewind window's length, so `is-live` never comes on there. The worked
recipe and that limit are in
[Live, and the streams it does not carry](#live-and-the-streams-it-does-not-carry).

</details>
<details>
<summary id="faq-controls"><h3>Where is the default control bar?</h3></summary>

There is not one, and there will not be. A control bar this element could draw would need an
option to reorder it, an option to drop a button, an option to pass an icon — which is the
templating in JavaScript this exists to avoid. The samples on this page are the starter: copy
one, delete what you do not want, and it is already your markup in your stylesheet.

</details>
<details>
<summary id="faq-live-scrubber"><h3>My scrubber disappeared on a live stream</h3></summary>

The optional theme hides it — `media-player[is-live] .media-player-scrubber` — because it was
written when a live stream had nothing to seek. A stream with a rewind window does, so one
line in your own sheet brings it back. It is in the live recipe, with the reason.

</details>
<details>
<summary id="faq-captions"><h3>The captions button never appears</h3></summary>

There has to be a caption track for the button to toggle: `captions`, `subtitles`, or a bare
`<track>`, which the platform reads as subtitles. A `<track kind="metadata">` for thumbnails
is not one, and neither are chapters or descriptions. If several are written, the one marked
`default` wins, otherwise the first. A track a streaming library adds after the upgrade counts
too — the element watches `addtrack` for exactly that — but the button only lights once the
track lands, which on a stream can be a moment after playback starts.

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
wrote yourself.

</details>
<details>
<summary id="faq-frameworks"><h3>Does it work inside React, Vue or Svelte?</h3></summary>

It is a standard custom element in the light DOM, so any framework that renders plain HTML
renders it. What this project does not ship is a wrapper component for any of them; the markup
contract is `on` and `bind` attributes, and those are attributes wherever they are written.

</details>
</accordion-elemental>

## License

<p><a href="https://github.com/stamat/media-player-element/blob/main/LICENSE">MIT</a> ©
  <a href="https://github.com/stamat">Stamat</a>. The icons in the samples are
  <a href="https://lucide.dev">Lucide</a>, ISC — except the CC badge on the captions button,
  which is drawn here because Lucide has no lettered one.</p>
{% endset %}
{# The filter emits a bare `<nav><ul>`, so the disclosure is wrapped around it here rather
   than asked of it. Open, because twenty-eight sections are the reason this exists — but two
   columns on a wide viewport, or the map is a screenful before the article starts. #}
<details class="toc-disclosure" open>
  <summary>On this page</summary>
  {{ body | toc }}
</details>
{{ body }}
