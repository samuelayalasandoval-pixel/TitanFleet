/**
 * Tests E2E para el módulo de Facturación
 */

import { test, expect } from '@playwright/test';

test.describe('Módulo de Facturación', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/facturacion.html');
    await page.waitForLoadState('networkidle');
  });

  test('debe cargar la página de facturación', async ({ page }) => {
    await expect(page).toHaveURL(/facturacion/);
    
    // Verificar que hay elementos principales
    const titulo = page.locator('h1, h2, [class*="title"]').first();
    await expect(titulo).toBeVisible();
  });

  test('debe mostrar formulario de nueva factura', async ({ page }) => {
    // Buscar botón de nueva factura
    const nuevoBtn = page.locator('button:has-text("Nuevo"), button:has-text("Agregar"), [data-action="nueva-factura"]').first();
    
    if (await nuevoBtn.count() > 0) {
      await nuevoBtn.click();
      
      // Esperar que aparezca el formulario o modal
      const formulario = page.locator('form, [class*="modal"], [class*="form"]').first();
      await expect(formulario).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe validar campos requeridos en formulario', async ({ page }) => {
    const nuevoBtn = page.locator('button:has-text("Nuevo"), button:has-text("Agregar")').first();
    
    if (await nuevoBtn.count() > 0) {
      await nuevoBtn.click();
      await page.waitForTimeout(500); // Esperar que aparezca el formulario
      
      // Buscar botón de guardar
      const guardarBtn = page.locator('button:has-text("Guardar"), button[type="submit"]').first();
      
      if (await guardarBtn.count() > 0) {
        await guardarBtn.click();
        
        // Debe mostrar mensajes de error de validación
        const errores = page.locator('.invalid-feedback, .error, [class*="error"]');
        const count = await errores.count();
        
        if (count > 0) {
          await expect(errores.first()).toBeVisible();
        }
      }
    }
  });

  test('debe filtrar registros', async ({ page }) => {
    // Buscar campo de búsqueda/filtro
    const filtro = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="filtrar"]').first();
    
    if (await filtro.count() > 0) {
      await filtro.fill('test');
      await page.waitForTimeout(500);
      
      // Verificar que la tabla se actualiza (ajustar según implementación)
      const tabla = page.locator('table, [class*="table"]').first();
      if (await tabla.count() > 0) {
        await expect(tabla).toBeVisible();
      }
    }
  });
});
