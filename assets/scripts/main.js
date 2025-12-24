// ===== RESTAURACIÓN INMEDIATA DEL ESTADO DEL SIDEBAR =====
// Este código se ejecuta inmediatamente para evitar parpadeo al cambiar de página
(function () {
  'use strict';
  // Función para restaurar el estado del sidebar inmediatamente
  function restoreSidebarStateImmediate() {
    try {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState === 'true') {
        // Usar requestAnimationFrame para aplicar el estado antes del primer render
        requestAnimationFrame(() => {
          const sidebar = document.getElementById('sidebar');
          const mainContent = document.getElementById('mainContent');
          if (sidebar && mainContent) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('sidebar-collapsed');
          }
        });
      }
    } catch (e) {
      // Silenciar errores si localStorage no está disponible
    }
  }

  // Intentar restaurar inmediatamente si el DOM ya está listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreSidebarStateImmediate);
  } else {
    // DOM ya está listo, restaurar inmediatamente
    restoreSidebarStateImmediate();
  }

  // También intentar restaurar en el siguiente frame por si acaso
  if (window.requestAnimationFrame) {
    requestAnimationFrame(restoreSidebarStateImmediate);
  } else {
    setTimeout(restoreSidebarStateImmediate, 0);
  }
})();

// ===== SISTEMA CENTRALIZADO DE GESTIÓN DE ESTADO =====
// Gestor centralizado para todas las variables de estado de la aplicación
window.ERPState = (function () {
  'use strict';

  // Estado privado
  const state = {
    // Cachés de datos
    cache: {
      operadores: null,
      economicos: null,
      economicosAlt: null, // __economicosCache
      tractocamiones: null
    },

    // Estados de carga
    loading: {
      operadores: false,
      tractocamiones: false,
      intentandoCargarOperadores: false
    },

    // Estados de UI
    ui: {
      highlightedIndex: {},
      plataformaTransferir: null
    },

    // Paginación
    pagination: {
      plataformasDescarga: null
    },

    // Datos temporales
    temp: {
      plataformasDescargaCompletas: null,
      plataformasDescargaCompletasSinFiltrar: null
    },

    // Observers e intervals
    observers: {
      contador: null,
      contadorInterval: null
    },

    // Flags del sistema
    flags: {
      firebaseReposReady: null,
      valorContadorFijo: null,
      proteccionContadorActiva: false
    },

    // Suscripciones
    subscriptions: {
      operadoresIncidencias: null,
      economicos: null
    }
  };

  // API pública
  return {
    // ===== CACHÉS =====
    getCache: function (key) {
      return state.cache[key] || null;
    },

    setCache: function (key, value) {
      if (state.cache.hasOwnProperty(key)) {
        state.cache[key] = value;
        return true;
      }
      console.warn(`⚠️ Clave de caché desconocida: ${key}`);
      return false;
    },

    clearCache: function (key) {
      if (key) {
        if (state.cache.hasOwnProperty(key)) {
          state.cache[key] = null;
          return true;
        }
      } else {
        // Limpiar todos los cachés
        Object.keys(state.cache).forEach(k => (state.cache[k] = null));
        return true;
      }
      return false;
    },

    // ===== ESTADOS DE CARGA =====
    isLoading: function (key) {
      return state.loading[key] || false;
    },

    setLoading: function (key, value) {
      // Permitir cualquier clave de loading sin warnings
      // Esto es necesario para SearchableSelect que usa claves dinámicas como "loading_operadores_operadores"
      state.loading[key] = value;
      return true;
    },

    // ===== UI STATE =====
    getHighlightedIndex: function (field) {
      if (!state.ui.highlightedIndex) {
        state.ui.highlightedIndex = {};
      }
      return field ? state.ui.highlightedIndex[field] || -1 : state.ui.highlightedIndex;
    },

    setHighlightedIndex: function (field, value) {
      if (!state.ui.highlightedIndex) {
        state.ui.highlightedIndex = {};
      }
      state.ui.highlightedIndex[field] = value;
    },

    getPlataformaTransferir: function () {
      return state.ui.plataformaTransferir;
    },

    setPlataformaTransferir: function (value) {
      state.ui.plataformaTransferir = value;
    },

    clearPlataformaTransferir: function () {
      state.ui.plataformaTransferir = null;
    },

    // ===== PAGINACIÓN =====
    getPagination: function (key) {
      return state.pagination[key] || null;
    },

    setPagination: function (key, value) {
      state.pagination[key] = value;
    },

    // ===== DATOS TEMPORALES =====
    getTemp: function (key) {
      return state.temp[key] || null;
    },

    setTemp: function (key, value) {
      state.temp[key] = value;
    },

    // ===== OBSERVERS =====
    getObserver: function (key) {
      return state.observers[key] || null;
    },

    setObserver: function (key, value) {
      state.observers[key] = value;
    },

    clearObserver: function (key) {
      if (state.observers[key]) {
        if (typeof state.observers[key].disconnect === 'function') {
          state.observers[key].disconnect();
        }
        state.observers[key] = null;
      }
    },

    // ===== FLAGS =====
    getFlag: function (key) {
      return state.flags[key] || null;
    },

    setFlag: function (key, value) {
      state.flags[key] = value;
    },

    // ===== SUSCRIPCIONES =====
    getSubscription: function (key) {
      return state.subscriptions[key] || null;
    },

    setSubscription: function (key, value) {
      // Limpiar suscripción anterior si existe
      if (state.subscriptions[key] && typeof state.subscriptions[key] === 'function') {
        state.subscriptions[key]();
      }
      state.subscriptions[key] = value;
    },

    clearSubscription: function (key) {
      if (state.subscriptions[key] && typeof state.subscriptions[key] === 'function') {
        state.subscriptions[key]();
      }
      state.subscriptions[key] = null;
    },

    // ===== MÉTODOS DE UTILIDAD =====
    // Limpiar todo el estado (útil para resetear)
    clearAll: function () {
      // Limpiar cachés
      Object.keys(state.cache).forEach(k => (state.cache[k] = null));

      // Limpiar estados de carga
      Object.keys(state.loading).forEach(k => (state.loading[k] = false));

      // Limpiar UI
      state.ui.highlightedIndex = {};
      state.ui.plataformaTransferir = null;

      // Limpiar paginación
      Object.keys(state.pagination).forEach(k => (state.pagination[k] = null));

      // Limpiar datos temporales
      Object.keys(state.temp).forEach(k => (state.temp[k] = null));

      // Limpiar observers
      Object.keys(state.observers).forEach(k => {
        if (state.observers[k]) {
          if (typeof state.observers[k].disconnect === 'function') {
            state.observers[k].disconnect();
          } else if (typeof state.observers[k] === 'function') {
            clearInterval(state.observers[k]);
          }
          state.observers[k] = null;
        }
      });

      // Limpiar suscripciones
      Object.keys(state.subscriptions).forEach(k => {
        if (state.subscriptions[k] && typeof state.subscriptions[k] === 'function') {
          state.subscriptions[k]();
        }
        state.subscriptions[k] = null;
      });

      console.log('🧹 Estado de la aplicación limpiado');
    },

    // Obtener snapshot del estado (útil para debugging)
    getSnapshot: function () {
      return JSON.parse(JSON.stringify(state));
    }
  };
})();

