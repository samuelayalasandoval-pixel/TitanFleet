// Cargar datos cuando se muestre la pestaña de Bancos
document.addEventListener('DOMContentLoaded', () => {
  const cuentasBancariasTab = document.getElementById('cuentas-bancarias-tab');
  if (cuentasBancariasTab) {
    cuentasBancariasTab.addEventListener('shown.bs.tab', () => {
      if (window.loadCuentasBancariasTable) {
        window.loadCuentasBancariasTable();
      }
    });
  }
});
