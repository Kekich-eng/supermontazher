# Супермонтажёр

Бесплатный плагин для [Claude Code](https://claude.com/claude-code): монтаж роликов кодом, от сырой записи до публикации. Вы даёте запись голоса, он собирает ролик с моушен-дизайном, звуком и упаковкой.

Плагин вырос на примерно двадцати настоящих роликах канала [Никиты Беридзе](https://t.me/beridze_ai). Каждая ошибка стала правилом. Улучшайте его, делитесь своим: вместе обучать нейросеть быстрее.

## Что он умеет

- убирает паузы, дубли и оговорки по расшифровке;
- мягко обрабатывает голос;
- пишет монтажный план по секундам;
- рисует анимацию и моушен-графику в Remotion;
- подбирает музыку и звуки, в комплекте 52 своих звука без чужих прав;
- делает субтитры и нарезает шортсы;
- проверяет себя по кадрам и критикует готовый ролик;
- готовит описание, теги, пост и промпт обложки.

Главная особенность: **сцены привязаны не к секундам, а к словам**. Вырезали фразу, запустили одну команду, и всё само встало на свои места. Как это устроено: [references/engine.md](skills/supermontazher/references/engine.md).

## Установка

В Claude Code:

```
/plugin marketplace add Kekich-eng/supermontazher
/plugin install supermontazher@supermontazher
```

Нужно на компьютере: Python 3.10+ с пакетами `numpy`, `pillow`, `openai-whisper`, а также `ffmpeg` и Node.js 20+. Проект Remotion создаётся из папки `skills/supermontazher/remotion-template`. Для Whisper желательна видеокарта.

## Как начать

Откройте папку проекта в Claude Code и напишите:

> Смонтируй ролик. Вот запись голоса: путь/к/файлу.mp4

Он сделает черновой монтаж, покажет план и образец и будет ждать вашего «нравится» перед полным рендером. Нужен новый стиль: скажите какой, он запишет его в свои правила.

## Важно знать

- Плагин не слышит звук и не видит движение: он проверяет себя по кадрам, расшифровке и замерам громкости. Звук и плавность оценивает человек.
- Проверен на Windows 11. На macOS и Linux могут понадобиться мелкие правки путей и шрифтов.
- В `references/` записан опыт и вкус автора. Меняйте под себя: это и есть обучение.
- Записанные звуки и музыка в плагин не входят, откуда их взять, написано в `references/sfx-library.md`.

## Лицензия

MIT, см. [LICENSE](LICENSE). Шрифты Manrope, Unbounded, IBM Plex Mono и Golos Text подключаются из Google Fonts по лицензии OFL.

---

**English.** Supermontazher is a free Claude Code plugin that turns a raw voice recording into a finished video: rough cut, gentle voice processing, a shot-by-shot plan, Remotion motion graphics, sound, shorts, subtitles and packaging. Scenes are anchored to spoken words instead of seconds, so cutting a phrase and running one command puts everything back in place. The instructions are in Russian. Install with the two `/plugin` commands above.
