/**
 * Mantenimiento Page Init
 * Script de inicialización y funciones específicas para la página de mantenimiento
 */

// Nota: El estado del sidebar ahora se maneja mediante sidebar-state.js y sidebar-handler.js
// (igual que en diesel.html)

// ========== SCRIPTS PARA SLIDERS (COMBUSTIBLE Y UREA) ==========
function initSlidersMantenimiento() {
  // Script para el slider de combustible
  const combustibleRangeInput = document.getElementById('nivelCombustible');
  const combustibleRangeOutput = document.getElementById('nivelCombustibleValue');

  if (combustibleRangeInput && combustibleRangeOutput) {
    // Set initial value
    combustibleRangeOutput.textContent = `${combustibleRangeInput.value}%`;

    combustibleRangeInput.addEventListener('input', function () {
      combustibleRangeOutput.textContent = `${this.value}%`;
    });
  }

  // Script para el slider de urea
  const ureaRangeInput = document.getElementById('nivelUrea');
  const ureaRangeOutput = document.getElementById('nivelUreaValue');

  if (ureaRangeInput && ureaRangeOutput) {
    // Set initial value
    ureaRangeOutput.textContent = `${ureaRangeInput.value}%`;

    ureaRangeInput.addEventListener('input', function () {
      ureaRangeOutput.textContent = `${this.value}%`;
    });
  }
}

// ========== SISTEMA DE CARGA BAJO DEMANDA (LAZY LOADING) ==========
// Detectar la ruta base automáticamente basándose en la ubicación de la página
(function () {
  let basePath = 'assets/scripts/'; // Por defecto desde raíz
  try {
    const { pathname } = window.location;
    // Si estamos en pages/, necesitamos subir un nivel
    if (pathname.includes('/pages/')) {
      basePath = '../assets/scripts/';
    } else {
      basePath = 'assets/scripts/';
    }
  } catch (e) {
    // Si falla, usar la ruta por defecto
    console.warn('No se pudo determinar la ruta base, usando ruta por defecto');
    basePath = '../assets/scripts/'; // Asumir que estamos en pages/
  }

  // Solo crear MODULES_CONFIG si no existe ya
  if (!window.MODULES_CONFIG) {
    window.MODULES_CONFIG = {
      print: {
        scripts: [`${basePath}print-pdf.js`],
        loaded: false
      },
      config: {
        scripts: [`${basePath}configuracion.js`],
        loaded: false
      },
      connection: {
        scripts: [`${basePath}connection-monitor.js`],
        loaded: false
      },
      periodo: {
        scripts: [`${basePath}periodo.js`],
        loaded: false
      },
      firebaseForce: {
        scripts: [`${basePath}firebase-force.js`],
        loaded: false
      }
    };
  }
})();

// No declarar MODULES_CONFIG como constante local para evitar errores
// si el script se carga múltiples veces. Usar window.MODULES_CONFIG directamente.

window.loadModule = function (moduleName) {
  if (!window.ScriptLoader) {
    console.error('❌ ScriptLoader no está disponible');
    return Promise.reject(new Error('ScriptLoader no disponible'));
  }
  const module = (window.MODULES_CONFIG || {})[moduleName];
  if (!module) {
    console.error(`❌ Módulo desconocido: ${moduleName}`);
    return Promise.reject(new Error(`Módulo desconocido: ${moduleName}`));
  }
  if (module.loaded) {
    return Promise.resolve();
  }
  console.log(`📦 Cargando módulo: ${moduleName}`);
  return window.ScriptLoader.loadMultiple(module.scripts)
    .then(() => {
      module.loaded = true;
      console.log(`✅ Módulo cargado: ${moduleName}`);
      window.dispatchEvent(new CustomEvent('moduleLoaded', { detail: { module: moduleName } }));
    })
    .catch(error => {
      console.error(`❌ Error cargando módulo ${moduleName}:`, error);
      throw error;
    });
};

window.loadModules = function (moduleNames) {
  // Validar que moduleNames sea un array válido
  if (!moduleNames || !Array.isArray(moduleNames)) {
    console.warn('⚠️ loadModules: moduleNames no es un array válido:', moduleNames);
    return Promise.resolve([]);
  }
  return Promise.all(moduleNames.map(name => window.loadModule(name)));
};

