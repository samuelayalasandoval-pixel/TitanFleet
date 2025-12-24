/**
 * Gestión del Estado del Sidebar - trafico.html
 * Restaura el estado del sidebar ANTES de renderizar para evitar parpadeo
 * Este script debe ejecutarse lo más temprano posible (en el <head>)
 */

(function () {
  'use strict';

  // ===========================================
  // APLICAR ESTILO CRÍTICO INMEDIATAMENTE
  // ===========================================
  // Esta sección se ejecuta primero para aplicar estilos antes de cualquier renderizado
  try {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
      // Aplicar estilo crítico inmediatamente (antes de cualquier otra lógica)
      // Usar el valor correcto de --sidebar-collapsed-width (70px) para consistencia con otras páginas
      if (!document.getElementById('sidebar-critical-inline-state')) {
        const style = document.createElement('style');
        style.id = 'sidebar-critical-inline-state';
        style.textContent =
          '#sidebar { width: 70px !important; } #sidebar .logo-text { display: none !important; } #sidebar .nav-link span { display: none !important; } #mainContent { margin-left: 70px !important; }';
        (document.head || document.documentElement).appendChild(style);
      }
    }
  } catch (e) {
    // Silenciar errores si localStorage no está disponible
  }

  // ===========================================
  // RESTAURAR ESTADO COMPLETO DEL SIDEBAR
  // ===========================================
  // Leer estado del sidebar inmediatamente (antes de que se renderice cualquier cosa)
  try {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
      // Verificar si ya existe un estilo crítico
      const existingCriticalStyle = document.getElementById('sidebar-critical-inline-state');

      // Agregar estilo inline al head para ocultar el sidebar desde el principio (si no existe)
      // Usar el valor correcto de --sidebar-collapsed-width (70px) para consistencia con otras páginas
      if (!document.getElementById('sidebar-initial-state-style') && !existingCriticalStyle) {
        const style = document.createElement('style');
        style.id = 'sidebar-initial-state-style';
        style.textContent = `
                    #sidebar { width: 70px !important; }
                    #sidebar .logo-text { display: none !important; }
                    #sidebar .nav-link span { display: none !important; }
                    #mainContent { margin-left: 70px !important; }
                `;
        document.head.appendChild(style);
      }

      // Aplicar estilo inline directamente al documentElement
      document.documentElement.style.setProperty('--sidebar-initial-state', 'collapsed');

      // Función para aplicar clases inmediatamente cuando el DOM esté disponible
      function applySidebarState() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        if (sidebar && mainContent) {
          // Aplicar clases de forma síncrona e inmediata
          sidebar.classList.add('collapsed');
          mainContent.classList.add('sidebar-collapsed');

          // NO remover el estilo crítico - mantenerlo para evitar parpadeo
          // El estilo crítico se mantendrá hasta que el CSS normal tome el control
          console.log('✅ Estado del sidebar aplicado (colapsado)');
          return true;
        }
        return false;
      }

      // Intentar aplicar inmediatamente si el DOM ya está disponible
      if (document.body) {
        // Aplicar de forma síncrona primero
        applySidebarState();
        // Luego usar requestAnimationFrame como respaldo
        requestAnimationFrame(() => {
          applySidebarState();
        });
      } else {
        // Si el body aún no existe, usar MutationObserver para detectar cuando se crea
        const observer = new MutationObserver(_mutations => {
          const sidebar = document.getElementById('sidebar');
          const mainContent = document.getElementById('mainContent');
          if (sidebar && mainContent) {
            // Aplicar de forma síncrona
            applySidebarState();
            // Luego usar requestAnimationFrame como respaldo
            requestAnimationFrame(() => {
              applySidebarState();
            });
            observer.disconnect();
          }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });

        // También intentar en DOMContentLoaded como fallback
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            // Aplicar de forma síncrona
            applySidebarState();
            // Luego usar requestAnimationFrame como respaldo
            requestAnimationFrame(() => {
              applySidebarState();
            });
          });
        }
      }
    }
  } catch (e) {
    // Silenciar errores si localStorage no está disponible
    console.warn('Error restaurando estado del sidebar:', e);
  }
})();
