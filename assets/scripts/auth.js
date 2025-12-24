/**
 * Sistema de Autenticación Ligera - TitanFleet ERP
 *
 * Este archivo contiene el sistema de autenticación actual basado en localStorage
 * y compatible con Firebase Auth.
 *
 * NOTA: El código legacy de ERPAuth fue movido a docs/archive/auth-legacy-ERPAuth.js
 * para referencia histórica.
 */

// Autenticación ligera basada en localStorage (compatible con login de index.html)
(function () {
  const SESSION_KEY = 'erpSession';
  const USER_KEY = 'erpCurrentUser';

  function readSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch (_) {
      return null;
    }
  }
  function readUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch (_) {
      return null;
    }
  }
  function writeUser(user) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (_) {
      // Ignorar error intencionalmente
    }
  }
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function isSessionValid(session) {
    if (!session) return false;
    const now = Date.now();
    const exp = Date.parse(session.expiresAt || '');
    return isFinite(exp) && now < exp;
  }

  function getDisplayName(user) {
    if (!user) return 'Usuario';
    return user.nombre || user.fullName || user.email || 'Usuario';
  }

  function updateUserUI() {
    // Asegurar permisos por defecto si están vacíos
    ensureDefaultPermissions();

    // Actualizar nombre del usuario SOLO si no se ha actualizado ya
    const nameEl = document.getElementById('currentUserName');
    if (nameEl && !window.__userInfoUpdated) {
      const user = readUser();
      const displayName = getDisplayName(user);
      nameEl.textContent = displayName;
      window.__userInfoUpdated = true;
      console.log('✅ Nombre de usuario actualizado desde erpAuth.updateUserUI():', displayName);
    }

    // CRÍTICO: Asegurar que los IDs estén presentes ANTES de aplicar permisos
    ensureNavigationIds();

    // Aplicar permisos de navegación (ocultar/eliminar elementos del sidebar)
    // NOTA: Estos siempre se deben aplicar, no están limitados por la flag
    applyNavigationPermissions();

    // Asegurar que también se apliquen permisos del sidebar si la función está disponible
    if (typeof window.applySidebarPermissions === 'function') {
      window.applySidebarPermissions();
    }
  }

  function ensureDefaultPermissions() {
    const user = readUser();
    if (!user) return;
    // Asegurar que el objeto permisos existe, pero NO otorgar permisos automáticamente
    if (!user.permisos) {
      user.permisos = { ver: [], editar: [] };
      writeUser(user);
      // Actualizar sesión si existe
      try {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
        if (session && session.user) {
          session.user = user;
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        }
      } catch (_) {
      // Ignorar error intencionalmente
    }
    }
    // NO otorgar permisos automáticamente - respetar los permisos configurados en Firebase
    // Si la lista está vacía, significa que el usuario no tiene acceso a ningún módulo
  }

  function applyNavigationPermissions() {
    // Prevenir ejecuciones múltiples simultáneas
    if (window._applyingNavigationPermissions) {
      // Silenciar para evitar spam en consola
      return;
    }
    window._applyingNavigationPermissions = true;

    // Log solo la primera vez o en facturacion.html para debugging
    const currentPath = window.location.pathname || window.location.href || '';
    const isFacturacionPage = currentPath.includes('facturacion.html');
    if (isFacturacionPage && (!window._navPermissionsLogged || window._navPermissionsLogged < 3)) {
      if (!window._navPermissionsLogged) window._navPermissionsLogged = 0;
      window._navPermissionsLogged++;
      // console.log('========================================');
      // console.log('[auth] 🚀🚀🚀 applyNavigationPermissions: FUNCIÓN EJECUTÁNDOSE 🚀🚀🚀');
      // console.log('[auth] Timestamp:', new Date().toISOString());
      // console.log('========================================');
    }

    try {
      const user = readUser();
      if (!user || !user.permisos) {
        console.log('[auth] applyNavigationPermissions: No hay usuario o permisos');
        return;
      }

      // CRÍTICO: Asegurar que los IDs estén presentes antes de procesar
      // ESPECIAL: En facturacion.html, forzar asignación de IDs múltiples veces
      const currentPath = window.location.pathname || window.location.href || '';
      const isFacturacionPage = currentPath.includes('facturacion.html');

      // console.log('[auth] 🔍 applyNavigationPermissions: currentPath=', currentPath, 'isFacturacionPage=', isFacturacionPage);

      if (isFacturacionPage) {
        // console.log('[auth] 🔧 facturacion.html detectada en applyNavigationPermissions, forzando asignación de IDs...');
        // Forzar asignación de IDs múltiples veces en facturacion.html
        ensureNavigationIds();
        // Esperar un momento y volver a intentar
        setTimeout(function () {
          ensureNavigationIds();
          // console.log('[auth] 🔧 IDs re-asignados después de delay en facturacion.html');
        }, 100);
      } else {
        ensureNavigationIds();
      }

      const permisosVer = user.permisos.ver || [];
      const permisosEditar = []; // Eliminado: sólo usamos permisos de ver

      // SIEMPRE mostrar logs en facturacion.html para debugging
      // console.log('[auth] 🔍 applyNavigationPermissions: pathname=', currentPath, 'isFacturacionPage=', isFacturacionPage);

      if (isFacturacionPage) {
        console.log('[auth] 🔍 applyNavigationPermissions: INICIANDO en facturacion.html');
        console.log('[auth] 📋 Permisos del usuario:', permisosVer);
        console.log('[auth] 📋 Número de permisos:', permisosVer.length);

        // Verificar si los elementos del sidebar están en el DOM
        const testElement = document.getElementById('nav-facturacion');
        console.log('[auth] 🔍 Elemento nav-facturacion en DOM:', testElement ? 'SÍ' : 'NO');
        if (testElement) {
          console.log(
            '[auth] 🔍 nav-facturacion display actual:',
            window.getComputedStyle(testElement).display
          );
        }
      }

      // console.log('[auth] applyNavigationPermissions: Aplicando permisos para', permisosVer.length, 'módulos');
      // console.log('[auth] 📋 Lista completa de permisos del usuario:', permisosVer);

      // Si tiene '*' en permisos, mostrar todos los módulos
      const hasAllPermissions = permisosVer.includes('*') || permisosVer.includes('all');
      if (hasAllPermissions) {
        console.log(
          '[auth] ⚠️ Usuario tiene permisos TOTALES (* o all), mostrando TODOS los módulos'
        );
      } else {
        console.log(
          '[auth] ℹ️ Usuario tiene permisos ESPECÍFICOS, solo se mostrarán los módulos permitidos'
        );
      }

      // Mapeo de módulos a IDs de navegación
      const moduleMap = {
        Logística: 'nav-logistica',
        Facturación: 'nav-facturacion',
        Tráfico: 'nav-trafico',
        Operadores: 'nav-operadores',
        Diesel: 'nav-diesel',
        Mantenimiento: 'nav-mantenimiento',
        Tesoreria: 'nav-tesoreria',
        'Cuentas x Cobrar': 'nav-cxc',
        'Cuentas x Pagar': 'nav-cxp',
        Inventario: 'nav-inventario',
        Configuración: 'nav-configuracion',
        Reportes: 'nav-reportes',
        Dashboard: 'nav-dashboard'
      };

      let foundElements = 0;
      let processedElements = 0;

      // Ocultar o eliminar elementos del sidebar que no puede ver
      Object.entries(moduleMap).forEach(([moduleName, navId]) => {
        const navElement = document.getElementById(navId);
        if (navElement) {
          foundElements++;
          // Normalizar para comparación (sin acentos, minúsculas)
          const normalizedModule = normalizeText(moduleName);
          const normalizedPermissions = permisosVer.map(p => normalizeText(p));
          const hasPermission =
            hasAllPermissions || normalizedPermissions.includes(normalizedModule);

          // Mostrar logs detallados siempre en facturacion.html
          if (isFacturacionPage) {
            // console.log(`[auth] 🔍 Verificando módulo: ${moduleName} (ID: ${navId}) - Permiso: ${hasPermission ? 'SÍ' : 'NO'}`);
          } else {
            // Solo mostrar logs detallados la primera vez en otras páginas
            if (typeof window._permissionsCheckCount === 'undefined') {
              window._permissionsCheckCount = 0;
            }
            window._permissionsCheckCount++;
            if (window._permissionsCheckCount === 1) {
              // console.log(`[auth] Verificando módulo: ${moduleName} (ID: ${navId})`);
            }
          }

          processedElements++;
          if (hasPermission) {
            // Agregar clase para permitir visualización PRIMERO
            navElement.classList.add('permission-granted');
            // Asegurar que el elemento esté visible (sobrescribir cualquier ocultación previa con !important)
            // Usar 'list-item' porque los nav-item son elementos <li>
            navElement.style.setProperty('display', 'list-item', 'important');
            navElement.style.setProperty('visibility', 'visible', 'important');
            navElement.style.setProperty('opacity', '1', 'important');
            navElement.style.setProperty('height', 'auto', 'important');
            navElement.style.setProperty('overflow', 'visible', 'important');
            // Eliminar cualquier clase que lo oculte
            navElement.classList.remove('d-none');
            // console.log(`[auth] ✅ Mostrando en sidebar: ${moduleName} (ID: ${navId})`);
          } else {
            // NO eliminar del DOM, solo ocultar con !important para que no se vea
            // Esto permite que se puedan restaurar si los permisos cambian
            navElement.classList.remove('permission-granted');
            navElement.style.setProperty('display', 'none', 'important');
            navElement.style.setProperty('visibility', 'hidden', 'important');
            navElement.style.setProperty('opacity', '0', 'important');
            navElement.style.setProperty('height', '0', 'important');
            navElement.style.setProperty('overflow', 'hidden', 'important');
            // console.log(`[auth] ❌ Ocultando del sidebar: ${moduleName} (sin permisos)`);
          }
        } else {
          // No loguear elementos faltantes - es normal que no todas las páginas tengan todos los elementos del sidebar
          // Solo loguear en modo debug si es necesario
          if (window.DEBUG_AUTH === true) {
            if (typeof window._missingElementsLogged === 'undefined') {
              window._missingElementsLogged = new Set();
            }
            if (!window._missingElementsLogged.has(navId)) {
              console.debug(`[auth] Elemento no encontrado (normal): ${navId} (${moduleName})`);
              window._missingElementsLogged.add(navId);
            }
          }
        }
      });

      // console.log(`[auth] applyNavigationPermissions: ${foundElements} elementos encontrados, ${processedElements} procesados`);

      // Logs adicionales para facturacion.html
      if (isFacturacionPage) {
        // console.log('[auth] 📊 Resumen de permisos aplicados:');
        // console.log(`  - Elementos encontrados: ${foundElements}`);
        // console.log(`  - Elementos procesados: ${processedElements}`);
        // Verificar estado de algunos elementos clave
        // const facturacionEl = document.getElementById('nav-facturacion');
        // const logisticaEl = document.getElementById('nav-logistica');
        // const tesoreriaEl = document.getElementById('nav-tesoreria');
        // console.log(`  - nav-facturacion: ${facturacionEl ? 'existe' : 'NO existe'}, display: ${facturacionEl ? window.getComputedStyle(facturacionEl).display : 'N/A'}`);
        // console.log(`  - nav-logistica: ${logisticaEl ? 'existe' : 'NO existe'}, display: ${logisticaEl ? window.getComputedStyle(logisticaEl).display : 'N/A'}`);
        // console.log(`  - nav-tesoreria: ${tesoreriaEl ? 'existe' : 'NO existe'}, display: ${tesoreriaEl ? window.getComputedStyle(tesoreriaEl).display : 'N/A'}`);
      }

      // Marcar como aplicado después de la primera ejecución completa
      if (!window._permissionsApplied) {
        window._permissionsApplied = true;
        // console.log('[auth] ✅ Permisos de navegación aplicados');
      }

      // Guardar permisos para verificación de páginas
      window.userPermissions = { ver: permisosVer };
    } catch (error) {
      console.error('[auth] ❌ ERROR en applyNavigationPermissions:', error);
      console.error('[auth] ❌ Stack trace:', error.stack);
      // Intentar aplicar permisos de forma básica aunque haya error
      try {
        const user = readUser();
        if (user && user.permisos) {
          ensureNavigationIds();
          console.log('[auth] ⚠️ Aplicación de permisos básica completada después de error');
        }
      } catch (fallbackError) {
        console.error('[auth] ❌ ERROR en fallback de permisos:', fallbackError);
      }
    } finally {
      // Liberar el flag después de un pequeño delay para permitir ejecuciones posteriores
      setTimeout(() => {
        window._applyingNavigationPermissions = false;
      }, 100);
    }
  }

  // Utilidad: normalizar texto para comparar permisos (sin acentos, minúsculas)
  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}+/gu, '')
      .trim();
  }

  function canAccessModule(moduleName) {
    const user = readUser();

    // menu.html y Dashboard siempre están permitidos para todos los usuarios autenticados
    const alwaysAllowed = ['menu.html', 'Dashboard'];
    const normalizedModule = normalizeText(moduleName);
    if (alwaysAllowed.some(allowed => normalizedModule === normalizeText(allowed))) {
      return true;
    }

    // Si no hay usuario, denegar acceso
    if (!user) {
      console.warn('[auth] canAccessModule: No hay usuario autenticado');
      return false;
    }

    // Si no hay objeto de permisos, denegar acceso
    if (!user.permisos) {
      console.warn('[auth] canAccessModule: Usuario sin objeto de permisos');
      return false;
    }

    const target = normalizeText(moduleName);
    const rawList = user.permisos.ver || [];

    // Si la lista de "ver" está vacía o no es un array, NO permitir acceso
    if (!Array.isArray(rawList) || rawList.length === 0) {
      console.warn('[auth] canAccessModule: Lista de permisos vacía o inválida para', moduleName);
      return false;
    }

    const list = rawList.map(normalizeText);

    // Verificar si tiene acceso a todos los módulos o al módulo específico
    const hasAccess = list.includes('*') || list.includes('all') || list.includes(target);

    if (!hasAccess) {
      console.log(
        '[auth] canAccessModule: Acceso DENEGADO a',
        moduleName,
        '- Permisos del usuario:',
        list
      );
    }

    return hasAccess;
  }

  function canEditModule(moduleName) {
    const user = readUser();
    if (!user || !user.permisos) return true;
    const target = normalizeText(moduleName);
    const list = (user.permisos.editar || []).map(normalizeText);
    return list.includes(target);
  }

  function checkPageAccess() {
    const currentPage = window.location.pathname.split('/').pop();

    // menu.html no requiere verificación de permisos - es la página principal después del login
    if (currentPage === 'menu.html' || currentPage === '') {
      return true; // Permitir acceso a menu.html siempre
    }

    const pageModuleMap = {
      'logistica.html': 'Logística',
      'facturacion.html': 'Facturación',
      'trafico.html': 'Tráfico',
      'diesel.html': 'Diesel',
      'mantenimiento.html': 'Mantenimiento',
      'tesoreria.html': 'Tesoreria',
      'CXC.html': 'Cuentas x Cobrar',
      'CXP.html': 'Cuentas x Pagar',
      'inventario.html': 'Inventario',
      'configuracion.html': 'Configuración',
      'reportes.html': 'Reportes'
    };

    const moduleName = pageModuleMap[currentPage];
    const user = readUser();

    // Log para diagnóstico
    console.log('[auth] Verificando acceso a página:', {
      currentPage,
      moduleName,
      tieneUsuario: !!user,
      permisos: user?.permisos?.ver || []
    });

    if (!moduleName) {
      // Si la página no está en el mapa, permitir acceso (páginas especiales)
      console.log('[auth] Página no requiere verificación de permisos:', currentPage);
      return true;
    }

    // Verificar si el usuario tiene acceso al módulo
    if (!canAccessModule(moduleName)) {
      console.warn('[auth] ⚠️ ACCESO DENEGADO - Usuario no tiene permisos para:', moduleName);
      console.warn('[auth] Permisos del usuario:', user?.permisos?.ver || []);
      console.warn('[auth] Email del usuario:', user?.email);

      // Solo permitir acceso durante login reciente si el usuario es demo
      // Para otros usuarios, bloquear acceso inmediatamente
      try {
        const session = JSON.parse(localStorage.getItem('erpSession') || 'null');
        const loginMs = session?.loginTime ? Date.parse(session.loginTime) : 0;
        const isRecentLogin = loginMs && Date.now() - loginMs < 5000; // Solo 5 segundos
        const demoTenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        const isDemoUser = user?.email === 'demo@titanfleet.com' || user?.tenantId === demoTenantId;

        // Solo permitir acceso temporal si es usuario demo y login muy reciente
        if (isRecentLogin && isDemoUser) {
          console.log('[auth] ⏳ Login reciente de usuario demo, esperando permisos...');
          // Dar tiempo para que se carguen los permisos, pero solo para demo
          return true;
        }
      } catch (_) {
      // Ignorar error intencionalmente
    }

      // SIEMPRE redirigir al menú cuando se bloquea acceso
      // No buscar otra página permitida, simplemente ir al menú
      const session = readSession();
      let targetPage = 'menu.html'; // Siempre redirigir al menú

      if (!isSessionValid(session)) {
        targetPage = '../index.html'; // Solo si no hay sesión válida, ir a login
      }

      if (targetPage !== currentPage) {
        console.warn('[auth] 🔒 BLOQUEANDO ACCESO - Redirigiendo de', currentPage, 'a', targetPage);
        alert(
          `⚠️ Acceso Denegado\n\nNo tienes permisos para acceder a ${moduleName}.\n\nSerás redirigido al menú principal.`
        );
        window.location.replace(targetPage);
        return false;
      }
    } else {
      console.log('[auth] ✅ Acceso permitido a:', moduleName);
    }

    return true;
  }

  async function logout() {
    clearSession();
    try {
      sessionStorage.removeItem('erpCurrentUser');
    } catch (_) {
      // Ignorar error intencionalmente
    }

    // Marcar que se cerró sesión explícitamente para evitar auto-login
    localStorage.setItem('sessionClosedExplicitly', 'true');
    // Limpiar después de 5 minutos para permitir auto-login en el futuro
    setTimeout(
      () => {
        localStorage.removeItem('sessionClosedExplicitly');
      },
      5 * 60 * 1000
    ); // 5 minutos

    // Cerrar sesión en Firebase si está disponible
    if (window.firebaseSignOut) {
      try {
        await window.firebaseSignOut();
      } catch (error) {
        console.warn('Error cerrando sesión en Firebase:', error);
      }
    }

    // Determinar la ruta correcta de index.html según la ubicación actual
    // Siempre redirigir a public/index.html
    const pathname = window.location.pathname || '';
    const isInPages = pathname.includes('/pages/') || pathname.includes('\\pages\\');
    const isInPublic = pathname.includes('/public/') || pathname.includes('\\public\\');

    let indexPath;
    if (isInPublic) {
      // Si ya estamos en public/, usar ruta relativa
      indexPath = 'index.html';
    } else if (isInPages) {
      // Si estamos en pages/, subir dos niveles para llegar a public/
      indexPath = '../../public/index.html';
    } else {
      // Si estamos en la raíz, ir a public/
      indexPath = 'public/index.html';
    }

    window.location.href = indexPath;
  }

  function isAuthenticated() {
    return isSessionValid(readSession());
  }

  /**
   * Función para limpiar datos de sesión del localStorage
   * Útil para resolver problemas de permisos o sesiones corruptas
   */
  function clearAuthData() {
    console.log('🧹 Limpiando datos de autenticación del localStorage...');

    // Lista de claves relacionadas con autenticación/sesión
    const authKeys = [
      'erpSession',
      'erpCurrentUser',
      'sessionClosedExplicitly',
      'erp_saved_credentials',
      'erp_remember_me'
    ];

    let cleaned = 0;
    authKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        cleaned++;
        console.log(`  🗑️ Eliminado: ${key}`);
      }
    });

    // También limpiar sessionStorage
    try {
      sessionStorage.removeItem('erpCurrentUser');
      sessionStorage.removeItem('erpSession');
      cleaned += 2;
      console.log('  🗑️ Limpiado sessionStorage');
    } catch (_) {
      // Ignorar error intencionalmente
    }

    console.log(`✅ ${cleaned} elementos eliminados del almacenamiento`);
    console.log('ℹ️ Ahora puedes iniciar sesión nuevamente para obtener permisos actualizados');

    return cleaned;
  }

  /**
   * Función para mostrar qué datos hay en localStorage
   * Útil para diagnóstico
   */
  function showLocalStorageInfo() {
    console.log('📊 === CONTENIDO DE LOCALSTORAGE ===');

    const allKeys = Object.keys(localStorage);
    const authKeys = ['erpSession', 'erpCurrentUser', 'sessionClosedExplicitly'];
    const configKeys = allKeys.filter(
      k => k.startsWith('erp_') || k.startsWith('config') || k.includes('configuracion')
    );
    const otherKeys = allKeys.filter(k => !authKeys.includes(k) && !configKeys.includes(k));

    console.log('\n🔐 Datos de Autenticación/Sesión:');
    authKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          console.log(`  ${key}:`, parsed);
        } catch {
          console.log(`  ${key}:`, value);
        }
      }
    });

    console.log('\n⚙️ Datos de Configuración:');
    console.log(`  ${configKeys.length} claves encontradas`);
    if (configKeys.length > 0) {
      configKeys.slice(0, 10).forEach(key => {
        console.log(`  - ${key}`);
      });
      if (configKeys.length > 10) {
        console.log(`  ... y ${configKeys.length - 10} más`);
      }
    }

    console.log('\n📦 Otros Datos:');
    console.log(`  ${otherKeys.length} claves encontradas`);
    if (otherKeys.length > 0) {
      otherKeys.slice(0, 10).forEach(key => {
        console.log(`  - ${key}`);
      });
      if (otherKeys.length > 10) {
        console.log(`  ... y ${otherKeys.length - 10} más`);
      }
    }

    console.log(`\n📈 Total: ${allKeys.length} claves en localStorage`);

    return {
      total: allKeys.length,
      auth: authKeys.length,
      config: configKeys.length,
      other: otherKeys.length
    };
  }

  // Exponer API global
  window.erpAuth = {
    isAuthenticated: isAuthenticated(),
    currentUser: readUser(),
    logout: logout,
    updateUserUI: updateUserUI,
    canAccessModule: canAccessModule,
    canEditModule: canEditModule,
    checkPageAccess: checkPageAccess,
    clearAuthData: clearAuthData,
    showLocalStorageInfo: showLocalStorageInfo
  };

  // CRÍTICO: Exponer applyNavigationPermissions INMEDIATAMENTE después de erpAuth
  // Esto asegura que esté disponible incluso si hay errores más adelante
  // console.log('[auth] 🔍 Intentando exponer applyNavigationPermissions...');
  console.log('[auth] 🔍 applyNavigationPermissions definida:', typeof applyNavigationPermissions);
  try {
    if (typeof applyNavigationPermissions === 'function') {
      window.applyNavigationPermissions = applyNavigationPermissions;
      // console.log('[auth] ✅ applyNavigationPermissions expuesto globalmente (inmediatamente después de erpAuth)');
    } else {
      console.error(
        '[auth] ❌ applyNavigationPermissions no es una función, tipo:',
        typeof applyNavigationPermissions
      );
    }
  } catch (error) {
    console.error('[auth] ❌ Error exponiendo applyNavigationPermissions:', error);
  }

  // También exponer directamente para compatibilidad
  window.canAccessModule = canAccessModule;
  window.checkPageAccess = checkPageAccess;

  // Exponer funciones de utilidad globalmente
  window.clearAuthData = clearAuthData;
  window.showLocalStorageInfo = showLocalStorageInfo;

  // Función para agregar IDs a elementos de navegación si no los tienen
  function ensureNavigationIds() {
    // console.log('[auth] 🔍 ensureNavigationIds: Iniciando asignación de IDs...');

    // Mapeo directo de texto del enlace a ID
    const textToIdMap = {
      Logística: 'nav-logistica',
      Facturación: 'nav-facturacion',
      Tráfico: 'nav-trafico',
      Operadores: 'nav-operadores',
      Diesel: 'nav-diesel',
      Mantenimiento: 'nav-mantenimiento',
      Tesoreria: 'nav-tesoreria',
      'Cuentas x Cobrar': 'nav-cxc',
      'Cuentas x Pagar': 'nav-cxp',
      Inventario: 'nav-inventario',
      Configuración: 'nav-configuracion',
      Reportes: 'nav-reportes',
      Menú: 'nav-menu'
    };

    // Buscar todos los elementos nav-item y asignar IDs basados en el texto
    const navItems = document.querySelectorAll('.nav-item');
    // console.log(`[auth] 🔍 ensureNavigationIds: Encontrados ${navItems.length} elementos nav-item`);

    let idsAsignados = 0;
    navItems.forEach((navItem, index) => {
      if (!navItem.id || navItem.id === '') {
        const link = navItem.querySelector('a.nav-link');
        if (link) {
          const span = link.querySelector('span');
          const text = span ? span.textContent.trim() : link.textContent.trim();
          if (text && textToIdMap[text]) {
            navItem.id = textToIdMap[text];
            idsAsignados++;
            console.log(`[auth] ✅ ID asignado [${index}]: "${text}" -> ${textToIdMap[text]}`);
          } else {
            console.log(`[auth] ⚠️ No se encontró mapeo para texto: "${text}"`);
          }
        } else {
          console.log(`[auth] ⚠️ No se encontró enlace en nav-item [${index}]`);
        }
      } else {
        // console.log(`[auth] ℹ️ nav-item [${index}] ya tiene ID: ${navItem.id}`);
      }
    });

    // console.log(`[auth] ✅ ensureNavigationIds: ${idsAsignados} IDs asignados`);

    // También usar el método por href como respaldo
    const moduleMap = {
      'logistica.html': 'nav-logistica',
      'facturacion.html': 'nav-facturacion',
      'trafico.html': 'nav-trafico',
      'diesel.html': 'nav-diesel',
      'mantenimiento.html': 'nav-mantenimiento',
      'tesoreria.html': 'nav-tesoreria',
      'CXC.html': 'nav-cxc',
      'CXP.html': 'nav-cxp',
      'inventario.html': 'nav-inventario',
      'configuracion.html': 'nav-configuracion',
      'reportes.html': 'nav-reportes',
      'menu.html': 'nav-menu'
    };

    Object.entries(moduleMap).forEach(([page, navId]) => {
      const navLinks = document.querySelectorAll(`a[href="${page}"], a[href*="${page}"]`);
      navLinks.forEach(link => {
        const navItem = link.closest('.nav-item');
        if (navItem && (!navItem.id || navItem.id === '')) {
          navItem.id = navId;
          console.log(`[auth] ✅ ID asignado por href: ${page} -> ${navId}`);
        }
      });
    });
  }

  // Actualizar UI al cargar
  document.addEventListener('DOMContentLoaded', function () {
    // Asegurar permisos por defecto antes de validar acceso
    ensureDefaultPermissions();
    // Asegurar que los IDs de navegación estén presentes
    ensureNavigationIds();

    // Refrescar estado por si cambió
    window.erpAuth.isAuthenticated = isAuthenticated();
    window.erpAuth.currentUser = readUser();

    // Para menu.html, esperar un momento antes de verificar acceso
    // Esto da tiempo a que la sesión se establezca completamente después del login
    const currentPage = window.location.pathname.split('/').pop();
    const isMenuPage = currentPage === 'menu.html' || currentPage === '';

    if (isMenuPage) {
      // Para menu.html, NO verificar sesión inmediatamente
      // Permitir que la página se cargue completamente primero
      console.log(
        '[auth] Página menu.html detectada, permitiendo carga sin verificación inmediata'
      );

      // Actualizar UI sin verificar acceso (menu.html es la página principal)
      // Esto permite que la página se muestre mientras se verifica la sesión
      updateUserUI();

      // Verificar sesión en segundo plano después de un delay más largo
      // Esto da tiempo suficiente para que la sesión se establezca después del login
      setTimeout(() => {
        const session = readSession();
        const user = readUser();

        console.log('[auth] Verificando sesión en menu.html después de delay...', {
          tieneSession: !!session,
          sessionValida: session ? isSessionValid(session) : false,
          tieneUser: !!user,
          loginTime: session?.loginTime
        });

        if (!session || !isSessionValid(session)) {
          // Verificar si es un login muy reciente (menos de 30 segundos)
          // Aumentado el tiempo para dar más margen después del login
          const loginTime = session?.loginTime ? Date.parse(session.loginTime) : 0;
          const timeSinceLogin = loginTime ? Date.now() - loginTime : Infinity;
          const isRecentLogin = timeSinceLogin < 30000; // 30 segundos

          // También verificar si hay usuario en erpAuth (puede estar establecido antes de localStorage)
          const hasErpAuthSession =
            window.erpAuth && window.erpAuth.isAuthenticated && window.erpAuth.currentUser;

          if (!isRecentLogin && !hasErpAuthSession) {
            console.warn(
              '[auth] No hay sesión válida en menu.html después de esperar, redirigiendo a index'
            );
            // Determinar ruta correcta de index.html - siempre redirigir a public/index.html
            const pathname = window.location.pathname || '';
            const isInPages = pathname.includes('/pages/') || pathname.includes('\\pages\\');
            const isInPublic = pathname.includes('/public/') || pathname.includes('\\public\\');

            let indexPath;
            if (isInPublic) {
              indexPath = 'index.html';
            } else if (isInPages) {
              indexPath = '../../public/index.html';
            } else {
              indexPath = 'public/index.html';
            }
            window.location.href = indexPath;
          } else {
            if (isRecentLogin) {
              console.log(
                '[auth] Login reciente detectado (hace ' +
                  Math.round(timeSinceLogin / 1000) +
                  's), manteniendo en menu.html'
              );
            }
            if (hasErpAuthSession) {
              console.log('[auth] Sesión encontrada en erpAuth, manteniendo en menu.html');
            }
          }
        } else {
          console.log('[auth] Sesión válida confirmada en menu.html');
        }
      }, 3000); // Esperar 3 segundos antes de verificar (tiempo suficiente para que se establezca la sesión)
    } else {
      // Para otras páginas, verificar acceso inmediatamente
      // Esperar un momento para asegurar que los permisos estén cargados
      setTimeout(() => {
        if (!checkPageAccess()) {
          return; // Si no tiene acceso, ya se redirigió
        }
        updateUserUI();
      }, 500); // Pequeño delay para asegurar que los permisos estén disponibles
    }
  });

  // También verificar acceso cuando la página esté completamente cargada
  // Esto asegura que la validación se ejecute incluso si DOMContentLoaded ya pasó
  function applyPermissionsOnLoad() {
    // Aplicar permisos de navegación siempre
    applyNavigationPermissions();

    // Verificar acceso a páginas específicas
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage !== 'menu.html' && currentPage !== '' && currentPage !== 'index.html') {
      checkPageAccess();
    }
  }

  // Aplicar permisos tan pronto como sea posible
  // Intentar aplicar inmediatamente si el DOM está listo
  function tryApplyPermissionsNow() {
    // console.log('[auth] 🔍 tryApplyPermissionsNow: Iniciando...');
    const user = readUser();
    // console.log('[auth] 🔍 tryApplyPermissionsNow: Usuario encontrado:', user ? 'SÍ' : 'NO');
    if (user && user.permisos) {
      // console.log('[auth] 🔍 tryApplyPermissionsNow: Permisos encontrados:', user.permisos.ver ? user.permisos.ver.length : 0);
      // Si ya tenemos los permisos, aplicar inmediatamente
      // Usar requestAnimationFrame para sincronizar con el renderizado del navegador
      // console.log('[auth] 🔄 tryApplyPermissionsNow: Usuario y permisos encontrados, llamando applyNavigationPermissions...');
      if (window.requestAnimationFrame) {
        // console.log('[auth] 🔄 Usando requestAnimationFrame...');
        requestAnimationFrame(() => {
          // console.log('[auth] 🔄 Llamando applyNavigationPermissions desde requestAnimationFrame...');
          applyNavigationPermissions();
        });
      } else {
        // console.log('[auth] 🔄 Llamando applyNavigationPermissions directamente (sin requestAnimationFrame)...');
        applyNavigationPermissions();
      }
      // console.log('[auth] ✅ Permisos aplicados inmediatamente (después de llamar a applyNavigationPermissions)');
      return true;
    } else {
      // console.log('[auth] ⚠️ tryApplyPermissionsNow: No hay usuario o permisos disponibles');
    }
    return false;
  }

  // Ocultar inicialmente todos los módulos hasta que se verifiquen los permisos
  // Esto previene que se vean todos los módulos antes de aplicar permisos
  // PERO NO ocultar elementos que ya tienen la clase permission-granted
  function hideAllModulesTemporarily() {
    const moduleIds = [
      'nav-logistica',
      'nav-facturacion',
      'nav-trafico',
      'nav-operadores',
      'nav-diesel',
      'nav-mantenimiento',
      'nav-tesoreria',
      'nav-cxc',
      'nav-cxp',
      'nav-inventario',
      'nav-configuracion',
      'nav-reportes',
      'nav-dashboard'
    ];
    moduleIds.forEach(navId => {
      const navElement = document.getElementById(navId);
      // NO ocultar si ya tiene la clase permission-granted (ya tiene permisos)
      if (
        navElement &&
        !navElement.classList.contains('permission-granted') &&
        navElement.style.display !== 'none'
      ) {
        // Solo ocultar si no está ya oculto y no tiene permisos
        navElement.style.setProperty('display', 'none', 'important');
      }
    });
  }

  // applyNavigationPermissions ya fue expuesto más arriba (línea ~525)
  // Esta línea es redundante pero se mantiene por compatibilidad
  if (!window.applyNavigationPermissions) {
    window.applyNavigationPermissions = applyNavigationPermissions;
    console.log('[auth] ✅ applyNavigationPermissions expuesto globalmente (respaldo)');
  }

  // Aplicar permisos PRIMERO, luego ocultar los que no tienen permisos
  // Esto asegura que los elementos con permisos se muestren correctamente
  function applyPermissionsThenHide() {
    // Intentar aplicar permisos primero
    if (tryApplyPermissionsNow()) {
      // Si los permisos se aplicaron, ocultar solo los que no tienen permisos
      setTimeout(hideAllModulesTemporarily, 50);
    } else {
      // Si no se pudieron aplicar permisos, ocultar todos temporalmente
      hideAllModulesTemporarily();
      // Intentar aplicar permisos después
      setTimeout(tryApplyPermissionsNow, 100);
    }
  }

  // Ocultar módulos inmediatamente si el DOM está listo
  if (document.readyState !== 'loading') {
    // Aplicar permisos PRIMERO, luego ocultar
    applyPermissionsThenHide();
  } else {
    // Si el DOM aún no está listo, aplicar permisos cuando esté listo
    document.addEventListener('DOMContentLoaded', () => {
      applyPermissionsThenHide();
    });
  }

  // Aplicar permisos cuando firebase esté listo (si está disponible)
  if (window.addEventListener) {
    window.addEventListener(
      'firebaseReady',
      function () {
        setTimeout(function () {
          applyNavigationPermissions();
          if (
            typeof window.erpAuth !== 'undefined' &&
            typeof window.erpAuth.updateUserUI === 'function'
          ) {
            window.erpAuth.updateUserUI();
          }
        }, 200);
      },
      { once: true }
    );
  }

  // Aplicar permisos periódicamente durante los primeros segundos para asegurar
  // que se apliquen incluso si hay delays en la carga
  let permissionApplyAttempts = 0;
  const maxAttempts = 10;
  const permissionInterval = setInterval(function () {
    permissionApplyAttempts++;
    const user = readUser();
    if (user && user.permisos) {
      applyNavigationPermissions();
      clearInterval(permissionInterval);
      // console.log('[auth] ✅ Permisos aplicados después de', permissionApplyAttempts, 'intentos');
    } else if (permissionApplyAttempts >= maxAttempts) {
      clearInterval(permissionInterval);
      console.warn('[auth] ⚠️ No se pudieron aplicar permisos después de', maxAttempts, 'intentos');
    }
  }, 300);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Intentar aplicar inmediatamente cuando el DOM esté listo
      if (!tryApplyPermissionsNow()) {
        // Si no están disponibles, aplicar después de delays incrementales
        setTimeout(applyPermissionsOnLoad, 500);
        setTimeout(applyPermissionsOnLoad, 1500);
      }
    });
  } else {
    // Si el DOM ya está cargado, aplicar con delays incrementales
    setTimeout(applyPermissionsOnLoad, 500);
    setTimeout(applyPermissionsOnLoad, 1500);
  }

  // También aplicar después de más tiempo para asegurar que Firebase haya cargado los permisos
  setTimeout(applyPermissionsOnLoad, 3000);

  // Usar MutationObserver para detectar si se agregan elementos al sidebar y eliminarlos si no tienen permisos
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(function (_mutations) {
      // Verificar si se agregaron elementos al sidebar
      const navMenu = document.querySelector('.nav-menu, .sidebar-nav');
      if (navMenu) {
        // Aplicar permisos cuando se detecten cambios
        applyNavigationPermissions();
      }
    });

    // Observar cambios en el sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      observer.observe(sidebar, {
        childList: true,
        subtree: true
      });
      // console.log('[auth] ✅ Observer configurado para detectar cambios en el sidebar');
    } else {
      // Si el sidebar aún no existe, esperar y configurar el observer
      setTimeout(() => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
          observer.observe(sidebar, {
            childList: true,
            subtree: true
          });
          // console.log('[auth] ✅ Observer configurado para detectar cambios en el sidebar (retardado)');
        }
      }, 500);
    }
  }

  // ESPECIAL: Para facturacion.html, aplicar permisos múltiples veces con delays
  // Este código se ejecuta inmediatamente cuando auth.js se carga
  const currentPath = window.location.pathname || window.location.href || '';
  const isFacturacionPage = currentPath.includes('facturacion.html');

  if (isFacturacionPage) {
    console.log(
      '[auth] 🔧 Página facturacion.html detectada, aplicando permisos múltiples veces...'
    );

    // Función para aplicar permisos con verificación de IDs
    function applyPermissionsWithRetry() {
      // Asegurar IDs primero
      ensureNavigationIds();
      // Luego aplicar permisos
      applyNavigationPermissions();
    }

    // Aplicar inmediatamente si el DOM está listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        setTimeout(applyPermissionsWithRetry, 100);
        setTimeout(applyPermissionsWithRetry, 500);
        setTimeout(applyPermissionsWithRetry, 1000);
        setTimeout(applyPermissionsWithRetry, 2000);
        setTimeout(applyPermissionsWithRetry, 3000);
      });
    } else {
      setTimeout(applyPermissionsWithRetry, 100);
      setTimeout(applyPermissionsWithRetry, 500);
      setTimeout(applyPermissionsWithRetry, 1000);
      setTimeout(applyPermissionsWithRetry, 2000);
      setTimeout(applyPermissionsWithRetry, 3000);
    }

    // También aplicar cuando firebase esté listo
    if (window.addEventListener) {
      window.addEventListener('firebaseReady', function () {
        setTimeout(applyPermissionsWithRetry, 500);
      });
    }
  }
})();

