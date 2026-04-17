USE ScheduleTracker;
GO

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.users (
        EmpID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        EmpCompany NVARCHAR(150) NULL,
        EmpDesignation NVARCHAR(100) NULL,
        EmpFirstName NVARCHAR(100) NOT NULL,
        EmpLastName NVARCHAR(100) NULL,
        EmpFullName NVARCHAR(250) NULL,
        EmpTypeID INT NULL,
        EmpUsername NVARCHAR(50) NOT NULL UNIQUE,
        EmpPassword NVARCHAR(255) NOT NULL,
        EmpContact NVARCHAR(20) NULL,
        EmpContactCountry NVARCHAR(10) NULL,
        EmpDept NVARCHAR(100) NULL,
        EmpDeptID INT NULL,
        EmpReportingManager NVARCHAR(250) NULL,
        EmpReportingManagerID INT NULL,
        EmpEmail NVARCHAR(150) NULL
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = N'FK_users_userType'
)
BEGIN
    ALTER TABLE dbo.users
    ADD CONSTRAINT FK_users_userType
    FOREIGN KEY (EmpTypeID) REFERENCES dbo.userType(userTypeId);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = N'FK_users_reporting_manager'
)
BEGIN
    ALTER TABLE dbo.users
    ADD CONSTRAINT FK_users_reporting_manager
    FOREIGN KEY (EmpReportingManagerID) REFERENCES dbo.users(EmpID);
END;
GO

SELECT *
FROM dbo.users;
GO
