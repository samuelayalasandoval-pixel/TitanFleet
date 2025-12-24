// Sistema de Reportes y Dashboard

// ============================================================
// SISTEMA DE LOGGING - Control de niveles de log
// ============================================================
const REPORTES_LOG_LEVEL = {
  NONE: 0, // Sin logs
  ERROR: 1, // Solo errores críticos
  WARN: 2, // Errores y advertencias
  INFO: 3, // Errores, advertencias e información importante
  DEBUG: 4 // Todos los logs (incluyendo debug)
};

// Configurar nivel de log:
// - REPORTES_LOG_LEVEL.ERROR: Solo errores críticos (recomendado para producción)
// - REPORTES_LOG_LEVEL.WARN: Errores y advertencias
// - REPORTES_LOG_LEVEL.INFO: Errores, advertencias e información importante
// - REPORTES_LOG_LEVEL.DEBUG: Todos los logs (solo para desarrollo/debugging)
// - REPORTES_LOG_LEVEL.NONE: Sin logs
const CURRENT_LOG_LEVEL = REPORTES_LOG_LEVEL.WARN; // Cambiar aquí para ajustar el nivel de log

// Helper para logging condicional
const reportesLog = {
  error: (...args) => {
    if (CURRENT_LOG_LEVEL >= REPORTES_LOG_LEVEL.ERROR) {
      console.error(...args);
    }
  },
  warn: (...args) => {
    if (CURRENT_LOG_LEVEL >= REPORTES_LOG_LEVEL.WARN) {
      console.warn(...args);
    }
  },
  info: (...args) => {
    if (CURRENT_LOG_LEVEL >= REPORTES_LOG_LEVEL.INFO) {
      console.log(...args);
    }
  },
  debug: (...args) => {
    if (CURRENT_LOG_LEVEL >= REPORTES_LOG_LEVEL.DEBUG) {
      console.log(...args);
    }
  },
  log: (...args) => {
    // Por defecto, los console.log son de nivel DEBUG
    if (CURRENT_LOG_LEVEL >= REPORTES_LOG_LEVEL.DEBUG) {
      console.log(...args);
    }
  }
};

class ReportesSystem {
  constructor() {
    this.charts = {};
    this.currentData = [];
    this.filteredData = [];
    this.currentPage = 1;
    this.itemsPerPage = 15;
    this.totalPages = 1;
    this.filters = {
      fechaInicio: null,
      fechaFin: null,
      departamento: '',
      estado: ''
    };
    this.mesFiltro = null; // null = mes actual, o {mes, año} para otro mes
    this.init();
  }

  // Obtener mes y año del filtro (o mes actual si no hay filtro)
  obtenerMesFiltro() {
    try {
      const filtroInput = document.getElementById('filtroMesReportes');
      if (filtroInput && filtroInput.value) {
        const [año, mes] = filtroInput.value.split('-');
        const mesNum = parseInt(mes, 10);
        const añoNum = parseInt(año, 10);

        if (!isNaN(mesNum) && !isNaN(añoNum) && mesNum >= 1 && mesNum <= 12) {
          return {
            mes: mesNum - 1, // getMonth() usa 0-11
            año: añoNum
          };
        }
      }
    } catch (error) {
      reportesLog.warn('⚠️ Error obteniendo filtro de mes:', error);
    }

    // Por defecto, mes actual
    const ahora = new Date();
    return {
      mes: ahora.getMonth(),
      año: ahora.getFullYear()
    };
  }

  // Verificar si una fecha pertenece al mes del filtro
  perteneceAlMesFiltro(fecha) {
    const filtro = this.obtenerMesFiltro();
    if (!fecha) {
      return false;
    }

    let añoFecha = null;
    let mesFecha = null; // En formato 0-11 (0=enero, 11=diciembre)

    if (typeof fecha === 'string') {
      // PRIORIDAD 1: Si la fecha está en formato YYYY-MM-DD, extraer directamente
      // Esto evita problemas con zonas horarias al usar new Date()
      if (/^\d{4}-\d{2}-\d{2}/.test(fecha)) {
        // Extraer solo la parte de fecha (antes de 'T' si existe)
        const fechaParte = fecha.split('T')[0];
        const partes = fechaParte.split('-');
        if (partes.length === 3) {
          añoFecha = parseInt(partes[0], 10);
          mesFecha = parseInt(partes[1], 10) - 1; // Convertir a formato 0-11
        }
      }
      // PRIORIDAD 2: Intentar parsear fecha en formato DD/MM/YYYY
      else if (fecha.includes('/')) {
        const partes = fecha.split('/');
        if (partes.length === 3) {
          añoFecha = parseInt(partes[2], 10);
          mesFecha = parseInt(partes[1], 10) - 1; // Convertir a formato 0-11
        }
      }

      // Si no se pudo extraer directamente, intentar parsear como Date
      if (añoFecha === null || mesFecha === null) {
        try {
          // PRIORIDAD: Si la fecha ISO tiene 'T', extraer directamente del string
          if (fecha.includes('T')) {
            const fechaParte = fecha.split('T')[0];
            if (/^\d{4}-\d{2}-\d{2}/.test(fechaParte)) {
              const partes = fechaParte.split('-');
              if (partes.length === 3) {
                añoFecha = parseInt(partes[0], 10);
                mesFecha = parseInt(partes[1], 10) - 1;
              }
            }
          }

          // Si aún no se pudo, intentar parsear como Date (último recurso)
          // NOTA: new Date() puede tener problemas con zonas horarias
          if (añoFecha === null || mesFecha === null) {
            const tempDate = new Date(fecha);
            if (!isNaN(tempDate.getTime())) {
              // Usar UTC para evitar problemas de zona horaria
              añoFecha = tempDate.getUTCFullYear();
              mesFecha = tempDate.getUTCMonth();
            } else {
              return false;
            }
          }
        } catch (e) {
          return false;
        }
      }
    } else if (fecha instanceof Date) {
      // Si ya es un Date, extraer año y mes usando UTC para evitar problemas de zona horaria
      añoFecha = fecha.getUTCFullYear();
      mesFecha = fecha.getUTCMonth();
    } else {
      return false;
    }

    if (añoFecha === null || mesFecha === null) {
      return false;
    }

    // Comparar mes y año
    const mesFiltro = filtro.mes; // Ya está en formato 0-11 (0=enero, 11=diciembre)
    const añoFiltro = filtro.año;

    const coincide = mesFecha === mesFiltro && añoFecha === añoFiltro;

    // Log de diagnóstico ocasional para depurar
    if (!coincide && Math.random() < 0.001) {
      // 0.1% de probabilidad para no saturar logs
      reportesLog.debug(
        `📅 Filtro de fecha: fecha=${fecha}, mesFecha=${mesFecha + 1}, añoFecha=${añoFecha}, mesFiltro=${mesFiltro + 1}, añoFiltro=${añoFiltro}, coincide=${coincide}`
      );
    }

    return coincide;
  }

  init() {
    this.setupEventListeners();
    this.initializeCharts();
    this.loadDashboardData();
    this.setCurrentPeriod();
  }

  setupEventListeners() {
    // Configurar fechas por defecto
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    // Verificar que los elementos existan antes de configurarlos
    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');
    const fechaDesde = document.getElementById('fechaDesde');
    const fechaHasta = document.getElementById('fechaHasta');

    if (fechaInicio) {
      fechaInicio.value = firstDay.toISOString().split('T')[0];
    }
    if (fechaFin) {
      fechaFin.value = today.toISOString().split('T')[0];
    }
    if (fechaDesde) {
      fechaDesde.value = firstDay.toISOString().split('T')[0];
    }
    if (fechaHasta) {
      fechaHasta.value = today.toISOString().split('T')[0];
    }

    // Cargar tractocamiones en el filtro (con sistema de reintentos incorporado)
    const cargadoInicialmente = this.loadTractocamionesFilter({
      retryCount: 0,
      maxRetries: 3,
      silent: false
    });

    // También intentar cargar cuando se actualice el cache de Firestore
    // (el sistema de reintentos ya maneja esto, pero esto es un fallback adicional)
    if (window.__economicosCache === undefined || !cargadoInicialmente) {
      let cacheCheckAttempts = 0;
      const maxCacheChecks = 10;

      const checkCache = () => {
        cacheCheckAttempts++;
        if (
          window.__economicosCache &&
          Array.isArray(window.__economicosCache) &&
          window.__economicosCache.length > 0
        ) {
          // Cache cargado, intentar cargar filtro una vez más
          const select = document.getElementById('filtroTractocamion');
          if (select && select.children.length <= 1) {
            this.loadTractocamionesFilter({ retryCount: 0, maxRetries: 1, silent: true });
          }
        } else if (cacheCheckAttempts < maxCacheChecks) {
          // Continuar esperando
          setTimeout(checkCache, 500);
        }
      };
      setTimeout(checkCache, 500);
    }

    // Ya no es necesario este reintento adicional, el sistema de reintentos lo maneja

    // Event listeners para filtros del gráfico de viajes (con verificación)
    const filtroTractocamion = document.getElementById('filtroTractocamion');
    const fechaDesdeElement = document.getElementById('fechaDesde');
    const fechaHastaElement = document.getElementById('fechaHasta');

    if (filtroTractocamion) {
      filtroTractocamion.addEventListener('change', () => this.updateViajesChart());
    }
    if (fechaDesdeElement) {
      fechaDesdeElement.addEventListener('change', () => this.updateViajesChart());
    }
    if (fechaHastaElement) {
      fechaHastaElement.addEventListener('change', () => this.updateViajesChart());
    }
  }

  setCurrentPeriod() {
    // Obtener el mes del filtro (o mes actual si no hay filtro)
    const filtro = this.obtenerMesFiltro();
    const monthNames = [
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
    const period = `${monthNames[filtro.mes]} ${filtro.año}`;
    const currentPeriodElement = document.getElementById('currentPeriod');
    if (currentPeriodElement) {
      currentPeriodElement.textContent = period;
    }
  }

  async loadDashboardData() {
    try {
      console.log('🔄 Iniciando carga de datos del dashboard...');

      // Cargar datos reales de todos los módulos
      const realData = await this.loadRealModuleData();
      this.currentData = realData || [];

      reportesLog.debug('📊 Datos cargados:', {
        total: this.currentData.length,
        logistica: this.currentData.filter(item => item.departamento === 'logistica').length,
        trafico: this.currentData.filter(item => item.departamento === 'trafico').length,
        facturacion: this.currentData.filter(item => item.departamento === 'facturacion').length
      });

      // Verificar que los datos se cargaron correctamente
      if (Array.isArray(this.currentData)) {
        // Actualizar KPIs primero (esto también verifica localStorage directamente)
        await this.updateKPIs(this.currentData);
        this.updateCharts(this.currentData);
        this.updateTable(this.currentData);
      } else {
        reportesLog.warn('⚠️ Datos del dashboard no son un array válido:', this.currentData);
        // Inicializar con datos vacíos pero aún actualizar KPIs desde localStorage
        this.currentData = [];
        await this.updateKPIs([]);
        this.updateCharts([]);
        this.updateTable([]);
      }

      // Cargar métricas comparativas y Top 10 después de los datos principales
      try {
        await this.calcularMetricasComparativas();
        await this.calcularTop10();
      } catch (error) {
        reportesLog.warn('⚠️ Error cargando métricas comparativas o Top 10:', error);
      }

      // Verificación adicional: si todos los KPIs son 0, verificar localStorage directamente
      setTimeout(() => {
        const totalLogistica = document.getElementById('totalLogistica')?.textContent || '0';
        const totalTrafico = document.getElementById('totalTrafico')?.textContent || '0';
        const totalDiesel = document.getElementById('totalDiesel')?.textContent || '$0';

        if (totalLogistica === '0' && totalTrafico === '0' && totalDiesel === '$0') {
          reportesLog.warn('⚠️ Todos los KPIs están en 0, verificando datos en localStorage...');

          // Verificar si hay datos en localStorage
          const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
          const hasLogistica = sharedData.registros && Object.keys(sharedData.registros).length > 0;
          const hasTrafico = sharedData.trafico && Object.keys(sharedData.trafico).length > 0;
          const hasDiesel = localStorage.getItem('erp_diesel_movimientos');

          if (hasLogistica || hasTrafico || hasDiesel) {
            reportesLog.debug('📋 Se encontraron datos en localStorage, recargando dashboard...');
            // Recargar datos sin filtro temporalmente para diagnóstico
            this.loadRealModuleData().then(data => {
              console.log(`📊 Datos recargados sin filtro: ${data.length} registros`);
              this.currentData = data || [];
              // Recargar KPIs
              this.updateKPIs(this.currentData);
            });
          } else {
            reportesLog.debug(
              'ℹ️ No se encontraron datos en localStorage. Esto es normal si aún no has creado registros.'
            );
          }
        }
      }, 3000);
    } catch (error) {
      console.error('❌ Error cargando datos del dashboard:', error);
      // Inicializar con datos vacíos en caso de error, pero aún intentar cargar desde localStorage
      this.currentData = [];
      try {
        await this.updateKPIs([]);
      } catch (kpiError) {
        reportesLog.error('❌ Error actualizando KPIs:', kpiError);
      }
      this.updateCharts([]);
      this.updateTable([]);
    }
  }

  async loadRealModuleData() {
    const data = [];

    // Cargar datos de Logística
    try {
      let logisticaData = [];

      // PRIORIDAD 1: Intentar cargar desde Firebase
      if (window.firebaseRepos && window.firebaseRepos.logistica) {
        try {
          // Esperar a que el repositorio esté inicializado
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.logistica.db || !window.firebaseRepos.logistica.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 200));
            await window.firebaseRepos.logistica.init();
          }

          if (window.firebaseRepos.logistica.db && window.firebaseRepos.logistica.tenantId) {
            logisticaData = await window.firebaseRepos.logistica.getAllRegistros();
            console.log('🔥 Datos de logística cargados desde Firebase:', logisticaData.length);
            // Log de diagnóstico: mostrar campos de fecha de los primeros registros
            if (logisticaData.length > 0) {
              console.log(
                '🔍 DEBUG - Primeros registros de logística desde Firebase:',
                logisticaData.slice(0, 2).map(item => ({
                  numeroRegistro: item.numeroRegistro || item.id,
                  fechaEnvio: item.fechaEnvio || 'N/A',
                  fecha: item.fecha || 'N/A',
                  fechaCreacion: item.fechaCreacion || 'N/A',
                  todosLosCampos: Object.keys(item)
                }))
              );
            }
          }
        } catch (error) {
          reportesLog.warn('⚠️ Error cargando logística desde Firebase:', error);

          // Verificar si es error de cuota
          const isQuotaError =
            error &&
            (error.code === 'resource-exhausted' ||
              error.code === 'permission-denied' ||
              error.message?.includes('Quota exceeded') ||
              error.message?.includes('quota') ||
              error.message?.includes('exceeded'));

          if (isQuotaError) {
            console.error('🚫 ERROR: Cuota de Firebase excedida o permisos denegados');
            console.error(
              '💡 Esto puede causar que los datos se carguen desde localStorage y no se filtren correctamente'
            );
            if (window.FirebaseQuotaManager) {
              window.FirebaseQuotaManager.checkQuotaExceeded(error);
              window.FirebaseQuotaManager.showStatus();
            }
          }
        }
      }

      // PRIORIDAD 2: Cargar desde erp_shared_data.registros (formato actual)
      // Siempre cargar también desde localStorage para asegurar que tenemos todos los datos
      // IMPORTANTE: Filtrar por tenantId para evitar mostrar datos de otros usuarios
      const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
      if (sharedData.registros && typeof sharedData.registros === 'object') {
        let localData = Object.values(sharedData.registros);
        console.log(
          '📋 Datos de logística en localStorage (erp_shared_data.registros):',
          localData.length
        );

        // Filtrar por tenantId si está disponible
        const currentTenantId =
          window.firebaseRepos?.logistica?.tenantId ||
          localStorage.getItem('tenantId') ||
          window.firebaseAuth?.currentUser?.uid;

        if (currentTenantId) {
          const beforeFilter = localData.length;
          localData = localData.filter(item => {
            // Si el item tiene tenantId, debe coincidir
            if (item.tenantId) {
              return item.tenantId === currentTenantId;
            }
            // Si el item tiene userId, debe coincidir con el usuario actual
            if (item.userId && window.firebaseAuth?.currentUser?.uid) {
              return item.userId === window.firebaseAuth.currentUser.uid;
            }
            // Si no tiene tenantId ni userId, solo incluirlo si no hay tenantId configurado
            // (para compatibilidad con datos antiguos)
            return true; // Mantener datos sin tenantId para compatibilidad
          });
          console.log(
            `📋 Datos de logística después de filtrar por tenantId (${currentTenantId}): ${localData.length} de ${beforeFilter}`
          );
        }

        // Combinar datos de Firebase y localStorage, evitando duplicados
        const existingIds = new Set(logisticaData.map(item => item.numeroRegistro || item.id));
        localData.forEach(item => {
          const itemId = item.numeroRegistro || item.id;
          if (!existingIds.has(itemId)) {
            logisticaData.push(item);
            existingIds.add(itemId);
          }
        });
        console.log(
          `📋 Total datos de logística después de combinar: ${logisticaData.length} (este es el total SIN filtrar, el filtro por mes se aplica después)`
        );
        // Log de diagnóstico: mostrar fechas de los primeros registros con mes extraído
        if (logisticaData.length > 0) {
          const filtro = this.obtenerMesFiltro();
          console.log(`📅 Filtro actual: ${filtro.mes + 1}/${filtro.año}`);
          const fechasMuestras = logisticaData.slice(0, 5).map(item => {
            const fechaRaw = item.fechaEnvio || item.fecha;
            let mesExtraido = null;
            let añoExtraido = null;

            // Extraer mes y año de la fecha
            if (fechaRaw && typeof fechaRaw === 'string') {
              if (/^\d{4}-\d{2}-\d{2}/.test(fechaRaw)) {
                const fechaParte = fechaRaw.split('T')[0];
                const partes = fechaParte.split('-');
                if (partes.length === 3) {
                  añoExtraido = parseInt(partes[0], 10);
                  mesExtraido = parseInt(partes[1], 10);
                }
              }
            }

            return {
              numeroRegistro: item.numeroRegistro || item.id,
              fechaEnvio: fechaRaw,
              mes: mesExtraido,
              año: añoExtraido,
              perteneceFiltro: mesExtraido === filtro.mes + 1 && añoExtraido === filtro.año
            };
          });
          console.log('📅 Muestra de fechas en datos de logística:', fechasMuestras);
        }
      }

      // PRIORIDAD 3: Fallback a erp_logistica (formato antiguo)
      const oldData = localStorage.getItem('erp_logistica');
      if (oldData) {
        try {
          const parsed = JSON.parse(oldData);
          let oldDataArray = Array.isArray(parsed) ? parsed : Object.values(parsed);
          console.log(
            '📋 Datos de logística en formato antiguo (erp_logistica):',
            oldDataArray.length
          );

          // Filtrar por tenantId si está disponible
          const currentTenantId =
            window.firebaseRepos?.logistica?.tenantId ||
            localStorage.getItem('tenantId') ||
            window.firebaseAuth?.currentUser?.uid;

          if (currentTenantId) {
            const beforeFilter = oldDataArray.length;
            oldDataArray = oldDataArray.filter(item => {
              // PRIORIDAD 1: Si el item tiene tenantId, DEBE coincidir exactamente
              if (item.tenantId) {
                const matches = item.tenantId === currentTenantId;
                if (!matches) {
                  reportesLog.debug(
                    `🚫 Registro antiguo ${item.numeroRegistro || item.id} filtrado: tenantId "${item.tenantId}" != "${currentTenantId}"`
                  );
                }
                return matches;
              }
              // PRIORIDAD 2: Si el item tiene userId, debe coincidir con el usuario actual
              if (item.userId && window.firebaseAuth?.currentUser?.uid) {
                return item.userId === window.firebaseAuth.currentUser.uid;
              }
              // PRIORIDAD 3: Si no tiene tenantId ni userId, solo incluirlo si no hay tenantId configurado
              // (para compatibilidad con datos antiguos - pero solo si realmente no tiene tenantId)
              return true; // Mantener datos sin tenantId para compatibilidad
            });
            console.log(
              `📋 Datos antiguos después de filtrar por tenantId: ${oldDataArray.length} de ${beforeFilter}`
            );
          }

          // Combinar evitando duplicados
          const existingIds = new Set(logisticaData.map(item => item.numeroRegistro || item.id));
          oldDataArray.forEach(item => {
            const itemId = item.numeroRegistro || item.id;
            if (!existingIds.has(itemId)) {
              logisticaData.push(item);
              existingIds.add(itemId);
            }
          });
          console.log(
            '📋 Total datos de logística después de combinar formato antiguo:',
            logisticaData.length
          );
        } catch (error) {
          reportesLog.warn('⚠️ Error parseando erp_logistica:', error);
        }
      }

