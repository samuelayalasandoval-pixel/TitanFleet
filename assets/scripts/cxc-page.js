/**
 * Script específico para la página de Cuentas por Cobrar (CXC.html)
 * Incluye funciones para manejo de bancos, cuentas y estado del sidebar
 */

// Script crítico: Restaurar estado del sidebar ANTES de renderizar para evitar parpadeo
(function () {
  'use strict';
  // Leer estado del sidebar inmediatamente
  try {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
      // Aplicar estilo inline directamente al body para que se ejecute antes del render
      document.documentElement.style.setProperty('--sidebar-initial-state', 'collapsed');

      // Función para aplicar clases inmediatamente cuando el DOM esté disponible
      function applySidebarState() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        if (sidebar && mainContent) {
          sidebar.classList.add('collapsed');
          mainContent.classList.add('sidebar-collapsed');
          return true;
        }
        return false;
      }

      // Intentar aplicar inmediatamente si el DOM ya está disponible
      if (document.body) {
        applySidebarState();
      } else {
        // Si el body aún no existe, usar MutationObserver para detectar cuando se crea
        const observer = new MutationObserver(_mutations => {
          if (document.getElementById('sidebar') && document.getElementById('mainContent')) {
            applySidebarState();
            observer.disconnect();
          }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });

        // También intentar en DOMContentLoaded como fallback
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            setTimeout(applySidebarState, 0);
          });
        }
      }
    }
  } catch (e) {
    // Silenciar errores si localStorage no está disponible
  }
})();

// Verificar que Font Awesome se haya cargado correctamente
document.addEventListener('DOMContentLoaded', () => {
  // Esperar un poco para que Font Awesome se cargue
  setTimeout(() => {
    const testIcon = document.createElement('i');
    testIcon.className = 'fas fa-check';
    testIcon.style.position = 'absolute';
    testIcon.style.left = '-9999px';
    document.body.appendChild(testIcon);

    const computedStyle = window.getComputedStyle(testIcon, ':before');
    const fontFamily = computedStyle.getPropertyValue('font-family');

    if (fontFamily && fontFamily.includes('Font Awesome')) {
      console.log('✅ Font Awesome cargado correctamente');
    } else {
      console.error('❌ Font Awesome NO se cargó correctamente. Font family:', fontFamily);
      // Intentar recargar Font Awesome desde jsDelivr
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href =
        'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css';
      link.crossOrigin = 'anonymous';
      link.referrerPolicy = 'no-referrer';
      document.head.appendChild(link);
      console.log('🔄 Reintentando cargar Font Awesome desde jsDelivr...');
    }

    document.body.removeChild(testIcon);
  }, 1000);
});

