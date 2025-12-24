/**
 * Configuración global para tests unitarios
 * Este archivo se ejecuta antes de cada test
 */

import { vi, beforeEach } from 'vitest';

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};

// Mock de sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};

// Configurar localStorage global
global.localStorage = localStorageMock;
global.sessionStorage = sessionStorageMock;

// Mock de window
global.window = {
  localStorage: localStorageMock,
  sessionStorage: sessionStorageMock,
  location: {
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  },
  navigator: {
    onLine: true,
    userAgent: 'test-agent'
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
};

// Limpiar mocks antes de cada test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
  localStorageMock.setItem.mockImplementation(() => {});
  localStorageMock.clear.mockImplementation(() => {});
  sessionStorageMock.getItem.mockReturnValue(null);
  sessionStorageMock.setItem.mockImplementation(() => {});
  sessionStorageMock.clear.mockImplementation(() => {});
});