// CRÍTICO: Asegurar que applyNavigationPermissions esté disponible globalmente
// Esto es un respaldo en caso de que la exposición dentro de la IIFE falle
(function () {
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(function () {
        if (
          typeof window.applyNavigationPermissions === 'undefined' &&
          typeof window.erpAuth !== 'undefined'
        ) {
          console.warn(
            '[auth] ⚠️ applyNavigationPermissions no está disponible, intentando exponer desde fuera de IIFE...'
          );
          // Si erpAuth está disponible pero applyNavigationPermissions no, hay un problema
          // Intentar exponer desde erpAuth si está disponible
          if (window.erpAuth && typeof window.erpAuth.updateUserUI === 'function') {
            // updateUserUI debería llamar a applyNavigationPermissions internamente
            console.log('[auth] ✅ Usando erpAuth.updateUserUI() como alternativa');
          }
        }
      }, 1000);
    });
  } else {
    setTimeout(function () {
      if (
        typeof window.applyNavigationPermissions === 'undefined' &&
        typeof window.erpAuth !== 'undefined'
      ) {
        console.warn(
          '[auth] ⚠️ applyNavigationPermissions no está disponible después de 1 segundo'
        );
      }
    }, 1000);
  }
})();

// Función de ayuda para contraseña olvidada (demo)
function showForgotPassword() {
  alert('Para restablecer su contraseña contacte al administrador. (Demo)');
}
