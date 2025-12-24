// ===== TESORERÍA: ESTADO DE CUENTA BANCARIO =====

(function () {
  'use strict';

  // Variable global para almacenar los datos del estado de cuenta actual
  window._estadoCuentaActual = null;

  // ===== FUNCIÓN: Obtener saldo inicial base de una cuenta bancaria (desde configuración) =====
  async function obtenerSaldoInicialBase(numeroCuenta) {
    try {
      let cuentasBancarias = [];

      // PRIORIDAD 1: Cargar desde Firebase
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

      // PRIORIDAD 2: Cargar desde localStorage/configuracionManager
      if (cuentasBancarias.length === 0 && window.configuracionManager) {
        cuentasBancarias = window.configuracionManager.getCuentasBancarias() || [];
      }

      // Buscar la cuenta específica
      const cuenta = cuentasBancarias.find(c => c.numeroCuenta === numeroCuenta);
      if (cuenta) {
        const saldoInicial = parseFloat(cuenta.saldoInicial || 0) || 0;
        return {
          saldoInicial: saldoInicial,
          moneda: cuenta.moneda || 'MXN',
          banco: cuenta.banco || '',
          numeroCuenta: cuenta.numeroCuenta || numeroCuenta
        };
      }

      return {
        saldoInicial: 0,
        moneda: 'MXN',
        banco: '',
        numeroCuenta: numeroCuenta
      };
    } catch (error) {
      console.error('❌ Error obteniendo saldo inicial:', error);
      return {
        saldoInicial: 0,
        moneda: 'MXN',
        banco: '',
        numeroCuenta: numeroCuenta
      };
    }
  }

  // ===== FUNCIÓN: Calcular saldo final del periodo anterior =====
  async function calcularSaldoFinalPeriodoAnterior(numeroCuenta, fechaDesde) {
    try {
      // Obtener saldo inicial base desde configuración
      const infoCuentaBase = await obtenerSaldoInicialBase(numeroCuenta);
      let saldoAcumulado = infoCuentaBase.saldoInicial;

      // Si no hay fechaDesde, el saldo inicial es el base
      if (!fechaDesde) {
        return saldoAcumulado;
      }

      // Obtener todos los movimientos hasta fechaDesde (periodo anterior)
      let movimientos = [];

      // Cargar todos los movimientos
      if (window.firebaseRepos && window.firebaseRepos.tesoreria) {
        try {
          const repoTesoreria = window.firebaseRepos.tesoreria;

          // Esperar inicialización
          let attempts = 0;
          while (attempts < 10 && (!repoTesoreria.db || !repoTesoreria.tenantId)) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 300));
            if (typeof repoTesoreria.init === 'function') {
              try {
                await repoTesoreria.init();
              } catch (e) {
                // Ignorar error intencionalmente
              }
            }
          }

          if (repoTesoreria.db && repoTesoreria.tenantId) {
            movimientos = await repoTesoreria.getAllMovimientos();
          }
        } catch (error) {
          console.warn('⚠️ Error cargando movimientos desde Firebase:', error);
        }
      }

      if (
        movimientos.length === 0 &&
        window.tesoreriaMovimientosUI &&
        window.tesoreriaMovimientosUI.movimientosManager
      ) {
        movimientos = await window.tesoreriaMovimientosUI.movimientosManager.getMovimientos();
      }

      // Filtrar movimientos que afectan la cuenta y que son anteriores a fechaDesde
      const fechaDesdeObj = new Date(`${fechaDesde}T00:00:00`);
      fechaDesdeObj.setHours(0, 0, 0, 0);

      const movimientosAnteriores = movimientos.filter(mov => {
        // Verificar que afecte la cuenta (misma lógica que en filtrarMovimientosPorCuenta)
        const origen = mov.origen || '';
        let afectaCuenta = false;

        if (
          origen === 'CXC' ||
          origen === 'cxc' ||
          mov.categoria === 'Cuentas por Cobrar' ||
          (mov.descripcion && mov.descripcion.includes('[CXC]'))
        ) {
          afectaCuenta = true;
        } else if (
          origen === 'CXP' ||
          origen === 'cxp' ||
          mov.categoria === 'Cuentas por Pagar' ||
          (mov.descripcion && mov.descripcion.includes('[CXP]'))
        ) {
          afectaCuenta = true;
        } else {
          const esOrigen = mov.cuentaOrigen === numeroCuenta;
          const esDestino = mov.cuentaDestino === numeroCuenta;
          afectaCuenta = esOrigen || esDestino;
        }

        if (!afectaCuenta) {
          return false;
        }

        // Verificar que sea anterior a fechaDesde
        const fechaMov = mov.fecha || mov.fechaCreacion || mov.fechaPago;
        if (!fechaMov) {
          return false;
        }

        let fechaMovimiento = null;
        try {
          if (typeof fechaMov === 'string') {
            if (/^\d{4}-\d{2}-\d{2}/.test(fechaMov)) {
              fechaMovimiento = new Date(`${fechaMov.split('T')[0]}T00:00:00`);
            } else if (fechaMov.includes('T')) {
              fechaMovimiento = new Date(fechaMov);
            } else {
              fechaMovimiento = new Date(fechaMov);
            }
          } else {
            fechaMovimiento = new Date(fechaMov);
          }
          fechaMovimiento.setHours(0, 0, 0, 0);
        } catch (e) {
          console.warn('⚠️ Error parseando fecha:', fechaMov, e);
          return false;
        }

        // Incluir solo movimientos anteriores a fechaDesde (estrictamente menor)
        return fechaMovimiento < fechaDesdeObj;
      });

      // Ordenar movimientos por fecha
      movimientosAnteriores.sort((a, b) => {
        const fechaA = new Date(a.fecha || a.fechaCreacion || 0);
        const fechaB = new Date(b.fecha || b.fechaCreacion || 0);
        return fechaA - fechaB;
      });

      // Calcular saldo acumulado hasta fechaDesde
      movimientosAnteriores.forEach(mov => {
        const monto = parseFloat(mov.monto || 0) || 0;

        // PRIORIDAD 1: Si el movimiento tiene un tipo explícito (ingreso/egreso), usarlo
        const tipoMovimiento = (mov.tipo || '').toLowerCase();
        if (tipoMovimiento === 'ingreso') {
          // Movimientos de tipo 'ingreso' son siempre entradas
          saldoAcumulado += monto;
        } else if (tipoMovimiento === 'egreso') {
          // Movimientos de tipo 'egreso' son siempre salidas
          saldoAcumulado -= monto;
        } else {
          // PRIORIDAD 2: Determinar según el origen del movimiento
          let origen = mov.origen || '';

          // Detectar origen si no está definido
          if (!origen) {
            if (
              mov.categoria === 'Cuentas por Cobrar' ||
              (mov.descripcion && mov.descripcion.includes('[CXC]'))
            ) {
              origen = 'CXC';
            } else if (
              mov.categoria === 'Cuentas por Pagar' ||
              (mov.descripcion && mov.descripcion.includes('[CXP]'))
            ) {
              origen = 'CXP';
            }
          }

          if (origen === 'CXC' || origen === 'cxc') {
            saldoAcumulado += monto;
          } else if (origen === 'CXP' || origen === 'cxp') {
            saldoAcumulado -= monto;
          } else {
            // PRIORIDAD 3: Para otros movimientos, determinar por cuenta bancaria
            const cuentaEsDestino = mov.cuentaDestino && mov.cuentaDestino === numeroCuenta;
            const cuentaEsOrigen = mov.cuentaOrigen && mov.cuentaOrigen === numeroCuenta;

            if (cuentaEsDestino && !cuentaEsOrigen) {
              saldoAcumulado += monto;
            } else if (cuentaEsOrigen && !cuentaEsDestino) {
              saldoAcumulado -= monto;
            }
          }
        }
      });

      console.log(
        `💰 Saldo final del periodo anterior (hasta ${fechaDesde}): $${saldoAcumulado.toFixed(2)} (${movimientosAnteriores.length} movimientos procesados)`
      );
      return saldoAcumulado;
    } catch (error) {
      console.error('❌ Error calculando saldo final del periodo anterior:', error);
      // En caso de error, usar saldo inicial base
      const infoCuentaBase = await obtenerSaldoInicialBase(numeroCuenta);
      return infoCuentaBase.saldoInicial;
    }
  }

  // ===== FUNCIÓN: Obtener saldo inicial de la cuenta (incluye cálculo de periodo anterior) =====
  async function obtenerSaldoInicial(numeroCuenta, fechaDesde) {
    // Si hay fechaDesde, calcular el saldo final del periodo anterior
    if (fechaDesde) {
      const infoCuentaBase = await obtenerSaldoInicialBase(numeroCuenta);
      const saldoFinalAnterior = await calcularSaldoFinalPeriodoAnterior(numeroCuenta, fechaDesde);

      return {
        saldoInicial: saldoFinalAnterior,
        moneda: infoCuentaBase.moneda,
        banco: infoCuentaBase.banco,
        numeroCuenta: numeroCuenta
      };
    }

    // Si no hay fechaDesde, usar saldo inicial base
    return obtenerSaldoInicialBase(numeroCuenta);
  }

  // ===== FUNCIÓN: Filtrar movimientos por cuenta bancaria =====
  async function filtrarMovimientosPorCuenta(numeroCuenta, fechaDesde, fechaHasta, banco) {
    console.log('🔍 filtrarMovimientosPorCuenta llamada:', {
      numeroCuenta: numeroCuenta,
      fechaDesde: fechaDesde,
      fechaHasta: fechaHasta,
      banco: banco
    });

    try {
      let movimientos = [];

      // PRIORIDAD 1: Cargar desde Firebase
      if (window.firebaseRepos && window.firebaseRepos.tesoreria) {
        try {
          const repoTesoreria = window.firebaseRepos.tesoreria;

          // Esperar inicialización
          let attempts = 0;
          while (attempts < 10 && (!repoTesoreria.db || !repoTesoreria.tenantId)) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 300));
            if (typeof repoTesoreria.init === 'function') {
              try {
                await repoTesoreria.init();
              } catch (e) {
                // Ignorar error intencionalmente
              }
            }
          }

          if (repoTesoreria.db && repoTesoreria.tenantId) {
            movimientos = await repoTesoreria.getAllMovimientos();
            console.log(`📊 ${movimientos.length} movimientos cargados desde Firebase`);

            // Log para depuración: contar por origen
            const movsCXC = movimientos.filter(m => m.origen === 'CXC');
            const movsCXP = movimientos.filter(m => m.origen === 'CXP');
            console.log(
              `   - CXC: ${movsCXC.length}, CXP: ${movsCXP.length}, Otros: ${movimientos.length - movsCXC.length - movsCXP.length}`
            );
          }
        } catch (error) {
          console.warn('⚠️ Error cargando movimientos desde Firebase:', error);
        }
      }

      // PRIORIDAD 2: Cargar desde localStorage
      if (
        movimientos.length === 0 &&
        window.tesoreriaMovimientosUI &&
        window.tesoreriaMovimientosUI.movimientosManager
      ) {
        movimientos = await window.tesoreriaMovimientosUI.movimientosManager.getMovimientos();
        console.log(`📊 ${movimientos.length} movimientos cargados desde localStorage`);

        // Log para depuración: contar por origen
        const movsCXC = movimientos.filter(m => m.origen === 'CXC');
        const movsCXP = movimientos.filter(m => m.origen === 'CXP');
        console.log(
          `   - CXC: ${movsCXC.length}, CXP: ${movsCXP.length}, Otros: ${movimientos.length - movsCXC.length - movsCXP.length}`
        );
      }

      if (movimientos.length === 0) {
        console.warn('⚠️ No se encontraron movimientos para filtrar');
        return [];
      }

      console.log(
        `🔍 Filtrando ${movimientos.length} movimiento(s) por cuenta bancaria ${numeroCuenta}...`
      );

      // Filtrar movimientos que afectan la cuenta bancaria
      const movimientosFiltrados = movimientos.filter(mov => {
        // Detectar origen del movimiento (puede venir en diferentes campos)
        let origen = mov.origen || '';

        // Si no tiene origen, intentar detectarlo por categoría o descripción
        if (!origen) {
          if (
            mov.categoria === 'Cuentas por Cobrar' ||
            (mov.descripcion && mov.descripcion.includes('[CXC]'))
          ) {
            origen = 'CXC';
          } else if (
            mov.categoria === 'Cuentas por Pagar' ||
            (mov.descripcion && mov.descripcion.includes('[CXP]'))
          ) {
            origen = 'CXP';
          }
        }

        // Verificar si el movimiento afecta la cuenta bancaria
        let afectaCuenta = false;

        if (origen === 'CXC' || origen === 'cxc') {
          // CXC son entradas (ingresos) - incluir TODOS los movimientos de CXC
          afectaCuenta = true;
        } else if (origen === 'CXP' || origen === 'cxp') {
          // CXP son salidas (egresos) - incluir TODOS los movimientos de CXP
          afectaCuenta = true;
        } else {
          // Para otros movimientos, verificar si la cuenta aparece como origen o destino
          const esOrigen = mov.cuentaOrigen === numeroCuenta;
          const esDestino = mov.cuentaDestino === numeroCuenta;
          afectaCuenta = esOrigen || esDestino;
        }

        // Si no afecta la cuenta, descartar
        if (!afectaCuenta) {
          return false;
        }

        // Filtrar por fecha si se proporcionan
        if (fechaDesde || fechaHasta) {
          const fechaMov = mov.fecha || mov.fechaCreacion || mov.fechaPago;
          if (!fechaMov) {
            return false;
          }

          let fechaMovimiento = null;
          try {
            if (typeof fechaMov === 'string') {
              if (/^\d{4}-\d{2}-\d{2}/.test(fechaMov)) {
                fechaMovimiento = new Date(`${fechaMov.split('T')[0]}T00:00:00`);
              } else if (fechaMov.includes('T')) {
                fechaMovimiento = new Date(fechaMov);
              } else {
                fechaMovimiento = new Date(fechaMov);
              }
            } else {
              fechaMovimiento = new Date(fechaMov);
            }
          } catch (e) {
            console.warn('⚠️ Error parseando fecha:', fechaMov, e);
            return false;
          }

          if (fechaDesde) {
            const fechaDesdeObj = new Date(`${fechaDesde}T00:00:00`);
            fechaDesdeObj.setHours(0, 0, 0, 0);
            fechaMovimiento.setHours(0, 0, 0, 0);
            if (fechaMovimiento < fechaDesdeObj) {
              return false;
            }
          }

          if (fechaHasta) {
            const fechaHastaObj = new Date(`${fechaHasta}T23:59:59`);
            fechaHastaObj.setHours(23, 59, 59, 999);
            fechaMovimiento.setHours(23, 59, 59, 999);
            if (fechaMovimiento > fechaHastaObj) {
              return false;
            }
          }
        }

        return true;
      });

      // Log detallado para depuración
      const movimientosCXC = movimientosFiltrados.filter(m => {
        const origen = m.origen || '';
        const categoria = m.categoria || '';
        const descripcion = m.descripcion || '';
        return (
          origen === 'CXC' ||
          origen === 'cxc' ||
          categoria === 'Cuentas por Cobrar' ||
          descripcion.includes('[CXC]')
        );
      });
      const movimientosCXP = movimientosFiltrados.filter(m => {
        const origen = m.origen || '';
        const categoria = m.categoria || '';
        const descripcion = m.descripcion || '';
        return (
          origen === 'CXP' ||
          origen === 'cxp' ||
          categoria === 'Cuentas por Pagar' ||
          descripcion.includes('[CXP]')
        );
      });
      const otrosMovimientos = movimientosFiltrados.filter(m => {
        const origen = m.origen || '';
        const categoria = m.categoria || '';
        const descripcion = m.descripcion || '';
        return !(
          origen === 'CXC' ||
          origen === 'cxc' ||
          categoria === 'Cuentas por Cobrar' ||
          descripcion.includes('[CXC]') ||
          origen === 'CXP' ||
          origen === 'cxp' ||
          categoria === 'Cuentas por Pagar' ||
          descripcion.includes('[CXP]')
        );
      });

      console.log(
        `✅ ${movimientosFiltrados.length} movimientos filtrados para la cuenta ${numeroCuenta}:`
      );
      console.log(`   - CXC (entradas): ${movimientosCXC.length}`);
      console.log(`   - CXP (salidas): ${movimientosCXP.length}`);
      console.log(`   - Otros: ${otrosMovimientos.length}`);

      // Si no hay movimientos de CXC pero debería haberlos, mostrar información de depuración
      if (movimientosCXC.length === 0) {
        const todosMovimientosCXC = movimientos.filter(m => {
          const origen = m.origen || '';
          const categoria = m.categoria || '';
          const descripcion = m.descripcion || '';
          return (
            origen === 'CXC' ||
            origen === 'cxc' ||
            categoria === 'Cuentas por Cobrar' ||
            descripcion.includes('[CXC]')
          );
        });

        console.warn('⚠️ No se encontraron movimientos de CXC después del filtro.');
        console.log(
          `   Total movimientos CXC disponibles antes del filtro: ${todosMovimientosCXC.length}`
        );

        if (todosMovimientosCXC.length > 0) {
          console.log('   Ejemplo de movimiento CXC (antes del filtro):', {
            origen: todosMovimientosCXC[0].origen,
            categoria: todosMovimientosCXC[0].categoria,
            descripcion: todosMovimientosCXC[0].descripcion,
            cuentaDestino: todosMovimientosCXC[0].cuentaDestino,
            cuentaDestinoPago: todosMovimientosCXC[0].cuentaDestinoPago,
            fecha: todosMovimientosCXC[0].fecha || todosMovimientosCXC[0].fechaCreacion,
            numeroCuentaBuscada: numeroCuenta
          });
        }
      }

      return movimientosFiltrados;
    } catch (error) {
      console.error('❌ Error filtrando movimientos:', error);
      return [];
    }
  }

  // ===== FUNCIÓN: Calcular saldos y preparar datos para tabla =====
  function calcularEstadoCuenta(movimientos, saldoInicial, moneda, numeroCuenta) {
    // Ordenar movimientos por fecha (más antiguo primero para calcular saldo acumulado)
    const movimientosOrdenados = [...movimientos].sort((a, b) => {
      const fechaA = new Date(a.fecha || a.fechaCreacion || 0);
      const fechaB = new Date(b.fecha || b.fechaCreacion || 0);
      return fechaA - fechaB;
    });

    let saldoAcumulado = saldoInicial;
    const movimientosConSaldo = [];

    // Agregar fila de saldo inicial
    movimientosConSaldo.push({
      tipo: 'saldo_inicial',
      fecha: null,
      concepto: 'Saldo Inicial',
      referencia: '-',
      entrada: null,
      salida: null,
      saldoAcumulado: saldoInicial
    });

    // Procesar cada movimiento
    movimientosOrdenados.forEach(mov => {
      let esEntrada = false;
      let esSalida = false;
      const monto = parseFloat(mov.monto || 0) || 0;

      // PRIORIDAD 1: Si el movimiento tiene un tipo explícito (ingreso/egreso), usarlo
      const tipoMovimiento = (mov.tipo || '').toLowerCase();
      if (tipoMovimiento === 'ingreso') {
        // Movimientos de tipo 'ingreso' son siempre entradas
        esEntrada = true;
        saldoAcumulado += monto;
      } else if (tipoMovimiento === 'egreso') {
        // Movimientos de tipo 'egreso' son siempre salidas
        esSalida = true;
        saldoAcumulado -= monto;
      } else {
        // PRIORIDAD 2: Determinar si es entrada o salida según el origen del movimiento
        let origen = mov.origen || '';

        // Si no tiene origen, intentar detectarlo por categoría o descripción
        if (!origen) {
          if (
            mov.categoria === 'Cuentas por Cobrar' ||
            (mov.descripcion && mov.descripcion.includes('[CXC]'))
          ) {
            origen = 'CXC';
          } else if (
            mov.categoria === 'Cuentas por Pagar' ||
            (mov.descripcion && mov.descripcion.includes('[CXP]'))
          ) {
            origen = 'CXP';
          }
        }

        if (origen === 'CXC' || origen === 'cxc') {
          // Movimientos de CXC son ingresos (entradas)
          esEntrada = true;
          saldoAcumulado += monto;
        } else if (origen === 'CXP' || origen === 'cxp') {
          // Movimientos de CXP son egresos (salidas)
          esSalida = true;
          saldoAcumulado -= monto;
        } else {
          // PRIORIDAD 3: Para otros movimientos, determinar por cuenta bancaria
          const cuentaEsDestino = mov.cuentaDestino && mov.cuentaDestino === numeroCuenta;
          const cuentaEsOrigen = mov.cuentaOrigen && mov.cuentaOrigen === numeroCuenta;

          // Si la cuenta es origen y destino al mismo tiempo (transferencia interna), no afecta
          if (cuentaEsDestino && cuentaEsOrigen) {
            // No se procesa (transferencia interna que no afecta el saldo)
            return;
          }

          // Si la cuenta es destino, es una entrada (dinero llega a la cuenta)
          if (cuentaEsDestino) {
            esEntrada = true;
            saldoAcumulado += monto;
          }
          // Si la cuenta es origen, es una salida (dinero sale de la cuenta)
          else if (cuentaEsOrigen) {
            esSalida = true;
            saldoAcumulado -= monto;
          }
        }
      }

      // Solo agregar si es entrada o salida (evitar movimientos que no afectan la cuenta)
      if (esEntrada || esSalida) {
        movimientosConSaldo.push({
          id: mov.id,
          tipo: mov.tipo || 'movimiento',
          fecha: mov.fecha || mov.fechaCreacion,
          concepto: mov.descripcion || mov.numeroFactura || mov.clienteProveedor || '-',
          referencia: mov.referenciaBancaria || mov.referencia || mov.numeroFactura || '-',
          entrada: esEntrada ? monto : null,
          salida: esSalida ? monto : null,
          saldoAcumulado: saldoAcumulado,
          movimiento: mov // Guardar el movimiento completo para referencia
        });
      }
    });

    // Calcular totales
    const totalEntradas = movimientosConSaldo
      .filter(m => m.entrada !== null)
      .reduce((sum, m) => sum + (m.entrada || 0), 0);

    const totalSalidas = movimientosConSaldo
      .filter(m => m.salida !== null)
      .reduce((sum, m) => sum + (m.salida || 0), 0);

    const saldoFinal = saldoInicial + totalEntradas - totalSalidas;

    return {
      movimientos: movimientosConSaldo,
      saldoInicial: saldoInicial,
      totalEntradas: totalEntradas,
      totalSalidas: totalSalidas,
      saldoFinal: saldoFinal,
      moneda: moneda
    };
  }

  // ===== FUNCIÓN: Actualizar descripciones de movimientos CXP con números de factura =====
  async function actualizarDescripcionesCXPEstadoCuenta(movimientos) {
    try {
      // Cargar facturas de CXP
      let facturas = [];

      // PRIORIDAD 1: Cargar desde Firebase
      if (window.firebaseRepos && window.firebaseRepos.cxp) {
        try {
          facturas = await window.firebaseRepos.cxp.getAllFacturas();
        } catch (error) {
          console.warn('⚠️ Error cargando facturas desde Firebase:', error);
        }
      }

      // PRIORIDAD 2: Cargar desde localStorage
      if (facturas.length === 0) {
        const facturasData = localStorage.getItem('erp_cxp_facturas');
        if (facturasData) {
          facturas = JSON.parse(facturasData);
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

        return mov;
      });
    } catch (error) {
      console.error('❌ Error actualizando descripciones CXP en estado de cuenta:', error);
      return movimientos; // En caso de error, devolver movimientos sin modificar
    }
  }

  // ===== FUNCIÓN: Cargar y mostrar estado de cuenta =====
  window.cargarEstadoCuenta = async function () {
    console.log('🚀 cargarEstadoCuenta llamada');
    try {
      const banco = document.getElementById('filtroBancoEstadoCuenta')?.value;
      const cuenta = document.getElementById('filtroCuentaEstadoCuenta')?.value;
      const fechaDesde = document.getElementById('filtroFechaDesdeEstadoCuenta')?.value;
      const fechaHasta = document.getElementById('filtroFechaHastaEstadoCuenta')?.value;

      console.log('📋 Valores capturados:', {
        banco: banco,
        cuenta: cuenta,
        fechaDesde: fechaDesde,
        fechaHasta: fechaHasta
      });

      // Validar que se haya seleccionado una cuenta
      if (
        !cuenta ||
        cuenta === '' ||
        cuenta === 'Primero seleccione un banco' ||
        cuenta === 'Seleccione una cuenta...'
      ) {
        console.warn('⚠️ No se ha seleccionado una cuenta bancaria');
        alert('⚠️ Por favor seleccione una cuenta bancaria');
        return;
      }

      // Limpiar valor si viene con formato jerárquico (ej: "    -6513164935")
      const numeroCuenta = cuenta.trim().replace(/^\s*-\s*/, '');

      console.log('📊 Cargando estado de cuenta para:', {
        banco,
        numeroCuenta,
        fechaDesde,
        fechaHasta
      });

      // Mostrar indicador de carga
      const tbody = document.getElementById('tbodyEstadoCuenta');
      if (tbody) {
        tbody.innerHTML =
          '<tr><td colspan="6" class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando estado de cuenta...</td></tr>';
      }

      // Obtener saldo inicial (calculará el saldo final del periodo anterior si hay fechaDesde)
      const infoCuenta = await obtenerSaldoInicial(numeroCuenta, fechaDesde);
      console.log('💰 Saldo inicial del periodo:', infoCuenta);

      // Filtrar movimientos
      console.log('🔍 Filtrando movimientos por cuenta...');
      let movimientos = await filtrarMovimientosPorCuenta(
        numeroCuenta,
        fechaDesde,
        fechaHasta,
        banco
      );
      console.log(
        `📊 ${movimientos.length} movimiento(s) encontrado(s) para la cuenta ${numeroCuenta}`
      );

      // Actualizar descripciones de movimientos CXP con números de factura
      movimientos = await actualizarDescripcionesCXPEstadoCuenta(movimientos);

      // Calcular estado de cuenta (pasar numeroCuenta como parámetro)
      console.log('💰 Calculando estado de cuenta...');
      const estadoCuenta = calcularEstadoCuenta(
        movimientos,
        infoCuenta.saldoInicial,
        infoCuenta.moneda,
        numeroCuenta
      );
      console.log('📋 Estado de cuenta calculado:', {
        saldoInicial: estadoCuenta.saldoInicial,
        totalEntradas: estadoCuenta.totalEntradas,
        totalSalidas: estadoCuenta.totalSalidas,
        saldoFinal: estadoCuenta.saldoFinal,
        movimientos: estadoCuenta.movimientos?.length || 0
      });

      // Guardar estado actual
      window._estadoCuentaActual = {
        ...estadoCuenta,
        banco: banco,
        numeroCuenta: numeroCuenta,
        infoCuenta: infoCuenta
      };

      // Mostrar resumen
      console.log('📊 Mostrando resumen...');
      mostrarResumenEstadoCuenta(estadoCuenta, infoCuenta.moneda);

      // Mostrar tabla
      console.log('📋 Mostrando tabla de movimientos...');
      mostrarTablaEstadoCuenta(estadoCuenta);

      // Habilitar botones de exportación
      const btnExcel = document.getElementById('btnExportarExcelEstadoCuenta');
      const btnPDF = document.getElementById('btnExportarPDFEstadoCuenta');
      if (btnExcel) {
        btnExcel.disabled = false;
      }
      if (btnPDF) {
        btnPDF.disabled = false;
      }

      console.log('✅ Estado de cuenta cargado exitosamente');
    } catch (error) {
      console.error('❌ Error cargando estado de cuenta:', error);
      alert(`❌ Error al cargar el estado de cuenta: ${error.message}`);

      const tbody = document.getElementById('tbodyEstadoCuenta');
      if (tbody) {
        tbody.innerHTML =
          '<tr><td colspan="6" class="text-center text-danger"><i class="fas fa-exclamation-triangle"></i> Error al cargar el estado de cuenta</td></tr>';
      }
    }
  };

  // ===== FUNCIÓN: Mostrar resumen del estado de cuenta =====
  function mostrarResumenEstadoCuenta(estadoCuenta, moneda) {
    const resumenDiv = document.getElementById('resumenEstadoCuenta');
    if (!resumenDiv) {
      return;
    }

    resumenDiv.style.display = 'flex';

    const formatearMoneda = monto =>
      new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: moneda || 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(monto);

    document.getElementById('resumenSaldoInicial').textContent = formatearMoneda(
      estadoCuenta.saldoInicial
    );
    document.getElementById('resumenEntradas').textContent = formatearMoneda(
      estadoCuenta.totalEntradas
    );
    document.getElementById('resumenSalidas').textContent = formatearMoneda(
      estadoCuenta.totalSalidas
    );
    document.getElementById('resumenSaldoFinal').textContent = formatearMoneda(
      estadoCuenta.saldoFinal
    );
  }

  // ===== FUNCIÓN: Mostrar tabla de movimientos con saldo acumulado =====
  function mostrarTablaEstadoCuenta(estadoCuenta) {
    console.log('📋 mostrarTablaEstadoCuenta llamada');
    const tbody = document.getElementById('tbodyEstadoCuenta');
    if (!tbody) {
      console.error('❌ tbodyEstadoCuenta no encontrado en el DOM');
      return;
    }

    console.log('📋 Estado de cuenta recibido:', {
      tieneEstadoCuenta: Boolean(estadoCuenta),
      tieneMovimientos: Boolean(estadoCuenta && estadoCuenta.movimientos),
      cantidadMovimientos: estadoCuenta?.movimientos?.length || 0
    });

    if (!estadoCuenta || !estadoCuenta.movimientos || estadoCuenta.movimientos.length === 0) {
      console.warn('⚠️ No hay movimientos para mostrar');
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted">No hay movimientos para el período seleccionado</td></tr>';
      return;
    }

    const formatearMoneda = monto => {
      if (monto === null || monto === undefined) {
        return '-';
      }
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: estadoCuenta.moneda || 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(monto);
    };

    const formatearFecha = fecha => {
      if (!fecha) {
        return '-';
      }
      try {
        if (typeof fecha === 'string') {
          if (/^\d{4}-\d{2}-\d{2}/.test(fecha)) {
            const fechaStr = fecha.split('T')[0];
            const [year, month, day] = fechaStr.split('-');
            const fechaObj = new Date(
              parseInt(year, 10),
              parseInt(month, 10) - 1,
              parseInt(day, 10)
            );
            return fechaObj.toLocaleDateString('es-MX');
          } else if (fecha.includes('T')) {
            return new Date(fecha).toLocaleDateString('es-MX');
          }
        }
        return new Date(fecha).toLocaleDateString('es-MX');
      } catch (e) {
        return String(fecha);
      }
    };

    tbody.innerHTML = '';
    console.log(`📋 Renderizando ${estadoCuenta.movimientos.length} movimiento(s) en la tabla...`);

    estadoCuenta.movimientos.forEach((mov, _index) => {
      const tr = document.createElement('tr');

      // Estilo especial para saldo inicial
      if (mov.tipo === 'saldo_inicial') {
        tr.classList.add('table-info');
        tr.style.fontWeight = 'bold';
      }

      tr.innerHTML = `
                <td>${mov.fecha ? formatearFecha(mov.fecha) : '-'}</td>
                <td>${mov.concepto || '-'}</td>
                <td>${mov.referencia || '-'}</td>
                <td class="text-end">${mov.entrada !== null ? formatearMoneda(mov.entrada) : '-'}</td>
                <td class="text-end">${mov.salida !== null ? formatearMoneda(mov.salida) : '-'}</td>
                <td class="text-end"><strong>${formatearMoneda(mov.saldoAcumulado)}</strong></td>
            `;

      tbody.appendChild(tr);
    });

    console.log(`✅ ${estadoCuenta.movimientos.length} fila(s) agregada(s) a la tabla`);

    // Agregar fila de Saldo Final al final
    const trSaldoFinal = document.createElement('tr');
    trSaldoFinal.classList.add('table-primary');
    trSaldoFinal.style.fontWeight = 'bold';
    trSaldoFinal.innerHTML = `
            <td>-</td>
            <td><strong>Saldo Final</strong></td>
            <td>-</td>
            <td class="text-end">-</td>
            <td class="text-end">-</td>
            <td class="text-end"><strong>${formatearMoneda(estadoCuenta.saldoFinal)}</strong></td>
        `;
    tbody.appendChild(trSaldoFinal);

    console.log('✅ Tabla de estado de cuenta renderizada completamente');
  }

  // ===== FUNCIÓN: Exportar estado de cuenta a Excel =====
  window.exportarEstadoCuentaExcel = async function () {
    if (!window._estadoCuentaActual) {
      alert('⚠️ Primero debe cargar el estado de cuenta');
      return;
    }

    try {
      // Cargar SheetJS si no está disponible
      if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const estadoCuenta = window._estadoCuentaActual;
      const datos = [];

      // Agregar encabezados
      datos.push(['Fecha', 'Concepto', 'Referencia', 'Entrada', 'Salida', 'Saldo Acumulado']);

      // Agregar movimientos
      estadoCuenta.movimientos.forEach(mov => {
        const formatearMoneda = monto => {
          if (monto === null || monto === undefined) {
            return '';
          }
          return typeof monto === 'number' ? monto : parseFloat(monto) || 0;
        };

        datos.push([
          mov.fecha || '',
          mov.concepto || '',
          mov.referencia || '',
          formatearMoneda(mov.entrada),
          formatearMoneda(mov.salida),
          formatearMoneda(mov.saldoAcumulado)
        ]);
      });

      // Agregar resumen
      datos.push([]);
      datos.push(['RESUMEN', '', '', '', '', '']);
      datos.push(['Saldo Inicial', '', '', '', '', estadoCuenta.saldoInicial]);
      datos.push(['Total Entradas', '', '', estadoCuenta.totalEntradas, '', '']);
      datos.push(['Total Salidas', '', '', '', estadoCuenta.totalSalidas, '']);
      datos.push(['Saldo Final', '', '', '', '', estadoCuenta.saldoFinal]);

      // Crear workbook
      const ws = XLSX.utils.aoa_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Estado de Cuenta');

      // Generar nombre de archivo
      const fechaActual = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Estado_Cuenta_${estadoCuenta.numeroCuenta}_${fechaActual}.xlsx`;

      // Descargar
      XLSX.writeFile(wb, nombreArchivo);
      console.log('✅ Estado de cuenta exportado a Excel');
    } catch (error) {
      console.error('❌ Error exportando a Excel:', error);
      alert(`❌ Error al exportar el estado de cuenta a Excel: ${error.message}`);
    }
  };

  // ===== FUNCIÓN: Exportar estado de cuenta a PDF =====
  window.exportarEstadoCuentaPDF = async function () {
    if (!window._estadoCuentaActual) {
      alert('⚠️ Primero debe cargar el estado de cuenta');
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
      const estadoCuenta = window._estadoCuentaActual;

      // Configuración
      const margin = 15;
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // Título
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Estado de Cuenta Bancario', margin, yPosition);
      yPosition += 10;

      // Información de la cuenta
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Banco: ${estadoCuenta.banco || '-'}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Cuenta: ${estadoCuenta.numeroCuenta || '-'}`, margin, yPosition);
      yPosition += 5;

      const fechaDesde = document.getElementById('filtroFechaDesdeEstadoCuenta')?.value || 'Todas';
      const fechaHasta = document.getElementById('filtroFechaHastaEstadoCuenta')?.value || 'Todas';
      doc.text(`Período: ${fechaDesde} a ${fechaHasta}`, margin, yPosition);
      yPosition += 10;

      // Resumen
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen', margin, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');

      const formatearMoneda = monto =>
        new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: estadoCuenta.moneda || 'MXN',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(monto);

      doc.text(
        `Saldo Inicial: ${formatearMoneda(estadoCuenta.saldoInicial)}`,
        margin + 5,
        yPosition
      );
      yPosition += 5;
      doc.text(
        `Total Entradas: ${formatearMoneda(estadoCuenta.totalEntradas)}`,
        margin + 5,
        yPosition
      );
      yPosition += 5;
      doc.text(
        `Total Salidas: ${formatearMoneda(estadoCuenta.totalSalidas)}`,
        margin + 5,
        yPosition
      );
      yPosition += 5;
      doc.setFont('helvetica', 'bold');
      doc.text(`Saldo Final: ${formatearMoneda(estadoCuenta.saldoFinal)}`, margin + 5, yPosition);
      yPosition += 10;

      // Tabla de movimientos
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Movimientos', margin, yPosition);
      yPosition += 5;

      // Encabezados de tabla
      const colFecha = margin;
      const colConcepto = margin + 25;
      const colReferencia = margin + 70;
      const colEntrada = margin + 95;
      const colSalida = margin + 125;
      const colSaldo = margin + 155;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Fecha', colFecha, yPosition);
      doc.text('Concepto', colConcepto, yPosition);
      doc.text('Ref.', colReferencia, yPosition);
      doc.text('Entrada', colEntrada, yPosition);
      doc.text('Salida', colSalida, yPosition);
      doc.text('Saldo', colSaldo, yPosition);
      yPosition += 5;

      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Movimientos
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      estadoCuenta.movimientos.forEach((mov, _index) => {
        // Nueva página si es necesario
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        const formatearFecha = fecha => {
          if (!fecha) {
            return '-';
          }
          try {
            if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fecha)) {
              const fechaStr = fecha.split('T')[0];
              const [year, month, day] = fechaStr.split('-');
              return `${day}/${month}/${year}`;
            }
            const fechaObj = new Date(fecha);
            return fechaObj.toLocaleDateString('es-MX', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
          } catch (e) {
            return '-';
          }
        };

        const formatearMonto = monto => {
          if (monto === null || monto === undefined) {
            return '-';
          }
          const num = typeof monto === 'number' ? monto : parseFloat(monto) || 0;
          return new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(num);
        };

        if (mov.tipo === 'saldo_inicial') {
          doc.setFont('helvetica', 'bold');
        }

        doc.text(formatearFecha(mov.fecha), colFecha, yPosition);

        // Truncar concepto si es muy largo
        let concepto = mov.concepto || '-';
        if (concepto.length > 25) {
          concepto = `${concepto.substring(0, 22)}...`;
        }
        doc.text(concepto, colConcepto, yPosition);

        // Truncar referencia
        let referencia = mov.referencia || '-';
        if (referencia.length > 15) {
          referencia = `${referencia.substring(0, 12)}...`;
        }
        doc.text(referencia, colReferencia, yPosition);

        doc.text(mov.entrada !== null ? formatearMonto(mov.entrada) : '-', colEntrada, yPosition);
        doc.text(mov.salida !== null ? formatearMonto(mov.salida) : '-', colSalida, yPosition);
        doc.text(formatearMonto(mov.saldoAcumulado), colSaldo, yPosition);

        if (mov.tipo === 'saldo_inicial') {
          doc.setFont('helvetica', 'normal');
        }

        yPosition += 5;
      });

      // Guardar PDF
      const fechaActual = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Estado_Cuenta_${estadoCuenta.numeroCuenta}_${fechaActual}.pdf`;
      doc.save(nombreArchivo);

      console.log('✅ Estado de cuenta exportado a PDF');
    } catch (error) {
      console.error('❌ Error exportando a PDF:', error);
      alert(`❌ Error al exportar el estado de cuenta a PDF: ${error.message}`);
    }
  };

  console.log('✅ Módulo de Estado de Cuenta cargado');

  // Cargar bancos cuando se active la pestaña de estado de cuenta
  async function inicializarFiltrosEstadoCuenta() {
    console.log('🔧 Inicializando filtros de estado de cuenta...');

    const estadoCuentaTab = document.getElementById('estado-cuenta-tab');
    const selectBanco = document.getElementById('filtroBancoEstadoCuenta');
    const selectCuenta = document.getElementById('filtroCuentaEstadoCuenta');

    console.log('📋 Elementos encontrados:', {
      estadoCuentaTab: Boolean(estadoCuentaTab),
      selectBanco: Boolean(selectBanco),
      selectCuenta: Boolean(selectCuenta)
    });

    // Configurar listener directo en el select de banco
    if (selectBanco) {
      // Remover listener anterior si existe
      const nuevoSelectBanco = selectBanco.cloneNode(true);
      selectBanco.parentNode.replaceChild(nuevoSelectBanco, selectBanco);

      nuevoSelectBanco.addEventListener('change', async function () {
        console.log('🔄🔄🔄 CAMBIO EN FILTRO BANCO ESTADO CUENTA DETECTADO 🔄🔄🔄');
        console.log('📋 Banco seleccionado:', this.value);

        if (typeof window.actualizarCuentasBancariasEstadoCuenta === 'function') {
          console.log(
            '✅ Función actualizarCuentasBancariasEstadoCuenta encontrada, ejecutando...'
          );
          try {
            await window.actualizarCuentasBancariasEstadoCuenta();
            console.log('✅ actualizarCuentasBancariasEstadoCuenta ejecutada');
          } catch (error) {
            console.error('❌ Error ejecutando actualizarCuentasBancariasEstadoCuenta:', error);
          }
        } else {
          console.error('❌ Función actualizarCuentasBancariasEstadoCuenta NO está disponible');
          console.log(
            '   - window.actualizarCuentasBancariasEstadoCuenta:',
            typeof window.actualizarCuentasBancariasEstadoCuenta
          );

          // Intentar esperar y volver a intentar
          let attempts = 0;
          const maxAttempts = 10;
          while (
            attempts < maxAttempts &&
            typeof window.actualizarCuentasBancariasEstadoCuenta !== 'function'
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          if (typeof window.actualizarCuentasBancariasEstadoCuenta === 'function') {
            console.log('✅ Función disponible después de esperar, ejecutando...');
            await window.actualizarCuentasBancariasEstadoCuenta();
          } else {
            console.error('❌ Función aún no disponible después de esperar');
          }
        }
      });

      console.log('✅ Listener de cambio agregado directamente a filtroBancoEstadoCuenta');
    }

    if (estadoCuentaTab) {
      estadoCuentaTab.addEventListener('shown.bs.tab', async () => {
        console.log('📊 Pestaña de Estado de Cuenta activada, cargando bancos...');

        // Cargar bancos si la función está disponible
        if (typeof cargarBancos === 'function') {
          await cargarBancos();
          console.log('✅ Bancos cargados en filtro de estado de cuenta');
        } else {
          // Si no está disponible, intentar cargar manualmente
          await cargarBancosEstadoCuenta();
        }
      });
    }

    // También intentar cargar inmediatamente si la pestaña ya está activa
    const estadoCuentaPane = document.getElementById('estado-cuenta');
    if (estadoCuentaPane && estadoCuentaPane.classList.contains('active')) {
      if (typeof cargarBancos === 'function') {
        await cargarBancos();
      } else {
        await cargarBancosEstadoCuenta();
      }
    }
  }

  // Función auxiliar para cargar bancos en el filtro de estado de cuenta
  async function cargarBancosEstadoCuenta() {
    const selectBanco = document.getElementById('filtroBancoEstadoCuenta');
    if (!selectBanco) {
      return;
    }

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

    // Si no hay datos en Firebase, intentar desde configuracionManager
    if (bancos.length === 0 && window.configuracionManager) {
      bancos = window.configuracionManager.getCuentasBancarias() || [];
    }

    // Obtener lista única de bancos
    const bancosUnicos = [...new Set(bancos.map(b => b.banco).filter(b => b))].sort();

    // Limpiar opciones actuales excepto la primera
    const primeraOpcion = selectBanco.querySelector('option');
    selectBanco.innerHTML = primeraOpcion
      ? primeraOpcion.outerHTML
      : '<option value="">Seleccione un banco...</option>';

    // Agregar bancos
    bancosUnicos.forEach(banco => {
      const option = document.createElement('option');
      option.value = banco;
      option.textContent = banco;
      selectBanco.appendChild(option);
    });

    // Configurar evento onchange para actualizar cuentas cuando se seleccione un banco
    // NO clonar el elemento, solo agregar el listener si no existe
    if (!selectBanco.hasAttribute('data-listener-cuentas-agregado')) {
      const handlerChange = async function () {
        console.log('🔄🔄🔄 CAMBIO EN FILTRO BANCO ESTADO CUENTA (listener directo) 🔄🔄🔄');
        console.log('📋 Banco seleccionado:', this.value);

        if (typeof window.actualizarCuentasBancariasEstadoCuenta === 'function') {
          console.log('✅ Función encontrada, ejecutando...');
          try {
            await window.actualizarCuentasBancariasEstadoCuenta();
            console.log('✅ Función ejecutada correctamente');
          } catch (error) {
            console.error('❌ Error ejecutando actualizarCuentasBancariasEstadoCuenta:', error);
          }
        } else {
          console.error('❌ Función actualizarCuentasBancariasEstadoCuenta NO disponible');
          console.log(
            '   - window.actualizarCuentasBancariasEstadoCuenta:',
            typeof window.actualizarCuentasBancariasEstadoCuenta
          );

          // Intentar esperar y volver a intentar
          let attempts = 0;
          const maxAttempts = 10;
          while (
            attempts < maxAttempts &&
            typeof window.actualizarCuentasBancariasEstadoCuenta !== 'function'
          ) {
            attempts++;
            console.log(`⏳ Esperando función... (${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          if (typeof window.actualizarCuentasBancariasEstadoCuenta === 'function') {
            console.log('✅ Función disponible después de esperar, ejecutando...');
            try {
              await window.actualizarCuentasBancariasEstadoCuenta();
            } catch (error) {
              console.error('❌ Error ejecutando función después de esperar:', error);
            }
          } else {
            console.error('❌ Función aún no disponible después de esperar');
          }
        }
      };

      selectBanco.addEventListener('change', handlerChange);
      selectBanco.setAttribute('data-listener-cuentas-agregado', 'true');
      console.log('✅ Listener de cambio agregado directamente a filtroBancoEstadoCuenta');
    } else {
      console.log('ℹ️ Listener de cambio ya está agregado a filtroBancoEstadoCuenta');
    }

    console.log(`✅ ${bancosUnicos.length} banco(s) cargado(s) en el filtro de estado de cuenta`);
  }

  // Configurar listener directo para el botón de consultar
  function configurarBotonConsultar() {
    const botonConsultar = document.querySelector('[data-action="cargarEstadoCuenta"]');
    if (botonConsultar) {
      console.log('✅ Botón consultar encontrado, configurando listener directo...');

      // Verificar si ya tiene el listener
      if (botonConsultar.hasAttribute('data-listener-consultar-agregado')) {
        console.log('ℹ️ Botón consultar ya tiene listener, omitiendo...');
        return;
      }

      // Agregar listener directo
      botonConsultar.addEventListener(
        'click',
        async e => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🖱️🖱️🖱️ BOTÓN CONSULTAR CLICKEADO 🖱️🖱️🖱️');

          if (typeof window.cargarEstadoCuenta === 'function') {
            try {
              console.log('✅ Ejecutando cargarEstadoCuenta desde botón consultar...');
              await window.cargarEstadoCuenta();
            } catch (error) {
              console.error('❌ Error ejecutando cargarEstadoCuenta:', error);
              if (typeof window.showNotification === 'function') {
                window.showNotification(
                  `Error al cargar el estado de cuenta: ${error.message || 'Error desconocido'}`,
                  'error'
                );
              } else {
                alert(
                  `Error al cargar el estado de cuenta: ${error.message || 'Error desconocido'}`
                );
              }
            }
          } else {
            console.error('❌ window.cargarEstadoCuenta no está disponible');
            // Esperar y volver a intentar
            let attempts = 0;
            const maxAttempts = 10;
            while (attempts < maxAttempts && typeof window.cargarEstadoCuenta !== 'function') {
              attempts++;
              await new Promise(resolve => setTimeout(resolve, 200));
            }

            if (typeof window.cargarEstadoCuenta === 'function') {
              console.log('✅ Función disponible después de esperar, ejecutando...');
              await window.cargarEstadoCuenta();
            } else {
              console.error('❌ Función aún no disponible después de esperar');
              alert(
                'Error: El sistema de estado de cuenta no está listo. Por favor, espera unos segundos y vuelve a intentar.'
              );
            }
          }
        },
        true
      ); // Usar capture

      botonConsultar.setAttribute('data-listener-consultar-agregado', 'true');
      console.log('✅ Listener directo agregado al botón consultar');
    } else {
      console.warn('⚠️ Botón consultar no encontrado');
    }
  }

  // Configurar botones de exportar
  function configurarBotonesExportar() {
    const btnExcel = document.getElementById('btnExportarExcelEstadoCuenta');
    const btnPDF = document.getElementById('btnExportarPDFEstadoCuenta');

    if (btnExcel && !btnExcel.hasAttribute('data-listener-excel-agregado')) {
      btnExcel.addEventListener('click', async function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ Botón Excel clickeado');

        if (this.disabled) {
          console.warn('⚠️ Botón Excel está deshabilitado');
          return;
        }

        if (typeof window.exportarEstadoCuentaExcel === 'function') {
          try {
            await window.exportarEstadoCuentaExcel();
          } catch (error) {
            console.error('❌ Error exportando a Excel:', error);
            if (typeof window.showNotification === 'function') {
              window.showNotification(
                `Error al exportar a Excel: ${error.message || 'Error desconocido'}`,
                'error'
              );
            } else {
              alert(`Error al exportar a Excel: ${error.message || 'Error desconocido'}`);
            }
          }
        } else {
          console.error('❌ exportarEstadoCuentaExcel no está disponible');
        }
      });
      btnExcel.setAttribute('data-listener-excel-agregado', 'true');
      console.log('✅ Listener directo agregado al botón Excel');
    }

    if (btnPDF && !btnPDF.hasAttribute('data-listener-pdf-agregado')) {
      btnPDF.addEventListener('click', async function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ Botón PDF clickeado');

        if (this.disabled) {
          console.warn('⚠️ Botón PDF está deshabilitado');
          return;
        }

        if (typeof window.exportarEstadoCuentaPDF === 'function') {
          try {
            await window.exportarEstadoCuentaPDF();
          } catch (error) {
            console.error('❌ Error exportando a PDF:', error);
            if (typeof window.showNotification === 'function') {
              window.showNotification(
                `Error al exportar a PDF: ${error.message || 'Error desconocido'}`,
                'error'
              );
            } else {
              alert(`Error al exportar a PDF: ${error.message || 'Error desconocido'}`);
            }
          }
        } else {
          console.error('❌ exportarEstadoCuentaPDF no está disponible');
        }
      });
      btnPDF.setAttribute('data-listener-pdf-agregado', 'true');
      console.log('✅ Listener directo agregado al botón PDF');
    }
  }

  // Configurar botón consultar inmediatamente y con delays
  configurarBotonConsultar();
  setTimeout(configurarBotonConsultar, 500);
  setTimeout(configurarBotonConsultar, 1000);
  setTimeout(configurarBotonConsultar, 2000);

  // Configurar botones de exportar inmediatamente y con delays
  configurarBotonesExportar();
  setTimeout(configurarBotonesExportar, 500);
  setTimeout(configurarBotonesExportar, 1000);
  setTimeout(configurarBotonesExportar, 2000);

  // Configurar botón de limpiar filtros
  function configurarBotonLimpiarFiltros() {
    const btnLimpiar = document.querySelector('[data-action="limpiarFiltrosEstadoCuenta"]');
    if (btnLimpiar && !btnLimpiar.hasAttribute('data-listener-limpiar-agregado')) {
      btnLimpiar.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ Botón limpiar filtros clickeado');

        if (typeof window.limpiarFiltrosEstadoCuenta === 'function') {
          window.limpiarFiltrosEstadoCuenta();
        } else {
          console.error('❌ limpiarFiltrosEstadoCuenta no está disponible');
        }
      });
      btnLimpiar.setAttribute('data-listener-limpiar-agregado', 'true');
      console.log('✅ Listener directo agregado al botón limpiar filtros');
    }
  }

  // Configurar botón de limpiar filtros inmediatamente y con delays
  configurarBotonLimpiarFiltros();
  setTimeout(configurarBotonLimpiarFiltros, 500);
  setTimeout(configurarBotonLimpiarFiltros, 1000);
  setTimeout(configurarBotonLimpiarFiltros, 2000);

  // Usar MutationObserver para detectar cuando se agrega el botón
  const observerConsultar = new MutationObserver(() => {
    const boton = document.querySelector('[data-action="cargarEstadoCuenta"]');
    if (boton && !boton.hasAttribute('data-listener-consultar-agregado')) {
      console.log('🔄 Botón consultar detectado dinámicamente');
      configurarBotonConsultar();
    }

    // También verificar botones de exportar
    const btnExcel = document.getElementById('btnExportarExcelEstadoCuenta');
    const btnPDF = document.getElementById('btnExportarPDFEstadoCuenta');
    if (
      (btnExcel && !btnExcel.hasAttribute('data-listener-excel-agregado')) ||
      (btnPDF && !btnPDF.hasAttribute('data-listener-pdf-agregado'))
    ) {
      console.log('🔄 Botones de exportar detectados dinámicamente');
      configurarBotonesExportar();
    }

    // También verificar botón de limpiar filtros
    const btnLimpiar = document.querySelector('[data-action="limpiarFiltrosEstadoCuenta"]');
    if (btnLimpiar && !btnLimpiar.hasAttribute('data-listener-limpiar-agregado')) {
      console.log('🔄 Botón limpiar filtros detectado dinámicamente');
      configurarBotonLimpiarFiltros();
    }
  });

  observerConsultar.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Función para limpiar filtros de estado de cuenta
  window.limpiarFiltrosEstadoCuenta = function () {
    console.log('🧹 Limpiando filtros de estado de cuenta...');

    // Limpiar todos los campos de filtro
    const filtroBanco = document.getElementById('filtroBancoEstadoCuenta');
    const filtroCuenta = document.getElementById('filtroCuentaEstadoCuenta');
    const filtroFechaDesde = document.getElementById('filtroFechaDesdeEstadoCuenta');
    const filtroFechaHasta = document.getElementById('filtroFechaHastaEstadoCuenta');

    if (filtroBanco) {
      filtroBanco.value = '';
      filtroBanco.removeAttribute('required');
    }

    if (filtroCuenta) {
      filtroCuenta.innerHTML = '<option value="">Primero seleccione un banco</option>';
      filtroCuenta.removeAttribute('required');
    }

    if (filtroFechaDesde) {
      filtroFechaDesde.value = '';
    }
    if (filtroFechaHasta) {
      filtroFechaHasta.value = '';
    }

    // Limpiar la tabla
    const tbody = document.getElementById('tbodyEstadoCuenta');
    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted"><i class="fas fa-info-circle"></i> Seleccione una cuenta bancaria y fechas para consultar el estado de cuenta</td></tr>';
    }

    // Ocultar resumen
    const resumen = document.getElementById('resumenEstadoCuenta');
    if (resumen) {
      resumen.style.display = 'none';
    }

    // Deshabilitar botones de exportación
    const btnExcel = document.getElementById('btnExportarExcelEstadoCuenta');
    const btnPDF = document.getElementById('btnExportarPDFEstadoCuenta');
    if (btnExcel) {
      btnExcel.disabled = true;
    }
    if (btnPDF) {
      btnPDF.disabled = true;
    }

    // Limpiar estado de cuenta actual
    window._estadoCuentaActual = null;

    console.log('✅ Filtros de estado de cuenta limpiados');
  };

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarFiltrosEstadoCuenta);
  } else {
    inicializarFiltrosEstadoCuenta();
  }
})();