// ===== FUNCIÓN BASE PARA EXPORTAR A EXCEL =====
// Función reutilizable para exportar datos a Excel/CSV
window.exportarDatosExcel = async function (options) {
  const {
    datos, // Array de objetos con los datos a exportar (o array de {datos, nombreHoja} para múltiples hojas)
    nombreArchivo, // Nombre del archivo (sin extensión)
    nombreHoja, // Nombre de la hoja en Excel (opcional, default: 'Datos') - ignorado si datos es array de hojas
    mensajeVacio, // Mensaje si no hay datos (opcional)
    onError, // Callback de error (opcional)
    hojas // Array de {datos, nombreHoja} para múltiples hojas (opcional, tiene prioridad sobre datos)
  } = options;

  try {
    // Determinar si es múltiples hojas o una sola hoja
    const esMultiplesHojas = hojas && Array.isArray(hojas) && hojas.length > 0;

    if (esMultiplesHojas) {
      // Validar múltiples hojas
      if (hojas.length === 0) {
        const mensaje = mensajeVacio || 'No hay hojas para exportar.';
        alert(mensaje);
        return;
      }

      // Validar que al menos una hoja tenga datos
      const hojasConDatos = hojas.filter(
        hoja => hoja.datos && Array.isArray(hoja.datos) && hoja.datos.length > 0
      );
      if (hojasConDatos.length === 0) {
        const mensaje = mensajeVacio || 'No hay datos en ninguna hoja para exportar.';
        alert(mensaje);
        return;
      }

      // Advertir sobre hojas vacías
      hojas.forEach((hoja, index) => {
        if (!hoja.datos || !Array.isArray(hoja.datos) || hoja.datos.length === 0) {
          console.warn(`⚠️ Hoja ${index + 1} (${hoja.nombreHoja || 'Sin nombre'}) está vacía`);
        }
      });
    } else {
      // Validar que hay datos (una sola hoja)
      if (!datos || !Array.isArray(datos) || datos.length === 0) {
        const mensaje = mensajeVacio || 'No hay datos para exportar.';
        alert(mensaje);
        return;
      }

      // Validar que los datos tienen el formato correcto (objetos con propiedades)
      if (typeof datos[0] !== 'object' || Array.isArray(datos[0])) {
        throw new Error('Los datos deben ser un array de objetos');
      }
    }

    // Preparar nombre del archivo
    const fecha = new Date().toISOString().slice(0, 10);
    const filename = `${nombreArchivo}_${fecha}.xlsx`;

    // Función para cargar XLSX
    function ensureXLSX(then) {
      if (window.XLSX) {
        then(null);
        return;
      }

      // Verificar si ya se está cargando
      const existingScript = document.querySelector('script[src*="xlsx"]');
      if (existingScript) {
        // Ya existe, esperar a que termine de cargar
        const checkInterval = setInterval(() => {
          if (window.XLSX) {
            clearInterval(checkInterval);
            then(null);
          }
        }, 100);

        // Timeout de 10 segundos
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.XLSX) {
            then(new Error('Timeout esperando XLSX'));
          }
        }, 10000);
        return;
      }

      // Intentar cargar desde múltiples CDNs como fallback
      // Usar CDN oficial de SheetJS primero, luego alternativas
      const cdnUrls = [
        'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js',
        'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
      ];

      let currentUrlIndex = 0;
      let scriptElement = null;
      let checkInterval = null;

      function cleanup() {
        if (checkInterval) {
          clearInterval(checkInterval);
          checkInterval = null;
        }
        if (scriptElement && scriptElement.parentNode) {
          scriptElement.parentNode.removeChild(scriptElement);
          scriptElement = null;
        }
      }

      function tryLoadFromCDN() {
        if (currentUrlIndex >= cdnUrls.length) {
          cleanup();
          console.error('❌ Todos los CDNs fallaron al cargar XLSX');
          then(new Error('No se pudo cargar SheetJS desde ningún CDN'));
          return;
        }

        // Limpiar intento anterior
        cleanup();

        scriptElement = document.createElement('script');
        scriptElement.src = cdnUrls[currentUrlIndex];
        scriptElement.async = false;
        scriptElement.crossOrigin = 'anonymous';

        // Timeout para este intento
        const timeout = setTimeout(() => {
          if (!window.XLSX) {
            console.warn(`⚠️ Timeout cargando XLSX desde: ${cdnUrls[currentUrlIndex]}`);
            currentUrlIndex++;
            tryLoadFromCDN();
          }
        }, 8000);

        scriptElement.onload = () => {
          clearTimeout(timeout);
          // Esperar un poco más para asegurar que XLSX esté completamente disponible
          setTimeout(() => {
            if (window.XLSX) {
              console.log(`✅ XLSX cargado exitosamente desde: ${cdnUrls[currentUrlIndex]}`);
              cleanup();
              then(null);
            } else {
              console.warn(
                `⚠️ XLSX no disponible después de cargar desde: ${cdnUrls[currentUrlIndex]}`
              );
              clearTimeout(timeout);
              currentUrlIndex++;
              tryLoadFromCDN();
            }
          }, 200);
        };

        scriptElement.onerror = () => {
          clearTimeout(timeout);
          console.warn(`⚠️ Error cargando XLSX desde: ${cdnUrls[currentUrlIndex]}`);
          currentUrlIndex++;
          tryLoadFromCDN();
        };

        document.head.appendChild(scriptElement);
        console.log(`📦 Intentando cargar XLSX desde: ${cdnUrls[currentUrlIndex]}`);
      }

      tryLoadFromCDN();
    }

    // Función para exportar como CSV
    function exportarCSV(rows, filename) {
      if (!rows || !Array.isArray(rows) || rows.length === 0) {
        console.warn('⚠️ No hay datos para exportar como CSV');
        return;
      }

      const headers = Object.keys(rows[0] || {});
      if (headers.length === 0) {
        console.warn('⚠️ No hay columnas para exportar como CSV');
        return;
      }

      const csvContent = [
        headers.join(','),
        ...rows.map(row =>
          headers
            .map(h => {
              const val = row[h] == null ? '' : String(row[h]);
              // Escapar comillas y valores que contengan comas o saltos de línea
              if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                return `"${val.replace(/"/g, '""')}"`;
              }
              return val;
            })
            .join(',')
        )
      ].join('\n');

      const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename.replace('.xlsx', '.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }

    // Intentar exportar a Excel
    ensureXLSX(err => {
      if (err || !window.XLSX) {
        // Fallback a CSV (solo primera hoja si hay múltiples)
        console.warn('⚠️ XLSX no disponible, exportando como CSV');
        if (err) {
          console.warn('   Error:', err.message || err);
        }
        if (esMultiplesHojas && hojas.length > 0) {
          exportarCSV(hojas[0].datos || [], filename);
        } else {
          exportarCSV(datos, filename);
        }
        // Mostrar notificación si está disponible
        if (typeof window.showNotification === 'function') {
          window.showNotification('Datos exportados como CSV (XLSX no disponible)', 'info');
        }
        return;
      }

      try {
        // Crear workbook
        const wb = window.XLSX.utils.book_new();

        if (esMultiplesHojas) {
          // Múltiples hojas
          let hojasAgregadas = 0;
          hojas.forEach((hoja, index) => {
            if (hoja.datos && Array.isArray(hoja.datos)) {
              // Crear hoja incluso si está vacía (con headers)
              let ws;
              if (hoja.datos.length > 0) {
                ws = window.XLSX.utils.json_to_sheet(hoja.datos);
              } else {
                // Crear hoja vacía con headers si los datos están vacíos
                // Intentar obtener headers de la primera hoja con datos
                let { headers } = hoja;
                if (!headers || headers.length === 0) {
                  const primeraHojaConDatos = hojas.find(
                    h => h.datos && Array.isArray(h.datos) && h.datos.length > 0
                  );
                  if (primeraHojaConDatos && primeraHojaConDatos.datos.length > 0) {
                    headers = Object.keys(primeraHojaConDatos.datos[0]);
                  }
                }
                if (headers && headers.length > 0) {
                  ws = window.XLSX.utils.aoa_to_sheet([headers]);
                } else {
                  ws = window.XLSX.utils.aoa_to_sheet([['No hay datos']]);
                }
              }
              const nombreHoja = hoja.nombreHoja || `Hoja${index + 1}`;
              // Limitar el nombre de la hoja a 31 caracteres (límite de Excel)
              const nombreHojaLimitado = nombreHoja.substring(0, 31);
              window.XLSX.utils.book_append_sheet(wb, ws, nombreHojaLimitado);
              hojasAgregadas++;
              console.log(
                `✅ Hoja "${nombreHojaLimitado}" agregada con ${hoja.datos.length} filas`
              );
            }
          });
          console.log(
            `📊 Total de hojas agregadas al workbook: ${hojasAgregadas} de ${hojas.length}`
          );
        } else {
          // Una sola hoja
          const ws = window.XLSX.utils.json_to_sheet(datos);
          window.XLSX.utils.book_append_sheet(wb, ws, nombreHoja || 'Datos');
        }

        window.XLSX.writeFile(wb, filename);

        // Mostrar notificación si está disponible
        if (typeof window.showNotification === 'function') {
          window.showNotification('Datos exportados correctamente a Excel', 'success');
        }
      } catch (e) {
        console.error('Error exportando a Excel:', e);
        // Fallback a CSV en caso de error
        if (esMultiplesHojas && hojas.length > 0) {
          exportarCSV(hojas[0].datos || [], filename);
        } else {
          exportarCSV(datos, filename);
        }
      }
    });
  } catch (error) {
    console.error('Error en exportarDatosExcel:', error);
    if (onError && typeof onError === 'function') {
      onError(error);
    } else {
      alert(`Error al exportar: ${error.message}`);
    }
  }
};

