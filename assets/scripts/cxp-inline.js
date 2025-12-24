// Script para manejo del filtro de período en CXP

// Función para formatear el mes y año en texto legible
function formatearMesAnioCXP(mesAnio) {
  if (!mesAnio) {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = ahora.getMonth();
    mesAnio = `${año}-${String(mes + 1).padStart(2, '0')}`;
  }

  const [año, mes] = mesAnio.split('-');
  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ];

  const mesNum = parseInt(mes, 10) - 1;
  const nombreMes = meses[mesNum] || mes;

  return `${nombreMes} ${año}`;
}

// Función para actualizar el texto del período en el top-bar
function actualizarTextoPeriodoCXP() {
  const filtroInput = document.getElementById('filtroMesCXP');
  const periodoElement = document.getElementById('currentPeriodCXP');

  if (filtroInput && periodoElement) {
    const mesAnio = filtroInput.value;
    if (mesAnio) {
      periodoElement.textContent = formatearMesAnioCXP(mesAnio);
    } else {
      // Si no hay valor, establecer mes actual
      const ahora = new Date();
      const año = ahora.getFullYear();
      const mes = String(ahora.getMonth() + 1).padStart(2, '0');
      const mesAnioActual = `${año}-${mes}`;
      periodoElement.textContent = formatearMesAnioCXP(mesAnioActual);
    }
  }
}

// Función para establecer el mes actual en el filtro (se ejecuta inmediatamente)
function establecerMesActualInmediatoCXP() {
  try {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const mesAnio = `${año}-${mes}`;

    const input = document.getElementById('filtroMesCXP');
    if (input && !input.value) {
      input.value = mesAnio;
      actualizarTextoPeriodoCXP();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error estableciendo mes actual en CXP:', error);
    return false;
  }
}

// Inicializar el filtro de mes con el mes y año actual
(function () {
  function configurarFiltroMesCXP() {
    const filtroInput = document.getElementById('filtroMesCXP');
    if (!filtroInput) {
      return false;
    }

    // Establecer el mes y año actual si no tiene valor
    if (!filtroInput.value) {
      const ahora = new Date();
      const año = ahora.getFullYear();
      const mes = String(ahora.getMonth() + 1).padStart(2, '0');
      const mesAnioActual = `${año}-${mes}`;
      filtroInput.value = mesAnioActual;
      console.log(`📅 Filtro de mes CXP configurado a mes y año actual: ${mesAnioActual}`);
    }

    // Actualizar texto del período
    actualizarTextoPeriodoCXP();

    // Configurar listener para cambios (solo una vez)
    if (!filtroInput.hasAttribute('data-listener-configurado')) {
      filtroInput.addEventListener('change', function () {
        console.log('📅 Filtro de mes CXP cambió a:', this.value);
        actualizarTextoPeriodoCXP();
        // Aplicar filtros cuando cambia el mes
        if (typeof aplicarFiltrosCXP === 'function') {
          aplicarFiltrosCXP();
        } else if (window.aplicarFiltrosCXP && typeof window.aplicarFiltrosCXP === 'function') {
          window.aplicarFiltrosCXP();
        }
      });
      filtroInput.setAttribute('data-listener-configurado', 'true');
    }

    return true;
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Establecer mes actual inmediatamente
      establecerMesActualInmediatoCXP();
      // Configurar listener
      configurarFiltroMesCXP();
      // Reintentar para asegurar que se establezca
      setTimeout(() => {
        establecerMesActualInmediatoCXP();
        configurarFiltroMesCXP();
      }, 100);
    });
  } else {
    // DOM ya está listo
    establecerMesActualInmediatoCXP();
    configurarFiltroMesCXP();
    setTimeout(() => {
      establecerMesActualInmediatoCXP();
      configurarFiltroMesCXP();
    }, 100);
  }

  // También intentar después de que la página esté completamente cargada
  window.addEventListener('load', () => {
    establecerMesActualInmediatoCXP();
    configurarFiltroMesCXP();
    actualizarTextoPeriodoCXP();
  });

  // Ejecutar inmediatamente si es posible (para establecer el valor antes del render)
  establecerMesActualInmediatoCXP();
})();