// ========== FUNCIONES DE EXPORTACIÓN ==========
function _descargarCSV(nombreArchivo, filas) {
  const headers = Object.keys(filas[0] || {});
  const csv = [headers.join(',')]
    .concat(
      filas.map(row =>
        headers
          .map(h => {
            const val = row[h] == null ? '' : String(row[h]).replace(/"/g, '""');
            return `"${val}"`;
          })
          .join(',')
      )
    )
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = nombreArchivo.replace(/\.xlsx$/, '.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

window.exportarMantenimientoExcel = async function () {
  try {
    // Función para limpiar texto y corregir encoding
    const limpiarTexto = texto => {
      if (!texto || texto === 'N/A') {
        return texto;
      }
      try {
        let textoLimpio = String(texto);
        // Corregir caracteres mal codificados
        textoLimpio = textoLimpio
          .replace(/Ã¡/g, 'á')
          .replace(/Ã©/g, 'é')
          .replace(/Ã­/g, 'í')
          .replace(/Ã³/g, 'ó')
          .replace(/Ãº/g, 'ú')
          .replace(/Ã±/g, 'ñ')
          .replace(/Ã/g, 'Á')
          .replace(/Ã‰/g, 'É')
          .replace(/Ã/g, 'Í')
          .replace(/Ã"/g, 'Ó')
          .replace(/Ãš/g, 'Ú')
          .replace(/Ã'/g, 'Ñ')
          .replace(/Ã¼/g, 'ü')
          .replace(/Ãœ/g, 'Ü');
        return textoLimpio;
      } catch (e) {
        console.warn('Error limpiando texto:', e);
        return texto;
      }
    };

    // Obtener registros desde Firebase y localStorage
    let registros = [];

    // Intentar desde Firebase primero
    if (window.mantenimientoManager) {
      registros = await window.mantenimientoManager.getMantenimientos();
    }

    // Fallback a localStorage si no hay datos
    if (!Array.isArray(registros) || registros.length === 0) {
      const raw =
        localStorage.getItem('erp_mantenimiento') ||
        localStorage.getItem('erp_mantenimientos') ||
        '[]';
      registros = JSON.parse(raw);
    }

    if (!Array.isArray(registros) || registros.length === 0) {
      alert('No hay registros de Mantenimiento para exportar.');
      return;
    }

    // Función para formatear tipo de mantenimiento
    const formatearTipoMantenimiento = tipo => {
      if (!tipo) {
        return 'N/A';
      }
      const tipos = {
        preventivo: 'Preventivo',
        correctivo: 'Correctivo',
        predictivo: 'Predictivo'
      };
      return tipos[tipo.toLowerCase()] || tipo;
    };

    // Función para formatear fecha
    const formatearFecha = fecha => {
      if (!fecha) {
        return 'N/A';
      }
      try {
        const date = new Date(fecha);
        if (isNaN(date.getTime())) {
          return fecha;
        }
        return date.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      } catch (e) {
        return fecha;
      }
    };

    // Hoja 1: Datos de Mantenimiento
    const rows = registros.map(r => ({
      'Fecha de Servicio': formatearFecha(r.fechaServicio || r.fecha),
      Económico: limpiarTexto(r.economico || 'N/A'),
      Placa: limpiarTexto(r.placas || r.placa || r.Placa || 'N/A'),
      Marca: limpiarTexto(r.marca || 'N/A'),
      Modelo: limpiarTexto(r.modelo || 'N/A'),
      'Kilometraje Actual': r.kilometrajeActual || r.kilometraje || 'N/A',
      'Tipo de Mantenimiento': formatearTipoMantenimiento(r.tipoMantenimiento),
      'Nivel de Combustible':
        r.nivelCombustible !== undefined && r.nivelCombustible !== null
          ? `${r.nivelCombustible}%`
          : 'N/A',
      'Nivel de Urea':
        r.nivelUrea !== undefined && r.nivelUrea !== null ? `${r.nivelUrea}%` : 'N/A',
      'Responsable Técnico': limpiarTexto(r.responsableTecnico || 'N/A'),
      'Tiempo de Ejecución': limpiarTexto(r.tiempoEjecucion || 'N/A'),
      Subcontratación: limpiarTexto(r.subcontratacion || 'N/A'),
      'Servicio Realizado': limpiarTexto(r.servicioRealizado || r.descripcionServicio || 'N/A'),
      'Descripción del Servicio': limpiarTexto(r.descripcionServicio || r.descripcion || 'N/A'),
      'Fecha del Siguiente Servicio': formatearFecha(r.fechaSiguienteServicio),
      'Estado del Económico': limpiarTexto(r.estadoEconomico || 'N/A'),
      'Kilometraje del Siguiente Servicio': r.kilometrajeSiguienteServicio || 'N/A'
    }));

    // Hoja 2: Códigos SKU de Refacciones
    // Crear array de filas con información del mantenimiento asociado
    const skuRows = [];

    registros.forEach(registro => {
      if (Array.isArray(registro.refacciones) && registro.refacciones.length > 0) {
        // Obtener datos del mantenimiento para este registro
        const fechaServicio = formatearFecha(registro.fechaServicio || registro.fecha);
        const economico = limpiarTexto(registro.economico || 'N/A');
        const placa = limpiarTexto(registro.placas || registro.placa || registro.Placa || 'N/A');
        const tipoMantenimiento = formatearTipoMantenimiento(registro.tipoMantenimiento);

        registro.refacciones.forEach(ref => {
          const codigo = ref.codigo || ref.sku || 'N/A';
          const descripcion = ref.descripcion || ref.refaccion || ref.nombre || 'N/A';
          const cantidad = parseFloat(ref.cantidad || 0);
          const almacen = ref.almacen || ref.almacenStock || 'N/A';

          // Obtener stock actual del almacén
          let stockActual = 'N/A';
          try {
            const stockData = JSON.parse(localStorage.getItem('erp_inv_refacciones_stock') || '{}');
            if (stockData[codigo]) {
              const refaccionStock = stockData[codigo];
              if (refaccionStock.almacenes && refaccionStock.almacenes[almacen]) {
                stockActual = refaccionStock.almacenes[almacen].stock || 0;
              } else if (refaccionStock.stock !== undefined) {
                stockActual = refaccionStock.stock;
              }
            }
          } catch (e) {
            console.warn('Error obteniendo stock:', e);
          }

          // Agregar fila con información del mantenimiento y la refacción
          skuRows.push({
            'Fecha de Servicio': fechaServicio,
            Económico: economico,
            Placa: placa,
            'Tipo de Mantenimiento': tipoMantenimiento,
            'Código SKU': limpiarTexto(codigo),
            Descripción: limpiarTexto(descripcion),
            'Almacén Stock': limpiarTexto(String(stockActual !== 'N/A' ? stockActual : almacen)),
            'Cantidad Utilizada': cantidad
          });
        });
      }
    });

    // Si no hay refacciones, crear una fila vacía
    if (skuRows.length === 0) {
      skuRows.push({
        'Fecha de Servicio': 'N/A',
        Económico: 'N/A',
        Placa: 'N/A',
        'Tipo de Mantenimiento': 'N/A',
        'Código SKU': 'N/A',
        Descripción: 'No hay refacciones registradas',
        'Almacén Stock': 'N/A',
        'Cantidad Utilizada': 0
      });
    }

    console.log('📊 Datos para exportar:');
    console.log('  - Registros de mantenimiento:', rows.length);
    console.log('  - Códigos SKU:', skuRows.length);

    // Usar función base común con múltiples hojas
    await window.exportarDatosExcel({
      hojas: [
        { datos: rows, nombreHoja: 'Mantenimiento' },
        { datos: skuRows, nombreHoja: 'Códigos SKU' }
      ],
      nombreArchivo: 'mantenimiento',
      mensajeVacio: 'No hay registros de Mantenimiento para exportar.'
    });

    // Mostrar mensaje de éxito
    console.log('✅ Excel exportado exitosamente con 2 hojas');
    console.log('  - Hoja 1 (Mantenimiento):', rows.length, 'registros');
    console.log('  - Hoja 2 (Códigos SKU):', skuRows.length, 'códigos');
    alert(
      `Excel exportado exitosamente:\n- Hoja 1: ${rows.length} registros de mantenimiento\n- Hoja 2: ${skuRows.length} códigos SKU`
    );
  } catch (error) {
    console.error('Error en exportarMantenimientoExcel:', error);
    alert(`Error al exportar: ${error.message}`);
  }
};

// ========== FUNCIONES PARA SEARCHABLE DROPDOWNS ==========

// Inicializar índices destacados
if (window.ERPState && window.ERPState.setHighlightedIndex) {
  const currentIndex =
    window.ERPState.getHighlightedIndex && window.ERPState.getHighlightedIndex('economico');
  if (currentIndex === undefined || currentIndex === null) {
    window.ERPState.setHighlightedIndex('economico', -1);
  }
}

// Verificar si existe ERPState antes de usarlo
if (window.ERPState && typeof window.ERPState.getCache === 'function') {
  // El caché se inicializará automáticamente cuando se necesite
  // No es necesario inicializarlo aquí
}

// Función para cargar económicos en caché
async function cargarTractocamionesEnCacheMantenimiento() {
  if (window.ERPState && window.ERPState.isLoading && window.ERPState.isLoading('tractocamiones')) {
    return window.ERPState.getCache('economicos') || [];
  }
  if (window.ERPState && window.ERPState.setLoading) {
    window.ERPState.setLoading('tractocamiones', true);
  }

  try {
    let tractocamiones = [];

    // PRIORIDAD 1: Cargar desde Firebase (configuracion/tractocamiones)
    if (window.firebaseDb && window.fs) {
      try {
        const docRef = window.fs.doc(window.firebaseDb, 'configuracion', 'tractocamiones');
        const doc = await window.fs.getDoc(docRef);
        if (doc.exists()) {
          const data = doc.data();
          if (data.economicos && Array.isArray(data.economicos)) {
            const todosLosEconomicos = data.economicos.filter(t => t.deleted !== true);

            // Obtener tenantId actual
            let tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
            if (window.licenseManager && window.licenseManager.isLicenseActive()) {
              const licenseTenantId = window.licenseManager.getTenantId();
              if (licenseTenantId) {
                tenantId = licenseTenantId;
              }
            } else {
              const savedTenantId = localStorage.getItem('tenantId');
              if (savedTenantId) {
                tenantId = savedTenantId;
              }
            }

            // CRÍTICO: Filtrar por tenantId
            tractocamiones = todosLosEconomicos.filter(economico => {
              const economicoTenantId = economico.tenantId;
              return economicoTenantId === tenantId;
            });

            console.log(
              `🔒 Tractocamiones filtrados por tenantId (${tenantId}): ${tractocamiones.length} de ${todosLosEconomicos.length} totales`
            );
          }
        }
      } catch (e) {
        console.warn('⚠️ Error cargando tractocamiones desde Firebase:', e);
      }
    }

    // PRIORIDAD 2: Intentar desde configuracionManager
    if (tractocamiones.length === 0 && window.configuracionManager) {
      if (typeof window.configuracionManager.getAllEconomicos === 'function') {
        tractocamiones = window.configuracionManager.getAllEconomicos() || [];
        console.log('✅ Tractocamiones cargados desde getAllEconomicos:', tractocamiones.length);
      }
    }

    // Actualizar caché global
    if (window.ERPState && window.ERPState.setCache) {
      window.ERPState.setCache('economicos', tractocamiones);
      window.ERPState.setCache('economicosAlt', tractocamiones);
    }

    return tractocamiones;
  } catch (error) {
    console.error('❌ Error cargando tractocamiones en caché:', error);
    if (window.ERPState && window.ERPState.setCache) {
      window.ERPState.setCache('economicos', []);
    }
    return [];
  } finally {
    if (window.ERPState && window.ERPState.setLoading) {
      window.ERPState.setLoading('tractocamiones', false);
    }
  }
}

// Función para actualizar posición del dropdown (position: fixed)
function actualizarPosicionDropdownMantenimiento(input, dropdown) {
  if (!input || !dropdown) {
    console.warn('⚠️ actualizarPosicionDropdownMantenimiento: input o dropdown no encontrado');
    return;
  }

  const calcularYPosicionar = () => {
    try {
      const rect = input.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (!window._economicoDropdownShouldBeHidden && document.activeElement === input) {
              calcularYPosicionar();
            }
          }, 50);
        });
        return;
      }

      if (dropdown.parentElement !== document.body) {
        const originalParent = dropdown.parentElement;
        document.body.appendChild(dropdown);
        dropdown._originalParent = originalParent;
      }

      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownMaxHeight = 300;

      let top = rect.bottom + 2;
      let { left } = rect;
      const width = Math.max(rect.width, 200);

      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      let dropdownHeight = dropdown.scrollHeight || dropdownMaxHeight;
      dropdownHeight = Math.min(dropdownHeight, dropdownMaxHeight);

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        top = rect.top - dropdownHeight - 2;
        if (top < 10) {
          const availableSpace = rect.top - 10;
          if (availableSpace < dropdownHeight) {
            top = 10;
          } else {
            top = rect.top - dropdownHeight - 2;
            if (top < 10) {
              top = 10;
            }
          }
        }
      } else if (top + dropdownHeight > viewportHeight) {
        top = Math.max(10, viewportHeight - dropdownHeight - 10);
      }

      if (left + width > viewportWidth) {
        left = Math.max(10, viewportWidth - width - 10);
      }
      if (left < 0) {
        left = 10;
      }

      dropdown.style.cssText = `
        position: fixed !important;
        top: ${top}px !important;
        left: ${left}px !important;
        width: ${width}px !important;
        max-height: ${dropdownMaxHeight}px !important;
        z-index: 999999 !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        background-color: #fff !important;
        border: 1px solid #ced4da !important;
        border-radius: 0.375rem !important;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        pointer-events: auto !important;
      `;
    } catch (error) {
      console.error('❌ Error actualizando posición del dropdown:', error);
    }
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      calcularYPosicionar();
      const modal = input.closest('.modal');
      if (modal) {
        setTimeout(() => {
          calcularYPosicionar();
        }, 100);
      }
    });
  });
}

