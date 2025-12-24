// SOLUCIÓN MANUAL PARA EL SIDEBAR EN FACTURACIÓN
// Copia y pega este código completo en la consola del navegador (F12)

(function() {
    console.log('[fix-sidebar] 🚀 Iniciando reparación manual del sidebar...');
    
    // 1. Asignar IDs
    var textToIdMap = {
        'Logística': 'nav-logistica',
        'Facturación': 'nav-facturacion',
        'Tráfico': 'nav-trafico',
        'Operadores': 'nav-operadores',
        'Diesel': 'nav-diesel',
        'Mantenimiento': 'nav-mantenimiento',
        'Tesoreria': 'nav-tesoreria',
        'Cuentas x Cobrar': 'nav-cxc',
        'Cuentas x Pagar': 'nav-cxp',
        'Inventario': 'nav-inventario',
        'Configuración': 'nav-configuracion',
        'Reportes': 'nav-reportes',
        'Menú': 'nav-menu'
    };
    
    var navItems = document.querySelectorAll('.nav-item');
    console.log('[fix-sidebar] 🔍 Encontrados', navItems.length, 'elementos nav-item');
    
    var idsAsignados = 0;
    for (var i = 0; i < navItems.length; i++) {
        var navItem = navItems[i];
        if (!navItem.id || navItem.id === '') {
            var link = navItem.querySelector('a.nav-link');
            if (link) {
                var span = link.querySelector('span');
                var text = span ? span.textContent.trim() : link.textContent.trim();
                if (text && textToIdMap[text]) {
                    navItem.id = textToIdMap[text];
                    idsAsignados++;
                    console.log('[fix-sidebar] ✅ ID asignado [' + i + ']: "' + text + '" -> ' + textToIdMap[text]);
                }
            }
        }
    }
    console.log('[fix-sidebar] ✅', idsAsignados, 'IDs asignados');
    
    // 2. Obtener permisos
    var permisos = [];
    if (window.erpAuth && window.erpAuth.currentUser && window.erpAuth.currentUser.permisos) {
        permisos = window.erpAuth.currentUser.permisos.ver || [];
    } else {
        try {
            var userStr = localStorage.getItem('erpCurrentUser');
            if (userStr) {
                var user = JSON.parse(userStr);
                permisos = (user.permisos && user.permisos.ver) ? user.permisos.ver : [];
            }
        } catch (e) {
            console.error('[fix-sidebar] ❌ Error leyendo permisos:', e);
        }
    }
    
    console.log('[fix-sidebar] 📋 Permisos del usuario:', permisos);
    
    // 3. Aplicar permisos
    var moduleMap = {
        'Logística': 'nav-logistica',
        'Facturación': 'nav-facturacion',
        'Tráfico': 'nav-trafico',
        'Operadores': 'nav-operadores',
        'Diesel': 'nav-diesel',
        'Mantenimiento': 'nav-mantenimiento',
        'Tesoreria': 'nav-tesoreria',
        'Cuentas x Cobrar': 'nav-cxc',
        'Cuentas x Pagar': 'nav-cxp',
        'Inventario': 'nav-inventario',
        'Configuración': 'nav-configuracion',
        'Reportes': 'nav-reportes'
    };
    
    var hasAllPermissions = permisos.indexOf('*') !== -1 || permisos.indexOf('all') !== -1;
    var mostrados = 0;
    var ocultos = 0;
    
    for (var moduleName in moduleMap) {
        if (moduleMap.hasOwnProperty(moduleName)) {
            var navId = moduleMap[moduleName];
            var navElement = document.getElementById(navId);
            if (navElement) {
                var hasPermission = hasAllPermissions || permisos.indexOf(moduleName) !== -1;
                
                if (hasPermission) {
                    navElement.classList.add('permission-granted');
                    navElement.style.setProperty('display', 'list-item', 'important');
                    navElement.style.setProperty('visibility', 'visible', 'important');
                    navElement.style.setProperty('opacity', '1', 'important');
                    navElement.style.setProperty('height', 'auto', 'important');
                    navElement.style.setProperty('overflow', 'visible', 'important');
                    navElement.classList.remove('d-none');
                    mostrados++;
                    console.log('[fix-sidebar] ✅ Mostrando: ' + moduleName + ' (' + navId + ')');
                } else {
                    navElement.classList.remove('permission-granted');
                    navElement.style.setProperty('display', 'none', 'important');
                    navElement.style.setProperty('visibility', 'hidden', 'important');
                    navElement.style.setProperty('opacity', '0', 'important');
                    navElement.style.setProperty('height', '0', 'important');
                    navElement.style.setProperty('overflow', 'hidden', 'important');
                    ocultos++;
                    console.log('[fix-sidebar] ❌ Ocultando: ' + moduleName + ' (' + navId + ') - sin permisos');
                }
            } else {
                console.warn('[fix-sidebar] ⚠️ Elemento no encontrado: ' + navId + ' (' + moduleName + ')');
            }
        }
    }
    
    console.log('[fix-sidebar] ✅ Reparación completada: ' + mostrados + ' mostrados, ' + ocultos + ' ocultos');
    
    // Verificar resultado
    setTimeout(function() {
        var navItems = document.querySelectorAll('.nav-item');
        console.log('\n=== ESTADO FINAL ===');
        for (var i = 0; i < navItems.length; i++) {
            var item = navItems[i];
            var text = item.querySelector('span') ? item.querySelector('span').textContent : item.textContent;
            var style = window.getComputedStyle(item);
            console.log((item.id || 'SIN ID') + ': ' + text + ' - display: ' + style.display);
        }
    }, 200);
})();

