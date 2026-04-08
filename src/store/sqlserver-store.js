const sql = require("mssql");

function normalizeText(value) {
  return String(value || "").trim();
}

function splitName(name) {
  const parts = normalizeText(name).split(/\s+/).filter(Boolean);
  return {
    first: parts[0] || "User",
    last: parts.length > 1 ? parts.slice(1).join(" ") : null
  };
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20) || "user";
}

function buildFullName(firstName, lastName) {
  return [normalizeText(firstName), normalizeText(lastName)].filter(Boolean).join(" ").trim();
}

function mapUiUserType(type) {
  const normalized = normalizeText(type).toLowerCase();
  if (normalized === "individual" || normalized === "single user") return "Single User";
  if (normalized === "team" || normalized === "multi user") return "Multi User";
  if (normalized === "corporate") return "Corporate";
  if (normalized === "government") return "Government";
  return "Single User";
}

function pickDefaultScheduleType(type) {
  const normalized = normalizeText(type).toLowerCase();
  if (normalized === "corporate" || normalized === "government") return "Monthly";
  if (normalized === "team" || normalized === "multi user") return "Weekly";
  return "Daily";
}

function toDashboardRange(scheduleType) {
  const normalized = normalizeText(scheduleType).toLowerCase();
  if (normalized === "daily") return "daily";
  if (normalized === "monthly") return "monthly";
  return "weekly";
}

