/**
 * Sistema de Autocompletado - trafico.html
 * Funciones para búsqueda con autocompletado de económicos y operadores
 *
 * @module trafico/autocomplete-manager
 */

(function () {
  'use strict';

  // ===========================================
  // SISTEMA DE BÚSQUEDA CON AUTOCOMPLETADO
  // ===========================================

  // Variables globales ahora usan el sistema centralizado ERPState
  // Inicializar highlightedIndex si no existe
  if (!window.ERPState.getHighlightedIndex('economico')) {
    window.ERPState.setHighlightedIndex('economico', -1);
    window.ERPState.setHighlightedIndex('operadorprincipal', -1);
    window.ERPState.setHighlightedIndex('operadorsecundario', -1);
  }

  // Bandera para evitar recargas mÃºltiples simultÃ¡neas de operadores
  window._recargandoOperadores = false;
  window._ultimaRecargaOperadores = 0;

  // FunciÃ³n para cargar econÃ³micos en cachÃ©
  async function cargarEconomicosEnCache() {
    try {
      let economicos = [];

      // Intentar desde configuracionManager
      if (window.configuracionManager && typeof window.configuracionManager.getEconomicos === 'function') {
        const temp = window.configuracionManager.getEconomicos();
        economicos = Array.isArray(temp) ? temp : [];
      }

      // Si no hay datos, cargar desde Firebase
      if (economicos.length === 0 && window.firebaseDb && window.fs) {
        try {
          const docRef = window.fs.doc(window.firebaseDb, 'configuracion', 'tractocamiones');
          const doc = await window.fs.getDoc(docRef);
          if (doc.exists()) {
            const data = doc.data();
            if (data.economicos && Array.isArray(data.economicos)) {
              economicos = data.economicos.filter(e => e.deleted !== true);
            }
          }
        } catch (e) {
          console.warn('âš ï¸ Error cargando econÃ³micos desde Firebase:', e);
        }
      }

      // CRÍTICO: Filtrar por tenantId ANTES de filtrar por estado activo
      // Obtener tenantId actual
      let tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
      if (window.licenseManager && window.licenseManager.isLicenseActive()) {
        const licenseTenantId = window.licenseManager.getTenantId();
        if (licenseTenantId) {tenantId = licenseTenantId;}
      } else {
        const savedTenantId = localStorage.getItem('tenantId');
        if (savedTenantId) {tenantId = savedTenantId;}
      }

      const totalAntesFiltro = economicos.length;
      economicos = economicos.filter(economico => {
        const economicoTenantId = economico.tenantId;
        // Todos los usuarios solo ven económicos con su tenantId exacto
        return economicoTenantId === tenantId;
      });

      if (totalAntesFiltro !== economicos.length) {
        console.log(`🔒 Económicos filtrados por tenantId (${tenantId}): ${economicos.length} de ${totalAntesFiltro} totales`);
      }

      // Filtrar solo tractocamiones activos
      const economicosActivos = economicos.filter(e => {
        // Verificar que no estÃ© eliminado
        if (e.deleted === true) {return false;}

        // Verificar estado del vehÃ­culo (no inactivo ni retirado)
        const estadoVehiculo = (e.estadoVehiculo || e.estado || '').toLowerCase();
        if (estadoVehiculo === 'inactivo' || estadoVehiculo === 'retirado') {return false;}

        // Verificar campo activo (si existe)
        if (e.activo === false) {return false;}

        // Verificar campo estado (si existe y es 'Activo')
        const estado = (e.estado || '').toString();
        if (estado && estado.toLowerCase() !== 'activo' && estado.toLowerCase() !== 'activo') {
          // Si tiene estado definido y no es activo, excluir
          // Pero solo si el estado es explÃ­citamente inactivo/retirado
          if (estado.toLowerCase() === 'inactivo' || estado.toLowerCase() === 'retirado') {
            return false;
          }
        }

        return true;
      });

      window.ERPState.setCache('economicos', economicosActivos);
      console.log(`âœ… ${economicosActivos.length} tractocamiones activos cargados en cachÃ© (de ${economicos.length} totales)`);
    } catch (error) {
      console.error('âŒ Error cargando econÃ³micos en cachÃ©:', error);
    }
  }

  // FunciÃ³n para cargar operadores en cachÃ©
  async function cargarOperadoresEnCache() {
    try {
      let operadores = [];

      // PRIORIDAD 1: Intentar desde configuracionManager.getAllOperadores (si existe)
      if (window.configuracionManager && typeof window.configuracionManager.getAllOperadores === 'function') {
        operadores = window.configuracionManager.getAllOperadores() || [];
        console.log('âœ… Operadores cargados desde getAllOperadores:', operadores.length);
      }
      // PRIORIDAD 2: Intentar desde configuracionManager.getOperadores
      else if (window.configuracionManager && typeof window.configuracionManager.getOperadores === 'function') {
        const temp = window.configuracionManager.getOperadores();
        if (Array.isArray(temp)) {
          operadores = temp;
        } else if (temp && typeof temp === 'object') {
          // Convertir objeto a array
          operadores = Object.keys(temp).map(nombre => ({
            nombre: nombre,
            ...temp[nombre]
          }));
        }
        console.log('âœ… Operadores cargados desde getOperadores:', operadores.length);
      }

      // PRIORIDAD 3: Si no hay datos, cargar desde Firebase
      if (operadores.length === 0 && window.firebaseDb && window.fs) {
        try {
          const docRef = window.fs.doc(window.firebaseDb, 'configuracion', 'operadores');
          const doc = await window.fs.getDoc(docRef);
          if (doc.exists()) {
            const data = doc.data();
            if (data.operadores && Array.isArray(data.operadores)) {
              const todosLosOperadores = data.operadores.filter(o => o.deleted !== true);

              // Obtener tenantId actual
              let tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
              if (window.licenseManager && window.licenseManager.isLicenseActive()) {
                const licenseTenantId = window.licenseManager.getTenantId();
                if (licenseTenantId) {tenantId = licenseTenantId;}
              } else {
                const savedTenantId = localStorage.getItem('tenantId');
                if (savedTenantId) {tenantId = savedTenantId;}
              }

              // CRÍTICO: Filtrar por tenantId
              operadores = todosLosOperadores.filter(operador => {
                const operadorTenantId = operador.tenantId;
                return operadorTenantId === tenantId;
              });

              console.log(`🔒 Operadores filtrados por tenantId (${tenantId}): ${operadores.length} de ${todosLosOperadores.length} totales`);
            }
          }
        } catch (e) {
          console.warn('âš ï¸ Error cargando operadores desde Firebase:', e);
        }
      }

      // CRÍTICO: Filtrar por tenantId ANTES de filtrar por estado activo
      // Obtener tenantId actual
      let tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
      if (window.licenseManager && window.licenseManager.isLicenseActive()) {
        const licenseTenantId = window.licenseManager.getTenantId();
        if (licenseTenantId) {tenantId = licenseTenantId;}
      } else {
        const savedTenantId = localStorage.getItem('tenantId');
        if (savedTenantId) {tenantId = savedTenantId;}
      }

      const totalAntesFiltro = operadores.length;
      operadores = operadores.filter(operador => {
        const operadorTenantId = operador.tenantId;
        return operadorTenantId === tenantId;
      });

      if (totalAntesFiltro !== operadores.length) {
        console.log(`🔒 Operadores filtrados por tenantId (${tenantId}): ${operadores.length} de ${totalAntesFiltro} totales`);
      }

      // Filtrar operadores activos
      const operadoresActivos = operadores.filter(op => op.deleted !== true);

      // Actualizar TODOS los sistemas de cachÃ© para mantener sincronizaciÃ³n
      // 1. CachÃ© ERPState (usado por trafico.html)
      if (window.ERPState && typeof window.ERPState.setCache === 'function') {
        window.ERPState.setCache('operadores', operadoresActivos);
      }

      // 2. CachÃ© legacy (para compatibilidad)
      window._operadoresCache = operadoresActivos;

      // 3. CachÃ© alternativo (para compatibilidad)
      window.__operadoresCache = operadoresActivos;

      // Logging para debug
      if (operadoresActivos.length > 0) {
        const principales = operadoresActivos.filter(op => {
          const tipoOp = (op.tipoOperador || op.tipo || '').toLowerCase();
          return tipoOp === 'principal';
        });
        const secundarios = operadoresActivos.filter(op => {
          const tipoOp = (op.tipoOperador || op.tipo || '').toLowerCase();
          return tipoOp === 'secundario' || tipoOp === 'respaldo';
        });
        console.log(`ðŸ“Š Operadores en cachÃ©: ${principales.length} principales, ${secundarios.length} secundarios`);
      }

      console.log(`âœ… ${operadoresActivos.length} operadores cargados en cachÃ© global (sincronizado en todos los sistemas)`);
      return operadoresActivos;
    } catch (error) {
      console.error('âŒ Error cargando operadores en cachÃ©:', error);
      const vacio = [];
      if (window.ERPState && typeof window.ERPState.setCache === 'function') {
        window.ERPState.setCache('operadores', vacio);
      }
      window._operadoresCache = vacio;
      window.__operadoresCache = vacio;
      return [];
    }
  }

  // FunciÃ³n para filtrar econÃ³micos
  async function filtrarEconomicos(busqueda) {
    const input = document.getElementById('economico');
    const dropdown = document.getElementById('economico_dropdown');
    const _hiddenInput = document.getElementById('economico_value');

    if (!input || !dropdown) {return;}

    // Verificar y recargar cachÃ© si estÃ¡ vacÃ­o
    if (!window.ERPState.getCache('economicos') || window.ERPState.getCache('economicos').length === 0) {
      console.log('ðŸ”„ CachÃ© de econÃ³micos vacÃ­o en filtrarEconomicos, recargando...');
      await cargarEconomicosEnCache();
    }

    const termino = busqueda.toLowerCase().trim();

    // Limpiar dropdown
    dropdown.innerHTML = '';
    window.ERPState.setHighlightedIndex('economico', -1);

    if (termino.length === 0) {
      dropdown.classList.remove('show');
      return;
    }

    // Verificar nuevamente despuÃ©s de cargar
    const economicosCache = window.ERPState.getCache('economicos');
    if (!economicosCache || economicosCache.length === 0) {
      console.warn('âš ï¸ No hay econÃ³micos disponibles despuÃ©s de cargar');
      dropdown.innerHTML = '<div class="searchable-select-no-results">No hay econÃ³micos disponibles</div>';
      setTimeout(() => {
        actualizarPosicionDropdown(input, dropdown);
        dropdown.classList.add('show');
        // Forzar reflow/repaint para asegurar que el navegador renderice el dropdown
        void dropdown.offsetHeight; // Forzar reflow
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

    // Filtrar econÃ³micos: solo activos y que coincidan con la bÃºsqueda
    const filtrados = economicosCache.filter(e => {
      // Primero filtrar por activos (no deleted)
      if (e.deleted === true) {
        return false;
      }

      // Verificar estado del vehÃ­culo (no inactivo ni retirado)
      const estadoVehiculo = (e.estadoVehiculo || e.estado || '').toLowerCase();
      if (estadoVehiculo === 'inactivo' || estadoVehiculo === 'retirado') {
        return false;
      }

      // Verificar campo activo (si existe)
      if (e.activo === false) {
        return false;
      }

      // Verificar campo estado (si existe y es explÃ­citamente inactivo/retirado)
      const estado = (e.estado || '').toString();
      if (estado && (estado.toLowerCase() === 'inactivo' || estado.toLowerCase() === 'retirado')) {
        return false;
      }

      // Luego filtrar por bÃºsqueda de texto
      const numero = (e.numero || e.nombre || '').toString().toLowerCase();
      const placa = (e.placaTracto || e.placa || '').toString().toLowerCase();
      const marca = (e.marca || '').toString().toLowerCase();
      const modelo = (e.modelo || '').toString().toLowerCase();

      return numero.includes(termino) ||
               placa.includes(termino) ||
               marca.includes(termino) ||
               modelo.includes(termino);
    });

    if (filtrados.length === 0) {
      dropdown.innerHTML = '<div class="searchable-select-no-results">No se encontraron resultados</div>';
      setTimeout(() => {
        actualizarPosicionDropdown(input, dropdown);
        dropdown.classList.add('show');
        // Forzar reflow/repaint para asegurar que el navegador renderice el dropdown
        void dropdown.offsetHeight; // Forzar reflow
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

    // Limitar a 20 resultados
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

      item.innerHTML = `
          <div class="item-text">${texto}</div>
        `;

      item.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevenir que el blur se ejecute antes
        seleccionarEconomico(economico, numero);
      });

      dropdown.appendChild(item);
    });

    if (filtrados.length > 20) {
      const masItem = document.createElement('div');
      masItem.className = 'searchable-select-no-results';
      masItem.innerHTML = `<small>... y ${filtrados.length - 20} mÃ¡s. ContinÃºe escribiendo para filtrar.</small>`;
      dropdown.appendChild(masItem);
    }

    // Calcular posiciÃ³n para position: fixed
    setTimeout(() => {
      actualizarPosicionDropdown(input, dropdown);
      dropdown.classList.add('show');
      // Forzar reflow/repaint para asegurar que el navegador renderice el dropdown
      void dropdown.offsetHeight; // Forzar reflow
      requestAnimationFrame(() => {
        // Asegurar que el dropdown sea visible usando setProperty con important
        dropdown.style.setProperty('display', 'block', 'important');
        dropdown.style.setProperty('visibility', 'visible', 'important');
        dropdown.style.setProperty('opacity', '1', 'important');
        dropdown.style.setProperty('z-index', '999999', 'important');
      });
    }, 10);
  }

  // FunciÃ³n para actualizar posiciÃ³n del dropdown (position: fixed)
  function actualizarPosicionDropdown(input, dropdown) {
    if (!input || !dropdown) {
      console.warn('âš ï¸ actualizarPosicionDropdown: input o dropdown no encontrado');
      return;
    }

    // FunciÃ³n auxiliar para calcular y aplicar posiciÃ³n
    const calcularYPosicionar = () => {
      try {
        // Verificar que el input estÃ© visible
        const rect = input.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          // El elemento aÃºn no estÃ¡ visible, intentar de nuevo
          requestAnimationFrame(() => {
            setTimeout(calcularYPosicionar, 50);
          });
          return;
        }

        // Mover el dropdown al body si no estÃ¡ ya ahÃ­ (para evitar problemas de contexto de apilamiento)
        if (dropdown.parentElement !== document.body) {
          const originalParent = dropdown.parentElement;
          document.body.appendChild(dropdown);
          // Guardar referencia al padre original para restaurarlo despuÃ©s
          dropdown._originalParent = originalParent;
        }

        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const dropdownMaxHeight = 300;

        // Para position: fixed, usamos coordenadas del viewport (sin scrollY)
        // Mantener top como nÃºmero hasta el final
        let top = rect.bottom + 2; // PosiciÃ³n desde el top del viewport
        let { left } = rect; // Alineado exactamente con el input
        const width = Math.max(rect.width, 200); // MÃ­nimo 200px de ancho

        // Verificar si el dropdown cabe debajo del input
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        // Obtener altura real del dropdown (despuÃ©s de que se haya renderizado)
        // Usar scrollHeight para obtener la altura real del contenido
        let dropdownHeight = dropdown.scrollHeight || dropdownMaxHeight;
        // Limitar a la altura mÃ¡xima
        dropdownHeight = Math.min(dropdownHeight, dropdownMaxHeight);

        // Si no hay espacio suficiente abajo, mostrar arriba
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          // Posicionar justo arriba del input: top del input menos altura del dropdown menos espacio
          top = rect.top - dropdownHeight - 2;
          console.log('ðŸ“Œ Dropdown mostrado arriba del input (no hay espacio abajo)', {
            inputTop: rect.top,
            inputBottom: rect.bottom,
            dropdownHeight: dropdownHeight,
            calculatedTop: top,
            spaceAbove: spaceAbove,
            spaceBelow: spaceBelow
          });

          // Si el dropdown se sale por arriba del viewport, ajustar para que quede visible
          if (top < 10) {
            // Calcular espacio disponible desde el top del viewport hasta el input
            const availableSpace = rect.top - 10;

            if (availableSpace < dropdownHeight) {
              // Si no cabe todo el dropdown, posicionarlo desde arriba y limitar altura
              top = 10;
              // La altura se limitarÃ¡ por max-height en CSS (ya estÃ¡ configurado)
              console.log('âš ï¸ Dropdown ajustado al top del viewport (no cabe completamente)');
            } else {
              // Si cabe, posicionar justo arriba del input
              top = rect.top - dropdownHeight - 2;
              // Asegurar que no se salga por arriba
              if (top < 10) {
                top = 10;
              }
            }
          }
        } else {
          // Asegurar que el dropdown no se salga del viewport verticalmente cuando estÃ¡ abajo
          if (top + dropdownHeight > viewportHeight) {
            top = Math.max(10, viewportHeight - dropdownHeight - 10);
          }
        }

        // Asegurar que no se salga del viewport horizontalmente
        // Mantener alineado con el input, pero ajustar si es necesario
        if (left + width > viewportWidth) {
          left = Math.max(10, viewportWidth - width - 10);
        }
        if (left < 0) {
          left = 10;
        }

        // Asegurar que el dropdown tenga la clase 'show' antes de aplicar estilos
        dropdown.classList.add('show');

        // Aplicar estilos con z-index muy alto para estar por encima de todo
        // Usar setProperty con !important para asegurar que no sean sobrescritos
        dropdown.style.setProperty('position', 'fixed', 'important');
        dropdown.style.setProperty('top', `${top}px`, 'important');
        dropdown.style.setProperty('left', `${left}px`, 'important');
        dropdown.style.setProperty('width', `${width}px`, 'important');
        dropdown.style.setProperty('max-height', `${dropdownMaxHeight}px`, 'important');
        dropdown.style.setProperty('z-index', '999999', 'important');
        dropdown.style.setProperty('display', 'block', 'important');
        dropdown.style.setProperty('visibility', 'visible', 'important');
        dropdown.style.setProperty('opacity', '1', 'important');
        dropdown.style.setProperty('background-color', '#fff', 'important');
        dropdown.style.setProperty('border', '1px solid #ced4da', 'important');
        dropdown.style.setProperty('border-radius', '0.375rem', 'important');
        dropdown.style.setProperty('box-shadow', '0 0.5rem 1rem rgba(0, 0, 0, 0.15)', 'important');
        dropdown.style.setProperty('overflow-y', 'auto', 'important');
        dropdown.style.setProperty('overflow-x', 'hidden', 'important');
        dropdown.style.setProperty('margin', '0', 'important');
        dropdown.style.setProperty('padding', '0', 'important');
        dropdown.style.setProperty('pointer-events', 'auto', 'important');

        // Verificar que el dropdown estÃ© en el DOM y sea visible
        const computedStyle = window.getComputedStyle(dropdown);
        const isVisible = computedStyle.display !== 'none' &&
                           computedStyle.visibility !== 'hidden' &&
                           computedStyle.opacity !== '0';

        console.log('âœ… PosiciÃ³n del dropdown actualizada:', {
          top: `${top}px`,
          left: `${left}px`,
          width: `${width}px`,
          viewportHeight: viewportHeight,
          viewportWidth: viewportWidth,
          inputBottom: rect.bottom,
          inputTop: rect.top,
          inputLeft: rect.left,
          inputWidth: rect.width,
          spaceBelow: spaceBelow,
          spaceAbove: spaceAbove,
          parentElement: dropdown.parentElement.tagName,
          hasShowClass: dropdown.classList.contains('show'),
          computedDisplay: computedStyle.display,
          computedVisibility: computedStyle.visibility,
          computedOpacity: computedStyle.opacity,
          computedZIndex: computedStyle.zIndex,
          isVisible: isVisible,
          inDOM: document.body.contains(dropdown)
        });

        // FunciÃ³n para forzar repaint agresivo
        const forzarRepaint = () => {
          // MÃºltiples tÃ©cnicas para forzar repaint
          void dropdown.offsetHeight; // Reflow
          void dropdown.getBoundingClientRect(); // Layout recalculation
          void dropdown.scrollTop; // Scroll property access

          // Cambiar temporalmente una propiedad para forzar repaint
          const originalTransform = dropdown.style.transform;
          dropdown.style.setProperty('transform', 'translateZ(0)', 'important');
          void dropdown.offsetHeight;
          if (originalTransform) {
            dropdown.style.setProperty('transform', originalTransform, 'important');
          } else {
            dropdown.style.removeProperty('transform');
          }
          void dropdown.offsetHeight;
        };

        // Si no es visible, intentar forzar visibilidad nuevamente
        if (!isVisible) {
          console.warn('âš ï¸ Dropdown no es visible, forzando visibilidad...');
          dropdown.style.setProperty('display', 'block', 'important');
          dropdown.style.setProperty('visibility', 'visible', 'important');
          dropdown.style.setProperty('opacity', '1', 'important');
          forzarRepaint();
        }

        // Forzar repaint agresivo para asegurar que el navegador renderice el dropdown inmediatamente
        // Esto es crÃ­tico para que el dropdown sea visible sin necesidad de cambiar de ventana
        forzarRepaint();

        // Forzar repaint en mÃºltiples requestAnimationFrame
        requestAnimationFrame(() => {
          forzarRepaint();
          requestAnimationFrame(() => {
            forzarRepaint();
          });
        });

        // Asegurar que el dropdown tenga la clase 'show' y estÃ© visible
        if (!dropdown.classList.contains('show')) {
          dropdown.classList.add('show');
          // Forzar otro reflow despuÃ©s de agregar la clase
          void dropdown.offsetHeight;
        }

        // Asegurar que el dropdown estÃ© visible con estilos explÃ­citos usando setProperty con important
        dropdown.style.setProperty('display', 'block', 'important');
        dropdown.style.setProperty('visibility', 'visible', 'important');
        dropdown.style.setProperty('opacity', '1', 'important');
        dropdown.style.setProperty('z-index', '999999', 'important');

        // Forzar un Ãºltimo reflow para asegurar que todos los cambios se rendericen
        void dropdown.offsetHeight;
      } catch (error) {
        console.error('âŒ Error actualizando posiciÃ³n del dropdown:', error);
      }
    };

    // Agregar clase 'show' y estilos de visibilidad inmediatamente
    dropdown.classList.add('show');
    // Usar setProperty con important para sobrescribir el CSS que tiene display: none !important
    dropdown.style.setProperty('display', 'block', 'important');
    dropdown.style.setProperty('visibility', 'visible', 'important');
    dropdown.style.setProperty('opacity', '1', 'important');
    dropdown.style.setProperty('z-index', '999999', 'important');

    // Forzar reflow inmediato para asegurar visibilidad
    void dropdown.offsetHeight;

    // Usar mÃºltiples requestAnimationFrame para asegurar que el DOM estÃ© completamente renderizado
    // Esto es especialmente importante cuando el dropdown se abre en un modal que se estÃ¡ renderizando
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        calcularYPosicionar();
        // Forzar reflow despuÃ©s de calcular posiciÃ³n para asegurar visibilidad inmediata
        void dropdown.offsetHeight;
      });
    });
  }

  // FunciÃ³n para seleccionar econÃ³mico
  function seleccionarEconomico(economico, valor) {
    const input = document.getElementById('economico');
    const dropdown = document.getElementById('economico_dropdown');
    const hiddenInput = document.getElementById('economico_value');

    if (!input) {return;}

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

    input.value = texto;
    if (hiddenInput) {hiddenInput.value = numero;}

    // Primero restaurar a su contenedor original y limpiar estilos antes de ocultar
    if (dropdown._originalParent && dropdown.parentElement === document.body) {
      dropdown.style.cssText = '';
      dropdown._originalParent.appendChild(dropdown);
      dropdown._originalParent = null;
    } else {
      dropdown.style.cssText = '';
    }
    dropdown.classList.remove('show');

    // Llamar a la funciÃ³n existente para cargar datos
    if (typeof loadEconomicoData === 'function') {
      // Simular el evento onchange (ahora es async)
      loadEconomicoData().catch(err => console.warn('Error en loadEconomicoData:', err));
    }
  }
  window.seleccionarEconomico = seleccionarEconomico;

  // FunciÃ³n para mostrar dropdown de econÃ³micos
  async function mostrarDropdownEconomicos() {
    const input = document.getElementById('economico');
    const dropdown = document.getElementById('economico_dropdown');

    if (!input || !dropdown) {return;}

    // Verificar y recargar cachÃ© si estÃ¡ vacÃ­o
    if (!window.ERPState.getCache('economicos') || window.ERPState.getCache('economicos').length === 0) {
      console.log('ðŸ”„ CachÃ© de econÃ³micos vacÃ­o en mostrarDropdownEconomicos, recargando...');
      await cargarEconomicosEnCache();
    }

    // Verificar nuevamente despuÃ©s de cargar
    const economicosCache = window.ERPState.getCache('economicos');
    if (!economicosCache || economicosCache.length === 0) {
      console.warn('âš ï¸ No hay econÃ³micos disponibles despuÃ©s de cargar');
      dropdown.innerHTML = '<div class="searchable-select-no-results">No hay econÃ³micos disponibles</div>';
      setTimeout(() => {
        actualizarPosicionDropdown(input, dropdown);
        dropdown.classList.add('show');
        // Forzar reflow/repaint para asegurar que el navegador renderice el dropdown
        void dropdown.offsetHeight; // Forzar reflow
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

    // Si hay un valor en el input, filtrar con ese valor
    if (input.value.trim().length > 0) {
      await filtrarEconomicos(input.value);
    } else {
      // Si no hay bÃºsqueda, mostrar todos los econÃ³micos activos (primeros 20)
      // Filtrar solo activos (no deleted y estado activo)
      const economicosActivos = economicosCache.filter(e => {
        // Verificar que no estÃ© eliminado
        if (e.deleted === true) {return false;}

        // Verificar estado del vehÃ­culo (no inactivo ni retirado)
        const estadoVehiculo = (e.estadoVehiculo || e.estado || '').toLowerCase();
        if (estadoVehiculo === 'inactivo' || estadoVehiculo === 'retirado') {return false;}

        // Verificar campo activo (si existe)
        if (e.activo === false) {return false;}

        // Verificar campo estado (si existe y es explÃ­citamente inactivo/retirado)
        const estado = (e.estado || '').toString();
        if (estado && (estado.toLowerCase() === 'inactivo' || estado.toLowerCase() === 'retirado')) {
          return false;
        }

        return true;
      });
      const limitados = economicosActivos.slice(0, 20);
      dropdown.innerHTML = '';
      window.ERPState.setHighlightedIndex('economico', -1);

      limitados.forEach((economico) => {
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
        item.addEventListener('mousedown', (e) => {
          e.preventDefault(); // Prevenir que el blur se ejecute antes
          seleccionarEconomico(economico, numero);
        });
        dropdown.appendChild(item);
      });

      // Calcular posiciÃ³n para position: fixed
      actualizarPosicionDropdown(input, dropdown);
      dropdown.classList.add('show');
      // Forzar reflow/repaint para asegurar que el navegador renderice el dropdown
      void dropdown.offsetHeight; // Forzar reflow
      requestAnimationFrame(() => {
        dropdown.style.display = 'block';
        dropdown.style.visibility = 'visible';
        dropdown.style.opacity = '1';
        void dropdown.offsetHeight;
      });
    }
  }
  // Exponer inmediatamente
  window.mostrarDropdownEconomicos = mostrarDropdownEconomicos;

  // FunciÃ³n para ocultar dropdown de econÃ³micos
  function ocultarDropdownEconomicos(immediate = false) {
    const dropdown = document.getElementById('economico_dropdown');
    const input = document.getElementById('economico');

    if (!dropdown) {return;}

    // FunciÃ³n auxiliar para ocultar y restaurar
    const ocultarYRestaurar = () => {
      if (dropdown.classList.contains('show')) {
        // Primero restaurar a su contenedor original y limpiar estilos antes de ocultar
        if (dropdown._originalParent && dropdown.parentElement === document.body) {
          dropdown.style.cssText = '';
          dropdown._originalParent.appendChild(dropdown);
          dropdown._originalParent = null;
        } else {
          dropdown.style.cssText = '';
        }
        // Luego ocultar
        dropdown.classList.remove('show');
      }
    };

    if (!immediate) {
      // Delay para permitir clicks en el dropdown
      setTimeout(() => {
        if (dropdown && dropdown.classList.contains('show')) {
          // Verificar si el dropdown o el input tienen foco
          if (document.activeElement !== input && !dropdown.contains(document.activeElement)) {
            ocultarYRestaurar();
          }
        }
      }, 200);
    } else {
      ocultarYRestaurar();
    }
  }
  // Exponer inmediatamente
  window.ocultarDropdownEconomicos = ocultarDropdownEconomicos;

  // FunciÃ³n para manejar teclado en econÃ³micos
  function manejarTecladoEconomicos(event) {
    const dropdown = document.getElementById('economico_dropdown');
    const items = dropdown?.querySelectorAll('.searchable-select-item');

    if (!items || items.length === 0) {return;}

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const currentIndex = window.ERPState.getHighlightedIndex('economico');
      const newIndex = Math.min(currentIndex + 1, items.length - 1);
      window.ERPState.setHighlightedIndex('economico', newIndex);
      items.forEach((item, index) => {
        item.classList.toggle('highlighted', index === newIndex);
      });
      items[newIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const currentIndex = window.ERPState.getHighlightedIndex('economico');
      const newIndex = Math.max(currentIndex - 1, -1);
      window.ERPState.setHighlightedIndex('economico', newIndex);
      items.forEach((item, index) => {
        item.classList.toggle('highlighted', index === newIndex);
      });
      if (newIndex >= 0) {
        items[newIndex]?.scrollIntoView({ block: 'nearest' });
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const highlightedIndex = window.ERPState.getHighlightedIndex('economico');
      if (highlightedIndex >= 0 && items[highlightedIndex]) {
        items[highlightedIndex].click();
      }
    } else if (event.key === 'Escape') {
      ocultarDropdownEconomicos();
    }
  }
  window.manejarTecladoEconomicos = manejarTecladoEconomicos;
  window.filtrarEconomicos = filtrarEconomicos;
  window.desplegarListaEconomicos = desplegarListaEconomicos;

  // FunciÃ³n para filtrar operadores
  function filtrarOperadores(busqueda, tipo) {
    const inputId = tipo === 'principal' ? 'operadorprincipal' : 'operadorsecundario';
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(`${inputId}_dropdown`);
    const _hiddenInput = document.getElementById(`${inputId}_value`);

    if (!input || !dropdown) {return;}

    const termino = busqueda.toLowerCase().trim();

    // Limpiar dropdown
    dropdown.innerHTML = '';
    window.ERPState.getHighlightedIndex()[inputId] = -1;

    if (termino.length === 0) {
      dropdown.classList.remove('show');
      return;
    }

    // Intentar obtener operadores de todos los cachÃ©s disponibles
    let operadoresFiltrados = [];

    // PRIORIDAD 1: ERPState
    if (window.ERPState && typeof window.ERPState.getCache === 'function') {
      operadoresFiltrados = window.ERPState.getCache('operadores') || [];
    }

    // PRIORIDAD 2: CachÃ© legacy
    if ((!operadoresFiltrados || operadoresFiltrados.length === 0) && window._operadoresCache) {
      operadoresFiltrados = Array.isArray(window._operadoresCache) ? window._operadoresCache : [];
    }

    // PRIORIDAD 3: CachÃ© alternativo
    if ((!operadoresFiltrados || operadoresFiltrados.length === 0) && window.__operadoresCache) {
      operadoresFiltrados = Array.isArray(window.__operadoresCache) ? window.__operadoresCache : [];
    }

    // Solo recargar si estÃ¡ completamente vacÃ­o (0 operadores) y no se estÃ¡ recargando ya
    // NO recargar si tiene 1-2 operadores, puede ser el total real del sistema
    const ahora = Date.now();
    const tiempoDesdeUltimaRecarga = ahora - window._ultimaRecargaOperadores;
    const debeRecargar = (!operadoresFiltrados || operadoresFiltrados.length === 0) &&
                           !window._recargandoOperadores &&
                           tiempoDesdeUltimaRecarga > 2000; // Esperar al menos 2 segundos entre recargas

    if (debeRecargar) {
      console.log(`ðŸ”„ CachÃ© de operadores vacÃ­o en filtrarOperadores (${operadoresFiltrados.length} operadores), recargando...`);
      window._recargandoOperadores = true;
      window._ultimaRecargaOperadores = ahora;

      // Intentar recargar desde mÃºltiples fuentes
      let recargaPromesa = null;

      if (typeof window.cargarOperadoresEnCache === 'function') {
        recargaPromesa = window.cargarOperadoresEnCache();
      } else if (window.traficoListasManager && typeof window.traficoListasManager.loadOperadoresList === 'function') {
        recargaPromesa = window.traficoListasManager.loadOperadoresList();
      } else if (window.configuracionManager && typeof window.configuracionManager.getAllOperadores === 'function') {
        // Cargar directamente desde configuracionManager
        const operadores = window.configuracionManager.getAllOperadores() || [];
        const operadoresActivos = operadores.filter(op => op.deleted !== true);
        if (window.ERPState && typeof window.ERPState.setCache === 'function') {
          window.ERPState.setCache('operadores', operadoresActivos);
        }
        window._operadoresCache = operadoresActivos;
        window.__operadoresCache = operadoresActivos;
        recargaPromesa = Promise.resolve(operadoresActivos);
      }

      if (recargaPromesa) {
        recargaPromesa.then(() => {
          window._recargandoOperadores = false;
          // Esperar un momento para que el cachÃ© se actualice
          setTimeout(() => {
            filtrarOperadores(busqueda, tipo); // Reintentar despuÃ©s de cargar
          }, 100);
        }).catch(err => {
          console.error('âŒ Error recargando operadores:', err);
          window._recargandoOperadores = false;
        });
        return;
      }
      window._recargandoOperadores = false;
    } else if (operadoresFiltrados.length > 0 && operadoresFiltrados.length < 3) {
      // Si hay 1-2 operadores, puede ser el total real, continuar con lo que hay
      console.log(`â„¹ï¸ CachÃ© tiene ${operadoresFiltrados.length} operador(es) en filtrarOperadores, continuando (puede ser el total real del sistema)`);
    }

    console.log(`ðŸ” Filtrando operadores para tipo: ${tipo}, Total en cachÃ©: ${operadoresFiltrados.length}`);

    // Primero filtrar solo operadores activos
    // Un operador estÃ¡ activo si: NO estÃ¡ eliminado Y (estado === 'activo' O no tiene estado definido)
    const antesFiltro = operadoresFiltrados.length;
    operadoresFiltrados = operadoresFiltrados.filter(op => {
      // Verificar que no estÃ© eliminado
      if (op.deleted === true) {return false;}

      // Verificar estado: puede ser 'estado' o 'estadoOperador'
      const estado = op.estado || op.estadoOperador;

      // Un operador estÃ¡ activo si:
      // 1. NO estÃ¡ eliminado (deleted !== true) Y
      // 2. (estado === 'activo' O no tiene estado definido)
      // Si tiene estado y NO es 'activo', estÃ¡ inactivo (suspendido, inactivo, etc.)
      if (!estado) {return true;} // Sin estado definido = activo
      return estado.toLowerCase() === 'activo'; // Solo 'activo' es activo
    });
    console.log(`ðŸ” DespuÃ©s de filtrar activos: ${operadoresFiltrados.length} (antes: ${antesFiltro})`);

    if (tipo === 'principal') {
      const antesTipo = operadoresFiltrados.length;
      operadoresFiltrados = operadoresFiltrados.filter(op => {
        // Solo mostrar operadores que tienen tipoOperador === 'principal'
        // NO incluir operadores sin tipoOperador definido
        const tipoOp = (op.tipoOperador || op.tipo || '').toLowerCase();
        return tipoOp === 'principal';
      });
      console.log(`ðŸ” DespuÃ©s de filtrar por tipo 'principal': ${operadoresFiltrados.length} (antes: ${antesTipo})`);
    } else if (tipo === 'secundario') {
      const antesTipo = operadoresFiltrados.length;
      operadoresFiltrados = operadoresFiltrados.filter(op => {
        const tipoOp = (op.tipoOperador || op.tipo || '').toLowerCase();
        return tipoOp === 'secundario' || tipoOp === 'respaldo';
      });
      console.log(`ðŸ” DespuÃ©s de filtrar por tipo 'secundario': ${operadoresFiltrados.length} (antes: ${antesTipo})`);
    }

    console.log(`âœ… Operadores filtrados para ${tipo}: ${operadoresFiltrados.length}`);

    // Si despuÃ©s de filtrar no hay resultados, verificar si el cachÃ© parece estar cargÃ¡ndose
    // Solo mostrar mensaje si el cachÃ© parece estar completo (mÃ¡s de 5 operadores)
    // Esto evita mostrar mensajes durante la carga inicial
    if (operadoresFiltrados.length === 0) {
      // Solo mostrar mensaje si el cachÃ© parece estar completo
      // Si tiene menos de 5 operadores, probablemente estÃ¡ cargÃ¡ndose o es un sistema pequeÃ±o
      if (antesFiltro >= 5) {
        console.log(`â„¹ï¸ No hay operadores de tipo '${tipo}' despuÃ©s de filtrar (cachÃ© original tenÃ­a ${antesFiltro} operadores)`);
      }
      // Si tiene menos de 5, no mostrar mensaje (puede estar cargÃ¡ndose o ser un sistema pequeÃ±o)
    }

    // Filtrar por bÃºsqueda
    const filtrados = operadoresFiltrados.filter(op => {
      const nombre = (op.nombre || '').toString().toLowerCase();
      const licencia = (op.licencia || '').toString().toLowerCase();
      return nombre.includes(termino) || licencia.includes(termino);
    });

    if (filtrados.length === 0) {
      dropdown.innerHTML = '<div class="searchable-select-no-results">No se encontraron resultados</div>';
      setTimeout(() => {
        actualizarPosicionDropdown(input, dropdown);
        // Recalcular posiciÃ³n despuÃ©s de un pequeÃ±o delay adicional si el elemento estÃ¡ en un modal
        const modal = input.closest('.modal');
        if (modal) {
          setTimeout(() => {
            actualizarPosicionDropdown(input, dropdown);
          }, 100);
        }
        dropdown.classList.add('show');
        // Forzar reflow/repaint para asegurar que el navegador renderice el dropdown
        void dropdown.offsetHeight; // Forzar reflow
        requestAnimationFrame(() => {
          // Asegurar que el dropdown sea visible
          dropdown.style.display = 'block';
          dropdown.style.visibility = 'visible';
          dropdown.style.setProperty('opacity', '1', 'important');
          // Forzar otro reflow para asegurar renderizado
          void dropdown.offsetHeight;
        });
      }, 50);
      return;
    }

    // Limitar a 20 resultados
    const limitados = filtrados.slice(0, 20);

    limitados.forEach((operador, index) => {
      const item = document.createElement('div');
      item.className = 'searchable-select-item';
      item.dataset.index = index;

      const nombre = operador.nombre || 'N/A';
      const licencia = operador.licencia || '';

      item.innerHTML = `
          <div class="item-text">${nombre}</div>
          ${licencia ? `<div class="item-subtext">Licencia: ${licencia}</div>` : ''}
        `;

      item.addEventListener('click', () => {
        seleccionarOperador(operador, nombre, tipo);
      });

      dropdown.appendChild(item);
    });

    if (filtrados.length > 20) {
      const masItem = document.createElement('div');
      masItem.className = 'searchable-select-no-results';
      masItem.innerHTML = `<small>... y ${filtrados.length - 20} mÃ¡s. ContinÃºe escribiendo para filtrar.</small>`;
      dropdown.appendChild(masItem);
    }

    setTimeout(() => {
      actualizarPosicionDropdown(input, dropdown);
      // Recalcular posiciÃ³n despuÃ©s de un pequeÃ±o delay adicional si el elemento estÃ¡ en un modal
      const modal = input.closest('.modal');
      if (modal) {
        setTimeout(() => {
          actualizarPosicionDropdown(input, dropdown);
        }, 100);
      }
      dropdown.classList.add('show');
      // Forzar reflow/repaint para asegurar que el navegador renderice el dropdown
      void dropdown.offsetHeight; // Forzar reflow
      requestAnimationFrame(() => {
        // Asegurar que el dropdown sea visible usando setProperty con important
        dropdown.style.setProperty('display', 'block', 'important');
        dropdown.style.setProperty('visibility', 'visible', 'important');
        dropdown.style.setProperty('opacity', '1', 'important');
        dropdown.style.setProperty('z-index', '999999', 'important');
        // Forzar otro reflow para asegurar renderizado
        void dropdown.offsetHeight;
      });
    }, 50);
  }

  // FunciÃ³n para seleccionar operador
  function seleccionarOperador(operador, valor, tipo) {
    const inputId = tipo === 'principal' ? 'operadorprincipal' : 'operadorsecundario';
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(`${inputId}_dropdown`);
    const _hiddenInput = document.getElementById(`${inputId}_value`);

    if (!input) {return;}

    const nombre = operador.nombre || valor;
    const licenciaTexto = operador.licencia || '';

    let texto = nombre;
    if (licenciaTexto) {
      texto += ` - ${licenciaTexto}`;
    }

    input.value = texto;
    if (hiddenInput) {hiddenInput.value = nombre;}

    // Llenar campo de licencia directamente desde el objeto operador
    const licencia = operador.licencia || operador.numeroLicencia || operador.licenciaOperador || '';
    if (licencia) {
      if (tipo === 'principal') {
        const licenciaField = document.getElementById('Licencia');
        if (licenciaField) {
          licenciaField.value = licencia;
          console.log('âœ… Licencia del operador principal llenada directamente:', licencia);
        } else {
          console.warn('âš ï¸ Campo Licencia no encontrado en el DOM');
        }
      } else if (tipo === 'secundario') {
        const licenciaSecundariaField = document.getElementById('LicenciaSecundaria');
        if (licenciaSecundariaField) {
          licenciaSecundariaField.value = licencia;
          console.log('âœ… Licencia del operador secundario llenada directamente:', licencia);
        } else {
          console.warn('âš ï¸ Campo LicenciaSecundaria no encontrado en el DOM');
        }
      }
    } else {
      console.warn('âš ï¸ Operador seleccionado no tiene licencia:', operador);
    }

    // Primero restaurar a su contenedor original y limpiar estilos antes de ocultar
    if (dropdown._originalParent && dropdown.parentElement === document.body) {
      dropdown.style.cssText = '';
      dropdown._originalParent.appendChild(dropdown);
      dropdown._originalParent = null;
    } else {
      dropdown.style.cssText = '';
    }
    dropdown.classList.remove('show');

    // Llamar a la funciÃ³n existente para cargar otros datos (si es necesario)
    // Usar setTimeout para asegurar que el DOM estÃ© actualizado
    setTimeout(() => {
      if (tipo === 'principal' && typeof loadOperadorPrincipalData === 'function') {
        console.log('ðŸ”„ Llamando a loadOperadorPrincipalData para otros datos...');
        loadOperadorPrincipalData().catch(err => {
          console.error('âŒ Error en loadOperadorPrincipalData:', err);
        });
      } else if (tipo === 'secundario' && typeof loadOperadorSecundarioData === 'function') {
        console.log('ðŸ”„ Llamando a loadOperadorSecundarioData para otros datos...');
        loadOperadorSecundarioData().catch(err => {
          console.error('âŒ Error en loadOperadorSecundarioData:', err);
        });
      }
    }, 100);
  }

  // FunciÃ³n para mostrar dropdown de operadores
  async function mostrarDropdownOperadores(tipo) {
    const inputId = tipo === 'principal' ? 'operadorprincipal' : 'operadorsecundario';
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(`${inputId}_dropdown`);

    if (!input || !dropdown) {return;}

    if (input.value.trim().length > 0) {
      filtrarOperadores(input.value, tipo);
      return;
    }

    // Intentar obtener operadores de todos los cachÃ©s disponibles
    let operadoresFiltrados = [];

    // PRIORIDAD 1: ERPState
    if (window.ERPState && typeof window.ERPState.getCache === 'function') {
      operadoresFiltrados = window.ERPState.getCache('operadores') || [];
    }

    // PRIORIDAD 2: CachÃ© legacy
    if ((!operadoresFiltrados || operadoresFiltrados.length === 0) && window._operadoresCache) {
      operadoresFiltrados = Array.isArray(window._operadoresCache) ? window._operadoresCache : [];
    }

    // PRIORIDAD 3: CachÃ© alternativo
    if ((!operadoresFiltrados || operadoresFiltrados.length === 0) && window.__operadoresCache) {
      operadoresFiltrados = Array.isArray(window.__operadoresCache) ? window.__operadoresCache : [];
    }

    // Solo recargar si estÃ¡ completamente vacÃ­o (0 operadores) y no se estÃ¡ recargando ya
    // NO recargar si tiene 1-2 operadores, puede ser el total real del sistema
    const ahora = Date.now();
    const tiempoDesdeUltimaRecarga = ahora - (window._ultimaRecargaOperadores || 0);
    const debeRecargar = (!operadoresFiltrados || operadoresFiltrados.length === 0) &&
                           !window._recargandoOperadores &&
                           tiempoDesdeUltimaRecarga > 2000; // Esperar al menos 2 segundos entre recargas

    if (debeRecargar) {
      console.log(`ðŸ”„ CachÃ© de operadores vacÃ­o (${operadoresFiltrados.length} operadores), recargando...`);
      window._recargandoOperadores = true;
      window._ultimaRecargaOperadores = ahora;

      // Intentar recargar desde mÃºltiples fuentes
      let recargaPromesa = null;

      // PRIORIDAD: Usar traficoListasManager porque preserva correctamente tipoOperador
      if (window.traficoListasManager && typeof window.traficoListasManager.loadOperadoresList === 'function') {
        recargaPromesa = window.traficoListasManager.loadOperadoresList();
      } else if (typeof window.cargarOperadoresEnCache === 'function') {
        recargaPromesa = window.cargarOperadoresEnCache();
      } else if (window.configuracionManager && typeof window.configuracionManager.getAllOperadores === 'function') {
        // Cargar directamente desde configuracionManager
        const operadores = window.configuracionManager.getAllOperadores() || [];
        // Filtrar solo operadores activos: estado === 'activo' O no tiene estado O no estÃ¡ eliminado
        // (Misma lÃ³gica que trafico-firebase.js lÃ­nea 158: o.estado === 'activo' || !o.estado || o.deleted !== true)
        const operadoresActivos = operadores.filter(op => {
          const estado = op.estado || op.estadoOperador;
          // Un operador estÃ¡ activo si: estado === 'activo' O no tiene estado O no estÃ¡ eliminado
          return (estado && estado.toLowerCase() === 'activo') || !estado || op.deleted !== true;
        });
        if (window.ERPState && typeof window.ERPState.setCache === 'function') {
          window.ERPState.setCache('operadores', operadoresActivos);
        }
        window._operadoresCache = operadoresActivos;
        window.__operadoresCache = operadoresActivos;
        recargaPromesa = Promise.resolve(operadoresActivos);
      }

      if (recargaPromesa) {
        try {
          await recargaPromesa;
          window._recargandoOperadores = false;
          // Actualizar operadoresFiltrados despuÃ©s de cargar
          if (window.ERPState && typeof window.ERPState.getCache === 'function') {
            operadoresFiltrados = window.ERPState.getCache('operadores') || [];
          }
          // Continuar con el proceso de mostrar el dropdown
        } catch (err) {
          console.error('âŒ Error recargando operadores:', err);
          window._recargandoOperadores = false;
          return;
        }
      } else {
        window._recargandoOperadores = false;
      }
    } else if (operadoresFiltrados.length > 0 && operadoresFiltrados.length < 3) {
      // Si hay 1-2 operadores, puede ser el total real, continuar con lo que hay
      console.log(`â„¹ï¸ CachÃ© tiene ${operadoresFiltrados.length} operador(es), continuando (puede ser el total real del sistema)`);
    }

    console.log(`ðŸ” Filtrando operadores para tipo: ${tipo}, Total en cachÃ©: ${operadoresFiltrados.length}`);

    // Primero filtrar solo operadores activos
    // Un operador estÃ¡ activo si: NO estÃ¡ eliminado Y (estado === 'activo' O no tiene estado definido)
    const antesFiltro = operadoresFiltrados.length;
    operadoresFiltrados = operadoresFiltrados.filter(op => {
      // Verificar que no estÃ© eliminado
      if (op.deleted === true) {return false;}

      // Verificar estado: puede ser 'estado' o 'estadoOperador'
      const estado = op.estado || op.estadoOperador;

      // Un operador estÃ¡ activo si:
      // 1. NO estÃ¡ eliminado (deleted !== true) Y
      // 2. (estado === 'activo' O no tiene estado definido)
      // Si tiene estado y NO es 'activo', estÃ¡ inactivo (suspendido, inactivo, etc.)
      if (!estado) {return true;} // Sin estado definido = activo
      return estado.toLowerCase() === 'activo'; // Solo 'activo' es activo
    });
    console.log(`ðŸ” DespuÃ©s de filtrar activos: ${operadoresFiltrados.length} (antes: ${antesFiltro})`);

    if (tipo === 'principal') {
      const antesTipo = operadoresFiltrados.length;
      operadoresFiltrados = operadoresFiltrados.filter(op => {
        // Solo mostrar operadores que tienen tipoOperador === 'principal'
        // NO incluir operadores sin tipoOperador definido
        const tipoOp = (op.tipoOperador || op.tipo || '').toLowerCase();
        return tipoOp === 'principal';
      });
      console.log(`ðŸ” DespuÃ©s de filtrar por tipo 'principal': ${operadoresFiltrados.length} (antes: ${antesTipo})`);
    } else if (tipo === 'secundario') {
      const antesTipo = operadoresFiltrados.length;
      operadoresFiltrados = operadoresFiltrados.filter(op => {
        const tipoOp = (op.tipoOperador || op.tipo || '').toLowerCase();
        return tipoOp === 'secundario' || tipoOp === 'respaldo';
      });
      console.log(`ðŸ” DespuÃ©s de filtrar por tipo 'secundario': ${operadoresFiltrados.length} (antes: ${antesTipo})`);
    }

    console.log(`âœ… Operadores filtrados para ${tipo}: ${operadoresFiltrados.length}`);

    // Si despuÃ©s de filtrar no hay resultados, verificar si el cachÃ© parece estar cargÃ¡ndose
    // Solo mostrar mensaje si el cachÃ© parece estar completo (mÃ¡s de 5 operadores)
    // Esto evita mostrar mensajes durante la carga inicial
    if (operadoresFiltrados.length === 0) {
      // Solo mostrar mensaje si el cachÃ© parece estar completo
      // Si tiene menos de 5 operadores, probablemente estÃ¡ cargÃ¡ndose o es un sistema pequeÃ±o
      if (antesFiltro >= 5) {
        console.log(`â„¹ï¸ No hay operadores de tipo '${tipo}' despuÃ©s de filtrar (cachÃ© original tenÃ­a ${antesFiltro} operadores)`);
      }
      // Si tiene menos de 5, no mostrar mensaje (puede estar cargÃ¡ndose o ser un sistema pequeÃ±o)
    }

    const limitados = operadoresFiltrados.slice(0, 20);
    dropdown.innerHTML = '';

    // Si no hay operadores, mostrar mensaje
    if (limitados.length === 0) {
      const noResultsItem = document.createElement('div');
      noResultsItem.className = 'searchable-select-item';
      noResultsItem.innerHTML = '<div class="item-text text-muted">No hay operadores disponibles</div>';
      dropdown.appendChild(noResultsItem);
    } else {
      limitados.forEach((operador) => {
        const item = document.createElement('div');
        item.className = 'searchable-select-item';

        const nombre = operador.nombre || 'N/A';
        const licencia = operador.licencia || '';

        item.innerHTML = `
            <div class="item-text">${nombre}</div>
            ${licencia ? `<div class="item-subtext">Licencia: ${licencia}</div>` : ''}
          `;

        item.addEventListener('mousedown', (e) => {
          e.preventDefault(); // Prevenir que el blur se ejecute antes
          seleccionarOperador(operador, nombre, tipo);
        });
        dropdown.appendChild(item);
      });
    }

    // Agregar listener de scroll en el dropdown para prevenir que se cierre
    // cuando el usuario hace scroll dentro del dropdown
    if (!dropdown._scrollListenerAdded) {
      dropdown.addEventListener('scroll', (e) => {
        // Prevenir que el scroll dentro del dropdown cierre el dropdown
        e.stopPropagation();
      }, true); // Usar capture phase
      dropdown._scrollListenerAdded = true;
    }

    // FunciÃ³n para forzar repaint agresivo
    const forzarRepaint = () => {
      // MÃºltiples tÃ©cnicas para forzar repaint
      void dropdown.offsetHeight; // Reflow
      void dropdown.getBoundingClientRect(); // Layout recalculation
      void dropdown.scrollTop; // Scroll property access

      // Cambiar temporalmente una propiedad para forzar repaint
      const originalTransform = dropdown.style.transform;
      dropdown.style.setProperty('transform', 'translateZ(0)', 'important');
      void dropdown.offsetHeight;
      if (originalTransform) {
        dropdown.style.setProperty('transform', originalTransform, 'important');
      } else {
        dropdown.style.removeProperty('transform');
      }
      void dropdown.offsetHeight;
    };

    // Agregar clase 'show' inmediatamente para que el dropdown sea visible
    dropdown.classList.add('show');
    // Usar setProperty con important para sobrescribir el CSS que tiene display: none !important
    dropdown.style.setProperty('display', 'block', 'important');
    dropdown.style.setProperty('visibility', 'visible', 'important');
    dropdown.style.setProperty('opacity', '1', 'important');
    dropdown.style.setProperty('z-index', '999999', 'important');

    // Forzar repaint agresivo inmediatamente
    forzarRepaint();

    // Forzar repaint en mÃºltiples requestAnimationFrame para asegurar renderizado
    requestAnimationFrame(() => {
      forzarRepaint();
      requestAnimationFrame(() => {
        forzarRepaint();
      });
    });

    // Usar un delay mayor para asegurar que el modal/contenedor estÃ© completamente renderizado
    // Especialmente importante cuando se abre en la lista validada
    setTimeout(() => {
      actualizarPosicionDropdown(input, dropdown);
      // Recalcular posiciÃ³n despuÃ©s de un pequeÃ±o delay adicional si el elemento estÃ¡ en un modal
      const modal = input.closest('.modal');
      if (modal) {
        setTimeout(() => {
          actualizarPosicionDropdown(input, dropdown);
          // Forzar reflow despuÃ©s de recalcular en modal
          void dropdown.offsetHeight;
        }, 100);
      }
      // Forzar reflow despuÃ©s de actualizar posiciÃ³n
      void dropdown.offsetHeight;

      // Asegurar visibilidad despuÃ©s de actualizar posiciÃ³n usando setProperty con important
      requestAnimationFrame(() => {
        dropdown.style.setProperty('display', 'block', 'important');
        dropdown.style.setProperty('visibility', 'visible', 'important');
        dropdown.style.setProperty('opacity', '1', 'important');
        dropdown.style.setProperty('z-index', '999999', 'important');
        void dropdown.offsetHeight;
        dropdown.style.setProperty('opacity', '1', 'important');
        // Forzar otro reflow para asegurar renderizado
        void dropdown.offsetHeight;
      });
    }, 50);
  }


  window.mostrarDropdownOperadores = mostrarDropdownOperadores;

  // FunciÃ³n para ocultar dropdown de operadores
  function ocultarDropdownOperadores(tipo, immediate = false) {
    const inputId = tipo === 'principal' ? 'operadorprincipal' : 'operadorsecundario';
    const dropdown = document.getElementById(`${inputId}_dropdown`);
    const input = document.getElementById(inputId);

    if (!dropdown) {return;}

    // FunciÃ³n auxiliar para ocultar y restaurar
    const ocultarYRestaurar = () => {
      if (dropdown.classList.contains('show')) {
        // Primero restaurar a su contenedor original y limpiar estilos antes de ocultar
        if (dropdown._originalParent && dropdown.parentElement === document.body) {
          // Limpiar estilos inline de position: fixed antes de mover
          dropdown.style.cssText = '';
          dropdown._originalParent.appendChild(dropdown);
          dropdown._originalParent = null;
        } else {
          // Si no estÃ¡ movido, solo limpiar estilos inline
          dropdown.style.cssText = '';
        }
        // Luego ocultar
        dropdown.classList.remove('show');
      }
    };

    if (!immediate) {
      // Delay para permitir clicks en el dropdown
      setTimeout(() => {
        if (dropdown && dropdown.classList.contains('show')) {
          // Verificar si el dropdown o el input tienen foco
          if (document.activeElement !== input && !dropdown.contains(document.activeElement)) {
            ocultarYRestaurar();
          }
        }
      }, 200);
    } else {
      ocultarYRestaurar();
    }
  }
  window.ocultarDropdownOperadores = ocultarDropdownOperadores;
  window.filtrarOperadores = filtrarOperadores;
  window.manejarTecladoOperadores = manejarTecladoOperadores;

  // FunciÃ³n global para ocultar todos los dropdowns
  function ocultarTodosLosDropdowns() {
    ocultarDropdownEconomicos(true); // Ocultar inmediatamente al hacer scroll
    ocultarDropdownOperadores('principal', true);
    ocultarDropdownOperadores('secundario', true);
  }
  // Exponer inmediatamente
  window.ocultarTodosLosDropdowns = ocultarTodosLosDropdowns;

  // FunciÃ³n para desplegar lista de econÃ³micos (botÃ³n de lista)
  async function desplegarListaEconomicos() {
    const input = document.getElementById('economico');
    const dropdown = document.getElementById('economico_dropdown');

    if (!input || !dropdown) {
      console.warn('âš ï¸ desplegarListaEconomicos: input o dropdown no encontrado');
      return;
    }

    // Verificar y recargar cachÃ© si estÃ¡ vacÃ­o
    if (!window.ERPState.getCache('economicos') || window.ERPState.getCache('economicos').length === 0) {
      console.log('ðŸ”„ CachÃ© de econÃ³micos vacÃ­o, recargando...');
      await cargarEconomicosEnCache();
    }

    if (!window.ERPState.getCache('economicos') || window.ERPState.getCache('economicos').length === 0) {
      console.warn('âš ï¸ No hay econÃ³micos disponibles');
      dropdown.innerHTML = '<div class="searchable-select-no-results">No hay econÃ³micos disponibles</div>';
      setTimeout(() => {
        actualizarPosicionDropdown(input, dropdown);
        dropdown.classList.add('show');
        // Forzar reflow/repaint para asegurar que el navegador renderice el dropdown
        void dropdown.offsetHeight; // Forzar reflow
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

    // Limpiar bÃºsqueda
    input.value = '';

    console.log(`ðŸ“‹ Desplegando lista de ${window.ERPState.getCache('economicos').length} econÃ³micos`);

    // Mostrar todos los econÃ³micos
    const limitados = window.ERPState.getCache('economicos').slice(0, 50);
    dropdown.innerHTML = '';

    limitados.forEach((economico) => {
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
        seleccionarEconomico(economico, numero);
      });
      dropdown.appendChild(item);
    });

    if (window.ERPState.getCache('economicos').length > 50) {
      const masItem = document.createElement('div');
      masItem.className = 'searchable-select-no-results';
      masItem.innerHTML = `<small>Mostrando 50 de ${window.ERPState.getCache('economicos').length} econÃ³micos. Use la bÃºsqueda para filtrar.</small>`;
      dropdown.appendChild(masItem);
    }

    // Calcular posiciÃ³n y mostrar
    setTimeout(() => {
      actualizarPosicionDropdown(input, dropdown);
      dropdown.classList.add('show');
      // Forzar visibilidad con múltiples métodos
      void dropdown.offsetHeight; // Forzar reflow
      requestAnimationFrame(() => {
        dropdown.style.setProperty('display', 'block', 'important');
        dropdown.style.setProperty('visibility', 'visible', 'important');
        dropdown.style.setProperty('opacity', '1', 'important');
        dropdown.style.setProperty('z-index', '999999', 'important');
        void dropdown.offsetHeight; // Forzar otro reflow
      });
      console.log('✅ Dropdown de económicos mostrado, elementos:', limitados.length);
      console.log('✅ Dropdown tiene clase show?', dropdown.classList.contains('show'));
      console.log('✅ Dropdown display:', window.getComputedStyle(dropdown).display);
    }, 10);

    // Ocultar dropdown al hacer clic fuera
    setTimeout(() => {
      const ocultarDropdown = (e) => {
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

  // FunciÃ³n para desplegar lista de operadores (botÃ³n de lista)
  async function desplegarListaOperadores(tipo) {
    const inputId = tipo === 'principal' ? 'operadorprincipal' : 'operadorsecundario';
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(`${inputId}_dropdown`);

    if (!input || !dropdown) {
      console.warn(`âš ï¸ desplegarListaOperadores: input o dropdown no encontrado para ${tipo}`);
      return;
    }

    // Verificar y recargar cachÃ© si estÃ¡ vacÃ­o
    if (!window.ERPState.getCache('operadores') || window.ERPState.getCache('operadores').length === 0) {
      console.log('ðŸ”„ CachÃ© de operadores vacÃ­o, recargando...');
      await cargarOperadoresEnCache();
    }

    if (!window.ERPState.getCache('operadores') || window.ERPState.getCache('operadores').length === 0) {
      console.warn('âš ï¸ No hay operadores disponibles');
      dropdown.innerHTML = '<div class="searchable-select-no-results">No hay operadores disponibles</div>';
      setTimeout(() => {
        actualizarPosicionDropdown(input, dropdown);
        dropdown.classList.add('show');
      }, 10);
      return;
    }

    // Limpiar bÃºsqueda
    input.value = '';

    // Verificar y recargar cachÃ© si estÃ¡ vacÃ­o
    if (!window.ERPState.getCache('operadores') || window.ERPState.getCache('operadores').length === 0) {
      console.log('ðŸ”„ CachÃ© de operadores vacÃ­o en desplegarListaOperadores, recargando...');
      await cargarOperadoresEnCache();
    }

    // Filtrar operadores por tipo
    let operadoresFiltrados = window.ERPState.getCache('operadores') || [];
    console.log(`ðŸ” Desplegando lista - Filtrando operadores para tipo: ${tipo}, Total en cachÃ©: ${operadoresFiltrados.length}`);

    if (tipo === 'principal') {
      operadoresFiltrados = operadoresFiltrados.filter(op => {
        // Solo mostrar operadores que tienen tipoOperador === 'principal'
        // NO incluir operadores sin tipoOperador definido
        const tipoOp = (op.tipoOperador || op.tipo || '').toLowerCase();
        return tipoOp === 'principal';
      });
    } else if (tipo === 'secundario') {
      operadoresFiltrados = operadoresFiltrados.filter(op => {
        const tipoOp = (op.tipoOperador || op.tipo || '').toLowerCase();
        return tipoOp === 'secundario' || tipoOp === 'respaldo';
      });
    }

    console.log(`âœ… Operadores filtrados para ${tipo}: ${operadoresFiltrados.length}`);

    console.log(`ðŸ“‹ Desplegando lista de ${operadoresFiltrados.length} operadores (${tipo})`);

    // Mostrar todos los operadores
    const limitados = operadoresFiltrados.slice(0, 50);
    dropdown.innerHTML = '';

    if (limitados.length === 0) {
      dropdown.innerHTML = '<div class="searchable-select-no-results">No hay operadores disponibles para este tipo</div>';
      setTimeout(() => {
        actualizarPosicionDropdown(input, dropdown);
        // Recalcular posiciÃ³n despuÃ©s de un pequeÃ±o delay adicional si el elemento estÃ¡ en un modal
        const modal = input.closest('.modal');
        if (modal) {
          setTimeout(() => {
            actualizarPosicionDropdown(input, dropdown);
          }, 100);
        }
        dropdown.classList.add('show');
        // Forzar visibilidad con múltiples métodos
        void dropdown.offsetHeight; // Forzar reflow
        requestAnimationFrame(() => {
          dropdown.style.setProperty('display', 'block', 'important');
          dropdown.style.setProperty('visibility', 'visible', 'important');
          dropdown.style.setProperty('opacity', '1', 'important');
          dropdown.style.setProperty('z-index', '999999', 'important');
          void dropdown.offsetHeight; // Forzar otro reflow
        });
      }, 50);
      return;
    }

    limitados.forEach((operador) => {
      const item = document.createElement('div');
      item.className = 'searchable-select-item';

      const nombre = operador.nombre || 'N/A';
      const licencia = operador.licencia || '';

      item.innerHTML = `
          <div class="item-text">${nombre}</div>
          ${licencia ? `<div class="item-subtext">Licencia: ${licencia}</div>` : ''}
        `;

      item.addEventListener('click', () => {
        seleccionarOperador(operador, nombre, tipo);
      });
      dropdown.appendChild(item);
    });

    // Calcular posiciÃ³n y mostrar
    setTimeout(() => {
      actualizarPosicionDropdown(input, dropdown);
      dropdown.classList.add('show');
      // Forzar visibilidad con múltiples métodos
      void dropdown.offsetHeight; // Forzar reflow
      requestAnimationFrame(() => {
        dropdown.style.setProperty('display', 'block', 'important');
        dropdown.style.setProperty('visibility', 'visible', 'important');
        dropdown.style.setProperty('opacity', '1', 'important');
        dropdown.style.setProperty('z-index', '999999', 'important');
        void dropdown.offsetHeight; // Forzar otro reflow
      });
      console.log('✅ Dropdown de operadores mostrado, elementos:', limitados.length);
    }, 10);

    if (operadoresFiltrados.length > 50) {
      const masItem = document.createElement('div');
      masItem.className = 'searchable-select-no-results';
      masItem.innerHTML = `<small>Mostrando 50 de ${operadoresFiltrados.length} operadores. Use la bÃºsqueda para filtrar.</small>`;
      dropdown.appendChild(masItem);
    }

    // Calcular posiciÃ³n y mostrar
    // Usar un delay mayor para asegurar que el modal/contenedor estÃ© completamente renderizado
    // Especialmente importante cuando se abre en la lista validada
    setTimeout(() => {
      actualizarPosicionDropdown(input, dropdown);
      // Recalcular posiciÃ³n despuÃ©s de un pequeÃ±o delay adicional si el elemento estÃ¡ en un modal
      const modal = input.closest('.modal');
      if (modal) {
        setTimeout(() => {
          actualizarPosicionDropdown(input, dropdown);
        }, 100);
      }
      dropdown.classList.add('show');
      console.log(`âœ… Dropdown de operadores (${tipo}) mostrado, elementos:`, limitados.length);
      console.log('âœ… Dropdown tiene clase show?', dropdown.classList.contains('show'));
      console.log('âœ… Dropdown display:', window.getComputedStyle(dropdown).display);
    }, 50);

    // Ocultar dropdown al hacer clic fuera
    setTimeout(() => {
      const ocultarDropdown = (e) => {
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

  // FunciÃ³n para manejar teclado en operadores
  function manejarTecladoOperadores(event, tipo) {
    const inputId = tipo === 'principal' ? 'operadorprincipal' : 'operadorsecundario';
    const dropdown = document.getElementById(`${inputId}_dropdown`);
    const items = dropdown?.querySelectorAll('.searchable-select-item');

    if (!items || items.length === 0) {return;}

    // getHighlightedIndex() ya inicializa el objeto si no existe
    const highlightedIndex = window.ERPState.getHighlightedIndex();
    if (highlightedIndex[inputId] === undefined) {highlightedIndex[inputId] = -1;}

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      highlightedIndex[inputId] = Math.min(highlightedIndex[inputId] + 1, items.length - 1);
      items.forEach((item, index) => {
        item.classList.toggle('highlighted', index === highlightedIndex[inputId]);
      });
      items[highlightedIndex[inputId]]?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      highlightedIndex[inputId] = Math.max(highlightedIndex[inputId] - 1, -1);
      items.forEach((item, index) => {
        item.classList.toggle('highlighted', index === highlightedIndex[inputId]);
      });
      if (highlightedIndex[inputId] >= 0) {
        items[highlightedIndex[inputId]]?.scrollIntoView({ block: 'nearest' });
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (highlightedIndex[inputId] >= 0 && items[highlightedIndex[inputId]]) {
        items[highlightedIndex[inputId]].click();
      }
    } else if (event.key === 'Escape') {
      ocultarDropdownOperadores(tipo);
    }
  }

  // ===== FUNCIONES PARA OPERADORES EN GASTOS (TODOS LOS OPERADORES) =====

  // FunciÃ³n para filtrar operadores en gastos (muestra TODOS los operadores)
  function filtrarOperadoresGastos(busqueda, numeroFila) {
    const inputId = `gasto_operador_${numeroFila}`;
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(`${inputId}_dropdown`);
    const _hiddenInput = document.getElementById(`${inputId}_value`);

    if (!input || !dropdown) {return;}

    const termino = busqueda.toLowerCase().trim();

    // Limpiar dropdown
    dropdown.innerHTML = '';
    // getHighlightedIndex() ya inicializa el objeto si no existe
    const highlightedIndex = window.ERPState.getHighlightedIndex();
    highlightedIndex[inputId] = -1;

    if (termino.length === 0) {
      dropdown.classList.remove('show');
      return;
    }

    // Verificar cachÃ©
    if (!window.ERPState.getCache('operadores') || window.ERPState.getCache('operadores').length === 0) {
      console.log('ðŸ”„ CachÃ© de operadores vacÃ­o en filtrarOperadoresGastos, recargando...');
      if (typeof cargarOperadoresEnCache === 'function') {
        cargarOperadoresEnCache().then(() => {
          filtrarOperadoresGastos(busqueda, numeroFila); // Reintentar despuÃ©s de cargar
        });
        return;
      }
    }

    // Filtrar TODOS los operadores (sin filtrar por tipo)
    const operadoresFiltrados = window.ERPState.getCache('operadores') || [];
    console.log(`ðŸ” Filtrando operadores para gastos (todos), Total en cachÃ©: ${operadoresFiltrados.length}`);

    // Filtrar por bÃºsqueda
    const filtrados = operadoresFiltrados.filter(op => {
      const nombre = (op.nombre || '').toString().toLowerCase();
      const licencia = (op.licencia || '').toString().toLowerCase();
      return nombre.includes(termino) || licencia.includes(termino);
    });

    console.log(`âœ… Operadores filtrados para gastos: ${filtrados.length}`);

    if (filtrados.length === 0) {
      dropdown.innerHTML = '<div class="searchable-select-no-results">No se encontraron resultados</div>';
      setTimeout(() => {
        actualizarPosicionDropdown(input, dropdown);
        const modal = input.closest('.modal');
        if (modal) {
          setTimeout(() => {
            actualizarPosicionDropdown(input, dropdown);
          }, 100);
        }
        dropdown.classList.add('show');
      }, 50);
      return;
    }

    // Limitar a 20 resultados
    const limitados = filtrados.slice(0, 20);

    limitados.forEach((operador, index) => {
      const item = document.createElement('div');
      item.className = 'searchable-select-item';
      item.dataset.index = index;

      const nombre = operador.nombre || 'N/A';
      const licencia = operador.licencia || '';

      item.innerHTML = `
          <div class="item-text">${nombre}</div>
          ${licencia ? `<div class="item-subtext">Licencia: ${licencia}</div>` : ''}
        `;

      item.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevenir que el blur se ejecute antes
        seleccionarOperadorGastos(operador, nombre, numeroFila);
      });
      dropdown.appendChild(item);
    });

    if (filtrados.length > 20) {
      const masItem = document.createElement('div');
      masItem.className = 'searchable-select-no-results';
      masItem.innerHTML = `<small>... y ${filtrados.length - 20} mÃ¡s. ContinÃºe escribiendo para filtrar.</small>`;
      dropdown.appendChild(masItem);
    }

    // Agregar clase 'show' y estilos inmediatamente para mostrar el dropdown rÃ¡pido
    dropdown.classList.add('show');
    dropdown.style.setProperty('display', 'block', 'important');
    dropdown.style.setProperty('visibility', 'visible', 'important');
    dropdown.style.setProperty('opacity', '1', 'important');
    dropdown.style.setProperty('z-index', '999999', 'important');

    // Forzar reflow inmediato
    void dropdown.offsetHeight;

    // Actualizar posiciÃ³n inmediatamente usando requestAnimationFrame (mÃ¡s rÃ¡pido que setTimeout)
    const modal = input.closest('.modal');
    if (modal) {
      // Si estÃ¡ en un modal, usar requestAnimationFrame doble para asegurar renderizado
      requestAnimationFrame(() => {
        actualizarPosicionDropdown(input, dropdown);
        requestAnimationFrame(() => {
          actualizarPosicionDropdown(input, dropdown);
          void dropdown.offsetHeight;
        });
      });
    } else {
      // Si no estÃ¡ en modal, actualizar posiciÃ³n inmediatamente
      requestAnimationFrame(() => {
        actualizarPosicionDropdown(input, dropdown);
        void dropdown.offsetHeight;
      });
    }
  }

  // FunciÃ³n para seleccionar operador en gastos
  function seleccionarOperadorGastos(operador, valor, numeroFila) {
    const inputId = `gasto_operador_${numeroFila}`;
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(`${inputId}_dropdown`);
    const _hiddenInput = document.getElementById(`${inputId}_value`);

    if (!input) {
      console.error(`âŒ Input no encontrado: ${inputId}`);
      return;
    }

    // Si operador es un objeto, usar sus propiedades; si es un string, usar el valor
    const nombre = (operador && typeof operador === 'object') ? (operador.nombre || valor) : (valor || operador);
    const licencia = (operador && typeof operador === 'object') ? (operador.licencia || '') : '';

    let texto = nombre;
    if (licencia) {
      texto += ` - ${licencia}`;
    }

    // Establecer el valor en el input visible
    input.value = texto;
    console.log(`âœ… Operador seleccionado en gastos (fila ${numeroFila}):`, texto);

    // Establecer el valor en el input hidden
    if (hiddenInput) {
      hiddenInput.value = nombre;
      console.log('âœ… Valor hidden establecido:', nombre);
    } else {
      console.warn(`âš ï¸ Input hidden no encontrado: ${inputId}_value`);
    }

    // Disparar eventos para notificar cambios
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Primero restaurar a su contenedor original y limpiar estilos antes de ocultar
    if (dropdown) {
      if (dropdown._originalParent && dropdown.parentElement === document.body) {
        dropdown.style.cssText = '';
        dropdown._originalParent.appendChild(dropdown);
        dropdown._originalParent = null;
      } else {
        dropdown.style.cssText = '';
      }
      dropdown.classList.remove('show');
    }
  }
  // Exponer inmediatamente
  window.seleccionarOperadorGastos = seleccionarOperadorGastos;

  // FunciÃ³n para mostrar dropdown de operadores en gastos
  function mostrarDropdownOperadoresGastos(numeroFila) {
    const inputId = `gasto_operador_${numeroFila}`;
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(`${inputId}_dropdown`);

    if (!input || !dropdown) {return;}

    if (input.value.trim().length > 0) {
      filtrarOperadoresGastos(input.value, numeroFila);
    } else {
      // Verificar y recargar cachÃ© si estÃ¡ vacÃ­o
      if (!window.ERPState.getCache('operadores') || window.ERPState.getCache('operadores').length === 0) {
        console.log('ðŸ”„ CachÃ© de operadores vacÃ­o, recargando...');
        if (typeof cargarOperadoresEnCache === 'function') {
          cargarOperadoresEnCache().then(() => {
            mostrarDropdownOperadoresGastos(numeroFila); // Reintentar despuÃ©s de cargar
          });
          return;
        }
      }

      // Mostrar TODOS los operadores (sin filtrar por tipo)
      const operadoresFiltrados = window.ERPState.getCache('operadores') || [];
      console.log(`ðŸ” Mostrando todos los operadores para gastos, Total en cachÃ©: ${operadoresFiltrados.length}`);

      const limitados = operadoresFiltrados.slice(0, 20);
      dropdown.innerHTML = '';

      limitados.forEach((operador) => {
        const item = document.createElement('div');
        item.className = 'searchable-select-item';

        const nombre = operador.nombre || 'N/A';
        const licencia = operador.licencia || '';

        item.innerHTML = `
            <div class="item-text">${nombre}</div>
            ${licencia ? `<div class="item-subtext">Licencia: ${licencia}</div>` : ''}
          `;

        item.addEventListener('mousedown', (e) => {
          e.preventDefault(); // Prevenir que el blur se ejecute antes
          seleccionarOperadorGastos(operador, nombre, numeroFila);
        });
        dropdown.appendChild(item);
      });

      // Agregar clase 'show' y estilos inmediatamente para mostrar el dropdown rÃ¡pido
      dropdown.classList.add('show');
      dropdown.style.setProperty('display', 'block', 'important');
      dropdown.style.setProperty('visibility', 'visible', 'important');
      dropdown.style.setProperty('opacity', '1', 'important');
      dropdown.style.setProperty('z-index', '999999', 'important');

      // Forzar reflow inmediato
      void dropdown.offsetHeight;

      // Actualizar posiciÃ³n inmediatamente (sin delay si no hay modal)
      const modal = input.closest('.modal');
      if (modal) {
        // Si estÃ¡ en un modal, usar un pequeÃ±o delay para asegurar que el modal estÃ© renderizado
        requestAnimationFrame(() => {
          actualizarPosicionDropdown(input, dropdown);
          requestAnimationFrame(() => {
            actualizarPosicionDropdown(input, dropdown);
            void dropdown.offsetHeight;
          });
        });
      } else {
        // Si no estÃ¡ en modal, actualizar posiciÃ³n inmediatamente
        requestAnimationFrame(() => {
          actualizarPosicionDropdown(input, dropdown);
          void dropdown.offsetHeight;
        });
      }
    }
  }
  // Exponer inmediatamente
  window.mostrarDropdownOperadoresGastos = mostrarDropdownOperadoresGastos;

  // FunciÃ³n para ocultar dropdown de operadores en gastos
  function ocultarDropdownOperadoresGastos(numeroFila, immediate = false) {
    const inputId = `gasto_operador_${numeroFila}`;
    const dropdown = document.getElementById(`${inputId}_dropdown`);
    const input = document.getElementById(inputId);

    if (!dropdown) {return;}

    // FunciÃ³n auxiliar para ocultar y restaurar
    const ocultarYRestaurar = () => {
      if (dropdown.classList.contains('show')) {
        // Primero restaurar a su contenedor original y limpiar estilos antes de ocultar
        if (dropdown._originalParent && dropdown.parentElement === document.body) {
          dropdown.style.cssText = '';
          dropdown._originalParent.appendChild(dropdown);
          dropdown._originalParent = null;
        } else {
          dropdown.style.cssText = '';
        }
        // Luego ocultar
        dropdown.classList.remove('show');
      }
    };

    if (!immediate) {
      // Delay para permitir clicks en el dropdown
      setTimeout(() => {
        if (dropdown && dropdown.classList.contains('show')) {
          // Verificar si el dropdown o el input tienen foco
          if (document.activeElement !== input && !dropdown.contains(document.activeElement)) {
            ocultarYRestaurar();
          }
        }
      }, 200);
    } else {
      ocultarYRestaurar();
    }
  }

  // FunciÃ³n para desplegar lista de operadores en gastos (botÃ³n de lista)
  async function desplegarListaOperadoresGastos(numeroFila) {
    const inputId = `gasto_operador_${numeroFila}`;
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(`${inputId}_dropdown`);

    if (!input || !dropdown) {
      console.warn(`âš ï¸ desplegarListaOperadoresGastos: input o dropdown no encontrado para fila ${numeroFila}`);
      return;
    }

    // Verificar y recargar cachÃ© si estÃ¡ vacÃ­o
    if (!window.ERPState.getCache('operadores') || window.ERPState.getCache('operadores').length === 0) {
      console.log('ðŸ”„ CachÃ© de operadores vacÃ­o, recargando...');
      await cargarOperadoresEnCache();
    }

    if (!window.ERPState.getCache('operadores') || window.ERPState.getCache('operadores').length === 0) {
      console.warn('âš ï¸ No hay operadores disponibles');
      dropdown.innerHTML = '<div class="searchable-select-no-results">No hay operadores disponibles</div>';

      // Agregar clase 'show' y estilos inmediatamente
      dropdown.classList.add('show');
      dropdown.style.setProperty('display', 'block', 'important');
      dropdown.style.setProperty('visibility', 'visible', 'important');
      dropdown.style.setProperty('opacity', '1', 'important');
      dropdown.style.setProperty('z-index', '999999', 'important');
      void dropdown.offsetHeight;

      // Actualizar posiciÃ³n usando requestAnimationFrame (mÃ¡s rÃ¡pido)
      requestAnimationFrame(() => {
        actualizarPosicionDropdown(input, dropdown);
        const modal = input.closest('.modal');
        if (modal) {
          requestAnimationFrame(() => {
            actualizarPosicionDropdown(input, dropdown);
            void dropdown.offsetHeight;
          });
        } else {
          void dropdown.offsetHeight;
        }
      });
      return;
    }

    // Limpiar bÃºsqueda
    input.value = '';

    // Mostrar TODOS los operadores (sin filtrar por tipo)
    const operadoresFiltrados = window.ERPState.getCache('operadores') || [];
    console.log(`ðŸ“‹ Desplegando lista de ${operadoresFiltrados.length} operadores (todos) para gastos`);

    // Mostrar todos los operadores
    const limitados = operadoresFiltrados.slice(0, 50);
    dropdown.innerHTML = '';

    limitados.forEach((operador) => {
      const item = document.createElement('div');
      item.className = 'searchable-select-item';

      const nombre = operador.nombre || 'N/A';
      const licencia = operador.licencia || '';

      item.innerHTML = `
          <div class="item-text">${nombre}</div>
          ${licencia ? `<div class="item-subtext">Licencia: ${licencia}</div>` : ''}
        `;

      item.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevenir que el blur se ejecute antes
        seleccionarOperadorGastos(operador, nombre, numeroFila);
      });
      dropdown.appendChild(item);
    });

    if (operadoresFiltrados.length > 50) {
      const masItem = document.createElement('div');
      masItem.className = 'searchable-select-no-results';
      masItem.innerHTML = `<small>Mostrando 50 de ${operadoresFiltrados.length} operadores. Use la bÃºsqueda para filtrar.</small>`;
      dropdown.appendChild(masItem);
    }

    // Agregar clase 'show' y estilos inmediatamente para mostrar el dropdown rÃ¡pido
    dropdown.classList.add('show');
    dropdown.style.setProperty('display', 'block', 'important');
    dropdown.style.setProperty('visibility', 'visible', 'important');
    dropdown.style.setProperty('opacity', '1', 'important');
    dropdown.style.setProperty('z-index', '999999', 'important');

    // Forzar reflow inmediato
    void dropdown.offsetHeight;

    console.log('âœ… Dropdown de operadores (gastos) mostrado, elementos:', limitados.length);

    // Calcular posiciÃ³n usando requestAnimationFrame (mÃ¡s rÃ¡pido que setTimeout)
    const modal = input.closest('.modal');
    if (modal) {
      // Si estÃ¡ en un modal, usar requestAnimationFrame doble para asegurar renderizado
      requestAnimationFrame(() => {
        actualizarPosicionDropdown(input, dropdown);
        requestAnimationFrame(() => {
          actualizarPosicionDropdown(input, dropdown);
          void dropdown.offsetHeight;
        });
      });
    } else {
      // Si no estÃ¡ en modal, actualizar posiciÃ³n inmediatamente
      requestAnimationFrame(() => {
        actualizarPosicionDropdown(input, dropdown);
        void dropdown.offsetHeight;
      });
    }

    // Ocultar dropdown al hacer clic fuera
    setTimeout(() => {
      const ocultarDropdown = (e) => {
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

  // FunciÃ³n para manejar teclado en operadores de gastos
  function manejarTecladoOperadoresGastos(event, numeroFila) {
    const inputId = `gasto_operador_${numeroFila}`;
    const dropdown = document.getElementById(`${inputId}_dropdown`);
    const items = dropdown?.querySelectorAll('.searchable-select-item');

    if (!items || items.length === 0) {return;}

    // getHighlightedIndex() ya inicializa el objeto si no existe
    const highlightedIndex = window.ERPState.getHighlightedIndex();
    if (highlightedIndex[inputId] === undefined) {highlightedIndex[inputId] = -1;}

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      highlightedIndex[inputId] = Math.min(highlightedIndex[inputId] + 1, items.length - 1);
      items.forEach((item, index) => {
        item.classList.toggle('highlighted', index === highlightedIndex[inputId]);
      });
      items[highlightedIndex[inputId]]?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      highlightedIndex[inputId] = Math.max(highlightedIndex[inputId] - 1, -1);
      items.forEach((item, index) => {
        item.classList.toggle('highlighted', index === highlightedIndex[inputId]);
      });
      if (highlightedIndex[inputId] >= 0) {
        items[highlightedIndex[inputId]]?.scrollIntoView({ block: 'nearest' });
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (highlightedIndex[inputId] >= 0 && items[highlightedIndex[inputId]]) {
        items[highlightedIndex[inputId]].click();
      }
    } else if (event.key === 'Escape') {
      ocultarDropdownOperadoresGastos(numeroFila);
    }
  }
  // Exponer inmediatamente
  window.manejarTecladoOperadoresGastos = manejarTecladoOperadoresGastos;

  // Sobrescribir refreshEconomicosList para que tambiÃ©n actualice el cachÃ©
  const originalRefreshEconomicosList = window.refreshEconomicosList;
  window.refreshEconomicosList = async function () {
    if (originalRefreshEconomicosList) {
      await originalRefreshEconomicosList();
    }
    await cargarEconomicosEnCache();
  };

  // Reemplazar placeholders con las funciones reales ahora que estÃ¡n definidas
  window.mostrarDropdownEconomicos = mostrarDropdownEconomicos;
  window.ocultarDropdownEconomicos = ocultarDropdownEconomicos;
  window.filtrarEconomicos = filtrarEconomicos;
  window.manejarTecladoEconomicos = manejarTecladoEconomicos;
  window.seleccionarEconomico = seleccionarEconomico;
  window.desplegarListaEconomicos = desplegarListaEconomicos;

  // Hacer funciones de operadores principales/secundarios disponibles globalmente
  window.mostrarDropdownOperadores = mostrarDropdownOperadores;
  window.ocultarDropdownOperadores = ocultarDropdownOperadores;
  window.filtrarOperadores = filtrarOperadores;
  window.manejarTecladoOperadores = manejarTecladoOperadores;
  window.seleccionarOperador = seleccionarOperador;
  window.desplegarListaOperadores = desplegarListaOperadores;

  // Hacer funciones de gastos disponibles globalmente
  window.filtrarOperadoresGastos = filtrarOperadoresGastos;
  window.mostrarDropdownOperadoresGastos = mostrarDropdownOperadoresGastos;
  window.ocultarDropdownOperadoresGastos = ocultarDropdownOperadoresGastos;
  window.desplegarListaOperadoresGastos = desplegarListaOperadoresGastos;
  window.manejarTecladoOperadoresGastos = manejarTecladoOperadoresGastos;
  window.seleccionarOperadorGastos = seleccionarOperadorGastos;

  // Hacer funciÃ³n para ocultar todos los dropdowns disponible globalmente
  window.ocultarTodosLosDropdowns = ocultarTodosLosDropdowns;

  // Sobrescribir refreshOperadoresList para que tambiÃ©n actualice el cachÃ©
  const originalRefreshOperadoresList = window.refreshOperadoresList;
  window.refreshOperadoresList = async function () {
    if (originalRefreshOperadoresList) {
      await originalRefreshOperadoresList();
    }
    // PRIORIDAD: Usar traficoListasManager porque preserva correctamente tipoOperador
    if (window.traficoListasManager && typeof window.traficoListasManager.loadOperadoresList === 'function') {
      await window.traficoListasManager.loadOperadoresList();
    } else if (typeof cargarOperadoresEnCache === 'function') {
      await cargarOperadoresEnCache();
    }
  };

  // Cargar datos al iniciar
  document.addEventListener('DOMContentLoaded', async () => {
    await cargarEconomicosEnCache();
    // PRIORIDAD: Usar traficoListasManager porque preserva correctamente tipoOperador
    if (window.traficoListasManager && typeof window.traficoListasManager.loadOperadoresList === 'function') {
      await window.traficoListasManager.loadOperadoresList();
      console.log('âœ… CachÃ© de operadores inicializado desde traficoListasManager (DOMContentLoaded)');
    } else if (typeof cargarOperadoresEnCache === 'function') {
      await cargarOperadoresEnCache();
    }
  });

  // Actualizar funciones existentes para que funcionen con los nuevos inputs
  const originalLoadEconomicoData = window.loadEconomicoData;
  window.loadEconomicoData = function () {
    const input = document.getElementById('economico');
    const hiddenInput = document.getElementById('economico_value');
    const valor = hiddenInput?.value || input?.value || '';

    // Si no hay valor, no hacer nada (evitar advertencias innecesarias)
    if (!valor || valor.trim() === '') {
      return;
    }

    // Buscar el econÃ³mico en el cachÃ©
    const economico = window.ERPState.getCache('economicos')?.find(e => {
      const numero = (e.numero || e.nombre || '').toString();
      return numero === valor ||
               input?.value.includes(numero) ||
               input?.value.includes(e.placaTracto || e.placa || '');
    });

    // Si encontramos el econÃ³mico, llenar campos directamente sin mostrar advertencias
    if (economico) {
      const placasField = document.getElementById('Placas');
      const permisoSCTField = document.getElementById('permisosct');

      if (placasField && economico.placaTracto) {
        placasField.value = economico.placaTracto;
        console.log('âœ… Placas llenadas automÃ¡ticamente:', economico.placaTracto);
      }

      if (permisoSCTField && economico.permisoSCT) {
        permisoSCTField.value = economico.permisoSCT;
        console.log('âœ… Permiso SCT llenado automÃ¡ticamente:', economico.permisoSCT);
      }

      // NO llamar a la funciÃ³n original para evitar advertencias innecesarias
      // ya que ya llenamos los campos directamente
      return;
    }

    // Solo si no encontramos en el cachÃ©, intentar con la funciÃ³n original
    // pero solo si existe y tenemos un valor vÃ¡lido
    if (originalLoadEconomicoData && valor) {
      window._tempEconomicoValue = valor;
      try {
        originalLoadEconomicoData.call(this);
      } catch (e) {
        console.warn('âš ï¸ Error en loadEconomicoData original:', e);
      }
    }
  };

  const originalLoadOperadorPrincipalData = window.loadOperadorPrincipalData;
  window.loadOperadorPrincipalData = async function () {
    const input = document.getElementById('operadorprincipal');
    const hiddenInput = document.getElementById('operadorprincipal_value');
    const valor = hiddenInput?.value || input?.value || '';

    console.log('ðŸ” loadOperadorPrincipalData - valor:', valor);
    console.log('ðŸ” input.value:', input?.value);
    console.log('ðŸ” hiddenInput.value:', hiddenInput?.value);

    // Si no hay valor, no hacer nada
    if (!valor || valor.trim() === '') {
      console.log('âš ï¸ No hay valor para buscar operador principal');
      return;
    }

    // Buscar el operador en el cachÃ©
    let operador = null;
    const operadoresCache = window.ERPState.getCache('operadores') || [];
    console.log('ðŸ” Total operadores en cachÃ©:', operadoresCache.length);

    // Primero intentar con el valor del hidden input (nombre exacto)
    if (hiddenInput?.value) {
      operador = operadoresCache.find(op => {
        const nombre = (op.nombre || '').toString().trim();
        return nombre === hiddenInput.value.trim();
      });
      console.log('ðŸ” Buscando por hiddenInput.value:', hiddenInput.value, operador ? 'âœ… Encontrado' : 'âŒ No encontrado');
    }

    // Si no se encuentra, extraer el nombre del input visible
    if (!operador && input?.value) {
      const nombreOperador = input.value.split(' - ')[0].trim();
      console.log('ðŸ” Buscando por nombre extraÃ­do del input visible:', nombreOperador);
      operador = operadoresCache.find(op => {
        const nombre = (op.nombre || '').toString().trim();
        return nombre === nombreOperador;
      });
      console.log('ðŸ” Resultado:', operador ? 'âœ… Encontrado' : 'âŒ No encontrado');
    }

    // Si aÃºn no se encuentra, buscar por coincidencia parcial
    if (!operador && input?.value) {
      const nombreBusqueda = input.value.split(' - ')[0].trim();
      operador = operadoresCache.find(op => {
        const nombre = (op.nombre || '').toString().trim();
        return nombre.includes(nombreBusqueda) || nombreBusqueda.includes(nombre);
      });
      console.log('ðŸ” Buscando por coincidencia parcial:', nombreBusqueda, operador ? 'âœ… Encontrado' : 'âŒ No encontrado');
    }

    // Llenar campo de licencia directamente si tenemos el operador
    if (operador) {
      console.log('âœ… Operador encontrado:', operador.nombre);
      console.log('ðŸ“‹ Datos del operador:', { nombre: operador.nombre, licencia: operador.licencia });

      // Intentar obtener la licencia de diferentes campos posibles
      const licencia = operador.licencia || operador.numeroLicencia || operador.licenciaOperador || '';
      if (licencia) {
        const licenciaField = document.getElementById('Licencia');
        if (licenciaField) {
          licenciaField.value = licencia;
          console.log('âœ… Licencia del operador principal llenada automÃ¡ticamente:', licencia);
        } else {
          console.warn('âš ï¸ Campo Licencia no encontrado en el DOM');
          // Intentar buscar el campo de otra forma
          const licenciaFieldAlt = document.querySelector('#Licencia');
          if (licenciaFieldAlt) {
            licenciaFieldAlt.value = licencia;
            console.log('âœ… Licencia llenada usando querySelector:', licencia);
          }
        }
      } else {
        console.warn('âš ï¸ Operador encontrado pero no tiene licencia en ningÃºn campo:', operador);
        console.warn('ðŸ“‹ Campos disponibles del operador:', Object.keys(operador));
      }
    } else {
      console.warn('âš ï¸ Operador no encontrado en cachÃ© para:', valor);
    }

    // TambiÃ©n llamar a la funciÃ³n original para mantener compatibilidad
    if (operador && originalLoadOperadorPrincipalData) {
      window._tempOperadorPrincipalValue = operador.nombre;
      if (typeof originalLoadOperadorPrincipalData === 'function') {
        try {
          await originalLoadOperadorPrincipalData.call(this);
        } catch (e) {
          console.error('âŒ Error en loadOperadorPrincipalData original:', e);
        }
      }
    }
  };

  const originalLoadOperadorSecundarioData = window.loadOperadorSecundarioData;
  window.loadOperadorSecundarioData = async function () {
    const input = document.getElementById('operadorsecundario');
    const hiddenInput = document.getElementById('operadorsecundario_value');
    const valor = hiddenInput?.value || input?.value || '';

    console.log('ðŸ” loadOperadorSecundarioData - valor:', valor);
    console.log('ðŸ” input.value:', input?.value);
    console.log('ðŸ” hiddenInput.value:', hiddenInput?.value);

    // Si no hay valor, no hacer nada
    if (!valor || valor.trim() === '') {
      console.log('âš ï¸ No hay valor para buscar operador secundario');
      return;
    }

    // Buscar el operador en el cachÃ©
    let operador = null;
    const operadoresCache = window.ERPState.getCache('operadores') || [];
    console.log('ðŸ” Total operadores en cachÃ©:', operadoresCache.length);

    // Primero intentar con el valor del hidden input (nombre exacto)
    if (hiddenInput?.value) {
      operador = operadoresCache.find(op => {
        const nombre = (op.nombre || '').toString().trim();
        return nombre === hiddenInput.value.trim();
      });
      console.log('ðŸ” Buscando por hiddenInput.value:', hiddenInput.value, operador ? 'âœ… Encontrado' : 'âŒ No encontrado');
    }

    // Si no se encuentra, extraer el nombre del input visible
    if (!operador && input?.value) {
      const nombreOperador = input.value.split(' - ')[0].trim();
      console.log('ðŸ” Buscando por nombre extraÃ­do del input visible:', nombreOperador);
      operador = operadoresCache.find(op => {
        const nombre = (op.nombre || '').toString().trim();
        return nombre === nombreOperador;
      });
      console.log('ðŸ” Resultado:', operador ? 'âœ… Encontrado' : 'âŒ No encontrado');
    }

    // Si aÃºn no se encuentra, buscar por coincidencia parcial
    if (!operador && input?.value) {
      const nombreBusqueda = input.value.split(' - ')[0].trim();
      operador = operadoresCache.find(op => {
        const nombre = (op.nombre || '').toString().trim();
        return nombre.includes(nombreBusqueda) || nombreBusqueda.includes(nombre);
      });
      console.log('ðŸ” Buscando por coincidencia parcial:', nombreBusqueda, operador ? 'âœ… Encontrado' : 'âŒ No encontrado');
    }

    // Llenar campo de licencia secundaria directamente si tenemos el operador
    if (operador) {
      console.log('âœ… Operador secundario encontrado:', operador.nombre);
      console.log('ðŸ“‹ Datos del operador:', { nombre: operador.nombre, licencia: operador.licencia });

      // Intentar obtener la licencia de diferentes campos posibles
      const licencia = operador.licencia || operador.numeroLicencia || operador.licenciaOperador || '';
      if (licencia) {
        const licenciaSecundariaField = document.getElementById('LicenciaSecundaria');
        if (licenciaSecundariaField) {
          licenciaSecundariaField.value = licencia;
          console.log('âœ… Licencia del operador secundario llenada automÃ¡ticamente:', licencia);
        } else {
          console.warn('âš ï¸ Campo LicenciaSecundaria no encontrado en el DOM');
          // Intentar buscar el campo de otra forma
          const licenciaSecundariaFieldAlt = document.querySelector('#LicenciaSecundaria');
          if (licenciaSecundariaFieldAlt) {
            licenciaSecundariaFieldAlt.value = licencia;
            console.log('âœ… Licencia secundaria llenada usando querySelector:', licencia);
          }
        }
      } else {
        console.warn('âš ï¸ Operador secundario encontrado pero no tiene licencia en ningÃºn campo:', operador);
        console.warn('ðŸ“‹ Campos disponibles del operador:', Object.keys(operador));
      }
    } else {
      console.warn('âš ï¸ Operador secundario no encontrado en cachÃ© para:', valor);
    }

    // TambiÃ©n llamar a la funciÃ³n original para mantener compatibilidad
    if (operador && originalLoadOperadorSecundarioData) {
      window._tempOperadorSecundarioValue = operador.nombre;
      if (typeof originalLoadOperadorSecundarioData === 'function') {
        try {
          await originalLoadOperadorSecundarioData.call(this);
        } catch (e) {
          console.error('âŒ Error en loadOperadorSecundarioData original:', e);
        }
      }
    }
  };
})();
