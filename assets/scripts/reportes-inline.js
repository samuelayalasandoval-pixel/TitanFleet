// Script crítico: Restaurar estado del sidebar ANTES de renderizar para evitar parpadeo
console.log('📄 reportes-inline.js: Script cargado');
(function () {
  'use strict';

  // DEFINIR FUNCIÓN DE RECORDATORIOS INMEDIATAMENTE (antes de cualquier DOMContentLoaded)
  // Esto asegura que esté disponible cuando se intente llamar
  if (!window.cargarRecordatoriosMantenimiento) {
    window.cargarRecordatoriosMantenimiento = async function () {
      console.log('🔔 ===== INICIANDO carga de recordatorios de mantenimiento =====');

      try {
        console.log('📍 Paso 1: Buscando contenedor...');
        const recordatoriosContainer = document.getElementById('recordatoriosMantenimiento');

        if (!recordatoriosContainer) {
          console.error(
            '❌ Contenedor de recordatorios no encontrado (id: recordatoriosMantenimiento)'
          );
          return;
        }

        console.log('✅ Contenedor de recordatorios encontrado');

        // Limpiar contenedor
        console.log('📍 Paso 2: Limpiando contenedor...');
        recordatoriosContainer.innerHTML =
          '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando recordatorios...</div>';

        console.log('📍 Paso 3: Inicializando array de mantenimientos...');
        let mantenimientos = [];

        // PRIORIDAD 1: Cargar desde Firebase (fuente de verdad)
        if (window.firebaseRepos && window.firebaseRepos.mantenimiento) {
          try {
            const repoMantenimiento = window.firebaseRepos.mantenimiento;

            // Intentar inicializar si no está listo (con timeout)
            let attempts = 0;
            const maxAttempts = 10;
            while (
              attempts < maxAttempts &&
              (!repoMantenimiento.db || !repoMantenimiento.tenantId)
            ) {
              attempts++;
              console.log(
                `⏳ Esperando inicialización del repositorio mantenimiento... (${attempts}/${maxAttempts})`
              );
              await new Promise(resolve => setTimeout(resolve, 500));
              if (repoMantenimiento.init) {
                try {
                  await repoMantenimiento.init();
                } catch (initError) {
                  console.warn('⚠️ Error en init del repositorio:', initError);
                }
              }
            }

            if (repoMantenimiento.db && repoMantenimiento.tenantId) {
              console.log('✅ Repositorio mantenimiento inicializado, obteniendo registros...');
              // Agregar timeout para evitar que se quede colgado
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error('Timeout obteniendo registros de mantenimiento')),
                  10000
                )
              );

              const registrosPromise = repoMantenimiento.getAllRegistros();
              mantenimientos = await Promise.race([registrosPromise, timeoutPromise]);

              if (mantenimientos && Array.isArray(mantenimientos)) {
                console.log(
                  `🔥 Recordatorios: Datos de mantenimiento cargados desde Firebase: ${mantenimientos.length}`
                );
              } else {
                console.warn('⚠️ getAllRegistros no devolvió un array válido:', mantenimientos);
                mantenimientos = [];
              }
            } else {
              console.warn('⚠️ Repositorio de mantenimiento no inicializado después de intentos');
            }
          } catch (firebaseError) {
            console.warn(
              '⚠️ Error cargando desde Firebase, usando localStorage como respaldo:',
              firebaseError
            );
            console.warn('   Detalles del error:', firebaseError.message || firebaseError);
            mantenimientos = []; // Asegurar que sea un array vacío
          }
        } else {
          console.log('ℹ️ Repositorio de mantenimiento no disponible aún');
        }

        // PRIORIDAD 2: Fallback a localStorage si Firebase no tiene datos
        if (!mantenimientos || mantenimientos.length === 0) {
          try {
            const mantenimientosLocalStr = localStorage.getItem('erp_mantenimientos');
            if (mantenimientosLocalStr) {
              const mantenimientosLocal = JSON.parse(mantenimientosLocalStr);
              if (
                mantenimientosLocal &&
                Array.isArray(mantenimientosLocal) &&
                mantenimientosLocal.length > 0
              ) {
                mantenimientos = mantenimientosLocal;
                console.log(
                  `📦 Recordatorios: ${mantenimientos.length} mantenimientos cargados desde localStorage (respaldo)`
                );
              } else {
                console.log('ℹ️ localStorage tiene datos pero no es un array válido o está vacío');
              }
            } else {
              console.log('ℹ️ No hay datos en localStorage para mantenimientos');
            }
          } catch (localError) {
            console.warn('⚠️ Error cargando desde localStorage:', localError);
            mantenimientos = []; // Asegurar que sea un array vacío
          }
        }

        // Asegurar que mantenimientos sea siempre un array
        if (!Array.isArray(mantenimientos)) {
          console.warn('⚠️ mantenimientos no es un array, convirtiendo a array vacío');
          mantenimientos = [];
        }

        console.log('📋 Mantenimientos desde Firebase:', mantenimientos);
        console.log(
          `📍 Paso 4: Total mantenimientos obtenidos: ${mantenimientos ? mantenimientos.length : 0}`
        );

        if (!mantenimientos || mantenimientos.length === 0) {
          console.log('📍 Paso 5: No hay mantenimientos, mostrando mensaje...');
          recordatoriosContainer.innerHTML = `
            <div class="alert alert-info">
              <i class="fas fa-info-circle"></i>
              No hay mantenimientos registrados.
            </div>
          `;
          console.log('ℹ️ No hay mantenimientos para mostrar');
          console.log('🔔 ===== FIN carga de recordatorios (sin mantenimientos) =====');
          return;
        }

        // Procesar recordatorios
        console.log('📍 Paso 6: Procesando recordatorios...');
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const recordatorios = [];

        console.log(`📍 Paso 7: Iterando sobre ${mantenimientos.length} mantenimientos...`);
        mantenimientos.forEach((mantenimiento, index) => {
          console.log(
            `📍 Procesando mantenimiento ${index + 1}/${mantenimientos.length}:`,
            mantenimiento.id || mantenimiento.economico || 'sin ID'
          );
          const fechaSiguiente =
            mantenimiento.fechaSiguienteServicio ||
            mantenimiento.fechaSiguiente ||
            mantenimiento.proximaFechaServicio ||
            mantenimiento.proximaFecha;

          if (fechaSiguiente) {
            let fechaProximo = null;
            const fechaStr = String(fechaSiguiente);

            // PRIORIDAD 1: Formato YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
              const fechaParte = fechaStr.split('T')[0];
              const [year, month, day] = fechaParte.split('-');
              fechaProximo = new Date(
                parseInt(year, 10),
                parseInt(month, 10) - 1,
                parseInt(day, 10)
              );
            }
            // PRIORIDAD 2: Formato DD/MM/YYYY
            else if (fechaStr.includes('/') && fechaStr.split('/').length === 3) {
              const partes = fechaStr.split('/');
              const dia = parseInt(partes[0], 10);
              const mes = parseInt(partes[1], 10) - 1;
              const año = parseInt(partes[2], 10);
              fechaProximo = new Date(año, mes, dia);
            }
            // PRIORIDAD 3: Intentar parsear como Date estándar
            else {
              fechaProximo = new Date(fechaStr);
            }

            fechaProximo.setHours(0, 0, 0, 0);

            if (fechaProximo && !isNaN(fechaProximo.getTime())) {
              const diasRestantes = Math.ceil((fechaProximo - hoy) / (1000 * 60 * 60 * 24));

              console.log(`🔍 Mantenimiento ${mantenimiento.economico || mantenimiento.id}:`, {
                fechaSiguienteServicioOriginal: fechaSiguiente,
                fechaProximo: fechaProximo.toISOString().split('T')[0],
                fechaHoy: hoy.toISOString().split('T')[0],
                diasRestantes: diasRestantes,
                dentroDeRango: diasRestantes <= 15,
                todosLosCampos: {
                  fechaSiguienteServicio: mantenimiento.fechaSiguienteServicio,
                  fechaSiguiente: mantenimiento.fechaSiguiente,
                  proximaFechaServicio: mantenimiento.proximaFechaServicio,
                  proximaFecha: mantenimiento.proximaFecha
                }
              });

              if (diasRestantes <= 15) {
                recordatorios.push({
                  ...mantenimiento,
                  diasRestantes: diasRestantes
                });
                console.log(
                  `✅ Recordatorio agregado: ${mantenimiento.economico || mantenimiento.id} - ${diasRestantes} días restantes`
                );
              } else {
                console.log(
                  `⏭️ Mantenimiento ${mantenimiento.economico || mantenimiento.id} fuera de rango (${diasRestantes} días, máximo 15)`
                );
              }
            }
          } else {
            console.log(
              `ℹ️ Mantenimiento ${mantenimiento.economico || mantenimiento.id} no tiene fechaSiguienteServicio. Campos disponibles:`,
              Object.keys(mantenimiento).filter(k => k.toLowerCase().includes('fecha'))
            );
          }
        });

        console.log(
          `📊 Recordatorios encontrados: ${recordatorios.length} de ${mantenimientos.length} mantenimientos`
        );

        if (recordatorios.length === 0 && mantenimientos.length > 0) {
          const mantenimientosConFecha = mantenimientos.filter(m => m.fechaSiguienteServicio);
          console.log(
            `📋 Mantenimientos con fechaSiguienteServicio: ${mantenimientosConFecha.length}`
          );
          mantenimientosConFecha.forEach(m => {
            try {
              const fechaStr = m.fechaSiguienteServicio;
              let fechaProximo = null;
              if (/^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
                const fechaParte = fechaStr.split('T')[0];
                const [year, month, day] = fechaParte.split('-');
                fechaProximo = new Date(
                  parseInt(year, 10),
                  parseInt(month, 10) - 1,
                  parseInt(day, 10)
                );
                fechaProximo.setHours(0, 0, 0, 0);
                const diasRestantes = Math.ceil((fechaProximo - hoy) / (1000 * 60 * 60 * 24));
                console.log(
                  `   - ${m.economico || m.id}: fecha=${fechaStr}, días=${diasRestantes}, ${diasRestantes > 15 ? 'FUERA DE RANGO (>15 días)' : 'debería aparecer'}`
                );
              }
            } catch (e) {
              console.warn(`   - ${m.economico || m.id}: Error procesando fecha`, e);
            }
          });
        }

        // Ordenar por días restantes (más urgentes primero)
        console.log('📍 Paso 10: Ordenando recordatorios...');
        recordatorios.sort((a, b) => a.diasRestantes - b.diasRestantes);

        if (recordatorios.length === 0) {
          console.log('📍 Paso 11: No hay recordatorios, mostrando mensaje de éxito...');
          recordatoriosContainer.innerHTML = `
            <div class="alert alert-success">
              <i class="fas fa-check-circle"></i>
              No hay recordatorios próximos. Todos los servicios están al día.
            </div>
          `;
          console.log('✅ Mostrando mensaje: No hay recordatorios próximos');
          console.log('🔔 ===== FIN carga de recordatorios (sin recordatorios próximos) =====');
          return;
        }

        // Generar HTML para cada recordatorio
        console.log(`📍 Paso 12: Generando HTML para ${recordatorios.length} recordatorios...`);
        recordatoriosContainer.innerHTML = ''; // Limpiar antes de agregar
        recordatorios.forEach((recordatorio, index) => {
          console.log(
            `📍 Generando HTML para recordatorio ${index + 1}/${recordatorios.length}...`
          );
          const alertClass =
            recordatorio.diasRestantes <= 0
              ? 'alert-danger'
              : recordatorio.diasRestantes <= 7
                ? 'alert-warning'
                : 'alert-info';

          const iconClass =
            recordatorio.diasRestantes <= 0
              ? 'fas fa-exclamation-triangle'
              : recordatorio.diasRestantes <= 7
                ? 'fas fa-exclamation-circle'
                : 'fas fa-clock';

          const mensaje =
            recordatorio.diasRestantes <= 0
              ? `¡VENCIDO! El servicio estaba programado para ${recordatorio.fechaSiguienteServicio}`
              : recordatorio.diasRestantes === 1
                ? 'Mañana es el próximo servicio de mantenimiento'
                : `Próximo servicio en ${recordatorio.diasRestantes} días`;

          const recordatorioHTML = `
            <div class="alert ${alertClass} mb-2">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <i class="${iconClass}"></i>
                  <strong>${recordatorio.economico || recordatorio.numeroEconomico || 'N/A'}</strong> - ${mensaje}
                </div>
                <button class="btn btn-sm btn-outline-secondary" onclick="window.marcarComoCompletado('${recordatorio.id || recordatorio.numeroEconomico}')">
                  <i class="fas fa-check"></i> Completado
                </button>
              </div>
            </div>
          `;

          recordatoriosContainer.innerHTML += recordatorioHTML;
        });

        console.log('📍 Paso 13: HTML generado y agregado al contenedor');
        console.log(`✅ ${recordatorios.length} recordatorios cargados y mostrados`);
        console.log('🔔 ===== FIN carga de recordatorios de mantenimiento =====');
      } catch (error) {
        console.error('❌ ERROR en carga de recordatorios:', error);
        console.error('❌ Tipo de error:', error.constructor.name);
        console.error('❌ Mensaje:', error.message);
        console.error('❌ Stack trace:', error.stack);
        console.error('❌ Error completo:', error);

        const recordatoriosContainer = document.getElementById('recordatoriosMantenimiento');
        if (recordatoriosContainer) {
          recordatoriosContainer.innerHTML = `
            <div class="alert alert-danger">
              <i class="fas fa-exclamation-triangle"></i>
              Error cargando recordatorios: ${error.message || 'Error desconocido'}
              <br><small>Revisa la consola para más detalles</small>
            </div>
          `;
        } else {
          console.error('❌ No se pudo mostrar el error porque el contenedor no existe');
        }
        console.log('🔔 ===== FIN carga de recordatorios (con error) =====');
      }
    };
    console.log('✅ Función cargarRecordatoriosMantenimiento definida al inicio del script');
  }
  // Leer estado del sidebar inmediatamente
  try {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
      // Aplicar estilo inline directamente al body para que se ejecute antes del render
      document.documentElement.style.setProperty('--sidebar-initial-state', 'collapsed');

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

// Función para formatear el mes y año en texto legible
function _formatearMesAnio(mesAnio) {
  if (!mesAnio) {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = ahora.getMonth();
    mesAnio = `${año}-${String(mes + 1).padStart(2, '0')}`;
  }

  const [año, mes] = mesAnio.split('-');
  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ];

  const mesNum = parseInt(mes, 10) - 1;
  const nombreMes = meses[mesNum] || mes;

  return `${nombreMes} de ${año}`;
}

