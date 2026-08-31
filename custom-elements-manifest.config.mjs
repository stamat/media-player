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
  'goLive',
  'volumeUp',
  'volumeDown',
  'toggleMute',
  'setVolume',
  'setRate',
  'beginScrub',
  'scrub',
  'seek',
  'endScrub',
  'preview',
  'endPreview',
  'toggleCaptions',
  'toggleFullscreen',
  'togglePictureInPicture',
  'showAirplayPicker',
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
  'onFullscreenChange',
  'onPipChange',
  'onRateChange',
  'onKeyDown',
  'onMoreToggle'
]);

/**
 * What an author is allowed to type into the opening tag.
 *
 * The other sixteen attributes are CSS hooks the element writes for itself, and a knob is a
 * splice into the sample's source: turning `is-playing` on would put a word in the markup
 * that the next `play` event overwrites, so the panel would be offering a control that
 * cannot hold. They stay in the manifest — a stylesheet needs them documented — and are
 * marked hidden for the options panel on this page only.
 */
export const AUTHORED = new Set([
  'skip',
  'pause-offscreen',
  'media-title',
  'artist',
  'album',
  'artwork',
  'storage-key',
  'keys'
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
    },
    {
      name: 'media-player-authored-attributes',
      moduleLinkPhase({ moduleDoc }) {
        for (const declaration of moduleDoc.declarations ?? []) {
          for (const attribute of declaration.attributes ?? []) {
            if (AUTHORED.has(attribute.name)) continue;
            attribute['x-code-preview'] = { hidden: true };
          }
        }
      }
    }
  ]
};
