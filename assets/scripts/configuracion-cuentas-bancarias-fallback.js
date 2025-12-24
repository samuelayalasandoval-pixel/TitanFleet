// Script de respaldo para saveEditedCuentaBancaria
// Asegurar que la función esté disponible incluso si el script no se carga correctamente
if (typeof window.saveEditedCuentaBancaria === 'undefined') {
  window.saveEditedCuentaBancaria = async function () {
    try {
      const form = document.getElementById('editCuentaBancariaForm');
      if (!form) {
        alert('❌ Error: No se encontró el formulario de edición');
        return;
      }

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const numeroOriginal = document.getElementById('editCuentaBancariaNumeroOriginal')?.value;
      if (!numeroOriginal) {
        alert('❌ Error: No se encontró el número de cuenta original');
        return;
      }

      const cuentaBancaria = {
        numeroCuenta: numeroOriginal,
        banco: document.getElementById('editCuentaBancariaBanco')?.value || '',
        clabe: document.getElementById('editCuentaBancariaClabe')?.value || '',
        tipoCuenta: document.getElementById('editCuentaBancariaTipo')?.value || '',
        moneda: document.getElementById('editCuentaBancariaMoneda')?.value || '',
        saldoInicial:
          parseFloat(document.getElementById('editCuentaBancariaSaldoInicial')?.value || '0') || 0,
        observaciones: document.getElementById('editCuentaBancariaObservaciones')?.value || ''
      };

      if (!window.configuracionManager) {
        alert('❌ Error: ConfiguracionManager no está disponible. Por favor, recarga la página.');
        return;
      }

      const resultado = await window.configuracionManager.saveCuentaBancaria(cuentaBancaria);

      if (resultado) {
        alert('✅ Cuenta bancaria actualizada correctamente (sincronizado con Firebase)');
        const modalElement = document.getElementById('editCuentaBancariaModal');
        if (modalElement) {
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }
        }
        if (window.loadCuentasBancariasTable) {
          await window.loadCuentasBancariasTable();
        }
      } else {
        alert('❌ Error al actualizar cuenta bancaria');
      }
    } catch (error) {
      console.error('❌ Error en saveEditedCuentaBancaria:', error);
      alert(`❌ Error inesperado al guardar cuenta bancaria: ${error.message}`);
    }
  };
  console.log('⚠️ Usando función de respaldo para saveEditedCuentaBancaria');
}
