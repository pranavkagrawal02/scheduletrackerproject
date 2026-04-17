$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $root "images\DB_COMPONENT_CONNECTIONS.png"

$width = 1900
$height = 1240
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$bg = [System.Drawing.Color]::FromArgb(247, 242, 233)
$ink = [System.Drawing.Color]::FromArgb(21, 35, 59)
$muted = [System.Drawing.Color]::FromArgb(95, 108, 130)
$blue = [System.Drawing.Color]::FromArgb(37, 99, 235)
$teal = [System.Drawing.Color]::FromArgb(15, 139, 141)
$gold = [System.Drawing.Color]::FromArgb(230, 168, 23)
$rose = [System.Drawing.Color]::FromArgb(232, 93, 117)
$green = [System.Drawing.Color]::FromArgb(97, 177, 90)
$panel = [System.Drawing.Color]::FromArgb(251, 252, 255)
$line = [System.Drawing.Color]::FromArgb(205, 216, 232)

$graphics.Clear($bg)

$titleFont = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Bold)
$subFont = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Regular)
$boxTitleFont = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
$boxTextFont = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Regular)
$miniFont = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Regular)

$inkBrush = New-Object System.Drawing.SolidBrush($ink)
$mutedBrush = New-Object System.Drawing.SolidBrush($muted)
$boxBrush = New-Object System.Drawing.SolidBrush($panel)
$linePen = New-Object System.Drawing.Pen($line, 2)
$bluePen = New-Object System.Drawing.Pen($blue, 3)
$tealPen = New-Object System.Drawing.Pen($teal, 3)
$dashPen = New-Object System.Drawing.Pen($muted, 2)
$dashPen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$arrowCap = New-Object System.Drawing.Drawing2D.AdjustableArrowCap(5, 6, $true)
$bluePen.CustomEndCap = $arrowCap
$tealPen.CustomEndCap = $arrowCap
$dashPen.CustomEndCap = $arrowCap

$graphics.DrawString("Database Connections By Component", $titleFont, $inkBrush, 50, 26)
$graphics.DrawString("App components on the left, active SQL tables in the middle, and table-to-table relationships on the right.", $subFont, $mutedBrush, 52, 72)

function Draw-PanelBox {
  param(
    [int]$X,
    [int]$Y,
    [int]$W,
    [int]$H,
    [string]$Title,
    [string]$Body,
    [System.Drawing.Color]$Accent
  )

  $rect = New-Object System.Drawing.Rectangle($X, $Y, $W, $H)
  $accentBrush = New-Object System.Drawing.SolidBrush($Accent)
  $graphics.FillRectangle($boxBrush, $rect)
  $graphics.DrawRectangle($linePen, $rect)
  $graphics.FillRectangle($accentBrush, $X, $Y, 10, $H)
  $graphics.DrawString($Title, $boxTitleFont, $inkBrush, $X + 22, $Y + 12)
  $bodyRect = New-Object System.Drawing.RectangleF(($X + 22), ($Y + 42), ($W - 34), ($H - 52))
  $format = New-Object System.Drawing.StringFormat
  $format.Trimming = [System.Drawing.StringTrimming]::Word
  $graphics.DrawString($Body, $boxTextFont, $mutedBrush, $bodyRect, $format)
  $accentBrush.Dispose()
}

function Draw-ArrowLine {
  param(
    [int]$X1,
    [int]$Y1,
    [int]$X2,
    [int]$Y2,
    [System.Drawing.Pen]$Pen
  )
  $graphics.DrawLine($Pen, $X1, $Y1, $X2, $Y2)
}

function Draw-Label {
  param(
    [string]$Text,
    [int]$X,
    [int]$Y
  )
  $graphics.DrawString($Text, $miniFont, $mutedBrush, $X, $Y)
}

# Column headers
$graphics.DrawString("Components", $boxTitleFont, $inkBrush, 90, 128)
$graphics.DrawString("Primary Active Tables", $boxTitleFont, $inkBrush, 630, 128)
$graphics.DrawString("Table Relationships", $boxTitleFont, $inkBrush, 1180, 128)

