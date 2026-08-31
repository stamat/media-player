/**
 * What the player guarantees, and what is left to a browser.
 *
 * Covered here: the progressive-enhancement contract (native controls off on upgrade, back
 * on the way out), the third kind of media element — a custom element speaking the media API,
 * marked `media-player-media`, including one that upgrades after the player did — the wiring the element declares itself (`static wires`, so the media
 * element needs no `on=`, and a click on the picture toggles playback), readiness from any of
 * the five metadata events, live streams and the rewind window that decides how much of one
 * can be reached, the volume
 * arithmetic and its persistence, captions toggling and its persistence around a stubbed
 * track — the one the author marked `default`, and the one a streaming library adds after
 * the upgrade with no `<track>` behind it — the video controls' hide timer, the labels the buttons announce themselves by, the
 * keys a control claims and the presses that are somebody else's, the remote-playback route
 * against a stubbed `RemotePlayback` — the picker itself is the platform's and opens nowhere
 * here, so what is proved is the wiring around it: nothing offered until availability says
 * there is a device, an `<audio>` offered it too, `disableRemotePlayback` and a browser that
 * cannot watch continuously answered oppositely, `is-airplay` following the route rather than
 * the press, a dismissed picker staying quiet, and the watch cancelled on the way out even
 * when its id lands after the player has gone — the OS media panel against
 * a stubbed `navigator.mediaSession`, the slider fills caught up through slider-elemental's
 * own `apply()` after scripted writes, the scrubber frame previews against stubbed
 * thumbnail cues — jsdom fetches and parses no VTT, so the browser's cue loading itself is
 * not provable here — and that the surface the custom elements manifest publishes still
 * exists on the element.
 *
 * Deliberately not covered: which of the poster and the overlay is on screen, which is
 * `display: none` off `poster-hidden` and `is-playing` in a stylesheet jsdom never applies —
 * what is asserted here is the attributes those rules read. Nor fullscreen, which jsdom
 * does not implement, nor the firing of `cuechange` itself — the handler is exercised by
 * calling it with a stubbed event, but a `<track>` in jsdom never fires one, so the
 * platform's dispatch stays a browser's to prove. The animation-frame clock is not covered
 * either: what it guarantees is smoothness, and a test of `requestAnimationFrame` under
 * fake timers proves the timer works rather than that the thumb moves. Nor the clamp that
 * keeps the slider's value bubble inside the track at either end: it is a `clamp()` in the
 * structure sheet weighing the bubble's own rendered width against the track's length, and
 * jsdom resolves neither. All four want a browser.
 */

import { jest } from '@jest/globals';
import { MediaPlayer, formatTime, clampVolume, volumeState, keyedMethod, parseThumb, LIVE_DURATION, CONTROLS_LINGER, VOLUME_SETTLE } from '../src/scripts/media-player.js';

/**
 * A media element jsdom will tolerate.
 *
 * jsdom implements no playback at all — `play()` throws "not implemented" and `duration` is
 * a read-only `NaN` — so the parts the player reads are defined on the instance and the two
 * methods it calls are counted.
 */
function fakeMedia(tag = 'audio', { duration = 120, paused = true } = {}) {
  const media = document.createElement(tag);
  media.controls = true;
  let currentTime = 0;
  let volume = 1;
  let muted = false;
  let playbackRate = 1;
  Object.defineProperties(media, {
    duration: { get: () => duration, configurable: true },
    readyState: { get: () => 1, configurable: true },
    paused: { get: () => paused, configurable: true },
    currentTime: { get: () => currentTime, set: (v) => { currentTime = v; }, configurable: true },
    volume: { get: () => volume, set: (v) => { volume = v; }, configurable: true },
    muted: { get: () => muted, set: (v) => { muted = v; }, configurable: true },
    playbackRate: { get: () => playbackRate, set: (v) => { playbackRate = v; }, configurable: true },
    buffered: { get: () => ({ length: 0 }), configurable: true }
  });
  media.play = () => { paused = false; };
  media.pause = () => { paused = true; };
  return media;
}

/**
 * A pointer that cannot hover, for the length of one call.
 *
 * jsdom implements no `matchMedia` at all, which is why the element asks for it optionally and
 * why the rest of this file exercises the hovering half without stubbing anything.
 */
function withoutHover(run) {
  const had = Object.getOwnPropertyDescriptor(window, 'matchMedia');
  window.matchMedia = (query) => ({ matches: query === '(hover: none)' });
  try {
    run();
  } finally {
    if (had) Object.defineProperty(window, 'matchMedia', had);
    else delete window.matchMedia;
  }
}

function mount(media) {
  const player = document.createElement('media-player');
  if (media) player.appendChild(media);
  document.body.appendChild(player);
  return player;
}

beforeEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
});

describe('the progressive-enhancement contract', () => {
  test('the native controls the author wrote are taken off once the element can drive the media itself', () => {
    const media = fakeMedia();
    mount(media);
    expect(media.controls).toBe(false);
  });

  test('an element removed from the page leaves a media element someone can still play', () => {
    const media = fakeMedia();
    const player = mount(media);
    player.remove();
    expect(media.controls).toBe(true);
  });

  test('a media element that never had controls does not gain them on the way out', () => {
    const media = fakeMedia();
    media.controls = false;
    const player = mount(media);
    player.remove();
    expect(media.controls).toBe(false);
  });

  test('an empty player says what is missing and leaves the page standing', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => mount(null)).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no <audio> or <video>'));
    warn.mockRestore();
  });

  test('a player moved elsewhere in the page keeps its duration and takes the native controls back off', () => {
    const media = fakeMedia();
    const player = mount(media);
    expect(player.duration).toBe(120);

    const aside = document.createElement('aside');
    document.body.appendChild(aside);
    aside.appendChild(player); // one move: disconnected puts the controls back, connected runs again

    expect(player.duration).toBe(120);
    expect(player.isReady).toBe(true);
    expect(media.controls).toBe(false);
  });
});

/**
 * A custom element speaking the media API — what `<youtube-video>` or `<vimeo-video>` from
 * media-elements is. jsdom has no such element, so this is `fakeMedia` as a class: the
 * accessors sit on the prototype the way theirs do, and `controls` reflects the attribute
 * the way theirs does. One tag per definition — a registry entry cannot be replaced.
 */
function defineFakeElement(tag, { duration = 120 } = {}) {
  customElements.define(
    tag,
    class extends HTMLElement {
      constructor() {
        super();
        this.state = { currentTime: 0, volume: 1, muted: false, paused: true };
      }
      get controls() {
        return this.hasAttribute('controls');
      }
      set controls(value) {
        this.toggleAttribute('controls', Boolean(value));
      }
      get duration() {
        return duration;
      }
      get readyState() {
        return 1;
      }
      get paused() {
        return this.state.paused;
      }
      get currentTime() {
        return this.state.currentTime;
      }
      set currentTime(value) {
        this.state.currentTime = value;
      }
      get volume() {
        return this.state.volume;
      }
      set volume(value) {
        this.state.volume = value;
      }
      get muted() {
        return this.state.muted;
      }
      set muted(value) {
        this.state.muted = value;
      }
      get buffered() {
        return { length: 0 };
      }
      play() {
        this.state.paused = false;
      }
      pause() {
        this.state.paused = true;
      }
    }
  );
}

function fakeElement(tag) {
  const media = document.createElement(tag);
  media.setAttribute('controls', '');
  media.className = 'media-player-media';
  return media;
}

describe('a custom element that speaks the media API', () => {
  test('marked media-player-media, it is driven the way a <video> is: controls off, metadata read, events wired, controls back on the way out', () => {
    defineFakeElement('fake-video');
    const media = fakeElement('fake-video');
    const player = mount(media);
    expect(media.hasAttribute('controls')).toBe(false);
    expect(player.hasAttribute('is-video')).toBe(true);
    expect(player.duration).toBe(120);
    media.dispatchEvent(new Event('play'));
    expect(player.hasAttribute('is-playing')).toBe(true);
    player.remove();
    expect(media.hasAttribute('controls')).toBe(true);
  });

  test('a click on the picture of a custom media element toggles it — its iframe would keep the click, so the box answers — while a control inside, and an audio player, do not', () => {
    defineFakeElement('clicked-video');
    const media = fakeElement('clicked-video');
    const player = mount(media);
    const control = document.createElement('button');
    player.appendChild(control);
    player.dispatchEvent(new Event('click', { bubbles: true }));
    expect(media.paused).toBe(false);
    control.click();
    expect(media.paused).toBe(false);

    defineFakeElement('clicked-audio');
    const sound = fakeElement('clicked-audio');
    const audioPlayer = mount(sound);
    audioPlayer.dispatchEvent(new Event('click', { bubbles: true }));
    expect(sound.paused).toBe(true);
  });

  test('one whose name ends in -audio is the audio half', () => {
    defineFakeElement('fake-audio');
    const player = mount(fakeElement('fake-audio'));
    expect(player.isReady).toBe(true);
    expect(player.hasAttribute('is-video')).toBe(false);
  });

  test('without the class it is not the media, and the player says so', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const media = document.createElement('fake-video');
    media.setAttribute('controls', '');
    mount(media);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no <audio> or <video>'));
    expect(media.hasAttribute('controls')).toBe(true);
    warn.mockRestore();
  });

  test('one that upgrades after the player did is left untouched until then, and driven once it has', async () => {
    const media = fakeElement('late-video');
    const player = mount(media);
    // Untouched means no own `controls` property either: written before the upgrade, one
    // would shadow the accessor the upgrade brings, and the platform's own chrome would load.
    expect(media.hasAttribute('controls')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(media, 'controls')).toBe(false);
    expect(player.isReady).toBeFalsy();

    defineFakeElement('late-video');
    await customElements.whenDefined('late-video');
    await Promise.resolve();

    expect(media.hasAttribute('controls')).toBe(false);
    expect(player.isReady).toBe(true);
    expect(player.duration).toBe(120);
  });

  test('one that emits play a beat before its own paused flips still gets a clock, because playing starts it too', () => {
    defineFakeElement('early-play-video');
    const media = fakeElement('early-play-video');
    const player = mount(media);

    media.state.currentTime = 42;
    media.dispatchEvent(new Event('play'));
    expect(player.currentTime).toBe(0);

    media.state.paused = false;
    media.dispatchEvent(new Event('playing'));
    expect(player.currentTime).toBe(42);
  });

  test('a player removed while still waiting on the upgrade leaves the element alone when it comes', async () => {
    const media = fakeElement('gone-video');
    const player = mount(media);
    player.remove();

    defineFakeElement('gone-video');
    await customElements.whenDefined('gone-video');
    await Promise.resolve();

    expect(media.hasAttribute('controls')).toBe(true);
    expect(player.isReady).toBeFalsy();
  });
});

describe('the wiring the element carries itself', () => {
  test('the media element needs no on attribute — play, pause and volume reach the player anyway', () => {
    const media = fakeMedia();
    const player = mount(media);
    media.dispatchEvent(new Event('play'));
    expect(player.hasAttribute('is-playing')).toBe(true);
    media.dispatchEvent(new Event('pause'));
    expect(player.hasAttribute('is-playing')).toBe(false);
    media.volume = 0.4;
    media.dispatchEvent(new Event('volumechange'));
    expect(player.volumePercent).toBe(40);
  });

  test('a pair the markup still carries from before the wires fires once, not twice', () => {
    const media = fakeMedia();
    media.setAttribute('on', 'play:onPlay');
    const player = mount(media);
    const seen = [];
    player.addEventListener('media-player-interaction', (e) => seen.push(e.detail.type));
    media.dispatchEvent(new Event('play'));
    expect(seen).toEqual(['play']);
  });

  test('a click on the picture toggles playback, both ways', () => {
    const media = fakeMedia('video');
    mount(media);
    media.dispatchEvent(new Event('click'));
    expect(media.paused).toBe(false);
    media.dispatchEvent(new Event('click'));
    expect(media.paused).toBe(true);
  });

  test('a tap on the picture will not pause it, because that same tap is what brings the controls back', () => {
    // Where nothing hovers there is no `mousemove` to reveal the row, so the touch does it —
    // and a touch that also pauses makes the row reachable only by stopping the video, which
    // is the whole defect. The first tap reveals; what pauses is the button it reveals.
    const media = fakeMedia('video');
    mount(media);
    media.dispatchEvent(new Event('click'));
    expect(media.paused).toBe(false);
    withoutHover(() => media.dispatchEvent(new Event('click')));
    expect(media.paused).toBe(false);
  });

  test('a tap on the picture still starts a stopped video, which is the half with nowhere else to go', () => {
    // Stopped, the overlay is over the picture and its button is the one being pressed — but
    // the picture answers the same way, because a guard that refused both directions would be
    // a player a tap cannot start.
    const media = fakeMedia('video');
    mount(media);
    withoutHover(() => media.dispatchEvent(new Event('click')));
    expect(media.paused).toBe(false);
  });

  test('a click on an audio element is a click on the page, not on a control', () => {
    // An `<audio>` with its controls off draws no box, so anything reaching it came from the
    // page around it — starting playback from that is a player pressed by something the
    // reader cannot see.
    const media = fakeMedia();
    mount(media);
    media.dispatchEvent(new Event('click'));
    expect(media.paused).toBe(true);
  });
});

