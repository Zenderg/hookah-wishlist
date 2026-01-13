/**
 * Mock Telegram Web Apps API for Testing
 * 
 * This file provides a comprehensive mock for Telegram Web Apps API used in mini-app.
 * Following javascript-testing-patterns skill best practices for mocking external dependencies.
 */

import { vi, expect } from 'vitest';
import type { WebApp } from '@twa-dev/types';

/**
 * Mock Telegram User
 */
export interface MockTelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

/**
 * Default mock Telegram user
 */
export const defaultMockTelegramUser: MockTelegramUser = {
  id: 123456789,
  first_name: 'Test',
  last_name: 'User',
  username: 'testuser',
  language_code: 'en',
  is_premium: false,
};

/**
 * Create a mock Telegram user
 */
export function createMockTelegramUser(overrides?: Partial<MockTelegramUser>): MockTelegramUser {
  return {
    id: Math.floor(Math.random() * 1000000000),
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser',
    language_code: 'en',
    is_premium: false,
    ...overrides,
  };
}

/**
 * Mock Telegram Init Data
 */
export interface MockInitData {
  user?: MockTelegramUser;
  query_id?: string;
  auth_date?: number;
  hash?: string;
}

/**
 * Default mock init data
 */
export const defaultMockInitData: MockInitData = {
  user: defaultMockTelegramUser,
  query_id: 'query123',
  auth_date: Math.floor(Date.now() / 1000),
  hash: 'mock_hash_for_testing',
};

/**
 * Create mock init data
 */
export function createMockInitData(overrides?: Partial<MockInitData>): MockInitData {
  return {
    user: createMockTelegramUser(),
    query_id: 'query123',
    auth_date: Math.floor(Date.now() / 1000),
    hash: 'mock_hash_for_testing',
    ...overrides,
  };
}

/**
 * Convert init data to URL-encoded string
 */
export function initDataToString(initData: MockInitData): string {
  const params = new URLSearchParams();
  
  if (initData.user) {
    params.append('user', JSON.stringify(initData.user));
  }
  if (initData.query_id) {
    params.append('query_id', initData.query_id);
  }
  if (initData.auth_date) {
    params.append('auth_date', initData.auth_date.toString());
  }
  if (initData.hash) {
    params.append('hash', initData.hash);
  }
  
  return params.toString();
}

/**
 * Mock Theme Params
 */
export interface MockThemeParams {
  bg_color: string;
  text_color: string;
  hint_color: string;
  link_color: string;
  button_color: string;
  button_text_color: string;
  secondary_bg_color: string;
}

/**
 * Default mock theme params
 */
export const defaultMockThemeParams: MockThemeParams = {
  bg_color: '#ffffff',
  text_color: '#000000',
  hint_color: '#999999',
  link_color: '#2481cc',
  button_color: '#2481cc',
  button_text_color: '#ffffff',
  secondary_bg_color: '#f0f0f0',
};

/**
 * Mock Back Button
 */
export interface MockBackButton {
  isVisible: boolean;
  onClick: (() => void) | null;
}

/**
 * Default mock back button
 */
export const defaultMockBackButton: MockBackButton = {
  isVisible: false,
  onClick: null,
};

/**
 * Mock Main Button
 */
export interface MockMainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  onClick: (() => void) | null;
}

/**
 * Default mock main button
 */
export const defaultMockMainButton: MockMainButton = {
  text: 'Continue',
  color: '#2481cc',
  textColor: '#ffffff',
  isVisible: false,
  isActive: true,
  isProgressVisible: false,
  onClick: null,
};

/**
 * Mock Haptic Feedback
 */
export interface MockHapticFeedback {
  impactOccurred: ReturnType<typeof vi.fn>;
  notificationOccurred: ReturnType<typeof vi.fn>;
  selectionChanged: ReturnType<typeof vi.fn>;
}

/**
 * Create mock haptic feedback
 */
export function createMockHapticFeedback(): MockHapticFeedback {
  return {
    impactOccurred: vi.fn(),
    notificationOccurred: vi.fn(),
    selectionChanged: vi.fn(),
  };
}

/**
 * Default mock haptic feedback
 */
export const defaultMockHapticFeedback = createMockHapticFeedback();

/**
 * Mock Telegram Web Apps API
 */
