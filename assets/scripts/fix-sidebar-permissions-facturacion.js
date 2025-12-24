// Script de reparación del sidebar para facturacion.html
// Este script se ejecuta automáticamente cuando se carga

console.log('[fix-sidebar] 🚀 Script de reparación iniciando (archivo externo)...');

// Función de reparación
function fixSidebarPermissions() {
  console.log('[fix-sidebar] 🔧 Iniciando reparación del sidebar...');

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
  console.log('[fix-sidebar] 🔍 Encontrados', navItems.length, 'elementos nav-item');

  let idsAsignados = 0;
  for (let i = 0; i < navItems.length; i++) {
    const navItem = navItems[i];
    if (!navItem.id || navItem.id === '') {
      const link = navItem.querySelector('a.nav-link');
      if (link) {
        const span = link.querySelector('span');
        const text = span ? span.textContent.trim() : link.textContent.trim();
        if (text && textToIdMap[text]) {
          navItem.id = textToIdMap[text];
          idsAsignados++;
          console.log(`[fix-sidebar] ✅ ID asignado [${i}]: "${text}" -> ${textToIdMap[text]}`);
        }
      }
    }
  }
  console.log('[fix-sidebar] ✅', idsAsignados, 'IDs asignados');

  let permisos = [];
  if (window.erpAuth && window.erpAuth.currentUser && window.erpAuth.currentUser.permisos) {
    permisos = window.erpAuth.currentUser.permisos.ver || [];
  } else {
    try {
      const userStr = localStorage.getItem('erpCurrentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        permisos = user.permisos && user.permisos.ver ? user.permisos.ver : [];
      }
    } catch (e) {
      console.error('[fix-sidebar] ❌ Error leyendo permisos:', e);
    }
  }

  console.log('[fix-sidebar] 📋 Permisos del usuario:', permisos);

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

  const hasAllPermissions = permisos.indexOf('*') !== -1 || permisos.indexOf('all') !== -1;
  let mostrados = 0;
  let ocultos = 0;

  for (const moduleName in moduleMap) {
    if (moduleMap.hasOwnProperty(moduleName)) {
      const navId = moduleMap[moduleName];
      const navElement = document.getElementById(navId);
      if (navElement) {
        const hasPermission = hasAllPermissions || permisos.indexOf(moduleName) !== -1;

        if (hasPermission) {
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
    }
  }

  console.log(`[fix-sidebar] ✅ Reparación completada: ${mostrados} mostrados, ${ocultos} ocultos`);
  return { idsAsignados: idsAsignados, mostrados: mostrados, ocultos: ocultos };
}

// Exponer globalmente
window.fixSidebarPermissions = fixSidebarPermissions;
console.log('[fix-sidebar] ✅ fixSidebarPermissions definido y expuesto globalmente');

// Ejecutar cuando el DOM esté listo
function ejecutarReparacion() {
  if (document.querySelector('.nav-item')) {
    fixSidebarPermissions();
  } else {
    setTimeout(ejecutarReparacion, 100);
  }
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(ejecutarReparacion, 500);
  });
} else {
  setTimeout(ejecutarReparacion, 100);
}

// Ejecutar también después de delays adicionales
setTimeout(ejecutarReparacion, 1000);
setTimeout(ejecutarReparacion, 2000);
setTimeout(ejecutarReparacion, 3000);
setTimeout(ejecutarReparacion, 5000);
