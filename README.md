# pomokitty

Pomokitty — локальный Pomodoro-таймер для детей на React и Vite. На главной странице расположен лендинг для родителей, само приложение открывается по пути `/app/`.

## Локальный запуск

Требуется Node.js 22 или новее.

```bash
npm install
npm run dev
```

Для проверки production-сборки:

```bash
npm run test
npm run build
npm run preview
```

## Проверка

Полная детерминированная проверка (включая production-сборку, `/pomokitty/` GitHub Pages assets и mobile Chromium):

```bash
npm run lint && npm run test && npm run build && npm run test:e2e
```

`npm run test:e2e` запускает isolated dev-server ровно командой `npm run dev` с `POMOKITTY_E2E_PORT=4173`; он не переиспользует уже запущенный сервер. Проверки рендеринга без прокрутки и наложений выполняются отдельно для 320×568, 360×800 и 393×852 (дополнительные сценарии используют 375×667 и 412×915). Vite dev assets загружаются от `/`, а E2E также собирает production-вариант и проверяет, что его JS/CSS/manifest используют `/pomokitty/` Pages base. Скриншоты и trace сохраняются Playwright только при сбое.

## Офлайн-работа

После первого успешного открытия приложение устанавливает service worker. Он сохраняет оболочку приложения, иконки и локальные MP3-файлы из `sounds/`, поэтому Pomokitty доступен без сети. Новая версия приложения обновляется автоматически при следующем открытии после её публикации.

## Приватность

Имя ребёнка, настройки, история сессий и статистика сохраняются только в `localStorage` браузера. Приложение не отправляет эти данные на сервер и не использует внешние аудио- или графические ресурсы. В настройках можно очистить локальные данные.

## Публикация

При отправке изменений в ветку `main` GitHub Actions собирает `dist` и публикует его в GitHub Pages:

<https://pavelnasuta.github.io/pomokitty/> — лендинг

<https://pavelnasuta.github.io/pomokitty/app/> — приложение

## Команды

- `npm run dev` — локальный сервер разработки.
- `npm run build` — проверка типов и production-сборка.
- `npm run preview` — локальная проверка production-сборки.
- `npm run test` — unit-тесты.
- `npm run test:coverage` — unit-тесты с покрытием.
- `npm run test:e2e` — Playwright end-to-end тесты.
- `npm run lint` — проверка TypeScript.
