// ===== GESTIÓN DE GASTOS DE OPERADORES EN TRÁFICO =====

// Variable global para contar filas de gastos
let contadorGastosOperadores = 1;

// Lista validada de motivos de pago
const motivosPagoValidos = [
  'Viáticos',
  'Destajos',
  'Peaje',
  'Alimentación',
  'Hospedaje',
  'Mantenimiento',
  'Talachas',
  'Multas',
  'Ajustes',
  'Otros'
];

// Función para cargar motivos de pago en un select
function cargarMotivosPagoEnSelect(numeroFila) {
  console.log(`🔄 Intentando cargar motivos de pago en fila ${numeroFila}...`);
  const select = document.getElementById(`gasto_motivo_${numeroFila}`);

  if (!select) {
    console.warn(`⚠️ Select gasto_motivo_${numeroFila} no encontrado`);
    // Reintentar después de un breve delay
    setTimeout(() => {
      const selectRetry = document.getElementById(`gasto_motivo_${numeroFila}`);
      if (selectRetry) {
        console.log(`✅ Select encontrado en reintento para fila ${numeroFila}`);
        cargarMotivosPagoEnSelect(numeroFila);
      } else {
        console.error(`❌ Select gasto_motivo_${numeroFila} no encontrado después de reintentar`);
      }
    }, 300);
    return;
  }

  console.log(
    `✅ Select encontrado para fila ${numeroFila}, cargando ${motivosPagoValidos.length} motivos...`
  );

  // Limpiar opciones existentes
  select.innerHTML = '<option value="">Seleccione motivo...</option>';

  // Agregar motivos de pago a la lista
  motivosPagoValidos.forEach(motivo => {
    const option = document.createElement('option');
    option.value = motivo;
    option.textContent = motivo;
    select.appendChild(option);
  });

  console.log(
    `✅ Motivos de pago cargados en fila ${numeroFila}: ${motivosPagoValidos.length} opciones`
  );
  console.log('✅ Opciones en el select:', select.options.length);
  console.log('✅ Motivos disponibles:', motivosPagoValidos);

  // Disparar evento change para notificar que se cargaron las opciones
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

// Función para cargar operadores en el select
async function cargarOperadoresEnGastos() {
  const select = document.getElementById('gasto_operador_1');
  if (!select) {
    return;
  }

  // Limpiar opciones existentes
  select.innerHTML = '<option value="">Seleccione operador...</option>';

  // Usar sistema de caché inteligente: Firebase primero, luego caché
  const operadores = await window.getDataWithCache('operadores', async () => {
    let operadoresData = [];

    // 1. PRIORIDAD: Cargar desde Firebase (repositorio o directo)
    if (window.firebaseRepos?.operadores) {
      const repo = window.firebaseRepos.operadores;

      // Asegurar que el repositorio esté inicializado
      if (!repo.db || !repo.tenantId) {
        if (typeof repo.init === 'function') {
          await repo.init();
        }
      }

      // Esperar hasta 2 segundos para que se inicialice
      let intentos = 0;
      while ((!repo.db || !repo.tenantId) && intentos < 10) {
        intentos++;
        await new Promise(resolve => setTimeout(resolve, 200));
        if (typeof repo.init === 'function') {
          await repo.init();
        }
      }

      if (repo.db && repo.tenantId) {
        try {
          const todosOperadores = await repo.getAllRegistros();
          operadoresData = todosOperadores.filter(op => !op.deleted);
          console.log(
            '✅ Operadores cargados desde Firebase (repositorio) para gastos:',
            operadoresData.length
          );
        } catch (error) {
          console.warn('⚠️ Error cargando operadores desde repositorio:', error);
        }
      }
    }

    // 2. Fallback: Cargar directamente desde Firebase si el repositorio no funcionó
    if (operadoresData.length === 0 && window.firebaseDb && window.fs) {
      try {
        const operadoresRef = window.fs.collection(window.firebaseDb, 'operadores');
        const tenantId =
          window.firebaseAuth?.currentUser?.uid ||
          localStorage.getItem('tenantId') ||
          window.DEMO_CONFIG?.tenantId ||
          'demo_tenant';
        const querySnapshot = await window.fs.getDocs(
          window.fs.query(operadoresRef, window.fs.where('tenantId', '==', tenantId))
        );
        operadoresData = querySnapshot.docs.map(doc => doc.data()).filter(op => !op.deleted);
        console.log(
          '✅ Operadores cargados directamente desde Firebase para gastos:',
          operadoresData.length
        );
      } catch (error) {
        console.warn('⚠️ Error cargando operadores directamente desde Firebase:', error);
      }
    }

    // 3. Fallback: Intentar obtener del sistema de configuración
    if (operadoresData.length === 0 && window.configuracionManager) {
      // Esperar hasta 2 segundos para que configuracionManager esté listo
      let intentosConfig = 0;
      while (
        (!window.configuracionManager ||
          typeof window.configuracionManager.getAllOperadores !== 'function') &&
        intentosConfig < 8
      ) {
        intentosConfig++;
        await new Promise(resolve => setTimeout(resolve, 250));
      }

      if (
        window.configuracionManager &&
        typeof window.configuracionManager.getAllOperadores === 'function'
      ) {
        const todosLosOperadores = window.configuracionManager.getAllOperadores();
        if (todosLosOperadores && Array.isArray(todosLosOperadores)) {
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
          operadoresData = todosLosOperadores.filter(op => {
            const operadorTenantId = op.tenantId;
            return !op.deleted && operadorTenantId === tenantId;
          });

          console.log(
            `🔒 Operadores filtrados por tenantId (${tenantId}): ${operadoresData.length} de ${todosLosOperadores.length} totales`
          );
        }
      }
    }

    // CRÍTICO: Asegurar filtrado por tenantId en todos los casos (por si acaso)
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

    const totalAntesFiltro = operadoresData.length;
    operadoresData = operadoresData.filter(operador => {
      const operadorTenantId = operador.tenantId;
      return operadorTenantId === tenantId;
    });

    if (totalAntesFiltro !== operadoresData.length) {
      console.log(
        `🔒 Operadores filtrados por tenantId (${tenantId}): ${operadoresData.length} de ${totalAntesFiltro} totales`
      );
    }

    return operadoresData;
  });

  // Asegurar que operadores sea siempre un array
  const operadoresArray = Array.isArray(operadores)
    ? operadores
    : operadores
      ? Object.values(operadores)
      : [];

  if (operadoresArray.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No hay operadores registrados';
    option.disabled = true;
    select.appendChild(option);
    return;
  }

  // Agregar operadores a la lista (solo nombre, sin licencia)
  console.log('🔍 Agregando operadores al select de gastos:', operadoresArray);
  operadoresArray.forEach(operador => {
    const option = document.createElement('option');
    option.value = operador.nombre;
    option.textContent = operador.nombre;
    select.appendChild(option);
    console.log('✅ Operador agregado a gastos:', operador.nombre);
  });

  console.log(`Lista de operadores cargada en gastos: ${operadores.length} elementos`);
}

// Función para agregar nueva fila de gasto
function agregarGastoOperador() {
  contadorGastosOperadores++;
  const contenedor = document.getElementById('gastosOperadoresAdicionales');

  const nuevaFila = document.createElement('div');
  nuevaFila.className = 'row g-3 mb-3';
  nuevaFila.id = `fila_gasto_operador_${contadorGastosOperadores}`;

  nuevaFila.innerHTML = `
        <div class="col-md-3">
            <label class="form-label">Operador</label>
            <div class="searchable-select-container">
                <div class="search-input-wrapper">
                    <input 
                        type="text" 
                        id="gasto_operador_${contadorGastosOperadores}" 
                        class="form-control" 
                        placeholder="Escriba para buscar operador..."
                        autocomplete="off"
                    >
                    <i class="fas fa-search search-icon"></i>
                    <button id="btn-clear-gasto_operador_${contadorGastosOperadores}" class="btn btn-outline-secondary btn-sm btn-clear" type="button" title="Limpiar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="select-gasto_operador_${contadorGastosOperadores}" class="filtered-select"></div>
            </div>
            <input type="hidden" id="gasto_operador_${contadorGastosOperadores}_value">
        </div>
        <div class="col-md-3">
            <label class="form-label">Motivo de Pago</label>
            <select class="form-select" id="gasto_motivo_${contadorGastosOperadores}">
                <option value="">Seleccione motivo...</option>
            </select>
        </div>
        <div class="col-md-2">
            <label class="form-label">Monto</label>
            <input type="number" class="form-control" id="gasto_monto_${contadorGastosOperadores}" min="0" step="0.01" placeholder="0.00">
        </div>
        <div class="col-md-3">
            <label class="form-label">Evidencia</label>
            <input type="file" class="form-control" id="gasto_evidencia_${contadorGastosOperadores}" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx">
        </div>
        <div class="col-md-1 d-flex align-items-center justify-content-center">
            <div class="w-100">
                <label class="form-label">&nbsp;</label>
                <button type="button" class="btn btn-outline-danger btn-sm w-100" onclick="eliminarGastoOperador(${contadorGastosOperadores})" title="Eliminar gasto">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

  contenedor.appendChild(nuevaFila);

  // Inicializar el nuevo componente searchable-select para el operador
  // La función espera internamente a que el elemento esté disponible
  if (typeof window.inicializarOperadorGastoTrafico === 'function') {
    window.inicializarOperadorGastoTrafico(contadorGastosOperadores).catch(error => {
      console.error(
        `❌ Error inicializando operador para fila ${contadorGastosOperadores}:`,
        error
      );
    });
  } else {
    console.warn('⚠️ Función inicializarOperadorGastoTrafico no está disponible');
  }

  // Cargar motivos de pago
  cargarMotivosPagoEnSelect(contadorGastosOperadores);
}

// Función para cargar operadores en un select específico
async function cargarOperadoresEnSelect(numeroFila) {
  const select = document.getElementById(`gasto_operador_${numeroFila}`);
  if (!select) {
    return;
  }

  // Limpiar opciones existentes
  select.innerHTML = '<option value="">Seleccione operador...</option>';

  // Obtener operadores del sistema de configuración
  let operadores = [];

  // 1. PRIORIDAD: Cargar desde Firebase
  if (window.firebaseDb && window.fs && window.firebaseAuth?.currentUser?.isAnonymous) {
    try {
      console.log('📊 [PRIORIDAD] Cargando operadores desde Firebase para gasto...');
      const operadoresRef = window.fs.collection(window.firebaseDb, 'operadores');
      const querySnapshot = await window.fs.getDocs(
        window.fs.query(
          operadoresRef,
          window.fs.where(
            'tenantId',
            '==',
            window.firebaseAuth?.currentUser?.uid || window.DEMO_CONFIG?.tenantId || 'demo_tenant'
          )
        )
      );
      operadores = querySnapshot.docs.map(doc => doc.data());
      console.log('✅ Operadores cargados desde Firebase para gasto:', operadores.length);
    } catch (error) {
      console.warn('⚠️ Error cargando operadores desde Firebase para gasto:', error);
    }
  }

  // 2. Fallback: Intentar obtener del sistema de configuración
  if (operadores.length === 0 && window.configuracionManager) {
    const operadoresData = window.configuracionManager.getAllOperadores();
    if (operadoresData && Array.isArray(operadoresData)) {
      operadores = operadoresData;
      console.log(
        '✅ Operadores cargados desde configuracionManager para gasto:',
        operadores.length
      );
    }
  }

  // 3. Fallback: Si no hay datos en configuración, intentar del sistema de persistencia
  if (
    operadores.length === 0 &&
    window.DataPersistence &&
    typeof window.DataPersistence.getAllOperadores === 'function'
  ) {
    try {
      operadores = window.DataPersistence.getAllOperadores();
      console.log('✅ Operadores cargados desde DataPersistence para gasto:', operadores.length);
    } catch (error) {
      console.warn('⚠️ Error cargando operadores desde DataPersistence para gasto:', error);
      operadores = [];
    }
  }

  // 4. Fallback: Si aún no hay datos, usar sistema de caché
  if (operadores.length === 0) {
    try {
      operadores = await window.getDataWithCache('operadores', async () => {
        if (
          window.configuracionManager &&
          typeof window.configuracionManager.getAllOperadores === 'function'
        ) {
          const ops = window.configuracionManager.getAllOperadores() || [];
          return Array.isArray(ops) ? ops : Object.values(ops);
        }
        return [];
      });

      // Asegurar que sea un array
      if (!Array.isArray(operadores)) {
        operadores = Object.values(operadores || {});
      }

      if (operadores.length > 0) {
        console.log(`✅ ${operadores.length} operadores cargados desde sistema de caché`);
      }
    } catch (error) {
      console.warn('⚠️ Error cargando operadores desde caché:', error);
      operadores = [];
    }
  }

  // Asegurar que operadores sea un array válido
  if (!Array.isArray(operadores)) {
    operadores = [];
  }

  if (operadores.length > 0) {
    console.log(`✅ ${operadores.length} operadores disponibles para gastos`);
  }

  if (operadores.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No hay operadores registrados';
    option.disabled = true;
    select.appendChild(option);
    return;
  }

  // Agregar operadores a la lista
  operadores.forEach(operador => {
    const option = document.createElement('option');
    option.value = operador.nombre;
    option.textContent = `${operador.nombre} - ${operador.licencia || 'Sin Licencia'}`;
    select.appendChild(option);
  });

  console.log(`✅ Operadores cargados en gasto ${numeroFila}: ${operadores.length} elementos`);
}

// Función para eliminar fila de gasto
function eliminarGastoOperador(numeroFila) {
  if (contadorGastosOperadores <= 1) {
    alert('Debe mantener al menos una fila de gastos.');
    return;
  }

  // Limpiar instancia del componente searchable-select si existe
  if (typeof window.limpiarOperadorGastoTrafico === 'function') {
    window.limpiarOperadorGastoTrafico(numeroFila);
  }

  const fila = document.getElementById(`fila_gasto_operador_${numeroFila}`);
  if (fila) {
    fila.remove();
  }
}

// Función para obtener datos de gastos de operadores
function obtenerGastosOperadores() {
  const gastos = [];

  for (let i = 1; i <= contadorGastosOperadores; i++) {
    // Usar el input visible para obtener el texto o el hidden input para el ID
    const operadorInput = document.getElementById(`gasto_operador_${i}`);
    const operadorValueInput = document.getElementById(`gasto_operador_${i}_value`);
    const motivoInput = document.getElementById(`gasto_motivo_${i}`);
    const montoInput = document.getElementById(`gasto_monto_${i}`);
    const evidenciaInput = document.getElementById(`gasto_evidencia_${i}`);

    // Obtener valor del operador (preferir hidden input si existe, sino usar el texto del input)
    const operadorValue = operadorValueInput?.value || operadorInput?.value || '';
    const operadorTextoCompleto = operadorInput?.value || '';

    if (
      operadorInput &&
      motivoInput &&
      montoInput &&
      operadorValue &&
      motivoInput.value &&
      montoInput.value
    ) {
      const monto = parseFloat(montoInput.value) || 0;

      if (monto > 0) {
        // Extraer nombre y licencia del formato "Nombre - Licencia"
        let operadorNombre = '';
        let operadorLicencia = '';

        if (operadorTextoCompleto.includes(' - ')) {
          const partes = operadorTextoCompleto.split(' - ');
          operadorNombre = partes[0].trim();
          operadorLicencia = partes[1]?.trim() || '';
        } else {
          // Si no tiene el formato, intentar buscar el operador para obtener ambos datos
          if (window.configuracionManager) {
            const operadores = window.configuracionManager.getAllOperadores() || [];
            const operador = operadores.find(
              op =>
                op.id === operadorValue ||
                op.numeroLicencia === operadorValue ||
                op.licencia === operadorTextoCompleto ||
                op.numeroLicencia === operadorTextoCompleto ||
                op.nombre === operadorTextoCompleto
            );
            if (operador) {
              operadorNombre = operador.nombre || operador.nombreCompleto || operadorTextoCompleto;
              operadorLicencia = operador.licencia || operador.numeroLicencia || '';
            } else {
              // Si no se encuentra, asumir que el texto es el nombre
              operadorNombre = operadorTextoCompleto;
            }
          } else {
            // Si no hay configuracionManager, usar el texto como nombre
            operadorNombre = operadorTextoCompleto;
          }
        }

        gastos.push({
          operador: operadorValue, // Usar el ID del operador
          operadorNombre: operadorNombre, // Nombre completo del operador
          operadorLicencia: operadorLicencia, // Licencia del operador (separada)
          motivo: motivoInput.value,
          monto: monto,
          evidencia: evidenciaInput ? evidenciaInput.files[0]?.name || '' : ''
        });
      }
    }
  }

  return gastos;
}

// Flag para evitar ejecuciones simultáneas
let guardandoGastos = false;

// Función para guardar gastos de operadores en el sistema de operadores
async function guardarGastosOperadoresEnSistema() {
  // Prevenir ejecuciones simultáneas
  if (guardandoGastos) {
    console.warn('⚠️ Ya hay una operación de guardado de gastos en progreso, omitiendo...');
    return false;
  }

  guardandoGastos = true;

  try {
    const gastos = obtenerGastosOperadores();
    if (gastos.length === 0) {
      console.log('No hay gastos de operadores para guardar');
      guardandoGastos = false;
      return false;
    }

    // Obtener datos del formulario de tráfico
    const numeroRegistro = document.getElementById('numeroRegistro')?.value || '';
    const fechaEnvio =
      document.getElementById('fechaEnvio')?.value || new Date().toISOString().split('T')[0];
    const economico = document.getElementById('economico')?.value || '';
    const placas = document.getElementById('Placas')?.value || '';

    console.log('🔍 Iniciando guardado de gastos:', {
      numeroRegistro,
      cantidad: gastos.length,
      gastos: gastos.map(g => ({ operador: g.operador, motivo: g.motivo, monto: g.monto }))
    });

    // Obtener gastos existentes del sistema de operadores (desde Firebase primero si está disponible)
    let gastosExistentes = [];

    // Intentar cargar desde Firebase primero para verificar duplicados
    if (window.firebaseRepos?.operadores) {
      try {
        let attempts = 0;
        while (
          attempts < 10 &&
          (!window.firebaseRepos.operadores.db || !window.firebaseRepos.operadores.tenantId)
        ) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 100));
          if (!window.firebaseRepos.operadores.db || !window.firebaseRepos.operadores.tenantId) {
            await window.firebaseRepos.operadores.init();
          }
        }

        if (window.firebaseRepos.operadores.db && window.firebaseRepos.operadores.tenantId) {
          const gastosFirebase = await window.firebaseRepos.operadores.getAllGastos();
          if (gastosFirebase && Array.isArray(gastosFirebase)) {
            gastosExistentes = gastosFirebase;
            console.log(`📋 Gastos existentes cargados desde Firebase: ${gastosExistentes.length}`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando gastos desde Firebase para verificar duplicados:', error);
      }
    }

    // Si no se pudieron cargar desde Firebase, cargar desde localStorage
    if (gastosExistentes.length === 0) {
      gastosExistentes = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');
      console.log(`📋 Gastos existentes cargados desde localStorage: ${gastosExistentes.length}`);
    }

    // Verificar duplicados para cada gasto individualmente
    const gastosSinDuplicar = [];

    console.log(
      `🔍 Verificando duplicados: ${gastos.length} gastos nuevos vs ${gastosExistentes.length} gastos existentes`
    );

    gastos.forEach((gasto, index) => {
      // Verificar si ya existe un gasto idéntico para este registro
      const gastosDuplicados = gastosExistentes.filter(
        g =>
          g.numeroRegistro === numeroRegistro &&
          g.origen === 'trafico' &&
          g.operadorNombre === gasto.operador &&
          g.tipoGasto === gasto.motivo &&
          Math.abs(g.monto - gasto.monto) < 0.01 // Comparar montos con tolerancia
      );

      if (gastosDuplicados.length > 0) {
        console.warn(`⚠️ Gasto ${index + 1} DUPLICADO detectado y omitido:`, {
          operador: gasto.operador,
          motivo: gasto.motivo,
          monto: gasto.monto,
          registro: numeroRegistro,
          duplicadosEncontrados: gastosDuplicados.length,
          idsDuplicados: gastosDuplicados.map(g => g.id)
        });
      } else {
        gastosSinDuplicar.push(gasto);
        console.log(
          `✅ Gasto ${index + 1} es NUEVO: ${gasto.operador} - ${gasto.motivo} - $${gasto.monto}`
        );
      }
    });

    if (gastosSinDuplicar.length === 0) {
      console.warn(
        `⚠️ Todos los gastos para el registro ${numeroRegistro} ya existen, no se guardarán`
      );
      guardandoGastos = false;
      return false;
    }

    console.log(
      `✅ RESUMEN: ${gastosSinDuplicar.length} de ${gastos.length} gastos son nuevos y se guardarán`
    );

    // Procesar solo los gastos que no están duplicados
    const gastosParaGuardar = [];
    const nuevosGastos = [];

    gastosSinDuplicar.forEach((gasto, index) => {
      // Generar ID único usando timestamp + índice + random para evitar colisiones
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      const gastoId = `gasto_${timestamp}_${index}_${random}`;

      // Extraer placas del tractocamion del formato "económico - placas"
      const tractocamionPlacas = placas || '';
      const tractocamionEconomico = economico || '';
      const tractocamionInfoCompleto = `${economico} - ${placas}`;

      const gastoData = {
        id: gastoId,
        fechaCreacion: new Date().toISOString(),
        fecha: fechaEnvio,
        operadorId: null, // No tenemos ID, solo nombre
        operadorNombre: gasto.operadorNombre || gasto.operador, // Nombre completo del operador
        operadorLicencia: gasto.operadorLicencia || '', // Licencia del operador (separada)
        tractocamionId: null, // No tenemos ID, solo info
        tractocamionInfo: tractocamionInfoCompleto, // Información completa (para compatibilidad)
        tractocamionEconomico: tractocamionEconomico, // Número económico del tractocamion
        tractocamionPlacas: tractocamionPlacas, // Placas del tractocamion (separadas)
        tipoGasto: gasto.motivo,
        monto: gasto.monto,
        numeroRegistro: numeroRegistro,
        concepto: `Gasto de tráfico - ${gasto.motivo}`,
        evidencia: gasto.evidencia
          ? [
            {
              nombre: gasto.evidencia,
              tamaño: 0,
              tipo: 'application/octet-stream',
              fecha: new Date().toISOString()
            }
          ]
          : [],
        observaciones: `Registrado desde tráfico - Registro: ${numeroRegistro}`,
        origen: 'trafico' // Marcar que viene de tráfico
      };

      // Verificar que no esté duplicado por ID, número de registro, operador, tipo y monto
      const existeDuplicado = gastosExistentes.some(g => {
        const mismoId = g.id === gastoId;
        const mismoRegistro = g.numeroRegistro === numeroRegistro && g.origen === 'trafico';
        const mismoOperador =
          g.operadorNombre === (gasto.operadorNombre || gasto.operador) ||
          g.operadorLicencia === gasto.operadorLicencia;
        const mismoTipo = g.tipoGasto === gasto.motivo;
        const mismoMonto = Math.abs(g.monto - gasto.monto) < 0.01;

        return mismoId || (mismoRegistro && mismoOperador && mismoTipo && mismoMonto);
      });

      if (!existeDuplicado) {
        nuevosGastos.push(gastoData);
        gastosParaGuardar.push({ id: gastoId, data: gastoData });
        console.log(
          `✅ Gasto preparado para guardar: ${gastoId} - ${gasto.operador} - ${gasto.motivo} - $${gasto.monto}`
        );
      } else {
        console.warn(
          `⚠️ Gasto duplicado detectado y omitido: ${gasto.operador} - ${gasto.motivo} - $${gasto.monto} para registro ${numeroRegistro}`
        );
      }
    });

    if (gastosParaGuardar.length === 0) {
      console.log('⚠️ No hay gastos nuevos para guardar (todos están duplicados)');
      return false;
    }

    // PRIORIDAD: Guardar en Firebase primero
    let guardadoEnFirebase = false;
    if (window.firebaseRepos?.operadores) {
      try {
        // Esperar a que el repositorio esté completamente inicializado
        let attempts = 0;
        while (
          attempts < 10 &&
          (!window.firebaseRepos.operadores.db || !window.firebaseRepos.operadores.tenantId)
        ) {
          attempts++;
          console.log(
            `⏳ Esperando inicialización del repositorio de operadores para guardar... (${attempts}/10)`
          );
          await new Promise(resolve => setTimeout(resolve, 500));

          // Intentar inicializar si aún no está listo
          if (!window.firebaseRepos.operadores.db || !window.firebaseRepos.operadores.tenantId) {
            await window.firebaseRepos.operadores.init();
          }
        }

        if (!window.firebaseRepos.operadores.db || !window.firebaseRepos.operadores.tenantId) {
          throw new Error('Repositorio de operadores no está inicializado después de 5 segundos');
        }

        console.log('🔥 Guardando gastos en Firebase...', {
          cantidad: gastosParaGuardar.length,
          tenantId: window.firebaseRepos.operadores.tenantId,
          tieneDb: Boolean(window.firebaseRepos.operadores.db)
        });

        console.log(`💾 Preparando guardar ${gastosParaGuardar.length} gastos en Firebase...`);
        console.log(
          '📋 IDs de gastos a guardar:',
          gastosParaGuardar.map(g => g.id)
        );

        const promises = gastosParaGuardar.map(async (g, index) => {
          try {
            console.log(
              `💾 [${index + 1}/${gastosParaGuardar.length}] Guardando gasto ${g.id} en Firebase...`
            );
            console.log('📋 Datos del gasto:', {
              operador: g.data.operadorNombre,
              motivo: g.data.tipoGasto,
              monto: g.data.monto,
              registro: g.data.numeroRegistro,
              id: g.id
            });
            // Asegurar que el gasto tenga el campo 'tipo: "gasto"' para que getAllGastos() lo encuentre
            const gastoConTipo = {
              ...g.data,
              tipo: 'gasto' // Campo requerido por getAllGastos()
            };
            const resultado = await window.firebaseRepos.operadores.saveGasto(g.id, gastoConTipo);
            console.log(
              `✅ [${index + 1}/${gastosParaGuardar.length}] Gasto ${g.id} guardado exitosamente en Firebase`
            );
            return resultado;
          } catch (error) {
            console.error(
              `❌ [${index + 1}/${gastosParaGuardar.length}] Error guardando gasto ${g.id}:`,
              error
            );
            throw error;
          }
        });

        await Promise.all(promises);
        console.log(`✅ ✅ ${gastosParaGuardar.length} gastos guardados exitosamente en Firebase`);
        guardadoEnFirebase = true;
      } catch (firebaseError) {
        console.error('❌ Error guardando en Firebase:', firebaseError);
        console.error('❌ Stack trace:', firebaseError.stack);
        console.log('⚠️ Continuando con guardado en localStorage...');
      }
    } else {
      console.warn('⚠️ Repositorio de Firebase no disponible, guardando solo en localStorage');
    }

    // Solo guardar en localStorage si NO se guardó en Firebase, o como respaldo adicional
    // Pero siempre verificar duplicados antes de agregar
    if (!guardadoEnFirebase) {
      // Si no se guardó en Firebase, agregar solo los nuevos gastos a localStorage
      const gastosLocal = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');

      // Agregar solo los gastos que no existen por ID
      nuevosGastos.forEach(nuevoGasto => {
        const existePorId = gastosLocal.some(g => g.id === nuevoGasto.id);
        if (!existePorId) {
          // Asegurar que tenga el campo 'tipo' para que se cargue correctamente
          const gastoConTipo = {
            ...nuevoGasto,
            tipo: 'gasto' // Campo requerido para que getAllGastos() lo encuentre
          };
          gastosLocal.unshift(gastoConTipo);
        }
      });

      localStorage.setItem('erp_operadores_gastos', JSON.stringify(gastosLocal));
      console.log(`✅ ${nuevosGastos.length} gastos guardados en localStorage`);
    } else {
      // Si se guardó en Firebase, también sincronizar con localStorage para que estén disponibles inmediatamente
      try {
        const gastosLocal = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');

        // Agregar los nuevos gastos a localStorage también (con tipo)
        nuevosGastos.forEach(nuevoGasto => {
          const existePorId = gastosLocal.some(g => g.id === nuevoGasto.id);
          if (!existePorId) {
            const gastoConTipo = {
              ...nuevoGasto,
              tipo: 'gasto' // Campo requerido para que getAllGastos() lo encuentre
            };
            gastosLocal.unshift(gastoConTipo);
          }
        });

        localStorage.setItem('erp_operadores_gastos', JSON.stringify(gastosLocal));
        console.log('✅ Gastos también sincronizados en localStorage para acceso inmediato');
      } catch (error) {
        console.warn('⚠️ Error sincronizando gastos en localStorage:', error);
      }
    }

    console.log(`✅ ${gastos.length} gastos de operadores guardados en el sistema`);
    guardandoGastos = false;
    return true;
  } catch (error) {
    console.error('❌ Error guardando gastos de operadores:', error);
    guardandoGastos = false;
    return false;
  }
}

// Función para validar gastos de operadores
function validarGastosOperadores() {
  let esValido = true;
  let mensajeError = '';

  for (let i = 1; i <= contadorGastosOperadores; i++) {
    const operadorSelect = document.getElementById(`gasto_operador_${i}`);
    const motivoInput = document.getElementById(`gasto_motivo_${i}`);
    const montoInput = document.getElementById(`gasto_monto_${i}`);

    if (operadorSelect && motivoInput && montoInput) {
      if (operadorSelect.value && !motivoInput.value) {
        esValido = false;
        mensajeError += `Fila ${i}: Debe especificar el motivo del pago.\n`;
      } else if (operadorSelect.value && !montoInput.value) {
        esValido = false;
        mensajeError += `Fila ${i}: Debe especificar el monto del pago.\n`;
      } else if (!operadorSelect.value && (motivoInput.value || montoInput.value)) {
        esValido = false;
        mensajeError += `Fila ${i}: Debe seleccionar un operador.\n`;
      } else if (operadorSelect.value && motivoInput.value && montoInput.value) {
        const monto = parseFloat(montoInput.value) || 0;
        if (monto <= 0) {
          esValido = false;
          mensajeError += `Fila ${i}: El monto debe ser mayor a 0.\n`;
        }
      }
    }
  }

  if (!esValido) {
    alert(`❌ Errores en los gastos de operadores:\n\n${mensajeError}`);
  }

  return esValido;
}

// Función para limpiar todos los gastos
function limpiarGastosOperadores() {
  try {
    const confirmacion = confirm(
      '⚠️ ADVERTENCIA: Esta acción eliminará TODOS los gastos de operadores.\n\n' +
        '¿Estás seguro de que quieres continuar?'
    );

    if (!confirmacion) {
      console.log('❌ Operación cancelada por el usuario');
      return false;
    }

    console.log('🧹 Limpiando todos los gastos de operadores...');

    // Limpiar todos los campos de gastos
    for (let i = 1; i <= contadorGastosOperadores; i++) {
      const operadorSelect = document.getElementById(`gasto_operador_${i}`);
      const motivoInput = document.getElementById(`gasto_motivo_${i}`);
      const montoInput = document.getElementById(`gasto_monto_${i}`);
      const evidenciaInput = document.getElementById(`gasto_evidencia_${i}`);

      if (operadorSelect) {
        operadorSelect.value = '';
      }
      if (motivoInput) {
        motivoInput.value = '';
      }
      if (montoInput) {
        montoInput.value = '';
      }
      if (evidenciaInput) {
        evidenciaInput.value = '';
      }
    }

    // Eliminar filas adicionales
    const contenedor = document.getElementById('gastosOperadoresAdicionales');
    if (contenedor) {
      contenedor.innerHTML = '';
    }

    // Resetear contador
    contadorGastosOperadores = 1;

    console.log('🎯 Todos los gastos de operadores han sido eliminados');
    alert('✅ Todos los gastos de operadores han sido eliminados correctamente.');

    return true;
  } catch (e) {
    console.error('❌ Error limpiando gastos de operadores:', e);
    alert('❌ Error al limpiar los gastos de operadores');
    return false;
  }
}

// Función para refrescar todas las listas de operadores
function refrescarListasOperadores() {
  cargarOperadoresEnGastos();

  // Refrescar también las filas adicionales
  for (let i = 2; i <= contadorGastosOperadores; i++) {
    cargarOperadoresEnSelect(i);
  }
}

// Función de debug para verificar datos de operadores
function debugOperadores() {
  console.log('🔍 DEBUG: Verificando datos de operadores...');

  // Verificar configuracionManager
  console.log('configuracionManager disponible:', Boolean(window.configuracionManager));
  if (window.configuracionManager) {
    const operadores = window.configuracionManager.getAllOperadores();
    console.log('Operadores desde configuracionManager:', operadores);
  }

  // Verificar localStorage directamente
  const operadoresData = localStorage.getItem('erp_operadores');
  console.log('Datos en localStorage erp_operadores:', operadoresData);

  if (operadoresData) {
    try {
      const parsed = JSON.parse(operadoresData);
      console.log('Datos parseados:', parsed);
      console.log('Es array?', Array.isArray(parsed));
      if (Array.isArray(parsed)) {
        console.log('Número de operadores:', parsed.length);
        parsed.forEach((op, index) => {
          console.log(`Operador ${index + 1}:`, op);
        });
      }
    } catch (e) {
      console.error('Error parseando datos:', e);
    }
  }
}

// Función para inicializar cuando configuracionManager esté listo
function inicializarGastosOperadores() {
  console.log('🚀 Inicializando gestión de gastos de operadores en tráfico...');

  // Debug de operadores
  debugOperadores();

  // Cargar operadores en el select principal
  cargarOperadoresEnGastos();

  // Cargar motivos de pago en el select principal (asegurar que se cargue)
  console.log('🔄 Cargando motivos de pago desde inicializarGastosOperadores...');
  cargarMotivosPagoEnSelect(1);

  // Verificar que se cargaron correctamente
  const select = document.getElementById('gasto_motivo_1');
  if (select) {
    console.log(
      `✅ Verificación: Select tiene ${select.options.length} opciones después de cargar`
    );
  }

  console.log('✅ Gestión de gastos de operadores inicializada');
}

// Función para asegurar que los motivos de pago se carguen (llamar independientemente)
window.asegurarMotivosPagoCargados = function () {
  console.log('🔍 Verificando motivos de pago en select principal...');
  const select = document.getElementById('gasto_motivo_1');
  if (select) {
    console.log(`✅ Select encontrado, tiene ${select.options.length} opciones`);
    if (select.options.length <= 1) {
      // Solo tiene la opción por defecto, cargar los motivos
      console.log('🔄 Cargando motivos de pago en select principal...');
      cargarMotivosPagoEnSelect(1);
    } else {
      console.log('✅ Motivos de pago ya están cargados');
    }
  } else {
    console.warn('⚠️ Select gasto_motivo_1 no encontrado, reintentando...');
    // Reintentar después de un breve delay
    setTimeout(() => {
      const selectRetry = document.getElementById('gasto_motivo_1');
      if (selectRetry) {
        console.log('✅ Select encontrado en reintento, cargando motivos...');
        cargarMotivosPagoEnSelect(1);
      } else {
        console.error('❌ Select gasto_motivo_1 no encontrado después de reintentar');
      }
    }, 300);
  }
};

// Función para esperar a que configuracionManager esté disponible
function esperarConfiguracionManager() {
  let intentos = 0;
  const maxIntentos = 20;

  const verificar = () => {
    intentos++;

    if (
      window.configuracionManager &&
      typeof window.configuracionManager.getAllOperadores === 'function'
    ) {
      console.log('✅ configuracionManager disponible, inicializando gastos de operadores...');
      inicializarGastosOperadores();
    } else if (intentos < maxIntentos) {
      console.log(`⏳ Esperando configuracionManager... intento ${intentos}/${maxIntentos}`);
      setTimeout(verificar, 500);
    } else {
      console.warn(
        '⚠️ configuracionManager no disponible después de 10 segundos, cargando desde localStorage...'
      );
      inicializarGastosOperadores();
    }
  };

  verificar();
}

// Función para cargar motivos de pago de forma más agresiva
function _cargarMotivosPagoInicial() {
  const select = document.getElementById('gasto_motivo_1');
  if (select) {
    // Verificar si ya tiene opciones cargadas
    if (select.options.length <= 1) {
      console.log('🔄 Cargando motivos de pago en inicialización...');
      cargarMotivosPagoEnSelect(1);
      return true;
    }
    console.log('✅ Motivos de pago ya cargados');
    return true;
  }
  return false;
}

// Función para inicializar motivos de pago de forma robusta
function inicializarMotivosPago() {
  console.log('🔄 Inicializando motivos de pago...');

  // Intentar múltiples veces para asegurar que se carguen
  let intentos = 0;
  const maxIntentos = 10;

  const intentarCargar = () => {
    intentos++;
    const select = document.getElementById('gasto_motivo_1');

    if (select) {
      if (select.options.length <= 1) {
        console.log(`🔄 Intento ${intentos}: Cargando motivos de pago...`);
        cargarMotivosPagoEnSelect(1);

        // Verificar que se cargaron correctamente
        setTimeout(() => {
          const selectVerificado = document.getElementById('gasto_motivo_1');
          if (selectVerificado && selectVerificado.options.length > 1) {
            console.log(
              `✅ Motivos de pago cargados correctamente: ${selectVerificado.options.length} opciones`
            );
          } else if (intentos < maxIntentos) {
            console.warn(`⚠️ Motivos no se cargaron en intento ${intentos}, reintentando...`);
            intentarCargar();
          }
        }, 200);
      } else {
        console.log(`✅ Motivos de pago ya están cargados: ${select.options.length} opciones`);
      }
    } else if (intentos < maxIntentos) {
      console.log(`⏳ Intento ${intentos}: Select no encontrado, esperando...`);
      setTimeout(intentarCargar, 300);
    } else {
      console.error('❌ Select gasto_motivo_1 no encontrado después de varios intentos');
    }
  };

  intentarCargar();
}

// Inicializar cuando se carga la página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando carga de gestión de gastos de operadores...');

    // Cargar motivos de pago inmediatamente (no depende de configuracionManager)
    setTimeout(() => {
      inicializarMotivosPago();
    }, 100);

    // También intentar después de un delay adicional por si el DOM aún no está completamente listo
    setTimeout(() => {
      inicializarMotivosPago();
    }, 500);

    esperarConfiguracionManager();
  });
} else {
  // DOM ya está listo
  console.log('🚀 DOM ya está listo, cargando motivos de pago...');
  setTimeout(() => {
    inicializarMotivosPago();
  }, 100);
  esperarConfiguracionManager();
}

// También intentar cuando la ventana esté completamente cargada
window.addEventListener('load', () => {
  setTimeout(() => {
    inicializarMotivosPago();
  }, 200);
});

// Recargar operadores cuando se regresa de configuración
window.addEventListener('focus', () => {
  if (window.configuracionManager) {
    console.log('🔄 Ventana recuperó foco, recargando operadores...');
    forzarRecargaOperadores();
  }
});

// Recargar operadores cuando cambian los datos en localStorage
window.addEventListener('storage', e => {
  if (e.key === 'erp_operadores') {
    console.log('🔄 Datos de operadores cambiaron, recargando...');
    forzarRecargaOperadores();
  }
});

// Función para limpiar gastos duplicados de tráfico
function limpiarGastosDuplicadosTrafico() {
  try {
    console.log('🧹 Limpiando gastos duplicados de tráfico...');

    const gastosExistentes = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');
    const gastosOriginales = gastosExistentes.length;

    // Agrupar por número de registro y origen
    const gastosPorRegistro = {};
    gastosExistentes.forEach(gasto => {
      if (gasto.origen === 'trafico') {
        const key = gasto.numeroRegistro;
        if (!gastosPorRegistro[key]) {
          gastosPorRegistro[key] = [];
        }
        gastosPorRegistro[key].push(gasto);
      }
    });

    // Eliminar duplicados, manteniendo solo el más reciente
    const gastosSinDuplicados = gastosExistentes.filter(gasto => {
      if (gasto.origen !== 'trafico') {
        return true; // Mantener gastos que no son de tráfico
      }

      const gastosDelRegistro = gastosPorRegistro[gasto.numeroRegistro];
      if (gastosDelRegistro.length === 1) {
        return true; // No hay duplicados
      }

      // Mantener solo el más reciente (primero en el array)
      return gasto === gastosDelRegistro[0];
    });

    // Guardar gastos sin duplicados
    localStorage.setItem('erp_operadores_gastos', JSON.stringify(gastosSinDuplicados));

    const gastosEliminados = gastosOriginales - gastosSinDuplicados.length;
    console.log(`✅ Gastos duplicados eliminados: ${gastosEliminados}`);

    return gastosEliminados;
  } catch (error) {
    console.error('❌ Error limpiando gastos duplicados:', error);
    return 0;
  }
}

// Función para forzar recarga de operadores
function forzarRecargaOperadores() {
  console.log('🔄 Forzando recarga de operadores...');
  cargarOperadoresEnGastos();

  // También recargar filas adicionales si existen
  for (let i = 2; i <= contadorGastosOperadores; i++) {
    cargarOperadoresEnSelect(i);
    cargarMotivosPagoEnSelect(i);
  }

  console.log('✅ Recarga completada');
}

// Exponer funciones globalmente
window.agregarGastoOperador = agregarGastoOperador;
window.eliminarGastoOperador = eliminarGastoOperador;
window.obtenerGastosOperadores = obtenerGastosOperadores;
window.validarGastosOperadores = validarGastosOperadores;
window.limpiarGastosOperadores = limpiarGastosOperadores;
window.refrescarListasOperadores = refrescarListasOperadores;
window.cargarOperadoresEnGastos = cargarOperadoresEnGastos;
window.debugOperadores = debugOperadores;
window.forzarRecargaOperadores = forzarRecargaOperadores;
window.cargarMotivosPagoEnSelect = cargarMotivosPagoEnSelect;
window.guardarGastosOperadoresEnSistema = guardarGastosOperadoresEnSistema;
window.limpiarGastosDuplicadosTrafico = limpiarGastosDuplicadosTrafico;

// Función alternativa para ejecutar desde consola si la anterior no está disponible
// Función para recuperar gastos de tráfico eliminados accidentalmente
window.recuperarGastosTrafico = function () {
  try {
    console.log('🔄 Intentando recuperar gastos de tráfico...');

    // Verificar si hay backup en erp_shared_data
    const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
    const gastosActuales = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');

    if (sharedData.trafico) {
      console.log('📋 Datos de tráfico encontrados en erp_shared_data');

      // Buscar registros de tráfico que puedan tener gastos
      Object.keys(sharedData.trafico).forEach(registroId => {
        const registroTrafico = sharedData.trafico[registroId];
        console.log(`🔍 Revisando registro ${registroId}:`, registroTrafico);

        // Si el registro tiene información de gastos, recrear el gasto
        if (registroTrafico.gastosOperadores && Array.isArray(registroTrafico.gastosOperadores)) {
          registroTrafico.gastosOperadores.forEach(gasto => {
            const gastoData = {
              id: Date.now() + Math.random(),
              fechaCreacion: new Date().toISOString(),
              fecha: registroTrafico.fechaEnvio || new Date().toISOString().split('T')[0],
              operadorId: null,
              operadorNombre: gasto.operadorNombre || gasto.operador, // Nombre completo del operador
              operadorLicencia: gasto.operadorLicencia || '', // Licencia del operador (separada)
              tractocamionId: null,
              tractocamionInfo: `${registroTrafico.economico || ''} - ${registroTrafico.placas || ''}`, // Información completa (para compatibilidad)
              tractocamionEconomico: registroTrafico.economico || '', // Número económico del tractocamion
              tractocamionPlacas: registroTrafico.placas || '', // Placas del tractocamion (separadas)
              tipoGasto: gasto.motivo,
              monto: gasto.monto,
              numeroRegistro: registroId,
              concepto: `Gasto de tráfico - ${gasto.motivo}`,
              evidencia: gasto.evidencia
                ? [
                  {
                    nombre: gasto.evidencia,
                    tamaño: 0,
                    tipo: 'application/octet-stream',
                    fecha: new Date().toISOString()
                  }
                ]
                : [],
              observaciones: `Registrado desde tráfico - Registro: ${registroId}`,
              origen: 'trafico'
            };

            gastosActuales.unshift(gastoData);
            console.log(`✅ Gasto recuperado para registro ${registroId}:`, gastoData);
          });
        }
      });

      // Guardar gastos recuperados
      localStorage.setItem('erp_operadores_gastos', JSON.stringify(gastosActuales));
      console.log(
        `✅ Gastos de tráfico recuperados: ${gastosActuales.length - (JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]').length - gastosActuales.length)}`
      );
    } else {
      console.log('❌ No se encontraron datos de tráfico para recuperar');
    }

    return true;
  } catch (error) {
    console.error('❌ Error recuperando gastos de tráfico:', error);
    return false;
  }
};

