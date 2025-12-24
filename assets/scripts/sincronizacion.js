class SincronizacionManager {
  constructor() {
    this.storageKey = 'erp_sincronizacion_states';
    this.initializeStates();
  }

  initializeStates() {
    if (!this.getStates()) {
      this.setStates({});
    }
  }

  getStates() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error al obtener estados de sincronización:', error);
      return {};
    }
  }

  setStates(states) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(states));
      return true;
    } catch (error) {
      console.error('Error al guardar estados de sincronización:', error);
      return false;
    }
  }

  // Inicializa un registro para sincronización si no existe
  // modules: array de strings ['logistica', 'trafico', 'facturacion']
  initRegistro(registroId, modules = ['logistica', 'trafico', 'facturacion']) {
    const states = this.getStates();
    if (!states[registroId]) {
      states[registroId] = {
        totalModulos: modules.length,
        modulosProcesados: 0,
        modulos: {}
      };
      modules.forEach(mod => {
        states[registroId].modulos[mod] = {
          completado: false,
          fecha: null
        };
      });
      this.setStates(states);
    }
    return states[registroId];
  }

  // Marca un módulo como completado para un registro específico
  marcarCompletado(registroId, modulo) {
    const states = this.getStates();
    if (states[registroId] && states[registroId].modulos[modulo]) {
      if (!states[registroId].modulos[modulo].completado) {
        states[registroId].modulos[modulo].completado = true;
        states[registroId].modulos[modulo].fecha = new Date().toISOString();
        states[registroId].modulosProcesados++;
        this.setStates(states);
        this.sendNotification(registroId, modulo, 'completado');
        return true;
      }
    } else {
      // Si el registro o módulo no existe, inicializarlo y luego marcar
      this.initRegistro(registroId);
      return this.marcarCompletado(registroId, modulo);
    }
    return false;
  }

  // Obtiene el estado de sincronización de un registro
  getRegistroStatus(registroId) {
    const states = this.getStates();
    return states[registroId] || null;
  }

  // Obtiene todos los registros con su estado de sincronización
  getAllRegistrosStatus() {
    return this.getStates();
  }

  // Calcula el progreso de un registro
  getProgreso(registroId) {
    const status = this.getRegistroStatus(registroId);
    if (!status) {
      return 0;
    }
    return (status.modulosProcesados / status.totalModulos) * 100;
  }

  // Envía una notificación (simulada por ahora)
  sendNotification(registroId, modulo, tipo) {
    const message = `Registro ${registroId}: Módulo de ${modulo} marcado como ${tipo}.`;
    console.log(`🔔 Notificación de Sincronización: ${message}`);
    // NO mostrar notificación aquí - se mostrará en manejarEnvioFormulario
    // para evitar notificaciones duplicadas
    // Aquí se podría integrar un sistema de notificaciones real (ej. Toast, WebSocket)
  }

  // Limpia todos los estados de sincronización
  clearAllStates() {
    this.setStates({});
    console.log('🗑️ Todos los estados de sincronización han sido limpiados.');
    if (typeof window.showNotification === 'function') {
      window.showNotification('Todos los estados de sincronización han sido limpiados.', 'info');
    }
  }

  // Obtiene contadores de registros por estado de sincronización
  getSincronizacionMetrics() {
    const states = this.getStates();
    let totalRegistros = 0;
    let completados = 0;
    let pendientes = 0;
    let enProgreso = 0;

    for (const registroId in states) {
      totalRegistros++;
      const status = states[registroId];
      if (status.modulosProcesados === status.totalModulos) {
        completados++;
      } else if (status.modulosProcesados > 0) {
        enProgreso++;
      } else {
        pendientes++;
      }
    }
    return { totalRegistros, completados, pendientes, enProgreso };
  }

  // Obtiene registros pendientes para un módulo específico
  obtenerRegistrosPendientes(modulo) {
    const states = this.getStates();
    const registrosPendientes = [];

    for (const registroId in states) {
      const status = states[registroId];

      // Verificar si el módulo específico está pendiente
      if (status.modulos[modulo] && !status.modulos[modulo].completado) {
        // Verificar que los módulos anteriores estén completados
        let puedeProcesar = true;

        if (modulo === 'trafico') {
          // Tráfico solo puede procesar si logística está completa
          puedeProcesar = status.modulos.logistica && status.modulos.logistica.completado;
        } else if (modulo === 'facturacion') {
          // Facturación solo puede procesar si logística y tráfico están completos
          puedeProcesar =
            status.modulos.logistica &&
            status.modulos.logistica.completado &&
            status.modulos.trafico &&
            status.modulos.trafico.completado;
        }

        if (puedeProcesar) {
          registrosPendientes.push({
            registroId: registroId,
            estado: Object.keys(status.modulos).map(mod => ({
              modulo: mod,
              completado: status.modulos[mod].completado,
              fecha: status.modulos[mod].fecha
            })),
            progreso: this.getProgreso(registroId)
          });
        }
      }
    }

    return registrosPendientes;
  }

  // Actualiza contadores en la interfaz
  actualizarContadoresBuzon() {
    // Actualizar contador de tráfico
    const contadorTrafico = document.getElementById('contadorPendientesTrafico');
    if (contadorTrafico) {
      const pendientesTrafico = this.obtenerRegistrosPendientes('trafico').length;
      contadorTrafico.textContent = pendientesTrafico;
      contadorTrafico.className =
        pendientesTrafico > 0 ? 'badge bg-danger ms-1' : 'badge bg-success ms-1';
    }

    // Actualizar contador de facturación
    const contadorFacturacion = document.getElementById('contadorPendientesFacturacion');
    if (contadorFacturacion) {
      const pendientesFacturacion = this.obtenerRegistrosPendientes('facturacion').length;
      contadorFacturacion.textContent = pendientesFacturacion;
      contadorFacturacion.className =
        pendientesFacturacion > 0 ? 'badge bg-danger ms-1' : 'badge bg-success ms-1';
    }
  }
}

// Instancia global del sistema de sincronización
window.sincronizacionManager = new SincronizacionManager();

// Funciones de utilidad para la sincronización
window.sincronizacionUtils = {
  marcarCompletado: (registroId, modulo) =>
    window.sincronizacionManager.marcarCompletado(registroId, modulo),
  getRegistroStatus: registroId => window.sincronizacionManager.getRegistroStatus(registroId),
  obtenerEstado: registroId => window.sincronizacionManager.getRegistroStatus(registroId),
  getAllRegistrosStatus: () => window.sincronizacionManager.getAllRegistrosStatus(),
  getProgreso: registroId => window.sincronizacionManager.getProgreso(registroId),
  clearAllStates: () => window.sincronizacionManager.clearAllStates(),
  getSincronizacionMetrics: () => window.sincronizacionManager.getSincronizacionMetrics(),
  initRegistro: (registroId, modules) =>
    window.sincronizacionManager.initRegistro(registroId, modules),
  obtenerRegistrosPendientes: modulo =>
    window.sincronizacionManager.obtenerRegistrosPendientes(modulo),
  actualizarContadoresBuzon: () => window.sincronizacionManager.actualizarContadoresBuzon()
};

console.log('✅ SincronizacionManager inicializado correctamente');