describe('readiness', () => {
  test('metadata already in hand before the upgrade readies the player without waiting for an event', () => {
    const player = mount(fakeMedia());
    expect(player.isReady).toBe(true);
    expect(player.duration).toBe(120);
  });

  test('five events mean the same thing, and the player is ready exactly once', () => {
    const player = mount(fakeMedia());
    let readies = 0;
    player.addEventListener('media-player-ready', () => { readies += 1; });
    for (const event of ['durationchange', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough']) {
      player.onLoaded(new Event(event));
    }
    expect(readies).toBe(0); // already ready before the listener was added; none of the five re-fires it
    expect(player.isReady).toBe(true);
  });

  test('controls disabled until there was something to press are enabled when there is', () => {
    const media = fakeMedia();
    const player = document.createElement('media-player');
    const button = document.createElement('button');
    button.setAttribute('disabled', '');
    player.append(media, button);
    document.body.appendChild(player);
    expect(button.hasAttribute('disabled')).toBe(false);
  });

  test('a file whose metadata has not arrived leaves every control it was given still disabled', () => {
    const media = fakeMedia('video', { duration: NaN });
    const player = document.createElement('media-player');
    const button = document.createElement('button');
    button.setAttribute('disabled', '');
    player.append(media, button);
    document.body.appendChild(player);
    expect(player.hasAttribute('is-ready')).toBe(false);
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  test('a play the browser refuses is said out loud rather than swallowed', async () => {
    const media = fakeMedia();
    media.play = () => Promise.reject(new Error('gesture required'));
    const player = mount(media);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    player.play();
    await Promise.resolve();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('refused to play'), 'gesture required');
    warn.mockRestore();
  });
});

describe('seeking only where the browser can go', () => {
  function seekableMedia(ranges) {
    const media = fakeMedia('video', { duration: 600 });
    Object.defineProperty(media, 'seekable', {
      get: () => ({
        length: ranges.length,
        start: (i) => ranges[i][0],
        end: (i) => ranges[i][1]
      }),
      configurable: true
    });
    return media;
  }

  test('a server that answers a range request with the whole file cannot be seeked past what it sent', () => {
    const media = seekableMedia([[0, 90]]);
    const player = mount(media);
    player.seekTo(500);
    expect(media.currentTime).toBe(90);
  });

  test('the clock is drawn where playback landed, not where the seek aimed', () => {
    const media = seekableMedia([[0, 90]]);
    const player = mount(media);
    player.seekTo(500);
    expect(player.currentTime).toBe(90);
  });

  test('a seek into the gap between two disjoint ranges lands on the nearer edge of one of them', () => {
    const media = seekableMedia([[0, 100], [400, 600]]);
    const player = mount(media);
    player.seekTo(360);
    expect(media.currentTime).toBe(400);
  });

  test('a range the browser can serve is seeked to exactly, untouched', () => {
    const media = seekableMedia([[0, 600]]);
    const player = mount(media);
    player.seekTo(275);
    expect(media.currentTime).toBe(275);
  });

  test('a browser that has not said what it can reach yet is taken at its word', () => {
    const media = seekableMedia([]);
    const player = mount(media);
    player.seekTo(275);
    expect(media.currentTime).toBe(275);
  });
});

describe('live streams', () => {
  test('a duration only an endless stream reports leaves no duration to seek within', () => {
    const player = mount(fakeMedia('audio', { duration: LIVE_DURATION }));
    expect(player.isLive).toBe(true);
    expect(player.duration).toBe(0);
  });

  test('seeking a live stream moves nothing, because there is nowhere to move to', () => {
    const media = fakeMedia('audio', { duration: LIVE_DURATION });
    const player = mount(media);
    player.seekTo(30);
    expect(media.currentTime).toBe(0);
  });

  test('skipping a live stream neither moves nor claims to', () => {
    const media = fakeMedia('audio', { duration: LIVE_DURATION });
    const player = mount(media);
    const seen = [];
    player.addEventListener('media-player-interaction', (e) => seen.push(e.detail.type));
    player.skipForward();
    expect(media.currentTime).toBe(0);
    expect(seen).toEqual([]);
  });

  /**
   * A stream with a rewind window: one `seekable` range, the way a DVR manifest reports one.
   */
  function windowedMedia(range, at = 0) {
    const media = fakeMedia('video', { duration: LIVE_DURATION });
    Object.defineProperty(media, 'seekable', {
      get: () => ({ length: 1, start: () => range[0], end: () => range[1] }),
      configurable: true
    });
    media.currentTime = at;
    return media;
  }

  test('a rewind window is what makes a live stream seekable, and its edges are what bound the seek', () => {
    const media = windowedMedia([100, 400]);
    const player = mount(media);
    player.seekTo(250);
    expect(media.currentTime).toBe(250);
    player.seekTo(9999);
    expect(media.currentTime).toBe(400);
    player.seekTo(0);
    expect(media.currentTime).toBe(100);
  });

  test('skipping inside the window moves, and says so, where skipping without one did neither', () => {
    const media = windowedMedia([100, 400], 200);
    const player = mount(media);
    const seen = [];
    player.addEventListener('media-player-interaction', (e) => seen.push(e.detail.type));
    player.skipBackward();
    expect(media.currentTime).toBe(190);
    expect(seen).toEqual(['skip-backward']);
  });

  test('the live edge is one press away, and the press is an interaction like any other', () => {
    const media = windowedMedia([100, 400], 150);
    const player = mount(media);
    const seen = [];
    player.addEventListener('media-player-interaction', (e) => seen.push(e.detail.type));
    player.goLive();
    expect(media.currentTime).toBe(400);
    expect(seen).toEqual(['go-live']);
  });

  test('a live stream with no window has no live edge to go back to, and goLive says nothing', () => {
    const media = fakeMedia('audio', { duration: LIVE_DURATION });
    const player = mount(media);
    const seen = [];
    player.addEventListener('media-player-interaction', (e) => seen.push(e.detail.type));
    player.goLive();
    expect(media.currentTime).toBe(0);
    expect(seen).toEqual([]);
  });

  test('the window and how far behind it playback sits are absolute seconds, ready to bind', () => {
    const media = windowedMedia([100, 400], 340);
    const player = mount(media);
    media.dispatchEvent(new Event('timeupdate'));
    expect(player.seekableStart).toBe(100);
    expect(player.seekableEnd).toBe(400);
    expect(player.behindLive).toBe(60);
    expect(player.currentTime).toBe(340);
    // `remaining` counts a file down to its end; a stream has no end to count down to.
    expect(player.remaining).toBe(0);
  });

  test('a window does not give a live stream a start, so stop still only pauses', () => {
    const media = windowedMedia([100, 400], 250);
    media.play();
    const player = mount(media);
    player.stop();
    expect(media.paused).toBe(true);
    expect(media.currentTime).toBe(250);
  });

  test('a live stream schedules no animation frames, because there is no clock to paint', () => {
    const media = fakeMedia('audio', { duration: LIVE_DURATION, paused: false });
    const player = mount(media);
    const before = player.frame;
    player.resume();
    expect(player.frame).toBe(before);
  });
});

/**
 * A stand-in for `navigator.mediaSession`, which jsdom does not implement.
 *
 * Handlers are stored rather than run, so a test can invoke the one the operating system
 * would have, and every `setPositionState` call is kept because the spec throws a TypeError
 * on a duration or a rate the element is supposed to have filtered out first.
 */
function stubSession() {
  const session = {
    metadata: null,
    handlers: {},
    positions: [],
    setActionHandler(action, handler) { session.handlers[action] = handler; },
    setPositionState(state) { session.positions.push(state); }
  };
  Object.defineProperty(navigator, 'mediaSession', { value: session, configurable: true });
  globalThis.MediaMetadata = class { constructor(init) { Object.assign(this, init); } };
  return session;
}

describe('the OS media panel', () => {
  let session;

  beforeEach(() => {
    session = stubSession();
  });

  afterEach(() => {
    // Players go before the stub does: removing one releases the panel, and a release that
    // reached for an API already deleted would fail the teardown rather than the test.
    document.body.innerHTML = '';
    delete navigator.mediaSession;
    delete globalThis.MediaMetadata;
  });

  test('the panel is claimed when playback starts, not when the element upgrades', () => {
    const player = mount(fakeMedia());
    expect(session.handlers.seekforward).toBeUndefined();
    player.onPlay();
    expect(typeof session.handlers.seekforward).toBe('function');
  });

  test('play and pause are left to the browser, which draws and answers them either way', () => {
    mount(fakeMedia()).onPlay();
    expect(session.handlers.play).toBeUndefined();
    expect(session.handlers.pause).toBeUndefined();
  });

  test('a skip from the lock screen moves by the same seconds a skip button on the page does', () => {
    const media = fakeMedia();
    const player = mount(media);
    player.setAttribute('skip', '30');
    player.onPlay();
    session.handlers.seekforward({});
    expect(media.currentTime).toBe(30);
  });

  test('an offset the operating system names wins over the player\'s own', () => {
    const media = fakeMedia();
    const player = mount(media);
    player.onPlay();
    session.handlers.seekforward({ seekOffset: 5 });
    expect(media.currentTime).toBe(5);
  });

  test('scrubbing the panel goes to the absolute time it names, not a distance from here', () => {
    const media = fakeMedia();
    const player = mount(media);
    player.onPlay();
    session.handlers.seekto({ seekTime: 42 });
    expect(media.currentTime).toBe(42);
  });

  test('a live stream is given no seek buttons, because there is nowhere on it to seek to', () => {
    mount(fakeMedia('audio', { duration: LIVE_DURATION })).onPlay();
    expect(session.handlers.seekforward).toBe(null);
    expect(session.handlers.seekbackward).toBe(null);
    expect(session.handlers.seekto).toBe(null);
  });

  test('stop stays on a live stream, where stopping can only mean pausing', () => {
    const media = fakeMedia('audio', { duration: LIVE_DURATION, paused: false });
    mount(media).onPlay();
    session.handlers.stop();
    expect(media.paused).toBe(true);
  });

  test('a live stream writes no position, because its duration and the spec\'s disagree', () => {
    mount(fakeMedia('audio', { duration: LIVE_DURATION })).onPlay();
    expect(session.positions).toEqual([]);
  });

  test('the position never runs past the duration the same call reports', () => {
    const media = fakeMedia('audio', { duration: 120 });
    const player = mount(media);
    player.onPlay();
    media.currentTime = 500;
    player.updatePositionState();
    const last = session.positions.at(-1);
    expect(last.position).toBe(120);
    expect(last.playbackRate).toBeGreaterThan(0);
  });

  test('a title the author never wrote is not invented from the file name', () => {
    mount(fakeMedia()).onPlay();
    expect(session.metadata).toBe(null);
  });

  test('the media element\'s own title reaches the lock screen with no new markup', () => {
    const media = fakeMedia();
    media.setAttribute('title', 'Tone');
    mount(media).onPlay();
    expect(session.metadata.title).toBe('Tone');
  });

  test('a title on the wrapper wins over the one on the media element', () => {
    const media = fakeMedia();
    media.setAttribute('title', 'tone.wav');
    const player = mount(media);
    player.setAttribute('media-title', 'Rollout');
    player.setAttribute('artist', 'Stamat');
    player.onPlay();
    expect(session.metadata.title).toBe('Rollout');
    expect(session.metadata.artist).toBe('Stamat');
  });

  test('a video poster becomes the artwork, resolved against the page the panel cannot see', () => {
    const media = fakeMedia('video');
    media.setAttribute('poster', 'sample/rollout.jpg');
    mount(media).onPlay();
    expect(session.metadata.artwork).toEqual([{ src: 'http://localhost/sample/rollout.jpg' }]);
  });

  test('an artwork path that will not parse leaves the panel its own default, not a broken image', () => {
    const player = mount(fakeMedia());
    player.setAttribute('artwork', '//');
    player.onPlay();
    expect(session.metadata).toBe(null);
  });

  test('a player taken off the page stops driving the panel', () => {
    const media = fakeMedia();
    media.setAttribute('title', 'Tone');
    const player = mount(media);
    player.onPlay();
    player.remove();
    expect(session.metadata).toBe(null);
    expect(session.handlers.stop).toBe(null);
  });

  test('the last player to start owns the panel, and the one before it stops writing to it', () => {
    const first = mount(fakeMedia());
    const second = mount(fakeMedia());
    first.onPlay();
    second.onPlay();
    const written = session.positions.length;
    first.updatePositionState();
    expect(session.positions.length).toBe(written);
  });

  test('a browser with no Media Session API plays on rather than throwing', () => {
    delete navigator.mediaSession;
    const player = mount(fakeMedia());
    expect(() => player.onPlay()).not.toThrow();
  });
});

describe('which element it wrapped', () => {
  test('a video gets the video half, and says so where CSS can see it', () => {
    const player = mount(fakeMedia('video'));
    expect(player.isVideo).toBe(true);
    expect(player.hasAttribute('is-video')).toBe(true);
  });

  test('an audio element is not a video, and asking for fullscreen does nothing', () => {
    const player = mount(fakeMedia('audio'));
    // The hook's absence is the guarantee — a stylesheet asks `[is-video]`, never `="false"`.
    expect(player.hasAttribute('is-video')).toBe(false);
    expect(() => player.toggleFullscreen()).not.toThrow();
    expect(player.hasAttribute('is-fullscreen')).toBe(false);
  });

  test('where no fullscreen door will open, the element says so where CSS can hide the button', () => {
    // jsdom implements no Fullscreen API at all, which makes it the blocked case for free —
    // the same shape as an iframe without allow="fullscreen".
    const video = mount(fakeMedia('video'));
    expect(video.hasAttribute('no-fullscreen')).toBe(true);
    // Audio has no fullscreen half, so it makes no claim either way.
    const audio = mount(fakeMedia('audio'));
    expect(audio.hasAttribute('no-fullscreen')).toBe(false);
  });
});

describe('time', () => {
  test('a time under an hour is mm:ss, and one over it grows the hours segment rather than lying', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(67)).toBe('01:07');
    expect(formatTime(3600)).toBe('01:00:00');
    expect(formatTime(3661)).toBe('01:01:01');
  });

  test('a duration the browser has not worked out yet reads as zero rather than NaN:NaN', () => {
    expect(formatTime(NaN)).toBe('00:00');
    expect(formatTime(Infinity)).toBe('00:00');
    expect(formatTime(-5)).toBe('00:00');
  });

  test('the clock and the countdown are written together, so they can never disagree', () => {
    const player = mount(fakeMedia('audio', { duration: 100 }));
    player.paint(30);
    expect(player.currentTime).toBe(30);
    expect(player.remaining).toBe(70);
  });

  test('a skip past either end stops at the end rather than seeking outside the media', () => {
    const media = fakeMedia('audio', { duration: 100 });
    const player = mount(media);
    player.seekBy(-10);
    expect(media.currentTime).toBe(0);
    player.seekTo(90);
    player.seekBy(30);
    expect(media.currentTime).toBe(100);
  });

  test('stop is a pause that goes home: playback halts and the clock reads zero', () => {
    const media = fakeMedia('audio', { duration: 100 });
    const player = mount(media);
    media.play();
    player.seekTo(40);
    const seen = [];
    player.addEventListener('media-player-interaction', (e) => seen.push(e.detail.type));
    player.stop();
    expect(media.paused).toBe(true);
    expect(media.currentTime).toBe(0);
    expect(player.currentTime).toBe(0);
    expect(seen).toEqual(['stop']);
  });

  test('the skip attribute is what a skip button moves, and a nonsense one falls back to ten', () => {
    const player = mount(fakeMedia());
    expect(player.skipStep).toBe(10);
    player.setAttribute('skip', '30');
    expect(player.skipStep).toBe(30);
    player.setAttribute('skip', 'soon');
    expect(player.skipStep).toBe(10);
  });
});

