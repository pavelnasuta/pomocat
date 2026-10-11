# Local sound asset provenance and licensing

All files below are original, procedural audio generated locally for Pomokitty with
FFmpeg 9.0.1's built-in `lavfi` sources. No third-party recordings, samples, or
source files were used. Pomokitty contributors dedicate these generated assets to
the public domain under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

| File | Creation method / source | License | Creator credit | Retrieval date |
| --- | --- | --- | --- | --- |
| `rain.mp3` | FFmpeg `anoisesrc` (pink noise), filtered and encoded as MP3. Exact command: `ffmpeg -f lavfi -i "anoisesrc=color=pink:sample_rate=44100:amplitude=0.20" -t 8 -af "lowpass=f=8000,volume=0.55" -c:a libmp3lame -b:a 96k rain.mp3` | CC0 1.0 Universal | Pomokitty contributors | 2026-10-11 |
| `forest.mp3` | FFmpeg `anoisesrc` (brown noise), mixed with a procedurally generated low bird-like sine tone and encoded as MP3. Exact command: `ffmpeg -f lavfi -i "anoisesrc=color=brown:sample_rate=44100:amplitude=0.12" -f lavfi -i "sine=frequency=2200:sample_rate=44100" -filter_complex "[0:a]lowpass=f=6000,volume=0.45[wind];[1:a]volume=0.015[bird];[wind][bird]amix=inputs=2:normalize=0" -t 8 -c:a libmp3lame -b:a 96k forest.mp3` | CC0 1.0 Universal | Pomokitty contributors | 2026-10-11 |
| `fireplace.mp3` | FFmpeg `anoisesrc` (brown noise), high-pass filtered to create a procedural crackle-like texture and encoded as MP3. Exact command: `ffmpeg -f lavfi -i "anoisesrc=color=brown:sample_rate=44100:amplitude=0.30" -t 8 -af "highpass=f=900,lowpass=f=5500,volume=0.32" -c:a libmp3lame -b:a 96k fireplace.mp3` | CC0 1.0 Universal | Pomokitty contributors | 2026-10-11 |
| `ocean.mp3` | FFmpeg `anoisesrc` (pink noise), low-pass filtered to create a procedural surf-like texture and encoded as MP3. Exact command: `ffmpeg -f lavfi -i "anoisesrc=color=pink:sample_rate=44100:amplitude=0.28" -t 8 -af "lowpass=f=1800,volume=0.50" -c:a libmp3lame -b:a 96k ocean.mp3` | CC0 1.0 Universal | Pomokitty contributors | 2026-10-11 |
| `white-noise.mp3` | FFmpeg `anoisesrc` (white noise), volume adjusted and encoded as MP3. Exact command: `ffmpeg -f lavfi -i "anoisesrc=color=white:sample_rate=44100:amplitude=0.18" -t 8 -af "volume=0.42" -c:a libmp3lame -b:a 96k white-noise.mp3` | CC0 1.0 Universal | Pomokitty contributors | 2026-10-11 |

The `Retrieval date` column records the local asset-creation date because these assets
were not retrieved from an external source.
