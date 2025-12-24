// ===== Tesorería - Movimientos Manuales =====
class TesoreriaMovimientosManager {
  constructor() {
    this.storageKey = 'erp_tesoreria_movimientos';
    this.initializeData();
  }

  initializeData() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
  }

  async getMovimientos() {
    try {
      // PRIORIDAD 1: Intentar cargar desde Firebase
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

          // Intentar usar Firebase si está disponible
          try {
            if (repoTesoreria.db && repoTesoreria.tenantId) {
              console.log('📊 Cargando movimientos de tesorería desde Firebase...');
              const movimientos = await repoTesoreria.getAllMovimientos();
              // Asegurar que movimientos sea un array
              if (Array.isArray(movimientos) && movimientos.length > 0) {
                console.log(`✅ ${movimientos.length} movimientos cargados desde Firebase`);
                // Sincronizar con localStorage para compatibilidad
                this.setMovimientos(movimientos);
                return movimientos;
              } else if (Array.isArray(movimientos)) {
                // Si es un array vacío, también devolverlo
                console.log('✅ 0 movimientos cargados desde Firebase');
                return movimientos;
              }
              console.warn('⚠️ getAllMovimientos() no devolvió un array, usando localStorage');
            }
          } catch (error) {
            console.warn('⚠️ Error cargando desde Firebase, usando localStorage:', error);
          }
        } catch (error) {
          console.warn('⚠️ Error accediendo repositorio tesorería:', error);
        }
      }

      // PRIORIDAD 2: Fallback a localStorage
      const data = localStorage.getItem(this.storageKey);
      const movimientosLocal = data ? JSON.parse(data) : [];
      // Asegurar que siempre sea un array
      return Array.isArray(movimientosLocal) ? movimientosLocal : [];
    } catch (e) {
      console.error('Error loading tesoreria movements:', e);
      return [];
    }
  }

  setMovimientos(movimientos) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(movimientos));
    } catch (e) {
      console.error('Error saving tesoreria movements:', e);
    }
  }

  async saveMovimiento(movimiento) {
    const movimientos = await this.getMovimientos();
    // Asegurar que movimientos sea un array
    if (!Array.isArray(movimientos)) {
      console.error('⚠️ getMovimientos() no devolvió un array en saveMovimiento');
      return null;
    }

    // Usar la fecha del formulario (fechaPago) si está disponible, de lo contrario usar la fecha actual
    let fechaMovimiento = movimiento.fechaPago || movimiento.fecha;
    if (!fechaMovimiento) {
      fechaMovimiento = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    } else if (typeof fechaMovimiento === 'string') {
      // Si es formato YYYY-MM-DD, parsearlo directamente sin conversión de zona horaria
      if (/^\d{4}-\d{2}-\d{2}/.test(fechaMovimiento)) {
        // Ya está en formato YYYY-MM-DD, usarlo directamente
        fechaMovimiento = fechaMovimiento.split('T')[0]; // Tomar solo la parte de fecha si viene con hora
      } else if (fechaMovimiento.includes('T')) {
        // Formato ISO con hora, extraer solo la fecha
        fechaMovimiento = fechaMovimiento.split('T')[0];
      } else {
        // Otro formato, intentar parsear sin problemas de zona horaria
        // Si es formato DD/MM/YYYY
        if (fechaMovimiento.includes('/')) {
          const partes = fechaMovimiento.split('/');
          if (partes.length === 3) {
            const dia = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10) - 1;
            const año = parseInt(partes[2], 10);
            const fecha = new Date(año, mes, dia);
            const year = fecha.getFullYear();
            const month = String(fecha.getMonth() + 1).padStart(2, '0');
            const day = String(fecha.getDate()).padStart(2, '0');
            fechaMovimiento = `${year}-${month}-${day}`;
          } else {
            // Fallback: intentar parsear como Date
            const fecha = new Date(fechaMovimiento);
            const year = fecha.getFullYear();
            const month = String(fecha.getMonth() + 1).padStart(2, '0');
            const day = String(fecha.getDate()).padStart(2, '0');
            fechaMovimiento = `${year}-${month}-${day}`;
          }
        } else {
          // Fallback: intentar parsear como Date
          const fecha = new Date(fechaMovimiento);
          const year = fecha.getFullYear();
          const month = String(fecha.getMonth() + 1).padStart(2, '0');
          const day = String(fecha.getDate()).padStart(2, '0');
          fechaMovimiento = `${year}-${month}-${day}`;
        }
      }
    } else {
      // Si no es string, convertir a YYYY-MM-DD
      const fecha = new Date(fechaMovimiento);
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      fechaMovimiento = `${year}-${month}-${day}`;
    }

    const nuevoMovimiento = {
      id: Date.now(),
      fecha: fechaMovimiento, // Usar la fecha del formulario, no la fecha actual del sistema
      fechaCreacion: new Date().toISOString(), // Fecha de creación del registro
      ...movimiento
    };

    // Asegurar que el tipo se preserve correctamente
    if (movimiento.tipo) {
      nuevoMovimiento.tipo = movimiento.tipo;
    }

    movimientos.unshift(nuevoMovimiento);
    this.setMovimientos(movimientos);
    return nuevoMovimiento;
  }

  async deleteMovimiento(id) {
    const movimientos = await this.getMovimientos();
    // Asegurar que movimientos sea un array
    if (!Array.isArray(movimientos)) {
      console.error('⚠️ getMovimientos() no devolvió un array en deleteMovimiento');
      return;
    }
    const filtered = movimientos.filter(m => m.id !== id);
    this.setMovimientos(filtered);
  }

  async getMovimiento(id) {
    const movimientos = await this.getMovimientos();
    // Asegurar que movimientos sea un array antes de usar .find()
    if (!Array.isArray(movimientos)) {
      console.error('⚠️ getMovimientos() no devolvió un array');
      return null;
    }
    return movimientos.find(m => m.id === id);
  }
}

// ===== Tesorería Movimientos UI =====
class TesoreriaMovimientosUI {
  constructor() {
    this.movimientosManager = new TesoreriaMovimientosManager();
  }

  async loadHistorialTable(movimientosFiltrados = null) {
    const tbody = document.getElementById('tablaHistorialTesorería');
    if (!tbody) {
      return;
    }

    let movimientos = movimientosFiltrados;
    if (!movimientos) {
      movimientos = await this.movimientosManager.getMovimientos();
    }

    // Asegurar que movimientos sea un array
    if (!Array.isArray(movimientos)) {
      movimientos = [];
    }

    // Actualizar descripciones de movimientos CXP con números de factura
    movimientos = await this.actualizarDescripcionesCXP(movimientos);

    // Agrupar movimientos CXC con la misma referencia para mostrar "Varias"
    const movimientosAgrupados = this.agruparMovimientosCXC(movimientos);

    // Ordenar movimientos por fecha del movimiento (más recientes primero)
    const movimientosOrdenados = movimientosAgrupados.sort((a, b) => {
      // Usar prioritariamente el campo 'fecha' (fecha del movimiento), no 'fechaCreacion'
      const fechaAStr = a.fecha || a.fechaCreacion || '';
      const fechaBStr = b.fecha || b.fechaCreacion || '';

      // Si las fechas están en formato YYYY-MM-DD, compararlas directamente como strings
      if (/^\d{4}-\d{2}-\d{2}$/.test(fechaAStr) && /^\d{4}-\d{2}-\d{2}$/.test(fechaBStr)) {
        return fechaBStr.localeCompare(fechaAStr); // Orden descendente (más reciente primero)
      }

      // Para otros formatos, convertir a Date
      const fechaA = new Date(fechaAStr || 0);
      const fechaB = new Date(fechaBStr || 0);
      return fechaB - fechaA; // Orden descendente (más recientes primero)
    });

    // Guardar movimientos completos para paginación
    window._movimientosTesoreriaCompletos = movimientosOrdenados;

    // Inicializar paginación
    // Esperar un momento para asegurar que PaginacionManager esté disponible
    let PaginacionManagerClass = null;
    if (typeof window !== 'undefined' && window.PaginacionManager) {
      PaginacionManagerClass = window.PaginacionManager;
    } else if (typeof PaginacionManager !== 'undefined') {
      PaginacionManagerClass = PaginacionManager;
    }

    if (!PaginacionManagerClass) {
      console.warn(
        '⚠️ PaginacionManager no está disponible, mostrando todos los movimientos sin paginación'
      );
      console.warn(
        '   window.PaginacionManager:',
        typeof window !== 'undefined' ? window.PaginacionManager : 'window no disponible'
      );
      this.renderizarMovimientos(movimientosOrdenados);
      return;
    }

    if (!window._paginacionTesoreriaManager) {
      try {
        window._paginacionTesoreriaManager = new PaginacionManagerClass();
        console.log('✅ Nueva instancia de PaginacionManager creada para Tesorería');
      } catch (error) {
        console.error('❌ Error creando instancia de PaginacionManager:', error);
        this.renderizarMovimientos(movimientosOrdenados);
        return;
      }
    }

    try {
      // Crear array de IDs para paginación
      const movimientosIds = movimientosOrdenados.map(m =>
        String(m.id || Date.now() + Math.random())
      );
      window._paginacionTesoreriaManager.inicializar(movimientosIds, 15);
      window._paginacionTesoreriaManager.paginaActual = 1;
      console.log(
        `✅ Paginación inicializada: ${window._paginacionTesoreriaManager.totalRegistros} movimientos, ${window._paginacionTesoreriaManager.obtenerTotalPaginas()} páginas`
      );

      // Renderizar movimientos de la página actual
      this.renderizarMovimientos();

      // Generar controles de paginación
      const contenedorPaginacion = document.getElementById('paginacionTesoreria');
      if (contenedorPaginacion && window._paginacionTesoreriaManager) {
        contenedorPaginacion.innerHTML =
          window._paginacionTesoreriaManager.generarControlesPaginacion(
            'paginacionTesoreria',
            'cambiarPaginaTesoreria'
          );
      }
    } catch (error) {
      console.error('❌ Error inicializando paginación:', error);
      this.renderizarMovimientos(movimientosOrdenados);
    }
  }

