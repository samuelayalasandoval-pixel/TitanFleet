/**
 * Helper de autenticación para tests E2E
 * Funciones auxiliares para manejar autenticación en tests
 */

/**
 * Hacer login en la aplicación
 * @param {import('@playwright/test').Page} page - Página de Playwright
 * @param {Object} options - Opciones de login
 * @param {string} [options.email='demo@titanfleet.com'] - Email del usuario
 * @param {string} [options.password='demo123'] - Contraseña del usuario
 * @param {string} [options.tenantId='demo'] - ID del tenant
 * @param {boolean} [options.useRealLogin=false] - Si es true, intenta hacer login real en lugar de usar sesión mock
 * @returns {Promise<void>}
 */
export async function login(page, options = {}) {
  const { email = 'demo@titanfleet.com', password = 'demo123', tenantId = 'demo', useRealLogin = false } = options;

  console.log(`🔐 Haciendo login con: ${email}`);

  // Navegar a la página principal y esperar a que esté estable
  try {
    const currentUrl = page.url();
    if (!currentUrl.includes('localhost:3000') || currentUrl === 'about:blank') {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500); // Pequeña espera para estabilizar
    }
  } catch (error) {
    // Si hay error en navegación, intentar de nuevo
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
    } catch {
      // Continuar de todos modos
    }
  }

  // Verificar si ya estamos autenticados (con manejo de errores)
  try {
    const alreadyAuthenticated = await isAuthenticated(page);
    if (alreadyAuthenticated) {
      console.log('✅ Ya está autenticado');
      return;
    }
  } catch (error) {
    // Si hay error (p. ej., navegación), continuar con el login
    console.log('⚠️ No se pudo verificar autenticación previa, continuando con login');
  }

  // Si se solicita login real, intentar hacer login real primero
  if (useRealLogin) {
    // Intentar login programático primero
    try {
      await page.waitForFunction(() => window.firebaseReady === true, { timeout: 5000 }).catch(() => {});
      
      const loginSuccess = await page.evaluate(
        async ({ email, password, tenantId }) => {
          try {
            if (typeof window.firebaseSignIn === 'function') {
              await window.firebaseSignIn(email, password, tenantId);
              await new Promise(resolve => setTimeout(resolve, 2000));
              return true;
            }
            return false;
          } catch (error) {
            console.error('Error en login programático:', error);
            return false;
          }
        },
        { email, password, tenantId }
      ).catch(() => false);

      if (loginSuccess) {
        try {
          await page.waitForFunction(
            () => {
              const session = localStorage.getItem('erpSession');
              const user = localStorage.getItem('erpCurrentUser');
              return !!(session && user);
            },
            { timeout: 5000 }
          );
          const authenticated = await isAuthenticated(page);
          if (authenticated) {
            console.log('✅ Login exitoso (método programático)');
            return;
          }
        } catch (e) {
          console.log('⚠️ Login programático no completó correctamente, intentando formulario');
        }
      }
    } catch (error) {
      console.log('⚠️ Login programático falló, intentando con formulario:', error.message);
    }

    // Si el login programático falla, intentar con formulario
    try {
      // Abrir modal de login usando JavaScript
      await page.evaluate(() => {
        const modalEl = document.getElementById('loginModal');
        if (modalEl) {
          if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
          } else {
            modalEl.classList.add('show');
            modalEl.style.display = 'block';
            modalEl.setAttribute('aria-hidden', 'false');
          }
        }
      });

      await page.waitForTimeout(500);

      // Llenar formulario
      const emailInput = page.locator('#modalUsername').first();
      const passwordInput = page.locator('#modalPassword').first();
      const submitButton = page.locator('#modalLoginForm button[type="submit"]').first();

      await emailInput.waitFor({ state: 'attached', timeout: 5000 });
      await passwordInput.waitFor({ state: 'attached', timeout: 5000 });

      await emailInput.fill(email, { force: true });
      await passwordInput.fill(password, { force: true });
      await submitButton.click({ force: true });

      await page.waitForTimeout(2000);

      const hasSession = await page.evaluate(() => {
        return !!(localStorage.getItem('erpSession') && localStorage.getItem('erpCurrentUser'));
      }).catch(() => false);

      if (hasSession) {
        console.log('✅ Login exitoso (método formulario)');
        return;
      }
    } catch (error) {
      console.error('❌ Error en login con formulario:', error.message);
      throw new Error(`No se pudo completar el login real: ${error.message}`);
    }

    // Si todo falla, lanzar error
    throw new Error('No se pudo completar el login real con ningún método');
  }

  // Por defecto, usar sesión mock (más confiable para tests E2E)
  try {
    console.log('⚠️ Usando sesión mock (método recomendado para tests E2E)');
    
    // Asegurar que la página esté estable antes de establecer la sesión
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 2000 });
    } catch {
      // Continuar si hay timeout - la página puede no estar lista aún
    }
    
    await setMockSession(page, {
      email,
      nombre: email.split('@')[0],
      tenantId
    });

    // Verificar que la sesión se estableció (sin timeout adicional)
    const authenticated = await isAuthenticated(page);
    if (authenticated) {
      console.log('✅ Sesión mock establecida exitosamente');
      return;
    }
  } catch (error) {
    // Si la página se cerró o fue destruida, intentar establecer la sesión usando addInitScript
    // Esto asegura que la sesión esté disponible cuando se cargue la próxima página
    if (error.message.includes('closed') || error.message.includes('destroyed') || error.message.includes('navigation')) {
      console.log('⚠️ Página se cerró durante el login, estableciendo sesión con addInitScript');
      try {
        // Establecer la sesión para las próximas páginas usando addInitScript
        await page.addInitScript(
          ({ userData, sessionData }) => {
            localStorage.setItem('erpCurrentUser', JSON.stringify(userData));
            localStorage.setItem('erpSession', JSON.stringify(sessionData));
          },
          {
            userData: {
              email,
              nombre: email.split('@')[0],
              tenantId,
              permisos: {
                ver: ['Dashboard', 'Logística', 'Facturación', 'Tráfico', 'Diesel', 'Mantenimiento', 'Tesoreria', 'Cuentas x Cobrar', 'Cuentas x Pagar', 'Inventario', 'Configuración', 'Reportes'],
                editar: ['Dashboard', 'Logística', 'Facturación', 'Tráfico', 'Diesel', 'Mantenimiento', 'Tesoreria', 'Cuentas x Cobrar', 'Cuentas x Pagar', 'Inventario', 'Configuración', 'Reportes']
              }
            },
            sessionData: {
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              tenantId
            }
          }
        );
        console.log('✅ Sesión mock establecida con addInitScript (se aplicará en la próxima navegación)');
        return;
      } catch (initScriptError) {
        console.log('⚠️ No se pudo establecer sesión con addInitScript, asumiendo éxito');
        return;
      }
    }
    console.error('❌ Error estableciendo sesión mock:', error.message);
    // Solo lanzar error si no es por cierre de página
    throw new Error(`No se pudo establecer sesión mock: ${error.message}`);
  }
}

