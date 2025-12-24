// Sistema de Gestión de Licencias - TitanFleet ERP
// Permite vender y rentar el software con licencias únicas por cliente

class LicenseManager {
  constructor() {
    this.storageKey = 'titanfleet_license';
    this.licenseInfo = this.loadLicense();
  }

  // Cargar información de licencia
  loadLicense() {
    try {
      const licenseData = localStorage.getItem(this.storageKey);
      if (licenseData) {
        return JSON.parse(licenseData);
      }
    } catch (error) {
      console.error('Error cargando licencia:', error);
    }
    return null;
  }

  // Guardar información de licencia
  saveLicense(licenseData) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(licenseData));
      this.licenseInfo = licenseData;

      // Configurar tenantId basado en la licencia
      if (licenseData.tenantId) {
        localStorage.setItem('tenantId', licenseData.tenantId);
        console.log(`✅ TenantId configurado: ${licenseData.tenantId}`);
      }

      return true;
    } catch (error) {
      console.error('Error guardando licencia:', error);
      return false;
    }
  }

  // Validar licencia
  async validateLicense(licenseKey, preserveTenantId = false) {
    try {
      // Aquí puedes implementar validación con un servidor
      // Por ahora, validación local básica

      // Formato: TF2512A-XXXXXXXX-XXXXXXXX
      // TF = TitanFleet
      // 25 = Año (2 dígitos)
      // 12 = Mes (2 dígitos)
      // A/M/T = Tipo (A=Anual, M=Mensual, T=Trimestral)
      // XXXX... = Bloques aleatorios de 8 caracteres cada uno
      const licensePattern = /^TF\d{2}\d{2}[AMT]-[A-Z0-9]{8}-[A-Z0-9]{8}$/;

      if (!licensePattern.test(licenseKey)) {
        return {
          valid: false,
          error: 'Formato de licencia inválido. Formato esperado: TF2512A-XXXXXXXX-XXXXXXXX'
        };
      }

      // Determinar tipo de licencia desde el código
      const licenseType = this.determineLicenseType(licenseKey);

      // CRÍTICO: Si preserveTenantId es true, mantener el tenantId actual
      // Esto permite actualizar el plan sin perder datos
      let tenantId = null;
      let planFromAdmin = null;
      let periodFromAdmin = null;

      // Intentar obtener información completa desde el sistema de administración
      if (window.licenseAdmin) {
        const adminLicense = window.licenseAdmin.licenses.find(l => l.licenseKey === licenseKey);
        if (adminLicense) {
          if (adminLicense.tenantId) {
            tenantId = adminLicense.tenantId;
            console.log('✅ Usando tenantId de licencia administrada:', tenantId);
          }
          // Obtener plan y periodo desde la licencia administrada
          if (adminLicense.plan) {
            planFromAdmin = adminLicense.plan;
            console.log('✅ Plan obtenido desde licencia administrada:', planFromAdmin);
          }
          if (adminLicense.period) {
            periodFromAdmin = adminLicense.period;
            console.log('✅ Periodo obtenido desde licencia administrada:', periodFromAdmin);
          } else if (adminLicense.type) {
            // Usar type como periodo si period no está disponible
            periodFromAdmin = adminLicense.type;
            console.log(
              '✅ Periodo obtenido desde type de licencia administrada:',
              periodFromAdmin
            );
          }
        }
      }

      if (preserveTenantId && this.licenseInfo && this.licenseInfo.tenantId) {
        // Mantener el tenantId actual para actualización de plan
        tenantId = this.licenseInfo.tenantId;
        console.log('✅ Manteniendo tenantId actual para actualización de plan:', tenantId);
      } else if (!tenantId) {
        // Si no se encontró en el sistema de administración, generarlo
        // (esto es para compatibilidad con licencias antiguas o generadas manualmente)
        tenantId = this.generateTenantIdFromLicense(licenseKey);
        console.log(
          'ℹ️ Generando tenantId al activar (licencia no encontrada en sistema de administración):',
          tenantId
        );
      }

      // Calcular fecha de expiración según el tipo
      let expiresAt = null;
      const now = new Date();

      if (licenseType === 'mensual') {
        // Mensual: 1 mes desde la activación o renovación
        expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else if (licenseType === 'trimestral') {
        // Trimestral: 3 meses desde la activación o renovación
        expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 3);
      } else if (licenseType === 'anual') {
        // Anual: 12 meses desde la activación o renovación
        expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 12);
      }

      // Si es actualización de plan, preservar la fecha de activación original
      const activatedAt =
        preserveTenantId && this.licenseInfo && this.licenseInfo.activatedAt
          ? this.licenseInfo.activatedAt
          : new Date().toISOString();

      const licenseData = {
        licenseKey: licenseKey,
        tenantId: tenantId,
        type: periodFromAdmin || licenseType, // 'anual', 'mensual', 'trimestral' - usar periodo de admin si está disponible
        plan: planFromAdmin || null, // Plan desde administración (basico, estandar, premium, enterprise)
        planLevel: planFromAdmin || null, // Alias para compatibilidad
        period: periodFromAdmin || licenseType, // Periodo desde administración (mensual, anual)
        paymentPeriod: periodFromAdmin || licenseType, // Alias para compatibilidad
        activatedAt: activatedAt,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        status: 'active',
        updatedAt: new Date().toISOString() // Marcar cuando se actualizó
      };

      this.saveLicense(licenseData);

      return {
        valid: true,
        license: licenseData,
        isUpdate: preserveTenantId
      };
    } catch (error) {
      console.error('Error validando licencia:', error);
      return {
        valid: false,
        error: 'Error al validar la licencia'
      };
    }
  }

  // Generar tenantId único basado en la licencia
  generateTenantIdFromLicense(licenseKey) {
    // Usar la licencia como base para el tenantId
    // Esto asegura que cada cliente tenga su propio espacio de datos
    const cleanKey = licenseKey.replace(/-/g, '').toLowerCase();
    return `tenant_${cleanKey}`;
  }

  // Determinar tipo de licencia basado en el formato
  determineLicenseType(licenseKey) {
    // Formato: TF2512A-XXXXXXXX-XXXXXXXX
    // El carácter antes del primer guion indica el tipo:
    // A = Anual (12 meses)
    // M = Mensual (1 mes)
    // T = Trimestral (3 meses)

    const match = licenseKey.match(/^TF\d{2}\d{2}([AMT])-/);
    if (match) {
      const tipoCodigo = match[1];
      if (tipoCodigo === 'A') {
        return 'anual';
      } else if (tipoCodigo === 'M') {
        return 'mensual';
      } else if (tipoCodigo === 'T') {
        return 'trimestral';
      }
    }

    // Si no coincide el patrón, retornar error (no debería pasar si la validación es correcta)
    console.warn('No se pudo determinar el tipo de licencia:', licenseKey);
    return 'anual'; // Por defecto
  }

  // Verificar si la licencia está activa
  isLicenseActive() {
    if (!this.licenseInfo) {
      return false;
    }

    if (this.licenseInfo.status !== 'active') {
      return false;
    }

    // Verificar expiración para licencias temporales (mensual, trimestral)
    const tiposTemporales = ['mensual', 'trimestral'];
    if (tiposTemporales.includes(this.licenseInfo.type) && this.licenseInfo.expiresAt) {
      const expiresAt = new Date(this.licenseInfo.expiresAt);
      const now = new Date();
      if (now > expiresAt) {
        this.licenseInfo.status = 'expired';
        this.saveLicense(this.licenseInfo);
        return false;
      }
    }

    return true;
  }

  // Obtener información de la licencia actual
  getLicenseInfo() {
    return this.licenseInfo;
  }

  // Obtener tenantId de la licencia
  getTenantId() {
    if (this.licenseInfo && this.licenseInfo.tenantId) {
      return this.licenseInfo.tenantId;
    }
    return null;
  }

  // Verificar si la licencia actual es una licencia demo
  isDemoLicense() {
    if (!this.licenseInfo || !this.licenseInfo.licenseKey) {
      return false;
    }

    // Verificar si coincide con la licencia demo configurada
    if (window.DEMO_CONFIG && window.DEMO_CONFIG.licenseKey) {
      return this.licenseInfo.licenseKey === window.DEMO_CONFIG.licenseKey;
    }

    // Verificar si el tenantId coincide con el tenantId demo
    if (window.DEMO_CONFIG && window.DEMO_CONFIG.tenantId) {
      return this.licenseInfo.tenantId === window.DEMO_CONFIG.tenantId;
    }

    return false;
  }

  // Activar licencia (llamado desde la UI)
  async activateLicense(licenseKey, isPlanUpdate = false) {
    // Verificar si ya hay una licencia activa
    if (this.licenseInfo && this.isLicenseActive()) {
      // Si es una licencia demo, permitir reemplazarla automáticamente
      if (this.isDemoLicense()) {
        console.log('🔄 Reemplazando licencia demo con licencia real...');
        // Mostrar mensaje informativo
        const demoMessage =
          'Se detectó una licencia demo activa.\n\n' +
          'La licencia demo será reemplazada por tu nueva licencia.\n\n' +
          '⚠️ NOTA: Los datos de la demo no se transferirán a tu nueva licencia.';
        alert(demoMessage);
        // Desactivar la licencia demo antes de activar la nueva
        this.deactivateLicense();
      } else if (isPlanUpdate) {
        // Si es actualización de plan, mantener el tenantId
        console.log('🔄 Actualizando plan manteniendo tenantId...');
        const validation = await this.validateLicense(licenseKey, true);

        if (validation.valid) {
          const tipoAnterior = this.licenseInfo.type;
          const tipoNuevo = validation.license.type;

          alert(
            '✅ Plan actualizado correctamente\n\n' +
              `Plan anterior: ${tipoAnterior}\n` +
              `Plan nuevo: ${tipoNuevo}\n\n` +
              'Tu tenantId se mantiene y todos tus datos están seguros.'
          );

          // Recargar la página para aplicar los cambios
          window.location.reload();
          return {
            success: true,
            message: 'Plan actualizado correctamente',
            isUpdate: true
          };
        }
        return {
          success: false,
          message: validation.error || 'Error al actualizar el plan'
        };
      } else {
        // Si no es demo ni actualización, pedir confirmación al usuario
        const confirmMessage =
          `Ya tienes una licencia activa (${this.licenseInfo.licenseKey}).\n\n` +
          '¿Deseas reemplazarla con la nueva licencia?\n\n' +
          '⚠️ ADVERTENCIA: Esto cambiará tu tenantId y perderás acceso a los datos asociados a la licencia anterior.\n\n' +
          '💡 Si solo quieres actualizar tu plan, usa la opción "Actualizar Plan" en lugar de "Activar Nueva Licencia".';

        const userConfirmed = confirm(confirmMessage);
        if (!userConfirmed) {
          return {
            success: false,
            message: 'Activación cancelada por el usuario'
          };
        }

        // Desactivar la licencia anterior
        this.deactivateLicense();
      }
    }

    const validation = await this.validateLicense(licenseKey, false);

    if (validation.valid) {
      // Recargar la página para aplicar el nuevo tenantId
      window.location.reload();
      return {
        success: true,
        message: 'Licencia activada correctamente'
      };
    }
    return {
      success: false,
      message: validation.error || 'Licencia inválida'
    };
  }

  // Actualizar plan manteniendo el tenantId (nueva función)
  async updateLicensePlan(newLicenseKey = null, newPlanType = null, paymentPeriod = null) {
    if (!this.licenseInfo || !this.isLicenseActive()) {
      return {
        success: false,
        message: 'No hay una licencia activa para actualizar'
      };
    }

    if (this.isDemoLicense()) {
      return {
        success: false,
        message: 'No se puede actualizar una licencia demo. Activa una licencia real primero.'
      };
    }

    // Si se proporciona un nuevo tipo de plan sin clave, actualizar directamente
    if (newPlanType && !newLicenseKey) {
      const { tenantId } = this.licenseInfo;
      const tipoAnterior = this.licenseInfo.planLevel || this.licenseInfo.type;

      // Los nuevos niveles de planes (basico, estandar, premium, enterprise)
      const planLevels = ['basico', 'estandar', 'premium', 'enterprise'];
      const isNewPlanLevel = planLevels.includes(newPlanType.toLowerCase());

      let expiresAt = null;
      const now = new Date();

      // Verificar si es compra de paquete adicional (mismo plan) o actualización a plan superior
      // Si el planLevel anterior es igual al nuevo, es compra de paquete adicional
      const currentPlanLevel = this.licenseInfo.planLevel || this.licenseInfo.type;
      const isAdditionalPackage =
        isNewPlanLevel &&
        currentPlanLevel &&
        currentPlanLevel.toLowerCase() === newPlanType.toLowerCase();

      if (isNewPlanLevel) {
        // NUEVO MODELO: Si es compra de paquete adicional (mismo plan), iniciar nuevo ciclo desde ahora
        // Si es actualización a plan superior, mantener fecha actual o extender según paymentPeriod
        if (isAdditionalPackage) {
          // COMPRA DE PAQUETE ADICIONAL: Iniciar nuevo ciclo mensual desde ahora
          console.log(
            '🔄 Compra de paquete adicional detectada - iniciando nuevo ciclo desde ahora'
          );
          expiresAt = new Date(now);
          if (paymentPeriod === 'anual') {
            expiresAt.setMonth(expiresAt.getMonth() + 12);
          } else {
            // Por defecto, mensual (nuevo ciclo de 1 mes)
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          }
        } else if (paymentPeriod) {
          // ACTUALIZACIÓN A PLAN SUPERIOR: Usar paymentPeriod para calcular nueva fecha
          expiresAt = new Date(now);
          if (paymentPeriod === 'mensual') {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          } else if (paymentPeriod === 'anual') {
            expiresAt.setMonth(expiresAt.getMonth() + 12);
          } else {
            // Por defecto, mensual
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          }
        } else if (this.licenseInfo.expiresAt) {
          // Si no viene paymentPeriod pero hay fecha de expiración, mantenerla
          expiresAt = new Date(this.licenseInfo.expiresAt);
        } else {
          // Si no hay fecha de expiración, usar la duración del plan actual (mensual/anual)
          const currentDuration = this.licenseInfo.type; // mensual, trimestral, anual
          expiresAt = new Date(now);
          if (currentDuration === 'mensual') {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          } else if (currentDuration === 'trimestral') {
            expiresAt.setMonth(expiresAt.getMonth() + 3);
          } else if (currentDuration === 'anual') {
            expiresAt.setMonth(expiresAt.getMonth() + 12);
          } else {
            // Por defecto, mensual
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          }
        }
      } else {
        // Compatibilidad con sistema antiguo (mensual, trimestral, anual)
        if (newPlanType === 'mensual') {
          expiresAt = new Date(now);
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else if (newPlanType === 'trimestral') {
          expiresAt = new Date(now);
          expiresAt.setMonth(expiresAt.getMonth() + 3);
        } else if (newPlanType === 'anual') {
          expiresAt = new Date(now);
          expiresAt.setMonth(expiresAt.getMonth() + 12);
        }
      }

      // Actualizar información de licencia manteniendo tenantId
      if (isNewPlanLevel) {
        this.licenseInfo.planLevel = newPlanType.toLowerCase();
        this.licenseInfo.plan = newPlanType.toLowerCase(); // Guardar también en plan para consistencia
        // Si viene paymentPeriod, actualizar el tipo de duración
        if (paymentPeriod) {
          this.licenseInfo.type = paymentPeriod; // mensual o anual
          this.licenseInfo.period = paymentPeriod; // Guardar también en period para consistencia
          this.licenseInfo.paymentPeriod = paymentPeriod; // Alias para compatibilidad
        } else if (!this.licenseInfo.type) {
          this.licenseInfo.type = 'mensual'; // Por defecto
          this.licenseInfo.period = 'mensual';
          this.licenseInfo.paymentPeriod = 'mensual';
        } else {
          // Mantener el periodo actual si no se especifica uno nuevo
          this.licenseInfo.period = this.licenseInfo.type;
          this.licenseInfo.paymentPeriod = this.licenseInfo.type;
        }
      } else {
        // Sistema antiguo: actualizar el tipo de duración
        this.licenseInfo.type = newPlanType;
        this.licenseInfo.period = newPlanType;
        this.licenseInfo.paymentPeriod = newPlanType;
      }

      this.licenseInfo.expiresAt = expiresAt ? expiresAt.toISOString() : null;
      this.licenseInfo.updatedAt = new Date().toISOString();

      this.saveLicense(this.licenseInfo);

      const planNames = {
        basico: 'Básico',
        estandar: 'Estándar',
        premium: 'Premium',
        enterprise: 'Enterprise',
        mensual: 'Mensual',
        trimestral: 'Trimestral',
        anual: 'Anual'
      };

      const anteriorName = planNames[tipoAnterior?.toLowerCase()] || tipoAnterior;
      const nuevoName = planNames[newPlanType.toLowerCase()] || newPlanType;

      if (isAdditionalPackage) {
        console.log(`✅ Paquete adicional comprado: ${anteriorName} - nuevo ciclo iniciado`);
        console.log(`✅ TenantId preservado: ${tenantId}`);
        console.log(
          `✅ Nueva fecha de expiración: ${expiresAt ? expiresAt.toLocaleDateString() : 'No expira'}`
        );

        return {
          success: true,
          message: `Paquete adicional de ${anteriorName} comprado exitosamente. Se ha iniciado un nuevo ciclo mensual. Tu tenantId se mantiene y todos tus datos están seguros.`,
          previousType: tipoAnterior,
          newType: newPlanType,
          isAdditionalPackage: true
        };
      }
      console.log(`✅ Plan actualizado: ${anteriorName} → ${nuevoName}`);
      console.log(`✅ TenantId preservado: ${tenantId}`);

      return {
        success: true,
        message: `Plan actualizado de ${anteriorName} a ${nuevoName}. Tu tenantId se mantiene y todos tus datos están seguros.`,
        previousType: tipoAnterior,
        newType: newPlanType,
        isAdditionalPackage: false
      };
    }

    // Si se proporciona una clave, validarla y actualizar
    if (newLicenseKey) {
      const validation = await this.validateLicense(newLicenseKey, true);

      if (validation.valid) {
        const tipoAnterior = this.licenseInfo.type;
        const tipoNuevo = validation.license.type;

        console.log(`✅ Plan actualizado: ${tipoAnterior} → ${tipoNuevo}`);
        console.log(`✅ TenantId preservado: ${validation.license.tenantId}`);

        return {
          success: true,
          message: `Plan actualizado de ${tipoAnterior} a ${tipoNuevo}. Tu tenantId se mantiene y todos tus datos están seguros.`,
          previousType: tipoAnterior,
          newType: tipoNuevo
        };
      }
      return {
        success: false,
        message: validation.error || 'Error al actualizar el plan'
      };
    }

    return {
      success: false,
      message: 'Debes proporcionar una clave de licencia o un tipo de plan'
    };
  }

  // Renovar licencia manteniendo el tenantId (nueva función)
  async renewLicense(licenseKey = null) {
    if (!this.licenseInfo || !this.isLicenseActive()) {
      return {
        success: false,
        message: 'No hay una licencia activa para renovar'
      };
    }

    if (this.isDemoLicense()) {
      return {
        success: false,
        message: 'No se puede renovar una licencia demo. Activa una licencia real primero.'
      };
    }

    // Si no se proporciona una nueva clave, extender la fecha directamente
    if (!licenseKey) {
      // Extender la fecha de expiración según el tipo de plan
      const now = new Date();
      let newExpiresAt = null;

      // Si ya hay una fecha de expiración, extender desde esa fecha
      // Si no, extender desde ahora
      const baseDate = this.licenseInfo.expiresAt ? new Date(this.licenseInfo.expiresAt) : now;

      if (this.licenseInfo.type === 'mensual') {
        newExpiresAt = new Date(baseDate);
        newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);
      } else if (this.licenseInfo.type === 'trimestral') {
        newExpiresAt = new Date(baseDate);
        newExpiresAt.setMonth(newExpiresAt.getMonth() + 3);
      } else if (this.licenseInfo.type === 'anual') {
        newExpiresAt = new Date(baseDate);
        newExpiresAt.setMonth(newExpiresAt.getMonth() + 12);
      }

      // Actualizar información de licencia
      this.licenseInfo.expiresAt = newExpiresAt ? newExpiresAt.toISOString() : null;
      this.licenseInfo.updatedAt = new Date().toISOString();

      this.saveLicense(this.licenseInfo);

      console.log(`✅ Licencia renovada. TenantId preservado: ${this.licenseInfo.tenantId}`);
      console.log(
        `✅ Nueva fecha de expiración: ${newExpiresAt ? newExpiresAt.toLocaleDateString() : 'No expira'}`
      );

      return {
        success: true,
        message:
          'Licencia renovada correctamente. Tu tenantId se mantiene y todos tus datos están seguros.',
        expiresAt: this.licenseInfo.expiresAt
      };
    }

    // Si se proporciona una nueva clave, validarla y actualizar
    const validation = await this.validateLicense(licenseKey, true);

    if (validation.valid) {
      console.log(
        `✅ Licencia renovada con nueva clave. TenantId preservado: ${validation.license.tenantId}`
      );

      return {
        success: true,
        message:
          'Licencia renovada correctamente. Tu tenantId se mantiene y todos tus datos están seguros.',
        expiresAt: validation.license.expiresAt
      };
    }
    return {
      success: false,
      message: validation.error || 'Error al renovar la licencia'
    };
  }

  // Desactivar licencia (para cambiar de cliente)
  deactivateLicense() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem('tenantId');
    this.licenseInfo = null;
    console.log('✅ Licencia desactivada');
  }

  // Verificar días restantes (para licencias temporales)
  getDaysRemaining() {
    const tiposTemporales = ['mensual', 'trimestral'];
    if (!this.licenseInfo || !tiposTemporales.includes(this.licenseInfo.type)) {
      return null;
    }

    if (!this.licenseInfo.expiresAt) {
      return null;
    }

    const expiresAt = new Date(this.licenseInfo.expiresAt);
    const now = new Date();
    const diffTime = expiresAt - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }
}

