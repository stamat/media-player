/**
 * What the manifest is allowed to call public API.
 *
 * Everything a `on=` attribute in `src/markup/index.md` names is public — that markup is the
 * contract, so a method an author writes in a sample is one they may keep writing. The rest
 * is machinery: it is still in the manifest, marked private, because a tooltip that offers
 * `endDrag` beside `togglePlay` teaches the wrong half of the element.
 */
export const PUBLIC = new Set([
  'play',
  'pause',
  'togglePlay',
  'stop',
  'skipForward',
  'skipBackward',
  'seekBy',
  'seekTo',
  'volumeUp',
  'volumeDown',
  'toggleMute',
  'setVolume',
  'scrub',
  'seek',
  'endScrub',
  'toggleCaptions',
  'toggleFullscreen',
  'showControls',
  'onLoaded',
  'onPlay',
  'onPause',
  'onEnded',
  'onWaiting',
  'onPlaying',
  'onProgress',
  'onVolumeChange',
  'onCue',
  'onFullscreenChange'
]);

export default {
  globs: ['src/scripts/media-player.js'],
  outdir: '.',
  plugins: [
    {
      name: 'media-player-public-surface',
      moduleLinkPhase({ moduleDoc }) {
        for (const declaration of moduleDoc.declarations ?? []) {
          if (!declaration.members) continue;
          for (const member of declaration.members) {
            if (!PUBLIC.has(member.name)) member.privacy = 'private';
          }
        }
      }
    }
  ]
};