/**
 * Verificar si el usuario está autenticado
 * @param {import('@playwright/test').Page} page - Página de Playwright
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated(page) {
  try {
    // Esperar a que la página esté lista
    await page.waitForLoadState('domcontentloaded', { timeout: 3000 }).catch(() => {});
    
    return await page.evaluate(() => {
      const session = localStorage.getItem('erpSession');
      const user = localStorage.getItem('erpCurrentUser');
      if (session && user) {
        try {
          const sessionData = JSON.parse(session);
          const expiresAt = Date.parse(sessionData.expiresAt || '');
          // Si no hay fecha de expiración o la fecha es válida y no ha expirado
          return !isFinite(expiresAt) || Date.now() < expiresAt;
        } catch {
          return true; // Si no se puede parsear, asumir válido
        }
      }
      return false;
    });
  } catch (error) {
    // Si hay error (p. ej., navegación en curso), retornar false
    return false;
  }
}

/**
 * Hacer logout
 * @param {import('@playwright/test').Page} page - Página de Playwright
 * @returns {Promise<void>}
 */
export async function logout(page) {
  await page.evaluate(() => {
    localStorage.removeItem('erpSession');
    localStorage.removeItem('erpCurrentUser');
    localStorage.removeItem('erp_saved_credentials');
    localStorage.removeItem('erp_remember_me');
    sessionStorage.clear();
    
    // Si hay una función de logout en Firebase, llamarla
    if (typeof window.firebaseSignOut === 'function') {
      window.firebaseSignOut().catch(() => {
        // Ignorar errores en logout
      });
    }
  });
  console.log('✅ Logout completado');
}

/**
 * Establecer sesión directamente en localStorage (para tests rápidos)
 * Útil cuando no quieres hacer login completo pero necesitas una sesión válida
 * @param {import('@playwright/test').Page} page - Página de Playwright
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<void>}
 */
export async function setMockSession(page, userData = {}) {
  const defaultUser = {
    email: 'demo@titanfleet.com',
    nombre: 'Usuario Demo',
    tenantId: 'demo',
    permisos: {
      ver: ['Dashboard', 'Logística', 'Facturación', 'Tráfico', 'Diesel', 'Mantenimiento', 'Tesoreria', 'Cuentas x Cobrar', 'Cuentas x Pagar', 'Inventario', 'Configuración', 'Reportes'],
      editar: ['Dashboard', 'Logística', 'Facturación', 'Tráfico', 'Diesel', 'Mantenimiento', 'Tesoreria', 'Cuentas x Cobrar', 'Cuentas x Pagar', 'Inventario', 'Configuración', 'Reportes']
    }
  };

  const user = { ...defaultUser, ...userData };
  const session = {
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
    tenantId: user.tenantId
  };

  // Esperar a que la página esté estable antes de establecer la sesión
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: 3000 });
  } catch {
    // Continuar de todos modos si hay timeout
  }
  
  // Intentar establecer la sesión con reintentos
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      await page.evaluate(
        ({ user, session }) => {
          localStorage.setItem('erpCurrentUser', JSON.stringify(user));
          localStorage.setItem('erpSession', JSON.stringify(session));
        },
        { user, session }
      );
      
      console.log('✅ Sesión mock establecida');
      return;
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error(`No se pudo establecer sesión mock después de ${maxAttempts} intentos: ${error.message}`);
      }
      
      // Si la página se cerró o fue destruida, no intentar más
      if (error.message.includes('closed') || error.message.includes('destroyed')) {
        throw error;
      }
      
      // Intentar esperar a que la página esté lista antes de reintentar
      try {
        await page.waitForLoadState('domcontentloaded', { timeout: 1000 });
      } catch {
        // Continuar
      }
    }
  }
}

