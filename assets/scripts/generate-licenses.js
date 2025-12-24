// Generador de Licencias - Para uso del vendedor
// Este script genera claves de licencia únicas para vender/rentar

class LicenseGenerator {
  constructor() {
    this.licenses = [];
  }

  // Generar código aleatorio
  generateRandomCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Generar una licencia con el nuevo formato: TF2512A-XXXXXXXX-XXXXXXXX
  // Parámetros:
  // - año: año en formato 2 dígitos (ej: "25" para 2025)
  // - mes: mes en formato 2 dígitos (ej: "12" para diciembre)
  // - tipo: 'A' (Anual), 'M' (Mensual), 'T' (Trimestral)
  generateLicense(año, mes, tipo) {
    // Validar tipo
    const tiposValidos = ['A', 'M', 'T'];
    if (!tiposValidos.includes(tipo)) {
      throw new Error(
        'Tipo de licencia inválido. Debe ser: A (Anual), M (Mensual) o T (Trimestral)'
      );
    }

    // Validar año (2 dígitos)
    if (!/^\d{2}$/.test(año)) {
      throw new Error('El año debe ser de 2 dígitos (ej: 25 para 2025)');
    }

    // Validar mes (01-12)
    if (!/^(0[1-9]|1[0-2])$/.test(mes)) {
      throw new Error('El mes debe ser de 2 dígitos entre 01 y 12');
    }

    // Generar dos bloques de 8 caracteres aleatorios
    const bloque1 = this.generateRandomCode(8);
    const bloque2 = this.generateRandomCode(8);

    // Formato: TF2512A-XXXXXXXX-XXXXXXXX
    return `TF${año}${mes}${tipo}-${bloque1}-${bloque2}`;
  }

  // Generar múltiples licencias
  // type: 'venta' (Anual), 'renta' (Mensual), 'trimestral'
  // count: cantidad de licencias
  // año: año opcional (2 dígitos)
  // mes: mes opcional (2 dígitos)
  generateLicenses(type, count, año = null, mes = null) {
    const licenses = [];
    const fecha = new Date();
    const añoStr = año || String(fecha.getFullYear()).slice(-2);
    const mesStr = mes || String(fecha.getMonth() + 1).padStart(2, '0');

    // Mapear tipos antiguos a nuevos códigos
    let tipoCodigo = 'A'; // Por defecto Anual
    if (type === 'venta') {
      tipoCodigo = 'A'; // Anual
    } else if (type === 'renta') {
      tipoCodigo = 'M'; // Mensual
    } else if (type === 'trimestral') {
      tipoCodigo = 'T'; // Trimestral
    } else {
      throw new Error(
        `Tipo de licencia inválido: ${type}. Use: 'venta' (Anual), 'renta' (Mensual) o 'trimestral'`
      );
    }

    for (let i = 0; i < count; i++) {
      licenses.push(this.generateLicense(añoStr, mesStr, tipoCodigo));
    }
    return licenses;
  }

  // Exportar licencias a CSV
  exportToCSV(licenses, type) {
    const csv = ['Licencia,Tipo,Año,Mes,Periodo,TenantId'];
    licenses.forEach(license => {
      // Extraer información del formato TF2512A-XXXXXXXX-XXXXXXXX
      const match = license.match(/^TF(\d{2})(\d{2})([AMT])-/);
      const año = match ? match[1] : '';
      const mes = match ? match[2] : '';
      const tipoCodigo = match ? match[3] : '';
      const tipoNombre =
        tipoCodigo === 'A' ? 'Anual' : tipoCodigo === 'M' ? 'Mensual' : 'Trimestral';

      const tenantId = `tenant_${license.replace(/-/g, '').toLowerCase()}`;
      csv.push(`${license},${type},20${año},${mes},${tipoNombre},${tenantId}`);
    });
    return csv.join('\n');
  }

  // Descargar licencias como archivo
  downloadLicenses(licenses, type, filename) {
    const csv = this.exportToCSV(licenses, type);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `licencias_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

// Función global para generar licencias desde la consola
window.generateLicenses = function (type, count) {
  const generator = new LicenseGenerator();
  const licenses = generator.generateLicenses(type, count);

  console.log(`✅ ${licenses.length} licencias de ${type} generadas:`);
  licenses.forEach((license, index) => {
    console.log(`${index + 1}. ${license}`);
  });

  // Opción para descargar
  if (confirm('¿Deseas descargar las licencias como archivo CSV?')) {
    generator.downloadLicenses(licenses, type);
  }

  return licenses;
};

// Ejemplo de uso:
// window.generateLicenses('venta', 10);  // Genera 10 licencias de venta
// window.generateLicenses('renta', 5);  // Genera 5 licencias de renta

console.log('✅ LicenseGenerator cargado. Usa: window.generateLicenses("venta", 10)');
