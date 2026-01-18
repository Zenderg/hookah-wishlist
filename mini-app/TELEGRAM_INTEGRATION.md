# Telegram Web Apps API Integration

This document explains how to hookah-wishlist mini-app integrates with Telegram Web Apps API for authentication and user identification.

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

All API requests automatically include `X-Telegram-Init-Data` header:

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

1. Start development server:
   ```bash
   npm run dev
   ```

2. Open app in your browser
3. The app will automatically use mock Telegram data
4. All API requests will include mock authentication

### Testing in Telegram

1. Build production version:
   ```bash
   npm run build
   ```

2. Deploy app to a web server
3. Configure Telegram bot with mini-app URL
4. Open mini-app from Telegram
5. The app will use real Telegram authentication

## Troubleshooting

### "Authentication failed" Error

**Cause**: Invalid or missing Telegram init data

**Solution**:
- Ensure app is opened from Telegram (not directly in browser)
- Check that Telegram Web Apps API is available
- Verify backend authentication middleware is working correctly
- Check backend logs for detailed error messages

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
5. **Support both signature formats**: Backend supports both old HMAC-SHA256 and new Ed25519 signature formats

## Additional Resources

- [Telegram Web Apps API Documentation](https://core.telegram.org/bots/webapps)
- [Telegram Mini Apps Documentation](https://docs.telegram-mini-apps.com/platform/init-data)
- [@twa-dev/types Package](https://www.npmjs.com/package/@twa-dev/types)

## Implementation Details

### Init Data Format

The `initData` string is a URL-encoded query string containing:

**New Format (Ed25519 signature - current):**
```
query_id=AAHdF6IQAAAAAN0XohDhrOrc
&user={"id":123456789,"first_name":"Test","last_name":"User","username":"testuser","language_code":"en"}
&auth_date=1234567890
&signature=3cPH_gFJPY1UR3VFTGw3ll-lE8Epu_0Sp7pSCwx9t_Hb_uHngjKlw6G6jTqxU7LFECm2Cwvl61j64ySw5Yf7CA
&hash=518b76045a970ade08c388c1cea37da79e1431ad24356acc7961153e4c01f958
```

**Old Format (HMAC-SHA256 signature - deprecated):**
```
user={"id":123456789,"first_name":"Test","last_name":"User","username":"testuser","language_code":"en"}
&auth_date=1234567890
&hash=abc123...
```

### Backend Authentication

The backend authentication middleware (`backend/src/api/middleware/auth.ts`) validates `initData` by:

**New Format (Ed25519):**
1. Extracting `signature` from `initData`
2. Extracting bot ID from bot token
3. Reconstructing data string without `hash` and `signature`, sorted alphabetically
4. Creating verify string: `{bot_id}:WebAppData\n{dataCheckString}`
5. Verifying Ed25519 signature using Telegram's public key
6. Extracting user ID if validation succeeds

**Old Format (HMAC-SHA256):**
1. Extracting `hash` from `initData`
2. Reconstructing data string without `hash`, sorted alphabetically
3. Creating HMAC-SHA256 signature using bot token
4. Comparing computed hash with provided hash
5. Extracting user ID if validation succeeds

The middleware automatically detects which format to use based on the presence of `signature` (new) or `hash` (old) parameters.

### Signature Verification Methods

#### Ed25519 (New Format - Recommended)

- Uses Telegram's public key for verification
- No need to share bot secret token with third parties
- More secure for third-party validation
- Supports both production and test environments

#### HMAC-SHA256 (Old Format - Deprecated)

- Uses bot token for verification
- Requires bot secret token on backend
- Still supported for backward compatibility
- Will be phased out in future Telegram updates

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
7. **Use Ed25519 verification**: Prefer new Ed25519 signature format for production
8. **Keep backend updated**: Ensure backend supports both signature formats for compatibility

## Future Enhancements

Potential improvements to Telegram integration:

- Add support for Telegram theme colors
- Implement haptic feedback using `HapticFeedback` API
- Add main button integration for primary actions
- Support for Telegram's `BackButton` API
- Implement popup dialogs using `Popup` API
- Add support for Telegram's `ScanQrPopup` API
- Implement third-party validation using Ed25519 public keys

## Dependencies

### Backend

- `tweetnacl`: Ed25519 signature verification library
- `crypto`: Node.js built-in cryptographic functions

### Frontend

- `@twa-dev/types`: TypeScript type definitions for Telegram Web Apps API
- `axios`: HTTP client for API requests

## Version Compatibility

- **Old Format (HMAC-SHA256)**: Supported for backward compatibility
- **New Format (Ed25519)**: Current standard, recommended for all new implementations
- **Auto-detection**: Backend automatically detects and uses appropriate verification method

The authentication system is designed to be future-proof and will continue to work as Telegram updates their Web Apps API.