// ========== FUNCIONES PARA ECONÓMICOS ==========

// Variable global para rastrear si el dropdown debe estar oculto
window._economicoDropdownShouldBeHidden = false;
window._economicoDropdownPendingTimeouts = [];

async function filtrarEconomicosMantenimiento(busqueda) {
  const input = document.getElementById('economico');
  const dropdown = document.getElementById('economico_dropdown');
  const _hiddenInput = document.getElementById('economico_value');

  if (!input || !dropdown) {
    return;
  }

  // Si el dropdown debe estar oculto, no mostrar nada
  if (window._economicoDropdownShouldBeHidden) {
    return;
  }

  // Cancelar timeouts pendientes anteriores
  window._economicoDropdownPendingTimeouts.forEach(timeout => clearTimeout(timeout));
  window._economicoDropdownPendingTimeouts = [];

  const termino = busqueda.toLowerCase().trim();
  dropdown.innerHTML = '';
  if (window.ERPState && typeof window.ERPState.setHighlightedIndex === 'function') {
    window.ERPState.setHighlightedIndex('economico', -1);
  }

  if (termino.length === 0) {
    dropdown.classList.remove('show');
    return;
  }

  // Verificar y recargar caché si está vacío
  if (
    !window.ERPState.getCache('economicos') ||
    window.ERPState.getCache('economicos').length === 0
  ) {
    console.log('🔄 Caché de económicos vacío en filtrarEconomicosMantenimiento, recargando...');
    await cargarTractocamionesEnCacheMantenimiento();
  }

  // Verificar nuevamente después de cargar
  const economicosCache = window.ERPState.getCache('economicos');
  if (!economicosCache || economicosCache.length === 0) {
    console.warn('⚠️ No hay económicos disponibles después de cargar');
    dropdown.innerHTML =
      '<div class="searchable-select-no-results">No hay económicos disponibles</div>';
    setTimeout(() => {
      actualizarPosicionDropdownMantenimiento(input, dropdown);
      dropdown.classList.add('show');
      void dropdown.offsetHeight;
      requestAnimationFrame(() => {
        dropdown.style.setProperty('display', 'block', 'important');
        dropdown.style.setProperty('visibility', 'visible', 'important');
        dropdown.style.setProperty('opacity', '1', 'important');
        dropdown.style.setProperty('z-index', '999999', 'important');
        void dropdown.offsetHeight;
      });
    }, 10);
    return;
  }

  const filtrados = economicosCache.filter(e => {
    const numero = (e.numero || e.nombre || '').toString().toLowerCase();
    const placa = (e.placaTracto || e.placa || '').toString().toLowerCase();
    const marca = (e.marca || '').toString().toLowerCase();
    const modelo = (e.modelo || '').toString().toLowerCase();
    return (
      numero.includes(termino) ||
      placa.includes(termino) ||
      marca.includes(termino) ||
      modelo.includes(termino)
    );
  });

  if (filtrados.length === 0) {
    dropdown.innerHTML =
      '<div class="searchable-select-no-results">No se encontraron resultados</div>';
    setTimeout(() => {
      actualizarPosicionDropdownMantenimiento(input, dropdown);
      dropdown.classList.add('show');
      void dropdown.offsetHeight;
      requestAnimationFrame(() => {
        dropdown.style.setProperty('display', 'block', 'important');
        dropdown.style.setProperty('visibility', 'visible', 'important');
        dropdown.style.setProperty('opacity', '1', 'important');
        dropdown.style.setProperty('z-index', '999999', 'important');
        void dropdown.offsetHeight;
      });
    }, 10);
    return;
  }

  const limitados = filtrados.slice(0, 20);
  limitados.forEach((economico, index) => {
    const item = document.createElement('div');
    item.className = 'searchable-select-item';
    item.dataset.index = index;

    const numero = economico.numero || economico.nombre || 'N/A';
    const placa = economico.placaTracto || economico.placa || '';
    const marca = economico.marca || '';
    const modelo = economico.modelo || '';

    let texto = numero;
    if (marca || modelo) {
      texto += ` - ${marca} ${modelo}`.trim();
    }
    if (placa) {
      texto += ` (${placa})`;
    }

    item.innerHTML = `<div class="item-text">${texto}</div>`;

    item.addEventListener('mousedown', e => {
      e.preventDefault(); // Prevenir que el blur se ejecute antes
      seleccionarEconomicoMantenimiento(economico, numero);
    });
    dropdown.appendChild(item);
  });

  if (filtrados.length > 20) {
    const masItem = document.createElement('div');
    masItem.className = 'searchable-select-no-results';
    masItem.innerHTML = `<small>... y ${filtrados.length - 20} más. Continúe escribiendo para filtrar.</small>`;
    dropdown.appendChild(masItem);
  }

  // Calcular posición para position: fixed
  setTimeout(() => {
    actualizarPosicionDropdownMantenimiento(input, dropdown);
    dropdown.classList.add('show');
    void dropdown.offsetHeight;
    requestAnimationFrame(() => {
      dropdown.style.setProperty('display', 'block', 'important');
      dropdown.style.setProperty('visibility', 'visible', 'important');
      dropdown.style.setProperty('opacity', '1', 'important');
      dropdown.style.setProperty('z-index', '999999', 'important');
    });
  }, 10);

  // Agregar listener para cerrar al hacer click fuera (si no existe)
  setTimeout(() => {
    const ocultarDropdown = e => {
      if (!dropdown.contains(e.target) && !input.contains(e.target)) {
        // Restaurar dropdown a su contenedor original y limpiar estilos antes de ocultar
        if (dropdown._originalParent && dropdown.parentElement === document.body) {
          dropdown.style.cssText = '';
          dropdown._originalParent.appendChild(dropdown);
          dropdown._originalParent = null;
        } else {
          dropdown.style.cssText = '';
        }
        dropdown.classList.remove('show');
        document.removeEventListener('click', ocultarDropdown);
      }
    };
    document.addEventListener('click', ocultarDropdown);
  }, 100);
}

