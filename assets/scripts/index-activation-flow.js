/**
 * Flujo de Activación para Nuevos Clientes - TitanFleet ERP
 * Maneja la activación de licencias y creación del primer usuario administrador
 */

(function () {
  'use strict';

  // Esperar a que Firebase y Bootstrap estén disponibles
  function waitForDependencies(callback) {
    let attempts = 0;
    const maxAttempts = 100; // 10 segundos máximo

    const checkInterval = setInterval(() => {
      attempts++;

      const hasBootstrap = typeof bootstrap !== 'undefined';
      const hasLicenseManager = typeof window.licenseManager !== 'undefined';
      const hasFirebaseAuth = window.firebaseAuth !== undefined && window.firebaseAuth !== null;
      const hasFirebaseDb = window.firebaseDb !== undefined && window.firebaseDb !== null;

      if (hasBootstrap && hasLicenseManager && hasFirebaseAuth && hasFirebaseDb) {
        clearInterval(checkInterval);
        callback();
        return;
      }

      // Si alcanzamos el máximo de intentos, continuar de todas formas
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.warn('⚠️ Algunas dependencias no se cargaron después de 10 segundos:', {
          bootstrap: hasBootstrap,
          licenseManager: hasLicenseManager,
          firebaseAuth: hasFirebaseAuth,
          firebaseDb: hasFirebaseDb
        });
        callback();
      }
    }, 100);
  }

  /**
   * Verificar si ya hay una licencia activa al cargar la página
   */
  function checkExistingLicense() {
    if (!window.licenseManager) {
      return;
    }

    const licenseInfo = window.licenseManager.getLicenseInfo();
    if (licenseInfo && window.licenseManager.isLicenseActive()) {
      // Verificar si es una licencia demo
      const isDemo = window.licenseManager.isDemoLicense && window.licenseManager.isDemoLicense();

      // Mostrar alerta de licencia existente
      const existingAlert = document.getElementById('existingLicenseAlert');
      if (existingAlert) {
        document.getElementById('existingLicenseKey').textContent = licenseInfo.licenseKey;
        const typeBadge = document.getElementById('existingLicenseType');
        if (typeBadge) {
          typeBadge.textContent =
            licenseInfo.type === 'anual'
              ? 'Anual'
              : licenseInfo.type === 'mensual'
                ? 'Mensual'
                : 'Trimestral';
        }

        // Si es licencia demo, modificar el mensaje y agregar botón para reemplazar
        if (isDemo) {
          // Cambiar el mensaje para indicar que es demo
          const alertContent = existingAlert.innerHTML;
          if (!alertContent.includes('Licencia Demo')) {
            existingAlert.innerHTML = `
                            <i class="fas fa-info-circle me-2"></i>
                            <strong>Licencia Demo Activa</strong><br>
                            <div class="mt-2">
                                <strong>Licencia:</strong> <span id="existingLicenseKey" class="fw-bold text-primary">${licenseInfo.licenseKey}</span><br>
                                <strong>Tipo:</strong> <span id="existingLicenseType" class="badge bg-info">${licenseInfo.type === 'anual' ? 'Anual' : licenseInfo.type === 'mensual' ? 'Mensual' : 'Trimestral'}</span>
                            </div>
                            <div class="alert alert-warning mt-3 mb-2">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                <strong>¿Compraste tu licencia?</strong><br>
                                Puedes reemplazar la licencia demo con tu nueva licencia ingresándola a continuación.
                            </div>
                            <button type="button" class="btn btn-sm btn-primary mt-2" onclick="replaceDemoLicense()">
                                <i class="fas fa-key me-2"></i>Activar Nueva Licencia
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-secondary mt-2 ms-2" onclick="showLicenseDetails()">
                                <i class="fas fa-eye me-2"></i>Ver Detalles
                            </button>
                        `;
          }
        }

        existingAlert.style.display = 'block';
      }

      // Si es licencia demo, mostrar el formulario de activación para permitir reemplazarla
      // Si no es demo, ocultar el formulario
      const form = document.getElementById('licenseActivationForm');
      if (form) {
        if (isDemo) {
          form.style.display = 'block';
        } else {
          form.style.display = 'none';
        }
      }
    }
  }

  /**
   * Función para reemplazar licencia demo
   */
  window.replaceDemoLicense = function () {
    // Ocultar el alert de licencia existente
    const existingAlert = document.getElementById('existingLicenseAlert');
    if (existingAlert) {
      existingAlert.style.display = 'none';
    }

    // Mostrar el formulario de activación
    const form = document.getElementById('licenseActivationForm');
    if (form) {
      form.style.display = 'block';
      // Enfocar el campo de entrada
      const licenseInput = document.getElementById('licenseKeyInput');
      if (licenseInput) {
        licenseInput.focus();
      }
    }
  };

  /**
   * Función auxiliar para abrir el modal de activación
   */
  function _openLicenseActivationModal() {
    const modal = document.getElementById('licenseActivationModal');
    if (modal && typeof bootstrap !== 'undefined') {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();

      // Verificar licencia existente cuando se abre el modal
      setTimeout(checkExistingLicense, 500);
    } else {
      console.error('❌ No se pudo abrir el modal de activación');
    }
  }

  /**
   * Abrir modal de activación de licencia
   */
  window.openLicenseActivation = function () {
    waitForDependencies(() => {
      // Cerrar el modal de login si está abierto
      const loginModal = document.getElementById('loginModal');
      const activationModal = document.getElementById('licenseActivationModal');

      if (!activationModal || typeof bootstrap === 'undefined') {
        console.error('❌ No se pudo abrir el modal de activación');
        return;
      }

      // Función para abrir el modal de activación
      const openActivationModal = function () {
        const bsModal = new bootstrap.Modal(activationModal);
        bsModal.show();

        // Verificar licencia existente cuando se abre el modal
        setTimeout(checkExistingLicense, 500);
      };

      // Verificar si el modal de login está abierto y cerrarlo primero
      if (loginModal) {
        const isLoginModalVisible = loginModal.classList.contains('show');

        if (isLoginModalVisible) {
          const loginBsModal = bootstrap.Modal.getInstance(loginModal);
          if (loginBsModal) {
            // Cerrar el modal de login
            loginBsModal.hide();

            // Esperar a que se cierre completamente antes de abrir el nuevo modal
            const onLoginHidden = function () {
              // Pequeño delay para asegurar que el backdrop se haya removido
              setTimeout(() => {
                openActivationModal();
              }, 150);
              loginModal.removeEventListener('hidden.bs.modal', onLoginHidden);
            };

            loginModal.addEventListener('hidden.bs.modal', onLoginHidden);
            return; // Salir aquí, el nuevo modal se abrirá después de cerrar el login
          }
        }
      }

      // Si no hay modal de login abierto, abrir directamente
      openActivationModal();
    });
  };

  /**
   * Mostrar detalles completos de la licencia
   */
  window.showLicenseDetails = function () {
    if (!window.licenseManager) {
      alert('El sistema de licencias no está disponible');
      return;
    }

    const licenseInfo = window.licenseManager.getLicenseInfo();
    if (!licenseInfo) {
      alert('No hay información de licencia disponible');
      return;
    }

    const modal = document.getElementById('licenseDetailsModal');
    if (!modal) {
      return;
    }

    // Llenar información
    const detailsKey = document.getElementById('detailsLicenseKey');
    const detailsType = document.getElementById('detailsLicenseType');
    const detailsPlan = document.getElementById('detailsLicensePlan');
    const detailsTenantId = document.getElementById('detailsTenantId');
    const detailsActivatedDate = document.getElementById('detailsActivatedDate');
    const detailsExpiresDate = document.getElementById('detailsExpiresDate');
    const detailsDaysRemaining = document.getElementById('detailsDaysRemaining');
    const expiresContainer = document.getElementById('detailsExpiresContainer');
    const daysContainer = document.getElementById('detailsDaysRemainingContainer');

    if (detailsKey) {
      detailsKey.value = licenseInfo.licenseKey;
    }

    if (detailsType) {
      const typeText =
        licenseInfo.type === 'anual'
          ? 'Anual'
          : licenseInfo.type === 'mensual'
            ? 'Mensual'
            : 'Trimestral';
      detailsType.textContent = typeText;
    }

    if (detailsPlan) {
      const planText =
        licenseInfo.type === 'anual'
          ? 'Plan Anual'
          : licenseInfo.type === 'mensual'
            ? 'Plan Mensual'
            : 'Plan Trimestral';
      detailsPlan.textContent = planText;
    }

    if (detailsTenantId) {
      detailsTenantId.textContent = licenseInfo.tenantId || 'No asignado';
    }

    if (detailsActivatedDate && licenseInfo.activatedAt) {
      const date = new Date(licenseInfo.activatedAt);
      detailsActivatedDate.textContent = date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // Mostrar expiración solo para licencias temporales
    const tiposTemporales = ['mensual', 'trimestral'];
    if (tiposTemporales.includes(licenseInfo.type) && licenseInfo.expiresAt) {
      if (expiresContainer) {
        expiresContainer.style.display = 'block';
      }
      if (daysContainer) {
        daysContainer.style.display = 'block';
      }

      if (detailsExpiresDate) {
        const date = new Date(licenseInfo.expiresAt);
        detailsExpiresDate.textContent = date.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }

      if (detailsDaysRemaining) {
        const days = window.licenseManager.getDaysRemaining();
        if (days !== null) {
          detailsDaysRemaining.textContent = `${days} días`;
        }
      }
    } else {
      if (expiresContainer) {
        expiresContainer.style.display = 'none';
      }
      if (daysContainer) {
        daysContainer.style.display = 'none';
      }
    }

    // Abrir modal
    if (typeof bootstrap !== 'undefined') {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    }
  };

  /**
   * Continuar a crear usuario desde el modal de activación
   */
  window.continueToCreateUser = function () {
    // Cerrar modal de activación
    const activationModal = document.getElementById('licenseActivationModal');
    if (activationModal && typeof bootstrap !== 'undefined') {
      const bsModal = bootstrap.Modal.getInstance(activationModal);
      if (bsModal) {
        bsModal.hide();
      }
    }

    // Abrir modal de creación de usuario
    openFirstUserModal();
  };

  /**
   * Continuar a crear usuario desde el modal de detalles
   */
  window.continueToCreateUserFromDetails = function () {
    // Cerrar modal de detalles
    const detailsModal = document.getElementById('licenseDetailsModal');
    if (detailsModal && typeof bootstrap !== 'undefined') {
      const bsModal = bootstrap.Modal.getInstance(detailsModal);
      if (bsModal) {
        bsModal.hide();
      }
    }

    // Abrir modal de creación de usuario
    openFirstUserModal();
  };

  /**
   * Abrir modal de creación de primer usuario
   */
  function openFirstUserModal() {
    waitForDependencies(() => {
      const modal = document.getElementById('firstUserModal');
      if (!modal) {
        console.error('❌ Modal de primer usuario no encontrado');
        return;
      }

      // Verificar si hay licencia activa
      if (!window.licenseManager) {
        alert('Error: El sistema de licencias no está disponible');
        return;
      }

      const licenseInfo = window.licenseManager.getLicenseInfo();
      if (!licenseInfo || !window.licenseManager.isLicenseActive()) {
        // Si no hay licencia activa, mostrar paso 1 (activar licencia)
        showLicenseActivationStep();
      } else {
        // Si ya hay licencia activa, mostrar paso 2 (crear usuario)
        showCreateUserStep(licenseInfo);
      }

      // Abrir modal
      if (typeof bootstrap !== 'undefined') {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
      }
    });
  }

  /**
   * Mostrar paso de activación de licencia en el modal
   */
  function showLicenseActivationStep() {
    const activationStep = document.getElementById('licenseActivationStep');
    const createUserStep = document.getElementById('createUserStep');

    if (activationStep) {
      activationStep.style.display = 'block';
    }
    if (createUserStep) {
      createUserStep.style.display = 'none';
    }
  }

  /**
   * Mostrar paso de creación de usuario
   */
  function showCreateUserStep(licenseInfo) {
    const activationStep = document.getElementById('licenseActivationStep');
    const createUserStep = document.getElementById('createUserStep');

    if (activationStep) {
      activationStep.style.display = 'none';
    }
    if (createUserStep) {
      createUserStep.style.display = 'block';

      // Llenar información de licencia
      const keyDisplay = document.getElementById('activeLicenseKeyDisplay');
      const typeBadge = document.getElementById('activeLicenseType');
      const planDisplay = document.getElementById('activeLicensePlan');

      if (keyDisplay) {
        keyDisplay.value = licenseInfo.licenseKey;
      }

      if (typeBadge) {
        const typeText =
          licenseInfo.type === 'anual'
            ? 'Anual'
            : licenseInfo.type === 'mensual'
              ? 'Mensual'
              : 'Trimestral';
        typeBadge.textContent = typeText;
      }

      if (planDisplay) {
        const planText =
          licenseInfo.type === 'anual'
            ? 'Plan Anual'
            : licenseInfo.type === 'mensual'
              ? 'Plan Mensual'
              : 'Trimestral';
        planDisplay.textContent = planText;
      }
    }
  }

  /**
   * Manejar activación de licencia desde el formulario principal
   */
  function setupLicenseActivationForm() {
    const form = document.getElementById('licenseActivationForm');
    if (!form) {
      return;
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();

      const licenseKeyInput = document.getElementById('licenseKeyInput');
      const errorDiv = document.getElementById('licenseError');
      const previewDiv = document.getElementById('licenseInfoPreview');

      if (!licenseKeyInput || !window.licenseManager) {
        alert('Error: El sistema de licencias no está disponible');
        return;
      }

      const licenseKey = licenseKeyInput.value.trim().toUpperCase();

      // Limpiar errores previos
      if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
      }

      // Validar formato básico
      const licensePattern = /^TF\d{2}\d{2}[AMT]-[A-Z0-9]{8}-[A-Z0-9]{8}$/;
      if (!licensePattern.test(licenseKey)) {
        if (errorDiv) {
          errorDiv.textContent = 'Formato inválido. Debe ser: TF2512A-XXXXXXXX-XXXXXXXX';
          errorDiv.style.display = 'block';
        }
        return;
      }

      // Validar licencia
      try {
        // Verificar si hay una licencia demo activa antes de validar
        const currentLicense = window.licenseManager.getLicenseInfo();
        const isDemo =
          currentLicense &&
          window.licenseManager.isLicenseActive() &&
          window.licenseManager.isDemoLicense &&
          window.licenseManager.isDemoLicense();

        // Si hay licencia demo, desactivarla primero
        if (isDemo) {
          console.log('🔄 Desactivando licencia demo antes de activar nueva licencia...');
          window.licenseManager.deactivateLicense();
        }

        const validation = await window.licenseManager.validateLicense(licenseKey);

        if (validation.valid) {
          // Mostrar preview
          if (previewDiv) {
            const planSpan = document.getElementById('previewPlan');
            const typeSpan = document.getElementById('previewType');

            if (planSpan) {
              planSpan.textContent =
                validation.license.type === 'anual'
                  ? 'Plan Anual'
                  : validation.license.type === 'mensual'
                    ? 'Plan Mensual'
                    : 'Plan Trimestral';
            }
            if (typeSpan) {
              typeSpan.textContent =
                validation.license.type === 'anual'
                  ? 'Anual'
                  : validation.license.type === 'mensual'
                    ? 'Mensual'
                    : 'Trimestral';
            }
            previewDiv.style.display = 'block';
          }

          // Activar licencia (validar y guardar sin recargar)
          // Usar validateLicense directamente en lugar de activateLicense que recarga la página
          const licenseData = validation.license;

          // Guardar la licencia manualmente
          if (window.licenseManager.saveLicense(licenseData)) {
            // Cerrar modal de activación
            const modal = document.getElementById('licenseActivationModal');
            if (modal && typeof bootstrap !== 'undefined') {
              const bsModal = bootstrap.Modal.getInstance(modal);
              if (bsModal) {
                bsModal.hide();
              }
            }

            // Esperar un momento y abrir modal de creación de usuario
            setTimeout(() => {
              openFirstUserModal();
            }, 300);
          } else if (errorDiv) {
            errorDiv.textContent = 'Error al guardar la licencia. Por favor intenta nuevamente.';
            errorDiv.style.display = 'block';
          }
        } else if (errorDiv) {
          errorDiv.textContent = validation.error || 'Licencia inválida';
          errorDiv.style.display = 'block';
        }
      } catch (error) {
        console.error('Error validando licencia:', error);
        if (errorDiv) {
          errorDiv.textContent = 'Error al validar la licencia. Por favor intenta nuevamente.';
          errorDiv.style.display = 'block';
        }
      }
    });
  }

  /**
   * Manejar activación de licencia desde el modal de primer usuario
   */
  function setupLicenseActivationFormInModal() {
    const form = document.getElementById('licenseActivationFormInModal');
    if (!form) {
      return;
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();

      const licenseKeyInput = document.getElementById('licenseKeyInputInModal');
      const errorDiv = document.getElementById('licenseErrorInModal');
      const previewDiv = document.getElementById('licenseInfoPreviewInModal');

      if (!licenseKeyInput || !window.licenseManager) {
        alert('Error: El sistema de licencias no está disponible');
        return;
      }

      const licenseKey = licenseKeyInput.value.trim().toUpperCase();

      // Limpiar errores previos
      if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
      }

      // Validar formato básico
      const licensePattern = /^TF\d{2}\d{2}[AMT]-[A-Z0-9]{8}-[A-Z0-9]{8}$/;
      if (!licensePattern.test(licenseKey)) {
        if (errorDiv) {
          errorDiv.textContent = 'Formato inválido. Debe ser: TF2512A-XXXXXXXX-XXXXXXXX';
          errorDiv.style.display = 'block';
        }
        return;
      }

      // Validar licencia
      try {
        // Verificar si hay una licencia demo activa antes de validar
        const currentLicense = window.licenseManager.getLicenseInfo();
        const isDemo =
          currentLicense &&
          window.licenseManager.isLicenseActive() &&
          window.licenseManager.isDemoLicense &&
          window.licenseManager.isDemoLicense();

        // Si hay licencia demo, desactivarla primero
        if (isDemo) {
          console.log('🔄 Desactivando licencia demo antes de activar nueva licencia...');
          window.licenseManager.deactivateLicense();
        }

        const validation = await window.licenseManager.validateLicense(licenseKey);

        if (validation.valid) {
          // Mostrar preview
          if (previewDiv) {
            const planSpan = document.getElementById('previewPlanInModal');
            const typeSpan = document.getElementById('previewTypeInModal');

            if (planSpan) {
              planSpan.textContent =
                validation.license.type === 'anual'
                  ? 'Plan Anual'
                  : validation.license.type === 'mensual'
                    ? 'Plan Mensual'
                    : 'Plan Trimestral';
            }
            if (typeSpan) {
              typeSpan.textContent =
                validation.license.type === 'anual'
                  ? 'Anual'
                  : validation.license.type === 'mensual'
                    ? 'Mensual'
                    : 'Trimestral';
            }
            previewDiv.style.display = 'block';
          }

          // Activar licencia (validar y guardar sin recargar)
          // Usar validateLicense directamente en lugar de activateLicense que recarga la página
          const licenseData = validation.license;

          // Guardar la licencia manualmente
          if (window.licenseManager.saveLicense(licenseData)) {
            // Mostrar paso de creación de usuario
            showCreateUserStep(licenseData);
          } else if (errorDiv) {
            errorDiv.textContent = 'Error al guardar la licencia. Por favor intenta nuevamente.';
            errorDiv.style.display = 'block';
          }
        } else if (errorDiv) {
          errorDiv.textContent = validation.error || 'Licencia inválida';
          errorDiv.style.display = 'block';
        }
      } catch (error) {
        console.error('Error validando licencia:', error);
        if (errorDiv) {
          errorDiv.textContent = 'Error al validar la licencia. Por favor intenta nuevamente.';
          errorDiv.style.display = 'block';
        }
      }
    });
  }

  /**
   * Crear primer usuario administrador en Firebase
   */
  async function createFirstUser(userData) {
    if (!window.firebaseAuth || !window.firebaseDb) {
      throw new Error('Firebase no está disponible');
    }

    if (!window.firebaseAuthFunctions) {
      throw new Error('Funciones de autenticación de Firebase no están disponibles');
    }

    const { createUserWithEmailAndPassword, updateProfile } = window.firebaseAuthFunctions;

    // Verificar que las funciones de Firestore estén disponibles
    if (!window.fs || !window.fs.doc || !window.fs.setDoc) {
      throw new Error('Funciones de Firestore no están disponibles');
    }

    const { doc, setDoc } = window.fs;

    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        window.firebaseAuth,
        userData.email,
        userData.password
      );

      const { user } = userCredential;

      // Actualizar perfil con nombre
      if (userData.name) {
        await updateProfile(user, {
          displayName: userData.name
        });
      }

      // Obtener información de licencia
      const licenseInfo = window.licenseManager.getLicenseInfo();
      const tenantId = licenseInfo ? licenseInfo.tenantId : null;

      // Crear documento de usuario en Firestore
      const userDoc = {
        uid: user.uid,
        email: userData.email,
        nombre: userData.name || '',
        telefono: userData.phone || '',
        empresa: userData.company || '',
        tenantId: tenantId,
        rol: 'administrador',
        permisos: {
          ver: ['*'], // Acceso completo
          editar: ['*'] // Permisos de edición completos
        },
        createdAt: new Date().toISOString(),
        isFirstUser: true
      };

      // Guardar usuario en Firestore
      await setDoc(doc(window.firebaseDb, 'users', user.uid), userDoc);

      // También guardar en configuracion/usuarios para que el sistema de permisos lo reconozca
      try {
        const configUsersRef = doc(window.firebaseDb, 'configuracion', 'usuarios');
        const configUsersSnap = await window.fs.getDoc(configUsersRef);

        let usuarios = [];
        if (configUsersSnap.exists() && configUsersSnap.data().usuarios) {
          usuarios = Array.isArray(configUsersSnap.data().usuarios)
            ? configUsersSnap.data().usuarios
            : [];
        }

        // Verificar si el usuario ya existe en la lista
        const usuarioExistenteIndex = usuarios.findIndex(
          u => u.email === userData.email || u.uid === user.uid
        );

        if (usuarioExistenteIndex !== -1) {
          // Actualizar usuario existente
          usuarios[usuarioExistenteIndex] = Object.assign(
            {},
            usuarios[usuarioExistenteIndex],
            userDoc
          );
        } else {
          // Agregar nuevo usuario
          usuarios.push(userDoc);
        }

        // Guardar lista actualizada
        await setDoc(configUsersRef, { usuarios: usuarios }, { merge: true });
        console.log('✅ Usuario también guardado en configuracion/usuarios');
      } catch (configError) {
        console.warn('⚠️ No se pudo guardar usuario en configuracion/usuarios:', configError);
        // No es crítico, el usuario ya está en users/
      }

      console.log('✅ Usuario administrador creado exitosamente:', user.uid);

      return {
        success: true,
        user: user,
        userDoc: userDoc
      };
    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      throw error;
    }
  }

  /**
   * Configurar sesión después de crear usuario
   */
  function setupUserSession(userDoc) {
    // Marcar que se acaba de crear un usuario para evitar autenticación anónima
    localStorage.setItem('justCreatedUser', 'true');

    // Crear sesión en localStorage
    const session = {
      userId: userDoc.uid,
      email: userDoc.email,
      loginTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
      user: userDoc
    };

    localStorage.setItem('erpSession', JSON.stringify(session));
    localStorage.setItem('erpCurrentUser', JSON.stringify(userDoc));

    // Configurar tenantId si está disponible
    if (userDoc.tenantId) {
      localStorage.setItem('tenantId', userDoc.tenantId);
      localStorage.setItem('newUserTenantId', userDoc.tenantId); // Marcar como nuevo usuario
      console.log('✅ TenantId guardado en localStorage:', userDoc.tenantId);
    }

    // Limpiar cualquier sesión demo previa
    localStorage.removeItem('sessionClosedExplicitly');

    console.log('✅ Sesión configurada para nuevo usuario:', userDoc.email);
    console.log('✅ Permisos del usuario:', userDoc.permisos);
    console.log('✅ TenantId:', userDoc.tenantId);
  }

  /**
   * Manejar formulario de creación de primer usuario
   */
  function setupFirstUserForm() {
    const form = document.getElementById('firstUserForm');
    if (!form) {
      return;
    }

    // Toggle de visibilidad de contraseñas
    const togglePassword1 = document.getElementById('toggleFirstUserPassword');
    const togglePassword2 = document.getElementById('toggleFirstUserConfirmPassword');
    const passwordInput1 = document.getElementById('firstUserPassword');
    const passwordInput2 = document.getElementById('firstUserConfirmPassword');

    if (togglePassword1 && passwordInput1) {
      togglePassword1.addEventListener('click', function () {
        const isPassword = passwordInput1.type === 'password';
        passwordInput1.type = isPassword ? 'text' : 'password';
        const icon = this.querySelector('i');
        if (icon) {
          icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        }
      });
    }

    if (togglePassword2 && passwordInput2) {
      togglePassword2.addEventListener('click', function () {
        const isPassword = passwordInput2.type === 'password';
        passwordInput2.type = isPassword ? 'text' : 'password';
        const icon = this.querySelector('i');
        if (icon) {
          icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        }
      });
    }

    // Validación del formulario
    form.addEventListener('submit', async e => {
      e.preventDefault();
      e.stopPropagation();

      // Validar formulario
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }

      const name = document.getElementById('firstUserName').value.trim();
      const email = document.getElementById('firstUserEmail').value.trim();
      const password = document.getElementById('firstUserPassword').value;
      const confirmPassword = document.getElementById('firstUserConfirmPassword').value;
      const phone = document.getElementById('firstUserPhone').value.trim();
      const company = document.getElementById('firstUserCompany').value.trim();

      // Validar que las contraseñas coincidan
      if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden. Por favor verifica.');
        document.getElementById('firstUserConfirmPassword').focus();
        return;
      }

      // Validar longitud mínima de contraseña
      if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres.');
        document.getElementById('firstUserPassword').focus();
        return;
      }

      // Deshabilitar botón de envío
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creando usuario...';
      }

      try {
        // Crear usuario
        const result = await createFirstUser({
          name: name,
          email: email,
          password: password,
          phone: phone,
          company: company
        });

        if (result.success) {
          // El usuario ya está autenticado en Firebase Auth después de crearlo
          // Configurar sesión en localStorage con los permisos correctos
          // El usuario tiene permisos ['*'] que significa acceso completo
          setupUserSession(result.userDoc);

          // CRÍTICO: Asegurar que el tenantId se guarde en localStorage ANTES de redirigir
          // Esto previene que onAuthStateChanged use demo_tenant como fallback
          if (result.userDoc.tenantId) {
            localStorage.setItem('tenantId', result.userDoc.tenantId);
            console.log('✅ TenantId guardado en localStorage:', result.userDoc.tenantId);
          }

          // También marcar que este es un usuario nuevo para evitar que onAuthStateChanged sobrescriba
          localStorage.setItem('newUserCreated', 'true');
          localStorage.setItem('newUserTenantId', result.userDoc.tenantId || '');

          // Verificar que el usuario autenticado en Firebase Auth sea el correcto
          if (window.firebaseAuth && window.firebaseAuth.currentUser) {
            console.log(
              '✅ Usuario autenticado en Firebase Auth:',
              window.firebaseAuth.currentUser.email
            );
            console.log('✅ UID:', window.firebaseAuth.currentUser.uid);
            console.log(
              '✅ Es el mismo usuario creado:',
              window.firebaseAuth.currentUser.uid === result.user.uid
            );
          }

          console.log('✅ Usuario creado y autenticado:', result.user.email);
          console.log('✅ TenantId configurado:', result.userDoc.tenantId);
          console.log('✅ Permisos configurados:', result.userDoc.permisos);

          // Verificar que la sesión se guardó correctamente
          const savedSession = JSON.parse(localStorage.getItem('erpSession') || 'null');
          const savedUser = JSON.parse(localStorage.getItem('erpCurrentUser') || 'null');
          const savedTenantId = localStorage.getItem('tenantId');
          console.log('✅ Sesión guardada en localStorage:', savedSession ? 'SÍ' : 'NO');
          console.log('✅ Usuario guardado en localStorage:', savedUser ? savedUser.email : 'NO');
          console.log('✅ Permisos guardados:', savedUser?.permisos?.ver || []);
          console.log('✅ TenantId guardado en localStorage:', savedTenantId);

          // Mostrar mensaje de éxito
          alert('✅ Usuario administrador creado exitosamente.\n\nSerás redirigido al sistema...');

          // Cerrar modal
          const modal = document.getElementById('firstUserModal');
          if (modal && typeof bootstrap !== 'undefined') {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
              bsModal.hide();
            }
          }

          // Redirigir al menú principal
          // Usar ruta absoluta desde la raíz para evitar problemas de duplicación
          setTimeout(() => {
            const baseUrl = window.location.origin;
            const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
            const menuPath = `${cleanBaseUrl}/pages/menu.html`;

            // Eliminar cualquier duplicación de /pages/
            const normalizedPath = menuPath.replace(/(\/pages)+/g, '/pages');

            console.log(
              '🔄 Redirigiendo a:',
              normalizedPath,
              '(desde:',
              window.location.pathname,
              ')'
            );
            console.log('🔐 Usuario que será usado en el menú:', result.user.email);
            console.log('🔐 TenantId que será usado:', result.userDoc.tenantId);
            console.log('🔐 Permisos que tendrá:', result.userDoc.permisos.ver);
            console.log(
              '🔐 TenantId en localStorage antes de redirigir:',
              localStorage.getItem('tenantId')
            );
            window.location.href = normalizedPath;
          }, 1500);
        }
      } catch (error) {
        console.error('Error creando usuario:', error);

        let errorMessage = 'Error al crear el usuario. ';

        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Este email ya está registrado. Por favor usa otro email o inicia sesión.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'El email ingresado no es válido. Por favor verifica.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'La contraseña es muy débil. Por favor usa una contraseña más segura.';
        } else if (error.message) {
          errorMessage += error.message;
        } else {
          errorMessage += 'Por favor intenta nuevamente.';
        }

        alert(`❌ ${errorMessage}`);

        // Rehabilitar botón
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    });
  }

  /**
   * Verificar si se debe mostrar el botón de activación en el login
   */
  function checkShowActivationButton() {
    const activateSection = document.getElementById('activateLicenseSection');

    if (!activateSection) {
      return;
    }

    // Si licenseManager no está disponible, mostrar el botón por defecto
    if (!window.licenseManager) {
      activateSection.style.display = 'block';
      return;
    }

    const licenseInfo = window.licenseManager.getLicenseInfo();

    // Mostrar el botón si:
    // 1. No hay licencia activa, O
    // 2. La licencia activa es una licencia demo (para permitir reemplazarla)
    if (!licenseInfo || !window.licenseManager.isLicenseActive()) {
      activateSection.style.display = 'block';
    } else if (window.licenseManager.isDemoLicense && window.licenseManager.isDemoLicense()) {
      // Si es licencia demo, mostrar el botón para permitir reemplazarla
      activateSection.style.display = 'block';
    } else {
      // Si hay licencia real activa, ocultar el botón
      activateSection.style.display = 'none';
    }
  }

  /**
   * Verificar inmediatamente si hay licencia activa (sin esperar dependencias)
   * Para mostrar/ocultar el botón desde el inicio
   */
  function checkLicenseStatusImmediately() {
    const activateSection = document.getElementById('activateLicenseSection');
    if (!activateSection) {
      return;
    }

    // Intentar verificar si hay licencia en localStorage directamente
    try {
      const licenseData = localStorage.getItem('titanfleet_license');
      if (licenseData) {
        const license = JSON.parse(licenseData);
        // Si hay licencia activa, verificar si es demo
        if (license && license.status === 'active') {
          // Verificar si es licencia demo
          const isDemo =
            window.DEMO_CONFIG &&
            ((window.DEMO_CONFIG.licenseKey &&
              license.licenseKey === window.DEMO_CONFIG.licenseKey) ||
              (window.DEMO_CONFIG.tenantId && license.tenantId === window.DEMO_CONFIG.tenantId));

          // Si es demo, mostrar el botón para permitir reemplazarla
          // Si no es demo, ocultar el botón
          activateSection.style.display = isDemo ? 'block' : 'none';
        } else {
          activateSection.style.display = 'block';
        }
      } else {
        // No hay licencia, mostrar el botón
        activateSection.style.display = 'block';
      }
    } catch (error) {
      // Si hay error, mostrar el botón por defecto
      activateSection.style.display = 'block';
    }
  }

  /**
   * Función para iniciar el demo (login directo con credenciales del cliente demo)
   */
  window.iniciarDemo = async function () {
    try {
      console.log('🚀 Iniciando demo...');

      // Verificar que DEMO_CONFIG esté disponible
      if (!window.DEMO_CONFIG) {
        console.error('❌ DEMO_CONFIG no está disponible. Asegúrate de cargar demo-config.js');
        alert('Error: Configuración del demo no disponible. Por favor, recarga la página.');
        return;
      }

      // Credenciales del cliente demo normal (desde DEMO_CONFIG)
      const demoLicense = window.DEMO_CONFIG.licenseKey;
      const demoTenantId = window.DEMO_CONFIG.tenantId;
      const demoEmail = window.DEMO_CONFIG.email;
      const demoPassword = window.DEMO_CONFIG.password;

      // Limpiar sesión anterior
      sessionStorage.removeItem('explicitLogout');
      localStorage.removeItem('sessionClosedExplicitly');
      console.log('🧹 Sesión anterior limpiada');

      // Activar licencia demo en localStorage
      localStorage.setItem(
        'titanfleet_license',
        JSON.stringify({
          licenseKey: demoLicense,
          tenantId: demoTenantId,
          type: window.DEMO_CONFIG.licenseType || 'anual',
          activatedAt: new Date().toISOString(),
          status: 'active'
        })
      );

      localStorage.setItem('tenantId', demoTenantId);
      console.log('✅ Licencia demo activada');

      // Esperar a que Firebase esté listo
      let attempts = 0;
      while (!window.firebaseSignIn && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }

      if (!window.firebaseSignIn) {
        console.error('❌ firebaseSignIn no está disponible');
        alert(
          'Error: El sistema de autenticación no está disponible. Por favor, recarga la página.'
        );
        return;
      }

      // Mostrar indicador de carga
      const button = event?.target || document.querySelector('.btn-demo-custom');
      if (button) {
        const originalHTML = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';

        // Restaurar después de 5 segundos como máximo
        setTimeout(() => {
          button.disabled = false;
          button.innerHTML = originalHTML;
        }, 5000);
      }

      console.log('🔐 Iniciando sesión con credenciales demo...');

      // Hacer login con firebaseSignIn
      await window.firebaseSignIn(demoEmail, demoPassword, demoTenantId);
      console.log('✅ Login demo exitoso');

      // Redirigir a menu.html usando ruta absoluta desde la raíz
      const baseUrl = window.location.origin;
      const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
      let menuPath = `${cleanBaseUrl}/pages/menu.html`;

      // Eliminar cualquier duplicación de /pages/
      menuPath = menuPath.replace(/(\/pages)+/g, '/pages');

      console.log(`🔄 Redirigiendo a ${menuPath}...`);
      window.location.href = menuPath;
    } catch (error) {
      console.error('❌ Error iniciando demo:', error);
      alert(`Error al iniciar el demo: ${error.message || 'Error desconocido'}`);

      // Restaurar botón en caso de error
      const button = event?.target || document.querySelector('.btn-demo-custom');
      if (button) {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-play-circle"></i>Demo';
      }
    }
  };

  /**
   * Inicializar cuando el DOM esté listo
   */
  function init() {
    // Verificar estado de licencia inmediatamente (sin esperar dependencias)
    // Esto asegura que el botón se muestre/oculte desde el inicio
    checkLicenseStatusImmediately();

    waitForDependencies(() => {
      // Verificar licencia existente
      checkExistingLicense();

      // Configurar formularios
      setupLicenseActivationForm();
      setupLicenseActivationFormInModal();
      setupFirstUserForm();

      // Verificar si mostrar botón de activación en login (usando licenseManager)
      checkShowActivationButton();

      // Verificar cuando se abre el modal de login
      const loginModal = document.getElementById('loginModal');
      if (loginModal && typeof bootstrap !== 'undefined') {
        loginModal.addEventListener('show.bs.modal', () => {
          checkShowActivationButton();
        });
      }

      console.log('✅ Flujo de activación inicializado correctamente');
    });
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // También verificar cuando la página se carga completamente
  window.addEventListener('load', () => {
    checkLicenseStatusImmediately();
    if (window.licenseManager) {
      checkShowActivationButton();
    }
  });
})();
