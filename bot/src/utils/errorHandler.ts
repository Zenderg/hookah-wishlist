import { Context } from 'telegraf';
import { logger } from './logger.js';

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  SERVER = 'server',
  UNKNOWN = 'unknown',
}

/**
 * Error context for logging
 */
export interface ErrorContext {
  userId?: number;
  command?: string;
  error?: unknown;
  stack?: string;
  additionalInfo?: Record<string, unknown>;
}

/**
 * Categorize an error based on its type and properties
 */
export function categorizeError(error: unknown): ErrorCategory {
  if (!error) {
    return ErrorCategory.UNKNOWN;
  }

  // Check if it's an Error instance
  if (!(error instanceof Error)) {
    return ErrorCategory.UNKNOWN;
  }

  // Check for Axios errors (network/API errors)
  if ('response' in error) {
    const axiosError = error as { response?: { status?: number } };

    if (axiosError.response?.status) {
      const status = axiosError.response.status;

      if (status === 401 || status === 403) {
        return ErrorCategory.AUTHENTICATION;
      }
      if (status === 400 || status === 422) {
        return ErrorCategory.VALIDATION;
      }
      if (status === 404) {
        return ErrorCategory.NOT_FOUND;
      }
      if (status === 409) {
        return ErrorCategory.CONFLICT;
      }
      if (status >= 500) {
        return ErrorCategory.SERVER;
      }
    }
  }

  // Check for network errors (no response)
  if ('code' in error) {
    const errCode = (error as { code?: string }).code;
    if (errCode === 'ECONNREFUSED' || errCode === 'ENOTFOUND' || errCode === 'ETIMEDOUT') {
      return ErrorCategory.NETWORK;
    }
  }

  // Check for Telegraf errors
  if (error.name === 'TelegrafError') {
    return ErrorCategory.VALIDATION;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Generate a user-friendly error message based on error category
 */
export function getUserErrorMessage(_category: ErrorCategory, _context?: string): string {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  switch (_category) {
    case ErrorCategory.NETWORK:
      return '❌ Network error occurred. Please check your connection and try again.';

    case ErrorCategory.AUTHENTICATION:
      return '❌ Authentication failed. Please use /start to create your account or try again later.';

    case ErrorCategory.VALIDATION:
      return '⚠️ Invalid input. Please check your request and try again.';

    case ErrorCategory.NOT_FOUND:
      return '👤 User not found. Please use /start to create your account first.';

    case ErrorCategory.CONFLICT:
      return '⚠️ This item already exists in your wishlist.';

    case ErrorCategory.SERVER:
      return '❌ Server error occurred. Please try again later.';

    case ErrorCategory.UNKNOWN:
    default:
      return isDevelopment
        ? '❌ An unexpected error occurred. Please try again later.'
        : '❌ Something went wrong. Please try again later.';
  }
}

/**
 * Get additional action guidance based on error category
 */
export function getErrorGuidance(category: ErrorCategory): string | null {
  switch (category) {
    case ErrorCategory.NETWORK:
      return '💡 Tip: Make sure you have a stable internet connection.';
    case ErrorCategory.AUTHENTICATION:
      return '💡 Tip: Use /start to create or restore your account.';
    case ErrorCategory.VALIDATION:
      return '💡 Tip: Check that your input is in the correct format.';
    case ErrorCategory.NOT_FOUND:
      return '💡 Tip: Use /start to create a new account.';
    case ErrorCategory.SERVER:
      return '💡 Tip: The issue is on our end. Please try again in a few minutes.';
    default:
      return null;
  }
}

/**
 * Format error message with emoji and guidance
 */
export function formatErrorMessage(category: ErrorCategory, context?: string): string {
  const message = getUserErrorMessage(category, context);
  const guidance = getErrorGuidance(category);

  if (guidance) {
    return `${message}\n\n${guidance}`;
  }

  return message;
}

/**
 * Log error with context
 */
export function logError(category: ErrorCategory, context: ErrorContext): void {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const logData: Record<string, unknown> = {
    category,
    userId: context.userId,
    command: context.command,
    message: context.error instanceof Error ? context.error.message : String(context.error),
  };

  // Add stack trace in development
  if (isDevelopment && context.error instanceof Error && context.error.stack) {
    logData.stack = context.error.stack;
  }

  // Add additional info if provided
  if (context.additionalInfo) {
    Object.assign(logData, context.additionalInfo);
  }

  // Use appropriate log level
  if (category === ErrorCategory.NETWORK || category === ErrorCategory.SERVER) {
    logger.warn('Error occurred', logData);
  } else {
    logger.error('Error occurred', logData);
  }
}

/**
 * Handle error in a command context
 */
export async function handleCommandError(
  ctx: Context,
  error: unknown,
  commandName: string
): Promise<void> {
  const category = categorizeError(error);
  const userId = ctx.from?.id;

  const errorContext: ErrorContext = {
    userId,
    command: commandName,
    error,
    stack: error instanceof Error ? error.stack : undefined,
  };

  // Log the error
  logError(category, errorContext);

  // Send user-friendly message
  const errorMessage = formatErrorMessage(category);

  try {
    await ctx.reply(errorMessage);
  } catch (replyError) {
    logger.error('Failed to send error message to user', {
      userId,
      originalError: error instanceof Error ? error.message : String(error),
      replyError: replyError instanceof Error ? replyError.message : String(replyError),
    });
  }
}

/**
 * Handle error in a callback query context
 */
export async function handleCallbackError(
  ctx: Context,
  error: unknown,
  actionName: string
): Promise<void> {
  const category = categorizeError(error);
  const userId = ctx.from?.id;

  const errorContext: ErrorContext = {
    userId,
    command: `callback:${actionName}`,
    error,
    stack: error instanceof Error ? error.stack : undefined,
  };

  // Log the error
  logError(category, errorContext);

  // Answer callback query with error
  const callbackMessage = getCallbackErrorMessage(category);

  try {
    await ctx.answerCbQuery(callbackMessage);
  } catch (answerError) {
    logger.error('Failed to answer callback query', {
      userId,
      action: actionName,
      originalError: error instanceof Error ? error.message : String(error),
      answerError: answerError instanceof Error ? answerError.message : String(answerError),
    });
  }

  // Send user-friendly message
  const errorMessage = formatErrorMessage(category);

  try {
    await ctx.reply(errorMessage);
  } catch (replyError) {
    logger.error('Failed to send error message to user', {
      userId,
      originalError: error instanceof Error ? error.message : String(error),
      replyError: replyError instanceof Error ? replyError.message : String(replyError),
    });
  }
}

/**
 * Get error message for callback query (shorter format)
 */
function getCallbackErrorMessage(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.NETWORK:
      return 'Network error';
    case ErrorCategory.AUTHENTICATION:
      return 'Authentication failed';
    case ErrorCategory.VALIDATION:
      return 'Invalid input';
    case ErrorCategory.NOT_FOUND:
      return 'Not found';
    case ErrorCategory.CONFLICT:
      return 'Already exists';
    case ErrorCategory.SERVER:
      return 'Server error';
    default:
      return 'Error occurred';
  }
}

/**
 * Check if error is a specific Axios error with status code
 */
export function isAxiosErrorWithStatus(error: unknown, status: number): boolean {
  if (!(error instanceof Error) || !('response' in error)) {
    return false;
  }

  const axiosError = error as { response?: { status?: number } };
  return axiosError.response?.status === status;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return categorizeError(error) === ErrorCategory.NETWORK;
}

/**
 * Check if error is an authentication error
 */
export function isAuthenticationError(error: unknown): boolean {
  return categorizeError(error) === ErrorCategory.AUTHENTICATION;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  return categorizeError(error) === ErrorCategory.VALIDATION;
}

/**
 * Check if error is a not found error
 */
export function isNotFoundError(error: unknown): boolean {
  return categorizeError(error) === ErrorCategory.NOT_FOUND;
}

/**
 * Check if error is a conflict error
 */
export function isConflictError(error: unknown): boolean {
  return categorizeError(error) === ErrorCategory.CONFLICT;
}

/**
 * Check if error is a server error
 */
export function isServerError(error: unknown): boolean {
  return categorizeError(error) === ErrorCategory.SERVER;
}
