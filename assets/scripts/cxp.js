// ===== SISTEMA DE CUENTAS POR PAGAR (CXP) =====

// Variables globales
let facturasCXP = [];
let solicitudesPago = [];
let facturasFiltradas = [];
let solicitudesFiltradas = [];
let editingFacturaId = null;
let _editingSolicitudId = null;
let procesandoFactura = false; // Bandera para evitar ejecuciones simultáneas

// ===== FUNCIONES PARA MANEJO DE IDs PROBLEMÁTICOS =====

/**
 * Obtiene la lista de IDs problemáticos desde localStorage
 * @returns {Array<string>} Lista de IDs problemáticos
 */
function _getIdsProblematicosCXP() {
  try {
    const guardados = localStorage.getItem('cxp_ids_problematicos');
    if (guardados) {
      return JSON.parse(guardados);
    }
  } catch (e) {
    console.warn('⚠️ Error cargando IDs problemáticos de CXP:', e);
  }
  // No retornar valores hardcodeados por defecto - solo usar localStorage
  // Si necesitas agregar IDs problemáticos, usa agregarIdProblematicoCXP()
  return [];
}

/**
 * Verifica si un ID es problemático
 * @param {string} id - ID a verificar
 * @returns {boolean} true si el ID es problemático, false en caso contrario
 */
function esIdProblematicoCXP(id) {
  if (!id || typeof id !== 'string') {
    return false;
  }

  const idsProblematicos = _getIdsProblematicosCXP();
  const idStr = String(id || '').trim();

  // Verificar si el ID está en la lista de problemáticos
  return idsProblematicos.some(problema => {
    const problemaStr = String(problema || '').trim();
    return (
      idStr === problemaStr ||
      idStr === `factura_${problemaStr}` ||
      problemaStr === `factura_${idStr}` ||
      idStr.includes(problemaStr) ||
      problemaStr.includes(idStr)
    );
  });
}

// Exponer función globalmente para que esté disponible en todos los contextos
window.esIdProblematicoCXP = esIdProblematicoCXP;

/**
 * Agrega un ID a la lista de IDs problemáticos
 * @param {string} id - ID problemático a agregar
 */
function agregarIdProblematicoCXP(id) {
  if (!id || typeof id !== 'string') {
    return;
  }

  try {
    const idsProblematicos = _getIdsProblematicosCXP();
    const idStr = String(id).trim();

    // Agregar el ID si no está ya en la lista
    if (!idsProblematicos.includes(idStr)) {
      idsProblematicos.push(idStr);
      localStorage.setItem('cxp_ids_problematicos', JSON.stringify(idsProblematicos));
      console.log(`✅ ID problemático agregado: ${idStr}`);
    }
  } catch (e) {
    console.error('❌ Error agregando ID problemático:', e);
  }
}

// Exponer función globalmente para que esté disponible en todos los contextos
window.agregarIdProblematicoCXP = agregarIdProblematicoCXP;

/**
 * Remueve un ID de la lista de IDs problemáticos
 * @param {string} id - ID a remover de la lista de problemáticos
 */
function removerIdProblematicoCXP(id) {
  if (!id || typeof id !== 'string') {
    console.warn('⚠️ ID inválido para remover de problemáticos:', id);
    return false;
  }

  try {
    const idsProblematicos = _getIdsProblematicosCXP();
    const idStr = String(id).trim();

    // Remover todas las variantes del ID
    const idsParaRemover = [idStr, `factura_${idStr}`, idStr.replace('factura_', '')];

    let removido = false;
    idsParaRemover.forEach(idVariant => {
      const index = idsProblematicos.indexOf(idVariant);
      if (index !== -1) {
        idsProblematicos.splice(index, 1);
        removido = true;
        console.log(`✅ ID problemático removido: ${idVariant}`);
      }
    });

    if (removido) {
      localStorage.setItem('cxp_ids_problematicos', JSON.stringify(idsProblematicos));
      console.log(
        `✅ Lista de IDs problemáticos actualizada. Total restante: ${idsProblematicos.length}`
      );
      return true;
    }
    console.log(`ℹ️ El ID ${idStr} no estaba en la lista de problemáticos`);
    return false;
  } catch (e) {
    console.error('❌ Error removiendo ID problemático:', e);
    return false;
  }
}

// Exponer función globalmente
window.removerIdProblematicoCXP = removerIdProblematicoCXP;

/**
 * Lista todos los IDs problemáticos actuales
 * @returns {Array<string>} Array de IDs problemáticos
 */
function listarIdsProblematicosCXP() {
  const ids = _getIdsProblematicosCXP();
  console.log('📋 IDs problemáticos actuales:', ids);
  console.log(`   Total: ${ids.length} ID(s)`);
  if (ids.length > 0) {
    ids.forEach((id, _index) => {
      console.log(`   ${_index + 1}. ${id}`);
    });
  }
  return ids;
}

// Exponer función globalmente
window.listarIdsProblematicosCXP = listarIdsProblematicosCXP;

/**
 * Objeto de utilidad para gestionar IDs problemáticos desde la consola
 */
window.cxpProblematicosUtils = {
  /**
   * Lista todos los IDs problemáticos
   */
  listar: () => listarIdsProblematicosCXP(),

  /**
   * Verifica si un ID es problemático
   * @param {string} id - ID a verificar
   */
  esProblematico: id => esIdProblematicoCXP(id),

  /**
   * Agrega un ID a la lista de problemáticos
   * @param {string} id - ID a agregar
   */
  agregar: id => agregarIdProblematicoCXP(id),

  /**
   * Remueve un ID de la lista de problemáticos
   * @param {string} id - ID a remover
   */
  remover: id => removerIdProblematicoCXP(id),

  /**
   * Limpia toda la lista de IDs problemáticos
   */
  limpiar: () => {
    localStorage.removeItem('cxp_ids_problematicos');
    console.log('✅ Lista de IDs problemáticos limpiada completamente');
    return true;
  },

  /**
   * Muestra ayuda sobre cómo usar estas funciones
   */
  ayuda: () => {
    console.log(
      '%c📚 Utilidades para gestionar IDs problemáticos de CXP',
      'font-size: 14px; font-weight: bold; color: #007bff;'
    );
    console.log('');
    console.log('Funciones disponibles:');
    console.log('  • cxpProblematicosUtils.listar() - Lista todos los IDs problemáticos');
    console.log('  • cxpProblematicosUtils.esProblematico(id) - Verifica si un ID es problemático');
    console.log('  • cxpProblematicosUtils.agregar(id) - Agrega un ID a la lista');
    console.log('  • cxpProblematicosUtils.remover(id) - Remueve un ID de la lista');
    console.log('  • cxpProblematicosUtils.limpiar() - Limpia toda la lista');
    console.log('');
    console.log('Ejemplo para remover el ID "1764958634505":');
    console.log('  cxpProblematicosUtils.remover("1764958634505")');
    console.log('');
    console.log('También puedes usar las funciones directas:');
    console.log('  • window.listarIdsProblematicosCXP()');
    console.log('  • window.removerIdProblematicoCXP("1764958634505")');
    console.log('  • window.agregarIdProblematicoCXP("nuevo-id")');
    console.log('  • window.esIdProblematicoCXP("id-a-verificar")');
  }
};

// DEFINIR FUNCIÓN GLOBALMENTE INMEDIATAMENTE (antes de cualquier otra cosa)
// Esta función se redefinirá más adelante con la implementación completa
(function () {
  'use strict';
  window.abrirModalNuevaFactura = async function abrirModalNuevaFactura() {
    // Verificar si el DOM está listo
    if (document.readyState === 'loading') {
      console.log('⏳ Esperando a que el DOM esté listo...');
      document.addEventListener('DOMContentLoaded', async () => {
        if (typeof window.abrirModalNuevaFactura === 'function') {
          await window.abrirModalNuevaFactura();
        }
      });
      return;
    }

    // Si el DOM está listo pero la función aún no está completamente inicializada
    const form = document.getElementById('formNuevaFactura');
    const modalElement = document.getElementById('modalNuevaFactura');

    if (!form || !modalElement) {
      console.log('⏳ Formulario o modal aún no está disponible, esperando...');
      setTimeout(async () => {
        if (typeof window.abrirModalNuevaFactura === 'function') {
          await window.abrirModalNuevaFactura();
        }
      }, 500);
      return;
    }

    // Si llegamos aquí, intentar abrir el modal directamente
    try {
      form.reset();
      if (typeof window.editingFacturaId !== 'undefined') {
        window.editingFacturaId = null;
      }

      // Establecer fecha actual
      const fechaInput = document.getElementById('fechaEmisionFactura');
      if (fechaInput) {
        fechaInput.value = new Date().toISOString().split('T')[0];
      }

      // Cargar proveedores
      if (typeof loadProveedoresSelect === 'function') {
        await loadProveedoresSelect('proveedorFactura');
      }

      // Mostrar modal
      if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      } else {
        console.error('❌ Bootstrap no está disponible');
      }
    } catch (error) {
      console.error('❌ Error abriendo modal:', error);
    }
  };
})();

// Inicializar sistema CXP
(function () {
  async function initCXP() {
    console.log('🚀 Inicializando sistema de Cuentas por Pagar...');

    // Esperar a que Firebase y los repositorios estén listos
    console.log('🔍 Verificando estado de Firebase...');
    console.log('  - window.FirebaseRepoBase:', typeof window.FirebaseRepoBase);
    console.log('  - window.firebaseRepos:', typeof window.firebaseRepos);
    console.log('  - window.fs:', typeof window.fs);
    console.log('  - window.firebaseDb:', typeof window.firebaseDb);

    // Esperar a que FirebaseRepoBase esté disponible
    let attempts = 0;
    while (attempts < 20 && typeof FirebaseRepoBase === 'undefined') {
      attempts++;
      // console.log(`⏳ Esperando FirebaseRepoBase... (${attempts}/20)`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Esperar a que firebaseRepos esté disponible
    attempts = 0;
    while (attempts < 20 && (!window.firebaseRepos || !window.firebaseRepos.cxp)) {
      attempts++;
      // console.log(`⏳ Esperando repositorios Firebase... (${attempts}/20)`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (window.firebaseRepos && window.firebaseRepos.cxp) {
      // console.log('✅ Repositorio CXP disponible');
      // console.log('  - Estado:', {
      //     tieneDb: !!window.firebaseRepos.cxp.db,
      //     tieneTenantId: !!window.firebaseRepos.cxp.tenantId,
      //     tenantId: window.firebaseRepos.cxp.tenantId
      // });
    } else {
      console.warn('⚠️ Repositorio CXP no disponible después de esperar');
      console.warn('  - window.firebaseRepos:', window.firebaseRepos);
      console.warn('  - window.firebaseRepos?.cxp:', window.firebaseRepos?.cxp);
    }

    // Cargar datos desde localStorage
    (async () => {
      // Esperar a que el repositorio esté completamente inicializado
      if (window.firebaseRepos && window.firebaseRepos.cxp) {
        let attempts = 0;
        while (
          attempts < 20 &&
          (!window.firebaseRepos.cxp.db || !window.firebaseRepos.cxp.tenantId)
        ) {
          attempts++;
          console.log(
            `⏳ Esperando inicialización completa del repositorio CXP... (${attempts}/20)`
          );
          await new Promise(resolve => setTimeout(resolve, 500));
          await window.firebaseRepos.cxp.init();
        }
        if (window.firebaseRepos.cxp.db && window.firebaseRepos.cxp.tenantId) {
          console.log('✅ Repositorio CXP completamente inicializado');
        }
      }
      await loadCXPData();

      // VERIFICAR DATOS DESDE FIREBASE PRIMERO (fuente de verdad)
      // Solo usar localStorage para flags de configuración, no para datos
      const hasInitialized = localStorage.getItem('cxp_initialized');

      console.log('🔍 Debug CXP Initialization:');
      console.log('  - hasInitialized:', hasInitialized);
      console.log('  - facturasCXP.length (desde Firebase):', facturasCXP.length);
      console.log('  - solicitudesPago.length (desde Firebase):', solicitudesPago.length);

      // Solo inicializar estructura si es la primera vez Y no hay datos en Firebase
      // Firebase es la fuente de verdad, no localStorage
      if (!hasInitialized && facturasCXP.length === 0 && solicitudesPago.length === 0) {
        console.log('🚀 Primera inicialización de CXP - estructura vacía');
        initializeCXPData();
        localStorage.setItem('cxp_initialized', 'true');
      } else {
        console.log('⏭️ CXP ya inicializado o tiene datos en Firebase');
      }

      // Inicializar filtros (esto inicializa facturasFiltradas con todas las facturas)
      aplicarFiltrosCXP();

      // Cargar datos en las tablas (ya se cargan dentro de aplicarFiltrosCXP, pero por si acaso)
      loadProveedoresCXP();
      loadProveedoresSelects();

      // Actualizar métricas
      updateCXPMetrics();

      // Establecer período actual (mes y año)
      const establecerPeriodoActual = () => {
        const currentPeriodElement = document.getElementById('currentPeriod');
        if (currentPeriodElement) {
          const ahora = new Date();
          const meses = [
            'Enero',
            'Febrero',
            'Marzo',
            'Abril',
            'Mayo',
            'Junio',
            'Julio',
            'Agosto',
            'Septiembre',
            'Octubre',
            'Noviembre',
            'Diciembre'
          ];
          const mesActual = meses[ahora.getMonth()];
          const añoActual = ahora.getFullYear();
          currentPeriodElement.textContent = `${mesActual} ${añoActual}`;
          console.log(`✅ Período actual establecido: ${mesActual} ${añoActual}`);
        }
      };

      // Establecer período cuando el DOM esté listo
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', establecerPeriodoActual);
      } else {
        establecerPeriodoActual();
      }

      // Configurar event listeners
      // Configurar event listeners cuando el DOM esté listo
      const configurarListenersCuandoListo = () => {
        const filtroProveedor = document.getElementById('filtroProveedor');
        const filtroFactura = document.getElementById('filtroFactura');
        const filtroEstado = document.getElementById('filtroEstado');
        const fechaDesde = document.getElementById('fechaDesde');
        const fechaHasta = document.getElementById('fechaHasta');

        // Si todos los elementos están disponibles, configurar listeners
        if (filtroProveedor && filtroFactura && filtroEstado && fechaDesde && fechaHasta) {
          setupEventListeners();
          console.log('✅ Event listeners de filtros configurados');
          return true;
        }
        return false;
      };

      // Intentar configurar inmediatamente si el DOM está listo
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          if (!configurarListenersCuandoListo()) {
            // Si aún no están disponibles, intentar después de un delay
            setTimeout(configurarListenersCuandoListo, 300);
          }
        });
      } else {
        // DOM ya está listo
        if (!configurarListenersCuandoListo()) {
          // Si aún no están disponibles, intentar después de un delay
          setTimeout(configurarListenersCuandoListo, 300);
        }
      }

      // Reintentar una vez más después de 1 segundo por si acaso
      setTimeout(() => {
        const filtroProveedor = document.getElementById('filtroProveedor');
        if (filtroProveedor && !filtroProveedor.hasAttribute('data-listener-configurado')) {
          console.log('🔄 Reintentando configurar listeners de filtros...');
          configurarListenersCuandoListo();
        }
      }, 1000);

      // Suscribirse a cambios en tiempo real de CXP
      console.log('🔍 Verificando repositorio CXP para listener...');
      console.log('  - window.firebaseRepos:', Boolean(window.firebaseRepos));
      console.log('  - window.firebaseRepos?.cxp:', Boolean(window.firebaseRepos?.cxp));

      if (window.firebaseRepos && window.firebaseRepos.cxp) {
        setTimeout(async () => {
          try {
            console.log('📡 Suscribiéndose a cambios en tiempo real de CXP...');
            let attempts = 0;
            while (
              attempts < 10 &&
              (!window.firebaseRepos.cxp.db || !window.firebaseRepos.cxp.tenantId)
            ) {
              attempts++;
              console.log(
                `⏳ Esperando inicialización del repositorio CXP para listener... (${attempts}/10)`
              );
              await new Promise(resolve => setTimeout(resolve, 500));
              await window.firebaseRepos.cxp.init();
            }

            if (window.firebaseRepos.cxp.db && window.firebaseRepos.cxp.tenantId) {
              // Guardar estado inicial para comparar después
              let primeraActualizacion = true;
              let guardandoDatos = false; // Flag para evitar que el listener sobrescriba durante el guardado

              await window.firebaseRepos.cxp.subscribe(async items => {
                // Si estamos guardando datos, no actualizar desde el listener para evitar conflictos
                if (guardandoDatos) {
                  console.log('⏸️ Listener pausado: guardando datos localmente (flag activo)');
                  return;
                }

                // Verificar si la página está a punto de recargarse (evitar renderizado antes de recarga)
                // Si detectamos múltiples cambios rápidos, podría ser que estamos en proceso de guardado/recarga
                if (document.readyState === 'loading' || document.readyState === 'uninitialized') {
                  console.log('⏸️ Listener pausado: página en proceso de carga');
                  return;
                }

                // Filtrar registros problemáticos antes de procesar
                items = items.filter(item => {
                  const itemId = String(item.id || '');
                  // Usar window.esIdProblematicoCXP para asegurar que esté disponible
                  const esProblematicoFunc = window.esIdProblematicoCXP || esIdProblematicoCXP;
                  if (esProblematicoFunc && esProblematicoFunc(itemId)) {
                    console.warn(`🚫 Registro problemático filtrado del listener: ${itemId}`);
                    // Intentar eliminarlo automáticamente de Firebase
                    setTimeout(async () => {
                      try {
                        await window.firebaseRepos.cxp.delete(itemId);
                        await window.firebaseRepos.cxp.delete(
                          String(item.id || '').replace('factura_', '')
                        );
                        console.log(
                          `🗑️ Registro problemático ${itemId} eliminado automáticamente desde listener`
                        );
                      } catch (e) {
                        // Ignorar errores de eliminación
                      }
                    }, 500);
                    return false;
                  }
                  return true;
                });

                let facturas = items.filter(item => item.tipo === 'factura');
                let solicitudes = items.filter(item => item.tipo === 'solicitud');

                // Limpiar campos duplicados en solicitudes también
                solicitudes = solicitudes.map(s => {
                  const solicitudLimpia = { ...s };

                  // Separar nombre y RFC del campo proveedor si viene en formato "Nombre - RFC"
                  if (solicitudLimpia.proveedor && solicitudLimpia.proveedor.includes(' - ')) {
                    const partes = solicitudLimpia.proveedor.split(' - ');
                    solicitudLimpia.proveedor = partes[0].trim();
                    if (!solicitudLimpia.rfc && partes[1]) {
                      solicitudLimpia.rfc = partes[1].trim();
                    }
                  }

                  // Separar nombre y RFC del campo proveedorId si viene en formato "Nombre - RFC"
                  if (solicitudLimpia.proveedorId && solicitudLimpia.proveedorId.includes(' - ')) {
                    const partes = solicitudLimpia.proveedorId.split(' - ');
                    if (!solicitudLimpia.proveedor) {
                      solicitudLimpia.proveedor = partes[0].trim();
                    }
                    if (!solicitudLimpia.rfc && partes[1]) {
                      solicitudLimpia.rfc = partes[1].trim();
                    }
                  }

                  // Eliminar campo duplicado proveedorId
                  delete solicitudLimpia.proveedorId;

                  return solicitudLimpia;
                });

                console.log(
                  '🔄 Actualización en tiempo real de CXP:',
                  facturas.length,
                  'facturas,',
                  solicitudes.length,
                  'solicitudes'
                );

                // Verificar si se limpiaron los datos operativos
                const datosLimpios = localStorage.getItem('datos_operativos_limpiados');
                if (datosLimpios === 'true') {
                  console.log(
                    '⚠️ Datos operativos fueron limpiados. Usando solo Firebase (no se restaurará desde localStorage).'
                  );
                }

                // Si es la primera actualización y recibimos datos vacíos, pero ya tenemos datos cargados,
                // verificar si Firebase realmente está vacío o es un error de sincronización
                try {
                  if (primeraActualizacion && facturas.length === 0 && solicitudes.length === 0) {
                    const tieneDatosExistentes =
                      facturasCXP.length > 0 || solicitudesPago.length > 0;
                    if (tieneDatosExistentes) {
                      // Verificar en Firebase si realmente está vacío
                      try {
                        const repoCXP = window.firebaseRepos.cxp;
                        if (repoCXP && repoCXP.db && repoCXP.tenantId) {
                          const todosLosItems = await repoCXP.getAll();
                          if (todosLosItems && todosLosItems.length > 0) {
                            console.warn(
                              '⚠️ Listener devolvió datos vacíos pero Firebase tiene datos. Ignorando actualización vacía.'
                            );
                            primeraActualizacion = false;
                            return;
                          }
                        }
                      } catch (error) {
                        console.warn('⚠️ Error verificando Firebase CXP:', error);
                      }
                    } else {
                      console.log(
                        '✅ Firebase confirmado vacío. Sincronizando localStorage con Firebase (vacío).'
                      );
                      // Continuar para sincronizar (borrar localStorage)
                    }
                  }
                } catch (error) {
                  console.warn(
                    '⚠️ Error verificando Firebase, ignorando actualización vacía por seguridad:',
                    error
                  );
                  primeraActualizacion = false;
                  return;
                }

                primeraActualizacion = false;

                // Obtener datos previos para detectar eliminaciones
                const facturasPrevias = facturasCXP.length;
                const solicitudesPrevias = solicitudesPago.length;

                // Filtrar registros problemáticos antes de actualizar arrays
                const esProblematico = window.esIdProblematicoCXP || esIdProblematicoCXP;
                facturas = facturas.filter(f => !esProblematico(String(f.id || '')));
                solicitudes = solicitudes.filter(s => !esProblematico(String(s.id || '')));

                // Verificar si estamos guardando datos para evitar conflictos
                if (guardandoDatos) {
                  console.log('⏸️ Listener pausado: guardando datos, no actualizando arrays');
                  return;
                }

                // IMPORTANTE: Firebase subscribe devuelve TODAS las facturas, no solo las que cambiaron
                // Por lo tanto, debemos usar las facturas de Firebase como la fuente de verdad completa
                // y reemplazar completamente facturasCXP con las de Firebase

                // Crear un mapa de facturas de Firebase por ID para evitar duplicados
                const facturasMapById = new Map();
                const facturasMapByNumero = new Map(); // Para detectar duplicados por número de factura + proveedor

                // Agregar todas las facturas de Firebase al mapa (Firebase es la fuente de verdad)
                facturas.forEach(f => {
                  if (f && f.id) {
                    // Limpiar campos duplicados y separar nombre y RFC
                    const facturaLimpia = { ...f };

                    // Separar nombre y RFC del campo proveedor si viene en formato "Nombre - RFC"
                    if (facturaLimpia.proveedor && facturaLimpia.proveedor.includes(' - ')) {
                      const partes = facturaLimpia.proveedor.split(' - ');
                      facturaLimpia.proveedor = partes[0].trim();
                      // Si no hay campo rfc, usar el de la separación
                      if (!facturaLimpia.rfc && partes[1]) {
                        facturaLimpia.rfc = partes[1].trim();
                      }
                    }

                    // Separar nombre y RFC del campo proveedorId si viene en formato "Nombre - RFC"
                    if (facturaLimpia.proveedorId && facturaLimpia.proveedorId.includes(' - ')) {
                      const partes = facturaLimpia.proveedorId.split(' - ');
                      if (!facturaLimpia.proveedor) {
                        facturaLimpia.proveedor = partes[0].trim();
                      }
                      // Si no hay campo rfc, usar el de la separación
                      if (!facturaLimpia.rfc && partes[1]) {
                        facturaLimpia.rfc = partes[1].trim();
                      }
                    }

                    // Eliminar campo duplicado proveedorId
                    delete facturaLimpia.proveedorId;

                    const idKey = String(facturaLimpia.id);
                    const numeroKey = `${String(facturaLimpia.numeroFactura || '').trim()}_${String(facturaLimpia.proveedor || '').trim()}`;

                    // Verificar si ya existe una factura con el mismo número y proveedor
                    if (numeroKey && numeroKey !== '_' && facturasMapByNumero.has(numeroKey)) {
                      const existente = facturasMapByNumero.get(numeroKey);
                      // Si tienen IDs diferentes, es un duplicado - usar la más reciente (mayor ID)
                      if (existente && String(existente.id) !== idKey) {
                        const idExistente = parseInt(existente.id, 10) || 0;
                        const idNuevo = parseInt(idKey, 10) || 0;
                        if (idNuevo > idExistente) {
                          // La nueva es más reciente, reemplazar
                          console.warn(
                            `⚠️ Duplicado detectado por número de factura: ${facturaLimpia.numeroFactura} - ${facturaLimpia.proveedor}`
                          );
                          console.warn(
                            `   ID existente: ${existente.id}, ID nuevo: ${facturaLimpia.id} - Usando el más reciente (${facturaLimpia.id})`
                          );
                          facturasMapById.delete(String(existente.id));
                        } else {
                          // La existente es más reciente, mantenerla y saltar la nueva
                          console.warn(
                            `⚠️ Duplicado detectado por número de factura: ${facturaLimpia.numeroFactura} - ${facturaLimpia.proveedor}`
                          );
                          console.warn(
                            `   ID existente: ${existente.id}, ID nuevo: ${facturaLimpia.id} - Manteniendo el más reciente (${existente.id})`
                          );
                          return; // Saltar esta factura
                        }
                      }
                    }

                    // Agregar/actualizar en el mapa por ID (usar factura limpia)
                    facturasMapById.set(idKey, facturaLimpia);

                    // Actualizar el mapa por número de factura
                    if (numeroKey && numeroKey !== '_') {
                      facturasMapByNumero.set(numeroKey, facturaLimpia);
                    }
                  }
                });

                // Reemplazar completamente facturasCXP con las de Firebase (Firebase es la fuente de verdad)
                facturasCXP = Array.from(facturasMapById.values());

                // Log para debugging
                console.log(
                  `📊 Facturas actualizadas desde listener: ${facturasCXP.length} (de ${facturas.length} recibidas de Firebase)`
                );
                solicitudesPago = solicitudes;

                // NO USAR localStorage - Solo Firebase es la fuente de verdad
                // Eliminado guardado en localStorage para evitar inconsistencias entre navegadores

                // Log para debugging
                if (facturasPrevias > facturas.length) {
                  console.log(
                    `🗑️ ${facturasPrevias - facturas.length} factura(s) eliminada(s) del localStorage de CXP (sincronizado con Firebase)`
                  );
                }
                if (solicitudesPrevias > solicitudes.length) {
                  console.log(
                    `🗑️ ${solicitudesPrevias - solicitudes.length} solicitud(es) eliminada(s) del localStorage de CXP (sincronizado con Firebase)`
                  );
                }

                // Verificar una vez más si estamos guardando datos antes de renderizar
                // Esto previene renderizado si el flag se desactiva justo antes de recargar
                // Usar también la marca global para verificación rápida
                if (guardandoDatos || window._cxpGuardandoDatosFlag) {
                  console.log(
                    '⏸️ Listener pausado antes de renderizar: guardando datos (flag activo)'
                  );
                  return;
                }

                // Agregar un pequeño delay para asegurar que Firebase haya terminado de procesar todos los cambios
                // Esto evita problemas de timing donde el listener se dispara antes de que se completen todas las escrituras
                await new Promise(resolve => setTimeout(resolve, 300));

                // Verificar una vez más después del delay
                if (guardandoDatos || window._cxpGuardandoDatosFlag) {
                  console.log(
                    '⏸️ Listener pausado después del delay: guardando datos (flag activo)'
                  );
                  return;
                }

                // Recargar tablas
                // Aplicar filtros antes de cargar (inicializa facturasFiltradas con todas las facturas)
                aplicarFiltrosCXP();
                updateCXPMetrics();
              });

              // Exponer flag para que saveCXPData pueda usarlo
              window._cxpGuardandoDatos = () => {
                guardandoDatos = true;
                window._cxpGuardandoDatosFlag = true; // Marca global para verificación rápida
                console.log('🔒 Activando flag de guardado para evitar interferencia del listener');
              };
              window._cxpDatosGuardados = () => {
                guardandoDatos = false;
                window._cxpGuardandoDatosFlag = false;
                console.log('🔓 Desactivando flag de guardado');
              };

              console.log('✅ Listener de CXP activado');
            } else {
              console.warn('⚠️ Repositorio CXP no inicializado para listener después de esperar');
            }
          } catch (error) {
            console.error('❌ Error suscribiéndose a CXP:', error);
            console.error('Stack:', error.stack);
          }
        }, 2000);
      } else {
        console.warn('⚠️ Repositorio CXP no disponible para listener');
        // Reintentar después de más tiempo
        setTimeout(async () => {
          if (window.firebaseRepos && window.firebaseRepos.cxp) {
            console.log('🔄 Reintentando suscripción a CXP...');
            try {
              let attempts = 0;
              while (
                attempts < 10 &&
                (!window.firebaseRepos.cxp.db || !window.firebaseRepos.cxp.tenantId)
              ) {
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 500));
                await window.firebaseRepos.cxp.init();
              }

              if (window.firebaseRepos.cxp.db && window.firebaseRepos.cxp.tenantId) {
                await window.firebaseRepos.cxp.subscribe(items => {
                  const facturas = items.filter(item => item.tipo === 'factura');
                  const solicitudes = items.filter(item => item.tipo === 'solicitud');

                  // Obtener datos previos para detectar eliminaciones
                  const facturasPrevias = facturasCXP.length;
                  const solicitudesPrevias = solicitudesPago.length;

                  console.log(
                    '🔄 Actualización en tiempo real de CXP (reintento):',
                    facturas.length,
                    'facturas,',
                    solicitudes.length,
                    'solicitudes'
                  );

                  // Actualizar arrays globales SIEMPRE, incluso si están vacíos (para reflejar eliminaciones)
                  facturasCXP = facturas;
                  solicitudesPago = solicitudes;

                  // NO USAR localStorage - Solo Firebase es la fuente de verdad
                  // Eliminado guardado en localStorage para evitar inconsistencias entre navegadores

                  // Log para debugging
                  if (facturasPrevias > facturas.length) {
                    console.log(
                      `🗑️ ${facturasPrevias - facturas.length} factura(s) eliminada(s) del localStorage de CXP (sincronizado con Firebase)`
                    );
                  }
                  if (solicitudesPrevias > solicitudes.length) {
                    console.log(
                      `🗑️ ${solicitudesPrevias - solicitudes.length} solicitud(es) eliminada(s) del localStorage de CXP (sincronizado con Firebase)`
                    );
                  }

                  // Aplicar filtros antes de recargar tablas
                  aplicarFiltrosCXP();
                  updateCXPMetrics();
                });
                console.log('✅ Listener de CXP activado (reintento)');
              }
            } catch (error) {
              console.error('❌ Error en reintento de suscripción:', error);
            }
          }
        }, 5000);
      }

      console.log('✅ Sistema CXP inicializado correctamente');
    })(); // Cerrar la función async anónima
  }

  // Ejecutar inmediatamente si el DOM ya está listo, o esperar al evento
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCXP);
  } else {
    // DOM ya está listo, ejecutar inmediatamente
    initCXP();
  }
})();

