/**
 * Gestor de Descarga de Plataforma - trafico.html
 * Funciones para gestionar el registro de descarga de plataformas
 */

(function () {
  'use strict';

  // Abrir modal de descarga
  window.abrirModalDescarga = async function (registroId) {
    console.log('🔍 Abriendo modal de descarga para registro:', registroId);

    // PRIORIDAD 1: Buscar en Firebase
    let registro = null;
    if (window.firebaseRepos?.trafico) {
      try {
        registro = await window.firebaseRepos.trafico.get(registroId);
        if (registro) {
          console.log('✅ Registro encontrado en Firebase:', registro);
        } else {
          console.warn('⚠️ Registro no encontrado en Firebase, intentando localStorage...');
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo registro desde Firebase:', error);
      }
    }

    // PRIORIDAD 2: Fallback a localStorage
    if (!registro) {
      const raw = localStorage.getItem('erp_shared_data');
      const parsed = raw ? JSON.parse(raw) : {};
      registro = parsed.trafico?.[registroId];
      if (registro) {
        console.log('✅ Registro encontrado en localStorage:', registro);
      }
    }

    if (!registro) {
      console.error('❌ Registro no encontrado ni en Firebase ni en localStorage:', registroId);
      alert('❌ Registro no encontrado. Por favor, verifica que el registro exista.');
      return;
    }

    // Llenar información del registro en el modal (solo visualización)
    const descargaRegistroId = document.getElementById('descargaRegistroId');
    const descargaPlataforma = document.getElementById('descargaPlataforma');
    const descargaUbicacion = document.getElementById('descargaUbicacion');

    if (descargaRegistroId) {
      descargaRegistroId.textContent = registroId;
    }

    // Mostrar plataformaServicio (número de plataforma, no el tipo)
    const plataformaTexto = registro.plataformaServicio || registro.plataforma || 'N/A';
    if (descargaPlataforma) {
      descargaPlataforma.textContent = plataformaTexto;
    }

    // Mostrar ubicación (origen -> destino)
    const ubicacionTexto = `${registro.origen || registro.LugarOrigen || 'N/A'} → ${registro.destino || registro.LugarDestino || 'N/A'}`;
    if (descargaUbicacion) {
      descargaUbicacion.textContent = ubicacionTexto;
    }

    // Llenar campo de fecha de descarga - si ya existe, cargarla; si no, dejar hoy por defecto
    const descargaFecha = document.getElementById('descargaFecha');
    if (descargaFecha) {
      if (registro.fechaDescarga) {
        // Si ya hay fecha de descarga, cargarla en el campo
        const fechaDescargaObj = new Date(registro.fechaDescarga);
        // Formatear a YYYY-MM-DD para el input type="date"
        const fechaFormateada = fechaDescargaObj.toISOString().split('T')[0];
        descargaFecha.value = fechaFormateada;
        console.log('✅ Fecha de descarga existente cargada:', fechaFormateada);
      } else {
        // Si no hay fecha, poner la fecha de hoy por defecto
        const hoy = new Date().toISOString().split('T')[0];
        descargaFecha.value = hoy;
        console.log('✅ Fecha de hoy asignada por defecto:', hoy);
      }
    }

    // Guardar datos originales para usar si checkbox está marcado
    window.__descargaData = {
      registroId,
      tractocamion: registro.economico || 'N/A',
      placasEconomico: registro.Placas || registro.placas || registro.placaTracto || '',
      operadorPrincipal: registro.operadorprincipal || registro.operadorPrincipal || 'N/A',
      operadorSecundario: registro.operadorSecundario || registro.operadorsecundario || '',
      // Guardar también datos de plataforma y estancias para preservarlos
      plataforma: registro.plataforma || registro.plataformaServicio || '',
      plataformaServicio: registro.plataformaServicio || '',
      placasPlataforma: registro.placasPlataforma || '',
      origen: registro.origen || registro.LugarOrigen || '',
      destino: registro.destino || registro.LugarDestino || '',
      lugarOrigen: registro.lugarOrigen || registro.LugarOrigen || '',
      lugarDestino: registro.lugarDestino || registro.LugarDestino || ''
    };

    // Cargar listas de económicos y operadores
    const selectTractocamion = document.getElementById('descargaTractocamion');
    const selectPlacasEconomico = document.getElementById('descargaPlacasEconomico');

    if (window.__economicosCache && selectTractocamion) {
      selectTractocamion.innerHTML = '<option value="">Seleccionar...</option>';
      window.__economicosCache.forEach(e => {
        const option = document.createElement('option');
        const numero = e.numero || e.numeroEconomico || '';
        const marca = e.marca || '';
        const modelo = e.modelo || '';
        option.value = numero;
        option.textContent = `${numero} - ${marca} ${modelo}`.trim();
        option.dataset.placas = e.placaTracto || e.placa || e.placas || e.Placas || '';
        selectTractocamion.appendChild(option);
      });

      // Agregar listener para actualizar placas cuando se seleccione un económico
      selectTractocamion.addEventListener('change', function () {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption && selectedOption.dataset.placas && selectPlacasEconomico) {
          selectPlacasEconomico.value = selectedOption.dataset.placas;
        } else if (selectPlacasEconomico) {
          selectPlacasEconomico.value = '';
        }
      });
    }

    // Cargar operadores (con fallback a Firebase)
    const selectPrincipal = document.getElementById('descargaOperadorPrincipal');
    const selectSecundario = document.getElementById('descargaOperadorSecundario');

    if (selectPrincipal && selectSecundario) {
      // Limpiar selects
      selectPrincipal.innerHTML = '<option value="">Seleccionar...</option>';
      selectSecundario.innerHTML = '<option value="">Seleccionar...</option>';

      try {
        let operadores = [];

        // PRIORIDAD 1: Intentar desde configuracionManager
        if (
          window.configuracionManager &&
          typeof window.configuracionManager.getOperadores === 'function'
        ) {
          const operadoresTemp = window.configuracionManager.getOperadores();
          operadores = Array.isArray(operadoresTemp) ? operadoresTemp : [];
        }

        // PRIORIDAD 2: Si no hay operadores, cargar desde Firebase
        if (operadores.length === 0 && window.firebaseDb && window.fs) {
          try {
            const operadoresDocRef = window.fs.doc(
              window.firebaseDb,
              'configuracion',
              'operadores'
            );
            const operadoresDoc = await window.fs.getDoc(operadoresDocRef);
            if (operadoresDoc.exists()) {
              const data = operadoresDoc.data();
              if (data.operadores && Array.isArray(data.operadores)) {
                operadores = data.operadores;
                console.log(
                  `✅ ${operadores.length} operadores cargados desde Firebase para modal de descarga`
                );
              }
            }
          } catch (e) {
            console.warn('⚠️ Error obteniendo operadores desde Firebase:', e);
          }
        }

        // Filtrar operadores principales
        const operadoresPrincipales = operadores.filter(
          op =>
            op.tipoOperador === 'principal' ||
            op.tipoOperador === 'Principal' ||
            op.tipo === 'principal' ||
            !op.tipoOperador
        );

        // Filtrar operadores secundarios
        const operadoresSecundarios = operadores.filter(
          op =>
            op.tipoOperador === 'secundario' ||
            op.tipoOperador === 'Secundario' ||
            op.tipo === 'secundario' ||
            op.tipoOperador === 'Respaldo'
        );

        // Poblar select de operador principal
        if (operadoresPrincipales.length > 0) {
          operadoresPrincipales.forEach(op => {
            const option = document.createElement('option');
            const operadorId = op.id || op.nombre || op;
            const operadorNombre = op.nombre || op;
            option.value = operadorId;
            option.textContent = operadorNombre;
            selectPrincipal.appendChild(option);
          });
        } else if (operadores.length > 0) {
          // Si no hay filtrados, mostrar todos
          operadores.forEach(op => {
            const option = document.createElement('option');
            const operadorId = op.id || op.nombre || op;
            const operadorNombre = op.nombre || op;
            option.value = operadorId;
            option.textContent = operadorNombre;
            selectPrincipal.appendChild(option);
          });
        }

        // Poblar select de operador secundario
        if (operadoresSecundarios.length > 0) {
          operadoresSecundarios.forEach(op => {
            const option = document.createElement('option');
            const operadorId = op.id || op.nombre || op;
            const operadorNombre = op.nombre || op;
            option.value = operadorId;
            option.textContent = operadorNombre;
            selectSecundario.appendChild(option);
          });
        } else if (operadores.length > 0) {
          // Si no hay filtrados, mostrar todos
          operadores.forEach(op => {
            const option = document.createElement('option');
            const operadorId = op.id || op.nombre || op;
            const operadorNombre = op.nombre || op;
            option.value = operadorId;
            option.textContent = operadorNombre;
            selectSecundario.appendChild(option);
          });
        }

        if (operadores.length === 0) {
          console.warn('⚠️ No se encontraron operadores para el modal de descarga');
        }
      } catch (error) {
        console.error('❌ Error cargando operadores para modal de descarga:', error);
      }
    }

    // Nota: La fecha de descarga ya se llenó anteriormente en la función (línea 36)
    // Si no se llenó anteriormente (caso raro), asegurar que tenga valor por defecto
    if (descargaFecha && !descargaFecha.value) {
      descargaFecha.value = new Date().toISOString().split('T')[0];
    }

    // Abrir modal
    console.log('🔄 Intentando abrir modal de descarga...');
    const modalElement = document.getElementById('modalDescargaPlataforma');
    if (modalElement) {
      console.log('✅ Elemento del modal encontrado');
      if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        console.log('✅ Bootstrap está disponible, abriendo modal...');
        try {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
          console.log('✅ Modal abierto exitosamente');
        } catch (error) {
          console.error('❌ Error al abrir modal con Bootstrap:', error);
          // Fallback: mostrar modal manualmente
          modalElement.style.display = 'block';
          modalElement.classList.add('show');
          modalElement.setAttribute('aria-modal', 'true');
          const backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          document.body.appendChild(backdrop);
          console.warn('⚠️ Modal mostrado manualmente debido a error en Bootstrap');
        }
      } else {
        console.error('❌ Bootstrap Modal no está disponible');
        // Fallback: mostrar modal manualmente
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        modalElement.setAttribute('aria-modal', 'true');
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
        console.warn('⚠️ Modal mostrado manualmente (Bootstrap no disponible)');
      }
    } else {
      console.error('❌ Modal modalDescargaPlataforma no encontrado en el DOM');
      alert('❌ Error: No se pudo abrir el modal de descarga. Por favor, recarga la página.');
    }
  };

  // Toggle campos de descarga
  window.toggleCamposDescarga = function () {
    const mismosDatos = document.getElementById('mismosDatos');
    const camposDiferentes = document.getElementById('camposDiferentes');

    if (mismosDatos && camposDiferentes) {
      const { checked } = mismosDatos;
      camposDiferentes.style.display = checked ? 'none' : 'block';

      // Si se marcan "mismos datos", llenar campos de solo lectura con datos originales
      if (checked && window.__descargaData) {
        const descargaPlacasEconomico = document.getElementById('descargaPlacasEconomico');
        if (descargaPlacasEconomico) {
          descargaPlacasEconomico.value = window.__descargaData.placasEconomico || '';
        }
      }
    }
  };

  // Confirmar descarga
  window.confirmarDescarga = async function () {
    try {
      // Validar que los datos de descarga estén disponibles
      if (!window.__descargaData || !window.__descargaData.registroId) {
        console.error('❌ Error: Datos de descarga no disponibles');
        alert(
          '❌ Error: No se encontraron los datos del registro. Por favor, cierre el modal y vuelva a intentar.'
        );
        return;
      }

      const { registroId } = window.__descargaData;
      const mismosDatos = document.getElementById('mismosDatos')?.checked || false;

      console.log('💾 Confirmando descarga para registro:', registroId);

      // Validar fecha de descarga (obligatoria siempre)
      const fechaDescarga = document.getElementById('descargaFecha')?.value;
      if (!fechaDescarga) {
        alert('Por favor ingrese la fecha de descarga');
        document.getElementById('descargaFecha')?.focus();
        return;
      }

      // Obtener información del registro para preservar datos importantes
      let registroOriginal = null;
      if (window.firebaseRepos?.trafico) {
        try {
          registroOriginal = await window.firebaseRepos.trafico.get(registroId);
        } catch (e) {
          console.warn('⚠️ Error obteniendo registro original:', e);
        }
      }

      // Si no se encontró en Firebase, buscar en localStorage
      if (!registroOriginal) {
        const raw = localStorage.getItem('erp_shared_data');
        const parsed = raw ? JSON.parse(raw) : {};
        registroOriginal = parsed.trafico?.[registroId];
      }

      // Datos de descarga - INCLUIR TODA LA INFORMACIÓN IMPORTANTE
      const datosDescarga = {
        estadoPlataforma: 'descargado',
        fechaDescarga: fechaDescarga,
        notasDescarga: document.getElementById('descargaNotas')?.value || ''
      };

      // SIEMPRE guardar información de plataforma y estancias (del registro original o de __descargaData)
      const datosFuente = registroOriginal || window.__descargaData || {};

      // Plataforma - Preservar siempre
      if (datosFuente.plataforma) {
        datosDescarga.plataforma = datosFuente.plataforma;
      }
      if (datosFuente.plataformaServicio) {
        datosDescarga.plataformaServicio = datosFuente.plataformaServicio;
      }
      if (datosFuente.placasPlataforma) {
        datosDescarga.placasPlataforma = datosFuente.placasPlataforma;
      }

      // Estancias (Origen y Destino) - Preservar siempre
      if (datosFuente.origen) {
        datosDescarga.origen = datosFuente.origen;
      }
      if (datosFuente.destino) {
        datosDescarga.destino = datosFuente.destino;
      }
      if (datosFuente.lugarOrigen) {
        datosDescarga.lugarOrigen = datosFuente.lugarOrigen;
      }
      if (datosFuente.lugarDestino) {
        datosDescarga.lugarDestino = datosFuente.lugarDestino;
      }

      console.log('📦 Información de plataforma y estancias preservada:', {
        plataforma: datosDescarga.plataforma,
        plataformaServicio: datosDescarga.plataformaServicio,
        placasPlataforma: datosDescarga.placasPlataforma,
        origen: datosDescarga.origen,
        destino: datosDescarga.destino,
        lugarOrigen: datosDescarga.lugarOrigen,
        lugarDestino: datosDescarga.lugarDestino
      });

      // Función auxiliar para obtener nombre del operador desde el valor (licencia o nombre)
      const obtenerNombreOperadorDescarga = async valor => {
        if (!valor || valor.trim() === '') {
          return '';
        }

        // Si el valor contiene " - ", extraer solo el nombre
        if (valor.includes(' - ')) {
          const nombre = valor.split(' - ')[0].trim();
          if (nombre) {
            return nombre;
          }
        }

        // Si ya es un nombre (no parece ser licencia/ID), retornarlo
        if (valor.length > 3 && !valor.match(/^[A-Z0-9-]+$/)) {
          return valor;
        }

        // Usar función global si existe
        if (typeof window.obtenerOperadorNombre === 'function') {
          try {
            const nombre = await window.obtenerOperadorNombre(valor);
            return nombre || valor;
          } catch (e) {
            console.warn('⚠️ Error obteniendo nombre del operador:', e);
          }
        }

        // Fallback: buscar en configuracionManager
        if (window.configuracionManager) {
          try {
            const operadores = window.configuracionManager.getAllOperadores() || [];
            const operadorRaw = Array.isArray(operadores)
              ? operadores
              : Object.values(operadores || {});

            const operador = operadorRaw.find(op => {
              if (!op) {
                return false;
              }
              const nombre = (op.nombre || '').toString().trim();
              const licencia = (op.licencia || op.numeroLicencia || '').toString().trim();
              return nombre === valor || licencia === valor;
            });

            if (operador && operador.nombre) {
              return operador.nombre;
            }
          } catch (e) {
            console.warn('⚠️ Error buscando operador:', e);
          }
        }

        return valor;
      };

      if (!mismosDatos) {
        // Usar datos diferentes
        datosDescarga.tractocamionDescarga =
          document.getElementById('descargaTractocamion')?.value || '';

        // Obtener nombres de operadores (no licencias)
        const operadorPrincipalValor =
          document.getElementById('descargaOperadorPrincipal')?.value || '';
        const operadorSecundarioValor =
          document.getElementById('descargaOperadorSecundario')?.value || '';

        datosDescarga.operadorPrincipalDescarga =
          await obtenerNombreOperadorDescarga(operadorPrincipalValor);
        datosDescarga.operadorSecundarioDescarga =
          await obtenerNombreOperadorDescarga(operadorSecundarioValor);

        if (!datosDescarga.tractocamionDescarga || !datosDescarga.operadorPrincipalDescarga) {
          alert('Por favor complete los campos requeridos');
          return;
        }
      } else {
        // Usar los mismos datos del registro original
        // PRIORIDAD: Obtener desde Firebase primero
        let registro = null;
        if (window.firebaseRepos?.trafico) {
          try {
            registro = await window.firebaseRepos.trafico.get(registroId);
            console.log('✅ Registro obtenido desde Firebase para "mismos datos"');
          } catch (e) {
            console.warn('⚠️ Error obteniendo registro desde Firebase:', e);
          }
        }

        // Fallback: Si no hay en Firebase, buscar en localStorage
        if (!registro) {
          const raw = localStorage.getItem('erp_shared_data');
          const parsed = raw ? JSON.parse(raw) : {};
          registro = parsed.trafico?.[registroId];
          if (registro) {
            console.log('✅ Registro obtenido desde localStorage (fallback)');
          }
        }

        if (registro) {
          datosDescarga.tractocamionDescarga = registro.economico || '';

          // Obtener nombres de operadores (asegurarnos de que sean nombres, no licencias)
          const operadorPrincipalRaw =
            registro.operadorprincipal || registro.operadorPrincipal || '';
          const operadorSecundarioRaw =
            registro.operadorsecundario || registro.operadorSecundario || '';

          datosDescarga.operadorPrincipalDescarga =
            await obtenerNombreOperadorDescarga(operadorPrincipalRaw);
          datosDescarga.operadorSecundarioDescarga =
            await obtenerNombreOperadorDescarga(operadorSecundarioRaw);

          console.log('✅ Datos copiados del registro original (mismos datos):', {
            tractocamion: datosDescarga.tractocamionDescarga,
            operadorPrincipal: datosDescarga.operadorPrincipalDescarga,
            operadorSecundario: datosDescarga.operadorSecundarioDescarga
          });
        } else if (window.__descargaData) {
          // Fallback: usar datos guardados en __descargaData
          datosDescarga.tractocamionDescarga = window.__descargaData.tractocamion || '';

          const operadorPrincipalRaw = window.__descargaData.operadorPrincipal || '';
          const operadorSecundarioRaw = window.__descargaData.operadorSecundario || '';

          datosDescarga.operadorPrincipalDescarga =
            await obtenerNombreOperadorDescarga(operadorPrincipalRaw);
          datosDescarga.operadorSecundarioDescarga =
            await obtenerNombreOperadorDescarga(operadorSecundarioRaw);

          console.log('✅ Datos copiados desde __descargaData (fallback):', {
            tractocamion: datosDescarga.tractocamionDescarga,
            operadorPrincipal: datosDescarga.operadorPrincipalDescarga,
            operadorSecundario: datosDescarga.operadorSecundarioDescarga
          });
        } else {
          console.warn('⚠️ No se encontró el registro original para copiar datos');
        }
      }

      // PRIORIDAD: Actualizar en Firebase primero (no bloqueante)
      let resultadoFirebase = false;
      if (window.firebaseRepos?.trafico) {
        try {
          const repo = window.firebaseRepos.trafico;
          console.log('💾 Actualizando descarga en Firebase...', {
            registroId,
            datosDescarga
          });

          // Obtener el registro actual desde Firebase
          const registroActual = await repo.get(registroId);

          if (registroActual) {
            // Remover campos internos que no deben guardarse
            const { id, ...registroLimpio } = registroActual;

            // IMPORTANTE: Preservar TODOS los campos existentes del registro
            // Solo agregar/actualizar los campos de descarga sin eliminar otros campos
            const datosActualizados = {
              ...registroLimpio, // Preservar todos los campos existentes
              ...datosDescarga, // Agregar/sobrescribir solo campos de descarga
              fechaActualizacion: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            // Asegurar que campos críticos no se pierdan (si existen en el registro original)
            // Si no están en datosDescarga, mantener los valores originales
            if (!datosDescarga.plataforma && registroLimpio.plataforma) {
              datosActualizados.plataforma = registroLimpio.plataforma;
            }
            if (!datosDescarga.plataformaServicio && registroLimpio.plataformaServicio) {
              datosActualizados.plataformaServicio = registroLimpio.plataformaServicio;
            }
            if (!datosDescarga.placasPlataforma && registroLimpio.placasPlataforma) {
              datosActualizados.placasPlataforma = registroLimpio.placasPlataforma;
            }
            if (!datosDescarga.origen && registroLimpio.origen) {
              datosActualizados.origen = registroLimpio.origen;
            }
            if (!datosDescarga.destino && registroLimpio.destino) {
              datosActualizados.destino = registroLimpio.destino;
            }
            if (!datosDescarga.lugarOrigen && registroLimpio.lugarOrigen) {
              datosActualizados.lugarOrigen = registroLimpio.lugarOrigen;
            }
            if (!datosDescarga.lugarDestino && registroLimpio.lugarDestino) {
              datosActualizados.lugarDestino = registroLimpio.lugarDestino;
            }
            if (!datosDescarga.cliente && registroLimpio.cliente) {
              datosActualizados.cliente = registroLimpio.cliente;
            }
            if (!datosDescarga.rfcCliente && registroLimpio.rfcCliente) {
              datosActualizados.rfcCliente = registroLimpio.rfcCliente;
            }

            console.log('📝 Datos a guardar en Firebase:', {
              registroId,
              camposDescarga: datosDescarga,
              camposPreservados: {
                plataforma: datosActualizados.plataforma,
                plataformaServicio: datosActualizados.plataformaServicio,
                placasPlataforma: datosActualizados.placasPlataforma,
                origen: datosActualizados.origen,
                destino: datosActualizados.destino
              },
              datosCompletos: datosActualizados
            });

            // Limpiar cache de escrituras para forzar la actualización
            if (window.FirebaseWriteCache) {
              window.FirebaseWriteCache.cache.delete(`trafico/${registroId}`);
              console.log('🧹 Cache de escrituras limpiado para forzar actualización');
            }

            // Agregar un timestamp único para forzar la actualización
            // Esto asegura que la comparación de datos detecte cambios
            datosActualizados._forceUpdate = Date.now();

            // Usar saveRegistro para asegurar que se guarde correctamente
            const resultadoSave = await repo.saveRegistro(registroId, datosActualizados);

            // Remover el campo temporal después de guardar
            if (datosActualizados._forceUpdate) {
              delete datosActualizados._forceUpdate;
            }

            if (resultadoSave) {
              console.log('✅ Descarga actualizada en Firebase:', registroId);
              console.log('✅ Campos de descarga guardados:', Object.keys(datosDescarga));
              resultadoFirebase = true;
            } else {
              console.warn(
                '⚠️ No se pudo actualizar descarga en Firebase, continuando con localStorage'
              );
            }
          } else {
            console.warn('⚠️ Registro no encontrado en Firebase, intentando crear...');
            // Si no existe, crear uno nuevo con los datos de descarga
            const datosNuevoRegistro = {
              tipo: 'registro',
              numeroRegistro: registroId,
              ...datosDescarga,
              fechaCreacion: new Date().toISOString(),
              fechaActualizacion: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            console.log('📝 Creando nuevo registro en Firebase:', {
              registroId,
              datos: datosNuevoRegistro
            });

            const resultadoSave = await repo.saveRegistro(registroId, datosNuevoRegistro);

            if (resultadoSave) {
              console.log('✅ Registro de descarga creado en Firebase:', registroId);
              resultadoFirebase = true;
            } else {
              console.warn(
                '⚠️ No se pudo crear registro en Firebase, continuando con localStorage'
              );
            }
          }
        } catch (error) {
          // Si es error de cuota, no es crítico, continuar con localStorage
          if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
            console.warn(
              '⚠️ Cuota de Firebase excedida, guardando solo en localStorage:',
              registroId
            );
          } else {
            console.error('❌ Error actualizando descarga en Firebase:', error);
            console.error('❌ Stack trace:', error.stack);
          }
          // Continuar de todas formas con localStorage
        }
      } else {
        console.warn('⚠️ Firebase no está disponible, usando solo localStorage');
      }

      // RESPALDO: Actualizar también en localStorage
      try {
        const raw = localStorage.getItem('erp_shared_data');
        const parsed = raw ? JSON.parse(raw) : {};

        if (!parsed.trafico) {
          parsed.trafico = {};
        }

        if (!parsed.trafico[registroId]) {
          parsed.trafico[registroId] = {};
        }

        // Actualizar registro con datos de descarga
        Object.assign(parsed.trafico[registroId], datosDescarga);
        localStorage.setItem('erp_shared_data', JSON.stringify(parsed));
        console.log('✅ Descarga actualizada en localStorage (respaldo)');
      } catch (error) {
        console.warn('⚠️ Error actualizando descarga en localStorage:', error);
      }

      // Cerrar modal
      const modalElement = document.getElementById('modalDescargaPlataforma');
      if (modalElement) {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          } else {
            // Si no hay instancia, intentar cerrar manualmente
            modalElement.style.display = 'none';
            modalElement.classList.remove('show');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
              backdrop.remove();
            }
          }
        } else {
          // Fallback: cerrar modal manualmente
          modalElement.style.display = 'none';
          modalElement.classList.remove('show');
          const backdrop = document.querySelector('.modal-backdrop');
          if (backdrop) {
            backdrop.remove();
          }
          console.warn('⚠️ Modal cerrado manualmente (Bootstrap no disponible)');
        }
      }

      // Actualizar tabla para reflejar el cambio de estado
      setTimeout(() => {
        if (typeof window.cargarRegistrosTraficoConFiltro === 'function') {
          window.cargarRegistrosTraficoConFiltro();
        } else if (typeof window.cargarRegistrosTrafico === 'function') {
          window.cargarRegistrosTrafico();
        }
      }, 500);

      // Mostrar mensaje de éxito
      if (resultadoFirebase) {
        alert(
          `✅ Descarga registrada exitosamente para ${registroId}\n\nEl estado ha sido actualizado a "Descargado" y sincronizado con Firebase.`
        );
      } else {
        alert(
          `✅ Descarga registrada exitosamente para ${registroId}\n\nEl estado ha sido actualizado a "Descargado" y guardado localmente.\n\nNota: No se pudo sincronizar con Firebase (posible cuota excedida). Los datos están guardados en localStorage y se sincronizarán cuando Firebase esté disponible.`
        );
      }
    } catch (error) {
      console.error('❌ Error en confirmarDescarga:', error);
      console.error('❌ Stack trace:', error.stack);
      alert(
        `❌ Error al confirmar la descarga: ${error.message || 'Error desconocido'}\n\nPor favor, intente nuevamente.`
      );
    }
  };
})();
