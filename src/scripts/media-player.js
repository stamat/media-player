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

/** How much one press of a volume button moves, as a share of full. */
export const VOLUME_STEP = 0.1;

/** How long the video controls stay up after the pointer stops moving, in milliseconds. */
export const CONTROLS_LINGER = 5000;

/** How long after the last volume input before the level is persisted and announced, in milliseconds. */
export const VOLUME_SETTLE = 500;

/**
 * The actions the OS media panel is told about.
 *
 * Play and pause are not among them on purpose: the browser draws and answers both with no
 * code at all, and setting a handler *replaces* that default rather than adding to it. These
 * four are the ones whose buttons never appear until something claims them.
 */
const SESSION_ACTIONS = ['seekbackward', 'seekforward', 'seekto', 'stop'];

/**
 * Which player the OS media panel currently points at.
 *
 * `navigator.mediaSession` belongs to the document, not to an element, so two players on one
 * page share a single lock screen. The last to start playing claims it, and nothing releases
 * it on pause — a panel that forgot the paused player is a pause button with no play behind
 * it.
 */
let sessionOwner = null;

/**
 * An artwork URL the OS can actually fetch.
 *
 * The panel is drawn outside the document, so a relative path has no base to resolve
 * against. A path that will not parse returns nothing rather than a broken image: the panel
 * falling back to its own default is honest, a missing-image glyph on a lock screen is not.
 */
function absoluteUrl(value) {
  try {
    return new URL(value, document.baseURI).href;
  } catch {
    return null;
  }
}

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
 * Volume with the ends snapped shut.
 *
 * A slider that reads `0.97` at its top never sets the media element to `1`, so "full" is a
 * state the author can see on the track but never in `volumeState` — the snap is what makes
 * the mute and full icons reachable by dragging. Only the ends: rounding the middle would
 * quantise the slider, and the `volumePercent` write-back would drag the thumb to the
 * rounded value in the middle of the drag that set it.
 */
