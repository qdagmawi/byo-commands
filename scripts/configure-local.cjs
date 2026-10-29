const fs = require("node:fs");
const path = require("node:path");
const projectRoot = path.resolve(__dirname, "..");
fs.mkdirSync(path.join(projectRoot, "assets"), { recursive: true });
fs.writeFileSync(path.join(projectRoot, "assets", "local-project.json"), JSON.stringify({ projectRoot }) + "\n");