// Cargar datos desde Firebase primero, luego localStorage
async function loadCXPData() {
  try {
    // PRIORIDAD 1: Intentar cargar desde Firebase
    if (window.firebaseRepos && window.firebaseRepos.cxp) {
      // Asegurarse de que el repositorio esté inicializado
      if (!window.firebaseRepos.cxp.db || !window.firebaseRepos.cxp.tenantId) {
        console.log('⏳ Inicializando repositorio CXP...');
        await window.firebaseRepos.cxp.init();
      }

      // Verificar nuevamente después de init()
      if (!window.firebaseRepos.cxp.db || !window.firebaseRepos.cxp.tenantId) {
        console.warn('⚠️ Repositorio CXP no está completamente inicializado, usando localStorage');
      } else {
        try {
          const repoCXP = window.firebaseRepos.cxp;

          // Declarar variables antes del bloque para que estén disponibles en todo el scope
          let facturasFirebase = [];
          let solicitudesFirebase = [];

          // Esperar inicialización
          let attempts = 0;
          while (attempts < 10 && (!repoCXP.db || !repoCXP.tenantId)) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 300));
            if (typeof repoCXP.init === 'function') {
              try {
                await repoCXP.init();
              } catch (e) {
                // Ignorar error intencionalmente
              }
            }
          }

          if (repoCXP.db && repoCXP.tenantId) {
            console.log('📊 Cargando datos CXP desde Firebase...');

            // Cargar facturas desde Firebase
            facturasFirebase = await repoCXP.getAllFacturas();
            if (facturasFirebase && facturasFirebase.length > 0) {
              facturasCXP = facturasFirebase;
              console.log(`✅ ${facturasCXP.length} facturas cargadas desde Firebase`);
              // NO USAR localStorage - Solo Firebase es la fuente de verdad
              // Eliminado guardado en localStorage para evitar inconsistencias entre navegadores
            }

            // Cargar solicitudes desde Firebase
            solicitudesFirebase = await repoCXP.getAllSolicitudes();
            if (solicitudesFirebase && solicitudesFirebase.length > 0) {
              solicitudesPago = solicitudesFirebase;
              console.log(`✅ ${solicitudesPago.length} solicitudes cargadas desde Firebase`);
              // NO USAR localStorage - Solo Firebase es la fuente de verdad
              // Eliminado guardado en localStorage para evitar inconsistencias entre navegadores
            }
          }

          // Siempre actualizar con los datos de Firebase, incluso si están vacíos
          // Esto asegura que si se borraron datos, se refleje correctamente
          facturasCXP = facturasFirebase || [];
          solicitudesPago = solicitudesFirebase || [];

          // NO USAR localStorage - Solo Firebase es la fuente de verdad
          // Eliminado guardado en localStorage para evitar inconsistencias entre navegadores

          console.log(
            `📂 Datos CXP cargados desde Firebase: ${facturasCXP.length} facturas, ${solicitudesPago.length} solicitudes`
          );
          return;
        } catch (error) {
          console.warn('⚠️ Error cargando desde Firebase, usando localStorage:', error);
        }
      }
    }

    // NO USAR localStorage - Solo Firebase es la fuente de verdad
    // Eliminado fallback a localStorage para evitar inconsistencias entre navegadores
    console.warn(
      '⚠️ Firebase es la única fuente de datos. localStorage ha sido deshabilitado para evitar inconsistencias.'
    );

    // Si no hay datos en Firebase, inicializar arrays vacíos
    if (facturasCXP.length === 0) {
      facturasCXP = [];
    }
    if (solicitudesPago.length === 0) {
      solicitudesPago = [];
    }

    // Los proveedores ahora se cargan desde configuracion
    // No necesitamos cargar proveedoresCXP aquí

    console.log(
      `📂 Datos cargados desde Firebase: ${facturasCXP.length} facturas, ${solicitudesPago.length} solicitudes`
    );
  } catch (error) {
    console.error('❌ Error cargando datos CXP:', error);
  }
}

// Inicializar datos de ejemplo
async function initializeCXPData() {
  console.log('🔄 Inicializando CXP sin datos de ejemplo...');

  // NO USAR localStorage - Solo Firebase es la fuente de verdad
  // Cargar datos desde Firebase usando loadCXPData
  await loadCXPData();

  // Si no hay datos en Firebase, inicializar arrays vacíos
  if (!facturasCXP || facturasCXP.length === 0) {
    facturasCXP = [];
  }
  if (!solicitudesPago || solicitudesPago.length === 0) {
    solicitudesPago = [];
  }

  // Migrar facturas existentes para agregar montoPendiente y montoPagado si no existen
  let facturasActualizadas = false;
  facturasCXP = facturasCXP.map(factura => {
    if (factura.montoPendiente === undefined || factura.montoPagado === undefined) {
      facturasActualizadas = true;
      const montoPagado = factura.montoPagado || 0;
      const montoPendiente = factura.montoPendiente || factura.monto - montoPagado;
      return {
        ...factura,
        montoPagado: montoPagado,
        montoPendiente: montoPendiente
      };
    }
    return factura;
  });

  if (facturasActualizadas) {
    console.log('🔄 Migrando facturas CXP para agregar montoPendiente...');
    saveCXPData();
  }

  // Código de limpieza de datos de prueba eliminado

  console.log('✅ CXP inicializado correctamente');
}

// Guardar datos en localStorage
async function saveCXPData() {
  try {
    // Activar flag para evitar que el listener interfiera
    if (window._cxpGuardandoDatos) {
      window._cxpGuardandoDatos();
    }

    // NO USAR localStorage - Solo Firebase es la fuente de verdad
    // Eliminado guardado en localStorage para evitar inconsistencias entre navegadores

    // Guardar en Firebase si está disponible
    if (window.firebaseRepos && window.firebaseRepos.cxp) {
      try {
        // Esperar a que el repositorio esté inicializado
        let attempts = 0;
        while (
          attempts < 10 &&
          (!window.firebaseRepos.cxp.db || !window.firebaseRepos.cxp.tenantId)
        ) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
          await window.firebaseRepos.cxp.init();
        }

        // Guardar facturas en Firebase (usar ID consistente)
        for (const factura of facturasCXP) {
          // Usar el ID de la factura de forma consistente
          const facturaId = `factura_${factura.id}`;
          if (!facturaId || facturaId === 'factura_undefined') {
            console.warn('⚠️ Factura sin ID válido, omitiendo:', factura);
            continue;
          }
          try {
            // Limpiar campos duplicados antes de guardar
            const facturaParaGuardar = { ...factura };
            delete facturaParaGuardar.proveedorId; // Eliminar campo duplicado
            await window.firebaseRepos.cxp.saveFactura(facturaId, facturaParaGuardar);
            console.log(`✅ Factura guardada en Firebase: ${facturaId}`);
          } catch (error) {
            console.error(`❌ Error guardando factura ${facturaId}:`, error);
          }
        }

        // Guardar solicitudes en Firebase (usar ID consistente)
        console.log(`📋 Intentando guardar ${solicitudesPago.length} solicitudes en Firebase...`);
        let solicitudesGuardadas = 0;
        for (const solicitud of solicitudesPago) {
          const solicitudId = `solicitud_${solicitud.id}`;
          console.log(`🔍 Procesando solicitud: ID=${solicitud.id}, solicitudId=${solicitudId}`);
          if (!solicitudId || solicitudId === 'solicitud_undefined' || !solicitud.id) {
            console.warn('⚠️ Solicitud sin ID válido, omitiendo:', solicitud);
            continue;
          }
          try {
            console.log(`💾 Guardando solicitud en Firebase: ${solicitudId}`, solicitud);
            // Limpiar campos duplicados antes de guardar
            const solicitudParaGuardar = { ...solicitud };
            delete solicitudParaGuardar.proveedorId; // Eliminar campo duplicado
            await window.firebaseRepos.cxp.saveSolicitud(solicitudId, solicitudParaGuardar);
            console.log(`✅ Solicitud guardada en Firebase: ${solicitudId}`);
            solicitudesGuardadas++;
          } catch (error) {
            console.error(`❌ Error guardando solicitud ${solicitudId}:`, error);
            console.error('Stack:', error.stack);
          }
        }

        console.log(
          `✅ ${facturasCXP.length} facturas y ${solicitudesGuardadas}/${solicitudesPago.length} solicitudes guardadas en Firebase`
        );
      } catch (error) {
        console.warn('⚠️ Error guardando en Firebase, continuando con localStorage:', error);
      }
    }

    // Desactivar flag después de guardar
    if (window._cxpDatosGuardados) {
      // Esperar un poco para que Firebase procese los cambios antes de permitir actualizaciones del listener
      setTimeout(() => {
        window._cxpDatosGuardados();
      }, 1000);
    }
  } catch (error) {
    console.error('❌ Error guardando datos CXP:', error);
    // Asegurarse de desactivar el flag incluso si hay error
    if (window._cxpDatosGuardados) {
      window._cxpDatosGuardados();
    }
  }
}

// Guardar solo los datos modificados (optimizado para operaciones masivas)
async function saveCXPDataOptimizado(facturasModificadasIds, solicitudesModificadas) {
  try {
    // Activar flag para evitar que el listener interfiera
    if (window._cxpGuardandoDatos) {
      window._cxpGuardandoDatos();
    }

    // NO USAR localStorage - Solo Firebase es la fuente de verdad
    // Eliminado guardado en localStorage para evitar inconsistencias entre navegadores

    // Guardar en Firebase solo los cambios
    if (window.firebaseRepos && window.firebaseRepos.cxp) {
      try {
        // Esperar a que el repositorio esté inicializado
        let attempts = 0;
        while (
          attempts < 10 &&
          (!window.firebaseRepos.cxp.db || !window.firebaseRepos.cxp.tenantId)
        ) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
          await window.firebaseRepos.cxp.init();
        }

        // Guardar solo las facturas modificadas en paralelo
        const facturasParaGuardar = facturasCXP.filter(f => facturasModificadasIds.has(f.id));
        if (facturasParaGuardar.length > 0) {
          console.log(
            `💾 Guardando ${facturasParaGuardar.length} factura(s) modificada(s) en Firebase...`
          );
          const promesasFacturas = facturasParaGuardar.map(async factura => {
            const facturaId = `factura_${factura.id}`;
            if (!facturaId || facturaId === 'factura_undefined') {
              console.warn('⚠️ Factura sin ID válido, omitiendo:', factura);
              return null;
            }
            try {
              await window.firebaseRepos.cxp.saveFactura(facturaId, factura);
              return facturaId;
            } catch (error) {
              console.error(`❌ Error guardando factura ${facturaId}:`, error);
              return null;
            }
          });

          const resultadosFacturas = await Promise.all(promesasFacturas);
          const exitosas = resultadosFacturas.filter(r => r !== null).length;
          console.log(
            `✅ ${exitosas}/${facturasParaGuardar.length} factura(s) guardada(s) en Firebase`
          );
        }

        // Guardar solo las solicitudes modificadas en paralelo
        if (solicitudesModificadas.length > 0) {
          console.log(
            `💾 Guardando ${solicitudesModificadas.length} solicitud(es) modificada(s) en Firebase...`
          );
          const promesasSolicitudes = solicitudesModificadas.map(async solicitud => {
            const solicitudId = `solicitud_${solicitud.id}`;
            if (!solicitudId || solicitudId === 'solicitud_undefined' || !solicitud.id) {
              console.warn('⚠️ Solicitud sin ID válido, omitiendo:', solicitud);
              return null;
            }
            try {
              // Limpiar campos duplicados antes de guardar
              const solicitudParaGuardar = { ...solicitud };
              delete solicitudParaGuardar.proveedorId; // Eliminar campo duplicado
              await window.firebaseRepos.cxp.saveSolicitud(solicitudId, solicitudParaGuardar);
              return solicitudId;
            } catch (error) {
              console.error(`❌ Error guardando solicitud ${solicitudId}:`, error);
              return null;
            }
          });

          const resultadosSolicitudes = await Promise.all(promesasSolicitudes);
          const exitosas = resultadosSolicitudes.filter(r => r !== null).length;
          console.log(
            `✅ ${exitosas}/${solicitudesModificadas.length} solicitud(es) guardada(s) en Firebase`
          );
        }
      } catch (error) {
        console.warn('⚠️ Error guardando en Firebase, continuando con localStorage:', error);
      }
    }

    // Desactivar flag después de guardar
    if (window._cxpDatosGuardados) {
      // Esperar un poco para que Firebase procese los cambios antes de permitir actualizaciones del listener
      setTimeout(() => {
        window._cxpDatosGuardados();
      }, 500); // Reducido de 1000ms a 500ms
    }
  } catch (error) {
    console.error('❌ Error guardando datos CXP optimizado:', error);
    // Asegurarse de desactivar el flag incluso si hay error
    if (window._cxpDatosGuardados) {
      window._cxpDatosGuardados();
    }
  }
}

// Configurar event listeners
function setupEventListeners() {
  // Configurar filtros automáticos (igual que en CXC)
  console.log('🔧 Configurando filtros automáticos para CXP...');

  // Campos de texto: usar 'input' para filtrar mientras se escribe (con debounce)
  const camposTexto = ['filtroProveedor', 'filtroFactura', 'filtroEstado'];

  camposTexto.forEach(campoId => {
    const campo = document.getElementById(campoId);
    if (campo) {
      // Remover listener anterior si existe (usando la función global)
      campo.removeEventListener('input', aplicarFiltrosConDebounceCXP);
      // Agregar nuevo listener
      campo.addEventListener('input', aplicarFiltrosConDebounceCXP);
      campo.setAttribute('data-listener-configurado', 'true');
      console.log(`✅ Filtro automático configurado para: ${campoId} (con debounce)`);
    } else {
      console.warn(`⚠️ Elemento ${campoId} no encontrado`);
    }
  });

  // Campos de fecha: usar 'change' para filtrar inmediatamente
  const camposInmediatos = ['fechaDesde', 'fechaHasta'];

  camposInmediatos.forEach(campoId => {
    const campo = document.getElementById(campoId);
    if (campo) {
      // Remover listener anterior si existe (usando la función global)
      campo.removeEventListener('change', aplicarFiltrosInmediatoCXP);
      // Agregar nuevo listener
      campo.addEventListener('change', aplicarFiltrosInmediatoCXP);
      campo.setAttribute('data-listener-configurado', 'true');
      console.log(`✅ Filtro automático configurado para: ${campoId} (inmediato)`);
    } else {
      console.warn(`⚠️ Elemento ${campoId} no encontrado`);
    }
  });

  console.log('✅ Filtros automáticos configurados correctamente');

  // Tabs
  document.querySelectorAll('#cxpTabs button[data-bs-toggle="tab"]').forEach(tab => {
    tab.addEventListener('shown.bs.tab', event => {
      const target = event.target.getAttribute('data-bs-target');
      if (target === '#facturas') {
        loadFacturasCXP();
      } else if (target === '#solicitudes') {
        loadSolicitudesCXP();
      }
    });
  });

  // Cálculo automático de fecha de vencimiento en el modal de factura
  const proveedorFacturaSelect = document.getElementById('proveedorFactura');
  const fechaEmisionInput = document.getElementById('fechaEmisionFactura');
  if (proveedorFacturaSelect) {
    proveedorFacturaSelect.addEventListener('change', actualizarFechaVencimientoFactura);
  }
  if (fechaEmisionInput) {
    fechaEmisionInput.addEventListener('change', actualizarFechaVencimientoFactura);
  }

  // Mostrar/ocultar tipo de cambio según moneda
  const tipoMonedaFactura = document.getElementById('tipoMonedaFactura');
  if (tipoMonedaFactura) {
    tipoMonedaFactura.addEventListener('change', toggleTipoCambioFactura);
  }
}

// ===== GESTIÓN DE FACTURAS =====

// Cargar facturas en la tabla
function loadFacturasCXP() {
  const tbody = document.getElementById('tbodyFacturasCXP');
  if (!tbody) {
    return;
  }

  // Ordenar facturas filtradas: las más recientes primero (como en CXC)
  const facturasOrdenadas = [...facturasFiltradas].sort((a, b) => {
    // Prioridad 1: fechaCreacion (más reciente primero)
    const fechaA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
    const fechaB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
    if (fechaA !== fechaB) {
      return fechaB - fechaA; // Descendente (más reciente primero)
    }

    // Prioridad 2: fechaEmision (más reciente primero)
    const fechaEmisionA = a.fechaEmision ? new Date(a.fechaEmision).getTime() : 0;
    const fechaEmisionB = b.fechaEmision ? new Date(b.fechaEmision).getTime() : 0;
    if (fechaEmisionA !== fechaEmisionB) {
      return fechaEmisionB - fechaEmisionA; // Descendente (más reciente primero)
    }

    // Prioridad 3: ID (más alto = más reciente)
    const idA = a.id || 0;
    const idB = b.id || 0;
    return idB - idA; // Descendente (ID más alto primero)
  });

  // Inicializar paginación
  const PaginacionManagerClass =
    typeof PaginacionManager !== 'undefined'
      ? PaginacionManager
      : typeof window.PaginacionManager !== 'undefined'
        ? window.PaginacionManager
        : null;

  if (!PaginacionManagerClass) {
    console.warn(
      '⚠️ PaginacionManager no está disponible, mostrando todas las facturas sin paginación'
    );
    renderizarFacturasCXP(facturasOrdenadas);
    return;
  }

  if (!window._paginacionCXPManager) {
    try {
      window._paginacionCXPManager = new PaginacionManagerClass();
      console.log('✅ Nueva instancia de PaginacionManager creada para CXP');
    } catch (error) {
      console.error('❌ Error creando instancia de PaginacionManager:', error);
      renderizarFacturasCXP(facturas);
      return;
    }
  }

  try {
    // Guardar facturas ordenadas globalmente para paginación
    window._facturasCXPCompletas = facturasOrdenadas;

    // Crear array de IDs para paginación (usar facturas ordenadas)
    const facturasIds = facturasOrdenadas.map((f, _index) =>
      String(f.id || f.numeroFactura || Date.now() + Math.random())
    );
    window._paginacionCXPManager.inicializar(facturasIds, 15);
    // Siempre empezar en la página 1 para mostrar las más recientes primero
    window._paginacionCXPManager.paginaActual = 1;
    console.log(
      `✅ Paginación inicializada: ${window._paginacionCXPManager.totalRegistros} facturas, ${window._paginacionCXPManager.obtenerTotalPaginas()} páginas`
    );

    // Renderizar facturas de la página actual
    renderizarFacturasCXP();

    // Generar controles de paginación
    const contenedorPaginacion = document.getElementById('paginacionCXP');
    if (contenedorPaginacion && window._paginacionCXPManager) {
      contenedorPaginacion.innerHTML = window._paginacionCXPManager.generarControlesPaginacion(
        'paginacionCXP',
        'cambiarPaginaCXP'
      );
    }
  } catch (error) {
    console.error('❌ Error al inicializar paginación:', error);
    renderizarFacturasCXP(facturas);
  }
}

// Función para renderizar las facturas (con o sin paginación)
function renderizarFacturasCXP(facturasParaRenderizar = null) {
  // Verificar si estamos en proceso de guardado antes de renderizar
  if (window._cxpGuardandoDatosFlag) {
    console.log('⏸️ Renderizado pausado: guardando datos');
    return;
  }

  const tbody = document.getElementById('tbodyFacturasCXP');
  if (!tbody) {
    return;
  }

  // Si se proporcionan facturas específicas, renderizarlas directamente
  if (facturasParaRenderizar) {
    tbody.innerHTML = '';
    if (facturasParaRenderizar.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="12" class="text-center text-muted">No hay facturas para mostrar</td></tr>';
      return;
    }

    facturasParaRenderizar.forEach(factura => {
      renderizarFilaFacturaCXP(factura, tbody);
    });
    return;
  }

  // Si no se proporcionan, usar paginación
  if (!window._paginacionCXPManager || !window._facturasCXPCompletas) {
    console.warn(
      '⚠️ No se puede renderizar: paginacion=',
      Boolean(window._paginacionCXPManager),
      'facturas=',
      Boolean(window._facturasCXPCompletas)
    );
    return;
  }

  const facturasIds = window._paginacionCXPManager.obtenerRegistrosPagina();
  const facturasMap = {};
  const facturasVistas = new Set(); // Para evitar duplicados por número de factura + proveedor

  // Usar facturas completas que ya están ordenadas (más recientes primero)
  // Aplicar deduplicación aquí también para evitar renderizar duplicados
  window._facturasCXPCompletas.forEach(factura => {
    if (!factura) {
      return;
    }

    const id = String(factura.id || factura.numeroFactura || Date.now() + Math.random());

    // Verificar duplicados por número de factura + proveedor
    const claveUnica = `${String(factura.numeroFactura || '').trim()}_${String(factura.proveedor || '').trim()}_${String(factura.id || '')}`;

    // Solo agregar si no hemos visto esta combinación antes
    if (!facturasVistas.has(claveUnica)) {
      facturasMap[id] = factura;
      facturasVistas.add(claveUnica);
    } else {
      console.warn(
        `⚠️ Duplicado detectado en renderizado: ${factura.numeroFactura} - ${factura.proveedor} - ID: ${factura.id}`
      );
    }
  });

  const facturasPagina = facturasIds
    .map(id => facturasMap[id])
    .filter(factura => factura !== undefined);

  // Aplicar deduplicación final antes de renderizar
  const facturasUnicas = [];
  const facturasRenderizadas = new Set();
  facturasPagina.forEach(factura => {
    const claveUnica = `${String(factura.numeroFactura || '').trim()}_${String(factura.proveedor || '').trim()}`;
    if (!facturasRenderizadas.has(claveUnica)) {
      facturasUnicas.push(factura);
      facturasRenderizadas.add(claveUnica);
    }
  });

  tbody.innerHTML = '';

  if (facturasUnicas.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="12" class="text-center text-muted">No hay facturas para mostrar</td></tr>';
    return;
  }

  facturasUnicas.forEach(factura => {
    renderizarFilaFacturaCXP(factura, tbody);
  });

  // Actualizar controles de paginación
  const contenedorPaginacion = document.getElementById('paginacionCXP');
  if (contenedorPaginacion && window._paginacionCXPManager) {
    contenedorPaginacion.innerHTML = window._paginacionCXPManager.generarControlesPaginacion(
      'paginacionCXP',
      'cambiarPaginaCXP'
    );
  }

  console.log(
    `✅ ${window._paginacionCXPManager.totalRegistros} facturas CXP cargadas (página ${window._paginacionCXPManager.paginaActual} de ${window._paginacionCXPManager.obtenerTotalPaginas()})`
  );
}

