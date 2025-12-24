/**
 * Utilidades de Exportación - logistica.html
 * Funciones para exportar datos a Excel y utilidades generales
 */

(function () {
  'use strict';

  /**
   * Asegura que XLSX esté disponible
   */
  window.ensureXLSX = function (then) {
    if (window.XLSX) {
      then();
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.19.3/dist/xlsx.full.min.js';
    s.onload = () => then();
    s.onerror = () => then(new Error('No se pudo cargar SheetJS'));
    document.head.appendChild(s);
  };

  /**
   * Descarga un CSV como fallback si XLSX no está disponible
   */
  window.descargarCSV = function (nombreArchivo, filas) {
    const headers = Object.keys(filas[0] || {});
    const csv = [headers.join(',')]
      .concat(
        filas.map(row =>
          headers
            .map(h => {
              const val = row[h] == null ? '' : String(row[h]).replace(/"/g, '""');
              return `"${val}"`;
            })
            .join(',')
        )
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nombreArchivo.replace(/\.xlsx$/, '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Obtiene el nombre del cliente por RFC
   */
  window.obtenerClienteNombre = function (rfc) {
    if (!rfc) {
      return '';
    }

    // 1. Buscar en caché global primero (más rápido)
    if (window.__clientesCache && window.__clientesCache[rfc]) {
      const c = window.__clientesCache[rfc];
      return c.nombre || c.razonSocial || '';
    }

    // 2. Buscar en configuracionManager
    try {
      if (
        window.configuracionManager &&
        typeof window.configuracionManager.getCliente === 'function'
      ) {
        const c = window.configuracionManager.getCliente(rfc);
        if (c && (c.nombre || c.razonSocial)) {
          return c.nombre || c.razonSocial || '';
        }
      }
    } catch (_) {
      // Ignorar error intencionalmente
    }

    // 3. Buscar en localStorage
    try {
      const raw = localStorage.getItem('erp_clientes');
      if (raw) {
        const clientes = JSON.parse(raw);
        if (Array.isArray(clientes)) {
          const c = clientes.find(cl => cl.rfc === rfc);
          if (c && (c.nombre || c.razonSocial)) {
            // Cachear para próximas búsquedas
            window.__clientesCache[rfc] = c;
            return c.nombre || c.razonSocial || '';
          }
        } else {
          const c = clientes[rfc];
          if (c && (c.nombre || c.razonSocial)) {
            window.__clientesCache[rfc] = c;
            return c.nombre || c.razonSocial || '';
          }
        }
      }
    } catch (_) {
      // Ignorar error intencionalmente
    }

    return rfc; // Si no se encuentra, retornar el RFC
  };

  /**
   * Función helper para obtener valores de objetos con múltiples claves posibles
   */
  window.pick = function (obj, keys) {
    for (const k of keys) {
      if (obj && obj[k] != null && obj[k] !== '') {
        return obj[k];
      }
    }
    return '';
  };

  /**
   * Corrige problemas de codificación de caracteres
   * Convierte caracteres mal codificados UTF-8 a su representación correcta
   * Usa múltiples estrategias para asegurar la corrección
   */
  function corregirCodificacion(texto) {
    if (!texto || typeof texto !== 'string') {
      return texto;
    }

    try {
      let textoCorregido = texto;
      const textoOriginal = texto;

      // ESTRATEGIA 1: Reemplazos directos usando replaceAll o split/join
      // Estos son los caracteres que aparecen literalmente en el texto cuando hay problemas de codificación
      // IMPORTANTE: Usar split/join que funciona siempre, incluso si replaceAll no está disponible

      // Primero los más comunes y problemáticos
      textoCorregido = textoCorregido.split('Ã³').join('ó'); // electrÃ³nicos -> electrónicos
      textoCorregido = textoCorregido.split('Ã¡').join('á');
      textoCorregido = textoCorregido.split('Ã©').join('é');
      textoCorregido = textoCorregido.split('Ã­').join('í');
      textoCorregido = textoCorregido.split('Ãº').join('ú');
      textoCorregido = textoCorregido.split('Ã±').join('ñ');
      textoCorregido = textoCorregido.split('Ã¼').join('ü');
      textoCorregido = textoCorregido.split('Ã‰').join('É');
      textoCorregido = textoCorregido.split('Ã"').join('Ó');
      textoCorregido = textoCorregido.split('Ãš').join('Ú');
      textoCorregido = textoCorregido.split('Ãœ').join('Ü');
      textoCorregido = textoCorregido.split('Ã§').join('ç');
      textoCorregido = textoCorregido.split('Ã‡').join('Ç');

      // Si ya se corrigió algo, retornar inmediatamente
      if (textoCorregido !== textoOriginal) {
        return textoCorregido;
      }

      // ESTRATEGIA 2: Intentar decodificar como si fuera latin1 malinterpretado como UTF-8
      // Esto corrige casos donde texto UTF-8 fue leído como latin1
      try {
        // Convertir string a bytes usando latin1, luego reinterpretar como UTF-8
        const bytes = [];
        for (let i = 0; i < textoCorregido.length; i++) {
          bytes.push(textoCorregido.charCodeAt(i) & 0xff);
        }
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const textoDecodificado = decoder.decode(new Uint8Array(bytes));

        // Si el resultado es diferente y válido, usarlo
        if (
          textoDecodificado !== textoCorregido &&
          textoDecodificado.length > 0 &&
          !textoDecodificado.includes('')
        ) {
          textoCorregido = textoDecodificado;
        }
      } catch (e) {
        // Si falla, continuar con reemplazos Unicode
      }

      // ESTRATEGIA 3: Reemplazos usando códigos Unicode (regex) - por si acaso
      const correccionesUnicode = [
        [/\u00C3\u00A1/g, 'á'], // Ã¡ -> á
        [/\u00C3\u00A9/g, 'é'], // Ã© -> é
        [/\u00C3\u00AD/g, 'í'], // Ã­ -> í
        [/\u00C3\u00B3/g, 'ó'], // Ã³ -> ó (PRINCIPAL)
        [/\u00C3\u00BA/g, 'ú'], // Ãº -> ú
        [/\u00C3\u00B1/g, 'ñ'], // Ã± -> ñ
        [/\u00C3\u00BC/g, 'ü'], // Ã¼ -> ü
        [/\u00C3\u0081/g, 'Á'], // Ã -> Á
        [/\u00C3\u0089/g, 'É'], // Ã‰ -> É
        [/\u00C3\u008D/g, 'Í'], // Ã -> Í
        [/\u00C3\u0093/g, 'Ó'], // Ã" -> Ó
        [/\u00C3\u009A/g, 'Ú'], // Ãš -> Ú
        [/\u00C3\u0091/g, 'Ñ'], // Ã' -> Ñ
        [/\u00C3\u009C/g, 'Ü'] // Ãœ -> Ü
      ];

      for (const [regex, reemplazo] of correccionesUnicode) {
        try {
          textoCorregido = textoCorregido.replace(regex, reemplazo);
        } catch (e) {
          // Si falla el reemplazo, continuar
        }
      }

      return textoCorregido;
    } catch (e) {
      console.warn('⚠️ Error corrigiendo codificación:', e);
      return texto;
    }
  }

  /**
   * Exporta los registros de logística a Excel
   */
  window.exportarLogisticaExcel = async function () {
    let registrosArray = [];

    // PRIORIDAD 1: Intentar desde la variable global donde se guardan los registros cargados
    if (
      window._registrosLogisticaCompletos &&
      Array.isArray(window._registrosLogisticaCompletos) &&
      window._registrosLogisticaCompletos.length > 0
    ) {
      registrosArray = window._registrosLogisticaCompletos;
      console.log(
        `📊 Usando ${registrosArray.length} registros desde _registrosLogisticaCompletos`
      );
    }

    // PRIORIDAD 2: Intentar desde Firebase
    if (registrosArray.length === 0 && window.firebaseRepos?.logistica) {
      try {
        const repoLogistica = window.firebaseRepos.logistica;

        // Asegurar que el repositorio esté inicializado
        if (!repoLogistica.db || !repoLogistica.tenantId) {
          if (typeof repoLogistica.init === 'function') {
            await repoLogistica.init();
          }
        }

        if (repoLogistica.db && repoLogistica.tenantId) {
          const firebaseData = await repoLogistica.getAll({
            limit: 1000,
            useCache: true
          });
          if (firebaseData && firebaseData.length > 0) {
            registrosArray = firebaseData;
            console.log(`📊 Usando ${registrosArray.length} registros desde Firebase`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando desde Firebase:', error);
      }
    }

    // PRIORIDAD 3: Intentar desde localStorage (fallback)
    if (registrosArray.length === 0) {
      const raw = localStorage.getItem('erp_shared_data');
      const parsed = raw ? JSON.parse(raw) : {};
      const registros = parsed.registros || {};
      const logistica = parsed.logistica || {};

      // Convertir objetos a arrays
      if (Object.keys(registros).length > 0) {
        registrosArray = Object.values(registros);
        console.log(`📊 Usando ${registrosArray.length} registros desde erp_shared_data.registros`);
      } else if (Object.keys(logistica).length > 0) {
        registrosArray = Object.values(logistica);
        console.log(`📊 Usando ${registrosArray.length} registros desde erp_shared_data.logistica`);
      }
    }

    if (registrosArray.length === 0) {
      alert('No hay datos de Logística para exportar.');
      return;
    }

    // Mapear registros directamente desde el array
    const rows = registrosArray.map(registro => {
      const rfcCliente = window.pick(registro, ['rfcCliente', 'RFC', 'rfc', 'cliente']) || '';
      const nombreDirecto = window.pick(registro, ['clienteNombre', 'cliente']) || '';
      const nombreCliente =
        nombreDirecto && nombreDirecto !== rfcCliente
          ? nombreDirecto
          : window.obtenerClienteNombre(rfcCliente);

      // Crear objeto con las columnas en el orden correcto
      const fila = {
        Registro_Id: corregirCodificacion(
          registro.numeroRegistro || registro.id || registro.registroId || ''
        ),
        Fecha_Envio: corregirCodificacion(
          window.pick(registro, ['fechaEnvio', 'FechaEnvio']) || ''
        ),
        RFC_Cliente: corregirCodificacion(rfcCliente),
        Cliente: corregirCodificacion(nombreCliente || rfcCliente),
        Origen: corregirCodificacion(
          window.pick(registro, ['origen', 'LugarOrigen', 'lugarOrigen']) || ''
        ),
        Destino: corregirCodificacion(
          window.pick(registro, ['destino', 'LugarDestino', 'lugarDestino']) || ''
        ),
        Ref_Cliente: corregirCodificacion(
          window.pick(registro, ['referenciaCliente', 'ReferenciaCliente']) || ''
        ),
        Tipo_Plataforma: corregirCodificacion(
          window.pick(registro, [
            'tipoPlataforma',
            'TipoPlataforma',
            'tipo_plataforma',
            'plataforma'
          ]) || ''
        ),
        Mercancia: corregirCodificacion(
          window.pick(registro, ['tipoMercancia', 'TipoMercancia', 'mercanciaTipo', 'mercancia']) ||
            ''
        ),
        Tipo_Servicio: corregirCodificacion(
          window.pick(registro, ['tipoServicio', 'TipoServicio']) || ''
        ),
        Embalaje_Especial: corregirCodificacion(
          window.pick(registro, ['embalajeEspecial', 'EmbalajeEspecial', 'embalaje']) || ''
        ),
        Descripcion_Embalaje: corregirCodificacion(
          window.pick(registro, [
            'descripcionEmbalaje',
            'DescripcionEmbalaje',
            'embalajeDescripcion',
            'descripcion'
          ]) || ''
        ),
        Peso_Kg: window.pick(registro, ['peso', 'pesoKg']) || '',
        Largo_M: window.pick(registro, ['largo']) || '',
        Ancho_M: window.pick(registro, ['ancho']) || '',
        Fecha_Creacion: window.pick(registro, ['fechaCreacion']) || ''
      };

      return fila;
    });

    const filename = `logistica_${new Date().toISOString().slice(0, 10)}.xlsx`;
    window.ensureXLSX(err => {
      if (err || !window.XLSX) {
        window.descargarCSV(filename, rows);
        return;
      }
      try {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);

        // Configurar codificación UTF-8 para el workbook
        wb.Props = {
          Title: 'Logística',
          Subject: 'Exportación de registros de logística',
          Author: 'TitanFleet ERP',
          CreatedDate: new Date()
        };

        // Asegurar que las celdas con texto se traten como UTF-8
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (ws[cellAddress] && ws[cellAddress].t === 's') {
              // Si es una celda de texto, asegurar que se preserve la codificación
              ws[cellAddress].z = '@'; // Formato de texto
            }
          }
        }

        XLSX.utils.book_append_sheet(wb, ws, 'Logistica');
        XLSX.writeFile(wb, filename, { type: 'array' });
      } catch (e) {
        window.descargarCSV(filename, rows);
      }
    });
  };
})();
