/**
 * Scripts específicos para la página de Inventario
 * Incluye: gestión de sidebar, módulos, plataformas y exportación
 */

(function () {
  'use strict';

  // ===== RESTAURACIÓN DEL ESTADO DEL SIDEBAR =====
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

// ===== CARGA DE RESPALDO MÍNIMA DE DATAPERSISTENCE =====
// Carga de respaldo mínima de DataPersistence
function ensureDataPersistence() {
  if (typeof window.DataPersistence === 'undefined') {
    window.DataPersistence = {
      storageKey: 'erp_shared_data',
      getData() {
        try {
          const d = localStorage.getItem(this.storageKey);
          return d ? JSON.parse(d) : null;
        } catch (_) {
          return null;
        }
      }
    };
  }
}

// Ejecutar inmediatamente
ensureDataPersistence();

// ===== CONFIGURACIÓN DE MÓDULOS (LAZY LOADING) =====
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
      scripts: [`${basePath}connection-monitor.js`, `${basePath}error-handler-panel.js`],
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

// Cargar módulo de conexión después de un delay
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    window
      .loadModule('connection')
      .catch(err => console.warn('No se pudo cargar módulo connection:', err));
  }, 1000);
});

// ===== ACTUALIZACIÓN DE PANEL DE PLATAFORMAS CARGADAS =====
// Actualizar panel de plataformas cargadas
window.actualizarPanelPlataformasCargadas = async function () {
  console.log('🔄 Actualizando panel de plataformas cargadas...');

  let traficoData = [];

  // PRIORIDAD: Intentar obtener desde Firebase
  if (window.firebaseRepos?.trafico) {
    try {
      console.log('📊 Obteniendo datos de tráfico desde Firebase...');
      const repo = window.firebaseRepos.trafico;

      // Esperar a que el repositorio esté listo
      if (window.ERPState.getFlag('firebaseReposReady')) {
        await window.ERPState.getFlag('firebaseReposReady');
      }

      const allRegistros = await repo.getAll();
      console.log('✅ Registros obtenidos desde Firebase:', allRegistros.length);

      // Convertir a array para compatibilidad
      traficoData = Array.isArray(allRegistros) ? allRegistros : Object.values(allRegistros);
    } catch (error) {
      console.warn('⚠️ Error obteniendo datos desde Firebase, usando localStorage:', error);
    }
  }

  // RESPALDO: Leer desde localStorage si Firebase no tiene datos
  if (traficoData.length === 0) {
    console.log('📊 Obteniendo datos de tráfico desde localStorage...');

    // Intentar desde erp_shared_data primero (donde se guardan los datos de tráfico)
    const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
    if (sharedData.trafico && typeof sharedData.trafico === 'object') {
      traficoData = Object.values(sharedData.trafico);
      console.log('✅ Datos obtenidos desde erp_shared_data.trafico:', traficoData.length);
    } else {
      // Fallback a erp_trafico (formato antiguo)
      const traficoArray = JSON.parse(localStorage.getItem('erp_trafico') || '[]');
      traficoData = Array.isArray(traficoArray) ? traficoArray : Object.values(traficoArray);
      console.log('✅ Datos obtenidos desde erp_trafico:', traficoData.length);
    }
  }

  console.log('📋 Total de registros de tráfico encontrados:', traficoData.length);

  // Filtrar plataformas que están realmente listas para descarga
  // Buscar registros con estado "Cargado" (con mayúscula) o "cargado" (minúscula)
  const plataformasListasParaDescarga = traficoData.filter(r => {
    if (!r) {
      return false;
    }

    const regId = r.numeroRegistro || r.registroId || r.id || r.numero || 'N/A';

    // Obtener estado de la plataforma (puede estar en estadoPlataforma o estado)
    const estadoPlataformaRaw = r.estadoPlataforma || r.estado || '';
    const estadoPlataforma = estadoPlataformaRaw.toString().trim();
    const estadoPlataformaLower = estadoPlataforma.toLowerCase();

    // Verificar si el estado es "Cargado" o "cargado"
    // También considerar que si no tiene estado pero tiene datos, probablemente está cargado
    const esCargado =
      estadoPlataformaLower === 'cargado' ||
      estadoPlataforma === 'Cargado' ||
      estadoPlataforma === 'cargado';

    // NO incluir si está descargado
    const esDescargado =
      estadoPlataformaLower === 'descargado' || estadoPlataforma === 'Descargado';

    if (esDescargado) {
      console.log(
        `⏭️ Registro ${regId} descartado: ya está descargado (estado="${estadoPlataforma}")`
      );
      return false;
    }

    // Verificar si tiene datos básicos (debe tener al menos número de registro o identificador)
    const tieneDatosBasicos = Boolean(r.numeroRegistro || r.registroId || r.id || r.numero);

    const resultado = esCargado && tieneDatosBasicos;

    console.log(
      `🔍 Registro ${regId}: estadoPlataforma="${estadoPlataforma}", esCargado=${esCargado}, tieneDatosBasicos=${tieneDatosBasicos}, resultado=${resultado}`
    );

    if (resultado) {
      console.log(`✅ Plataforma ${regId} está lista para descarga`);
    }

    return resultado;
  });

  console.log('📊 Plataformas listas para descarga:', plataformasListasParaDescarga.length);

  // Guardar plataformas completas sin filtrar para filtros y paginación
  if (window.ERPState && typeof window.ERPState.setTemp === 'function') {
    window.ERPState.setTemp(
      'plataformasDescargaCompletasSinFiltrar',
      plataformasListasParaDescarga
    );
  }

  const cargados = plataformasListasParaDescarga.map(
    r =>
      r.numeroRegistro ||
      r.registroId ||
      r.id ||
      r.numero ||
      (r.registro && (r.registro.numeroRegistro || r.registro.id)) ||
      'N/A'
  );

  const panel = document.getElementById('panelPlataformasCargadas');
  const badge = document.getElementById('badgePlataformasCargadas');

  if (!panel || !badge) {
    console.warn(
      '⚠️ No se encontraron elementos panelPlataformasCargadas o badgePlataformasCargadas'
    );
    return;
  }

  console.log(`📊 Actualizando badge con ${cargados.length} plataformas`);
  badge.textContent = cargados.length;

  // Aplicar filtros (esto inicializará la paginación con los resultados filtrados)
  aplicarFiltrosPlataformasDescarga();

  console.log('✅ Panel de plataformas cargadas actualizado');
};

