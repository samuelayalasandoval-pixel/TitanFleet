// Sistema de Integración de Datos - Facturación, Logística y Tráfico
class ERPIntegration {
  constructor() {
    this.sharedData = {
      registros: [],
      facturas: [],
      envios: [],
      trafico: []
    };
    this.initializeData();
  }

  // Inicializar datos de ejemplo integrados
  initializeData() {
    // Datos de registros base (logística)
    this.sharedData.registros = [
      {
        id: '2025-01-0001',
        cliente: 'Empresa ABC S.A.',
        origen: 'Ciudad de México',
        destino: 'Guadalajara',
        tipoServicio: 'Transporte Terrestre',
        fechaCreacion: '2025-01-15',
        estado: 'en_proceso',
        monto: 15000.0,
        referenciaCliente: 'REF-ABC-001',
        embalajeEspecial: 'No',
        observaciones: '',
        plataforma: '48ft',
        mercancia: 'Productos electrónicos',
        peso: 2500,
        largo: 12.5,
        ancho: 2.4,
        fechaEnvio: '2025-01-16'
      },
      {
        id: '2025-01-0002',
        cliente: 'Distribuidora XYZ',
        origen: 'Monterrey',
        destino: 'Tijuana',
        tipoServicio: 'Transporte Express',
        fechaCreacion: '2025-01-20',
        estado: 'completado',
        monto: 8500.0,
        referenciaCliente: 'REF-XYZ-002',
        embalajeEspecial: 'Sí',
        observaciones: 'Mercancía frágil',
        plataforma: '53ft',
        mercancia: 'Productos farmacéuticos',
        peso: 1800,
        largo: 15.0,
        ancho: 2.6,
        fechaEnvio: '2025-01-21'
      },
      {
        id: '2025-01-0003',
        cliente: 'Comercial DEF Ltda.',
        origen: 'Puebla',
        destino: 'Cancún',
        tipoServicio: 'Transporte de Carga Pesada',
        fechaCreacion: '2025-01-10',
        estado: 'pendiente',
        monto: 22000.0,
        referenciaCliente: 'REF-DEF-003',
        embalajeEspecial: 'No',
        observaciones: '',
        plataforma: 'Extendible',
        mercancia: 'Maquinaria industrial',
        peso: 4500,
        largo: 18.0,
        ancho: 3.0,
        fechaEnvio: '2025-01-12'
      }
    ];

    // Generar facturas basadas en registros
    this.generateFacturas();

    // Generar datos de envíos
    this.generateEnvios();

    // Generar datos de tráfico
    this.generateTrafico();
  }

  // Generar facturas basadas en registros
  generateFacturas() {
    this.sharedData.facturas = this.sharedData.registros.map(registro => ({
      id: `FAC-${registro.id}`,
      numeroFactura: `FAC-${registro.id}`,
      registroId: registro.id,
      cliente: registro.cliente,
      monto: registro.monto,
      fechaEmision: registro.fechaCreacion,
      fechaVencimiento: this.addDays(registro.fechaCreacion, 30),
      estado: this.getFacturaEstado(registro.estado),
      tipoServicio: registro.tipoServicio,
      origen: registro.origen,
      destino: registro.destino,
      referenciaCliente: registro.referenciaCliente,
      descripcion: `Servicio de ${registro.tipoServicio} de ${registro.origen} a ${registro.destino}`,
      diasVencidos: this.calculateDaysOverdue(registro.fechaCreacion, 30)
    }));
  }

  // Generar datos de envíos
  generateEnvios() {
    this.sharedData.envios = this.sharedData.registros.map(registro => ({
      id: `ENV-${registro.id}`,
      registroId: registro.id,
      facturaId: `FAC-${registro.id}`,
      cliente: registro.cliente,
      origen: registro.origen,
      destino: registro.destino,
      fechaEnvio: registro.fechaCreacion,
      fechaEntrega: this.addDays(
        registro.fechaCreacion,
        this.getDeliveryDays(registro.tipoServicio)
      ),
      estado: registro.estado,
      tipoServicio: registro.tipoServicio,
      monto: registro.monto,
      operadorPrincipal: this.getRandomOperator(),
      operadorSecundario: this.getRandomOperator(),
      economico: this.getRandomVehicle(),
      placas: this.getRandomPlates(),
      observaciones: registro.observaciones
    }));
  }

