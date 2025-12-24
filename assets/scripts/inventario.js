// ===== Sistema de Inventario de Plataformas Multi-Estancia =====

// Función auxiliar global para formatear fecha de manera segura en formato DD/MM/AAAA
window.formatearFechaMovimiento = function (fechaStr) {
  if (!fechaStr) {
    return '-';
  }

  try {
    let fecha;

    if (typeof fechaStr === 'string') {
      // Si incluye 'T', es formato ISO
      if (fechaStr.includes('T')) {
        fecha = new Date(fechaStr);
      } else if (/^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
        // Formato YYYY-MM-DD
        const [year, month, day] = fechaStr.split('T')[0].split('-');
        fecha = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      } else {
        fecha = new Date(fechaStr);
      }
    } else if (fechaStr instanceof Date) {
      fecha = fechaStr;
    } else {
      fecha = new Date(fechaStr);
    }

    // Validar que la fecha sea válida
    if (isNaN(fecha.getTime())) {
      console.warn('⚠️ Fecha inválida:', fechaStr, typeof fechaStr);
      return '-';
    }

    // Formatear en DD/MM/AAAA
    const day = String(fecha.getDate()).padStart(2, '0');
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const year = fecha.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.warn('⚠️ Error formateando fecha:', fechaStr, error);
    return '-';
  }
};

// Sincronizar plataformas con datos de tráfico
window.sincronizarConTrafico = async function () {
  try {
    const traficoData = await window.InventarioUtils.getAllTrafico();

    const plataformas = window.InventarioUtils.derivePlataformasFromTrafico(traficoData);

    // Guardar en localStorage
    localStorage.setItem('erp_inventario_plataformas', JSON.stringify(plataformas));

    // Actualizar vista
    await window.actualizarTablaInventario();
    window.actualizarKPIsInventario();

    // Actualizar panel de plataformas esperando descarga
    console.log('🔍 [sincronizarConTrafico] Verificando actualizarPanelPlataformasCargadas...');
    if (typeof window.actualizarPanelPlataformasCargadas === 'function') {
      console.log('✅ [sincronizarConTrafico] Ejecutando actualizarPanelPlataformasCargadas...');
      await window.actualizarPanelPlataformasCargadas();
    } else {
      console.warn('⚠️ [sincronizarConTrafico] actualizarPanelPlataformasCargadas no disponible');
    }

    // Mensaje de sincronización removido por solicitud del usuario
    console.log(`✅ Sincronización completada: ${plataformas.length} plataformas actualizadas`);
  } catch (error) {
    console.error('Error sincronizando con tráfico:', error);
    alert(`Error al sincronizar con tráfico: ${error.message}`);
  }
};

// Bandera para evitar ejecuciones simultáneas de actualizarTablaInventario
// Usar window para evitar conflictos si el script se carga múltiples veces
// Inicializar solo si no existe (usar Object.defineProperty para evitar conflictos)
if (!('actualizandoTablaInventario' in window)) {
  Object.defineProperty(window, 'actualizandoTablaInventario', {
    value: false,
    writable: true,
    configurable: true
  });
}

