import { HgElement } from 'hydrargyri';
import 'book-of-elementals/slider';
import 'book-of-elementals/progress';
import 'book-of-elementals/toolbar';

/**
 * A duration this long is a live stream rather than a file.
 *
 * Browsers disagree on what they report for an endless stream — some say `Infinity`, some
 * say a number near 2^32 — so the test is a threshold rather than an equality.
 *
 * @see https://github.com/sampotts/plyr/blob/master/src/js/controls.js
 */
export const LIVE_DURATION = 2 ** 32;

/** Where the volume slider and the media element disagree: one counts to 100, one to 1. */
export const VOLUME_SCALE = 100;

/** How long the video controls stay up after the pointer stops moving, in milliseconds. */
export const CONTROLS_LINGER = 5000;

/** Two digits, because `1:7` is not a time and `01:07` is. */
function pad(value) {
  return value < 10 ? `0${value}` : `${value}`;
}

/**
 * Seconds as `mm:ss`, or `hh:mm:ss` once there is an hour to show.
 *
 * The hour segment appears rather than sitting at `00:` all through a three minute song:
 * a label that changes width is cheaper to read than one that is permanently wrong about
 * how long the thing is.
 */
export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const total = Math.floor(seconds);
  const secs = total % 60;
  const mins = Math.floor(total / 60) % 60;
  const hrs = Math.floor(total / 3600);
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

/**
 * Volume rounded to one decimal, with the ends snapped shut.
 *
 * A slider that reads `0.97` at its top never sets the media element to `1`, so "full" is a
 * state the author can see on the track but never in `volumeState` — the snap is what makes
 * the mute and full icons reachable by dragging.
 */
export function clampVolume(value) {
  const rounded = Math.round(value * 10) / 10;
  if (rounded > 0.9) return 1;
  if (rounded < 0.1) return 0;
  return rounded;
}

/** Which of the three volume icons the level is asking for. */
export function volumeState(value) {
  if (value < 0.1) return 'mute';
  if (value < 0.6) return 'mid';
  return 'full';
}

/**
 * `<media-player>` custom element.
 *
 * One element over the `<audio>` or `<video>` the author already wrote. Which of the two it
 * is decides the video-only half — poster, overlay, captions, fullscreen, the controls that
 * hide themselves — and it is read off the child rather than off a `src`, because a `src`
 * attribute on the wrapper would mean no media element at all until the script arrives.
 * That is the whole bargain: the markup is the author's, `controls` on the media element is
 * the fallback, and a script that never loads leaves a working native player behind.
 *
 * The controls are the author's too. There is no generated control bar and no `controls`
 * option taking an HTML string — the buttons, the sliders and the labels are written in the
 * page, and [hydrargyri](https://github.com/stamat/hydrargyri) wires them by name: `on` says
 * what fires, `bind` says where state lands. Nothing here is evaluated, so a strict Content
 * Security Policy has nothing to object to.
 *
 * What the element does not draw, it borrows. The scrubber and the volume control are
 * `<slider-elemental>` around a native `<input type="range">`, which is where the whole
 * [APG Slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) already lives; the
 * buffered-ahead bar is `<progress-elemental buffer>`; the control row is
 * `<toolbar-elemental>`. None of their keyboard handling, ARIA or focus management is
 * rewritten here, which is why this element writes no `role` and no `aria-valuenow` of its
 * own.
 *
 * Degrades honestly. No script means the `controls` attribute the author wrote is still on
 * the media element and the browser's own player is what shows. The optional theme draws
 * nothing under `:not(:defined)`, so the fallback is never a themed control bar with dead
 * buttons on it.
 *
 * ponytail: no keyboard map of its own. Every control is a `<button>` or an
 * `<input type="range">`, so the platform already answers Space, Enter, the arrows, Home
 * and End on whichever one has focus. A player-wide map — `k`, `j`, `l`, `f`, `m` on the
 * host — is a second, undiscoverable set of bindings and wants its own pass.
 *
 * ponytail: the buffered bar is one span from the start, not the `TimeRanges` list the
 * media element actually holds. That is what a scrubber draws anyway; multiple spans want
 * their own element.
 *
 * @attr {boolean} is-ready - Metadata has arrived and the duration is known. CSS hook; the element sets it.
 * @attr {boolean} is-playing - The media is playing. CSS hook for the play/pause icon swap; the element sets it.
 * @attr {boolean} is-buffering - Waiting on data. CSS hook for a spinner; the element sets it.
 * @attr {boolean} is-live - The duration says this is an endless stream, so there is nothing to seek. CSS hook; the element sets it.
 * @attr {boolean} is-video - The wrapped element is a `<video>`. CSS hook; the element sets it.
 * @attr {boolean} is-fullscreen - CSS hook; the element sets it.
 * @attr {boolean} controls-shown - The video controls are up. CSS hook; the element sets it.
 * @attr {boolean} poster-hidden - The poster has been played past. CSS hook; the element sets it.
 * @attr {boolean} has-captions - A `<track>` was found, so a captions button is worth showing. CSS hook; the element sets it.
 * @attr {boolean} captions-visible - Captions are on. Persisted; the element sets it.
 * @attr {string} volume-state - `mute`, `mid` or `full`, for the three-icon volume button. CSS hook; the element sets it.
 * @attr {number} skip - Seconds a skip button moves. Defaults to 10.
 * @attr {string} storage-key - Prefix for the remembered volume, mute and captions state. Defaults to `media-player`; set it per player to keep two of them from sharing one volume.
 *
 * @cssprop {<color>} [--media-player-accent=Highlight] - The played part of the scrubber, and the focus ring.
 * @cssprop {<color>} [--media-player-surface=Canvas] - Behind the control row.
 * @cssprop {<color>} [--media-player-color=CanvasText] - Icons and labels on it.
 * @cssprop {<length>} [--media-player-gap=0.5rem] - Between controls.
 * @cssprop {<time>} [--media-player-fade=0.2s] - How long the video controls take to fade out.
 *
 * @fires media-player-ready - Metadata has arrived; the duration is known and the controls are live.
 * @fires media-player-interaction - Something was pressed, dragged or toggled. `detail` is `{ type, value }`.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 */