describe('volume', () => {
  test('the ends snap shut, so silence and full are reachable by dragging rather than only by arithmetic', () => {
    expect(clampVolume(0.97)).toBe(1);
    expect(clampVolume(0.04)).toBe(0);
    expect(clampVolume(0.5)).toBe(0.5);
  });

  test('the middle of the range is not quantised, so the write-back cannot yank the thumb mid-drag', () => {
    expect(clampVolume(0.43)).toBe(0.43);
    expect(clampVolume(0.67)).toBe(0.67);
  });

  test('the three icons split the range where a listener would say quiet, middling and loud', () => {
    expect(volumeState(0)).toBe('mute');
    expect(volumeState(0.3)).toBe('mid');
    expect(volumeState(0.9)).toBe('full');
  });

  test('muting remembers the level to come back to, so unmute is not a jump to full', () => {
    const media = fakeMedia();
    const player = mount(media);
    player.applyVolume(0.4);
    player.toggleMute();
    expect(media.volume).toBe(0);
    player.toggleMute();
    expect(media.volume).toBe(0.4);
  });

  test('the level the last visit left is what this one starts at', () => {
    localStorage.setItem('media-player-volume', '0.3');
    const media = fakeMedia();
    mount(media);
    expect(media.volume).toBe(0.3);
  });

  test('restoring writes nothing back, so a player nobody touched does not keep rewriting its own entry', () => {
    localStorage.setItem('media-player-volume', '0.3');
    localStorage.removeItem('media-player-muted');
    mount(fakeMedia());
    expect(localStorage.getItem('media-player-muted')).toBe(null);
  });

  test('two players with their own storage-key do not share one volume', () => {
    localStorage.setItem('podcast-volume', '0.2');
    const media = fakeMedia();
    const player = document.createElement('media-player');
    player.setAttribute('storage-key', 'podcast');
    player.appendChild(media);
    document.body.appendChild(player);
    expect(media.volume).toBe(0.2);
  });

  test('storage the browser refuses costs the volume, never the page', () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('The operation is insecure.');
    });
    const player = mount(fakeMedia());
    expect(() => player.applyVolume(0.5)).not.toThrow();
    setItem.mockRestore();
  });

  test('volume buttons step by a tenth, silent at the bottom and full at the top with no dead press', () => {
    const media = fakeMedia();
    const player = mount(media);
    player.applyVolume(0.5);
    player.volumeDown();
    expect(media.volume).toBe(0.4);
    player.applyVolume(0.1);
    player.volumeDown();
    expect(media.volume).toBe(0); // the last press down is silence
    expect(media.muted).toBe(true);
    player.volumeUp();
    expect(media.volume).toBe(0.1); // and the first press up is audible again
    expect(media.muted).toBe(false);
    player.applyVolume(0.9);
    player.volumeUp();
    expect(media.volume).toBe(1); // the end snap closes the top
  });

  test('a mute on a volume nobody ever dragged still survives the reload', () => {
    // Muting stores `muted` and no level — `rememberVolume` never writes a zero — so the
    // restore cannot wait for a stored volume before acting on the flag.
    const player = mount(fakeMedia());
    player.toggleMute();
    player.remove();
    document.body.innerHTML = '';

    const media = fakeMedia();
    const revisit = mount(media);
    expect(media.muted).toBe(true);
    expect(media.volume).toBe(0);
    revisit.toggleMute();
    expect(media.volume).toBe(1); // the element's own level from before the mute — full here
  });

  test('unmuting a lone restored mute returns to the level the element had, not to full', () => {
    localStorage.setItem('media-player-muted', 'true');
    const media = fakeMedia();
    media.volume = 0.2; // the page's own level, set before the upgrade
    const player = mount(media);
    expect(media.muted).toBe(true);
    player.toggleMute();
    expect(media.volume).toBe(0.2);
  });

  test('a stored sub-threshold level cannot become a mute the button never undoes', () => {
    // `applyVolume` snaps below 0.1 to zero; remembering the raw value would hand every
    // unmute a level that clamps straight back to silence. This element never stores one —
    // the entry is shared, and a page can.
    localStorage.setItem('media-player-volume', '0.05');
    const media = fakeMedia();
    const player = mount(media);
    expect(media.muted).toBe(true); // 0.05 clamps to zero on the way in
    player.toggleMute();
    expect(media.muted).toBe(false);
    expect(media.volume).toBe(1); // nothing worth remembering was stored
  });

  test('a mute survives a reload, and unmuting after it returns to the old level rather than full blast', () => {
    const player = mount(fakeMedia());
    player.applyVolume(0.4);
    player.toggleMute();
    player.remove();
    document.body.innerHTML = '';

    const media = fakeMedia();
    const revisit = mount(media);
    expect(media.muted).toBe(true);
    revisit.toggleMute();
    expect(media.volume).toBe(0.4);
  });

  test('an author-written muted survives a level stored by another player on the shared key', () => {
    // The default storage key is site-wide: the level a visitor dragged on one page must
    // not unmute the background video another page deliberately ships `muted` — an
    // autoplaying loop is stopped by its browser the moment it makes sound.
    localStorage.setItem('media-player-volume', '0.6');
    localStorage.setItem('media-player-muted', 'false');
    const media = fakeMedia('video');
    media.setAttribute('muted', '');
    const player = mount(media);
    expect(media.muted).toBe(true);
    expect(player.getAttribute('volume-state')).toBe('mute');
  });

  test('a volume drag persists and announces once it settles, not once per pixel', () => {
    jest.useFakeTimers();
    const media = fakeMedia();
    const player = mount(media);
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    const volumes = [];
    player.addEventListener('media-player-interaction', (e) => { if (e.detail.type === 'volume') volumes.push(e.detail.value); });

    player.setVolume({ target: { value: '30' } });
    player.setVolume({ target: { value: '60' } });
    expect(media.volume).toBe(0.6); // the sound follows the thumb immediately
    expect(setItem).not.toHaveBeenCalled();
    expect(volumes).toEqual([]);

    jest.advanceTimersByTime(VOLUME_SETTLE);
    expect(volumes).toEqual([0.6]);
    expect(localStorage.getItem('media-player-volume')).toBe('0.6');
    setItem.mockRestore();
    jest.useRealTimers();
  });
});

describe('the clock surviving a scrub', () => {
  test('a thumb put back where it was picked up still lands and restarts the clock, though no change event ever fires', () => {
    const media = fakeMedia('audio', { duration: 100 });
    const player = mount(media);
    media.play();

    // The drag: input fires, the clock stops so it cannot fight the thumb.
    player.scrub({ target: { value: '20' } });
    expect(player.currentTime).toBe(20);

    // Released on the value it started from, so the browser sends no `change` — only the
    // pointerup that `endScrub` is bound to. Without it the clock never restarts and the
    // label sits still over playing audio.
    player.endScrub();
    expect(media.currentTime).toBe(20);

    // The clock is live again: a tick now paints whatever the media element says.
    media.currentTime = 55;
    player.tick();
    expect(player.currentTime).toBe(55);
  });

  test('the drag lands where the thumb was let go, even when pointerup beats change to it', () => {
    const media = fakeMedia('audio', { duration: 100 });
    const player = mount(media);
    media.play();

    player.scrub({ target: { value: '80' } });
    // Chrome's order. The clock restarting writes currentTime back into the field, so a
    // commit that read the DOM here would seek to wherever playback was, not to 80.
    player.endScrub();
    player.seek({ target: { value: '3' } });

    expect(media.currentTime).toBe(80);
  });

  test('the drag lands once, so releasing does not fire two seeks', () => {
    const media = fakeMedia('audio', { duration: 100 });
    const player = mount(media);
    const seeks = [];
    player.addEventListener('media-player-interaction', (e) => { if (e.detail.type === 'seek') seeks.push(e.detail.value); });
    player.scrub({ target: { value: '40' } });
    player.endScrub();
    player.seek({ target: { value: '40' } });
    expect(seeks).toHaveLength(1);
  });

  test('resuming twice does not leave two clocks running against one handle', () => {
    const media = fakeMedia('audio', { duration: 100 });
    const player = mount(media);
    media.play();
    player.resume();
    const first = player.frame;
    player.resume();
    expect(player.frame).not.toBe(first);
  });
});

