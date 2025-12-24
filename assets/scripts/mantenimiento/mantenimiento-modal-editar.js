/**
 * Módulo para el Modal de Edición de Mantenimiento
 * Maneja toda la funcionalidad del modal de edición
 */

(function () {
  'use strict';

  // Variable para almacenar refacciones disponibles en el modal
  let todasLasRefaccionesEditar = [];
  window.contadorRefaccionesEditar = 0;

  /**
   * Inicializar el modal cuando se muestra
   */
  function inicializarModalEditar() {
    const modalEditar = document.getElementById('modalEditarMantenimiento');
    if (!modalEditar) {
      return;
    }

    // Inicializar sliders cuando se muestra el modal
    modalEditar.addEventListener('shown.bs.modal', () => {
      inicializarSlidersModal();

      // Configurar listeners del dropdown de económico
      const economicoInput = document.getElementById('editarMantenimiento_economico');
      if (economicoInput && !economicoInput.hasAttribute('data-listeners-attached')) {
        economicoInput.addEventListener('focus', () => {
          if (typeof window.mostrarDropdownEconomicosMantenimientoEditar === 'function') {
            window.mostrarDropdownEconomicosMantenimientoEditar();
          }
        });

        economicoInput.addEventListener('blur', () => {
          setTimeout(() => {
            if (typeof window.ocultarDropdownEconomicosMantenimientoEditar === 'function') {
              window.ocultarDropdownEconomicosMantenimientoEditar();
            }
          }, 250);
        });

        economicoInput.addEventListener('keydown', event => {
          if (typeof window.manejarTecladoEconomicosMantenimientoEditar === 'function') {
            window.manejarTecladoEconomicosMantenimientoEditar(event);
          }
        });

        // Ocultar dropdown al hacer clic fuera (solo una vez, usando flag)
        if (!window._economicoDropdownModalClickHandlerAttached) {
          const clickHandler = function (event) {
            const dropdown = document.getElementById('editarMantenimiento_economico_dropdown');
            const input = document.getElementById('editarMantenimiento_economico');

            // Solo procesar si el dropdown está visible
            if (!dropdown || !dropdown.classList.contains('show')) {
              return;
            }

            const { target } = event;

            // Verificar si el click es en el input o sus elementos relacionados
            const inputGroup = input?.closest('.input-group');
            const wrapper = input?.closest('.searchable-select-wrapper');
            const button = inputGroup?.querySelector(
              'button[data-action="mostrarDropdownEconomicosMantenimientoEditar"]'
            );

            // Verificar si el click es dentro de elementos relacionados
            const isClickOnInput = input && (input === target || input.contains(target));
            const isClickOnDropdown =
              dropdown && (dropdown === target || dropdown.contains(target));
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
              console.log('🖱️ Click fuera del dropdown del modal, ocultando...');

              // Ocultar inmediatamente
              if (typeof window.ocultarDropdownEconomicosMantenimientoEditar === 'function') {
                window.ocultarDropdownEconomicosMantenimientoEditar(true); // immediate = true
              }
            }
          };

          // Usar capture phase para capturar antes que otros eventos
          document.addEventListener('click', clickHandler, true);
          window._economicoDropdownModalClickHandlerAttached = true;
          console.log('✅ Listener de click fuera agregado para dropdown económico del modal');
        }

        // Ocultar dropdown al hacer scroll (solo una vez, usando flag)
        if (!window._economicoDropdownModalScrollHandlerAttached) {
          let scrollTimeout;
          const scrollHandler = function () {
            const dropdown = document.getElementById('editarMantenimiento_economico_dropdown');
            if (dropdown && dropdown.classList.contains('show')) {
              // Usar debounce para evitar demasiadas llamadas
              clearTimeout(scrollTimeout);
              scrollTimeout = setTimeout(() => {
                if (typeof window.ocultarDropdownEconomicosMantenimientoEditar === 'function') {
                  window.ocultarDropdownEconomicosMantenimientoEditar(true); // immediate = true
                }
              }, 100);
            }
          };

          window.addEventListener('scroll', scrollHandler, { passive: true });
          window._economicoDropdownModalScrollHandlerAttached = true;
          console.log('✅ Listener de scroll agregado para dropdown económico del modal');
        }

        economicoInput.setAttribute('data-listeners-attached', 'true');
        console.log('✅ Listeners del dropdown económico configurados en el modal');
      }

      // Cargar económicos si están disponibles (asegurar que estén listos)
      if (typeof window.loadEconomicosMantenimiento === 'function') {
        // Cargar económicos en segundo plano para que estén listos cuando se necesiten
        window.loadEconomicosMantenimiento().catch(err => {
          console.warn('⚠️ Error precargando económicos:', err);
        });
      }

      // Actualizar lista de refacciones
      setTimeout(() => {
        if (typeof window.actualizarListaRefaccionesEditar === 'function') {
          window.actualizarListaRefaccionesEditar();
        }
      }, 300);
    });

    // Limpiar refacciones cuando se cierra el modal
    modalEditar.addEventListener('hidden.bs.modal', () => {
      limpiarRefaccionesModal();

      // Limpiar datos del económico guardados
      if (window._editarMantenimientoEconomicoData) {
        delete window._editarMantenimientoEconomicoData;
        console.log('🧹 Datos del económico limpiados al cerrar el modal');
      }
    });
  }

  /**
   * Inicializar sliders del modal
   */
  function inicializarSlidersModal() {
    // Slider de combustible
    const combustibleSlider = document.getElementById('editarMantenimiento_nivelCombustible');
    const combustibleOutput = document.getElementById('editarMantenimiento_nivelCombustibleValue');
    if (combustibleSlider && combustibleOutput) {
      combustibleSlider.addEventListener('input', function () {
        combustibleOutput.textContent = `${this.value}%`;
      });
      combustibleOutput.textContent = `${combustibleSlider.value}%`;
    }

    // Slider de urea
    const ureaSlider = document.getElementById('editarMantenimiento_nivelUrea');
    const ureaOutput = document.getElementById('editarMantenimiento_nivelUreaValue');
    if (ureaSlider && ureaOutput) {
      ureaSlider.addEventListener('input', function () {
        ureaOutput.textContent = `${this.value}%`;
      });
      ureaOutput.textContent = `${ureaSlider.value}%`;
    }
  }

  /**
   * Limpiar refacciones del modal
   */
  function limpiarRefaccionesModal() {
    const contenedor = document.getElementById('editarMantenimiento_refaccionesAdicionales');
    if (contenedor) {
      contenedor.innerHTML = '';
    }

    // Limpiar primera fila
    const primeraFila = document.getElementById('editarMantenimiento_fila_refaccion_1');
    if (primeraFila) {
      const buscarInput = document.getElementById('editarMantenimiento_refaccion_buscar_1');
      const descInput = document.getElementById('editarMantenimiento_refaccion_desc_1');
      const almacenInput = document.getElementById('editarMantenimiento_refaccion_almacen_1');
      const stockInput = document.getElementById('editarMantenimiento_refaccion_stock_1');
      const unidadInput = document.getElementById('editarMantenimiento_refaccion_unidad_1');
      const cantidadInput = document.getElementById('editarMantenimiento_refaccion_cantidad_1');

      if (buscarInput) {
        buscarInput.value = '';
        buscarInput.dataset.codigo = '';
        buscarInput.dataset.almacen = '';
      }
      if (descInput) {
        descInput.value = '';
      }
      if (almacenInput) {
        almacenInput.value = '';
      }
      if (stockInput) {
        stockInput.value = '';
      }
      if (unidadInput) {
        unidadInput.value = '';
      }
      if (cantidadInput) {
        cantidadInput.value = '';
      }
    }

    // Resetear contador
    window.contadorRefaccionesEditar = 0;
  }

  /**
   * Función auxiliar para actualizar posición del dropdown en el modal
   */
  function actualizarPosicionDropdownModal(input, dropdown) {
    if (!input || !dropdown) {
      console.warn('⚠️ actualizarPosicionDropdownModal: input o dropdown no encontrado');
      return;
    }

    try {
      const rect = input.getBoundingClientRect();

      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownMaxHeight = 300;

      // Usar coordenadas relativas al viewport (getBoundingClientRect ya las da)
      let top = rect.bottom + 2; // Posición relativa al viewport
      let { left } = rect; // Posición relativa al viewport
      const width = Math.max(rect.width, 200);

      // Calcular altura del dropdown
      let dropdownHeight = dropdown.scrollHeight || dropdownMaxHeight;
      dropdownHeight = Math.min(dropdownHeight, dropdownMaxHeight);

      // Verificar si hay espacio debajo
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Si no hay espacio debajo y hay más espacio arriba, mostrar arriba
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        top = rect.top - dropdownHeight - 2;
        if (top < 10) {
          top = 10;
        }
      } else {
        // Ajustar si se sale de la pantalla por abajo
        if (top + dropdownHeight > viewportHeight) {
          top = Math.max(10, viewportHeight - dropdownHeight - 10);
        }
      }

      // Ajustar si se sale por la derecha
      if (left + width > viewportWidth) {
        left = viewportWidth - width - 10;
      }

      // Asegurar que no se salga por la izquierda
      if (left < 10) {
        left = 10;
      }

      // Aplicar estilos directamente (position: fixed usa coordenadas del viewport)
      dropdown.style.position = 'fixed';
      dropdown.style.top = `${top}px`;
      dropdown.style.left = `${left}px`;
      dropdown.style.width = `${width}px`;
      dropdown.style.visibility = 'visible';
      dropdown.style.display = 'block';
      dropdown.style.zIndex = '1065';
      dropdown.style.opacity = '1';
      dropdown.style.pointerEvents = 'auto';

      console.log('📍 Dropdown posicionado:', {
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        visible: true,
        zIndex: '1065',
        viewportHeight: viewportHeight,
        inputRect: {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height
        },
        dropdownHeight: dropdownHeight,
        spaceBelow: spaceBelow,
        spaceAbove: spaceAbove
      });
    } catch (error) {
      console.error('❌ Error posicionando dropdown:', error);
    }
  }

  /**
   * Función auxiliar para mostrar y posicionar el dropdown
   */
  function mostrarDropdown(economicos, input, dropdown) {
    if (!input || !dropdown) {
      return;
    }

    // Mover el dropdown al body primero
    if (dropdown.parentElement !== document.body) {
      const originalParent = dropdown.parentElement;
      document.body.appendChild(dropdown);
      dropdown._originalParent = originalParent;
    }

    requestAnimationFrame(() => {
      dropdown.style.cssText = `
                position: fixed !important;
                display: block !important;
                visibility: hidden !important;
                top: -9999px !important;
                left: 0 !important;
                width: ${Math.max(input.getBoundingClientRect().width, 200)}px !important;
                max-height: 300px !important;
                z-index: 1065 !important;
                background-color: #fff !important;
                border: 1px solid #ced4da !important;
                border-radius: 0.375rem !important;
                box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
            `;

      requestAnimationFrame(() => {
        setTimeout(() => {
          // Verificar que el dropdown tenga contenido antes de posicionarlo
          if (dropdown.children.length === 0) {
            console.warn('⚠️ Dropdown no tiene contenido, esperando...');
            setTimeout(() => {
              if (dropdown.children.length > 0) {
                actualizarPosicionDropdownModal(input, dropdown);
                dropdown.classList.remove('hidden-force');
                dropdown.classList.add('show');
              }
            }, 100);
            return;
          }

          actualizarPosicionDropdownModal(input, dropdown);
          dropdown.classList.add('show');

          // Verificar que sea visible después de posicionar
          const rect = dropdown.getBoundingClientRect();
          const isInViewport =
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth;

          console.log('🔍 Verificación final del dropdown:', {
            hasContent: dropdown.children.length > 0,
            isInViewport: isInViewport,
            rect: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            },
            computedDisplay: window.getComputedStyle(dropdown).display,
            computedVisibility: window.getComputedStyle(dropdown).visibility,
            computedZIndex: window.getComputedStyle(dropdown).zIndex
          });

          const modal = input.closest('.modal');
          if (modal) {
            setTimeout(() => {
              actualizarPosicionDropdownModal(input, dropdown);
              dropdown.classList.add('show');
              console.log(
                '✅ Dropdown de económicos mostrado en el modal (después de delay del modal)'
              );
            }, 100);
          } else {
            console.log('✅ Dropdown de económicos mostrado en el modal');
          }
        }, 10);
      });
    });
  }

  /**
   * Filtrar económicos en el modal de edición
   */
  window.filtrarEconomicosMantenimientoEditar = function (busqueda) {
    const input = document.getElementById('editarMantenimiento_economico');
    const dropdown = document.getElementById('editarMantenimiento_economico_dropdown');

    if (!input || !dropdown) {
      return;
    }

    const termino = busqueda.toLowerCase().trim();
    dropdown.innerHTML = '';

    if (termino.length === 0) {
      dropdown.classList.remove('show');
      return;
    }

    // Obtener económicos del caché
    let economicos = [];
    if (window.ERPState && typeof window.ERPState.getCache === 'function') {
      economicos = window.ERPState.getCache('economicos') || [];
    } else if (window.configuracionManager) {
      economicos = window.configuracionManager.getAllEconomicos() || [];
    }

    if (economicos.length === 0) {
      dropdown.innerHTML = '<div class="searchable-select-no-results">Cargando económicos...</div>';
      mostrarDropdown(economicos, input, dropdown);
      return;
    }

    const filtrados = economicos.filter(e => {
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
      mostrarDropdown(economicos, input, dropdown);
      return;
    }

    const limitados = filtrados.slice(0, 20);
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
      item.addEventListener('click', () => {
        seleccionarEconomicoMantenimientoEditar(economico, numero);
      });
      dropdown.appendChild(item);
    });

    if (filtrados.length > 20) {
      const masItem = document.createElement('div');
      masItem.className = 'searchable-select-no-results';
      masItem.innerHTML = `<small>... y ${filtrados.length - 20} más. Continúe escribiendo para filtrar.</small>`;
      dropdown.appendChild(masItem);
    }

    // Usar la misma lógica de posicionamiento que el formulario principal
    if (input && dropdown) {
      // Mover el dropdown al body primero
      if (dropdown.parentElement !== document.body) {
        const originalParent = dropdown.parentElement;
        document.body.appendChild(dropdown);
        dropdown._originalParent = originalParent;
      }

      requestAnimationFrame(() => {
        const inputRect = input.getBoundingClientRect();
        // Aplicar estilos directamente a cada propiedad para mayor prioridad
        dropdown.style.position = 'fixed';
        dropdown.style.display = 'block';
        dropdown.style.visibility = 'hidden';
        dropdown.style.top = '-9999px';
        dropdown.style.left = '0';
        dropdown.style.width = `${Math.max(inputRect.width, 200)}px`;
        dropdown.style.maxHeight = '300px';
        dropdown.style.zIndex = '1065';
        dropdown.style.opacity = '1';
        dropdown.style.pointerEvents = 'auto';
        dropdown.style.backgroundColor = '#fff';
        dropdown.style.border = '1px solid #ced4da';
        dropdown.style.borderRadius = '0.375rem';
        dropdown.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
        dropdown.style.overflowY = 'auto';
        dropdown.style.overflowX = 'hidden';
        dropdown.style.margin = '0';
        dropdown.style.padding = '0';
        dropdown.setAttribute('style', `${dropdown.getAttribute('style')} !important`);

        console.log('🎨 Estilos aplicados al dropdown:', {
          width: Math.max(inputRect.width, 200),
          zIndex: '1060 (sobre modal de Bootstrap)'
        });

        requestAnimationFrame(() => {
          setTimeout(() => {
            actualizarPosicionDropdownModal(input, dropdown);
            dropdown.classList.add('show');

            // Verificar que el dropdown tenga contenido y sea visible
            const hasContent = dropdown.children.length > 0;
            const computedStyle = window.getComputedStyle(dropdown);
            const isVisible =
              computedStyle.visibility !== 'hidden' &&
              computedStyle.display !== 'none' &&
              dropdown.classList.contains('show') &&
              computedStyle.opacity !== '0';

            console.log('🔍 Estado del dropdown:', {
              hasContent,
              isVisible,
              children: dropdown.children.length,
              visibility: dropdown.style.visibility,
              computedVisibility: computedStyle.visibility,
              display: dropdown.style.display,
              computedDisplay: computedStyle.display,
              opacity: computedStyle.opacity,
              hasShowClass: dropdown.classList.contains('show'),
              top: dropdown.style.top,
              left: dropdown.style.left,
              zIndex: dropdown.style.zIndex,
              computedZIndex: computedStyle.zIndex,
              parent: dropdown.parentElement?.tagName,
              rect: dropdown.getBoundingClientRect()
            });

            // Forzar visibilidad si no está visible
            if (!isVisible || !hasContent) {
              console.warn('⚠️ Dropdown no está visible, forzando visibilidad...');
              dropdown.setAttribute(
                'style',
                `${dropdown.getAttribute('style')}; visibility: visible !important; display: block !important; opacity: 1 !important; pointer-events: auto !important;`
              );
              dropdown.style.visibility = 'visible';
              dropdown.style.display = 'block';
              dropdown.style.opacity = '1';
              dropdown.style.pointerEvents = 'auto';
              dropdown.classList.add('show');

              // Verificar nuevamente después de forzar
              setTimeout(() => {
                const rect = dropdown.getBoundingClientRect();
                console.log('🔍 Estado después de forzar visibilidad:', {
                  visible: rect.width > 0 && rect.height > 0,
                  rect: rect,
                  computedDisplay: window.getComputedStyle(dropdown).display,
                  computedVisibility: window.getComputedStyle(dropdown).visibility
                });
              }, 50);
            }

            const modal = input.closest('.modal');
            if (modal) {
              setTimeout(() => {
                actualizarPosicionDropdownModal(input, dropdown);
                dropdown.classList.remove('hidden-force');
                dropdown.classList.add('show');
                console.log(
                  '✅ Dropdown de económicos mostrado en el modal (después de delay del modal)'
                );
              }, 100);
            } else if (!isVisible || !hasContent) {
              console.warn('⚠️ Dropdown no está visible o no tiene contenido');
            } else {
              console.log('✅ Dropdown de económicos mostrado en el modal');
            }
          }, 10);
        });
      });
    } else {
      dropdown.classList.add('show');
    }
  };

  /**
   * Mostrar dropdown de económicos en el modal
   */
  window.mostrarDropdownEconomicosMantenimientoEditar = function () {
    console.log('🔍 mostrarDropdownEconomicosMantenimientoEditar llamado');
    const input = document.getElementById('editarMantenimiento_economico');
    const dropdown = document.getElementById('editarMantenimiento_economico_dropdown');

    if (!input || !dropdown) {
      console.warn('⚠️ No se encontró input o dropdown del económico en el modal', {
        input: Boolean(input),
        dropdown: Boolean(dropdown)
      });
      return;
    }

    console.log('✅ Input y dropdown encontrados, procediendo...');

    if (input.value.trim().length > 0) {
      console.log('📝 Input tiene valor, filtrando...');
      window.filtrarEconomicosMantenimientoEditar(input.value);
    } else {
      console.log('📝 Input vacío, mostrando todos los económicos...');
      // Función auxiliar para obtener económicos
      const obtenerEconomicos = function () {
        let economicos = [];

        // 1. Intentar desde ERPState cache
        if (window.ERPState && typeof window.ERPState.getCache === 'function') {
          economicos = window.ERPState.getCache('economicos') || [];
          if (economicos.length > 0) {
            console.log(`📦 Económicos desde ERPState cache: ${economicos.length}`);
            return economicos;
          }
        }

        // 2. Intentar desde caché global
        if (
          window._economicosCache &&
          Array.isArray(window._economicosCache) &&
          window._economicosCache.length > 0
        ) {
          economicos = window._economicosCache;
          console.log(`📦 Económicos desde _economicosCache: ${economicos.length}`);
          return economicos;
        }

        if (
          window.__economicosCache &&
          Array.isArray(window.__economicosCache) &&
          window.__economicosCache.length > 0
        ) {
          economicos = window.__economicosCache;
          console.log(`📦 Económicos desde __economicosCache: ${economicos.length}`);
          return economicos;
        }

        // 3. Intentar desde configuracionManager (síncrono, más rápido)
        if (
          window.configuracionManager &&
          typeof window.configuracionManager.getAllEconomicos === 'function'
        ) {
          economicos = window.configuracionManager.getAllEconomicos() || [];
          if (economicos.length > 0) {
            console.log(`📦 Económicos desde configuracionManager: ${economicos.length}`);
            return economicos;
          }
        }

        return [];
      };

      // Intentar obtener económicos
      let economicos = obtenerEconomicos();

      // Si no hay económicos, intentar cargarlos y esperar
      if (economicos.length === 0) {
        console.log('📦 No hay económicos en caché, cargando...');
        dropdown.innerHTML =
          '<div class="searchable-select-no-results">Cargando económicos...</div>';
        mostrarDropdown([], input, dropdown);

        // Cargar económicos de forma asíncrona
        if (typeof window.loadEconomicosMantenimiento === 'function') {
          // loadEconomicosMantenimiento es async, esperar a que termine
          (async () => {
            try {
              await window.loadEconomicosMantenimiento();

              // Esperar un momento adicional para que el caché se actualice
              await new Promise(resolve => setTimeout(resolve, 200));

              // Intentar obtener nuevamente después de cargar
              economicos = obtenerEconomicos();

              if (economicos.length > 0) {
                console.log(`✅ ${economicos.length} económicos cargados, mostrando dropdown...`);
                mostrarDropdownConEconomicos(economicos, input, dropdown);
              } else {
                console.warn('⚠️ No se encontraron económicos después de cargar');
                dropdown.innerHTML =
                  '<div class="searchable-select-no-results">No hay económicos disponibles</div>';
                mostrarDropdown([], input, dropdown);
              }
            } catch (error) {
              console.error('❌ Error cargando económicos:', error);
              dropdown.innerHTML =
                '<div class="searchable-select-no-results">Error al cargar económicos</div>';
              mostrarDropdown([], input, dropdown);
            }
          })();
        } else {
          console.warn('⚠️ loadEconomicosMantenimiento no está disponible');
          dropdown.innerHTML =
            '<div class="searchable-select-no-results">No hay económicos disponibles</div>';
          mostrarDropdown([], input, dropdown);
        }
        return;
      }

      console.log(`✅ Mostrando ${economicos.length} económicos en el dropdown`);
      mostrarDropdownConEconomicos(economicos, input, dropdown);
    }
  };

  /**
   * Función auxiliar para mostrar dropdown con económicos
   */
  function mostrarDropdownConEconomicos(economicos, input, dropdown) {
    const limitados = economicos.slice(0, 20);
    dropdown.innerHTML = '';

    console.log(`📋 Creando ${limitados.length} items en el dropdown`);

    limitados.forEach((economico, _index) => {
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
      item.addEventListener('click', () => {
        seleccionarEconomicoMantenimientoEditar(economico, numero);
      });
      dropdown.appendChild(item);
    });

    console.log(`✅ ${dropdown.children.length} items agregados al dropdown`);

    // Verificar que el dropdown tenga contenido antes de mostrarlo
    if (dropdown.children.length === 0) {
      console.error('❌ El dropdown no tiene contenido después de crear items');
      return;
    }

    mostrarDropdown(economicos, input, dropdown);
  }

  /**
   * Ocultar dropdown de económicos en el modal
   */
  window.ocultarDropdownEconomicosMantenimientoEditar = function (immediate = false) {
    const dropdown = document.getElementById('editarMantenimiento_economico_dropdown');
    if (!dropdown) {
      return;
    }

    const ocultarYRestaurar = () => {
      if (!dropdown) {
        return;
      }

      console.log('🔒 Ocultando dropdown económico del modal...', {
        immediate,
        hasOriginalParent: Boolean(dropdown._originalParent),
        parentElement: dropdown.parentElement?.tagName,
        isInBody: dropdown.parentElement === document.body
      });

      // PRIMERO: Remover la clase 'show'
      dropdown.classList.remove('show');

      // SEGUNDO: Agregar clase hidden-force
      dropdown.classList.add('hidden-force');

      // TERCERO: Limpiar contenido
      dropdown.innerHTML = '';

      // Restaurar al contenedor original si fue movido al body
      if (dropdown._originalParent && dropdown.parentElement === document.body) {
        console.log('🔄 Restaurando dropdown del modal a su contenedor original');

        // Restaurar al contenedor original
        try {
          dropdown._originalParent.appendChild(dropdown);
          dropdown._originalParent = null;
        } catch (error) {
          console.error('❌ Error restaurando dropdown del modal:', error);
        }
      }

      // CUARTO: Forzar ocultación con estilos inline !important (máxima prioridad)
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

      // Forzar un reflow para asegurar que los cambios se apliquen
      void dropdown.offsetHeight;

      // Verificar que realmente se ocultó
      setTimeout(() => {
        const computedStyle = window.getComputedStyle(dropdown);
        const isVisible = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';

        if (isVisible) {
          console.warn(
            '⚠️ Dropdown del modal aún visible después de ocultar, forzando ocultación...'
          );

          // PRIMERO: Remover la clase 'show'
          dropdown.classList.remove('show');

          // SEGUNDO: Agregar clase hidden-force
          dropdown.classList.add('hidden-force');

          // TERCERO: Intentar restaurar si está en el body
          if (dropdown._originalParent && dropdown.parentElement === document.body) {
            try {
              dropdown._originalParent.appendChild(dropdown);
              dropdown._originalParent = null;
            } catch (e) {
              console.error('❌ Error en segundo intento de restaurar:', e);
            }
          }

          // CUARTO: Forzar ocultación con estilos inline !important (máxima prioridad)
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

          // Limpiar contenido también
          dropdown.innerHTML = '';

          // Forzar un reflow
          void dropdown.offsetHeight;
        } else {
          console.log('✅ Dropdown del modal ocultado correctamente');
        }
      }, 50);
    };

    if (!immediate) {
      setTimeout(() => {
        if (dropdown && dropdown.classList.contains('show')) {
          // Verificar si el usuario está haciendo click en el dropdown
          if (dropdown.matches(':hover') || dropdown.querySelector(':hover')) {
            return; // No ocultar si el mouse está sobre el dropdown
          }

          ocultarYRestaurar();
        }
      }, 250);
    } else {
      ocultarYRestaurar();
    }
  };

  /**
   * Seleccionar económico en el modal y cargar placas automáticamente
   */
  window.seleccionarEconomicoMantenimientoEditar = function (economico, valor) {
    const input = document.getElementById('editarMantenimiento_economico');
    const dropdown = document.getElementById('editarMantenimiento_economico_dropdown');
    const hiddenInput = document.getElementById('editarMantenimiento_economico_value');

    if (!input) {
      console.error('❌ Input económico no encontrado en modal de edición');
      return;
    }

    const numero = economico.numero || economico.nombre || valor || '';
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

    // Establecer valores
    input.value = texto;

    if (hiddenInput) {
      hiddenInput.value = numero;
      console.log('✅ Hidden input actualizado:', {
        id: hiddenInput.id,
        value: hiddenInput.value,
        numero: numero
      });
    } else {
      console.warn('⚠️ Hidden input no encontrado:', 'editarMantenimiento_economico_value');
    }

    // Guardar los datos del económico en el objeto del modal para que se guarden al actualizar
    // Esto asegura que Placa, Marca y Modelo se actualicen cuando se guarde el mantenimiento
    // Convertir número a string para asegurar comparación correcta
    window._editarMantenimientoEconomicoData = {
      numero: String(numero).trim(),
      placa: placa || '',
      marca: marca || '',
      modelo: modelo || ''
    };

    console.log('💾 Datos del económico guardados para actualización:', {
      numero: window._editarMantenimientoEconomicoData.numero,
      placa: window._editarMantenimientoEconomicoData.placa,
      marca: window._editarMantenimientoEconomicoData.marca,
      modelo: window._editarMantenimientoEconomicoData.modelo,
      tipoNumero: typeof window._editarMantenimientoEconomicoData.numero
    });

    // Disparar evento change para notificar cambios
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    if (hiddenInput) {
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Ocultar dropdown completamente
    if (dropdown) {
      dropdown.classList.remove('show');
      dropdown.innerHTML = '';
      dropdown.style.display = 'none';
      dropdown.style.visibility = 'hidden';
      dropdown.style.opacity = '0';

      // Si el dropdown fue movido al body, restaurarlo
      if (dropdown._originalParent && dropdown.parentElement === document.body) {
        dropdown.removeAttribute('style');
        dropdown._originalParent.appendChild(dropdown);
        dropdown._originalParent = null;
        dropdown.style.display = 'none';
        dropdown.style.visibility = 'hidden';
      }
    }

    console.log('✅ Económico seleccionado en modal de edición:', {
      numero,
      placa,
      marca,
      modelo,
      inputValue: input.value,
      hiddenValue: hiddenInput?.value
    });
  };

  /**
   * Manejar teclado en el dropdown de económicos del modal
   */
  window.manejarTecladoEconomicosMantenimientoEditar = function (event) {
    const dropdown = document.getElementById('editarMantenimiento_economico_dropdown');
    if (!dropdown || !dropdown.classList.contains('show')) {
      return;
    }

    const items = dropdown.querySelectorAll('.searchable-select-item');
    if (items.length === 0) {
      return;
    }

    let highlightedIndex = -1;
    items.forEach((item, index) => {
      if (item.classList.contains('highlighted')) {
        highlightedIndex = index;
        item.classList.remove('highlighted');
      }
    });

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      highlightedIndex = (highlightedIndex + 1) % items.length;
      items[highlightedIndex].classList.add('highlighted');
      items[highlightedIndex].scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      highlightedIndex = highlightedIndex <= 0 ? items.length - 1 : highlightedIndex - 1;
      items[highlightedIndex].classList.add('highlighted');
      items[highlightedIndex].scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter' && highlightedIndex >= 0) {
      event.preventDefault();
      items[highlightedIndex].click();
    }
  };

  /**
   * Agregar fila de refacción en el modal
   */
  window.agregarFilaRefaccionEditar = function () {
    window.contadorRefaccionesEditar = (window.contadorRefaccionesEditar || 0) + 1;
    const numeroFila = window.contadorRefaccionesEditar;
    const contenedor = document.getElementById('editarMantenimiento_refaccionesAdicionales');
    if (!contenedor) {
      return;
    }

    const nuevaFila = document.createElement('div');
    nuevaFila.className = 'row g-3 mb-3';
    nuevaFila.id = `editarMantenimiento_fila_refaccion_${numeroFila}`;

    nuevaFila.innerHTML = `
            <div class="col-md-3">
                <label class="form-label">Código/SKU *</label>
                <div class="position-relative">
                    <div class="input-group">
                        <input type="text" class="form-control" id="editarMantenimiento_refaccion_buscar_${numeroFila}" placeholder="Buscar por código..." data-action="filtrarRefaccionesEditar" data-indice="${numeroFila}" autocomplete="off">
                        <button class="btn btn-outline-secondary" type="button" data-action="mostrarListaRefaccionesEditar" data-indice="${numeroFila}" title="Mostrar lista">
                            <i class="fas fa-list"></i>
                        </button>
                    </div>
                    <div class="dropdown-menu position-absolute" id="editarMantenimiento_refaccion_dropdown_${numeroFila}" style="max-height: 300px; overflow-y: auto; width: 100%; display: none; z-index: 1000; top: 100%; left: 0;">
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <label class="form-label">Descripción</label>
                <input type="text" class="form-control" id="editarMantenimiento_refaccion_desc_${numeroFila}" readonly>
            </div>
            <div class="col-md-2">
                <label class="form-label">Almacén</label>
                <input type="text" class="form-control" id="editarMantenimiento_refaccion_almacen_${numeroFila}" readonly>
            </div>
            <div class="col-md-1">
                <label class="form-label">Stock</label>
                <input type="text" class="form-control" id="editarMantenimiento_refaccion_stock_${numeroFila}" readonly>
            </div>
            <div class="col-md-1">
                <label class="form-label">Unidad</label>
                <input type="text" class="form-control" id="editarMantenimiento_refaccion_unidad_${numeroFila}" readonly>
            </div>
            <div class="col-md-2">
                <label class="form-label">Cantidad *</label>
                <input type="number" class="form-control" id="editarMantenimiento_refaccion_cantidad_${numeroFila}" min="1">
            </div>
            <div class="col-md-1 d-flex align-items-center">
                <button type="button" class="btn btn-outline-danger" data-action="eliminarFilaRefaccionEditar" data-indice="${numeroFila}" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

    contenedor.appendChild(nuevaFila);

    // Inicializar event listeners para la nueva fila usando el sistema global
    setTimeout(() => {
      const buscarInput = document.getElementById(
        `editarMantenimiento_refaccion_buscar_${numeroFila}`
      );
      if (buscarInput) {
        buscarInput.addEventListener('input', () => {
          filtrarRefaccionesEditar(numeroFila);
        });
      }

      // Registrar los botones con el sistema de event handlers
      nuevaFila.querySelectorAll('[data-action]').forEach(element => {
        const _action = element.getAttribute('data-action');
        if (typeof window.registerGlobalAction === 'function') {
          // El sistema global ya manejará estos eventos
        }
      });
    }, 50);

    // Actualizar lista de refacciones para el nuevo dropdown
    setTimeout(() => {
      if (typeof window.actualizarListaRefaccionesEditar === 'function') {
        window.actualizarListaRefaccionesEditar();
      }
    }, 100);
  };

  /**
   * Eliminar fila de refacción en el modal
   */
  window.eliminarFilaRefaccionEditar = function (numeroFila) {
    const fila = document.getElementById(`editarMantenimiento_fila_refaccion_${numeroFila}`);
    if (fila) {
      fila.remove();
    }
  };

  /**
   * Inicializar event listeners para una fila de refacción
   */
  function _inicializarEventListenersFilaRefaccion(numeroFila) {
    const buscarInput = document.getElementById(
      `editarMantenimiento_refaccion_buscar_${numeroFila}`
    );
    if (buscarInput) {
      buscarInput.addEventListener('input', () => {
        filtrarRefaccionesEditar(numeroFila);
      });
    }
  }

  /**
   * Actualizar lista de refacciones en el modal
   */
  window.actualizarListaRefaccionesEditar = function () {
    if (typeof window.obtenerStockRefacciones === 'function') {
      const stock = window.obtenerStockRefacciones();
      todasLasRefaccionesEditar = Object.values(stock).filter(item => item.stock > 0);

      // Actualizar todos los dropdowns de refacciones en el modal
      document
        .querySelectorAll('[id^="editarMantenimiento_refaccion_dropdown_"]')
        .forEach(dropdown => {
          const numeroFila = dropdown.id.split('_').pop();
          llenarDropdownRefaccionesEditar(numeroFila, todasLasRefaccionesEditar);
        });
    }
  };

  /**
   * Llenar dropdown de refacciones en el modal
   */
  window.llenarDropdownRefaccionesEditar = function (numeroFila, refacciones) {
    const dropdown = document.getElementById(
      `editarMantenimiento_refaccion_dropdown_${numeroFila}`
    );
    if (!dropdown) {
      return;
    }

    dropdown.innerHTML = '';

    if (refacciones.length === 0) {
      dropdown.innerHTML =
        '<div class="dropdown-item text-muted">No hay refacciones con stock disponible</div>';
      return;
    }

    const refaccionesLimitadas = refacciones.slice(0, 50);

    refaccionesLimitadas.forEach(ref => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.style.cursor = 'pointer';

      item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${ref.codigo}</strong><br>
                        <small class="text-muted">${ref.descripcion}</small>
                    </div>
                    <i class="fas fa-chevron-right text-muted"></i>
                </div>
            `;

      item.addEventListener('click', () => {
        seleccionarRefaccionEditar(numeroFila, ref);
      });

      dropdown.appendChild(item);
    });
  };

  /**
   * Filtrar refacciones en el modal
   */
  window.filtrarRefaccionesEditar = function (numeroFila) {
    const inputBuscar = document.getElementById(
      `editarMantenimiento_refaccion_buscar_${numeroFila}`
    );
    const dropdown = document.getElementById(
      `editarMantenimiento_refaccion_dropdown_${numeroFila}`
    );

    if (!inputBuscar || !dropdown) {
      return;
    }

    const terminoBusqueda = inputBuscar.value.toLowerCase().trim();

    if (terminoBusqueda.length === 0) {
      dropdown.style.display = 'none';
      return;
    }

    const refaccionesFiltradas = todasLasRefaccionesEditar.filter(
      ref =>
        ref.codigo.toLowerCase().includes(terminoBusqueda) ||
        ref.descripcion.toLowerCase().includes(terminoBusqueda)
    );

    llenarDropdownRefaccionesEditar(numeroFila, refaccionesFiltradas);
    dropdown.style.display = 'block';
    dropdown.style.zIndex = '9999';
  };

  /**
   * Mostrar lista completa de refacciones en el modal
   */
  window.mostrarListaRefaccionesEditar = function (numeroFila) {
    const dropdown = document.getElementById(
      `editarMantenimiento_refaccion_dropdown_${numeroFila}`
    );
    const inputBuscar = document.getElementById(
      `editarMantenimiento_refaccion_buscar_${numeroFila}`
    );

    if (!dropdown) {
      return;
    }

    if (inputBuscar) {
      inputBuscar.value = '';
      inputBuscar.dataset.codigo = '';
    }

    llenarDropdownRefaccionesEditar(numeroFila, todasLasRefaccionesEditar);
    dropdown.style.display = 'block';
    dropdown.style.zIndex = '9999';
  };

  /**
   * Seleccionar refacción en el modal
   */
  window.seleccionarRefaccionEditar = function (numeroFila, refaccion) {
    const inputBuscar = document.getElementById(
      `editarMantenimiento_refaccion_buscar_${numeroFila}`
    );
    const descInput = document.getElementById(`editarMantenimiento_refaccion_desc_${numeroFila}`);
    const almacenInput = document.getElementById(
      `editarMantenimiento_refaccion_almacen_${numeroFila}`
    );
    const stockInput = document.getElementById(`editarMantenimiento_refaccion_stock_${numeroFila}`);
    const unidadInput = document.getElementById(
      `editarMantenimiento_refaccion_unidad_${numeroFila}`
    );
    const dropdown = document.getElementById(
      `editarMantenimiento_refaccion_dropdown_${numeroFila}`
    );

    if (inputBuscar) {
      inputBuscar.value = refaccion.codigo;
      inputBuscar.dataset.codigo = refaccion.codigo;
    }

    if (descInput) {
      descInput.value = refaccion.descripcion || '';
    }
    if (almacenInput) {
      almacenInput.value = 'Almacén Central';
    } // Por defecto
    if (stockInput) {
      stockInput.value = refaccion.stock || 0;
    }
    if (unidadInput) {
      unidadInput.value = 'piezas';
    } // Por defecto

    if (dropdown) {
      dropdown.style.display = 'none';
    }

    // Obtener stock por almacén si está disponible
    if (typeof window.obtenerStockRefaccionesPorAlmacen === 'function') {
      const stockPorAlmacen = window.obtenerStockRefaccionesPorAlmacen();
      const almacenesDisponibles = [];
      Object.keys(stockPorAlmacen).forEach(almacen => {
        if (
          stockPorAlmacen[almacen][refaccion.codigo] &&
          stockPorAlmacen[almacen][refaccion.codigo].qty > 0
        ) {
          almacenesDisponibles.push({
            nombre: almacen,
            stock: stockPorAlmacen[almacen][refaccion.codigo].qty
          });
        }
      });

      if (almacenesDisponibles.length > 0) {
        // Usar el primer almacén disponible
        const almacen = almacenesDisponibles[0];
        if (almacenInput) {
          almacenInput.value = almacen.nombre;
        }
        if (stockInput) {
          stockInput.value = almacen.stock;
        }
      }
    }
  };

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarModalEditar);
  } else {
    inicializarModalEditar();
  }

  console.log('✅ Módulo mantenimiento-modal-editar.js cargado');
})();