// ===== RENDERIZACIÓN DE PLATAFORMAS =====
// Función para renderizar plataformas con paginación
function renderizarPlataformasDescargaPaginadas(panel) {
  if (!panel) {
    panel = document.getElementById('panelPlataformasCargadas');
  }
  if (
    !panel ||
    !window.ERPState.getPagination('plataformasDescarga') ||
    !window.ERPState.getTemp('plataformasDescargaCompletas')
  ) {
    console.warn(
      '⚠️ No se puede renderizar: panel=',
      Boolean(panel),
      'paginacion=',
      Boolean(window.ERPState.getPagination('plataformasDescarga')),
      'plataformas=',
      Boolean(window.ERPState.getTemp('plataformasDescargaCompletas'))
    );
    return;
  }

  const plataformasIds =
    window.ERPState.getPagination('plataformasDescarga').obtenerRegistrosPagina();
  const plataformasMap = {};
  window.ERPState.getTemp('plataformasDescargaCompletas').forEach((reg, index) => {
    const regId = reg.numeroRegistro || reg.registroId || reg.id || reg.numero || String(index);
    plataformasMap[String(regId)] = reg;
  });

  const plataformasPagina = plataformasIds
    .map(id => plataformasMap[id])
    .filter(reg => reg !== undefined);

  renderizarPlataformasDescargaDirectamente(plataformasPagina, panel);

  // Actualizar controles de paginación
  const contenedorPaginacion = document.getElementById('paginacionPlataformasDescarga');
  if (contenedorPaginacion && window.ERPState.getPagination('plataformasDescarga')) {
    contenedorPaginacion.innerHTML = window.ERPState.getPagination(
      'plataformasDescarga'
    ).generarControlesPaginacion(
      'paginacionPlataformasDescarga',
      'cambiarPaginaPlataformasDescarga'
    );
  }

  console.log(
    `✅ ${window.ERPState.getPagination('plataformasDescarga').totalRegistros} plataformas esperando descarga cargadas (página ${window.ERPState.getPagination('plataformasDescarga').paginaActual} de ${window.ERPState.getPagination('plataformasDescarga').obtenerTotalPaginas()})`
  );
}