      logisticaData.forEach(item => {
        // PRIORIDAD: Usar fechaEnvio para logística (es la fecha más relevante)
        // Si fechaEnvio no existe, usar fecha como fallback
        const fechaEnvio = item.fechaEnvio || item.fecha;
        data.push({
          id: item.numeroRegistro || `LOG-${Date.now()}`,
          departamento: 'logistica',
          estado: 'completado',
          fecha: fechaEnvio || new Date().toISOString(),
          // IMPORTANTE: Guardar fechaEnvio si existe, si no usar fecha como fallback
          fechaEnvio: item.fechaEnvio || item.fecha || undefined, // Mantener referencia original (PRIORIDAD para filtrado)
          fechaCreacion: item.fechaCreacion || item.fecha || undefined, // Mantener referencia original
          cliente: item.cliente || 'N/A',
          servicio: item.tipoServicio || 'general',
          peso: item.peso || 0,
          origen: item.origen || 'N/A',
          destino: item.destino || 'N/A',
          valor: item.valor || 0
        });
      });
    } catch (error) {
      console.error('Error cargando datos de logística:', error);
    }

    // Cargar datos de Facturación
    try {
      let facturacionData = [];

      // PRIORIDAD 1: Intentar cargar desde Firebase
      if (window.firebaseRepos && window.firebaseRepos.facturacion) {
        try {
          const repoFacturacion = window.firebaseRepos.facturacion;

          // Esperar a que el repositorio esté inicializado
          let attempts = 0;
          const maxAttempts = 10;
          while (attempts < maxAttempts && (!repoFacturacion.db || !repoFacturacion.tenantId)) {
            attempts++;
            if (attempts === 1) {
              console.log('⏳ Esperando inicialización del repositorio facturación...');
            }
            await new Promise(resolve => setTimeout(resolve, 300));

            if (typeof repoFacturacion.init === 'function') {
              try {
                await repoFacturacion.init();
              } catch (initError) {
                // Ignorar errores de inicialización y continuar
              }
            }
          }

          if (repoFacturacion.db && repoFacturacion.tenantId) {
            facturacionData = await repoFacturacion.getAllRegistros();
            if (facturacionData && facturacionData.length > 0) {
              console.log(
                '🔥 Datos de facturación cargados desde Firebase:',
                facturacionData.length
              );
            }
          } else {
            reportesLog.debug(
              'ℹ️ Repositorio facturación no inicializado completamente, usando localStorage como fallback'
            );
          }
        } catch (error) {
          const isQuotaError =
            error &&
            (error.code === 'resource-exhausted' ||
              error.code === 'permission-denied' ||
              error.message?.includes('Quota exceeded'));

          if (isQuotaError) {
            reportesLog.warn('⚠️ Cuota de Firebase excedida para facturación, usando localStorage');
          } else {
            reportesLog.debug(
              'ℹ️ Error cargando facturación desde Firebase, usando localStorage:',
              error.message
            );
          }
        }
      } else {
        reportesLog.debug('ℹ️ Repositorio facturación no disponible aún, usando localStorage');
      }

      // PRIORIDAD 2: Cargar desde erp_shared_data (formato actual)
      // IMPORTANTE: Filtrar por tenantId para evitar mostrar datos de otros usuarios
      if (facturacionData.length === 0) {
        const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
        let tempData = [];

        if (sharedData.facturas && typeof sharedData.facturas === 'object') {
          tempData = Object.values(sharedData.facturas);
          console.log(
            '📋 Datos de facturación en localStorage (erp_shared_data.facturas):',
            tempData.length
          );
        } else if (sharedData.facturacion && typeof sharedData.facturacion === 'object') {
          tempData = Object.values(sharedData.facturacion);
          console.log(
            '📋 Datos de facturación en localStorage (erp_shared_data.facturacion):',
            tempData.length
          );
        }

        // Filtrar por tenantId si está disponible
        const currentTenantId =
          window.firebaseRepos?.facturacion?.tenantId ||
          localStorage.getItem('tenantId') ||
          window.firebaseAuth?.currentUser?.uid;

        if (currentTenantId && tempData.length > 0) {
          const beforeFilter = tempData.length;
          tempData = tempData.filter(item => {
            // Si el item tiene tenantId, debe coincidir
            if (item.tenantId) {
              return item.tenantId === currentTenantId;
            }
            // Si el item tiene userId, debe coincidir con el usuario actual
            if (item.userId && window.firebaseAuth?.currentUser?.uid) {
              return item.userId === window.firebaseAuth.currentUser.uid;
            }
            // Si no tiene tenantId ni userId, solo incluirlo si no hay tenantId configurado
            // (para compatibilidad con datos antiguos)
            return true; // Mantener datos sin tenantId para compatibilidad
          });
          console.log(
            `📋 Datos de facturación después de filtrar por tenantId (${currentTenantId}): ${tempData.length} de ${beforeFilter}`
          );
        }

        facturacionData = tempData;
      }

      // PRIORIDAD 3: Fallback a erp_facturacion (formato antiguo)
      if (facturacionData.length === 0) {
        const oldData = JSON.parse(localStorage.getItem('erp_facturacion') || '[]');
        if (Array.isArray(oldData) && oldData.length > 0) {
          let tempData = oldData;

          // Filtrar por tenantId si está disponible
          const currentTenantId =
            window.firebaseRepos?.facturacion?.tenantId ||
            localStorage.getItem('tenantId') ||
            window.firebaseAuth?.currentUser?.uid;

          if (currentTenantId) {
            const beforeFilter = tempData.length;
            tempData = tempData.filter(item => {
              // Si el item tiene tenantId, debe coincidir
              if (item.tenantId) {
                return item.tenantId === currentTenantId;
              }
              // Si el item tiene userId, debe coincidir con el usuario actual
              if (item.userId && window.firebaseAuth?.currentUser?.uid) {
                return item.userId === window.firebaseAuth.currentUser.uid;
              }
              // Si no tiene tenantId ni userId, solo incluirlo si no hay tenantId configurado
              // (para compatibilidad con datos antiguos)
              return true; // Mantener datos sin tenantId para compatibilidad
            });
            console.log(
              `📋 Datos antiguos de facturación después de filtrar por tenantId: ${tempData.length} de ${beforeFilter}`
            );
          }

          facturacionData = tempData;
          console.log(
            '📋 Datos de facturación cargados desde erp_facturacion (formato antiguo):',
            facturacionData.length
          );
        }
      }

      facturacionData.forEach(item => {
        const regId = item.numeroRegistro || item.registroId || item.id;
        data.push({
          id: regId || `FAC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          departamento: 'facturacion',
          estado: item.estado || 'pendiente',
          fecha: item.fechaFactura || item.fecha || item.fechaCreacion || new Date().toISOString(),
          cliente: item.Cliente || item.cliente || 'N/A',
          servicio: 'facturación',
          peso: 0,
          origen: 'N/A',
          destino: 'N/A',
          valor: parseFloat(item['total factura'] || item.total || item.monto || 0) || 0,
          numeroFactura: item.numeroFactura || regId,
          moneda: item.tipoMoneda || item.moneda || 'MXN'
        });
      });
    } catch (error) {
      console.error('Error cargando datos de facturación:', error);
    }

    // Cargar datos de Tráfico
    try {
      let traficoData = [];

      // PRIORIDAD 1: Intentar cargar desde Firebase
      if (window.firebaseRepos && window.firebaseRepos.trafico) {
        try {
          // Esperar a que el repositorio esté inicializado
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.trafico.db || !window.firebaseRepos.trafico.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 200));
            await window.firebaseRepos.trafico.init();
          }

          if (window.firebaseRepos.trafico.db && window.firebaseRepos.trafico.tenantId) {
            traficoData = await window.firebaseRepos.trafico.getAllRegistros();
            console.log('🔥 Datos de tráfico cargados desde Firebase:', traficoData.length);
          }
        } catch (error) {
          reportesLog.warn('⚠️ Error cargando tráfico desde Firebase:', error);
        }
      }

      // NO USAR localStorage - Solo Firebase es la fuente de verdad
      // Eliminado fallback a localStorage para evitar inconsistencias entre navegadores
      console.log(
        `📊 Datos de tráfico cargados exclusivamente desde Firebase: ${traficoData.length}`
      );

      traficoData.forEach(item => {
        const regId = item.numeroRegistro || item.registroId || item.id;
        // PRIORIDAD: Usar fechaEnvio para tráfico (es la fecha más relevante)
        // Solo usar otras fechas como fallback si fechaEnvio no existe
        const fechaItem = item.fechaEnvio || item.fecha || item.fechaCreacion || item.fechaSalida;

        // Log de diagnóstico para fechas problemáticas
        if (!fechaItem && item.numeroRegistro) {
          reportesLog.warn(
            `⚠️ Registro de tráfico ${item.numeroRegistro} no tiene campo de fecha definido`
          );
        }

        data.push({
          id: regId || `TRA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          departamento: 'trafico',
          estado: item.estadoPlataforma || item.estado || 'completado',
          fecha: fechaItem, // No usar new Date() como fallback para evitar fechas incorrectas
          fechaCreacion: item.fechaCreacion, // Mantener referencia original
          fechaEnvio: item.fechaEnvio, // Mantener referencia original (PRIORIDAD para filtrado)
          cliente: item.Cliente || item.cliente || 'N/A',
          servicio: item.tipoPlataforma || item.tipoServicio || 'general',
          peso: parseFloat(item.peso || 0) || 0,
          origen: item.LugarOrigen || item.origen || 'N/A',
          destino: item.LugarDestino || item.destino || 'N/A',
          valor: parseFloat(item.valor || 0) || 0,
          economico: item.economico || item.Placas || '',
          operador: item.operadorprincipal || item.operadorPrincipal || '',
          plataforma: item.plataformaServicio || item.plataforma || ''
        });
      });
    } catch (error) {
      console.error('Error cargando datos de tráfico:', error);
    }

    // Cargar datos de Operadores
    try {
      let operadoresData = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');

      // Filtrar por tenantId si está disponible
      const currentTenantId =
        localStorage.getItem('tenantId') || window.firebaseAuth?.currentUser?.uid;

      if (currentTenantId && operadoresData.length > 0) {
        const beforeFilter = operadoresData.length;
        operadoresData = operadoresData.filter(item => {
          // Si el item tiene tenantId, debe coincidir
          if (item.tenantId) {
            return item.tenantId === currentTenantId;
          }
          // Si el item tiene userId, debe coincidir con el usuario actual
          if (item.userId && window.firebaseAuth?.currentUser?.uid) {
            return item.userId === window.firebaseAuth.currentUser.uid;
          }
          // Si no tiene tenantId ni userId, solo incluirlo si no hay tenantId configurado
          // (para compatibilidad con datos antiguos)
          return true; // Mantener datos sin tenantId para compatibilidad
        });
        console.log(
          `📋 Datos de operadores después de filtrar por tenantId (${currentTenantId}): ${operadoresData.length} de ${beforeFilter}`
        );
      }

      operadoresData.forEach(item => {
        data.push({
          id: item.numeroRegistro || `OPE-${Date.now()}`,
          departamento: 'operadores',
          estado: 'completado',
          fecha: item.fecha || new Date().toISOString(),
          cliente: item.operadorNombre || 'N/A',
          servicio: item.tipoGasto || 'gasto',
          peso: 0,
          origen: 'N/A',
          destino: 'N/A',
          valor: item.monto || 0
        });
      });
    } catch (error) {
      console.error('Error cargando datos de operadores:', error);
    }

    // Cargar datos de Diesel
    try {
      let dieselData = [];

      // PRIORIDAD 1: Intentar cargar desde Firebase
      if (window.firebaseRepos && window.firebaseRepos.diesel) {
        try {
          // Verificar si el repositorio está disponible pero no inicializado
          const repoDiesel = window.firebaseRepos.diesel;

          // Esperar a que el repositorio esté inicializado (con timeout)
          // Intentar inicializar una vez si no está listo
          if (typeof repoDiesel.init === 'function' && (!repoDiesel.db || !repoDiesel.tenantId)) {
            try {
              await repoDiesel.init();
            } catch (initError) {
              // Ignorar errores y continuar con fallback
            }
          }

          if (repoDiesel.db && repoDiesel.tenantId) {
            dieselData = await repoDiesel.getAllMovimientos();
            if (dieselData && dieselData.length > 0) {
              console.log('🔥 Datos de diesel cargados desde Firebase:', dieselData.length);
            }
          } else {
            // No mostrar warning si hay fallback a localStorage disponible
            reportesLog.debug(
              'ℹ️ Repositorio diesel no inicializado completamente, usando localStorage como fallback'
            );
          }
        } catch (error) {
          // Solo mostrar error si es crítico, sino usar fallback silenciosamente
          const isQuotaError =
            error &&
            (error.code === 'resource-exhausted' ||
              error.code === 'permission-denied' ||
              error.message?.includes('Quota exceeded'));

          if (isQuotaError) {
            reportesLog.warn('⚠️ Cuota de Firebase excedida para diesel, usando localStorage');
          } else {
            reportesLog.debug(
              'ℹ️ Error cargando diesel desde Firebase, usando localStorage:',
              error.message
            );
          }
        }
      } else {
        // No mostrar warning si hay fallback disponible - esto es normal al inicio
        reportesLog.debug('ℹ️ Repositorio diesel no disponible aún, usando localStorage');
      }

      // PRIORIDAD 2: Cargar desde localStorage y combinar
      // IMPORTANTE: Filtrar por tenantId para evitar mostrar datos de otros usuarios
      let dieselLocal = JSON.parse(localStorage.getItem('erp_diesel_movimientos') || '[]');
      console.log('📋 Datos de diesel en localStorage:', dieselLocal.length);

      // Filtrar por tenantId si está disponible
      const currentTenantId =
        window.firebaseRepos?.diesel?.tenantId ||
        localStorage.getItem('tenantId') ||
        window.firebaseAuth?.currentUser?.uid;

      if (currentTenantId && dieselLocal.length > 0) {
        const beforeFilter = dieselLocal.length;
        dieselLocal = dieselLocal.filter(item => {
          // Si el item tiene tenantId, debe coincidir
          if (item.tenantId) {
            return item.tenantId === currentTenantId;
          }
          // Si el item tiene userId, debe coincidir con el usuario actual
          if (item.userId && window.firebaseAuth?.currentUser?.uid) {
            return item.userId === window.firebaseAuth.currentUser.uid;
          }
          // Si no tiene tenantId ni userId, solo incluirlo si no hay tenantId configurado
          // (para compatibilidad con datos antiguos)
          return true; // Mantener datos sin tenantId para compatibilidad
        });
        console.log(
          `📋 Datos de diesel después de filtrar por tenantId (${currentTenantId}): ${dieselLocal.length} de ${beforeFilter}`
        );
      }

      // Combinar datos evitando duplicados
      const existingIds = new Set(
        dieselData.map(item => item.id || item.movimientoId || String(item.fecha) + item.economico)
      );
      dieselLocal.forEach(item => {
        const itemId = item.id || item.movimientoId || String(item.fecha) + item.economico;
        if (!existingIds.has(itemId)) {
          dieselData.push(item);
          existingIds.add(itemId);
        }
      });

      console.log('📊 Total datos de diesel combinados:', dieselData.length);

      console.log('📊 Procesando datos de diesel para agregar a data...');
      dieselData.forEach((item, index) => {
        const dieselItem = {
          id: item.id || item.movimientoId || `DIE-${Date.now()}_${index}`,
          departamento: 'diesel',
          estado: 'completado',
          fecha: item.fecha || item.fechaConsumo || item.fechaCreacion || new Date().toISOString(),
          cliente: item.operadorPrincipal || item.operador || 'N/A',
          servicio: 'consumo_diesel',
          peso: parseFloat(item.litros || 0),
          origen: 'N/A',
          destino: 'N/A',
          valor: parseFloat(item.costoTotal || item.costo || 0),
          // Campos específicos para diesel
          economico: item.economico || item.numeroEconomico || 'N/A',
          costoTotal: parseFloat(item.costoTotal || item.costo || 0),
          litros: parseFloat(item.litros || 0),
          costoPorLitro: parseFloat(item.costoPorLitro || 0)
        };

        if (index === 0) {
          console.log('📋 Ejemplo de item de diesel procesado:', dieselItem);
        }

        data.push(dieselItem);
      });
      console.log(`✅ ${dieselData.length} movimientos de diesel agregados a data`);
    } catch (error) {
      console.error('Error cargando datos de diesel:', error);
    }

    // Cargar datos de CXC (Cuentas por Cobrar)
    try {
      let cxcData = [];

      // PRIORIDAD 1: Intentar cargar desde Firebase
      if (window.firebaseRepos && window.firebaseRepos.cxc) {
        try {
          const repoCXC = window.firebaseRepos.cxc;

          // Esperar a que el repositorio esté inicializado
          // Intentar inicializar una vez si no está listo
          if (typeof repoCXC.init === 'function' && (!repoCXC.db || !repoCXC.tenantId)) {
            try {
              await repoCXC.init();
            } catch (initError) {
              // Ignorar errores y continuar con fallback
            }
          }

          if (repoCXC.db && repoCXC.tenantId) {
            cxcData = await repoCXC.getAllFacturas();
            if (cxcData && cxcData.length > 0) {
              console.log('🔥 Datos de CXC cargados desde Firebase:', cxcData.length);
            }
          } else {
            reportesLog.debug(
              'ℹ️ Repositorio CXC no inicializado completamente, usando localStorage como fallback'
            );
          }
        } catch (error) {
          const isQuotaError =
            error &&
            (error.code === 'resource-exhausted' ||
              error.code === 'permission-denied' ||
              error.message?.includes('Quota exceeded'));

          if (isQuotaError) {
            reportesLog.warn('⚠️ Cuota de Firebase excedida para CXC, usando localStorage');
          } else {
            reportesLog.debug(
              'ℹ️ Error cargando CXC desde Firebase, usando localStorage:',
              error.message
            );
          }
        }
      } else {
        reportesLog.debug('ℹ️ Repositorio CXC no disponible aún, usando localStorage');
      }

      // PRIORIDAD 2: Fallback a localStorage
      if (cxcData.length === 0) {
        const cxcLocal = JSON.parse(localStorage.getItem('erp_cxc_data') || '[]');
        if (Array.isArray(cxcLocal) && cxcLocal.length > 0) {
          cxcData = cxcLocal;
          console.log('📋 Datos de CXC encontrados en erp_cxc_data:', cxcData.length);
        } else {
          // Intentar desde erp_cxc_facturas
          const cxcFacturas = JSON.parse(localStorage.getItem('erp_cxc_facturas') || '[]');
          if (Array.isArray(cxcFacturas) && cxcFacturas.length > 0) {
            cxcData = cxcFacturas;
            console.log('📋 Datos de CXC encontrados en erp_cxc_facturas:', cxcData.length);
          }
        }
      }

      cxcData.forEach(item => {
        const facturaId = item.numeroFactura || item.id || item.numeroRegistro;
        data.push({
          id: facturaId || `CXC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          departamento: 'cxc',
          estado: item.estado || 'pendiente',
          fecha: item.fechaEmision || item.fecha || item.fechaCreacion || new Date().toISOString(), // Usar fechaEmision primero, no fechaVencimiento
          cliente: item.cliente || 'N/A',
          servicio: 'cuenta por cobrar',
          peso: 0,
          origen: 'N/A',
          destino: 'N/A',
          valor: parseFloat(item.monto || item.total || 0) || 0,
          numeroFactura: facturaId,
          diasVencidos: item.diasVencidos || 0
        });
      });
    } catch (error) {
      console.error('Error cargando datos de CXC:', error);
    }

    // Cargar datos de CXP (Cuentas por Pagar)
    try {
      let cxpData = [];

      // PRIORIDAD 1: Intentar cargar desde Firebase
      if (window.firebaseRepos && window.firebaseRepos.cxp) {
        try {
          const repoCXP = window.firebaseRepos.cxp;

          // Esperar a que el repositorio esté inicializado
          let attempts = 0;
          const maxAttempts = 10;
          while (attempts < maxAttempts && (!repoCXP.db || !repoCXP.tenantId)) {
            attempts++;
            if (attempts === 1) {
              console.log('⏳ Esperando inicialización del repositorio CXP...');
            }
            await new Promise(resolve => setTimeout(resolve, 300));

            if (typeof repoCXP.init === 'function') {
              try {
                await repoCXP.init();
              } catch (initError) {
                // Ignorar errores de inicialización y continuar
              }
            }
          }

          if (repoCXP.db && repoCXP.tenantId) {
            cxpData = await repoCXP.getAllFacturas();
            if (cxpData && cxpData.length > 0) {
              console.log('🔥 Datos de CXP cargados desde Firebase:', cxpData.length);
            }
          } else {
            reportesLog.debug(
              'ℹ️ Repositorio CXP no inicializado completamente, usando localStorage como fallback'
            );
          }
        } catch (error) {
          const isQuotaError =
            error &&
            (error.code === 'resource-exhausted' ||
              error.code === 'permission-denied' ||
              error.message?.includes('Quota exceeded'));

          if (isQuotaError) {
            reportesLog.warn('⚠️ Cuota de Firebase excedida para CXP, usando localStorage');
          } else {
            reportesLog.debug(
              'ℹ️ Error cargando CXP desde Firebase, usando localStorage:',
              error.message
            );
          }
        }
      } else {
        reportesLog.debug('ℹ️ Repositorio CXP no disponible aún, usando localStorage');
      }

      // PRIORIDAD 2: Fallback a localStorage
      if (cxpData.length === 0) {
        const cxpLocal = JSON.parse(localStorage.getItem('erp_cxp_facturas') || '[]');
        if (Array.isArray(cxpLocal) && cxpLocal.length > 0) {
          cxpData = cxpLocal;
          console.log('📋 Datos de CXP encontrados en erp_cxp_facturas:', cxpData.length);
        }
      }

      cxpData.forEach(item => {
        const facturaId = item.numeroFactura || item.id || item.numeroRegistro;
        data.push({
          id: facturaId || `CXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          departamento: 'cxp',
          estado: item.estado || 'pendiente',
          fecha:
            item.fecha || item.fechaVencimiento || item.fechaCreacion || new Date().toISOString(),
          cliente: item.proveedor || item.cliente || 'N/A',
          servicio: 'cuenta por pagar',
          peso: 0,
          origen: 'N/A',
          destino: 'N/A',
          valor: parseFloat(item.monto || item.total || 0) || 0,
          numeroFactura: facturaId,
          montoPendiente: parseFloat(item.montoPendiente || item.monto || 0) || 0
        });
      });
    } catch (error) {
      console.error('Error cargando datos de CXP:', error);
    }

    // Cargar datos de Tesorería
    try {
      let tesoreriaData = [];

      // Intentar cargar desde Firebase primero
      if (window.firebaseRepos && window.firebaseRepos.tesoreria) {
        try {
          const repoTesoreria = window.firebaseRepos.tesoreria;

          // Esperar a que el repositorio esté inicializado
          // Intentar inicializar una vez si no está listo
          if (
            typeof repoTesoreria.init === 'function' &&
            (!repoTesoreria.db || !repoTesoreria.tenantId)
          ) {
            try {
              await repoTesoreria.init();
            } catch (initError) {
              // Ignorar errores y continuar con fallback
            }
          }

          if (repoTesoreria.db && repoTesoreria.tenantId) {
            tesoreriaData = await repoTesoreria.getAllMovimientos();
            if (tesoreriaData && tesoreriaData.length > 0) {
              console.log('🔥 Datos de tesorería cargados desde Firebase:', tesoreriaData.length);
            }
          } else {
            reportesLog.debug(
              'ℹ️ Repositorio tesorería no inicializado completamente, usando localStorage como fallback'
            );
          }
        } catch (error) {
          const isQuotaError =
            error &&
            (error.code === 'resource-exhausted' ||
              error.code === 'permission-denied' ||
              error.message?.includes('Quota exceeded'));

          if (isQuotaError) {
            reportesLog.warn('⚠️ Cuota de Firebase excedida para tesorería, usando localStorage');
          } else {
            reportesLog.debug(
              'ℹ️ Error cargando tesorería desde Firebase, usando localStorage:',
              error.message
            );
          }
        }
      } else {
        reportesLog.debug('ℹ️ Repositorio tesorería no disponible aún, usando localStorage');
      }

      // Fallback a localStorage si Firebase falla o no hay datos
      if (tesoreriaData.length === 0) {
        tesoreriaData = JSON.parse(localStorage.getItem('erp_tesoreria_movimientos') || '[]');
        console.log('📋 Datos de tesorería encontrados en localStorage:', tesoreriaData.length);
      }

      tesoreriaData.forEach(item => {
        data.push({
          id: item.id || `TES-${Date.now()}`,
          departamento: 'tesoreria',
          estado: 'completado',
          fecha: item.fecha || new Date().toISOString(),
          cliente: item.cliente || 'N/A',
          servicio: item.tipoMovimiento || 'movimiento',
          peso: 0,
          origen: 'N/A',
          destino: 'N/A',
          valor: item.monto || 0
        });
      });

      // Actualizar el gráfico de movimientos de dinero después de cargar los datos
      if (tesoreriaData.length > 0 && typeof window.actualizarGraficoMovimientos === 'function') {
        setTimeout(() => {
          console.log(
            '🔄 Actualizando gráfico de movimientos de dinero después de cargar datos de tesorería...'
          );
          window
            .actualizarGraficoMovimientos()
            .catch(err => console.error('Error actualizando gráfico:', err));
        }, 300);
      }
    } catch (error) {
      console.error('Error cargando datos de tesorería:', error);
    }

    // Cargar datos de Mantenimiento
    try {
      let mantenimientoData = [];

      // Intentar cargar desde Firebase primero
      if (window.firebaseRepos && window.firebaseRepos.mantenimiento) {
        try {
          const repoMantenimiento = window.firebaseRepos.mantenimiento;

          // Esperar a que el repositorio esté inicializado
          let attempts = 0;
          const maxAttempts = 10;
          while (attempts < maxAttempts && (!repoMantenimiento.db || !repoMantenimiento.tenantId)) {
            attempts++;
            if (attempts === 1) {
              console.log('⏳ Esperando inicialización del repositorio mantenimiento...');
            }
            await new Promise(resolve => setTimeout(resolve, 300));

            if (typeof repoMantenimiento.init === 'function') {
              try {
                await repoMantenimiento.init();
              } catch (initError) {
                // Ignorar errores de inicialización y continuar
              }
            }
          }

          if (repoMantenimiento.db && repoMantenimiento.tenantId) {
            mantenimientoData = await repoMantenimiento.getAllRegistros();
            if (mantenimientoData && mantenimientoData.length > 0) {
              console.log(
                '🔥 Datos de mantenimiento cargados desde Firebase:',
                mantenimientoData.length
              );
            }
          } else {
            reportesLog.debug(
              'ℹ️ Repositorio mantenimiento no inicializado completamente, usando localStorage como fallback'
            );
          }
        } catch (error) {
          const isQuotaError =
            error &&
            (error.code === 'resource-exhausted' ||
              error.code === 'permission-denied' ||
              error.message?.includes('Quota exceeded'));

          if (isQuotaError) {
            reportesLog.warn(
              '⚠️ Cuota de Firebase excedida para mantenimiento, usando localStorage'
            );
          } else {
            reportesLog.debug(
              'ℹ️ Error cargando mantenimiento desde Firebase, usando localStorage:',
              error.message
            );
          }
        }
      } else {
        reportesLog.debug('ℹ️ Repositorio mantenimiento no disponible aún, usando localStorage');
      }

      // Fallback a localStorage si Firebase falla o no hay datos
      // IMPORTANTE: Filtrar por tenantId para evitar mostrar datos de otros usuarios
      if (mantenimientoData.length === 0) {
        let mantenimientoLocal = JSON.parse(localStorage.getItem('erp_mantenimientos') || '[]');
        console.log(
          '📋 Datos de mantenimiento encontrados en localStorage:',
          mantenimientoLocal.length
        );

        // Filtrar por tenantId si está disponible
        const currentTenantId =
          window.firebaseRepos?.mantenimiento?.tenantId ||
          localStorage.getItem('tenantId') ||
          window.firebaseAuth?.currentUser?.uid;

        if (currentTenantId && mantenimientoLocal.length > 0) {
          const beforeFilter = mantenimientoLocal.length;
          mantenimientoLocal = mantenimientoLocal.filter(item => {
            // Si el item tiene tenantId, debe coincidir
            if (item.tenantId) {
              return item.tenantId === currentTenantId;
            }
            // Si el item tiene userId, debe coincidir con el usuario actual
            if (item.userId && window.firebaseAuth?.currentUser?.uid) {
              return item.userId === window.firebaseAuth.currentUser.uid;
            }
            // Si no tiene tenantId ni userId, solo incluirlo si no hay tenantId configurado
            // (para compatibilidad con datos antiguos)
            return true; // Mantener datos sin tenantId para compatibilidad
          });
          console.log(
            `📋 Datos de mantenimiento después de filtrar por tenantId (${currentTenantId}): ${mantenimientoLocal.length} de ${beforeFilter}`
          );
        }

        mantenimientoData = mantenimientoLocal;
      }

      mantenimientoData.forEach(item => {
        data.push({
          id: item.id || `MAN-${Date.now()}`,
          departamento: 'mantenimiento',
          estado: item.estado || 'completado',
          fecha: item.fecha || new Date().toISOString(),
          cliente: item.operador || 'N/A',
          servicio: item.tipoMantenimiento || 'mantenimiento',
          peso: 0,
          origen: 'N/A',
          destino: 'N/A',
          valor: item.costo || 0
        });
      });
    } catch (error) {
      console.error('Error cargando datos de mantenimiento:', error);
    }

    // Cargar datos de Inventario
    try {
      let inventarioData = [];

      // PRIORIDAD 1: Intentar cargar desde Firebase
      if (window.firebaseRepos && window.firebaseRepos.inventario) {
        try {
          const repoInventario = window.firebaseRepos.inventario;

          // Esperar a que el repositorio esté inicializado
          // Intentar inicializar una vez si no está listo
          if (
            typeof repoInventario.init === 'function' &&
            (!repoInventario.db || !repoInventario.tenantId)
          ) {
            try {
              await repoInventario.init();
            } catch (initError) {
              // Ignorar errores y continuar con fallback
            }
          }

          if (repoInventario.db && repoInventario.tenantId) {
            inventarioData = await repoInventario.getAllMovimientos();
            if (inventarioData && inventarioData.length > 0) {
              console.log(
                '📊 Movimientos de inventario cargados desde Firebase:',
                inventarioData.length
              );
            }
          } else {
            reportesLog.debug(
              'ℹ️ Repositorio inventario no inicializado completamente, usando localStorage como fallback'
            );
          }
        } catch (error) {
          const isQuotaError =
            error &&
            (error.code === 'resource-exhausted' ||
              error.code === 'permission-denied' ||
              error.message?.includes('Quota exceeded'));

          if (isQuotaError) {
            reportesLog.warn('⚠️ Cuota de Firebase excedida para inventario, usando localStorage');
          } else {
            reportesLog.debug(
              'ℹ️ Error cargando inventario desde Firebase, usando localStorage:',
              error.message
            );
          }
        }
      } else {
        reportesLog.debug('ℹ️ Repositorio inventario no disponible aún, usando localStorage');
      }

      // PRIORIDAD 2: Fallback a localStorage si Firebase falla o no hay datos
      if (!inventarioData || inventarioData.length === 0) {
        inventarioData = JSON.parse(localStorage.getItem('erp_inv_refacciones_movs') || '[]');
      }

      inventarioData.forEach(item => {
        // Asegurar que la fecha esté en formato YYYY-MM-DD
        let fechaItem = item.fecha;
        if (!fechaItem) {
          fechaItem = new Date().toISOString().split('T')[0];
        } else if (typeof fechaItem === 'string') {
          // Si es formato YYYY-MM-DD, usarlo directamente
          if (/^\d{4}-\d{2}-\d{2}/.test(fechaItem)) {
            fechaItem = fechaItem.split('T')[0];
          } else if (fechaItem.includes('T')) {
            // Formato ISO con hora, extraer solo la fecha
            fechaItem = fechaItem.split('T')[0];
          } else {
            // Otro formato, intentar parsear
            try {
              const fecha = new Date(fechaItem);
              const year = fecha.getFullYear();
              const month = String(fecha.getMonth() + 1).padStart(2, '0');
              const day = String(fecha.getDate()).padStart(2, '0');
              fechaItem = `${year}-${month}-${day}`;
            } catch (e) {
              fechaItem = new Date().toISOString().split('T')[0];
            }
          }
        }

        data.push({
          id: `INV-${item.id || Date.now()}`,
          departamento: 'inventario',
          estado: 'completado',
          fecha: fechaItem, // Usar la fecha parseada correctamente
          cliente: item.proveedor || 'N/A',
          servicio: item.tipo || 'movimiento',
          peso: item.cant || 0,
          origen: 'N/A',
          destino: item.almacen || 'N/A',
          valor: 0
        });
      });
    } catch (error) {
      console.error('Error cargando datos de inventario:', error);
    }

    // NOTA: CXC y CXP ya se cargaron arriba, no duplicar

    console.log('📊 Total de datos cargados desde todos los módulos:', data.length);
    console.log('📋 Resumen por departamento:');

    // Contar por departamento
    const resumen = {};
    data.forEach(item => {
      resumen[item.departamento] = (resumen[item.departamento] || 0) + 1;
    });

    Object.entries(resumen).forEach(([depto, count]) => {
      console.log(`  - ${depto}: ${count} registros`);
    });

    return data;
  }

  generateMockData() {
    const data = [];
    const departments = ['logistica', 'facturacion', 'trafico'];
    const states = ['completado', 'pendiente', 'en_proceso'];
    const services = ['general', 'urgente', 'doble-operador'];

    // Generar datos de los últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      for (let j = 0; j < Math.floor(Math.random() * 20) + 10; j++) {
        const randomDate = new Date(date);
        randomDate.setDate(Math.floor(Math.random() * 28) + 1);

        data.push({
          id: `REG-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(j + 1).padStart(4, '0')}`,
          departamento: departments[Math.floor(Math.random() * departments.length)],
          estado: states[Math.floor(Math.random() * states.length)],
          fecha: randomDate.toISOString(),
          cliente: `Cliente ${Math.floor(Math.random() * 100) + 1}`,
          servicio: services[Math.floor(Math.random() * services.length)],
          peso: Math.floor(Math.random() * 1000) + 100,
          origen: `Ciudad ${Math.floor(Math.random() * 50) + 1}`,
          destino: `Ciudad ${Math.floor(Math.random() * 50) + 1}`,
          valor: Math.floor(Math.random() * 5000) + 500
        });
      }
    }

    return data;
  }

  async updateKPIs(data) {
    // Obtener el mes del filtro (o mes actual si no hay filtro)
    const filtro = this.obtenerMesFiltro();
    console.log('📅 Filtro de mes para KPIs:', { mes: filtro.mes + 1, año: filtro.año });

    // Contar registros de logística - FILTRAR POR MES
    // PRIORIDAD: Usar fechaEnvio para logística (es la fecha más relevante)
    const todosLosLogistica = data.filter(item => item.departamento === 'logistica');
    console.log(`🔍 DEBUG Logística: Total registros encontrados: ${todosLosLogistica.length}`);
    todosLosLogistica.forEach((item, idx) => {
      console.log(`  Registro ${idx + 1} completo:`, JSON.stringify(item, null, 2));
    });

    const logisticaFiltrada = todosLosLogistica.filter(item => {
      // PRIORIDAD: Usar fechaEnvio para logística (es la fecha más relevante)
      // Si fechaEnvio no existe o es undefined/null, usar fecha como fallback
      const fecha =
        item.fechaEnvio && item.fechaEnvio !== 'undefined' && item.fechaEnvio !== 'null'
          ? item.fechaEnvio
          : item.fecha || item.fechaCreacion;

      if (!fecha) {
        console.log('⚠️ Registro logística sin fecha:', {
          id: item.id,
          fechaEnvio: item.fechaEnvio || 'N/A',
          fecha: item.fecha || 'N/A',
          fechaCreacion: item.fechaCreacion || 'N/A'
        });
        return false;
      }

      const pertenece = this.perteneceAlMesFiltro(fecha);
      // Log detallado para diagnóstico
      if (!pertenece) {
        console.log('🔍 Registro logística NO filtrado:', {
          id: item.id,
          fechaEnvio: item.fechaEnvio || 'N/A',
          fecha: item.fecha || 'N/A',
          fechaUsada: fecha,
          pertenece: pertenece,
          filtro: `${filtro.mes + 1}/${filtro.año}`
        });
      } else {
        console.log('✅ Registro logística SÍ filtrado:', {
          id: item.id,
          fechaEnvio: item.fechaEnvio || 'N/A',
          fecha: item.fecha || 'N/A',
          fechaUsada: fecha,
          pertenece: pertenece
        });
      }
      return pertenece;
    });
    const logistica = logisticaFiltrada.length;

    // Log de diagnóstico detallado
    if (todosLosLogistica.length > 0) {
      console.log(
        `📊 KPIs de Logística: ${logistica} registros del mes filtrado ${filtro.mes + 1}/${filtro.año} (de ${todosLosLogistica.length} totales)`
      );
      // Mostrar información de todos los registros para diagnóstico
      todosLosLogistica.forEach((item, idx) => {
        // Usar la misma lógica de fecha que el filtro
        const fecha = item.fechaEnvio || item.fecha || item.fechaCreacion;
        const pertenece = fecha ? this.perteneceAlMesFiltro(fecha) : false;
        console.log(
          `  Registro ${idx + 1}: ID=${item.id}, fechaEnvio=${item.fechaEnvio || 'N/A'}, fecha=${item.fecha || 'N/A'}, fechaUsada=${fecha || 'N/A'}, Pertenece=${pertenece}`
        );
      });
    } else {
      console.log(`📊 KPIs de Logística: ${logistica} registros`);
    }

    // Contar registros de tráfico - FILTRAR POR MES
    const todosLosTrafico = data.filter(item => item.departamento === 'trafico');
    const traficoFiltrado = todosLosTrafico.filter(item => {
      // PRIORIDAD: Usar fechaEnvio para tráfico (es la fecha más relevante)
      // Si fechaEnvio no existe o es undefined/null, usar fecha como fallback
      const fecha =
        item.fechaEnvio && item.fechaEnvio !== 'undefined' && item.fechaEnvio !== 'null'
          ? item.fechaEnvio
          : item.fecha || item.fechaCreacion || item.fechaSalida;

      if (!fecha) {
        console.log('⚠️ Registro tráfico sin fecha:', {
          id: item.id,
          fechaEnvio: item.fechaEnvio || 'N/A',
          fecha: item.fecha || 'N/A',
          fechaCreacion: item.fechaCreacion || 'N/A',
          fechaSalida: item.fechaSalida || 'N/A'
        });
        return false;
      }

      const pertenece = this.perteneceAlMesFiltro(fecha);
      // Log detallado para diagnóstico
      if (!pertenece) {
        console.log('🔍 Registro tráfico NO filtrado:', {
          id: item.id,
          fechaEnvio: item.fechaEnvio || 'N/A',
          fecha: item.fecha || 'N/A',
          fechaUsada: fecha,
          pertenece: pertenece,
          filtro: `${filtro.mes + 1}/${filtro.año}`
        });
      } else {
        console.log('✅ Registro tráfico SÍ filtrado:', {
          id: item.id,
          fechaEnvio: item.fechaEnvio || 'N/A',
          fecha: item.fecha || 'N/A',
          fechaUsada: fecha,
          pertenece: pertenece
        });
      }
      return pertenece;
    });
    const trafico = traficoFiltrado.length;

    // Log de diagnóstico detallado
    if (todosLosTrafico.length > 0) {
      console.log('📊 KPIs de Tráfico:', {
        total: todosLosTrafico.length,
        filtrado: trafico,
        mesFiltro: `${filtro.mes + 1}/${filtro.año}`
      });
      // Mostrar información de todos los registros para diagnóstico
      todosLosTrafico.forEach((item, idx) => {
        const fecha = item.fechaEnvio || item.fecha || item.fechaCreacion || item.fechaSalida;
        const pertenece = fecha ? this.perteneceAlMesFiltro(fecha) : false;
        console.log(
          `  Registro ${idx + 1}: ID=${item.id}, fechaEnvio=${item.fechaEnvio || 'N/A'}, fecha=${item.fecha || 'N/A'}, fechaCreacion=${item.fechaCreacion || 'N/A'}, fechaSalida=${item.fechaSalida || 'N/A'}, fechaUsada=${fecha || 'SIN FECHA'}, Pertenece=${pertenece}`
        );
      });
    } else {
      console.log('📊 KPIs de Tráfico:', { total: trafico });
    }
    // Calcular monto total gastado en diesel (desde Firebase y localStorage) - filtrado por mes
    let totalDiesel = 0;
    try {
      let dieselData = [];

      // PRIORIDAD 1: Cargar desde Firebase
      if (window.firebaseRepos && window.firebaseRepos.diesel) {
        try {
          const repoDiesel = window.firebaseRepos.diesel;
          // Verificar que esté inicializado
          if (repoDiesel.db && repoDiesel.tenantId) {
            dieselData = await repoDiesel.getAllMovimientos();
            if (dieselData && dieselData.length > 0) {
              console.log(
                '🔥 Datos de diesel cargados desde Firebase para KPI:',
                dieselData.length
              );
            }
          }
        } catch (error) {
          // Usar fallback silenciosamente
          reportesLog.debug('ℹ️ Usando localStorage para KPI de diesel:', error.message);
        }
      }

      // PRIORIDAD 2: Cargar desde localStorage y combinar
      const dieselLocal = JSON.parse(localStorage.getItem('erp_diesel_movimientos') || '[]');

      // Combinar datos evitando duplicados
      const existingIds = new Set(dieselData.map(item => item.id || item.movimientoId));
      dieselLocal.forEach(item => {
        const itemId = item.id || item.movimientoId;
        if (!existingIds.has(itemId)) {
          dieselData.push(item);
          existingIds.add(itemId);
        }
      });

      console.log('📊 Total datos de diesel combinados para KPI:', dieselData.length);

      // Filtrar por mes
      const dieselFiltrado = dieselData.filter(movimiento =>
        this.perteneceAlMesFiltro(movimiento.fecha || movimiento.fechaCreacion)
      );
      console.log('📊 Datos de diesel filtrados por mes:', dieselFiltrado.length);

      totalDiesel = dieselFiltrado.reduce((sum, movimiento) => {
        // Sumar el costo total de cada movimiento
        if (movimiento.costoTotal) {
          return sum + parseFloat(movimiento.costoTotal);
        }
        return sum;
      }, 0);
    } catch (error) {
      console.error('Error cargando datos de diesel:', error);
      totalDiesel = 0;
    }
    // Contar registros de mantenimiento desde localStorage - filtrado por mes
    let registrosMantenimiento = 0;
    try {
      const mantenimientoData = JSON.parse(localStorage.getItem('erp_mantenimientos') || '[]');
      const mantenimientoFiltrado = mantenimientoData.filter(item =>
        this.perteneceAlMesFiltro(item.fechaServicio || item.fecha || item.fechaCreacion)
      );
      registrosMantenimiento = mantenimientoFiltrado.length;
      console.log(
        '📊 Registros de mantenimiento encontrados (mes filtrado):',
        registrosMantenimiento
      );
    } catch (error) {
      console.error('Error cargando registros de mantenimiento:', error);
      registrosMantenimiento = 0;
    }
    // Contar productos únicos en inventario - filtrado por mes
    let productosInventario = 0;
    try {
      let inventarioData = [];

      // PRIORIDAD 1: Intentar cargar desde Firebase
      if (window.firebaseRepos && window.firebaseRepos.inventario) {
        try {
          const repoInventario = window.firebaseRepos.inventario;
          if (repoInventario.db && repoInventario.tenantId) {
            inventarioData = await repoInventario.getAllMovimientos();
            if (inventarioData && inventarioData.length > 0) {
              console.log(
                '📊 Movimientos de inventario cargados desde Firebase para KPI:',
                inventarioData.length
              );
            }
          }
        } catch (error) {
          reportesLog.debug(
            'ℹ️ Error cargando inventario desde Firebase para KPI, usando localStorage:',
            error.message
          );
        }
      }

      // PRIORIDAD 2: Fallback a localStorage si Firebase falla o no hay datos
      if (!inventarioData || inventarioData.length === 0) {
        inventarioData = JSON.parse(localStorage.getItem('erp_inv_refacciones_movs') || '[]');
      }

      // Filtrar movimientos por mes
      const inventarioFiltrado = inventarioData.filter(item => {
        const fechaItem = item.fecha || item.fechaCreacion;
        return this.perteneceAlMesFiltro(fechaItem);
      });

      // Contar productos únicos en los movimientos filtrados
      const productosUnicos = new Set(
        inventarioFiltrado.map(item => item.cod || item.codigo).filter(cod => cod)
      );
      productosInventario = productosUnicos.size;

      console.log(
        '📊 Productos de inventario filtrados por mes:',
        productosInventario,
        `(de ${inventarioData.length} movimientos totales)`
      );
    } catch (error) {
      console.error('Error cargando productos de inventario:', error);
      productosInventario = 0;
    }

    // Calcular totales financieros - Monto pendiente filtrado por fecha de emisión
    let totalCXC = 0;
    try {
      console.log('🔵 INICIANDO cálculo de CXC para KPIs...');
      let cxcData = [];

      // PRIORIDAD 1: Cargar desde Firebase
      console.log('🔵 Verificando Firebase repos para CXC...', {
        tieneFirebaseRepos: Boolean(window.firebaseRepos),
        tieneCXC: Boolean(window.firebaseRepos && window.firebaseRepos.cxc)
      });
      if (window.firebaseRepos && window.firebaseRepos.cxc) {
        try {
          const repoCXC = window.firebaseRepos.cxc;
          if (repoCXC.db && repoCXC.tenantId) {
            cxcData = await repoCXC.getAllFacturas();
            if (cxcData && cxcData.length > 0) {
              console.log('🔥 Datos de CXC cargados desde Firebase para KPI:', cxcData.length);
            }
          }
        } catch (error) {
          reportesLog.debug(
            'ℹ️ Error cargando CXC desde Firebase para KPI, usando localStorage:',
            error.message
          );
        }
      }

      // PRIORIDAD 2: Fallback a localStorage
      console.log('🔵 Datos de CXC desde Firebase:', cxcData.length);
      if (cxcData.length === 0) {
        console.log('🔵 Intentando cargar desde localStorage...');
        const cxcLocal = JSON.parse(localStorage.getItem('erp_cxc_data') || '[]');
        console.log('🔵 Datos en erp_cxc_data:', cxcLocal.length);
        if (Array.isArray(cxcLocal) && cxcLocal.length > 0) {
          cxcData = cxcLocal;
          console.log('📋 Datos de CXC cargados desde erp_cxc_data para KPI:', cxcData.length);
        } else {
          // Intentar desde erp_cxc_facturas
          const cxcFacturas = JSON.parse(localStorage.getItem('erp_cxc_facturas') || '[]');
          console.log('🔵 Datos en erp_cxc_facturas:', cxcFacturas.length);
          if (Array.isArray(cxcFacturas) && cxcFacturas.length > 0) {
            cxcData = cxcFacturas;
            console.log(
              '📋 Datos de CXC cargados desde erp_cxc_facturas para KPI:',
              cxcData.length
            );
          }
        }
      }

      console.log('🔵 Total datos de CXC cargados:', cxcData.length);

      // Debug: Mostrar información sobre las facturas cargadas
      if (cxcData.length > 0) {
        console.log(
          '🔍 Debug CXC - Primeras 3 facturas:',
          cxcData.slice(0, 3).map(f => ({
            fechaEmision: f.fechaEmision || f.fecha || f.fechaCreacion,
            monto: f.monto,
            montoPagado: f.montoPagado,
            montoPendiente: f.montoPendiente,
            estado: f.estado,
            numeroFactura: f.numeroFactura || f.id
          }))
        );
      }

      // Obtener el filtro de mes actual
      const filtro = this.obtenerMesFiltro();
      console.log('📅 Filtro de mes activo:', { mes: filtro.mes + 1, año: filtro.año });

      // Obtener el último día del mes del filtro para comparar fechas de pago
      const ultimoDiaMesFiltro = new Date(filtro.año, filtro.mes + 1, 0); // Último día del mes
      ultimoDiaMesFiltro.setHours(23, 59, 59, 999); // Fin del día

      // Filtrar facturas por fecha de emisión según el mes del filtro
      // Si no hay fecha de emisión, incluir la factura (por seguridad)
      const cxcFiltrado = cxcData.filter(factura => {
        const fechaEmision = factura.fechaEmision || factura.fecha || factura.fechaCreacion;
        if (!fechaEmision) {
          reportesLog.warn(
            '⚠️ Factura sin fecha de emisión encontrada:',
            factura.numeroFactura || factura.id
          );
          // Si no tiene fecha, incluirla para no perder datos
          return true;
        }

        // Parsear la fecha manualmente para debug
        let fechaParseada = null;
        let mesFecha = null;
        let añoFecha = null;

        try {
          if (typeof fechaEmision === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaEmision)) {
            const fechaParte = fechaEmision.split('T')[0];
            const partes = fechaParte.split('-');
            if (partes.length === 3) {
              añoFecha = parseInt(partes[0], 10);
              mesFecha = parseInt(partes[1], 10) - 1; // Convertir a 0-11
              fechaParseada = {
                año: añoFecha,
                mes: mesFecha + 1, // Mostrar en formato 1-12
                mesIndex: mesFecha // Índice 0-11
              };
            }
          } else {
            const tempDate = new Date(fechaEmision);
            if (!isNaN(tempDate.getTime())) {
              añoFecha = tempDate.getFullYear();
              mesFecha = tempDate.getMonth(); // Ya está en 0-11
              fechaParseada = {
                año: añoFecha,
                mes: mesFecha + 1, // Mostrar en formato 1-12
                mesIndex: mesFecha // Índice 0-11
              };
            }
          }
        } catch (e) {
          reportesLog.warn('⚠️ Error parseando fecha:', e);
        }

        // Debug detallado: verificar por qué no pasa el filtro
        const pertenece = this.perteneceAlMesFiltro(fechaEmision);

        // Log detallado para cada factura
        console.log('🔍 Factura CXC filtro:', {
          numeroFactura: factura.numeroFactura || factura.id,
          fechaEmisionOriginal: fechaEmision,
          fechaParseada: fechaParseada,
          filtro: { mes: filtro.mes + 1, año: filtro.año, mesIndex: filtro.mes },
          pertenece: pertenece,
          comparacion: fechaParseada
            ? {
              mesCoincide: mesFecha === filtro.mes,
              añoCoincide: añoFecha === filtro.año,
              mesFecha: mesFecha,
              mesFiltro: filtro.mes,
              añoFecha: añoFecha,
              añoFiltro: filtro.año
            }
            : 'No se pudo parsear fecha'
        });

        return pertenece;
      });

      console.log(
        `📊 CXC - Facturas filtradas: ${cxcFiltrado.length} de ${cxcData.length} totales`
      );

      // Usar SOLO las facturas filtradas por mes (NO hacer fallback a todas)
      const facturasACalcular = cxcFiltrado;
      if (cxcFiltrado.length === 0 && cxcData.length > 0) {
        console.log('ℹ️ No hay facturas CXC en el mes seleccionado, monto pendiente será 0');
      }

      // Calcular monto pendiente de las facturas seleccionadas
      // Lógica: Mostrar el monto pendiente al final del mes seleccionado,
      // considerando solo los pagos realizados hasta ese mes
      totalCXC = facturasACalcular.reduce((sum, factura) => {
        // Calcular monto total de la factura
        const montoTotal = parseFloat(factura.monto || factura.total || 0);

        // Calcular monto pagado HASTA EL FINAL DEL MES DEL FILTRO
        // Solo contar pagos que se hicieron en o antes del mes seleccionado
        let montoPagadoHastaMesFiltro = 0;

        // PRIORIDAD 1: Si tiene array de pagos, sumar solo los pagos hasta el mes del filtro
        if (factura.pagos && Array.isArray(factura.pagos) && factura.pagos.length > 0) {
          montoPagadoHastaMesFiltro = factura.pagos.reduce((sumPagos, pago) => {
            const fechaPagoStr = pago.fecha || pago.fechaPago;
            if (!fechaPagoStr) {
              // Si no tiene fecha, no contarlo (por seguridad)
              return sumPagos;
            }

            // Parsear fecha de pago
            let fechaPago = null;
            try {
              if (typeof fechaPagoStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaPagoStr)) {
                const fechaParte = fechaPagoStr.split('T')[0];
                const [year, month, day] = fechaParte.split('-');
                fechaPago = new Date(
                  parseInt(year, 10),
                  parseInt(month, 10) - 1,
                  parseInt(day, 10)
                );
              } else if (typeof fechaPagoStr === 'string' && fechaPagoStr.includes('/')) {
                const partes = fechaPagoStr.split('/');
                if (partes.length === 3) {
                  const dia = parseInt(partes[0], 10);
                  const mes = parseInt(partes[1], 10) - 1;
                  const año = parseInt(partes[2], 10);
                  fechaPago = new Date(año, mes, dia);
                } else {
                  fechaPago = new Date(fechaPagoStr);
                }
              } else {
                fechaPago = new Date(fechaPagoStr);
              }
            } catch (e) {
              // Si hay error parseando, no contar el pago
              return sumPagos;
            }

            // Solo contar el pago si se hizo en o antes del mes del filtro
            if (fechaPago && !isNaN(fechaPago.getTime()) && fechaPago <= ultimoDiaMesFiltro) {
              const montoPago = parseFloat(pago.monto || 0);
              return sumPagos + montoPago;
            }

            return sumPagos;
          }, 0);
        }

        // PRIORIDAD 2: Si no hay pagos en el array o la suma es 0, verificar fechaPago directa
        if (montoPagadoHastaMesFiltro === 0 && factura.fechaPago) {
          let fechaPagoDirecta = null;
          try {
            const fechaPagoStr = factura.fechaPago;
            if (typeof fechaPagoStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaPagoStr)) {
              const fechaParte = fechaPagoStr.split('T')[0];
              const [year, month, day] = fechaParte.split('-');
              fechaPagoDirecta = new Date(
                parseInt(year, 10),
                parseInt(month, 10) - 1,
                parseInt(day, 10)
              );
            } else {
              fechaPagoDirecta = new Date(fechaPagoStr);
            }

            // Si el pago se hizo en o antes del mes del filtro, usar montoPagado
            if (
              fechaPagoDirecta &&
              !isNaN(fechaPagoDirecta.getTime()) &&
              fechaPagoDirecta <= ultimoDiaMesFiltro
            ) {
              montoPagadoHastaMesFiltro = parseFloat(factura.montoPagado || 0);
            }
          } catch (e) {
            // Si hay error, no usar montoPagado
          }
        }

        // Calcular monto pendiente al final del mes del filtro
        const montoPendienteAlFinalDelMes = montoTotal - montoPagadoHastaMesFiltro;

        // Asegurar que el monto pendiente no sea negativo
        const montoPendiente = montoPendienteAlFinalDelMes > 0 ? montoPendienteAlFinalDelMes : 0;

        // Solo sumar si hay monto pendiente positivo
        if (montoPendiente > 0) {
          return sum + montoPendiente;
        }

        return sum;
      }, 0);
      const mensajeFiltro = `(de ${cxcFiltrado.length} facturas del mes ${filtro.mes + 1}/${filtro.año}, de ${cxcData.length} totales)`;
      console.log('📊 CXC - Monto pendiente:', totalCXC, mensajeFiltro);
      console.log('🔵 FIN cálculo de CXC para KPIs. Total:', totalCXC);
    } catch (error) {
      console.error('❌ Error cargando CXC:', error);
      console.error('Stack trace:', error.stack);
      console.error('❌ Error completo:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      totalCXC = 0;
    }

    // Calcular total de Cuentas por Pagar - Monto pendiente TOTAL (sin filtrar por mes)
    let totalCXP = 0;
    try {
      let cxpData = [];

      // PRIORIDAD 1: Cargar desde Firebase
      if (window.firebaseRepos && window.firebaseRepos.cxp) {
        try {
          const repoCXP = window.firebaseRepos.cxp;
          if (repoCXP.db && repoCXP.tenantId) {
            cxpData = await repoCXP.getAllFacturas();
            if (cxpData && cxpData.length > 0) {
              console.log('🔥 Datos de CXP cargados desde Firebase para KPI:', cxpData.length);
            }
          }
        } catch (error) {
          reportesLog.debug(
            'ℹ️ Error cargando CXP desde Firebase para KPI, usando localStorage:',
            error.message
          );
        }
      }

      // PRIORIDAD 2: Fallback a localStorage
      if (cxpData.length === 0) {
        cxpData = JSON.parse(localStorage.getItem('erp_cxp_facturas') || '[]');
        console.log('📋 Datos de CXP cargados desde localStorage para KPI:', cxpData.length);
      }

      // Obtener el filtro de mes para CXP también
      const filtroCXP = this.obtenerMesFiltro();

      // Filtrar facturas por fecha de emisión según el mes del filtro
      const cxpFiltrado = cxpData.filter(factura => {
        const fechaEmision = factura.fechaEmision || factura.fecha || factura.fechaCreacion;
        if (!fechaEmision) {
          reportesLog.warn(
            '⚠️ Factura CXP sin fecha de emisión encontrada:',
            factura.numeroFactura || factura.id
          );
          return true; // Incluir si no tiene fecha
        }

        // Parsear la fecha manualmente para debug
        let fechaParseada = null;
        let mesFecha = null;
        let añoFecha = null;

        try {
          if (typeof fechaEmision === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaEmision)) {
            const fechaParte = fechaEmision.split('T')[0];
            const partes = fechaParte.split('-');
            if (partes.length === 3) {
              añoFecha = parseInt(partes[0], 10);
              mesFecha = parseInt(partes[1], 10) - 1; // Convertir a 0-11
              fechaParseada = {
                año: añoFecha,
                mes: mesFecha + 1, // Mostrar en formato 1-12
                mesIndex: mesFecha // Índice 0-11
              };
            }
          } else {
            const tempDate = new Date(fechaEmision);
            if (!isNaN(tempDate.getTime())) {
              añoFecha = tempDate.getFullYear();
              mesFecha = tempDate.getMonth(); // Ya está en 0-11
              fechaParseada = {
                año: añoFecha,
                mes: mesFecha + 1, // Mostrar en formato 1-12
                mesIndex: mesFecha // Índice 0-11
              };
            }
          }
        } catch (e) {
          reportesLog.warn('⚠️ Error parseando fecha CXP:', e);
        }

        const pertenece = this.perteneceAlMesFiltro(fechaEmision);

        // Log detallado para cada factura CXP
        console.log('🔍 Factura CXP filtro:', {
          numeroFactura: factura.numeroFactura || factura.id,
          fechaEmisionOriginal: fechaEmision,
          fechaParseada: fechaParseada,
          filtro: { mes: filtroCXP.mes + 1, año: filtroCXP.año, mesIndex: filtroCXP.mes },
          pertenece: pertenece,
          comparacion: fechaParseada
            ? {
              mesCoincide: mesFecha === filtroCXP.mes,
              añoCoincide: añoFecha === filtroCXP.año,
              mesFecha: mesFecha,
              mesFiltro: filtroCXP.mes,
              añoFecha: añoFecha,
              añoFiltro: filtroCXP.año
            }
            : 'No se pudo parsear fecha'
        });

        return pertenece;
      });

      console.log(
        `📊 CXP - Facturas filtradas: ${cxpFiltrado.length} de ${cxpData.length} totales`
      );

      // Usar SOLO las facturas filtradas por mes (NO hacer fallback a todas)
      const facturasACalcularCXP = cxpFiltrado;
      if (cxpFiltrado.length === 0 && cxpData.length > 0) {
        console.log('ℹ️ No hay facturas CXP en el mes seleccionado, monto pendiente será 0');
      }

      // Calcular monto pendiente de las facturas seleccionadas
      totalCXP = facturasACalcularCXP.reduce((sum, factura) => {
        // Calcular monto pendiente: usar montoPendiente si existe, si no calcularlo
        let montoPendiente = 0;

        if (factura.montoPendiente !== undefined && factura.montoPendiente !== null) {
          montoPendiente = parseFloat(factura.montoPendiente);
        } else {
          // Si no tiene montoPendiente, calcularlo: monto - montoPagado
          const montoTotal = parseFloat(factura.monto || 0);
          const montoPagado = parseFloat(factura.montoPagado || 0);
          montoPendiente = montoTotal - montoPagado;
        }

        // Solo sumar si hay monto pendiente positivo
        if (montoPendiente > 0) {
          return sum + montoPendiente;
        }

        return sum;
      }, 0);
      const mensajeFiltroCXP = `(de ${cxpFiltrado.length} facturas del mes ${filtroCXP.mes + 1}/${filtroCXP.año}, de ${cxpData.length} totales)`;
      console.log('📊 CXP - Monto pendiente:', totalCXP, mensajeFiltroCXP);
    } catch (error) {
      console.error('Error cargando CXP:', error);
      totalCXP = 0;
    }
    // Calcular total de gastos de operadores desde localStorage - filtrado por mes
    let totalTesoreria = 0;
    try {
      const operadoresData = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');
      const gastosFiltrados = operadoresData.filter(gasto =>
        this.perteneceAlMesFiltro(gasto.fecha || gasto.fechaCreacion)
      );
      totalTesoreria = gastosFiltrados.reduce((sum, gasto) => {
        // Sumar todos los gastos que tienen monto (independientemente del estado)
        if (gasto.monto) {
          return sum + parseFloat(gasto.monto);
        }
        return sum;
      }, 0);
      console.log('💰 Total gastos de operadores (mes filtrado):', totalTesoreria);
    } catch (error) {
      console.error('Error cargando gastos de operadores:', error);
      totalTesoreria = 0;
    }

    // Contar incidencias desde localStorage - filtrado por mes
    let incidencias = 0;
    try {
      const incidenciasData = JSON.parse(
        localStorage.getItem('erp_operadores_incidencias') || '[]'
      );
      const incidenciasFiltradas = incidenciasData.filter(incidencia => {
        const fechaStr = incidencia.fecha || incidencia.fechaIncidencia || incidencia.fechaCreacion;
        return this.perteneceAlMesFiltro(fechaStr);
      });
      incidencias = incidenciasFiltradas.length;
      console.log(
        '📊 Incidencias filtradas por mes:',
        incidencias,
        `(de ${incidenciasData.length} totales)`
      );
    } catch (error) {
      console.error('Error cargando incidencias:', error);
      incidencias = 0;
    }

    // Actualizar KPIs principales
    console.log('🔄 Actualizando elementos del DOM...');

    const elementosKPI = {
      totalLogistica: logistica,
      totalTrafico: trafico,
      totalDiesel: `$${totalDiesel.toLocaleString()}`,
      totalMantenimiento: registrosMantenimiento,
      totalInventario: productosInventario,
      totalCXC: `$${totalCXC.toLocaleString()}`,
      totalCXP: `$${totalCXP.toLocaleString()}`,
      totalTesoreria: `$${totalTesoreria.toLocaleString()}`,
      totalIncidencias: incidencias
    };

    Object.keys(elementosKPI).forEach(id => {
      const elemento = document.getElementById(id);
      if (elemento) {
        const valor = elementosKPI[id];
        // Si es un número, formatearlo; si es string, usarlo directamente
        if (typeof valor === 'number') {
          elemento.textContent = valor.toLocaleString('es-MX');
        } else if (typeof valor === 'string' && valor.startsWith('$')) {
          // Ya está formateado como moneda
          elemento.textContent = valor;
        } else {
          // String normal
          elemento.textContent = String(valor);
        }
        console.log(`✅ KPI ${id} actualizado: ${elemento.textContent}`);
      } else {
        console.error(`❌ Elemento ${id} no encontrado en el DOM`);
        // Intentar buscar por selector alternativo
        const elementoAlt = document.querySelector(`#${id}, [id="${id}"]`);
        if (elementoAlt) {
          console.log(`✅ Elemento ${id} encontrado con selector alternativo`);
        }
      }
    });

    // Log final de resumen
    console.log('📊 Resumen de KPIs actualizados:', elementosKPI);
  }

  initializeCharts() {
    console.log('🔄 Inicializando gráficos...');

    // Verificar que Chart.js esté disponible
    if (typeof Chart === 'undefined') {
      reportesLog.warn('⚠️ Chart.js no está disponible aún, esperando...');
      // Reintentar después de un delay
      setTimeout(() => {
        if (typeof Chart !== 'undefined') {
          this.initializeCharts();
        } else {
          console.error(
            '❌ Chart.js no se pudo cargar. Verifica que el script esté incluido en la página.'
          );
        }
      }, 1000);
      return;
    }

    // Verificar que el canvas existe antes de crear el gráfico
    const viajesCanvas = document.getElementById('viajesChart');
    if (viajesCanvas) {
      try {
        const viajesCtx = viajesCanvas.getContext('2d');
        this.charts.viajes = new Chart(viajesCtx, {
          type: 'bar',
          data: {
            labels: [],
            datasets: [
              {
                label: 'Número de Viajes',
                data: [],
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 2,
            plugins: {
              title: {
                display: true,
                text: 'Viajes por Tractocamión'
              },
              legend: {
                display: true,
                position: 'top'
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    return `Económico: ${context.label} - Viajes: ${context.parsed.y}`;
                  }
                }
              }
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Económicos'
                },
                ticks: {
                  maxRotation: 45,
                  minRotation: 0
                }
              },
              y: {
                title: {
                  display: true,
                  text: '# Viajes'
                },
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        });
        console.log('✅ Gráfico de viajes inicializado correctamente');
      } catch (error) {
        console.error('❌ Error inicializando gráfico de viajes:', error);
      }
    } else {
      reportesLog.warn('⚠️ Canvas viajesChart no encontrado');
    }

    // Gráfico de pastel para tipos de servicio
    const serviciosCanvas = document.getElementById('serviciosChart');
    if (serviciosCanvas) {
      if (typeof Chart === 'undefined') {
        reportesLog.warn('⚠️ Chart.js no disponible para gráfico de servicios');
        return;
      }
      try {
        const serviciosCtx = serviciosCanvas.getContext('2d');
        this.charts.servicios = new Chart(serviciosCtx, {
          type: 'pie',
          data: {
            labels: [],
            datasets: [
              {
                data: [],
                backgroundColor: [
                  'rgba(255, 99, 132, 0.8)', // Rosa
                  'rgba(54, 162, 235, 0.8)', // Azul
                  'rgba(255, 205, 86, 0.8)', // Amarillo
                  'rgba(75, 192, 192, 0.8)', // Verde agua
                  'rgba(153, 102, 255, 0.8)', // Morado
                  'rgba(255, 159, 64, 0.8)', // Naranja
                  'rgba(199, 199, 199, 0.8)', // Gris
                  'rgba(83, 102, 255, 0.8)' // Azul oscuro
                ]
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1.5,
            plugins: {
              title: {
                display: false
              },
              legend: {
                display: true,
                position: 'top'
              }
            },
            layout: {
              padding: {
                top: 10,
                bottom: 10,
                left: 10,
                right: 10
              }
            }
          }
        });
        console.log('✅ Gráfico de servicios inicializado correctamente');
      } catch (error) {
        console.error('❌ Error inicializando gráfico de servicios:', error);
      }
    } else {
      reportesLog.warn('⚠️ Canvas serviciosChart no encontrado');
    }

    // Gráfico de consumo de diesel por económico
    const dieselCanvas = document.getElementById('dieselChart');
    if (dieselCanvas) {
      if (typeof Chart === 'undefined') {
        reportesLog.warn('⚠️ Chart.js no disponible para gráfico de diesel');
        return;
      }
      try {
        const dieselCtx = dieselCanvas.getContext('2d');
        this.charts.diesel = new Chart(dieselCtx, {
          type: 'radar',
          data: {
            labels: [],
            datasets: []
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1.5,
            plugins: {
              title: {
                display: false
              },
              legend: {
                display: true,
                position: 'top'
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    return `${context.dataset.label}: $${context.parsed.r.toLocaleString()}`;
                  }
                }
              }
            },
            layout: {
              padding: {
                top: 10,
                bottom: 10,
                left: 10,
                right: 10
              }
            },
            scales: {
              r: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Costo Diesel ($)'
                },
                ticks: {
                  callback: function (value) {
                    return `$${value.toLocaleString()}`;
                  }
                },
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)'
                },
                angleLines: {
                  color: 'rgba(0, 0, 0, 0.1)'
                }
              }
            },
            elements: {
              line: {
                borderWidth: 2
              },
              point: {
                radius: 4,
                hoverRadius: 6
              }
            }
          }
        });
        console.log('✅ Gráfico de diesel inicializado correctamente');
      } catch (error) {
        console.error('❌ Error inicializando gráfico de diesel:', error);
      }
    } else {
      reportesLog.warn('⚠️ Canvas dieselChart no encontrado');
    }

    console.log('✅ Inicialización de gráficos completada');
  }

  async updateCharts(data) {
    // Actualizar gráfico de viajes por Tractocamión
    await this.updateViajesChart();

    // Actualizar gráfico de servicios
    if (this.charts.servicios) {
      const serviceData = this.groupDataByService(data);
      this.charts.servicios.data.labels = serviceData.labels;
      this.charts.servicios.data.datasets[0].data = serviceData.values;
      this.charts.servicios.update();
      console.log('✅ Gráfico de servicios actualizado:', serviceData);
    } else {
      reportesLog.warn('⚠️ Gráfico de servicios no inicializado');
    }

    // Actualizar análisis por económico (con delay para asegurar que los datos estén cargados)
    setTimeout(() => {
      this.updateAnalisisEconomico().catch(err =>
        console.error('Error actualizando análisis:', err)
      );
    }, 500);

    // Actualizar gráfico de diesel
    this.updateDieselChart().catch(err =>
      console.error('Error actualizando gráfico de diesel:', err)
    );

    // Actualizar gráfico de movimientos de dinero (con delay para asegurar que los datos de tesorería estén cargados)
    setTimeout(() => {
      if (typeof window.actualizarGraficoMovimientos === 'function') {
        console.log('🔄 Actualizando gráfico de movimientos de dinero desde updateCharts()...');
        window
          .actualizarGraficoMovimientos()
          .catch(err => console.error('Error actualizando gráfico de movimientos de dinero:', err));
      }
    }, 800);
  }

  async updateViajesChart() {
    // Verificar que Chart.js esté disponible
    if (typeof Chart === 'undefined') {
      reportesLog.warn('⚠️ Chart.js no está disponible, esperando...');
      // Reintentar después de un delay
      setTimeout(() => this.updateViajesChart(), 1000);
      return;
    }

    // Verificar que el gráfico existe
    if (!this.charts.viajes) {
      reportesLog.warn('⚠️ Gráfico de viajes no inicializado, intentando inicializar...');
      // Intentar inicializar el gráfico si no existe
      this.initializeCharts();
      // Esperar un momento para que el gráfico se inicialice
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!this.charts.viajes) {
        console.error('❌ No se pudo inicializar el gráfico de viajes');
        return;
      }
    }

    try {
      console.log('🔄 === ACTUALIZANDO GRÁFICO DE VIAJES ===');

      // Cargar datos de viajes desde tráfico (async)
      const viajesData = await this.loadViajesData();
      console.log('📊 Datos de viajes cargados para el gráfico:', viajesData.length);

      if (viajesData.length === 0) {
        reportesLog.warn('⚠️ No hay datos de viajes para mostrar en el gráfico');
        // Mostrar mensaje en el gráfico
        if (this.charts.viajes) {
          this.charts.viajes.data.labels = ['Sin datos'];
          this.charts.viajes.data.datasets[0].data = [0];
          this.charts.viajes.data.datasets[0].backgroundColor = ['rgba(199, 199, 199, 0.8)'];
          this.charts.viajes.data.datasets[0].borderColor = ['rgba(199, 199, 199, 1)'];
          this.charts.viajes.update();
        }
        return;
      }

      // Mostrar muestra de datos para debugging
      console.log(
        '📋 Muestra de datos de viajes (primeros 5):',
        viajesData.slice(0, 5).map(v => ({
          id: v.numeroRegistro || v.registroId || v.id,
          economico: v.economico,
          numeroEconomico: v.numeroEconomico,
          tractocamion: v.tractocamion,
          fecha: v.fechaEnvio || v.fecha
        }))
      );

      const chartData = this.processViajesData(viajesData);
      console.log('📊 Datos procesados para el gráfico:', {
        labels: chartData.labels.length,
        values: chartData.values.length,
        sampleLabels: chartData.labels.slice(0, 5),
        sampleValues: chartData.values.slice(0, 5)
      });

      if (chartData.labels.length === 0 || chartData.values.length === 0) {
        // Verificar si realmente es un problema o solo no hay datos para el período
        const filtroMes = this.obtenerMesFiltro();
        const filtroTractocamion = document.getElementById('filtroTractocamion')?.value || '';
        const totalViajes = viajesData.length;

        // Solo mostrar warning si hay datos totales pero no pasan el filtro
        if (totalViajes > 0) {
          reportesLog.warn('⚠️ No hay datos para el gráfico después del filtrado:', {
            totalViajes,
            mesFiltro: `${filtroMes.mes + 1}/${filtroMes.año}`,
            tractocamionFiltro: filtroTractocamion || 'Todos',
            mensaje:
              'Los filtros aplicados no coinciden con ningún viaje. Considera ajustar los filtros.'
          });
        } else {
          // No hay datos en absoluto - esto es normal si no hay viajes registrados aún
          reportesLog.debug('ℹ️ No hay viajes registrados para mostrar en el gráfico');
        }

        // Mostrar mensaje en el gráfico
        if (this.charts.viajes) {
          this.charts.viajes.data.labels = ['Sin datos'];
          this.charts.viajes.data.datasets[0].data = [0];
          this.charts.viajes.data.datasets[0].backgroundColor = ['rgba(199, 199, 199, 0.8)'];
          this.charts.viajes.data.datasets[0].borderColor = ['rgba(199, 199, 199, 1)'];
          this.charts.viajes.update();
        }
        return;
      }

      // Generar colores únicos para cada económico
      const colors = this.generateColorsForEconomicos(chartData.labels);

      // Verificar que el gráfico existe antes de actualizar
      if (!this.charts.viajes) {
        console.error('❌ El gráfico de viajes no existe después de procesar los datos');
        return;
      }

      // Actualizar el gráfico con colores únicos
      this.charts.viajes.data.labels = chartData.labels;
      this.charts.viajes.data.datasets[0].data = chartData.values;
      this.charts.viajes.data.datasets[0].backgroundColor = colors.backgrounds;
      this.charts.viajes.data.datasets[0].borderColor = colors.borders;
      this.charts.viajes.update();

      console.log('✅ Gráfico de viajes actualizado correctamente con colores únicos');
      console.log(
        `✅ Mostrando ${chartData.labels.length} tractocamiones con ${chartData.values.reduce((a, b) => a + b, 0)} viajes totales`
      );
    } catch (error) {
      console.error('❌ Error actualizando gráfico de viajes:', error);
      console.error('❌ Stack trace:', error.stack);

      // Intentar mostrar un mensaje de error en el gráfico
      if (this.charts.viajes) {
        try {
          this.charts.viajes.data.labels = ['Error cargando datos'];
          this.charts.viajes.data.datasets[0].data = [0];
          this.charts.viajes.data.datasets[0].backgroundColor = ['rgba(255, 99, 132, 0.8)'];
          this.charts.viajes.data.datasets[0].borderColor = ['rgba(255, 99, 132, 1)'];
          this.charts.viajes.update();
        } catch (updateError) {
          console.error('❌ Error actualizando gráfico con mensaje de error:', updateError);
        }
      }
    }
  }

  async loadViajesData() {
    try {
      let traficoData = [];

      // PRIORIDAD 1: Intentar cargar desde Firebase
      if (window.firebaseRepos && window.firebaseRepos.trafico) {
        try {
          // Esperar a que el repositorio esté inicializado
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.trafico.db || !window.firebaseRepos.trafico.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 200));
            await window.firebaseRepos.trafico.init();
          }

          if (window.firebaseRepos.trafico.db && window.firebaseRepos.trafico.tenantId) {
            traficoData = await window.firebaseRepos.trafico.getAllRegistros();
            console.log('🔥 Datos de tráfico cargados desde Firebase:', traficoData.length);
          }
        } catch (error) {
          reportesLog.warn('⚠️ Error cargando tráfico desde Firebase:', error);
        }
      }

      // PRIORIDAD 2: Cargar desde erp_shared_data.trafico (formato actual)
      // Siempre cargar también desde localStorage para asegurar que tenemos todos los datos
      const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
      if (sharedData.trafico && typeof sharedData.trafico === 'object') {
        const localData = Object.values(sharedData.trafico);
        console.log(
          '📋 Datos de tráfico en localStorage (erp_shared_data.trafico):',
          localData.length
        );

        // Combinar datos de Firebase y localStorage, evitando duplicados
        const existingIds = new Set(
          traficoData.map(item => item.numeroRegistro || item.registroId || item.id)
        );
        localData.forEach(item => {
          const itemId = item.numeroRegistro || item.registroId || item.id;
          if (!existingIds.has(itemId)) {
            traficoData.push(item);
            existingIds.add(itemId);
          }
        });
        console.log('📋 Total datos de tráfico después de combinar:', traficoData.length);
      }

      // PRIORIDAD 3: Fallback a erp_trafico (formato antiguo)
      const oldData = localStorage.getItem('erp_trafico');
      if (oldData) {
        try {
          const parsed = JSON.parse(oldData);
          const oldDataArray = Array.isArray(parsed) ? parsed : Object.values(parsed);
          console.log('📋 Datos de tráfico en formato antiguo (erp_trafico):', oldDataArray.length);

          // Combinar evitando duplicados
          const existingIds = new Set(
            traficoData.map(item => item.numeroRegistro || item.registroId || item.id)
          );
          oldDataArray.forEach(item => {
            const itemId = item.numeroRegistro || item.registroId || item.id;
            if (!existingIds.has(itemId)) {
              traficoData.push(item);
              existingIds.add(itemId);
            }
          });
          console.log(
            '📋 Total datos de tráfico después de combinar formato antiguo:',
            traficoData.length
          );
        } catch (error) {
          reportesLog.warn('⚠️ Error parseando erp_trafico:', error);
        }
      }

      console.log('📊 Datos de viajes (tráfico) cargados:', traficoData.length, 'registros');

      // Log de muestra para debugging
      if (traficoData.length > 0) {
        console.log(
          '📋 Muestra de datos de tráfico (primeros 3):',
          traficoData.slice(0, 3).map(v => ({
            id: v.numeroRegistro || v.registroId || v.id,
            economico: v.economico,
            fecha: v.fechaEnvio || v.fecha
          }))
        );
      }

      return traficoData;
    } catch (error) {
      console.error('Error cargando datos de viajes:', error);
      return [];
    }
  }

  processViajesData(viajesData) {
    const filtroTractocamion = document.getElementById('filtroTractocamion')?.value || '';
    const fechaDesde = document.getElementById('fechaDesde')?.value;
    const fechaHasta = document.getElementById('fechaHasta')?.value;

    // Obtener el mes del filtro
    const filtro = this.obtenerMesFiltro();
    console.log('📅 Filtro de mes para gráfico de viajes:', {
      mes: filtro.mes + 1,
      año: filtro.año
    });

    console.log('🔍 === PROCESANDO DATOS DE VIAJES ===');
    console.log(`📊 Total de viajes: ${viajesData.length}`);
    console.log(`🚛 Filtro tractocamión: "${filtroTractocamion}"`);
    console.log(`📅 Filtro fecha desde: "${fechaDesde}"`);
    console.log(`📅 Filtro fecha hasta: "${fechaHasta}"`);

    // Filtrar datos
    let filteredData = viajesData;

    // Si no hay filtros de fecha específicos, aplicar filtro de mes
    if (!fechaDesde && !fechaHasta) {
      const beforeMonthFilter = filteredData.length;
      filteredData = filteredData.filter(viaje =>
        this.perteneceAlMesFiltro(viaje.fechaEnvio || viaje.fecha || viaje.fechaCreacion)
      );
      console.log(
        `📊 Viajes después del filtro de mes: ${filteredData.length} (de ${beforeMonthFilter})`
      );
    }

    // Verificar que hay datos antes de filtrar
    if (filteredData.length === 0) {
      reportesLog.warn('⚠️ No hay datos de viajes para procesar');
      return { labels: [], values: [] };
    }

    if (filtroTractocamion && filtroTractocamion !== '') {
      console.log(`🔍 Aplicando filtro de tractocamión: "${filtroTractocamion}"`);

      const beforeFilter = filteredData.length;

      // Intentar diferentes formatos de comparación
      filteredData = filteredData.filter(viaje => {
        // Buscar el económico en múltiples campos posibles
        const economicoViaje = String(
          viaje.economico ||
            viaje.numeroEconomico ||
            viaje.tractocamion ||
            viaje.Economico ||
            viaje.NumeroEconomico ||
            ''
        ).trim();

        const filtroTracto = String(filtroTractocamion).trim();

        // Si el económico está vacío, no incluir en el filtro
        if (!economicoViaje || economicoViaje === 'Sin económico') {
          return false;
        }

        // Comparación exacta
        if (economicoViaje === filtroTracto) {
          return true;
        }

        // Comparación sin espacios y en minúsculas
        if (
          economicoViaje.toLowerCase().replace(/\s+/g, '') ===
          filtroTracto.toLowerCase().replace(/\s+/g, '')
        ) {
          return true;
        }

        // Comparación parcial (contiene)
        if (economicoViaje.includes(filtroTracto) || filtroTracto.includes(economicoViaje)) {
          return true;
        }

        return false;
      });

      console.log(
        `📊 Viajes después del filtro de tractocamión: ${filteredData.length} (de ${beforeFilter})`
      );

      if (filteredData.length === 0) {
        reportesLog.warn('⚠️ El filtro de tractocamión eliminó todos los datos');
        reportesLog.warn(
          '💡 Sugerencia: Verifica que el tractocamión seleccionado existe en los datos'
        );
      }
    }

    if (fechaDesde) {
      const beforeDateFilter = filteredData.length;
      // Establecer fechaDesde al inicio del día (00:00:00)
      const fechaDesdeInicio = new Date(fechaDesde);
      fechaDesdeInicio.setHours(0, 0, 0, 0);

      filteredData = filteredData.filter(viaje => {
        const fechaViaje = viaje.fechaEnvio || viaje.fecha;
        if (!fechaViaje) {
          return false;
        }
        try {
          const fechaViajeDate = new Date(fechaViaje);
          fechaViajeDate.setHours(0, 0, 0, 0);
          return fechaViajeDate >= fechaDesdeInicio;
        } catch (e) {
          reportesLog.warn('⚠️ Error parseando fecha:', fechaViaje, e);
          return false;
        }
      });
      console.log(
        `📊 Viajes después del filtro de fecha desde: ${filteredData.length} (de ${beforeDateFilter})`
      );
    }

    if (fechaHasta) {
      const beforeDateFilter = filteredData.length;
      // Establecer fechaHasta al final del día (23:59:59.999)
      const fechaHastaFinal = new Date(fechaHasta);
      fechaHastaFinal.setHours(23, 59, 59, 999);

      filteredData = filteredData.filter(viaje => {
        const fechaViaje = viaje.fechaEnvio || viaje.fecha;
        if (!fechaViaje) {
          return false;
        }
        try {
          const fechaViajeDate = new Date(fechaViaje);
          return fechaViajeDate <= fechaHastaFinal;
        } catch (e) {
          reportesLog.warn('⚠️ Error parseando fecha:', fechaViaje, e);
          return false;
        }
      });
      console.log(
        `📊 Viajes después del filtro de fecha hasta: ${filteredData.length} (de ${beforeDateFilter})`
      );
    }

    console.log(`📊 Total de viajes después de todos los filtros: ${filteredData.length}`);

    // Agrupar por económicos (tractocamiones)
    return this.groupViajesByEconomicos(filteredData);
  }

  groupViajesByEconomicos(data) {
    const groups = {};

    if (data.length === 0) {
      // No mostrar warning si no hay datos - esto es normal cuando no hay viajes en el período seleccionado
      return { labels: [], values: [] };
    }

    console.log('🔍 Agrupando viajes por económicos:', data.length, 'viajes');

    // Log de muestra de los primeros viajes para debugging
    console.log(
      '📋 Muestra de viajes (primeros 5):',
      data.slice(0, 5).map(v => ({
        id: v.numeroRegistro || v.registroId || v.id,
        economico: v.economico,
        numeroEconomico: v.numeroEconomico,
        tractocamion: v.tractocamion,
        Economico: v.Economico,
        NumeroEconomico: v.NumeroEconomico,
        fecha: v.fechaEnvio || v.fecha,
        // Mostrar todos los campos que podrían contener el económico
        allFields: Object.keys(v).filter(
          k =>
            k.toLowerCase().includes('economico') ||
            k.toLowerCase().includes('tracto') ||
            k.toLowerCase().includes('unidad')
        )
      }))
    );

    let viajesSinEconomico = 0;

    data.forEach((viaje, index) => {
      // Obtener el económico del registro de tráfico
      // Buscar en múltiples campos posibles
      const economico =
        viaje.economico ||
        viaje.numeroEconomico ||
        viaje.tractocamion ||
        viaje.Economico ||
        viaje.NumeroEconomico ||
        viaje.unidad ||
        viaje.Unidad ||
        '';

      // Normalizar el económico (eliminar espacios y convertir a string)
      const economicoNormalizado = String(economico).trim() || 'Sin económico';

      if (economicoNormalizado === 'Sin económico' || economicoNormalizado === '') {
        viajesSinEconomico++;
      }

      if (!groups[economicoNormalizado]) {
        groups[economicoNormalizado] = 0;
      }
      groups[economicoNormalizado]++;

      // Log para los primeros 10 viajes para debugging
      if (index < 10) {
        console.log(
          `📊 Viaje ${index + 1}: económico="${economicoNormalizado}" (campos: economico=${viaje.economico}, numeroEconomico=${viaje.numeroEconomico}, tractocamion=${viaje.tractocamion})`
        );
      }
    });

    // Si hay viajes sin económico, advertir
    if (viajesSinEconomico > 0) {
      reportesLog.warn(`⚠️ ${viajesSinEconomico} viajes no tienen económico asignado`);
    }

    // Filtrar "Sin económico" si hay otros económicos
    if (Object.keys(groups).length > 1 && groups['Sin económico']) {
      console.log(`📊 Eliminando ${groups['Sin económico']} viajes sin económico del gráfico`);
      delete groups['Sin económico'];
    }

    // Ordenar por número de viajes (descendente) para mejor visualización
    const sortedGroups = Object.entries(groups).sort((a, b) => b[1] - a[1]);

    const labels = sortedGroups.map(([economico]) => economico);
    const values = sortedGroups.map(([, count]) => count);

    console.log('📊 Viajes agrupados por económicos:', groups);
    console.log('📊 Total de económicos únicos:', Object.keys(groups).length);
    console.log(
      '📊 Top 10 tractocamiones por viajes:',
      sortedGroups.slice(0, 10).map(([econ, count]) => `${econ}: ${count}`)
    );

    if (labels.length === 0) {
      reportesLog.warn('⚠️ No se generaron labels para el gráfico');
      reportesLog.warn('💡 Verifica que los datos tengan el campo "económico" o "tractocamion"');
    }

    return {
      labels: labels,
      values: values
    };
  }

  generateColorsForEconomicos(economicos) {
    // Paleta de colores predefinida para económicos
    const colorPalette = [
      'rgba(54, 162, 235, 0.8)', // Azul
      'rgba(255, 99, 132, 0.8)', // Rojo
      'rgba(75, 192, 192, 0.8)', // Verde agua
      'rgba(255, 205, 86, 0.8)', // Amarillo
      'rgba(153, 102, 255, 0.8)', // Morado
      'rgba(255, 159, 64, 0.8)', // Naranja
      'rgba(199, 199, 199, 0.8)', // Gris
      'rgba(83, 102, 255, 0.8)', // Azul oscuro
      'rgba(255, 99, 255, 0.8)', // Rosa
      'rgba(99, 255, 132, 0.8)', // Verde claro
      'rgba(255, 206, 86, 0.8)', // Dorado
      'rgba(54, 162, 162, 0.8)', // Turquesa
      'rgba(162, 162, 235, 0.8)', // Azul claro
      'rgba(255, 132, 99, 0.8)', // Coral
      'rgba(99, 132, 255, 0.8)' // Azul medio
    ];

    const borderPalette = [
      'rgba(54, 162, 235, 1)', // Azul
      'rgba(255, 99, 132, 1)', // Rojo
      'rgba(75, 192, 192, 1)', // Verde agua
      'rgba(255, 205, 86, 1)', // Amarillo
      'rgba(153, 102, 255, 1)', // Morado
      'rgba(255, 159, 64, 1)', // Naranja
      'rgba(199, 199, 199, 1)', // Gris
      'rgba(83, 102, 255, 1)', // Azul oscuro
      'rgba(255, 99, 255, 1)', // Rosa
      'rgba(99, 255, 132, 1)', // Verde claro
      'rgba(255, 206, 86, 1)', // Dorado
      'rgba(54, 162, 162, 1)', // Turquesa
      'rgba(162, 162, 235, 1)', // Azul claro
      'rgba(255, 132, 99, 1)', // Coral
      'rgba(99, 132, 255, 1)' // Azul medio
    ];

    const backgrounds = [];
    const borders = [];

    economicos.forEach((economico, index) => {
      // Usar colores de la paleta, repitiendo si hay más económicos que colores
      const colorIndex = index % colorPalette.length;
      backgrounds.push(colorPalette[colorIndex]);
      borders.push(borderPalette[colorIndex]);
    });

    console.log('🎨 Colores generados para económicos:', {
      economicos: economicos,
      backgrounds: backgrounds,
      borders: borders
    });

    return {
      backgrounds: backgrounds,
      borders: borders
    };
  }

  async updateAnalisisEconomico() {
    try {
      console.log('🔄 Actualizando análisis por económico...');

      // Cargar datos de viajes para obtener lista de económicos
      const viajesData = await this.loadViajesData();

      // Actualizar dropdown de económicos (con retry si no hay datos)
      await this.actualizarDropdownEconomicos(viajesData);

      // Si no se cargaron económicos, intentar de nuevo después de un delay
      const dropdown = document.getElementById('filtroEconomicoDetalle');
      if (dropdown && dropdown.options.length <= 1) {
        console.log('⚠️ No se cargaron económicos, reintentando en 2 segundos...');
        setTimeout(async () => {
          await this.actualizarDropdownEconomicos(viajesData);
        }, 2000);
      }

      // Configurar evento del dropdown
      this.configurarEventoFiltroEconomico();

      console.log('✅ Análisis por económico actualizado');
    } catch (error) {
      console.error('❌ Error actualizando análisis por económico:', error);
    }
  }

  async actualizarDropdownEconomicos(viajesData) {
    const dropdown = document.getElementById('filtroEconomicoDetalle');
    if (!dropdown) {
      reportesLog.warn('⚠️ Dropdown filtroEconomicoDetalle no encontrado');
      return;
    }

    // Limpiar opciones existentes (excepto la primera)
    dropdown.innerHTML = '<option value="">-- Seleccionar Económico --</option>';

    // Obtener todos los económicos de la configuración
    let todosLosEconomicos = [];

    console.log('🔄 Cargando económicos para dropdown de análisis detallado...');
    console.log('🔍 Verificando fuentes de datos disponibles...');
    console.log(
      '  - window.__economicosCache:',
      window.__economicosCache
        ? `${Array.isArray(window.__economicosCache) ? window.__economicosCache.length : 'no es array'}`
        : 'no existe'
    );
    console.log(
      '  - window.configuracionManager:',
      window.configuracionManager ? 'existe' : 'no existe'
    );
    console.log('  - window.firebaseDb:', window.firebaseDb ? 'existe' : 'no existe');
    console.log(
      '  - localStorage erp_economicos:',
      localStorage.getItem('erp_economicos') ? 'existe' : 'no existe'
    );

    // Usar sistema de caché inteligente: Firebase primero, luego caché
    const economicosFromCache = await window.getDataWithCache('economicos', async () => {
      let economicosData = [];

      // 1. Intentar desde configuracionManager
      if (window.configuracionManager) {
        if (typeof window.configuracionManager.getAllEconomicos === 'function') {
          try {
            economicosData = window.configuracionManager.getAllEconomicos() || [];
            if (economicosData.length > 0) {
              console.log(
                '✅ Tractocamiones cargados desde getAllEconomicos:',
                economicosData.length
              );
              return economicosData;
            }
          } catch (error) {
            console.error('❌ Error llamando getAllEconomicos:', error);
          }
        }

        // Intentar con getEconomicos si getAllEconomicos no funcionó
        if (
          economicosData.length === 0 &&
          typeof window.configuracionManager.getEconomicos === 'function'
        ) {
          try {
            const economicosObj = window.configuracionManager.getEconomicos();
            // Si es un objeto, convertirlo a array
            if (
              economicosObj &&
              typeof economicosObj === 'object' &&
              !Array.isArray(economicosObj)
            ) {
              economicosData = Object.values(economicosObj);
            } else if (Array.isArray(economicosObj)) {
              economicosData = economicosObj;
            }
            if (economicosData.length > 0) {
              console.log('✅ Tractocamiones cargados desde getEconomicos:', economicosData.length);
              return economicosData;
            }
          } catch (error) {
            console.error('❌ Error llamando getEconomicos:', error);
          }
        }
      }

      // 2. Si no hay datos, intentar desde Firebase
      if (
        economicosData.length === 0 &&
        window.firebaseDb &&
        window.fs &&
        window.firebaseAuth?.currentUser
      ) {
        try {
          console.log('📊 Intentando cargar tractocamiones desde Firebase...');

          // PRIORIDAD 1: Intentar desde configuracion/tractocamiones (documento con array)
          try {
            const tractocamionesDocRef = window.fs.doc(
              window.firebaseDb,
              'configuracion',
              'tractocamiones'
            );
            const tractocamionesDoc = await window.fs.getDoc(tractocamionesDocRef);

            if (tractocamionesDoc.exists()) {
              const data = tractocamionesDoc.data();
              if (data.economicos && Array.isArray(data.economicos)) {
                economicosData = data.economicos;
                console.log(
                  '✅ Tractocamiones cargados desde configuracion/tractocamiones:',
                  economicosData.length
                );
                return economicosData;
              }
            }
          } catch (error) {
            reportesLog.warn('⚠️ Error cargando desde configuracion/tractocamiones:', error);
          }

          // PRIORIDAD 2: Si no hay datos, intentar desde la colección de económicos
          if (economicosData.length === 0) {
            try {
              const economicosRef = window.fs.collection(window.firebaseDb, 'economicos');
              const tenantId =
                window.firebaseAuth?.currentUser?.uid ||
                window.DEMO_CONFIG?.tenantId ||
                'demo_tenant';
              const querySnapshot = await window.fs.getDocs(
                window.fs.query(economicosRef, window.fs.where('tenantId', '==', tenantId))
              );
              economicosData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              console.log(
                '✅ Tractocamiones cargados desde colección economicos:',
                economicosData.length
              );
              return economicosData;
            } catch (error) {
              reportesLog.warn('⚠️ Error cargando desde colección economicos:', error);
            }
          }
        } catch (error) {
          reportesLog.warn('⚠️ Error cargando tractocamiones desde Firebase:', error);
        }
      }

      return economicosData;
    });

    // Asegurar que economicosFromCache es un array
    if (Array.isArray(economicosFromCache)) {
      todosLosEconomicos = economicosFromCache;
    } else if (economicosFromCache && typeof economicosFromCache === 'object') {
      todosLosEconomicos = Object.values(economicosFromCache);
    } else {
      todosLosEconomicos = [];
    }

    console.log('✅ Tractocamiones cargados (desde Firebase o caché):', todosLosEconomicos.length);
    if (todosLosEconomicos.length > 0) {
      console.log(
        '📋 Primeros 3 económicos:',
        todosLosEconomicos
          .slice(0, 3)
          .map(e => ({ numero: e.numero, marca: e.marca, modelo: e.modelo }))
      );
    }

    // 4. Fallback: Intentar desde DataPersistence
    if (
      todosLosEconomicos.length === 0 &&
      window.DataPersistence &&
      typeof window.DataPersistence.getAllEconomicos === 'function'
    ) {
      try {
        const economicosFromDP = window.DataPersistence.getAllEconomicos() || [];
        // Asegurar que es un array
        if (Array.isArray(economicosFromDP)) {
          todosLosEconomicos = economicosFromDP;
        } else if (economicosFromDP && typeof economicosFromDP === 'object') {
          todosLosEconomicos = Object.values(economicosFromDP);
        } else {
          todosLosEconomicos = [];
        }
        console.log('✅ Tractocamiones cargados desde DataPersistence:', todosLosEconomicos.length);
      } catch (error) {
        reportesLog.warn('⚠️ Error cargando tractocamiones desde DataPersistence:', error);
      }
    }

    // 5. Fallback final: Intentar desde localStorage directamente
    if (todosLosEconomicos.length === 0) {
      try {
        console.log('🔍 Intentando cargar desde localStorage...');
        const economicosData = localStorage.getItem('erp_economicos');
        if (economicosData) {
          const parsed = JSON.parse(economicosData);
          console.log('📊 Datos parseados de localStorage:', parsed);
          if (Array.isArray(parsed)) {
            todosLosEconomicos = parsed;
            console.log(
              '✅ Tractocamiones cargados desde localStorage (array):',
              todosLosEconomicos.length
            );
          } else if (typeof parsed === 'object' && parsed !== null) {
            todosLosEconomicos = Object.values(parsed);
            console.log(
              '✅ Tractocamiones cargados desde localStorage (objeto convertido):',
              todosLosEconomicos.length
            );
          } else {
            reportesLog.warn('⚠️ Datos en localStorage no son válidos:', parsed);
          }
        } else {
          reportesLog.warn('⚠️ No hay datos en localStorage con clave erp_economicos');
        }
      } catch (error) {
        console.error('❌ Error cargando tractocamiones desde localStorage:', error);
      }
    }

    // 6. Si aún no hay datos y tenemos datos de viajes, extraer tractocamiones únicos de los viajes
    if (
      todosLosEconomicos.length === 0 &&
      viajesData &&
      Array.isArray(viajesData) &&
      viajesData.length > 0
    ) {
      console.log('📊 Intentando extraer tractocamiones de los datos de viajes...');
      const tractocamionesUnicos = new Set();

      viajesData.forEach(viaje => {
        const economico = viaje.economico || viaje.tractocamion || viaje.numeroEconomico;
        if (economico && economico !== '' && economico !== '440') {
          tractocamionesUnicos.add(String(economico).trim());
        }
      });

      if (tractocamionesUnicos.size > 0) {
        // Crear objetos económicos básicos a partir de los números encontrados
        todosLosEconomicos = Array.from(tractocamionesUnicos).map(numero => ({
          numero: numero,
          marca: '',
          modelo: '',
          estadoVehiculo: 'activo'
        }));
        console.log(
          `✅ ${todosLosEconomicos.length} tractocamiones extraídos de los viajes:`,
          Array.from(tractocamionesUnicos)
        );
      }
    }

    // Si no hay datos, mostrar advertencia detallada (solo si realmente no hay datos disponibles)
    if (todosLosEconomicos.length === 0) {
      // Solo mostrar error si no hay viajes disponibles para extraer
      const tieneViajesDisponibles =
        viajesData && Array.isArray(viajesData) && viajesData.length > 0;

      if (!tieneViajesDisponibles) {
        reportesLog.warn('⚠️ No hay tractocamiones registrados en el sistema');
        reportesLog.warn('💡 Sugerencias:');
        reportesLog.warn('   1. Ve a configuracion.html y agrega tractocamiones');
        reportesLog.warn('   2. O espera a que se carguen desde Firebase');
        reportesLog.warn(
          '   3. Si hay viajes registrados, los tractocamiones se extraerán automáticamente'
        );
      } else {
        console.log(
          'ℹ️ No hay tractocamiones en configuración, pero se intentarán extraer de los viajes'
        );
      }
    } else {
      // Asegurar que todosLosEconomicos es un array antes de usar métodos de array
      if (!Array.isArray(todosLosEconomicos)) {
        console.warn(
          '⚠️ todosLosEconomicos no es un array antes de usar slice, convirtiendo...',
          typeof todosLosEconomicos
        );
        todosLosEconomicos =
          todosLosEconomicos && typeof todosLosEconomicos === 'object'
            ? Object.values(todosLosEconomicos)
            : [];
      }
      console.log('📋 Total de tractocamiones encontrados:', todosLosEconomicos.length);
      if (todosLosEconomicos.length > 0) {
        console.log(
          '📋 Muestra de tractocamiones:',
          todosLosEconomicos.slice(0, 5).map(e => ({
            numero: e.numero,
            marca: e.marca,
            modelo: e.modelo,
            estadoVehiculo: e.estadoVehiculo
          }))
        );
      }
    }

    // Asegurar que todosLosEconomicos es un array antes de filtrar
    if (!Array.isArray(todosLosEconomicos)) {
      console.warn(
        '⚠️ todosLosEconomicos no es un array antes de filtrar, convirtiendo...',
        typeof todosLosEconomicos
      );
      todosLosEconomicos =
        todosLosEconomicos && typeof todosLosEconomicos === 'object'
          ? Object.values(todosLosEconomicos)
          : [];
    }

    // Filtrar tractocamiones (excluir el 440 específicamente)
    // Mostrar todos los tractocamiones que tengan número, excepto el 440
    const tractocamionesActivos = todosLosEconomicos.filter(tracto => {
      // Verificar que tenga número
      if (!tracto || !tracto.numero) {
        return false;
      }

      const numeroStr = String(tracto.numero).trim();

      // Excluir específicamente el tractocamión 440
      if (numeroStr === '440') {
        console.log('⚠️ Excluyendo tractocamión 440 del dropdown');
        return false;
      }

      // Si tiene estadoVehiculo definido, verificar que no esté inactivo o retirado
      // Si no tiene estadoVehiculo, incluirlo (considerarlo activo por defecto)
      const estado = tracto.estadoVehiculo || '';
      if (estado && estado !== '') {
        return estado !== 'inactivo' && estado !== 'retirado';
      }

      // Si no tiene estado definido, incluirlo
      return true;
    });

    // Si después del filtro no hay tractocamiones, mostrar todos excepto el 440
    // (esto puede pasar si todos tienen estadoVehiculo inactivo)
    if (tractocamionesActivos.length === 0 && todosLosEconomicos.length > 0) {
      reportesLog.warn(
        '⚠️ No hay tractocamiones activos después del filtro, mostrando todos excepto 440'
      );
      const todosMenos440 = todosLosEconomicos.filter(tracto => {
        if (!tracto || !tracto.numero) {
          return false;
        }
        return String(tracto.numero).trim() !== '440';
      });
      tractocamionesActivos.push(...todosMenos440);
      console.log(
        `✅ Mostrando ${tractocamionesActivos.length} tractocamiones (todos excepto 440)`
      );
    }

    console.log(`📋 Agregando ${tractocamionesActivos.length} tractocamiones activos al dropdown`);

    if (tractocamionesActivos.length === 0) {
      console.error('❌ No hay tractocamiones para agregar al dropdown');
      const option = document.createElement('option');
      option.value = '';
      option.textContent = '-- No hay tractocamiones disponibles --';
      option.disabled = true;
      dropdown.appendChild(option);
      return;
    }

    // Agregar opciones al dropdown
    const numerosAgregados = new Set(); // Para evitar duplicados
    let agregados = 0;

    tractocamionesActivos.forEach((tracto, index) => {
      const numero = tracto.numero || tracto.id || tracto.economico;

      // Evitar duplicados por número
      if (!numero) {
        reportesLog.warn(`⚠️ Tractocamión ${index + 1} sin número, omitiendo:`, tracto);
        return;
      }

      // Convertir a string para comparación
      const numeroStr = String(numero).trim();

      // Evitar duplicados por número
      if (numerosAgregados.has(numeroStr)) {
        reportesLog.warn(`⚠️ Tractocamión duplicado por número, omitiendo: ${numeroStr}`);
        return;
      }

      numerosAgregados.add(numeroStr);

      const option = document.createElement('option');
      option.value = numeroStr;

      const placa = tracto.placaTracto || tracto.placa || '';
      const marca = tracto.marca || '';
      const modelo = tracto.modelo || '';

      // Formatear texto de la opción
      let texto = numeroStr;
      if (marca || modelo) {
        const marcaModelo = `${marca || ''} ${modelo || ''}`.trim();
        if (marcaModelo) {
          texto += ` - ${marcaModelo}`;
        }
      }
      if (placa) {
        texto += ` (${placa})`;
      }

      option.textContent = texto;
      dropdown.appendChild(option);
      agregados++;
    });

    console.log(`✅ Dropdown actualizado con ${agregados} tractocamiones únicos`);
    console.log(
      '📋 Opciones en el dropdown:',
      Array.from(dropdown.options).map(opt => ({ value: opt.value, text: opt.text }))
    );
  }

  crearEconomicosEjemplo() {
    const economicosEjemplo = [
      {
        numero: '123',
        tipoVehiculo: 'tractocamion',
        placaTracto: 'TRAC123',
        estadoVehiculo: 'activo',
        marca: 'INTERNATIONAL',
        modelo: 'CASCADIA'
      },
      {
        numero: '440',
        tipoVehiculo: 'tractocamion',
        placaTracto: 'TRAC440',
        estadoVehiculo: 'activo',
        marca: 'INTERNATIONAL',
        modelo: 'CASCADIA'
      },
      {
        numero: '550',
        tipoVehiculo: 'tractocamion',
        placaTracto: 'TRAC550',
        estadoVehiculo: 'activo',
        marca: 'FREIGHTLINER',
        modelo: 'CASCADIA'
      }
    ];

    // Limpiar localStorage y usar solo datos del caché de Firestore
    console.log('🧹 Limpiando localStorage en función de ejemplo...');
    localStorage.removeItem('erp_economicos');

    if (window.__economicosCache && Array.isArray(window.__economicosCache)) {
      console.log('🔄 Usando datos del caché de Firestore...');
      localStorage.setItem('erp_economicos', JSON.stringify(window.__economicosCache));
      console.log(
        '✅ Datos del caché aplicados:',
        window.__economicosCache.map(e => e.numero)
      );
    } else {
      console.log('⚠️ No hay caché disponible, creando datos de ejemplo');
      // Filtrar solo económicos reales (mantener 116, 440, 502 - eliminar 123, 550)
      const economicosReales = economicosEjemplo.filter(economico => {
        const numero = economico.numero.toString();
        return !['123', '550'].includes(numero);
      });

      // Guardar en localStorage y cache para que otras funciones los puedan usar
      localStorage.setItem('erp_economicos', JSON.stringify(economicosReales));
      window.__economicosCache = economicosReales;
    }

    console.log(
      `✅ Económicos de ejemplo creados y limpiados: ${economicosEjemplo.length} → ${economicosReales.length}`
    );
    return economicosEjemplo;
  }

  configurarEventoFiltroEconomico() {
    const dropdownEconomico = document.getElementById('filtroEconomicoDetalle');
    const dropdownTiempo = document.getElementById('filtroTiempoEconomico');
    const filtrosFecha = document.getElementById('filtrosFechaPersonalizada');

    if (!dropdownEconomico || !dropdownTiempo) {
      return;
    }

    // Remover eventos anteriores
    dropdownEconomico.removeEventListener('change', this.handleEconomicoChange);
    dropdownTiempo.removeEventListener('change', this.handleTiempoChange);

    // Evento para cambio de económico (selección simple)
    this.handleEconomicoChange = async event => {
      const selected = event.target.value;
      if (selected) {
        await this.mostrarMetricasEconomico(selected);
      } else {
        this.ocultarMetricasEconomico();
      }
    };

    // Evento para cambio de período de tiempo
    this.handleTiempoChange = event => {
      const periodoSeleccionado = event.target.value;

      // Mostrar/ocultar filtros de fecha personalizada
      if (periodoSeleccionado === 'personalizado') {
        filtrosFecha.classList.remove('d-none');
      } else {
        filtrosFecha.classList.add('d-none');
      }

      // Recalcular métricas si hay un económico seleccionado
      const selected = dropdownEconomico.value;
      if (selected) {
        this.mostrarMetricasEconomico(selected).catch(err =>
          console.error('Error actualizando métricas:', err)
        );
      }
    };

    dropdownEconomico.addEventListener('change', this.handleEconomicoChange);
    dropdownTiempo.addEventListener('change', this.handleTiempoChange);
  }

  async mostrarMetricasEconomico(economico) {
    try {
      console.log('🔄 Calculando métricas para económico:', economico);

      // Obtener filtros de tiempo
      const filtroTiempo = document.getElementById('filtroTiempoEconomico')?.value || 'todos';
      const fechaDesde = document.getElementById('fechaDesdeEconomico')?.value;
      const fechaHasta = document.getElementById('fechaHastaEconomico')?.value;

      // Cargar datos necesarios (async)
      const viajesData = await this.loadViajesData();

      // Cargar datos desde localStorage
      let dieselData = [];
      try {
        const dieselLocal = localStorage.getItem('erp_diesel_movimientos');
        dieselData = dieselLocal ? JSON.parse(dieselLocal) : [];
      } catch (e) {
        reportesLog.warn('⚠️ Error cargando diesel desde localStorage:', e);
      }

      let incidenciasData = [];
      try {
        const incidenciasLocal = localStorage.getItem('erp_operadores_incidencias');
        incidenciasData = incidenciasLocal ? JSON.parse(incidenciasLocal) : [];
      } catch (e) {
        reportesLog.warn('⚠️ Error cargando incidencias desde localStorage:', e);
      }

      let mantenimientoData = [];
      try {
        const mantenimientoLocal = localStorage.getItem('erp_mantenimientos');
        mantenimientoData = mantenimientoLocal ? JSON.parse(mantenimientoLocal) : [];
      } catch (e) {
        reportesLog.warn('⚠️ Error cargando mantenimiento desde localStorage:', e);
      }

      // Cargar gastos de operadores
      let operadoresGastosData = [];
      try {
        const operadoresGastosLocal = localStorage.getItem('erp_operadores_gastos');
        operadoresGastosData = operadoresGastosLocal ? JSON.parse(operadoresGastosLocal) : [];
        console.log('📊 Gastos de operadores cargados:', operadoresGastosData.length);
        if (operadoresGastosData.length > 0) {
          console.log(
            '📋 Primeros 3 gastos:',
            operadoresGastosData.slice(0, 3).map(g => ({
              operadorNombre: g.operadorNombre,
              economico: g.economico,
              tractocamionId: g.tractocamionId,
              tractocamionInfo: g.tractocamionInfo,
              monto: g.monto
            }))
          );
        }
      } catch (e) {
        reportesLog.warn('⚠️ Error cargando gastos de operadores desde localStorage:', e);
      }

      // Normalizar el número de económico para comparación
      const economicoNormalizado = String(economico).trim();

      // Filtrar datos por económico (comparar como string)
      let viajesEconomico = viajesData.filter(viaje => {
        const ecoViaje = String(viaje.economico || viaje.numeroEconomico || '').trim();
        return ecoViaje === economicoNormalizado;
      });

      let dieselEconomico = dieselData.filter(mov => {
        const ecoMov = String(mov.economico || '').trim();
        return ecoMov === economicoNormalizado;
      });

      let incidenciasEconomico = incidenciasData.filter(inc => {
        const ecoInc = String(inc.tractocamionId || inc.tractocamion || inc.economico || '').trim();
        return ecoInc === economicoNormalizado;
      });

      let mantenimientoEconomico = mantenimientoData.filter(mant => {
        const ecoMant = String(mant.economico || mant.tractocamion || '').trim();
        return ecoMant === economicoNormalizado;
      });

      // Filtrar gastos de operadores - buscar en múltiples campos
      let gastosOperadoresEconomico = operadoresGastosData.filter(gasto => {
        // Buscar en campo economico (directo)
        const ecoGasto = String(gasto.economico || '').trim();
        if (ecoGasto === economicoNormalizado) {
          console.log('✅ Gasto encontrado por campo economico:', gasto);
          return true;
        }

        // Buscar en tractocamionId (convertir a string y comparar)
        if (gasto.tractocamionId !== null && gasto.tractocamionId !== undefined) {
          const tractoId = String(gasto.tractocamionId).trim();
          if (tractoId === economicoNormalizado) {
            console.log('✅ Gasto encontrado por tractocamionId:', gasto);
            return true;
          }
        }

        // Buscar en tractocamionInfo (puede contener el número al inicio)
        const tractoInfo = String(gasto.tractocamionInfo || '').trim();
        if (tractoInfo) {
          // El formato puede ser "440 - ABC-123" o "440" o "440 - MARCA MODELO (PLACA)"
          // Extraer el número del inicio
          const match = tractoInfo.match(/^(\d+)/);
          if (match) {
            const numeroEnInfo = match[1].trim();
            if (numeroEnInfo === economicoNormalizado) {
              console.log('✅ Gasto encontrado por tractocamionInfo (número al inicio):', gasto);
              return true;
            }
          }

          // También buscar si contiene el número (para casos como "ABC-123 - 440")
          if (tractoInfo.includes(economicoNormalizado)) {
            // Verificar que no sea parte de otro número (ej: "440" no debe coincidir con "4400")
            const regex = new RegExp(`(^|\\s|-)${economicoNormalizado}(\\s|-|$)`, 'g');
            if (regex.test(tractoInfo)) {
              console.log('✅ Gasto encontrado por tractocamionInfo (contiene número):', gasto);
              return true;
            }
          }
        }

        return false;
      });

      console.log(
        `📊 Gastos de operadores filtrados para económico ${economicoNormalizado}:`,
        gastosOperadoresEconomico.length
      );
      if (gastosOperadoresEconomico.length > 0) {
        console.log(
          '📋 Primeros 3 gastos filtrados:',
          gastosOperadoresEconomico.slice(0, 3).map(g => ({
            operadorNombre: g.operadorNombre,
            monto: g.monto,
            fecha: g.fecha
          }))
        );
      }

      // Aplicar filtros de tiempo
      if (filtroTiempo !== 'todos') {
        const fechaFiltro = this.obtenerFechasFiltro(filtroTiempo, fechaDesde, fechaHasta);

        if (filtroTiempo === 'mesAnterior') {
          console.log('🔍 Aplicando filtro Mes Anterior:', {
            filtro: fechaFiltro,
            desde: fechaFiltro?.desde?.toISOString(),
            hasta: fechaFiltro?.hasta?.toISOString(),
            totalViajesAntes: viajesEconomico.length,
            totalDieselAntes: dieselEconomico.length
          });
        }

        viajesEconomico = this.filtrarPorFecha(viajesEconomico, fechaFiltro, 'fechaEnvio');
        dieselEconomico = this.filtrarPorFecha(dieselEconomico, fechaFiltro, 'fecha');
        incidenciasEconomico = this.filtrarPorFecha(incidenciasEconomico, fechaFiltro, 'fecha');
        mantenimientoEconomico = this.filtrarPorFecha(mantenimientoEconomico, fechaFiltro, 'fecha');
        gastosOperadoresEconomico = this.filtrarPorFecha(
          gastosOperadoresEconomico,
          fechaFiltro,
          'fecha'
        );

        if (filtroTiempo === 'mesAnterior') {
          console.log('🔍 Después del filtro Mes Anterior:', {
            totalViajesDespues: viajesEconomico.length,
            totalDieselDespues: dieselEconomico.length,
            totalMantenimientoDespues: mantenimientoEconomico.length
          });
        }
      }

      // Calcular métricas
      const numeroViajes = viajesEconomico.length;
      const consumoDiesel = dieselEconomico.reduce(
        (sum, mov) => sum + (parseFloat(mov.costoTotal || mov.costo || 0) || 0),
        0
      );
      const numeroMantenimientos = mantenimientoEconomico.length;
      const totalIncidencias = incidenciasEconomico.length;

      // Calcular gastos de operadores
      const gastosOperadores = gastosOperadoresEconomico.reduce((sum, gasto) => {
        const monto = parseFloat(gasto.monto || 0) || 0;
        return sum + monto;
      }, 0);

      console.log(
        `💰 Total de gastos de operadores para ${economicoNormalizado}: $${gastosOperadores.toFixed(2)}`
      );

      // Obtener últimos 5 operadores que han estado en la unidad (desde registros de tráfico)
      const operadoresUnidad = this.obtenerUltimosOperadoresUnidad(
        viajesEconomico,
        economicoNormalizado
      );

      // Actualizar elementos de la interfaz
      const nombreEconomico = document.getElementById('nombreEconomicoSeleccionado');
      if (nombreEconomico) {
        nombreEconomico.textContent = economico;
      }

      const numViajes = document.getElementById('numeroViajesEconomico');
      if (numViajes) {
        numViajes.textContent = numeroViajes;
      }

      const consumoDieselEl = document.getElementById('consumoDieselEconomico');
      if (consumoDieselEl) {
        consumoDieselEl.textContent = `$${Math.round(consumoDiesel).toLocaleString()}`;
      }

      const numMantenimientos = document.getElementById('numeroMantenimientosEconomico');
      if (numMantenimientos) {
        numMantenimientos.textContent = numeroMantenimientos;
      }

      const totalIncidenciasEl = document.getElementById('totalIncidenciasEconomico');
      if (totalIncidenciasEl) {
        totalIncidenciasEl.textContent = totalIncidencias;
      }

      const gastosOperadoresEl = document.getElementById('gastosOperadoresEconomico');
      if (gastosOperadoresEl) {
        gastosOperadoresEl.textContent = `$${Math.round(gastosOperadores).toLocaleString()}`;
      }

      // Actualizar lista de últimos operadores
      this.actualizarListaOperadoresUnidad(operadoresUnidad);

      // Mostrar secciones
      const container = document.getElementById('metricasEconomicoContainer');
      const detalle = document.getElementById('metricasEconomicoDetalle');
      if (container) {
        container.classList.add('d-none');
      }
      if (detalle) {
        detalle.classList.remove('d-none');
      }

      const listaOperadores = document.getElementById('listaOperadoresUnidad');
      if (listaOperadores) {
        listaOperadores.classList.remove('d-none');
      }

      console.log('✅ Métricas del económico calculadas:', {
        economico,
        filtroTiempo,
        numeroViajes,
        consumoDiesel,
        numeroMantenimientos,
        totalIncidencias,
        operadoresUnidad: operadoresUnidad.length
      });
    } catch (error) {
      console.error('❌ Error calculando métricas del económico:', error);
    }
  }

  obtenerUltimosOperadoresUnidad(viajesEconomico, _economico) {
    const operadoresMap = new Map();

    viajesEconomico.forEach(viaje => {
      // Obtener operador principal
      const operadorPrincipal =
        viaje.operadorprincipal || viaje.operadorPrincipal || viaje.operador || '';

      // Buscar fecha en múltiples campos posibles, priorizando fechaEnvio
      let fechaViaje =
        viaje.fechaEnvio ||
        viaje.fecha ||
        viaje.fechaCreacion ||
        viaje.ultimaActualizacion ||
        viaje.fechaSalida ||
        viaje.fechaLlegada;

      // Si no hay fecha, usar la fecha actual como fallback
      if (!fechaViaje) {
        fechaViaje = new Date().toISOString();
      }

      // Parsear la fecha correctamente
      let fecha = null;
      try {
        if (fechaViaje instanceof Date) {
          fecha = fechaViaje;
        } else if (typeof fechaViaje === 'string') {
          // Intentar parsear como ISO string
          fecha = new Date(fechaViaje);
          // Si no es válida, intentar otros formatos
          if (isNaN(fecha.getTime())) {
            // Intentar formato YYYY-MM-DD
            const fechaParts = fechaViaje.split('T')[0].split('-');
            if (fechaParts.length === 3) {
              fecha = new Date(
                parseInt(fechaParts[0], 10),
                parseInt(fechaParts[1], 10) - 1,
                parseInt(fechaParts[2], 10)
              );
            }
          }
        } else if (typeof fechaViaje === 'number') {
          fecha = new Date(fechaViaje);
        }

        // Validar que la fecha sea válida
        if (!fecha || isNaN(fecha.getTime())) {
          fecha = new Date(); // Fallback a fecha actual
        }
      } catch (e) {
        reportesLog.warn('⚠️ Error parseando fecha del viaje:', fechaViaje, e);
        fecha = new Date(); // Fallback a fecha actual
      }

      if (operadorPrincipal) {
        const operadorExistente = operadoresMap.get(operadorPrincipal);
        if (
          !operadorExistente ||
          (operadorExistente.fecha && fecha && fecha > operadorExistente.fecha)
        ) {
          operadoresMap.set(operadorPrincipal, {
            nombre: operadorPrincipal,
            fecha: fecha,
            tipo: 'Principal'
          });
        }
      }

      // Obtener operador secundario si existe
      const operadorSecundario = viaje.operadorsecundario || viaje.operadorSecundario || '';
      if (operadorSecundario) {
        const operadorExistente = operadoresMap.get(operadorSecundario);
        if (
          !operadorExistente ||
          (operadorExistente.fecha && fecha && fecha > operadorExistente.fecha)
        ) {
          operadoresMap.set(operadorSecundario, {
            nombre: operadorSecundario,
            fecha: fecha,
            tipo: 'Secundario'
          });
        }
      }
    });

    // Convertir a array y ordenar por fecha (más reciente primero)
    const operadoresArray = Array.from(operadoresMap.values())
      .sort((a, b) => {
        if (!a.fecha || !b.fecha) {
          return 0;
        }
        return b.fecha - a.fecha;
      })
      .slice(0, 5); // Últimos 5

    return operadoresArray;
  }

  actualizarListaOperadoresUnidad(operadores) {
    const container = document.getElementById('listaOperadoresUnidadBody');
    if (!container) {
      return;
    }

    container.innerHTML = '';

    if (operadores.length === 0) {
      container.innerHTML =
        '<tr><td colspan="3" class="text-center text-muted">No hay operadores registrados para esta unidad</td></tr>';
      return;
    }

    operadores.forEach((operador, index) => {
      const row = document.createElement('tr');

      // Formatear fecha en formato DD/MM/AAAA
      let fechaFormateada = 'N/A';
      if (operador.fecha) {
        try {
          const fecha = operador.fecha instanceof Date ? operador.fecha : new Date(operador.fecha);
          if (!isNaN(fecha.getTime())) {
            const dia = String(fecha.getDate()).padStart(2, '0');
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const año = fecha.getFullYear();
            fechaFormateada = `${dia}/${mes}/${año}`;
          }
        } catch (e) {
          reportesLog.warn('Error formateando fecha del operador:', e);
          fechaFormateada = 'N/A';
        }
      }

      row.innerHTML = `
                <td>${index + 1}</td>
                <td>${operador.nombre}</td>
                <td><span class="badge bg-${operador.tipo === 'Principal' ? 'primary' : 'secondary'}">${operador.tipo}</span></td>
                <td>${fechaFormateada}</td>
            `;
      container.appendChild(row);
    });
  }

  // Nueva: mostrar métricas agregadas para múltiples económicos
  mostrarMetricasEconomicoMultiple(economicos) {
    try {
      console.log('🔄 Calculando métricas para múltiples económicos:', economicos);

      const filtroTiempo = document.getElementById('filtroTiempoEconomico')?.value || 'todos';
      const fechaDesde = document.getElementById('fechaDesdeEconomico')?.value;
      const fechaHasta = document.getElementById('fechaHastaEconomico')?.value;

      // Cargar datos
      const viajesData = this.loadViajesData();
      const dieselData = JSON.parse(localStorage.getItem('erp_diesel_movimientos') || '[]');
      const operadoresData = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');
      const mantenimientoData = JSON.parse(localStorage.getItem('erp_mantenimientos') || '[]');

      // Filtrar por económicos seleccionados
      let viajes = viajesData.filter(v => economicos.includes(v.economico));
      let diesel = dieselData.filter(m => economicos.includes(m.economico));
      let operadores = operadoresData.filter(g => economicos.includes(g.economico));
      let mantenimiento = mantenimientoData.filter(m => economicos.includes(m.economico));

      // Aplicar filtro de tiempo
      if (filtroTiempo !== 'todos') {
        const rango = this.obtenerFechasFiltro(filtroTiempo, fechaDesde, fechaHasta);
        viajes = this.filtrarPorFecha(viajes, rango, 'fechaEnvio');
        diesel = this.filtrarPorFecha(diesel, rango, 'fecha');
        operadores = this.filtrarPorFecha(operadores, rango, 'fecha');
        mantenimiento = this.filtrarPorFecha(mantenimiento, rango, 'fecha');
      }

      // Calcular métricas agregadas
      const numeroViajes = viajes.length;
      const consumoDiesel = diesel.reduce((s, x) => s + (parseFloat(x.costoTotal || 0) || 0), 0);
      const gastosOperadores = operadores.reduce((s, x) => s + (parseFloat(x.monto || 0) || 0), 0);
      const numeroMantenimientos = mantenimiento.length;

      // Actualizar UI (mostrar lista de seleccionados, y totales agregados)
      document.getElementById('nombreEconomicoSeleccionado').textContent = economicos.join(', ');
      document.getElementById('numeroViajesEconomico').textContent = numeroViajes;
      document.getElementById('consumoDieselEconomico').textContent =
        `$${Math.round(consumoDiesel).toLocaleString()}`;
      document.getElementById('gastosOperadoresEconomico').textContent =
        `$${Math.round(gastosOperadores).toLocaleString()}`;
      document.getElementById('numeroMantenimientosEconomico').textContent = numeroMantenimientos;

      // Mostrar secciones
      document.getElementById('metricasEconomicoContainer').classList.add('d-none');
      document.getElementById('metricasEconomicoDetalle').classList.remove('d-none');

      console.log('✅ Métricas múltiples calculadas');
    } catch (error) {
      console.error('❌ Error calculando métricas múltiples:', error);
    }
  }

  ocultarMetricasEconomico() {
    const container = document.getElementById('metricasEconomicoContainer');
    const detalle = document.getElementById('metricasEconomicoDetalle');
    const listaOperadores = document.getElementById('listaOperadoresUnidad');

    if (container) {
      container.classList.remove('d-none');
    }
    if (detalle) {
      detalle.classList.add('d-none');
    }
    if (listaOperadores) {
      listaOperadores.classList.add('d-none');
    }
  }

  obtenerFechasFiltro(filtroTiempo, fechaDesde, fechaHasta) {
    const ahora = new Date();
    let desde, hasta;

    switch (filtroTiempo) {
      case 'semana':
        desde = new Date(ahora);
        desde.setDate(ahora.getDate() - 7);
        hasta = ahora;
        break;
      case 'mes':
        desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        hasta = ahora;
        break;
      case 'mesAnterior':
        // Mes anterior: desde el primer día del mes anterior hasta el último día del mes anterior
        const mesActual = ahora.getMonth(); // 0-11
        const añoActual = ahora.getFullYear();
        const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
        const añoAnterior = mesActual === 0 ? añoActual - 1 : añoActual;
        desde = new Date(añoAnterior, mesAnterior, 1);
        // Último día del mes anterior
        hasta = new Date(añoAnterior, mesAnterior + 1, 0, 23, 59, 59, 999);
        console.log('📅 Filtro Mes Anterior:', {
          mesActual: mesActual + 1,
          añoActual,
          mesAnterior: mesAnterior + 1,
          añoAnterior,
          desde: desde.toISOString(),
          hasta: hasta.toISOString()
        });
        break;
      case 'año':
        desde = new Date(ahora.getFullYear(), 0, 1);
        hasta = ahora;
        break;
      case 'personalizado':
        desde = fechaDesde ? new Date(fechaDesde) : null;
        hasta = fechaHasta ? new Date(fechaHasta) : null;
        break;
      default:
        return null;
    }

    return { desde, hasta };
  }

  async actualizarAnalisisEconomico() {
    const economicoSeleccionado = document.getElementById('filtroEconomicoDetalle')?.value;
    if (economicoSeleccionado) {
      await this.mostrarMetricasEconomico(economicoSeleccionado);
    } else {
      this.ocultarMetricasEconomico();
    }
  }

  async updateDieselChart() {
    // Verificar que el gráfico existe
    if (!this.charts.diesel) {
      reportesLog.warn('Gráfico de diesel no inicializado, intentando inicializar...');
      this.initializeCharts();
      if (!this.charts.diesel) {
        console.error('No se pudo inicializar el gráfico de diesel');
        return;
      }
    }

    try {
      let dieselData = [];

      // PRIORIDAD 1: Cargar desde Firebase
      if (window.firebaseRepos && window.firebaseRepos.diesel) {
        try {
          const repoDiesel = window.firebaseRepos.diesel;
          if (repoDiesel.db && repoDiesel.tenantId) {
            dieselData = await repoDiesel.getAllMovimientos();
            console.log(
              '🔥 Datos de diesel cargados desde Firebase para gráfico:',
              dieselData.length
            );
          }
        } catch (error) {
          reportesLog.warn('⚠️ Error cargando diesel desde Firebase para gráfico:', error);
        }
      }

      // PRIORIDAD 2: Cargar desde localStorage y combinar
      const dieselLocal = JSON.parse(localStorage.getItem('erp_diesel_movimientos') || '[]');
      console.log('📋 Datos de diesel en localStorage para gráfico:', dieselLocal.length);

      // Combinar datos evitando duplicados
      const existingIds = new Set(dieselData.map(item => item.id || item.movimientoId));
      dieselLocal.forEach(item => {
        const itemId = item.id || item.movimientoId;
        if (!existingIds.has(itemId)) {
          dieselData.push(item);
          existingIds.add(itemId);
        }
      });

      console.log('📊 Total datos de diesel combinados para gráfico:', dieselData.length);

      const chartData = this.processDieselDataForRadar(dieselData);

      // Actualizar el gráfico radar
      this.charts.diesel.data.labels = chartData.labels;
      this.charts.diesel.data.datasets = chartData.datasets;
      this.charts.diesel.update();

      console.log('✅ Gráfico de diesel (radar) actualizado correctamente');
    } catch (error) {
      console.error('❌ Error actualizando gráfico de diesel:', error);
    }
  }

  processDieselDataForRadar(dieselData) {
    console.log('🔍 Procesando datos de diesel para gráfica radar:', dieselData);

    // Obtener el mes del filtro
    const filtro = this.obtenerMesFiltro();
    console.log('📅 Filtro de mes para gráfico de diesel:', {
      mes: filtro.mes + 1,
      año: filtro.año
    });

    // Si no hay datos de diesel pasados, intentar obtenerlos de currentData
    if (!dieselData || dieselData.length === 0) {
      console.log('🔍 No hay datos de diesel pasados, buscando en currentData...');
      console.log('🔍 this.currentData:', this.currentData);

      if (this.currentData && Array.isArray(this.currentData)) {
        dieselData = this.currentData.filter(item => item.departamento === 'diesel');
        console.log('📊 Datos de diesel encontrados en currentData:', dieselData.length);
      } else {
        console.log('⚠️ currentData no está disponible o no es un array');

        // Fallback: cargar directamente desde localStorage
        try {
          const dieselLocal = JSON.parse(localStorage.getItem('erp_diesel_movimientos') || '[]');
          console.log(
            '📊 Datos de diesel cargados directamente desde localStorage:',
            dieselLocal.length
          );
          dieselData = dieselLocal;
        } catch (error) {
          console.error('❌ Error cargando diesel desde localStorage:', error);
          dieselData = [];
        }
      }
    }

    // Filtrar por mes
    const beforeMonthFilter = dieselData.length;
    dieselData = dieselData.filter(movimiento =>
      this.perteneceAlMesFiltro(movimiento.fecha || movimiento.fechaCreacion)
    );
    console.log(
      `📊 Datos de diesel filtrados por mes: ${dieselData.length} (de ${beforeMonthFilter})`
    );

    // Procesar solo datos de diesel por económico
    const groups = {};
    dieselData.forEach(movimiento => {
      const economico = movimiento.economico || 'Sin económico';
      const costo = parseFloat(movimiento.costoTotal || movimiento.valor || 0) || 0;

      // Verificar valores anómalos (muy altos)
      if (costo > 100000) {
        reportesLog.warn(
          `⚠️ Valor anómalo detectado para ${economico}: $${costo.toLocaleString()}`
        );
        console.log('📋 Datos del movimiento:', movimiento);
      }

      if (!groups[economico]) {
        groups[economico] = 0;
      }
      groups[economico] += costo;
    });

    const labels = Object.keys(groups).filter(e => e !== 'Sin económico');
    const values = labels.map(economico => groups[economico]);

    console.log('📊 Grupos de diesel por económico:', groups);
    console.log('📊 Labels:', labels);
    console.log('📊 Values:', values);

    // Si no hay datos de diesel, cargar tractocamiones desde configuración
    if (labels.length === 0) {
      console.log('⚠️ No hay datos de diesel, cargando tractocamiones desde configuración...');

      // Obtener todos los económicos de la configuración (misma lógica que otros dropdowns)
      let todosLosEconomicos = [];

      // 1. Intentar obtener desde el caché de Firestore (más actual)
      if (window.__economicosCache && window.__economicosCache.length > 0) {
        todosLosEconomicos = window.__economicosCache;
        console.log(
          '✅ Económicos cargados desde Firestore cache para radar:',
          todosLosEconomicos.length
        );
      }
      // 2. Intentar obtener del sistema de configuración
      else if (window.configuracionManager && window.configuracionManager.getAllEconomicos) {
        try {
          todosLosEconomicos = window.configuracionManager.getAllEconomicos();
          console.log(
            '✅ Económicos cargados desde configuracionManager para radar:',
            todosLosEconomicos.length
          );
        } catch (error) {
          reportesLog.warn(
            '⚠️ Error cargando económicos desde configuracionManager para radar:',
            error
          );
        }
      }

      // 3. Si no hay datos en configuración, intentar del sistema de persistencia
      if (
        todosLosEconomicos.length === 0 &&
        window.DataPersistence &&
        typeof window.DataPersistence.getAllEconomicos === 'function'
      ) {
        try {
          todosLosEconomicos = window.DataPersistence.getAllEconomicos();
          console.log(
            '✅ Económicos cargados desde DataPersistence para radar:',
            todosLosEconomicos.length
          );
        } catch (error) {
          reportesLog.warn('⚠️ Error cargando económicos desde DataPersistence para radar:', error);
        }
      }

      // 4. Si aún no hay datos, intentar cargar desde localStorage directamente
      if (todosLosEconomicos.length === 0) {
        try {
          // Manejar ambos formatos: arreglo y objeto por número
          const rawLocal = localStorage.getItem('erp_economicos');
          if (rawLocal) {
            const parsed = JSON.parse(rawLocal);
            if (Array.isArray(parsed)) {
              todosLosEconomicos = parsed;
            } else if (parsed && typeof parsed === 'object') {
              todosLosEconomicos = Object.keys(parsed).map(numero => ({
                numero,
                ...parsed[numero]
              }));
            }
          }
          // Fallback alterno si algunas implementaciones usan otra clave
          if (todosLosEconomicos.length === 0) {
            const rawAlt = localStorage.getItem('erp_config_economicos');
            if (rawAlt) {
              const parsedAlt = JSON.parse(rawAlt);
              if (Array.isArray(parsedAlt)) {
                todosLosEconomicos = parsedAlt;
              } else if (parsedAlt && typeof parsedAlt === 'object') {
                todosLosEconomicos = Object.keys(parsedAlt).map(numero => ({
                  numero,
                  ...parsedAlt[numero]
                }));
              }
            }
          }

          // Normalizar, eliminar duplicados por numero y ordenar
          const seen = new Set();
          todosLosEconomicos = todosLosEconomicos
            .filter(e => {
              const num = String(e.numero ?? '').trim();
              if (!num || seen.has(num)) {
                return false;
              }
              seen.add(num);
              return true;
            })
            .sort((a, b) => String(a.numero || '').localeCompare(String(b.numero || '')));

          console.log(
            '✅ Económicos cargados desde localStorage para radar:',
            todosLosEconomicos.length
          );
        } catch (error) {
          reportesLog.warn('⚠️ Error cargando económicos desde localStorage para radar:', error);
        }
      }

      if (todosLosEconomicos.length > 0) {
        // Mostrar tractocamiones reales con valores en 0 (sin datos de diesel)
        todosLosEconomicos.forEach(economico => {
          const numero = economico.numero || economico;
          labels.push(numero);
          values.push(0); // Mostrar 0 cuando no hay datos reales de diesel
        });
        console.log('📊 Tractocamiones cargados para radar:', labels.length);
      } else {
        // Solo mostrar warning si realmente esperábamos tener tractocamiones
        // (por ejemplo, si hay datos de diesel pero no tractocamiones configurados)
        const tieneDatosDiesel = dieselData && dieselData.length > 0;
        if (tieneDatosDiesel) {
          reportesLog.warn(
            '⚠️ Hay datos de diesel pero no se encontraron tractocamiones configurados para el gráfico radar'
          );
        } else {
          reportesLog.debug(
            'ℹ️ No hay tractocamiones configurados para el gráfico radar (esto es normal si aún no hay configuración)'
          );
        }
      }
    }

    const dataset = {
      label: values.every(v => v === 0)
        ? 'Consumo de Diesel ($) - Sin Datos'
        : 'Consumo de Diesel ($)',
      data: values,
      backgroundColor: 'rgba(255, 193, 7, 0.2)',
      borderColor: 'rgba(255, 193, 7, 1)',
      borderWidth: 3,
      pointBackgroundColor: 'rgba(255, 193, 7, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(255, 193, 7, 1)',
      pointRadius: 6,
      pointHoverRadius: 8
    };

    console.log('📊 Datos finales para gráfica radar:', {
      labels,
      values,
      dataset: dataset.label
    });

    return {
      labels: labels,
      datasets: [dataset]
    };
  }

  // Función de diagnóstico para datos de diesel
  diagnosticarDatosDiesel() {
    console.log('🔍 === DIAGNÓSTICO DATOS DE DIESEL ===');

    // 1. Verificar localStorage
    const dieselLocal = JSON.parse(localStorage.getItem('erp_diesel_movimientos') || '[]');
    console.log('📊 Datos en erp_diesel_movimientos:', dieselLocal.length);

    if (dieselLocal.length > 0) {
      console.log('📋 Primeros 3 registros:');
      dieselLocal.slice(0, 3).forEach((item, index) => {
        console.log(
          `   ${index + 1}. ID: ${item.id}, Económico: ${item.economico}, Costo: ${item.costoTotal}`
        );
      });
    }

    // 2. Verificar currentData
    console.log('📊 this.currentData:', this.currentData);
    if (this.currentData && Array.isArray(this.currentData)) {
      const dieselData = this.currentData.filter(item => item.departamento === 'diesel');
      console.log('📊 Datos de diesel en currentData:', dieselData.length);
    }

    // 3. Probar procesamiento
    console.log('🧪 Probando procesamiento...');
    const resultado = this.processDieselDataForRadar(dieselLocal);
    console.log('📊 Resultado del procesamiento:', resultado);

    console.log('🔍 === FIN DIAGNÓSTICO ===');
    return resultado;
  }

  // Función para limpiar datos de diesel con valores anómalos
  limpiarDatosDiesel() {
    console.log('🧹 === LIMPIANDO DATOS DE DIESEL ===');

    const dieselData = JSON.parse(localStorage.getItem('erp_diesel_movimientos') || '[]');
    let cambiosRealizados = 0;

    const datosLimpios = dieselData.map(movimiento => {
      const costoOriginal = parseFloat(movimiento.costoTotal || 0);

      // Si el costo es muy alto (probablemente error de entrada), corregirlo
      if (costoOriginal > 100000) {
        console.log(`🔧 Corrigiendo valor anómalo para ${movimiento.economico}:`);
        console.log(`   - Valor original: $${costoOriginal.toLocaleString()}`);

        // Intentar corregir dividiendo por 100 (posible error de decimales)
        const costoCorregido = costoOriginal / 100;

        if (costoCorregido < 100000) {
          console.log(`   - Valor corregido: $${costoCorregido.toFixed(2)}`);
          cambiosRealizados++;
          return {
            ...movimiento,
            costoTotal: costoCorregido
          };
        }
        // Si sigue siendo muy alto, usar un valor promedio
        const valorPromedio = 2500; // Valor promedio basado en los otros registros
        console.log(`   - Valor promedio asignado: $${valorPromedio}`);
        cambiosRealizados++;
        return {
          ...movimiento,
          costoTotal: valorPromedio
        };
      }

      return movimiento;
    });

    if (cambiosRealizados > 0) {
      localStorage.setItem('erp_diesel_movimientos', JSON.stringify(datosLimpios));
      console.log(`✅ ${cambiosRealizados} registros corregidos`);

      // Recargar la gráfica
      setTimeout(() => {
        this.updateDieselChart().catch(err =>
          console.error('Error actualizando gráfico de diesel:', err)
        );
        console.log('🔄 Gráfica de diesel actualizada');
      }, 500);
    } else {
      console.log('✅ No se encontraron valores anómalos');
    }

    console.log('🧹 === FIN LIMPIEZA ===');
    return cambiosRealizados;
  }

  // Función de diagnóstico para gastos de operadores
  diagnosticarGastosOperadores() {
    console.log('🔍 === DIAGNÓSTICO GASTOS DE OPERADORES ===');

    // 1. Verificar localStorage
    const gastosOperadores = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');
    console.log('📊 Datos en erp_operadores_gastos:', gastosOperadores.length);

    if (gastosOperadores.length > 0) {
      console.log('📋 Primeros 3 registros:');
      gastosOperadores.slice(0, 3).forEach((item, index) => {
        console.log(
          `   ${index + 1}. ID: ${item.id}, Operador: ${item.operadorNombre}, Económico: ${item.economico}, Monto: $${item.monto}`
        );
      });

      // Agrupar por económico
      const gastosPorEconomico = {};
      gastosOperadores.forEach(gasto => {
        const economico = gasto.economico || 'Sin económico';
        if (!gastosPorEconomico[economico]) {
          gastosPorEconomico[economico] = [];
        }
        gastosPorEconomico[economico].push(gasto);
      });

      console.log('📊 Gastos por económico:');
      Object.keys(gastosPorEconomico).forEach(economico => {
        const total = gastosPorEconomico[economico].reduce(
          (sum, gasto) => sum + (parseFloat(gasto.monto || 0) || 0),
          0
        );
        console.log(
          `   - ${economico}: ${gastosPorEconomico[economico].length} gastos, Total: $${total.toFixed(2)}`
        );
      });
    } else {
      console.log('❌ No hay gastos de operadores registrados');
    }

    // 2. Verificar si hay datos en otras claves posibles
    const clavesAlternativas = [
      'erp_gastos_operadores',
      'erp_operadores',
      'operadores_gastos',
      'gastos_operadores'
    ];

    clavesAlternativas.forEach(clave => {
      const datos = localStorage.getItem(clave);
      if (datos) {
        try {
          const parsed = JSON.parse(datos);
          console.log(
            `📊 Datos encontrados en ${clave}:`,
            Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length
          );
        } catch (error) {
          console.log(`⚠️ Error parseando ${clave}:`, error.message);
        }
      }
    });

    console.log('🔍 === FIN DIAGNÓSTICO ===');
    return gastosOperadores;
  }

  // Función específica para diagnosticar el análisis detallado por económico
  diagnosticarAnalisisEconomico(economico = null) {
    console.log('🔍 === DIAGNÓSTICO ANÁLISIS DETALLADO POR ECONÓMICO ===');

    // Si no se especifica económico, usar el del dropdown
    if (!economico) {
      economico = document.getElementById('filtroEconomicoDetalle')?.value;
      if (!economico) {
        console.log('❌ No hay económico seleccionado');
        return;
      }
    }

    console.log(`📊 Analizando económico: ${economico}`);

    // 1. Cargar todos los datos
    const viajesData = this.loadViajesData();
    const dieselData = JSON.parse(localStorage.getItem('erp_diesel_movimientos') || '[]');
    const operadoresData = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');
    const mantenimientoData = JSON.parse(localStorage.getItem('erp_mantenimientos') || '[]');

    console.log('📋 Datos cargados:');
    console.log(`   - Viajes: ${viajesData.length}`);
    console.log(`   - Diesel: ${dieselData.length}`);
    console.log(`   - Operadores: ${operadoresData.length}`);
    console.log(`   - Mantenimiento: ${mantenimientoData.length}`);

    // 2. Filtrar por económico
    const viajesEconomico = viajesData.filter(viaje => viaje.economico === economico);
    const dieselEconomico = dieselData.filter(mov => mov.economico === economico);
    const operadoresEconomico = operadoresData.filter(gasto => gasto.economico === economico);
    const mantenimientoEconomico = mantenimientoData.filter(mant => mant.economico === economico);

    console.log(`📊 Datos filtrados por económico ${economico}:`);
    console.log(`   - Viajes: ${viajesEconomico.length}`);
    console.log(`   - Diesel: ${dieselEconomico.length}`);
    console.log(`   - Operadores: ${operadoresEconomico.length}`);
    console.log(`   - Mantenimiento: ${mantenimientoEconomico.length}`);

    // 3. Mostrar detalles de gastos de operadores
    if (operadoresEconomico.length > 0) {
      console.log('💰 Gastos de operadores encontrados:');
      operadoresEconomico.forEach((gasto, index) => {
        console.log(
          `   ${index + 1}. Operador: ${gasto.operadorNombre}, Monto: $${gasto.monto}, Fecha: ${gasto.fecha}`
        );
      });

      const totalGastos = operadoresEconomico.reduce(
        (sum, gasto) => sum + (parseFloat(gasto.monto || 0) || 0),
        0
      );
      console.log(`   Total: $${totalGastos.toFixed(2)}`);
    } else {
      console.log('❌ No se encontraron gastos de operadores para este económico');

      // Verificar si hay gastos sin económico asignado
      const gastosSinEconomico = operadoresData.filter(
        gasto => !gasto.economico || gasto.economico === ''
      );
      if (gastosSinEconomico.length > 0) {
        console.log(`⚠️ Hay ${gastosSinEconomico.length} gastos sin económico asignado:`);
        gastosSinEconomico.slice(0, 3).forEach((gasto, index) => {
          console.log(`   ${index + 1}. Operador: ${gasto.operadorNombre}, Monto: $${gasto.monto}`);
        });
      }

      // Verificar todos los económicos disponibles en los gastos
      const economicosEnGastos = [
        ...new Set(operadoresData.map(gasto => gasto.economico).filter(e => e))
      ];
      console.log('📊 Económicos disponibles en gastos:', economicosEnGastos);
    }

    // 4. Aplicar filtros de tiempo si existen
    const filtroTiempo = document.getElementById('filtroTiempoEconomico')?.value || 'todos';
    if (filtroTiempo !== 'todos') {
      console.log(`⏰ Aplicando filtro de tiempo: ${filtroTiempo}`);
      const fechaDesde = document.getElementById('fechaDesdeEconomico')?.value;
      const fechaHasta = document.getElementById('fechaHastaEconomico')?.value;
      const fechaFiltro = this.obtenerFechasFiltro(filtroTiempo, fechaDesde, fechaHasta);

      const operadoresFiltrados = this.filtrarPorFecha(operadoresEconomico, fechaFiltro, 'fecha');
      console.log(`   Operadores después del filtro de tiempo: ${operadoresFiltrados.length}`);
    }

    console.log('🔍 === FIN DIAGNÓSTICO ===');

    return {
      economico,
      viajesEconomico,
      dieselEconomico,
      operadoresEconomico,
      mantenimientoEconomico
    };
  }

  // Función para corregir gastos de operadores sin económico asignado
  corregirGastosOperadoresSinEconomico() {
    console.log('🔧 === CORRIGIENDO GASTOS DE OPERADORES SIN ECONÓMICO ===');

    const gastosOperadores = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');
    let cambiosRealizados = 0;

    // Obtener datos de tráfico para mapear operadores con económicos
    const traficoData = JSON.parse(localStorage.getItem('erp_trafico') || '{}');
    const logisticaData = JSON.parse(localStorage.getItem('erp_logistica') || '{}');

    // Crear mapeo de operadores a económicos
    const mapeoOperadorEconomico = {};

    // Buscar en datos de tráfico
    Object.values(traficoData).forEach(registro => {
      if (registro.operadorprincipal && registro.economico) {
        mapeoOperadorEconomico[registro.operadorprincipal] = registro.economico;
      }
      if (registro.operadorsecundario && registro.economico) {
        mapeoOperadorEconomico[registro.operadorsecundario] = registro.economico;
      }
    });

    // Buscar en datos de logística
    Object.values(logisticaData).forEach(registro => {
      if (registro.operadorPrincipal && registro.economico) {
        mapeoOperadorEconomico[registro.operadorPrincipal] = registro.economico;
      }
      if (registro.operadorSecundario && registro.economico) {
        mapeoOperadorEconomico[registro.operadorSecundario] = registro.economico;
      }
    });

    console.log('📊 Mapeo operador-económico encontrado:', mapeoOperadorEconomico);

    // Corregir gastos sin económico
    const gastosCorregidos = gastosOperadores.map(gasto => {
      if (!gasto.economico || gasto.economico === undefined) {
        // Intentar asignar económico basado en el nombre del operador
        const nombreOperador = gasto.operadorNombre;
        let economicoAsignado = null;

        // Buscar coincidencia exacta
        if (mapeoOperadorEconomico[nombreOperador]) {
          economicoAsignado = mapeoOperadorEconomico[nombreOperador];
        } else {
          // Buscar coincidencia parcial (por si el nombre tiene variaciones)
          Object.keys(mapeoOperadorEconomico).forEach(operadorMapeado => {
            if (
              operadorMapeado.includes(nombreOperador) ||
              nombreOperador.includes(operadorMapeado)
            ) {
              economicoAsignado = mapeoOperadorEconomico[operadorMapeado];
            }
          });
        }

        if (economicoAsignado) {
          console.log(`🔧 Asignando económico ${economicoAsignado} a gasto de ${nombreOperador}`);
          cambiosRealizados++;
          return {
            ...gasto,
            economico: economicoAsignado
          };
        }
        console.log(`⚠️ No se pudo asignar económico al gasto de ${nombreOperador}`);
        return gasto;
      }
      return gasto;
    });

    if (cambiosRealizados > 0) {
      localStorage.setItem('erp_operadores_gastos', JSON.stringify(gastosCorregidos));
      console.log(`✅ ${cambiosRealizados} gastos corregidos`);

      // Recargar el análisis económico
      setTimeout(() => {
        this.updateAnalisisEconomico().catch(err =>
          console.error('Error actualizando análisis:', err)
        );
        console.log('🔄 Análisis económico actualizado');
      }, 500);
    } else {
      console.log('✅ No se encontraron gastos que necesiten corrección');
    }

    console.log('🔧 === FIN CORRECCIÓN ===');
    return cambiosRealizados;
  }

  // Función para probar específicamente el filtrado de gastos por económico
  probarFiltradoGastosOperadores(economico = null) {
    console.log('🧪 === PROBANDO FILTRADO DE GASTOS DE OPERADORES ===');

    if (!economico) {
      economico = document.getElementById('filtroEconomicoDetalle')?.value;
      if (!economico) {
        console.log('❌ No hay económico seleccionado en el dropdown');
        console.log('📋 Opciones disponibles en el dropdown:');
        const dropdown = document.getElementById('filtroEconomicoDetalle');
        if (dropdown) {
          Array.from(dropdown.options).forEach((option, index) => {
            console.log(`   ${index}. ${option.value} - ${option.textContent}`);
          });
        }
        return;
      }
    }

    console.log(`🧪 Probando filtrado para económico: ${economico}`);

    // 1. Cargar datos de gastos de operadores
    const operadoresData = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');
    console.log(`📊 Total de gastos de operadores: ${operadoresData.length}`);

    // 2. Mostrar todos los gastos con su económico
    console.log('📋 Todos los gastos de operadores:');
    operadoresData.forEach((gasto, index) => {
      console.log(
        `   ${index + 1}. Operador: ${gasto.operadorNombre}, Económico: "${gasto.economico}", Monto: $${gasto.monto}`
      );
    });

    // 3. Filtrar por económico específico
    const gastosFiltrados = operadoresData.filter(gasto => gasto.economico === economico);
    console.log(`📊 Gastos filtrados para económico "${economico}": ${gastosFiltrados.length}`);

    if (gastosFiltrados.length > 0) {
      console.log('💰 Gastos encontrados:');
      gastosFiltrados.forEach((gasto, index) => {
        console.log(
          `   ${index + 1}. Operador: ${gasto.operadorNombre}, Monto: $${gasto.monto}, Fecha: ${gasto.fecha}`
        );
      });

      const total = gastosFiltrados.reduce(
        (sum, gasto) => sum + (parseFloat(gasto.monto || 0) || 0),
        0
      );
      console.log(`   Total: $${total.toFixed(2)}`);
    } else {
      console.log('❌ No se encontraron gastos para este económico');

      // Verificar si hay diferencias en el tipo de dato
      const economicosEnGastos = [
        ...new Set(operadoresData.map(gasto => gasto.economico).filter(e => e))
      ];
      console.log('📊 Económicos disponibles en gastos:', economicosEnGastos);
      console.log('📊 Tipo de dato del económico buscado:', typeof economico);
      console.log(
        '📊 Tipos de datos en gastos:',
        economicosEnGastos.map(e => typeof e)
      );

      // Intentar filtrar con conversión a string
      const gastosFiltradosString = operadoresData.filter(
        gasto => String(gasto.economico) === String(economico)
      );
      console.log(`📊 Gastos filtrados (con conversión a string): ${gastosFiltradosString.length}`);
    }

    // 4. Verificar qué función de análisis económico se está ejecutando
    console.log('🔍 Verificando función de análisis económico...');
    console.log(
      '📊 Elemento gastosOperadoresEconomico:',
      document.getElementById('gastosOperadoresEconomico')
    );
    console.log(
      '📊 Valor actual en el elemento:',
      document.getElementById('gastosOperadoresEconomico')?.textContent
    );

    console.log('🧪 === FIN PRUEBA ===');
    return gastosFiltrados;
  }

  // Función para probar con tractocamiones que sí tienen gastos
  probarConTractocamionesConGastos() {
    console.log('🧪 === PROBANDO CON TRACTOCAMIONES QUE TIENEN GASTOS ===');

    const operadoresData = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');
    const economicosConGastos = [
      ...new Set(operadoresData.map(gasto => gasto.economico).filter(e => e))
    ];

    console.log('📊 Tractocamiones con gastos disponibles:', economicosConGastos);

    economicosConGastos.forEach(economico => {
      console.log(`\n🚛 === PROBANDO TRACTOCAMION ${economico} ===`);

      const gastosFiltrados = operadoresData.filter(gasto => gasto.economico === economico);
      const total = gastosFiltrados.reduce(
        (sum, gasto) => sum + (parseFloat(gasto.monto || 0) || 0),
        0
      );

      console.log(`📊 Gastos encontrados: ${gastosFiltrados.length}`);
      console.log(`💰 Total: $${total.toFixed(2)}`);

      gastosFiltrados.forEach((gasto, index) => {
        console.log(`   ${index + 1}. ${gasto.operadorNombre}: $${gasto.monto}`);
      });

      // Simular la función de análisis económico para este tractocamión
      console.log('🔧 Simulando actualización del elemento HTML...');
      const elemento = document.getElementById('gastosOperadoresEconomico');
      if (elemento) {
        elemento.textContent = `$${Math.round(total).toLocaleString()}`;
        console.log(`✅ Elemento actualizado: ${elemento.textContent}`);
      } else {
        console.log('❌ Elemento gastosOperadoresEconomico no encontrado');
      }
    });

    console.log('\n🧪 === FIN PRUEBA CONTRACTOCAMIONES ===');
    return economicosConGastos;
  }

  // Función para diagnosticar por qué los KPIs muestran 0
  async diagnosticarKPIs() {
    console.log('🔍 === DIAGNÓSTICO KPIs ===');

    // 1. Verificar elementos del DOM
    console.log('📊 Verificando elementos del DOM:');
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

    // 2. Verificar datos en localStorage
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

    // 3. Verificar configuracionManager
    console.log('\n📊 Verificando configuracionManager:');
    if (window.configuracionManager) {
      console.log('   - configuracionManager: ✅ Disponible');
      if (typeof window.configuracionManager.getAllOperadores === 'function') {
        try {
          const operadores = await window.getDataWithCache(
            'operadores',
            async () => window.configuracionManager.getAllOperadores() || []
          );
          console.log(`   - Operadores: ${operadores ? operadores.length : 0} elementos`);
        } catch (error) {
          console.log(`   - Operadores: Error - ${error.message}`);
        }
      }
    } else {
      console.log('   - configuracionManager: ❌ No disponible');
    }

    // 4. Verificar currentData
    console.log('\n📊 Verificando currentData:');
    console.log(
      `   - this.currentData: ${this.currentData ? '✅ Disponible' : '❌ No disponible'}`
    );
    if (this.currentData) {
      console.log(
        `   - Tipo: ${Array.isArray(this.currentData) ? 'Array' : typeof this.currentData}`
      );
      console.log(
        `   - Cantidad: ${Array.isArray(this.currentData) ? this.currentData.length : 'N/A'}`
      );

      if (Array.isArray(this.currentData) && this.currentData.length > 0) {
        const departamentos = [...new Set(this.currentData.map(item => item.departamento))];
        console.log(`   - Departamentos: ${departamentos.join(', ')}`);
      }
    }

    // 5. Forzar actualización de KPIs
    console.log('\n🔄 Forzando actualización de KPIs...');
    if (this.currentData) {
      await this.updateKPIs(this.currentData);
    } else {
      console.log('⚠️ No hay currentData para actualizar KPIs');
    }

    console.log('🔍 === FIN DIAGNÓSTICO ===');
  }

  // Función para diagnosticar el problema del filtro de tractocamiones
  diagnosticarFiltroTractocamionesCompleto() {
    console.log('🔍 === DIAGNÓSTICO COMPLETO FILTRO TRACTOCAMIONES ===');

    // 1. Verificar el elemento select
    const select = document.getElementById('filtroTractocamion');
    if (!select) {
      console.error('❌ Elemento filtroTractocamion no encontrado');
      return;
    }

    console.log('📊 Estado actual del filtro:');
    console.log(`   - Opciones disponibles: ${select.options.length}`);
    console.log(`   - Valor seleccionado: "${select.value}"`);

    // Mostrar todas las opciones
    Array.from(select.options).forEach((option, index) => {
      console.log(`   ${index}. Valor: "${option.value}" - Texto: "${option.textContent}"`);
    });

    // 2. Verificar datos de viajes
    const viajesData = this.loadViajesData();
    console.log(`\n📊 Datos de viajes disponibles: ${viajesData.length}`);

    if (viajesData.length > 0) {
      // Extraer todos los económicos únicos de los viajes
      const economicosEnViajes = [
        ...new Set(viajesData.map(viaje => viaje.economico).filter(Boolean))
      ];
      console.log(`📋 Económicos únicos en viajes: ${economicosEnViajes.length}`);
      economicosEnViajes.forEach((economico, index) => {
        console.log(`   ${index + 1}. "${economico}"`);
      });

      // 3. Verificar coincidencias entre filtro y datos
      console.log('\n🔍 Verificando coincidencias:');
      Array.from(select.options).forEach(option => {
        if (option.value) {
          const coincidencias = viajesData.filter(viaje => {
            const economicoViaje = String(viaje.economico || '').trim();
            const valorFiltro = String(option.value).trim();

            return (
              economicoViaje === valorFiltro ||
              economicoViaje.toLowerCase().replace(/\s+/g, '') ===
                valorFiltro.toLowerCase().replace(/\s+/g, '') ||
              economicoViaje.includes(valorFiltro) ||
              valorFiltro.includes(economicoViaje)
            );
          });

          console.log(`   "${option.value}": ${coincidencias.length} viajes encontrados`);
        }
      });
    }

    // 4. Probar filtro específico
    if (select.value) {
      console.log(`\n🧪 Probando filtro con valor: "${select.value}"`);
      const datosFiltrados = this.processViajesData(viajesData);
      console.log(`📊 Resultado del filtro: ${datosFiltrados.length} viajes`);
    }

    console.log('🔍 === FIN DIAGNÓSTICO ===');
  }

  // Función para agregar tractocamiones faltantes a la configuración
  agregarTractocamionesFaltantes() {
    console.log('🔧 === AGREGANDO TRACTOCAMIONES FALTANTES ===');

    try {
      // Obtener tractocamiones de configuración
      let tractocamionesConfiguracion = [];
      if (window.__economicosCache && window.__economicosCache.length > 0) {
        tractocamionesConfiguracion = window.__economicosCache;
      } else if (window.configuracionManager && window.configuracionManager.getAllEconomicos) {
        tractocamionesConfiguracion = window.configuracionManager.getAllEconomicos();
      }

      // Obtener tractocamiones de viajes
      const viajesData = this.loadViajesData();
      const tractocamionesEnViajes = [
        ...new Set(viajesData.map(viaje => viaje.economico).filter(Boolean))
      ];

      // Encontrar tractocamiones faltantes
      const tractocamionesConfigurados = tractocamionesConfiguracion.map(t => t.numero || t);
      const tractocamionesFaltantes = tractocamionesEnViajes.filter(
        numero => !tractocamionesConfigurados.includes(numero)
      );

      console.log('📊 Tractocamiones en configuración:', tractocamionesConfigurados);
      console.log('📊 Tractocamiones en viajes:', tractocamionesEnViajes);
      console.log('❌ Tractocamiones faltantes:', tractocamionesFaltantes);

      if (tractocamionesFaltantes.length > 0) {
        console.log('🔧 Agregando tractocamiones faltantes a la configuración...');

        // Crear objetos para los tractocamiones faltantes
        const nuevosTractocamiones = tractocamionesFaltantes.map(numero => ({
          numero: numero,
          placaTracto: `TRAC${numero}`,
          placas: `TRAC${numero}`,
          estado: 'activo',
          fechaCreacion: new Date().toISOString(),
          agregadoDesdeViajes: true
        }));

        // Agregar a la configuración
        if (window.configuracionManager && window.configuracionManager.agregarEconomico) {
          nuevosTractocamiones.forEach(tractocamion => {
            try {
              window.configuracionManager.agregarEconomico(tractocamion);
              console.log(`✅ Tractocamión ${tractocamion.numero} agregado a configuración`);
            } catch (error) {
              reportesLog.warn(`⚠️ Error agregando tractocamión ${tractocamion.numero}:`, error);
            }
          });
        } else {
          // Agregar directamente al localStorage
          console.log('🔧 Agregando tractocamiones directamente al localStorage...');

          try {
            // Obtener económicos existentes
            let economicosExistentes = {};
            const rawLocal = localStorage.getItem('erp_economicos');
            if (rawLocal) {
              const parsed = JSON.parse(rawLocal);
              if (parsed && typeof parsed === 'object') {
                economicosExistentes = parsed;
              }
            }

            // Agregar nuevos tractocamiones
            nuevosTractocamiones.forEach(tractocamion => {
              economicosExistentes[tractocamion.numero] = {
                numero: tractocamion.numero,
                placaTracto: tractocamion.placaTracto,
                placas: tractocamion.placas,
                estado: tractocamion.estado,
                fechaCreacion: tractocamion.fechaCreacion,
                agregadoDesdeViajes: tractocamion.agregadoDesdeViajes
              };
              console.log(`✅ Tractocamión ${tractocamion.numero} agregado al localStorage`);
            });

            // Guardar en localStorage
            localStorage.setItem('erp_economicos', JSON.stringify(economicosExistentes));
            console.log('✅ Tractocamiones guardados en localStorage');

            // Actualizar cache si existe
            if (window.__economicosCache) {
              window.__economicosCache = Object.values(economicosExistentes);
              console.log('✅ Cache de económicos actualizado');
            }
          } catch (error) {
            console.error('❌ Error guardando tractocamiones en localStorage:', error);
            console.log('📋 Tractocamiones a agregar manualmente:');
            nuevosTractocamiones.forEach(tractocamion => {
              console.log(
                `   - Número: ${tractocamion.numero}, Placa: ${tractocamion.placaTracto}`
              );
            });
          }
        }

        // Recargar el filtro
        this.loadTractocamionesFilter();

        console.log('✅ Tractocamiones faltantes agregados y filtro actualizado');
      } else {
        console.log('✅ Todos los tractocamiones ya están en la configuración');
      }
    } catch (error) {
      console.error('❌ Error agregando tractocamiones faltantes:', error);
    }

    console.log('🔧 === FIN AGREGACIÓN ===');
  }

  // Función para limpiar y corregir datos de económicos
  limpiarDatosEconomicos() {
    console.log('🧹 === LIMPIANDO DATOS DE ECONÓMICOS ===');

    try {
      // Obtener datos actuales
      const rawLocal = localStorage.getItem('erp_economicos');
      if (!rawLocal) {
        console.log('❌ No hay datos de económicos en localStorage');
        return;
      }

      const datosActuales = JSON.parse(rawLocal);
      console.log('📊 Datos actuales:', datosActuales.length, 'elementos');

      // Limpiar datos: eliminar nulls, duplicados y tractocamiones no oficiales
      const datosLimpios = [];
      const numerosVistos = new Set();

      // Tractocamiones oficiales (solo los que están en configuración real)
      const tractocamionesOficiales = ['123', '440', '550'];

      datosActuales.forEach(item => {
        if (item && item.numero) {
          const { numero } = item;

          // Solo incluir tractocamiones oficiales
          if (tractocamionesOficiales.includes(numero)) {
            // Si es el primer 440 que vemos, mantenerlo
            if (numero === '440' && !numerosVistos.has(numero)) {
              numerosVistos.add(numero);
              datosLimpios.push(item);
              console.log(`✅ Tractocamión ${numero} mantenido (oficial)`);
            }
            // Para otros tractocamiones oficiales
            else if (numero !== '440' && !numerosVistos.has(numero)) {
              numerosVistos.add(numero);
              datosLimpios.push(item);
              console.log(`✅ Tractocamión ${numero} mantenido (oficial)`);
            }
            // Si es un duplicado del 440, ignorarlo
            else if (numero === '440' && numerosVistos.has(numero)) {
              console.log(`❌ Tractocamión ${numero} duplicado eliminado`);
            }
          }
          // Eliminar tractocamiones no oficiales (116, 502)
          else {
            console.log(`❌ Tractocamión ${numero} eliminado (no oficial)`);
          }
        }
      });

      console.log('✅ Datos limpiados:', datosLimpios.length, 'elementos');
      console.log(
        '📋 Tractocamiones oficiales:',
        datosLimpios.map(t => t.numero)
      );

      // Guardar datos limpios
      localStorage.setItem('erp_economicos', JSON.stringify(datosLimpios));
      console.log('✅ Datos limpios guardados en localStorage');

      // Actualizar cache
      if (window.__economicosCache) {
        window.__economicosCache = datosLimpios;
        console.log('✅ Cache actualizado');
      }

      // Recargar filtro
      this.loadTractocamionesFilter();
      console.log('✅ Filtro recargado con datos limpios');
    } catch (error) {
      console.error('❌ Error limpiando datos de económicos:', error);
    }

    console.log('🧹 === FIN LIMPIEZA ===');
  }

  // Función para diagnosticar y corregir datos de viajes
  diagnosticarYCorregirViajes() {
    console.log('🔍 === DIAGNÓSTICO Y CORRECCIÓN DE VIAJES ===');

    try {
      // Cargar datos de viajes
      const viajesData = this.loadViajesData();
      console.log('📊 Total de viajes:', viajesData.length);

      // Mostrar todos los viajes con sus tractocamiones
      console.log('📋 Viajes actuales:');
      viajesData.forEach((viaje, index) => {
        console.log(
          `   ${index + 1}. ID: ${viaje.id || 'N/A'}, Económico: "${viaje.economico}", Fecha: ${viaje.fecha || viaje.fechaEnvio || 'N/A'}`
        );
      });

      // Contar viajes por tractocamión
      const viajesPorTractocamion = {};
      viajesData.forEach(viaje => {
        const economico = viaje.economico || 'Sin económico';
        viajesPorTractocamion[economico] = (viajesPorTractocamion[economico] || 0) + 1;
      });

      console.log('📊 Viajes por tractocamión:');
      Object.entries(viajesPorTractocamion).forEach(([economico, count]) => {
        console.log(`   - ${economico}: ${count} viajes`);
      });

      // Verificar si hay viajes sin tractocamión asignado
      const viajesSinTractocamion = viajesData.filter(
        viaje => !viaje.economico || viaje.economico === ''
      );
      if (viajesSinTractocamion.length > 0) {
        console.log('⚠️ Viajes sin tractocamión asignado:', viajesSinTractocamion.length);
        viajesSinTractocamion.forEach((viaje, index) => {
          console.log(
            `   ${index + 1}. ID: ${viaje.id || 'N/A'}, Fecha: ${viaje.fecha || viaje.fechaEnvio || 'N/A'}`
          );
        });
      }

      // Sugerir distribución equitativa si es necesario
      const tractocamionesOficiales = ['123', '440', '550'];
      const viajesPorTractocamionEsperado = Math.ceil(
        viajesData.length / tractocamionesOficiales.length
      );

      console.log(
        `\n💡 Sugerencia: Cada tractocamión debería tener aproximadamente ${viajesPorTractocamionEsperado} viajes`
      );

      // Función para redistribuir viajes equitativamente
      const redistribuirViajes = () => {
        console.log('🔄 Redistribuyendo viajes equitativamente...');

        const viajesRedistribuidos = [...viajesData];
        let tractocamionIndex = 0;

        viajesRedistribuidos.forEach((viaje, index) => {
          const tractocamionAsignado = tractocamionesOficiales[tractocamionIndex];
          viaje.economico = tractocamionAsignado;

          console.log(`   Viaje ${index + 1} asignado a tractocamión ${tractocamionAsignado}`);

          // Rotar al siguiente tractocamión
          tractocamionIndex = (tractocamionIndex + 1) % tractocamionesOficiales.length;
        });

        // Guardar datos redistribuidos
        localStorage.setItem('erp_logistica', JSON.stringify(viajesRedistribuidos));
        console.log('✅ Viajes redistribuidos y guardados');

        // Recargar datos
        const nuevosViajes = this.loadViajesData();
        console.log('📊 Nuevos datos de viajes cargados:', nuevosViajes.length);

        // Mostrar nueva distribución
        const nuevaDistribucion = {};
        nuevosViajes.forEach(viaje => {
          const economico = viaje.economico || 'Sin económico';
          nuevaDistribucion[economico] = (nuevaDistribucion[economico] || 0) + 1;
        });

        console.log('📊 Nueva distribución:');
        Object.entries(nuevaDistribucion).forEach(([economico, count]) => {
          console.log(`   - ${economico}: ${count} viajes`);
        });

        return nuevosViajes;
      };

      // Preguntar si quiere redistribuir
      console.log('\n❓ ¿Quieres redistribuir los viajes equitativamente?');
      console.log('   Ejecuta: window.reportesSystem.redistribuirViajes()');

      // Guardar función para uso manual
      window.reportesSystem.redistribuirViajes = redistribuirViajes;
    } catch (error) {
      console.error('❌ Error diagnosticando viajes:', error);
    }

    console.log('🔍 === FIN DIAGNÓSTICO ===');
  }

  // Función para verificar y corregir la carga de datos de viajes
  verificarYCargarViajes() {
    console.log('🔍 === VERIFICANDO CARGA DE VIAJES ===');

    try {
      // Verificar datos en localStorage
      const rawLogistica = localStorage.getItem('erp_logistica');
      console.log(
        '📊 Datos en localStorage (erp_logistica):',
        rawLogistica ? 'Disponible' : 'No disponible'
      );

      if (rawLogistica) {
        const logisticaData = JSON.parse(rawLogistica);
        console.log('📊 Total de registros en localStorage:', logisticaData.length);

        // Mostrar tractocamiones en localStorage
        const tractocamionesEnLocalStorage = [
          ...new Set(logisticaData.map(viaje => viaje.economico).filter(Boolean))
        ];
        console.log('📋 Tractocamiones en localStorage:', tractocamionesEnLocalStorage);

        // Mostrar algunos ejemplos
        console.log('📋 Primeros 3 viajes en localStorage:');
        logisticaData.slice(0, 3).forEach((viaje, index) => {
          console.log(`   ${index + 1}. ID: ${viaje.id}, Económico: "${viaje.economico}"`);
        });
      }

      // Verificar datos cargados por loadViajesData
      const viajesCargados = this.loadViajesData();
      console.log('📊 Datos cargados por loadViajesData:', viajesCargados.length);

      const tractocamionesCargados = [
        ...new Set(viajesCargados.map(viaje => viaje.economico).filter(Boolean))
      ];
      console.log('📋 Tractocamiones cargados por loadViajesData:', tractocamionesCargados);

      // Comparar
      if (rawLogistica) {
        const logisticaData = JSON.parse(rawLogistica);
        const tractocamionesEnLocalStorage = [
          ...new Set(logisticaData.map(viaje => viaje.economico).filter(Boolean))
        ];

        if (
          JSON.stringify(tractocamionesEnLocalStorage.sort()) !==
          JSON.stringify(tractocamionesCargados.sort())
        ) {
          console.log('⚠️ DIFERENCIA DETECTADA:');
          console.log('   localStorage:', tractocamionesEnLocalStorage);
          console.log('   loadViajesData:', tractocamionesCargados);

          // Forzar recarga
          console.log('🔄 Forzando recarga de datos...');
          this.currentData = null; // Limpiar cache
          const viajesRecargados = this.loadViajesData();
          console.log('📊 Datos recargados:', viajesRecargados.length);

          const tractocamionesRecargados = [
            ...new Set(viajesRecargados.map(viaje => viaje.economico).filter(Boolean))
          ];
          console.log('📋 Tractocamiones recargados:', tractocamionesRecargados);
        } else {
          console.log('✅ Los datos coinciden');
        }
      }

      // Actualizar gráfico si es necesario
      if (this.charts.viajes) {
        console.log('🔄 Actualizando gráfico de viajes...');
        this.updateViajesChart();
      }
    } catch (error) {
      console.error('❌ Error verificando carga de viajes:', error);
    }

    console.log('🔍 === FIN VERIFICACIÓN ===');
  }

  // Función para diagnosticar por qué solo aparece un tractocamión en el filtro
  diagnosticarFiltroTractocamiones() {
    console.log('🔍 === DIAGNÓSTICO FILTRO TRACTOCAMIONES ===');

    // 1. Verificar el elemento select
    const select = document.getElementById('filtroTractocamion');
    if (!select) {
      console.error('❌ Elemento filtroTractocamion no encontrado');
      return;
    }

    console.log('📊 Estado actual del filtro:');
    console.log(`   - Opciones disponibles: ${select.options.length}`);
    console.log(`   - Valor seleccionado: "${select.value}"`);

    // Mostrar todas las opciones
    console.log('📋 Opciones en el filtro:');
    Array.from(select.options).forEach((option, index) => {
      console.log(`   ${index}. ${option.value} - ${option.textContent}`);
    });

    // 2. Verificar fuentes de datos
    console.log('\n📊 Fuentes de datos:');

    // Firestore cache
    console.log(
      '   - Firestore cache:',
      window.__economicosCache ? `${window.__economicosCache.length} elementos` : 'No disponible'
    );
    if (window.__economicosCache && window.__economicosCache.length > 0) {
      console.log(
        '     Elementos:',
        window.__economicosCache.map(e => e.numero || e)
      );
    }

    // ConfiguracionManager
    if (window.configuracionManager && window.configuracionManager.getAllEconomicos) {
      try {
        const economicos = window.configuracionManager.getAllEconomicos();
        console.log('   - ConfiguracionManager:', `${economicos.length} elementos`);
        if (economicos.length > 0) {
          console.log(
            '     Elementos:',
            economicos.map(e => e.numero || e)
          );
        }
      } catch (error) {
        console.log('   - ConfiguracionManager: Error -', error.message);
      }
    } else {
      console.log('   - ConfiguracionManager: No disponible');
    }

    // Firebase
    if (window.firebaseDb && window.fs) {
      console.log('   - Firebase: Disponible');
    } else {
      console.log('   - Firebase: No disponible');
    }

    // localStorage
    const localData = localStorage.getItem('erp_economicos');
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed)) {
          console.log('   - localStorage (array):', `${parsed.length} elementos`);
          console.log(
            '     Elementos:',
            parsed.map(e => e.numero || e)
          );
        } else if (parsed && typeof parsed === 'object') {
          const keys = Object.keys(parsed);
          console.log('   - localStorage (objeto):', `${keys.length} elementos`);
          console.log('     Elementos:', keys);
        }
      } catch (error) {
        console.log('   - localStorage: Error parseando -', error.message);
      }
    } else {
      console.log('   - localStorage: No disponible');
    }

    // 3. Verificar datos de viajes
    console.log('\n📊 Datos de viajes:');
    let viajesData = null;
    try {
      viajesData = this.loadViajesData();
      if (!viajesData || !Array.isArray(viajesData)) {
        console.log('   - Total viajes: No disponible o no es array');
        console.log('   - Tipo de dato:', typeof viajesData);
      } else {
        console.log(`   - Total viajes: ${viajesData.length}`);

        if (viajesData.length > 0) {
          const economicosEnViajes = [
            ...new Set(
              viajesData
                .map(v => v.economico || v.tractocamion || v.numeroEconomico)
                .filter(e => e && e !== '440')
            )
          ];
          console.log(`   - Económicos únicos en viajes: ${economicosEnViajes.length}`);
          console.log('     Elementos:', economicosEnViajes);

          if (economicosEnViajes.length > 0) {
            console.log('💡 Puedes usar estos tractocamiones del dropdown de análisis detallado');
          }
        }
      }
    } catch (error) {
      console.log('   - Error cargando viajes:', error.message);
    }

    // 4. Recomendaciones
    console.log('\n💡 Recomendaciones:');
    if (select.options.length <= 1) {
      console.log('   ⚠️ No hay tractocamiones en el dropdown');
      console.log('   1. Ve a configuracion.html y agrega tractocamiones');
      console.log('   2. O espera a que se carguen desde Firebase');
      console.log('   3. O recarga la página después de agregar tractocamiones');
    } else {
      console.log('   ✅ El dropdown tiene tractocamiones disponibles');
    }

    // 5. Forzar recarga del filtro
    console.log('\n🔄 Forzando recarga del filtro...');
    this.loadTractocamionesFilter();

    // Verificar después de recargar
    setTimeout(() => {
      console.log('\n📊 Estado después de recargar:');
      console.log(`   - Opciones disponibles: ${select.options.length}`);
      Array.from(select.options).forEach((option, index) => {
        console.log(`   ${index}. ${option.value} - ${option.textContent}`);
      });
    }, 1000);

    console.log('🔍 === FIN DIAGNÓSTICO ===');
  }

  // Función para verificar y corregir el mapeo de tractocamiones reales
  verificarTractocamionesReales() {
    console.log('🔍 === VERIFICANDO TRACTOCAMIONES REALES ===');

    // 1. Verificar tractocamiones en configuración
    console.log('📊 Tractocamiones en configuración:');
    let tractocamionesConfig = [];

    // Desde localStorage
    const economicosLocal = JSON.parse(localStorage.getItem('erp_economicos') || '[]');
    if (Array.isArray(economicosLocal)) {
      tractocamionesConfig = economicosLocal.map(e => e.numero || e);
    } else if (typeof economicosLocal === 'object') {
      tractocamionesConfig = Object.keys(economicosLocal);
    }

    console.log('   - Desde localStorage:', tractocamionesConfig);

    // Desde Firestore cache
    if (window.__economicosCache) {
      const tractocamionesCache = window.__economicosCache.map(e => e.numero || e);
      console.log('   - Desde Firestore cache:', tractocamionesCache);
    }

    // 2. Verificar tractocamiones en datos de tráfico
    console.log('\n📊 Tractocamiones en datos de tráfico:');
    const traficoData = JSON.parse(localStorage.getItem('erp_trafico') || '{}');
    const tractocamionesTrafico = [
      ...new Set(
        Object.values(traficoData)
          .map(reg => reg.economico)
          .filter(e => e)
      )
    ];
    console.log('   - En tráfico:', tractocamionesTrafico);

    // 3. Verificar tractocamiones en datos de logística
    console.log('\n📊 Tractocamiones en datos de logística:');
    const logisticaData = JSON.parse(localStorage.getItem('erp_logistica') || '{}');
    const tractocamionesLogistica = [
      ...new Set(
        Object.values(logisticaData)
          .map(reg => reg.economico)
          .filter(e => e)
      )
    ];
    console.log('   - En logística:', tractocamionesLogistica);

    // 4. Verificar tractocamiones en gastos de operadores
    console.log('\n📊 Tractocamiones en gastos de operadores:');
    const operadoresData = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');
    const tractocamionesGastos = [
      ...new Set(operadoresData.map(gasto => gasto.economico).filter(e => e))
    ];
    console.log('   - En gastos:', tractocamionesGastos);

    // 5. Identificar tractocamiones reales (los que aparecen en configuración)
    const tractocamionesReales = ['550', '440', '123'];
    console.log('\n🎯 Tractocamiones reales del sistema:', tractocamionesReales);

    // 6. Identificar problema
    console.log('\n⚠️ PROBLEMA IDENTIFICADO:');
    console.log(`   - Tractocamiones reales: ${tractocamionesReales.join(', ')}`);
    console.log(`   - Tractocamiones en gastos: ${tractocamionesGastos.join(', ')}`);
    console.log('   - Los gastos están asignados a tractocamiones que no existen en el sistema');

    return {
      tractocamionesReales,
      tractocamionesGastos,
      tractocamionesConfig,
      tractocamionesTrafico,
      tractocamionesLogistica
    };
  }

  // Función para corregir los gastos a los tractocamiones reales
  corregirGastosATractocamionesReales() {
    console.log('🔧 === CORRIGIENDO GASTOS A TRACTOCAMIONES REALES ===');

    const operadoresData = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');
    const tractocamionesReales = ['550', '440', '123'];

    // Mapeo de operadores a tractocamiones reales
    const mapeoCorregido = {
      'Operador 1': '123', // Asignar a tractocamión 123
      'Operador 2': '440', // Asignar a tractocamión 440
      'Operador 3': '550' // Asignar a tractocamión 550
    };

    console.log('📊 Mapeo corregido:', mapeoCorregido);

    let cambiosRealizados = 0;
    const gastosCorregidos = operadoresData.map(gasto => {
      const nombreOperador = gasto.operadorNombre;
      let tractocamionCorregido = null;

      // Buscar coincidencia exacta
      if (mapeoCorregido[nombreOperador]) {
        tractocamionCorregido = mapeoCorregido[nombreOperador];
      } else {
        // Buscar coincidencia parcial
        Object.keys(mapeoCorregido).forEach(operador => {
          if (nombreOperador.includes(operador)) {
            tractocamionCorregido = mapeoCorregido[operador];
          }
        });
      }

      if (tractocamionCorregido && gasto.economico !== tractocamionCorregido) {
        console.log(
          `🔧 Corrigiendo ${nombreOperador}: ${gasto.economico} → ${tractocamionCorregido}`
        );
        cambiosRealizados++;
        return {
          ...gasto,
          economico: tractocamionCorregido
        };
      }

      return gasto;
    });

    if (cambiosRealizados > 0) {
      localStorage.setItem('erp_operadores_gastos', JSON.stringify(gastosCorregidos));
      console.log(`✅ ${cambiosRealizados} gastos corregidos a tractocamiones reales`);

      // Mostrar nueva distribución
      console.log('\n📊 Nueva distribución de gastos:');
      tractocamionesReales.forEach(tractocamion => {
        const gastos = gastosCorregidos.filter(g => g.economico === tractocamion);
        const total = gastos.reduce((sum, g) => sum + (parseFloat(g.monto || 0) || 0), 0);
        console.log(
          `   - Tractocamión ${tractocamion}: ${gastos.length} gastos, Total: $${total.toFixed(2)}`
        );
      });

      // Recargar análisis
      setTimeout(() => {
        this.updateAnalisisEconomico().catch(err =>
          console.error('Error actualizando análisis:', err)
        );
        console.log('🔄 Análisis económico actualizado con tractocamiones reales');
      }, 500);
    } else {
      console.log('✅ Los gastos ya están correctamente asignados a tractocamiones reales');
    }

    console.log('🔧 === FIN CORRECCIÓN ===');
    return cambiosRealizados;
  }

  // Función de diagnóstico para filtros de viajes por tractocamión
  diagnosticarFiltrosViajes() {
    console.log('🔍 === DIAGNÓSTICO FILTROS VIAJES POR TRACTOCAMION ===');

    // 1. Verificar que los elementos existen
    const filtroTractocamion = document.getElementById('filtroTractocamion');
    const fechaDesde = document.getElementById('fechaDesde');
    const fechaHasta = document.getElementById('fechaHasta');

    console.log('📊 Elementos de filtro:');
    console.log(`   - filtroTractocamion: ${filtroTractocamion ? '✅ Existe' : '❌ No existe'}`);
    console.log(`   - fechaDesde: ${fechaDesde ? '✅ Existe' : '❌ No existe'}`);
    console.log(`   - fechaHasta: ${fechaHasta ? '✅ Existe' : '❌ No existe'}`);

    // 2. Verificar valores actuales
    if (filtroTractocamion) {
      console.log(`   - Valor tractocamión: "${filtroTractocamion.value}"`);
      console.log(`   - Opciones disponibles: ${filtroTractocamion.options.length}`);
      Array.from(filtroTractocamion.options).forEach((option, index) => {
        console.log(`     ${index}. ${option.value} - ${option.textContent}`);
      });
    }

    if (fechaDesde) {
      console.log(`   - Fecha desde: "${fechaDesde.value}"`);
    }

    if (fechaHasta) {
      console.log(`   - Fecha hasta: "${fechaHasta.value}"`);
    }

    // 3. Verificar si el gráfico existe
    console.log('📊 Gráfico de viajes:');
    console.log(`   - this.charts.viajes: ${this.charts.viajes ? '✅ Existe' : '❌ No existe'}`);

    // 4. Probar función de actualización
    console.log('🧪 Probando función updateViajesChart...');
    try {
      this.updateViajesChart();
      console.log('✅ updateViajesChart ejecutada sin errores');
    } catch (error) {
      console.error('❌ Error en updateViajesChart:', error);
    }

    // 5. Verificar datos de viajes
    const viajesData = this.loadViajesData();
    console.log(`📊 Datos de viajes cargados: ${viajesData.length}`);

    if (viajesData.length > 0) {
      console.log('📋 Primeros 3 viajes:');
      viajesData.slice(0, 3).forEach((viaje, index) => {
        console.log(`   ${index + 1}. Económico: ${viaje.economico}, Fecha: ${viaje.fechaEnvio}`);
      });
    }

    // 6. Probar procesamiento de datos
    const chartData = this.processViajesData(viajesData);
    console.log('📊 Datos procesados para gráfico:');
    console.log(`   - Labels: ${chartData.labels.length}`);
    console.log(`   - Values: ${chartData.values.length}`);

    console.log('🔍 === FIN DIAGNÓSTICO ===');
    return {
      elementosExisten: Boolean(filtroTractocamion && fechaDesde && fechaHasta),
      graficoExiste: Boolean(this.charts.viajes),
      datosViajes: viajesData.length,
      datosProcesados: chartData
    };
  }

  // Función para probar filtros específicos
  probarFiltrosEspecificos(tractocamion = null, fechaDesde = null, fechaHasta = null) {
    console.log('🧪 === PROBANDO FILTROS ESPECÍFICOS ===');

    // Usar valores del formulario si no se especifican
    if (!tractocamion) {
      tractocamion = document.getElementById('filtroTractocamion')?.value || '';
    }
    if (!fechaDesde) {
      fechaDesde = document.getElementById('fechaDesde')?.value || '';
    }
    if (!fechaHasta) {
      fechaHasta = document.getElementById('fechaHasta')?.value || '';
    }

    console.log('📊 Filtros a probar:');
    console.log(`   - Tractocamión: "${tractocamion}"`);
    console.log(`   - Fecha desde: "${fechaDesde}"`);
    console.log(`   - Fecha hasta: "${fechaHasta}"`);

    const viajesData = this.loadViajesData();
    console.log(`📊 Total de viajes disponibles: ${viajesData.length}`);

    // Mostrar todos los viajes disponibles
    console.log('📋 Todos los viajes disponibles:');
    viajesData.forEach((viaje, index) => {
      console.log(
        `   ${index + 1}. Económico: ${viaje.economico}, Fecha: ${viaje.fechaEnvio || viaje.fecha}`
      );
    });

    // Aplicar filtros uno por uno
    let filteredData = viajesData;

    // Filtro por tractocamión
    if (tractocamion) {
      const antes = filteredData.length;
      filteredData = filteredData.filter(viaje => viaje.economico === tractocamion);
      console.log(
        `🔍 Filtro por tractocamión "${tractocamion}": ${antes} → ${filteredData.length} viajes`
      );
    }

    // Filtro por fecha desde
    if (fechaDesde) {
      const antes = filteredData.length;
      filteredData = filteredData.filter(
        viaje => new Date(viaje.fechaEnvio || viaje.fecha) >= new Date(fechaDesde)
      );
      console.log(
        `🔍 Filtro por fecha desde "${fechaDesde}": ${antes} → ${filteredData.length} viajes`
      );
    }

    // Filtro por fecha hasta
    if (fechaHasta) {
      const antes = filteredData.length;
      filteredData = filteredData.filter(
        viaje => new Date(viaje.fechaEnvio || viaje.fecha) <= new Date(fechaHasta)
      );
      console.log(
        `🔍 Filtro por fecha hasta "${fechaHasta}": ${antes} → ${filteredData.length} viajes`
      );
    }

    console.log(`📊 Viajes después de todos los filtros: ${filteredData.length}`);

    if (filteredData.length > 0) {
      console.log('📋 Viajes filtrados:');
      filteredData.forEach((viaje, index) => {
        console.log(
          `   ${index + 1}. Económico: ${viaje.economico}, Fecha: ${viaje.fechaEnvio || viaje.fecha}`
        );
      });

      // Procesar datos
      const chartData = this.groupViajesByEconomicos(filteredData);
      console.log('📊 Datos procesados:');
      console.log(`   - Labels: ${chartData.labels.length}`);
      console.log(`   - Values: ${chartData.values.length}`);
      console.log('   - Detalles:', chartData);
    } else {
      console.log('❌ No hay viajes que coincidan con los filtros');
      console.log('💡 Sugerencias:');
      console.log('   - Verifica que el tractocamión tenga viajes en las fechas especificadas');
      console.log('   - Prueba con "Todos los tractocamiones" para ver todos los datos');
      console.log('   - Ajusta el rango de fechas');
    }

    console.log('🧪 === FIN PRUEBA ===');
    return filteredData;
  }

  filtrarPorFecha(datos, fechaFiltro, campoFecha) {
    if (!fechaFiltro || !fechaFiltro.desde || !fechaFiltro.hasta) {
      return datos;
    }

    return datos.filter(item => {
      const fechaStr = item[campoFecha] || item.fecha;
      if (!fechaStr) {
        return false;
      }

      let fechaItem;
      // Parsear fecha correctamente para evitar problemas de zona horaria
      if (typeof fechaStr === 'string') {
        if (/^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
          // Formato YYYY-MM-DD: parsear directamente sin zona horaria
          const [year, month, day] = fechaStr.split('T')[0].split('-');
          fechaItem = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        } else if (fechaStr.includes('/')) {
          // Formato DD/MM/YYYY
          const partes = fechaStr.split('/');
          if (partes.length === 3) {
            const dia = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10) - 1;
            const año = parseInt(partes[2], 10);
            fechaItem = new Date(año, mes, dia);
          } else {
            fechaItem = new Date(fechaStr);
          }
        } else {
          fechaItem = new Date(fechaStr);
        }
      } else {
        fechaItem = new Date(fechaStr);
      }

      if (isNaN(fechaItem.getTime())) {
        return false;
      }

      // Comparar solo las fechas (sin hora) para evitar problemas de zona horaria
      const fechaItemSolo = new Date(
        fechaItem.getFullYear(),
        fechaItem.getMonth(),
        fechaItem.getDate()
      );
      const desdeSolo = new Date(
        fechaFiltro.desde.getFullYear(),
        fechaFiltro.desde.getMonth(),
        fechaFiltro.desde.getDate()
      );
      const hastaSolo = new Date(
        fechaFiltro.hasta.getFullYear(),
        fechaFiltro.hasta.getMonth(),
        fechaFiltro.hasta.getDate()
      );

      return fechaItemSolo >= desdeSolo && fechaItemSolo <= hastaSolo;
    });
  }

  groupViajesByPeriod(data, periodo) {
    const groups = {};

    data.forEach(viaje => {
      const fecha = new Date(viaje.fecha);
      let key;

      switch (periodo) {
        case 'dia':
          key = fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          break;
        case 'semana':
          const startOfWeek = new Date(fecha);
          startOfWeek.setDate(fecha.getDate() - fecha.getDay());
          key = `Sem ${startOfWeek.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit'
          })}`;
          break;
        case 'mes':
        default:
          key = fecha.toLocaleDateString('es-ES', {
            month: 'long',
            year: 'numeric'
          });
          break;
      }

      groups[key] = (groups[key] || 0) + 1;
    });

    return {
      labels: Object.keys(groups),
      values: Object.values(groups)
    };
  }

  loadTractocamionesFilter(options = {}) {
    const { retryCount = 0, maxRetries = 3, silent = false } = options;

    try {
      // Verificar que el elemento select existe
      const select = document.getElementById('filtroTractocamion');
      if (!select) {
        if (!silent) {
          reportesLog.warn('Elemento filtroTractocamion no encontrado');
        }
        return false;
      }

      if (!silent && retryCount === 0) {
        console.log('🔄 Cargando tractocamiones para el filtro...');
      }

      // Obtener tractocamiones de configuración
      let tractocamionesConfiguracion = [];
      let fuenteCarga = '';

      // 1. Intentar obtener desde el caché de Firestore (más actual)
      if (
        window.__economicosCache &&
        Array.isArray(window.__economicosCache) &&
        window.__economicosCache.length > 0
      ) {
        tractocamionesConfiguracion = window.__economicosCache;
        fuenteCarga = 'Firestore cache';
        if (!silent) {
          console.log(
            `✅ Tractocamiones cargados desde ${fuenteCarga}:`,
            tractocamionesConfiguracion.length
          );
        }
      }
      // 2. Intentar obtener del sistema de configuración
      else if (
        window.configuracionManager &&
        typeof window.configuracionManager.getAllEconomicos === 'function'
      ) {
        try {
          tractocamionesConfiguracion = window.configuracionManager.getAllEconomicos();
          if (tractocamionesConfiguracion && tractocamionesConfiguracion.length > 0) {
            fuenteCarga = 'configuracionManager';
            if (!silent) {
              console.log(
                `✅ Tractocamiones cargados desde ${fuenteCarga}:`,
                tractocamionesConfiguracion.length
              );
            }
          }
        } catch (error) {
          if (!silent && retryCount === 0) {
            reportesLog.debug(
              '⚠️ Error cargando tractocamiones desde configuracionManager:',
              error.message
            );
          }
        }
      }

      // 3. Si no hay datos en configuración, intentar del sistema de persistencia
      if (
        tractocamionesConfiguracion.length === 0 &&
        window.DataPersistence &&
        typeof window.DataPersistence.getAllEconomicos === 'function'
      ) {
        try {
          const dataPersistence = window.DataPersistence.getAllEconomicos();
          if (dataPersistence && dataPersistence.length > 0) {
            tractocamionesConfiguracion = dataPersistence;
            fuenteCarga = 'DataPersistence';
            if (!silent) {
              console.log(
                `✅ Tractocamiones cargados desde ${fuenteCarga}:`,
                tractocamionesConfiguracion.length
              );
            }
          }
        } catch (error) {
          if (!silent && retryCount === 0) {
            reportesLog.debug(
              '⚠️ Error cargando tractocamiones desde DataPersistence:',
              error.message
            );
          }
        }
      }

      // 4. Si aún no hay datos, intentar cargar desde localStorage directamente
      if (tractocamionesConfiguracion.length === 0) {
        try {
          const rawLocal = localStorage.getItem('erp_economicos');
          if (rawLocal) {
            const parsed = JSON.parse(rawLocal);
            if (Array.isArray(parsed) && parsed.length > 0) {
              tractocamionesConfiguracion = parsed;
              fuenteCarga = 'localStorage';
              if (!silent) {
                console.log(
                  `✅ Tractocamiones cargados desde ${fuenteCarga}:`,
                  tractocamionesConfiguracion.length
                );
              }
            } else if (parsed && typeof parsed === 'object') {
              const tractocamionesObj = Object.keys(parsed).map(numero => ({
                numero,
                ...parsed[numero]
              }));
              if (tractocamionesObj.length > 0) {
                tractocamionesConfiguracion = tractocamionesObj;
                fuenteCarga = 'localStorage (objeto)';
                if (!silent) {
                  console.log(
                    `✅ Tractocamiones cargados desde ${fuenteCarga}:`,
                    tractocamionesConfiguracion.length
                  );
                }
              }
            }
          }
        } catch (error) {
          if (!silent && retryCount === 0) {
            reportesLog.debug(
              '⚠️ Error parseando tractocamiones desde localStorage:',
              error.message
            );
          }
        }
      }

      // Si no hay datos y aún podemos reintentar, programar un reintento
      if (tractocamionesConfiguracion.length === 0 && retryCount < maxRetries) {
        // Verificar si el caché está siendo cargado
        if (window.__economicosCache === undefined) {
          // El caché aún no está inicializado, reintentar después
          setTimeout(
            () => {
              this.loadTractocamionesFilter({
                retryCount: retryCount + 1,
                maxRetries,
                silent: true
              });
            },
            1000 * (retryCount + 1)
          ); // Delay progresivo: 1s, 2s, 3s
          return false;
        }

        // Si el caché existe pero está vacío y es el último intento, mostrar warning
        if (retryCount === maxRetries - 1) {
          const selectCurrent = document.getElementById('filtroTractocamion');
          if (selectCurrent && selectCurrent.children.length <= 1) {
            reportesLog.warn(
              '⚠️ No se encontraron tractocamiones para cargar en el filtro después de múltiples intentos. Verifica que haya tractocamiones configurados.'
            );
          }
        }
        return false;
      }

      // 5. Solo usar tractocamiones de configuración (oficiales)
      const todosLosTractocamiones = new Set();

      // Agregar solo tractocamiones de configuración (oficiales)
      tractocamionesConfiguracion.forEach(economico => {
        const numero = economico.numero || economico;
        if (numero) {
          todosLosTractocamiones.add(numero);
        }
      });

      if (!silent && todosLosTractocamiones.size > 0) {
        console.log(
          '📊 Tractocamiones oficiales en configuración:',
          Array.from(todosLosTractocamiones)
        );
        console.log('📋 Total de tractocamiones únicos:', todosLosTractocamiones.size);
      }

      // Limpiar select
      select.innerHTML = '<option value="">Todos los tractocamiones</option>';

      // Agregar tractocamiones al select
      if (todosLosTractocamiones.size > 0) {
        // Convertir a array y ordenar
        const tractocamionesOrdenados = Array.from(todosLosTractocamiones).sort((a, b) =>
          String(a).localeCompare(String(b))
        );

        tractocamionesOrdenados.forEach(numero => {
          const option = document.createElement('option');

          // Buscar información adicional del tractocamión en la configuración
          const tractocamionInfo = tractocamionesConfiguracion.find(
            t => (t.numero || t) === numero
          );
          const placa = tractocamionInfo
            ? tractocamionInfo.placaTracto || tractocamionInfo.placas || ''
            : '';
          const label = `${numero}${placa ? ` - ${placa}` : ''}`;

          option.value = numero;
          option.textContent = label;
          select.appendChild(option);
        });

        if (!silent) {
          console.log(
            `✅ ${tractocamionesOrdenados.length} tractocamiones cargados en el filtro desde ${fuenteCarga}`
          );
        }
        return true;
      }
      // Solo mostrar warning si es el último intento y realmente no hay datos
      if (retryCount >= maxRetries - 1) {
        const selectCurrent = document.getElementById('filtroTractocamion');
        if (selectCurrent && selectCurrent.children.length <= 1 && !silent) {
          reportesLog.warn(
            '⚠️ No se encontraron tractocamiones para cargar en el filtro. Esto es normal si aún no has configurado tractocamiones.'
          );
        }
      }
      return false;
    } catch (error) {
      console.error('❌ Error cargando tractocamiones:', error);
      return false;
    }
  }

  groupDataByMonth(data) {
    const months = {};
    const monthNames = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic'
    ];

    data.forEach(item => {
      const date = new Date(item.fecha);
      const monthKey = `${monthNames[date.getMonth()]}-${date.getFullYear()}`;
      months[monthKey] = (months[monthKey] || 0) + 1;
    });

    return {
      labels: Object.keys(months),
      values: Object.values(months)
    };
  }

  loadLogisticaDataForChart() {
    console.log('🔍 Cargando SOLO datos de logística para el gráfico de tipos de servicio...');

    try {
      // Buscar en erp_shared_data.registros.logistica
      const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
      let logisticaData = [];

      if (
        sharedData.registros &&
        sharedData.registros.logistica &&
        Array.isArray(sharedData.registros.logistica)
      ) {
        logisticaData = sharedData.registros.logistica;
        console.log('📋 Datos de logística encontrados (array):', logisticaData);
      } else if (sharedData.registros && typeof sharedData.registros === 'object') {
        // Buscar en erp_shared_data.registros como objeto
        logisticaData = Object.values(sharedData.registros);
        console.log('📋 Datos de logística encontrados (objeto):', logisticaData);
      } else {
        // Fallback: buscar en erp_logistica
        logisticaData = JSON.parse(localStorage.getItem('erp_logistica') || '[]');
        console.log('📋 Datos de logística encontrados (fallback):', logisticaData);
      }

      return logisticaData;
    } catch (error) {
      console.error('❌ Error cargando datos de logística:', error);
      return [];
    }
  }

  groupDataByService(data) {
    console.log('🔍 Procesando datos para gráfico de pastel:', data);

    // Obtener el mes del filtro
    const filtro = this.obtenerMesFiltro();
    console.log('📅 Filtro de mes para gráfico de servicios:', {
      mes: filtro.mes + 1,
      año: filtro.año
    });

    // Usar los datos ya cargados en currentData, filtrar solo logística del mes filtrado
    const logisticaData = data.filter(item => {
      if (item.departamento !== 'logistica') {
        return false;
      }
      return this.perteneceAlMesFiltro(item.fecha);
    });
    console.log(
      '📋 Datos de logística filtrados de currentData (mes filtrado):',
      logisticaData.length
    );

    if (!logisticaData || !Array.isArray(logisticaData) || logisticaData.length === 0) {
      console.log(
        '⚠️ No hay datos de logística válidos para el gráfico de pastel en el mes seleccionado'
      );
      // Retornar vacío en lugar de datos de ejemplo
      return {
        labels: [],
        values: []
      };
    }

    const services = {};
    logisticaData.forEach((item, index) => {
      console.log(`📋 Procesando item de logística ${index}:`, item);
      // Usar servicio o tipoServicio que contiene: general, urgente, doble-operador
      const tipoServicio = item.servicio || item.tipoServicio;
      if (item && tipoServicio) {
        // Capitalizar primera letra para mostrar correctamente
        const servicio =
          tipoServicio.charAt(0).toUpperCase() + tipoServicio.slice(1).replace('-', ' ');
        services[servicio] = (services[servicio] || 0) + 1;
        console.log(`✅ Tipo de servicio encontrado: ${servicio}, total: ${services[servicio]}`);
      } else {
        console.log(`⚠️ Item ${index} no tiene tipoServicio válido:`, item);
      }
    });

    const result = {
      labels: Object.keys(services),
      values: Object.values(services)
    };

    console.log('📊 Resultado del gráfico de pastel (Tipos de Servicio reales):', result);
    return result;
  }

  // Función para diagnosticar datos de servicios en la gráfica de pastel
  diagnosticarGraficaPastel() {
    console.log('🔍 === DIAGNÓSTICO GRÁFICA DE PASTEL ===');

    // 1. Verificar datos en localStorage
    const logisticaData = JSON.parse(localStorage.getItem('erp_logistica') || '[]');
    console.log('📊 Datos en erp_logistica:', logisticaData.length);

    // 2. Mostrar tipos de servicio únicos
    const tiposServicio = new Set();
    logisticaData.forEach((item, index) => {
      const tipoServicio = item.tipoServicio || item.servicio;
      if (tipoServicio) {
        tiposServicio.add(tipoServicio);
        console.log(`📋 Registro ${index}: tipoServicio = "${tipoServicio}"`);
      } else {
        console.log(`⚠️ Registro ${index}: SIN tipoServicio`, item);
      }
    });

    console.log('📊 Tipos de servicio únicos encontrados:', Array.from(tiposServicio));

    // 3. Verificar datos cargados en el sistema
    if (this.currentData) {
      const logisticaCargada = this.currentData.filter(item => item.departamento === 'logistica');
      console.log('📊 Datos de logística cargados en el sistema:', logisticaCargada.length);

      const serviciosCargados = new Set();
      logisticaCargada.forEach((item, index) => {
        const { servicio } = item;
        if (servicio) {
          serviciosCargados.add(servicio);
          console.log(`📋 Item cargado ${index}: servicio = "${servicio}"`);
        } else {
          console.log(`⚠️ Item cargado ${index}: SIN servicio`, item);
        }
      });

      console.log('📊 Servicios únicos en datos cargados:', Array.from(serviciosCargados));
    }

    // 4. Probar la función groupDataByService
    const resultado = this.groupDataByService(this.currentData || []);
    console.log('📊 Resultado de groupDataByService:', resultado);

    console.log('🔍 === FIN DIAGNÓSTICO ===');
  }

  // Función para calcular métricas comparativas
  async calcularMetricasComparativas() {
    const contenedor = document.getElementById('metricasComparativas');
    if (!contenedor) {
      return;
    }

    // Obtener el mes del filtro seleccionado
    const filtro = this.obtenerMesFiltro();
    const mesActual = filtro.mes; // Ya está en formato 0-11
    const añoActual = filtro.año;
    const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
    const añoAnterior = mesActual === 0 ? añoActual - 1 : añoActual;

    // Nombres de meses en español
    const nombresMeses = [
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
    const nombreMesActual = nombresMeses[mesActual];
    const nombreMesAnterior = nombresMeses[mesAnterior];

    console.log('📅 Métricas comparativas usando filtro:', {
      mesActual: nombreMesActual,
      añoActual,
      mesAnterior: nombreMesAnterior,
      añoAnterior
    });

    // Función auxiliar para formatear moneda
    const formatearMoneda = valor =>
      new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);

    // Función auxiliar para calcular porcentaje de cambio
    const calcularCambio = (actual, anterior) => {
      if (anterior === 0) {
        return actual > 0 ? 100 : 0;
      }
      return ((actual - anterior) / anterior) * 100;
    };

    // 1. Dinero (Ingresos y Egresos de Tesorería)
    let ingresosActual = 0,
      ingresosAnterior = 0;
    let egresosActual = 0,
      egresosAnterior = 0;
    try {
      let movimientos = [];

      // Intentar cargar desde Firebase primero
      if (window.firebaseRepos && window.firebaseRepos.tesoreria) {
        try {
          const repoTesoreria = window.firebaseRepos.tesoreria;
          if (repoTesoreria.db && repoTesoreria.tenantId) {
            movimientos = await repoTesoreria.getAllMovimientos();
            console.log('📊 Movimientos de Tesorería cargados desde Firebase:', movimientos.length);
          }
        } catch (error) {
          reportesLog.warn(
            '⚠️ Error cargando movimientos desde Firebase, usando localStorage:',
            error
          );
        }
      }

      // Fallback a localStorage si Firebase falla o no hay datos
      if (!movimientos || movimientos.length === 0) {
        movimientos = JSON.parse(localStorage.getItem('erp_tesoreria_movimientos') || '[]');
        console.log('📊 Movimientos de Tesorería cargados desde localStorage:', movimientos.length);
      }

      console.log('📅 Fechas de referencia:', {
        mesActual: mesActual + 1, // +1 porque getMonth() devuelve 0-11
        añoActual,
        mesAnterior: mesAnterior + 1,
        añoAnterior
      });

      movimientos.forEach(mov => {
        // Parsear fecha correctamente
        let fecha = null;
        const fechaStr = mov.fecha || mov.fechaCreacion;

        if (fechaStr) {
          // Si es string en formato YYYY-MM-DD, parsearlo directamente sin conversión de zona horaria
          if (typeof fechaStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
            const [year, month, day] = fechaStr.split('T')[0].split('-');
            fecha = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
          }
          // Si es string en formato DD/MM/YYYY, parsearlo correctamente
          else if (typeof fechaStr === 'string' && fechaStr.includes('/')) {
            const partes = fechaStr.split('/');
            if (partes.length === 3) {
              // Formato DD/MM/YYYY
              const dia = parseInt(partes[0], 10);
              const mes = parseInt(partes[1], 10) - 1; // getMonth() usa 0-11
              const año = parseInt(partes[2], 10);
              fecha = new Date(año, mes, dia);
            } else {
              fecha = new Date(fechaStr);
            }
          } else {
            fecha = new Date(fechaStr);
          }
        }

        if (!fecha || isNaN(fecha.getTime())) {
          reportesLog.warn('⚠️ Fecha inválida en movimiento:', mov.id, fechaStr);
          return; // Fecha inválida
        }

        const mes = fecha.getMonth();
        const año = fecha.getFullYear();
        const monto = parseFloat(mov.monto || 0);
        if (monto === 0) {
          return;
        } // Ignorar movimientos sin monto

        // Verificar tipo de movimiento (puede ser 'ingreso', 'Ingreso', 'egreso', 'Egreso', o derivado de 'tipo')
        const tipo = (mov.tipo || mov.tipoMovimiento || '').toLowerCase();
        const origen = (mov.origen || mov.proviene || '').toUpperCase();

        // Determinar si es ingreso o egreso
        let esIngreso = false;
        let esEgreso = false;

        if (tipo === 'ingreso' || tipo.includes('ingreso')) {
          esIngreso = true;
        } else if (tipo === 'egreso' || tipo.includes('egreso')) {
          esEgreso = true;
        } else if (tipo === 'movimiento') {
          // Si es movimiento, determinar según origen
          if (origen === 'CXC') {
            esIngreso = true;
          } else if (origen === 'CXP') {
            esEgreso = true;
          } else if (origen === 'TESORERIA' || origen === 'Tesoreria') {
            // Movimientos manuales de Tesorería: positivo = ingreso, negativo = egreso
            if (monto > 0) {
              esIngreso = true;
            } else {
              esEgreso = true;
            }
          }
        } else if (!tipo || tipo === '') {
          // Si no hay tipo, determinar según origen
          if (origen === 'CXC') {
            esIngreso = true;
          } else if (origen === 'CXP') {
            esEgreso = true;
          }
        }

        // Debug para el movimiento específico
        const esMesActual = mes === mesActual && año === añoActual;
        const esMesAnterior = mes === mesAnterior && año === añoAnterior;

        if (mov.id === '1764568452727' || mov.id === 1764568452727) {
          console.log('🔍 Debug movimiento ingresos:', {
            id: mov.id,
            fechaStr: fechaStr,
            fechaParsed: fecha.toISOString(),
            mes: mes + 1,
            año,
            esMesActual,
            esMesAnterior,
            mesActual: mesActual + 1,
            añoActual,
            mesAnterior: mesAnterior + 1,
            añoAnterior,
            esIngreso,
            monto
          });
        }

        // Sumar montos
        if (esIngreso) {
          if (esMesActual) {
            ingresosActual += Math.abs(monto);
          }
          if (esMesAnterior) {
            ingresosAnterior += Math.abs(monto);
          }
        } else if (esEgreso) {
          if (esMesActual) {
            egresosActual += Math.abs(monto);
          }
          if (esMesAnterior) {
            egresosAnterior += Math.abs(monto);
          }
        }
      });

      console.log('💰 Ingresos/Egresos calculados:', {
        ingresosActual,
        ingresosAnterior,
        egresosActual,
        egresosAnterior
      });
    } catch (error) {
      console.error('Error calculando dinero:', error);
    }

    // 2. Viajes (Tráfico)
    let viajesActual = 0,
      viajesAnterior = 0;
    try {
      let traficoData = [];

      // Intentar cargar desde Firebase primero
      if (window.firebaseRepos && window.firebaseRepos.trafico) {
        try {
          const repoTrafico = window.firebaseRepos.trafico;
          if (repoTrafico.db && repoTrafico.tenantId) {
            traficoData = await repoTrafico.getAll();
            console.log('📊 Viajes cargados desde Firebase:', traficoData.length);
          }
        } catch (error) {
          reportesLog.warn('⚠️ Error cargando viajes desde Firebase, usando localStorage:', error);
        }
      }

      // Fallback a localStorage si Firebase falla o no hay datos
      if (!traficoData || traficoData.length === 0) {
        // Intentar múltiples ubicaciones en localStorage
        const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
        if (sharedData.trafico && Array.isArray(sharedData.trafico)) {
          traficoData = sharedData.trafico;
        } else if (sharedData.trafico && typeof sharedData.trafico === 'object') {
          traficoData = Object.values(sharedData.trafico);
        } else {
          traficoData = JSON.parse(localStorage.getItem('erp_trafico_data') || '[]');
        }
        console.log('📊 Viajes cargados desde localStorage:', traficoData.length);
      }

      traficoData.forEach(viaje => {
        // Parsear fecha correctamente (similar a como se hace en otras secciones)
        let fecha = null;
        const fechaStr =
          viaje.fecha || viaje.fechaEnvio || viaje.fechaCreacion || viaje.fechaSalida;

        if (fechaStr) {
          // Si es string en formato YYYY-MM-DD, parsearlo directamente sin conversión de zona horaria
          if (typeof fechaStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
            const [year, month, day] = fechaStr.split('T')[0].split('-');
            fecha = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
          }
          // Si es string en formato DD/MM/YYYY, parsearlo correctamente
          else if (typeof fechaStr === 'string' && fechaStr.includes('/')) {
            const partes = fechaStr.split('/');
            if (partes.length === 3) {
              const dia = parseInt(partes[0], 10);
              const mes = parseInt(partes[1], 10) - 1;
              const año = parseInt(partes[2], 10);
              fecha = new Date(año, mes, dia);
            } else {
              fecha = new Date(fechaStr);
            }
          } else {
            fecha = new Date(fechaStr);
          }
        }

        if (!fecha || isNaN(fecha.getTime())) {
          return;
        } // Fecha inválida

        const mes = fecha.getMonth();
        const año = fecha.getFullYear();
        if (mes === mesActual && año === añoActual) {
          viajesActual++;
        }
        if (mes === mesAnterior && año === añoAnterior) {
          viajesAnterior++;
        }
      });

      console.log('🚛 Viajes calculados:', { viajesActual, viajesAnterior });
    } catch (error) {
      console.error('Error calculando viajes:', error);
    }

    // 3. Mantenimiento
    let mantenimientoActual = 0,
      mantenimientoAnterior = 0;
    try {
      const mantenimientoData = JSON.parse(localStorage.getItem('erp_mantenimientos') || '[]');
      mantenimientoData.forEach(mantenimiento => {
        // Parsear fecha sin problemas de zona horaria
        let fecha = null;
        const fechaStr =
          mantenimiento.fechaServicio || mantenimiento.fecha || mantenimiento.fechaCreacion;

        if (fechaStr) {
          // Si es string en formato YYYY-MM-DD, parsearlo directamente sin conversión de zona horaria
          if (typeof fechaStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
            const [year, month, day] = fechaStr.split('T')[0].split('-');
            fecha = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
          }
          // Si es string en formato DD/MM/YYYY, parsearlo correctamente
          else if (typeof fechaStr === 'string' && fechaStr.includes('/')) {
            const partes = fechaStr.split('/');
            if (partes.length === 3) {
              const dia = parseInt(partes[0], 10);
              const mes = parseInt(partes[1], 10) - 1;
              const año = parseInt(partes[2], 10);
              fecha = new Date(año, mes, dia);
            } else {
              fecha = new Date(fechaStr);
            }
          } else {
            fecha = new Date(fechaStr);
          }
        }

        if (!fecha || isNaN(fecha.getTime())) {
          return;
        } // Fecha inválida

        const mes = fecha.getMonth();
        const año = fecha.getFullYear();
        if (mes === mesActual && año === añoActual) {
          mantenimientoActual++;
        }
        if (mes === mesAnterior && año === añoAnterior) {
          mantenimientoAnterior++;
        }
      });
    } catch (error) {
      console.error('Error calculando mantenimiento:', error);
    }

    // 4. CXC (Monto Pendiente de Cobro)
    let cxcActual = 0,
      cxcAnterior = 0;
    try {
      let cxcData = [];

      // Intentar cargar desde Firebase primero
      if (window.firebaseRepos && window.firebaseRepos.cxc) {
        try {
          const repoCXC = window.firebaseRepos.cxc;
          if (repoCXC.db && repoCXC.tenantId) {
            cxcData = await repoCXC.getAllFacturas();
            console.log('📊 Facturas CXC cargadas desde Firebase:', cxcData.length);
          }
        } catch (error) {
          reportesLog.warn('⚠️ Error cargando CXC desde Firebase, usando localStorage:', error);
        }
      }

      // Fallback a localStorage si Firebase falla o no hay datos
      if (!cxcData || cxcData.length === 0) {
        cxcData = JSON.parse(localStorage.getItem('erp_cxc_data') || '[]');
        console.log('📊 Facturas CXC cargadas desde localStorage:', cxcData.length);
      }

      cxcData.forEach(factura => {
        // Parsear fecha de emisión sin problemas de zona horaria
        let fechaEmision = null;
        const fechaStr = factura.fechaEmision || factura.fecha || factura.fechaCreacion;

        if (fechaStr) {
          // Si es string en formato YYYY-MM-DD, parsearlo directamente sin conversión de zona horaria
          if (typeof fechaStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
            const [year, month, day] = fechaStr.split('T')[0].split('-');
            fechaEmision = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
          }
          // Si es string en formato DD/MM/YYYY, parsearlo correctamente
          else if (typeof fechaStr === 'string' && fechaStr.includes('/')) {
            const partes = fechaStr.split('/');
            if (partes.length === 3) {
              const dia = parseInt(partes[0], 10);
              const mes = parseInt(partes[1], 10) - 1;
              const año = parseInt(partes[2], 10);
              fechaEmision = new Date(año, mes, dia);
            } else {
              fechaEmision = new Date(fechaStr);
            }
          } else {
            fechaEmision = new Date(fechaStr);
          }
        }

        if (!fechaEmision || isNaN(fechaEmision.getTime())) {
          return;
        } // Fecha inválida

        const mesEmision = fechaEmision.getMonth();
        const añoEmision = fechaEmision.getFullYear();

        // Parsear fecha de pago si existe
        let fechaPago = null;
        const fechaPagoStr = factura.fechaPago;

        if (fechaPagoStr) {
          if (typeof fechaPagoStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaPagoStr)) {
            const [year, month, day] = fechaPagoStr.split('T')[0].split('-');
            fechaPago = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
          } else if (typeof fechaPagoStr === 'string' && fechaPagoStr.includes('/')) {
            const partes = fechaPagoStr.split('/');
            if (partes.length === 3) {
              const dia = parseInt(partes[0], 10);
              const mes = parseInt(partes[1], 10) - 1;
              const año = parseInt(partes[2], 10);
              fechaPago = new Date(año, mes, dia);
            } else {
              fechaPago = new Date(fechaPagoStr);
            }
          } else {
            fechaPago = new Date(fechaPagoStr);
          }
        }

        const monto = parseFloat(factura.monto || 0);

        // Lógica: Si la factura se emitió en el mes, cuenta como pendiente en ese mes
        // SOLO si NO se pagó dentro del mismo mes de emisión
        // Esto muestra "lo que faltó por cobrar en el mes" (pagado después o aún pendiente)
        const esMesActual = mesEmision === mesActual && añoEmision === añoActual;
        const esMesAnterior = mesEmision === mesAnterior && añoEmision === añoAnterior;

        // Verificar si se pagó en el mismo mes de emisión
        let sePagoEnMesEmision = false;
        if (fechaPago && !isNaN(fechaPago.getTime())) {
          const mesPago = fechaPago.getMonth();
          const añoPago = fechaPago.getFullYear();
          // Verificar si se pagó en el mismo mes de emisión
          if (esMesActual && mesPago === mesActual && añoPago === añoActual) {
            sePagoEnMesEmision = true;
          } else if (esMesAnterior && mesPago === mesAnterior && añoPago === añoAnterior) {
            sePagoEnMesEmision = true;
          }
        }

        if (esMesActual) {
          // Solo cuenta si NO se pagó en el mismo mes de emisión
          if (!sePagoEnMesEmision) {
            cxcActual += monto;
          }
        }

        if (esMesAnterior) {
          // Solo cuenta si NO se pagó en el mismo mes de emisión
          if (!sePagoEnMesEmision) {
            cxcAnterior += monto;
          }
        }
      });

      console.log('💵 CXC (pendiente) calculado:', { cxcActual, cxcAnterior });
    } catch (error) {
      console.error('Error calculando CXC:', error);
    }

    // 5. CXP (Monto Pendiente de Pago)
    let cxpActual = 0,
      cxpAnterior = 0;
    try {
      let cxpData = [];

      // Intentar cargar desde Firebase primero
      if (window.firebaseRepos && window.firebaseRepos.cxp) {
        try {
          const repoCXP = window.firebaseRepos.cxp;
          if (repoCXP.db && repoCXP.tenantId) {
            const allItems = await repoCXP.getAll();
            cxpData = allItems.filter(item => item.tipo === 'factura');
            console.log('📊 Facturas CXP cargadas desde Firebase:', cxpData.length);
          }
        } catch (error) {
          reportesLog.warn('⚠️ Error cargando CXP desde Firebase, usando localStorage:', error);
        }
      }

      // Fallback a localStorage si Firebase falla o no hay datos
      if (!cxpData || cxpData.length === 0) {
        cxpData = JSON.parse(localStorage.getItem('erp_cxp_facturas') || '[]');
        console.log('📊 Facturas CXP cargadas desde localStorage:', cxpData.length);
      }

      cxpData.forEach(factura => {
        // Parsear fecha de emisión sin problemas de zona horaria
        let fechaEmision = null;
        const fechaStr = factura.fechaEmision || factura.fecha || factura.fechaCreacion;

        if (fechaStr) {
          // Si es string en formato YYYY-MM-DD, parsearlo directamente sin conversión de zona horaria
          if (typeof fechaStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
            const [year, month, day] = fechaStr.split('T')[0].split('-');
            fechaEmision = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
          }
          // Si es string en formato DD/MM/YYYY, parsearlo correctamente
          else if (typeof fechaStr === 'string' && fechaStr.includes('/')) {
            const partes = fechaStr.split('/');
            if (partes.length === 3) {
              const dia = parseInt(partes[0], 10);
              const mes = parseInt(partes[1], 10) - 1;
              const año = parseInt(partes[2], 10);
              fechaEmision = new Date(año, mes, dia);
            } else {
              fechaEmision = new Date(fechaStr);
            }
          } else {
            fechaEmision = new Date(fechaStr);
          }
        }

        if (!fechaEmision || isNaN(fechaEmision.getTime())) {
          return;
        } // Fecha inválida

        const mesEmision = fechaEmision.getMonth();
        const añoEmision = fechaEmision.getFullYear();

        // Parsear fecha de pago si existe (puede estar en factura.fechaPago o en pagos)
        let _fechaPago = null;
        const fechaPagoStr =
          factura.fechaPago ||
          (factura.pagos && factura.pagos.length > 0
            ? factura.pagos[factura.pagos.length - 1].fecha
            : null);

        if (fechaPagoStr) {
          if (typeof fechaPagoStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaPagoStr)) {
            const [year, month, day] = fechaPagoStr.split('T')[0].split('-');
            _fechaPago = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
          } else if (typeof fechaPagoStr === 'string' && fechaPagoStr.includes('/')) {
            const partes = fechaPagoStr.split('/');
            if (partes.length === 3) {
              const dia = parseInt(partes[0], 10);
              const mes = parseInt(partes[1], 10) - 1;
              const año = parseInt(partes[2], 10);
              _fechaPago = new Date(año, mes, dia);
            } else {
              _fechaPago = new Date(fechaPagoStr);
            }
          } else {
            _fechaPago = new Date(fechaPagoStr);
          }
        }

        // Usar montoPendiente en lugar de monto total, solo mostrar facturas que aún no se han pagado
        const montoPendiente = parseFloat(
          factura.montoPendiente !== undefined ? factura.montoPendiente : factura.monto || 0
        );

        // Verificar el estado de la factura - solo contar facturas que NO están completamente pagadas
        const estado = factura.estado || '';
        const estaPagada = estado === 'pagada' || montoPendiente <= 0;

        // Lógica: Si la factura se emitió en el mes, cuenta como pendiente en ese mes
        // SOLO si NO está completamente pagada y tiene monto pendiente > 0
        // Esto muestra "lo que aún falta por pagar" (facturas pendientes o parcialmente pagadas)
        const esMesActual = mesEmision === mesActual && añoEmision === añoActual;
        const esMesAnterior = mesEmision === mesAnterior && añoEmision === añoAnterior;

        if (esMesActual && !estaPagada && montoPendiente > 0) {
          // Solo contar si tiene monto pendiente y no está completamente pagada
          cxpActual += montoPendiente;
        }

        if (esMesAnterior && !estaPagada && montoPendiente > 0) {
          // Solo contar si tiene monto pendiente y no está completamente pagada
          cxpAnterior += montoPendiente;
        }
      });

      console.log('💳 CXP (pendiente) calculado:', { cxpActual, cxpAnterior });
    } catch (error) {
      console.error('Error calculando CXP:', error);
    }

    // Generar HTML
    const html = `
            <div class="col-md-4 mb-3">
                <div class="card border-primary">
                    <div class="card-body">
                        <h6 class="card-title text-primary"><i class="fas fa-money-bill-wave"></i> Ingresos (${nombreMesActual})</h6>
                        <h4 class="mb-2">${formatearMoneda(ingresosActual)}</h4>
                        <small class="text-muted">Mes anterior (${nombreMesAnterior}): ${formatearMoneda(ingresosAnterior)}</small>
                        <div class="mt-2">
                            <span class="badge bg-${calcularCambio(ingresosActual, ingresosAnterior) >= 0 ? 'success' : 'danger'}">
                                ${calcularCambio(ingresosActual, ingresosAnterior).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="card border-danger">
                    <div class="card-body">
                        <h6 class="card-title text-danger"><i class="fas fa-arrow-down"></i> Egresos (${nombreMesActual})</h6>
                        <h4 class="mb-2">${formatearMoneda(egresosActual)}</h4>
                        <small class="text-muted">Mes anterior (${nombreMesAnterior}): ${formatearMoneda(egresosAnterior)}</small>
                        <div class="mt-2">
                            <span class="badge bg-${calcularCambio(egresosActual, egresosAnterior) <= 0 ? 'success' : 'danger'}">
                                ${calcularCambio(egresosActual, egresosAnterior).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="card border-info">
                    <div class="card-body">
                        <h6 class="card-title text-info"><i class="fas fa-route"></i> Viajes (${nombreMesActual})</h6>
                        <h4 class="mb-2">${viajesActual}</h4>
                        <small class="text-muted">Mes anterior (${nombreMesAnterior}): ${viajesAnterior}</small>
                        <div class="mt-2">
                            <span class="badge bg-${calcularCambio(viajesActual, viajesAnterior) >= 0 ? 'success' : 'danger'}">
                                ${calcularCambio(viajesActual, viajesAnterior).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="card border-warning">
                    <div class="card-body">
                        <h6 class="card-title text-warning"><i class="fas fa-screwdriver-wrench"></i> Mantenimiento (${nombreMesActual})</h6>
                        <h4 class="mb-2">${mantenimientoActual}</h4>
                        <small class="text-muted">Mes anterior (${nombreMesAnterior}): ${mantenimientoAnterior}</small>
                        <div class="mt-2">
                            <span class="badge bg-${calcularCambio(mantenimientoActual, mantenimientoAnterior) >= 0 ? 'success' : 'danger'}">
                                ${calcularCambio(mantenimientoActual, mantenimientoAnterior).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="card border-success">
                    <div class="card-body">
                        <h6 class="card-title text-success"><i class="fas fa-hand-holding-usd"></i> CXC (${nombreMesActual})</h6>
                        <h4 class="mb-2">${formatearMoneda(cxcActual)}</h4>
                        <small class="text-muted">Mes anterior (${nombreMesAnterior}): ${formatearMoneda(cxcAnterior)}</small>
                        <div class="mt-2">
                            <span class="badge bg-${calcularCambio(cxcActual, cxcAnterior) >= 0 ? 'success' : 'danger'}">
                                ${calcularCambio(cxcActual, cxcAnterior).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="card border-secondary">
                    <div class="card-body">
                        <h6 class="card-title text-secondary"><i class="fas fa-credit-card"></i> CXP (${nombreMesActual})</h6>
                        <h4 class="mb-2">${formatearMoneda(cxpActual)}</h4>
                        <small class="text-muted">Mes anterior (${nombreMesAnterior}): ${formatearMoneda(cxpAnterior)}</small>
                        <div class="mt-2">
                            <span class="badge bg-${calcularCambio(cxpActual, cxpAnterior) <= 0 ? 'success' : 'danger'}">
                                ${calcularCambio(cxpActual, cxpAnterior).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;

    contenedor.innerHTML = html;
  }

  // Función para calcular Top 10
  async calcularTop10() {
    // Top 10 Económicos con Más viajes (por cantidad de viajes)
    const top10Economicos = document.getElementById('top10Economicos');
    if (top10Economicos) {
      try {
        let traficoData = [];

        // Intentar cargar desde Firebase primero
        if (window.firebaseRepos && window.firebaseRepos.trafico) {
          try {
            traficoData = await window.firebaseRepos.trafico.getAll();
            console.log(
              '📊 Viajes para Top 10 Económicos cargados desde Firebase:',
              traficoData.length
            );
          } catch (error) {
            reportesLog.warn(
              '⚠️ Error cargando viajes desde Firebase, usando localStorage:',
              error
            );
          }
        }

        // Fallback a localStorage si Firebase falla o no hay datos
        if (!traficoData || traficoData.length === 0) {
          // Intentar múltiples ubicaciones en localStorage
          const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
          if (sharedData.trafico && Array.isArray(sharedData.trafico)) {
            traficoData = sharedData.trafico;
          } else if (sharedData.trafico && typeof sharedData.trafico === 'object') {
            traficoData = Object.values(sharedData.trafico);
          } else {
            traficoData = JSON.parse(localStorage.getItem('erp_trafico_data') || '[]');
          }
          console.log(
            '📊 Viajes para Top 10 Económicos cargados desde localStorage:',
            traficoData.length
          );
        }

        // Filtrar viajes por el mes seleccionado
        const traficoDataFiltrado = traficoData.filter(viaje => {
          const fechaViaje =
            viaje.fechaEnvio || viaje.fecha || viaje.fechaCreacion || viaje.fechaSalida;
          return this.perteneceAlMesFiltro(fechaViaje);
        });
        console.log(
          `📊 Viajes filtrados por mes para Top 10 Económicos: ${traficoDataFiltrado.length} de ${traficoData.length} totales`
        );

        const viajesPorEconomico = {};
        traficoDataFiltrado.forEach(viaje => {
          // Buscar económico en múltiples campos posibles
          const economico =
            viaje.economico ||
            viaje.economicoTracto ||
            viaje.tractocamion ||
            viaje.unidad ||
            viaje.economicoUnidad ||
            'N/A';
          if (economico && economico !== 'N/A') {
            viajesPorEconomico[economico] = (viajesPorEconomico[economico] || 0) + 1;
          }
        });

        const top10 = Object.entries(viajesPorEconomico)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        console.log('🚛 Top 10 Económicos calculado:', top10);

        top10Economicos.innerHTML =
          top10.length > 0
            ? `
                    <ol class="list-group list-group-numbered">
                        ${top10
    .map(
      ([economico, cantidad], _index) => `
                            <li class="list-group-item d-flex justify-content-between align-items-start">
                                <div class="ms-2 me-auto">
                                    <div class="fw-bold">${economico}</div>
                                </div>
                                <span class="badge bg-primary rounded-pill">${cantidad} viajes</span>
                            </li>
                        `
    )
    .join('')}
                    </ol>
                `
            : '<p class="text-muted text-center">No hay datos disponibles</p>';
      } catch (error) {
        console.error('Error calculando Top 10 Económicos:', error);
        top10Economicos.innerHTML = '<p class="text-muted text-center">Error al cargar datos</p>';
      }
    }

    // Top 10 Clientes por Facturación
    const top10Clientes = document.getElementById('top10Clientes');
    if (top10Clientes) {
      try {
        let cxcData = [];

        // Intentar cargar desde Firebase primero
        if (window.firebaseRepos && window.firebaseRepos.cxc) {
          try {
            cxcData = await window.firebaseRepos.cxc.getAllFacturas();
            console.log(
              '📊 Facturas CXC para Top 10 Clientes cargadas desde Firebase:',
              cxcData.length
            );
          } catch (error) {
            reportesLog.warn('⚠️ Error cargando CXC desde Firebase, usando localStorage:', error);
          }
        }

        // Fallback a localStorage si Firebase falla o no hay datos
        if (!cxcData || cxcData.length === 0) {
          cxcData = JSON.parse(localStorage.getItem('erp_cxc_data') || '[]');
          console.log(
            '📊 Facturas CXC para Top 10 Clientes cargadas desde localStorage:',
            cxcData.length
          );
        }

        // Filtrar facturas por el mes seleccionado
        const cxcDataFiltrado = cxcData.filter(factura => {
          const fechaFactura = factura.fechaEmision || factura.fecha || factura.fechaCreacion;
          return this.perteneceAlMesFiltro(fechaFactura);
        });
        console.log(
          `📊 Facturas filtradas por mes para Top 10 Clientes: ${cxcDataFiltrado.length} de ${cxcData.length} totales`
        );

        const facturacionPorCliente = {};
        cxcDataFiltrado.forEach(factura => {
          const cliente = factura.cliente || 'N/A';
          const monto = parseFloat(factura.monto || 0);
          facturacionPorCliente[cliente] = (facturacionPorCliente[cliente] || 0) + monto;
        });
        const top10 = Object.entries(facturacionPorCliente)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        top10Clientes.innerHTML =
          top10.length > 0
            ? `
                    <ol class="list-group list-group-numbered">
                        ${top10
    .map(
      ([cliente, monto], _index) => `
                            <li class="list-group-item d-flex justify-content-between align-items-start">
                                <div class="ms-2 me-auto">
                                    <div class="fw-bold">${cliente}</div>
                                </div>
                                <span class="badge bg-success rounded-pill">$${monto.toLocaleString('es-MX')}</span>
                            </li>
                        `
    )
    .join('')}
                    </ol>
                `
            : '<p class="text-muted text-center">No hay datos disponibles</p>';
      } catch (error) {
        console.error('Error calculando Top 10 Clientes:', error);
        top10Clientes.innerHTML = '<p class="text-muted text-center">Error al cargar datos</p>';
      }
    }

    // Top 10 Proveedores por Pagos
    const top10Proveedores = document.getElementById('top10Proveedores');
    if (top10Proveedores) {
      try {
        let cxpData = [];

        // Intentar cargar desde Firebase primero
        if (window.firebaseRepos && window.firebaseRepos.cxp) {
          try {
            const allItems = await window.firebaseRepos.cxp.getAll();
            cxpData = allItems.filter(item => item.tipo === 'factura');
            console.log(
              '📊 Facturas CXP para Top 10 Proveedores cargadas desde Firebase:',
              cxpData.length
            );
          } catch (error) {
            reportesLog.warn('⚠️ Error cargando CXP desde Firebase, usando localStorage:', error);
          }
        }

        // Fallback a localStorage si Firebase falla o no hay datos
        if (!cxpData || cxpData.length === 0) {
          cxpData = JSON.parse(localStorage.getItem('erp_cxp_facturas') || '[]');
          console.log(
            '📊 Facturas CXP para Top 10 Proveedores cargadas desde localStorage:',
            cxpData.length
          );
        }

        // Filtrar facturas por el mes seleccionado
        const cxpDataFiltrado = cxpData.filter(factura => {
          const fechaFactura = factura.fechaEmision || factura.fecha || factura.fechaCreacion;
          return this.perteneceAlMesFiltro(fechaFactura);
        });
        console.log(
          `📊 Facturas filtradas por mes para Top 10 Proveedores: ${cxpDataFiltrado.length} de ${cxpData.length} totales`
        );

        const pagosPorProveedor = {};
        cxpDataFiltrado.forEach(factura => {
          const proveedor = factura.proveedor || 'N/A';
          const monto = parseFloat(factura.monto || 0);
          pagosPorProveedor[proveedor] = (pagosPorProveedor[proveedor] || 0) + monto;
        });
        const top10 = Object.entries(pagosPorProveedor)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        top10Proveedores.innerHTML =
          top10.length > 0
            ? `
                    <ol class="list-group list-group-numbered">
                        ${top10
    .map(
      ([proveedor, monto], _index) => `
                            <li class="list-group-item d-flex justify-content-between align-items-start">
                                <div class="ms-2 me-auto">
                                    <div class="fw-bold">${proveedor}</div>
                                </div>
                                <span class="badge bg-warning rounded-pill">$${monto.toLocaleString('es-MX')}</span>
                            </li>
                        `
    )
    .join('')}
                    </ol>
                `
            : '<p class="text-muted text-center">No hay datos disponibles</p>';
      } catch (error) {
        console.error('Error calculando Top 10 Proveedores:', error);
        top10Proveedores.innerHTML = '<p class="text-muted text-center">Error al cargar datos</p>';
      }
    }

    // Top 10 Operadores con más viajes
    const top10EconomicosViajes = document.getElementById('top10EconomicosViajes');
    if (top10EconomicosViajes) {
      try {
        let traficoData = [];

        // Intentar cargar desde Firebase primero
        if (window.firebaseRepos && window.firebaseRepos.trafico) {
          try {
            traficoData = await window.firebaseRepos.trafico.getAll();
            console.log(
              '📊 Viajes para Top 10 Operadores cargados desde Firebase:',
              traficoData.length
            );
          } catch (error) {
            reportesLog.warn(
              '⚠️ Error cargando viajes desde Firebase, usando localStorage:',
              error
            );
          }
        }

        // Fallback a localStorage si Firebase falla o no hay datos
        if (!traficoData || traficoData.length === 0) {
          // Intentar múltiples ubicaciones en localStorage
          const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
          if (sharedData.trafico && Array.isArray(sharedData.trafico)) {
            traficoData = sharedData.trafico;
          } else if (sharedData.trafico && typeof sharedData.trafico === 'object') {
            traficoData = Object.values(sharedData.trafico);
          } else {
            traficoData = JSON.parse(localStorage.getItem('erp_trafico_data') || '[]');
          }
          console.log(
            '📊 Viajes para Top 10 Operadores cargados desde localStorage:',
            traficoData.length
          );
        }

        // Filtrar viajes por el mes seleccionado
        const traficoDataFiltrado = traficoData.filter(viaje => {
          const fechaViaje =
            viaje.fechaEnvio || viaje.fecha || viaje.fechaCreacion || viaje.fechaSalida;
          return this.perteneceAlMesFiltro(fechaViaje);
        });
        console.log(
          `📊 Viajes filtrados por mes para Top 10 Operadores: ${traficoDataFiltrado.length} de ${traficoData.length} totales`
        );

        // Contar viajes por operador, distinguiendo entre principal y secundario
        const viajesPorOperador = {};
        traficoDataFiltrado.forEach(viaje => {
          // Obtener operador principal
          const operadorPrincipal =
            viaje.operadorPrincipal || viaje.operadorprincipal || viaje.operador || '';
          if (operadorPrincipal && operadorPrincipal !== 'N/A') {
            if (!viajesPorOperador[operadorPrincipal]) {
              viajesPorOperador[operadorPrincipal] = {
                principal: 0,
                secundario: 0,
                total: 0
              };
            }
            viajesPorOperador[operadorPrincipal].principal++;
            viajesPorOperador[operadorPrincipal].total++;
          }

          // Obtener operador secundario si existe
          const operadorSecundario = viaje.operadorSecundario || viaje.operadorsecundario || '';
          if (operadorSecundario && operadorSecundario !== 'N/A') {
            if (!viajesPorOperador[operadorSecundario]) {
              viajesPorOperador[operadorSecundario] = {
                principal: 0,
                secundario: 0,
                total: 0
              };
            }
            viajesPorOperador[operadorSecundario].secundario++;
            viajesPorOperador[operadorSecundario].total++;
          }
        });

        // Convertir a array y ordenar por total de viajes
        const top10 = Object.entries(viajesPorOperador)
          .map(([operador, datos]) => ({
            nombre: operador,
            principal: datos.principal,
            secundario: datos.secundario,
            total: datos.total
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);

        console.log('👤 Top 10 Operadores calculado:', top10);

        top10EconomicosViajes.innerHTML =
          top10.length > 0
            ? `
                    <ol class="list-group list-group-numbered">
                        ${top10
    .map((operador, index) => {
      // Determinar el tipo: Principal, Secundario, o Ambos
      let tipoTexto = '';
      if (operador.principal > 0 && operador.secundario > 0) {
        tipoTexto = 'Principal y Secundario';
      } else if (operador.principal > 0) {
        tipoTexto = 'Principal';
      } else if (operador.secundario > 0) {
        tipoTexto = 'Secundario';
      }

      return `
                            <li class="list-group-item d-flex justify-content-between align-items-start">
                                <div class="ms-2 me-auto">
                                    <div class="fw-bold">${operador.nombre}</div>
                                    <small class="text-muted">
                                        ${operador.total} ${operador.total === 1 ? 'viaje' : 'viajes'} total ${tipoTexto}
                                    </small>
                                </div>
                                <span class="badge bg-info rounded-pill">#${index + 1}</span>
                            </li>
                        `;
    })
    .join('')}
                    </ol>
                `
            : '<p class="text-muted text-center">No hay datos disponibles</p>';
      } catch (error) {
        console.error('Error calculando Top 10 Operadores:', error);
        top10EconomicosViajes.innerHTML =
          '<p class="text-muted text-center">Error al cargar datos</p>';
      }
    }
  }

  updateTable(_data) {
    // Esta función ya no se usa, pero la mantenemos por compatibilidad
    console.log('updateTable llamado pero ya no se usa');
  }

  updatePaginationControls() {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) {
      reportesLog.warn('Elemento paginationContainer no encontrado');
      return;
    }

    if (this.totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    let paginationHTML = `
            <nav aria-label="Paginación de datos filtrados">
                <ul class="pagination justify-content-center">
                    <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                        <button class="page-link" onclick="window.reportesSystem.goToPage(1)" ${this.currentPage === 1 ? 'disabled' : ''}>
                            <i class="fas fa-angle-double-left"></i>
                        </button>
                    </li>
                    <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                        <button class="page-link" onclick="window.reportesSystem.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>
                            <i class="fas fa-angle-left"></i>
                        </button>
                    </li>
        `;

    // Mostrar páginas alrededor de la página actual
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);

    if (startPage > 1) {
      paginationHTML +=
        '<li class="page-item"><button class="page-link" onclick="window.reportesSystem.goToPage(1)">1</button></li>';
      if (startPage > 2) {
        paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <button class="page-link" onclick="window.reportesSystem.goToPage(${i})">${i}</button>
                </li>
            `;
    }

    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) {
        paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
      }
      paginationHTML += `<li class="page-item"><button class="page-link" onclick="window.reportesSystem.goToPage(${this.totalPages})">${this.totalPages}</button></li>`;
    }

    paginationHTML += `
                    <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                        <button class="page-link" onclick="window.reportesSystem.goToPage(${this.currentPage + 1})" ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                            <i class="fas fa-angle-right"></i>
                        </button>
                    </li>
                    <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                        <button class="page-link" onclick="window.reportesSystem.goToPage(${this.totalPages})" ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                            <i class="fas fa-angle-double-right"></i>
                        </button>
                    </li>
                </ul>
            </nav>
            <div class="text-center mt-2">
                <small class="text-muted">
                    Página ${this.currentPage} de ${this.totalPages} 
                    (${this.filteredData.length} registros totales)
                </small>
            </div>
        `;

    paginationContainer.innerHTML = paginationHTML;
  }

  goToPage(page) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateTable(this.filteredData);
    }
  }

  getStateColor(state) {
    const colors = {
      completado: 'success',
      pendiente: 'warning',
      en_proceso: 'info'
    };
    return colors[state] || 'secondary';
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async aplicarFiltros() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const departamento = document.getElementById('departamentoFiltro').value;
    const estado = document.getElementById('estadoFiltro').value;

    this.filters = { fechaInicio, fechaFin, departamento, estado };

    let filteredData = this.currentData;

    // Filtrar por fecha
    if (fechaInicio && fechaFin) {
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.fecha);
        const startDate = new Date(fechaInicio);
        const endDate = new Date(fechaFin);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    // Filtrar por departamento
    if (departamento) {
      filteredData = filteredData.filter(item => item.departamento === departamento);
    }

    // Filtrar por estado
    if (estado) {
      filteredData = filteredData.filter(item => item.estado === estado);
    }

    // Resetear paginación al aplicar filtros
    this.currentPage = 1;

    await this.updateKPIs(filteredData);
    this.updateCharts(filteredData);
    this.updateTable(filteredData);

    this.showNotification(
      `Filtros aplicados: ${filteredData.length} registros encontrados`,
      'success'
    );
  }

  refreshData() {
    this.showNotification('Actualizando datos...', 'info');
    setTimeout(async () => {
      this.loadDashboardData();
      await this.calcularMetricasComparativas();
      await this.calcularTop10();
      this.showNotification('Datos actualizados correctamente', 'success');
    }, 1000);
  }

  exportDashboard() {
    const data = {
      periodo: document.getElementById('currentPeriod').textContent,
      fechaExportacion: new Date().toLocaleString('es-ES'),
      kpis: {
        totalEnvíos: document.getElementById('totalEnvíos').textContent,
        enviósCompletados: document.getElementById('enviósCompletados').textContent,
        enviósPendientes: document.getElementById('enviósPendientes').textContent,
        tasaEficiencia: document.getElementById('tasaEficiencia').textContent
      },
      datos: this.currentData
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
    this.showNotification('Dashboard exportado correctamente', 'success');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }
}

