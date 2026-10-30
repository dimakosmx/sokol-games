/*
  КАТАЛОГ ИГР — редактируй этот файл, чтобы добавлять новые игры.
  status: "ready" (готово) или "soon" (скоро)
  url: относительный путь до HTML-файла игры; только локальные пути.
  icon: эмодзи; colors: два цвета градиента.
  devices: список поддерживаемых устройств — computer, phone, tablet.
*/
const GAMES = [
  {
    id: "neon-dodge",
    title: "NEON DODGE",
    subtitle: "Уклоняйся от препятствий и собирай энергию",
    genre: "Аркада",
    status: "ready",
    url: "games/demo/index.html",
    icon: "◈",
    colors: ["#5736d9", "#04c8e8"],
    devices: ["computer", "phone", "tablet"],
    controls: "Мышь, касание экрана или стрелки ← →. Собирай голубые сферы, избегай розовых блоков."
  },
  {
    id: "space-runner",
    title: "SPACE RUNNER",
    subtitle: "Уворачивайся от метеоритов, стреляй и собирай обломки",
    genre: "Космос",
    status: "ready",
    url: "games/space-runner/index.html",
    icon: "🚀",
    colors: ["#5c29b8", "#e94891"],
    devices: ["computer", "phone", "tablet"],
    controls: "Веди мышь вверх / вниз или пальцем по экрану. Удерживай левую кнопку мыши / FIRE для стрельбы. R — рестарт."
  },
  {
    id: "apple-catcher",
    title: "APPLE CATCHER",
    subtitle: "Яблоки, динамит и Lucky Block с 8 сюрпризами",
    genre: "Реакция",
    status: "ready",
    url: "games/apple-catcher/index.html",
    icon: "🍎",
    colors: ["#0f8168", "#bfe557"],
    devices: ["computer", "phone", "tablet"],
    controls: "Стрелки ← →; на телефоне — кнопки или касание поля. Лови яблоки и Lucky Block, избегай динамита. Пробел — новая игра."
  },
  {
    id: "pong-arena",
    title: "PONG ARENA",
    subtitle: "Два игрока, звуки, очки и 5-минутный матч",
    genre: "На двоих",
    status: "ready",
    url: "games/pong-arena/index.html",
    icon: "🏓",
    colors: ["#164b9b", "#53a5fb"],
    devices: ["computer", "phone", "tablet"],
    controls: "Красный игрок: W / S · Синий игрок: ↑ / ↓ · 5 минут, побеждает набравший больше очков · R — перезапуск"
  },
  {
    id: "secret-game",
    title: "SECRET PROJECT",
    subtitle: "Новая игра уже на горизонте",
    genre: "Секрет",
    status: "soon",
    url: "",
    icon: "?",
    colors: ["#45405d", "#8a6cce"],
    devices: ["computer", "phone", "tablet"],
    controls: ""
  }
];