export class MediaPlayer extends HgElement {
  static attributes = [
    'is-ready',
    'is-playing',
    'is-buffering',
    'is-live',
    'is-video',
    'is-fullscreen',
    'controls-shown',
    'poster-hidden',
    'has-captions',
    'captions-visible',
    'volume-state',
    'skip'
  ];

  /**
   * State that never reaches the DOM.
   *
   * `currentTime` moves sixty times a second while playing. Reflected to an attribute that
   * would be sixty `setAttribute` calls a second, every one of them waking anything watching
   * the subtree — so the values that move fast live here, and only the flags CSS needs are
   * attributes.
   */
  static properties = [
    'currentTime',
    'remaining',
    'duration',
    'buffered',
    'volumePercent',
    'playLabel',
    'muteLabel',
    'captionsLabel',
    'captionText'
  ];

  static formatters = {
    time: (value) => formatTime(value)
  };

  connected() {
    this.media = this.querySelector('audio, video');
    if (!this.media) {
      console.warn('media-player: no <audio> or <video> inside — nothing to play');
      return;
    }

    this.isVideo = this.media.tagName === 'VIDEO';
    this.frame = 0;
    this.linger = null;

    // The author writes `controls` so the page works before this runs; taking it off is the
    // first thing the upgrade does, and the last thing undone if the element is removed.
    this.hadControls = this.media.controls;
    this.media.controls = false;

    this.duration = 0;
    this.currentTime = 0;
    this.remaining = 0;
    this.buffered = 0;
    this.isBuffering = true;
    this.playLabel = 'Play';
    this.muteLabel = 'Mute';
    this.captionsLabel = 'Enable captions';

    this.track = this.media.querySelector('track');
    if (this.track) this.hasCaptions = true;

    this.restore();

    // `durationchange`, `loadedmetadata`, `loadeddata`, `canplay` and `canplaythrough` are
    // used differently across browsers, and a small file can have fired all of them before
    // this element ever upgraded — so every one of them routes to the same idempotent
    // `loaded`, and it runs once more here for the file that was ready first.
    if (this.media.readyState > 0) this.loaded();
  }

