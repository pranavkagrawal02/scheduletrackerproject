const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { createStore } = require("./src/store");

const ROOT = __dirname;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(path.join(ROOT, ".env"));

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_ROOT = path.join(ROOT, "public");
const store = createStore(ROOT);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(payload);
}

function serveFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendText(response, 404, "File not found");
      return;
    }

    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
  });
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        request.destroy();
        reject(new Error("Payload too large"));
      }
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON payload"));
      }
    });
    request.on("error", reject);
  });
}

function notFound(response) {
  sendJson(response, 404, { error: "Not found" });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeNumber(value) {
  return Number(value);
}

function getRequestActor(request) {
  const username = normalizeText(request.headers["x-auth-username"]);
  const employeeCode = normalizeText(request.headers["x-auth-employee-code"]);
  return {
    username: username || null,
    employeeCode: employeeCode || null
  };
}

async function handleApi(request, response, pathname) {
  const actor = getRequestActor(request);

  if (request.method === "POST" && pathname === "/api/login") {
    const body = await parseBody(request);
    const username = normalizeText(body.username);
    const password = String(body.password || "");
    const user = await store.validateLogin(username, password);
    if (!user) {
      sendJson(response, 401, { error: "Invalid username or password." });
      return;
    }

    sendJson(response, 200, { user });
    return;
  }

  if (request.method === "GET" && pathname === "/api/bootstrap") {
    sendJson(response, 200, await store.getBootstrap(actor));
    return;
  }

  if (request.method === "POST" && pathname === "/api/users") {
    const body = await parseBody(request);
    const payload = {
      name: normalizeText(body.name),
      role: normalizeText(body.role),
      type: normalizeText(body.type)
    };
    if (!payload.name || !payload.role || !payload.type) {
      sendJson(response, 400, { error: "Name, role, and type are required" });
      return;
    }

    sendJson(response, 201, await store.createUser(payload));
    return;
  }

  if (request.method === "POST" && pathname === "/api/projects") {
    const body = await parseBody(request);
    const payload = {
      name: normalizeText(body.name),
      ownerId: normalizeNumber(body.ownerId),
      status: normalizeText(body.status)
    };
    if (!payload.name || Number.isNaN(payload.ownerId) || !payload.status) {
      sendJson(response, 400, { error: "Project name, owner, and status are required" });
      return;
    }

    sendJson(response, 201, await store.createProject(payload, actor));
    return;
  }

  if (request.method === "POST" && pathname === "/api/finances") {
    const body = await parseBody(request);
    const payload = {
      projectId: normalizeNumber(body.projectId),
      type: normalizeText(body.type),
      amount: normalizeNumber(body.amount),
      status: normalizeText(body.status),
      note: normalizeText(body.note)
    };
    if (Number.isNaN(payload.projectId) || !payload.type || Number.isNaN(payload.amount) || !payload.status) {
      sendJson(response, 400, { error: "Project, finance type, amount, and status are required" });
      return;
    }

    sendJson(response, 201, await store.createFinance(payload, actor));
    return;
  }

  if (request.method === "PATCH" && pathname.startsWith("/api/finances/")) {
    const financeId = Number(pathname.split("/").pop());
    const body = await parseBody(request);
    const finance = await store.updateFinance(financeId, {
      projectId: body.projectId === undefined ? undefined : normalizeNumber(body.projectId),
      type: body.type === undefined ? undefined : normalizeText(body.type),
      amount: body.amount === undefined ? undefined : normalizeNumber(body.amount),
      status: body.status === undefined ? undefined : normalizeText(body.status),
      note: body.note === undefined ? undefined : normalizeText(body.note)
    }, actor);
    if (!finance) {
      notFound(response);
      return;
    }

    sendJson(response, 200, finance);
    return;
  }

  if (request.method === "DELETE" && pathname.startsWith("/api/finances/")) {
    const financeId = Number(pathname.split("/").pop());
    const deleted = await store.deleteFinance(financeId, actor);
    if (!deleted) {
      notFound(response);
      return;
    }

    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "POST" && pathname === "/api/holidays") {
    const body = await parseBody(request);
    const payload = {
      name: normalizeText(body.name),
      used: normalizeNumber(body.used),
      total: normalizeNumber(body.total)
    };
    if (!payload.name || Number.isNaN(payload.used) || Number.isNaN(payload.total)) {
      sendJson(response, 400, { error: "Holiday name, used days, and total days are required" });
      return;
    }

    sendJson(response, 201, await store.createHoliday(payload, actor));
    return;
  }

  if (request.method === "PATCH" && pathname.startsWith("/api/holidays/")) {
    const holidayId = Number(pathname.split("/").pop());
    const body = await parseBody(request);
    const holiday = await store.updateHoliday(holidayId, {
      name: body.name === undefined ? undefined : normalizeText(body.name),
      used: body.used === undefined ? undefined : normalizeNumber(body.used),
      total: body.total === undefined ? undefined : normalizeNumber(body.total)
    }, actor);
    if (!holiday) {
      notFound(response);
      return;
    }

    sendJson(response, 200, holiday);
    return;
  }

  if (request.method === "POST" && pathname === "/api/schedules") {
    const body = await parseBody(request);
    const payload = {
      range: normalizeText(body.range),
      day: normalizeText(body.day),
      title: normalizeText(body.title),
      note: normalizeText(body.note),
      color: normalizeText(body.color)
    };
    if (!payload.range || !payload.day || !payload.title || !payload.note || !payload.color) {
      sendJson(response, 400, { error: "Range, day, title, note, and color are required" });
      return;
    }

    sendJson(response, 201, await store.createSchedule(payload, actor));
    return;
  }

  if (request.method === "PATCH" && pathname.startsWith("/api/schedules/")) {
    const scheduleId = Number(pathname.split("/").pop());
    const body = await parseBody(request);
    const schedule = await store.updateSchedule(scheduleId, {
      range: body.range === undefined ? undefined : normalizeText(body.range),
      day: body.day === undefined ? undefined : normalizeText(body.day),
      title: body.title === undefined ? undefined : normalizeText(body.title),
      note: body.note === undefined ? undefined : normalizeText(body.note),
      color: body.color === undefined ? undefined : normalizeText(body.color)
    }, actor);
    if (!schedule) {
      notFound(response);
      return;
    }

    sendJson(response, 200, schedule);
    return;
  }

  if (request.method === "DELETE" && pathname.startsWith("/api/schedules/")) {
    const scheduleId = Number(pathname.split("/").pop());
    const deleted = await store.deleteSchedule(scheduleId, actor);
    if (!deleted) {
      notFound(response);
      return;
    }

    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "POST" && pathname === "/api/todos") {
    const body = await parseBody(request);
    const payload = { text: normalizeText(body.text) };
    if (!payload.text) {
      sendJson(response, 400, { error: "Todo text is required" });
      return;
    }

    sendJson(response, 201, await store.createTodo(payload, actor));
    return;
  }

  if (request.method === "PATCH" && pathname.startsWith("/api/todos/")) {
    const todoId = Number(pathname.split("/").pop());
    const body = await parseBody(request);
    const todo = await store.updateTodo(todoId, { done: body.done === undefined ? undefined : Boolean(body.done) }, actor);
    if (!todo) {
      notFound(response);
      return;
    }

    sendJson(response, 200, todo);
    return;
  }

  if (request.method === "DELETE" && pathname.startsWith("/api/todos/")) {
    const todoId = Number(pathname.split("/").pop());
    const deleted = await store.deleteTodo(todoId, actor);
    if (!deleted) {
      notFound(response);
      return;
    }

    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "PATCH" && pathname.startsWith("/api/meetings/")) {
    const meetingId = Number(pathname.split("/").pop());
    const body = await parseBody(request);
    const meeting = await store.updateMeeting(meetingId, { notes: body.notes === undefined ? undefined : String(body.notes) }, actor);
    if (!meeting) {
      notFound(response);
      return;
    }

    sendJson(response, 200, meeting);
    return;
  }

  notFound(response);
}

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const pathname = requestUrl.pathname;

    if (pathname.startsWith("/api/")) {
      await handleApi(request, response, pathname);
      return;
    }

    const safePath = pathname === "/" ? "index.html" : pathname.slice(1);
    const filePath = path.join(PUBLIC_ROOT, safePath);
    if (!filePath.startsWith(PUBLIC_ROOT)) {
      sendText(response, 403, "Forbidden");
      return;
    }

    serveFile(response, filePath);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Schedule Tracker Hub running at http://${HOST}:${PORT} using ${store.provider} storage`);
});
