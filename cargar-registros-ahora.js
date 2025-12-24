/**
 * Script para cargar registros de logística ahora que el repositorio está inicializado
 * Ejecutar en la consola del navegador
 */

(async function() {
    console.log('📋 === CARGANDO REGISTROS DE LOGÍSTICA ===');
    
    const repo = window.firebaseRepos?.logistica;
    if (!repo) {
        console.error('❌ Repositorio de logística no disponible');
        return;
    }
    
    console.log('✅ Repositorio disponible');
    console.log('📊 Estado:', {
        db: !!repo.db,
        tenantId: repo.tenantId,
        userId: repo.userId
    });
    
    // 1. Intentar cargar registros desde Firebase
    console.log('📋 Cargando registros desde Firebase...');
    try {
        const registros = await repo.getAllRegistros();
        console.log(`✅ ${registros.length} registros encontrados en Firebase`);
        
        if (registros.length > 0) {
            console.log('📋 Registros:');
            registros.forEach((reg, index) => {
                console.log(`  ${index + 1}. ${reg.numeroRegistro || reg.id}:`, {
                    tenantId: reg.tenantId || 'N/A',
                    tipo: reg.tipo || 'N/A',
                    cliente: reg.cliente || 'N/A'
                });
            });
            
            // 2. Llamar a la función de carga
            if (typeof window.cargarRegistrosLogistica === 'function') {
                console.log('🔄 Llamando a cargarRegistrosLogistica...');
                await window.cargarRegistrosLogistica();
                console.log('✅ cargarRegistrosLogistica completado');
            } else {
                console.warn('⚠️ Función cargarRegistrosLogistica no disponible');
                console.log('💡 Intentando cargar registros directamente...');
                
                // Intentar cargar el script si no está disponible
                const script = document.createElement('script');
                script.src = '../assets/scripts/logistica/registros-loader.js';
                await new Promise((resolve, reject) => {
                    script.onload = () => setTimeout(resolve, 1000);
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
                
                if (typeof window.cargarRegistrosLogistica === 'function') {
                    await window.cargarRegistrosLogistica();
                    console.log('✅ Registros cargados después de cargar script');
                }
            }
        } else {
            console.log('⚠️ No hay registros en Firebase');
            console.log('💡 Verificando si hay registros en localStorage...');
            
            // Verificar localStorage
            const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
            const registrosLocal = sharedData.registros || {};
            const registrosArray = Object.values(registrosLocal).filter(r => r !== null && r !== undefined);
            
            console.log(`📋 ${registrosArray.length} registros en localStorage`);
            
            if (registrosArray.length > 0) {
                // Filtrar por tenantId
                const tenantId = repo.tenantId;
                const registrosFiltrados = registrosArray.filter(reg => {
                    return reg.tenantId === tenantId || (!reg.tenantId && tenantId === 'demo_tenant');
                });
                
                console.log(`📋 ${registrosFiltrados.length} registros después de filtrar por tenantId (${tenantId})`);
                
                if (registrosFiltrados.length > 0) {
                    console.log('💡 Hay registros en localStorage pero no en Firebase');
                    console.log('💡 Esto puede significar que los registros no se han sincronizado con Firebase');
                }
            }
        }
    } catch (error) {
        console.error('❌ Error cargando registros:', error);
        console.error('Stack:', error.stack);
    }
    
    console.log('✅ === PROCESO COMPLETADO ===');
})();