describe('the end of the track', () => {
  test('a track that finished leaves the scrubber at the end it reached, not a step short of it', () => {
    const media = fakeMedia('audio', { duration: 100 });
    const player = mount(media);
    // Where the last animation frame left it: a fraction short of the end, and no later
    // frame comes to close the gap.
    player.paint(99.87);
    player.onEnded();
    expect(player.currentTime).toBe(100);
    expect(player.remaining).toBe(0);
  });

  test('a live stream that ends has no end to move the thumb to', () => {
    const player = mount(fakeMedia('audio', { duration: LIVE_DURATION }));
    expect(() => player.onEnded()).not.toThrow();
    expect(player.currentTime).toBe(0);
  });
});

describe('the value bubble', () => {
  test('the scrubber hands its slider a time formatter, so the bubble reads a clock and not a count', () => {
    const player = mount(fakeMedia());
    expect(player.timeFormatter).toBe(formatTime);
    expect(player.timeFormatter(72)).toBe('01:12');
  });
});

describe('the floor formatter, kept for markup written before the glide', () => {
  test('floor hands back the whole second below, the number a truncating clock shows', () => {
    const player = mount(fakeMedia());
    const floor = MediaPlayer.formatters.floor;
    // No sample pipes it any more — the scrubber's step="any" wants the fraction — but
    // markup copied from an earlier version still writes `|floor` on the scrubber's binds.
    expect(floor(3.6)).toBe(3);
    expect(floor(3.2)).toBe(3);
    expect(player.formatters.floor).toBe(floor);
  });

  test('a duration the browser has not worked out yet passes through rather than becoming NaN', () => {
    const floor = MediaPlayer.formatters.floor;
    expect(floor(null)).toBe(null);
    expect(floor(NaN)).toBeNaN();
  });
});

describe('toggle buttons', () => {
  test('a toggle speaks ARIA: pressed is the string "true" or "false", never a bare boolean or a missing attribute', () => {
    const pressed = MediaPlayer.formatters.pressed;
    expect(pressed(true)).toBe('true');
    expect(pressed(false)).toBe('false');
    // An absent boolean attribute reads null through the bind, and null must still say "false".
    expect(pressed(null)).toBe('false');
  });
});

describe('the buffered bar', () => {
  test('how far ahead the browser has loaded is seconds, so it shares a scale with the duration', () => {
    const media = fakeMedia('audio', { duration: 100 });
    Object.defineProperty(media, 'buffered', {
      get: () => ({ length: 1, start: () => 0, end: () => 42 }),
      configurable: true
    });
    const player = mount(media);
    player.onProgress();
    // Not 42% of anything — 42 seconds, which is what a <progress max="100"> wants.
    expect(player.buffered).toBe(42);
  });

  test('a media element with nothing buffered yet leaves the bar alone rather than reading end() of nothing', () => {
    const player = mount(fakeMedia());
    expect(() => player.onProgress()).not.toThrow();
  });

  test('a file already buffered before the upgrade still fills its bar, though progress will never fire again', () => {
    const media = fakeMedia('audio', { duration: 60 });
    Object.defineProperty(media, 'buffered', {
      get: () => ({ length: 1, start: () => 0, end: () => 60 }),
      configurable: true
    });
    // No progress event is dispatched anywhere in this test — readiness has to do it.
    const player = mount(media);
    expect(player.buffered).toBe(60);
  });

  test('the bar follows the range the playhead is in, not the furthest one a seek left behind', () => {
    const media = fakeMedia('audio', { duration: 100 });
    Object.defineProperty(media, 'buffered', {
      get: () => ({ length: 2, start: (i) => [0, 40][i], end: (i) => [10, 70][i] }),
      configurable: true
    });
    const player = mount(media);
    expect(player.buffered).toBe(10); // playhead at 0, in the first range

    media.currentTime = 50;
    player.onProgress();
    expect(player.buffered).toBe(70); // in the second range now, and its end is the truth

    media.currentTime = 20;
    player.onProgress();
    expect(player.buffered).toBe(70); // in the gap between them: keep the last bar, do not guess
  });
});

/** A real slider-elemental around the sample's scrubber input, ready to append. */
function scrubberSlider() {
  const slider = document.createElement('slider-elemental');
  slider.className = 'media-player-scrubber';
  slider.innerHTML =
    '<input type="range" min="0" step="any" value="0" aria-label="Seek" bind="duration:attr#max;currentTime:prop#value" />';
  return slider;
}

/** A player mounted around a fake media element and a real scrubber slider. */
function mountWithScrubber(media = fakeMedia('audio', { duration: 120 })) {
  const player = document.createElement('media-player');
  player.appendChild(media);
  const slider = scrubberSlider();
  player.appendChild(slider);
  document.body.appendChild(player);
  return { player, slider, input: slider.querySelector('input') };
}

describe('the slider fills follow scripted writes', () => {
  // A value written into a range input from script fires no event, so slider-elemental
  // cannot see it on its own — the player calls the slider's public apply() after every
  // write. These mount a real slider-elemental, which jsdom runs fine: apply() reads the
  // inputs and writes custom properties, no layout involved.
  test('a seek from script drags the fill with the thumb, though the input fires no event for it', () => {
    const { player, slider } = mountWithScrubber();

    player.seekTo(30);
    expect(slider.style.getPropertyValue('--slider-elemental-end')).toBe('0.25');
  });

  test('a mute landing from script pulls the volume fill down with it', () => {
    const media = fakeMedia();
    const player = document.createElement('media-player');
    player.appendChild(media);
    const slider = document.createElement('slider-elemental');
    slider.className = 'media-player-volume';
    slider.innerHTML =
      '<input type="range" min="0" max="100" step="1" value="100" aria-label="Volume" bind="volumePercent:prop#value" />';
    player.appendChild(slider);
    document.body.appendChild(player);
    expect(slider.style.getPropertyValue('--slider-elemental-end')).toBe('1');

    media.volume = 0;
    media.muted = true;
    player.onVolumeChange();
    expect(slider.style.getPropertyValue('--slider-elemental-end')).toBe('0');
  });

  test('a player drawn without sliders paints the clock and the volume without reaching for them', () => {
    const player = mount(fakeMedia());
    expect(() => {
      player.seekTo(10);
      player.onVolumeChange();
    }).not.toThrow();
  });
});

describe('the step under the hand', () => {
  // At rest the scrubber carries step="any" so the clock's fractional writes land
  // unsnapped; beginScrub flips it to whole seconds for the length of a press. Whether a
  // browser re-snaps the value the instant step changes is a real-browser question jsdom
  // cannot answer — that part is checked by hand, not here.
  test('the clock hands the input the fraction itself, so the thumb can glide between seconds', () => {
    const { player, input } = mountWithScrubber();
    player.paint(3.6);
    expect(input.value).toBe('3.6');
  });

  test('a pointer landing on the scrubber snaps its step to whole seconds, and letting go frees it', () => {
    const { player, input } = mountWithScrubber();
    player.beginScrub({ type: 'pointerdown', target: input });
    expect(input.step).toBe('1');
    player.endScrub();
    expect(input.step).toBe('any');
  });

  test('a seek key snaps the step before the press moves the thumb, and its keyup frees it', () => {
    const { player, input } = mountWithScrubber();
    player.beginScrub({ type: 'keydown', key: 'ArrowRight', target: input });
    expect(input.step).toBe('1');
    player.endScrub();
    expect(input.step).toBe('any');
  });

  test('a Tab passing through leaves the step alone — its keyup would land on the next control and never free it', () => {
    const { player, input } = mountWithScrubber();
    player.beginScrub({ type: 'keydown', key: 'Tab', target: input });
    expect(input.step).toBe('any');
  });

  test('markup still written step="1" gets its own step back, not any', () => {
    const { player, input } = mountWithScrubber();
    input.step = '1';
    player.beginScrub({ type: 'pointerdown', target: input });
    expect(input.step).toBe('1');
    player.endScrub();
    expect(input.step).toBe('1');
  });

  test('a held key re-arms every repeat without forgetting the resting step', () => {
    const { player, input } = mountWithScrubber();
    player.beginScrub({ type: 'keydown', key: 'ArrowRight', target: input });
    player.beginScrub({ type: 'keydown', key: 'ArrowRight', target: input });
    player.endScrub();
    expect(input.step).toBe('any');
  });
});

describe('the labels a button announces itself by', () => {
  test('playing makes the button offer to pause, and pausing makes it offer to play', () => {
    const media = fakeMedia();
    const player = mount(media);
    expect(player.playLabel).toBe('Play');
    player.onPlay();
    expect(player.playLabel).toBe('Pause');
    expect(player.hasAttribute('is-playing')).toBe(true);
    player.onPause();
    expect(player.playLabel).toBe('Play');
    expect(player.hasAttribute('is-playing')).toBe(false);
  });

  test('the fold button offers fewer controls once they are out, and more again after', () => {
    const media = fakeMedia();
    const player = mount(media);
    // Initialised, not left for the first toggle: the aria-label bind renders null by
    // removing the attribute, and that is a nameless button.
    expect(player.moreLabel).toBe('More controls');
    player.onMoreToggle({ detail: { open: true } });
    expect(player.moreLabel).toBe('Fewer controls');
    player.onMoreToggle({ detail: { open: false } });
    expect(player.moreLabel).toBe('More controls');
  });

  test('the mute button says which way it goes, and follows a volume change it did not make', () => {
    const media = fakeMedia();
    const player = mount(media);
    expect(player.muteLabel).toBe('Mute');
    media.volume = 0;
    player.onVolumeChange();
    expect(player.muteLabel).toBe('Unmute');
    expect(player.volumeState).toBe('mute');
    // What the volume slider's input is bound to — zero here is what drags its fill down.
    expect(player.volumePercent).toBe(0);
  });
});

/**
 * A `<track>` jsdom will tolerate: the element exists but its `track` property does not,
 * so the TextTrack half is a plain object holding the fields the player reads and writes.
 * The stub's `kind` mirrors the platform's canonical form — lowercase, and `subtitles`
 * where the attribute is missing.
 */
function fakeTrack(kind) {
  const track = document.createElement('track');
  if (kind) track.setAttribute('kind', kind);
  Object.defineProperty(track, 'track', {
    value: {
      mode: 'disabled',
      kind: (kind || 'subtitles').toLowerCase(),
      listeners: 0,
      addEventListener() { this.listeners += 1; },
      removeEventListener() { this.listeners -= 1; }
    },
    configurable: true
  });
  return track;
}

/**
 * A caption track with no `<track>` behind it, the way a streaming library adds one, and a
 * `textTracks` list that can announce it: jsdom's own list is an empty stub with no
 * `addEventListener`, so the list a browser would have is stated here.
 */
function fakeInbandCaptions(media, kind = 'captions') {
  const bus = new EventTarget();
  const list = [];
  list.addEventListener = bus.addEventListener.bind(bus);
  list.removeEventListener = bus.removeEventListener.bind(bus);
  Object.defineProperty(media, 'textTracks', { value: list, configurable: true });

  return () => {
    const track = {
      kind,
      mode: 'disabled',
      listeners: 0,
      addEventListener() { this.listeners += 1; },
      removeEventListener() { this.listeners -= 1; }
    };
    list.push(track);
    bus.dispatchEvent(new Event('addtrack'));
    return track;
  };
}

