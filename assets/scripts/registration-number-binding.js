/**
 * Registration Number Binding System
 * Sistema de data binding para sincronizar el número de registro entre Logística, Facturación y Tráfico
 *
 * Single Source of Truth para el número de registro activo
 * - Sincroniza con localStorage
 * - Sincroniza con Firebase
 * - Actualiza todos los campos automáticamente
 * - Funciona entre pestañas
 * - Usa eventos para desacoplar módulos
 */

(function () {
  'use strict';

  /**
   * Función auxiliar para obtener el tenantId actual
   */
  async function obtenerTenantId() {
    // PRIORIDAD 1: Verificar si es un usuario recién creado
    const newUserCreated = localStorage.getItem('newUserCreated');
    const newUserTenantId = localStorage.getItem('newUserTenantId');
    if (newUserCreated === 'true' && newUserTenantId) {
      return newUserTenantId;
    }

    // PRIORIDAD 2: Verificar licencia activa
    if (window.licenseManager && window.licenseManager.isLicenseActive()) {
      const licenseTenantId = window.licenseManager.getTenantId();
      if (licenseTenantId) {
        return licenseTenantId;
      }
    }

    // PRIORIDAD 3: Verificar localStorage
    const savedTenantId = localStorage.getItem('tenantId');
    if (savedTenantId) {
      return savedTenantId;
    }

    // PRIORIDAD 4: Verificar documento users/{uid}
    if (window.firebaseAuth?.currentUser && window.fs && window.firebaseDb) {
      try {
        const userRef = window.fs.doc(
          window.firebaseDb,
          'users',
          window.firebaseAuth.currentUser.uid
        );
        const userDoc = await window.fs.getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.tenantId) {
            return userData.tenantId;
          }
        }
      } catch (e) {
        console.warn('⚠️ Error obteniendo tenantId del documento users/{uid}:', e);
      }
    }

    // Fallback
    return window.DEMO_CONFIG?.tenantId || 'demo_tenant';
  }

  /**
   * RegistrationNumberBinding - Single Source of Truth
   */
  window.RegistrationNumberBinding = {
    _number: null,
    _listeners: [],
    _isInitialized: false,
    _firebaseListener: null,
    _localStorageListener: null,

    /**
     * Inicializar el sistema de binding
     */
    async init() {
      if (this._isInitialized) {
        console.log('✅ RegistrationNumberBinding ya está inicializado');
        return;
      }

      console.log('🔄 Inicializando RegistrationNumberBinding...');

      // 0. PRIORIDAD MÁXIMA: Verificar si ya hay un número en el campo del formulario
      // (esto evita sobrescribir números recién generados)
      const numeroRegistroInput = document.getElementById('numeroRegistro');
      let numeroEnCampo = null;
      if (
        numeroRegistroInput &&
        numeroRegistroInput.value &&
        numeroRegistroInput.value.trim() !== '' &&
        numeroRegistroInput.value !== '-'
      ) {
        const valorCampo = numeroRegistroInput.value.trim();
        // Validar formato (YYXXXXX)
        const currentYear = new Date().getFullYear();
        const yearPrefix = currentYear.toString().slice(-2);
        const yearRegex = new RegExp(`^${yearPrefix}\\d{5}$`);
        if (yearRegex.test(valorCampo)) {
          numeroEnCampo = valorCampo;
          console.log('✅ Número encontrado en el campo del formulario:', numeroEnCampo);
        }
      }

      // 1. Prioridad: Campo del formulario > localStorage > Firebase
      if (numeroEnCampo) {
        this._number = numeroEnCampo;
        console.log('✅ Usando número del campo del formulario (prioridad máxima):', this._number);
      } else {
        // 2. Intentar cargar desde localStorage (más reciente que Firebase)
        const localNumber = localStorage.getItem('activeRegistrationNumber');
        if (localNumber && localNumber.trim() !== '' && localNumber !== '-') {
          this._number = localNumber.trim();
          console.log('✅ Número cargado desde localStorage:', this._number);
        } else {
          // 3. Intentar cargar desde Firebase (solo si no hay en localStorage)
          const firebaseNumber = await this._getFromFirebase();
          if (firebaseNumber) {
            this._number = firebaseNumber;
            console.log('✅ Número cargado desde Firebase:', firebaseNumber);
          } else {
            console.log('ℹ️ No hay número de registro activo');
          }
        }
      }

      // 4. Configurar listener de Firebase (si está disponible)
      await this._setupFirebaseListener();

      // 5. Configurar listener de localStorage (para sincronización entre pestañas)
      this._setupLocalStorageListener();

      // 6. Configurar listener de cambios en el campo
      this._setupInputListener();

      // 7. Actualizar campos existentes en la página (solo si tenemos un número y no está ya en el campo)
      if (this._number && !numeroEnCampo) {
        this._updateAllInputs(this._number, 'init');
      } else if (numeroEnCampo && this._number !== numeroEnCampo) {
        // Si el campo tiene un número diferente, actualizar el binding con el del campo
        this.set(numeroEnCampo, 'field-init');
      }

      this._isInitialized = true;
      console.log('✅ RegistrationNumberBinding inicializado');

      // CRÍTICO: Actualizar el topbar después de inicializar
      if (this._number && window.updateHeaderRegistrationNumber) {
        window.updateHeaderRegistrationNumber(this._number);
        console.log('✅ Topbar actualizado después de inicializar binding:', this._number);
      } else if (!this._number && window.updateHeaderRegistrationNumber) {
        // Solo mostrar "-" si realmente no hay número después de intentar cargarlo
        window.updateHeaderRegistrationNumber('-');
      }
    },

    /**
     * Obtener número desde Firebase
     */
    async _getFromFirebase() {
      if (!window.firebaseDb || !window.fs) {
        return null;
      }

      try {
        // CRÍTICO: Obtener tenantId actual del usuario
        const tenantId = await obtenerTenantId();
        console.log(`🔑 Obteniendo número de registro con tenantId: ${tenantId}`);

        // Usar el tenantId en el path del documento para separar por tenant
        const activeRef = window.fs.doc(
          window.firebaseDb,
          'system',
          `active_registration_number_${tenantId}`
        );
        const activeDoc = await window.fs.getDoc(activeRef);

        if (activeDoc.exists()) {
          const data = activeDoc.data();
          // Verificar que el tenantId coincida (doble verificación)
          if (
            data.tenantId === tenantId &&
            data.number &&
            data.number.trim() !== '' &&
            data.number !== '-'
          ) {
            return data.number.trim();
          }
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo número desde Firebase:', error);
      }

      return null;
    },

    /**
     * Guardar número en Firebase
     */
    async _saveToFirebase(number) {
      if (!window.firebaseDb || !window.fs) {
        return false;
      }

      try {
        // CRÍTICO: Obtener tenantId actual del usuario
        const tenantId = await obtenerTenantId();
        console.log(`🔑 Guardando número de registro con tenantId: ${tenantId}`);

        // Usar el tenantId en el path del documento para separar por tenant
        const activeRef = window.fs.doc(
          window.firebaseDb,
          'system',
          `active_registration_number_${tenantId}`
        );
        await window.fs.setDoc(
          activeRef,
          {
            number: number,
            updatedAt: new Date().toISOString(),
            updatedBy: window.firebaseAuth?.currentUser?.uid || 'anonymous',
            tenantId: tenantId
          },
          { merge: true }
        );

        console.log('✅ Número guardado en Firebase:', number);
        return true;
      } catch (error) {
        console.warn('⚠️ Error guardando número en Firebase:', error);
        return false;
      }
    },

    /**
     * Configurar listener de Firebase para cambios en tiempo real
     */
    async _setupFirebaseListener() {
      if (!window.firebaseDb || !window.fs || !window.fs.onSnapshot) {
        return;
      }

      try {
        // Obtener tenantId actual
        const tenantId = await obtenerTenantId();

        // Usar el tenantId en el path del documento
        const activeRef = window.fs.doc(
          window.firebaseDb,
          'system',
          `active_registration_number_${tenantId}`
        );

        // Limpiar listener anterior si existe
        if (this._firebaseListener) {
          this._firebaseListener();
        }

        this._firebaseListener = window.fs.onSnapshot(
          activeRef,
          snapshot => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              // Verificar que el tenantId coincida
              if (
                data.tenantId === tenantId &&
                data.number &&
                data.number.trim() !== '' &&
                data.number !== '-'
              ) {
                const newNumber = data.number.trim();
                // Solo actualizar si es diferente (evitar loops)
                if (this._number !== newNumber) {
                  console.log('📡 Cambio detectado en Firebase:', newNumber);
                  this._number = newNumber;
                  localStorage.setItem('activeRegistrationNumber', newNumber);
                  this._updateAllInputs(newNumber, 'firebase');
                }
              }
            }
          },
          error => {
            console.warn('⚠️ Error en listener de Firebase:', error);
          }
        );

        console.log(`✅ Listener de Firebase configurado para tenantId: ${tenantId}`);
      } catch (error) {
        console.warn('⚠️ Error configurando listener de Firebase:', error);
      }
    },

    /**
     * Configurar listener de localStorage (sincronización entre pestañas)
     */
    _setupLocalStorageListener() {
      window.addEventListener('storage', e => {
        if (e.key === 'activeRegistrationNumber' && e.newValue && e.newValue !== this._number) {
          console.log('📡 Cambio detectado en localStorage (otra pestaña):', e.newValue);
          this._number = e.newValue;
          this._updateAllInputs(e.newValue, 'localStorage');
        }
      });
    },

    /**
     * Configurar listener de cambios en el campo numeroRegistro
     */
    _setupInputListener() {
      // Usar MutationObserver para detectar cambios programáticos
      const observer = new MutationObserver(() => {
        const inputs = document.querySelectorAll('#numeroRegistro');
        inputs.forEach(input => {
          if (input.value && input.value.trim() !== '' && input.value !== this._number) {
            // El usuario cambió el campo manualmente
            const newValue = input.value.trim();
            if (/^25\d{5}$/.test(newValue)) {
              console.log('📝 Cambio detectado en campo numeroRegistro:', newValue);
              this.set(newValue, 'input');
            }
          }
        });
      });

      // Observar cuando se agregan elementos al DOM
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }

      // También escuchar eventos de input directamente
      document.addEventListener(
        'input',
        e => {
          if (e.target && e.target.id === 'numeroRegistro' && e.target.value) {
            const newValue = e.target.value.trim();
            if (/^25\d{5}$/.test(newValue) && newValue !== this._number) {
              this.set(newValue, 'input');
            }
          }
        },
        true
      ); // Usar capture phase
    },

    /**
     * Establecer número de registro (single source of truth)
     */
    async set(value, source = 'manual') {
      if (!value || value.trim() === '' || value === '-') {
        return;
      }

      const trimmedValue = value.trim();

      // Validar formato (25XXXXX)
      if (!/^25\d{5}$/.test(trimmedValue)) {
        console.warn('⚠️ Formato de número inválido:', trimmedValue);
        return;
      }

      // Si es el mismo valor, no hacer nada (evitar loops)
      if (this._number === trimmedValue) {
        return;
      }

      console.log(`🔄 RegistrationNumberBinding.set(${trimmedValue}, source: ${source})`);

      // 1. Actualizar valor interno
      this._number = trimmedValue;

      // 2. Guardar en localStorage
      localStorage.setItem('activeRegistrationNumber', trimmedValue);

      // 3. Guardar en Firebase (async, no bloquea)
      this._saveToFirebase(trimmedValue).catch(err => {
        console.warn('⚠️ Error guardando en Firebase (no crítico):', err);
      });

      // 4. Actualizar todos los campos en la página
      this._updateAllInputs(trimmedValue, source);

      // 5. Disparar evento personalizado
      document.dispatchEvent(
        new CustomEvent('numeroRegistroBinding', {
          detail: { numero: trimmedValue, source }
        })
      );
    },

    /**
     * Obtener número de registro actual
     */
    get() {
      // Prioridad: valor interno > localStorage > null
      return this._number || localStorage.getItem('activeRegistrationNumber') || null;
    },

    /**
     * Actualizar todos los campos numeroRegistro en la página
     */
    _updateAllInputs(value, source) {
      const inputs = document.querySelectorAll('#numeroRegistro');
      let updated = 0;

      inputs.forEach(input => {
        // Solo actualizar si es diferente (evitar loops)
        if (input.value !== value) {
          input.value = value;

          // Disparar eventos nativos
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));

          updated++;
        }
      });

      // Actualizar header si existe la función
      if (window.updateHeaderRegistrationNumber) {
        window.updateHeaderRegistrationNumber(value);
      }

      if (updated > 0) {
        console.log(`✅ ${updated} campo(s) actualizado(s) desde ${source}:`, value);
      }
    },

    /**
     * Suscribirse a cambios (para listeners personalizados)
     */
    subscribe(callback) {
      if (typeof callback === 'function') {
        this._listeners.push(callback);

        // Ejecutar inmediatamente con el valor actual si existe
        const current = this.get();
        if (current) {
          callback(current);
        }
      }
    },

    /**
     * Limpiar número activo
     */
    async clear() {
      this._number = null;
      localStorage.removeItem('activeRegistrationNumber');
      // Guardar null en Firebase usando el tenantId correcto
      await this._saveToFirebase(null);
      this._updateAllInputs('', 'clear');
      console.log('🧹 Número de registro limpiado');
    },

    /**
     * Limpiar listener de Firebase
     */
    destroy() {
      if (this._firebaseListener) {
        this._firebaseListener();
        this._firebaseListener = null;
      }
      this._isInitialized = false;
    }
  };

  // Auto-inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => window.RegistrationNumberBinding.init(), 500);
    });
  } else {
    setTimeout(() => window.RegistrationNumberBinding.init(), 500);
  }

  console.log('✅ RegistrationNumberBinding definido');
})();
