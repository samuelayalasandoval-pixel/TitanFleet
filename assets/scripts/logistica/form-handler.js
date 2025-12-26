/**
 * Manejo del Formulario - logistica.html
 * Funciones para limpiar y manejar el formulario de logística
 */

(function () {
  'use strict';

  /**
   * Función para limpiar el formulario de logística
   */
  window.clearCurrentForm = function () {
    console.log('🧹 Limpiando formulario de logística...');

    try {
      // Limpiar campos editables específicos
      const camposEditables = [
        'cliente',
        'origen',
        'destino',
        'referencia cliente',
        'plataforma',
        'mercancia',
        'peso',
        'largo',
        'ancho',
        'servicio',
        'fecha',
        'descripcion'
      ];

      camposEditables.forEach(campoId => {
        const campo = document.getElementById(campoId);
        if (campo) {
          if (campo.tagName === 'SELECT') {
            campo.value = '';
          } else if (campo.type === 'radio' || campo.type === 'checkbox') {
            campo.checked = false;
          } else {
            campo.value = '';
          }
          campo.classList.remove('is-valid', 'is-invalid');
          campo.style.borderColor = '';
          campo.style.backgroundColor = '';
        }
      });

      // Restablecer embalaje a "No"
      const embalajeNo = document.getElementById('embalajeNo');
      const embalajeSi = document.getElementById('embalajeSi');
      if (embalajeNo) {
        embalajeNo.checked = true;
      }
      if (embalajeSi) {
        embalajeSi.checked = false;
      }

      // Ocultar descripción de embalaje
      const descripcionEmbalaje = document.getElementById('descripcionEmbalaje');
      if (descripcionEmbalaje) {
        descripcionEmbalaje.style.display = 'none';
      }

      // Limpiar clases de validación del formulario
      const formulario = document.querySelector('form.needs-validation');
      if (formulario) {
        formulario.classList.remove('was-validated');
      }

      // Limpiar mensajes de validación
      const feedbackElements = document.querySelectorAll('.valid-feedback, .invalid-feedback');
      feedbackElements.forEach(element => {
        element.style.display = 'none';
      });

      // NO limpiar número de registro (se mantiene para continuidad)
      // NO limpiar campos readonly (fechaCreacion, rfcCliente)

      console.log('✅ Formulario de logística limpiado correctamente');
    } catch (error) {
      console.error('❌ Error al limpiar formulario:', error);
    }
  };

  /**
   * Configurar event listeners para el embalaje especial
   */
  function setupEmbalajeListeners() {
    const embalajeSi = document.getElementById('embalajeSi');
    const embalajeNo = document.getElementById('embalajeNo');
    const descripcionEmbalaje = document.getElementById('descripcionEmbalaje');

      // Función para mostrar/ocultar descripción
      function toggleDescripcionEmbalaje() {
      if (embalajeSi && embalajeSi.checked) {
        if (descripcionEmbalaje) {
          descripcionEmbalaje.style.display = 'block';
        }
        } else {
        if (descripcionEmbalaje) {
          descripcionEmbalaje.style.display = 'none';
        }
          // Limpiar el campo cuando se oculta
          const campoDescripcion = document.getElementById('descripcion');
          if (campoDescripcion) {
            campoDescripcion.value = '';
          }
        }
      }
    if (embalajeSi && embalajeNo && descripcionEmbalaje) {
      embalajeSi.addEventListener('change', toggleDescripcionEmbalaje);
      embalajeNo.addEventListener('change', toggleDescripcionEmbalaje);
    }
  }

  /**
   * Configurar event listener para el cliente select
   */
  function setupClienteListener() {
    const selectCliente = document.getElementById('cliente');
    if (selectCliente) {
      selectCliente.addEventListener('change', function () {
        const rfcCliente = this.value;
        if (rfcCliente && typeof window.loadClienteData === 'function') {
          window.loadClienteData(rfcCliente);
        }
      });
    }
  }

  /**
   * Inicializar event listeners del formulario
   */
  function initFormListeners() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setupEmbalajeListeners();
        setupClienteListener();
      });
    } else {
      setupEmbalajeListeners();
      setupClienteListener();
    }
  }

  // Inicializar cuando el script se carga
  initFormListeners();
})();
