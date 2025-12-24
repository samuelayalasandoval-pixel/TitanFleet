/**
 * Generación de PDF para Registros de Facturación - facturacion.html
 * Descarga de documentos PDF de registros
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
   * Descargar PDF de un registro de facturación
   */
  window.descargarPDFFacturacion = async function (regId) {
    console.log(`📄 Descargando PDF del registro de Facturación: ${regId}`);

    const registro = await window.obtenerRegistroFacturacion(regId);

    if (!registro) {
      alert('❌ Registro no encontrado');
      return;
    }

    try {
      // Cargar jsPDF si no está disponible
      if (!window.jspdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      const margin = 20;
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.width;
      const col1X = margin + 5;
      const col2X = pageWidth / 2 + 10;

      // Título
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('REGISTRO DE FACTURACIÓN', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Número de registro
      doc.setFontSize(14);
      doc.text(`Número de Registro: ${regId}`, margin, yPosition);
      yPosition += 10;

      // Fecha - Usar fechaCreacion primero, luego fechaFactura como fallback
      let fechaCreacion = 'N/A';
      if (registro.fechaCreacion) {
        // Formatear fecha de creación correctamente
        if (window.formatearFechaCreacionFacturacion) {
          fechaCreacion = window.formatearFechaCreacionFacturacion(registro.fechaCreacion, false);
        } else {
          // Parsear fecha ISO o string
          const fecha = new Date(registro.fechaCreacion);
          if (!isNaN(fecha.getTime())) {
            fechaCreacion = fecha.toLocaleDateString('es-MX', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            });
          }
        }
      } else if (registro.fechaFactura) {
        fechaCreacion = registro.fechaFactura;
      } else if (registro.fecha) {
        fechaCreacion = registro.fecha;
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de Factura: ${fechaCreacion}`, margin, yPosition);
      yPosition += 15;

      // Línea separadora
      doc.setDrawColor(0, 0, 0);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Información del Cliente
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('INFORMACIÓN DEL CLIENTE', margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Obtener datos de logística y tráfico (con fallback a localStorage)
      let registroLogistica = null;
      let registroTrafico = null;

      // Buscar en Firebase primero
      if (window.obtenerRegistroLogistica) {
        try {
          registroLogistica = await window.obtenerRegistroLogistica(regId);
        } catch (e) {
          console.debug('ℹ️ No se pudo obtener logística desde función:', e);
        }
      }

      // Fallback: buscar en Firebase repos directamente
      if (!registroLogistica && window.firebaseRepos?.logistica) {
        try {
          registroLogistica = await window.firebaseRepos.logistica.get(regId);
        } catch (e) {
          console.debug('ℹ️ No se pudo obtener logística desde Firebase:', e);
        }
      }

      // Fallback: buscar en localStorage
      if (!registroLogistica) {
        try {
          const data = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
          const logistica = data.logistica || {};
          registroLogistica = logistica[regId];
        } catch (e) {
          console.debug('ℹ️ No se pudo obtener logística desde localStorage:', e);
        }
      }

      // Buscar tráfico en Firebase primero
      if (window.obtenerRegistroTrafico) {
        try {
          registroTrafico = await window.obtenerRegistroTrafico(regId);
        } catch (e) {
          console.debug('ℹ️ No se pudo obtener tráfico desde función:', e);
        }
      }

      // Fallback: buscar en Firebase repos directamente
      if (!registroTrafico && window.firebaseRepos?.trafico) {
        try {
          registroTrafico = await window.firebaseRepos.trafico.get(regId);
        } catch (e) {
          console.debug('ℹ️ No se pudo obtener tráfico desde Firebase:', e);
        }
      }

      // Fallback: buscar en localStorage
      if (!registroTrafico) {
        try {
          const data = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
          const trafico = data.trafico || {};
          registroTrafico = trafico[regId];
        } catch (e) {
          console.debug('ℹ️ No se pudo obtener tráfico desde localStorage:', e);
        }
      }

      // Obtener RFC del cliente (búsqueda exhaustiva)
      let rfcCliente = registro.rfcCliente || registro.RFC || registro.rfc || '';
      if (!rfcCliente && registroLogistica) {
        rfcCliente =
          registroLogistica.rfcCliente ||
          registroLogistica.RFC ||
          registroLogistica.rfc ||
          registroLogistica['RFC Cliente'] ||
          registroLogistica['RFC Cliente Logistica'] ||
          '';
      }
      if (!rfcCliente && registroTrafico) {
        rfcCliente =
          registroTrafico.rfcCliente ||
          registroTrafico.RFC ||
          registroTrafico.rfc ||
          registroTrafico['RFC Cliente'] ||
          '';
      }

      // Obtener nombre del cliente
      let nombreCliente = registro.cliente || registro.Cliente || 'N/A';

      if (rfcCliente) {
        try {
          let clienteData = null;

          // Buscar en configuracionManager
          if (
            window.configuracionManager &&
            typeof window.configuracionManager.getCliente === 'function'
          ) {
            clienteData = window.configuracionManager.getCliente(rfcCliente);
          }

          // Fallback: buscar en localStorage
          if (!clienteData) {
            const clientesData = localStorage.getItem('erp_clientes');
            if (clientesData) {
              const clientes = JSON.parse(clientesData);
              if (Array.isArray(clientes)) {
                clienteData = clientes.find(c => (c.rfc || c.RFC) === rfcCliente);
              } else {
                clienteData = clientes[rfcCliente];
              }
            }
          }

          if (clienteData) {
            nombreCliente =
              clienteData.nombre ||
              clienteData.Nombre ||
              clienteData.nombreCliente ||
              clienteData.razonSocial ||
              nombreCliente;
          }
        } catch (e) {
          console.warn('⚠️ Error obteniendo nombre del cliente:', e);
        }
      }

      // Si no encontramos nombre por RFC, buscar por nombre en el registro
      if (nombreCliente === 'N/A' && registro.cliente) {
        nombreCliente = registro.cliente;
      }

      // Obtener Referencia Cliente (búsqueda exhaustiva)
      let referenciaCliente =
        registro.referenciaCliente ||
        registro.ReferenciaCliente ||
        registro['referencia cliente'] ||
        registro['Referencia Cliente'] ||
        '';

      if (!referenciaCliente && registroLogistica) {
        referenciaCliente =
          registroLogistica.referenciaCliente ||
          registroLogistica.ReferenciaCliente ||
          registroLogistica['referencia cliente'] ||
          registroLogistica['Referencia Cliente'] ||
          registroLogistica.referenciaClienteLogistica ||
          registroLogistica['Referencia Cliente'] ||
          registroLogistica['referenciaClienteLogistica'] ||
          '';
      }

      if (!referenciaCliente && registroTrafico) {
        referenciaCliente =
          registroTrafico.referenciaCliente ||
          registroTrafico.ReferenciaCliente ||
          registroTrafico['referencia cliente'] ||
          registroTrafico['Referencia Cliente'] ||
          '';
      }

      // Obtener lugares de origen y destino
      const lugarOrigen =
        registroTrafico?.LugarOrigen ||
        registroTrafico?.lugarOrigen ||
        registroTrafico?.origen ||
        registroLogistica?.origen ||
        registroLogistica?.LugarOrigen ||
        '';

      const lugarDestino =
        registroTrafico?.LugarDestino ||
        registroTrafico?.lugarDestino ||
        registroTrafico?.destino ||
        registroLogistica?.destino ||
        registroLogistica?.LugarDestino ||
        '';

      // Obtener información de tráfico
      const economico =
        registroTrafico?.economico ||
        registroTrafico?.numeroEconomico ||
        registroTrafico?.Economico ||
        registroTrafico?.economicoTractocamion ||
        '';

      const placas =
        registroTrafico?.Placas ||
        registroTrafico?.placas ||
        registroTrafico?.placasTractocamion ||
        '';

      // Obtener operadores (pueden estar en tráfico o en operadores)
      let operadorPrincipal =
        registroTrafico?.operadorprincipal ||
        registroTrafico?.operadorPrincipal ||
        registroTrafico?.OperadorPrincipal ||
        '';

      let operadorSecundario =
        registroTrafico?.operadorsecundario ||
        registroTrafico?.operadorSecundario ||
        registroTrafico?.OperadorSecundario ||
        '';

      // Si no encontramos operadores en tráfico, buscar en operadores por licencia
      if (!operadorPrincipal || !operadorSecundario) {
        try {
          const licenciaPrincipal = registroTrafico?.Licencia || registroTrafico?.licencia || '';
          const licenciaSecundaria =
            registroTrafico?.LicenciaSecundaria || registroTrafico?.licenciaSecundaria || '';

          if (
            window.configuracionManager &&
            typeof window.configuracionManager.getAllOperadores === 'function'
          ) {
            const operadores = await window.configuracionManager.getAllOperadores();

            if (licenciaPrincipal && !operadorPrincipal) {
              const op = operadores.find(o => (o.licencia || o.Licencia) === licenciaPrincipal);
              if (op) {
                operadorPrincipal = op.nombre || op.Nombre || operadorPrincipal;
              }
            }

            if (licenciaSecundaria && !operadorSecundario) {
              const op = operadores.find(o => (o.licencia || o.Licencia) === licenciaSecundaria);
              if (op) {
                operadorSecundario = op.nombre || op.Nombre || operadorSecundario;
              }
            }
          } else {
            // Fallback: buscar en localStorage
            const operadoresData = localStorage.getItem('erp_operadores');
            if (operadoresData) {
              const operadores = JSON.parse(operadoresData);
              const opsArray = Array.isArray(operadores) ? operadores : Object.values(operadores);

              if (licenciaPrincipal && !operadorPrincipal) {
                const op = opsArray.find(o => (o.licencia || o.Licencia) === licenciaPrincipal);
                if (op) {
                  operadorPrincipal = op.nombre || op.Nombre || operadorPrincipal;
                }
              }

              if (licenciaSecundaria && !operadorSecundario) {
                const op = opsArray.find(o => (o.licencia || o.Licencia) === licenciaSecundaria);
                if (op) {
                  operadorSecundario = op.nombre || op.Nombre || operadorSecundario;
                }
              }
            }
          }
        } catch (e) {
          console.warn('⚠️ Error obteniendo operadores:', e);
        }
      }

      // Columna izquierda - Información específica
      let yPositionIzq = yPosition;
      doc.text(`Cliente: ${nombreCliente}`, col1X, yPositionIzq);
      yPositionIzq += 6;

      doc.text(`Referencia Cliente: ${referenciaCliente || 'N/A'}`, col1X, yPositionIzq);
      yPositionIzq += 6;

      doc.text(`RFC: ${rfcCliente || 'N/A'}`, col1X, yPositionIzq);
      yPositionIzq += 6;

      if (registroLogistica?.tipoServicio) {
        doc.text(`Tipo de Servicio: ${registroLogistica.tipoServicio}`, col1X, yPositionIzq);
        yPositionIzq += 6;
      }

      doc.text(`Lugar de Origen: ${lugarOrigen || 'N/A'}`, col1X, yPositionIzq);
      yPositionIzq += 6;

      doc.text(`Lugar de Destino: ${lugarDestino || 'N/A'}`, col1X, yPositionIzq);
      yPositionIzq += 6;

      // Columna derecha - Información de Tráfico
      let yPositionDer = yPosition;
      doc.text(`Económico/Tractocamion: ${economico || 'N/A'}`, col2X, yPositionDer);
      yPositionDer += 6;

      doc.text(`Placas: ${placas || 'N/A'}`, col2X, yPositionDer);
      yPositionDer += 6;

      doc.text(`Operador Principal: ${operadorPrincipal || 'N/A'}`, col2X, yPositionDer);
      yPositionDer += 6;

      doc.text(`Operador Secundario: ${operadorSecundario || 'N/A'}`, col2X, yPositionDer);
      yPositionDer += 6;

      yPosition = Math.max(yPositionIzq, yPositionDer) + 5;

      // Información de Facturación
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('INFORMACIÓN DE FACTURACIÓN', margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const serie = registro.serie || 'N/A';
      const folio = registro.folio || 'N/A';
      const folioFiscal =
        registro['Folio Fiscal'] || registro.folioFiscal || registro.folioFiscalUUID || 'N/A';
      const moneda = registro.moneda || registro.tipoMoneda || 'MXN';
      const tipoCambio = registro.tipoCambio || (moneda === 'MXN' ? '0' : 'N/A');

      doc.text(`Serie: ${serie}`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Folio: ${folio}`, margin + 5, yPosition);
      yPosition += 6;
      if (folioFiscal !== 'N/A') {
        doc.text(`Folio Fiscal (UUID): ${folioFiscal}`, margin + 5, yPosition);
        yPosition += 6;
      }
      doc.text(`Moneda: ${moneda}`, margin + 5, yPosition);
      yPosition += 6;
      if (moneda !== 'MXN') {
        doc.text(`Tipo de Cambio: ${tipoCambio}`, margin + 5, yPosition);
        yPosition += 6;
      }
      yPosition += 5;

      // Montos
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('DETALLE DE MONTOS', margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const subtotal = limpiarMoneda(registro.Subtotal || registro.subtotal || 0);
      const iva = limpiarMoneda(registro.iva || registro.IVA || 0);
      const ivaRetenido = limpiarMoneda(registro['iva retenido'] || registro.ivaRetenido || 0);
      const isrRetenido = limpiarMoneda(registro['isr retenido'] || registro.isrRetenido || 0);
      const otrosMontos = limpiarMoneda(registro['Otros Montos'] || registro.otrosMontos || 0);
      const total = limpiarMoneda(
        registro['total factura'] ||
          registro.totalFactura ||
          registro.montoTotal ||
          registro.total ||
          0
      );

      doc.text(
        `Subtotal: $${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        margin + 5,
        yPosition
      );
      yPosition += 6;
      doc.text(
        `IVA: $${iva.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        margin + 5,
        yPosition
      );
      yPosition += 6;
      doc.text(
        `IVA Retenido: $${ivaRetenido.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        margin + 5,
        yPosition
      );
      yPosition += 6;
      doc.text(
        `ISR Retenido: $${isrRetenido.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        margin + 5,
        yPosition
      );
      yPosition += 6;
      doc.text(
        `Otros Montos: $${otrosMontos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        margin + 5,
        yPosition
      );
      yPosition += 6;

      doc.setFont('helvetica', 'bold');
      doc.text(
        `Total: $${total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        margin + 5,
        yPosition
      );
      yPosition += 10;

      // Observaciones si existen
      const observaciones =
        registro.descripcionFacturacion ||
        registro.observaciones ||
        registro.descripcionObservaciones ||
        '';
      if (observaciones && observaciones.trim() !== '') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('OBSERVACIONES', margin, yPosition);
        yPosition += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const observacionesLines = doc.splitTextToSize(observaciones, pageWidth - 2 * margin - 10);
        doc.text(observacionesLines, margin + 5, yPosition);
        yPosition += observacionesLines.length * 6;
      }

      // Pie de página
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      // Descargar PDF
      const filename = `Facturacion_${regId}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);

      console.log(`✅ PDF generado exitosamente: ${filename}`);
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      alert(`Error al generar el PDF: ${error.message}`);
    }
  };

  console.log('✅ Módulo registros-pdf.js cargado');
})();
