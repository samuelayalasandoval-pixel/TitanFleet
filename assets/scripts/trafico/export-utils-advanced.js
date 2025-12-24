/**
 * Utilidades Avanzadas de Exportación - trafico.html
 * Funciones avanzadas para exportación a Excel/CSV con fallback
 *
 * @module trafico/export-utils-advanced
 */

(function () {
  'use strict';

  // Cargador dinámico de SheetJS y exportación con fallback a CSV
  window.ensureXLSX = function (then) {
    if (window.XLSX) {
      console.log('✅ XLSX ya está disponible');
      then();
      return;
    }
    console.log('📦 Cargando XLSX desde CDN...');

    // Intentar múltiples CDNs como fallback
    const cdnUrls = [
      'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js',
      'https://unpkg.com/xlsx@0.20.1/dist/xlsx.full.min.js',
      'https://cdn.jsdelivr.net/npm/xlsx@0.20.1/dist/xlsx.full.min.js'
    ];

    let currentIndex = 0;
    let timeoutId;

    const tryLoad = () => {
      if (currentIndex >= cdnUrls.length) {
        console.error('❌ Todos los CDNs fallaron al cargar XLSX');
        then(new Error('No se pudo cargar SheetJS desde ningún CDN'));
        return;
      }

      const script = document.createElement('script');
      script.src = cdnUrls[currentIndex];

      // Timeout de 10 segundos
      timeoutId = setTimeout(() => {
        console.warn(`⏱️ Timeout cargando XLSX desde ${cdnUrls[currentIndex]}`);
        script.remove();
        currentIndex++;
        tryLoad();
      }, 10000);

      script.onload = () => {
        clearTimeout(timeoutId);
        console.log(`✅ XLSX cargado exitosamente desde ${cdnUrls[currentIndex]}`);
        if (window.XLSX) {
          then();
        } else {
          console.error('❌ XLSX no está disponible después de cargar');
          currentIndex++;
          tryLoad();
        }
      };

      script.onerror = error => {
        clearTimeout(timeoutId);
        console.warn(`⚠️ Error cargando XLSX desde ${cdnUrls[currentIndex]}:`, error);
        currentIndex++;
        tryLoad();
      };

      document.head.appendChild(script);
    };

    tryLoad();
  };

  window.descargarCSV = function (nombreArchivo, filas) {
    const headers = Object.keys(filas[0] || {});

    // Agregar BOM UTF-8 para compatibilidad con Excel
    const csvHeaders = `\uFEFF${headers.join(',')}\n`;

    const csv = filas
      .map(row =>
        headers
          .map(h => {
            const val = row[h] == null ? '' : String(row[h]).replace(/"/g, '""');
            // Solo agregar comillas si el valor contiene caracteres especiales
            return val.includes(',') || val.includes('\n') || val.includes('"') ? `"${val}"` : val;
          })
          .join(',')
      )
      .join('\n');

    const fullCsvContent = csvHeaders + csv;
    const blob = new Blob([fullCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nombreArchivo.replace(/\.xlsx$/, '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para limpiar caracteres especiales en los datos
  window.limpiarCaracteresEspeciales = function (texto) {
    if (typeof texto !== 'string') {
      return texto;
    }

    // Mapeo de caracteres problemáticos comunes
    const caracteresEspeciales = {
      á: 'a',
      é: 'e',
      í: 'i',
      ó: 'o',
      ú: 'u',
      Á: 'A',
      É: 'E',
      Í: 'I',
      Ó: 'O',
      Ú: 'U',
      ñ: 'n',
      Ñ: 'N',
      ü: 'u',
      Ü: 'U',
      '¿': '',
      '¡': '',
      '«': '"',
      '»': '"',
      '…': '...'
    };

    return texto.replace(/[áéíóúÁÉÍÓÚñÑüÜ¿¡«»…]/g, match => caracteresEspeciales[match] || match);
  };
})();
