// ===== Sistema de Impresión PDF Global =====

class PrintPDFManager {
  constructor() {
    this.defaultOptions = {
      margin: 10,
      filename: 'documento.pdf',
      image: { type: 'png', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
  }

  // Función principal para imprimir cualquier página
  async printPage(options = {}) {
    try {
      const config = { ...this.defaultOptions, ...options };

      // Obtener el contenido a imprimir
      const element = config.element || document.body;
      const filename = config.filename || this.generateFilename();

      console.log('🖨️ Iniciando impresión PDF...');
      console.log('📄 Elemento a imprimir:', element);
      console.log('📁 Nombre de archivo:', filename);

      // Verificar que el elemento existe
      if (!element) {
        throw new Error('No se encontró el elemento a imprimir');
      }

      // Preparar el contenido para evitar errores
      this.prepareContentForPrint();

      // Importar html2pdf dinámicamente
      console.log('📦 Cargando html2pdf...');
      await this.loadHtml2Pdf();
      console.log('✅ html2pdf cargado correctamente');

      // Configuración de alta calidad para PDFs nítidos
      const simpleOpt = {
        margin: 10,
        filename: filename,
        image: { type: 'jpeg', quality: 0.95 }, // Mayor calidad
        html2canvas: {
          scale: 2, // Escala mayor para mejor resolución
          useCORS: false,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          width: 1200, // Ancho mayor
          height: 1600, // Alto mayor
          dpi: 300, // DPI alto para mejor calidad
          letterRendering: true, // Mejor renderizado de texto
          ignoreElements: element =>
            // Solo ignorar elementos realmente problemáticos
            element.tagName === 'IMG' ||
            element.tagName === 'SVG' ||
            element.tagName === 'CANVAS' ||
            element.tagName === 'VIDEO' ||
            element.tagName === 'AUDIO' ||
            element.classList.contains('no-print') ||
            element.tagName === 'BUTTON' ||
            element.classList.contains('btn') ||
            element.classList.contains('sidebar') ||
            element.classList.contains('navbar') ||
            element.classList.contains('page-header') ||
            element.classList.contains('card-header')
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: false // Sin compresión para mejor calidad
        }
      };

      console.log('⚙️ Configuración:', simpleOpt);

      // Usar directamente el método alternativo estructurado para mejor calidad
      console.log('🔄 Generando PDF con método estructurado...');
      await this.alternativeJSPDFMethod(element, filename);
      console.log('✅ PDF generado exitosamente:', filename);
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      console.error('❌ Stack trace:', error.stack);
      this.showNotification(`Error al generar PDF: ${error.message}`, 'error');

      // Intentar método de fallback con window.print()
      console.log('🔄 Intentando método de fallback...');
      this.fallbackPrint();
    } finally {
      // Limpiar estilos después de la impresión
      this.cleanupPrintStyles();
    }
  }

  // Cargar html2pdf dinámicamente
  async loadHtml2Pdf() {
    if (window.html2pdf) {
      console.log('✅ html2pdf ya está cargado');
      return window.html2pdf;
    }

    console.log('📦 Cargando html2pdf desde CDN...');

    // Crear script dinámicamente
    return new Promise((resolve, reject) => {
      // Verificar si ya existe el script
      const existingScript = document.querySelector('script[src*="html2pdf"]');
      if (existingScript) {
        console.log('⚠️ Script html2pdf ya existe, esperando...');
        setTimeout(() => {
          if (window.html2pdf) {
            resolve(window.html2pdf);
          } else {
            reject(new Error('html2pdf no se pudo cargar desde script existente'));
          }
        }, 1000);
        return;
      }

      const script = document.createElement('script');
      // Usar una versión más antigua y estable
      script.src =
        'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.3/html2pdf.bundle.min.js';
      script.crossOrigin = 'anonymous';

      script.onload = () => {
        console.log('📦 Script html2pdf cargado');
        setTimeout(() => {
          if (window.html2pdf) {
            console.log('✅ html2pdf disponible');
            resolve(window.html2pdf);
          } else {
            console.error('❌ html2pdf no disponible después de cargar');
            reject(new Error('html2pdf no se pudo cargar'));
          }
        }, 500);
      };

      script.onerror = error => {
        console.error('❌ Error cargando script html2pdf:', error);
        reject(new Error('Error cargando html2pdf desde CDN'));
      };

      document.head.appendChild(script);
      console.log('📦 Script html2pdf agregado al DOM');
    });
  }

  // Generar nombre de archivo automático
  generateFilename() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const pageTitle = document.title.replace('ERP Rankiao - ', '');
    return `${pageTitle}_${dateStr}_${timeStr}.pdf`;
  }

  // Imprimir tabla específica
  async printTable(tableId, title = '') {
    const table = document.getElementById(tableId);
    if (!table) {
      this.showNotification('Tabla no encontrada', 'error');
      return;
    }

    const filename = title ? `${title}.pdf` : this.generateFilename();
    await this.printPage({
      element: table,
      filename: filename,
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    });
  }

  // Imprimir formulario específico
  async printForm(formId, title = '') {
    const form = document.getElementById(formId);
    if (!form) {
      this.showNotification('Formulario no encontrado', 'error');
      return;
    }

    const filename = title ? `${title}.pdf` : this.generateFilename();
    await this.printPage({
      element: form,
      filename: filename
    });
  }

  // Imprimir página completa
  async printFullPage(title = '') {
    const filename = title ? `${title}.pdf` : this.generateFilename();

    // Preparar el contenido para impresión
    this.prepareContentForPrint();

    await this.printPage({
      element: document.body,
      filename: filename
    });
  }

  // Preparar contenido para impresión
  prepareContentForPrint() {
    try {
      // Crear estilos de impresión compactos
      this.addCompactPrintStyles();

      // Ocultar elementos que no deben imprimirse (pero mantener datos importantes)
      const elementsToHide = document.querySelectorAll(
        '.no-print, .btn, button, .sidebar, .navbar, .alert, .modal, .dropdown, .tooltip, .page-header'
      );
      elementsToHide.forEach(el => {
        el.style.display = 'none';
      });

      // Ocultar controles de formulario pero mantener los valores
      const formControls = document.querySelectorAll(
        '.form-control, .form-select, input, select, textarea'
      );
      formControls.forEach(el => {
        let value = '';

        // Obtener el valor según el tipo de elemento
        if (el.tagName === 'SELECT') {
          const selectedOption = el.options[el.selectedIndex];
          value = selectedOption ? selectedOption.textContent : '';
        } else if (el.type === 'checkbox' || el.type === 'radio') {
          value = el.checked ? el.value || 'Sí' : 'No';
        } else if (el.type === 'date') {
          value = el.value ? new Date(el.value).toLocaleDateString() : '';
        } else if (el.type === 'number') {
          value = el.value ? parseFloat(el.value).toLocaleString() : '';
        } else {
          value = el.value || el.textContent || '';
        }

        if (value.trim()) {
          // Crear un span con el valor para mostrar en el PDF
          const valueSpan = document.createElement('span');
          valueSpan.textContent = value;
          valueSpan.className = 'print-value';
          valueSpan.style.cssText =
            'display: inline-block; padding: 2px 4px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 2px; font-size: 9px; margin: 1px; min-width: 50px;';

          // Insertar el valor antes del control y ocultar el control
          el.parentNode.insertBefore(valueSpan, el);
          el.style.display = 'none';
        } else {
          el.style.display = 'none';
        }
      });

      // Remover elementos problemáticos completamente
      const elementsToRemove = document.querySelectorAll(
        'script, style[data-temp], .temp-print-element, .accordion-button, .nav-tabs, .pagination, img, svg, canvas, video, audio'
      );
      elementsToRemove.forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });

      // Mantener colores pero remover solo backgrounds problemáticos
      const elementsWithBackgrounds = document.querySelectorAll('*');
      elementsWithBackgrounds.forEach(el => {
        // Solo remover background-image, mantener colores sólidos
        if (el.style.backgroundImage && el.style.backgroundImage !== 'none') {
          el.style.backgroundImage = 'none';
        }
        // Mantener colores de fondo sólidos para mejor apariencia
        if (el.style.background && el.style.background.includes('url(')) {
          el.style.background = '#ffffff';
        }
      });

      // Aplicar estilos compactos a elementos específicos
      this.applyCompactStyles();

      // Remover eventos que pueden interferir
      const elementsWithEvents = document.querySelectorAll('[onclick], [onload], [onchange]');
      elementsWithEvents.forEach(el => {
        el.removeAttribute('onclick');
        el.removeAttribute('onload');
        el.removeAttribute('onchange');
      });
    } catch (error) {
      console.warn('⚠️ Error preparando contenido para impresión:', error);
    }
  }

  // Agregar estilos compactos para impresión
  addCompactPrintStyles() {
    const existingStyle = document.getElementById('compact-print-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'compact-print-styles';
    style.textContent = `
      /* Estilos compactos para impresión */
      .print-compact {
        font-size: 11px !important;
        line-height: 1.3 !important;
        margin: 0 !important;
        padding: 3px !important;
        color: #333 !important;
      }
      
      .print-compact h1, .print-compact h2, .print-compact h3 {
        font-size: 12px !important;
        margin: 2px 0 !important;
        padding: 1px 0 !important;
      }
      
      .print-compact h4, .print-compact h5, .print-compact h6 {
        font-size: 11px !important;
        margin: 1px 0 !important;
        padding: 1px 0 !important;
      }
      
      .print-compact table {
        font-size: 9px !important;
        border-collapse: collapse !important;
        width: 100% !important;
        margin: 1px 0 !important;
      }
      
      .print-compact th, .print-compact td {
        padding: 1px 2px !important;
        border: 1px solid #ccc !important;
        font-size: 9px !important;
        line-height: 1.1 !important;
      }
      
      .print-compact .card {
        border: 1px solid #ccc !important;
        margin: 1px 0 !important;
        padding: 2px !important;
        box-shadow: none !important;
      }
      
      .print-compact .row {
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .print-compact .col-md-6, .print-compact .col-md-4, .print-compact .col-md-3 {
        padding: 1px !important;
        margin: 0 !important;
      }
      
      .print-compact .form-label {
        font-size: 9px !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .print-compact .badge {
        font-size: 8px !important;
        padding: 1px 2px !important;
      }
      
      .print-compact .alert {
        font-size: 9px !important;
        padding: 2px !important;
        margin: 1px 0 !important;
      }
      
      .print-compact img {
        max-width: 50px !important;
        max-height: 30px !important;
      }
      
      .print-compact .container-fluid {
        padding: 2px !important;
        margin: 0 !important;
      }
      
      .print-compact .content-wrapper {
        padding: 2px !important;
        margin: 0 !important;
      }
      
      .print-compact .print-value {
        display: inline-block !important;
        padding: 2px 4px !important;
        background: #f8f9fa !important;
        border: 1px solid #dee2e6 !important;
        border-radius: 2px !important;
        font-size: 9px !important;
        margin: 1px !important;
        min-width: 50px !important;
        font-weight: bold !important;
      }
      
      .print-compact .form-label {
        font-weight: bold !important;
        color: #333 !important;
      }
      
      .print-compact .card-body {
        padding: 4px !important;
        margin: 0 !important;
      }
      
      .print-compact .row {
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .print-compact .col-md-6, .print-compact .col-md-4, .print-compact .col-md-3, .print-compact .col-md-12 {
        padding: 1px !important;
        margin: 0 !important;
        display: inline-block !important;
        width: auto !important;
        margin-right: 10px !important;
      }
    `;

    document.head.appendChild(style);
  }

  // Aplicar estilos compactos
  applyCompactStyles() {
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      // Aplicar clase compacta
      el.classList.add('print-compact');

      // Remover solo estilos problemáticos, mantener colores y bordes
      el.style.position = '';
      el.style.transform = '';
      el.style.filter = '';
      el.style.boxShadow = '';
      el.style.backgroundImage = '';
      el.style.backgroundAttachment = '';
      el.style.backgroundSize = '';
      el.style.backgroundPosition = '';
      el.style.backgroundRepeat = '';
      // Mantener margin y padding para mejor espaciado
      // el.style.margin = '';
      // el.style.padding = '';

      // Optimizar tablas
      if (el.tagName === 'TABLE') {
        el.style.width = '100%';
        el.style.tableLayout = 'fixed';
        el.style.fontSize = '9px';
        el.style.borderCollapse = 'collapse';
      }

      // Optimizar imágenes
      if (el.tagName === 'IMG') {
        el.style.maxWidth = '50px';
        el.style.maxHeight = '30px';
        el.style.objectFit = 'contain';
      }

      // Optimizar contenedores
      if (el.classList.contains('container') || el.classList.contains('container-fluid')) {
        el.style.padding = '2px';
        el.style.margin = '0';
      }
    });
  }

  // Método alternativo más confiable
  async alternativePrintMethod(element, filename) {
    try {
      console.log('🔄 Usando método alternativo de impresión...');

      // Crear un contenedor temporal con solo el contenido esencial
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: 800px;
        background: white;
        padding: 20px;
        font-family: Arial, sans-serif;
      `;

      // Clonar solo el contenido esencial
      const contentClone = element.cloneNode(true);

      // Remover elementos problemáticos del clon
      const elementsToRemove = contentClone.querySelectorAll(
        '.no-print, .btn, button, .sidebar, .navbar, .alert, .modal, .page-header'
      );
      elementsToRemove.forEach(el => el.remove());

      // Procesar controles de formulario en el clon
      const formControls = contentClone.querySelectorAll(
        '.form-control, .form-select, input, select, textarea'
      );
      formControls.forEach(el => {
        let value = '';

        // Obtener el valor según el tipo de elemento
        if (el.tagName === 'SELECT') {
          const selectedOption = el.options[el.selectedIndex];
          value = selectedOption ? selectedOption.textContent : '';
        } else if (el.type === 'checkbox' || el.type === 'radio') {
          value = el.checked ? el.value || 'Sí' : 'No';
        } else if (el.type === 'date') {
          value = el.value ? new Date(el.value).toLocaleDateString() : '';
        } else if (el.type === 'number') {
          value = el.value ? parseFloat(el.value).toLocaleString() : '';
        } else {
          value = el.value || el.textContent || '';
        }

        if (value.trim()) {
          // Crear un span con el valor para mostrar en el PDF
          const valueSpan = document.createElement('span');
          valueSpan.textContent = value;
          valueSpan.className = 'print-value';
          valueSpan.style.cssText =
            'display: inline-block; padding: 2px 4px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 2px; font-size: 9px; margin: 1px; min-width: 50px; font-weight: bold;';

          // Insertar el valor antes del control y ocultar el control
          el.parentNode.insertBefore(valueSpan, el);
          el.remove();
        } else {
          el.remove();
        }
      });

      // Limpiar estilos problemáticos
      const allElements = contentClone.querySelectorAll('*');
      allElements.forEach(el => {
        // Remover estilos que pueden causar problemas
        el.style.position = '';
        el.style.transform = '';
        el.style.filter = '';
        el.style.boxShadow = '';
        el.style.borderRadius = '';

        // Asegurar que las imágenes tengan dimensiones
        if (el.tagName === 'IMG') {
          el.style.maxWidth = '100%';
          el.style.height = 'auto';
        }
      });

      tempContainer.appendChild(contentClone);
      document.body.appendChild(tempContainer);

      // Usar html2pdf con el contenedor limpio y configuración compacta
      const html2pdf = await this.loadHtml2Pdf();
      const opt = {
        margin: [5, 5, 5, 5], // Márgenes mínimos
        filename: filename,
        image: { type: 'jpeg', quality: 0.6 },
        html2canvas: {
          scale: 0.8, // Escala reducida
          useCORS: false,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          width: 1200,
          height: 1600
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: true
        }
      };

      await html2pdf().set(opt).from(tempContainer).save();

      // Limpiar
      document.body.removeChild(tempContainer);

      console.log('✅ PDF generado con método alternativo:', filename);
      this.showNotification('PDF generado exitosamente', 'success');
    } catch (error) {
      console.error('❌ Error en método alternativo:', error);
      this.fallbackPrint();
    }
  }

  // Limpiar estilos de impresión
  cleanupPrintStyles() {
    try {
      // Remover estilos compactos
      const compactStyle = document.getElementById('compact-print-styles');
      if (compactStyle) {
        compactStyle.remove();
      }

      // Remover clases compactas
      const elementsWithCompact = document.querySelectorAll('.print-compact');
      elementsWithCompact.forEach(el => {
        el.classList.remove('print-compact');
      });

      // Remover valores de impresión temporales
      const printValues = document.querySelectorAll('.print-value');
      printValues.forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });

      // Restaurar elementos ocultos
      const hiddenElements = document.querySelectorAll('[style*="display: none"]');
      hiddenElements.forEach(el => {
        if (el.style.display === 'none') {
          // Restaurar controles de formulario
          if (
            el.classList.contains('form-control') ||
            el.classList.contains('form-select') ||
            el.tagName === 'INPUT' ||
            el.tagName === 'SELECT' ||
            el.tagName === 'TEXTAREA'
          ) {
            el.style.display = '';
          }
          // Restaurar botones y elementos de navegación
          else if (
            el.classList.contains('btn') ||
            el.classList.contains('button') ||
            el.classList.contains('sidebar') ||
            el.classList.contains('navbar') ||
            el.classList.contains('no-print') ||
            el.classList.contains('page-header')
          ) {
            el.style.display = '';
          }
        }
      });
    } catch (error) {
      console.warn('⚠️ Error limpiando estilos de impresión:', error);
    }
  }

  // Método de fallback usando window.print()
  fallbackPrint() {
    try {
      console.log('🔄 Intentando impresión nativa del navegador...');

      // Crear estilos para impresión
      const printStyles = document.createElement('style');
      printStyles.textContent = `
        @media print {
          body * { visibility: hidden; }
          .printable, .printable * { visibility: visible; }
          .printable { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .btn, button { display: none !important; }
          img, svg, canvas { display: none !important; }
        }
      `;
      document.head.appendChild(printStyles);

      // Marcar el contenido como imprimible
      const content = document.body;
      content.classList.add('printable');

      // Imprimir
      window.print();

      // Limpiar después de imprimir
      setTimeout(() => {
        content.classList.remove('printable');
        if (document.head.contains(printStyles)) {
          document.head.removeChild(printStyles);
        }
      }, 1000);

      this.showNotification('Abriendo diálogo de impresión del navegador', 'info');
    } catch (fallbackError) {
      console.error('❌ Error en impresión de fallback:', fallbackError);
      this.showNotification(
        'No se pudo generar el PDF. Intente usar Ctrl+P para imprimir.',
        'error'
      );
    }
  }

  // Método alternativo usando jsPDF directamente con formato estructurado
  async alternativeJSPDFMethod(element, filename) {
    try {
      console.log('🔄 Intentando método alternativo con jsPDF estructurado...');

      // Cargar jsPDF directamente
      const jsPDFScript = document.createElement('script');
      jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

      return new Promise((resolve, reject) => {
        jsPDFScript.onload = () => {
          try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Extraer datos estructurados del elemento
            const structuredData = this.extractStructuredData(element);

            // Configurar fuente y colores
            doc.setFont('helvetica');
            doc.setFontSize(12);

            let yPosition = 20;
            const pageHeight = 280;
            const margin = 20;

            // Título
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(`REPORTE ERP - ${new Date().toLocaleDateString()}`, margin, yPosition);
            yPosition += 15;

            // Línea separadora
            doc.setDrawColor(0, 0, 0);
            doc.line(margin, yPosition, 190, yPosition);
            yPosition += 10;

            // Contenido estructurado
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            structuredData.forEach((section, _sectionIndex) => {
              // Verificar si necesitamos nueva página
              if (yPosition > pageHeight - 20) {
                doc.addPage();
                yPosition = 20;
              }

              // Título de sección
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(11);
              doc.text(section.title, margin, yPosition);
              yPosition += 8;

              // Contenido de la sección
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(9);

              section.content.forEach((item, _itemIndex) => {
                if (yPosition > pageHeight - 15) {
                  doc.addPage();
                  yPosition = 20;
                }

                if (typeof item === 'string') {
                  const lines = doc.splitTextToSize(item, 170);
                  lines.forEach(line => {
                    if (yPosition > pageHeight - 15) {
                      doc.addPage();
                      yPosition = 20;
                    }
                    doc.text(line, margin + 5, yPosition);
                    yPosition += 5;
                  });
                } else if (item.label && item.value) {
                  const text = `${item.label}: ${item.value}`;
                  const lines = doc.splitTextToSize(text, 170);
                  lines.forEach(line => {
                    if (yPosition > pageHeight - 15) {
                      doc.addPage();
                      yPosition = 20;
                    }
                    doc.text(line, margin + 5, yPosition);
                    yPosition += 5;
                  });
                }
                yPosition += 2;
              });

              yPosition += 5;
            });

            // Guardar PDF
            doc.save(filename);

            this.showNotification('PDF generado con método alternativo estructurado', 'success');
            resolve();
          } catch (error) {
            console.error('❌ Error con jsPDF:', error);
            reject(error);
          }
        };

        jsPDFScript.onerror = () => {
          reject(new Error('No se pudo cargar jsPDF'));
        };

        document.head.appendChild(jsPDFScript);
      });
    } catch (error) {
      console.error('❌ Error en método alternativo jsPDF:', error);
      throw error;
    }
  }

  // Extraer datos estructurados del elemento
  extractStructuredData(element) {
    const data = [];
    const processedValues = new Set(); // Para evitar duplicados

    // Extraer información de formularios principales
    const mainForms = element.querySelectorAll('form, .card-body, .section');
    mainForms.forEach((form, index) => {
      const section = {
        title: `Sección ${index + 1}`,
        content: []
      };

      // Buscar título de la sección
      const title = form.querySelector(
        'h1, h2, h3, h4, h5, h6, .card-title, .section-title, .form-section h4'
      );
      if (title) {
        section.title = title.textContent.trim();
      }

      // Extraer solo campos de formulario con valores
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        if (input.type !== 'hidden' && input.value && input.value.trim() !== '') {
          const label = this.findLabelForInput(input);
          const labelText = label || input.name || input.id || 'Campo';
          let value = input.value.trim();

          // Limpiar valores específicos
          if (
            labelText.toLowerCase().includes('cliente') &&
            !labelText.toLowerCase().includes('rfc')
          ) {
            // Para el campo Cliente, intentar obtener el texto de la opción seleccionada
            if (input.tagName === 'SELECT') {
              const selectedOption = input.options[input.selectedIndex];
              if (selectedOption && selectedOption.textContent) {
                value = selectedOption.textContent.trim();
                // Si el texto contiene el RFC, intentar extraer solo el nombre
                if (value.includes(' - ')) {
                  const parts = value.split(' - ');
                  if (parts.length > 1) {
                    value = parts[0].trim(); // Tomar solo la primera parte (nombre)
                  }
                }
              }
            }
          }

          // Crear clave única para evitar duplicados
          const uniqueKey = `${labelText}:${value}`;

          if (!processedValues.has(uniqueKey)) {
            processedValues.add(uniqueKey);
            section.content.push({
              label: labelText,
              value: value
            });
          }
        }
      });

      // Extraer solo texto relevante (evitar duplicados y texto innecesario)
      const textElements = form.querySelectorAll('p, .form-text, .text-muted');
      textElements.forEach(el => {
        const text = el.textContent.trim();
        // Filtrar texto relevante
        if (
          text &&
          text.length > 5 &&
          text.length < 100 &&
          !text.includes('%') && // Evitar porcentajes
          !text.includes('Progreso') && // Evitar progreso
          !text.includes('Seleccione') && // Evitar placeholders
          !text.includes('Por favor') && // Evitar mensajes de ayuda
          !text.includes('Los datos se llenarán') && // Evitar mensajes automáticos
          !text.match(/^(Sí|No):\s*(si|no)$/i) && // Evitar "Sí: si", "No: no"
          !text.includes('automáticamente') && // Evitar mensajes automáticos
          !processedValues.has(text)
        ) {
          processedValues.add(text);
          section.content.push(text);
        }
      });

      if (section.content.length > 0) {
        data.push(section);
      }
    });

    // Si no hay secciones, extraer contenido principal
    if (data.length === 0) {
      const mainContent = this.extractMainContent(element);
      if (mainContent.length > 0) {
        data.push({
          title: 'Contenido Principal',
          content: mainContent
        });
      }
    }

    return data;
  }

  // Extraer contenido principal sin duplicados
  extractMainContent(element) {
    const content = [];
    const processed = new Set();

    // Buscar elementos principales
    const mainElements = element.querySelectorAll(
      '.form-control, .form-select, .card-body, .section'
    );

    mainElements.forEach(el => {
      const text = el.textContent.trim();
      if (
        text &&
        text.length > 3 &&
        text.length < 150 &&
        !processed.has(text) &&
        !text.includes('%') &&
        !text.includes('Progreso') &&
        !text.includes('Seleccione') &&
        !text.includes('Por favor')
      ) {
        processed.add(text);
        content.push(text);
      }
    });

    return content;
  }

  // Encontrar etiqueta para un input
  findLabelForInput(input) {
    // Buscar por for
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) {
        const text = label.textContent.trim();
        // Limpiar texto de etiqueta (remover asteriscos, etc.)
        return text.replace(/\*$/, '').trim();
      }
    }

    // Buscar label padre
    const parentLabel = input.closest('label');
    if (parentLabel) {
      const text = parentLabel.textContent.trim();
      return text.replace(/\*$/, '').trim();
    }

    // Buscar label anterior
    const prevLabel = input.previousElementSibling;
    if (prevLabel && prevLabel.tagName === 'LABEL') {
      const text = prevLabel.textContent.trim();
      return text.replace(/\*$/, '').trim();
    }

    // Buscar en el contenedor padre
    const container = input.closest('.form-group, .mb-3, .col-md-6, .col-md-4');
    if (container) {
      const label = container.querySelector('label');
      if (label) {
        const text = label.textContent.trim();
        return text.replace(/\*$/, '').trim();
      }
    }

    return null;
  }

  // Función específica para imprimir formulario de Diesel
  async printDieselForm() {
    try {
      console.log('⛽ Iniciando impresión específica de formulario Diesel...');

      // Verificar si jsPDF ya está cargado
      if (window.jspdf) {
        console.log('✅ jsPDF ya está cargado, procediendo directamente...');
        return this.generateDieselPDF();
      }

      console.log('📦 Cargando jsPDF...');
      // Cargar jsPDF directamente
      const jsPDFScript = document.createElement('script');
      jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

      return new Promise((resolve, reject) => {
        jsPDFScript.onload = () => {
          console.log('✅ jsPDF cargado exitosamente');
          this.generateDieselPDF().then(resolve).catch(reject);
        };

        jsPDFScript.onerror = () => {
          reject(new Error('No se pudo cargar jsPDF'));
        };

        document.head.appendChild(jsPDFScript);
      });
    } catch (error) {
      console.error('❌ Error en printDieselForm:', error);
      throw error;
    }
  }

  // Generar PDF de Diesel
  async generateDieselPDF() {
    try {
      console.log('📄 Generando PDF de Diesel...');

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Configurar fuente
      doc.setFont('helvetica');
      doc.setFontSize(12);

      let yPosition = 20;
      const _pageHeight = 280;
      const margin = 20;

      // Título
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('REGISTRO DE CONSUMO DIESEL', margin, yPosition);
      yPosition += 15;

      // Fecha
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de impresión: ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 10;

      // Línea separadora
      doc.setDrawColor(0, 0, 0);
      doc.line(margin, yPosition, 190, yPosition);
      yPosition += 10;

      // Extraer datos del formulario Diesel
      console.log('📊 Extrayendo datos del formulario...');
      const dieselData = this.extractDieselData();
      console.log('📊 Datos extraídos:', dieselData);

      // Información de la estación
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('INFORMACIÓN DE LA ESTACIÓN', margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Estación de Servicio: ${dieselData.estacionServicio}`, margin + 5, yPosition);
      yPosition += 5;
      doc.text(`Fecha de Consumo: ${dieselData.fechaConsumo}`, margin + 5, yPosition);
      yPosition += 5;

      // Información del vehículo
      yPosition += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL VEHÍCULO', margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.text(`Económico: ${dieselData.economico}`, margin + 5, yPosition);
      yPosition += 5;
      doc.text(`Placas: ${dieselData.placas}`, margin + 5, yPosition);
      yPosition += 5;
      doc.text(`Kilometraje: ${dieselData.kilometraje}`, margin + 5, yPosition);
      yPosition += 5;

      // Información del consumo
      yPosition += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL CONSUMO', margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.text(`Litros Consumidos: ${dieselData.litros}`, margin + 5, yPosition);
      yPosition += 5;
      doc.text(`Costo por Litro: $${dieselData.costoPorLitro}`, margin + 5, yPosition);
      yPosition += 5;
      doc.text(`Costo Total: $${dieselData.costoTotal}`, margin + 5, yPosition);
      yPosition += 5;
      doc.text(`Forma de Pago: ${dieselData.formaPago}`, margin + 5, yPosition);
      yPosition += 5;

      // Información de operadores
      yPosition += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DE OPERADORES', margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.text(`Operador Principal: ${dieselData.operadorPrincipal}`, margin + 5, yPosition);
      yPosition += 5;
      if (dieselData.operadorSecundario) {
        doc.text(`Operador Secundario: ${dieselData.operadorSecundario}`, margin + 5, yPosition);
        yPosition += 5;
      }

      // Guardar PDF
      const filename = `Diesel_${dieselData.fechaConsumo || new Date().toISOString().split('T')[0]}.pdf`;
      console.log('💾 Guardando PDF:', filename);
      doc.save(filename);

      this.showNotification('PDF de Diesel generado exitosamente', 'success');
      console.log('✅ PDF de Diesel generado exitosamente');
    } catch (error) {
      console.error('❌ Error generando PDF de Diesel:', error);
      throw error;
    }
  }

  // Extraer datos específicos del formulario Diesel
  extractDieselData() {
    const data = {};

    // Mapeo de IDs a nombres más legibles
    const fieldMapping = {
      estacionservicio: 'estacionServicio',
      fechaconsumo: 'fechaConsumo',
      economico: 'economico',
      kilometraje: 'kilometraje',
      Placas: 'placas',
      Litros: 'litros',
      costoporlitro: 'costoPorLitro',
      costototal: 'costoTotal',
      formapago: 'formaPago',
      operadorprincipal: 'operadorPrincipal',
      operadorsecundario: 'operadorSecundario'
    };

    // Extraer valores de los campos
    Object.entries(fieldMapping).forEach(([id, key]) => {
      const element = document.getElementById(id);
      if (element) {
        data[key] = element.value || '';
      } else {
        data[key] = '';
      }
    });

    console.log('📊 Datos extraídos del formulario Diesel:', data);
    return data;
  }

  // Mostrar notificación
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// ===== Instancia Global =====
window.printPDF = new PrintPDFManager();