describe('captions', () => {
  test('a track inside the media element is what makes a captions button worth showing', () => {
    const media = fakeMedia('video');
    media.appendChild(fakeTrack());
    const player = mount(media);
    expect(player.hasAttribute('has-captions')).toBe(true);
  });

  test('toggling captions flips the label, the track mode and the remembered choice', () => {
    const media = fakeMedia('video');
    const track = fakeTrack();
    media.appendChild(track);
    const player = mount(media);

    player.toggleCaptions();
    expect(player.captionsLabel).toBe('Disable captions');
    expect(track.track.mode).toBe('hidden'); // hidden, not showing: the element renders the cue itself
    expect(localStorage.getItem('media-player-captions')).toBe('true');

    player.toggleCaptions();
    expect(player.captionsLabel).toBe('Enable captions');
    expect(track.track.mode).toBe('disabled');
  });

  test('the track the author marked default is the one the button toggles, not the first written', () => {
    const media = fakeMedia('video');
    const first = fakeTrack();
    const preferred = fakeTrack();
    preferred.setAttribute('default', '');
    media.append(first, preferred);
    const player = mount(media);

    expect(player.track).toBe(preferred.track);
    player.toggleCaptions();
    expect(preferred.track.mode).toBe('hidden');
    expect(first.track.mode).toBe('disabled');
  });

  test('a caption track that arrives after the upgrade still earns its button', () => {
    const media = fakeMedia('video');
    const add = fakeInbandCaptions(media);
    const player = mount(media);
    expect(player.hasAttribute('has-captions')).toBe(false);

    const track = add();
    expect(player.hasAttribute('has-captions')).toBe(true);
    player.toggleCaptions();
    expect(track.mode).toBe('hidden');
  });

  test('a track that arrives late is handed the captions choice from last visit', () => {
    localStorage.setItem('media-player-captions', 'true');
    const media = fakeMedia('video');
    const add = fakeInbandCaptions(media);
    mount(media);
    const track = add();
    expect(track.mode).toBe('hidden');
  });

  test('an in-band track keeps its cue listener across a move in the DOM', () => {
    const media = fakeMedia('video');
    const add = fakeInbandCaptions(media);
    const player = mount(media);
    const track = add();
    expect(track.listeners).toBe(1);

    const aside = document.createElement('aside');
    document.body.appendChild(aside);
    aside.appendChild(player); // one move: disconnected takes it off, connected puts it back
    expect(track.listeners).toBe(1);
  });

  test('a data track arriving is not mistaken for captions', () => {
    const media = fakeMedia('video');
    const add = fakeInbandCaptions(media, 'metadata');
    const player = mount(media);
    add();
    expect(player.hasAttribute('has-captions')).toBe(false);
  });

  test('a chapters track earns no captions button, written in the markup or arriving in the list', () => {
    // Only captions, subtitles and the bare `<track>` the platform defaults to subtitles
    // count — a chapters walk rendered as captions text would read as broken captions.
    const media = fakeMedia('video');
    const chapters = fakeTrack('chapters');
    media.appendChild(chapters);
    const player = mount(media);
    expect(player.hasAttribute('has-captions')).toBe(false);

    const inband = fakeMedia('video');
    const add = fakeInbandCaptions(inband, 'chapters');
    const late = mount(inband);
    add();
    expect(late.hasAttribute('has-captions')).toBe(false);
  });

  test('a <track> appended after the upgrade is listened to, not just found', () => {
    // hydrargyri scans `static wires` once at upgrade, so a cue wire on `<track>` elements
    // could never hear one appended later: it earned its button and its cues never arrived,
    // silently. The adopted TextTrack carries one direct listener instead, whatever stands
    // behind it.
    const media = fakeMedia('video');
    const bus = new EventTarget();
    const list = [];
    list.addEventListener = bus.addEventListener.bind(bus);
    list.removeEventListener = bus.removeEventListener.bind(bus);
    Object.defineProperty(media, 'textTracks', { value: list, configurable: true });
    const player = mount(media);
    expect(player.hasAttribute('has-captions')).toBe(false);

    const late = fakeTrack();
    media.appendChild(late);
    bus.dispatchEvent(new Event('addtrack'));
    expect(player.hasAttribute('has-captions')).toBe(true);
    expect(late.track.listeners).toBe(1);
  });

  test('a reconnect with a different media element starts over instead of resuming the old one', () => {
    // A morph or a framework re-render can put the player back with a fresh <audio>
    // inside. Resuming would keep the clock, track and volume of the element that is gone
    // while the new one sits at platform defaults — same element resumes, different
    // element re-initialises.
    const player = mount(fakeMedia());
    player.applyVolume(0.3);
    player.toggleMute();
    expect(localStorage.getItem('media-player-muted')).toBe('true');
    player.remove();

    const swapped = fakeMedia('audio', { duration: 60 });
    player.querySelector('audio').remove();
    player.appendChild(swapped);
    document.body.appendChild(player);

    expect(player.media).toBe(swapped);
    expect(swapped.controls).toBe(false);
    expect(swapped.muted).toBe(true); // the stored mute reached the new element
    expect(player.duration).toBe(60); // the new element's metadata, not the old clock
  });

  test('a markup track\'s cue listener survives a move in the DOM', () => {
    const media = fakeMedia('video');
    const track = fakeTrack();
    media.appendChild(track);
    const player = mount(media);
    expect(track.track.listeners).toBe(1);

    const aside = document.createElement('aside');
    document.body.appendChild(aside);
    aside.appendChild(player); // one move: disconnected takes it off, connected puts it back
    expect(track.track.listeners).toBe(1);
  });

  test('a chapters cue never paints into the caption box, though its track rides the same wire', () => {
    // The cue wire reaches every `<track>` in the player. Before the kind rule reached
    // `onCue` too, a declined track's cues rendered as captions nothing could turn off —
    // the button refuses the track, so there is no control to empty the box with.
    const media = fakeMedia('video');
    const chapters = fakeTrack('chapters');
    media.appendChild(chapters);
    const player = mount(media);

    chapters.track.activeCues = [{ text: 'Chapter one' }];
    player.onCue({ target: chapters });
    expect(player.captionText ?? null).toBe(null);
    expect(chapters.track.mode).toBe('disabled'); // not flipped hidden by a cue it declined
  });

  test('an adopted track\'s cue is what the caption box shows, and an empty set clears it', () => {
    const media = fakeMedia('video');
    const track = fakeTrack();
    media.appendChild(track);
    const player = mount(media);

    track.track.activeCues = [{ text: 'hello' }];
    player.onCue({ target: track });
    expect(player.captionText).toBe('hello');

    track.track.activeCues = [];
    player.onCue({ target: track });
    expect(player.captionText).toBe(null);
  });

  test('a track the author wrote as kind="Captions" is captions all the same', () => {
    // `kind` is an enumerated attribute the platform matches case-insensitively; without
    // the selector's `i` flag a valid track loses its button.
    const media = fakeMedia('video');
    const track = fakeTrack('Captions');
    media.appendChild(track);
    const player = mount(media);
    expect(player.hasAttribute('has-captions')).toBe(true);
    expect(player.track).toBe(track.track);
  });

  test('the default keeps winning when its kind is written in another case', () => {
    const media = fakeMedia('video');
    const first = fakeTrack();
    const preferred = fakeTrack('SUBTITLES');
    preferred.setAttribute('default', '');
    media.append(first, preferred);
    expect(mount(media).track).toBe(preferred.track);
  });

  test('captions left on last visit come back on, without writing the choice again', () => {
    localStorage.setItem('media-player-captions', 'true');
    const media = fakeMedia('video');
    const track = fakeTrack();
    media.appendChild(track);
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    const player = mount(media);
    expect(player.hasAttribute('captions-visible')).toBe(true);
    expect(track.track.mode).toBe('hidden');
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});

/**
 * A thumbnails track with its cues already in hand, since jsdom fetches and parses no VTT.
 * The absolute `src` is what relative image paths in the cues resolve against.
 */
function fakeThumbs(cues) {
  const track = document.createElement('track');
  track.setAttribute('kind', 'metadata');
  track.setAttribute('src', 'https://example.com/media/thumbs.vtt');
  Object.defineProperty(track, 'track', { value: { kind: 'metadata', mode: 'disabled', cues }, configurable: true });
  return track;
}

const SPRITE_CUES = [
  { startTime: 0, endTime: 60, text: 'sprite.jpg#xywh=0,0,160,90' },
  { startTime: 60, endTime: 120, text: 'sprite.jpg#xywh=160,0,160,90' }
];

function mountPreview(cues) {
  const media = fakeMedia('video');
  media.appendChild(fakeThumbs(cues));
  const player = document.createElement('media-player');
  const scrubber = document.createElement('div');
  scrubber.className = 'media-player-scrubber';
  const box = document.createElement('div');
  box.className = 'media-player-preview';
  box.hidden = true;
  scrubber.appendChild(box);
  player.append(media, scrubber);
  document.body.appendChild(player);
  // jsdom lays nothing out, so the track the pointer moves along is stated: 200px wide,
  // over the fixture's 120s — clientX 100 is the 60-second mark.
  scrubber.getBoundingClientRect = () => ({ left: 0, width: 200 });
  return { player, box };
}

describe('frame previews on the scrubber', () => {
  test('hovering shows the slice of the sprite whose cue covers that second, cut to the tile\'s own size', () => {
    const { player, box } = mountPreview(SPRITE_CUES);
    player.preview({ clientX: 150 });
    expect(box.hidden).toBe(false);
    expect(box.style.backgroundImage).toBe('url("https://example.com/media/sprite.jpg")');
    expect(box.style.backgroundPosition).toContain('-160px');
    expect(box.style.width).toBe('160px');
    expect(box.style.height).toBe('90px');
  });

  test('the box follows the pointer and is stopped at the edges rather than leaving the player', () => {
    const { player, box } = mountPreview(SPRITE_CUES);
    Object.defineProperty(box, 'offsetWidth', { value: 40, configurable: true });
    player.preview({ clientX: 100 });
    expect(box.style.left).toBe('100px');
    player.preview({ clientX: 5 }); // half the box, not the pointer, is the floor at the edge
    expect(box.style.left).toBe('20px');
    player.preview({ clientX: 199 });
    expect(box.style.left).toBe('180px');
  });

  test('leaving the scrubber takes the frame with it', () => {
    const { player, box } = mountPreview(SPRITE_CUES);
    player.preview({ clientX: 100 });
    expect(box.hidden).toBe(false);
    player.endPreview();
    expect(box.hidden).toBe(true);
  });

  test('a second no cue covers hides the frame rather than holding up a stale one', () => {
    const { player, box } = mountPreview([SPRITE_CUES[0]]);
    player.preview({ clientX: 50 });
    expect(box.hidden).toBe(false);
    player.preview({ clientX: 150 }); // 90s: past the only cue
    expect(box.hidden).toBe(true);
  });

  test('a cue naming a whole image fills the box the stylesheet sized, instead of windowing a sprite', () => {
    const { player, box } = mountPreview([{ startTime: 0, endTime: 120, text: 'poster.jpg' }]);
    player.preview({ clientX: 100 });
    expect(box.hidden).toBe(false);
    expect(box.style.backgroundSize).toBe('cover');
    expect(box.style.width).toBe('');
  });

  test('a live stream previews nothing, because a position on it names no frame', () => {
    const { player, box } = mountPreview(SPRITE_CUES);
    player.isLive = true;
    player.preview({ clientX: 100 });
    expect(box.hidden).toBe(true);
  });

  test('a player with no thumbnails track answers a hover with nothing rather than a throw', () => {
    const media = fakeMedia('video');
    const player = document.createElement('media-player');
    const scrubber = document.createElement('div');
    scrubber.className = 'media-player-scrubber';
    const box = document.createElement('div');
    box.className = 'media-player-preview';
    box.hidden = true;
    scrubber.appendChild(box);
    player.append(media, scrubber);
    document.body.appendChild(player);
    scrubber.getBoundingClientRect = () => ({ left: 0, width: 200 });
    expect(() => player.preview({ clientX: 100 })).not.toThrow();
    expect(box.hidden).toBe(true);
  });

  test('the metadata track is flipped hidden, because a disabled track never fetches its file', () => {
    const { player } = mountPreview(SPRITE_CUES);
    expect(player.thumbs.track.mode).toBe('hidden');
  });

  test('a thumbnails track alone earns no captions button', () => {
    const media = fakeMedia('video');
    media.appendChild(fakeThumbs(SPRITE_CUES));
    const player = mount(media);
    expect(player.hasAttribute('has-captions')).toBe(false);
  });

  test('captions and thumbnails share one video without stepping on each other', () => {
    const media = fakeMedia('video');
    const thumbs = fakeThumbs(SPRITE_CUES);
    const captions = fakeTrack();
    media.append(thumbs, captions);
    const player = mount(media);
    expect(player.hasAttribute('has-captions')).toBe(true);
    expect(player.track).toBe(captions.track);
    expect(player.thumbs).toBe(thumbs);
  });

  test('a thumbnails cue never lands in the captions text', () => {
    const { player } = mountPreview(SPRITE_CUES);
    player.captionText = 'what was said';
    player.thumbs.track.activeCues = [{ text: 'sprite.jpg#xywh=0,0,160,90' }];
    player.onCue({ target: player.thumbs });
    expect(player.captionText).toBe('what was said');
  });

  test('a relative image path points where the vtt sits, not where the page does', () => {
    const frame = parseThumb('sprite.jpg#xywh=0,0,160,90', 'https://example.com/media/thumbs.vtt');
    expect(frame.src).toBe('https://example.com/media/sprite.jpg');
    expect(frame.w).toBe(160);
  });

  test('a url with a quote in it cannot close the background it is painted into', () => {
    const frame = parseThumb('spri"te.jpg', 'https://example.com/media/thumbs.vtt');
    expect(frame.src).not.toContain('"');
    expect(frame.src).toContain('%22');
  });

  test('a cue that is no url at all paints nothing rather than throwing', () => {
    expect(parseThumb('http://[', 'https://example.com/media/thumbs.vtt')).toBe(null);
  });
});

describe('video controls that hide themselves', () => {
  test('the controls go away once the pointer has stopped this long, but only while playing', () => {
    jest.useFakeTimers();
    const player = mount(fakeMedia('video', { paused: false }));
    player.showControls();
    expect(player.hasAttribute('controls-shown')).toBe(true);
    jest.advanceTimersByTime(CONTROLS_LINGER);
    expect(player.hasAttribute('controls-shown')).toBe(false);
    jest.useRealTimers();
  });

  test('a paused video keeps its controls up: they are how you start it again', () => {
    jest.useFakeTimers();
    const player = mount(fakeMedia('video', { paused: true }));
    player.showControls();
    jest.advanceTimersByTime(CONTROLS_LINGER * 2);
    expect(player.hasAttribute('controls-shown')).toBe(true);
    jest.useRealTimers();
  });
});

/**
 * jsdom implements no `IntersectionObserver` and lays nothing out, so there is no viewport to
 * scroll and no crossing to observe. The stub keeps the constructed observers so a test can
 * call the callback the way the platform would, which leaves what the platform decides —
 * when a crossing has happened — a browser's to prove.
 */
describe('pausing when the player scrolls away', () => {
  let observers;

  beforeEach(() => {
    observers = [];
    globalThis.IntersectionObserver = class {
      constructor(callback) {
        this.callback = callback;
        observers.push(this);
      }
      observe() {}
      disconnect() {
        this.stopped = true;
      }
    };
  });

  afterEach(() => {
    delete globalThis.IntersectionObserver;
  });

  test('a player told to pause off-screen stops when it leaves the viewport, and does not start itself again on the way back', () => {
    const media = fakeMedia('video');
    const player = mount(media);
    player.setAttribute('pause-offscreen', '');
    media.play();

    observers.at(-1).callback([{ isIntersecting: false }]);
    expect(media.paused).toBe(true);

    observers.at(-1).callback([{ isIntersecting: true }]);
    expect(media.paused).toBe(true);
  });

  test('a player never told to watches nothing at all', () => {
    mount(fakeMedia('video'));
    expect(observers).toHaveLength(0);
  });

  test('taking the attribute back off takes the observer down with it, and so does leaving the page', () => {
    const player = mount(fakeMedia('video'));
    player.setAttribute('pause-offscreen', '');
    expect(observers).toHaveLength(1);

    player.removeAttribute('pause-offscreen');
    expect(observers[0].stopped).toBe(true);

    player.setAttribute('pause-offscreen', '');
    player.remove();
    expect(observers.at(-1).stopped).toBe(true);
  });

  test('an off-screen player that was already paused is left alone rather than paused again', () => {
    const media = fakeMedia('video');
    const player = mount(media);
    player.setAttribute('pause-offscreen', '');
    const pauses = jest.spyOn(media, 'pause');

    observers.at(-1).callback([{ isIntersecting: false }]);
    expect(pauses).not.toHaveBeenCalled();
  });
});

describe('playback speed', () => {
  // The control the samples bind is a `<select>`, so the value arrives as a string off the
  // event rather than as a number in an argument — which is the whole reason `setRate`
  // parses at all.
  const change = (value) => ({ target: { value } });

  test('a speed control writes through to the media element, and the element follows the media back', () => {
    const media = fakeMedia();
    const player = mount(media);
    expect(player.playbackRate).toBe(1);

    player.setRate(change('1.5'));
    expect(media.playbackRate).toBe(1.5);

    // The platform is what announces the change, including one this element did not make.
    media.playbackRate = 0.5;
    media.dispatchEvent(new Event('ratechange'));
    expect(player.playbackRate).toBe(0.5);
  });

  test('a rate that is not a positive number is dropped rather than written', () => {
    const media = fakeMedia();
    const player = mount(media);

    for (const value of ['0', '-1', 'fast', '', 'Infinity']) {
      player.setRate(change(value));
      expect(media.playbackRate).toBe(1);
    }
  });

  test('a media element with no playbackRate says so, and nothing is written to it', () => {
    defineFakeElement('rateless-video');
    const media = fakeElement('rateless-video');
    const player = mount(media);

    expect(player.hasAttribute('no-rate')).toBe(true);
    expect(player.playbackRate).toBe(1);

    player.setRate(change('2'));
    expect(media.playbackRate).toBeUndefined();
  });

  test('a <video> that has one does not carry the hook', () => {
    const player = mount(fakeMedia('video'));
    expect(player.hasAttribute('no-rate')).toBe(false);
  });
});

describe('the picture-in-picture window', () => {
  let media;
  let player;
  let requested;

  function enablePip(on = true) {
    document.pictureInPictureEnabled = on;
    document.exitPictureInPicture = jest.fn(() => {
      document.pictureInPictureElement = null;
    });
    document.pictureInPictureElement = null;
    media = fakeMedia('video');
    requested = jest.fn(() => {
      document.pictureInPictureElement = media;
      return Promise.resolve();
    });
    if (on) media.requestPictureInPicture = requested;
    player = mount(media);
  }

  afterEach(() => {
    delete document.pictureInPictureEnabled;
    delete document.pictureInPictureElement;
    delete document.exitPictureInPicture;
  });

  test('the button opens the window, and the attribute follows the platform rather than the press', () => {
    enablePip();
    expect(player.hasAttribute('no-pip')).toBe(false);

    player.togglePictureInPicture();
    expect(requested).toHaveBeenCalled();
    // Nothing is assumed from the call: the attribute waits for the event the browser fires,
    // which is also what a window opened from the browser's own control arrives as.
    expect(player.hasAttribute('is-pip')).toBe(false);

    media.dispatchEvent(new Event('enterpictureinpicture'));
    expect(player.hasAttribute('is-pip')).toBe(true);

    player.togglePictureInPicture();
    expect(document.exitPictureInPicture).toHaveBeenCalled();
    media.dispatchEvent(new Event('leavepictureinpicture'));
    expect(player.hasAttribute('is-pip')).toBe(false);
  });

  test('a player with no window to open says so and the press does nothing', () => {
    enablePip(false);
    expect(player.hasAttribute('no-pip')).toBe(true);
    expect(() => player.togglePictureInPicture()).not.toThrow();
    expect(requested).not.toHaveBeenCalled();
  });

  test('an audio player never offers one', () => {
    document.pictureInPictureEnabled = true;
    const sound = fakeMedia('audio');
    sound.requestPictureInPicture = jest.fn();
    const audioPlayer = mount(sound);
    audioPlayer.togglePictureInPicture();
    expect(sound.requestPictureInPicture).not.toHaveBeenCalled();
  });

  test('a refused request warns rather than going quiet', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    document.pictureInPictureEnabled = true;
    document.pictureInPictureElement = null;
    const video = fakeMedia('video');
    video.requestPictureInPicture = () => Promise.reject(new Error('no user gesture'));
    mount(video).togglePictureInPicture();

    await Promise.resolve();
    await Promise.resolve();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('picture-in-picture was refused'), 'no user gesture');
    warn.mockRestore();
  });
});

