/**
 * Script para forzar la carga de registros de logística
 * Ejecutar en la consola del navegador después de actualizar el tenantId
 */

(async function() {
    console.log('🔄 Iniciando carga forzada de registros...');
    
    // 1. Verificar que Firebase esté disponible
    if (!window.firebaseDb || !window.fs) {
        console.error('❌ Firebase no está disponible');
        return;
    }
    
    // 2. Esperar a que los repositorios estén disponibles
    let intentos = 0;
    while (!window.firebaseRepos && intentos < 30) {
        await new Promise(resolve => setTimeout(resolve, 200));
        intentos++;
    }
    
    if (!window.firebaseRepos) {
        console.error('❌ Repositorios no disponibles después de esperar');
        console.log('💡 Intentando cargar firebase-repos.js manualmente...');
        
        // Intentar cargar el script manualmente
        const script = document.createElement('script');
        script.src = '../assets/scripts/firebase-repos.js';
        await new Promise((resolve, reject) => {
            script.onload = () => {
                setTimeout(resolve, 1000); // Esperar a que se inicialice
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // 3. Verificar repositorio de logística
    const repo = window.firebaseRepos?.logistica;
    if (!repo) {
        console.error('❌ Repositorio de logística no disponible');
        return;
    }
    
    console.log('📊 Estado del repositorio:', {
        db: !!repo.db,
        tenantId: repo.tenantId,
        userId: repo.userId,
        initialized: repo._initialized
    });
    
    // 4. Forzar re-inicialización si es necesario
    if (!repo.db || !repo.tenantId || repo.tenantId !== 'demo_tenant') {
        console.log('🔄 Re-inicializando repositorio...');
        repo._initialized = false;
        repo._initPromise = null;
        repo.tenantId = 'demo_tenant'; // Forzar tenantId
        
        if (typeof repo.init === 'function') {
            try {
                await repo.init();
                console.log('✅ Repositorio re-inicializado');
            } catch (error) {
                console.error('❌ Error re-inicializando repositorio:', error);
                return;
            }
        }
    }
    
    // 5. Intentar cargar registros
    console.log('📋 Intentando cargar registros desde Firebase...');
    try {
        const registros = await repo.getAllRegistros();
        console.log(`✅ ${registros.length} registros cargados desde Firebase`);
        
        if (registros.length > 0) {
            console.log('📋 Registros encontrados:');
            registros.forEach(reg => {
                console.log(`  - ${reg.numeroRegistro || reg.id}: tenantId=${reg.tenantId || 'N/A'}`);
            });
        } else {
            console.log('⚠️ No hay registros en Firebase');
        }
        
        // 6. Si la función cargarRegistrosLogistica está disponible, llamarla
        if (typeof window.cargarRegistrosLogistica === 'function') {
            console.log('🔄 Llamando a cargarRegistrosLogistica...');
            await window.cargarRegistrosLogistica();
            console.log('✅ cargarRegistrosLogistica completado');
        } else {
            console.warn('⚠️ Función cargarRegistrosLogistica no disponible');
        }
        
    } catch (error) {
        console.error('❌ Error cargando registros:', error);
    }
    
    console.log('✅ Proceso completado');
})();

