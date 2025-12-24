// Administración de Licencias - Panel de Control
// Gestiona todas las licencias generadas

class LicenseAdmin {
  constructor() {
    this.storageKey = 'titanfleet_all_licenses';
    this.licenses = this.loadAllLicenses();
  }

  // Cargar todas las licencias guardadas
  loadAllLicenses() {
    try {
      const data = localStorage.getItem(this.storageKey);
      let licenses = data ? JSON.parse(data) : [];

      // Migrar licencias antiguas (venta/renta) a nuevos tipos (mensual/trimestral/anual)
      let updated = false;
      licenses = licenses.map(license => {
        if (license.type === 'venta') {
          updated = true;
          return { ...license, type: 'anual' };
        } else if (license.type === 'renta') {
          updated = true;
          return { ...license, type: 'mensual' };
        }
        return license;
      });

      if (updated) {
        localStorage.setItem(this.storageKey, JSON.stringify(licenses));
        console.log('✅ Licencias migradas al nuevo sistema de tipos');
      }

      return licenses;
    } catch (error) {
      console.error('Error cargando licencias:', error);
      return [];
    }
  }

  // Guardar todas las licencias
  saveAllLicenses() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.licenses));
      return true;
    } catch (error) {
      console.error('Error guardando licencias:', error);
      return false;
    }
  }

  // Agregar nuevas licencias
  addLicenses(newLicenses, type, registros = null, plan = null, period = null) {
    const licensesToAdd = newLicenses.map(licenseKey => {
      // Determinar duración según el periodo
      let expiresAt = null;
      if (period === 'mensual' || type === 'mensual') {
        expiresAt = this.calculateExpirationDate(30);
      } else if (type === 'trimestral') {
        expiresAt = this.calculateExpirationDate(90);
      } else if (period === 'anual' || type === 'anual') {
        expiresAt = this.calculateExpirationDate(365);
      }

      return {
        licenseKey: licenseKey,
        type: type, // mensual, trimestral, anual (mantener compatibilidad)
        plan: plan || null, // básico, premium, enterprise, custom
        period: period || type, // mensual, anual
        registros: registros, // rango de registros: '0-100', '101-500', etc.
        tenantId: this.generateTenantId(licenseKey),
        status: 'disponible', // disponible, activada, expirada
        generatedAt: new Date().toISOString(),
        activatedAt: null,
        expiresAt: expiresAt,
        customerInfo: null
      };
    });

    this.licenses.push(...licensesToAdd);
    this.saveAllLicenses();
    return licensesToAdd;
  }

  // Generar tenantId desde licencia
  generateTenantId(licenseKey) {
    return `tenant_${licenseKey.replace(/-/g, '').toLowerCase()}`;
  }

  // Calcular fecha de expiración
  calculateExpirationDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  // Obtener estadísticas mejoradas
  getStats() {
    const total = this.licenses.length;
    const mensual = this.licenses.filter(l => l.type === 'mensual').length;
    const trimestral = this.licenses.filter(l => l.type === 'trimestral').length;
    const anual = this.licenses.filter(l => l.type === 'anual').length;
    const activas = this.licenses.filter(l => l.status === 'activada').length;

    // Estadísticas detalladas por tipo
    const mensualDisponible = this.licenses.filter(
      l => l.type === 'mensual' && l.status === 'disponible'
    ).length;
    const mensualActivada = this.licenses.filter(
      l => l.type === 'mensual' && l.status === 'activada'
    ).length;
    const mensualExpirada = this.licenses.filter(
      l => l.type === 'mensual' && l.status === 'expirada'
    ).length;

    const trimestralDisponible = this.licenses.filter(
      l => l.type === 'trimestral' && l.status === 'disponible'
    ).length;
    const trimestralActivada = this.licenses.filter(
      l => l.type === 'trimestral' && l.status === 'activada'
    ).length;
    const trimestralExpirada = this.licenses.filter(
      l => l.type === 'trimestral' && l.status === 'expirada'
    ).length;

    const anualDisponible = this.licenses.filter(
      l => l.type === 'anual' && l.status === 'disponible'
    ).length;
    const anualActivada = this.licenses.filter(
      l => l.type === 'anual' && l.status === 'activada'
    ).length;
    const anualExpirada = this.licenses.filter(
      l => l.type === 'anual' && l.status === 'expirada'
    ).length;

    const disponibles = this.licenses.filter(l => l.status === 'disponible').length;
    const expiradas = this.licenses.filter(l => l.status === 'expirada').length;

    // Estadísticas por rangos de registros
    const registrosStats = {
      '0-100': this.licenses.filter(l => l.registros === '0-100').length,
      '101-500': this.licenses.filter(l => l.registros === '101-500').length,
      '501-1000': this.licenses.filter(l => l.registros === '501-1000').length,
      '1001-2000': this.licenses.filter(l => l.registros === '1001-2000').length,
      '2001-3000': this.licenses.filter(l => l.registros === '2001-3000').length,
      '3001-5000': this.licenses.filter(l => l.registros === '3001-5000').length,
      '5001-10000': this.licenses.filter(l => l.registros === '5001-10000').length,
      '10001+': this.licenses.filter(l => l.registros === '10001+').length
    };

    return {
      total,
      mensual,
      trimestral,
      anual,
      activas,
      mensualDisponible,
      mensualActivada,
      mensualExpirada,
      trimestralDisponible,
      trimestralActivada,
      trimestralExpirada,
      anualDisponible,
      anualActivada,
      anualExpirada,
      disponibles,
      expiradas,
      registrosStats
    };
  }

  // Eliminar licencia
  deleteLicense(licenseKey) {
    const index = this.licenses.findIndex(l => l.licenseKey === licenseKey);
    if (index !== -1) {
      this.licenses.splice(index, 1);
      this.saveAllLicenses();
      return true;
    }
    return false;
  }

  // Eliminar múltiples licencias
  deleteLicenses(licenseKeys) {
    let deleted = 0;
    licenseKeys.forEach(licenseKey => {
      if (this.deleteLicense(licenseKey)) {
        deleted++;
      }
    });
    return deleted;
  }

  // Exportar a CSV
  exportToCSV() {
    const headers = [
      'Licencia',
      'Plan',
      'Periodo',
      'Registros',
      'Tenant ID',
      'Estado',
      'Fecha Generación',
      'Fecha Activación',
      'Expiración',
      'Cliente'
    ];
    const rows = this.licenses.map(license => [
      license.licenseKey,
      license.plan || 'N/A',
      license.period || license.type || 'N/A',
      license.registros || 'N/A',
      license.tenantId,
      license.status,
      new Date(license.generatedAt).toLocaleDateString('es-MX'),
      license.activatedAt ? new Date(license.activatedAt).toLocaleDateString('es-MX') : 'N/A',
      license.expiresAt ? new Date(license.expiresAt).toLocaleDateString('es-MX') : 'N/A',
      license.customerInfo ? license.customerInfo.name : 'N/A'
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `licencias_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Marcar licencia como activada
  markAsActivated(licenseKey, customerInfo = null) {
    const license = this.licenses.find(l => l.licenseKey === licenseKey);
    if (license) {
      license.status = 'activada';
      license.activatedAt = new Date().toISOString();
      if (customerInfo) {
        license.customerInfo = customerInfo;
      }
      this.saveAllLicenses();
      return true;
    }
    return false;
  }

  // Verificar expiraciones
  checkExpirations() {
    const now = new Date();
    let updated = false;

    this.licenses.forEach(license => {
      // Verificar expiración para todos los tipos que tienen fecha de expiración
      if (license.expiresAt && license.status === 'activada') {
        const expiresAt = new Date(license.expiresAt);
        if (now > expiresAt) {
          license.status = 'expirada';
          updated = true;
        }
      }
    });

    if (updated) {
      this.saveAllLicenses();
    }
  }
}

// Inicializar administrador
window.licenseAdmin = new LicenseAdmin();

// Funciones globales para la UI
window.generateLicenses = function () {
  const plan = document.getElementById('licensePlanSelect').value;
  const period = document.getElementById('licensePeriodSelect').value;
  const count = parseInt(document.getElementById('licenseCount').value, 10) || 1;

  // Validaciones
  if (!plan || plan === '') {
    alert('Por favor selecciona un tipo de plan');
    document.getElementById('licensePlanSelect').focus();
    return;
  }

  if (!period || period === '') {
    alert('Por favor selecciona un periodo (mensual o anual)');
    document.getElementById('licensePeriodSelect').focus();
    return;
  }

  // Obtener el límite de registros automáticamente según el plan y periodo
  let registros = null;
  if (typeof window.getRegistrosLimit === 'function') {
    registros = window.getRegistrosLimit(plan, period);
  }

  // Si no se encontró el límite, usar un valor por defecto
  if (!registros) {
    registros = 'N/A';
    console.warn(
      '⚠️ No se encontró límite de registros para la combinación plan/periodo, usando N/A'
    );
  }

  if (count < 1 || count > 100) {
    alert('La cantidad debe estar entre 1 y 100');
    document.getElementById('licenseCount').focus();
    return;
  }

  const generator = new LicenseGenerator();

  // Mapear periodo a formato del generador
  let tipoGeneracion = 'anual'; // Por defecto
  if (period === 'mensual') {
    tipoGeneracion = 'renta'; // Mensual usa 'renta' en el generador
  } else if (period === 'anual') {
    tipoGeneracion = 'venta'; // Anual usa 'venta' en el generador
  }

  const licenses = generator.generateLicenses(tipoGeneracion, count);

  // Agregar al administrador con el plan, periodo y registros
  window.licenseAdmin.addLicenses(licenses, period, registros, plan, period);

  alert(
    `✅ ${licenses.length} licencia(s) ${plan} ${period} (hasta ${registros} registros) generada(s) correctamente`
  );

  // Limpiar formulario
  document.getElementById('licensePlanSelect').value = '';
  document.getElementById('licensePeriodSelect').value = '';
  document.getElementById('generateBtn').disabled = true;
  document.getElementById('licenseCount').value = 1;

  // Actualizar información del límite
  const planLimitInfo = document.getElementById('planLimitInfo');
  if (planLimitInfo) {
    planLimitInfo.textContent = 'Selecciona el plan para ver el límite de registros';
    planLimitInfo.className = 'form-text text-muted';
  }

  loadLicenses();
};

window.loadLicenses = function (filterType = 'all', filterStatus = 'all', filterRegistros = 'all') {
  window.licenseAdmin.checkExpirations();
  let { licenses } = window.licenseAdmin;
  const stats = window.licenseAdmin.getStats();

  // Aplicar filtros
  if (filterType !== 'all') {
    licenses = licenses.filter(l => l.type === filterType);
  }
  if (filterStatus !== 'all') {
    licenses = licenses.filter(l => l.status === filterStatus);
  }
  if (filterRegistros !== 'all') {
    licenses = licenses.filter(l => l.registros === filterRegistros);
  }

  // Actualizar estadísticas principales (solo si los elementos existen)
  const totalEl = document.getElementById('totalLicenses');
  const mensualEl = document.getElementById('mensualLicenses');
  const trimestralEl = document.getElementById('trimestralLicenses');
  const anualEl = document.getElementById('anualLicenses');
  const activeEl = document.getElementById('activeLicenses');

  if (totalEl) {
    totalEl.textContent = stats.total;
  }
  if (mensualEl) {
    mensualEl.textContent = stats.mensual;
  }
  if (trimestralEl) {
    trimestralEl.textContent = stats.trimestral;
  }
  if (anualEl) {
    anualEl.textContent = stats.anual;
  }
  if (activeEl) {
    activeEl.textContent = stats.activas;
  }

  // Actualizar estadísticas detalladas si existen
  const mensualDisponibleEl = document.getElementById('mensualDisponible');
  const mensualActivadaEl = document.getElementById('mensualActivada');
  const mensualExpiradaEl = document.getElementById('mensualExpirada');
  const trimestralDisponibleEl = document.getElementById('trimestralDisponible');
  const trimestralActivadaEl = document.getElementById('trimestralActivada');
  const trimestralExpiradaEl = document.getElementById('trimestralExpirada');
  const anualDisponibleEl = document.getElementById('anualDisponible');
  const anualActivadaEl = document.getElementById('anualActivada');
  const anualExpiradaEl = document.getElementById('anualExpirada');
  const disponiblesEl = document.getElementById('disponibles');
  const expiradasEl = document.getElementById('expiradas');

  if (mensualDisponibleEl) {
    mensualDisponibleEl.textContent = stats.mensualDisponible;
  }
  if (mensualActivadaEl) {
    mensualActivadaEl.textContent = stats.mensualActivada;
  }
  if (mensualExpiradaEl) {
    mensualExpiradaEl.textContent = stats.mensualExpirada;
  }
  if (trimestralDisponibleEl) {
    trimestralDisponibleEl.textContent = stats.trimestralDisponible;
  }
  if (trimestralActivadaEl) {
    trimestralActivadaEl.textContent = stats.trimestralActivada;
  }
  if (trimestralExpiradaEl) {
    trimestralExpiradaEl.textContent = stats.trimestralExpirada;
  }
  if (anualDisponibleEl) {
    anualDisponibleEl.textContent = stats.anualDisponible;
  }
  if (anualActivadaEl) {
    anualActivadaEl.textContent = stats.anualActivada;
  }
  if (anualExpiradaEl) {
    anualExpiradaEl.textContent = stats.anualExpirada;
  }
  if (disponiblesEl) {
    disponiblesEl.textContent = stats.disponibles;
  }
  if (expiradasEl) {
    expiradasEl.textContent = stats.expiradas;
  }

  // Actualizar tabla
  const tbody = document.getElementById('licensesTableBody');
  if (!tbody) {
    return;
  } // Si no existe la tabla, salir

  if (licenses.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">
                    <i class="fas fa-inbox"></i> No hay licencias que coincidan con los filtros
                </td>
            </tr>
        `;
    return;
  }

  tbody.innerHTML = licenses
    .map((license, _index) => {
      const statusBadge =
        {
          disponible: '<span class="badge bg-success">Disponible</span>',
          activada: '<span class="badge bg-primary">Activada</span>',
          expirada: '<span class="badge bg-danger">Expirada</span>'
        }[license.status] || '<span class="badge bg-secondary">Desconocido</span>';

      // Obtener plan (con fallback para compatibilidad)
      const plan = license.plan || 'N/A';
      const planBadge =
        {
          basico: '<span class="badge bg-info">Básico</span>',
          estandar: '<span class="badge bg-primary">Estándar</span>',
          premium: '<span class="badge bg-warning">Premium</span>',
          enterprise: '<span class="badge bg-danger">Enterprise</span>',
          custom: '<span class="badge bg-secondary">Personalizado</span>'
        }[plan] || `<span class="badge bg-secondary">${plan}</span>`;

      // Badge según periodo (mensual/anual)
      const period = license.period || license.type || 'N/A';
      let periodBadge = '<span class="badge bg-secondary">N/A</span>';
      if (period === 'mensual') {
        periodBadge = '<span class="badge bg-info">Mensual</span>';
      } else if (period === 'trimestral') {
        periodBadge = '<span class="badge bg-warning">Trimestral</span>';
      } else if (period === 'anual') {
        periodBadge = '<span class="badge bg-success">Anual</span>';
      }

      // Badge de registros
      const registrosBadge = license.registros
        ? `<span class="badge bg-secondary">${license.registros}</span>`
        : '<span class="badge bg-light text-dark">N/A</span>';

      return `
            <tr>
                <td><code>${license.licenseKey}</code></td>
                <td>${planBadge}</td>
                <td>${periodBadge}</td>
                <td>${registrosBadge}</td>
                <td><small>${license.tenantId}</small></td>
                <td>${statusBadge}</td>
                <td>${new Date(license.generatedAt).toLocaleDateString('es-MX')}</td>
                <td>${license.expiresAt ? new Date(license.expiresAt).toLocaleDateString('es-MX') : 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="viewLicenseDetails('${license.licenseKey}')" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary" onclick="copyToClipboard('${license.licenseKey}')" title="Copiar">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteLicense('${license.licenseKey}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    })
    .join('');
};

window.deleteLicense = function (licenseKey) {
  const license = window.licenseAdmin.licenses.find(l => l.licenseKey === licenseKey);
  if (!license) {
    alert('❌ Licencia no encontrada');
    return;
  }

  // Confirmación más específica
  const message =
    license.status === 'activada'
      ? `⚠️ ADVERTENCIA: Esta licencia está ACTIVADA.\n\n¿Estás seguro de que deseas eliminar la licencia ${licenseKey}?\n\nEsta acción no se puede deshacer.`
      : `¿Estás seguro de que deseas eliminar la licencia ${licenseKey}?\n\nEsta acción no se puede deshacer.`;

  if (!confirm(message)) {
    return;
  }

  // Guardar filtros actuales
  const filterType = document.getElementById('filterType')?.value || 'all';
  const filterStatus = document.getElementById('filterStatus')?.value || 'all';

  if (window.licenseAdmin.deleteLicense(licenseKey)) {
    alert('✅ Licencia eliminada correctamente');
    // Recargar manteniendo los filtros
    loadLicenses(filterType, filterStatus);
  } else {
    alert('❌ Error al eliminar la licencia');
  }
};

window.exportLicenses = function () {
  window.licenseAdmin.exportToCSV();
};

window.viewLicenseDetails = function (licenseKey) {
  const license = window.licenseAdmin.licenses.find(l => l.licenseKey === licenseKey);
  if (!license) {
    return;
  }

  // Determinar nombre del tipo
  let tipoNombre = 'N/A';
  if (license.type === 'mensual') {
    tipoNombre = 'Mensual (30 días)';
  } else if (license.type === 'trimestral') {
    tipoNombre = 'Trimestral (90 días)';
  } else if (license.type === 'anual') {
    tipoNombre = 'Anual (365 días)';
  }

  const content = `
        <div class="row">
            <div class="col-md-6">
                <h6>Información de Licencia</h6>
                <table class="table table-sm">
                    <tr><td><strong>Clave:</strong></td><td><code>${license.licenseKey}</code></td></tr>
                    <tr><td><strong>Tipo:</strong></td><td>${tipoNombre}</td></tr>
                    <tr><td><strong>Registros:</strong></td><td>${license.registros || 'N/A'}</td></tr>
                    <tr><td><strong>Tenant ID:</strong></td><td><code>${license.tenantId}</code></td></tr>
                    <tr><td><strong>Estado:</strong></td><td>${license.status}</td></tr>
                    <tr><td><strong>Generada:</strong></td><td>${new Date(license.generatedAt).toLocaleString('es-MX')}</td></tr>
                    ${license.activatedAt ? `<tr><td><strong>Activada:</strong></td><td>${new Date(license.activatedAt).toLocaleString('es-MX')}</td></tr>` : ''}
                    ${license.expiresAt ? `<tr><td><strong>Expira:</strong></td><td>${new Date(license.expiresAt).toLocaleString('es-MX')}</td></tr>` : ''}
                </table>
            </div>
            <div class="col-md-6">
                <h6>Instrucciones para el Cliente</h6>
                <div class="alert alert-info">
                    <ol>
                        <li>Proporciona esta clave al cliente: <code>${license.licenseKey}</code></li>
                        <li>El cliente debe abrir el sistema ERP</li>
                        <li>Ingresar la clave cuando se solicite</li>
                        <li>El sistema se configurará automáticamente</li>
                    </ol>
                </div>
            </div>
        </div>
    `;

  document.getElementById('licenseDetailsContent').innerHTML = content;
  window.currentLicenseKey = licenseKey;
  const modal = new bootstrap.Modal(document.getElementById('licenseDetailsModal'));
  modal.show();
};

window.copyToClipboard = function (text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      alert('✅ Clave copiada al portapapeles');
    })
    .catch(() => {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('✅ Clave copiada al portapapeles');
    });
};

window.copyLicenseKey = function () {
  if (window.currentLicenseKey) {
    copyToClipboard(window.currentLicenseKey);
  }
};

// Funciones de filtrado
window.applyFilters = function () {
  const filterType = document.getElementById('filterType')?.value || 'all';
  const filterStatus = document.getElementById('filterStatus')?.value || 'all';
  const filterRegistros = document.getElementById('filterRegistros')?.value || 'all';
  loadLicenses(filterType, filterStatus, filterRegistros);
};

window.clearFilters = function () {
  if (document.getElementById('filterType')) {
    document.getElementById('filterType').value = 'all';
  }
  if (document.getElementById('filterStatus')) {
    document.getElementById('filterStatus').value = 'all';
  }
  if (document.getElementById('filterRegistros')) {
    document.getElementById('filterRegistros').value = 'all';
  }
  loadLicenses('all', 'all', 'all');
};

// Cargar licencias al iniciar (solo si estamos en la página correcta)
document.addEventListener('DOMContentLoaded', () => {
  // Solo cargar si los elementos necesarios existen
  if (document.getElementById('totalLicenses') || document.getElementById('licensesTable')) {
    loadLicenses();
  }

  // Verificar expiraciones cada minuto
  setInterval(() => {
    window.licenseAdmin.checkExpirations();
    loadLicenses();
  }, 60000);
});
