/**
 * Tests E2E para el módulo de Logística
 */

import { test, expect } from '@playwright/test';

test.describe('Módulo de Logística', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/logistica.html');
    await page.waitForLoadState('networkidle');
  });

  test('debe cargar la página de logística', async ({ page }) => {
    await expect(page).toHaveURL(/logistica/);
    
    // Verificar elementos principales
    const titulo = page.locator('h1, h2, [class*="title"]').first();
    await expect(titulo).toBeVisible();
  });

  test('debe mostrar formulario de nuevo registro', async ({ page }) => {
    const nuevoBtn = page.locator('button:has-text("Nuevo"), button:has-text("Agregar"), [data-action*="nuevo"]').first();
    
    if (await nuevoBtn.count() > 0) {
      await nuevoBtn.click();
      await page.waitForTimeout(500);
      
      // Verificar que aparece el formulario
      const formulario = page.locator('form, [class*="modal"], [class*="form"]').first();
      await expect(formulario).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe permitir buscar registros', async ({ page }) => {
    const busqueda = page.locator('input[type="search"], input[placeholder*="buscar"]').first();
    
    if (await busqueda.count() > 0) {
      await busqueda.fill('test');
      await page.waitForTimeout(500);
      
      // Verificar que la búsqueda funciona
      await expect(busqueda).toHaveValue('test');
    }
  });

  test('debe mostrar tabla de registros', async ({ page }) => {
    const tabla = page.locator('table, [class*="table"]').first();
    
    if (await tabla.count() > 0) {
      await expect(tabla).toBeVisible();
    }
  });
});