  disconnected() {
    cancelAnimationFrame(this.frame);
    if (this.linger) clearTimeout(this.linger);
    // Put the page back the way it was found: an element removed from the DOM should leave
    // a media element that still plays, not a controlless one.
    if (this.media && this.hadControls) this.media.controls = true;
  }

  /**
   * Metadata has arrived. Idempotent, because five different events mean it.
   */
  loaded() {
    if (this.isReady || !this.media) return;
    const duration = this.media.duration;
    if (!duration || Number.isNaN(duration)) return;

    this.isLive = duration >= LIVE_DURATION;
    this.duration = this.isLive ? 0 : duration;
    this.remaining = this.duration;
    this.isReady = true;
    this.isBuffering = false;
    this.syncVolume();
    // `progress` is the only event that reports buffering, and a small file can be fully
    // buffered before this element upgrades — after which it never fires again and the bar
    // would sit at zero over a file that is entirely loaded. Read it once here, the same
    // way metadata is read once for the file that was ready first.
    this.onProgress();

    // Controls the author marked `disabled` so they could not be pressed before there was
    // anything to press. The element owns the enabling, so the markup can be honest.
    for (const control of this.querySelectorAll('[disabled]')) control.removeAttribute('disabled');

    this.dispatchEvent(new CustomEvent('media-player-ready', { bubbles: true }));
  }

  // PLAYBACK

  play() {
    this.media?.play();
  }

  pause() {
    this.media?.pause();
  }

  togglePlay() {
    if (!this.media) return;
    if (this.media.paused) this.play();
    else this.pause();
  }

  skipForward() {
    this.seekBy(this.skipStep);
    this.interaction('skip-forward', this.skipStep);
  }

  skipBackward() {
    this.seekBy(-this.skipStep);
    this.interaction('skip-backward', this.skipStep);
  }

  /** Seconds a skip button moves — the `skip` attribute, or ten. */
  get skipStep() {
    const step = Number(this.skip);
    return Number.isFinite(step) && step > 0 ? step : 10;
  }

  seekBy(seconds) {
    if (!this.media || this.isLive) return;
    this.seekTo(this.media.currentTime + seconds);
    this.posterHidden = true;
  }

  seekTo(seconds) {
    if (!this.media || this.isLive) return;
    const bounded = Math.min(Math.max(seconds, 0), this.media.duration || 0);
    this.media.currentTime = bounded;
    this.paint(bounded);
  }

  /**
   * Write the clock, the countdown and the scrubber position for one moment.
   *
   * One method rather than a setter each, because the three have to agree: a scrubber at
   * 1:03 beside a label reading 1:04 is the kind of wrong that looks like a rounding bug
   * and is actually two code paths.
   */
  paint(seconds) {
    this.currentTime = seconds;
    this.remaining = Math.max((this.media?.duration || 0) - seconds, 0);
  }

  /**
   * The playing clock.
   *
   * `timeupdate` fires about four times a second, which is visibly steppy under a moving
   * thumb, so the position comes off an animation frame while playing and the listener is
   * not used at all. Cancelled on pause, so a paused player costs nothing.
   */
  tick() {
    if (!this.media || this.media.paused) return;
    if (!this.isLive) this.paint(this.media.currentTime);
    this.frame = requestAnimationFrame(() => this.tick());
  }

  // HANDLERS THE MARKUP NAMES

  onLoaded() {
    this.loaded();
  }

  onPlay() {
    this.isPlaying = true;
    this.isBuffering = false;
    this.posterHidden = true;
    this.playLabel = 'Pause';
    this.resume();
    this.interaction('play');
    if (this.isVideo) this.showControls();
  }

  onPause() {
    this.isPlaying = false;
    this.isBuffering = false;
    this.playLabel = 'Play';
    cancelAnimationFrame(this.frame);
    this.interaction('pause');
    // A paused video keeps its controls: they are how you start it again.
    if (this.isVideo) {
      if (this.linger) clearTimeout(this.linger);
      this.controlsShown = true;
    }
  }

  onEnded() {
    this.pause();
  }

