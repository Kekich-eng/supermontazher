# Облегчённая копия ролика для телефона: через Remote Control файлы тяжелее 30 МБ не доходят.
# Запуск: powershell -ExecutionPolicy Bypass -File preview.ps1 "<ролик>.mp4" [preview.mp4]
# Вертикальный ролик ужимается так же (ширина 540).
param([Parameter(Mandatory = $true)][string]$In, [string]$Out = "")
if ($Out -eq "") { $Out = Join-Path (Split-Path $In -Parent) "preview.mp4" }
$w = & ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 $In
$wh = $w.Split(',')
$scale = if ([int]$wh[0] -ge [int]$wh[1]) { "scale=960:-2" } else { "scale=540:-2" }
& ffmpeg -y -loglevel error -i $In -vf $scale -r 30 -c:v libx264 -crf 27 -maxrate 400k -bufsize 800k -c:a aac -b:a 80k -movflags +faststart $Out
$mb = [math]::Round((Get-Item $Out).Length / 1MB, 1)
Write-Output "$Out : $mb MB"
if ($mb -gt 29) { Write-Output "Больше 29 МБ: подними -crf до 30 или режь на части" }
