/**
 * Manejo de Formularios - trafico.html
 * Funciones para búsqueda, validación y llenado de datos del formulario
 */

(function () {
  'use strict';

  /**
   * Función para buscar datos con validación
   */
  window.buscarDatosConValidacion = async function () {
    const numeroRegistroInput = document.getElementById('numeroRegistro');
    if (!numeroRegistroInput) {
      console.error('❌ Campo de número de registro no encontrado');
      return;
    }

    const registroId = numeroRegistroInput.value.trim();
    if (!registroId) {
      if (typeof window.showNotification === 'function') {
        window.showNotification('Por favor ingrese un número de registro', 'warning');
      } else {
        alert('Por favor ingrese un número de registro');
      }
      return;
    }

    // PRIORIDAD: Verificar si el registro existe en Firebase Logística
    let registroEnLogistica = null;

    if (window.firebaseRepos?.logistica) {
      try {
        const repoLogistica = window.firebaseRepos.logistica;

        // Intentar inicializar una vez si no está listo
        if (
          typeof repoLogistica.init === 'function' &&
          (!repoLogistica.db || !repoLogistica.tenantId)
        ) {
          try {
            await repoLogistica.init();
          } catch (e) {
            // Ignorar error intencionalmente
          }
        }

        // Intentar usar Firebase si está disponible
        if (repoLogistica.db && repoLogistica.tenantId) {
          console.log('📡 Verificando registro en Firebase logistica...');

          // PRIMERO: Intentar buscar directamente por ID del documento
          if (typeof repoLogistica.getRegistro === 'function') {
            try {
              registroEnLogistica = await repoLogistica.getRegistro(registroId);
              if (registroEnLogistica) {
                console.log(
                  '✅ Registro encontrado directamente por ID en Firebase:',
                  registroEnLogistica
                );
              }
            } catch (error) {
              console.debug('⚠️ Error buscando directamente por ID:', error);
            }
          }

          // SEGUNDO: Si no se encontró, buscar en todos los registros
          if (!registroEnLogistica) {
            const registrosLogistica = await repoLogistica.getAllRegistros();
            console.log(`📊 Total de registros en logística: ${registrosLogistica.length}`);

            // Buscar por múltiples campos posibles
            registroEnLogistica = registrosLogistica.find(r => {
              const id = String(r.id || '').trim();
              const numReg = String(r.numeroRegistro || r.registroId || '').trim();
              const registroIdStr = String(registroId).trim();
              return id === registroIdStr || numReg === registroIdStr;
            });

            if (registroEnLogistica) {
              console.log(
                '✅ Registro encontrado en lista de Firebase logistica:',
                registroEnLogistica
              );
            } else {
              console.warn(
                `⚠️ Registro ${registroId} no encontrado en ${registrosLogistica.length} registros`
              );
              // Log de los primeros registros para debugging
              if (registrosLogistica.length > 0) {
                console.log(
                  '📋 Primeros registros disponibles:',
                  registrosLogistica.slice(0, 3).map(r => ({
                    id: r.id,
                    numeroRegistro: r.numeroRegistro || r.registroId
                  }))
                );
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Error buscando en Firebase:', error);
      }
    }

    // Fallback 1: Buscar en DataPersistence
    if (!registroEnLogistica && typeof window.DataPersistence !== 'undefined') {
      try {
        registroEnLogistica = window.DataPersistence.getLogisticaData(registroId);
        if (registroEnLogistica) {
          console.log('✅ Registro encontrado en DataPersistence');
        }
      } catch (error) {
        console.debug('⚠️ Error buscando en DataPersistence:', error);
      }
    }

    // NO USAR localStorage - Solo Firebase es la fuente de verdad
    if (!registroEnLogistica) {
      console.warn('⚠️ Registro de logística no encontrado en Firebase');
      console.warn(
        '⚠️ Firebase es la única fuente de datos. localStorage ha sido deshabilitado para evitar inconsistencias.'
      );
      console.log('❌ Registro no existe en Logística');

      // Marcar el campo como inválido
      numeroRegistroInput.classList.add('is-invalid');
      numeroRegistroInput.classList.remove('is-valid');

      // Crear mensaje de error
      const errorDiv = document.createElement('div');
      errorDiv.id = 'numeroRegistro-error';
      errorDiv.className = 'invalid-feedback';
      errorDiv.textContent = `❌ El número ${registroId} no existe en Logística. Debe crearse primero en el módulo de Logística.`;

      // Limpiar mensaje anterior si existe
      const existingError = document.getElementById('numeroRegistro-error');
      if (existingError) {
        existingError.remove();
      }

      numeroRegistroInput.parentNode.appendChild(errorDiv);
      numeroRegistroInput.focus();
      return;
    }

    console.log('✅ Registro válido - existe en Logística');

    // Marcar como válido
    numeroRegistroInput.classList.add('is-valid');
    numeroRegistroInput.classList.remove('is-invalid');

    // Asegurar que el campo tenga el valor
    if (numeroRegistroInput.value !== registroId) {
      numeroRegistroInput.value = registroId;
      // Disparar eventos para que los listeners se activen
      numeroRegistroInput.dispatchEvent(new Event('change', { bubbles: true }));
      numeroRegistroInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // ACTUALIZAR EL TOPBAR HEADER INMEDIATAMENTE
    console.log('🔍 ACTUALIZANDO TOPBAR HEADER con registro:', registroId);

    // Función para actualizar el topbar directamente
    const actualizarTopbarHeader = numero => {
      console.log('🔍 Buscando elemento headerRegistrationNumber en topbar...');

      // Intentar múltiples formas de encontrar el elemento
      let headerElement = document.getElementById('headerRegistrationNumber');

      if (!headerElement) {
        console.log('⚠️ No encontrado por ID, buscando por clase...');
        headerElement = document.querySelector('.registration-number');
      }

      if (!headerElement) {
        console.log('⚠️ No encontrado por clase, buscando en contenedor...');
        const container = document.getElementById('currentRegistration');
        if (container) {
          headerElement =
            container.querySelector('.registration-number') || container.querySelector('span');
        }
      }

      if (!headerElement) {
        console.log('⚠️ No encontrado en contenedor, buscando en todo el documento...');
        const allSpans = document.querySelectorAll('span.registration-number');
        if (allSpans.length > 0) {
          headerElement = allSpans[0];
        }
      }

      if (headerElement) {
        const valorAnterior = headerElement.textContent;
        headerElement.textContent = numero;
        console.log(`✅ TOPBAR HEADER ACTUALIZADO: "${valorAnterior}" -> "${numero}"`);
        console.log('✅ Elemento encontrado:', headerElement);
        console.log('✅ ID del elemento:', headerElement.id);
        console.log('✅ Clase del elemento:', headerElement.className);
        return true;
      }
      // No es crítico si no se encuentra el elemento, solo mostrar un warning
      console.debug(
        '⚠️ No se encontró el elemento headerRegistrationNumber en el topbar (no crítico)'
      );
      return false;
    };

    // Intentar actualizar inmediatamente
    if (!actualizarTopbarHeader(registroId)) {
      // Reintentar después de un breve delay
      setTimeout(() => {
        console.log('🔄 Reintentando actualizar topbar header...');
        if (!actualizarTopbarHeader(registroId)) {
          // Último intento con la función global
          if (typeof window.updateHeaderRegistrationNumber === 'function') {
            window.updateHeaderRegistrationNumber(registroId);
            console.log('✅ Intentando actualizar usando función global como último recurso');
          }
        }
      }, 200);
    }

    // También usar la función global como respaldo
    if (typeof window.updateHeaderRegistrationNumber === 'function') {
      window.updateHeaderRegistrationNumber(registroId);
    }

    // Llenar campos directamente con el registro de Firebase
    if (registroEnLogistica) {
      await window.llenarCamposDesdeLogistica(registroEnLogistica, registroId);

      // ACTUALIZAR TOPBAR HEADER después de llenar campos
      console.log('🔄 Actualizando topbar header después de llenar campos...');
      setTimeout(() => {
        const headerElement = document.getElementById('headerRegistrationNumber');
        if (headerElement) {
          const valorAnterior = headerElement.textContent;
          headerElement.textContent = registroId;
          console.log(
            `✅ TOPBAR HEADER ACTUALIZADO después de llenar: "${valorAnterior}" -> "${registroId}"`
          );
        } else {
          console.warn(
            '⚠️ Elemento headerRegistrationNumber no encontrado después de llenar campos'
          );
          // Intentar buscar de otras formas
          const altElement =
            document.querySelector('.registration-number') ||
            document.querySelector('#currentRegistration span');
          if (altElement) {
            altElement.textContent = registroId;
            console.log('✅ TOPBAR HEADER actualizado usando selector alternativo');
          } else {
            // Intentar con función global
            if (typeof window.updateHeaderRegistrationNumber === 'function') {
              window.updateHeaderRegistrationNumber(registroId);
              console.log('✅ Intentando actualizar usando función global');
            }
          }
        }
      }, 300);
    } else {
      // Fallback: usar función de búsqueda antigua
      if (typeof window.searchAndFillData === 'function') {
        await window.searchAndFillData(registroId);
      } else if (typeof window.safeSearchAndFillData === 'function') {
        window.safeSearchAndFillData(registroId);
      } else {
        console.error('❌ Funciones de búsqueda no disponibles');
        if (typeof window.showNotification === 'function') {
          window.showNotification('Error: Funciones de búsqueda no disponibles', 'error');
        } else {
          alert('Error: Funciones de búsqueda no disponibles');
        }
      }
    }
  };

  /**
   * Función para llenar campos desde registro de logística (Firebase)
   */
  window.llenarCamposDesdeLogistica = async function (registroLogistica, registroId) {
    console.log('📦 Llenando campos desde registro de logística:', registroLogistica);

    // Asegurar que el campo numeroRegistro tenga el valor
    const numeroRegistroInput = document.getElementById('numeroRegistro');
    if (numeroRegistroInput && numeroRegistroInput.value !== registroId) {
      numeroRegistroInput.value = registroId;
      // Disparar evento change para que los listeners se activen
      numeroRegistroInput.dispatchEvent(new Event('change', { bubbles: true }));
      numeroRegistroInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Actualizar el número de registro en el header del topbar directamente
    if (registroId) {
      console.log('🔄 Actualizando topbar header en llenarCamposDesdeLogistica con:', registroId);
      const headerElement = document.getElementById('headerRegistrationNumber');
      if (headerElement) {
        const valorAnterior = headerElement.textContent;
        headerElement.textContent = registroId;
        console.log(
          `✅ TOPBAR HEADER actualizado en llenarCamposDesdeLogistica: "${valorAnterior}" -> "${registroId}"`
        );
      } else {
        console.warn(
          '⚠️ Elemento headerRegistrationNumber no encontrado, buscando alternativas...'
        );
        // Intentar buscar de otras formas
        const altElement =
          document.querySelector('.registration-number') ||
          document.querySelector('#currentRegistration span');
        if (altElement) {
          altElement.textContent = registroId;
          console.log('✅ TOPBAR HEADER actualizado usando selector alternativo');
        } else {
          // Intentar con función global
          if (typeof window.updateHeaderRegistrationNumber === 'function') {
            window.updateHeaderRegistrationNumber(registroId);
            console.log('✅ Intentando actualizar usando función global');
          }
        }
      }
    }

    // Obtener el nombre del cliente basado en el RFC
    let nombreCliente = registroLogistica.cliente;
    console.log('🔍 Cliente original:', registroLogistica.cliente);
    console.log('🔍 RFC Cliente:', registroLogistica.rfcCliente);

    // Verificar si hay un RFC válido
    const { rfcCliente } = registroLogistica;
    if (rfcCliente && rfcCliente !== 'undefined' && rfcCliente !== 'null') {
      try {
        console.log('🔍 Buscando cliente con RFC:', rfcCliente);

        if (
          window.configuracionManager &&
          typeof window.configuracionManager.getCliente === 'function'
        ) {
          console.log('✅ configuracionManager disponible');
          const clienteData = window.configuracionManager.getCliente(rfcCliente);
          console.log('🔍 Datos del cliente encontrados:', clienteData);

          if (clienteData && clienteData.nombre) {
            nombreCliente = clienteData.nombre;
            console.log('✅ Nombre del cliente encontrado:', nombreCliente);
          }
        }
      } catch (error) {
        console.log('⚠️ Error al obtener el nombre del cliente:', error);
      }
    }

    console.log('✅ Nombre final del cliente:', nombreCliente);

    console.log('🔍 Datos de embalaje especial:');
    console.log('  - embalajeEspecial:', registroLogistica.embalajeEspecial);
    console.log('  - descripcionEmbalaje:', registroLogistica.descripcionEmbalaje);

    // Formatear embalaje especial para mostrar "Sí" o "No"
    let embalajeEspecialFormateado = 'No';
    let tieneEmbalajeEspecial = false;
    if (registroLogistica.embalajeEspecial) {
      const embalajeValue = String(registroLogistica.embalajeEspecial).toLowerCase();
      if (
        embalajeValue === 'si' ||
        embalajeValue === 'sí' ||
        embalajeValue === 'yes' ||
        embalajeValue === 'true' ||
        embalajeValue === '1'
      ) {
        embalajeEspecialFormateado = 'Sí';
        tieneEmbalajeEspecial = true;
      } else {
        embalajeEspecialFormateado = 'No';
      }
    }

    // Combinar observaciones con descripción de embalaje especial
    let observacionesCompletas = registroLogistica.observaciones || '';
    // Incluir descripción del embalaje si existe
    if (registroLogistica.descripcionEmbalaje) {
      if (observacionesCompletas) {
        observacionesCompletas += '\n\n';
      }
      observacionesCompletas += `EMBALAJE ESPECIAL: ${registroLogistica.descripcionEmbalaje}`;
    } else if (tieneEmbalajeEspecial && registroLogistica.descripcion) {
      // También buscar en el campo 'descripcion' si existe
      if (observacionesCompletas) {
        observacionesCompletas += '\n\n';
      }
      observacionesCompletas += `EMBALAJE ESPECIAL: ${registroLogistica.descripcion}`;
    }

    console.log('📝 Observaciones completas:', observacionesCompletas);
    console.log('📦 Embalaje especial formateado:', embalajeEspecialFormateado);

    // Guardar el RFC del cliente en un campo oculto y data attribute para poder recuperarlo después
    const rfcClienteLogistica = registroLogistica.rfcCliente || '';
    const campoCliente = document.getElementById('cliente');
    const campoRfcClienteHidden = document.getElementById('rfcCliente_value');
    const campoRfcClienteVisible = document.getElementById('rfcCliente');

    if (rfcClienteLogistica) {
      // PRIORIDAD 1: Guardar en campo oculto (más confiable)
      if (campoRfcClienteHidden) {
        campoRfcClienteHidden.value = rfcClienteLogistica;
        console.log(
          '✅ RFC del cliente guardado en campo oculto rfcCliente_value:',
          rfcClienteLogistica
        );
      }

      // PRIORIDAD 2: Llenar campo visible RFC
      if (campoRfcClienteVisible) {
        campoRfcClienteVisible.value = rfcClienteLogistica;
        console.log('✅ RFC del cliente llenado en campo visible rfcCliente:', rfcClienteLogistica);
      }

      // PRIORIDAD 3: También guardar en data attribute como respaldo
      if (campoCliente) {
        campoCliente.dataset.rfcCliente = rfcClienteLogistica;
        console.log('✅ RFC del cliente guardado en data attribute:', rfcClienteLogistica);
      }
    }

    const campos = {
      cliente: nombreCliente,
      rfcCliente: rfcClienteLogistica, // Agregar RFC a los campos que se llenan automáticamente
      origen: registroLogistica.origen,
      destino: registroLogistica.destino,
      'referencia cliente': registroLogistica.referenciaCliente,
      tiposervicio: registroLogistica.tipoServicio,
      embalajeEspecial: embalajeEspecialFormateado,
      plataforma: registroLogistica.plataforma,
      mercancia: registroLogistica.mercancia || registroLogistica.tipoMercancia,
      peso: registroLogistica.peso,
      largo: registroLogistica.largo,
      ancho: registroLogistica.ancho,
      fechaEnvio: registroLogistica.fechaEnvio,
      observacionesLogistica: observacionesCompletas
    };

    let camposLlenados = 0;
    Object.keys(campos).forEach(selector => {
      const element = document.getElementById(selector);
      if (element) {
        // Para embalajeEspecial, siempre asignar el valor (incluso si es "No")
        if (selector === 'embalajeEspecial') {
          element.value = campos[selector] || 'No';
          camposLlenados++;
          console.log(`✅ Campo ${selector} llenado con valor:`, element.value);
          console.log('✅ Elemento encontrado:', element.id, element.tagName, element.type);
        } else if (selector === 'observacionesLogistica') {
          // Para observaciones, siempre asignar (puede estar vacío)
          element.value = campos[selector] || '';
          if (campos[selector]) {
            camposLlenados++;
            console.log(`✅ Campo ${selector} llenado:`, `${campos[selector].substring(0, 50)}...`);
          } else {
            console.log(`⚠️ Campo ${selector} está vacío`);
          }
        } else if (campos[selector]) {
          element.value = campos[selector];
          camposLlenados++;
          console.log(`✅ Campo ${selector} llenado:`, campos[selector]);
        }
      } else if (selector === 'embalajeEspecial') {
        console.log(`⚠️ Campo ${selector} no se pudo llenar: elemento no encontrado`);
        console.log('  - Valor disponible:', campos[selector]);
        console.log('  - Buscando elemento con id: embalajeEspecial');
        // Intentar buscar de otra forma
        const elementoAlternativo = document.querySelector('#embalajeEspecial');
        if (elementoAlternativo) {
          elementoAlternativo.value = campos[selector] || 'No';
          camposLlenados++;
          console.log(`✅ Campo ${selector} llenado usando querySelector`);
        } else {
          // Intentar buscar por name
          const elementoPorName = document.querySelector('[name="embalajeEspecial"]');
          if (elementoPorName) {
            elementoPorName.value = campos[selector] || 'No';
            camposLlenados++;
            console.log(`✅ Campo ${selector} llenado usando querySelector por name`);
          }
        }
      } else if (selector === 'observacionesLogistica') {
        console.log(`⚠️ Campo ${selector} no se pudo llenar: elemento no encontrado`);
        console.log(
          '  - Valor disponible:',
          campos[selector] ? `${campos[selector].substring(0, 50)}...` : 'vacío'
        );
        // Intentar buscar de otra forma
        const elementoAlternativo = document.querySelector('#observacionesLogistica');
        if (elementoAlternativo) {
          elementoAlternativo.value = campos[selector] || '';
          if (campos[selector]) {
            camposLlenados++;
            console.log(`✅ Campo ${selector} llenado usando querySelector`);
          }
        }
      }
    });

    if (camposLlenados > 0) {
      console.log(`✅ ${camposLlenados} campos llenados automáticamente desde Firebase`);
      if (typeof window.showNotification === 'function') {
        window.showNotification(
          `✅ Datos de logística cargados para ${registroId}\n\nSe llenaron ${camposLlenados} campos automáticamente.`,
          'success'
        );
      } else {
        alert(
          `✅ Datos de logística cargados para ${registroId}\n\nSe llenaron ${camposLlenados} campos automáticamente.`
        );
      }
      return true;
    }
    console.warn('⚠️ No se pudieron llenar los campos');
    if (typeof window.showNotification === 'function') {
      window.showNotification(
        '⚠️ Datos de logística encontrados pero no se pudieron cargar',
        'warning'
      );
    } else {
      alert('⚠️ Datos de logística encontrados pero no se pudieron cargar');
    }
    return false;
  };

  /**
   * Función para limpiar el historial de números de registro
   */
  window.limpiarHistorialNumeros = function () {
    console.log('🧹 Limpiando historial de números de registro...');
    localStorage.removeItem('registrationNumbers');
    console.log('✅ Historial limpiado. Ahora puedes probar desde cero.');

    // Mostrar notificación
    if (typeof window.showNotification === 'function') {
      window.showNotification(
        'Historial de números limpiado. Puedes probar desde cero.',
        'success'
      );
    }
  };

  /**
   * Función de debug para verificar validación de números
   */
  window.debugValidacionTrafico = function (numero) {
    console.log('🔍 DEBUG: Verificando validación para número:', numero);

    const history = JSON.parse(localStorage.getItem('registrationNumbers') || '[]');
    console.log('📋 Historial completo:', history);

    const existingNumber = history.find(item => item.number === numero);
    console.log('🔍 Número encontrado:', existingNumber);

    if (existingNumber) {
      const existingInTrafico = history.find(
        item => item.number === numero && item.page && item.page.includes('trafico')
      );
      console.log('🚛 Existe en Tráfico:', existingInTrafico);

      if (existingInTrafico) {
        console.log('❌ DEBERÍA RECHAZAR - Número ya procesado en Tráfico');
      } else {
        console.log('✅ DEBERÍA PERMITIR - Número de otro módulo (Logística, Facturación, etc.)');
      }
    } else {
      console.log('✅ DEBERÍA PERMITIR - Número nuevo');
    }
  };
})();
