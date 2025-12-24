/**
 * Ejemplos de uso de las optimizaciones de rendimiento
 * Este archivo muestra cómo usar las nuevas funcionalidades
 */

// ===== EJEMPLO 1: Usar consultas optimizadas con límite =====
async function ejemploConsultaOptimizada() {
  // Obtener solo los primeros 20 registros (más rápido)
  const registros = await window.firebaseRepos.trafico.getAll({
    limit: 20,
    useCache: true
  });

  console.log(`Cargados ${registros.length} registros`);
}

// ===== EJEMPLO 2: Usar paginación =====
async function ejemploPaginacion() {
  const pageSize = 50;
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const registros = await window.firebaseRepos.trafico.getAll({
      limit: pageSize,
      page: page,
      useCache: true
    });

    console.log(`Página ${page}: ${registros.length} registros`);

    // Procesar registros...

    if (registros.length < pageSize) {
      hasMore = false;
    } else {
      page++;
    }
  }
}

// ===== EJEMPLO 3: Usar el optimizador directamente =====
async function ejemploOptimizadorDirecto() {
  if (!window.FirebaseQueryOptimizer) {
    console.warn('Optimizador no disponible');
    return;
  }

  // Obtener registros limitados con caché
  const registros = await window.FirebaseQueryOptimizer.getLimited(window.firebaseRepos.trafico, {
    limit: 30,
    useCache: true,
    orderBy: 'fechaCreacion',
    orderDirection: 'desc'
  });

  console.log(`Registros optimizados: ${registros.length}`);
}

// ===== EJEMPLO 4: Invalidar caché cuando se actualiza un registro =====
async function ejemploInvalidarCache() {
  // Guardar un nuevo registro
  await window.firebaseRepos.trafico.saveRegistro('2500001', {
    // datos del registro
  });

  // Invalidar el caché para que la próxima consulta obtenga datos frescos
  if (window.FirebaseQueryOptimizer) {
    window.FirebaseQueryOptimizer.invalidateCache('trafico');
  }
}

// ===== EJEMPLO 5: Cargar módulos bajo demanda =====
async function ejemploCargaModulo() {
  if (!window.CodeSplitLoader) {
    console.warn('CodeSplitLoader no disponible');
    return;
  }

  // Cargar un módulo solo cuando se necesite
  await window.CodeSplitLoader.loadModule('../assets/scripts/trafico/export-utils.js', {
    priority: 'normal'
  });

  // Ahora el módulo está disponible
  if (window.exportarTraficoExcel) {
    window.exportarTraficoExcel();
  }
}

// ===== EJEMPLO 6: Precargar módulos de una página =====
async function ejemploPrecargarPagina() {
  if (!window.CodeSplitLoader) {
    return;
  }

  // Precargar módulos de tráfico en segundo plano
  await window.CodeSplitLoader.loadPageModules('trafico');
  console.log('Módulos de tráfico precargados');
}

// ===== EJEMPLO 7: Obtener estadísticas de rendimiento =====
function ejemploEstadisticas() {
  const stats = window.PerformanceOptimizations?.getStats();

  if (stats) {
    console.log('📊 Estadísticas de rendimiento:');
    console.log('Cache de consultas:', stats.queryCache);
    console.log('Code Splitting:', stats.codeSplit);
    console.log('Carga inicial:', stats.initialLoad);
  }
}

// ===== EJEMPLO 8: Actualizar registros-loader.js para usar consultas optimizadas =====
/*
// En registros-loader.js, cambiar de:
const registros = await window.firebaseRepos.trafico.getAllRegistros();

// A:
const registros = await window.firebaseRepos.trafico.getAllRegistros({
    limit: 50, // Cargar solo los primeros 50
    useCache: true
});

// O para cargar todos pero con caché:
const registros = await window.firebaseRepos.trafico.getAllRegistros({
    useCache: true
});
*/

// Exportar ejemplos para uso en consola
window.PerformanceExamples = {
  consultaOptimizada: ejemploConsultaOptimizada,
  paginacion: ejemploPaginacion,
  optimizadorDirecto: ejemploOptimizadorDirecto,
  invalidarCache: ejemploInvalidarCache,
  cargarModulo: ejemploCargaModulo,
  precargarPagina: ejemploPrecargarPagina,
  estadisticas: ejemploEstadisticas
};

console.log(
  '✅ Ejemplos de optimización cargados. Usa window.PerformanceExamples para ver ejemplos.'
);