  onWaiting() {
    this.isBuffering = true;
  }

  onPlaying() {
    this.isBuffering = false;
  }

  /**
   * How far ahead the browser has loaded, in seconds.
   *
   * Seconds rather than a percentage so it shares a scale with `duration`, which is what the
   * `<progress>` behind the scrubber is set to — two values on one `max`, which is the whole
   * reason the buffered bar can sit behind the played one without any arithmetic in the
   * markup.
   */
  onProgress() {
    if (!this.media || !this.media.buffered.length || !this.media.duration) return;
    this.buffered = this.media.buffered.end(this.media.buffered.length - 1);
  }

  /**
   * Start or restart the clock, exactly once.
   *
   * Cancel before scheduling, always: `tick` schedules the next frame from inside itself, so
   * a second entry point that only called `tick` would leave two loops running and the
   * handle to just one of them.
   */
  resume() {
    cancelAnimationFrame(this.frame);
    this.tick();
  }

  /**
   * Dragging the scrubber: paint the labels, do not seek until the drag ends.
   *
   * The value is kept here rather than read back off the input when the drag commits. Two
   * events end a drag and their order is not guaranteed — Chrome sends `pointerup` before
   * `change` — and the clock restarting on the first of them writes `currentTime` straight
   * back into `input.value`. Whichever event then read the DOM would read the clock's
   * number instead of the one under the thumb, and the seek would go to where playback
   * already was.
   */
  scrub(event) {
    if (!this.media || this.isLive) return;
    cancelAnimationFrame(this.frame);
    this.pendingSeek = Number(event.target.value);
    this.paint(this.pendingSeek);
  }

  seek() {
    this.endDrag();
  }

  /**
   * A drag ended, whatever it did to the value.
   *
   * `change` cannot be the only way back: a thumb picked up and put down where it started
   * fires `input` — which stopped the clock — and then no `change` at all, because the value
   * the field ends on is the value it began on. The clock would stay stopped over playing
   * audio until the next play or pause. Bound to `pointerup` on the document rather than the
   * input, since a drag very often ends with the pointer somewhere else entirely.
   */
  endScrub() {
    this.endDrag();
  }

  /**
   * Land the drag: seek where the thumb was let go, forget it, start the clock.
   *
   * Both enders route here and the pending value is cleared first, so whichever of `change`
   * and `pointerup` arrives second finds nothing to land and only restarts the clock. Two
   * seeks from one release would be two `media-player-interaction` events for one gesture,
   * and the second would seek to wherever the restarted clock had already written.
   */
  endDrag() {
    const seconds = this.pendingSeek;
    if (seconds === null || seconds === undefined) {
      this.resume();
      return;
    }
    this.pendingSeek = null;
    this.seekTo(seconds);
    this.posterHidden = true;
    this.interaction('seek', this.currentTime);
    this.resume();
  }

  // VOLUME

  setVolume(event) {
    this.applyVolume(Number(event.target.value) / VOLUME_SCALE);
    this.interaction('volume', this.media?.volume);
  }

  applyVolume(value, remember = true) {
    if (!this.media) return;
    const volume = clampVolume(value);
    this.media.muted = volume === 0;
    this.media.volume = volume;
    if (volume > 0) this.lastVolume = volume;
    if (remember) {
      this.store('volume', volume);
      this.store('muted', volume === 0);
    }
  }

  toggleMute() {
    if (!this.media) return;
    const muting = !this.media.muted && this.media.volume > 0;
    this.applyVolume(muting ? 0 : this.lastVolume || 1);
    this.interaction(muting ? 'mute' : 'unmute');
  }

  /**
   * The DOM's volume back into the controls.
   *
   * Bound to `volumechange` as well as called directly, because the media element is not the
   * only thing that can move it — an OS media key and a devtools poke both land here, and a
   * slider that disagrees with the sound coming out is worse than no slider.
   */
  syncVolume() {
    if (!this.media) return;
    const volume = this.media.muted ? 0 : this.media.volume;
    this.volumePercent = Math.round(volume * VOLUME_SCALE);
    this.volumeState = volumeState(volume);
    this.muteLabel = volume === 0 ? 'Unmute' : 'Mute';
  }