  // Generar datos de tráfico
  generateTrafico() {
    this.sharedData.trafico = this.sharedData.registros.map(registro => ({
      id: `TRAF-${registro.id}`,
      registroId: registro.id,
      facturaId: `FAC-${registro.id}`,
      envioId: `ENV-${registro.id}`,
      cliente: registro.cliente,
      lugarOrigen: registro.origen,
      lugarDestino: registro.destino,
      fechaSalida: registro.fechaCreacion,
      fechaLlegada: this.addDays(
        registro.fechaCreacion,
        this.getDeliveryDays(registro.tipoServicio)
      ),
      economico: this.getRandomVehicle(),
      placas: this.getRandomPlates(),
      permisoSCT: this.getRandomPermisoSCT(),
      operadorPrincipal: this.getRandomOperator(),
      operadorSecundario: this.getRandomOperator(),
      licenciaOperadorPrincipal: this.getRandomLicencia(),
      licenciaOperadorSecundario: this.getRandomLicencia(),
      estado: registro.estado,
      observaciones: registro.observaciones
    }));
  }

  // Obtener estado de factura basado en estado del registro
  getFacturaEstado(estadoRegistro) {
    switch (estadoRegistro) {
      case 'completado':
        return 'pagado';
      case 'en_proceso':
        return 'pendiente';
      case 'pendiente':
        return 'pendiente';
      default:
        return 'pendiente';
    }
  }

