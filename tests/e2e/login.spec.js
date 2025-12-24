/**
 * Tests E2E para el flujo de login
 */

import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de inicio antes de cada test
    await page.goto('/');
  });

  test('debe mostrar la página de login', async ({ page }) => {
    // Verificar que la página carga correctamente
    await expect(page).toHaveTitle(/TitanFleet|ERP/i);
    
    // Verificar que hay elementos de login (ajustar según tu implementación)
    const loginForm = page.locator('form, [data-testid="login-form"]').first();
    await expect(loginForm).toBeVisible();
  });

  test('debe mostrar error con credenciales inválidas', async ({ page }) => {
    // Buscar campos de login (ajustar selectores según tu HTML)
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Iniciar")').first();

    if (await emailInput.count() > 0) {
      await emailInput.fill('test@invalid.com');
      await passwordInput.fill('wrongpassword');
      await submitButton.click();

      // Esperar mensaje de error (ajustar selector)
      const errorMessage = page.locator('.alert-danger, .error-message, [role="alert"]').first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe redirigir después de login exitoso', async ({ page }) => {
    // Este test requiere credenciales válidas o modo demo
    // Ajustar según tu implementación
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if (await emailInput.count() > 0) {
      // Usar credenciales de demo si están disponibles
      await emailInput.fill('demo@titanfleet.com');
      await passwordInput.fill('demo123');
      await submitButton.click();

      // Verificar redirección (ajustar URL esperada)
      await page.waitForURL(/\/(menu|dashboard|home)/, { timeout: 10000 });
    }
  });
});
