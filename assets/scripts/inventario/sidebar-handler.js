/**
 * Sidebar Handler para Inventario
 * Maneja la funcionalidad del botón de hamburguesa y el estado del sidebar
 * Mantiene las buenas prácticas separando la lógica del HTML
 */

(function () {
  'use strict';

  // Verificar que estamos en la página de inventario
  const isInventarioPage = window.location.pathname.includes('inventario.html');
  if (!isInventarioPage) {
    return; // No ejecutar si no estamos en inventario
  }

  /**
   * Inicializa el handler del sidebar
   */
  function initSidebarHandler() {
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const closeSidebarBtn = document.getElementById('closeSidebar');

    if (!toggleBtn || !sidebar || !mainContent) {
      console.warn('⚠️ Elementos del sidebar no encontrados, reintentando...');
      // Reintentar después de un delay si los elementos no están disponibles
      setTimeout(initSidebarHandler, 200);
      return;
    }

    // Estado del sidebar desde localStorage
    let isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

    /**
     * Función para alternar el sidebar
     */
    function toggleSidebar() {
      isSidebarCollapsed = !isSidebarCollapsed;

      if (isSidebarCollapsed) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('sidebar-collapsed');
      } else {
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('sidebar-collapsed');
      }

      // Guardar estado en localStorage
      localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
    }

    /**
     * Función para cerrar el sidebar en móviles
     */
    function closeSidebar() {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('show');
      }
    }

    // Remover listeners anteriores si existen (evitar duplicados)
    const newToggleBtn = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);

    // Agregar event listener al botón de hamburguesa
    newToggleBtn.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        // En móviles, mostrar/ocultar el sidebar
        sidebar.classList.toggle('show');
      } else {
        // En desktop, colapsar/expandir el sidebar
        toggleSidebar();
      }
    });

    // Agregar event listener al botón de cerrar (si existe)
    if (closeSidebarBtn) {
      closeSidebarBtn.addEventListener('click', closeSidebar);
    }

    // Aplicar estado inicial del sidebar
    if (isSidebarCollapsed) {
      sidebar.classList.add('collapsed');
      mainContent.classList.add('sidebar-collapsed');
    }

    console.log('✅ Sidebar handler inicializado para inventario');
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarHandler);
  } else {
    initSidebarHandler();
  }

  // También intentar después de un delay como fallback
  setTimeout(initSidebarHandler, 500);
})();