// Funcionalidad del Sidebar
document.addEventListener('DOMContentLoaded', async () => {
  // Solo ejecutar en páginas que no sean la de inicio
  if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
    return;
  }

  // TEMPORALMENTE: No verificar autenticación
  // if (typeof erpAuth === 'undefined' || !erpAuth.isAuthenticated) {
  //     window.location.href = 'index.html';
  //     return;
  // }

  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  const toggleSidebarBtn = document.getElementById('toggleSidebar');
  const closeSidebarBtn = document.getElementById('closeSidebar');

  // IMPORTANTE: Restaurar estado del sidebar INMEDIATAMENTE para evitar parpadeo
  // Esto debe hacerse ANTES de cualquier otra lógica para que el estado se aplique
  // antes de que el usuario pueda ver el cambio
  if (sidebar && mainContent) {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
      // Aplicar clases inmediatamente, sin esperar
      sidebar.classList.add('collapsed');
      mainContent.classList.add('sidebar-collapsed');
      console.log(
        '🔄 Estado del sidebar restaurado inmediatamente desde localStorage - sidebar colapsada'
      );
    }
  }

  // Debug: Verificar elementos encontrados
  console.log('🔍 Elementos de sidebar encontrados:');
  console.log('  - sidebar:', sidebar ? '✅' : '❌');
  console.log('  - mainContent:', mainContent ? '✅' : '❌');
  console.log('  - toggleSidebarBtn:', toggleSidebarBtn ? '✅' : '❌');
  console.log('  - closeSidebarBtn:', closeSidebarBtn ? '✅' : '❌');

  // Debug: Verificar variables CSS
  if (sidebar) {
    const computedStyle = getComputedStyle(sidebar);
    const rootStyle = getComputedStyle(document.documentElement);
    console.log('🎨 Variables CSS de sidebar:');
    console.log(
      '  - --sidebar-width (sidebar):',
      computedStyle.getPropertyValue('--sidebar-width')
    );
    console.log(
      '  - --sidebar-collapsed-width (sidebar):',
      computedStyle.getPropertyValue('--sidebar-collapsed-width')
    );
    console.log('  - --sidebar-width (root):', rootStyle.getPropertyValue('--sidebar-width'));
    console.log(
      '  - --sidebar-collapsed-width (root):',
      rootStyle.getPropertyValue('--sidebar-collapsed-width')
    );
    console.log('  - Width actual:', `${sidebar.offsetWidth}px`);
  }

  // Esperar a que Firebase y repositorios estén listos antes de inicializar numeración
  // Sistema de numeración única para registros
  // SOLO inicializar si no se ha hecho ya y estamos en una página que lo necesita
  const isLogisticaPage = window.location.pathname.includes('logistica.html');
  const isTraficoPage = window.location.pathname.includes('trafico.html');
  const isFacturacionPage = window.location.pathname.includes('facturacion.html');

  if ((isLogisticaPage || isTraficoPage || isFacturacionPage) && !window.__numeroRegistroGenerado) {
    // IMPORTANTE: Para logística, Firebase es la fuente de verdad - esperar a que esté completamente listo
    if (isLogisticaPage) {
      console.log('⏳ Esperando Firebase (fuente de verdad) antes de inicializar numeración...');

      // Esperar a que Firebase esté disponible
      let intentos = 0;
      while (
        (!window.firebaseDb || !window.fs || !window.firebaseAuth?.currentUser) &&
        intentos < 50
      ) {
        await new Promise(resolve => setTimeout(resolve, 100));
        intentos++;
      }

      // También esperar a que los repositorios estén listos
      if (window.__firebaseReposReady) {
        await window.__firebaseReposReady;
      }

      if (!window.firebaseDb || !window.fs || !window.firebaseAuth?.currentUser) {
        console.warn(
          '⚠️ Firebase no está disponible después de esperar. La numeración se inicializará cuando Firebase esté listo.'
        );
        // No inicializar ahora, se hará cuando Firebase esté listo
      } else {
        console.log('✅ Firebase está listo (fuente de verdad), inicializando numeración...');
        if (typeof window.initializeRegistrationSystem === 'function') {
          await window.initializeRegistrationSystem();
        } else {
          console.warn('⚠️ initializeRegistrationSystem no está disponible aún');
        }
      }
    } else {
      // Para tráfico y facturación, usar el número compartido (no generar nuevo)
      if (window.__firebaseReposReady) {
        console.log('⏳ Esperando repositorios antes de inicializar numeración...');
        await window.__firebaseReposReady;
      }

      if (typeof window.initializeRegistrationSystem === 'function') {
        await window.initializeRegistrationSystem();
      } else {
        console.warn('⚠️ initializeRegistrationSystem no está disponible aún');
      }
    }
  }

  // Mostrar información del usuario actual
  updateUserInfo();

  // Estado del sidebar - inicializar desde localStorage
  let isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

  // Función para alternar el sidebar
  function toggleSidebar() {
    console.log('🔄 toggleSidebar ejecutado, estado actual:', isSidebarCollapsed);
    isSidebarCollapsed = !isSidebarCollapsed;

    if (isSidebarCollapsed) {
      console.log('📦 Colapsando sidebar');
      sidebar.classList.add('collapsed');
      mainContent.classList.add('sidebar-collapsed');
      console.log('📏 Sidebar width después de colapsar:', `${sidebar.offsetWidth}px`);
      console.log('📏 Main content margin-left:', getComputedStyle(mainContent).marginLeft);
    } else {
      console.log('📂 Expandiendo sidebar');
      sidebar.classList.remove('collapsed');
      mainContent.classList.remove('sidebar-collapsed');
      console.log('📏 Sidebar width después de expandir:', `${sidebar.offsetWidth}px`);
      console.log('📏 Main content margin-left:', getComputedStyle(mainContent).marginLeft);
    }

    // Guardar estado en localStorage
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
    console.log('💾 Estado guardado:', isSidebarCollapsed);
  }

  // Función para cerrar el sidebar en móviles
  function closeSidebar() {
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('show');
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

  // El estado ya fue restaurado al inicio, solo confirmar aquí
  if (isSidebarCollapsed) {
    console.log('✅ Estado del sidebar confirmado - sidebar colapsada');
    console.log('📏 Sidebar width:', `${sidebar.offsetWidth}px`);
    console.log('📏 Main content margin-left:', getComputedStyle(mainContent).marginLeft);
  }

  // Manejo del embalaje especial
  const embalajeRadios = document.querySelectorAll('input[name="embalaje"]');
  const descripcionEmbalaje = document.getElementById('descripcionEmbalaje');

  embalajeRadios.forEach(radio => {
    radio.addEventListener('change', function () {
      if (this.value === 'si') {
        descripcionEmbalaje.style.display = 'block';
        descripcionEmbalaje.querySelector('textarea').required = true;
      } else {
        descripcionEmbalaje.style.display = 'none';
        descripcionEmbalaje.querySelector('textarea').required = false;
      }
    });
  });

  // Manejo de observaciones
  const observacionesRadios = document.querySelectorAll('input[name="observaciones"]');
  const descripcionObservaciones = document.getElementById('descripcionObservaciones');

  observacionesRadios.forEach(radio => {
    radio.addEventListener('change', function () {
      if (descripcionObservaciones) {
        if (this.value === 'si') {
          // Remover clase que oculta y mostrar el campo
          descripcionObservaciones.classList.remove('descripcion-observaciones-hidden');
          descripcionObservaciones.style.display = 'block';
          const textarea = descripcionObservaciones.querySelector('textarea');
          if (textarea) {
            textarea.required = true;
          }
          console.log('✅ Campo de observaciones mostrado');
        } else {
          // Agregar clase que oculta y ocultar el campo
          descripcionObservaciones.classList.add('descripcion-observaciones-hidden');
          descripcionObservaciones.style.display = 'none';
          const textarea = descripcionObservaciones.querySelector('textarea');
          if (textarea) {
            textarea.required = false;
          }
          console.log('✅ Campo de observaciones ocultado');
        }
      }
    });
  });

  // Manejo de observaciones con nombre diferente (para diesel.html)
  const observacionesRadiosAlt = document.querySelectorAll('input[name="Observaciones"]');
  const descripcionObservacionesAlt = document.getElementById('Observaciones');

  observacionesRadiosAlt.forEach(radio => {
    radio.addEventListener('change', function () {
      if (this.value === 'si') {
        descripcionObservacionesAlt.classList.add('show');
        const textarea = descripcionObservacionesAlt.querySelector('textarea');
        if (textarea) {
          textarea.required = true;
        }
      } else {
        descripcionObservacionesAlt.classList.remove('show');
        const textarea = descripcionObservacionesAlt.querySelector('textarea');
        if (textarea) {
          textarea.required = false;
        }
      }
    });
  });

  // Validación del formulario
  // Buscar formulario específico por ID o clase
  const form =
    document.getElementById('facturacionForm') ||
    document.getElementById('logisticaForm') ||
    document.getElementById('traficoForm') ||
    document.querySelector('.needs-validation');

  console.log('🔍 Formulario encontrado:', form);
  console.log('🔍 ID del formulario:', form?.id);
  console.log('🔍 Clase del formulario:', form?.className);
  console.log('🔍 Página actual:', window.location.pathname);
  console.log('🔍 URL completa:', window.location.href);

  if (form) {
    console.log('✅ Configurando listener de submit en formulario...');
    console.log('✅ Formulario encontrado, agregando listener...');

    // Agregar listener con capture para capturarlo antes que otros
    form.addEventListener('submit', async event => {
      console.log('🚨🚨🚨 EVENTO SUBMIT DETECTADO 🚨🚨🚨');
      console.log('📝 Evento submit detectado en formulario:', form.id);
      console.log('📝 Página actual:', window.location.pathname);
      console.log('📝 URL completa:', window.location.href);
      console.log('📝 Target:', event.target);
      console.log('📝 CurrentTarget:', event.currentTarget);
      console.log('📝 DefaultPrevented antes:', event.defaultPrevented);

      // SIEMPRE prevenir el comportamiento por defecto PRIMERO
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      console.log('✅ Evento prevenido, continuando con el procesamiento...');
      console.log('📝 DefaultPrevented después:', event.defaultPrevented);

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalContent = submitBtn ? submitBtn.innerHTML : '';

      // Verificar si ya se está procesando para evitar doble clic
      if (submitBtn && submitBtn.disabled) {
        console.log('⚠️ El formulario ya se está procesando, ignorando clic adicional');
        return;
      }

      // Mostrar estado de procesamiento
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        submitBtn.disabled = true;
      }

      // Función auxiliar para restaurar el botón en caso de error
      const restaurarBoton = () => {
        if (submitBtn && originalContent) {
          submitBtn.innerHTML = originalContent;
          submitBtn.disabled = false;
        }
      };

      if (form.checkValidity()) {
        console.log('✅ Formulario válido, procesando envío');

        // Verificar si estamos en la página de logística
        const isLogisticaPage =
          window.location.pathname.includes('logistica.html') ||
          document.querySelector('title')?.textContent?.includes('Logística');

        // Verificar si estamos en la página de facturación
        const isFacturacionPage =
          window.location.pathname.includes('facturacion.html') ||
          document.querySelector('title')?.textContent?.includes('Facturación');

        // Verificar si estamos en la página de tráfico
        const isTraficoPage =
          window.location.pathname.includes('trafico.html') ||
          document.querySelector('title')?.textContent?.includes('Tráfico');

        // Guardar datos automáticamente antes de procesar el envío
        const registroId = document.getElementById('numeroRegistro')?.value;

        console.log('🔍 Diagnóstico de guardado:');
        console.log('  - isLogisticaPage:', isLogisticaPage);
        console.log('  - isFacturacionPage:', isFacturacionPage);
        console.log('  - isTraficoPage:', isTraficoPage);
        console.log('  - registroId:', registroId);
        console.log(
          '  - saveLogisticaData disponible:',
          typeof window.saveLogisticaData === 'function'
        );
        console.log(
          '  - saveTraficoData disponible:',
          typeof window.saveTraficoData === 'function'
        );
        console.log(
          '  - saveFacturacionData disponible:',
          typeof window.saveFacturacionData === 'function'
        );
        console.log(
          '  - manejarEnvioFormulario disponible:',
          typeof window.manejarEnvioFormulario === 'function'
        );

        if (isLogisticaPage && registroId && typeof window.saveLogisticaData === 'function') {
          // En logística: generar nuevo número y limpiar
          try {
            const saveSuccess = await window.saveLogisticaData();
            if (!saveSuccess) {
              showNotification('Error al guardar datos de logística', 'error');
              restaurarBoton(); // Restaurar botón antes de salir
              return; // Salir si no se guardó
            }
          } catch (saveError) {
            console.error('❌ Error en saveLogisticaData:', saveError);
            // Verificar si los datos se guardaron en localStorage a pesar del error
            const allData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
            if (allData.registros && allData.registros[registroId]) {
              console.log('✅ Datos encontrados en localStorage a pesar del error, continuando...');
              showNotification('Datos guardados localmente', 'warning');
            } else {
              showNotification('Error al guardar datos de logística', 'error');
              restaurarBoton(); // Restaurar botón antes de salir
              return; // Salir si no se guardó nada
            }
          }

          // Si llegamos aquí, el guardado fue exitoso (o al menos se guardó en localStorage)
          // OPTIMIZACIÓN: No llamar saveLogisticaToFirestore porque saveLogisticaData ya lo hace
          // Esto evita escrituras duplicadas a Firebase
          try {
            // Ya no llamamos saveLogisticaToFirestore aquí porque saveLogisticaData ya maneja Firebase
            // Esto reduce escrituras duplicadas

            showNotification('Datos de logística guardados correctamente', 'success');

            // Limpiar número de registro activo (localStorage y Firebase)
            try {
              await window.clearActiveRegistrationNumber();
            } catch (clearError) {
              console.warn('⚠️ Error limpiando número activo:', clearError);
            }

            // Recargar la página completamente como F5 después de guardar exitosamente
            // La recarga limpiará el formulario y generará un nuevo número automáticamente
            console.log('🔄 Recargando página completamente...');
            setTimeout(() => {
              window.location.reload();
            }, 500); // Pequeño delay para que la notificación se muestre
            return; // Salir para evitar ejecutar código adicional (la recarga lo hará todo)
          } catch (postSaveError) {
            console.error('❌ Error en proceso post-guardado:', postSaveError);
            showNotification(
              'Datos guardados, pero hubo un error al limpiar el formulario',
              'warning'
            );

            // Restaurar botón de submit incluso si hay error
            if (submitBtn) {
              submitBtn.innerHTML = originalContent;
              submitBtn.disabled = false;
            }
          }
        } else if (
          isFacturacionPage &&
          registroId &&
          typeof window.saveFacturacionData === 'function'
        ) {
          // En facturación: guardar datos
          try {
            console.log('💾 Guardando datos de facturación...');
            const saveSuccess = await window.saveFacturacionData();
            if (!saveSuccess) {
              showNotification('Error al guardar datos de facturación', 'error');
              // Restaurar botón
              if (submitBtn) {
                submitBtn.innerHTML = originalContent;
                submitBtn.disabled = false;
              }
              return; // Salir si no se guardó
            }

            showNotification('Datos de facturación guardados correctamente', 'success');

            // Recargar la tabla de registros si existe
            if (typeof window.cargarRegistrosFacturacion === 'function') {
              console.log('🔄 Recargando tabla de registros de facturación...');
              try {
                await window.cargarRegistrosFacturacion();
                console.log('✅ Tabla de registros recargada');
              } catch (reloadError) {
                console.warn('⚠️ Error recargando tabla:', reloadError);
              }
            }

            // Restaurar botón de submit
            if (submitBtn) {
              submitBtn.innerHTML = originalContent;
              submitBtn.disabled = false;
            }
          } catch (saveError) {
            console.error('❌ Error en saveFacturacionData:', saveError);
            // Verificar si los datos se guardaron en localStorage a pesar del error
            const allData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
            if (allData.facturas && allData.facturas[registroId]) {
              console.log('✅ Datos encontrados en localStorage a pesar del error, continuando...');
              showNotification('Datos guardados localmente', 'warning');
            } else {
              showNotification('Error al guardar datos de facturación', 'error');
              // Restaurar botón
              if (submitBtn) {
                submitBtn.innerHTML = originalContent;
                submitBtn.disabled = false;
              }
              return; // Salir si no se guardó nada
            }

            // Restaurar botón de submit
            if (submitBtn) {
              submitBtn.innerHTML = originalContent;
              submitBtn.disabled = false;
            }
          }
        } else if (isTraficoPage && typeof window.manejarEnvioFormulario === 'function') {
          // En tráfico: usar manejarEnvioFormulario que ya tiene toda la lógica
          console.log('🚚 Página de tráfico detectada, llamando a manejarEnvioFormulario...');
          try {
            // Restaurar botón antes de llamar a manejarEnvioFormulario
            // porque esa función maneja su propio estado de botón
            if (submitBtn) {
              submitBtn.innerHTML = originalContent;
              submitBtn.disabled = false;
            }

            // Llamar a la función específica de tráfico
            await window.manejarEnvioFormulario(event);
            console.log('✅ manejarEnvioFormulario completado');
          } catch (traficoError) {
            console.error('❌ Error en manejarEnvioFormulario:', traficoError);
            // Restaurar botón en caso de error
            if (submitBtn) {
              submitBtn.innerHTML = originalContent;
              submitBtn.disabled = false;
            }
            if (typeof showNotification === 'function') {
              showNotification(`Error: ${traficoError.message}`, 'error');
            } else {
              alert(`Error: ${traficoError.message}`);
            }
          }
        } else {
          // Si no es página de logística, facturación ni tráfico, restaurar botón
          console.log('⚠️ Página no reconocida, restaurando botón sin acción');
          if (submitBtn) {
            submitBtn.innerHTML = originalContent;
            submitBtn.disabled = false;
          }
        }
      } else {
        // Si el formulario no es válido, restaurar botón
        if (submitBtn) {
          submitBtn.innerHTML = originalContent;
          submitBtn.disabled = false;
        }
        form.classList.add('was-validated');
      }
    });
  }

  // Mejoras en la experiencia del usuario
  const inputs = document.querySelectorAll('.form-control, .form-select');

  inputs.forEach(input => {
    // Efecto de focus mejorado
    input.addEventListener('focus', function () {
      this.parentElement.classList.add('focused');
    });

    input.addEventListener('blur', function () {
      this.parentElement.classList.remove('focused');
    });

    // Validación en tiempo real
    input.addEventListener('input', function () {
      if (this.checkValidity()) {
        this.classList.remove('is-invalid');
        this.classList.add('is-valid');
      } else {
        this.classList.remove('is-valid');
        this.classList.add('is-invalid');
      }
    });
  });

  // Tooltips para campos obligatorios
  const requiredFields = document.querySelectorAll('[required]');
  requiredFields.forEach(field => {
    const label = field.previousElementSibling;
    if (label && label.classList.contains('form-label')) {
      label.innerHTML += ' <span class="text-danger">*</span>';
    }
  });

  // Animaciones suaves para los botones
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-2px)';
    });

    button.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0)';
    });
  });

  // Responsive sidebar para móviles
  function handleResize() {
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('collapsed');
      mainContent.classList.remove('sidebar-collapsed');
      sidebar.style.transform = 'translateX(-100%)';
    } else {
      sidebar.style.transform = '';
    }
  }

  // Event listener para cambios de tamaño de ventana
  window.addEventListener('resize', handleResize);

  // Inicializar el estado responsive
  handleResize();

  // Event listener para llenado automático de económico en tráfico
  // NOTA: Este listener solo se ejecuta si el input NO es parte de un searchable-select-container
  // (el nuevo sistema de searchable dropdown ya maneja el llenado automático)
  const economicoInput = document.getElementById('economico');
  if (economicoInput && window.location.pathname.includes('trafico.html')) {
    // Verificar si es parte de un searchable-select-container (nuevo sistema)
    const isSearchableInput = economicoInput.closest('.searchable-select-container') !== null;

    if (!isSearchableInput) {
      // Solo agregar listener si NO es un searchable input
      economicoInput.addEventListener('blur', function () {
        const numeroEconomico = this.value.trim();
        if (numeroEconomico && typeof window.fillTraficoFromEconomico === 'function') {
          window.fillTraficoFromEconomico(numeroEconomico);
        }
      });

      // También llenar al presionar Enter
      economicoInput.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
          const numeroEconomico = this.value.trim();
          if (numeroEconomico && typeof window.fillTraficoFromEconomico === 'function') {
            window.fillTraficoFromEconomico(numeroEconomico);
          }
        }
      });
    } else {
      console.log(
        'ℹ️ Input económico es searchable-select, usando sistema nuevo (no se agregará listener de blur)'
      );
    }
  }

  // Event listener para llenado automático de operador en tráfico
  const operadorInput = document.getElementById('operadorprincipal');
  if (operadorInput && window.location.pathname.includes('trafico.html')) {
    operadorInput.addEventListener('blur', function () {
      const nombreOperador = this.value.trim();
      if (nombreOperador && typeof window.fillTraficoFromOperador === 'function') {
        window.fillTraficoFromOperador(nombreOperador);
      }
    });

    // También llenar al presionar Enter
    operadorInput.addEventListener('keypress', function (event) {
      if (event.key === 'Enter') {
        const nombreOperador = this.value.trim();
        if (nombreOperador && typeof window.fillTraficoFromOperador === 'function') {
          window.fillTraficoFromOperador(nombreOperador);
        }
      }
    });
  }

  // Cerrar sidebar al hacer clic fuera en móviles
  document.addEventListener('click', event => {
    if (window.innerWidth <= 768) {
      const isClickInsideSidebar = sidebar.contains(event.target);
      const isClickOnToggle = toggleSidebarBtn.contains(event.target);

      if (!isClickInsideSidebar && !isClickOnToggle && sidebar.classList.contains('show')) {
        sidebar.classList.remove('show');
      }
    }
  });

  // Función para mostrar el sidebar en móviles
  function showMobileSidebar() {
    if (window.innerWidth <= 768) {
      sidebar.classList.add('show');
    }
  }

  // Mejoras en la accesibilidad
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.click();
      }
    });
  });

  // Indicador de carga para el formulario - REMOVIDO (se maneja en el manejador principal)

  // Notificaciones del sistema
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

    document.body.appendChild(notification);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  // Mejoras en la navegación por teclado
  document.addEventListener('keydown', event => {
    // Ctrl/Cmd + B para alternar sidebar
    if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
      event.preventDefault();
      toggleSidebar();
    }

    // Escape para cerrar sidebar en móviles
    if (event.key === 'Escape' && window.innerWidth <= 768) {
      closeSidebar();
    }
  });

  // Indicador de progreso del formulario
  function updateFormProgress() {
    const requiredFields = form?.querySelectorAll('[required]');
    const filledFields = form?.querySelectorAll('[required]:valid');

    if (requiredFields && filledFields) {
      const progress = (filledFields.length / requiredFields.length) * 100;

      // Crear o actualizar barra de progreso
      let progressBar = document.querySelector('.form-progress');
      if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'form-progress';
        progressBar.innerHTML = `
                    <div class="progress mb-3">
                        <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                    </div>
                    <small class="text-muted">Progreso del formulario: 0%</small>
                `;
        form.insertBefore(progressBar, form.firstChild);
      }

      const progressBarElement = progressBar.querySelector('.progress-bar');
      const progressText = progressBar.querySelector('small');

      progressBarElement.style.width = `${progress}%`;
      progressText.textContent = `Progreso del formulario: ${Math.round(progress)}%`;
    }
  }

  // Actualizar progreso en tiempo real
  if (form) {
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('input', updateFormProgress);
      input.addEventListener('change', updateFormProgress);
    });

    // Inicializar progreso
    updateFormProgress();
  }

  // Función para actualizar información del usuario
  // Flag para evitar actualizaciones múltiples del nombre de usuario
  // Se inicializa en false, pero se marca como true después de la primera actualización
  if (typeof window.__userInfoUpdated === 'undefined') {
    window.__userInfoUpdated = false;
  }

  function updateUserInfo() {
    // Evitar actualizaciones múltiples del nombre
    if (window.__userInfoUpdated) {
      return;
    }

    const userNameElement = document.getElementById('currentUserName');
    if (!userNameElement) {
      return;
    }

    // Usar el sistema de autenticación real (prioridad)
    if (window.erpAuth && window.erpAuth.updateUserUI) {
      window.erpAuth.updateUserUI();
      // updateUserUI() ahora maneja la flag internamente
    } else {
      // Fallback: intentar leer desde localStorage
      try {
        const user = JSON.parse(localStorage.getItem('erpCurrentUser') || 'null');
        if (user && user.nombre) {
          const displayName = user.nombre || user.fullName || user.email || 'Demo';
          userNameElement.textContent = displayName;
          window.__userInfoUpdated = true;
          console.log('✅ Nombre de usuario actualizado desde localStorage:', displayName);
        } else {
          // Si no hay usuario aún, establecer Demo como fallback
          if (
            userNameElement.textContent === 'Usuario ERP' ||
            !userNameElement.textContent.trim()
          ) {
            userNameElement.textContent = 'Demo';
            window.__userInfoUpdated = true;
            console.log('✅ Nombre de usuario establecido como Demo (fallback)');
          }
        }
      } catch (e) {
        console.log('Error al cargar usuario:', e);
        // Fallback a Demo si hay error
        if (userNameElement.textContent === 'Usuario ERP' || !userNameElement.textContent.trim()) {
          userNameElement.textContent = 'Demo';
          window.__userInfoUpdated = true;
        }
      }
    }
  }

  // Actualizar información del usuario con un pequeño delay para asegurar que auth.js se haya cargado
  setTimeout(updateUserInfo, 100);

  // Auto-llenar datos en facturación si hay un registro activo
  if (window.location.pathname.includes('facturacion.html')) {
    // Esperar un poco para que se carguen todos los scripts
    setTimeout(() => {
      if (typeof window.autoFillFacturacionOnLoad === 'function') {
        window.autoFillFacturacionOnLoad();
      }
    }, 500);
  }

  // Cargar registro pendiente si viene desde la página de sincronización
  const registroParaCargar = localStorage.getItem('registroParaCargar');
  if (registroParaCargar) {
    console.log('🔄 Cargando registro pendiente:', registroParaCargar);

    // Limpiar el registro del localStorage
    localStorage.removeItem('registroParaCargar');

    // Verificar si el número ya fue procesado en Tráfico
    const history = JSON.parse(localStorage.getItem('registrationNumbers') || '[]');
    const existingInTrafico = history.find(
      item => item.number === registroParaCargar && item.page && item.page.includes('trafico')
    );

    if (existingInTrafico) {
      console.log('⚠️ Número ya procesado en Tráfico, no cargando datos automáticamente');
      // No mostrar notificación adicional para evitar amontonamiento
      return; // No cargar datos automáticamente
    }

    // Esperar a que se carguen todos los scripts
    setTimeout(() => {
      // Llenar el campo de número de registro
      const numeroRegistroInput = document.getElementById('numeroRegistro');
      if (numeroRegistroInput) {
        numeroRegistroInput.value = registroParaCargar;
        window.updateHeaderRegistrationNumber(registroParaCargar);
      }

      // Buscar y llenar datos automáticamente solo si no fue procesado en Tráfico
      if (typeof window.searchAndFillData === 'function') {
        window.searchAndFillData(registroParaCargar);
      } else if (typeof window.safeSearchAndFillData === 'function') {
        window.safeSearchAndFillData(registroParaCargar);
      }

      // Mostrar notificación
      if (typeof window.showNotification === 'function') {
        window.showNotification(`Registro ${registroParaCargar} cargado automáticamente`, 'info');
      }
    }, 1000);
  }

  // Exportar funciones para uso global si es necesario
  window.ERPUtils = {
    showNotification: function (_message, _type) {
      // Implementación de notificación
    },
    toggleSidebar: function () {
      // Implementación de toggle sidebar
    }
  };
});