// Función auxiliar para renderizar una fila de factura
function renderizarFilaFacturaCXP(factura, tbody) {
  const row = document.createElement('tr');

  // Determinar clase de estado
  let estadoClass = '';
  let estadoText = '';
  switch (factura.estado) {
    case 'pendiente':
      estadoClass = 'status-pendiente';
      estadoText = 'Pendiente';
      break;
    case 'solicitud':
    case 'aprobada': // compatibilidad
      estadoClass = 'status-solicitud';
      estadoText = 'En Solicitud';
      break;
    case 'SR-Pendiente':
      estadoClass = 'status-rechazada';
      estadoText = 'SR-Pendiente';
      break;
    case 'en tesoreria':
      estadoClass = 'status-en-tesoreria';
      estadoText = 'En Tesorería';
      break;
    case 'parcial pagado':
      estadoClass = 'status-parcial-pagado';
      estadoText = 'P-Pagado';
      break;
    case 'pagada':
      estadoClass = 'status-aceptada';
      estadoText = 'Pagada';
      break;
    case 'validada':
      estadoClass = 'status-aceptada';
      estadoText = 'Validada';
      break;
    case 'aceptada': // compatibilidad
      estadoClass = 'status-en-tesoreria';
      estadoText = 'En Tesorería';
      break;
    case 'rechazada':
      estadoClass = 'status-rechazada';
      estadoText = 'Rechazada';
      break;
    default:
      estadoClass = 'status-pendiente';
      estadoText = capitalizeFirst(factura.estado || 'Pendiente');
  }

  // Calcular montos como en CXC
  const montoTotal = factura.monto || 0;
  const montoPagado = factura.montoPagado || 0;
  const montoPendiente =
    factura.montoPendiente !== undefined ? factura.montoPendiente : montoTotal - montoPagado;

  // Determinar si se puede solicitar pago (tiene saldo pendiente)
  const puedeSolicitarPago = montoPendiente > 0;

  // Respetar el estado de la factura - no sobrescribir estados importantes como 'en tesoreria'
  const _estadoFinal = factura.estado;
  let estadoClassFinal = estadoClass;
  let estadoTextFinal = estadoText;

  // Solo actualizar estado automáticamente si no es un estado del flujo de aprobación
  // No sobrescribir estados como 'en tesoreria', 'pagada', 'parcial pagado', etc.
  if (factura.estado === 'aceptada' && montoPendiente > 0) {
    // Compatibilidad: si está en estado antiguo 'aceptada' y tiene pendiente, cambiar a pendiente
    // _estadoFinal no se modifica aquí porque es const
    estadoClassFinal = 'status-pendiente';
    estadoTextFinal = 'Pendiente';
  } else if (
    factura.estado !== 'en tesoreria' &&
    factura.estado !== 'parcial pagado' &&
    factura.estado !== 'pagada' &&
    montoPendiente <= 0
  ) {
    // Solo cambiar a pagada automáticamente si NO está en un estado del flujo de aprobación
    const _estadoFinal = 'pagada';
    estadoClassFinal = 'status-aceptada';
    estadoTextFinal = 'Pagada';
  }

  // Calcular días pendientes usando la misma lógica que CXC
  // Fórmula: fecha vencimiento - fecha actual + 1 = días pendientes
  let diasVencidosTexto = '-';
  if (estadoTextFinal.toLowerCase() !== 'pagada') {
    const diasPendientes = calcularDiasVencidos(factura.fechaVencimiento, factura.estado);

    if (diasPendientes !== null && diasPendientes !== undefined) {
      // Determinar estilo según días vencidos
      let estiloDias = '';
      if (diasPendientes <= 3) {
        // Días negativos al día 3: fondo rojo y letras blancas
        estiloDias =
          'background-color: #dc3545; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;';
      } else if (diasPendientes >= 4 && diasPendientes <= 7) {
        // Días 4 al 7: fondo amarillo y letras blancas
        estiloDias =
          'background-color: #ffc107; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;';
      } else {
        // Día 8 en adelante: sin fondo y letras negras
        estiloDias = 'color: black;';
      }

      diasVencidosTexto = `<span style="${estiloDias}">${diasPendientes} días</span>`;
    }
  }

  row.innerHTML = `
        <td><input type="checkbox" class="chk-factura-cxp" value="${factura.id}" data-proveedor="${factura.rfc || factura.proveedorId || ''}"></td>
        <td><strong>${factura.numeroFactura || '-'}</strong></td>
        <td>${factura.proveedor}</td>
        <td>${formatDate(factura.fechaEmision)}</td>
        <td>${formatDate(factura.fechaVencimiento)}</td>
        <td><span class="badge ${factura.tipoMoneda === 'USD' ? 'bg-warning text-dark' : 'bg-primary'}">${factura.tipoMoneda || 'MXN'}</span></td>
        <td><strong>$${formatCurrency(montoTotal)}</strong></td>
        <td><span class="text-success">$${formatCurrency(montoPagado)}</span></td>
        <td><strong class="${montoPendiente > 0 ? 'text-danger' : 'text-success'}">$${formatCurrency(montoPendiente)}</strong></td>
        <td><span class="status-badge ${estadoClassFinal}">${estadoTextFinal}</span></td>
        <td>${diasVencidosTexto}</td>
        <td>
            <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-primary" onclick="verDetallesFacturaCXP(${factura.id})" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                ${
  puedeSolicitarPago
    ? `
                    <button class="btn btn-sm btn-success" onclick="crearSolicitudPagoFactura(${factura.id})" title="Crear solicitud de pago">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                `
    : ''
}
                <button class="btn btn-sm btn-outline-secondary" onclick="editarFacturaCXP(${factura.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-info" onclick="descargarPDFFacturaCXP(${factura.id})" title="Descargar PDF">
                    <i class="fas fa-file-pdf"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarFacturaCXP(${factura.id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;

  tbody.appendChild(row);
}

// Función helper para cargar proveedores cuando el modal esté visible
async function onModalShownCXP() {
        console.log('📋 Modal de factura completamente visible, cargando proveedores...');

        // Verificar que el select existe
        const selectProveedor = document.getElementById('proveedorFactura');
        if (!selectProveedor) {
          console.error('❌ Select proveedorFactura no encontrado en el DOM');
          // Intentar de nuevo después de un breve delay
          setTimeout(async () => {
            const selectRetry = document.getElementById('proveedorFactura');
            if (selectRetry) {
              console.log('✅ Select encontrado en reintento, cargando proveedores...');
              if (typeof loadProveedoresSelect === 'function') {
                await loadProveedoresSelect('proveedorFactura', 0, 15);
              }
            } else {
              console.error('❌ Select proveedorFactura aún no encontrado después del reintento');
            }
          }, 300);
          return;
        }

        // Asegurar que el select esté habilitado y visible
        selectProveedor.disabled = false;
        selectProveedor.style.display = '';
        selectProveedor.style.visibility = 'visible';

        // Verificar si es un <select> o un <input> (searchable-select)
        const esSelect = selectProveedor.tagName === 'SELECT';
        const esInput = selectProveedor.tagName === 'INPUT';

        console.log('✅ Select encontrado, estado:', {
          tagName: selectProveedor.tagName,
          disabled: selectProveedor.disabled,
          display: selectProveedor.style.display,
          visibility: selectProveedor.style.visibility,
          optionsCount:
            esSelect && selectProveedor.options
              ? selectProveedor.options.length
              : esInput
                ? 'N/A (input)'
                : 'N/A'
        });

        // Cargar proveedores en el select con más reintentos ya que el modal puede abrirse antes de que configuracionManager esté listo
        if (typeof loadProveedoresSelect === 'function') {
          console.log('🔄 Llamando a loadProveedoresSelect...');
          await loadProveedoresSelect('proveedorFactura', 0, 15);

          // Verificar que se cargaron proveedores (solo para <select>, no para <input>)
          const selectDespues = document.getElementById('proveedorFactura');
          if (selectDespues && selectDespues.tagName === 'SELECT' && selectDespues.options) {
            console.log(
              '✅ Proveedores cargados. Total de opciones:',
              selectDespues.options.length
            );
            if (selectDespues.options.length <= 1) {
              console.warn('⚠️ No se cargaron proveedores en el select');
            }
          } else if (selectDespues && selectDespues.tagName === 'INPUT') {
            console.log('✅ Campo de proveedor inicializado (modelo searchable-select)');
          }
        } else {
          console.warn('⚠️ loadProveedoresSelect no está disponible');
        }
}

// Abrir modal nueva factura (versión completa)
window.abrirModalNuevaFactura = function abrirModalNuevaFactura() {
  // Marcar que la función completa está lista
  window.__CXP_MODAL_FUNCTION_READY__ = true;
  console.log('🔓 abrirModalNuevaFactura llamada');

  // Verificar que los elementos estén disponibles
  const form = document.getElementById('formNuevaFactura');
  const modalElement = document.getElementById('modalNuevaFactura');

  if (!form) {
    console.error('❌ Formulario formNuevaFactura no encontrado');
    alert('Error: El formulario no está disponible. Por favor, recarga la página.');
    return;
  }

  if (!modalElement) {
    console.error('❌ Modal modalNuevaFactura no encontrado');
    alert('Error: El modal no está disponible. Por favor, recarga la página.');
    return;
  }

  try {
    // Limpiar formulario
    form.reset();
    editingFacturaId = null;

    // Establecer fecha actual
    const fechaInput = document.getElementById('fechaEmisionFactura');
    if (fechaInput) {
      fechaInput.value = new Date().toISOString().split('T')[0];
    }

    // Reset y evaluar tipo de cambio según moneda por defecto
    const tipoCambioInput = document.getElementById('tipoCambioFactura');
    if (tipoCambioInput) {
      tipoCambioInput.value = '';
    }

    if (typeof toggleTipoCambioFactura === 'function') {
      toggleTipoCambioFactura();
    }

    // Inicializar display del monto total
    const montoTotalInput = document.getElementById('montoFacturaProveedor');
    const montoTotalDisplay = document.getElementById('montoFacturaProveedorDisplay');
    if (montoTotalInput) {
      montoTotalInput.value = '0.00';
    }
    if (montoTotalDisplay) {
      montoTotalDisplay.textContent = formatCurrency(0);
    }

    // Mostrar modal
    const modal = new bootstrap.Modal(modalElement);

    // Cargar proveedores cuando el modal esté completamente visible
    modalElement.addEventListener('shown.bs.modal', onModalShownCXP, { once: true });

    modal.show();
    console.log('✅ Modal abierto');

    // Calcular fecha de vencimiento inicial si hay proveedor seleccionado
    if (typeof actualizarFechaVencimientoFactura === 'function') {
      setTimeout(actualizarFechaVencimientoFactura, 0);
    }

    // Configurar botón de acción a Guardar
    // NOTA: No asignar onclick directamente aquí, el event handler ya lo maneja
    // Esto evita dobles llamadas a la función
    const btn = document.querySelector('#modalNuevaFactura .modal-footer .btn.btn-primary');
    if (btn) {
      btn.innerHTML = '<i class="fas fa-save"></i> Guardar Factura';
      // Remover cualquier onclick previo para evitar duplicados
      btn.onclick = null;
      // El event handler con data-action ya maneja el clic
    }

    // Calcular monto total inicial
    if (typeof calcularMontoTotalFactura === 'function') {
      calcularMontoTotalFactura();
    }
  } catch (error) {
    console.error('❌ Error abriendo modal nueva factura:', error);
    alert('Error al abrir el modal. Por favor, recarga la página.');
  }
};

// Función para calcular el monto total de la factura
window.calcularMontoTotalFactura = function calcularMontoTotalFactura() {
  // Función auxiliar para parsear valores numéricos de forma segura
  const parseSafe = value => {
    const parsed = parseFloat(value || 0);
    return isNaN(parsed) ? 0 : parsed;
  };

  const subtotal = parseSafe(document.getElementById('subtotalFactura')?.value);
  const iva = parseSafe(document.getElementById('ivaFactura')?.value);
  const ivaRetenido = parseSafe(document.getElementById('ivaRetenidoFactura')?.value);
  const isrRetenido = parseSafe(document.getElementById('isrRetenidoFactura')?.value);
  const otrosMontos = parseSafe(document.getElementById('otrosMontosFactura')?.value);

  // Calcular: Subtotal + IVA - IVA Retenido - ISR Retenido + Otros Montos
  const montoTotal = subtotal + iva - ivaRetenido - isrRetenido + otrosMontos;

  const montoTotalInput = document.getElementById('montoFacturaProveedor');
  const montoTotalDisplay = document.getElementById('montoFacturaProveedorDisplay');

  if (montoTotalInput) {
    const safeMonto = isNaN(montoTotal) ? 0 : montoTotal;
    montoTotalInput.value = safeMonto.toFixed(2);

    // Actualizar el display con formato de moneda
    if (montoTotalDisplay) {
      montoTotalDisplay.textContent = formatCurrency(safeMonto);
    }
  }
};

// Guardar nueva factura
async function _guardarNuevaFactura() {
  // Si estamos en modo edición, usar la función de actualización
  if (editingFacturaId) {
    console.log('📝 Modo edición detectado, usando updateFacturaCXP');
    return updateFacturaCXP();
  }

  // Verificar si ya hay una ejecución en proceso
  if (procesandoFactura) {
    console.warn('⚠️ Ya hay una factura siendo procesada, ignorando llamada duplicada');
    return;
  }

  // Marcar como procesando
  procesandoFactura = true;

  // Obtener el botón de guardar y deshabilitarlo para evitar dobles clics
  const btnGuardar = document.querySelector('#modalNuevaFactura .modal-footer .btn.btn-primary');
  const textoOriginal = btnGuardar ? btnGuardar.innerHTML : '';
  const estadoOriginal = btnGuardar ? btnGuardar.disabled : false;

  // Función para restaurar el estado del botón
  const restaurarBoton = () => {
    if (btnGuardar) {
      btnGuardar.disabled = estadoOriginal;
      btnGuardar.innerHTML = textoOriginal;
    }
    procesandoFactura = false;
  };

  // Función para establecer estado de procesando
  const establecerProcesando = () => {
    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    }
  };

  // Establecer estado de procesando al inicio
  establecerProcesando();

  try {
    const form = document.getElementById('formNuevaFactura');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      restaurarBoton();
      return;
    }
    // Asegurar que la fecha de vencimiento esté calculada antes de leer
    actualizarFechaVencimientoFactura();

    const selectProveedor = document.getElementById('proveedorFactura');
    const rfcProveedorInput = document.getElementById('rfcProveedorFactura');

    // Obtener RFC del campo RFC (prioridad) o del campo proveedor
    let rfcProveedor = rfcProveedorInput?.value?.trim() || selectProveedor?.value?.trim() || '';

    // Si el campo proveedor tiene formato "Nombre - RFC", separarlo
    let nombreProveedorRaw = selectProveedor?.value || '';
    if (nombreProveedorRaw && nombreProveedorRaw.includes(' - ')) {
      const partes = nombreProveedorRaw.split(' - ');
      nombreProveedorRaw = partes[0].trim();
      // Si no hay RFC en el campo RFC, usar el de la separación
      if (!rfcProveedor && partes[1]) {
        rfcProveedor = partes[1].trim();
      }
    }

    if (!rfcProveedor) {
      restaurarBoton();
      alert('Error: Por favor selecciona un proveedor');
      return;
    }

    // Obtener el nombre del proveedor del texto del select (más confiable)
    // Verificar si es un <select> tradicional o un <input> searchable-select
    let nombreProveedor = nombreProveedorRaw;
    if (!nombreProveedor && selectProveedor.tagName === 'SELECT' && selectProveedor.options) {
      // Es un <select> tradicional
      const optionSeleccionada = selectProveedor.options[selectProveedor.selectedIndex];
      nombreProveedor = optionSeleccionada ? optionSeleccionada.textContent : null;
      // Separar nombre y RFC si viene en formato "Nombre - RFC"
      if (nombreProveedor && nombreProveedor.includes(' - ')) {
        const partes = nombreProveedor.split(' - ');
        nombreProveedor = partes[0].trim();
      }
    } else if (!nombreProveedor && selectProveedor.tagName === 'INPUT') {
      // Es un <input> searchable-select, el valor ya contiene el nombre (sin RFC si se separó correctamente)
      nombreProveedor = nombreProveedorRaw || selectProveedor.value || null;
    }

    // Intentar obtener proveedor completo desde múltiples fuentes
    let proveedor = null;

    // PRIORIDAD 1: Intentar desde Firebase directamente (igual que en loadProveedoresSelect)
    try {
      if (window.firebaseDb && window.fs) {
        const { doc, getDoc } = window.fs;
        const docRef = doc(window.firebaseDb, 'configuracion', 'proveedores');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          let proveedoresList = [];

          if (data.proveedores && Array.isArray(data.proveedores)) {
            proveedoresList = data.proveedores;
          } else if (data && typeof data === 'object') {
            proveedoresList = Object.values(data);
          }

          proveedor = proveedoresList.find(
            p => p && (p.rfc === rfcProveedor || p.RFC === rfcProveedor)
          );
          if (proveedor) {
            console.log('✅ Proveedor encontrado en Firebase:', proveedor);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Error buscando proveedor en Firebase:', error);
    }

    // PRIORIDAD 2: Intentar desde configuracionManager
    if (
      !proveedor &&
      window.configuracionManager &&
      typeof window.configuracionManager.getProveedor === 'function'
    ) {
      try {
        proveedor = window.configuracionManager.getProveedor(rfcProveedor);
      } catch (error) {
        console.warn('⚠️ Error obteniendo proveedor desde configuracionManager:', error);
      }
    }

    // PRIORIDAD 3: Si no se encuentra el objeto completo, usar el nombre del select
    if (!proveedor || !proveedor.nombre) {
      if (nombreProveedor && nombreProveedor.trim() !== '' && !nombreProveedor.includes('⚠️')) {
        // Crear objeto proveedor básico con la información disponible
        proveedor = {
          rfc: rfcProveedor,
          nombre: nombreProveedor.trim(),
          razonSocial: nombreProveedor.trim()
        };
        console.log('✅ Usando nombre del proveedor del select:', nombreProveedor);
      } else {
        // Si no hay nombre del select, intentar usar el RFC como nombre temporal
        if (rfcProveedor && rfcProveedor.trim() !== '') {
          proveedor = {
            rfc: rfcProveedor,
            nombre: rfcProveedor.trim(),
            razonSocial: rfcProveedor.trim()
          };
          console.log('⚠️ Usando RFC como nombre del proveedor (fallback):', rfcProveedor);
        } else {
          restaurarBoton();
          alert(
            `Error: No se encontró el proveedor con RFC: ${rfcProveedor}\n\nPor favor, verifica que el proveedor esté correctamente registrado en Configuración > Proveedores.`
          );
          return;
        }
      }
    }

    // Verificación final de seguridad
    if (!proveedor || !proveedor.nombre) {
      restaurarBoton();
      alert(
        `Error: No se pudo obtener la información del proveedor.\n\nRFC: ${rfcProveedor}\n\nPor favor, verifica que el proveedor esté correctamente registrado en Configuración > Proveedores.`
      );
      return;
    }

    console.log('✅ Proveedor encontrado:', proveedor);

    // Calcular monto total antes de guardar
    calcularMontoTotalFactura();

    // Función auxiliar para parsear valores numéricos de forma segura
    const parseSafe = value => {
      const parsed = parseFloat(value || 0);
      return isNaN(parsed) ? 0 : parsed;
    };

    const montoTotal = parseSafe(document.getElementById('montoFacturaProveedor').value);

    // Obtener valores de los nuevos campos
    const subtotal = parseSafe(document.getElementById('subtotalFactura').value);
    const iva = parseSafe(document.getElementById('ivaFactura').value);
    const ivaRetenido = parseSafe(document.getElementById('ivaRetenidoFactura')?.value);
    const isrRetenido = parseSafe(document.getElementById('isrRetenidoFactura')?.value);
    const otrosMontos = parseSafe(document.getElementById('otrosMontosFactura')?.value);

    const numeroFactura = document.getElementById('numeroFacturaProveedor').value.trim();

    // Verificar si ya existe una factura con el mismo número
    const facturaExistente = facturasCXP.find(
      f => f.numeroFactura && f.numeroFactura.trim().toUpperCase() === numeroFactura.toUpperCase()
    );

    if (facturaExistente) {
      restaurarBoton();
      alert(
        `⚠️ Ya existe una factura con el número ${numeroFactura}.\n\nProveedor: ${facturaExistente.proveedor}\nFecha: ${facturaExistente.fechaEmision || 'N/A'}\n\nPor favor, verifica el número de factura.`
      );
      return;
    }

    // Separar nombre del proveedor del RFC (si viene en formato "Nombre - RFC")
    let nombreProveedorFinal = proveedor.nombre || nombreProveedor || '';
    let rfcProveedorFinal = rfcProveedor;

    // Si el nombre contiene el RFC, separarlo
    if (nombreProveedorFinal && nombreProveedorFinal.includes(' - ')) {
      const partes = nombreProveedorFinal.split(' - ');
      nombreProveedorFinal = partes[0].trim();
      // Si no hay RFC separado, intentar obtenerlo de la segunda parte
      if (!rfcProveedorFinal && partes[1]) {
        rfcProveedorFinal = partes[1].trim();
      }
    }

    const nuevaFactura = {
      id: Date.now(),
      numeroFactura: numeroFactura,
      folioFiscal: formatearUUID(document.getElementById('folioFiscalFactura')?.value || ''),
      proveedor: nombreProveedorFinal, // Solo el nombre, sin RFC
      rfc: rfcProveedorFinal, // RFC separado
      // NO incluir proveedorId (campo duplicado eliminado)
      fechaEmision: document.getElementById('fechaEmisionFactura').value,
      fechaVencimiento: document.getElementById('fechaVencimientoFactura').value,
      monto: isNaN(montoTotal) ? 0 : montoTotal,
      subtotal: isNaN(subtotal) ? 0 : subtotal,
      iva: isNaN(iva) ? 0 : iva,
      ivaRetenido: isNaN(ivaRetenido) ? 0 : ivaRetenido || 0,
      isrRetenido: isNaN(isrRetenido) ? 0 : isrRetenido || 0,
      otrosMontos: isNaN(otrosMontos) ? 0 : otrosMontos || 0,
      montoPagado: 0, // Inicializar en 0
      montoPendiente: isNaN(montoTotal) ? 0 : montoTotal, // Inicializar con el monto total
      tipoMoneda: document.getElementById('tipoMonedaFactura').value,
      tipoCambio: document.getElementById('tipoCambioFactura').value
        ? parseFloat(document.getElementById('tipoCambioFactura').value)
        : null,
      descripcion: document.getElementById('descripcionFactura').value,
      categoria: document.getElementById('categoriaFactura').value,
      prioridad: document.getElementById('prioridadFactura').value,
      estado: 'pendiente',
      diasVencidos: 0,
      fechaRegistro: new Date().toISOString(),
      fechaCreacion: new Date().toISOString(), // Fecha de creación para ordenamiento
      adjuntos: []
    };

    // Procesar adjuntos (guardar base64, nombre y tipo)
    const { files } = document.getElementById('documentosFactura');
    if (files && files.length > 0) {
      nuevaFactura.adjuntos = [];
      // Nota: por simplicidad, lectura sincrónica con FileReader por archivo
      // En producción se recomienda almacenamiento externo
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Lector síncrono no existe; hacemos lectura secuencial con onload bloqueando push
        // Aquí solo guardamos metadatos; la carga base64 la haremos en update posterior
        nuevaFactura.adjuntos.push({ nombre: file.name, tipo: file.type, size: file.size });
      }
      // Disparar lectura base64 asincrónica y persistir después
      leerYGuardarAdjuntosBase64(files, nuevaFactura.id);
    }

    // Activar flag para evitar que el listener de Firebase interfiera durante el guardado
    // IMPORTANTE: Activar ANTES de cualquier modificación del array
    if (typeof window._cxpGuardandoDatos === 'function') {
      window._cxpGuardandoDatos();
    }

    // NO agregar al array local aquí - dejar que el listener de Firebase lo haga
    // Esto evita duplicados cuando el listener detecta el cambio en Firebase
    // El flag _cxpGuardandoDatos evitará que el listener procese durante el guardado

    // NO USAR localStorage - Solo Firebase es la fuente de verdad
    // Eliminado guardado en localStorage para evitar inconsistencias entre navegadores

    // Guardar en Firebase
    console.log('🔍 Verificando disponibilidad de Firebase...');
    console.log('  - window.firebaseRepos:', Boolean(window.firebaseRepos));
    console.log('  - window.firebaseRepos?.cxp:', Boolean(window.firebaseRepos?.cxp));

    if (window.firebaseRepos && window.firebaseRepos.cxp) {
      try {
        console.log('🔥 Guardando factura en Firebase...');
        console.log('  - Estado del repositorio:', {
          tieneDb: Boolean(window.firebaseRepos.cxp.db),
          tieneTenantId: Boolean(window.firebaseRepos.cxp.tenantId),
          tenantId: window.firebaseRepos.cxp.tenantId,
          collectionName: window.firebaseRepos.cxp.collectionName
        });

        // Esperar a que el repositorio esté inicializado
        let attempts = 0;
        while (
          attempts < 10 &&
          (!window.firebaseRepos.cxp.db || !window.firebaseRepos.cxp.tenantId)
        ) {
          attempts++;
          console.log(`⏳ Esperando inicialización del repositorio CXP... (${attempts}/10)`);
          await new Promise(resolve => setTimeout(resolve, 500));
          await window.firebaseRepos.cxp.init();
        }

        if (window.firebaseRepos.cxp.db && window.firebaseRepos.cxp.tenantId) {
          const facturaId = `factura_${nuevaFactura.id}`;

          // Limpiar campos duplicados antes de guardar
          const facturaParaGuardar = { ...nuevaFactura };
          delete facturaParaGuardar.proveedorId; // Eliminar campo duplicado

          console.log('💾 Guardando factura en Firebase:', facturaId);
          console.log('  - Datos de la factura:', {
            id: facturaParaGuardar.id,
            numeroFactura: facturaParaGuardar.numeroFactura,
            proveedor: facturaParaGuardar.proveedor,
            rfc: facturaParaGuardar.rfc,
            monto: facturaParaGuardar.monto
          });

          const resultado = await window.firebaseRepos.cxp.saveFactura(
            facturaId,
            facturaParaGuardar
          );
          if (resultado) {
            console.log('✅ Factura guardada exitosamente en Firebase:', facturaId);
            // Factura guardada correctamente, continuar con recarga inmediata
          } else {
            console.warn('⚠️ No se pudo guardar en Firebase (resultado fue false)');
            // Si falla, continuar con el flujo de espera
          }
        } else {
          console.warn('⚠️ Repositorio CXP no inicializado completamente después de esperar:', {
            tieneDb: Boolean(window.firebaseRepos.cxp.db),
            tieneTenantId: Boolean(window.firebaseRepos.cxp.tenantId)
          });
        }
      } catch (error) {
        console.error('❌ Error guardando factura en Firebase:', error);
        console.error('  - Mensaje:', error.message);
        console.error('  - Stack:', error.stack);
        // Si Firebase falla, agregar localmente como fallback
        console.warn('⚠️ Error al guardar en Firebase, agregando localmente como fallback');
        const facturaExistentePorId = facturasCXP.find(f => f.id === nuevaFactura.id);
        if (!facturaExistentePorId) {
          facturasCXP.push(nuevaFactura);
          // NO renderizar aquí - solo agregar al array, la recarga mostrará todo
        }
        // Continuar con el flujo de recarga incluso si falla
      }
    } else {
      console.warn('⚠️ Repositorio de Firebase CXP no disponible');
      console.warn('  - window.firebaseRepos existe:', Boolean(window.firebaseRepos));
      console.warn('  - window.firebaseRepos?.cxp existe:', Boolean(window.firebaseRepos?.cxp));

      // Intentar esperar un poco más y verificar de nuevo
      console.log('⏳ Esperando 2 segundos y reintentando...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (window.firebaseRepos && window.firebaseRepos.cxp) {
        console.log('✅ Repositorio disponible después de esperar, guardando...');
        try {
          const facturaId = `factura_${nuevaFactura.id}`;
          const resultado = await window.firebaseRepos.cxp.saveFactura(facturaId, nuevaFactura);
          if (resultado) {
            console.log('✅ Factura guardada exitosamente en Firebase (reintento):', facturaId);
          } else {
            // Si Firebase no está disponible después del reintento, agregar localmente como fallback
            console.warn(
              '⚠️ No se pudo guardar en Firebase después del reintento, agregando localmente'
            );
            const facturaExistentePorId = facturasCXP.find(f => f.id === nuevaFactura.id);
            if (!facturaExistentePorId) {
              facturasCXP.push(nuevaFactura);
              loadFacturasCXP();
              updateCXPMetrics();
            }
          }
        } catch (error) {
          console.error('❌ Error en reintento:', error);
          // Si Firebase falla, agregar localmente como fallback
          console.warn('⚠️ Error al guardar en Firebase, agregando localmente como fallback');
          const facturaExistentePorId = facturasCXP.find(f => f.id === nuevaFactura.id);
          if (!facturaExistentePorId) {
            facturasCXP.push(nuevaFactura);
            loadFacturasCXP();
            updateCXPMetrics();
          }
        }
      } else {
        // Si Firebase no está disponible, agregar localmente como fallback
        console.warn('⚠️ Firebase no está disponible, agregando factura localmente como fallback');
        const facturaExistentePorId = facturasCXP.find(f => f.id === nuevaFactura.id);
        if (!facturaExistentePorId) {
          facturasCXP.push(nuevaFactura);
          loadFacturasCXP();
          updateCXPMetrics();
        }
      }
    }

    // Mantener el botón en estado procesando hasta que se recargue la página
    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    }

    // Cerrar modal inmediatamente
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevaFactura'));
    if (modal) {
      modal.hide();
    }

    // Limpiar filtros para mostrar todas las facturas cuando se recargue
    facturasFiltradas = [];

    // Recargar inmediatamente después de guardar
    // El flag permanece activo, evitando que el listener renderice antes de la recarga
    // Firebase ya guardó la factura (await saveFactura), así que es seguro recargar
    console.log('🔄 Recargando página inmediatamente (flag activo, listener bloqueado)...');

    // Recargar la página completa - el flag se reseteará cuando la página se recargue
    // Esto evita cualquier renderizado intermedio del listener
    window.location.reload();
  } catch (error) {
    // En caso de error, restaurar el botón y mostrar mensaje
    console.error('❌ Error guardando factura:', error);
    restaurarBoton();
    alert(`Error al guardar la factura: ${error.message || 'Error desconocido'}`);
  }
}

// Leer archivos seleccionados, convertir a base64 y adjuntarlos a la factura por id
function leerYGuardarAdjuntosBase64(fileList, facturaId) {
  const readers = [];
  const adjuntos = [];
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    readers.push(
      new Promise(resolve => {
        const fr = new FileReader();
        fr.onload = () => {
          adjuntos.push({ nombre: file.name, tipo: file.type, size: file.size, base64: fr.result });
          resolve();
        };
        fr.onerror = () => resolve();
        fr.readAsDataURL(file);
      })
    );
  }
  Promise.all(readers).then(() => {
    facturasCXP = facturasCXP.map(f => (f.id === facturaId ? { ...f, adjuntos } : f));
    saveCXPData();
    console.log('📎 Adjuntos guardados para factura', facturaId, adjuntos);
  });
}

// Editar factura: abrir modal con datos y preparar actualización
async function _editarFacturaCXP(id) {
  const factura = facturasCXP.find(f => f.id === id);
  if (!factura) {
    return;
  }
  editingFacturaId = id;

  // Preparar selects
  await loadProveedoresSelect('proveedorFactura');

  // Esperar un momento para que el componente searchable-select se inicialice completamente
  await new Promise(resolve => setTimeout(resolve, 300));

  // Prefill
  const rfcProveedor = factura.rfc || factura.proveedorId || '';
  const nombreProveedor = factura.proveedor || '';

  // Actualizar el campo del proveedor (solo nombre)
  const proveedorInput = document.getElementById('proveedorFactura');
  if (proveedorInput) {
    proveedorInput.value = nombreProveedor;
    console.log('✅ Nombre del proveedor prellenado:', nombreProveedor);
  }

  // Actualizar el hidden input con el RFC (necesario para el componente searchable-select)
  const hiddenInput = document.getElementById('proveedorFactura_value');
  if (hiddenInput && rfcProveedor) {
    hiddenInput.value = rfcProveedor;
    console.log('✅ RFC del proveedor guardado en hidden input:', rfcProveedor);
  }

  // Actualizar el campo RFC visible
  const rfcInput = document.getElementById('rfcProveedorFactura');
  if (rfcInput && rfcProveedor) {
    rfcInput.value = rfcProveedor;
    console.log('✅ RFC del proveedor guardado en campo RFC:', rfcProveedor);
  }

  // Disparar evento input para que el componente searchable-select reconozca el cambio
  if (proveedorInput) {
    proveedorInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  document.getElementById('numeroFacturaProveedor').value = factura.numeroFactura;

  // Llenar Folio Fiscal (UUID) - formatear si existe
  const folioFiscalInput = document.getElementById('folioFiscalFactura');
  if (folioFiscalInput && factura.folioFiscal) {
    // Usar el valor formateado si existe, o el valor original
    const folioFiscalValue =
      typeof formatearUUID === 'function'
        ? formatearUUID(factura.folioFiscal)
        : factura.folioFiscal;
    folioFiscalInput.value = folioFiscalValue;
  } else if (folioFiscalInput) {
    folioFiscalInput.value = '';
  }

  document.getElementById('fechaEmisionFactura').value = factura.fechaEmision;
  document.getElementById('fechaVencimientoFactura').value = factura.fechaVencimiento;

  // Cargar nuevos campos de desglose (si existen, usar valores guardados; si no, calcular desde monto)
  if (factura.subtotal !== undefined) {
    document.getElementById('subtotalFactura').value = factura.subtotal;
  } else {
    // Si no hay subtotal guardado, estimar desde el monto (asumiendo 16% IVA)
    const montoSinIva = factura.monto / 1.16;
    document.getElementById('subtotalFactura').value = montoSinIva.toFixed(2);
  }

  if (factura.iva !== undefined) {
    document.getElementById('ivaFactura').value = factura.iva;
  } else {
    // Si no hay IVA guardado, calcular desde el monto
    const montoSinIva = factura.monto / 1.16;
    document.getElementById('ivaFactura').value = (factura.monto - montoSinIva).toFixed(2);
  }

  document.getElementById('ivaRetenidoFactura').value = factura.ivaRetenido || 0;
  document.getElementById('isrRetenidoFactura').value = factura.isrRetenido || 0;
  document.getElementById('otrosMontosFactura').value = factura.otrosMontos || 0;

  // Calcular y mostrar monto total
  calcularMontoTotalFactura();

  document.getElementById('tipoMonedaFactura').value = factura.tipoMoneda || 'MXN';
  toggleTipoCambioFactura();
  document.getElementById('tipoCambioFactura').value =
    factura.tipoCambio != null ? factura.tipoCambio : '';
  document.getElementById('descripcionFactura').value = factura.descripcion || '';
  document.getElementById('categoriaFactura').value = factura.categoria || 'servicios';
  document.getElementById('prioridadFactura').value = factura.prioridad || 'normal';
  // Limpia input de archivos al editar
  const archivosInput = document.getElementById('documentosFactura');
  if (archivosInput) {
    archivosInput.value = '';
  }

  // Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById('modalNuevaFactura'));
  modal.show();

  // Configurar botón a Actualizar
  const btn = document.querySelector('#modalNuevaFactura .modal-footer .btn.btn-primary');
  if (btn) {
    btn.innerHTML = '<i class="fas fa-save"></i> Actualizar Factura';
    // Remover cualquier onclick previo y asignar la función de actualización
    btn.onclick = null;
    btn.onclick = updateFacturaCXP;
    // También remover el atributo data-action para evitar que el event handler lo capture
    btn.removeAttribute('data-action');
  }
}

async function updateFacturaCXP() {
  // Verificar si ya hay una ejecución en proceso
  if (procesandoFactura) {
    console.warn('⚠️ Ya hay una factura siendo procesada, ignorando llamada duplicada');
    return;
  }

  if (!editingFacturaId) {
    console.warn('⚠️ No hay factura en modo edición');
    return;
  }

  // Marcar como procesando
  procesandoFactura = true;

  // Obtener el botón de guardar y deshabilitarlo para evitar dobles clics
  const btnGuardar = document.querySelector('#modalNuevaFactura .modal-footer .btn.btn-primary');
  const textoOriginal = btnGuardar ? btnGuardar.innerHTML : '';
  const estadoOriginal = btnGuardar ? btnGuardar.disabled : false;

  // Función para restaurar el estado del botón
  const restaurarBoton = () => {
    if (btnGuardar) {
      btnGuardar.disabled = estadoOriginal;
      btnGuardar.innerHTML = textoOriginal;
    }
    procesandoFactura = false;
  };

  // Función para establecer estado de procesando
  const establecerProcesando = () => {
    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    }
  };

  // Establecer estado de procesando al inicio
  establecerProcesando();

  try {
    const form = document.getElementById('formNuevaFactura');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      restaurarBoton();
      return;
    }
    actualizarFechaVencimientoFactura();

    // Obtener el RFC del proveedor - PRIORIDAD 1: Campo RFC visible
    let rfcProveedor = '';
    const rfcInput = document.getElementById('rfcProveedorFactura');
    if (rfcInput && rfcInput.value) {
      rfcProveedor = rfcInput.value.trim();
      console.log('✅ RFC obtenido del campo RFC visible:', rfcProveedor);
    }

    // Obtener el elemento del proveedor (necesario para obtener el nombre más adelante)
    const proveedorElement = document.getElementById('proveedorFactura');

    // PRIORIDAD 2: Hidden input (para searchable-select)
    if (!rfcProveedor && proveedorElement) {
      if (proveedorElement.tagName === 'SELECT') {
        rfcProveedor = proveedorElement.value || '';
      } else if (proveedorElement.tagName === 'INPUT') {
        const hiddenInput = document.getElementById('proveedorFactura_value');
        if (hiddenInput && hiddenInput.value) {
          rfcProveedor = hiddenInput.value.trim();
          console.log('✅ RFC obtenido del hidden input:', rfcProveedor);
        }
      }
    }

    if (!rfcProveedor) {
      restaurarBoton();
      alert('Error: Por favor selecciona un proveedor');
      return;
    }

    // Obtener el nombre del proveedor del texto del select (más confiable)
    let nombreProveedor = null;
    if (proveedorElement && proveedorElement.tagName === 'SELECT' && proveedorElement.options) {
      const optionSeleccionada = proveedorElement.options[proveedorElement.selectedIndex];
      nombreProveedor = optionSeleccionada ? optionSeleccionada.textContent : null;
      // Separar nombre y RFC si viene en formato "Nombre - RFC"
      if (nombreProveedor && nombreProveedor.includes(' - ')) {
        const partes = nombreProveedor.split(' - ');
        nombreProveedor = partes[0].trim();
        if (!rfcProveedor && partes[1]) {
          rfcProveedor = partes[1].trim();
        }
      }
    } else if (proveedorElement && proveedorElement.tagName === 'INPUT') {
      nombreProveedor = proveedorElement.value || null;
      // Separar nombre y RFC si viene en formato "Nombre - RFC"
      if (nombreProveedor && nombreProveedor.includes(' - ')) {
        const partes = nombreProveedor.split(' - ');
        nombreProveedor = partes[0].trim();
        if (!rfcProveedor && partes[1]) {
          rfcProveedor = partes[1].trim();
        }
      }
    }

    // Si no se obtuvo el nombre del elemento, usar el valor del campo directamente
    if (!nombreProveedor && proveedorElement) {
      nombreProveedor = proveedorElement.value || null;
    }

    // Intentar obtener proveedor completo desde múltiples fuentes
    let proveedor = null;

    // PRIORIDAD 1: Intentar desde Firebase directamente (igual que en loadProveedoresSelect)
    try {
      if (window.firebaseDb && window.fs) {
        const { doc, getDoc } = window.fs;
        const docRef = doc(window.firebaseDb, 'configuracion', 'proveedores');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          let proveedoresList = [];

          if (data.proveedores && Array.isArray(data.proveedores)) {
            proveedoresList = data.proveedores;
          } else if (data && typeof data === 'object') {
            proveedoresList = Object.values(data);
          }

          proveedor = proveedoresList.find(
            p => p && (p.rfc === rfcProveedor || p.RFC === rfcProveedor)
          );
          if (proveedor) {
            console.log('✅ Proveedor encontrado en Firebase (update):', proveedor);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Error buscando proveedor en Firebase (update):', error);
    }

    // PRIORIDAD 2: Intentar desde configuracionManager
    if (
      !proveedor &&
      window.configuracionManager &&
      typeof window.configuracionManager.getProveedor === 'function'
    ) {
      try {
        proveedor = window.configuracionManager.getProveedor(rfcProveedor);
      } catch (error) {
        console.warn('⚠️ Error obteniendo proveedor desde configuracionManager (update):', error);
      }
    }

    // PRIORIDAD 3: Si no se encuentra el objeto completo, usar el nombre del select
    if (!proveedor || !proveedor.nombre) {
      if (nombreProveedor && nombreProveedor.trim() !== '' && !nombreProveedor.includes('⚠️')) {
        // Crear objeto proveedor básico con la información disponible
        proveedor = {
          rfc: rfcProveedor,
          nombre: nombreProveedor.trim(),
          razonSocial: nombreProveedor.trim()
        };
        console.log('✅ Usando nombre del proveedor del select (update):', nombreProveedor);
      } else {
        restaurarBoton();
        alert(
          `Error: No se encontró el proveedor con RFC: ${rfcProveedor}\n\nPor favor, verifica que el proveedor esté correctamente registrado en Configuración > Proveedores.`
        );
        return;
      }
    }

    console.log('✅ Proveedor encontrado (update):', proveedor);

    // Calcular monto total antes de actualizar
    calcularMontoTotalFactura();
    const montoTotalInput = document.getElementById('montoFacturaProveedor');
    const montoTotal = parseSafe(montoTotalInput ? montoTotalInput.value : '0');

    // Obtener valores de los nuevos campos
    const subtotal = parseFloat(document.getElementById('subtotalFactura').value);
    const iva = parseFloat(document.getElementById('ivaFactura').value);
    const ivaRetenido = parseFloat(document.getElementById('ivaRetenidoFactura')?.value || 0);
    const isrRetenido = parseFloat(document.getElementById('isrRetenidoFactura')?.value || 0);
    const otrosMontos = parseFloat(document.getElementById('otrosMontosFactura')?.value || 0);

    // Obtener monto pagado original para recalcular pendiente
    const facturaOriginal = facturasCXP.find(f => f.id === editingFacturaId);
    if (!facturaOriginal) {
      restaurarBoton();
      alert('Error: No se encontró la factura a actualizar');
      return;
    }

    const montoPagadoOriginal = facturaOriginal.montoPagado || 0;
    const numeroFactura = document.getElementById('numeroFacturaProveedor').value.trim();

    // Verificar si el número de factura cambió y si ya existe otro registro con ese número
    if (numeroFactura !== facturaOriginal.numeroFactura) {
      const facturaExistente = facturasCXP.find(
        f =>
          f.id !== editingFacturaId &&
          f.numeroFactura &&
          f.numeroFactura.trim().toUpperCase() === numeroFactura.toUpperCase()
      );

      if (facturaExistente) {
        restaurarBoton();
        alert(
          `⚠️ Ya existe otra factura con el número ${numeroFactura}.\n\nProveedor: ${facturaExistente.proveedor}\nFecha: ${facturaExistente.fechaEmision || 'N/A'}\n\nPor favor, verifica el número de factura.`
        );
        return;
      }
    }

    // Actualizar la factura existente (no crear una nueva)
    facturasCXP = facturasCXP.map(f => {
      if (f.id !== editingFacturaId) {
        return f;
      }
      // Separar nombre del proveedor del RFC (si viene en formato "Nombre - RFC")
      let nombreProveedorFinal = proveedor.nombre || nombreProveedor || '';
      let rfcProveedorFinal = rfcProveedor;

      // Si el nombre contiene el RFC, separarlo
      if (nombreProveedorFinal && nombreProveedorFinal.includes(' - ')) {
        const partes = nombreProveedorFinal.split(' - ');
        nombreProveedorFinal = partes[0].trim();
        if (!rfcProveedorFinal && partes[1]) {
          rfcProveedorFinal = partes[1].trim();
        }
      }

      // Eliminar proveedorId del objeto original antes de actualizar
      const { proveedorId, ...fSinProveedorId } = f;

      const actualizado = {
        ...fSinProveedorId,
        numeroFactura: numeroFactura,
        folioFiscal: formatearUUID(
          document.getElementById('folioFiscalFactura')?.value || f.folioFiscal || ''
        ),
        proveedor: nombreProveedorFinal, // Solo el nombre, sin RFC
        rfc: rfcProveedorFinal, // RFC separado
        // NO incluir proveedorId (campo duplicado eliminado)
        fechaEmision: document.getElementById('fechaEmisionFactura').value,
        fechaVencimiento: document.getElementById('fechaVencimientoFactura').value,
        monto: isNaN(montoTotal) ? 0 : montoTotal,
        subtotal: isNaN(subtotal) ? 0 : subtotal,
        iva: isNaN(iva) ? 0 : iva,
        ivaRetenido: isNaN(ivaRetenido) ? 0 : ivaRetenido || 0,
        isrRetenido: isNaN(isrRetenido) ? 0 : isrRetenido || 0,
        otrosMontos: isNaN(otrosMontos) ? 0 : otrosMontos || 0,
        montoPagado: montoPagadoOriginal, // Mantener el monto pagado
        montoPendiente:
          (isNaN(montoTotal) ? 0 : montoTotal) -
          (isNaN(montoPagadoOriginal) ? 0 : montoPagadoOriginal), // Recalcular pendiente
        tipoMoneda: document.getElementById('tipoMonedaFactura').value,
        tipoCambio: document.getElementById('tipoCambioFactura').value
          ? parseFloat(document.getElementById('tipoCambioFactura').value)
          : null,
        descripcion: document.getElementById('descripcionFactura').value,
        categoria: document.getElementById('categoriaFactura').value,
        prioridad: document.getElementById('prioridadFactura').value,
        // Mantener campos importantes que no se editan
        fechaCreacion: f.fechaCreacion || f.fechaRegistro || new Date().toISOString(),
        fechaRegistro: f.fechaRegistro || f.fechaCreacion || new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      };
      // Si se subieron nuevos archivos, reemplazar adjuntos
      const nuevosArchivos = document.getElementById('documentosFactura').files;
      if (nuevosArchivos && nuevosArchivos.length > 0) {
        actualizado.adjuntos = [];
        leerYGuardarAdjuntosBase64(nuevosArchivos, editingFacturaId);
      } else {
        // Mantener los adjuntos existentes si no se subieron nuevos
        actualizado.adjuntos = f.adjuntos || [];
      }
      return actualizado;
    });

    // NO USAR localStorage - Solo Firebase es la fuente de verdad
    // Eliminado guardado en localStorage para evitar inconsistencias entre navegadores

    // Guardar en Firebase
    if (window.firebaseRepos && window.firebaseRepos.cxp) {
      try {
        const facturaId = `factura_${editingFacturaId}`;
        const facturaActualizada = facturasCXP.find(f => f.id === editingFacturaId);
        if (facturaActualizada) {
          // Limpiar campos duplicados antes de guardar
          const facturaParaGuardar = { ...facturaActualizada };
          delete facturaParaGuardar.proveedorId; // Eliminar campo duplicado

          await window.firebaseRepos.cxp.saveFactura(facturaId, facturaParaGuardar);
          console.log('✅ Factura actualizada en Firebase:', facturaId);
        }
      } catch (error) {
        console.error('❌ Error actualizando factura en Firebase:', error);
      }
    }

    // Mantener el botón en estado procesando hasta que se recargue la página
    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    }

    // Cerrar modal antes de recargar
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevaFactura'));
    if (modal) {
      modal.hide();
    }

    // Limpiar filtros para mostrar todas las facturas cuando se recargue
    facturasFiltradas = [];

    // Mantener el botón en estado procesando hasta que se recargue la página
    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    }

    // Cerrar modal inmediatamente
    const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalNuevaFactura'));
    if (modalInstance) {
      modalInstance.hide();
    }

    // Limpiar filtros para mostrar todas las facturas cuando se recargue
    facturasFiltradas = [];

    // Recargar inmediatamente después de actualizar
    // El flag permanece activo, evitando que el listener renderice antes de la recarga
    // Firebase ya actualizó la factura (await saveFactura), así que es seguro recargar
    console.log('🔄 Recargando página inmediatamente (flag activo, listener bloqueado)...');

    // Recargar la página completa - el flag se reseteará cuando la página se recargue
    // Esto evita cualquier renderizado intermedio del listener
    window.location.reload();

    const _facturaIdGuardado = editingFacturaId;
    editingFacturaId = null;
    procesandoFactura = false;

    // Recargar página después de actualizar
    setTimeout(() => {
      window.location.reload();
    }, 500);
  } catch (error) {
    // En caso de error, restaurar el botón y mostrar mensaje
    console.error('❌ Error actualizando factura:', error);
    restaurarBoton();
    alert(`Error al actualizar la factura: ${error.message || 'Error desconocido'}`);
  }
}

// ===== GESTIÓN DE PROVEEDORES =====
// Los proveedores ahora se gestionan desde configuracion.html
// Esta sección se mantiene para compatibilidad con la interfaz

// Cargar proveedores en la tabla (desde configuracion)
async function loadProveedoresCXP() {
  const tbody = document.getElementById('tbodyProveedoresCXP');
  if (!tbody) {
    return;
  }

  tbody.innerHTML =
    '<tr><td colspan="7" class="text-center text-muted">Cargando proveedores...</td></tr>';

  try {
    // Usar sistema de caché inteligente: Firebase primero, luego caché
    const proveedores = await window.getDataWithCache('proveedores', async () => {
      // Verificar que configuracionManager esté disponible
      let todosLosProveedores = {};
      if (
        window.configuracionManager &&
        typeof window.configuracionManager.getProveedores === 'function'
      ) {
        todosLosProveedores = window.configuracionManager.getProveedores() || {};
      } else {
        // Esperar a que configuracionManager esté disponible
        let attempts = 0;
        while (
          attempts < 10 &&
          (!window.configuracionManager ||
            typeof window.configuracionManager.getProveedores !== 'function')
        ) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (
          window.configuracionManager &&
          typeof window.configuracionManager.getProveedores === 'function'
        ) {
          todosLosProveedores = window.configuracionManager.getProveedores() || {};
        }
      }

      // Convertir a array para filtrar
      let proveedoresArray = Array.isArray(todosLosProveedores)
        ? todosLosProveedores
        : Object.values(todosLosProveedores);

      // CRÍTICO: Filtrar por tenantId
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

      proveedoresArray = proveedoresArray.filter(proveedor => {
        const proveedorTenantId = proveedor.tenantId;
        return proveedorTenantId === tenantId;
      });

      console.log(
        `🔒 Proveedores filtrados por tenantId (${tenantId}): ${proveedoresArray.length} de ${Array.isArray(todosLosProveedores) ? todosLosProveedores.length : Object.keys(todosLosProveedores).length} totales`
      );

      // Convertir de vuelta a objeto
      const proveedoresObj = {};
      proveedoresArray.forEach(p => {
        if (p.rfc) {
          proveedoresObj[p.rfc] = p;
        }
      });

      return proveedoresObj;
    });

    if (
      !proveedores ||
      (typeof proveedores === 'object' && Object.keys(proveedores).length === 0)
    ) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center text-muted">No hay proveedores registrados. Ve a Configuración para agregar proveedores.</td></tr>';
      return;
    }

    Object.keys(proveedores).forEach(rfc => {
      const proveedor = proveedores[rfc];
      const row = document.createElement('tr');

      row.innerHTML = `
                <td><strong>${proveedor.nombre}</strong></td>
                <td>${rfc}</td>
                <td>${proveedor.contacto || '-'}</td>
                <td>${proveedor.telefono || '-'}</td>
                <td>${proveedor.email || '-'}</td>
                <td><span class="badge ${proveedor.estado === 'activo' ? 'bg-success' : 'bg-secondary'}">${proveedor.estado}</span></td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="verDetallesProveedorCXP('${rfc}')" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="editarProveedorCXP('${rfc}')" title="Editar en Configuración">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            `;

      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('❌ Error cargando proveedores desde configuracion:', error);
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center text-danger">Error cargando proveedores</td></tr>';
  }
}

// Abrir modal nuevo proveedor (redirigir a configuracion)
function _abrirModalNuevoProveedor() {
  if (
    confirm(
      'Los proveedores se gestionan en la sección de Configuración. ¿Deseas ir a Configuración?'
    )
  ) {
    window.location.href = 'configuracion.html#proveedores';
  }
}

// Funciones placeholder para compatibilidad
function ensureProveedorDetalleModal() {
  const modal = document.getElementById('modalDetalleProveedor');
  if (modal) {
    return modal;
  }
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
        <div class="modal fade" id="modalDetalleProveedor" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="fas fa-building"></i> Detalle del Proveedor</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="detalleProveedorBody"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>`;
  document.body.appendChild(wrapper.firstElementChild);
  return document.getElementById('modalDetalleProveedor');
}

