# Telegram Bot Specification

## Overview

The Telegram Bot provides a command-based interface for users to interact with the Hookah Wishlist System. It serves as the primary entry point for users and provides quick access to wishlist functionality through text commands and inline keyboards. The bot runs in a Docker container and is deployed via Coolify.

## Bot Configuration

### Bot Setup

- **Bot Token**: Stored in Coolify environment variables
- **Bot Username**: Configured via BotFather
- **Bot Commands**: Registered via BotFather API

### Webhook Configuration

The bot uses webhooks for real-time updates. Coolify automatically configures webhook URL.

```typescript
const webhookUrl = 'https://api.yourdomain.com/bot/webhook';
```

## Commands

### `/start`

Initializes the bot for a new user and displays the welcome message.

**Usage**: `/start`

**Response**:
```
👋 Добро пожаловать в Hookah Wishlist!

Я помогу тебе управлять списком кальянных табаков, которые ты хочешь купить.

📋 Команды:
/start - Показать это сообщение
/help - Справка по командам
/list - Показать список покупок
/add - Добавить табак в список
/remove - Удалить табак из списка
/clear - Очистить список
/app - Открыть Mini App

💡 Совет: Используйте Mini App для более удобного интерфейса с картинками!
```

**Behavior**:
- Creates user record if not exists
- Creates default wishlist if not exists
- Shows inline keyboard with quick actions

**Inline Keyboard**:
```
[📋 Мой список] [➕ Добавить] [📱 Mini App]
```

---

### `/help`

Displays help information with all available commands.

**Usage**: `/help`

**Response**:
```
📚 Справка

🔍 Поиск и добавление:
/add <название> - Добавить табак по названию
/search <запрос> - Поиск табака в базе

📋 Управление списком:
/list - Показать список покупок
/remove <номер> - Удалить табак из списка
/clear - Очистить весь список
/purchased - Показать купленные товары

⚙️ Другие команды:
/start - Главное меню
/app - Открыть Mini App
/settings - Настройки

💡 Примеры:
/add Sarma Зима
/search мята
/remove 1
```

---

### `/list`

Displays the user's current wishlist.

**Usage**: `/list`

**Response** (with items):
```
📋 Ваш список покупок:

1. Sarma - Зима
2. Tangiers - Cane Mint
3. Custom Brand - Custom Tobacco

Всего: 3 товара

[📱 Mini App] [➕ Добавить] [🗑️ Очистить]
```

**Response** (empty):
```
📋 Ваш список покупок пуст

Добавьте первый табак командой /add или через Mini App!

[➕ Добавить] [📱 Mini App]
```

**Behavior**:
- Fetches wishlist from API
- Formats as plain text (no images)
- Shows inline keyboard for quick actions
- Limits to first 20 items (with message "и еще X товаров..." if more)

---

### `/add`

Adds a tobacco to the user's wishlist.

**Usage**: `/add <название табака>`

**Examples**:
- `/add Sarma Зима`
- `/add Tangiers Cane Mint`
- `/add Custom Tobacco from Custom Brand`

**Response** (found in database):
```
✅ Табак добавлен в список!

Sarma - Зима

[📋 Список] [➕ Еще добавить]
```

**Response** (not found, added as custom):
```
✅ Табак добавлен в список!

Custom Tobacco from Custom Brand
(Табак не найден в базе, добавлен как пользовательский)

[📋 Список] [➕ Еще добавить]
```

**Response** (already in wishlist):
```
⚠️ Этот табак уже есть в вашем списке!

Sarma - Зима

[📋 Список] [➕ Другой табак]
```

**Behavior**:
- Searches tobacco database by name
- If found, adds with tobacco_id
- If not found, adds as custom (custom_name, custom_brand)
- Checks for duplicates before adding
- Shows inline keyboard for quick actions

**Multi-step flow** (if no parameter provided):
```
🔍 Введите название табака:

Например: Sarma Зима
```

**After user input**:
- Performs search and shows results
- Allows user to select from multiple matches
- Adds selected tobacco to wishlist

---

### `/remove`

Removes a tobacco from the user's wishlist.

**Usage**: `/remove <номер>`

**Example**: `/remove 1`

**Response** (success):
```
✅ Табак удален из списка!

Sarma - Зима

[📋 Список] [➕ Добавить]
```

**Response** (invalid number):
```
❌ Неверный номер товара

Пожалуйста, введите номер от 1 до 5

[📋 Список]
```

