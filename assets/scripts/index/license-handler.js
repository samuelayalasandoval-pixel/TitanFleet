/**
 * Gestión de Licencias - index.html
 * Maneja la activación de licencias y verificación
 */

(function () {
  'use strict';

  /**
   * Función para manejar la activación de licencia
   */
  window.handleLicenseActivation = async function () {
    const licenseKey = document.getElementById('licenseKey').value.trim().toUpperCase();

    if (!licenseKey) {
      alert('Por favor ingresa una clave de licencia');
      return;
    }

    const licensePattern = /^TITAN-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!licensePattern.test(licenseKey)) {
      alert('Formato de licencia inválido. Debe ser: TITAN-XXXX-XXXX-XXXX');
      return;
    }

    const result = await window.activateLicense(licenseKey);

    if (result.success) {
      const modal = bootstrap.Modal.getInstance(document.getElementById('licenseModal'));
      if (modal) {
        modal.hide();
      }
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  /**
   * Mostrar información de licencia
   */
  window.showLicenseInfo = function () {
    const licenseInfo = window.licenseManager?.getLicenseInfo();

    if (licenseInfo && window.licenseManager.isLicenseActive()) {
      const indicator = document.getElementById('licenseIndicator');
      if (indicator) {
        indicator.style.display = 'block';
      }

      let statusText = ` - ${licenseInfo.type === 'venta' ? 'Licencia Permanente' : 'Licencia de Renta'}`;
      if (licenseInfo.type === 'renta') {
        const daysRemaining = window.licenseManager.getDaysRemaining();
        if (daysRemaining !== null) {
          statusText += ` (${daysRemaining} días restantes)`;
        }
      }

      const statusTextEl = document.getElementById('licenseStatusText');
      if (statusTextEl) {
        statusTextEl.textContent = statusText;
      }
    }
  };
})();