function _verDetallesProveedorCXP(rfc) {
  // Verificar que configuracionManager esté disponible
  if (
    !window.configuracionManager ||
    typeof window.configuracionManager.getProveedor !== 'function'
  ) {
    showNotification('Sistema de configuración no disponible', 'error');
    return;
  }

  const proveedor = window.configuracionManager.getProveedor(rfc);
  if (!proveedor) {
    showNotification('Proveedor no encontrado', 'warning');
    return;
  }

  const modalEl = ensureProveedorDetalleModal();
  const body = modalEl.querySelector('#detalleProveedorBody');

  const detallesHtml = `
        <div class="row g-3">
            <div class="col-md-6">
                <strong><i class="fas fa-building me-2"></i>Nombre:</strong>
                <p>${proveedor.nombre}</p>
            </div>
            <div class="col-md-6">
                <strong><i class="fas fa-id-card me-2"></i>RFC:</strong>
                <p>${rfc}</p>
            </div>
            <div class="col-md-6">
                <strong><i class="fas fa-user me-2"></i>Contacto:</strong>
                <p>${proveedor.contacto || 'No especificado'}</p>
            </div>
            <div class="col-md-6">
                <strong><i class="fas fa-phone me-2"></i>Teléfono:</strong>
                <p>${proveedor.telefono || 'No especificado'}</p>
            </div>
            <div class="col-md-6">
                <strong><i class="fas fa-envelope me-2"></i>Email:</strong>
                <p>${proveedor.email || 'No especificado'}</p>
            </div>
            <div class="col-md-6">
                <strong><i class="fas fa-info-circle me-2"></i>Estado:</strong>
                <p><span class="badge ${proveedor.estado === 'activo' ? 'bg-success' : 'bg-secondary'}">${proveedor.estado}</span></p>
            </div>
            <div class="col-md-6">
                <strong><i class="fas fa-calendar me-2"></i>Días de Crédito:</strong>
                <p>${proveedor.diasCredito || 30} días</p>
            </div>
            <div class="col-md-6">
                <strong><i class="fas fa-university me-2"></i>Banco:</strong>
                <p>${proveedor.banco || 'No especificado'}</p>
            </div>
            <div class="col-md-6">
                <strong><i class="fas fa-credit-card me-2"></i>Cuenta:</strong>
                <p>${proveedor.cuenta || 'No especificado'}</p>
            </div>
            <div class="col-12">
                <strong><i class="fas fa-map-marker-alt me-2"></i>Dirección:</strong>
                <p>${proveedor.direccion || 'No especificada'}</p>
            </div>
        </div>
    `;

  body.innerHTML = detallesHtml;
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

function _editarProveedorCXP(_rfc) {
  if (confirm('¿Deseas ir a Configuración para editar este proveedor?')) {
    window.location.href = 'configuracion.html#proveedores';
  }
}

// Cargar proveedores en selects
async function loadProveedoresSelects() {
  // Esperar a que configuracionManager esté disponible
  if (
    !window.configuracionManager ||
    typeof window.configuracionManager.getProveedores !== 'function'
  ) {
    console.log('⏳ Esperando configuracionManager para cargar proveedores...');
    let intentos = 0;
    const maxIntentos = 30; // Aumentado a 30 intentos (15 segundos)

    const verificar = async () => {
      intentos++;
      if (
        window.configuracionManager &&
        typeof window.configuracionManager.getProveedores === 'function'
      ) {
        console.log('✅ configuracionManager disponible, cargando proveedores...');
        // Usar maxRetries más bajo ya que ya esperamos aquí
        await loadProveedoresSelect('proveedorFactura', 0, 5);
        await loadProveedoresSelect('proveedorSolicitud', 0, 5);
        await loadProveedoresSelect('filtroProveedor', 0, 5);
      } else if (intentos < maxIntentos) {
        setTimeout(verificar, 500);
      } else {
        console.warn(
          '⚠️ configuracionManager no disponible después de 15 segundos, intentando cargar proveedores de todas formas...'
        );
        // Dar más intentos adicionales cuando se llama desde aquí
        await loadProveedoresSelect('proveedorFactura', 0, 10);
        await loadProveedoresSelect('proveedorSolicitud', 0, 10);
        await loadProveedoresSelect('filtroProveedor', 0, 10);
      }
    };

    verificar();
  } else {
    // Si ya está disponible, cargar directamente con menos reintentos
    await loadProveedoresSelect('proveedorFactura', 0, 5);
    await loadProveedoresSelect('proveedorSolicitud', 0, 5);
    await loadProveedoresSelect('filtroProveedor', 0, 5);
  }
}

async function loadProveedoresSelect(selectId, retryCount = 0, maxRetries = 10) {
  const elemento = document.getElementById(selectId);
  if (!elemento) {
    // Si no se encuentra y aún hay reintentos disponibles, intentar de nuevo
    if (retryCount < maxRetries) {
      setTimeout(() => {
        loadProveedoresSelect(selectId, retryCount + 1, maxRetries);
      }, 500);
      return;
    }
    // No mostrar warning si el elemento no existe (puede ser que el modal no esté abierto)
    if (retryCount === 0) {
      console.warn(`⚠️ Elemento ${selectId} no encontrado después de ${retryCount + 1} intentos`);
    }
    return;
  }

  // Si es un INPUT (nuevo modelo searchable-select), no hacer nada aquí
  // La inicialización la maneja searchable-select-proveedores.js
  if (elemento.tagName === 'INPUT') {
    // Si hay función de refresh disponible, llamarla
    if (
      selectId === 'proveedorFactura' &&
      typeof window.refreshSearchableSelectProveedoresCXP === 'function'
    ) {
      console.log(
        `ℹ️ Campo ${selectId} usa el nuevo modelo searchable-select, refrescando datos...`
      );
      await window.refreshSearchableSelectProveedoresCXP(selectId);
    } else {
      console.log(
        `ℹ️ Campo ${selectId} usa el nuevo modelo searchable-select, la inicialización la maneja searchable-select-proveedores.js`
      );
    }
    return;
  }

  // Continuar con el código legacy para <select>
  const select = elemento;

  console.log(
    `📋 Cargando proveedores en ${selectId} (intento ${retryCount + 1}/${maxRetries + 1})`
  );

  // Asegurar que el select esté habilitado y visible
  select.disabled = false;
  select.style.display = '';
  select.style.visibility = 'visible';
  select.removeAttribute('readonly');

  // Limpiar opciones existentes (excepto la primera)
  while (select.children.length > 1) {
    select.removeChild(select.lastChild);
  }

  // Función auxiliar para cargar proveedores desde localStorage
  const loadProveedoresFromStorage = () => {
    try {
      const proveedoresData = localStorage.getItem('erp_proveedores');
      if (!proveedoresData) {
        console.warn(`⚠️ No hay proveedores en localStorage para cargar en ${selectId}`);
        return false;
      }

      const proveedores = JSON.parse(proveedoresData);
      let proveedoresArray = [];

      if (Array.isArray(proveedores)) {
        proveedoresArray = proveedores;
      } else if (proveedores && typeof proveedores === 'object') {
        proveedoresArray = Object.values(proveedores);
      }

      if (proveedoresArray.length === 0) {
        console.warn(`⚠️ No se encontraron proveedores válidos en localStorage para ${selectId}`);
        return false;
      }

      proveedoresArray.forEach(proveedor => {
        if (!proveedor) {
          return;
        }
        const option = document.createElement('option');
        option.value = proveedor.rfc || proveedor.id || '';
        option.textContent = proveedor.nombre || proveedor.razonSocial || 'Sin nombre';
        select.appendChild(option);
      });

      console.log(
        `✅ ${proveedoresArray.length} proveedor(es) cargado(s) en ${selectId} desde localStorage`
      );
      return true;
    } catch (error) {
      console.error('❌ Error cargando proveedores desde localStorage:', error);
      return false;
    }
  };

  // Verificar que configuracionManager esté disponible
  if (
    !window.configuracionManager ||
    typeof window.configuracionManager.getProveedores !== 'function'
  ) {
    // Intentar de nuevo después de un breve delay si no se ha intentado más de maxRetries veces
    if (retryCount < maxRetries) {
      // Solo mostrar log en los primeros intentos y en el último para no saturar la consola
      if (retryCount === 0 || retryCount === maxRetries - 1) {
        console.log(
          `⏳ configuracionManager no disponible aún para ${selectId}, reintentando... (intento ${retryCount + 1}/${maxRetries})`
        );
      }
      setTimeout(() => {
        loadProveedoresSelect(selectId, retryCount + 1, maxRetries);
      }, 500);
      return;
    }
    // Si después de todos los intentos configuracionManager no está disponible, intentar desde localStorage
    console.warn(
      `⚠️ configuracionManager no disponible después de ${retryCount + 1} intentos, intentando cargar desde localStorage...`
    );
    if (loadProveedoresFromStorage()) {
      // Si se cargaron desde localStorage, recalcular vencimiento si es necesario
      if (
        selectId === 'proveedorFactura' &&
        typeof actualizarFechaVencimientoFactura === 'function'
      ) {
        actualizarFechaVencimientoFactura();
      }
    }
    return;
  }

  // ESTRATEGIA: Intentar cargar desde Firebase PRIMERO, luego configuracionManager, luego localStorage
  try {
    let proveedores = null;
    let proveedoresCargados = false;

    // PRIORIDAD 1: Intentar desde Firebase directamente
    console.log(`📋 [${selectId}] Intentando cargar proveedores desde Firebase...`);

    // Intentar con la función global primero
    if (typeof window.loadProveedoresFromFirebase === 'function') {
      try {
        const proveedoresFirebase = await window.loadProveedoresFromFirebase();
        console.log(`📋 [${selectId}] Resultado de Firebase (función global):`, {
          tipo: typeof proveedoresFirebase,
          esArray: Array.isArray(proveedoresFirebase),
          cantidad: proveedoresFirebase
            ? Array.isArray(proveedoresFirebase)
              ? proveedoresFirebase.length
              : 'N/A'
            : 0
        });

        if (
          proveedoresFirebase &&
          Array.isArray(proveedoresFirebase) &&
          proveedoresFirebase.length > 0
        ) {
          proveedores = proveedoresFirebase;
          proveedoresCargados = true;
          console.log(
            `✅ [${selectId}] ${proveedoresFirebase.length} proveedor(es) encontrado(s) en Firebase (función global)`
          );
        } else {
          console.warn(
            `⚠️ [${selectId}] No se encontraron proveedores en Firebase (función global)`
          );
        }
      } catch (error) {
        console.error(`❌ [${selectId}] Error cargando desde Firebase (función global):`, error);
      }
    } else {
      console.warn(
        `⚠️ [${selectId}] loadProveedoresFromFirebase no está disponible, intentando cargar directamente desde Firestore...`
      );

      // Cargar directamente desde Firestore
      try {
        if (window.firebaseDb && window.fs) {
          const { doc, getDoc } = window.fs;
          const docRef = doc(window.firebaseDb, 'configuracion', 'proveedores');
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            if (
              data.proveedores &&
              Array.isArray(data.proveedores) &&
              data.proveedores.length > 0
            ) {
              proveedores = data.proveedores;
              proveedoresCargados = true;
              console.log(
                `✅ [${selectId}] ${data.proveedores.length} proveedor(es) encontrado(s) en Firebase (directo desde Firestore)`
              );
            } else {
              console.warn(`⚠️ [${selectId}] Documento existe pero no tiene proveedores válidos`);
            }
          } else {
            console.warn(
              `⚠️ [${selectId}] Documento configuracion/proveedores no existe en Firebase`
            );
          }
        } else {
          console.warn(
            `⚠️ [${selectId}] Firebase no está disponible (firebaseDb: ${Boolean(window.firebaseDb)}, fs: ${Boolean(window.fs)})`
          );
        }
      } catch (error) {
        console.error(`❌ [${selectId}] Error cargando directamente desde Firestore:`, error);
      }
    }

    // PRIORIDAD 2: Si no hay en Firebase, intentar desde configuracionManager
    if (
      !proveedoresCargados &&
      window.configuracionManager &&
      typeof window.configuracionManager.getProveedores === 'function'
    ) {
      console.log(`📋 [${selectId}] Intentando desde configuracionManager...`);
      proveedores = window.configuracionManager.getProveedores();

      // Verificar si hay datos válidos
      const tieneDatos =
        proveedores &&
        ((Array.isArray(proveedores) && proveedores.length > 0) ||
          (typeof proveedores === 'object' && Object.keys(proveedores).length > 0));

      console.log(`📋 [${selectId}] Resultado de configuracionManager:`, {
        tipo: typeof proveedores,
        esArray: Array.isArray(proveedores),
        cantidad: proveedores
          ? Array.isArray(proveedores)
            ? proveedores.length
            : Object.keys(proveedores).length
          : 0,
        tieneDatos: tieneDatos
      });

      if (tieneDatos) {
        proveedoresCargados = true;
        console.log(`✅ [${selectId}] Proveedores encontrados en configuracionManager`);
      } else {
        proveedores = null;
        console.warn(`⚠️ [${selectId}] configuracionManager no tiene proveedores válidos`);
      }
    }

    // PRIORIDAD 3: Si no hay en configuracionManager, intentar con el sistema de caché
    if (!proveedoresCargados) {
      console.log(`📋 [${selectId}] Intentando desde caché...`);
      try {
        proveedores = await window.getDataWithCache('proveedores', async () => {
          let proveedoresData = {};

          if (
            window.configuracionManager &&
            typeof window.configuracionManager.getProveedores === 'function'
          ) {
            proveedoresData = window.configuracionManager.getProveedores() || {};
          } else {
            // Esperar a que configuracionManager esté disponible
            let attempts = 0;
            while (
              attempts < 10 &&
              (!window.configuracionManager ||
                typeof window.configuracionManager.getProveedores !== 'function')
            ) {
              attempts++;
              await new Promise(resolve => setTimeout(resolve, 500));
            }

            if (
              window.configuracionManager &&
              typeof window.configuracionManager.getProveedores === 'function'
            ) {
              proveedoresData = window.configuracionManager.getProveedores() || {};
            }
          }

          // Si es un array, convertir a objeto
          if (Array.isArray(proveedoresData)) {
            const proveedoresObj = {};
            proveedoresData.forEach(p => {
              if (p && p.rfc) {
                proveedoresObj[p.rfc] = p;
              }
            });
            return proveedoresObj;
          }

          return proveedoresData;
        });

        if (
          proveedores &&
          ((Array.isArray(proveedores) && proveedores.length > 0) ||
            (typeof proveedores === 'object' && Object.keys(proveedores).length > 0))
        ) {
          proveedoresCargados = true;
          console.log(`✅ [${selectId}] Proveedores encontrados en caché`);
        }
      } catch (error) {
        console.error(`❌ [${selectId}] Error cargando desde caché:`, error);
      }
    }

    // Procesar proveedores cargados
    console.log(`🔍 [${selectId}] Estado de proveedores antes de procesar:`, {
      proveedores: proveedores,
      esNull: proveedores === null,
      esUndefined: proveedores === undefined,
      tipo: typeof proveedores,
      esArray: Array.isArray(proveedores),
      esObjeto: proveedores && typeof proveedores === 'object',
      cantidad: proveedores
        ? Array.isArray(proveedores)
          ? proveedores.length
          : Object.keys(proveedores).length
        : 0,
      proveedoresCargados: proveedoresCargados
    });

    if (proveedores && Array.isArray(proveedores) && proveedores.length > 0) {
      proveedores.forEach(proveedor => {
        if (!proveedor || !proveedor.rfc) {
          console.warn(`⚠️ [${selectId}] Proveedor sin RFC ignorado:`, proveedor);
          return;
        }
        const option = document.createElement('option');
        option.value = proveedor.rfc;
        option.textContent = proveedor.nombre || proveedor.razonSocial || 'Sin nombre';
        select.appendChild(option);
      });
      console.log(`✅ [${selectId}] ${proveedores.length} proveedor(es) cargado(s) (desde array)`);
      proveedoresCargados = true;
    } else if (
      proveedores &&
      typeof proveedores === 'object' &&
      Object.keys(proveedores).length > 0
    ) {
      const proveedoresArray = Object.keys(proveedores);
      proveedoresArray.forEach(rfc => {
        const proveedor = proveedores[rfc];
        if (!proveedor) {
          console.warn(`⚠️ [${selectId}] Proveedor nulo ignorado para RFC:`, rfc);
          return;
        }
        const option = document.createElement('option');
        option.value = proveedor.rfc || rfc;
        option.textContent = proveedor.nombre || proveedor.razonSocial || 'Sin nombre';
        select.appendChild(option);
      });
      console.log(
        `✅ [${selectId}] ${proveedoresArray.length} proveedor(es) cargado(s) (desde objeto)`
      );
      proveedoresCargados = true;
    } else {
      console.warn(`⚠️ [${selectId}] No se encontraron proveedores válidos para procesar`);
    }

    // Si aún no se cargaron, intentar desde localStorage como último recurso
    if (!proveedoresCargados) {
      console.warn('⚠️ Intentando cargar proveedores desde localStorage...');
      const cargadoDesdeStorage = loadProveedoresFromStorage();
      if (!cargadoDesdeStorage) {
        console.error(`❌ No se pudieron cargar proveedores desde ninguna fuente para ${selectId}`);
        console.error(
          '💡 Verifica que tengas proveedores registrados en el módulo de Configuración > Proveedores'
        );
      }
    }

    // Verificar que se cargaron opciones (solo para <select>, no para <input>)
    if (select.tagName === 'SELECT' && select.options) {
      const opcionesFinales = select.options.length;
      if (opcionesFinales <= 1) {
        console.warn(
          `⚠️ El select ${selectId} solo tiene ${opcionesFinales} opción(es). Puede que no haya proveedores disponibles.`
        );
        console.warn(
          '💡 Para crear facturas, primero debes registrar proveedores en el módulo de Configuración > Proveedores'
        );

        // Agregar un mensaje visual en el select si está vacío
        if (opcionesFinales === 1) {
          const primeraOpcion = select.options[0];
          if (primeraOpcion && primeraOpcion.value === '') {
            primeraOpcion.textContent =
              '⚠️ No hay proveedores registrados. Ve a Configuración > Proveedores';
            primeraOpcion.disabled = true;
            select.disabled = true;
          }
        }
      } else {
        console.log(`✅ Select ${selectId} tiene ${opcionesFinales} opciones disponibles`);
      }

      // Asegurar que el select esté habilitado después de cargar
      select.disabled = false;
      select.style.display = '';
      select.style.visibility = 'visible';
    }

    // Si es el select del modal de factura, recalcular vencimiento
    if (selectId === 'proveedorFactura') {
      if (typeof actualizarFechaVencimientoFactura === 'function') {
        actualizarFechaVencimientoFactura();
      }
    }
  } catch (error) {
    console.error('❌ Error cargando proveedores desde configuracionManager:', error);
    // En caso de error, intentar desde localStorage como fallback
    console.log('🔄 Intentando cargar proveedores desde localStorage como fallback...');
    loadProveedoresFromStorage();
  }
}

// ===== GESTIÓN DE SOLICITUDES DE PAGO =====

// Cargar solicitudes en la tabla
function loadSolicitudesCXP() {
  const tbody = document.getElementById('tbodySolicitudesCXP');
  if (!tbody) {
    return;
  }

  // Guardar solicitudes filtradas globalmente para paginación (como en CXC)
  window._solicitudesCXPCompletas = [...solicitudesFiltradas];

  // Si no hay solicitudes, mostrar mensaje
  if (solicitudesFiltradas.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="9" class="text-center text-muted">No hay solicitudes para mostrar</td></tr>';
    const contenedorPaginacion = document.getElementById('paginacionSolicitudesCXP');
    if (contenedorPaginacion) {
      contenedorPaginacion.innerHTML = '';
    }
    return;
  }

  // Ordenar solicitudes filtradas: las más recientes primero
  const solicitudesOrdenadas = [...solicitudesFiltradas].sort((a, b) => {
    // Prioridad 1: fechaCreacion (más reciente primero)
    const fechaA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
    const fechaB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
    if (fechaA !== fechaB) {
      return fechaB - fechaA; // Descendente (más reciente primero)
    }

    // Prioridad 2: fechaSolicitud (más reciente primero)
    const fechaSolicitudA = a.fechaSolicitud ? new Date(a.fechaSolicitud).getTime() : 0;
    const fechaSolicitudB = b.fechaSolicitud ? new Date(b.fechaSolicitud).getTime() : 0;
    if (fechaSolicitudA !== fechaSolicitudB) {
      return fechaSolicitudB - fechaSolicitudA; // Descendente (más reciente primero)
    }

    // Prioridad 3: ID (más alto = más reciente)
    const idA = a.id || 0;
    const idB = b.id || 0;
    return idB - idA; // Descendente (ID más alto primero)
  });

  // Inicializar paginación
  const PaginacionManagerClass =
    typeof PaginacionManager !== 'undefined'
      ? PaginacionManager
      : typeof window.PaginacionManager !== 'undefined'
        ? window.PaginacionManager
        : null;

  if (!PaginacionManagerClass) {
    console.warn(
      '⚠️ PaginacionManager no está disponible, mostrando todas las solicitudes sin paginación'
    );
    renderizarSolicitudesCXP(solicitudesOrdenadas);
    return;
  }

  if (!window._paginacionSolicitudesCXPManager) {
    try {
      window._paginacionSolicitudesCXPManager = new PaginacionManagerClass();
      console.log('✅ Nueva instancia de PaginacionManager creada para solicitudes CXP');
    } catch (error) {
      console.error('❌ Error creando instancia de PaginacionManager:', error);
      renderizarSolicitudesCXP(solicitudesOrdenadas);
      return;
    }
  }

  try {
    // Crear array de IDs para paginación (usar solicitudes ordenadas)
    const solicitudesIds = solicitudesOrdenadas.map((s, _index) =>
      String(s.id || Date.now() + Math.random())
    );
    window._paginacionSolicitudesCXPManager.inicializar(solicitudesIds, 15);
    // Siempre empezar en la página 1 para mostrar las más recientes primero
    window._paginacionSolicitudesCXPManager.paginaActual = 1;
    console.log(
      `✅ Paginación inicializada: ${window._paginacionSolicitudesCXPManager.totalRegistros} solicitudes, ${window._paginacionSolicitudesCXPManager.obtenerTotalPaginas()} páginas`
    );

    // Renderizar solicitudes de la página actual
    renderizarSolicitudesCXP();

    // Generar controles de paginación
    const contenedorPaginacion = document.getElementById('paginacionSolicitudesCXP');
    if (contenedorPaginacion && window._paginacionSolicitudesCXPManager) {
      contenedorPaginacion.innerHTML =
        window._paginacionSolicitudesCXPManager.generarControlesPaginacion(
          'paginacionSolicitudesCXP',
          'cambiarPaginaSolicitudesCXP'
        );
    }
  } catch (error) {
    console.error('❌ Error al inicializar paginación:', error);
    renderizarSolicitudesCXP(solicitudes);
  }
}

// Función para renderizar las solicitudes (con o sin paginación)
function renderizarSolicitudesCXP(solicitudesParaRenderizar = null) {
  const tbody = document.getElementById('tbodySolicitudesCXP');
  if (!tbody) {
    return;
  }

  // Si se proporcionan solicitudes específicas, renderizarlas directamente
  if (solicitudesParaRenderizar) {
    tbody.innerHTML = '';
    if (solicitudesParaRenderizar.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="9" class="text-center text-muted">No hay solicitudes para mostrar</td></tr>';
      return;
    }

    solicitudesParaRenderizar.forEach(solicitud => {
      renderizarFilaSolicitudCXP(solicitud, tbody);
    });
    return;
  }

  // Si no se proporcionan, usar paginación
  if (!window._paginacionSolicitudesCXPManager || !window._solicitudesCXPCompletas) {
    console.warn(
      '⚠️ No se puede renderizar: paginacion=',
      Boolean(window._paginacionSolicitudesCXPManager),
      'solicitudes=',
      Boolean(window._solicitudesCXPCompletas)
    );
    return;
  }

  const solicitudesIds = window._paginacionSolicitudesCXPManager.obtenerRegistrosPagina();
  const solicitudesMap = {};
  window._solicitudesCXPCompletas.forEach(solicitud => {
    const id = String(solicitud.id || Date.now() + Math.random());
    solicitudesMap[id] = solicitud;
  });

  const solicitudesPagina = solicitudesIds
    .map(id => solicitudesMap[id])
    .filter(solicitud => solicitud !== undefined);

  tbody.innerHTML = '';

  if (solicitudesPagina.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="9" class="text-center text-muted">No hay solicitudes para mostrar</td></tr>';
    return;
  }

  solicitudesPagina.forEach(solicitud => {
    renderizarFilaSolicitudCXP(solicitud, tbody);
  });

  // Actualizar controles de paginación
  const contenedorPaginacion = document.getElementById('paginacionSolicitudesCXP');
  if (contenedorPaginacion && window._paginacionSolicitudesCXPManager) {
    contenedorPaginacion.innerHTML =
      window._paginacionSolicitudesCXPManager.generarControlesPaginacion(
        'paginacionSolicitudesCXP',
        'cambiarPaginaSolicitudesCXP'
      );
  }

  console.log(
    `✅ ${window._paginacionSolicitudesCXPManager.totalRegistros} solicitudes CXP cargadas (página ${window._paginacionSolicitudesCXPManager.paginaActual} de ${window._paginacionSolicitudesCXPManager.obtenerTotalPaginas()})`
  );
}

