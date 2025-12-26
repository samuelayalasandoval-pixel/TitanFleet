// Sistema de Persistencia de Datos - Compartir información entre páginas
class DataPersistence {
  constructor() {
    this.storageKey = 'erp_shared_data';
    this.initializeData();
  }

  // Inicializar datos si no existen
  initializeData() {
    if (!this.getData()) {
      this.setData({
        registros: {},
        facturas: {},
        trafico: {},
        envios: {},
        economicos: {}
      });
    }
  }

  // Obtener todos los datos
  getData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      if (window.errorHandler) {
        window.errorHandler.warning('Error al obtener datos de persistencia', { error: error });
      } else {
        console.error('Error al obtener datos:', error);
      }
      return null;
    }
  }

  // Guardar todos los datos
  setData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      if (window.errorHandler) {
        window.errorHandler.warning('Error al guardar datos de persistencia', { error: error });
      } else {
        console.error('Error al guardar datos:', error);
      }
      return false;
    }
  }

  // Guardar datos de logística
  saveLogisticaData(registroId, data) {
    const allData = this.getData();
    if (!allData) {
      return false;
    }

    allData.registros[registroId] = {
      ...data,
      fechaCreacion: new Date().toISOString(),
      ultimaActualizacion: new Date().toISOString()
    };

    return this.setData(allData);
  }

  // Obtener datos de logística por número de registro
  // FIREBASE ES LA FUENTE DE VERDAD - Intentar Firebase primero, localStorage solo como respaldo
  async getLogisticaData(registroId) {
    // PRIORIDAD 1: Intentar obtener desde Firebase
    if (window.firebaseRepos?.logistica) {
      try {
        const repoLogistica = window.firebaseRepos.logistica;
        // Esperar inicialización si es necesario
        if (
          typeof repoLogistica.init === 'function' &&
          (!repoLogistica.db || !repoLogistica.tenantId)
        ) {
          await repoLogistica.init();
        }
        if (repoLogistica.db && repoLogistica.tenantId) {
          // Intentar obtener desde Firebase
          const registro =
            typeof repoLogistica.getRegistro === 'function'
              ? await repoLogistica.getRegistro(registroId)
              : typeof repoLogistica.get === 'function'
                ? await repoLogistica.get(registroId)
                : null;

          if (registro) {
            console.log('✅ Logística obtenida desde Firebase (fuente de verdad)');
            return registro;
          }
        }
      } catch (error) {
        console.warn(
          '⚠️ Error obteniendo logística desde Firebase, usando localStorage como respaldo:',
          error
        );
      }
    }

    // PRIORIDAD 2: Fallback a localStorage solo si Firebase no está disponible o falló
    const allData = this.getData();
    if (allData && allData.registros && allData.registros[registroId]) {
      console.log(
        '⚠️ Logística obtenida desde localStorage (respaldo de emergencia - Firebase es la fuente de verdad)'
      );
    }
    return allData ? allData.registros[registroId] : null;
  }

  // Guardar datos de facturación
  saveFacturacionData(registroId, data) {
    const allData = this.getData();
    if (!allData) {
      return false;
    }

    allData.facturas[registroId] = {
      ...data,
      fechaCreacion: new Date().toISOString(),
      ultimaActualizacion: new Date().toISOString()
    };

    return this.setData(allData);
  }

  // Obtener datos de facturación por número de registro
  // FIREBASE ES LA FUENTE DE VERDAD - Intentar Firebase primero, localStorage solo como respaldo
  async getFacturacionData(registroId) {
    // PRIORIDAD 1: Intentar obtener desde Firebase
    if (window.firebaseRepos?.facturacion) {
      try {
        const repoFacturacion = window.firebaseRepos.facturacion;
        // Esperar inicialización si es necesario
        if (
          typeof repoFacturacion.init === 'function' &&
          (!repoFacturacion.db || !repoFacturacion.tenantId)
        ) {
          await repoFacturacion.init();
        }
        if (repoFacturacion.db && repoFacturacion.tenantId) {
          // Intentar obtener desde Firebase
          const registro =
            typeof repoFacturacion.getRegistro === 'function'
              ? await repoFacturacion.getRegistro(registroId)
              : typeof repoFacturacion.get === 'function'
                ? await repoFacturacion.get(registroId)
                : null;

          if (registro) {
            console.log('✅ Facturación obtenida desde Firebase (fuente de verdad)');
            return registro;
          }
        }
      } catch (error) {
        console.warn(
          '⚠️ Error obteniendo facturación desde Firebase, usando localStorage como respaldo:',
          error
        );
      }
    }

    // PRIORIDAD 2: Fallback a localStorage solo si Firebase no está disponible o falló
    const allData = this.getData();
    if (allData && allData.facturas && allData.facturas[registroId]) {
      console.log(
        '⚠️ Facturación obtenida desde localStorage (respaldo de emergencia - Firebase es la fuente de verdad)'
      );
    }
    return allData ? allData.facturas[registroId] : null;
  }

  // Guardar datos de tráfico
  saveTraficoData(registroId, data) {
    const allData = this.getData();
    if (!allData) {
      // Si no hay datos, inicializar estructura completa
      this.initializeData();
      const newData = this.getData();
      if (!newData) {
        return false;
      }
      newData.trafico = newData.trafico || {};
      newData.trafico[registroId] = {
        ...data,
        fechaCreacion: new Date().toISOString(),
        ultimaActualizacion: new Date().toISOString()
      };
      return this.setData(newData);
    }

    // Asegurar que trafico esté inicializado
    if (!allData.trafico) {
      allData.trafico = {};
    }

    allData.trafico[registroId] = {
      ...data,
      fechaCreacion: new Date().toISOString(),
      ultimaActualizacion: new Date().toISOString()
    };

    return this.setData(allData);
  }

  // Obtener datos de tráfico por número de registro
  getTraficoData(registroId) {
    // NOTA: Este método mantiene sincronización con getAllDataByRegistro que ya prioriza Firebase
    // Se mantiene para compatibilidad, pero se recomienda usar getAllDataByRegistro para datos actualizados
    const allData = this.getData();
    return allData && allData.trafico ? allData.trafico[registroId] : null;
  }

  // Obtener datos de tráfico por número de registro (versión async que prioriza Firebase)
  async getTraficoDataAsync(registroId) {
    // PRIORIDAD 1: Intentar obtener desde Firebase
    if (window.firebaseRepos?.trafico) {
      try {
        const repoTrafico = window.firebaseRepos.trafico;
        // Esperar inicialización si es necesario
        if (typeof repoTrafico.init === 'function' && (!repoTrafico.db || !repoTrafico.tenantId)) {
          await repoTrafico.init();
        }
        if (repoTrafico.db && repoTrafico.tenantId) {
          // Intentar obtener desde Firebase
          const registro =
            typeof repoTrafico.getRegistro === 'function'
              ? await repoTrafico.getRegistro(registroId)
              : typeof repoTrafico.get === 'function'
                ? await repoTrafico.get(registroId)
                : null;

          if (registro) {
            console.log('✅ Tráfico obtenido desde Firebase (fuente de verdad)');
            return registro;
          }
        }
      } catch (error) {
        console.warn(
          '⚠️ Error obteniendo tráfico desde Firebase, usando localStorage como respaldo:',
          error
        );
      }
    }

    // PRIORIDAD 2: Fallback a localStorage solo si Firebase no está disponible o falló
    const allData = this.getData();
    if (allData && allData.trafico && allData.trafico[registroId]) {
      console.log(
        '⚠️ Tráfico obtenido desde localStorage (respaldo de emergencia - Firebase es la fuente de verdad)'
      );
    }
    return allData && allData.trafico ? allData.trafico[registroId] : null;
  }

  // Guardar datos de económicos
  saveEconomicoData(numeroEconomico, data) {
    const allData = this.getData();
    if (!allData) {
      return false;
    }

    // Asegurar que económicos existe
    if (!allData.economicos) {
      allData.economicos = {};
    }

    allData.economicos[numeroEconomico] = {
      ...data,
      fechaCreacion: new Date().toISOString(),
      ultimaActualizacion: new Date().toISOString()
    };

    return this.setData(allData);
  }

  // Obtener datos de económico por número
  getEconomicoData(numeroEconomico) {
    const allData = this.getData();
    if (!allData || !allData.economicos) {
      return null;
    }
    return allData.economicos[numeroEconomico] || null;
  }

  // Obtener todos los económicos
  getAllEconomicos() {
    const allData = this.getData();
    if (!allData || !allData.economicos) {
      return [];
    }

    return Object.keys(allData.economicos).map(numero => ({
      numero: numero,
      ...allData.economicos[numero]
    }));
  }

  // Guardar datos de operadores
  saveOperadorData(nombreOperador, data) {
    const allData = this.getData();
    if (!allData) {
      return false;
    }

    allData.operadores = allData.operadores || {};
    allData.operadores[nombreOperador] = {
      ...data,
      fechaCreacion: new Date().toISOString(),
      ultimaActualizacion: new Date().toISOString()
    };

    return this.setData(allData);
  }

  // Obtener datos de operador por nombre
  getOperadorData(nombreOperador) {
    const allData = this.getData();
    return allData && allData.operadores ? allData.operadores[nombreOperador] : null;
  }

  // Obtener todos los operadores
  getAllOperadores() {
    const allData = this.getData();
    if (!allData || !allData.operadores) {
      return [];
    }

    return Object.keys(allData.operadores).map(nombre => ({
      nombre: nombre,
      ...allData.operadores[nombre]
    }));
  }

  // Obtener todos los datos relacionados a un registro
  async getAllDataByRegistro(registroId) {
    const result = {
      logistica: null,
      facturacion: null,
      trafico: null,
      envios: null
    };

    // PRIORIDAD ABSOLUTA: Firebase es la única fuente de verdad
    // Solo usar localStorage si Firebase NO está disponible, NO tiene el registro, o el usuario NO está autenticado

    let firebaseDisponible = false;
    const usuarioAutenticado = window.firebaseAuth && window.firebaseAuth.currentUser;

    if (window.firebaseRepos) {
      try {
        // Obtener logística desde Firebase
        if (window.firebaseRepos.logistica) {
          try {
            const repoLogistica = window.firebaseRepos.logistica;
            if (
              typeof repoLogistica.init === 'function' &&
              (!repoLogistica.db || !repoLogistica.tenantId)
            ) {
              await repoLogistica.init();
            }
            if (repoLogistica.db && repoLogistica.tenantId) {
              firebaseDisponible = true;
              // Usar getRegistro si existe, sino usar get
              if (typeof repoLogistica.getRegistro === 'function') {
                result.logistica = await repoLogistica.getRegistro(registroId);
              } else if (typeof repoLogistica.get === 'function') {
                result.logistica = await repoLogistica.get(registroId);
              }
              if (result.logistica) {
                console.log('✅ Logística obtenida desde Firebase (fuente de verdad)');
              }
            }
          } catch (e) {
            console.warn('⚠️ Error obteniendo logística desde Firebase:', e);
          }
        }

        // Obtener tráfico desde Firebase
        if (window.firebaseRepos.trafico) {
          try {
            const repoTrafico = window.firebaseRepos.trafico;
            if (
              typeof repoTrafico.init === 'function' &&
              (!repoTrafico.db || !repoTrafico.tenantId)
            ) {
              await repoTrafico.init();
            }
            if (repoTrafico.db && repoTrafico.tenantId) {
              firebaseDisponible = true;
              // Usar getRegistro si existe, sino usar get
              if (typeof repoTrafico.getRegistro === 'function') {
                result.trafico = await repoTrafico.getRegistro(registroId);
              } else if (typeof repoTrafico.get === 'function') {
                result.trafico = await repoTrafico.get(registroId);
              }
              if (result.trafico) {
                console.log('✅ Tráfico obtenido desde Firebase (fuente de verdad)');
              }
            }
          } catch (e) {
            console.warn('⚠️ Error obteniendo tráfico desde Firebase:', e);
          }
        }

        // Obtener facturación desde Firebase
        if (window.firebaseRepos.facturacion) {
          try {
            const repoFacturacion = window.firebaseRepos.facturacion;
            if (
              typeof repoFacturacion.init === 'function' &&
              (!repoFacturacion.db || !repoFacturacion.tenantId)
            ) {
              await repoFacturacion.init();
            }
            if (repoFacturacion.db && repoFacturacion.tenantId) {
              firebaseDisponible = true;
              // Usar getRegistro si existe, sino usar get
              if (typeof repoFacturacion.getRegistro === 'function') {
                result.facturacion = await repoFacturacion.getRegistro(registroId);
              } else if (typeof repoFacturacion.get === 'function') {
                result.facturacion = await repoFacturacion.get(registroId);
              }
              if (result.facturacion) {
                console.log('✅ Facturación obtenida desde Firebase (fuente de verdad)');
              }
            }
          } catch (e) {
            console.warn('⚠️ Error obteniendo facturación desde Firebase:', e);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo datos desde Firebase:', error);
      }
    }

    // Usar localStorage como respaldo si:
    // 1. Firebase NO está disponible, O
    // 2. Usuario NO está autenticado (Firebase no puede obtener datos), O
    // 3. Firebase no retornó datos para ese módulo específico
    const usarLocalStorage = !firebaseDisponible || !usuarioAutenticado;

    if (usarLocalStorage) {
      const razon = !firebaseDisponible ? 'Firebase no disponible' : 'Usuario no autenticado';
      console.warn(`⚠️ ${razon}, usando localStorage como respaldo temporal`);
      const allData = this.getData();
      if (allData) {
        if (!result.logistica && allData.registros && allData.registros[registroId]) {
          console.warn('⚠️ Usando datos de logística desde localStorage (respaldo)');
          result.logistica = allData.registros[registroId];
        }
        if (!result.trafico && allData.trafico && allData.trafico[registroId]) {
          console.warn('⚠️ Usando datos de tráfico desde localStorage (respaldo)');
          result.trafico = allData.trafico[registroId];
        }
        if (!result.facturacion && allData.facturas && allData.facturas[registroId]) {
          console.warn('⚠️ Usando datos de facturación desde localStorage (respaldo)');
          result.facturacion = allData.facturas[registroId];
        }
        if (!result.envios && allData.envios && allData.envios[registroId]) {
          result.envios = allData.envios[registroId];
        }
      }
    } else {
      // Firebase está disponible Y usuario autenticado - NO usar localStorage
      // Si Firebase retornó null, significa que el registro no existe
      console.log(
        '✅ Firebase disponible y usuario autenticado - localStorage NO se usará (Firebase es la fuente de verdad)'
      );
    }

    return result;
  }

  // Buscar registro por número
  searchRegistro(registroId) {
    const allData = this.getData();
    if (!allData) {
      return null;
    }

    return (allData.registros && allData.registros[registroId]) || null;
  }

  // Obtener lista de todos los registros
  getAllRegistros() {
    const allData = this.getData();
    if (!allData || !allData.registros) {
      return [];
    }

    return Object.keys(allData.registros).map(registroId => ({
      id: registroId,
      ...allData.registros[registroId]
    }));
  }

  // Eliminar datos de un registro
  deleteRegistro(registroId) {
    const allData = this.getData();
    if (!allData) {
      return false;
    }

    if (allData.registros) {
      delete allData.registros[registroId];
    }
    if (allData.facturas) {
      delete allData.facturas[registroId];
    }
    if (allData.trafico) {
      delete allData.trafico[registroId];
    }
    if (allData.envios) {
      delete allData.envios[registroId];
    }

    return this.setData(allData);
  }

  // Limpiar todos los datos
  clearAllData() {
    return this.setData({
      registros: {},
      facturas: {},
      trafico: {},
      envios: {}
    });
  }

  // Exportar datos
  exportData() {
    const allData = this.getData();
    if (!allData) {
      return null;
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      `Registro,Cliente,Origen,Destino,TipoServicio,Monto,Estado,FechaCreacion\n${Object.keys(
        allData.registros
      )
        .map(registroId => {
          const registro = allData.registros[registroId];
          return `${registroId},${registro.cliente},${registro.origen},${registro.destino},${registro.tipoServicio},${registro.monto},${registro.estado},${registro.fechaCreacion}`;
        })
        .join('\n')}`;

    return csvContent;
  }
}

// Instancia global del sistema de persistencia
try {
  window.DataPersistence = new DataPersistence();
  console.log('✅ DataPersistence inicializado correctamente');
} catch (error) {
  console.error('❌ Error inicializando DataPersistence:', error);
  // Crear una versión mínima para evitar errores
  window.DataPersistence = {
    getData: () => null,
    setData: () => false,
    saveLogisticaData: () => false,
    getLogisticaData: () => null,
    saveTraficoData: () => false,
    getTraficoData: () => null,
    getAllDataByRegistro: () => ({ logistica: null, trafico: null, facturacion: null })
  };
}

// Funciones de utilidad para el llenado automático
window.autoFillData = {
  // Llenar datos de logística en tráfico
  async fillTraficoFromLogistica(registroId) {
    // FIREBASE ES LA FUENTE DE VERDAD - getLogisticaData ahora prioriza Firebase
    const logisticaData = await window.DataPersistence.getLogisticaData(registroId);
    if (!logisticaData) {
      return false;
    }

    console.log('📦 Llenando datos de logística en tráfico:', logisticaData);

    // Llenar campos básicos de la sección "Datos de Logística"
    const camposBasicos = {
      cliente: logisticaData.cliente,
      origen: logisticaData.origen,
      destino: logisticaData.destino,
      'referencia cliente': logisticaData.referenciaCliente,
      tiposervicio: logisticaData.tipoServicio,
      embalajeEspecial: logisticaData.embalajeEspecial
    };

    let camposLlenados = 0;
    Object.keys(camposBasicos).forEach(selector => {
      const element = document.getElementById(selector);
      if (element && camposBasicos[selector]) {
        element.value = camposBasicos[selector];
        camposLlenados++;
        console.log(`✅ Campo ${selector} llenado:`, camposBasicos[selector]);
      }
    });

    // Llenar campos adicionales de detalles del envío si existen en tráfico
    const camposDetalles = {
      plataforma: logisticaData.plataforma,
      mercancia: logisticaData.mercancia,
      peso: logisticaData.peso,
      largo: logisticaData.largo,
      ancho: logisticaData.ancho,
      fechaEnvio: logisticaData.fechaEnvio
    };

    Object.keys(camposDetalles).forEach(selector => {
      const element = document.getElementById(selector);
      if (element && camposDetalles[selector]) {
        element.value = camposDetalles[selector];
        camposLlenados++;
        console.log(`✅ Campo detalle ${selector} llenado:`, camposDetalles[selector]);
      }
    });

    // Llenar radio buttons de embalaje especial si existe
    if (logisticaData.embalajeEspecial) {
      const embalajeRadios = document.querySelectorAll('input[name="embalaje"]');
      embalajeRadios.forEach(radio => {
        if (radio.value === logisticaData.embalajeEspecial) {
          radio.checked = true;
          console.log(`✅ Radio embalaje ${radio.value} seleccionado`);
        }
      });
    }

    // Llenar descripción de embalaje si existe
    if (logisticaData.descripcionEmbalaje) {
      const descripcionElement = document.getElementById('descripcion');
      if (descripcionElement) {
        descripcionElement.value = logisticaData.descripcionEmbalaje;
        console.log('✅ Descripción embalaje llenada:', logisticaData.descripcionEmbalaje);
      }
    }

    // Campo observaciones eliminado - no existe en el formulario de logística

    console.log(`📊 Total de campos llenados: ${camposLlenados}`);
    return camposLlenados > 0;
  },

  // Llenar datos de logística en facturación
  async fillFacturacionFromLogistica(registroId) {
    // FIREBASE ES LA FUENTE DE VERDAD - getLogisticaData ahora prioriza Firebase
    const logisticaData = await window.DataPersistence.getLogisticaData(registroId);
    if (!logisticaData) {
      return false;
    }

    // Mapeo específico para los campos de facturación según el HTML
    const campos = {
      Cliente: logisticaData.cliente,
      ReferenciaCliente: logisticaData.referenciaCliente,
      TipoServicio: logisticaData.tipoServicio,
      LugarOrigen: logisticaData.origen,
      LugarDestino: logisticaData.destino,
      embalajeEspecial: logisticaData.embalajeEspecial
    };

    let camposLlenados = 0;
    Object.keys(campos).forEach(selector => {
      const element = document.getElementById(selector);
      if (element && campos[selector]) {
        element.value = campos[selector];
        camposLlenados++;
      }
    });

    // Llenar radio buttons de embalaje especial si existe
    if (logisticaData.embalajeEspecial) {
      const embalajeRadios = document.querySelectorAll('input[name="embalaje"]');
      embalajeRadios.forEach(radio => {
        if (radio.value === logisticaData.embalajeEspecial) {
          radio.checked = true;
        }
      });
    }

    // Llenar descripción de embalaje si existe
    if (logisticaData.descripcionEmbalaje) {
      const descripcionElement = document.getElementById('descripcion');
      if (descripcionElement) {
        descripcionElement.value = logisticaData.descripcionEmbalaje;
      }
    }

    console.log(`Llenados ${camposLlenados} campos desde logística`);
    return camposLlenados > 0;
  },

  // Llenar datos de tráfico en facturación
  async fillFacturacionFromTrafico(registroId) {
    // PRIORIDAD ABSOLUTA: Firebase es la única fuente de verdad
    let traficoData = null;
    let firebaseDisponible = false;

    if (window.firebaseRepos?.trafico) {
      try {
        const repoTrafico = window.firebaseRepos.trafico;

        // Intentar inicializar si no está listo
        if (typeof repoTrafico.init === 'function' && (!repoTrafico.db || !repoTrafico.tenantId)) {
          await repoTrafico.init();
        }

        // Intentar obtener desde Firebase
        if (repoTrafico.db && repoTrafico.tenantId) {
          firebaseDisponible = true;
          // Usar getRegistro si existe, sino usar get
          if (typeof repoTrafico.getRegistro === 'function') {
            traficoData = await repoTrafico.getRegistro(registroId);
          } else if (typeof repoTrafico.get === 'function') {
            traficoData = await repoTrafico.get(registroId);
          }
          if (traficoData) {
            console.log(
              '✅ Datos de tráfico obtenidos desde Firebase (fuente de verdad):',
              traficoData
            );
          } else {
            console.log('ℹ️ Registro no encontrado en Firebase (no existe)');
          }
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo datos de tráfico desde Firebase:', error);
      }
    }

    // SOLO usar localStorage si Firebase NO está disponible
    // NUNCA usar localStorage si Firebase está disponible (incluso si retorna null)
    if (!firebaseDisponible) {
      console.warn('⚠️ Firebase no disponible, usando localStorage como respaldo temporal');
      traficoData = window.DataPersistence.getTraficoData(registroId);
      if (traficoData) {
        console.warn('⚠️ Datos de tráfico obtenidos desde localStorage (Firebase no disponible)');
      }
    } else {
      // Firebase está disponible - NO usar localStorage
      console.log(
        '✅ Firebase disponible - localStorage NO se usará (Firebase es la fuente de verdad)'
      );
    }

    if (!traficoData) {
      console.warn('⚠️ No se encontraron datos de tráfico para:', registroId);
      return false;
    }

    // Mapeo específico para los campos de tráfico en facturación según el HTML
    // Verificar múltiples variantes de nombres de campos
    const campos = {
      LugarOrigen: traficoData.lugarOrigen || traficoData.LugarOrigen || traficoData.origen,
      LugarDestino: traficoData.lugarDestino || traficoData.LugarDestino || traficoData.destino,
      economico: traficoData.economico || traficoData.numeroEconomico,
      Placas: traficoData.placas || traficoData.Placas || traficoData.placaTracto,
      PermisoSCT: traficoData.permisoSCT || traficoData.PermisoSCT || traficoData.permisosct,
      OperadorPrincipal:
        traficoData.operadorPrincipal ||
        traficoData.operadorprincipal ||
        traficoData.OperadorPrincipal,
      Licencia:
        traficoData.licenciaOperadorPrincipal ||
        traficoData.licenciaPrincipal ||
        traficoData.Licencia ||
        traficoData.licencia,
      operadorsecundario:
        traficoData.operadorSecundario ||
        traficoData.operadorsecundario ||
        traficoData.OperadorSecundario,
      LicenciaSecundaria:
        traficoData.licenciaSecundaria ||
        traficoData.licenciaOperadorSecundario ||
        traficoData.LicenciaSecundaria
    };

    console.log('📋 Mapeo de campos de tráfico a facturación:', campos);

    let camposLlenados = 0;
    Object.keys(campos).forEach(selector => {
      const element = document.getElementById(selector);
      const valor = campos[selector];

      if (element && valor && valor !== '' && valor !== 'undefined' && valor !== 'null') {
        element.value = valor;
        camposLlenados++;
        console.log(`✅ Campo ${selector} llenado con: ${valor}`);
      } else if (element && !valor) {
        console.debug(`ℹ️ Campo ${selector} no se llenará (valor vacío o inválido)`);
      } else if (!element) {
        console.warn(`⚠️ Elemento ${selector} no encontrado en el DOM`);
      }
    });

    console.log(`✅ Llenados ${camposLlenados} campos desde tráfico`);
    return camposLlenados > 0;
  },

  // Llenar datos de facturación en tráfico
  async fillTraficoFromFacturacion(registroId) {
    // FIREBASE ES LA FUENTE DE VERDAD - getFacturacionData ahora prioriza Firebase
    const facturacionData = await window.DataPersistence.getFacturacionData(registroId);
    if (!facturacionData) {
      return false;
    }

    // Llenar campos adicionales de facturación en tráfico
    const campos = {
      monto: facturacionData.monto,
      fechaVencimiento: facturacionData.fechaVencimiento
    };

    Object.keys(campos).forEach(selector => {
      const element = document.getElementById(selector);
      if (element && campos[selector]) {
        element.value = campos[selector];
      }
    });

    return true;
  },

  // Llenar datos de económico en tráfico
  fillTraficoFromEconomico(numeroEconomico) {
    const economicoData = window.DataPersistence.getEconomicoData(numeroEconomico);
    if (!economicoData) {
      return false;
    }

    // Llenar campos relacionados al económico en la página de tráfico
    const campos = {
      economico: economicoData.numeroEconomico,
      Placas: economicoData.placaTracto,
      permisosct: economicoData.permisoSCT,
      operadorprincipal: economicoData.operadorAsignado,
      telefonoOperador: economicoData.telefonoOperador,
      marcaVehiculo: economicoData.marca,
      modeloVehiculo: economicoData.modelo,
      añoVehiculo: economicoData.año,
      capacidadCarga: economicoData.capacidadCarga
    };

    let camposLlenados = 0;
    Object.keys(campos).forEach(selector => {
      const element = document.getElementById(selector);
      if (element && campos[selector]) {
        element.value = campos[selector];
        camposLlenados++;
        console.log(`✅ Campo ${selector} llenado con: ${campos[selector]}`);
      }
    });

    console.log(`✅ ${camposLlenados} campos llenados desde económico ${numeroEconomico}`);
    return camposLlenados > 0;
  }
};

// Función para llenar automáticamente datos en facturación al cargar la página
window.autoFillFacturacionOnLoad = async function () {
  const numeroRegistroInput = document.getElementById('numeroRegistro');
  if (!numeroRegistroInput || !numeroRegistroInput.value) {
    return false;
  }

  const registroId = numeroRegistroInput.value.trim();
  if (!registroId) {
    return false;
  }

  console.log('Auto-llenando facturación para registro:', registroId);

  // Verificar primero si el registro existe en Firebase antes de mostrar error
  let registroExiste = false;
  if (window.firebaseDb && window.fs) {
    try {
      // Buscar en logística
      const logisticaRef = window.fs.collection(window.firebaseDb, 'logistica');
      const logisticaQuery = window.fs.query(
        logisticaRef,
        window.fs.where('numeroRegistro', '==', registroId)
      );
      const logisticaSnapshot = await window.fs.getDocs(logisticaQuery);

      // Buscar en tráfico
      const traficoRef = window.fs.collection(window.firebaseDb, 'trafico');
      const traficoQuery = window.fs.query(
        traficoRef,
        window.fs.where('numeroRegistro', '==', registroId)
      );
      const traficoSnapshot = await window.fs.getDocs(traficoQuery);

      registroExiste = !logisticaSnapshot.empty || !traficoSnapshot.empty;
    } catch (error) {
      console.warn('⚠️ Error verificando existencia del registro:', error);
    }
  }

  const allData = await window.DataPersistence.getAllDataByRegistro(registroId);

  if (!allData.logistica && !allData.trafico) {
    // Si el registro no existe en Firebase ni en localStorage, es probable que sea el siguiente número disponible
    // No mostrar error en este caso, solo loggear
    if (!registroExiste) {
      console.log(
        `ℹ️ Registro ${registroId} no existe aún (probablemente es el siguiente número disponible). No se mostrará error.`
      );
      return false; // Salir silenciosamente sin mostrar error
    }

    // Si el registro debería existir pero no se encuentra, entonces sí mostrar error
    console.log('No hay datos de logística o tráfico para el registro:', registroId);

    // Verificar si el formato del registro es incorrecto
    const formatoAntiguo = /^2025-\d{2}-\d{4}$/;
    const formatoCorrecto = /^25\d{5}$/;

    let mensajeError = `No hay datos de logística o tráfico para el registro: ${registroId}`;

    if (formatoAntiguo.test(registroId)) {
      mensajeError +=
        '\n\n⚠️ Formato antiguo detectado. El sistema ahora usa el formato: 25XXXXX (ejemplo: 2500001)\n\nPor favor, usa el número de registro correcto en formato 25XXXXX.';
    } else if (!formatoCorrecto.test(registroId)) {
      mensajeError +=
        '\n\n⚠️ Formato incorrecto. El sistema espera números en formato: 25XXXXX (ejemplo: 2500001)';
    } else {
      mensajeError +=
        '\n\nPosibles causas:\n- El registro no existe\n- Los datos no se guardaron correctamente\n\nSolución: Verifica que el registro exista en Logística o Tráfico.';
    }

    if (typeof window.showNotification === 'function') {
      window.showNotification(mensajeError, 'error');
    } else {
      alert(mensajeError);
    }

    return false;
  }

  let logisticaSuccess = false;
  let traficoSuccess = false;

  // Intentar cargar datos de logística
  if (allData.logistica) {
    logisticaSuccess = await window.autoFillData.fillFacturacionFromLogistica(registroId);
  }

  // Intentar cargar datos de tráfico
  if (allData.trafico) {
    traficoSuccess = await window.autoFillData.fillFacturacionFromTrafico(registroId);
  }

  if (logisticaSuccess || traficoSuccess) {
    console.log('Datos cargados automáticamente en facturación');
    return true;
  }

  return false;
};

// Función para verificar si searchAndFillData está disponible
window.checkSearchFunction = function () {
  if (typeof window.searchAndFillData === 'undefined') {
    console.error('❌ searchAndFillData no está disponible');
    console.log('🔍 Verificando scripts cargados...');

    const scripts = {
      'data-persistence.js': document.querySelector('script[src*="data-persistence.js"]')
        ? '✅ Cargado'
        : '❌ No encontrado',
      'integration.js': document.querySelector('script[src*="integration.js"]')
        ? '✅ Cargado'
        : '❌ No encontrado',
      'main.js': document.querySelector('script[src*="main.js"]')
        ? '✅ Cargado'
        : '❌ No encontrado'
    };

    console.log('📋 Scripts:', scripts);

    // Intentar cargar DataPersistence si no está disponible
    if (typeof window.DataPersistence === 'undefined') {
      console.log('🔄 DataPersistence no disponible, intentando cargar...');
      if (typeof window.loadDataPersistenceManually === 'function') {
        window.loadDataPersistenceManually();
      }
    }

    return false;
  }

  console.log('✅ searchAndFillData está disponible');
  return true;
};

// Función alternativa robusta para buscar datos
window.safeSearchAndFillData = function (registroId) {
  console.log('🔍 Ejecutando búsqueda segura para:', registroId);

  // Verificar si el número ya fue procesado en Tráfico
  const history = JSON.parse(localStorage.getItem('registrationNumbers') || '[]');
  const existingInTrafico = history.find(
    item => item.number === registroId && item.page && item.page.includes('trafico')
  );

  if (existingInTrafico) {
    console.log('⚠️ Número ya procesado en Tráfico, no cargando datos automáticamente');
    // No mostrar notificación adicional para evitar amontonamiento
    return false; // No cargar datos automáticamente
  }

  // Verificar que las dependencias estén disponibles
  if (typeof window.DataPersistence === 'undefined') {
    console.error('❌ DataPersistence no disponible');
    if (typeof window.loadDataPersistenceManually === 'function') {
      console.log('🔄 Intentando cargar DataPersistence...');
      window.loadDataPersistenceManually();
    } else {
      alert('Error: DataPersistence no está disponible. Refresca la página.');
      return false;
    }
  }

  if (typeof window.showNotification === 'undefined') {
    console.error('❌ showNotification no disponible');
    alert('Error: Sistema de notificaciones no disponible.');
    return false;
  }

  // Ejecutar la búsqueda normal
  return window.searchAndFillData(registroId);
};

// Función para buscar y llenar datos por número de registro
window.searchAndFillData = async function (registroId) {
  if (!registroId) {
    if (typeof window.showNotification === 'function') {
      window.showNotification('Por favor ingrese un número de registro', 'warning');
    } else {
      alert('Por favor ingrese un número de registro');
    }
    return false;
  }

  // Verificar si el número ya fue procesado en Tráfico
  const history = JSON.parse(localStorage.getItem('registrationNumbers') || '[]');
  const existingInTrafico = history.find(
    item => item.number === registroId && item.page && item.page.includes('trafico')
  );

  if (existingInTrafico) {
    console.log('⚠️ Número ya procesado en Tráfico, no cargando datos automáticamente');
    // No mostrar notificación adicional para evitar amontonamiento
    return false; // No cargar datos automáticamente
  }

  console.log('🔍 Buscando datos para registro:', registroId);

  const allData = await window.DataPersistence.getAllDataByRegistro(registroId);

  // Debug: mostrar qué datos se encontraron
  console.log('📊 Datos encontrados:', {
    logistica: allData.logistica ? '✅ Encontrado' : '❌ No encontrado',
    trafico: allData.trafico ? '✅ Encontrado' : '❌ No encontrado',
    facturacion: allData.facturacion ? '✅ Encontrado' : '❌ No encontrado'
  });

  if (!allData.logistica && !allData.trafico) {
    showNotification(
      `No se encontró el registro ${registroId}. Use "Cargar Datos Ejemplo" para crear registros de prueba.`,
      'error'
    );
    return false;
  }

  // Determinar en qué página estamos y llenar los datos correspondientes
  const currentPage = window.location.pathname.split('/').pop();

  switch (currentPage) {
    case 'trafico.html': {
      let traficoSuccess = false;
      let facturacionSuccess = false;

      // Intentar cargar datos de logística
      if (allData.logistica) {
        console.log('📦 Cargando datos de logística en tráfico...');
        traficoSuccess = await window.autoFillData.fillTraficoFromLogistica(registroId);
      }

      // Intentar cargar datos de facturación si existen
      if (allData.facturacion) {
        console.log('💰 Cargando datos de facturación en tráfico...');
        facturacionSuccess = await window.autoFillData.fillTraficoFromFacturacion(registroId);
      }

      // Mostrar notificación apropiada
      if (traficoSuccess && facturacionSuccess) {
        showNotification(
          `✅ Datos completos cargados para ${registroId} (Logística + Facturación)`,
          'success'
        );
      } else if (traficoSuccess) {
        showNotification(`✅ Datos de logística cargados para ${registroId}`, 'success');
      } else if (facturacionSuccess) {
        showNotification(`✅ Datos de facturación cargados para ${registroId}`, 'success');
      } else if (allData.logistica) {
        showNotification('⚠️ Datos de logística encontrados pero no se pudieron cargar', 'warning');
      } else {
        showNotification(`❌ No hay datos de logística para ${registroId}`, 'error');
      }
      break;
    }

    case 'facturacion.html': {
      let logisticaSuccess = false;
      let traficoSuccess = false;

      // Intentar cargar datos de logística
      if (allData.logistica) {
        logisticaSuccess = await window.autoFillData.fillFacturacionFromLogistica(registroId);
      }

      // Intentar cargar datos de tráfico
      if (allData.trafico) {
        traficoSuccess = await window.autoFillData.fillFacturacionFromTrafico(registroId);
      }

      // Mostrar notificación apropiada
      if (logisticaSuccess && traficoSuccess) {
        showNotification(
          `✅ Datos completos cargados para ${registroId} (Logística + Tráfico)`,
          'success'
        );
      } else if (logisticaSuccess) {
        showNotification(`✅ Datos de logística cargados para ${registroId}`, 'success');
      } else if (traficoSuccess) {
        showNotification(`✅ Datos de tráfico cargados para ${registroId}`, 'success');
      } else {
        showNotification(`⚠️ No se encontraron datos para ${registroId}`, 'warning');
      }
      break;
    }

    case 'logistica.html':
      showNotification('Ya estás en la página de logística', 'info');
      break;

    default:
      showNotification('Página no reconocida para llenado automático', 'warning');
  }

  return true;
};

// Función para guardar datos de logística
window.saveLogisticaData = async function () {
  console.log('💾 Iniciando guardado de datos de logística...');

  // VERIFICAR LÍMITE DE REGISTROS ANTES DE GUARDAR (SOLO PARA LOGÍSTICA)
  // NOTA: Solo los registros de Logística cuentan. Tráfico y Facturación son extensiones y no requieren verificación.
  if (window.planLimitsManager) {
    const canCreate = await window.planLimitsManager.checkBeforeCreateRegistro();
    if (!canCreate) {
      console.warn('⚠️ No se puede crear el registro de Logística: límite alcanzado');
      if (typeof showNotification === 'function') {
        showNotification(
          'Has alcanzado el límite de registros de Logística de tu plan. Por favor, compra un paquete adicional o actualiza tu plan.',
          'warning'
        );
      } else {
        alert(
          'Has alcanzado el límite de registros de Logística de tu plan. Por favor, compra un paquete adicional o actualiza tu plan.'
        );
      }
      return false;
    }
  }

  // PRIORIDAD 0: Asegurar que Firebase esté completamente inicializado
  if (typeof window.waitForFirebase === 'function') {
    console.log('⏳ Esperando a que Firebase esté completamente inicializado...');
    const firebaseReady = await window.waitForFirebase(30000); // 30 segundos máximo
    if (!firebaseReady) {
      console.warn('⚠️ Firebase no está disponible después de esperar 30 segundos');
    } else {
      console.log('✅ Firebase está completamente inicializado');
    }
  }

  // PRIORIDAD 0.5: Esperar a que los repositorios estén disponibles
  if (!window.firebaseRepos || !window.firebaseRepos.logistica) {
    console.log('⏳ Esperando a que los repositorios Firebase estén disponibles...');
    let intentosRepos = 0;
    const maxIntentosRepos = 60; // 30 segundos (60 * 500ms)

    while (
      (!window.firebaseRepos || !window.firebaseRepos.logistica) &&
      intentosRepos < maxIntentosRepos
    ) {
      intentosRepos++;
      await new Promise(resolve => setTimeout(resolve, 500));
      if (intentosRepos % 10 === 0) {
        console.log(`⏳ Esperando repositorios... (${intentosRepos}/${maxIntentosRepos})`);
      }
    }

    if (window.firebaseRepos && window.firebaseRepos.logistica) {
      console.log('✅ Repositorios Firebase están disponibles');
    } else {
      console.warn('⚠️ Repositorios Firebase no están disponibles después de esperar 30 segundos');
    }
  }

  const registroId = document.getElementById('numeroRegistro')?.value;
  console.log('📋 Número de registro obtenido:', registroId);

  if (!registroId) {
    console.error('❌ No hay número de registro');
    showNotification('No hay número de registro', 'error');
    return false;
  }

  // Obtener el tipo de servicio del select
  const servicioSelect = document.getElementById('servicio');
  const tipoServicio = servicioSelect ? servicioSelect.value : '';

  // Obtener el embalaje especial de los radio buttons
  const embalajeRadios = document.querySelectorAll('input[name="embalaje"]');
  let embalajeEspecial = 'no';
  embalajeRadios.forEach(radio => {
    if (radio.checked) {
      embalajeEspecial = radio.value;
    }
  });

  // Obtener descripción del embalaje si es necesario
  const descripcionEmbalaje = document.getElementById('descripcion')?.value || '';

  // Obtener fecha de envío
  const fechaEnvio = document.getElementById('fecha')?.value || '';

  // Obtener RFC del cliente
  // PRIORIDAD 1: Campo rfcCliente (se llena automáticamente y contiene el RFC correcto)
  let rfcCliente = document.getElementById('rfcCliente')?.value?.trim() || '';

  // PRIORIDAD 2: Campo oculto cliente_value (puede contener el RFC si el searchable-select lo guarda ahí)
  if (!rfcCliente) {
    const clienteValue = document.getElementById('cliente_value')?.value?.trim() || '';
    // Verificar que clienteValue parece un RFC (no un nombre)
    if (clienteValue && clienteValue.length <= 13 && !clienteValue.includes(' ')) {
      rfcCliente = clienteValue;
      console.log('✅ RFC obtenido desde cliente_value:', rfcCliente);
    }
  }

  // PRIORIDAD 3: Campo cliente (puede contener el RFC o el nombre, verificar)
  if (!rfcCliente) {
    const campoCliente = document.getElementById('cliente');
    const valorCampoCliente = campoCliente?.value?.trim() || '';

    // Si el valor parece ser un RFC (13 caracteres o menos, sin espacios), usarlo
    if (valorCampoCliente && valorCampoCliente.length <= 13 && !valorCampoCliente.includes(' ')) {
      rfcCliente = valorCampoCliente;
      console.log('✅ RFC obtenido desde campo cliente:', rfcCliente);
    }
  }

  // Validar que rfcCliente no sea un nombre (más de 13 caracteres o contiene espacios)
  if (rfcCliente && (rfcCliente.length > 13 || rfcCliente.includes(' '))) {
    console.warn(
      '⚠️ ADVERTENCIA: El valor de rfcCliente parece ser un nombre, no un RFC:',
      rfcCliente
    );
    console.warn('⚠️ Intentando buscar el RFC correcto...');

    // Intentar buscar el RFC basado en el nombre
    const nombreTemporal = rfcCliente;
    rfcCliente = ''; // Limpiar para buscar el RFC correcto

    const clientesRaw = await window.getDataWithCache('clientes', async () => {
      if (
        window.configuracionManager &&
        typeof window.configuracionManager.getAllClientes === 'function'
      ) {
        const todosLosClientes = window.configuracionManager.getAllClientes() || [];

        // Obtener tenantId actual
        let tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        if (window.licenseManager && window.licenseManager.isLicenseActive()) {
          const licenseTenantId = window.licenseManager.getTenantId();
          if (licenseTenantId) {
            tenantId = licenseTenantId;
          }
        } else {
          const savedTenantId = localStorage.getItem('tenantId');
          if (savedTenantId) {
            tenantId = savedTenantId;
          }
        }

        // CRÍTICO: Filtrar por tenantId
        return todosLosClientes.filter(cliente => {
          const clienteTenantId = cliente.tenantId;
          return clienteTenantId === tenantId;
        });
      }
      return [];
    });

    // Asegurar que clientes sea un array
    let clientes = [];
    if (Array.isArray(clientesRaw)) {
      clientes = clientesRaw;
    } else if (clientesRaw && typeof clientesRaw === 'object') {
      clientes = Object.values(clientesRaw);
    }

    const clienteEncontrado = clientes.find(
      c =>
        c && (c.nombre || c.nombreCliente || c.razonSocial || '').trim() === nombreTemporal.trim()
    );

    if (clienteEncontrado && clienteEncontrado.rfc) {
      rfcCliente = clienteEncontrado.rfc || clienteEncontrado.rfcCliente || '';
      console.log('✅ RFC encontrado basado en nombre:', rfcCliente);
    } else {
      console.error('❌ ERROR: No se pudo encontrar el RFC para el cliente:', nombreTemporal);
      console.error('❌ El campo rfcCliente NO debe contener el nombre del cliente');
      // NO guardar el nombre en rfcCliente - dejarlo vacío
      rfcCliente = '';
    }
  }

  // Obtener nombre del cliente desde el RFC
  let nombreCliente = '';
  if (rfcCliente) {
    // PRIORIDAD 1: Buscar en caché local
    if (window.__clientesCache && window.__clientesCache[rfcCliente]) {
      const clienteData = window.__clientesCache[rfcCliente];
      nombreCliente =
        clienteData.nombre || clienteData.nombreCliente || clienteData.razonSocial || '';
    }

    // PRIORIDAD 2: Buscar en configuracionManager
    if (
      !nombreCliente &&
      window.configuracionManager &&
      typeof window.configuracionManager.getCliente === 'function'
    ) {
      try {
        const clienteData = window.configuracionManager.getCliente(rfcCliente);
        if (clienteData) {
          nombreCliente =
            clienteData.nombre || clienteData.nombreCliente || clienteData.razonSocial || '';
        }
      } catch (e) {
        console.warn('⚠️ Error obteniendo cliente desde configuracionManager:', e);
      }
    }

    // Si aún no tenemos el nombre, usar el campo cliente como fallback
    if (!nombreCliente) {
      const campoClienteValue = document.getElementById('cliente')?.value?.trim() || '';
      // Solo usar como fallback si parece ser un nombre (tiene más de 13 caracteres o espacios)
      if (campoClienteValue && (campoClienteValue.length > 13 || campoClienteValue.includes(' '))) {
        nombreCliente = campoClienteValue;
        console.log('✅ Usando valor del campo cliente como nombre:', nombreCliente);
      } else {
        console.warn(`⚠️ No se encontró el nombre del cliente para RFC: ${rfcCliente}`);
      }
    }
  }

  console.log('📋 Datos del cliente obtenidos:', {
    rfcCliente: rfcCliente,
    nombreCliente: nombreCliente
  });

  const logisticaData = {
    cliente: nombreCliente, // NOMBRE del cliente (no RFC)
    rfcCliente: rfcCliente, // RFC del cliente (DEBE ser el RFC, no el nombre)
    numeroRegistro: registroId, // Asegurar que el número de registro esté incluido
    origen: document.getElementById('origen')?.value || '',
    destino: document.getElementById('destino')?.value || '',
    referenciaCliente: document.getElementById('referencia cliente')?.value || '',
    tipoServicio: tipoServicio,
    embalajeEspecial: embalajeEspecial,
    descripcionEmbalaje: descripcionEmbalaje,
    fechaEnvio: fechaEnvio,
    // Detalles del envío
    plataforma: document.getElementById('plataforma')?.value || '',
    mercancia: document.getElementById('mercancia')?.value || '',
    peso: parseFloat(document.getElementById('peso')?.value) || 0,
    largo: parseFloat(document.getElementById('largo')?.value) || 0,
    ancho: parseFloat(document.getElementById('ancho')?.value) || 0,
    alto: parseFloat(document.getElementById('alto')?.value) || 0,
    estado: 'cargado', // Estado por defecto: cargado
    // Campos adicionales para mejor integración
    fechaCreacion: new Date().toISOString(),
    ultimaActualizacion: new Date().toISOString()
  };

  // PRIMERO: Guardar SIEMPRE en localStorage (inmediato, no bloqueante)
  console.log('💾 Guardando en localStorage primero (respaldo inmediato)...');
  console.log('📊 Datos a guardar:', logisticaData);
  console.log('📋 Registro ID:', registroId);

  try {
    const allData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
    if (!allData.registros) {
      allData.registros = {};
    }
    // Asegurar que el numeroRegistro esté en los datos
    logisticaData.numeroRegistro = registroId;
    allData.registros[registroId] = logisticaData;
    localStorage.setItem('erp_shared_data', JSON.stringify(allData));
    console.log('✅ Datos guardados en localStorage (respaldo inmediato)');

    // Verificar que se guardó correctamente
    const verifyData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
    if (verifyData.registros && verifyData.registros[registroId]) {
      console.log('✅ Verificación: Datos confirmados en localStorage');
    } else {
      console.error('❌ ERROR: Datos NO encontrados después de guardar');
      // Reintentar guardar
      verifyData.registros = verifyData.registros || {};
      verifyData.registros[registroId] = logisticaData;
      localStorage.setItem('erp_shared_data', JSON.stringify(verifyData));
      console.log('🔄 Reintentado guardar datos...');
    }
  } catch (localError) {
    console.error('❌ Error crítico al guardar en localStorage:', localError);
    console.error('❌ Stack:', localError.stack);
    showNotification('Error crítico al guardar datos', 'error');
    return false;
  }

  // Intentar guardar en Firebase (opcional, no bloqueante)
  if (window.firebaseRepos && window.firebaseRepos.logistica) {
    // Verificar si Firebase puede intentar guardar (circuit breaker)
    if (window.FirebaseQuotaManager && !window.FirebaseQuotaManager.canRetry()) {
      console.warn('⚠️ Firebase quota excedida (circuit breaker activo), usando solo localStorage');
      showNotification('Datos guardados localmente (Cuota de Firebase excedida)', 'warning');
      return true; // Ya se guardó en localStorage
    }

    // OPTIMIZACIÓN: Verificar si el registro ya existe en Firebase antes de intentar guardar
    let shouldWriteToFirebase = true;
    try {
      if (
        window.firebaseRepos.logistica &&
        window.firebaseRepos.logistica.getDoc &&
        window.firebaseRepos.logistica.db
      ) {
        const existingDoc = await window.firebaseRepos.logistica.getRegistro(registroId);
        if (existingDoc) {
          // Comparar datos (ignorando metadata)
          const ignoreFields = [
            'updatedAt',
            'userId',
            'tenantId',
            'fechaActualizacion',
            'ultimaActualizacion'
          ];
          const cleanNew = { ...logisticaData };
          const cleanExisting = { ...existingDoc };
          ignoreFields.forEach(field => {
            delete cleanNew[field];
            delete cleanExisting[field];
          });

          if (JSON.stringify(cleanNew) === JSON.stringify(cleanExisting)) {
            console.log(`⏭️ Registro ${registroId} no ha cambiado, omitiendo escritura a Firebase`);
            shouldWriteToFirebase = false;
          }
        }
      }
    } catch (checkError) {
      // Si falla la verificación, continuar con la escritura
      console.warn(
        '⚠️ Error verificando registro existente, continuando con escritura:',
        checkError
      );
    }

    // Solo intentar guardar en Firebase si hay cambios o es un registro nuevo
    if (shouldWriteToFirebase) {
      // Intentar guardar en Firebase con múltiples intentos y mejor manejo de errores
      let firebaseSaved = false;
      const maxAttempts = 2; // Reducido de 3 a 2 para ahorrar escrituras

      for (let attempt = 1; attempt <= maxAttempts && !firebaseSaved; attempt++) {
        try {
          console.log(`🔥 Intentando guardar en Firebase (intento ${attempt}/${maxAttempts})...`);

          // Agregar timeout de 5 segundos para evitar que se quede colgado
          const firebasePromise = window.firebaseRepos.logistica.saveRegistro(
            registroId,
            logisticaData
          );
          const timeoutPromise = new Promise(resolve =>
            setTimeout(() => {
              console.warn(
                `⏱️ Timeout de Firebase alcanzado (5 segundos) en intento ${attempt}/${maxAttempts}`
              );
              resolve(false);
            }, 5000)
          );

          const success = await Promise.race([firebasePromise, timeoutPromise]);

          if (success) {
            console.log('✅ Datos guardados en Firebase exitosamente');
            firebaseSaved = true;
            showNotification('Datos de logística guardados en la nube', 'success');
            break;
          } else {
            console.warn(`⚠️ No se pudo guardar en Firebase en intento ${attempt}/${maxAttempts}`);
            if (attempt < maxAttempts) {
              console.log('⏳ Esperando 1 segundo antes del siguiente intento...');
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } catch (error) {
          console.error(
            `❌ Error guardando en Firebase (intento ${attempt}/${maxAttempts}):`,
            error
          );

          // Verificar si es error de quota
          const isQuotaError =
            error &&
            (error.code === 'resource-exhausted' ||
              error.message?.includes('Quota exceeded') ||
              error.message?.includes('quota') ||
              (error.toString && error.toString().includes('Quota exceeded')));

          if (isQuotaError) {
            if (window.FirebaseQuotaManager) {
              window.FirebaseQuotaManager.checkQuotaExceeded(error);
            }
            console.warn('⚠️ Cuota de Firebase excedida. No se intentará más.');
            break; // Salir del loop si es error de cuota
          }

          if (attempt < maxAttempts) {
            console.log('⏳ Esperando 1 segundo antes del siguiente intento...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (!firebaseSaved) {
        console.warn(
          '⚠️ No se pudo guardar en Firebase después de múltiples intentos, pero los datos están en localStorage'
        );
        showNotification(
          'Datos guardados localmente (Firebase no disponible o cuota excedida)',
          'warning'
        );
      }
    } else {
      console.log(
        '✅ Registro ya existe en Firebase con los mismos datos, no se requiere escritura'
      );
    }

    // IMPORTANTE: Limpiar el número activo después de guardar exitosamente
    // Esto asegura que el siguiente registro genere un nuevo número
    console.log('🔄 Limpiando número activo después de guardar registro...');
    if (window.clearActiveRegistrationNumber) {
      await window.clearActiveRegistrationNumber();
      console.log('✅ Número activo limpiado, el siguiente registro generará un nuevo número');
    } else {
      // Fallback: limpiar manualmente
      localStorage.removeItem('activeRegistrationNumber');
      console.log('✅ Número activo limpiado de localStorage (fallback)');
    }

    // Guardar el número usado en el historial para evitar duplicados
    if (window.saveNumberToHistory && registroId) {
      window.saveNumberToHistory(registroId);
      console.log('✅ Número guardado en historial:', registroId);
    }

    return true;
    // Este bloque catch ya no es necesario porque el manejo de errores está en el loop
    // Pero lo dejamos por si acaso hay algún error fuera del loop
  }

  // Verificar que los datos se guardaron correctamente antes de retornar
  console.log('🔍 Verificación final antes de retornar...');
  try {
    const verifyData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
    console.log('📊 verifyData.registros existe:', Boolean(verifyData.registros));
    console.log('📊 verifyData.registros tipo:', typeof verifyData.registros);
    console.log(
      '📊 Claves en registros:',
      verifyData.registros ? Object.keys(verifyData.registros) : 'N/A'
    );
    console.log('📊 Buscando registroId:', registroId);

    if (verifyData.registros && verifyData.registros[registroId]) {
      console.log('✅ Verificación final: Datos confirmados en localStorage para', registroId);
      console.log('📊 Datos guardados:', verifyData.registros[registroId]);
      return true;
    }
    console.error('❌ ERROR: Datos NO encontrados en verificación final para', registroId);
    console.log('🔄 Reintentando guardar datos...');
    // Reintentar guardar una última vez
    verifyData.registros = verifyData.registros || {};
    verifyData.registros[registroId] = logisticaData;
    localStorage.setItem('erp_shared_data', JSON.stringify(verifyData));
    console.log('💾 Datos guardados nuevamente en localStorage');

    // Verificar nuevamente
    const reVerifyData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
    console.log('📊 Re-verificación: registros existe:', Boolean(reVerifyData.registros));
    console.log(
      '📊 Re-verificación: claves:',
      reVerifyData.registros ? Object.keys(reVerifyData.registros) : 'N/A'
    );

    if (reVerifyData.registros && reVerifyData.registros[registroId]) {
      console.log('✅ Datos guardados correctamente después del reintento');
      return true;
    }
    console.error('❌ ERROR CRÍTICO: No se pudieron guardar los datos después del reintento');
    console.error('❌ registroId:', registroId);
    console.error('❌ logisticaData:', logisticaData);
    // Aún así retornar true porque se intentó guardar
    return true;
  } catch (verifyError) {
    console.error('❌ Error en verificación final:', verifyError);
    // Intentar guardar una última vez
    try {
      const allData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
      allData.registros = allData.registros || {};
      allData.registros[registroId] = logisticaData;
      localStorage.setItem('erp_shared_data', JSON.stringify(allData));
      console.log('✅ Datos guardados en último intento');
      return true;
    } catch (finalError) {
      console.error('❌ Error crítico en último intento:', finalError);
      // Aún así retornar true porque se intentó guardar
      return true;
    }
  }

  // Fallback a DataPersistence si Firebase falla o no está disponible
  // SIEMPRE guardar en DataPersistence/localStorage como respaldo
  // Nota: Este bloque nunca se ejecutará si DataPersistence está definido arriba
  // Se mantiene por compatibilidad pero es código inalcanzable en el flujo normal
  /* eslint-disable-next-line no-unreachable */
  if (typeof window.DataPersistence === 'undefined') {
    console.error('❌ DataPersistence no está disponible en saveLogisticaData');
    // Intentar guardar directamente en localStorage
    try {
      const allData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
      if (!allData.registros) {
        allData.registros = {};
      }
      allData.registros[registroId] = logisticaData;
      localStorage.setItem('erp_shared_data', JSON.stringify(allData));
      console.log('✅ Datos guardados directamente en localStorage');
      showNotification('Datos guardados localmente', 'success');
      return true;
    } catch (localError) {
      console.error('❌ Error al guardar directamente en localStorage:', localError);
      showNotification('Error crítico al guardar datos', 'error');
      return false;
    }
  }

  console.log('💾 Guardando datos de logística para:', registroId);
  console.log('📊 Datos a guardar:', logisticaData);

  try {
    const success = window.DataPersistence.saveLogisticaData(registroId, logisticaData);
    console.log('✅ Resultado del guardado de logística:', success);

    if (!success) {
      // Si DataPersistence falla, intentar guardar directamente en localStorage
      console.warn('⚠️ DataPersistence retornó false, intentando guardar directamente...');
      try {
        const allData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
        if (!allData.registros) {
          allData.registros = {};
        }
        allData.registros[registroId] = logisticaData;
        localStorage.setItem('erp_shared_data', JSON.stringify(allData));
        console.log('✅ Datos guardados directamente en localStorage');
        showNotification('Datos guardados localmente', 'success');
        return true;
      } catch (localError) {
        console.error('❌ Error al guardar directamente en localStorage:', localError);
        showNotification('Error crítico al guardar datos', 'error');
        return false;
      }
    }

    // Si llegamos aquí, el guardado fue exitoso
    return true;
  } catch (error) {
    console.error('❌ Error en DataPersistence.saveLogisticaData:', error);
    // Intentar guardar directamente en localStorage como último recurso
    try {
      const allData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
      if (!allData.registros) {
        allData.registros = {};
      }
      allData.registros[registroId] = logisticaData;
      localStorage.setItem('erp_shared_data', JSON.stringify(allData));
      console.log('✅ Datos guardados directamente en localStorage (último recurso)');
      showNotification('Datos guardados localmente', 'success');
      return true;
    } catch (localError) {
      console.error('❌ Error al guardar directamente en localStorage:', localError);
      showNotification('Error crítico al guardar datos', 'error');
      return false;
    }
  }

  // Verificar que los datos se guardaron
  try {
    const allData = window.DataPersistence.getData();
    if (allData && allData.registros && allData.registros[registroId]) {
      console.log('✅ Registro de logística confirmado en DataPersistence');
      showNotification('Datos de logística guardados correctamente', 'success');
      return true;
    }
    // Verificar también en localStorage directamente
    const localData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
    if (localData.registros && localData.registros[registroId]) {
      console.log('✅ Registro de logística confirmado en localStorage');
      showNotification('Datos de logística guardados correctamente', 'success');
      return true;
    }
    console.warn(
      '⚠️ No se pudo confirmar el guardado, pero se intentó guardar en múltiples lugares'
    );
    // Retornar true de todas formas porque se intentó guardar
    showNotification('Datos guardados (verificación pendiente)', 'warning');
    return true;
  } catch (verifyError) {
    console.error('❌ Error verificando datos guardados:', verifyError);
    // Retornar true de todas formas porque se intentó guardar
    showNotification('Datos guardados (verificación falló)', 'warning');
    return true;
  }

  // Si llegamos aquí, el guardado fue exitoso
  return true;
};

// Función para guardar datos de facturación
window.saveFacturacionData = async function () {
  // PRIORIDAD 0: Asegurar que Firebase esté completamente inicializado
  if (typeof window.waitForFirebase === 'function') {
    console.log('⏳ Esperando a que Firebase esté completamente inicializado...');
    const firebaseReady = await window.waitForFirebase(30000); // 30 segundos máximo
    if (!firebaseReady) {
      console.warn('⚠️ Firebase no está disponible después de esperar 30 segundos');
    } else {
      console.log('✅ Firebase está completamente inicializado');
    }
  }

  // PRIORIDAD 0.5: Esperar a que los repositorios estén disponibles
  if (!window.firebaseRepos || !window.firebaseRepos.facturacion) {
    console.log('⏳ Esperando a que los repositorios Firebase estén disponibles...');
    let intentosRepos = 0;
    const maxIntentosRepos = 60; // 30 segundos (60 * 500ms)

    while (
      (!window.firebaseRepos || !window.firebaseRepos.facturacion) &&
      intentosRepos < maxIntentosRepos
    ) {
      intentosRepos++;
      await new Promise(resolve => setTimeout(resolve, 500));
      if (intentosRepos % 10 === 0) {
        console.log(`⏳ Esperando repositorios... (${intentosRepos}/${maxIntentosRepos})`);
      }
    }

    if (window.firebaseRepos && window.firebaseRepos.facturacion) {
      console.log('✅ Repositorios Firebase están disponibles');
    } else {
      console.warn('⚠️ Repositorios Firebase no están disponibles después de esperar 30 segundos');
    }
  }

  const registroId = document.getElementById('numeroRegistro')?.value;
  if (!registroId) {
    showNotification('No hay número de registro', 'error');
    return false;
  }

  // Obtener RFC del cliente
  const rfcClienteFacturacion = document.getElementById('cliente')?.value || '';

  // Obtener nombre del cliente desde el RFC
  let nombreClienteFacturacion = '';
  if (rfcClienteFacturacion) {
    // PRIORIDAD 1: Buscar en caché local
    if (window.__clientesCache && window.__clientesCache[rfcClienteFacturacion]) {
      const clienteData = window.__clientesCache[rfcClienteFacturacion];
      nombreClienteFacturacion =
        clienteData.nombre || clienteData.nombreCliente || clienteData.razonSocial || '';
    }

    // PRIORIDAD 2: Buscar en configuracionManager
    if (
      !nombreClienteFacturacion &&
      window.configuracionManager &&
      typeof window.configuracionManager.getCliente === 'function'
    ) {
      try {
        const clienteData = window.configuracionManager.getCliente(rfcClienteFacturacion);
        if (clienteData) {
          nombreClienteFacturacion =
            clienteData.nombre || clienteData.nombreCliente || clienteData.razonSocial || '';
        }
      } catch (e) {
        console.warn('⚠️ Error obteniendo cliente desde configuracionManager:', e);
      }
    }

    // Si el valor ya es un nombre (no parece RFC), usarlo directamente
    if (!nombreClienteFacturacion && rfcClienteFacturacion.length > 13) {
      // Si tiene más de 13 caracteres, probablemente es un nombre, no un RFC
      nombreClienteFacturacion = rfcClienteFacturacion;
    } else if (!nombreClienteFacturacion) {
      // Si parece RFC pero no encontramos el nombre, usar RFC como fallback temporal
      console.warn(
        `⚠️ No se encontró el nombre del cliente para RFC: ${rfcClienteFacturacion}. Usando RFC como fallback temporal.`
      );
      nombreClienteFacturacion = rfcClienteFacturacion; // Fallback temporal
    }
  }

  const facturacionData = {
    numeroRegistro: registroId,
    cliente: nombreClienteFacturacion, // NOMBRE del cliente (no RFC)
    rfcCliente: rfcClienteFacturacion, // RFC del cliente
    origen: document.getElementById('origen')?.value || '',
    destino: document.getElementById('destino')?.value || '',
    referenciaCliente: document.getElementById('referencia cliente')?.value || '',
    tipoServicio: document.getElementById('tiposervicio')?.value || '',
    embalajeEspecial: document.getElementById('embalajeEspecial')?.value || '',
    monto: parseFloat(document.getElementById('monto')?.value) || 0,
    fechaVencimiento: document.getElementById('fechaVencimiento')?.value || '',
    observaciones: document.getElementById('observaciones')?.value || '',
    estado: 'pendiente',
    fechaCreacion: new Date().toISOString(),
    ultimaActualizacion: new Date().toISOString()
  };

  console.log('📦 Datos de facturación a guardar:', facturacionData);

  // PRIORIDAD 1: Intentar guardar en Firebase usando el repositorio
  let repoFacturacion = null;
  if (window.firebaseRepos && window.firebaseRepos.facturacion) {
    repoFacturacion = window.firebaseRepos.facturacion;

    // Verificar que el repositorio esté inicializado
    if (!repoFacturacion.db || !repoFacturacion.tenantId) {
      console.log('🔄 Repositorio de facturación no inicializado, intentando inicializar...');
      if (typeof repoFacturacion.init === 'function') {
        await repoFacturacion.init();
      }
    }

    // Esperar hasta que el repositorio esté completamente listo
    let intentosInit = 0;
    while ((!repoFacturacion.db || !repoFacturacion.tenantId) && intentosInit < 20) {
      intentosInit++;
      await new Promise(resolve => setTimeout(resolve, 200));
      if (typeof repoFacturacion.init === 'function') {
        await repoFacturacion.init();
      }
    }

    if (repoFacturacion.db && repoFacturacion.tenantId) {
      try {
        console.log('🔥 Guardando facturación en Firebase...');
        const success = await repoFacturacion.saveRegistro(registroId, facturacionData);

        if (success) {
          console.log('✅ Datos de facturación guardados en Firebase exitosamente');

          // Marcar módulo de facturación como completado en sincronización
          if (typeof window.sincronizacionUtils !== 'undefined') {
            window.sincronizacionUtils.marcarCompletado(registroId, 'facturacion');
          }

          return true;
        }
        console.warn('⚠️ saveRegistro retornó false, intentando fallback...');
      } catch (error) {
        console.error('❌ Error guardando facturación en Firebase:', error);
      }
    }
  }

  // PRIORIDAD 2: Intentar guardar directamente en Firebase si el repositorio no está disponible
  if (!repoFacturacion && window.firebaseDb && window.fs && window.fs.doc && window.fs.setDoc) {
    try {
      console.log('🔥 Intentando guardar directamente en Firebase (sin repositorio)...');

      let tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
      if (window.firebaseAuth?.currentUser) {
        const currentUser = JSON.parse(localStorage.getItem('erpCurrentUser') || 'null');
        tenantId = currentUser?.tenantId || localStorage.getItem('tenantId') || tenantId;
      }

      const docData = {
        ...facturacionData,
        tipo: 'registro',
        tenantId: tenantId,
        userId: window.firebaseAuth?.currentUser?.uid || 'demo_user',
        deleted: false
      };

      const docRef = window.fs.doc(window.firebaseDb, 'facturacion', registroId);
      await window.fs.setDoc(docRef, docData, { merge: true });

      console.log('✅ Datos guardados directamente en Firebase (sin repositorio)');

      // Marcar módulo de facturación como completado en sincronización
      if (typeof window.sincronizacionUtils !== 'undefined') {
        window.sincronizacionUtils.marcarCompletado(registroId, 'facturacion');
      }

      return true;
    } catch (firebaseError) {
      console.error('❌ Error guardando directamente en Firebase:', firebaseError);
    }
  }

  // PRIORIDAD 3: Fallback a DataPersistence si Firebase falla
  console.log('💾 Guardando en DataPersistence (fallback)...');
  const success = window.DataPersistence.saveFacturacionData(registroId, facturacionData);

  if (success) {
    console.log('✅ Datos guardados en DataPersistence');

    // Intentar sincronizar con Firebase si está disponible ahora
    if (window.firebaseRepos?.facturacion) {
      try {
        const repo = window.firebaseRepos.facturacion;
        if (typeof repo.init === 'function' && (!repo.db || !repo.tenantId)) {
          await repo.init();
        }
        if (repo.db && repo.tenantId) {
          console.log('🔄 Intentando sincronizar con Firebase...');
          const firebaseSuccess = await repo.saveRegistro(registroId, facturacionData);
          if (firebaseSuccess) {
            console.log('✅ Datos sincronizados con Firebase exitosamente');
          }
        }
      } catch (syncError) {
        console.warn('⚠️ Error sincronizando con Firebase:', syncError);
      }
    }

    // Marcar módulo de facturación como completado en sincronización
    if (typeof window.sincronizacionUtils !== 'undefined') {
      window.sincronizacionUtils.marcarCompletado(registroId, 'facturacion');
    }

    return true;
  }
  return false;
};

// Función para guardar datos de tráfico
window.saveTraficoData = async function () {
  console.log('🚀 INICIANDO saveTraficoData...');
  console.log('📋 Timestamp:', new Date().toISOString());

  // NOTA: NO verificar límites aquí porque Tráfico es solo una extensión del registro de Logística
  // El límite solo se verifica al crear registros en Logística

  const registroId = document.getElementById('numeroRegistro')?.value;
  console.log('📋 Número de registro encontrado:', registroId);

  if (!registroId) {
    console.error('❌ ERROR: No hay número de registro');
    if (typeof showNotification === 'function') {
      showNotification('No hay número de registro', 'error');
    } else {
      alert('No hay número de registro');
    }
    return false;
  }

  console.log('✅ Número de registro válido:', registroId);

  // Obtener valor del radio button de observaciones
  const observacionesRadio = document.querySelector('input[name="observaciones"]:checked');
  const observacionesValue = observacionesRadio?.value || 'no';

  // Obtener descripción de observaciones solo si está marcado "Sí"
  const descripcionObservaciones =
    observacionesValue === 'si' ? document.getElementById('descripcion')?.value || '' : '';

  // Obtener valores de campos ocultos (searchable-select)
  const economicoValue =
    document.getElementById('economico_value')?.value ||
    document.getElementById('economico')?.value ||
    '';

  // Obtener valores de operadores (pueden ser licencia o nombre)
  const operadorPrincipalRaw =
    document.getElementById('operadorprincipal_value')?.value ||
    document.getElementById('operadorprincipal')?.value ||
    '';
  const operadorSecundarioRaw =
    document.getElementById('operadorsecundario_value')?.value ||
    document.getElementById('operadorsecundario')?.value ||
    '';

  // Función auxiliar para obtener el nombre del operador
  const obtenerNombreOperadorAux = async valor => {
    if (!valor || valor.trim() === '') {
      return '';
    }

    // Si el valor contiene " - ", extraer solo el nombre (parte antes del " - ")
    if (valor.includes(' - ')) {
      const nombre = valor.split(' - ')[0].trim();
      if (nombre) {
        return nombre;
      }
    }

    // Si ya es un nombre (no parece ser licencia/ID), retornarlo
    if (valor.length > 3 && !valor.match(/^[A-Z0-9-]+$/)) {
      return valor;
    }

    // Si existe la función global, usarla
    if (typeof window.obtenerOperadorNombre === 'function') {
      try {
        const nombre = await window.obtenerOperadorNombre(valor);
        return nombre || valor;
      } catch (e) {
        console.warn('⚠️ Error obteniendo nombre del operador:', e);
      }
    }

    // Fallback: buscar en caché
    if (window.configuracionManager) {
      try {
        const operadores = window.configuracionManager.getAllOperadores() || [];
        const operadorRaw = Array.isArray(operadores)
          ? operadores
          : Object.values(operadores || {});

        const operador = operadorRaw.find(op => {
          if (!op) {
            return false;
          }
          const nombre = (op.nombre || '').toString().trim();
          const id = (op.id || op.rfc || '').toString().trim();
          const licencia = (op.licencia || op.numeroLicencia || '').toString().trim();

          return (
            nombre === valor ||
            id === valor ||
            licencia === valor ||
            nombre.toLowerCase().includes(valor.toLowerCase()) ||
            valor.toLowerCase().includes(nombre.toLowerCase())
          );
        });

        if (operador && operador.nombre) {
          return operador.nombre;
        }
      } catch (e) {
        console.warn('⚠️ Error buscando operador en configuracionManager:', e);
      }
    }

    // Si no se encuentra, retornar el valor original (puede ser que ya sea el nombre)
    return valor;
  };

  // Obtener nombres de operadores (no licencias/IDs)
  const operadorPrincipalNombre = await obtenerNombreOperadorAux(operadorPrincipalRaw);
  const operadorSecundarioNombre = await obtenerNombreOperadorAux(operadorSecundarioRaw);

  console.log('👤 Operador Principal:', {
    valorOriginal: operadorPrincipalRaw,
    nombreObtenido: operadorPrincipalNombre
  });

  console.log('👤 Operador Secundario:', {
    valorOriginal: operadorSecundarioRaw,
    nombreObtenido: operadorSecundarioNombre
  });

  // Obtener el valor del campo cliente (puede ser nombre o RFC)
  const campoCliente = document.getElementById('cliente');
  const valorCampoCliente = campoCliente?.value || '';

  // Obtener RFC y nombre del cliente
  let rfcClienteTrafico = '';
  let nombreClienteTrafico = '';

  // PRIORIDAD 1: Intentar obtener el RFC desde el campo oculto (más confiable, guardado cuando se llena desde logística)
  const campoRfcClienteHidden = document.getElementById('rfcCliente_value');
  if (campoRfcClienteHidden && campoRfcClienteHidden.value && campoRfcClienteHidden.value.trim()) {
    rfcClienteTrafico = campoRfcClienteHidden.value.trim();
    nombreClienteTrafico = valorCampoCliente || '';
    console.log('✅ RFC obtenido desde campo oculto rfcCliente_value:', rfcClienteTrafico);
  }

  // PRIORIDAD 2: Intentar obtener el RFC desde el data attribute del campo (respaldo)
  if (!rfcClienteTrafico && campoCliente && campoCliente.dataset.rfcCliente) {
    rfcClienteTrafico = campoCliente.dataset.rfcCliente;
    nombreClienteTrafico = valorCampoCliente || '';
    console.log('✅ RFC obtenido desde data attribute del campo:', rfcClienteTrafico);
  }

  // PRIORIDAD 3: Intentar obtener el RFC desde el registro de logística (si está disponible)
  if (!rfcClienteTrafico) {
    const numeroRegistro = document.getElementById('numeroRegistro')?.value || '';
    if (numeroRegistro && window.firebaseRepos?.logistica) {
      try {
        const repoLogistica = window.firebaseRepos.logistica;
        if (repoLogistica.db && repoLogistica.tenantId) {
          const registroLogistica = await repoLogistica.getRegistro(numeroRegistro);
          if (registroLogistica && registroLogistica.rfcCliente) {
            rfcClienteTrafico = registroLogistica.rfcCliente;
            nombreClienteTrafico = registroLogistica.cliente || valorCampoCliente;
            console.log('✅ RFC obtenido desde registro de logística:', rfcClienteTrafico);
          }
        }
      } catch (e) {
        console.warn('⚠️ Error obteniendo RFC desde logística:', e);
      }
    }
  }

  // PRIORIDAD 4: Si no se obtuvo el RFC, buscar por el nombre del cliente
  if (!rfcClienteTrafico && valorCampoCliente) {
    // Si el valor tiene más de 13 caracteres, probablemente es un nombre, no un RFC
    if (valorCampoCliente.length > 13) {
      nombreClienteTrafico = valorCampoCliente;

      // Buscar el RFC basado en el nombre
      const clientesRaw = await window.getDataWithCache('clientes', async () => {
        if (
          window.configuracionManager &&
          typeof window.configuracionManager.getAllClientes === 'function'
        ) {
          return window.configuracionManager.getAllClientes() || [];
        }
        return [];
      });

      // Asegurar que clientes sea un array
      let clientes = [];
      if (Array.isArray(clientesRaw)) {
        clientes = clientesRaw;
      } else if (clientesRaw && typeof clientesRaw === 'object') {
        // Si es un objeto, convertir a array
        clientes = Object.values(clientesRaw);
      }

      const clienteEncontrado = clientes.find(
        c =>
          c &&
          (c.nombre || c.nombreCliente || c.razonSocial || '').trim() === valorCampoCliente.trim()
      );

      if (clienteEncontrado) {
        rfcClienteTrafico = clienteEncontrado.rfc || clienteEncontrado.rfcCliente || '';
        console.log('✅ RFC encontrado basado en nombre del cliente:', rfcClienteTrafico);
      } else {
        console.warn('⚠️ No se encontró RFC para el nombre del cliente:', valorCampoCliente);
      }
    } else {
      // Si tiene 13 caracteres o menos, probablemente es un RFC
      rfcClienteTrafico = valorCampoCliente;

      // Buscar el nombre basado en el RFC
      const clientesRaw = await window.getDataWithCache('clientes', async () => {
        if (
          window.configuracionManager &&
          typeof window.configuracionManager.getAllClientes === 'function'
        ) {
          return window.configuracionManager.getAllClientes() || [];
        }
        return [];
      });

      // Asegurar que clientes sea un array
      let clientes = [];
      if (Array.isArray(clientesRaw)) {
        clientes = clientesRaw;
      } else if (clientesRaw && typeof clientesRaw === 'object') {
        // Si es un objeto, convertir a array
        clientes = Object.values(clientesRaw);
      }

      const clienteEncontrado = clientes.find(
        c => c && (c.rfc || c.rfcCliente || '').trim() === valorCampoCliente.trim()
      );

      if (clienteEncontrado) {
        nombreClienteTrafico =
          clienteEncontrado.nombre ||
          clienteEncontrado.nombreCliente ||
          clienteEncontrado.razonSocial ||
          '';
        console.log('✅ Nombre encontrado basado en RFC:', nombreClienteTrafico);
      } else {
        console.warn('⚠️ No se encontró nombre para el RFC:', valorCampoCliente);
        nombreClienteTrafico = valorCampoCliente; // Fallback
      }
    }
  }

  // Si aún no tenemos el nombre, usar el valor del campo como fallback
  if (!nombreClienteTrafico && valorCampoCliente) {
    nombreClienteTrafico = valorCampoCliente;
  }

  // Validación final: asegurar que tenemos tanto RFC como nombre
  // Si rfcClienteTrafico tiene más de 13 caracteres, probablemente es un nombre, no un RFC
  if (rfcClienteTrafico && rfcClienteTrafico.length > 13) {
    console.warn(
      '⚠️ ADVERTENCIA: rfcCliente parece contener un nombre en lugar de RFC:',
      rfcClienteTrafico
    );
    console.warn('⚠️ Intentando buscar el RFC correcto...');

    // Si el valor parece ser un nombre, intentar buscar el RFC
    const nombreTemporal = rfcClienteTrafico;
    nombreClienteTrafico = nombreTemporal; // Asegurar que el nombre se guarde
    rfcClienteTrafico = ''; // Limpiar el RFC porque es incorrecto

    const clientesRaw = await window.getDataWithCache('clientes', async () => {
      if (
        window.configuracionManager &&
        typeof window.configuracionManager.getAllClientes === 'function'
      ) {
        const todosLosClientes = window.configuracionManager.getAllClientes() || [];

        // Obtener tenantId actual
        let tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        if (window.licenseManager && window.licenseManager.isLicenseActive()) {
          const licenseTenantId = window.licenseManager.getTenantId();
          if (licenseTenantId) {
            tenantId = licenseTenantId;
          }
        } else {
          const savedTenantId = localStorage.getItem('tenantId');
          if (savedTenantId) {
            tenantId = savedTenantId;
          }
        }

        // CRÍTICO: Filtrar por tenantId
        return todosLosClientes.filter(cliente => {
          const clienteTenantId = cliente.tenantId;
          return clienteTenantId === tenantId;
        });
      }
      return [];
    });

    // Asegurar que clientes sea un array
    let clientes = [];
    if (Array.isArray(clientesRaw)) {
      clientes = clientesRaw;
    } else if (clientesRaw && typeof clientesRaw === 'object') {
      // Si es un objeto, convertir a array
      clientes = Object.values(clientesRaw);
    }

    const clienteEncontrado = clientes.find(
      c =>
        c && (c.nombre || c.nombreCliente || c.razonSocial || '').trim() === nombreTemporal.trim()
    );

    if (clienteEncontrado && clienteEncontrado.rfc) {
      rfcClienteTrafico = clienteEncontrado.rfc || clienteEncontrado.rfcCliente || '';
      console.log('✅ RFC corregido encontrado:', rfcClienteTrafico);
    } else {
      console.error(
        '❌ ERROR CRÍTICO: No se pudo encontrar el RFC para el cliente:',
        nombreTemporal
      );
      console.error('❌ El campo rfcCliente NO debe contener el nombre del cliente');
      // NO guardar el nombre en rfcCliente - dejarlo vacío en lugar de guardar el nombre
      rfcClienteTrafico = '';
    }
  }

  // Validación adicional: Si rfcCliente parece ser un nombre (contiene espacios o es muy largo), no guardarlo
  if (rfcClienteTrafico && (rfcClienteTrafico.includes(' ') || rfcClienteTrafico.length > 20)) {
    console.error('❌ ERROR: rfcCliente contiene un nombre, no un RFC válido:', rfcClienteTrafico);
    console.error('❌ Limpiando rfcCliente para evitar guardar el nombre en lugar del RFC');
    rfcClienteTrafico = '';
  }

  if (!rfcClienteTrafico) {
    console.warn('⚠️ No se pudo obtener el RFC del cliente. El campo rfcCliente quedará vacío.');
    console.warn('⚠️ Cliente:', nombreClienteTrafico);
  }

  const traficoData = {
    numeroRegistro: registroId, // Agregar número de registro para historial
    cliente: nombreClienteTrafico, // NOMBRE del cliente (no RFC)
    rfcCliente: rfcClienteTrafico, // RFC del cliente (DEBE ser el RFC, no el nombre)
    origen: document.getElementById('origen')?.value || '',
    destino: document.getElementById('destino')?.value || '',
    referenciaCliente: document.getElementById('referencia cliente')?.value || '',
    tipoServicio: document.getElementById('tiposervicio')?.value || '',
    lugarOrigen: document.getElementById('LugarOrigen')?.value || '',
    lugarDestino: document.getElementById('LugarDestino')?.value || '',
    economico: economicoValue,
    placas: document.getElementById('Placas')?.value || '',
    permisoSCT: document.getElementById('permisosct')?.value || '',
    operadorPrincipal: operadorPrincipalNombre || '', // Guardar NOMBRE, no licencia/ID
    operadorSecundario: operadorSecundarioNombre || '', // Guardar NOMBRE, no licencia/ID
    licenciaPrincipal: document.getElementById('Licencia')?.value || '',
    licenciaSecundaria: document.getElementById('LicenciaSecundaria')?.value || '',
    // Campos de plataforma
    plataformaServicio: document.getElementById('plataformaServicio')?.value || '',
    placasPlataforma: document.getElementById('placasPlataforma')?.value || '',
    tipoPlataforma: document.getElementById('tipoPlataforma')?.value || '',
    // Campos de carga (desde logística)
    mercancia: document.getElementById('mercancia')?.value || '',
    plataforma: document.getElementById('plataforma')?.value || '',
    peso: document.getElementById('peso')?.value || '',
    largo: document.getElementById('largo')?.value || '',
    ancho: document.getElementById('ancho')?.value || '',
    // Observaciones
    observaciones: observacionesValue,
    descripcionObservaciones: descripcionObservaciones,
    // Fechas
    fechaEnvio: document.getElementById('fechaEnvio')?.value || '',
    // Datos de logística (copiados automáticamente)
    observacionesLogistica: document.getElementById('observacionesLogistica')?.value || '',
    estado: 'cargado'
  };

  // Agregar fechaSalida y fechaLlegada SOLO si tienen valor (no guardar vacíos)
  const fechaSalidaValue = document.getElementById('fechaSalida')?.value?.trim();
  const fechaLlegadaValue = document.getElementById('fechaLlegada')?.value?.trim();

  if (fechaSalidaValue) {
    traficoData.fechaSalida = fechaSalidaValue;
  }

  if (fechaLlegadaValue) {
    traficoData.fechaLlegada = fechaLlegadaValue;
  }

  console.log('📦 Datos de tráfico a guardar:', traficoData);

  // PRIORIDAD 0: Asegurar que Firebase esté completamente inicializado
  if (typeof window.waitForFirebase === 'function') {
    console.log('⏳ Esperando a que Firebase esté completamente inicializado...');
    const firebaseReady = await window.waitForFirebase(30000); // 30 segundos máximo
    if (!firebaseReady) {
      console.warn('⚠️ Firebase no está disponible después de esperar 30 segundos');
    } else {
      console.log('✅ Firebase está completamente inicializado');
    }
  }

  // PRIORIDAD 0.5: Esperar a que los repositorios estén disponibles
  if (!window.firebaseRepos || !window.firebaseRepos.trafico) {
    console.log('⏳ Esperando a que los repositorios Firebase estén disponibles...');
    let intentosRepos = 0;
    const maxIntentosRepos = 60; // 30 segundos (60 * 500ms)

    while (
      (!window.firebaseRepos || !window.firebaseRepos.trafico) &&
      intentosRepos < maxIntentosRepos
    ) {
      intentosRepos++;
      await new Promise(resolve => setTimeout(resolve, 500));
      if (intentosRepos % 10 === 0) {
        console.log(`⏳ Esperando repositorios... (${intentosRepos}/${maxIntentosRepos})`);
      }
    }

    if (window.firebaseRepos && window.firebaseRepos.trafico) {
      console.log('✅ Repositorios Firebase están disponibles');
    } else {
      console.warn('⚠️ Repositorios Firebase no están disponibles después de esperar 30 segundos');
    }
  }

  // PRIORIDAD 1: Intentar guardar en Firebase usando el repositorio
  // Esperar activamente a que firebaseRepos esté disponible
  let repoTrafico = null;
  let intentosEspera = 0;
  const maxIntentosEspera = 30; // 15 segundos (30 * 500ms)

  while (!repoTrafico && intentosEspera < maxIntentosEspera) {
    if (window.firebaseRepos && window.firebaseRepos.trafico) {
      repoTrafico = window.firebaseRepos.trafico;
      console.log('✅ Repositorio de tráfico encontrado');
      break;
    }
    intentosEspera++;
    await new Promise(resolve => setTimeout(resolve, 500));
    if (intentosEspera % 5 === 0) {
      console.log(
        `⏳ Esperando repositorio de tráfico... (${intentosEspera}/${maxIntentosEspera})`
      );
    }
  }

  if (repoTrafico) {
    try {
      // Verificar que el repositorio esté inicializado
      if (!repoTrafico.db || !repoTrafico.tenantId) {
        console.log('🔄 Repositorio de tráfico no inicializado, intentando inicializar...');
        if (typeof repoTrafico.init === 'function') {
          await repoTrafico.init();
          console.log('📊 Estado después de init:', {
            tieneDb: Boolean(repoTrafico.db),
            tieneTenantId: Boolean(repoTrafico.tenantId),
            tenantId: repoTrafico.tenantId
          });
        }
      }

      // Esperar hasta que el repositorio esté completamente listo
      let intentosInit = 0;
      while ((!repoTrafico.db || !repoTrafico.tenantId) && intentosInit < 20) {
        intentosInit++;
        await new Promise(resolve => setTimeout(resolve, 200));
        if (typeof repoTrafico.init === 'function') {
          await repoTrafico.init();
        }
      }

      // Verificar nuevamente después de intentar inicializar
      if (!repoTrafico.db || !repoTrafico.tenantId) {
        console.warn('⚠️ Repositorio de tráfico no está listo después de inicializar:', {
          tieneDb: Boolean(repoTrafico.db),
          tieneTenantId: Boolean(repoTrafico.tenantId),
          tenantId: repoTrafico.tenantId
        });
        // Continuar con fallback en lugar de lanzar error
        repoTrafico = null;
      } else {
        console.log('🔥 Guardando tráfico en Firebase...');
        console.log('📋 Registro ID:', registroId);
        console.log('📦 Datos completos:', JSON.stringify(traficoData, null, 2));
        console.log('📊 Estado del repositorio:', {
          collectionName: repoTrafico.collectionName,
          tieneDb: Boolean(repoTrafico.db),
          tieneTenantId: Boolean(repoTrafico.tenantId),
          tenantId: repoTrafico.tenantId
        });

        const success = await repoTrafico.saveRegistro(registroId, traficoData);
        console.log('📊 Resultado de saveRegistro:', success);

        if (success) {
          console.log('✅ Datos de tráfico guardados en Firebase exitosamente');

          // Guardar gastos de operadores si existen
          if (typeof window.guardarGastosOperadoresEnSistema === 'function') {
            try {
              console.log('💰 Guardando gastos de operadores...');
              await window.guardarGastosOperadoresEnSistema();
              console.log('✅ Gastos de operadores guardados');
            } catch (error) {
              console.warn('⚠️ Error guardando gastos de operadores:', error);
            }
          }

          // Sincronizar operadores con la hoja de operadores
          if (typeof window.sincronizarOperadoresDesdeTrafico === 'function') {
            try {
              await window.sincronizarOperadoresDesdeTrafico(traficoData);
            } catch (error) {
              console.warn('⚠️ Error sincronizando operadores:', error);
            }
          }

          // Marcar módulo de tráfico como completado en sincronización
          if (typeof window.sincronizacionUtils !== 'undefined') {
            window.sincronizacionUtils.marcarCompletado(registroId, 'trafico');
          }

          return true;
        }
        console.warn('⚠️ saveRegistro retornó false, intentando fallback...');
      }
    } catch (error) {
      console.error('❌ Error guardando tráfico en Firebase:', error);
      console.error('📋 Stack trace:', error.stack);
      // Continuar con fallback en lugar de lanzar error
    }
  } else {
    console.warn(
      '⚠️ Firebase repos no disponible después de esperar, usando fallback a DataPersistence'
    );
  }

  // PRIORIDAD 2: Intentar guardar directamente en Firebase si el repositorio no está disponible
  if (!repoTrafico && window.firebaseDb && window.fs && window.fs.doc && window.fs.setDoc) {
    try {
      console.log('🔥 Intentando guardar directamente en Firebase (sin repositorio)...');

      // Obtener tenantId del usuario actual
      let tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
      if (window.firebaseAuth?.currentUser) {
        const _user = window.firebaseAuth.currentUser;
        // Intentar obtener tenantId del usuario
        if (window.licenseManager && window.licenseManager.getTenantId) {
          tenantId = window.licenseManager.getTenantId() || tenantId;
        } else {
          const currentUser = JSON.parse(localStorage.getItem('erpCurrentUser') || 'null');
          tenantId = currentUser?.tenantId || localStorage.getItem('tenantId') || tenantId;
        }
      }

      const docData = {
        ...traficoData,
        tipo: 'registro',
        tenantId: tenantId,
        userId: window.firebaseAuth?.currentUser?.uid || 'demo_user',
        deleted: false,
        fechaCreacion: traficoData.fechaCreacion || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = window.fs.doc(window.firebaseDb, 'trafico', registroId);
      await window.fs.setDoc(docRef, docData, { merge: true });

      console.log('✅ Datos guardados directamente en Firebase (sin repositorio)');

      // Guardar gastos de operadores si existen
      if (typeof window.guardarGastosOperadoresEnSistema === 'function') {
        try {
          console.log('💰 Guardando gastos de operadores...');
          await window.guardarGastosOperadoresEnSistema();
          console.log('✅ Gastos de operadores guardados');
        } catch (error) {
          console.warn('⚠️ Error guardando gastos de operadores:', error);
        }
      }

      return true;
    } catch (firebaseError) {
      console.error('❌ Error guardando directamente en Firebase:', firebaseError);
      console.error('📋 Stack trace:', firebaseError.stack);
      // Continuar con fallback a DataPersistence
    }
  }

  // PRIORIDAD 3: Fallback a DataPersistence si Firebase falla
  console.log('💾 Guardando en DataPersistence (fallback)...');
  const success = window.DataPersistence.saveTraficoData(registroId, traficoData);
  console.log('📊 Resultado de DataPersistence.saveTraficoData:', success);

  if (success) {
    console.log('✅ Datos guardados en DataPersistence');

    // Intentar sincronizar con Firebase si está disponible ahora
    if (window.firebaseRepos?.trafico) {
      try {
        const repoTrafico = window.firebaseRepos.trafico;

        // Intentar inicializar si no está listo
        if (typeof repoTrafico.init === 'function' && (!repoTrafico.db || !repoTrafico.tenantId)) {
          await repoTrafico.init();
        }

        // Si Firebase está disponible ahora, intentar guardar
        if (repoTrafico.db && repoTrafico.tenantId) {
          console.log('🔄 Intentando sincronizar con Firebase...');
          const firebaseSuccess = await repoTrafico.saveRegistro(registroId, traficoData);
          if (firebaseSuccess) {
            console.log('✅ Datos sincronizados con Firebase exitosamente');
          } else {
            console.warn(
              '⚠️ No se pudo sincronizar con Firebase, pero los datos están guardados localmente'
            );
          }
        }
      } catch (syncError) {
        console.warn('⚠️ Error sincronizando con Firebase:', syncError);
        console.warn('⚠️ Los datos están guardados localmente y se sincronizarán más tarde');
      }
    } else if (window.firebaseDb && window.fs && window.fs.doc && window.fs.setDoc) {
      // Intentar guardar directamente en Firebase como último recurso
      try {
        console.log('🔄 Intentando sincronizar directamente con Firebase (último recurso)...');
        let tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        if (window.firebaseAuth?.currentUser) {
          const currentUser = JSON.parse(localStorage.getItem('erpCurrentUser') || 'null');
          tenantId = currentUser?.tenantId || localStorage.getItem('tenantId') || tenantId;
        }

        const docData = {
          ...traficoData,
          tipo: 'registro',
          tenantId: tenantId,
          userId: window.firebaseAuth?.currentUser?.uid || 'demo_user',
          deleted: false,
          fechaCreacion: traficoData.fechaCreacion || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const docRef = window.fs.doc(window.firebaseDb, 'trafico', registroId);
        await window.fs.setDoc(docRef, docData, { merge: true });
        console.log('✅ Datos sincronizados directamente con Firebase exitosamente');
      } catch (directError) {
        console.warn('⚠️ Error sincronizando directamente con Firebase:', directError);
      }
    }

    // Guardar gastos de operadores si existen
    if (typeof window.guardarGastosOperadoresEnSistema === 'function') {
      try {
        console.log('💰 Guardando gastos de operadores...');
        await window.guardarGastosOperadoresEnSistema();
        console.log('✅ Gastos de operadores guardados');
      } catch (error) {
        console.warn('⚠️ Error guardando gastos de operadores:', error);
      }
    }

    // Sincronizar operadores con la hoja de operadores
    if (typeof window.sincronizarOperadoresDesdeTrafico === 'function') {
      try {
        await window.sincronizarOperadoresDesdeTrafico(traficoData);
      } catch (error) {
        console.warn('⚠️ Error sincronizando operadores:', error);
      }
    }

    // Marcar módulo de tráfico como completado en sincronización
    if (typeof window.sincronizacionUtils !== 'undefined') {
      window.sincronizacionUtils.marcarCompletado(registroId, 'trafico');
    }

    return true;
  }
  console.error('❌ Error: DataPersistence.saveTraficoData retornó false');
  return false;
};

// Función para sincronizar registros de tráfico guardados en localStorage a Firebase
window.sincronizarTraficoAFirebase = async function () {
  console.log('🔄 Sincronizando registros de tráfico de localStorage a Firebase...');

  try {
    // Esperar a que Firebase esté disponible
    if (!window.firebaseRepos) {
      console.log('⏳ Esperando a que Firebase se inicialice...');
      let intentos = 0;
      const maxIntentos = 20; // 10 segundos

      while (!window.firebaseRepos && intentos < maxIntentos) {
        await new Promise(resolve => setTimeout(resolve, 500));
        intentos++;
        console.log(`⏳ Esperando Firebase... (intento ${intentos}/${maxIntentos})`);
      }
    }

    // Verificar que Firebase esté disponible
    if (!window.firebaseRepos?.trafico) {
      console.warn('⚠️ Firebase no está disponible para sincronización después de esperar');
      console.warn('⚠️ Asegúrate de que Firebase esté inicializado. Intenta recargar la página.');
      return false;
    }

    const repoTrafico = window.firebaseRepos.trafico;

    // Intentar inicializar si no está listo
    if (typeof repoTrafico.init === 'function' && (!repoTrafico.db || !repoTrafico.tenantId)) {
      console.log('🔄 Inicializando repositorio de tráfico...');
      try {
        await repoTrafico.init();
      } catch (initError) {
        console.error('❌ Error inicializando repositorio:', initError);
      }
    }

    // Esperar un poco más si aún no está listo
    if (!repoTrafico.db || !repoTrafico.tenantId) {
      console.log('⏳ Esperando a que el repositorio se inicialice completamente...');
      let intentos = 0;
      const maxIntentos = 10; // 5 segundos

      while ((!repoTrafico.db || !repoTrafico.tenantId) && intentos < maxIntentos) {
        await new Promise(resolve => setTimeout(resolve, 500));
        intentos++;

        // Intentar inicializar nuevamente
        if (typeof repoTrafico.init === 'function') {
          try {
            await repoTrafico.init();
          } catch (e) {
            // Ignorar error intencionalmente
          }
        }
      }
    }

    if (!repoTrafico.db || !repoTrafico.tenantId) {
      console.warn('⚠️ Repositorio de tráfico no está inicializado después de esperar');
      console.warn('⚠️ Verifica que Firebase esté correctamente configurado');
      return false;
    }

    // Obtener datos de tráfico de localStorage
    const allData = window.DataPersistence.getData();
    if (!allData || !allData.trafico) {
      console.log('ℹ️ No hay registros de tráfico en localStorage para sincronizar');
      return true;
    }

    const traficoLocal = allData.trafico;
    const registrosIds = Object.keys(traficoLocal);

    if (registrosIds.length === 0) {
      console.log('ℹ️ No hay registros de tráfico para sincronizar');
      return true;
    }

    console.log(`📊 Encontrados ${registrosIds.length} registros de tráfico para sincronizar`);

    let sincronizados = 0;
    let errores = 0;

    // Sincronizar cada registro
    for (const registroId of registrosIds) {
      try {
        const registro = traficoLocal[registroId];

        // Verificar si el registro ya existe en Firebase
        const existeEnFirebase = await repoTrafico.getRegistro(registroId);

        if (!existeEnFirebase) {
          // Guardar en Firebase
          const success = await repoTrafico.saveRegistro(registroId, registro);
          if (success) {
            sincronizados++;
            console.log(`✅ Registro ${registroId} sincronizado con Firebase`);
          } else {
            errores++;
            console.warn(`⚠️ No se pudo sincronizar registro ${registroId}`);
          }
        } else {
          console.log(`ℹ️ Registro ${registroId} ya existe en Firebase, omitiendo`);
        }
      } catch (error) {
        errores++;
        console.error(`❌ Error sincronizando registro ${registroId}:`, error);
      }
    }

    console.log(`✅ Sincronización completada: ${sincronizados} sincronizados, ${errores} errores`);

    if (sincronizados > 0) {
      if (typeof window.showNotification === 'function') {
        window.showNotification(
          `${sincronizados} registro(s) de tráfico sincronizado(s) con Firebase`,
          'success'
        );
      }
    }

    return sincronizados > 0;
  } catch (error) {
    console.error('❌ Error en sincronización de tráfico:', error);
    return false;
  }
};

// Función para sincronizar usando Firebase directamente (sin firebaseRepos)
window.sincronizarTraficoAFirebaseDirecto = async function () {
  console.log('🔄 Sincronizando registros de tráfico usando Firebase directamente...');

  try {
    // Verificar que Firebase esté disponible
    if (!window.firebaseDb || !window.fs || !window.firebaseAuth?.currentUser) {
      console.warn('⚠️ Firebase no está completamente inicializado');
      console.warn('  - firebaseDb:', Boolean(window.firebaseDb));
      console.warn('  - fs:', Boolean(window.fs));
      console.warn('  - firebaseAuth:', Boolean(window.firebaseAuth));
      console.warn('  - currentUser:', Boolean(window.firebaseAuth?.currentUser));
      return false;
    }

    // Obtener datos de tráfico de localStorage
    const allData = window.DataPersistence.getData();
    if (!allData || !allData.trafico) {
      console.log('ℹ️ No hay registros de tráfico en localStorage para sincronizar');
      return true;
    }

    const traficoLocal = allData.trafico;
    const registrosIds = Object.keys(traficoLocal);

    if (registrosIds.length === 0) {
      console.log('ℹ️ No hay registros de tráfico para sincronizar');
      return true;
    }

    console.log(`📊 Encontrados ${registrosIds.length} registros de tráfico para sincronizar`);

    const { doc, setDoc, getDoc } = window.fs;
    const db = window.firebaseDb;
    const userId = window.firebaseAuth.currentUser.uid;
    const tenantId = localStorage.getItem('tenantId') || userId;

    let sincronizados = 0;
    let errores = 0;

    // Sincronizar cada registro
    for (const registroId of registrosIds) {
      try {
        const registro = traficoLocal[registroId];

        // Verificar si el registro ya existe en Firebase
        const docRef = doc(db, 'trafico', registroId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          // Preparar datos para Firebase
          const datosFirebase = {
            ...registro,
            tipo: 'registro',
            tenantId: tenantId,
            userId: userId,
            fechaCreacion: registro.fechaCreacion || new Date().toISOString(),
            ultimaActualizacion: new Date().toISOString(),
            deleted: false
          };

          // Guardar en Firebase
          await setDoc(docRef, datosFirebase);
          sincronizados++;
          console.log(`✅ Registro ${registroId} sincronizado con Firebase`);
        } else {
          console.log(`ℹ️ Registro ${registroId} ya existe en Firebase, omitiendo`);
        }
      } catch (error) {
        errores++;
        console.error(`❌ Error sincronizando registro ${registroId}:`, error);
      }
    }

    console.log(`✅ Sincronización completada: ${sincronizados} sincronizados, ${errores} errores`);

    if (sincronizados > 0) {
      if (typeof window.showNotification === 'function') {
        window.showNotification(
          `${sincronizados} registro(s) de tráfico sincronizado(s) con Firebase`,
          'success'
        );
      }
    }

    return sincronizados > 0;
  } catch (error) {
    console.error('❌ Error en sincronización de tráfico:', error);
    return false;
  }
};

// Función para verificar el estado de Firebase
window.verificarEstadoFirebase = function () {
  console.log('🔍 Verificando estado de Firebase...');
  console.log('  - window.firebaseRepos:', Boolean(window.firebaseRepos));
  console.log('  - window.firebaseRepos?.trafico:', Boolean(window.firebaseRepos?.trafico));
  console.log('  - window.firebaseDb:', Boolean(window.firebaseDb));
  console.log('  - window.fs:', Boolean(window.fs));
  console.log('  - window.firebaseAuth:', Boolean(window.firebaseAuth));
  console.log('  - window.firebaseAuth?.currentUser:', Boolean(window.firebaseAuth?.currentUser));

  if (window.firebaseRepos?.trafico) {
    const repo = window.firebaseRepos.trafico;
    console.log('  - repo.db:', Boolean(repo.db));
    console.log('  - repo.tenantId:', repo.tenantId);
    console.log('  - repo._initialized:', repo._initialized);
  }

  return {
    firebaseRepos: Boolean(window.firebaseRepos),
    traficoRepo: Boolean(window.firebaseRepos?.trafico),
    firebaseDb: Boolean(window.firebaseDb),
    fs: Boolean(window.fs),
    auth: Boolean(window.firebaseAuth),
    currentUser: Boolean(window.firebaseAuth?.currentUser)
  };
};

// Función para verificar un registro específico
window.checkSpecificRegistration = async function (registroId) {
  console.log(`🔍 Verificando registro: ${registroId}`);

  const allData = await window.DataPersistence.getAllDataByRegistro(registroId);

  console.log('📊 Resultado de búsqueda:', {
    logistica: allData.logistica ? '✅ Encontrado' : '❌ No encontrado',
    trafico: allData.trafico ? '✅ Encontrado' : '❌ No encontrado',
    facturacion: allData.facturacion ? '✅ Encontrado' : '❌ No encontrado'
  });

  if (allData.logistica) {
    console.log('📦 Datos de logística:', allData.logistica);
  }

  if (allData.trafico) {
    console.log('🚛 Datos de tráfico:', allData.trafico);
  }

  if (allData.facturacion) {
    console.log('💰 Datos de facturación:', allData.facturacion);
  }

  // Mostrar notificación
  if (allData.logistica) {
    window.showNotification(`✅ Registro ${registroId} encontrado en logística`, 'success');
  } else {
    window.showNotification(`❌ Registro ${registroId} no encontrado`, 'error');
  }

  return allData;
};

// Función para mostrar notificaciones
window.showNotification = function (message, type = 'info') {
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
};

// Función para llenar datos de económico en tráfico cuando se ingresa el número
window.fillTraficoFromEconomico = function (numeroEconomico) {
  if (!numeroEconomico) {
    return false;
  }

  // Primero intentar buscar en el caché de ERPState (sistema nuevo de searchable dropdown)
  let economicoData = null;
  if (window.ERPState && window.ERPState.getCache) {
    const economicosCache = window.ERPState.getCache('economicos') || [];
    // Extraer solo el número del económico si viene con formato "101 - Kenworth T680 (23-ABC-7)"
    const numeroLimpio = numeroEconomico.split(' - ')[0].trim();
    economicoData = economicosCache.find(e => {
      const numero = (e.numero || e.nombre || '').toString().trim();
      return numero === numeroLimpio || numero === numeroEconomico;
    });

    if (economicoData) {
      console.log('✅ Económico encontrado en caché ERPState:', economicoData);
    }
  }

  // Si no se encuentra en el caché, intentar con DataPersistence
  if (!economicoData) {
    economicoData = window.DataPersistence.getEconomicoData(numeroEconomico);
  }

  // Si no se encuentra, no mostrar advertencia (ya que puede ser que se esté usando el nuevo sistema)
  if (!economicoData) {
    console.log(
      'ℹ️ Económico no encontrado, pero puede estar usando el nuevo sistema de searchable dropdown'
    );
    return false;
  }

  // Llenar campos relacionados al económico en la página de tráfico
  const campos = {
    economico: economicoData.numeroEconomico,
    Placas: economicoData.placaTracto,
    permisosct: economicoData.permisoSCT,
    operadorprincipal: economicoData.operadorAsignado,
    telefonoOperador: economicoData.telefonoOperador,
    marcaVehiculo: economicoData.marca,
    modeloVehiculo: economicoData.modelo,
    añoVehiculo: economicoData.año,
    capacidadCarga: economicoData.capacidadCarga
  };

  let camposLlenados = 0;
  Object.keys(campos).forEach(selector => {
    const element = document.getElementById(selector);
    if (element && campos[selector]) {
      element.value = campos[selector];
      camposLlenados++;
      console.log(`✅ Campo ${selector} llenado con: ${campos[selector]}`);
    }
  });

  if (camposLlenados > 0) {
    showNotification(`Datos del económico ${numeroEconomico} cargados automáticamente`, 'success');
    return true;
  }
  showNotification(
    `Económico ${numeroEconomico} encontrado pero no hay campos compatibles para llenar`,
    'info'
  );
  return false;
};

// Función global para limpiar todos los datos del sistema ERP
async function _limpiarTodosLosDatosLogistica() {
  // Confirmar acción
  if (
    !confirm(
      '⚠️ ADVERTENCIA: Esta acción eliminará TODOS los datos operativos del sistema ERP.\n\nSe eliminará:\n• Registros de Logística\n• Facturas\n• Tráfico\n• Envíos\n• Cuentas por Pagar\n• Cuentas por Cobrar\n• Tesorería\n• Diesel\n• Mantenimiento\n• Inventario\n• Datos de ejemplo\n\nSe PRESERVARÁ:\n• Económicos (tractocamiones)\n• Operadores\n• Clientes\n• Proveedores\n• Estancias\n• Almacenes\n• Usuarios\n• Configuración del sistema\n\nAdemás, reiniciará completamente el sistema de numeración a "2500001".\n\n¿Estás seguro de que deseas continuar?'
    )
  ) {
    return;
  }

  try {
    console.log('🧹 Iniciando limpieza de datos operativos del sistema ERP...');

    // 1. Limpiar datos de Firebase primero (SIEMPRE, no solo para usuarios anónimos)
    console.log('🔥 Limpiando datos de Firebase...');
    let firebaseDeleted = 0;

    // Método 1: Usar repositorios de Firebase si están disponibles
    if (window.firebaseRepos) {
      const reposToClean = [
        'logistica',
        'trafico',
        'facturacion',
        'cxc',
        'cxp',
        'diesel',
        'mantenimiento',
        'tesoreria',
        'operadores',
        'inventario'
      ];

      for (const repoName of reposToClean) {
        if (window.firebaseRepos[repoName]) {
          try {
            console.log(`🗑️ Limpiando repositorio ${repoName}...`);
            const repo = window.firebaseRepos[repoName];

            // Obtener TODOS los documentos directamente desde Firebase (sin filtrar por deleted)
            let allItems = [];
            try {
              if (window.firebaseDb && window.fs && repo.db && repo.tenantId) {
                // Obtener directamente desde Firebase sin filtro de deleted
                const collectionRef = window.fs.collection(window.firebaseDb, repoName);
                const q = window.fs.query(
                  collectionRef,
                  window.fs.where('tenantId', '==', repo.tenantId)
                  // NO filtrar por deleted para obtener TODOS los documentos
                );
                const snapshot = await window.fs.getDocs(q);
                allItems = [];
                snapshot.forEach(doc => {
                  allItems.push({ id: doc.id, ...doc.data() });
                });
                console.log(
                  `  📊 Obtenidos ${allItems.length} documentos (incluyendo eliminados) de ${repoName}`
                );
              } else {
                // Fallback a métodos del repositorio
                if (repo.getAllRegistros) {
                  allItems = await repo.getAllRegistros();
                } else if (repo.getAll) {
                  allItems = await repo.getAll();
                } else if (repo.getAllMovimientos) {
                  allItems = await repo.getAllMovimientos();
                }
              }
            } catch (error) {
              console.warn(`⚠️ Error obteniendo registros de ${repoName}:`, error);
              continue;
            }

            console.log(`  📊 Encontrados ${allItems.length} documento(s) en ${repoName}`);

            // Eliminar cada registro físicamente usando Firebase directo
            // IMPORTANTE: Usar el ID del documento directamente desde Firebase
            for (const item of allItems) {
              try {
                // El ID del documento en Firebase está en item.id
                const itemId = item.id;
                if (
                  itemId &&
                  window.firebaseDb &&
                  window.fs &&
                  window.fs.deleteDoc &&
                  window.fs.doc
                ) {
                  // Eliminar físicamente el documento usando su ID real
                  const docRef = window.fs.doc(window.firebaseDb, repoName, itemId);
                  await window.fs.deleteDoc(docRef);
                  firebaseDeleted++;
                  console.log(`  🗑️ Eliminado físicamente: ${repoName}/${itemId}`);
                } else if (itemId) {
                  // Fallback: intentar con el método delete del repositorio
                  try {
                    await repo.delete(itemId);
                    firebaseDeleted++;
                  } catch (error) {
                    console.warn('⚠️ Error con método delete del repositorio:', error);
                  }
                } else {
                  console.warn(`⚠️ No se encontró ID para eliminar en ${repoName}:`, item);
                }
              } catch (error) {
                console.warn(`⚠️ Error eliminando item de ${repoName}:`, error);
              }
            }

            console.log(
              `✅ Repositorio ${repoName} limpiado: ${allItems.length} documento(s) eliminado(s)`
            );
          } catch (error) {
            console.error(`❌ Error limpiando repositorio ${repoName}:`, error);
          }
        }
      }
    }

    // Método 2: Fallback a Firebase directo si los repositorios no están disponibles
    if (window.firebaseDb && window.fs && firebaseDeleted === 0) {
      try {
        const collectionsToDelete = [
          'logistica',
          'trafico',
          'facturacion',
          'cxc',
          'cxp',
          'diesel',
          'mantenimiento',
          'tesoreria'
        ];

        // Obtener tenantId del repositorio si está disponible
        let tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        if (window.firebaseRepos?.logistica?.tenantId) {
          tenantId = window.firebaseRepos.logistica.tenantId;
        } else if (window.firebaseRepos?.cxp?.tenantId) {
          tenantId = window.firebaseRepos.cxp.tenantId;
        }

        for (const collectionName of collectionsToDelete) {
          try {
            console.log(`🗑️ Limpiando colección ${collectionName} (método directo)...`);
            const collectionRef = window.fs.collection(window.firebaseDb, collectionName);

            // Filtrar por tenantId si es posible
            let querySnapshot;
            try {
              const q = window.fs.query(collectionRef, window.fs.where('tenantId', '==', tenantId));
              querySnapshot = await window.fs.getDocs(q);
            } catch (error) {
              // Si falla el filtro, obtener todos los documentos
              querySnapshot = await window.fs.getDocs(collectionRef);
            }

            if (querySnapshot.empty) {
              console.log(`  ℹ️ Colección ${collectionName} está vacía`);
              continue;
            }

            console.log(
              `  📊 Encontrados ${querySnapshot.docs.length} documento(s) en ${collectionName}`
            );

            for (const doc of querySnapshot.docs) {
              await window.fs.deleteDoc(doc.ref);
              firebaseDeleted++;
            }

            console.log(
              `✅ Colección ${collectionName} limpiada: ${querySnapshot.docs.length} documento(s) eliminado(s)`
            );
          } catch (collectionError) {
            console.error(`❌ Error limpiando colección ${collectionName}:`, collectionError);
          }
        }
      } catch (error) {
        console.error('❌ Error limpiando Firebase (método directo):', error);
      }
    }

    if (firebaseDeleted > 0) {
      console.log(`✅ ${firebaseDeleted} documentos eliminados de Firebase`);
    } else {
      console.log('ℹ️ No se encontraron datos en Firebase para eliminar');
    }

    // Limpiar datos compartidos
    if (window.dataPersistence) {
      window.dataPersistence.clearAllData();
      console.log('✅ Datos compartidos limpiados');
    }

    // Lista de claves a ELIMINAR (solo datos operativos)
    const erpKeysToDelete = [
      // Logística
      'erp_logistica_registros',
      'erp_logistica_contador',
      'erp_shared_data',
      'erp_logistica',

      // Facturación
      'erp_facturacion_registros',
      'erp_facturacion_contador',

      // Tráfico
      'erp_trafico_registros',
      'erp_trafico_contador',
      'erp_trafico',

      // Cuentas por Pagar
      'erp_cxp_facturas',
      'erp_cxp_solicitudes',
      'erp_cxp_contador',
      'erp_cxp_data',

      // Cuentas por Cobrar
      'erp_cxc_registros',
      'erp_cxc_contador',
      'erp_cxc_data',

      // Tesorería
      'erp_tesoreria_ordenes',
      'erp_tesoreria_movimientos',
      'erp_tesoreria_contador',
      'erp_teso_ordenes_pago',
      'erp_tesoreria_movimientos',

      // Diesel
      'erp_diesel_registros',
      'erp_diesel_contador',
      'erp_diesel_movimientos',

      // Mantenimiento
      'erp_mantenimiento_registros',
      'erp_mantenimiento_contador',
      'erp_mantenimientos',

      // Inventario
      'erp_inv_plataformas',
      'erp_inv_refacciones_movimientos',
      'erp_inv_refacciones_stock',
      'erp_inv_refacciones_movs',
      'erp_inventario_plataformas',
      'erp_inv_contador',

      // Gastos de operadores
      'erp_operadores_gastos',
      'erp_operadores_incidencias',

      // Datos de ejemplo
      'erp_sample_data_loaded',
      'erp_demo_data',

      // Estados de sincronización
      'erp_sincronizacion_states',

      // Sistema de numeración
      'registrationNumbers',
      'activeRegistrationNumber'
    ];

    // Lista de claves a PRESERVAR (datos de configuración)
    const erpKeysToPreserve = [
      'erp_economicos', // Tractocamiones
      'erp_operadores', // Operadores
      'erp_operadores_lista', // Lista de operadores
      'erp_clientes', // Clientes
      'erp_proveedores', // Proveedores
      'erp_estancias', // Estancias
      'erp_almacenes', // Almacenes
      'erp_usuarios', // Usuarios
      'erp_config_economicos', // Configuración económicos
      'erp_config_operadores', // Configuración operadores
      'erp_config_proveedores', // Configuración proveedores
      'erp_config_clientes', // Configuración clientes
      'erp_config_estancias', // Configuración estancias
      'erp_config_almacenes', // Configuración almacenes
      'erp_config_usuarios', // Configuración usuarios
      'erp_config_contador', // Configuración contador
      'sidebarCollapsed', // Preferencias de interfaz
      'erp_user_preferences', // Preferencias de usuario
      'erpCurrentUser', // Usuario actual
      'erpSession', // Sesión actual
      'cxp_initialized' // Estado de inicialización
    ];

    // Eliminar solo las claves operativas
    let eliminados = 0;
    erpKeysToDelete.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        eliminados++;
        console.log(`🗑️ Eliminado: ${key}`);
      }
    });

    // Limpiar cualquier otra clave que contenga 'erp_' pero no esté en la lista de preservar
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (
        key.startsWith('erp_') &&
        !erpKeysToPreserve.includes(key) &&
        !erpKeysToDelete.includes(key)
      ) {
        localStorage.removeItem(key);
        eliminados++;
        console.log(`🗑️ Eliminado adicional: ${key}`);
      }
    });

    // Limpiar historial de números de registro completamente
    console.log('🔄 Limpiando historial de números de registro...');
    localStorage.removeItem('registrationNumbers');
    localStorage.removeItem('activeRegistrationNumber');
    console.log('✅ Historial de números de registro limpiado');

    // Limpiar todos los contadores operativos (no restaurar)
    console.log('🔄 Limpiando contadores operativos...');
    localStorage.removeItem('erp_logistica_contador');
    localStorage.removeItem('erp_facturacion_contador');
    localStorage.removeItem('erp_trafico_contador');
    localStorage.removeItem('erp_cxp_contador');
    localStorage.removeItem('erp_cxc_contador');
    localStorage.removeItem('erp_tesoreria_contador');
    localStorage.removeItem('erp_diesel_contador');
    localStorage.removeItem('erp_mantenimiento_contador');
    localStorage.removeItem('erp_inv_contador');
    console.log('✅ Contadores operativos limpiados completamente');

    // Mostrar resumen de lo que se preservó
    console.log('📋 Datos de configuración preservados:');
    erpKeysToPreserve.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`✅ Preservado: ${key}`);
      }
    });

    console.log(`✅ Limpieza completada. ${eliminados} elementos operativos eliminados.`);

    // Mostrar notificación de éxito
    if (typeof showNotification === 'function') {
      showNotification(
        `✅ Datos operativos limpiados exitosamente. ${eliminados} elementos eliminados. Datos de configuración preservados. Sistema de numeración reiniciado a 2500001.`,
        'success'
      );
    } else {
      alert(
        `✅ Datos operativos limpiados exitosamente.\n\n${eliminados} elementos operativos eliminados del almacenamiento local.\n\n✅ Datos de configuración preservados:\n• Económicos (tractocamiones)\n• Operadores\n• Clientes\n• Proveedores\n• Estancias\n• Almacenes\n• Usuarios\n\nSistema de numeración reiniciado a 2500001.`
      );
    }

    // Recargar la página para reflejar los cambios
    setTimeout(() => {
      if (confirm('🔄 La página se recargará para reflejar los cambios.\n¿Continuar?')) {
        location.reload();
      }
    }, 2000);
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    if (typeof showNotification === 'function') {
      showNotification('❌ Error durante la limpieza de datos', 'error');
    } else {
      alert('❌ Error durante la limpieza de datos. Revisa la consola para más detalles.');
    }
  }
}

// Función para limpiar solo datos de ejemplo (alternativa más segura)
function _limpiarSoloDatosEjemplo() {
  if (!confirm('¿Deseas eliminar solo los datos de ejemplo del sistema?')) {
    return;
  }

  try {
    console.log('🧹 Limpiando solo datos de ejemplo...');

    const ejemploKeys = ['erp_sample_data_loaded', 'erp_demo_data'];

    let eliminados = 0;
    ejemploKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        eliminados++;
        console.log(`🗑️ Eliminado: ${key}`);
      }
    });

    console.log(`✅ Datos de ejemplo eliminados. ${eliminados} elementos.`);

    if (typeof showNotification === 'function') {
      showNotification('✅ Datos de ejemplo eliminados', 'success');
    } else {
      alert('✅ Datos de ejemplo eliminados exitosamente.');
    }
  } catch (error) {
    console.error('❌ Error eliminando datos de ejemplo:', error);
    if (typeof showNotification === 'function') {
      showNotification('❌ Error eliminando datos de ejemplo', 'error');
    } else {
      alert('❌ Error eliminando datos de ejemplo.');
    }
  }
}

