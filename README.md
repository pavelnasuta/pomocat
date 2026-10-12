# pomokitty

Pomokitty — локальный Pomodoro-таймер для детей на React и Vite.

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

## Офлайн-работа

После первого успешного открытия приложение устанавливает service worker. Он сохраняет оболочку приложения, иконки и локальные MP3-файлы из `sounds/`, поэтому Pomokitty доступен без сети. Новая версия приложения обновляется автоматически при следующем открытии после её публикации.

## Приватность

Имя ребёнка, настройки, история сессий и статистика сохраняются только в `localStorage` браузера. Приложение не отправляет эти данные на сервер и не использует внешние аудио- или графические ресурсы. В настройках можно очистить локальные данные.

## Публикация

При отправке изменений в ветку `main` GitHub Actions собирает `dist` и публикует его в GitHub Pages:

<https://pavelnasuta.github.io/pomokitty/>

## Команды

- `npm run dev` — локальный сервер разработки.
- `npm run build` — проверка типов и production-сборка.
- `npm run test` — unit-тесты.
- `npm run test:coverage` — unit-тесты с покрытием.
- `npm run test:e2e` — Playwright end-to-end тесты.
- `npm run lint` — проверка TypeScript.
