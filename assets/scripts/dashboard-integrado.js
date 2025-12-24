// Dashboard Integrado - Facturación, Logística y Tráfico
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar dashboard
  initializeDashboard();

  // Cargar datos
  loadDashboardData();

  // Configurar gráficos
  setupCharts();

  // Cargar tabla integrada
  loadIntegratedTable();
});

// Inicializar dashboard
function initializeDashboard() {
  console.log('Dashboard Integrado inicializado');
}

// Cargar datos del dashboard
function loadDashboardData() {
  const summary = window.ERPIntegration.getIntegratedSummary();

  // Actualizar KPIs de Logística
  document.getElementById('totalRegistros').textContent = summary.registros.total;
  document.getElementById('registrosCompletados').textContent = summary.registros.completados;
  document.getElementById('registrosEnProceso').textContent = summary.registros.enProceso;
  document.getElementById('registrosPendientes').textContent = summary.registros.pendientes;

  // Actualizar KPIs de Facturación
  document.getElementById('facturasPendientes').textContent = summary.facturacion.pendientes;
  document.getElementById('facturasPagadas').textContent = summary.facturacion.pagadas;
  document.getElementById('montoPendiente').textContent = formatCurrency(
    summary.facturacion.montoPendiente
  );
  document.getElementById('tasaCobranza').textContent = `${summary.facturacion.tasaCobranza}%`;

  // Actualizar KPIs de Tráfico
  document.getElementById('enviosEnTransito').textContent = summary.envios.enTransito;
  document.getElementById('enviosEntregados').textContent = summary.envios.entregados;
  document.getElementById('tasaEntrega').textContent = `${summary.envios.tasaEntrega}%`;

  // Actualizar resumen general
  updateGeneralSummary(summary);
}

// Actualizar resumen general
function updateGeneralSummary(summary) {
  const resumenGeneral = document.getElementById('resumenGeneral');
  resumenGeneral.innerHTML = `
        <div class="col-md-3">
            <div class="text-center">
                <h3 class="text-primary">${summary.registros.total}</h3>
                <p class="text-muted mb-0">Total de Registros</p>
            </div>
        </div>
        <div class="col-md-3">
            <div class="text-center">
                <h3 class="text-success">${summary.facturacion.pagadas}</h3>
                <p class="text-muted mb-0">Facturas Pagadas</p>
            </div>
        </div>
        <div class="col-md-3">
            <div class="text-center">
                <h3 class="text-warning">${summary.envios.enTransito}</h3>
                <p class="text-muted mb-0">Envíos en Tránsito</p>
            </div>
        </div>
        <div class="col-md-3">
            <div class="text-center">
                <h3 class="text-info">${summary.facturacion.tasaCobranza}%</h3>
                <p class="text-muted mb-0">Eficiencia General</p>
            </div>
        </div>
    `;
}

// Configurar gráficos
function setupCharts() {
  setupEstadoRegistrosChart();
  setupServiciosChart();
}

