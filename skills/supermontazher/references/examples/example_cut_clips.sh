#!/usr/bin/env bash
# Режет записи экрана на куски под сценарий. В кадре нет рабочего стола, вкладок браузера
# и панели задач; поле с ключом размыто. Моменты с ошибками в нарезку не входят.
# Запуск: bash cut_clips.sh <файл чистого дубля запуска>
set -euo pipefail
cd "$(dirname "$0")"
SRC="raw/setup_203003.mkv"
RUN="${1:?укажи файл дубля, например raw/run_205500.mkv}"
OUT="clips"
rm -rf "$OUT"; mkdir -p "$OUT"
ENC="-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -an -movflags +faststart"
FIT="scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0B0D12"

cut() {  # имя, исходник, начало, длительность, фильтр
  ffmpeg -hide_banner -loglevel error -y -ss "$3" -t "$4" -i "$2" -vf "$5" $ENC "$OUT/$1.mp4"
}

# 1. Установка: только окно PowerShell
cut 01_install "$SRC" 0 140 "crop=960:508:268:262,$FIT"

# 2. Страница настроек: список сервисов (без вкладок и панели задач)
cut 02_admin "$SRC" 156 14 "crop=2560:1310:0:80,$FIT"

# 3. Карточка OpenRouter: вставка ключа. Сначала размываем поле ключа, потом приближаем окно
ffmpeg -hide_banner -loglevel error -y -ss 294 -t 16.5 -i "$SRC" -filter_complex \
  "[0:v]split[a][b];[b]crop=600:64:975:660,boxblur=14:5[bl];[a][bl]overlay=975:660,crop=1280:720:640:330,$FIT" \
  $ENC "$OUT/04_key.mp4"

# 4. Выбор бесплатной модели и кнопка «Применить»
cut 05a_model "$SRC" 404 28 "crop=1280:720:280:100,$FIT"
cut 05b_apply "$SRC" 428 10 "crop=1280:720:1280:650,$FIT"

# 5. Запуск fcc-claude — чистый дубль (без заголовка окна и панели задач)
# В правом нижнем углу всплывало уведомление мессенджера — кадр обрезан так, чтобы оно не попало.
# Последние секунды записи (после закрытия окна видны другие программы) отрезаны.
cut 08_run "$RUN" 1 73 "crop=2200:1238:0:28,$FIT"

# 6. Готовый калькулятор в браузере, приближённо
cut 09_result "$SRC" 886 56 "crop=1280:720:640:90,$FIT"

ls -l "$OUT" | awk 'NR>1{printf "%-18s %6.1f МБ\n",$NF,$5/1048576}'
