/**
 * Manejo del Sidebar - menu.html
 * Controla el toggle, apertura/cierre y estado del sidebar
 */

(function () {
  'use strict';

  /**
   * Configurar el sidebar y sus eventos
   */
  function setupSidebar() {
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');

    if (!sidebar) {
      console.error('❌ Sidebar no encontrado');
      return;
    }

    let isSidebarCollapsed = false;

    // Función para alternar el sidebar
    function toggleSidebar() {
      isSidebarCollapsed = !isSidebarCollapsed;

      if (isSidebarCollapsed) {
        sidebar.classList.add('collapsed');
        if (mainContent) {
          mainContent.classList.add('sidebar-collapsed');
        }
      } else {
        sidebar.classList.remove('collapsed');
        if (mainContent) {
          mainContent.classList.remove('sidebar-collapsed');
        }
      }

      // Guardar estado en localStorage
      localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
    }

    // Función para mostrar sidebar en móviles
    function showMobileSidebar() {
      sidebar.classList.add('show');
    }

    // Función para cerrar el sidebar
    function closeSidebar() {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('show');
      } else {
        isSidebarCollapsed = true;
        sidebar.classList.add('collapsed');
        if (mainContent) {
          mainContent.classList.add('sidebar-collapsed');
        }
        localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
      }
    }

    // Event listeners
    if (toggleSidebarBtn) {
      toggleSidebarBtn.addEventListener('click', () => {
        console.log('🔄 Botón hamburguesa clickeado');
        if (window.innerWidth <= 768) {
          console.log('📱 Modo móvil - mostrando sidebar');
          showMobileSidebar();
        } else {
          console.log('🖥️ Modo desktop - alternando sidebar');
          toggleSidebar();
        }
      });
    } else {
      console.error('❌ Botón toggleSidebar no encontrado');
    }

    if (closeSidebarBtn) {
      closeSidebarBtn.addEventListener('click', closeSidebar);
    }

    // Restaurar estado del sidebar desde localStorage
    // Solo aplicar si el estado no está ya aplicado (para evitar parpadeo)
    const savedState = localStorage.getItem('sidebarCollapsed');
    const isAlreadyCollapsed = sidebar.classList.contains('collapsed');

    // Sincronizar variable interna con el estado actual del DOM
    if (isAlreadyCollapsed) {
      isSidebarCollapsed = true;
    }

    if (savedState === 'true' && !isAlreadyCollapsed) {
      // El estado guardado dice colapsado pero el DOM no lo está
      // Aplicar el estado guardado
      isSidebarCollapsed = true;
      sidebar.classList.add('collapsed');
      if (mainContent) {
        mainContent.classList.add('sidebar-collapsed');
      }
      console.log('✅ Estado del sidebar restaurado desde localStorage (colapsado)');
    } else if (savedState === 'true' && isAlreadyCollapsed) {
      // El estado ya está aplicado correctamente, solo sincronizar la variable
      isSidebarCollapsed = true;
      if (mainContent && !mainContent.classList.contains('sidebar-collapsed')) {
        mainContent.classList.add('sidebar-collapsed');
      }
      console.log('✅ Estado del sidebar ya estaba aplicado (colapsado)');
    } else if (savedState !== 'true' && isAlreadyCollapsed) {
      // El estado guardado dice que no está colapsado, pero el DOM dice que sí
      // Esto puede pasar si el usuario cambió el estado manualmente
      // Respetar el estado del DOM y actualizar localStorage
      isSidebarCollapsed = false;
      sidebar.classList.remove('collapsed');
      if (mainContent) {
        mainContent.classList.remove('sidebar-collapsed');
      }
      localStorage.setItem('sidebarCollapsed', 'false');
      console.log('✅ Estado del sidebar sincronizado con DOM (expandido)');
    } else if (savedState !== 'true' && !isAlreadyCollapsed) {
      // Todo está sincronizado correctamente (expandido)
      isSidebarCollapsed = false;
      console.log('✅ Estado del sidebar sincronizado (expandido)');
    }

    // Cerrar sidebar al hacer clic fuera (solo en móviles)
    document.addEventListener('click', e => {
      if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('show')) {
        if (
          !sidebar.contains(e.target) &&
          toggleSidebarBtn &&
          !toggleSidebarBtn.contains(e.target)
        ) {
          sidebar.classList.remove('show');
        }
      }
    });
  }

  /**
   * Configurar nombre de usuario en el header
   */
  function setupUserName() {
    // NO actualizar aquí - main.js ya lo maneja con updateUserInfo()
    // Esta función se mantiene por compatibilidad pero no actualiza el nombre
    if (window.__userInfoUpdated) {
      console.log('✅ Información de usuario ya fue actualizada por main.js');
    } else {
      console.log('ℹ️ Esperando actualización de nombre de usuario desde main.js...');
    }
  }

  /**
   * Inicializar todo cuando el DOM esté listo
   */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM cargado, inicializando menú...');

        // Esperar un poco para asegurar que auth.js y firebase-init.js se hayan cargado
        setTimeout(() => {
          // Cargar módulos
          if (typeof window.loadModules === 'function') {
            console.log('🔄 Cargando módulos...');
            window.loadModules();
          }

          // Aplicar permisos en sidebar
          if (typeof window.applySidebarPermissions === 'function') {
            window.applySidebarPermissions();
          }

          // Configurar nombre de usuario
          setupUserName();

          // Configurar sidebar
          setupSidebar();
        }, 500); // Esperar 500ms para que auth.js se cargue
      });
    } else {
      // DOM ya está listo
      setTimeout(() => {
        if (typeof window.loadModules === 'function') {
          window.loadModules();
        }
        if (typeof window.applySidebarPermissions === 'function') {
          window.applySidebarPermissions();
        }
        setupUserName();
        setupSidebar();
      }, 500);
    }
  }

  init();
})();