  renderizarMovimientos(movimientosParaRenderizar = null) {
    const tbody = document.getElementById('tablaHistorialTesorería');
    if (!tbody) {
      return;
    }

    tbody.innerHTML = '';

    // Si se proporcionan movimientos específicos, renderizarlos directamente
    if (movimientosParaRenderizar) {
      if (movimientosParaRenderizar.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="10" class="text-center text-muted">No hay movimientos registrados</td></tr>';
        return;
      }
      movimientosParaRenderizar.forEach(mov => {
        this.renderizarFilaMovimiento(mov, tbody);
      });
      return;
    }

    // Si no se proporcionan, usar paginación
    if (!window._paginacionTesoreriaManager || !window._movimientosTesoreriaCompletos) {
      console.warn(
        '⚠️ No se puede renderizar: paginacion=',
        Boolean(window._paginacionTesoreriaManager),
        'movimientos=',
        Boolean(window._movimientosTesoreriaCompletos)
      );
      return;
    }

    const movimientosIds = window._paginacionTesoreriaManager.obtenerRegistrosPagina();
    const movimientosMap = {};
    window._movimientosTesoreriaCompletos.forEach(mov => {
      const id = String(mov.id || Date.now() + Math.random());
      movimientosMap[id] = mov;
    });

    const movimientosPagina = movimientosIds
      .map(id => movimientosMap[id])
      .filter(mov => mov !== undefined);

    if (movimientosPagina.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="11" class="text-center text-muted">No hay movimientos registrados</td></tr>';
      return;
    }

    movimientosPagina.forEach(mov => {
      this.renderizarFilaMovimiento(mov, tbody);
    });

    // Actualizar controles de paginación
    const contenedorPaginacion = document.getElementById('paginacionTesoreria');
    if (contenedorPaginacion && window._paginacionTesoreriaManager) {
      contenedorPaginacion.innerHTML =
        window._paginacionTesoreriaManager.generarControlesPaginacion(
          'paginacionTesoreria',
          'cambiarPaginaTesoreria'
        );
    }

    console.log(
      `✅ ${window._paginacionTesoreriaManager.totalRegistros} movimientos de tesorería cargados (página ${window._paginacionTesoreriaManager.paginaActual} de ${window._paginacionTesoreriaManager.obtenerTotalPaginas()})`
    );
  }

  renderizarFilaMovimiento(mov, tbody) {
    const tr = document.createElement('tr');

    // Determinar icono y color según el origen
    let icono = '';
    let colorBadge = '';
    let descripcion = mov.descripcion || '-';

    // Si no hay descripción y no es CXC/CXP, usar numeroFactura si está disponible
    if (
      (descripcion === '-' || !descripcion) &&
      mov.origen !== 'CXC' &&
      mov.origen !== 'CXP' &&
      mov.categoria !== 'Cuentas por Pagar' &&
      mov.categoria !== 'Cuentas por Cobrar'
    ) {
      if (mov.numeroFactura && mov.numeroFactura.trim() !== '') {
        descripcion = mov.numeroFactura;
      }
    }

    if (mov.origen === 'CXC') {
      icono = '💰';
      colorBadge = 'bg-info';
      // Normalizar descripción CXC: formato [CXC] - número de factura o [CXC] - Varias
      if (descripcion.includes('[CXC]')) {
        // Formato antiguo: [CXC] Pago de factura FAC-2025-002 - Empresa ABC S.A. de C.V.
        // Formato nuevo: [CXC] - F-97255463
        const matchAntiguo = descripcion.match(/\[CXC\].*?Pago de factura\s+([A-Z0-9-]+)\s*-/i);
        if (matchAntiguo && matchAntiguo[1]) {
          descripcion = `[CXC] - ${matchAntiguo[1]}`;
        } else if (!descripcion.match(/\[CXC\]\s*-\s*/)) {
          // Si tiene [CXC] pero no el formato correcto, intentar extraer número de factura
          const matchFactura = descripcion.match(/([A-Z]{1,}[-\s]?[0-9-]+)/i);
          if (matchFactura && matchFactura[1]) {
            descripcion = `[CXC] - ${matchFactura[1].trim()}`;
          }
        }
      } else {
        // Si no tiene [CXC], agregarlo
        if (descripcion !== 'Varias' && descripcion !== '-') {
          descripcion = `[CXC] - ${descripcion}`;
        }
      }
      // Si la descripción es "Varias" o hay facturasIncluidas, mostrar "[CXC] - Varias"
      if (
        descripcion === 'Varias' ||
        (mov.facturasIncluidas &&
          Array.isArray(mov.facturasIncluidas) &&
          mov.facturasIncluidas.length > 1)
      ) {
        descripcion = '[CXC] - Varias';
      }
    } else if (mov.origen === 'CXP' || mov.categoria === 'Cuentas por Pagar') {
      icono = '💸';
      colorBadge = 'bg-danger';
      // Si la descripción ya tiene el formato [CXP] - A-56165, mantenerla
      if (
        descripcion &&
        /\[CXP\]\s*-\s*[A-Z0-9-]+/.test(descripcion) &&
        !descripcion.includes('Solicitud')
      ) {
        // Ya tiene el formato correcto, no cambiar
      } else if (descripcion.includes('[CXP]')) {
        // Formato antiguo: [CXP] Pago a proveedor Combustibles y Lubricantes del Norte - Solicitud 1764453386370
        // Formato nuevo: [CXP] - Solicitud 1764453386370 (se actualizará después con número de factura)
        const matchAntiguo = descripcion.match(
          /\[CXP\].*?Pago a proveedor\s+[^-]+-\s*Solicitud\s+(\d+)/i
        );
        if (matchAntiguo && matchAntiguo[1]) {
          descripcion = `[CXP] - Solicitud ${matchAntiguo[1]}`;
        } else if (descripcion.match(/\[CXP\]\s*-\s*Solicitud\s+\d+$/)) {
          // Mantener formato [CXP] - Solicitud [ID] (se actualizará si se encuentra número de factura)
        } else {
          // Intentar extraer ID de solicitud
          const matchSolicitud = descripcion.match(/Solicitud\s+(\d+)/i);
          if (matchSolicitud && matchSolicitud[1]) {
            descripcion = `[CXP] - Solicitud ${matchSolicitud[1]}`;
          }
        }
      } else {
        descripcion = `[CXP] ${descripcion}`;
      }
    } else if (mov.origen === 'Tráfico' || mov.categoria === 'Tráfico') {
      icono = '🚛';
      colorBadge = 'bg-primary';
    } else if (mov.origen === 'Operadores' || mov.categoria === 'Operadores') {
      icono = '👥';
      colorBadge = 'bg-warning';
    } else {
      icono = mov.tipo === 'ingreso' ? '📈' : '📉';
      colorBadge = mov.tipo === 'ingreso' ? 'bg-success' : 'bg-danger';
    }

    // Formatear fecha (puede venir como fecha o fechaCreacion)
    const fechaMov = mov.fecha || mov.fechaCreacion || new Date().toISOString();
    let fechaFormateada = '-';
    try {
      if (typeof fechaMov === 'string') {
        // Si es formato YYYY-MM-DD, parsearlo directamente sin conversión de zona horaria
        if (/^\d{4}-\d{2}-\d{2}/.test(fechaMov)) {
          const fechaStr = fechaMov.split('T')[0]; // Tomar solo la parte de fecha si viene con hora
          const [year, month, day] = fechaStr.split('-');
          const fecha = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
          fechaFormateada = fecha.toLocaleDateString('es-MX');
        } else if (fechaMov.includes('T')) {
          // Formato ISO con hora
          fechaFormateada = new Date(fechaMov).toLocaleDateString('es-MX');
        } else {
          // Otro formato, intentar parsear directamente
          fechaFormateada = new Date(fechaMov).toLocaleDateString('es-MX');
        }
      } else {
        fechaFormateada = new Date(fechaMov).toLocaleDateString('es-MX');
      }
    } catch (e) {
      console.warn('⚠️ Error formateando fecha:', fechaMov, e);
      fechaFormateada = String(fechaMov);
    }

    // Extraer número de factura para movimientos CXP desde la descripción
    let numeroFacturaMostrar = mov.numeroFactura || '-';
    if ((mov.origen === 'CXP' || mov.categoria === 'Cuentas por Pagar') && descripcion) {
      // Si la descripción tiene formato [CXP] - S51553 o [CXP] - A-56165, extraer el número
      const matchCXP = descripcion.match(/\[CXP\]\s*-\s*([A-Z0-9-]+)/);
      if (matchCXP && matchCXP[1]) {
        numeroFacturaMostrar = matchCXP[1];
      } else if (descripcion.includes('[CXP]') && mov.numeroFactura) {
        // Si tiene [CXP] pero no el formato correcto, usar numeroFactura si está disponible
        numeroFacturaMostrar = mov.numeroFactura;
      }
    }

    tr.innerHTML = `
        <td>${mov.id}</td>
        <td>${fechaFormateada}</td>
        <td>
          <span class="badge ${colorBadge}">
            ${icono} ${this.formatTipo(mov.tipo, mov.origen)}
          </span>
        </td>
        <td>${descripcion}</td>
        <td>${mov.clienteProveedor || mov.cliente || mov.proveedorCliente || '-'}</td>
        <td>$${parseFloat(mov.monto || 0).toFixed(2)}</td>
        <td>${this.formatMetodoPago(mov.metodoPago)}</td>
        <td>${numeroFacturaMostrar}</td>
        <td>${mov.referenciaBancaria || mov.referencia || '-'}</td>
        <td>
          <div class="btn-group" role="group">
          <button class="btn btn-sm btn-outline-info" onclick="tesoreriaMovimientosUI.verDetalles(${mov.id})" title="Ver detalles">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-secondary" onclick="tesoreriaMovimientosUI.descargarPDFTesoreria(${mov.id})" title="Descargar PDF">
            <i class="fas fa-file-pdf"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="tesoreriaMovimientosUI.eliminarMovimiento(${mov.id})" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
          </div>
        </td>
      `;
    tbody.appendChild(tr);
  }