// Función para establecer el mes actual en el filtro (se ejecuta inmediatamente)
function establecerMesActualInmediato() {
  try {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const mesAnio = `${año}-${mes}`;

    const input = document.getElementById('filtroMesReportes');
    if (input && !input.value) {
      input.value = mesAnio;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error estableciendo mes actual:', error);
    return false;
  }
}

// Inicializar el filtro de mes con el mes y año actual - VERSIÓN SIMPLIFICADA
(function () {
  function configurarFiltroMes() {
    const filtroInput = document.getElementById('filtroMesReportes');
    if (!filtroInput) {
      return false;
    }

    // Establecer el mes y año actual si no tiene valor
    if (!filtroInput.value) {
      const ahora = new Date();
      const año = ahora.getFullYear();
      const mes = String(ahora.getMonth() + 1).padStart(2, '0');
      const mesAnioActual = `${año}-${mes}`;
      filtroInput.value = mesAnioActual;
      console.log(`📅 Filtro de mes configurado a mes y año actual: ${mesAnioActual}`);
    }

    // Configurar listener para cambios (solo una vez)
    if (!filtroInput.hasAttribute('data-listener-configurado')) {
      filtroInput.addEventListener('change', function () {
        console.log('📅 Filtro de mes cambió a:', this.value);
        if (
          window.reportesSystem &&
          typeof window.reportesSystem.loadDashboardData === 'function'
        ) {
          window.reportesSystem.loadDashboardData();
        }
      });
      filtroInput.setAttribute('data-listener-configurado', 'true');
    }

    return true;
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Establecer mes actual inmediatamente
      establecerMesActualInmediato();
      // Configurar listener
      configurarFiltroMes();
      // Reintentar para asegurar que se establezca
      setTimeout(() => {
        establecerMesActualInmediato();
        configurarFiltroMes();
      }, 100);
    });
  } else {
    // DOM ya está listo
    establecerMesActualInmediato();
    configurarFiltroMes();
    setTimeout(() => {
      establecerMesActualInmediato();
      configurarFiltroMes();
    }, 100);
  }

  // También intentar después de que la página esté completamente cargada
  window.addEventListener('load', () => {
    establecerMesActualInmediato();
    configurarFiltroMes();
  });

  // Ejecutar inmediatamente si es posible (para establecer el valor antes del render)
  establecerMesActualInmediato();
})();

// Función global para aplicar el filtro de mes
window.aplicarFiltroMesReportes = function () {
  console.log('🔄 Aplicando filtro de mes...');

  if (window.reportesSystem) {
    // Actualizar el período mostrado según el filtro seleccionado
    window.reportesSystem.setCurrentPeriod();

    // Recargar KPIs y gráficos con el nuevo filtro
    window.reportesSystem
      .loadDashboardData()
      .then(() => {
        console.log('✅ Datos actualizados con el nuevo filtro de mes');
      })
      .catch(error => {
        console.error('❌ Error actualizando datos:', error);
      });
  } else {
    console.warn('⚠️ Sistema de reportes no está inicializado');
  }
};

// ===== SISTEMA DE CARGA BAJO DEMANDA (LAZY LOADING) =====
// Detectar la ruta base automáticamente basándose en la ubicación de la página
(function () {
  // Determinar la ruta base relativa basándose en window.location
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

  // Configurar módulos con rutas relativas correctas
  window.MODULES_CONFIG = {
    connection: {
      scripts: [`${basePath}connection-monitor.js`],
      loaded: false
    },
    economicos: {
      scripts: [`${basePath}economicos-repo.js`],
      loaded: false
    },
    firebase: {
      scripts: [`${basePath}firebase-repo-base.js`, `${basePath}firebase-repos.js`],
      loaded: false
    },
    diagnostico: {
      scripts: [
        `${basePath}migracion-firebase.js`,
        `${basePath}diagnostico-firebase.js`,
        `${basePath}actualizar-repositorios.js`
      ],
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
    window
      .loadModule('firebase')
      .catch(err => console.warn('No se pudo cargar módulo firebase:', err));
  }, 1000);
});

// Función para inicializar recordatorios (reutilizable)
function inicializarRecordatoriosMantenimiento() {
  // Cargar recordatorios de mantenimiento
  setTimeout(() => {
    console.log('🔍 Verificando disponibilidad de cargarRecordatoriosMantenimiento...');
    console.log(
      '   - typeof window.cargarRecordatoriosMantenimiento:',
      typeof window.cargarRecordatoriosMantenimiento
    );
    if (typeof window.cargarRecordatoriosMantenimiento === 'function') {
      console.log('🔄 Cargando recordatorios de mantenimiento...');
      window.cargarRecordatoriosMantenimiento().catch(error => {
        console.error('❌ Error al cargar recordatorios:', error);
        console.error('Stack:', error.stack);
      });
    } else {
      console.warn('⚠️ Función cargarRecordatoriosMantenimiento no está disponible');
      console.warn('   - Intentando definir manualmente...');
      // Intentar esperar un poco más y volver a intentar
      setTimeout(() => {
        if (typeof window.cargarRecordatoriosMantenimiento === 'function') {
          console.log('✅ Función ahora disponible, cargando recordatorios...');
          window.cargarRecordatoriosMantenimiento().catch(error => {
            console.error('❌ Error al cargar recordatorios:', error);
          });
        } else {
          console.error(
            '❌ Función cargarRecordatoriosMantenimiento aún no está disponible después de esperar'
          );
        }
      }, 3000);
    }
  }, 2000);
}

