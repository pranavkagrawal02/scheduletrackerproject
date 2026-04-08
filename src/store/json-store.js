const fs = require("fs/promises");

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function getActorUsername(actor) {
  return normalizeUsername(actor?.username) || "admin";
}

function assignLegacyOwnership(db) {
  let changed = false;

  for (const project of db.projects || []) {
    if (!project.createdByUsername) {
      project.createdByUsername = "admin";
      changed = true;
    }
  }

  const projectOwners = new Map((db.projects || []).map((project) => [Number(project.id), project.createdByUsername || "admin"]));
  for (const finance of db.finances || []) {
    if (!finance.createdByUsername) {
      finance.createdByUsername = projectOwners.get(Number(finance.projectId)) || "admin";
      changed = true;
    }
  }

  for (const key of ["holidays", "todos", "meetings", "schedules"]) {
    for (const item of db[key] || []) {
      if (!item.ownerUsername) {
        item.ownerUsername = "admin";
        changed = true;
      }
    }
  }

  return changed;
}

function filterByOwner(items, ownerKey, username) {
  return (items || []).filter((item) => normalizeUsername(item[ownerKey]) === username);
}

function withoutFields(item, fields) {
  const copy = { ...item };
  for (const field of fields) {
    delete copy[field];
  }
  return copy;
}

