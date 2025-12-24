/**
 * Componente ExportButton Reutilizable
 * Maneja la exportación de datos a diferentes formatos (Excel, PDF, CSV)
 *
 * @example
 * const exportBtn = new ExportButton({
 *   buttonId: 'btnExportar',
 *   data: [...],
 *   filename: 'reporte',
 *   formats: ['excel', 'csv']
 * });
 */
class ExportButton {
  constructor(options = {}) {
    this.options = {
      buttonId: options.buttonId || 'exportButton',
      data: options.data || [],
      filename: options.filename || 'export',
      formats: options.formats || ['excel'], // excel, csv, pdf
      columns: options.columns || [], // Para definir qué columnas exportar
      onExport: options.onExport || null, // Callback antes de exportar
      buttonText: options.buttonText || '<i class="fas fa-file-excel"></i> Exportar',
      buttonClass: options.buttonClass || 'btn btn-outline-light btn-sm',
      ...options
    };

    this.buttonElement = null;
    this._init();
  }

  _init() {
    this.buttonElement = document.getElementById(this.options.buttonId);
    if (!this.buttonElement) {
      console.warn(`⚠️ No se encontró el botón con ID: ${this.options.buttonId}`);
      return;
    }

    this._setupButton();
    this._attachEvents();
  }

  /**
   * Configura el botón
   */
  _setupButton() {
    if (typeof this.options.buttonText === 'string') {
      this.buttonElement.innerHTML = this.options.buttonText;
    }
    if (this.options.buttonClass) {
      this.buttonElement.className = this.options.buttonClass;
    }
  }

  /**
   * Adjunta eventos
   */
  _attachEvents() {
    this.buttonElement.addEventListener('click', () => {
      this.export();
    });
  }

  /**
   * Exporta los datos
   */
  async export() {
    try {
      // Ejecutar callback antes de exportar (útil para obtener datos actualizados)
      let dataToExport = this.options.data;
      if (this.options.onExport) {
        const result = await this.options.onExport();
        if (result) {
          dataToExport = result;
        }
      }

      if (!dataToExport || dataToExport.length === 0) {
        alert('No hay datos para exportar');
        return;
      }

      // Exportar según los formatos seleccionados
      if (this.options.formats.length === 1) {
        // Si solo hay un formato, exportar directamente
        this._exportFormat(this.options.formats[0], dataToExport);
      } else {
        // Si hay múltiples formatos, mostrar menú desplegable
        this._showFormatMenu(dataToExport);
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los datos');
    }
  }

  /**
   * Muestra un menú para seleccionar el formato
   */
  _showFormatMenu(data) {
    // Crear dropdown menu
    const menuHTML = `
      <div class="dropdown-menu show" style="position: absolute; z-index: 1000;">
        ${this.options.formats
    .map(
      format => `
          <a class="dropdown-item" href="#" data-format="${format}">
            <i class="fas fa-file-${format === 'excel' ? 'excel' : format === 'pdf' ? 'pdf' : 'csv'}"></i>
            Exportar como ${format.toUpperCase()}
          </a>
        `
    )
    .join('')}
      </div>
    `;

    // Crear contenedor temporal
    const menuContainer = document.createElement('div');
    menuContainer.className = 'dropdown';
    menuContainer.style.position = 'relative';
    menuContainer.innerHTML = menuHTML;
    document.body.appendChild(menuContainer);

    // Adjuntar eventos
    menuContainer.querySelectorAll('a[data-format]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const { format } = e.currentTarget.dataset;
        this._exportFormat(format, data);
        document.body.removeChild(menuContainer);
      });
    });

    // Cerrar al hacer click fuera
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menuContainer.contains(e.target) && e.target !== this.buttonElement) {
          document.body.removeChild(menuContainer);
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 0);
  }

  /**
   * Exporta en un formato específico
   */
  _exportFormat(format, data) {
    switch (format) {
      case 'excel':
        this._exportToExcel(data);
        break;
      case 'csv':
        this._exportToCSV(data);
        break;
      case 'pdf':
        this._exportToPDF(data);
        break;
      default:
        console.warn(`Formato no soportado: ${format}`);
    }
  }

  /**
   * Exporta a Excel usando SheetJS (xlsx)
   */
  _exportToExcel(data) {
    // Verificar si SheetJS está disponible
    if (typeof XLSX === 'undefined') {
      console.error(
        'SheetJS (XLSX) no está disponible. Incluye: https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js'
      );
      alert(
        'La funcionalidad de Excel no está disponible. Por favor, incluye la librería SheetJS.'
      );
      return;
    }

    try {
      // Preparar datos
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

      // Generar archivo
      XLSX.writeFile(workbook, `${this.options.filename}.xlsx`);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al exportar a Excel');
    }
  }

  /**
   * Exporta a CSV
   */
  _exportToCSV(data) {
    if (!data || data.length === 0) {
      return;
    }

    try {
      // Obtener headers
      const headers =
        this.options.columns.length > 0
          ? this.options.columns.map(col => col.label || col.key)
          : Object.keys(data[0]);

      // Crear CSV
      let csv = `${headers.join(',')}\n`;

      data.forEach(row => {
        const values =
          this.options.columns.length > 0
            ? this.options.columns.map(col => {
              const value = row[col.key] ?? '';
              // Escapar comillas y envolver en comillas si contiene comas
              return value.toString().includes(',')
                ? `"${value.toString().replace(/"/g, '""')}"`
                : value;
            })
            : Object.values(row).map(val => {
              const value = val ?? '';
              return value.toString().includes(',')
                ? `"${value.toString().replace(/"/g, '""')}"`
                : value;
            });
        csv += `${values.join(',')}\n`;
      });

      // Descargar
      const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${this.options.filename}.csv`;
      link.click();
    } catch (error) {
      console.error('Error al exportar a CSV:', error);
      alert('Error al exportar a CSV');
    }
  }

  /**
   * Exporta a PDF (requiere jsPDF)
   */
  _exportToPDF(data) {
    // Verificar si jsPDF está disponible
    if (typeof jsPDF === 'undefined') {
      console.error(
        'jsPDF no está disponible. Incluye: https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      );
      alert('La funcionalidad de PDF no está disponible. Por favor, incluye la librería jsPDF.');
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Preparar datos para tabla
      const headers =
        this.options.columns.length > 0
          ? this.options.columns.map(col => col.label || col.key)
          : Object.keys(data[0]);

      const rows = data.map(row =>
        this.options.columns.length > 0
          ? this.options.columns.map(col => row[col.key] ?? '')
          : Object.values(row)
      );

      // Agregar tabla
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 20
      });

      // Guardar
      doc.save(`${this.options.filename}.pdf`);
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      alert('Error al exportar a PDF');
    }
  }

  /**
   * Actualiza los datos
   */
  updateData(data) {
    this.options.data = data;
  }

  /**
   * Actualiza el nombre del archivo
   */
  updateFilename(filename) {
    this.options.filename = filename;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ExportButton = ExportButton;
}