// Función para cargar bancos desde la configuración
async function cargarBancosCXC() {
  let bancos = [];

  // Intentar cargar desde Firebase
  if (window.firebaseDb && window.fs) {
    try {
      const cuentasBancariasDocRef = window.fs.doc(
        window.firebaseDb,
        'configuracion',
        'cuentas_bancarias'
      );
      const cuentasBancariasDoc = await window.fs.getDoc(cuentasBancariasDocRef);

      if (cuentasBancariasDoc.exists()) {
        const data = cuentasBancariasDoc.data();
        if (data.cuentasBancarias && Array.isArray(data.cuentasBancarias)) {
          bancos = data.cuentasBancarias;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando bancos desde Firebase:', error);
    }
  }

  // Si no hay datos en Firebase, intentar desde localStorage
  if (bancos.length === 0 && window.configuracionManager) {
    bancos = window.configuracionManager.getCuentasBancarias() || [];
  }

  // Obtener lista única de bancos
  const bancosUnicos = [...new Set(bancos.map(b => b.banco).filter(b => b))];

  // Llenar los selects de banco
  const selectBancoOrigen = document.getElementById('bancoOrigen');
  const selectBancoOrigenMultiple = document.getElementById('bancoOrigenMultiple');

  if (selectBancoOrigen) {
    bancosUnicos.forEach(banco => {
      const option = document.createElement('option');
      option.value = banco;
      option.textContent = banco;
      selectBancoOrigen.appendChild(option);
    });
  }

  if (selectBancoOrigenMultiple) {
    bancosUnicos.forEach(banco => {
      const option = document.createElement('option');
      option.value = banco;
      option.textContent = banco;
      selectBancoOrigenMultiple.appendChild(option);
    });
  }

  return bancos;
}

// Función para actualizar las cuentas de origen según el banco seleccionado (modal Registrar Pago)
async function actualizarCuentasOrigenCXC() {
  console.log('🔄 actualizarCuentasOrigenCXC llamada');
  const selectBanco = document.getElementById('bancoOrigen');
  const selectCuenta = document.getElementById('cuentaPago');

  if (!selectBanco) {
    console.error('❌ Select bancoOrigen no encontrado');
    return;
  }

  if (!selectCuenta) {
    console.error('❌ Select cuentaPago no encontrado');
    return;
  }

  const bancoSeleccionado = selectBanco.value;
  console.log('🏦 Banco seleccionado:', bancoSeleccionado);

  selectCuenta.innerHTML = '<option value="">Seleccione una cuenta...</option>';

  if (!bancoSeleccionado) {
    selectCuenta.innerHTML = '<option value="">Primero seleccione un banco</option>';
    return;
  }

  // Cargar todas las cuentas bancarias
  let cuentasBancarias = [];

  if (window.firebaseDb && window.fs) {
    try {
      console.log('📡 Cargando cuentas desde Firebase...');
      const cuentasBancariasDocRef = window.fs.doc(
        window.firebaseDb,
        'configuracion',
        'cuentas_bancarias'
      );
      const cuentasBancariasDoc = await window.fs.getDoc(cuentasBancariasDocRef);

      if (cuentasBancariasDoc.exists()) {
        const data = cuentasBancariasDoc.data();
        if (data.cuentasBancarias && Array.isArray(data.cuentasBancarias)) {
          cuentasBancarias = data.cuentasBancarias;
          console.log(`✅ ${cuentasBancarias.length} cuenta(s) cargada(s) desde Firebase`);
        }
      } else {
        console.warn('⚠️ Documento cuentas_bancarias no existe en Firebase');
      }
    } catch (error) {
      console.warn('⚠️ Error cargando cuentas desde Firebase:', error);
    }
  }

  if (cuentasBancarias.length === 0 && window.configuracionManager) {
    console.log('📦 Intentando cargar cuentas desde configuracionManager...');
    cuentasBancarias = window.configuracionManager.getCuentasBancarias() || [];
    console.log(`✅ ${cuentasBancarias.length} cuenta(s) cargada(s) desde configuracionManager`);
  }

  if (cuentasBancarias.length === 0) {
    console.warn('⚠️ No se encontraron cuentas bancarias en ninguna fuente');
    selectCuenta.innerHTML = '<option value="">No hay cuentas configuradas</option>';
    return;
  }

  // Filtrar cuentas del banco seleccionado
  const cuentasDelBanco = cuentasBancarias.filter(c => c.banco === bancoSeleccionado);
  console.log(
    `🔍 Filtrando cuentas para banco "${bancoSeleccionado}": ${cuentasDelBanco.length} encontrada(s)`
  );

  if (cuentasDelBanco.length === 0) {
    selectCuenta.innerHTML = '<option value="">No hay cuentas para este banco</option>';
    console.warn(`⚠️ No se encontraron cuentas para el banco: ${bancoSeleccionado}`);
    return;
  }

  // Llenar el select de cuentas
  cuentasDelBanco.forEach(cuenta => {
    const option = document.createElement('option');
    option.value = cuenta.numeroCuenta || '';
    option.textContent = cuenta.numeroCuenta || 'Sin número de cuenta';
    selectCuenta.appendChild(option);
  });

  console.log(
    `✅ ${cuentasDelBanco.length} cuenta(s) agregada(s) al select para el banco: ${bancoSeleccionado}`
  );
}

// Función para actualizar las cuentas de origen según el banco seleccionado (modal Registrar Pago Múltiple)
async function actualizarCuentasOrigenMultipleCXC() {
  const selectBanco = document.getElementById('bancoOrigenMultiple');
  const selectCuenta = document.getElementById('cuentaPagoMultiple');

  if (!selectBanco || !selectCuenta) {
    return;
  }

  const bancoSeleccionado = selectBanco.value;
  selectCuenta.innerHTML = '<option value="">Seleccione una cuenta...</option>';

  if (!bancoSeleccionado) {
    selectCuenta.innerHTML = '<option value="">Primero seleccione un banco</option>';
    return;
  }

  // Cargar todas las cuentas bancarias
  let cuentasBancarias = [];

  if (window.firebaseDb && window.fs) {
    try {
      const cuentasBancariasDocRef = window.fs.doc(
        window.firebaseDb,
        'configuracion',
        'cuentas_bancarias'
      );
      const cuentasBancariasDoc = await window.fs.getDoc(cuentasBancariasDocRef);

      if (cuentasBancariasDoc.exists()) {
        const data = cuentasBancariasDoc.data();
        if (data.cuentasBancarias && Array.isArray(data.cuentasBancarias)) {
          cuentasBancarias = data.cuentasBancarias;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando cuentas desde Firebase:', error);
    }
  }

  if (cuentasBancarias.length === 0 && window.configuracionManager) {
    cuentasBancarias = window.configuracionManager.getCuentasBancarias() || [];
  }

  // Filtrar cuentas del banco seleccionado
  const cuentasDelBanco = cuentasBancarias.filter(c => c.banco === bancoSeleccionado);

  if (cuentasDelBanco.length === 0) {
    selectCuenta.innerHTML = '<option value="">No hay cuentas para este banco</option>';
    return;
  }

  // Llenar el select de cuentas
  cuentasDelBanco.forEach(cuenta => {
    const option = document.createElement('option');
    option.value = cuenta.numeroCuenta || '';
    option.textContent = cuenta.numeroCuenta || 'Sin número de cuenta';
    selectCuenta.appendChild(option);
  });
}

// Función para actualizar las cuentas de origen según el banco seleccionado (modal Editar Factura)
async function actualizarCuentasOrigenEditarCXC() {
  const selectBanco = document.getElementById('editarBancoOrigen');
  const selectCuenta = document.getElementById('editarCuentaOrigen');

  if (!selectBanco || !selectCuenta) {
    return;
  }

  const bancoSeleccionado = selectBanco.value;
  selectCuenta.innerHTML = '<option value="">Seleccione una cuenta...</option>';

  if (!bancoSeleccionado) {
    selectCuenta.innerHTML = '<option value="">Primero seleccione un banco</option>';
    return;
  }

  // Cargar todas las cuentas bancarias
  let cuentasBancarias = [];

  if (window.firebaseDb && window.fs) {
    try {
      const cuentasBancariasDocRef = window.fs.doc(
        window.firebaseDb,
        'configuracion',
        'cuentas_bancarias'
      );
      const cuentasBancariasDoc = await window.fs.getDoc(cuentasBancariasDocRef);

      if (cuentasBancariasDoc.exists()) {
        const data = cuentasBancariasDoc.data();
        if (data.cuentasBancarias && Array.isArray(data.cuentasBancarias)) {
          cuentasBancarias = data.cuentasBancarias;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando cuentas desde Firebase:', error);
    }
  }

  if (cuentasBancarias.length === 0 && window.configuracionManager) {
    cuentasBancarias = window.configuracionManager.getCuentasBancarias() || [];
  }

  // Filtrar cuentas del banco seleccionado
  const cuentasDelBanco = cuentasBancarias.filter(c => c.banco === bancoSeleccionado);

  if (cuentasDelBanco.length === 0) {
    selectCuenta.innerHTML = '<option value="">No hay cuentas para este banco</option>';
    return;
  }

  // Llenar el select de cuentas
  cuentasDelBanco.forEach(cuenta => {
    const option = document.createElement('option');
    option.value = cuenta.numeroCuenta || '';
    option.textContent = cuenta.numeroCuenta || 'Sin número de cuenta';
    selectCuenta.appendChild(option);
  });
}

// Cargar bancos cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar configuracionManager si no existe
  if (!window.configuracionManager) {
    window.configuracionManager = new ConfiguracionManager();
  }

  // Esperar un momento para que Firebase esté listo
  const intentarCargar = () => {
    if (window.configuracionManager) {
      cargarBancosCXC();
    } else {
      setTimeout(intentarCargar, 500);
    }
  };

  setTimeout(intentarCargar, 1000);
});

// Recargar bancos cuando se abre el modal
const modalRegistrarPago = document.getElementById('modalRegistrarPago');
if (modalRegistrarPago) {
  modalRegistrarPago.addEventListener('show.bs.modal', () => {
    console.log('📋 Modal de registrar pago abierto, cargando bancos...');
    // Limpiar y recargar bancos
    const selectBanco = document.getElementById('bancoOrigen');
    const selectCuenta = document.getElementById('cuentaPago');
    if (selectBanco) {
      selectBanco.innerHTML = '<option value="">Seleccione un banco...</option>';
      cargarBancosCXC().then(() => {
        console.log('✅ Bancos cargados en el modal');
        // Asegurar que el event listener esté conectado
        if (selectBanco && !selectBanco.hasAttribute('data-handler-attached')) {
          selectBanco.addEventListener('change', () => {
            console.log('🔄 Banco seleccionado cambiado:', selectBanco.value);
            if (typeof window.actualizarCuentasOrigenCXC === 'function') {
              window.actualizarCuentasOrigenCXC();
            } else {
              console.error('❌ actualizarCuentasOrigenCXC no está disponible');
            }
          });
          selectBanco.setAttribute('data-handler-attached', 'true');
        }
      });
    }
    if (selectCuenta) {
      selectCuenta.innerHTML = '<option value="">Primero seleccione un banco</option>';
    }

    // Asegurar que el botón de registrar pago tenga el event handler
    setTimeout(() => {
      const btnRegistrarPago = document.querySelector(
        '#modalRegistrarPago button[data-action="registrarPago"]'
      );
      if (btnRegistrarPago) {
        console.log('🔍 Verificando botón de registrar pago en modal...');
        console.log('📋 Estado del botón:', {
          tieneHandler: btnRegistrarPago.hasAttribute('data-handler-attached'),
          action: btnRegistrarPago.getAttribute('data-action'),
          tieneRegistrarPago: typeof window.registrarPago === 'function'
        });

        // Si no tiene handler, agregarlo manualmente
        if (!btnRegistrarPago.hasAttribute('data-handler-attached')) {
          console.log('⚠️ Botón no tiene handler, agregándolo manualmente...');
          btnRegistrarPago.addEventListener('click', async e => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log('🖱️ Botón de registrar pago clickeado (handler manual)');

            if (typeof window.registrarPago === 'function') {
              console.log('✅ Función registrarPago encontrada, ejecutando...');
              try {
                await window.registrarPago();
              } catch (error) {
                console.error('❌ Error al ejecutar registrarPago:', error);
              }
            } else {
              console.error('❌ registrarPago no está disponible');
              if (typeof window.showNotification === 'function') {
                window.showNotification(
                  'Error: La función de registrar pago no está disponible. Por favor recarga la página.',
                  'error'
                );
              } else {
                alert(
                  'Error: La función de registrar pago no está disponible. Por favor recarga la página.'
                );
              }
            }
            return false;
          });
          btnRegistrarPago.setAttribute('data-handler-attached', 'true');
          console.log('✅ Handler manual agregado al botón de registrar pago');
        } else {
          console.log('✅ Botón ya tiene handler registrado');
        }
      } else {
        console.warn('⚠️ Botón de registrar pago no encontrado en el modal');
      }
    }, 100);
  });
}

// Recargar bancos cuando se abre el modal de pago múltiple
const modalPagoMultiple = document.getElementById('modalPagoMultiple');
if (modalPagoMultiple) {
  modalPagoMultiple.addEventListener('show.bs.modal', () => {
    // Limpiar y recargar bancos
    const selectBanco = document.getElementById('bancoOrigenMultiple');
    const selectCuenta = document.getElementById('cuentaPagoMultiple');
    if (selectBanco) {
      selectBanco.innerHTML = '<option value="">Seleccione un banco...</option>';
      cargarBancosCXC();
    }
    if (selectCuenta) {
      selectCuenta.innerHTML = '<option value="">Primero seleccione un banco</option>';
    }
  });
}

// Exponer funciones globalmente para que estén disponibles cuando se necesiten
window.actualizarCuentasOrigenCXC = actualizarCuentasOrigenCXC;
window.actualizarCuentasOrigenMultipleCXC = actualizarCuentasOrigenMultipleCXC;
window.actualizarCuentasOrigenEditarCXC = actualizarCuentasOrigenEditarCXC;
window.cargarBancosCXC = cargarBancosCXC;

console.log('✅ Funciones de CXC expuestas globalmente:', {
  actualizarCuentasOrigenCXC: typeof window.actualizarCuentasOrigenCXC,
  actualizarCuentasOrigenMultipleCXC: typeof window.actualizarCuentasOrigenMultipleCXC,
  actualizarCuentasOrigenEditarCXC: typeof window.actualizarCuentasOrigenEditarCXC,
  cargarBancosCXC: typeof window.cargarBancosCXC
});