  // Calcular días vencidos
  calculateDaysOverdue(fechaEmision, diasCredito) {
    const fechaVencimiento = this.addDays(fechaEmision, diasCredito);
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diffTime = hoy - vencimiento;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  // Agregar días a una fecha
  addDays(dateString, days) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  // Obtener días de entrega según tipo de servicio
  getDeliveryDays(tipoServicio) {
    switch (tipoServicio) {
      case 'Transporte Express':
        return 1;
      case 'Transporte Terrestre':
        return 3;
      case 'Transporte de Carga Pesada':
        return 5;
      default:
        return 3;
    }
  }

  // Obtener operador aleatorio
  getRandomOperator() {
    const operadores = [
      'Juan Pérez',
      'María González',
      'Carlos López',
      'Ana Martínez',
      'Pedro Rodríguez',
      'Laura Sánchez',
      'Miguel Torres',
      'Carmen Ruiz'
    ];
    return operadores[Math.floor(Math.random() * operadores.length)];
  }

  // Obtener vehículo aleatorio
  getRandomVehicle() {
    const vehiculos = ['ECO-001', 'ECO-002', 'ECO-003', 'ECO-004', 'ECO-005'];
    return vehiculos[Math.floor(Math.random() * vehiculos.length)];
  }

  // Obtener placas aleatorias
  getRandomPlates() {
    const placas = ['ABC-123', 'XYZ-456', 'DEF-789', 'GHI-012', 'JKL-345'];
    return placas[Math.floor(Math.random() * placas.length)];
  }

  // Obtener permiso SCT aleatorio
  getRandomPermisoSCT() {
    const permisos = ['SCT-001', 'SCT-002', 'SCT-003', 'SCT-004', 'SCT-005'];
    return permisos[Math.floor(Math.random() * permisos.length)];
  }

  // Obtener licencia aleatoria
  getRandomLicencia() {
    const licencias = ['LIC-001', 'LIC-002', 'LIC-003', 'LIC-004', 'LIC-005'];
    return licencias[Math.floor(Math.random() * licencias.length)];
  }

  // Obtener datos por ID de registro
  getDataByRegistroId(registroId) {
    return {
      registro: this.sharedData.registros.find(r => r.id === registroId),
      factura: this.sharedData.facturas.find(f => f.registroId === registroId),
      envio: this.sharedData.envios.find(e => e.registroId === registroId),
      trafico: this.sharedData.trafico.find(t => t.registroId === registroId)
    };
  }

  // Obtener datos por ID de factura
  getDataByFacturaId(facturaId) {
    const factura = this.sharedData.facturas.find(f => f.id === facturaId);
    if (!factura) {
      return null;
    }

    return this.getDataByRegistroId(factura.registroId);
  }

  // Obtener resumen integrado
  getIntegratedSummary() {
    const totalRegistros = this.sharedData.registros.length;
    const registrosCompletados = this.sharedData.registros.filter(
      r => r.estado === 'completado'
    ).length;
    const registrosEnProceso = this.sharedData.registros.filter(
      r => r.estado === 'en_proceso'
    ).length;
    const registrosPendientes = this.sharedData.registros.filter(
      r => r.estado === 'pendiente'
    ).length;

    const facturasPendientes = this.sharedData.facturas.filter(
      f => f.estado === 'pendiente'
    ).length;
    const facturasPagadas = this.sharedData.facturas.filter(f => f.estado === 'pagado').length;
    const montoTotalPendiente = this.sharedData.facturas
      .filter(f => f.estado === 'pendiente')
      .reduce((sum, f) => sum + f.monto, 0);

    const enviosEnTransito = this.sharedData.envios.filter(e => e.estado === 'en_proceso').length;
    const enviosEntregados = this.sharedData.envios.filter(e => e.estado === 'completado').length;

    return {
      registros: {
        total: totalRegistros,
        completados: registrosCompletados,
        enProceso: registrosEnProceso,
        pendientes: registrosPendientes
      },
      facturacion: {
        pendientes: facturasPendientes,
        pagadas: facturasPagadas,
        montoPendiente: montoTotalPendiente,
        tasaCobranza: totalRegistros > 0 ? Math.round((facturasPagadas / totalRegistros) * 100) : 0
      },
      envios: {
        enTransito: enviosEnTransito,
        entregados: enviosEntregados,
        tasaEntrega: totalRegistros > 0 ? Math.round((enviosEntregados / totalRegistros) * 100) : 0
      }
    };
  }

  // Buscar datos por criterios
  searchData(criteria) {
    const { cliente, estado, fechaDesde, fechaHasta, tipoServicio } = criteria;

    return this.sharedData.registros
      .filter(registro => {
        const _factura = this.sharedData.facturas.find(f => f.registroId === registro.id);
        const _envio = this.sharedData.envios.find(e => e.registroId === registro.id);
        const _trafico = this.sharedData.trafico.find(t => t.registroId === registro.id);

        const cumpleCliente =
          !cliente || registro.cliente.toLowerCase().includes(cliente.toLowerCase());
        const cumpleEstado = !estado || registro.estado === estado;
        const cumpleFechaDesde = !fechaDesde || registro.fechaCreacion >= fechaDesde;
        const cumpleFechaHasta = !fechaHasta || registro.fechaCreacion <= fechaHasta;
        const cumpleTipoServicio = !tipoServicio || registro.tipoServicio === tipoServicio;

        return (
          cumpleCliente &&
          cumpleEstado &&
          cumpleFechaDesde &&
          cumpleFechaHasta &&
          cumpleTipoServicio
        );
      })
      .map(registro => this.getDataByRegistroId(registro.id));
  }

  // Actualizar estado de un registro
  updateRegistroEstado(registroId, nuevoEstado) {
    const registro = this.sharedData.registros.find(r => r.id === registroId);
    if (registro) {
      registro.estado = nuevoEstado;

      // Actualizar estados relacionados
      const factura = this.sharedData.facturas.find(f => f.registroId === registroId);
      if (factura) {
        factura.estado = this.getFacturaEstado(nuevoEstado);
      }

      const envio = this.sharedData.envios.find(e => e.registroId === registroId);
      if (envio) {
        envio.estado = nuevoEstado;
      }

      const trafico = this.sharedData.trafico.find(t => t.registroId === registroId);
      if (trafico) {
        trafico.estado = nuevoEstado;
      }

      return true;
    }
    return false;
  }

  // Obtener timeline de un registro
  getTimeline(registroId) {
    const data = this.getDataByRegistroId(registroId);
    if (!data.registro) {
      return [];
    }

    const timeline = [
      {
        fecha: data.registro.fechaCreacion,
        evento: 'Registro Creado',
        descripcion: `Registro ${data.registro.id} creado para ${data.registro.cliente}`,
        icono: 'fas fa-plus-circle',
        color: 'primary'
      }
    ];

    if (data.factura) {
      timeline.push({
        fecha: data.factura.fechaEmision,
        evento: 'Factura Emitida',
        descripcion: `Factura ${data.factura.numeroFactura} por $${data.factura.monto.toLocaleString()}`,
        icono: 'fas fa-file-invoice',
        color: 'info'
      });
    }

    if (data.envio) {
      timeline.push({
        fecha: data.envio.fechaEnvio,
        evento: 'Envío Iniciado',
        descripcion: `Envío iniciado de ${data.envio.origen} a ${data.envio.destino}`,
        icono: 'fas fa-truck',
        color: 'warning'
      });
    }

    if (data.trafico) {
      timeline.push({
        fecha: data.trafico.fechaSalida,
        evento: 'Tráfico Iniciado',
        descripcion: `Tráfico iniciado con vehículo ${data.trafico.economico}`,
        icono: 'fas fa-route',
        color: 'secondary'
      });
    }

    if (data.registro.estado === 'completado') {
      timeline.push({
        fecha: data.envio?.fechaEntrega || data.registro.fechaCreacion,
        evento: 'Completado',
        descripcion: 'Proceso completado exitosamente',
        icono: 'fas fa-check-circle',
        color: 'success'
      });
    }

    return timeline.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }
}

// Instancia global del sistema de integración
window.ERPIntegration = new ERPIntegration();

// Función para cargar DataPersistence manualmente si falla
window.loadDataPersistenceManually = function () {
  console.log('🔄 Intentando cargar DataPersistence manualmente...');

  // Verificar si ya existe
  if (typeof window.DataPersistence !== 'undefined') {
    console.log('✅ DataPersistence ya está disponible');
    return true;
  }

  // Crear una versión mínima funcional
  window.DataPersistence = {
    storageKey: 'erp_shared_data',

    getData() {
      try {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('Error obteniendo datos:', error);
        return null;
      }
    },

    setData(data) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('Error guardando datos:', error);
        return false;
      }
    },

