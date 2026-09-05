/* Inlines app/ into two artifacts:
 *   dist/mission-control.html       — standalone page (open it, host it anywhere)
 *   dist/artifact-body.html         — same page minus the document wrapper,
 *                                     which is what the Artifact publisher wants
 * Run: node build.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const css  = read("./app/app.css");
const data = read("./app/data.js");
const app  = read("./app/app.js");
const html = read("./app/index.html");

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Public+Sans:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">`;

// The page body, lifted straight out of index.html so the two never drift.
const body = html.split("<body>")[1].split("<script src=\"data.js\">")[0]
  .replace(/\s*$/, "");

const bundle = `${FONTS}
<style>
${css}
</style>
${body}
<script>
${data}

${app}
</script>
`;

mkdirSync(new URL("./dist/", import.meta.url), { recursive: true });

writeFileSync(new URL("./dist/artifact-body.html", import.meta.url),
  `<title>Mission Control</title>\n${bundle}`);

writeFileSync(new URL("./dist/mission-control.html", import.meta.url),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mission Control</title>
<style>html{color-scheme:light dark}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
${bundle}
</body>
</html>
`);

console.log("built dist/mission-control.html and dist/artifact-body.html");