// ===== Funciones Globales de Conveniencia =====

// Imprimir página completa
window.imprimirPagina = function (title = '') {
  window.printPDF.printFullPage(title);
};

// Imprimir tabla específica
window.imprimirTabla = function (tableId, title = '') {
  window.printPDF.printTable(tableId, title);
};

// Imprimir formulario específico
window.imprimirFormulario = function (formId, title = '') {
  window.printPDF.printForm(formId, title);
};

// Función específica para cada módulo
window.imprimirModulo = function (modulo, tipo = 'completo') {
  console.log('🖨️ Función imprimirModulo llamada:', modulo, tipo);

  const pageTitle = document.title.replace('ERP Rankiao - ', '');
  console.log('📄 Título de página:', pageTitle);

  try {
    switch (modulo) {
      case 'diesel':
        console.log('⛽ Imprimiendo módulo Diesel...');
        console.log('📋 Tipo de impresión:', tipo);
        // Para Diesel, usar método directo con datos estructurados
        if (tipo === 'historial') {
          console.log('📊 Imprimiendo historial de Diesel...');
          // Imprimir historial de movimientos
          const historialTable = document.querySelector('.table-responsive table');
          if (historialTable) {
            console.log('✅ Tabla de historial encontrada');
            window.printPDF.printTable(historialTable, 'Historial Diesel');
          } else {
            console.warn('⚠️ No se encontró tabla de historial');
            window.printPDF.printFullPage('Diesel - Historial');
          }
        } else {
          console.log('📝 Imprimiendo formulario completo de Diesel...');
          // Imprimir formulario completo con datos
          window.printPDF.printDieselForm();
        }
        break;
      case 'inventario':
        if (tipo === 'plataformas') {
          window.printPDF.printTable('tablaPlataformas', `${pageTitle}_Plataformas`);
        } else if (tipo === 'refacciones') {
          window.printPDF.printTable('tablaStockRefacciones', `${pageTitle}_Refacciones`);
        } else {
          window.printPDF.printFullPage(pageTitle);
        }
        break;

      case 'diesel':
        window.printPDF.printTable('tablaHistorialDiesel', `${pageTitle}_Historial`);
        break;

      case 'tesoreria':
        if (tipo === 'movimientos') {
          window.printPDF.printTable('tablaHistorialTesorería', `${pageTitle}_Movimientos`);
        } else if (tipo === 'solicitudes') {
          window.printPDF.printTable('tbodyOrdenesPago', `${pageTitle}_Solicitudes`);
        } else {
          window.printPDF.printFullPage(pageTitle);
        }
        break;

      case 'cxp':
        if (tipo === 'facturas') {
          window.printPDF.printTable('tablaFacturasCXP', `${pageTitle}_Facturas`);
        } else if (tipo === 'solicitudes') {
          window.printPDF.printTable('tablaSolicitudesCXP', `${pageTitle}_Solicitudes`);
        } else {
          window.printPDF.printFullPage(pageTitle);
        }
        break;

      case 'logistica':
      case 'trafico':
      case 'mantenimiento':
      case 'configuracion':
      case 'facturacion':
      case 'cxc':
      default:
        console.log('🔄 Imprimiendo página completa para:', modulo);
        window.printPDF.printFullPage(pageTitle);
        break;
    }
  } catch (error) {
    console.error('❌ Error en imprimirModulo:', error);
    window.printPDF.showNotification(`Error al imprimir: ${error.message}`, 'error');
  }
};

console.log('🖨️ Sistema de impresión PDF cargado');