// Asegurar que el sistema se inicialice cuando el DOM esté listo
// NOTA: La inicialización principal está en reportes.js para evitar duplicados
function inicializarReportesInline() {
  // Solo verificar y recargar datos si el sistema ya está inicializado
  // No inicializar aquí para evitar conflictos con reportes.js
  setTimeout(() => {
    if (window.reportesSystem && window.reportesSystem.initialized) {
      console.log('✅ Sistema de reportes ya inicializado desde reportes.js');
    }

    // Cargar filtros y gráfico de movimientos de dinero (con delay para no interferir con la carga de datos)
    setTimeout(() => {
      if (typeof window.cargarFiltrosMovimientos === 'function') {
        window.cargarFiltrosMovimientos();
      }
      // Inicializar listener automático de movimientos después de cargar el gráfico
      if (typeof inicializarListenerMovimientos === 'function') {
        inicializarListenerMovimientos();
      }
    }, 2000);

    // Recargar filtro de tractocamiones después de un delay adicional
    // para asegurar que configuracionManager esté disponible
    setTimeout(() => {
      if (
        window.reportesSystem &&
        typeof window.reportesSystem.loadTractocamionesFilter === 'function'
      ) {
        console.log('🔄 Recargando filtro de tractocamiones...');
        window.reportesSystem.loadTractocamionesFilter();
      }
    }, 1000);

    // Verificación final: después de 5 segundos, verificar que los datos se muestren
    setTimeout(() => {
      console.log('🔍 Verificación final de datos cargados...');
      const totalLogistica = document.getElementById('totalLogistica');
      const totalTrafico = document.getElementById('totalTrafico');

      if (totalLogistica && totalTrafico) {
        const valorLogistica = totalLogistica.textContent.trim();
        const valorTrafico = totalTrafico.textContent.trim();

        console.log(`📊 Estado actual: Logística=${valorLogistica}, Tráfico=${valorTrafico}`);

        // Si ambos están en 0, intentar recargar una vez más
        if (valorLogistica === '0' && valorTrafico === '0') {
          console.log('⚠️ Todos los KPIs están en 0, verificando si hay datos en localStorage...');

          // Verificar localStorage
          const sharedData = localStorage.getItem('erp_shared_data');
          const traficoData = localStorage.getItem('erp_trafico');
          const logisticaData = localStorage.getItem('erp_logistica');

          if (sharedData || traficoData || logisticaData) {
            console.log('📋 Se encontraron datos en localStorage, forzando recarga...');
            if (
              window.reportesSystem &&
              typeof window.reportesSystem.loadDashboardData === 'function'
            ) {
              window.reportesSystem.loadDashboardData().then(() => {
                console.log('✅ Dashboard recargado después de verificación');
              });
            }
          } else {
            console.log(
              'ℹ️ No se encontraron datos en localStorage. Esto es normal si aún no has creado registros en el sistema.'
            );
          }
        } else {
          console.log('✅ Los KPIs muestran datos, el sistema está funcionando correctamente');
        }
      }
    }, 5000);

    // Actualizar KPI de Logística automáticamente
    setTimeout(() => {
      if (typeof window.verificarLogistica === 'function') {
        console.log('🔄 Actualizando KPI de Logística...');
        window.verificarLogistica();
      }
    }, 1500);

    // Verificación adicional: recargar datos si el KPI de logística es 0
    setTimeout(async () => {
      const kpiLogistica = document.getElementById('totalLogistica');
      if (
        kpiLogistica &&
        (kpiLogistica.textContent === '0' || kpiLogistica.textContent.trim() === '')
      ) {
        console.log('⚠️ KPI de Logística es 0, verificando datos en localStorage...');
        const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
        if (sharedData.registros && Object.keys(sharedData.registros).length > 0) {
          console.log(
            `📋 Encontrados ${Object.keys(sharedData.registros).length} registros en localStorage, recargando dashboard...`
          );
          if (
            window.reportesSystem &&
            typeof window.reportesSystem.loadDashboardData === 'function'
          ) {
            await window.reportesSystem.loadDashboardData();
          }
        }
      }
    }, 3000);

    // Cargar recordatorios de mantenimiento
    inicializarRecordatoriosMantenimiento();

    // También intentar cargar después de que Firebase esté completamente listo
    if (window.addEventListener) {
      window.addEventListener(
        'firebaseReady',
        () => {
          setTimeout(() => {
            if (typeof window.cargarRecordatoriosMantenimiento === 'function') {
              console.log('🔄 Cargando recordatorios después de Firebase ready...');
              window.cargarRecordatoriosMantenimiento().catch(error => {
                console.error('❌ Error al cargar recordatorios:', error);
              });
            }
          }, 1000);
        },
        { once: true }
      );
    }

    // Forzar redimensionamiento de gráficos después de la inicialización
    setTimeout(() => {
      if (window.reportesSystem && window.reportesSystem.charts) {
        Object.values(window.reportesSystem.charts).forEach(chart => {
          if (chart && typeof chart.resize === 'function') {
            chart.resize();
          }
        });
      }
    }, 500);
  }, 100);
}

// Ejecutar inmediatamente si el DOM ya está listo, o esperar a DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarReportesInline);
} else {
  // DOM ya está listo, ejecutar inmediatamente
  console.log('📄 reportes-inline.js: DOM ya está listo, ejecutando inicialización inmediatamente');
  inicializarReportesInline();
}

// Prevenir scroll automático
window.addEventListener('load', () => {
  // Forzar scroll al inicio de la página
  window.scrollTo(0, 0);

  // Prevenir scroll automático en cambios de tamaño
  window.addEventListener('resize', () => {
    if (window.reportesSystem && window.reportesSystem.charts) {
      Object.values(window.reportesSystem.charts).forEach(chart => {
        if (chart && typeof chart.resize === 'function') {
          chart.resize();
        }
      });
    }
  });
});

// Función global para recargar tractocamiones manualmente
window.recargarTractocamiones = function () {
  if (
    window.reportesSystem &&
    typeof window.reportesSystem.loadTractocamionesFilter === 'function'
  ) {
    console.log('🔄 Recargando tractocamiones manualmente...');
    window.reportesSystem.loadTractocamionesFilter();
  } else {
    console.warn('⚠️ Sistema de reportes no disponible');
  }
};

// Función global para verificar y crear tractocamiones de ejemplo
window.crearTractocamionesEjemplo = function () {
  console.log('🔄 Creando tractocamiones de ejemplo...');
  const tractocamionesEjemplo = [
    { numero: 'TR001', marca: 'Volvo', modelo: 'FH16', año: 2023 },
    { numero: 'TR002', marca: 'Scania', modelo: 'R500', año: 2022 },
    { numero: 'TR003', marca: 'Mercedes', modelo: 'Actros', año: 2023 },
    { numero: 'TR004', marca: 'MAN', modelo: 'TGX', año: 2022 },
    { numero: 'TR005', marca: 'Iveco', modelo: 'Hi-Way', año: 2023 }
  ];

  localStorage.setItem('erp_configuracion_economicos', JSON.stringify(tractocamionesEjemplo));
  console.log('✅ Tractocamiones de ejemplo creados en localStorage');

  // Recargar el filtro
  if (
    window.reportesSystem &&
    typeof window.reportesSystem.loadTractocamionesFilter === 'function'
  ) {
    window.reportesSystem.loadTractocamionesFilter();
  }
};

// Función para verificar errores de JavaScript
window.verificarErroresJS = function () {
  console.log('🔍 === VERIFICANDO ERRORES DE JAVASCRIPT ===');

  // Verificar si hay errores en la consola
  const originalError = console.error;
  const errores = [];

  console.error = function (...args) {
    errores.push(args.join(' '));
    originalError.apply(console, args);
  };

  // Verificar dependencias
  console.log('📊 Verificando dependencias:');
  console.log(
    `   - Chart.js: ${typeof Chart !== 'undefined' ? '✅ Disponible' : '❌ No disponible'}`
  );
  console.log(
    `   - Bootstrap: ${typeof bootstrap !== 'undefined' ? '✅ Disponible' : '❌ No disponible'}`
  );
  console.log(`   - jQuery: ${typeof $ !== 'undefined' ? '✅ Disponible' : '❌ No disponible'}`);

  // Verificar scripts cargados
  console.log('\n📊 Verificando scripts:');
  const scripts = document.querySelectorAll('script[src]');
  scripts.forEach(script => {
    console.log(`   - ${script.src}: ${script.readyState || 'Cargado'}`);
  });

  // Intentar cargar el script manualmente si no está disponible
  if (typeof ReportesSystem === 'undefined') {
    console.log('\n🔄 Intentando cargar reportes.js manualmente...');

    const script = document.createElement('script');
    // Detectar ruta base dinámicamente
    const { pathname } = window.location;
    const basePath = pathname.includes('/pages/') ? '../assets/scripts/' : 'assets/scripts/';
    script.src = `${basePath}reportes.js`;
    script.onload = function () {
      console.log('✅ reportes.js cargado manualmente');
      if (typeof ReportesSystem !== 'undefined') {
        console.log('✅ Clase ReportesSystem disponible');
        try {
          window.reportesSystem = new ReportesSystem();
          console.log('✅ Sistema inicializado correctamente');
        } catch (error) {
          console.error('❌ Error inicializando sistema:', error);
        }
      } else {
        console.error('❌ Clase ReportesSystem aún no disponible');
      }
    };
    script.onerror = function () {
      console.error('❌ Error cargando reportes.js');
    };
    document.head.appendChild(script);
  }

  console.log('🔍 === FIN VERIFICACIÓN ===');
};

// Función global para diagnosticar KPIs sin depender del sistema
window.diagnosticarKPIsBasico = function () {
  console.log('🔍 === DIAGNÓSTICO KPIs BÁSICO ===');

  // 1. Verificar si el sistema está inicializado
  console.log('📊 Estado del sistema:');
  console.log(
    `   - window.reportesSystem: ${window.reportesSystem ? '✅ Disponible' : '❌ No disponible'}`
  );
  console.log(
    `   - ReportesSystem class: ${typeof ReportesSystem !== 'undefined' ? '✅ Disponible' : '❌ No disponible'}`
  );

  // 2. Verificar elementos del DOM
  console.log('\n📊 Verificando elementos del DOM:');
  const elementosKPI = [
    'totalLogistica',
    'totalTrafico',
    'totalDiesel',
    'totalMantenimiento',
    'totalInventario',
    'totalCXC',
    'totalCXP',
    'totalTesoreria',
    'totalIncidencias'
  ];

  elementosKPI.forEach(id => {
    const elemento = document.getElementById(id);
    console.log(`   - ${id}: ${elemento ? '✅ Existe' : '❌ No existe'}`);
    if (elemento) {
      console.log(`     Valor actual: "${elemento.textContent}"`);
    }
  });

  // 3. Verificar datos en localStorage
  console.log('\n📊 Verificando datos en localStorage:');
  const clavesDatos = [
    'erp_shared_data',
    'erp_logistica',
    'erp_trafico',
    'erp_operadores',
    'erp_diesel_movimientos',
    'erp_mantenimientos',
    'erp_inv_refacciones_stock',
    'erp_cxc_data',
    'erp_cxp_data',
    'erp_tesoreria_movimientos',
    'erp_operadores_incidencias'
  ];

  clavesDatos.forEach(clave => {
    const datos = localStorage.getItem(clave);
    if (datos) {
      try {
        const parsed = JSON.parse(datos);
        const cantidad = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
        console.log(`   - ${clave}: ${cantidad} elementos`);
      } catch (error) {
        console.log(`   - ${clave}: Error parseando - ${error.message}`);
      }
    } else {
      console.log(`   - ${clave}: No disponible`);
    }
  });

  // 4. Intentar inicializar el sistema si no está disponible
  if (!window.reportesSystem && typeof ReportesSystem !== 'undefined') {
    console.log('\n🔄 Intentando inicializar el sistema...');
    try {
      window.reportesSystem = new ReportesSystem();
      console.log('✅ Sistema inicializado correctamente');

      // Esperar un poco y verificar si se cargaron los datos
      setTimeout(() => {
        if (window.reportesSystem && window.reportesSystem.currentData) {
          console.log(`📊 Datos cargados: ${window.reportesSystem.currentData.length} elementos`);
          window.reportesSystem.updateKPIs(window.reportesSystem.currentData);
        } else {
          console.log('⚠️ Sistema inicializado pero sin datos');
        }
      }, 2000);
    } catch (error) {
      console.error('❌ Error inicializando el sistema:', error);
    }
  }

  console.log('🔍 === FIN DIAGNÓSTICO ===');
};

