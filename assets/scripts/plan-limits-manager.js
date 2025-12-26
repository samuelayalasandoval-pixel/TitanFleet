/**
 * Plan Limits Manager - TitanFleet ERP
 * Gestiona los límites de registros según el plan del usuario
 * y ofrece opciones cuando se agotan los registros
 */

class PlanLimitsManager {
  constructor() {
    // Límites mensuales de registros por plan
    this.planLimits = {
      prueba: 10, // Plan de prueba - solo 10 registros
      basico: 100,
      estandar: 500,
      premium: 2000,
      enterprise: 5000 // Hasta 5,000 registros mensuales
    };

    // Límites anuales de registros por plan (no se multiplican, son valores específicos)
    this.planLimitsAnual = {
      prueba: 10, // Plan de prueba - solo 10 registros
      basico: 1200,
      estandar: 600,
      premium: 24000,
      enterprise: 60000 // Hasta 60,000 registros anuales
    };

    this.planPrices = {
      prueba: { mensual: 10, anual: 10 }, // Plan de prueba - $10 MXN
      basico: { mensual: 1999, anual: 21989 },
      estandar: { mensual: 4999, anual: 54989 },
      premium: { mensual: 8999, anual: 98989 },
      enterprise: { mensual: 14999, anual: 164989 }
    };

    // Descuento del 20% para primera compra
    this.firstPurchaseDiscount = 20; // 20%

    this.planNames = {
      prueba: 'Prueba',
      basico: 'Básico',
      estandar: 'Estándar',
      premium: 'Premium',
      enterprise: 'Enterprise'
    };
  }

  /**
   * Obtener el límite de registros del plan actual
   * Para planes anuales, usa los límites anuales específicos (no multiplica)
   */
  getCurrentPlanLimit() {
    const licenseInfo = window.licenseManager?.getLicenseInfo();
    if (!licenseInfo) {
      return null;
    }

    const planLevel = licenseInfo.planLevel || licenseInfo.plan || licenseInfo.type;
    if (!planLevel) {
      return null;
    }

    // Si es un plan antiguo (mensual, trimestral, anual), usar límite básico por defecto
    const planLevels = ['basico', 'estandar', 'premium', 'enterprise'];
    const planLower = planLevel.toLowerCase();

    if (!planLevels.includes(planLower)) {
      // Plan no reconocido, usar básico por defecto
      const baseLimit = this.planLimits['basico'];
      console.log(`⚠️ Plan no reconocido (${planLevel}), usando límite básico: ${baseLimit}`);
      return baseLimit;
    }

    // Determinar si es plan anual
    const paymentPeriod = licenseInfo.paymentPeriod || licenseInfo.period || licenseInfo.type;
    const isAnual =
      paymentPeriod === 'anual' ||
      (paymentPeriod !== 'mensual' &&
        paymentPeriod !== 'trimestral' &&
        licenseInfo.expiresAt &&
        this.isAnualPlan(licenseInfo));

    // Si es plan anual, usar límites anuales específicos
    if (isAnual) {
      const limiteAnual = this.planLimitsAnual[planLower] || null;
      if (limiteAnual !== null) {
        console.log(
          `📊 Plan ANUAL detectado (${planLevel}) - Límite: ${limiteAnual} registros por año`
        );
        return limiteAnual;
      }
    }

    // Plan mensual: usar límite mensual
    const limiteMensual = this.planLimits[planLower] || null;
    if (limiteMensual !== null) {
      console.log(
        `📊 Plan MENSUAL detectado (${planLevel}) - Límite: ${limiteMensual} registros por mes`
      );
      return limiteMensual;
    }

    return null;
  }

