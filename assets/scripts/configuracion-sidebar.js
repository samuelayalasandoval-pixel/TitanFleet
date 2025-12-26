// Script crítico: Restaurar estado del sidebar ANTES de renderizar para evitar parpadeo
(function () {
  'use strict';

      // Función para aplicar clases inmediatamente cuando el DOM esté disponible
      function applySidebarState() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        if (sidebar && mainContent) {
          sidebar.classList.add('collapsed');
          mainContent.classList.add('sidebar-collapsed');
          return true;
        }
        return false;
      }

  // Leer estado del sidebar inmediatamente
  try {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
      // Aplicar estilo inline directamente al body para que se ejecute antes del render
      document.documentElement.style.setProperty('--sidebar-initial-state', 'collapsed');

      // Intentar aplicar inmediatamente si el DOM ya está disponible
      if (document.body) {
        applySidebarState();
      } else {
        // Si el body aún no existe, usar MutationObserver para detectar cuando se crea
        const observer = new MutationObserver(_mutations => {
          if (document.getElementById('sidebar') && document.getElementById('mainContent')) {
            applySidebarState();
            observer.disconnect();
          }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });

        // También intentar en DOMContentLoaded como fallback
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            setTimeout(applySidebarState, 0);
          });
        }
      }
    }
  } catch (e) {
    // Silenciar errores si localStorage no está disponible
  }
})();
