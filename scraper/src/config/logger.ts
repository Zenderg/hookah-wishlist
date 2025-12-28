import winston from 'winston';

/**
 * Get log level from environment variable, default to 'info'
 */
const logLevel = process.env.LOG_LEVEL || 'info';

/**
 * Winston logger configuration
 * Supports error, warn, info, debug levels
 * Formats logs with timestamps and colorization
 */
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      if (stack) {
        return `${timestamp} [${level}]: ${message}\n${stack}`;
      }
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
});

export default logger;