// Inicializar el gestor de licencias
window.licenseManager = new LicenseManager();

// Función global para activar licencia desde la UI
window.activateLicense = async function (licenseKey, isPlanUpdate = false) {
  const result = await window.licenseManager.activateLicense(licenseKey, isPlanUpdate);

  if (result.success) {
    alert(`✅ ${result.message}`);
  } else {
    alert(`❌ ${result.message}`);
  }

  return result;
};

// Función global para actualizar plan manteniendo tenantId
window.updateLicensePlan = async function (
  newLicenseKey = null,
  newPlanType = null,
  paymentPeriod = null
) {
  const result = await window.licenseManager.updateLicensePlan(
    newLicenseKey,
    newPlanType,
    paymentPeriod
  );

  if (result.success) {
    alert(`✅ ${result.message}`);
    // Recargar la página para aplicar los cambios
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } else {
    alert(`❌ ${result.message}`);
  }

  return result;
};

// Función global para renovar licencia manteniendo tenantId
window.renewLicense = async function (licenseKey = null) {
  const result = await window.licenseManager.renewLicense(licenseKey);

  // No mostrar alert ni recargar aquí, dejar que la función que llama lo maneje
  // Esto permite que completeLicenseRenewal controle el flujo después del pago
  if (!result.success) {
    alert(`❌ ${result.message}`);
  }

  return result;
};

console.log('✅ LicenseManager inicializado');