// Función para actualizar KPIs manualmente usando datos de localStorage
window.actualizarKPIsManual = function () {
  console.log('🔄 === ACTUALIZANDO KPIs MANUALMENTE ===');

  // Si el sistema de reportes está disponible, usarlo para asegurar que se apliquen los filtros
  if (window.reportesSystem && typeof window.reportesSystem.loadDashboardData === 'function') {
    console.log('🔄 Usando sistema de reportes para actualizar KPIs con filtros...');
    window.reportesSystem.loadDashboardData();
    return;
  }

  try {
    // 1. Logística - contar registros con filtro de mes
    let logisticaData = [];
    const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
    if (sharedData.registros && typeof sharedData.registros === 'object') {
      logisticaData = Object.values(sharedData.registros);
    } else {
      const oldData = JSON.parse(localStorage.getItem('erp_logistica') || '{}');
      logisticaData = Array.isArray(oldData) ? oldData : Object.values(oldData);
    }

    // Aplicar filtro de mes si está disponible
    let totalLogistica = logisticaData.length;
    if (window.reportesSystem && typeof window.reportesSystem.perteneceAlMesFiltro === 'function') {
      const filtro = window.reportesSystem.obtenerMesFiltro();
      const logisticaFiltrada = logisticaData.filter(item => {
        const fecha = item.fechaEnvio || item.fecha || item.fechaCreacion;
        return window.reportesSystem.perteneceAlMesFiltro(fecha);
      });
      totalLogistica = logisticaFiltrada.length;
      console.log(
        `📅 Logística filtrada por mes ${filtro.mes + 1}/${filtro.año}: ${totalLogistica} de ${logisticaData.length}`
      );
    }

    document.getElementById('totalLogistica').textContent = totalLogistica.toLocaleString();
    console.log(`✅ Logística: ${totalLogistica}`);

    // 2. Tráfico - contar registros de tráfico
    const traficoData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
    let traficoCount = 0;
    if (traficoData.trafico && typeof traficoData.trafico === 'object') {
      traficoCount = Object.keys(traficoData.trafico).length;
    } else {
      const traficoArray = JSON.parse(localStorage.getItem('erp_trafico') || '[]');
      traficoCount = Array.isArray(traficoArray)
        ? traficoArray.length
        : Object.keys(traficoArray).length;
    }
    document.getElementById('totalTrafico').textContent = traficoCount.toLocaleString();
    console.log(`✅ Tráfico: ${traficoCount}`);

    // 3. Diesel - sumar costos
    const dieselData = JSON.parse(localStorage.getItem('erp_diesel_movimientos') || '[]');
    const totalDiesel = dieselData.reduce(
      (sum, movimiento) => sum + (parseFloat(movimiento.costoTotal) || 0),
      0
    );
    document.getElementById('totalDiesel').textContent = `$${totalDiesel.toLocaleString()}`;
    console.log(`✅ Diesel: $${totalDiesel.toLocaleString()}`);

    // 4. Mantenimiento - contar registros
    const mantenimientoData = JSON.parse(localStorage.getItem('erp_mantenimientos') || '[]');
    const totalMantenimiento = mantenimientoData.length;
    document.getElementById('totalMantenimiento').textContent = totalMantenimiento.toLocaleString();
    console.log(`✅ Mantenimiento: ${totalMantenimiento}`);

    // 5. Inventario - contar productos
    const inventarioData = JSON.parse(localStorage.getItem('erp_inv_refacciones_stock') || '{}');
    const totalInventario = Object.keys(inventarioData).length;
    document.getElementById('totalInventario').textContent = totalInventario.toLocaleString();
    console.log(`✅ Inventario: ${totalInventario}`);

    // 6. CXC - sumar montos pendientes
    const cxcData = JSON.parse(localStorage.getItem('erp_cxc_data') || '[]');
    const totalCXC = cxcData.reduce((sum, factura) => {
      if (factura.estado === 'pendiente' && factura.montoPendiente) {
        return sum + parseFloat(factura.montoPendiente);
      }
      return sum;
    }, 0);
    document.getElementById('totalCXC').textContent = `$${totalCXC.toLocaleString()}`;
    console.log(`✅ CXC: $${totalCXC.toLocaleString()}`);

    // 7. CXP - sumar montos pendientes
    const cxpData = JSON.parse(localStorage.getItem('erp_cxp_data') || '[]');
    const totalCXP = cxpData.reduce((sum, factura) => {
      if (factura.estado === 'pendiente' && factura.montoPendiente) {
        return sum + parseFloat(factura.montoPendiente);
      }
      return sum;
    }, 0);
    document.getElementById('totalCXP').textContent = `$${totalCXP.toLocaleString()}`;
    console.log(`✅ CXP: $${totalCXP.toLocaleString()}`);

    // 8. Tesorería - sumar movimientos
    const tesoreriaData = JSON.parse(localStorage.getItem('erp_tesoreria_movimientos') || '[]');
    const totalTesoreria = tesoreriaData.reduce(
      (sum, movimiento) => sum + (parseFloat(movimiento.monto) || 0),
      0
    );
    document.getElementById('totalTesoreria').textContent = `$${totalTesoreria.toLocaleString()}`;
    console.log(`✅ Tesorería: $${totalTesoreria.toLocaleString()}`);

    // 9. Incidencias - contar registros
    const incidenciasData = JSON.parse(localStorage.getItem('erp_operadores_incidencias') || '[]');
    const totalIncidencias = incidenciasData.length;
    document.getElementById('totalIncidencias').textContent = totalIncidencias.toLocaleString();
    console.log(`✅ Incidencias: ${totalIncidencias}`);

    console.log('✅ Todos los KPIs actualizados manualmente');
  } catch (error) {
    console.error('❌ Error actualizando KPIs manualmente:', error);
  }

  console.log('🔄 === FIN ACTUALIZACIÓN MANUAL ===');
};

// Función global para verificar localStorage
window.verificarLocalStorage = function () {
  console.log('🔍 Verificando localStorage...');
  const allKeys = Object.keys(localStorage);
  console.log('📋 Todas las claves:', allKeys);

  const configKeys = allKeys.filter(
    key =>
      key.includes('configuracion') || key.includes('economico') || key.includes('tractocamion')
  );
  console.log('📋 Claves de configuración:', configKeys);

  configKeys.forEach(key => {
    const data = localStorage.getItem(key);
    console.log(`📋 ${key}:`, data);
  });
};

// Función global para verificar erp_shared_data específicamente
window.verificarSharedData = function () {
  console.log('🔍 Verificando erp_shared_data...');
  const sharedData = localStorage.getItem('erp_shared_data');
  if (sharedData) {
    try {
      const parsedData = JSON.parse(sharedData);
      console.log('📋 Estructura completa de erp_shared_data:', parsedData);

      // Verificar cada sección
      Object.keys(parsedData).forEach(section => {
        const sectionData = parsedData[section];
        console.log(`📋 Sección ${section}:`, sectionData);
        console.log(`📋 Tipo: ${typeof sectionData}, Es array: ${Array.isArray(sectionData)}`);

        if (typeof sectionData === 'object' && !Array.isArray(sectionData)) {
          console.log(`📋 Claves en ${section}:`, Object.keys(sectionData));
        }
      });
    } catch (error) {
      console.error('❌ Error parseando erp_shared_data:', error);
    }
  } else {
    console.log('❌ No se encontró erp_shared_data');
  }
};

// Función para verificar datos de mantenimiento
window.verificarMantenimiento = function () {
  console.log('🔧 Verificando datos de mantenimiento...');

  // Verificar erp_mantenimientos (clave correcta)
  const mantenimientosData = localStorage.getItem('erp_mantenimientos');
  console.log('📋 Datos en erp_mantenimientos:', mantenimientosData);

  if (mantenimientosData) {
    try {
      const parsed = JSON.parse(mantenimientosData);
      console.log('📊 Total registros de mantenimiento:', parsed.length);
      console.log('📋 Registros:', parsed);
    } catch (error) {
      console.error('❌ Error parseando erp_mantenimientos:', error);
    }
  } else {
    console.log('❌ No se encontraron datos en erp_mantenimientos');
  }

  // Verificar erp_mantenimiento (clave incorrecta)
  const mantenimientoData = localStorage.getItem('erp_mantenimiento');
  console.log('📋 Datos en erp_mantenimiento:', mantenimientoData);

  // Actualizar KPI
  window.actualizarKPIMantenimiento();
};

// Función para actualizar KPI de mantenimiento
window.actualizarKPIMantenimiento = function () {
  console.log('🔄 Actualizando KPI de mantenimiento...');

  let registrosMantenimiento = 0;
  try {
    const mantenimientoData = JSON.parse(localStorage.getItem('erp_mantenimientos') || '[]');
    registrosMantenimiento = mantenimientoData.length;
    console.log('📊 Total registros de mantenimiento:', registrosMantenimiento);
  } catch (error) {
    console.error('Error cargando registros de mantenimiento:', error);
    registrosMantenimiento = 0;
  }

  const kpiElement = document.getElementById('totalMantenimiento');
  if (kpiElement) {
    kpiElement.textContent = registrosMantenimiento.toLocaleString();
    console.log('✅ KPI de mantenimiento actualizado a:', registrosMantenimiento);
  } else {
    console.log('❌ Elemento totalMantenimiento no encontrado');
  }
};