# Components
$components = @(
  @{ x = 70; y = 180; w = 360; h = 88; title = "Login"; body = "Checks username/password, resolves session identity, and stores employee context."; accent = $blue },
  @{ x = 70; y = 300; w = 360; h = 88; title = "Organization"; body = "Builds reporting hierarchy from users and manager links."; accent = $teal },
  @{ x = 70; y = 420; w = 360; h = 88; title = "Projects"; body = "Reads and writes project records and update history."; accent = $blue },
  @{ x = 70; y = 540; w = 360; h = 88; title = "Schedules"; body = "Uses employeeSchedule directly, or calendar-based schedule entries where applicable."; accent = $teal },
  @{ x = 70; y = 660; w = 360; h = 104; title = "Calendar"; body = "Uses the unified calendar for public holidays, leave events, schedule-style entries, and planner views."; accent = $blue },
  @{ x = 70; y = 800; w = 360; h = 104; title = "Meetings"; body = "Uses employeeCalendar for unified meeting rows, with fallback to employeeMeeting when needed."; accent = $teal }
)

foreach ($box in $components) {
  Draw-PanelBox -X $box.x -Y $box.y -W $box.w -H $box.h -Title $box.title -Body $box.body -Accent $box.accent
}

# Primary active tables
$tables = @(
  @{ x = 560; y = 180; w = 430; h = 88; title = "dbo.users"; body = "EmpID, EmpUsername, EmpPassword, EmpFullName, EmpDesignation, EmpReportingManagerID"; accent = $green },
  @{ x = 560; y = 420; w = 430; h = 88; title = "dbo.employeeProject"; body = "Project owner via EmpID. Main project table used by the Projects component."; accent = $gold },
  @{ x = 560; y = 530; w = 430; h = 88; title = "dbo.employeeProjectUpdateHistory"; body = "Status / finance change history tied to projectId and EmpID."; accent = $rose },
  @{ x = 560; y = 660; w = 430; h = 88; title = "dbo.employeeSchedule"; body = "Legacy/direct schedule table linked by EmpID and scheduleTypeId."; accent = $gold },
  @{ x = 560; y = 770; w = 430; h = 88; title = "dbo.scheduleType"; body = "Lookup table for schedule type labels."; accent = $rose },
  @{ x = 560; y = 900; w = 430; h = 110; title = "dbo.employeeCalendar"; body = "Unified calendar table used for holidays, leave events, meetings, schedule-style rows, and summary entries."; accent = $green },
  @{ x = 560; y = 1040; w = 430; h = 88; title = "dbo.employeeMeeting"; body = "Legacy fallback meeting table used only when unified calendar meeting storage is unavailable."; accent = $rose }
)

foreach ($box in $tables) {
  Draw-PanelBox -X $box.x -Y $box.y -W $box.w -H $box.h -Title $box.title -Body $box.body -Accent $box.accent
}

# Relationship area
$relations = @(
  @{ x = 1140; y = 180; w = 660; h = 92; title = "dbo.users"; body = "Parent identity table. EmpReportingManagerID -> EmpID creates the organization tree. EmpID connects outward to owned records."; accent = $green },
  @{ x = 1140; y = 330; w = 300; h = 86; title = "dbo.employeeProject"; body = "EmpID -> dbo.users.EmpID"; accent = $gold },
  @{ x = 1500; y = 330; w = 300; h = 86; title = "dbo.employeeProjectUpdateHistory"; body = "projectId -> employeeProject.projectId`nEmpID -> users.EmpID"; accent = $rose },
  @{ x = 1140; y = 470; w = 300; h = 86; title = "dbo.employeeSchedule"; body = "EmpID -> dbo.users.EmpID"; accent = $gold },
  @{ x = 1500; y = 470; w = 300; h = 86; title = "dbo.scheduleType"; body = "scheduleTypeId -> employeeSchedule.scheduleTypeId"; accent = $rose },
  @{ x = 1140; y = 610; w = 300; h = 118; title = "dbo.employeeCalendar"; body = "EmpID -> dbo.users.EmpID`nentryCategory controls HOLIDAY / MEETING`nreferenceTable marks schedule-style rows"; accent = $green },
  @{ x = 1500; y = 630; w = 300; h = 86; title = "dbo.employeeMeeting"; body = "EmpID -> dbo.users.EmpID`nlegacy fallback only"; accent = $rose },
  @{ x = 1140; y = 810; w = 660; h = 168; title = "Legacy Leave Fallback"; body = "dbo.CL_Holiday`ndbo.PL_Holiday`ndbo.Unpaid_Holiday`nThese are queried only when unified calendar leave summaries are unavailable. Employee linkage is derived from the logged-in EmpID through employee-code conversion in SQL queries."; accent = $teal }
)

