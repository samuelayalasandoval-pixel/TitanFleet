// ===== GESTIÓN DE REFACCIONES EN MANTENIMIENTO =====

// Variable global para contar filas de refacciones
let contadorRefacciones = 1;

// Variable global para almacenar todas las refacciones con stock
let todasLasRefacciones = [];

// Función para obtener stock de refacciones por almacén
function obtenerStockRefaccionesPorAlmacen() {
  try {
    // Obtener datos de inventario de refacciones
    const stock = JSON.parse(localStorage.getItem('erp_inv_refacciones_stock') || '{}');
    const movs = JSON.parse(localStorage.getItem('erp_inv_refacciones_movs') || '[]');

    console.log('🔍 Debug Stock - Datos originales:');
    console.log('  - Stock almacenado:', stock);
    console.log('  - Movimientos:', movs.length);

    // Recalcular stock por almacén desde movimientos
    const porAlmacen = {};
    movs.forEach(m => {
      // Obtener nombre estándar del almacén desde configuración
      const nombreEstandar = obtenerNombreEstandarAlmacen(m.almacen || '');
      if (!nombreEstandar) {
        console.log('⚠️ Movimiento sin almacén:', m);
        return;
      }
      // Usar el nombre estándar tal como está (con capitalización correcta)
      porAlmacen[nombreEstandar] = porAlmacen[nombreEstandar] || {};
      const cur = porAlmacen[nombreEstandar][m.cod] || { desc: m.desc, qty: 0 };
      cur.desc = m.desc;
      cur.qty += m.tipo === 'entrada' ? m.cant : -m.cant;
      if (cur.qty < 0) {
        cur.qty = 0;
      }
      porAlmacen[nombreEstandar][m.cod] = cur;
    });

    console.log('📦 Stock por almacén calculado:', porAlmacen);
    return porAlmacen;
  } catch (e) {
    console.error('Error obteniendo stock de refacciones por almacén:', e);
    return {};
  }
}

// Función para obtener stock de refacciones desde inventario (mantener compatibilidad)
function obtenerStockRefacciones() {
  try {
    const porAlmacen = obtenerStockRefaccionesPorAlmacen();

    // Consolidar stock total por código
    const stockTotal = {};
    Object.keys(porAlmacen).forEach(almacen => {
      Object.keys(porAlmacen[almacen]).forEach(codigo => {
        const item = porAlmacen[almacen][codigo];
        if (!stockTotal[codigo]) {
          stockTotal[codigo] = {
            codigo: codigo,
            descripcion: item.desc,
            stock: 0
          };
        }
        stockTotal[codigo].stock += item.qty;
      });
    });

    console.log('📊 Stock total consolidado:', stockTotal);
    return stockTotal;
  } catch (e) {
    console.error('Error obteniendo stock de refacciones:', e);
    return {};
  }
}

// Función para cargar refacciones con stock en el select
function actualizarListaRefacciones() {
  console.log('🔄 Actualizando lista de refacciones...');
  const stock = obtenerStockRefacciones();
  todasLasRefacciones = Object.values(stock).filter(item => item.stock > 0);

  console.log(
    `📦 Stock obtenido: ${Object.keys(stock).length} códigos, ${todasLasRefacciones.length} con stock > 0`
  );

  // Actualizar todos los dropdowns de refacciones
  const dropdowns = document.querySelectorAll('[id^="refaccion_dropdown_"]');
  console.log(`🔍 Encontrados ${dropdowns.length} dropdowns para actualizar`);

  dropdowns.forEach(dropdown => {
    const numeroFila = dropdown.id.split('_')[2];
    llenarDropdownRefacciones(numeroFila, todasLasRefacciones);
  });

  console.log(
    `✅ Lista de refacciones actualizada. ${todasLasRefacciones.length} refacciones con stock disponible.`
  );
}