// Función para sincronizar gastos de localStorage a Firebase
window.sincronizarGastosAFirebase = async function () {
  try {
    console.log('🔄 Sincronizando gastos de localStorage a Firebase...');

    // Obtener gastos de localStorage
    const gastosLocal = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');
    console.log(`📋 Gastos en localStorage: ${gastosLocal.length}`);

    if (gastosLocal.length === 0) {
      console.log('✅ No hay gastos para sincronizar');
      return { sincronizados: 0, errores: 0 };
    }

    // Verificar que el repositorio esté disponible
    if (!window.firebaseRepos?.operadores) {
      console.error('❌ Repositorio de Firebase no disponible');
      return { sincronizados: 0, errores: gastosLocal.length };
    }

    // Esperar a que el repositorio esté inicializado
    let attempts = 0;
    while (
      attempts < 10 &&
      (!window.firebaseRepos.operadores.db || !window.firebaseRepos.operadores.tenantId)
    ) {
      attempts++;
      console.log(`⏳ Esperando inicialización del repositorio... (${attempts}/10)`);
      await new Promise(resolve => setTimeout(resolve, 500));
      await window.firebaseRepos.operadores.init();
    }

    if (!window.firebaseRepos.operadores.db || !window.firebaseRepos.operadores.tenantId) {
      throw new Error('Repositorio no inicializado después de 5 segundos');
    }

    let sincronizados = 0;
    let errores = 0;

    // Sincronizar cada gasto
    for (const gasto of gastosLocal) {
      try {
        const gastoId = gasto.id
          ? `gasto_${gasto.id}`
          : `gasto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Asegurar que tenga el tipo correcto
        const gastoData = {
          ...gasto,
          tipo: 'gasto',
          fechaCreacion: gasto.fechaCreacion || new Date().toISOString()
        };

        console.log(`💾 Sincronizando gasto ${gastoId}...`);
        const resultado = await window.firebaseRepos.operadores.saveGasto(gastoId, gastoData);

        if (resultado) {
          sincronizados++;
          console.log(`✅ Gasto ${gastoId} sincronizado`);
        } else {
          errores++;
          console.warn(`⚠️ Gasto ${gastoId} no se pudo sincronizar`);
        }
      } catch (error) {
        errores++;
        console.error('❌ Error sincronizando gasto:', error);
      }
    }

    console.log(`✅ Sincronización completada: ${sincronizados} sincronizados, ${errores} errores`);
    return { sincronizados, errores };
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    return { sincronizados: 0, errores: gastosLocal.length };
  }
};

window.limpiarDuplicados = function () {
  try {
    console.log('🧹 Limpiando gastos duplicados de tráfico...');

    const gastosExistentes = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');
    const gastosOriginales = gastosExistentes.length;

    // Agrupar por número de registro y origen
    const gastosPorRegistro = {};
    gastosExistentes.forEach(gasto => {
      if (gasto.origen === 'trafico') {
        const key = gasto.numeroRegistro;
        if (!gastosPorRegistro[key]) {
          gastosPorRegistro[key] = [];
        }
        gastosPorRegistro[key].push(gasto);
      }
    });

    // Eliminar duplicados, manteniendo solo el más reciente
    const gastosSinDuplicados = gastosExistentes.filter(gasto => {
      if (gasto.origen !== 'trafico') {
        return true; // Mantener gastos que no son de tráfico
      }

      const gastosDelRegistro = gastosPorRegistro[gasto.numeroRegistro];
      if (gastosDelRegistro.length === 1) {
        return true; // No hay duplicados, mantener el gasto
      }

      // Si hay duplicados, mantener solo el más reciente
      // Ordenar por fecha de creación para asegurar que el primero es el más reciente
      gastosDelRegistro.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
      return gasto === gastosDelRegistro[0];
    });

    // Guardar gastos sin duplicados
    localStorage.setItem('erp_operadores_gastos', JSON.stringify(gastosSinDuplicados));

    const gastosEliminados = gastosOriginales - gastosSinDuplicados.length;
    console.log(`✅ Gastos duplicados eliminados: ${gastosEliminados}`);

    return gastosEliminados;
  } catch (error) {
    console.error('❌ Error limpiando gastos duplicados:', error);
    return 0;
  }
};
