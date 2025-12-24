/**
 * Utilidades de Exportación - facturacion.html
 * Funciones para exportar datos de facturación a Excel
 */

(function () {
  'use strict';

  /**
   * Función helper para limpiar formato de moneda
   */
  function limpiarMoneda(valor) {
    if (!valor) {
      return 0;
    }
    if (typeof valor === 'number') {
      return valor;
    }
    if (typeof valor === 'string') {
      const limpio = valor.replace(/[$,]/g, '').trim();
      const numero = parseFloat(limpio);
      return isNaN(numero) ? 0 : numero;
    }
    return 0;
  }

  /**
   * Función helper para corregir codificación de caracteres especiales
   */
  function corregirCodificacion(texto) {
    if (!texto || typeof texto !== 'string') {
      return texto;
    }

    try {
      // Mapeo de caracteres mal codificados usando códigos Unicode
      const correcciones = [
        [/\u00C3\u00A1/g, 'á'], // Ã¡ -> á
        [/\u00C3\u00A9/g, 'é'], // Ã© -> é
        [/\u00C3\u00AD/g, 'í'], // Ã­ -> í
        [/\u00C3\u00B3/g, 'ó'], // Ã³ -> ó
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

      let textoCorregido = texto;

      // Aplicar correcciones
      for (const [regex, reemplazo] of correcciones) {
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
   * Obtiene el nombre del cliente por RFC
   */
  function obtenerNombreCliente(rfc) {
    if (!rfc) {
      return 'N/A';
    }
    try {
      if (
        window.configuracionManager &&
        typeof window.configuracionManager.getCliente === 'function'
      ) {
        const clienteData = window.configuracionManager.getCliente(rfc);
        if (clienteData && clienteData.nombre) {
          return clienteData.nombre;
        }
      }
      // Fallback: buscar en localStorage
      const clientesData = localStorage.getItem('erp_clientes');
      if (clientesData) {
        const clientes = JSON.parse(clientesData);
        let clienteData = null;
        if (Array.isArray(clientes)) {
          clienteData = clientes.find(c => c.rfc === rfc);
        } else {
          clienteData = clientes[rfc];
        }
        if (clienteData && clienteData.nombre) {
          return clienteData.nombre;
        } else if (clienteData && clienteData.razonSocial) {
          return clienteData.razonSocial;
        }
      }
    } catch (e) {
      console.warn('⚠️ Error obteniendo nombre del cliente:', e);
    }
    return rfc;
  }

  /**
   * Exporta los registros de facturación a Excel
   */
  window.exportarFacturacionExcel = async function () {
    try {
      let facturasArray = [];
      let facturas = {};

      // PRIORIDAD 1: Intentar desde la variable global donde se guardan los registros cargados
      if (
        window._registrosFacturacionCompletos &&
        Array.isArray(window._registrosFacturacionCompletos) &&
        window._registrosFacturacionCompletos.length > 0
      ) {
        facturasArray = window._registrosFacturacionCompletos;
        // Convertir array a objeto con id como clave
        facturasArray.forEach(factura => {
          const id = factura.numeroRegistro || factura.id || factura.registroId;
          if (id) {
            facturas[id] = factura;
          }
        });
        console.log(
          `📊 Usando ${facturasArray.length} registros desde _registrosFacturacionCompletos`
        );
      }

      // PRIORIDAD 2: Intentar desde Firebase
      if (Object.keys(facturas).length === 0 && window.firebaseRepos?.facturacion) {
        try {
          const repoFacturacion = window.firebaseRepos.facturacion;

          // Asegurar que el repositorio esté inicializado
          if (!repoFacturacion.db || !repoFacturacion.tenantId) {
            if (typeof repoFacturacion.init === 'function') {
              await repoFacturacion.init();
            }
          }

          if (repoFacturacion.db && repoFacturacion.tenantId) {
            const firebaseData = await repoFacturacion.getAll({
              limit: 1000,
              useCache: true
            });
            if (firebaseData && firebaseData.length > 0) {
              firebaseData.forEach(factura => {
                const id = factura.numeroRegistro || factura.id || factura.registroId;
                if (id) {
                  facturas[id] = factura;
                }
              });
              console.log(`📊 Usando ${firebaseData.length} registros desde Firebase`);
            }
          }
        } catch (error) {
          console.warn('⚠️ Error cargando desde Firebase:', error);
        }
      }

      // PRIORIDAD 3: Intentar desde localStorage (fallback)
      // Declarar parsed fuera del if para que esté disponible en todo el scope
      let parsed = {};
      if (Object.keys(facturas).length === 0) {
        const raw = localStorage.getItem('erp_shared_data');
        parsed = raw ? JSON.parse(raw) : {};
        facturas = parsed.facturas || parsed.facturacion || {};
        console.log(`📊 Usando ${Object.keys(facturas).length} registros desde localStorage`);
      } else {
        // Si ya hay facturas, aún así cargar parsed para obtener datos de logística y tráfico
        const raw = localStorage.getItem('erp_shared_data');
        parsed = raw ? JSON.parse(raw) : {};
      }

      const ids = Object.keys(facturas);

      if (ids.length === 0) {
        alert('No hay datos de Facturación para exportar.');
        return;
      }

      // Procesar registros de forma asíncrona para obtener datos de logística y tráfico
      const rowsPromises = ids.map(async id => {
        const factura = facturas[id];

        // Obtener datos de logística y tráfico
        let registroLogistica = null;
        let registroTrafico = null;

        // Intentar obtener desde logística
        if (window.obtenerRegistroLogistica) {
          registroLogistica = await window.obtenerRegistroLogistica(id);
        } else if (parsed && parsed.registros) {
          registroLogistica = parsed.registros[id];
        }

        // Intentar obtener desde tráfico
        if (window.obtenerRegistroTrafico) {
          registroTrafico = await window.obtenerRegistroTrafico(id);
        } else if (parsed && parsed.trafico) {
          registroTrafico = parsed.trafico[id];
        }

        // Obtener información del cliente
        const rfcCliente =
          registroLogistica?.rfcCliente ||
          registroLogistica?.RFC ||
          registroLogistica?.rfc ||
          factura?.rfcCliente ||
          factura?.cliente ||
          '';
        let clienteNombre = rfcCliente
          ? obtenerNombreCliente(rfcCliente)
          : factura.Cliente || factura.cliente || 'N/A';
        clienteNombre = corregirCodificacion(clienteNombre);

        // Obtener Referencia Cliente
        let referenciaCliente =
          registroLogistica?.referenciaCliente ||
          registroLogistica?.ReferenciaCliente ||
          registroLogistica?.['referencia cliente'] ||
          'N/A';
        referenciaCliente = corregirCodificacion(referenciaCliente);

        // Obtener estancias y mapear a "Estancia Principal" y "Estancia Norte"
        const estanciaOrigen =
          registroLogistica?.origen ||
          registroTrafico?.origen ||
          registroTrafico?.LugarOrigen ||
          'N/A';
        const estanciaDestino =
          registroLogistica?.destino ||
          registroTrafico?.destino ||
          registroTrafico?.LugarDestino ||
          'N/A';

        let estanciaPrincipal = 'N/A';
        let estanciaNorte = 'N/A';

        if (estanciaOrigen && estanciaOrigen !== 'N/A') {
          if (estanciaOrigen.toLowerCase().includes('principal')) {
            estanciaPrincipal = estanciaOrigen;
            estanciaNorte = estanciaDestino !== 'N/A' ? estanciaDestino : 'N/A';
          } else if (estanciaOrigen.toLowerCase().includes('norte')) {
            estanciaNorte = estanciaOrigen;
            estanciaPrincipal = estanciaDestino !== 'N/A' ? estanciaDestino : 'N/A';
          } else {
            estanciaPrincipal = estanciaOrigen;
            estanciaNorte = estanciaDestino !== 'N/A' ? estanciaDestino : 'N/A';
          }
        }

        estanciaPrincipal = corregirCodificacion(estanciaPrincipal);
        estanciaNorte = corregirCodificacion(estanciaNorte);

        // Obtener datos de facturación
        const subtotal = limpiarMoneda(factura.Subtotal || factura.subtotal || 0);
        const iva = limpiarMoneda(factura.iva || factura.IVA || 0);
        const ivaRetenido = limpiarMoneda(
          factura['iva retenido'] || factura.ivaRetenido || factura['IVA Retenido'] || 0
        );
        const isrRetenido = limpiarMoneda(
          factura['isr retenido'] || factura.isrRetenido || factura['ISR Retenido'] || 0
        );
        const otrosMontos = limpiarMoneda(
          factura['Otros Montos'] ||
            factura.otrosMontos ||
            factura['Otros Montos a Favor o Contra'] ||
            0
        );
        const total = limpiarMoneda(
          factura['total factura'] ||
            factura.totalFactura ||
            factura.montoTotal ||
            factura.total ||
            0
        );

        // Separar Serie y Folio
        let serie = factura.serie || '';
        serie = corregirCodificacion(serie);
        let folio = factura.folio || '';
        folio = corregirCodificacion(folio);

        // Obtener observaciones
        let observaciones =
          factura.descripcionFacturacion ||
          factura.observaciones ||
          factura.descripcionObservaciones ||
          '';
        observaciones = corregirCodificacion(observaciones);
        const hayObservaciones = observaciones && observaciones.trim() !== '' ? 'Sí' : 'No';
        const detalleObservaciones =
          observaciones && observaciones.trim() !== '' ? observaciones.trim() : '';

        // Formatear fecha de creación correctamente
        let fechaFactura = 'N/A';
        if (factura.fechaCreacion) {
          // Usar función de formateo si está disponible
          if (window.formatearFechaCreacionFacturacion) {
            fechaFactura = window.formatearFechaCreacionFacturacion(factura.fechaCreacion, false);
          } else {
            // Parsear fecha ISO o string
            const fecha = new Date(factura.fechaCreacion);
            if (!isNaN(fecha.getTime())) {
              // Formato DD/MM/YYYY
              const dia = String(fecha.getDate()).padStart(2, '0');
              const mes = String(fecha.getMonth() + 1).padStart(2, '0');
              const año = fecha.getFullYear();
              fechaFactura = `${dia}/${mes}/${año}`;
            }
          }
        } else if (factura.fechaFactura) {
          fechaFactura = factura.fechaFactura;
        } else if (factura.fecha) {
          fechaFactura = factura.fecha;
        }

        return {
          'N° Registro': id,
          'Fecha Factura': fechaFactura,
          Cliente: clienteNombre,
          RFC: corregirCodificacion(rfcCliente || 'N/A'),
          'Referencia Cliente': referenciaCliente,
          'Estancia Principal': estanciaPrincipal,
          'Estancia Norte': estanciaNorte,
          Serie: serie,
          Folio: folio,
          Moneda: corregirCodificacion(factura.moneda || factura.tipoMoneda || 'MXN'),
          'Tipo de Cambio': factura.tipoCambio || (factura.moneda === 'MXN' ? '0' : 'N/A'),
          Subtotal: subtotal,
          IVA: iva,
          'IVA Retenido': ivaRetenido,
          'ISR Retenido': isrRetenido,
          'Otros Montos': otrosMontos,
          Total: total,
          'Hay Observaciones': corregirCodificacion(hayObservaciones),
          'Detalle Observaciones': detalleObservaciones
        };
      });

      const rows = await Promise.all(rowsPromises);

      // Usar función base común
      await window.exportarDatosExcel({
        datos: rows,
        nombreArchivo: 'facturacion',
        nombreHoja: 'Facturacion',
        mensajeVacio: 'No hay datos de Facturación para exportar.'
      });
    } catch (error) {
      console.error('❌ Error en exportarFacturacionExcel:', error);
      alert(`Error al exportar: ${error.message}`);
    }
  };

  // Asegurar que la función esté disponible
  console.log(
    '✅ Función exportarFacturacionExcel definida:',
    typeof window.exportarFacturacionExcel
  );
})();
