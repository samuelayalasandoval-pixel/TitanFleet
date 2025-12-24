/**
 * Script para manejar la pestaña General en Configuración
 * Gestiona: Licencia, Plan, Datos del Cliente y Contador de Registros
 */

(function () {
  'use strict';

  console.log('📋 Cargando general-tab.js');

  // Esperar a que el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    initGeneralTab();
  });

  /**
   * Inicializar la pestaña General
   */
  function initGeneralTab() {
    console.log('🔧 Inicializando pestaña General...');

    // Cargar información de licencia
    loadLicenseInfo();

    // Cargar datos del cliente
    cargarDatosCliente();

    // Actualizar contador de registros
    actualizarContadorRegistros();

    // Configurar formulario de licencia
    const licenseForm = document.getElementById('licenseActivationForm');
    if (licenseForm) {
      licenseForm.addEventListener('submit', handleLicenseActivation);
    }

    // Configurar formulario de datos del cliente
    const clienteForm = document.getElementById('clienteInfoForm');
    if (clienteForm) {
      clienteForm.addEventListener('submit', handleSaveClienteData);
    }

    // Actualizar contador cada 30 segundos
    setInterval(actualizarContadorRegistros, 30000);
  }

  /**
   * Cargar y mostrar información de la licencia
   */
  function loadLicenseInfo() {
    const licenseInfo = window.licenseManager?.getLicenseInfo();
    const licenseInfoContainer = document.getElementById('licenseInfoContainer');
    const activeLicenseInfo = document.getElementById('activeLicenseInfo');

    if (!licenseInfo || !window.licenseManager?.isLicenseActive()) {
      // No hay licencia activa
      if (licenseInfoContainer) {
        licenseInfoContainer.style.display = 'block';
      }
      if (activeLicenseInfo) {
        activeLicenseInfo.style.display = 'none';
      }
      return;
    }

    // Hay licencia activa, mostrar información
    if (licenseInfoContainer) {
      licenseInfoContainer.style.display = 'none';
    }
    if (activeLicenseInfo) {
      activeLicenseInfo.style.display = 'block';
    }

    // Mostrar datos de la licencia
    const displayLicenseKey = document.getElementById('displayLicenseKey');
    const displayPlan = document.getElementById('displayPlan');
    const displayLicenseType = document.getElementById('displayLicenseType');
    const displayActivatedDate = document.getElementById('displayActivatedDate');
    const displayExpiresDate = document.getElementById('displayExpiresDate');
    const expiresContainer = document.getElementById('expiresContainer');

    if (displayLicenseKey) {
      displayLicenseKey.textContent = licenseInfo.licenseKey || 'N/A';
    }

    // Determinar plan basado en el tipo de licencia o datos de pago
    let planNombre = 'N/A';
    const tipo = licenseInfo.type || 'anual';

    // Intentar obtener el plan desde los datos de pago guardados
    try {
      const paymentSuccess = sessionStorage.getItem('titanfleet_payment_success');
      const paymentData = sessionStorage.getItem('titanfleet_payment_data');
      const solicitudes = localStorage.getItem('titanfleet_solicitudes');
      const pagos = localStorage.getItem('titanfleet_pagos');

      let planFromPayment = null;

      // Buscar en payment_success primero (más reciente)
      if (paymentSuccess) {
        const data = JSON.parse(paymentSuccess);
        planFromPayment = data.plan;
      }

      // Si no está, buscar en payment_data
      if (!planFromPayment && paymentData) {
        const data = JSON.parse(paymentData);
        planFromPayment = data.plan;
      }

      // Si no está, buscar en solicitudes (transferencias)
      if (!planFromPayment && solicitudes) {
        const solicitudesArray = JSON.parse(solicitudes);
        if (solicitudesArray.length > 0) {
          const ultimaSolicitud = solicitudesArray[solicitudesArray.length - 1];
          planFromPayment = ultimaSolicitud.plan;
        }
      }

      // Si no está, buscar en pagos (tarjetas)
      if (!planFromPayment && pagos) {
        const pagosArray = JSON.parse(pagos);
        if (pagosArray.length > 0) {
          const ultimoPago = pagosArray[pagosArray.length - 1];
          planFromPayment = ultimoPago.plan;
        }
      }

      if (planFromPayment) {
        planNombre = planFromPayment;
      } else {
        // Fallback al tipo de licencia
        if (tipo === 'anual') {
          planNombre = 'Plan Anual';
        } else if (tipo === 'mensual') {
          planNombre = 'Plan Mensual';
        } else if (tipo === 'trimestral') {
          planNombre = 'Plan Trimestral';
        }
      }
    } catch (error) {
      console.warn('Error obteniendo plan desde datos de pago:', error);
      // Fallback al tipo de licencia
      if (tipo === 'anual') {
        planNombre = 'Plan Anual';
      } else if (tipo === 'mensual') {
        planNombre = 'Plan Mensual';
      } else if (tipo === 'trimestral') {
        planNombre = 'Plan Trimestral';
      }
    }

    if (displayPlan) {
      displayPlan.textContent = planNombre;
    }

    if (displayLicenseType) {
      const tipoTexto = tipo === 'anual' ? 'Anual' : tipo === 'mensual' ? 'Mensual' : 'Trimestral';
      displayLicenseType.textContent = tipoTexto;
    }

    if (displayActivatedDate && licenseInfo.activatedAt) {
      const fecha = new Date(licenseInfo.activatedAt);
      displayActivatedDate.textContent = fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    // Mostrar fecha de expiración solo para licencias temporales
    if (licenseInfo.expiresAt && (tipo === 'mensual' || tipo === 'trimestral')) {
      if (expiresContainer) {
        expiresContainer.style.display = 'block';
      }
      if (displayExpiresDate) {
        const fecha = new Date(licenseInfo.expiresAt);
        displayExpiresDate.textContent = fecha.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } else if (expiresContainer) {
      expiresContainer.style.display = 'none';
    }
  }

  /**
   * Manejar activación de licencia
   */
  async function handleLicenseActivation(event) {
    event.preventDefault();
    event.stopPropagation();

    const form = event.target;
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const licenseKeyInput = document.getElementById('licenseKeyInput');
    const licenseKey = licenseKeyInput?.value.trim().toUpperCase();

    if (!licenseKey) {
      alert('Por favor ingresa una clave de licencia');
      return;
    }

    // Validar formato
    const licensePattern = /^TF\d{2}\d{2}[AMT]-[A-Z0-9]{8}-[A-Z0-9]{8}$/;
    if (!licensePattern.test(licenseKey)) {
      alert('Formato de licencia inválido. Formato esperado: TF2512A-XXXXXXXX-XXXXXXXX');
      return;
    }

    // Activar licencia
    try {
      const result = await window.activateLicense(licenseKey);

      if (result.success) {
        // Recargar información de licencia
        setTimeout(() => {
          loadLicenseInfo();
          // Limpiar formulario
          if (licenseKeyInput) {
            licenseKeyInput.value = '';
          }
          form.classList.remove('was-validated');
        }, 500);
      }
    } catch (error) {
      console.error('Error activando licencia:', error);
      alert(`Error al activar la licencia: ${error.message}`);
    }
  }

  /**
   * Cargar datos del cliente desde localStorage
   */
  window.cargarDatosCliente = function () {
    try {
      const clienteData = localStorage.getItem('titanfleet_cliente_data');

      if (!clienteData) {
        // No hay datos guardados
        return;
      }

      const data = JSON.parse(clienteData);

      // Llenar formulario
      const nombreInput = document.getElementById('clienteNombre');
      const emailInput = document.getElementById('clienteEmail');
      const telefonoInput = document.getElementById('clienteTelefono');
      const empresaInput = document.getElementById('clienteEmpresa');

      if (nombreInput) {
        nombreInput.value = data.nombre || '';
      }
      if (emailInput) {
        emailInput.value = data.email || '';
      }
      if (telefonoInput) {
        telefonoInput.value = data.telefono || '';
      }
      if (empresaInput) {
        empresaInput.value = data.empresa || '';
      }

      console.log('✅ Datos del cliente cargados');
    } catch (error) {
      console.error('Error cargando datos del cliente:', error);
    }
  };

  /**
   * Guardar datos del cliente
   */
  async function handleSaveClienteData(event) {
    event.preventDefault();
    event.stopPropagation();

    const form = event.target;
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    // Recopilar datos
    const clienteData = {
      nombre: document.getElementById('clienteNombre')?.value.trim() || '',
      email: document.getElementById('clienteEmail')?.value.trim() || '',
      telefono: document.getElementById('clienteTelefono')?.value.trim() || '',
      empresa: document.getElementById('clienteEmpresa')?.value.trim() || '',
      fechaActualizacion: new Date().toISOString()
    };

    // Validar campos requeridos
    if (!clienteData.nombre || !clienteData.email) {
      alert('Por favor completa los campos requeridos (Nombre y Email)');
      return;
    }

    try {
      // Guardar en localStorage
      localStorage.setItem('titanfleet_cliente_data', JSON.stringify(clienteData));

      // Intentar guardar en Firebase si está disponible
      if (window.firebaseRepos && window.firebaseRepos.configuracion) {
        try {
          await window.firebaseRepos.configuracion.save('cliente_data', clienteData);
          console.log('✅ Datos del cliente guardados en Firebase');
        } catch (firebaseError) {
          console.warn(
            '⚠️ Error guardando en Firebase, solo guardado en localStorage:',
            firebaseError
          );
        }
      }

      // Mostrar mensaje de éxito
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check me-2"></i>Guardado!';
      btn.classList.remove('btn-success');
      btn.classList.add('btn-primary');

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');
      }, 2000);

      console.log('✅ Datos del cliente guardados');
    } catch (error) {
      console.error('Error guardando datos del cliente:', error);
      alert(`Error al guardar los datos: ${error.message}`);
    }
  }

  /**
   * Actualizar contador de registros totales
   */
  window.actualizarContadorRegistros = async function () {
    try {
      console.log('📊 Actualizando contador de registros...');

      let totalRegistros = 0;
      let registrosLogistica = 0;

      // Intentar obtener desde Firebase primero
      if (window.firebaseRepos) {
        try {
          // Logística
          if (window.firebaseRepos.logistica) {
            await window.firebaseRepos.logistica.init();
            const logisticaRegs = await window.firebaseRepos.logistica.getAllRegistros();
            registrosLogistica = logisticaRegs.length;
            console.log(`📊 Registros de Logística: ${registrosLogistica}`);
          }
        } catch (firebaseError) {
          console.warn(
            '⚠️ Error obteniendo registros desde Firebase, usando localStorage:',
            firebaseError
          );
          // Fallback a localStorage
          const countFromLocal = await loadFromLocalStorage();
          if (countFromLocal !== null) {
            registrosLogistica = countFromLocal;
          }
        }
      } else {
        // Fallback a localStorage
        const countFromLocal = await loadFromLocalStorage();
        if (countFromLocal !== null) {
          registrosLogistica = countFromLocal;
        }
      }

      // Calcular total (solo logística)
      totalRegistros = registrosLogistica;

      // Actualizar UI
      const totalEl = document.getElementById('totalRegistros');
      const logisticaEl = document.getElementById('registrosLogistica');

      if (totalEl) {
        totalEl.textContent = totalRegistros.toLocaleString('es-MX');
      }
      if (logisticaEl) {
        logisticaEl.textContent = registrosLogistica.toLocaleString('es-MX');
      }

      console.log(`✅ Contador actualizado - Total: ${totalRegistros}`);
    } catch (error) {
      console.error('❌ Error actualizando contador de registros:', error);
    }

    /**
     * Función auxiliar para cargar desde localStorage
     * @returns {number} Número de registros de logística
     */
    async function loadFromLocalStorage() {
      try {
        // Logística - Convertir a array si es objeto
        const logisticaRaw = JSON.parse(localStorage.getItem('erp_logistica') || '[]');
        const logisticaData = Array.isArray(logisticaRaw)
          ? logisticaRaw
          : Object.values(logisticaRaw);
        const count = logisticaData.filter(r => r && r.tipo === 'registro' && !r.eliminado).length;
        return count;
      } catch (error) {
        console.error('Error cargando desde localStorage:', error);
        return 0;
      }
    }
  };

  /**
   * Mostrar modal de actualización de plan
   */
  window.showUpdatePlanModal = function () {
    // Usar la función global de license-ui.html si está disponible
    if (
      typeof showUpdatePlanModal === 'function' &&
      window.showUpdatePlanModal !== window.showUpdatePlanModal
    ) {
      window.showUpdatePlanModal();
      return;
    }

    const licenseInfo = window.licenseManager?.getLicenseInfo();
    if (licenseInfo) {
      const planNames = {
        anual: 'Anual',
        mensual: 'Mensual',
        trimestral: 'Trimestral'
      };
      const currentPlanEl = document.getElementById('currentPlanType');
      if (currentPlanEl) {
        currentPlanEl.textContent = planNames[licenseInfo.type] || licenseInfo.type;
      }
    }

    // Verificar si el modal existe (de license-ui.html)
    const modal = document.getElementById('updatePlanModal');
    if (modal) {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    } else {
      // Si no existe el modal, mostrar alerta con instrucciones
      alert(
        'Para actualizar tu plan, ingresa tu nueva clave de licencia en el campo de activación de licencia.'
      );
    }
  };

  // selectPlan ya está expuesta globalmente en license-ui.html

  /**
   * Manejar actualización de plan
   */
  window.handlePlanUpdate = async function () {
    const licenseKeyInput = document.getElementById('updatePlanLicenseKey');
    const licenseKey = licenseKeyInput?.value.trim().toUpperCase();

    if (!licenseKey) {
      alert('Por favor ingresa una clave de licencia');
      return;
    }

    // Validar formato
    const licensePattern = /^TF\d{2}\d{2}[AMT]-[A-Z0-9]{8}-[A-Z0-9]{8}$/;
    if (!licensePattern.test(licenseKey)) {
      alert('Formato de licencia inválido. Debe ser: TF2512A-XXXXXXXX-XXXXXXXX');
      return;
    }

    // Actualizar plan
    const result = await window.updateLicensePlan(licenseKey);

    if (result.success) {
      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('updatePlanModal'));
      if (modal) {
        modal.hide();
      }

      // Recargar información de licencia
      setTimeout(() => {
        loadLicenseInfo();
        window.location.reload();
      }, 1000);
    }
  };

  /**
   * Mostrar modal de renovación de licencia
   */
  window.showRenewLicenseModal = function () {
    const licenseInfo = window.licenseManager?.getLicenseInfo();
    if (licenseInfo) {
      const planNames = {
        anual: 'Anual',
        mensual: 'Mensual',
        trimestral: 'Trimestral'
      };
      const renewPlanTypeEl = document.getElementById('renewPlanType');
      const renewExpiresDateEl = document.getElementById('renewExpiresDate');

      if (renewPlanTypeEl) {
        renewPlanTypeEl.textContent = planNames[licenseInfo.type] || licenseInfo.type;
      }

      if (renewExpiresDateEl) {
        if (licenseInfo.expiresAt) {
          const expiresDate = new Date(licenseInfo.expiresAt);
          renewExpiresDateEl.textContent = expiresDate.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } else {
          renewExpiresDateEl.textContent = 'No expira';
        }
      }
    }

    // Verificar si el modal existe (de license-ui.html)
    const modal = document.getElementById('renewLicenseModal');
    if (modal) {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    } else {
      // Si no existe el modal, usar la función de renovación directamente
      if (
        confirm(
          '¿Deseas renovar tu licencia con la misma clave? Esto extenderá la fecha de expiración.'
        )
      ) {
        window.renewLicense(null);
      }
    }
  };

  /**
   * Manejar renovación de licencia
   */
  window.handleLicenseRenewal = async function () {
    const licenseKeyInput = document.getElementById('renewLicenseKey');
    const licenseKey = licenseKeyInput?.value.trim().toUpperCase() || null;

    // Si hay una clave, validarla
    if (licenseKey) {
      const licensePattern = /^TF\d{2}\d{2}[AMT]-[A-Z0-9]{8}-[A-Z0-9]{8}$/;
      if (!licensePattern.test(licenseKey)) {
        alert('Formato de licencia inválido. Debe ser: TF2512A-XXXXXXXX-XXXXXXXX');
        return;
      }
    }

    // Renovar licencia
    const result = await window.renewLicense(licenseKey);

    if (result.success) {
      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('renewLicenseModal'));
      if (modal) {
        modal.hide();
      }

      // Recargar información de licencia
      setTimeout(() => {
        loadLicenseInfo();
        window.location.reload();
      }, 1000);
    }
  };

  console.log('✅ general-tab.js cargado');
})();
