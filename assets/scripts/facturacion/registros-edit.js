/**
 * Edición de Registros de Facturación - facturacion.html
 * Operaciones de edición: Abrir modal de edición y guardar cambios
 */

(function () {
  'use strict';

  /**
   * Función auxiliar para actualizar tipo de cambio según moneda
   */
  window.actualizarTipoCambioMXN = function () {
    const tipoMoneda = document.getElementById('modal_tipo_moneda');
    const tipoCambio = document.getElementById('modal_tipo_cambio');

    if (tipoMoneda && tipoCambio) {
      if (tipoMoneda.value === 'USD') {
        tipoCambio.required = true;
        tipoCambio.removeAttribute('readonly');
        tipoCambio.style.backgroundColor = '';
      } else {
        tipoCambio.required = false;
        tipoCambio.value = '0';
        tipoCambio.setAttribute('readonly', 'readonly');
        tipoCambio.style.backgroundColor = '#e9ecef';
      }
    }
  };

  /**
   * Función para calcular el total de la factura automáticamente
   */
  function calcularTotalFactura() {
    const subtotal = parseFloat(document.getElementById('modal_subtotal')?.value || 0);
    const iva = parseFloat(document.getElementById('modal_iva')?.value || 0);
    const ivaRetenido = parseFloat(document.getElementById('modal_iva_retenido')?.value || 0);
    const isrRetenido = parseFloat(document.getElementById('modal_isr_retenido')?.value || 0);
    const otrosMontos = parseFloat(document.getElementById('modal_otros_montos')?.value || 0);

    const total = subtotal + iva - ivaRetenido - isrRetenido + otrosMontos;

    const campoTotal = document.getElementById('modal_total_factura');
    if (campoTotal) {
      campoTotal.value = total.toFixed(2);
    }
  }

  /**
   * Editar un registro de Facturación
   */
  window.editarRegistroFacturacion = async function (regId) {
    try {
      const registro = await window.obtenerRegistroFacturacion(regId);

      if (!registro) {
        alert('❌ Registro no encontrado');
        return;
      }

      // Obtener RFC del cliente
      let rfcCliente = registro.rfcCliente || registro.RFC || registro.rfc || '';

      if (!rfcCliente) {
        try {
          if (window.firebaseRepos?.logistica) {
            const registroLogistica = await window.firebaseRepos.logistica.get(regId);
            if (registroLogistica) {
              rfcCliente =
                registroLogistica.rfcCliente ||
                registroLogistica.RFC ||
                registroLogistica.rfc ||
                '';
            }
          }
        } catch (e) {
          console.warn('⚠️ Error obteniendo RFC del cliente:', e);
        }
      }

      if (!rfcCliente) {
        rfcCliente = registro.cliente || registro.Cliente || 'N/A';
      }

      // Obtener nombre del cliente
      let nombreCliente = 'N/A';
      if (rfcCliente && rfcCliente !== 'N/A') {
        try {
          if (
            window.configuracionManager &&
            typeof window.configuracionManager.getCliente === 'function'
          ) {
            const clienteData = window.configuracionManager.getCliente(rfcCliente);
            if (clienteData) {
              nombreCliente =
                clienteData.nombre || clienteData.nombreCliente || clienteData.razonSocial || 'N/A';
            }
          }

          if (nombreCliente === 'N/A') {
            const clientesData = localStorage.getItem('erp_clientes');
            if (clientesData) {
              const clientes = JSON.parse(clientesData);
              let clienteData = null;

              if (Array.isArray(clientes)) {
                clienteData = clientes.find(c => (c.rfc || c.RFC) === rfcCliente);
              } else {
                clienteData = clientes[rfcCliente];
              }

              if (clienteData) {
                nombreCliente =
                  clienteData.nombre ||
                  clienteData.nombreCliente ||
                  clienteData.razonSocial ||
                  'N/A';
              }
            }
          }
        } catch (e) {
          console.warn('⚠️ Error obteniendo nombre del cliente:', e);
        }
      }

      if (nombreCliente === 'N/A') {
        nombreCliente = registro.cliente || registro.Cliente || 'N/A';
      }

      // Función helper para limpiar formato de moneda y obtener valor numérico
      function limpiarMonedaParaInput(valor) {
        if (!valor && valor !== 0) {
          return '';
        }
        if (typeof valor === 'number') {
          return valor;
        }
        if (typeof valor === 'string') {
          const limpio = valor.replace(/[$,]/g, '').trim();
          const numero = parseFloat(limpio);
          return isNaN(numero) ? '' : numero;
        }
        return '';
      }

      // Obtener valores de montos con búsqueda exhaustiva en múltiples variantes
      const subtotal = limpiarMonedaParaInput(
        registro.Subtotal || registro.subtotal || registro.montoSubtotal || 0
      );

      const iva = limpiarMonedaParaInput(registro.iva || registro.IVA || registro.montoIva || 0);

      const ivaRetenido = limpiarMonedaParaInput(
        registro['iva retenido'] || registro.ivaRetenido || registro['IVA Retenido'] || 0
      );

      const isrRetenido = limpiarMonedaParaInput(
        registro['isr retenido'] || registro.isrRetenido || registro['ISR Retenido'] || 0
      );

      const otrosMontos = limpiarMonedaParaInput(
        registro['Otros Montos'] ||
          registro.otrosMontos ||
          registro['Otros Montos a Favor o Contra'] ||
          0
      );

      // Obtener Folio Fiscal con múltiples variantes
      const folioFiscal =
        registro['Folio Fiscal'] || registro.folioFiscal || registro.folioFiscalUUID || '';

      // Mostrar modal de edición
      const modalHTML = `
                <div class="modal fade" id="modalEdicionFacturacion" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-edit"></i> Editando Registro: ${regId}
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle"></i>
                                    Edita los campos necesarios y guarda los cambios.
                                </div>
                                <form id="formEdicionFacturacion">
                                    <div class="alert alert-info">
                                        <i class="fas fa-info-circle"></i>
                                        <strong>Información No Editable:</strong> Los siguientes campos provienen de Logística y Tráfico.
                                    </div>
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label class="form-label"><strong>Cliente:</strong></label>
                                            <input type="text" class="form-control" value="${nombreCliente}" readonly>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label"><strong>RFC Cliente:</strong></label>
                                            <input type="text" class="form-control" value="${rfcCliente}" readonly>
                                        </div>
                                    </div>
                                    
                                    <hr>
                                    <div class="alert alert-warning">
                                        <i class="fas fa-edit"></i>
                                        <strong>Campos Editables:</strong> Los siguientes campos específicos de Facturación se pueden editar.
                                    </div>
                                    
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label"><strong>Serie:</strong></label>
                                            <input type="text" class="form-control" id="modal_serie" value="${registro.serie || ''}">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label"><strong>Folio:</strong></label>
                                            <input type="text" class="form-control" id="modal_folio" value="${registro.folio || ''}">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label"><strong>Folio Fiscal:</strong></label>
                                            <input type="text" class="form-control" id="modal_folio_fiscal" value="${folioFiscal}">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label"><strong>Subtotal:</strong></label>
                                            <input type="number" step="0.01" class="form-control" id="modal_subtotal" value="${subtotal}">
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label"><strong>IVA:</strong></label>
                                            <input type="number" step="0.01" class="form-control" id="modal_iva" value="${iva}">
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label"><strong>IVA Retenido:</strong></label>
                                            <input type="number" step="0.01" class="form-control" id="modal_iva_retenido" value="${ivaRetenido}">
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label"><strong>ISR Retenido:</strong></label>
                                            <input type="number" step="0.01" class="form-control" id="modal_isr_retenido" value="${isrRetenido}">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label"><strong>Otros Montos:</strong></label>
                                            <input type="number" step="0.01" class="form-control" id="modal_otros_montos" value="${otrosMontos}">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label"><strong>Tipo de Moneda:</strong></label>
                                            <select class="form-control" id="modal_tipo_moneda" onchange="window.actualizarTipoCambioMXN()">
                                                <option value="MXN" ${(registro.tipoMoneda || registro.moneda || 'MXN') === 'MXN' ? 'selected' : ''}>MXN</option>
                                                <option value="USD" ${(registro.tipoMoneda || registro.moneda) === 'USD' ? 'selected' : ''}>USD</option>
                                                <option value="EUR" ${(registro.tipoMoneda || registro.moneda) === 'EUR' ? 'selected' : ''}>EUR</option>
                                            </select>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label"><strong>Tipo de Cambio:</strong></label>
                                            <input type="number" step="0.0001" class="form-control" id="modal_tipo_cambio" value="${registro.tipoCambio || (registro.moneda === 'MXN' ? '0' : '')}">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label"><strong>Total Factura:</strong></label>
                                            <input type="number" step="0.01" class="form-control" id="modal_total_factura" value="${(subtotal + iva - ivaRetenido - isrRetenido + otrosMontos).toFixed(2)}" readonly>
                                            <small class="text-muted">Se calcula automáticamente</small>
                                        </div>
                                        <div class="col-md-12 mb-3">
                                            <label class="form-label"><strong>Observaciones:</strong></label>
                                            <textarea class="form-control" id="modal_observaciones" rows="3">${registro.observaciones || registro.descripcionFacturacion || ''}</textarea>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                    <i class="fas fa-times"></i> Cancelar
                                </button>
                                <button type="button" class="btn btn-warning" onclick="window.guardarEdicionFacturacion('${regId}')">
                                    <i class="fas fa-save"></i> Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

      // Remover modal anterior si existe
      const modalAnterior = document.getElementById('modalEdicionFacturacion');
      if (modalAnterior) {
        modalAnterior.remove();
      }

      // Agregar nuevo modal
      document.body.insertAdjacentHTML('beforeend', modalHTML);

      // Mostrar modal
      const modal = new bootstrap.Modal(document.getElementById('modalEdicionFacturacion'));
      modal.show();

      // Configurar tipo de cambio según la moneda seleccionada
      setTimeout(() => {
        window.actualizarTipoCambioMXN();

        // Agregar event listeners para calcular total automáticamente cuando cambien los montos
        const camposMontos = [
          'modal_subtotal',
          'modal_iva',
          'modal_iva_retenido',
          'modal_isr_retenido',
          'modal_otros_montos'
        ];
        camposMontos.forEach(campoId => {
          const campo = document.getElementById(campoId);
          if (campo) {
            campo.addEventListener('input', () => {
              calcularTotalFactura();
            });
          }
        });
      }, 100);

      console.log(`📝 Abriendo edición del registro ${regId}`);
    } catch (error) {
      console.error('❌ Error al editar registro de Facturación:', error);
      alert('❌ Error al abrir la edición del registro');
    }
  };

  /**
   * Guardar la edición de un registro de Facturación
   */
  window.guardarEdicionFacturacion = async function (regId) {
    try {
      console.log(`💾 Guardando edición del registro ${regId}...`);

      // Obtener registro actual desde Firebase primero, luego localStorage como fallback
      let registroActual = null;

      if (window.obtenerRegistroFacturacion) {
        registroActual = await window.obtenerRegistroFacturacion(regId);
      }

      // NO USAR localStorage - Solo Firebase es la fuente de verdad
      // Eliminado fallback a localStorage para evitar inconsistencias entre navegadores
      if (!registroActual) {
        alert(
          '❌ Registro no encontrado en Firebase\n\nPor favor, asegúrate de que:\n1. Firebase esté disponible\n2. El registro exista en la base de datos\n3. Tengas conexión a internet'
        );
        console.warn('⚠️ Registro de facturación no encontrado en Firebase');
        console.warn(
          '⚠️ Firebase es la única fuente de datos. localStorage ha sido deshabilitado para evitar inconsistencias.'
        );
        return;
      }

      // Obtener datos actualizados del modal
      const tipoMoneda = document.getElementById('modal_tipo_moneda')?.value || 'MXN';
      const tipoCambio =
        document.getElementById('modal_tipo_cambio')?.value || (tipoMoneda === 'MXN' ? '0' : '');

      // Calcular total automáticamente
      const subtotal = parseFloat(document.getElementById('modal_subtotal')?.value || 0);
      const iva = parseFloat(document.getElementById('modal_iva')?.value || 0);
      const ivaRetenido = parseFloat(document.getElementById('modal_iva_retenido')?.value || 0);
      const isrRetenido = parseFloat(document.getElementById('modal_isr_retenido')?.value || 0);
      const otrosMontos = parseFloat(document.getElementById('modal_otros_montos')?.value || 0);

      const totalFactura = subtotal + iva - ivaRetenido - isrRetenido + otrosMontos;

      // Obtener observaciones
      const observaciones = document.getElementById('modal_observaciones')?.value || '';

      // Construir datos actualizados manteniendo todos los campos existentes
      const datosActualizados = {
        ...registroActual,
        // Campos editables
        serie: document.getElementById('modal_serie')?.value || '',
        folio: document.getElementById('modal_folio')?.value || '',
        'Folio Fiscal': document.getElementById('modal_folio_fiscal')?.value || '',
        folioFiscal: document.getElementById('modal_folio_fiscal')?.value || '',
        folioFiscalUUID: document.getElementById('modal_folio_fiscal')?.value || '',
        // Montos con múltiples variantes de nombres
        Subtotal: subtotal,
        subtotal: subtotal,
        montoSubtotal: subtotal,
        iva: iva,
        IVA: iva,
        montoIva: iva,
        'iva retenido': ivaRetenido,
        ivaRetenido: ivaRetenido,
        'IVA Retenido': ivaRetenido,
        'isr retenido': isrRetenido,
        isrRetenido: isrRetenido,
        'ISR Retenido': isrRetenido,
        'Otros Montos': otrosMontos,
        otrosMontos: otrosMontos,
        'Otros Montos a Favor o Contra': otrosMontos,
        // Moneda y tipo de cambio
        tipoMoneda: tipoMoneda,
        moneda: tipoMoneda,
        tipoCambio: tipoCambio,
        tipoDeCambio: tipoCambio,
        // Observaciones con múltiples variantes
        observaciones: observaciones,
        descripcionFacturacion: observaciones,
        descripcionObservaciones: observaciones,
        // Totales con múltiples variantes
        'total factura': totalFactura,
        totalFactura: totalFactura,
        montoTotal: totalFactura,
        total: totalFactura,
        // Metadata
        fechaActualizacion: new Date().toISOString(),
        ultimaActualizacion: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Mantener campos importantes
        numeroRegistro: regId,
        tipo: registroActual.tipo || 'registro'
      };

      console.log('📋 Datos a guardar:', datosActualizados);

      // PRIORIDAD 1: Guardar en Firebase
      if (window.firebaseRepos?.facturacion) {
        try {
          await window.firebaseRepos.facturacion.save(regId, datosActualizados);
          console.log('✅ Registro actualizado en Firebase');
        } catch (error) {
          console.warn('⚠️ Error actualizando en Firebase:', error);
          // Continuar con localStorage aunque Firebase falle
        }
      }

      // NO USAR localStorage - Solo Firebase es la fuente de verdad
      // Eliminado guardado en localStorage para evitar inconsistencias entre navegadores
      // Los datos solo se guardan en Firebase ahora

      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalEdicionFacturacion'));
      if (modal) {
        modal.hide();
      }

      // Esperar un momento para que Firebase se sincronice
      await new Promise(resolve => setTimeout(resolve, 500));

      // Actualizar lista
      if (typeof window.cargarRegistrosFacturacionConFiltro === 'function') {
        await window.cargarRegistrosFacturacionConFiltro();
      } else if (typeof window.cargarRegistrosFacturacion === 'function') {
        await window.cargarRegistrosFacturacion();
      }

      // Mostrar notificación
      if (typeof window.showNotification === 'function') {
        window.showNotification('✅ Registro actualizado correctamente', 'success');
      } else {
        alert('✅ Registro actualizado correctamente');
      }

      console.log(`✅ Registro ${regId} actualizado correctamente`);
    } catch (error) {
      console.error('❌ Error al guardar edición de Facturación:', error);
      alert(`❌ Error al guardar los cambios: ${error.message}`);
    }
  };

  console.log('✅ Módulo registros-edit.js cargado');
})();