// Funciones de utilidad
function _debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Sistema de Numeración Única para Registros
// SISTEMA SIMPLIFICADO: Reinicio anual automático
// Formato: Año(2 dígitos) + número secuencial(5 dígitos)
// Ejemplo: 2025 → 2500001, 2500002... | 2026 → 2600001, 2600002...

// Función simplificada para obtener el siguiente número de registro del año actual
// Sistema simplificado: cuenta registros del año actual + 1 (reinicio anual automático)
/**
 * Obtiene el siguiente número de registro desde Firebase (fuente de verdad)
 * Esta función SIEMPRE consulta Firebase directamente, nunca usa localStorage como fuente
 */
async function getAndIncrementRegistrationCounter() {
  if (!window.firebaseDb || !window.fs) {
    throw new Error('Firebase no está disponible - Firebase es la fuente de verdad');
  }

  try {
    // 1. Obtener año actual (últimos 2 dígitos)
    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString().slice(-2); // "25" para 2025, "26" para 2026, etc.

    console.log(`📅 Generando número para el año ${currentYear} (prefijo: ${yearPrefix})`);

    // CRÍTICO: Obtener tenantId actual del usuario
    const demoTenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
    let tenantId = demoTenantId;
    const newUserCreated = localStorage.getItem('newUserCreated');
    const newUserTenantId = localStorage.getItem('newUserTenantId');
    if (
      newUserCreated === 'true' &&
      newUserTenantId &&
      newUserTenantId !== demoTenantId &&
      newUserTenantId !== 'demo'
    ) {
      tenantId = newUserTenantId;
    } else {
      const savedTenantId = localStorage.getItem('tenantId');
      if (savedTenantId && savedTenantId !== demoTenantId && savedTenantId !== 'demo') {
        tenantId = savedTenantId;
      } else if (window.licenseManager && window.licenseManager.isLicenseActive()) {
        const licenseTenantId = window.licenseManager.getTenantId();
        if (licenseTenantId && licenseTenantId !== demoTenantId && licenseTenantId !== 'demo') {
          tenantId = licenseTenantId;
        }
      }
    }

    console.log(`🔑 Obteniendo contador con tenantId: ${tenantId}`);

    // 2. Buscar registros SOLO del año actual usando rango
    const collectionRef = window.fs.collection(window.firebaseDb, 'logistica');

    let maxNumber = 0;
    try {
      // Query optimizada: buscar registros que empiecen con el prefijo del año
      // IMPORTANTE: Filtrar registros eliminados (deleted != true) Y por tenantId
      const rangeStart = `${yearPrefix}00000`;
      const rangeEnd = `${yearPrefix}99999`;

      const q = window.fs.query(
        collectionRef,
        window.fs.where('numeroRegistro', '>=', rangeStart),
        window.fs.where('numeroRegistro', '<=', rangeEnd),
        window.fs.where('deleted', '==', false),
        window.fs.where('tenantId', '==', tenantId)
      );
      const snapshot = await window.fs.getDocs(q);

      // 3. Encontrar el número máximo del año actual (solo registros no eliminados y del tenantId correcto)
      snapshot.docs.forEach(doc => {
        const data = doc.data();

        // Verificar tenantId (doble verificación)
        if (data.tenantId !== tenantId) {
          return; // Saltar registros de otros tenants
        }

        // Verificar que no esté eliminado (doble verificación)
        if (data.deleted === true || data.eliminado === true || data.isDeleted === true) {
          return; // Saltar registros eliminados
        }

        const numReg = data.numeroRegistro || data.registroId || data.id || doc.id;

        if (
          numReg &&
          typeof numReg === 'string' &&
          numReg.startsWith(yearPrefix) &&
          numReg.length === 7
        ) {
          const numberPart = numReg.slice(2); // Obtener los últimos 5 dígitos
          const num = parseInt(numberPart, 10) || 0;
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });

      console.log(
        `📊 Registros encontrados del año ${currentYear}: ${snapshot.docs.length}, Número máximo: ${maxNumber}`
      );
    } catch (queryError) {
      console.warn('⚠️ Error en query optimizada, usando método alternativo:', queryError);

      // FALLBACK: Obtener todos los registros y filtrar por año (solo no eliminados y del tenantId correcto)
      try {
        const snapshot = await window.fs.getDocs(collectionRef);
        snapshot.docs.forEach(doc => {
          const data = doc.data();

          // Verificar tenantId (doble verificación)
          if (data.tenantId !== tenantId) {
            return; // Saltar registros de otros tenants
          }

          // Verificar que no esté eliminado
          if (data.deleted === true || data.eliminado === true || data.isDeleted === true) {
            return; // Saltar registros eliminados
          }

          const numReg = data.numeroRegistro || data.registroId || data.id || doc.id;

          if (
            numReg &&
            typeof numReg === 'string' &&
            numReg.startsWith(yearPrefix) &&
            numReg.length === 7
          ) {
            const numberPart = numReg.slice(2);
            const num = parseInt(numberPart, 10) || 0;
            if (num > maxNumber) {
              maxNumber = num;
            }
          }
        });
        console.log(
          `📊 Método alternativo: Número máximo del año ${currentYear} para tenantId ${tenantId}: ${maxNumber}`
        );
      } catch (fallbackError) {
        console.warn('⚠️ Error obteniendo registros, usando 0:', fallbackError);
      }
    }

    // 4. Siguiente número = máximo + 1 (o 1 si es el primero del año)
    const nextNumber = maxNumber + 1;

    console.log(
      `✅ Siguiente número para ${currentYear}: ${nextNumber} (formato: ${yearPrefix}${String(nextNumber).padStart(5, '0')})`
    );

    return nextNumber;
  } catch (error) {
    console.error('❌ Error obteniendo siguiente número:', error);
    throw error;
  }
}

// Función para obtener el último número de registro del año actual (sin incrementar)
// SISTEMA SIMPLIFICADO: Ya no usa contador, solo cuenta registros del año actual
async function _getLastRegistrationNumber() {
  if (!window.firebaseDb || !window.fs) {
    return null;
  }

  try {
    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString().slice(-2);

    // CRÍTICO: Obtener tenantId actual del usuario (misma lógica que arriba)
    const demoTenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
    let tenantId = demoTenantId;
    const newUserCreated = localStorage.getItem('newUserCreated');
    const newUserTenantId = localStorage.getItem('newUserTenantId');
    if (
      newUserCreated === 'true' &&
      newUserTenantId &&
      newUserTenantId !== demoTenantId &&
      newUserTenantId !== 'demo'
    ) {
      tenantId = newUserTenantId;
    } else {
      const savedTenantId = localStorage.getItem('tenantId');
      if (savedTenantId && savedTenantId !== demoTenantId && savedTenantId !== 'demo') {
        tenantId = savedTenantId;
      } else if (window.licenseManager && window.licenseManager.isLicenseActive()) {
        const licenseTenantId = window.licenseManager.getTenantId();
        if (licenseTenantId && licenseTenantId !== demoTenantId && licenseTenantId !== 'demo') {
          tenantId = licenseTenantId;
        }
      }
    }

    const collectionRef = window.fs.collection(window.firebaseDb, 'logistica');
    let maxNumber = 0;

    try {
      const q = window.fs.query(
        collectionRef,
        window.fs.where('numeroRegistro', '>=', `${yearPrefix}00000`),
        window.fs.where('numeroRegistro', '<=', `${yearPrefix}99999`),
        window.fs.where('deleted', '==', false),
        window.fs.where('tenantId', '==', tenantId)
      );
      const snapshot = await window.fs.getDocs(q);

      snapshot.docs.forEach(doc => {
        const data = doc.data();

        // Verificar tenantId (doble verificación)
        if (data.tenantId !== tenantId) {
          return; // Saltar registros de otros tenants
        }

        // Verificar que no esté eliminado (doble verificación)
        if (data.deleted === true || data.eliminado === true || data.isDeleted === true) {
          return; // Saltar registros eliminados
        }

        const numReg = data.numeroRegistro || data.registroId || data.id || doc.id;
        if (
          numReg &&
          typeof numReg === 'string' &&
          numReg.startsWith(yearPrefix) &&
          numReg.length === 7
        ) {
          const numberPart = numReg.slice(2);
          const num = parseInt(numberPart, 10) || 0;
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });
    } catch (error) {
      console.warn('⚠️ Error en query, usando método alternativo:', error);
      const snapshot = await window.fs.getDocs(collectionRef);
      snapshot.docs.forEach(doc => {
        const data = doc.data();

        // Verificar tenantId (doble verificación)
        if (data.tenantId !== tenantId) {
          return; // Saltar registros de otros tenants
        }

        // Verificar que no esté eliminado
        if (data.deleted === true || data.eliminado === true || data.isDeleted === true) {
          return; // Saltar registros eliminados
        }

        const numReg = data.numeroRegistro || data.registroId || data.id || doc.id;
        if (
          numReg &&
          typeof numReg === 'string' &&
          numReg.startsWith(yearPrefix) &&
          numReg.length === 7
        ) {
          const numberPart = numReg.slice(2);
          const num = parseInt(numberPart, 10) || 0;
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });
    }

    return maxNumber;
  } catch (error) {
    console.warn('⚠️ Error obteniendo último número de registro:', error);
    return null;
  }
}

// Exponer la función globalmente inmediatamente
console.log('📝 Definiendo window.initializeRegistrationSystem...');
window.initializeRegistrationSystem = async function () {
  console.log('🔄 initializeRegistrationSystem ejecutándose...');
  const numeroRegistroInput = document.getElementById('numeroRegistro');
  const _fechaCreacionInput = document.getElementById('fechaCreacion');

  if (!numeroRegistroInput) {
    return;
  } // Solo ejecutar en páginas con formulario

  // Detectar en qué página estamos
  const isLogisticaPage = window.location.pathname.includes('logistica.html');
  const isTraficoPage = window.location.pathname.includes('trafico.html');
  const isFacturacionPage = window.location.pathname.includes('facturacion.html');

  // IMPORTANTE: Si estamos en logística, esperar a que Firebase esté completamente listo
  // Firebase es la fuente de verdad, no debemos generar números sin Firebase
  if (isLogisticaPage) {
    // Esperar a que Firebase esté disponible
    let intentos = 0;
    while (
      (!window.firebaseDb || !window.fs || !window.firebaseAuth?.currentUser) &&
      intentos < 50
    ) {
      await new Promise(resolve => setTimeout(resolve, 100));
      intentos++;
    }

    if (!window.firebaseDb || !window.fs || !window.firebaseAuth?.currentUser) {
      console.warn(
        '⚠️ Firebase no está disponible después de esperar. No se generará número sin la fuente de verdad.'
      );
      // No generar número si Firebase no está disponible - esperar a que esté listo
      return;
    }

    console.log(
      '✅ Firebase está listo (fuente de verdad), procediendo con generación de número...'
    );
  }

  // Si estamos en tráfico o facturación, usar el número compartido del binding (NO generar uno nuevo)
  if (isTraficoPage || isFacturacionPage) {
    console.log('📋 Página de tráfico o facturación detectada, usando número compartido...');

    // PRIORIDAD 1: Usar RegistrationNumberBinding (single source of truth)
    if (
      window.RegistrationNumberBinding &&
      typeof window.RegistrationNumberBinding.get === 'function'
    ) {
      // Esperar a que el binding esté inicializado
      let bindingReady = false;
      let attempts = 0;
      while (!bindingReady && attempts < 20) {
        if (window.RegistrationNumberBinding._isInitialized) {
          bindingReady = true;
        } else {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const sharedNumber = window.RegistrationNumberBinding.get();
      if (sharedNumber && sharedNumber.trim() !== '' && sharedNumber !== '-') {
        console.log(
          `✅ Número compartido obtenido desde RegistrationNumberBinding: ${sharedNumber}`
        );
        numeroRegistroInput.value = sharedNumber;
        numeroRegistroInput.dispatchEvent(new Event('input', { bubbles: true }));
        numeroRegistroInput.dispatchEvent(new Event('change', { bubbles: true }));
        if (window.updateHeaderRegistrationNumber) {
          window.updateHeaderRegistrationNumber(sharedNumber);
        }
        window.setCreationDate();
        return; // Salir, ya establecimos el número compartido
      }
      console.log('ℹ️ No hay número compartido disponible, campo quedará vacío');
      numeroRegistroInput.value = '';
      // NO actualizar el topbar aquí - esperar a que el binding se inicialice completamente
      // El binding actualizará el topbar automáticamente cuando termine de inicializar
      return; // Salir, no hay número para usar
    }

    // FALLBACK: Buscar desde Firebase/localStorage (método antiguo)
    console.log('⚠️ RegistrationNumberBinding no disponible, usando método de respaldo...');

    // Esperar a que Firebase esté listo
    if (!window.firebaseDb || !window.fs) {
      console.log('⏳ Esperando a que Firebase esté listo...');
      let attempts = 0;
      while ((!window.firebaseDb || !window.fs) && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }
    }

    // PRIORIDAD 1: Obtener último número del año actual desde registros reales
    let lastNumber = null;

    if (window.firebaseDb && window.fs) {
      try {
        // Sistema simplificado: buscar el último número del año actual
        const currentYear = new Date().getFullYear();
        const yearPrefix = currentYear.toString().slice(-2);

        console.log(`ℹ️ Buscando último número del año ${currentYear}...`);

        const collectionRef = window.fs.collection(window.firebaseDb, 'logistica');

        // Query optimizada: buscar registros del año actual (solo no eliminados)
        let maxNumber = 0;
        try {
          const q = window.fs.query(
            collectionRef,
            window.fs.where('numeroRegistro', '>=', `${yearPrefix}00000`),
            window.fs.where('numeroRegistro', '<=', `${yearPrefix}99999`),
            window.fs.where('deleted', '==', false)
          );
          const snapshot = await window.fs.getDocs(q);

          snapshot.docs.forEach(doc => {
            const data = doc.data();

            // Verificar que no esté eliminado (doble verificación)
            if (data.deleted === true || data.eliminado === true || data.isDeleted === true) {
              return; // Saltar registros eliminados
            }

            const numReg = data.numeroRegistro || data.registroId || data.id || doc.id;
            if (
              numReg &&
              typeof numReg === 'string' &&
              numReg.startsWith(yearPrefix) &&
              numReg.length === 7
            ) {
              const numberPart = numReg.slice(2);
              const num = parseInt(numberPart, 10) || 0;
              if (num > maxNumber) {
                maxNumber = num;
              }
            }
          });
        } catch (queryError) {
          // FALLBACK: obtener todos y filtrar (solo no eliminados)
          console.warn('⚠️ Error en query, usando método alternativo:', queryError);
          const snapshot = await window.fs.getDocs(collectionRef);
          snapshot.docs.forEach(doc => {
            const data = doc.data();

            // Verificar que no esté eliminado
            if (data.deleted === true || data.eliminado === true || data.isDeleted === true) {
              return; // Saltar registros eliminados
            }

            const numReg = data.numeroRegistro || data.registroId || data.id || doc.id;
            if (
              numReg &&
              typeof numReg === 'string' &&
              numReg.startsWith(yearPrefix) &&
              numReg.length === 7
            ) {
              const numberPart = numReg.slice(2);
              const num = parseInt(numberPart, 10) || 0;
              if (num > maxNumber) {
                maxNumber = num;
              }
            }
          });
        }

        if (maxNumber > 0) {
          const nextNumber = maxNumber + 1;
          lastNumber = `${yearPrefix}${String(nextNumber).padStart(5, '0')}`;
          console.log(`✅ Siguiente número calculado del año ${currentYear}: ${lastNumber}`);
        } else {
          // Primer registro del año
          lastNumber = `${yearPrefix}00001`;
          console.log(`ℹ️ Primer registro del año ${currentYear}, usando: ${lastNumber}`);
        }
      } catch (error) {
        console.warn('⚠️ Error buscando último número:', error);
      }
    }

    // Si encontramos un número, usarlo
    if (lastNumber) {
      numeroRegistroInput.value = lastNumber;

      // Disparar eventos para que periodo.js detecte el cambio
      numeroRegistroInput.dispatchEvent(new Event('input', { bubbles: true }));
      numeroRegistroInput.dispatchEvent(new Event('change', { bubbles: true }));

      if (window.updateHeaderRegistrationNumber) {
        window.updateHeaderRegistrationNumber(lastNumber);
      }
      console.log(`✅ Número de registro establecido: ${lastNumber}`);
      window.setCreationDate();
      return; // Salir, ya establecimos el número
    }
    // Si no hay registros, dejar el campo vacío
    numeroRegistroInput.value = '';
    // NO actualizar el topbar aquí - esperar a que el binding se inicialice completamente
    // El binding actualizará el topbar automáticamente cuando termine de inicializar
    console.log('ℹ️ No se pudo obtener número de registro, campo dejado vacío');
  }

  // Si estamos en logística, calcular el siguiente número SOLO si el campo está vacío
  if (isLogisticaPage) {
    // Verificar si el campo ya tiene un valor válido
    const currentValue = numeroRegistroInput.value ? numeroRegistroInput.value.trim() : '';
    if (currentValue && currentValue !== '-' && /^25\d{5}$/.test(currentValue)) {
      console.log(`✅ Campo ya tiene número válido (${currentValue}), omitiendo generación`);
      window.setCreationDate();
      return; // Salir, ya tiene un número válido
    }

    // Limpiar número activo para regenerar (sistema simplificado)
    console.log('🧹 Limpiando número de registro activo para regenerar...');

    // Limpiar usando RegistrationNumberBinding si está disponible
    if (
      window.RegistrationNumberBinding &&
      typeof window.RegistrationNumberBinding.clear === 'function'
    ) {
      window.RegistrationNumberBinding.clear();
    } else {
      localStorage.removeItem('activeRegistrationNumber');
    }

    // Limpiar el campo también y disparar eventos
    numeroRegistroInput.value = '';
    numeroRegistroInput.dispatchEvent(new Event('input', { bubbles: true }));
    numeroRegistroInput.dispatchEvent(new Event('change', { bubbles: true }));

    // Actualizar header temporalmente a "-"
    if (window.updateHeaderRegistrationNumber) {
      window.updateHeaderRegistrationNumber('-');
    }

    // Calcular el siguiente número SOLO si no se ha generado ya
    if (!window.__numeroRegistroGenerado) {
      console.log('🔄 Calculando siguiente número basado en registros de logística...');
      await window.generateUniqueNumber();
    } else {
      console.log('⏭️ Número ya fue generado, omitiendo generación duplicada');
    }
  }

  // Establecer fecha de creación
  window.setCreationDate();
};

// Función para limpiar el número activo (localStorage y Firebase)
window.clearActiveRegistrationNumber = async function () {
  console.log('🧹 Limpiando número de registro activo...');

  // Limpiar de localStorage
  localStorage.removeItem('activeRegistrationNumber');

  // Limpiar de Firebase (para usuarios anónimos) - eliminamos el documento
  if (window.firebaseDb && window.fs && window.firebaseAuth?.currentUser?.isAnonymous) {
    try {
      const demoTenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
      const activeRef = window.fs.doc(window.firebaseDb, 'system', `${demoTenantId}_active_number`);
      // Usar deleteDoc si está disponible, sino poner number: null
      if (window.fs.deleteDoc) {
        await window.fs.deleteDoc(activeRef);
        console.log('✅ Documento de número activo eliminado de Firebase');
      } else {
        await window.fs.setDoc(activeRef, {
          number: null,
          clearedAt: new Date().toISOString(),
          tenantId: demoTenantId
        });
        console.log('✅ Número activo limpiado de Firebase');
      }
    } catch (error) {
      console.warn('⚠️ Error limpiando número activo de Firebase:', error);
    }
  }

  console.log('✅ Número de registro activo limpiado');
};

// Función global para generar número único (formato 25XXXXX - año + secuencial)
console.log('📝 Definiendo window.generateUniqueNumber...');

// Variable para evitar llamadas múltiples simultáneas
let isGeneratingNumber = false;
// Variable global para evitar generar el número múltiples veces en la misma sesión
window.__numeroRegistroGenerado = false;

window.generateUniqueNumber = async function () {
  // Prevenir llamadas múltiples simultáneas
  if (isGeneratingNumber) {
    console.log('⏭️ generateUniqueNumber ya está en ejecución, omitiendo llamada duplicada...');
    return;
  }

  // Verificar si ya se generó un número y el campo tiene valor válido
  const numeroRegistroInput = document.getElementById('numeroRegistro');
  if (
    numeroRegistroInput &&
    numeroRegistroInput.value &&
    numeroRegistroInput.value.trim() !== '' &&
    numeroRegistroInput.value.trim() !== '-'
  ) {
    const currentValue = numeroRegistroInput.value.trim();
    // Si ya tiene un valor válido (formato YYXXXXX donde YY es el año), no regenerar
    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString().slice(-2);
    const yearRegex = new RegExp(`^${yearPrefix}\\d{5}$`);
    if (yearRegex.test(currentValue)) {
      console.log(
        `⏭️ Campo ya tiene número válido: ${currentValue}, omitiendo generación duplicada...`
      );
      return;
    }
  }

  // Marcar como en ejecución
  if (window.__numeroRegistroGenerado) {
    console.log(
      '⏭️ Número de registro ya fue generado en esta sesión, omitiendo llamada duplicada...'
    );
    return;
  }

  isGeneratingNumber = true;
  console.log('🔄 generateUniqueNumber llamada (primera vez en esta sesión)');

  try {
    const numeroRegistroInput = document.getElementById('numeroRegistro');
    if (!numeroRegistroInput) {
      console.error('❌ No se encontró el campo numeroRegistro');
      isGeneratingNumber = false;
      return;
    }

    let uniqueNumber;

    // PRIORIDAD 1: Usar sistema simplificado (cuenta registros del año actual)
    // IMPORTANTE: Firebase es la fuente de verdad - siempre consultar Firebase primero
    if (window.firebaseDb && window.fs && window.firebaseAuth?.currentUser) {
      try {
        console.log('📊 Obteniendo siguiente número desde Firebase (fuente de verdad)...');

        // Obtener año actual
        const currentYear = new Date().getFullYear();
        const yearPrefix = currentYear.toString().slice(-2);

        // Obtener siguiente número del año actual desde Firebase (fuente de verdad)
        const nextNumber = await getAndIncrementRegistrationCounter();
        uniqueNumber = `${yearPrefix}${String(nextNumber).padStart(5, '0')}`;

        console.log(
          `✅ Nuevo número generado desde Firebase (fuente de verdad): ${uniqueNumber} (año ${currentYear}, número ${nextNumber})`
        );

        // Actualizar el campo INMEDIATAMENTE
        numeroRegistroInput.value = uniqueNumber;

        // Disparar eventos para que periodo.js y otros scripts detecten el cambio
        numeroRegistroInput.dispatchEvent(new Event('input', { bubbles: true }));
        numeroRegistroInput.dispatchEvent(new Event('change', { bubbles: true }));

        // Actualizar header
        if (window.updateHeaderRegistrationNumber) {
          window.updateHeaderRegistrationNumber(uniqueNumber);
        }

        // Guardar usando RegistrationNumberBinding (data binding)
        // IMPORTANTE: Este número viene de Firebase (fuente de verdad), así que es válido guardarlo
        if (
          window.RegistrationNumberBinding &&
          typeof window.RegistrationNumberBinding.set === 'function'
        ) {
          await window.RegistrationNumberBinding.set(uniqueNumber, 'logistica-generate-firebase');
        } else {
          // Fallback a localStorage si binding no está disponible
          localStorage.setItem('activeRegistrationNumber', uniqueNumber);
          // Marcar como validado desde Firebase
          localStorage.removeItem('activeRegistrationNumber_temporary');
        }

        // Marcar como generado para evitar múltiples generaciones
        window.__numeroRegistroGenerado = true;

        // Forzar actualización del display después de un pequeño delay
        setTimeout(() => {
          if (window.updateHeaderRegistrationNumber) {
            window.updateHeaderRegistrationNumber(uniqueNumber);
          }
          numeroRegistroInput.dispatchEvent(new Event('input', { bubbles: true }));
        }, 100);
      } catch (error) {
        console.warn(
          '⚠️ Error obteniendo número desde Firebase, usando método de respaldo:',
          error
        );
        console.warn('⚠️ Intentando consultar Firebase directamente como fallback...');

        // FALLBACK: Calcular desde registros existentes en logística consultando Firebase directamente
        // (solo año actual, solo no eliminados)
        const currentYear = new Date().getFullYear();
        const yearPrefix = currentYear.toString().slice(-2);
        let maxNumber = 0;

        try {
          const collectionRef = window.fs.collection(window.firebaseDb, 'logistica');

          // Intentar query con filtro de eliminados
          try {
            const q = window.fs.query(
              collectionRef,
              window.fs.where('numeroRegistro', '>=', `${yearPrefix}00000`),
              window.fs.where('numeroRegistro', '<=', `${yearPrefix}99999`),
              window.fs.where('deleted', '==', false)
            );
            const snapshot = await window.fs.getDocs(q);

            snapshot.docs.forEach(doc => {
              const data = doc.data();

              // Verificar que no esté eliminado (doble verificación)
              if (data.deleted === true || data.eliminado === true || data.isDeleted === true) {
                return; // Saltar registros eliminados
              }

              const numReg = data.numeroRegistro || data.registroId || data.id || doc.id;

              // Solo contar registros del año actual
              if (
                numReg &&
                typeof numReg === 'string' &&
                numReg.startsWith(yearPrefix) &&
                numReg.length === 7
              ) {
                const numberPart = numReg.slice(2);
                const num = parseInt(numberPart, 10) || 0;
                if (num > maxNumber) {
                  maxNumber = num;
                }
              }
            });
          } catch (queryError) {
            // FALLBACK: obtener todos y filtrar manualmente
            console.warn('⚠️ Error en query con filtros, usando método alternativo:', queryError);
            const snapshot = await window.fs.getDocs(collectionRef);

            snapshot.docs.forEach(doc => {
              const data = doc.data();

              // Verificar que no esté eliminado
              if (data.deleted === true || data.eliminado === true || data.isDeleted === true) {
                return; // Saltar registros eliminados
              }

              const numReg = data.numeroRegistro || data.registroId || data.id || doc.id;

              // Solo contar registros del año actual
              if (
                numReg &&
                typeof numReg === 'string' &&
                numReg.startsWith(yearPrefix) &&
                numReg.length === 7
              ) {
                const numberPart = numReg.slice(2);
                const num = parseInt(numberPart, 10) || 0;
                if (num > maxNumber) {
                  maxNumber = num;
                }
              }
            });
          }
        } catch (collectionError) {
          console.warn('⚠️ Error verificando colección logistica:', collectionError);
        }

        // Calcular siguiente número del año actual
        const nextNumber = maxNumber + 1;
        uniqueNumber = `${yearPrefix}${String(nextNumber).padStart(5, '0')}`;

        console.log(`✅ Número generado (fallback): ${uniqueNumber}`);

        // Actualizar campo y header
        numeroRegistroInput.value = uniqueNumber;

        // Disparar eventos
        numeroRegistroInput.dispatchEvent(new Event('input', { bubbles: true }));
        numeroRegistroInput.dispatchEvent(new Event('change', { bubbles: true }));

        if (window.updateHeaderRegistrationNumber) {
          window.updateHeaderRegistrationNumber(uniqueNumber);
        }

        // Guardar usando RegistrationNumberBinding
        // IMPORTANTE: Este número viene de Firebase (fuente de verdad), así que es válido guardarlo
        if (
          window.RegistrationNumberBinding &&
          typeof window.RegistrationNumberBinding.set === 'function'
        ) {
          await window.RegistrationNumberBinding.set(
            uniqueNumber,
            'logistica-generate-fallback-firebase'
          );
        } else {
          localStorage.setItem('activeRegistrationNumber', uniqueNumber);
          // Marcar como validado desde Firebase
          localStorage.removeItem('activeRegistrationNumber_temporary');
        }

        window.__numeroRegistroGenerado = true;

        setTimeout(() => {
          if (window.updateHeaderRegistrationNumber) {
            window.updateHeaderRegistrationNumber(uniqueNumber);
          }
          numeroRegistroInput.dispatchEvent(new Event('input', { bubbles: true }));
        }, 100);
      }
    } else {
      // FALLBACK: Usar localStorage SOLO si Firebase realmente no está disponible
      // IMPORTANTE: Firebase es la fuente de verdad. localStorage es solo un último recurso.
      console.warn('⚠️ Firebase no disponible, usando localStorage como último recurso');
      console.warn('⚠️ ADVERTENCIA: El número generado desde localStorage puede no ser preciso');
      console.warn('⚠️ Se recomienda verificar manualmente cuando Firebase esté disponible');

      const currentYear = new Date().getFullYear();
      const yearPrefix = currentYear.toString().slice(-2);

      // Intentar obtener desde localStorage (historial) - SOLO como último recurso
      let maxNumber = 0;
      try {
        const history = JSON.parse(localStorage.getItem('registrationNumbers') || '[]');
        history.forEach(item => {
          if (!item.number || !item.number.startsWith(yearPrefix)) {
            return;
          }
          const num = parseInt(item.number.slice(2), 10) || 0;
          if (num > maxNumber) {
            maxNumber = num;
          }
          return true;
        });
      } catch (e) {
        console.warn('⚠️ Error leyendo historial de localStorage:', e);
      }

      const nextNumber = maxNumber + 1;
      uniqueNumber = `${yearPrefix}${String(nextNumber).padStart(5, '0')}`;

      console.log(
        `⚠️ Número generado desde localStorage (NO es fuente de verdad): ${uniqueNumber}`
      );
      console.log('⚠️ Este número debe ser verificado contra Firebase cuando esté disponible');

      // Actualizar campo y header
      numeroRegistroInput.value = uniqueNumber;

      // Disparar eventos
      numeroRegistroInput.dispatchEvent(new Event('input', { bubbles: true }));
      numeroRegistroInput.dispatchEvent(new Event('change', { bubbles: true }));

      if (window.updateHeaderRegistrationNumber) {
        window.updateHeaderRegistrationNumber(uniqueNumber);
      }

      // Guardar usando RegistrationNumberBinding (marcar como temporal)
      if (
        window.RegistrationNumberBinding &&
        typeof window.RegistrationNumberBinding.set === 'function'
      ) {
        await window.RegistrationNumberBinding.set(
          uniqueNumber,
          'logistica-generate-localStorage-temporary'
        );
      } else {
        localStorage.setItem('activeRegistrationNumber', uniqueNumber);
        // Marcar como temporal para que se valide contra Firebase cuando esté disponible
        localStorage.setItem('activeRegistrationNumber_temporary', 'true');
      }

      window.__numeroRegistroGenerado = true;

      setTimeout(() => {
        if (window.updateHeaderRegistrationNumber) {
          window.updateHeaderRegistrationNumber(uniqueNumber);
        }
        numeroRegistroInput.dispatchEvent(new Event('input', { bubbles: true }));
      }, 100);
    }

    console.log(`✅ Número de registro generado: ${uniqueNumber}`);
  } catch (error) {
    console.error('❌ Error en generateUniqueNumber:', error);
  } finally {
    // Liberar el flag de ejecución
    isGeneratingNumber = false;
  }
};

// Verificar que las funciones estén disponibles después de definirlas
console.log('✅ Funciones de registro definidas:', {
  initializeRegistrationSystem: typeof window.initializeRegistrationSystem === 'function',
  generateUniqueNumber: typeof window.generateUniqueNumber === 'function',
  resetRegistrationCounter: typeof window.resetRegistrationCounter === 'function'
});

// Función global para obtener el siguiente número ERP secuencial
window.getNextERPNumber = function () {
  let maxNumber = 0;

  // 1. Verificar en historial de números
  const history = JSON.parse(localStorage.getItem('registrationNumbers') || '[]');
  history.forEach(item => {
    if (item.number && item.number.startsWith('ERP-')) {
      const numberPart = item.number.replace('ERP-', '');
      const num = parseInt(numberPart, 10) || 0;
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  });

  // 2. Verificar en todos los almacenes de datos
  const checkStorages = ['erp_logistica', 'erp_trafico', 'erp_shared_data', 'erp_facturas'];
  checkStorages.forEach(storage => {
    const data = localStorage.getItem(storage);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        let records = [];

        if (Array.isArray(parsed)) {
          records = parsed;
        } else if (typeof parsed === 'object') {
          if (parsed.registros) {
            records = Object.values(parsed.registros);
          } else {
            records = Object.values(parsed);
          }
        }

        records.forEach(record => {
          const numReg = record.numeroRegistro || record.id;
          if (numReg && numReg.startsWith('ERP-')) {
            const numberPart = numReg.replace('ERP-', '');
            const num = parseInt(numberPart, 10) || 0;
            if (num > maxNumber) {
              maxNumber = num;
            }
          }
        });
      } catch (e) {
        console.warn(`Error checking ${storage}:`, e);
      }
    }
  });

  return maxNumber + 1;
};

// Función global para obtener el siguiente número secuencial (formato anterior - mantener para compatibilidad)
// Función global para obtener el siguiente número con formato año (25XXXXX)
window.getNextYearNumber = function () {
  const currentYear = new Date().getFullYear();
  const yearPrefix = currentYear.toString().slice(-2); // 25 para 2025

  let maxNumber = 0;

  // Verificar en historial de números
  const history = JSON.parse(localStorage.getItem('registrationNumbers') || '[]');
  history.forEach(item => {
    if (item.number && item.number.startsWith(yearPrefix) && item.number.length === 7) {
      const numberPart = item.number.slice(2); // Quitar los primeros 2 dígitos del año
      const num = parseInt(numberPart, 10) || 0;
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  });

  // También verificar en otros almacenes por si hay registros no sincronizados
  const checkStorages = ['erp_logistica', 'erp_trafico', 'erp_shared_data'];
  checkStorages.forEach(storage => {
    const data = localStorage.getItem(storage);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        let records = [];

        if (Array.isArray(parsed)) {
          records = parsed;
        } else if (typeof parsed === 'object') {
          if (parsed.registros) {
            records = Object.values(parsed.registros);
          } else {
            records = Object.values(parsed);
          }
        }

        records.forEach(record => {
          const numReg = record.numeroRegistro || record.id;
          if (numReg && numReg.startsWith(yearPrefix) && numReg.length === 7) {
            const numberPart = numReg.slice(2);
            const num = parseInt(numberPart, 10) || 0;
            if (num > maxNumber) {
              maxNumber = num;
            }
          }
        });
      } catch (e) {
        console.warn(`Error checking ${storage}:`, e);
      }
    }
  });

  return maxNumber + 1;
};

window.getNextSequentialNumber = function () {
  // Obtener el último número usado del mes actual
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  let lastNumber = 0;
  const history = JSON.parse(localStorage.getItem('registrationNumbers') || '[]');

  // Filtrar números del mes actual
  const currentMonthNumbers = history.filter(item => {
    const itemDate = new Date(item.timestamp);
    return itemDate.getFullYear() === currentYear && itemDate.getMonth() + 1 === currentMonth;
  });

  if (currentMonthNumbers.length > 0) {
    // Extraer solo los números secuenciales del mes actual
    const sequentialNumbers = currentMonthNumbers
      .map(item => {
        const parts = item.number.split('-');
        if (parts.length === 3) {
          return parseInt(parts[2], 10);
        }
        return 0;
      })
      .filter(num => !isNaN(num) && num > 0);

    if (sequentialNumbers.length > 0) {
      lastNumber = Math.max(...sequentialNumbers);
    }
  }

  // Generar el siguiente número (del 1 al 9999)
  // Si es un nuevo mes, reiniciar desde 0001
  let nextNumber;
  if (lastNumber === 0) {
    nextNumber = 1; // Primer número del mes
  } else {
    nextNumber = (lastNumber % 9999) + 1;
  }

  // Formatear con ceros a la izquierda (ej: 0001, 0012, 0123, 1234)
  return String(nextNumber).padStart(4, '0');
};

// Función global para actualizar el número en el header
window.updateHeaderRegistrationNumber = function (number) {
  // CRÍTICO: Si se intenta mostrar "-" pero el binding aún no está inicializado, esperar
  if (
    (!number || number === '-') &&
    window.RegistrationNumberBinding &&
    !window.RegistrationNumberBinding._isInitialized
  ) {
    // Esperar a que el binding se inicialice antes de mostrar "-"
    const checkBinding = setInterval(() => {
      if (window.RegistrationNumberBinding && window.RegistrationNumberBinding._isInitialized) {
        clearInterval(checkBinding);
        const bindingNumber = window.RegistrationNumberBinding.get();
        if (bindingNumber && bindingNumber !== '-') {
          // Usar el número del binding en lugar de "-"
          window.updateHeaderRegistrationNumber(bindingNumber);
        } else {
          // Solo mostrar "-" si realmente no hay número después de que el binding se inicializó
          window.updateHeaderRegistrationNumber('-');
        }
      }
    }, 100);

    // Timeout de seguridad: si después de 2 segundos el binding no se inicializó, mostrar "-"
    setTimeout(() => {
      clearInterval(checkBinding);
      if (window.RegistrationNumberBinding && !window.RegistrationNumberBinding._isInitialized) {
        // Si aún no está inicializado, mostrar "-" como fallback
        const valor = number || '-';
        _updateHeaderElement(valor);
      }
    }, 2000);
    return;
  }

  const valor = number || '-';
  _updateHeaderElement(valor);

  // Función auxiliar para actualizar el elemento del header
  function _updateHeaderElement(valor) {
    // Intentar encontrar el elemento de múltiples formas
    let headerNumber = document.getElementById('headerRegistrationNumber');

    // Si no se encuentra por ID, intentar por clase
    if (!headerNumber) {
      headerNumber = document.querySelector('.registration-number');
    }

    // Si aún no se encuentra, intentar buscar dentro del contenedor
    if (!headerNumber) {
      const container = document.getElementById('currentRegistration');
      if (container) {
        headerNumber =
          container.querySelector('.registration-number') || container.querySelector('span');
      }
    }

    if (headerNumber) {
      headerNumber.textContent = valor;
      // Solo loguear si está habilitado el debug
      if (window.DEBUG_MODE) {
        console.log('✅ Header actualizado con número de registro:', valor);
      }

      // Verificar que realmente se actualizó
      if (headerNumber.textContent !== valor) {
        if (window.DEBUG_MODE) {
          console.warn('⚠️ El valor no se actualizó correctamente, forzando...');
        }
        headerNumber.textContent = valor;
      }
    } else {
      // El elemento no existe (normal en páginas con nueva estructura)
      // Solo intentar una vez más silenciosamente
      setTimeout(() => {
        headerNumber =
          document.getElementById('headerRegistrationNumber') ||
          document.querySelector('.registration-number');
        if (headerNumber) {
          headerNumber.textContent = valor;
          if (window.DEBUG_MODE) {
            console.log('✅ Header actualizado (retry) con número de registro:', valor);
          }
        }
        // Si no existe, simplemente no hacer nada (no es un error crítico)
      }, 100);
      // Ya no mostrar warnings - el elemento es opcional en la nueva estructura
    }
  }

  // Actualizar el estado visual del número de registro
  if (typeof window.updateRegistrationStatus === 'function') {
    window.updateRegistrationStatus(number);
  }
};

// Función global para establecer fecha de creación
window.setCreationDate = function () {
  const fechaCreacionInput = document.getElementById('fechaCreacion');
  if (!fechaCreacionInput) {
    return;
  }

  // Si el campo es type="date", usar formato YYYY-MM-DD
  if (fechaCreacionInput.type === 'date') {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    fechaCreacionInput.value = `${year}-${month}-${day}`;
  } else {
    // Si no es type="date", usar formato formateado (para compatibilidad)
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    fechaCreacionInput.value = formattedDate;
  }
};

// Función eliminada: syncRegistrationCounter ya no es necesaria
// El sistema simplificado cuenta registros del año actual automáticamente
// No requiere sincronización de contador

// Función simplificada: reiniciar contador del año actual
// NOTA: El sistema ahora reinicia automáticamente cada año, esta función es solo para casos especiales
console.log('📝 Definiendo window.resetRegistrationCounter...');
window.resetRegistrationCounter = async function () {
  const currentYear = new Date().getFullYear();
  const yearPrefix = currentYear.toString().slice(-2);
  const firstNumber = `${yearPrefix}00001`;

  if (
    !confirm(
      `⚠️ ¿Estás seguro de que deseas resetear el contador del año ${currentYear}?\n\nEl siguiente número será: ${firstNumber}\n\nNOTA: El sistema reinicia automáticamente cada año.`
    )
  ) {
    return;
  }

  try {
    console.log(`🔄 Reseteando contador del año ${currentYear} a ${firstNumber}...`);

    // Actualizar el campo si existe
    const numeroRegistroInput = document.getElementById('numeroRegistro');
    if (numeroRegistroInput) {
      numeroRegistroInput.value = firstNumber;
      numeroRegistroInput.dispatchEvent(new Event('input', { bubbles: true }));
      numeroRegistroInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Actualizar header
    if (window.updateHeaderRegistrationNumber) {
      window.updateHeaderRegistrationNumber(firstNumber);
    }

    // Guardar usando RegistrationNumberBinding si está disponible
    if (
      window.RegistrationNumberBinding &&
      typeof window.RegistrationNumberBinding.set === 'function'
    ) {
      await window.RegistrationNumberBinding.set(firstNumber, 'reset');
    } else {
      // Fallback a localStorage
      localStorage.setItem('activeRegistrationNumber', firstNumber);
    }

    console.log(`✅ Contador del año ${currentYear} reseteado. Siguiente número: ${firstNumber}`);

    // NOTA: Ya no actualizamos contador en Firebase porque el sistema simplificado
    // cuenta registros del año actual automáticamente

    if (typeof window.showNotification === 'function') {
      window.showNotification(
        `✅ Contador reseteado. Siguiente número del año ${currentYear}: ${firstNumber}`,
        'success'
      );
    } else {
      alert(`✅ Contador reseteado.\n\nSiguiente número del año ${currentYear}: ${firstNumber}`);
    }

    // Verificación final
    const finalCheck = window.RegistrationNumberBinding
      ? window.RegistrationNumberBinding.get()
      : localStorage.getItem('activeRegistrationNumber');
    const finalField = document.getElementById('numeroRegistro')?.value;
    console.log('🔍 Verificación final - Binding/localStorage:', finalCheck);
    console.log('🔍 Verificación final - campo:', finalField);

    if (finalCheck === firstNumber && finalField === firstNumber) {
      console.log(`✅ Contador reseteado exitosamente a ${firstNumber}`);
    } else {
      console.error('❌ ERROR: El número no se guardó correctamente');
      console.error('  - Binding/localStorage:', finalCheck);
      console.error('  - Campo:', finalField);
    }
  } catch (error) {
    console.error('❌ Error reseteando contador:', error);
    if (typeof window.showNotification === 'function') {
      window.showNotification(`❌ Error reseteando contador: ${error.message}`, 'error');
    } else {
      alert('❌ Error al resetear el contador. Revisa la consola para más detalles.');
    }
  }
};

window.saveNumberToHistory = function (number) {
  let history = JSON.parse(localStorage.getItem('registrationNumbers') || '[]');
  history.push({
    number: number,
    timestamp: new Date().toISOString(),
    page: window.location.pathname
  });

  // Mantener solo los últimos 1000 números
  if (history.length > 1000) {
    history = history.slice(-1000);
  }

  localStorage.setItem('registrationNumbers', JSON.stringify(history));
};