  /**
   * Obtener el plan actual del usuario
   */
  getCurrentPlan() {
    const licenseInfo = window.licenseManager?.getLicenseInfo();
    if (!licenseInfo) {
      return null;
    }

    // Buscar el plan en diferentes propiedades (compatibilidad con diferentes versiones)
    const planLevel = licenseInfo.plan || licenseInfo.planLevel || licenseInfo.type;
    if (!planLevel) {
      return null;
    }

    const planLevels = ['basico', 'estandar', 'premium', 'enterprise'];
    const planLower = planLevel.toLowerCase();

    if (!planLevels.includes(planLower)) {
      // Si no es un plan reconocido, intentar mapear desde tipos antiguos
      if (planLevel === 'mensual' || planLevel === 'renta') {
        return 'basico'; // Por defecto para planes antiguos mensuales
      } else if (planLevel === 'anual' || planLevel === 'venta') {
        return 'basico'; // Por defecto para planes antiguos anuales
      }
      return 'basico'; // Por defecto
    }

    return planLower;
  }

  /**
   * Contar registros del período actual (SOLO logística)
   * - Planes MENSUALES: cuenta registros del mes actual
   * - Planes ANUALES: cuenta registros desde el inicio del ciclo anual hasta la fecha de expiración
   * NOTA: Tráfico y Facturación son extensiones del mismo registro, NO cuentan por separado
   */
  async countCurrentMonthRegistros() {
    try {
      const licenseInfo = window.licenseManager?.getLicenseInfo();
      if (!licenseInfo) {
        console.warn('⚠️ No hay información de licencia disponible');
        return 0;
      }

      // Determinar si es plan mensual o anual
      const paymentPeriod = licenseInfo.paymentPeriod || licenseInfo.type;
      const isAnual =
        paymentPeriod === 'anual' ||
        (paymentPeriod !== 'mensual' &&
          paymentPeriod !== 'trimestral' &&
          licenseInfo.expiresAt &&
          this.isAnualPlan(licenseInfo));

      let fechaInicio = null;
      let fechaFin = null;

      if (isAnual && licenseInfo.expiresAt) {
        // PLAN ANUAL: Contar desde el inicio del ciclo anual hasta la expiración
        // El inicio del ciclo es 1 año antes de la fecha de expiración
        fechaFin = new Date(licenseInfo.expiresAt);
        fechaInicio = new Date(fechaFin);
        fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);

        console.log(
          `📅 Plan ANUAL detectado - Contando registros desde ${fechaInicio.toLocaleDateString('es-MX')} hasta ${fechaFin.toLocaleDateString('es-MX')}`
        );
      } else {
        // PLAN MENSUAL: Contar solo del mes actual
        const now = new Date();
        fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1);
        fechaFin = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        console.log(
          `📅 Plan MENSUAL detectado - Contando registros del mes actual (${fechaInicio.toLocaleDateString('es-MX')} a ${fechaFin.toLocaleDateString('es-MX')})`
        );
      }

      let totalRegistros = 0;

      // SOLO contar registros de logística del período correspondiente
      // Tráfico y Facturación son extensiones del mismo registro, no cuentan por separado
      if (window.firebaseRepos?.logistica) {
        try {
          await window.firebaseRepos.logistica.init();
          const registrosLogistica = await window.firebaseRepos.logistica.getAllRegistros();

          const registrosPeriodo = registrosLogistica.filter(reg => {
            if (!reg.fecha) return false;
            const fecha = new Date(reg.fecha);
            return fecha >= fechaInicio && fecha <= fechaFin;
          });

          totalRegistros = registrosPeriodo.length;
          const periodoTexto = isAnual ? 'del ciclo anual' : 'del mes';
          console.log(
            `📊 Registros de logística ${periodoTexto} (solo estos cuentan): ${totalRegistros}`
          );
        } catch (error) {
          console.warn('⚠️ Error contando registros de logística:', error);
        }
      }

