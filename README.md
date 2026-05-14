# Dice Roller

A client-side PWA dice roller with 3D animated dice (three.js + cannon-es), dice-notation parsing, roll history, and offline support.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run test       # parser + roller unit tests
npm run build      # production build into dist/
npm run preview    # preview prod build
```

## Notation

| Token | Example | Meaning |
|---|---|---|
| `XdY` | `3d6` | Roll X dice with Y sides |
| `+N` / `-N` | `1d20+5` | Flat modifier |
| `khN` / `klN` | `2d20kh1` | Keep highest / lowest N |
| `dhN` / `dlN` | `4d6dl1` | Drop highest / lowest N |
| `!` | `1d6!` | Exploding dice |
| `r<N` / `r>N` / `r=N` | `1d10r<2` | Reroll once |

Multiple groups sum: `2d8+1d6+3`. Supported sides: 4, 6, 8, 10, 12, 20, 100.

## Scope notes

Core spec covered: parser + roller (crypto RNG, tested), three.js + cannon-es scene, Dexie history, Zustand store, settings, PWA manifest + SW, presets, accessibility hooks (aria-live, reduced-motion, 44px targets).

Stubs / known gaps:
- Sound effects — toggle present, no audio bundled.
- Sync backend — types ready, no API client.
- Per-shape die meshes — all dice render as cubes with the rolled value pinned to the top face after settling. Drop-in: extend `DiceScene.makeDie` / `facesForDie`.
- PNG icons — drop 192/512/1024 PNGs in `public/icons/`.