function formatMeetingMeta(row) {
  const meta = [];
  if (row.meetingDate instanceof Date) {
    meta.push(row.meetingDate.toISOString().slice(0, 10));
  } else if (row.meetingDate) {
    meta.push(String(row.meetingDate));
  }
  if (row.startTime) meta.push(String(row.startTime).slice(0, 5));
  if (row.meetingLink) meta.push(row.meetingLink);
  return meta.join(" | ");
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
  const tableExistsCache = new Map();

  function getPool() {
    if (!poolPromise) {
      poolPromise = sql.connect(config);
    }
    return poolPromise;
  }

  async function tableExists(tableName) {
    if (tableExistsCache.has(tableName)) {
      return tableExistsCache.get(tableName);
    }

    const pool = await getPool();
    const result = await pool.request()
      .input("table_name", sql.NVarChar(128), tableName)
      .query("SELECT CASE WHEN OBJECT_ID(N'dbo.' + @table_name, N'U') IS NULL THEN 0 ELSE 1 END AS exists_flag");

    const exists = Boolean(result.recordset[0]?.exists_flag);
    tableExistsCache.set(tableName, exists);
    return exists;
  }

  async function getActorEmpId(actor) {
    const suppliedId = Number(actor?.employeeCode || actor?.employeeId || 0);
    if (suppliedId > 0) {
      return suppliedId;
    }

    const username = normalizeText(actor?.username);
    if (!username) {
      return null;
    }

    const pool = await getPool();
    const result = await pool.request()
      .input("username", sql.NVarChar(150), username)
      .query(`
        SELECT TOP 1 EmpID
        FROM dbo.users
        WHERE EmpUsername = @username
           OR EmpEmail = @username
      `);

    return Number(result.recordset[0]?.EmpID || 0) || null;
  }

  async function getFirstEmpId() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT TOP 1 EmpID
      FROM dbo.users
      ORDER BY EmpID
    `);
    return Number(result.recordset[0]?.EmpID || 0) || null;
  }

  async function getEffectiveEmpId(actor) {
    return (await getActorEmpId(actor)) || (await getFirstEmpId());
  }

  async function getLookupId(tableName, idColumn, valueColumn, value) {
    const pool = await getPool();
    const result = await pool.request()
      .input("value", sql.NVarChar(100), value)
      .query(`
        SELECT TOP 1 ${idColumn} AS id
        FROM dbo.${tableName}
        WHERE ${valueColumn} = @value
      `);

    return Number(result.recordset[0]?.id || 0) || null;
  }

  async function getNextEmpId() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT ISNULL(MAX(EmpID), 0) + 1 AS next_id
      FROM dbo.users
    `);
    return Number(result.recordset[0]?.next_id || 1);
  }

  async function getUserNameById(empId) {
    const pool = await getPool();
    const result = await pool.request()
      .input("EmpID", sql.Int, empId)
      .query(`
        SELECT TOP 1 EmpFullName
        FROM dbo.users
        WHERE EmpID = @EmpID
      `);

    return result.recordset[0]?.EmpFullName || null;
  }

  async function getBootstrap(actor) {
    const pool = await getPool();
    const actorEmpId = await getActorEmpId(actor);

    const usersResult = await pool.request().query(`
      SELECT
        EmpID,
        EmpFullName,
        EmpDesignation,
        EmpDept,
        EmpUserTypeID,
        EmpScheduleTypeID,
        EmpUsername,
        EmpEmail,
        EmpReportingManagerID
      FROM dbo.users
      ORDER BY EmpID
    `);

    const userTypeMap = new Map();
    if (await tableExists("userType")) {
      const result = await pool.request().query(`SELECT userTypeId, userType FROM dbo.userType`);
      for (const row of result.recordset) {
        userTypeMap.set(Number(row.userTypeId), row.userType);
      }
    }

    const scheduleTypeMap = new Map();
    if (await tableExists("scheduleType")) {
      const result = await pool.request().query(`SELECT scheduleTypeId, scheduleType FROM dbo.scheduleType`);
      for (const row of result.recordset) {
        scheduleTypeMap.set(Number(row.scheduleTypeId), row.scheduleType);
      }
    }

    const users = usersResult.recordset.map((row) => ({
      id: Number(row.EmpID),
      name: row.EmpFullName || row.EmpUsername || `User ${row.EmpID}`,
      role: row.EmpDesignation || "Employee",
      type: userTypeMap.get(Number(row.EmpUserTypeID)) || row.EmpDept || "User",
      username: row.EmpUsername,
      email: row.EmpEmail || "",
      department: row.EmpDept || "",
      managerId: row.EmpReportingManagerID == null ? null : Number(row.EmpReportingManagerID),
      scheduleType: scheduleTypeMap.get(Number(row.EmpScheduleTypeID)) || ""
    }));

    let projects = [];
    if (await tableExists("employeeProject")) {
      const request = pool.request();
      let query = `SELECT projectId, EmpID, projectName, projectStatus FROM dbo.employeeProject`;
      if (actorEmpId) {
        request.input("EmpID", sql.Int, actorEmpId);
        query += ` WHERE EmpID = @EmpID`;
      }
      query += ` ORDER BY projectId DESC`;
      const result = await request.query(query);
      projects = result.recordset.map((row) => ({
        id: Number(row.projectId),
        name: row.projectName,
        ownerId: Number(row.EmpID),
        status: row.projectStatus || "Planned"
      }));
    }

    let schedules = [];
    if (await tableExists("employeeSchedule")) {
      const request = pool.request();
      let query = `
        SELECT
          s.scheduleId,
          s.EmpID,
          s.scheduleTitle,
          s.scheduleNote,
          s.scheduleDay,
          s.startTime,
          s.endTime,
          st.scheduleType
        FROM dbo.employeeSchedule s
        LEFT JOIN dbo.scheduleType st ON s.scheduleTypeId = st.scheduleTypeId
      `;
      if (actorEmpId) {
        request.input("EmpID", sql.Int, actorEmpId);
        query += ` WHERE s.EmpID = @EmpID`;
      }
      query += ` ORDER BY s.scheduleId DESC`;
      const result = await request.query(query);
      schedules = result.recordset.map((row) => ({
        id: Number(row.scheduleId),
        range: toDashboardRange(row.scheduleType),
        day: row.scheduleDay || "",
        title: row.scheduleTitle,
        note: row.scheduleNote || [String(row.startTime || "").slice(0, 5), String(row.endTime || "").slice(0, 5)].filter(Boolean).join(" - "),
        color: "#2563eb"
      }));
    }

    let meetings = [];
    if (await tableExists("employeeMeeting")) {
      const request = pool.request();
      let query = `
        SELECT
          meetingId,
          EmpID,
          meetingTitle,
          meetingDescription,
          meetingDate,
          startTime,
          endTime,
          meetingLink
        FROM dbo.employeeMeeting
      `;
      if (actorEmpId) {
        request.input("EmpID", sql.Int, actorEmpId);
        query += ` WHERE EmpID = @EmpID`;
      }
      query += ` ORDER BY meetingId DESC`;
      const result = await request.query(query);
      meetings = result.recordset.map((row) => ({
        id: Number(row.meetingId),
        title: row.meetingTitle,
        meta: formatMeetingMeta(row),
        notes: row.meetingDescription || ""
      }));
    }

    let holidays = [];
    if (await tableExists("CL_Holiday") && await tableExists("PL_Holiday") && await tableExists("Unpaid_Holiday")) {
      const currentYear = new Date().getFullYear();
      const request = pool.request().input("holiday_year", sql.Int, currentYear);
      let filter = "";
      if (actorEmpId) {
        request.input("EmpID", sql.Int, actorEmpId);
        filter = ` AND employee_code = CONCAT(N'EMP', RIGHT(CONCAT(N'000', CAST(@EmpID AS NVARCHAR(10))), 3))`;
      }
      const result = await request.query(`
        SELECT N'CL' AS holiday_name, 1 AS holiday_id,
               SUM(CASE WHEN holiday_status = 0 THEN 1 ELSE 0 END) AS used_total,
               COUNT(*) AS total_count
        FROM dbo.CL_Holiday
        WHERE holiday_year = @holiday_year${filter}
        UNION ALL
        SELECT N'PL', 2,
               SUM(CASE WHEN holiday_status = 0 THEN 1 ELSE 0 END),
               COUNT(*)
        FROM dbo.PL_Holiday
        WHERE holiday_year = @holiday_year${filter}
        UNION ALL
        SELECT N'Unpaid', 3,
               SUM(CASE WHEN holiday_status = 0 THEN 1 ELSE 0 END),
               COUNT(*)
        FROM dbo.Unpaid_Holiday
        WHERE holiday_year = @holiday_year${filter}
      `);
      holidays = result.recordset.map((row) => ({
        id: Number(row.holiday_id),
        name: row.holiday_name,
        used: Number(row.used_total || 0),
        total: Number(row.total_count || 0)
      }));
    }

    return {
      users,
      projects,
      holidays,
      todos: [],
      meetings,
      schedules,
      finances: []
    };
  }

  async function validateLogin(username, password) {
    const pool = await getPool();
    const result = await pool.request()
      .input("username", sql.NVarChar(150), normalizeText(username))
      .input("password", sql.NVarChar(255), String(password || ""))
      .query(`
        SELECT TOP 1
          EmpID,
          EmpUsername,
          EmpFullName,
          EmpDesignation
        FROM dbo.users
        WHERE (EmpUsername = @username OR EmpEmail = @username)
          AND EmpPassword = @password
      `);

    const user = result.recordset[0];
    if (!user) {
      const adminUser = process.env.DEMO_ADMIN_USERNAME || "admin";
      const adminPassword = process.env.DEMO_ADMIN_PASSWORD || "admin";
      if (username === adminUser && password === adminPassword) {
        return { username, role: "Administrator", employeeCode: null, name: "Administrator" };
      }
      return null;
    }

    return {
      username: user.EmpUsername,
      role: user.EmpDesignation || "User",
      employeeCode: String(user.EmpID),
      employeeId: Number(user.EmpID),
      name: user.EmpFullName || user.EmpUsername
    };
  }

  async function createUser(payload, actor) {
    const nextId = await getNextEmpId();
    const names = splitName(payload.name);
    const username = `${slugify(payload.name)}${nextId}`;
    const userTypeName = mapUiUserType(payload.type);
    const scheduleTypeName = pickDefaultScheduleType(payload.type);
    const fullName = buildFullName(names.first, names.last);
    const actorEmpId = await getActorEmpId(actor);
    const actorName = actorEmpId ? await getUserNameById(actorEmpId) : null;
    const userTypeId = await getLookupId("userType", "userTypeId", "userType", userTypeName);
    const scheduleTypeId = await getLookupId("scheduleType", "scheduleTypeId", "scheduleType", scheduleTypeName);
    const designationId = (await tableExists("designation"))
      ? await getLookupId("designation", "DesignationID", "DesignationName", payload.role)
      : null;

    const pool = await getPool();
    const result = await pool.request()
      .input("EmpCompany", sql.NVarChar(150), "Schedule Tracker")
      .input("EmpDesignation", sql.NVarChar(100), payload.role)
      .input("EmpDesignationID", sql.Int, designationId)
      .input("EmpFirstName", sql.NVarChar(100), names.first)
      .input("EmpLastName", sql.NVarChar(100), names.last)
      .input("EmpFullName", sql.NVarChar(250), fullName)
      .input("EmpUserTypeID", sql.Int, userTypeId)
      .input("EmpScheduleTypeID", sql.Int, scheduleTypeId)
      .input("EmpUsername", sql.NVarChar(50), username)
      .input("EmpPassword", sql.NVarChar(255), username)
      .input("EmpDept", sql.NVarChar(100), null)
      .input("EmpDeptID", sql.Int, null)
      .input("EmpReportingManager", sql.NVarChar(250), actorName)
      .input("EmpReportingManagerID", sql.Int, actorEmpId)
      .input("EmpEmail", sql.NVarChar(150), `${username}@example.com`)
      .query(`
        INSERT INTO dbo.users (
          EmpCompany,
          EmpDesignation,
          EmpDesignationID,
          EmpFirstName,
          EmpLastName,
          EmpFullName,
          EmpUserTypeID,
          EmpScheduleTypeID,
          EmpUsername,
          EmpPassword,
          EmpDept,
          EmpDeptID,
          EmpReportingManager,
          EmpReportingManagerID,
          EmpEmail
        )
        OUTPUT inserted.EmpID
        VALUES (
          @EmpCompany,
          @EmpDesignation,
          @EmpDesignationID,
          @EmpFirstName,
          @EmpLastName,
          @EmpFullName,
          @EmpUserTypeID,
          @EmpScheduleTypeID,
          @EmpUsername,
          @EmpPassword,
          @EmpDept,
          @EmpDeptID,
          @EmpReportingManager,
          @EmpReportingManagerID,
          @EmpEmail
        )
      `);

    return {
      id: Number(result.recordset[0].EmpID),
      name: fullName,
      role: payload.role,
      type: userTypeName,
      username
    };
  }

  async function createProject(payload, actor) {
    if (!(await tableExists("employeeProject"))) {
      throw new Error("employeeProject table is not available in the database.");
    }

    const ownerId = Number(payload.ownerId) || await getEffectiveEmpId(actor);
    const pool = await getPool();
    const result = await pool.request()
      .input("EmpID", sql.Int, ownerId)
      .input("projectName", sql.NVarChar(200), payload.name)
      .input("projectDescription", sql.NVarChar(500), `${payload.status} project`)
      .input("projectStatus", sql.NVarChar(50), payload.status)
      .query(`
        INSERT INTO dbo.employeeProject (
          EmpID,
          projectName,
          projectDescription,
          projectStatus
        )
        OUTPUT inserted.projectId
        VALUES (
          @EmpID,
          @projectName,
          @projectDescription,
          @projectStatus
        )
      `);

    return {
      id: Number(result.recordset[0].projectId),
      name: payload.name,
      ownerId,
      status: payload.status
    };
  }

  async function createSchedule(payload, actor) {
    if (!(await tableExists("employeeSchedule"))) {
      throw new Error("employeeSchedule table is not available in the database.");
    }

    const empId = await getEffectiveEmpId(actor);
    if (!empId) {
      throw new Error("No employee is available for schedule creation.");
    }

    const scheduleTypeId = await getLookupId("scheduleType", "scheduleTypeId", "scheduleType", `${payload.range[0].toUpperCase()}${payload.range.slice(1)}`);
    const pool = await getPool();
    const result = await pool.request()
      .input("EmpID", sql.Int, empId)
      .input("scheduleTypeId", sql.Int, scheduleTypeId)
      .input("scheduleTitle", sql.NVarChar(200), payload.title)
      .input("scheduleNote", sql.NVarChar(500), payload.note)
      .input("scheduleDay", sql.NVarChar(20), payload.day)
      .query(`
        INSERT INTO dbo.employeeSchedule (
          EmpID,
          scheduleTypeId,
          scheduleTitle,
          scheduleNote,
          scheduleDay
        )
        OUTPUT inserted.scheduleId
        VALUES (
          @EmpID,
          @scheduleTypeId,
          @scheduleTitle,
          @scheduleNote,
          @scheduleDay
        )
      `);

    return {
      id: Number(result.recordset[0].scheduleId),
      range: payload.range,
      day: payload.day,
      title: payload.title,
      note: payload.note,
      color: payload.color
    };
  }

  async function updateSchedule(id, payload, actor) {
    if (!(await tableExists("employeeSchedule"))) {
      return null;
    }

    const empId = await getActorEmpId(actor);
    const scheduleTypeId = payload.range
      ? await getLookupId("scheduleType", "scheduleTypeId", "scheduleType", `${payload.range[0].toUpperCase()}${payload.range.slice(1)}`)
      : null;
    const pool = await getPool();
    const request = pool.request()
      .input("scheduleId", sql.Int, Number(id))
      .input("scheduleTypeId", sql.Int, scheduleTypeId)
      .input("scheduleTitle", sql.NVarChar(200), payload.title ?? null)
      .input("scheduleNote", sql.NVarChar(500), payload.note ?? null)
      .input("scheduleDay", sql.NVarChar(20), payload.day ?? null);
    if (empId) {
      request.input("EmpID", sql.Int, empId);
    }

    const result = await request.query(`
      UPDATE dbo.employeeSchedule
      SET
        scheduleTypeId = COALESCE(@scheduleTypeId, scheduleTypeId),
        scheduleTitle = COALESCE(@scheduleTitle, scheduleTitle),
        scheduleNote = COALESCE(@scheduleNote, scheduleNote),
        scheduleDay = COALESCE(@scheduleDay, scheduleDay)
      OUTPUT inserted.scheduleId, inserted.scheduleTitle, inserted.scheduleNote, inserted.scheduleDay
      WHERE scheduleId = @scheduleId
        ${empId ? "AND EmpID = @EmpID" : ""}
    `);

    const row = result.recordset[0];
    if (!row) {
      return null;
    }

    return {
      id: Number(row.scheduleId),
      range: payload.range || "weekly",
      day: row.scheduleDay || "",
      title: row.scheduleTitle,
      note: row.scheduleNote || "",
      color: payload.color || "#2563eb"
    };
  }

  async function deleteSchedule(id, actor) {
    if (!(await tableExists("employeeSchedule"))) {
      return false;
    }

    const empId = await getActorEmpId(actor);
    const pool = await getPool();
    const request = pool.request().input("scheduleId", sql.Int, Number(id));
    if (empId) {
      request.input("EmpID", sql.Int, empId);
    }

    const result = await request.query(`
      DELETE FROM dbo.employeeSchedule
      OUTPUT deleted.scheduleId
      WHERE scheduleId = @scheduleId
        ${empId ? "AND EmpID = @EmpID" : ""}
    `);

    return Boolean(result.recordset[0]);
  }

  async function updateMeeting(id, payload, actor) {
    if (!(await tableExists("employeeMeeting"))) {
      return null;
    }

    const empId = await getActorEmpId(actor);
    const pool = await getPool();
    const request = pool.request()
      .input("meetingId", sql.Int, Number(id))
      .input("meetingDescription", sql.NVarChar(500), payload.notes ?? null);
    if (empId) {
      request.input("EmpID", sql.Int, empId);
    }

    const result = await request.query(`
      UPDATE dbo.employeeMeeting
      SET meetingDescription = COALESCE(@meetingDescription, meetingDescription)
      OUTPUT
        inserted.meetingId,
        inserted.meetingTitle,
        inserted.meetingDescription,
        inserted.meetingDate,
        inserted.startTime,
        inserted.endTime,
        inserted.meetingLink
      WHERE meetingId = @meetingId
        ${empId ? "AND EmpID = @EmpID" : ""}
    `);

    const row = result.recordset[0];
    if (!row) {
      return null;
    }

    return {
      id: Number(row.meetingId),
      title: row.meetingTitle,
      meta: formatMeetingMeta(row),
      notes: row.meetingDescription || ""
    };
  }

  function unsupported(featureName) {
    return async () => {
      throw new Error(`${featureName} is not connected to the current database schema yet.`);
    };
  }

  return {
    provider: "sqlserver",
    getBootstrap,
    validateLogin,
    createUser,
    createProject,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    updateMeeting,
    createFinance: unsupported("Finance"),
    updateFinance: unsupported("Finance"),
    deleteFinance: unsupported("Finance"),
    createHoliday: unsupported("Holiday"),
    updateHoliday: unsupported("Holiday"),
    createTodo: unsupported("Task"),
    updateTodo: unsupported("Task"),
    deleteTodo: unsupported("Task")
  };
}

module.exports = { createSqlServerStore };
