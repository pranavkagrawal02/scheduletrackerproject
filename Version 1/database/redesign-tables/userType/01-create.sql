USE ScheduleTracker;
GO

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.userType', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.userType (
        userTypeId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        userType NVARCHAR(50) NOT NULL UNIQUE
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.userType WHERE userType = N'Single User')
    INSERT INTO dbo.userType (userType) VALUES (N'Single User');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.userType WHERE userType = N'Multi User')
    INSERT INTO dbo.userType (userType) VALUES (N'Multi User');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.userType WHERE userType = N'Corporate')
    INSERT INTO dbo.userType (userType) VALUES (N'Corporate');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.userType WHERE userType = N'Government')
    INSERT INTO dbo.userType (userType) VALUES (N'Government');
GO

SELECT *
FROM dbo.userType
ORDER BY userTypeId;
GO
