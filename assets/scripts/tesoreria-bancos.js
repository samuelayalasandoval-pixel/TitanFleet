// Función para cargar bancos desde la configuración
async function cargarBancos() {
  let bancos = [];

  // Intentar cargar desde Firebase
  if (window.firebaseDb && window.fs) {
    try {
      const cuentasBancariasDocRef = window.fs.doc(
        window.firebaseDb,
        'configuracion',
        'cuentas_bancarias'
      );
      const cuentasBancariasDoc = await window.fs.getDoc(cuentasBancariasDocRef);

      if (cuentasBancariasDoc.exists()) {
        const data = cuentasBancariasDoc.data();
        if (data.cuentasBancarias && Array.isArray(data.cuentasBancarias)) {
          bancos = data.cuentasBancarias;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando bancos desde Firebase:', error);
    }
  }

  // Si no hay datos en Firebase, intentar desde localStorage
  if (bancos.length === 0 && window.configuracionManager) {
    bancos = window.configuracionManager.getCuentasBancarias() || [];
  }

  // Obtener lista única de bancos
  const bancosUnicos = [...new Set(bancos.map(b => b.banco).filter(b => b))];

  // Llenar los selects de banco
  const selectBancoOrigen = document.getElementById('bancoorigen');
  const selectBancoOrigenSolicitud = document.getElementById('bancoOrigenSolicitud');
  const selectFiltroBancoOrigen = document.getElementById('filtroBancoOrigen');
  const selectFiltroBancoEstadoCuenta = document.getElementById('filtroBancoEstadoCuenta');

  if (selectBancoOrigen) {
    bancosUnicos.forEach(banco => {
      const option = document.createElement('option');
      option.value = banco;
      option.textContent = banco;
      selectBancoOrigen.appendChild(option);
    });
  }

  if (selectBancoOrigenSolicitud) {
    bancosUnicos.forEach(banco => {
      const option = document.createElement('option');
      option.value = banco;
      option.textContent = banco;
      selectBancoOrigenSolicitud.appendChild(option);
    });
  }

  if (selectFiltroBancoOrigen) {
    bancosUnicos.forEach(banco => {
      const option = document.createElement('option');
      option.value = banco;
      option.textContent = banco;
      selectFiltroBancoOrigen.appendChild(option);
    });
  }

  if (selectFiltroBancoEstadoCuenta) {
    bancosUnicos.forEach(banco => {
      const option = document.createElement('option');
      option.value = banco;
      option.textContent = banco;
      selectFiltroBancoEstadoCuenta.appendChild(option);
    });
  }

  return bancos;
}

// Función para actualizar las cuentas de origen en el filtro
async function actualizarCuentasOrigenFiltro() {
  const selectBanco = document.getElementById('filtroBancoOrigen');
  const selectCuenta = document.getElementById('filtroCuentaOrigen');

  if (!selectBanco || !selectCuenta) {
    return;
  }

  const bancoSeleccionado = selectBanco.value;
  selectCuenta.innerHTML = '<option value="">Todas las cuentas</option>';

  if (!bancoSeleccionado) {
    return;
  }

  // Cargar todas las cuentas bancarias
  let cuentasBancarias = [];

  if (window.firebaseDb && window.fs) {
    try {
      const cuentasBancariasDocRef = window.fs.doc(
        window.firebaseDb,
        'configuracion',
        'cuentas_bancarias'
      );
      const cuentasBancariasDoc = await window.fs.getDoc(cuentasBancariasDocRef);

      if (cuentasBancariasDoc.exists()) {
        const data = cuentasBancariasDoc.data();
        if (data.cuentasBancarias && Array.isArray(data.cuentasBancarias)) {
          cuentasBancarias = data.cuentasBancarias;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando cuentas desde Firebase:', error);
    }
  }

  if (cuentasBancarias.length === 0 && window.configuracionManager) {
    cuentasBancarias = window.configuracionManager.getCuentasBancarias() || [];
  }

  // Filtrar cuentas del banco seleccionado
  const cuentasDelBanco = cuentasBancarias.filter(c => c.banco === bancoSeleccionado);

  if (cuentasDelBanco.length === 0) {
    return;
  }

  // Llenar el select de cuentas
  cuentasDelBanco.forEach(cuenta => {
    const option = document.createElement('option');
    option.value = cuenta.numeroCuenta || '';
    option.textContent = cuenta.numeroCuenta || 'Sin número de cuenta';
    selectCuenta.appendChild(option);
  });
}

// Función para actualizar las cuentas de origen según el banco seleccionado (formulario de movimientos)
async function actualizarCuentasOrigen() {
  const selectBanco = document.getElementById('bancoorigen');
  const selectCuenta = document.getElementById('cuentaorigen');

  if (!selectBanco || !selectCuenta) {
    return;
  }

  const bancoSeleccionado = selectBanco.value;
  selectCuenta.innerHTML = '<option value="">Seleccione una cuenta...</option>';

  if (!bancoSeleccionado) {
    selectCuenta.innerHTML = '<option value="">Primero seleccione un banco</option>';
    return;
  }

  // Cargar todas las cuentas bancarias
  let cuentasBancarias = [];

  if (window.firebaseDb && window.fs) {
    try {
      const cuentasBancariasDocRef = window.fs.doc(
        window.firebaseDb,
        'configuracion',
        'cuentas_bancarias'
      );
      const cuentasBancariasDoc = await window.fs.getDoc(cuentasBancariasDocRef);

      if (cuentasBancariasDoc.exists()) {
        const data = cuentasBancariasDoc.data();
        if (data.cuentasBancarias && Array.isArray(data.cuentasBancarias)) {
          cuentasBancarias = data.cuentasBancarias;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando cuentas desde Firebase:', error);
    }
  }

  if (cuentasBancarias.length === 0 && window.configuracionManager) {
    cuentasBancarias = window.configuracionManager.getCuentasBancarias() || [];
  }

  // Filtrar cuentas del banco seleccionado
  const cuentasDelBanco = cuentasBancarias.filter(c => c.banco === bancoSeleccionado);

  if (cuentasDelBanco.length === 0) {
    selectCuenta.innerHTML = '<option value="">No hay cuentas para este banco</option>';
    return;
  }

  // Llenar el select de cuentas
  cuentasDelBanco.forEach(cuenta => {
    const option = document.createElement('option');
    option.value = cuenta.numeroCuenta || '';
    option.textContent = cuenta.numeroCuenta || 'Sin número de cuenta';
    selectCuenta.appendChild(option);
  });
}

// Función para actualizar las etiquetas bancarias según el tipo de movimiento (Ingreso/Egreso)
async function actualizarEtiquetasBancarias() {
  console.log('🔄 actualizarEtiquetasBancarias llamada');
  const tipoMovimiento = document.getElementById('ingresoegreso')?.value || '';
  console.log('📋 Tipo de movimiento seleccionado:', tipoMovimiento);
  const ayudaBancaria = document.getElementById('ayudaBancaria');
  const _textoAyuda = document.getElementById('textoAyudaBancaria');

  // Labels
  const labelBancoOrigen = document.getElementById('labelBancoOrigen');
  const labelCuentaOrigen = document.getElementById('labelCuentaOrigen');
  const labelBancoDestino = document.getElementById('labelBancoDestino');
  const labelCuentaDestino = document.getElementById('labelCuentaDestino');

  // Ayudas contextuales
  const ayudaBancoOrigen = document.getElementById('ayudaBancoOrigen');
  const ayudaCuentaOrigen = document.getElementById('ayudaCuentaOrigen');
  const ayudaBancoDestino = document.getElementById('ayudaBancoDestino');
  const ayudaCuentaDestino = document.getElementById('ayudaCuentaDestino');

  // Inputs/Selects
  const inputBancoDestino = document.getElementById('bancodestino');
  const inputCuentaDestino = document.getElementById('cuentadestino');

  if (tipoMovimiento === 'ingreso') {
    // Para INGRESO: Dinero viene DE afuera HACIA nosotros
    if (labelBancoOrigen) {
      labelBancoOrigen.innerHTML =
        '<i class="fas fa-university text-primary"></i> <span class="text-primary fw-bold">Banco del Cliente/Proveedor</span> <small>(quien nos paga)</small>';
    }
    if (labelCuentaOrigen) {
      labelCuentaOrigen.innerHTML =
        '<i class="fas fa-credit-card text-primary"></i> <span class="text-primary fw-bold">Cuenta del Cliente/Proveedor</span> <small>(quien nos paga)</small>';
    }
    if (labelBancoDestino) {
      labelBancoDestino.innerHTML =
        '<i class="fas fa-university text-success"></i> <span class="text-success fw-bold">Nuestro Banco</span> <small>(donde recibimos)</small>';
    }
    if (labelCuentaDestino) {
      labelCuentaDestino.innerHTML =
        '<i class="fas fa-credit-card text-success"></i> <span class="text-success fw-bold">Nuestra Cuenta</span> <small>(donde recibimos)</small>';
    }

    // Actualizar placeholders
    if (inputBancoDestino) {
      inputBancoDestino.placeholder = 'Seleccione nuestro banco donde recibimos...';
    }
    if (inputCuentaDestino) {
      inputCuentaDestino.placeholder = 'Seleccione nuestra cuenta donde recibimos...';
    }

    // Actualizar ayudas contextuales
    if (ayudaBancoOrigen) {
      ayudaBancoOrigen.textContent = 'Banco del cliente o proveedor que nos está pagando';
    }
    if (ayudaCuentaOrigen) {
      ayudaCuentaOrigen.textContent = 'Cuenta del cliente o proveedor que nos está pagando';
    }
    if (ayudaBancoDestino) {
      ayudaBancoDestino.textContent = 'Seleccione nuestro banco donde se recibirá el dinero';
    }
    if (ayudaCuentaDestino) {
      ayudaCuentaDestino.textContent = 'Seleccione nuestra cuenta donde se recibirá el dinero';
    }

    // Ocultar ayuda general
    if (ayudaBancaria) {
      ayudaBancaria.style.display = 'none';
    }

    // Cambiar banco destino a select si no lo es ya
    if (inputBancoDestino && inputBancoDestino.tagName === 'INPUT') {
      // Convertir a select para nuestros bancos
      const _bancoDestinoValue = inputBancoDestino.value;
      const _bancoDestinoParent = inputBancoDestino.parentElement;
      const _bancoDestinoLabel = labelBancoDestino;

      // Crear nuevo select
      const selectBancoDestino = document.createElement('select');
      selectBancoDestino.className = 'form-select';
      selectBancoDestino.id = 'bancodestino';
      selectBancoDestino.required = true;
      selectBancoDestino.innerHTML = '<option value="">Seleccione nuestro banco...</option>';
      selectBancoDestino.setAttribute('onchange', 'actualizarCuentasDestino()');

      // Reemplazar input por select
      inputBancoDestino.replaceWith(selectBancoDestino);

      // Cargar nuestros bancos en el select
      cargarBancosEnSelect('bancodestino', true);
    }

    // Cambiar cuenta destino a select si no lo es ya
    if (inputCuentaDestino && inputCuentaDestino.tagName === 'INPUT') {
      const _cuentaDestinoValue = inputCuentaDestino.value;
      const _cuentaDestinoParent = inputCuentaDestino.parentElement;

      // Crear nuevo select
      const selectCuentaDestino = document.createElement('select');
      selectCuentaDestino.className = 'form-select';
      selectCuentaDestino.id = 'cuentadestino';
      selectCuentaDestino.required = true;
      selectCuentaDestino.innerHTML = '<option value="">Primero seleccione nuestro banco</option>';

      // Reemplazar input por select
      inputCuentaDestino.replaceWith(selectCuentaDestino);
    }

    // Cambiar banco origen a input de texto (banco del proveedor/cliente)
    const bancoOrigenElementIngreso = document.getElementById('bancoorigen');
    console.log('🔍 Verificando banco origen para INGRESO:', {
      existe: Boolean(bancoOrigenElementIngreso),
      tagName: bancoOrigenElementIngreso?.tagName,
      id: bancoOrigenElementIngreso?.id
    });

    if (bancoOrigenElementIngreso && bancoOrigenElementIngreso.tagName === 'SELECT') {
      const bancoOrigenValue = bancoOrigenElementIngreso.value;
      console.log(
        '🔄 Convirtiendo banco origen de SELECT a INPUT (valor actual:',
        bancoOrigenValue,
        ')'
      );

      // Crear nuevo input
      const inputBancoOrigen = document.createElement('input');
      inputBancoOrigen.type = 'text';
      inputBancoOrigen.className = 'form-control';
      inputBancoOrigen.id = 'bancoorigen';
      inputBancoOrigen.required = true;
      inputBancoOrigen.placeholder = 'Ingrese el banco del cliente/proveedor que nos paga';

      // Reemplazar select por input
      bancoOrigenElementIngreso.replaceWith(inputBancoOrigen);
      console.log('✅ Select reemplazado por input');

      // Cambiar cuenta origen también a input
      const selectCuentaOrigen = document.getElementById('cuentaorigen');
      if (selectCuentaOrigen) {
        const _cuentaOrigenValue = selectCuentaOrigen.value;
        console.log('🔄 Convirtiendo cuenta origen de SELECT a INPUT');

        const inputCuentaOrigen = document.createElement('input');
        inputCuentaOrigen.type = 'text';
        inputCuentaOrigen.className = 'form-control';
        inputCuentaOrigen.id = 'cuentaorigen';
        inputCuentaOrigen.required = true;
        inputCuentaOrigen.placeholder = 'Ingrese la cuenta del cliente/proveedor que nos paga';

        selectCuentaOrigen.replaceWith(inputCuentaOrigen);
        console.log('✅ Cuenta origen convertida a input');
      }
    } else if (bancoOrigenElementIngreso && bancoOrigenElementIngreso.tagName === 'INPUT') {
      console.log('ℹ️ Banco origen ya es INPUT, no se necesita cambiar');
    } else {
      console.warn('⚠️ Elemento bancoorigen no encontrado o no es SELECT/INPUT');
    }
  } else if (tipoMovimiento === 'egreso') {
    // Para EGRESO: Dinero sale DE nosotros HACIA afuera
    if (labelBancoOrigen) {
      labelBancoOrigen.innerHTML =
        '<i class="fas fa-university text-danger"></i> <span class="text-danger fw-bold">Nuestro Banco</span> <small>(de donde sale)</small>';
    }
    if (labelCuentaOrigen) {
      labelCuentaOrigen.innerHTML =
        '<i class="fas fa-credit-card text-danger"></i> <span class="text-danger fw-bold">Nuestra Cuenta</span> <small>(de donde sale)</small>';
    }
    if (labelBancoDestino) {
      labelBancoDestino.innerHTML =
        '<i class="fas fa-university text-warning"></i> <span class="text-warning fw-bold">Banco del Proveedor/Cliente</span> <small>(a quien pagamos)</small>';
    }
    if (labelCuentaDestino) {
      labelCuentaDestino.innerHTML =
        '<i class="fas fa-credit-card text-warning"></i> <span class="text-warning fw-bold">Cuenta del Proveedor/Cliente</span> <small>(a quien pagamos)</small>';
    }

    // Actualizar placeholders
    if (inputBancoDestino) {
      inputBancoDestino.placeholder = 'Ingrese el banco del proveedor/cliente a quien pagamos...';
    }
    if (inputCuentaDestino) {
      inputCuentaDestino.placeholder = 'Ingrese la cuenta del proveedor/cliente a quien pagamos...';
    }

    // Actualizar ayudas contextuales
    if (ayudaBancoOrigen) {
      ayudaBancoOrigen.textContent = 'Seleccione nuestro banco de donde saldrá el dinero';
    }
    if (ayudaCuentaOrigen) {
      ayudaCuentaOrigen.textContent = 'Seleccione nuestra cuenta de donde saldrá el dinero';
    }
    if (ayudaBancoDestino) {
      ayudaBancoDestino.textContent = 'Banco del proveedor o cliente a quien estamos pagando';
    }
    if (ayudaCuentaDestino) {
      ayudaCuentaDestino.textContent = 'Cuenta del proveedor o cliente a quien estamos pagando';
    }

    // Ocultar ayuda general
    if (ayudaBancaria) {
      ayudaBancaria.style.display = 'none';
    }

    // Asegurar que banco origen sea select (nuestros bancos) para EGRESO
    const bancoOrigenElement = document.getElementById('bancoorigen');
    console.log('🔍 [EGRESO] Verificando banco origen:', {
      existe: Boolean(bancoOrigenElement),
      tagName: bancoOrigenElement?.tagName,
      id: bancoOrigenElement?.id,
      tipoMovimiento: tipoMovimiento,
      opciones: bancoOrigenElement?.querySelectorAll('option')?.length
    });

    if (bancoOrigenElement) {
      // Si es INPUT, convertirlo a SELECT
      if (bancoOrigenElement.tagName === 'INPUT') {
        const bancoOrigenValue = bancoOrigenElement.value;
        console.log(
          '🔄 [EGRESO] Convirtiendo banco origen de INPUT a SELECT (valor actual:',
          bancoOrigenValue,
          ')'
        );

        // Crear nuevo select
        const selectBancoOrigen = document.createElement('select');
        selectBancoOrigen.className = 'form-select';
        selectBancoOrigen.id = 'bancoorigen';
        selectBancoOrigen.required = true;
        selectBancoOrigen.innerHTML = '<option value="">Seleccione nuestro banco...</option>';
        selectBancoOrigen.setAttribute('data-action', 'actualizarCuentasOrigen');

        // Reemplazar input por select
        bancoOrigenElement.replaceWith(selectBancoOrigen);
        console.log('✅ [EGRESO] Input reemplazado por select');

        // Cargar nuestros bancos en el select
        try {
          await cargarBancosEnSelect('bancoorigen', true);
          console.log('✅ [EGRESO] Bancos cargados en select de banco origen');
        } catch (error) {
          console.error('❌ [EGRESO] Error cargando bancos:', error);
        }

        // Agregar event handler para actualizar cuentas cuando se seleccione un banco
        const nuevoSelect = document.getElementById('bancoorigen');
        if (nuevoSelect) {
          nuevoSelect.addEventListener('change', async () => {
            console.log('🔄 [EGRESO] Banco origen cambiado, actualizando cuentas...');
            if (typeof window.actualizarCuentasOrigen === 'function') {
              await window.actualizarCuentasOrigen();
            } else {
              console.warn('⚠️ actualizarCuentasOrigen no está disponible');
            }
          });
          nuevoSelect.setAttribute('data-action', 'actualizarCuentasOrigen');
          console.log('✅ [EGRESO] Event handler agregado al select de banco origen');
        }
      } else if (bancoOrigenElement.tagName === 'SELECT') {
        // Si ya es SELECT, asegurar que tenga los bancos cargados
        console.log('ℹ️ [EGRESO] Banco origen ya es SELECT, verificando que tenga bancos...');
        const opciones = bancoOrigenElement.querySelectorAll('option');
        console.log(`📊 [EGRESO] Opciones actuales: ${opciones.length}`);

        // Limpiar y recargar bancos siempre para asegurar que estén actualizados
        bancoOrigenElement.innerHTML = '<option value="">Seleccione nuestro banco...</option>';
        try {
          await cargarBancosEnSelect('bancoorigen', true);
          console.log('✅ [EGRESO] Bancos recargados en select de banco origen');
        } catch (error) {
          console.error('❌ [EGRESO] Error recargando bancos:', error);
        }

        // Asegurar que tenga el event handler
        if (!bancoOrigenElement.hasAttribute('data-handler-attached')) {
          bancoOrigenElement.addEventListener('change', async () => {
            console.log('🔄 [EGRESO] Banco origen cambiado, actualizando cuentas...');
            if (typeof window.actualizarCuentasOrigen === 'function') {
              await window.actualizarCuentasOrigen();
            } else {
              console.warn('⚠️ actualizarCuentasOrigen no está disponible');
            }
          });
          bancoOrigenElement.setAttribute('data-action', 'actualizarCuentasOrigen');
          bancoOrigenElement.setAttribute('data-handler-attached', 'true');
          console.log('✅ [EGRESO] Event handler agregado al select existente');
        } else {
          console.log('ℹ️ [EGRESO] Select ya tiene handler configurado');
        }
      }
    } else {
      console.warn('⚠️ [EGRESO] Elemento bancoorigen no encontrado en el DOM');
    }

    // Asegurar que cuenta origen sea select (nuestras cuentas)
    const inputCuentaOrigen = document.getElementById('cuentaorigen');
    if (inputCuentaOrigen && inputCuentaOrigen.tagName === 'INPUT') {
      const _cuentaOrigenValue = inputCuentaOrigen.value;

      const selectCuentaOrigen = document.createElement('select');
      selectCuentaOrigen.className = 'form-select';
      selectCuentaOrigen.id = 'cuentaorigen';
      selectCuentaOrigen.required = true;
      selectCuentaOrigen.innerHTML = '<option value="">Primero seleccione nuestro banco</option>';

      inputCuentaOrigen.replaceWith(selectCuentaOrigen);
      console.log('✅ Cuenta origen convertida a select');
    }

    // Cambiar banco destino a input de texto (banco del proveedor/cliente)
    const selectBancoDestino = document.getElementById('bancodestino');
    if (selectBancoDestino && selectBancoDestino.tagName === 'SELECT') {
      const _bancoDestinoValue = selectBancoDestino.value;

      const inputBancoDestino = document.createElement('input');
      inputBancoDestino.type = 'text';
      inputBancoDestino.className = 'form-control';
      inputBancoDestino.id = 'bancodestino';
      inputBancoDestino.required = true;
      inputBancoDestino.placeholder = 'Ingrese el banco del proveedor/cliente a quien pagamos';

      selectBancoDestino.replaceWith(inputBancoDestino);

      // Cambiar cuenta destino también a input
      const selectCuentaDestino = document.getElementById('cuentadestino');
      if (selectCuentaDestino) {
        const _cuentaDestinoValue = selectCuentaDestino.value;

        const inputCuentaDestino = document.createElement('input');
        inputCuentaDestino.type = 'text';
        inputCuentaDestino.className = 'form-control';
        inputCuentaDestino.id = 'cuentadestino';
        inputCuentaDestino.required = true;
        inputCuentaDestino.placeholder = 'Ingrese la cuenta del proveedor/cliente a quien pagamos';

        selectCuentaDestino.replaceWith(inputCuentaDestino);
      }
    }
  } else {
    // Sin selección, ocultar ayuda y restaurar etiquetas por defecto
    if (ayudaBancaria) {
      ayudaBancaria.style.display = 'none';
    }

    if (labelBancoOrigen) {
      labelBancoOrigen.innerHTML = '<i class="fas fa-university"></i> Banco Origen';
    }
    if (labelCuentaOrigen) {
      labelCuentaOrigen.innerHTML = '<i class="fas fa-credit-card"></i> Cuenta Origen';
    }
    if (labelBancoDestino) {
      labelBancoDestino.innerHTML = '<i class="fas fa-university"></i> Banco Destino';
    }
    if (labelCuentaDestino) {
      labelCuentaDestino.innerHTML = '<i class="fas fa-credit-card"></i> Cuenta Destino';
    }

    // Limpiar ayudas contextuales
    if (ayudaBancoOrigen) {
      ayudaBancoOrigen.textContent = '';
    }
    if (ayudaCuentaOrigen) {
      ayudaCuentaOrigen.textContent = '';
    }
    if (ayudaBancoDestino) {
      ayudaBancoDestino.textContent = '';
    }
    if (ayudaCuentaDestino) {
      ayudaCuentaDestino.textContent = '';
    }
  }
}

// Función para cargar bancos en un select
async function cargarBancosEnSelect(selectId, _soloNuestros = true) {
  const select = document.getElementById(selectId);
  if (!select) {
    return;
  }

  let cuentasBancarias = [];

  if (window.firebaseDb && window.fs) {
    try {
      const cuentasBancariasDocRef = window.fs.doc(
        window.firebaseDb,
        'configuracion',
        'cuentas_bancarias'
      );
      const cuentasBancariasDoc = await window.fs.getDoc(cuentasBancariasDocRef);

      if (cuentasBancariasDoc.exists()) {
        const data = cuentasBancariasDoc.data();
        if (data.cuentasBancarias && Array.isArray(data.cuentasBancarias)) {
          cuentasBancarias = data.cuentasBancarias;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando cuentas desde Firebase:', error);
    }
  }

  if (cuentasBancarias.length === 0 && window.configuracionManager) {
    cuentasBancarias = window.configuracionManager.getCuentasBancarias() || [];
  }

  // Obtener bancos únicos
  const bancosSet = new Set();
  cuentasBancarias.forEach(c => {
    if (c.banco) {
      bancosSet.add(c.banco);
    }
  });

  const bancos = Array.from(bancosSet).sort();

  // Limpiar opciones actuales excepto la primera
  const primeraOpcion = select.querySelector('option');
  select.innerHTML = primeraOpcion
    ? primeraOpcion.outerHTML
    : '<option value="">Seleccione un banco...</option>';

  // Agregar bancos
  bancos.forEach(banco => {
    const option = document.createElement('option');
    option.value = banco;
    option.textContent = banco;
    select.appendChild(option);
  });
}

// Función para actualizar cuentas destino cuando se selecciona un banco destino
async function actualizarCuentasDestino() {
  const selectBanco = document.getElementById('bancodestino');
  const selectCuenta = document.getElementById('cuentadestino');

  if (!selectBanco || !selectCuenta) {
    return;
  }

  const bancoSeleccionado = selectBanco.value;
  selectCuenta.innerHTML = '<option value="">Seleccione una cuenta...</option>';

  if (!bancoSeleccionado) {
    selectCuenta.innerHTML = '<option value="">Primero seleccione un banco</option>';
    return;
  }

  // Cargar todas las cuentas bancarias
  let cuentasBancarias = [];

  if (window.firebaseDb && window.fs) {
    try {
      const cuentasBancariasDocRef = window.fs.doc(
        window.firebaseDb,
        'configuracion',
        'cuentas_bancarias'
      );
      const cuentasBancariasDoc = await window.fs.getDoc(cuentasBancariasDocRef);

      if (cuentasBancariasDoc.exists()) {
        const data = cuentasBancariasDoc.data();
        if (data.cuentasBancarias && Array.isArray(data.cuentasBancarias)) {
          cuentasBancarias = data.cuentasBancarias;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando cuentas desde Firebase:', error);
    }
  }

  if (cuentasBancarias.length === 0 && window.configuracionManager) {
    cuentasBancarias = window.configuracionManager.getCuentasBancarias() || [];
  }

  // Filtrar cuentas del banco seleccionado
  const cuentasDelBanco = cuentasBancarias.filter(c => c.banco === bancoSeleccionado);

  if (cuentasDelBanco.length === 0) {
    selectCuenta.innerHTML = '<option value="">No hay cuentas para este banco</option>';
    return;
  }

  // Llenar el select de cuentas
  cuentasDelBanco.forEach(cuenta => {
    const option = document.createElement('option');
    option.value = cuenta.numeroCuenta || '';
    option.textContent = cuenta.numeroCuenta || 'Sin número de cuenta';
    selectCuenta.appendChild(option);
  });
}

// Función para actualizar las cuentas de origen según el banco seleccionado (formulario de solicitudes)
async function actualizarCuentasOrigenSolicitud() {
  const selectBanco = document.getElementById('bancoOrigenSolicitud');
  const selectCuenta = document.getElementById('cuentaOrigenSolicitud');

  if (!selectBanco || !selectCuenta) {
    return;
  }

  const bancoSeleccionado = selectBanco.value;
  selectCuenta.innerHTML = '<option value="">Seleccione una cuenta...</option>';

  if (!bancoSeleccionado) {
    selectCuenta.innerHTML = '<option value="">Primero seleccione un banco</option>';
    return;
  }

  // Cargar todas las cuentas bancarias
  let cuentasBancarias = [];

  if (window.firebaseDb && window.fs) {
    try {
      const cuentasBancariasDocRef = window.fs.doc(
        window.firebaseDb,
        'configuracion',
        'cuentas_bancarias'
      );
      const cuentasBancariasDoc = await window.fs.getDoc(cuentasBancariasDocRef);

      if (cuentasBancariasDoc.exists()) {
        const data = cuentasBancariasDoc.data();
        if (data.cuentasBancarias && Array.isArray(data.cuentasBancarias)) {
          cuentasBancarias = data.cuentasBancarias;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando cuentas desde Firebase:', error);
    }
  }

  if (cuentasBancarias.length === 0 && window.configuracionManager) {
    cuentasBancarias = window.configuracionManager.getCuentasBancarias() || [];
  }

  // Filtrar cuentas del banco seleccionado
  const cuentasDelBanco = cuentasBancarias.filter(c => c.banco === bancoSeleccionado);

  if (cuentasDelBanco.length === 0) {
    selectCuenta.innerHTML = '<option value="">No hay cuentas para este banco</option>';
    return;
  }

  // Llenar el select de cuentas
  cuentasDelBanco.forEach(cuenta => {
    const option = document.createElement('option');
    option.value = cuenta.numeroCuenta || '';
    option.textContent = cuenta.numeroCuenta || 'Sin número de cuenta';
    selectCuenta.appendChild(option);
  });
}

// Exponer función globalmente
window.actualizarCuentasOrigenSolicitud = actualizarCuentasOrigenSolicitud;

// Función para actualizar las cuentas bancarias en el Estado de Cuenta con formato jerárquico
async function actualizarCuentasBancariasEstadoCuenta() {
  console.log('🔄 actualizarCuentasBancariasEstadoCuenta llamada');

  const selectBanco = document.getElementById('filtroBancoEstadoCuenta');
  const selectCuenta = document.getElementById('filtroCuentaEstadoCuenta');

  if (!selectBanco) {
    console.error('❌ Select filtroBancoEstadoCuenta no encontrado');
    return;
  }

  if (!selectCuenta) {
    console.error('❌ Select filtroCuentaEstadoCuenta no encontrado');
    return;
  }

  const bancoSeleccionado = selectBanco.value;
  console.log('📋 Banco seleccionado:', bancoSeleccionado);

  selectCuenta.innerHTML = '<option value="">Primero seleccione un banco</option>';

  if (!bancoSeleccionado || bancoSeleccionado === '') {
    console.log('ℹ️ No hay banco seleccionado');
    return;
  }

  // Cargar todas las cuentas bancarias
  let cuentasBancarias = [];

  // PRIORIDAD 1: Cargar desde Firebase
  if (window.firebaseDb && window.fs) {
    try {
      console.log('📊 Cargando cuentas bancarias desde Firebase...');
      const cuentasBancariasDocRef = window.fs.doc(
        window.firebaseDb,
        'configuracion',
        'cuentas_bancarias'
      );
      const cuentasBancariasDoc = await window.fs.getDoc(cuentasBancariasDocRef);

      if (cuentasBancariasDoc.exists()) {
        const data = cuentasBancariasDoc.data();
        if (data.cuentasBancarias && Array.isArray(data.cuentasBancarias)) {
          cuentasBancarias = data.cuentasBancarias;
          console.log(`✅ ${cuentasBancarias.length} cuentas bancarias cargadas desde Firebase`);
        }
      } else {
        console.warn('⚠️ Documento configuracion/cuentas_bancarias no existe en Firebase');
      }
    } catch (error) {
      console.warn('⚠️ Error cargando cuentas desde Firebase:', error);
    }
  }

  // PRIORIDAD 2: Cargar desde configuracionManager
  if (cuentasBancarias.length === 0 && window.configuracionManager) {
    console.log('📊 Intentando cargar cuentas desde configuracionManager...');
    cuentasBancarias = window.configuracionManager.getCuentasBancarias() || [];
    console.log(
      `✅ ${cuentasBancarias.length} cuentas bancarias cargadas desde configuracionManager`
    );
  }

  if (cuentasBancarias.length === 0) {
    console.warn('⚠️ No se encontraron cuentas bancarias');
    selectCuenta.innerHTML = '<option value="">No hay cuentas bancarias configuradas</option>';
    return;
  }

  // Filtrar cuentas del banco seleccionado
  const cuentasDelBanco = cuentasBancarias.filter(c => c.banco === bancoSeleccionado);
  console.log(
    `📋 ${cuentasDelBanco.length} cuenta(s) encontrada(s) para el banco "${bancoSeleccionado}"`
  );

  if (cuentasDelBanco.length === 0) {
    console.warn(`⚠️ No hay cuentas para el banco "${bancoSeleccionado}"`);
    selectCuenta.innerHTML = '<option value="">No hay cuentas para este banco</option>';
    return;
  }

  // Limpiar el select y agregar opción inicial
  selectCuenta.innerHTML = '<option value="">Seleccione una cuenta...</option>';

  // Agregar opción con el nombre del banco como título (deshabilitada)
  const optionBanco = document.createElement('option');
  optionBanco.value = '';
  optionBanco.textContent = bancoSeleccionado;
  optionBanco.disabled = true;
  optionBanco.style.fontWeight = 'bold';
  selectCuenta.appendChild(optionBanco);

  // Agregar las cuentas con formato jerárquico (indentadas con guiones)
  cuentasDelBanco.forEach(cuenta => {
    const option = document.createElement('option');
    option.value = cuenta.numeroCuenta || '';
    const numeroCuenta = cuenta.numeroCuenta || 'Sin número de cuenta';
    option.textContent = `    -${numeroCuenta}`;
    selectCuenta.appendChild(option);
  });

  console.log(`✅ ${cuentasDelBanco.length} cuenta(s) agregada(s) al select de cuentas`);
}

// Exponer funciones globalmente
window.actualizarCuentasBancariasEstadoCuenta = actualizarCuentasBancariasEstadoCuenta;
window.actualizarEtiquetasBancarias = actualizarEtiquetasBancarias;
window.actualizarCuentasOrigen = actualizarCuentasOrigen;
window.actualizarCuentasDestino = actualizarCuentasDestino;
window.actualizarCuentasOrigenFiltro = actualizarCuentasOrigenFiltro;
window.cargarBancosEnSelect = cargarBancosEnSelect;
window.cargarBancos = cargarBancos;

console.log('✅ Funciones de tesoreria-bancos expuestas globalmente:', {
  actualizarEtiquetasBancarias: typeof window.actualizarEtiquetasBancarias,
  actualizarCuentasOrigen: typeof window.actualizarCuentasOrigen,
  actualizarCuentasOrigenFiltro: typeof window.actualizarCuentasOrigenFiltro,
  actualizarCuentasDestino: typeof window.actualizarCuentasDestino,
  cargarBancosEnSelect: typeof window.cargarBancosEnSelect
});

// Función para configurar el listener del select de ingreso/egreso
function configurarListenerIngresoEgreso() {
  const selectIngresoEgreso = document.getElementById('ingresoegreso');
  if (!selectIngresoEgreso) {
    console.warn('⚠️ Select ingresoegreso no encontrado en el DOM');
    return false;
  }

  console.log('🔍 Select ingresoegreso encontrado, configurando listener...');

  // Verificar si ya tiene el handler directo
  if (selectIngresoEgreso.hasAttribute('data-handler-directo')) {
    console.log('ℹ️ Select ya tiene handler directo configurado');
    return true;
  }

  // Agregar listener directo
  const handler = async function (e) {
    console.log('🔄 Select ingresoegreso cambiado, valor:', selectIngresoEgreso.value);
    e.preventDefault();
    e.stopPropagation();

    if (typeof window.actualizarEtiquetasBancarias === 'function') {
      console.log('✅ Ejecutando actualizarEtiquetasBancarias...');
      try {
        await window.actualizarEtiquetasBancarias();
        console.log('✅ actualizarEtiquetasBancarias ejecutada correctamente');
      } catch (error) {
        console.error('❌ Error ejecutando actualizarEtiquetasBancarias:', error);
      }
    } else {
      console.error('❌ actualizarEtiquetasBancarias no está disponible');
      console.log('🔍 Funciones disponibles:', {
        actualizarEtiquetasBancarias: typeof window.actualizarEtiquetasBancarias,
        actualizarCuentasOrigen: typeof window.actualizarCuentasOrigen
      });
    }
  };

  selectIngresoEgreso.addEventListener('change', handler);
  selectIngresoEgreso.setAttribute('data-handler-directo', 'true');
  console.log('✅ Listener directo agregado al select ingresoegreso');
  return true;
}

// Función para esperar a que ConfiguracionManager esté disponible y cargar bancos
const esperarConfiguracionManager = () => {
  let intentos = 0;
  const maxIntentos = 20;

  const verificar = () => {
    intentos++;

    // Verificar si la clase ConfiguracionManager está disponible
    if (typeof ConfiguracionManager !== 'undefined') {
      // Inicializar configuracionManager si no existe
      if (!window.configuracionManager) {
        try {
          window.configuracionManager = new ConfiguracionManager();
          console.log('✅ ConfiguracionManager inicializado');
        } catch (error) {
          console.error('❌ Error al inicializar ConfiguracionManager:', error);
          return;
        }
      }

      // Esperar un momento para que Firebase esté listo
      const intentarCargar = () => {
        if (window.configuracionManager) {
          cargarBancos();
        } else {
          setTimeout(intentarCargar, 500);
        }
      };

      setTimeout(intentarCargar, 1000);
    } else if (intentos < maxIntentos) {
      console.log(`⏳ Esperando ConfiguracionManager... intento ${intentos}/${maxIntentos}`);
      setTimeout(verificar, 500);
    } else {
      console.warn('⚠️ ConfiguracionManager no disponible después de 10 segundos');
    }
  };

  verificar();
};

// Cargar bancos cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOMContentLoaded en tesoreria-bancos.js');

  // Configurar listener del select de ingreso/egreso
  let configurado = configurarListenerIngresoEgreso();
  console.log('📊 Resultado de configurarListenerIngresoEgreso:', configurado);

  // También intentar después de delays para asegurar que el DOM esté completamente cargado
  setTimeout(() => {
    configurado = configurarListenerIngresoEgreso();
    console.log('📊 Resultado de configurarListenerIngresoEgreso (500ms):', configurado);
  }, 500);

  setTimeout(() => {
    configurado = configurarListenerIngresoEgreso();
    console.log('📊 Resultado de configurarListenerIngresoEgreso (1000ms):', configurado);
  }, 1000);

  setTimeout(() => {
    configurado = configurarListenerIngresoEgreso();
    console.log('📊 Resultado de configurarListenerIngresoEgreso (2000ms):', configurado);
  }, 2000);

  // También usar MutationObserver para detectar cuando se agrega el select al DOM
  const observer = new MutationObserver(_mutations => {
    const selectIngresoEgreso = document.getElementById('ingresoegreso');
    if (selectIngresoEgreso && !selectIngresoEgreso.hasAttribute('data-handler-directo')) {
      console.log('👁️ MutationObserver detectó select ingresoegreso, configurando listener...');
      configurarListenerIngresoEgreso();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Cargar el módulo de configuración si no está cargado
  if (window.loadModule && typeof window.loadModule === 'function') {
    window
      .loadModule('config')
      .then(() => {
        esperarConfiguracionManager();
      })
      .catch(error => {
        console.warn('⚠️ Error cargando módulo config:', error);
        esperarConfiguracionManager();
      });
  } else {
    esperarConfiguracionManager();
  }
});

// Ejecutar inicialización inmediatamente si el DOM ya está listo
if (document.readyState !== 'loading') {
  console.log('📄 DOM ya está listo, ejecutando inicialización inmediata...');
  configurarListenerIngresoEgreso();

  setTimeout(() => {
    configurarListenerIngresoEgreso();
  }, 500);
}
