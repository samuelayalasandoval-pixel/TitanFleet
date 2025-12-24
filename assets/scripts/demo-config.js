/**
 * Configuración del Cliente Demo - TitanFleet ERP
 * Centraliza las credenciales del cliente demo normal en un solo lugar
 */

(function () {
  'use strict';

  /**
   * Configuración del cliente demo normal
   * Este es un cliente regular con su propia licencia y tenantId
   */
  window.DEMO_CONFIG = {
    // Licencia del cliente demo
    licenseKey: 'TF2512A-KVX3DGZT-0L68B1TY',

    // TenantId del cliente demo (generado automáticamente de la licencia)
    tenantId: 'tenant_tf2512akvx3dgzt0l68b1ty',

    // Credenciales de acceso
    email: 'titanfleetdemo@titanfleet.com',
    password: 'TitanDemo123!',

    // Tipo de licencia
    licenseType: 'anual'
  };

  console.log('✅ DEMO_CONFIG cargado');
})();
