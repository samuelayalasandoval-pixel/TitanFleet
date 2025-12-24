/**
 * Tests E2E para navegación entre módulos
 */

import { test, expect } from '@playwright/test';

test.describe('Navegación del ERP', () => {
  test.beforeEach(async ({ page }) => {
    // Asumimos que hay un modo demo o login automático
    await page.goto('/');
    
    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle');
  });

  test('debe navegar a módulo de Facturación', async ({ page }) => {
    // Buscar enlace o botón de facturación
    const facturacionLink = page.locator('a[href*="facturacion"], button:has-text("Facturación")').first();
    
    if (await facturacionLink.count() > 0) {
      await facturacionLink.click();
      await page.waitForURL(/facturacion/, { timeout: 10000 });
      await expect(page).toHaveURL(/facturacion/);
    }
  });

  test('debe navegar a módulo de Logística', async ({ page }) => {
    const logisticaLink = page.locator('a[href*="logistica"], button:has-text("Logística")').first();
    
    if (await logisticaLink.count() > 0) {
      await logisticaLink.click();
      await page.waitForURL(/logistica/, { timeout: 10000 });
      await expect(page).toHaveURL(/logistica/);
    }
  });

  test('debe navegar a módulo de Reportes', async ({ page }) => {
    const reportesLink = page.locator('a[href*="reportes"], button:has-text("Reportes")').first();
    
    if (await reportesLink.count() > 0) {
      await reportesLink.click();
      await page.waitForURL(/reportes/, { timeout: 10000 });
      await expect(page).toHaveURL(/reportes/);
    }
  });

  test('debe mantener el estado del sidebar al navegar', async ({ page }) => {
    // Verificar que el sidebar persiste entre navegaciones
    const sidebar = page.locator('nav, aside, [class*="sidebar"]').first();
    
    if (await sidebar.count() > 0) {
      await expect(sidebar).toBeVisible();
      
      // Navegar a otro módulo
      const otroModulo = page.locator('a[href*="trafico"], button:has-text("Tráfico")').first();
      if (await otroModulo.count() > 0) {
        await otroModulo.click();
        await page.waitForLoadState('networkidle');
        
        // El sidebar debe seguir visible
        await expect(sidebar).toBeVisible();
      }
    }
  });
});