// Gráfico de estado de registros
function setupEstadoRegistrosChart() {
  const ctx = document.getElementById('estadoRegistrosChart').getContext('2d');
  const summary = window.ERPIntegration.getIntegratedSummary();

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Completados', 'En Proceso', 'Pendientes'],
      datasets: [
        {
          data: [
            summary.registros.completados,
            summary.registros.enProceso,
            summary.registros.pendientes
          ],
          backgroundColor: ['#28a745', '#ffc107', '#17a2b8'],
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// Gráfico de distribución de servicios
function setupServiciosChart() {
  const ctx = document.getElementById('serviciosChart').getContext('2d');
  const { registros } = window.ERPIntegration.sharedData;

  // Contar servicios
  const servicios = {};
  registros.forEach((registro, _index) => {
    servicios[registro.tipoServicio] = (servicios[registro.tipoServicio] || 0) + 1;
  });

  const labels = Object.keys(servicios);
  const data = Object.values(servicios);

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1'],
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// Cargar tabla integrada
function loadIntegratedTable() {
  const tbody = document.getElementById('tbodyIntegrada');
  tbody.innerHTML = '';

  const { registros } = window.ERPIntegration.sharedData;

  registros.forEach((registro, _index) => {
    const factura = window.ERPIntegration.sharedData.facturas.find(
      f => f.registroId === registro.id
    );
    const envio = window.ERPIntegration.sharedData.envios.find(e => e.registroId === registro.id);
    const trafico = window.ERPIntegration.sharedData.trafico.find(
      t => t.registroId === registro.id
    );

    const row = document.createElement('tr');

    // Determinar clase de estado
    let estadoClass = '';
    let estadoText = '';
    switch (registro.estado) {
      case 'completado':
        estadoClass = 'badge bg-success';
        estadoText = 'Completado';
        break;
      case 'en_proceso':
        estadoClass = 'badge bg-warning';
        estadoText = 'En Proceso';
        break;
      case 'pendiente':
        estadoClass = 'badge bg-info';
        estadoText = 'Pendiente';
        break;
    }

    row.innerHTML = `
            <td><strong>${registro.id}</strong></td>
            <td>${registro.cliente}</td>
            <td>${registro.tipoServicio}</td>
            <td>${registro.origen} → ${registro.destino}</td>
            <td><strong>${formatCurrency(registro.monto)}</strong></td>
            <td><span class="${estadoClass}">${estadoText}</span></td>
            <td>
                ${
  factura
    ? `
                    <span class="badge ${factura.estado === 'pagado' ? 'bg-success' : 'bg-warning'}">
                        ${factura.numeroFactura}
                    </span>
                `
    : '<span class="text-muted">-</span>'
}
            </td>
            <td>
                ${
  envio
    ? `
                    <span class="badge ${envio.estado === 'completado' ? 'bg-success' : envio.estado === 'en_proceso' ? 'bg-warning' : 'bg-info'}">
                        ${envio.estado === 'completado' ? 'Entregado' : envio.estado === 'en_proceso' ? 'En Tránsito' : 'Pendiente'}
                    </span>
                `
    : '<span class="text-muted">-</span>'
}
            </td>
            <td>
                ${
  trafico
    ? `
                    <span class="badge ${trafico.estado === 'completado' ? 'bg-success' : trafico.estado === 'en_proceso' ? 'bg-warning' : 'bg-info'}">
                        ${trafico.economico}
                    </span>
                `
    : '<span class="text-muted">-</span>'
}
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="verDetallesCompletos('${registro.id}')" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="verTimeline('${registro.id}')" title="Ver timeline">
                        <i class="fas fa-history"></i>
                    </button>
                </div>
            </td>
        `;

    tbody.appendChild(row);
  });
}

// Aplicar filtros
function _aplicarFiltros() {
  const filtroCliente = document.getElementById('filtroCliente').value;
  const filtroEstado = document.getElementById('filtroEstado').value;
  const filtroTipoServicio = document.getElementById('filtroTipoServicio').value;
  const fechaDesde = document.getElementById('fechaDesde').value;
  const fechaHasta = document.getElementById('fechaHasta').value;

  const criteria = {
    cliente: filtroCliente,
    estado: filtroEstado,
    tipoServicio: filtroTipoServicio,
    fechaDesde: fechaDesde,
    fechaHasta: fechaHasta
  };

  const resultados = window.ERPIntegration.searchData(criteria);
  loadFilteredTable(resultados);
}

// Cargar tabla filtrada
function loadFilteredTable(datos) {
  const tbody = document.getElementById('tbodyIntegrada');
  tbody.innerHTML = '';

  datos.forEach(data => {
    const { registro } = data;
    const { factura } = data;
    const { envio } = data;
    const { trafico } = data;

    const row = document.createElement('tr');

    // Determinar clase de estado
    let estadoClass = '';
    let estadoText = '';
    switch (registro.estado) {
      case 'completado':
        estadoClass = 'badge bg-success';
        estadoText = 'Completado';
        break;
      case 'en_proceso':
        estadoClass = 'badge bg-warning';
        estadoText = 'En Proceso';
        break;
      case 'pendiente':
        estadoClass = 'badge bg-info';
        estadoText = 'Pendiente';
        break;
    }

    row.innerHTML = `
            <td><strong>${registro.id}</strong></td>
            <td>${registro.cliente}</td>
            <td>${registro.tipoServicio}</td>
            <td>${registro.origen} → ${registro.destino}</td>
            <td><strong>${formatCurrency(registro.monto)}</strong></td>
            <td><span class="${estadoClass}">${estadoText}</span></td>
            <td>
                ${
  factura
    ? `
                    <span class="badge ${factura.estado === 'pagado' ? 'bg-success' : 'bg-warning'}">
                        ${factura.numeroFactura}
                    </span>
                `
    : '<span class="text-muted">-</span>'
}
            </td>
            <td>
                ${
  envio
    ? `
                    <span class="badge ${envio.estado === 'completado' ? 'bg-success' : envio.estado === 'en_proceso' ? 'bg-warning' : 'bg-info'}">
                        ${envio.estado === 'completado' ? 'Entregado' : envio.estado === 'en_proceso' ? 'En Tránsito' : 'Pendiente'}
                    </span>
                `
    : '<span class="text-muted">-</span>'
}
            </td>
            <td>
                ${
  trafico
    ? `
                    <span class="badge ${trafico.estado === 'completado' ? 'bg-success' : trafico.estado === 'en_proceso' ? 'bg-warning' : 'bg-info'}">
                        ${trafico.economico}
                    </span>
                `
    : '<span class="text-muted">-</span>'
}
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="verDetallesCompletos('${registro.id}')" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="verTimeline('${registro.id}')" title="Ver timeline">
                        <i class="fas fa-history"></i>
                    </button>
                </div>
            </td>
        `;

    tbody.appendChild(row);
  });
}

// Ver detalles completos
function _verDetallesCompletos(registroId) {
  const data = window.ERPIntegration.getDataByRegistroId(registroId);

  const content = document.getElementById('detallesCompletosContent');
  content.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6><i class="fas fa-truck"></i> Información de Logística</h6>
                <table class="table table-sm">
                    <tr><td><strong>Registro:</strong></td><td>${data.registro.id}</td></tr>
                    <tr><td><strong>Cliente:</strong></td><td>${data.registro.cliente}</td></tr>
                    <tr><td><strong>Origen:</strong></td><td>${data.registro.origen}</td></tr>
                    <tr><td><strong>Destino:</strong></td><td>${data.registro.destino}</td></tr>
                    <tr><td><strong>Tipo de Servicio:</strong></td><td>${data.registro.tipoServicio}</td></tr>
                    <tr><td><strong>Fecha Creación:</strong></td><td>${formatDate(data.registro.fechaCreacion)}</td></tr>
                    <tr><td><strong>Estado:</strong></td><td><span class="badge ${data.registro.estado === 'completado' ? 'bg-success' : data.registro.estado === 'en_proceso' ? 'bg-warning' : 'bg-info'}">${data.registro.estado === 'completado' ? 'Completado' : data.registro.estado === 'en_proceso' ? 'En Proceso' : 'Pendiente'}</span></td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6><i class="fas fa-file-invoice"></i> Información de Facturación</h6>
                ${
  data.factura
    ? `
                    <table class="table table-sm">
                        <tr><td><strong>Factura:</strong></td><td>${data.factura.numeroFactura}</td></tr>
                        <tr><td><strong>Monto:</strong></td><td><strong>${formatCurrency(data.factura.monto)}</strong></td></tr>
                        <tr><td><strong>Fecha Emisión:</strong></td><td>${formatDate(data.factura.fechaEmision)}</td></tr>
                        <tr><td><strong>Fecha Vencimiento:</strong></td><td>${formatDate(data.factura.fechaVencimiento)}</td></tr>
                        <tr><td><strong>Estado:</strong></td><td><span class="badge ${data.factura.estado === 'pagado' ? 'bg-success' : 'bg-warning'}">${data.factura.estado === 'pagado' ? 'Pagado' : 'Pendiente'}</span></td></tr>
                        <tr><td><strong>Días Vencidos:</strong></td><td>${data.factura.diasVencidos}</td></tr>
                    </table>
                `
    : '<p class="text-muted">No hay información de facturación</p>'
}
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-md-6">
                <h6><i class="fas fa-shipping-fast"></i> Información de Envío</h6>
                ${
  data.envio
    ? `
                    <table class="table table-sm">
                        <tr><td><strong>Fecha Envío:</strong></td><td>${formatDate(data.envio.fechaEnvio)}</td></tr>
                        <tr><td><strong>Fecha Entrega:</strong></td><td>${formatDate(data.envio.fechaEntrega)}</td></tr>
                        <tr><td><strong>Estado:</strong></td><td><span class="badge ${data.envio.estado === 'completado' ? 'bg-success' : data.envio.estado === 'en_proceso' ? 'bg-warning' : 'bg-info'}">${data.envio.estado === 'completado' ? 'Entregado' : data.envio.estado === 'en_proceso' ? 'En Tránsito' : 'Pendiente'}</span></td></tr>
                        <tr><td><strong>Operador Principal:</strong></td><td>${data.envio.operadorPrincipal}</td></tr>
                        <tr><td><strong>Operador Secundario:</strong></td><td>${data.envio.operadorSecundario}</td></tr>
                    </table>
                `
    : '<p class="text-muted">No hay información de envío</p>'
}
            </div>
            <div class="col-md-6">
                <h6><i class="fas fa-route"></i> Información de Tráfico</h6>
                ${
  data.trafico
    ? `
                    <table class="table table-sm">
                        <tr><td><strong>Fecha Salida:</strong></td><td>${formatDate(data.trafico.fechaSalida)}</td></tr>
                        <tr><td><strong>Fecha Llegada:</strong></td><td>${formatDate(data.trafico.fechaLlegada)}</td></tr>
                        <tr><td><strong>Económico:</strong></td><td>${data.trafico.economico}</td></tr>
                        <tr><td><strong>Placas:</strong></td><td>${data.trafico.placas}</td></tr>
                        <tr><td><strong>Operador Principal:</strong></td><td>${data.trafico.operadorPrincipal}</td></tr>
                        <tr><td><strong>Operador Secundario:</strong></td><td>${data.trafico.operadorSecundario}</td></tr>
                    </table>
                `
    : '<p class="text-muted">No hay información de tráfico</p>'
}
            </div>
        </div>
        
        ${
  data.registro.observaciones
    ? `
        <div class="row mt-3">
            <div class="col-12">
                <h6><i class="fas fa-sticky-note"></i> Observaciones</h6>
                <p>${data.registro.observaciones}</p>
            </div>
        </div>
        `
    : ''
}
    `;

  const modal = new bootstrap.Modal(document.getElementById('modalDetallesCompletos'));
  modal.show();
}

// Ver timeline
function _verTimeline(registroId) {
  const timeline = window.ERPIntegration.getTimeline(registroId);

  let timelineHTML = '<div class="timeline">';
  timeline.forEach((evento, _index) => {
    timelineHTML += `
            <div class="timeline-item">
                <div class="timeline-marker bg-${evento.color}">
                    <i class="${evento.icono}"></i>
                </div>
                <div class="timeline-content">
                    <h6>${evento.evento}</h6>
                    <p class="text-muted">${evento.descripcion}</p>
                    <small class="text-muted">${formatDateTime(evento.fecha)}</small>
                </div>
            </div>
        `;
  });
  timelineHTML += '</div>';

  // Crear modal temporal para timeline
  const timelineModal = document.createElement('div');
  timelineModal.className = 'modal fade';
  timelineModal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-history"></i>
                        Timeline del Registro ${registroId}
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    ${timelineHTML}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(timelineModal);
  const modal = new bootstrap.Modal(timelineModal);
  modal.show();

  // Limpiar modal después de cerrar
  timelineModal.addEventListener('hidden.bs.modal', () => {
    document.body.removeChild(timelineModal);
  });
}

// Imprimir detalles
function _imprimirDetalles() {
  const content = document.getElementById('detallesCompletosContent').innerHTML;
  const ventanaImpresion = window.open('', '_blank');
  ventanaImpresion.document.write(`
        <html>
        <head>
            <title>Detalles del Registro</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .table th { background-color: #f2f2f2; }
                .badge { padding: 4px 8px; border-radius: 4px; color: white; }
                .bg-success { background-color: #28a745; }
                .bg-warning { background-color: #ffc107; color: #000; }
                .bg-info { background-color: #17a2b8; }
            </style>
        </head>
        <body>
            <h1>Detalles del Registro</h1>
            ${content}
        </body>
        </html>
    `);
  ventanaImpresion.document.close();
  ventanaImpresion.print();
}
