/**
 * Índice de Componentes Reutilizables
 * Carga todos los componentes del sistema
 *
 * @example
 * <!-- En el HTML, incluir antes de usar los componentes -->
 * <script src="../assets/scripts/components/index.js"></script>
 */

// Cargar componentes en orden de dependencias
(function () {
  'use strict';

  const componentsPath = '../assets/scripts/components/';
  const scripts = [
    'utils.js', // Utilidades (sin dependencias)
    'Modal.js', // Modal (usa Bootstrap)
    'Form.js', // Formulario (usa Bootstrap)
    'Table.js', // Tabla (usa Bootstrap)
    'KPICard.js', // KPI Cards
    'FilterManager.js', // Gestor de filtros
    'ExportButton.js' // Botón de exportación
  ];

  // Función para cargar scripts secuencialmente
  function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    script.onerror = () => {
      console.error(`❌ Error al cargar: ${src}`);
      callback();
    };
    document.head.appendChild(script);
  }

  // Cargar todos los scripts
  let currentIndex = 0;
  function loadNext() {
    if (currentIndex < scripts.length) {
      loadScript(componentsPath + scripts[currentIndex], () => {
        currentIndex++;
        loadNext();
      });
    } else {
      console.log('✅ Todos los componentes cargados correctamente');
      // Disparar evento personalizado cuando todos los componentes estén cargados
      window.dispatchEvent(new CustomEvent('erpComponentsLoaded'));
    }
  }

  // Iniciar carga cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNext);
  } else {
    loadNext();
  }
})();
