/**
 * Utilidades de Demo - demo.html
 * Funciones auxiliares para la página de demo
 */

(function () {
  'use strict';

  /**
   * Scroll suave a la sección de características
   */
  window.scrollToFeatures = function () {
    const featuresElement = document.getElementById('features');
    if (featuresElement) {
      // Ajustar para el navbar fixed
      const navbarHeight = document.querySelector('.demo-navbar')?.offsetHeight || 76;
      const elementPosition = featuresElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  /**
   * Inicializar efectos del navbar al hacer scroll
   */
  function initNavbarScroll() {
    const navbar = document.querySelector('.demo-navbar');
    if (!navbar) {
      return;
    }

    let _lastScroll = 0;
    const scrollThreshold = 50;

    window.addEventListener(
      'scroll',
      () => {
        const currentScroll = window.pageYOffset;

        // Agregar clase 'scrolled' cuando se hace scroll
        if (currentScroll > scrollThreshold) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }

        // Actualizar link activo según la sección visible
        updateActiveNavLink();

        _lastScroll = currentScroll;
      },
      { passive: true }
    );
  }

  /**
   * Variable global para almacenar el plan seleccionado
   */
  let selectedPlan = null;

  /**
   * Datos de los planes disponibles - TARIFAS PREMIUM 2024
   * Solo 4 planes: Básico, Estándar, Premium, Enterprise
   * Solo mensual y anual (sin trimestral)
   */
  const planData = {
    prueba: {
      nombre: 'Plan de Prueba',
      registros: 'Para pruebas de webhook',
      precioMensual: 10,
      precioAnual: 10, // Mismo precio para pruebas
      almacenamiento: '1 GB (solo para pruebas)',
      descuentoInicial: null
    },
    basico: {
      nombre: 'Plan Básico',
      registros: 'Hasta 100 registros/mes',
      precioMensual: 1999,
      precioAnual: 1999 * 11, // 1 mes gratis
      almacenamiento: '10 GB (incluye imágenes y PDFs)',
      descuentoInicial: null
    },
    estandar: {
      nombre: 'Plan Estándar',
      registros: 'Hasta 500 registros/mes',
      precioMensual: 4999,
      precioAnual: 4999 * 11, // 1 mes gratis
      almacenamiento: '25 GB (incluye imágenes y PDFs)'
    },
    premium: {
      nombre: 'Plan Premium',
      registros: 'Hasta 2,000 registros/mes',
      precioMensual: 8999,
      precioAnual: 8999 * 11, // 1 mes gratis
      almacenamiento: '100 GB (incluye imágenes y PDFs)'
    },
    enterprise: {
      nombre: 'Plan Enterprise',
      registros: 'Registros ilimitados',
      precioMensual: 14999,
      precioAnual: 14999 * 11, // 1 mes gratis
      almacenamiento: 'Ilimitado (incluye imágenes y PDFs)'
    },
    // Mantener compatibilidad con rangos antiguos
    '0-100': {
      nombre: 'Plan Básico',
      registros: 'Hasta 100 registros/mes',
      precioMensual: 1999,
      precioAnual: 1999 * 11,
      almacenamiento: '10 GB (incluye imágenes y PDFs)',
      descuentoInicial: null
    },
    '101-500': {
      nombre: 'Plan Estándar',
      registros: 'Hasta 500 registros/mes',
      precioMensual: 4999,
      precioAnual: 4999 * 11,
      almacenamiento: '25 GB (incluye imágenes y PDFs)'
    },
    '1001-2000': {
      nombre: 'Plan Premium',
      registros: 'Hasta 2,000 registros/mes',
      precioMensual: 8999,
      precioAnual: 8999 * 11,
      almacenamiento: '100 GB (incluye imágenes y PDFs)'
    },
    '10001+': {
      nombre: 'Plan Enterprise',
      registros: 'Registros ilimitados',
      precioMensual: 14999,
      precioAnual: 14999 * 11,
      almacenamiento: 'Ilimitado (incluye imágenes y PDFs)'
    }
  };

  /**
   * Función para contactar ventas - Abre modal de contratación
   */
  window.contactarVentas = function (rango) {
    // Guardar el plan seleccionado
    selectedPlan = rango;

    // Abrir modal de contratación
    const modalElement = document.getElementById('contractModal');
    if (!modalElement) {
      console.error('Modal de contratación no encontrado');
      alert('Error: No se pudo abrir el formulario de contratación. Por favor, recarga la página.');
      return;
    }

    const modal = new bootstrap.Modal(modalElement);

    // Llenar detalles del plan
    fillContractPlanDetails(rango);

    // Limpiar formulario
    document.getElementById('contractForm')?.reset();

    // Resetear campos dinámicos
    document.getElementById('contractPriceDisplay').style.display = 'none';
    document.getElementById('paymentMethodInfo').style.display = 'none';
    document.getElementById('tarjetaInfo').style.display = 'none';
    document.getElementById('transferenciaInfo').style.display = 'none';
    const receiptField = document.getElementById('paymentReceipt');
    if (receiptField) {
      receiptField.required = false;
      receiptField.value = '';
    }

    // Mostrar modal
    modal.show();
  };

  /**
   * Llenar detalles del plan en el modal
   */
  function fillContractPlanDetails(rango) {
    const plan = planData[rango] || planData['0-100'];
    const detailsContainer = document.getElementById('contractPlanDetails');

    if (!detailsContainer) {
      return;
    }

    const precioMensualFormatted = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(plan.precioMensual);

    const precioAnualFormatted = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(plan.precioAnual);

    detailsContainer.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="text-primary mb-2">${plan.nombre}</h6>
                    <p class="mb-2"><strong>Almacenamiento:</strong> ${plan.almacenamiento}</p>
                    ${plan.descuentoInicial ? `<p class="mb-0 text-success"><i class="fas fa-gift me-1"></i><strong>${plan.descuentoInicial}</strong></p>` : ''}
                </div>
                <div class="col-md-6">
                    <p class="mb-1"><strong>Mensual:</strong> ${precioMensualFormatted}</p>
                    <p class="mb-0"><strong>Anual:</strong> ${precioAnualFormatted} <small class="text-success">(1 mes gratis)</small></p>
                </div>
            </div>
            ${plan.nota ? `<div class="alert alert-warning mt-3 mb-0"><small>${plan.nota}</small></div>` : ''}
        `;

    // Actualizar precio cuando se seleccione tipo de pago
    updateContractPrice();
  }

  /**
   * Actualizar precio mostrado según el tipo de pago seleccionado
   * Incluye descuento del 20% para primera compra
   */
  window.updateContractPrice = function () {
    if (!selectedPlan) {
      return;
    }

    const plan = planData[selectedPlan] || planData['0-100'];
    const tipoPago = document.getElementById('contractPaymentPeriod')?.value;
    const priceDisplay = document.getElementById('contractPriceDisplay');
    const priceValue = document.getElementById('contractPriceValue');

    if (!tipoPago || !priceDisplay || !priceValue) {
      if (priceDisplay) {
        priceDisplay.style.display = 'none';
      }
      return;
    }

    let precioOriginal = plan.precioMensual;
    let texto = 'Mensual';

    if (tipoPago === 'anual') {
      precioOriginal = plan.precioAnual;
      texto = 'Anual (11 meses, 1 mes gratis)';
    }

    // Aplicar descuento del 20% para primera compra
    // El backend verificará realmente si es primera compra, pero mostramos el descuento potencial
    const descuentoPorcentaje = 20;
    const descuento = precioOriginal * (descuentoPorcentaje / 100);
    const precioConDescuento = precioOriginal - descuento;

    const precioOriginalFormatted = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(precioOriginal);

    const precioConDescuentoFormatted = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(precioConDescuento);

    const descuentoFormatted = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(descuento);

    // Mostrar precio con descuento
    priceValue.innerHTML = `
            <div class="mb-2">
                <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="text-decoration-line-through text-muted">${precioOriginalFormatted}</span>
                    <span class="badge bg-success">-${descuentoPorcentaje}%</span>
                </div>
                <div class="fs-5 fw-bold text-success">
                    ${precioConDescuentoFormatted} MXN
                </div>
                <small class="text-muted d-block">${texto}</small>
                <small class="text-success d-block">
                    <i class="fas fa-gift me-1"></i>Ahorro de ${descuentoFormatted} (descuento primera compra)
                </small>
            </div>
        `;

    priceDisplay.style.display = 'block';
  };

  /**
   * Actualizar información mostrada según el método de pago seleccionado
   */
  window.updatePaymentMethodInfo = function () {
    const metodoPago = document.getElementById('contractPaymentMethod')?.value;
    const infoContainer = document.getElementById('paymentMethodInfo');
    const tarjetaInfo = document.getElementById('tarjetaInfo');
    const transferenciaInfo = document.getElementById('transferenciaInfo');
    const receiptField = document.getElementById('paymentReceipt');
    const infoAlert = document.getElementById('contractInfoAlert');

    if (!metodoPago || !infoContainer) {
      if (infoContainer) {
        infoContainer.style.display = 'none';
      }
      if (receiptField) {
        receiptField.required = false;
      }
      return;
    }

    infoContainer.style.display = 'block';

    if (metodoPago === 'tarjeta') {
      if (tarjetaInfo) {
        tarjetaInfo.style.display = 'block';
      }
      if (transferenciaInfo) {
        transferenciaInfo.style.display = 'none';
      }
      if (receiptField) {
        receiptField.required = false;
        receiptField.value = '';
      }
      if (infoAlert) {
        infoAlert.innerHTML =
          '<i class="fas fa-info-circle me-2"></i><strong>Próximos pasos:</strong> Serás redirigido a una página segura para completar tu pago con tarjeta.';
      }
    } else if (metodoPago === 'transferencia') {
      if (tarjetaInfo) {
        tarjetaInfo.style.display = 'none';
      }
      if (transferenciaInfo) {
        transferenciaInfo.style.display = 'block';
      }
      if (receiptField) {
        receiptField.required = true;
      }
      if (infoAlert) {
        infoAlert.innerHTML =
          '<i class="fas fa-info-circle me-2"></i><strong>Próximos pasos:</strong> Te enviaremos un correo con tu solicitud. Una vez validado el pago, recibirás tu licencia por correo electrónico.';
      }
    }
  };

  /**
   * Convertir archivo a base64
   */
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Función para enviar solicitud de contratación
   */
  window.submitContractRequest = async function () {
    const form = document.getElementById('contractForm');
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    const plan = planData[selectedPlan] || planData['0-100'];
    const nombre = document.getElementById('contractName').value;
    const email = document.getElementById('contractEmail').value;
    const telefono = document.getElementById('contractPhone').value;
    const empresa = document.getElementById('contractCompany').value || 'No especificada';
    const periodoPago = document.getElementById('contractPaymentPeriod').value;
    const metodoPago = document.getElementById('contractPaymentMethod').value;
    const mensaje = document.getElementById('contractMessage').value || 'Sin mensaje adicional';

    // Obtener comprobante si es transferencia
    let comprobanteBase64 = null;
    let comprobanteNombre = null;
    if (metodoPago === 'transferencia') {
      const receiptFile = document.getElementById('paymentReceipt')?.files[0];
      if (receiptFile) {
        try {
          comprobanteBase64 = await fileToBase64(receiptFile);
          comprobanteNombre = receiptFile.name;
        } catch (error) {
          console.error('Error procesando comprobante:', error);
          alert('Error al procesar el comprobante. Por favor, intenta nuevamente.');
          return;
        }
      }
    }

    // Calcular precio según periodo de pago
    let precioSeleccionado = plan.precioMensual;
    let periodoTexto = 'Mensual';

    if (periodoPago === 'anual') {
      precioSeleccionado = plan.precioAnual;
      periodoTexto = 'Anual (11 meses, 1 mes gratis)';
    }

    const precioFormatted = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(precioSeleccionado);

    // Guardar solicitud en localStorage (para seguimiento)
    const solicitud = {
      id: Date.now().toString(),
      fecha: new Date().toISOString(),
      plan: plan.nombre,
      rango: selectedPlan,
      cliente: {
        nombre,
        email,
        telefono,
        empresa
      },
      periodoPago,
      metodoPago,
      precio: precioSeleccionado,
      mensaje,
      estado: 'pendiente',
      comprobante: comprobanteBase64
        ? {
          nombre: comprobanteNombre,
          base64: comprobanteBase64,
          tipo: comprobanteBase64.split(';')[0].split(':')[1]
        }
        : null
    };

    // Guardar en localStorage
    const solicitudes = JSON.parse(localStorage.getItem('titanfleet_solicitudes') || '[]');
    solicitudes.push(solicitud);
    localStorage.setItem('titanfleet_solicitudes', JSON.stringify(solicitudes));

    // Intentar guardar en Firebase si está disponible
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      try {
        const db = firebase.firestore();
        db.collection('solicitudes_contratacion')
          .add(solicitud)
          .then(() => {
            console.log('✅ Solicitud guardada en Firebase');
          })
          .catch(error => {
            console.warn('⚠️ No se pudo guardar en Firebase:', error);
          });
      } catch (error) {
        console.warn('⚠️ Error guardando en Firebase:', error);
      }
    }

    // Deshabilitar botón
    const btnSubmit = document.getElementById('btnSubmitContract');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Procesando...';
    }

    // Manejar según método de pago
    if (metodoPago === 'transferencia') {
      // Enviar correo para transferencia
      handleTransferenciaPayment(
        solicitud,
        plan,
        periodoTexto,
        precioFormatted,
        comprobanteBase64,
        comprobanteNombre
      );
    } else if (metodoPago === 'tarjeta') {
      // Redirigir a página de pago
      handleTarjetaPayment(solicitud, plan, periodoTexto, precioSeleccionado);
    }
  };

  /**
   * Manejar pago por transferencia - Enviar correo
   */
  function handleTransferenciaPayment(
    solicitud,
    plan,
    periodoTexto,
    precioFormatted,
    comprobanteBase64,
    comprobanteNombre
  ) {
    const { nombre } = solicitud.cliente;
    const { email } = solicitud.cliente;
    const { telefono } = solicitud.cliente;
    const { empresa } = solicitud.cliente;
    const { mensaje } = solicitud;

    // Datos bancarios
    const datosBancarios = {
      clabe: '722969010652631485',
      beneficiario: 'Karen Minerva Castañeda Guzman',
      institucion: 'Mercado Pago W'
    };

    // Crear mensaje de email para el administrador
    const emailBody = `NUEVA SOLICITUD DE CONTRATACIÓN - TRANSFERENCIA BANCARIA

INFORMACIÓN DEL CLIENTE:
- Nombre: ${nombre}
- Email: ${email}
- Teléfono: ${telefono}
- Empresa: ${empresa}

DETALLES DEL PLAN:
- Plan: ${plan.nombre}
- Periodo de pago: ${periodoTexto}
- Precio: ${precioFormatted} MXN
- Almacenamiento: ${plan.almacenamiento}
${plan.descuentoInicial ? `- ${plan.descuentoInicial}\n` : ''}

MÉTODO DE PAGO: Transferencia Bancaria

DATOS BANCARIOS PROPORCIONADOS AL CLIENTE:
- CLABE: ${datosBancarios.clabe}
- Beneficiario: ${datosBancarios.beneficiario}
- Institución: ${datosBancarios.institucion}

${comprobanteNombre ? `COMPROBANTE ADJUNTO: ${comprobanteNombre}\n` : 'COMPROBANTE: No se adjuntó comprobante\n'}

MENSAJE ADICIONAL DEL CLIENTE:
${mensaje}

---
ID de Solicitud: ${solicitud.id}
Fecha: ${new Date().toLocaleString('es-MX')}

ACCIONES REQUERIDAS:
1. Verificar el comprobante de pago (si se adjuntó)
2. Validar el pago en la cuenta bancaria
3. Generar y enviar la licencia al cliente por correo

NOTA: ${comprobanteNombre ? 'El cliente adjuntó un comprobante. Revisa el archivo adjunto en este correo.' : 'El cliente NO adjuntó comprobante. Contacta al cliente para solicitarlo.'}`;

    const emailTo = 'samuelayalasandoval@gmail.com';
    const asunto = encodeURIComponent(
      `Solicitud Transferencia - ${plan.nombre} - ${nombre}${comprobanteNombre ? ' [CON COMPROBANTE]' : ''}`
    );
    const cuerpo = encodeURIComponent(emailBody);

    // Si hay comprobante, intentar adjuntarlo
    // Nota: mailto no soporta adjuntos directamente, pero podemos incluir la info en el cuerpo
    // Para adjuntos reales, necesitarías un backend que envíe el correo

    // Guardar comprobante en localStorage para referencia
    if (comprobanteBase64) {
      localStorage.setItem(
        `titanfleet_comprobante_${solicitud.id}`,
        JSON.stringify({
          nombre: comprobanteNombre,
          base64: comprobanteBase64,
          fecha: new Date().toISOString()
        })
      );
    }

    // Abrir cliente de email
    window.location.href = `mailto:${emailTo}?subject=${asunto}&body=${cuerpo}`;

    // Mostrar confirmación después de un momento
    setTimeout(() => {
      // Cerrar modal si existe
      const modalElement = document.getElementById('contractModal');
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }

      // Mostrar mensaje de éxito
      showContractSuccess(solicitud, 'transferencia');
    }, 500);
  }

  /**
   * Manejar pago por tarjeta - Redirigir a página de pago
   */
  function handleTarjetaPayment(solicitud, plan, periodoTexto, precioSeleccionado) {
    // Guardar datos de la solicitud en sessionStorage para la página de pago
    sessionStorage.setItem(
      'titanfleet_payment_data',
      JSON.stringify({
        solicitudId: solicitud.id,
        plan: plan.nombre,
        periodo: periodoTexto,
        precio: precioSeleccionado,
        cliente: solicitud.cliente
      })
    );

    // Cerrar modal primero si existe
    const modalElement = document.getElementById('contractModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }

    // Mostrar mensaje de redirección
    showContractSuccess(solicitud, 'tarjeta');

    // Redirigir a página de pago después de un breve delay
    setTimeout(() => {
      window.location.href = 'pago.html';
    }, 1500);
  }

  /**
   * Mostrar mensaje de éxito después de enviar solicitud
   */
  function showContractSuccess(solicitud, metodoPago = 'tarjeta') {
    let mensaje = '';
    let titulo = '';

    if (metodoPago === 'transferencia') {
      titulo = 'Solicitud de Transferencia Enviada';
      mensaje = `
                <p><strong>¡Solicitud recibida!</strong></p>
                <p>Hemos enviado un correo con tu solicitud. Te contactaremos en breve con los datos bancarios para realizar la transferencia.</p>
                <p>Una vez validado el pago, recibirás tu licencia por correo electrónico.</p>
                <p class="mb-0"><small>ID de solicitud: <code>${solicitud.id}</code></small></p>
            `;
    } else {
      titulo = 'Redirigiendo a Pago';
      mensaje = `
                <p><strong>¡Redirigiendo a la página de pago!</strong></p>
                <p>Serás redirigido en breve para completar tu pago de forma segura.</p>
                <p class="mb-0"><small>ID de solicitud: <code>${solicitud.id}</code></small></p>
            `;
    }

    // Crear toast de confirmación
    const toastHTML = `
            <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 9999">
                <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header bg-success text-white">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong class="me-auto">${titulo}</strong>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                    </div>
                    <div class="toast-body">
                        ${mensaje}
                    </div>
                </div>
            </div>
        `;

    // Agregar toast al body
    const toastContainer = document.createElement('div');
    toastContainer.innerHTML = toastHTML;
    document.body.appendChild(toastContainer);

    // Auto-ocultar después de 10 segundos
    setTimeout(() => {
      const toast = toastContainer.querySelector('.toast');
      if (toast) {
        const bsToast = bootstrap.Toast.getOrCreateInstance(toast);
        bsToast.hide();
        setTimeout(() => toastContainer.remove(), 300);
      }
    }, 10000);
  }

  /**
   * Actualizar el link activo del navbar según la sección visible
   */
  function updateActiveNavLink() {
    const sections = ['inicio', 'features', 'precios', 'info'];
    const navbarHeight = document.querySelector('.demo-navbar')?.offsetHeight || 76;
    const scrollPosition = window.pageYOffset + navbarHeight + 100;

    sections.forEach(sectionId => {
      const section = document.getElementById(sectionId);
      const navLink = document.querySelector(`.demo-navbar .nav-link[href="#${sectionId}"]`);

      if (section && navLink) {
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;

        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
          // Remover active de todos los links
          document.querySelectorAll('.demo-navbar .nav-link').forEach(link => {
            link.classList.remove('active');
          });
          // Agregar active al link correspondiente
          navLink.classList.add('active');
        }
      }
    });
  }

  /**
   * Manejar clicks en los links del navbar con scroll suave
   */
  function initNavbarLinks() {
    document.querySelectorAll('.demo-navbar .nav-link[href^="#"]').forEach(link => {
      link.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') {
          return;
        }

        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          e.preventDefault();

          const navbarHeight = document.querySelector('.demo-navbar')?.offsetHeight || 76;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          // Cerrar el menú móvil si está abierto
          const navbarCollapse = document.querySelector('.demo-navbar .navbar-collapse');
          if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            // Esperar a que Bootstrap esté disponible
            if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
              const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
              if (bsCollapse) {
                bsCollapse.hide();
              } else {
                // Si no hay instancia, simplemente remover la clase show
                navbarCollapse.classList.remove('show');
              }
            } else {
              // Fallback si Bootstrap no está disponible
              navbarCollapse.classList.remove('show');
            }
          }
        }
      });
    });
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initNavbarScroll();
      initNavbarLinks();
    });
  } else {
    initNavbarScroll();
    initNavbarLinks();
  }
})();
