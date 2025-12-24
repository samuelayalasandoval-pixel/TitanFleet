/**
 * Gestión del Modal de Privacidad - index.html
 * Maneja la aceptación del aviso de privacidad y las acciones relacionadas
 */

(function () {
  'use strict';

  // Variables globales para almacenar la acción pendiente
  let pendingAction = null;

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
   * Mostrar modal de privacidad
   */
  window.showPrivacyModal = function (action) {
    pendingAction = action;
    const modal = new bootstrap.Modal(document.getElementById('privacyModal'));
    modal.show();
  };

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

    // Ejecutar acción pendiente
    if (pendingAction) {
      if (pendingAction === 'demo') {
        window.location.href = 'demo.html';
      } else if (pendingAction === 'login') {
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
      }
      pendingAction = null;
    }
  };

  /**
   * Rechazar aviso de privacidad
   */
  window.rechazarAvisoPrivacidad = function () {
    alert('Para utilizar el sistema, es necesario aceptar el aviso de privacidad.');
    const modal = bootstrap.Modal.getInstance(document.getElementById('privacyModal'));
    modal.hide();
    pendingAction = null;
  };

  /**
   * Inicializar eventos del modal de privacidad
   */
  function initPrivacyModal() {
    const checkbox = document.getElementById('privacyAcceptCheck');
    const btnAceptar = document.getElementById('btnAceptarPrivacidad');

    if (checkbox && btnAceptar) {
      checkbox.addEventListener('change', function () {
        btnAceptar.disabled = !this.checked;
      });
    }

    // Interceptar clics en enlaces de demo y login
    document.querySelectorAll('a[href="demo.html"]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        if (hasAcceptedPrivacy()) {
          window.location.href = 'demo.html';
        } else {
          window.showPrivacyModal('demo');
        }
      });
    });

    // Interceptar clics en botones de login
    document.querySelectorAll('[data-bs-target="#loginModal"]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        if (hasAcceptedPrivacy()) {
          const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
          loginModal.show();
        } else {
          window.showPrivacyModal('login');
        }
      });
    });
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPrivacyModal);
  } else {
    initPrivacyModal();
  }
})();