**Multi-step flow** (if no parameter provided):
```
🗑️ Удаление товара

Выберите номер товара для удаления:

1. Sarma - Зима
2. Tangiers - Cane Mint

[Отмена]
```

**Behavior**:
- Shows numbered list of items
- User replies with number
- Removes selected item
- Shows confirmation

---

### `/clear`

Clears all items from the user's wishlist.

**Usage**: `/clear`

**Response** (confirmation prompt):
```
⚠️ Вы уверены, что хотите очистить весь список?

Это действие нельзя отменить.

[✅ Да, очистить] [❌ Отмена]
```

**After confirmation**:
```
✅ Список очищен!

[➕ Добавить] [📱 Mini App]
```

**Behavior**:
- Shows confirmation dialog
- Requires explicit confirmation
- Deletes all items from wishlist
- Shows success message

---

### `/purchased`

Shows purchased items in the wishlist.

**Usage**: `/purchased`

**Response** (with items):
```
✅ Купленные товары:

1. Sarma - Зима (куплено 01.01.2025)
2. Tangiers - Cane Mint (куплено 02.01.2025)

Всего: 2 товара

[🗑️ Очистить купленные] [📋 Активные]
```

**Response** (empty):
```
✅ Купленных товаров нет

[📋 Активные]
```

**Behavior**:
- Shows items marked as purchased
- Displays purchase date
- Provides action buttons

---

### `/search`

Searches for tobaccos in the database.

**Usage**: `/search <запрос>`

**Example**: `/search мята`

**Response** (with results):
```
🔍 Результаты поиска "мята":

1. Sarma - Зима
2. Tangiers - Cane Mint
3. Adalya - Love 66

[➕ Добавить 1] [➕ Добавить 2] [➕ Добавить 3]
[🔍 Другой запрос] [📋 Список]
```

**Response** (no results):
```
🔍 Ничего не найдено по запросу "мята"

Попробуйте другой запрос или добавьте табак вручную командой /add

[➕ Добавить вручную] [🔍 Другой запрос]
```

**Behavior**:
- Searches tobacco database
- Shows up to 10 results
- Provides inline buttons to add directly
- Allows quick search again

---

### `/app`

Opens the Mini App.

**Usage**: `/app`

**Response**:
```
📱 Открываю Mini App...

Если приложение не открылось, нажмите кнопку ниже:

[🚀 Открыть Mini App]
```

**Behavior**:
- Sends a message with Mini App button
- Button opens the web app in Telegram
- Uses Telegram's Web App functionality

---

### `/settings`

Opens settings menu.

**Usage**: `/settings`

**Response**:
```
⚙️ Настройки

Язык: 🇷🇺 Русский
Уведомления: 🔔 Включены

[🌐 Изменить язык] [🔔 Уведомления] [↩️ Назад]
```

**Behavior**:
- Shows current settings
- Provides options to change settings
- Saves user preferences

---

## Inline Keyboards

### Main Menu
```
[📋 Мой список] [➕ Добавить]
[🔍 Поиск] [📱 Mini App]
[⚙️ Настройки] [❓ Помощь]
```

### List Actions
```
[📋 Обновить] [➕ Добавить] [🗑️ Очистить]
[📱 Mini App] [🔍 Поиск]
```

### Add Actions
```
[🔍 Поиск в базе] [✍️ Ввести название]
[📋 Список] [↩️ Назад]
```

### Remove Confirmation
```
[✅ Да, удалить] [❌ Отмена]
```

### Clear Confirmation
```
[✅ Да, очистить] [❌ Отмена]
```

## Callback Queries

### Button Actions

Inline buttons use callback queries for actions:

**Format**: `action:param1:param2`

**Examples**:
- `add:1` - Add tobacco with ID 1
- `remove:5` - Remove wishlist item with ID 5
- `clear:confirm` - Confirm clear wishlist
- `open_app` - Open Mini App

**Response**:
- Shows loading state while processing
- Updates message or shows alert
- Handles errors gracefully

## Message Handling

### Text Messages

Bot processes text messages in context:

1. **After `/add` command**: Treated as tobacco name
2. **After `/remove` command**: Treated as item number
3. **After `/search` command**: Treated as search query
4. **Default**: Shows help message

### Context Management

Bot maintains conversation context for multi-step flows:

```typescript
interface BotContext {
  userId: number;
  state: 'idle' | 'waiting_for_tobacco_name' | 'waiting_for_item_number';
  data?: {
    searchQuery?: string;
    searchResults?: Tobacco[];
  };
}
```

