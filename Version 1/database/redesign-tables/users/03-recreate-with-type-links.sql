USE ScheduleTracker;
GO

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.users;
END;
GO

CREATE TABLE dbo.users (
    EmpID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    EmpCompany NVARCHAR(150) NULL,
    EmpDesignation NVARCHAR(100) NULL,
    EmpFirstName NVARCHAR(100) NOT NULL,
    EmpLastName NVARCHAR(100) NULL,
    EmpFullName NVARCHAR(250) NULL,
    EmpUserTypeID INT NULL,
    EmpScheduleTypeID INT NULL,
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
GO

ALTER TABLE dbo.users
ADD CONSTRAINT FK_users_userType
FOREIGN KEY (EmpUserTypeID) REFERENCES dbo.userType(userTypeId);
GO

ALTER TABLE dbo.users
ADD CONSTRAINT FK_users_scheduleType
FOREIGN KEY (EmpScheduleTypeID) REFERENCES dbo.scheduleType(scheduleTypeId);
GO

ALTER TABLE dbo.users
ADD CONSTRAINT FK_users_reporting_manager
FOREIGN KEY (EmpReportingManagerID) REFERENCES dbo.users(EmpID);
GO

SELECT *
FROM dbo.users;
GO