// Función para verificar gastos de operadores
window.verificarGastosOperadores = function () {
  console.log('💰 Verificando gastos de operadores...');

  const gastosData = localStorage.getItem('erp_operadores_gastos');
  console.log('📋 Datos en erp_operadores_gastos:', gastosData);

  if (gastosData) {
    try {
      const parsed = JSON.parse(gastosData);
      console.log('📊 Total gastos:', parsed.length);
      console.log('📋 Gastos:', parsed);

      // Verificar gastos pagados
      const gastosPagados = parsed.filter(gasto => gasto.estado === 'pagado');
      console.log('✅ Gastos pagados:', gastosPagados.length);
      console.log('📋 Gastos pagados:', gastosPagados);

      // Calcular total
      const total = parsed.reduce((sum, gasto) => {
        if (gasto.estado === 'pagado' && gasto.monto) {
          return sum + parseFloat(gasto.monto);
        }
        return sum;
      }, 0);
      console.log('💰 Total gastos pagados:', total);
    } catch (error) {
      console.error('❌ Error parseando gastos:', error);
    }
  } else {
    console.log('❌ No se encontraron gastos');
  }

  // Actualizar KPI
  window.actualizarKPITesoreria();
};

// Función para actualizar KPI de tesorería
window.actualizarKPITesoreria = function () {
  console.log('🔄 Actualizando KPI de tesorería...');

  let totalTesoreria = 0;
  try {
    const operadoresData = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');
    totalTesoreria = operadoresData.reduce((sum, gasto) => {
      // Sumar todos los gastos que tienen monto (independientemente del estado)
      if (gasto.monto) {
        return sum + parseFloat(gasto.monto);
      }
      return sum;
    }, 0);
    console.log('💰 Total gastos de operadores:', totalTesoreria);
  } catch (error) {
    console.error('Error cargando gastos de operadores:', error);
    totalTesoreria = 0;
  }

  const kpiElement = document.getElementById('totalTesoreria');
  if (kpiElement) {
    kpiElement.textContent = `$${totalTesoreria.toLocaleString()}`;
    console.log('✅ KPI de tesorería actualizado a:', totalTesoreria);
  } else {
    console.log('❌ Elemento totalTesoreria no encontrado');
  }
};

// Función global para verificar datos de logística
// Función para verificar datos del gráfico de pastel
window.verificarGraficoPastel = function () {
  console.log('🔍 Verificando datos del gráfico de pastel...');

  try {
    // Verificar datos en erp_shared_data
    const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
    console.log('📋 Datos en erp_shared_data:', sharedData);

    if (sharedData.registros && sharedData.registros.logistica) {
      const logisticaData = sharedData.registros.logistica;
      console.log('📋 Datos de logística:', logisticaData);

      if (Array.isArray(logisticaData)) {
        logisticaData.forEach((item, index) => {
          console.log(`📋 Registro ${index + 1}:`, {
            numeroRegistro: item.numeroRegistro,
            tipoServicio: item.tipoServicio,
            cliente: item.cliente
          });
        });
      }
    }

    // Verificar si el gráfico existe
    if (
      window.reportesSystem &&
      window.reportesSystem.charts &&
      window.reportesSystem.charts.servicios
    ) {
      const chart = window.reportesSystem.charts.servicios;
      console.log('📊 Datos actuales del gráfico de pastel:', {
        labels: chart.data.labels,
        data: chart.data.datasets[0].data
      });
    } else {
      console.warn('⚠️ Gráfico de pastel no encontrado');
    }
  } catch (error) {
    console.error('❌ Error verificando gráfico de pastel:', error);
  }
};

// Función para forzar actualización del gráfico de pastel
window.actualizarGraficoPastel = function () {
  console.log('🔄 Forzando actualización del gráfico de pastel...');

  if (window.reportesSystem) {
    // Recargar datos
    const realData = window.reportesSystem.loadRealModuleData();
    console.log('📋 Datos recargados:', realData);

    // Actualizar gráfico
    if (window.reportesSystem.charts && window.reportesSystem.charts.servicios) {
      const serviceData = window.reportesSystem.groupDataByService(realData);
      console.log('📊 Datos de servicios procesados:', serviceData);

      window.reportesSystem.charts.servicios.data.labels = serviceData.labels;
      window.reportesSystem.charts.servicios.data.datasets[0].data = serviceData.values;
      window.reportesSystem.charts.servicios.update();

      console.log('✅ Gráfico de pastel actualizado');
    } else {
      console.warn('⚠️ Gráfico de pastel no encontrado');
    }
  } else {
    console.warn('⚠️ Sistema de reportes no encontrado');
  }
};

// Función para corregir el registro de logística existente
window.corregirRegistroLogistica = function () {
  console.log('🔧 Corrigiendo registro de logística...');

  try {
    const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');

    if (
      sharedData.registros &&
      sharedData.registros.logistica &&
      Array.isArray(sharedData.registros.logistica)
    ) {
      const logisticaData = sharedData.registros.logistica;

      // Buscar el registro 2025-09-00001
      const registro = logisticaData.find(item => item.numeroRegistro === '2025-09-00001');

      if (registro) {
        console.log('📋 Registro encontrado:', registro);

        // Agregar tipoServicio si no existe
        if (!registro.tipoServicio) {
          registro.tipoServicio = 'General'; // Valor por defecto
          console.log('✅ Agregado tipoServicio: General');
        }

        // Guardar los datos corregidos
        localStorage.setItem('erp_shared_data', JSON.stringify(sharedData));
        console.log('💾 Datos corregidos guardados');

        // Actualizar el gráfico
        window.actualizarGraficoPastel();

        return true;
      }
      console.warn('⚠️ Registro 2025-09-00001 no encontrado');
      return false;
    }
    console.warn('⚠️ No hay datos de logística en erp_shared_data');
    return false;
  } catch (error) {
    console.error('❌ Error corrigiendo registro:', error);
    return false;
  }
};

// NOTA: La función cargarRecordatoriosMantenimiento está definida al inicio del archivo
// (dentro de la IIFE que se ejecuta inmediatamente) para asegurar que esté disponible
// antes de que cualquier código intente llamarla. No redefinir aquí.

// Función duplicada eliminada - usar la definición al inicio del archivo

// Función para marcar un mantenimiento como completado
window.marcarComoCompletado = async function (mantenimientoId) {
  console.log('✅ Marcando mantenimiento como completado:', mantenimientoId);

  try {
    let mantenimiento = null;
    let mantenimientos = [];

    // PRIORIDAD 1: Buscar y actualizar en Firebase
    if (window.firebaseRepos && window.firebaseRepos.mantenimiento) {
      try {
        const repoMantenimiento = window.firebaseRepos.mantenimiento;

        // Asegurar que el repositorio esté inicializado
        if (
          typeof repoMantenimiento.init === 'function' &&
          (!repoMantenimiento.db || !repoMantenimiento.tenantId)
        ) {
          await repoMantenimiento.init();
        }

        if (repoMantenimiento.db && repoMantenimiento.tenantId) {
          // Obtener el mantenimiento desde Firebase
          mantenimientos = await repoMantenimiento.getAllRegistros();
          mantenimiento = mantenimientos.find(
            m => m.id === mantenimientoId || String(m.id) === String(mantenimientoId)
          );

          if (mantenimiento) {
            // Marcar como completado
            mantenimiento.servicioCompletado = true;
            mantenimiento.fechaCompletado = new Date().toISOString().split('T')[0];

            // Guardar en Firebase
            await repoMantenimiento.save(mantenimientoId, mantenimiento);
            console.log('✅ Mantenimiento actualizado en Firebase');
          }
        }
      } catch (firebaseError) {
        console.warn('⚠️ Error actualizando en Firebase, intentando localStorage:', firebaseError);
      }
    }

    // PRIORIDAD 2: Fallback a localStorage si Firebase no funcionó
    if (!mantenimiento) {
      const mantenimientosLocal = JSON.parse(localStorage.getItem('erp_mantenimientos') || '[]');
      mantenimiento = mantenimientosLocal.find(
        m => m.id === mantenimientoId || String(m.id) === String(mantenimientoId)
      );

      if (mantenimiento) {
        // Marcar como completado
        mantenimiento.servicioCompletado = true;
        mantenimiento.fechaCompletado = new Date().toISOString().split('T')[0];

        // Guardar en localStorage
        localStorage.setItem('erp_mantenimientos', JSON.stringify(mantenimientosLocal));
        console.log('✅ Mantenimiento actualizado en localStorage');
      }
    }

    if (mantenimiento) {
      // Recargar recordatorios
      await window.cargarRecordatoriosMantenimiento();

      console.log('✅ Mantenimiento marcado como completado');

      // Mostrar notificación
      if (typeof window.showNotification === 'function') {
        window.showNotification('Mantenimiento marcado como completado', 'success');
      }
    } else {
      console.log('❌ Mantenimiento no encontrado');
      if (typeof window.showNotification === 'function') {
        window.showNotification('Mantenimiento no encontrado', 'error');
      }
    }
  } catch (error) {
    console.error('❌ Error marcando mantenimiento como completado:', error);
    if (typeof window.showNotification === 'function') {
      window.showNotification('Error al marcar mantenimiento como completado', 'error');
    }
  }
};

// Función para verificar el estado del gráfico de pastel
window.verificarGraficoPastel = function () {
  console.log('🔍 Verificando estado del gráfico de pastel...');

  // Verificar canvas
  const canvas = document.getElementById('serviciosChart');
  console.log('📊 Canvas encontrado:', canvas ? 'Sí' : 'No');

  // Verificar gráfico en el sistema
  if (window.reportesSystem && window.reportesSystem.charts) {
    console.log('📊 Sistema de reportes:', window.reportesSystem);
    console.log('📊 Gráfico de servicios:', window.reportesSystem.charts.servicios);

    if (window.reportesSystem.charts.servicios) {
      console.log('📊 Datos del gráfico:', window.reportesSystem.charts.servicios.data);
    } else {
      console.log('❌ Gráfico de servicios no inicializado');
    }
  } else {
    console.log('❌ Sistema de reportes no disponible');
  }

  // Verificar datos de logística
  window.verificarLogistica();
};

// Función para forzar actualización del gráfico de pastel
window.actualizarGraficoPastel = function () {
  console.log('🔄 Forzando actualización del gráfico de pastel...');

  if (window.reportesSystem) {
    // Recargar datos de logística
    const logisticaData = window.reportesSystem.loadLogisticaDataForChart();
    console.log('📊 Datos de logística cargados:', logisticaData);

    // Actualizar gráfico
    window.reportesSystem.updateCharts(logisticaData);

    console.log('✅ Gráfico de pastel actualizado');
  } else {
    console.log('❌ Sistema de reportes no disponible');
  }
};