      return totalRegistros;
    } catch (error) {
      console.error('❌ Error contando registros del período:', error);
      return 0;
    }
  }

  /**
   * Determinar si un plan es anual basándose en la fecha de expiración
   */
  isAnualPlan(licenseInfo) {
    if (!licenseInfo.expiresAt) {
      return false;
    }

    // Si la fecha de expiración es más de 6 meses en el futuro, probablemente es anual
    const expiresAt = new Date(licenseInfo.expiresAt);
    const now = new Date();
    const diffMonths =
      (expiresAt.getFullYear() - now.getFullYear()) * 12 + (expiresAt.getMonth() - now.getMonth());

    return diffMonths >= 6; // Si tiene más de 6 meses, asumimos que es anual
  }

  /**
   * Verificar si el usuario puede crear más registros
   */
  async canCreateRegistro() {
    const planLimit = this.getCurrentPlanLimit();
    if (planLimit === null) {
      // Si no hay plan, permitir (modo demo o sin licencia)
      return { allowed: true, reason: 'no_plan' };
    }

    // Ya no hay planes ilimitados, todos tienen límites específicos

    const currentCount = await this.countCurrentMonthRegistros();

    if (currentCount >= planLimit) {
      return {
        allowed: false,
        reason: 'limit_reached',
        currentCount: currentCount,
        limit: planLimit,
        plan: this.getCurrentPlan()
      };
    }

    return {
      allowed: true,
      reason: 'within_limit',
      currentCount: currentCount,
      limit: planLimit,
      remaining: planLimit - currentCount
    };
  }

  /**
   * Obtener texto del período (mes/año) según el plan
   */
  getPeriodText() {
    const licenseInfo = window.licenseManager?.getLicenseInfo();
    if (!licenseInfo) {
      return 'del mes';
    }

    const paymentPeriod = licenseInfo.paymentPeriod || licenseInfo.type;
    const isAnual =
      paymentPeriod === 'anual' ||
      (paymentPeriod !== 'mensual' &&
        paymentPeriod !== 'trimestral' &&
        licenseInfo.expiresAt &&
        this.isAnualPlan(licenseInfo));

    return isAnual ? 'del año' : 'del mes';
  }

  /**
   * Mostrar modal cuando se alcanza el límite
   */
  async showLimitReachedModal() {
    const checkResult = await this.canCreateRegistro();
    if (checkResult.allowed) {
      return; // No mostrar si aún puede crear
    }

    const currentPlan = this.getCurrentPlan();
    const planName = this.planNames[currentPlan] || currentPlan;
    const planPrice = this.planPrices[currentPlan];

    // Crear modal dinámicamente
    const modalHtml = `
            <div class="modal fade" id="limitReachedModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-warning text-dark">
                            <h5 class="modal-title">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                Límite de Registros Alcanzado
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-warning">
                                <i class="fas fa-info-circle me-2"></i>
                                <strong>Has alcanzado el límite de ${checkResult.limit} registros ${this.getPeriodText()} para tu Plan ${planName}.</strong>
                                <br><small>Registros usados: ${checkResult.currentCount} de ${checkResult.limit}</small>
                            </div>
                            
                            <h6 class="fw-bold mt-4">Opciones disponibles:</h6>
                            
                            <div class="row g-3 mt-2">
                                <!-- Opción 1: Comprar paquete adicional -->
                                <div class="col-md-6">
                                    <div class="card h-100 border-primary">
                                        <div class="card-body">
                                            <h6 class="card-title text-primary">
                                                <i class="fas fa-shopping-cart me-2"></i>
                                                Comprar Paquete Adicional
                                            </h6>
                                            <p class="card-text">
                                                Adquiere otro paquete de ${checkResult.limit} registros de Logística del Plan ${planName}.
                                            </p>
                                            <div class="mb-3">
                                                <strong class="text-primary">Precio Mensual:</strong> $${planPrice.mensual.toLocaleString('es-MX')} MXN
                                                <br>
                                                <strong class="text-primary">Precio Anual:</strong> $${planPrice.anual.toLocaleString('es-MX')} MXN
                                            </div>
                                            <p class="small text-muted">
                                                <i class="fas fa-info-circle me-1"></i>
                                                Esto iniciará un nuevo ciclo ${this.getPeriodText().replace('del ', '')} con ${checkResult.limit} registros adicionales.
                                            </p>
                                            <button class="btn btn-primary w-100" onclick="window.planLimitsManager.buyAdditionalPackage('${currentPlan}')">
                                                <i class="fas fa-cart-plus me-2"></i>
                                                Comprar Paquete Adicional
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Opción 2: Actualizar a plan superior -->
                                <div class="col-md-6">
                                    <div class="card h-100 border-success">
                                        <div class="card-body">
                                            <h6 class="card-title text-success">
                                                <i class="fas fa-arrow-up me-2"></i>
                                                Actualizar a Plan Superior
                                            </h6>
                                            <p class="card-text">
                                                Si necesitas más registros frecuentemente, actualiza a un plan superior.
                                            </p>
                                            <ul class="list-unstyled small">
                                                ${this.getSuperiorPlansOptions(currentPlan)}
                                            </ul>
                                            <button class="btn btn-success w-100" onclick="window.showUpdatePlanModal()">
                                                <i class="fas fa-sync-alt me-2"></i>
                                                Ver Planes Superiores
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Remover modal anterior si existe
    const existingModal = document.getElementById('limitReachedModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Agregar modal al body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('limitReachedModal'));
    modal.show();
  }

  /**
   * Obtener opciones de planes superiores
   */
  getSuperiorPlansOptions(currentPlan) {
    const planOrder = ['basico', 'estandar', 'premium', 'enterprise'];
    const currentIndex = planOrder.indexOf(currentPlan);

    if (currentIndex === -1 || currentIndex === planOrder.length - 1) {
      return '<li class="text-muted">Ya estás en el plan más alto</li>';
    }

    // Determinar si el plan actual es anual para mostrar límites anuales
    const licenseInfo = window.licenseManager?.getLicenseInfo();
    const paymentPeriod = licenseInfo?.paymentPeriod || licenseInfo?.period || licenseInfo?.type;
    const isAnual =
      paymentPeriod === 'anual' ||
      (paymentPeriod !== 'mensual' &&
        paymentPeriod !== 'trimestral' &&
        licenseInfo?.expiresAt &&
        this.isAnualPlan(licenseInfo));

    let options = '';
    for (let i = currentIndex + 1; i < planOrder.length; i++) {
      const plan = planOrder[i];
      const planName = this.planNames[plan];
      const limit = isAnual
        ? this.planLimitsAnual[plan] || this.planLimits[plan] * 12
        : this.planLimits[plan];
      const price = this.planPrices[plan];
      const periodoTexto = isAnual ? '/año' : '/mes';
      const precioTexto = isAnual ? price.anual : price.mensual;
      const periodoPrecio = isAnual ? '/año' : '/mes';

      options += `
                <li class="mb-2">
                    <strong>${planName}:</strong> 
                    Hasta ${limit.toLocaleString('es-MX')} registros${periodoTexto}
                    - $${precioTexto.toLocaleString('es-MX')} MXN${periodoPrecio}
                </li>
            `;
    }

    return options;
  }

  /**
   * Comprar paquete adicional del mismo plan
   */
  async buyAdditionalPackage(planLevel) {
    const planName = this.planNames[planLevel];
    const planPrice = this.planPrices[planLevel];
    // Obtener límite según el período del plan actual
    const licenseInfo = window.licenseManager?.getLicenseInfo();
    const paymentPeriod = licenseInfo?.paymentPeriod || licenseInfo?.period || licenseInfo?.type;
    const isAnual =
      paymentPeriod === 'anual' ||
      (paymentPeriod !== 'mensual' &&
        paymentPeriod !== 'trimestral' &&
        licenseInfo?.expiresAt &&
        this.isAnualPlan(licenseInfo));
    const limit = isAnual
      ? this.planLimitsAnual[planLevel] || this.planLimits[planLevel] * 12
      : this.planLimits[planLevel];

    // Cerrar modal de límite alcanzado
    const limitModal = bootstrap.Modal.getInstance(document.getElementById('limitReachedModal'));
    if (limitModal) {
      limitModal.hide();
    }

    // Determinar período del plan actual (ya tenemos licenseInfo, paymentPeriod e isAnual de arriba)
    const periodoTexto = isAnual ? 'anual' : 'mensual';
    const precioTexto = isAnual
      ? `$${planPrice.anual.toLocaleString('es-MX')} MXN/año`
      : `$${planPrice.mensual.toLocaleString('es-MX')} MXN/mes`;

    // Mostrar confirmación
    const confirmMessage =
      `¿Deseas comprar un paquete adicional de ${limit} registros de Logística del Plan ${planName}?\n\n` +
      `Esto iniciará un nuevo ciclo ${periodoTexto} con ${limit} registros adicionales.\n\n` +
      `Nota: Solo los registros de Logística cuentan. Tráfico y Facturación son extensiones y no cuentan por separado.\n\n` +
      `Precio: ${precioTexto}`;

    if (!confirm(confirmMessage)) {
      return;
    }

    // Redirigir al proceso de pago
    // Por ahora, mostrar modal de actualización de plan con el mismo plan seleccionado
    // Esto permitirá al usuario seleccionar mensual/anual y método de pago
    if (window.showUpdatePlanModal) {
      window.showUpdatePlanModal();

      // Seleccionar automáticamente el plan actual después de un breve delay
      setTimeout(() => {
        if (window.selectPlanForUpdate) {
          window.selectPlanForUpdate(planLevel);
        }
      }, 500);
    } else {
      alert(
        'Por favor, ve a Configuración > General para actualizar tu plan y comprar un paquete adicional.'
      );
    }
  }

  /**
   * Verificar límite antes de crear un registro
   * Esta función debe llamarse antes de crear nuevos registros
   */
  async checkBeforeCreateRegistro() {
    const checkResult = await this.canCreateRegistro();

    if (!checkResult.allowed && checkResult.reason === 'limit_reached') {
      await this.showLimitReachedModal();
      return false;
    }

    return true;
  }

  /**
   * Obtener información del uso actual
   */
  async getUsageInfo() {
    const planLimit = this.getCurrentPlanLimit();
    const currentCount = await this.countCurrentMonthRegistros();
    const currentPlan = this.getCurrentPlan();

    return {
      plan: currentPlan,
      planName: this.planNames[currentPlan] || currentPlan,
      limit: planLimit,
      used: currentCount,
      remaining: planLimit === Infinity ? Infinity : planLimit - currentCount,
      percentage: planLimit === Infinity ? 0 : Math.round((currentCount / planLimit) * 100),
      period: this.getPeriodText()
    };
  }

  /**
   * Obtener precio con descuento de primera compra (20%)
   * @param {string} planLevel - Nivel del plan (basico, estandar, premium, enterprise)
   * @param {string} paymentPeriod - Período de pago (mensual, anual)
   * @param {boolean} isFirstPurchase - Si es primera compra
   * @returns {object} Objeto con precio original, descuento y precio final
   */
  getPriceWithDiscount(planLevel, paymentPeriod, isFirstPurchase = false) {
    const planPrice = this.planPrices[planLevel];
    if (!planPrice) {
      return { original: 0, discount: 0, final: 0, discountPercent: 0 };
    }

    const originalPrice = paymentPeriod === 'anual' ? planPrice.anual : planPrice.mensual;
    let discount = 0;
    let discountPercent = 0;

    if (isFirstPurchase) {
      discountPercent = this.firstPurchaseDiscount;
      discount = originalPrice * (discountPercent / 100);
    }

    const finalPrice = originalPrice - discount;

    return {
      original: originalPrice,
      discount: discount,
      final: finalPrice,
      discountPercent: discountPercent
    };
  }

  /**
   * Verificar si es primera compra del usuario
   * Esta función puede ser sobrescrita o extendida para verificar en Firebase/Stripe
   * Por ahora retorna true por defecto (el backend verificará)
   */
  async checkIfFirstPurchase() {
    // El backend verificará si es primera compra
    // Por ahora, retornamos true para que siempre se muestre el descuento potencial
    // El backend aplicará el descuento solo si realmente es primera compra
    return true;
  }
}

// Inicializar el gestor de límites
window.planLimitsManager = new PlanLimitsManager();

console.log('✅ PlanLimitsManager inicializado');