// Función auxiliar para renderizar una fila de solicitud
function renderizarFilaSolicitudCXP(solicitud, tbody) {
  const row = document.createElement('tr');

  // Determinar clase de estado
  let estadoClass = '';
  let estadoText = '';
  switch (solicitud.estado) {
    case 'pendiente':
      estadoClass = 'status-pendiente';
      estadoText = 'Pendiente';
      break;
    case 'solicitud':
      estadoClass = 'status-solicitud';
      estadoText = 'En Solicitud';
      break;
    case 'rechazada':
      estadoClass = 'status-rechazada';
      estadoText = 'Rechazada';
      break;
    case 'en tesoreria':
      estadoClass = 'status-en-tesoreria';
      estadoText = 'En Tesorería';
      break;
    case 'parcial pagado':
      estadoClass = 'status-parcial-pagado';
      estadoText = 'P-Pagado';
      break;
    case 'pagada':
      estadoClass = 'status-aceptada';
      estadoText = 'Pagada';
      break;
    case 'aceptada': // compatibilidad
      estadoClass = 'status-en-tesoreria';
      estadoText = 'En Tesorería';
      break;
    default:
      estadoClass = 'status-pendiente';
      estadoText = capitalizeFirst(solicitud.estado || 'Pendiente');
  }

  // Determinar clase de prioridad
  let prioridadClass = '';
  switch (solicitud.prioridad) {
    case 'urgente':
      prioridadClass = 'bg-danger';
      break;
    case 'alta':
      prioridadClass = 'bg-warning';
      break;
    default:
      prioridadClass = 'bg-info';
  }

  // Obtener facturas asociadas a la solicitud
  let facturasTexto = '-';
  if (
    solicitud.facturasIncluidas &&
    Array.isArray(solicitud.facturasIncluidas) &&
    solicitud.facturasIncluidas.length > 0
  ) {
    const facturas = facturasCXP.filter(f => solicitud.facturasIncluidas.includes(f.id));
    if (facturas.length > 0) {
      if (facturas.length === 1) {
        facturasTexto = facturas[0].numeroFactura || '-';
      } else {
        facturasTexto = `${facturas.length} facturas`;
      }
    }
  }

  // Mostrar checkbox solo si la solicitud está pendiente o en solicitud
  const puedeSeleccionar = solicitud.estado === 'solicitud' || solicitud.estado === 'pendiente';
  const checkboxHtml = puedeSeleccionar
    ? `<td style="width:32px;"><input type="checkbox" class="chk-solicitud-cxp" value="${solicitud.id}" data-estado="${solicitud.estado}"></td>`
    : '<td style="width:32px;"></td>';

  row.innerHTML = `
        ${checkboxHtml}
        <td><strong>SOL-${solicitud.id.toString().padStart(4, '0')}</strong></td>
        <td>${facturasTexto}</td>
        <td>${solicitud.proveedor}</td>
        <td><strong>$${formatCurrency(solicitud.monto)}</strong></td>
        <td>${formatDate(solicitud.fechaSolicitud)}</td>
        <td><span class="status-badge ${estadoClass}">${estadoText}</span></td>
        <td><span class="badge ${prioridadClass}">${solicitud.prioridad}</span></td>
        <td>
            <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-primary" onclick="verDetallesSolicitud(${solicitud.id})" title="Ver facturas e información">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-info" onclick="descargarPDFSolicitudCXP(${solicitud.id})" title="Descargar PDF">
                    <i class="fas fa-file-pdf"></i>
                </button>
                ${
  solicitud.estado === 'solicitud' || solicitud.estado === 'pendiente'
    ? `
                    <button class="btn btn-sm btn-success" onclick="aprobarSolicitud(${solicitud.id})" title="Aprobar">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="rechazarSolicitud(${solicitud.id})" title="Rechazar">
                        <i class="fas fa-times"></i>
                    </button>
                `
    : ''
}
            </div>
        </td>
    `;

  tbody.appendChild(row);
}

// Crear solicitud de pago para una factura específica
function _crearSolicitudPagoFactura(facturaId) {
  const factura = facturasCXP.find(f => f.id === facturaId);
  if (!factura) {
    return;
  }

  // Calcular monto pendiente
  const montoPendiente =
    factura.montoPendiente !== undefined ? factura.montoPendiente : factura.monto;

  // Llenar formulario con datos de la factura
  document.getElementById('proveedorSolicitud').value = factura.rfc || factura.proveedorId || '';
  document.getElementById('montoSolicitud').value = montoPendiente; // Por defecto, el monto pendiente
  document.getElementById('montoSolicitud').max = montoPendiente; // Establecer máximo como monto pendiente
  document.getElementById('maximoSolicitud').textContent = `$${formatCurrency(montoPendiente)}`;
  // Obtener fecha actual en formato YYYY-MM-DD sin problemas de zona horaria
  const hoy = new Date();
  const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  document.getElementById('fechaSolicitud').value = fechaHoy;
  document.getElementById('fechaRequerida').value = factura.fechaVencimiento;
  document.getElementById('prioridadSolicitud').value = factura.prioridad;

  // Mostrar factura seleccionada
  const facturasDiv = document.getElementById('facturasSeleccionadas');
  facturasDiv.innerHTML = `
        <div class="form-check">
            <input class="form-check-input" type="checkbox" id="factura_${factura.id}" value="${factura.id}" checked disabled>
            <label class="form-check-label" for="factura_${factura.id}">
                <strong>${factura.numeroFactura}</strong> - $${formatCurrency(factura.monto)} - ${factura.descripcion}
            </label>
        </div>
    `;

  // Resetear estado de procesamiento al abrir el modal
  procesandoSolicitud = false;

  // Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById('modalSolicitudPago'));
  modal.show();

  // Botón de envío en modo crear
  _editingSolicitudId = null;
  const btn = document.querySelector('#modalSolicitudPago .modal-footer .btn.btn-primary');
  if (btn) {
    btn.disabled = false; // Asegurar que el botón esté habilitado
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Solicitud';
    btn.onclick = crearSolicitudPago;
  }
}

// Variable para controlar si ya se está procesando una solicitud
let procesandoSolicitud = false;

