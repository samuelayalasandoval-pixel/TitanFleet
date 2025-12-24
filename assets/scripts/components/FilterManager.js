/**
 * Componente FilterManager Reutilizable
 * Gestiona filtros de forma centralizada y reutilizable
 *
 * @example
 * const filterManager = new FilterManager({
 *   containerId: 'filtrosContainer',
 *   filters: [
 *     { id: 'nombre', type: 'text', label: 'Nombre', placeholder: 'Buscar...' },
 *     { id: 'fecha', type: 'date', label: 'Fecha' }
 *   ],
 *   onFilter: (filters) => { ... }
 * });
 */
class FilterManager {
  constructor(options = {}) {
    this.options = {
      containerId: options.containerId || 'filtrosContainer',
      filters: options.filters || [],
      showClearButton: options.showClearButton !== false,
      clearButtonText: options.clearButtonText || 'Limpiar Filtros',
      onFilter: options.onFilter || null,
      onClear: options.onClear || null,
      autoApply: options.autoApply !== false, // Aplicar filtros automáticamente al cambiar
      debounceTime: options.debounceTime || 300, // Tiempo de espera para aplicar filtros (ms)
      ...options
    };

    this.container = null;
    this.activeFilters = {};
    this.debounceTimer = null;
    this._init();
  }

  _init() {
    this.container = document.getElementById(this.options.containerId);
    if (!this.container) {
      console.warn(`⚠️ No se encontró el contenedor con ID: ${this.options.containerId}`);
      return;
    }

    this._render();
    this._attachEvents();
  }

  /**
   * Renderiza los filtros
   */
  _render() {
    const filtersHTML = `
      <div class="filtros-container border-bottom mb-3 pb-3">
        <h6 class="mb-3">
          <i class="fas fa-filter"></i> Filtros de Búsqueda
        </h6>
        <div class="row g-3">
          ${this.options.filters.map(filter => this._renderFilter(filter)).join('')}
          ${
  this.options.showClearButton
    ? `
            <div class="col-md-12 d-flex align-items-end">
              <button type="button" class="btn btn-outline-secondary btn-sm" id="clearFiltersBtn">
                <i class="fas fa-times"></i> ${this.options.clearButtonText}
              </button>
            </div>
          `
    : ''
}
        </div>
      </div>
    `;

    this.container.innerHTML = filtersHTML;
  }

  /**
   * Renderiza un filtro individual
   */
  _renderFilter(filter) {
    const colSize = filter.colSize || 'col-md-2';
    let inputHTML = '';

    switch (filter.type) {
      case 'text':
        inputHTML = `
          <input type="text" 
                 class="form-control form-control-sm" 
                 id="filter_${filter.id}" 
                 placeholder="${filter.placeholder || filter.label || ''}"
                 ${filter.onKeyup ? `onkeyup="${filter.onKeyup}"` : ''}>
        `;
        break;

      case 'date':
        inputHTML = `
          <input type="date" 
                 class="form-control form-control-sm" 
                 id="filter_${filter.id}"
                 ${filter.onChange ? `onchange="${filter.onChange}"` : ''}>
        `;
        break;

      case 'select':
        const options = filter.options || [];
        inputHTML = `
          <select class="form-select form-select-sm" 
                  id="filter_${filter.id}"
                  ${filter.onChange ? `onchange="${filter.onChange}"` : ''}>
            <option value="">${filter.placeholder || 'Todos'}</option>
            ${options
    .map(opt => {
      const value = typeof opt === 'object' ? opt.value : opt;
      const label = typeof opt === 'object' ? opt.label : opt;
      return `<option value="${value}">${label}</option>`;
    })
    .join('')}
          </select>
        `;
        break;

      case 'number':
        inputHTML = `
          <input type="number" 
                 class="form-control form-control-sm" 
                 id="filter_${filter.id}" 
                 placeholder="${filter.placeholder || filter.label || ''}"
                 ${filter.min !== undefined ? `min="${filter.min}"` : ''}
                 ${filter.max !== undefined ? `max="${filter.max}"` : ''}
                 ${filter.step !== undefined ? `step="${filter.step}"` : ''}
                 ${filter.onKeyup ? `onkeyup="${filter.onKeyup}"` : ''}>
        `;
        break;

      case 'month':
        inputHTML = `
          <input type="month" 
                 class="form-control form-control-sm" 
                 id="filter_${filter.id}"
                 ${filter.onChange ? `onchange="${filter.onChange}"` : ''}>
        `;
        break;

      default:
        inputHTML = `
          <input type="text" 
                 class="form-control form-control-sm" 
                 id="filter_${filter.id}" 
                 placeholder="${filter.placeholder || filter.label || ''}">
        `;
    }

    return `
      <div class="${colSize}">
        <label for="filter_${filter.id}" class="form-label small">${filter.label || filter.id}</label>
        ${inputHTML}
      </div>
    `;
  }

  /**
   * Adjunta eventos a los filtros
   */
  _attachEvents() {
    // Eventos para cada filtro
    this.options.filters.forEach(filter => {
      const filterElement = document.getElementById(`filter_${filter.id}`);
      if (!filterElement) {
        return;
      }

      if (this.options.autoApply) {
        if (filter.type === 'text' || filter.type === 'number') {
          filterElement.addEventListener('input', () => {
            this._debounceApplyFilters();
          });
        } else {
          filterElement.addEventListener('change', () => {
            this._applyFilters();
          });
        }
      }
    });

    // Botón de limpiar
    if (this.options.showClearButton) {
      const clearBtn = document.getElementById('clearFiltersBtn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.clearFilters();
        });
      }
    }
  }

  /**
   * Aplica los filtros con debounce
   */
  _debounceApplyFilters() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this._applyFilters();
    }, this.options.debounceTime);
  }

  /**
   * Aplica los filtros
   */
  _applyFilters() {
    this.activeFilters = {};

    this.options.filters.forEach(filter => {
      const filterElement = document.getElementById(`filter_${filter.id}`);
      if (filterElement) {
        const value = filterElement.value.trim();
        if (value) {
          this.activeFilters[filter.id] = value;
        }
      }
    });

    if (this.options.onFilter) {
      this.options.onFilter(this.activeFilters, this);
    }
  }

  /**
   * Obtiene los filtros activos
   */
  getFilters() {
    return { ...this.activeFilters };
  }

  /**
   * Establece un valor de filtro
   */
  setFilter(filterId, value) {
    const filterElement = document.getElementById(`filter_${filterId}`);
    if (filterElement) {
      filterElement.value = value;
      this._applyFilters();
    }
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters() {
    this.options.filters.forEach(filter => {
      const filterElement = document.getElementById(`filter_${filter.id}`);
      if (filterElement) {
        filterElement.value = '';
      }
    });

    this.activeFilters = {};

    if (this.options.onClear) {
      this.options.onClear(this);
    }

    if (this.options.onFilter) {
      this.options.onFilter({}, this);
    }
  }

  /**
   * Aplica los filtros manualmente (útil cuando autoApply está desactivado)
   */
  applyFilters() {
    this._applyFilters();
  }

  /**
   * Agrega un nuevo filtro dinámicamente
   */
  addFilter(filter) {
    this.options.filters.push(filter);
    this._render();
    this._attachEvents();
  }

  /**
   * Remueve un filtro
   */
  removeFilter(filterId) {
    this.options.filters = this.options.filters.filter(f => f.id !== filterId);
    this._render();
    this._attachEvents();
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.FilterManager = FilterManager;
}