  // Actualizar descripciones de movimientos CXP con números de factura
  async actualizarDescripcionesCXP(movimientos) {
    try {
      // Cargar facturas de CXP
      let facturas = [];

      // PRIORIDAD 1: Cargar desde Firebase
      if (window.firebaseRepos && window.firebaseRepos.cxp) {
        try {
          facturas = await window.firebaseRepos.cxp.getAllFacturas();
          console.log(
            `📊 ${facturas.length} facturas CXP cargadas desde Firebase para actualizar descripciones`
          );
        } catch (error) {
          console.warn('⚠️ Error cargando facturas desde Firebase:', error);
        }
      }

      // PRIORIDAD 2: Cargar desde localStorage
      if (facturas.length === 0) {
        const facturasData = localStorage.getItem('erp_cxp_facturas');
        if (facturasData) {
          facturas = JSON.parse(facturasData);
          console.log(
            `📊 ${facturas.length} facturas CXP cargadas desde localStorage para actualizar descripciones`
          );
        }
      }

      // Procesar movimientos de CXP
      return movimientos.map(mov => {
        // Solo procesar movimientos de CXP
        if (mov.origen !== 'CXP' && mov.categoria !== 'Cuentas por Pagar') {
          return mov;
        }

        // Si la descripción ya tiene el formato correcto [CXP] - A-56165, no cambiar
        if (
          mov.descripcion &&
          /\[CXP\]\s*-\s*[A-Z0-9-]+/.test(mov.descripcion) &&
          !mov.descripcion.includes('Solicitud')
        ) {
          return mov;
        }

        // Buscar número de factura desde facturasIncluidas
        if (
          mov.facturasIncluidas &&
          Array.isArray(mov.facturasIncluidas) &&
          mov.facturasIncluidas.length > 0
        ) {
          const factura = facturas.find(f => mov.facturasIncluidas.includes(f.id));
          if (factura && factura.numeroFactura) {
            return {
              ...mov,
              descripcion: `[CXP] - ${factura.numeroFactura}`
            };
          }
        }

        // Si la descripción tiene formato [CXP] - Solicitud [ID], intentar obtener el número de factura
        if (mov.descripcion && mov.descripcion.includes('[CXP]')) {
          const matchSolicitud = mov.descripcion.match(/Solicitud\s+(\d+)/i);
          if (matchSolicitud && matchSolicitud[1]) {
            // Buscar por solicitudId si está disponible
            if (mov.solicitudId) {
              // Intentar encontrar facturas asociadas a esta solicitud
              // Las facturas pueden estar relacionadas por el solicitudId o por facturasIncluidas
              // Por ahora, si no encontramos factura, mantener la descripción original
            }
          }
        }

        return mov;
      });
    } catch (error) {
      console.error('❌ Error actualizando descripciones CXP:', error);
      return movimientos; // En caso de error, devolver movimientos sin modificar
    }
  }

  // Agrupar movimientos CXC con la misma referencia para mostrar "Varias"
  agruparMovimientosCXC(movimientos) {
    const movimientosCXC = movimientos.filter(m => m.origen === 'CXC');
    const movimientosOtros = movimientos.filter(m => m.origen !== 'CXC');

    // Agrupar por referencia y fecha
    const grupos = {};
    movimientosCXC.forEach(mov => {
      const clave = `${mov.referencia || mov.referenciaBancaria || ''}_${mov.fecha || ''}`;
      if (!grupos[clave]) {
        grupos[clave] = [];
      }
      grupos[clave].push(mov);
    });

    // Actualizar movimientos que están en grupos de más de uno
    Object.values(grupos).forEach(grupo => {
      if (grupo.length > 1) {
        const facturasIncluidas = grupo
          .map(m => {
            // Extraer número de factura de la descripción si tiene formato [CXC] - F-xxx
            if (m.descripcion && m.descripcion.includes('[CXC] - ')) {
              return m.descripcion.replace('[CXC] - ', '').trim();
            }
            return m.numeroFactura || m.descripcion;
          })
          .filter(n => n && n !== 'Varias' && n !== '[CXC] - Varias');

        grupo.forEach(mov => {
          mov.descripcion = '[CXC] - Varias';
          mov.facturasIncluidas = facturasIncluidas;
        });
      }
    });

    return [...movimientosCXC, ...movimientosOtros];
  }

  formatTipo(tipo, origen) {
    // Si el tipo es explícitamente 'ingreso', retornar 'Ingreso'
    if (tipo === 'ingreso') {
      return 'Ingreso';
    }

    // Si el tipo es explícitamente 'egreso', retornar 'Egreso'
    if (tipo === 'egreso') {
      return 'Egreso';
    }

    // Si el tipo es 'movimiento' u otro, determinar según el origen
    // CXC (Cuentas por Cobrar) siempre son ingresos (dinero que entra)
    if (origen === 'CXC') {
      return 'Ingreso';
    }

    // CXP (Cuentas por Pagar) siempre son egresos (dinero que sale)
    if (origen === 'CXP') {
      return 'Egreso';
    }

    // Por defecto, si no se puede determinar, mostrar 'Egreso'
    return 'Egreso';
  }

  formatMoneda(moneda) {
    return moneda === 'mxn' ? 'MXN' : moneda === 'dls' ? 'USD' : moneda || '-';
  }

  formatMetodoPago(metodo) {
    const metodos = {
      transferencia: 'Transferencia',
      cheque: 'Cheque',
      efectivo: 'Efectivo',
      tarjetacredito: 'Tarjeta Crédito',
      tarjetadebito: 'Tarjeta Débito',
      otro: 'Otro'
    };
    return metodos[metodo] || metodo || '-';
  }

  async guardarMovimiento() {
    console.log('🚀 Iniciando guardado de movimiento tesorería...');

    // Verificar si ya hay un proceso en curso
    if (window._tesoreriaGuardandoMovimiento) {
      console.log('⚠️ Ya hay un proceso de guardado en curso, ignorando clic duplicado');
      return false;
    }

    // Marcar que hay un proceso en curso
    window._tesoreriaGuardandoMovimiento = true;

    // Obtener el botón de guardar y bloquearlo
    const botonGuardar =
      document.querySelector('[data-action="guardarMovimiento"]') ||
      document.getElementById('btnGuardarMovimiento') ||
      document.querySelector('button[type="submit"]');
    let botonOriginalHTML = '';
    let botonOriginalDisabled = false;

    // Función para restaurar el botón
    const restaurarBoton = () => {
      if (botonGuardar) {
        botonGuardar.disabled = botonOriginalDisabled;
        botonGuardar.innerHTML = botonOriginalHTML;
        botonGuardar.style.cursor = '';
        botonGuardar.style.opacity = '';
      }
      window._tesoreriaGuardandoMovimiento = false;
    };

    if (botonGuardar) {
      botonOriginalHTML = botonGuardar.innerHTML;
      botonOriginalDisabled = botonGuardar.disabled;
      botonGuardar.disabled = true;
      botonGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
      botonGuardar.style.cursor = 'not-allowed';
      botonGuardar.style.opacity = '0.6';
      console.log('✅ Botón bloqueado y mostrando "Procesando..."');
    } else {
      console.warn('⚠️ Botón de guardar no encontrado');
    }

    const form = document.querySelector('.needs-validation');
    if (!form) {
      console.error('❌ Formulario no encontrado');
      this.showNotification('Error: Formulario no encontrado', 'error');
      restaurarBoton();
      return false;
    }

    // Validar formulario
    if (!form.checkValidity()) {
      console.log('⚠️ Formulario no válido, agregando validación visual...');
      form.classList.add('was-validated');
      this.showNotification('Por favor completa todos los campos requeridos', 'error');
      // Restaurar botón
      if (botonGuardar) {
        botonGuardar.disabled = botonOriginalDisabled;
        botonGuardar.innerHTML = botonOriginalHTML;
        botonGuardar.style.cursor = '';
        botonGuardar.style.opacity = '';
      }
      return false;
    }

    // Recopilar datos del formulario
    const tipoMovimiento = document.getElementById('ingresoegreso')?.value || '';
    const bancoOrigenForm = document.getElementById('bancoorigen')?.value || '';
    const cuentaOrigenForm = document.getElementById('cuentaorigen')?.value || '';
    const bancoDestinoForm = document.getElementById('bancodestino')?.value || '';
    const cuentaDestinoForm = document.getElementById('cuentadestino')?.value || '';

    // Lógica de interpretación de campos según el tipo de movimiento:
    //
    // Para INGRESO: El dinero viene DE afuera (proveedor/cliente) HACIA nosotros
    //   - bancoOrigen (guardado) = Banco del proveedor/cliente que nos paga
    //   - cuentaOrigen (guardado) = Cuenta del proveedor/cliente que nos paga
    //   - bancoDestino (guardado) = Nuestro banco (donde recibimos)
    //   - cuentaDestino (guardado) = Nuestra cuenta (donde recibimos)
    //
    // Para EGRESO: El dinero sale DE nosotros HACIA afuera (proveedor/cliente)
    //   - bancoOrigen (guardado) = Nuestro banco (de donde sale)
    //   - cuentaOrigen (guardado) = Nuestra cuenta (de donde sale)
    //   - bancoDestino (guardado) = Banco del proveedor/cliente (a quien pagamos)
    //   - cuentaDestino (guardado) = Cuenta del proveedor/cliente (a quien pagamos)
    //
    // PROBLEMA: Actualmente cuando el usuario hace INGRESO, está seleccionando
    // "Nuestro Banco" en "Banco Origen" del formulario, pero debería estar en "Banco Destino".
    // Por lo tanto, necesitamos intercambiar los valores cuando es INGRESO.

    let bancoOrigen, cuentaOrigen, bancoDestino, cuentaDestino;

    if (tipoMovimiento === 'ingreso') {
      // Para INGRESO: El dinero viene DE afuera (proveedor/cliente) HACIA nosotros
      // El usuario está seleccionando "Nuestro Banco" en "Banco Origen" del formulario,
      // pero ese debería ser el "Banco Destino" (donde recibimos).
      // Intercambiamos los valores para que quede correcto:
      bancoOrigen = bancoDestinoForm; // Banco del proveedor/cliente que nos paga (del campo "Banco Destino" del formulario)
      cuentaOrigen = cuentaDestinoForm; // Cuenta del proveedor/cliente que nos paga
      bancoDestino = bancoOrigenForm; // Nuestro banco (del campo "Banco Origen" del formulario)
      cuentaDestino = cuentaOrigenForm; // Nuestra cuenta

      console.log('💰 INGRESO: Intercambiando valores bancarios');
      console.log(
        `  - bancoOrigen (guardado) = ${bancoOrigen} (del campo "Banco Destino" del formulario)`
      );
      console.log(
        `  - bancoDestino (guardado) = ${bancoDestino} (del campo "Banco Origen" del formulario)`
      );
    } else {
      // Para EGRESO: El dinero sale DE nosotros HACIA afuera (proveedor/cliente)
      // Los valores están correctos como están en el formulario
      bancoOrigen = bancoOrigenForm; // Nuestro banco (de donde sale)
      cuentaOrigen = cuentaOrigenForm; // Nuestra cuenta
      bancoDestino = bancoDestinoForm; // Banco del proveedor/cliente al que pagamos
      cuentaDestino = cuentaDestinoForm; // Cuenta del proveedor/cliente al que pagamos

      console.log('💸 EGRESO: Valores bancarios correctos sin intercambio');
    }

    // Obtener monto y limpiar formato antes de parsear
    const montoInput = document.getElementById('montoapagar');
    let montoValue = 0;
    if (montoInput && montoInput.value) {
      // Limpiar formato de moneda (remover comas y símbolos)
      const montoLimpio = montoInput.value
        .toString()
        .replace(/[$,]/g, '')
        .replace(/\s/g, '')
        .trim();
      montoValue = parseFloat(montoLimpio) || 0;
    }

    const movimiento = {
      tipo: tipoMovimiento,
      clienteProveedor: document.getElementById('Proveedor')?.value || '',
      origen: document.getElementById('origen')?.value || '',
      tipoDocumento: document.getElementById('tipodocumento')?.value || '',
      numeroFactura: document.getElementById('numeroFactura')?.value || '',
      fechaPago: document.getElementById('fechapago')?.value || '',
      monto: montoValue,
      moneda: document.getElementById('tipomoneda')?.value || '',
      tipoCambio: (() => {
        const valor = document.getElementById('tipoCambioTesorería')?.value || 0;
        const numero = parseFloat(valor);
        return isNaN(numero) ? 0 : parseFloat(numero.toFixed(4));
      })(),
      servicioProducto: document.getElementById('servicioproducto')?.value || '',
      metodoPago: document.getElementById('metodopago')?.value || '',
      bancoOrigen: bancoOrigen,
      cuentaOrigen: cuentaOrigen,
      bancoDestino: bancoDestino,
      cuentaDestino: cuentaDestino,
      referenciaBancaria: document.getElementById('referenciabancaria')?.value || '',
      observaciones: document.querySelector('input[name="observaciones"]:checked')?.value || 'no',
      descripcionObservaciones: document.getElementById('descripcion')?.value || ''
    };

    console.log('📝 Datos del movimiento:', movimiento);

    // Validar datos críticos
    if (
      !movimiento.tipo ||
      !movimiento.clienteProveedor ||
      !movimiento.monto ||
      !movimiento.metodoPago
    ) {
      console.error('❌ Datos críticos faltantes');
      this.showNotification('Por favor completa todos los campos requeridos', 'error');
      restaurarBoton();
      return false;
    }

    // Validar tipo de cambio si la moneda es USD
    if (movimiento.moneda === 'dls' && (!movimiento.tipoCambio || movimiento.tipoCambio <= 0)) {
      console.error('❌ Tipo de cambio requerido para USD');
      this.showNotification('Por favor ingresa el tipo de cambio para USD', 'error');
      // Restaurar botón
      if (botonGuardar) {
        botonGuardar.disabled = botonOriginalDisabled;
        botonGuardar.innerHTML = botonOriginalHTML;
        botonGuardar.style.cursor = '';
        botonGuardar.style.opacity = '';
      }
      return false;
    }

    try {
      console.log('💾 Guardando movimiento...');
      await this.movimientosManager.saveMovimiento(movimiento);
      console.log('✅ Movimiento guardado exitosamente');

      // Intentar guardar en Firebase también
      if (window.firebaseRepos && window.firebaseRepos.tesoreria) {
        try {
          // Obtener el movimiento guardado para tener el ID y la fecha correcta
          const movimientos = await this.movimientosManager.getMovimientos();
          const movimientoGuardado = movimientos.find(
            m =>
              m.clienteProveedor === movimiento.clienteProveedor &&
              m.monto === movimiento.monto &&
              m.fechaPago === movimiento.fechaPago
          );

          if (movimientoGuardado) {
            // Usar el movimiento guardado que ya tiene el ID y la fecha correcta
            // Asegurar que la fecha se preserve correctamente (ya parseada en saveMovimiento)
            let fechaParaFirebase = movimientoGuardado.fecha || movimiento.fechaPago;
            // Si la fecha viene en formato YYYY-MM-DD, usarla directamente
            if (
              typeof fechaParaFirebase === 'string' &&
              /^\d{4}-\d{2}-\d{2}/.test(fechaParaFirebase)
            ) {
              fechaParaFirebase = fechaParaFirebase.split('T')[0];
            }

            const movimientoParaFirebase = {
              ...movimientoGuardado,
              // Asegurar que el tipo se preserve
              tipo: movimientoGuardado.tipo || movimiento.tipo,
              // Asegurar que la fecha sea la del formulario (ya parseada correctamente)
              fecha: fechaParaFirebase,
              fechaCreacion: movimientoGuardado.fechaCreacion || new Date().toISOString()
            };

            await window.firebaseRepos.tesoreria.saveMovimiento(
              movimientoGuardado.id.toString(),
              movimientoParaFirebase
            );
            console.log('✅ Movimiento guardado en Firebase:', movimientoParaFirebase);
          } else {
            // Fallback si no se encuentra el movimiento guardado
            const movimientoConId = {
              ...movimiento,
              id: Date.now(),
              fecha: movimiento.fechaPago || new Date().toISOString().split('T')[0],
              fechaCreacion: new Date().toISOString(),
              // Asegurar que el tipo se preserve
              tipo: movimiento.tipo
            };
            await window.firebaseRepos.tesoreria.saveMovimiento(
              movimientoConId.id.toString(),
              movimientoConId
            );
            console.log('✅ Movimiento guardado en Firebase (fallback):', movimientoConId);
          }
        } catch (error) {
          console.warn('⚠️ Error guardando en Firebase (se guardó en localStorage):', error);
        }
      }

      await this.loadHistorialTable();
      this.clearForm();
      this.showNotification('Movimiento de tesorería guardado exitosamente', 'success');

      // Restaurar botón antes de recargar
      restaurarBoton();

      // Recargar la página después de un breve delay para que se vea la notificación
      setTimeout(() => {
        window.location.reload();
      }, 500);

      return true;
    } catch (e) {
      console.error('❌ Error saving tesoreria movement:', e);
      this.showNotification(`Error al guardar el movimiento: ${e.message}`, 'error');
      restaurarBoton();
      return false;
    }
  }

