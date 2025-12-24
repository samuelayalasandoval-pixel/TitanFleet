// Verificación y fallback para saveEditedCuentaBancaria
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.saveEditedCuentaBancaria === 'undefined') {
    console.warn('⚠️ saveEditedCuentaBancaria no está definida, definiendo fallback...');
    window.saveEditedCuentaBancaria = async function () {
      alert(
        '⚠️ Error: La función saveEditedCuentaBancaria no se cargó correctamente. Por favor, recarga la página.'
      );
      console.error('saveEditedCuentaBancaria no está disponible');
    };
  } else {
    console.log('✅ saveEditedCuentaBancaria está disponible');
  }
});
