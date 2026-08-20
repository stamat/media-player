/**
 * What the player guarantees, and what is left to a browser.
 *
 * Covered here: the progressive-enhancement contract (native controls off on upgrade, back
 * on the way out), the wiring the element declares itself (`static wires`, so the media
 * element needs no `on=`), readiness from any of the five metadata events, live streams, the volume
 * arithmetic and its persistence, captions toggling and its persistence around a stubbed
 * track, the video controls' hide timer, the labels the buttons announce themselves by, the
 * keys a control claims and the presses that are somebody else's, the OS media panel against
 * a stubbed `navigator.mediaSession`, the slider fills caught up through slider-elemental's
 * own `apply()` after scripted writes, and that the surface the custom elements manifest
 * publishes still exists on the element.
 *
 * Deliberately not covered: fullscreen and the `cuechange` event, neither of which jsdom
 * implements — `requestFullscreen` is absent and a `<track>` never fires a cue, so a test
 * here would only assert that the stub was called. The animation-frame clock is not covered
 * either: what it guarantees is smoothness, and a test of `requestAnimationFrame` under
 * fake timers proves the timer works rather than that the thumb moves. All three want a
 * browser.
 */

import { jest } from '@jest/globals';
import { MediaPlayer, formatTime, clampVolume, volumeState, keyedMethod, LIVE_DURATION, CONTROLS_LINGER, VOLUME_SETTLE } from '../src/scripts/media-player.js';

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
  Object.defineProperties(media, {
    duration: { get: () => duration, configurable: true },
    readyState: { get: () => 1, configurable: true },
    paused: { get: () => paused, configurable: true },
    currentTime: { get: () => currentTime, set: (v) => { currentTime = v; }, configurable: true },
    volume: { get: () => volume, set: (v) => { volume = v; }, configurable: true },
    muted: { get: () => muted, set: (v) => { muted = v; }, configurable: true },
    buffered: { get: () => ({ length: 0 }), configurable: true }
  });
  media.play = () => { paused = false; };
  media.pause = () => { paused = true; };
  return media;
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
    // Where the last animation frame left it: a fraction short, and floored to a whole
    // second by the scrubber, so the thumb would stop one step from the end.
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

describe('the scrubber drawing one position rather than two', () => {
  test('the thumb and the played bar are handed the same whole second, so they cannot disagree on screen', () => {
    const player = mount(fakeMedia());
    const floor = MediaPlayer.formatters.floor;
    // A range with step="1" snaps an assignment to the NEAREST step: unfloored, 3.6 is a
    // thumb at 4 beside a bar at 3.6, a whole step apart.
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

describe('the slider fills follow scripted writes', () => {
  // A value written into a range input from script fires no event, so slider-elemental
  // cannot see it on its own — the player calls the slider's public apply() after every
  // write. These mount a real slider-elemental, which jsdom runs fine: apply() reads the
  // inputs and writes custom properties, no layout involved.
  function scrubberSlider() {
    const slider = document.createElement('slider-elemental');
    slider.className = 'media-player-scrubber';
    slider.innerHTML =
      '<input type="range" min="0" step="1" value="0" aria-label="Seek" bind="duration:attr#max|floor;currentTime:prop#value|floor" />';
    return slider;
  }

  test('a seek from script drags the fill with the thumb, though the input fires no event for it', () => {
    const media = fakeMedia('audio', { duration: 120 });
    const player = document.createElement('media-player');
    player.appendChild(media);
    const slider = scrubberSlider();
    player.appendChild(slider);
    document.body.appendChild(player);

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
 * so the TextTrack half is a plain object holding the one field the player writes.
 */
function fakeTrack() {
  const track = document.createElement('track');
  Object.defineProperty(track, 'track', { value: { mode: 'disabled' }, configurable: true });
  return track;
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

  test('a disabled control ignores its key, the same way it ignores a click', () => {
    const { player, button, presses } = keyed();
    button.disabled = true;
    press(player, 'k');
    expect(presses).toEqual([]);
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

test('every name the manifest publishes as public API is still a method on the element', async () => {
  // A rename here fails nothing on its own: the old name stays in the allow-list, the
  // renamed method matches nothing, and it silently turns private — dropping out of every
  // editor that reads the manifest, with the build still green.
  const { PUBLIC } = await import('../custom-elements-manifest.config.mjs');
  const missing = [...PUBLIC].filter((name) => typeof MediaPlayer.prototype[name] !== 'function');
  expect(missing).toEqual([]);
});