  clearForm() {
    console.log('🧹 Limpiando formulario tesorería...');

    const form = document.querySelector('.needs-validation');
    if (form) {
      form.reset();
      form.classList.remove('was-validated');
    }

    // Ocultar tipo de cambio
    const tipoCambioDiv = document.getElementById('grupoTipoCambioTesorería');
    if (tipoCambioDiv) {
      tipoCambioDiv.style.display = 'none';
    }

    // Ocultar observaciones
    const observacionesDiv = document.getElementById('descripcionObservaciones');
    if (observacionesDiv) {
      observacionesDiv.style.display = 'none';
    }

    // Resetear radio buttons de observaciones
    const observacionesNo = document.getElementById('observacionesNo');
    if (observacionesNo) {
      observacionesNo.checked = true;
    }

    console.log('✅ Formulario tesorería limpiado');
  }

  async verDetalles(id) {
    const movimiento = await this.movimientosManager.getMovimiento(id);
    if (!movimiento) {
      alert('Movimiento no encontrado');
      return;
    }

    // Formatear fecha de forma segura
    let fechaFormateada = '-';
    try {
      if (movimiento.fecha) {
        const fechaStr = movimiento.fecha;
        // Si es formato YYYY-MM-DD, parsearlo directamente sin conversión de zona horaria
        if (typeof fechaStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
          const fechaStrClean = fechaStr.split('T')[0];
          const [year, month, day] = fechaStrClean.split('-');
          const fecha = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
          fechaFormateada = fecha.toLocaleString('es-MX');
        } else {
          fechaFormateada = new Date(fechaStr).toLocaleString('es-MX');
        }
      }
    } catch (e) {
      console.warn('Error formateando fecha:', e);
    }

    // Construir el contenido HTML del modal
    const detallesHTML = `
      <div class="row g-3">
        <div class="col-md-6">
          <p><strong>ID:</strong> ${movimiento.id || '-'}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Fecha:</strong> ${fechaFormateada}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Tipo:</strong> ${this.formatTipo(movimiento.tipo, movimiento.origen)}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Cliente/Proveedor:</strong> ${movimiento.clienteProveedor || movimiento.cliente || movimiento.proveedorCliente || movimiento.proveedor || '-'}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Origen:</strong> ${movimiento.origen || '-'}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Tipo Documento:</strong> ${movimiento.tipoDocumento || '-'}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Número Factura:</strong> ${movimiento.numeroFactura || '-'}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Fecha Pago:</strong> ${movimiento.fechaPago || '-'}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Monto:</strong> $${parseFloat(movimiento.monto || 0).toFixed(2)}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Moneda:</strong> ${this.formatMoneda(movimiento.moneda)}</p>
        </div>
        ${
  movimiento.moneda === 'dls' && movimiento.tipoCambio
    ? `
        <div class="col-md-6">
          <p><strong>Tipo de Cambio:</strong> $${parseFloat(movimiento.tipoCambio).toFixed(4)} MXN por USD</p>
        </div>
        `
    : ''
}
        <div class="col-md-6">
          <p><strong>Servicio/Producto:</strong> ${movimiento.servicioProducto || '-'}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Método Pago:</strong> ${this.formatMetodoPago(movimiento.metodoPago)}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Banco Origen:</strong> ${movimiento.bancoOrigen || '-'}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Cuenta Origen:</strong> ${movimiento.cuentaOrigen || '-'}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Banco Destino:</strong> ${movimiento.bancoDestino || '-'}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Cuenta Destino:</strong> ${movimiento.cuentaDestino || '-'}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Referencia Bancaria:</strong> ${movimiento.referenciaBancaria || '-'}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Observaciones:</strong> ${movimiento.observaciones || 'No'}</p>
        </div>
        ${
  movimiento.descripcionObservaciones
    ? `
        <div class="col-12">
          <p><strong>Descripción:</strong> ${movimiento.descripcionObservaciones}</p>
        </div>
        `
    : ''
}
        ${
  movimiento.descripcion === '[CXC] - Varias' ||
          (movimiento.facturasIncluidas &&
            Array.isArray(movimiento.facturasIncluidas) &&
            movimiento.facturasIncluidas.length > 1)
    ? `
        <div class="col-12">
          <p><strong>Facturas Incluidas:</strong></p>
          <p>${(movimiento.facturasIncluidas || []).join(' - ')}</p>
        </div>
        `
    : movimiento.numeroFactura && movimiento.descripcion !== '[CXC] - Varias'
      ? `
        <div class="col-12">
          <p><strong>Número de Factura:</strong> ${movimiento.numeroFactura}</p>
        </div>
        `
      : ''
}
      </div>
    `;

    // Obtener el modal y actualizar su contenido
    const modalContent = document.getElementById('detallesMovimientoContent');
    if (modalContent) {
      modalContent.innerHTML = detallesHTML;

      // Mostrar el modal
      const modalElement = document.getElementById('modalDetallesMovimiento');
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    } else {
      // Fallback a alert si el modal no existe
      console.warn('Modal de detalles no encontrado, usando alert');
      alert(
        `ID: ${movimiento.id}\nFecha: ${fechaFormateada}\nTipo: ${this.formatTipo(movimiento.tipo, movimiento.origen)}\nCliente/Proveedor: ${movimiento.clienteProveedor || movimiento.cliente || movimiento.proveedorCliente || movimiento.proveedor || '-'}\nMonto: $${parseFloat(movimiento.monto || 0).toFixed(2)}`
      );
    }
  }