// Función para llenar el dropdown de refacciones con stock por almacén
function llenarDropdownRefacciones(numeroFila, refacciones) {
  const dropdown = document.getElementById(`refaccion_dropdown_${numeroFila}`);
  if (!dropdown) {
    console.warn(`⚠️ No se encontró dropdown para fila ${numeroFila}`);
    return;
  }

  dropdown.innerHTML = '';

  if (refacciones.length === 0) {
    dropdown.innerHTML =
      '<div class="dropdown-item text-muted">No hay refacciones con stock disponible</div>';
    return;
  }

  // Obtener stock por almacén
  const stockPorAlmacen = obtenerStockRefaccionesPorAlmacen();

  // Limitar a 50 resultados para mejor rendimiento
  const refaccionesLimitadas = refacciones.slice(0, 50);

  refaccionesLimitadas.forEach(ref => {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    item.style.cursor = 'pointer';

    // Mostrar solo código y descripción, sin información de stock
    item.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${ref.codigo}</strong><br>
                    <small class="text-muted">${ref.descripcion}</small>
                </div>
                <i class="fas fa-chevron-right text-muted"></i>
            </div>
        `;

    item.addEventListener('click', () => {
      seleccionarRefaccionConAlmacen(numeroFila, ref, stockPorAlmacen);
    });

    dropdown.appendChild(item);
  });

  if (refacciones.length > 50) {
    const masItem = document.createElement('div');
    masItem.className = 'dropdown-item text-center text-muted';
    masItem.innerHTML = `<small>... y ${refacciones.length - 50} más. Use la búsqueda para filtrar.</small>`;
    dropdown.appendChild(masItem);
  }

  console.log(`✅ Dropdown ${numeroFila} llenado con ${refacciones.length} refacciones`);
}

// Función para seleccionar una refacción con selección de almacén
function seleccionarRefaccionConAlmacen(numeroFila, refaccion, stockPorAlmacen) {
  // Obtener almacenes disponibles para esta refacción
  const almacenesDisponibles = [];
  Object.keys(stockPorAlmacen).forEach(almacen => {
    if (
      stockPorAlmacen[almacen][refaccion.codigo] &&
      stockPorAlmacen[almacen][refaccion.codigo].qty > 0
    ) {
      almacenesDisponibles.push({
        nombre: almacen,
        stock: stockPorAlmacen[almacen][refaccion.codigo].qty
      });
    }
  });

  if (almacenesDisponibles.length === 0) {
    alert('No hay stock disponible para esta refacción');
    return;
  }

  // SIEMPRE mostrar el selector de almacén para que el usuario seleccione manualmente
  mostrarSelectorAlmacen(numeroFila, refaccion, almacenesDisponibles);
}

// Función para mostrar selector de almacén
function mostrarSelectorAlmacen(numeroFila, refaccion, almacenesDisponibles) {
  let html = `
        <div class="modal fade" id="modalSelectorAlmacen" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-warehouse"></i> Seleccionar Almacén
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <h6><i class="fas fa-info-circle"></i> Refacción Seleccionada</h6>
                            <p class="mb-0"><strong>Código:</strong> ${refaccion.codigo}</p>
                            <p class="mb-0"><strong>Descripción:</strong> ${refaccion.descripcion}</p>
                        </div>
                        
                        <p class="fw-bold text-primary">Selecciona el almacén de donde se tomará la refacción:</p>
                        
                        <div class="row g-3">
    `;

  almacenesDisponibles.forEach((almacen, _index) => {
    html += `
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <h6 class="card-title">
                            <i class="fas fa-warehouse text-primary"></i> ${almacen.nombre}
                        </h6>
                        <div class="mb-3">
                            <span class="badge bg-info fs-6">Disponible</span>
                        </div>
                        <button type="button" class="btn btn-primary w-100" 
                                onclick="seleccionarRefaccionYAlmacen(${numeroFila}, ${JSON.stringify(refaccion).replace(/"/g, '&quot;')}, ${JSON.stringify(almacen).replace(/"/g, '&quot;')}); bootstrap.Modal.getInstance(document.getElementById('modalSelectorAlmacen')).hide();">
                            <i class="fas fa-check"></i> Seleccionar este Almacén
                        </button>
                    </div>
                </div>
            </div>
        `;
  });

  html += `
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Remover modal existente si existe
  const modalExistente = document.getElementById('modalSelectorAlmacen');
  if (modalExistente) {
    modalExistente.remove();
  }

  // Agregar modal al DOM
  document.body.insertAdjacentHTML('beforeend', html);

  // Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById('modalSelectorAlmacen'));
  modal.show();

  // Limpiar modal cuando se cierre
  document.getElementById('modalSelectorAlmacen').addEventListener('hidden.bs.modal', function () {
    this.remove();
  });
}

// Función auxiliar para obtener la unidad de un código desde los movimientos
function obtenerUnidadRefaccion(codigo) {
  try {
    const movs = JSON.parse(localStorage.getItem('erp_inv_refacciones_movs') || '[]');
    // Buscar el movimiento más reciente para este código que tenga unidad
    const movimientosCodigo = movs
      .filter(m => m.cod === codigo && m.unidad)
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

    if (movimientosCodigo.length > 0) {
      return movimientosCodigo[0].unidad;
    }
    // Si no se encuentra, retornar 'piezas' por defecto
    return 'piezas';
  } catch (e) {
    console.error('Error obteniendo unidad de refacción:', e);
    return 'piezas';
  }
}

// Función para seleccionar refacción y almacén
function seleccionarRefaccionYAlmacen(numeroFila, refaccion, almacen) {
  const inputBuscar = document.getElementById(`refaccion_buscar_${numeroFila}`);
  const descInput = document.getElementById(`refaccion_desc_${numeroFila}`);
  const almacenInput = document.getElementById(`refaccion_almacen_${numeroFila}`);
  const stockInput = document.getElementById(`refaccion_stock_${numeroFila}`);
  const unidadInput = document.getElementById(`refaccion_unidad_${numeroFila}`);
  const cantidadInput = document.getElementById(`refaccion_cantidad_${numeroFila}`);
  const dropdown = document.getElementById(`refaccion_dropdown_${numeroFila}`);

  if (inputBuscar) {
    inputBuscar.value = refaccion.codigo;
    inputBuscar.dataset.codigo = refaccion.codigo;
    inputBuscar.dataset.almacen = almacen.nombre;
  }

  if (descInput) {
    descInput.value = refaccion.descripcion;
  }
  if (almacenInput) {
    almacenInput.value = almacen.nombre;
  }
  if (stockInput) {
    stockInput.value = almacen.stock;
  }

  // Obtener y llenar la unidad automáticamente
  const unidad = obtenerUnidadRefaccion(refaccion.codigo);
  if (unidadInput) {
    unidadInput.value = unidad;
  }

  if (cantidadInput) {
    cantidadInput.max = almacen.stock;
    cantidadInput.value = '';
  }

  if (dropdown) {
    dropdown.style.display = 'none';
  }

  console.log(
    `✅ Refacción ${refaccion.codigo} seleccionada del almacén ${almacen.nombre} (stock: ${almacen.stock}, unidad: ${unidad})`
  );

  // Actualizar stock en tiempo real desde localStorage
  setTimeout(() => {
    const stock = JSON.parse(localStorage.getItem('erp_inv_refacciones_stock') || '{}');
    const item = stock[refaccion.codigo];
    if (item && stockInput) {
      stockInput.value = item.qty || 0;
      console.log(
        `🔄 Stock actualizado en tiempo real para ${refaccion.codigo}: ${item.qty} unidades`
      );
    }
  }, 100);
}

// Función para seleccionar una refacción del dropdown (mantener compatibilidad)
function seleccionarRefaccion(numeroFila, refaccion) {
  const inputBuscar = document.getElementById(`refaccion_buscar_${numeroFila}`);
  const descInput = document.getElementById(`refaccion_desc_${numeroFila}`);
  const stockInput = document.getElementById(`refaccion_stock_${numeroFila}`);
  const unidadInput = document.getElementById(`refaccion_unidad_${numeroFila}`);
  const cantidadInput = document.getElementById(`refaccion_cantidad_${numeroFila}`);
  const dropdown = document.getElementById(`refaccion_dropdown_${numeroFila}`);

  if (inputBuscar) {
    inputBuscar.value = refaccion.codigo;
    inputBuscar.dataset.codigo = refaccion.codigo;
  }

  if (descInput) {
    descInput.value = refaccion.descripcion;
  }
  if (stockInput) {
    stockInput.value = refaccion.stock;
  }

  // Obtener y llenar la unidad automáticamente
  const unidad = obtenerUnidadRefaccion(refaccion.codigo);
  if (unidadInput) {
    unidadInput.value = unidad;
  }

  if (cantidadInput) {
    cantidadInput.max = refaccion.stock;
    cantidadInput.value = '';
  }

  if (dropdown) {
    dropdown.style.display = 'none';
  }
}

// Función para filtrar refacciones mientras se escribe
function filtrarRefacciones(numeroFila) {
  const inputBuscar = document.getElementById(`refaccion_buscar_${numeroFila}`);
  const dropdown = document.getElementById(`refaccion_dropdown_${numeroFila}`);

  if (!inputBuscar || !dropdown) {
    console.warn(`⚠️ No se encontraron elementos para fila ${numeroFila}:`, {
      inputBuscar,
      dropdown
    });
    return;
  }

  const terminoBusqueda = inputBuscar.value.toLowerCase().trim();
  console.log(`🔍 Filtrando refacciones para fila ${numeroFila} con término: "${terminoBusqueda}"`);

  if (terminoBusqueda.length === 0) {
    dropdown.style.display = 'none';
    return;
  }

  // Configurar ancho del dropdown igual al contenedor padre
  const contenedorPadre =
    inputBuscar.closest('.position-relative') || inputBuscar.closest('.input-group');
  if (contenedorPadre) {
    dropdown.style.width = `${contenedorPadre.offsetWidth}px`;
  } else {
    // Fallback: usar el ancho del input-group
    const inputGroup = inputBuscar.closest('.input-group');
    if (inputGroup) {
      dropdown.style.width = `${inputGroup.offsetWidth}px`;
    }
  }

  // Verificar que hay refacciones disponibles
  if (todasLasRefacciones.length === 0) {
    console.warn('⚠️ No hay refacciones cargadas. Intentando actualizar lista...');
    actualizarListaRefacciones();
  }

  // Filtrar refacciones que coincidan con el término de búsqueda
  const refaccionesFiltradas = todasLasRefacciones.filter(
    ref =>
      ref.codigo.toLowerCase().includes(terminoBusqueda) ||
      ref.descripcion.toLowerCase().includes(terminoBusqueda)
  );

  console.log(
    `📋 Encontradas ${refaccionesFiltradas.length} refacciones que coinciden con "${terminoBusqueda}"`
  );

  // Mostrar dropdown con resultados filtrados
  llenarDropdownRefacciones(numeroFila, refaccionesFiltradas);
  dropdown.style.display = 'block';
  dropdown.style.zIndex = '9999';
  dropdown.style.position = 'absolute';

  // Si hay exactamente un resultado y coincide exactamente, seleccionarlo automáticamente
  if (
    refaccionesFiltradas.length === 1 &&
    refaccionesFiltradas[0].codigo.toLowerCase() === terminoBusqueda
  ) {
    setTimeout(() => {
      // Usar el nuevo sistema de selección con almacén
      const stockPorAlmacen = obtenerStockRefaccionesPorAlmacen();
      seleccionarRefaccionConAlmacen(numeroFila, refaccionesFiltradas[0], stockPorAlmacen);
    }, 100);
  }
}

// Función para mostrar la lista completa de refacciones
function mostrarListaRefacciones(numeroFila) {
  console.log(`📋 Mostrando lista completa de refacciones para fila ${numeroFila}`);
  const dropdown = document.getElementById(`refaccion_dropdown_${numeroFila}`);
  const inputBuscar = document.getElementById(`refaccion_buscar_${numeroFila}`);

  if (!dropdown) {
    console.warn(`⚠️ No se encontró dropdown para fila ${numeroFila}`);
    return;
  }

  // Verificar que hay refacciones disponibles
  if (todasLasRefacciones.length === 0) {
    console.warn('⚠️ No hay refacciones cargadas. Intentando actualizar lista...');
    actualizarListaRefacciones();
  }

  // Configurar ancho del dropdown igual al contenedor padre
  if (inputBuscar) {
    const contenedorPadre =
      inputBuscar.closest('.position-relative') || inputBuscar.closest('.input-group');
    if (contenedorPadre) {
      dropdown.style.width = `${contenedorPadre.offsetWidth}px`;
      console.log(`📏 Ancho del dropdown configurado: ${contenedorPadre.offsetWidth}px`);
    }
  }

  // Limpiar búsqueda
  if (inputBuscar) {
    inputBuscar.value = '';
    inputBuscar.dataset.codigo = '';
  }

  // Mostrar todas las refacciones
  llenarDropdownRefacciones(numeroFila, todasLasRefacciones);
  dropdown.style.display = 'block';
  dropdown.style.zIndex = '9999';
  dropdown.style.position = 'absolute';

  console.log(`✅ Dropdown mostrado con ${todasLasRefacciones.length} refacciones`);

  // Ocultar dropdown al hacer clic fuera
  setTimeout(() => {
    const ocultarDropdown = function (e) {
      if (
        !dropdown.contains(e.target) &&
        !inputBuscar.contains(e.target) &&
        !e.target.closest('[data-action="mostrarListaRefacciones"]')
      ) {
        dropdown.style.display = 'none';
        document.removeEventListener('click', ocultarDropdown);
        console.log('👁️ Dropdown ocultado por clic fuera');
      }
    };
    document.addEventListener('click', ocultarDropdown);
  }, 100);
}

// Función para cargar detalles de refacción cuando se selecciona
function cargarDetallesRefaccion(numeroFila) {
  const select = document.getElementById(`refaccion_codigo_${numeroFila}`);
  const descInput = document.getElementById(`refaccion_desc_${numeroFila}`);
  const stockInput = document.getElementById(`refaccion_stock_${numeroFila}`);
  const cantidadInput = document.getElementById(`refaccion_cantidad_${numeroFila}`);

  if (!select || !descInput || !stockInput || !cantidadInput) {
    return;
  }

  const selectedOption = select.options[select.selectedIndex];

  if (selectedOption && selectedOption.value) {
    descInput.value = selectedOption.dataset.descripcion || '';
    stockInput.value = selectedOption.dataset.stock || '0';
    cantidadInput.max = selectedOption.dataset.stock || '0';
    cantidadInput.value = '';
  } else {
    descInput.value = '';
    stockInput.value = '0';
    cantidadInput.max = '0';
    cantidadInput.value = '';
  }
}

// Función para validar cantidad de refacción
function validarCantidadRefaccion(numeroFila) {
  const cantidadInput = document.getElementById(`refaccion_cantidad_${numeroFila}`);
  const stockInput = document.getElementById(`refaccion_stock_${numeroFila}`);

  if (!cantidadInput || !stockInput) {
    return;
  }

  const cantidad = parseInt(cantidadInput.value, 10) || 0;
  const stock = parseInt(stockInput.value, 10) || 0;

  // Validaciones mejoradas
  if (cantidad <= 0) {
    cantidadInput.classList.add('is-invalid');
    cantidadInput.classList.remove('is-valid');
    cantidadInput.setCustomValidity('La cantidad debe ser mayor a 0');
    cantidadInput.reportValidity();
  } else if (stock <= 0) {
    cantidadInput.classList.add('is-invalid');
    cantidadInput.classList.remove('is-valid');
    cantidadInput.setCustomValidity('⚠️ No hay stock disponible para esta refacción');
    cantidadInput.reportValidity();
  } else if (cantidad > stock) {
    cantidadInput.classList.add('is-invalid');
    cantidadInput.classList.remove('is-valid');
    cantidadInput.setCustomValidity(
      `⚠️ La cantidad (${cantidad}) no puede ser mayor al stock disponible (${stock})`
    );
    cantidadInput.reportValidity();
  } else {
    // Validación exitosa
    cantidadInput.classList.remove('is-invalid');
    cantidadInput.classList.add('is-valid');
    cantidadInput.setCustomValidity('');
  }
}

// Función para agregar nueva fila de refacción
function agregarFilaRefaccion() {
  contadorRefacciones++;
  const contenedor = document.getElementById('refaccionesAdicionales');

  const nuevaFila = document.createElement('div');
  nuevaFila.className = 'row g-3 mb-3';
  nuevaFila.id = `fila_refaccion_${contadorRefacciones}`;

  nuevaFila.innerHTML = `
        <div class="col-md-3">
            <label class="form-label">Código/SKU *</label>
            <div class="position-relative">
                <div class="input-group">
                    <input type="text" class="form-control" id="refaccion_buscar_${contadorRefacciones}" placeholder="Buscar por código o descripción..." data-action="filtrarRefacciones" autocomplete="off">
                    <button class="btn btn-outline-secondary" type="button" data-action="mostrarListaRefacciones" data-indice="${contadorRefacciones}" title="Mostrar lista completa">
                        <i class="fas fa-list"></i>
                    </button>
                    <button class="btn btn-outline-secondary" type="button" data-action="actualizarListaRefacciones" title="Actualizar lista">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                <div class="dropdown-menu position-absolute" id="refaccion_dropdown_${contadorRefacciones}" style="max-height: 300px; overflow-y: auto; width: 100%; display: none; z-index: 1000; top: 100%; left: 0;">
                    <!-- Lista de refacciones se llena dinámicamente -->
                </div>
            </div>
            <div class="form-text">Escriba para buscar o haga clic en la lista para ver todas</div>
        </div>
        <div class="col-md-2">
            <label class="form-label">Descripción</label>
            <input type="text" class="form-control" id="refaccion_desc_${contadorRefacciones}" readonly placeholder="Descripción automática">
        </div>
        <div class="col-md-2">
            <label class="form-label">Almacén</label>
            <input type="text" class="form-control" id="refaccion_almacen_${contadorRefacciones}" readonly placeholder="Almacén seleccionado">
        </div>
        <div class="col-md-1">
            <label class="form-label">Stock</label>
            <input type="text" class="form-control" id="refaccion_stock_${contadorRefacciones}" readonly placeholder="0">
        </div>
        <div class="col-md-1">
            <label class="form-label">Unidad</label>
            <input type="text" class="form-control" id="refaccion_unidad_${contadorRefacciones}" readonly placeholder="Unidad automática">
        </div>
        <div class="col-md-2">
            <label class="form-label">Cantidad *</label>
            <input type="number" class="form-control" id="refaccion_cantidad_${contadorRefacciones}" min="1" placeholder="0" data-action="validarCantidadRefaccion">
        </div>
        <div class="col-md-1 d-flex align-items-center justify-content-center">
            <div class="w-100">
                <label class="form-label">&nbsp;</label>
                <button type="button" class="btn btn-outline-danger btn-sm w-100" data-action="eliminarFilaRefaccion" data-indice="${contadorRefacciones}" title="Eliminar refacción">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

  contenedor.appendChild(nuevaFila);

  // Inicializar event handlers para la nueva fila usando el sistema global
  setTimeout(() => {
    // Buscar elementos con data-action en la nueva fila
    nuevaFila.querySelectorAll('[data-action]').forEach(element => {
      if (!element.hasAttribute('data-handler-attached')) {
        const action = element.getAttribute('data-action');
        const tagName = element.tagName.toLowerCase();
        const inputType = element.type ? element.type.toLowerCase() : '';

        // Usar el sistema global de acciones si está disponible
        if (typeof window.getGlobalAction === 'function') {
          const handler = window.getGlobalAction(action);
          if (handler) {
            if (tagName === 'input' && inputType === 'text') {
              element.addEventListener('input', handler);
              element.addEventListener('keyup', handler);
            } else if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
              element.addEventListener('change', handler);
            } else {
              element.addEventListener('click', handler);
            }
            element.setAttribute('data-handler-attached', 'true');
          }
        } else {
          // Fallback: usar funciones globales directamente si existen
          if (action === 'filtrarRefacciones' && typeof window.filtrarRefacciones === 'function') {
            const handler = _e => window.filtrarRefacciones(contadorRefacciones);
            element.addEventListener('input', handler);
            element.addEventListener('keyup', handler);
            element.setAttribute('data-handler-attached', 'true');
          } else if (
            action === 'mostrarListaRefacciones' &&
            typeof window.mostrarListaRefacciones === 'function'
          ) {
            const handler = _e => window.mostrarListaRefacciones(contadorRefacciones);
            element.addEventListener('click', handler);
            element.setAttribute('data-handler-attached', 'true');
          } else if (
            action === 'actualizarListaRefacciones' &&
            typeof window.actualizarListaRefacciones === 'function'
          ) {
            const handler = _e => window.actualizarListaRefacciones();
            element.addEventListener('click', handler);
            element.setAttribute('data-handler-attached', 'true');
          } else if (
            action === 'validarCantidadRefaccion' &&
            typeof window.validarCantidadRefaccion === 'function'
          ) {
            const handler = _e => window.validarCantidadRefaccion(contadorRefacciones);
            element.addEventListener('change', handler);
            element.setAttribute('data-handler-attached', 'true');
          } else if (
            action === 'eliminarFilaRefaccion' &&
            typeof window.eliminarFilaRefaccion === 'function'
          ) {
            const handler = _e => {
              if (confirm('¿Estás seguro de que deseas eliminar esta refacción?')) {
                window.eliminarFilaRefaccion(contadorRefacciones);
              }
            };
            element.addEventListener('click', handler);
            element.setAttribute('data-handler-attached', 'true');
          }
        }
      }
    });
  }, 100);

  // Cargar refacciones en el nuevo dropdown
  actualizarListaRefacciones();
}

// Función para eliminar fila de refacción
function eliminarFilaRefaccion(numeroFila) {
  if (contadorRefacciones <= 1) {
    alert('Debe mantener al menos una fila de refacciones.');
    return;
  }

  const fila = document.getElementById(`fila_refaccion_${numeroFila}`);
  if (fila) {
    fila.remove();
  }
}

// Función para obtener datos de refacciones utilizadas
function obtenerRefaccionesUtilizadas() {
  const refacciones = [];

  for (let i = 1; i <= contadorRefacciones; i++) {
    const inputBuscar = document.getElementById(`refaccion_buscar_${i}`);
    const cantidadInput = document.getElementById(`refaccion_cantidad_${i}`);

    if (inputBuscar && cantidadInput && inputBuscar.dataset.codigo && cantidadInput.value) {
      const stock = parseInt(document.getElementById(`refaccion_stock_${i}`).value, 10) || 0;
      const cantidad = parseInt(cantidadInput.value, 10) || 0;
      const almacen = inputBuscar.dataset.almacen || 'Almacén Central';

      if (cantidad > 0 && cantidad <= stock) {
        refacciones.push({
          codigo: inputBuscar.dataset.codigo,
          descripcion: document.getElementById(`refaccion_desc_${i}`).value,
          cantidad: cantidad,
          stockDisponible: stock,
          almacen: almacen
        });
      }
    }
  }

  return refacciones;
}

// Función para validar todas las refacciones antes de guardar
function validarRefacciones() {
  let esValido = true;
  let mensajeError = '';

  for (let i = 1; i <= contadorRefacciones; i++) {
    const inputBuscar = document.getElementById(`refaccion_buscar_${i}`);
    const cantidadInput = document.getElementById(`refaccion_cantidad_${i}`);

    if (inputBuscar && cantidadInput) {
      if (inputBuscar.dataset.codigo && !cantidadInput.value) {
        esValido = false;
        mensajeError += `Fila ${i}: Debe especificar la cantidad para la refacción seleccionada.\n`;
      } else if (!inputBuscar.dataset.codigo && cantidadInput.value) {
        esValido = false;
        mensajeError += `Fila ${i}: Debe seleccionar una refacción para la cantidad especificada.\n`;
      } else if (inputBuscar.dataset.codigo && cantidadInput.value) {
        const stock = parseInt(document.getElementById(`refaccion_stock_${i}`).value, 10) || 0;
        const cantidad = parseInt(cantidadInput.value, 10) || 0;

        if (cantidad <= 0) {
          esValido = false;
          mensajeError += `Fila ${i}: La cantidad debe ser mayor a 0.\n`;
        } else if (stock <= 0) {
          esValido = false;
          mensajeError += `Fila ${i}: No hay stock disponible para esta refacción.\n`;
        } else if (cantidad > stock) {
          esValido = false;
          mensajeError += `Fila ${i}: La cantidad (${cantidad}) excede el stock disponible (${stock}).\n`;
        } else if (stock < 5) {
          // Advertencia para stock bajo (no bloquea, solo informa)
          mensajeError += `⚠️ Fila ${i}: Stock bajo (${stock} unidades).\n`;
        }
      }
    }
  }

  if (!esValido) {
    alert(`❌ Errores en las refacciones:\n\n${mensajeError}`);
  }

  return esValido;
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando gestión de refacciones en mantenimiento...');

  // Cargar refacciones con stock disponible después de que todo esté listo
  setTimeout(() => {
    console.log('🔄 Ejecutando actualizarListaRefacciones...');
    actualizarListaRefacciones();

    // Verificar que el dropdown existe
    const dropdown = document.getElementById('refaccion_dropdown_1');
    if (dropdown) {
      console.log('✅ Dropdown encontrado:', dropdown);
    } else {
      console.warn('⚠️ Dropdown refaccion_dropdown_1 no encontrado');
    }
  }, 1500);

  console.log('✅ Gestión de refacciones inicializada');
});

// Función para obtener el nombre estándar de almacén desde configuración
function obtenerNombreEstandarAlmacen(nombre) {
  if (!nombre) {
    return 'Almacén Central';
  }

  // Obtener almacenes de configuración
  try {
    const almacenes = window.configuracionManager?.getAlmacenes() || [];

    // Buscar coincidencia exacta
    const coincidenciaExacta = almacenes.find(
      a => a.nombre && a.nombre.toLowerCase() === nombre.toLowerCase()
    );

    if (coincidenciaExacta) {
      return coincidenciaExacta.nombre; // Usar el nombre exacto de configuración
    }

    // Buscar coincidencia parcial (sin tildes, espacios, etc.)
    const coincidenciaParcial = almacenes.find(a => {
      if (!a.nombre) {
        return false;
      }
      const nombreConfig = a.nombre
        .toLowerCase()
        .replace(/[áàäâ]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/\s+/g, '')
        .trim();

      const nombreInput = nombre
        .toLowerCase()
        .replace(/[áàäâ]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/\s+/g, '')
        .trim();

      return nombreConfig === nombreInput;
    });

    if (coincidenciaParcial) {
      return coincidenciaParcial.nombre; // Usar el nombre exacto de configuración
    }

    // Si no hay coincidencia, normalizar y usar como está
    return normalizarNombreAlmacen(nombre);
  } catch (e) {
    console.error('Error obteniendo nombre estándar de almacén:', e);
    return normalizarNombreAlmacen(nombre);
  }
}

// Función para normalizar nombres de almacén (función auxiliar)
function normalizarNombreAlmacen(nombre) {
  if (!nombre) {
    return 'Almacén Central';
  }

  // Normalizar a "Almacén Central" (con tilde)
  const normalizado = nombre
    .toLowerCase()
    .trim()
    .replace(/almacen/g, 'almacén')
    .replace(/central/g, 'central');

  // Capitalizar primera letra de cada palabra
  return normalizado
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
}

// Función para sincronizar nombres de almacén con configuración
function sincronizarNombresAlmacenConConfiguracion() {
  try {
    console.log('🔄 Sincronizando nombres de almacén con configuración...');

    const almacenes = window.configuracionManager?.getAlmacenes() || [];
    if (almacenes.length === 0) {
      console.log('⚠️ No hay almacenes configurados en Configuración');
      return 0;
    }

    console.log(
      '📋 Almacenes en configuración:',
      almacenes.map(a => a.nombre)
    );

    const movs = JSON.parse(localStorage.getItem('erp_inv_refacciones_movs') || '[]');
    let movimientosCorregidos = 0;

    movs.forEach(mov => {
      const nombreOriginal = mov.almacen || '';
      const nombreEstandar = obtenerNombreEstandarAlmacen(nombreOriginal);

      if (nombreOriginal !== nombreEstandar) {
        mov.almacen = nombreEstandar;
        movimientosCorregidos++;
        console.log(
          `✅ Sincronizado movimiento ${mov.id}: "${nombreOriginal}" → "${nombreEstandar}"`
        );
      }
    });

    if (movimientosCorregidos > 0) {
      localStorage.setItem('erp_inv_refacciones_movs', JSON.stringify(movs));
      console.log(`🎯 ${movimientosCorregidos} movimientos sincronizados con configuración`);

      // Recalcular stock después de la sincronización
      sincronizarStockDesdeInventario();
    } else {
      console.log('✅ Todos los nombres de almacén ya están sincronizados');
    }

    return movimientosCorregidos;
  } catch (e) {
    console.error('❌ Error sincronizando nombres de almacén:', e);
    return 0;
  }
}

// Función para corregir inconsistencias en nombres de almacén
function corregirNombresAlmacen() {
  try {
    console.log('🔧 Corrigiendo inconsistencias en nombres de almacén...');

    const movs = JSON.parse(localStorage.getItem('erp_inv_refacciones_movs') || '[]');
    let movimientosCorregidos = 0;

    movs.forEach(mov => {
      const nombreOriginal = mov.almacen || '';
      const nombreEstandar = obtenerNombreEstandarAlmacen(nombreOriginal);

      if (nombreOriginal !== nombreEstandar) {
        mov.almacen = nombreEstandar;
        movimientosCorregidos++;
        console.log(`✅ Corregido movimiento ${mov.id}: "${nombreOriginal}" → "${nombreEstandar}"`);
      }
    });

    if (movimientosCorregidos > 0) {
      localStorage.setItem('erp_inv_refacciones_movs', JSON.stringify(movs));
      console.log(`🎯 ${movimientosCorregidos} movimientos corregidos`);

      // Recalcular stock después de la corrección
      sincronizarStockDesdeInventario();
    } else {
      console.log('✅ No hay inconsistencias que corregir');
    }

    return movimientosCorregidos;
  } catch (e) {
    console.error('❌ Error corrigiendo nombres de almacén:', e);
    return 0;
  }
}

// Función para limpiar todos los datos de refacciones
function limpiarDatosRefacciones() {
  try {
    const confirmacion = confirm(
      '⚠️ ADVERTENCIA: Esta acción eliminará TODOS los datos de refacciones.\n\n' +
        'Se eliminará:\n' +
        '• Todo el stock de refacciones\n' +
        '• Todos los movimientos de inventario\n' +
        '• Todos los registros de entradas y salidas\n\n' +
        '¿Estás seguro de que quieres continuar?'
    );

    if (!confirmacion) {
      console.log('❌ Operación cancelada por el usuario');
      return false;
    }

    console.log('🧹 Limpiando todos los datos de refacciones...');

    // Limpiar datos de stock
    localStorage.removeItem('erp_inv_refacciones_stock');
    console.log('✅ Stock de refacciones eliminado');

    // Limpiar datos de movimientos
    localStorage.removeItem('erp_inv_refacciones_movs');
    console.log('✅ Movimientos de refacciones eliminados');

    // Limpiar datos de mantenimiento relacionados
    const mantenimientos = JSON.parse(localStorage.getItem('erp_mantenimiento') || '[]');
    mantenimientos.forEach(mant => {
      if (mant.refacciones) {
        mant.refacciones = [];
      }
    });
    localStorage.setItem('erp_mantenimiento', JSON.stringify(mantenimientos));
    console.log('✅ Refacciones de mantenimientos limpiadas');

    // Actualizar la lista de refacciones
    actualizarListaRefacciones();

    console.log('🎯 Todos los datos de refacciones han sido eliminados');
    alert(
      '✅ Todos los datos de refacciones han sido eliminados correctamente.\n\nAhora puedes empezar a registrar refacciones desde cero.'
    );

    return true;
  } catch (e) {
    console.error('❌ Error limpiando datos de refacciones:', e);
    alert('❌ Error al limpiar los datos de refacciones');
    return false;
  }
}

// Función para corregir movimientos con almacén vacío
function corregirMovimientosSinAlmacen() {
  try {
    console.log('🔧 Corrigiendo movimientos sin almacén...');

    const movs = JSON.parse(localStorage.getItem('erp_inv_refacciones_movs') || '[]');
    let movimientosCorregidos = 0;

    movs.forEach(mov => {
      if (!mov.almacen || mov.almacen.trim() === '') {
        mov.almacen = 'Almacén Central';
        movimientosCorregidos++;
        console.log(`✅ Corregido movimiento ${mov.id}: almacén cambiado a "Almacén Central"`);
      }
    });

    if (movimientosCorregidos > 0) {
      localStorage.setItem('erp_inv_refacciones_movs', JSON.stringify(movs));
      console.log(`🎯 ${movimientosCorregidos} movimientos corregidos`);

      // Recalcular stock después de la corrección
      sincronizarStockDesdeInventario();
    } else {
      console.log('✅ No hay movimientos que corregir');
    }

    return movimientosCorregidos;
  } catch (e) {
    console.error('❌ Error corrigiendo movimientos:', e);
    return 0;
  }
}

// Función para sincronizar stock desde inventario
function sincronizarStockDesdeInventario() {
  try {
    console.log('🔄 Sincronizando stock desde inventario...');

    // Obtener datos de inventario
    const _stock = JSON.parse(localStorage.getItem('erp_inv_refacciones_stock') || '{}');
    const movs = JSON.parse(localStorage.getItem('erp_inv_refacciones_movs') || '[]');

    // Recalcular stock desde movimientos
    const stockRecalculado = {};
    movs.forEach(m => {
      if (!m.cod || !m.cant) {
        return;
      }

      if (!stockRecalculado[m.cod]) {
        stockRecalculado[m.cod] = {
          desc: m.desc || '',
          qty: 0,
          last: m.fecha || new Date().toISOString()
        };
      }

      const cantidad = parseInt(m.cant, 10) || 0;
      if (m.tipo === 'entrada') {
        stockRecalculado[m.cod].qty += cantidad;
      } else if (m.tipo === 'salida') {
        stockRecalculado[m.cod].qty -= cantidad;
      }

      if (stockRecalculado[m.cod].qty < 0) {
        stockRecalculado[m.cod].qty = 0;
      }
    });

    // Actualizar el stock en localStorage
    localStorage.setItem('erp_inv_refacciones_stock', JSON.stringify(stockRecalculado));

    console.log('✅ Stock sincronizado:', stockRecalculado);

    // Actualizar la lista de refacciones
    actualizarListaRefacciones();

    return stockRecalculado;
  } catch (e) {
    console.error('❌ Error sincronizando stock:', e);
    return {};
  }
}

// Función para verificar todos los movimientos en el sistema
function verificarTodosLosMovimientos() {
  try {
    const movs = JSON.parse(localStorage.getItem('erp_inv_refacciones_movs') || '[]');
    const stock = JSON.parse(localStorage.getItem('erp_inv_refacciones_stock') || '{}');

    console.log('🔍 VERIFICACIÓN COMPLETA DEL SISTEMA:');
    console.log('  - Total movimientos:', movs.length);
    console.log('  - Total items en stock:', Object.keys(stock).length);

    if (movs.length === 0) {
      console.log('❌ No hay movimientos registrados en el sistema');
      return;
    }

    console.log('📋 Todos los movimientos:');
    movs.forEach((m, index) => {
      console.log(
        `  ${index + 1}. ${m.fecha} - ${m.tipo.toUpperCase()} ${m.cant} de "${m.cod}" en "${m.almacen || 'Sin almacén'}" - ${m.obs || 'Sin observaciones'}`
      );
    });

    console.log('📦 Stock actual:');
    Object.keys(stock).forEach(codigo => {
      const item = stock[codigo];
      console.log(`  - ${codigo}: ${item.qty} unidades (${item.desc})`);
    });

    // Recalcular stock desde movimientos para verificar consistencia
    console.log('🧮 RECALCULANDO STOCK DESDE MOVIMIENTOS:');
    const stockRecalculado = {};
    movs.forEach(m => {
      if (!stockRecalculado[m.cod]) {
        stockRecalculado[m.cod] = { desc: m.desc, qty: 0 };
      }
      if (m.tipo === 'entrada') {
        stockRecalculado[m.cod].qty += m.cant;
      } else if (m.tipo === 'salida') {
        stockRecalculado[m.cod].qty -= m.cant;
      }
      if (stockRecalculado[m.cod].qty < 0) {
        stockRecalculado[m.cod].qty = 0;
      }
    });

    console.log('📊 Stock recalculado desde movimientos:');
    Object.keys(stockRecalculado).forEach(codigo => {
      const item = stockRecalculado[codigo];
      const stockOriginal = stock[codigo]?.qty || 0;
      const diferencia = stockOriginal - item.qty;
      console.log(
        `  - ${codigo}: ${item.qty} unidades (original: ${stockOriginal}, diferencia: ${diferencia})`
      );
    });

    return { movimientos: movs, stock: stock, stockRecalculado: stockRecalculado };
  } catch (e) {
    console.error('❌ Error verificando movimientos:', e);
    return null;
  }
}

// Función para diagnosticar el proceso de mantenimiento
function diagnosticarMantenimiento() {
  try {
    console.log('🔧 DIAGNÓSTICO DEL PROCESO DE MANTENIMIENTO:');

    // 1. Verificar datos de mantenimiento
    const mantenimientos = JSON.parse(localStorage.getItem('erp_mantenimiento') || '[]');
    console.log('📋 Mantenimientos registrados:', mantenimientos.length);

    if (mantenimientos.length > 0) {
      const ultimo = mantenimientos[0];
      console.log('🔍 Último mantenimiento:', {
        id: ultimo.id,
        fecha: ultimo.fecha,
        refacciones: ultimo.refacciones || []
      });
    }

    // 2. Verificar función de descuento
    console.log(
      '🔧 Función descontarRefaccionesDeInventario disponible:',
      typeof window.descontarRefaccionesDeInventario
    );

    // 3. Verificar función de recolección de datos
    console.log(
      '📊 Función collectRefaccionesData disponible:',
      typeof window.collectRefaccionesData
    );

    // 4. Verificar función obtenerRefaccionesUtilizadas
    console.log(
      '🎯 Función obtenerRefaccionesUtilizadas disponible:',
      typeof window.obtenerRefaccionesUtilizadas
    );

    // 5. Probar obtenerRefaccionesUtilizadas
    if (window.obtenerRefaccionesUtilizadas) {
      const refacciones = window.obtenerRefaccionesUtilizadas();
      console.log('🧪 Prueba obtenerRefaccionesUtilizadas():', refacciones);
    }

    // 6. Verificar stock actual
    const stock = JSON.parse(localStorage.getItem('erp_inv_refacciones_stock') || '{}');
    console.log('📦 Stock actual en localStorage:', stock);

    return {
      mantenimientos: mantenimientos.length,
      funcionesDisponibles: {
        descontar: typeof window.descontarRefaccionesDeInventario,
        collect: typeof window.collectRefaccionesData,
        obtener: typeof window.obtenerRefaccionesUtilizadas
      }
    };
  } catch (e) {
    console.error('❌ Error en diagnóstico:', e);
    return null;
  }
}

// Función para corregir el stock automáticamente
function corregirStockAutomaticamente() {
  try {
    console.log('🔧 CORRIGIENDO STOCK AUTOMÁTICAMENTE...');

    const movs = JSON.parse(localStorage.getItem('erp_inv_refacciones_movs') || '[]');
    const stock = JSON.parse(localStorage.getItem('erp_inv_refacciones_stock') || '{}');

    // Recalcular stock desde movimientos (ordenar por fecha para cálculo correcto)
    const movsOrdenados = movs.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    const stockCorregido = {};

    movsOrdenados.forEach(m => {
      if (!stockCorregido[m.cod]) {
        stockCorregido[m.cod] = { desc: m.desc, qty: 0, last: m.fecha };
      }

      const cantidad = parseInt(m.cant, 10) || 0;

      if (m.tipo === 'entrada') {
        stockCorregido[m.cod].qty += cantidad;
      } else if (m.tipo === 'salida') {
        stockCorregido[m.cod].qty -= cantidad;
      }

      // Asegurar que no sea negativo
      if (stockCorregido[m.cod].qty < 0) {
        stockCorregido[m.cod].qty = 0;
      }

      // Actualizar fecha del último movimiento
      if (new Date(m.fecha) > new Date(stockCorregido[m.cod].last)) {
        stockCorregido[m.cod].last = m.fecha;
      }
    });

    // Guardar stock corregido
    localStorage.setItem('erp_inv_refacciones_stock', JSON.stringify(stockCorregido));

    console.log('✅ Stock corregido y guardado:');
    Object.keys(stockCorregido).forEach(codigo => {
      const item = stockCorregido[codigo];
      const stockOriginal = stock[codigo]?.qty || 0;
      console.log(`  - ${codigo}: ${item.qty} unidades (era: ${stockOriginal})`);
    });

    // Intentar refrescar UI de inventario si está abierta
    if (window.refaccionesUI && typeof window.refaccionesUI.aplicarFiltros === 'function') {
      try {
        window.refaccionesUI.aplicarFiltros();
        console.log('🔄 UI de inventario actualizada');
      } catch (e) {
        console.log('⚠️ No se pudo actualizar UI de inventario:', e);
      }
    }

    return stockCorregido;
  } catch (e) {
    console.error('❌ Error corrigiendo stock:', e);
    return null;
  }
}

// Función para actualizar el stock en el formulario de mantenimiento
function actualizarStockEnFormulario() {
  try {
    console.log('🔄 Actualizando stock en formulario de mantenimiento...');

    // Obtener stock actualizado desde localStorage
    const stock = JSON.parse(localStorage.getItem('erp_inv_refacciones_stock') || '{}');

    // Buscar todas las filas de refacciones en el formulario
    for (let i = 1; i <= 10; i++) {
      const buscarInput = document.getElementById(`refaccion_buscar_${i}`);
      const stockInput = document.getElementById(`refaccion_stock_${i}`);

      if (buscarInput && stockInput && buscarInput.value.trim()) {
        const codigo = buscarInput.value.trim();
        const item = stock[codigo];

        if (item) {
          stockInput.value = item.qty || 0;
          console.log(`✅ Stock actualizado para ${codigo}: ${item.qty} unidades`);
        } else {
          stockInput.value = '0';
          console.log(`⚠️ No se encontró stock para ${codigo}`);
        }
      }
    }

    console.log('✅ Stock en formulario actualizado');
    return true;
  } catch (e) {
    console.error('❌ Error actualizando stock en formulario:', e);
    return false;
  }
}

// Función para probar el descuento de refacciones
function probarDescuentoRefacciones() {
  try {
    console.log('🧪 PROBANDO DESCUENTO DE REFACCIONES:');

    // Verificar que las funciones estén disponibles
    if (typeof window.descontarRefaccionesDeInventario !== 'function') {
      console.error('❌ Función descontarRefaccionesDeInventario no está disponible');
      return false;
    }

    if (typeof window.obtenerRefaccionesUtilizadas !== 'function') {
      console.error('❌ Función obtenerRefaccionesUtilizadas no está disponible');
      return false;
    }

    // Obtener refacciones del formulario
    const refacciones = window.obtenerRefaccionesUtilizadas();
    console.log('📋 Refacciones obtenidas del formulario:', refacciones);

    if (!Array.isArray(refacciones) || refacciones.length === 0) {
      console.log('⚠️ No hay refacciones en el formulario para probar');
      return false;
    }

    // Mostrar stock antes del descuento
    console.log('📦 Stock ANTES del descuento:');
    refacciones.forEach(ref => {
      const stock = JSON.parse(localStorage.getItem('erp_inv_refacciones_stock') || '{}');
      const item = stock[ref.codigo];
      console.log(`  - ${ref.codigo}: ${item ? item.qty : 0} unidades`);
    });

    // Ejecutar descuento
    console.log('🔧 Ejecutando descuento...');
    window.descontarRefaccionesDeInventario(refacciones);

    // Actualizar stock en el formulario
    console.log('🔄 Actualizando stock en formulario...');
    actualizarStockEnFormulario();

    // Mostrar stock después del descuento
    console.log('📦 Stock DESPUÉS del descuento:');
    refacciones.forEach(ref => {
      const stock = JSON.parse(localStorage.getItem('erp_inv_refacciones_stock') || '{}');
      const item = stock[ref.codigo];
      console.log(`  - ${ref.codigo}: ${item ? item.qty : 0} unidades`);
    });

    console.log('✅ Prueba de descuento completada');
    return true;
  } catch (e) {
    console.error('❌ Error en prueba de descuento:', e);
    return false;
  }
}

// Función para mostrar stock detallado por almacén
function mostrarStockDetallado(codigo) {
  try {
    const movs = JSON.parse(localStorage.getItem('erp_inv_refacciones_movs') || '[]');
    const movimientosCodigo = movs.filter(m => m.cod === codigo);

    console.log(`📋 Stock detallado para ${codigo}:`);
    console.log('  - Total movimientos:', movimientosCodigo.length);
    console.log('  - Total movimientos en sistema:', movs.length);

    // Mostrar todos los movimientos del sistema para debug
    console.log('🔍 Todos los movimientos en el sistema:');
    movs.forEach((m, index) => {
      console.log(
        `  ${index + 1}. Código: "${m.cod}", Tipo: ${m.tipo}, Cantidad: ${m.cant}, Almacén: "${m.almacen}"`
      );
    });

    // Mostrar todos los movimientos en orden cronológico
    console.log('📅 Historial de movimientos para', codigo, ':');
    if (movimientosCodigo.length === 0) {
      console.log('  ❌ No se encontraron movimientos para este código');
    } else {
      movimientosCodigo
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .forEach((m, index) => {
          console.log(
            `  ${index + 1}. ${m.fecha} - ${m.tipo.toUpperCase()} ${m.cant} en "${m.almacen || 'Sin almacén'}" - ${m.obs || 'Sin observaciones'}`
          );
        });
    }

    // Agrupar por almacén
    const porAlmacen = {};
    movimientosCodigo.forEach(m => {
      const almacen = m.almacen || 'Sin almacén';
      if (!porAlmacen[almacen]) {
        porAlmacen[almacen] = { entrada: 0, salida: 0, stock: 0 };
      }

      const cantidad = parseInt(m.cant, 10) || 0;
      if (m.tipo === 'entrada') {
        porAlmacen[almacen].entrada += cantidad;
      } else if (m.tipo === 'salida') {
        porAlmacen[almacen].salida += cantidad;
      }
    });

    // Calcular stock por almacén
    Object.keys(porAlmacen).forEach(almacen => {
      porAlmacen[almacen].stock = porAlmacen[almacen].entrada - porAlmacen[almacen].salida;
      if (porAlmacen[almacen].stock < 0) {
        porAlmacen[almacen].stock = 0;
      }

      console.log(
        `  - ${almacen}: ${porAlmacen[almacen].entrada} entrada, ${porAlmacen[almacen].salida} salida, ${porAlmacen[almacen].stock} stock`
      );
    });

    return porAlmacen;
  } catch (e) {
    console.error('❌ Error mostrando stock detallado:', e);
    return {};
  }
}

// Exponer funciones globalmente
window.actualizarListaRefacciones = actualizarListaRefacciones;
window.cargarDetallesRefaccion = cargarDetallesRefaccion;
window.validarCantidadRefaccion = validarCantidadRefaccion;
window.agregarFilaRefaccion = agregarFilaRefaccion;
window.eliminarFilaRefaccion = eliminarFilaRefaccion;
window.obtenerRefaccionesUtilizadas = obtenerRefaccionesUtilizadas;
window.validarRefacciones = validarRefacciones;
window.filtrarRefacciones = filtrarRefacciones;
window.mostrarListaRefacciones = mostrarListaRefacciones;
window.seleccionarRefaccion = seleccionarRefaccion;
window.sincronizarStockDesdeInventario = sincronizarStockDesdeInventario;
window.mostrarStockDetallado = mostrarStockDetallado;
window.corregirMovimientosSinAlmacen = corregirMovimientosSinAlmacen;
window.corregirNombresAlmacen = corregirNombresAlmacen;
window.normalizarNombreAlmacen = normalizarNombreAlmacen;
window.obtenerNombreEstandarAlmacen = obtenerNombreEstandarAlmacen;
window.sincronizarNombresAlmacenConConfiguracion = sincronizarNombresAlmacenConConfiguracion;
window.verificarTodosLosMovimientos = verificarTodosLosMovimientos;
window.diagnosticarMantenimiento = diagnosticarMantenimiento;
window.probarDescuentoRefacciones = probarDescuentoRefacciones;
window.actualizarStockEnFormulario = actualizarStockEnFormulario;
window.corregirStockAutomaticamente = corregirStockAutomaticamente;
window.limpiarDatosRefacciones = limpiarDatosRefacciones;
window.obtenerStockRefaccionesPorAlmacen = obtenerStockRefaccionesPorAlmacen;
window.seleccionarRefaccionConAlmacen = seleccionarRefaccionConAlmacen;
window.seleccionarRefaccionYAlmacen = seleccionarRefaccionYAlmacen;