export interface MockWebApp {
  initData: string;
  initDataUnsafe: MockInitData;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: MockThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  backButton: MockBackButton;
  mainButton: MockMainButton;
  hapticFeedback: MockHapticFeedback;
  ready: ReturnType<typeof vi.fn>;
  expand: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  enableClosingConfirmation: ReturnType<typeof vi.fn>;
  disableClosingConfirmation: ReturnType<typeof vi.fn>;
  sendData: ReturnType<typeof vi.fn>;
  switchInlineQuery: ReturnType<typeof vi.fn>;
  openLink: ReturnType<typeof vi.fn>;
  openTelegramLink: ReturnType<typeof vi.fn>;
  openPopup: ReturnType<typeof vi.fn>;
  showPopup: ReturnType<typeof vi.fn>;
  showAlert: ReturnType<typeof vi.fn>;
  showConfirm: ReturnType<typeof vi.fn>;
  requestWriteAccess: ReturnType<typeof vi.fn>;
  requestContact: ReturnType<typeof vi.fn>;
  requestFileUpload: ReturnType<typeof vi.fn>;
  downloadFile: ReturnType<typeof vi.fn>;
  readTextFromClipboard: ReturnType<typeof vi.fn>;
  requestClipboardText: ReturnType<typeof vi.fn>;
  prepareClosingConfirmation: ReturnType<typeof vi.fn>;
}

/**
 * Create mock Telegram Web Apps API
 */
export function createMockWebApp(overrides?: Partial<MockWebApp>): MockWebApp {
  const initData = createMockInitData(overrides?.initDataUnsafe);
  
  return {
    initData: initDataToString(initData),
    initDataUnsafe: initData,
    version: '6.9',
    platform: 'ios',
    colorScheme: 'light',
    themeParams: defaultMockThemeParams,
    isExpanded: false,
    viewportHeight: 667,
    viewportStableHeight: 667,
    headerColor: '#ffffff',
    backgroundColor: '#ffffff',
    isClosingConfirmationEnabled: false,
    backButton: defaultMockBackButton,
    mainButton: defaultMockMainButton,
    hapticFeedback: defaultMockHapticFeedback,
    ready: vi.fn(),
    expand: vi.fn(),
    close: vi.fn(),
    enableClosingConfirmation: vi.fn(),
    disableClosingConfirmation: vi.fn(),
    sendData: vi.fn(),
    switchInlineQuery: vi.fn(),
    openLink: vi.fn(),
    openTelegramLink: vi.fn(),
    openPopup: vi.fn(),
    showPopup: vi.fn(),
    showAlert: vi.fn(),
    showConfirm: vi.fn(),
    requestWriteAccess: vi.fn(),
    requestContact: vi.fn(),
    requestFileUpload: vi.fn(),
    downloadFile: vi.fn(),
    readTextFromClipboard: vi.fn(),
    requestClipboardText: vi.fn(),
    prepareClosingConfirmation: vi.fn(),
    ...overrides,
  };
}

/**
 * Default mock WebApp
 */
export const mockWebApp = createMockWebApp();

/**
 * Mock WebApp with premium user
 */
export const mockWebAppPremium = createMockWebApp({
  initDataUnsafe: {
    user: {
      ...defaultMockTelegramUser,
      id: 987654321,
      first_name: 'Premium',
      last_name: 'User',
      username: 'premiumuser',
      is_premium: true,
    },
  },
});

/**
 * Mock WebApp in dark mode
 */
export const mockWebAppDark = createMockWebApp({
  colorScheme: 'dark',
  themeParams: {
    bg_color: '#1c1c1e',
    text_color: '#ffffff',
    hint_color: '#aaaaaa',
    link_color: '#64b5ef6',
    button_color: '#64b5ef6',
    button_text_color: '#ffffff',
    secondary_bg_color: '#2c2c2e',
  },
});

/**
 * Mock WebApp expanded
 */
export const mockWebAppExpanded = createMockWebApp({
  isExpanded: true,
  viewportHeight: 896,
  viewportStableHeight: 896,
});

/**
 * Reset mock WebApp to default state
 */
export function resetMockWebApp(): void {
  mockWebApp.initData = initDataToString(defaultMockInitData);
  mockWebApp.initDataUnsafe = defaultMockInitData;
  mockWebApp.version = '6.9';
  mockWebApp.platform = 'ios';
  mockWebApp.colorScheme = 'light';
  mockWebApp.themeParams = defaultMockThemeParams;
  mockWebApp.isExpanded = false;
  mockWebApp.viewportHeight = 667;
  mockWebApp.viewportStableHeight = 667;
  mockWebApp.headerColor = '#ffffff';
  mockWebApp.backgroundColor = '#ffffff';
  mockWebApp.isClosingConfirmationEnabled = false;
  mockWebApp.backButton = defaultMockBackButton;
  mockWebApp.mainButton = defaultMockMainButton;
  mockWebApp.hapticFeedback = defaultMockHapticFeedback;
}

