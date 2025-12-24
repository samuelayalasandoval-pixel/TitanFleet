/**
 * Componente Modal Reutilizable
 * Maneja la creación y gestión de modales de Bootstrap de forma dinámica
 *
 * @example
 * const modal = new ERPModal({
 *   id: 'miModal',
 *   title: 'Título del Modal',
 *   body: '<p>Contenido del modal</p>',
 *   footer: '<button class="btn btn-primary">Guardar</button>'
 * });
 * modal.show();
 */
class ERPModal {
  constructor(options = {}) {
    this.options = {
      id: options.id || `modal-${Date.now()}`,
      title: options.title || 'Modal',
      body: options.body || '',
      footer: options.footer || null,
      size: options.size || 'modal-lg', // modal-sm, modal-lg, modal-xl
      backdrop: options.backdrop !== undefined ? options.backdrop : true,
      keyboard: options.keyboard !== undefined ? options.keyboard : true,
      focus: options.focus !== undefined ? options.focus : true,
      headerClass: options.headerClass || 'bg-primary text-white',
      onShow: options.onShow || null,
      onHide: options.onHide || null,
      onShown: options.onShown || null,
      onHidden: options.onHidden || null,
      ...options
    };

    this.modalElement = null;
    this.bootstrapModal = null;
    this._init();
  }

  _init() {
    // Verificar si el modal ya existe
    const existingModal = document.getElementById(this.options.id);
    if (existingModal) {
      this.modalElement = existingModal;
      this.bootstrapModal = new bootstrap.Modal(this.modalElement, {
        backdrop: this.options.backdrop,
        keyboard: this.options.keyboard,
        focus: this.options.focus
      });
      this._attachEvents();
      return;
    }

    // Crear el modal si no existe
    this._createModal();
    this._attachEvents();
  }

  _createModal() {
    const modalHTML = `
      <div class="modal fade" id="${this.options.id}" tabindex="-1" aria-labelledby="${this.options.id}Label" aria-hidden="true">
        <div class="modal-dialog ${this.options.size}">
          <div class="modal-content">
            <div class="modal-header ${this.options.headerClass}">
              <h5 class="modal-title" id="${this.options.id}Label">
                ${this.options.title}
              </h5>
              <button type="button" class="btn-close ${this.options.headerClass.includes('text-white') ? 'btn-close-white' : ''}" 
                      data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="${this.options.id}Body">
              ${this.options.body}
            </div>
            ${
  this.options.footer
    ? `
            <div class="modal-footer" id="${this.options.id}Footer">
              ${this.options.footer}
            </div>
            `
    : ''
}
          </div>
        </div>
      </div>
    `;

    // Insertar el modal en el body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modalElement = document.getElementById(this.options.id);
    this.bootstrapModal = new bootstrap.Modal(this.modalElement, {
      backdrop: this.options.backdrop,
      keyboard: this.options.keyboard,
      focus: this.options.focus
    });
  }

  _attachEvents() {
    if (!this.modalElement) {
      return;
    }

    // Eventos de Bootstrap Modal
    this.modalElement.addEventListener('show.bs.modal', e => {
      if (this.options.onShow) {
        this.options.onShow(e, this);
      }
    });

    this.modalElement.addEventListener('shown.bs.modal', e => {
      if (this.options.onShown) {
        this.options.onShown(e, this);
      }
    });

    this.modalElement.addEventListener('hide.bs.modal', e => {
      if (this.options.onHide) {
        this.options.onHide(e, this);
      }
    });

    this.modalElement.addEventListener('hidden.bs.modal', e => {
      if (this.options.onHidden) {
        this.options.onHidden(e, this);
      }
    });
  }

  /**
   * Muestra el modal
   */
  show() {
    if (this.bootstrapModal) {
      this.bootstrapModal.show();
    }
  }

  /**
   * Oculta el modal
   */
  hide() {
    if (this.bootstrapModal) {
      this.bootstrapModal.hide();
    }
  }

  /**
   * Actualiza el contenido del body del modal
   * @param {string} content - HTML o texto para el body
   */
  setBody(content) {
    const bodyElement = this.modalElement?.querySelector('.modal-body');
    if (bodyElement) {
      bodyElement.innerHTML = content;
    }
  }

  /**
   * Actualiza el título del modal
   * @param {string} title - Nuevo título
   */
  setTitle(title) {
    const titleElement = this.modalElement?.querySelector('.modal-title');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  /**
   * Actualiza el footer del modal
   * @param {string} footer - HTML para el footer
   */
  setFooter(footer) {
    let footerElement = this.modalElement?.querySelector('.modal-footer');
    if (!footerElement && footer) {
      // Crear footer si no existe
      const modalContent = this.modalElement?.querySelector('.modal-content');
      if (modalContent) {
        modalContent.insertAdjacentHTML(
          'beforeend',
          `<div class="modal-footer" id="${this.options.id}Footer">${footer}</div>`
        );
        footerElement = document.getElementById(`${this.options.id}Footer`);
      }
    }
    if (footerElement) {
      footerElement.innerHTML = footer;
    }
  }

  /**
   * Obtiene el elemento del modal
   * @returns {HTMLElement|null}
   */
  getElement() {
    return this.modalElement;
  }

  /**
   * Obtiene el elemento del body
   * @returns {HTMLElement|null}
   */
  getBody() {
    return this.modalElement?.querySelector('.modal-body');
  }

  /**
   * Destruye el modal y lo elimina del DOM
   */
  destroy() {
    if (this.bootstrapModal) {
      this.bootstrapModal.dispose();
    }
    if (this.modalElement) {
      this.modalElement.remove();
    }
    this.modalElement = null;
    this.bootstrapModal = null;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ERPModal = ERPModal;
}
