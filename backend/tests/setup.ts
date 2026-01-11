// Jest setup file for backend tests
// This file runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.STORAGE_TYPE = 'file';
process.env.STORAGE_PATH = './tests/data/test-storage.json';

// Mock environment variables for testing
process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
process.env.HOOKEH_DB_API_URL = 'http://localhost:8080';
process.env.HOOKEH_DB_API_KEY = 'test-api-key';