/**
 * Clear all mock WebApp function calls
 */
export function clearMockWebApp(): void {
  mockWebApp.ready.mockClear();
  mockWebApp.expand.mockClear();
  mockWebApp.close.mockClear();
  mockWebApp.enableClosingConfirmation.mockClear();
  mockWebApp.disableClosingConfirmation.mockClear();
  mockWebApp.sendData.mockClear();
  mockWebApp.switchInlineQuery.mockClear();
  mockWebApp.openLink.mockClear();
  mockWebApp.openTelegramLink.mockClear();
  mockWebApp.openPopup.mockClear();
  mockWebApp.showPopup.mockClear();
  mockWebApp.showAlert.mockClear();
  mockWebApp.showConfirm.mockClear();
  mockWebApp.requestWriteAccess.mockClear();
  mockWebApp.requestContact.mockClear();
  mockWebApp.requestFileUpload.mockClear();
  mockWebApp.downloadFile.mockClear();
  mockWebApp.readTextFromClipboard.mockClear();
  mockWebApp.requestClipboardText.mockClear();
  mockWebApp.prepareClosingConfirmation.mockClear();
}

/**
 * Reset all mock WebApp function calls
 */
export function resetMockWebAppFunctions(): void {
  mockWebApp.ready.mockReset();
  mockWebApp.expand.mockReset();
  mockWebApp.close.mockReset();
  mockWebApp.enableClosingConfirmation.mockReset();
  mockWebApp.disableClosingConfirmation.mockReset();
  mockWebApp.sendData.mockReset();
  mockWebApp.switchInlineQuery.mockReset();
  mockWebApp.openLink.mockReset();
  mockWebApp.openTelegramLink.mockReset();
  mockWebApp.openPopup.mockReset();
  mockWebApp.showPopup.mockReset();
  mockWebApp.showAlert.mockReset();
  mockWebApp.showConfirm.mockReset();
  mockWebApp.requestWriteAccess.mockReset();
  mockWebApp.requestContact.mockReset();
  mockWebApp.requestFileUpload.mockReset();
  mockWebApp.downloadFile.mockReset();
  mockWebApp.readTextFromClipboard.mockReset();
  mockWebApp.requestClipboardText.mockReset();
  mockWebApp.prepareClosingConfirmation.mockReset();
}

/**
 * Helper function to verify ready was called
 */
export function expectReadyCalled(times: number = 1): void {
  expect(mockWebApp.ready).toHaveBeenCalledTimes(times);
}

/**
 * Helper function to verify expand was called
 */
export function expectExpandCalled(times: number = 1): void {
  expect(mockWebApp.expand).toHaveBeenCalledTimes(times);
}

/**
 * Helper function to verify close was called
 */
export function expectCloseCalled(times: number = 1): void {
  expect(mockWebApp.close).toHaveBeenCalledTimes(times);
}

/**
 * Helper function to verify openLink was called
 */
export function expectOpenLinkCalled(url: string, times: number = 1): void {
  expect(mockWebApp.openLink).toHaveBeenCalledTimes(times);
  if (times > 0) {
    expect(mockWebApp.openLink).toHaveBeenCalledWith(url);
  }
}

/**
 * Helper function to verify showAlert was called
 */
export function expectShowAlertCalled(message: string, times: number = 1): void {
  expect(mockWebApp.showAlert).toHaveBeenCalledTimes(times);
  if (times > 0) {
    expect(mockWebApp.showAlert).toHaveBeenCalledWith(message);
  }
}

/**
 * Helper function to verify showConfirm was called
 */
export function expectShowConfirmCalled(message: string, times: number = 1): void {
  expect(mockWebApp.showConfirm).toHaveBeenCalledTimes(times);
  if (times > 0) {
    expect(mockWebApp.showConfirm).toHaveBeenCalledWith(message);
  }
}

/**
 * Helper function to verify haptic feedback was called
 */
export function expectHapticImpactOccurred(times: number = 1): void {
  expect(mockWebApp.hapticFeedback.impactOccurred).toHaveBeenCalledTimes(times);
}

/**
 * Helper function to verify haptic notification occurred
 */
export function expectHapticNotificationOccurred(type: string, times: number = 1): void {
  expect(mockWebApp.hapticFeedback.notificationOccurred).toHaveBeenCalledTimes(times);
  if (times > 0) {
    expect(mockWebApp.hapticFeedback.notificationOccurred).toHaveBeenCalledWith(type);
  }
}

/**
 * Helper function to verify haptic selection changed
 */
