# Schedule Tracker Hub

Schedule Tracker Hub is a browser-based planning dashboard for:

- schedules
- leave, public holidays, and calendar entries
- meetings, summaries, and notes
- projects
- finance records
- shared to-dos

The app now supports two local storage modes:

- frontend served locally by `server.js`
- default data stored in local [db.json](/d:/PranavData/scheduleTrackerProject/db.json)
- optional SQL Server storage for SSMS / SQL Server Express setups
- refreshed dashboard UI with project watch cards, an organization view, a real month calendar, a dashboard day planner, and a full meetings workspace

## Quick Start

From `D:\PranavData\scheduleTrackerProject` run:

```powershell
cmd /c npm install
set PORT=3001
cmd /c npm start
```

Then open:

```text
http://127.0.0.1:3001
```

Default login:

- Username: `admin`
- Password: `admin`

Important:

- `admin / admin` is a development/demo login in local mode
- in JSON mode, the app does not authenticate against the `users` list inside [db.json](/d:/PranavData/scheduleTrackerProject/db.json)
- local JSON login now only allows the configured demo admin account handled in [src/store/json-store.js](/d:/PranavData/scheduleTrackerProject/src/store/json-store.js)

If port `3000` is free on your machine, you can also use:

```powershell
cmd /c npm start
```

Then open:

```text
http://127.0.0.1:3000
```

## How it works

When you run `npm start`:

1. `scripts/sync-public.js` copies frontend files into `public/`
2. `server.js` starts the local web server
3. the app reads and writes data from either:
   - [db.json](/d:/PranavData/scheduleTrackerProject/db.json), or
   - SQL Server when `SQL_SERVER` and `SQL_DATABASE` are set

The store selection lives in [src/store/index.js](/d:/PranavData/scheduleTrackerProject/src/store/index.js).

You can also create a local `.env` file from [.env.example](/d:/PranavData/scheduleTrackerProject/.env.example). `server.js` now loads `.env` automatically before creating the data store.

Authentication behavior:

- when SQL env vars are not set, the app uses the JSON store and a development/demo login flow for the configured demo admin account
- in that JSON mode, `admin / admin` comes from code configuration, not from a user record in [db.json](/d:/PranavData/scheduleTrackerProject/db.json)
- when `SQL_SERVER` and `SQL_DATABASE` are set, the app switches to SQL Server-backed login checks against `dbo.users`

## Project structure

- Frontend source: `index.html`, `dashboard.html`, `styles.css`, `login.js`, `dashboard-dynamic.js`
- Shared image assets: `images/`
- Frontend output for serving: `public/`
- API server: [server.js](/d:/PranavData/scheduleTrackerProject/server.js)
- Data store selector: [src/store/index.js](/d:/PranavData/scheduleTrackerProject/src/store/index.js)
- JSON store: [src/store/json-store.js](/d:/PranavData/scheduleTrackerProject/src/store/json-store.js)
- SQL Server store: [src/store/sqlserver-store.js](/d:/PranavData/scheduleTrackerProject/src/store/sqlserver-store.js)
- Local data file: [db.json](/d:/PranavData/scheduleTrackerProject/db.json)
- Public sync script: [scripts/sync-public.js](/d:/PranavData/scheduleTrackerProject/scripts/sync-public.js)
- Environment template: [.env.example](/d:/PranavData/scheduleTrackerProject/.env.example)

## Useful commands

Install dependencies:

```powershell
cmd /c npm install
```

Start locally on port `3000`:

```powershell
cmd /c npm start
```

Start locally on port `3001`:

```powershell
set PORT=3001
cmd /c npm start
```

Check script syntax:

```powershell
cmd /c npm run check
```

Run with SQL Server:

```powershell
set SQL_SERVER=localhost
set SQL_DATABASE=ScheduleTracker
set SQL_PORT=1433
set SQL_USER=scheduleapp
set SQL_PASSWORD=Schedule@123
set SQL_ENCRYPT=false
set SQL_TRUST_SERVER_CERT=true
set PORT=3012
cmd /c npm start
```

## SQL Login Setup

If you want to connect the app to SQL Server from SSMS / SQL Server Express, create a SQL login for the app.

Important first check:

- your `SQLEXPRESS` instance must allow `SQL Server and Windows Authentication mode` (mixed mode)
- the current local instance was detected as `Windows Authentication only` (`LoginMode = 1`), so `scheduleapp` will fail until mixed mode is enabled and SQL Server is restarted

In SSMS:

1. Expand `Security`
2. Right-click `Logins`
3. Click `New Login...`
4. In `Login name`, enter `scheduleapp`
5. Select `SQL Server authentication`
6. In `Password`, enter `Schedule@123` or your own local password
7. Uncheck `Enforce password policy` for simple local testing if you want
8. Set `Default database` to `ScheduleTracker`
9. Open `User Mapping`
10. Tick `ScheduleTracker`
11. In database role membership, tick:
    - `db_datareader`
    - `db_datawriter`
    - `db_ddladmin` if you want the app to auto-create `dbo.schedules`
12. Click `OK`

Important:

- `scheduleapp / Schedule@123` is the SQL Server database login used by Node.js
- `owner1 / owner123` is an application user stored in `dbo.users`
- after starting the app with the SQL env vars, log into the website with `owner1 / owner123`
- `admin / admin` is still a development/demo fallback in code and should not be treated as the real SQL application user
- if SSMS connects with `Windows Authentication`, that does not automatically mean Node.js can use the same connection mode in this project
- the current verified SQL error on this machine is `CREATE TABLE permission denied in database 'ScheduleTracker'`, so `scheduleapp` can connect but still needs DDL permission or a pre-created `dbo.schedules` table

## Notes

- if SQL env vars are not set, the app uses `db.json`
- in JSON mode, authentication is demo-oriented and does not read passwords from `db.json.users`
- if `SQL_SERVER` and `SQL_DATABASE` are set, the app uses SQL Server
- the SQL store expects your SSMS database tables to exist
- the dashboard now shows recent project cards, a separate organization tab, and a day-planner schedule component
- frontend source files are `dashboard.html`, `dashboard-dynamic.js`, and `styles.css`; after editing them, run `node scripts/sync-public.js`
- if `localhost:3000` is still serving an older backend after code changes, restart `server.js` so new API routes such as `POST /api/meetings` are active
- after removing dashboard sections from `dashboard.html`, make matching null-safe updates in `dashboard-dynamic.js` so startup does not stop on missing DOM nodes

## Calendar And Leave

- `dbo.employeeCalendar` is now the main unified calendar table in SQL mode
- it is designed to hold leave, meetings, public holidays, schedules, deadlines, and general calendar entries
- leave colors are separated in the calendar UI for `CL`, `PL`, and `UNPAID`
- Saturday and Sunday are highlighted with different colors
- calendar navigation supports `Jan 2000` through `Dec 2100`
- public holidays for `2026` are seeded separately and shown in the leave / calendar workspace

Leave rules currently implemented in SQL design:

- `CL` accrues `1` day per month
- unused `CL` carries forward within the same year only
- `PL` accrues `5` days per month
- unused `PL` carries forward within the same year only
- `PL` cannot accumulate above `45` days
- `Unpaid` leave is tracked separately after paid leave is exhausted

Relevant SQL scripts:

- [01-recreate-unified-calendar.sql](/d:/PranavData/scheduleTrackerProject/database/redesign-tables/employeeCalendar/01-recreate-unified-calendar.sql)
- [02-seed-public-holidays-2026.sql](/d:/PranavData/scheduleTrackerProject/database/redesign-tables/employeeCalendar/02-seed-public-holidays-2026.sql)
- [03-extend-meeting-fields.sql](/d:/PranavData/scheduleTrackerProject/database/redesign-tables/employeeCalendar/03-extend-meeting-fields.sql)

## Meetings Workspace

- the Meetings screen is now a full-width workspace
- users can add future meetings or enter missed meetings later
- future meetings appear in `Upcoming meetings`
- past meetings appear in `Meeting history`
- the selected meeting can be changed from a dropdown bound to meeting records from the database
- meeting details now include:
  - title
  - date
  - start time
  - end time
  - location
  - link
  - summary
  - notes
- invalid time ranges are blocked before save, for example end time earlier than start time
- meeting links are normalized before save so simple inputs like `meeting.com` still work

## Current Focus

Work completed recently is mainly around:

- unified calendar and leave behavior
- public holiday support
- meetings workspace redesign

Still pending for the next round:

- project component updates and review
- schedule component updates and review
- dashboard component updates and review

## SQL App Flow

Current database-to-application logic:

- `Login Page -> dbo.users -> session identity -> API calls -> feature tables -> dashboard UI`
- the app first validates the user from `dbo.users`
- after login, the app uses the logged-in employee identity to fetch and save feature data

Current component mapping:

- `Schedules` component -> `dbo.employeeSchedule`
- `Projects` component -> `dbo.employeeProject`
- `Calendar` component -> `dbo.employeeCalendar`
- `Meetings` component -> `dbo.employeeCalendar` when unified calendar exists, otherwise legacy `dbo.employeeMeeting`
- `Organization` component -> `dbo.users`

Current module flow:

- `Login`
  - checks `EmpUsername` and `EmpPassword` in `dbo.users`
  - reads `EmpID`, `EmpFullName`, and `EmpDesignation`
  - stores the logged-in employee identity in session
- `Schedules`
  - fetches rows from `dbo.employeeSchedule` for the logged-in `EmpID`
  - add, edit, and delete actions write back to `dbo.employeeSchedule`
- `Projects`
  - fetches rows from `dbo.employeeProject` for the logged-in `EmpID`
  - add, edit, and delete actions write back to `dbo.employeeProject`
- `Calendar`
  - fetches rows from `dbo.employeeCalendar` for the logged-in `EmpID`
  - add, edit, and delete actions write back to `dbo.employeeCalendar`
- `Meetings`
  - fetches rows from unified `dbo.employeeCalendar` in SQL mode when available
  - falls back to legacy `dbo.employeeMeeting` if needed
  - add, edit, and delete actions write back to the active meeting source
- `Organization`
  - reads from `dbo.users`
  - uses `EmpReportingManagerID -> EmpID` to build the reporting tree

Recommended visibility logic for later:

- employee -> own records only
- manager -> own records plus junior records
- owner/admin -> all records

## Node version

This project declares Node `>=20`.

Recommended versions:

- Node `20`
- Node `22`