// Funciones globales para reportes específicos
window.generateLogisticsReport = function () {
  // Llamar a la función real de exportación de Logística
  if (typeof window.exportarLogisticaExcel === 'function') {
    window.exportarLogisticaExcel();
  } else {
    window.reportesSystem.showNotification(
      'Función de exportación de Logística no disponible. Por favor, abre la hoja de Logística para cargar las funciones.',
      'warning'
    );
  }
};

window.generateBillingReport = function () {
  // Llamar a la función real de exportación de Facturación
  if (typeof window.exportarFacturacionExcel === 'function') {
    window.exportarFacturacionExcel();
  } else {
    window.reportesSystem.showNotification(
      'Función de exportación de Facturación no disponible. Por favor, abre la hoja de Facturación para cargar las funciones.',
      'warning'
    );
  }
};

window.generateTrafficReport = function () {
  // Llamar a la función real de exportación de Tráfico
  if (typeof window.exportarTraficoExcel === 'function') {
    window.exportarTraficoExcel();
  } else {
    window.reportesSystem.showNotification(
      'Función de exportación de Tráfico no disponible. Por favor, abre la hoja de Tráfico para cargar las funciones.',
      'warning'
    );
  }
};

window.generateOperatorsReport = function () {
  // Llamar a la función real de exportación de Operadores
  if (typeof window.exportarGastosExcel === 'function') {
    window.exportarGastosExcel();
  } else {
    window.reportesSystem.showNotification(
      'Función de exportación de Operadores no disponible. Por favor, abre la hoja de Operadores para cargar las funciones.',
      'warning'
    );
  }
};

