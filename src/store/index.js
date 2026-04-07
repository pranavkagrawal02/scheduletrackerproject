const path = require("path");
const { createJsonStore } = require("./json-store");

function createStore(rootDir) {
  if (process.env.SQL_SERVER && process.env.SQL_DATABASE) {
    const { createSqlServerStore } = require("./sqlserver-store");
    return createSqlServerStore();
  }

  return createJsonStore({ dbPath: path.join(rootDir, "db.json") });
}

module.exports = { createStore };
