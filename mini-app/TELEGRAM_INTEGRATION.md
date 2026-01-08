# Telegram Web Apps API Integration

This document explains how the hookah-wishlist mini-app integrates with the Telegram Web Apps API for authentication and user identification.

## Overview

The mini-app uses Telegram Web Apps API to:
- Authenticate users automatically without requiring passwords
- Extract user information (ID, name, username)
- Send authentication data to the backend via `X-Telegram-Init-Data` header
- Provide a seamless user experience within Telegram

## Key Components

### 1. API Service (`src/services/api.ts`)

The API service handles all Telegram Web Apps API integration:

#### Initialization

```typescript
import { apiService } from './services/api';

// Initialize Telegram Web Apps API
const webApp = apiService.initializeTelegram();

if (webApp) {
  // App is running in Telegram
  console.log('Telegram user:', apiService.getTelegramUser());
} else {
  // App is running in development mode (browser)
  console.log('Development mode detected');
}
```

#### Automatic Authentication

All API requests automatically include the `X-Telegram-Init-Data` header:

```typescript
// This request automatically includes Telegram authentication
const wishlist = await apiService.getWishlist();
```

#### Utility Methods

- `isTelegramAvailable()`: Check if app is running in Telegram
- `getTelegramUser()`: Get current Telegram user information
- `initializeTelegram()`: Initialize Telegram Web Apps API

### 2. Development Mode Support

The app automatically detects development mode and provides mock authentication data:

```typescript
// Development mode: Uses mock init data
const isDevelopment = import.meta.env.DEV;

// Mock user data for testing
{
  id: 123456789,
  first_name: 'Test',
  last_name: 'User',
  username: 'testuser',
  language_code: 'en'
}
```

### 3. Error Handling

The API service includes comprehensive error handling for authentication failures:

- **401 Unauthorized**: Invalid or missing Telegram init data
- **403 Forbidden**: User doesn't have permission
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500+ Server Error**: Server-side errors
- **Network Error**: Connection issues

## Usage Examples

### Basic Usage in Components

```typescript
import { useEffect } from 'react';
import { apiService } from '../services/api';

function MyComponent() {
  useEffect(() => {
    // Initialize Telegram on component mount
    const webApp = apiService.initializeTelegram();
    
    if (webApp) {
      // Access Telegram features
      webApp.expand();
      webApp.ready();
    }
  }, []);

  return <div>My Component</div>;
}
```

### Checking Telegram Availability

```typescript
import { apiService } from '../services/api';

if (apiService.isTelegramAvailable()) {
  // App is running in Telegram
  const user = apiService.getTelegramUser();
  console.log('User ID:', user?.id);
} else {
  // App is running in development mode
  console.log('Development mode');
}
```

### Making Authenticated Requests

```typescript
import { apiService } from '../services/api';

// All requests are automatically authenticated
async function fetchWishlist() {
  try {
    const wishlist = await apiService.getWishlist();
    console.log('Wishlist:', wishlist);
  } catch (error) {
    console.error('Failed to fetch wishlist:', error.message);
  }
}
```

## Authentication Flow

### Production Mode (Telegram)

1. User opens mini-app in Telegram
2. Telegram provides `initData` string containing user information
3. Frontend extracts `initData` from `window.Telegram.WebApp.initData`
4. All API requests include `X-Telegram-Init-Data` header
5. Backend validates `initData` using cryptographic verification
6. Backend extracts user ID and processes request

### Development Mode (Browser)

1. App runs in browser (not Telegram)
2. Frontend detects development mode via `import.meta.env.DEV`
3. Frontend generates mock `initData` with test user
4. All API requests include mock `X-Telegram-Init-Data` header
5. Backend validates mock `initData` (should accept for testing)
6. Backend processes request with test user ID

## Configuration

### Environment Variables

```bash
# .env file
VITE_API_URL=http://localhost:3000/api/v1
```

### TypeScript Types

The project uses `@twa-dev/types` for proper TypeScript support:

```bash
npm install --save-dev @twa-dev/types
```

## Testing

### Testing in Development Mode

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser
3. The app will automatically use mock Telegram data
4. All API requests will include mock authentication

### Testing in Telegram

1. Build the production version:
   ```bash
   npm run build
   ```

2. Deploy the app to a web server
3. Configure the Telegram bot with the mini-app URL
4. Open the mini-app from Telegram
5. The app will use real Telegram authentication

## Troubleshooting

### "Authentication failed" Error

**Cause**: Invalid or missing Telegram init data

**Solution**:
- Ensure app is opened from Telegram (not directly in browser)
- Check that Telegram Web Apps API is available
- Verify backend authentication middleware is working correctly

### "Telegram Web Apps API not available" Warning

**Cause**: App is running in development mode (browser)

**Solution**:
- This is expected behavior in development mode
- The app will use mock authentication data
- For production testing, deploy and open from Telegram

### TypeScript Errors

**Cause**: Missing or incorrect TypeScript types

**Solution**:
- Ensure `@twa-dev/types` is installed
- Check that `window.Telegram.WebApp` is properly typed
- Verify all imports are correct

## Security Considerations

1. **Never expose sensitive data**: The `initData` string contains user information but is cryptographically signed by Telegram
2. **Backend validation**: Always validate `initData` on the backend using Telegram's verification algorithm
3. **HTTPS required**: Always use HTTPS in production to prevent man-in-the-middle attacks
4. **Mock data only for development**: Never use mock authentication in production

## Additional Resources

- [Telegram Web Apps API Documentation](https://core.telegram.org/bots/webapps)
- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [@twa-dev/types Package](https://www.npmjs.com/package/@twa-dev/types)

## Implementation Details

### Init Data Format

The `initData` string is a URL-encoded query string containing:

```
user={"id":123456789,"first_name":"Test","last_name":"User","username":"testuser","language_code":"en"}
&auth_date=1234567890
&hash=abc123...
```

### Backend Authentication

The backend authentication middleware (`backend/src/api/middleware/auth.ts`) validates the `initData` by:

1. Extracting the hash from `initData`
2. Reconstructing the data string without the hash
3. Creating an HMAC-SHA256 signature using the bot token
4. Comparing the computed hash with the provided hash
5. Extracting the user ID if validation succeeds

### Error Messages

The API service provides user-friendly error messages:

- "Authentication failed. Please open this app from Telegram."
- "Access denied. You do not have permission to perform this action."
- "The requested resource was not found."
- "Too many requests. Please try again later."
- "Server error. Please try again later."
- "Network error. Please check your connection and try again."

## Best Practices

1. **Always initialize Telegram**: Call `apiService.initializeTelegram()` on app mount
2. **Handle errors gracefully**: Use try-catch blocks for all API calls
3. **Check Telegram availability**: Use `isTelegramAvailable()` for conditional logic
4. **Test in both modes**: Test in development mode and Telegram
5. **Log errors for debugging**: Use console.error for API errors
6. **Provide user feedback**: Show error messages to users when requests fail

## Future Enhancements

Potential improvements to the Telegram integration:

- Add support for Telegram theme colors
- Implement haptic feedback using `HapticFeedback` API
- Add main button integration for primary actions
- Support for Telegram's `BackButton` API
- Implement popup dialogs using `Popup` API
- Add support for Telegram's `ScanQrPopup` API
