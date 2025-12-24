/**
 * Vista de Registros de Logística - logistica.html
 * Operaciones de lectura: Ver detalles y obtener registros
 */

(function () {
  'use strict';

  // ============================================================
  // FUNCIÓN: Obtener un registro (reutilizable)
  // ============================================================
  window.obtenerRegistroLogistica = async function (regId) {
    let registro = null;

    try {
      if (window.firebaseRepos?.logistica) {
        registro = await window.firebaseRepos.logistica.getRegistro(regId);
      }
    } catch (error) {
      console.warn('⚠️ Error cargando desde Firebase:', error);
    }

    // NO USAR localStorage - Solo Firebase es la fuente de verdad
    // Eliminado fallback a localStorage para evitar inconsistencias entre navegadores
    if (!registro) {
      console.warn('⚠️ Registro de logística no encontrado en Firebase');
      console.warn(
        '⚠️ Firebase es la única fuente de datos. localStorage ha sido deshabilitado para evitar inconsistencias.'
      );
    }

    return registro;
  };

  // ============================================================
  // FUNCIÓN: Ver detalles de un registro
  // ============================================================
  window.verRegistroLogistica = async function (regId) {
    console.log(`👁️ Viendo registro de Logística: ${regId}`);

    const registro = await window.obtenerRegistroLogistica(regId);

    if (!registro) {
      const errorModalHtml = `
                <div class="modal fade" id="modalErrorLogistica" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header bg-danger text-white">
                                <h5 class="modal-title"><i class="fas fa-exclamation-triangle"></i> Error</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <p>❌ Registro no encontrado</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
      const existingModal = document.getElementById('modalErrorLogistica');
      if (existingModal) {
        existingModal.remove();
      }
      document.body.insertAdjacentHTML('beforeend', errorModalHtml);
      // Verificar que Bootstrap esté disponible
      if (typeof bootstrap === 'undefined') {
        console.error('❌ Bootstrap no está disponible para modal de error');
        alert(`Error: ${error.message}`);
        return;
      }

      const modal = new bootstrap.Modal(document.getElementById('modalErrorLogistica'));
      modal.show();
      return;
    }

    function formatearFecha(fechaStr) {
      if (!fechaStr) {
        return 'N/A';
      }
      try {
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) {
          return 'N/A';
        }
        return fecha.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return 'N/A';
      }
    }

    function formatearFechaEnvio(fechaStr) {
      if (!fechaStr) {
        return 'N/A';
      }
      try {
        if (typeof fechaStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
          const [year, month, day] = fechaStr.split('T')[0].split('-');
          return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        }
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) {
          return 'N/A';
        }
        const day = String(fecha.getDate()).padStart(2, '0');
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const year = fecha.getFullYear();
        return `${day}/${month}/${year}`;
      } catch (error) {
        console.warn('⚠️ Error formateando fecha de envío:', fechaStr, error);
        return 'N/A';
      }
    }

    function obtenerValor(valor) {
      return valor !== undefined && valor !== null && valor !== '' ? valor : 'N/A';
    }

    const rfcCliente = registro.rfcCliente || registro.RFC || registro.rfc || '';
    const nombreCliente =
      typeof obtenerClienteNombre === 'function' && rfcCliente
        ? obtenerClienteNombre(rfcCliente)
        : registro.clienteNombre || registro.cliente || 'N/A';

    const todasLasClaves = Object.keys(registro);
    const clavesObservaciones = todasLasClaves.filter(
      k =>
        k.toLowerCase().includes('observ') ||
        k.toLowerCase().includes('obs') ||
        k.toLowerCase().includes('coment') ||
        k.toLowerCase().includes('nota')
    );

    let obs = '';
    const camposPosibles = [
      'observaciones',
      'obs',
      'observacionesLogistica',
      'Observaciones',
      'observacion',
      'comentarios',
      'comentario',
      'notas',
      'nota',
      'descripcion',
      'descripcionEmbalaje'
    ];

    for (const campo of camposPosibles) {
      if (registro[campo] && typeof registro[campo] === 'string' && registro[campo].trim() !== '') {
        obs = registro[campo];
        break;
      }
    }

    if (!obs && clavesObservaciones.length > 0) {
      for (const clave of clavesObservaciones) {
        if (
          registro[clave] &&
          typeof registro[clave] === 'string' &&
          registro[clave].trim() !== ''
        ) {
          obs = registro[clave];
          break;
        }
      }
    }

    const modalHtml = `
            <div class="modal fade" id="modalDetallesLogistica" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-truck"></i> Detalles del Registro de Logística: ${regId}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6><i class="fas fa-info-circle"></i> Información General</h6>
                                    ${registro.fechaEnvio ? `<p><strong>Fecha de Envío:</strong><br>${formatearFechaEnvio(registro.fechaEnvio)}</p>` : ''}
                                    <p><strong>Fecha de Creación:</strong><br>${formatearFecha(registro.fechaCreacion)}</p>
                                    <p><strong>Cliente:</strong><br>${nombreCliente}</p>
                                    ${rfcCliente && rfcCliente !== nombreCliente ? `<p><strong>RFC:</strong><br>${rfcCliente}</p>` : ''}
                                    ${registro.referenciaCliente || registro.ReferenciaCliente ? `<p><strong>Referencia Cliente:</strong><br>${registro.referenciaCliente || registro.ReferenciaCliente}</p>` : ''}
                                    <p><strong>Estado:</strong><br>
                                        <span class="badge bg-${registro.estado === 'completado' ? 'success' : registro.estado === 'en_proceso' ? 'warning' : 'info'}">
                                            ${registro.estado === 'completado' ? 'Completado' : registro.estado === 'en_proceso' ? 'En Proceso' : registro.estado || 'Pendiente'}
                                        </span>
                                    </p>
                                </div>
                                <div class="col-md-6">
                                    <h6><i class="fas fa-route"></i> Información de Ruta</h6>
                                    <p><strong>Origen:</strong><br>${obtenerValor(registro.origen)}</p>
                                    <p><strong>Destino:</strong><br>${obtenerValor(registro.destino)}</p>
                                    <p><strong>Tipo de Servicio:</strong><br>${obtenerValor(registro.tipoServicio)}</p>
                                </div>
                            </div>
                            <div class="row mt-3">
                                <div class="col-md-6">
                                    <h6><i class="fas fa-box"></i> Información de Carga</h6>
                                    <p><strong>Tipo de Plataforma:</strong><br>${obtenerValor(registro.plataforma)}</p>
                                    <p><strong>Mercancía:</strong><br>${obtenerValor(registro.mercancia)}</p>
                                    <p><strong>Peso:</strong><br>${registro.peso ? `${registro.peso} kg` : 'N/A'}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6><i class="fas fa-ruler-combined"></i> Dimensiones</h6>
                                    <p><strong>Largo:</strong><br>${registro.largo ? `${registro.largo} m` : 'N/A'}</p>
                                    <p><strong>Ancho:</strong><br>${registro.ancho ? `${registro.ancho} m` : 'N/A'}</p>
                                </div>
                            </div>
                            ${
  obs && obs.trim() !== ''
    ? `
                            <div class="row mt-3">
                                <div class="col-12">
                                    <h6><i class="fas fa-comment"></i> Observaciones</h6>
                                    <p>${obs}</p>
                                </div>
                            </div>
                            `
    : ''
  }
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    const existingModal = document.getElementById('modalDetallesLogistica');
    if (existingModal) {
      existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Verificar que Bootstrap esté disponible
    if (typeof bootstrap === 'undefined') {
      console.error(
        '❌ Bootstrap no está disponible. Asegúrate de que bootstrap.bundle.min.js esté cargado.'
      );
      alert('Error: Bootstrap no está disponible. Por favor, recarga la página.');
      return;
    }

    const modal = new bootstrap.Modal(document.getElementById('modalDetallesLogistica'));
    modal.show();

    document
      .getElementById('modalDetallesLogistica')
      .addEventListener('hidden.bs.modal', function () {
        this.remove();
      });
  };

  console.log('✅ Módulo registros-view.js cargado');
})();