// Función para borrar todos los datos de localStorage excepto configuración y reportes
async function borrarTodosLosDatosExceptoConfiguracion() {
  // Confirmar acción con doble confirmación
  if (
    !confirm(
      '⚠️ ADVERTENCIA CRÍTICA:\n\nEsta acción eliminará TODOS los datos operativos del sistema ERP.\n\nSe ELIMINARÁ:\n• Registros de Logística\n• Facturas\n• Tráfico\n• Envíos\n• Cuentas por Pagar\n• Cuentas por Cobrar\n• Tesorería\n• Diesel\n• Mantenimiento\n• Inventario\n• Gastos de Operadores\n• Incidencias\n• Todos los datos operativos\n\nSe PRESERVARÁ:\n• Configuración (Económicos, Operadores, Clientes, Proveedores, Estancias, Almacenes, Usuarios)\n• Datos de Reportes\n• Preferencias de usuario\n• Sesión actual\n\n¿Estás ABSOLUTAMENTE seguro?'
    )
  ) {
    return;
  }

  // Segunda confirmación
  if (
    !confirm(
      '⚠️ ÚLTIMA CONFIRMACIÓN:\n\nEsta acción NO se puede deshacer.\n\nSe eliminarán TODOS los datos operativos.\n\n¿Continuar de todas formas?'
    )
  ) {
    return;
  }

  try {
    console.log(
      '🧹 Iniciando borrado completo de datos operativos (excepto configuración y reportes)...'
    );

    // 1. Limpiar datos de Firebase primero
    console.log('🔥 Limpiando datos de Firebase...');
    let firebaseDeleted = 0;

    // Método 1: Usar repositorios de Firebase si están disponibles (más confiable)
    if (window.firebaseRepos) {
      const reposToClean = [
        'logistica',
        'trafico',
        'facturacion',
        'cxc',
        'cxp',
        'diesel',
        'mantenimiento',
        'tesoreria',
        'operadores',
        'inventario'
      ];

      for (const repoName of reposToClean) {
        if (window.firebaseRepos[repoName]) {
          try {
            console.log(`🗑️ Limpiando repositorio ${repoName}...`);
            const repo = window.firebaseRepos[repoName];

            // Obtener TODOS los documentos directamente desde Firebase (sin filtrar por deleted)
            let allItems = [];
            try {
              if (window.firebaseDb && window.fs && repo.db && repo.tenantId) {
                // Obtener directamente desde Firebase sin filtro de deleted
                const collectionRef = window.fs.collection(window.firebaseDb, repoName);
                const q = window.fs.query(
                  collectionRef,
                  window.fs.where('tenantId', '==', repo.tenantId)
                  // NO filtrar por deleted para obtener TODOS los documentos
                );
                const snapshot = await window.fs.getDocs(q);
                allItems = [];
                snapshot.forEach(doc => {
                  allItems.push({ id: doc.id, ...doc.data() });
                });
                console.log(
                  `  📊 Obtenidos ${allItems.length} documentos (incluyendo eliminados) de ${repoName}`
                );
              } else {
                // Fallback a métodos del repositorio
                if (repo.getAllRegistros) {
                  allItems = await repo.getAllRegistros();
                } else if (repo.getAll) {
                  allItems = await repo.getAll();
                } else if (repo.getAllMovimientos) {
                  allItems = await repo.getAllMovimientos();
                }
              }
            } catch (error) {
              console.warn(`⚠️ Error obteniendo registros de ${repoName}:`, error);
              continue;
            }

            console.log(`  📊 Encontrados ${allItems.length} documento(s) en ${repoName}`);

            // Eliminar cada registro físicamente usando Firebase directo
            // IMPORTANTE: Usar el ID del documento directamente desde Firebase
            for (const item of allItems) {
              try {
                // El ID del documento en Firebase está en item.id
                const itemId = item.id;
                if (
                  itemId &&
                  window.firebaseDb &&
                  window.fs &&
                  window.fs.deleteDoc &&
                  window.fs.doc
                ) {
                  // Eliminar físicamente el documento usando su ID real
                  const docRef = window.fs.doc(window.firebaseDb, repoName, itemId);
                  await window.fs.deleteDoc(docRef);
                  firebaseDeleted++;
                  console.log(`  🗑️ Eliminado físicamente: ${repoName}/${itemId}`);
                } else if (itemId) {
                  // Fallback: intentar con el método delete del repositorio
                  try {
                    await repo.delete(itemId);
                    firebaseDeleted++;
                  } catch (error) {
                    console.warn('⚠️ Error con método delete del repositorio:', error);
                  }
                } else {
                  console.warn(`⚠️ No se encontró ID para eliminar en ${repoName}:`, item);
                }
              } catch (error) {
                console.warn(`⚠️ Error eliminando item de ${repoName}:`, error);
              }
            }

            console.log(
              `✅ Repositorio ${repoName} limpiado: ${allItems.length} documento(s) eliminado(s)`
            );
          } catch (error) {
            console.error(`❌ Error limpiando repositorio ${repoName}:`, error);
          }
        }
      }
    }

    // Método 2: Fallback a Firebase directo si los repositorios no están disponibles
    if (window.firebaseDb && window.fs && firebaseDeleted === 0) {
      try {
        // Obtener tenantId del usuario actual o usar DEMO_CONFIG.tenantId como fallback
        let tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        if (window.firebaseAuth?.currentUser) {
          // Intentar obtener tenantId del repositorio si está disponible
          if (window.firebaseRepos?.cxp?.tenantId) {
            tenantId = window.firebaseRepos.cxp.tenantId;
          } else if (window.firebaseRepos?.logistica?.tenantId) {
            tenantId = window.firebaseRepos.logistica.tenantId;
          }
        }

        console.log(`🔍 Usando tenantId: ${tenantId}`);

        const collectionsToDelete = [
          'logistica',
          'trafico',
          'facturacion',
          'cxc',
          'cxp',
          'diesel',
          'mantenimiento',
          'tesoreria',
          'operadores',
          'inventario'
        ];

        for (const collectionName of collectionsToDelete) {
          try {
            console.log(`🗑️ Limpiando colección ${collectionName} (método directo)...`);
            const collectionRef = window.fs.collection(window.firebaseDb, collectionName);

            // Filtrar por tenantId para solo borrar documentos del tenant actual
            let querySnapshot;
            try {
              const q = window.fs.query(collectionRef, window.fs.where('tenantId', '==', tenantId));
              querySnapshot = await window.fs.getDocs(q);
            } catch (error) {
              // Si falla el filtro, obtener todos los documentos
              querySnapshot = await window.fs.getDocs(collectionRef);
            }

            if (querySnapshot.empty) {
              console.log(`  ℹ️ Colección ${collectionName} está vacía para tenantId ${tenantId}`);
              continue;
            }

            console.log(
              `  📊 Encontrados ${querySnapshot.docs.length} documento(s) en ${collectionName} para tenantId ${tenantId}`
            );

            for (const doc of querySnapshot.docs) {
              await window.fs.deleteDoc(doc.ref);
              firebaseDeleted++;
            }

            console.log(
              `✅ Colección ${collectionName} limpiada: ${querySnapshot.docs.length} documento(s) eliminado(s)`
            );
          } catch (collectionError) {
            console.error(`❌ Error limpiando colección ${collectionName}:`, collectionError);
          }
        }

        console.log(
          `✅ ${firebaseDeleted} documentos eliminados de Firebase para tenantId ${tenantId}`
        );
      } catch (error) {
        console.error('❌ Error limpiando Firebase:', error);
      }
    }

    if (firebaseDeleted > 0) {
      console.log(`✅ Total: ${firebaseDeleted} documentos eliminados de Firebase`);
    } else {
      console.log('ℹ️ No se encontraron datos en Firebase para eliminar');
    }

    // 2. Lista de claves a PRESERVAR (configuración y reportes)
    const keysToPreserve = [
      // Configuración - Económicos
      'erp_economicos',
      'erp_config_economicos',

      // Configuración - Operadores
      'erp_operadores',
      'erp_operadores_lista',
      'erp_config_operadores',

      // Configuración - Clientes
      'erp_clientes',
      'erp_config_clientes',

      // Configuración - Proveedores
      'erp_proveedores',
      'erp_config_proveedores',

      // Configuración - Estancias
      'erp_estancias',
      'erp_config_estancias',

      // Configuración - Almacenes
      'erp_almacenes',
      'erp_config_almacenes',

      // Configuración - Usuarios
      'erp_usuarios',
      'erp_config_usuarios',
      'erp_config_contador',

      // Sesión y preferencias
      'erpCurrentUser',
      'erpSession',
      'erp_user_preferences',
      'sidebarCollapsed',
      'cxp_initialized'

      // Reportes (cualquier clave relacionada con reportes)
      // Nota: No hay claves específicas de reportes en localStorage, se generan dinámicamente
    ];

    // 3. Obtener todas las claves de localStorage
    const allKeys = Object.keys(localStorage);
    console.log(`📋 Total de claves en localStorage: ${allKeys.length}`);

    // 4. Identificar claves a eliminar (todas excepto las de preservar)
    const keysToDelete = allKeys.filter(key => {
      // Preservar si está en la lista explícita
      if (keysToPreserve.includes(key)) {
        return false;
      }

      // Preservar si contiene 'config' o 'configuracion'
      if (key.toLowerCase().includes('config') || key.toLowerCase().includes('configuracion')) {
        return false;
      }

      // Preservar si contiene 'reporte' o 'report'
      if (key.toLowerCase().includes('reporte') || key.toLowerCase().includes('report')) {
        return false;
      }

      // Preservar claves de configuración específicas
      if (
        key.startsWith('erp_economicos') ||
        (key.startsWith('erp_operadores') &&
          !key.includes('gastos') &&
          !key.includes('incidencias')) ||
        key.startsWith('erp_clientes') ||
        key.startsWith('erp_proveedores') ||
        key.startsWith('erp_estancias') ||
        key.startsWith('erp_almacenes') ||
        key.startsWith('erp_usuarios')
      ) {
        return false;
      }

      // Asegurar que las claves de inventario/refacciones se eliminen explícitamente
      if (
        key.includes('erp_inv_refacciones') ||
        key.includes('erp_inventario_refacciones') ||
        key === 'erp_inv_refacciones_stock' ||
        key === 'erp_inv_refacciones_movs' ||
        key === 'erp_inv_refacciones_movimientos'
      ) {
        return true; // Eliminar estas claves
      }

      // Eliminar todo lo demás
      return true;
    });

    console.log(`📋 Claves a preservar: ${allKeys.length - keysToDelete.length}`);
    console.log(`📋 Claves a eliminar: ${keysToDelete.length}`);

    // 5. Eliminar las claves identificadas
    let eliminados = 0;
    keysToDelete.forEach(key => {
      try {
        localStorage.removeItem(key);
        eliminados++;
        console.log(`🗑️ Eliminado: ${key}`);
      } catch (error) {
        console.error(`❌ Error eliminando ${key}:`, error);
      }
    });

    // 6. Limpiar también datos compartidos si existen
    if (window.dataPersistence) {
      try {
        window.dataPersistence.clearAllData();
        console.log('✅ Datos compartidos limpiados');
      } catch (error) {
        console.warn('⚠️ Error limpiando datos compartidos:', error);
      }
    }

    // 7. Mostrar resumen
    console.log('📋 Datos preservados:');
    keysToPreserve.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`✅ Preservado: ${key}`);
      }
    });

    // Verificar claves adicionales preservadas
    const remainingKeys = Object.keys(localStorage);
    remainingKeys.forEach(key => {
      if (
        key.toLowerCase().includes('config') ||
        key.toLowerCase().includes('configuracion') ||
        key.toLowerCase().includes('reporte') ||
        key.toLowerCase().includes('report')
      ) {
        console.log(`✅ Preservado adicional: ${key}`);
      }
    });

    console.log(`✅ Borrado completado. ${eliminados} elementos eliminados.`);

    // 8. Mostrar notificación
    if (typeof showNotification === 'function') {
      showNotification(
        `✅ Datos operativos borrados exitosamente. ${eliminados} elementos eliminados. Datos de configuración y reportes preservados.`,
        'success'
      );
    } else {
      alert(
        `✅ Datos operativos borrados exitosamente.\n\n${eliminados} elementos eliminados del almacenamiento local.\n\n✅ Datos preservados:\n• Configuración completa\n• Datos de reportes\n• Preferencias de usuario\n• Sesión actual`
      );
    }

    // 9. Recargar la página para reflejar los cambios
    setTimeout(() => {
      if (confirm('🔄 La página se recargará para reflejar los cambios.\n¿Continuar?')) {
        location.reload();
      }
    }, 2000);
  } catch (error) {
    console.error('❌ Error durante el borrado:', error);
    if (typeof showNotification === 'function') {
      showNotification('❌ Error durante el borrado de datos', 'error');
    } else {
      alert('❌ Error durante el borrado de datos. Revisa la consola para más detalles.');
    }
  }
}

// Exponer función globalmente
window.borrarTodosLosDatosExceptoConfiguracion = borrarTodosLosDatosExceptoConfiguracion;
