// Funciones de exportar ahora usan window.exportarDatosExcel de main.js

window.exportarTesoreriaExcel = async function () {
  // Intentar obtener movimientos desde Firebase primero, luego localStorage
  let movimientos = [];

  try {
    if (window.firebaseRepos && window.firebaseRepos.tesoreria) {
      try {
        movimientos = await window.firebaseRepos.tesoreria.getAllMovimientos();
        if (!Array.isArray(movimientos)) {
          movimientos = [];
        }
      } catch (error) {
        console.warn('⚠️ Error cargando desde Firebase, usando localStorage:', error);
      }
    }

    // Si no hay movimientos desde Firebase, usar localStorage
    if (!Array.isArray(movimientos) || movimientos.length === 0) {
      const raw = localStorage.getItem('erp_tesoreria_movimientos') || '[]';
      movimientos = JSON.parse(raw);
    }
  } catch (error) {
    console.error('Error cargando movimientos:', error);
    const raw = localStorage.getItem('erp_tesoreria_movimientos') || '[]';
    movimientos = JSON.parse(raw);
  }

  if (!Array.isArray(movimientos) || movimientos.length === 0) {
    alert('No hay movimientos de Tesorería para exportar.');
    return;
  }

  // Función auxiliar para formatear fecha
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

  // Función auxiliar para formatear tipo
  function formatearTipo(tipo, origen) {
    if (!tipo) {
      // Si no hay tipo, determinar según origen
      if (origen === 'CXC') {
        return 'Ingreso';
      }
      if (origen === 'CXP') {
        return 'Egreso';
      }
      return 'Egreso'; // Por defecto, si no hay origen, es egreso
    }
    const tipoLower = String(tipo).toLowerCase();
    if (tipoLower === 'ingreso') {
      return 'Ingreso';
    }
    if (tipoLower === 'egreso') {
      return 'Egreso';
    }
    if (tipoLower === 'movimiento') {
      // Si es movimiento, determinar según origen
      if (origen === 'CXC') {
        return 'Ingreso';
      }
      if (origen === 'CXP') {
        return 'Egreso';
      }
      // Si es movimiento sin origen específico, determinar por el monto o por defecto es Egreso
      return 'Egreso';
    }
    // Para cualquier otro tipo, intentar determinar según origen
    if (origen === 'CXC') {
      return 'Ingreso';
    }
    if (origen === 'CXP') {
      return 'Egreso';
    }
    // Por defecto, si no se puede determinar, es Egreso
    return 'Egreso';
  }

  // Función auxiliar para formatear proviene
  function formatearProviene(origen) {
    if (!origen) {
      return 'Tesoreria';
    }
    const origenUpper = String(origen).toUpperCase();
    if (origenUpper === 'CXC') {
      return 'CXC';
    }
    if (origenUpper === 'CXP') {
      return 'CXP';
    }
    return 'Tesoreria';
  }

  // Función auxiliar para obtener cliente o proveedor
  function obtenerClienteProveedor(m) {
    return m.clienteProveedor || m.cliente || m.proveedorCliente || m.proveedor || '';
  }

  // Cargar facturas de CXP una vez antes de procesar los movimientos
  let facturasCXP = [];
  try {
    // Intentar cargar desde Firebase primero
    if (window.firebaseRepos && window.firebaseRepos.cxp) {
      try {
        facturasCXP = await window.firebaseRepos.cxp.getAllFacturas();
        if (!Array.isArray(facturasCXP)) {
          facturasCXP = [];
        }
      } catch (error) {
        console.warn('⚠️ Error cargando facturas desde Firebase:', error);
      }
    }

    // Si no hay facturas desde Firebase, usar localStorage
    if (!Array.isArray(facturasCXP) || facturasCXP.length === 0) {
      const facturasData = localStorage.getItem('erp_cxp_facturas');
      if (facturasData) {
        facturasCXP = JSON.parse(facturasData);
        if (!Array.isArray(facturasCXP)) {
          facturasCXP = [];
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Error cargando facturas CXP:', error);
    facturasCXP = [];
  }

  // Función auxiliar para obtener número de factura, especialmente para movimientos CXP
  function obtenerNumeroFactura(m, facturas) {
    // Si ya tiene numeroFactura directamente, usarlo
    if (m.numeroFactura && m.numeroFactura.trim() !== '') {
      return m.numeroFactura;
    }

    // Si es movimiento de CXP, intentar extraer de la descripción
    if (m.origen === 'CXP' || m.categoria === 'Cuentas por Pagar') {
      // Formato: [CXP] - M16356
      if (m.descripcion) {
        const matchCXP = m.descripcion.match(/\[CXP\]\s*-\s*([A-Z0-9-]+)/);
        if (matchCXP && matchCXP[1]) {
          return matchCXP[1];
        }
      }

      // Si tiene facturasIncluidas, buscar el número de factura desde las facturas de CXP
      if (
        m.facturasIncluidas &&
        Array.isArray(m.facturasIncluidas) &&
        m.facturasIncluidas.length > 0 &&
        Array.isArray(facturas) &&
        facturas.length > 0
      ) {
        try {
          // Buscar la primera factura incluida
          const factura = facturas.find(f => m.facturasIncluidas.includes(f.id));
          if (factura && factura.numeroFactura) {
            return factura.numeroFactura;
          }
        } catch (error) {
          console.warn('⚠️ Error obteniendo número de factura desde facturasIncluidas:', error);
        }
      }
    }

    // Si no se encontró nada, devolver vacío
    return '';
  }

  const rows = movimientos.map(m => ({
    ID: m.id || '',
    Fecha: formatearFecha(m.fecha || m.fechaCreacion),
    Tipo: formatearTipo(m.tipo, m.origen),
    Proviene: formatearProviene(m.origen),
    'Cliente o Proveedor': obtenerClienteProveedor(m),
    'Servicio o Producto': m.servicioProducto || m.servicio || m.producto || '',
    'Tipo de Documento': m.tipoDocumento || m.tipoDocumento || '',
    'Número Factura': obtenerNumeroFactura(m, facturasCXP),
    'Fecha de Pago': formatearFecha(m.fechaPago),
    'Monto a Pagar': parseFloat(m.monto || 0).toFixed(2),
    Moneda: m.moneda || '',
    'Tipo de Cambio': m.tipoCambio ? parseFloat(m.tipoCambio).toFixed(4) : '',
    'Metodo de Pago': m.metodoPago || '',
    'Banco Origen': m.bancoOrigen || '',
    'Cuenta Origen': m.cuentaOrigen || '',
    'Banco Destino': m.bancoDestino || '',
    'Cuenta Destino': m.cuentaDestino || '',
    'Referencia Bancaria': m.referenciaBancaria || m.referencia || ''
  }));

  // Usar función base común
  await window.exportarDatosExcel({
    datos: rows,
    nombreArchivo: 'tesoreria',
    nombreHoja: 'Tesoreria',
    mensajeVacio: 'No hay movimientos de Tesorería para exportar.'
  });
};

// Exportar Solicitudes de Tesorería a Excel
window.exportarSolicitudesTesoreriaExcel = async function () {
  // Intentar obtener órdenes desde Firebase primero, luego localStorage
  let ordenes = [];

  try {
    if (window.firebaseRepos && window.firebaseRepos.tesoreria) {
      try {
        ordenes = await window.firebaseRepos.tesoreria.getAllOrdenesPago();
        if (!Array.isArray(ordenes)) {
          ordenes = [];
        }
      } catch (error) {
        console.warn('⚠️ Error cargando desde Firebase, usando localStorage:', error);
      }
    }

    // Si no hay órdenes desde Firebase, usar localStorage
    if (!Array.isArray(ordenes) || ordenes.length === 0) {
      const raw = localStorage.getItem('erp_teso_ordenes_pago') || '[]';
      ordenes = JSON.parse(raw);
    }
  } catch (error) {
    console.error('Error cargando órdenes:', error);
    const raw = localStorage.getItem('erp_teso_ordenes_pago') || '[]';
    ordenes = JSON.parse(raw);
  }

  if (!Array.isArray(ordenes) || ordenes.length === 0) {
    alert('No hay solicitudes de tesorería para exportar.');
    return;
  }

  // Función auxiliar para formatear fecha
  function formatearFecha(fechaStr) {
    if (!fechaStr) {
      return '';
    }
    try {
      if (typeof fechaStr === 'string') {
        if (fechaStr.includes('T')) {
          const fecha = new Date(fechaStr);
          return fecha.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        }
        const fecha = new Date(`${fechaStr}T00:00:00`);
        return fecha.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return String(fechaStr);
    }
  }

  // Función auxiliar para obtener números de facturas
  function obtenerFacturasIncluidas(op) {
    if (!Array.isArray(op.facturasIncluidas) || op.facturasIncluidas.length === 0) {
      return '';
    }

    try {
      const facturasData = localStorage.getItem('erp_cxp_facturas');
      const facturas = facturasData ? JSON.parse(facturasData) : [];

      const numerosFacturas = op.facturasIncluidas.map(fid => {
        const f = facturas.find(x => x.id === fid);
        return f && f.numeroFactura ? f.numeroFactura : `ID:${fid}`;
      });

      return numerosFacturas.join(', ');
    } catch (error) {
      return op.facturasIncluidas.join(', ');
    }
  }

  // Función auxiliar para obtener etiqueta de operación
  function obtenerOperacion(op) {
    const totalFacturas = Array.isArray(op.facturasIncluidas) ? op.facturasIncluidas.length : 0;
    if (totalFacturas > 1) {
      return `MULTI (${totalFacturas})`;
    } else if (totalFacturas === 1) {
      if (op.opNumeroFactura) {
        return op.opNumeroFactura;
      }
      try {
        const facturasData = localStorage.getItem('erp_cxp_facturas');
        const facturas = facturasData ? JSON.parse(facturasData) : [];
        const f = facturas.find(x => x.id === op.facturasIncluidas[0]);
        if (f && f.numeroFactura) {
          return f.numeroFactura;
        }
      } catch (_) {
        // Ignorar error intencionalmente
      }
    }
    return `OP-${op.id.toString().slice(-6)}`;
  }

  // Función auxiliar para formatear estado
  function formatearEstado(estado) {
    const estados = {
      por_pagar: 'Por Pagar',
      pagando: 'Pagando',
      pagado: 'Pagado',
      rechazado: 'Rechazado'
    };
    return estados[estado] || estado || '';
  }

  // Función auxiliar para formatear prioridad
  function formatearPrioridad(prioridad) {
    const prioridades = {
      normal: 'Normal',
      alta: 'Alta',
      urgente: 'Urgente'
    };
    return prioridades[prioridad] || prioridad || '';
  }

  const rows = ordenes.map(op => ({
    Operación: obtenerOperacion(op),
    Fecha: formatearFecha(op.createdAt || op.fechaRequerida),
    Proveedor: op.proveedor || '',
    Monto: parseFloat(op.monto || 0).toFixed(2),
    Estado: formatearEstado(op.estado),
    Prioridad: formatearPrioridad(op.prioridad),
    'Facturas Incluidas': obtenerFacturasIncluidas(op),
    'Monto Total': parseFloat(op.monto || 0).toFixed(2)
  }));

  // Usar función base común
  await window.exportarDatosExcel({
    datos: rows,
    nombreArchivo: 'solicitudes_tesoreria',
    nombreHoja: 'Solicitudes',
    mensajeVacio: 'No hay solicitudes de tesorería para exportar.'
  });
};
