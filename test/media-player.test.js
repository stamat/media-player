/**
 * What the player guarantees, and what is left to a browser.
 *
 * Covered here: the progressive-enhancement contract (native controls off on upgrade, back
 * on the way out), readiness from any of the five metadata events, live streams, the volume
 * arithmetic and its persistence, and the labels the buttons announce themselves by.
 *
 * Deliberately not covered: fullscreen and `cuechange`, neither of which jsdom implements —
 * `requestFullscreen` is absent and a `<track>` never fires a cue, so a test here would only
 * assert that the stub was called. The animation-frame clock is not covered either: what it
 * guarantees is smoothness, and a test of `requestAnimationFrame` under fake timers proves
 * the timer works rather than that the thumb moves. Both want a browser.
 */

import { jest } from '@jest/globals';
import { MediaPlayer, formatTime, clampVolume, volumeState, LIVE_DURATION } from '../src/scripts/media-player.js';

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

test('the class is exported and defined under its tag', () => {
  expect(customElements.get('media-player')).toBe(MediaPlayer);
});