export function expectHapticSelectionChanged(times: number = 1): void {
  expect(mockWebApp.hapticFeedback.selectionChanged).toHaveBeenCalledTimes(times);
}

/**
 * Helper function to verify no WebApp methods were called
 */
export function expectNoWebAppMethodsCalled(): void {
  expect(mockWebApp.ready).not.toHaveBeenCalled();
  expect(mockWebApp.expand).not.toHaveBeenCalled();
  expect(mockWebApp.close).not.toHaveBeenCalled();
  expect(mockWebApp.openLink).not.toHaveBeenCalled();
  expect(mockWebApp.showAlert).not.toHaveBeenCalled();
  expect(mockWebApp.showConfirm).not.toHaveBeenCalled();
}

/**
 * Helper function to verify initData contains user
 */
export function expectInitDataHasUser(): void {
  expect(mockWebApp.initDataUnsafe.user).toBeDefined();
  expect(mockWebApp.initDataUnsafe.user).not.toBeNull();
}

/**
 * Helper function to verify initData is valid
 */
export function expectInitDataValid(): void {
  expect(mockWebApp.initData).toBeDefined();
  expect(mockWebApp.initData).not.toBe('');
  expect(mockWebApp.initDataUnsafe.user).toBeDefined();
  expect(mockWebApp.initDataUnsafe.auth_date).toBeDefined();
  expect(mockWebApp.initDataUnsafe.hash).toBeDefined();
}

/**
 * Helper function to get mock WebApp user
 */
export function getMockWebAppUser(): MockTelegramUser | undefined {
  return mockWebApp.initDataUnsafe.user;
}

/**
 * Helper function to set mock WebApp user
 */
export function setMockWebAppUser(user: MockTelegramUser): void {
  mockWebApp.initDataUnsafe.user = user;
  mockWebApp.initData = initDataToString(mockWebApp.initDataUnsafe);
}

/**
 * Helper function to mock WebApp ready success
 */
export function mockWebAppReadySuccess(): void {
  mockWebApp.ready.mockImplementation(() => {
    // Default implementation
  });
}

/**
 * Helper function to mock WebApp expand success
 */
export function mockWebAppExpandSuccess(): void {
  mockWebApp.expand.mockImplementation(() => {
    mockWebApp.isExpanded = true;
  });
}

/**
 * Helper function to mock WebApp close success
 */
export function mockWebAppCloseSuccess(): void {
  mockWebApp.close.mockImplementation(() => {
    // Default implementation
  });
}

/**
 * Helper function to mock WebApp openLink success
 */
export function mockWebAppOpenLinkSuccess(): void {
  mockWebApp.openLink.mockImplementation((url: string) => {
    // Default implementation
  });
}

/**
 * Helper function to mock WebApp showAlert success
 */
export function mockWebAppShowAlertSuccess(): void {
  mockWebApp.showAlert.mockImplementation((message: string) => {
    // Default implementation
  });
}

/**
 * Helper function to mock WebApp showConfirm success
 */
export function mockWebAppShowConfirmSuccess(): void {
  mockWebApp.showConfirm.mockImplementation((message: string) => {
    // Default implementation
  });
}

/**
 * Helper function to verify WebApp is in light mode
 */
export function expectWebAppLightMode(): void {
  expect(mockWebApp.colorScheme).toBe('light');
}

/**
 * Helper function to verify WebApp is in dark mode
 */
export function expectWebAppDarkMode(): void {
  expect(mockWebApp.colorScheme).toBe('dark');
}

/**
 * Helper function to verify WebApp is expanded
 */
export function expectWebAppExpanded(): void {
  expect(mockWebApp.isExpanded).toBe(true);
}

/**
 * Helper function to verify WebApp is not expanded
 */
export function expectWebAppNotExpanded(): void {
  expect(mockWebApp.isExpanded).toBe(false);
}

/**
 * Helper function to get WebApp init data string
 */
export function getMockInitDataString(): string {
  return mockWebApp.initData;
}

/**
 * Helper function to set WebApp init data
 */
export function setMockInitData(initData: MockInitData): void {
  mockWebApp.initDataUnsafe = initData;
  mockWebApp.initData = initDataToString(initData);
}

/**
 * Helper function to create init data with custom user
 */
export function createInitDataWithUser(user: MockTelegramUser): string {
  const initData = createMockInitData({ user });
  return initDataToString(initData);
}

/**
 * Helper function to create init data with timestamp
 */
export function createInitDataWithTimestamp(timestamp: number): string {
  const initData = createMockInitData({ auth_date: timestamp });
  return initDataToString(initData);
}

export default mockWebApp;