describe('the AirPlay route', () => {
  /**
   * A `RemotePlayback` object the way the spec draws one: `watchAvailability` queues the
   * current availability at the callback before its promise resolves the id, which is the
   * ordering the element's cancel path has to survive.
   */
  function fakeRemote({ available = false, watch = 'ok' } = {}) {
    const remote = new EventTarget();
    remote.state = 'disconnected';
    remote.prompt = jest.fn(() => Promise.resolve());
    remote.cancelWatchAvailability = jest.fn();
    remote.watchAvailability = jest.fn((callback) => {
      if (watch !== 'ok') return Promise.reject(Object.assign(new Error('no'), { name: watch }));
      callback(available);
      return Promise.resolve(7);
    });
    remote.announce = (state) => {
      remote.state = state;
      remote.dispatchEvent(new Event(state === 'connected' ? 'connect' : 'disconnect'));
    };
    return remote;
  }

  function remoteMedia(tag = 'video', options) {
    const media = fakeMedia(tag);
    media.remote = fakeRemote(options);
    return media;
  }

  test('nothing is offered until the browser says there is somewhere to send it', () => {
    const media = remoteMedia('video', { available: false });
    const player = mount(media);
    expect(player.hasAttribute('no-airplay')).toBe(true);
    player.showAirplayPicker();
    expect(media.remote.prompt).not.toHaveBeenCalled();
  });

  test('a device on the network brings the button back, and the press opens the picker', () => {
    const media = remoteMedia('video', { available: true });
    const player = mount(media);
    expect(player.hasAttribute('no-airplay')).toBe(false);
    player.showAirplayPicker();
    expect(media.remote.prompt).toHaveBeenCalled();
  });

  test('the last device leaving the network takes the button with it', () => {
    const media = remoteMedia('video', { available: true });
    const player = mount(media);
    // The callback the element handed over is the platform's to call again.
    media.remote.watchAvailability.mock.calls[0][0](false);
    expect(player.hasAttribute('no-airplay')).toBe(true);
  });

  test('a browser with no Remote Playback API keeps the button hidden rather than dead', () => {
    const player = mount(fakeMedia('video'));
    expect(player.hasAttribute('no-airplay')).toBe(true);
    expect(() => player.showAirplayPicker()).not.toThrow();
  });

  test('an audio player is offered the route too, unlike the window and the fullscreen', () => {
    const media = remoteMedia('audio', { available: true });
    const player = mount(media);
    expect(player.hasAttribute('no-airplay')).toBe(false);
    player.showAirplayPicker();
    expect(media.remote.prompt).toHaveBeenCalled();
  });

  test('the author saying disableRemotePlayback is the button going, not the watch failing quietly', async () => {
    const media = remoteMedia('video', { watch: 'InvalidStateError' });
    const player = mount(media);
    await Promise.resolve();
    await Promise.resolve();
    expect(player.hasAttribute('no-airplay')).toBe(true);
  });

  test('a browser that cannot watch continuously keeps the button, because its picker still opens', async () => {
    const media = remoteMedia('video', { watch: 'NotSupportedError' });
    const player = mount(media);
    await Promise.resolve();
    await Promise.resolve();
    expect(player.hasAttribute('no-airplay')).toBe(false);
    player.showAirplayPicker();
    expect(media.remote.prompt).toHaveBeenCalled();
  });

  test('the attribute follows the route rather than the press', () => {
    const media = remoteMedia('video', { available: true });
    const player = mount(media);
    player.showAirplayPicker();
    // The picker is up; nothing is playing anywhere else until the platform says so, which
    // is also how a device picked outside this page arrives.
    expect(player.hasAttribute('is-airplay')).toBe(false);

    media.remote.announce('connected');
    expect(player.hasAttribute('is-airplay')).toBe(true);

    media.remote.announce('disconnected');
    expect(player.hasAttribute('is-airplay')).toBe(false);
  });

  test('connecting is not yet connected', () => {
    const media = remoteMedia('video', { available: true });
    const player = mount(media);
    media.remote.state = 'connecting';
    media.remote.dispatchEvent(new Event('connect'));
    expect(player.hasAttribute('is-airplay')).toBe(false);
  });

  test('a picker someone closed without choosing is not a failure and says nothing', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const media = remoteMedia('video', { available: true });
    media.remote.prompt = () => Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' }));
    mount(media).showAirplayPicker();

    await Promise.resolve();
    await Promise.resolve();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  test('a refusal that is not a dismissal warns rather than going quiet', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const media = remoteMedia('video', { available: true });
    media.remote.prompt = () => Promise.reject(Object.assign(new Error('no user gesture'), { name: 'InvalidAccessError' }));
    mount(media).showAirplayPicker();

    await Promise.resolve();
    await Promise.resolve();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('remote playback was refused'), 'no user gesture');
    warn.mockRestore();
  });

  test('a player taken off the page stops watching the network', async () => {
    const media = remoteMedia('video', { available: true });
    const player = mount(media);
    await Promise.resolve();
    player.remove();
    expect(media.remote.cancelWatchAvailability).toHaveBeenCalledWith(7);
    // The route is nobody's to report once the listeners are off.
    media.remote.announce('connected');
    expect(player.hasAttribute('is-airplay')).toBe(false);
  });

  test('a watch whose id lands after the player left is cancelled rather than leaked', async () => {
    const media = remoteMedia('video', { available: true });
    const player = mount(media);
    player.remove();
    // The id resolves a task later than the callback did — after the disconnect, here.
    await Promise.resolve();
    await Promise.resolve();
    expect(media.remote.cancelWatchAvailability).toHaveBeenCalledWith(7);
  });

  test('a press announces itself the way the other controls do', () => {
    const media = remoteMedia('video', { available: true });
    const player = mount(media);
    const seen = [];
    player.addEventListener('media-player-interaction', (event) => seen.push(event.detail.type));
    player.showAirplayPicker();
    expect(seen).toEqual(['airplay']);
  });
});

