# Audio player

> Source: `@servicenow/aiux-audio-player@6.0.2` · `components/external/audio-player/docs/usage/aiux-audio-player.md`

`<aiux-audio-player>` plays one audio track from `sources` in a pill-shaped
control bar and reports user actions through events. The host supplies URLs
only; playback state is not exposed.

Built in: play/pause, rewind and fast-forward by `jumpTime`, a time display,
a seek scrubber (arrow keys jump by `jumpTime`), a pop-out volume slider,
a playback-speed menu (0.5x, 1x, 1.5x, 2x), and an empty state ("No audio
source available") when `sources` is empty.

## Import

```js
import '@servicenow/aiux-audio-player';
// Optional helpers (see Exported helpers):
import {formatTime, inferAudioType} from '@servicenow/aiux-audio-player';
```

## Usage

### Minimal complete example

```ts
import {html, type PropertyValues} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux-components-core';
import '@servicenow/aiux-audio-player';

@customElement('my-call-recording')
export class MyCallRecording extends AIUXElement {
  @property({type: String}) recordingUrl = '';
  private _sources: string[] = [];

  willUpdate(changed: PropertyValues<this>) {
    // New array only when the URL changes: every new array reloads the track.
    if (changed.has('recordingUrl'))
      this._sources = this.recordingUrl ? [this.recordingUrl] : [];
  }

  render() {
    return html`
      <p class="font-semibold">Call recording</p>
      <aiux-audio-player
        .sources=${this._sources}
        .jumpTime=${10}
      ></aiux-audio-player>
    `;
  }
}
```

**What happens:** with no URL, `[]` shows the empty state. Each `<source>`
gets a `type` inferred from its extension; the browser plays the first one it
supports.

### Additional patterns

Play/pause and scrubber only, with a single-value time display:

```js
html`
  <aiux-audio-player
    .sources=${this._sources}
    .controlsVisibility=${{
      showJumpControls: false,
      showVolume: false,
      showPlaybackRate: false,
      timeCompact: true
    }}
  ></aiux-audio-player>
`;
```

## API

### Properties and attributes

| Property             | Attribute                    | Type                                     | Default                         | Update behavior     | Description                                                                                                                                                                                          |
| -------------------- | ---------------------------- | ---------------------------------------- | ------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sources`            | `sources` (JSON)             | `string[]`                               | `[]`                            | Reloads             | Alternative URLs for the same track. A new array reloads the track: position resets to 0 and playback stops without a `paused` event; volume and speed are kept. Empty shows the empty state.        |
| `autoplay`           | `autoplay`                   | `boolean`                                | `false`                         | On each load        | Starts playback when metadata loads and moves focus to the play/pause button. If the browser blocks autoplay, nothing plays and no event fires.                                                      |
| `muted`              | `muted`                      | `boolean`                                | `false`                         | First load only     | Starts at volume 0. The user can raise it with the volume slider.                                                                                                                                    |
| `loop`               | `loop`                       | `boolean`                                | `false`                         | Updates immediately | Repeats the track; `ended` does not fire while looping.                                                                                                                                              |
| `jumpTime`           | `jumptime`                   | `number` (seconds)                       | `3`                             | Updates immediately | Rewind/fast-forward step, also used by the scrubber's arrow keys and in the buttons' labels.                                                                                                         |
| `controlsVisibility` | `controls-visibility` (JSON) | `Partial<AudioPlayerControlsVisibility>` | all shown, `timeCompact: false` | Updates immediately | Hides optional controls. Unset keys use their defaults. Play/pause, the time display, and the scrubber always render. With `showVolume: false`, the first load starts at full volume instead of 50%. |

Initial volume is 50% and initial speed is 1x; neither can be set.

### Events

All events bubble and are composed, not cancelable. Use the literal names;
they are not exported as constants.

| Event                                     | `detail`             | Fires when                                                     | Notes                                                       |
| ----------------------------------------- | -------------------- | -------------------------------------------------------------- | ----------------------------------------------------------- |
| `aiux-audio-player:played`                | `{}`                 | Playback starts from the play button or `autoplay`.            | Fires after the browser accepts `play()`.                   |
| `aiux-audio-player:paused`                | `{}`                 | The user clicks pause.                                         | Not fired at track end, on `sources` change, or on removal. |
| `aiux-audio-player:ended`                 | `{}`                 | The track reaches its end.                                     | Not fired with `loop`.                                      |
| `aiux-audio-player:rewind`                | `{jumpTime: number}` | The rewind button or ArrowLeft/ArrowDown on the scrubber.      | Fires even at position 0.                                   |
| `aiux-audio-player:fast-forward`          | `{jumpTime: number}` | The fast-forward button or ArrowRight/ArrowUp on the scrubber. | Not fired before the duration is known.                     |
| `aiux-audio-player:time-changed`          | `{time: number}`     | The user releases the scrubber after seeking.                  | `time` in seconds. Not fired during playback or for jumps.  |
| `aiux-audio-player:volume-changed`        | `{volume: number}`   | The user commits a volume slider change.                       | `volume` is 0–1. 0 also mutes.                              |
| `aiux-audio-player:playback-rate-changed` | `{rate: number}`     | The user picks a speed.                                        | `rate` is `0.5`, `1`, `1.5`, or `2`.                        |

### Slots

None.

### Methods

None.

### Exported helpers

| Export           | Signature                                                   | Use                                                                                                    |
| ---------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `formatTime`     | `(seconds: number \| undefined) => string`                  | `m:ss` or `h:mm:ss`; non-finite input gives `0:00`.                                                    |
| `inferAudioType` | `(url: string \| null \| undefined) => string \| undefined` | MIME type for `mp3`, `ogg`, `wav`, `aac`, `flac`, `webm`, `m4a`, `mp4`, `opus`; otherwise `undefined`. |

### Data shapes

```ts
interface AudioPlayerControlsVisibility {
  showJumpControls: boolean; // rewind + fast-forward, default true
  showVolume: boolean; // default true
  showPlaybackRate: boolean; // default true
  timeCompact: boolean; // default false. true: shows duration until playback
  //                       has progressed, then only the current time
}
```

This type is not exported from the package entry.

## Integration details

### SSR

The control bar renders on the server; audio loads and plays in the browser.

### Lifecycle

Removing the element pauses the audio without a `paused` event. If it is
re-attached, the play/pause button still shows the playing state.

### Sizing and layout

- `display: block`; the bar fills its container's width.
- When narrow, the controls scroll horizontally inside the bar; the scrubber
  keeps a 4rem minimum width.

## Accessibility, localization, and customization

- **Accessibility:** the bar is a labeled group ("Audio player"); every button
  has a label and tooltip. Escape closes the volume slider and the
  speed menu and returns focus to their buttons; the speed menu uses
  ArrowUp/ArrowDown and Enter/Space. Provide a visible label for what the
  recording is.
- **Localization:** labels, tooltips, and the empty state are localized.
  Speed labels (`1.5x`) and the time format are not.
- **Customization:** track colors use `--neutral-300` and `--neutral-700`;
  the focus ring uses `--color-border-strong` and `--radius-md`; the bar uses
  the DaisyUI `base-200` background. No parts.
