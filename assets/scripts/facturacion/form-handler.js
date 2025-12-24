/**
 * Manejo de Formularios - facturacion.html
 * Funciones para obtener datos del formulario y limpiar campos
 *
 * NOTA: Los datos se estandarizan para evitar duplicados:
 * - Montos se guardan como números (no strings con formato)
 * - Campos duplicados se eliminan (ej: "Cliente" y "cliente" -> solo "cliente")
 * - Campos vacíos no se guardan
 * - Nombres de campos en camelCase consistente
 */

(function () {
  'use strict';

  /**
   * Obtiene los datos del formulario de facturación
   * @returns {Object} Objeto con los datos del formulario
   */
  window.obtenerDatosFacturacion = async function () {
    console.log('📊 Obteniendo datos del formulario de facturación...');

    // Obtener valores del formulario
    const registroId = document.getElementById('numeroRegistro')?.value || '';
    const _numeroFactura = document.getElementById('numeroFactura')?.value || '';
    const fechaFactura = document.getElementById('fechaFactura')?.value || '';
    const fechaCreacionInput = document.getElementById('fechaCreacion');
    const fechaCreacion = fechaCreacionInput?.value || '';

    const clienteRaw = document.getElementById('Cliente')?.value || '';
    const totalFactura = document.getElementById('total factura')?.value || '';
    const tipoMoneda = document.getElementById('tipoMoneda')?.value || 'MXN';
    const tipoCambio = document.getElementById('tipoCambio')?.value || '';

    // Separar nombre del cliente y RFC si viene en formato "Nombre - RFC"
    let cliente = clienteRaw;
    let rfc = '';

    if (clienteRaw) {
      // Verificar si viene en formato "Nombre - RFC"
      const separador = ' - ';
      if (clienteRaw.includes(separador)) {
        const partes = clienteRaw.split(separador);
        cliente = partes[0].trim();
        rfc = partes[1]?.trim() || '';
        console.log('📋 Cliente separado:', { nombre: cliente, rfc: rfc });
      } else {
        // Verificar si es solo un RFC
        const esRFC = /^[A-Z]{3,4}\d{6}[A-Z0-9]{2,3}$/.test(clienteRaw.trim());

        if (esRFC) {
          // Es solo RFC, buscar el nombre del cliente
          rfc = clienteRaw.trim();
          try {
            if (
              window.configuracionManager &&
              typeof window.configuracionManager.getCliente === 'function'
            ) {
              const clienteData = window.configuracionManager.getCliente(rfc);
              if (clienteData && clienteData.nombre) {
                cliente = clienteData.nombre;
              }
            } else {
              const clientesData = localStorage.getItem('erp_clientes');
              if (clientesData) {
                const clientes = JSON.parse(clientesData);
                let clienteData = null;

                if (Array.isArray(clientes)) {
                  clienteData = clientes.find(c => c.rfc === rfc);
                } else {
                  clienteData = clientes[rfc];
                }

                if (clienteData && clienteData.nombre) {
                  cliente = clienteData.nombre;
                } else if (clienteData && clienteData.nombreCliente) {
                  cliente = clienteData.nombreCliente;
                }
              }
            }
          } catch (error) {
            console.warn('⚠️ Error al convertir RFC a nombre del cliente:', error);
          }
        } else {
          // Es solo nombre, intentar obtener RFC del cliente
          try {
            if (
              window.configuracionManager &&
              typeof window.configuracionManager.getAllClientes === 'function'
            ) {
              const clientes = await window.configuracionManager.getAllClientes();
              const clienteData = clientes.find(
                c => c.nombre === clienteRaw || c.nombreCliente === clienteRaw
              );
              if (clienteData && clienteData.rfc) {
                rfc = clienteData.rfc;
              }
            } else {
              // Fallback: buscar en localStorage
              const clientesData = localStorage.getItem('erp_clientes');
              if (clientesData) {
                const clientes = JSON.parse(clientesData);
                const clientesArray = Array.isArray(clientes) ? clientes : Object.values(clientes);
                const clienteData = clientesArray.find(
                  c => c.nombre === clienteRaw || c.nombreCliente === clienteRaw
                );
                if (clienteData && clienteData.rfc) {
                  rfc = clienteData.rfc;
                }
              }
            }
          } catch (error) {
            console.warn('⚠️ Error al obtener RFC del cliente:', error);
          }
        }
      }
    }

    // Obtener Referencia Cliente del campo del formulario
    const referenciaCliente = document.getElementById('ReferenciaCliente')?.value?.trim() || '';

    // Obtener Económico/Tractocamión del campo del formulario
    const economicoRaw = document.getElementById('economico')?.value?.trim() || '';
    const economico = economicoRaw ? parseInt(economicoRaw, 10) || economicoRaw : undefined;

    // Función helper para convertir montos de string con formato a número
    const convertirMontoANumero = valor => {
      if (!valor || valor === '') {
        return 0;
      }
      if (typeof valor === 'number') {
        return valor;
      }
      const limpio = String(valor).replace(/[$,]/g, '').trim();
      const numero = parseFloat(limpio);
      return isNaN(numero) ? 0 : numero;
    };

    // Obtener valores de montos y convertirlos a números
    const subtotalRaw = document.getElementById('Subtotal')?.value || '';
    const ivaRaw = document.getElementById('iva')?.value || '';
    const ivaRetenidoRaw = document.getElementById('iva retenido')?.value || '';
    const isrRetenidoRaw = document.getElementById('isr retenido')?.value || '';
    const otrosMontosRaw = document.getElementById('Otros Montos')?.value || '';
    const totalFacturaRaw = totalFactura || '';

    const subtotal = convertirMontoANumero(subtotalRaw);
    const iva = convertirMontoANumero(ivaRaw);
    const ivaRetenido = convertirMontoANumero(ivaRetenidoRaw);
    const isrRetenido = convertirMontoANumero(isrRetenidoRaw);
    const otrosMontos = convertirMontoANumero(otrosMontosRaw);
    const total = convertirMontoANumero(totalFacturaRaw);

    // Obtener folio fiscal (solo una vez)
    const folioFiscal = document.getElementById('Folio Fiscal')?.value?.trim() || '';

    // Construir objeto de datos estandarizado (sin duplicados)
    const datos = {
      // Identificadores
      numeroRegistro: registroId,

      // Información del cliente (solo campos con datos)
      cliente: cliente || undefined,
      ...(rfc ? { rfc: rfc } : {}),
      ...(referenciaCliente ? { referenciaCliente: referenciaCliente } : {}),
      ...(economico ? { economico: economico } : {}),
      ...(document.getElementById('direccionCliente')?.value?.trim()
        ? { direccionCliente: document.getElementById('direccionCliente').value.trim() }
        : {}),
      ...(document.getElementById('telefonoCliente')?.value?.trim()
        ? { telefonoCliente: document.getElementById('telefonoCliente').value.trim() }
        : {}),
      ...(document.getElementById('emailCliente')?.value?.trim()
        ? { emailCliente: document.getElementById('emailCliente').value.trim() }
        : {}),

      // Información de la factura
      serie: document.getElementById('serie')?.value?.trim() || undefined,
      folio: document.getElementById('folio')?.value?.trim() || undefined,
      folioFiscal: folioFiscal || undefined,

      // Montos (como números, no strings)
      subtotal: subtotal || undefined,
      iva: iva || undefined,
      ivaRetenido: ivaRetenido || undefined,
      isrRetenido: isrRetenido || undefined,
      otrosMontos: otrosMontos || undefined,
      total: total || undefined,

      // Moneda y tipo de cambio
      moneda: tipoMoneda || 'MXN',
      ...(tipoCambio ? { tipoCambio: parseFloat(tipoCambio) || undefined } : {}),

      // Fechas
      fechaCreacion: fechaCreacion || undefined,
      ...(fechaFactura ? { fechaFactura: fechaFactura } : {}),

      // Observaciones
      ...(document.getElementById('descripcionFacturacion')?.value?.trim()
        ? {
          descripcionFacturacion: document.getElementById('descripcionFacturacion').value.trim()
        }
        : {}),

      // Estado y servicios
      estado: 'pendiente',
      servicios: [
        {
          descripcion: 'Servicio de facturación',
          cantidad: 1,
          precio: total || 0,
          subtotal: total || 0
        }
      ]
    };

    // Eliminar campos undefined para no guardar campos vacíos
    Object.keys(datos).forEach(key => {
      if (datos[key] === undefined || datos[key] === '') {
        delete datos[key];
      }
    });

    return datos;
  };

  /**
   * Limpia el formulario de facturación
   */
  window.clearCurrentForm = function () {
    console.log('🧹 Limpiando formulario de facturación...');

    try {
      const camposEditables = [
        'serie',
        'folio',
        'Folio Fiscal',
        'Subtotal',
        'iva',
        'iva retenido',
        'isr retenido',
        'Otros Montos',
        'tipoCambio',
        'descripcionFacturacion'
      ];

      camposEditables.forEach(campoId => {
        const campo = document.getElementById(campoId);
        if (campo) {
          campo.value = '';
          campo.classList.remove('is-valid', 'is-invalid');
        }
      });

      const tipoMoneda = document.getElementById('tipoMoneda');
      if (tipoMoneda) {
        tipoMoneda.value = 'MXN';
      }

      const tipoCambio = document.getElementById('tipoCambio');
      if (tipoCambio) {
        tipoCambio.value = '';
        tipoCambio.removeAttribute('readonly');
      }

      const observacionesNo = document.getElementById('observacionesNo');
      const observacionesSi = document.getElementById('observacionesSi');
      if (observacionesNo) {
        observacionesNo.checked = true;
      }
      if (observacionesSi) {
        observacionesSi.checked = false;
      }

      const descripcionObservaciones = document.getElementById('descripcionObservaciones');
      if (descripcionObservaciones) {
        descripcionObservaciones.classList.remove('show');
      }

      const totalFactura = document.getElementById('total factura');
      if (totalFactura) {
        totalFactura.value = '';
      }

      const fechaCreacion = document.getElementById('fechaCreacion');
      if (fechaCreacion) {
        const hoy = new Date();
        const año = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        fechaCreacion.value = `${año}-${mes}-${dia}`;
      }

      const formulario = document.getElementById('facturacionForm');
      if (formulario) {
        formulario.classList.remove('was-validated');
      }

      console.log('✅ Formulario de facturación limpiado correctamente');
    } catch (error) {
      console.error('❌ Error al limpiar formulario:', error);
    }
  };
})();
