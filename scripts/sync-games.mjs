// Copies the web games into play/ so the site can host them.
// Run it after rebuilding a game. Only listed files are copied, so private notes stay behind.
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const REPOS = join(homedir(), "source", "repos");
const GAMES = {
  "fab-run": { from: join(REPOS, "fab-run"), files: { "index.html": "index.html", "style.css": "style.css", "game.js": "game.js", "content.js": "content.js" } },
};

rmSync("play", { recursive: true, force: true });
for (const [name, game] of Object.entries(GAMES)) {
  const out = join("play", name);
  mkdirSync(out, { recursive: true });
  for (const [source, target] of Object.entries(game.files)) copyFileSync(join(game.from, source), join(out, target));
  console.log(`Copied ${name} into ${out}`);
}