describe('the focus the overlay takes with it', () => {
  /**
   * A video player whose overlay holds focus, the way pressing it to play leaves it.
   *
   * jsdom applies none of `index.scss`, so the `display: none` that drops focus in a browser
   * never happens here. What is asserted is the half this element owns: focus is moved off the
   * overlay before the attribute that hides it is written.
   */
  function overlaid({ focusable = true } = {}) {
    const player = mount(fakeMedia('video'));
    if (focusable) player.setAttribute('tabindex', '-1');
    const overlay = document.createElement('button');
    overlay.className = 'media-player-overlay';
    player.appendChild(overlay);
    overlay.focus();
    return { player, overlay };
  }

  test('playing from the overlay leaves focus on the player, not on the body it would fall to', () => {
    const { player, overlay } = overlaid();
    expect(document.activeElement).toBe(overlay);
    player.onPlay();
    expect(player.hasAttribute('poster-hidden')).toBe(true);
    expect(document.activeElement).toBe(player);
  });

  test('a player the author left unfocusable keeps its hands off, rather than pretending', () => {
    // `focus()` on an element with no `tabindex` is a silent no-op, and a player that acted as
    // though it had worked would be a player reporting a fix it did not make.
    const { player, overlay } = overlaid({ focusable: false });
    player.onPlay();
    expect(player.hasAttribute('poster-hidden')).toBe(true);
    expect(document.activeElement).toBe(overlay);
  });

  test('the focus is caught before the attribute that takes the overlay away, not after', () => {
    // `is-playing` is what the stylesheet hides the overlay on, and a button already
    // `display: none` has dropped its focus to `<body>` — there is nothing left to catch.
    // jsdom applies no stylesheet, so the order is asserted rather than its effect.
    const player = mount(fakeMedia('video'));
    let playingWhenCaught = null;
    const hidePoster = player.hidePoster.bind(player);
    player.hidePoster = () => {
      playingWhenCaught = player.hasAttribute('is-playing');
      hidePoster();
    };
    player.onPlay();
    expect(playingWhenCaught).toBe(false);
  });

  test('a video paused mid-drag is still a video with something to press', () => {
    // The overlay follows `is-playing`, so what a scrub owes it is to leave that alone: the
    // big play button stays over a paused video however far the thumb moves.
    const media = fakeMedia('video');
    const player = mount(media);
    player.scrub({ target: { value: '30' } });
    player.endDrag();
    expect(player.hasAttribute('is-playing')).toBe(false);
  });

  test('focus on a control the poster never covered is left where it is', () => {
    const { player } = overlaid();
    const button = document.createElement('button');
    player.appendChild(button);
    button.focus();
    player.onPlay();
    expect(document.activeElement).toBe(button);
  });
});

describe('keys the markup claims', () => {
  /**
   * A player with one keyed button, wired the way an author would wire it.
   *
   * The `keydown` binding is written here rather than assumed: no `on="keydown:onKeyDown"`
   * in the page means no listener, which is half of what makes the map opt-in.
   */
  function keyed(media = fakeMedia(), key = 'k') {
    const player = mount(media);
    const button = document.createElement('button');
    button.setAttribute('key', key);
    const presses = [];
    button.addEventListener('click', () => presses.push(key));
    player.appendChild(button);
    player.addEventListener('keydown', (event) => player.onKeyDown(event));
    return { player, button, presses };
  }

  function press(node, key, init = {}) {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    node.dispatchEvent(event);
    return event;
  }

  test('a key presses the control that claims it, and nothing claims a key no control names', () => {
    const { player, presses } = keyed();
    press(player, 'k');
    expect(presses).toEqual(['k']);
    press(player, 'q');
    expect(presses).toEqual(['k']); // 'q' is on no button, so it is not the player's key
  });

  test('the key answers however it was typed, capital or not', () => {
    const { player, presses } = keyed();
    press(player, 'K');
    expect(presses).toEqual(['k']);
  });

  test('a claimed key is taken off the page; an unclaimed one is left alone', () => {
    const { player } = keyed();
    expect(press(player, 'k').defaultPrevented).toBe(true);
    expect(press(player, 'q').defaultPrevented).toBe(false);
  });

  test('a key typed into a field belongs to the field, not to the player', () => {
    const { player, presses } = keyed();
    const input = document.createElement('input');
    player.appendChild(input);
    press(input, 'k');
    expect(presses).toEqual([]);
  });

  test('a key typed into a field inside a web component belongs to it too', () => {
    // The press arrives at the document as the component, not as the textarea inside it —
    // shadow retargeting — so a guard reading only the target would take this letter off
    // somebody's comment box. Page-wide is where it matters, which is how this is bound.
    const { player, presses } = keyed();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const field = document.createElement('textarea');
    host.attachShadow({ mode: 'open' }).appendChild(field);
    field.focus();
    const listener = (event) => player.onKeyDown(event);
    document.addEventListener('keydown', listener);
    press(host, 'k');
    document.removeEventListener('keydown', listener);
    expect(presses).toEqual([]);
  });

  test('a slider still answers the player keys: it wants the arrows, not the letters', () => {
    const { player, presses } = keyed();
    const range = document.createElement('input');
    range.type = 'range';
    player.appendChild(range);
    press(range, 'k');
    expect(presses).toEqual(['k']);
  });

  test('an arrow skips when the player itself holds the press', () => {
    const { player, presses } = keyed(fakeMedia(), 'ArrowRight');
    press(player, 'ArrowRight');
    expect(presses).toEqual(['ArrowRight']);
  });

  test('an arrow on a focused slider stays the slider\'s own step, not the skip', () => {
    const { player, presses } = keyed(fakeMedia(), 'ArrowRight');
    const range = document.createElement('input');
    range.type = 'range';
    player.appendChild(range);
    const event = press(range, 'ArrowRight');
    expect(presses).toEqual([]);
    expect(event.defaultPrevented).toBe(false); // left for the platform to spend on the thumb
  });

  test('an arrow inside a radio group walks the group, not the player', () => {
    const { player, presses } = keyed(fakeMedia(), 'ArrowDown');
    const radio = document.createElement('input');
    radio.type = 'radio';
    player.appendChild(radio);
    expect(press(radio, 'ArrowDown').defaultPrevented).toBe(false);
    expect(presses).toEqual([]);
  });

  test('the keys attribute reaches the action no control names — the volume arrows', () => {
    const media = fakeMedia();
    const player = mount(media);
    player.setAttribute('keys', 'ArrowUp:volumeUp;ArrowDown:volumeDown');
    player.addEventListener('keydown', (event) => player.onKeyDown(event));
    media.volume = 0.5;
    expect(press(player, 'ArrowUp').defaultPrevented).toBe(true);
    expect(media.volume).toBeCloseTo(0.6);
    press(player, 'ArrowDown');
    expect(media.volume).toBeCloseTo(0.5);
  });

  test('a control\'s key outranks a keys entry for the same press', () => {
    const { player, presses } = keyed(fakeMedia(), 'ArrowUp');
    player.setAttribute('keys', 'ArrowUp:volumeUp');
    const volumeUp = jest.spyOn(player, 'volumeUp');
    press(player, 'ArrowUp');
    expect(presses).toEqual(['ArrowUp']);
    expect(volumeUp).not.toHaveBeenCalled();
    volumeUp.mockRestore();
  });

  test('a keys arrow on a focused slider is still the slider\'s', () => {
    const media = fakeMedia();
    const player = mount(media);
    player.setAttribute('keys', 'ArrowUp:volumeUp');
    player.addEventListener('keydown', (event) => player.onKeyDown(event));
    const range = document.createElement('input');
    range.type = 'range';
    player.appendChild(range);
    media.volume = 0.5;
    expect(press(range, 'ArrowUp').defaultPrevented).toBe(false);
    expect(media.volume).toBe(0.5);
  });

  test('a keys entry naming no method warns and leaves the press with the page', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const player = mount(fakeMedia());
    player.setAttribute('keys', 'x:togglePlai');
    player.addEventListener('keydown', (event) => player.onKeyDown(event));
    expect(press(player, 'x').defaultPrevented).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('togglePlai'));
    warn.mockRestore();
  });

  test('Space belongs to the focused button, the one control that already answers it', () => {
    // The split YouTube documents and every pair of hands expects: Space pauses when the
    // player has focus, and presses the button when a button has it. Claimed off the focused
    // button, a control row would be a row where Space does the same thing everywhere.
    const { player, presses } = keyed(fakeMedia(), ' ');
    const focused = document.createElement('button');
    player.appendChild(focused);
    const event = press(focused, ' ');
    expect(presses).toEqual([]);
    expect(event.defaultPrevented).toBe(false); // left for the platform to spend on the button
  });

  test('Space belongs to a focused checkbox too, which answers no other key', () => {
    const { player, presses } = keyed(fakeMedia(), ' ');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    player.appendChild(checkbox);
    expect(press(checkbox, ' ').defaultPrevented).toBe(false);
    expect(presses).toEqual([]);
  });

  test('Enter belongs to a focused link the same way Space belongs to a button', () => {
    const { player, presses } = keyed(fakeMedia(), 'Enter');
    const link = document.createElement('a');
    link.href = '#transcript';
    player.appendChild(link);
    expect(press(link, 'Enter').defaultPrevented).toBe(false);
    expect(presses).toEqual([]);
  });

  test('a letter pressed on a focused button is still the player\'s', () => {
    // The two activation keys are what a focused control owns, not every key pressed over
    // one — a row of buttons is where a reader's focus sits, so claiming nothing there would
    // leave the keys working only on the way to the first press.
    const { player, presses } = keyed();
    const focused = document.createElement('button');
    player.appendChild(focused);
    press(focused, 'k');
    expect(presses).toEqual(['k']);
  });

  test('Space reaches the player when what holds focus does not answer it', () => {
    const { player, presses } = keyed(fakeMedia(), ' ');
    const range = document.createElement('input');
    range.type = 'range';
    player.appendChild(range);
    press(range, ' ');
    expect(presses).toEqual([' ']);
  });

  test('a modified press belongs to the browser', () => {
    const { player, presses } = keyed();
    press(player, 'k', { ctrlKey: true });
    press(player, 'k', { metaKey: true });
    press(player, 'k', { altKey: true });
    expect(presses).toEqual([]);
  });

  test('a disabled control ignores its key, and the press stays the page\'s', () => {
    const { player, button, presses } = keyed();
    button.disabled = true;
    const event = press(player, 'k');
    expect(presses).toEqual([]);
    // Claimed and spent on nothing would still have stopped the page scrolling on a
    // `key=" "` before `is-ready`.
    expect(event.defaultPrevented).toBe(false);
  });

  test('a control inside a disabled fieldset ignores its key the same way', () => {
    // `button.disabled` reads false there — only `:disabled` knows the ancestor — and
    // `click()` on an actually-disabled control is a spec no-op, so claiming the press
    // would spend it on nothing.
    const { player, button, presses } = keyed();
    const fence = document.createElement('fieldset');
    fence.disabled = true;
    player.appendChild(fence);
    fence.appendChild(button);
    const event = press(player, 'k');
    expect(presses).toEqual([]);
    expect(event.defaultPrevented).toBe(false);
  });

  test('a disabled attribute on a keyed non-form control is honoured too', () => {
    // The readiness gate strips `[disabled]` from any element, form control or not — the
    // attribute is the author's "not yet" marker even where the platform gives the element
    // no disabled state of its own, so a press must not click through it.
    const { player, presses } = keyed();
    const chip = document.createElement('span');
    chip.setAttribute('role', 'button');
    chip.setAttribute('key', 'j');
    chip.setAttribute('disabled', '');
    let clicked = 0;
    chip.addEventListener('click', () => { clicked += 1; });
    player.appendChild(chip);
    const event = press(player, 'j');
    expect(clicked).toBe(0);
    expect(event.defaultPrevented).toBe(false);
    expect(presses).toEqual([]);
  });

  test('a disabled control still outranks a keys entry, so one press stays one action', () => {
    const { player, button, presses } = keyed(fakeMedia(), 'ArrowUp');
    button.disabled = true;
    player.setAttribute('keys', 'ArrowUp:volumeUp');
    const volumeUp = jest.spyOn(player, 'volumeUp');
    press(player, 'ArrowUp');
    expect(presses).toEqual([]);
    expect(volumeUp).not.toHaveBeenCalled();
    volumeUp.mockRestore();
  });

  test('a key outside the player never reaches it', () => {
    const { presses } = keyed();
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    press(outside, 'k');
    expect(presses).toEqual([]);
  });

  test('bound page-wide, a press from anywhere still finds the control', () => {
    // What `on="keydown@document:onKeyDown"` relies on: hydrargyri puts the listener on the
    // document and the handler stays this element's, so the press it hands over has a target
    // outside the player and the lookup has to work from it all the same.
    const { player, presses } = keyed();
    const elsewhere = document.createElement('button');
    document.body.appendChild(elsewhere);
    // Taken off again by hand: `document` outlives the `innerHTML` reset between tests, and
    // a listener left on it would answer presses in every test that follows this one.
    const listener = (event) => player.onKeyDown(event);
    document.addEventListener('keydown', listener);
    press(elsewhere, 'k');
    document.removeEventListener('keydown', listener);
    expect(presses).toEqual(['k']);
  });

  test('a key aimed at a disabled control still wakes a faded video row', () => {
    // The press is declined, not claimed — but a viewer who pressed something deserves to
    // see the greyed control that ignored them, the way the old fall-through path did.
    jest.useFakeTimers();
    const { player, button } = keyed(fakeMedia('video', { paused: false }));
    button.disabled = true;
    jest.advanceTimersByTime(CONTROLS_LINGER);
    expect(player.hasAttribute('controls-shown')).toBe(false);
    const event = press(player, 'k');
    expect(player.hasAttribute('controls-shown')).toBe(true);
    expect(event.defaultPrevented).toBe(false);
    jest.useRealTimers();
  });

  test('a key brings a faded video row back, the way moving the pointer does', () => {
    jest.useFakeTimers();
    const { player } = keyed(fakeMedia('video', { paused: false }));
    jest.advanceTimersByTime(CONTROLS_LINGER);
    expect(player.hasAttribute('controls-shown')).toBe(false);
    press(player, 'k');
    expect(player.hasAttribute('controls-shown')).toBe(true);
    jest.useRealTimers();
  });
});

