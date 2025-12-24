// Función para verificar qué tractocamiones están realmente configurados
window.verificarTractocamionesConfiguracion = function () {
  console.log('🔍 === VERIFICANDO TRACTOCAMIONES EN CONFIGURACIÓN ===');

  try {
    // 1. Verificar localStorage
    const economicosData = localStorage.getItem('erp_economicos');
    if (economicosData) {
      const economicos = JSON.parse(economicosData);
      console.log('📊 Económicos en localStorage:', economicos);

      if (Array.isArray(economicos)) {
        console.log('📋 Lista de tractocamiones:');
        economicos.forEach((economico, index) => {
          if (economico && economico.numero) {
            console.log(
              `${index + 1}. Económico: ${economico.numero} - ${economico.placaTracto || 'Sin placa'} - ${economico.marca || 'Sin marca'}`
            );
          } else {
            console.log(`${index + 1}. [NULL/INVÁLIDO]`);
          }
        });
      }
    } else {
      console.log('❌ No hay datos de económicos en localStorage');
    }

    // 2. Verificar configuracionManager
    if (
      window.configuracionManager &&
      typeof window.configuracionManager.getEconomicos === 'function'
    ) {
      const economicosConfig = window.configuracionManager.getEconomicos();
      console.log('📊 Económicos en configuracionManager:', economicosConfig);

      if (Array.isArray(economicosConfig)) {
        console.log('📋 Lista desde configuracionManager:');
        economicosConfig.forEach((economico, index) => {
          if (economico && economico.numero) {
            console.log(
              `Config ${index + 1}. Económico: ${economico.numero} - ${economico.placaTracto || 'Sin placa'}`
            );
          }
        });
      }
    } else {
      console.log('❌ configuracionManager no disponible');
    }

    // 3. Verificar caché Firestore
    if (window.__economicosCache) {
      console.log('📊 Económicos en caché Firestore:', window.__economicosCache);

      if (Array.isArray(window.__economicosCache)) {
        console.log('📋 Lista desde caché:');
        window.__economicosCache.forEach((economico, index) => {
          if (economico && economico.numero) {
            console.log(
              `Cache ${index + 1}. Económico: ${economico.numero} - ${economico.placaTracto || 'Sin placa'}`
            );
          }
        });
      }
    } else {
      console.log('❌ No hay caché de Firestore');
    }

    console.log('🔍 === FIN VERIFICACIÓN ===');
  } catch (error) {
    console.error('❌ Error verificando tractocamiones:', error);
  }
};

console.log('✅ Función verificada: window.verificarTractocamionesConfiguracion()');
