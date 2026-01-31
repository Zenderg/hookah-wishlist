# Material Design 3 Typography Tokens — Справочник

Краткий справочник по системным CSS-переменным Angular Material для типографики.

## Общая логика

Каждая типографическая роль имеет полный токен (например, `--mat-sys-body-large`) и отдельные под-токены для детальной настройки:

| Под-токен | Назначение |
|-----------|------------|
| `-{category}-{size}` | Полное определение шрифта (включает все свойства) |
| `-{category}-{size}-font` | Семейство шрифтов (например, `Roboto, sans-serif`) |
| `-{category}-{size}-line-height` | Межстрочный интервал (например, `1.5rem`) |
| `-{category}-{size}-size` | Размер шрифта (например, `1rem`) |
| `-{category}-{size}-tracking` | Межбуквенный интервал (например, `0.031rem`) |
| `-{category}-{size}-weight` | Жирность шрифта (например, `400`) |
| `-{category}-{size}-weight-prominent` | Акцентная жирность (только для label) |

---

## Body — Основной текст

Используется для длинных текстов, абзацев, описаний. Избегайте декоративных шрифтов для body текста.

### Body Large

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-body-large` | Полное определение шрифта |
| `--mat-sys-body-large-font` | Семейство шрифтов |
| `--mat-sys-body-large-line-height` | Межстрочный интервал |
| `--mat-sys-body-large-size` | Размер шрифта |
| `--mat-sys-body-large-tracking` | Межбуквенный интервал |
| `--mat-sys-body-large-weight` | Жирность шрифта |

**Пример:**
```css
.description {
  font: var(--mat-sys-body-large);
}

/* Или детально: */
.description {
  font-family: var(--mat-sys-body-large-font);
  font-size: var(--mat-sys-body-large-size);
  line-height: var(--mat-sys-body-large-line-height);
  font-weight: var(--mat-sys-body-large-weight);
  letter-spacing: var(--mat-sys-body-large-tracking);
}
```

### Body Medium

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-body-medium` | Полное определение шрифта |
| `--mat-sys-body-medium-font` | Семейство шрифтов |
| `--mat-sys-body-medium-line-height` | Межстрочный интервал |
| `--mat-sys-body-medium-size` | Размер шрифта |
| `--mat-sys-body-medium-tracking` | Межбуквенный интервал |
| `--mat-sys-body-medium-weight` | Жирность шрифта |

### Body Small

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-body-small` | Полное определение шрифта |
| `--mat-sys-body-small-font` | Семейство шрифтов |
| `--mat-sys-body-small-line-height` | Межстрочный интервал |
| `--mat-sys-body-small-size` | Размер шрифта |
| `--mat-sys-body-small-tracking` | Межбуквенный интервал |
| `--mat-sys-body-small-weight` | Жирность шрифта |

---

## Display — Дисплейный текст

Самый крупный текст на экране. Резервирован для коротких, важных текстов или цифр, особенно на больших экранах.

### Display Large

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-display-large` | Полное определение шрифта |
| `--mat-sys-display-large-font` | Семейство шрифтов |
| `--mat-sys-display-large-line-height` | Межстрочный интервал |
| `--mat-sys-display-large-size` | Размер шрифта |
| `--mat-sys-display-large-tracking` | Межбуквенный интервал |
| `--mat-sys-display-large-weight` | Жирность шрифта |

**Пример:**
```css
.hero-title {
  font: var(--mat-sys-display-large);
}
```

### Display Medium

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-display-medium` | Полное определение шрифта |
| `--mat-sys-display-medium-font` | Семейство шрифтов |
| `--mat-sys-display-medium-line-height` | Межстрочный интервал |
| `--mat-sys-display-medium-size` | Размер шрифта |
| `--mat-sys-display-medium-tracking` | Межбуквенный интервал |
| `--mat-sys-display-medium-weight` | Жирность шрифта |

### Display Small

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-display-small` | Полное определение шрифта |
| `--mat-sys-display-small-font` | Семейство шрифтов |
| `--mat-sys-display-small-line-height` | Межстрочный интервал |
| `--mat-sys-display-small-size` | Размер шрифта |
| `--mat-sys-display-small-tracking` | Межбуквенный интервал |
| `--mat-sys-display-small-weight` | Жирность шрифта |

---

## Headline — Заголовки

Подходят для короткого текста с высокой акцентностью на маленьких экранах. Идеальны для выделения основных участков текста или ключевых областей контента.

### Headline Large

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-headline-large` | Полное определение шрифта |
| `--mat-sys-headline-large-font` | Семейство шрифтов |
| `--mat-sys-headline-large-line-height` | Межстрочный интервал |
| `--mat-sys-headline-large-size` | Размер шрифта |
| `--mat-sys-headline-large-tracking` | Межбуквенный интервал |
| `--mat-sys-headline-large-weight` | Жирность шрифта |

**Пример:**
```css
.page-title {
  font: var(--mat-sys-headline-large);
}
```

### Headline Medium

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-headline-medium` | Полное определение шрифта |
| `--mat-sys-headline-medium-font` | Семейство шрифтов |
| `--mat-sys-headline-medium-line-height` | Межстрочный интервал |
| `--mat-sys-headline-medium-size` | Размер шрифта |
| `--mat-sys-headline-medium-tracking` | Межбуквенный интервал |
| `--mat-sys-headline-medium-weight` | Жирность шрифта |

