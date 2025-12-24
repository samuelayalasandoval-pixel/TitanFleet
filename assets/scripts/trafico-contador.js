/**
 * Script simple para manejar el contador de pendientes en Tráfico
 * Este script se carga temprano y define funciones globales
 */

(function () {
  'use strict';

  console.log('📊 Cargando trafico-contador.js');

  /**
   * Actualizar contador de pendientes
   */
  // Variable para controlar la verbosidad de warnings
  let contadorWarningMostrado = false;

  window.actualizarContadorPendientes = async function () {
    try {
      // Verificar que el usuario esté autenticado
      if (!window.firebaseAuth || !window.firebaseAuth.currentUser) {
        // Solo mostrar warning una vez para reducir ruido
        if (!contadorWarningMostrado) {
          console.debug(
            'ℹ️ Usuario no autenticado aún, no se puede actualizar contador de pendientes (normal durante carga inicial)'
          );
          contadorWarningMostrado = true;
        }
        // Mostrar 0 en el contador si no hay autenticación
        const contador = document.getElementById('contadorPendientesTrafico');
        if (contador) {
          contador.textContent = '0';
        }
        return;
      }

      // Resetear flag si el usuario está autenticado
      contadorWarningMostrado = false;

      console.log('🔄 Actualizando contador de pendientes...');

      // Intentar usar repositorios de Firebase primero
      if (window.firebaseRepos?.logistica && window.firebaseRepos?.trafico) {
        try {
          // Asegurar que los repositorios estén inicializados
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.logistica.db || !window.firebaseRepos.logistica.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 200));
            await window.firebaseRepos.logistica.init();
          }

          attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.trafico.db || !window.firebaseRepos.trafico.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 200));
            await window.firebaseRepos.trafico.init();
          }

          if (
            window.firebaseRepos.logistica.db &&
            window.firebaseRepos.logistica.tenantId &&
            window.firebaseRepos.trafico.db &&
            window.firebaseRepos.trafico.tenantId
          ) {
            // Obtener registros de logística (solo activos, no eliminados)
            const registrosLogistica = await window.firebaseRepos.logistica.getAllRegistros();
            console.log(`📊 Registros de logística obtenidos: ${registrosLogistica.length}`);

            // Extraer IDs de logística - convertir a string para comparación consistente
            const idsLogistica = new Set();
            registrosLogistica.forEach(r => {
              const id = String(r.numeroRegistro || r.id || r.registroId || '').trim();
              if (id) {
                idsLogistica.add(id);
              }
            });
            console.log(
              `📊 IDs únicos de logística: ${idsLogistica.size}`,
              Array.from(idsLogistica).slice(0, 5)
            );

            // Obtener registros de tráfico (solo activos, no eliminados)
            const registrosTrafico = await window.firebaseRepos.trafico.getAllRegistros();
            console.log(`📊 Registros de tráfico obtenidos: ${registrosTrafico.length}`);

            // Extraer IDs de tráfico - convertir a string para comparación consistente
            const idsTrafico = new Set();
            registrosTrafico.forEach(r => {
              const id = String(r.numeroRegistro || r.id || r.registroId || '').trim();
              if (id) {
                idsTrafico.add(id);
              }
            });
            console.log(
              `📊 IDs únicos de tráfico: ${idsTrafico.size}`,
              Array.from(idsTrafico).slice(0, 5)
            );

            // Calcular pendientes: registros en logística que NO están en tráfico
            const pendientes = registrosLogistica.filter(r => {
              const id = String(r.numeroRegistro || r.id || r.registroId || '').trim();
              return id && !idsTrafico.has(id);
            });

            const pendientesCount = pendientes.length;

            console.log(
              `📊 Pendientes: ${pendientesCount} (Logística: ${idsLogistica.size}, Tráfico: ${idsTrafico.size})`
            );
            if (pendientesCount > 0) {
              console.log(
                '📋 IDs pendientes:',
                pendientes
                  .map(r => String(r.numeroRegistro || r.id || r.registroId || '').trim())
                  .slice(0, 5)
              );
            }

            // Actualizar contador en pantalla
            const contador = document.getElementById('contadorPendientesTrafico');
            if (contador) {
              contador.textContent = pendientesCount;
              contador.className = `badge ms-1 ${pendientesCount > 0 ? 'bg-warning' : 'bg-success'}`;
            }

            return pendientesCount;
          }
        } catch (repoError) {
          console.warn(
            '⚠️ Error usando repositorios de Firebase, intentando método alternativo:',
            repoError
          );
        }
      }

      // Fallback: usar Firebase directamente si los repositorios no están disponibles
      if (window.firebaseDb && window.fs) {
        try {
          console.log('🔄 Usando Firebase directo como fallback...');

          // Obtener registros de logística (filtrar eliminados)
          const logisticaRef = window.fs.collection(window.firebaseDb, 'logistica');
          const logisticaQuery = window.fs.query(
            logisticaRef,
            window.fs.where('deleted', '==', false)
          );
          const logisticaSnapshot = await window.fs.getDocs(logisticaQuery);

          // Extraer IDs de logística
          const idsLogistica = new Set();
          logisticaSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const id = String(data.numeroRegistro || data.registroId || doc.id || '').trim();
            if (id) {
              idsLogistica.add(id);
            }
          });

          // Obtener registros de tráfico (filtrar eliminados)
          const traficoRef = window.fs.collection(window.firebaseDb, 'trafico');
          const traficoQuery = window.fs.query(traficoRef, window.fs.where('deleted', '==', false));
          const traficoSnapshot = await window.fs.getDocs(traficoQuery);

          // Extraer IDs de tráfico
          const idsTrafico = new Set();
          traficoSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const id = String(data.numeroRegistro || data.registroId || doc.id || '').trim();
            if (id) {
              idsTrafico.add(id);
            }
          });

          // Calcular pendientes: registros en logística que NO están en tráfico
          const pendientes = Array.from(idsLogistica).filter(id => !idsTrafico.has(id)).length;

          console.log(
            `📊 Pendientes (fallback Firebase directo): ${pendientes} (Logística: ${idsLogistica.size}, Tráfico: ${idsTrafico.size})`
          );

          // Actualizar contador en pantalla
          const contador = document.getElementById('contadorPendientesTrafico');
          if (contador) {
            contador.textContent = pendientes;
            contador.className = `badge ms-1 ${pendientes > 0 ? 'bg-warning' : 'bg-success'}`;
          }

          return pendientes;
        } catch (error) {
          console.warn('⚠️ Error en fallback de Firebase directo:', error);
        }
      }

      console.debug('ℹ️ Firebase no disponible aún (normal durante carga inicial)');
      return 0;
    } catch (error) {
      console.error('❌ Error actualizando contador:', error);
      return 0;
    }
  };

  // Alias para compatibilidad
  window.actualizarContador = window.actualizarContadorPendientes;

  console.log('✅ trafico-contador.js cargado');
})();
