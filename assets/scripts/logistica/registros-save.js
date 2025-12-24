/**
 * Guardado de Ediciones de Registros de Logística - logistica.html
 * Operaciones de guardado: Guardar cambios de edición en Firebase y localStorage
 */

(function () {
  'use strict';

  // ============================================================
  // FUNCIÓN: Guardar cambios de edición
  // ============================================================
  window.guardarEdicionLogistica = async function (regId) {
    console.log(`💾 Guardando cambios para registro de Logística: ${regId}`);

    // Obtener el botón de guardar cambios
    const btnGuardar = document.querySelector(
      '#modalEdicionLogistica .btn-warning[onclick*="guardarEdicionLogistica"]'
    );
    let _isProcessing = false;
    let originalBtnContent = '';

    // Verificar si ya se está procesando para evitar doble clic
    if (btnGuardar && btnGuardar.disabled) {
      console.log('⚠️ El guardado ya se está procesando, ignorando clic adicional');
      return;
    }

    // Deshabilitar botón y mostrar estado de procesamiento
    if (btnGuardar) {
      originalBtnContent = btnGuardar.innerHTML;
      btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
      btnGuardar.disabled = true;
      _isProcessing = true;
    }

    // Función auxiliar para restaurar el botón en caso de error
    const restaurarBoton = () => {
      if (btnGuardar && originalBtnContent) {
        btnGuardar.innerHTML = originalBtnContent;
        btnGuardar.disabled = false;
        _isProcessing = false;
      }
    };

    try {
      const rfcCliente = document.getElementById('modal_cliente')?.value || '';

      // Obtener nombre del cliente desde el RFC
      let nombreCliente = '';
      if (rfcCliente) {
        // PRIORIDAD 1: Buscar en caché local
        if (window.__clientesCache && window.__clientesCache[rfcCliente]) {
          const clienteData = window.__clientesCache[rfcCliente];
          nombreCliente =
            clienteData.nombre || clienteData.nombreCliente || clienteData.razonSocial || '';
        }

        // PRIORIDAD 2: Buscar en configuracionManager
        if (
          !nombreCliente &&
          window.configuracionManager &&
          typeof window.configuracionManager.getCliente === 'function'
        ) {
          try {
            const clienteData = window.configuracionManager.getCliente(rfcCliente);
            if (clienteData) {
              nombreCliente =
                clienteData.nombre || clienteData.nombreCliente || clienteData.razonSocial || '';
            }
          } catch (e) {
            console.warn('⚠️ Error obteniendo cliente desde configuracionManager:', e);
          }
        }

        // Si aún no tenemos el nombre, usar el RFC como fallback temporal
        if (!nombreCliente) {
          console.warn(
            `⚠️ No se encontró el nombre del cliente para RFC: ${rfcCliente}. Usando RFC como fallback temporal.`
          );
          nombreCliente = rfcCliente; // Fallback temporal
        }
      }

      const embalajeRadio = document.querySelector('input[name="modal_embalaje"]:checked');
      const embalajeEspecial = embalajeRadio ? embalajeRadio.value : 'no';

      const datosActualizados = {
        id: regId,
        numeroRegistro: regId,
        cliente: nombreCliente, // NOMBRE del cliente (no RFC)
        rfcCliente: rfcCliente, // RFC del cliente
        RFC: rfcCliente,
        rfc: rfcCliente,
        origen: document.getElementById('modal_origen')?.value || '',
        destino: document.getElementById('modal_destino')?.value || '',
        referenciaCliente: document.getElementById('modal_referencia')?.value || '',
        fechaEnvio: document.getElementById('modal_fechaEnvio')?.value || '',
        tipoServicio: document.getElementById('modal_tiposervicio')?.value || 'General',
        embalajeEspecial: embalajeEspecial,
        plataforma: document.getElementById('modal_plataforma')?.value || '',
        tipoPlataforma: document.getElementById('modal_plataforma')?.value || '',
        mercancia: document.getElementById('modal_mercancia')?.value || '',
        tipoMercancia: document.getElementById('modal_mercancia')?.value || '',
        peso: document.getElementById('modal_peso')?.value || '',
        pesoKg: document.getElementById('modal_peso')?.value || '',
        largo: document.getElementById('modal_largo')?.value || '',
        largoM: document.getElementById('modal_largo')?.value || '',
        ancho: document.getElementById('modal_ancho')?.value || '',
        anchoM: document.getElementById('modal_ancho')?.value || '',
        descripcionEmbalaje: document.getElementById('modal_descripcionEmbalaje')?.value || '',
        descripcion: document.getElementById('modal_descripcionEmbalaje')?.value || '',
        ultimaActualizacion: new Date().toISOString(),
        estado: 'cargado',
        deleted: false
      };

      // Cargar registro actual para mantener fechaCreacion
      let registroActual = null;
      try {
        if (window.firebaseRepos?.logistica) {
          const repoLogistica = window.firebaseRepos.logistica;

          let attempts = 0;
          while (attempts < 10 && (!repoLogistica.db || !repoLogistica.tenantId)) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 300));
            if (typeof repoLogistica.init === 'function') {
              try {
                await repoLogistica.init();
              } catch (e) {
                // Ignorar error intencionalmente
              }
            }
          }

          if (repoLogistica.db && repoLogistica.tenantId) {
            registroActual = await repoLogistica.getRegistro(regId);
          }
        }
      } catch (e) {
        console.warn('⚠️ Error cargando registro actual:', e);
      }

      // Mantener datos originales importantes
      if (registroActual) {
        datosActualizados.fechaCreacion = registroActual.fechaCreacion;
        datosActualizados.rfcCliente = registroActual.rfcCliente;
      } else {
        datosActualizados.fechaCreacion = new Date().toISOString();
      }

      // Guardar en Firebase
      if (window.firebaseRepos?.logistica) {
        await window.firebaseRepos.logistica.saveRegistro(regId, datosActualizados);
        console.log('✅ Registro guardado en Firebase');
      }

      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalEdicionLogistica'));
      if (modal) {
        modal.hide();
      }

      // Actualizar la lista de registros
      await window.cargarRegistrosLogistica();

      // Notificación removida según solicitud del usuario
      console.log(`✅ Registro ${regId} guardado con datos:`, datosActualizados);

      // Recargar la página como F5
      window.location.reload();
    } catch (error) {
      console.error('❌ Error guardando edición:', error);
      // Restaurar botón en caso de error
      restaurarBoton();
      alert('❌ Error al guardar los cambios. Intenta nuevamente.');
    }
  };

  console.log('✅ Módulo registros-save.js cargado');
})();