window.generateDieselReport = function () {
  // Llamar a la función real de exportación de Diesel
  if (typeof window.exportarDieselExcel === 'function') {
    window.exportarDieselExcel();
  } else {
    window.reportesSystem.showNotification(
      'Función de exportación de Diesel no disponible. Por favor, abre la hoja de Diesel para cargar las funciones.',
      'warning'
    );
  }
};

window.generateMaintenanceReport = function () {
  // Llamar a la función real de exportación de Mantenimiento
  if (typeof window.exportarMantenimientoExcel === 'function') {
    window.exportarMantenimientoExcel();
  } else {
    window.reportesSystem.showNotification(
      'Función de exportación de Mantenimiento no disponible. Por favor, abre la hoja de Mantenimiento para cargar las funciones.',
      'warning'
    );
  }
};

// Función de debug para verificar KPI de CXP en reportes
window.verificarKPICXPReportes = function () {
  console.log('🔍 Verificando KPI de CXP en reportes...');

  try {
    const cxpData = JSON.parse(localStorage.getItem('erp_cxp_facturas') || '[]');
    console.log('📋 Total facturas CXP:', cxpData.length);

    let totalPendiente = 0;
    cxpData.forEach((factura, index) => {
      const montoPendiente =
        factura.montoPendiente !== undefined ? factura.montoPendiente : factura.monto;
      if (montoPendiente > 0) {
        totalPendiente += parseFloat(montoPendiente);
        console.log(`📄 Factura ${index + 1} (${factura.numeroFactura}):`, {
          monto: factura.monto,
          montoPendiente: montoPendiente,
          estado: factura.estado
        });
      }
    });

    console.log('💰 Total pendiente CXP calculado:', totalPendiente);

    // Verificar factura A13213 específicamente
    const facturaA13213 = cxpData.find(f => f.numeroFactura === 'A13213');
    if (facturaA13213) {
      const montoPendienteA13213 =
        facturaA13213.montoPendiente !== undefined
          ? facturaA13213.montoPendiente
          : facturaA13213.monto;
      console.log('🎯 Factura A13213:', {
        monto: facturaA13213.monto,
        montoPendiente: montoPendienteA13213,
        estado: facturaA13213.estado
      });
    }
  } catch (error) {
    console.error('❌ Error verificando KPI CXP:', error);
  }
};

