/**
 * Fixture de autenticación para tests E2E
 * Proporciona funciones helper para hacer login automáticamente
 */

import { test as base } from '@playwright/test';

/**
 * Helper para hacer login en la aplicación
 * @param {import('@playwright/test').Page} page - Página de Playwright
 * @param {Object} options - Opciones de login
 * @param {string} options.email - Email del usuario
 * @param {string} options.password - Contraseña del usuario
 * @param {string} options.tenantId - ID del tenant (default: 'demo')
 * @returns {Promise<void>}
 */
async function loginUser(page, options = {}) {
  const { email = 'demo@titanfleet.com', password = 'demo123', tenantId = 'demo' } = options;

  console.log(`🔐 Intentando hacer login con: ${email}`);

  // Navegar a la página principal
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('domcontentloaded');

  // Esperar a que Firebase esté listo
  await page.waitForFunction(() => window.firebaseReady === true, { timeout: 15000 }).catch(() => {
    console.log('⚠️ Firebase no está listo, continuando de todos modos');
  });

  // Método 1: Intentar login programáticamente usando window.firebaseSignIn
  try {
    await page.evaluate(
      async ({ email, password, tenantId }) => {
        if (typeof window.firebaseSignIn === 'function') {
          await window.firebaseSignIn(email, password, tenantId);
          return true;
        }
        return false;
      },
      { email, password, tenantId }
    );

    // Esperar a que se complete el login y la redirección
    await page.waitForURL(/\/(menu|pages\/menu)/, { timeout: 15000 }).catch(() => {
      console.log('⚠️ No hubo redirección automática después del login');
    });

    // Verificar que la sesión está guardada en localStorage
    const hasSession = await page.evaluate(() => {
      const session = localStorage.getItem('erpSession');
      const user = localStorage.getItem('erpCurrentUser');
      return !!(session && user);
    });

    if (hasSession) {
      console.log('✅ Login exitoso (método programático)');
      return;
    }
  } catch (error) {
    console.log('⚠️ Login programático falló, intentando con formulario:', error.message);
  }

  // Método 2: Usar el formulario del modal si el método programático falló
  try {
    // Buscar y abrir el modal de login
    const loginButton = page.locator('#btnAccederSistema, button:has-text("Acceder"), a:has-text("Acceder")').first();
    if (await loginButton.count() > 0) {
      await loginButton.waitFor({ state: 'attached', timeout: 10000 });
      const isVisible = await loginButton.isVisible().catch(() => false);
      if (!isVisible) {
        await loginButton.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
      }
      await loginButton.click({ force: !isVisible });

      // Esperar a que el modal aparezca
      const modal = page.locator('#loginModal, [id*="loginModal"], .modal').first();
      await modal.waitFor({ state: 'visible', timeout: 10000 });

      // Llenar el formulario
      const emailInput = page.locator('#modalUsername, input[type="email"]').first();
      const passwordInput = page.locator('#modalPassword, input[type="password"]').first();
      const submitButton = page.locator('#modalLoginForm button[type="submit"], button:has-text("Iniciar"), button:has-text("Entrar")').first();

      await emailInput.waitFor({ state: 'attached', timeout: 10000 });
      await passwordInput.waitFor({ state: 'attached', timeout: 10000 });

      const isEmailVisible = await emailInput.isVisible().catch(() => false);
      const isPasswordVisible = await passwordInput.isVisible().catch(() => false);

      if (!isEmailVisible) {
        await emailInput.scrollIntoViewIfNeeded();
      }
      if (!isPasswordVisible) {
        await passwordInput.scrollIntoViewIfNeeded();
      }

      await emailInput.fill(email, { force: !isEmailVisible });
      await passwordInput.fill(password, { force: !isPasswordVisible });

      // Enviar el formulario
      await submitButton.click({ force: true });

      // Esperar a que se complete el login
      await page.waitForURL(/\/(menu|pages\/menu)/, { timeout: 15000 }).catch(() => {
        // Si no hay redirección, verificar que la sesión se guardó
        const hasSession = page.evaluate(() => {
          const session = localStorage.getItem('erpSession');
          return !!session;
        });
        if (!hasSession) {
          throw new Error('Login falló: No se guardó la sesión');
        }
      });

      console.log('✅ Login exitoso (método formulario)');
    } else {
      throw new Error('No se encontró el botón de login');
    }
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    throw error;
  }
}

/**
 * Helper para verificar si el usuario está autenticado
 * @param {import('@playwright/test').Page} page - Página de Playwright
 * @returns {Promise<boolean>}
 */
async function isAuthenticated(page) {
  return await page.evaluate(() => {
    const session = localStorage.getItem('erpSession');
    const user = localStorage.getItem('erpCurrentUser');
    if (session && user) {
      try {
        const sessionData = JSON.parse(session);
        const expiresAt = Date.parse(sessionData.expiresAt || '');
        return isFinite(expiresAt) && Date.now() < expiresAt;
      } catch {
        return true; // Si no se puede parsear, asumir válido
      }
    }
    return false;
  });
}

/**
 * Helper para hacer logout
 * @param {import('@playwright/test').Page} page - Página de Playwright
 * @returns {Promise<void>}
 */
async function logoutUser(page) {
  await page.evaluate(() => {
    localStorage.removeItem('erpSession');
    localStorage.removeItem('erpCurrentUser');
    localStorage.removeItem('erp_saved_credentials');
    localStorage.removeItem('erp_remember_me');
    sessionStorage.clear();
  });
  console.log('✅ Logout completado');
}

// Extender el test base con fixtures de autenticación
export const test = base.extend({
  // Página autenticada - automáticamente hace login antes de cada test
  authenticatedPage: async ({ page }, use) => {
    await loginUser(page, {
      email: process.env.TEST_USER_EMAIL || 'demo@titanfleet.com',
      password: process.env.TEST_USER_PASSWORD || 'demo123',
      tenantId: process.env.TEST_TENANT_ID || 'demo'
    });

    // Verificar que el login fue exitoso
    const authenticated = await isAuthenticated(page);
    if (!authenticated) {
      throw new Error('No se pudo autenticar el usuario');
    }

    await use(page);

    // Limpiar después del test
    await logoutUser(page);
  }
});

// Exportar helpers para uso manual
export { loginUser, isAuthenticated, logoutUser };


