/**
 * Funciones de Gastos y SincronizaciÃ³n - trafico.html
 * Funciones para gestionar gastos de operadores y sincronizaciÃ³n
 *
 * @module trafico/gastos-sync-manager
 */

(function () {
  'use strict';
  window.sincronizarOperadoresDesdeTrafico = async function (datosTrafico) {
    console.log('ðŸ”„ Sincronizando operadores desde trÃ¡fico...');

    try {
      // Obtener nombres de operadores del registro de trÃ¡fico
      const operadorPrincipalNombre =
        datosTrafico.operadorPrincipal || datosTrafico.operadorprincipal || '';
      const operadorSecundarioNombre =
        datosTrafico.operadorSecundario || datosTrafico.operadorsecundario || '';
      const operadorPrincipalDescarga = datosTrafico.operadorPrincipalDescarga || '';
      const operadorSecundarioDescarga = datosTrafico.operadorSecundarioDescarga || '';

      // Obtener licencias si estÃ¡n disponibles (del modal o del formulario principal)
      const licenciaPrincipal =
        document.getElementById('modal_licencia_principal')?.value ||
        datosTrafico.Licencia ||
        datosTrafico.licenciaOperadorPrincipal ||
        document.getElementById('Licencia')?.value ||
        '';
      const licenciaSecundaria =
        document.getElementById('modal_licencia_secundaria')?.value ||
        datosTrafico.LicenciaSecundaria ||
        datosTrafico.licenciaOperadorSecundario ||
        document.getElementById('LicenciaSecundaria')?.value ||
        '';

      // Lista de operadores a sincronizar
      const operadoresParaSincronizar = [];

      if (operadorPrincipalNombre) {
        operadoresParaSincronizar.push({
          nombre: operadorPrincipalNombre,
          licencia: licenciaPrincipal,
          tipo: 'principal'
        });
      }

      if (operadorSecundarioNombre) {
        operadoresParaSincronizar.push({
          nombre: operadorSecundarioNombre,
          licencia: licenciaSecundaria,
          tipo: 'secundario'
        });
      }

      if (operadorPrincipalDescarga) {
        operadoresParaSincronizar.push({
          nombre: operadorPrincipalDescarga,
          tipo: 'principal'
        });
      }

      if (operadorSecundarioDescarga) {
        operadoresParaSincronizar.push({
          nombre: operadorSecundarioDescarga,
          tipo: 'secundario'
        });
      }

      if (operadoresParaSincronizar.length === 0) {
        console.log('â„¹ï¸ No hay operadores para sincronizar');
        return;
      }

      // Obtener operadores existentes desde Firebase o localStorage
      let operadoresExistentes = [];

      // PRIORIDAD 1: Intentar desde Firebase
      if (window.firebaseDb && window.fs) {
        try {
          const operadoresDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'operadores');
          const operadoresDoc = await window.fs.getDoc(operadoresDocRef);

          if (operadoresDoc.exists()) {
            const data = operadoresDoc.data();
            if (data.operadores && Array.isArray(data.operadores)) {
              operadoresExistentes = data.operadores;
              console.log(`âœ… ${operadoresExistentes.length} operadores cargados desde Firebase`);
            }
          }
        } catch (error) {
          console.warn('âš ï¸ Error cargando operadores desde Firebase:', error);
        }
      }

      // PRIORIDAD 2: Cargar desde configuracionManager
      if (operadoresExistentes.length === 0 && window.configuracionManager) {
        try {
          const operadoresData = window.configuracionManager.getOperadores();
          if (Array.isArray(operadoresData)) {
            operadoresExistentes = operadoresData;
          } else if (operadoresData && typeof operadoresData === 'object') {
            operadoresExistentes = Object.values(operadoresData);
          }
          console.log(
            `âœ… ${operadoresExistentes.length} operadores cargados desde configuracionManager`
          );
        } catch (error) {
          console.warn('âš ï¸ Error cargando operadores desde configuracionManager:', error);
        }
      }

      // PRIORIDAD 3: Cargar desde localStorage
      if (operadoresExistentes.length === 0) {
        try {
          const operadoresData = localStorage.getItem('erp_operadores');
          if (operadoresData) {
            const parsed = JSON.parse(operadoresData);
            if (Array.isArray(parsed)) {
              operadoresExistentes = parsed;
            } else if (typeof parsed === 'object') {
              operadoresExistentes = Object.values(parsed);
            }
            console.log(
              `âœ… ${operadoresExistentes.length} operadores cargados desde localStorage`
            );
          }
        } catch (error) {
          console.warn('âš ï¸ Error cargando operadores desde localStorage:', error);
        }
      }

      // Procesar cada operador para sincronizar
      let operadoresActualizados = 0;
      let operadoresCreados = 0;

      for (const operadorTrafico of operadoresParaSincronizar) {
        if (!operadorTrafico.nombre) {
          continue;
        }

        // Buscar si el operador ya existe (por nombre o licencia)
        const operadorExistente = operadoresExistentes.find(op => {
          const nombreOp = (op.nombre || op.nombreOperador || '').trim().toLowerCase();
          const nombreTrafico = operadorTrafico.nombre.trim().toLowerCase();
          const licenciaOp = (op.licencia || op.numeroLicencia || '').trim();
          const licenciaTrafico = (operadorTrafico.licencia || '').trim();

          return (
            nombreOp === nombreTrafico ||
            (licenciaOp && licenciaTrafico && licenciaOp === licenciaTrafico)
          );
        });

        if (operadorExistente) {
          // Actualizar operador existente si hay cambios
          let hayCambios = false;
          const operadorActualizado = { ...operadorExistente };

          // Actualizar licencia si se proporcionÃ³ una nueva
          if (
            operadorTrafico.licencia &&
            operadorTrafico.licencia !== 'Se actualiza automÃ¡ticamente' &&
            operadorTrafico.licencia !== operadorExistente.licencia
          ) {
            operadorActualizado.licencia = operadorTrafico.licencia;
            operadorActualizado.numeroLicencia = operadorTrafico.licencia;
            hayCambios = true;
          }

          // Actualizar tipo de operador si es diferente
          if (
            operadorTrafico.tipo &&
            operadorTrafico.tipo !== operadorExistente.tipoOperador &&
            operadorTrafico.tipo !== operadorExistente.tipo
          ) {
            operadorActualizado.tipoOperador = operadorTrafico.tipo;
            operadorActualizado.tipo = operadorTrafico.tipo;
            hayCambios = true;
          }

          // Actualizar fecha de actualizaciÃ³n
          operadorActualizado.fechaActualizacion = new Date().toISOString();
          operadorActualizado.ultimaActualizacion = new Date().toISOString();

          if (hayCambios) {
            // Actualizar en el array
            const index = operadoresExistentes.findIndex(
              op =>
                (op.nombre || op.nombreOperador || '').trim().toLowerCase() ===
                (operadorExistente.nombre || operadorExistente.nombreOperador || '')
                  .trim()
                  .toLowerCase()
            );

            if (index >= 0) {
              operadoresExistentes[index] = operadorActualizado;
              operadoresActualizados++;
              console.log(`ðŸ”„ Operador actualizado: ${operadorTrafico.nombre}`);
            }
          }
        } else {
          // Crear nuevo operador
          const nuevoOperador = {
            nombre: operadorTrafico.nombre,
            nombreOperador: operadorTrafico.nombre,
            licencia: operadorTrafico.licencia || '',
            numeroLicencia: operadorTrafico.licencia || '',
            tipoOperador: operadorTrafico.tipo || 'principal',
            tipo: operadorTrafico.tipo || 'principal',
            estado: 'activo',
            estadoOperador: 'activo',
            fechaCreacion: new Date().toISOString(),
            fechaRegistro: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString(),
            origen: 'trafico' // Marcar que viene de trÃ¡fico
          };

          operadoresExistentes.push(nuevoOperador);
          operadoresCreados++;
          console.log(`âž• Nuevo operador creado: ${operadorTrafico.nombre}`);
        }
      }

      // Guardar operadores actualizados
      if (operadoresActualizados > 0 || operadoresCreados > 0) {
        // PRIORIDAD 1: Guardar en Firebase
        if (window.firebaseDb && window.fs) {
          try {
            const tenantId =
              window.firebaseAuth?.currentUser?.uid ||
              localStorage.getItem('tenantId') ||
              window.DEMO_CONFIG?.tenantId ||
              'demo_tenant';
            const operadoresDocRef = window.fs.doc(
              window.firebaseDb,
              'configuracion',
              'operadores'
            );

            await window.fs.setDoc(
              operadoresDocRef,
              {
                operadores: operadoresExistentes,
                tenantId: tenantId,
                updatedAt: new Date().toISOString()
              },
              { merge: true }
            );

            console.log(
              `âœ… ${operadoresActualizados} operadores actualizados y ${operadoresCreados} creados en Firebase`
            );
          } catch (error) {
            console.error('âŒ Error guardando operadores en Firebase:', error);
          }
        }

        // PRIORIDAD 2: Guardar usando configuracionManager
        if (
          window.configuracionManager &&
          typeof window.configuracionManager.setOperadores === 'function'
        ) {
          try {
            await window.configuracionManager.setOperadores(operadoresExistentes);
            console.log('âœ… Operadores actualizados usando configuracionManager');
          } catch (error) {
            console.warn('âš ï¸ Error guardando operadores usando configuracionManager:', error);
          }
        }

        // PRIORIDAD 3: Guardar en localStorage como respaldo
        try {
          localStorage.setItem('erp_operadores', JSON.stringify(operadoresExistentes));
          console.log('âœ… Operadores guardados en localStorage');
        } catch (error) {
          console.warn('âš ï¸ Error guardando operadores en localStorage:', error);
        }

        // Actualizar cachÃ© global si existe
        if (window.ERPState && typeof window.ERPState.setCache === 'function') {
          window.ERPState.setCache('operadores', operadoresExistentes);
        }

        if (window._operadoresCache) {
          window._operadoresCache = operadoresExistentes;
        }

        console.log(
          `âœ… SincronizaciÃ³n completada: ${operadoresActualizados} actualizados, ${operadoresCreados} creados`
        );
      } else {
        console.log('ℹ️ No hubo cambios en los operadores');
      }
    } catch (error) {
      console.error('❌ Error sincronizando operadores desde tráfico:', error);
    }
  };

  window.guardarGastosOperadoresModal = async function (regId) {
    console.log('ðŸ’° Guardando gastos de operadores para:', regId);

    const filasGastos = document.querySelectorAll('[id^="modal_gasto_fila_"]');
    const gastos = [];

    filasGastos.forEach(fila => {
      const gastoId = fila.id.replace('modal_gasto_fila_', '');
      const operador = fila.querySelector('.modal_gasto_operador')?.value;
      const motivo = fila.querySelector('.modal_gasto_motivo')?.value;
      const monto = fila.querySelector('.modal_gasto_monto')?.value;
      const fecha = fila.querySelector('.modal_gasto_fecha')?.value;

      if (operador && motivo && monto) {
        gastos.push({
          id: gastoId.startsWith('gasto_') ? gastoId : `gasto_${gastoId}`,
          numeroRegistro: regId,
          origen: 'trafico',
          operador: operador,
          motivo: motivo,
          tipoGasto: motivo,
          monto: parseFloat(monto) || 0,
          fecha: fecha || new Date().toISOString().split('T')[0],
          fechaCreacion: fecha || new Date().toISOString().split('T')[0],
          tenantId: window.tenantId || window.DEMO_CONFIG?.tenantId || 'demo_tenant'
        });
      }
    });

    // Guardar gastos en Firebase
    if (window.firebaseRepos?.operadores && gastos.length > 0) {
      for (const gasto of gastos) {
        try {
          await window.firebaseRepos.operadores.save(gasto.id, gasto);
        } catch (error) {
          console.error(`âŒ Error guardando gasto ${gasto.id}:`, error);
        }
      }
      console.log(`âœ… ${gastos.length} gastos guardados en Firebase`);
    }

    // Guardar tambiÃ©n en localStorage como respaldo
    try {
      const gastosData = localStorage.getItem('erp_operadores_gastos');
      const todosGastos = gastosData ? JSON.parse(gastosData) : [];

      // Eliminar gastos antiguos de este registro
      const gastosFiltrados = todosGastos.filter(
        g => !(g.numeroRegistro === regId && g.origen === 'trafico')
      );

      // Agregar nuevos gastos
      const gastosActualizados = [...gastosFiltrados, ...gastos];
      localStorage.setItem('erp_operadores_gastos', JSON.stringify(gastosActualizados));
      console.log('âœ… Gastos guardados en localStorage');
    } catch (error) {
      console.error('âŒ Error guardando gastos en localStorage:', error);
    }
  };
})();