// Actualizar tabla de inventario con filtros
window.actualizarTablaInventario = async function () {
  // Evitar ejecuciones simultáneas
  if (window.actualizandoTablaInventario) {
    console.log('⏭️ [actualizarTablaInventario] Ya se está ejecutando, saltando...');
    return;
  }

  window.actualizandoTablaInventario = true;

  try {
    console.log('🔄 [actualizarTablaInventario] Función iniciada');
    const tbody = document.getElementById('tbodyInventarioPlataformas');
    if (!tbody) {
      console.warn(
        '⚠️ [actualizarTablaInventario] tbodyInventarioPlataformas no encontrado en el DOM'
      );
      console.warn('⚠️ [actualizarTablaInventario] Verificando si el elemento existe...');
      // Intentar encontrar el elemento de otra manera
      const posiblesIds = [
        'tbodyInventarioPlataformas',
        'inventarioPlataformas',
        'tablaInventarioPlataformas'
      ];
      posiblesIds.forEach(id => {
        const elem = document.getElementById(id);
        console.log(`   - ${id}:`, elem ? '✅ encontrado' : '❌ no encontrado');
      });
      return;
    }
    console.log('✅ [actualizarTablaInventario] tbody encontrado, continuando...');

    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

    // Obtener filtros
    const filtroEstancia = document.getElementById('filtroEstanciaInventario')?.value || '';
    const filtroEstado = document.getElementById('filtroEstadoPlataforma')?.value || '';
    const busqueda = document.getElementById('buscarPlataforma')?.value?.toLowerCase() || '';

    // Cargar plataformas desde Firebase primero, luego localStorage
    let plataformas = [];

    try {
      // Intentar derivar desde Firebase
      if (
        window.InventarioUtils &&
        typeof window.InventarioUtils.derivePlataformasFromTrafico === 'function'
      ) {
        console.log('📊 [actualizarTablaInventario] Cargando plataformas desde tráfico...');
        const traficoData = await window.InventarioUtils.getAllTrafico();
        console.log(
          `📊 [actualizarTablaInventario] ${traficoData.length} registros de tráfico obtenidos`
        );
        plataformas = window.InventarioUtils.derivePlataformasFromTrafico(traficoData);
        console.log(
          `📊 [actualizarTablaInventario] ${plataformas.length} plataformas derivadas después de consolidación`
        );

        // Guardar en localStorage para compatibilidad
        localStorage.setItem('erp_inventario_plataformas', JSON.stringify(plataformas));
        console.log(
          `✅ [actualizarTablaInventario] ${plataformas.length} plataformas cargadas desde tráfico`
        );
      } else {
        // Fallback a localStorage
        console.log('📦 [actualizarTablaInventario] Cargando plataformas desde localStorage...');
        plataformas = JSON.parse(localStorage.getItem('erp_inventario_plataformas') || '[]');
        console.log(
          `✅ [actualizarTablaInventario] ${plataformas.length} plataformas cargadas desde localStorage`
        );
      }
    } catch (error) {
      console.error('❌ [actualizarTablaInventario] Error cargando plataformas:', error);
      console.warn('⚠️ [actualizarTablaInventario] Usando localStorage como fallback...');
      plataformas = JSON.parse(localStorage.getItem('erp_inventario_plataformas') || '[]');
      console.log(
        `✅ [actualizarTablaInventario] ${plataformas.length} plataformas cargadas desde localStorage (fallback)`
      );
    }

    // Log de diagnóstico
    if (plataformas.length > 0) {
      console.log(
        '📋 [actualizarTablaInventario] Muestra de plataformas:',
        plataformas.slice(0, 3).map(p => ({
          numero: p.numero,
          placas: p.placas,
          estanciaActual: p.estanciaActual,
          estado: p.estado
        }))
      );
    }

    // Aplicar filtros
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

    // Renderizar tabla
    tbody.innerHTML = '';

    console.log(`📊 Plataformas después de filtros: ${plataformas.length}`);

    if (plataformas.length === 0) {
      console.log('⚠️ No hay plataformas que coincidan con los filtros');
      tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    <i class="fas fa-info-circle"></i> No hay plataformas que coincidan con los filtros
                </td>
            </tr>
        `;
      console.log('✅ actualizarTablaInventario() completada (sin datos)');
      return;
    }

    console.log(`🔄 Renderizando ${plataformas.length} plataformas...`);
    plataformas.forEach(plat => {
      // Mapear estados de tráfico a estados de inventario
      let estadoInventario = plat.estado || 'cargado';
      if (plat.estadoPlataforma === 'descargado') {
        estadoInventario = 'vacio';
      } else if (plat.estadoPlataforma === 'cargado') {
        estadoInventario = 'cargado';
      }

      const estadoBadge = {
        vacio: { class: 'success', text: 'Vacío' },
        cargado: { class: 'warning', text: 'Cargado' },
        mantenimiento: { class: 'danger', text: 'Mantenimiento' }
      }[estadoInventario] || { class: 'secondary', text: 'Sin estado' };

      // Buscar fecha en múltiples campos posibles
      const fechaMovimiento =
        plat.fechaMovimiento ||
        plat.fechaEnvio ||
        plat.ultimaActualizacion ||
        plat.fechaCreacion ||
        plat.fecha ||
        plat.ultimoMovimientoFecha ||
        null;

      // Log para diagnóstico (solo si no hay fecha)
      if (!fechaMovimiento) {
        const camposFecha = Object.keys(plat).filter(
          k =>
            k.toLowerCase().includes('fecha') ||
            k.toLowerCase().includes('date') ||
            k.toLowerCase().includes('movimiento')
        );
        if (camposFecha.length > 0) {
          console.log('🔍 Plataforma con campos de fecha pero sin valor:', {
            numero: plat.numero,
            placas: plat.placas,
            camposFecha: camposFecha,
            valores: camposFecha.map(k => ({ campo: k, valor: plat[k] }))
          });
        }
      }

      // Formatear fecha de movimiento de manera segura
      const fechaMovimientoFormateada = window.formatearFechaMovimiento(fechaMovimiento);

      const row = document.createElement('tr');

      // Crear identificador único para la plataforma (escapar comillas para evitar problemas)
      const identificador = plat.numero || plat.placas || '';
      const identificadorEscapado = identificador.replace(/'/g, "\\'").replace(/"/g, '&quot;');

      row.innerHTML = `
            <td><strong>${plat.numero || '-'}</strong></td>
            <td>${plat.placas || '-'}</td>
            <td>${plat.estanciaActual || '-'}</td>
            <td><span class="badge bg-${estadoBadge.class}">${estadoBadge.text}</span></td>
            <td>${plat.ultimoMovimiento || '-'}</td>
            <td>${fechaMovimientoFormateada}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-transferir-plataforma" 
                        data-identificador="${identificadorEscapado}"
                        data-numero="${(plat.numero || '').replace(/"/g, '&quot;')}"
                        data-placas="${(plat.placas || '').replace(/"/g, '&quot;')}">
                    <i class="fas fa-exchange-alt"></i> Transferir
                </button>
            </td>
        `;

      // Agregar event listener al botón de transferir (mejor práctica que onclick inline)
      const btnTransferir = row.querySelector('.btn-transferir-plataforma');
      if (btnTransferir && identificador) {
        btnTransferir.addEventListener('click', function () {
          const ident =
            this.getAttribute('data-identificador') ||
            this.getAttribute('data-numero') ||
            this.getAttribute('data-placas');
          if (ident && typeof window.transferirPlataforma === 'function') {
            window.transferirPlataforma(ident);
          } else {
            console.error(
              '❌ Error: transferirPlataforma no está disponible o identificador inválido',
              ident
            );
            alert('Error: No se pudo transferir la plataforma. Por favor recarga la página.');
          }
        });
      }

      tbody.appendChild(row);
    });

    console.log(
      `✅ actualizarTablaInventario() completada: ${plataformas.length} plataformas renderizadas`
    );
  } catch (error) {
    console.error('❌ [actualizarTablaInventario] Error en la función:', error);
  } finally {
    // Liberar la bandera
    window.actualizandoTablaInventario = false;
  }
};

// Actualizar KPIs de inventario
window.actualizarKPIsInventario = function () {
  const plataformas = JSON.parse(localStorage.getItem('erp_inventario_plataformas') || '[]');

  const total = plataformas.length;
  const vacias = plataformas.filter(
    p => p.estado === 'vacio' || p.estadoPlataforma === 'descargado'
  ).length;
  const cargadas = plataformas.filter(
    p => p.estado === 'cargado' || p.estadoPlataforma === 'cargado'
  ).length;
  const mantenimiento = plataformas.filter(p => p.estado === 'mantenimiento').length;

  document.getElementById('kpiTotalPlataformas').textContent = total;
  document.getElementById('kpiVacias').textContent = vacias;
  document.getElementById('kpiCargadas').textContent = cargadas;
  document.getElementById('kpiMantenimiento').textContent = mantenimiento;
};

// Cargar estancias en el filtro
window.cargarEstanciasEnFiltro = async function () {
  const select = document.getElementById('filtroEstanciaInventario');
  if (!select) {
    console.warn('⚠️ Select filtroEstanciaInventario no encontrado');
    return;
  }

  select.innerHTML = '<option value="">-- Todas las Estancias --</option>';

  // Usar sistema de caché inteligente: Firebase primero, luego caché
  const estancias = await window.getDataWithCache('estancias', async () => {
    let estanciasData = [];

    // PRIORIDAD 1: Intentar desde configuracionManager
    if (
      window.configuracionManager &&
      typeof window.configuracionManager.getEstancias === 'function'
    ) {
      estanciasData = window.configuracionManager.getEstancias() || [];
      if (estanciasData.length > 0) {
        console.log(`📋 Estancias cargadas desde configuracionManager: ${estanciasData.length}`);
        return estanciasData;
      }
    }

    // PRIORIDAD 2: Si no hay datos, intentar desde Firebase directamente
    if (
      estanciasData.length === 0 &&
      window.firebaseDb &&
      window.fs &&
      window.firebaseAuth?.currentUser
    ) {
      try {
        console.log('📊 Intentando cargar estancias desde Firebase...');

        // Buscar en configuracion/estancias (documento con array)
        const estanciasDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'estancias');
        const estanciasDoc = await window.fs.getDoc(estanciasDocRef);

        if (estanciasDoc.exists()) {
          const data = estanciasDoc.data();
          if (data.estancias && Array.isArray(data.estancias)) {
            estanciasData = data.estancias;
            console.log(
              `✅ Estancias cargadas desde configuracion/estancias: ${estanciasData.length}`
            );
            return estanciasData;
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando estancias desde Firebase:', error);
      }
    }

    return estanciasData;
  });

  // Llenar el select con las estancias
  if (estancias && estancias.length > 0) {
    estancias.forEach(estancia => {
      if (estancia && estancia.nombre) {
        const option = document.createElement('option');
        option.value = estancia.nombre;
        option.textContent = estancia.nombre;
        select.appendChild(option);
      }
    });
    console.log(`✅ ${estancias.length} estancias cargadas en el select (desde Firebase o caché)`);
  } else {
    console.warn('⚠️ No se encontraron estancias para cargar');
  }
};

// Transferir plataforma entre estancias
window.transferirPlataforma = async function (identificador) {
  // Usar requestAnimationFrame para no bloquear el hilo principal
  requestAnimationFrame(async () => {
    const startTime = performance.now();

    if (!identificador) {
      alert('Error: No se proporcionó un identificador de plataforma');
      return;
    }

    // Obtener plataformas desde localStorage (síncrono, rápido)
    let plataformas = [];
    try {
      const plataformasLocal = JSON.parse(
        localStorage.getItem('erp_inventario_plataformas') || '[]'
      );
      if (Array.isArray(plataformasLocal) && plataformasLocal.length > 0) {
        plataformas = plataformasLocal;
      }
    } catch (error) {
      console.warn('⚠️ Error leyendo plataformas desde localStorage:', error);
      alert('Error al leer las plataformas. Por favor recarga la página.');
      return;
    }

    // Si no hay plataformas en localStorage, mostrar error
    if (plataformas.length === 0) {
      alert(
        'No se encontraron plataformas en el inventario. Por favor sincroniza con tráfico primero.'
      );
      return;
    }

    // Buscar plataforma por número o placas (búsqueda optimizada)
    const identificadorStr = identificador.toString();
    const plataforma = plataformas.find(p => {
      const numero = p.numero ? p.numero.toString() : '';
      const placas = p.placas ? p.placas.toString() : '';
      return numero === identificadorStr || placas === identificadorStr;
    });

    if (!plataforma) {
      alert(
        `No se encontró la plataforma con identificador: ${identificador}\n\nPor favor verifica que la plataforma existe en el inventario.`
      );
      return;
    }

    // Obtener lista de estancias (con múltiples intentos y carga asíncrona)
    let estancias = [];

    // PRIORIDAD 1: Intentar desde configuracionManager
    if (
      window.configuracionManager &&
      typeof window.configuracionManager.getEstancias === 'function'
    ) {
      estancias = window.configuracionManager.getEstancias() || [];
      console.log(`📋 Estancias desde configuracionManager: ${estancias.length}`);
    }

    // PRIORIDAD 2: Si no hay estancias, intentar cargarlas desde Firebase directamente
    if (estancias.length === 0) {
      try {
        console.log('📊 Cargando estancias desde Firebase para transferencia...');
        // Intentar cargar estancias desde Firebase directamente
        if (window.firebaseDb && window.fs) {
          const estanciasDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'estancias');
          const estanciasDoc = await window.fs.getDoc(estanciasDocRef);

          if (estanciasDoc.exists()) {
            const data = estanciasDoc.data();
            if (data.estancias && Array.isArray(data.estancias)) {
              estancias = data.estancias;
              console.log(
                `✅ Estancias cargadas desde Firebase para transferencia: ${estancias.length}`
              );

              // Sincronizar con configuracionManager si está disponible
              if (
                window.configuracionManager &&
                typeof window.configuracionManager.setEstancias === 'function'
              ) {
                window.configuracionManager.setEstancias(estancias);
              }
            }
          }
        }

        // Si aún no hay estancias, intentar usar la función de carga
        if (
          estancias.length === 0 &&
          window.cargarEstanciasEnFiltro &&
          typeof window.cargarEstanciasEnFiltro === 'function'
        ) {
          console.log('📊 Intentando cargar estancias usando cargarEstanciasEnFiltro...');
          await window.cargarEstanciasEnFiltro();
          estancias = window.configuracionManager?.getEstancias() || [];
          console.log(`📋 Estancias después de cargarEstanciasEnFiltro: ${estancias.length}`);
        }
      } catch (error) {
        console.warn('⚠️ Error cargando estancias:', error);
      }
    }

    // PRIORIDAD 3: Intentar desde localStorage como último recurso
    if (estancias.length === 0) {
      try {
        const estanciasLocal = localStorage.getItem('erp_estancias');
        if (estanciasLocal) {
          const estanciasParsed = JSON.parse(estanciasLocal);
          if (Array.isArray(estanciasParsed) && estanciasParsed.length > 0) {
            estancias = estanciasParsed;
            console.log(`✅ Estancias cargadas desde localStorage: ${estancias.length}`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error leyendo estancias desde localStorage:', error);
      }
    }

    console.log(`📊 Total de estancias disponibles para transferencia: ${estancias.length}`);

    if (estancias.length === 0) {
      alert(
        'No hay estancias registradas. Por favor configure las estancias primero en la sección de Configuración.'
      );
      return;
    }

    // Guardar identificador de la plataforma usando el sistema centralizado
    window.ERPState.setPlataformaTransferir(identificador);

    // Usar setTimeout para diferir la actualización del DOM y apertura del modal
    setTimeout(() => {
      // Llenar información en el modal
      const modalNumero = document.getElementById('modalPlataformaNumero');
      const modalPlacas = document.getElementById('modalPlataformaPlacas');
      const modalEstanciaActual = document.getElementById('modalPlataformaEstanciaActual');
      const selectEstancia = document.getElementById('modalNuevaEstancia');

      if (modalNumero) {
        modalNumero.textContent = plataforma.numero || '-';
      }
      if (modalPlacas) {
        modalPlacas.textContent = plataforma.placas || '-';
      }
      if (modalEstanciaActual) {
        modalEstanciaActual.textContent = plataforma.estanciaActual || '-';
      }

      // Llenar select de estancias (optimizado)
      if (selectEstancia) {
        // Usar DocumentFragment para mejor rendimiento
        const fragment = document.createDocumentFragment();
        const optionDefault = document.createElement('option');
        optionDefault.value = '';
        optionDefault.textContent = '-- Seleccione una estancia --';
        fragment.appendChild(optionDefault);

        estancias.forEach(estancia => {
          if (estancia.nombre !== plataforma.estanciaActual) {
            const option = document.createElement('option');
            option.value = estancia.nombre;
            option.textContent = estancia.nombre;
            fragment.appendChild(option);
          }
        });

        selectEstancia.innerHTML = '';
        selectEstancia.appendChild(fragment);
      }

      // Abrir modal (usar requestAnimationFrame para suavizar la animación)
      requestAnimationFrame(() => {
        const modalElement = document.getElementById('modalTransferirPlataforma');
        if (modalElement) {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        }

        const endTime = performance.now();
        console.log(`✅ Modal abierto en ${(endTime - startTime).toFixed(2)}ms`);
      });
    }, 0);
  });
};

// Función para confirmar la transferencia
window.confirmarTransferenciaPlataforma = async function () {
  const nuevaEstancia = document.getElementById('modalNuevaEstancia').value;

  if (!nuevaEstancia || !nuevaEstancia.trim()) {
    alert('Por favor seleccione una estancia');
    return;
  }

  const identificadorPlataforma = window.ERPState.getPlataformaTransferir();
  if (!identificadorPlataforma) {
    alert('Error: No se encontró la plataforma a transferir');
    return;
  }

  // Obtener plataforma
  const plataformas = JSON.parse(localStorage.getItem('erp_inventario_plataformas') || '[]');
  const plataforma = plataformas.find(
    p => p.numero === identificadorPlataforma || p.placas === identificadorPlataforma
  );

  if (!plataforma) {
    alert('No se encontró la plataforma');
    return;
  }

  // Actualizar plataforma
  plataforma.estanciaActual = nuevaEstancia.trim();
  plataforma.ultimoMovimiento = 'Transferencia manual';
  plataforma.fechaMovimiento = new Date().toISOString();

  // Guardar cambios en localStorage
  localStorage.setItem('erp_inventario_plataformas', JSON.stringify(plataformas));

  // Si hay Firebase disponible, intentar guardar también allí
  if (window.firebaseRepos && window.firebaseRepos.trafico) {
    try {
      // Buscar el registro de tráfico correspondiente y actualizarlo
      const traficoData = await window.InventarioUtils.getAllTrafico();
      const registros = Object.values(traficoData || {});

      // Buscar registros que correspondan a esta plataforma
      const registrosPlataforma = registros.filter(
        reg =>
          (reg.numeroPlataforma &&
            reg.numeroPlataforma.toString() === identificadorPlataforma.toString()) ||
          (reg.placas && reg.placas.toString() === identificadorPlataforma.toString()) ||
          (reg.plataforma && reg.plataforma.toString() === identificadorPlataforma.toString())
      );

      // Actualizar el registro más reciente
      if (registrosPlataforma.length > 0) {
        const registroMasReciente = registrosPlataforma.sort((a, b) => {
          const fechaA = new Date(a.fecha || a.fechaCreacion || 0).getTime();
          const fechaB = new Date(b.fecha || b.fechaCreacion || 0).getTime();
          return fechaB - fechaA;
        })[0];

        if (registroMasReciente.numeroRegistro && window.firebaseRepos.trafico.saveRegistro) {
          registroMasReciente.estanciaActual = nuevaEstancia.trim();
          await window.firebaseRepos.trafico.saveRegistro(
            registroMasReciente.numeroRegistro,
            registroMasReciente
          );
          console.log(
            '✅ Estancia actualizada en Firebase para registro:',
            registroMasReciente.numeroRegistro
          );
        }
      }
    } catch (error) {
      console.warn('⚠️ Error guardando transferencia en Firebase:', error);
      // No bloquear la operación si falla Firebase, ya se guardó en localStorage
    }
  }

  // Cerrar modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('modalTransferirPlataforma'));
  if (modal) {
    modal.hide();
  }

  // Limpiar variable temporal usando el sistema centralizado
  window.ERPState.clearPlataformaTransferir();

  // Guardar cambios de estanciaActual en un mapa separado para preservarlos
  // Esto evita que se sobrescriban cuando se derivan plataformas desde tráfico
  const cambiosEstancia = JSON.parse(
    localStorage.getItem('erp_plataformas_estancias_manuales') || '{}'
  );
  const identificadorKey = plataforma.numero || plataforma.placas;
  if (identificadorKey) {
    cambiosEstancia[identificadorKey] = {
      estanciaActual: nuevaEstancia.trim(),
      fechaCambio: new Date().toISOString(),
      ultimoMovimiento: 'Transferencia manual'
    };
    localStorage.setItem('erp_plataformas_estancias_manuales', JSON.stringify(cambiosEstancia));
    console.log('✅ Cambio de estancia guardado en mapa de cambios manuales:', identificadorKey);
  }

  // Actualizar vista
  await window.actualizarTablaInventario();
  window.actualizarKPIsInventario();

  // Mostrar mensaje de éxito
  alert(`✅ Plataforma transferida a: ${nuevaEstancia.trim()}`);
};

// ===== Funciones Globales de Inventario =====
window.InventarioUtils = {
  async getAllTrafico() {
    try {
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
            await new Promise(resolve => setTimeout(resolve, 500));
            await window.firebaseRepos.trafico.init();
          }

          if (window.firebaseRepos.trafico.db && window.firebaseRepos.trafico.tenantId) {
            const registrosFirebase = await window.firebaseRepos.trafico.getAllRegistros();
            if (registrosFirebase && registrosFirebase.length > 0) {
              console.log(
                `✅ ${registrosFirebase.length} registros de tráfico cargados desde Firebase`
              );

              // Convertir array a objeto con registroId como clave
              const traficoObj = {};
              registrosFirebase.forEach(reg => {
                const registroId =
                  reg.numeroRegistro ||
                  reg.registroId ||
                  reg.id ||
                  `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                traficoObj[registroId] = {
                  ...reg,
                  numeroRegistro: registroId // Asegurar que tenga numeroRegistro
                };
              });

              console.log('📋 TraficoObj creado con', Object.keys(traficoObj).length, 'registros');

              // Sincronizar con localStorage para compatibilidad
              const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
              sharedData.trafico = traficoObj;
              localStorage.setItem('erp_shared_data', JSON.stringify(sharedData));

              return traficoObj;
            }
          }
        } catch (error) {
          console.warn('⚠️ Error cargando tráfico desde Firebase, usando localStorage:', error);
        }
      }

      // PRIORIDAD 2: Intentar múltiples fuentes de datos en localStorage
      let all = null;

      // Primero intentar con DataPersistence
      if (window.DataPersistence && typeof window.DataPersistence.getData === 'function') {
        all = window.DataPersistence.getData();
      }

      // Si no funciona, intentar directamente con localStorage
      if (!all) {
        const sharedData = localStorage.getItem('erp_shared_data');
        if (sharedData) {
          all = JSON.parse(sharedData);
        }
      }

      // Si aún no hay datos, intentar con la clave directa de tráfico
      if (!all || !all.trafico) {
        const traficoDirect = localStorage.getItem('erp_trafico');
        if (traficoDirect) {
          const traficoArray = JSON.parse(traficoDirect);
          // Convertir array a objeto si es necesario
          if (Array.isArray(traficoArray)) {
            const traficoObj = {};
            traficoArray.forEach(reg => {
              const registroId =
                reg.numeroRegistro ||
                reg.registroId ||
                reg.id ||
                `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              traficoObj[registroId] = reg;
            });
            return traficoObj;
          }
          return traficoArray;
        }
      }

      return all && all.trafico ? all.trafico : {};
    } catch (e) {
      console.error('Error loading traffic data:', e);
      return {};
    }
  },

  async derivePlataformasMovements() {
    const trafico = await this.getAllTrafico();
    const items = [];
    Object.keys(trafico).forEach(registroId => {
      const t = trafico[registroId];
      if (!t) {
        return;
      }
      // Usar campos agregados en tráfico: plataformaServicio, placasPlataforma, tipoPlataforma, LugarOrigen, LugarDestino
      const plataforma = t.plataformaServicio || t.plataforma || '';
      const placas = t.placasPlataforma || '';
      const tipo = t.tipoPlataforma || '';
      const origen = t.LugarOrigen || t.origen || '';
      const destino = t.LugarDestino || t.destino || '';
      if (!placas && !plataforma) {
        return;
      } // saltar si no tenemos identificador
      // Obtener fecha del movimiento (buscar en múltiples campos, similar a derivePlataformasFromTrafico)
      const fecha =
        t.fechaEnvio ||
        t.fecha ||
        t.ultimaActualizacion ||
        t.fechaCreacion ||
        t.fechaMovimiento ||
        null;

      items.push({
        registroId,
        plataforma,
        placas,
        tipo,
        origen,
        destino,
        fecha: fecha
      });
    });

    // Consolidar por placas (o por nombre plataforma si no hay placas)
    const map = new Map();
    items.forEach(it => {
      const key = it.placas || it.plataforma;
      if (!key) {
        return;
      }
      const prev = map.get(key);
      if (!prev) {
        map.set(key, it);
      } else {
        // mantener el más reciente por fecha
        const prevTime = prev.fecha ? new Date(prev.fecha).getTime() : 0;
        const curTime = it.fecha ? new Date(it.fecha).getTime() : 0;
        if (curTime >= prevTime) {
          map.set(key, it);
        }
      }
    });

    return Array.from(map.values()).map(it => {
      // Formatear fecha de manera segura
      let fechaFormateada = '-';
      if (it.fecha) {
        fechaFormateada = window.formatearFechaMovimiento(it.fecha);
        // Si la fecha no se pudo formatear, intentar con logging
        if (fechaFormateada === '-') {
          console.warn('⚠️ No se pudo formatear fecha en derivePlataformasMovements:', {
            fechaOriginal: it.fecha,
            tipo: typeof it.fecha,
            registroId: it.registroId,
            placas: it.placas
          });
        }
      }

      return {
        plataforma: it.plataforma || '-',
        placas: it.placas || '-',
        tipo: it.tipo || '-',
        ultimoOrigen: it.origen || '-',
        ultimoDestino: it.destino || '-',
        ubicacionActual: it.destino || it.origen || '-',
        ultimoMovimiento: fechaFormateada
      };
    });
  },

  // Nueva función para derivar plataformas con estado basado en tráfico
  derivePlataformasFromTrafico(trafico) {
    console.log('🔄 [derivePlataformasFromTrafico] Iniciando derivación de plataformas...');

    const items = [];

    // Manejar tanto objetos como arrays
    const registros = Array.isArray(trafico) ? trafico : Object.values(trafico);
    console.log(
      `📊 [derivePlataformasFromTrafico] ${registros.length} registros de tráfico a procesar`
    );

    registros.forEach((t, index) => {
      if (!t) {
        return;
      }

      const registroId = t.numeroRegistro || t.registroId || t.id || `reg_${index}`;
      const placas = t.placasPlataforma || t.placas || '';
      const numero = t.plataformaServicio || t.plataforma || placas;
      const destino = t.LugarDestino || t.destino || '';
      const estadoPlataforma = t.estadoPlataforma || t.estado || 'pendiente';

      if (!numero && !placas) {
        console.log(
          '⚠️ [derivePlataformasFromTrafico] Registro sin plataforma/placas, saltando:',
          registroId
        );
        return;
      }

      // Determinar estado real de la plataforma
      // Por defecto: cargado
      let estadoFinal = 'cargado';
      if (estadoPlataforma === 'descargado' || estadoPlataforma === 'Descargado') {
        estadoFinal = 'vacio'; // Descargada en tráfico = Vacío en inventario
      } else if (estadoPlataforma === 'cargado' || estadoPlataforma === 'Cargado') {
        estadoFinal = 'cargado'; // Cargado en tráfico = Cargado en inventario
      }

      // Obtener fecha del movimiento (buscar en múltiples campos)
      const fechaMovimiento =
        t.fechaEnvio ||
        t.fecha ||
        t.ultimaActualizacion ||
        t.fechaCreacion ||
        t.fechaMovimiento ||
        null;

      // Verificar si hay un cambio manual de estanciaActual para esta plataforma
      const cambiosEstancia = JSON.parse(
        localStorage.getItem('erp_plataformas_estancias_manuales') || '{}'
      );
      const identificadorKey = numero || placas;
      const cambioManual = cambiosEstancia[identificadorKey];

      items.push({
        registroId,
        numero,
        placas,
        // Preservar cambio manual de estanciaActual si existe, sino usar destino
        estanciaActual: cambioManual ? cambioManual.estanciaActual : destino,
        ultimoMovimiento: cambioManual ? cambioManual.ultimoMovimiento : `Viaje ${registroId}`,
        fechaMovimiento:
          cambioManual && cambioManual.fechaCambio
            ? cambioManual.fechaCambio
            : fechaMovimiento || new Date().toISOString(),
        estado: estadoFinal,
        estadoPlataforma: estadoPlataforma
      });

      if (cambioManual) {
        console.log(
          `✅ [derivePlataformasFromTrafico] Aplicando cambio manual de estancia para ${identificadorKey}: ${cambioManual.estanciaActual}`
        );
      }
    });

    console.log(
      `📊 [derivePlataformasFromTrafico] ${items.length} items creados antes de consolidación`
    );

    // Consolidar por número/placas (mantener el más reciente)
    const map = new Map();
    // Cargar cambios manuales una vez antes del forEach
    const cambiosEstancia = JSON.parse(
      localStorage.getItem('erp_plataformas_estancias_manuales') || '{}'
    );

    items.forEach(it => {
      const key = it.numero || it.placas;
      if (!key) {
        console.warn('⚠️ [derivePlataformasFromTrafico] Item sin número ni placas, saltando:', it);
        return;
      }

      // Obtener cambio manual para esta plataforma
      const cambioManual = cambiosEstancia[key];

      const prev = map.get(key);
      if (!prev) {
        map.set(key, it);
      } else {
        // Aplicar cambio manual al prev si existe
        if (cambioManual) {
          prev.estanciaActual = cambioManual.estanciaActual;
          prev.ultimoMovimiento = cambioManual.ultimoMovimiento || prev.ultimoMovimiento;
          prev.fechaMovimiento = cambioManual.fechaCambio || prev.fechaMovimiento;
          console.log(
            `✅ [derivePlataformasFromTrafico] Aplicando cambio manual a prev ${key}: ${cambioManual.estanciaActual}`
          );
        }

        const prevTime = new Date(prev.fechaMovimiento || 0).getTime();
        const curTime = new Date(it.fechaMovimiento || 0).getTime();

        if (curTime >= prevTime) {
          map.set(key, it);
          console.log(
            `🔄 [derivePlataformasFromTrafico] Actualizando plataforma ${key} con registro más reciente`
          );
        } else {
          // Si prev es más reciente, asegurar que tiene el cambio manual aplicado
          if (cambioManual && prev.estanciaActual !== cambioManual.estanciaActual) {
            prev.estanciaActual = cambioManual.estanciaActual;
            prev.ultimoMovimiento = cambioManual.ultimoMovimiento || prev.ultimoMovimiento;
            prev.fechaMovimiento = cambioManual.fechaCambio || prev.fechaMovimiento;
            console.log(
              `✅ [derivePlataformasFromTrafico] Aplicando cambio manual a prev más reciente ${key}: ${cambioManual.estanciaActual}`
            );
          }
        }
      }
    });

    // Convertir map a array
    const resultado = Array.from(map.values());

    // Aplicar cambios manuales después de la consolidación (asegurar que se preserven)
    // Reutilizar cambiosEstancia que ya fue cargado antes del forEach anterior
    resultado.forEach(plat => {
      const key = plat.numero || plat.placas;
      if (key && cambiosEstancia[key]) {
        const cambioManual = cambiosEstancia[key];
        plat.estanciaActual = cambioManual.estanciaActual;
        plat.ultimoMovimiento = cambioManual.ultimoMovimiento || plat.ultimoMovimiento;
        plat.fechaMovimiento = cambioManual.fechaCambio || plat.fechaMovimiento;
        console.log(
          `✅ [derivePlataformasFromTrafico] Aplicando cambio manual final para ${key}: ${cambioManual.estanciaActual}`
        );
      }
    });

    console.log(
      `✅ [derivePlataformasFromTrafico] ${resultado.length} plataformas después de consolidación`
    );

    if (resultado.length > 0) {
      console.log(
        '📋 [derivePlataformasFromTrafico] Muestra de plataformas consolidadas:',
        resultado.slice(0, 3).map(p => ({
          numero: p.numero,
          placas: p.placas,
          estanciaActual: p.estanciaActual,
          estado: p.estado
        }))
      );
    }

    return resultado;
  }
};

// ===== Inventario - Plataforma =====
(function () {
  function renderTable(rows) {
    const tbody = document.getElementById('tbodyPlataformas');
    if (!tbody) {
      return;
    }
    tbody.innerHTML = '';
    rows.forEach(r => {
      const tr = document.createElement('tr');
      // Formatear último movimiento si contiene "Invalid Date" o es una fecha sin formatear
      let ultimoMovimientoFormateado = r.ultimoMovimiento || '-';
      if (
        ultimoMovimientoFormateado &&
        ultimoMovimientoFormateado !== '-' &&
        ultimoMovimientoFormateado.includes('Invalid')
      ) {
        // Si contiene "Invalid Date", intentar formatear desde la fecha original si está disponible
        ultimoMovimientoFormateado = '-';
      } else if (
        ultimoMovimientoFormateado &&
        ultimoMovimientoFormateado !== '-' &&
        !ultimoMovimientoFormateado.match(/^\d{2}\/\d{2}\/\d{4}$/)
      ) {
        // Si no está en formato DD/MM/AAAA, intentar formatearlo
        ultimoMovimientoFormateado = window.formatearFechaMovimiento(ultimoMovimientoFormateado);
      }

      // Identificador único para la plataforma (usar placas o plataforma)
      const plataformaId = (r.placas || r.plataforma || '').toString().trim();
      const plataformaNombre = (r.placas || r.plataforma || '').toString().trim();

      // Crear las celdas de datos
      const tdPlataforma = document.createElement('td');
      tdPlataforma.textContent = r.plataforma || '-';

      const tdPlacas = document.createElement('td');
      tdPlacas.textContent = r.placas || '-';

      const tdTipo = document.createElement('td');
      tdTipo.textContent = r.tipo || '-';

      const tdOrigen = document.createElement('td');
      tdOrigen.textContent = r.ultimoOrigen || '-';

      const tdDestino = document.createElement('td');
      tdDestino.textContent = r.ultimoDestino || '-';

      const tdUbicacion = document.createElement('td');
      tdUbicacion.textContent = r.ubicacionActual || '-';

      const tdMovimiento = document.createElement('td');
      tdMovimiento.textContent = ultimoMovimientoFormateado;

      // Crear celda de acciones con los botones
      const tdAcciones = document.createElement('td');

      // Botón para ver historial (solo icono)
      const btnHistorial = document.createElement('button');
      btnHistorial.className = 'btn btn-sm btn-outline-info me-1';
      btnHistorial.innerHTML = '<i class="fas fa-history"></i>';
      btnHistorial.title = 'Ver historial de estancias';
      btnHistorial.onclick = () => {
        if (
          window.inventarioUI &&
          typeof window.inventarioUI.verHistorialEstancias === 'function'
        ) {
          window.inventarioUI.verHistorialEstancias(plataformaId, plataformaNombre);
        }
      };
      tdAcciones.appendChild(btnHistorial);

      // Botón para descargar PDF del historial (solo icono)
      const btnPDF = document.createElement('button');
      btnPDF.className = 'btn btn-sm btn-outline-danger';
      btnPDF.innerHTML = '<i class="fas fa-file-pdf"></i>';
      btnPDF.title = 'Descargar historial en PDF';
      btnPDF.onclick = () => {
        if (
          window.inventarioUI &&
          typeof window.inventarioUI.descargarPDFHistorialEstancias === 'function'
        ) {
          window.inventarioUI.descargarPDFHistorialEstancias(plataformaId, plataformaNombre);
        }
      };
      tdAcciones.appendChild(btnPDF);

      // Agregar todas las celdas al tr
      tr.appendChild(tdPlataforma);
      tr.appendChild(tdPlacas);
      tr.appendChild(tdTipo);
      tr.appendChild(tdOrigen);
      tr.appendChild(tdDestino);
      tr.appendChild(tdUbicacion);
      tr.appendChild(tdMovimiento);
      tr.appendChild(tdAcciones);

      tbody.appendChild(tr);
    });
  }

  // Función para cargar ubicaciones actuales en el select
  async function cargarUbicacionesActuales() {
    try {
      const all = await window.InventarioUtils.derivePlataformasMovements();
      const ubicacionesSet = new Set();

      all.forEach(r => {
        const ubicacion = r.ubicacionActual || '';
        if (ubicacion && ubicacion !== '-' && ubicacion.trim() !== '') {
          ubicacionesSet.add(ubicacion.trim());
        }
      });

      const ubicaciones = Array.from(ubicacionesSet).sort();
      const selectUbicacion = document.getElementById('fltUbicacion');

      if (selectUbicacion) {
        // Guardar la opción seleccionada actual
        const valorActual = selectUbicacion.value;

        // Limpiar opciones excepto "Todas"
        selectUbicacion.innerHTML = '<option value="">Todas</option>';

        // Agregar ubicaciones
        ubicaciones.forEach(ubic => {
          const option = document.createElement('option');
          option.value = ubic;
          option.textContent = ubic;
          selectUbicacion.appendChild(option);
        });

        // Restaurar la opción seleccionada si existe
        if (valorActual && ubicaciones.includes(valorActual)) {
          selectUbicacion.value = valorActual;
        }

        console.log(`✅ ${ubicaciones.length} ubicaciones cargadas en el filtro`);
      }
    } catch (error) {
      console.error('❌ Error cargando ubicaciones:', error);
    }
  }

  async function aplicarFiltros() {
    const all = await window.InventarioUtils.derivePlataformasMovements();
    const plataforma = (document.getElementById('fltPlataforma')?.value || '').toLowerCase();
    const placas = (document.getElementById('fltPlacas')?.value || '').toLowerCase();
    const tipo = document.getElementById('fltTipo')?.value || '';
    const ubic = document.getElementById('fltUbicacion')?.value || '';
    const filtradas = all.filter(r => {
      const okPlataforma = !plataforma || (r.plataforma || '').toLowerCase().includes(plataforma);
      const okPlacas = !placas || (r.placas || '').toLowerCase().includes(placas);
      const okTipo = !tipo || r.tipo === tipo;
      const okUbic = !ubic || (r.ubicacionActual || '') === ubic;
      return okPlataforma && okPlacas && okTipo && okUbic;
    });
    renderTable(filtradas);
    // Actualizar ubicaciones después de aplicar filtros (por si hay nuevas ubicaciones)
    cargarUbicacionesActuales();
  }

  // Función para exportar plataformas a Excel (con filtros aplicados)
  // (Usa window.exportarDatosExcel de main.js)
  window.exportarPlataformasGestiónExcel = async function () {
    try {
      console.log('📊 Exportando plataformas a Excel...');
      const all = await window.InventarioUtils.derivePlataformasMovements();

      // Aplicar los mismos filtros que aplicarFiltros()
      const plataforma = (document.getElementById('fltPlataforma')?.value || '').toLowerCase();
      const placas = (document.getElementById('fltPlacas')?.value || '').toLowerCase();
      const tipo = document.getElementById('fltTipo')?.value || '';
      const ubic = document.getElementById('fltUbicacion')?.value || '';
      const plataformas = all.filter(r => {
        const okPlataforma = !plataforma || (r.plataforma || '').toLowerCase().includes(plataforma);
        const okPlacas = !placas || (r.placas || '').toLowerCase().includes(placas);
        const okTipo = !tipo || r.tipo === tipo;
        const okUbic = !ubic || (r.ubicacionActual || '') === ubic;
        return okPlataforma && okPlacas && okTipo && okUbic;
      });

      if (!plataformas || plataformas.length === 0) {
        alert('No hay plataformas que coincidan con los filtros para exportar.');
        return;
      }

      // Preparar datos para exportación
      const rows = plataformas.map(plat => ({
        Plataforma: plat.plataforma || '',
        Placas: plat.placas || '',
        Tipo: plat.tipo || '',
        'Último Origen': plat.ultimoOrigen || '',
        'Último Destino': plat.ultimoDestino || '',
        'Ubicación Actual': plat.ubicacionActual || '',
        'Último Movimiento': plat.ultimoMovimiento || ''
      }));

      // Usar función base común
      await window.exportarDatosExcel({
        datos: rows,
        nombreArchivo: 'plataformas_gestion',
        nombreHoja: 'Plataformas',
        mensajeVacio: 'No hay plataformas que coincidan con los filtros para exportar.'
      });
    } catch (error) {
      console.error('❌ Error exportando plataformas:', error);
      alert('Error al exportar las plataformas');
    }
  };

  // Bandera para evitar múltiples inicializaciones
  let plataformaInitialized = false;

  document.addEventListener('DOMContentLoaded', async () => {
    if (plataformaInitialized) {
      return;
    }
    plataformaInitialized = true;

    try {
      const plataformas = await window.InventarioUtils.derivePlataformasMovements();
      renderTable(plataformas);
    } catch (e) {
      console.error('Inventario Plataforma error:', e);
    }
    try {
      if (window.inventarioGeneral && window.inventarioGeneral.renderGeneral) {
        window.inventarioGeneral.renderGeneral();
      } else {
        // Intentar de nuevo después de un breve delay
        setTimeout(() => {
          if (window.inventarioGeneral && window.inventarioGeneral.renderGeneral) {
            window.inventarioGeneral.renderGeneral();
          }
        }, 100);
      }
    } catch (e) {
      console.error('Inventario General error:', e);
    }
  });

  // Función auxiliar para obtener el historial de estancias de una plataforma
  async function obtenerHistorialEstancias(plataformaId) {
    // Obtener todos los datos de tráfico
    const traficoData = await window.InventarioUtils.getAllTrafico();

    // Convertir a array si es objeto
    const registros = Array.isArray(traficoData) ? traficoData : Object.values(traficoData || {});

    // Filtrar registros que correspondan a esta plataforma
    // Buscar por placas o por número de plataforma
    const historial = registros
      .filter(reg => {
        const placas = (reg.placasPlataforma || reg.placas || '').toString().trim();
        const plataforma = (reg.plataformaServicio || reg.plataforma || '').toString().trim();
        const plataformaIdLower = (plataformaId || '').toString().trim().toLowerCase();

        return (
          placas.toLowerCase() === plataformaIdLower ||
          plataforma.toLowerCase() === plataformaIdLower ||
          (placas && placas.toLowerCase().includes(plataformaIdLower)) ||
          (plataforma && plataforma.toLowerCase().includes(plataformaIdLower))
        );
      })
      .map(reg => {
        // Obtener fecha del movimiento
        const fecha =
          reg.fechaEnvio || reg.fecha || reg.fechaCreacion || reg.ultimaActualizacion || null;
        const fechaFormateada = fecha ? window.formatearFechaMovimiento(fecha) : '-';

        // Obtener origen y destino
        const origen = reg.LugarOrigen || reg.origen || '-';
        const destino = reg.LugarDestino || reg.destino || '-';

        // Obtener estado
        const estado = reg.estadoPlataforma || reg.estado || '-';

        // Obtener número de registro
        const registro = reg.numeroRegistro || reg.registroId || reg.id || '-';

        return {
          fecha,
          fechaFormateada,
          origen,
          destino,
          estado,
          registro,
          fechaTimestamp: fecha ? new Date(fecha).getTime() : 0
        };
      })
      .filter(item => item.fechaTimestamp > 0) // Solo incluir items con fecha válida
      .sort((a, b) => b.fechaTimestamp - a.fechaTimestamp); // Ordenar por fecha descendente (más reciente primero)

    return historial;
  }

  // Función para obtener y mostrar el historial de estancias de una plataforma
  async function verHistorialEstancias(plataformaId, plataformaNombre) {
    try {
      // Mostrar el modal
      const modal = new bootstrap.Modal(document.getElementById('modalHistorialEstancias'));

      // Actualizar el nombre de la plataforma en el modal
      document.getElementById('historialPlataformaNombre').textContent =
        plataformaNombre || plataformaId || '-';
      document.getElementById('historialPlataformaPlacas').textContent = plataformaId || '-';

      // Mostrar loading
      const tbody = document.getElementById('tbodyHistorialEstancias');
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted">
            <i class="fas fa-spinner fa-spin"></i> Cargando historial...
          </td>
        </tr>
      `;

      modal.show();

      // Obtener el historial usando la función auxiliar
      const historial = await obtenerHistorialEstancias(plataformaId);

      // Renderizar el historial
      if (historial.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center text-muted">
              <i class="fas fa-info-circle"></i> No se encontró historial de estancias para esta plataforma
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = '';
        historial.forEach(item => {
          const estadoBadge = {
            cargado: { class: 'warning', text: 'Cargado' },
            descargado: { class: 'success', text: 'Descargado' },
            pendiente: { class: 'secondary', text: 'Pendiente' }
          }[item.estado.toLowerCase()] || { class: 'secondary', text: item.estado };

          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${item.fechaFormateada}</td>
            <td>${item.origen}</td>
            <td>${item.destino}</td>
            <td><span class="badge bg-${estadoBadge.class}">${estadoBadge.text}</span></td>
            <td>${item.registro}</td>
          `;
          tbody.appendChild(row);
        });
      }

      console.log(
        `✅ Historial cargado: ${historial.length} movimientos encontrados para plataforma ${plataformaId}`
      );
    } catch (error) {
      console.error('❌ Error obteniendo historial de estancias:', error);
      const tbody = document.getElementById('tbodyHistorialEstancias');
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-danger">
            <i class="fas fa-exclamation-triangle"></i> Error al cargar el historial: ${error.message}
          </td>
        </tr>
      `;
    }
  }

  // Función para descargar el historial de estancias en PDF
  async function descargarPDFHistorialEstancias(plataformaId, plataformaNombre) {
    try {
      console.log(`📄 Descargando PDF del historial de estancias: ${plataformaId}`);

      // Obtener el historial usando la función auxiliar
      const historial = await obtenerHistorialEstancias(plataformaId);

      if (historial.length === 0) {
        alert('No se encontró historial de estancias para esta plataforma');
        return;
      }

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
      const margin = 15;
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // Título
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('HISTORIAL DE ESTANCIAS', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Información de la plataforma
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Plataforma: ${plataformaNombre || plataformaId || '-'}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Placas: ${plataformaId || '-'}`, margin, yPosition);
      yPosition += 10;

      // Encabezados de tabla (ajustar anchos para dar más espacio a nombres)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const colFecha = margin;
      const colOrigen = margin + 30;
      const colDestino = margin + 75;
      const colEstado = margin + 145;
      const colRegistro = margin + 175;
      const anchoFecha = 25;
      const anchoOrigen = 40;
      const anchoDestino = 40;
      const anchoEstado = 25; // Aumentado para que quepa "Descargado" completo
      const anchoRegistro = 30;

      doc.text('Fecha', colFecha, yPosition);
      doc.text('Origen', colOrigen, yPosition);
      doc.text('Destino', colDestino, yPosition);
      doc.text('Estado', colEstado, yPosition);
      doc.text('Registro', colRegistro, yPosition);
      yPosition += 5;

      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Datos del historial
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8); // Reducir un poco el tamaño para que quepan más caracteres

      // Función auxiliar para dividir texto en múltiples líneas
      const dividirTexto = (doc, texto, x, y, maxWidth, evitarDivision = false) => {
        if (!texto || texto === '-') {
          return [[texto || '-', 0]];
        }

        // Si evitarDivision es true, verificar si el texto cabe completo
        if (evitarDivision) {
          const textoWidth = doc.getTextWidth(texto);
          if (textoWidth <= maxWidth) {
            return [[texto, 0]];
          }
        }

        const lineHeight = 4;
        const lines = doc.splitTextToSize(texto, maxWidth);
        const result = [];
        lines.forEach((line, index) => {
          result.push([line, index * lineHeight]);
        });
        return result;
      };

      historial.forEach((item, _index) => {
        // Formatear estado
        const estadoTexto =
          {
            cargado: 'Cargado',
            descargado: 'Descargado',
            pendiente: 'Pendiente'
          }[item.estado.toLowerCase()] || item.estado;

        // Preparar texto para cada columna (sin truncar)
        const fechaTexto = item.fechaFormateada || '-';
        const origenTexto = item.origen || '-';
        const destinoTexto = item.destino || '-';
        const registroTexto = item.registro || '-';

        // Dividir textos largos en múltiples líneas
        // Para Estado y Registro, evitar dividir palabras si es posible (solo dividir si realmente no cabe)
        const fechaLines = dividirTexto(doc, fechaTexto, colFecha, yPosition, anchoFecha);
        const origenLines = dividirTexto(doc, origenTexto, colOrigen, yPosition, anchoOrigen);
        const destinoLines = dividirTexto(doc, destinoTexto, colDestino, yPosition, anchoDestino);
        const estadoLines = dividirTexto(doc, estadoTexto, colEstado, yPosition, anchoEstado, true); // Evitar dividir "Descargado"
        const registroLines = dividirTexto(
          doc,
          registroTexto,
          colRegistro,
          yPosition,
          anchoRegistro
        );

        // Calcular la altura máxima necesaria para esta fila
        const maxLines = Math.max(
          fechaLines.length,
          origenLines.length,
          destinoLines.length,
          estadoLines.length,
          registroLines.length
        );
        const alturaFila = maxLines * 4; // 4 puntos por línea

        // Verificar si necesitamos nueva página antes de imprimir
        if (yPosition + alturaFila > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;

          // Reimprimir encabezados
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text('Fecha', colFecha, yPosition);
          doc.text('Origen', colOrigen, yPosition);
          doc.text('Destino', colDestino, yPosition);
          doc.text('Estado', colEstado, yPosition);
          doc.text('Registro', colRegistro, yPosition);
          yPosition += 5;
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 5;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
        }

        // Imprimir cada línea de cada columna
        for (let i = 0; i < maxLines; i++) {
          const currentY = yPosition + i * 4;

          // Imprimir fecha (solo primera línea si hay múltiples)
          if (i < fechaLines.length) {
            doc.text(fechaLines[i][0], colFecha, currentY);
          }

          // Imprimir origen (todas las líneas necesarias)
          if (i < origenLines.length) {
            doc.text(origenLines[i][0], colOrigen, currentY);
          }

          // Imprimir destino (todas las líneas necesarias)
          if (i < destinoLines.length) {
            doc.text(destinoLines[i][0], colDestino, currentY);
          }

          // Imprimir estado (solo primera línea si hay múltiples)
          if (i < estadoLines.length) {
            doc.text(estadoLines[i][0], colEstado, currentY);
          }

          // Imprimir registro (solo primera línea si hay múltiples)
          if (i < registroLines.length) {
            doc.text(registroLines[i][0], colRegistro, currentY);
          }
        }

        // Avanzar posición Y según la altura de la fila
        yPosition += alturaFila + 2; // +2 puntos de separación entre filas
      });

      // Guardar PDF
      const fechaActual = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Historial_Estancias_${plataformaId}_${fechaActual}.pdf`;
      doc.save(nombreArchivo);

      console.log('✅ Historial de estancias exportado a PDF');
    } catch (error) {
      console.error('❌ Error exportando historial a PDF:', error);
      alert(`Error al exportar el historial a PDF: ${error.message}`);
    }
  }

  window.inventarioUI = {
    aplicarFiltros,
    cargarUbicacionesActuales,
    verHistorialEstancias,
    descargarPDFHistorialEstancias
  };

  // Cargar ubicaciones al inicializar
  document.addEventListener('DOMContentLoaded', async () => {
    // Esperar un momento para que los datos estén disponibles
    setTimeout(async () => {
      await cargarUbicacionesActuales();
    }, 1000);
  });
})();

// ===== Inventario - Refacciones =====
(function () {
  const STOCK_KEY = 'erp_inv_refacciones_stock';
  const MOVS_KEY = 'erp_inv_refacciones_movs';

  async function loadJSON(key, def) {
    try {
      // PRIORIDAD 1: Intentar cargar desde Firebase
      if (key === MOVS_KEY && window.firebaseRepos?.inventario) {
        try {
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.inventario.db || !window.firebaseRepos.inventario.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500));
            await window.firebaseRepos.inventario.init();
          }

          if (window.firebaseRepos.inventario.db && window.firebaseRepos.inventario.tenantId) {
            const movimientosFirebase = await window.firebaseRepos.inventario.getAllMovimientos();
            if (movimientosFirebase && movimientosFirebase.length > 0) {
              // FUSIONAR con localStorage en lugar de sobrescribir
              const movsLocal = JSON.parse(localStorage.getItem(key) || '[]');
              const movsMap = new Map();

              // Agregar movimientos locales al mapa (usando ID como clave)
              movsLocal.forEach(mov => {
                const movId = mov.id || `${mov.fecha}_${mov.cod}_${mov.tipo}`;
                movsMap.set(movId, mov);
              });

              // Agregar movimientos de Firebase (sobrescriben si tienen el mismo ID)
              movimientosFirebase.forEach(mov => {
                const movId = mov.id || `${mov.fecha}_${mov.cod}_${mov.tipo}`;
                movsMap.set(movId, mov);
              });

              const movsFusionados = Array.from(movsMap.values());
              localStorage.setItem(key, JSON.stringify(movsFusionados));
              return movsFusionados;
            }
          }
        } catch (error) {
          console.warn('⚠️ Error cargando movimientos desde Firebase, usando localStorage:', error);
        }
      }

      if (key === STOCK_KEY && window.firebaseRepos?.inventario) {
        try {
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.inventario.db || !window.firebaseRepos.inventario.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500));
            await window.firebaseRepos.inventario.init();
          }

          if (window.firebaseRepos.inventario.db && window.firebaseRepos.inventario.tenantId) {
            const stockFirebase = await window.firebaseRepos.inventario.getAllStock();
            if (stockFirebase && stockFirebase.length > 0) {
              // Convertir array a objeto
              const stockMap = {};
              stockFirebase.forEach(item => {
                if (item.codigo) {
                  stockMap[item.codigo] = {
                    desc: item.desc || item.descripcion,
                    qty: item.qty || item.cantidad || 0,
                    last: item.last || item.ultimaActualizacion,
                    stockMinimo:
                      item.stockMinimo !== undefined && item.stockMinimo !== null
                        ? parseInt(item.stockMinimo, 10)
                        : undefined
                  };
                }
              });

              // FUSIONAR con localStorage en lugar de sobrescribir
              const stockLocal = JSON.parse(localStorage.getItem(key) || '{}');
              // Fusionar: Firebase tiene prioridad, pero preservar stock mínimo si existe en Firebase
              const stockFusionado = { ...stockLocal };
              Object.keys(stockMap).forEach(codigo => {
                const stockFirebase = stockMap[codigo];
                const stockLocalItem = stockLocal[codigo] || {};
                // Fusionar: Firebase tiene prioridad, pero preservar stock mínimo de Firebase si existe
                stockFusionado[codigo] = {
                  ...stockLocalItem,
                  ...stockFirebase,
                  // Preservar stock mínimo de Firebase si existe, de lo contrario mantener el local
                  stockMinimo:
                    stockFirebase.stockMinimo !== undefined && stockFirebase.stockMinimo !== null
                      ? stockFirebase.stockMinimo
                      : stockLocalItem.stockMinimo !== undefined &&
                          stockLocalItem.stockMinimo !== null
                        ? stockLocalItem.stockMinimo
                        : undefined
                };
              });

              localStorage.setItem(key, JSON.stringify(stockFusionado));
              return stockFusionado;
            }
          }
        } catch (error) {
          console.warn('⚠️ Error cargando stock desde Firebase, usando localStorage:', error);
        }
      }

      // PRIORIDAD 2: Fallback a localStorage
      const d = localStorage.getItem(key);
      return d ? JSON.parse(d) : def;
    } catch (_) {
      return def;
    }
  }

  async function saveJSON(key, val) {
    try {
      // Guardar en localStorage primero
      localStorage.setItem(key, JSON.stringify(val));

      // PRIORIDAD: Guardar en Firebase
      if (key === MOVS_KEY && window.firebaseRepos?.inventario && Array.isArray(val)) {
        try {
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.inventario.db || !window.firebaseRepos.inventario.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500));
            await window.firebaseRepos.inventario.init();
          }

          if (window.firebaseRepos.inventario.db && window.firebaseRepos.inventario.tenantId) {
            // Guardar cada movimiento
            for (const mov of val) {
              const movimientoId = mov.id
                ? `movimiento_${mov.id}`
                : `movimiento_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              await window.firebaseRepos.inventario.saveMovimiento(movimientoId, mov);
            }
          }
        } catch (error) {
          console.warn('⚠️ Error guardando movimientos en Firebase:', error);
        }
      }

      if (key === STOCK_KEY && window.firebaseRepos?.inventario && typeof val === 'object') {
        try {
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.inventario.db || !window.firebaseRepos.inventario.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500));
            await window.firebaseRepos.inventario.init();
          }

          if (window.firebaseRepos.inventario.db && window.firebaseRepos.inventario.tenantId) {
            // Guardar cada item de stock con manejo de errores individual
            let guardados = 0;
            let _errores = 0;
            for (const [codigo, stockData] of Object.entries(val)) {
              try {
                await window.firebaseRepos.inventario.saveStock(codigo, {
                  ...stockData,
                  codigo: codigo
                });
                guardados++;
                // Pequeño delay para evitar sobrecargar Firebase
                await new Promise(resolve => setTimeout(resolve, 50));
              } catch (error) {
                _errores++;
                // Si es error de cuota, no seguir intentando
                if (
                  error.code === 'resource-exhausted' ||
                  error.message?.includes('Quota exceeded')
                ) {
                  console.warn(
                    `⚠️ Cuota de Firebase excedida, guardando solo en localStorage para ${codigo}`
                  );
                  break;
                }
                console.warn(
                  `⚠️ Error guardando stock ${codigo} en Firebase:`,
                  error.message || error
                );
              }
            }
            if (guardados > 0) {
            }
          }
        } catch (error) {
          // No lanzar el error, solo registrar
          console.warn(
            '⚠️ Error guardando stock en Firebase (continuando con localStorage):',
            error.message || error
          );
        }
      }
    } catch (_) {
      // Ignorar error intencionalmente
    }
  }

  async function getStockMap() {
    const stock = await loadJSON(STOCK_KEY, {});
    return stock;
  }
  async function getMovs() {
    return loadJSON(MOVS_KEY, []);
  }
  async function setStockMap(map) {
    await saveJSON(STOCK_KEY, map);
  }
  async function setMovs(arr) {
    await saveJSON(MOVS_KEY, arr);
  }

  async function renderStock(stockFiltrado = null) {
    const tbody = document.getElementById('tbodyRefaccionesStock');
    if (!tbody) {
      console.warn('⚠️ tbodyRefaccionesStock no encontrado');
      return;
    }
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

    let stock;
    if (stockFiltrado) {
      stock = stockFiltrado;
    } else {
      stock = await getStockMap();
    }

    // Asegurar que stock sea un objeto
    if (!stock || typeof stock !== 'object' || Array.isArray(stock)) {
      stock = {};
    }

    tbody.innerHTML = '';

    if (Object.keys(stock).length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted">No hay existencias</td></tr>';
      return;
    }

    Object.keys(stock).forEach(cod => {
      const s = stock[cod];
      const stockMinimo =
        s.stockMinimo !== undefined && s.stockMinimo !== null ? parseInt(s.stockMinimo, 10) : 5;
      const stockActual = s.qty || 0;
      const diferencia = stockActual - stockMinimo;
      const badgeClass =
        diferencia < 0 ? 'bg-danger' : diferencia === 0 ? 'bg-warning' : 'bg-success';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cod}</td>
        <td>${s.desc || '-'}</td>
        <td><strong>${stockActual}</strong></td>
        <td><span class="badge ${badgeClass} text-white">${stockMinimo}</span></td>
        <td>${formatearFechaRefaccion(s.last)}</td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-info" onclick="window.refaccionesUI.verMovimientosRefaccion('${cod}')" title="Ver movimientos de ${cod}">
              <i class="fas fa-history"></i>
            </button>
            <button class="btn btn-sm btn-outline-warning" onclick="window.refaccionesUI.editarStockMinimo('${cod}')" title="Editar stock mínimo de ${cod}">
              <i class="fas fa-exclamation-triangle"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Función auxiliar para formatear fecha sin problemas de zona horaria
  function formatearFechaRefaccion(fechaStr) {
    if (!fechaStr) {
      return '-';
    }
    // Si la fecha está en formato YYYY-MM-DD, formatearla directamente
    if (typeof fechaStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
      const [year, month, day] = fechaStr.split('T')[0].split('-');
      // Crear fecha en zona horaria local para evitar problemas de UTC
      const fecha = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      return fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
    // Si es un objeto Date o otra fecha, formatearla normalmente
    try {
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) {
        return '-';
      }
      return fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (e) {
      return '-';
    }
  }

  async function renderMovs(list) {
    const tbody = document.getElementById('tbodyRefaccionesMovs');
    if (!tbody) {
      return;
    }
    if (!list) {
      list = await getMovs();
    }
    // Asegurar que list sea un array
    const movsArray = Array.isArray(list) ? list : [];
    tbody.innerHTML = '';

    if (movsArray.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="text-center text-muted">No hay movimientos para mostrar</td></tr>';
      return;
    }

    movsArray.forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatearFechaRefaccion(m.fecha)}</td>
        <td><span class="badge ${m.tipo === 'entrada' ? 'bg-success' : 'bg-danger'}">${m.tipo}</span></td>
        <td>${m.cod}</td>
        <td>${m.desc}</td>
        <td>${m.cant}</td>
        <td>${m.unidad || 'piezas'}</td>
        <td>${m.obs || ''}</td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-primary" onclick="window.refaccionesUI.editarMovimiento('${m.id}')" title="Editar movimiento">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="window.refaccionesUI.eliminarMovimiento('${m.id}')" title="Eliminar movimiento">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Bandera para evitar bucles infinitos en refreshAll
  let isRefreshing = false;

  async function refreshAll() {
    // Evitar múltiples llamadas simultáneas
    if (isRefreshing) {
      return;
    }
    isRefreshing = true;

    try {
      // Esperar a que Firebase esté listo si está disponible
      if (window.__firebaseReposReady) {
        await window.__firebaseReposReady;
      }

      // Recalcular stock antes de mostrar (para asegurar que esté actualizado)
      let stockRecalculado;
      try {
        stockRecalculado = await recalcularStockDesdeMovimientos();
      } catch (error) {
        console.error('❌ Error recalculando stock:', error);
        // Intentar cargar desde localStorage como fallback
        try {
          const stockLocal = localStorage.getItem(STOCK_KEY);
          stockRecalculado = stockLocal ? JSON.parse(stockLocal) : {};
        } catch (e) {
          console.error('❌ Error cargando desde localStorage:', e);
          stockRecalculado = {};
        }
      }

      // Usar el stock recalculado directamente - ya está guardado en localStorage
      try {
        await renderStock(stockRecalculado);
      } catch (error) {
        console.error('❌ Error renderizando stock:', error);
        // Intentar renderizar con datos de localStorage como último recurso
        try {
          const stockLocal = localStorage.getItem(STOCK_KEY);
          const stockFallback = stockLocal ? JSON.parse(stockLocal) : {};
          await renderStock(stockFallback);
        } catch (e) {
          console.error('❌ Error crítico en fallback de renderizado:', e);
        }
      }

      await renderMovs();

      // Aplicar filtros unificados si hay valores en los campos de filtro
      await aplicarFiltrosUnificados();

      // Actualizar alertas de stock bajo
      await actualizarAlertasStockBajo();
    } catch (error) {
      console.error('❌ Error en refreshAll:', error);
      // Intentar renderizar con datos de localStorage como fallback
      try {
        const stockLocal = await getStockMap();
        await renderStock(stockLocal);
        await renderMovs();
      } catch (e) {
        console.error('❌ Error en fallback de renderizado:', e);
      }
    } finally {
      isRefreshing = false;
    }
  }

  async function aplicarFiltros() {
    const cod = (document.getElementById('ref_fltCodigo')?.value || '').toLowerCase();
    const dsc = (document.getElementById('ref_fltDesc')?.value || '').toLowerCase();
    // Stock
    const tbodyS = document.getElementById('tbodyRefaccionesStock');
    const stock = getStockMap();
    if (tbodyS) {
      tbodyS.innerHTML = '';
      Object.keys(stock).forEach(c => {
        const s = stock[c];
        const ok =
          (!cod || c.toLowerCase().includes(cod)) &&
          (!dsc || (s.desc || '').toLowerCase().includes(dsc));
        if (ok) {
          const stockMinimo =
            s.stockMinimo !== undefined && s.stockMinimo !== null ? parseInt(s.stockMinimo, 10) : 5;
          const stockActual = s.qty || 0;
          const diferencia = stockActual - stockMinimo;
          const badgeClass =
            diferencia < 0 ? 'bg-danger' : diferencia === 0 ? 'bg-warning' : 'bg-success';

          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${c}</td>
            <td>${s.desc || '-'}</td>
            <td><strong>${stockActual}</strong></td>
            <td><span class="badge ${badgeClass} text-white">${stockMinimo}</span></td>
            <td>${formatearFechaRefaccion(s.last)}</td>
            <td>
              <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-info" onclick="window.refaccionesUI.verMovimientosRefaccion('${c}')" title="Ver movimientos de ${c}">
                  <i class="fas fa-history"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning" onclick="window.refaccionesUI.editarStockMinimo('${c}')" title="Editar stock mínimo de ${c}">
                  <i class="fas fa-exclamation-triangle"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="descargarPDFHistorialRefaccion('${c}')" title="Descargar PDF del historial">
                  <i class="fas fa-file-pdf"></i>
                </button>
              </div>
            </td>
          `;
          tbodyS.appendChild(tr);
        }
      });
    }
    // Movs - Esperar a que getMovs() devuelva el array
    const movsArray = await getMovs();
    // Asegurar que movsArray sea un array
    const movs = Array.isArray(movsArray) ? movsArray : [];
    const movsFiltrados = movs.filter(
      m =>
        (!cod || m.cod.toLowerCase().includes(cod)) &&
        (!dsc || (m.desc || '').toLowerCase().includes(dsc))
    );
    renderMovs(movsFiltrados);
  }

  // Función unificada para aplicar filtros a Existencias y Movimientos
  async function aplicarFiltrosUnificados() {
    const cod = (document.getElementById('ref_filtroCodigo')?.value || '').toLowerCase();
    const dsc = (document.getElementById('ref_filtroDesc')?.value || '').toLowerCase();
    const tipo = document.getElementById('ref_filtroTipo')?.value || '';
    const fecha = document.getElementById('ref_filtroFecha')?.value || '';

    // Aplicar filtros a Existencias
    const tbodyStock = document.getElementById('tbodyRefaccionesStock');
    if (tbodyStock) {
      const stock = await getStockMap();
      tbodyStock.innerHTML = '';

      let contadorStock = 0;
      Object.keys(stock).forEach(c => {
        const s = stock[c];
        const ok =
          (!cod || c.toLowerCase().includes(cod)) &&
          (!dsc || (s.desc || '').toLowerCase().includes(dsc));
        if (ok) {
          contadorStock++;
          const stockMinimo =
            s.stockMinimo !== undefined && s.stockMinimo !== null ? parseInt(s.stockMinimo, 10) : 5;
          const stockActual = s.qty || 0;
          const diferencia = stockActual - stockMinimo;
          const badgeClass =
            diferencia < 0 ? 'bg-danger' : diferencia === 0 ? 'bg-warning' : 'bg-success';

          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${c}</td>
            <td>${s.desc || '-'}</td>
            <td><strong>${stockActual}</strong></td>
            <td><span class="badge ${badgeClass} text-white">${stockMinimo}</span></td>
            <td>${formatearFechaRefaccion(s.last)}</td>
            <td>
              <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-info" onclick="window.refaccionesUI.verMovimientosRefaccion('${c}')" title="Ver movimientos de ${c}">
                  <i class="fas fa-history"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning" onclick="window.refaccionesUI.editarStockMinimo('${c}')" title="Editar stock mínimo de ${c}">
                  <i class="fas fa-exclamation-triangle"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="descargarPDFHistorialRefaccion('${c}')" title="Descargar PDF del historial">
                  <i class="fas fa-file-pdf"></i>
                </button>
              </div>
            </td>
          `;
          tbodyStock.appendChild(tr);
        }
      });

      if (contadorStock === 0) {
        tbodyStock.innerHTML =
          '<tr><td colspan="5" class="text-center text-muted">No hay existencias que coincidan con los filtros</td></tr>';
      }
    }

    // Aplicar filtros a Movimientos
    const movs = await getMovs();
    // Asegurar que movs sea un array
    const movsArray = Array.isArray(movs) ? movs : [];

    console.log(`🔍 Aplicando filtros a ${movsArray.length} movimiento(s)...`);
    console.log('🔍 Filtros aplicados:', { cod, dsc, tipo, fecha });

    const movsFiltrados = movsArray.filter(m => {
      // Filtro por código
      const okCod = !cod || (m.cod || '').toLowerCase().includes(cod);

      // Filtro por descripción
      const okDesc = !dsc || (m.desc || '').toLowerCase().includes(dsc);

      // Filtro por tipo
      const okTipo = !tipo || (m.tipo || '').toLowerCase() === tipo.toLowerCase();

      // Filtro por fecha
      let okFecha = true;
      if (fecha) {
        const fechaMov = new Date(m.fecha || m.fechaCreacion || '');
        const fechaFiltro = new Date(fecha);
        if (!isNaN(fechaMov.getTime())) {
          // Comparar solo año, mes y día (sin hora)
          const fechaMovStr = fechaMov.toISOString().split('T')[0];
          const fechaFiltroStr = fechaFiltro.toISOString().split('T')[0];
          okFecha = fechaMovStr === fechaFiltroStr;
        } else {
          okFecha = false;
        }
      }

      return okCod && okDesc && okTipo && okFecha;
    });

    console.log(
      `✅ ${movsFiltrados.length} movimiento(s) pasaron los filtros de ${movsArray.length} total(es)`
    );

    // Renderizar movimientos filtrados
    await renderMovs(movsFiltrados);

    // Mostrar mensaje si no hay resultados
    const tbodyMovs = document.getElementById('tbodyRefaccionesMovs');
    if (tbodyMovs) {
      if (movsFiltrados.length === 0) {
        tbodyMovs.innerHTML =
          '<tr><td colspan="8" class="text-center text-muted">No hay movimientos que coincidan con los filtros</td></tr>';
      }
    }
  }

  // Función para limpiar filtros unificados
  function limpiarFiltrosUnificados() {
    document.getElementById('ref_filtroCodigo').value = '';
    document.getElementById('ref_filtroDesc').value = '';
    document.getElementById('ref_filtroTipo').value = '';
    document.getElementById('ref_filtroFecha').value = '';
    aplicarFiltrosUnificados();
  }

  async function loadProveedoresSelect(prefijo = 'ref') {
    let proveedores = [];

    try {
      const sel = document.getElementById(`${prefijo}_proveedor`);
      if (!sel) {
        console.warn(`⚠️ Select de proveedores (${prefijo}_proveedor) no encontrado`);
        return;
      }

      // Limpiar dejando la primera opción
      const firstOption = sel.firstElementChild;
      sel.innerHTML = '';
      if (firstOption) {
        sel.appendChild(firstOption);
      } else {
        sel.innerHTML = '<option value="">Seleccione proveedor...</option>';
      }

      // 1. PRIORIDAD: Intentar cargar desde configuracionManager
      if (
        window.configuracionManager &&
        typeof window.configuracionManager.getProveedores === 'function'
      ) {
        const todosLosProveedores = window.configuracionManager.getProveedores();
        let proveedoresData = [];
        if (Array.isArray(todosLosProveedores)) {
          proveedoresData = todosLosProveedores;
        } else if (todosLosProveedores && typeof todosLosProveedores === 'object') {
          proveedoresData = Object.values(todosLosProveedores);
        }

        // CRÍTICO: Filtrar por tenantId
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

        proveedores = proveedoresData.filter(proveedor => {
          const proveedorTenantId = proveedor.tenantId;
          return proveedorTenantId === tenantId;
        });

        console.log(
          `🔒 Proveedores filtrados por tenantId (${tenantId}): ${proveedores.length} de ${proveedoresData.length} totales`
        );
      }

      // 2. Si no hay datos, intentar desde Firebase
      if (
        proveedores.length === 0 &&
        window.firebaseDb &&
        window.fs &&
        window.firebaseAuth?.currentUser
      ) {
        try {
          console.log('📊 Intentando cargar proveedores desde Firebase...');

          // PRIORIDAD 1: Intentar desde configuracion/proveedores (documento con array)
          try {
            console.log('📊 [PRIORIDAD] Buscando en configuracion/proveedores...');
            const proveedoresDocRef = window.fs.doc(
              window.firebaseDb,
              'configuracion',
              'proveedores'
            );
            const proveedoresDoc = await window.fs.getDoc(proveedoresDocRef);

            if (proveedoresDoc.exists()) {
              const data = proveedoresDoc.data();
              if (data.proveedores && Array.isArray(data.proveedores)) {
                const todosLosProveedores = data.proveedores;

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
                proveedores = todosLosProveedores.filter(proveedor => {
                  const proveedorTenantId = proveedor.tenantId;
                  return proveedorTenantId === tenantId;
                });

                console.log(
                  `🔒 Proveedores filtrados por tenantId (${tenantId}): ${proveedores.length} de ${todosLosProveedores.length} totales`
                );

                // Sincronizar con configuracionManager
                if (
                  window.configuracionManager &&
                  typeof window.configuracionManager.setProveedores === 'function'
                ) {
                  window.configuracionManager.setProveedores(proveedores);
                }
              }
            }
          } catch (error) {
            console.warn('⚠️ Error cargando desde configuracion/proveedores:', error);
          }
        } catch (e) {
          console.error('❌ Error cargando proveedores desde Firebase:', e);
        }
      }

      // 3. Si aún no hay datos, intentar desde localStorage directamente
      if (proveedores.length === 0) {
        try {
          const proveedoresData = localStorage.getItem('erp_proveedores');
          if (proveedoresData) {
            const parsed = JSON.parse(proveedoresData);
            if (Array.isArray(parsed)) {
              proveedores = parsed;
            } else if (typeof parsed === 'object') {
              proveedores = Object.values(parsed);
            }
            console.log('✅ Proveedores cargados desde localStorage:', proveedores.length);
          }
        } catch (error) {
          console.warn('⚠️ Error cargando proveedores desde localStorage:', error);
        }
      }

      // Agregar proveedores al select
      proveedores.forEach(p => {
        if (p && (p.rfc || p.RFC)) {
          const o = document.createElement('option');
          o.value = p.rfc || p.RFC;
          o.textContent = p.nombre || p.nombreProveedor || p.razonSocial || p.rfc || p.RFC;
          sel.appendChild(o);
        }
      });

      console.log(`✅ Select actualizado con ${proveedores.length} proveedores`);
    } catch (e) {
      console.error('❌ Error cargando proveedores para Inventario:', e);
    }
  }

  async function loadAlmacenesSelect(prefijo = 'ref') {
    let almacenes = [];

    try {
      const sel = document.getElementById(`${prefijo}_almacen`);
      if (!sel) {
        console.warn(`⚠️ Select de almacenes (${prefijo}_almacen) no encontrado`);
        return;
      }

      // Limpiar dejando la primera opción
      const firstOption = sel.firstElementChild;
      sel.innerHTML = '';
      if (firstOption) {
        sel.appendChild(firstOption);
      } else {
        sel.innerHTML = '<option value="">Seleccione almacén...</option>';
      }

      // 1. PRIORIDAD: Intentar cargar desde configuracionManager
      if (
        window.configuracionManager &&
        typeof window.configuracionManager.getAlmacenes === 'function'
      ) {
        const almacenesData = window.configuracionManager.getAlmacenes();
        if (Array.isArray(almacenesData)) {
          almacenes = almacenesData;
          console.log('✅ Almacenes cargados desde getAlmacenes:', almacenes.length);
        } else if (almacenesData && typeof almacenesData === 'object') {
          almacenes = Object.values(almacenesData);
          console.log('✅ Almacenes cargados desde getAlmacenes (objeto):', almacenes.length);
        }
      }

      // 2. Si no hay datos, intentar desde Firebase
      if (
        almacenes.length === 0 &&
        window.firebaseDb &&
        window.fs &&
        window.firebaseAuth?.currentUser
      ) {
        try {
          console.log('📊 Intentando cargar almacenes desde Firebase...');

          // PRIORIDAD 1: Intentar desde configuracion/almacenes (documento con array)
          try {
            console.log('📊 [PRIORIDAD] Buscando en configuracion/almacenes...');
            const almacenesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'almacenes');
            const almacenesDoc = await window.fs.getDoc(almacenesDocRef);

            if (almacenesDoc.exists()) {
              const data = almacenesDoc.data();
              if (data.almacenes && Array.isArray(data.almacenes)) {
                almacenes = data.almacenes;
                console.log(
                  '✅ Almacenes cargados desde configuracion/almacenes:',
                  almacenes.length
                );
              }
            }
          } catch (error) {
            console.warn('⚠️ Error cargando desde configuracion/almacenes:', error);
          }

          // PRIORIDAD 2: Si no hay datos, intentar desde la colección almacenes
          if (almacenes.length === 0) {
            try {
              console.log('📊 Buscando en colección almacenes...');
              const almacenesRef = window.fs.collection(window.firebaseDb, 'almacenes');
              const tenantId =
                window.firebaseAuth?.currentUser?.uid ||
                window.DEMO_CONFIG?.tenantId ||
                'demo_tenant';
              const querySnapshot = await window.fs.getDocs(
                window.fs.query(almacenesRef, window.fs.where('tenantId', '==', tenantId))
              );
              almacenes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              console.log('✅ Almacenes cargados desde colección almacenes:', almacenes.length);
            } catch (error) {
              console.warn('⚠️ Error cargando desde colección almacenes:', error);
            }
          }
        } catch (error) {
          console.warn('⚠️ Error cargando almacenes desde Firebase:', error);
        }
      }

      // 3. Fallback final: Intentar desde localStorage directamente
      if (almacenes.length === 0) {
        try {
          const almacenesData = localStorage.getItem('erp_almacenes');
          if (almacenesData) {
            const parsed = JSON.parse(almacenesData);
            if (Array.isArray(parsed)) {
              almacenes = parsed;
            } else if (typeof parsed === 'object') {
              almacenes = Object.values(parsed);
            }
            console.log('✅ Almacenes cargados desde localStorage:', almacenes.length);
          }
        } catch (error) {
          console.warn('⚠️ Error cargando almacenes desde localStorage:', error);
        }
      }

      // Si no hay datos, mostrar advertencia
      if (almacenes.length === 0) {
        console.warn('⚠️ No hay almacenes registrados en el sistema');
      }

      console.log('📋 Total de almacenes encontrados:', almacenes.length);

      // Agregar almacenes al select
      almacenes.forEach(almacen => {
        if (almacen && almacen.nombre) {
          const o = document.createElement('option');
          o.value = almacen.nombre;
          // Mostrar nombre y código si existe
          let texto = almacen.nombre;
          if (almacen.codigo) {
            texto += ` (${almacen.codigo})`;
          }
          o.textContent = texto;
          sel.appendChild(o);
        }
      });

      console.log(`✅ Select actualizado con ${almacenes.length} almacenes`);
    } catch (e) {
      console.error('❌ Error cargando almacenes para Inventario:', e);
    }
  }

  // Función para recalcular stock desde movimientos
  async function recalcularStockDesdeMovimientos() {
    // Remover console.log para reducir spam en consola
    const movs = await getMovs();

    // Cargar stock existente para preservar stock mínimo configurado manualmente
    const stockExistente = await getStockMap();
    const stockRecalculado = {};

    // Ordenar movimientos por fecha para calcular correctamente
    // Mejorar el ordenamiento para manejar fechas en formato YYYY-MM-DD
    const movsOrdenados = [...movs].sort((a, b) => {
      const fechaA = a.fecha || '';
      const fechaB = b.fecha || '';

      // Comparar fechas
      let comparacionFecha = 0;
      if (
        fechaA &&
        fechaB &&
        fechaA.match(/^\d{4}-\d{2}-\d{2}/) &&
        fechaB.match(/^\d{4}-\d{2}-\d{2}/)
      ) {
        // Si las fechas son strings en formato YYYY-MM-DD, compararlas directamente
        comparacionFecha = fechaA.localeCompare(fechaB);
      } else {
        // Si hay timestamps o fechas con hora, usar Date
        const timeA = fechaA ? new Date(fechaA).getTime() : 0;
        const timeB = fechaB ? new Date(fechaB).getTime() : 0;
        comparacionFecha = timeA - timeB;
      }

      // Si las fechas son iguales, ordenar por tipo: primero entradas, luego salidas
      if (comparacionFecha === 0) {
        const tipoA = a.tipo || '';
        const tipoB = b.tipo || '';

        // Entrada tiene prioridad sobre salida
        if (tipoA === 'entrada' && tipoB === 'salida') {
          return -1;
        }
        if (tipoA === 'salida' && tipoB === 'entrada') {
          return 1;
        }

        // Si el tipo también es igual, ordenar por ID (timestamp)
        return (a.id || 0) - (b.id || 0);
      }

      return comparacionFecha;
    });

    movsOrdenados.forEach(m => {
      if (!m.cod || !m.cant) {
        return;
      }

      const { cod } = m;
      const cantidad = parseInt(m.cant, 10) || 0;
      const tipo = m.tipo || 'movimiento'; // Obtener tipo del movimiento

      if (!stockRecalculado[cod]) {
        // Si el stock ya existe, preservar su stock mínimo configurado manualmente
        const stockMinimoExistente = stockExistente[cod]?.stockMinimo;
        const stockMinimoInicial =
          stockMinimoExistente !== undefined && stockMinimoExistente !== null
            ? parseInt(stockMinimoExistente, 10)
            : m.stockMinimo !== undefined && m.stockMinimo !== null
              ? parseInt(m.stockMinimo, 10)
              : 5;

        stockRecalculado[cod] = {
          desc: m.desc || '',
          qty: 0,
          last: m.fecha || null,
          stockMinimo: stockMinimoInicial
        };
      }

      // Calcular stock: entrada suma, salida resta
      // Verificar tanto 'entrada' como 'Entrada' (por si hay inconsistencias)
      if (tipo === 'entrada' || tipo === 'Entrada') {
        stockRecalculado[cod].qty += cantidad;
        // Remover console.log para reducir spam en consola
      } else if (tipo === 'salida' || tipo === 'Salida') {
        stockRecalculado[cod].qty -= cantidad;
        // Remover console.log para reducir spam en consola
      } else {
        // Si el tipo no es entrada ni salida, no afecta el stock
        // Remover console.warn para reducir spam en consola
      }

      // No permitir stock negativo
      if (stockRecalculado[cod].qty < 0) {
        stockRecalculado[cod].qty = 0;
      }

      // Actualizar fecha del último movimiento
      if (
        m.fecha &&
        (!stockRecalculado[cod].last || new Date(m.fecha) > new Date(stockRecalculado[cod].last))
      ) {
        stockRecalculado[cod].last = m.fecha;
      }

      // Actualizar descripción si está disponible
      if (m.desc) {
        stockRecalculado[cod].desc = m.desc;
      }

      // NO actualizar stock mínimo desde movimientos si ya existe uno configurado
      // El stock mínimo solo se establece cuando se crea el item por primera vez
      // o cuando el usuario lo edita manualmente
      // Preservar el stock mínimo existente si ya está configurado
      if (
        stockRecalculado[cod].stockMinimo === undefined ||
        stockRecalculado[cod].stockMinimo === null
      ) {
        // Solo establecer stock mínimo si no existe uno configurado
        const stockMinimoExistente = stockExistente[cod]?.stockMinimo;
        if (stockMinimoExistente !== undefined && stockMinimoExistente !== null) {
          stockRecalculado[cod].stockMinimo = parseInt(stockMinimoExistente, 10);
        } else if (m.stockMinimo !== undefined && m.stockMinimo !== null) {
          stockRecalculado[cod].stockMinimo = parseInt(m.stockMinimo, 10) || 5;
        } else {
          stockRecalculado[cod].stockMinimo = 5; // Valor por defecto
        }
      }
    });

    // Preservar stock mínimo configurado manualmente para todos los items
    // Esto asegura que si el usuario editó el stock mínimo, no se pierda al recalcular
    Object.keys(stockRecalculado).forEach(cod => {
      const stockMinimoExistente = stockExistente[cod]?.stockMinimo;
      // Si existe un stock mínimo configurado (diferente de undefined/null), preservarlo
      if (stockMinimoExistente !== undefined && stockMinimoExistente !== null) {
        const stockMinimoActual = stockRecalculado[cod].stockMinimo;
        const stockMinimoPreservar = parseInt(stockMinimoExistente, 10);
        // Solo preservar si es diferente (para evitar logs innecesarios)
        if (stockMinimoActual !== stockMinimoPreservar) {
          stockRecalculado[cod].stockMinimo = stockMinimoPreservar;
        }
      }
    });

    // Remover console.log para reducir spam en consola

    // Guardar en localStorage primero (rápido y confiable)
    try {
      localStorage.setItem(STOCK_KEY, JSON.stringify(stockRecalculado));
      // Remover console.log para reducir spam en consola
    } catch (e) {
      console.error('❌ Error guardando en localStorage:', e);
    }

    // NO guardar stock en Firebase desde aquí para evitar bucles infinitos
    // El stock se guardará en Firebase solo cuando:
    // 1. Se registra un nuevo movimiento (desde registrarMovimiento)
    // 2. Se hace un cambio explícito por el usuario
    // NO desde el listener de Firebase ni desde recalcularStockDesdeMovimientos
    // console.log('💾 Stock recalculado, guardado solo en localStorage (Firebase se actualizará desde movimientos)');

    return stockRecalculado;
  }

  async function registrarMovimiento() {
    // Obtener el botón y configurar estado de carga
    const btnGuardar =
      document.querySelector('[data-action="registrarMovimiento"]') ||
      document.getElementById('btnGuardarMovimiento');

    // Guardar estado original del botón
    const estadoOriginal = btnGuardar
      ? {
        disabled: btnGuardar.disabled,
        innerHTML: btnGuardar.innerHTML,
        text: btnGuardar.textContent,
        classes: btnGuardar.className
      }
      : null;

    // Activar estado de carga INMEDIATAMENTE para evitar dobles clics
    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.style.cursor = 'not-allowed';
      btnGuardar.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...';
      btnGuardar.classList.add('opacity-75');
      // Prevenir cualquier otro clic
      btnGuardar.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
    }

    try {
      const cod = document.getElementById('ref_cod')?.value.trim();
      const desc = document.getElementById('ref_desc')?.value.trim();
      const tipo = document.getElementById('ref_tipo')?.value;
      const cant = parseInt(document.getElementById('ref_cant')?.value || '0', 10);
      let fecha = document.getElementById('ref_fecha')?.value;

      // Si no hay fecha, usar la fecha actual del sistema en formato YYYY-MM-DD (fecha local, no UTC)
      if (!fecha) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        fecha = `${year}-${month}-${day}`;
        // También actualizar el campo en el formulario
        const fechaInput = document.getElementById('ref_fecha');
        if (fechaInput) {
          fechaInput.value = fecha;
        }
      }
      const obs = document.getElementById('ref_obs')?.value.trim();
      const factura = document.getElementById('ref_factura')?.value.trim() || '';
      const proveedor = document.getElementById('ref_proveedor')?.value || '';
      const unidad = document.getElementById('ref_unidad')?.value || 'piezas';
      const almacen = document.getElementById('ref_almacen')?.value.trim() || '';
      const stockMinimo = parseInt(document.getElementById('ref_stock_minimo')?.value || '0', 10);

      // Validación de campos obligatorios
      if (!cod || !desc || !tipo || !cant || cant <= 0 || !stockMinimo || stockMinimo < 0) {
        // Restaurar botón antes de mostrar alerta
        if (btnGuardar && estadoOriginal) {
          btnGuardar.disabled = estadoOriginal.disabled;
          btnGuardar.innerHTML = estadoOriginal.innerHTML;
          btnGuardar.className = estadoOriginal.classes;
          btnGuardar.style.cursor = '';
          btnGuardar.classList.remove('opacity-75');
          // Restaurar el onclick original
          btnGuardar.onclick = null;
        }

        // Mensaje de error específico
        let mensajeError = 'Por favor completa todos los campos obligatorios:\n';
        if (!cod) {
          mensajeError += '• Código\n';
        }
        if (!desc) {
          mensajeError += '• Descripción\n';
        }
        if (!tipo) {
          mensajeError += '• Tipo de movimiento\n';
        }
        if (!cant || cant <= 0) {
          mensajeError += '• Cantidad (debe ser mayor a 0)\n';
        }
        if (!stockMinimo || stockMinimo < 0) {
          mensajeError += '• Stock Mínimo (debe ser mayor o igual a 0)\n';
        }

        alert(mensajeError);
        return;
      }

      console.log('📝 Registrando movimiento:', { cod, desc, tipo, cant, almacen });

      // Crear movimiento
      const mov = {
        id: Date.now(),
        fecha,
        tipo,
        cod,
        desc,
        cant,
        obs,
        factura,
        proveedor,
        unidad,
        almacen,
        stockMinimo: stockMinimo
      };

      // Guardar movimiento
      const movs = await getMovs();
      movs.unshift(mov);
      await setMovs(movs);

      console.log('✅ Movimiento guardado:', mov);

      // Recalcular stock desde todos los movimientos (más confiable)
      // NO guardar stock en Firebase aquí - el listener lo hará automáticamente
      const stockRecalculado = await recalcularStockDesdeMovimientos();

      // Guardar stock en Firebase SOLO cuando el usuario registra un movimiento explícitamente
      // Esto evita bucles infinitos con el listener
      if (window.firebaseRepos?.inventario && stockRecalculado) {
        try {
          // Guardar solo los items de stock que cambiaron (optimización)
          const stockAnterior = await getStockMap();
          for (const [codigo, stockData] of Object.entries(stockRecalculado)) {
            const stockAnteriorItem = stockAnterior[codigo];
            // Solo guardar si cambió la cantidad o es nuevo
            if (!stockAnteriorItem || stockAnteriorItem.qty !== stockData.qty) {
              try {
                await window.firebaseRepos.inventario.saveStock(codigo, {
                  ...stockData,
                  codigo: codigo
                });
              } catch (error) {
                console.warn(
                  `⚠️ Error guardando stock ${codigo} en Firebase:`,
                  error.message || error
                );
              }
            }
          }
        } catch (error) {
          console.warn(
            '⚠️ Error guardando stock en Firebase (continuando de todas formas):',
            error.message || error
          );
        }
      }

      // Limpiar formulario
      document.getElementById('ref_cod').value = '';
      document.getElementById('ref_desc').value = '';
      document.getElementById('ref_cant').value = '';
      document.getElementById('ref_stock_minimo').value = '';
      document.getElementById('ref_obs').value = '';
      document.getElementById('ref_factura').value = '';
      document.getElementById('ref_proveedor').value = '';
      document.getElementById('ref_almacen').value = '';

      // Restablecer fecha a la fecha actual del sistema (fecha local, no UTC)
      const fechaInput = document.getElementById('ref_fecha');
      if (fechaInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const fechaFormato = `${year}-${month}-${day}`; // Formato YYYY-MM-DD (fecha local)
        fechaInput.value = fechaFormato;
      }

      refreshAll();

      // Mostrar confirmación
      const tipoTexto = tipo === 'entrada' ? 'Entrada' : 'Salida';
      const signo = tipo === 'entrada' ? '+' : '-';

      // Actualizar botón a estado de éxito antes de recargar
      if (btnGuardar) {
        btnGuardar.innerHTML = '<i class="fas fa-check me-2"></i>Guardado';
        btnGuardar.classList.remove('opacity-75');
        btnGuardar.classList.add('opacity-100');
      }

      alert(`✅ Movimiento registrado: ${tipoTexto} de ${signo}${cant} unidades de ${cod}`);

      // Recargar página después de guardar (el botón se restaurará automáticamente al recargar)
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      console.error('❌ Error registrando movimiento:', error);

      // Restaurar botón en caso de error
      if (btnGuardar && estadoOriginal) {
        btnGuardar.disabled = estadoOriginal.disabled;
        btnGuardar.innerHTML = estadoOriginal.innerHTML;
        btnGuardar.className = estadoOriginal.classes;
        btnGuardar.style.cursor = '';
        btnGuardar.classList.remove('opacity-75');
        // Restaurar el onclick original
        btnGuardar.onclick = null;
      }

      alert(`❌ Error al registrar el movimiento: ${error.message || error}`);
    }
  }

  // Bandera para evitar múltiples inicializaciones
  let refaccionesInitialized = false;

  document.addEventListener('DOMContentLoaded', async () => {
    if (refaccionesInitialized) {
      return;
    }
    refaccionesInitialized = true;

    // Establecer fecha actual del sistema en el campo de fecha (fecha local, no UTC)
    const fechaInput = document.getElementById('ref_fecha');
    if (fechaInput) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const fechaFormato = `${year}-${month}-${day}`; // Formato YYYY-MM-DD (fecha local)
      fechaInput.value = fechaFormato;
    }

    // Esperar a que los repositorios de Firebase estén listos
    let attempts = 0;
    const maxAttempts = 20;
    while (attempts < maxAttempts && (!window.firebaseRepos || !window.firebaseRepos.inventario)) {
      attempts++;
      if (attempts % 5 === 0) {
        // Solo mostrar cada 5 intentos
        console.log(`⏳ Esperando repositorios de Firebase... (${attempts}/${maxAttempts})`);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Recalcular stock al cargar la página
    await recalcularStockDesdeMovimientos();
    await refreshAll();
    // Esperar un poco para que Firebase esté listo
    setTimeout(async () => {
      await loadProveedoresSelect();
      await loadAlmacenesSelect();
    }, 500);

    // Sistema de manejo de eventos para elementos con data-action
    function initInventarioEventHandlers() {
      // Mapeo de acciones a funciones
      const inventarioActions = {
        registrarMovimiento: async function (e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('🖱️ Botón de guardar movimiento clickeado');
          if (typeof registrarMovimiento === 'function') {
            await registrarMovimiento();
          } else {
            console.error('❌ registrarMovimiento no está disponible');
            alert(
              'Error: La función de registrar movimiento no está disponible. Por favor recarga la página.'
            );
          }
          return false;
        },
        refreshAlmacenes: async function (e) {
          e.preventDefault();
          console.log('🔄 Actualizando lista de almacenes...');
          await loadAlmacenesSelect();
        },
        refreshProveedores: async function (e) {
          e.preventDefault();
          console.log('🔄 Actualizando lista de proveedores...');
          await loadProveedoresSelect();
        },
        aplicarFiltrosRefacciones: async function (_e) {
          if (typeof aplicarFiltrosUnificados === 'function') {
            await aplicarFiltrosUnificados();
          } else {
            console.error('❌ aplicarFiltrosUnificados no está disponible');
          }
        },
        limpiarFiltrosUnificados: function (_e) {
          if (typeof limpiarFiltrosUnificados === 'function') {
            limpiarFiltrosUnificados();
          }
        },
        aplicarFiltrosInventario: function (_e) {
          if (typeof window.aplicarFiltrosInventario === 'function') {
            window.aplicarFiltrosInventario();
          }
        },
        actualizarTablaInventario: function (_e) {
          if (typeof window.actualizarTablaInventario === 'function') {
            window.actualizarTablaInventario();
          }
        },
        aplicarFiltrosPlataformasDescarga: function (_e) {
          if (typeof window.aplicarFiltrosPlataformasDescarga === 'function') {
            window.aplicarFiltrosPlataformasDescarga();
          }
        },
        confirmarTransferenciaPlataforma: async function (e) {
          e.preventDefault();
          if (typeof window.confirmarTransferenciaPlataforma === 'function') {
            await window.confirmarTransferenciaPlataforma();
          }
        }
      };

      // Agregar listeners a elementos con data-action
      document.querySelectorAll('[data-action]').forEach(element => {
        const action = element.getAttribute('data-action');

        if (inventarioActions[action]) {
          // Evitar duplicados
          if (!element.hasAttribute('data-handler-attached')) {
            // Determinar el tipo de evento según el tipo de elemento
            const tagName = element.tagName.toLowerCase();
            const inputType = element.type ? element.type.toLowerCase() : '';

            // Para inputs, selects y textareas usar 'change', para botones usar 'click'
            let eventType = 'click';
            let handler = inventarioActions[action];

            if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
              // Para campos de texto, usar 'input' con debounce, para selects usar 'change'
              if (inputType === 'text') {
                eventType = 'input';
                // Agregar debounce para campos de texto (evitar ejecutar en cada tecla)
                let timeout;
                const originalHandler = handler;
                handler = function (e) {
                  clearTimeout(timeout);
                  timeout = setTimeout(() => originalHandler(e), 500); // Esperar 500ms después de dejar de escribir
                };
              } else {
                eventType = 'change';
              }
            }

            // Agregar el listener
            element.addEventListener(eventType, handler);
            element.setAttribute('data-handler-attached', 'true');

            console.log(`✅ Handler de inventario registrado: ${action} (${eventType})`);
          }
        }
      });

      console.log('✅ Event handlers de inventario inicializados');
    }

    // Inicializar event handlers
    initInventarioEventHandlers();

    // Re-inicializar después de un delay para asegurar que todos los elementos estén en el DOM
    setTimeout(initInventarioEventHandlers, 500);

    // Suscribirse a cambios en tiempo real de inventario
    // Verificar que no haya una suscripción activa
    if (window.__inventarioUnsubscribe) {
      try {
        window.__inventarioUnsubscribe();
      } catch (e) {
        console.warn('Error desuscribiendo suscripción anterior:', e);
      }
    }

    if (window.firebaseRepos && window.firebaseRepos.inventario) {
      try {
        // Bandera para evitar bucles infinitos en el subscribe
        let isProcessingSubscribe = false;
        let lastUpdateTime = 0;
        const MIN_UPDATE_INTERVAL = 1000; // Mínimo 1 segundo entre actualizaciones

        const unsubscribe = await window.firebaseRepos.inventario.subscribe(async items => {
          // Evitar actualizaciones muy frecuentes
          const now = Date.now();
          if (now - lastUpdateTime < MIN_UPDATE_INTERVAL) {
            return;
          }
          lastUpdateTime = now;

          // Evitar procesamiento simultáneo
          if (isProcessingSubscribe) {
            return;
          }
          isProcessingSubscribe = true;

          try {
            // Si Firebase está completamente vacío, verificar y sincronizar localStorage
            // NO restaurar desde localStorage si se limpiaron los datos operativos o si Firebase está vacío y hay conexión
            const datosLimpios = localStorage.getItem('datos_operativos_limpiados');
            const hayConexion = navigator.onLine;

            if (items.length === 0) {
              console.log('📡 Firebase está vacío para inventario. Verificando sincronización...');

              // Verificar si Firebase está realmente vacío
              try {
                const repoInventario = window.firebaseRepos.inventario;
                if (repoInventario && repoInventario.db && repoInventario.tenantId) {
                  const firebaseData = await repoInventario.getAll();

                  if (firebaseData && firebaseData.length === 0) {
                    const razon =
                      datosLimpios === 'true'
                        ? 'Datos operativos fueron limpiados (flag local)'
                        : hayConexion
                          ? 'Firebase está vacío y hay conexión (datos eliminados intencionalmente)'
                          : 'Firebase está vacío (modo offline)';
                    console.log(
                      `✅ Firebase confirmado vacío. ${razon}. Sincronizando localStorage con Firebase (vacío).`
                    );
                    localStorage.setItem(MOVS_KEY, JSON.stringify([]));
                    localStorage.setItem(STOCK_KEY, JSON.stringify({}));
                    console.log('🗑️ Firebase está vacío para inventario. localStorage limpiado.');

                    // Recargar la interfaz
                    if (typeof window.actualizarTablaMovimientos === 'function') {
                      window.actualizarTablaMovimientos();
                    }
                    if (typeof window.actualizarExistencias === 'function') {
                      window.actualizarExistencias();
                    }
                    isProcessingSubscribe = false;
                    return;
                  }
                  console.log(
                    '⚠️ Firebase no está vacío, hay',
                    firebaseData.length,
                    'items. Continuando con actualización normal.'
                  );
                  // Continuar con el flujo normal usando los datos verificados
                  items = firebaseData;
                }
              } catch (error) {
                console.warn('⚠️ Error verificando Firebase para inventario:', error);
                // Continuar con el flujo normal
              }
            }

            // Filtrar movimientos: incluir 'entrada', 'salida' y 'movimiento'
            const movimientos = items.filter(
              item =>
                item.tipo === 'movimiento' ||
                item.tipo === 'entrada' ||
                item.tipo === 'salida' ||
                item.tipoDocumento === 'movimiento'
            );
            const _stock = items.filter(item => item.tipo === 'stock');

            // Sincronizar movimientos con localStorage SIEMPRE (incluso si están vacíos)
            localStorage.setItem(MOVS_KEY, JSON.stringify(movimientos));

            // Recalcular stock desde movimientos cuando hay cambios
            // Usar los movimientos recibidos directamente en lugar de cargarlos de nuevo
            const stockRecalculado = {};

            // Ordenar movimientos por fecha para calcular correctamente
            // Mejorar el ordenamiento para manejar fechas en formato YYYY-MM-DD
            const movsOrdenados = [...movimientos].sort((a, b) => {
              const fechaA = a.fecha || '';
              const fechaB = b.fecha || '';

              // Comparar fechas
              let comparacionFecha = 0;
              if (
                fechaA &&
                fechaB &&
                fechaA.match(/^\d{4}-\d{2}-\d{2}/) &&
                fechaB.match(/^\d{4}-\d{2}-\d{2}/)
              ) {
                // Si las fechas son strings en formato YYYY-MM-DD, compararlas directamente
                comparacionFecha = fechaA.localeCompare(fechaB);
              } else {
                // Si hay timestamps o fechas con hora, usar Date
                const timeA = fechaA ? new Date(fechaA).getTime() : 0;
                const timeB = fechaB ? new Date(fechaB).getTime() : 0;
                comparacionFecha = timeA - timeB;
              }

              // Si las fechas son iguales, ordenar por tipo: primero entradas, luego salidas
              if (comparacionFecha === 0) {
                const tipoA = a.tipo || '';
                const tipoB = b.tipo || '';

                // Entrada tiene prioridad sobre salida
                if (tipoA === 'entrada' && tipoB === 'salida') {
                  return -1;
                }
                if (tipoA === 'salida' && tipoB === 'entrada') {
                  return 1;
                }

                // Si el tipo también es igual, ordenar por ID (timestamp)
                return (a.id || 0) - (b.id || 0);
              }

              return comparacionFecha;
            });

            movsOrdenados.forEach(m => {
              if (!m.cod || !m.cant) {
                return;
              }

              const { cod } = m;
              const cantidad = parseInt(m.cant, 10) || 0;
              const tipo = m.tipo || 'movimiento';

              if (!stockRecalculado[cod]) {
                stockRecalculado[cod] = {
                  desc: m.desc || '',
                  qty: 0,
                  last: m.fecha || null
                };
              }

              // Calcular stock: entrada suma, salida resta
              if (tipo === 'entrada' || tipo === 'Entrada') {
                stockRecalculado[cod].qty += cantidad;
              } else if (tipo === 'salida' || tipo === 'Salida') {
                stockRecalculado[cod].qty -= cantidad;
              }

              // No permitir stock negativo
              if (stockRecalculado[cod].qty < 0) {
                stockRecalculado[cod].qty = 0;
              }

              // Actualizar fecha del último movimiento
              if (
                m.fecha &&
                (!stockRecalculado[cod].last ||
                  new Date(m.fecha) > new Date(stockRecalculado[cod].last))
              ) {
                stockRecalculado[cod].last = m.fecha;
              }

              // Actualizar descripción si está disponible
              if (m.desc) {
                stockRecalculado[cod].desc = m.desc;
              }
            });

            // Guardar stock recalculado SOLO en localStorage para evitar bucles infinitos
            // NO guardar en Firebase desde aquí para evitar disparar el subscribe nuevamente
            localStorage.setItem(STOCK_KEY, JSON.stringify(stockRecalculado));

            // NO sincronizar stock desde Firebase aquí - el stock se recalcula desde movimientos
            // Si hay stock en Firebase, se ignora porque el stock debe calcularse desde movimientos
            // para mantener consistencia

            // Recargar las tablas solo si no está ya refrescando y con debounce más largo
            if (typeof refreshAll === 'function' && !isRefreshing) {
              // Usar setTimeout con un delay más largo para evitar llamadas muy frecuentes
              setTimeout(() => {
                if (!isRefreshing) {
                  refreshAll();
                }
              }, 1000); // Aumentado de 500ms a 1000ms para reducir frecuencia
            }
          } catch (error) {
            console.error('❌ Error en subscribe de inventario:', error);
          } finally {
            isProcessingSubscribe = false;
          }
        });

        // Guardar función de desuscripción
        window.__inventarioUnsubscribe = unsubscribe;
      } catch (error) {
        console.warn('⚠️ Error configurando suscripción en tiempo real de inventario:', error);
      }
    }
  });

  // Función para ver movimientos de una refacción específica
  async function verMovimientosRefaccion(codigo) {
    try {
      const movs = await getMovs();
      const movimientosRefaccion = movs.filter(m => m.cod === codigo);

      if (movimientosRefaccion.length === 0) {
        alert(`No hay movimientos registrados para la refacción ${codigo}`);
        return;
      }

      // Crear ventana modal o mostrar en consola
      mostrarMovimientosDetallados(codigo, movimientosRefaccion);
    } catch (e) {
      console.error('Error obteniendo movimientos de refacción:', e);
      alert('Error al obtener los movimientos de la refacción');
    }
  }

  // Función para mostrar movimientos detallados
  function mostrarMovimientosDetallados(codigo, movimientos) {
    // Ordenar por fecha (más recientes primero)
    movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    let html = `
      <div class="modal fade" id="modalMovimientos" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-history"></i> Movimientos de ${codigo}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Cantidad</th>
                      <th>Almacén</th>
                      <th>Observaciones</th>
                      <th>Proveedor</th>
                    </tr>
                  </thead>
                  <tbody>
    `;

    movimientos.forEach(mov => {
      const fecha = formatearFechaRefaccion(mov.fecha);
      const tipoClass = mov.tipo === 'entrada' ? 'text-success' : 'text-danger';
      const tipoIcon = mov.tipo === 'entrada' ? 'fa-arrow-up' : 'fa-arrow-down';

      html += `
        <tr>
          <td>${fecha}</td>
          <td><i class="fas ${tipoIcon} ${tipoClass}"></i> ${mov.tipo.toUpperCase()}</td>
          <td><strong>${mov.cant}</strong></td>
          <td>${mov.almacen || 'Sin almacén'}</td>
          <td>${mov.obs || '-'}</td>
          <td>${mov.proveedor || '-'}</td>
        </tr>
      `;
    });

    html += `
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remover modal existente si existe
    const modalExistente = document.getElementById('modalMovimientos');
    if (modalExistente) {
      modalExistente.remove();
    }

    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', html);

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalMovimientos'));
    modal.show();

    // Limpiar modal cuando se cierre
    document.getElementById('modalMovimientos').addEventListener('hidden.bs.modal', function () {
      this.remove();
    });
  }

  // Función para ver todos los movimientos detallados
  function verMovimientosDetallados() {
    try {
      const movs = getMovs();

      if (movs.length === 0) {
        alert('No hay movimientos registrados');
        return;
      }

      mostrarMovimientosDetallados('TODAS LAS REFACCIONES', movs);
    } catch (e) {
      console.error('Error obteniendo todos los movimientos:', e);
      alert('Error al obtener los movimientos');
    }
  }

  // Función para cargar XLSX
  // Función para exportar movimientos de refacciones a Excel (sección de movimientos)
  // (Usa window.exportarDatosExcel de main.js)
  window.exportarMovimientosRefaccionesExcel = async function () {
    try {
      const movimientos = await getMovs();

      if (!movimientos || movimientos.length === 0) {
        alert('No hay movimientos para exportar.');
        return;
      }

      // Función auxiliar para formatear fechas
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

      // Función auxiliar para formatear tipo de movimiento
      function formatearMovimiento(tipo) {
        return tipo === 'entrada' ? 'Entrada' : tipo === 'salida' ? 'Salida' : tipo || '';
      }

      // Preparar datos para exportación con las columnas solicitadas
      const rows = movimientos.map(mov => ({
        Fecha: formatearFecha(mov.fecha),
        Tipo: formatearMovimiento(mov.tipo),
        Código: mov.cod || '',
        Descripción: mov.desc || '',
        Cantidad: mov.cant || 0,
        Observaciones: mov.obs || ''
      }));

      // Usar función base común
      await window.exportarDatosExcel({
        datos: rows,
        nombreArchivo: 'movimientos_refacciones',
        nombreHoja: 'Movimientos',
        mensajeVacio: 'No hay movimientos para exportar.'
      });
    } catch (error) {
      console.error('❌ Error exportando movimientos de refacciones:', error);
      alert('Error al exportar los movimientos');
    }
  };

  // Función para exportar existencias de refacciones a Excel
  window.exportarRefaccionesMovimientosExcel = async function () {
    try {
      console.log('📊 Exportando existencias de refacciones a Excel...');
      const stock = await getStockMap();

      if (!stock || Object.keys(stock).length === 0) {
        alert('No hay existencias para exportar.');
        return;
      }

      // Función auxiliar para formatear fechas
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

      // Preparar datos para exportación
      const rows = Object.keys(stock).map(codigo => {
        const item = stock[codigo];
        return {
          'Fecha Último Movimiento': formatearFecha(item.last),
          Código: codigo,
          Descripción: item.desc || '',
          Stock: item.qty || 0
        };
      });

      // Ordenar por código
      rows.sort((a, b) => a.Código.localeCompare(b.Código));

      // Usar función base común
      await window.exportarDatosExcel({
        datos: rows,
        nombreArchivo: 'refacciones_existencias',
        nombreHoja: 'Existencias Refacciones',
        mensajeVacio: 'No hay existencias para exportar.'
      });
    } catch (error) {
      console.error('❌ Error exportando movimientos de refacciones:', error);
      alert('Error al exportar los movimientos');
    }
  };

  // Función para descargar PDF del historial de una refacción
  window.descargarPDFHistorialRefaccion = async function (codigo) {
    console.log(`📄 Descargando PDF del historial de refacción: ${codigo}`);

    try {
      // Obtener información del stock
      const stock = await loadJSON(STOCK_KEY, {});
      const itemStock = stock[codigo];

      if (!itemStock) {
        alert('Refacción no encontrada');
        return;
      }

      // Obtener todos los movimientos de esta refacción
      const movimientos = await getMovs();
      const movimientosRefaccion = movimientos.filter(m => m.cod === codigo);

      // Ordenar movimientos por fecha (más antiguos primero)
      movimientosRefaccion.sort((a, b) => {
        const fechaA = new Date(a.fecha || 0).getTime();
        const fechaB = new Date(b.fecha || 0).getTime();
        return fechaA - fechaB;
      });

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

      // Función auxiliar para formatear fechas
      function formatearFecha(fechaStr) {
        if (!fechaStr) {
          return 'N/A';
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

      // Función auxiliar para obtener valor o 'N/A'
      function obtenerValor(valor) {
        return valor !== undefined && valor !== null && valor !== '' ? valor : 'N/A';
      }

      // Función auxiliar para formatear tipo de movimiento
      function formatearMovimiento(tipo) {
        return tipo === 'entrada' ? 'Entrada' : tipo === 'salida' ? 'Salida' : tipo || 'N/A';
      }

      // Obtener nombres de proveedores si están disponibles
      const proveedoresMap = {};
      if (window.configuracionManager) {
        try {
          const proveedores = window.configuracionManager.getProveedores();
          if (proveedores) {
            Object.keys(proveedores).forEach(rfc => {
              proveedoresMap[rfc] = proveedores[rfc].nombre || rfc;
            });
          }
        } catch (error) {
          console.warn('⚠️ Error obteniendo proveedores:', error);
        }
      }

      // Título
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('HISTORIAL DE REFACCIÓN', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Información del Producto
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL PRODUCTO', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      doc.text(`Código: ${obtenerValor(codigo)}`, col1X, yPosition);
      yPosition += 6;
      doc.text(`Descripción: ${obtenerValor(itemStock.desc)}`, col1X, yPosition);
      yPosition += 6;
      doc.text(`Stock Actual: ${itemStock.qty || 0}`, col1X, yPosition);
      yPosition += 6;
      doc.text(`Último Movimiento: ${formatearFecha(itemStock.last)}`, col1X, yPosition);
      yPosition += 10;

      // Historial de Movimientos
      if (movimientosRefaccion.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('HISTORIAL DE MOVIMIENTOS', margin, yPosition);
        yPosition += 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        // Calcular totales
        let totalEntradas = 0;
        let totalSalidas = 0;
        movimientosRefaccion.forEach(mov => {
          if (mov.tipo === 'entrada') {
            totalEntradas += mov.cant || 0;
          } else {
            totalSalidas += mov.cant || 0;
          }
        });

        doc.text(`Total Entradas: ${totalEntradas}`, col1X, yPosition);
        yPosition += 6;
        doc.text(`Total Salidas: ${totalSalidas}`, col1X, yPosition);
        yPosition += 6;
        doc.text(`Stock Final: ${totalEntradas - totalSalidas}`, col1X, yPosition);
        yPosition += 10;

        // Encabezados de tabla
        const _tableStartY = yPosition;
        const colWidths = [30, 30, 40, 30, 30, 30]; // Anchos aproximados
        const colPositions = [margin];
        for (let i = 1; i < colWidths.length; i++) {
          colPositions.push(colPositions[i - 1] + colWidths[i - 1]);
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Fecha', colPositions[0], yPosition);
        doc.text('Tipo', colPositions[1], yPosition);
        doc.text('Cant.', colPositions[2], yPosition);
        doc.text('Unidad', colPositions[3], yPosition);
        doc.text('Almacén', colPositions[4], yPosition);
        doc.text('Factura', colPositions[5], yPosition);
        yPosition += 6;

        // Línea separadora
        doc.setDrawColor(0, 0, 0);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;

        // Datos de movimientos
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        movimientosRefaccion.forEach((mov, index) => {
          // Verificar si necesitamos una nueva página
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;

            // Reimprimir encabezados
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text('Fecha', colPositions[0], yPosition);
            doc.text('Tipo', colPositions[1], yPosition);
            doc.text('Cant.', colPositions[2], yPosition);
            doc.text('Unidad', colPositions[3], yPosition);
            doc.text('Almacén', colPositions[4], yPosition);
            doc.text('Factura', colPositions[5], yPosition);
            yPosition += 6;
            doc.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
          }

          doc.text(formatearFecha(mov.fecha), colPositions[0], yPosition);
          doc.text(formatearMovimiento(mov.tipo), colPositions[1], yPosition);
          doc.text(String(mov.cant || 0), colPositions[2], yPosition);
          doc.text(obtenerValor(mov.unidad), colPositions[3], yPosition);
          doc.text(obtenerValor(mov.almacen), colPositions[4], yPosition);
          doc.text(obtenerValor(mov.factura), colPositions[5], yPosition);
          yPosition += 6;
        });

        yPosition += 5;

        // Información adicional de movimientos
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('DETALLES ADICIONALES', margin, yPosition);
        yPosition += 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        movimientosRefaccion.forEach((mov, index) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text(`Movimiento ${index + 1} - ${formatearFecha(mov.fecha)}`, margin, yPosition);
          yPosition += 6;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(`Tipo: ${formatearMovimiento(mov.tipo)}`, col1X, yPosition);
          yPosition += 5;
          doc.text(`Cantidad: ${mov.cant || 0} ${mov.unidad || ''}`, col1X, yPosition);
          yPosition += 5;
          if (mov.proveedor) {
            const nombreProveedor = proveedoresMap[mov.proveedor] || mov.proveedor;
            doc.text(`Proveedor: ${nombreProveedor}`, col1X, yPosition);
            yPosition += 5;
          }
          if (mov.almacen) {
            doc.text(`Almacén: ${mov.almacen}`, col1X, yPosition);
            yPosition += 5;
          }
          if (mov.factura) {
            doc.text(`Factura: ${mov.factura}`, col1X, yPosition);
            yPosition += 5;
          }
          if (mov.obs) {
            const splitObs = doc.splitTextToSize(
              `Observaciones: ${mov.obs}`,
              pageWidth - 2 * margin
            );
            doc.text(splitObs, col1X, yPosition);
            yPosition += splitObs.length * 4 + 3;
          }
          yPosition += 5;
        });
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('No hay movimientos registrados para esta refacción.', margin, yPosition);
      }

      // Guardar PDF
      const nombreArchivo = `Historial_${codigo}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nombreArchivo);

      console.log(`✅ PDF generado exitosamente: ${nombreArchivo}`);
      if (typeof window.showNotification === 'function') {
        window.showNotification('PDF generado exitosamente', 'success');
      }
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      alert('Error al generar el PDF');
    }
  };

  // Función para editar un movimiento
  async function editarMovimiento(movimientoId) {
    try {
      const movs = await getMovs();
      const movimiento = movs.find(m => String(m.id) === String(movimientoId));

      if (!movimiento) {
        alert('Movimiento no encontrado');
        return;
      }

      // Crear modal de edición
      const modalHtml = `
        <div class="modal fade" id="modalEditarMovimiento" tabindex="-1">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">
                  <i class="fas fa-edit"></i> Editar Movimiento
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <form id="formEditarMovimiento">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label">Código *</label>
                      <input type="text" id="edit_cod" class="form-control" value="${movimiento.cod || ''}" required>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Descripción *</label>
                      <input type="text" id="edit_desc" class="form-control" value="${movimiento.desc || ''}" required>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Movimiento *</label>
                      <select id="edit_tipo" class="form-select" required>
                        <option value="entrada" ${movimiento.tipo === 'entrada' ? 'selected' : ''}>Entrada</option>
                        <option value="salida" ${movimiento.tipo === 'salida' ? 'selected' : ''}>Salida</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Cantidad *</label>
                      <input type="number" id="edit_cant" class="form-control" value="${movimiento.cant || 0}" min="0" step="1" required>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Unidad *</label>
                      <select id="edit_unidad" class="form-select" required>
                        <option value="piezas" ${movimiento.unidad === 'piezas' ? 'selected' : ''}>Piezas</option>
                        <option value="pares" ${movimiento.unidad === 'pares' ? 'selected' : ''}>Pares</option>
                        <option value="litros" ${movimiento.unidad === 'litros' ? 'selected' : ''}>Litros</option>
                        <option value="paquete" ${movimiento.unidad === 'paquete' ? 'selected' : ''}>Paquete</option>
                        <option value="caja" ${movimiento.unidad === 'caja' ? 'selected' : ''}>Caja</option>
                        <option value="otro" ${movimiento.unidad === 'otro' ? 'selected' : ''}>Otro</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Fecha</label>
                      <input type="date" id="edit_fecha" class="form-control" value="${movimiento.fecha || ''}">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Factura</label>
                      <input type="text" id="edit_factura" class="form-control" value="${movimiento.factura || ''}">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Proveedor</label>
                      <select id="edit_proveedor" class="form-select">
                        <option value="">Seleccione proveedor...</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Almacén</label>
                      <select id="edit_almacen" class="form-select">
                        <option value="">Seleccione almacén...</option>
                      </select>
                    </div>
                    <div class="col-12">
                      <label class="form-label">Observaciones</label>
                      <textarea id="edit_obs" class="form-control" rows="2">${movimiento.obs || ''}</textarea>
                    </div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-warning" onclick="window.refaccionesUI.editarStockMinimo('${movimiento.cod || ''}')" title="Editar stock mínimo">
                  <i class="fas fa-exclamation-triangle"></i> Editar Stock Mínimo
                </button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary" onclick="window.refaccionesUI.guardarMovimientoEditado('${movimientoId}')">
                  <i class="fas fa-save"></i> Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Remover modal existente si existe
      const modalExistente = document.getElementById('modalEditarMovimiento');
      if (modalExistente) {
        modalExistente.remove();
      }

      // Agregar modal al DOM
      document.body.insertAdjacentHTML('beforeend', modalHtml);

      // Cargar proveedores y almacenes en los selects del modal de edición
      await loadProveedoresSelect('edit');
      await loadAlmacenesSelect('edit');

      // Establecer valores en los selects
      const editProveedor = document.getElementById('edit_proveedor');
      const editAlmacen = document.getElementById('edit_almacen');

      // Establecer valores del movimiento si existen
      if (editProveedor && movimiento.proveedor) {
        editProveedor.value = movimiento.proveedor;
      }

      if (editAlmacen && movimiento.almacen) {
        editAlmacen.value = movimiento.almacen;
      }

      // Mostrar modal
      const modal = new bootstrap.Modal(document.getElementById('modalEditarMovimiento'));
      modal.show();

      // Limpiar modal cuando se cierre
      document
        .getElementById('modalEditarMovimiento')
        .addEventListener('hidden.bs.modal', function () {
          this.remove();
        });
    } catch (error) {
      console.error('❌ Error editando movimiento:', error);
      alert('Error al cargar el movimiento para editar');
    }
  }

  // Función para guardar el movimiento editado
  async function guardarMovimientoEditado(movimientoId) {
    try {
      const form = document.getElementById('formEditarMovimiento');
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }

      const cod = document.getElementById('edit_cod')?.value.trim();
      const desc = document.getElementById('edit_desc')?.value.trim();
      const tipo = document.getElementById('edit_tipo')?.value;
      const cant = parseInt(document.getElementById('edit_cant')?.value || '0', 10);
      const unidad = document.getElementById('edit_unidad')?.value || 'piezas';
      const fecha = document.getElementById('edit_fecha')?.value;
      const factura = document.getElementById('edit_factura')?.value.trim() || '';
      const proveedor = document.getElementById('edit_proveedor')?.value || '';
      const almacen = document.getElementById('edit_almacen')?.value.trim() || '';
      const obs = document.getElementById('edit_obs')?.value.trim();

      if (!cod || !desc || !tipo || !cant || cant <= 0) {
        alert('Completa código, descripción, tipo y cantidad (>0)');
        return;
      }

      // Obtener fecha local si no se proporcionó
      let fechaFinal = fecha;
      if (!fechaFinal) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        fechaFinal = `${year}-${month}-${day}`;
      }

      // Obtener movimientos
      const movs = await getMovs();
      const movimientoIndex = movs.findIndex(m => String(m.id) === String(movimientoId));

      if (movimientoIndex === -1) {
        alert('Movimiento no encontrado');
        return;
      }

      // Actualizar movimiento
      movs[movimientoIndex] = {
        ...movs[movimientoIndex],
        cod,
        desc,
        tipo,
        cant,
        unidad,
        fecha: fechaFinal,
        factura,
        proveedor,
        almacen,
        obs
      };

      // Guardar movimientos actualizados
      await setMovs(movs);

      console.log('✅ Movimiento editado:', movs[movimientoIndex]);

      // Recalcular stock
      const stockRecalculado = await recalcularStockDesdeMovimientos();

      // Guardar stock en Firebase si cambió
      if (window.firebaseRepos?.inventario && stockRecalculado) {
        try {
          const stockAnterior = await getStockMap();
          for (const [codigo, stockData] of Object.entries(stockRecalculado)) {
            const stockAnteriorItem = stockAnterior[codigo];
            if (!stockAnteriorItem || stockAnteriorItem.qty !== stockData.qty) {
              try {
                await window.firebaseRepos.inventario.saveStock(codigo, {
                  ...stockData,
                  codigo: codigo
                });
              } catch (error) {
                console.warn(
                  `⚠️ Error guardando stock ${codigo} en Firebase:`,
                  error.message || error
                );
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Error guardando stock en Firebase:', error.message || error);
        }
      }

      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarMovimiento'));
      if (modal) {
        modal.hide();
      }

      // Refrescar tablas
      await refreshAll();

      alert('✅ Movimiento editado correctamente');
    } catch (error) {
      console.error('❌ Error guardando movimiento editado:', error);
      alert('Error al guardar los cambios');
    }
  }

  // Función para eliminar un movimiento
  async function eliminarMovimiento(movimientoId) {
    try {
      // Confirmar eliminación
      const confirmar = confirm(
        '¿Estás seguro de que deseas eliminar este movimiento? Esta acción no se puede deshacer.'
      );
      if (!confirmar) {
        return;
      }

      // Obtener movimientos
      const movs = await getMovs();
      const movimiento = movs.find(m => String(m.id) === String(movimientoId));

      if (!movimiento) {
        alert('Movimiento no encontrado');
        return;
      }

      // Eliminar movimiento del array
      const movsActualizados = movs.filter(m => String(m.id) !== String(movimientoId));

      // Guardar movimientos actualizados
      await setMovs(movsActualizados);

      console.log('✅ Movimiento eliminado:', movimiento);

      // Eliminar movimiento de Firebase si existe
      if (window.firebaseRepos?.inventario) {
        try {
          const movimientoIdFirebase = `movimiento_${movimientoId}`;
          await window.firebaseRepos.inventario.deleteMovimiento(movimientoIdFirebase);
          console.log('✅ Movimiento eliminado de Firebase');
        } catch (error) {
          console.warn('⚠️ Error eliminando movimiento de Firebase:', error);
          // Continuar de todas formas, ya se eliminó de localStorage
        }
      }

      // Recalcular stock
      const stockRecalculado = await recalcularStockDesdeMovimientos();

      // Guardar stock en Firebase si cambió
      if (window.firebaseRepos?.inventario && stockRecalculado) {
        try {
          const stockAnterior = await getStockMap();
          for (const [codigo, stockData] of Object.entries(stockRecalculado)) {
            const stockAnteriorItem = stockAnterior[codigo];
            if (!stockAnteriorItem || stockAnteriorItem.qty !== stockData.qty) {
              try {
                await window.firebaseRepos.inventario.saveStock(codigo, {
                  ...stockData,
                  codigo: codigo
                });
              } catch (error) {
                console.warn(
                  `⚠️ Error guardando stock ${codigo} en Firebase:`,
                  error.message || error
                );
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Error guardando stock en Firebase:', error.message || error);
        }
      }

      // Refrescar tablas
      await refreshAll();

      alert('✅ Movimiento eliminado correctamente');
    } catch (error) {
      console.error('❌ Error eliminando movimiento:', error);
      alert('Error al eliminar el movimiento');
    }
  }

  // Función para buscar datos del registro y llenar proveedor y almacén
  async function buscarDatosRegistro(prefijo = '', modoSilencioso = false) {
    try {
      const numeroRegistroInput = document.getElementById(
        `${prefijo ? `${prefijo}_` : ''}numeroRegistro`
      );
      if (!numeroRegistroInput) {
        if (!modoSilencioso) {
          alert('Campo de número de registro no encontrado');
        }
        return;
      }

      const numeroRegistro = numeroRegistroInput.value.trim();
      if (!numeroRegistro) {
        if (!modoSilencioso) {
          alert('Por favor ingrese un número de registro');
        }
        return;
      }

      console.log(`🔍 Buscando datos del registro ${numeroRegistro}...`);

      // Buscar en tráfico
      let datosRegistro = null;

      // Intentar desde Firebase primero
      if (window.firebaseRepos?.trafico) {
        try {
          const repo = window.firebaseRepos.trafico;
          const registro = await repo.get(numeroRegistro);
          if (registro) {
            datosRegistro = registro;
            console.log('✅ Registro encontrado en Firebase:', registro);
          }
        } catch (error) {
          console.warn('⚠️ Error buscando en Firebase:', error);
        }
      }

      // Si no se encontró en Firebase, buscar en localStorage
      if (!datosRegistro) {
        const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');

        // Buscar en tráfico
        if (sharedData.trafico && sharedData.trafico[numeroRegistro]) {
          datosRegistro = sharedData.trafico[numeroRegistro];
          console.log('✅ Registro encontrado en erp_shared_data.trafico:', datosRegistro);
        }
        // Buscar en logística
        else if (sharedData.logistica && sharedData.logistica[numeroRegistro]) {
          datosRegistro = sharedData.logistica[numeroRegistro];
          console.log('✅ Registro encontrado en erp_shared_data.logistica:', datosRegistro);
        }
        // Buscar en registros
        else if (sharedData.registros && sharedData.registros[numeroRegistro]) {
          datosRegistro = sharedData.registros[numeroRegistro];
          console.log('✅ Registro encontrado en erp_shared_data.registros:', datosRegistro);
        }
        // Fallback a erp_trafico
        else {
          const traficoData = JSON.parse(localStorage.getItem('erp_trafico') || '{}');
          if (traficoData[numeroRegistro]) {
            datosRegistro = traficoData[numeroRegistro];
            console.log('✅ Registro encontrado en erp_trafico:', datosRegistro);
          }
        }
      }

      if (!datosRegistro) {
        if (!modoSilencioso) {
          alert(`No se encontró el registro ${numeroRegistro}`);
        }
        return;
      }

      // Obtener proveedor y almacén del registro
      // Buscar proveedor en múltiples campos posibles (puede estar en logística o facturación)
      const proveedor =
        datosRegistro.proveedor ||
        datosRegistro.Proveedor ||
        datosRegistro.cliente ||
        datosRegistro.Cliente ||
        datosRegistro.nombreCliente ||
        datosRegistro.NombreCliente ||
        '';

      // Si no se encuentra en el registro de tráfico, buscar en logística asociada
      let proveedorFinal = proveedor;
      if (!proveedorFinal) {
        try {
          const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
          // Buscar en logística con el mismo número de registro
          if (sharedData.logistica && sharedData.logistica[numeroRegistro]) {
            const logisticaData = sharedData.logistica[numeroRegistro];
            proveedorFinal =
              logisticaData.cliente ||
              logisticaData.Cliente ||
              logisticaData.proveedor ||
              proveedorFinal;
            console.log('✅ Proveedor encontrado en logística:', proveedorFinal);
          }
          // Si el registro actual es de logística, usar directamente
          if (!proveedorFinal && datosRegistro.cliente) {
            proveedorFinal = datosRegistro.cliente || datosRegistro.Cliente;
          }
        } catch (e) {
          console.warn('Error buscando proveedor en logística:', e);
        }
      }

      // Buscar almacén en múltiples campos posibles
      const almacen =
        datosRegistro.almacen ||
        datosRegistro.Almacen ||
        datosRegistro.estancia ||
        datosRegistro.Estancia ||
        datosRegistro.destino ||
        datosRegistro.Destino ||
        datosRegistro.LugarDestino ||
        datosRegistro.lugarDestino ||
        '';

      // Llenar los campos
      const proveedorSelect = document.getElementById(`${prefijo ? `${prefijo}_` : ''}proveedor`);
      const almacenSelect = document.getElementById(`${prefijo ? `${prefijo}_` : ''}almacen`);

      // En modo silencioso, solo llenar campos que no estén ya establecidos
      const proveedorYaEstablecido =
        proveedorSelect && proveedorSelect.value && proveedorSelect.value.trim() !== '';
      const almacenYaEstablecido =
        almacenSelect && almacenSelect.value && almacenSelect.value.trim() !== '';

      if (proveedorSelect && proveedorFinal && (!modoSilencioso || !proveedorYaEstablecido)) {
        // Buscar la opción que coincida con el proveedor
        const opciones = Array.from(proveedorSelect.options);
        const opcionEncontrada = opciones.find(
          opt =>
            opt.text.toLowerCase().includes(proveedorFinal.toLowerCase()) ||
            opt.value.toLowerCase().includes(proveedorFinal.toLowerCase())
        );
        if (opcionEncontrada) {
          proveedorSelect.value = opcionEncontrada.value;
        } else {
          // Si no se encuentra, agregar como nueva opción temporal
          const nuevaOpcion = document.createElement('option');
          nuevaOpcion.value = proveedorFinal;
          nuevaOpcion.textContent = proveedorFinal;
          proveedorSelect.appendChild(nuevaOpcion);
          proveedorSelect.value = proveedorFinal;
        }
        console.log(`✅ Proveedor establecido: ${proveedorFinal}`);
      }

      if (almacenSelect && almacen && (!modoSilencioso || !almacenYaEstablecido)) {
        // Buscar la opción que coincida con el almacén
        const opciones = Array.from(almacenSelect.options);
        const opcionEncontrada = opciones.find(
          opt =>
            opt.text.toLowerCase().includes(almacen.toLowerCase()) ||
            opt.value.toLowerCase().includes(almacen.toLowerCase())
        );
        if (opcionEncontrada) {
          almacenSelect.value = opcionEncontrada.value;
        } else {
          // Si no se encuentra, agregar como nueva opción temporal
          const nuevaOpcion = document.createElement('option');
          nuevaOpcion.value = almacen;
          nuevaOpcion.textContent = almacen;
          almacenSelect.appendChild(nuevaOpcion);
          almacenSelect.value = almacen;
        }
        console.log(`✅ Almacén establecido: ${almacen}`);
      }

      // Solo mostrar alertas si no es modo silencioso
      if (!modoSilencioso) {
        if ((!proveedorSelect || !proveedorFinal) && (!almacenSelect || !almacen)) {
          alert(
            `Registro ${numeroRegistro} encontrado, pero no se encontraron datos de proveedor o almacén`
          );
        } else {
          const mensajes = [];
          if (proveedorSelect && proveedorFinal) {
            mensajes.push(`Proveedor: ${proveedorFinal}`);
          }
          if (almacenSelect && almacen) {
            mensajes.push(`Almacén: ${almacen}`);
          }
          if (mensajes.length > 0) {
            alert(
              `✅ Datos del registro ${numeroRegistro} cargados correctamente\n${mensajes.join('\n')}`
            );
          }
        }
      } else {
        // En modo silencioso, solo loguear
        const mensajes = [];
        if (proveedorSelect && proveedorFinal) {
          mensajes.push(`Proveedor: ${proveedorFinal}`);
        }
        if (almacenSelect && almacen) {
          mensajes.push(`Almacén: ${almacen}`);
        }
        if (mensajes.length > 0) {
          console.log(
            `✅ [Modo silencioso] Datos del registro ${numeroRegistro} cargados: ${mensajes.join(', ')}`
          );
        }
      }
    } catch (error) {
      console.error('❌ Error buscando datos del registro:', error);
      if (!modoSilencioso) {
        alert(`Error al buscar los datos del registro: ${error.message || error}`);
      }
    }
  }

  // Función para editar stock mínimo de una refacción
  async function editarStockMinimo(codigo) {
    try {
      const stock = await getStockMap();
      const item = stock[codigo];

      if (!item) {
        alert(`No se encontró la refacción ${codigo}`);
        return;
      }

      const stockMinimoActual =
        item.stockMinimo !== undefined && item.stockMinimo !== null
          ? parseInt(item.stockMinimo, 10)
          : 5;

      // Crear modal para editar stock mínimo
      const nuevoStockMinimo = prompt(
        `Editar Stock Mínimo para ${codigo}\n\n` +
          `Descripción: ${item.desc || 'Sin descripción'}\n` +
          `Stock Actual: ${item.qty || 0}\n` +
          `Stock Mínimo Actual: ${stockMinimoActual}\n\n` +
          'Ingrese el nuevo stock mínimo:',
        stockMinimoActual
      );

      if (nuevoStockMinimo === null) {
        return; // Usuario canceló
      }

      const nuevoValor = parseInt(nuevoStockMinimo, 10);
      if (isNaN(nuevoValor) || nuevoValor < 0) {
        alert('Por favor ingrese un número válido mayor o igual a 0');
        return;
      }

      // Actualizar stock mínimo en el stock
      stock[codigo].stockMinimo = nuevoValor;
      await setStockMap(stock);

      // Guardar en Firebase si está disponible
      if (window.firebaseRepos?.inventario) {
        try {
          await window.firebaseRepos.inventario.saveStock(codigo, {
            ...stock[codigo],
            codigo: codigo
          });
        } catch (error) {
          console.warn('⚠️ Error guardando stock mínimo en Firebase:', error);
        }
      }

      // Actualizar la vista
      await refreshAll();

      // Actualizar alertas
      await actualizarAlertasStockBajo();

      alert(`✅ Stock mínimo actualizado para ${codigo}: ${nuevoValor}`);
    } catch (error) {
      console.error('❌ Error editando stock mínimo:', error);
      alert(`Error al editar el stock mínimo: ${error.message || error}`);
    }
  }

  window.refaccionesUI = {
    registrarMovimiento,
    aplicarFiltros,
    aplicarFiltrosUnificados,
    limpiarFiltrosUnificados,
    refreshProveedores: loadProveedoresSelect,
    refreshAlmacenes: loadAlmacenesSelect,
    refreshAll: refreshAll,
    verMovimientosRefaccion,
    verMovimientosDetallados,
    editarMovimiento,
    guardarMovimientoEditado,
    eliminarMovimiento,
    editarStockMinimo,
    buscarDatosRegistro
  };

  // Función para actualizar alertas de stock bajo
  async function actualizarAlertasStockBajo() {
    try {
      const contenedor = document.getElementById('alertasStockBajo');
      const badge = document.getElementById('badgeStockBajo');
      if (!contenedor) {
        return;
      }

      const stock = await getStockMap();
      const umbralPorDefecto = 5; // Umbral por defecto si no hay stock mínimo definido

      const refaccionesStockBajo = [];
      Object.keys(stock).forEach(codigo => {
        const item = stock[codigo];
        const cantidad = item.qty || 0;
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
              descripcion: item.desc || 'Sin descripción',
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
              descripcion: item.desc || 'Sin descripción',
              cantidad: cantidad,
              stockMinimo: stockMinimo,
              unidad: item.unidad || 'piezas'
            });
          }
        }
      });

      // Ordenar por cantidad (menor primero), luego por diferencia con stock mínimo
      refaccionesStockBajo.sort((a, b) => {
        const diferenciaA = a.cantidad - a.stockMinimo;
        const diferenciaB = b.cantidad - b.stockMinimo;
        if (diferenciaA !== diferenciaB) {
          return diferenciaA - diferenciaB; // Ordenar por diferencia (más crítico primero)
        }
        return a.cantidad - b.cantidad; // Si la diferencia es igual, ordenar por cantidad
      });

      // Actualizar badge
      if (badge) {
        const cantidad = refaccionesStockBajo.length;
        badge.textContent = cantidad;
        // Actualizar clases según el valor
        badge.className = 'badge ms-2'; // Resetear clases
        if (cantidad === 0) {
          badge.classList.add('bg-success', 'text-white');
        } else {
          badge.classList.add('bg-danger', 'text-white');
        }
      }

      // Generar HTML
      if (refaccionesStockBajo.length === 0) {
        contenedor.innerHTML = `
          <div class="alert alert-success mb-0">
            <i class="fas fa-check-circle"></i> No hay refacciones con stock bajo. Todo está en orden.
          </div>
        `;
      } else {
        contenedor.innerHTML = `
          <div class="table-responsive">
            <table class="table table-sm table-hover">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descripción</th>
                  <th class="text-center">Stock Actual</th>
                  <th class="text-center">Stock Mínimo</th>
                  <th class="text-center">Diferencia</th>
                  <th class="text-center">Unidad</th>
                </tr>
              </thead>
              <tbody>
                ${refaccionesStockBajo
    .map(ref => {
      const diferencia = ref.cantidad - ref.stockMinimo;
      const esCritico = ref.cantidad === 0;
      const esBajo = diferencia < 0;
      const filaClass = esCritico
        ? 'table-danger'
        : esBajo
          ? 'table-warning'
          : 'table-info';
      const badgeClass = esCritico
        ? 'bg-danger text-white'
        : esBajo
          ? 'bg-warning'
          : 'bg-info text-white';
      const diferenciaTexto = diferencia < 0 ? `${diferencia}` : `+${diferencia}`;
      const diferenciaClass = diferencia < 0 ? 'text-danger fw-bold' : 'text-success';

      return `
                  <tr class="${filaClass}">
                    <td><strong>${ref.codigo}</strong></td>
                    <td>${ref.descripcion}</td>
                    <td class="text-center">
                      <span class="badge ${badgeClass}">${ref.cantidad}</span>
                    </td>
                    <td class="text-center">
                      <span class="badge bg-secondary text-white">${ref.stockMinimo}</span>
                    </td>
                    <td class="text-center">
                      <span class="${diferenciaClass}">${diferenciaTexto}</span>
                    </td>
                    <td class="text-center">${ref.unidad}</td>
                  </tr>
                `;
    })
    .join('')}
              </tbody>
            </table>
          </div>
          <div class="mt-2">
            <small class="text-muted">
              <i class="fas fa-info-circle"></i> 
              Se muestran las refacciones cuyo stock actual es menor o igual al stock mínimo configurado. 
              ${
  refaccionesStockBajo.filter(
    r => r.stockMinimo === umbralPorDefecto && (r.stockMinimo === 5 || !r.stockMinimo)
  ).length > 0
    ? `Algunas refacciones usan el umbral por defecto de ${umbralPorDefecto} unidades (no tienen stock mínimo configurado).`
    : ''
  }
            </small>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error actualizando alertas de stock bajo:', error);
      const contenedor = document.getElementById('alertasStockBajo');
      if (contenedor) {
        contenedor.innerHTML = `
          <div class="alert alert-danger mb-0">
            <i class="fas fa-exclamation-triangle"></i> Error al cargar las alertas de stock bajo.
          </div>
        `;
      }
    }
  }

  // Agregar la función al objeto window.inventarioUI
  window.inventarioUI.actualizarAlertasStockBajo = actualizarAlertasStockBajo;
})();

// ===== Inventario - General (Patios y Rotación) =====
(function () {
  function _getStockByAlmacen() {
    const _stock = JSON.parse(localStorage.getItem('erp_inv_refacciones_stock') || '{}');
    const movs = JSON.parse(localStorage.getItem('erp_inv_refacciones_movs') || '[]');
    // Recalcular stock por almacén desde movimientos
    const porAlmacen = {};
    movs.forEach(m => {
      const alm = (m.almacen || '').toLowerCase();
      if (!alm) {
        return;
      }
      porAlmacen[alm] = porAlmacen[alm] || {};
      const cur = porAlmacen[alm][m.cod] || { desc: m.desc, qty: 0 };
      cur.desc = m.desc;
      cur.qty += m.tipo === 'entrada' ? m.cant : -m.cant;
      if (cur.qty < 0) {
        cur.qty = 0;
      }
      porAlmacen[alm][m.cod] = cur;
    });
    return porAlmacen;
  }

  function renderPatio(tbodyId, data) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) {
      return;
    }
    tbody.innerHTML = '';
    // data aquí será una lista de plataformas (placas como key) para patios
    (data || []).forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.plataforma}</td><td>${r.placas}</td><td>${r.tipo}</td><td>${r.ubicacionActual}</td><td>${r.ultimoMovimiento}</td>`;
      tbody.appendChild(tr);
    });
  }

  function computeTopRotacion(limit = 10) {
    const movs = JSON.parse(localStorage.getItem('erp_inv_refacciones_movs') || '[]');
    const stockMap = JSON.parse(localStorage.getItem('erp_inv_refacciones_stock') || '{}');
    const stats = {};
    movs.forEach(m => {
      const k = m.cod;
      const st = stats[k] || { desc: m.desc, movs: 0, total: 0, last: null };
      st.desc = m.desc;
      st.movs += 1;
      st.total += m.cant;
      const t = new Date(m.fecha).getTime();
      const lt = st.last ? new Date(st.last).getTime() : 0;
      if (t > lt) {
        st.last = m.fecha;
      }
      stats[k] = st;
    });
    return Object.keys(stats)
      .map(k => ({ cod: k, ...stats[k], stock: stockMap[k]?.qty || 0 }))
      .sort((a, b) => b.movs - a.movs || b.total - a.total)
      .slice(0, limit);
  }

  function renderTopRotacion() {
    const tbody = document.getElementById('tbodyGenTopRotacion');
    if (!tbody) {
      return;
    }
    const rows = computeTopRotacion(10);
    tbody.innerHTML = '';
    rows.forEach((r, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${r.cod}</td>
        <td>${r.desc || '-'}</td>
        <td>${r.movs}</td>
        <td>${r.stock ?? 0}</td>
        <td>${r.last ? window.formatearFechaMovimiento(r.last) : '-'}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  async function renderGeneral() {
    console.log('🔍 Renderizando inventario general...');
    // Derivar plataformas y filtrar por ubicación actual
    const plataformas = await window.InventarioUtils.derivePlataformasMovements();
    console.log('📦 Plataformas encontradas:', plataformas);

    const pachuca = plataformas.filter(p =>
      (p.ubicacionActual || '').toLowerCase().includes('pachuca')
    );
    const sahagun = plataformas.filter(p =>
      (p.ubicacionActual || '').toLowerCase().includes('sahagun')
    );

    console.log('🏢 Patio Pachuca:', pachuca);
    console.log('🏢 Patio Sahagún:', sahagun);

    renderPatio('tbodyGenPachuca', pachuca);
    renderPatio('tbodyGenSahagun', sahagun);
    renderTopRotacion();
  }

  window.inventarioGeneral = { renderGeneral };
})();

// ===== Función Global de Inicialización =====
(function () {
  function initializeInventory() {
    console.log('🚀 Inicializando inventario completo...');

    // Cargar plataforma
    try {
      if (window.inventarioUI && window.inventarioUI.aplicarFiltros) {
        window.inventarioUI.aplicarFiltros();
      }
    } catch (e) {
      console.error('Error cargando plataforma:', e);
    }

    // Cargar refacciones
    try {
      if (window.refaccionesUI && window.refaccionesUI.refreshAll) {
        window.refaccionesUI.refreshAll();
      }
    } catch (e) {
      console.error('Error cargando refacciones:', e);
    }

    // Cargar general
    try {
      if (window.inventarioGeneral && window.inventarioGeneral.renderGeneral) {
        window.inventarioGeneral.renderGeneral();
      }
    } catch (e) {
      console.error('Error cargando general:', e);
    }
  }

  // Exponer función global
  window.initializeInventory = initializeInventory;

  // Función de diagnóstico para comparar datos entre localStorage y Firebase
  window.diagnosticarInventario = async function () {
    console.log('🔍 ===== DIAGNÓSTICO DE INVENTARIO =====');
    console.log('');

    try {
      // 1. Verificar datos en localStorage
      console.log('📦 1. DATOS EN LOCALSTORAGE:');
      const stockLocal = JSON.parse(localStorage.getItem(STOCK_KEY) || '{}');
      const movsLocal = JSON.parse(localStorage.getItem(MOVS_KEY) || '[]');

      const codigosLocal = Object.keys(stockLocal);
      console.log(`   - Stock: ${codigosLocal.length} refacciones`);
      codigosLocal.forEach(codigo => {
        const item = stockLocal[codigo];
        console.log(
          `     • ${codigo}: ${item.desc || 'Sin descripción'} - Stock: ${item.qty || 0}`
        );
      });
      console.log(`   - Movimientos: ${movsLocal.length} registros`);
      console.log('');

      // 2. Verificar datos en Firebase
      console.log('☁️ 2. DATOS EN FIREBASE:');
      const stockFirebase = {};
      let movsFirebase = [];

      if (window.firebaseRepos?.inventario) {
        try {
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.inventario.db || !window.firebaseRepos.inventario.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500));
            await window.firebaseRepos.inventario.init();
          }

          if (window.firebaseRepos.inventario.db && window.firebaseRepos.inventario.tenantId) {
            const stockArray = await window.firebaseRepos.inventario.getAllStock();
            if (stockArray && stockArray.length > 0) {
              stockArray.forEach(item => {
                if (item.codigo) {
                  stockFirebase[item.codigo] = {
                    desc: item.desc || item.descripcion,
                    qty: item.qty || item.cantidad || 0,
                    last: item.last || item.ultimaActualizacion
                  };
                }
              });
            }

            if (window.firebaseRepos?.inventario) {
              const repoInventario = window.firebaseRepos.inventario;
              if (repoInventario.db && repoInventario.tenantId) {
                movsFirebase = (await repoInventario.getAllMovimientos()) || [];
              }
            }
          }
        } catch (error) {
          console.warn('   ⚠️ Error accediendo a Firebase:', error.message);
        }
      }

      const codigosFirebase = Object.keys(stockFirebase);
      console.log(`   - Stock: ${codigosFirebase.length} refacciones`);
      codigosFirebase.forEach(codigo => {
        const item = stockFirebase[codigo];
        console.log(
          `     • ${codigo}: ${item.desc || 'Sin descripción'} - Stock: ${item.qty || 0}`
        );
      });
      console.log(`   - Movimientos: ${movsFirebase.length} registros`);
      console.log('');

      // 3. Comparar y detectar diferencias
      console.log('🔍 3. ANÁLISIS DE DIFERENCIAS:');
      const soloEnLocal = codigosLocal.filter(c => !codigosFirebase.includes(c));
      const soloEnFirebase = codigosFirebase.filter(c => !codigosLocal.includes(c));
      const enAmbos = codigosLocal.filter(c => codigosFirebase.includes(c));

      if (soloEnLocal.length > 0) {
        console.log(`   ⚠️ Refacciones SOLO en localStorage (${soloEnLocal.length}):`);
        soloEnLocal.forEach(codigo => {
          const item = stockLocal[codigo];
          console.log(
            `     • ${codigo}: ${item.desc || 'Sin descripción'} - Stock: ${item.qty || 0}`
          );
        });
      } else {
        console.log('   ✅ No hay refacciones solo en localStorage');
      }

      if (soloEnFirebase.length > 0) {
        console.log(`   ⚠️ Refacciones SOLO en Firebase (${soloEnFirebase.length}):`);
        soloEnFirebase.forEach(codigo => {
          const item = stockFirebase[codigo];
          console.log(
            `     • ${codigo}: ${item.desc || 'Sin descripción'} - Stock: ${item.qty || 0}`
          );
        });
      } else {
        console.log('   ✅ No hay refacciones solo en Firebase');
      }

      if (enAmbos.length > 0) {
        console.log(`   ✅ Refacciones en ambos (${enAmbos.length}):`);
        enAmbos.forEach(codigo => {
          const local = stockLocal[codigo];
          const firebase = stockFirebase[codigo];
          const difStock = (local.qty || 0) - (firebase.qty || 0);
          if (difStock !== 0) {
            console.log(
              `     ⚠️ ${codigo}: Stock local=${local.qty || 0}, Firebase=${firebase.qty || 0} (diferencia: ${difStock})`
            );
          } else {
            console.log(`     • ${codigo}: Stock=${local.qty || 0} (coincide)`);
          }
        });
      }
      console.log('');

      // 4. Recomendaciones
      console.log('💡 4. RECOMENDACIONES:');
      if (soloEnLocal.length > 0) {
        console.log(
          `   🔧 Hay ${soloEnLocal.length} refacciones en localStorage que no están en Firebase.`
        );
        console.log('   💾 Ejecuta: window.fusionarInventarioAFirebase() para sincronizar');
      }
      if (soloEnFirebase.length > 0 && codigosLocal.length === 0) {
        console.log('   ⚠️ Firebase tiene datos pero localStorage está vacío.');
        console.log('   🔄 Los datos de Firebase se cargarán automáticamente.');
      }
      if (soloEnLocal.length === 0 && soloEnFirebase.length === 0 && enAmbos.length > 0) {
        console.log('   ✅ Los datos están sincronizados correctamente.');
      }
      console.log('');

      console.log('🔍 ===== FIN DEL DIAGNÓSTICO =====');

      return {
        local: { stock: codigosLocal.length, movs: movsLocal.length },
        firebase: { stock: codigosFirebase.length, movs: movsFirebase.length },
        soloEnLocal: soloEnLocal,
        soloEnFirebase: soloEnFirebase,
        enAmbos: enAmbos
      };
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      return { error: error.message };
    }
  };

  // Función para fusionar datos de localStorage a Firebase
  window.fusionarInventarioAFirebase = async function () {
    console.log('🔄 ===== FUSIONANDO INVENTARIO A FIREBASE =====');

    try {
      const stockLocal = JSON.parse(localStorage.getItem(STOCK_KEY) || '{}');
      const codigosLocal = Object.keys(stockLocal);

      if (codigosLocal.length === 0) {
        console.log('⚠️ No hay datos en localStorage para fusionar');
        return { success: false, message: 'No hay datos en localStorage' };
      }

      if (!window.firebaseRepos?.inventario) {
        console.log('❌ Repositorio de Firebase no disponible');
        return { success: false, message: 'Firebase no disponible' };
      }

      // Esperar a que Firebase esté listo
      let attempts = 0;
      while (
        attempts < 10 &&
        (!window.firebaseRepos.inventario.db || !window.firebaseRepos.inventario.tenantId)
      ) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 500));
        await window.firebaseRepos.inventario.init();
      }

      if (!window.firebaseRepos.inventario.db || !window.firebaseRepos.inventario.tenantId) {
        console.log('❌ No se pudo inicializar Firebase');
        return { success: false, message: 'Firebase no inicializado' };
      }

      let guardados = 0;
      let errores = 0;

      console.log(`📤 Fusionando ${codigosLocal.length} refacciones a Firebase...`);

      for (const [codigo, stockData] of Object.entries(stockLocal)) {
        try {
          await window.firebaseRepos.inventario.saveStock(codigo, {
            ...stockData,
            codigo: codigo
          });
          guardados++;
          console.log(`   ✅ ${codigo}: ${stockData.desc || 'Sin descripción'}`);
          // Pequeño delay para evitar sobrecargar Firebase
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          errores++;
          console.warn(`   ⚠️ Error guardando ${codigo}:`, error.message || error);
        }
      }

      console.log('');
      console.log(`✅ Fusion completada: ${guardados} guardados, ${errores} errores`);
      console.log('🔄 ===== FIN DE FUSIÓN =====');

      return { success: true, guardados, errores };
    } catch (error) {
      console.error('❌ Error en fusión:', error);
      return { success: false, error: error.message };
    }
  };

  // Auto-inicializar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => initializeInventory(), 200); // Delay para asegurar que todos los módulos estén cargados
  });
})();