export function clampVolume(value) {
  if (value > 0.9) return 1;
  if (value < 0.1) return 0;
  return value;
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
 * It also claims the OS media panel — lock screen, hardware media keys, headphone buttons —
 * when playback starts. Play and pause are the browser's own and work with or without this
 * element; what the claim adds is skip buttons moving by the same `skip` the page's buttons
 * use, a working scrubber, and a title on the lock screen. The panel is one per document, so
 * the last player to start is the one it points at.
 *
 * Two limits worth knowing before you reach for them. There is no keyboard map of its own:
 * every control is a `<button>` or an `<input type="range">`, so the platform already
 * answers Space, Enter, the arrows, Home and End on whichever one has focus, and a
 * player-wide `k`/`j`/`l` map would be a second set of bindings with nothing on the page
 * announcing them. And the buffered bar is one span from the start rather than the
 * `TimeRanges` list the media element holds, because `<progress>` carries one value — after
 * a seek it shows how far the range under the playhead reaches, not the gap behind it.
 *
 * @attr {boolean} is-ready - Metadata has arrived and the duration is known. CSS hook; the element sets it.
 * @attr {boolean} is-playing - The media is playing. CSS hook for the play/pause icon swap; the element sets it.
 * @attr {boolean} is-buffering - Waiting on data. CSS hook for a spinner; the element sets it.
 * @attr {boolean} is-live - The duration says this is an endless stream, so there is nothing to seek. CSS hook; the element sets it.
 * @attr {boolean} is-video - The wrapped element is a `<video>`. CSS hook; the element sets it.
 * @attr {boolean} is-fullscreen - CSS hook; the element sets it.
 * @attr {boolean} no-fullscreen - Fullscreen has no door to open here — an iframe without `allow="fullscreen"` is the common way. CSS hook for hiding the button that would do nothing; the element sets it.
 * @attr {boolean} controls-shown - The video controls are up. CSS hook; the element sets it.
 * @attr {boolean} poster-hidden - The poster has been played past. CSS hook; the element sets it.
 * @attr {boolean} has-captions - A `<track>` was found, so a captions button is worth showing. CSS hook; the element sets it.
 * @attr {boolean} captions-visible - Captions are on. Persisted; the element sets it.
 * @attr {string} volume-state - `mute`, `mid` or `full`, for the three-icon volume button. CSS hook; the element sets it.
 * @attr {number} skip - Seconds a skip button moves. Defaults to 10.
 * @attr {string} media-title - What the OS media panel calls this. Falls back to the media element's own `title`.
 * @attr {string} artist - Who made it, for the OS media panel.
 * @attr {string} album - What it came from, for the OS media panel.
 * @attr {string} artwork - Cover image for the OS media panel. Falls back to a `<video>`'s `poster`. Relative paths are resolved against the page.
 * @attr {string} storage-key - Prefix for the remembered volume, mute and captions state. Defaults to `media-player`; set it per player to keep two of them from sharing one volume.
 *
 * @cssprop {<color>} [--media-player-accent=#22c55e] - The played fill, the hover that floods a button, a toggle held on, the thumbs, the overlay chip, the focus ring.
 * @cssprop {<color>} [--media-player-accent-ink=#fff] - What sits on the accent: the flooded button's glyph, the chip's triangle. Change it with the accent.
 * @cssprop {<color>} [--media-player-surface=Canvas] - Behind the control row.
 * @cssprop {<color>} [--media-player-color=CanvasText] - Icons and labels on it.
 * @cssprop {<length>} [--media-player-radius=0.5rem] - The control row's corners, and the video's.
 * @cssprop {<length>} [--media-player-gap=0.5rem] - Between controls.
 * @cssprop {<time>} [--media-player-fade=0.2s] - How long the video controls take to fade out.
 *
 * @fires media-player-ready - Metadata has arrived; the duration is known and the controls are live.
 * @fires media-player-interaction - Something was pressed, dragged or toggled. `detail` is `{ type, value }`.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 */

// NOTE: the two limits in the doc above are deferrals, not permanent refusals, and the
// doc is consumer-facing so it carries no triggers. The keyboard map comes back when the
// bindings can be discoverable — a visible key list, or a player with no control row, where
// there is no focused control to answer in the first place. The multi-span buffered bar
// comes back when a scrubber has to draw the hole seeking leaves in a long stream, and it
// arrives as an element in book-of-elementals rather than a change here.
export class MediaPlayer extends HgElement {
  static attributes = [
    'is-ready',
    'is-playing',
    'is-buffering',
    'is-live',
    'is-video',
    'is-fullscreen',
    'no-fullscreen',
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
    'captionText',
    'timeFormatter'
  ];

  static formatters = {
    time: (value) => formatTime(value),

    /**
     * Whole seconds, for the two nodes that draw the scrubber.
     *
     * The thumb and the played bar have to be given the *same* number or they disagree on
     * screen. A range input with `step="1"` snaps what it is assigned to the **nearest**
     * step while a bar drawn from the raw value keeps every decimal, so 3.6 is a thumb at 4
     * beside a fill at 3.6 — a whole step apart at the worst moment, twice a second. Floor
     * both and there is one number and nothing to disagree about.
     */
    floor: (value) => (Number.isFinite(value) ? Math.floor(value) : value),

    /**
     * For `attr#aria-pressed` binds on toggle buttons. ARIA wants the literal strings
     * "true" and "false" — a raw boolean bind would write an empty attribute for true and
     * remove it for false, and a removed `aria-pressed` reads as "not a toggle at all".
     */
    pressed: (value) => (value ? 'true' : 'false')
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

    // Present only when no fullscreen door will open — an iframe without
    // `allow="fullscreen"` is the common way to get here — so a stylesheet can hide the
    // button that would silently do nothing.
    if (this.isVideo) {
      this.noFullscreen = !(document.fullscreenEnabled || this.media.webkitEnterFullscreen);
    }

    // The author writes `controls` so the page works before this runs; taking it off is the
    // first thing the upgrade does, and the last thing undone if the element is removed.
    this.hadControls = this.media.controls;
    this.media.controls = false;

    // A move in the DOM is a disconnect and a connect, and hydrargyri runs this method on
    // both connects. A player that was already ready keeps its state: resetting it here
    // would wedge the duration at zero, because `loaded` cannot run twice — so a reconnect
    // only takes the controls back off (undone just above by `disconnected`) and restarts
    // the clock, which `tick` reduces to nothing if the move paused the media.
    if (this.isReady) {
      this.resume();
      // A move releases the panel on the way out and no `play` fires to take it back, so a
      // player still playing has to claim it again here or the lock screen goes quiet mid-track.
      if (this.isPlaying) this.claimSession();
      return;
    }

    this.duration = 0;
    this.currentTime = 0;
    this.remaining = 0;
    this.buffered = 0;
    this.isBuffering = true;
    this.playLabel = 'Play';
    this.muteLabel = 'Mute';
    this.captionsLabel = 'Enable captions';
    // Handed to the scrubber's `<slider-elemental>` through a `prop#format` bind, so the
    // value bubble reads `01:12` rather than `72`. A property rather than a `querySelector`
    // and an assignment: the markup says which slider gets it, and this element keeps its
    // one reference.
    this.timeFormatter = formatTime;

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
    if (this.settle) clearTimeout(this.settle);
    this.releaseSession();
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

  /** Pause and go home. `seekTo` refuses both halves for a live stream, so there it only pauses. */
  stop() {
    if (!this.media) return;
    this.pause();
    this.seekTo(0);
    this.interaction('stop');
  }

  skipForward() {
    if (!this.media || this.isLive) return;
    this.seekBy(this.skipStep);
    this.interaction('skip-forward', this.skipStep);
  }

  skipBackward() {
    if (!this.media || this.isLive) return;
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
    this.updatePositionState();
  }

  // THE OS MEDIA PANEL

  /**
   * Point the lock screen, the hardware media keys and the headphone buttons at this player.
   *
   * Claimed when playback starts rather than when the element upgrades, because the claim is
   * a document-wide singleton and the player someone just started is the one they mean.
   *
   * Each action is registered on its own: a browser that does not know one throws on that
   * call, and an unknown name should not cost the panel the buttons it does support. The
   * ones this player cannot answer are set to `null`, which is how the spec takes a button
   * off the panel rather than leaving it there doing nothing.
   */
  claimSession() {
    if (!this.media || !('mediaSession' in navigator)) return;
    sessionOwner = this;
    navigator.mediaSession.metadata = this.sessionMetadata();

    // Stop survives a live stream — `stop` only pauses there, which is the whole of what
    // stopping a stream can mean — but seeking does not, so those three come off the panel.
    const handlers = { stop: () => this.stop() };
    if (!this.isLive) {
      handlers.seekbackward = ({ seekOffset }) => this.seekBy(-(seekOffset || this.skipStep));
      handlers.seekforward = ({ seekOffset }) => this.seekBy(seekOffset || this.skipStep);
      handlers.seekto = ({ seekTime }) => this.seekTo(seekTime);
    }

    for (const action of SESSION_ACTIONS) {
      try {
        navigator.mediaSession.setActionHandler(action, handlers[action] ?? null);
      } catch {
        // An action this browser has never heard of. The rest of them still register.
      }
    }

    this.updatePositionState();
  }

  /**
   * What the OS panel is told this is, out of markup the author already wrote.
   *
   * The fallbacks are the point. A page that names its track in the media element's own
   * `title`, or a video that already carries a `poster`, gets a populated lock screen with
   * no new attributes at all — the four here are for what that markup cannot say.
   *
   * Nothing is invented from the file name. With no attributes and no poster this returns
   * `null`, which clears the metadata and leaves the browser's own default in place: a
   * lock screen reading `tone.wav` is worse than one reading nothing.
   */
  sessionMetadata() {
    if (typeof MediaMetadata === 'undefined') return null;
    const title = this.getAttribute('media-title') || this.media.getAttribute('title') || '';
    const artist = this.getAttribute('artist') || '';
    const album = this.getAttribute('album') || '';
    const art = this.getAttribute('artwork') || (this.isVideo ? this.media.getAttribute('poster') : '');
    const src = art ? absoluteUrl(art) : null;
    if (!title && !artist && !album && !src) return null;
    return new MediaMetadata({ title, artist, album, artwork: src ? [{ src }] : [] });
  }

  /**
   * Tell the panel where the playhead is.
   *
   * Called at the moments the position jumps rather than from `paint`, which runs on every
   * animation frame: the OS scrubber interpolates from the last state and the playback rate,
   * so sixty calls a second would move the same thumb at sixty times the cost.
   *
   * Owning the session is also the proof that the API was there to claim, which is why there
   * is no second feature test here. A live stream is skipped: the spec wants `Infinity` for a
   * duration with no end, this element reports live as `0`, and a position past a zero
   * duration is a `TypeError`.
   */
  updatePositionState() {
    if (sessionOwner !== this || !this.media || this.isLive) return;
    if (!navigator.mediaSession.setPositionState) return;
    const duration = this.media.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;
    navigator.mediaSession.setPositionState({
      duration,
      position: Math.min(Math.max(this.media.currentTime, 0), duration),
      // Zero is a `TypeError`, and a media element that has not started can report it.
      playbackRate: this.media.playbackRate || 1
    });
  }

  /** Hand the panel back, so a player taken off the page stops driving the lock screen. */
  releaseSession() {
    if (sessionOwner !== this) return;
    sessionOwner = null;
    navigator.mediaSession.metadata = null;
    for (const action of SESSION_ACTIONS) {
      try {
        navigator.mediaSession.setActionHandler(action, null);
      } catch {
        // Never registered in the first place.
      }
    }
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
   * not used at all. Cancelled on pause, and never scheduled for a live stream — there is
   * no clock to paint, and a loop that painted nothing would still run at sixty a second.
   */
  tick() {
    if (!this.media || this.media.paused || this.isLive) return;
    this.paint(this.media.currentTime);
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
    this.claimSession();
    this.interaction('play');
    if (this.isVideo) this.showControls();
  }

  onPause() {
    this.isPlaying = false;
    this.isBuffering = false;
    this.playLabel = 'Play';
    cancelAnimationFrame(this.frame);
    this.updatePositionState();
    this.interaction('pause');
    // A paused video keeps its controls: they are how you start it again.
    if (this.isVideo) {
      if (this.linger) clearTimeout(this.linger);
      this.controlsShown = true;
    }
  }

  /**
   * Playback reached the end.
   *
   * The clock is painted here rather than left where the last animation frame put it. That
   * frame ran some fraction of a second before the end and the scrubber floors to whole
   * seconds, so a track that finished would leave the thumb a step short of the end it just
   * reached — the one position a listener is certain about, and the one it got wrong.
   */
  onEnded() {
    if (!this.isLive && this.media) this.paint(this.media.duration);
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
   *
   * The range the playhead sits in, not the first or the furthest: after a seek the browser
   * holds disjoint ranges, and either end would lie — the first stops behind the playhead,
   * the last draws a bar over a gap playback has not crossed. When the playhead is between
   * ranges the bar keeps its last value rather than guessing.
   */
  onProgress() {
    if (!this.media || !this.media.duration) return;
    const ranges = this.media.buffered;
    const at = this.media.currentTime;
    for (let i = 0; i < ranges.length; i++) {
      if (ranges.start(i) <= at && at <= ranges.end(i)) {
        this.buffered = ranges.end(i);
        return;
      }
    }
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

  /**
   * The volume slider, per `input` event.
   *
   * The level is applied immediately — the sound has to follow the thumb — but persisting
   * and announcing wait for the drag to settle: `input` fires for every pixel, and a
   * localStorage write per pixel is a synchronous disk touch dozens of times a second.
   */
  setVolume(event) {
    this.applyVolume(Number(event.target.value) / VOLUME_SCALE, false);
    clearTimeout(this.settle);
    this.settle = setTimeout(() => {
      if (!this.media) return;
      this.rememberVolume(this.media.volume);
      this.interaction('volume', this.media.volume);
    }, VOLUME_SETTLE);
  }

  volumeUp() {
    this.stepVolume(1);
  }

  volumeDown() {
    this.stepVolume(-1);
  }

  /**
   * One press of a dedicated volume button — for a UI without a slider.
   *
   * From muted it climbs from zero in steps rather than jumping back to the remembered
   * level: a button press promises a small change. The step equals the mute threshold, so
   * the first press up is audible and the last press down is silence, with no dead press
   * at either end.
   */
  stepVolume(direction) {
    if (!this.media) return;
    const current = this.media.muted ? 0 : this.media.volume;
    this.applyVolume(current + direction * VOLUME_STEP);
    this.interaction(direction > 0 ? 'volume-up' : 'volume-down', this.media.volume);
  }

  applyVolume(value, remember = true) {
    if (!this.media) return;
    const volume = clampVolume(value);
    this.media.muted = volume === 0;
    this.media.volume = volume;
    if (volume > 0) this.lastVolume = volume;
    if (remember) this.rememberVolume(volume);
  }

  /**
   * Persist the level and the flag as two entries, and never store a zero level: muting
   * writes `muted` and leaves `volume` at what it was, so a reload restores the mute and
   * unmuting after it returns to the old level rather than jumping to full.
   */
  rememberVolume(volume) {
    if (volume > 0) this.store('volume', volume);
    this.store('muted', volume === 0);
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

    // `=== this`, not truthy: when something else on the page holds fullscreen, the answer
    // is to ask for this element — the browser swaps them — not to close the other one.
    if (document.fullscreenElement === this) {
      document.exitFullscreen();
      this.interaction('fullscreen', false);
      return;
    }

    if (this.requestFullscreen) this.requestFullscreen();
    else if (this.media.webkitEnterFullscreen) this.media.webkitEnterFullscreen();
    else return;

    this.interaction('fullscreen', true);
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
