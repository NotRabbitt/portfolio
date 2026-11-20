# Portfolio

Study tools and games I build, on one page.

- **Flagship project**: Bluetooth hardware, in design. Details stay private until the first prototype exists.
- **Better Canvas**: a read-only Canvas dashboard that answers one question: what do I do next?
- **Desk**: a desk app that turns your calendar, Canvas and notes into one calm plan for today.
- **Fab Run**: a web game about how a chip gets made, and who makes it. Playable on the site.

Every screenshot and video is recorded on made-up demo data. Feedback is welcome in
[Issues](../../issues).

## How the site is built

It is a static page with no framework. `projects.json` holds every project: pitch, blurb, links, hero media and
theme tokens. `build.mjs` turns it into one page in `dist/`, and the GitHub Pages workflow deploys that folder on
push to `main`.

```bash
node build.mjs
```

`scripts/capture.mjs` records the screenshots and loops with Playwright from each app running on demo data. It never
writes to an app. `scripts/check.mjs` walks the built page at phone and desktop sizes and with reduced motion on; it
needs `dist/` served on port 4872. `scripts/sync-games.mjs` refreshes the hosted copy of Fab Run in `play/`.

## Rights

All rights reserved. This repository is public so the site can be viewed; it is not open source. See
[LICENSE.md](LICENSE.md). The fonts are under the SIL Open Font License, with each license in `fonts/`.