window.generateInventoryReport = function () {
  // Llamar a la función real de exportación de Inventario (Plataformas)
  if (typeof window.exportarPlataformasExcel === 'function') {
    window.exportarPlataformasExcel();
  } else {
    window.reportesSystem.showNotification(
      'Función de exportación de Inventario no disponible. Por favor, abre la hoja de Inventario para cargar las funciones.',
      'warning'
    );
  }
};

window.generateCXCReport = function () {
  // Llamar a la función real de exportación de Cuentas por Cobrar
  if (typeof exportCXCData === 'function') {
    exportCXCData();
  } else {
    window.reportesSystem.showNotification(
      'Función de exportación de Cuentas por Cobrar no disponible. Por favor, abre la hoja de Cuentas por Cobrar para cargar las funciones.',
      'warning'
    );
  }
};

// ===== GRÁFICO DE MOVIMIENTOS DE DINERO =====
let graficoMovimientosDinero = null;
let listenerMovimientosActivo = false;

// Función para inicializar listeners de cambios automáticos en movimientos de tesorería
function inicializarListenerMovimientos() {
  // Evitar múltiples listeners
  if (listenerMovimientosActivo) {
    console.log('🔄 Listener de movimientos ya está activo');
    return;
  }

  // Verificar que estamos en la página de reportes
  if (!window.location.pathname.includes('reportes.html')) {
    return;
  }

  // Verificar que el canvas del gráfico exista
  const canvas = document.getElementById('graficoMovimientosDinero');
  if (!canvas) {
    console.log('⚠️ Canvas de gráfico no encontrado, esperando...');
    // Intentar nuevamente después de un tiempo si la página está cargando
    setTimeout(() => {
      if (document.getElementById('graficoMovimientosDinero')) {
        inicializarListenerMovimientos();
      }
    }, 1000);
    return;
  }

  console.log('🔄 Inicializando listener automático de movimientos de tesorería...');

  // 1. Listener para cambios en localStorage
  window.addEventListener('storage', e => {
    if (e.key === 'erp_tesoreria_movimientos' || e.key === null) {
      console.log('📊 Cambio detectado en localStorage de tesorería, actualizando gráfico...');
      // Pequeño delay para asegurar que los datos estén guardados
      setTimeout(() => {
        if (typeof window.actualizarGraficoMovimientos === 'function') {
          window.actualizarGraficoMovimientos();
        }
      }, 100);
    }
  });

  // 2. Interceptar cambios en localStorage desde la misma pestaña
  // (el evento 'storage' solo funciona entre pestañas, no en la misma)
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, _value) {
    originalSetItem.apply(this, arguments);

    // Si es la clave de movimientos de tesorería, actualizar gráfico
    if (key === 'erp_tesoreria_movimientos' && window.location.pathname.includes('reportes.html')) {
      console.log(
        '📊 Cambio detectado en movimientos de tesorería (misma pestaña), actualizando gráfico...'
      );
      // Pequeño delay para asegurar que los datos estén guardados
      setTimeout(() => {
        if (typeof window.actualizarGraficoMovimientos === 'function') {
          window.actualizarGraficoMovimientos();
        }
      }, 100);
    }
  };

  // 3. Listener para cambios en Firebase usando el método subscribe del repositorio
  if (window.firebaseRepos && window.firebaseRepos.tesoreria) {
    // Esperar a que Firebase esté listo y el repositorio esté inicializado
    const verificarFirebase = setInterval(async () => {
      const tesoreriaRepo = window.firebaseRepos.tesoreria;

      // Verificar que el repositorio esté inicializado correctamente
      if (tesoreriaRepo && tesoreriaRepo.db && tesoreriaRepo.tenantId) {
        clearInterval(verificarFirebase);

        try {
          // Verificar que el método subscribe esté disponible
          if (typeof tesoreriaRepo.subscribe === 'function') {
            console.log(
              '🔄 Configurando listener de Firebase para movimientos de tesorería usando subscribe()...'
            );

            // Usar el método subscribe del repositorio que maneja Firebase v10 correctamente
            const unsubscribe = await tesoreriaRepo.subscribe(movimientos => {
              console.log(
                '📊 Cambio detectado en Firebase de tesorería, actualizando gráfico...',
                movimientos.length,
                'movimientos'
              );
              // Pequeño delay para asegurar que el cache se actualice
              setTimeout(() => {
                if (typeof window.actualizarGraficoMovimientos === 'function') {
                  window.actualizarGraficoMovimientos();
                }
              }, 500);
            });

            // Guardar la función de unsubscribe para poder limpiarla después si es necesario
            window.__tesoreriaUnsubscribe = unsubscribe;

            console.log(
              '✅ Listener de Firebase activado para movimientos de tesorería usando subscribe()'
            );
          } else {
            reportesLog.warn(
              '⚠️ El método subscribe() no está disponible en el repositorio de tesorería'
            );
          }
        } catch (error) {
          reportesLog.warn('⚠️ No se pudo configurar listener de Firebase:', error);
        }
      }
    }, 500);

    // Limpiar intervalo después de 30 segundos si no se conecta
    setTimeout(() => {
      clearInterval(verificarFirebase);
    }, 30000);
  }

  listenerMovimientosActivo = true;
  console.log('✅ Listeners de movimientos de tesorería inicializados correctamente');
}

