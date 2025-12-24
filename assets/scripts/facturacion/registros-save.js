/**
 * Guardado de Registros de Facturación - facturacion.html
 * Operaciones de guardado: Guardar datos en Firebase y localStorage
 */

(function () {
  'use strict';

  /**
   * Guarda los datos de facturación
   * @returns {Promise<boolean>} true si se guardó exitosamente
   */
  window.saveFacturacionData = async function () {
    console.log('💾 Guardando datos de facturación...');

    try {
      // Verificar y asegurar autenticación en Firebase antes de guardar
      if (window.firebaseAuth && !window.firebaseAuth.currentUser) {
        console.log('🔐 Usuario no autenticado en Firebase, intentando autenticar...');

        // Intentar autenticar con usuario demo
        if (typeof window.firebaseSignIn === 'function') {
          try {
            await window.firebaseSignIn(
              'demo@titanfleet.com',
              'demo123',
              window.DEMO_CONFIG?.tenantId || 'demo_tenant'
            );
            console.log('✅ Usuario demo autenticado');
          } catch (authError) {
            console.warn('⚠️ No se pudo autenticar automáticamente:', authError);
          }
        }
      }

      // Esperar a que Firebase esté completamente inicializado
      if (window.__firebaseReposReady) {
        try {
          await window.__firebaseReposReady;
        } catch (e) {
          console.warn('⚠️ Error esperando __firebaseReposReady:', e);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Asegurar que DataPersistence esté disponible
      if (typeof window.DataPersistence === 'undefined') {
        console.warn('⚠️ DataPersistence no disponible, creando versión de respaldo...');
        if (typeof window.ensureDataPersistence === 'function') {
          window.ensureDataPersistence();
        }
      }

      // Obtener número de registro del campo del formulario
      const numeroRegistroInput = document.getElementById('numeroRegistro');
      let registroId = numeroRegistroInput?.value?.trim();

      // Si no hay valor, intentar obtenerlo de otras fuentes
      if (!registroId) {
        const datosForm = await window.obtenerDatosFacturacion();
        if (datosForm?.numeroRegistro) {
          registroId = datosForm.numeroRegistro.trim();
        }
      }

      // Reintentar si aún no hay valor
      if (!registroId) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const numeroRegistroInputRetry = document.getElementById('numeroRegistro');
        registroId = numeroRegistroInputRetry?.value?.trim();

        if (!registroId) {
          const datosFormRetry = await window.obtenerDatosFacturacion();
          if (datosFormRetry?.numeroRegistro) {
            registroId = datosFormRetry.numeroRegistro.trim();
          }
        }
      }

      if (!registroId) {
        const valorActual = document.getElementById('numeroRegistro')?.value || '(vacío)';
        alert(
          `Error: No se encontró número de registro en el campo.\n\nValor actual del campo: "${valorActual}"\n\nPor favor:\n1. Verifica que el número de registro esté ingresado correctamente\n2. Usa el botón "Buscar" para buscar un registro existente de tráfico\n3. O ingresa el número manualmente`
        );
        document.getElementById('numeroRegistro')?.focus();
        return false;
      }

      console.log('✅ Número de registro a usar:', registroId);

      // Validar tipo de cambio si es USD
      if (typeof window.validarTipoCambio === 'function' && !window.validarTipoCambio()) {
        console.error('❌ Validación de tipo de cambio falló');
        return false;
      }

      // Obtener datos del formulario
      const datosFacturacion = await window.obtenerDatosFacturacion();
      console.log('📋 Datos de facturación a guardar:', datosFacturacion);

      let resultado = false;

      // Verificar que Firebase esté disponible
      if (!window.firebaseRepos?.facturacion) {
        console.warn('⚠️ Firebase no está disponible aún. Esperando inicialización...');
        let intentos = 0;
        const maxIntentos = 6;

        while (!window.firebaseRepos?.facturacion && intentos < maxIntentos) {
          await new Promise(resolve => setTimeout(resolve, 500));
          intentos++;
        }

        if (!window.firebaseRepos?.facturacion) {
          alert('Error: Sistema de Firebase no disponible. Por favor recarga la página.');
          return false;
        }
      }

      if (window.firebaseRepos?.facturacion) {
        try {
          const repo = window.firebaseRepos.facturacion;

          if (!repo.db || !repo.tenantId) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (!repo.db || !repo.tenantId) {
              throw new Error('Repositorio de Firebase no está inicializado');
            }
          }

          // Verificar si ya existe un registro con este numeroRegistro
          let registroExistente = null;

          try {
            const query = window.fs.query(
              window.fs.collection(repo.db, repo.collectionName),
              window.fs.where('numeroRegistro', '==', registroId)
            );
            const querySnapshot = await window.fs.getDocs(query);

            if (!querySnapshot.empty) {
              registroExistente = querySnapshot.docs[0];
              console.log(
                '⚠️ Ya existe un registro en facturación con numeroRegistro:',
                registroId
              );

              const actualizar = confirm(
                `Ya existe un registro de facturación con el número ${registroId}.\n\n` +
                  '¿Deseas actualizar el registro existente?\n\n' +
                  '- Sí: Actualizar el registro existente\n' +
                  '- No: Cancelar (no se guardará nada)'
              );

              if (!actualizar) {
                alert('Operación cancelada. El registro no se guardó.');
                return false;
              }

              registroId = registroExistente.id;
              console.log('✅ Actualizando registro existente con ID:', registroId);
            }
          } catch (queryError) {
            console.warn(
              '⚠️ Error verificando registro existente, continuando con guardado:',
              queryError
            );
          }

          const fechaCreacionParaGuardar =
            datosFacturacion.fechaCreacion || new Date().toISOString().split('T')[0];

          // Limpiar datos duplicados antes de guardar
          const datosLimpios = { ...datosFacturacion };

          // Eliminar campos duplicados o innecesarios
          delete datosLimpios.registroId; // Ya tenemos numeroRegistro
          delete datosLimpios.numeroFactura; // No se usa
          delete datosLimpios.fecha; // Duplicado de fechaFactura
          delete datosLimpios.ultimaActualizacion; // Duplicado de fechaActualizacion
          delete datosLimpios.updatedAt; // Duplicado de fechaActualizacion
          delete datosLimpios.tipoMoneda; // Duplicado de moneda
          delete datosLimpios['Cliente']; // Duplicado de cliente (con mayúscula)
          delete datosLimpios['Folio Fiscal']; // Duplicado de folioFiscal (con espacio)
          delete datosLimpios['Subtotal']; // Ya tenemos subtotal (sin mayúscula)
          delete datosLimpios['total factura']; // Duplicado de total

          // Eliminar campos vacíos o undefined
          Object.keys(datosLimpios).forEach(key => {
            if (
              datosLimpios[key] === undefined ||
              datosLimpios[key] === '' ||
              datosLimpios[key] === null
            ) {
              delete datosLimpios[key];
            }
          });

          const resultadoSave = await repo.save(registroId, {
            tipo: 'registro',
            numeroRegistro: registroId,
            ...datosLimpios,
            fechaCreacion: registroExistente
              ? registroExistente.data().fechaCreacion || fechaCreacionParaGuardar
              : fechaCreacionParaGuardar,
            fechaActualizacion: new Date().toISOString()
          });

          if (resultadoSave) {
            console.log('✅ Registro guardado en Firebase facturacion:', registroId);
            resultado = true;
          } else {
            throw new Error('No se pudo guardar en Firebase');
          }
        } catch (error) {
          console.error('❌ Error guardando en Firebase facturacion:', error);
          alert(`Error al guardar en Firebase: ${error.message}`);
          return false;
        }
      }

      // RESPALDO: Guardar también en localStorage
      try {
        // NO USAR localStorage - Solo Firebase es la fuente de verdad
        // Eliminado guardado en localStorage para evitar inconsistencias entre navegadores
        // Los datos solo se guardan en Firebase ahora
      } catch (error) {
        console.warn('⚠️ Error en proceso de guardado:', error);
      }

      // Actualizar contador de pendientes
      setTimeout(async () => {
        if (typeof window.actualizarContadorPendientesFacturacion === 'function') {
          await window.actualizarContadorPendientesFacturacion();
        }
      }, 500);

      // NOTA: Ya no se registra en CXC desde facturación
      // CXC ahora lee directamente desde la colección de facturación en Firebase
      // Los pagos se guardan en CXC, pero las facturas se leen desde facturación
      console.log(
        '✅ Factura guardada en facturación. CXC leerá automáticamente desde la colección de facturación.'
      );

      // Recargar la lista de registros
      if (resultado) {
        setTimeout(async () => {
          if (typeof window.cargarRegistrosFacturacionConFiltro === 'function') {
            await window.cargarRegistrosFacturacionConFiltro();
          } else if (typeof window.cargarRegistrosFacturacion === 'function') {
            await window.cargarRegistrosFacturacion();
          }
        }, 1000);
      }

      return resultado;
    } catch (error) {
      console.error('❌ Error al guardar datos de facturación:', error);
      alert(`Error al guardar datos de facturación: ${error.message}`);
      return false;
    }
  };

  console.log('✅ Módulo registros-save.js cargado');
})();