async function mostrarDropdownEconomicosMantenimiento() {
  const input = document.getElementById('economico');
  const dropdown = document.getElementById('economico_dropdown');

  if (!input || !dropdown) {
    return;
  }

  // Resetear la bandera cuando se solicita mostrar explícitamente
  window._economicoDropdownShouldBeHidden = false;

  // Verificar y recargar caché si está vacío
  if (
    !window.ERPState.getCache('economicos') ||
    window.ERPState.getCache('economicos').length === 0
  ) {
    console.log(
      '🔄 Caché de económicos vacío en mostrarDropdownEconomicosMantenimiento, recargando...'
    );
    await cargarTractocamionesEnCacheMantenimiento();
  }

  if (input.value.trim().length > 0) {
    filtrarEconomicosMantenimiento(input.value);
  } else {
    if (
      !window.ERPState.getCache('economicos') ||
      window.ERPState.getCache('economicos').length === 0
    ) {
      if (typeof cargarTractocamionesEnCacheMantenimiento === 'function') {
        cargarTractocamionesEnCacheMantenimiento().then(() => {
          // Verificar nuevamente antes de continuar
          if (!window._economicoDropdownShouldBeHidden && document.activeElement === input) {
            mostrarDropdownEconomicosMantenimiento();
          }
        });
        return;
      }
    }

    const limitados = window.ERPState.getCache('economicos').slice(0, 20);
    dropdown.innerHTML = '';

    limitados.forEach(economico => {
      const item = document.createElement('div');
      item.className = 'searchable-select-item';

      const numero = economico.numero || economico.nombre || 'N/A';
      const placa = economico.placaTracto || economico.placa || '';
      const marca = economico.marca || '';
      const modelo = economico.modelo || '';

      let texto = numero;
      if (marca || modelo) {
        texto += ` - ${marca} ${modelo}`.trim();
      }
      if (placa) {
        texto += ` (${placa})`;
      }

      item.innerHTML = `<div class="item-text">${texto}</div>`;
      item.addEventListener('mousedown', e => {
        e.preventDefault(); // Prevenir que el blur se ejecute antes
        seleccionarEconomicoMantenimiento(economico, numero);
      });
      dropdown.appendChild(item);
    });

    // Calcular posición y mostrar
    setTimeout(() => {
      actualizarPosicionDropdownMantenimiento(input, dropdown);
      dropdown.classList.add('show');
      console.log('✅ Dropdown de económicos mostrado, elementos:', limitados.length);
    }, 10);

    // Ocultar dropdown al hacer clic fuera
    setTimeout(() => {
      const ocultarDropdown = e => {
        if (!dropdown.contains(e.target) && !input.contains(e.target)) {
          // Restaurar dropdown a su contenedor original y limpiar estilos antes de ocultar
          if (dropdown._originalParent && dropdown.parentElement === document.body) {
            dropdown.style.cssText = '';
            dropdown._originalParent.appendChild(dropdown);
            dropdown._originalParent = null;
          } else {
            dropdown.style.cssText = '';
          }
          dropdown.classList.remove('show');
          document.removeEventListener('click', ocultarDropdown);
        }
      };
      document.addEventListener('click', ocultarDropdown);
    }, 100);
  }
}

