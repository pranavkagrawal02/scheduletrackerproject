const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const assets = ["index.html", "dashboard.html", "styles.css", "login.js", "dashboard-dynamic.js"];

function copyDirectory(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

fs.mkdirSync(publicDir, { recursive: true });

for (const fileName of assets) {
  fs.copyFileSync(path.join(rootDir, fileName), path.join(publicDir, fileName));
}

copyDirectory(path.join(rootDir, "images"), path.join(publicDir, "images"));

console.log(`Synced ${assets.length} frontend files plus images into ${publicDir}`);
