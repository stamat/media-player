# ▶ media-player

> A media player you write in HTML — one custom element over the `<audio>` or `<video>` you already wrote.

Every media player library starts by taking the player away from you: you hand over a
`<video>` and a config object, and back comes someone else's control bar. Wanting a
different arrangement means learning a `controls` array, or passing an HTML string into a
config option — templating in JavaScript wearing a smaller hat.

This one goes the other way. **You write the controls.** Buttons and range inputs in your
page, styled by your stylesheet, in the order you put them. The element wires them by name.

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
    on="loadedmetadata:onLoaded;play:onPlay;pause:onPause;progress:onProgress"
  ></audio>

  <toolbar-elemental
    class="media-player-controls"
    aria-label="Playback"
    bind="isReady:if"
  >
    <slider-elemental class="media-player-scrubber">
      <input
        type="range"
        min="0"
        step="1"
        aria-label="Seek"
        bind="duration:attr#max;currentTime:prop#value"
        on="input:scrub;change:seek"
      />
    </slider-elemental>
    <button on="click:togglePlay" bind="playLabel:attr#aria-label">▶</button>
    <span bind="currentTime|time">00:00</span>
  </toolbar-elemental>
</media-player>
```

Delete the `<script>` and the page still plays: the `controls` attribute you wrote stays on
the media element until this one upgrades and takes over.

One element for both — it reads which element you wrapped and turns on the video half
(poster, overlay, captions, fullscreen, fading controls) only for a `<video>`. The scrubber
and volume are [`<slider-elemental>`](https://github.com/stamat/book-of-elementals), the
buffered bar is `<progress-elemental>`, the control row is `<toolbar-elemental>`, and the
binding is [hydrargyri](https://github.com/stamat/hydrargyri).

## Where it comes from

What changed in the rewrite is worth the paragraph, because it is the argument for the whole
approach. The original needed 24 `@target` declarations to reach its own controls, and a
`VideoPlayer extends AudioPlayer` class pair that had to talk to itself through a custom
event because the base class owned `connectedCallback`. Here declarative binds took 16 of
those targets, listeners on the node they belong to took 4, three were labels that turned
out to be state rather than nodes — and one survived. The inheritance went with them: which
media element you wrapped is read off the child, so there is one class and one tag.

## Install

```bash
npm install media-player
```

## Everything else

**<https://stamat.github.io/media-player/>** — the whole reference, the comparison against
Plyr, media-chrome, Vidstack and Video.js, and what this deliberately does not do. There is
no second copy of it: this README is the pitch, that page is the manual.

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
