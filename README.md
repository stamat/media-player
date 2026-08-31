# ▶ `<media-player>` [![npm version](https://img.shields.io/npm/v/media-player-element)](https://www.npmjs.com/package/media-player-element) [![ci](https://img.shields.io/github/actions/workflow/status/stamat/media-player-element/ci.yml?branch=main&label=ci)](https://github.com/stamat/media-player-element/actions/workflows/ci.yml) [![gzip size](https://img.badgesize.io/stamat/media-player-element/main/dist/media-player.min.mjs?compression=gzip&label=gzip)](https://github.com/stamat/media-player-element/blob/main/dist/media-player.min.mjs) [![license mit](https://img.shields.io/badge/license-MIT-green)](https://github.com/stamat/media-player-element/blob/main/LICENSE)

> A media player you write in HTML — one custom element over the `<audio>` or `<video>` you already wrote.

Most media player libraries take the player away from you: you hand over a `<video>` and a
config object, and get back someone else's control bar. Changing the arrangement means
learning a `controls` array, or passing an HTML string into a config option.

This one works the other way. **You write the controls.** Buttons and range inputs in your
page, styled by your stylesheet, in the order you put them. The element wires them by name.

It is a rewrite of the media player I built at GitHub in 2022 as a passion project — the one still
[playing on long forgotten github.com pages](https://github.com/readme/podcast/powering-public-goods),
it was written in Catalyst and TypeScript, before the React era.
Now it is given a new life as open source, dogfooding [hydrargyri](https://github.com/stamat/hydrargyri) and
[book-of-elementals](https://github.com/stamat/book-of-elementals).

```html
<media-player>
  <audio controls src="/episode.mp3"></audio>

  <toolbar-elemental
    class="media-player-controls"
    aria-label="Playback"
    bind="isReady:if"
  >
    <slider-elemental class="media-player-scrubber">
      <input
        type="range"
        min="0"
        step="any"
        aria-label="Seek"
        bind="duration:attr#max;currentTime:prop#value"
        on="pointerdown:beginScrub;keydown:beginScrub;input:scrub;change:seek;pointerup@document:endScrub;keyup:endScrub"
      />
    </slider-elemental>
    <button on="click:togglePlay" bind="playLabel:attr#aria-label">▶</button>
    <span bind="currentTime|time">00:00</span>
  </toolbar-elemental>
</media-player>
```

Delete the `<script>` and the page still plays: the `controls` attribute you wrote stays on
the media element until this one upgrades and takes over.

Keyboard shortcuts work the same way. `key="k"` on your button is the whole binding, and
`on="keydown@document:onKeyDown"` on the player is what makes the page answer it, so a
shortcut can never name an action no visible control names. The one exception is
`keys="ArrowUp:volumeUp;ArrowDown:volumeDown"` on the player, for the pair a volume slider
gives no button to. Nothing is bound by default; bind `keydown:onKeyDown` instead and the keys
only answer while focus is inside the player.

One element for both media. It reads which element you wrapped and turns on the video half
(poster, click-to-play overlay, click-to-pause on the picture, captions, fullscreen, fading
controls) only for a `<video>`. A custom element that speaks the media API is the third thing
it wraps, marked `class="media-player-media"`:
[`<video-background>`](https://github.com/stamat/video-background-element), which answers for
YouTube, Vimeo and a video file from one tag, or one of
[media-elements](https://github.com/muxinc/media-elements) for the formats it does not carry.
The manual has both recipes, live, with what each costs.

The scrubber and volume are
[`<slider-elemental>`](https://github.com/stamat/book-of-elementals), the buffered bar is
`<progress-elemental>`, the control row is `<toolbar-elemental>`, and the binding is
[hydrargyri](https://github.com/stamat/hydrargyri).

## Where it comes from

The original needed 24 `@target` declarations to reach its own controls, and a
`VideoPlayer extends AudioPlayer` class pair that had to talk to itself through a custom event
because the base class owned `connectedCallback`. Declarative binds took 16 of those targets,
listeners on the node they belong to took 4, three turned out to be state rather than nodes,
and one survived. The inheritance went with them: which media element you wrapped is read off
the child, so there is one class and one tag.

## Install

```bash
npm install media-player-element
```

The package and the repository are `media-player-element`; the element they define is
`<media-player>`.

Stylesheets are separate, and bundled: `bundle.css` is the structure, `bundle-theme.css` the
optional look, each with the elemental sheets folded in. The
[manual](https://stamat.github.io/media-player-element/#install) has the CDN block and the
à-la-carte sheets.

## Everything else

**<https://stamat.github.io/media-player-element/>** — the whole reference, the comparison
against Plyr, media-chrome, Vidstack and Video.js, and what this deliberately does not do.
This README is the pitch; that page is the manual.

## Development

```bash
script/bootstrap # npm ci, from a fresh clone
script/server    # build + serve with live reload, http://localhost:4040
script/build     # compile dist/ and index.html
script/test      # jest
script/lint      # eslint + stylelint (the authority; CI runs it)
```

[CONTRIBUTING.md](CONTRIBUTING.md) says what belongs here and what a pull request needs.

## License

[MIT](LICENSE) © [Stamat](https://github.com/stamat)