foreach ($box in $relations) {
  Draw-PanelBox -X $box.x -Y $box.y -W $box.w -H $box.h -Title $box.title -Body $box.body -Accent $box.accent
}

# Component to primary table arrows
Draw-ArrowLine -X1 430 -Y1 224 -X2 560 -Y2 224 -Pen $bluePen
Draw-ArrowLine -X1 430 -Y1 344 -X2 560 -Y2 224 -Pen $tealPen
Draw-ArrowLine -X1 430 -Y1 464 -X2 560 -Y2 464 -Pen $bluePen
Draw-ArrowLine -X1 430 -Y1 584 -X2 560 -Y2 704 -Pen $tealPen
Draw-ArrowLine -X1 430 -Y1 712 -X2 560 -Y2 955 -Pen $bluePen
Draw-ArrowLine -X1 430 -Y1 852 -X2 560 -Y2 955 -Pen $tealPen
Draw-ArrowLine -X1 430 -Y1 860 -X2 560 -Y2 1084 -Pen $dashPen

Draw-Label -Text "auth + session" -X 450 -Y 206
Draw-Label -Text "hierarchy tree" -X 446 -Y 314
Draw-Label -Text "project records" -X 448 -Y 446
Draw-Label -Text "legacy schedule path" -X 442 -Y 608
Draw-Label -Text "unified calendar path" -X 442 -Y 744
Draw-Label -Text "unified meetings" -X 444 -Y 884
Draw-Label -Text "legacy fallback" -X 446 -Y 924

# Table relationship arrows
Draw-ArrowLine -X1 1470 -Y1 226 -X2 1470 -Y2 330 -Pen $bluePen
Draw-ArrowLine -X1 1470 -Y1 226 -X2 1290 -Y2 470 -Pen $bluePen
Draw-ArrowLine -X1 1470 -Y1 226 -X2 1290 -Y2 610 -Pen $bluePen
Draw-ArrowLine -X1 1470 -Y1 226 -X2 1650 -Y2 630 -Pen $dashPen
Draw-ArrowLine -X1 1440 -Y1 373 -X2 1500 -Y2 373 -Pen $tealPen
Draw-ArrowLine -X1 1440 -Y1 513 -X2 1500 -Y2 513 -Pen $tealPen

Draw-Label -Text "EmpID ownership link" -X 1490 -Y 272
Draw-Label -Text "projectId / EmpID" -X 1460 -Y 350
Draw-Label -Text "scheduleTypeId" -X 1456 -Y 490
Draw-Label -Text "legacy only" -X 1540 -Y 600

# Legend
$legendRect = New-Object System.Drawing.Rectangle(60, 1148, 1780, 54)
$graphics.FillRectangle($boxBrush, $legendRect)
$graphics.DrawRectangle($linePen, $legendRect)
$graphics.FillRectangle((New-Object System.Drawing.SolidBrush($blue)), 84, 1164, 18, 18)
$graphics.DrawString("Component -> active DB connection", $miniFont, $inkBrush, 112, 1160)
$graphics.FillRectangle((New-Object System.Drawing.SolidBrush($teal)), 470, 1164, 18, 18)
$graphics.DrawString("Table -> table relationship", $miniFont, $inkBrush, 498, 1160)
$graphics.DrawLine($dashPen, 842, 1173, 902, 1173)
$graphics.DrawString("legacy / fallback path", $miniFont, $inkBrush, 914, 1160)
$graphics.FillRectangle((New-Object System.Drawing.SolidBrush($green)), 1295, 1164, 18, 18)
$graphics.DrawString("primary table group", $miniFont, $inkBrush, 1323, 1160)

$dir = Split-Path -Parent $outputPath
if (-not (Test-Path $dir)) {
  New-Item -ItemType Directory -Path $dir | Out-Null
}

$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$graphics.Dispose()
$bitmap.Dispose()
$titleFont.Dispose()
$subFont.Dispose()
$boxTitleFont.Dispose()
$boxTextFont.Dispose()
$miniFont.Dispose()
$inkBrush.Dispose()
$mutedBrush.Dispose()
$boxBrush.Dispose()
$linePen.Dispose()
$bluePen.Dispose()
$tealPen.Dispose()
$dashPen.Dispose()

Write-Output "CREATED:$outputPath"