// Función para renderizar plataformas directamente
function renderizarPlataformasDescargaDirectamente(plataformasListasParaDescarga, panel) {
  if (!panel) {
    panel = document.getElementById('panelPlataformasCargadas');
  }
  if (!panel) {
    return;
  }

  // Renderizar tabla de alertas
  let html = `
    <div class="table-responsive">
      <table class="table table-sm table-hover">
        <thead>
          <tr>
            <th>Registro</th>
            <th>Plataforma</th>
            <th>Estancia</th>
            <th>Días Esperando</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
  `;

  plataformasListasParaDescarga.forEach(reg => {
    // Buscar número de registro en múltiples campos posibles
    const regId =
      reg.numeroRegistro ||
      reg.registroId ||
      reg.id ||
      reg.numero ||
      (reg.registro && (reg.registro.numeroRegistro || reg.registro.id)) ||
      'N/A';

    const plataforma = reg.placasPlataforma || reg.plataforma || reg.tipoPlataforma || 'N/A';
    const estancia = reg.LugarDestino || reg.destino || 'N/A';

    // Obtener fecha de carga con múltiples opciones y validar
    const fechaCargaStr =
      reg.fechaCarga ||
      reg.fechaEnvio ||
      reg.fechaCreacion ||
      reg.ultimaActualizacion ||
      reg.fecha ||
      null;
    let diasEspera = 0;

    if (fechaCargaStr) {
      try {
        const fechaCarga = new Date(fechaCargaStr);
        // Validar que la fecha sea válida
        if (!isNaN(fechaCarga.getTime())) {
          // Normalizar ambas fechas a medianoche (00:00:00) para comparar días calendario
          const fechaCargaNormalizada = new Date(
            fechaCarga.getFullYear(),
            fechaCarga.getMonth(),
            fechaCarga.getDate()
          );
          const ahora = new Date();
          const ahoraNormalizada = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

          // Calcular diferencia en días calendario
          const diferencia = ahoraNormalizada - fechaCargaNormalizada;
          diasEspera = Math.floor(diferencia / (1000 * 60 * 60 * 24));

          // Asegurar que no sea negativo
          if (diasEspera < 0) {
            diasEspera = 0;
          }

          console.log(
            `📅 Registro ${regId}: fechaCarga=${fechaCargaStr}, días espera=${diasEspera}`
          );
        } else {
          console.warn(`⚠️ Fecha inválida para registro ${regId}:`, fechaCargaStr);
        }
      } catch (error) {
        console.warn(
          `⚠️ Error calculando días de espera para registro ${regId}:`,
          error,
          fechaCargaStr
        );
        diasEspera = 0;
      }
    } else {
      console.warn(`⚠️ No se encontró fecha de carga para registro ${regId}`);
    }

    html += `
      <tr>
        <td><strong>${regId}</strong></td>
        <td>${plataforma}</td>
        <td>${estancia}</td>
        <td>
          <span class="badge bg-${diasEspera > 2 ? 'danger' : diasEspera > 0 ? 'warning' : 'info'}">
            ${diasEspera > 0 ? `${diasEspera} día${diasEspera !== 1 ? 's' : ''}` : 'Hoy'}
          </span>
        </td>
        <td>
          <a href="trafico.html" class="btn btn-sm btn-success" target="_blank" title="Ir a Tráfico para descargar">
            <i class="fas fa-truck-loading"></i> Gestionar
          </a>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table></div>';
  html += '<div id="paginacionPlataformasDescarga" class="mt-3"></div>';
  panel.innerHTML = html;
}

// ===== FILTROS DE PLATAFORMAS =====
// Función para aplicar filtros a plataformas esperando descarga
window.aplicarFiltrosPlataformasDescarga = function () {
  const plataformasSinFiltrar =
    window.ERPState?.getTemp('plataformasDescargaCompletasSinFiltrar') || [];
  if (!plataformasSinFiltrar || plataformasSinFiltrar.length === 0) {
    console.warn('⚠️ No hay plataformas para filtrar');
    return;
  }

  // Obtener valores de los filtros
  const filtroRegistro = (document.getElementById('filtroRegistroDescarga')?.value || '')
    .trim()
    .toLowerCase();
  const filtroPlataforma = (document.getElementById('filtroPlataformaDescarga')?.value || '')
    .trim()
    .toLowerCase();
  const filtroEstancia = (document.getElementById('filtroEstanciaDescarga')?.value || '')
    .trim()
    .toLowerCase();
  const filtroDias = document.getElementById('filtroDiasDescarga')?.value || '';

  // Filtrar plataformas
  const plataformasFiltradas = plataformasSinFiltrar.filter(reg => {
    // Filtro por registro
    if (filtroRegistro) {
      const regId = (reg.numeroRegistro || reg.registroId || reg.id || reg.numero || '')
        .toString()
        .toLowerCase();
      if (!regId.includes(filtroRegistro)) {
        return false;
      }
    }

    // Filtro por plataforma
    if (filtroPlataforma) {
      const plataforma = (reg.placasPlataforma || reg.plataforma || reg.tipoPlataforma || '')
        .toString()
        .toLowerCase();
      if (!plataforma.includes(filtroPlataforma)) {
        return false;
      }
    }

    // Filtro por estancia
    if (filtroEstancia) {
      const estancia = (reg.LugarDestino || reg.destino || '').toString().toLowerCase();
      if (!estancia.includes(filtroEstancia)) {
        return false;
      }
    }

    // Filtro por días esperando
    if (filtroDias) {
      const fechaCargaStr =
        reg.fechaCarga ||
        reg.fechaEnvio ||
        reg.fechaCreacion ||
        reg.ultimaActualizacion ||
        reg.fecha ||
        null;
      let diasEspera = 0;

      if (fechaCargaStr) {
        try {
          const fechaCarga = new Date(fechaCargaStr);
          if (!isNaN(fechaCarga.getTime())) {
            const fechaCargaNormalizada = new Date(
              fechaCarga.getFullYear(),
              fechaCarga.getMonth(),
              fechaCarga.getDate()
            );
            const ahora = new Date();
            const ahoraNormalizada = new Date(
              ahora.getFullYear(),
              ahora.getMonth(),
              ahora.getDate()
            );
            const diferencia = ahoraNormalizada - fechaCargaNormalizada;
            diasEspera = Math.floor(diferencia / (1000 * 60 * 60 * 24));
            if (diasEspera < 0) {
              diasEspera = 0;
            }
          }
        } catch (error) {
          diasEspera = 0;
        }
      }

      if (filtroDias === '0') {
        if (diasEspera !== 0) {
          return false;
        }
      } else if (filtroDias === '1') {
        if (diasEspera !== 1) {
          return false;
        }
      } else if (filtroDias === '2') {
        if (diasEspera !== 2) {
          return false;
        }
      } else if (filtroDias === '3+') {
        if (diasEspera < 3) {
          return false;
        }
      }
    }

    return true;
  });

  console.log(
    `✅ ${plataformasFiltradas.length} plataformas después de aplicar filtros (de ${plataformasSinFiltrar.length} totales)`
  );

  // Ordenar plataformas por número de registro de mayor a menor
  const plataformasOrdenadas = plataformasFiltradas.sort((a, b) => {
    // Obtener números de registro
    const regIdA = a.numeroRegistro || a.registroId || a.id || a.numero || '';
    const regIdB = b.numeroRegistro || b.registroId || b.id || b.numero || '';

    // Convertir a números para comparación correcta
    const numA = parseInt(regIdA.toString().replace(/[^\d]/g, ''), 10) || 0;
    const numB = parseInt(regIdB.toString().replace(/[^\d]/g, ''), 10) || 0;

    // Orden descendente (mayor número primero: 2500025, 2500024, 2500023...)
    return numB - numA;
  });

  const panel = document.getElementById('panelPlataformasCargadas');
  if (!panel) {
    return;
  }

  if (plataformasOrdenadas.length === 0) {
    panel.innerHTML =
      '<p class="text-muted"><i class="fas fa-check-circle text-success"></i> No hay plataformas que coincidan con los filtros</p>';
    // Limpiar paginación
    const contenedorPaginacion = document.getElementById('paginacionPlataformasDescarga');
    if (contenedorPaginacion) {
      contenedorPaginacion.innerHTML = '';
    }
    return;
  }

  // Guardar plataformas filtradas y ordenadas para paginación
  if (window.ERPState && typeof window.ERPState.setTemp === 'function') {
    window.ERPState.setTemp('plataformasDescargaCompletas', plataformasOrdenadas);
  }

  // Inicializar paginación
  const PaginacionManagerClass =
    typeof PaginacionManager !== 'undefined'
      ? PaginacionManager
      : typeof window.PaginacionManager !== 'undefined'
        ? window.PaginacionManager
        : null;

  if (!PaginacionManagerClass) {
    console.warn(
      '⚠️ PaginacionManager no está disponible, mostrando todas las plataformas sin paginación'
    );
    renderizarPlataformasDescargaDirectamente(plataformasOrdenadas, panel);
    return;
  }

  if (!window.ERPState.getPagination('plataformasDescarga')) {
    try {
      if (window.ERPState && typeof window.ERPState.setPagination === 'function') {
        window.ERPState.setPagination('plataformasDescarga', new PaginacionManagerClass());
        console.log('✅ Nueva instancia de PaginacionManager creada para Plataformas Descarga');
      } else {
        console.warn('⚠️ ERPState.setPagination no disponible');
        renderizarPlataformasDescargaDirectamente(plataformasOrdenadas, panel);
        return;
      }
    } catch (error) {
      console.error('❌ Error creando instancia de PaginacionManager:', error);
      renderizarPlataformasDescargaDirectamente(plataformasOrdenadas, panel);
      return;
    }
  }

  try {
    // Crear array de IDs para paginación (ya ordenados)
    const plataformasIds = plataformasOrdenadas.map((reg, index) => {
      const regId = reg.numeroRegistro || reg.registroId || reg.id || reg.numero || String(index);
      return String(regId);
    });
    window.ERPState.getPagination('plataformasDescarga').inicializar(plataformasIds, 15);
    window.ERPState.getPagination('plataformasDescarga').paginaActual = 1;
    console.log(
      `✅ Paginación inicializada: ${window.ERPState.getPagination('plataformasDescarga').totalRegistros} plataformas, ${window.ERPState.getPagination('plataformasDescarga').obtenerTotalPaginas()} páginas`
    );

    // Renderizar plataformas de la página actual
    renderizarPlataformasDescargaPaginadas(panel);
  } catch (error) {
    console.error('❌ Error inicializando paginación:', error);
    renderizarPlataformasDescargaDirectamente(plataformasOrdenadas, panel);
  }
};

// Función global para cambiar de página en plataformas esperando descarga
window.cambiarPaginaPlataformasDescarga = function (accion) {
  if (!window.ERPState.getPagination('plataformasDescarga')) {
    console.warn('⚠️ window.ERPState.getPagination("plataformasDescarga") no está disponible');
    return;
  }

  let cambioExitoso = false;

  if (accion === 'anterior') {
    cambioExitoso = window.ERPState.getPagination('plataformasDescarga').paginaAnterior();
  } else if (accion === 'siguiente') {
    cambioExitoso = window.ERPState.getPagination('plataformasDescarga').paginaSiguiente();
  } else if (typeof accion === 'number') {
    cambioExitoso = window.ERPState.getPagination('plataformasDescarga').irAPagina(accion);
  }

  if (cambioExitoso) {
    renderizarPlataformasDescargaPaginadas();
    // Scroll suave hacia la tabla
    const panel = document.getElementById('panelPlataformasCargadas');
    if (panel) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

// ===== INICIALIZACIÓN DE INVENTARIO =====
// Registrar listener de firebaseReady ANTES de DOMContentLoaded para no perder el evento
(function () {
  console.log('🔧 [inventario-page.js] Registrando listener de firebaseReady...');

  if (window.firebaseReady) {
    console.log('🔥 [inventario-page.js] Firebase ya está listo al cargar script');
    setTimeout(async () => {
      if (typeof window.actualizarPanelPlataformasCargadas === 'function') {
        console.log(
          '✅ [firebaseReady inmediato] Ejecutando actualizarPanelPlataformasCargadas...'
        );
        await window.actualizarPanelPlataformasCargadas();
      } else {
        console.warn(
          '⚠️ [firebaseReady inmediato] actualizarPanelPlataformasCargadas no disponible aún'
        );
      }
    }, 1000);
  }

  if (window.addEventListener) {
    window.addEventListener(
      'firebaseReady',
      async () => {
        console.log(
          '🔥 [firebaseReady event] Firebase listo, actualizando panel de plataformas cargadas...'
        );
        setTimeout(async () => {
          if (typeof window.actualizarPanelPlataformasCargadas === 'function') {
            console.log(
              '✅ [firebaseReady event] Ejecutando actualizarPanelPlataformasCargadas...'
            );
            await window.actualizarPanelPlataformasCargadas();
          } else {
            console.warn(
              '⚠️ [firebaseReady event] actualizarPanelPlataformasCargadas no disponible'
            );
          }
        }, 500);
      },
      { once: true }
    );
    console.log('✅ [inventario-page.js] Listener de firebaseReady registrado');
  }
})();

// Función de inicialización que se puede llamar múltiples veces
async function inicializarInventario() {
  console.log('📋 [inicializarInventario] Función de inicialización ejecutándose...');

  // Esperar a que configuracionManager esté disponible
  (async () => {
    console.log('📋 [inicializarInventario async] Iniciando bloque async interno...');
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts && (!window.configuracionManager || !window.firebaseDb)) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Cargar estancias en el filtro
    if (typeof window.cargarEstanciasEnFiltro === 'function') {
      await window.cargarEstanciasEnFiltro();
    } else {
      console.warn('⚠️ Función cargarEstanciasEnFiltro no disponible');
    }
  })();

  setTimeout(async () => {
    console.log('⏰ [DOMContentLoaded setTimeout] Iniciando proceso de inicialización...');

    // Sincronizar automáticamente con tráfico (esto también actualizará la tabla)
    // sincronizarConTrafico ya llama a actualizarTablaInventario internamente
    if (typeof window.sincronizarConTrafico === 'function') {
      await window.sincronizarConTrafico();
    } else {
      // Si no hay sincronización, cargar la tabla directamente
      if (typeof window.actualizarTablaInventario === 'function') {
        console.log(
          '✅ [DOMContentLoaded setTimeout] Ejecutando actualizarTablaInventario (fallback)...'
        );
        try {
          await window.actualizarTablaInventario();
        } catch (error) {
          console.error(
            '❌ [DOMContentLoaded setTimeout] Error ejecutando actualizarTablaInventario:',
            error
          );
        }
      }
    }

    // Actualizar panel de plataformas cargadas
    if (typeof window.actualizarPanelPlataformasCargadas === 'function') {
      console.log(
        '✅ [DOMContentLoaded setTimeout] Ejecutando actualizarPanelPlataformasCargadas...'
      );
      try {
        await window.actualizarPanelPlataformasCargadas();
      } catch (error) {
        console.error(
          '❌ [DOMContentLoaded setTimeout] Error ejecutando actualizarPanelPlataformasCargadas:',
          error
        );
      }
    }

    console.log('✅ [DOMContentLoaded setTimeout] Inventario de plataformas inicializado');
  }, 1500);

  // Llamada adicional después de un tiempo más largo para asegurar ejecución
  setTimeout(async () => {
    console.log('🔄 [llamada tardía] Verificando panel de plataformas cargadas...');
    if (typeof window.actualizarPanelPlataformasCargadas === 'function') {
      console.log('✅ [llamada tardía] Ejecutando actualizarPanelPlataformasCargadas...');
      await window.actualizarPanelPlataformasCargadas();
    } else {
      console.warn('⚠️ [llamada tardía] actualizarPanelPlataformasCargadas no disponible');
    }
  }, 3000);

  // Esta llamada tardía ya no es necesaria ya que sincronizarConTrafico actualiza la tabla
  // Se mantiene solo para actualizar el panel de plataformas cargadas si es necesario
}

// Inicializar inventario de plataformas al cargar la página
console.log('📋 [inventario-page.js] Estado del DOM:', document.readyState);
if (document.readyState === 'loading') {
  // El DOM aún no está listo, esperar al evento
  document.addEventListener('DOMContentLoaded', inicializarInventario);
  console.log('📋 [inventario-page.js] Esperando DOMContentLoaded...');
} else {
  // El DOM ya está listo, ejecutar inmediatamente
  console.log(
    '📋 [inventario-page.js] DOM ya está listo, ejecutando inicialización inmediatamente...'
  );
  // Ejecutar después de un pequeño delay para asegurar que todos los scripts estén cargados
  setTimeout(() => {
    console.log('📋 [inventario-page.js] Ejecutando inicializarInventario después de delay...');
    inicializarInventario();
  }, 100);
}

// También registrar el listener por si acaso
document.addEventListener('DOMContentLoaded', () => {
  console.log('📋 [inventario-page.js] DOMContentLoaded disparado (listener adicional)');
  // No ejecutar aquí porque ya se ejecutó arriba, solo log
});

// ===== FUNCIONES DE EXPORTAR A EXCEL =====
// (Usando función base común de main.js: window.exportarDatosExcel)

// Exportar Alertas de Stock Bajo - Refacciones
window.exportarAlertasStockBajoExcel = async function () {
  try {
    // Obtener datos de stock bajo usando la misma lógica que actualizarAlertasStockBajo
    // Leer directamente desde localStorage (mismo método que usa inventario.js)
    let stock = {};
    try {
      // La clave correcta es 'erp_inv_refacciones_stock' según inventario.js
      const stockData = localStorage.getItem('erp_inv_refacciones_stock');
      if (stockData) {
        stock = JSON.parse(stockData);
      } else {
        // Intentar desde erp_shared_data
        const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
        if (sharedData.inventario && sharedData.inventario.stock) {
          stock = sharedData.inventario.stock;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error obteniendo stock:', error);
      stock = {};
    }

    const umbralPorDefecto = 5; // Umbral por defecto si no hay stock mínimo definido

    const refaccionesStockBajo = [];
    if (stock && typeof stock === 'object' && !Array.isArray(stock)) {
      Object.keys(stock).forEach(codigo => {
        const item = stock[codigo];
        if (item && typeof item === 'object') {
          const cantidad = item.qty || item.cantidad || 0;
          const stockMinimo =
            item.stockMinimo !== undefined && item.stockMinimo !== null
              ? parseInt(item.stockMinimo, 10)
              : umbralPorDefecto;

          // Incluir refacciones con stock igual o menor al stock mínimo
          // Si stock mínimo es 0, solo alertar cuando el stock es 0
          if (stockMinimo === 0) {
            if (cantidad === 0) {
              refaccionesStockBajo.push({
                codigo: codigo,
                descripcion: item.desc || item.descripcion || 'Sin descripción',
                cantidad: cantidad,
                stockMinimo: stockMinimo,
                unidad: item.unidad || 'piezas'
              });
            }
          } else {
            // Si el stock actual es menor o igual al stock mínimo, está en alerta
            if (cantidad <= stockMinimo) {
              refaccionesStockBajo.push({
                codigo: codigo,
                descripcion: item.desc || item.descripcion || 'Sin descripción',
                cantidad: cantidad,
                stockMinimo: stockMinimo,
                unidad: item.unidad || 'piezas'
              });
            }
          }
        }
      });
    }

    // Ordenar por diferencia con stock mínimo (más crítico primero)
    refaccionesStockBajo.sort((a, b) => {
      const diferenciaA = a.cantidad - a.stockMinimo;
      const diferenciaB = b.cantidad - b.stockMinimo;
      if (diferenciaA !== diferenciaB) {
        return diferenciaA - diferenciaB; // Ordenar por diferencia (más crítico primero)
      }
      return a.cantidad - b.cantidad; // Si la diferencia es igual, ordenar por cantidad
    });

    // Preparar datos para exportar
    const rows = refaccionesStockBajo.map(ref => {
      const diferencia = ref.cantidad - ref.stockMinimo;
      const esCritico = ref.cantidad === 0;
      const esBajo = diferencia < 0;

      return {
        Código: ref.codigo,
        Descripción: ref.descripcion,
        'Stock Actual': ref.cantidad,
        'Stock Mínimo': ref.stockMinimo,
        Diferencia: diferencia,
        Unidad: ref.unidad,
        Estado: esCritico ? 'Sin Stock' : esBajo ? 'Stock Bajo' : 'En Límite'
      };
    });

    // Usar función base común
    await window.exportarDatosExcel({
      datos: rows,
      nombreArchivo: 'alertas_stock_bajo',
      nombreHoja: 'Stock Bajo',
      mensajeVacio: 'No hay refacciones con stock bajo para exportar.'
    });
  } catch (error) {
    console.error('Error exportando alertas de stock bajo:', error);
    alert(`Error al exportar: ${error.message}`);
  }
};

// Exportar Plataformas Esperando Descarga
window.exportarPlataformasDescargaExcel = async function () {
  try {
    // Obtener las plataformas listas para descarga (sin filtros aplicados)
    let plataformas = window.ERPState?.getTemp('plataformasDescargaCompletasSinFiltrar') || [];

    if (!plataformas || plataformas.length === 0) {
      // Intentar obtenerlas directamente
      let traficoData = [];

      if (window.firebaseRepos?.trafico) {
        try {
          const repo = window.firebaseRepos.trafico;
          if (window.ERPState.getFlag('firebaseReposReady')) {
            await window.ERPState.getFlag('firebaseReposReady');
          }
          const allRegistros = await repo.getAll();
          traficoData = Array.isArray(allRegistros) ? allRegistros : Object.values(allRegistros);
        } catch (error) {
          console.warn('⚠️ Error obteniendo datos desde Firebase:', error);
        }
      }

      if (traficoData.length === 0) {
        const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
        if (sharedData.trafico && typeof sharedData.trafico === 'object') {
          traficoData = Object.values(sharedData.trafico);
        } else {
          const traficoArray = JSON.parse(localStorage.getItem('erp_trafico') || '[]');
          traficoData = Array.isArray(traficoArray) ? traficoArray : Object.values(traficoArray);
        }
      }

      // Usar la misma lógica de filtrado que actualizarPanelPlataformasCargadas
      plataformas = traficoData.filter(r => {
        if (!r) {
          return false;
        }

        const estadoPlataformaRaw = r.estadoPlataforma || r.estado || '';
        const estadoPlataforma = estadoPlataformaRaw.toString().trim();
        const estadoPlataformaLower = estadoPlataforma.toLowerCase();

        const esCargado =
          estadoPlataformaLower === 'cargado' ||
          estadoPlataforma === 'Cargado' ||
          estadoPlataforma === 'cargado';

        const esDescargado =
          estadoPlataformaLower === 'descargado' || estadoPlataforma === 'Descargado';

        if (esDescargado) {
          return false;
        }

        const tieneDatosBasicos = Boolean(r.numeroRegistro || r.registroId || r.id || r.numero);

        return esCargado && tieneDatosBasicos;
      });
    }

    if (plataformas.length === 0) {
      alert('No hay plataformas esperando descarga para exportar.');
      return;
    }

    function calcularDiasEspera(fechaCargaStr) {
      if (!fechaCargaStr) {
        return 0;
      }
      try {
        const fechaCarga = new Date(fechaCargaStr);
        if (isNaN(fechaCarga.getTime())) {
          return 0;
        }
        const fechaCargaNormalizada = new Date(
          fechaCarga.getFullYear(),
          fechaCarga.getMonth(),
          fechaCarga.getDate()
        );
        const ahora = new Date();
        const ahoraNormalizada = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        const diferencia = ahoraNormalizada - fechaCargaNormalizada;
        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        return dias < 0 ? 0 : dias;
      } catch (error) {
        return 0;
      }
    }

    function formatearFecha(fecha) {
      if (!fecha) {
        return '';
      }
      try {
        if (typeof fecha === 'string') {
          if (fecha.includes('T')) {
            return new Date(fecha).toLocaleDateString('es-MX');
          }
          return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-MX');
        }
        return new Date(fecha).toLocaleDateString('es-MX');
      } catch (e) {
        return String(fecha);
      }
    }

    const rows = plataformas.map(reg => {
      const regId = reg.numeroRegistro || reg.registroId || reg.id || reg.numero || 'N/A';
      const plataforma = reg.placasPlataforma || reg.plataforma || reg.tipoPlataforma || 'N/A';
      const estancia = reg.LugarDestino || reg.destino || 'N/A';
      const fechaCargaStr =
        reg.fechaCarga ||
        reg.fechaEnvio ||
        reg.fechaCreacion ||
        reg.ultimaActualizacion ||
        reg.fecha ||
        null;
      const diasEspera = calcularDiasEspera(fechaCargaStr);

      return {
        Registro: regId,
        Plataforma: plataforma,
        Estancia: estancia,
        'Fecha de Carga': formatearFecha(fechaCargaStr),
        'Días Esperando': diasEspera,
        Estado: diasEspera > 2 ? 'Urgente' : diasEspera > 0 ? 'Pendiente' : 'Hoy'
      };
    });

    // Usar función base común
    await window.exportarDatosExcel({
      datos: rows,
      nombreArchivo: 'plataformas_esperando_descarga',
      nombreHoja: 'Plataformas Descarga',
      mensajeVacio: 'No hay plataformas esperando descarga para exportar.'
    });
  } catch (error) {
    console.error('Error exportando plataformas esperando descarga:', error);
    alert(`Error al exportar: ${error.message}`);
  }
};

// Exportar Inventario de Plataformas por Estancia
window.exportarInventarioPlataformasExcel = async function () {
  try {
    // Obtener plataformas (aplicando los mismos filtros que la tabla)
    let plataformas = [];

    try {
      if (
        window.InventarioUtils &&
        typeof window.InventarioUtils.derivePlataformasFromTrafico === 'function'
      ) {
        const traficoData = await window.InventarioUtils.getAllTrafico();
        plataformas = window.InventarioUtils.derivePlataformasFromTrafico(traficoData);
      } else {
        plataformas = JSON.parse(localStorage.getItem('erp_inventario_plataformas') || '[]');
      }
    } catch (error) {
      console.warn('⚠️ Error cargando plataformas, usando localStorage:', error);
      plataformas = JSON.parse(localStorage.getItem('erp_inventario_plataformas') || '[]');
    }

    // Aplicar filtros si existen
    const filtroEstancia = document.getElementById('filtroEstanciaInventario')?.value || '';
    const filtroEstado = document.getElementById('filtroEstadoPlataforma')?.value || '';
    const busqueda = document.getElementById('buscarPlataforma')?.value?.toLowerCase() || '';

    if (filtroEstancia) {
      plataformas = plataformas.filter(p => p.estanciaActual === filtroEstancia);
    }
    if (filtroEstado) {
      plataformas = plataformas.filter(p => p.estado === filtroEstado);
    }
    if (busqueda) {
      plataformas = plataformas.filter(
        p =>
          (p.numero && p.numero.toLowerCase().includes(busqueda)) ||
          (p.placas && p.placas.toLowerCase().includes(busqueda))
      );
    }

    if (plataformas.length === 0) {
      alert('No hay plataformas que coincidan con los filtros para exportar.');
      return;
    }

    function formatearFecha(fecha) {
      if (!fecha) {
        return '';
      }
      try {
        if (typeof fecha === 'string') {
          if (fecha.includes('T')) {
            return new Date(fecha).toLocaleDateString('es-MX');
          }
          return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-MX');
        }
        return new Date(fecha).toLocaleDateString('es-MX');
      } catch (e) {
        return String(fecha);
      }
    }

    function formatearEstado(estado) {
      const estados = {
        vacio: 'Vacío',
        cargado: 'Cargado',
        mantenimiento: 'Mantenimiento'
      };
      return estados[estado] || estado || 'Sin estado';
    }

    const rows = plataformas.map(plat => {
      let estadoInventario = plat.estado || 'cargado';
      if (plat.estadoPlataforma === 'descargado') {
        estadoInventario = 'vacio';
      } else if (plat.estadoPlataforma === 'cargado') {
        estadoInventario = 'cargado';
      }

      const fechaMovimiento =
        plat.fechaMovimiento ||
        plat.fechaEnvio ||
        plat.ultimaActualizacion ||
        plat.fechaCreacion ||
        plat.fecha ||
        plat.ultimoMovimientoFecha ||
        null;

      return {
        Plataforma: plat.numero || '-',
        Placas: plat.placas || '-',
        'Estancia Actual': plat.estanciaActual || '-',
        Estado: formatearEstado(estadoInventario),
        'Último Movimiento': plat.ultimoMovimiento || '-',
        'Fecha Movimiento': formatearFecha(fechaMovimiento)
      };
    });

    // Usar función base común
    await window.exportarDatosExcel({
      datos: rows,
      nombreArchivo: 'inventario_plataformas',
      nombreHoja: 'Inventario Plataformas',
      mensajeVacio: 'No hay plataformas que coincidan con los filtros para exportar.'
    });
  } catch (error) {
    console.error('Error exportando inventario de plataformas:', error);
    alert(`Error al exportar: ${error.message}`);
  }
};
