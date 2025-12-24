/**
 * Cargador de Módulos - menu.html
 * Carga y renderiza los módulos disponibles según permisos
 */

(function () {
  'use strict';

  /**
   * Función para cargar los módulos permitidos
   */
  window.loadModules = function () {
    console.log('🚀 Iniciando carga de módulos...');

    // Actualizar permisos del usuario demo si es necesario
    if (typeof window.actualizarPermisosDemo === 'function') {
      window.actualizarPermisosDemo();
    }

    const grid = document.getElementById('modulesGrid');
    if (!grid) {
      console.error('❌ No se encontró el elemento modulesGrid');
      return;
    }

    grid.innerHTML = '';

    // Obtener nombre del usuario para el mensaje de bienvenida
    try {
      const userStr = localStorage.getItem('erpCurrentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('👤 Usuario encontrado:', user);
        if (user && user.nombre) {
          const subtitle = document.getElementById('welcomeSubtitle');
          if (subtitle) {
            subtitle.textContent = `Bienvenido, ${user.nombre}. Selecciona un módulo para comenzar`;
          }
        }
      } else {
        console.log('⚠️ No se encontró usuario en localStorage');
      }
    } catch (error) {
      console.error('❌ Error obteniendo nombre de usuario:', error);
    }

    if (!window.MODULOS_DISPONIBLES) {
      console.error('❌ MODULOS_DISPONIBLES no está definido');
      return;
    }

    console.log('📋 Total de módulos disponibles:', window.MODULOS_DISPONIBLES.length);

    // Filtrar módulos según permisos
    const modulosPermitidos = window.MODULOS_DISPONIBLES.filter(modulo => {
      const tieneAcceso =
        typeof window.canAccessModule === 'function'
          ? window.canAccessModule(modulo.nombre)
          : false;
      console.log(
        `  ${tieneAcceso ? '✅' : '❌'} ${modulo.nombre}: ${tieneAcceso ? 'PERMITIDO' : 'DENEGADO'}`
      );
      return tieneAcceso;
    });

    console.log('✅ Módulos permitidos:', modulosPermitidos.length);

    if (modulosPermitidos.length === 0) {
      console.warn('⚠️ No hay módulos permitidos, mostrando mensaje');
      grid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning text-center">
                        <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                        <h4>No tienes acceso a ningún módulo</h4>
                        <p>Por favor, contacta al administrador para obtener permisos.</p>
                    </div>
                </div>
            `;
      return;
    }

    // Renderizar módulos permitidos
    modulosPermitidos.forEach((modulo, index) => {
      console.log(`  📦 Renderizando módulo ${index + 1}: ${modulo.nombre}`);
      const col = document.createElement('div');
      col.className = 'col-lg-3 col-md-4 col-sm-6';

      col.innerHTML = `
                <a href="${modulo.url}" class="module-card">
                    <div class="module-icon">
                        <i class="${modulo.icono}"></i>
                    </div>
                    <h3 class="module-title">${modulo.nombre}</h3>
                    <p class="module-description">${modulo.descripcion}</p>
                </a>
            `;

      grid.appendChild(col);
    });

    console.log('✅ Módulos renderizados correctamente');
  };

  /**
   * Función para aplicar permisos en el sidebar
   */
  window.applySidebarPermissions = function () {
    if (typeof window.applyNavigationPermissions === 'function') {
      window.applyNavigationPermissions();
    } else {
      // Fallback: aplicar permisos manualmente
      if (!window.MODULOS_DISPONIBLES) {
        return;
      }

      window.MODULOS_DISPONIBLES.forEach(modulo => {
        const navElement = document.getElementById(modulo.idNav);
        if (navElement) {
          const tieneAcceso =
            typeof window.canAccessModule === 'function'
              ? window.canAccessModule(modulo.nombre)
              : false;

          if (tieneAcceso) {
            navElement.style.display = '';
          } else {
            navElement.style.display = 'none';
          }
        }
      });
    }
  };
})();