    saveLogisticaData(registroId, data) {
      const allData = this.getData() || { registros: {}, trafico: {}, facturas: {} };
      allData.registros[registroId] = {
        ...data,
        fechaCreacion: new Date().toISOString(),
        ultimaActualizacion: new Date().toISOString()
      };
      return this.setData(allData);
    },

    getLogisticaData(registroId) {
      const allData = this.getData();
      return allData ? allData.registros[registroId] : null;
    },

    saveTraficoData(registroId, data) {
      const allData = this.getData() || { registros: {}, trafico: {}, facturas: {} };
      allData.trafico[registroId] = {
        ...data,
        fechaCreacion: new Date().toISOString(),
        ultimaActualizacion: new Date().toISOString()
      };
      return this.setData(allData);
    },

    getTraficoData(registroId) {
      const allData = this.getData();
      return allData ? allData.trafico[registroId] : null;
    },

    getAllDataByRegistro(registroId) {
      const allData = this.getData();
      if (!allData) {
        return { logistica: null, trafico: null, facturacion: null };
      }

      return {
        logistica: allData.registros[registroId] || null,
        trafico: allData.trafico[registroId] || null,
        facturacion: allData.facturas[registroId] || null
      };
    }
  };

  console.log('✅ DataPersistence cargado manualmente');
  return true;
};

// Función para verificar dependencias
window.checkDependencies = function () {
  console.log('🔍 Verificando dependencias...');

  const dependencies = {
    DataPersistence: typeof window.DataPersistence !== 'undefined',
    showNotification: typeof window.showNotification !== 'undefined',
    ERPIntegration: typeof window.ERPIntegration !== 'undefined'
  };

  console.log('📊 Estado de dependencias:', dependencies);

  // Verificar cada dependencia individualmente
  if (!dependencies.DataPersistence) {
    console.error('❌ DataPersistence no está disponible');
    console.error('🔍 Verificando si el script se cargó...');

    // Verificar si hay errores en la consola
    console.log('📋 Scripts cargados:', {
      'data-persistence.js': document.querySelector('script[src*="data-persistence.js"]')
        ? '✅ Cargado'
        : '❌ No encontrado',
      'integration.js': document.querySelector('script[src*="integration.js"]')
        ? '✅ Cargado'
        : '❌ No encontrado',
      'main.js': document.querySelector('script[src*="main.js"]')
        ? '✅ Cargado'
        : '❌ No encontrado'
    });

    // Verificar localStorage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      console.log('✅ localStorage funciona');
    } catch (error) {
      console.error('❌ localStorage no funciona:', error);
    }

    // Intentar cargar DataPersistence manualmente
    console.log('🔄 Intentando cargar DataPersistence manualmente...');
    if (window.loadDataPersistenceManually()) {
      console.log('✅ DataPersistence cargado manualmente - continuando verificación');
      dependencies.DataPersistence = true;
    } else {
      alert('Error: DataPersistence no está disponible. Revisa la consola para más detalles.');
      return false;
    }
  }

  if (!dependencies.showNotification) {
    console.error('❌ showNotification no está disponible');
    alert('Error: showNotification no está disponible');
    return false;
  }

  if (!dependencies.ERPIntegration) {
    console.error('❌ ERPIntegration no está disponible');
    alert('Error: ERPIntegration no está disponible');
    return false;
  }

  console.log('✅ Todas las dependencias están disponibles');
  window.showNotification('✅ Todas las dependencias están disponibles', 'success');
  return true;
};

// FUNCIÓN ELIMINADA: initializeSampleData
// Esta función generaba datos de ejemplo automáticamente.
// Los datos de ejemplo ahora solo se generan mediante los botones manuales en la página de Configuración.

// Funciones de utilidad para formateo
window.formatCurrency = function (amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};

window.formatDate = function (dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

window.formatDateTime = function (dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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
