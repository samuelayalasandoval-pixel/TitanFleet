/**
 * Funciones de EdiciÃ³n de Registros - trafico.html
 * Funciones para editar registros de trÃ¡fico
 *
 * @module trafico/edit-manager
 */

(function () {
  'use strict';
  window.editarRegistroTrafico = async function (regId) {
    console.log(`âœï¸ Editando registro de TrÃ¡fico: ${regId}`);

    let registro = null;

    // 0. PRIORIDAD: Usar obtenerRegistroTrafico que ya tiene toda la lógica mejorada
    if (typeof window.obtenerRegistroTrafico === 'function') {
      try {
        registro = await window.obtenerRegistroTrafico(regId);
        if (registro) {
          console.log('✅ Registro encontrado usando obtenerRegistroTrafico');
          console.log('📋 Datos del registro obtenidos:', {
            destino: registro.destino || registro.LugarDestino,
            origen: registro.origen || registro.LugarOrigen,
            cliente: registro.cliente,
            numeroRegistro: registro.numeroRegistro,
            timestamp: registro.timestamp || registro.fechaCreacion || 'N/A'
          });
        }
      } catch (error) {
        console.warn('⚠️ Error usando obtenerRegistroTrafico:', error);
      }
    }

    // 1. PRIORIDAD: Buscar en Firebase (fallback si obtenerRegistroTrafico no funcionó)
    try {
      if (window.firebaseRepos?.trafico) {
        registro = await window.firebaseRepos.trafico.get(regId);
        if (registro) {
          console.log('âœ… Registro encontrado en Firebase');
        }
      }
    } catch (error) {
      console.warn('âš ï¸ Error buscando en Firebase:', error);
    }

    // 2. NO USAR localStorage - Solo Firebase es la fuente de verdad
    // Eliminado fallback a localStorage para evitar inconsistencias entre navegadores
    if (false && !registro) {
      const raw = localStorage.getItem('erp_shared_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        registro = parsed.trafico?.[regId];
        if (registro) {
          console.warn('⚠️ Registro encontrado en localStorage (puede estar desactualizado)');
          console.warn('⚠️ ADVERTENCIA: Los datos pueden no estar sincronizados entre navegadores');
          console.log('📋 Datos del registro desde localStorage:', {
            destino: registro.destino || registro.LugarDestino,
            origen: registro.origen || registro.LugarOrigen,
            cliente: registro.cliente,
            numeroRegistro: registro.numeroRegistro
          });
        }
      }
    }

    if (!registro) {
      alert('âŒ Registro no encontrado');
      return;
    }

    // Obtener el nombre del cliente desde el RFC
    // PRIORIDAD: Usar rfcCliente primero, ya que cliente puede contener el nombre
    // IMPORTANTE: Si rfcCliente parece ser un nombre (tiene más de 13 caracteres o contiene espacios), no usarlo
    let rfcCliente = '';
    if (
      registro.rfcCliente &&
      registro.rfcCliente.length <= 13 &&
      !registro.rfcCliente.includes(' ')
    ) {
      rfcCliente = registro.rfcCliente;
    } else if (registro.RFC && registro.RFC.length <= 13 && !registro.RFC.includes(' ')) {
      rfcCliente = registro.RFC;
    } else if (registro.rfc && registro.rfc.length <= 13 && !registro.rfc.includes(' ')) {
      rfcCliente = registro.rfc;
    }

    let nombreCliente = registro.cliente || 'N/A';

    // Si no hay RFC válido pero hay un valor en registro.Cliente que parece RFC, usarlo
    if (
      !rfcCliente &&
      registro.Cliente &&
      registro.Cliente.length <= 13 &&
      !registro.Cliente.includes(' ')
    ) {
      rfcCliente = registro.Cliente;
    }

    try {
      // Si tenemos un RFC válido, obtener el nombre del cliente
      if (
        rfcCliente &&
        rfcCliente.length <= 13 &&
        typeof window.obtenerClienteNombre === 'function'
      ) {
        const nombreObtenido = await window.obtenerClienteNombre(rfcCliente);
        if (nombreObtenido && nombreObtenido !== rfcCliente) {
          nombreCliente = nombreObtenido;
          console.log(`✅ Nombre del cliente obtenido: ${nombreCliente} (RFC: ${rfcCliente})`);
        } else {
          // Si no se encuentra nombre pero tenemos rfcCliente válido, usar el nombre que ya está en registro.cliente
          console.log(
            `ℹ️ No se encontró nombre del cliente para RFC: ${rfcCliente}, usando nombre existente`
          );
        }
      } else if (rfcCliente && rfcCliente.length > 13) {
        // Si rfcCliente tiene más de 13 caracteres, probablemente es el nombre, no el RFC
        // Buscar el RFC correcto basado en el nombre
        console.warn(`⚠️ rfcCliente parece ser un nombre en lugar de RFC: ${rfcCliente}`);
        nombreCliente = rfcCliente;
      }
    } catch (error) {
      console.warn('⚠️ Error obteniendo nombre del cliente:', error);
    }

    // Los datos se cargarán directamente en el modal

    // Mostrar modal de confirmación de edición
    const modalHTML = `
          <div class="modal fade" id="modalEdicionTrafico" tabindex="-1" aria-hidden="true">
              <div class="modal-dialog modal-lg">
                  <div class="modal-content">
                      <div class="modal-header bg-warning text-dark">
                          <h5 class="modal-title" style="color: white !important;">
                              <i class="fas fa-edit"></i> Editando Registro: ${regId}
                          </h5>
                          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                      </div>
                      <div class="modal-body">
                          <div class="alert alert-info">
                              <i class="fas fa-info-circle"></i>
                              Edita los campos necesarios y guarda los cambios.
                          </div>
                          <form id="formEdicionTrafico">
                              <!-- Información de solo lectura (no editable) -->
                              <div class="alert alert-info">
                                  <i class="fas fa-info-circle"></i>
                                  <strong>Información No Editable:</strong> Los siguientes campos no se pueden editar desde Tráfico.
                              </div>
                              <div class="row mb-3">
                                  <div class="col-md-12">
                                      <label class="form-label"><strong>Cliente:</strong></label>
                                      <input type="text" class="form-control" value="${nombreCliente}" readonly>
                                  </div>
                              </div>
                              
                              <hr>
                              <div class="alert alert-warning">
                                  <i class="fas fa-edit"></i>
                                  <strong>Campos Editables:</strong> Los siguientes campos específicos de Tráfico se pueden editar.
                              </div>
                              
                              <div class="row">
                                  <!-- Campos editables según especificación -->
                                  <div class="col-md-6 mb-3">
                                      <label class="form-label">Lugar Origen</label>
                                      <select class="form-select" id="modal_lugar_origen" style="z-index: 1055;">
                                          <option value="">Seleccione una estancia...</option>
                                      </select>
                                  </div>
                                  <div class="col-md-6 mb-3">
                                      <label class="form-label">Lugar Destino</label>
                                      <select class="form-select" id="modal_lugar_destino" style="z-index: 1055;">
                                          <option value="">Seleccione una estancia...</option>
                                      </select>
                                  </div>
                                  <div class="col-md-6 mb-3">
                                      <label class="form-label">Plataforma/Servicio</label>
                                      <input type="text" class="form-control" id="modal_plataforma_servicio" value="${registro.plataformaServicio || registro.plataforma || ''}">
                                  </div>
                                  <div class="col-md-6 mb-3">
                                      <label class="form-label">Placas Plataforma</label>
                                      <input type="text" class="form-control" id="modal_placas_plataforma" value="${registro.placasPlataforma || registro.Placas || ''}">
                                  </div>
                                  <div class="col-md-6 mb-3">
                                      <label class="form-label">Tipo Plataforma</label>
                                      <select class="form-select" id="modal_tipo_plataforma" style="z-index: 1055;">
                                          <option value="">Seleccione...</option>
                                          <option value="48ft" ${registro.tipoPlataforma === '48ft' || registro.tipoPlataforma === '48 ft' ? 'selected' : ''}>48 ft</option>
                                          <option value="53ft" ${registro.tipoPlataforma === '53ft' || registro.tipoPlataforma === '53 ft' ? 'selected' : ''}>53 ft</option>
                                          <option value="extendible" ${registro.tipoPlataforma === 'extendible' ? 'selected' : ''}>Extendible</option>
                                          <option value="step-deck" ${registro.tipoPlataforma === 'step-deck' ? 'selected' : ''}>Step-Deck</option>
                                          <option value="lowboy" ${registro.tipoPlataforma === 'lowboy' ? 'selected' : ''}>Lowboy</option>
                                      </select>
                                  </div>
                                  <div class="col-md-6 mb-3">
                                      <label class="form-label">Tractocamión</label>
                                      <select class="form-select" id="modal_economico" style="z-index: 1055;">
                                          <option value="">Seleccione un económico...</option>
                                      </select>
                                  </div>
                                  <div class="col-md-6 mb-3">
                                      <label class="form-label">Operador Principal</label>
                                      <select class="form-select" id="modal_operador_principal" style="z-index: 1055;">
                                          <option value="">Seleccione operador principal...</option>
                                      </select>
                                  </div>
                                  <div class="col-md-6 mb-3">
                                      <label class="form-label">Operador Secundario</label>
                                      <select class="form-select" id="modal_operador_secundario" style="z-index: 1055;">
                                          <option value="">Seleccione operador secundario...</option>
                                      </select>
                                  </div>
                              </div>
                              
                              <hr>
                              <div class="alert alert-info">
                                  <i class="fas fa-dollar-sign"></i>
                                  <strong>Gastos Operadores:</strong> Edita los gastos de operadores asociados a este registro.
                              </div>
                              <div id="modal_gastos_operadores">
                                  <!-- Los gastos se cargarÃ¡n dinÃ¡micamente -->
                              </div>
                              <div class="row mt-2">
                                  <div class="col-12">
                                      <button type="button" class="btn btn-outline-primary btn-sm" onclick="window.agregarGastoOperadorModal()">
                                          <i class="fas fa-plus"></i> Agregar Gasto
                                      </button>
                                  </div>
                              </div>
                              
                              <hr>
                              <div class="alert alert-secondary">
                                  <i class="fas fa-cog"></i>
                                  <strong>Campos Automáticos:</strong> Los siguientes campos se actualizan automáticamente según el sistema.
                              </div>
                              
                              <div class="row">
                                  <!-- Campos que se actualizan automáticamente -->
                                  <div class="col-md-6 mb-3">
                                      <label class="form-label"><strong>Licencia Operador Principal:</strong></label>
                                      <input type="text" class="form-control" id="modal_licencia_principal" value="${registro.Licencia || 'Se actualiza automáticamente'}" readonly>
                                  </div>
                                  <div class="col-md-6 mb-3">
                                      <label class="form-label"><strong>Licencia Operador Secundario:</strong></label>
                                      <input type="text" class="form-control" id="modal_licencia_secundaria" value="${registro.LicenciaSecundaria || 'Se actualiza automáticamente'}" readonly>
                                  </div>
                                  <div class="col-md-6 mb-3">
                                      <label class="form-label"><strong>Placas Tractor:</strong></label>
                                      <input type="text" class="form-control" id="modal_placas_tractor" value="${registro.Placas || 'Se actualiza automáticamente'}" readonly>
                                  </div>
                                  <div class="col-md-6 mb-3">
                                      <label class="form-label"><strong>Permiso SCT:</strong></label>
                                      <input type="text" class="form-control" id="modal_permiso_sct" value="${registro.permisoSCT || 'Se actualiza automáticamente'}" readonly>
                                  </div>
                              </div>
                              
                              ${
  registro.estadoPlataforma === 'descargado' ||
                                registro.estado === 'descargado'
    ? `
                              <hr>
                              <div class="alert alert-warning">
                                  <i class="fas fa-download"></i>
                                  <strong>Información de Descarga:</strong> Edita los datos de quién descargó esta plataforma.
                              </div>
                              
                              <div class="row">
                                  <div class="col-md-6 mb-3">
                                      <label class="form-label">Tractocamión (Descarga)</label>
                                      <select class="form-select" id="modal_tractocamion_descarga" style="z-index: 1055;">
                                          <option value="">Seleccione un económico...</option>
                                      </select>
                                  </div>
                                  <div class="col-md-6 mb-3">
                                      <label class="form-label">Operador Principal (Descarga)</label>
                                      <select class="form-select" id="modal_operador_principal_descarga" style="z-index: 1055;">
                                          <option value="">Seleccione operador principal...</option>
                                      </select>
                                  </div>
                                  <div class="col-md-6 mb-3">
                                      <label class="form-label">Operador Secundario (Descarga)</label>
                                      <select class="form-select" id="modal_operador_secundario_descarga" style="z-index: 1055;">
                                          <option value="">Seleccione operador secundario...</option>
                                      </select>
                                  </div>
                                  <div class="col-md-6 mb-3">
                                      <label class="form-label">Fecha de Descarga</label>
                                      <input type="date" class="form-control" id="modal_fecha_descarga" value="${registro.fechaDescarga ? registro.fechaDescarga.split('T')[0] : ''}">
                                  </div>
                                  <div class="col-md-12 mb-3">
                                      <label class="form-label">Notas de Descarga</label>
                                      <textarea class="form-control" id="modal_notas_descarga" rows="3">${registro.notasDescarga || registro.observacionesDescarga || ''}</textarea>
                                  </div>
                              </div>
                              `
    : ''
  }
                          </form>
                      </div>
                      <div class="modal-footer">
                          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                              <i class="fas fa-times"></i> Cancelar
                          </button>
                          <button type="button" class="btn btn-warning" onclick="window.guardarEdicionTrafico('${regId}')">
                              <i class="fas fa-save"></i> Guardar Cambios
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      `;

    // Remover modal existente si existe
    const modalExistente = document.getElementById('modalEdicionTrafico');
    if (modalExistente) {
      modalExistente.remove();
    }

    // Agregar nuevo modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Cargar listas validadas despuÃ©s de agregar el modal al DOM
    // Usar un delay para asegurar que el modal estÃ© completamente renderizado
    setTimeout(async () => {
      console.log('ðŸ”„ Iniciando carga de listas en modal de ediciÃ³n...');
      console.log('ðŸ”„ Registro recibido:', registro);

      // Verificar que el select existe antes de intentar cargar
      const selectEconomicoCheck = document.getElementById('modal_economico');
      console.log('ðŸ” Select econÃ³mico existe?', Boolean(selectEconomicoCheck));

      if (!selectEconomicoCheck) {
        console.error('âŒ Select modal_economico no encontrado, reintentando en 100ms...');
        setTimeout(async () => {
          try {
            if (typeof window.cargarListasValidadasModal === 'function') {
              await window.cargarListasValidadasModal(registro);
            } else {
              console.error('âŒ cargarListasValidadasModal no estÃ¡ disponible');
            }

            if (typeof window.cargarGastosOperadoresModal === 'function') {
              await window.cargarGastosOperadoresModal(regId);
            } else {
              console.error('âŒ cargarGastosOperadoresModal no estÃ¡ disponible');
            }

            if (
              (registro.estadoPlataforma === 'descargado' || registro.estado === 'descargado') &&
              typeof window.cargarListasDescargaModal === 'function'
            ) {
              await window.cargarListasDescargaModal(registro);
            }
          } catch (error) {
            console.error('âŒ Error en reintento de carga:', error);
          }
        }, 100);
        return;
      }

      try {
        if (typeof window.cargarListasValidadasModal === 'function') {
          await window.cargarListasValidadasModal(registro);
          console.log('âœ… Listas validadas cargadas');
        } else {
          console.error('âŒ cargarListasValidadasModal no estÃ¡ disponible');
        }
      } catch (error) {
        console.error('âŒ Error cargando listas validadas:', error);
      }

      try {
        if (typeof window.cargarGastosOperadoresModal === 'function') {
          await window.cargarGastosOperadoresModal(regId);
          console.log('âœ… Gastos de operadores cargados');
        } else {
          console.error('âŒ cargarGastosOperadoresModal no estÃ¡ disponible');
        }
      } catch (error) {
        console.error('âŒ Error cargando gastos de operadores:', error);
      }

      // Si el estado es descargado, cargar listas para campos de descarga
      if (registro.estadoPlataforma === 'descargado' || registro.estado === 'descargado') {
        try {
          if (typeof window.cargarListasDescargaModal === 'function') {
            await window.cargarListasDescargaModal(registro);
            console.log('âœ… Listas de descarga cargadas');
          } else {
            console.error('âŒ cargarListasDescargaModal no estÃ¡ disponible');
          }
        } catch (error) {
          console.error('âŒ Error cargando listas de descarga:', error);
        }
      }

      // Agregar event listeners para actualizar campos automÃ¡ticos
      const selectEconomico = document.getElementById('modal_economico');
      const selectOperadorPrincipal = document.getElementById('modal_operador_principal');
      const selectOperadorSecundario = document.getElementById('modal_operador_secundario');

      if (selectEconomico && typeof window.actualizarCamposAutomaticosModal === 'function') {
        selectEconomico.addEventListener('change', window.actualizarCamposAutomaticosModal);
      } else if (selectEconomico) {
        console.warn(
          'âš ï¸ actualizarCamposAutomaticosModal no estÃ¡ disponible, no se agregÃ³ listener a econÃ³mico'
        );
      }

      if (
        selectOperadorPrincipal &&
        typeof window.actualizarCamposAutomaticosModal === 'function'
      ) {
        selectOperadorPrincipal.addEventListener('change', window.actualizarCamposAutomaticosModal);
      } else if (selectOperadorPrincipal) {
        console.warn(
          'âš ï¸ actualizarCamposAutomaticosModal no estÃ¡ disponible, no se agregÃ³ listener a operador principal'
        );
      }

      if (
        selectOperadorSecundario &&
        typeof window.actualizarCamposAutomaticosModal === 'function'
      ) {
        selectOperadorSecundario.addEventListener(
          'change',
          window.actualizarCamposAutomaticosModal
        );
      } else if (selectOperadorSecundario) {
        console.warn(
          'âš ï¸ actualizarCamposAutomaticosModal no estÃ¡ disponible, no se agregÃ³ listener a operador secundario'
        );
      }

      // Llamar a actualizarCamposAutomaticosModal después de cargar las listas para llenar los campos automáticos iniciales
      if (typeof window.actualizarCamposAutomaticosModal === 'function') {
        console.log('🔄 Actualizando campos automáticos con valores iniciales...');
        await window.actualizarCamposAutomaticosModal();
        console.log('✅ Campos automáticos actualizados con valores iniciales');
      }

      // Mostrar el modal después de cargar todo
      const modalElement = document.getElementById('modalEdicionTrafico');
      if (modalElement) {
        // Agregar listener para limpiar cuando se cierre el modal (cualquier mÃ©todo)
        const limpiarAlCerrar = () => {
          // Remover todos los backdrops
          const backdrops = document.querySelectorAll('.modal-backdrop');
          backdrops.forEach(backdrop => backdrop.remove());

          // Remover clase modal-open del body
          document.body.classList.remove('modal-open');
          document.body.style.paddingRight = '';
          document.body.style.overflow = '';

          console.log('âœ… Modal cerrado y limpiado completamente');
        };

        // Escuchar evento hidden.bs.modal (cuando el modal se oculta completamente)
        modalElement.addEventListener('hidden.bs.modal', limpiarAlCerrar, { once: true });

        // TambiÃ©n escuchar si se cierra con Escape o click fuera
        modalElement.addEventListener(
          'hide.bs.modal',
          () => {
            // Limpiar inmediatamente cuando empiece a cerrarse
            setTimeout(limpiarAlCerrar, 100);
          },
          { once: true }
        );

        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
          const modal = new bootstrap.Modal(modalElement);

          // Agregar listener para cuando el modal esté completamente visible
          modalElement.addEventListener(
            'shown.bs.modal',
            async () => {
              console.log('✅ Modal completamente visible, asegurando selección de estancias...');

              // Asegurar que los valores de origen y destino estén seleccionados
              const selectOrigen = document.getElementById('modal_lugar_origen');
              const selectDestino = document.getElementById('modal_lugar_destino');

              if (selectOrigen && registro) {
                const valorOrigen =
                  registro.origen || registro.LugarOrigen || registro.lugarOrigen || '';
                if (valorOrigen && selectOrigen.value !== valorOrigen) {
                  // Intentar seleccionar nuevamente
                  const opciones = selectOrigen.querySelectorAll('option');
                  const valorOrigenTrim = String(valorOrigen).trim();

                  opciones.forEach(opt => {
                    const optValue = opt.value.trim();
                    const optText = opt.textContent.trim();

                    const coincide =
                      valorOrigenTrim === optValue ||
                      valorOrigenTrim === optText ||
                      valorOrigenTrim.toLowerCase() === optValue.toLowerCase() ||
                      valorOrigenTrim.toLowerCase() === optText.toLowerCase() ||
                      optValue.toLowerCase().includes(valorOrigenTrim.toLowerCase()) ||
                      valorOrigenTrim.toLowerCase().includes(optValue.toLowerCase()) ||
                      optText.toLowerCase().includes(valorOrigenTrim.toLowerCase()) ||
                      valorOrigenTrim.toLowerCase().includes(optText.toLowerCase()) ||
                      (optText.includes('(') &&
                        optText.split('(')[0].trim().toLowerCase() ===
                          valorOrigenTrim.toLowerCase());

                    if (coincide) {
                      opt.selected = true;
                      selectOrigen.value = optValue;
                      selectOrigen.dispatchEvent(new Event('change', { bubbles: true }));
                      console.log(`✅ Origen seleccionado después de mostrar modal: ${optValue}`);
                    }
                  });
                }
              }

              if (selectDestino && registro) {
                const valorDestino =
                  registro.destino || registro.LugarDestino || registro.lugarDestino || '';
                if (valorDestino && selectDestino.value !== valorDestino) {
                  // Intentar seleccionar nuevamente
                  const opciones = selectDestino.querySelectorAll('option');
                  const valorDestinoTrim = String(valorDestino).trim();

                  opciones.forEach(opt => {
                    const optValue = opt.value.trim();
                    const optText = opt.textContent.trim();

                    const coincide =
                      valorDestinoTrim === optValue ||
                      valorDestinoTrim === optText ||
                      valorDestinoTrim.toLowerCase() === optValue.toLowerCase() ||
                      valorDestinoTrim.toLowerCase() === optText.toLowerCase() ||
                      optValue.toLowerCase().includes(valorDestinoTrim.toLowerCase()) ||
                      valorDestinoTrim.toLowerCase().includes(optValue.toLowerCase()) ||
                      optText.toLowerCase().includes(valorDestinoTrim.toLowerCase()) ||
                      valorDestinoTrim.toLowerCase().includes(optText.toLowerCase()) ||
                      (optText.includes('(') &&
                        optText.split('(')[0].trim().toLowerCase() ===
                          valorDestinoTrim.toLowerCase());

                    if (coincide) {
                      opt.selected = true;
                      selectDestino.value = optValue;
                      selectDestino.dispatchEvent(new Event('change', { bubbles: true }));
                      console.log(`✅ Destino seleccionado después de mostrar modal: ${optValue}`);
                    }
                  });
                }
              }
            },
            { once: true }
          );

          modal.show();
          console.log('âœ… Modal mostrado despuÃ©s de cargar listas');
        } else {
          console.error('âŒ Bootstrap Modal no estÃ¡ disponible');
          // Fallback: mostrar modal manualmente
          modalElement.style.display = 'block';
          modalElement.classList.add('show');
          modalElement.setAttribute('aria-modal', 'true');
          const backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          document.body.appendChild(backdrop);
          console.warn('âš ï¸ Modal mostrado manualmente (Bootstrap no disponible)');
        }
      } else {
        console.error('âŒ Modal modalEdicionTrafico no encontrado');
      }
    }, 100);

    // Mostrar modal
    const modalElement = document.getElementById('modalEdicionTrafico');
    if (modalElement) {
      // Agregar listener para limpiar cuando se cierre el modal (cualquier mÃ©todo)
      const limpiarAlCerrar = () => {
        // Remover todos los backdrops
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());

        // Remover clase modal-open del body
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
        document.body.style.overflow = '';

        console.log('âœ… Modal cerrado y limpiado completamente');
      };

      // Escuchar evento hidden.bs.modal (cuando el modal se oculta completamente)
      modalElement.addEventListener('hidden.bs.modal', limpiarAlCerrar, { once: true });

      // TambiÃ©n escuchar si se cierra con Escape o click fuera
      modalElement.addEventListener(
        'hide.bs.modal',
        () => {
          // Limpiar inmediatamente cuando empiece a cerrarse
          setTimeout(limpiarAlCerrar, 100);
        },
        { once: true }
      );

      if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      } else {
        console.error('âŒ Bootstrap Modal no estÃ¡ disponible');
        // Fallback: mostrar modal manualmente
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        modalElement.setAttribute('aria-modal', 'true');
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
        console.warn('âš ï¸ Modal mostrado manualmente (Bootstrap no disponible)');
      }
    } else {
      console.error('âŒ Modal modalEdicionTrafico no encontrado');
    }

    console.log(`âœ… Formulario llenado para ediciÃ³n del registro ${regId}`);
  };

  window.guardarEdicionTrafico = async function (regId) {
    console.log(`ðŸ’¾ Guardando cambios para registro de TrÃ¡fico: ${regId}`);

    try {
      // 1. Obtener registro actual desde Firebase
      let registro = null;
      if (window.firebaseRepos?.trafico) {
        registro = await window.firebaseRepos.trafico.get(regId);
      }

      // Fallback: buscar en localStorage
      if (!registro) {
        const raw = localStorage.getItem('erp_shared_data');
        const parsed = raw ? JSON.parse(raw) : {};
        registro = parsed.trafico?.[regId];
      }

      if (!registro) {
        alert('âŒ Registro no encontrado');
        return;
      }

      // Función auxiliar para obtener nombre del operador
      const obtenerNombreOperadorEdit = async valor => {
        if (!valor || valor.trim() === '') {
          return '';
        }

        // Si el valor contiene " - ", extraer solo el nombre
        if (valor.includes(' - ')) {
          const nombre = valor.split(' - ')[0].trim();
          if (nombre) {
            return nombre;
          }
        }

        // Si ya es un nombre (no parece ser licencia/ID), retornarlo
        if (valor.length > 3 && !valor.match(/^[A-Z0-9-]+$/)) {
          return valor;
        }

        // Si existe la función global, usarla
        if (typeof window.obtenerOperadorNombre === 'function') {
          try {
            const nombre = await window.obtenerOperadorNombre(valor);
            return nombre || valor;
          } catch (e) {
            console.warn('⚠️ Error obteniendo nombre del operador:', e);
          }
        }

        return valor;
      };

      // Obtener valores de operadores del modal
      const operadorPrincipalRaw =
        document.getElementById('modal_operador_principal')?.value ||
        registro.operadorPrincipal ||
        registro.operadorprincipal ||
        '';
      const operadorSecundarioRaw =
        document.getElementById('modal_operador_secundario')?.value ||
        registro.operadorSecundario ||
        registro.operadorsecundario ||
        '';
      const operadorPrincipalDescargaRaw =
        document.getElementById('modal_operador_principal_descarga')?.value ||
        registro.operadorPrincipalDescarga ||
        '';
      const operadorSecundarioDescargaRaw =
        document.getElementById('modal_operador_secundario_descarga')?.value ||
        registro.operadorSecundarioDescarga ||
        '';

      // Convertir a nombres
      const operadorPrincipalNombre = await obtenerNombreOperadorEdit(operadorPrincipalRaw);
      const operadorSecundarioNombre = await obtenerNombreOperadorEdit(operadorSecundarioRaw);
      const operadorPrincipalDescargaNombre = await obtenerNombreOperadorEdit(
        operadorPrincipalDescargaRaw
      );
      const operadorSecundarioDescargaNombre = await obtenerNombreOperadorEdit(
        operadorSecundarioDescargaRaw
      );

      // Asegurar que rfcCliente se preserve correctamente (no sobrescribir con nombre)
      let rfcClientePreservado = '';
      if (
        registro.rfcCliente &&
        registro.rfcCliente.length <= 13 &&
        !registro.rfcCliente.includes(' ')
      ) {
        // Si el RFC es válido, usarlo
        rfcClientePreservado = registro.rfcCliente;
      } else if (registro.RFC && registro.RFC.length <= 13 && !registro.RFC.includes(' ')) {
        rfcClientePreservado = registro.RFC;
      } else if (registro.rfc && registro.rfc.length <= 13 && !registro.rfc.includes(' ')) {
        rfcClientePreservado = registro.rfc;
      }

      // Si el RFC parece ser un nombre, intentar buscar el RFC correcto
      if (!rfcClientePreservado && registro.rfcCliente && registro.rfcCliente.length > 13) {
        console.warn('⚠️ rfcCliente contiene un nombre, intentando buscar RFC correcto...');
        if (typeof window.configuracionManager?.getCliente === 'function') {
          // Buscar por nombre
          const todosLosClientes = (await window.configuracionManager.getAllClientes()) || [];

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
          const clientes = todosLosClientes.filter(cliente => {
            const clienteTenantId = cliente.tenantId;
            return clienteTenantId === tenantId;
          });
          const clientesArray = Array.isArray(clientes) ? clientes : Object.values(clientes || {});
          const clienteEncontrado = clientesArray.find(
            c =>
              c &&
              (c.nombre || c.nombreCliente || c.razonSocial || '').trim() ===
                registro.rfcCliente.trim()
          );
          if (clienteEncontrado && clienteEncontrado.rfc) {
            rfcClientePreservado = clienteEncontrado.rfc;
            console.log('✅ RFC encontrado basado en nombre:', rfcClientePreservado);
          }
        }
      }

      // 2. Obtener datos actualizados del modal de edición
      const datosActualizados = {
        // Mantener todos los datos originales
        ...registro,

        // Asegurar que rfcCliente tenga el RFC correcto (no el nombre)
        rfcCliente: rfcClientePreservado || registro.rfcCliente || '',

        // Actualizar campos editables
        'referencia cliente':
          document.getElementById('modal_referencia_cliente')?.value ||
          registro['referencia cliente'] ||
          registro.referenciaCliente ||
          '',
        referenciaCliente:
          document.getElementById('modal_referencia_cliente')?.value ||
          registro.referenciaCliente ||
          registro['referencia cliente'] ||
          '',
        origen:
          document.getElementById('modal_lugar_origen')?.value ||
          registro.origen ||
          registro.LugarOrigen ||
          '',
        LugarOrigen:
          document.getElementById('modal_lugar_origen')?.value ||
          registro.LugarOrigen ||
          registro.origen ||
          '',
        destino:
          document.getElementById('modal_lugar_destino')?.value ||
          registro.destino ||
          registro.LugarDestino ||
          '',
        LugarDestino:
          document.getElementById('modal_lugar_destino')?.value ||
          registro.LugarDestino ||
          registro.destino ||
          '',
        plataformaServicio:
          document.getElementById('modal_plataforma_servicio')?.value ||
          registro.plataformaServicio ||
          registro.plataforma ||
          '',
        plataforma:
          document.getElementById('modal_plataforma_servicio')?.value ||
          registro.plataforma ||
          registro.plataformaServicio ||
          '',
        placasPlataforma:
          document.getElementById('modal_placas_plataforma')?.value ||
          registro.placasPlataforma ||
          registro.Placas ||
          '',
        Placas:
          document.getElementById('modal_placas_plataforma')?.value ||
          registro.Placas ||
          registro.placasPlataforma ||
          '',
        tipoPlataforma:
          document.getElementById('modal_tipo_plataforma')?.value || registro.tipoPlataforma || '',
        economico: document.getElementById('modal_economico')?.value || registro.economico || '',
        tractocamion:
          document.getElementById('modal_economico')?.value ||
          registro.tractocamion ||
          registro.economico ||
          '',
        // Guardar NOMBRES de operadores, no licencias/IDs
        operadorprincipal: operadorPrincipalNombre || '',
        operadorPrincipal: operadorPrincipalNombre || '',
        operadorsecundario: operadorSecundarioNombre || '',
        operadorSecundario: operadorSecundarioNombre || '',

        // Campos de descarga (solo si el estado es descargado)
        tractocamionDescarga:
          document.getElementById('modal_tractocamion_descarga')?.value ||
          registro.tractocamionDescarga ||
          registro.economicoDescarga ||
          '',
        economicoDescarga:
          document.getElementById('modal_tractocamion_descarga')?.value ||
          registro.economicoDescarga ||
          registro.tractocamionDescarga ||
          '',
        operadorPrincipalDescarga: operadorPrincipalDescargaNombre || '',
        operadorSecundarioDescarga: operadorSecundarioDescargaNombre || '',
        fechaDescarga:
          document.getElementById('modal_fecha_descarga')?.value || registro.fechaDescarga || '',
        notasDescarga:
          document.getElementById('modal_notas_descarga')?.value ||
          registro.notasDescarga ||
          registro.observacionesDescarga ||
          '',
        observacionesDescarga:
          document.getElementById('modal_notas_descarga')?.value ||
          registro.observacionesDescarga ||
          registro.notasDescarga ||
          '',

        // Metadatos importantes
        ultimaActualizacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      };

      // 3. PRIORIDAD: Guardar registro actualizado en Firebase
      let guardadoExitoso = false;

      if (window.firebaseRepos?.trafico) {
        const repo = window.firebaseRepos.trafico;

        // Asegurar que el repositorio esté inicializado
        if (!repo.db || !repo.tenantId) {
          if (typeof repo.init === 'function') {
            await repo.init();
          }
        }

        if (repo.db && repo.tenantId) {
          try {
            await repo.save(regId, datosActualizados);
            guardadoExitoso = true;
            console.log('✅ Registro actualizado en Firebase');
          } catch (e) {
            console.error('❌ Error guardando en Firebase con repositorio:', e);
          }
        }
      }

      // Fallback: guardar directamente en Firebase si el repositorio no funcionó
      if (!guardadoExitoso && window.firebaseDb && window.fs && window.fs.doc && window.fs.setDoc) {
        try {
          const docRef = window.fs.doc(window.firebaseDb, 'trafico', regId);
          await window.fs.setDoc(docRef, datosActualizados, { merge: true });
          guardadoExitoso = true;
          console.log('✅ Registro actualizado directamente en Firebase');
        } catch (e) {
          console.error('❌ Error guardando directamente en Firebase:', e);
        }
      }

      // NO USAR localStorage - Solo Firebase es la fuente de verdad
      if (!guardadoExitoso) {
        alert(
          '❌ Error: No se pudo guardar el registro en Firebase\n\nPor favor, verifica tu conexión a internet e intenta nuevamente.'
        );
        return;
      }

      // 5. Guardar gastos de operadores
      if (typeof window.guardarGastosOperadoresModal === 'function') {
        await window.guardarGastosOperadoresModal(regId);
      } else {
        console.warn(
          '⚠️ guardarGastosOperadoresModal no está disponible, intentando guardar manualmente...'
        );
        // Fallback: guardar gastos manualmente
        try {
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
                console.error(`❌ Error guardando gasto ${gasto.id}:`, error);
              }
            }
            console.log(`✅ ${gastos.length} gastos guardados en Firebase`);
          }

          // NO USAR localStorage - Solo Firebase es la fuente de verdad
          // Los gastos ya se guardaron en Firebase arriba
        } catch (error) {
          console.error('❌ Error en fallback de guardado de gastos:', error);
        }
      }

      // 5.5. Sincronizar operadores con la hoja de operadores
      await window.sincronizarOperadoresDesdeTrafico(datosActualizados);

      // 6. Cerrar modal y limpiar completamente
      const modalElement = document.getElementById('modalEdicionTrafico');
      if (modalElement) {
        // FunciÃ³n para limpiar completamente el modal y sus efectos
        const limpiarModalCompleto = () => {
          // Remover todos los backdrops (puede haber mÃºltiples)
          const backdrops = document.querySelectorAll('.modal-backdrop');
          backdrops.forEach(backdrop => backdrop.remove());

          // Remover clase modal-open del body
          document.body.classList.remove('modal-open');

          // Restaurar padding-right del body si fue modificado
          const bodyStyle = document.body.style;
          if (bodyStyle.paddingRight) {
            bodyStyle.paddingRight = '';
          }

          // Remover estilo overflow del body
          if (bodyStyle.overflow) {
            bodyStyle.overflow = '';
          }

          // Ocultar y remover clases del modal
          modalElement.style.display = 'none';
          modalElement.classList.remove('show');
          modalElement.setAttribute('aria-hidden', 'true');
          modalElement.removeAttribute('aria-modal');

          console.log('âœ… Modal limpiado completamente');
        };

        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            // Escuchar el evento hidden.bs.modal para limpiar despuÃ©s de que se cierre
            modalElement.addEventListener(
              'hidden.bs.modal',
              function limpiarDespuesDeCerrar() {
                limpiarModalCompleto();
                // Remover el listener despuÃ©s de usarlo
                modalElement.removeEventListener('hidden.bs.modal', limpiarDespuesDeCerrar);
                // Remover modal del DOM
                setTimeout(() => {
                  if (modalElement.parentNode) {
                    modalElement.remove();
                  }
                }, 100);
              },
              { once: true }
            );

            modal.hide();
          } else {
            // Si no hay instancia, cerrar manualmente
            limpiarModalCompleto();
            setTimeout(() => {
              if (modalElement.parentNode) {
                modalElement.remove();
              }
            }, 100);
          }
        } else {
          // Fallback: cerrar modal manualmente
          limpiarModalCompleto();
          setTimeout(() => {
            if (modalElement.parentNode) {
              modalElement.remove();
            }
          }, 100);
          console.warn('âš ï¸ Modal cerrado manualmente (Bootstrap no disponible)');
        }
      }

      // 7. Actualizar la lista de registros
      if (typeof window.cargarRegistrosTrafico === 'function') {
        await window.cargarRegistrosTrafico();
      } else if (typeof window.cargarRegistrosTraficoConFiltro === 'function') {
        await window.cargarRegistrosTraficoConFiltro();
      }

      alert(`âœ… Registro ${regId} actualizado exitosamente`);
      console.log(`âœ… Registro ${regId} guardado con datos:`, datosActualizados);
    } catch (error) {
      console.error('âŒ Error guardando ediciÃ³n:', error);
      alert('âŒ Error al guardar los cambios. Intenta nuevamente.');
    }
  };

  window.cargarListasValidadasModal = async function (registro) {
    console.log('ðŸ“‹ Cargando listas validadas en modal de ediciÃ³n...');
    console.log('ðŸ“‹ Registro recibido:', registro);

    // Cargar estancias para Origen y Destino
    try {
      let estancias = [];

      // PRIORIDAD 1: Intentar desde configuracionManager
      if (
        window.configuracionManager &&
        typeof window.configuracionManager.getEstancias === 'function'
      ) {
        estancias = window.configuracionManager.getEstancias() || [];
        console.log('✅ Estancias desde configuracionManager:', estancias.length);
      }

      // PRIORIDAD 2: Intentar desde Firebase directamente (documento configuracion/estancias)
      if ((!estancias || estancias.length === 0) && window.firebaseDb && window.fs) {
        try {
          console.log('📊 Intentando cargar estancias desde Firebase...');
          const estanciasDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'estancias');
          const estanciasDoc = await window.fs.getDoc(estanciasDocRef);

          if (estanciasDoc.exists()) {
            const data = estanciasDoc.data();
            if (data.estancias && Array.isArray(data.estancias)) {
              estancias = data.estancias;
              console.log('✅ Estancias cargadas desde configuracion/estancias:', estancias.length);
            }
          }
        } catch (e) {
          console.warn('⚠️ Error obteniendo estancias desde Firebase:', e);
        }
      }

      // PRIORIDAD 3: Intentar desde firebaseRepos
      if ((!estancias || estancias.length === 0) && window.firebaseRepos?.configuracion) {
        try {
          const estanciasData = await window.firebaseRepos.configuracion.getAll();
          if (Array.isArray(estanciasData)) {
            estancias = estanciasData.filter(
              e => e.tipo === 'estancia' || e.collection === 'estancias'
            );
            console.log('✅ Estancias desde Firebase repos:', estancias.length);
          }
        } catch (e) {
          console.warn('⚠️ Error obteniendo estancias desde firebaseRepos:', e);
        }
      }

      // PRIORIDAD 4: Intentar desde traficoFirebase
      if (
        (!estancias || estancias.length === 0) &&
        window.traficoFirebase &&
        typeof window.traficoFirebase.cargarEstancias === 'function'
      ) {
        try {
          estancias = await window.traficoFirebase.cargarEstancias();
          console.log('✅ Estancias desde traficoFirebase:', estancias.length);
        } catch (e) {
          console.warn('⚠️ Error obteniendo estancias desde traficoFirebase:', e);
        }
      }

      const selectOrigen = document.getElementById('modal_lugar_origen');
      const selectDestino = document.getElementById('modal_lugar_destino');

      // Obtener valores de origen y destino con múltiples variantes
      const valorOrigen = registro.origen || registro.LugarOrigen || registro.lugarOrigen || '';
      const valorDestino = registro.destino || registro.LugarDestino || registro.lugarDestino || '';

      console.log('📋 Valores origen/destino del registro:', {
        origen: valorOrigen,
        destino: valorDestino,
        registroCompleto: {
          origen: registro.origen,
          LugarOrigen: registro.LugarOrigen,
          destino: registro.destino,
          LugarDestino: registro.LugarDestino
        }
      });

      console.log('ðŸ“ Valores origen/destino:', valorOrigen, valorDestino);
      console.log('ðŸ“ Selects encontrados:', {
        selectOrigen: Boolean(selectOrigen),
        selectDestino: Boolean(selectDestino)
      });

      if (selectOrigen) {
        selectOrigen.innerHTML = '<option value="">Seleccione una estancia...</option>';
        if (estancias && estancias.length > 0) {
          estancias.forEach(estancia => {
            const option = document.createElement('option');
            // Manejar diferentes formatos de estancia
            let nombreEstancia = '';
            if (typeof estancia === 'string') {
              nombreEstancia = estancia;
            } else if (estancia.nombre) {
              nombreEstancia = estancia.nombre;
            } else if (estancia.codigo && estancia.nombre) {
              nombreEstancia = `${estancia.nombre} (${estancia.codigo})`;
            }

            if (nombreEstancia) {
              const valorEstancia = estancia.nombre || nombreEstancia;
              option.value = valorEstancia;
              option.textContent = nombreEstancia;
              selectOrigen.appendChild(option);
            }
          });
          // Establecer el valor seleccionado después de agregar todas las opciones
          if (valorOrigen) {
            // Función para seleccionar el origen
            const seleccionarOrigen = () => {
              const opciones = selectOrigen.querySelectorAll('option');
              let encontrado = false;
              const valorOrigenTrim = String(valorOrigen).trim();

              opciones.forEach(opt => {
                const optValue = opt.value.trim();
                const optText = opt.textContent.trim();

                // Comparaciones más flexibles
                const coincide =
                  valorOrigenTrim === optValue ||
                  valorOrigenTrim === optText ||
                  valorOrigenTrim.toLowerCase() === optValue.toLowerCase() ||
                  valorOrigenTrim.toLowerCase() === optText.toLowerCase() ||
                  optValue.toLowerCase().includes(valorOrigenTrim.toLowerCase()) ||
                  valorOrigenTrim.toLowerCase().includes(optValue.toLowerCase()) ||
                  optText.toLowerCase().includes(valorOrigenTrim.toLowerCase()) ||
                  valorOrigenTrim.toLowerCase().includes(optText.toLowerCase()) ||
                  // Comparar solo el nombre sin el código entre paréntesis
                  (optText.includes('(') &&
                    optText.split('(')[0].trim().toLowerCase() === valorOrigenTrim.toLowerCase()) ||
                  (valorOrigenTrim.includes('(') &&
                    valorOrigenTrim.split('(')[0].trim().toLowerCase() ===
                      optText.split('(')[0].trim().toLowerCase());

                if (coincide && !encontrado) {
                  opt.selected = true;
                  selectOrigen.value = optValue;
                  encontrado = true;
                  console.log(
                    `✅ Origen seleccionado automáticamente: ${optValue} (valor del registro: ${valorOrigenTrim})`
                  );

                  // Disparar eventos para notificar el cambio
                  selectOrigen.dispatchEvent(new Event('change', { bubbles: true }));
                  selectOrigen.dispatchEvent(new Event('input', { bubbles: true }));
                }
              });

              if (!encontrado) {
                console.warn(
                  `⚠️ No se encontró una estancia que coincida con "${valorOrigenTrim}" para Origen`
                );
                console.log(
                  '📋 Opciones disponibles:',
                  Array.from(opciones).map(opt => ({ value: opt.value, text: opt.textContent }))
                );
                // Intentar establecer el valor directamente si no se encuentra coincidencia
                try {
                  selectOrigen.value = valorOrigenTrim;
                  console.log(
                    `⚠️ Estableciendo valor directamente para Origen: ${valorOrigenTrim}`
                  );
                } catch (e) {
                  console.warn('⚠️ No se pudo establecer el valor directamente para Origen:', e);
                }
              }
            };

            // Ejecutar inmediatamente y también después de un pequeño delay para asegurar que el DOM esté listo
            seleccionarOrigen();
            setTimeout(seleccionarOrigen, 100);
            setTimeout(seleccionarOrigen, 300);
          }
          console.log(`✅ ${estancias.length} estancias agregadas a Origen`);
        } else {
          console.warn('âš ï¸ No se encontraron estancias');
        }
      }

      if (selectDestino) {
        selectDestino.innerHTML = '<option value="">Seleccione una estancia...</option>';
        if (estancias && estancias.length > 0) {
          estancias.forEach(estancia => {
            const option = document.createElement('option');
            // Manejar diferentes formatos de estancia
            let nombreEstancia = '';
            if (typeof estancia === 'string') {
              nombreEstancia = estancia;
            } else if (estancia.nombre) {
              nombreEstancia = estancia.nombre;
            } else if (estancia.codigo && estancia.nombre) {
              nombreEstancia = `${estancia.nombre} (${estancia.codigo})`;
            }

            if (nombreEstancia) {
              const valorEstancia = estancia.nombre || nombreEstancia;
              option.value = valorEstancia;
              option.textContent = nombreEstancia;
              selectDestino.appendChild(option);
            }
          });
          // Establecer el valor seleccionado después de agregar todas las opciones
          if (valorDestino) {
            // Función para seleccionar el destino
            const seleccionarDestino = () => {
              const opciones = selectDestino.querySelectorAll('option');
              let encontrado = false;
              const valorDestinoTrim = String(valorDestino).trim();

              opciones.forEach(opt => {
                const optValue = opt.value;
                const optText = opt.textContent.trim();

                // Comparaciones más flexibles
                const coincide =
                  valorDestinoTrim === optValue ||
                  valorDestinoTrim === optText ||
                  valorDestinoTrim.toLowerCase() === optValue.toLowerCase() ||
                  valorDestinoTrim.toLowerCase() === optText.toLowerCase() ||
                  optValue.toLowerCase().includes(valorDestinoTrim.toLowerCase()) ||
                  valorDestinoTrim.toLowerCase().includes(optValue.toLowerCase()) ||
                  optText.toLowerCase().includes(valorDestinoTrim.toLowerCase()) ||
                  valorDestinoTrim.toLowerCase().includes(optText.toLowerCase()) ||
                  // Comparar solo el nombre sin el código entre paréntesis
                  (optText.includes('(') &&
                    optText.split('(')[0].trim().toLowerCase() ===
                      valorDestinoTrim.toLowerCase()) ||
                  (valorDestinoTrim.includes('(') &&
                    valorDestinoTrim.split('(')[0].trim().toLowerCase() ===
                      optText.split('(')[0].trim().toLowerCase());

                if (coincide) {
                  opt.selected = true;
                  selectDestino.value = optValue;
                  encontrado = true;
                  console.log(
                    `✅ Destino seleccionado automáticamente: ${optValue} (valor del registro: ${valorDestinoTrim})`
                  );

                  // Disparar eventos para notificar el cambio
                  selectDestino.dispatchEvent(new Event('change', { bubbles: true }));
                  selectDestino.dispatchEvent(new Event('input', { bubbles: true }));
                }
              });

              if (!encontrado) {
                console.warn(
                  `⚠️ No se encontró una estancia que coincida con "${valorDestinoTrim}"`
                );
                console.log(
                  '📋 Opciones disponibles:',
                  Array.from(opciones).map(opt => ({ value: opt.value, text: opt.textContent }))
                );
                // Intentar establecer el valor directamente si no se encuentra coincidencia
                try {
                  selectDestino.value = valorDestinoTrim;
                  console.log(`⚠️ Estableciendo valor directamente: ${valorDestinoTrim}`);
                } catch (e) {
                  console.warn('⚠️ No se pudo establecer el valor directamente:', e);
                }
              }
            };

            // Ejecutar inmediatamente y también después de un pequeño delay
            seleccionarDestino();
            setTimeout(seleccionarDestino, 100);
            setTimeout(seleccionarDestino, 300);
          } else {
            console.warn(
              '⚠️ No hay valor de destino en el registro para seleccionar automáticamente'
            );
          }
          console.log(`✅ ${estancias.length} estancias agregadas a Destino`);
        } else {
          console.warn('⚠️ No se encontraron estancias para cargar en destino');
        }
      } else {
        console.error('❌ Select modal_lugar_destino no encontrado');
      }
    } catch (error) {
      console.error('âŒ Error cargando estancias:', error);
    }

    // Cargar econÃ³micos para TractocamiÃ³n
    try {
      let economicos = [];
      // Intentar mÃºltiples fuentes
      if (
        window.configuracionManager &&
        typeof window.configuracionManager.getEconomicos === 'function'
      ) {
        const economicosTemp = window.configuracionManager.getEconomicos();
        console.log(
          'ðŸ” Tipo de datos de getEconomicos:',
          Array.isArray(economicosTemp) ? 'Array' : typeof economicosTemp
        );

        if (Array.isArray(economicosTemp)) {
          economicos = economicosTemp;
        } else if (economicosTemp && typeof economicosTemp === 'object') {
          // Convertir objeto a array
          economicos = Object.values(economicosTemp);
          console.log('ðŸ” Convertido objeto a array, total:', economicos.length);
        }

        console.log('âœ… EconÃ³micos desde configuracionManager:', economicos.length);
        if (economicos.length > 0) {
          console.log('ðŸ” Primer econÃ³mico:', economicos[0]);
          console.log('ðŸ” Campos del primer econÃ³mico:', Object.keys(economicos[0]));
        }
      }

      // Si no hay econÃ³micos, intentar desde Firebase directamente
      if (!economicos || economicos.length === 0) {
        if (window.firebaseDb && window.fs) {
          try {
            console.log('ðŸ“Š Intentando cargar econÃ³micos desde configuracion/tractocamiones...');
            const tractocamionesDocRef = window.fs.doc(
              window.firebaseDb,
              'configuracion',
              'tractocamiones'
            );
            const tractocamionesDoc = await window.fs.getDoc(tractocamionesDocRef);

            if (tractocamionesDoc.exists()) {
              const data = tractocamionesDoc.data();
              // El campo correcto es 'economicos', no 'tractocamiones'
              if (data.economicos && Array.isArray(data.economicos)) {
                const todosLosEconomicos = data.economicos;

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

                // CRÍTICO: Filtrar económicos por tenantId individual para mantener privacidad
                economicos = todosLosEconomicos.filter(economico => {
                  const economicoTenantId = economico.tenantId;
                  // Todos los usuarios solo ven económicos con su tenantId exacto
                  return economicoTenantId === tenantId;
                });

                console.log(
                  `🔒 EconÃ³micos filtrados por tenantId (${tenantId}): ${economicos.length} de ${todosLosEconomicos.length} totales`
                );
                if (economicos.length > 0) {
                  console.log('ðŸ” Primer econÃ³mico desde Firebase:', economicos[0]);
                  console.log('ðŸ” Campos del primer econÃ³mico:', Object.keys(economicos[0]));
                  console.log(
                    'ðŸ” EstadoVehiculo del primer econÃ³mico:',
                    economicos[0].estadoVehiculo
                  );
                  console.log('ðŸ” Activo del primer econÃ³mico:', economicos[0].activo);
                  console.log('ðŸ” Deleted del primer econÃ³mico:', economicos[0].deleted);
                }
              } else {
                console.warn(
                  'âš ï¸ El documento existe pero no tiene campo econÃ³micos vÃ¡lido:',
                  Object.keys(data)
                );
              }
            } else {
              console.warn('âš ï¸ El documento configuracion/tractocamiones no existe');
            }
          } catch (e) {
            console.warn('âš ï¸ Error obteniendo econÃ³micos desde Firebase:', e);
          }
        } else if (window.firebaseRepos?.configuracion) {
          try {
            const economicosData = await window.firebaseRepos.configuracion.getAll();
            if (Array.isArray(economicosData)) {
              const economicosFiltrados = economicosData.filter(
                e => e.collection === 'tractocamiones' || e.tipo === 'economico'
              );

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

              // Filtrar por tenantId
              economicos = economicosFiltrados.filter(e => e.tenantId === tenantId);
              console.log(
                `🔒 EconÃ³micos filtrados por tenantId (${tenantId}): ${economicos.length} de ${economicosFiltrados.length} totales`
              );
            }
          } catch (e) {
            console.warn('âš ï¸ Error obteniendo econÃ³micos desde Firebase repos:', e);
          }
        }
      }

      // Si aÃºn no hay econÃ³micos, intentar desde getAllEconomicos
      if (
        (!economicos || economicos.length === 0) &&
        window.configuracionManager &&
        typeof window.configuracionManager.getAllEconomicos === 'function'
      ) {
        try {
          const economicosAll = window.configuracionManager.getAllEconomicos();
          if (Array.isArray(economicosAll) && economicosAll.length > 0) {
            economicos = economicosAll;
            console.log('âœ… EconÃ³micos desde getAllEconomicos:', economicos.length);
          }
        } catch (e) {
          console.warn('âš ï¸ Error obteniendo econÃ³micos desde getAllEconomicos:', e);
        }
      }

      const selectEconomico = document.getElementById('modal_economico');
      const valorEconomico = registro.economico || registro.tractocamion || '';

      console.log('ðŸš› Valor econÃ³mico:', valorEconomico);
      console.log('ðŸš› Select econÃ³mico encontrado:', Boolean(selectEconomico));

      if (selectEconomico) {
        selectEconomico.innerHTML = '<option value="">Seleccione un econÃ³mico...</option>';
        if (economicos && economicos.length > 0) {
          console.log(`ðŸ“Š Total econÃ³micos cargados: ${economicos.length}`);
          console.log('ðŸ” Primer econÃ³mico (muestra):', economicos[0]);

          // Filtrar solo tractocamiones activos (excluir inactivos y retirados)
          const economicosActivos = economicos.filter(economico => {
            // Verificar que tenga algÃºn identificador vÃ¡lido
            const tieneIdentificador =
              economico &&
              (economico.numero ||
                economico.nombre ||
                economico.numeroEconomico ||
                (typeof economico === 'string' && economico.trim() !== ''));

            if (!tieneIdentificador) {
              return false;
            }

            // Excluir si estÃ¡ marcado como eliminado
            if (economico.deleted === true) {
              return false;
            }

            // Excluir si el estado del vehÃ­culo es explÃ­citamente inactivo o retirado
            const estadoVehiculo = (
              economico.estadoVehiculo ||
              economico.estado ||
              ''
            ).toLowerCase();
            if (estadoVehiculo === 'inactivo' || estadoVehiculo === 'retirado') {
              return false;
            }

            // Excluir solo si el campo activo estÃ¡ explÃ­citamente en false (no si es undefined o null)
            if (economico.activo === false) {
              return false;
            }

            // Si no tiene ningÃºn campo de estado, asumir que estÃ¡ activo
            return true;
          });

          console.log(
            `ðŸ” Filtrado validaciÃ³n: ${economicos.length} totales â†’ ${economicosActivos.length} activos`
          );

          if (economicosActivos.length === 0 && economicos.length > 0) {
            console.warn(
              'âš ï¸ Todos los econÃ³micos fueron filtrados. Mostrando todos para debugging...'
            );
            console.log('ðŸ” Ejemplo de econÃ³mico filtrado:', economicos[0]);
            console.log('ðŸ” Campos del econÃ³mico:', Object.keys(economicos[0]));
            console.log('ðŸ” estadoVehiculo:', economicos[0].estadoVehiculo);
            console.log('ðŸ” activo:', economicos[0].activo);
            console.log('ðŸ” deleted:', economicos[0].deleted);

            // Si todos fueron filtrados, mostrar todos para evitar que la lista quede vacÃ­a
            // (esto es temporal para debugging)
            economicosActivos.push(...economicos);
          }

          economicosActivos.forEach(economico => {
            const option = document.createElement('option');
            const numeroEconomico =
              economico.numero || economico.nombre || economico.numeroEconomico || economico;
            option.value = numeroEconomico;
            option.textContent = numeroEconomico;
            // Comparar de manera mÃ¡s flexible
            if (
              valorEconomico &&
              (valorEconomico === numeroEconomico ||
                valorEconomico.toString() === numeroEconomico.toString())
            ) {
              option.selected = true;
            }
            selectEconomico.appendChild(option);
          });
          console.log(`âœ… ${economicosActivos.length} econÃ³micos agregados al select`);
        } else {
          console.warn('âš ï¸ No se encontraron econÃ³micos para cargar');
        }
      }
    } catch (error) {
      console.error('âŒ Error cargando econÃ³micos:', error);
    }

    // Cargar operadores principales y secundarios
    try {
      let operadores = [];
      // Intentar mÃºltiples fuentes
      if (
        window.configuracionManager &&
        typeof window.configuracionManager.getOperadores === 'function'
      ) {
        const operadoresTemp = window.configuracionManager.getOperadores();
        operadores = Array.isArray(operadoresTemp) ? operadoresTemp : [];
        console.log('âœ… Operadores desde configuracionManager:', operadores.length);
      }

      // Si no hay operadores, intentar desde Firebase directamente
      if (!operadores || operadores.length === 0) {
        if (window.firebaseDb && window.fs) {
          try {
            console.log('ðŸ“Š Intentando cargar operadores desde configuracion/operadores...');
            const operadoresDocRef = window.fs.doc(
              window.firebaseDb,
              'configuracion',
              'operadores'
            );
            const operadoresDoc = await window.fs.getDoc(operadoresDocRef);

            if (operadoresDoc.exists()) {
              const data = operadoresDoc.data();
              if (data.operadores && Array.isArray(data.operadores)) {
                operadores = data.operadores;
                console.log(
                  'âœ… Operadores cargados desde configuracion/operadores:',
                  operadores.length
                );
              }
            }
          } catch (e) {
            console.warn('âš ï¸ Error obteniendo operadores desde Firebase:', e);
          }
        } else if (window.firebaseRepos?.configuracion) {
          try {
            const operadoresData = await window.firebaseRepos.configuracion.getAll();
            if (Array.isArray(operadoresData)) {
              operadores = operadoresData.filter(
                o => o.collection === 'operadores' || o.tipo === 'operador'
              );
            }
            console.log('âœ… Operadores desde Firebase repos:', operadores.length);
          } catch (e) {
            console.warn('âš ï¸ Error obteniendo operadores desde Firebase repos:', e);
          }
        }
      }

      const selectOperadorPrincipal = document.getElementById('modal_operador_principal');
      const selectOperadorSecundario = document.getElementById('modal_operador_secundario');

      const valorOperadorPrincipal = registro.operadorprincipal || registro.operadorPrincipal || '';
      const valorOperadorSecundario =
        registro.operadorsecundario || registro.operadorSecundario || '';

      console.log('ðŸ‘¤ Valores operadores:', valorOperadorPrincipal, valorOperadorSecundario);
      console.log('ðŸ‘¤ Selects encontrados:', {
        selectOperadorPrincipal: Boolean(selectOperadorPrincipal),
        selectOperadorSecundario: Boolean(selectOperadorSecundario)
      });
      console.log('ðŸ‘¤ Total operadores:', operadores.length);

      // Filtrar operadores principales
      const operadoresPrincipales = operadores.filter(
        op =>
          op.tipoOperador === 'principal' ||
          op.tipoOperador === 'Principal' ||
          op.tipo === 'principal'
      );

      console.log('ðŸ‘¤ Operadores principales:', operadoresPrincipales.length);

      if (selectOperadorPrincipal) {
        selectOperadorPrincipal.innerHTML =
          '<option value="">Seleccione operador principal...</option>';
        if (operadoresPrincipales && operadoresPrincipales.length > 0) {
          operadoresPrincipales.forEach(operador => {
            const option = document.createElement('option');
            const operadorId = operador.id || operador.nombre || operador;
            const operadorNombre = operador.nombre || operador;
            option.value = operadorId;
            option.textContent = operadorNombre;
            // Comparar de manera mÃ¡s flexible (por ID o nombre)
            if (
              valorOperadorPrincipal &&
              (valorOperadorPrincipal === operadorId ||
                valorOperadorPrincipal === operadorNombre ||
                valorOperadorPrincipal.toString() === operadorId.toString() ||
                valorOperadorPrincipal.toLowerCase() === operadorNombre.toLowerCase())
            ) {
              option.selected = true;
            }
            selectOperadorPrincipal.appendChild(option);
          });
          console.log(`âœ… ${operadoresPrincipales.length} operadores principales agregados`);
        } else {
          console.warn('âš ï¸ No se encontraron operadores principales');
        }
      }

      // Filtrar operadores secundarios
      const operadoresSecundarios = operadores.filter(
        op =>
          op.tipoOperador === 'secundario' ||
          op.tipoOperador === 'Secundario' ||
          op.tipo === 'secundario'
      );

      console.log('ðŸ‘¤ Operadores secundarios:', operadoresSecundarios.length);

      if (selectOperadorSecundario) {
        selectOperadorSecundario.innerHTML =
          '<option value="">Seleccione operador secundario...</option>';
        if (operadoresSecundarios && operadoresSecundarios.length > 0) {
          operadoresSecundarios.forEach(operador => {
            const option = document.createElement('option');
            const operadorId = operador.id || operador.nombre || operador;
            const operadorNombre = operador.nombre || operador;
            option.value = operadorId;
            option.textContent = operadorNombre;
            // Comparar de manera mÃ¡s flexible (por ID o nombre)
            if (
              valorOperadorSecundario &&
              (valorOperadorSecundario === operadorId ||
                valorOperadorSecundario === operadorNombre ||
                valorOperadorSecundario.toString() === operadorId.toString() ||
                valorOperadorSecundario.toLowerCase() === operadorNombre.toLowerCase())
            ) {
              option.selected = true;
            }
            selectOperadorSecundario.appendChild(option);
          });
          console.log(`âœ… ${operadoresSecundarios.length} operadores secundarios agregados`);
        } else {
          console.warn('âš ï¸ No se encontraron operadores secundarios');
        }
      }
    } catch (error) {
      console.error('âŒ Error cargando operadores:', error);
    }

    console.log('âœ… Listas validadas cargadas en modal');
  };

  // FunciÃ³n para cargar listas de descarga en el modal
  window.cargarListasDescargaModal = async function (registro) {
    console.log('ðŸ“‹ Cargando listas de descarga en modal...');

    // Cargar econÃ³micos para TractocamiÃ³n Descarga
    try {
      let economicos = [];
      if (
        window.configuracionManager &&
        typeof window.configuracionManager.getEconomicos === 'function'
      ) {
        const economicosTemp = window.configuracionManager.getEconomicos();
        economicos = Array.isArray(economicosTemp) ? economicosTemp : [];
      }

      if (economicos.length === 0 && window.firebaseDb && window.fs) {
        try {
          const tractocamionesDocRef = window.fs.doc(
            window.firebaseDb,
            'configuracion',
            'tractocamiones'
          );
          const tractocamionesDoc = await window.fs.getDoc(tractocamionesDocRef);
          if (tractocamionesDoc.exists()) {
            const data = tractocamionesDoc.data();
            if (data.economicos && Array.isArray(data.economicos)) {
              economicos = data.economicos;
            }
          }
        } catch (e) {
          console.warn('âš ï¸ Error obteniendo econÃ³micos para descarga:', e);
        }
      }

      const selectEconomicoDescarga = document.getElementById('modal_tractocamion_descarga');
      const valorEconomicoDescarga =
        registro.tractocamionDescarga || registro.economicoDescarga || '';

      if (selectEconomicoDescarga) {
        selectEconomicoDescarga.innerHTML = '<option value="">Seleccione un econÃ³mico...</option>';
        if (economicos && economicos.length > 0) {
          // Filtrar solo tractocamiones activos (excluir inactivos y retirados)
          const economicosActivos = economicos.filter(economico => {
            // Verificar que tenga nÃºmero o nombre (al menos un identificador)
            if (
              !economico ||
              (!economico.numero && !economico.nombre && !economico.numeroEconomico)
            ) {
              return false;
            }

            // Excluir si estÃ¡ marcado como eliminado
            if (economico.deleted === true) {
              return false;
            }

            // Excluir si el estado del vehÃ­culo es explÃ­citamente inactivo o retirado
            const estadoVehiculo = (
              economico.estadoVehiculo ||
              economico.estado ||
              ''
            ).toLowerCase();
            if (estadoVehiculo === 'inactivo' || estadoVehiculo === 'retirado') {
              return false;
            }

            // Excluir solo si el campo activo estÃ¡ explÃ­citamente en false (no si es undefined)
            if (economico.activo === false) {
              return false;
            }

            // Si no tiene ningÃºn campo de estado, asumir que estÃ¡ activo
            return true;
          });

          console.log(
            `ðŸ” Filtrado descarga: ${economicos.length} totales â†’ ${economicosActivos.length} activos`
          );

          economicosActivos.forEach(economico => {
            const option = document.createElement('option');
            const numeroEconomico =
              economico.numero || economico.nombre || economico.numeroEconomico || economico;
            option.value = numeroEconomico;
            option.textContent = numeroEconomico;
            if (
              valorEconomicoDescarga &&
              (valorEconomicoDescarga === numeroEconomico ||
                valorEconomicoDescarga.toString() === numeroEconomico.toString())
            ) {
              option.selected = true;
            }
            selectEconomicoDescarga.appendChild(option);
          });
          console.log(
            `âœ… ${economicosActivos.length} econÃ³micos activos agregados para descarga (de ${economicos.length} totales)`
          );
        }
      }
    } catch (error) {
      console.error('âŒ Error cargando econÃ³micos para descarga:', error);
    }

    // Cargar operadores para descarga
    try {
      let operadores = [];
      if (
        window.configuracionManager &&
        typeof window.configuracionManager.getOperadores === 'function'
      ) {
        const operadoresTemp = window.configuracionManager.getOperadores();
        operadores = Array.isArray(operadoresTemp) ? operadoresTemp : [];
      }

      if (operadores.length === 0 && window.firebaseDb && window.fs) {
        try {
          const operadoresDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'operadores');
          const operadoresDoc = await window.fs.getDoc(operadoresDocRef);
          if (operadoresDoc.exists()) {
            const data = operadoresDoc.data();
            if (data.operadores && Array.isArray(data.operadores)) {
              operadores = data.operadores;
            }
          }
        } catch (e) {
          console.warn('âš ï¸ Error obteniendo operadores para descarga:', e);
        }
      }

      const selectOperadorPrincipalDescarga = document.getElementById(
        'modal_operador_principal_descarga'
      );
      const selectOperadorSecundarioDescarga = document.getElementById(
        'modal_operador_secundario_descarga'
      );

      const valorOperadorPrincipalDescarga = registro.operadorPrincipalDescarga || '';
      const valorOperadorSecundarioDescarga = registro.operadorSecundarioDescarga || '';

      // Filtrar operadores principales
      const operadoresPrincipales = operadores.filter(
        op =>
          op.tipoOperador === 'principal' ||
          op.tipoOperador === 'Principal' ||
          op.tipo === 'principal'
      );

      if (selectOperadorPrincipalDescarga) {
        selectOperadorPrincipalDescarga.innerHTML =
          '<option value="">Seleccione operador principal...</option>';
        if (operadoresPrincipales && operadoresPrincipales.length > 0) {
          operadoresPrincipales.forEach(operador => {
            const option = document.createElement('option');
            const operadorId = operador.id || operador.nombre || operador;
            const operadorNombre = operador.nombre || operador;
            option.value = operadorId;
            option.textContent = operadorNombre;
            if (
              valorOperadorPrincipalDescarga &&
              (valorOperadorPrincipalDescarga === operadorId ||
                valorOperadorPrincipalDescarga === operadorNombre ||
                valorOperadorPrincipalDescarga.toString() === operadorId.toString() ||
                valorOperadorPrincipalDescarga.toLowerCase() === operadorNombre.toLowerCase())
            ) {
              option.selected = true;
            }
            selectOperadorPrincipalDescarga.appendChild(option);
          });
        }
      }

      // Filtrar operadores secundarios
      const operadoresSecundarios = operadores.filter(
        op =>
          op.tipoOperador === 'secundario' ||
          op.tipoOperador === 'Secundario' ||
          op.tipo === 'secundario'
      );

      if (selectOperadorSecundarioDescarga) {
        selectOperadorSecundarioDescarga.innerHTML =
          '<option value="">Seleccione operador secundario...</option>';
        if (operadoresSecundarios && operadoresSecundarios.length > 0) {
          operadoresSecundarios.forEach(operador => {
            const option = document.createElement('option');
            const operadorId = operador.id || operador.nombre || operador;
            const operadorNombre = operador.nombre || operador;
            option.value = operadorId;
            option.textContent = operadorNombre;
            if (
              valorOperadorSecundarioDescarga &&
              (valorOperadorSecundarioDescarga === operadorId ||
                valorOperadorSecundarioDescarga === operadorNombre ||
                valorOperadorSecundarioDescarga.toString() === operadorId.toString() ||
                valorOperadorSecundarioDescarga.toLowerCase() === operadorNombre.toLowerCase())
            ) {
              option.selected = true;
            }
            selectOperadorSecundarioDescarga.appendChild(option);
          });
        }
      }
    } catch (error) {
      console.error('âŒ Error cargando operadores para descarga:', error);
    }

    console.log('âœ… Listas de descarga cargadas en modal');
  };

  // FunciÃ³n para actualizar campos automÃ¡ticos en el modal
  window.actualizarCamposAutomaticosModal = async function () {
    console.log('ðŸ”„ Actualizando campos automÃ¡ticos en modal...');

    // Obtener valores seleccionados
    const selectEconomico = document.getElementById('modal_economico');
    const selectOperadorPrincipal = document.getElementById('modal_operador_principal');
    const selectOperadorSecundario = document.getElementById('modal_operador_secundario');

    const economicoSeleccionado = selectEconomico?.value || '';
    const operadorPrincipalSeleccionado = selectOperadorPrincipal?.value || '';
    const operadorSecundarioSeleccionado = selectOperadorSecundario?.value || '';

    console.log('🔄 Valores seleccionados:', {
      economico: economicoSeleccionado,
      operadorPrincipal: operadorPrincipalSeleccionado,
      operadorSecundario: operadorSecundarioSeleccionado
    });

    // Actualizar Placas Tractor y Permiso SCT desde el económico
    if (economicoSeleccionado) {
      try {
        // Buscar el económico en las listas disponibles
        let economicos = [];
        if (
          window.configuracionManager &&
          typeof window.configuracionManager.getEconomicos === 'function'
        ) {
          const economicosTemp = window.configuracionManager.getEconomicos();
          economicos = Array.isArray(economicosTemp) ? economicosTemp : [];
          console.log(`✅ Económicos cargados desde configuracionManager: ${economicos.length}`);
        }

        if (economicos.length === 0 && window.firebaseDb && window.fs) {
          try {
            const tractocamionesDocRef = window.fs.doc(
              window.firebaseDb,
              'configuracion',
              'tractocamiones'
            );
            const tractocamionesDoc = await window.fs.getDoc(tractocamionesDocRef);
            if (tractocamionesDoc.exists()) {
              const data = tractocamionesDoc.data();
              // El campo correcto es 'economicos', no 'tractocamiones'
              if (data.economicos && Array.isArray(data.economicos)) {
                economicos = data.economicos;
              }
            }
          } catch (e) {
            console.warn('âš ï¸ Error obteniendo econÃ³micos:', e);
          }
        }

        console.log(`🔍 Buscando económico: "${economicoSeleccionado}"`);
        console.log(`🔍 Total económicos disponibles: ${economicos.length}`);

        const valorBuscado = economicoSeleccionado.toString().trim();
        const economico = economicos.find(e => {
          const numero = (e.numero || e.nombre || e.numeroEconomico || e).toString().trim();
          return (
            numero === valorBuscado ||
            numero.toString() === valorBuscado ||
            numero.toLowerCase() === valorBuscado.toLowerCase()
          );
        });

        if (economico) {
          console.log('✅ Económico encontrado:', economico);
          console.log('🔍 Campos del económico:', Object.keys(economico));
          console.log('🔍 Placas disponibles:', {
            placas: economico.placas,
            Placas: economico.Placas,
            placasTractor: economico.placasTractor,
            placasTractocamion: economico.placasTractocamion
          });

          const placasTractor = document.getElementById('modal_placas_tractor');
          const permisoSCT = document.getElementById('modal_permiso_sct');

          if (placasTractor) {
            const placas =
              economico.placas ||
              economico.Placas ||
              economico.placasTractor ||
              economico.placasTractocamion ||
              '';
            if (placas) {
              placasTractor.value = placas;
              console.log(`✅ Placas tractor actualizadas: "${placas}"`);
            } else {
              placasTractor.value = 'Se actualiza automáticamente';
              console.warn('⚠️ El económico no tiene placas definidas');
            }
          } else {
            console.warn('⚠️ Campo modal_placas_tractor no encontrado en el DOM');
          }
          if (permisoSCT) {
            const permiso = economico.permisoSCT || economico.permiso || economico.permisoSCT || '';
            if (permiso) {
              permisoSCT.value = permiso;
              console.log(`✅ Permiso SCT actualizado: "${permiso}"`);
            } else {
              permisoSCT.value = 'Se actualiza automáticamente';
              console.warn('⚠️ El económico no tiene permiso SCT definido');
            }
          } else {
            console.warn('⚠️ Campo modal_permiso_sct no encontrado en el DOM');
          }
        } else {
          console.warn(`⚠️ Económico no encontrado para: "${economicoSeleccionado}"`);
          console.log(
            '🔍 Económicos disponibles (primeros 10):',
            economicos.slice(0, 10).map(e => e.numero || e.nombre || e.numeroEconomico || 'N/A')
          );
        }
      } catch (error) {
        console.warn('âš ï¸ Error actualizando datos del econÃ³mico:', error);
      }
    }

    // Actualizar Licencia Operador Principal
    if (operadorPrincipalSeleccionado) {
      try {
        let operadores = [];
        // PRIORIDAD 1: Intentar desde getAllOperadores (incluye todos los tipos)
        if (
          window.configuracionManager &&
          typeof window.configuracionManager.getAllOperadores === 'function'
        ) {
          const operadoresTemp = window.configuracionManager.getAllOperadores();
          operadores = Array.isArray(operadoresTemp) ? operadoresTemp : [];
          console.log(
            '✅ Operadores cargados desde getAllOperadores para actualizar licencia principal:',
            operadores.length
          );
        }
        // PRIORIDAD 2: Intentar desde getOperadores
        if (
          operadores.length === 0 &&
          window.configuracionManager &&
          typeof window.configuracionManager.getOperadores === 'function'
        ) {
          const operadoresTemp = window.configuracionManager.getOperadores();
          operadores = Array.isArray(operadoresTemp) ? operadoresTemp : [];
          console.log(
            '✅ Operadores cargados desde getOperadores para actualizar licencia principal:',
            operadores.length
          );
        }

        if (operadores.length === 0 && window.firebaseDb && window.fs) {
          try {
            const operadoresDocRef = window.fs.doc(
              window.firebaseDb,
              'configuracion',
              'operadores'
            );
            const operadoresDoc = await window.fs.getDoc(operadoresDocRef);
            if (operadoresDoc.exists()) {
              const data = operadoresDoc.data();
              if (data.operadores && Array.isArray(data.operadores)) {
                operadores = data.operadores;
              }
            }
          } catch (e) {
            console.warn('âš ï¸ Error obteniendo operadores:', e);
          }
        }

        const operador = operadores.find(op => {
          const nombre = op.nombre || op;
          const id = op.id || op.nombre || op;
          const valorSeleccionado = operadorPrincipalSeleccionado.toString().trim();
          return (
            nombre === valorSeleccionado ||
            id === valorSeleccionado ||
            nombre.toString().trim() === valorSeleccionado ||
            id.toString().trim() === valorSeleccionado ||
            nombre.toLowerCase() === valorSeleccionado.toLowerCase() ||
            id.toLowerCase() === valorSeleccionado.toLowerCase()
          );
        });

        if (operador) {
          const licenciaPrincipal = document.getElementById('modal_licencia_principal');
          if (licenciaPrincipal) {
            const licencia =
              operador.licencia || operador.Licencia || operador.numeroLicencia || '';
            licenciaPrincipal.value = licencia || 'Se actualiza automáticamente';
            console.log(`✅ Licencia operador principal actualizada: ${licencia}`);
          } else {
            console.warn('⚠️ Campo modal_licencia_principal no encontrado');
          }
        } else {
          console.warn(
            `⚠️ Operador principal no encontrado para: ${operadorPrincipalSeleccionado}`
          );
        }
      } catch (error) {
        console.warn('âš ï¸ Error actualizando datos del operador principal:', error);
      }
    }

    // Actualizar Licencia Operador Secundario
    if (operadorSecundarioSeleccionado) {
      try {
        let operadores = [];
        // PRIORIDAD 1: Intentar desde getAllOperadores (incluye todos los tipos)
        if (
          window.configuracionManager &&
          typeof window.configuracionManager.getAllOperadores === 'function'
        ) {
          const operadoresTemp = window.configuracionManager.getAllOperadores();
          operadores = Array.isArray(operadoresTemp) ? operadoresTemp : [];
          console.log(
            '✅ Operadores cargados desde getAllOperadores para actualizar licencia secundaria:',
            operadores.length
          );
        }
        // PRIORIDAD 2: Intentar desde getOperadores
        if (
          operadores.length === 0 &&
          window.configuracionManager &&
          typeof window.configuracionManager.getOperadores === 'function'
        ) {
          const operadoresTemp = window.configuracionManager.getOperadores();
          operadores = Array.isArray(operadoresTemp) ? operadoresTemp : [];
          console.log(
            '✅ Operadores cargados desde getOperadores para actualizar licencia secundaria:',
            operadores.length
          );
        }

        if (operadores.length === 0 && window.firebaseDb && window.fs) {
          try {
            const operadoresDocRef = window.fs.doc(
              window.firebaseDb,
              'configuracion',
              'operadores'
            );
            const operadoresDoc = await window.fs.getDoc(operadoresDocRef);
            if (operadoresDoc.exists()) {
              const data = operadoresDoc.data();
              if (data.operadores && Array.isArray(data.operadores)) {
                operadores = data.operadores;
              }
            }
          } catch (e) {
            console.warn('âš ï¸ Error obteniendo operadores:', e);
          }
        }

        const operador = operadores.find(op => {
          const nombre = op.nombre || op;
          const id = op.id || op.nombre || op;
          const valorSeleccionado = operadorSecundarioSeleccionado.toString().trim();
          return (
            nombre === valorSeleccionado ||
            id === valorSeleccionado ||
            nombre.toString().trim() === valorSeleccionado ||
            id.toString().trim() === valorSeleccionado ||
            nombre.toLowerCase() === valorSeleccionado.toLowerCase() ||
            id.toLowerCase() === valorSeleccionado.toLowerCase()
          );
        });

        if (operador) {
          const licenciaSecundaria = document.getElementById('modal_licencia_secundaria');
          if (licenciaSecundaria) {
            const licencia =
              operador.licencia || operador.Licencia || operador.numeroLicencia || '';
            licenciaSecundaria.value = licencia || 'Se actualiza automáticamente';
            console.log(`✅ Licencia operador secundario actualizada: ${licencia}`);
          } else {
            console.warn('⚠️ Campo modal_licencia_secundaria no encontrado');
          }
        } else {
          console.warn(
            `⚠️ Operador secundario no encontrado para: ${operadorSecundarioSeleccionado}`
          );
        }
      } catch (error) {
        console.warn('âš ï¸ Error actualizando datos del operador secundario:', error);
      }
    }

    console.log('âœ… Campos automÃ¡ticos actualizados');
  };

  // FunciÃ³n para cargar gastos de operadores en el modal
  window.cargarGastosOperadoresModal = async function (regId) {
    console.log('💰 Cargando gastos de operadores para:', regId);

    const contenedorGastos = document.getElementById('modal_gastos_operadores');
    if (!contenedorGastos) {
      return;
    }

    const regIdStr = String(regId).trim();

    // Buscar gastos en Firebase
    let gastos = [];
    try {
      if (window.firebaseRepos?.operadores) {
        const todosGastos = await window.firebaseRepos.operadores.getAll();
        gastos = todosGastos.filter(g => {
          const regIdStr = String(regId).trim();
          const gastoRegId = String(g.numeroRegistro || '').trim();
          return gastoRegId === regIdStr && (g.origen === 'trafico' || g.tipo === 'gasto');
        });
        if (gastos.length > 0) {
          console.log(
            `✅ ${gastos.length} gastos encontrados en Firebase (firebaseRepos) - FUENTE PRINCIPAL`
          );
          console.log('📋 FUENTE DE GASTOS: Firebase (firebaseRepos)');
          console.log(
            '📋 Gastos encontrados:',
            gastos.map(g => ({
              id: g.id,
              numeroRegistro: g.numeroRegistro,
              operador: g.operadorNombre || g.operador,
              motivo: g.tipoGasto || g.motivo,
              monto: g.monto
            }))
          );
        } else {
          console.warn(
            `⚠️ No se encontraron gastos en Firebase (firebaseRepos) para registro ${String(regId).trim()}`
          );
        }
      }
    } catch (error) {
      console.warn('âš ï¸ Error buscando gastos en Firebase:', error);
    }

    // PRIORIDAD 2: Buscar directamente en Firebase si firebaseRepos no está disponible
    if (gastos.length === 0 && window.firebaseDb && window.fs && window.firebaseAuth?.currentUser) {
      try {
        const { collection, getDocs, query, where } = window.fs;
        const db = window.firebaseDb;

        // Buscar gastos por numeroRegistro
        const operadoresRef = collection(db, 'operadores');
        const q = query(
          operadoresRef,
          where('numeroRegistro', '==', String(regId)),
          where('tipo', '==', 'gasto')
        );

        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.origen === 'trafico' || !data.origen) {
            gastos.push({
              id: doc.id,
              ...data
            });
          }
        });

        if (gastos.length > 0) {
          console.log(`✅ ${gastos.length} gastos encontrados en Firebase (directo)`);
          console.log('📋 FUENTE DE GASTOS: Firebase (directo) - FUENTE PRINCIPAL');
        }
      } catch (error) {
        console.warn('⚠️ Error buscando gastos directamente en Firebase:', error);
      }
    }

    // NO USAR localStorage - Solo Firebase es la fuente de verdad
    // Eliminado fallback a localStorage para evitar inconsistencias entre navegadores

    if (gastos.length === 0) {
      console.warn(`⚠️ No se encontraron gastos en Firebase para el registro ${regIdStr}`);
      console.warn(
        '⚠️ Firebase es la única fuente de datos. localStorage ha sido deshabilitado para evitar inconsistencias.'
      );
      contenedorGastos.innerHTML =
        '<p class="text-muted">No hay gastos registrados en Firebase para este registro</p>';
      return;
    }

    // Renderizar gastos
    let htmlGastos = '';
    gastos.forEach((gasto, index) => {
      const gastoId = gasto.id || gasto.gastoId || `gasto_${index + 1}`;
      htmlGastos += `
          <div class="row g-3 mb-2" id="modal_gasto_fila_${gastoId}">
            <div class="col-md-3">
              <label class="form-label">Operador</label>
              <select class="form-select modal_gasto_operador" data-gasto-id="${gastoId}">
                <option value="">Seleccione operador...</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Motivo de Pago</label>
              <select class="form-select modal_gasto_motivo" data-gasto-id="${gastoId}">
                <option value="">Seleccione motivo...</option>
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label">Monto</label>
              <input type="number" class="form-control modal_gasto_monto" data-gasto-id="${gastoId}" value="${gasto.monto || ''}" min="0" step="0.01">
            </div>
            <div class="col-md-2">
              <label class="form-label">Fecha</label>
              <input type="date" class="form-control modal_gasto_fecha" data-gasto-id="${gastoId}" value="${gasto.fecha || gasto.fechaCreacion || ''}">
            </div>
            <div class="col-md-2 d-flex align-items-end">
              <button type="button" class="btn btn-outline-danger btn-sm w-100" onclick="window.eliminarGastoOperadorModal('${gastoId}')">
                <i class="fas fa-trash"></i> Eliminar
              </button>
            </div>
          </div>
        `;
    });

    contenedorGastos.innerHTML = htmlGastos;

    // Cargar opciones de operadores y motivos para cada gasto
    for (const [index, gasto] of gastos.entries()) {
      const gastoId = gasto.id || gasto.gastoId || `gasto_${index + 1}`;
      // Pequeño delay para asegurar que el DOM esté listo
      await new Promise(resolve => setTimeout(resolve, 50));
      await window.cargarOpcionesGastoModal(gastoId, gasto);
      // Delay adicional después de cargar para asegurar que la selección se aplique
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`✅ ${gastos.length} gastos cargados en modal`);
  };

  // FunciÃ³n auxiliar para cargar opciones de un gasto
  window.cargarOpcionesGastoModal = async function (gastoId, gasto) {
    console.log('ðŸ’° Cargando opciones para gasto:', gastoId);

    // Cargar operadores
    const selectOperador = document.querySelector(
      `.modal_gasto_operador[data-gasto-id="${gastoId}"]`
    );
    if (selectOperador) {
      // Obtener lista de operadores desde mÃºltiples fuentes
      let operadores = [];
      try {
        if (
          window.configuracionManager &&
          typeof window.configuracionManager.getOperadores === 'function'
        ) {
          const operadoresTemp = window.configuracionManager.getOperadores();
          operadores = Array.isArray(operadoresTemp) ? operadoresTemp : [];
          console.log('âœ… Operadores desde configuracionManager para gasto:', operadores.length);
        }

        // Si no hay operadores, intentar desde Firebase directamente
        if (!operadores || operadores.length === 0) {
          if (window.firebaseDb && window.fs) {
            try {
              console.log(
                'ðŸ“Š Intentando cargar operadores desde configuracion/operadores para gasto...'
              );
              const operadoresDocRef = window.fs.doc(
                window.firebaseDb,
                'configuracion',
                'operadores'
              );
              const operadoresDoc = await window.fs.getDoc(operadoresDocRef);

              if (operadoresDoc.exists()) {
                const data = operadoresDoc.data();
                if (data.operadores && Array.isArray(data.operadores)) {
                  operadores = data.operadores;
                  console.log(
                    'âœ… Operadores cargados desde configuracion/operadores para gasto:',
                    operadores.length
                  );
                }
              }
            } catch (e) {
              console.warn('âš ï¸ Error obteniendo operadores desde Firebase para gasto:', e);
            }
          } else if (window.firebaseRepos?.configuracion) {
            try {
              const operadoresData = await window.firebaseRepos.configuracion.getAll();
              if (Array.isArray(operadoresData)) {
                operadores = operadoresData.filter(
                  o => o.collection === 'operadores' || o.tipo === 'operador'
                );
              }
              console.log('âœ… Operadores desde Firebase repos para gasto:', operadores.length);
            } catch (e) {
              console.warn('âš ï¸ Error obteniendo operadores desde Firebase repos para gasto:', e);
            }
          }
        }
      } catch (error) {
        console.error('âŒ Error cargando operadores para gasto:', error);
      }

      if (operadores && operadores.length > 0) {
        operadores.forEach(operador => {
          const option = document.createElement('option');
          const operadorId = operador.id || operador.nombre || operador;
          const operadorNombre = operador.nombre || operador;
          option.value = operadorId;
          option.textContent = operadorNombre;
          selectOperador.appendChild(option);
        });
        // Establecer el valor seleccionado después de agregar todas las opciones
        const valorOperadorGasto =
          gasto.operador || gasto.operadorNombre || gasto.nombreOperador || '';
        if (valorOperadorGasto) {
          const valorOperador = valorOperadorGasto.toString().trim();
          console.log(`🔍 Buscando operador para gasto: "${valorOperador}"`);
          const opciones = selectOperador.querySelectorAll('option');
          let encontrado = false;
          opciones.forEach(opt => {
            const optValue = opt.value.toString().trim();
            const optText = opt.textContent.toString().trim();

            // Comparaciones más flexibles
            if (
              valorOperador === optValue ||
              valorOperador === optText ||
              valorOperador.toLowerCase() === optValue.toLowerCase() ||
              valorOperador.toLowerCase() === optText.toLowerCase() ||
              optValue.toLowerCase().includes(valorOperador.toLowerCase()) ||
              valorOperador.toLowerCase().includes(optValue.toLowerCase()) ||
              optText.toLowerCase().includes(valorOperador.toLowerCase()) ||
              valorOperador.toLowerCase().includes(optText.toLowerCase())
            ) {
              opt.selected = true;
              encontrado = true;
              console.log(
                `✅ Operador seleccionado en gasto: "${optText}" (${optValue}) - valor del gasto: "${valorOperador}"`
              );
            }
          });
          if (!encontrado) {
            console.warn(`⚠️ No se encontró operador coincidente para: "${valorOperador}"`);
            console.log(
              '🔍 Opciones disponibles:',
              Array.from(opciones).map(o => `"${o.value}" / "${o.textContent}"`)
            );
            // Intentar establecer el valor directamente como último recurso
            try {
              selectOperador.value = valorOperador;
              if (selectOperador.value === valorOperador) {
                console.log(`✅ Operador establecido directamente: "${valorOperador}"`);
              }
            } catch (e) {
              console.warn('⚠️ No se pudo establecer el valor directamente:', e);
            }
          } else {
            // Forzar la actualización del select
            selectOperador.dispatchEvent(new Event('change', { bubbles: true }));
            // También establecer el value directamente para asegurar
            const opcionSeleccionada = Array.from(opciones).find(opt => opt.selected);
            if (opcionSeleccionada) {
              selectOperador.value = opcionSeleccionada.value;
            }
          }
        } else {
          console.warn('⚠️ No hay valor de operador en el gasto');
          console.log('🔍 Campos disponibles en el gasto:', Object.keys(gasto));
        }
        console.log(`✅ ${operadores.length} operadores agregados al select de gasto`);
      } else {
        console.warn('âš ï¸ No se encontraron operadores para el gasto');
      }
    }

    // Cargar motivos de pago
    const selectMotivo = document.querySelector(`.modal_gasto_motivo[data-gasto-id="${gastoId}"]`);
    if (selectMotivo) {
      const motivos = [
        'Combustible',
        'Peaje',
        'Alimentación',
        'Hospedaje',
        'Mantenimiento',
        'Reparación',
        'Multa',
        'Otro',
        'Viáticos',
        'Estacionamiento'
      ];

      motivos.forEach(motivo => {
        const option = document.createElement('option');
        option.value = motivo;
        option.textContent = motivo;
        selectMotivo.appendChild(option);
      });

      // Establecer el valor seleccionado después de agregar todas las opciones
      const valorMotivo = gasto.motivo || gasto.tipoGasto || gasto.motivoPago || '';
      if (valorMotivo) {
        const opciones = selectMotivo.querySelectorAll('option');
        opciones.forEach(opt => {
          const optValue = opt.value;
          const optText = opt.textContent;
          if (
            valorMotivo === optValue ||
            valorMotivo === optText ||
            valorMotivo.toLowerCase() === optValue.toLowerCase() ||
            valorMotivo.toLowerCase() === optText.toLowerCase() ||
            optValue.toLowerCase().includes(valorMotivo.toLowerCase()) ||
            valorMotivo.toLowerCase().includes(optValue.toLowerCase())
          ) {
            opt.selected = true;
            console.log(
              `✅ Motivo seleccionado en gasto: ${optValue} (valor del gasto: ${valorMotivo})`
            );
          }
        });
      }
      console.log(`✅ ${motivos.length} motivos agregados al select de gasto`);
    }
  };

  // FunciÃ³n para agregar nuevo gasto en el modal
  window.agregarGastoOperadorModal = async function () {
    const contenedorGastos = document.getElementById('modal_gastos_operadores');
    if (!contenedorGastos) {
      return;
    }

    const nuevoGastoId = `gasto_${Date.now()}`;
    const nuevaFila = `
        <div class="row g-3 mb-2" id="modal_gasto_fila_${nuevoGastoId}">
          <div class="col-md-3">
            <label class="form-label">Operador</label>
            <select class="form-select modal_gasto_operador" data-gasto-id="${nuevoGastoId}">
              <option value="">Seleccione operador...</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Motivo de Pago</label>
            <select class="form-select modal_gasto_motivo" data-gasto-id="${nuevoGastoId}">
              <option value="">Seleccione motivo...</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label">Monto</label>
            <input type="number" class="form-control modal_gasto_monto" data-gasto-id="${nuevoGastoId}" min="0" step="0.01">
          </div>
          <div class="col-md-2">
            <label class="form-label">Fecha</label>
            <input type="date" class="form-control modal_gasto_fecha" data-gasto-id="${nuevoGastoId}">
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <button type="button" class="btn btn-outline-danger btn-sm w-100" onclick="window.eliminarGastoOperadorModal('${nuevoGastoId}')">
              <i class="fas fa-trash"></i> Eliminar
            </button>
          </div>
        </div>
      `;

    contenedorGastos.insertAdjacentHTML('beforeend', nuevaFila);
    await window.cargarOpcionesGastoModal(nuevoGastoId, {});
  };

  // FunciÃ³n para eliminar gasto del modal
  window.eliminarGastoOperadorModal = function (gastoId) {
    const fila = document.getElementById(`modal_gasto_fila_${gastoId}`);
    if (fila) {
      fila.remove();
    }
  };

  // FunciÃ³n para cerrar el modal de ediciÃ³n y limpiar completamente
  window.cerrarModalEdicionTrafico = function () {
    const modalElement = document.getElementById('modalEdicionTrafico');
    if (modalElement) {
      // FunciÃ³n para limpiar completamente el modal y sus efectos
      const limpiarModalCompleto = () => {
        // Remover todos los backdrops (puede haber mÃºltiples)
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());

        // Remover clase modal-open del body
        document.body.classList.remove('modal-open');

        // Restaurar padding-right del body si fue modificado
        const bodyStyle = document.body.style;
        if (bodyStyle.paddingRight) {
          bodyStyle.paddingRight = '';
        }

        // Remover estilo overflow del body
        if (bodyStyle.overflow) {
          bodyStyle.overflow = '';
        }

        // Ocultar y remover clases del modal
        modalElement.style.display = 'none';
        modalElement.classList.remove('show');
        modalElement.setAttribute('aria-hidden', 'true');
        modalElement.removeAttribute('aria-modal');

        console.log('âœ… Modal cerrado y limpiado completamente');
      };

      if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          // Escuchar el evento hidden.bs.modal para limpiar despuÃ©s de que se cierre
          const limpiarDespuesDeCerrar = () => {
            limpiarModalCompleto();
            // Remover modal del DOM
            setTimeout(() => {
              if (modalElement.parentNode) {
                modalElement.remove();
              }
            }, 100);
          };

          modalElement.addEventListener('hidden.bs.modal', limpiarDespuesDeCerrar, { once: true });
          modal.hide();
        } else {
          // Si no hay instancia, cerrar manualmente
          limpiarModalCompleto();
          setTimeout(() => {
            if (modalElement.parentNode) {
              modalElement.remove();
            }
          }, 100);
        }
      } else {
        // Fallback: cerrar modal manualmente
        limpiarModalCompleto();
        setTimeout(() => {
          if (modalElement.parentNode) {
            modalElement.remove();
          }
        }, 100);
      }
    }
  };
})();
