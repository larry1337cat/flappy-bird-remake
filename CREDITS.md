# Credits

## Original assets

Sprite assets (bird frames, pipes, land, sky, scoreboard) are sourced from:

**Flappy-Bird-Game** by Son Nguyen Hoang
https://github.com/hoangsonww/Flappy-Bird-Game
Licensed under the MIT License (see `LICENSE`).

That repository is a native iOS/SpriteKit (Swift) implementation of Flappy
Bird, the original game by Dong Nguyen (.Gears, 2013). This project reuses
its image assets but is a full rewrite from scratch in vanilla JavaScript +
Canvas — no Swift/SpriteKit code was ported. On top of that rewrite, this
project adds:

- Three difficulty modes (Easy / Normal / Hard) with separate saved high
  scores per mode
- Score-based difficulty ramp — pipe speed, gap, and oscillation all scale
  with score
- Hard mode: side wind gusts that drift the bird, telegraphed ~300ms in
  advance with a fading warning arrow before the force actually hits
- Hard mode: occasional narrow-pipe spawns as a deliberate spike in
  difficulty rather than a steady grind
- Medal system (Bronze / Silver / Gold / Platinum), drawn entirely on
  canvas — no medal image asset exists
- Haptic feedback on collisions, gusts, and new records (Vibration API,
  degrades silently where unsupported)
- Vietnamese / English UI with a language toggle, and a mute toggle,
  both persisted
- Save-data migration, so older save files keep working after updates
- Installable PWA: manifest, service worker, offline caching, app icons
  generated from the existing bird sprite
- Unit tests for the difficulty curve and medal thresholds

## Fonts

**Poppins** (Bold, Medium weights) by Indian Type Foundry, distributed via
Google Fonts.
Licensed under the SIL Open Font License 1.1 — see
`assets/fonts/FONT-LICENSE.txt` and https://openfontlicense.org.

## Sound

All sound effects are synthesized at runtime with the Web Audio API
(`src/sound.js`) — no external audio files are used.