// Función para limpiar datos de prueba y usar solo el registro real
window.limpiarDatosPruebaYUsarReal = function () {
  console.log('🧹 Limpiando datos de prueba y configurando registro real...');

  try {
    const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
    console.log('📋 Datos actuales:', sharedData);

    // Limpiar datos de prueba (si existen)
    if (sharedData.registros && sharedData.registros.logistica) {
      delete sharedData.registros.logistica;
      console.log('🧹 Datos de prueba eliminados');
    }

    // Buscar el registro real 2025-09-0001
    const registroKey = '2025-09-0001';
    if (sharedData.registros && sharedData.registros[registroKey]) {
      const registro = sharedData.registros[registroKey];
      console.log('📋 Registro real encontrado:', registro);

      // Agregar tipoServicio si no existe
      if (!registro.tipoServicio) {
        registro.tipoServicio = 'General'; // Valor por defecto
        console.log('✅ Agregado tipoServicio: General al registro real');
      } else {
        console.log('ℹ️ El registro ya tiene tipoServicio:', registro.tipoServicio);
      }

      // Guardar cambios
      localStorage.setItem('erp_shared_data', JSON.stringify(sharedData));

      console.log('✅ Configuración completada - solo registro real');

      // Actualizar gráfico y KPI
      setTimeout(() => {
        window.actualizarGraficoPastel();
        window.verificarLogistica();
      }, 500);

      return true;
    }
    console.log('❌ Registro real 2025-09-0001 no encontrado');
    return false;
  } catch (error) {
    console.error('❌ Error limpiando datos:', error);
    return false;
  }
};

// Función para agregar tipoServicio al registro real de logística
window.agregarTipoServicioReal = function () {
  console.log('🔧 Agregando tipoServicio al registro real de logística...');

  try {
    const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
    console.log('📋 Datos actuales:', sharedData);

    if (sharedData.registros) {
      // Buscar el registro 2025-09-0001 en registros
      const registroKey = '2025-09-0001';
      if (sharedData.registros[registroKey]) {
        const registro = sharedData.registros[registroKey];
        console.log('📋 Registro encontrado:', registro);

        // Agregar tipoServicio si no existe
        if (!registro.tipoServicio) {
          registro.tipoServicio = 'General'; // Valor por defecto
          console.log('✅ Agregado tipoServicio: General al registro real');
        } else {
          console.log('ℹ️ El registro ya tiene tipoServicio:', registro.tipoServicio);
        }

        // Guardar cambios
        localStorage.setItem('erp_shared_data', JSON.stringify(sharedData));

        // Actualizar gráfico
        setTimeout(() => {
          window.actualizarGraficoPastel();
        }, 500);

        return true;
      }
      console.log('❌ Registro 2025-09-0001 no encontrado en registros');
      return false;
    }
    console.log('❌ No hay sección registros en erp_shared_data');
    return false;
  } catch (error) {
    console.error('❌ Error agregando tipoServicio:', error);
    return false;
  }
};

// Función para crear datos de prueba para el gráfico de pastel
window.crearDatosPruebaPastel = function () {
  console.log('🔧 Creando datos de prueba para el gráfico de pastel...');

  try {
    // Crear datos de prueba con tipos de servicio
    const datosPrueba = [
      { numeroRegistro: '2025-09-0001', tipoServicio: 'General' },
      { numeroRegistro: '2025-09-0002', tipoServicio: 'Urgente' },
      { numeroRegistro: '2025-09-0003', tipoServicio: 'Doble Operador' }
    ];

    // Guardar en localStorage
    const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
    if (!sharedData.registros) {
      sharedData.registros = {};
    }
    sharedData.registros.logistica = datosPrueba;
    localStorage.setItem('erp_shared_data', JSON.stringify(sharedData));

    console.log('✅ Datos de prueba creados:', datosPrueba);

    // Actualizar gráfico
    setTimeout(() => {
      window.actualizarGraficoPastel();
    }, 500);
  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  }
};

// Función para crear recordatorio de prueba
window.crearRecordatorioPrueba = function () {
  console.log('🔧 Creando recordatorio de mantenimiento de prueba...');

  try {
    const mantenimientos = JSON.parse(localStorage.getItem('erp_mantenimientos') || '[]');

    // Crear un registro de mantenimiento con fecha próxima (dentro del rango de 15 días)
    const hoy = new Date();
    const proximaFecha = new Date();
    proximaFecha.setDate(hoy.getDate() + 5); // 5 días desde hoy (dentro del rango de 15 días)

    const mantenimientoPrueba = {
      id: `mant_${Date.now()}`,
      economico: 'TRACT-001',
      fechaSiguienteServicio: proximaFecha.toISOString().split('T')[0],
      kilometrajesiguienteservicio: 150000,
      estadoeconomico: 'En servicio',
      fechaRegistro: hoy.toISOString().split('T')[0],
      servicioCompletado: false
    };

    mantenimientos.push(mantenimientoPrueba);
    localStorage.setItem('erp_mantenimientos', JSON.stringify(mantenimientos));

    console.log('✅ Recordatorio de prueba creado:', mantenimientoPrueba);

    // Recargar recordatorios
    window.cargarRecordatoriosMantenimiento();

    return mantenimientoPrueba;
  } catch (error) {
    console.error('❌ Error creando recordatorio de prueba:', error);
    return null;
  }
};

// Función para reinicializar el gráfico de pastel desde cero
window.reinicializarGraficoPastel = function () {
  console.log('🔄 Reinicializando gráfico de pastel...');

  if (window.reportesSystem) {
    // Destruir gráfico existente si existe
    if (window.reportesSystem.charts.servicios) {
      window.reportesSystem.charts.servicios.destroy();
      window.reportesSystem.charts.servicios = null;
    }

    // Recrear el gráfico
    const canvas = document.getElementById('serviciosChart');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      window.reportesSystem.charts.servicios = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['General', 'Urgente', 'Doble Operador'],
          datasets: [
            {
              data: [1, 0, 0],
              backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 205, 86, 0.8)'
              ]
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });

      console.log('✅ Gráfico de pastel reinicializado');

      // Actualizar con datos reales después de un momento
      setTimeout(() => {
        window.actualizarGraficoPastel();
      }, 1000);
    } else {
      console.log('❌ Canvas no encontrado');
    }
  } else {
    console.log('❌ Sistema de reportes no disponible');
  }
};

// Función alternativa para corregir el registro (ejecutable desde consola)
window.corregirRegistroDirecto = function () {
  console.log('🔧 Corrigiendo registro de logística directamente...');

  try {
    const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
    console.log('📋 Datos actuales:', sharedData);

    if (
      sharedData.registros &&
      sharedData.registros.logistica &&
      Array.isArray(sharedData.registros.logistica)
    ) {
      const logisticaData = sharedData.registros.logistica;
      console.log('📋 Datos de logística:', logisticaData);

      // Buscar el registro 2025-09-00001
      const registro = logisticaData.find(item => item.numeroRegistro === '2025-09-00001');

      if (registro) {
        console.log('📋 Registro encontrado:', registro);

        // Agregar tipoServicio si no existe
        if (!registro.tipoServicio) {
          registro.tipoServicio = 'General';
          console.log('✅ Agregado tipoServicio: General');

          // Guardar los datos corregidos
          localStorage.setItem('erp_shared_data', JSON.stringify(sharedData));
          console.log('💾 Datos corregidos guardados');

          // Recargar la página para aplicar cambios
          console.log('🔄 Recargando página...');
          window.location.reload();

          return true;
        }
        console.log('✅ El registro ya tiene tipoServicio:', registro.tipoServicio);
        return true;
      }
      console.warn('⚠️ Registro 2025-09-00001 no encontrado');
      return false;
    }
    console.warn('⚠️ No hay datos de logística en erp_shared_data');
    return false;
  } catch (error) {
    console.error('❌ Error corrigiendo registro:', error);
    return false;
  }
};

// Función para verificar datos de CXC
window.verificarCXC = function () {
  console.log('🔍 Verificando datos de CXC...');

  try {
    // Verificar datos en erp_cxc_data (clave correcta)
    const cxcData = JSON.parse(localStorage.getItem('erp_cxc_data') || '[]');
    console.log('📋 Datos de CXC encontrados:', cxcData);

    if (Array.isArray(cxcData)) {
      cxcData.forEach((factura, index) => {
        console.log(`📋 Factura ${index + 1}:`, {
          id: factura.id,
          cliente: factura.cliente,
          monto: factura.monto,
          estado: factura.estado,
          montoPendiente: factura.montoPendiente
        });
      });

      // Calcular totales
      const totalGeneral = cxcData.reduce((sum, f) => sum + (parseFloat(f.monto) || 0), 0);
      const totalPendiente = cxcData.reduce(
        (sum, f) => sum + (parseFloat(f.montoPendiente) || 0),
        0
      );
      const facturasPendientes = cxcData.filter(f => f.estado !== 'pagada').length;

      console.log('📊 Totales CXC:', {
        totalGeneral: totalGeneral,
        totalPendiente: totalPendiente,
        facturasPendientes: facturasPendientes
      });
    }
  } catch (error) {
    console.error('❌ Error verificando CXC:', error);
  }
};

// Función para verificar datos de Diesel
window.verificarDiesel = function () {
  console.log('🔍 Verificando datos de Diesel...');

  try {
    // Verificar datos en erp_diesel_movimientos
    const dieselData = JSON.parse(localStorage.getItem('erp_diesel_movimientos') || '[]');
    console.log('📋 Datos de Diesel encontrados:', dieselData);

    if (Array.isArray(dieselData)) {
      dieselData.forEach((movimiento, index) => {
        console.log(`📋 Movimiento ${index + 1}:`, {
          id: movimiento.id,
          fechaConsumo: movimiento.fechaConsumo,
          economico: movimiento.economico,
          litros: movimiento.litros,
          costoPorLitro: movimiento.costoPorLitro,
          costoTotal: movimiento.costoTotal,
          formaPago: movimiento.formaPago
        });
      });

      // Calcular totales
      const totalGeneral = dieselData.reduce((sum, m) => sum + (parseFloat(m.costoTotal) || 0), 0);
      const totalLitros = dieselData.reduce((sum, m) => sum + (parseFloat(m.litros) || 0), 0);

      console.log('📊 Totales Diesel:', {
        totalMovimientos: dieselData.length,
        totalLitros: totalLitros,
        totalCosto: totalGeneral
      });
    }
  } catch (error) {
    console.error('❌ Error verificando Diesel:', error);
  }
};

