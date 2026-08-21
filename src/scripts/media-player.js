import { HgElement } from 'hydrargyri';
import 'book-of-elementals/slider';
import 'book-of-elementals/progress';
import 'book-of-elementals/toolbar';
import 'book-of-elementals/tooltip';

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

/**
 * One thumbnails cue as a paintable frame, or null for a payload that is not a URL.
 *
 * Resolved against the VTT file's own URL, because that is where the relative paths in
 * these files point — the sprite sits beside the VTT, not beside the page. Resolution is
 * also the escaping boundary: URL serialisation percent-encodes `"` and `\`, so the string
 * later dropped into `url("…")` cannot close it. The `#xywh=` media fragment is the only
 * syntax read here; the VTT itself was the browser's to parse.
 */
export function parseThumb(text, base) {
  let url;
  try {
    url = new URL((text || '').trim(), base);
  } catch {
    return null;
  }
  const region = url.hash.match(/^#xywh=(\d+),(\d+),(\d+),(\d+)$/);
  if (!region) return { src: url.href };
  url.hash = '';
  return { src: url.href, x: +region[1], y: +region[2], w: +region[3], h: +region[4] };
}

/** Which of the three volume icons the level is asking for. */
export function volumeState(value) {
  if (value < 0.1) return 'mute';
  if (value < 0.6) return 'mid';
  return 'full';
}

/**
 * The kinds the captions button governs: captions, subtitles, and the bare `<track>` the
 * platform itself defaults to subtitles. `findCaptions` and `onCue` both ask this one
 * question — a button that declined a chapters track whose cues still painted was the two
 * of them keeping separate rules. Case-insensitive because the platform reads `kind` as an
 * enumerated attribute, `kind="Captions"` included, while a raw attribute read does not.
 */
const CAPTION_KINDS = new Set(['captions', 'subtitles', '']);

export function isCaptionKind(kind) {
  return CAPTION_KINDS.has((kind || '').toLowerCase());
}

/**
 * Fields whose own letters a key press belongs to.
 *
 * A comment box under a player is the ordinary case, not the exotic one, and a `k` typed
 * into it must reach it. The excluded input types answer arrows and Space and nothing
 * alphabetic, so a range or a checkbox with focus is still a fair place to press a letter.
 */
const TYPING_FIELDS =
  'input:not([type=range],[type=checkbox],[type=radio],[type=button],[type=submit],[type=reset]),textarea,select';

/** Is this key being typed into something, rather than pressed at the player? */
function isTyping(node) {
  return !!node && node.nodeType === 1 && (node.isContentEditable || node.matches(TYPING_FIELDS));
}

/**
 * The two keys that press whatever holds focus, so a `key` can never claim them off it.
 *
 * Space and Enter are how the platform activates a focused control, and a checkbox answers
 * no other key at all. YouTube documents the same split — Space pauses when the player holds
 * focus and activates the button when a button does — which is what hands are used to.
 * Letters have no such owner, which is why they are the keys worth claiming.
 *
 * A link is in the list for Enter, which follows it, and stays in it for Space, which does
 * not: Space over a link scrolls the page, and the page's scroll key is no more this
 * element's to take than the link is.
 *
 * A control claiming Space that also holds focus loses nothing: the press is left alone and
 * the platform clicks it, which is the same click by a shorter route.
 */
const ACTIVATION_KEYS = new Set([' ', 'enter']);
const ACTIVATED_CONTROLS =
  'button,input[type=button],input[type=submit],input[type=reset],input[type=checkbox],input[type=radio],a[href],summary,[role=button],[role=checkbox],[role=switch],[role=link]';

/** Does the platform already press this node with Space or Enter? */
function isActivated(node) {
  return !!node && node.nodeType === 1 && node.matches(ACTIVATED_CONTROLS);
}

/**
 * The keys a focused control spends on its own value or its own group, so a `key` can
 * never claim one off it. Every `<input type="range">` answers the arrows, Home, End and
 * the Page keys — the APG Slider pattern the elementals lean on — and a radio group walks
 * itself with the arrows. The toolbar needs no entry here: it calls `preventDefault` on
 * the arrows it spends walking the row, and an already-handled press is declined anyway.
 *
 * This is what makes an arrow honest to write in a `key` at all. Bound to a skip button it
 * answers on the player itself, the overlay and any plain button — and a slider under
 * focus still moves by its own step, rather than stepping and skipping off one press.
 */
const ARROW_KEYS = new Set(['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'home', 'end', 'pageup', 'pagedown']);
const ARROWED_CONTROLS = 'input[type=range],input[type=radio]';

/** Does the focused control spend this key on itself already? */
function isArrowed(node) {
  return !!node && node.nodeType === 1 && node.matches(ARROWED_CONTROLS);
}

/**
 * The `keys` attribute parsed for one press: `keys="ArrowUp:volumeUp;ArrowDown:volumeDown"`
 * maps a key straight to a method, for the action no visible control names — a volume that
 * is a slider has no button to carry `key="ArrowUp"`. Pairs split on `;`, each split at its
 * last `:` so a key that is itself a colon still parses, and a key half that trims to
 * nothing is the space key, which an attribute can write no other way.
 */
export function keyedMethod(value, pressed) {
  if (!value) return null;
  for (const entry of value.split(';')) {
    const at = entry.lastIndexOf(':');
    if (at < 1) continue;
    const half = entry.slice(0, at);
    const key = half.trim() || ' ';
    const method = entry.slice(at + 1).trim();
    if (method && key.toLowerCase() === pressed) return method;
  }
  return null;
}

/**
 * The element actually holding focus, walked through any open shadow root.
 *
 * A `keydown` is retargeted at a shadow boundary, so a `<textarea>` inside a web component
 * arrives at the document as the component itself and reads as no field at all. Bound
 * page-wide that is the difference between a `k` typed into someone's comment box and a `k`
 * that pauses the video, so the focused element is asked for as well — walked in, because
 * `activeElement` is retargeted exactly the same way at every level.
 *
 * A closed root reports its host and cannot be walked into, so a text field inside one is
 * invisible here and its letters are taken. Nothing in the platform says otherwise; a page
 * that has one wants the focused binding rather than the page-wide one.
 */
function focusedElement() {
  let node = document.activeElement;
  while (node && node.shadowRoot && node.shadowRoot.activeElement) node = node.shadowRoot.activeElement;
  return node;
}

/**
 * `<media-player>` custom element.
 *
 * One element over the `<audio>` or `<video>` the author already wrote. Which of the two it
 * is decides the video-only half — poster, click-to-play overlay, captions, fullscreen, the controls that
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
 * What the author does not write is the media element's wiring. The events that keep this
 * element in step with playback — metadata, play state, buffering, `progress`,
 * `volumechange`, a caption track's `cuechange` — are declared in `static wires` and
 * attached by hydrargyri at upgrade: there is nothing in those pairs to choose, and one
 * forgotten in an `on=` was a player that half-worked with nothing saying why. Markup that
 * still carries them keeps firing once, because a pair the attribute already wired is
 * skipped.
 *
 * What the element does not draw, it borrows. The scrubber and the volume control are
 * `<slider-elemental>` around a native `<input type="range">`, which is where the whole
 * [APG Slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) already lives; the
 * buffered-ahead bar is `<progress-elemental>`; the control row is
 * `<toolbar-elemental>`. None of their keyboard handling, ARIA or focus management is
 * rewritten here, which is why this element writes no `role` and no `aria-valuenow` of its
 * own.
 *
 * Frame previews on the scrubber are the same bargain. The author adds a
 * `<track kind="metadata">` naming a WebVTT of `sprite.jpg#xywh=…` cues — the format Plyr
 * and Vidstack read, generated by `script/thumbs` in this repository — and a
 * `.media-player-preview` box inside the scrubber; hovering paints the cue's frame into
 * the box. The browser parses the VTT, so the only syntax read here is the `#xywh`
 * fragment, and a player without the track, the box or a seekable duration previews
 * nothing rather than erring.
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
 * The keys are the markup as well. A `key="k"` on a control the author already wrote is the
 * whole binding — the player finds that control and clicks it — and an `on=` naming
 * `onKeyDown` is what makes it listen at all. So there is no second list of bindings to keep
 * in step with the buttons and none to announce separately: the key names an action a
 * visible control already names. Which `keydown` it is bound to is the whole of the scope —
 * `keydown:onKeyDown` answers while focus is inside the player, `keydown@document:onKeyDown`
 * answers anywhere on the page, and the page-wide form is what a shortcut usually means.
 * The one binding with no control to live on goes in `keys` — `volumeUp` behind a volume
 * that is a slider — mapping a key straight to a method; a control's own `key` outranks it.
 * Nothing is bound by default, and a focused control keeps the keys it already answers —
 * the toolbar its walk, a slider its arrows, Home and End — so a `key` naming an arrow
 * answers only where nothing spends it: `key="ArrowRight"` on a skip button skips while
 * the player holds focus, and a focused scrubber still nudges by its own step.
 *
 * One limit worth knowing before you reach for it. The buffered bar is one span from the
 * start rather than the `TimeRanges` list the media element holds, because `<progress>`
 * carries one value — after a seek it shows how far the range under the playhead reaches,
 * not the gap behind it.
 *
 * @attr {boolean} is-ready - Metadata has arrived and the duration is known. CSS hook; the element sets it.
 * @attr {boolean} is-playing - The media is playing. CSS hook for the play/pause icon swap; the element sets it.
 * @attr {boolean} is-buffering - Waiting on data. CSS hook for a spinner; the element sets it.
 * @attr {boolean} is-live - The duration says this is an endless stream, so there is nothing to seek. CSS hook; the element sets it.
 * @attr {boolean} is-video - The wrapped element is a `<video>`. CSS hook; the element sets it.
 * @attr {boolean} is-fullscreen - CSS hook; the element sets it.
 * @attr {boolean} no-fullscreen - Fullscreen has no door to open here — an iframe without `allow="fullscreen"` is the common way. CSS hook for hiding the button that would do nothing; the element sets it.
 * @attr {boolean} controls-shown - The video controls are up. CSS hook; the element sets it.
 * @attr {boolean} poster-hidden - The poster has been played past. CSS hook; the element sets it. The click-to-play overlay is not hidden by it — that one follows `is-playing`, so it returns whenever a video pauses.
 * @attr {boolean} has-captions - A caption track was found, so a captions button is worth showing. CSS hook; the element sets it.
 * @attr {boolean} captions-visible - Captions are on. Persisted; the element sets it.
 * @attr {string} volume-state - `mute`, `mid` or `full`, for the three-icon volume button. CSS hook; the element sets it.
 * @attr {number} skip - Seconds a skip button moves. Defaults to 10.
 * @attr {string} media-title - What the OS media panel calls this. Falls back to the media element's own `title`.
 * @attr {string} artist - Who made it, for the OS media panel.
 * @attr {string} album - What it came from, for the OS media panel.
 * @attr {string} artwork - Cover image for the OS media panel. Falls back to a `<video>`'s `poster`. Relative paths are resolved against the page.
 * @attr {string} storage-key - Prefix for the remembered volume, mute and captions state. Defaults to `media-player`; set it per player to keep two of them from sharing one volume.
 * @attr {string} keys - Key-to-method pairs for actions no visible control names, `keys="ArrowUp:volumeUp;ArrowDown:volumeDown"`. A control's own `key` outranks it for the same press, and a focused control keeps the keys it already answers.
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

// NOTE: the limit in the doc above is a deferral, not a permanent refusal, and the doc is
// consumer-facing so it carries no trigger. The multi-span buffered bar comes back when a
// scrubber has to draw the hole seeking leaves in a long stream, and it arrives as an
// element in book-of-elementals rather than a change here.
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
    'seekableStart',
    'seekableEnd',
    'behindLive',
    'buffered',
    'volumePercent',
    'playLabel',
    'muteLabel',
    'captionsLabel',
    'captionText',
    'timeFormatter'
  ];

  /**
   * The media element's wiring, attached by hydrargyri at upgrade rather than written in
   * every sample — plumbing with nothing in it for an author to choose, and one pair
   * forgotten in an `on=` was a player that half-worked with nothing saying why. A pair the
   * media element's own `on` attribute still carries is skipped, so markup predating this
   * keeps firing once.
   */
  static wires = {
    'audio, video':
      'loadedmetadata:onLoaded;durationchange:onLoaded;loadeddata:onLoaded;canplay:onLoaded;canplaythrough:onLoaded;play:onPlay;pause:onPause;waiting:onWaiting;playing:onPlaying;ended:onEnded;progress:onProgress;timeupdate:onTimeUpdate;volumechange:onVolumeChange',
    // The picture is the same button the overlay is, once the overlay has stepped out of the
    // way: clicking a playing video pauses it, and the overlay comes back over the frame it
    // stopped on. Video only — an `<audio>` with its controls off draws no box to click, so
    // the pair would be a listener on nothing.
    video: 'click:togglePlay'
  };

  static formatters = {
    time: (value) => formatTime(value),

    /**
     * Whole numbers for any bind that wants them.
     *
     * The samples stopped piping it when the scrubber moved to `step="any"` — a `step="1"`
     * range snaps what it is assigned to the **nearest** step while the clock label
     * truncates, and `|floor` was what kept the two on the same second. It stays public
     * because markup copied before the glide still pipes it.
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
    this.scrubStep = null;

    // The sliders whose inputs this element writes into from script, found by the classes
    // the stylesheet already targets — they are the markup contract. A player drawn without
    // one reads null here and the fill catch-ups skip.
    this.scrubber = this.querySelector('.media-player-scrubber');
    this.volumeSlider = this.querySelector('.media-player-volume');
    this.previewBox = this.querySelector('.media-player-preview');

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

    // A caption track can arrive after this runs: a streaming library adds an in-band track
    // with no `<track>` element behind it, and a script can append a `<track>` late —
    // `addtrack` is the platform saying when to look again. Both handlers are set up before
    // the reconnect return below, because `disconnected` takes them off on the way out.
    this.onTrackAdded = () => this.findCaptions();
    this.onTrackCue = (event) => this.onCue(event);
    this.media.textTracks?.addEventListener?.('addtrack', this.onTrackAdded);
    // A move in the DOM took both listeners off, and `findCaptions` will not run again for a
    // player that already has its track — so the cue listener is put back here or the cues
    // stop rendering after a move, silently.
    this.track?.addEventListener?.('cuechange', this.onTrackCue);

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

    this.findCaptions();

    this.thumbs = this.media.querySelector('track[kind=metadata]');
    // A disabled text track never fetches its file; hidden loads the cues and renders
    // nothing, which for a metadata track is the whole of what rendering could mean.
    if (this.thumbs?.track) this.thumbs.track.mode = 'hidden';

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
    this.media?.textTracks?.removeEventListener?.('addtrack', this.onTrackAdded);
    this.track?.removeEventListener?.('cuechange', this.onTrackCue);
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
    if (this.isLive) this.paintWindow();
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

  /**
   * A rejected promise is the browser's only report that a play was refused — a gesture it
   * did not count, a source it will not decode, a load that gave up. Unhandled, it is both a
   * silent failure and an unhandled-rejection warning naming no cause, which is the worst of
   * the two options this codebase allows. Optional call on the result: a test may stub `play`
   * with something that returns nothing.
   */
  play() {
    this.media?.play()?.catch((error) => {
      console.warn('media-player: the media refused to play —', error?.message || error);
    });
  }

  pause() {
    this.media?.pause();
  }

  togglePlay() {
    if (!this.media) return;
    if (this.media.paused) this.play();
    else this.pause();
  }

  /**
   * Pause and go home, where a file has one.
   *
   * A live stream does not, and a rewind window does not give it one: the oldest second
   * still reachable is whatever has not expired yet, which moves, and landing a listener
   * there is not returning to a beginning. So on a stream this only pauses, window or no
   * window — `goLive` is the other end, and it is the one worth a button.
   */
  stop() {
    if (!this.media) return;
    this.pause();
    if (!this.isLive) this.seekTo(0);
    this.interaction('stop');
  }

  skipForward() {
    if (!this.media || (this.isLive && !this.liveWindow)) return;
    this.seekBy(this.skipStep);
    this.interaction('skip-forward', this.skipStep);
  }

  skipBackward() {
    if (!this.media || (this.isLive && !this.liveWindow)) return;
    this.seekBy(-this.skipStep);
    this.interaction('skip-backward', this.skipStep);
  }

  /** Seconds a skip button moves — the `skip` attribute, or ten. */
  get skipStep() {
    const step = Number(this.skip);
    return Number.isFinite(step) && step > 0 ? step : 10;
  }

  seekBy(seconds) {
    if (!this.media || (this.isLive && !this.liveWindow)) return;
    this.seekTo(this.media.currentTime + seconds);
    this.hidePoster();
  }

  /**
   * Hide the poster, and catch the focus the overlay over it is about to take with it.
   *
   * The overlay is a real button, so pressing it to play leaves focus on it — and playing is
   * the moment `display: none` removes it, which drops focus to `<body>`. Every key bound to
   * this player then has nowhere to land: the next Space scrolls the page instead of pausing,
   * and nothing on screen says why. Moving focus here is not taking focus, it is declining to
   * lose it, which is the one case where moving it is the correct thing rather than the rude
   * one. The poster is the only thing this hides for good — the overlay follows `is-playing`,
   * so it is back over a video the moment one pauses.
   *
   * Only when the author made the player focusable. `focus()` on an element that cannot hold
   * focus is a silent no-op, and there is nothing this can write on the author's element to fix
   * that which would not also change where every click on the player lands.
   */
  hidePoster() {
    const focused = focusedElement();
    if (
      this.hasAttribute('tabindex') &&
      focused &&
      focused !== this &&
      focused.closest?.('.media-player-overlay,.media-player-poster')
    ) {
      this.focus();
    }
    this.posterHidden = true;
  }

  /**
   * The nearest second the browser will actually accept.
   *
   * `duration` says how long the file is; `seekable` says how much of it this browser can
   * reach, and the two part company whenever a server answers a `Range` request with the
   * whole file — a plain `python -m http.server` is the one every author meets. Writing
   * `currentTime` past `seekable` is refused, so painting the requested second would leave a
   * scrubber sitting where playback is not.
   *
   * An empty `seekable` is "not known yet" rather than "nowhere", so the request passes
   * through: metadata can arrive before the first range does, and clamping to zero there
   * would turn every early seek into a jump to the start. The ranges are walked rather than
   * bracketed by the first and last, because a seek leaves the browser holding disjoint ones
   * and the gap between two of them is not seekable however far inside the outer edges it is.
   */
  seekableSecond(seconds) {
    const ranges = this.media.seekable;
    if (!ranges || !ranges.length) return seconds;
    let nearest = seconds;
    let shortest = Infinity;
    for (let i = 0; i < ranges.length; i++) {
      const start = ranges.start(i);
      const end = ranges.end(i);
      if (seconds >= start && seconds <= end) return seconds;
      const edge = seconds < start ? start : end;
      const gap = Math.abs(seconds - edge);
      if (gap < shortest) {
        shortest = gap;
        nearest = edge;
      }
    }
    return nearest;
  }

  /**
   * How much of an endless stream is still reachable, in seconds.
   *
   * A stream with a rewind window has one `seekable` range that slides forward as segments
   * expire; one without has a range too narrow to be worth calling a window, or none at all
   * before the first segment lands. Zero is what says seeking is off, so it is read live
   * rather than stored — the window is a different length every time it is asked for.
   */
  get liveWindow() {
    const ranges = this.media?.seekable;
    if (!ranges || !ranges.length) return 0;
    return Math.max(ranges.end(ranges.length - 1) - ranges.start(0), 0);
  }

  /**
   * The reachable window, for a scrubber the author scaled to it.
   *
   * Three numbers rather than a window-relative position, because a window-relative scale
   * would put both ends of the scrubber in motion and make `duration` mean one thing on a
   * file and another on a stream. The markup binds `seekableStart` and `seekableEnd` to its
   * own `min` and `max` and keeps `currentTime` on the same absolute scale everything else
   * here already speaks.
   */
  paintWindow() {
    const ranges = this.media?.seekable;
    if (!ranges || !ranges.length) return;
    this.seekableStart = ranges.start(0);
    this.seekableEnd = ranges.end(ranges.length - 1);
    this.behindLive = Math.max(this.seekableEnd - this.media.currentTime, 0);
  }

  /** The live edge, for a button that says so. Nothing to go back to without a window. */
  goLive() {
    if (!this.media || !this.isLive || !this.liveWindow) return;
    this.paintWindow();
    this.seekTo(this.seekableEnd);
    this.interaction('go-live');
  }

  seekTo(seconds) {
    if (!this.media) return;
    // On a stream `seekable` is the whole of what exists — no window means the write would
    // be refused and the thumb would sit where playback is not. A file keeps the benefit of
    // the doubt an empty `seekable` earns it: metadata can arrive before the first range.
    if (this.isLive && !this.liveWindow) return;
    const bounded = this.seekableSecond(Math.min(Math.max(seconds, 0), this.media.duration || 0));
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
    this.remaining = this.isLive ? 0 : Math.max((this.media?.duration || 0) - seconds, 0);
    // The write above lands in the scrubber's range input, and a value written from script
    // fires no event — slider-elemental cannot see it, and its fill would stay wherever the
    // last real drag left it. apply() is that element's public catch-up for exactly this.
    this.scrubber?.apply?.();
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
    // Before `isPlaying`, which is the attribute the stylesheet takes the overlay out on:
    // the focus this catches is focus sitting on that overlay, and by the time the button is
    // `display: none` it has already fallen to `<body>`.
    this.hidePoster();
    this.isPlaying = true;
    this.isBuffering = false;
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

  /**
   * The live clock and the window under it.
   *
   * `timeupdate` is what a file deliberately does not use — about four a second is visibly
   * steppy under a thumb moving across a two-minute scale. Across a rewind window it is not:
   * the window slides in whole segments, several seconds at a time, so sixty frames a second
   * would repaint the same two numbers fifty-six times for nothing. A file still gets the
   * animation frame; this only runs for a stream.
   */
  onTimeUpdate() {
    if (!this.media || !this.isLive) return;
    this.paintWindow();
    this.paint(this.media.currentTime);
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
   * Seconds rather than a percentage so it shares a scale with `duration`, which is what
   * the `<progress>` behind the scrubber has for a `max` — one bind each and no arithmetic
   * in the markup.
   *
   * The range the playhead sits in, not the first or the furthest: after a seek the browser
   * holds disjoint ranges, and either end would lie — the first stops behind the playhead,
   * the last draws a bar over a gap playback has not crossed. When the playhead is between
   * ranges the bar keeps its last value rather than guessing.
   */
  onProgress() {
    if (this.isLive) this.paintWindow();
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
   * A hand landed on the scrubber: snap its step to whole seconds before the press moves it.
   *
   * At rest the input carries `step="any"`, so the clock's fractional writes land unsnapped
   * and the thumb glides between seconds. Granularity for a person is a different choice —
   * a drag that lands on 3.6 and an arrow that nudges by whatever the browser fancies for
   * `any` are both worse than the whole second — so the step flips to `1` here and
   * `endDrag` puts the resting value back. `pointerdown` and `keydown` both run before the
   * browser moves the value, which is what lets the flip land in time.
   *
   * Keydown is filtered to the keys a range spends on itself: a Tab passing through would
   * flip the step and carry its `keyup` to the next control, and with no `endScrub` ever
   * firing the clock would be back to snapping until the next real drag.
   *
   * The resting step is read off the input rather than assumed, so markup still carrying
   * `step="1"` from before the glide keeps exactly the behaviour it wrote.
   */
  beginScrub(event) {
    if (event.type === 'keydown' && !ARROW_KEYS.has((event.key || '').toLowerCase())) return;
    if (!this.scrubStep) this.scrubStep = event.target.step || 'any';
    event.target.step = '1';
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
    if (!this.media || (this.isLive && !this.liveWindow)) return;
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
    // The hand is off: the input gets its resting step back — recorded by `beginScrub` —
    // before the clock restarts, so the very next fractional write already lands unsnapped.
    if (this.scrubStep) {
      const input = this.scrubber?.querySelector('input[type=range]');
      if (input) input.step = this.scrubStep;
      this.scrubStep = null;
    }
    const seconds = this.pendingSeek;
    if (seconds === null || seconds === undefined) {
      this.resume();
      return;
    }
    this.pendingSeek = null;
    this.seekTo(seconds);
    this.hidePoster();
    this.interaction('seek', this.currentTime);
    this.resume();
  }

  /**
   * A key pressed inside the player presses the control that claims it.
   *
   * The map is the markup: `key="k"` goes on the button the author already wrote, and this
   * finds that button and clicks it. So a key can never name an action that no visible
   * control names, there is no second list to keep in step with the first, and a `disabled`
   * button ignores its key and leaves the press with the page — the platform would decline
   * the click anyway, but declining before `preventDefault` is what keeps a claimed Space
   * scrolling while nothing is ready to answer it.
   * The whole thing is opt-in twice over: no `on=` naming this means no listener at all,
   * and no `key` on anything means nothing to find. Nothing here knows which of the two
   * scopes it was bound in: `keydown@document:onKeyDown` hands it presses from anywhere on
   * the page and the lookup is the same one, which is why a page-wide binding still cannot
   * reach an action no control on this player names.
   *
   * Letters mostly, and the arrows where nothing spends them. `toolbar-elemental` walks the
   * control row with the arrows and Home/End and calls `preventDefault` as it goes, and
   * every `<input type="range">` answers them too — so an arrow in a `key` yields to both
   * and answers from the player itself, the overlay or a plain button: ArrowRight on a
   * focused player skips, and on a focused scrubber still nudges by one step. Space and Enter go
   * the same way whenever a button, a checkbox, a link or a `summary` holds focus: the press
   * is spent there already, activating the control or — Space over a link — scrolling the
   * page. Modified presses are left alone because they belong to the browser, and an
   * already-handled one because whatever handled it got there first.
   */
  onKeyDown(event) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTyping(event.target) || isTyping(focusedElement())) return;

    const pressed = event.key.toLowerCase();
    if (ACTIVATION_KEYS.has(pressed) && (isActivated(event.target) || isActivated(focusedElement()))) return;
    if (ARROW_KEYS.has(pressed) && (isArrowed(event.target) || isArrowed(focusedElement()))) return;

    const control = Array.from(this.querySelectorAll('[key]')).find(
      (node) => node.getAttribute('key').toLowerCase() === pressed
    );
    // A disabled control still claims its key — it outranks a `keys` entry for the same
    // press even while it cannot act — but the press is left with the page rather than
    // spent on nothing. `:disabled` is the platform's own answer where a `.disabled` read
    // is not: inside a `<fieldset disabled>` the property stays false while `click()`
    // declines the control. `[disabled]` beside it covers what the readiness gate strips
    // the attribute from — a keyed link or custom element has no `:disabled` state, and
    // the author marked it unpressable all the same.
    if (control?.matches(':disabled, [disabled]')) return;
    // The `keys` attribute is the fallback, never the override: a visible control claiming
    // the key wins, so `key` and `keys` naming one press stay one action.
    const method = control ? null : keyedMethod(this.getAttribute('keys'), pressed);
    if (method && typeof this[method] !== 'function') {
      // A typo'd name would otherwise be a key that silently never worked — and the press
      // stays the page's, since nothing here acted on it.
      console.warn(`media-player: keys names no method "${method}"`);
      return;
    }
    if (!control && !method) return;

    event.preventDefault();
    if (control) control.click();
    else this[method]();
    // A key is use, and use is what keeps a video's row up. Without this the controls fade
    // out from under someone driving by keyboard, which reads as a player that stopped
    // listening — while every key still works.
    if (this.isVideo) this.showControls();
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
    // A value written into a range input from script fires no event, so the volume slider's
    // fill is caught up by hand — a mute from the button or the OS would otherwise leave it
    // sitting full over a silent player.
    this.volumeSlider?.apply?.();
  }

  onVolumeChange() {
    this.syncVolume();
  }

  // CAPTIONS

  onCue(event) {
    // Every `<track>` rides this wire — the thumbnails track with image URLs for cues, a
    // chapters walk, an audio description — and only what the captions button governs may
    // paint into the caption box: a declined track's cues rendering here would be captions
    // with no control to turn them off.
    const track = event.target.track || event.target;
    if (!isCaptionKind(track.kind)) return;
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

  /**
   * The caption track, from the markup or from the list, whichever has one.
   *
   * `default` is the author's pick and the platform's own rule; without one the first in
   * document order is what a browser would have shown, so it is what is taken. The first
   * track found wins and keeps winning — switching language needs a control to switch it
   * with, and there is no such control to name.
   *
   * `track` holds the `TextTrack`, not the `<track>`: an in-band track from a streaming
   * library has no element at all.
   */
  findCaptions() {
    if (this.track || !this.media) return;
    // The `i` flag is the platform's own case rule: `kind` is an enumerated attribute a
    // browser matches case-insensitively, and without the flag a valid `kind="Captions"`
    // track would lose its button and its `default` standing here.
    const tracks = Array.from(this.media.querySelectorAll('track[kind=captions i], track[kind=subtitles i], track:not([kind])'));
    const element = tracks.find((one) => one.hasAttribute('default')) || tracks[0];
    const listed = Array.from(this.media.textTracks || []).find((one) => isCaptionKind(one.kind));

    const found = element?.track || listed;
    if (!found) return;

    this.track = found;
    this.hasCaptions = true;
    // Listened to directly on the `TextTrack`, whatever stands behind it: hydrargyri scans
    // `static wires` once at upgrade, so a wire on the `<track>` element would miss any
    // track arriving after — and a wire on every element would hand `onCue` tracks the
    // button never adopted.
    found.addEventListener?.('cuechange', this.onTrackCue);
    this.setCaptions(this.read('captions') === true, false);
  }

  toggleCaptions() {
    this.setCaptions(!this.captionsVisible);
    this.interaction(this.captionsVisible ? 'captions-on' : 'captions-off');
  }

  setCaptions(visible, remember = true) {
    if (!this.track) return;
    this.captionsVisible = visible;
    this.captionsLabel = visible ? 'Disable captions' : 'Enable captions';
    this.track.mode = visible ? 'hidden' : 'disabled';
    if (!visible) this.captionText = null;
    if (remember) this.store('captions', visible);
  }

  // FRAME PREVIEWS

  /**
   * The frame for the second under the pointer, out of markup the author already wrote: a
   * `<track kind="metadata">` naming a WebVTT of `sprite.jpg#xywh=…` cues — the format
   * Plyr and Vidstack read, which `script/thumbs` in this repository generates — and a
   * `.media-player-preview` box inside the scrubber for the frame to land in. The browser
   * parses the VTT itself; no track, no box, or a live stream all mean no preview.
   *
   * The tile is shown at the size it was cut, never scaled: scaling needs the sprite
   * sheet's natural size, which is unknown until the image loads, and a box that resizes
   * itself on load is a bubble jumping under a still pointer. Cut the frames at display
   * size.
   */
  preview(event) {
    const box = this.previewBox;
    if (!box || !this.scrubber || !this.media || this.isLive) return;
    const duration = this.media.duration;
    if (!duration || !Number.isFinite(duration)) return;

    const rect = this.scrubber.getBoundingClientRect();
    if (!rect.width) return;
    const along = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const cue = this.thumbCue((along / rect.width) * duration);
    const frame = cue ? parseThumb(cue.text, this.thumbs.src) : null;
    // Hidden rather than left holding the last frame: cues still loading and a gap in the
    // file both mean there is nothing true to show for this second.
    if (!frame) {
      this.endPreview();
      return;
    }

    box.style.backgroundImage = `url("${frame.src}")`;
    if (frame.w) {
      box.style.width = `${frame.w}px`;
      box.style.height = `${frame.h}px`;
      box.style.backgroundSize = '';
      box.style.backgroundPosition = `-${frame.x}px -${frame.y}px`;
    } else {
      // A cue naming a whole image rather than a window on a sprite: the box keeps the
      // size the stylesheet gave it, and the image fills it.
      box.style.backgroundSize = 'cover';
      box.style.backgroundPosition = 'center';
    }
    box.hidden = false;

    // Clamped so the box stays inside the player at both ends. Read after the size write,
    // because the width that matters is the one just set.
    const half = box.offsetWidth / 2;
    box.style.left = `${Math.min(Math.max(along, half), rect.width - half)}px`;
  }

  endPreview() {
    if (this.previewBox) this.previewBox.hidden = true;
  }

  /**
   * The cue covering a second, walked rather than asked for: `activeCues` answers only at
   * the playhead, and the pointer is nowhere near it. Cues arrive time-ordered, so the
   * walk stops at the first one starting past the mark.
   */
  thumbCue(seconds) {
    const cues = this.thumbs?.track?.cues;
    if (!cues) return null;
    for (let i = 0; i < cues.length; i++) {
      if (cues[i].startTime > seconds) break;
      if (seconds <= cues[i].endTime) return cues[i];
    }
    return null;
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
   * Volume and mute from last time. Captions are restored by `findCaptions` instead, which
   * is the only thing that knows when there is a track to restore them onto.
   *
   * The mute stands on its own: muting a volume nobody ever dragged stores `muted` and no
   * level at all — `rememberVolume` never writes a zero — so a restore that waited for a
   * stored level would lose exactly that mute.
   *
   * Nothing is written back while restoring: `applyVolume` would otherwise store the value
   * it just read, and a player that never got a real volume set on it would keep rewriting
   * the same entry on every page load.
   */
  restore() {
    const volume = this.read('volume');
    const muted = this.read('muted');
    if (muted === true) this.applyVolume(0, false);
    else if (typeof volume === 'number') this.applyVolume(volume, false);
    if (typeof volume === 'number' && volume > 0) this.lastVolume = volume;
    this.syncVolume();
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
