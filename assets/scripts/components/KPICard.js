/**
 * Componente KPI Card Reutilizable
 * Crea tarjetas de métricas/KPI con iconos y animaciones
 *
 * @example
 * const kpi = new KPICard({
 *   containerId: 'kpiContainer',
 *   icon: 'fas fa-truck',
 *   value: 150,
 *   label: 'Total Viajes',
 *   color: 'primary'
 * });
 */
class KPICard {
  constructor(options = {}) {
    this.options = {
      containerId: options.containerId || 'kpiContainer',
      id: options.id || `kpi-${Date.now()}`,
      icon: options.icon || 'fas fa-chart-line',
      value: options.value || 0,
      label: options.label || 'Métrica',
      color: options.color || 'primary', // primary, success, warning, danger, info, dark
      format: options.format || 'number', // number, currency, percentage
      currency: options.currency || 'MXN',
      showAnimation: options.showAnimation !== false,
      onClick: options.onClick || null,
      ...options
    };

    this.container = null;
    this.cardElement = null;
    this._init();
  }

  _init() {
    this.container = document.getElementById(this.options.containerId);
    if (!this.container) {
      console.warn(`⚠️ No se encontró el contenedor con ID: ${this.options.containerId}`);
      return;
    }

    this._render();
  }

  /**
   * Renderiza la tarjeta KPI
   */
  _render() {
    const formattedValue = this._formatValue(this.options.value);
    const colorClass = `bg-${this.options.color}`;

    const cardHTML = `
      <div class="kpi-card ${colorClass} text-white" id="${this.options.id}" 
           ${this.options.onClick ? 'style="cursor: pointer;"' : ''}>
        <div class="kpi-icon">
          <i class="${this.options.icon}"></i>
        </div>
        <div class="kpi-content">
          <h3 class="kpi-value" id="${this.options.id}Value">${formattedValue}</h3>
          <p class="kpi-label">${this.options.label}</p>
        </div>
      </div>
    `;

    this.container.insertAdjacentHTML('beforeend', cardHTML);
    this.cardElement = document.getElementById(this.options.id);

    if (this.options.onClick) {
      this.cardElement.addEventListener('click', () => {
        this.options.onClick(this.options.value, this);
      });
    }

    if (this.options.showAnimation) {
      this._animateValue();
    }
  }

  /**
   * Formatea el valor según el tipo
   */
  _formatValue(value) {
    switch (this.options.format) {
      case 'currency':
        return this._formatCurrency(value);
      case 'percentage':
        return `${value}%`;
      case 'number':
      default:
        return this._formatNumber(value);
    }
  }

  /**
   * Formatea un número con separadores de miles
   */
  _formatNumber(value) {
    if (typeof value !== 'number') {
      value = parseFloat(value) || 0;
    }
    return new Intl.NumberFormat('es-MX').format(value);
  }

  /**
   * Formatea un valor como moneda
   */
  _formatCurrency(value) {
    if (typeof value !== 'number') {
      value = parseFloat(value) || 0;
    }
    const currencySymbol = this.options.currency === 'USD' ? '$' : '$';
    return `${currencySymbol}${this._formatNumber(value)}`;
  }

  /**
   * Anima el valor desde 0 hasta el valor final
   */
  _animateValue() {
    const valueElement = document.getElementById(`${this.options.id}Value`);
    if (!valueElement) {
      return;
    }

    const startValue = 0;
    const endValue =
      typeof this.options.value === 'number'
        ? this.options.value
        : parseFloat(this.options.value) || 0;
    const duration = 1000; // 1 segundo
    const startTime = performance.now();

    const animate = currentTime => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Función de easing (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOut;

      valueElement.textContent = this._formatValue(Math.floor(currentValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        valueElement.textContent = this._formatValue(endValue);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Actualiza el valor de la tarjeta
   */
  updateValue(newValue, animate = true) {
    this.options.value = newValue;
    const valueElement = document.getElementById(`${this.options.id}Value`);
    if (valueElement) {
      if (animate && this.options.showAnimation) {
        this._animateValue();
      } else {
        valueElement.textContent = this._formatValue(newValue);
      }
    }
  }

  /**
   * Actualiza la etiqueta
   */
  updateLabel(newLabel) {
    this.options.label = newLabel;
    const labelElement = this.cardElement?.querySelector('.kpi-label');
    if (labelElement) {
      labelElement.textContent = newLabel;
    }
  }

  /**
   * Actualiza el color
   */
  updateColor(newColor) {
    if (this.cardElement) {
      this.cardElement.classList.remove(`bg-${this.options.color}`);
      this.cardElement.classList.add(`bg-${newColor}`);
      this.options.color = newColor;
    }
  }

  /**
   * Destruye la tarjeta
   */
  destroy() {
    if (this.cardElement) {
      this.cardElement.remove();
    }
    this.cardElement = null;
  }
}

/**
 * Clase para crear múltiples KPI Cards
 */
class KPICardGroup {
  constructor(options = {}) {
    this.options = {
      containerId: options.containerId || 'kpiContainer',
      cards: options.cards || [],
      columns: options.columns || 4, // Número de columnas (Bootstrap)
      ...options
    };

    this.container = null;
    this.cards = [];
    this._init();
  }

  _init() {
    this.container = document.getElementById(this.options.containerId);
    if (!this.container) {
      console.error(`❌ No se encontró el contenedor con ID: ${this.options.containerId}`);
      return;
    }

    this._render();
  }

  /**
   * Renderiza todas las tarjetas
   */
  _render() {
    const colClass = `col-lg-${12 / this.options.columns} col-md-6 col-sm-6 mb-3`;

    this.options.cards.forEach((cardOptions, index) => {
      const cardContainer = document.createElement('div');
      cardContainer.className = colClass;
      cardContainer.id = `kpi-card-wrapper-${index}`;
      this.container.appendChild(cardContainer);

      const card = new KPICard({
        ...cardOptions,
        containerId: `kpi-card-wrapper-${index}`
      });
      this.cards.push(card);
    });
  }

  /**
   * Actualiza todos los valores
   */
  updateValues(values) {
    values.forEach((value, index) => {
      if (this.cards[index]) {
        this.cards[index].updateValue(value);
      }
    });
  }

  /**
   * Destruye todas las tarjetas
   */
  destroy() {
    this.cards.forEach(card => card.destroy());
    this.cards = [];
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.KPICard = KPICard;
  window.KPICardGroup = KPICardGroup;
}
