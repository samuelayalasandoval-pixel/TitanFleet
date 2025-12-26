/**
 * Módulo de Searchable Dropdowns para Diesel
 * Maneja los dropdowns searchables para económicos y operadores
 */

(function () {
  'use strict';

  // Inicializar ERPState si no existe
  if (!window.ERPState) {
    window.ERPState = {
      _cache: {},
      _loading: {},
      _highlightedIndex: {},
      getCache(key) {
        return this._cache[key] || [];
      },
      setCache(key, value) {
        this._cache[key] = value;
      },
      isLoading(key) {
        return this._loading[key] || false;
      },
      setLoading(key, value) {
        this._loading[key] = value;
      },
      getHighlightedIndex(key) {
        return this._highlightedIndex[key] !== undefined ? this._highlightedIndex[key] : -1;
      },
      setHighlightedIndex(key, value) {
        this._highlightedIndex[key] = value;
      }
    };
  }

  // Inicializar cachés si no existen
  if (
    !window.ERPState.getCache('economicos') ||
    window.ERPState.getCache('economicos').length === 0
  ) {
    window.ERPState.setCache('economicos', []);
  }
  if (!window._operadoresCache) {
    window._operadoresCache = [];
  }

  /**
   * Cargar tractocamiones en caché
   */
  async function cargarTractocamionesEnCacheDiesel() {
    if (!window.ERPState) {
      window.ERPState = {
        _cache: {},
        _loading: {},
        getCache(key) {
          return this._cache[key] || [];
        },
        setCache(key, value) {
          this._cache[key] = value;
        },
        isLoading(key) {
          return this._loading[key] || false;
        },
        setLoading(key, value) {
          this._loading[key] = value;
        }
      };
    }

    if (window.ERPState.isLoading('tractocamiones')) {
      return window.ERPState.getCache('economicos') || [];
    }
    window.ERPState.setLoading('tractocamiones', true);

    try {
      let tractocamiones = [];

      // PRIORIDAD 1: Cargar desde Firebase
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
      window.ERPState.setCache('economicos', tractocamiones);
      window.ERPState.setCache('economicosAlt', tractocamiones);

      return tractocamiones;
    } catch (error) {
      console.error('❌ Error cargando tractocamiones en caché:', error);
      window.ERPState.setCache('economicos', []);
      return [];
    } finally {
      window.ERPState.setLoading('tractocamiones', false);
    }
  }

  /**
   * Cargar operadores en caché
   */
  async function cargarOperadoresEnCacheDiesel() {
    if (window._cargandoOperadoresEnCache) {
      return window._operadoresCache || [];
    }
    window._cargandoOperadoresEnCache = true;

    try {
      let operadores = [];

      // PRIORIDAD 1: Cargar desde Firebase (fuente de verdad)
      // Esperar a que Firebase esté completamente inicializado
      let attempts = 0;
      while (attempts < 10 && (!window.firebaseDb || !window.fs)) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (window.firebaseDb && window.fs) {
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
              operadores = todosLosOperadores.filter(operador => {
                const operadorTenantId = operador.tenantId;
                return operadorTenantId === tenantId;
              });

              console.log(
                `🔒 Operadores filtrados por tenantId (${tenantId}): ${operadores.length} de ${todosLosOperadores.length} totales`
              );
            }
          } else {
            console.log(
              'ℹ️ Documento operadores no existe en Firebase, intentando otras fuentes...'
            );
          }
        } catch (e) {
          console.warn('⚠️ Error cargando operadores desde Firebase:', e);
        }
      }

      // PRIORIDAD 2: Intentar desde configuracionManager (que también puede cargar desde Firebase)
      if (operadores.length === 0 && window.configuracionManager) {
        try {
          const temp = window.configuracionManager.getOperadores();
          if (Array.isArray(temp) && temp.length > 0) {
            operadores = temp;
            console.log(
              '✅ Operadores cargados desde configuracionManager.getOperadores:',
              operadores.length
            );
          } else if (temp && typeof temp === 'object') {
            operadores = Object.keys(temp).map(nombre => ({
              ...temp[nombre],
              nombre:
                temp[nombre].nombre ||
                temp[nombre].nombreOperador ||
                temp[nombre].nombreCompleto ||
                nombre
            }));
            console.log(
              '✅ Operadores cargados desde configuracionManager.getOperadores (objeto):',
              operadores.length
            );
          }
        } catch (e) {
          console.warn('⚠️ Error cargando operadores desde configuracionManager:', e);
        }
      }

      // PRIORIDAD 3: Fallback a localStorage (solo si Firebase no está disponible)
      if (operadores.length === 0) {
        try {
          const operadoresData = localStorage.getItem('erp_operadores');
          if (operadoresData) {
            const parsed = JSON.parse(operadoresData);
            if (Array.isArray(parsed)) {
              operadores = parsed.filter(
                o => !o.deleted && (o.nombre || o.nombreOperador || o.nombreCompleto)
              );
            } else if (parsed && typeof parsed === 'object') {
              operadores = Object.values(parsed).filter(
                o => !o.deleted && (o.nombre || o.nombreOperador || o.nombreCompleto)
              );
            }
            console.log('✅ Operadores cargados desde localStorage (fallback):', operadores.length);
          }
        } catch (e) {
          console.warn('⚠️ Error cargando operadores desde localStorage:', e);
        }
      }

      // CRÍTICO: Filtrar por tenantId ANTES de filtrar por tipo
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

      const totalAntesFiltro = operadores.length;
      operadores = operadores.filter(operador => {
        const operadorTenantId = operador.tenantId;
        return operadorTenantId === tenantId;
      });

      if (totalAntesFiltro !== operadores.length) {
        console.log(
          `🔒 Operadores filtrados por tenantId (${tenantId}): ${operadores.length} de ${totalAntesFiltro} totales`
        );
      }

      // Filtrar solo operadores reales
      const operadoresFiltrados = operadores
        .filter(op => {
          if (op.tipoGasto || op.monto || op.numeroRegistro || op.tipoIncidencia || op.concepto) {
            return false;
          }
          return (
            op.nombre || op.nombreOperador || op.nombreCompleto || op.licencia || op.numeroLicencia
          );
        })
        .map(op => ({
          ...op,
          nombre:
            op.nombre ||
            op.nombreOperador ||
            op.nombreCompleto ||
            op.Nombre ||
            op.NombreCompleto ||
            'N/A',
          licencia: op.licencia || op.numeroLicencia || op.Licencia || op.NumeroLicencia || ''
        }));

      // Guardar en múltiples cachés (similar a tráfico)
      window._operadoresCache = operadoresFiltrados;
      window.__operadoresCache = operadoresFiltrados;

      // También guardar en ERPState si está disponible
      if (window.ERPState && typeof window.ERPState.setCache === 'function') {
        window.ERPState.setCache('operadores', operadoresFiltrados);
      }

      console.log(`✅ ${operadoresFiltrados.length} operadores cargados en caché`);
      return operadoresFiltrados;
    } catch (error) {
      console.error('❌ Error cargando operadores en caché:', error);
      window._operadoresCache = [];
      return [];
    } finally {
      window._cargandoOperadoresEnCache = false;
    }
  }

  /**
   * Actualizar posición del dropdown (position: fixed)
   */
  function actualizarPosicionDropdownDiesel(input, dropdown) {
    if (!input || !dropdown) {
      console.warn('⚠️ actualizarPosicionDropdownDiesel: input o dropdown no encontrado');
      return;
    }

    const calcularYPosicionar = () => {
      try {
        const rect = input.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          requestAnimationFrame(() => {
            setTimeout(calcularYPosicionar, 50);
          });
          return;
        }

        // Mover el dropdown al body si no está ya ahí
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
        const dropdownHeight = Math.min(
          dropdown.scrollHeight || dropdownMaxHeight,
          dropdownMaxHeight
        );

        // Si no hay espacio suficiente abajo, mostrar arriba
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

        // Asegurar que no se salga del viewport horizontalmente
        if (left + width > viewportWidth) {
          left = Math.max(10, viewportWidth - width - 10);
        }
        if (left < 0) {
          left = 10;
        }

        // Aplicar estilos
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

  // Helper para aplicar estilos temporales al dropdown
  function aplicarEstilosTemporales(dropdown, input) {
    dropdown.style.cssText = `
      position: fixed !important;
      display: block !important;
      visibility: hidden !important;
      top: -9999px !important;
      left: 0 !important;
      width: ${Math.max(input.getBoundingClientRect().width, 200)}px !important;
      max-height: 300px !important;
      z-index: 999999 !important;
      background-color: #fff !important;
      border: 1px solid #ced4da !important;
      border-radius: 0.375rem !important;
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
    `;
  }

  // ========== FUNCIONES PARA ECONÓMICOS ==========
  // Las versiones originales simples de estas funciones (filtrarEconomicosDiesel, mostrarDropdownEconomicosDiesel,
  // ocultarDropdownEconomicosDiesel, seleccionarEconomicoDiesel, manejarTecladoEconomicosDiesel) fueron eliminadas
  // porque fueron reemplazadas por versiones genéricas más abajo (línea ~1743) que aceptan parámetros adicionales
  // con valores por defecto, haciéndolas compatibles con el código existente.

  function desplegarListaEconomicosDiesel() {
    const input = document.getElementById('economico');
    if (input) {
      input.focus();
      mostrarDropdownEconomicosDiesel();
    }
  }

  // manejarTecladoEconomicosDiesel original eliminada (duplicada, existe versión genérica más abajo)

  // ========== FUNCIONES PARA OPERADORES ==========
  // Las versiones originales de filtrarOperadoresDiesel, ocultarDropdownOperadoresDiesel y manejarTecladoOperadoresDiesel
  // fueron eliminadas porque fueron reemplazadas por versiones genéricas más abajo que aceptan parámetros adicionales
  // con valores por defecto, haciéndolas compatibles con el código existente.

  // filtrarOperadoresDiesel original eliminada (duplicada, existe versión genérica más abajo)

  function mostrarDropdownOperadoresDiesel(tipo) {
    console.log(`🚀 [mostrarDropdownOperadoresDiesel] INICIO - tipo: ${tipo}`);

    const inputId = tipo === 'principal' ? 'operadorprincipal' : 'operadorsecundario';
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(`${inputId}_dropdown`);

    console.log(`🔍 mostrarDropdownOperadoresDiesel llamado para tipo: ${tipo}`, {
      inputId: inputId,
      inputExiste: Boolean(input),
      dropdownExiste: Boolean(dropdown),
      cacheDisponible: Boolean(window._operadoresCache),
      cacheLength: window._operadoresCache?.length || 0
    });

    if (!input || !dropdown) {
      console.error(`❌ No se encontró input o dropdown para ${inputId}`, {
        input: input,
        dropdown: dropdown,
        inputId: inputId,
        dropdownId: `${inputId}_dropdown`
      });
      return;
    }

    // No mostrar si acabamos de seleccionar un operador
    if (dropdown._selecting) {
      console.log('⏸️ Omitiendo mostrar dropdown porque se está seleccionando un operador');
      return;
    }

    console.log('✅ Elementos encontrados correctamente');

    // Prevenir blur cuando se muestra el dropdown
    if (dropdown) {
      dropdown._preventBlur = true;
      dropdown._preventBlurTime = Date.now();
      setTimeout(() => {
        if (dropdown) {
          dropdown._preventBlur = false;
          dropdown._preventBlurTime = null;
        }
      }, 500);
    }

    // Prevenir que el dropdown se oculte cuando se hace click en él
    if (!dropdown._clickListenerAdded) {
      dropdown.addEventListener('mousedown', e => {
        e.preventDefault(); // Prevenir que el input pierda el foco
      });
      dropdown._clickListenerAdded = true;
    }

    if (input.value.trim().length > 0) {
      filtrarOperadoresDiesel(input.value, tipo);
    } else {
      if (!window._operadoresCache || window._operadoresCache.length === 0) {
        console.log('⚠️ Caché de operadores vacío, cargando...');
        if (typeof cargarOperadoresEnCacheDiesel === 'function') {
          cargarOperadoresEnCacheDiesel().then(() => {
            mostrarDropdownOperadoresDiesel(tipo);
          });
          return;
        }
        console.error('❌ cargarOperadoresEnCacheDiesel no está disponible');
      }

      // Intentar obtener operadores de todos los cachés disponibles (similar a tráfico)
      let operadoresFiltrados = [];

      // PRIORIDAD 1: ERPState
      if (window.ERPState && typeof window.ERPState.getCache === 'function') {
        operadoresFiltrados = window.ERPState.getCache('operadores') || [];
      }

      // PRIORIDAD 2: Caché legacy
      if ((!operadoresFiltrados || operadoresFiltrados.length === 0) && window._operadoresCache) {
        operadoresFiltrados = Array.isArray(window._operadoresCache) ? window._operadoresCache : [];
      }

      // PRIORIDAD 3: Caché alternativo
      if ((!operadoresFiltrados || operadoresFiltrados.length === 0) && window.__operadoresCache) {
        operadoresFiltrados = Array.isArray(window.__operadoresCache)
          ? window.__operadoresCache
          : [];
      }

      console.log(`📋 Operadores en caché antes de filtrar: ${operadoresFiltrados.length}`);

      // Filtrar solo operadores activos (similar a tráfico)
      const antesFiltro = operadoresFiltrados.length;
      operadoresFiltrados = operadoresFiltrados.filter(op => {
        // Verificar que no esté eliminado
        if (op.deleted === true) {
          return false;
        }

        // Verificar estado: puede ser 'estado' o 'estadoOperador'
        const estado = op.estado || op.estadoOperador;

        // Un operador está activo si:
        // 1. NO está eliminado (deleted !== true) Y
        // 2. (estado === 'activo' O no tiene estado definido)
        if (!estado) {
          return true;
        } // Sin estado definido = activo
        return estado.toLowerCase() === 'activo'; // Solo 'activo' es activo
      });
      console.log(
        `📋 Después de filtrar activos: ${operadoresFiltrados.length} (antes: ${antesFiltro})`
      );

      if (tipo === 'principal') {
        const antesTipo = operadoresFiltrados.length;
        operadoresFiltrados = operadoresFiltrados.filter(op => {
          const tipoOp = (op.tipoOperador || op.tipo || '').toLowerCase();
          // Mostrar operadores principales o los que no tienen tipo definido (pueden ser usados como principales)
          return tipoOp === 'principal' || !tipoOp || tipoOp === '';
        });
        console.log(
          `📋 Después de filtrar por tipo 'principal': ${operadoresFiltrados.length} (antes: ${antesTipo})`
        );
      } else if (tipo === 'secundario') {
        const antesTipo = operadoresFiltrados.length;
        operadoresFiltrados = operadoresFiltrados.filter(op => {
          const tipoOp = (op.tipoOperador || op.tipo || '').toLowerCase();
          // Mostrar operadores secundarios, respaldo, o los que no tienen tipo definido (pueden ser usados como secundarios)
          return tipoOp === 'secundario' || tipoOp === 'respaldo' || !tipoOp || tipoOp === '';
        });
        console.log(
          `📋 Después de filtrar por tipo 'secundario': ${operadoresFiltrados.length} (antes: ${antesTipo})`
        );
      }

      const limitados = operadoresFiltrados.slice(0, 20);
      console.log(`📋 Operadores limitados a mostrar: ${limitados.length}`);
      dropdown.innerHTML = '';

      if (limitados.length === 0) {
        console.warn(
          `⚠️ No hay operadores para mostrar después del filtrado. Tipo: ${tipo}, Total en caché: ${window._operadoresCache?.length || 0}`
        );
        dropdown.innerHTML =
          '<div class="searchable-select-no-results">No hay operadores disponibles</div>';

        // Asegurar que el dropdown esté en el body
        if (dropdown.parentElement !== document.body) {
          const originalParent = dropdown.parentElement;
          document.body.appendChild(dropdown);
          dropdown._originalParent = originalParent;
        }

        // Prevenir blur
        dropdown._preventBlur = true;
        setTimeout(() => {
          if (dropdown) {
            dropdown._preventBlur = false;
          }
        }, 500);

        // Mostrar el dropdown inmediatamente
        dropdown.classList.add('show');
        dropdown.style.setProperty('display', 'block', 'important');
        dropdown.style.setProperty('visibility', 'visible', 'important');
        dropdown.style.setProperty('opacity', '1', 'important');
        dropdown.style.setProperty('z-index', '999999', 'important');

        setTimeout(() => {
          actualizarPosicionDropdownDiesel(input, dropdown);
          const modal = input.closest('.modal');
          if (modal) {
            setTimeout(() => {
              actualizarPosicionDropdownDiesel(input, dropdown);
            }, 100);
          }
        }, 50);
        return;
      }

      limitados.forEach(operador => {
        const item = document.createElement('div');
        item.className = 'searchable-select-item';

        const nombre = operador.nombre || 'N/A';
        const licencia = operador.licencia || '';

        item.innerHTML = `
          <div class="item-text">${nombre}</div>
          ${licencia ? `<div class="item-subtext">Licencia: ${licencia}</div>` : ''}
        `;

        // Usar solo click, como en tráfico
        item.addEventListener('click', e => {
          e.stopPropagation(); // Prevenir que se propague al listener temporal
          console.log(`🖱️ Click en item de operador: ${nombre}`);
          seleccionarOperadorDiesel(operador, nombre, tipo);
        });
        dropdown.appendChild(item);
      });

      // Asegurar que el dropdown esté en el body antes de mostrar
      if (dropdown.parentElement !== document.body) {
        const originalParent = dropdown.parentElement;
        document.body.appendChild(dropdown);
        dropdown._originalParent = originalParent;
      }

      // Agregar clase 'show' ANTES de aplicar estilos para que CSS funcione
      dropdown.classList.add('show');

      // Forzar visibilidad del dropdown inmediatamente (similar a tráfico)
      dropdown.style.setProperty('display', 'block', 'important');
      dropdown.style.setProperty('visibility', 'visible', 'important');
      dropdown.style.setProperty('opacity', '1', 'important');
      dropdown.style.setProperty('z-index', '999999', 'important');

      // Prevenir que el blur lo oculte inmediatamente
      dropdown._preventBlur = true;
      dropdown._preventBlurTime = Date.now();
      setTimeout(() => {
        if (dropdown) {
          dropdown._preventBlur = false;
          dropdown._preventBlurTime = null;
        }
      }, 500);

      // Función para forzar repaint agresivo (similar a tráfico)
      const forzarRepaint = () => {
        void dropdown.offsetHeight; // Reflow
        void dropdown.getBoundingClientRect(); // Layout recalculation
        void dropdown.scrollTop; // Scroll property access
      };

      // Forzar repaint inmediatamente
      forzarRepaint();

      // Actualizar posición y forzar visibilidad
      requestAnimationFrame(() => {
        actualizarPosicionDropdownDiesel(input, dropdown);
        forzarRepaint();

        const modal = input.closest('.modal');
        if (modal) {
          setTimeout(() => {
            actualizarPosicionDropdownDiesel(input, dropdown);
            forzarRepaint();
          }, 100);
        }

        // Forzar repaint en múltiples requestAnimationFrame para asegurar renderizado
        requestAnimationFrame(() => {
          forzarRepaint();
          requestAnimationFrame(() => {
            forzarRepaint();
            console.log(`✅ Dropdown mostrado con ${limitados.length} operadores`);
            console.log('📊 Estado del dropdown:', {
              display: window.getComputedStyle(dropdown).display,
              visibility: window.getComputedStyle(dropdown).visibility,
              opacity: window.getComputedStyle(dropdown).opacity,
              zIndex: window.getComputedStyle(dropdown).zIndex,
              tieneShow: dropdown.classList.contains('show'),
              innerHTML: dropdown.innerHTML.substring(0, 100)
            });
          });
        });
      });

      // Ocultar dropdown al hacer clic fuera (patrón de tráfico)
      setTimeout(() => {
        const ocultarDropdown = e => {
          // Verificar si el click fue en un item del dropdown
          const clickedItem = e.target.closest('.searchable-select-item');
          if (clickedItem && dropdown.contains(clickedItem)) {
            // El click fue en un item, no ocultar (el item manejará la selección)
            return;
          }

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
            dropdown.style.setProperty('display', 'none', 'important');
            document.removeEventListener('click', ocultarDropdown);
          }
        };
        document.addEventListener('click', ocultarDropdown);
      }, 100);
    }
  }

  // ocultarDropdownOperadoresDiesel original eliminada (duplicada, existe versión genérica más abajo)

  // Función auxiliar para ocultar completamente un dropdown
  function _ocultarDropdownCompletamente(dropdown) {
    if (!dropdown) {
      console.warn('⚠️ [ocultarDropdownCompletamente] Dropdown es null o undefined');
      return;
    }

    console.log('🔄 [ocultarDropdownCompletamente] Ocultando dropdown...', {
      tieneShow: dropdown.classList.contains('show'),
      display: window.getComputedStyle(dropdown).display
    });

    // PRIMERO: Remover clase show (esto es crítico para que el CSS no fuerce display: block)
    dropdown.classList.remove('show');

    // SEGUNDO: Forzar display: none con !important para asegurar que se oculte
    dropdown.style.setProperty('display', 'none', 'important');
    dropdown.style.setProperty('visibility', 'hidden', 'important');
    dropdown.style.setProperty('opacity', '0', 'important');

    // TERCERO: Remover todos los demás estilos inline
    dropdown.style.removeProperty('z-index');
    dropdown.style.removeProperty('position');
    dropdown.style.removeProperty('top');
    dropdown.style.removeProperty('left');
    dropdown.style.removeProperty('width');
    dropdown.style.removeProperty('max-height');

    // Restaurar al contenedor original si fue movido
    if (dropdown._originalParent && dropdown.parentElement === document.body) {
      dropdown._originalParent.appendChild(dropdown);
      dropdown._originalParent = null;
    }

    // Desactivar preventBlur
    dropdown._preventBlur = false;
    dropdown._preventBlurTime = null;

    console.log('✅ [ocultarDropdownCompletamente] Dropdown ocultado', {
      tieneShow: dropdown.classList.contains('show'),
      display: window.getComputedStyle(dropdown).display
    });
  }

  function seleccionarOperadorDiesel(operador, valor, tipo, inputId, hiddenId) {
    console.log('🚀 [seleccionarOperadorDiesel] INICIO', {
      operador,
      valor,
      tipo,
      inputId,
      hiddenId
    });

    // Si no se pasan inputId y hiddenId, calcularlos basándose en tipo
    const finalInputId =
      inputId || (tipo === 'principal' ? 'operadorprincipal' : 'operadorsecundario');
    const finalHiddenId = hiddenId || `${finalInputId}_value`;

    const input = document.getElementById(finalInputId);
    const dropdown = document.getElementById(`${finalInputId}_dropdown`);
    const hiddenInput = document.getElementById(finalHiddenId);

    if (!input) {
      console.error(`❌ [seleccionarOperadorDiesel] Input no encontrado: ${finalInputId}`);
      return;
    }

    const nombre = operador.nombre || valor;
    const licencia = operador.licencia || '';

    let texto = nombre;
    if (licencia) {
      texto += ` - ${licencia}`;
    }

    console.log(`✅ Seleccionando operador: ${texto}`);

    // Marcar que estamos seleccionando para prevenir que el focus muestre el dropdown nuevamente
    if (dropdown) {
      dropdown._selecting = true;
    }

    // Establecer valores
    input.value = texto;
    // Guardar el ID del operador (no el nombre) en el hidden input
    // Usar el mismo patrón que en diesel-data-loaders.js: id || nombre || numeroLicencia
    // Prioridad: id > numeroLicencia > licencia > nombre
    const operadorId =
      operador.id || operador.numeroLicencia || operador.licencia || operador.nombre || nombre;
    if (hiddenInput) {
      hiddenInput.value = operadorId;
      console.log(
        `🔑 ID del operador guardado en hidden input: ${operadorId} (tipo: ${typeof operadorId})`
      );
      console.log('📋 Estructura del operador:', {
        id: operador.id,
        nombre: operador.nombre,
        licencia: operador.licencia,
        numeroLicencia: operador.numeroLicencia
      });
    }

    // Disparar evento input para notificar cambios
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Primero restaurar a su contenedor original y limpiar estilos antes de ocultar (como en tráfico)
    if (dropdown) {
      if (dropdown._originalParent && dropdown.parentElement === document.body) {
        dropdown.style.cssText = '';
        dropdown._originalParent.appendChild(dropdown);
        dropdown._originalParent = null;
      } else {
        dropdown.style.cssText = '';
      }
      dropdown.classList.remove('show');
      // Forzar display: none
      dropdown.style.setProperty('display', 'none', 'important');

      // Desactivar flag después de un delay
      setTimeout(() => {
        if (dropdown) {
          dropdown._selecting = false;
        }
      }, 500);
    }

    console.log('✅ [seleccionarOperadorDiesel] FIN');
  }

  function desplegarListaOperadoresDiesel(tipo) {
    console.log(`🔍 desplegarListaOperadoresDiesel llamado para tipo: ${tipo}`);
    const inputId = tipo === 'principal' ? 'operadorprincipal' : 'operadorsecundario';
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(`${inputId}_dropdown`);

    if (!input) {
      console.error(`❌ No se encontró input con ID: ${inputId}`);
      return;
    }

    if (!dropdown) {
      console.error(`❌ No se encontró dropdown con ID: ${inputId}_dropdown`);
      return;
    }

    console.log(`✅ Input y dropdown encontrados: ${inputId}, mostrando dropdown...`);

    // Prevenir que el blur oculte el dropdown inmediatamente
    dropdown._preventBlur = true;
    dropdown._preventBlurTime = Date.now();

    // Mostrar el dropdown directamente sin esperar el focus
    // Esto evita problemas de timing con el blur
    mostrarDropdownOperadoresDiesel(tipo);

    // Después de un delay, enfocar el input (opcional, para mejor UX)
    setTimeout(() => {
      if (input && document.activeElement !== input) {
        input.focus();
      }
      // Mantener _preventBlur activo por más tiempo para evitar que se oculte
      setTimeout(() => {
        if (dropdown) {
          dropdown._preventBlur = false;
        }
      }, 600);
    }, 100);
  }

  // manejarTecladoOperadoresDiesel original eliminada (duplicada, existe versión genérica más abajo)

  // Exponer funciones globalmente
  window.filtrarEconomicosDiesel = filtrarEconomicosDiesel;
  window.mostrarDropdownEconomicosDiesel = mostrarDropdownEconomicosDiesel;
  window.ocultarDropdownEconomicosDiesel = ocultarDropdownEconomicosDiesel;
  window.desplegarListaEconomicosDiesel = desplegarListaEconomicosDiesel;
  window.manejarTecladoEconomicosDiesel = manejarTecladoEconomicosDiesel;
  window.seleccionarEconomicoDiesel = seleccionarEconomicoDiesel;
  window.filtrarOperadoresDiesel = filtrarOperadoresDiesel;
  window.mostrarDropdownOperadoresDiesel = mostrarDropdownOperadoresDiesel;
  window.ocultarDropdownOperadoresDiesel = ocultarDropdownOperadoresDiesel;
  window.desplegarListaOperadoresDiesel = desplegarListaOperadoresDiesel;
  window.manejarTecladoOperadoresDiesel = manejarTecladoOperadoresDiesel;
  window.seleccionarOperadorDiesel = seleccionarOperadorDiesel;
  window.cargarTractocamionesEnCacheDiesel = cargarTractocamionesEnCacheDiesel;
  window.cargarOperadoresEnCacheDiesel = cargarOperadoresEnCacheDiesel;

  // ========== FUNCIONES PARA EDICIÓN (MODAL) ==========
  // Funciones wrapper simples que adaptan los IDs para el modal

  window.filtrarEconomicosDieselEditar = function (busqueda) {
    // Usar la función genérica con IDs del modal
    if (typeof filtrarEconomicosDiesel === 'function') {
      // Intentar llamar a la versión genérica si existe
      try {
        filtrarEconomicosDiesel(
          busqueda,
          'editarDiesel_economico',
          'editarDiesel_economico_dropdown',
          'editarDiesel_economico_value',
          'editarDiesel_placas'
        );
        return;
      } catch (e) {
        // Si falla, usar la función original y adaptar manualmente
      }
    }
    // Fallback: copiar lógica básica
    filtrarEconomicosDiesel(busqueda);
  };

  window.mostrarDropdownEconomicosDieselEditar = function () {
    const input = document.getElementById('editarDiesel_economico');
    if (input) {
      if (input.value.trim().length > 0) {
        filtrarEconomicosDieselEditar(input.value);
      } else {
        mostrarDropdownEconomicosDiesel();
      }
    }
  };

  window.ocultarDropdownEconomicosDieselEditar = function () {
    ocultarDropdownEconomicosDiesel();
  };

  window.desplegarListaEconomicosDieselEditar = function () {
    const input = document.getElementById('editarDiesel_economico');
    if (input) {
      input.focus();
      mostrarDropdownEconomicosDieselEditar();
    }
  };

  window.manejarTecladoEconomicosDieselEditar = function (event) {
    manejarTecladoEconomicosDiesel(event);
  };

  // Para operadores, las funciones originales ya aceptan el tipo como parámetro
  // pero necesitamos adaptar los IDs. Por ahora, usaremos las funciones originales
  // y modificaremos los event listeners en el HTML o crearemos funciones específicas
  window.filtrarOperadoresDieselEditar = function (busqueda, tipo) {
    filtrarOperadoresDiesel(busqueda, tipo);
  };

  window.mostrarDropdownOperadoresDieselEditar = function (tipo) {
    mostrarDropdownOperadoresDiesel(tipo);
  };

  window.ocultarDropdownOperadoresDieselEditar = function (tipo) {
    ocultarDropdownOperadoresDiesel(tipo);
  };

  window.desplegarListaOperadoresDieselEditar = function (tipo) {
    desplegarListaOperadoresDiesel(tipo);
  };

  window.manejarTecladoOperadoresDieselEditar = function (event, tipo) {
    manejarTecladoOperadoresDiesel(event, tipo);
  };

  // Necesito crear versiones genéricas de las funciones que acepten IDs personalizados
  function filtrarEconomicosDiesel(
    busqueda,
    inputId = 'economico',
    dropdownId = 'economico_dropdown',
    hiddenId = 'economico_value',
    placasId = 'Placas'
  ) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);

    if (!input || !dropdown) {
      return;
    }

    // Prevenir que el dropdown se oculte cuando se hace click en él
    if (!dropdown._clickListenerAdded) {
      dropdown.addEventListener('mousedown', e => {
        e.preventDefault();
      });
      dropdown._clickListenerAdded = true;
    }

    const termino = busqueda.toLowerCase().trim();
    dropdown.innerHTML = '';
    if (window.ERPState && typeof window.ERPState.setHighlightedIndex === 'function') {
      window.ERPState.setHighlightedIndex(inputId, -1);
    }

    if (termino.length === 0) {
      dropdown.classList.remove('show');
      return;
    }

    if (
      !window.ERPState.getCache('economicos') ||
      window.ERPState.getCache('economicos').length === 0
    ) {
      if (typeof cargarTractocamionesEnCacheDiesel === 'function') {
        cargarTractocamionesEnCacheDiesel().then(() => {
          filtrarEconomicosDiesel(busqueda, inputId, dropdownId, hiddenId, placasId);
        });
        return;
      }
    }

    const filtrados = window.ERPState.getCache('economicos').filter(e => {
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
      if (dropdown.parentElement !== document.body) {
        const originalParent = dropdown.parentElement;
        document.body.appendChild(dropdown);
        dropdown._originalParent = originalParent;
      }
      aplicarEstilosTemporales(dropdown, input);
      setTimeout(() => {
        actualizarPosicionDropdownDiesel(input, dropdown);
        dropdown.classList.add('show');
      }, 50);
      return;
    }

    const limitados = filtrados.slice(0, 20);
    limitados.forEach((economico, index) => {
      const item = document.createElement('div');
      item.className = 'searchable-select-item';
      item.dataset.index = index;

      const numero = economico.numero || economico.nombre || 'N/A';
      const _placa = economico.placaTracto || economico.placa || '';
      const marca = economico.marca || '';
      const modelo = economico.modelo || '';

      let texto = numero;
      if (marca || modelo) {
        texto += ` - ${marca} ${modelo}`.trim();
      }

      item.innerHTML = `<div class="item-text">${texto}</div>`;
      item.addEventListener('mousedown', e => {
        e.preventDefault();
        e.stopPropagation();
        setTimeout(() => {
          seleccionarEconomicoDiesel(economico, numero, inputId, hiddenId, placasId);
        }, 0);
      });
      item.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        setTimeout(() => {
          seleccionarEconomicoDiesel(economico, numero, inputId, hiddenId, placasId);
        }, 0);
      });
      dropdown.appendChild(item);
    });

    if (filtrados.length > 20) {
      const masItem = document.createElement('div');
      masItem.className = 'searchable-select-no-results';
      masItem.innerHTML = `<small>... y ${filtrados.length - 20} más. Continúe escribiendo para filtrar.</small>`;
      dropdown.appendChild(masItem);
    }

    if (dropdown.parentElement !== document.body) {
      const originalParent = dropdown.parentElement;
      document.body.appendChild(dropdown);
      dropdown._originalParent = originalParent;
    }

    requestAnimationFrame(() => {
      aplicarEstilosTemporales(dropdown, input);
      requestAnimationFrame(() => {
        setTimeout(() => {
          actualizarPosicionDropdownDiesel(input, dropdown);
          dropdown.classList.add('show');
        }, 10);
      });
    });
  }

  function mostrarDropdownEconomicosDiesel(
    inputId = 'economico',
    dropdownId = 'economico_dropdown',
    hiddenId = 'economico_value',
    placasId = 'Placas'
  ) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);

    if (!input || !dropdown) {
      return;
    }

    // Prevenir que el dropdown se oculte cuando se hace click en él
    if (!dropdown._clickListenerAdded) {
      dropdown.addEventListener('mousedown', e => {
        e.preventDefault();
      });
      dropdown._clickListenerAdded = true;
    }

    if (input.value.trim().length > 0) {
      filtrarEconomicosDiesel(input.value, inputId, dropdownId, hiddenId, placasId);
    } else {
      if (
        !window.ERPState.getCache('economicos') ||
        window.ERPState.getCache('economicos').length === 0
      ) {
        if (typeof cargarTractocamionesEnCacheDiesel === 'function') {
          cargarTractocamionesEnCacheDiesel().then(() => {
            mostrarDropdownEconomicosDiesel(inputId, dropdownId, hiddenId, placasId);
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
        const _placa = economico.placaTracto || economico.placa || '';
        const marca = economico.marca || '';
        const modelo = economico.modelo || '';

        let texto = numero;
        if (marca || modelo) {
          texto += ` - ${marca} ${modelo}`.trim();
        }

        item.innerHTML = `<div class="item-text">${texto}</div>`;
        item.addEventListener('mousedown', e => {
          e.preventDefault();
          e.stopPropagation();
          setTimeout(() => {
            seleccionarEconomicoDiesel(economico, numero, inputId, hiddenId, placasId);
          }, 0);
        });
        item.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          setTimeout(() => {
            seleccionarEconomicoDiesel(economico, numero, inputId, hiddenId, placasId);
          }, 0);
        });
        dropdown.appendChild(item);
      });

      if (dropdown.parentElement !== document.body) {
        const originalParent = dropdown.parentElement;
        document.body.appendChild(dropdown);
        dropdown._originalParent = originalParent;
      }

      aplicarEstilosTemporales(dropdown, input);
      setTimeout(() => {
        actualizarPosicionDropdownDiesel(input, dropdown);
        dropdown.classList.add('show');
      }, 50);
    }
  }

  function seleccionarEconomicoDiesel(
    economico,
    valor,
    inputId = 'economico',
    hiddenId = 'economico_value',
    placasId = 'Placas'
  ) {
    const input = document.getElementById(inputId);
    const dropdownId = inputId.includes('_dropdown')
      ? inputId
      : `${inputId}_dropdown`
        .replace('economico', 'economico_dropdown')
        .replace('editarDiesel_economico', 'editarDiesel_economico_dropdown');
    const dropdown = document.getElementById(dropdownId);
    const hiddenInput = document.getElementById(hiddenId);

    if (!input) {
      console.warn('⚠️ [seleccionarEconomicoDiesel versátil] No se encontró el input:', inputId);
      return;
    }

    const numero = economico.numero || economico.nombre || valor;
    const placa = economico.placaTracto || economico.placa || '';
    const marca = economico.marca || '';
    const modelo = economico.modelo || '';

    let texto = numero;
    if (marca || modelo) {
      texto += ` - ${marca} ${modelo}`.trim();
    }

    console.log('🔄 [seleccionarEconomicoDiesel versátil] Seleccionando económico:', {
      inputId,
      numero,
      texto
    });

    // Establecer el valor inmediatamente y también después de un pequeño delay
    input.value = texto;
    if (hiddenInput) {
      hiddenInput.value = numero;
      console.log('✅ [seleccionarEconomicoDiesel versátil] Hidden input establecido:', numero);
    }

    // Usar setTimeout para asegurar que el valor se establezca incluso si hay un blur pendiente
    setTimeout(() => {
      input.value = texto;
      if (hiddenInput) {
        hiddenInput.value = numero;
      }
      console.log('✅ [seleccionarEconomicoDiesel versátil] Valor confirmado después del delay');
      // Disparar evento input para notificar a otros listeners
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, 10);

    // Llenar placas automáticamente
    const placasField = document.getElementById(placasId);
    if (placasField && placa) {
      placasField.value = placa;
      console.log(
        '✅ [seleccionarEconomicoDiesel versátil] Placas llenadas automáticamente:',
        placa
      );
    } else if (placasField) {
      placasField.value = '';
    }

    if (dropdown) {
      // Ocultar inmediatamente para prevenir conflictos
      if (typeof ocultarDropdownEconomicosDiesel === 'function') {
        ocultarDropdownEconomicosDiesel(true);
      }

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

  function ocultarDropdownEconomicosDiesel(
    inputId = 'economico',
    dropdownId = 'economico_dropdown'
  ) {
    const dropdown = document.getElementById(dropdownId);
    const input = document.getElementById(inputId);

    if (!dropdown) {
      return;
    }

    const ocultarYRestaurar = () => {
      if (dropdown.classList.contains('show')) {
        if (dropdown.matches(':hover') || dropdown.querySelector(':hover')) {
          return;
        }

        if (dropdown._originalParent && dropdown.parentElement === document.body) {
          dropdown.style.cssText = '';
          dropdown._originalParent.appendChild(dropdown);
          dropdown._originalParent = null;
        } else {
          dropdown.style.cssText = '';
        }
        dropdown.classList.remove('show');
      }
    };

    setTimeout(() => {
      if (dropdown && dropdown.classList.contains('show')) {
        if (dropdown.matches(':hover') || dropdown.querySelector(':hover')) {
          return;
        }

        if (document.activeElement !== input && !dropdown.contains(document.activeElement)) {
          ocultarYRestaurar();
        }
      }
    }, 300);
  }

  function manejarTecladoEconomicosDiesel(
    event,
    inputId = 'economico',
    dropdownId = 'economico_dropdown'
  ) {
    const dropdown = document.getElementById(dropdownId);
    const items = dropdown?.querySelectorAll('.searchable-select-item');

    if (!items || items.length === 0) {
      return;
    }

    if (!window.ERPState || typeof window.ERPState.getHighlightedIndex !== 'function') {
      return;
    }

    let currentIndex = window.ERPState.getHighlightedIndex(inputId);
    if (currentIndex === undefined) {
      currentIndex = -1;
      window.ERPState.setHighlightedIndex(inputId, -1);
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const newIndex = Math.min(currentIndex + 1, items.length - 1);
      window.ERPState.setHighlightedIndex(inputId, newIndex);
      items.forEach((item, index) => {
        item.classList.toggle('highlighted', index === newIndex);
      });
      items[newIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const newIndex = Math.max(currentIndex - 1, -1);
      window.ERPState.setHighlightedIndex(inputId, newIndex);
      items.forEach((item, index) => {
        item.classList.toggle('highlighted', index === newIndex);
      });
      if (newIndex >= 0) {
        items[newIndex]?.scrollIntoView({ block: 'nearest' });
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (currentIndex >= 0 && items[currentIndex]) {
        items[currentIndex].click();
      }
    } else if (event.key === 'Escape') {
      ocultarDropdownEconomicosDiesel(inputId, dropdownId);
    }
  }

  // Funciones para operadores (versiones genéricas)
  function filtrarOperadoresDiesel(busqueda, tipo, inputId, dropdownId, hiddenId) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);

    if (!input || !dropdown) {
      return;
    }

    if (!dropdown._clickListenerAdded) {
      dropdown.addEventListener('mousedown', e => {
        e.preventDefault();
      });
      dropdown._clickListenerAdded = true;
    }

    const termino = busqueda.toLowerCase().trim();
    dropdown.innerHTML = '';
    if (window.ERPState && typeof window.ERPState.setHighlightedIndex === 'function') {
      window.ERPState.setHighlightedIndex(inputId, -1);
    }

    if (termino.length === 0) {
      dropdown.classList.remove('show');
      return;
    }

    if (!window._operadoresCache || window._operadoresCache.length === 0) {
      if (typeof cargarOperadoresEnCacheDiesel === 'function') {
        cargarOperadoresEnCacheDiesel().then(() => {
          filtrarOperadoresDiesel(busqueda, tipo, inputId, dropdownId, hiddenId);
        });
        return;
      }
    }

    let operadoresFiltrados = window._operadoresCache || [];

    if (tipo === 'principal') {
      operadoresFiltrados = operadoresFiltrados.filter(op => {
        const tipoOp = (op.tipoOperador || op.tipo || '').toLowerCase();
        return tipoOp === 'principal' || !op.tipoOperador;
      });
    } else if (tipo === 'secundario') {
      operadoresFiltrados = operadoresFiltrados.filter(op => {
        const tipoOp = (op.tipoOperador || op.tipo || '').toLowerCase();
        return tipoOp === 'secundario' || tipoOp === 'respaldo';
      });
    }

    const filtrados = operadoresFiltrados.filter(op => {
      const nombre = (op.nombre || '').toString().toLowerCase();
      const licencia = (op.licencia || '').toString().toLowerCase();
      return nombre.includes(termino) || licencia.includes(termino);
    });

    if (filtrados.length === 0) {
      dropdown.innerHTML =
        '<div class="searchable-select-no-results">No se encontraron resultados</div>';
      if (dropdown.parentElement !== document.body) {
        const originalParent = dropdown.parentElement;
        document.body.appendChild(dropdown);
        dropdown._originalParent = originalParent;
      }
      aplicarEstilosTemporales(dropdown, input);
      setTimeout(() => {
        actualizarPosicionDropdownDiesel(input, dropdown);
        dropdown.classList.add('show');
      }, 50);
      return;
    }

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

      item.addEventListener('mousedown', e => {
        e.preventDefault();
        seleccionarOperadorDiesel(operador, nombre, tipo, inputId, hiddenId);
      });
      item.addEventListener('click', e => {
        e.preventDefault();
        seleccionarOperadorDiesel(operador, nombre, tipo, inputId, hiddenId);
      });
      dropdown.appendChild(item);
    });

    if (filtrados.length > 20) {
      const masItem = document.createElement('div');
      masItem.className = 'searchable-select-no-results';
      masItem.innerHTML = `<small>... y ${filtrados.length - 20} más. Continúe escribiendo para filtrar.</small>`;
      dropdown.appendChild(masItem);
    }

    if (dropdown.parentElement !== document.body) {
      const originalParent = dropdown.parentElement;
      document.body.appendChild(dropdown);
      dropdown._originalParent = originalParent;
    }

    requestAnimationFrame(() => {
      aplicarEstilosTemporales(dropdown, input);
      requestAnimationFrame(() => {
        setTimeout(() => {
          actualizarPosicionDropdownDiesel(input, dropdown);
          dropdown.classList.add('show');
        }, 10);
      });
    });
  }

  // Versión genérica para edición (acepta IDs personalizados)
  // Esta función NO debe sobrescribir mostrarDropdownOperadoresDiesel
  function _mostrarDropdownOperadoresDieselConIDs(tipo, inputId, dropdownId, hiddenId) {
    if (!inputId || !dropdownId) {
      // Si no se proporcionan IDs, usar los defaults y llamar a la función original
      return mostrarDropdownOperadoresDiesel(tipo);
    }

    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);

    if (!input || !dropdown) {
      console.warn(
        `⚠️ [mostrarDropdownOperadoresDieselConIDs] No se encontró input o dropdown: ${inputId}`
      );
      return;
    }

    if (!dropdown._clickListenerAdded) {
      dropdown.addEventListener('mousedown', e => {
        e.preventDefault();
      });
      dropdown._clickListenerAdded = true;
    }

    if (input.value.trim().length > 0) {
      filtrarOperadoresDiesel(input.value, tipo, inputId, dropdownId, hiddenId);
    } else {
      if (!window._operadoresCache || window._operadoresCache.length === 0) {
        if (typeof cargarOperadoresEnCacheDiesel === 'function') {
          cargarOperadoresEnCacheDiesel().then(() => {
            // Llamar a la función usando el nombre completo para evitar problemas de scope
            if (typeof _mostrarDropdownOperadoresDieselConIDs === 'function') {
            _mostrarDropdownOperadoresDieselConIDs(tipo, inputId, dropdownId, hiddenId);
            } else {
              // Fallback a la función original si la versión con IDs no está disponible
              mostrarDropdownOperadoresDiesel(tipo);
            }
          });
          return;
        }
      }

      let operadoresFiltrados = window._operadoresCache || [];

      if (tipo === 'principal') {
        operadoresFiltrados = operadoresFiltrados.filter(op => {
          const tipoOp = (op.tipoOperador || op.tipo || '').toLowerCase();
          return tipoOp === 'principal' || !op.tipoOperador;
        });
      } else if (tipo === 'secundario') {
        operadoresFiltrados = operadoresFiltrados.filter(op => {
          const tipoOp = (op.tipoOperador || op.tipo || '').toLowerCase();
          return tipoOp === 'secundario' || tipoOp === 'respaldo';
        });
      }

      const limitados = operadoresFiltrados.slice(0, 20);
      dropdown.innerHTML = '';

      limitados.forEach(operador => {
        const item = document.createElement('div');
        item.className = 'searchable-select-item';

        const nombre = operador.nombre || 'N/A';
        const licencia = operador.licencia || '';

        item.innerHTML = `
          <div class="item-text">${nombre}</div>
          ${licencia ? `<div class="item-subtext">Licencia: ${licencia}</div>` : ''}
        `;

        item.addEventListener('mousedown', e => {
          e.preventDefault();
          seleccionarOperadorDiesel(operador, nombre, tipo, inputId, hiddenId);
        });
        item.addEventListener('click', e => {
          e.preventDefault();
          seleccionarOperadorDiesel(operador, nombre, tipo, inputId, hiddenId);
        });
        dropdown.appendChild(item);
      });

      if (dropdown.parentElement !== document.body) {
        const originalParent = dropdown.parentElement;
        document.body.appendChild(dropdown);
        dropdown._originalParent = originalParent;
      }

      // Prevenir blur
      dropdown._preventBlur = true;
      dropdown._preventBlurTime = Date.now();
      setTimeout(() => {
        if (dropdown) {
          dropdown._preventBlur = false;
          dropdown._preventBlurTime = null;
        }
      }, 500);

      dropdown.classList.add('show');
      dropdown.style.setProperty('display', 'block', 'important');
      dropdown.style.setProperty('visibility', 'visible', 'important');
      dropdown.style.setProperty('opacity', '1', 'important');

      aplicarEstilosTemporales(dropdown, input);
      setTimeout(() => {
        actualizarPosicionDropdownDiesel(input, dropdown);
        const modal = input.closest('.modal');
        if (modal) {
          setTimeout(() => {
            actualizarPosicionDropdownDiesel(input, dropdown);
          }, 100);
        }
      }, 50);
    }
  }

  function ocultarDropdownOperadoresDiesel(tipo, inputId, dropdownId) {
    // Si no se proporcionan inputId y dropdownId, calcularlos basándose en tipo (compatibilidad con versiones anteriores)
    if (!inputId || !dropdownId) {
      inputId = tipo === 'principal' ? 'operadorprincipal' : 'operadorsecundario';
      dropdownId = `${inputId}_dropdown`;
    }
    const dropdown = document.getElementById(dropdownId);
    const input = document.getElementById(inputId);

    if (!dropdown) {
      return;
    }

    const ocultarYRestaurar = () => {
      if (dropdown.classList.contains('show')) {
        if (dropdown.matches(':hover') || dropdown.querySelector(':hover')) {
          return;
        }

        if (dropdown._originalParent && dropdown.parentElement === document.body) {
          dropdown.style.cssText = '';
          dropdown._originalParent.appendChild(dropdown);
          dropdown._originalParent = null;
        } else {
          dropdown.style.cssText = '';
        }
        dropdown.classList.remove('show');
      }
    };

    setTimeout(() => {
      if (dropdown && dropdown.classList.contains('show')) {
        if (dropdown.matches(':hover') || dropdown.querySelector(':hover')) {
          return;
        }

        if (document.activeElement !== input && !dropdown.contains(document.activeElement)) {
          ocultarYRestaurar();
        }
      }
    }, 300);
  }

  function manejarTecladoOperadoresDiesel(event, tipo, inputId, dropdownId) {
    // Si no se proporcionan inputId y dropdownId, calcularlos basándose en tipo (compatibilidad con versiones anteriores)
    if (!inputId || !dropdownId) {
      inputId = tipo === 'principal' ? 'operadorprincipal' : 'operadorsecundario';
      dropdownId = `${inputId}_dropdown`;
    }
    const dropdown = document.getElementById(dropdownId);
    const items = dropdown?.querySelectorAll('.searchable-select-item');

    if (!items || items.length === 0) {
      return;
    }

    if (!window.ERPState || typeof window.ERPState.getHighlightedIndex !== 'function') {
      return;
    }

    let currentIndex = window.ERPState.getHighlightedIndex(inputId);
    if (currentIndex === undefined) {
      currentIndex = -1;
      window.ERPState.setHighlightedIndex(inputId, -1);
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const newIndex = Math.min(currentIndex + 1, items.length - 1);
      window.ERPState.setHighlightedIndex(inputId, newIndex);
      items.forEach((item, index) => {
        item.classList.toggle('highlighted', index === newIndex);
      });
      items[newIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const newIndex = Math.max(currentIndex - 1, -1);
      window.ERPState.setHighlightedIndex(inputId, newIndex);
      items.forEach((item, index) => {
        item.classList.toggle('highlighted', index === newIndex);
      });
      if (newIndex >= 0) {
        items[newIndex]?.scrollIntoView({ block: 'nearest' });
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (currentIndex >= 0 && items[currentIndex]) {
        items[currentIndex].click();
      }
    } else if (event.key === 'Escape') {
      ocultarDropdownOperadoresDiesel(tipo, inputId, dropdownId);
    }
  }

  console.log('✅ Módulo diesel-searchable-dropdowns.js cargado');

  // Inicializar automáticamente al cargar la página
  // Cargar operadores y tractocamiones en caché cuando el DOM esté listo
  function inicializarCacheDiesel() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', inicializarCacheDiesel);
      return;
    }

    // Esperar un poco para que Firebase y otros módulos se inicialicen
    setTimeout(async () => {
      try {
        console.log('🔄 Inicializando caché de diesel (operadores y tractocamiones)...');
        await Promise.all([cargarOperadoresEnCacheDiesel(), cargarTractocamionesEnCacheDiesel()]);
        console.log('✅ Caché de diesel inicializado correctamente');
      } catch (error) {
        console.error('❌ Error inicializando caché de diesel:', error);
      }
    }, 1000);
  }

  // Inicializar inmediatamente si el DOM ya está listo, o esperar
  inicializarCacheDiesel();
})();