// Crear solicitud de pago
// Exponer función globalmente para que pueda ser llamada desde HTML
window.crearSolicitudPago = async function crearSolicitudPago() {
  // Prevenir múltiples ejecuciones simultáneas
  if (procesandoSolicitud) {
    console.log('⚠️ Ya se está procesando una solicitud, ignorando clic duplicado');
    return;
  }

  const form = document.getElementById('formSolicitudPago');
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  // Obtener el botón y deshabilitarlo inmediatamente
  const btnEnviar = document.querySelector('#modalSolicitudPago .modal-footer .btn.btn-primary');
  const textoOriginal = btnEnviar ? btnEnviar.innerHTML : '';

  // Marcar como procesando y deshabilitar botón
  procesandoSolicitud = true;
  if (btnEnviar) {
    btnEnviar.disabled = true;
    btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
  }

  try {
    // Obtener facturas seleccionadas
    const facturasSeleccionadas = Array.from(
      document.querySelectorAll('#facturasSeleccionadas input[type="checkbox"]:checked')
    ).map(cb => parseInt(cb.value, 10));

    if (facturasSeleccionadas.length === 0) {
      alert('Por favor selecciona al menos una factura');
      procesandoSolicitud = false;
      if (btnEnviar) {
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = textoOriginal;
      }
      return;
    }

    // Validar monto de la solicitud
    const montoSolicitud = parseFloat(document.getElementById('montoSolicitud').value);
    const montoMaximo = parseFloat(document.getElementById('montoSolicitud').max);

    if (montoSolicitud <= 0) {
      alert('El monto de la solicitud debe ser mayor a cero');
      procesandoSolicitud = false;
      if (btnEnviar) {
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = textoOriginal;
      }
      return;
    }

    if (montoSolicitud > montoMaximo) {
      alert(
        `El monto de la solicitud ($${formatCurrency(montoSolicitud)}) no puede ser mayor al monto máximo ($${formatCurrency(montoMaximo)})`
      );
      procesandoSolicitud = false;
      if (btnEnviar) {
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = textoOriginal;
      }
      return;
    }

    const selectProveedor = document.getElementById('proveedorSolicitud');
    if (!selectProveedor) {
      alert('Error: No se encontró el campo de proveedor');
      procesandoSolicitud = false;
      if (btnEnviar) {
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = textoOriginal;
      }
      return;
    }

    const rfcProveedor = selectProveedor.value;
    const nombreProveedor =
      selectProveedor.options[selectProveedor.selectedIndex]?.textContent || '';

    if (!rfcProveedor) {
      alert('Error: Por favor selecciona un proveedor');
      procesandoSolicitud = false;
      if (btnEnviar) {
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = textoOriginal;
      }
      return;
    }

    // PRIORIDAD 1: Buscar en Firebase directamente
    let proveedor = null;
    try {
      if (window.firebaseRepos && window.firebaseRepos.configuracion) {
        const proveedoresRef = window.firebaseRepos.configuracion.fs.collection('proveedores');
        const proveedoresSnapshot = await proveedoresRef.get();

        proveedoresSnapshot.forEach(doc => {
          const prov = doc.data();
          if (prov.rfc === rfcProveedor || doc.id === rfcProveedor) {
            proveedor = { ...prov, id: doc.id };
            console.log('✅ Proveedor encontrado en Firebase:', proveedor);
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ Error buscando proveedor en Firebase:', error);
    }

    // PRIORIDAD 2: Intentar desde configuracionManager
    if (
      !proveedor &&
      window.configuracionManager &&
      typeof window.configuracionManager.getProveedor === 'function'
    ) {
      try {
        proveedor = window.configuracionManager.getProveedor(rfcProveedor);
        if (proveedor) {
          console.log('✅ Proveedor encontrado en configuracionManager:', proveedor);
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo proveedor desde configuracionManager:', error);
      }
    }

    // PRIORIDAD 3: Si no se encuentra el objeto completo, usar el nombre del select
    if (!proveedor || !proveedor.nombre) {
      if (nombreProveedor && nombreProveedor.trim() !== '' && !nombreProveedor.includes('⚠️')) {
        // Crear objeto proveedor básico con la información disponible
        proveedor = {
          rfc: rfcProveedor,
          nombre: nombreProveedor.trim(),
          razonSocial: nombreProveedor.trim()
        };
        console.log('✅ Usando nombre del proveedor del select:', nombreProveedor);
      } else {
        procesandoSolicitud = false;
        if (btnEnviar) {
          btnEnviar.disabled = false;
          btnEnviar.innerHTML = textoOriginal;
        }
        alert(
          `Error: No se encontró el proveedor con RFC: ${rfcProveedor}\n\nPor favor, verifica que el proveedor esté correctamente registrado en Configuración > Proveedores.`
        );
        return;
      }
    }

    console.log('✅ Proveedor encontrado para solicitud:', proveedor);

    // Capturar fecha de solicitud del input (ya está en formato YYYY-MM-DD)
    const fechaSolicitudInput = document.getElementById('fechaSolicitud').value;
    console.log('📅 Fecha capturada del input fechaSolicitud:', fechaSolicitudInput);

    const nuevaSolicitud = {
      id: Date.now(),
      proveedorId: rfcProveedor, // Usar RFC como ID
      proveedor: proveedor.nombre,
      monto: montoSolicitud, // Usar el monto validado
      montoTotal: montoMaximo, // Guardar el monto total de la factura
      fechaSolicitud: fechaSolicitudInput, // Usar la fecha del input directamente
      fechaRequerida: document.getElementById('fechaRequerida').value,
      prioridad: document.getElementById('prioridadSolicitud').value,
      metodoPago: document.getElementById('metodoPagoSolicitud').value,
      justificacion: document.getElementById('justificacionSolicitud').value,
      estado: 'solicitud',
      facturasIncluidas: facturasSeleccionadas,
      fechaCreacion: new Date().toISOString(),
      tenantId:
        window.firebaseRepos?.cxp?.tenantId || window.DEMO_CONFIG?.tenantId || 'demo_tenant',
      userId: window.firebaseRepos?.cxp?.userId || 'anonymous'
    };

    console.log('📅 Fecha que se guardará en nuevaSolicitud:', nuevaSolicitud.fechaSolicitud);

    solicitudesPago.push(nuevaSolicitud);
    console.log('📝 Nueva solicitud agregada al array:', nuevaSolicitud);
    console.log('📊 Total de solicitudes en array:', solicitudesPago.length);

    // NO actualizar montos aquí - solo cambiar estado a "solicitud"
    // Los montos se actualizarán cuando se apruebe la solicitud
    facturasCXP = facturasCXP.map(f => {
      if (!facturasSeleccionadas.includes(f.id)) {
        return f;
      }

      return {
        ...f,
        estado: 'solicitud'
      };
    });

    // Esperar a que se guarde antes de continuar
    console.log('💾 Guardando datos CXP...');
    console.log('📊 Solicitudes antes de guardar:', solicitudesPago.length);
    await saveCXPData();
    console.log('✅ Datos CXP guardados');

    // Limpiar filtros para mostrar la nueva solicitud
    solicitudesFiltradas = [];

    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalSolicitudPago'));
    if (modal) {
      modal.hide();
    }

    // Resetear paginación a página 1 para mostrar la nueva solicitud al principio
    if (window._paginacionSolicitudesCXPManager) {
      window._paginacionSolicitudesCXPManager.paginaActual = 1;
    }

    // Actualizar vista
    loadSolicitudesCXP();
    updateCXPMetrics();

    // Mostrar notificación
    showNotification('✅ Solicitud de pago enviada exitosamente', 'success');

    // Recargar la página después de un breve delay para que se vea la notificación
    setTimeout(() => {
      location.reload();
    }, 1000);
  } catch (error) {
    console.error('❌ Error al crear solicitud de pago:', error);
    if (typeof showNotification === 'function') {
      showNotification('❌ Error al crear la solicitud de pago', 'error');
    } else {
      alert(`Error al crear la solicitud de pago: ${error.message}`);
    }
  } finally {
    // Rehabilitar botón y restaurar texto original
    procesandoSolicitud = false;
    if (btnEnviar) {
      btnEnviar.disabled = false;
      btnEnviar.innerHTML = textoOriginal;
    }
  }
};

// ===== FILTROS =====

// Variable global para el timeout del debounce de filtros
let filtrosTimeoutIdCXP = null;

// Función auxiliar para comparar estados (maneja compatibilidad)
function cumpleFiltroEstado(estadoFactura, estadoFiltro) {
  if (!estadoFiltro) {
    return true;
  } // Sin filtro, mostrar todo

  // Comparación directa
  if (estadoFactura === estadoFiltro) {
    return true;
  }

  // Mapeo de compatibilidad para estados que pueden tener múltiples valores
  const mapeoEstados = {
    solicitud: ['solicitud', 'aprobada'], // "solicitud" y "aprobada" muestran "En Solicitud"
    'en tesoreria': ['en tesoreria', 'aceptada'], // "en tesoreria" y "aceptada" muestran "En Tesorería"
    pendiente: ['pendiente'],
    'SR-Pendiente': ['SR-Pendiente'],
    'parcial pagado': ['parcial pagado'],
    pagada: ['pagada'],
    validada: ['validada'],
    rechazada: ['rechazada']
  };

  // Verificar si el estado de la factura está en el grupo del filtro
  const estadosGrupo = mapeoEstados[estadoFiltro];
  if (estadosGrupo) {
    return estadosGrupo.includes(estadoFactura);
  }

  // Si no hay mapeo, comparación directa
  return estadoFactura === estadoFiltro;
}

// Función global de debounce para filtros (se reutiliza para todos los campos de texto)
function aplicarFiltrosConDebounceCXP() {
  clearTimeout(filtrosTimeoutIdCXP);
  filtrosTimeoutIdCXP = setTimeout(() => {
    if (typeof window.aplicarFiltrosCXP === 'function') {
      window.aplicarFiltrosCXP();
    }
  }, 300); // Esperar 300ms después de que el usuario deje de escribir
}

// Función global para aplicar filtros inmediatamente (sin debounce)
function aplicarFiltrosInmediatoCXP() {
  clearTimeout(filtrosTimeoutIdCXP); // Cancelar cualquier debounce pendiente
  if (typeof window.aplicarFiltrosCXP === 'function') {
    window.aplicarFiltrosCXP();
  }
}

// Aplicar filtros
// Función global para aplicar filtros en CXP
window.aplicarFiltrosCXP = function aplicarFiltrosCXP() {
  // Verificar que los elementos existan
  const filtroProveedorEl = document.getElementById('filtroProveedor');
  const filtroFacturaEl = document.getElementById('filtroFactura');
  const filtroEstadoEl = document.getElementById('filtroEstado');
  const fechaDesdeEl = document.getElementById('fechaDesde');
  const fechaHastaEl = document.getElementById('fechaHasta');

  // Obtener valores de filtros (usar valores por defecto si no existen)
  const filtroProveedor = filtroProveedorEl?.value || '';
  const filtroFactura = (filtroFacturaEl?.value || '').trim().toLowerCase();
  const filtroEstado = filtroEstadoEl?.value || '';
  const fechaDesde = fechaDesdeEl?.value || '';
  const fechaHasta = fechaHastaEl?.value || '';

  // Usar las fechas directamente sin procesamiento de mes
  const fechaDesdeMes = fechaDesde;
  const fechaHastaMes = fechaHasta;

  // Filtrar facturas (siempre filtrar, como en CXC - si no hay filtros, pasará todas)
  facturasFiltradas = facturasCXP.filter(factura => {
    // Filtro de proveedor: buscar en nombre o RFC (búsqueda parcial, case-insensitive)
    const nombreProveedor = (factura.proveedor || '').toLowerCase();
    const rfcProveedor = (factura.rfc || factura.proveedorId || '').toLowerCase();
    const filtroProveedorLower = (filtroProveedor || '').toLowerCase();
    const cumpleProveedor =
      !filtroProveedor ||
      nombreProveedor.includes(filtroProveedorLower) ||
      rfcProveedor.includes(filtroProveedorLower);

    // Filtro de factura: búsqueda parcial en número de factura
    const cumpleFactura =
      !filtroFactura || (factura.numeroFactura || '').toLowerCase().includes(filtroFactura);

    // Filtro de estado: búsqueda parcial en el estado (puede buscar "pendiente", "en solicitud", etc.)
    const estadoFactura = (factura.estado || '').toLowerCase();
    const filtroEstadoLower = (filtroEstado || '').toLowerCase();
    const cumpleEstado =
      !filtroEstado ||
      estadoFactura.includes(filtroEstadoLower) ||
      cumpleFiltroEstado(factura.estado, filtroEstado);

    const cumpleFechaDesde = !fechaDesdeMes || (factura.fechaEmision || '') >= fechaDesdeMes;
    const cumpleFechaHasta = !fechaHastaMes || (factura.fechaEmision || '') <= fechaHastaMes;

    return cumpleProveedor && cumpleFactura && cumpleEstado && cumpleFechaDesde && cumpleFechaHasta;
  });

  // Filtrar solicitudes (siempre filtrar, como en CXC - si no hay filtros, pasará todas)
  solicitudesFiltradas = solicitudesPago.filter(solicitud => {
    // Filtro de proveedor: buscar en proveedorId (búsqueda parcial)
    const proveedorIdSolicitud = (solicitud.proveedorId || '').toLowerCase();
    const filtroProveedorLower = (filtroProveedor || '').toLowerCase();
    const cumpleProveedor = !filtroProveedor || proveedorIdSolicitud.includes(filtroProveedorLower);

    // Filtro de estado: búsqueda parcial
    const estadoSolicitud = (solicitud.estado || '').toLowerCase();
    const filtroEstadoLower = (filtroEstado || '').toLowerCase();
    const cumpleEstado =
      !filtroEstado ||
      estadoSolicitud.includes(filtroEstadoLower) ||
      cumpleFiltroEstado(solicitud.estado, filtroEstado);

    const cumpleFechaDesde = !fechaDesdeMes || (solicitud.fechaSolicitud || '') >= fechaDesdeMes;
    const cumpleFechaHasta = !fechaHastaMes || (solicitud.fechaSolicitud || '') <= fechaHastaMes;

    // Si hay filtro de factura, verificar si alguna factura asociada cumple
    let cumpleFactura = true;
    if (filtroFactura && solicitud.facturasIncluidas && solicitud.facturasIncluidas.length > 0) {
      const facturasAsociadas = facturasCXP.filter(f => solicitud.facturasIncluidas.includes(f.id));
      cumpleFactura = facturasAsociadas.some(f =>
        (f.numeroFactura || '').toLowerCase().includes(filtroFactura)
      );
    } else if (filtroFactura) {
      cumpleFactura = false;
    }

    return cumpleProveedor && cumpleFactura && cumpleEstado && cumpleFechaDesde && cumpleFechaHasta;
  });

  // Los proveedores se filtran desde configuracion.html

  // Reiniciar paginación cuando se aplican filtros
  if (window._paginacionCXPManager) {
    window._paginacionCXPManager.paginaActual = 1;
  }
  if (window._paginacionSolicitudesCXPManager) {
    window._paginacionSolicitudesCXPManager.paginaActual = 1;
  }

  // Actualizar tablas
  loadFacturasCXP();
  loadSolicitudesCXP();
  loadProveedoresCXP();

  console.log(
    `🔍 Filtros aplicados: ${facturasFiltradas.length} facturas de ${facturasCXP.length} totales, ${solicitudesFiltradas.length} solicitudes de ${solicitudesPago.length} totales`
  );
  console.log(
    `   Filtros activos: proveedor="${filtroProveedor}", factura="${filtroFactura}", estado="${filtroEstado}", desde="${fechaDesde}", hasta="${fechaHasta}"`
  );
};

// Función global para cambiar de página en solicitudes CXP
window.cambiarPaginaSolicitudesCXP = function (accion) {
  if (!window._paginacionSolicitudesCXPManager) {
    console.warn('⚠️ window._paginacionSolicitudesCXPManager no está disponible');
    return;
  }

  let cambioExitoso = false;

  if (accion === 'anterior') {
    cambioExitoso = window._paginacionSolicitudesCXPManager.paginaAnterior();
  } else if (accion === 'siguiente') {
    cambioExitoso = window._paginacionSolicitudesCXPManager.paginaSiguiente();
  } else if (typeof accion === 'number') {
    cambioExitoso = window._paginacionSolicitudesCXPManager.irAPagina(accion);
  }

  if (cambioExitoso) {
    renderizarSolicitudesCXP();
    // Scroll suave hacia la tabla
    const tabla = document.getElementById('tablaSolicitudesCXP');
    if (tabla) {
      tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

// Limpiar filtros
window.limpiarFiltrosCXP = function limpiarFiltrosCXP() {
  document.getElementById('filtroProveedor').value = '';
  document.getElementById('filtroFactura').value = '';
  document.getElementById('filtroEstado').value = '';
  document.getElementById('fechaDesde').value = '';
  document.getElementById('fechaHasta').value = '';

  // Limpiar listas filtradas
  facturasFiltradas = [];
  solicitudesFiltradas = [];

  // Aplicar filtros (que ahora mostrará todo)
  aplicarFiltrosCXP();
};

// Función global para cambiar de página en CXP
window.cambiarPaginaCXP = function (accion) {
  if (!window._paginacionCXPManager) {
    console.warn('⚠️ window._paginacionCXPManager no está disponible');
    return;
  }

  let cambioExitoso = false;

  if (accion === 'anterior') {
    cambioExitoso = window._paginacionCXPManager.paginaAnterior();
  } else if (accion === 'siguiente') {
    cambioExitoso = window._paginacionCXPManager.paginaSiguiente();
  } else if (typeof accion === 'number') {
    cambioExitoso = window._paginacionCXPManager.irAPagina(accion);
  }

  if (cambioExitoso) {
    renderizarFacturasCXP();
    // Scroll suave hacia la tabla
    const tabla = document.getElementById('tablaFacturasCXP');
    if (tabla) {
      tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

// ===== MÉTRICAS =====

// Función para corregir estados inconsistentes de facturas
function corregirEstadosFacturasCXP() {
  let facturasCorregidas = 0;

  facturasCXP.forEach(factura => {
    const montoPendiente =
      factura.montoPendiente !== undefined ? factura.montoPendiente : factura.monto;

    // Si tiene monto pendiente > 0 pero está marcada como "pagada", corregir el estado
    if (montoPendiente > 0 && factura.estado === 'pagada') {
      console.log(
        '🔧 Corrigiendo estado de factura:',
        factura.numeroFactura,
        '- Estado: pagada → pendiente'
      );
      factura.estado = 'pendiente';
      facturasCorregidas++;
    }
  });

  if (facturasCorregidas > 0) {
    saveCXPData();
    console.log(`🎉 ${facturasCorregidas} facturas CXP corregidas automáticamente`);
  }

  return facturasCorregidas;
}

// Actualizar métricas
function updateCXPMetrics() {
  // Corregir estados inconsistentes antes de calcular métricas
  corregirEstadosFacturasCXP();
  // Calcular total pendiente usando montoPendiente real
  // Incluir facturas con monto pendiente > 0, independientemente del estado
  const totalPendiente = facturasCXP
    .filter(f => {
      const montoPendiente = f.montoPendiente !== undefined ? f.montoPendiente : f.monto;
      return montoPendiente > 0;
    })
    .reduce((sum, f) => {
      const montoPendiente = f.montoPendiente !== undefined ? f.montoPendiente : f.monto;
      return sum + montoPendiente;
    }, 0);

  // Contar facturas pendientes (que tienen monto pendiente > 0)
  const facturasPendientes = facturasCXP.filter(f => {
    const montoPendiente = f.montoPendiente !== undefined ? f.montoPendiente : f.monto;
    return montoPendiente > 0;
  }).length;

  // Contar solicitudes pendientes
  const solicitudesPendientes = solicitudesPago.filter(s => s.estado === 'pendiente').length;

  // Calcular monto total pagado
  const montoTotalPagado = facturasCXP.reduce((sum, f) => {
    const montoPagado = f.montoPagado || 0;
    return sum + montoPagado;
  }, 0);

  // Calcular monto total de facturas
  const montoTotalFacturas = facturasCXP.reduce((sum, f) => {
    const monto = f.monto || 0;
    return sum + monto;
  }, 0);

  // Calcular tasa de pago (porcentaje)
  const tasaPago =
    montoTotalFacturas > 0 ? Math.round((montoTotalPagado / montoTotalFacturas) * 100) : 0;

  // Actualizar elementos
  document.getElementById('totalPendiente').textContent = `$${formatCurrency(totalPendiente)}`;
  document.getElementById('facturasPendientes').textContent = facturasPendientes;
  document.getElementById('solicitudesPendientes').textContent = solicitudesPendientes;
  document.getElementById('tasaPago').textContent = `${tasaPago}%`;
}

// ===== FUNCIONES AUXILIARES =====

// Calcular días pendientes (fecha vencimiento - fecha actual + 1 = días pendientes)
function calcularDiasVencidos(fechaVencimiento, estado) {
  // Si la factura está pagada, retornar null para mostrar "-"
  if (estado === 'pagada' || estado === 'pagado') {
    return null;
  }

  if (!fechaVencimiento) {
    return 0;
  }

  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);

  // Normalizar fechas a medianoche para comparación precisa
  hoy.setHours(0, 0, 0, 0);
  vencimiento.setHours(0, 0, 0, 0);

  // Calcular diferencia: fecha de vencimiento - fecha de hoy
  const diffTime = vencimiento - hoy;
  let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Aplicar fórmula: fecha vencimiento - fecha actual + 1 = días pendientes
  // Si es negativo (ya venció), sumar 1 para ajustar
  if (diffDays < 0) {
    diffDays = diffDays + 1;
  }

  // Retornar: Positivo = días restantes para vencer, Negativo = días vencidos
  return diffDays;
}

// Formatear fecha (sin problemas de zona horaria)
function formatDate(dateString) {
  if (!dateString) {
    return 'N/A';
  }

  // Si la fecha está en formato YYYY-MM-DD, formatearla directamente sin conversión de zona horaria
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-');
    // Crear fecha en zona horaria local para evitar problemas de conversión UTC
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return date.toLocaleDateString('es-MX');
  }

  // Para otros formatos, usar el método original
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString('es-MX');
  } catch (e) {
    return dateString;
  }
}

// Formatear moneda
// Función para formatear UUID con guiones (formato: 8-4-4-4-12)
// Formato: 550e8400-e29b-41d4-a716-446655440000 (32 dígitos hexadecimales + 4 guiones = 36 caracteres)
function formatearUUID(uuid) {
  if (!uuid) {
    return '';
  }

  // Remover todos los caracteres que no sean hexadecimales
  let cleaned = String(uuid).replace(/[^0-9a-fA-F]/g, '');

  // Si ya tiene el formato correcto (36 caracteres con guiones), validarlo y retornarlo
  if (uuid.includes('-') && uuid.length === 36) {
    const uuidPattern =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (uuidPattern.test(uuid)) {
      return uuid;
    }
  }

  // Limitar a 32 caracteres hexadecimales
  cleaned = cleaned.substring(0, 32);

  // Si no tiene 32 caracteres, retornar tal cual (puede estar incompleto)
  if (cleaned.length !== 32) {
    // Si tiene menos de 32, formatear lo que tenga pero no completar
    if (cleaned.length === 0) {
      return '';
    }
    // Formatear parcialmente
    let formatted = '';
    for (let i = 0; i < cleaned.length; i++) {
      if (i === 8 || i === 12 || i === 16 || i === 20) {
        formatted += '-';
      }
      formatted += cleaned[i];
    }
    return formatted;
  }

  // Formatear con guiones en las posiciones correctas: 8-4-4-4-12
  return `${cleaned.substring(0, 8)}-${cleaned.substring(8, 12)}-${cleaned.substring(12, 16)}-${cleaned.substring(16, 20)}-${cleaned.substring(20, 32)}`;
}

function formatCurrency(amount) {
  // Manejar valores NaN, null, undefined o inválidos
  const safeAmount = amount === null || amount === undefined || isNaN(amount) ? 0 : amount;
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(safeAmount);
}

// Capitalizar primera letra de un texto
function capitalizeFirst(text) {
  try {
    if (!text || typeof text !== 'string') {
      return '';
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
  } catch (_) {
    return text;
  }
}

// Calcular y actualizar la fecha de vencimiento con base en días de crédito del proveedor
function actualizarFechaVencimientoFactura() {
  try {
    // Obtener el RFC del proveedor - manejar tanto <select> (legacy) como <input> (nuevo modelo)
    let rfcProveedor = '';
    const proveedorElement = document.getElementById('proveedorFactura');
    if (proveedorElement) {
      if (proveedorElement.tagName === 'SELECT') {
        // Modelo antiguo: <select>
        rfcProveedor = proveedorElement.value || '';
      } else if (proveedorElement.tagName === 'INPUT') {
        // Modelo nuevo: searchable-select - el valor se guarda en el hidden input
        const hiddenInput = document.getElementById('proveedorFactura_value');
        if (hiddenInput) {
          rfcProveedor = hiddenInput.value || '';
        }
      }
    }
    let fechaEmision = document.getElementById('fechaEmisionFactura')
      ? document.getElementById('fechaEmisionFactura').value
      : '';

    // Si no hay fecha de emisión aún, usar hoy para calcular
    if (!fechaEmision) {
      const hoyStr = new Date().toISOString().split('T')[0];
      if (document.getElementById('fechaEmisionFactura')) {
        document.getElementById('fechaEmisionFactura').value = hoyStr;
      }
      fechaEmision = hoyStr;
    }

    let diasCredito = 0;
    if (rfcProveedor && window.configuracionManager) {
      let proveedor = null;
      if (typeof window.configuracionManager.getProveedor === 'function') {
        proveedor = window.configuracionManager.getProveedor(rfcProveedor);
      }
      // Fallback: buscar manualmente si getProveedor no devuelve
      if (!proveedor && typeof window.configuracionManager.getProveedores === 'function') {
        const proveedores = window.configuracionManager.getProveedores();
        if (proveedores) {
          if (Array.isArray(proveedores)) {
            proveedor = proveedores.find(p => p && p.rfc === rfcProveedor);
          } else if (typeof proveedores === 'object') {
            proveedor = proveedores[rfcProveedor];
          }
        }
      }
      if (proveedor) {
        // Soportar distintas llaves/nombres para días de crédito
        const posiblesClaves = [
          'diasCredito',
          'dias_credito',
          'diasDeCredito',
          'diasdecredito',
          'creditoDias'
        ];
        for (const clave of posiblesClaves) {
          if (proveedor[clave] != null && proveedor[clave] !== '') {
            diasCredito = parseInt(proveedor[clave], 10) || 0;
            break;
          }
        }
      }
    }

    const fechaVenc = addDaysToDateString(fechaEmision, diasCredito);
    const vencInput = document.getElementById('fechaVencimientoFactura');
    if (vencInput) {
      vencInput.value = fechaVenc;
    }
    console.log(
      '🧮 CXP vencimiento -> RFC:',
      rfcProveedor,
      'Emision:',
      fechaEmision,
      'DiasCredito:',
      diasCredito,
      'Vence:',
      fechaVenc
    );
  } catch (error) {
    console.error('❌ Error calculando fecha de vencimiento:', error);
  }
}

function addDaysToDateString(dateStr, days) {
  try {
    const parts = dateStr.split('-');
    // yyyy-mm-dd en local
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    if (Number.isNaN(d.getTime())) {
      return dateStr;
    }
    d.setDate(d.getDate() + (Number.isFinite(days) ? days : 0));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  } catch (_) {
    return dateStr;
  }
}

// Mostrar notificación
function showNotification(message, type = 'info') {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
  notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

  document.body.appendChild(notification);

  // Auto-remover después de 5 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

// Seleccionar/deseleccionar todas las facturas
function _toggleSelectAllFacturasCXP(master) {
  document.querySelectorAll('.chk-factura-cxp').forEach(cb => {
    cb.checked = master.checked;
  });
}

// Crear solicitud para facturas seleccionadas (mismo proveedor)
function _crearSolicitudPagoSeleccionadas() {
  const seleccionadas = Array.from(document.querySelectorAll('.chk-factura-cxp:checked'));
  if (seleccionadas.length === 0) {
    alert('Selecciona al menos una factura');
    return;
  }
  const proveedorRfcs = [...new Set(seleccionadas.map(cb => cb.getAttribute('data-proveedor')))];
  if (proveedorRfcs.length !== 1) {
    alert('Las facturas deben ser del mismo proveedor');
    return;
  }
  const proveedorRfc = proveedorRfcs[0];
  const ids = seleccionadas.map(cb => parseInt(cb.value, 10));
  const facturas = facturasCXP.filter(f => ids.includes(f.id));
  const total = facturas.reduce((s, f) => s + (Number(f.monto) || 0), 0);

  // Prellenar el modal de solicitud
  document.getElementById('proveedorSolicitud').value = proveedorRfc;
  document.getElementById('montoSolicitud').value = total;
  // Obtener fecha actual en formato YYYY-MM-DD sin problemas de zona horaria
  const hoy = new Date();
  const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  document.getElementById('fechaSolicitud').value = fechaHoy;
  // Opcional: usar la última fecha de vencimiento como sugerida
  const maxVence = facturas.reduce(
    (max, f) => (max && max > f.fechaVencimiento ? max : f.fechaVencimiento),
    null
  );
  if (maxVence) {
    document.getElementById('fechaRequerida').value = maxVence;
  }
  document.getElementById('prioridadSolicitud').value = 'normal';

  // Renderizar lista de facturas incluidas con checkboxes bloqueados
  const facturasDiv = document.getElementById('facturasSeleccionadas');
  facturasDiv.innerHTML = '';
  facturas.forEach(f => {
    const wrap = document.createElement('div');
    wrap.className = 'form-check';
    wrap.innerHTML = `
            <input class="form-check-input" type="checkbox" id="factura_${f.id}" value="${f.id}" checked disabled>
            <label class="form-check-label" for="factura_${f.id}">
                <strong>${f.numeroFactura}</strong> - $${formatCurrency(f.monto)} - ${f.descripcion || ''}
            </label>
        `;
    facturasDiv.appendChild(wrap);
  });

  // Abrir modal
  const modal = new bootstrap.Modal(document.getElementById('modalSolicitudPago'));
  modal.show();

  // Botón de envío en modo crear
  _editingSolicitudId = null;
  const btn = document.querySelector('#modalSolicitudPago .modal-footer .btn.btn-primary');
  if (btn) {
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Solicitud';
    btn.onclick = crearSolicitudPago;
  }
}

// Mostrar/ocultar grupo de tipo de cambio
function toggleTipoCambioFactura() {
  const moneda = document.getElementById('tipoMonedaFactura')
    ? document.getElementById('tipoMonedaFactura').value
    : 'MXN';
  const grupo = document.getElementById('grupoTipoCambioFactura');
  const input = document.getElementById('tipoCambioFactura');
  if (!grupo || !input) {
    return;
  }
  if (moneda === 'USD') {
    grupo.style.display = '';
    input.required = true;
  } else {
    grupo.style.display = 'none';
    input.required = false;
    input.value = '';
  }
}

// ===== FUNCIONES PLACEHOLDER =====

// Funciones que se implementarán en futuras iteraciones
function ensureFacturaDetalleModal() {
  const modal = document.getElementById('modalDetalleFactura');
  if (modal) {
    return modal;
  }
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
        <div class="modal fade" id="modalDetalleFactura" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="fas fa-file-invoice"></i> Detalle de Factura</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="detalleFacturaBody"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>`;
  document.body.appendChild(wrapper.firstElementChild);
  return document.getElementById('modalDetalleFactura');
}

async function verDetallesFacturaCXP(id) {
  const factura = facturasCXP.find(f => f.id === id);
  if (!factura) {
    return;
  }
  const modalEl = ensureFacturaDetalleModal();
  const body = modalEl.querySelector('#detalleFacturaBody');

  // Calcular monto pendiente
  const montoPendiente =
    factura.montoPendiente !== undefined ? factura.montoPendiente : factura.monto;
  const montoOriginal = factura.monto;
  const esPagoParcial = montoPendiente < montoOriginal && montoPendiente > 0;

  // Formatear UUID si existe
  const folioFiscalFormateado = factura.folioFiscal
    ? typeof formatearUUID === 'function'
      ? formatearUUID(factura.folioFiscal)
      : factura.folioFiscal
    : '-';

  // Formatear montos
  const subtotal = factura.subtotal ? formatCurrency(factura.subtotal) : '-';
  const iva = factura.iva ? formatCurrency(factura.iva) : '-';
  const ivaRetenido = factura.ivaRetenido ? formatCurrency(factura.ivaRetenido) : '-';
  const isrRetenido = factura.isrRetenido ? formatCurrency(factura.isrRetenido) : '-';
  const otrosMontos = factura.otrosMontos ? formatCurrency(factura.otrosMontos) : '-';

  // Formatear categoría y prioridad
  const categoria = factura.categoria || '-';
  const prioridad = factura.prioridad || '-';
  const prioridadBadge =
    prioridad === 'urgente' ? 'danger' : prioridad === 'alta' ? 'warning' : 'info';

  const camposHtml = `
        <div class="row g-3">
            <div class="col-md-6"><strong>Número:</strong> ${factura.numeroFactura}</div>
            <div class="col-md-6"><strong>Proveedor:</strong> ${factura.proveedor}</div>
            <div class="col-md-6"><strong>Folio Fiscal (UUID):</strong> ${folioFiscalFormateado}</div>
            <div class="col-md-6"><strong>Moneda:</strong> ${factura.tipoMoneda}${factura.tipoMoneda === 'USD' && factura.tipoCambio ? ` (TC: ${factura.tipoCambio})` : ''}</div>
            <div class="col-md-6"><strong>Emisión:</strong> ${formatDate(factura.fechaEmision)}</div>
            <div class="col-md-6"><strong>Vencimiento:</strong> ${formatDate(factura.fechaVencimiento)}</div>
            <div class="col-md-6"><strong>Subtotal:</strong> $${subtotal}</div>
            <div class="col-md-6"><strong>IVA:</strong> $${iva}</div>
            <div class="col-md-6"><strong>IVA Retenido:</strong> $${ivaRetenido}</div>
            <div class="col-md-6"><strong>ISR Retenido:</strong> $${isrRetenido}</div>
            <div class="col-md-6"><strong>Otros Montos:</strong> $${otrosMontos}</div>
            <div class="col-md-6"><strong>Monto Original:</strong> $${formatCurrency(montoOriginal)}</div>
            <div class="col-md-6"><strong>Monto Pendiente:</strong> $${formatCurrency(montoPendiente)} ${esPagoParcial ? '<span class="badge bg-warning text-dark">Pago Parcial</span>' : ''}</div>
            <div class="col-md-6"><strong>Categoría:</strong> ${categoria}</div>
            <div class="col-md-6"><strong>Prioridad:</strong> <span class="badge bg-${prioridadBadge}">${capitalizeFirst(prioridad)}</span></div>
            <div class="col-12"><strong>Descripción:</strong><br>${factura.descripcion || '-'}</div>
        </div>`;
  let adjuntosHtml = '';
  if (Array.isArray(factura.adjuntos) && factura.adjuntos.length > 0) {
    const items = factura.adjuntos
      .map((a, _idx) => {
        if (a.base64) {
          return `<li><a href="${a.base64}" target="_blank" download="${a.nombre}"><i class="fas fa-paperclip"></i> ${a.nombre} <small class="text-muted">(${a.tipo || 'archivo'})</small></a></li>`;
        }
        return `<li><i class="fas fa-paperclip"></i> ${a.nombre} <small class="text-muted">(${a.tipo || 'archivo'})</small> <span class="text-muted">(contenido disponible tras recarga)</span></li>`;
      })
      .join('');
    adjuntosHtml = `<div class="mt-3"><strong>Adjuntos:</strong><ul>${items}</ul></div>`;
  } else {
    adjuntosHtml =
      '<div class="mt-3 text-muted"><i class="fas fa-paperclip"></i> Sin adjuntos</div>';
  }

  // Buscar historial de solicitudes pagadas
  let historialHtml = '';
  try {
    // 1. Buscar todas las solicitudes que incluyen esta factura
    const solicitudesRelacionadas = solicitudesPago.filter(
      s => Array.isArray(s.facturasIncluidas) && s.facturasIncluidas.includes(factura.id)
    );

    if (solicitudesRelacionadas.length > 0) {
      // 2. Cargar órdenes de pago desde Tesorería
      let ordenesPago = [];
      try {
        // FIREBASE ES LA FUENTE DE VERDAD - Intentar cargar desde repositorio primero
        if (window.firebaseRepos?.tesoreria) {
          try {
            ordenesPago = (await window.firebaseRepos.tesoreria.getAllOrdenesPago()) || [];
            if (ordenesPago.length > 0) {
              console.log(`✅ ${ordenesPago.length} órdenes de pago cargadas desde Firebase`);
            }
          } catch (error) {
            console.warn(
              '⚠️ Error cargando órdenes desde Firebase, usando localStorage como respaldo:',
              error
            );
          }
        }

        // Fallback a localStorage solo si Firebase no está disponible o falló
        if (ordenesPago.length === 0) {
          const ordenesData = localStorage.getItem('erp_teso_ordenes_pago');
          if (ordenesData) {
            ordenesPago = JSON.parse(ordenesData);
            console.log(
              `⚠️ ${ordenesPago.length} órdenes cargadas desde localStorage (respaldo de emergencia)`
            );
          }
        }
      } catch (e) {
        console.warn('⚠️ Error cargando órdenes de pago:', e);
      }

      // 3. Buscar órdenes pagadas relacionadas con las solicitudes
      const ordenesPagadas = [];
      solicitudesRelacionadas.forEach(solicitud => {
        const ordenesDeSolicitud = ordenesPago.filter(
          orden =>
            orden.solicitudId === solicitud.id &&
            (orden.estado === 'pagado' || orden.estado === 'pagada')
        );
        ordenesDeSolicitud.forEach(orden => {
          ordenesPagadas.push({
            orden: orden,
            solicitud: solicitud
          });
        });
      });

      // 4. Ordenar por fecha de pago (más reciente primero)
      ordenesPagadas.sort((a, b) => {
        const fechaA = a.orden.fechaPago || a.orden.createdAt || 0;
        const fechaB = b.orden.fechaPago || b.orden.createdAt || 0;
        return new Date(fechaB) - new Date(fechaA);
      });

      // 5. Generar HTML del historial
      if (ordenesPagadas.length > 0) {
        const formatearFecha = fechaStr => {
          if (!fechaStr) {
            return 'N/A';
          }
          try {
            const fecha = new Date(fechaStr);
            if (isNaN(fecha.getTime())) {
              return 'N/A';
            }
            return fecha.toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          } catch (error) {
            return 'N/A';
          }
        };

        const filasHistorial = ordenesPagadas
          .map((item, _index) => {
            const { orden } = item;
            const { solicitud } = item;
            const fechaPago = formatearFecha(orden.fechaPago || orden.createdAt);
            const numeroOrden = orden.id ? `OP-${String(orden.id).slice(-6)}` : 'N/A';

            return `
                        <tr>
                            <td>${_index + 1}</td>
                            <td><strong>${numeroOrden}</strong></td>
                            <td>${formatearFecha(solicitud.fechaSolicitud || solicitud.createdAt)}</td>
                            <td>${fechaPago}</td>
                            <td class="text-end">$${formatCurrency(orden.monto || 0)}</td>
                            <td>${orden.metodoPago || 'N/A'}</td>
                            <td><span class="badge bg-success text-white">Pagada</span></td>
                        </tr>
                    `;
          })
          .join('');

        historialHtml = `
                    <div class="col-12 mt-4">
                        <div class="card border-success">
                            <div class="card-header bg-success text-white">
                                <h6 class="mb-0"><i class="fas fa-history"></i> Historial de Solicitudes Pagadas</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-sm table-bordered">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>N° Orden</th>
                                                <th>Fecha Solicitud</th>
                                                <th>Fecha Pago</th>
                                                <th class="text-end">Monto</th>
                                                <th>Método de Pago</th>
                                                <th>Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${filasHistorial}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
      }
    }
  } catch (error) {
    console.error('❌ Error cargando historial de solicitudes pagadas:', error);
  }

  body.innerHTML = camposHtml + adjuntosHtml + historialHtml;
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

// Exponer función globalmente
window.verDetallesFacturaCXP = verDetallesFacturaCXP;

// (el editor real está definido arriba)

function _verDetallesProveedor(id) {
  console.log('Ver detalles proveedor:', id);
  showNotification('Función en desarrollo', 'info');
}

// ===== FUNCIONES DE LIMPIEZA Y CORRECCIÓN DE DATOS =====

// Función para eliminar datos de ejemplo de CXP
async function _eliminarDatosEjemploCXP() {
  console.log('🧹 Eliminando datos de ejemplo de CXP...');

  try {
    // Usar variables globales cargadas desde Firebase (NO localStorage)
    console.log(`📋 Facturas antes de limpiar: ${facturasCXP.length}`);

    // Filtrar facturas reales (eliminar las de ejemplo)
    const facturasReales = facturasCXP.filter(
      factura =>
        factura.proveedor !== 'Proveedor ABC S.A. de C.V.' &&
        factura.proveedor !== 'Servicios XYZ Ltda.' &&
        !factura.proveedor?.includes('ABC') &&
        !factura.proveedor?.includes('XYZ') &&
        !factura.proveedor?.includes('Prueba') &&
        !factura.proveedor?.includes('Demo') &&
        !factura.proveedor?.includes('Test') &&
        !factura.proveedor?.includes('Ejemplo')
    );

    // Actualizar variable global
    facturasCXP = facturasReales;
    console.log(`✅ Facturas después de limpiar: ${facturasCXP.length}`);

    // Limpiar solicitudes de pago
    console.log(`📋 Solicitudes antes de limpiar: ${solicitudesPago.length}`);

    // Filtrar solicitudes reales (eliminar las de ejemplo)
    const solicitudesReales = solicitudesPago.filter(
      solicitud =>
        solicitud.proveedor !== 'Proveedor ABC S.A. de C.V.' &&
        solicitud.proveedor !== 'Servicios XYZ Ltda.' &&
        !solicitud.proveedor?.includes('ABC') &&
        !solicitud.proveedor?.includes('XYZ') &&
        !solicitud.proveedor?.includes('Prueba') &&
        !solicitud.proveedor?.includes('Demo') &&
        !solicitud.proveedor?.includes('Test') &&
        !solicitud.proveedor?.includes('Ejemplo')
    );

    // Actualizar variable global
    solicitudesPago = solicitudesReales;
    console.log(`✅ Solicitudes después de limpiar: ${solicitudesPago.length}`);

    // Guardar cambios en Firebase
    await saveCXPData();

    console.log('🎉 Limpieza de CXP completada');
    console.log('📊 Resumen final:');
    console.log(`   - Facturas reales: ${facturasCXP.length}`);
    console.log(`   - Solicitudes reales: ${solicitudesPago.length}`);

    return {
      facturas: facturasCXP.length,
      solicitudes: solicitudesPago.length
    };
  } catch (error) {
    console.error('❌ Error durante la limpieza de CXP:', error);
    return null;
  }
}

// Función para corregir factura A1222
async function corregirFacturaA1222() {
  console.log('🔧 Corrigiendo factura A1222...');

  try {
    // Usar variable global cargada desde Firebase (NO localStorage)
    const facturaIndex = facturasCXP.findIndex(f => f.numeroFactura === 'A1222');

    if (facturaIndex !== -1) {
      const factura = facturasCXP[facturaIndex];
      console.log('📋 Factura A1222 antes de corregir:');
      console.log('   - Monto total:', factura.monto);
      console.log('   - Monto pagado:', factura.montoPagado);
      console.log('   - Monto pendiente:', factura.montoPendiente);
      console.log('   - Estado:', factura.estado);

      // Corregir los montos
      factura.montoPagado = factura.monto; // $15,000
      factura.montoPendiente = 0; // $0
      factura.estado = 'pagada';

      // Actualizar la factura en el array global
      facturasCXP[facturaIndex] = factura;

      // Guardar cambios en Firebase
      await saveCXPData();

      console.log('✅ Factura A1222 corregida:');
      console.log('   - Monto total:', factura.monto);
      console.log('   - Monto pagado:', factura.montoPagado);
      console.log('   - Monto pendiente:', factura.montoPendiente);
      console.log('   - Estado:', factura.estado);

      // Crear una solicitud de pago para mantener consistencia (usar variable global)
      const nuevaSolicitud = {
        id: Date.now(),
        numeroFactura: 'A1222',
        proveedor: factura.proveedor,
        monto: factura.monto,
        descripcion: `Pago de factura ${factura.numeroFactura}`,
        estado: 'aprobada',
        fecha: new Date().toISOString().split('T')[0],
        fechaCreacion: new Date().toISOString()
      };

      // Agregar solicitud a variable global
      solicitudesPago.push(nuevaSolicitud);

      // Guardar cambios en Firebase
      await saveCXPData();

      console.log('✅ Solicitud de pago creada para A1222');

      // Crear movimiento en tesorería usando repositorio (si está disponible)
      if (window.firebaseRepos && window.firebaseRepos.tesoreria) {
        try {
          const nuevoMovimiento = {
            id: Date.now().toString(),
            tipo: 'egreso',
            monto: factura.monto,
            descripcion: `Pago a ${factura.proveedor} - Factura ${factura.numeroFactura}`,
            categoria: 'Cuentas por Pagar',
            fecha: new Date().toISOString().split('T')[0],
            referencia: factura.numeroFactura,
            fechaCreacion: new Date().toISOString()
          };

          await window.firebaseRepos.tesoreria.saveMovimiento(nuevoMovimiento.id, nuevoMovimiento);
          console.log('✅ Movimiento de tesorería creado para A1222 en Firebase');
        } catch (error) {
          console.warn('⚠️ Error creando movimiento en tesorería:', error);
        }
      } else {
        console.warn('⚠️ Repositorio de tesorería no disponible');
      }

      console.log(
        '🎉 Corrección completada. La factura A1222 ahora está correctamente marcada como pagada.'
      );
    } else {
      console.log('❌ Factura A1222 no encontrada');
    }
  } catch (error) {
    console.error('❌ Error al corregir factura A1222:', error);
  }
}

// Hacer funciones disponibles globalmente
window.eliminarDatosEjemploCXP = _eliminarDatosEjemploCXP;
window.corregirFacturaA1222 = corregirFacturaA1222;

function _editarProveedor(id) {
  console.log('Editar proveedor:', id);
  showNotification('Función en desarrollo', 'info');
}

function ensureSolicitudDetalleModal() {
  const modal = document.getElementById('modalDetalleSolicitud');
  if (modal) {
    return modal;
  }
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
        <div class="modal fade" id="modalDetalleSolicitud" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="fas fa-paper-plane"></i> Detalle de Solicitud de Pago</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="detalleSolicitudBody"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>`;
  document.body.appendChild(wrapper.firstElementChild);
  return document.getElementById('modalDetalleSolicitud');
}

function _verDetallesSolicitud(id) {
  const solicitud = solicitudesPago.find(s => s.id === id);
  if (!solicitud) {
    if (typeof showNotification === 'function') {
      showNotification('Solicitud no encontrada', 'warning');
    } else {
      alert('Solicitud no encontrada');
    }
    return;
  }

  const facturas = facturasCXP.filter(
    f => solicitud.facturasIncluidas && solicitud.facturasIncluidas.includes(f.id)
  );
  const modalEl = ensureSolicitudDetalleModal();
  if (!modalEl) {
    console.error('No se pudo crear el modal de detalles de solicitud');
    if (typeof showNotification === 'function') {
      showNotification('Error al mostrar detalles', 'error');
    } else {
      alert('Error al mostrar detalles');
    }
    return;
  }
  const body = modalEl.querySelector('#detalleSolicitudBody');
  if (!body) {
    console.error('No se encontró el cuerpo del modal');
    return;
  }

  // Determinar clase de estado
  let estadoClass = 'bg-secondary';
  if (solicitud.estado === 'pagada') {
    estadoClass = 'bg-success';
  } else if (solicitud.estado === 'parcial pagado') {
    estadoClass = 'bg-info';
  } else if (solicitud.estado === 'en tesoreria') {
    estadoClass = 'bg-primary';
  } else if (solicitud.estado === 'rechazada') {
    estadoClass = 'bg-danger';
  } else if (solicitud.estado === 'solicitud' || solicitud.estado === 'pendiente') {
    estadoClass = 'bg-warning';
  } else if (solicitud.estado === 'aceptada') {
    estadoClass = 'bg-primary';
  } // compatibilidad

  // Determinar clase de prioridad
  let prioridadClass = 'bg-secondary';
  if (solicitud.prioridad === 'urgente') {
    prioridadClass = 'bg-danger';
  } else if (solicitud.prioridad === 'alta') {
    prioridadClass = 'bg-warning';
  } else {
    prioridadClass = 'bg-info';
  }

  let facturasHtml = '';
  if (facturas.length > 0) {
    facturasHtml = `
            <div class="mt-3">
                <h6><i class="fas fa-file-invoice me-2"></i>Facturas Incluidas:</h6>
                <div class="table-responsive">
                    <table class="table table-sm table-hover">
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Fecha Emisión</th>
                                <th>Fecha Vencimiento</th>
                                <th>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${facturas
    .map(
      f => `
                                <tr>
                                    <td>${f.numeroFactura}</td>
                                    <td>${formatDate(f.fechaEmision)}</td>
                                    <td>${formatDate(f.fechaVencimiento)}</td>
                                    <td>$${formatCurrency(f.monto)}</td>
                                </tr>
                            `
    )
    .join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
  } else {
    facturasHtml =
      '<div class="mt-3 text-muted"><i class="fas fa-info-circle me-2"></i>No hay facturas asociadas</div>';
  }

  const detallesHtml = `
        <div class="row g-3">
            <div class="col-md-6">
                <strong><i class="fas fa-hashtag me-2"></i>ID Solicitud:</strong>
                <p>SOL-${solicitud.id.toString().padStart(4, '0')}</p>
            </div>
            <div class="col-md-6">
                <strong><i class="fas fa-building me-2"></i>Proveedor:</strong>
                <p>${solicitud.proveedor}</p>
            </div>
            <div class="col-md-6">
                <strong><i class="fas fa-calendar me-2"></i>Fecha Solicitud:</strong>
                <p>${formatDate(solicitud.fechaSolicitud)}</p>
            </div>
            <div class="col-md-6">
                <strong><i class="fas fa-calendar-check me-2"></i>Fecha Requerida:</strong>
                <p>${formatDate(solicitud.fechaRequerida)}</p>
            </div>
            <div class="col-md-6">
                <strong><i class="fas fa-exclamation-triangle me-2"></i>Prioridad:</strong>
                <p><span class="badge ${prioridadClass}">${capitalizeFirst(solicitud.prioridad)}</span></p>
            </div>
            <div class="col-md-6">
                <strong><i class="fas fa-info-circle me-2"></i>Estado:</strong>
                <p><span class="badge ${estadoClass}">${capitalizeFirst(solicitud.estado)}</span></p>
            </div>
            <div class="col-md-6">
                <strong><i class="fas fa-dollar-sign me-2"></i>Monto Total:</strong>
                <p class="h5 text-primary">$${formatCurrency(solicitud.monto)}</p>
            </div>
            ${
  solicitud.metodoPago
    ? `
            <div class="col-md-6">
                <strong><i class="fas fa-credit-card me-2"></i>Método de Pago:</strong>
                <p>${capitalizeFirst(solicitud.metodoPago)}</p>
            </div>
            `
    : ''
}
            ${
  solicitud.justificacion
    ? `
            <div class="col-12">
                <strong><i class="fas fa-file-alt me-2"></i>Justificación:</strong>
                <p class="border rounded p-2 bg-light">${solicitud.justificacion}</p>
            </div>
            `
    : ''
}
        </div>
        ${facturasHtml}
    `;

  body.innerHTML = detallesHtml;

  // Asegurarse de que Bootstrap esté disponible
  if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
    console.error('Bootstrap no está disponible');
    if (typeof showNotification === 'function') {
      showNotification('Error: Bootstrap no está cargado', 'error');
    } else {
      alert('Error: Bootstrap no está cargado');
    }
    return;
  }

  try {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  } catch (error) {
    console.error('Error al mostrar modal:', error);
    if (typeof showNotification === 'function') {
      showNotification('Error al mostrar detalles', 'error');
    } else {
      alert(`Error al mostrar detalles: ${error.message}`);
    }
  }
}

async function _aprobarSolicitud(id) {
  const solicitud = solicitudesPago.find(s => s.id === id);
  if (!solicitud) {
    return;
  }

  // Obtener contraseña configurada
  const correctPassword = window.getPasswordAprobacion ? window.getPasswordAprobacion() : null;
  
  if (!correctPassword) {
    alert('Error: Contraseña de aprobación no configurada. Por favor, configúrala en Configuración > Sistema.');
    console.error('❌ Password de aprobación no configurado');
    return;
  }

  const pass = prompt('Ingrese contraseña de aprobación:');
  if (pass !== correctPassword) {
    alert('Contraseña incorrecta');
    return;
  }
  solicitud.estado = 'en tesoreria';

  // NO actualizar montos cuando se aprueba la solicitud
  // Solo cambiar el estado a 'en tesoreria' - los montos se actualizarán cuando Tesorería realice el pago
  if (solicitud.facturasIncluidas && Array.isArray(solicitud.facturasIncluidas)) {
    facturasCXP = facturasCXP.map(f => {
      if (!solicitud.facturasIncluidas.includes(f.id)) {
        return f;
      }

      // Solo cambiar el estado, NO tocar los montos
      return {
        ...f,
        // Cambiar estado a 'en tesoreria' cuando se aprueba la solicitud
        // Los montos (montoPagado y montoPendiente) se mantienen iguales
        // Solo Tesorería puede actualizar los montos cuando realmente se realiza el pago
        estado: 'en tesoreria'
      };
    });
  }
  // Guardar solicitud actualizada en Firebase
  try {
    if (window.firebaseRepos && window.firebaseRepos.cxp) {
      const solicitudId = `solicitud_${solicitud.id}`;
      await window.firebaseRepos.cxp.saveSolicitud(solicitudId, solicitud);
      console.log('✅ Solicitud actualizada en Firebase:', solicitudId);
    }
  } catch (error) {
    console.error('❌ Error guardando solicitud en Firebase:', error);
  }

  saveCXPData();

  // Crear Orden de Pago en Tesorería
  let ordenCreada = null;
  try {
    // Intentar múltiples veces si tesoreriaManager no está disponible inmediatamente
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts && !ordenCreada) {
      if (
        window.tesoreriaManager &&
        typeof window.tesoreriaManager.addOrdenPagoFromSolicitud === 'function'
      ) {
        ordenCreada = await window.tesoreriaManager.addOrdenPagoFromSolicitud(solicitud);
        if (ordenCreada) {
          console.log('✅ Orden de pago creada en Tesorería:', ordenCreada.id);
          console.log('📋 Datos de la orden creada:', {
            id: ordenCreada.id,
            solicitudId: ordenCreada.solicitudId,
            proveedor: ordenCreada.proveedor,
            monto: ordenCreada.monto,
            estado: ordenCreada.estado
          });
          break;
        } else {
          console.warn('⚠️ No se pudo crear la orden de pago (puede que ya exista)');
          break;
        }
      } else {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(
            `⏳ tesoreriaManager no disponible aún, esperando... (${attempts}/${maxAttempts})`
          );
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.warn('⚠️ tesoreriaManager no está disponible después de varios intentos');
          // Intentar crear la orden directamente usando el código de tesoreria.js
          console.log('🔄 Intentando crear orden directamente...');
          try {
            const ordenes = JSON.parse(localStorage.getItem('erp_teso_ordenes_pago') || '[]');

            // Verificar por solicitudId
            const existePorSolicitudId = ordenes.some(op => op.solicitudId === solicitud.id);

            // También verificar por monto y proveedor para evitar duplicados
            const existePorDatos = ordenes.some(
              op =>
                op.proveedor === solicitud.proveedor &&
                Math.abs(parseFloat(op.monto || 0) - parseFloat(solicitud.monto || 0)) < 0.01 &&
                op.facturasIncluidas &&
                Array.isArray(op.facturasIncluidas) &&
                solicitud.facturasIncluidas &&
                Array.isArray(solicitud.facturasIncluidas) &&
                op.facturasIncluidas.length === solicitud.facturasIncluidas.length &&
                op.facturasIncluidas.every((fid, idx) => fid === solicitud.facturasIncluidas[idx])
            );

            if (existePorSolicitudId || existePorDatos) {
              console.log(
                'ℹ️ Orden ya existe para esta solicitud (verificación manual), omitiendo creación'
              );
              ordenCreada = null; // No crear orden si ya existe
            } else {
              // Crear orden manualmente usando la misma función que usa tesoreria.js
              const orden = {
                id: Date.now(),
                solicitudId: solicitud.id,
                proveedor: solicitud.proveedor || '',
                monto: parseFloat(solicitud.monto || 0),
                facturasIncluidas: Array.isArray(solicitud.facturasIncluidas)
                  ? solicitud.facturasIncluidas.slice()
                  : [],
                prioridad: solicitud.prioridad || 'normal',
                fechaRequerida: solicitud.fechaRequerida || null,
                estado: 'por_pagar',
                metodoPago: solicitud.metodoPago || 'transferencia',
                adjuntos: [],
                tipo: 'orden_pago', // Campo importante para que el listener lo detecte
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };

              // Solo incluir proveedorId si tiene valor válido
              if (
                solicitud.proveedorId !== undefined &&
                solicitud.proveedorId !== null &&
                solicitud.proveedorId !== ''
              ) {
                orden.proveedorId = solicitud.proveedorId;
              }

              ordenes.push(orden);
              localStorage.setItem('erp_teso_ordenes_pago', JSON.stringify(ordenes));
              console.log('✅ Orden creada manualmente en localStorage:', orden.id);
              console.log('📋 Datos de la orden creada manualmente:', {
                id: orden.id,
                solicitudId: orden.solicitudId,
                proveedor: orden.proveedor,
                monto: orden.monto,
                tipo: orden.tipo
              });

              // Intentar guardar en Firebase también
              if (window.firebaseRepos?.tesoreria) {
                try {
                  // Esperar a que el repositorio esté inicializado
                  let firebaseAttempts = 0;
                  while (
                    firebaseAttempts < 10 &&
                    (!window.firebaseRepos.tesoreria.db || !window.firebaseRepos.tesoreria.tenantId)
                  ) {
                    firebaseAttempts++;
                    await new Promise(resolve => setTimeout(resolve, 500));
                    if (window.firebaseRepos.tesoreria && !window.firebaseRepos.tesoreria.db) {
                      await window.firebaseRepos.tesoreria.init();
                    }
                  }

                  if (
                    window.firebaseRepos.tesoreria.db &&
                    window.firebaseRepos.tesoreria.tenantId
                  ) {
                    const ordenId = `orden_${orden.id}`;
                    const ordenData = {
                      ...orden,
                      tipo: 'orden_pago',
                      fechaCreacion: orden.createdAt || new Date().toISOString()
                    };

                    await window.firebaseRepos.tesoreria.saveOrdenPago(ordenId, ordenData);
                    console.log(
                      `✅ Orden de Pago guardada en Firebase (fallback): ${ordenId}`,
                      ordenData
                    );
                    ordenCreada = orden; // Marcar como creada para que se retorne
                  } else {
                    console.warn(
                      '⚠️ Repositorio Tesorería no inicializado completamente para guardar orden (fallback)'
                    );
                    ordenCreada = orden; // Marcar como creada aunque no se guardó en Firebase
                  }
                } catch (error) {
                  console.error('❌ Error guardando orden en Firebase (fallback):', error);
                  ordenCreada = orden; // Marcar como creada aunque falló Firebase
                }
              } else {
                ordenCreada = orden; // Marcar como creada si Firebase no está disponible
              }

              // Guardar en Firebase si está disponible
              if (window.firebaseRepos?.tesoreria) {
                try {
                  let firebaseAttempts = 0;
                  while (
                    firebaseAttempts < 10 &&
                    (!window.firebaseRepos.tesoreria.db || !window.firebaseRepos.tesoreria.tenantId)
                  ) {
                    firebaseAttempts++;
                    await new Promise(resolve => setTimeout(resolve, 500));
                    if (window.firebaseRepos.tesoreria && !window.firebaseRepos.tesoreria.db) {
                      await window.firebaseRepos.tesoreria.init();
                    }
                  }

                  if (
                    window.firebaseRepos.tesoreria.db &&
                    window.firebaseRepos.tesoreria.tenantId
                  ) {
                    const ordenId = `orden_${orden.id}`;
                    const ordenData = {
                      ...orden,
                      tipo: 'orden_pago', // Asegurar que siempre tenga el tipo
                      fechaCreacion: orden.createdAt || new Date().toISOString()
                    };
                    await window.firebaseRepos.tesoreria.saveOrdenPago(ordenId, ordenData);
                    console.log('✅ Orden guardada en Firebase (fallback):', ordenId, ordenData);
                    ordenCreada = orden; // Marcar como creada para que se retorne
                  }
                } catch (firebaseError) {
                  console.error('❌ Error guardando orden en Firebase:', firebaseError);
                }
              }

              ordenCreada = orden;
            }
          } catch (manualError) {
            console.error('❌ Error creando orden manualmente:', manualError);
          }
        }
      }
    }

    // Notificar al usuario si la orden se creó
    if (ordenCreada) {
      console.log('✅ Orden de pago creada exitosamente');
    }
  } catch (e) {
    console.error('❌ No se pudo crear la orden de pago en Tesorería:', e);
    console.error('Stack:', e.stack);
  }
  loadSolicitudesCXP();
  loadFacturasCXP();
  updateCXPMetrics();
  showNotification('✅ Solicitud aceptada y orden de pago creada en Tesorería', 'success');
}

function _rechazarSolicitud(id) {
  const solicitud = solicitudesPago.find(s => s.id === id);
  if (!solicitud) {
    return;
  }
  solicitud.estado = 'rechazada';
  // Propagar a facturas incluidas: cambiar a 'SR-Pendiente' (Solicitud Rechazada - Pendiente)
  if (solicitud.facturasIncluidas && Array.isArray(solicitud.facturasIncluidas)) {
    facturasCXP = facturasCXP.map(f =>
      solicitud.facturasIncluidas.includes(f.id) ? { ...f, estado: 'SR-Pendiente' } : f
    );
  }
  saveCXPData();
  loadSolicitudesCXP();
  loadFacturasCXP();
  updateCXPMetrics();
  showNotification('✅ Solicitud rechazada', 'warning');
}

async function _eliminarSolicitud(id) {
  const solicitud = solicitudesPago.find(s => s.id === id);
  if (!solicitud) {
    if (typeof showNotification === 'function') {
      showNotification('Solicitud no encontrada', 'error');
    } else {
      alert('Solicitud no encontrada');
    }
    return;
  }

  // Confirmar eliminación
  const confirmar = confirm(
    `¿Estás seguro de eliminar la solicitud SOL-${solicitud.id.toString().padStart(4, '0')}?\n\nEsta acción no se puede deshacer.`
  );
  if (!confirmar) {
    return;
  }

  try {
    // Si la solicitud está en tesorería, también eliminar la orden de pago relacionada
    if (solicitud.estado === 'en tesoreria' && window.tesoreriaManager) {
      try {
        const ordenes = await window.tesoreriaManager.loadOrdenes();
        const ordenRelacionada = Array.isArray(ordenes)
          ? ordenes.find(o => o.solicitudId === solicitud.id)
          : null;

        if (ordenRelacionada) {
          // Verificar si la orden ya está pagada - si está pagada, no se puede eliminar la solicitud
          if (
            ordenRelacionada.estado === 'pagado' ||
            ordenRelacionada.estado === 'pagada' ||
            ordenRelacionada.estado === 'parcial pagado'
          ) {
            if (typeof showNotification === 'function') {
              showNotification(
                'No se puede eliminar la solicitud porque la orden de pago ya está pagada o parcialmente pagada',
                'error'
              );
            } else {
              alert(
                'No se puede eliminar la solicitud porque la orden de pago ya está pagada o parcialmente pagada'
              );
            }
            return;
          }

          // Eliminar la orden de pago relacionada
          if (window.tesoreriaUI && typeof window.tesoreriaUI.eliminarOrdenPago === 'function') {
            await window.tesoreriaUI.eliminarOrdenPago(ordenRelacionada.id);
            console.log('✅ Orden de pago relacionada eliminada');
          } else if (
            window.tesoreriaManager &&
            typeof window.tesoreriaManager.eliminarOrdenPago === 'function'
          ) {
            await window.tesoreriaManager.eliminarOrdenPago(ordenRelacionada.id);
            console.log('✅ Orden de pago relacionada eliminada');
          }
        }
      } catch (error) {
        console.warn('⚠️ Error al intentar eliminar orden de pago relacionada:', error);
        // Continuar con la eliminación de la solicitud aunque falle la eliminación de la orden
      }
    }

    // Revertir el estado de las facturas incluidas a 'pendiente'
    const facturasModificadas = new Set();
    if (solicitud.facturasIncluidas && Array.isArray(solicitud.facturasIncluidas)) {
      facturasCXP = facturasCXP.map(f => {
        if (solicitud.facturasIncluidas.includes(f.id)) {
          facturasModificadas.add(f.id);
          return {
            ...f,
            estado: 'pendiente' // Revertir a pendiente al eliminar la solicitud
          };
        }
        return f;
      });
    }

    // Eliminar la solicitud del array
    solicitudesPago = solicitudesPago.filter(s => s.id !== id);

    // Guardar cambios en localStorage
    saveCXPData();

    // Guardar facturas modificadas en Firebase
    if (window.firebaseRepos?.cxp && facturasModificadas.size > 0) {
      try {
        const facturasParaGuardar = facturasCXP.filter(f => facturasModificadas.has(f.id));
        for (const factura of facturasParaGuardar) {
          const facturaId = `factura_${factura.id}`;
          await window.firebaseRepos.cxp.saveFactura(facturaId, factura);
        }
        console.log(`✅ ${facturasParaGuardar.length} factura(s) actualizada(s) en Firebase`);
      } catch (error) {
        console.warn('⚠️ Error guardando facturas modificadas en Firebase:', error);
      }
    }

    // Eliminar solicitud de Firebase si existe
    if (window.firebaseRepos?.cxp) {
      try {
        const solicitudIdFirebase = `solicitud_${id}`;
        await window.firebaseRepos.cxp.delete(solicitudIdFirebase);
        console.log(`✅ Solicitud eliminada de Firebase: ${solicitudIdFirebase}`);
      } catch (error) {
        console.warn('⚠️ Error eliminando solicitud de Firebase:', error);
        // Continuar aunque falle la eliminación en Firebase
      }
    }

    // Actualizar vista
    loadSolicitudesCXP();
    loadFacturasCXP();
    updateCXPMetrics();

    // Mostrar notificación
    if (typeof showNotification === 'function') {
      showNotification('✅ Solicitud eliminada exitosamente', 'success');
    } else {
      alert('Solicitud eliminada exitosamente');
    }
  } catch (error) {
    console.error('❌ Error al eliminar solicitud:', error);
    if (typeof showNotification === 'function') {
      showNotification(`❌ Error al eliminar la solicitud: ${error.message}`, 'error');
    } else {
      alert(`Error al eliminar la solicitud: ${error.message}`);
    }
  }
}

// ===== FUNCIONES DE SELECCIÓN MÚLTIPLE PARA SOLICITUDES =====

function _toggleSelectAllSolicitudesCXP(master) {
  document.querySelectorAll('.chk-solicitud-cxp').forEach(cb => {
    cb.checked = master.checked;
  });
}

async function _aprobarSolicitudesSeleccionadas() {
  const seleccionadas = Array.from(document.querySelectorAll('.chk-solicitud-cxp:checked'));
  if (seleccionadas.length === 0) {
    if (typeof showNotification === 'function') {
      showNotification('Selecciona al menos una solicitud', 'warning');
    } else {
      alert('Selecciona al menos una solicitud');
    }
    return;
  }

  // Obtener contraseña configurada
  const correctPassword = window.getPasswordAprobacion ? window.getPasswordAprobacion() : null;

  if (!correctPassword) {
    alert('Error: Contraseña de aprobación no configurada. Por favor, configúrala en Configuración > Sistema.');
    console.error('❌ Password de aprobación no configurado');
    return;
  }

  const pass = prompt(
    `Ingrese contraseña de aprobación para ${seleccionadas.length} solicitud(es):`
  );
  if (pass !== correctPassword) {
    if (typeof showNotification === 'function') {
      showNotification('Contraseña incorrecta', 'error');
    } else {
      alert('Contraseña incorrecta');
    }
    return;
  }

  const ids = seleccionadas.map(cb => parseInt(cb.value, 10));
  let aprobadas = 0;
  let errores = 0;
  let ordenesCreadas = 0;
  let ordenesError = 0;

  // Rastrear qué facturas y solicitudes cambiaron para guardar solo esos
  const facturasModificadas = new Set();
  const solicitudesModificadas = [];

  // Procesar cada solicitud de forma secuencial para asegurar que las órdenes se creen correctamente
  for (const id of ids) {
    const solicitud = solicitudesPago.find(s => s.id === id);
    if (!solicitud) {
      errores++;
      continue;
    }

    // Solo aprobar si está pendiente o en solicitud
    if (solicitud.estado === 'solicitud' || solicitud.estado === 'pendiente') {
      solicitud.estado = 'en tesoreria';
      solicitudesModificadas.push(solicitud);

      // NO actualizar montos cuando se aprueba la solicitud
      // Solo cambiar el estado a 'en tesoreria' - los montos se actualizarán cuando Tesorería realice el pago
      if (solicitud.facturasIncluidas && Array.isArray(solicitud.facturasIncluidas)) {
        facturasCXP = facturasCXP.map(f => {
          if (!solicitud.facturasIncluidas.includes(f.id)) {
            return f;
          }

          // Marcar factura como modificada
          facturasModificadas.add(f.id);

          // Solo cambiar el estado, NO tocar los montos
          return {
            ...f,
            // Cambiar estado a 'en tesoreria' cuando se aprueba la solicitud
            // Los montos (montoPagado y montoPendiente) se mantienen iguales
            // Solo Tesorería puede actualizar los montos cuando realmente se realiza el pago
            estado: 'en tesoreria'
          };
        });
      }

      // Crear Orden de Pago en Tesorería (esperar a que se complete)
      try {
        if (
          window.tesoreriaManager &&
          typeof window.tesoreriaManager.addOrdenPagoFromSolicitud === 'function'
        ) {
          const resultado = await window.tesoreriaManager.addOrdenPagoFromSolicitud(solicitud);
          if (resultado !== null) {
            ordenesCreadas++;
            console.log(`✅ Orden de pago creada para solicitud ${solicitud.id}`);
          } else {
            console.warn(`⚠️ Orden de pago ya existía para solicitud ${solicitud.id}`);
          }
        } else {
          console.warn('⚠️ tesoreriaManager no está disponible');
          ordenesError++;
        }
      } catch (e) {
        console.error(
          `❌ No se pudo crear la orden de pago en Tesorería para solicitud ${solicitud.id}:`,
          e
        );
        ordenesError++;
      }

      aprobadas++;
    } else {
      errores++;
    }
  }

  // Guardar solo los cambios (optimizado)
  await saveCXPDataOptimizado(facturasModificadas, solicitudesModificadas);
  loadSolicitudesCXP();
  loadFacturasCXP();
  updateCXPMetrics();

  // Deseleccionar todas
  document.querySelectorAll('.chk-solicitud-cxp').forEach(cb => (cb.checked = false));
  const selectAll = document.getElementById('selectAllSolicitudesCXP');
  if (selectAll) {
    selectAll.checked = false;
  }

  // Mostrar mensaje con detalles
  let mensaje = `✅ ${aprobadas} solicitud(es) autorizada(s)`;
  if (ordenesCreadas > 0) {
    mensaje += `, ${ordenesCreadas} orden(es) de pago creada(s) en Tesorería`;
  }
  if (ordenesError > 0) {
    mensaje += `, ${ordenesError} orden(es) no se pudieron crear`;
  }
  if (errores > 0) {
    mensaje += `, ${errores} no procesada(s)`;
  }

  if (aprobadas > 0) {
    if (typeof showNotification === 'function') {
      showNotification(mensaje, ordenesError > 0 ? 'warning' : 'success');
    } else {
      alert(mensaje);
    }
  } else if (typeof showNotification === 'function') {
    showNotification('No se pudo autorizar ninguna solicitud', 'warning');
  } else {
    alert('No se pudo autorizar ninguna solicitud');
  }
}

function _rechazarSolicitudesSeleccionadas() {
  const seleccionadas = Array.from(document.querySelectorAll('.chk-solicitud-cxp:checked'));
  if (seleccionadas.length === 0) {
    if (typeof showNotification === 'function') {
      showNotification('Selecciona al menos una solicitud', 'warning');
    } else {
      alert('Selecciona al menos una solicitud');
    }
    return;
  }

  const confirmar = confirm(`¿Estás seguro de rechazar ${seleccionadas.length} solicitud(es)?`);
  if (!confirmar) {
    return;
  }

  const ids = seleccionadas.map(cb => parseInt(cb.value, 10));
  let rechazadas = 0;
  let errores = 0;

  ids.forEach(id => {
    const solicitud = solicitudesPago.find(s => s.id === id);
    if (!solicitud) {
      errores++;
      return;
    }

    // Solo rechazar si está pendiente o en solicitud
    if (solicitud.estado === 'solicitud' || solicitud.estado === 'pendiente') {
      solicitud.estado = 'rechazada';

      // Propagar a facturas incluidas: cambiar a 'SR-Pendiente' (Solicitud Rechazada - Pendiente)
      if (solicitud.facturasIncluidas && Array.isArray(solicitud.facturasIncluidas)) {
        facturasCXP = facturasCXP.map(f =>
          solicitud.facturasIncluidas.includes(f.id) ? { ...f, estado: 'SR-Pendiente' } : f
        );
      }

      rechazadas++;
    } else {
      errores++;
    }
  });

  saveCXPData();
  loadSolicitudesCXP();
  loadFacturasCXP();
  updateCXPMetrics();

  // Deseleccionar todas
  document.querySelectorAll('.chk-solicitud-cxp').forEach(cb => (cb.checked = false));
  const selectAll = document.getElementById('selectAllSolicitudesCXP');
  if (selectAll) {
    selectAll.checked = false;
  }

  if (rechazadas > 0) {
    if (typeof showNotification === 'function') {
      showNotification(
        `✅ ${rechazadas} solicitud(es) rechazada(s)${errores > 0 ? `, ${errores} no procesada(s)` : ''}`,
        'warning'
      );
    } else {
      alert(
        `✅ ${rechazadas} solicitud(es) rechazada(s)${errores > 0 ? `, ${errores} no procesada(s)` : ''}`
      );
    }
  } else if (typeof showNotification === 'function') {
    showNotification('No se pudo rechazar ninguna solicitud', 'warning');
  } else {
    alert('No se pudo rechazar ninguna solicitud');
  }
}

// ===== FUNCIÓN PARA CARGAR XLSX =====
function ensureXLSX(then) {
  if (window.XLSX) {
    then(null);
    return;
  }
  const s = document.createElement('script');
  s.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
  s.onload = () => then(null);
  s.onerror = () => then(new Error('No se pudo cargar XLSX'));
  document.head.appendChild(s);
}

// ===== FUNCIONES AUXILIARES PARA EXPORTACIÓN =====
// Función auxiliar para formatear fechas en exportaciones
function formatearFechaCXPExport(fechaStr) {
    if (!fechaStr) {
      return '';
    }
    try {
      if (typeof fechaStr === 'string') {
        if (fechaStr.includes('T')) {
          const fecha = new Date(fechaStr);
          return fecha.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        }
        const fecha = new Date(`${fechaStr}T00:00:00`);
        return fecha.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return String(fechaStr);
    }
  }

// Función auxiliar para formatear estado de facturas en exportaciones
function formatearEstadoFacturaCXPExport(estado) {
    const estados = {
      pendiente: 'Pendiente',
      solicitud: 'En Solicitud',
      aprobada: 'En Solicitud',
      'SR-Pendiente': 'SR-Pendiente',
      'en tesoreria': 'En Tesorería',
      'parcial pagado': 'P-Pagado',
      pagada: 'Pagada',
      validada: 'Validada',
      aceptada: 'En Tesorería',
      rechazada: 'Rechazada'
    };
    return estados[estado] || estado || 'Pendiente';
  }

// Función auxiliar para formatear estado de solicitudes en exportaciones
function formatearEstadoSolicitudCXPExport(estado) {
  const estados = {
    pendiente: 'Pendiente',
    solicitud: 'En Solicitud',
    validada: 'Validada',
    aceptada: 'Aceptada',
    rechazada: 'Rechazada'
  };
  return estados[estado] || estado || '';
}

// Función auxiliar para calcular días vencidos en exportaciones
  function calcularDiasVencidosExport(fechaVencimiento, estado) {
    // Usar la función global calcularDiasVencidos si está disponible
    if (typeof calcularDiasVencidos === 'function') {
      return calcularDiasVencidos(fechaVencimiento, estado);
    }
    // Fallback si la función global no existe
    if (!fechaVencimiento || estado === 'pagada' || estado === 'Pagada') {
      return null;
    }
    try {
      const fechaVenc = new Date(fechaVencimiento);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaVenc.setHours(0, 0, 0, 0);
      const diffTime = fechaVenc - hoy;
      let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        diffDays = diffDays + 1;
      }
      return diffDays;
    } catch (e) {
      return null;
    }
}

// Funciones auxiliares para generar PDFs - aceptan doc como parámetro
function addTextPDF(doc, text, x, y, options = {}) {
  doc.setFontSize(options.fontSize || 12);

  // Manejar colores correctamente
  if (options.color) {
    if (Array.isArray(options.color)) {
      doc.setTextColor(options.color[0], options.color[1], options.color[2]);
    } else {
      doc.setTextColor(options.color);
    }
  } else {
    doc.setTextColor(0, 0, 0); // Negro por defecto
  }

  doc.text(text, x, y);
}

function addLinePDF(doc, x1, y1, x2, y2) {
  doc.setDrawColor(0, 0, 0);
  doc.line(x1, y1, x2, y2);
}

// ===== FUNCIÓN PARA EXPORTAR A EXCEL =====
window.exportarCXPExcel = async function () {
  // Cargar facturas desde Firebase primero, luego localStorage
  let facturas = [];

  if (window.firebaseRepos && window.firebaseRepos.cxp) {
    try {
      const facturasFirebase = await window.firebaseRepos.cxp.loadFacturas();
      if (facturasFirebase && facturasFirebase.length > 0) {
        facturas = facturasFirebase;
        console.log('✅ Facturas cargadas desde Firebase:', facturas.length);
      }
    } catch (error) {
      console.warn('⚠️ Error cargando facturas desde Firebase:', error);
    }
  }

  // Si no hay facturas de Firebase, cargar desde localStorage
  if (facturas.length === 0) {
    try {
      const facturasStorage = localStorage.getItem('erp_cxp_facturas');
      if (facturasStorage) {
        facturas = JSON.parse(facturasStorage);
        console.log('✅ Facturas cargadas desde localStorage:', facturas.length);
      }
    } catch (error) {
      console.error('❌ Error cargando facturas desde localStorage:', error);
    }
  }

  // Si no hay facturas, usar las del array global
  if (facturas.length === 0) {
    facturas = facturasCXP;
  }

  if (!facturas || facturas.length === 0) {
    alert('No hay facturas para exportar.');
    return;
  }

  // Hoja 1: Registro de Facturas (mantener como está)
  const rowsFacturas = facturas.map(factura => ({
    'Fecha de Emisión': formatearFechaCXPExport(factura.fechaEmision),
    Proveedor: factura.proveedor || '',
    'Folio Fiscal': factura.folioFiscal || '',
    'Número de Factura': factura.numeroFactura || '',
    'Tipo de Moneda': factura.tipoMoneda || 'MXN',
    'Tipo de Cambio': factura.tipoCambio ? parseFloat(factura.tipoCambio).toFixed(4) : '',
    Subtotal: factura.subtotal ? parseFloat(factura.subtotal).toFixed(2) : '',
    IVA: factura.iva ? parseFloat(factura.iva).toFixed(2) : '',
    'IVA Retenido': factura.ivaRetenido ? parseFloat(factura.ivaRetenido).toFixed(2) : '',
    'ISR Retenido': factura.isrRetenido ? parseFloat(factura.isrRetenido).toFixed(2) : '',
    'Otros Montos': factura.otrosMontos ? parseFloat(factura.otrosMontos).toFixed(2) : '',
    'Monto Total': factura.monto ? parseFloat(factura.monto).toFixed(2) : '',
    Categoría: factura.categoria || '',
    Prioridad: factura.prioridad || '',
    Descripción: factura.descripcion || ''
  }));

  // Hoja 2: Estado de Cuentas por Pagar
  const rowsEstadoCXP = facturas.map(factura => {
    // Función auxiliar para parsear valores numéricos de forma segura
    const parseSafe = value => {
      if (value === null || value === undefined || value === '') {
        return 0;
      }
      const parsed = typeof value === 'number' ? value : parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    const montoTotal = parseSafe(factura.monto);
    const montoPagado = parseSafe(factura.montoPagado);
    const montoPendiente =
      factura.montoPendiente !== undefined
        ? parseSafe(factura.montoPendiente)
        : montoTotal - montoPagado;
    const estado = formatearEstadoFacturaCXPExport(factura.estado);

    // Calcular días vencidos usando la función auxiliar
    const diasVencidos = calcularDiasVencidosExport(factura.fechaVencimiento, factura.estado);

    // Formatear días vencidos: positivo = días restantes, negativo = días vencidos
    let diasVencidosTexto = '-';
    if (diasVencidos !== null && diasVencidos !== undefined) {
      if (diasVencidos < 0) {
        diasVencidosTexto = `${Math.abs(diasVencidos)} días vencidos`;
      } else if (diasVencidos === 0) {
        diasVencidosTexto = 'Vence hoy';
      } else {
        diasVencidosTexto = `${diasVencidos} días restantes`;
      }
    }

    return {
      'Número de Factura': factura.numeroFactura || '',
      Proveedor: factura.proveedor || '',
      Estado: estado,
      'Monto Total': montoTotal.toFixed(2),
      'Monto Pagado': montoPagado.toFixed(2),
      'Monto Pendiente': montoPendiente.toFixed(2),
      'Fecha de Emisión': formatearFechaCXPExport(factura.fechaEmision),
      'Fecha de Vencimiento': formatearFechaCXPExport(factura.fechaVencimiento),
      'Días Vencidos': diasVencidosTexto,
      'Tipo de Moneda': factura.tipoMoneda || 'MXN',
      Prioridad: factura.prioridad || 'Normal'
    };
  });

  // Usar función base común con múltiples hojas
  await window.exportarDatosExcel({
    hojas: [
      { datos: rowsFacturas, nombreHoja: 'Registro de Facturas' },
      { datos: rowsEstadoCXP, nombreHoja: 'Estado CxP' }
    ],
    nombreArchivo: 'cuentas_por_pagar',
    mensajeVacio: 'No hay facturas para exportar.'
  });
};

// ===== FUNCIÓN PARA EXPORTAR SOLICITUDES A EXCEL =====
window.exportarSolicitudesCXPExcel = async function () {
  // Cargar solicitudes desde Firebase primero, luego localStorage
  let solicitudes = [];

  if (window.firebaseRepos && window.firebaseRepos.cxp) {
    try {
      const solicitudesFirebase = await window.firebaseRepos.cxp.loadSolicitudes();
      if (solicitudesFirebase && solicitudesFirebase.length > 0) {
        solicitudes = solicitudesFirebase;
        console.log('✅ Solicitudes cargadas desde Firebase:', solicitudes.length);
      }
    } catch (error) {
      console.warn('⚠️ Error cargando solicitudes desde Firebase:', error);
    }
  }

  // FIREBASE ES LA FUENTE DE VERDAD - localStorage solo como respaldo de emergencia
  // Si no hay solicitudes de Firebase después de intentar cargar, usar array global
  // (que ya debería tener datos de Firebase de loadCXPData)
  // localStorage solo se usa como último recurso si Firebase falló completamente
  if (solicitudes.length === 0) {
    console.log('⚠️ No se encontraron solicitudes en Firebase, usando datos en memoria');
  }

  // Si no hay solicitudes, usar las del array global
  if (solicitudes.length === 0) {
    solicitudes = solicitudesPago;
  }

  if (!solicitudes || solicitudes.length === 0) {
    alert('No hay solicitudes para exportar.');
    return;
  }

  // Cargar facturas para obtener información de facturas incluidas
  let facturas = [];
  if (window.firebaseRepos && window.firebaseRepos.cxp) {
    try {
      const facturasFirebase = await window.firebaseRepos.cxp.loadFacturas();
      if (facturasFirebase && facturasFirebase.length > 0) {
        facturas = facturasFirebase;
      }
    } catch (error) {
      console.warn('⚠️ Error cargando facturas desde Firebase:', error);
    }
  }

  if (facturas.length === 0) {
    try {
      const facturasStorage = localStorage.getItem('erp_cxp_facturas');
      if (facturasStorage) {
        facturas = JSON.parse(facturasStorage);
      }
    } catch (error) {
      console.error('❌ Error cargando facturas desde localStorage:', error);
    }
  }

  if (facturas.length === 0) {
    facturas = facturasCXP;
  }

  // Preparar datos para exportación
  const rows = solicitudes.map(solicitud => {
    // Obtener información de facturas incluidas
    let facturasIncluidasTexto = '';
    if (solicitud.facturasIncluidas && solicitud.facturasIncluidas.length > 0) {
      const facturasIncluidas = facturas.filter(f => solicitud.facturasIncluidas.includes(f.id));
      facturasIncluidasTexto = facturasIncluidas.map(f => f.numeroFactura || f.id).join(', ');
    }

    return {
      'ID Solicitud': `SOL-${solicitud.id.toString().padStart(4, '0')}`,
      'Fecha Solicitud': formatearFechaCXPExport(solicitud.fechaSolicitud),
      Proveedor: solicitud.proveedor || '',
      Estado: formatearEstadoSolicitudCXPExport(solicitud.estado),
      Prioridad: solicitud.prioridad || '',
      Monto: solicitud.monto ? parseFloat(solicitud.monto).toFixed(2) : '',
      'Facturas Incluidas': facturasIncluidasTexto,
      Justificación: solicitud.justificacion || ''
    };
  });

  const filename = `solicitudes_cuentas_por_pagar_${new Date().toISOString().split('T')[0]}.xlsx`;

  ensureXLSX(err => {
    if (err || !window.XLSX) {
      // Si no hay XLSX, exportar como CSV
      const csvContent = [
        Object.keys(rows[0]).join(','),
        ...rows.map(row =>
          Object.values(row)
            .map(val => {
              // Escapar comillas y valores que contengan comas
              const str = String(val || '');
              if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            })
            .join(',')
        )
      ].join('\n');

      const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename.replace('.xlsx', '.csv'));
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Solicitudes CXP');
      XLSX.writeFile(wb, filename);

      // Mostrar notificación
      if (typeof window.showNotification === 'function') {
        window.showNotification('Datos exportados correctamente a Excel', 'success');
      } else {
        alert('Datos exportados correctamente a Excel');
      }
    } catch (e) {
      console.error('Error exportando a Excel:', e);
      alert('Error al exportar a Excel. Intenta exportar como CSV.');
    }
  });
};

// Funciones auxiliares para generar PDFs de CXP
function formatearFechaCXP(fechaStr) {
  if (!fechaStr) {
    return 'N/A';
  }
  try {
    if (typeof fechaStr === 'string') {
      if (fechaStr.includes('T')) {
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }
      const fecha = new Date(`${fechaStr}T00:00:00`);
      return fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    return String(fechaStr);
  }
}

function obtenerValorCXP(valor) {
  return valor !== undefined && valor !== null && valor !== '' ? valor : 'N/A';
}

function formatearMontoCXP(monto) {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(parseFloat(monto || 0));
}

function formatearEstadoCXP(estado) {
  const estados = {
    pendiente: 'Pendiente',
    solicitud: 'En Solicitud',
    validada: 'Validada',
    aceptada: 'Aceptada',
    rechazada: 'Rechazada'
  };
  return estados[estado] || estado || 'N/A';
}

// ===== FUNCIÓN PARA DESCARGAR PDF DE SOLICITUD CXP =====
window.descargarPDFSolicitudCXP = async function (solicitudId) {
  console.log(`📄 Descargando PDF de la solicitud CXP: ${solicitudId}`);

  // Buscar la solicitud
  let solicitud = solicitudesPago.find(s => s.id === solicitudId);

  // Si no se encuentra localmente, intentar cargar desde Firebase
  if (!solicitud && window.firebaseRepos && window.firebaseRepos.cxp) {
    try {
      const solicitudesFirebase = await window.firebaseRepos.cxp.loadSolicitudes();
      if (solicitudesFirebase && solicitudesFirebase.length > 0) {
        solicitud = solicitudesFirebase.find(s => s.id === solicitudId);
      }
    } catch (error) {
      console.warn('⚠️ Error cargando solicitud desde Firebase:', error);
    }
  }

  // Si no se encuentra, intentar desde localStorage
  if (!solicitud) {
    try {
      const solicitudesStorage = localStorage.getItem('erp_cxp_solicitudes');
      if (solicitudesStorage) {
        const solicitudes = JSON.parse(solicitudesStorage);
        solicitud = solicitudes.find(s => s.id === solicitudId);
      }
    } catch (error) {
      console.error('❌ Error cargando solicitud desde localStorage:', error);
    }
  }

  if (!solicitud) {
    alert('Solicitud no encontrada');
    return;
  }

  try {
    // Cargar jsPDF si no está disponible
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Configuración
    const margin = 20;
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.width;
    const col1X = margin + 5;

    // Usar funciones auxiliares definidas arriba
    const formatearFecha = formatearFechaCXP;
    const obtenerValor = obtenerValorCXP;
    const formatearMonto = formatearMontoCXP;
    const formatearEstado = formatearEstadoCXP;

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SOLICITUD DE PAGO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // ID de la solicitud
    doc.setFontSize(12);
    doc.text(`ID: SOL-${solicitud.id.toString().padStart(4, '0')}`, margin, yPosition);
    yPosition += 10;

    // Información de la Solicitud
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DE LA SOLICITUD', margin, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Toda la información en la columna izquierda
    doc.text(`Proveedor: ${obtenerValor(solicitud.proveedor)}`, col1X, yPosition);
    yPosition += 6;
    doc.text(`Fecha de Solicitud: ${formatearFecha(solicitud.fechaSolicitud)}`, col1X, yPosition);
    yPosition += 6;
    doc.text(`Fecha Requerida: ${formatearFecha(solicitud.fechaRequerida)}`, col1X, yPosition);
    yPosition += 6;
    doc.text(`Estado: ${formatearEstado(solicitud.estado)}`, col1X, yPosition);
    yPosition += 6;
    doc.text(`Prioridad: ${obtenerValor(solicitud.prioridad)}`, col1X, yPosition);
    yPosition += 6;
    doc.text(`Método de Pago: ${obtenerValor(solicitud.metodoPago)}`, col1X, yPosition);
    yPosition += 6;
    doc.text(`Monto: $${formatearMonto(solicitud.monto)}`, col1X, yPosition);
    yPosition += 6;
    if (solicitud.montoTotal) {
      doc.text(`Monto Total: $${formatearMonto(solicitud.montoTotal)}`, col1X, yPosition);
      yPosition += 6;
    }
    yPosition += 5;

    // Justificación
    if (solicitud.justificacion) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('JUSTIFICACIÓN', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const splitJustificacion = doc.splitTextToSize(
        solicitud.justificacion,
        pageWidth - 2 * margin
      );
      doc.text(splitJustificacion, margin, yPosition);
      yPosition += splitJustificacion.length * 5 + 5;
    }

    // Facturas Incluidas
    if (solicitud.facturasIncluidas && solicitud.facturasIncluidas.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('FACTURAS INCLUIDAS', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Obtener información de las facturas
      const facturasIncluidas = facturasCXP.filter(f => solicitud.facturasIncluidas.includes(f.id));
      facturasIncluidas.forEach((factura, _index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(
          `${_index + 1}. ${factura.numeroFactura || factura.id} - $${formatearMonto(factura.monto)}`,
          col1X,
          yPosition
        );
        yPosition += 6;
      });
    }

    // Guardar PDF
    const nombreArchivo = `Solicitud_SOL-${solicitud.id.toString().padStart(4, '0')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);

    console.log(`✅ PDF generado exitosamente: ${nombreArchivo}`);
    if (typeof window.showNotification === 'function') {
      window.showNotification('PDF generado exitosamente', 'success');
    }
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    alert('Error al generar el PDF');
  }
};

// ===== FUNCIÓN PARA ELIMINAR FACTURA CXP =====
window.eliminarFacturaCXP = async function (facturaId) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta factura?')) {
    return;
  }

  try {
    // Eliminar de la lista local
    facturasCXP = facturasCXP.filter(f => f.id !== facturaId);
    facturasFiltradas = facturasFiltradas.filter(f => f.id !== facturaId);

    // Guardar en localStorage
    localStorage.setItem('erp_cxp_facturas', JSON.stringify(facturasCXP));
    console.log('💾 Factura eliminada de localStorage');

    // Eliminar de Firebase si existe
    if (window.firebaseRepos && window.firebaseRepos.cxp) {
      try {
        const facturaIdFirebase = `factura_${facturaId}`;
        await window.firebaseRepos.cxp.delete(facturaIdFirebase);
        console.log(`✅ Factura eliminada de Firebase: ${facturaIdFirebase}`);
      } catch (error) {
        console.warn('⚠️ Error eliminando factura de Firebase:', error);
      }
    }

    // Actualizar vista
    loadFacturasCXP();
    updateCXPMetrics();

    // Mostrar notificación
    if (typeof window.showNotification === 'function') {
      window.showNotification('Factura eliminada exitosamente', 'success');
    } else {
      alert('✅ Factura eliminada exitosamente');
    }
  } catch (error) {
    console.error('❌ Error eliminando factura:', error);
    alert('Error al eliminar la factura');
  }
};

// ===== FUNCIÓN PARA DESCARGAR PDF DE FACTURA CXP =====
window.descargarPDFFacturaCXP = async function (facturaId) {
  console.log(`📄 Descargando PDF de la factura CXP: ${facturaId}`);

  const factura = facturasCXP.find(f => f.id === facturaId);
  if (!factura) {
    alert('Factura no encontrada');
    return;
  }

  try {
    // Cargar jsPDF si no está disponible
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Configuración
    const margin = 20;
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.width;
    const col1X = margin + 5;
    const _col2X = pageWidth / 2 + 10;

    // Usar funciones auxiliares definidas arriba
    const formatearFecha = formatearFechaCXP;
    const obtenerValor = obtenerValorCXP;
    const formatearMonto = formatearMontoCXP;

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA DE PROVEEDOR', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Información de la Factura
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DE LA FACTURA', margin, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Toda la información en la columna izquierda
    doc.text(`Número de Factura: ${obtenerValor(factura.numeroFactura)}`, col1X, yPosition);
    yPosition += 6;
    const folioFiscalFormateado = factura.folioFiscal ? formatearUUID(factura.folioFiscal) : '';
    doc.text(`Folio Fiscal (UUID): ${obtenerValor(folioFiscalFormateado)}`, col1X, yPosition);
    yPosition += 6;
    doc.text(`Fecha de Emisión: ${formatearFecha(factura.fechaEmision)}`, col1X, yPosition);
    yPosition += 6;
    doc.text(`Fecha de Vencimiento: ${formatearFecha(factura.fechaVencimiento)}`, col1X, yPosition);
    yPosition += 6;
    doc.text(`Proveedor: ${obtenerValor(factura.proveedor)}`, col1X, yPosition);
    yPosition += 6;
    doc.text(`Categoría: ${obtenerValor(factura.categoria)}`, col1X, yPosition);
    yPosition += 6;
    doc.text(`Prioridad: ${obtenerValor(factura.prioridad)}`, col1X, yPosition);
    yPosition += 6;
    doc.text(`Tipo de Moneda: ${obtenerValor(factura.tipoMoneda || 'MXN')}`, col1X, yPosition);
    yPosition += 6;
    if (factura.tipoCambio) {
      doc.text(
        `Tipo de Cambio: $${parseFloat(factura.tipoCambio).toFixed(4)} MXN/USD`,
        col1X,
        yPosition
      );
      yPosition += 6;
    }
    doc.text(`Estado: ${obtenerValor(factura.estado)}`, col1X, yPosition);
    yPosition += 10;

    // Desglose de Montos
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DESGLOSE DE MONTOS', margin, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Toda la información en la columna izquierda
    if (factura.subtotal !== undefined) {
      doc.text(`Subtotal: $${formatearMonto(factura.subtotal)}`, col1X, yPosition);
      yPosition += 6;
    }
    if (factura.iva !== undefined) {
      doc.text(`IVA: $${formatearMonto(factura.iva)}`, col1X, yPosition);
      yPosition += 6;
    }
    if (factura.ivaRetenido !== undefined && factura.ivaRetenido > 0) {
      doc.text(`IVA Retenido: $${formatearMonto(factura.ivaRetenido)}`, col1X, yPosition);
      yPosition += 6;
    }
    if (factura.isrRetenido !== undefined && factura.isrRetenido > 0) {
      doc.text(`ISR Retenido: $${formatearMonto(factura.isrRetenido)}`, col1X, yPosition);
      yPosition += 6;
    }
    if (factura.otrosMontos !== undefined && factura.otrosMontos !== 0) {
      doc.text(`Otros Montos: $${formatearMonto(factura.otrosMontos)}`, col1X, yPosition);
      yPosition += 6;
    }

    const montoTotal = factura.monto || 0;
    const montoPagado = factura.montoPagado || 0;
    const montoPendiente =
      factura.montoPendiente !== undefined ? factura.montoPendiente : montoTotal - montoPagado;

    doc.text(`Monto Total: $${formatearMonto(montoTotal)}`, col1X, yPosition);
    yPosition += 6;
    doc.text(`Monto Pagado: $${formatearMonto(montoPagado)}`, col1X, yPosition);
    yPosition += 6;
    doc.text(`Monto Pendiente: $${formatearMonto(montoPendiente)}`, col1X, yPosition);
    yPosition += 10;

    // Descripción
    if (factura.descripcion) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('DESCRIPCIÓN', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const splitDescripcion = doc.splitTextToSize(factura.descripcion, pageWidth - 2 * margin);
      doc.text(splitDescripcion, margin, yPosition);
      yPosition += splitDescripcion.length * 5 + 5;
    }

    // Historial de Solicitudes Pagadas
    try {
      // 1. Buscar todas las solicitudes que incluyen esta factura
      const solicitudesRelacionadas = solicitudesPago.filter(
        s => Array.isArray(s.facturasIncluidas) && s.facturasIncluidas.includes(factura.id)
      );

      if (solicitudesRelacionadas.length > 0) {
        // 2. Cargar órdenes de pago desde Tesorería
        let ordenesPago = [];
        try {
          // FIREBASE ES LA FUENTE DE VERDAD - Intentar cargar desde repositorio primero
          if (window.firebaseRepos?.tesoreria) {
            try {
              ordenesPago = (await window.firebaseRepos.tesoreria.getAllOrdenesPago()) || [];
              if (ordenesPago.length > 0) {
                console.log(`✅ ${ordenesPago.length} órdenes de pago cargadas desde Firebase`);
              }
            } catch (error) {
              console.warn(
                '⚠️ Error cargando órdenes desde Firebase, usando localStorage como respaldo:',
                error
              );
            }
          }

          // Fallback a localStorage solo si Firebase no está disponible o falló
          if (ordenesPago.length === 0) {
            const ordenesData = localStorage.getItem('erp_teso_ordenes_pago');
            if (ordenesData) {
              ordenesPago = JSON.parse(ordenesData);
              console.log(
                `⚠️ ${ordenesPago.length} órdenes cargadas desde localStorage (respaldo de emergencia)`
              );
            }
          }
        } catch (e) {
          console.warn('⚠️ Error cargando órdenes de pago para PDF:', e);
        }

        // 3. Buscar órdenes pagadas relacionadas con las solicitudes
        const ordenesPagadas = [];
        solicitudesRelacionadas.forEach(solicitud => {
          const ordenesDeSolicitud = ordenesPago.filter(
            orden =>
              orden.solicitudId === solicitud.id &&
              (orden.estado === 'pagado' || orden.estado === 'pagada')
          );
          ordenesDeSolicitud.forEach(orden => {
            ordenesPagadas.push({
              orden: orden,
              solicitud: solicitud
            });
          });
        });

        // 4. Ordenar por fecha de pago (más reciente primero)
        ordenesPagadas.sort((a, b) => {
          const fechaA = a.orden.fechaPago || a.orden.createdAt || 0;
          const fechaB = b.orden.fechaPago || b.orden.createdAt || 0;
          return new Date(fechaB) - new Date(fechaA);
        });

        // 5. Agregar sección al PDF si hay órdenes pagadas
        if (ordenesPagadas.length > 0) {
          // Verificar si necesitamos una nueva página
          if (yPosition > 200) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.text('HISTORIAL DE SOLICITUDES PAGADAS', margin, yPosition);
          yPosition += 10;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);

          // Encabezados de tabla
          const headerY = yPosition;
          doc.setFont('helvetica', 'bold');
          doc.text('#', margin + 5, headerY);
          doc.text('N° Orden', margin + 15, headerY);
          doc.text('Fecha Solicitud', margin + 50, headerY);
          doc.text('Fecha Pago', margin + 95, headerY);
          doc.text('Monto', margin + 135, headerY);
          doc.text('Método', margin + 165, headerY);
          yPosition += 8;

          // Línea separadora
          doc.setLineWidth(0.5);
          doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
          yPosition += 3;

          // Filas de datos
          doc.setFont('helvetica', 'normal');
          ordenesPagadas.forEach((item, _index) => {
            // Verificar si necesitamos una nueva página
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }

            const { orden } = item;
            const { solicitud } = item;
            const fechaSolicitud = formatearFecha(solicitud.fechaSolicitud || solicitud.createdAt);
            const fechaPago = formatearFecha(orden.fechaPago || orden.createdAt);
            const numeroOrden = orden.id ? `OP-${String(orden.id).slice(-6)}` : 'N/A';
            const monto = formatearMonto(orden.monto || 0);
            const metodoPago = orden.metodoPago || 'N/A';

            doc.text(String(_index + 1), margin + 5, yPosition);
            doc.text(numeroOrden, margin + 15, yPosition);
            doc.text(fechaSolicitud, margin + 50, yPosition);
            doc.text(fechaPago, margin + 95, yPosition);
            doc.text(`$${monto}`, margin + 135, yPosition);
            doc.text(metodoPago, margin + 165, yPosition);
            yPosition += 7;
          });

          yPosition += 5;
        }
      }
    } catch (error) {
      console.error('❌ Error agregando historial de solicitudes pagadas al PDF:', error);
      // Continuar con el PDF aunque haya error en el historial
    }

    // Guardar PDF
    const numeroFactura = factura.numeroFactura || factura.id;
    const nombreArchivo = `Factura_${numeroFactura.toString().replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);

    console.log(`✅ PDF generado exitosamente: ${nombreArchivo}`);
    if (typeof window.showNotification === 'function') {
      window.showNotification('PDF generado exitosamente', 'success');
    }
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    alert('Error al generar el PDF');
  }
};

// FUNCIÓN ELIMINADA: clearCXPTestData
// Esta función limpiaba datos de prueba. Ya no es necesaria.
// Para limpiar datos, usar el botón "Limpiar Todos los Datos Operativos" en Configuración.

// Función de debug para verificar facturas CXP
window.debugFacturasCXP = function () {
  console.log('🔍 DEBUG: Verificando facturas CXP...');
  console.log('📋 Total facturas:', facturasCXP.length);

  facturasCXP.forEach((factura, _index) => {
    console.log(`📄 Factura ${_index + 1}:`, {
      numero: factura.numeroFactura,
      monto: factura.monto,
      montoPagado: factura.montoPagado,
      montoPendiente: factura.montoPendiente,
      estado: factura.estado
    });
  });

  // Verificar factura A13213 específicamente
  const facturaA13213 = facturasCXP.find(f => f.numeroFactura === 'A13213');
  if (facturaA13213) {
    console.log('🎯 Factura A13213 encontrada:', facturaA13213);
  } else {
    console.log('❌ Factura A13213 no encontrada');
  }
};

// Función para corregir montos de facturas basándose en solicitudes aprobadas
window.corregirMontosFacturasCXP = function () {
  console.log('🔧 Corrigiendo montos de facturas CXP...');

  // Resetear todos los montos a valores iniciales
  facturasCXP = facturasCXP.map(factura => ({
    ...factura,
    montoPagado: 0,
    montoPendiente: factura.monto,
    estado: 'pendiente'
  }));

  // Recalcular montos basándose en solicitudes aprobadas
  const solicitudesAprobadas = solicitudesPago.filter(s => s.estado === 'en tesoreria');

  solicitudesAprobadas.forEach(solicitud => {
    facturasCXP = facturasCXP.map(factura => {
      if (!solicitud.facturasIncluidas.includes(factura.id)) {
        return factura;
      }

      const montoPagadoActual = factura.montoPagado || 0;
      const montoPendienteActual = factura.montoPendiente || factura.monto;

      const nuevoMontoPagado = montoPagadoActual + solicitud.monto;
      const nuevoMontoPendiente = montoPendienteActual - solicitud.monto;

      return {
        ...factura,
        montoPagado: nuevoMontoPagado,
        montoPendiente: nuevoMontoPendiente,
        estado: nuevoMontoPendiente <= 0 ? 'pagada' : 'en tesoreria'
      };
    });
  });

  saveCXPData();
  loadFacturasCXP();
  updateCXPMetrics();

  console.log('✅ Montos de facturas corregidos');
  alert('✅ Montos de facturas corregidos correctamente');
};

// Función para actualizar métricas CXP
window.actualizarMetricasCXP = function () {
  console.log('🔄 Actualizando métricas CXP...');
  updateCXPMetrics();
  console.log('✅ Métricas CXP actualizadas');
};

// Función para eliminar un registro problemático por ID (de Firebase y localStorage)
window.eliminarRegistroProblemaCXP = async function (idProblema) {
  // Asegurar que idProblema sea string desde el inicio
  const idProblemaStr = String(idProblema || '').trim();

  if (!idProblemaStr) {
    alert('❌ ID inválido');
    return;
  }

  // Agregar a la lista de IDs problemáticos
  agregarIdProblematicoCXP(idProblemaStr);

  console.log(`🗑️ Eliminando registro problemático: ${idProblemaStr}`);

  try {
    // 1. Eliminar de localStorage
    const facturasData = localStorage.getItem('erp_cxp_facturas');
    let eliminadosLocalStorage = 0;

    if (facturasData) {
      let facturas = JSON.parse(facturasData);
      const _cantidadAntes = facturas.length;

      // Filtrar el registro problemático (puede estar con o sin prefijo "factura_")
      facturas = facturas.filter(f => {
        // Verificar si el ID coincide (con o sin prefijo)
        const facturaId = String(f.id || '').trim();

        const coincide =
          facturaId === idProblemaStr ||
          facturaId === `factura_${idProblemaStr}` ||
          (facturaId.length > 0 && facturaId.includes(idProblemaStr));

        if (coincide) {
          eliminadosLocalStorage++;
          console.log(`  - Eliminando de localStorage: ID=${facturaId}`);
        }

        return !coincide;
      });

      if (eliminadosLocalStorage > 0) {
        localStorage.setItem('erp_cxp_facturas', JSON.stringify(facturas));
        console.log(`✅ ${eliminadosLocalStorage} registro(s) eliminado(s) de localStorage`);
      } else {
        console.log('⚠️ No se encontró el registro en localStorage');
      }
    }

    // 2. Eliminar de Firebase (buscar TODOS los documentos y eliminar los que coincidan)
    let eliminadosFirebase = 0;

    if (window.firebaseRepos && window.firebaseRepos.cxp) {
      try {
        // Asegurar que idProblema sea string
        const idProblemaStr = String(idProblema);

        // Obtener TODOS los documentos de Firebase (no solo facturas)
        const todosLosDocumentos = await window.firebaseRepos.cxp.getAll();
        console.log(`📊 Total documentos en Firebase: ${todosLosDocumentos.length}`);

        // Buscar documentos que coincidan con el ID problemático
        const documentosAEliminar = [];

        todosLosDocumentos.forEach(doc => {
          // Obtener el ID del documento (puede venir de diferentes lugares)
          const docIdRaw = doc.id || doc._id || '';
          const docId = String(docIdRaw);

          // Verificar si coincide con el ID problemático (con o sin prefijo)
          const coincideDirecto = docId === idProblemaStr;
          const coincideConPrefijo = docId === `factura_${idProblemaStr}`;
          const idInterno = String(doc.id || '');
          const coincideIdInterno =
            idInterno === idProblemaStr || idInterno === `factura_${idProblemaStr}`;

          if (coincideDirecto || coincideConPrefijo || coincideIdInterno) {
            // Usar el ID tal como está en Firebase (puede tener prefijo o no)
            documentosAEliminar.push(docId);
            console.log(
              `  - Documento encontrado para eliminar: ${docId} (tipo: ${doc.tipo || 'sin tipo'})`
            );
          }
        });

        // Eliminar cada documento encontrado
        for (const docId of documentosAEliminar) {
          try {
            // Asegurar que docId sea string
            const docIdStr = String(docId);
            if (repoCXP && repoCXP.db && repoCXP.tenantId) {
              await repoCXP.delete(docIdStr);
              eliminadosFirebase++;
              console.log(`✅ Documento eliminado de Firebase: ${docIdStr}`);
            }
          } catch (error) {
            console.warn(
              `⚠️ Error eliminando documento ${docId} de Firebase:`,
              error.message || error
            );
          }
        }

        // También intentar eliminar directamente con y sin prefijo si no se encontró
        if (eliminadosFirebase === 0) {
          const idConPrefijo = `factura_${idProblemaStr}`;
          try {
            if (repoCXP && repoCXP.db && repoCXP.tenantId) {
              await repoCXP.delete(idConPrefijo);
              eliminadosFirebase++;
              console.log(
                `✅ Registro eliminado de Firebase (intento directo con prefijo): ${idConPrefijo}`
              );
            }
          } catch (error1) {
            console.log(
              `⚠️ No se encontró en Firebase con prefijo: ${idConPrefijo} - ${error1.message || error1}`
            );
          }

          try {
            if (repoCXP && repoCXP.db && repoCXP.tenantId) {
              await repoCXP.delete(idProblemaStr);
              eliminadosFirebase++;
              console.log(
                `✅ Registro eliminado de Firebase (intento directo sin prefijo): ${idProblemaStr}`
              );
            }
          } catch (error2) {
            console.log(
              `⚠️ No se encontró en Firebase sin prefijo: ${idProblemaStr} - ${error2.message || error2}`
            );
          }
        }
      } catch (error) {
        console.error('❌ Error buscando/eliminando de Firebase:', error);
      }
    }

    // 3. Recargar los datos
    await loadCXPData();
    if (typeof loadFacturasCXP === 'function') {
      loadFacturasCXP();
    }
    if (typeof updateCXPMetrics === 'function') {
      updateCXPMetrics();
    }

    const mensaje =
      `✅ Registro ${idProblemaStr} procesado:\n` +
      `- Eliminados de localStorage: ${eliminadosLocalStorage}\n` +
      `- Eliminados de Firebase: ${eliminadosFirebase}\n\n` +
      'Recargue la página para ver los cambios.';

    console.log(mensaje);
    alert(mensaje);

    // Recargar página después de 2 segundos
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (error) {
    console.error('❌ Error eliminando registro problemático:', error);
    alert(`Error al eliminar el registro: ${error.message || error}`);
  }
};

// ===== FUNCIONES PARA ESTADO DE CUENTA DE PROVEEDORES =====

// Abrir modal de estado de cuenta
window.generarEstadoCuentaProveedor = function () {
  // Cargar lista de proveedores
  cargarProveedoresEstadoCuenta();

  // Establecer fechas por defecto: inicio del mes actual hasta hoy
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1); // Primer día del mes actual

  // Formatear fechas en formato YYYY-MM-DD
  const fechaDesdeStr = inicioMes.toISOString().split('T')[0];
  const fechaHastaStr = hoy.toISOString().split('T')[0];

  document.getElementById('fechaDesdeEstadoProveedor').value = fechaDesdeStr;
  document.getElementById('fechaHastaEstadoProveedor').value = fechaHastaStr;

  console.log(`📅 Fechas establecidas: Desde ${fechaDesdeStr} hasta ${fechaHastaStr}`);

  // Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById('modalEstadoCuentaProveedor'));
  modal.show();
};

// Cargar proveedores en el select
function cargarProveedoresEstadoCuenta() {
  const select = document.getElementById('proveedorEstadoCuenta');
  select.innerHTML = '<option value="">Seleccionar proveedor...</option>';

  try {
    // Obtener proveedores únicos de las facturas
    const proveedoresUnicos = [...new Set(facturasCXP.map(f => f.proveedor))];

    proveedoresUnicos.forEach(proveedor => {
      const option = document.createElement('option');
      option.value = proveedor;
      option.textContent = proveedor;
      select.appendChild(option);
    });

    console.log(`✅ ${proveedoresUnicos.length} proveedores cargados para estado de cuenta`);
  } catch (error) {
    console.error('❌ Error cargando proveedores:', error);
  }
}

// Vista previa del estado de cuenta
window.previewEstadoCuentaProveedor = function () {
  const proveedor = document.getElementById('proveedorEstadoCuenta').value;
  const fechaDesde = document.getElementById('fechaDesdeEstadoProveedor').value;
  const fechaHasta = document.getElementById('fechaHastaEstadoProveedor').value;
  const soloVencidas = document.getElementById('soloVencidasProveedor').checked;

  if (!proveedor) {
    alert('Por favor selecciona un proveedor');
    return;
  }

  // Filtrar facturas del proveedor
  let facturasProveedor = facturasCXP.filter(f => f.proveedor === proveedor);

  // Filtrar por fechas si se especifican
  if (fechaDesde) {
    facturasProveedor = facturasProveedor.filter(f => f.fechaEmision >= fechaDesde);
  }
  if (fechaHasta) {
    facturasProveedor = facturasProveedor.filter(f => f.fechaEmision <= fechaHasta);
  }

  // Filtrar solo vencidas y pendientes si está marcado
  if (soloVencidas) {
    facturasProveedor = facturasProveedor.filter(f => {
      const estado = f.estado || '';
      return estado !== 'pagada' && estado !== 'pagado';
    });
  }

  // Calcular totales usando montos reales de pagos parciales
  const _totalGeneral = facturasProveedor.reduce((sum, f) => sum + (f.monto || 0), 0);
  const _totalPagado = facturasProveedor.reduce((sum, f) => sum + (f.montoPagado || 0), 0);
  const totalPendiente = facturasProveedor.reduce((sum, f) => sum + (f.montoPendiente || 0), 0);

  // Obtener el contenedor de vista previa
  const previewElement = document.getElementById('previewEstadoCuentaProveedor');
  if (!previewElement) {
    console.warn('⚠️ Elemento previewEstadoCuentaProveedor no encontrado');
    return;
  }

  // Mostrar vista previa
  const previewProveedor = document.getElementById('previewProveedor');
  const previewPeriodo = document.getElementById('previewPeriodoProveedor');
  const previewCantidad = document.getElementById('previewCantidadProveedor');
  const previewTotal = document.getElementById('previewTotalProveedor');

  if (previewProveedor) {
    previewProveedor.textContent = proveedor;
  }
  if (previewPeriodo) {
    previewPeriodo.textContent = `${fechaDesde || 'Inicio'} - ${fechaHasta || 'Hoy'}`;
  }
  if (previewCantidad) {
    previewCantidad.textContent = facturasProveedor.length;
  }
  if (previewTotal) {
    previewTotal.textContent = formatCurrency(totalPendiente);
  }

  // Mostrar el contenedor de vista previa
  previewElement.style.display = 'block';
};

// Generar PDF del estado de cuenta
window.generarPDFEstadoCuentaProveedor = async function () {
  const proveedor = document.getElementById('proveedorEstadoCuenta').value;
  const fechaDesde = document.getElementById('fechaDesdeEstadoProveedor').value;
  const fechaHasta = document.getElementById('fechaHastaEstadoProveedor').value;
  const soloVencidas = document.getElementById('soloVencidasProveedor').checked;

  if (!proveedor) {
    alert('Por favor selecciona un proveedor');
    return;
  }

  // Filtrar facturas del proveedor
  let facturasProveedor = facturasCXP.filter(f => f.proveedor === proveedor);

  // Filtrar por fechas si se especifican
  if (fechaDesde) {
    facturasProveedor = facturasProveedor.filter(f => f.fechaEmision >= fechaDesde);
  }
  if (fechaHasta) {
    facturasProveedor = facturasProveedor.filter(f => f.fechaEmision <= fechaHasta);
  }

  // Filtrar solo vencidas y pendientes si está marcado
  if (soloVencidas) {
    facturasProveedor = facturasProveedor.filter(f => {
      const estado = f.estado || '';
      return estado !== 'pagada' && estado !== 'pagado';
    });
  }

  // Calcular totales
  const facturasPendientes = facturasProveedor.filter(f => {
    const estado = f.estado || '';
    return estado !== 'pagada' && estado !== 'pagado';
  });
  const facturasVencidas = facturasProveedor.filter(f => {
    const estado = f.estado || '';
    return (
      estado !== 'pagada' &&
      estado !== 'pagado' &&
      calcularDiasVencidos(f.fechaVencimiento, f.estado) < 0
    );
  });
  const facturasPagadas = facturasProveedor.filter(f => {
    const estado = f.estado || '';
    return estado === 'pagada' || estado === 'pagado';
  });

  // Calcular montos
  const totalPendiente = facturasProveedor.reduce((sum, f) => {
    const montoPendiente =
      f.montoPendiente !== undefined ? f.montoPendiente : (f.monto || 0) - (f.montoPagado || 0);
    return sum + (montoPendiente > 0 ? montoPendiente : 0);
  }, 0);

  const totalPagado = facturasProveedor.reduce((sum, f) => sum + (f.montoPagado || 0), 0);

  const totalGeneral = facturasProveedor.reduce((sum, f) => sum + (f.monto || 0), 0);

  const totalVencido = facturasVencidas.reduce((sum, f) => {
    const montoPendiente =
      f.montoPendiente !== undefined ? f.montoPendiente : (f.monto || 0) - (f.montoPagado || 0);
    return sum + (montoPendiente > 0 ? montoPendiente : 0);
  }, 0);

  // Cargar jsPDF si no está disponible
  if (!window.jspdf) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Crear PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Configuración de fuentes y colores
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPosition = 20;

  // Encabezado
  addTextPDF(doc, 'ESTADO DE CUENTA', pageWidth / 2, yPosition, { fontSize: 18, color: [0, 0, 139] });
  yPosition += 15;

  addTextPDF(doc, `Proveedor: ${proveedor}`, margin, yPosition, { fontSize: 14 });
  yPosition += 10;

  addTextPDF(doc, `Período: ${fechaDesde || 'Inicio'} - ${fechaHasta || 'Hoy'}`, margin, yPosition);
  yPosition += 10;

  addTextPDF(doc, `Fecha de emisión: ${new Date().toLocaleDateString('es-MX')}`, margin, yPosition);
  yPosition += 20;

  // Resumen
  addTextPDF(doc, 'RESUMEN', margin, yPosition, { fontSize: 14, color: [0, 0, 139] });
  yPosition += 10;

  addTextPDF(doc, `Total de facturas: ${facturasProveedor.length}`, margin, yPosition);
  yPosition += 8;

  addTextPDF(doc, `Monto total facturado: $${formatCurrency(totalGeneral)}`, margin, yPosition, {
    fontSize: 12,
    color: [0, 0, 139]
  });
  yPosition += 8;

  addTextPDF(doc, `Monto total pagado: $${formatCurrency(totalPagado)}`, margin, yPosition, {
    color: [0, 128, 0]
  });
  yPosition += 8;

  addTextPDF(doc, `Monto total pendiente: $${formatCurrency(totalPendiente)}`, margin, yPosition, {
    color: [220, 20, 60]
  });
  yPosition += 8;

  addTextPDF(doc, `Facturas pendientes: ${facturasPendientes.length}`, margin, yPosition);
  yPosition += 8;

  addTextPDF(
    doc,
    `Facturas vencidas: ${facturasVencidas.length} - $${formatCurrency(totalVencido)}`,
    margin,
    yPosition,
    { color: [220, 20, 60] }
  );
  yPosition += 8;

  addTextPDF(doc, `Facturas pagadas: ${facturasPagadas.length}`, margin, yPosition, { color: [0, 128, 0] });
  yPosition += 8;

  // Calcular porcentaje de pago
  const porcentajePago = totalGeneral > 0 ? Math.round((totalPagado / totalGeneral) * 100) : 0;
  addTextPDF(doc, `Porcentaje de pago: ${porcentajePago}%`, margin, yPosition, {
    fontSize: 12,
    color: [0, 0, 139]
  });
  yPosition += 20;

  // Tabla de facturas
  addTextPDF(doc, 'DETALLE DE FACTURAS', margin, yPosition, { fontSize: 14, color: [0, 0, 139] });
  yPosition += 10;

  // Encabezados de tabla (sin columna de Estado)
  const colPositions = [
    margin,
    margin + 30,
    margin + 55,
    margin + 75,
    margin + 95,
    margin + 115,
    margin + 135
  ];

  addTextPDF(doc, 'Número', colPositions[0], yPosition, { fontSize: 9 });
  addTextPDF(doc, 'Fecha Emisión', colPositions[1], yPosition, { fontSize: 9 });
  addTextPDF(doc, 'Fecha Venc.', colPositions[2], yPosition, { fontSize: 9 });
  addTextPDF(doc, 'Días Venc.', colPositions[3], yPosition, { fontSize: 9 });
  addTextPDF(doc, 'Monto Total', colPositions[4], yPosition, { fontSize: 9 });
  addTextPDF(doc, 'Monto Pagado', colPositions[5], yPosition, { fontSize: 9 });
  addTextPDF(doc, 'Monto Pend.', colPositions[6], yPosition, { fontSize: 9 });

  yPosition += 5;
  addLinePDF(doc, margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Filas de facturas
  facturasProveedor.forEach(factura => {
    // Verificar si necesitamos nueva página
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    const numeroFactura = factura.numeroFactura || '-';
    const fechaEmision = formatDate(factura.fechaEmision);
    const fechaVenc = formatDate(factura.fechaVencimiento);
    const diasVenc = calcularDiasVencidos(factura.fechaVencimiento, factura.estado);
    const diasVencStr = diasVenc !== null && diasVenc !== undefined ? diasVenc.toString() : '-';

    // Calcular montos
    const montoTotal = factura.monto || 0;
    const montoPagado = factura.montoPagado || 0;
    const montoPendiente =
      factura.montoPendiente !== undefined ? factura.montoPendiente : montoTotal - montoPagado;

    const montoTotalStr = `$${formatCurrency(montoTotal)}`;
    const montoPagadoStr = `$${formatCurrency(montoPagado)}`;
    const montoPendienteStr = `$${formatCurrency(montoPendiente)}`;

    addTextPDF(doc, numeroFactura, colPositions[0], yPosition, { fontSize: 8 });
    addTextPDF(doc, fechaEmision, colPositions[1], yPosition, { fontSize: 8 });
    addTextPDF(doc, fechaVenc, colPositions[2], yPosition, { fontSize: 8 });
    addTextPDF(doc, diasVencStr, colPositions[3], yPosition, {
      fontSize: 8,
      color: diasVenc !== null && diasVenc < 0 ? [220, 20, 60] : [0, 0, 0]
    });
    addTextPDF(doc, montoTotalStr, colPositions[4], yPosition, { fontSize: 8 });
    addTextPDF(doc, montoPagadoStr, colPositions[5], yPosition, { fontSize: 8, color: [0, 128, 0] });
    addTextPDF(doc, montoPendienteStr, colPositions[6], yPosition, {
      fontSize: 8,
      color: montoPendiente > 0 ? [220, 20, 60] : [0, 128, 0]
    });

    yPosition += 8;
  });

  // Pie de página
  yPosition += 20;
  addLinePDF(doc, margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  addTextPDF(
    doc,
    'Este estado de cuenta es generado automáticamente por el sistema ERP.',
    margin,
    yPosition,
    { fontSize: 8, color: [128, 128, 128] }
  );
  yPosition += 5;
  addTextPDF(doc, 'Para aclaraciones, contactar al departamento de cuentas por pagar.', margin, yPosition, {
    fontSize: 8,
    color: [128, 128, 128]
  });

  // Guardar PDF
  const fileName = `Estado_Cuenta_${proveedor.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  // Cerrar modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('modalEstadoCuentaProveedor'));
  if (modal) {
    modal.hide();
  }

  // Mostrar confirmación
  if (typeof showNotification === 'function') {
    showNotification(`✅ Estado de cuenta generado exitosamente: ${fileName}`, 'success');
  } else {
    alert(`✅ Estado de cuenta generado exitosamente: ${fileName}`);
  }
};