  async eliminarMovimiento(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este movimiento de tesorería?')) {
      await this.movimientosManager.deleteMovimiento(id);
      await this.loadHistorialTable();
      this.showNotification('Movimiento eliminado exitosamente', 'success');
    }
  }

  async descargarPDFTesoreria(id) {
    console.log(`📄 Descargando PDF del movimiento de tesorería: ${id}`);

    const movimiento = await this.movimientosManager.getMovimiento(id);

    if (!movimiento) {
      this.showNotification('Movimiento no encontrado', 'error');
      return;
    }

    try {
      // Cargar jsPDF si no está disponible
      if (!window.jspdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Configuración
      const margin = 20;
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.width;
      const col1X = margin + 5;
      const col2X = pageWidth / 2 + 10;

      // Función auxiliar para formatear fechas
      function formatearFecha(fechaStr) {
        if (!fechaStr) {
          return 'N/A';
        }
        try {
          if (typeof fechaStr === 'string') {
            // Si es formato YYYY-MM-DD, parsearlo directamente sin conversión de zona horaria
            if (/^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
              const fechaStrClean = fechaStr.split('T')[0]; // Tomar solo la parte de fecha si viene con hora
              const [year, month, day] = fechaStrClean.split('-');
              const fecha = new Date(
                parseInt(year, 10),
                parseInt(month, 10) - 1,
                parseInt(day, 10)
              );
              return fecha.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              });
            } else if (fechaStr.includes('T')) {
              // Formato ISO con hora
              const fecha = new Date(fechaStr);
              return fecha.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              });
            }
            // Otro formato, intentar parsear directamente
            const fecha = new Date(fechaStr);
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

      // Función auxiliar para obtener valor o 'N/A'
      function obtenerValor(valor) {
        return valor !== undefined && valor !== null && valor !== '' ? valor : 'N/A';
      }

      // Título
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('MOVIMIENTO DE TESORERÍA', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // ID del movimiento
      doc.setFontSize(12);
      doc.text(`ID: ${id}`, margin, yPosition);
      yPosition += 10;

      // Fecha de creación
      const fechaCreacion = formatearFecha(movimiento.fecha || movimiento.fechaCreacion);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de Registro: ${fechaCreacion}`, margin, yPosition);
      yPosition += 15;

      // Línea separadora
      doc.setDrawColor(0, 0, 0);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Información General
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('INFORMACIÓN GENERAL', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Guardar posición inicial para ambas columnas
      const startY = yPosition;
      let leftY = startY;
      let rightY = startY;

      // Columna izquierda
      doc.text(`Tipo: ${this.formatTipo(movimiento.tipo, movimiento.origen)}`, col1X, leftY);
      leftY += 6;
      doc.text(
        `Proviene: ${obtenerValor(movimiento.origen) === 'N/A' ? 'Tesoreria' : movimiento.origen}`,
        col1X,
        leftY
      );
      leftY += 6;
      doc.text(
        `Cliente/Proveedor: ${obtenerValor(movimiento.clienteProveedor || movimiento.cliente || movimiento.proveedorCliente || movimiento.proveedor)}`,
        col1X,
        leftY
      );
      leftY += 6;
      doc.text(`Servicio/Producto: ${obtenerValor(movimiento.servicioProducto)}`, col1X, leftY);
      leftY += 6;
      doc.text(`Tipo de Documento: ${obtenerValor(movimiento.tipoDocumento)}`, col1X, leftY);
      leftY += 6;
      doc.text(`Número de Factura: ${obtenerValor(movimiento.numeroFactura)}`, col1X, leftY);
      leftY += 6;

      // Columna derecha
      doc.text(`Fecha de Pago: ${formatearFecha(movimiento.fechaPago)}`, col2X, rightY);
      rightY += 6;
      doc.text(`Monto: $${parseFloat(movimiento.monto || 0).toFixed(2)}`, col2X, rightY);
      rightY += 6;
      doc.text(`Moneda: ${this.formatMoneda(movimiento.moneda)}`, col2X, rightY);
      rightY += 6;
      if (movimiento.moneda === 'dls' && movimiento.tipoCambio) {
        doc.text(
          `Tipo de Cambio: $${parseFloat(movimiento.tipoCambio).toFixed(4)} MXN/USD`,
          col2X,
          rightY
        );
        rightY += 6;
      }
      doc.text(`Método de Pago: ${this.formatMetodoPago(movimiento.metodoPago)}`, col2X, rightY);
      rightY += 6;

      // Usar la posición más baja de las dos columnas para continuar
      yPosition = Math.max(leftY, rightY) + 10;

      // Información Bancaria
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('INFORMACIÓN BANCARIA', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Guardar posición inicial para ambas columnas
      const startYBancaria = yPosition;
      let leftYBancaria = startYBancaria;
      let rightYBancaria = startYBancaria;

      // Columna izquierda - Origen
      doc.text(`Banco Origen: ${obtenerValor(movimiento.bancoOrigen)}`, col1X, leftYBancaria);
      leftYBancaria += 6;
      doc.text(`Cuenta Origen: ${obtenerValor(movimiento.cuentaOrigen)}`, col1X, leftYBancaria);
      leftYBancaria += 6;

      // Columna derecha - Destino
      doc.text(`Banco Destino: ${obtenerValor(movimiento.bancoDestino)}`, col2X, rightYBancaria);
      rightYBancaria += 6;
      doc.text(`Cuenta Destino: ${obtenerValor(movimiento.cuentaDestino)}`, col2X, rightYBancaria);
      rightYBancaria += 6;

      // Usar la posición más baja de las dos columnas para continuar
      yPosition = Math.max(leftYBancaria, rightYBancaria) + 6;

      // Referencia Bancaria
      doc.text(
        `Referencia Bancaria: ${obtenerValor(movimiento.referenciaBancaria || movimiento.referencia)}`,
        margin,
        yPosition
      );
      yPosition += 10;

      // Descripción/Observaciones
      if (movimiento.descripcion || movimiento.descripcionObservaciones) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('DESCRIPCIÓN / OBSERVACIONES', margin, yPosition);
        yPosition += 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        const descripcion = movimiento.descripcionObservaciones || movimiento.descripcion || '';
        if (descripcion) {
          const splitDescripcion = doc.splitTextToSize(descripcion, pageWidth - 2 * margin);
          doc.text(splitDescripcion, margin, yPosition);
          yPosition += splitDescripcion.length * 5 + 5;
        }
      }

      // Guardar PDF
      const nombreArchivo = `Tesoreria_${id}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nombreArchivo);

      console.log(`✅ PDF generado exitosamente: ${nombreArchivo}`);
      this.showNotification('PDF del movimiento de tesorería generado exitosamente', 'success');
    } catch (error) {
      console.error('❌ Error generando PDF del movimiento de tesorería:', error);
      this.showNotification('Error al generar PDF del movimiento de tesorería', 'error');
    }
  }

  async aplicarFiltros() {
    const clienteProveedor = (
      document.getElementById('filtroClienteProveedor')?.value || ''
    ).toLowerCase();
    const filtroFacturaNotasTickets = (
      document.getElementById('filtroFacturaNotasTickets')?.value || ''
    ).toLowerCase();
    const bancoOrigen = (document.getElementById('filtroBancoOrigen')?.value || '').toLowerCase();
    const cuentaOrigen = (document.getElementById('filtroCuentaOrigen')?.value || '').toLowerCase();
    const bancoDestino = (document.getElementById('filtroBancoDestino')?.value || '').toLowerCase();
    const cuentaDestino = (
      document.getElementById('filtroCuentaDestino')?.value || ''
    ).toLowerCase();
    const fechaDesde = document.getElementById('filtroFechaDesde')?.value || '';
    const fechaHasta = document.getElementById('filtroFechaHasta')?.value || '';

    const movimientos = await this.movimientosManager.getMovimientos();

    // Asegurar que movimientos sea un array
    if (!Array.isArray(movimientos)) {
      await this.loadHistorialTable([]);
      return;
    }

    const movimientosFiltrados = movimientos.filter(mov => {
      // Filtro por Cliente/Proveedor
      const clienteProveedorMov = (
        mov.clienteProveedor ||
        mov.cliente ||
        mov.proveedorCliente ||
        mov.proveedor ||
        ''
      ).toLowerCase();
      const okClienteProveedor =
        !clienteProveedor || clienteProveedorMov.includes(clienteProveedor);

      // Filtro por número de factura, notas o tickets
      let okFacturaNotasTickets = true;
      if (filtroFacturaNotasTickets) {
        const numeroFactura = (mov.numeroFactura || '').toString().toLowerCase();
        const notas = (mov.notas || mov.observaciones || mov.descripcionObservaciones || '')
          .toString()
          .toLowerCase();
        const tickets = (mov.ticket || mov.numeroTicket || mov.tickets || '')
          .toString()
          .toLowerCase();

        const coincideFactura = numeroFactura.includes(filtroFacturaNotasTickets);
        const coincideNotas = notas.includes(filtroFacturaNotasTickets);
        const coincideTickets = tickets.includes(filtroFacturaNotasTickets);

        okFacturaNotasTickets = coincideFactura || coincideNotas || coincideTickets;
      }

      // Filtro por Banco Origen
      const bancoOrigenMov = (mov.bancoOrigen || '').toLowerCase();
      const okBancoOrigen = !bancoOrigen || bancoOrigenMov === bancoOrigen;

      // Filtro por Cuenta Origen
      const cuentaOrigenMov = (mov.cuentaOrigen || '').toLowerCase();
      const okCuentaOrigen = !cuentaOrigen || cuentaOrigenMov === cuentaOrigen;

      // Filtro por Banco Destino
      const bancoDestinoMov = (mov.bancoDestino || '').toLowerCase();
      const okBancoDestino = !bancoDestino || bancoDestinoMov.includes(bancoDestino);

      // Filtro por Cuenta Destino
      const cuentaDestinoMov = (mov.cuentaDestino || '').toLowerCase();
      const okCuentaDestino = !cuentaDestino || cuentaDestinoMov.includes(cuentaDestino);

      // Filtro por Fecha
      let okFechaDesde = true;
      let okFechaHasta = true;

      if (fechaDesde || fechaHasta) {
        const fechaMov = mov.fecha || mov.fechaCreacion;
        if (fechaMov) {
          let fechaMovStr = '';
          if (typeof fechaMov === 'string') {
            // Si tiene formato ISO con T, tomar solo la parte de fecha
            fechaMovStr = fechaMov.split('T')[0];
          } else {
            fechaMovStr = new Date(fechaMov).toISOString().split('T')[0];
          }

          if (fechaDesde) {
            okFechaDesde = fechaMovStr >= fechaDesde;
          }
          if (fechaHasta) {
            okFechaHasta = fechaMovStr <= fechaHasta;
          }
        } else {
          // Si no tiene fecha y se está filtrando por fecha, excluir
          okFechaDesde = false;
          okFechaHasta = false;
        }
      }

      return (
        okClienteProveedor &&
        okFacturaNotasTickets &&
        okBancoOrigen &&
        okCuentaOrigen &&
        okBancoDestino &&
        okCuentaDestino &&
        okFechaDesde &&
        okFechaHasta
      );
    });

    await this.loadHistorialTable(movimientosFiltrados);
    this.showNotification(`Se encontraron ${movimientosFiltrados.length} movimiento(s)`, 'info');
  }

  limpiarFiltros() {
    document.getElementById('filtroClienteProveedor').value = '';
    document.getElementById('filtroFacturaNotasTickets').value = '';
    document.getElementById('filtroBancoOrigen').value = '';
    document.getElementById('filtroCuentaOrigen').value = '';
    document.getElementById('filtroBancoDestino').value = '';
    document.getElementById('filtroCuentaDestino').value = '';
    document.getElementById('filtroFechaDesde').value = '';
    document.getElementById('filtroFechaHasta').value = '';

    // Actualizar el select de cuentas cuando se limpia el banco
    const selectCuenta = document.getElementById('filtroCuentaOrigen');
    if (selectCuenta) {
      selectCuenta.innerHTML = '<option value="">Todas las cuentas</option>';
    }

    this.loadHistorialTable();
  }

  showNotification(message, type = 'info') {
    // Crear notificación simple
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// ===== Global Instance =====
let tesoreriaMovimientosUI;

// ===== Initialize =====
async function initializeTesoreriaMovimientos() {
  console.log('🔄 Inicializando tesoreriaMovimientosUI...');

  // Esperar a que los repositorios de Firebase estén listos
  // Primero esperar a que la promesa __firebaseReposReady se resuelva si existe
  if (window.__firebaseReposReady) {
    try {
      console.log('⏳ Esperando a que los repositorios de Firebase estén listos...');
      await window.__firebaseReposReady;
      console.log('✅ Promesa de repositorios resuelta');
    } catch (error) {
      console.warn('⚠️ Error esperando promesa de repositorios:', error);
    }
  }

  // Luego esperar a que el repositorio específico esté disponible
  let attempts = 0;
  const maxAttempts = 30;
  while (attempts < maxAttempts && (!window.firebaseRepos || !window.firebaseRepos.tesoreria)) {
    attempts++;
    if (attempts % 5 === 0) {
      console.log(
        `⏳ Esperando repositorios de Firebase para Tesorería... (${attempts}/${maxAttempts})`
      );
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (window.firebaseRepos && window.firebaseRepos.tesoreria) {
    console.log('✅ Repositorio Tesorería disponible');
  } else {
    console.warn(
      '⚠️ Repositorio Tesorería no disponible después de esperar, continuando de todas formas...'
    );
  }

  try {
    tesoreriaMovimientosUI = new TesoreriaMovimientosUI();
    window.tesoreriaMovimientosUI = tesoreriaMovimientosUI; // Exponer globalmente
    console.log('✅ tesoreriaMovimientosUI creado e inicializado');
    await tesoreriaMovimientosUI.loadHistorialTable();
    console.log('✅ Historial de movimientos cargado');

    // Setup form submission
    const form = document.querySelector('.needs-validation');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        console.log('📝 Form submit interceptado, llamando guardarMovimiento...');
        if (
          tesoreriaMovimientosUI &&
          typeof tesoreriaMovimientosUI.guardarMovimiento === 'function'
        ) {
          tesoreriaMovimientosUI.guardarMovimiento();
        } else {
          console.error('❌ tesoreriaMovimientosUI.guardarMovimiento no está disponible');
        }
      });
    }

    // Agregar listener directo al botón de guardarMovimiento como respaldo
    function configurarBotonGuardarMovimiento() {
      const botonGuardar = document.querySelector('[data-action="guardarMovimiento"]');
      if (botonGuardar) {
        // Verificar si ya tiene el listener directo
        if (botonGuardar.hasAttribute('data-listener-directo-agregado')) {
          console.log('ℹ️ Botón ya tiene listener directo, omitiendo...');
          return;
        }

        console.log('✅ Botón guardarMovimiento encontrado, configurando listener directo...');

        // Agregar listener directo
        botonGuardar.addEventListener(
          'click',
          async e => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log('🖱️🖱️🖱️ CLICK EN BOTÓN GUARDAR MOVIMIENTO (listener directo) 🖱️🖱️🖱️');

            if (window._tesoreriaGuardandoMovimiento) {
              console.log('⚠️ Ya hay un proceso en curso, ignorando clic');
              return;
            }

            // Esperar a que tesoreriaMovimientosUI esté disponible
            let attempts = 0;
            const maxAttempts = 30;
            while (
              attempts < maxAttempts &&
              (!window.tesoreriaMovimientosUI ||
                typeof window.tesoreriaMovimientosUI.guardarMovimiento !== 'function')
            ) {
              attempts++;
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            if (
              window.tesoreriaMovimientosUI &&
              typeof window.tesoreriaMovimientosUI.guardarMovimiento === 'function'
            ) {
              try {
                console.log('✅ Ejecutando guardarMovimiento desde listener directo...');
                await window.tesoreriaMovimientosUI.guardarMovimiento();
              } catch (error) {
                console.error('❌ Error al guardar movimiento:', error);
                if (typeof window.showNotification === 'function') {
                  window.showNotification(
                    `Error al guardar el movimiento: ${error.message || 'Error desconocido'}`,
                    'error'
                  );
                } else {
                  alert(`Error al guardar el movimiento: ${error.message || 'Error desconocido'}`);
                }
              }
            } else {
              console.error(
                '❌ tesoreriaMovimientosUI.guardarMovimiento no está disponible después de esperar'
              );
              if (typeof window.showNotification === 'function') {
                window.showNotification(
                  'Error: El sistema de tesorería no está listo. Por favor, espera unos segundos y vuelve a intentar.',
                  'error'
                );
              } else {
                alert(
                  'Error: El sistema de tesorería no está listo. Por favor, espera unos segundos y vuelve a intentar.'
                );
              }
            }
          },
          true
        ); // Usar capture para capturar antes que otros listeners

        botonGuardar.setAttribute('data-listener-directo-agregado', 'true');
        console.log('✅ Listener directo agregado al botón guardarMovimiento');
      } else {
        console.warn('⚠️ Botón guardarMovimiento no encontrado');
      }
    }

    // Configurar inmediatamente
    configurarBotonGuardarMovimiento();

    // También configurar después de delays por si el botón se carga después
    setTimeout(configurarBotonGuardarMovimiento, 500);
    setTimeout(configurarBotonGuardarMovimiento, 1000);
    setTimeout(configurarBotonGuardarMovimiento, 2000);
    setTimeout(configurarBotonGuardarMovimiento, 3000);

    // Usar MutationObserver para detectar cuando se agrega el botón
    const observer = new MutationObserver(() => {
      const boton = document.querySelector('[data-action="guardarMovimiento"]');
      if (boton && !boton.hasAttribute('data-listener-directo-agregado')) {
        console.log('🔄 Botón guardarMovimiento detectado dinámicamente');
        configurarBotonGuardarMovimiento();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('✅ Sistema de listener directo para botón guardarMovimiento configurado');

    // Setup observaciones toggle
    const observacionesRadios = document.querySelectorAll('input[name="observaciones"]');
    const observacionesDiv = document.getElementById('descripcionObservaciones');

    observacionesRadios.forEach(radio => {
      radio.addEventListener('change', function () {
        if (this.value === 'si') {
          observacionesDiv.style.display = 'block';
        } else {
          observacionesDiv.style.display = 'none';
        }
      });
    });

    // Setup toggle de tipo de cambio para moneda
    const monedaSelect = document.getElementById('tipomoneda');
    if (monedaSelect) {
      // Verificar si ya tiene un listener para evitar duplicados
      if (!monedaSelect.hasAttribute('data-tipo-cambio-handler')) {
        monedaSelect.addEventListener('change', function () {
          console.log('💰 Moneda cambiada a:', this.value);
          if (typeof window.toggleTipoCambioTesorería === 'function') {
            window.toggleTipoCambioTesorería();
          } else {
            console.error('❌ toggleTipoCambioTesorería no está disponible');
          }
        });
        monedaSelect.setAttribute('data-tipo-cambio-handler', 'true');
        console.log('✅ Listener directo agregado al select de moneda');
      }

      // Ejecutar una vez al inicializar para mostrar/ocultar según el valor actual
      if (monedaSelect.value === 'dls') {
        if (typeof window.toggleTipoCambioTesorería === 'function') {
          window.toggleTipoCambioTesorería();
        }
      }
    } else {
      console.warn('⚠️ Select de moneda (tipomoneda) no encontrado');
    }

    // Setup formateo de tipo de cambio a 4 decimales
    const tipoCambioInput = document.getElementById('tipoCambioTesorería');
    if (tipoCambioInput) {
      // Formatear cuando el usuario pierde el foco
      tipoCambioInput.addEventListener('blur', function () {
        const valor = parseFloat(this.value);
        if (!isNaN(valor) && valor > 0) {
          // Formatear a 4 decimales
          this.value = valor.toFixed(4);
        }
      });

      // Validar cuando el usuario escribe
      tipoCambioInput.addEventListener('input', function () {
        const valor = this.value;
        // Permitir números, punto y hasta 4 decimales
        if (valor && !/^\d*\.?\d{0,4}$/.test(valor)) {
          // Si tiene más de 4 decimales, truncar
          const partes = valor.split('.');
          if (partes.length === 2 && partes[1].length > 4) {
            this.value = parseFloat(valor).toFixed(4);
          }
        }
      });

      console.log('✅ Formateo de tipo de cambio a 4 decimales configurado');
    }

    // Configurar filtros automáticos para movimientos
    configurarFiltrosAutomaticosMovimientos();

    // Cargar bancos en el filtro de banco origen
    cargarBancosEnFiltro();

    console.log('✅ tesoreriaMovimientosUI completamente inicializado');
  } catch (error) {
    console.error('❌ Error inicializando tesoreriaMovimientosUI:', error);
  }
}

// Función para cargar bancos en el filtro
async function cargarBancosEnFiltro() {
  console.log('🏦 Cargando bancos en filtro...');

  // Esperar a que las funciones estén disponibles
  let intentos = 0;
  const maxIntentos = 20;

  while (intentos < maxIntentos && typeof window.cargarBancosEnSelect !== 'function') {
    intentos++;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Verificar si la función cargarBancosEnSelect está disponible
  if (typeof window.cargarBancosEnSelect === 'function') {
    try {
      // Cargar bancos en el select de filtro (solo nuestros bancos)
      await window.cargarBancosEnSelect('filtroBancoOrigen', true);
      console.log('✅ Bancos cargados en filtroBancoOrigen');
    } catch (error) {
      console.error('❌ Error cargando bancos en filtro:', error);
    }
  } else {
    // Si no está disponible, intentar cargar directamente usando cargarBancos
    try {
      if (typeof window.cargarBancos === 'function') {
        await window.cargarBancos();
        console.log('✅ Bancos cargados usando cargarBancos()');
      } else {
        console.warn('⚠️ Función cargarBancos no está disponible');
      }
    } catch (error) {
      console.error('❌ Error cargando bancos:', error);
    }
  }

  // Configurar listener para actualizar cuentas cuando cambie el banco
  const selectBancoFiltro = document.getElementById('filtroBancoOrigen');
  if (selectBancoFiltro) {
    // Remover listener anterior si existe
    const nuevoSelect = selectBancoFiltro.cloneNode(true);
    selectBancoFiltro.parentNode.replaceChild(nuevoSelect, selectBancoFiltro);

    nuevoSelect.addEventListener('change', async function () {
      console.log('🏦 Banco filtro cambiado a:', this.value);

      // Esperar a que la función esté disponible
      let intentos = 0;
      while (intentos < 10 && typeof window.actualizarCuentasOrigenFiltro !== 'function') {
        intentos++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (typeof window.actualizarCuentasOrigenFiltro === 'function') {
        await window.actualizarCuentasOrigenFiltro();
      } else {
        console.warn('⚠️ actualizarCuentasOrigenFiltro no está disponible');
      }
    });
    nuevoSelect.setAttribute('data-cuentas-handler', 'true');
    console.log('✅ Listener configurado para actualizar cuentas en filtro');
  } else {
    console.warn('⚠️ Select filtroBancoOrigen no encontrado');
  }
}

// Función para configurar filtros automáticos de movimientos
function configurarFiltrosAutomaticosMovimientos() {
  console.log('🔧 Configurando filtros automáticos para movimientos...');

  const filtros = [
    { id: 'filtroClienteProveedor', tipo: 'text' },
    { id: 'filtroFacturaNotasTickets', tipo: 'text' },
    { id: 'filtroBancoOrigen', tipo: 'select' },
    { id: 'filtroCuentaOrigen', tipo: 'select' },
    { id: 'filtroBancoDestino', tipo: 'text' },
    { id: 'filtroCuentaDestino', tipo: 'text' },
    { id: 'filtroFechaDesde', tipo: 'date' },
    { id: 'filtroFechaHasta', tipo: 'date' }
  ];

  let configurados = 0;
  filtros.forEach(filtro => {
    const elemento = document.getElementById(filtro.id);
    if (elemento) {
      // Solo agregar listener si no tiene uno ya configurado
      if (!elemento.hasAttribute('data-filtro-movimientos-handler')) {
        if (filtro.tipo === 'text') {
          // Para campos de texto, usar debounce
          let debounceTimer;
          const handler = function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              console.log(`🔍 Filtro automático ejecutado desde: ${filtro.id}`);
              if (
                window.tesoreriaMovimientosUI &&
                typeof window.tesoreriaMovimientosUI.aplicarFiltros === 'function'
              ) {
                window.tesoreriaMovimientosUI.aplicarFiltros();
              } else {
                console.warn('⚠️ tesoreriaMovimientosUI.aplicarFiltros no está disponible');
              }
            }, 500);
          };
          elemento.addEventListener('input', handler);
          elemento._filtroHandler = handler;
        } else {
          // Para selects y dates, usar change
          const handler = function () {
            console.log(`🔍 Filtro automático ejecutado desde: ${filtro.id}`);
            if (
              window.tesoreriaMovimientosUI &&
              typeof window.tesoreriaMovimientosUI.aplicarFiltros === 'function'
            ) {
              window.tesoreriaMovimientosUI.aplicarFiltros();
            } else {
              console.warn('⚠️ tesoreriaMovimientosUI.aplicarFiltros no está disponible');
            }
          };
          elemento.addEventListener('change', handler);
          elemento._filtroHandler = handler;
        }
        elemento.setAttribute('data-filtro-movimientos-handler', 'true');
        configurados++;
        console.log(`✅ Listener configurado para filtro: ${filtro.id}`);
      } else {
        console.log(`ℹ️ Listener ya configurado para filtro: ${filtro.id}`);
      }
    } else {
      console.warn(`⚠️ Elemento de filtro no encontrado: ${filtro.id}`);
    }
  });

  if (configurados > 0) {
    console.log(`✅ ${configurados} filtro(s) configurado(s) para movimientos`);
  }
}

// Ejecutar cuando el DOM esté listo o inmediatamente si ya está listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTesoreriaMovimientos);
} else {
  // DOM ya está listo, ejecutar inmediatamente
  initializeTesoreriaMovimientos();
}

// Suscribirse a cambios en tiempo real de movimientos de Tesorería
async function configurarListenerTesoreria() {
  try {
    // Esperar a que el repositorio esté completamente inicializado
    let attempts = 0;
    const maxAttempts = 30;
    while (
      attempts < maxAttempts &&
      (!window.firebaseRepos ||
        !window.firebaseRepos.tesoreria ||
        !window.firebaseRepos.tesoreria.db ||
        !window.firebaseRepos.tesoreria.tenantId)
    ) {
      attempts++;
      console.log(
        `⏳ Esperando repositorio Tesorería para listener... (${attempts}/${maxAttempts})`,
        {
          tieneRepositorio: Boolean(window.firebaseRepos?.tesoreria),
          tieneDb: Boolean(window.firebaseRepos?.tesoreria?.db),
          tieneTenantId: Boolean(window.firebaseRepos?.tesoreria?.tenantId)
        }
      );
      await new Promise(resolve => setTimeout(resolve, 500));

      // Intentar inicializar si no está inicializado
      if (window.firebaseRepos?.tesoreria && !window.firebaseRepos.tesoreria.db) {
        console.log('🔄 Intentando inicializar repositorio Tesorería...');
        try {
          await window.firebaseRepos.tesoreria.init();
        } catch (initError) {
          console.warn('⚠️ Error al inicializar repositorio:', initError);
        }
      }
    }

    if (!window.firebaseRepos || !window.firebaseRepos.tesoreria) {
      console.warn('⚠️ Repositorio Tesorería no disponible para listener después de esperar');
      // Reintentar después de más tiempo
      setTimeout(() => configurarListenerTesoreria(), 5000);
      return;
    }

    if (!window.firebaseRepos.tesoreria.db || !window.firebaseRepos.tesoreria.tenantId) {
      console.warn('⚠️ Repositorio Tesorería no inicializado completamente:', {
        tieneDb: Boolean(window.firebaseRepos.tesoreria.db),
        tieneTenantId: Boolean(window.firebaseRepos.tesoreria.tenantId),
        tieneRepositorio: Boolean(window.firebaseRepos.tesoreria)
      });

      // Reintentar después de más tiempo
      setTimeout(() => configurarListenerTesoreria(), 5000);
      return;
    }

    console.log('📡 Suscribiéndose a cambios en tiempo real de movimientos de Tesorería...', {
      tenantId: window.firebaseRepos.tesoreria.tenantId,
      tieneDb: Boolean(window.firebaseRepos.tesoreria.db)
    });

    // Guardar estado inicial para comparar después
    let primeraActualizacion = true;

    const unsubscribe = await window.firebaseRepos.tesoreria.subscribe(async items => {
      console.log(
        '📡 Actualización en tiempo real Tesorería: movimientos recibidos:',
        items.length
      );

      // Log detallado de los items recibidos para diagnóstico
      if (items.length > 0) {
        console.log(
          '📋 Items recibidos (primeros 3):',
          items.slice(0, 3).map(item => ({
            id: item.id,
            tipo: item.tipo,
            origen: item.origen,
            descripcion: item.descripcion?.substring(0, 50)
          }))
        );
      }

      // Filtrar movimientos: incluir 'movimiento', 'ingreso', 'egreso' y cualquier item con origen 'CXC' o 'CXP'
      const movimientos = items.filter(item => {
        const esMovimiento =
          item.tipo === 'movimiento' ||
          item.tipo === 'ingreso' ||
          item.tipo === 'egreso' ||
          item.origen === 'CXC' ||
          item.origen === 'CXP';

        // Log para movimientos de CXC
        if (item.origen === 'CXC' && !esMovimiento) {
          console.warn('⚠️ Movimiento CXC no incluido en filtro:', {
            tipo: item.tipo,
            origen: item.origen,
            id: item.id
          });
        }

        return esMovimiento;
      });

      console.log('📋 Movimientos filtrados:', movimientos.length);

      // Log de movimientos de CXC encontrados
      const movimientosCXC = movimientos.filter(m => m.origen === 'CXC');
      if (movimientosCXC.length > 0) {
        console.log(
          `💰 Movimientos CXC encontrados: ${movimientosCXC.length}`,
          movimientosCXC.map(m => ({
            id: m.id,
            monto: m.monto,
            descripcion: m.descripcion?.substring(0, 50)
          }))
        );
      }

      // Si es la primera actualización y recibimos datos vacíos, pero ya tenemos datos cargados,
      // verificar si Firebase realmente está vacío antes de sobrescribir
      if (primeraActualizacion && movimientos.length === 0) {
        // Verificar que tesoreriaMovimientosUI esté disponible
        if (!window.tesoreriaMovimientosUI || !window.tesoreriaMovimientosUI.movimientosManager) {
          console.warn('⚠️ tesoreriaMovimientosUI no disponible para verificar movimientos');
          return;
        }
        const movimientosActuales =
          await window.tesoreriaMovimientosUI.movimientosManager.getMovimientos();
        const tieneDatosExistentes =
          Array.isArray(movimientosActuales) && movimientosActuales.length > 0;
        if (tieneDatosExistentes) {
          try {
            const repoTesoreria = window.firebaseRepos.tesoreria;
            if (repoTesoreria && repoTesoreria.db && repoTesoreria.tenantId) {
              // Verificar en Firebase si realmente está vacío
              const todosLosItems = await repoTesoreria.getAll();
              if (todosLosItems && todosLosItems.length > 0) {
                console.warn(
                  '⚠️ Listener Tesorería devolvió datos vacíos pero Firebase tiene datos. Ignorando actualización vacía.'
                );
                primeraActualizacion = false;
                return;
              }
            } else {
              console.log(
                '✅ Firebase confirmado vacío. Sincronizando localStorage con Firebase (vacío).'
              );
              // Continuar para sincronizar (borrar localStorage)
            }
          } catch (error) {
            console.warn(
              '⚠️ Error verificando Firebase, ignorando actualización vacía por seguridad:',
              error
            );
            primeraActualizacion = false;
            return;
          }
        }
      }

      primeraActualizacion = false;

      // Verificar que tesoreriaMovimientosUI esté disponible antes de actualizar
      if (!window.tesoreriaMovimientosUI || !window.tesoreriaMovimientosUI.movimientosManager) {
        console.warn('⚠️ tesoreriaMovimientosUI no disponible para actualizar movimientos');
        return;
      }

      // Actualizar movimientos
      window.tesoreriaMovimientosUI.movimientosManager.setMovimientos(movimientos);

      // Recargar la tabla
      window.tesoreriaMovimientosUI.loadHistorialTable();

      console.log(
        `✅ Movimientos de Tesorería actualizados automáticamente: ${movimientos.length}`
      );
    });

    // Guardar función de desuscripción
    if (unsubscribe && typeof unsubscribe === 'function') {
      window.__tesoreriaUnsubscribe = unsubscribe;
      console.log('✅ Suscripción a cambios en tiempo real Tesorería configurada correctamente');
    } else {
      console.warn('⚠️ La función de desuscripción no está disponible');
    }
  } catch (error) {
    console.error('❌ Error configurando suscripción en tiempo real Tesorería:', error);
    // Reintentar después de un tiempo
    setTimeout(() => configurarListenerTesoreria(), 5000);
  }
}

// Configurar listener después de que todo esté listo
// Esperar un poco más para asegurar que los repositorios estén completamente inicializados
setTimeout(() => {
  configurarListenerTesoreria();
}, 3000);

// También intentar configurar inmediatamente si los repositorios ya están listos
// Pero solo después de verificar que realmente están listos
if (
  window.firebaseRepos &&
  window.firebaseRepos.tesoreria &&
  window.firebaseRepos.tesoreria.db &&
  window.firebaseRepos.tesoreria.tenantId
) {
  console.log('✅ Repositorios ya listos, configurando listener inmediatamente');
  configurarListenerTesoreria();
} else {
  console.log('⏳ Repositorios no listos aún, esperando timeout...');
}

console.log('✅ Sistema de Tesorería Movimientos inicializado');

// Sincronizar movimientos existentes de localStorage a Firebase
// DESHABILITADO: No sincronizar automáticamente para evitar restaurar datos después de limpieza
async function sincronizarMovimientosAFirebase() {
  try {
    // Verificar si se limpiaron los datos operativos (flag local)
    const datosLimpios = localStorage.getItem('datos_operativos_limpiados');

    if (!window.firebaseRepos?.tesoreria) {
      console.warn('⚠️ Repositorio Tesorería no disponible para sincronización');
      return;
    }

    // Verificar si Firebase está vacío y hay conexión
    const hayConexion = navigator.onLine;
    let movimientosFirebase = [];

    if (window.firebaseRepos?.tesoreria) {
      const repoTesoreria = window.firebaseRepos.tesoreria;
      if (repoTesoreria.db && repoTesoreria.tenantId) {
        movimientosFirebase = await repoTesoreria.getAllMovimientos();
      }
    }
    const firebaseVacio = !movimientosFirebase || movimientosFirebase.length === 0;

    if (datosLimpios === 'true' || (firebaseVacio && hayConexion)) {
      const razon =
        datosLimpios === 'true'
          ? 'Datos operativos fueron limpiados (flag local)'
          : 'Firebase está vacío y hay conexión (datos eliminados intencionalmente)';
      console.log(`⚠️ ${razon}. No se sincronizará desde localStorage a Firebase para Tesorería.`);
      return;
    }

    // Obtener movimientos de localStorage
    const movimientosLocal = JSON.parse(localStorage.getItem('erp_tesoreria_movimientos') || '[]');

    if (movimientosLocal.length === 0) {
      console.log('ℹ️ No hay movimientos en localStorage para sincronizar');
      return;
    }

    if (movimientosFirebase && movimientosFirebase.length > 0) {
      console.log(
        `ℹ️ Ya hay ${movimientosFirebase.length} movimientos en Firebase, no se sincronizará desde localStorage`
      );
      return;
    }

    console.log(
      `🔄 Sincronizando ${movimientosLocal.length} movimientos de localStorage a Firebase...`
    );

    // Obtener movimientos de Firebase para verificar cuáles ya existen
    const idsFirebase = new Set(movimientosFirebase.map(m => m.id));

    let sincronizados = 0;
    let yaExistentes = 0;

    for (const movimiento of movimientosLocal) {
      // Solo sincronizar si no existe en Firebase
      if (!idsFirebase.has(movimiento.id)) {
        try {
          const movimientoId = `movimiento_${movimiento.id}`;
          const movimientoData = {
            ...movimiento,
            // Mantener el tipo original (ingreso/egreso) para que funcione correctamente en reportes
            tipo: movimiento.tipo || 'movimiento',
            fechaCreacion: movimiento.fechaCreacion || new Date().toISOString()
          };

          await window.firebaseRepos.tesoreria.saveMovimiento(movimientoId, movimientoData);
          sincronizados++;
          console.log(`✅ Movimiento sincronizado: ${movimientoId}`);
        } catch (error) {
          console.error(`❌ Error sincronizando movimiento ${movimiento.id}:`, error);
        }
      } else {
        yaExistentes++;
      }
    }

    if (sincronizados > 0) {
      console.log(
        `✅ Sincronización completada: ${sincronizados} movimientos nuevos, ${yaExistentes} ya existentes`
      );
    } else if (yaExistentes > 0) {
      console.log(`ℹ️ Todos los movimientos ya están sincronizados (${yaExistentes})`);
    }
  } catch (error) {
    console.error('❌ Error en sincronización de movimientos:', error);
  }
}

// NO sincronizar automáticamente desde localStorage a Firebase
// Firebase es la fuente de verdad. Si hay datos en localStorage pero no en Firebase,
// significa que fueron eliminados intencionalmente o que localStorage tiene datos obsoletos.
// La sincronización automática puede restaurar datos eliminados.
// Si se necesita sincronizar, debe hacerse manualmente usando window.sincronizarMovimientosTesoreria()
console.log(
  '⚠️ Sincronización automática desde localStorage deshabilitada. Firebase es la fuente de verdad.'
);

// Exponer función globalmente para uso manual
window.sincronizarMovimientosTesoreria = sincronizarMovimientosAFirebase;

// ===== Global Functions =====
window.prepareNewRegistration = function () {
  if (tesoreriaMovimientosUI) {
    tesoreriaMovimientosUI.clearForm();
  }
};

window.clearCurrentForm = function () {
  if (tesoreriaMovimientosUI) {
    tesoreriaMovimientosUI.clearForm();
  }
};

// Función para mostrar/ocultar campo de tipo de cambio
window.toggleTipoCambioTesorería = function () {
  const monedaSelect = document.getElementById('tipomoneda');
  const tipoCambioDiv = document.getElementById('grupoTipoCambioTesorería');
  const tipoCambioInput = document.getElementById('tipoCambioTesorería');

  if (!monedaSelect) {
    console.error('❌ Select de moneda (tipomoneda) no encontrado');
    return;
  }

  if (!tipoCambioDiv) {
    console.error('❌ Div de tipo de cambio (grupoTipoCambioTesorería) no encontrado');
    return;
  }

  if (!tipoCambioInput) {
    console.error('❌ Input de tipo de cambio (tipoCambioTesorería) no encontrado');
    return;
  }

  const esDolares = monedaSelect.value === 'dls' || monedaSelect.value === 'DLS';

  if (esDolares) {
    // Mostrar el campo de tipo de cambio
    tipoCambioDiv.style.display = 'block';
    tipoCambioInput.required = true;
    tipoCambioInput.setAttribute('required', 'required');
    console.log('💰 Campo de tipo de cambio mostrado para USD');

    // Formatear el valor existente a 4 decimales si hay uno
    if (tipoCambioInput.value) {
      const valor = parseFloat(tipoCambioInput.value);
      if (!isNaN(valor) && valor > 0) {
        tipoCambioInput.value = valor.toFixed(4);
      }
    }

    // Enfocar el campo si está vacío
    if (!tipoCambioInput.value) {
      setTimeout(() => {
        tipoCambioInput.focus();
      }, 100);
    }
  } else {
    // Ocultar el campo de tipo de cambio
    tipoCambioDiv.style.display = 'none';
    tipoCambioInput.required = false;
    tipoCambioInput.removeAttribute('required');
    tipoCambioInput.value = '';
    console.log('💰 Campo de tipo de cambio ocultado');
  }
};

// Función global para cambiar de página en tesorería
window.cambiarPaginaTesoreria = function (accion) {
  if (!window._paginacionTesoreriaManager) {
    console.warn('⚠️ window._paginacionTesoreriaManager no está disponible');
    return;
  }

  let cambioExitoso = false;

  if (accion === 'anterior') {
    cambioExitoso = window._paginacionTesoreriaManager.paginaAnterior();
  } else if (accion === 'siguiente') {
    cambioExitoso = window._paginacionTesoreriaManager.paginaSiguiente();
  } else if (typeof accion === 'number') {
    cambioExitoso = window._paginacionTesoreriaManager.irAPagina(accion);
  }

  if (cambioExitoso) {
    if (
      window.tesoreriaMovimientosUI &&
      typeof window.tesoreriaMovimientosUI.renderizarMovimientos === 'function'
    ) {
      window.tesoreriaMovimientosUI.renderizarMovimientos();
      // Scroll suave hacia la tabla
      const tabla = document.getElementById('tablaHistorialTesorería');
      if (tabla) {
        tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
};
