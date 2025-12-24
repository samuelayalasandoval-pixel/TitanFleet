/**
 * Searchable Select - Lista Desplegable con Búsqueda
 * Componente reutilizable para formularios
 *
 * Uso:
 *   crearListaBusqueda(inputId, selectId, resultadoId, valorId, datos, campoBusqueda, btnClearId)
 */

(function () {
  'use strict';

  /**
   * Crea una lista desplegable con funcionalidad de búsqueda
   *
   * @param {string} inputId - ID del input de búsqueda
   * @param {string} selectId - ID del contenedor de opciones
   * @param {string} resultadoId - ID del contenedor de resultado (opcional, puede ser null)
   * @param {string} valorId - ID del span donde mostrar el valor seleccionado (opcional, puede ser null)
   * @param {Array} datos - Array de objetos con los datos {id, texto, ...}
   * @param {string} campoBusqueda - Nombre del campo a usar para mostrar el texto (default: 'texto')
   * @param {string} btnClearId - ID del botón de limpiar (opcional, puede ser null)
   */
  window.crearListaBusqueda = function (
    inputId,
    selectId,
    resultadoId,
    valorId,
    datos,
    campoBusqueda = 'texto',
    btnClearId = null
  ) {
    const input = document.getElementById(inputId);
    const selectDiv = document.getElementById(selectId);
    const resultadoDiv = resultadoId ? document.getElementById(resultadoId) : null;
    const valorSpan = valorId ? document.getElementById(valorId) : null;
    const btnClear = btnClearId ? document.getElementById(btnClearId) : null;

    if (!input || !selectDiv) {
      console.error('❌ No se encontraron los elementos necesarios:', { inputId, selectId });
      return;
    }

    let indiceResaltado = -1;
    let opcionesFiltradas = [];
    let valorSeleccionado = null;
    let limpiando = false; // Bandera para evitar mostrar lista al limpiar

    // Función para filtrar opciones
    function filtrarOpciones(busqueda) {
      const busquedaLower = busqueda.toLowerCase().trim();

      if (busquedaLower === '') {
        opcionesFiltradas = datos;
      } else {
        opcionesFiltradas = datos.filter(item => {
          // Buscar en el campo principal y también en otros campos si existen
          const textoPrincipal = item[campoBusqueda] ? item[campoBusqueda].toLowerCase() : '';
          const tieneCoincidencia = textoPrincipal.includes(busquedaLower);

          // Si tiene campos adicionales (como nombre, licencia, etc.), buscar también ahí
          const camposAdicionales = Object.keys(item).filter(
            k => k !== 'id' && k !== campoBusqueda && typeof item[k] === 'string'
          );
          const coincidenciaAdicional = camposAdicionales.some(campo =>
            item[campo].toLowerCase().includes(busquedaLower)
          );

          return tieneCoincidencia || coincidenciaAdicional;
        });
      }

      mostrarOpciones();
    }

    // Función para actualizar posición del dropdown usando position: fixed
    function actualizarPosicionDropdown() {
      if (!selectDiv.classList.contains('show')) {
        return;
      }

      const rect = input.getBoundingClientRect();

      // Mover al body si no está ahí ya
      if (selectDiv.parentElement !== document.body) {
        selectDiv._originalParent = selectDiv.parentElement;
        document.body.appendChild(selectDiv);
        selectDiv.style.position = 'fixed';
      }

      // Con position: fixed, las coordenadas son relativas al viewport
      // getBoundingClientRect() ya devuelve coordenadas relativas al viewport
      // No necesitamos sumar scrollY/scrollX
      const marginTop = 2; // Pequeño margen para separar del input
      selectDiv.style.top = `${rect.bottom + marginTop}px`;
      selectDiv.style.left = `${rect.left}px`;
      selectDiv.style.width = `${rect.width}px`;
      selectDiv.style.minWidth = `${rect.width}px`;
      selectDiv.style.maxWidth = `${rect.width}px`;
    }

    // Función para restaurar el dropdown a su posición original
    function restaurarPosicionDropdown() {
      if (selectDiv._originalParent && selectDiv.parentElement === document.body) {
        selectDiv._originalParent.appendChild(selectDiv);
        selectDiv.style.position = '';
        selectDiv.style.top = '';
        selectDiv.style.left = '';
        selectDiv.style.width = '';
        selectDiv.style.minWidth = '';
        selectDiv._originalParent = null;
      }
    }

    // Función para mostrar opciones filtradas
    function mostrarOpciones() {
      selectDiv.innerHTML = '';

      if (opcionesFiltradas.length === 0) {
        selectDiv.innerHTML = '<div class="no-results">No se encontraron resultados</div>';
      } else {
        opcionesFiltradas.forEach((item, index) => {
          const optionDiv = document.createElement('div');
          optionDiv.className = 'option-item';
          optionDiv.textContent = item[campoBusqueda] || '';
          optionDiv.dataset.value = item.id;
          optionDiv.dataset.item = JSON.stringify(item);

          optionDiv.addEventListener('click', () => {
            seleccionarOpcion(item);
          });

          optionDiv.addEventListener('mouseenter', () => {
            // Remover resaltado anterior
            selectDiv.querySelectorAll('.option-item').forEach(opt => {
              opt.classList.remove('highlighted');
            });
            optionDiv.classList.add('highlighted');
            indiceResaltado = index;
          });

          selectDiv.appendChild(optionDiv);
        });
      }

      selectDiv.classList.add('show');
      indiceResaltado = -1;

      // Actualizar posición después de mostrar (usar requestAnimationFrame para mejor rendimiento)
      requestAnimationFrame(() => {
        actualizarPosicionDropdown();
      });
    }

    // Función para limpiar la selección
    function limpiarSeleccion() {
      limpiando = true;
      valorSeleccionado = null;
      input.value = '';
      selectDiv.classList.remove('show');
      selectDiv.innerHTML = '';
      restaurarPosicionDropdown();

      // Ocultar resultado
      if (valorSpan && resultadoDiv) {
        resultadoDiv.style.display = 'none';
      }

      // Remover focus del input para evitar que se abra la lista
      input.blur();

      console.log('🧹 Selección limpiada');

      // Restaurar bandera después de un pequeño delay
      setTimeout(() => {
        limpiando = false;
      }, 100);
    }

    // Función para seleccionar una opción
    function seleccionarOpcion(item) {
      valorSeleccionado = item;
      input.value = item[campoBusqueda] || '';
      selectDiv.classList.remove('show');
      selectDiv.innerHTML = '';
      restaurarPosicionDropdown();

      // Mostrar resultado
      if (valorSpan && resultadoDiv) {
        valorSpan.textContent = item[campoBusqueda] || '';
        resultadoDiv.style.display = 'block';
      }

      console.log('✅ Opción seleccionada:', item);

      // Disparar evento personalizado para que otros scripts puedan escucharlo
      const selectEvent = new CustomEvent('itemSelected', {
        detail: { item: item, inputId: inputId },
        bubbles: true
      });
      input.dispatchEvent(selectEvent);
    }

    // Event listener para el input de búsqueda
    input.addEventListener('input', e => {
      filtrarOpciones(e.target.value);

      // Si el usuario borra el texto y no hay valor seleccionado, ocultar resultado
      if (e.target.value.trim() === '' && !valorSeleccionado && resultadoDiv) {
        resultadoDiv.style.display = 'none';
      }
    });

    // Event listener para mostrar opciones al hacer focus
    // Solo mostrar si el usuario hizo click o tab, no programáticamente
    let focusPorUsuario = false;
    input.addEventListener('mousedown', () => {
      focusPorUsuario = true;
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        focusPorUsuario = true;
      }
    });
    input.addEventListener('focus', () => {
      // No mostrar lista si estamos en proceso de limpiar
      if (limpiando) {
        focusPorUsuario = false;
        return;
      }
      // Solo mostrar si el focus fue por acción del usuario
      if (focusPorUsuario) {
        if (input.value.trim() === '') {
          filtrarOpciones('');
        } else {
          filtrarOpciones(input.value);
        }
      }
      focusPorUsuario = false; // Resetear después de usar
    });

    // Event listener para ocultar al hacer click fuera
    // Usar una función con nombre para poder removerla si es necesario
    const clickOutsideHandler = function (e) {
      const { target } = e;
      const clickedInside =
        input.contains(target) ||
        selectDiv.contains(target) ||
        (btnClear && btnClear.contains(target));
      if (!clickedInside) {
        selectDiv.classList.remove('show');
        restaurarPosicionDropdown();
      }
    };
    document.addEventListener('click', clickOutsideHandler);

    // Actualizar posición cuando se hace scroll o se redimensiona la ventana
    // Solo si el dropdown está visible
    const updatePositionIfVisible = () => {
      if (selectDiv.classList.contains('show')) {
        actualizarPosicionDropdown();
      }
    };
    window.addEventListener('scroll', updatePositionIfVisible, true);
    window.addEventListener('resize', updatePositionIfVisible);

    // Navegación con teclado
    input.addEventListener('keydown', e => {
      if (!selectDiv.classList.contains('show')) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          filtrarOpciones(input.value);
          return;
        }
      }

      const opciones = selectDiv.querySelectorAll('.option-item');

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (opciones.length > 0) {
            indiceResaltado = (indiceResaltado + 1) % opciones.length;
            opciones[indiceResaltado]?.scrollIntoView({ block: 'nearest' });
            opciones.forEach((opt, idx) => {
              opt.classList.toggle('highlighted', idx === indiceResaltado);
            });
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (opciones.length > 0) {
            indiceResaltado = indiceResaltado <= 0 ? opciones.length - 1 : indiceResaltado - 1;
            opciones[indiceResaltado]?.scrollIntoView({ block: 'nearest' });
            opciones.forEach((opt, idx) => {
              opt.classList.toggle('highlighted', idx === indiceResaltado);
            });
          }
          break;

        case 'Enter':
          e.preventDefault();
          if (indiceResaltado >= 0 && opciones[indiceResaltado]) {
            try {
              const itemData = JSON.parse(opciones[indiceResaltado].dataset.item);
              seleccionarOpcion(itemData);
            } catch (error) {
              console.error('Error al parsear datos del item:', error);
            }
          }
          break;

        case 'Escape':
          selectDiv.classList.remove('show');
          restaurarPosicionDropdown();
          break;
      }
    });

    // Event listener para el botón de limpiar
    if (btnClear) {
      btnClear.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        limpiarSeleccion();
      });
    }

    // Inicializar datos pero NO mostrar la lista automáticamente
    opcionesFiltradas = datos;

    // Retornar objeto con métodos útiles
    return {
      limpiar: limpiarSeleccion,
      obtenerValor: () => valorSeleccionado,
      establecerValor: item => {
        if (item && datos.find(d => d.id === item.id)) {
          seleccionarOpcion(item);
        }
      }
    };
  };

  console.log('✅ Searchable Select cargado y listo para usar');
})();
