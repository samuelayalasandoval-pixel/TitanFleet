/**
 * Script para manejar el contador de pendientes en Facturación
 * Lógica: Tráfico - Facturación = Pendientes
 */

(function () {
  'use strict';

  console.log('📊 Cargando facturacion-contador.js');

  // Control de verbosidad de warnings
  let warningReposMostrado = false;
  let warningFirebaseMostrado = false;

  /**
   * Actualizar contador de pendientes en Facturación
   */
  window.actualizarContadorPendientesFacturacion = async function () {
    try {
      // Resetear flags si el usuario está autenticado
      if (window.firebaseAuth?.currentUser) {
        warningReposMostrado = false;
        warningFirebaseMostrado = false;
      }

      console.log('🔄 Actualizando contador de pendientes Facturación...');

      // Intentar usar repositorios de Firebase primero
      if (window.firebaseRepos?.trafico && window.firebaseRepos?.facturacion) {
        try {
          // Asegurar que los repositorios estén inicializados
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.trafico.db || !window.firebaseRepos.trafico.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 200));
            await window.firebaseRepos.trafico.init();
          }

          attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.facturacion.db || !window.firebaseRepos.facturacion.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 200));
            await window.firebaseRepos.facturacion.init();
          }

          if (
            window.firebaseRepos.trafico.db &&
            window.firebaseRepos.trafico.tenantId &&
            window.firebaseRepos.facturacion.db &&
            window.firebaseRepos.facturacion.tenantId
          ) {
            // Obtener registros de tráfico (solo activos, no eliminados)
            console.log('📊 Obteniendo registros de Tráfico...');
            const registrosTrafico = await window.firebaseRepos.trafico.getAllRegistros();
            console.log(`📊 Registros de Tráfico obtenidos: ${registrosTrafico.length}`);

            // Extraer IDs de tráfico - intentar múltiples campos
            const idsTrafico = new Set();
            registrosTrafico.forEach(r => {
              const id = r.numeroRegistro || r.id || r.registroId || r.numeroRegistroTrafico;
              if (id) {
                idsTrafico.add(String(id));
              }
            });
            console.log(
              `📊 IDs únicos de Tráfico: ${idsTrafico.size}`,
              Array.from(idsTrafico).slice(0, 5)
            );

            // Obtener registros de facturación (solo activos, no eliminados)
            console.log('📊 Obteniendo registros de Facturación...');
            const registrosFacturacion = await window.firebaseRepos.facturacion.getAllRegistros();
            console.log(`📊 Registros de Facturación obtenidos: ${registrosFacturacion.length}`);

            // Extraer IDs de facturación - intentar múltiples campos
            const idsFacturacion = new Set();
            registrosFacturacion.forEach(r => {
              const id = r.numeroRegistro || r.id || r.registroId || r.numeroRegistroFacturacion;
              if (id) {
                idsFacturacion.add(String(id));
              }
            });
            console.log(
              `📊 IDs únicos de Facturación: ${idsFacturacion.size}`,
              Array.from(idsFacturacion).slice(0, 5)
            );

            // Calcular pendientes: registros en tráfico que NO están en facturación
            const pendientes = registrosTrafico.filter(r => {
              const id = String(
                r.numeroRegistro || r.id || r.registroId || r.numeroRegistroTrafico || ''
              );
              return id && !idsFacturacion.has(id);
            });

            const pendientesCount = pendientes.length;

            console.log(
              `📊 Pendientes Facturación: ${pendientesCount} (Tráfico: ${idsTrafico.size}, Facturación: ${idsFacturacion.size})`
            );

            // Log detallado si hay pendientes
            if (pendientesCount > 0) {
              console.log(
                '📋 IDs pendientes:',
                pendientes.slice(0, 10).map(r => r.numeroRegistro || r.id || r.registroId)
              );
            }

            // Actualizar contador en pantalla
            const contador = document.getElementById('contadorPendientesFacturacion');
            if (contador) {
              contador.textContent = pendientesCount;
              contador.className = `badge ms-1 ${pendientesCount > 0 ? 'bg-warning' : 'bg-success'}`;
            } else {
              console.warn('⚠️ Elemento contadorPendientesFacturacion no encontrado en el DOM');
            }

            return pendientesCount;
          }
          console.warn('⚠️ Repositorios no inicializados correctamente');
        } catch (repoError) {
          console.error('❌ Error usando repositorios de Firebase:', repoError);
          console.warn('⚠️ Intentando método alternativo...');
        }
      } else if (!warningReposMostrado) {
        console.debug('⚠️ Repositorios de Firebase no disponibles');
        warningReposMostrado = true;
      }

      // Fallback: usar Firebase directamente si los repositorios no están disponibles
      if (typeof firebase !== 'undefined' && firebase.firestore) {
        console.log('📊 Usando método fallback con Firebase directo...');
        const db = firebase.firestore();

        // Obtener tenantId del usuario actual
        const currentUser = JSON.parse(localStorage.getItem('erpCurrentUser') || '{}');
        const tenantId = currentUser.tenantId || window.DEMO_CONFIG?.tenantId || 'demo_tenant';

        // Obtener registros de tráfico (filtrar eliminados y por tenantId)
        const traficoSnapshot = await db
          .collection('trafico')
          .where('tenantId', '==', tenantId)
          .where('deleted', '==', false)
          .get();

        const traficoDocs = traficoSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const idsTrafico = new Set(
          traficoDocs.map(r => String(r.numeroRegistro || r.id || r.registroId || ''))
        );

        // Obtener registros de facturación (filtrar eliminados y por tenantId)
        const facturacionSnapshot = await db
          .collection('facturacion')
          .where('tenantId', '==', tenantId)
          .where('deleted', '==', false)
          .get();

        const facturacionDocs = facturacionSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        const idsFacturacion = new Set(
          facturacionDocs.map(r => String(r.numeroRegistro || r.id || r.registroId || ''))
        );

        // Calcular pendientes: IDs en tráfico que NO están en facturación
        const pendientes = Array.from(idsTrafico).filter(id => id && !idsFacturacion.has(id));
        const pendientesCount = pendientes.length;

        console.log(
          `📊 Pendientes Facturación (fallback): ${pendientesCount} (Tráfico: ${idsTrafico.size}, Facturación: ${idsFacturacion.size})`
        );

        // Actualizar contador en pantalla
        const contador = document.getElementById('contadorPendientesFacturacion');
        if (contador) {
          contador.textContent = pendientesCount;
          contador.className = `badge ms-1 ${pendientesCount > 0 ? 'bg-warning' : 'bg-success'}`;
        }

        return pendientesCount;
      }

      if (!warningFirebaseMostrado) {
        console.debug('⚠️ Firebase no disponible aún');
        warningFirebaseMostrado = true;
      }

      // Actualizar contador a 0 si no hay Firebase
      const contador = document.getElementById('contadorPendientesFacturacion');
      if (contador) {
        contador.textContent = '0';
        contador.className = 'badge ms-1 bg-secondary';
      }

      return 0;
    } catch (error) {
      console.error('❌ Error actualizando contador Facturación:', error);
      return 0;
    }
  };

  console.log('✅ facturacion-contador.js cargado');
})();