  onVolumeChange() {
    this.syncVolume();
  }

  // CAPTIONS

  onCue(event) {
    const track = event.target.track;
    const cues = track?.activeCues;
    if (!cues || !cues.length) {
      this.captionText = null;
      return;
    }
    // Firefox paints its own caption box over the video unless the track is hidden; hidden
    // still fires `cuechange`, which is the only reason the text can be rendered here.
    track.mode = 'hidden';
    this.captionText = cues[0].text;
  }

  toggleCaptions() {
    this.setCaptions(!this.captionsVisible);
    this.interaction(this.captionsVisible ? 'captions-on' : 'captions-off');
  }

  setCaptions(visible, remember = true) {
    if (!this.track) return;
    this.captionsVisible = visible;
    this.captionsLabel = visible ? 'Disable captions' : 'Enable captions';
    this.track.track.mode = visible ? 'hidden' : 'disabled';
    if (!visible) this.captionText = null;
    if (remember) this.store('captions', visible);
  }

  // FULLSCREEN

  /**
   * Fullscreen, by feature test rather than by browser.
   *
   * iPhone Safari has never allowed an arbitrary element to go fullscreen; what it has is
   * `webkitEnterFullscreen` on the video element itself, which takes the video over natively
   * and leaves these controls behind. Asking the element what it can do — rather than asking
   * the user agent string who it is — is the version that keeps working when the answer
   * changes.
   */
  toggleFullscreen() {
    if (!this.isVideo) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }

    if (this.requestFullscreen) this.requestFullscreen();
    else if (this.media.webkitEnterFullscreen) this.media.webkitEnterFullscreen();
    else return;

    this.interaction('fullscreen');
  }

  onFullscreenChange() {
    this.isFullscreen = document.fullscreenElement === this;
  }

  // VIDEO CONTROLS THAT HIDE THEMSELVES

  /**
   * Show the controls, and start the clock that takes them away again.
   *
   * A paused video keeps them: the timer is only started while something is playing, so a
   * player sitting paused never hides the button that would start it.
   */
  showControls() {
    if (!this.isVideo) return;
    this.controlsShown = true;
    if (this.linger) clearTimeout(this.linger);
    if (!this.media || this.media.paused) return;
    this.linger = setTimeout(() => { this.controlsShown = false; }, CONTROLS_LINGER);
  }

  // PERSISTENCE

  /** The prefix for remembered values — `storage-key`, or one shared by every player. */
  get storageKey() {
    return this.getAttribute('storage-key') || 'media-player';
  }

  /**
   * Remember a value, if the browser will have it.
   *
   * `localStorage` throws rather than returning anything in a Safari private window and
   * under a cookie policy that blocks storage. Remembering the volume is a nicety; taking
   * the page down over it is not, so the failure is swallowed here and nowhere else.
   */
  store(key, value) {
    try {
      localStorage.setItem(`${this.storageKey}-${key}`, JSON.stringify(value));
    } catch { /* storage refused; the session keeps its volume, the next one starts fresh */ }
  }

  read(key) {
    try {
      const raw = localStorage.getItem(`${this.storageKey}-${key}`);
      return raw === null ? null : JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Volume, mute and captions from last time.
   *
   * Nothing is written back while restoring: `applyVolume` would otherwise store the value
   * it just read, and a player that never got a real volume set on it would keep rewriting
   * the same entry on every page load.
   */
  restore() {
    const volume = this.read('volume');
    const muted = this.read('muted');
    if (typeof volume === 'number') this.applyVolume(muted ? 0 : volume, false);
    if (typeof volume === 'number' && volume > 0) this.lastVolume = volume;
    this.syncVolume();

    const captions = this.read('captions');
    if (this.track) this.setCaptions(captions === true, false);
  }

  /** Something was pressed, dragged or toggled. One event, so a page can log all of it. */
  interaction(type, value = null) {
    this.dispatchEvent(new CustomEvent('media-player-interaction', {
      bubbles: true,
      detail: { type, value }
    }));
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('media-player')) {
  customElements.define('media-player', MediaPlayer);
}

export default MediaPlayer;
