/**
 * Panel de Administración de Errores
 *
 * Interfaz de usuario para visualizar y gestionar el historial de errores
 */

class ErrorHandlerPanel {
  constructor() {
    this.isOpen = false;
    this.panelElement = null;
    this.currentFilter = {};
    this.showPanel = this.shouldShowPanel();
    this.init();
  }

  /**
   * Verificar si el panel debe ser visible
   * Solo para administradores o modo desarrollo
   */
  shouldShowPanel() {
    // Verificar si está explícitamente deshabilitado
    if (localStorage.getItem('errorPanelHidden') === 'true') {
      return false;
    }

    // Verificar modo desarrollo/debug
    const isDevMode =
      localStorage.getItem('debugMode') === 'true' ||
      localStorage.getItem('erp_debug') === 'true' ||
      window.location.search.includes('debug=true') ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (isDevMode) {
      return true;
    }

    // Verificar si el usuario es administrador
    try {
      // Verificar Firebase Auth
      const firebaseUser = window.firebaseAuth?.currentUser;
      if (firebaseUser) {
        // Verificar si tiene email de admin (puedes ajustar esta lógica)
        const adminEmails = ['admin@rankiao.com', 'samuelayalasandoval@gmail.com'];
        if (firebaseUser.email && adminEmails.includes(firebaseUser.email.toLowerCase())) {
          return true;
        }
      }

      // Verificar erpAuth (si existe)
      if (window.erpAuth?.currentUser) {
        if (window.erpAuth.currentUser.role === 'admin') {
          return true;
        }
      }

      // Verificar sessionStorage/localStorage para rol admin
      const session = localStorage.getItem('erpSession');
      if (session) {
        try {
          const sessionData = JSON.parse(session);
          if (sessionData.role === 'admin') {
            return true;
          }
        } catch (e) {
          // Ignorar errores de parseo
        }
      }
    } catch (e) {
      // En caso de error, no mostrar el panel
      console.warn('Error verificando permisos para panel de errores:', e);
    }

    // Por defecto, no mostrar para usuarios normales
    return false;
  }

  /**
   * Inicializar el panel
   */
  init() {
    // Solo inicializar si debe mostrarse
    if (!this.showPanel) {
      return;
    }
    this.createPanel();
    this.setupEventListeners();
  }

  /**
   * Crear el elemento del panel
   */
  createPanel() {
    // Verificar si ya existe
    if (document.getElementById('error-handler-panel')) {
      this.panelElement = document.getElementById('error-handler-panel');
      return;
    }

    // Crear panel
    this.panelElement = document.createElement('div');
    this.panelElement.id = 'error-handler-panel';
    this.panelElement.className = 'error-handler-panel';
    this.panelElement.innerHTML = this.getPanelHTML();
    document.body.appendChild(this.panelElement);

    // Crear botón toggle
    this.createToggleButton();
  }

  /**
   * Crear botón para abrir/cerrar el panel
   */
  createToggleButton() {
    if (document.getElementById('error-handler-toggle-btn')) {
      return;
    }

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'error-handler-toggle-btn';
    toggleBtn.className = 'error-handler-toggle-btn';
    toggleBtn.innerHTML = '<i class="fas fa-bug"></i>';
    toggleBtn.title = 'Panel de Errores';
    toggleBtn.onclick = () => this.toggle();
    document.body.appendChild(toggleBtn);

    // Mostrar badge con cantidad de errores críticos
    this.updateErrorBadge();
    setInterval(() => this.updateErrorBadge(), 30000); // Actualizar cada 30 segundos
  }

