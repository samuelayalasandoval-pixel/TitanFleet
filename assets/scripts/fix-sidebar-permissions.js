/**
 * Script de reparación para asignar IDs y aplicar permisos al sidebar
 * Este script se puede ejecutar manualmente desde la consola si applyNavigationPermissions no está disponible
 */

(function () {
  'use strict';

  function fixSidebarPermissions() {
    console.log('[fix-sidebar] 🔧 Iniciando reparación del sidebar...');

    // 1. Asignar IDs a los elementos
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

    const navItems = document.querySelectorAll('.nav-item');
    console.log(`[fix-sidebar] 🔍 Encontrados ${navItems.length} elementos nav-item`);

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
            console.log(
              `[fix-sidebar] ✅ ID asignado [${index}]: "${text}" -> ${textToIdMap[text]}`
            );
          }
        }
      }
    });
    console.log(`[fix-sidebar] ✅ ${idsAsignados} IDs asignados`);

    // 2. Obtener permisos del usuario
    let permisos = [];
    if (window.erpAuth && window.erpAuth.currentUser && window.erpAuth.currentUser.permisos) {
      permisos = window.erpAuth.currentUser.permisos.ver || [];
    } else {
      // Intentar desde localStorage
      try {
        const userStr = localStorage.getItem('erpCurrentUser');
        if (userStr) {
          const user = JSON.parse(userStr);
          permisos = user.permisos?.ver || [];
        }
      } catch (e) {
        console.error('[fix-sidebar] ❌ Error leyendo permisos:', e);
      }
    }

    console.log('[fix-sidebar] 📋 Permisos del usuario:', permisos);

    // 3. Aplicar permisos
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
      Reportes: 'nav-reportes'
    };

    const hasAllPermissions = permisos.includes('*') || permisos.includes('all');
    let mostrados = 0;
    let ocultos = 0;

    Object.entries(moduleMap).forEach(([moduleName, navId]) => {
      const navElement = document.getElementById(navId);
      if (navElement) {
        const hasPermission = hasAllPermissions || permisos.includes(moduleName);

        if (hasPermission) {
          // Mostrar elemento
          navElement.classList.add('permission-granted');
          navElement.style.setProperty('display', 'list-item', 'important');
          navElement.style.setProperty('visibility', 'visible', 'important');
          navElement.style.setProperty('opacity', '1', 'important');
          navElement.style.setProperty('height', 'auto', 'important');
          navElement.style.setProperty('overflow', 'visible', 'important');
          navElement.classList.remove('d-none');
          mostrados++;
          console.log(`[fix-sidebar] ✅ Mostrando: ${moduleName} (${navId})`);
        } else {
          // Ocultar elemento
          navElement.classList.remove('permission-granted');
          navElement.style.setProperty('display', 'none', 'important');
          navElement.style.setProperty('visibility', 'hidden', 'important');
          navElement.style.setProperty('opacity', '0', 'important');
          navElement.style.setProperty('height', '0', 'important');
          navElement.style.setProperty('overflow', 'hidden', 'important');
          ocultos++;
          console.log(`[fix-sidebar] ❌ Ocultando: ${moduleName} (${navId}) - sin permisos`);
        }
      } else {
        console.warn(`[fix-sidebar] ⚠️ Elemento no encontrado: ${navId} (${moduleName})`);
      }
    });

    console.log(
      `[fix-sidebar] ✅ Reparación completada: ${mostrados} mostrados, ${ocultos} ocultos`
    );
    return { idsAsignados, mostrados, ocultos };
  }

  // Exponer globalmente
  window.fixSidebarPermissions = fixSidebarPermissions;
  console.log(
    '[fix-sidebar] ✅ Script de reparación cargado. Ejecuta: window.fixSidebarPermissions()'
  );

  // Ejecutar automáticamente si el DOM está listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(fixSidebarPermissions, 500);
    });
  } else {
    setTimeout(fixSidebarPermissions, 500);
  }
})();