// Función para cargar datos de tesorería y generar el gráfico
window.actualizarGraficoMovimientos = async function () {
  try {
    // Obtener filtros
    const bancoOrigen = document.getElementById('filtroBancoOrigen')?.value || '';
    const cuentaOrigen = document.getElementById('filtroCuentaOrigen')?.value || '';
    const bancoDestino = document.getElementById('filtroBancoDestino')?.value || '';
    const cuentaDestino = document.getElementById('filtroCuentaDestino')?.value || '';
    const fechaInicio = document.getElementById('fechaInicioMovimientos')?.value || '';
    const fechaFin = document.getElementById('fechaFinMovimientos')?.value || '';

    // Cargar movimientos de tesorería
    let movimientos = [];

    // Intentar cargar desde Firebase primero
    if (window.firebaseRepos && window.firebaseRepos.tesoreria) {
      try {
        const repoTesoreria = window.firebaseRepos.tesoreria;
        if (repoTesoreria.db && repoTesoreria.tenantId) {
          const movimientosFirebase = await repoTesoreria.getAllMovimientos();
          if (movimientosFirebase && movimientosFirebase.length > 0) {
            movimientos = movimientosFirebase;
          }
        }
      } catch (error) {
        reportesLog.warn('⚠️ Error cargando movimientos desde Firebase:', error);
      }
    }

    // Si no hay datos de Firebase, cargar desde localStorage
    if (movimientos.length === 0) {
      try {
        const movimientosStorage = localStorage.getItem('erp_tesoreria_movimientos');
        if (movimientosStorage) {
          movimientos = JSON.parse(movimientosStorage);
        }
      } catch (error) {
        console.error('❌ Error cargando movimientos desde localStorage:', error);
      }
    }

    // Aplicar filtros
    const movimientosFiltrados = movimientos.filter(mov => {
      // Filtro por banco origen
      if (bancoOrigen && mov.bancoOrigen !== bancoOrigen) {
        return false;
      }
      // Filtro por cuenta origen
      if (cuentaOrigen && mov.cuentaOrigen !== cuentaOrigen) {
        return false;
      }
      // Filtro por banco destino
      if (bancoDestino && mov.bancoDestino !== bancoDestino) {
        return false;
      }
      // Filtro por cuenta destino
      if (cuentaDestino && mov.cuentaDestino !== cuentaDestino) {
        return false;
      }
      // Filtro por fecha
      if (fechaInicio || fechaFin) {
        const fechaMov = mov.fecha || mov.fechaPago || mov.fechaCreacion;
        if (!fechaMov) {
          return false; // Si no tiene fecha, excluir del filtro
        }

        // Parsear fecha del movimiento correctamente (sin problemas de zona horaria)
        let fechaMovDate = null;
        if (typeof fechaMov === 'string') {
          // Si es formato YYYY-MM-DD, parsearlo directamente
          if (/^\d{4}-\d{2}-\d{2}/.test(fechaMov)) {
            const fechaStr = fechaMov.split('T')[0]; // Obtener solo YYYY-MM-DD
            const [year, month, day] = fechaStr.split('-');
            fechaMovDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
          } else {
            fechaMovDate = new Date(fechaMov);
          }
        } else {
          fechaMovDate = new Date(fechaMov);
        }

        if (isNaN(fechaMovDate.getTime())) {
          reportesLog.warn('⚠️ Fecha inválida en movimiento:', fechaMov, mov);
          return false;
        }

        // Normalizar fechas a medianoche para comparación
        fechaMovDate.setHours(0, 0, 0, 0);

        // Comparar con fecha inicio
        if (fechaInicio) {
          const [yearIni, monthIni, dayIni] = fechaInicio.split('-');
          const fechaInicioDate = new Date(
            parseInt(yearIni, 10),
            parseInt(monthIni, 10) - 1,
            parseInt(dayIni, 10)
          );
          fechaInicioDate.setHours(0, 0, 0, 0);
          if (fechaMovDate < fechaInicioDate) {
            return false;
          }
        }

        // Comparar con fecha fin
        if (fechaFin) {
          const [yearFin, monthFin, dayFin] = fechaFin.split('-');
          const fechaFinDate = new Date(
            parseInt(yearFin, 10),
            parseInt(monthFin, 10) - 1,
            parseInt(dayFin, 10)
          );
          fechaFinDate.setHours(23, 59, 59, 999); // Incluir todo el día
          if (fechaMovDate > fechaFinDate) {
            return false;
          }
        }
      }
      return true;
    });

    // Agrupar por fecha
    const datosPorFecha = {};

    console.log('📊 Total movimientos filtrados:', movimientosFiltrados.length);

    movimientosFiltrados.forEach(mov => {
      const fecha = mov.fecha || mov.fechaPago || mov.fechaCreacion;
      if (!fecha) {
        reportesLog.warn('⚠️ Movimiento sin fecha:', mov);
        return;
      }

      const fechaStr = fecha.split('T')[0]; // Obtener solo la fecha (YYYY-MM-DD)

      if (!datosPorFecha[fechaStr]) {
        datosPorFecha[fechaStr] = {
          ingresos: 0,
          egresos: 0
        };
      }

      const monto = parseFloat(mov.monto || 0);
      if (monto === 0 || isNaN(monto)) {
        reportesLog.warn('⚠️ Movimiento con monto inválido:', mov);
        return;
      }

      // Detectar ingresos y egresos de manera más robusta
      const tipoMov = String(mov.tipo || '')
        .toLowerCase()
        .trim();
      const origen = String(mov.origen || '').toLowerCase();

      let esIngreso = false;
      let esEgreso = false;

      // Verificar por tipo
      if (tipoMov === 'ingreso' || tipoMov === 'ingresos') {
        esIngreso = true;
      } else if (tipoMov === 'egreso' || tipoMov === 'egresos') {
        esEgreso = true;
      } else {
        // Si no tiene tipo definido, intentar inferirlo del origen
        // CXC generalmente son ingresos, CXP generalmente son egresos
        if (origen === 'cxc') {
          esIngreso = true;
        } else if (origen === 'cxp') {
          esEgreso = true;
        } else {
          // Si no se puede determinar, loguear para debug
          reportesLog.warn('⚠️ Movimiento sin tipo claro:', {
            id: mov.id,
            tipo: mov.tipo,
            origen: mov.origen,
            monto: monto
          });
        }
      }

      if (esIngreso) {
        datosPorFecha[fechaStr].ingresos += monto;
        console.log(
          `✅ Ingreso agregado: $${monto} en ${fechaStr} (tipo: ${tipoMov}, origen: ${origen})`
        );
      } else if (esEgreso) {
        datosPorFecha[fechaStr].egresos += monto;
        console.log(
          `✅ Egreso agregado: $${monto} en ${fechaStr} (tipo: ${tipoMov}, origen: ${origen})`
        );
      }
    });

    // Ordenar fechas
    const fechas = Object.keys(datosPorFecha).sort();

    // Preparar datos para el gráfico
    const datosIngresos = fechas.map(fecha => datosPorFecha[fecha].ingresos);
    const datosEgresos = fechas.map(fecha => datosPorFecha[fecha].egresos);

    // Obtener el canvas
    const ctx = document.getElementById('graficoMovimientosDinero');
    if (!ctx) {
      console.error('❌ Canvas no encontrado');
      return;
    }

    // Destruir gráfico anterior si existe
    if (graficoMovimientosDinero) {
      graficoMovimientosDinero.destroy();
    }

    // Crear nuevo gráfico
    graficoMovimientosDinero = new Chart(ctx, {
      type: 'line',
      data: {
        labels: fechas,
        datasets: [
          {
            label: 'Ingresos',
            data: datosIngresos,
            borderColor: 'rgb(40, 167, 69)',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Egresos',
            data: datosEgresos,
            borderColor: 'rgb(220, 53, 69)',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: $${context.parsed.y.toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return `$${value.toLocaleString('es-MX')}`;
              }
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    });

    if (window.reportesSystem && window.reportesSystem.showNotification) {
      window.reportesSystem.showNotification('Gráfico actualizado correctamente', 'success');
    }
  } catch (error) {
    console.error('❌ Error actualizando gráfico:', error);
    if (window.reportesSystem && window.reportesSystem.showNotification) {
      window.reportesSystem.showNotification('Error al actualizar el gráfico', 'error');
    }
  }
};

// Función para cargar opciones de filtros
window.cargarFiltrosMovimientos = async function () {
  try {
    // Verificar que el canvas exista antes de continuar
    const canvas = document.getElementById('graficoMovimientosDinero');
    if (!canvas) {
      reportesLog.warn('⚠️ Canvas de gráfico no encontrado, saltando carga de filtros');
      return;
    }

    // Cargar movimientos de tesorería
    let movimientos = [];

    // Intentar cargar desde Firebase primero
    if (window.firebaseRepos && window.firebaseRepos.tesoreria) {
      try {
        const repoTesoreria = window.firebaseRepos.tesoreria;
        if (repoTesoreria.db && repoTesoreria.tenantId) {
          const movimientosFirebase = await repoTesoreria.getAllMovimientos();
          if (movimientosFirebase && movimientosFirebase.length > 0) {
            movimientos = movimientosFirebase;
          }
        }
      } catch (error) {
        reportesLog.warn('⚠️ Error cargando movimientos desde Firebase:', error);
      }
    }

    // Si no hay datos de Firebase, cargar desde localStorage
    if (movimientos.length === 0) {
      try {
        const movimientosStorage = localStorage.getItem('erp_tesoreria_movimientos');
        if (movimientosStorage) {
          movimientos = JSON.parse(movimientosStorage);
        }
      } catch (error) {
        console.error('❌ Error cargando movimientos desde localStorage:', error);
      }
    }

    // Obtener bancos y cuentas únicos
    const bancosOrigen = new Set();
    const cuentasOrigen = new Set();
    const bancosDestino = new Set();
    const cuentasDestino = new Set();

    movimientos.forEach(mov => {
      if (mov.bancoOrigen) {
        bancosOrigen.add(mov.bancoOrigen);
      }
      if (mov.cuentaOrigen) {
        cuentasOrigen.add(mov.cuentaOrigen);
      }
      if (mov.bancoDestino) {
        bancosDestino.add(mov.bancoDestino);
      }
      if (mov.cuentaDestino) {
        cuentasDestino.add(mov.cuentaDestino);
      }
    });

    // Llenar select de banco origen
    const selectBancoOrigen = document.getElementById('filtroBancoOrigen');
    if (selectBancoOrigen) {
      Array.from(bancosOrigen)
        .sort()
        .forEach(banco => {
          const option = document.createElement('option');
          option.value = banco;
          option.textContent = banco;
          selectBancoOrigen.appendChild(option);
        });
    }

    // Llenar select de cuenta origen
    const selectCuentaOrigen = document.getElementById('filtroCuentaOrigen');
    if (selectCuentaOrigen) {
      Array.from(cuentasOrigen)
        .sort()
        .forEach(cuenta => {
          const option = document.createElement('option');
          option.value = cuenta;
          option.textContent = cuenta;
          selectCuentaOrigen.appendChild(option);
        });
    }

    // Llenar select de banco destino
    const selectBancoDestino = document.getElementById('filtroBancoDestino');
    if (selectBancoDestino) {
      Array.from(bancosDestino)
        .sort()
        .forEach(banco => {
          const option = document.createElement('option');
          option.value = banco;
          option.textContent = banco;
          selectBancoDestino.appendChild(option);
        });
    }

    // Llenar select de cuenta destino
    const selectCuentaDestino = document.getElementById('filtroCuentaDestino');
    if (selectCuentaDestino) {
      Array.from(cuentasDestino)
        .sort()
        .forEach(cuenta => {
          const option = document.createElement('option');
          option.value = cuenta;
          option.textContent = cuenta;
          selectCuentaDestino.appendChild(option);
        });
    }

    // Establecer fechas por defecto (últimos 30 días)
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 30);

    const inputFechaInicio = document.getElementById('fechaInicioMovimientos');
    const inputFechaFin = document.getElementById('fechaFinMovimientos');

    if (inputFechaInicio) {
      inputFechaInicio.value = fechaInicio.toISOString().split('T')[0];
    }
    if (inputFechaFin) {
      inputFechaFin.value = fechaFin.toISOString().split('T')[0];
    }

    // Cargar gráfico inicial
    window.actualizarGraficoMovimientos();

    // Inicializar listener automático después de cargar el gráfico
    setTimeout(() => {
      if (typeof inicializarListenerMovimientos === 'function') {
        inicializarListenerMovimientos();
      }
    }, 500);
  } catch (error) {
    console.error('❌ Error cargando filtros:', error);
  }
};

// Función para limpiar filtros
window.limpiarFiltrosMovimientos = function () {
  document.getElementById('filtroBancoOrigen').value = '';
  document.getElementById('filtroCuentaOrigen').value = '';
  document.getElementById('filtroBancoDestino').value = '';
  document.getElementById('filtroCuentaDestino').value = '';

  // Restablecer fechas a últimos 30 días
  const fechaFin = new Date();
  const fechaInicio = new Date();
  fechaInicio.setDate(fechaInicio.getDate() - 30);

  const fechaInicioInput = document.getElementById('fechaInicioMovimientos');
  const fechaFinInput = document.getElementById('fechaFinMovimientos');

  if (fechaInicioInput) {
    fechaInicioInput.value = fechaInicio.toISOString().split('T')[0];
  }
  if (fechaFinInput) {
    fechaFinInput.value = fechaFin.toISOString().split('T')[0];
  }

  // Actualizar gráfico
  window.actualizarGraficoMovimientos();
};

window.viewDetails = function (id) {
  const item = window.reportesSystem.currentData.find(item => item.id === id);
  if (item) {
    const details = `
            Detalles del Registro:
            
            ID: ${item.id}
            Departamento: ${item.departamento}
            Estado: ${item.estado}
            Fecha: ${new Date(item.fecha).toLocaleDateString('es-ES')}
            Cliente: ${item.cliente}
            Servicio: ${item.servicio}
            Peso: ${item.peso} kg
            Origen: ${item.origen}
            Destino: ${item.destino}
            Valor: $${item.valor}
        `;
    alert(details);
  }
};

window.exportItem = function (id) {
  const item = window.reportesSystem.currentData.find(item => item.id === id);
  if (item) {
    const jsonString = JSON.stringify(item, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${item.id}.json`;
    link.click();

    URL.revokeObjectURL(url);
    window.reportesSystem.showNotification(`Registro ${item.id} exportado`, 'success');
  }
};

// Inicializar el sistema de reportes cuando se carga la página
// Mejorado: esperar a que todos los scripts estén cargados, incluyendo Chart.js
(function () {
  let initAttempts = 0;
  const maxInitAttempts = 20; // Máximo 10 segundos de espera

  function initReportesSystem() {
    initAttempts++;

    // Verificar que estamos en la página de reportes
    if (!window.location.pathname.includes('reportes.html')) {
      return;
    }

    // Si ya está inicializado, no volver a inicializar
    if (window.reportesSystem && window.reportesSystem.initialized) {
      console.log('✅ Sistema de reportes ya inicializado');
      return;
    }

    // Verificar que la clase esté disponible
    if (typeof ReportesSystem === 'undefined') {
      if (initAttempts < maxInitAttempts) {
        reportesLog.warn(
          `⚠️ ReportesSystem no disponible aún (intento ${initAttempts}/${maxInitAttempts}), reintentando...`
        );
        setTimeout(initReportesSystem, 500);
      } else {
        console.error('❌ ReportesSystem no se pudo cargar después de múltiples intentos');
      }
      return;
    }

    // Verificar que Chart.js esté disponible
    if (typeof Chart === 'undefined') {
      if (initAttempts < maxInitAttempts) {
        reportesLog.warn(
          `⚠️ Chart.js no disponible aún (intento ${initAttempts}/${maxInitAttempts}), reintentando...`
        );
        setTimeout(initReportesSystem, 500);
      } else {
        console.error(
          '❌ Chart.js no se pudo cargar después de múltiples intentos. Los gráficos no funcionarán.'
        );
        // Inicializar de todos modos, pero sin gráficos
      }
      return;
    }

    try {
      console.log('🚀 Inicializando sistema de reportes...');
      window.reportesSystem = new ReportesSystem();
      window.reportesSystem.initialized = true;
      console.log('✅ Sistema de reportes inicializado correctamente');

      // Verificar después de un delay si los datos se cargaron
      setTimeout(() => {
        if (window.reportesSystem && window.reportesSystem.currentData) {
          console.log(`📊 Datos cargados: ${window.reportesSystem.currentData.length} registros`);
        } else {
          reportesLog.warn('⚠️ No se detectaron datos después de la inicialización, recargando...');
          if (
            window.reportesSystem &&
            typeof window.reportesSystem.loadDashboardData === 'function'
          ) {
            window.reportesSystem.loadDashboardData();
          }
        }
      }, 2000);
    } catch (error) {
      console.error('❌ Error inicializando sistema de reportes:', error);
      // Reintentar después de un delay si aún no hemos excedido los intentos
      if (initAttempts < maxInitAttempts) {
        setTimeout(initReportesSystem, 1000);
      }
    }
  }

  // Intentar inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initReportesSystem, 100);
    });
  } else {
    // DOM ya está listo
    setTimeout(initReportesSystem, 100);
  }

  // También intentar después de que la ventana se cargue completamente
  window.addEventListener('load', () => {
    if (
      window.location.pathname.includes('reportes.html') &&
      (!window.reportesSystem || !window.reportesSystem.initialized)
    ) {
      setTimeout(initReportesSystem, 500);
    }
  });
})();

// Función de prueba para verificar colores de económicos
window.probarColoresEconomicos = function () {
  console.log('🧪 Probando generación de colores para económicos...');

  // Simular algunos económicos
  const economicosEjemplo = ['E001', 'E002', 'E003', 'E004', 'E005'];

  const { reportesSystem } = window;
  if (reportesSystem && reportesSystem.generateColorsForEconomicos) {
    const colores = reportesSystem.generateColorsForEconomicos(economicosEjemplo);

    console.log('🎨 Colores generados:');
    economicosEjemplo.forEach((economico, index) => {
      console.log(`  ${economico}: ${colores.backgrounds[index]} / ${colores.borders[index]}`);
    });

    return colores;
  }
  console.error('❌ Sistema de reportes no encontrado');
  return null;
};

// Función de prueba para análisis por económico
window.probarAnalisisEconomico = function (economico = null) {
  console.log('🧪 Probando análisis por económico...');

  const { reportesSystem } = window;
  if (reportesSystem && reportesSystem.updateAnalisisEconomico) {
    reportesSystem
      .updateAnalisisEconomico()
      .catch(err => console.error('Error actualizando análisis:', err));

    if (economico) {
      // Simular selección de económico
      const dropdown = document.getElementById('filtroEconomicoDetalle');
      if (dropdown) {
        dropdown.value = economico;
        reportesSystem.mostrarMetricasEconomico(economico);
        console.log(`✅ Métricas mostradas para económico: ${economico}`);
      }
    }

    console.log('✅ Análisis por económico actualizado');
    return true;
  }
  console.error('❌ Sistema de reportes no encontrado');
  return false;
};

// Función de prueba para gráfica radar de diesel
window.probarGraficaRadarDiesel = function () {
  console.log('🧪 Probando gráfica radar de diesel...');

  const { reportesSystem } = window;
  if (reportesSystem && reportesSystem.updateDieselChart) {
    reportesSystem.updateDieselChart();
    console.log('✅ Gráfica radar de diesel actualizada');
    return true;
  }
  console.error('❌ Sistema de reportes no encontrado');
  return false;
};

// Función para recargar el filtro de tractocamiones
window.recargarFiltroTractocamiones = function () {
  console.log('🔄 Recargando filtro de tractocamiones manualmente...');

  const { reportesSystem } = window;
  if (reportesSystem && reportesSystem.loadTractocamionesFilter) {
    reportesSystem.loadTractocamionesFilter();
    console.log('✅ Filtro de tractocamiones recargado');
    return true;
  }
  console.error('❌ Sistema de reportes no encontrado');
  return false;
};

// Función de prueba para verificar económicos en análisis detallado
window.probarEconomicosAnalisis = function () {
  console.log('🧪 Probando carga de económicos en análisis detallado...');

  if (window.reportesSystem) {
    // Simular datos de viajes vacíos para probar la función
    const viajesData = [];
    window.reportesSystem.actualizarDropdownEconomicos(viajesData).catch(err => {
      console.error('❌ Error actualizando dropdown:', err);
    });
    console.log('✅ Dropdown de económicos actualizado');
    return true;
  }
  console.error('❌ Sistema de reportes no inicializado');
  return false;
};

// Función de prueba para verificar gráficas después del deploy
window.probarGraficasDeploy = function () {
  console.log('🧪 Probando gráficas después del deploy...');

  if (window.reportesSystem) {
    // Probar gráfica de servicios (pastel)
    const serviceData = window.reportesSystem.groupDataByService([]);
    console.log('📊 Datos de gráfica de servicios:', serviceData);

    // Probar gráfica de diesel (radar)
    const dieselData = JSON.parse(localStorage.getItem('erp_diesel_movimientos') || '[]');
    const radarData = window.reportesSystem.processDieselDataForRadar(dieselData);
    console.log('📊 Datos de gráfica radar:', radarData);

    // Actualizar ambas gráficas
    window.reportesSystem.updateCharts([]);
    console.log('✅ Gráficas actualizadas');
    return true;
  }
  console.error('❌ Sistema de reportes no inicializado');
  return false;
};

// Función de prueba específica para verificar datos de diesel
window.probarDatosDiesel = function () {
  console.log('🧪 Verificando datos de diesel disponibles...');

  // Verificar datos de diesel
  const dieselData = JSON.parse(localStorage.getItem('erp_diesel_movimientos') || '[]');
  console.log('📊 Datos de diesel en localStorage:', dieselData);

  // Verificar datos de viajes
  const viajesData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
  console.log('📊 Datos de viajes en localStorage:', viajesData);

  // Verificar económicos en configuración
  const economicosData = JSON.parse(localStorage.getItem('erp_economicos') || '{}');
  console.log('📊 Económicos en configuración:', economicosData);

  // Probar procesamiento de datos
  if (window.reportesSystem) {
    const radarData = window.reportesSystem.processDieselDataForRadar(dieselData);
    console.log('📊 Resultado del procesamiento:', radarData);

    // Actualizar solo la gráfica radar
    window.reportesSystem.updateDieselChart();
    console.log('✅ Gráfica radar actualizada');
  }

  return true;
};