function ocultarDropdownEconomicosMantenimiento(immediate = false) {
  const dropdown = document.getElementById('economico_dropdown');
  const input = document.getElementById('economico');

  if (!dropdown) {
    return;
  }

  // ESTABLECER BANDERA PRIMERO para prevenir que se muestre de nuevo
  window._economicoDropdownShouldBeHidden = true;

  // Cancelar TODOS los timeouts pendientes
  window._economicoDropdownPendingTimeouts.forEach(timeout => clearTimeout(timeout));
  window._economicoDropdownPendingTimeouts = [];

  const ocultarYRestaurar = () => {
    if (!dropdown) {
      return;
    }

    // Limpiar contenido del dropdown
    dropdown.innerHTML = '';

    // Remover clase 'show' y agregar 'hidden-force'
    dropdown.classList.remove('show');
    dropdown.classList.add('hidden-force');

    // Forzar ocultación con estilos inline !important
    dropdown.style.cssText = `
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      position: static !important;
      top: auto !important;
      left: auto !important;
      width: auto !important;
      height: 0 !important;
      max-height: 0 !important;
      z-index: -1 !important;
      overflow: hidden !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      box-shadow: none !important;
    `;

    // Restaurar al contenedor original si fue movido al body
    if (dropdown._originalParent && dropdown.parentElement === document.body) {
      try {
        dropdown._originalParent.appendChild(dropdown);
        dropdown._originalParent = null;

        // Aplicar estilos nuevamente después de restaurar
        dropdown.style.cssText = `
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        `;
      } catch (error) {
        console.error('❌ Error restaurando dropdown:', error);
      }
    }

    // Forzar un reflow para asegurar que los cambios se apliquen
    void dropdown.offsetHeight;
  };

  if (!immediate) {
    // Delay solo si no es inmediato y el dropdown sigue visible
    const timeout = setTimeout(() => {
      const dropdownCheck = document.getElementById('economico_dropdown');
      if (dropdownCheck && dropdownCheck.classList.contains('show')) {
        // No ocultar si el mouse está sobre el dropdown o el input
        if (
          dropdownCheck.matches(':hover') ||
          dropdownCheck.querySelector(':hover') ||
          (input && (input.matches(':hover') || input === document.activeElement))
        ) {
          // Si el mouse sigue ahí, no ocultar pero mantener la bandera
          return;
        }
        ocultarYRestaurar();
      }
    }, 250);
    window._economicoDropdownPendingTimeouts.push(timeout);
  } else {
    // Ocultar inmediatamente
    ocultarYRestaurar();
  }
}

