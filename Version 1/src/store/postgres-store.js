function createPostgresStore({ connectionString }) {
  let pool;

  async function getPool() {
    if (pool) {
      return pool;
    }

    const { Pool } = require("pg");
    pool = new Pool({
      connectionString,
      ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false }
    });
    return pool;
  }

  async function allRows(query, params = []) {
    const client = await getPool();
    const result = await client.query(query, params);
    return result.rows;
  }

  async function oneRow(query, params = []) {
    const client = await getPool();
    const result = await client.query(query, params);
    return result.rows[0] || null;
  }

  async function execute(query, params = []) {
    const client = await getPool();
    await client.query(query, params);
  }

  function normalizeProject(row) {
    return {
      id: Number(row.id),
      name: row.name,
      ownerId: row.owner_id === null ? null : Number(row.owner_id),
      status: row.status
    };
  }

  function normalizeFinance(row) {
    return {
      id: Number(row.id),
      projectId: Number(row.project_id),
      type: row.type,
      amount: Number(row.amount),
      status: row.status,
      note: row.note || ""
    };
  }

  function normalizeBasicRow(row) {
    return Object.fromEntries(Object.entries(row).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value];
      }
      if (typeof value === "boolean" || value === null) {
        return [key, value];
      }
      if (typeof value === "number") {
        return [key, value];
      }
      return [key, Number.isNaN(Number(value)) ? value : Number(value)];
    }));
  }

  return {
    provider: "postgres",
    async getBootstrap() {
      const [users, projects, holidays, todos, meetings, schedules, finances] = await Promise.all([
        allRows("select id, name, role, type from users order by id desc"),
        allRows("select id, name, owner_id, status from projects order by id desc"),
        allRows("select id, name, used, total from holidays order by id desc"),
        allRows("select id, text, done from todos order by id desc"),
        allRows("select id, title, meta, notes from meetings order by id desc"),
        allRows("select id, range, day, title, note, color from schedules order by id desc"),
        allRows("select id, project_id, type, amount, status, note from finances order by id desc")
      ]);

      return {
        users: users.map((row) => ({ id: Number(row.id), name: row.name, role: row.role, type: row.type })),
        projects: projects.map(normalizeProject),
        holidays: holidays.map((row) => ({ id: Number(row.id), name: row.name, used: Number(row.used), total: Number(row.total) })),
        todos: todos.map((row) => ({ id: Number(row.id), text: row.text, done: row.done })),
        meetings: meetings.map((row) => ({ id: Number(row.id), title: row.title, meta: row.meta, notes: row.notes || "" })),
        schedules: schedules.map((row) => ({ id: Number(row.id), range: row.range, day: row.day, title: row.title, note: row.note, color: row.color })),
        finances: finances.map(normalizeFinance)
      };
    },
    async validateLogin(username, password) {
      const adminUser = process.env.DEMO_ADMIN_USERNAME || "admin";
      const adminPassword = process.env.DEMO_ADMIN_PASSWORD || "admin";
      const valid = username === adminUser && password === adminPassword;
      if (!valid) {
        return null;
      }

      return {
        username,
        role: "Administrator"
      };
    },
    async createUser(payload) {
      const row = await oneRow(
        "insert into users (name, role, type) values ($1, $2, $3) returning id, name, role, type",
        [payload.name, payload.role, payload.type]
      );
      return { id: Number(row.id), name: row.name, role: row.role, type: row.type };
    },
    async createProject(payload) {
      const row = await oneRow(
        "insert into projects (name, owner_id, status) values ($1, $2, $3) returning id, name, owner_id, status",
        [payload.name, payload.ownerId, payload.status]
      );
      return normalizeProject(row);
    },
    async createFinance(payload) {
      const row = await oneRow(
        "insert into finances (project_id, type, amount, status, note) values ($1, $2, $3, $4, $5) returning id, project_id, type, amount, status, note",
        [payload.projectId, payload.type, payload.amount, payload.status, payload.note]
      );
      return normalizeFinance(row);
    },
    async updateFinance(id, payload) {
      const row = await oneRow(
        "update finances set project_id = coalesce($2, project_id), type = coalesce($3, type), amount = coalesce($4, amount), status = coalesce($5, status), note = coalesce($6, note) where id = $1 returning id, project_id, type, amount, status, note",
        [id, payload.projectId ?? null, payload.type ?? null, payload.amount ?? null, payload.status ?? null, payload.note ?? null]
      );
      return row ? normalizeFinance(row) : null;
    },
    async deleteFinance(id) {
      const row = await oneRow("delete from finances where id = $1 returning id", [id]);
      return Boolean(row);
    },
    async createHoliday(payload) {
      const row = await oneRow(
        "insert into holidays (name, used, total) values ($1, $2, $3) returning id, name, used, total",
        [payload.name, payload.used, payload.total]
      );
      return { id: Number(row.id), name: row.name, used: Number(row.used), total: Number(row.total) };
    },
    async updateHoliday(id, payload) {
      const row = await oneRow(
        "update holidays set name = coalesce($2, name), used = coalesce($3, used), total = coalesce($4, total) where id = $1 returning id, name, used, total",
        [id, payload.name ?? null, payload.used ?? null, payload.total ?? null]
      );
      return row ? { id: Number(row.id), name: row.name, used: Number(row.used), total: Number(row.total) } : null;
    },
    async createSchedule(payload) {
      const row = await oneRow(
        "insert into schedules (range, day, title, note, color) values ($1, $2, $3, $4, $5) returning id, range, day, title, note, color",
        [payload.range, payload.day, payload.title, payload.note, payload.color]
      );
      return normalizeBasicRow(row);
    },
    async updateSchedule(id, payload) {
      const row = await oneRow(
        "update schedules set range = coalesce($2, range), day = coalesce($3, day), title = coalesce($4, title), note = coalesce($5, note), color = coalesce($6, color) where id = $1 returning id, range, day, title, note, color",
        [id, payload.range ?? null, payload.day ?? null, payload.title ?? null, payload.note ?? null, payload.color ?? null]
      );
      return row ? normalizeBasicRow(row) : null;
    },
    async deleteSchedule(id) {
      const row = await oneRow("delete from schedules where id = $1 returning id", [id]);
      return Boolean(row);
    },
    async createTodo(payload) {
      const row = await oneRow(
        "insert into todos (text, done) values ($1, false) returning id, text, done",
        [payload.text]
      );
      return { id: Number(row.id), text: row.text, done: row.done };
    },
    async updateTodo(id, payload) {
      const row = await oneRow(
        "update todos set done = coalesce($2, done) where id = $1 returning id, text, done",
        [id, payload.done ?? null]
      );
      return row ? { id: Number(row.id), text: row.text, done: row.done } : null;
    },
    async deleteTodo(id) {
      const row = await oneRow("delete from todos where id = $1 returning id", [id]);
      return Boolean(row);
    },
    async updateMeeting(id, payload) {
      const row = await oneRow(
        "update meetings set notes = coalesce($2, notes) where id = $1 returning id, title, meta, notes",
        [id, payload.notes ?? null]
      );
      return row ? { id: Number(row.id), title: row.title, meta: row.meta, notes: row.notes || "" } : null;
    },
    async exportSeed() {
      return this.getBootstrap();
    },
    async close() {
      if (pool) {
        await pool.end();
      }
    },
    async ping() {
      await execute("select 1");
    }
  };
}

module.exports = { createPostgresStore };
