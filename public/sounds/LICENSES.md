# Local sound asset provenance and licensing

The background tracks in this directory were downloaded on 2026-10-12 from the
sources listed below. The completion chime is an original procedural asset. All are
included as local assets for offline playback.

| File | Source / item | License | Creator credit | Retrieval date |
| --- | --- | --- | --- | --- |
| `brown-noise.opus` | [FreeSoundsLibrary — Brown Noise Sound](https://www.freesoundslibrary.com/brown-noise-sound/) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Spanac / FreeSoundsLibrary | 2026-10-12 |
| `forest-rain.opus` | [Mixkit — Forest rain loop](https://mixkit.co/free-sound-effects/rain/) | [Mixkit License](https://mixkit.co/license/#sfxFree) | Mixkit contributor | 2026-10-12 |
| `ocean.opus` | [Mixkit — Sea waves loop](https://mixkit.co/free-sound-effects/ocean) | [Mixkit License](https://mixkit.co/license/#sfxFree) | Mixkit contributor | 2026-10-12 |
| `night-forest.opus` | [Mixkit — Night forest with insects](https://mixkit.co/free-sound-effects/night/) | [Mixkit License](https://mixkit.co/license/#sfxFree) | Mixkit contributor | 2026-10-12 |
| `ding.mp3` | Original procedural dual-tone chime, generated with FFmpeg `aevalsrc` | CC0 1.0 Universal | Pomokitty contributors | 2026-10-12 |

The four ambient tracks were re-encoded to gapless-capable Opus and have a 0.5-second
crossfade baked into each loop seam. They are fully preloaded before playback so browser
looping does not need to fetch or decode at the boundary. `night-forest.opus` also has its
silent lead-in and tail removed. `brown-noise.opus` requires the CC BY 4.0 attribution above
wherever Pomokitty publishes third-party notices. The distant-thunder candidate was not included.