window.verificarLogistica = function () {
  console.log('🔍 Verificando datos de logística...');

  // Verificar todas las claves de localStorage
  const allKeys = Object.keys(localStorage);
  console.log('📋 Todas las claves en localStorage:', allKeys);

  // Verificar específicamente erp_shared_data (donde se guardan los datos de logística)
  console.log('🔍 Verificando erp_shared_data...');
  const sharedData = localStorage.getItem('erp_shared_data');
  if (sharedData) {
    try {
      const parsedSharedData = JSON.parse(sharedData);
      console.log('📋 Datos en erp_shared_data:', parsedSharedData);

      // Buscar datos de logística en erp_shared_data (puede estar en 'logistica' o 'envios')
      let logisticaData = null;
      let seccionEncontrada = null;

      if (parsedSharedData.logistica) {
        console.log(
          '📋 Datos de logística encontrados en erp_shared_data.logistica:',
          parsedSharedData.logistica
        );
        logisticaData = parsedSharedData.logistica;
        seccionEncontrada = 'logistica';
      } else if (parsedSharedData.registros) {
        console.log('📋 Verificando erp_shared_data.registros:', parsedSharedData.registros);
        console.log('📋 Tipo de datos en registros:', typeof parsedSharedData.registros);
        console.log('📋 Es array?', Array.isArray(parsedSharedData.registros));
        console.log('📋 Claves en registros:', Object.keys(parsedSharedData.registros));

        // Si es un objeto, buscar arrays dentro
        if (
          typeof parsedSharedData.registros === 'object' &&
          !Array.isArray(parsedSharedData.registros)
        ) {
          // Primero verificar si hay un array llamado 'logistica'
          if (
            parsedSharedData.registros.logistica &&
            Array.isArray(parsedSharedData.registros.logistica)
          ) {
            console.log(
              '📋 Array logistica encontrado en registros:',
              parsedSharedData.registros.logistica
            );
            logisticaData = parsedSharedData.registros.logistica;
            seccionEncontrada = 'registros.logistica';
          } else {
            // Si no hay array logistica, convertir a array y filtrar
            const registrosArray = Object.values(parsedSharedData.registros);
            console.log('📋 Registros convertidos a array:', registrosArray);

            // Todos los registros en erp_shared_data.registros son de logística
            const logisticaRegistros = registrosArray;

            if (logisticaRegistros.length > 0) {
              console.log('📋 Registros de logística encontrados:', logisticaRegistros);
              logisticaData = logisticaRegistros;
              seccionEncontrada = 'registros';
            }
          }
        } else if (Array.isArray(parsedSharedData.registros)) {
          logisticaData = parsedSharedData.registros;
          seccionEncontrada = 'registros';
        }
      } else if (parsedSharedData.envios) {
        console.log(
          '📋 Datos de logística encontrados en erp_shared_data.envios:',
          parsedSharedData.envios
        );
        console.log('📋 Tipo de datos en envios:', typeof parsedSharedData.envios);
        console.log('📋 Es array?', Array.isArray(parsedSharedData.envios));
        console.log('📋 Claves en envios:', Object.keys(parsedSharedData.envios));

        // Si es un objeto, buscar arrays dentro
        if (
          typeof parsedSharedData.envios === 'object' &&
          !Array.isArray(parsedSharedData.envios)
        ) {
          // Buscar arrays dentro del objeto envios
          for (const key in parsedSharedData.envios) {
            const value = parsedSharedData.envios[key];
            if (Array.isArray(value) && value.length > 0) {
              console.log(`📋 Array encontrado en envios.${key}:`, value);
              logisticaData = value;
              seccionEncontrada = `envios.${key}`;
              break;
            }
          }
        } else if (Array.isArray(parsedSharedData.envios)) {
          logisticaData = parsedSharedData.envios;
          seccionEncontrada = 'envios';
        }
      }

      if (logisticaData && Array.isArray(logisticaData)) {
        // Buscar el registro específico
        const registroEspecifico = logisticaData.find(
          item =>
            item.numeroRegistro === '2025-09-00001' ||
            item.id === '2025-09-00001' ||
            item.numero === '2025-09-00001'
        );

        if (registroEspecifico) {
          console.log('✅ Registro encontrado:', registroEspecifico);
        } else {
          console.log('❌ Registro 2025-09-00001 no encontrado');
          if (logisticaData.length > 0) {
            console.log(
              '📋 Números de registro disponibles:',
              logisticaData.map(
                item => item.numeroRegistro || item.id || item.numero || 'Sin número'
              )
            );
          }
        }

        console.log(`📊 Total registros de logística (SIN filtrar): ${logisticaData.length}`);
        console.log(`📋 Sección utilizada: erp_shared_data.${seccionEncontrada}`);

        // Filtrar por mes usando el sistema de reportes
        let logisticaFiltrada = logisticaData;
        if (
          window.reportesSystem &&
          typeof window.reportesSystem.perteneceAlMesFiltro === 'function'
        ) {
          const filtro = window.reportesSystem.obtenerMesFiltro();
          console.log(`📅 Aplicando filtro de mes: ${filtro.mes + 1}/${filtro.año}`);

          logisticaFiltrada = logisticaData.filter(item => {
            const fecha = item.fechaEnvio || item.fecha || item.fechaCreacion;
            return window.reportesSystem.perteneceAlMesFiltro(fecha);
          });

          console.log(
            `📊 Total registros de logística (FILTRADO por mes): ${logisticaFiltrada.length}`
          );
        } else {
          // Si no está disponible el sistema, usar recarga completa
          if (
            window.reportesSystem &&
            typeof window.reportesSystem.loadDashboardData === 'function'
          ) {
            window.reportesSystem.loadDashboardData();
            return;
          }
        }

        // Actualizar el KPI con los datos filtrados
        const kpiLogistica = document.querySelector('#totalLogistica');
        if (kpiLogistica) {
          kpiLogistica.textContent = logisticaFiltrada.length;
          console.log(`✅ KPI de Logística actualizado a: ${logisticaFiltrada.length}`);
        }

        return;
      }
      console.log('❌ No se encontró sección de logística válida en erp_shared_data');
      console.log('📋 Secciones disponibles:', Object.keys(parsedSharedData));
    } catch (error) {
      console.error('❌ Error parseando erp_shared_data:', error);
    }
  } else {
    console.log('❌ No se encontró erp_shared_data en localStorage');
  }

  // Buscar claves relacionadas con logística
  const logisticaKeys = allKeys.filter(
    key =>
      key.toLowerCase().includes('logistica') ||
      key.toLowerCase().includes('logistic') ||
      key.toLowerCase().includes('envio') ||
      key.toLowerCase().includes('envios')
  );
  console.log('📋 Claves relacionadas con logística:', logisticaKeys);

  // Verificar cada clave relacionada con logística
  let logisticaData = [];
  let claveEncontrada = null;

  for (const key of logisticaKeys) {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          console.log(`📋 Datos encontrados en ${key}:`, parsedData);
          logisticaData = parsedData;
          claveEncontrada = key;
          break;
        }
      } catch (error) {
        console.warn(`⚠️ Error parseando ${key}:`, error);
      }
    }
  }

  // Si no se encontró en claves específicas, buscar en todas las claves
  if (logisticaData.length === 0) {
    console.log('🔍 Buscando en todas las claves...');
    for (const key of allKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsedData = JSON.parse(data);
          if (Array.isArray(parsedData)) {
            // Buscar si algún elemento tiene características de logística
            const tieneLogistica = parsedData.some(
              item =>
                item.numeroRegistro === '2025-09-00001' ||
                item.id === '2025-09-00001' ||
                item.numero === '2025-09-00001' ||
                (item.departamento && item.departamento.toLowerCase().includes('logistica'))
            );

            if (tieneLogistica) {
              console.log(`📋 Datos de logística encontrados en ${key}:`, parsedData);
              logisticaData = parsedData;
              claveEncontrada = key;
              break;
            }
          }
        } catch (error) {
          // Ignorar errores de parsing
        }
      }
    }
  }

  console.log('📋 Datos de logística encontrados:', logisticaData);
  console.log(`📊 Total registros de logística (SIN filtrar): ${logisticaData.length}`);
  console.log(`📋 Clave utilizada: ${claveEncontrada || 'No encontrada'}`);

  // Filtrar por mes si hay datos
  if (
    logisticaData.length > 0 &&
    window.reportesSystem &&
    typeof window.reportesSystem.perteneceAlMesFiltro === 'function'
  ) {
    const filtro = window.reportesSystem.obtenerMesFiltro();
    console.log(`📅 Aplicando filtro de mes: ${filtro.mes + 1}/${filtro.año}`);

    const logisticaFiltrada = logisticaData.filter(item => {
      const fecha = item.fechaEnvio || item.fecha || item.fechaCreacion;
      return window.reportesSystem.perteneceAlMesFiltro(fecha);
    });

    console.log(`📊 Total registros de logística (FILTRADO por mes): ${logisticaFiltrada.length}`);

    // Actualizar el KPI con los datos filtrados
    const kpiLogistica = document.querySelector('#totalLogistica');
    if (kpiLogistica) {
      kpiLogistica.textContent = logisticaFiltrada.length;
      console.log(`✅ KPI de Logística actualizado a: ${logisticaFiltrada.length}`);
    }
  }

  // Verificar datos del dashboard
  if (window.reportesSystem && window.reportesSystem.currentData) {
    const dashboardData = window.reportesSystem.currentData;
    const logisticaDashboard = dashboardData.filter(item => item.departamento === 'logistica');
    console.log('📋 Datos de logística en dashboard:', logisticaDashboard.length);
  }

  // Verificar el KPI específicamente
  const kpiLogistica = document.querySelector('#totalLogistica');
  if (kpiLogistica) {
    console.log('📊 KPI de Logística actual:', kpiLogistica.textContent);
  } else {
    console.log('❌ No se encontró el elemento del KPI de Logística');
  }
};

