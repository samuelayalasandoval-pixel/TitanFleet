// Sistema de carga bajo demanda (LAZY LOADING)
// Detectar la ruta base automáticamente basándose en la ubicación de la página
(function () {
  let basePath = 'assets/scripts/'; // Por defecto desde raíz
  try {
    const { pathname } = window.location;
    // Si estamos en pages/, necesitamos subir un nivel
    if (pathname.includes('/pages/')) {
      basePath = '../assets/scripts/';
    } else {
      basePath = 'assets/scripts/';
    }
  } catch (e) {
    // Si falla, usar la ruta por defecto
    console.warn('No se pudo determinar la ruta base, usando ruta por defecto');
    basePath = '../assets/scripts/'; // Asumir que estamos en pages/
  }

  window.MODULES_CONFIG = {
    print: {
      scripts: [`${basePath}print-pdf.js`],
      loaded: false
    },
    config: {
      scripts: [`${basePath}configuracion.js`],
      loaded: false
    },
    connection: {
      scripts: [`${basePath}connection-monitor.js`],
      loaded: false
    },
    periodo: {
      scripts: [`${basePath}periodo.js`],
      loaded: false
    },
    firebaseForce: {
      scripts: [`${basePath}firebase-force.js`],
      loaded: false
    }
  };
})();

const { MODULES_CONFIG } = window;

window.loadModule = function (moduleName) {
  if (!window.ScriptLoader) {
    console.error('❌ ScriptLoader no está disponible');
    return Promise.reject(new Error('ScriptLoader no disponible'));
  }
  const module = MODULES_CONFIG[moduleName];
  if (!module) {
    console.error(`❌ Módulo desconocido: ${moduleName}`);
    return Promise.reject(new Error(`Módulo desconocido: ${moduleName}`));
  }
  if (module.loaded) {
    return Promise.resolve();
  }
  console.log(`📦 Cargando módulo: ${moduleName}`);
  return window.ScriptLoader.loadMultiple(module.scripts)
    .then(() => {
      module.loaded = true;
      console.log(`✅ Módulo cargado: ${moduleName}`);
      window.dispatchEvent(new CustomEvent('moduleLoaded', { detail: { module: moduleName } }));
    })
    .catch(error => {
      console.error(`❌ Error cargando módulo ${moduleName}:`, error);
      throw error;
    });
};

window.loadModules = function (moduleNames) {
  // Validar que moduleNames sea un array válido
  if (!moduleNames || !Array.isArray(moduleNames)) {
    console.warn('⚠️ loadModules: moduleNames no es un array válido:', moduleNames);
    return Promise.resolve([]);
  }
  return Promise.all(moduleNames.map(name => window.loadModule(name)));
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    window
      .loadModule('connection')
      .catch(err => console.warn('No se pudo cargar módulo connection:', err));
  }, 1000);
});
