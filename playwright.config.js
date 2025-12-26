import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para tests E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Tiempo máximo para un test - aumentado para SPAs que cargan dinámicamente */
  timeout: 60 * 1000,
  
  /* Esperar hasta 10 segundos entre intentos */
  expect: {
    timeout: 10000
  },
  
  /* Ejecutar tests en paralelo */
  fullyParallel: true,
  
  /* Fallar el build en CI si dejas test.only */
  forbidOnly: !!process.env.CI,
  
  /* Reintentar en CI */
  retries: process.env.CI ? 2 : 0,
  
  /* Workers en CI vs local */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter a usar */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  /* Configuración compartida para todos los proyectos */
  use: {
    /* URL base para usar en navegación */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    /* Recopilar trace cuando se reintenta el test fallido */
    trace: 'on-first-retry',
    
    /* Screenshots solo en fallos */
    screenshot: 'only-on-failure',
    
    /* Video solo en fallos */
    video: 'retain-on-failure',
    
    /* Esperar navegación hasta que el DOM esté listo (más adecuado para SPAs) */
    waitForTimeout: 1000,
    
    /* Timeout para acciones (click, fill, etc.) */
    actionTimeout: 15000
  },

  /* Configurar proyectos para múltiples navegadores */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* Servidor de desarrollo local */
  webServer: {
    command: 'npm run serve',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