function seleccionarEconomicoMantenimiento(economico, valor) {
  const input = document.getElementById('economico');
  const _dropdown = document.getElementById('economico_dropdown');
  const _hiddenInput = document.getElementById('economico_value');

  if (!input) {
    console.warn('⚠️ [seleccionarEconomicoMantenimiento] No se encontró el input económico');
    return;
  }

  // Establecer bandera para ocultar dropdown
  window._economicoDropdownShouldBeHidden = true;

  // Cancelar todos los timeouts pendientes
  window._economicoDropdownPendingTimeouts.forEach(timeout => clearTimeout(timeout));
  window._economicoDropdownPendingTimeouts = [];

  const numero = economico.numero || economico.nombre || valor;
  const placa = economico.placaTracto || economico.placa || '';
  const marca = economico.marca || '';
  const modelo = economico.modelo || '';

  let texto = numero;
  if (marca || modelo) {
    texto += ` - ${marca} ${modelo}`.trim();
  }
  if (placa) {
    texto += ` (${placa})`;
  }

  console.log('🔄 [seleccionarEconomicoMantenimiento] Seleccionando económico:', { numero, texto });

  // Establecer el valor inmediatamente y también después de un pequeño delay para asegurar que se establezca
  input.value = texto;
  if (_hiddenInput) {
    _hiddenInput.value = numero;
    console.log('✅ [seleccionarEconomicoMantenimiento] Hidden input establecido:', numero);
  }

  // Usar setTimeout para asegurar que el valor se establezca incluso si hay un blur pendiente
  setTimeout(() => {
    input.value = texto;
    if (_hiddenInput) {
      _hiddenInput.value = numero;
    }
    console.log('✅ [seleccionarEconomicoMantenimiento] Valor confirmado después del delay');

    // Disparar evento input para notificar a otros listeners
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, 10);

  // Llenar los campos directamente con los datos del económico seleccionado
  const inputPlacas = document.getElementById('Placa');
  const inputMarca = document.getElementById('marca');
  const inputModelo = document.getElementById('modelo');

  if (inputPlacas) {
    inputPlacas.value = placa;
  }
  if (inputMarca) {
    inputMarca.value = marca;
  }
  if (inputModelo) {
    inputModelo.value = modelo;
  }

  console.log('✅ [seleccionarEconomicoMantenimiento] Campos llenados:', {
    numero,
    placa,
    marca,
    modelo
  });

  // Ocultar dropdown completamente
  ocultarDropdownEconomicosMantenimiento(true);

  // También llamar a la función existente como respaldo (por si acaso)
  if (typeof loadPlacasMantenimiento === 'function') {
    loadPlacasMantenimiento();
  }
}

async function desplegarListaEconomicosMantenimiento() {
  const input = document.getElementById('economico');
  const dropdown = document.getElementById('economico_dropdown');

  if (!input || !dropdown) {
    console.warn('⚠️ desplegarListaEconomicosMantenimiento: input o dropdown no encontrado');
    return;
  }

  // Resetear la bandera
  window._economicoDropdownShouldBeHidden = false;

  // Verificar y recargar caché si está vacío
  if (
    !window.ERPState.getCache('economicos') ||
    window.ERPState.getCache('economicos').length === 0
  ) {
    console.log('🔄 Caché de económicos vacío, recargando...');
    await cargarTractocamionesEnCacheMantenimiento();
  }

  if (
    !window.ERPState.getCache('economicos') ||
    window.ERPState.getCache('economicos').length === 0
  ) {
    console.warn('⚠️ No hay económicos disponibles');
    dropdown.innerHTML =
      '<div class="searchable-select-no-results">No hay económicos disponibles</div>';
    setTimeout(() => {
      actualizarPosicionDropdownMantenimiento(input, dropdown);
      dropdown.classList.add('show');
      void dropdown.offsetHeight;
      requestAnimationFrame(() => {
        dropdown.style.setProperty('display', 'block', 'important');
        dropdown.style.setProperty('visibility', 'visible', 'important');
        dropdown.style.setProperty('opacity', '1', 'important');
        dropdown.style.setProperty('z-index', '999999', 'important');
        void dropdown.offsetHeight;
      });
    }, 10);
    return;
  }

  // Limpiar búsqueda y mostrar todos
  const limitados = window.ERPState.getCache('economicos').slice(0, 50);
  dropdown.innerHTML = '';

  limitados.forEach(economico => {
    const item = document.createElement('div');
    item.className = 'searchable-select-item';

    const numero = economico.numero || economico.nombre || 'N/A';
    const placa = economico.placaTracto || economico.placa || '';
    const marca = economico.marca || '';
    const modelo = economico.modelo || '';

    let texto = numero;
    if (marca || modelo) {
      texto += ` - ${marca} ${modelo}`.trim();
    }
    if (placa) {
      texto += ` (${placa})`;
    }

    item.innerHTML = `<div class="item-text">${texto}</div>`;
    item.addEventListener('mousedown', e => {
      e.preventDefault();
      seleccionarEconomicoMantenimiento(economico, numero);
    });
    dropdown.appendChild(item);
  });

  if (window.ERPState.getCache('economicos').length > 50) {
    const masItem = document.createElement('div');
    masItem.className = 'searchable-select-no-results';
    masItem.innerHTML = `<small>Mostrando 50 de ${window.ERPState.getCache('economicos').length} económicos. Use la búsqueda para filtrar.</small>`;
    dropdown.appendChild(masItem);
  }

  // Calcular posición y mostrar
  setTimeout(() => {
    actualizarPosicionDropdownMantenimiento(input, dropdown);
    dropdown.classList.add('show');
    console.log('✅ Dropdown de económicos mostrado, elementos:', limitados.length);
  }, 10);

  // Ocultar dropdown al hacer clic fuera
  setTimeout(() => {
    const ocultarDropdown = e => {
      if (!dropdown.contains(e.target) && !input.contains(e.target)) {
        // Restaurar dropdown a su contenedor original y limpiar estilos antes de ocultar
        if (dropdown._originalParent && dropdown.parentElement === document.body) {
          dropdown.style.cssText = '';
          dropdown._originalParent.appendChild(dropdown);
          dropdown._originalParent = null;
        } else {
          dropdown.style.cssText = '';
        }
        dropdown.classList.remove('show');
        document.removeEventListener('click', ocultarDropdown);
      }
    };
    document.addEventListener('click', ocultarDropdown);
  }, 100);
}

function manejarTecladoEconomicosMantenimiento(event) {
  const dropdown = document.getElementById('economico_dropdown');
  const items = dropdown?.querySelectorAll('.searchable-select-item');

  if (!items || items.length === 0) {
    return;
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (
      window.ERPState &&
      typeof window.ERPState.getHighlightedIndex === 'function' &&
      typeof window.ERPState.setHighlightedIndex === 'function'
    ) {
      const currentIndex = window.ERPState.getHighlightedIndex('economico');
      const newIndex = Math.min((currentIndex || -1) + 1, items.length - 1);
      window.ERPState.setHighlightedIndex('economico', newIndex);
      items.forEach((item, index) => {
        item.classList.toggle('highlighted', index === newIndex);
      });
      items[newIndex]?.scrollIntoView({ block: 'nearest' });
    }
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (
      window.ERPState &&
      typeof window.ERPState.getHighlightedIndex === 'function' &&
      typeof window.ERPState.setHighlightedIndex === 'function'
    ) {
      const currentIndex = window.ERPState.getHighlightedIndex('economico');
      const newIndex = Math.max((currentIndex || -1) - 1, -1);
      window.ERPState.setHighlightedIndex('economico', newIndex);
      items.forEach((item, index) => {
        item.classList.toggle('highlighted', index === newIndex);
      });
      if (newIndex >= 0) {
        items[newIndex]?.scrollIntoView({ block: 'nearest' });
      }
    }
  } else if (event.key === 'Enter') {
    event.preventDefault();
    if (window.ERPState && typeof window.ERPState.getHighlightedIndex === 'function') {
      const currentIndex = window.ERPState.getHighlightedIndex('economico');
      if (currentIndex >= 0 && items[currentIndex]) {
        items[currentIndex].click();
      }
    }
  } else if (event.key === 'Escape') {
    ocultarDropdownEconomicosMantenimiento();
  }
}

// Exponer funciones globalmente
window.filtrarEconomicosMantenimiento = filtrarEconomicosMantenimiento;
window.mostrarDropdownEconomicosMantenimiento = mostrarDropdownEconomicosMantenimiento;
window.ocultarDropdownEconomicosMantenimiento = ocultarDropdownEconomicosMantenimiento;
window.seleccionarEconomicoMantenimiento = seleccionarEconomicoMantenimiento;
window.manejarTecladoEconomicosMantenimiento = manejarTecladoEconomicosMantenimiento;
window.desplegarListaEconomicosMantenimiento = desplegarListaEconomicosMantenimiento;

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 [mantenimiento.html] Cargando mantenimiento (script inline)...');

  // Inicializar sliders
  initSlidersMantenimiento();

  // Configurar event listeners para el input económico principal
  const economicoInput = document.getElementById('economico');
  if (economicoInput && !economicoInput.hasAttribute('data-listeners-attached')) {
    economicoInput.addEventListener('focus', () => {
      // Resetear la bandera cuando el input recibe foco
      window._economicoDropdownShouldBeHidden = false;
      if (typeof window.mostrarDropdownEconomicosMantenimiento === 'function') {
        window.mostrarDropdownEconomicosMantenimiento();
      }
    });

    economicoInput.addEventListener('blur', () => {
      setTimeout(() => {
        if (typeof window.ocultarDropdownEconomicosMantenimiento === 'function') {
          window.ocultarDropdownEconomicosMantenimiento();
        }
      }, 250);
    });

    economicoInput.addEventListener('keydown', event => {
      if (typeof window.manejarTecladoEconomicosMantenimiento === 'function') {
        window.manejarTecladoEconomicosMantenimiento(event);
      }
    });

    // Ocultar dropdown al hacer clic fuera (solo una vez, usando flag)
    if (!window._economicoDropdownClickHandlerAttached) {
      const clickHandler = function (event) {
        const dropdown = document.getElementById('economico_dropdown');
        const input = document.getElementById('economico');

        if (!dropdown) {
          return;
        }

        // Verificar si el dropdown está visible
        const isVisible =
          dropdown.classList.contains('show') &&
          window.getComputedStyle(dropdown).display !== 'none' &&
          window.getComputedStyle(dropdown).visibility !== 'hidden';

        if (!isVisible) {
          return;
        }

        const { target } = event;

        // Verificar si el click es en el input o sus elementos relacionados
        const inputGroup = input?.closest('.input-group');
        const wrapper = input?.closest('.searchable-select-wrapper');
        const button = inputGroup?.querySelector(
          'button[data-action="mostrarDropdownEconomicosMantenimiento"]'
        );

        // Verificar si el click es dentro de elementos relacionados
        const isClickOnInput = input && (input === target || input.contains(target));
        const isClickOnDropdown = dropdown && (dropdown === target || dropdown.contains(target));
        const isClickOnButton = button && (button === target || button.contains(target));
        const isClickOnWrapper = wrapper && (wrapper === target || wrapper.contains(target));
        const isClickOnInputGroup =
          inputGroup && (inputGroup === target || inputGroup.contains(target));

        // Si el click NO es en ninguno de estos elementos, ocultar el dropdown
        if (
          !isClickOnInput &&
          !isClickOnDropdown &&
          !isClickOnButton &&
          !isClickOnWrapper &&
          !isClickOnInputGroup
        ) {
          console.log('🖱️ Click fuera del dropdown, ocultando...');

          // Ocultar inmediatamente
          if (typeof window.ocultarDropdownEconomicosMantenimiento === 'function') {
            window.ocultarDropdownEconomicosMantenimiento(true); // immediate = true
          } else {
            // Fallback si la función no está disponible
            dropdown.classList.remove('show');
            dropdown.classList.add('hidden-force');
            dropdown.style.cssText =
              'display: none !important; visibility: hidden !important; opacity: 0 !important;';
          }
        }
      };

      // Usar capture phase para capturar antes que otros eventos
      document.addEventListener('click', clickHandler, true);
      window._economicoDropdownClickHandlerAttached = true;
      console.log('✅ Listener de click fuera agregado para dropdown económico');
    }

    // Ocultar dropdown al hacer scroll (solo una vez, usando flag)
    if (!window._economicoDropdownScrollHandlerAttached) {
      let scrollTimeout;
      const scrollHandler = function () {
        const dropdown = document.getElementById('economico_dropdown');
        if (!dropdown) {
          return;
        }

        // Verificar si el dropdown está visible
        const isVisible =
          dropdown.classList.contains('show') &&
          window.getComputedStyle(dropdown).display !== 'none' &&
          window.getComputedStyle(dropdown).visibility !== 'hidden';

        if (isVisible) {
          // Usar debounce para evitar demasiadas llamadas
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            const dropdownCheck = document.getElementById('economico_dropdown');
            if (dropdownCheck && dropdownCheck.classList.contains('show')) {
              if (typeof window.ocultarDropdownEconomicosMantenimiento === 'function') {
                window.ocultarDropdownEconomicosMantenimiento(true); // immediate = true
              } else {
                // Fallback si la función no está disponible
                dropdownCheck.classList.remove('show');
                dropdownCheck.classList.add('hidden-force');
                dropdownCheck.style.cssText =
                  'display: none !important; visibility: hidden !important; opacity: 0 !important;';
              }
            }
          }, 50);
        }
      };

      // Agregar listeners de scroll en múltiples elementos para capturar todos los scrolls
      window.addEventListener('scroll', scrollHandler, { passive: true, capture: true });
      document.addEventListener('scroll', scrollHandler, { passive: true, capture: true });

      // También escuchar scroll en elementos scrollables dentro de la página
      const handleScrollableScroll = function (e) {
        scrollHandler(e);
      };

      // Agregar listeners a elementos scrollables comunes después de que el DOM esté listo
      setTimeout(() => {
        const scrollableElements = document.querySelectorAll(
          '.content-wrapper, .card-body, .table-responsive, .main-content'
        );
        scrollableElements.forEach(el => {
          el.addEventListener('scroll', handleScrollableScroll, { passive: true });
        });
      }, 500);

      window._economicoDropdownScrollHandlerAttached = true;
      console.log('✅ Listener de scroll agregado para dropdown económico');
    }

    economicoInput.setAttribute('data-listeners-attached', 'true');
  }

  // Cargar módulo de conexión
  setTimeout(() => {
    window
      .loadModule('connection')
      .catch(err => console.warn('No se pudo cargar módulo connection:', err));
  }, 1000);

  // Esperar un poco para que mantenimiento.js se cargue
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Cargar caché para los searchable dropdowns
  setTimeout(async () => {
    await cargarTractocamionesEnCacheMantenimiento();
  }, 500);
});
