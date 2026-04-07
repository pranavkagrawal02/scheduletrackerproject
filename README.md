# Schedule Tracker Hub

Schedule Tracker Hub is a browser-based planning dashboard for:

- schedules
- leave and holiday types
- meetings and notes
- projects
- finance records
- shared to-dos

The app now supports two local storage modes:

- frontend served locally by `server.js`
- default data stored in local [db.json](/d:/PranavData/scheduleTrackerProject/db.json)
- optional SQL Server storage for SSMS / SQL Server Express setups

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

## Project structure

- Frontend source: `index.html`, `dashboard.html`, `styles.css`, `login.js`, `dashboard-dynamic.js`
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
12. Click `OK`

Important:

- `scheduleapp / Schedule@123` is the SQL Server database login used by Node.js
- `owner1 / owner123` is an application user stored in `dbo.users`
- after starting the app with the SQL env vars, log into the website with `owner1 / owner123`
- if SSMS connects with `Windows Authentication`, that does not automatically mean Node.js can use the same connection mode in this project

## Notes

- if SQL env vars are not set, the app uses `db.json`
- if `SQL_SERVER` and `SQL_DATABASE` are set, the app uses SQL Server
- the SQL store expects your SSMS database tables to exist

## Node version

This project declares Node `>=20`.

Recommended versions:

- Node `20`
- Node `22`
