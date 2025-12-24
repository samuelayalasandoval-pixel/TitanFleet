/**
 * Cargador de Scripts Comunes
 * Carga los scripts esenciales que todas las páginas necesitan
 * Reduce duplicación de código HTML
 */

(function () {
  'use strict';

  const COMMON_SCRIPTS = [
    {
      src: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js',
      defer: true
    },
    {
      src: '../assets/scripts/error-handler.js',
      defer: true
    },
    {
      src: '../assets/scripts/error-utils.js',
      defer: true
    },
    {
      src: '../assets/scripts/auth.js',
      defer: true
    },
    {
      src: '../assets/scripts/data-persistence.js',
      defer: true
    },
    {
      src: '../assets/scripts/firebase-repo-base.js',
      defer: true
    },
    {
      src: '../assets/scripts/firebase-repos.js',
      defer: true
    },
    {
      src: '../assets/scripts/main.js',
      defer: true
    }
  ];

  /**
   * Carga los scripts comunes
   */
  function loadCommonScripts() {
    COMMON_SCRIPTS.forEach(script => {
      // Verificar si el script ya está cargado para evitar duplicados
      const scriptSrc = script.src;
      const isAlreadyLoaded = Array.from(document.querySelectorAll('script[src]')).some(
        existingScript => existingScript.src.includes(scriptSrc.split('/').pop())
      );

      // Verificación específica para firebase-repo-base.js
      if (scriptSrc.includes('firebase-repo-base.js') && window.FirebaseRepoBase) {
        console.log('⏭️ firebase-repo-base.js ya está cargado, omitiendo carga duplicada');
        return;
      }

      if (isAlreadyLoaded) {
        console.log(
          `⏭️ Script ${scriptSrc.split('/').pop()} ya está cargado, omitiendo carga duplicada`
        );
        return;
      }

      const scriptElement = document.createElement('script');
      scriptElement.src = script.src;
      if (script.defer) {
        scriptElement.defer = true;
      }
      if (script.async) {
        scriptElement.async = true;
      }
      document.head.appendChild(scriptElement);
    });
  }

  // Cargar scripts comunes cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCommonScripts);
  } else {
    loadCommonScripts();
  }
})();