## Error Handling

### Common Errors

**User not found**:
```
❌ Ошибка: Пользователь не найден

Пожалуйста, попробуйте команду /start
```

**API error**:
```
❌ Произошла ошибка. Попробуйте позже.

Если проблема повторяется, обратитесь в поддержку.
```

**Invalid input**:
```
❌ Неверный формат ввода

Пожалуйста, введите название табака или номер товара.
```

### Error Recovery

- Always provide a way to return to main menu
- Show helpful error messages
- Log errors for debugging
- Retry transient errors automatically

## Notifications

### Welcome Message

Sent to new users:

```
👋 Добро пожаловать в Hookah Wishlist!

Я помогу тебе управлять списком кальянных табаков.

🎯 Быстрые действия:
• Добавьте табак командой /add
• Откройте Mini App для удобного интерфейса
• Получите список покупок командой /list

💡 Начните с команды /start или откройте Mini App!
```

### Daily Reminder (Optional)

If enabled, sends daily reminder:

```
📋 Напоминание о списке покупок

У вас есть 3 товара в списке:

1. Sarma - Зима
2. Tangiers - Cane Mint
3. Adalya - Love 66

[📱 Открыть список] [🔕 Отключить напоминания]
```

## Rate Limiting

- **Command rate limit**: 10 commands per minute per user
- **Inline button rate limit**: 20 clicks per minute per user
- **Search rate limit**: 10 searches per minute per user

Exceeding limits:
```
⏳ Слишком много запросов. Пожалуйста, подождите немного.
```

## Localization

### Supported Languages

- 🇷🇺 Russian (default)
- 🇺🇸 English
- 🇪🇸 Spanish (future)

### Language Switching

User can change language via `/settings` command:

```
⚙️ Настройки / Settings

Выберите язык / Choose language:

[🇷🇺 Русский] [🇺🇸 English]
```

## Web App Integration

### initData Validation

Bot validates Mini App initData:

```typescript
const isValid = validateTelegramInitData(initData, botToken);
```

### Mini App Button

Button configuration:

```typescript
{
  text: '🚀 Открыть Mini App',
  web_app: {
    url: 'https://yourdomain.com/mini-app'
  }
}
```

## Session Management

### Session Storage

Bot stores session data in memory or Redis:

```typescript
interface Session {
  userId: number;
  state: BotState;
  data: Record<string, any>;
  lastActivity: Date;
}
```

### Session Expiration

- Sessions expire after 1 hour of inactivity
- Expired sessions are cleaned up automatically
- User returns to idle state on expiration

## Logging

### Log Levels

- **ERROR**: Critical errors
- **WARN**: Warnings and issues
- **INFO**: User actions and commands
- **DEBUG**: Detailed debugging information

### Log Format

```json
{
  "timestamp": "2025-01-01T00:00:00Z",
  "level": "INFO",
  "userId": 123456789,
  "command": "/list",
  "message": "User requested wishlist",
  "metadata": {
    "itemsCount": 5
  }
}
```

## Deployment

### Environment Variables

```env
# Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
API_URL=https://api.yourdomain.com/api/v1
API_KEY=your_bot_api_key_here
LOG_LEVEL=info
```

### Docker Configuration

The bot runs in a Docker container managed by Coolify:

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
```

### Coolify Deployment

- Bot is deployed as a Docker Compose service
- Environment variables managed in Coolify dashboard
- Automatic scaling and health monitoring
- Logs aggregated in Coolify dashboard

## Monitoring

### Metrics to Track

- Active users (daily/weekly/monthly)
- Commands executed per day
- Error rate
- Response time
- Mini App opens

### Health Checks

```bash
# Check bot status (via API)
curl https://api.yourdomain.com/bot/health

# Expected response:
{"status": "ok", "uptime": 123456}
```

## Summary

The Telegram Bot provides:

✅ **Command-based interface** - Easy to use text commands
✅ **Inline keyboards** - Quick actions without typing
✅ **Context awareness** - Multi-step flows with state management
✅ **Error handling** - Graceful error recovery
✅ **Localization** - Multi-language support
✅ **Mini App integration** - Seamless web app access
✅ **Rate limiting** - Protection against abuse
✅ **Logging** - Comprehensive activity tracking
✅ **Containerized** - Runs in Docker container
✅ **Coolify deployment** - Automated deployment and management

The bot serves as the primary interface for users who prefer text-based interaction and provides quick access to all core functionality.
