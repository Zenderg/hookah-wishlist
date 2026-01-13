import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'

// Mock Telegram Web Apps API
const mockWebApp = {
  initData: 'user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%2C%22username%22%3A%22testuser%22%7D&auth_date=1234567890&hash=abc123',
  initDataUnsafe: {
    user: {
      id: 123456789,
      first_name: 'Test',
      username: 'testuser',
    },
    auth_date: 1234567890,
    hash: 'abc123',
  },
  version: '6.0',
  platform: 'ios',
  colorScheme: 'light',
  themeParams: {
    bg_color: '#ffffff',
    text_color: '#000000',
    hint_color: '#999999',
    link_color: '#2481cc',
    button_color: '#2481cc',
    button_text_color: '#ffffff',
    secondary_bg_color: '#f1f1f1',
  },
  isExpanded: false,
  viewportHeight: 0,
  viewportStableHeight: 0,
  headerColor: '#bg_color',
  backgroundColor: '#bg_color',
  BackButton: {
    isVisible: false,
    onClick: vi.fn(),
    hide: vi.fn(),
    show: vi.fn(),
  },
  MainButton: {
    text: '',
    color: '#2481cc',
    textColor: '#ffffff',
    isVisible: false,
    isActive: false,
    isProgressVisible: false,
    setParams: vi.fn(),
    hide: vi.fn(),
    show: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    showProgress: vi.fn(),
    hideProgress: vi.fn(),
  },
  HapticFeedback: {
    impactOccurred: vi.fn(),
    notificationOccurred: vi.fn(),
    selectionChanged: vi.fn(),
  },
  Analytics: {
    getEventParameter: vi.fn(),
    logEvent: vi.fn(),
    setClientID: vi.fn(),
  },
  Browser: {
    close: vi.fn(),
    openTelegramLink: vi.fn(),
    openLink: vi.fn(),
    openPopup: vi.fn(),
    openInvoice: vi.fn(),
    switchInlineQuery: vi.fn(),
  },
  CloudStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    getItems: vi.fn(),
    removeItem: vi.fn(),
    removeItems: vi.fn(),
    getKeys: vi.fn(),
  },
  Popup: {
    open: vi.fn(),
    close: vi.fn(),
  },
  QRScanner: {
    open: vi.fn(),
    close: vi.fn(),
  },
  SettingsButton: {
    isVisible: false,
    onClick: vi.fn(),
    hide: vi.fn(),
    show: vi.fn(),
  },
  Invoice: {
    open: vi.fn(),
    close: vi.fn(),
  },
  Accelerometer: {
    start: vi.fn(),
    stop: vi.fn(),
    request: vi.fn(),
  },
  DeviceOrientation: {
    start: vi.fn(),
    stop: vi.fn(),
  },
  Gyroscope: {
    start: vi.fn(),
    stop: vi.fn(),
  },
  LocationManager: {
    getLocation: vi.fn(),
    openSettings: vi.fn(),
  },
  ready: vi.fn(),
  expand: vi.fn(),
  close: vi.fn(),
  enableClosingConfirmation: vi.fn(),
  disableClosingConfirmation: vi.fn(),
}

// Define global Telegram.WebApp object
declare global {
  interface Window {
    Telegram: {
      WebApp: typeof mockWebApp
    }
  }
}

// Set global Telegram.WebApp
window.Telegram = { WebApp: mockWebApp }

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
})
