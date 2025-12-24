/**
 * Sistema de Paginación Genérico
 * Muestra 15 registros por página
 */

class PaginacionManager {
  constructor() {
    this.registrosPorPagina = 15;
    this.paginaActual = 1;
    this.totalRegistros = 0;
    this.registros = [];
  }

  /**
   * Inicializa la paginación con los registros
   * @param {Array} registros - Array de registros a paginar
   * @param {number} registrosPorPagina - Número de registros por página (default: 15)
   */
  inicializar(registros, registrosPorPagina = 15) {
    this.registros = Array.isArray(registros) ? registros : [];
    this.registrosPorPagina = registrosPorPagina;
    this.totalRegistros = this.registros.length;
    this.paginaActual = 1;
  }

  /**
   * Obtiene los registros de la página actual
   * @returns {Array} Registros de la página actual
   */
  obtenerRegistrosPagina() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    return this.registros.slice(inicio, fin);
  }

  /**
   * Calcula el número total de páginas
   * @returns {number} Total de páginas
   */
  obtenerTotalPaginas() {
    return Math.ceil(this.totalRegistros / this.registrosPorPagina);
  }

  /**
   * Cambia a la página especificada
   * @param {number} pagina - Número de página
   */
  irAPagina(pagina) {
    const totalPaginas = this.obtenerTotalPaginas();
    if (pagina >= 1 && pagina <= totalPaginas) {
      this.paginaActual = pagina;
      return true;
    }
    return false;
  }

  /**
   * Va a la página siguiente
   */
  paginaSiguiente() {
    const totalPaginas = this.obtenerTotalPaginas();
    if (this.paginaActual < totalPaginas) {
      this.paginaActual++;
      return true;
    }
    return false;
  }

  /**
   * Va a la página anterior
   */
  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      return true;
    }
    return false;
  }

  /**
   * Genera el HTML de los controles de paginación
   * @param {string} contenedorId - ID del contenedor donde se mostrará la paginación
   * @param {Function} callback - Función a ejecutar cuando cambie la página
   * @returns {string} HTML de los controles de paginación
   */
  generarControlesPaginacion(contenedorId, callback) {
    const totalPaginas = this.obtenerTotalPaginas();

    if (totalPaginas <= 1) {
      return ''; // No mostrar paginación si hay una página o menos
    }

    const inicio = (this.paginaActual - 1) * this.registrosPorPagina + 1;
    const fin = Math.min(this.paginaActual * this.registrosPorPagina, this.totalRegistros);

    let html = `
      <div class="d-flex justify-content-between align-items-center mt-3">
        <div class="text-muted">
          Mostrando ${inicio} - ${fin} de ${this.totalRegistros} registros
        </div>
        <nav aria-label="Paginación">
          <ul class="pagination mb-0">
    `;

    // Botón Anterior
    html += `
      <li class="page-item ${this.paginaActual === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="event.preventDefault(); ${callback}('anterior'); return false;" title="Anterior">
          <i class="fas fa-chevron-left"></i>
        </a>
      </li>
    `;

    // Números de página
    const maxPaginasVisibles = 5;
    let inicioPaginas = Math.max(1, this.paginaActual - Math.floor(maxPaginasVisibles / 2));
    const finPaginas = Math.min(totalPaginas, inicioPaginas + maxPaginasVisibles - 1);

    if (finPaginas - inicioPaginas < maxPaginasVisibles - 1) {
      inicioPaginas = Math.max(1, finPaginas - maxPaginasVisibles + 1);
    }

    // Primera página
    if (inicioPaginas > 1) {
      html += `
        <li class="page-item">
          <a class="page-link" href="#" onclick="event.preventDefault(); ${callback}(1); return false;">1</a>
        </li>
      `;
      if (inicioPaginas > 2) {
        html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
      }
    }

    // Páginas visibles
    for (let i = inicioPaginas; i <= finPaginas; i++) {
      html += `
        <li class="page-item ${i === this.paginaActual ? 'active' : ''}">
          <a class="page-link" href="#" onclick="event.preventDefault(); ${callback}(${i}); return false;">${i}</a>
        </li>
      `;
    }

    // Última página
    if (finPaginas < totalPaginas) {
      if (finPaginas < totalPaginas - 1) {
        html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
      }
      html += `
        <li class="page-item">
          <a class="page-link" href="#" onclick="event.preventDefault(); ${callback}(${totalPaginas}); return false;">${totalPaginas}</a>
        </li>
      `;
    }

    // Botón Siguiente
    html += `
      <li class="page-item ${this.paginaActual === totalPaginas ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="event.preventDefault(); ${callback}('siguiente'); return false;" title="Siguiente">
          <i class="fas fa-chevron-right"></i>
        </a>
      </li>
    `;

    html += `
          </ul>
        </nav>
      </div>
    `;

    return html;
  }
}

// Exponer la clase globalmente
if (typeof window !== 'undefined') {
  window.PaginacionManager = PaginacionManager;
  console.log('✅ PaginacionManager disponible globalmente');
}