  /**
   * Actualizar badge de errores
   */
  updateErrorBadge() {
    const toggleBtn = document.getElementById('error-handler-toggle-btn');
    if (!toggleBtn || !window.errorHandler) {
      return;
    }

    const stats = window.errorHandler.getStatistics();
    const criticalCount = stats.byType.critical;

    let badge = toggleBtn.querySelector('.error-badge');
    if (criticalCount > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'error-badge';
        toggleBtn.appendChild(badge);
      }
      badge.textContent = criticalCount > 99 ? '99+' : criticalCount;
    } else if (badge) {
      badge.remove();
    }
  }

  /**
   * HTML del panel
   */
  getPanelHTML() {
    return `
            <div class="error-panel-header">
                <h5><i class="fas fa-bug me-2"></i>Panel de Errores</h5>
                <button class="btn btn-sm btn-link text-white" onclick="window.errorHandlerPanel.close()" title="Cerrar">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="error-panel-body">
                <!-- Estadísticas -->
                <div class="error-stats mb-3" id="error-stats">
                    <div class="row g-2">
                        <div class="col-6">
                            <div class="stat-card critical">
                                <div class="stat-value" id="stat-critical">0</div>
                                <div class="stat-label">Críticos</div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="stat-card warning">
                                <div class="stat-value" id="stat-warning">0</div>
                                <div class="stat-label">Advertencias</div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="stat-card info">
                                <div class="stat-value" id="stat-info">0</div>
                                <div class="stat-label">Info</div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="stat-card success">
                                <div class="stat-value" id="stat-success">0</div>
                                <div class="stat-label">Éxitos</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filtros -->
                <div class="error-filters mb-3">
                    <div class="input-group input-group-sm mb-2">
                        <span class="input-group-text"><i class="fas fa-filter"></i></span>
                        <select class="form-select" id="error-filter-type" onchange="window.errorHandlerPanel.applyFilters()">
                            <option value="">Todos los tipos</option>
                            <option value="critical">Críticos</option>
                            <option value="warning">Advertencias</option>
                            <option value="info">Información</option>
                            <option value="success">Éxitos</option>
                        </select>
                    </div>
                    <div class="input-group input-group-sm mb-2">
                        <span class="input-group-text"><i class="fas fa-search"></i></span>
                        <input type="text" class="form-control" id="error-filter-search" 
                               placeholder="Buscar en mensajes..." 
                               onkeyup="window.errorHandlerPanel.applyFilters()">
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-secondary flex-fill" onclick="window.errorHandlerPanel.clearFilters()">
                            <i class="fas fa-times me-1"></i>Limpiar
                        </button>
                        <button class="btn btn-sm btn-outline-danger flex-fill" onclick="window.errorHandlerPanel.clearHistory()">
                            <i class="fas fa-trash me-1"></i>Limpiar Historial
                        </button>
                    </div>
                </div>

                <!-- Configuración -->
                <div class="error-config mb-3">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="config-silent-mode" 
                               onchange="window.errorHandlerPanel.toggleSilentMode(this.checked)">
                        <label class="form-check-label" for="config-silent-mode">
                            Modo Silencioso
                        </label>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="config-show-warnings" 
                               checked
                               onchange="window.errorHandlerPanel.toggleShowWarnings(this.checked)">
                        <label class="form-check-label" for="config-show-warnings">
                            Mostrar Advertencias
                        </label>
                    </div>
                </div>

                <!-- Lista de errores -->
                <div class="error-list" id="error-list">
                    <div class="text-center text-muted py-3">
                        <i class="fas fa-info-circle mb-2"></i>
                        <p>Sin errores registrados</p>
                    </div>
                </div>
            </div>
            <div class="error-panel-footer">
                <button class="btn btn-sm btn-outline-primary" onclick="window.errorHandlerPanel.exportHistory('json')">
                    <i class="fas fa-download me-1"></i>Exportar JSON
                </button>
                <button class="btn btn-sm btn-outline-primary" onclick="window.errorHandlerPanel.exportHistory('csv')">
                    <i class="fas fa-file-csv me-1"></i>Exportar CSV
                </button>
            </div>
        `;
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    // Cerrar con ESC
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Clic fuera del panel para cerrar
    this.panelElement?.addEventListener('click', e => {
      if (e.target === this.panelElement) {
        this.close();
      }
    });
  }

  /**
   * Abrir/cerrar el panel
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Abrir el panel
   */
  open() {
    if (!this.panelElement) {
      return;
    }

    this.isOpen = true;
    this.panelElement.classList.add('open');
    this.refresh();

    // Actualizar configuración UI
    if (window.errorHandler) {
      document.getElementById('config-silent-mode').checked = window.errorHandler.config.silentMode;
      document.getElementById('config-show-warnings').checked =
        window.errorHandler.config.showWarningNotifications;
    }
  }

  /**
   * Cerrar el panel
   */
  close() {
    if (!this.panelElement) {
      return;
    }
    this.isOpen = false;
    this.panelElement.classList.remove('open');
  }

  /**
   * Refrescar el contenido del panel
   */
  refresh() {
    if (!window.errorHandler) {
      return;
    }

    this.updateStatistics();
    this.renderErrorList();
  }

  /**
   * Actualizar estadísticas
   */
  updateStatistics() {
    const stats = window.errorHandler.getStatistics();

    document.getElementById('stat-critical').textContent = stats.byType.critical;
    document.getElementById('stat-warning').textContent = stats.byType.warning;
    document.getElementById('stat-info').textContent = stats.byType.info;
    document.getElementById('stat-success').textContent = stats.byType.success;
  }

  /**
   * Renderizar lista de errores
   */
  renderErrorList() {
    const errorList = document.getElementById('error-list');
    if (!errorList || !window.errorHandler) {
      return;
    }

    const errors = window.errorHandler.getHistory(this.currentFilter);

    if (errors.length === 0) {
      errorList.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="fas fa-info-circle mb-2"></i>
                    <p>No hay errores que coincidan con los filtros</p>
                </div>
            `;
      return;
    }

    // Aplicar búsqueda de texto si existe
    const searchTerm = document.getElementById('error-filter-search')?.value.toLowerCase() || '';
    const filteredErrors = searchTerm
      ? errors.filter(e => e.message.toLowerCase().includes(searchTerm))
      : errors;

    errorList.innerHTML = filteredErrors
      .slice(0, 50)
      .map(error => this.renderErrorItem(error))
      .join('');

    // Agregar listeners para expandir detalles
    errorList.querySelectorAll('.error-item').forEach(item => {
      item.addEventListener('click', e => {
        if (!e.target.closest('.error-actions')) {
          const details = item.querySelector('.error-details');
          details.classList.toggle('show');
        }
      });
    });
  }

  /**
   * Renderizar item de error
   */
  renderErrorItem(error) {
    const date = new Date(error.timestamp);
    const typeClass = `error-type-${error.type}`;
    const icon = this.getIconForType(error.type);

    return `
            <div class="error-item ${typeClass}" data-error-id="${error.id}">
                <div class="error-item-header">
                    <div class="error-item-main">
                        <i class="${icon} me-2"></i>
                        <div class="error-item-content">
                            <div class="error-message">${this.escapeHtml(error.message)}</div>
                            <div class="error-meta">
                                <small class="text-muted">
                                    <i class="fas fa-clock me-1"></i>
                                    ${date.toLocaleString()}
                                    ${error.source ? `<span class="ms-2"><i class="fas fa-file-code me-1"></i>${error.source.split('/').pop()}</span>` : ''}
                                </small>
                            </div>
                        </div>
                    </div>
                    <div class="error-actions">
                        <button class="btn btn-sm btn-link p-0" onclick="event.stopPropagation(); window.errorHandlerPanel.copyErrorDetails('${error.id}')" title="Copiar detalles">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                <div class="error-details">
                    <div class="error-detail-section">
                        <strong>Tipo:</strong> <span class="badge bg-${this.getBadgeClass(error.type)}">${error.type}</span>
                    </div>
                    ${
  error.source
    ? `
                    <div class="error-detail-section">
                        <strong>Fuente:</strong> <code>${this.escapeHtml(error.source)}</code>
                    </div>
                    `
    : ''
}
                    ${
  error.context && Object.keys(error.context).length > 0
    ? `
                    <div class="error-detail-section">
                        <strong>Contexto:</strong>
                        <pre class="error-context">${JSON.stringify(error.context, null, 2)}</pre>
                    </div>
                    `
    : ''
}
                    ${
  error.stack
    ? `
                    <div class="error-detail-section">
                        <strong>Stack Trace:</strong>
                        <pre class="error-stack">${this.escapeHtml(error.stack)}</pre>
                    </div>
                    `
    : ''
}
                    ${
  error.metadata && Object.keys(error.metadata).length > 0
    ? `
                    <div class="error-detail-section">
                        <strong>Metadata:</strong>
                        <pre class="error-metadata">${JSON.stringify(error.metadata, null, 2)}</pre>
                    </div>
                    `
    : ''
}
                </div>
            </div>
        `;
  }

  /**
   * Aplicar filtros
   */
  applyFilters() {
    const typeFilter = document.getElementById('error-filter-type')?.value || '';
    this.currentFilter = typeFilter ? { type: typeFilter } : {};
    this.renderErrorList();
  }

  /**
   * Limpiar filtros
   */
  clearFilters() {
    document.getElementById('error-filter-type').value = '';
    document.getElementById('error-filter-search').value = '';
    this.currentFilter = {};
    this.renderErrorList();
  }

  /**
   * Limpiar historial
   */
  clearHistory() {
    if (!confirm('¿Está seguro de que desea limpiar todo el historial de errores?')) {
      return;
    }

    if (window.errorHandler) {
      window.errorHandler.clearHistory();
      this.refresh();
      this.updateErrorBadge();
    }
  }

  /**
   * Exportar historial
   */
  exportHistory(format) {
    if (!window.errorHandler) {
      return;
    }

    const data = window.errorHandler.exportHistory(format);
    const blob = new Blob([data], {
      type: format === 'json' ? 'application/json' : 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `errores_${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Copiar detalles del error
   */
  copyErrorDetails(errorId) {
    if (!window.errorHandler) {
      return;
    }

    const error = window.errorHandler.getHistory().find(e => e.id === errorId);
    if (!error) {
      return;
    }

    const details = JSON.stringify(error, null, 2);
    navigator.clipboard.writeText(details).then(() => {
      // Mostrar feedback
      const btn = event.target.closest('button');
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i>';
      btn.classList.add('text-success');
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.classList.remove('text-success');
      }, 2000);
    });
  }

  /**
   * Toggle modo silencioso
   */
  toggleSilentMode(enabled) {
    if (window.errorHandler) {
      window.errorHandler.setSilentMode(enabled);
    }
  }

  /**
   * Toggle mostrar advertencias
   */
  toggleShowWarnings(enabled) {
    if (window.errorHandler) {
      window.errorHandler.configure({ showWarningNotifications: enabled });
    }
  }

  /**
   * Obtener icono según tipo
   */
  getIconForType(type) {
    switch (type) {
      case 'critical':
        return 'fas fa-exclamation-circle';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'info':
        return 'fas fa-info-circle';
      case 'success':
        return 'fas fa-check-circle';
      default:
        return 'fas fa-bell';
    }
  }

  /**
   * Obtener clase de badge según tipo
   */
  getBadgeClass(type) {
    switch (type) {
      case 'critical':
        return 'danger';
      case 'warning':
        return 'warning text-dark';
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      default:
        return 'secondary';
    }
  }

  /**
   * Escapar HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Crear instancia global
window.ErrorHandlerPanel = ErrorHandlerPanel;

// Inicializar cuando el DOM esté listo
// Solo inicializar si debe mostrarse (para admin/dev)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const panel = new ErrorHandlerPanel();
    if (panel.showPanel) {
      window.errorHandlerPanel = panel;
    }
  });
} else {
  const panel = new ErrorHandlerPanel();
  if (panel.showPanel) {
    window.errorHandlerPanel = panel;
  }
}

// Función helper para habilitar el panel (solo para desarrollo)
window.enableErrorPanel = function () {
  localStorage.removeItem('errorPanelHidden');
  if (window.errorHandlerPanel) {
    window.errorHandlerPanel.showPanel = true;
    window.errorHandlerPanel.init();
  } else {
    window.errorHandlerPanel = new ErrorHandlerPanel();
  }
};

// Función helper para deshabilitar el panel
window.disableErrorPanel = function () {
  localStorage.setItem('errorPanelHidden', 'true');
  const toggleBtn = document.getElementById('error-handler-toggle-btn');
  const panel = document.getElementById('error-handler-panel');
  if (toggleBtn) {
    toggleBtn.remove();
  }
  if (panel) {
    panel.remove();
  }
};