// Función global para forzar actualización del KPI de Logística
window.actualizarKPILogistica = function () {
  console.log('🔄 Forzando actualización del KPI de Logística...');

  // Verificar específicamente erp_shared_data (donde se guardan los datos de logística)
  const sharedData = localStorage.getItem('erp_shared_data');
  if (sharedData) {
    try {
      const parsedSharedData = JSON.parse(sharedData);

      // Buscar datos de logística en erp_shared_data (puede estar en 'logistica' o 'envios')
      let logisticaData = null;
      let seccionEncontrada = null;

      if (parsedSharedData.logistica) {
        logisticaData = parsedSharedData.logistica;
        seccionEncontrada = 'logistica';
      } else if (parsedSharedData.registros) {
        // Si es un objeto, buscar arrays dentro
        if (
          typeof parsedSharedData.registros === 'object' &&
          !Array.isArray(parsedSharedData.registros)
        ) {
          // Primero verificar si hay un array llamado 'logistica'
          if (
            parsedSharedData.registros.logistica &&
            Array.isArray(parsedSharedData.registros.logistica)
          ) {
            logisticaData = parsedSharedData.registros.logistica;
            seccionEncontrada = 'registros.logistica';
          } else {
            // Si no hay array logistica, convertir a array y filtrar
            const registrosArray = Object.values(parsedSharedData.registros);

            // Filtrar solo registros de logística
            const logisticaRegistros = registrosArray.filter(
              registro =>
                registro.departamento === 'logistica' ||
                registro.numeroRegistro === '2025-09-00001' ||
                registro.numeroRegistro === '2025-09-0001'
            );

            if (logisticaRegistros.length > 0) {
              logisticaData = logisticaRegistros;
              seccionEncontrada = 'registros (filtrado)';
            }
          }
        } else if (Array.isArray(parsedSharedData.registros)) {
          logisticaData = parsedSharedData.registros;
          seccionEncontrada = 'registros';
        }
      } else if (parsedSharedData.envios) {
        logisticaData = parsedSharedData.envios;
        seccionEncontrada = 'envios';
      }

      if (logisticaData && Array.isArray(logisticaData)) {
        const totalRegistrosSinFiltrar = logisticaData.length;
        console.log(`📊 Total registros de logística (SIN filtrar): ${totalRegistrosSinFiltrar}`);
        console.log(`📋 Datos encontrados en erp_shared_data.${seccionEncontrada}`);

        // Filtrar por mes usando el sistema de reportes
        let logisticaFiltrada = logisticaData;
        if (
          window.reportesSystem &&
          typeof window.reportesSystem.perteneceAlMesFiltro === 'function'
        ) {
          const filtro = window.reportesSystem.obtenerMesFiltro();
          console.log(`📅 Aplicando filtro de mes: ${filtro.mes + 1}/${filtro.año}`);

          logisticaFiltrada = logisticaData.filter(item => {
            const fecha = item.fechaEnvio || item.fecha || item.fechaCreacion;
            return window.reportesSystem.perteneceAlMesFiltro(fecha);
          });

          console.log(
            `📊 Total registros de logística (FILTRADO por mes): ${logisticaFiltrada.length}`
          );
        } else {
          // Si no está disponible el sistema, usar recarga completa
          if (
            window.reportesSystem &&
            typeof window.reportesSystem.loadDashboardData === 'function'
          ) {
            window.reportesSystem.loadDashboardData();
            return;
          }
        }

        // Actualizar el KPI con los datos filtrados
        const kpiLogistica = document.querySelector('#totalLogistica');
        if (kpiLogistica) {
          kpiLogistica.textContent = logisticaFiltrada.length;
          console.log(`✅ KPI de Logística actualizado a: ${logisticaFiltrada.length}`);
        } else {
          console.log('❌ No se encontró el elemento del KPI de Logística');
        }
        return;
      }
    } catch (error) {
      console.error('❌ Error parseando erp_shared_data:', error);
    }
  }

  // Si no se encontró en erp_shared_data, buscar en otras claves
  const allKeys = Object.keys(localStorage);
  let logisticaData = [];
  let claveEncontrada = null;

  // Buscar en claves relacionadas con logística
  const logisticaKeys = allKeys.filter(
    key =>
      key.toLowerCase().includes('logistica') ||
      key.toLowerCase().includes('logistic') ||
      key.toLowerCase().includes('envio') ||
      key.toLowerCase().includes('envios')
  );

  for (const key of logisticaKeys) {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          logisticaData = parsedData;
          claveEncontrada = key;
          break;
        }
      } catch (error) {
        console.warn(`⚠️ Error parseando ${key}:`, error);
      }
    }
  }

  // Si no se encontró, buscar en todas las claves
  if (logisticaData.length === 0) {
    for (const key of allKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsedData = JSON.parse(data);
          if (Array.isArray(parsedData)) {
            const tieneLogistica = parsedData.some(
              item =>
                item.numeroRegistro === '2025-09-00001' ||
                item.id === '2025-09-00001' ||
                item.numero === '2025-09-00001' ||
                (item.departamento && item.departamento.toLowerCase().includes('logistica'))
            );

            if (tieneLogistica) {
              logisticaData = parsedData;
              claveEncontrada = key;
              break;
            }
          }
        } catch (error) {
          // Ignorar errores de parsing
        }
      }
    }
  }

  const totalRegistrosSinFiltrar = logisticaData.length;
  console.log(`📊 Total registros de logística (SIN filtrar): ${totalRegistrosSinFiltrar}`);
  console.log(`📋 Clave utilizada: ${claveEncontrada || 'No encontrada'}`);

  // Filtrar por mes usando el sistema de reportes
  let logisticaFiltrada = logisticaData;
  if (window.reportesSystem && typeof window.reportesSystem.perteneceAlMesFiltro === 'function') {
    const filtro = window.reportesSystem.obtenerMesFiltro();
    console.log(`📅 Aplicando filtro de mes: ${filtro.mes + 1}/${filtro.año}`);

    logisticaFiltrada = logisticaData.filter(item => {
      const fecha = item.fechaEnvio || item.fecha || item.fechaCreacion;
      return window.reportesSystem.perteneceAlMesFiltro(fecha);
    });

    console.log(`📊 Total registros de logística (FILTRADO por mes): ${logisticaFiltrada.length}`);
  } else {
    // Si no está disponible el sistema, usar recarga completa
    if (window.reportesSystem && typeof window.reportesSystem.loadDashboardData === 'function') {
      window.reportesSystem.loadDashboardData();
      return;
    }
  }

  // Actualizar el KPI con los datos filtrados
  const kpiLogistica = document.querySelector('#totalLogistica');
  if (kpiLogistica) {
    kpiLogistica.textContent = logisticaFiltrada.length;
    console.log(`✅ KPI de Logística actualizado a: ${logisticaFiltrada.length}`);
  } else {
    console.log('❌ No se encontró el elemento del KPI de Logística');
  }
};

// Función global para recargar datos del dashboard
window.recargarDashboard = function () {
  if (window.reportesSystem && typeof window.reportesSystem.loadDashboardData === 'function') {
    console.log('🔄 Recargando datos del dashboard...');
    window.reportesSystem.loadDashboardData();
  } else {
    console.warn('⚠️ Sistema de reportes no disponible');
  }
};

// Función global para crear un registro de prueba en logística
window.crearRegistroLogisticaPrueba = function () {
  console.log('🔄 Creando registro de prueba en logística...');

  // Obtener datos actuales
  const sharedData = localStorage.getItem('erp_shared_data');
  let parsedData = {};

  if (sharedData) {
    try {
      parsedData = JSON.parse(sharedData);
    } catch (error) {
      console.error('❌ Error parseando erp_shared_data:', error);
      parsedData = {};
    }
  }

  // Crear estructura si no existe
  if (!parsedData.registros) {
    parsedData.registros = {};
  }

  // Crear registro de prueba
  const registroPrueba = {
    id: Date.now(),
    numeroRegistro: '2025-09-00001',
    fecha: new Date().toISOString().split('T')[0],
    cliente: 'Cliente Prueba',
    origen: 'Ciudad A',
    destino: 'Ciudad B',
    tractocamion: 'TR001',
    operador: 'Operador Prueba',
    departamento: 'logistica',
    createdAt: new Date().toISOString()
  };

  // Agregar el registro usando el número de registro como clave
  parsedData.registros['2025-09-00001'] = registroPrueba;

  // Guardar en localStorage
  localStorage.setItem('erp_shared_data', JSON.stringify(parsedData));

  console.log('✅ Registro de prueba creado:', registroPrueba);

  // Contar registros de logística
  const registrosArray = Object.values(parsedData.registros);
  const logisticaRegistros = registrosArray.filter(
    registro =>
      registro.departamento === 'logistica' ||
      registro.numeroRegistro === '2025-09-00001' ||
      registro.numeroRegistro === '2025-09-0001'
  );

  console.log('📊 Total registros de logística (SIN filtrar):', logisticaRegistros.length);

  // Filtrar por mes antes de actualizar el KPI
  let logisticaFiltrada = logisticaRegistros;
  if (window.reportesSystem && typeof window.reportesSystem.perteneceAlMesFiltro === 'function') {
    const filtro = window.reportesSystem.obtenerMesFiltro();
    console.log(`📅 Aplicando filtro de mes: ${filtro.mes + 1}/${filtro.año}`);

    logisticaFiltrada = logisticaRegistros.filter(item => {
      const fecha = item.fechaEnvio || item.fecha || item.fechaCreacion;
      return window.reportesSystem.perteneceAlMesFiltro(fecha);
    });

    console.log(`📊 Total registros de logística (FILTRADO por mes): ${logisticaFiltrada.length}`);
  } else {
    // Si no está disponible, recargar el dashboard completo
    if (window.reportesSystem && typeof window.reportesSystem.loadDashboardData === 'function') {
      window.reportesSystem.loadDashboardData();
      return;
    }
  }

  // Actualizar el KPI con los datos filtrados
  const kpiLogistica = document.querySelector('#totalLogistica');
  if (kpiLogistica) {
    kpiLogistica.textContent = logisticaFiltrada.length;
    console.log(`✅ KPI de Logística actualizado a: ${logisticaFiltrada.length}`);
  }
};

// Suscribirse a económicos de Firestore para mantener cache actualizado
document.addEventListener('DOMContentLoaded', () => {
  // Función para actualizar dropdown cuando esté disponible
  const actualizarDropdown = async () => {
    if (window.reportesSystem && window.reportesSystem.actualizarDropdownEconomicos) {
      try {
        // Intentar cargar datos de viajes si están disponibles
        let viajesData = [];
        if (window.reportesSystem && typeof window.reportesSystem.loadViajesData === 'function') {
          try {
            viajesData = window.reportesSystem.loadViajesData() || [];
            if (!Array.isArray(viajesData)) {
              viajesData = [];
            }
          } catch (e) {
            console.warn('⚠️ No se pudieron cargar datos de viajes para el dropdown:', e);
          }
        }
        await window.reportesSystem.actualizarDropdownEconomicos(viajesData);
      } catch (err) {
        console.warn('⚠️ Error actualizando dropdown:', err);
      }
    }
  };

  // Intentar actualizar después de que los datos estén cargados
  setTimeout(actualizarDropdown, 1000);

  // Intentar de nuevo después de 3 segundos para asegurar que los datos estén listos
  setTimeout(actualizarDropdown, 3000);

  // Suscribirse a cambios en Firestore
  setTimeout(() => {
    if (window.economicosRepo) {
      try {
        if (window.__economicosUnsub) {
          window.__economicosUnsub();
        }
        window.__economicosUnsub = window.economicosRepo.subscribe(list => {
          window.__economicosCache = list;
          console.log('📦 Cache de económicos actualizado desde Firestore:', list.length);
          // Actualizar dropdown cuando se actualice el cache
          actualizarDropdown();
        });
      } catch (e) {
        console.warn('⚠️ No se pudo suscribir a economicosRepo en reportes:', e);
      }
    }
  }, 1000);
});
