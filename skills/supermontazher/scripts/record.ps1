# Запись экрана в файл. Останавливается, когда рядом появляется файл stop.flag
# (или через MaxMinutes). Запуск:  powershell -ExecutionPolicy Bypass -File record.ps1 -Name step1
param(
    [string] $Name = "rec",
    [int] $MaxMinutes = 40
)

$dir = Join-Path $PSScriptRoot "raw"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$flag = Join-Path $PSScriptRoot "stop.flag"
Remove-Item -LiteralPath $flag -Force -ErrorAction SilentlyContinue
$out = Join-Path $dir ("{0}_{1}.mkv" -f $Name, (Get-Date -Format "HHmmss"))

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = (Get-Command ffmpeg).Source
$psi.Arguments = "-hide_banner -loglevel error -y -f gdigrab -framerate 30 -draw_mouse 1 -i desktop -c:v libx264 -preset ultrafast -crf 18 -pix_fmt yuv420p `"$out`""
$psi.RedirectStandardInput = $true
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
$p = [System.Diagnostics.Process]::Start($psi)

"REC $out"
$deadline = (Get-Date).AddMinutes($MaxMinutes)
while (-not $p.HasExited -and -not (Test-Path -LiteralPath $flag) -and (Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 500
}
if (-not $p.HasExited) {
    $p.StandardInput.Write("q")   # так ffmpeg корректно закрывает файл
    $p.WaitForExit(15000) | Out-Null
}
Remove-Item -LiteralPath $flag -Force -ErrorAction SilentlyContinue
"DONE $out"
