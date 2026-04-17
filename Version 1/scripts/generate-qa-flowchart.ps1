$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $root "images\QA_FLOWCHART.png"

$width = 1500
$height = 1900
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$bg = [System.Drawing.Color]::FromArgb(247, 242, 233)
$ink = [System.Drawing.Color]::FromArgb(21, 35, 59)
$muted = [System.Drawing.Color]::FromArgb(95, 108, 130)
$blue = [System.Drawing.Color]::FromArgb(37, 99, 235)
$teal = [System.Drawing.Color]::FromArgb(15, 139, 141)
$panel = [System.Drawing.Color]::FromArgb(250, 252, 255)
$line = [System.Drawing.Color]::FromArgb(205, 216, 232)

$graphics.Clear($bg)

$titleFont = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Bold)
$subFont = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Regular)
$boxTitleFont = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
$boxTextFont = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Regular)

$inkBrush = New-Object System.Drawing.SolidBrush($ink)
$mutedBrush = New-Object System.Drawing.SolidBrush($muted)
$boxBrush = New-Object System.Drawing.SolidBrush($panel)
$linePen = New-Object System.Drawing.Pen($line, 2)
$bluePen = New-Object System.Drawing.Pen($blue, 3)
$arrowCap = New-Object System.Drawing.Drawing2D.AdjustableArrowCap(5, 6, $true)
$bluePen.CustomEndCap = $arrowCap

$graphics.DrawString("QA Flowchart", $titleFont, $inkBrush, 60, 28)
$graphics.DrawString("Manual testing sequence for login, dashboard, calendar, projects, meetings, persistence, and SQL verification.", $subFont, $mutedBrush, 62, 74)

function Draw-StepBox {
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
  $accentPen = New-Object System.Drawing.Pen($Accent, 2)
  $graphics.FillRectangle($boxBrush, $rect)
  $graphics.DrawRectangle($linePen, $rect)
  $graphics.FillRectangle($accentBrush, $X, $Y, 10, $H)
  $graphics.DrawString($Title, $boxTitleFont, $inkBrush, $X + 24, $Y + 14)

  $bodyRect = New-Object System.Drawing.RectangleF(($X + 24), ($Y + 44), ($W - 42), ($H - 56))
  $format = New-Object System.Drawing.StringFormat
  $format.Trimming = [System.Drawing.StringTrimming]::Word
  $graphics.DrawString($Body, $boxTextFont, $mutedBrush, $bodyRect, $format)

  $accentBrush.Dispose()
  $accentPen.Dispose()
}

function Draw-Arrow {
  param(
    [int]$X1,
    [int]$Y1,
    [int]$X2,
    [int]$Y2
  )
  $graphics.DrawLine($bluePen, $X1, $Y1, $X2, $Y2)
}

$steps = @(
  @{ x = 470; y = 130; w = 560; h = 88; title = "1. Open App"; body = "Launch the local app at localhost:3000 and confirm the login page loads."; accent = $teal },
  @{ x = 470; y = 270; w = 560; h = 110; title = "2. Login Tests"; body = "Test admin login, owner1 SQL login, invalid credentials, logout, and direct dashboard access without a session."; accent = $blue },
  @{ x = 470; y = 430; w = 560; h = 88; title = "3. Session Tests"; body = "Refresh after login, confirm session persistence, and verify logout clears access."; accent = $teal },
  @{ x = 470; y = 570; w = 560; h = 110; title = "4. Dashboard Tests"; body = "Check hero panel, project status, people and roles, planner, responsive layout, and removed panel cleanup."; accent = $blue },
  @{ x = 470; y = 730; w = 560; h = 110; title = "5. Navigation Tests"; body = "Open Dashboard, Organization, Projects, Calendar, and Meetings. Confirm active state and correct view switching."; accent = $teal },
  @{ x = 470; y = 890; w = 560; h = 126; title = "6. Calendar + Planner"; body = "Verify month navigation, date selection, weekend styling, public holiday add/edit, and planner schedule add/edit/delete."; accent = $blue },
  @{ x = 470; y = 1066; w = 560; h = 110; title = "7. Users / Projects / Finance"; body = "Create and validate user, project, deadline, and finance flows, including invalid input blocking."; accent = $teal },
  @{ x = 470; y = 1226; w = 560; h = 110; title = "8. Meetings Tests"; body = "Add future and past meetings, validate time order, save notes, normalize links, and delete meetings."; accent = $blue },
  @{ x = 470; y = 1386; w = 560; h = 88; title = "9. Sidebar + Persistence"; body = "Check sidebar cards, refresh behavior, re-login behavior, and saved-data persistence."; accent = $teal },
  @{ x = 470; y = 1526; w = 560; h = 110; title = "10. SQL Verification"; body = "Login as owner1, confirm SQL-backed data loads, create records, refresh, and verify persistence."; accent = $blue },
  @{ x = 470; y = 1686; w = 560; h = 88; title = "11. Error Handling"; body = "Test backend-down behavior and invalid form input handling without breaking the UI."; accent = $teal }
)

foreach ($step in $steps) {
  Draw-StepBox -X $step.x -Y $step.y -W $step.w -H $step.h -Title $step.title -Body $step.body -Accent $step.accent
}

for ($i = 0; $i -lt ($steps.Count - 1); $i++) {
  $from = $steps[$i]
  $to = $steps[$i + 1]
  $x = [int]($from.x + ($from.w / 2))
  Draw-Arrow -X1 $x -Y1 ($from.y + $from.h) -X2 $x -Y2 $to.y
}

Draw-StepBox -X 90 -Y 272 -W 280 -H 106 -Title "Invalid Login Branch" -Body "Wrong credentials should show an error and keep the user on the login page." -Accent $teal
Draw-Arrow -X1 470 -Y1 324 -X2 370 -Y2 324

Draw-StepBox -X 1130 -Y 892 -W 280 -H 124 -Title "Calendar Checks" -Body "Month header, weekdays, selected day, holidays, and planner schedule sync must all update together." -Accent $teal
Draw-Arrow -X1 1030 -Y1 953 -X2 1130 -Y2 953

Draw-StepBox -X 1130 -Y 1228 -W 280 -H 108 -Title "Meeting Checks" -Body "Upcoming/history grouping, time validation, notes, and delete behavior should all work." -Accent $teal
Draw-Arrow -X1 1030 -Y1 1281 -X2 1130 -Y2 1281

$legendRect = New-Object System.Drawing.Rectangle(72, 1810, 1350, 54)
$graphics.FillRectangle($boxBrush, $legendRect)
$graphics.DrawRectangle($linePen, $legendRect)
$graphics.FillRectangle((New-Object System.Drawing.SolidBrush($blue)), 92, 1826, 18, 18)
$graphics.DrawString("Main functional checkpoint", $boxTextFont, $inkBrush, 118, 1823)
$graphics.FillRectangle((New-Object System.Drawing.SolidBrush($teal)), 420, 1826, 18, 18)
$graphics.DrawString("Supporting branch / focus area", $boxTextFont, $inkBrush, 446, 1823)
$graphics.DrawLine($bluePen, 860, 1835, 920, 1835)
$graphics.DrawString("Execution order", $boxTextFont, $inkBrush, 932, 1823)

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
$inkBrush.Dispose()
$mutedBrush.Dispose()
$boxBrush.Dispose()
$linePen.Dispose()
$bluePen.Dispose()

Write-Output "CREATED:$outputPath"
