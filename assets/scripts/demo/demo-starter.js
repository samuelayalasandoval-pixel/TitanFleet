/**
 * Iniciador de Demo - demo.html
 * Maneja el inicio del demo, licencias y autenticación
 */

(function () {
  'use strict';

  /**
   * Función auxiliar para redirigir de forma robusta
   */
  function redirectToMenu() {
    console.log('🔄 Redirigiendo a menu.html...');

    // Asegurar que la sesión esté guardada antes de redirigir
    const currentUser = JSON.parse(localStorage.getItem('erpCurrentUser') || 'null');
    const session = JSON.parse(localStorage.getItem('erpSession') || 'null');

    if (!currentUser || !currentUser.email || !session) {
      console.warn('⚠️ Sesión no encontrada, esperando un momento...', { currentUser, session });
      setTimeout(() => {
        redirectToMenu();
      }, 300);
      return;
    }

    console.log('✅ Sesión verificada, redirigiendo...', {
      email: currentUser.email,
      tenantId: currentUser.tenantId,
      permisos: currentUser.permisos
    });

    // Usar location.href en lugar de replace para asegurar que funcione
    // y agregar un pequeño delay para asegurar que todo esté guardado
    setTimeout(() => {
      // Construir la ruta de forma segura y directa
      // Siempre usar ruta absoluta desde la raíz del sitio
      const baseUrl = window.location.origin;
      // Asegurar que baseUrl no termine con /
      const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
      // Construir la ruta absoluta correcta - SIEMPRE desde la raíz
      let normalizedPath = `${cleanBaseUrl}/pages/menu.html`;

      // Verificación final: eliminar CUALQUIER duplicación de /pages/
      // Esto maneja casos donde algo haya modificado la URL antes
      normalizedPath = normalizedPath.replace(/(\/pages)+/g, '/pages');

      // Logging para depuración
      const pathname = window.location.pathname || '';
      console.log('🔍 Detectando ubicación y redirigiendo:', {
        desde: pathname,
        desdeHref: window.location.href,
        rutaDestino: '/pages/menu.html',
        rutaCompleta: normalizedPath,
        baseUrl: cleanBaseUrl
      });

      // Forzar guardado de sesión una vez más antes de redirigir
      const currentUser = JSON.parse(localStorage.getItem('erpCurrentUser') || 'null');
      const session = JSON.parse(localStorage.getItem('erpSession') || 'null');

      if (currentUser && session) {
        // Guardar nuevamente para asegurar persistencia
        localStorage.setItem('erpCurrentUser', JSON.stringify(currentUser));
        localStorage.setItem('erpSession', JSON.stringify(session));

        // Actualizar erpAuth si está disponible
        if (window.erpAuth) {
          window.erpAuth.isAuthenticated = true;
          window.erpAuth.currentUser = currentUser;
        }

        console.log('✅ Sesión re-guardada antes de redirigir');
      }

      // Redirigir usando la URL normalizada - usar replace para evitar problemas de historial
      console.log(`🚀 Redirigiendo ahora a: ${normalizedPath}`);
      window.location.replace(normalizedPath);
    }, 600); // Aumentado a 600ms para dar más tiempo
  }

  /**
   * Función para iniciar demo después de aceptar aviso
   */
  window.iniciarDemoDespuesDeAviso = function () {
    // Verificar si hay licencia demo (cliente demo normal)
    const licenseStr = localStorage.getItem('titanfleet_license');

    if (licenseStr && window.DEMO_CONFIG) {
      try {
        const licenseData = JSON.parse(licenseStr);
        const isDemo =
          licenseData.licenseKey === window.DEMO_CONFIG.licenseKey ||
          licenseData.tenantId === window.DEMO_CONFIG.tenantId;

        if (isDemo) {
          if (window.startDemo) {
            window.startDemo();
          }
        }
      } catch (e) {
        console.error('Error verificando licencia:', e);
      }
    } else if (window.startDemo) {
      window.startDemo();
    }
  };

  /**
   * Función principal para iniciar el demo
   */
  window.startDemo = async function () {
    try {
      // Limpiar banderas de sesión cerrada explícitamente para permitir login
      sessionStorage.removeItem('explicitLogout');
      localStorage.removeItem('sessionClosedExplicitly');
      console.log('🧹 Banderas de sesión cerrada limpiadas');

      // Mostrar mensaje de carga
      const button = event?.target || document.querySelector('button[onclick*="startDemo"]');
      if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando Demo...';
      }

      // Verificar que DEMO_CONFIG esté disponible
      if (!window.DEMO_CONFIG) {
        console.error('❌ DEMO_CONFIG no está disponible. Asegúrate de cargar demo-config.js');
        alert('Error: Configuración del demo no disponible. Por favor, recarga la página.');
        return;
      }

      // Activar licencia demo (cliente demo normal) - desde DEMO_CONFIG
      const demoLicense = window.DEMO_CONFIG.licenseKey;
      const demoTenantId = window.DEMO_CONFIG.tenantId;

      // Guardar en localStorage
      localStorage.setItem(
        'titanfleet_license',
        JSON.stringify({
          licenseKey: demoLicense,
          tenantId: demoTenantId,
          type: window.DEMO_CONFIG.licenseType || 'anual',
          activatedAt: new Date().toISOString(),
          status: 'active'
        })
      );

      localStorage.setItem('tenantId', demoTenantId);

      // Credenciales demo - desde DEMO_CONFIG
      const demoEmail = window.DEMO_CONFIG.email;
      const demoPassword = window.DEMO_CONFIG.password;

      // Lista completa de módulos para permisos demo
      const ALL_MODULES = [
        'Logística',
        'Facturación',
        'Tráfico',
        'Operadores',
        'Diesel',
        'Mantenimiento',
        'Tesoreria',
        'Cuentas x Cobrar',
        'Cuentas x Pagar',
        'Inventario',
        'Configuración',
        'Reportes'
      ];

      // Configurar timeout de seguridad para redirigir después de 5 segundos máximo
      const redirectTimeout = setTimeout(() => {
        console.warn('⏱️ Timeout alcanzado, redirigiendo forzosamente...');
        // Configurar sesión local como respaldo
        localStorage.setItem(
          'erpCurrentUser',
          JSON.stringify({
            email: demoEmail,
            nombre: 'Demo',
            tenantId: demoTenantId,
            permisos: { ver: ALL_MODULES, editar: [] }
          })
        );
        localStorage.setItem(
          'erpSession',
          JSON.stringify({
            userId: 'demo_user',
            tenantId: demoTenantId,
            loginTime: new Date().toISOString()
          })
        );
        redirectToMenu();
      }, 5000);

      // Esperar a que Firebase esté listo (con timeout más corto)
      let attempts = 0;
      while (!window.firebaseSignIn && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }

      console.log('🔐 Iniciando sesión con credenciales demo...');

      // Usar firebaseSignIn directamente
      if (window.firebaseSignIn) {
        try {
          // Usar Promise.race para no esperar más de 3 segundos
          const loginPromise = window.firebaseSignIn(demoEmail, demoPassword, demoTenantId);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Login timeout')), 3000)
          );

          await Promise.race([loginPromise, timeoutPromise]);
          console.log('✅ Sesión iniciada correctamente');
          clearTimeout(redirectTimeout);

          // Verificar que la sesión esté guardada antes de redirigir
          const verificarYRedirigir = (intentos = 0) => {
            const currentUser = JSON.parse(localStorage.getItem('erpCurrentUser') || 'null');
            const session = JSON.parse(localStorage.getItem('erpSession') || 'null');

            // Verificar que tenga permisos válidos
            const tienePermisos =
              currentUser &&
              currentUser.permisos &&
              Array.isArray(currentUser.permisos.ver) &&
              currentUser.permisos.ver.length > 0;

            if (currentUser && currentUser.email && session && tienePermisos) {
              console.log('✅ Sesión verificada con permisos, redirigiendo a menu.html...', {
                email: currentUser.email,
                permisosCount: currentUser.permisos.ver.length
              });

              // Actualizar erpAuth antes de redirigir
              if (window.erpAuth) {
                window.erpAuth.isAuthenticated = true;
                window.erpAuth.currentUser = currentUser;
              }

              redirectToMenu();
            } else if (intentos < 10) {
              console.log(`⏳ Esperando que la sesión se guarde... (intento ${intentos + 1}/10)`, {
                tieneUsuario: Boolean(currentUser),
                tieneEmail: Boolean(currentUser?.email),
                tieneSession: Boolean(session),
                tienePermisos: tienePermisos
              });
              setTimeout(() => verificarYRedirigir(intentos + 1), 200);
            } else {
              console.warn('⚠️ Timeout esperando sesión, redirigiendo de todas formas...');
              redirectToMenu();
            }
          };

          // Esperar un momento y luego verificar
          setTimeout(() => verificarYRedirigir(0), 500);
          return;
        } catch (loginError) {
          console.error('❌ Error en login:', loginError);

          // Verificar si es error de quota o timeout
          const isQuotaError =
            loginError &&
            (loginError.code === 'resource-exhausted' ||
              loginError.message?.includes('Quota exceeded') ||
              loginError.message?.includes('quota') ||
              loginError.message === 'Login timeout');

          if (isQuotaError) {
            console.warn('⚠️ Firebase quota/timeout, continuando con login local...');
            clearTimeout(redirectTimeout);
            // Configurar sesión local para demo
            localStorage.setItem(
              'erpCurrentUser',
              JSON.stringify({
                email: demoEmail,
                nombre: 'Demo',
                tenantId: demoTenantId,
                permisos: { ver: ALL_MODULES, editar: [] }
              })
            );
            localStorage.setItem(
              'erpSession',
              JSON.stringify({
                userId: 'demo_user',
                tenantId: demoTenantId,
                loginTime: new Date().toISOString()
              })
            );
            console.log('✅ Sesión demo configurada localmente');
            redirectToMenu();
            return;
          }
        }
      }

      // Si llegamos aquí sin éxito, configurar sesión local y redirigir
      console.warn('⚠️ No se pudo completar el login, usando sesión local...');
      clearTimeout(redirectTimeout);
      localStorage.setItem(
        'erpCurrentUser',
        JSON.stringify({
          email: demoEmail,
          nombre: 'Demo',
          tenantId: demoTenantId,
          permisos: { ver: ALL_MODULES, editar: [] }
        })
      );
      localStorage.setItem(
        'erpSession',
        JSON.stringify({
          userId: 'demo_user',
          tenantId: demoTenantId,
          loginTime: new Date().toISOString()
        })
      );
      redirectToMenu();
    } catch (error) {
      console.error('❌ Error iniciando demo:', error);
      // Configurar sesión local y redirigir de todas formas
      clearTimeout(redirectTimeout);
      localStorage.setItem(
        'erpCurrentUser',
        JSON.stringify({
          email: demoEmail,
          nombre: 'Demo',
          tenantId: demoTenantId,
          permisos: { ver: ALL_MODULES, editar: [] }
        })
      );
      localStorage.setItem(
        'erpSession',
        JSON.stringify({
          userId: 'demo_user',
          tenantId: demoTenantId,
          loginTime: new Date().toISOString()
        })
      );
      redirectToMenu();
    }
  };
})();
