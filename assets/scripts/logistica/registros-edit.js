/**
 * Edición de Registros de Logística - logistica.html
 * Operaciones de edición: Abrir modal de edición y cargar datos
 */

(function () {
  'use strict';

  // ============================================================
  // FUNCIÓN AUXILIAR: Cargar clientes en el select del modal
  // ============================================================
  async function cargarClientesEnSelectModal(selectElement) {
    if (!selectElement) {
      return;
    }

    selectElement.innerHTML = '<option value="">Cargando clientes...</option>';

    try {
      let clientes = [];

      // PRIORIDAD 1: Cargar desde configuracion/clientes (documento con array)
      if (window.firebaseDb && window.fs) {
        try {
          const clientesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
          const clientesDoc = await window.fs.getDoc(clientesDocRef);

          if (clientesDoc.exists()) {
            const data = clientesDoc.data();
            if (data.clientes && Array.isArray(data.clientes)) {
              clientes = data.clientes;
            }
          }
        } catch (error) {
          console.warn('⚠️ Error cargando clientes de configuracion/clientes:', error);
        }
      }

      // PRIORIDAD 2: Fallback a configuracionManager
      if (
        clientes.length === 0 &&
        window.configuracionManager &&
        typeof window.configuracionManager.getAllClientes === 'function'
      ) {
        clientes = (await window.configuracionManager.getAllClientes()) || [];
      }

      // PRIORIDAD 3: Fallback a localStorage
      if (clientes.length === 0) {
        const clientesData = localStorage.getItem('erp_clientes');
        if (clientesData) {
          try {
            const parsed = JSON.parse(clientesData);
            if (Array.isArray(parsed)) {
              clientes = parsed;
            } else if (typeof parsed === 'object') {
              clientes = Object.values(parsed);
            }
          } catch (e) {
            console.warn('⚠️ Error parseando clientes de localStorage:', e);
          }
        }
      }

      // Limpiar y agregar opciones
      selectElement.innerHTML = '<option value="">Seleccione un cliente...</option>';

      if (clientes && clientes.length > 0) {
        clientes.forEach(cliente => {
          const rfc = cliente.rfc || cliente.rfcCliente;
          const nombre = cliente.nombre || cliente.nombreCliente || cliente.razonSocial;

          if (rfc && nombre) {
            const option = document.createElement('option');
            option.value = rfc;
            option.textContent = nombre;
            selectElement.appendChild(option);
          }
        });
      }
    } catch (error) {
      console.error('❌ Error cargando clientes para modal:', error);
      selectElement.innerHTML = '<option value="">Error cargando clientes</option>';
    }
  }

  // ============================================================
  // FUNCIÓN: Editar un registro
  // ============================================================
  window.editarRegistroLogistica = async function (regId) {
    console.log(`✏️ Editando registro de Logística: ${regId}`);

    const registro = await window.obtenerRegistroLogistica(regId);

    if (!registro) {
      alert('❌ Registro no encontrado');
      return;
    }

    const modalHTML = `
            <div class="modal fade" id="modalEdicionLogistica" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-warning">
                            <h5 class="modal-title text-white">
                                <i class="fas fa-edit"></i> Editando Registro: ${regId}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle"></i>
                                Los campos del formulario han sido llenados con los datos del registro. 
                                Realiza los cambios necesarios y guarda.
                            </div>
                            <form id="formEdicionLogistica">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label"><strong>Cliente:</strong></label>
                                        <select class="form-select" id="modal_cliente" required>
                                            <option value="">Cargando clientes...</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label"><strong>RFC del Cliente:</strong></label>
                                        <input type="text" class="form-control" id="modal_rfcCliente" readonly style="background-color: #e9ecef;">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label"><strong>Origen:</strong></label>
                                        <input type="text" class="form-control" id="modal_origen" value="${(registro.origen || '').replace(/"/g, '&quot;')}" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label"><strong>Destino:</strong></label>
                                        <input type="text" class="form-control" id="modal_destino" value="${(registro.destino || '').replace(/"/g, '&quot;')}" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label"><strong>Referencia Cliente:</strong></label>
                                        <input type="text" class="form-control" id="modal_referencia" value="${(registro.referenciaCliente || registro['referencia cliente'] || '').replace(/"/g, '&quot;')}" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label"><strong>Fecha de Envío:</strong></label>
                                        <input type="date" class="form-control" id="modal_fechaEnvio" value="${registro.fechaEnvio ? (registro.fechaEnvio.includes('T') ? registro.fechaEnvio.split('T')[0] : registro.fechaEnvio.split(' ')[0]) : ''}" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label"><strong>Tipo Servicio:</strong></label>
                                        <select class="form-select" id="modal_tiposervicio" required>
                                            <option value="">Seleccione...</option>
                                            <option value="General" ${registro.tipoServicio === 'General' || registro.tipoServicio === 'general' ? 'selected' : ''}>General</option>
                                            <option value="Urgente" ${registro.tipoServicio === 'Urgente' || registro.tipoServicio === 'urgente' ? 'selected' : ''}>Urgente</option>
                                            <option value="Doble Operador" ${registro.tipoServicio === 'Doble Operador' || registro.tipoServicio === 'doble-operador' ? 'selected' : ''}>Doble Operador</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label"><strong>Tipo Plataforma:</strong></label>
                                        <select class="form-select" id="modal_plataforma" required>
                                            <option value="">Seleccione...</option>
                                            <option value="48ft" ${registro.plataforma === '48ft' || registro.tipoPlataforma === '48ft' ? 'selected' : ''}>48 ft</option>
                                            <option value="53ft" ${registro.plataforma === '53ft' || registro.tipoPlataforma === '53ft' ? 'selected' : ''}>53 ft</option>
                                            <option value="extendible" ${registro.plataforma === 'extendible' || registro.tipoPlataforma === 'extendible' ? 'selected' : ''}>Extendible</option>
                                            <option value="step-deck" ${registro.plataforma === 'step-deck' || registro.tipoPlataforma === 'step-deck' ? 'selected' : ''}>Step-Deck</option>
                                            <option value="lowboy" ${registro.plataforma === 'lowboy' || registro.tipoPlataforma === 'lowboy' ? 'selected' : ''}>Lowboy</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label"><strong>Tipo Mercancía:</strong></label>
                                        <input type="text" class="form-control" id="modal_mercancia" value="${(registro.mercancia || registro.tipoMercancia || '').replace(/"/g, '&quot;')}" required>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label"><strong>Peso (Kg):</strong></label>
                                        <input type="number" class="form-control" id="modal_peso" value="${registro.peso || registro.pesoKg || ''}" required>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label"><strong>Largo (m):</strong></label>
                                        <input type="number" step="0.1" class="form-control" id="modal_largo" value="${registro.largo || registro.largoM || ''}" required>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label"><strong>Ancho (m):</strong></label>
                                        <input type="number" step="0.1" class="form-control" id="modal_ancho" value="${registro.ancho || registro.anchoM || ''}" required>
                                    </div>
                                    <div class="col-md-12 mb-3">
                                        <label class="form-label"><strong>Embalaje Especial:</strong></label>
                                        <div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" type="radio" name="modal_embalaje" id="modal_embalajeSi" value="si" ${registro.embalajeEspecial === 'si' || registro.embalajeEspecial === 'Sí' || registro.embalajeEspecial === 'Si' ? 'checked' : ''}>
                                                <label class="form-check-label" for="modal_embalajeSi">Sí</label>
                                            </div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" type="radio" name="modal_embalaje" id="modal_embalajeNo" value="no" ${!registro.embalajeEspecial || registro.embalajeEspecial === 'no' || registro.embalajeEspecial === 'No' ? 'checked' : ''}>
                                                <label class="form-check-label" for="modal_embalajeNo">No</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-12 mb-3" id="modal_descripcionEmbalajeContainer" style="display: ${registro.embalajeEspecial === 'si' || registro.embalajeEspecial === 'Sí' || registro.embalajeEspecial === 'Si' ? 'block' : 'none'};">
                                        <label class="form-label"><strong>Descripción del Embalaje:</strong></label>
                                        <textarea class="form-control" id="modal_descripcionEmbalaje" rows="3" placeholder="Describa los requisitos especiales de embalaje...">${(registro.descripcionEmbalaje || registro.descripcion || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            <button type="button" class="btn btn-warning" onclick="window.guardarEdicionLogistica('${regId}')">
                                <i class="fas fa-save"></i> Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    const modalExistente = document.getElementById('modalEdicionLogistica');
    if (modalExistente) {
      modalExistente.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modalClienteSelect = document.getElementById('modal_cliente');
    if (modalClienteSelect) {
      await cargarClientesEnSelectModal(modalClienteSelect);

      const rfcCliente =
        registro.rfcCliente || registro.RFC || registro.rfc || registro.cliente || '';
      if (rfcCliente) {
        modalClienteSelect.value = rfcCliente;
        const modalRfcInput = document.getElementById('modal_rfcCliente');
        if (modalRfcInput) {
          modalRfcInput.value = rfcCliente;
        }
      }
    }

    const embalajeSi = document.getElementById('modal_embalajeSi');
    const embalajeNo = document.getElementById('modal_embalajeNo');
    const descripcionContainer = document.getElementById('modal_descripcionEmbalajeContainer');

    if (embalajeSi && embalajeNo && descripcionContainer) {
      embalajeSi.addEventListener('change', function () {
        if (this.checked) {
          descripcionContainer.style.display = 'block';
        }
      });
      embalajeNo.addEventListener('change', function () {
        if (this.checked) {
          descripcionContainer.style.display = 'none';
        }
      });
    }

    if (modalClienteSelect) {
      modalClienteSelect.addEventListener('change', function () {
        const rfcSeleccionado = this.value;
        const modalRfcInput = document.getElementById('modal_rfcCliente');
        if (modalRfcInput) {
          modalRfcInput.value = rfcSeleccionado;
        }
      });
    }

    const modal = new bootstrap.Modal(document.getElementById('modalEdicionLogistica'));
    modal.show();

    console.log(`✅ Formulario llenado para edición del registro ${regId}`);
  };

  console.log('✅ Módulo registros-edit.js cargado');
})();