function createJsonStore({ dbPath }) {
  async function readDb() {
    const content = await fs.readFile(dbPath, "utf8");
    return JSON.parse(content);
  }

  async function writeDb(data) {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
  }

  async function readPreparedDb() {
    const db = await readDb();
    if (assignLegacyOwnership(db)) {
      await writeDb(db);
    }
    return db;
  }

  return {
    provider: "json",
    async getBootstrap(actor) {
      const db = await readPreparedDb();
      const actorUsername = getActorUsername(actor);

      return {
        users: clone(db.users || []),
        projects: filterByOwner(db.projects, "createdByUsername", actorUsername).map((item) => withoutFields(item, ["createdByUsername"])),
        holidays: filterByOwner(db.holidays, "ownerUsername", actorUsername).map((item) => withoutFields(item, ["ownerUsername"])),
        todos: filterByOwner(db.todos, "ownerUsername", actorUsername).map((item) => withoutFields(item, ["ownerUsername"])),
        meetings: filterByOwner(db.meetings, "ownerUsername", actorUsername).map((item) => withoutFields(item, ["ownerUsername"])),
        schedules: filterByOwner(db.schedules, "ownerUsername", actorUsername).map((item) => withoutFields(item, ["ownerUsername"])),
        finances: filterByOwner(db.finances, "createdByUsername", actorUsername).map((item) => withoutFields(item, ["createdByUsername"]))
      };
    },
    async validateLogin(username, password) {
      const adminUser = process.env.DEMO_ADMIN_USERNAME || "admin";
      const adminPassword = process.env.DEMO_ADMIN_PASSWORD || "admin";
      const valid = (username === adminUser && password === adminPassword) || (username && username === password);
      if (!valid) {
        return null;
      }

      return {
        username,
        role: username === adminUser ? "Administrator" : "Demo user"
      };
    },
    async createUser(payload) {
      const db = await readPreparedDb();
      const user = {
        id: nextId(db.users),
        name: payload.name,
        role: payload.role,
        type: payload.type
      };
      db.users.unshift(user);
      await writeDb(db);
      return user;
    },
    async createProject(payload, actor) {
      const db = await readPreparedDb();
      const project = {
        id: nextId(db.projects),
        name: payload.name,
        ownerId: payload.ownerId,
        status: payload.status,
        createdByUsername: getActorUsername(actor)
      };
      db.projects.unshift(project);
      await writeDb(db);
      return withoutFields(project, ["createdByUsername"]);
    },
    async createFinance(payload, actor) {
      const db = await readPreparedDb();
      const actorUsername = getActorUsername(actor);
      const project = db.projects.find((item) => item.id === payload.projectId && normalizeUsername(item.createdByUsername) === actorUsername);
      if (!project) {
        throw new Error("Choose one of your own projects before saving finance data.");
      }

      const finance = {
        id: nextId(db.finances),
        projectId: payload.projectId,
        type: payload.type,
        amount: payload.amount,
        status: payload.status,
        note: payload.note,
        createdByUsername: actorUsername
      };
      db.finances.unshift(finance);
      await writeDb(db);
      return withoutFields(finance, ["createdByUsername"]);
    },
    async updateFinance(id, payload, actor) {
      const db = await readPreparedDb();
      const actorUsername = getActorUsername(actor);
      const finance = db.finances.find((item) => item.id === id && normalizeUsername(item.createdByUsername) === actorUsername);
      if (!finance) {
        return null;
      }

      if (payload.projectId !== undefined) {
        const project = db.projects.find((item) => item.id === payload.projectId && normalizeUsername(item.createdByUsername) === actorUsername);
        if (!project) {
          throw new Error("You can only attach finance records to your own projects.");
        }
      }

      finance.projectId = payload.projectId ?? finance.projectId;
      finance.type = payload.type ?? finance.type;
      finance.amount = payload.amount ?? finance.amount;
      finance.status = payload.status ?? finance.status;
      finance.note = payload.note ?? finance.note;
      await writeDb(db);
      return withoutFields(finance, ["createdByUsername"]);
    },
    async deleteFinance(id, actor) {
      const db = await readPreparedDb();
      const actorUsername = getActorUsername(actor);
      const index = db.finances.findIndex((item) => item.id === id && normalizeUsername(item.createdByUsername) === actorUsername);
      if (index === -1) {
        return false;
      }

      db.finances.splice(index, 1);
      await writeDb(db);
      return true;
    },
    async createHoliday(payload, actor) {
      const db = await readPreparedDb();
      const holiday = {
        id: nextId(db.holidays),
        name: payload.name,
        used: payload.used,
        total: payload.total,
        ownerUsername: getActorUsername(actor)
      };
      db.holidays.unshift(holiday);
      await writeDb(db);
      return withoutFields(holiday, ["ownerUsername"]);
    },
    async updateHoliday(id, payload, actor) {
      const db = await readPreparedDb();
      const actorUsername = getActorUsername(actor);
      const holiday = db.holidays.find((item) => item.id === id && normalizeUsername(item.ownerUsername) === actorUsername);
      if (!holiday) {
        return null;
      }

      holiday.name = payload.name ?? holiday.name;
      holiday.used = payload.used ?? holiday.used;
      holiday.total = payload.total ?? holiday.total;
      await writeDb(db);
      return withoutFields(holiday, ["ownerUsername"]);
    },
    async createSchedule(payload, actor) {
      const db = await readPreparedDb();
      const schedule = {
        id: nextId(db.schedules),
        range: payload.range,
        day: payload.day,
        title: payload.title,
        note: payload.note,
        color: payload.color,
        ownerUsername: getActorUsername(actor)
      };
      db.schedules.unshift(schedule);
      await writeDb(db);
      return withoutFields(schedule, ["ownerUsername"]);
    },
    async updateSchedule(id, payload, actor) {
      const db = await readPreparedDb();
      const actorUsername = getActorUsername(actor);
      const schedule = db.schedules.find((item) => item.id === id && normalizeUsername(item.ownerUsername) === actorUsername);
      if (!schedule) {
        return null;
      }

      schedule.range = payload.range ?? schedule.range;
      schedule.day = payload.day ?? schedule.day;
      schedule.title = payload.title ?? schedule.title;
      schedule.note = payload.note ?? schedule.note;
      schedule.color = payload.color ?? schedule.color;
      await writeDb(db);
      return withoutFields(schedule, ["ownerUsername"]);
    },
    async deleteSchedule(id, actor) {
      const db = await readPreparedDb();
      const actorUsername = getActorUsername(actor);
      const index = db.schedules.findIndex((item) => item.id === id && normalizeUsername(item.ownerUsername) === actorUsername);
      if (index === -1) {
        return false;
      }

      db.schedules.splice(index, 1);
      await writeDb(db);
      return true;
    },
    async createTodo(payload, actor) {
      const db = await readPreparedDb();
      const todo = {
        id: nextId(db.todos),
        text: payload.text,
        done: false,
        ownerUsername: getActorUsername(actor)
      };
      db.todos.unshift(todo);
      await writeDb(db);
      return withoutFields(todo, ["ownerUsername"]);
    },
    async updateTodo(id, payload, actor) {
      const db = await readPreparedDb();
      const actorUsername = getActorUsername(actor);
      const todo = db.todos.find((item) => item.id === id && normalizeUsername(item.ownerUsername) === actorUsername);
      if (!todo) {
        return null;
      }

      todo.done = payload.done ?? todo.done;
      await writeDb(db);
      return withoutFields(todo, ["ownerUsername"]);
    },
    async deleteTodo(id, actor) {
      const db = await readPreparedDb();
      const actorUsername = getActorUsername(actor);
      const index = db.todos.findIndex((item) => item.id === id && normalizeUsername(item.ownerUsername) === actorUsername);
      if (index === -1) {
        return false;
      }

      db.todos.splice(index, 1);
      await writeDb(db);
      return true;
    },
    async updateMeeting(id, payload, actor) {
      const db = await readPreparedDb();
      const actorUsername = getActorUsername(actor);
      const meeting = db.meetings.find((item) => item.id === id && normalizeUsername(item.ownerUsername) === actorUsername);
      if (!meeting) {
        return null;
      }

      meeting.notes = payload.notes ?? meeting.notes;
      await writeDb(db);
      return withoutFields(meeting, ["ownerUsername"]);
    },
    async exportSeed() {
      return clone(await readPreparedDb());
    }
  };
}

module.exports = { createJsonStore };
