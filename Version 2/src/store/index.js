const path = require("path");
const { createJsonStore } = require("./json-store");
const { createHybridStore } = require("./hybrid-store");

function normalizeProvider(value) {
  return String(value || "").trim().toLowerCase();
}

function resolveDataRoot(rootDir) {
  const folderName = String(process.env.DATA_ROOT || ".").trim() || ".";
  return path.join(rootDir, folderName);
}

function createStore(rootDir) {
  const provider = normalizeProvider(process.env.STORE_PROVIDER || process.env.DB_PROVIDER || "json");
  const dataRoot = resolveDataRoot(rootDir);

  if (provider === "hybrid") {
    return createHybridStore({ rootDir, dataRoot });
  }

  if (["sqlserver", "sql", "mssql"].includes(provider)) {
    const { createSqlServerStore } = require("./sqlserver-store");
    return createSqlServerStore();
  }

  return createJsonStore({ dbPath: path.join(dataRoot, "db.json") });
}

module.exports = { createStore };
