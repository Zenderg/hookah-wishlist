# Material Design 3 Color Tokens — Справочник

Краткий справочник по системным CSS-переменным Angular Material для цветов.

## Общая логика

- **Базовый цвет** (например, `--mat-sys-primary`) — используется как фон элемента
- **On-цвет** (например, `--mat-sys-on-primary`) — цвет текста/иконки, размещённой на этом фоне
- **Container-цвет** — более светлая/тёмная вариация для контейнеров (карточки, панели)
- **On-container-цвет** — текст/иконки на контейнере

## Primary — Основной брендовый цвет

Используется для самых заметных компонентов: кнопки, активные элементы, индикаторы.

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-primary` | Основной цвет для фонов кнопок, активных элементов |
| `--mat-sys-on-primary` | Текст/иконки на primary фоне |
| `--mat-sys-primary-container` | Фон контейнеров с акцентом на primary (карточки, панели) |
| `--mat-sys-on-primary-container` | Текст/иконки на primary-container фоне |
| `--mat-sys-primary-fixed` | Фиксированный оттенок primary (одинаковый в light/dark) |
| `--mat-sys-on-primary-fixed` | Текст/иконки на primary-fixed фоне |
| `--mat-sys-on-primary-fixed-variant` | Альтернативный текст на primary-fixed |
| `--mat-sys-primary-fixed-dim` | Более приглушённый вариант primary-fixed |
| `--mat-sys-inverse-primary` | Инвертированный primary для инверсных тем |

## Secondary — Вторичный акцентный цвет

Используется для выделения элементов: FAB кнопка, индикатор активной вкладки, подчёркивания.

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-secondary` | Вторичный акцентный цвет |
| `--mat-sys-on-secondary` | Текст/иконки на secondary фоне |
| `--mat-sys-secondary-container` | Фон контейнеров с акцентом на secondary |
| `--mat-sys-on-secondary-container` | Текст/иконки на secondary-container фоне |
| `--mat-sys-secondary-fixed` | Фиксированный оттенок secondary |
| `--mat-sys-on-secondary-fixed` | Текст/иконки на secondary-fixed фоне |
| `--mat-sys-on-secondary-fixed-variant` | Альтернативный текст на secondary-fixed |
| `--mat-sys-secondary-fixed-dim` | Более приглушённый вариант secondary-fixed |

## Tertiary — Третий акцентный цвет

Используется для контрастирующих акцентов, которые балансируют primary и secondary.

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-tertiary` | Третий акцентный цвет |
| `--mat-sys-on-tertiary` | Текст/иконки на tertiary фоне |
| `--mat-sys-tertiary-container` | Фон контейнеров с акцентом на tertiary |
| `--mat-sys-on-tertiary-container` | Текст/иконки на tertiary-container фоне |
| `--mat-sys-tertiary-fixed` | Фиксированный оттенок tertiary |
| `--mat-sys-on-tertiary-fixed` | Текст/иконки на tertiary-fixed фоне |
| `--mat-sys-on-tertiary-fixed-variant` | Альтернативный текст на tertiary-fixed |
| `--mat-sys-tertiary-fixed-dim` | Более приглушённый вариант tertiary-fixed |

## Error — Цвет ошибок

Используется для коммуникации состояний ошибок: неверный пароль, валидация, предупреждения.

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-error` | Основной цвет ошибок |
| `--mat-sys-on-error` | Текст/иконки на error фоне |
| `--mat-sys-error-container` | Фон контейнеров с акцентом на error |
| `--mat-sys-on-error-container` | Текст/иконки на error-container фоне |

## Surface — Поверхности и фоны

Используется для фонов, карточек, панелей, модальных окон.

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-surface` | Основной фон приложения (низкая акцентность) |
| `--mat-sys-on-surface` | Основной текст/иконки на surface фоне |
| `--mat-sys-on-surface-variant` | Альтернативный текст на surface фоне |
| `--mat-sys-surface-bright` | Более яркий вариант surface |
| `--mat-sys-surface-container` | Фон контейнеров (карточки, панели) |
| `--mat-sys-surface-container-high` | Более акцентный вариант контейнера |
| `--mat-sys-surface-container-highest` | Самый акцентный вариант контейнера |
| `--mat-sys-surface-container-low` | Менее акцентный вариант контейнера |
| `--mat-sys-surface-container-lowest` | Самый низкоакцентный вариант контейнера |
| `--mat-sys-surface-dim` | Приглушённый вариант surface |
| `--mat-sys-surface-tint` | Лёгкий оттенок surface |
| `--mat-sys-surface-variant` | Вариативный оттенок surface |
| `--mat-sys-inverse-surface` | Инвертированный surface |
| `--mat-sys-inverse-on-surface` | Текст/иконки на inverse-surface |

## Miscellaneous — Разное

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-background` | Фон страницы/приложения (базовый) |
| `--mat-sys-on-background` | Текст/иконки на background фоне |
| `--mat-sys-neutral-variant20` | Нейтральный вариант (20% оттенок) |
| `--mat-sys-neutral10` | Нейтральный оттенок (10%) |
| `--mat-sys-outline` | Цвет рамок, разделителей, границ |
| `--mat-sys-outline-variant` | Альтернативный цвет рамок |
| `--mat-sys-scrim` | Затемняющий оверлей (для модалок, меню) |
| `--mat-sys-shadow` | Цвет теней |

## Рекомендации по использованию

1. **Всегда используйте пары**: базовый цвет + соответствующий on-цвет для обеспечения контраста
2. **Для своих компонентов**: используйте `--mat-sys-*` переменные вместо жёстких hex-значений
3. **Light/Dark режимы**: все токены автоматически адаптируются к текущей теме
4. **Container-токены**: используйте для карточек, панелей, модальных окон
5. **Fixed-токены**: используйте, когда цвет должен быть одинаковым в light и dark режимах

---

## Связанные документы

- [`material-rules.md`](material-rules.md) — Полное руководство по токенам, темам и кастомизации