describe('load failure', () => {
  test('a media error fails loud: is-error set, native controls handed back, a warning named', () => {
    // Readiness never arrives to show the custom row and the upgrade already took
    // `controls` off — without this a 404 is a black box: no controls of either kind, no
    // attribute, no message.
    const media = fakeMedia('audio', { duration: NaN });
    Object.defineProperty(media, 'error', { value: { code: 4, message: 'no supported source' }, configurable: true });
    const player = mount(media);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    media.dispatchEvent(new Event('error'));
    expect(player.hasAttribute('is-error')).toBe(true);
    expect(media.controls).toBe(true);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test('a source fixed after an error clears the hook and reclaims the controls', () => {
    const media = fakeMedia('audio', { duration: NaN });
    Object.defineProperty(media, 'error', { value: { code: 4, message: 'gone' }, configurable: true });
    const player = mount(media);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    media.dispatchEvent(new Event('error'));
    warn.mockRestore();
    expect(player.hasAttribute('is-error')).toBe(true);

    Object.defineProperty(media, 'duration', { get: () => 120, configurable: true });
    Object.defineProperty(media, 'error', { value: null, configurable: true });
    media.dispatchEvent(new Event('canplay'));
    expect(player.hasAttribute('is-error')).toBe(false);
    expect(media.controls).toBe(false);
  });
});

describe('interaction events', () => {
  test('a press says what it was and what it did, on the element rather than on the document', () => {
    const media = fakeMedia();
    const player = mount(media);
    const seen = [];
    player.addEventListener('media-player-interaction', (e) => seen.push(e.detail));
    player.skipForward();
    expect(seen).toEqual([{ type: 'skip-forward', value: 10 }]);
  });
});

describe('the keys attribute grammar', () => {
  test('pairs split on the semicolon and survive the spaces an author writes', () => {
    expect(keyedMethod('ArrowUp:volumeUp; ArrowDown:volumeDown', 'arrowdown')).toBe('volumeDown');
  });

  test('an all-whitespace key half is the space key, which an attribute can write no other way', () => {
    expect(keyedMethod(' :togglePlay', ' ')).toBe('togglePlay');
  });

  test('a key that is itself a colon still parses, from the last colon in the pair', () => {
    expect(keyedMethod('::toggleMute', ':')).toBe('toggleMute');
  });

  test('an empty attribute, a bare key and a pair with no method all name nothing', () => {
    expect(keyedMethod('', 'k')).toBe(null);
    expect(keyedMethod('k', 'k')).toBe(null);
    expect(keyedMethod('k:', 'k')).toBe(null);
  });
});

test('the class is exported and defined under its tag', () => {
  expect(customElements.get('media-player')).toBe(MediaPlayer);
});

test('importing the player defines every element its samples are written with', () => {
  // Each of these is one `import` at the top of the module and nothing else refers to it, so
  // dropping one breaks no test and throws no error — it leaves an undefined tag in the
  // page, which looks like a styling bug rather than a missing script.
  const missing = ['slider-elemental', 'progress-elemental', 'toolbar-elemental', 'tooltip-elemental']
    .filter((tag) => !customElements.get(tag));
  expect(missing).toEqual([]);
});

test('every package the element imports at runtime is declared as a peer, not a dependency', async () => {
  // Both of these claim globals a page has only one of — `customElements` for the elemental
  // tags, hydrargyri's own register of which tags are hydrargyri's — so a second copy is a
  // bug rather than wasted bytes, and `dependencies` is what lets an installer nest one
  // silently. Nothing fails when it regresses: `npm install --save` writes the wrong stanza,
  // the build still bundles, and the break only shows on somebody else's page. The walk is
  // over bare specifiers, so a new runtime import declared nowhere fails here too.
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../src/scripts/media-player.js', import.meta.url), 'utf8');
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const bare = [...source.matchAll(/^import\s(?:.*?\sfrom\s)?'([^.'][^']*)';$/gm)]
    .map(([, spec]) => (spec.startsWith('@') ? spec.split('/').slice(0, 2) : [spec.split('/')[0]]).join('/'));
  expect([...new Set(bare)].sort()).toEqual(['book-of-elementals', 'hydrargyri']);
  expect(pkg.dependencies).toBeUndefined();
  expect([...new Set(bare)].filter((name) => !pkg.peerDependencies?.[name])).toEqual([]);
});

test('the structure bundle carries a sheet for every elemental the module imports', async () => {
  // The bundle is the one file a page with no build step links, and nothing it contains is
  // exercised by any other test: the docs page compiles its own stylesheet, so a fifth
  // elemental imported here and forgotten in `bundle.scss` ships an unstyled control to
  // exactly the authors who took the shortest install, with the build and this suite green.
  // Equality both ways — a sheet left behind for an element nothing defines is dead CSS in
  // a file whose whole argument is its size.
  const { readFile } = await import('node:fs/promises');
  const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
  const imported = [...(await read('../src/scripts/media-player.js')).matchAll(/^import 'book-of-elementals\/([a-z-]+)';$/gm)];
  const bundled = [...(await read('../src/styles/bundle.scss')).matchAll(/^@use "book-of-elementals\/src\/elementals\/([a-z-]+)\/index"/gm)];
  expect(imported.map((m) => m[1]).sort()).not.toEqual([]);
  expect(bundled.map((m) => m[1]).sort()).toEqual(imported.map((m) => m[1]).sort());
});

test('every name the manifest publishes as public API is still a method on the element', async () => {
  // A rename here fails nothing on its own: the old name stays in the allow-list, the
  // renamed method matches nothing, and it silently turns private — dropping out of every
  // editor that reads the manifest, with the build still green.
  const { PUBLIC } = await import('../custom-elements-manifest.config.mjs');
  const missing = [...PUBLIC].filter((name) => typeof MediaPlayer.prototype[name] !== 'function');
  expect(missing).toEqual([]);
});

test('every handler the manual names — through on=, data-on= or keys= — is in the manifest\'s public list', async () => {
  // The other direction of the test above, and the one that catches the other silence: a
  // handler newly written into a sample but forgotten in PUBLIC ships marked private —
  // out of every editor that reads the manifest — while the allow-list walk stays green,
  // which is how `goLive` shipped private in 1.1.0. The walk speaks each attribute's own
  // grammar: hydrargyri reads `data-on` as a full alias of `on` and splits a pair at its
  // FIRST colon, while `keys` splits at its LAST so a key that is itself a colon parses —
  // a scraper with one grammar of its own would go green over markup that does not work.
  // Single quotes count too, and so does an attribute quoted inside a prose code span.
  const { readFile } = await import('node:fs/promises');
  const page = await readFile(new URL('../src/markup/index.md', import.meta.url), 'utf8');
  const named = new Set();
  for (const [, attr, doubled, singled] of page.matchAll(/[\s`](on|data-on|keys)=(?:"([^"]*)"|'([^']*)')/g)) {
    for (const pair of (doubled ?? singled).split(';')) {
      const entry = pair.trim();
      const at = attr === 'keys' ? entry.lastIndexOf(':') : entry.indexOf(':');
      if (at === -1) continue;
      const method = entry.slice(at + 1).trim();
      if (method) named.add(method);
    }
  }
  expect(named.size).toBeGreaterThan(0);
  const { PUBLIC } = await import('../custom-elements-manifest.config.mjs');
  const missing = [...named].filter((name) => !PUBLIC.has(name));
  expect(missing).toEqual([]);
});

test('every attribute the manual writes on a <media-player> tag is one the Options panel offers', async () => {
  // The AUTHORED allow-list has the same failure mode PUBLIC had: an attribute forgotten
  // there falls through to the hidden marking meant for the CSS hooks and silently
  // vanishes from the Options panel — how `keys` vanished in 1.1.0. Globals and
  // hydrargyri's wiring attributes are the page's business, not the panel's. A tag inside
  // a prose code span is skipped — unlike the handler walk above — because the one the
  // manual writes there is the refused `<media-player src>`, a counter-example rather
  // than a promise.
  const { readFile } = await import('node:fs/promises');
  const page = await readFile(new URL('../src/markup/index.md', import.meta.url), 'utf8');
  const globals = new Set(['tabindex', 'role', 'class', 'style', 'id', 'on', 'data-on', 'bind']);
  const written = new Set();
  for (const [, tag] of page.matchAll(/(?<!`)<media-player\b([^>]*)>/g)) {
    for (const [, name] of tag.matchAll(/\s([a-z-]+)=/g)) {
      if (!globals.has(name) && !name.startsWith('aria-')) written.add(name);
    }
  }
  expect(written.size).toBeGreaterThan(0);
  const { AUTHORED } = await import('../custom-elements-manifest.config.mjs');
  const missing = [...written].filter((name) => !AUTHORED.has(name));
  expect(missing).toEqual([]);
});
