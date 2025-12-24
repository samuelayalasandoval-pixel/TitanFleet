/**
 * Gestión de Permisos - menu.html
 * Maneja la verificación de permisos de acceso a módulos
 */

(function () {
  'use strict';

  /**
   * Función para verificar si el usuario puede acceder a un módulo
   */
  window.canAccessModule = function (moduleName) {
    // Intentar usar la función de erpAuth si está disponible (evitar recursión)
    if (window.erpAuth && typeof window.erpAuth.canAccessModule === 'function') {
      try {
        return window.erpAuth.canAccessModule(moduleName);
      } catch (e) {
        console.warn('Error usando window.erpAuth.canAccessModule:', e);
        // Continuar con fallback si hay error
      }
    }

    // Fallback: leer directamente de localStorage
    try {
      const userStr = localStorage.getItem('erpCurrentUser');
      if (!userStr) {
        console.log('⚠️ No hay usuario, denegando acceso a:', moduleName);
        return false; // Si no hay usuario, denegar acceso
      }

      const user = JSON.parse(userStr);
      if (!user || !user.permisos) {
        console.log('⚠️ Usuario sin permisos configurados, denegando acceso a:', moduleName);
        return false; // Sin permisos = acceso denegado
      }

      const permisosVer = user.permisos.ver || [];
      if (!Array.isArray(permisosVer) || permisosVer.length === 0) {
        console.log('⚠️ Lista de permisos vacía, denegando acceso a:', moduleName);
        return false; // Lista vacía = acceso denegado
      }

      // Normalizar texto para comparación
      const normalizeText = value =>
        String(value || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/\p{Diacritic}+/gu, '')
          .trim();

      const target = normalizeText(moduleName);
      const list = permisosVer.map(normalizeText);

      const hasAccess = list.includes(target) || list.includes('*') || list.includes('all');
      console.log(`🔍 Verificando acceso a "${moduleName}":`, {
        target,
        list,
        hasAccess
      });

      return hasAccess;
    } catch (error) {
      console.error('❌ Error verificando permisos:', error);
      return false; // En caso de error, denegar acceso por seguridad
    }
  };

  /**
   * Función para actualizar permisos del usuario demo si falta "Operadores"
   */
  window.actualizarPermisosDemo = function () {
    try {
      const userStr = localStorage.getItem('erpCurrentUser');
      if (!userStr) {
        return;
      }

      const user = JSON.parse(userStr);
      if (!user || user.email !== 'demo@titanfleet.com') {
        return;
      }

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

      const permisosVer = user.permisos?.ver || [];
      const tieneOperadores = permisosVer.some(p => {
        const normalizeText = value =>
          String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}+/gu, '')
            .trim();
        return normalizeText(p) === normalizeText('Operadores');
      });

      if (!tieneOperadores) {
        console.log('🔄 Actualizando permisos del usuario demo para incluir "Operadores"...');
        user.permisos = { ver: ALL_MODULES, editar: [] };
        localStorage.setItem('erpCurrentUser', JSON.stringify(user));

        // Actualizar también la sesión
        const sessionStr = localStorage.getItem('erpSession');
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            session.user = user;
            localStorage.setItem('erpSession', JSON.stringify(session));
          } catch (e) {
            console.warn('⚠️ Error actualizando sesión:', e);
          }
        }

        console.log('✅ Permisos del usuario demo actualizados');
      }
    } catch (error) {
      console.error('❌ Error actualizando permisos demo:', error);
    }
  };
})();
