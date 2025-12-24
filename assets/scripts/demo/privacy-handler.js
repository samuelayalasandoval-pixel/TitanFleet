/**
 * Gestión del Modal de Privacidad - demo.html
 * Maneja la aceptación del aviso de privacidad específico para demo
 */

(function () {
  'use strict';

  /**
   * Verificar si el usuario ya aceptó el aviso de privacidad
   */
  function hasAcceptedPrivacy() {
    return localStorage.getItem('privacyAccepted') === 'true';
  }

  /**
   * Guardar aceptación del aviso
   */
  function savePrivacyAcceptance() {
    localStorage.setItem('privacyAccepted', 'true');
    localStorage.setItem('privacyAcceptedDate', new Date().toISOString());
  }

  /**
   * Aceptar aviso de privacidad
   */
  window.aceptarAvisoPrivacidad = function () {
    const checkbox = document.getElementById('privacyAcceptCheck');
    if (!checkbox.checked) {
      alert('Por favor, acepte el aviso de privacidad marcando la casilla.');
      return;
    }

    savePrivacyAcceptance();
    const modal = bootstrap.Modal.getInstance(document.getElementById('privacyModal'));
    modal.hide();

    // Continuar con el inicio del demo
    if (window.iniciarDemoDespuesDeAviso) {
      window.iniciarDemoDespuesDeAviso();
    }
  };

  /**
   * Rechazar aviso de privacidad
   */
  window.rechazarAvisoPrivacidad = function () {
    alert('Para utilizar el sistema, es necesario aceptar el aviso de privacidad.');
    const modal = bootstrap.Modal.getInstance(document.getElementById('privacyModal'));
    modal.hide();
    // Redirigir a public/index.html
    const pathname = window.location.pathname || '';
    const isInPages = pathname.includes('/pages/') || pathname.includes('\\pages\\');
    const indexPath = isInPages ? '../public/index.html' : 'public/index.html';
    window.location.href = indexPath;
  };

  /**
   * Verificar si se aceptó la privacidad (función global)
   */
  window.hasAcceptedPrivacy = hasAcceptedPrivacy;

  /**
   * Verificar aviso antes de iniciar demo (para botón manual)
   */
  window.verificarAvisoYIniciarDemo = function () {
    if (!hasAcceptedPrivacy()) {
      const modal = new bootstrap.Modal(document.getElementById('privacyModal'));
      modal.show();
    } else if (window.startDemo) {
      window.startDemo();
    }
  };

  /**
   * Configurar eventos del checkbox cuando el modal esté visible
   */
  function setupCheckboxEvents() {
    const checkbox = document.getElementById('privacyAcceptCheck');
    const btnAceptar = document.getElementById('btnAceptarPrivacidad');

    if (checkbox && btnAceptar) {
      // Remover listeners anteriores si existen
      const newCheckbox = checkbox.cloneNode(true);
      checkbox.parentNode.replaceChild(newCheckbox, checkbox);

      // Agregar nuevo listener
      newCheckbox.addEventListener('change', function () {
        const btn = document.getElementById('btnAceptarPrivacidad');
        if (btn) {
          btn.disabled = !this.checked;
          console.log('✅ Checkbox cambiado, botón habilitado:', !this.checked);
        }
      });

      // También usar delegación de eventos en el modal para mayor robustez
      const modal = document.getElementById('privacyModal');
      if (modal) {
        modal.addEventListener('change', e => {
          if (e.target && e.target.id === 'privacyAcceptCheck') {
            const btn = document.getElementById('btnAceptarPrivacidad');
            if (btn) {
              btn.disabled = !e.target.checked;
              console.log(
                '✅ Checkbox cambiado (delegación), botón habilitado:',
                !e.target.checked
              );
            }
          }
        });
      }
    } else {
      console.warn('⚠️ No se encontraron checkbox o botón de aceptar');
    }
  }

  /**
   * Inicializar eventos del modal de privacidad
   */
  function initPrivacyModal() {
    const modalElement = document.getElementById('privacyModal');

    if (!modalElement) {
      console.error('❌ No se encontró el modal de privacidad');
      return;
    }

    // Configurar eventos cuando el modal esté completamente visible
    modalElement.addEventListener('shown.bs.modal', () => {
      console.log('✅ Modal de privacidad completamente visible, configurando eventos...');
      setupCheckboxEvents();
    });

    // También configurar eventos inmediatamente por si el modal ya está visible
    setupCheckboxEvents();

    // Mostrar modal automáticamente si no se aceptó
    if (!hasAcceptedPrivacy()) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPrivacyModal);
  } else {
    initPrivacyModal();
  }
})();
