USE ScheduleTracker;
GO

SET NOCOUNT ON;
GO

/*
  Safe bootstrap for the ScheduleTracker app.

  What this script does:
  1. Keeps your existing identity/master tables in place.
  2. Creates the app tables that the current Node app expects.
  3. Seeds reference data and dummy records if they are missing.

  What this script does NOT do:
  - It does not drop dbo.users / dbo.departments / dbo.designations.
  - It does not delete your existing data.

  Recommended approach:
  - Keep dbo.users as the login/source-of-truth table.
  - Link app data to users with employee_code.
  - Use shared tables with owner columns, not one table per user.
*/

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID(N'dbo.departments', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.departments (
      department_id INT IDENTITY(1,1) PRIMARY KEY,
      department_code NVARCHAR(20) NOT NULL UNIQUE,
      department_name NVARCHAR(100) NOT NULL,
      is_active BIT NOT NULL CONSTRAINT DF_departments_is_active DEFAULT (1),
      created_at DATETIME2 NOT NULL CONSTRAINT DF_departments_created_at DEFAULT (SYSDATETIME())
    );
  END;

  IF OBJECT_ID(N'dbo.designations', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.designations (
      designation_id INT IDENTITY(1,1) PRIMARY KEY,
      designation_name NVARCHAR(100) NOT NULL UNIQUE,
      is_active BIT NOT NULL CONSTRAINT DF_designations_is_active DEFAULT (1),
      created_at DATETIME2 NOT NULL CONSTRAINT DF_designations_created_at DEFAULT (SYSDATETIME())
    );
  END;

  IF OBJECT_ID(N'dbo.access_levels', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.access_levels (
      access_level_id INT IDENTITY(1,1) PRIMARY KEY,
      access_level_name NVARCHAR(50) NOT NULL UNIQUE,
      created_at DATETIME2 NOT NULL CONSTRAINT DF_access_levels_created_at DEFAULT (SYSDATETIME())
    );
  END;

  IF OBJECT_ID(N'dbo.users', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.users (
      user_id INT IDENTITY(1,1) PRIMARY KEY,
      employee_code NVARCHAR(20) NOT NULL UNIQUE,
      username NVARCHAR(50) NOT NULL UNIQUE,
      password_hash NVARCHAR(255) NOT NULL,
      employee_first_name NVARCHAR(100) NOT NULL,
      employee_middle_name NVARCHAR(100) NULL,
      employee_last_name NVARCHAR(100) NULL,
      designation NVARCHAR(100) NULL,
      designation_id INT NULL,
      department_id INT NULL,
      is_active BIT NOT NULL CONSTRAINT DF_users_is_active DEFAULT (1),
      created_at DATETIME2 NOT NULL CONSTRAINT DF_users_created_at DEFAULT (SYSDATETIME()),
      updated_at DATETIME2 NOT NULL CONSTRAINT DF_users_updated_at DEFAULT (SYSDATETIME())
    );
  END;

  IF COL_LENGTH(N'dbo.users', N'employee_code') IS NULL
  BEGIN
    ALTER TABLE dbo.users ADD employee_code NVARCHAR(20) NULL;
  END;

  IF COL_LENGTH(N'dbo.users', N'username') IS NULL
  BEGIN
    ALTER TABLE dbo.users ADD username NVARCHAR(50) NULL;
  END;

  IF COL_LENGTH(N'dbo.users', N'password_hash') IS NULL
  BEGIN
    ALTER TABLE dbo.users ADD password_hash NVARCHAR(255) NULL;
  END;

  IF COL_LENGTH(N'dbo.users', N'employee_first_name') IS NULL
  BEGIN
    ALTER TABLE dbo.users ADD employee_first_name NVARCHAR(100) NULL;
  END;

  IF COL_LENGTH(N'dbo.users', N'employee_middle_name') IS NULL
  BEGIN
    ALTER TABLE dbo.users ADD employee_middle_name NVARCHAR(100) NULL;
  END;

  IF COL_LENGTH(N'dbo.users', N'employee_last_name') IS NULL
  BEGIN
    ALTER TABLE dbo.users ADD employee_last_name NVARCHAR(100) NULL;
  END;

  IF COL_LENGTH(N'dbo.users', N'designation') IS NULL
  BEGIN
    ALTER TABLE dbo.users ADD designation NVARCHAR(100) NULL;
  END;

  IF COL_LENGTH(N'dbo.users', N'designation_id') IS NULL
  BEGIN
    ALTER TABLE dbo.users ADD designation_id INT NULL;
  END;

  IF COL_LENGTH(N'dbo.users', N'department_id') IS NULL
  BEGIN
    ALTER TABLE dbo.users ADD department_id INT NULL;
  END;

  IF COL_LENGTH(N'dbo.users', N'is_active') IS NULL
  BEGIN
    ALTER TABLE dbo.users ADD is_active BIT NOT NULL CONSTRAINT DF_users_is_active_added DEFAULT (1);
  END;

  IF COL_LENGTH(N'dbo.users', N'created_at') IS NULL
  BEGIN
    ALTER TABLE dbo.users ADD created_at DATETIME2 NOT NULL CONSTRAINT DF_users_created_at_added DEFAULT (SYSDATETIME());
  END;

  IF COL_LENGTH(N'dbo.users', N'updated_at') IS NULL
  BEGIN
    ALTER TABLE dbo.users ADD updated_at DATETIME2 NOT NULL CONSTRAINT DF_users_updated_at_added DEFAULT (SYSDATETIME());
  END;

  IF OBJECT_ID(N'dbo.projects', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.projects (
      project_id INT IDENTITY(1,1) PRIMARY KEY,
      project_code NVARCHAR(30) NOT NULL UNIQUE,
      project_name NVARCHAR(200) NOT NULL,
      owner_employee_code NVARCHAR(20) NOT NULL,
      manager_employee_code NVARCHAR(20) NULL,
      status NVARCHAR(50) NOT NULL CONSTRAINT DF_projects_status DEFAULT (N'Planned'),
      created_by_employee_code NVARCHAR(20) NULL,
      start_date DATE NULL,
      target_end_date DATE NULL,
      description NVARCHAR(1000) NULL,
      created_at DATETIME2 NOT NULL CONSTRAINT DF_projects_created_at DEFAULT (SYSDATETIME()),
      updated_at DATETIME2 NOT NULL CONSTRAINT DF_projects_updated_at DEFAULT (SYSDATETIME())
    );
  END;

  IF OBJECT_ID(N'dbo.project_members', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.project_members (
      project_member_id INT IDENTITY(1,1) PRIMARY KEY,
      project_id INT NOT NULL,
      member_employee_code NVARCHAR(20) NOT NULL,
      member_role NVARCHAR(50) NOT NULL,
      created_at DATETIME2 NOT NULL CONSTRAINT DF_project_members_created_at DEFAULT (SYSDATETIME()),
      CONSTRAINT FK_project_members_project FOREIGN KEY (project_id) REFERENCES dbo.projects(project_id)
    );
  END;

  IF OBJECT_ID(N'dbo.finances', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.finances (
      finance_id INT IDENTITY(1,1) PRIMARY KEY,
      project_id INT NOT NULL,
      entry_type NVARCHAR(30) NOT NULL,
      category NVARCHAR(50) NULL,
      amount DECIMAL(18,2) NOT NULL,
      entry_date DATE NOT NULL CONSTRAINT DF_finances_entry_date DEFAULT (CAST(GETDATE() AS DATE)),
      status NVARCHAR(30) NOT NULL CONSTRAINT DF_finances_status DEFAULT (N'Planned'),
      note NVARCHAR(500) NULL,
      created_by_employee_code NVARCHAR(20) NULL,
      created_at DATETIME2 NOT NULL CONSTRAINT DF_finances_created_at DEFAULT (SYSDATETIME()),
      updated_at DATETIME2 NOT NULL CONSTRAINT DF_finances_updated_at DEFAULT (SYSDATETIME()),
      CONSTRAINT FK_finances_project FOREIGN KEY (project_id) REFERENCES dbo.projects(project_id)
    );
  END;

  IF OBJECT_ID(N'dbo.tasks', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.tasks (
      task_id INT IDENTITY(1,1) PRIMARY KEY,
      project_id INT NULL,
      task_title NVARCHAR(200) NOT NULL,
      task_description NVARCHAR(1000) NULL,
      assigned_to_employee_code NVARCHAR(20) NULL,
      assigned_by_employee_code NVARCHAR(20) NULL,
      due_date DATE NULL,
      priority NVARCHAR(20) NOT NULL CONSTRAINT DF_tasks_priority DEFAULT (N'Medium'),
      status NVARCHAR(30) NOT NULL CONSTRAINT DF_tasks_status DEFAULT (N'Open'),
      created_at DATETIME2 NOT NULL CONSTRAINT DF_tasks_created_at DEFAULT (SYSDATETIME()),
      updated_at DATETIME2 NOT NULL CONSTRAINT DF_tasks_updated_at DEFAULT (SYSDATETIME()),
      CONSTRAINT FK_tasks_project FOREIGN KEY (project_id) REFERENCES dbo.projects(project_id)
    );
  END;

  IF OBJECT_ID(N'dbo.meetings', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.meetings (
      meeting_id INT IDENTITY(1,1) PRIMARY KEY,
      meeting_title NVARCHAR(200) NOT NULL,
      meeting_date DATE NULL,
      start_time TIME(0) NULL,
      end_time TIME(0) NULL,
      location_or_link NVARCHAR(300) NULL,
      notes NVARCHAR(MAX) NULL,
      created_by_employee_code NVARCHAR(20) NULL,
      created_at DATETIME2 NOT NULL CONSTRAINT DF_meetings_created_at DEFAULT (SYSDATETIME()),
      updated_at DATETIME2 NOT NULL CONSTRAINT DF_meetings_updated_at DEFAULT (SYSDATETIME())
    );
  END;

  IF OBJECT_ID(N'dbo.meeting_participants', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.meeting_participants (
      meeting_participant_id INT IDENTITY(1,1) PRIMARY KEY,
      meeting_id INT NOT NULL,
      participant_employee_code NVARCHAR(20) NOT NULL,
      participant_role NVARCHAR(50) NOT NULL CONSTRAINT DF_meeting_participants_role DEFAULT (N'Attendee'),
      created_at DATETIME2 NOT NULL CONSTRAINT DF_meeting_participants_created_at DEFAULT (SYSDATETIME()),
      CONSTRAINT FK_meeting_participants_meeting FOREIGN KEY (meeting_id) REFERENCES dbo.meetings(meeting_id)
    );
  END;

  IF OBJECT_ID(N'dbo.schedules', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.schedules (
      schedule_id INT IDENTITY(1,1) PRIMARY KEY,
      owner_employee_code NVARCHAR(20) NOT NULL,
      schedule_range NVARCHAR(50) NOT NULL,
      schedule_day NVARCHAR(50) NOT NULL,
      title NVARCHAR(200) NOT NULL,
      note NVARCHAR(500) NOT NULL,
      color NVARCHAR(20) NOT NULL,
      created_at DATETIME2 NOT NULL CONSTRAINT DF_schedules_created_at DEFAULT (SYSDATETIME()),
      updated_at DATETIME2 NOT NULL CONSTRAINT DF_schedules_updated_at DEFAULT (SYSDATETIME())
    );
  END;

  IF COL_LENGTH(N'dbo.schedules', N'owner_employee_code') IS NULL
  BEGIN
    ALTER TABLE dbo.schedules ADD owner_employee_code NVARCHAR(20) NULL;
  END;

  IF OBJECT_ID(N'dbo.CL_Holiday', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.CL_Holiday (
      cl_holiday_id INT IDENTITY(1,1) PRIMARY KEY,
      employee_code NVARCHAR(20) NOT NULL,
      holiday_year INT NOT NULL,
      holiday_month INT NOT NULL,
      holiday_status BIT NOT NULL,
      created_at DATETIME2 NOT NULL CONSTRAINT DF_CL_Holiday_created_at DEFAULT (SYSDATETIME())
    );
  END;

  IF OBJECT_ID(N'dbo.PL_Holiday', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.PL_Holiday (
      pl_holiday_id INT IDENTITY(1,1) PRIMARY KEY,
      employee_code NVARCHAR(20) NOT NULL,
      holiday_year INT NOT NULL,
      holiday_month INT NOT NULL,
      holiday_status BIT NOT NULL,
      created_at DATETIME2 NOT NULL CONSTRAINT DF_PL_Holiday_created_at DEFAULT (SYSDATETIME())
    );
  END;

  IF OBJECT_ID(N'dbo.Unpaid_Holiday', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.Unpaid_Holiday (
      unpaid_holiday_id INT IDENTITY(1,1) PRIMARY KEY,
      employee_code NVARCHAR(20) NOT NULL,
      holiday_year INT NOT NULL,
      holiday_month INT NOT NULL,
      holiday_status BIT NOT NULL,
      created_at DATETIME2 NOT NULL CONSTRAINT DF_Unpaid_Holiday_created_at DEFAULT (SYSDATETIME())
    );
  END;

  IF NOT EXISTS (SELECT 1 FROM dbo.departments WHERE department_code = N'ADMIN')
    INSERT INTO dbo.departments (department_code, department_name) VALUES (N'ADMIN', N'Administration');

  IF NOT EXISTS (SELECT 1 FROM dbo.departments WHERE department_code = N'PMO')
    INSERT INTO dbo.departments (department_code, department_name) VALUES (N'PMO', N'Project Management Office');

  IF NOT EXISTS (SELECT 1 FROM dbo.departments WHERE department_code = N'HR')
    INSERT INTO dbo.departments (department_code, department_name) VALUES (N'HR', N'Human Resources');

  IF NOT EXISTS (SELECT 1 FROM dbo.departments WHERE department_code = N'ENG')
    INSERT INTO dbo.departments (department_code, department_name) VALUES (N'ENG', N'Engineering');

  IF NOT EXISTS (SELECT 1 FROM dbo.access_levels WHERE access_level_name = N'Admin')
    INSERT INTO dbo.access_levels (access_level_name) VALUES (N'Admin');

  IF NOT EXISTS (SELECT 1 FROM dbo.access_levels WHERE access_level_name = N'Manager')
    INSERT INTO dbo.access_levels (access_level_name) VALUES (N'Manager');

  IF NOT EXISTS (SELECT 1 FROM dbo.access_levels WHERE access_level_name = N'Employee')
    INSERT INTO dbo.access_levels (access_level_name) VALUES (N'Employee');

  DECLARE @AdminAccessLevelId INT = (SELECT TOP 1 access_level_id FROM dbo.access_levels WHERE access_level_name = N'Admin');
  DECLARE @ManagerAccessLevelId INT = (SELECT TOP 1 access_level_id FROM dbo.access_levels WHERE access_level_name = N'Manager');
  DECLARE @EmployeeAccessLevelId INT = (SELECT TOP 1 access_level_id FROM dbo.access_levels WHERE access_level_name = N'Employee');

  IF NOT EXISTS (SELECT 1 FROM dbo.designations WHERE designation_name = N'Owner')
  BEGIN
    IF COL_LENGTH(N'dbo.designations', N'access_level_id') IS NOT NULL
      INSERT INTO dbo.designations (designation_name, access_level_id) VALUES (N'Owner', @AdminAccessLevelId);
    ELSE
      INSERT INTO dbo.designations (designation_name) VALUES (N'Owner');
  END;

  IF NOT EXISTS (SELECT 1 FROM dbo.designations WHERE designation_name = N'Manager')
  BEGIN
    IF COL_LENGTH(N'dbo.designations', N'access_level_id') IS NOT NULL
      INSERT INTO dbo.designations (designation_name, access_level_id) VALUES (N'Manager', @ManagerAccessLevelId);
    ELSE
      INSERT INTO dbo.designations (designation_name) VALUES (N'Manager');
  END;

  IF NOT EXISTS (SELECT 1 FROM dbo.designations WHERE designation_name = N'Employee')
  BEGIN
    IF COL_LENGTH(N'dbo.designations', N'access_level_id') IS NOT NULL
      INSERT INTO dbo.designations (designation_name, access_level_id) VALUES (N'Employee', @EmployeeAccessLevelId);
    ELSE
      INSERT INTO dbo.designations (designation_name) VALUES (N'Employee');
  END;

  IF NOT EXISTS (SELECT 1 FROM dbo.designations WHERE designation_name = N'HR Executive')
  BEGIN
    IF COL_LENGTH(N'dbo.designations', N'access_level_id') IS NOT NULL
      INSERT INTO dbo.designations (designation_name, access_level_id) VALUES (N'HR Executive', @ManagerAccessLevelId);
    ELSE
      INSERT INTO dbo.designations (designation_name) VALUES (N'HR Executive');
  END;

  DECLARE @AdminDeptId INT = (SELECT TOP 1 department_id FROM dbo.departments WHERE department_code = N'ADMIN');
  DECLARE @PmoDeptId INT = (SELECT TOP 1 department_id FROM dbo.departments WHERE department_code = N'PMO');
  DECLARE @HrDeptId INT = (SELECT TOP 1 department_id FROM dbo.departments WHERE department_code = N'HR');
  DECLARE @EngDeptId INT = (SELECT TOP 1 department_id FROM dbo.departments WHERE department_code = N'ENG');

  DECLARE @OwnerDesignationId INT = (SELECT TOP 1 designation_id FROM dbo.designations WHERE designation_name = N'Owner');
  DECLARE @ManagerDesignationId INT = (SELECT TOP 1 designation_id FROM dbo.designations WHERE designation_name = N'Manager');
  DECLARE @EmployeeDesignationId INT = (SELECT TOP 1 designation_id FROM dbo.designations WHERE designation_name = N'Employee');
  DECLARE @HrDesignationId INT = (SELECT TOP 1 designation_id FROM dbo.designations WHERE designation_name = N'HR Executive');

  DECLARE @UserHasAccessLevel BIT = CASE WHEN COL_LENGTH(N'dbo.users', N'access_level_id') IS NOT NULL THEN 1 ELSE 0 END;
  DECLARE @UserInsertSql NVARCHAR(MAX);

  IF @UserHasAccessLevel = 1
  BEGIN
    SET @UserInsertSql = N'
      IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE username = @username)
      BEGIN
        INSERT INTO dbo.users (
          employee_code, username, password_hash, employee_first_name, employee_middle_name, employee_last_name,
          designation, designation_id, department_id, access_level_id, is_active
        )
        VALUES (
          @employee_code, @username, @password_hash, @first_name, @middle_name, @last_name,
          @designation, @designation_id, @department_id, @access_level_id, 1
        );
      END;
    ';
  END
  ELSE
  BEGIN
    SET @UserInsertSql = N'
      IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE username = @username)
      BEGIN
        INSERT INTO dbo.users (
          employee_code, username, password_hash, employee_first_name, employee_middle_name, employee_last_name,
          designation, designation_id, department_id, is_active
        )
        VALUES (
          @employee_code, @username, @password_hash, @first_name, @middle_name, @last_name,
          @designation, @designation_id, @department_id, 1
        );
      END;
    ';
  END;

  EXEC sp_executesql
    @UserInsertSql,
    N'@employee_code NVARCHAR(20), @username NVARCHAR(50), @password_hash NVARCHAR(255), @first_name NVARCHAR(100), @middle_name NVARCHAR(100), @last_name NVARCHAR(100), @designation NVARCHAR(100), @designation_id INT, @department_id INT, @access_level_id INT',
    @employee_code = N'EMP001',
    @username = N'owner1',
    @password_hash = N'owner123',
    @first_name = N'Pranav',
    @middle_name = NULL,
    @last_name = N'Owner',
    @designation = N'Owner',
    @designation_id = @OwnerDesignationId,
    @department_id = @PmoDeptId,
    @access_level_id = @AdminAccessLevelId;

  EXEC sp_executesql
    @UserInsertSql,
    N'@employee_code NVARCHAR(20), @username NVARCHAR(50), @password_hash NVARCHAR(255), @first_name NVARCHAR(100), @middle_name NVARCHAR(100), @last_name NVARCHAR(100), @designation NVARCHAR(100), @designation_id INT, @department_id INT, @access_level_id INT',
    @employee_code = N'EMP002',
    @username = N'manager1',
    @password_hash = N'manager123',
    @first_name = N'Anita',
    @middle_name = NULL,
    @last_name = N'Sharma',
    @designation = N'Manager',
    @designation_id = @ManagerDesignationId,
    @department_id = @EngDeptId,
    @access_level_id = @ManagerAccessLevelId;

  EXEC sp_executesql
    @UserInsertSql,
    N'@employee_code NVARCHAR(20), @username NVARCHAR(50), @password_hash NVARCHAR(255), @first_name NVARCHAR(100), @middle_name NVARCHAR(100), @last_name NVARCHAR(100), @designation NVARCHAR(100), @designation_id INT, @department_id INT, @access_level_id INT',
    @employee_code = N'EMP003',
    @username = N'employee1',
    @password_hash = N'employee123',
    @first_name = N'Ravi',
    @middle_name = NULL,
    @last_name = N'Kumar',
    @designation = N'Employee',
    @designation_id = @EmployeeDesignationId,
    @department_id = @EngDeptId,
    @access_level_id = @EmployeeAccessLevelId;

  EXEC sp_executesql
    @UserInsertSql,
    N'@employee_code NVARCHAR(20), @username NVARCHAR(50), @password_hash NVARCHAR(255), @first_name NVARCHAR(100), @middle_name NVARCHAR(100), @last_name NVARCHAR(100), @designation NVARCHAR(100), @designation_id INT, @department_id INT, @access_level_id INT',
    @employee_code = N'EMP004',
    @username = N'hr1',
    @password_hash = N'hr123',
    @first_name = N'Sneha',
    @middle_name = NULL,
    @last_name = N'Roy',
    @designation = N'HR Executive',
    @designation_id = @HrDesignationId,
    @department_id = @HrDeptId,
    @access_level_id = @ManagerAccessLevelId;

  IF NOT EXISTS (SELECT 1 FROM dbo.projects WHERE project_code = N'PRJ001')
  BEGIN
    INSERT INTO dbo.projects (
      project_code,
      project_name,
      owner_employee_code,
      manager_employee_code,
      status,
      created_by_employee_code,
      start_date,
      target_end_date,
      description
    )
    VALUES (
      N'PRJ001',
      N'Schedule Tracker Rollout',
      N'EMP001',
      N'EMP002',
      N'In Progress',
      N'EMP001',
      CAST(GETDATE() AS DATE),
      DATEADD(DAY, 45, CAST(GETDATE() AS DATE)),
      N'Core rollout project for schedule, leave, meeting, and task workflows.'
    );
  END;

  IF NOT EXISTS (SELECT 1 FROM dbo.projects WHERE project_code = N'PRJ002')
  BEGIN
    INSERT INTO dbo.projects (
      project_code,
      project_name,
      owner_employee_code,
      manager_employee_code,
      status,
      created_by_employee_code,
      start_date,
      target_end_date,
      description
    )
    VALUES (
      N'PRJ002',
      N'Leave Approval Workflow',
      N'EMP004',
      N'EMP002',
      N'Planned',
      N'EMP004',
      CAST(GETDATE() AS DATE),
      DATEADD(DAY, 30, CAST(GETDATE() AS DATE)),
      N'Workflow to manage leave requests, balances, and approvals.'
    );
  END;

  DECLARE @Project1Id INT = (SELECT TOP 1 project_id FROM dbo.projects WHERE project_code = N'PRJ001');
  DECLARE @Project2Id INT = (SELECT TOP 1 project_id FROM dbo.projects WHERE project_code = N'PRJ002');

  IF @Project1Id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM dbo.project_members WHERE project_id = @Project1Id AND member_employee_code = N'EMP002'
  )
  BEGIN
    INSERT INTO dbo.project_members (project_id, member_employee_code, member_role)
    VALUES (@Project1Id, N'EMP002', N'Manager');
  END;

  IF @Project1Id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM dbo.project_members WHERE project_id = @Project1Id AND member_employee_code = N'EMP003'
  )
  BEGIN
    INSERT INTO dbo.project_members (project_id, member_employee_code, member_role)
    VALUES (@Project1Id, N'EMP003', N'Contributor');
  END;

  IF @Project2Id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM dbo.project_members WHERE project_id = @Project2Id AND member_employee_code = N'EMP004'
  )
  BEGIN
    INSERT INTO dbo.project_members (project_id, member_employee_code, member_role)
    VALUES (@Project2Id, N'EMP004', N'Owner');
  END;

  IF @Project1Id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM dbo.finances WHERE project_id = @Project1Id AND entry_type = N'Budget'
  )
  BEGIN
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
    VALUES (
      @Project1Id,
      N'Budget',
      N'Budget',
      150000.00,
      CAST(GETDATE() AS DATE),
      N'Approved',
      N'Initial implementation budget for the rollout.',
      N'EMP001'
    );
  END;

  IF @Project2Id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM dbo.finances WHERE project_id = @Project2Id AND entry_type = N'Expense'
  )
  BEGIN
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
    VALUES (
      @Project2Id,
      N'Expense',
      N'Expense',
      42000.00,
      CAST(GETDATE() AS DATE),
      N'Pending',
      N'Process and documentation support.',
      N'EMP004'
    );
  END;

  IF @Project1Id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM dbo.tasks WHERE task_title = N'Finalize dashboard wiring'
  )
  BEGIN
    INSERT INTO dbo.tasks (
      project_id,
      task_title,
      task_description,
      assigned_to_employee_code,
      assigned_by_employee_code,
      due_date,
      priority,
      status
    )
    VALUES (
      @Project1Id,
      N'Finalize dashboard wiring',
      N'Complete the user-scoped dashboard and verify project actions.',
      N'EMP003',
      N'EMP001',
      DATEADD(DAY, 3, CAST(GETDATE() AS DATE)),
      N'High',
      N'Open'
    );
  END;

  IF @Project1Id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM dbo.tasks WHERE task_title = N'Prepare rollout review'
  )
  BEGIN
    INSERT INTO dbo.tasks (
      project_id,
      task_title,
      task_description,
      assigned_to_employee_code,
      assigned_by_employee_code,
      due_date,
      priority,
      status
    )
    VALUES (
      @Project1Id,
      N'Prepare rollout review',
      N'Collect progress notes and readiness updates for stakeholders.',
      N'EMP002',
      N'EMP001',
      DATEADD(DAY, 5, CAST(GETDATE() AS DATE)),
      N'Medium',
      N'Open'
    );
  END;

  IF NOT EXISTS (SELECT 1 FROM dbo.meetings WHERE meeting_title = N'Daily Operations Standup')
  BEGIN
    INSERT INTO dbo.meetings (
      meeting_title,
      meeting_date,
      start_time,
      end_time,
      location_or_link,
      notes,
      created_by_employee_code
    )
    VALUES (
      N'Daily Operations Standup',
      CAST(GETDATE() AS DATE),
      CAST('09:00:00' AS TIME),
      CAST('09:20:00' AS TIME),
      N'Conference Room A',
      N'Review blockers, confirm priorities, and align schedule changes.',
      N'EMP001'
    );
  END;

  IF NOT EXISTS (SELECT 1 FROM dbo.meetings WHERE meeting_title = N'Weekly Project Governance')
  BEGIN
    INSERT INTO dbo.meetings (
      meeting_title,
      meeting_date,
      start_time,
      end_time,
      location_or_link,
      notes,
      created_by_employee_code
    )
    VALUES (
      N'Weekly Project Governance',
      DATEADD(DAY, 2, CAST(GETDATE() AS DATE)),
      CAST('15:00:00' AS TIME),
      CAST('16:00:00' AS TIME),
      N'https://meet.example.com/governance',
      N'Review milestones, risks, and ownership for the current week.',
      N'EMP001'
    );
  END;

  DECLARE @StandupMeetingId INT = (SELECT TOP 1 meeting_id FROM dbo.meetings WHERE meeting_title = N'Daily Operations Standup');
  DECLARE @GovernanceMeetingId INT = (SELECT TOP 1 meeting_id FROM dbo.meetings WHERE meeting_title = N'Weekly Project Governance');

  IF @StandupMeetingId IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM dbo.meeting_participants WHERE meeting_id = @StandupMeetingId AND participant_employee_code = N'EMP001'
  )
  BEGIN
    INSERT INTO dbo.meeting_participants (meeting_id, participant_employee_code, participant_role)
    VALUES (@StandupMeetingId, N'EMP001', N'Organizer');
  END;

  IF @StandupMeetingId IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM dbo.meeting_participants WHERE meeting_id = @StandupMeetingId AND participant_employee_code = N'EMP002'
  )
  BEGIN
    INSERT INTO dbo.meeting_participants (meeting_id, participant_employee_code, participant_role)
    VALUES (@StandupMeetingId, N'EMP002', N'Attendee');
  END;

  IF @StandupMeetingId IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM dbo.meeting_participants WHERE meeting_id = @StandupMeetingId AND participant_employee_code = N'EMP003'
  )
  BEGIN
    INSERT INTO dbo.meeting_participants (meeting_id, participant_employee_code, participant_role)
    VALUES (@StandupMeetingId, N'EMP003', N'Attendee');
  END;

  IF @GovernanceMeetingId IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM dbo.meeting_participants WHERE meeting_id = @GovernanceMeetingId AND participant_employee_code = N'EMP001'
  )
  BEGIN
    INSERT INTO dbo.meeting_participants (meeting_id, participant_employee_code, participant_role)
    VALUES (@GovernanceMeetingId, N'EMP001', N'Organizer');
  END;

  IF @GovernanceMeetingId IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM dbo.meeting_participants WHERE meeting_id = @GovernanceMeetingId AND participant_employee_code = N'EMP002'
  )
  BEGIN
    INSERT INTO dbo.meeting_participants (meeting_id, participant_employee_code, participant_role)
    VALUES (@GovernanceMeetingId, N'EMP002', N'Attendee');
  END;

  IF NOT EXISTS (
    SELECT 1 FROM dbo.schedules
    WHERE owner_employee_code = N'EMP001' AND title = N'Design workshop'
  )
  BEGIN
    INSERT INTO dbo.schedules (
      owner_employee_code,
      schedule_range,
      schedule_day,
      title,
      note,
      color
    )
    VALUES (
      N'EMP001',
      N'weekly',
      N'Tue',
      N'Design workshop',
      N'Phase 2 planning',
      N'#61b15a'
    );
  END;

  IF NOT EXISTS (
    SELECT 1 FROM dbo.schedules
    WHERE owner_employee_code = N'EMP001' AND title = N'Release prep'
  )
  BEGIN
    INSERT INTO dbo.schedules (
      owner_employee_code,
      schedule_range,
      schedule_day,
      title,
      note,
      color
    )
    VALUES (
      N'EMP001',
      N'weekly',
      N'Thu',
      N'Release prep',
      N'Portal upgrade',
      N'#2563eb'
    );
  END;

  IF NOT EXISTS (
    SELECT 1 FROM dbo.schedules
    WHERE owner_employee_code = N'EMP002' AND title = N'Team sync'
  )
  BEGIN
    INSERT INTO dbo.schedules (
      owner_employee_code,
      schedule_range,
      schedule_day,
      title,
      note,
      color
    )
    VALUES (
      N'EMP002',
      N'weekly',
      N'Fri',
      N'Team sync',
      N'Status review',
      N'#0f8b8d'
    );
  END;

  DECLARE @CurrentYear INT = YEAR(GETDATE());

  ;WITH Months AS (
    SELECT 1 AS month_no UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
    UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
    UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
  )
  INSERT INTO dbo.CL_Holiday (employee_code, holiday_year, holiday_month, holiday_status)
  SELECT N'EMP001', @CurrentYear, month_no, CASE WHEN month_no <= 3 THEN 0 ELSE 1 END
  FROM Months
  WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.CL_Holiday h
    WHERE h.employee_code = N'EMP001'
      AND h.holiday_year = @CurrentYear
      AND h.holiday_month = Months.month_no
  );

  ;WITH Months AS (
    SELECT 1 AS month_no UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
    UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
    UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
  )
  INSERT INTO dbo.PL_Holiday (employee_code, holiday_year, holiday_month, holiday_status)
  SELECT N'EMP001', @CurrentYear, month_no, CASE WHEN month_no <= 2 THEN 0 ELSE 1 END
  FROM Months
  WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.PL_Holiday h
    WHERE h.employee_code = N'EMP001'
      AND h.holiday_year = @CurrentYear
      AND h.holiday_month = Months.month_no
  );

  ;WITH Months AS (
    SELECT 1 AS month_no UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
    UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
    UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
  )
  INSERT INTO dbo.Unpaid_Holiday (employee_code, holiday_year, holiday_month, holiday_status)
  SELECT N'EMP001', @CurrentYear, month_no, CASE WHEN month_no <= 1 THEN 0 ELSE 1 END
  FROM Months
  WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.Unpaid_Holiday h
    WHERE h.employee_code = N'EMP001'
      AND h.holiday_year = @CurrentYear
      AND h.holiday_month = Months.month_no
  );

  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_projects_owner_employee_code' AND object_id = OBJECT_ID(N'dbo.projects')
  )
  BEGIN
    CREATE INDEX IX_projects_owner_employee_code ON dbo.projects(owner_employee_code);
  END;

  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_finances_project_id' AND object_id = OBJECT_ID(N'dbo.finances')
  )
  BEGIN
    CREATE INDEX IX_finances_project_id ON dbo.finances(project_id);
  END;

  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_tasks_assigned_by_employee_code' AND object_id = OBJECT_ID(N'dbo.tasks')
  )
  BEGIN
    CREATE INDEX IX_tasks_assigned_by_employee_code ON dbo.tasks(assigned_by_employee_code);
  END;

  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_meetings_created_by_employee_code' AND object_id = OBJECT_ID(N'dbo.meetings')
  )
  BEGIN
    CREATE INDEX IX_meetings_created_by_employee_code ON dbo.meetings(created_by_employee_code);
  END;

  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_schedules_owner_employee_code' AND object_id = OBJECT_ID(N'dbo.schedules')
  )
  BEGIN
    CREATE INDEX IX_schedules_owner_employee_code ON dbo.schedules(owner_employee_code);
  END;

  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_CL_Holiday_employee_year' AND object_id = OBJECT_ID(N'dbo.CL_Holiday')
  )
  BEGIN
    CREATE INDEX IX_CL_Holiday_employee_year ON dbo.CL_Holiday(employee_code, holiday_year);
  END;

  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_PL_Holiday_employee_year' AND object_id = OBJECT_ID(N'dbo.PL_Holiday')
  )
  BEGIN
    CREATE INDEX IX_PL_Holiday_employee_year ON dbo.PL_Holiday(employee_code, holiday_year);
  END;

  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_Unpaid_Holiday_employee_year' AND object_id = OBJECT_ID(N'dbo.Unpaid_Holiday')
  )
  BEGIN
    CREATE INDEX IX_Unpaid_Holiday_employee_year ON dbo.Unpaid_Holiday(employee_code, holiday_year);
  END;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
    ROLLBACK TRANSACTION;

  THROW;
END CATCH;
GO

SELECT N'ScheduleTracker bootstrap complete.' AS message;
GO
