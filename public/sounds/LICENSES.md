# Local sound asset provenance and licensing

All files below are original, procedural audio generated locally for Pomokitty with
FFmpeg 9.0.1's built-in `lavfi` sources. No third-party recordings, samples, or
source files were used. Pomokitty contributors dedicate these generated assets to
the public domain under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

| File | Creation method / source | License | Creator credit | Retrieval date |
| --- | --- | --- | --- | --- |
| `rain.mp3` | FFmpeg `anoisesrc` (pink noise), filtered and encoded as MP3. Exact command: `ffmpeg -f lavfi -i "anoisesrc=color=pink:sample_rate=44100:amplitude=0.20" -t 8 -af "lowpass=f=8000,volume=0.55" -c:a libmp3lame -b:a 96k rain.mp3` | CC0 1.0 Universal | Pomokitty contributors | 2026-10-11 |
| `white-noise.mp3` | FFmpeg `anoisesrc` (white noise), volume adjusted and encoded as MP3. Exact command: `ffmpeg -f lavfi -i "anoisesrc=color=white:sample_rate=44100:amplitude=0.18" -t 8 -af "volume=0.42" -c:a libmp3lame -b:a 96k white-noise.mp3` | CC0 1.0 Universal | Pomokitty contributors | 2026-10-11 |

The `Retrieval date` column records the local asset-creation date because these assets
were not retrieved from an external source.
