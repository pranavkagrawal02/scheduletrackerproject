-- =====================================================
-- Schedule Tracker Database Setup Script
-- Version 2 - SQL Database Design (SQL Server)
-- =====================================================

-- Create Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'TimeChime')
BEGIN
    CREATE DATABASE TimeChime;
END
GO

USE TimeChime;
GO

-- =====================================================
-- Table 1: Employee Table
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Employee')
BEGIN
    CREATE TABLE Employee (
        EmpID INT PRIMARY KEY IDENTITY(1,1),
        EmpFirstName VARCHAR(50) NOT NULL,
        EmpMiddleName VARCHAR(50),
        EmpLastName VARCHAR(50) NOT NULL,
        EmpName VARCHAR(150) NOT NULL,
        EmpDOB DATE,
        EmpDept VARCHAR(100),
        EmpDeptID INT,
        EmpAddress VARCHAR(255),
        EmpEmail VARCHAR(100),
        EmpPhone VARCHAR(20),
        EmpDesignation VARCHAR(100),
        EmpStatus VARCHAR(20) DEFAULT 'Active',
        CreatedDate DATETIME DEFAULT GETDATE(),
        UpdatedDate DATETIME DEFAULT GETDATE()
    );
END
GO

-- =====================================================
-- Table 2: Login Table
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Login')
BEGIN
    CREATE TABLE Login (
        LoginID INT PRIMARY KEY IDENTITY(1,1),
        Username VARCHAR(100) NOT NULL UNIQUE,
        Password VARCHAR(255) NOT NULL,
        EmpID INT NOT NULL,
        IsActive BIT DEFAULT 1,
        CreatedDate DATETIME DEFAULT GETDATE(),
        UpdatedDate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (EmpID) REFERENCES Employee(EmpID) ON DELETE CASCADE
    );
END
GO

-- =====================================================
-- Table 3: LoginHistory Table
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LoginHistory')
BEGIN
    CREATE TABLE LoginHistory (
        LoginHistoryID INT PRIMARY KEY IDENTITY(1,1),
        EmpID INT NOT NULL,
        LoginDate DATE NOT NULL,
        LoginTime TIME NOT NULL,
        LoginDay VARCHAR(20),
        LogoutTime TIME,
        SessionDuration INT,
        CreatedDate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (EmpID) REFERENCES Employee(EmpID) ON DELETE CASCADE
    );
END
GO

-- =====================================================
-- Create Indexes for Better Performance
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_login_empid')
BEGIN
    CREATE INDEX idx_login_empid ON Login(EmpID);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_loginhistory_empid')
BEGIN
    CREATE INDEX idx_loginhistory_empid ON LoginHistory(EmpID);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_loginhistory_date')
BEGIN
    CREATE INDEX idx_loginhistory_date ON LoginHistory(LoginDate);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_employee_dept')
BEGIN
    CREATE INDEX idx_employee_dept ON Employee(EmpDeptID);
END
GO

-- =====================================================
-- Optional: Insert Sample Data (Comment out if not needed)
-- =====================================================

-- Sample Employee Data
INSERT INTO Employee (EmpFirstName, EmpMiddleName, EmpLastName, EmpName, EmpDOB, EmpDept, EmpDeptID, EmpAddress, EmpEmail, EmpPhone, EmpDesignation, EmpStatus)
VALUES
('Pranav', 'Kumar', 'Agarwal', 'Pranav Kumar Agarwal', '1990-05-15', 'IT', 101, '123 Main Street', 'pranav.agarwal@company.com', '+91-9876543210', 'Senior Developer', 'Active'),
('John', 'Michael', 'Smith', 'John Michael Smith', '1988-03-22', 'HR', 102, '456 Oak Avenue', 'john.smith@company.com', '+91-9876543212', 'HR Manager', 'Active'),
('Sarah', 'Jane', 'Johnson', 'Sarah Jane Johnson', '1992-07-10', 'Finance', 103, '789 Pine Road', 'sarah.johnson@company.com', '+91-9876543214', 'Finance Director', 'Active');
GO

-- Sample Login Data
INSERT INTO Login (Username, Password, EmpID, IsActive)
VALUES
('pranav.agarwal', 'hashed_password_123', 1, 1),
('john.smith', 'hashed_password_456', 2, 1),
('sarah.johnson', 'hashed_password_789', 3, 1);
GO

-- Sample Login History Data
INSERT INTO LoginHistory (EmpID, LoginDate, LoginTime, LoginDay, LogoutTime, SessionDuration)
VALUES
(1, '2026-04-21', '09:00:00', 'Tuesday', '17:30:00', 510),
(1, '2026-04-20', '08:45:00', 'Monday', '18:00:00', 555),
(2, '2026-04-21', '09:15:00', 'Tuesday', '17:45:00', 510),
(3, '2026-04-21', '09:30:00', 'Tuesday', '18:00:00', 510);
GO

-- =====================================================
-- Display Tables
-- =====================================================
SELECT 'Employee Table:' AS Info;
SELECT * FROM Employee;
GO

SELECT 'Login Table:' AS Info;
SELECT * FROM Login;
GO

SELECT 'LoginHistory Table:' AS Info;
SELECT * FROM LoginHistory;
GO
