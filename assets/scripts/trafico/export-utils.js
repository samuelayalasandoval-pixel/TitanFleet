/**
 * Utilidades de Exportación - trafico.html
 * Funciones para exportar datos de Tráfico a Excel/CSV
 */

(function () {
  'use strict';

  // Función helper para limpiar caracteres especiales
  function limpiarCaracteresEspeciales(texto) {
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
  }

  // Función para asegurar que XLSX esté disponible
  function ensureXLSX(then) {
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
  }

  // Función para descargar CSV como fallback
  function descargarCSV(nombreArchivo, filas) {
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
  }

  // Función helper para obtener nombre de cliente (usa la función global de buzon-pendientes.js)
  // Esta función debe estar disponible globalmente desde buzon-pendientes.js
  // Si no está disponible, esperar un momento y reintentar
  async function obtenerClienteNombreHelper(rfc) {
    if (typeof window.obtenerClienteNombre === 'function') {
      return window.obtenerClienteNombre(rfc);
    }
    // Esperar un momento y reintentar (en caso de que buzon-pendientes.js aún se esté cargando)
    await new Promise(resolve => setTimeout(resolve, 100));
    if (typeof window.obtenerClienteNombre === 'function') {
      return window.obtenerClienteNombre(rfc);
    }
    // Fallback básico si la función no está disponible aún
    console.warn('⚠️ obtenerClienteNombre no está disponible, usando fallback');
    return rfc || '';
  }

  // Función principal de exportación
  window.exportarTraficoExcel = async function () {
    console.log('🚛 Iniciando exportación de Tráfico...');

    let trafico = {};
    let logistica = {};
    let registros = [];

    // 1. PRIORIDAD: Buscar en Firebase
    if (window.firebaseRepos?.trafico) {
      try {
        console.log('🔍 Buscando registros de tráfico en Firebase...');
        const registrosFirebase = await window.firebaseRepos.trafico.getAllRegistros();
        console.log('📊 Registros obtenidos de Firebase:', registrosFirebase.length);

        if (registrosFirebase && registrosFirebase.length > 0) {
          // Convertir array a objeto con regId como clave
          registrosFirebase.forEach(reg => {
            const regId = reg.id || reg.numeroRegistro || reg.numeroRegistro;
            if (regId) {
              trafico[regId] = reg;
            }
          });
          registros = Object.keys(trafico);
          console.log('✅ Registros de tráfico cargados desde Firebase:', registros.length);
        }
      } catch (e) {
        console.warn('⚠️ Error obteniendo registros de Firebase:', e);
      }
    }

    // 2. FALLBACK: Buscar en localStorage si no hay datos en Firebase
    if (registros.length === 0) {
      console.log('🔍 Buscando registros de tráfico en localStorage...');
      const raw = localStorage.getItem('erp_shared_data');
      const parsed = raw ? JSON.parse(raw) : {};
      trafico = parsed.trafico || {};
      registros = Object.keys(trafico);
      console.log('📊 Registros obtenidos de localStorage:', registros.length);
    }

    if (registros.length === 0) {
      alert('No hay datos de Tráfico para exportar.');
      return;
    }

    console.log(`📋 Exportando ${registros.length} registros de Tráfico...`);

    // Obtener datos de logística para complementar
    // 1. PRIORIDAD: Buscar en Firebase
    if (window.firebaseRepos?.logistica) {
      try {
        console.log('🔍 Buscando registros de logística en Firebase...');
        const registrosLogisticaFirebase = await window.firebaseRepos.logistica.getAllRegistros();
        console.log(
          '📊 Registros de logística obtenidos de Firebase:',
          registrosLogisticaFirebase.length
        );

        if (registrosLogisticaFirebase && registrosLogisticaFirebase.length > 0) {
          registrosLogisticaFirebase.forEach(reg => {
            const regId = reg.id || reg.numeroRegistro || reg.numeroRegistro;
            if (regId) {
              logistica[regId] = reg;
            }
          });
          console.log(
            '✅ Registros de logística cargados desde Firebase:',
            Object.keys(logistica).length
          );
        }
      } catch (e) {
        console.warn('⚠️ Error obteniendo registros de logística desde Firebase:', e);
      }
    }

    // 2. FALLBACK: Buscar en localStorage
    if (Object.keys(logistica).length === 0) {
      const raw = localStorage.getItem('erp_shared_data');
      const parsed = raw ? JSON.parse(raw) : {};
      logistica = parsed.registros || {};
      console.log(
        '📊 Registros de logística obtenidos de localStorage:',
        Object.keys(logistica).length
      );
    }

    // Función helper para obtener valores de múltiples campos posibles
    const getValue = (registro, registroLogistica, ...fields) => {
      // Primero buscar en tráfico
      for (const field of fields) {
        if (
          registro &&
          registro[field] !== undefined &&
          registro[field] !== null &&
          registro[field] !== ''
        ) {
          return registro[field];
        }
      }
      // Si no se encuentra en tráfico, buscar en logística
      if (registroLogistica) {
        for (const field of fields) {
          if (
            registroLogistica[field] !== undefined &&
            registroLogistica[field] !== null &&
            registroLogistica[field] !== ''
          ) {
            return registroLogistica[field];
          }
        }
      }
      return '';
    };

    // Definir columnas de LOGÍSTICA (sin Origen y Destino)
    // NOTA: Columna H (Tipo Plataforma) eliminada según solicitud
    const columnasLogistica = [
      'N° Registro',
      'Fecha Envío',
      'Cliente',
      'RFC Cliente',
      'Referencia Cliente',
      'Tipo Servicio',
      'Tipo Mercancía',
      'Embalaje Especial',
      'Peso (Kg)',
      'Largo (m)',
      'Ancho (m)',
      'Observaciones Logística'
    ];

    // Definir columnas adicionales (a partir de la O)
    const columnasAdicionales = [
      'Lugar de Origen (Estancia)',
      'Lugar de Destino (Estancia)',
      'Plataforma',
      'Placas Plataforma',
      'Económico o Tractocamion',
      'Marca',
      'Placas',
      'Permiso SCT',
      'Operador Principal',
      'Licencia Operador Principal',
      'Operador Secundario',
      'Licencia Operador Secundario',
      'Estado (Cargado o Descargado)',
      'Última Actualización'
    ];

    // Preparar datos combinados (logística + tráfico por fila)
    const rowsData = registros.map(regId => {
      const registro = trafico[regId];
      const registroLogistica = logistica[regId] || null;

      // Obtener RFC Cliente
      let rfcCliente = getValue(registro, registroLogistica, 'rfcCliente', 'RFC', 'rfc');
      if (!rfcCliente && registroLogistica) {
        rfcCliente =
          registroLogistica.rfcCliente || registroLogistica.RFC || registroLogistica.rfc || '';
      }

      // Obtener Referencia Cliente
      let referenciaCliente = getValue(
        registro,
        registroLogistica,
        'referencia cliente',
        'referenciaCliente',
        'ReferenciaCliente'
      );
      if (!referenciaCliente && registroLogistica) {
        referenciaCliente =
          registroLogistica.referenciaCliente || registroLogistica.ReferenciaCliente || '';
      }

      // Obtener Tipo de Servicio correctamente (prioridad: logística, luego tráfico, sin plataformaServicio)
      let tipoServicio = '';
      if (registroLogistica) {
        tipoServicio = registroLogistica.tipoServicio || registroLogistica.TipoServicio || '';
      }
      if (!tipoServicio) {
        tipoServicio = registro?.tipoServicio || registro?.TipoServicio || '';
      }
      // Normalizar valores (general -> General, urgente -> Urgente, etc.)
      if (tipoServicio) {
        tipoServicio = tipoServicio.toLowerCase();
        if (tipoServicio === 'general') {
          tipoServicio = 'General';
        } else if (tipoServicio === 'urgente') {
          tipoServicio = 'Urgente';
        } else if (tipoServicio === 'doble-operador' || tipoServicio === 'doble operador') {
          tipoServicio = 'Doble Operador';
        } else {
          tipoServicio = tipoServicio.charAt(0).toUpperCase() + tipoServicio.slice(1);
        }
      }

      // Obtener fecha de envío
      let fechaEnvio = getValue(registro, registroLogistica, 'fechaEnvio', 'FechaEnvio', 'fecha');
      // Formatear fecha de envío si existe
      if (fechaEnvio) {
        try {
          if (typeof fechaEnvio === 'string' && fechaEnvio.includes('T')) {
            fechaEnvio = fechaEnvio.split('T')[0];
          } else if (typeof fechaEnvio === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaEnvio)) {
            fechaEnvio = fechaEnvio.substring(0, 10);
          } else {
            const fecha = new Date(fechaEnvio);
            if (!isNaN(fecha.getTime())) {
              const año = fecha.getFullYear();
              const mes = String(fecha.getMonth() + 1).padStart(2, '0');
              const dia = String(fecha.getDate()).padStart(2, '0');
              fechaEnvio = `${año}-${mes}-${dia}`;
            }
          }
        } catch (e) {
          fechaEnvio = String(fechaEnvio);
        }
      }

      // Datos de LOGÍSTICA (sin Origen y Destino)
      const datosLogistica = {
        'N° Registro': regId,
        'Fecha Envío': fechaEnvio || '',
        Cliente: limpiarCaracteresEspeciales(getValue(registro, registroLogistica, 'cliente')),
        'RFC Cliente': rfcCliente,
        'Referencia Cliente': limpiarCaracteresEspeciales(referenciaCliente),
        'Tipo Servicio': tipoServicio || 'General',
        'Tipo Mercancía': limpiarCaracteresEspeciales(
          getValue(registro, registroLogistica, 'tipoMercancia', 'TipoMercancia', 'mercancia')
        ),
        'Embalaje Especial': limpiarCaracteresEspeciales(
          getValue(registro, registroLogistica, 'embalajeEspecial', 'EmbalajeEspecial')
        ),
        'Peso (Kg)': getValue(registro, registroLogistica, 'peso', 'pesoKg'),
        'Largo (m)': getValue(registro, registroLogistica, 'largo', 'largoM'),
        'Ancho (m)': getValue(registro, registroLogistica, 'ancho', 'anchoM'),
        'Observaciones Logística': limpiarCaracteresEspeciales(
          getValue(registro, registroLogistica, 'observacionesLogistica')
        )
      };

      // Obtener operadores y sus licencias
      const operadorPrincipal = getValue(
        registro,
        registroLogistica,
        'operadorprincipal',
        'operadorPrincipal',
        'OperadorPrincipal'
      );
      const operadorSecundario = getValue(
        registro,
        registroLogistica,
        'operadorsecundario',
        'operadorSecundario',
        'OperadorSecundario'
      );

      // Obtener licencias directamente del registro
      let licenciaPrincipal = getValue(
        registro,
        registroLogistica,
        'Licencia',
        'licenciaOperadorPrincipal',
        'LicenciaOperadorPrincipal',
        'licenciaPrincipal',
        'licencia'
      );
      let licenciaSecundaria = getValue(
        registro,
        registroLogistica,
        'LicenciaSecundaria',
        'licenciaOperadorSecundario',
        'LicenciaOperadorSecundario',
        'licenciaSecundaria'
      );

      // Si no hay licencia pero hay operador, intentar buscar desde operadores
      if (!licenciaPrincipal && operadorPrincipal) {
        try {
          // Buscar en configuracionManager
          if (
            window.configuracionManager &&
            typeof window.configuracionManager.getOperadores === 'function'
          ) {
            const operadores = window.configuracionManager.getOperadores() || [];
            const operadorEncontrado = operadores.find(
              op =>
                (op.nombre || '').trim() === operadorPrincipal.trim() ||
                (op.nombreCompleto || '').trim() === operadorPrincipal.trim()
            );
            if (operadorEncontrado) {
              licenciaPrincipal = operadorEncontrado.licencia || operadorEncontrado.Licencia || '';
            }
          }
        } catch (e) {
          console.warn('⚠️ Error buscando licencia principal desde operadores:', e);
        }
      }

      if (!licenciaSecundaria && operadorSecundario) {
        try {
          // Buscar en configuracionManager
          if (
            window.configuracionManager &&
            typeof window.configuracionManager.getOperadores === 'function'
          ) {
            const operadores = window.configuracionManager.getOperadores() || [];
            const operadorEncontrado = operadores.find(
              op =>
                (op.nombre || '').trim() === operadorSecundario.trim() ||
                (op.nombreCompleto || '').trim() === operadorSecundario.trim()
            );
            if (operadorEncontrado) {
              licenciaSecundaria = operadorEncontrado.licencia || operadorEncontrado.Licencia || '';
            }
          }
        } catch (e) {
          console.warn('⚠️ Error buscando licencia secundaria desde operadores:', e);
        }
      }

      // Datos adicionales (a partir de la columna O)
      const datosAdicionales = {
        'Lugar de Origen (Estancia)': limpiarCaracteresEspeciales(
          getValue(registro, registroLogistica, 'origen', 'LugarOrigen', 'lugarOrigen')
        ),
        'Lugar de Destino (Estancia)': limpiarCaracteresEspeciales(
          getValue(registro, registroLogistica, 'destino', 'LugarDestino', 'lugarDestino')
        ),
        Plataforma: limpiarCaracteresEspeciales(
          getValue(registro, registroLogistica, 'plataformaServicio', 'plataforma', 'Plataforma')
        ),
        'Placas Plataforma': getValue(
          registro,
          registroLogistica,
          'placasPlataforma',
          'PlacasPlataforma'
        ),
        'Económico o Tractocamion': getValue(
          registro,
          registroLogistica,
          'economico',
          'tractocamion',
          'Tractocamion'
        ),
        Marca: 'Kenworth T680',
        Placas: getValue(registro, registroLogistica, 'Placas', 'placas', 'placasTractor'),
        'Permiso SCT': getValue(
          registro,
          registroLogistica,
          'permisoSCT',
          'PermisoSCT',
          'permiso',
          'Permiso'
        ),
        'Operador Principal': limpiarCaracteresEspeciales(operadorPrincipal),
        'Licencia Operador Principal': licenciaPrincipal || '',
        'Operador Secundario': limpiarCaracteresEspeciales(operadorSecundario),
        'Licencia Operador Secundario': licenciaSecundaria || '',
        'Estado (Cargado o Descargado)': limpiarCaracteresEspeciales(
          getValue(registro, registroLogistica, 'estadoPlataforma', 'estado') || 'Cargado'
        ),
        'Última Actualización': getValue(registro, registroLogistica, 'ultimaActualizacion')
      };

      // Combinar datos en un solo objeto (logística primero, luego adicionales)
      const filaCompleta = {};
      columnasLogistica.forEach(col => {
        filaCompleta[col] = datosLogistica[col] || '';
      });
      columnasAdicionales.forEach(col => {
        filaCompleta[col] = datosAdicionales[col] || '';
      });

      return filaCompleta;
    });

    const filename = `Trafico_Completo_${new Date().toISOString().slice(0, 10)}.xlsx`;

    // Preparar datos para CSV (formato compatible)
    const rowsForCSV = rowsData.map(row => {
      const csvRow = {};
      columnasLogistica.forEach(col => {
        csvRow[col] = row[col] || '';
      });
      columnasAdicionales.forEach(col => {
        csvRow[col] = row[col] || '';
      });
      return csvRow;
    });

    console.log('📦 Verificando disponibilidad de XLSX...');
    ensureXLSX(async err => {
      if (err || !window.XLSX) {
        console.warn('⚠️ XLSX no disponible, exportando CSV...', err);
        console.warn('⚠️ Nota: CSV solo soporta una hoja. Para ver ambas hojas, necesita Excel.');
        const csvFilename = filename.replace('.xlsx', '.csv');
        descargarCSV(csvFilename, rowsForCSV);
        if (typeof window.showNotification === 'function') {
          window.showNotification('⚠️ Se exportó como CSV (XLSX no disponible)', 'warning');
        }
        return;
      }
      console.log('✅ XLSX disponible, creando archivo Excel con 2 hojas...');
      console.log('📊 Total registros a exportar:', rowsData.length);
      try {
        const wb = XLSX.utils.book_new();
        const ws = {};

        // Fila 1: Encabezados (sin título de sección)
        let colIndex = 0;
        columnasLogistica.forEach(col => {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
          ws[cellAddress] = { v: col, t: 's' };
          colIndex++;
        });
        columnasAdicionales.forEach(col => {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
          ws[cellAddress] = { v: col, t: 's' };
          colIndex++;
        });

        // Filas 2 en adelante: Datos
        rowsData.forEach((row, rowIndex) => {
          const excelRow = rowIndex + 1; // Fila 2 = índice 1 (0-based)
          colIndex = 0;

          // Datos de logística
          columnasLogistica.forEach(col => {
            const cellAddress = XLSX.utils.encode_cell({ r: excelRow, c: colIndex });
            let value = row[col] !== undefined && row[col] !== null ? row[col] : '';

            // Forzar que "Fecha Envío" sea texto (string) para mantener formato ISO
            if (col === 'Fecha Envío' && value) {
              // Asegurar que sea string y agregar espacio invisible al inicio
              // Esto evita que Excel lo interprete como fecha
              value = String(value);
              // Agregar un espacio no separador (U+200B) al inicio para forzar texto
              // Este carácter es invisible pero evita que Excel interprete como fecha
              const valueAsText = `\u200B${value}`;
              // Crear celda con tipo string explícitamente
              ws[cellAddress] = {
                v: valueAsText,
                t: 's' // Tipo string
              };
              // Configurar formato de celda como texto explícitamente
              if (!ws[cellAddress].s) {
                ws[cellAddress].s = {};
              }
              ws[cellAddress].s.numFmt = '@'; // Formato de texto en Excel
              ws[cellAddress].s.protection = { locked: false };
            } else {
              ws[cellAddress] = { v: value, t: typeof value === 'number' ? 'n' : 's' };
            }
            colIndex++;
          });

          // Datos adicionales
          columnasAdicionales.forEach(col => {
            const cellAddress = XLSX.utils.encode_cell({ r: excelRow, c: colIndex });
            const value = row[col] !== undefined && row[col] !== null ? row[col] : '';
            ws[cellAddress] = { v: value, t: typeof value === 'number' ? 'n' : 's' };
            colIndex++;
          });
        });

        // Definir rango de la hoja
        const totalRows = rowsData.length + 1; // 1 fila de encabezados + datos
        const totalCols = columnasLogistica.length + columnasAdicionales.length;
        ws['!ref'] = XLSX.utils.encode_range({
          s: { r: 0, c: 0 },
          e: { r: totalRows - 1, c: totalCols - 1 }
        });

        // Sin celdas combinadas (eliminado título LOGÍSTICA)
        ws['!merges'] = [];

        // Configurar ancho de columnas
        const widthMap = {
          'N° Registro': 15,
          'Fecha Envío': 12,
          Cliente: 20,
          'RFC Cliente': 15,
          'Referencia Cliente': 15,
          Origen: 15,
          Destino: 15,
          'Tipo Servicio': 15,
          'Tipo Mercancía': 15,
          'Embalaje Especial': 15,
          Marca: 15,
          'Peso (Kg)': 10,
          'Largo (m)': 10,
          'Ancho (m)': 10,
          'Número Económico Plataforma': 18,
          'Placas Plataforma': 15,
          'Placas Tractor': 15,
          'Operador Principal': 20,
          'Licencia Operador Principal': 20,
          'Operador Secundario': 20,
          'Licencia Operador Secundario': 20,
          'Observaciones Logística': 25,
          'Observaciones Tráfico': 25,
          Estado: 12,
          'Última Actualización': 18
        };

        ws['!cols'] = [];
        columnasLogistica.forEach(col => {
          ws['!cols'].push({ width: widthMap[col] || 15 });
        });
        columnasAdicionales.forEach(col => {
          ws['!cols'].push({ width: widthMap[col] || 15 });
        });

        // Aplicar formato a los encabezados (fila 1)
        for (let c = 0; c < totalCols; c++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: c });
          const cell = ws[cellAddress];
          if (cell) {
            cell.s = {
              font: { bold: true },
              fill: { fgColor: { rgb: 'E0E0E0' } },
              alignment: { horizontal: 'center', vertical: 'center' }
            };
          }
        }

        XLSX.utils.book_append_sheet(wb, ws, 'Tráfico');

        // Crear segunda hoja con datos de descarga
        console.log('📋 Creando segunda hoja con datos de descarga...');
        const ws2 = {};

        // Columnas de la segunda hoja
        const columnasDescarga = [
          'N° Registro',
          'Fecha Creacion',
          'Cliente',
          'RFC Cliente',
          'Referencia Cliente',
          'Tractocamion',
          'Operador Principal',
          'Operador Secundario',
          'Fecha Descarga',
          'Notas Descarga',
          'Última Actualización'
        ];

        // Fila 1: Encabezados
        columnasDescarga.forEach((col, colIndex) => {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
          ws2[cellAddress] = { v: col, t: 's' };
        });

        // Aplicar formato a los encabezados
        for (let c = 0; c < columnasDescarga.length; c++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: c });
          const cell = ws2[cellAddress];
          if (cell) {
            cell.s = {
              font: { bold: true },
              fill: { fgColor: { rgb: 'E0E0E0' } },
              alignment: { horizontal: 'center', vertical: 'center' }
            };
          }
        }

        // Filas 2 en adelante: Datos
        const rowsDescargaData = await Promise.all(
          registros.map(async regId => {
            const registro = trafico[regId];
            const registroLogistica = logistica[regId] || null;

            // Obtener RFC Cliente
            let rfcCliente = getValue(registro, registroLogistica, 'rfcCliente', 'RFC', 'rfc');
            if (!rfcCliente && registroLogistica) {
              rfcCliente =
                registroLogistica.rfcCliente ||
                registroLogistica.RFC ||
                registroLogistica.rfc ||
                '';
            }

            // Obtener nombre del cliente desde RFC
            let nombreCliente = '';
            if (rfcCliente) {
              try {
                nombreCliente = await obtenerClienteNombreHelper(rfcCliente);
              } catch (e) {
                console.warn('⚠️ Error obteniendo nombre de cliente:', e);
              }
            }
            if (!nombreCliente) {
              nombreCliente =
                limpiarCaracteresEspeciales(getValue(registro, registroLogistica, 'cliente')) || '';
            }

            // Obtener Referencia Cliente
            let referenciaCliente = getValue(
              registro,
              registroLogistica,
              'referencia cliente',
              'referenciaCliente',
              'ReferenciaCliente'
            );
            if (!referenciaCliente && registroLogistica) {
              referenciaCliente =
                registroLogistica.referenciaCliente || registroLogistica.ReferenciaCliente || '';
            }

            // Formatear fecha de creación
            const fechaCreacionRaw = getValue(registro, registroLogistica, 'fechaCreacion');
            let fechaCreacionFormateada = '';
            if (fechaCreacionRaw) {
              try {
                // Si ya es un string ISO, extraer solo la fecha (YYYY-MM-DD)
                if (typeof fechaCreacionRaw === 'string' && fechaCreacionRaw.includes('T')) {
                  fechaCreacionFormateada = fechaCreacionRaw.split('T')[0];
                } else if (
                  typeof fechaCreacionRaw === 'string' &&
                  /^\d{4}-\d{2}-\d{2}/.test(fechaCreacionRaw)
                ) {
                  // Si ya está en formato YYYY-MM-DD, usarlo directamente
                  fechaCreacionFormateada = fechaCreacionRaw.substring(0, 10);
                } else {
                  // Convertir a Date y extraer solo la fecha
                  const fecha = new Date(fechaCreacionRaw);
                  if (!isNaN(fecha.getTime())) {
                    const año = fecha.getFullYear();
                    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
                    const dia = String(fecha.getDate()).padStart(2, '0');
                    fechaCreacionFormateada = `${año}-${mes}-${dia}`;
                  } else {
                    fechaCreacionFormateada = String(fechaCreacionRaw);
                  }
                }
              } catch (e) {
                fechaCreacionFormateada = String(fechaCreacionRaw);
              }
            }

            // Datos de descarga
            const tractocamionDescarga =
              registro.tractocamionDescarga || registro.economicoDescarga || '';
            const operadorPrincipalDescarga = registro.operadorPrincipalDescarga || '';
            const operadorSecundarioDescarga = registro.operadorSecundarioDescarga || '';
            const fechaDescarga = registro.fechaDescarga || '';
            const notasDescarga = limpiarCaracteresEspeciales(
              registro.notasDescarga || registro.observacionesDescarga || ''
            );
            const ultimaActualizacion =
              registro.ultimaActualizacion || registro.fechaActualizacion || '';

            return {
              'N° Registro': regId,
              'Fecha Creacion': fechaCreacionFormateada,
              Cliente: nombreCliente,
              'RFC Cliente': rfcCliente,
              'Referencia Cliente': limpiarCaracteresEspeciales(referenciaCliente),
              Tractocamion: tractocamionDescarga,
              'Operador Principal': limpiarCaracteresEspeciales(operadorPrincipalDescarga),
              'Operador Secundario': limpiarCaracteresEspeciales(operadorSecundarioDescarga),
              'Fecha Descarga': fechaDescarga,
              'Notas Descarga': notasDescarga,
              'Última Actualización': ultimaActualizacion
            };
          })
        );

        // Agregar datos a la hoja 2
        rowsDescargaData.forEach((row, rowIndex) => {
          const excelRow = rowIndex + 1; // Fila 2 = índice 1 (0-based)
          columnasDescarga.forEach((col, colIndex) => {
            const cellAddress = XLSX.utils.encode_cell({ r: excelRow, c: colIndex });
            const value = row[col] !== undefined && row[col] !== null ? row[col] : '';

            // Forzar que "Fecha Creacion" y "Fecha Descarga" sean texto
            if ((col === 'Fecha Creacion' || col === 'Fecha Descarga') && value) {
              ws2[cellAddress] = { v: ` ${String(value)}`, t: 's' };
              if (!ws2[cellAddress].s) {
                ws2[cellAddress].s = {};
              }
              ws2[cellAddress].s.numFmt = '@';
            } else {
              ws2[cellAddress] = { v: value, t: typeof value === 'number' ? 'n' : 's' };
            }
          });
        });

        // Definir rango de la hoja 2
        const totalRows2 = Math.max(rowsDescargaData.length + 1, 1); // Al menos 1 fila (encabezados)
        const totalCols2 = columnasDescarga.length;
        if (totalRows2 > 1 || Object.keys(ws2).length > 0) {
          ws2['!ref'] = XLSX.utils.encode_range({
            s: { r: 0, c: 0 },
            e: { r: totalRows2 - 1, c: totalCols2 - 1 }
          });
        } else {
          // Si no hay datos, crear al menos el rango de encabezados
          ws2['!ref'] = XLSX.utils.encode_range({
            s: { r: 0, c: 0 },
            e: { r: 0, c: totalCols2 - 1 }
          });
        }

        // Configurar ancho de columnas para hoja 2
        const widthMap2 = {
          'N° Registro': 15,
          'Fecha Creacion': 18,
          Cliente: 30,
          'RFC Cliente': 15,
          'Referencia Cliente': 20,
          Tractocamion: 15,
          'Operador Principal': 25,
          'Operador Secundario': 25,
          'Fecha Descarga': 15,
          'Notas Descarga': 40,
          'Última Actualización': 18
        };

        ws2['!cols'] = [];
        columnasDescarga.forEach(col => {
          ws2['!cols'].push({ width: widthMap2[col] || 15 });
        });

        // Agregar segunda hoja al workbook (siempre, incluso si está vacía)
        try {
          XLSX.utils.book_append_sheet(wb, ws2, 'Datos de Descarga');
          console.log('✅ Segunda hoja "Datos de Descarga" agregada al workbook');
          console.log(`📊 Datos en hoja 2: ${rowsDescargaData.length} registros`);
        } catch (error) {
          console.error('❌ Error agregando segunda hoja:', error);
        }

        // Verificar que el workbook tenga ambas hojas
        console.log(`📋 Hojas en workbook: ${wb.SheetNames.length}`);
        console.log(`📋 Nombres de hojas: ${wb.SheetNames.join(', ')}`);

        // Descargar el archivo
        try {
          XLSX.writeFile(wb, filename);
          console.log('✅ Archivo Excel generado y descargado:', filename);
          console.log('✅ Exportación de Tráfico completada exitosamente (2 hojas)');

          // Mostrar notificación de éxito
          if (typeof window.showNotification === 'function') {
            window.showNotification(`✅ Exportación completada: ${filename}`, 'success');
          } else {
            alert(
              `✅ Exportación de Tráfico completada!\n\nArchivo: ${filename}\n\nHoja 1: Tráfico Completo\nHoja 2: Datos de Descarga`
            );
          }
        } catch (downloadError) {
          console.error('❌ Error al descargar el archivo:', downloadError);
          // Intentar descargar como CSV como fallback
          console.log('🔄 Intentando descargar como CSV...');
          descargarCSV(filename.replace('.xlsx', '.csv'), rowsForCSV);
          alert('⚠️ Error al descargar Excel. Se descargó como CSV en su lugar.');
        }
      } catch (e) {
        console.error('❌ Error exportando a Excel:', e);
        descargarCSV(filename, rowsForCSV);
        alert('⚠️ Se exportó como CSV debido a un error con Excel');
      }
    });
  };
})();
