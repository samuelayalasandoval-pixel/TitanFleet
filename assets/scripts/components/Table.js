/**
 * Componente Table Reutilizable
 * Maneja la creación y gestión de tablas con filtros, paginación y ordenamiento
 *
 * @example
 * const table = new ERPTable({
 *   containerId: 'miTabla',
 *   columns: [
 *     { key: 'nombre', label: 'Nombre', sortable: true },
 *     { key: 'email', label: 'Email' }
 *   ],
 *   data: [...],
 *   pagination: { itemsPerPage: 10 }
 * });
 */
class ERPTable {
  constructor(options = {}) {
    this.options = {
      containerId: options.containerId || 'tableContainer',
      tableId: options.tableId || `table-${Date.now()}`,
      columns: options.columns || [],
      data: options.data || [],
      filteredData: [],
      pagination: {
        enabled: options.pagination?.enabled !== false,
        itemsPerPage: options.pagination?.itemsPerPage || 10,
        ...options.pagination
      },
      filters: options.filters || [],
      sortable: options.sortable !== false,
      striped: options.striped !== false,
      hover: options.hover !== false,
      bordered: options.bordered || false,
      responsive: options.responsive !== false,
      emptyMessage: options.emptyMessage || 'No hay registros disponibles',
      loadingMessage: options.loadingMessage || 'Cargando...',
      onRowClick: options.onRowClick || null,
      onSort: options.onSort || null,
      onFilter: options.onFilter || null,
      renderCell: options.renderCell || null,
      ...options
    };

    this.currentPage = 1;
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.activeFilters = {};

    this.container = null;
    this.tableElement = null;
    this._init();
  }

  _init() {
    this.container = document.getElementById(this.options.containerId);
    if (!this.container) {
      console.error(`❌ No se encontró el contenedor con ID: ${this.options.containerId}`);
      return;
    }

    this.filteredData = [...this.options.data];
    this._render();
  }

  /**
   * Renderiza la tabla completa
   */
  _render() {
    if (!this.container) {
      return;
    }

    const tableHTML = `
      <div class="table-responsive">
        <table class="table ${this.options.striped ? 'table-striped' : ''} ${this.options.hover ? 'table-hover' : ''} ${this.options.bordered ? 'table-bordered' : ''}" 
               id="${this.options.tableId}">
          <thead class="table-dark">
            ${this._renderHeader()}
          </thead>
          <tbody id="${this.options.tableId}Body">
            ${this._renderBody()}
          </tbody>
        </table>
      </div>
      ${this.options.pagination.enabled ? this._renderPagination() : ''}
    `;

    this.container.innerHTML = tableHTML;
    this.tableElement = document.getElementById(this.options.tableId);
    this._attachEvents();
  }

  /**
   * Renderiza el header de la tabla
   */
  _renderHeader() {
    return `
      <tr>
        ${this.options.columns
    .map(
      col => `
          <th ${col.sortable && this.options.sortable ? `class="sortable" data-column="${col.key}" style="cursor: pointer;"` : ''}>
            ${col.label || col.key}
            ${
  col.sortable && this.options.sortable && this.sortColumn === col.key
    ? `<i class="fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'} ms-1"></i>`
    : col.sortable && this.options.sortable
      ? '<i class="fas fa-sort ms-1 text-muted"></i>'
      : ''
}
          </th>
        `
    )
    .join('')}
      </tr>
    `;
  }

  /**
   * Renderiza el body de la tabla
   */
  _renderBody() {
    if (this.filteredData.length === 0) {
      return `
        <tr>
          <td colspan="${this.options.columns.length}" class="text-center text-muted py-4">
            <i class="fas fa-inbox fa-2x mb-2"></i>
            <p class="mb-0">${this.options.emptyMessage}</p>
          </td>
        </tr>
      `;
    }

    const paginatedData = this._getPaginatedData();
    return paginatedData
      .map((row, index) => {
        const rowIndex = (this.currentPage - 1) * this.options.pagination.itemsPerPage + index;
        return `
        <tr ${this.options.onRowClick ? `style="cursor: pointer;" data-row-index="${rowIndex}"` : ''}>
          ${this.options.columns
    .map(col => {
      let cellContent = row[col.key] ?? '';

      // Si hay una función de renderizado personalizada
      if (this.options.renderCell) {
        cellContent =
                  this.options.renderCell(col.key, cellContent, row, rowIndex) ?? cellContent;
      }

      // Si la columna tiene una función de renderizado
      if (col.render) {
        cellContent = col.render(cellContent, row, rowIndex);
      }

      return `<td>${cellContent}</td>`;
    })
    .join('')}
        </tr>
      `;
      })
      .join('');
  }

