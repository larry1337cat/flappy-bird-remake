# Flappy Bird Remake

A from-scratch rewrite of Flappy Bird in vanilla JavaScript + Canvas, built as
an installable PWA. Original sprite assets come from
[hoangsonww/Flappy-Bird-Game](https://github.com/hoangsonww/Flappy-Bird-Game)
(MIT); everything else — engine, mechanics, UI, PWA layer, tests — is new.
See `CREDITS.md` for full attribution.

## Features

- **Three difficulty modes** — Easy (fixed speed, static pipes, no
  surprises), Normal (moving pipes, score-based ramp), Hard (adds side wind
  gusts and surprise narrow pipes)
- **Wind gusts (Hard mode)** — random horizontal gusts drift the bird,
  telegraphed ~300ms in advance with a fading warning arrow before the force
  actually applies
- **Narrow-pipe challenge (Hard mode)** — occasional tighter-than-usual gaps
  once the score passes a threshold, marked with a visual cue
- **Medals** — Bronze / Silver / Gold / Platinum, drawn on canvas based on
  score thresholds
- **Per-mode high scores** — Easy/Normal/Hard each keep their own best score
- **Vietnamese / English UI** — toggle in the difficulty menu, persisted
  across sessions
- **Mute toggle** — always-visible speaker icon, persisted preference
- **Haptic feedback** — vibration on collisions, gusts, and new records
  (falls back silently on unsupported devices)
- **Installable PWA** — manifest + service worker precache for offline play
- **Unit tests** — pure-function tests for the difficulty curve and medal
  thresholds using Node's built-in test runner

## Running locally

Because the game loads ES modules and registers a service worker, it needs
to be served over `http://` — opening `index.html` directly as a `file://`
URL will not work in most browsers. Any static file server works, for
example:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed URL (e.g. `http://localhost:8000`) in a browser.

## Project structure

```
index.html      Entry point, loading screen markup
manifest.json    PWA manifest
sw.js            Service worker (offline cache)
style.css        Base styles, @font-face
package.json     Test script only — no build step, no bundler

src/
  main.js        Boot sequence: preload assets/fonts, start game loop, register SW
  game.js        Game class: state machine, update/draw, input routing
  entities.js    Bird and Pipe/PipePool classes
  difficulty.js  Pure computeDifficulty(mode, score) — unit tested
  config.js      Tunable constants, medal thresholds/palette
  i18n.js        VI/EN string tables
  save.js        localStorage read/write + save-schema migration
  sound.js       Web Audio synthesized sound effects + mute state
  haptics.js     Vibration API wrapper
  input.js       Pointer/keyboard input, flap queue
  ui.js          Canvas text/panel/star drawing helpers

assets/
  images/  Sprites (bird, pipes, land, sky, scoreboard)
  icons/   Generated PWA icons
  fonts/   Bundled Poppins font files

tests/
  difficulty.test.js  computeDifficulty() edge cases and clamping
  medal.test.js       medalForScore() threshold boundaries
```

## Testing

```bash
npm test
```

Runs `node --test` against `tests/*.test.js`. No dependencies to install —
it only relies on Node's built-in test runner and `assert/strict`.

## License

MIT — see `LICENSE`. Original asset attribution and third-party font license
in `CREDITS.md`.
