/**
 * Utilidades de Cliente - trafico.html
 * Funciones para verificar y corregir datos de clientes (RFC, referencia)
 *
 * @module trafico/cliente-utils
 */

(function () {
  'use strict';
  window.verificarReferenciaCliente = function () {
    console.log('ðŸ” Verificando referencia del cliente y RFC en LogÃ­stica y TrÃ¡fico...');

    const raw = localStorage.getItem('erp_shared_data');
    const parsed = raw ? JSON.parse(raw) : {};
    const registros = parsed.registros || {};
    const trafico = parsed.trafico || {};

    console.log('ðŸ“‹ Registros en LogÃ­stica:', Object.keys(registros));
    console.log('ðŸ“‹ Registros en TrÃ¡fico:', Object.keys(trafico));

    // Verificar en LogÃ­stica
    Object.keys(registros).forEach(regId => {
      const datosLogistica = registros[regId];
      console.log(`ðŸ“„ LogÃ­stica ${regId}:`, {
        referenciaCliente: datosLogistica.referenciaCliente,
        'referencia cliente': datosLogistica['referencia cliente'],
        rfcCliente: datosLogistica.rfcCliente,
        RFC: datosLogistica.RFC,
        rfc: datosLogistica.rfc,
        cliente: datosLogistica.cliente,
        todasLasClaves: Object.keys(datosLogistica)
      });
    });

    // Verificar en TrÃ¡fico
    Object.keys(trafico).forEach(regId => {
      const datosTrafico = trafico[regId];
      console.log(`ðŸš› TrÃ¡fico ${regId}:`, {
        'referencia cliente': datosTrafico['referencia cliente'],
        referenciaCliente: datosTrafico.referenciaCliente,
        rfcCliente: datosTrafico.rfcCliente,
        RFC: datosTrafico.RFC,
        rfc: datosTrafico.rfc,
        cliente: datosTrafico.cliente,
        todasLasClaves: Object.keys(datosTrafico)
      });

      let cambiosRealizados = false;

      // Intentar corregir referencia del cliente si existe en LogÃ­stica pero no en TrÃ¡fico
      if (
        registros[regId] &&
        registros[regId].referenciaCliente &&
        !datosTrafico['referencia cliente']
      ) {
        console.log(`ðŸ”§ Corrigiendo referencia del cliente para ${regId}...`);
        datosTrafico['referencia cliente'] = registros[regId].referenciaCliente;
        cambiosRealizados = true;
        console.log(`âœ… Referencia del cliente corregida: ${registros[regId].referenciaCliente}`);
      }

      // Intentar corregir RFC del cliente si existe en LogÃ­stica pero no en TrÃ¡fico
      const rfcLogistica =
        registros[regId]?.rfcCliente || registros[regId]?.RFC || registros[regId]?.rfc;
      const rfcTrafico = datosTrafico.rfcCliente || datosTrafico.RFC || datosTrafico.rfc;

      if (rfcLogistica && !rfcTrafico) {
        console.log(`ðŸ”§ Corrigiendo RFC del cliente para ${regId}...`);
        datosTrafico.rfcCliente = rfcLogistica;
        cambiosRealizados = true;
        console.log(`âœ… RFC del cliente corregido: ${rfcLogistica}`);
      }

      // Si no hay RFC en LogÃ­stica, intentar obtenerlo del nombre del cliente
      if (!rfcLogistica && registros[regId]?.cliente && !rfcTrafico) {
        console.log('ðŸ” Intentando obtener RFC del cliente desde la base de datos...');
        // AquÃ­ podrÃ­as implementar lÃ³gica para buscar el RFC basado en el nombre del cliente
        // Por ahora, lo dejamos como estÃ¡
      }

      // Guardar los cambios si se realizaron
      if (cambiosRealizados) {
        parsed.trafico = trafico;
        localStorage.setItem('erp_shared_data', JSON.stringify(parsed));
      }
    });
  };

  // FunciÃ³n especÃ­fica para agregar RFC manualmente
  window.agregarRFCManual = function () {
    const rfc = prompt('Ingresa el RFC del cliente:');
    if (rfc && rfc.trim()) {
      const raw = localStorage.getItem('erp_shared_data');
      const parsed = raw ? JSON.parse(raw) : {};
      const trafico = parsed.trafico || {};
      const registros = Object.keys(trafico);

      if (registros.length > 0) {
        const primerRegistro = registros[0];
        const datosTrafico = trafico[primerRegistro];

        datosTrafico.rfcCliente = rfc.trim();

        parsed.trafico = trafico;
        localStorage.setItem('erp_shared_data', JSON.stringify(parsed));

        console.log(`âœ… RFC del cliente agregado manualmente: ${rfc.trim()}`);
        alert(`âœ… RFC del cliente agregado: ${rfc.trim()}`);
      } else {
        alert('âŒ No hay registros de TrÃ¡fico para modificar');
      }
    }
  };
})();