  /**
   * Renderiza la paginación
   */
  _renderPagination() {
    const totalPages = Math.ceil(this.filteredData.length / this.options.pagination.itemsPerPage);
    if (totalPages <= 1) {
      return '';
    }

    const startItem = (this.currentPage - 1) * this.options.pagination.itemsPerPage + 1;
    const endItem = Math.min(
      this.currentPage * this.options.pagination.itemsPerPage,
      this.filteredData.length
    );

    return `
      <div class="d-flex justify-content-between align-items-center mt-3" id="${this.options.tableId}Pagination">
        <div class="text-muted">
          Mostrando ${startItem} a ${endItem} de ${this.filteredData.length} registros
        </div>
        <nav>
          <ul class="pagination mb-0">
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
              <a class="page-link" href="#" data-page="prev">
                <i class="fas fa-chevron-left"></i>
              </a>
            </li>
            ${Array.from({ length: totalPages }, (_, i) => i + 1)
    .map(
      page => `
              <li class="page-item ${page === this.currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${page}">${page}</a>
              </li>
            `
    )
    .join('')}
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
              <a class="page-link" href="#" data-page="next">
                <i class="fas fa-chevron-right"></i>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    `;
  }

  /**
   * Obtiene los datos paginados
   */
  _getPaginatedData() {
    if (!this.options.pagination.enabled) {
      return this.filteredData;
    }

    const start = (this.currentPage - 1) * this.options.pagination.itemsPerPage;
    const end = start + this.options.pagination.itemsPerPage;
    return this.filteredData.slice(start, end);
  }

  /**
   * Adjunta eventos a la tabla
   */
  _attachEvents() {
    if (!this.tableElement) {
      return;
    }

    // Eventos de ordenamiento
    if (this.options.sortable) {
      const sortableHeaders = this.tableElement.querySelectorAll('th.sortable');
      sortableHeaders.forEach(header => {
        header.addEventListener('click', e => {
          const { column } = e.currentTarget.dataset;
          this.sort(column);
        });
      });
    }

    // Eventos de click en filas
    if (this.options.onRowClick) {
      const tbody = this.tableElement.querySelector('tbody');
      tbody?.addEventListener('click', e => {
        const row = e.target.closest('tr[data-row-index]');
        if (row) {
          const rowIndex = parseInt(row.dataset.rowIndex, 10);
          const rowData = this.filteredData[rowIndex];
          if (rowData) {
            this.options.onRowClick(rowData, rowIndex, e);
          }
        }
      });
    }

    // Eventos de paginación
    if (this.options.pagination.enabled) {
      const pagination = document.getElementById(`${this.options.tableId}Pagination`);
      pagination?.addEventListener('click', e => {
        e.preventDefault();
        const page = e.target.closest('a[data-page]')?.dataset.page;
        if (page) {
          if (page === 'prev') {
            this.previousPage();
          } else if (page === 'next') {
            this.nextPage();
          } else {
            this.goToPage(parseInt(page, 10));
          }
        }
      });
    }
  }

  /**
   * Ordena los datos por una columna
   */
  sort(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a, b) => {
      let aVal = a[column] ?? '';
      let bVal = b[column] ?? '';

      // Convertir a números si es posible
      if (!isNaN(aVal) && !isNaN(bVal)) {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (this.sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    });

    this.currentPage = 1;
    this._render();

    if (this.options.onSort) {
      this.options.onSort(column, this.sortDirection);
    }
  }

  /**
   * Aplica filtros a los datos
   */
  filter(filters) {
    this.activeFilters = { ...filters };
    this.filteredData = this.options.data.filter(row =>
      Object.entries(this.activeFilters).every(([key, value]) => {
        if (!value || value === '') {
          return true;
        }
        const cellValue = String(row[key] ?? '').toLowerCase();
        const filterValue = String(value).toLowerCase();
        return cellValue.includes(filterValue);
      })
    );

    this.currentPage = 1;
    this._render();

    if (this.options.onFilter) {
      this.options.onFilter(this.activeFilters);
    }
  }

  /**
   * Actualiza los datos de la tabla
   */
  setData(data) {
    this.options.data = data;
    this.filteredData = [...data];
    this.currentPage = 1;
    this._render();
  }

  /**
   * Agrega datos a la tabla
   */
  addData(data) {
    this.options.data.push(...data);
    this.filteredData = [...this.options.data];
    this._render();
  }

  /**
   * Navega a la página anterior
   */
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this._render();
    }
  }

  /**
   * Navega a la página siguiente
   */
  nextPage() {
    const totalPages = Math.ceil(this.filteredData.length / this.options.pagination.itemsPerPage);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this._render();
    }
  }

  /**
   * Va a una página específica
   */
  goToPage(page) {
    const totalPages = Math.ceil(this.filteredData.length / this.options.pagination.itemsPerPage);
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this._render();
    }
  }

  /**
   * Obtiene los datos filtrados actuales
   */
  getFilteredData() {
    return this.filteredData;
  }

  /**
   * Obtiene todos los datos
   */
  getData() {
    return this.options.data;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ERPTable = ERPTable;
}
