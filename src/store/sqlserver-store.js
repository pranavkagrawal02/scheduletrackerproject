const sql = require("mssql");

const EMPLOYEE_ID_EXPR = `
CASE
  WHEN PATINDEX('%[0-9]%', employee_code) = 0 THEN NULL
  ELSE TRY_CONVERT(INT, SUBSTRING(employee_code, PATINDEX('%[0-9]%', employee_code), LEN(employee_code)))
END
`;

const CURRENT_YEAR = new Date().getFullYear();

function splitName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return {
    first: parts[0] || "User",
    middle: parts.length > 2 ? parts.slice(1, -1).join(" ") : null,
    last: parts.length > 1 ? parts[parts.length - 1] : null
  };
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20) || "user";
}

function createSqlServerStore() {
  const rawServer = String(process.env.SQL_SERVER || "").trim();
  const serverParts = rawServer.split("\\");
  const serverName = serverParts[0] || rawServer;
  const instanceName = serverParts[1] || undefined;

  const config = {
    server: serverName,
    database: process.env.SQL_DATABASE,
    user: process.env.SQL_USER || undefined,
    password: process.env.SQL_PASSWORD || undefined,
    options: {
      encrypt: String(process.env.SQL_ENCRYPT || "false") === "true",
      trustServerCertificate: String(process.env.SQL_TRUST_SERVER_CERT || "true") === "true",
      instanceName
    }
  };

  if (!instanceName) {
    config.port = Number(process.env.SQL_PORT || 1433);
  }

  if (!config.user) {
    delete config.user;
    delete config.password;
  }

  let poolPromise;
  let supportTablesReady;

  function getPool() {
    if (!poolPromise) {
      poolPromise = sql.connect(config);
    }

    return poolPromise;
  }

  async function ensureSupportTables() {
    if (supportTablesReady) {
      return;
    }

    const pool = await getPool();
    await pool.request().query(`
      IF OBJECT_ID(N'dbo.schedules', N'U') IS NULL
      BEGIN
        CREATE TABLE dbo.schedules (
          schedule_id INT IDENTITY(1,1) PRIMARY KEY,
          schedule_range NVARCHAR(50) NOT NULL,
          schedule_day NVARCHAR(50) NOT NULL,
          title NVARCHAR(200) NOT NULL,
          note NVARCHAR(500) NOT NULL,
          color NVARCHAR(20) NOT NULL,
          created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
          updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
        );
      END
    `);
    supportTablesReady = true;
  }

  async function getFirstActiveEmployeeCode() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT TOP 1 employee_code
      FROM dbo.users
      WHERE is_active = 1
      ORDER BY employee_code
    `);
    return result.recordset[0]?.employee_code || null;
  }

  async function resolveEmployeeCodeByNumericId(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input("id", sql.Int, Number(id))
      .query(`
        SELECT TOP 1 employee_code
        FROM dbo.users
        WHERE ${EMPLOYEE_ID_EXPR} = @id
        ORDER BY employee_code
      `);

    return result.recordset[0]?.employee_code || null;
  }

  async function resolveEmployeeCode(id) {
    if (!Number.isNaN(Number(id)) && Number(id) > 0) {
      const code = await resolveEmployeeCodeByNumericId(id);
      if (code) {
        return code;
      }
    }

    return getFirstActiveEmployeeCode();
  }

  async function getDepartmentIdByType(type) {
    const pool = await getPool();
    const result = await pool.request()
      .input("type", sql.NVarChar(100), String(type || "").trim())
      .query(`
        SELECT TOP 1 department_id
        FROM dbo.departments
        WHERE department_name = @type OR department_code = @type
        ORDER BY department_id
      `);

    if (result.recordset[0]) {
      return result.recordset[0].department_id;
    }

    const fallback = await pool.request().query(`
      SELECT TOP 1 department_id
      FROM dbo.departments
      WHERE department_code = N'ADMIN'
      ORDER BY department_id
    `);

    return fallback.recordset[0]?.department_id || 1;
  }

  async function getDesignation(name) {
    const pool = await getPool();
    const requested = String(name || "").trim();
    const exact = await pool.request()
      .input("designation", sql.NVarChar(50), requested)
      .query(`
        SELECT TOP 1 designation_id, designation_name
        FROM dbo.designations
        WHERE designation_name = @designation
      `);

    if (exact.recordset[0]) {
      return exact.recordset[0];
    }

    const fallback = await pool.request().query(`
      SELECT TOP 1 designation_id, designation_name
      FROM dbo.designations
      WHERE designation_name = N'Employee'
      ORDER BY designation_id
    `);

    return fallback.recordset[0] || { designation_id: 1, designation_name: requested || "Employee" };
  }

  async function nextEmployeeIdentity() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT ISNULL(MAX(${EMPLOYEE_ID_EXPR}), 0) + 1 AS next_id
      FROM dbo.users
    `);
    return Number(result.recordset[0]?.next_id || 1);
  }

  async function syncHolidayTable(tableName, total, used) {
    const employeeCode = await getFirstActiveEmployeeCode();
    if (!employeeCode) {
      throw new Error("Add at least one user before managing holiday totals.");
    }

    const totalMonths = Math.max(Number(total) || 0, 12);
    const usedMonths = Math.max(0, Math.min(Number(used) || 0, totalMonths));
    const pool = await getPool();
    const request = pool.request()
      .input("employee_code", sql.NVarChar(20), employeeCode)
      .input("holiday_year", sql.Int, CURRENT_YEAR)
      .input("total_months", sql.Int, totalMonths)
      .input("used_months", sql.Int, usedMonths);

    await request.query(`
      DELETE FROM dbo.${tableName}
      WHERE employee_code = @employee_code
        AND holiday_year = @holiday_year;

      WITH months AS (
        SELECT TOP (@total_months)
          ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS month_number
        FROM sys.all_objects
      )
      INSERT INTO dbo.${tableName} (employee_code, holiday_year, holiday_month, holiday_status)
      SELECT
        @employee_code,
        @holiday_year,
        month_number,
        CASE WHEN month_number <= @used_months THEN CAST(0 AS BIT) ELSE CAST(1 AS BIT) END
      FROM months;
    `);
  }

  function resolveHolidayTable(id, name) {
    const normalizedName = String(name || "").trim().toLowerCase();
    if (Number(id) === 1 || normalizedName.includes("cl") || normalizedName.includes("casual")) {
      return { table: "CL_Holiday", displayName: "CL" };
    }
    if (Number(id) === 2 || normalizedName.includes("pl") || normalizedName.includes("privilege")) {
      return { table: "PL_Holiday", displayName: "PL" };
    }
    if (Number(id) === 3 || normalizedName.includes("unpaid")) {
      return { table: "Unpaid_Holiday", displayName: "Unpaid" };
    }
    return null;
  }

  return {
    provider: "sqlserver",
    async getBootstrap() {
      await ensureSupportTables();
      const pool = await getPool();

      const [usersResult, projectsResult, financeResult, todoResult, meetingResult, scheduleResult, holidayResult] = await Promise.all([
        pool.request().query(`
          SELECT
            ${EMPLOYEE_ID_EXPR} AS id,
            employee_code,
            LTRIM(RTRIM(
              employee_first_name
              + CASE WHEN employee_middle_name IS NULL OR employee_middle_name = N'' THEN N'' ELSE N' ' + employee_middle_name END
              + CASE WHEN employee_last_name IS NULL OR employee_last_name = N'' THEN N'' ELSE N' ' + employee_last_name END
            )) AS employee_name,
            designation,
            d.department_name
          FROM dbo.users u
          LEFT JOIN dbo.departments d ON u.department_id = d.department_id
          ORDER BY ${EMPLOYEE_ID_EXPR} DESC, employee_code DESC
        `),
        pool.request().query(`
          SELECT
            project_id,
            project_name,
            owner_employee_code,
            status
          FROM dbo.projects
          ORDER BY project_id DESC
        `),
        pool.request().query(`
          SELECT
            finance_id,
            project_id,
            entry_type,
            amount,
            status,
            note
          FROM dbo.finances
          ORDER BY finance_id DESC
        `),
        pool.request().query(`
          SELECT
            task_id,
            task_title,
            status
          FROM dbo.tasks
          ORDER BY task_id DESC
        `),
        pool.request().query(`
          SELECT
            meeting_id,
            meeting_title,
            meeting_date,
            start_time,
            location_or_link,
            notes
          FROM dbo.meetings
          ORDER BY meeting_id DESC
        `),
        pool.request().query(`
          SELECT
            schedule_id,
            schedule_range,
            schedule_day,
            title,
            note,
            color
          FROM dbo.schedules
          ORDER BY schedule_id DESC
        `),
        pool.request()
          .input("holiday_year", sql.Int, CURRENT_YEAR)
          .query(`
            SELECT N'CL' AS holiday_name,
                   1 AS holiday_id,
                   SUM(CASE WHEN holiday_status = 0 THEN 1 ELSE 0 END) AS used_total,
                   COUNT(*) AS total_count
            FROM dbo.CL_Holiday
            WHERE holiday_year = @holiday_year
            UNION ALL
            SELECT N'PL', 2,
                   SUM(CASE WHEN holiday_status = 0 THEN 1 ELSE 0 END),
                   COUNT(*)
            FROM dbo.PL_Holiday
            WHERE holiday_year = @holiday_year
            UNION ALL
            SELECT N'Unpaid', 3,
                   SUM(CASE WHEN holiday_status = 0 THEN 1 ELSE 0 END),
                   COUNT(*)
            FROM dbo.Unpaid_Holiday
            WHERE holiday_year = @holiday_year
          `)
      ]);

      return {
        users: usersResult.recordset.map((row) => ({
          id: Number(row.id || 0),
          name: row.employee_name,
          role: row.designation,
          type: row.department_name || "Department"
        })),
        projects: projectsResult.recordset.map((row) => ({
          id: Number(row.project_id),
          name: row.project_name,
          ownerId: Number(String(row.owner_employee_code || "").replace(/\D+/g, "") || 0),
          status: row.status
        })),
        holidays: holidayResult.recordset.map((row) => ({
          id: Number(row.holiday_id),
          name: row.holiday_name,
          used: Number(row.used_total || 0),
          total: Number(row.total_count || 12)
        })),
        todos: todoResult.recordset.map((row) => ({
          id: Number(row.task_id),
          text: row.task_title,
          done: /done|completed|closed/i.test(String(row.status || ""))
        })),
        meetings: meetingResult.recordset.map((row) => ({
          id: Number(row.meeting_id),
          title: row.meeting_title,
          meta: [row.meeting_date?.toISOString?.().slice(0, 10), String(row.start_time || "").slice(0, 5), row.location_or_link].filter(Boolean).join(" | "),
          notes: row.notes || ""
        })),
        schedules: scheduleResult.recordset.map((row) => ({
          id: Number(row.schedule_id),
          range: row.schedule_range,
          day: row.schedule_day,
          title: row.title,
          note: row.note,
          color: row.color
        })),
        finances: financeResult.recordset.map((row) => ({
          id: Number(row.finance_id),
          projectId: Number(row.project_id),
          type: row.entry_type,
          amount: Number(row.amount),
          status: row.status,
          note: row.note || ""
        }))
      };
    },
    async validateLogin(username, password) {
      const pool = await getPool();
      const result = await pool.request()
        .input("username", sql.NVarChar(50), username)
        .input("password", sql.NVarChar(255), password)
        .query(`
          SELECT TOP 1
            username,
            employee_code,
            designation
          FROM dbo.users
          WHERE username = @username
            AND password_hash = @password
            AND is_active = 1
        `);

      const user = result.recordset[0];
      if (!user) {
        const adminUser = process.env.DEMO_ADMIN_USERNAME || "admin";
        const adminPassword = process.env.DEMO_ADMIN_PASSWORD || "admin";
        if (username === adminUser && password === adminPassword) {
          return { username, role: "Administrator" };
        }
        return null;
      }

      return {
        username: user.username,
        role: user.designation || "User",
        employeeCode: user.employee_code
      };
    },
    async createUser(payload) {
      const nextId = await nextEmployeeIdentity();
      const employeeCode = `EMP${String(nextId).padStart(3, "0")}`;
      const names = splitName(payload.name);
      const designation = await getDesignation(payload.role);
      const departmentId = await getDepartmentIdByType(payload.type);
      const username = `${slugify(payload.name)}${nextId}`;
      const pool = await getPool();

      await pool.request()
        .input("employee_code", sql.NVarChar(20), employeeCode)
        .input("username", sql.NVarChar(50), username)
        .input("password_hash", sql.NVarChar(255), username)
        .input("employee_first_name", sql.NVarChar(100), names.first)
        .input("employee_middle_name", sql.NVarChar(100), names.middle)
        .input("employee_last_name", sql.NVarChar(100), names.last)
        .input("designation", sql.NVarChar(50), payload.role)
        .input("designation_id", sql.Int, designation.designation_id)
        .input("department_id", sql.Int, departmentId)
        .query(`
          INSERT INTO dbo.users (
            employee_code,
            username,
            password_hash,
            employee_first_name,
            employee_middle_name,
            employee_last_name,
            designation,
            designation_id,
            department_id
          )
          VALUES (
            @employee_code,
            @username,
            @password_hash,
            @employee_first_name,
            @employee_middle_name,
            @employee_last_name,
            @designation,
            @designation_id,
            @department_id
          )
        `);

      return {
        id: nextId,
        name: payload.name,
        role: payload.role,
        type: payload.type
      };
    },
    async createProject(payload) {
      const ownerCode = await resolveEmployeeCode(payload.ownerId);
      if (!ownerCode) {
        throw new Error("No users are available to own the project.");
      }

      const pool = await getPool();
      const result = await pool.request()
        .input("project_name", sql.NVarChar(200), payload.name)
        .input("owner_employee_code", sql.NVarChar(20), ownerCode)
        .input("manager_employee_code", sql.NVarChar(20), ownerCode)
        .input("status", sql.NVarChar(50), payload.status)
        .input("created_by_employee_code", sql.NVarChar(20), ownerCode)
        .query(`
          INSERT INTO dbo.projects (
            project_name,
            project_code,
            owner_employee_code,
            manager_employee_code,
            status,
            created_by_employee_code
          )
          OUTPUT inserted.project_id
          VALUES (
            @project_name,
            CONCAT(N'PRJ', RIGHT(CONCAT(N'000', ISNULL((SELECT COUNT(*) + 1 FROM dbo.projects), 1)), 3)),
            @owner_employee_code,
            @manager_employee_code,
            @status,
            @created_by_employee_code
          )
        `);

      return {
        id: Number(result.recordset[0].project_id),
        name: payload.name,
        ownerId: Number(payload.ownerId),
        status: payload.status
      };
    },
    async createFinance(payload) {
      const createdByCode = await getFirstActiveEmployeeCode();
      const pool = await getPool();
      const result = await pool.request()
        .input("project_id", sql.Int, payload.projectId)
        .input("entry_type", sql.NVarChar(30), payload.type)
        .input("category", sql.NVarChar(50), payload.type)
        .input("amount", sql.Decimal(18, 2), payload.amount)
        .input("entry_date", sql.Date, new Date())
        .input("status", sql.NVarChar(30), payload.status)
        .input("note", sql.NVarChar(500), payload.note)
        .input("created_by_employee_code", sql.NVarChar(20), createdByCode)
        .query(`
          INSERT INTO dbo.finances (
            project_id,
            entry_type,
            category,
            amount,
            entry_date,
            status,
            note,
            created_by_employee_code
          )
          OUTPUT inserted.finance_id
          VALUES (
            @project_id,
            @entry_type,
            @category,
            @amount,
            @entry_date,
            @status,
            @note,
            @created_by_employee_code
          )
        `);

      return {
        id: Number(result.recordset[0].finance_id),
        projectId: payload.projectId,
        type: payload.type,
        amount: payload.amount,
        status: payload.status,
        note: payload.note
      };
    },
    async updateFinance(id, payload) {
      const pool = await getPool();
      const result = await pool.request()
        .input("finance_id", sql.Int, id)
        .input("project_id", sql.Int, payload.projectId ?? null)
        .input("entry_type", sql.NVarChar(30), payload.type ?? null)
        .input("amount", sql.Decimal(18, 2), payload.amount ?? null)
        .input("status", sql.NVarChar(30), payload.status ?? null)
        .input("note", sql.NVarChar(500), payload.note ?? null)
        .query(`
          UPDATE dbo.finances
          SET
            project_id = COALESCE(@project_id, project_id),
            entry_type = COALESCE(@entry_type, entry_type),
            category = COALESCE(@entry_type, category),
            amount = COALESCE(@amount, amount),
            status = COALESCE(@status, status),
            note = COALESCE(@note, note)
          OUTPUT inserted.finance_id, inserted.project_id, inserted.entry_type, inserted.amount, inserted.status, inserted.note
          WHERE finance_id = @finance_id
        `);

      const row = result.recordset[0];
      if (!row) {
        return null;
      }

      return {
        id: Number(row.finance_id),
        projectId: Number(row.project_id),
        type: row.entry_type,
        amount: Number(row.amount),
        status: row.status,
        note: row.note || ""
      };
    },
    async deleteFinance(id) {
      const pool = await getPool();
      const result = await pool.request()
        .input("finance_id", sql.Int, id)
        .query(`
          DELETE FROM dbo.finances
          OUTPUT deleted.finance_id
          WHERE finance_id = @finance_id
        `);

      return Boolean(result.recordset[0]);
    },
    async createHoliday(payload) {
      const mapping = resolveHolidayTable(null, payload.name);
      if (!mapping) {
        throw new Error("Use CL, PL, or Unpaid as the holiday name.");
      }

      await syncHolidayTable(mapping.table, payload.total, payload.used);
      return {
        id: mapping.table === "CL_Holiday" ? 1 : mapping.table === "PL_Holiday" ? 2 : 3,
        name: mapping.displayName,
        used: payload.used,
        total: Math.max(Number(payload.total) || 0, 12)
      };
    },
    async updateHoliday(id, payload) {
      const mapping = resolveHolidayTable(id, payload.name);
      if (!mapping) {
        return null;
      }

      await syncHolidayTable(mapping.table, payload.total, payload.used);
      return {
        id: Number(id),
        name: mapping.displayName,
        used: payload.used,
        total: Math.max(Number(payload.total) || 0, 12)
      };
    },
    async createSchedule(payload) {
      await ensureSupportTables();
      const pool = await getPool();
      const result = await pool.request()
        .input("schedule_range", sql.NVarChar(50), payload.range)
        .input("schedule_day", sql.NVarChar(50), payload.day)
        .input("title", sql.NVarChar(200), payload.title)
        .input("note", sql.NVarChar(500), payload.note)
        .input("color", sql.NVarChar(20), payload.color)
        .query(`
          INSERT INTO dbo.schedules (schedule_range, schedule_day, title, note, color)
          OUTPUT inserted.schedule_id
          VALUES (@schedule_range, @schedule_day, @title, @note, @color)
        `);

      return {
        id: Number(result.recordset[0].schedule_id),
        range: payload.range,
        day: payload.day,
        title: payload.title,
        note: payload.note,
        color: payload.color
      };
    },
    async updateSchedule(id, payload) {
      await ensureSupportTables();
      const pool = await getPool();
      const result = await pool.request()
        .input("schedule_id", sql.Int, id)
        .input("schedule_range", sql.NVarChar(50), payload.range ?? null)
        .input("schedule_day", sql.NVarChar(50), payload.day ?? null)
        .input("title", sql.NVarChar(200), payload.title ?? null)
        .input("note", sql.NVarChar(500), payload.note ?? null)
        .input("color", sql.NVarChar(20), payload.color ?? null)
        .query(`
          UPDATE dbo.schedules
          SET
            schedule_range = COALESCE(@schedule_range, schedule_range),
            schedule_day = COALESCE(@schedule_day, schedule_day),
            title = COALESCE(@title, title),
            note = COALESCE(@note, note),
            color = COALESCE(@color, color),
            updated_at = SYSDATETIME()
          OUTPUT inserted.schedule_id, inserted.schedule_range, inserted.schedule_day, inserted.title, inserted.note, inserted.color
          WHERE schedule_id = @schedule_id
        `);

      const row = result.recordset[0];
      if (!row) {
        return null;
      }

      return {
        id: Number(row.schedule_id),
        range: row.schedule_range,
        day: row.schedule_day,
        title: row.title,
        note: row.note,
        color: row.color
      };
    },
    async deleteSchedule(id) {
      await ensureSupportTables();
      const pool = await getPool();
      const result = await pool.request()
        .input("schedule_id", sql.Int, id)
        .query(`
          DELETE FROM dbo.schedules
          OUTPUT deleted.schedule_id
          WHERE schedule_id = @schedule_id
        `);

      return Boolean(result.recordset[0]);
    },
    async createTodo(payload) {
      const assignedByCode = await getFirstActiveEmployeeCode();
      if (!assignedByCode) {
        throw new Error("Add at least one user before creating tasks.");
      }

      const pool = await getPool();
      const result = await pool.request()
        .input("task_title", sql.NVarChar(200), payload.text)
        .input("assigned_by_employee_code", sql.NVarChar(20), assignedByCode)
        .query(`
          INSERT INTO dbo.tasks (task_title, assigned_by_employee_code)
          OUTPUT inserted.task_id
          VALUES (@task_title, @assigned_by_employee_code)
        `);

      return {
        id: Number(result.recordset[0].task_id),
        text: payload.text,
        done: false
      };
    },
    async updateTodo(id, payload) {
      const pool = await getPool();
      const result = await pool.request()
        .input("task_id", sql.Int, id)
        .input("status", sql.NVarChar(30), payload.done ? "Completed" : "Open")
        .query(`
          UPDATE dbo.tasks
          SET
            status = @status,
            updated_at = SYSDATETIME()
          OUTPUT inserted.task_id, inserted.task_title, inserted.status
          WHERE task_id = @task_id
        `);

      const row = result.recordset[0];
      if (!row) {
        return null;
      }

      return {
        id: Number(row.task_id),
        text: row.task_title,
        done: /done|completed|closed/i.test(String(row.status || ""))
      };
    },
    async deleteTodo(id) {
      const pool = await getPool();
      const result = await pool.request()
        .input("task_id", sql.Int, id)
        .query(`
          DELETE FROM dbo.tasks
          OUTPUT deleted.task_id
          WHERE task_id = @task_id
        `);

      return Boolean(result.recordset[0]);
    },
    async updateMeeting(id, payload) {
      const pool = await getPool();
      const result = await pool.request()
        .input("meeting_id", sql.Int, id)
        .input("notes", sql.NVarChar(sql.MAX), payload.notes ?? null)
        .query(`
          UPDATE dbo.meetings
          SET
            notes = COALESCE(@notes, notes),
            updated_at = SYSDATETIME()
          OUTPUT inserted.meeting_id, inserted.meeting_title, inserted.meeting_date, inserted.start_time, inserted.location_or_link, inserted.notes
          WHERE meeting_id = @meeting_id
        `);

      const row = result.recordset[0];
      if (!row) {
        return null;
      }

      return {
        id: Number(row.meeting_id),
        title: row.meeting_title,
        meta: [row.meeting_date?.toISOString?.().slice(0, 10), String(row.start_time || "").slice(0, 5), row.location_or_link].filter(Boolean).join(" | "),
        notes: row.notes || ""
      };
    }
  };
}

module.exports = { createSqlServerStore };
