/**
 * Funciones específicas para el modal de edición de diesel
 * Adapta las funciones de búsqueda para trabajar con los IDs del modal
 */

(function () {
  'use strict';

  // Reutilizar las funciones existentes pero adaptando los IDs
  // Para económicos en el modal
  window.filtrarEconomicosDieselEditar = function (busqueda) {
    const input = document.getElementById('editarDiesel_economico');
    const dropdown = document.getElementById('editarDiesel_economico_dropdown');

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

    if (termino.length === 0) {
      dropdown.classList.remove('show');
      return;
    }

    if (
      !window.ERPState.getCache('economicos') ||
      window.ERPState.getCache('economicos').length === 0
    ) {
      if (typeof window.cargarTractocamionesEnCacheDiesel === 'function') {
        window.cargarTractocamionesEnCacheDiesel().then(() => {
          filtrarEconomicosDieselEditar(busqueda);
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
      dropdown.classList.add('show');
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
      item.addEventListener('mousedown', e => {
        e.preventDefault();
        seleccionarEconomicoDieselEditar(economico, numero);
      });
      item.addEventListener('click', e => {
        e.preventDefault();
        seleccionarEconomicoDieselEditar(economico, numero);
      });
      dropdown.appendChild(item);
    });

    if (dropdown.parentElement !== document.body) {
      const originalParent = dropdown.parentElement;
      document.body.appendChild(dropdown);
      dropdown._originalParent = originalParent;
    }

    dropdown.classList.add('show');
  };

  function seleccionarEconomicoDieselEditar(economico, valor) {
    const input = document.getElementById('editarDiesel_economico');
    const dropdown = document.getElementById('editarDiesel_economico_dropdown');
    const hiddenInput = document.getElementById('editarDiesel_economico_value');
    const placasField = document.getElementById('editarDiesel_placas');

    if (!input) {
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
    if (placa) {
      texto += ` (${placa})`;
    }

    input.value = texto;
    if (hiddenInput) {
      hiddenInput.value = numero;
    }

    if (placasField && placa) {
      placasField.value = placa;
    }

    if (dropdown) {
      dropdown.classList.remove('show');
      dropdown.style.cssText = '';
    }
  }

  window.mostrarDropdownEconomicosDieselEditar = function () {
    const input = document.getElementById('editarDiesel_economico');
    const dropdown = document.getElementById('editarDiesel_economico_dropdown');

    if (!input || !dropdown) {
      return;
    }

    if (input.value.trim().length > 0) {
      filtrarEconomicosDieselEditar(input.value);
    } else {
      // Mostrar lista completa
      if (
        !window.ERPState.getCache('economicos') ||
        window.ERPState.getCache('economicos').length === 0
      ) {
        if (typeof window.cargarTractocamionesEnCacheDiesel === 'function') {
          window.cargarTractocamionesEnCacheDiesel().then(() => {
            mostrarDropdownEconomicosDieselEditar();
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
          e.preventDefault();
          seleccionarEconomicoDieselEditar(economico, numero);
        });
        item.addEventListener('click', e => {
          e.preventDefault();
          seleccionarEconomicoDieselEditar(economico, numero);
        });
        dropdown.appendChild(item);
      });

      if (dropdown.parentElement !== document.body) {
        const originalParent = dropdown.parentElement;
        document.body.appendChild(dropdown);
        dropdown._originalParent = originalParent;
      }

      dropdown.classList.add('show');
    }
  };

  window.ocultarDropdownEconomicosDieselEditar = function () {
    const dropdown = document.getElementById('editarDiesel_economico_dropdown');
    if (dropdown) {
      setTimeout(() => {
        if (dropdown && dropdown.classList.contains('show')) {
          if (!dropdown.matches(':hover') && !dropdown.querySelector(':hover')) {
            dropdown.classList.remove('show');
            dropdown.style.cssText = '';
          }
        }
      }, 300);
    }
  };

  window.desplegarListaEconomicosDieselEditar = function () {
    const input = document.getElementById('editarDiesel_economico');
    if (input) {
      input.focus();
      mostrarDropdownEconomicosDieselEditar();
    }
  };

  window.manejarTecladoEconomicosDieselEditar = function (event) {
    const dropdown = document.getElementById('editarDiesel_economico_dropdown');
    const items = dropdown?.querySelectorAll('.searchable-select-item');

    if (!items || items.length === 0) {
      return;
    }

    let currentIndex = -1;
    items.forEach((item, index) => {
      if (item.classList.contains('highlighted')) {
        currentIndex = index;
      }
    });

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const newIndex = Math.min(currentIndex + 1, items.length - 1);
      items.forEach((item, index) => {
        item.classList.toggle('highlighted', index === newIndex);
      });
      items[newIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const newIndex = Math.max(currentIndex - 1, -1);
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
      ocultarDropdownEconomicosDieselEditar();
    }
  };

  // Funciones para operadores en el modal (adaptadas para usar IDs del modal)
  window.filtrarOperadoresDieselEditar = function (busqueda, tipo) {
    const inputId = `editarDiesel_operador${tipo}`;
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(`${inputId}_dropdown`);

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

    if (termino.length === 0) {
      dropdown.classList.remove('show');
      return;
    }

    if (!window._operadoresCache || window._operadoresCache.length === 0) {
      if (typeof window.cargarOperadoresEnCacheDiesel === 'function') {
        window.cargarOperadoresEnCacheDiesel().then(() => {
          filtrarOperadoresDieselEditar(busqueda, tipo);
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
      dropdown.classList.add('show');
      return;
    }

    const limitados = filtrados.slice(0, 20);
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
        seleccionarOperadorDieselEditar(operador, nombre, tipo);
      });
      item.addEventListener('click', e => {
        e.preventDefault();
        seleccionarOperadorDieselEditar(operador, nombre, tipo);
      });
      dropdown.appendChild(item);
    });

    if (dropdown.parentElement !== document.body) {
      const originalParent = dropdown.parentElement;
      document.body.appendChild(dropdown);
      dropdown._originalParent = originalParent;
    }

    dropdown.classList.add('show');
  };

  function seleccionarOperadorDieselEditar(operador, valor, tipo) {
    const inputId = `editarDiesel_operador${tipo}`;
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(`${inputId}_dropdown`);
    const hiddenInput = document.getElementById(`${inputId}_value`);

    if (!input) {
      return;
    }

    const nombre = operador.nombre || valor;
    const licencia = operador.licencia || '';

    let texto = nombre;
    if (licencia) {
      texto += ` - ${licencia}`;
    }

    input.value = texto;
    // Guardar el ID del operador (no el nombre) en el hidden input
    // Usar el mismo patrón que en diesel-data-loaders.js: id || nombre || numeroLicencia
    // Prioridad: id > numeroLicencia > licencia > nombre
    const operadorId =
      operador.id || operador.numeroLicencia || operador.licencia || operador.nombre || nombre;
    if (hiddenInput) {
      hiddenInput.value = operadorId;
      console.log(`🔑 ID del operador guardado en hidden input (editar): ${operadorId}`);
    }

    if (dropdown) {
      dropdown.classList.remove('show');
      dropdown.style.cssText = '';
    }
  }

  window.mostrarDropdownOperadoresDieselEditar = function (tipo) {
    const inputId = `editarDiesel_operador${tipo}`;
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(`${inputId}_dropdown`);

    if (!input || !dropdown) {
      return;
    }

    if (input.value.trim().length > 0) {
      filtrarOperadoresDieselEditar(input.value, tipo);
    } else {
      if (!window._operadoresCache || window._operadoresCache.length === 0) {
        if (typeof window.cargarOperadoresEnCacheDiesel === 'function') {
          window.cargarOperadoresEnCacheDiesel().then(() => {
            mostrarDropdownOperadoresDieselEditar(tipo);
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
          seleccionarOperadorDieselEditar(operador, nombre, tipo);
        });
        item.addEventListener('click', e => {
          e.preventDefault();
          seleccionarOperadorDieselEditar(operador, nombre, tipo);
        });
        dropdown.appendChild(item);
      });

      if (dropdown.parentElement !== document.body) {
        const originalParent = dropdown.parentElement;
        document.body.appendChild(dropdown);
        dropdown._originalParent = originalParent;
      }

      dropdown.classList.add('show');
    }
  };

  window.ocultarDropdownOperadoresDieselEditar = function (tipo) {
    const inputId = `editarDiesel_operador${tipo}`;
    const dropdown = document.getElementById(`${inputId}_dropdown`);

    if (dropdown) {
      setTimeout(() => {
        if (dropdown && dropdown.classList.contains('show')) {
          if (!dropdown.matches(':hover') && !dropdown.querySelector(':hover')) {
            dropdown.classList.remove('show');
            dropdown.style.cssText = '';
          }
        }
      }, 300);
    }
  };

  window.desplegarListaOperadoresDieselEditar = function (tipo) {
    const inputId = `editarDiesel_operador${tipo}`;
    const input = document.getElementById(inputId);
    if (input) {
      input.focus();
      mostrarDropdownOperadoresDieselEditar(tipo);
    }
  };

  window.manejarTecladoOperadoresDieselEditar = function (event, tipo) {
    const inputId = `editarDiesel_operador${tipo}`;
    const dropdown = document.getElementById(`${inputId}_dropdown`);
    const items = dropdown?.querySelectorAll('.searchable-select-item');

    if (!items || items.length === 0) {
      return;
    }

    let currentIndex = -1;
    items.forEach((item, index) => {
      if (item.classList.contains('highlighted')) {
        currentIndex = index;
      }
    });

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const newIndex = Math.min(currentIndex + 1, items.length - 1);
      items.forEach((item, index) => {
        item.classList.toggle('highlighted', index === newIndex);
      });
      items[newIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const newIndex = Math.max(currentIndex - 1, -1);
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
      ocultarDropdownOperadoresDieselEditar(tipo);
    }
  };

  console.log('✅ Módulo diesel-modal-editar.js cargado');
})();
