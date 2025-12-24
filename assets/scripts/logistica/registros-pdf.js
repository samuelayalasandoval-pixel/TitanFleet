/**
 * Generación de PDF para Registros de Logística - logistica.html
 * Descarga de documentos PDF de registros
 */

(function () {
  'use strict';

  // ============================================================
  // FUNCIÓN: Descargar PDF de un registro
  // ============================================================
  window.descargarPDFLogistica = async function (regId) {
    console.log(`📄 Descargando PDF del registro de Logística: ${regId}`);

    const registro = await window.obtenerRegistroLogistica(regId);

    if (!registro) {
      alert('❌ Registro no encontrado');
      return;
    }

    function formatearFechaEnvio(fechaStr) {
      if (!fechaStr) {
        return 'N/A';
      }
      try {
        if (typeof fechaStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
          const [year, month, day] = fechaStr.split('T')[0].split('-');
          return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        }
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) {
          return 'N/A';
        }
        const day = String(fecha.getDate()).padStart(2, '0');
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const year = fecha.getFullYear();
        return `${day}/${month}/${year}`;
      } catch (error) {
        console.warn('⚠️ Error formateando fecha de envío:', fechaStr, error);
        return 'N/A';
      }
    }

    try {
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

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('REGISTRO DE LOGÍSTICA', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      doc.setFontSize(14);
      doc.text(`Número de Registro: ${regId}`, margin, yPosition);
      yPosition += 10;

      const fechaEnvio = registro.fechaEnvio ? formatearFechaEnvio(registro.fechaEnvio) : 'N/A';
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de Envío: ${fechaEnvio}`, margin, yPosition);
      yPosition += 15;

      doc.setDrawColor(0, 0, 0);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('INFORMACIÓN DEL CLIENTE', margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const rfcCliente =
        registro.rfcCliente || registro.RFC || registro.rfc || registro.cliente || '';
      const nombreCliente =
        obtenerClienteNombre(rfcCliente) ||
        registro.clienteNombre ||
        (rfcCliente && obtenerClienteNombre(rfcCliente) !== rfcCliente
          ? obtenerClienteNombre(rfcCliente)
          : 'N/A');

      doc.text(`Cliente: ${nombreCliente}`, margin + 5, yPosition);
      yPosition += 6;
      if (rfcCliente && rfcCliente !== nombreCliente) {
        doc.text(`RFC: ${rfcCliente}`, margin + 5, yPosition);
        yPosition += 6;
      }
      if (registro.referenciaCliente || registro.ReferenciaCliente) {
        doc.text(
          `Referencia Cliente: ${registro.referenciaCliente || registro.ReferenciaCliente}`,
          margin + 5,
          yPosition
        );
        yPosition += 6;
      }
      yPosition += 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('INFORMACIÓN DE RUTA', margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Origen: ${registro.origen || 'N/A'}`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Destino: ${registro.destino || 'N/A'}`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Tipo de Servicio: ${registro.tipoServicio || 'General'}`, margin + 5, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('INFORMACIÓN DE CARGA', margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(
        `Tipo de Plataforma: ${registro.plataforma || registro.tipoPlataforma || 'N/A'}`,
        margin + 5,
        yPosition
      );
      yPosition += 6;
      doc.text(
        `Tipo de Mercancía: ${registro.mercancia || registro.tipoMercancia || 'N/A'}`,
        margin + 5,
        yPosition
      );
      yPosition += 6;
      doc.text(`Peso: ${registro.peso || registro.pesoKg || 'N/A'} kg`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(
        `Dimensiones: ${registro.largo || registro.largoM || 'N/A'}m x ${registro.ancho || registro.anchoM || 'N/A'}m`,
        margin + 5,
        yPosition
      );
      yPosition += 6;
      doc.text(`Embalaje Especial: ${registro.embalajeEspecial || 'No'}`, margin + 5, yPosition);
      if (registro.descripcionEmbalaje) {
        yPosition += 6;
        doc.text(`Descripción Embalaje: ${registro.descripcionEmbalaje}`, margin + 5, yPosition);
      }
      yPosition += 10;

      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      const filename = `Logistica_${regId}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);

      console.log(`✅ PDF generado exitosamente: ${filename}`);
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      alert(`Error al generar el PDF: ${error.message}`);
    }
  };

  console.log('✅ Módulo registros-pdf.js cargado');
})();