### Headline Small

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-headline-small` | Полное определение шрифта |
| `--mat-sys-headline-small-font` | Семейство шрифтов |
| `--mat-sys-headline-small-line-height` | Межстрочный интервал |
| `--mat-sys-headline-small-size` | Размер шрифта |
| `--mat-sys-headline-small-tracking` | Межбуквенный интервал |
| `--mat-sys-headline-small-weight` | Жирность шрифта |

---

## Label — Подписи и метки

Маленькие и утилитарные стили для текста внутри компонентов или очень маленького текста в теле контента, например, подписей.

### Label Large

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-label-large` | Полное определение шрифта |
| `--mat-sys-label-large-font` | Семейство шрифтов |
| `--mat-sys-label-large-line-height` | Межстрочный интервал |
| `--mat-sys-label-large-size` | Размер шрифта |
| `--mat-sys-label-large-tracking` | Межбуквенный интервал |
| `--mat-sys-label-large-weight` | Жирность шрифта |
| `--mat-sys-label-large-weight-prominent` | Акцентная жирность |

**Пример:**
```css
.button {
  font: var(--mat-sys-label-large);
}

.button.prominent {
  font-weight: var(--mat-sys-label-large-weight-prominent);
}
```

### Label Medium

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-label-medium` | Полное определение шрифта |
| `--mat-sys-label-medium-font` | Семейство шрифтов |
| `--mat-sys-label-medium-line-height` | Межстрочный интервал |
| `--mat-sys-label-medium-size` | Размер шрифта |
| `--mat-sys-label-medium-tracking` | Межбуквенный интервал |
| `--mat-sys-label-medium-weight` | Жирность шрифта |
| `--mat-sys-label-medium-weight-prominent` | Акцентная жирность |

### Label Small

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-label-small` | Полное определение шрифта |
| `--mat-sys-label-small-font` | Семейство шрифтов |
| `--mat-sys-label-small-line-height` | Межстрочный интервал |
| `--mat-sys-label-small-size` | Размер шрифта |
| `--mat-sys-label-small-tracking` | Межбуквенный интервал |
| `--mat-sys-label-small-weight` | Жирность шрифта |

---

## Title — Титулы

Меньше, чем headline стили. Используются для текста со средней акцентностью, который относительно короткий. Идеальны для разделения вторичных участков текста или вторичных областей контента.

### Title Large

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-title-large` | Полное определение шрифта |
| `--mat-sys-title-large-font` | Семейство шрифтов |
| `--mat-sys-title-large-line-height` | Межстрочный интервал |
| `--mat-sys-title-large-size` | Размер шрифта |
| `--mat-sys-title-large-tracking` | Межбуквенный интервал |
| `--mat-sys-title-large-weight` | Жирность шрифта |

**Пример:**
```css
.section-title {
  font: var(--mat-sys-title-large);
}
```

### Title Medium

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-title-medium` | Полное определение шрифта |
| `--mat-sys-title-medium-font` | Семейство шрифтов |
| `--mat-sys-title-medium-line-height` | Межстрочный интервал |
| `--mat-sys-title-medium-size` | Размер шрифта |
| `--mat-sys-title-medium-tracking` | Межбуквенный интервал |
| `--mat-sys-title-medium-weight` | Жирность шрифта |

### Title Small

| Переменная | Назначение |
|------------|------------|
| `--mat-sys-title-small` | Полное определение шрифта |
| `--mat-sys-title-small-font` | Семейство шрифтов |
| `--mat-sys-title-small-line-height` | Межстрочный интервал |
| `--mat-sys-title-small-size` | Размер шрифта |
| `--mat-sys-title-small-tracking` | Межбуквенный интервал |
| `--mat-sys-title-small-weight` | Жирность шрифта |

---

## Рекомендации по использованию

1. **Используйте полный токен** (например, `--mat-sys-body-large`) для простого применения всех свойств шрифта
2. **Используйте под-токены** для детальной настройки или когда нужно изменить только одно свойство
3. **Body** — для длинных текстов, описаний, абзацев
4. **Display** — для крупных заголовков на больших экранах, цифр
5. **Headline** — для заголовков страниц и секций
6. **Label** — для кнопок, полей ввода, подписей
7. **Title** — для подзаголовков, названий секций
8. **Weight-prominent** — используйте для акцентных кнопок или важных меток

---

## Связанные документы

- [`material-tokens-color.md`](material-tokens-color.md) — Справочник по цветовым токенам
- [`material-rules.md`](material-rules.md) — Полное руководство по токенам, темам и кастомизации
