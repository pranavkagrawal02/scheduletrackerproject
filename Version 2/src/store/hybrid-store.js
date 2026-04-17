const fs = require("fs/promises");
const path = require("path");
const { createSqlServerStore } = require("./sqlserver-store");

function normalizeText(value) {
  return String(value || "").trim();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nextId(items) {
  return (items || []).reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function sanitizeFilePart(value, fallback) {
  const cleaned = normalizeText(value)
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || fallback;
}

function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(value) {
  const date = value ? new Date(value) : null;
  if (date && !Number.isNaN(date.getTime())) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  const match = normalizeText(value).match(/(\d{2}:\d{2})/);
  return match ? match[1] : "";
}

function buildMeetingMeta(startDateTime, endDateTime, link) {
  const parts = [];
  const date = formatDate(startDateTime);
  const start = formatTime(startDateTime);
  const end = formatTime(endDateTime);

  if (date) parts.push(date);
  if (start && end) parts.push(`${start} - ${end}`);
  else if (start) parts.push(start);
  if (normalizeText(link)) parts.push(normalizeText(link));

  return parts.join(" | ");
}

function ensureCollections(db) {
  const collections = [
    "projects",
    "projectUpdates",
    "holidays",
    "publicHolidays",
    "leaveEvents",
    "todos",
    "meetings",
    "schedules",
    "finances"
  ];

  for (const key of collections) {
    if (!Array.isArray(db[key])) {
      db[key] = [];
    }
  }

  if (!db.profile || typeof db.profile !== "object") {
    db.profile = {};
  }
}

function createEmptyEmployeeDb(actor) {
  const data = {
    profile: {
      employeeId: actor?.employeeId ?? (actor?.employeeCode ? Number(actor.employeeCode) : null),
      employeeCode: actor?.employeeCode ?? null,
      username: actor?.username ?? null,
      name: actor?.name ?? actor?.username ?? "User",
      role: actor?.role ?? actor?.designation ?? "Employee"
    },
    projects: [],
    projectUpdates: [],
    holidays: [],
    publicHolidays: [],
    leaveEvents: [],
    todos: [],
    meetings: [],
    schedules: [],
    finances: []
  };

  ensureCollections(data);
  return data;
}

function mergeProfile(db, actor) {
  db.profile = {
    ...db.profile,
    employeeId: actor?.employeeId ?? db.profile.employeeId ?? (actor?.employeeCode ? Number(actor.employeeCode) : null),
    employeeCode: actor?.employeeCode ?? db.profile.employeeCode ?? null,
    username: actor?.username ?? db.profile.username ?? null,
    name: actor?.name ?? db.profile.name ?? actor?.username ?? "User",
    role: actor?.role ?? actor?.designation ?? db.profile.role ?? "Employee"
  };
}

function filterLegacyItems(items, actor, ownerKey) {
  const username = normalizeText(actor?.username).toLowerCase();
  if (!username) {
    return clone(items || []);
  }

  return clone((items || []).filter((item) => {
    const owner = normalizeText(item?.[ownerKey]).toLowerCase();
    return !owner || owner === username;
  }));
}

function createSeedFromLegacy(legacyDb, actor) {
  const seeded = createEmptyEmployeeDb(actor);
  seeded.projects = filterLegacyItems(legacyDb.projects, actor, "createdByUsername");
  seeded.projectUpdates = filterLegacyItems(legacyDb.projectUpdates, actor, "createdByUsername");
  seeded.holidays = filterLegacyItems(legacyDb.holidays, actor, "ownerUsername");
  seeded.publicHolidays = filterLegacyItems(legacyDb.publicHolidays, actor, "ownerUsername");
  seeded.leaveEvents = filterLegacyItems(legacyDb.leaveEvents, actor, "ownerUsername");
  seeded.todos = filterLegacyItems(legacyDb.todos, actor, "ownerUsername");
  seeded.meetings = filterLegacyItems(legacyDb.meetings, actor, "ownerUsername");
  seeded.schedules = filterLegacyItems(legacyDb.schedules, actor, "ownerUsername");
  seeded.finances = filterLegacyItems(legacyDb.finances, actor, "createdByUsername");
  return seeded;
}

function buildEmployeeFileName(actor) {
  const employeeId = sanitizeFilePart(actor?.employeeCode ?? actor?.employeeId ?? actor?.username ?? "demo", "demo");
  const role = sanitizeFilePart(actor?.role ?? actor?.designation ?? "Employee", "Employee");
  const name = sanitizeFilePart(actor?.name ?? actor?.username ?? "User", "User");
  return `${employeeId}_${role}_${name}.json`;
}

async function safeReadJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(content);
  ensureCollections(data);
  return data;
}

function createHybridStore({ rootDir, dataRoot }) {
  const sqlStore = createSqlServerStore();
  const resolvedDataRoot = dataRoot || path.join(rootDir, "version 1");
  const employeeDir = path.join(resolvedDataRoot, "employee-data");
  const legacyDbPath = path.join(resolvedDataRoot, "db.json");

  async function ensureDirectory() {
    await fs.mkdir(employeeDir, { recursive: true });
  }

  async function resolveEmployeeFilePath(actor) {
    await ensureDirectory();

    const employeeId = sanitizeFilePart(actor?.employeeCode ?? actor?.employeeId ?? actor?.username ?? "demo", "demo");
    const expectedFileName = buildEmployeeFileName(actor);

    try {
      const entries = await fs.readdir(employeeDir);
      const existingFile = entries.find((entry) => entry.toLowerCase().startsWith(`${employeeId}_`) && entry.toLowerCase().endsWith(".json"));
      if (existingFile) {
        const existingPath = path.join(employeeDir, existingFile);
        if (existingFile !== expectedFileName) {
          const nextPath = path.join(employeeDir, expectedFileName);
          try {
            await fs.rename(existingPath, nextPath);
            return nextPath;
          } catch {
            return existingPath;
          }
        }
        return existingPath;
      }
    } catch {
      // ignore and fall back to the expected path
    }

    return path.join(employeeDir, expectedFileName);
  }

  async function createSeedData(actor) {
    try {
      const legacyDb = await safeReadJson(legacyDbPath);
      return createSeedFromLegacy(legacyDb, actor);
    } catch {
      return createEmptyEmployeeDb(actor);
    }
  }

  async function ensureEmployeeDb(actor) {
    const filePath = await resolveEmployeeFilePath(actor);

    let db;
    try {
      db = await safeReadJson(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      db = await createSeedData(actor);
    }

    mergeProfile(db, actor);
    ensureCollections(db);
    await fs.writeFile(filePath, JSON.stringify(db, null, 2));
    return { db, filePath };
  }

  async function readEmployeeDb(actor) {
    const { db } = await ensureEmployeeDb(actor);
    return db;
  }

  async function updateEmployeeDb(actor, updater) {
    const { db, filePath } = await ensureEmployeeDb(actor);
    const result = await updater(db);
    ensureCollections(db);
    await fs.writeFile(filePath, JSON.stringify(db, null, 2));
    return result;
  }

  async function getUsersFromSql(actor) {
    try {
      const sqlBootstrap = await sqlStore.getBootstrap(actor);
      return clone(sqlBootstrap.users || []);
    } catch {
      try {
        const legacyDb = await safeReadJson(legacyDbPath);
        return clone(legacyDb.users || []);
      } catch {
        return [];
      }
    }
  }

  return {
    provider: "hybrid",
    async validateLogin(username, password) {
      try {
        const user = await sqlStore.validateLogin(username, password);
        if (!user) {
          return null;
        }
        await ensureEmployeeDb(user);
        return user;
      } catch (error) {
        const adminUser = process.env.DEMO_ADMIN_USERNAME || "admin";
        const adminPassword = process.env.DEMO_ADMIN_PASSWORD || "admin";
        if (normalizeText(username) === adminUser && String(password || "") === adminPassword) {
          const demoUser = {
            username: adminUser,
            role: "Administrator",
            employeeCode: null,
            employeeId: null,
            name: "Administrator"
          };
          await ensureEmployeeDb(demoUser);
          return demoUser;
        }
        throw error;
      }
    },
    async getBootstrap(actor) {
      const db = await readEmployeeDb(actor);
      return {
        users: await getUsersFromSql(actor),
        projects: clone(db.projects || []),
        projectUpdates: clone(db.projectUpdates || []),
        holidays: clone(db.holidays || []),
        publicHolidays: clone(db.publicHolidays || []),
        leaveEvents: clone(db.leaveEvents || []),
        todos: clone(db.todos || []),
        meetings: clone(db.meetings || []),
        schedules: clone(db.schedules || []),
        finances: clone(db.finances || [])
      };
    },
    async createUser(payload, actor) {
      const user = await sqlStore.createUser(payload, actor);
      await ensureEmployeeDb({
        employeeCode: String(user.id),
        employeeId: Number(user.id),
        username: user.username,
        name: user.name,
        role: user.role
      });
      return user;
    },
    async createProject(payload, actor) {
      return updateEmployeeDb(actor, async (db) => {
        const project = {
          id: nextId(db.projects),
          name: payload.name,
          ownerId: payload.ownerId,
          status: payload.status,
          priority: payload.priority || "Medium",
          statusRemark: "",
          statusUpdatedAt: "",
          budget: 0,
          spentAmount: 0,
          pendingAmount: 0,
          remainingAmount: 0,
          financeRemark: "",
          financeUpdatedAt: "",
          deadlineDate: ""
        };
        db.projects.unshift(project);
        return clone(project);
      });
    },
    async updateProject(id, payload, actor) {
      return updateEmployeeDb(actor, async (db) => {
        const project = (db.projects || []).find((item) => Number(item.id) === Number(id));
        if (!project) {
          return null;
        }

        const currentBudget = Number(project.budget || 0);
        const currentSpent = Number(project.spentAmount || 0);
        const currentPending = Number(project.pendingAmount || 0);
        const currentRemaining = Number(project.remainingAmount || 0);
        const nextBudget = payload.budget ?? currentBudget;
        const nextSpent = payload.spentAmount ?? (currentSpent + Number(payload.expenseDelta || 0));
        const nextPending = payload.pendingAmount ?? currentPending;
        const nextRemaining = payload.remainingAmount ?? (payload.savingsDelta !== undefined
          ? currentRemaining + Number(payload.savingsDelta || 0) - Number(payload.expenseDelta || 0)
          : nextBudget - nextSpent);

        project.status = payload.status ?? project.status;
        project.priority = payload.priority ?? project.priority ?? "Medium";
        project.statusRemark = payload.statusRemark ?? project.statusRemark ?? "";
        project.statusUpdatedAt = payload.statusUpdatedAt ?? project.statusUpdatedAt ?? "";
        project.budget = nextBudget;
        project.spentAmount = nextSpent;
        project.pendingAmount = nextPending;
        project.remainingAmount = nextRemaining;
        project.financeRemark = payload.financeRemark ?? project.financeRemark ?? "";
        project.financeUpdatedAt = payload.financeUpdatedAt ?? project.financeUpdatedAt ?? "";
        project.deadlineDate = payload.deadlineDate ?? project.deadlineDate ?? "";

        const updateRow = {
          id: nextId(db.projectUpdates),
          projectId: project.id,
          ownerId: project.ownerId,
          status: project.status,
          priority: project.priority,
          statusRemark: project.statusRemark,
          statusUpdatedAt: project.statusUpdatedAt,
          budget: project.budget,
          spentAmount: project.spentAmount,
          pendingAmount: project.pendingAmount,
          remainingAmount: project.remainingAmount,
          financeRemark: project.financeRemark,
          financeUpdatedAt: project.financeUpdatedAt,
          createdAt: new Date().toISOString()
        };

        db.projectUpdates.unshift(updateRow);
        return {
          project: clone(project),
          projectUpdates: clone(db.projectUpdates || [])
        };
      });
    },
    async deleteProject(id, actor) {
      return updateEmployeeDb(actor, async (db) => {
        const index = (db.projects || []).findIndex((item) => Number(item.id) === Number(id));
        if (index === -1) {
          return false;
        }

        db.projects.splice(index, 1);
        db.projectUpdates = (db.projectUpdates || []).filter((item) => Number(item.projectId) !== Number(id));
        db.finances = (db.finances || []).filter((item) => Number(item.projectId) !== Number(id));
        return true;
      });
    },
    async createFinance(payload, actor) {
      return updateEmployeeDb(actor, async (db) => {
        const project = (db.projects || []).find((item) => Number(item.id) === Number(payload.projectId));
        if (!project) {
          throw new Error("Choose one of your projects before saving finance data.");
        }

        const finance = {
          id: nextId(db.finances),
          projectId: payload.projectId,
          type: payload.type,
          amount: payload.amount,
          status: payload.status,
          note: payload.note
        };
        db.finances.unshift(finance);
        return clone(finance);
      });
    },
    async updateFinance(id, payload, actor) {
      return updateEmployeeDb(actor, async (db) => {
        const finance = (db.finances || []).find((item) => Number(item.id) === Number(id));
        if (!finance) {
          return null;
        }

        if (payload.projectId !== undefined) {
          const project = (db.projects || []).find((item) => Number(item.id) === Number(payload.projectId));
          if (!project) {
            throw new Error("You can only attach finance records to your own projects.");
          }
        }

        finance.projectId = payload.projectId ?? finance.projectId;
        finance.type = payload.type ?? finance.type;
        finance.amount = payload.amount ?? finance.amount;
        finance.status = payload.status ?? finance.status;
        finance.note = payload.note ?? finance.note;
        return clone(finance);
      });
    },
    async deleteFinance(id, actor) {
      return updateEmployeeDb(actor, async (db) => {
        const index = (db.finances || []).findIndex((item) => Number(item.id) === Number(id));
        if (index === -1) {
          return false;
        }
        db.finances.splice(index, 1);
        return true;
      });
    },
    async createHoliday(payload, actor) {
      return updateEmployeeDb(actor, async (db) => {
        if (payload.holidayDate) {
          const holidayDate = new Date(payload.holidayDate);
          if (Number.isNaN(holidayDate.getTime())) {
            throw new Error("A valid holiday date is required.");
          }

          const publicHoliday = {
            id: nextId(db.publicHolidays),
            name: payload.name,
            holidayDate: String(payload.holidayDate),
            year: holidayDate.getFullYear(),
            month: holidayDate.toLocaleDateString("en-US", { month: "long" }),
            date: holidayDate.getDate(),
            day: holidayDate.toLocaleDateString("en-US", { weekday: "long" })
          };
          db.publicHolidays.unshift(publicHoliday);
          return clone(publicHoliday);
        }

        const holiday = {
          id: nextId(db.holidays),
          name: payload.name,
          used: payload.used,
          total: payload.total
        };
        db.holidays.unshift(holiday);
        return clone(holiday);
      });
    },
    async updateHoliday(id, payload, actor) {
      return updateEmployeeDb(actor, async (db) => {
        if (payload.holidayDate !== undefined) {
          const holiday = (db.publicHolidays || []).find((item) => Number(item.id) === Number(id));
          if (!holiday) {
            return null;
          }

          const holidayDate = new Date(payload.holidayDate ?? holiday.holidayDate);
          if (Number.isNaN(holidayDate.getTime())) {
            throw new Error("A valid holiday date is required.");
          }

          holiday.name = payload.name ?? holiday.name;
          holiday.holidayDate = String(payload.holidayDate ?? holiday.holidayDate);
          holiday.year = holidayDate.getFullYear();
          holiday.month = holidayDate.toLocaleDateString("en-US", { month: "long" });
          holiday.date = holidayDate.getDate();
          holiday.day = holidayDate.toLocaleDateString("en-US", { weekday: "long" });
          return clone(holiday);
        }

        const holiday = (db.holidays || []).find((item) => Number(item.id) === Number(id));
        if (!holiday) {
          return null;
        }
        holiday.name = payload.name ?? holiday.name;
        holiday.used = payload.used ?? holiday.used;
        holiday.total = payload.total ?? holiday.total;
        return clone(holiday);
      });
    },
    async createSchedule(payload, actor) {
      return updateEmployeeDb(actor, async (db) => {
        const schedule = {
          id: nextId(db.schedules),
          range: payload.range,
          day: payload.day,
          scheduleDate: payload.scheduleDate || payload.day,
          title: payload.title,
          note: payload.note,
          color: payload.color
        };
        db.schedules.unshift(schedule);
        return clone(schedule);
      });
    },
    async updateSchedule(id, payload, actor) {
      return updateEmployeeDb(actor, async (db) => {
        const schedule = (db.schedules || []).find((item) => Number(item.id) === Number(id));
        if (!schedule) {
          return null;
        }

        schedule.range = payload.range ?? schedule.range;
        schedule.day = payload.day ?? schedule.day;
        schedule.scheduleDate = payload.scheduleDate ?? payload.day ?? schedule.scheduleDate;
        schedule.title = payload.title ?? schedule.title;
        schedule.note = payload.note ?? schedule.note;
        schedule.color = payload.color ?? schedule.color;
        return clone(schedule);
      });
    },
    async deleteSchedule(id, actor) {
      return updateEmployeeDb(actor, async (db) => {
        const index = (db.schedules || []).findIndex((item) => Number(item.id) === Number(id));
        if (index === -1) {
          return false;
        }
        db.schedules.splice(index, 1);
        return true;
      });
    },
    async createTodo(payload, actor) {
      return updateEmployeeDb(actor, async (db) => {
        const todo = {
          id: nextId(db.todos),
          text: payload.text,
          done: false
        };
        db.todos.unshift(todo);
        return clone(todo);
      });
    },
    async updateTodo(id, payload, actor) {
      return updateEmployeeDb(actor, async (db) => {
        const todo = (db.todos || []).find((item) => Number(item.id) === Number(id));
        if (!todo) {
          return null;
        }
        todo.done = payload.done ?? todo.done;
        return clone(todo);
      });
    },
    async deleteTodo(id, actor) {
      return updateEmployeeDb(actor, async (db) => {
        const index = (db.todos || []).findIndex((item) => Number(item.id) === Number(id));
        if (index === -1) {
          return false;
        }
        db.todos.splice(index, 1);
        return true;
      });
    },
    async createMeeting(payload, actor) {
      return updateEmployeeDb(actor, async (db) => {
        const meeting = {
          id: nextId(db.meetings),
          title: payload.title,
          meta: buildMeetingMeta(payload.startDateTime, payload.endDateTime, payload.link),
          notes: payload.notes || "",
          summary: payload.summary || "",
          location: payload.location || "",
          link: payload.link || "",
          date: formatDate(payload.startDateTime),
          startTime: formatTime(payload.startDateTime),
          endTime: formatTime(payload.endDateTime),
          startsAt: payload.startDateTime || null,
          endsAt: payload.endDateTime || null
        };
        db.meetings.unshift(meeting);
        return clone(meeting);
      });
    },
    async updateMeeting(id, payload, actor) {
      return updateEmployeeDb(actor, async (db) => {
        const meeting = (db.meetings || []).find((item) => Number(item.id) === Number(id));
        if (!meeting) {
          return null;
        }

        meeting.title = payload.title ?? meeting.title;
        meeting.notes = payload.notes ?? meeting.notes;
        meeting.summary = payload.summary ?? meeting.summary;
        meeting.location = payload.location ?? meeting.location;
        meeting.link = payload.link ?? meeting.link;
        meeting.startsAt = payload.startDateTime ?? meeting.startsAt ?? null;
        meeting.endsAt = payload.endDateTime ?? meeting.endsAt ?? null;
        meeting.date = formatDate(meeting.startsAt) || meeting.date || "";
        meeting.startTime = formatTime(meeting.startsAt) || meeting.startTime || "";
        meeting.endTime = formatTime(meeting.endsAt) || meeting.endTime || "";
        meeting.meta = buildMeetingMeta(meeting.startsAt, meeting.endsAt, meeting.link);
        return clone(meeting);
      });
    },
    async deleteMeeting(id, actor) {
      return updateEmployeeDb(actor, async (db) => {
        const index = (db.meetings || []).findIndex((item) => Number(item.id) === Number(id));
        if (index === -1) {
          return false;
        }
        db.meetings.splice(index, 1);
        return true;
      });
    },
    async exportSeed(actor) {
      const db = await readEmployeeDb(actor);
      return clone(db);
    }
  };
}

module.exports = { createHybridStore };
