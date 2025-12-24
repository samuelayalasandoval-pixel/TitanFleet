/**
 * Módulo de Exportación Diesel
 * Maneja la exportación de datos de diesel a Excel
 */

(function () {
  'use strict';

  /**
   * Exporta los movimientos de diesel a Excel
   */
  window.exportarDieselExcel = async function () {
    let movimientos = [];

    // PRIORIDAD 1: Intentar cargar desde Firebase
    if (window.firebaseRepos && window.firebaseRepos.diesel) {
      try {
        let attempts = 0;
        while (
          attempts < 10 &&
          (!window.firebaseRepos.diesel.db || !window.firebaseRepos.diesel.tenantId)
        ) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
          await window.firebaseRepos.diesel.init();
        }

        if (window.firebaseRepos.diesel.db && window.firebaseRepos.diesel.tenantId) {
          const movimientosFirebase = await window.firebaseRepos.diesel.getAllMovimientos();
          if (movimientosFirebase && movimientosFirebase.length > 0) {
            console.log(`✅ ${movimientosFirebase.length} movimientos cargados desde Firebase`);
            movimientos = movimientosFirebase;
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando desde Firebase:', error);
      }
    }

    // PRIORIDAD 2: Cargar desde localStorage y combinar
    const raw = localStorage.getItem('erp_diesel_movimientos') || '[]';
    const movimientosLocal = JSON.parse(raw);

    if (Array.isArray(movimientosLocal) && movimientosLocal.length > 0) {
      console.log(`📋 ${movimientosLocal.length} movimientos en localStorage`);

      // Combinar evitando duplicados
      const idsExistentes = new Set(
        movimientos.map(m => m.id || m.movimientoId || String(m.fecha) + m.economico)
      );
      movimientosLocal.forEach(m => {
        const mId = m.id || m.movimientoId || String(m.fecha) + m.economico;
        if (!idsExistentes.has(mId)) {
          movimientos.push(m);
          idsExistentes.add(mId);
        }
      });
    }

    if (!Array.isArray(movimientos) || movimientos.length === 0) {
      alert('No hay movimientos de Diesel para exportar.');
      return;
    }

    console.log(`📊 Total de movimientos a exportar: ${movimientos.length}`);

    // Función para limpiar texto y corregir encoding
    const limpiarTexto = texto => {
      if (!texto) {
        return '';
      }
      let textoLimpio = String(texto);
      try {
        textoLimpio = textoLimpio
          .replace(/Ã¡/g, 'á')
          .replace(/Ã©/g, 'é')
          .replace(/Ã­/g, 'í')
          .replace(/Ã³/g, 'ó')
          .replace(/Ãº/g, 'ú')
          .replace(/Ã±/g, 'ñ')
          .replace(/Ã/g, 'Á')
          .replace(/Ã‰/g, 'É')
          .replace(/Ã/g, 'Í')
          .replace(/Ã"/g, 'Ó')
          .replace(/Ãš/g, 'Ú')
          .replace(/Ã'/g, 'Ñ');
      } catch (e) {
        console.warn('Error limpiando texto:', e);
      }
      return textoLimpio;
    };

    // Función para formatear fecha
    const formatearFecha = fecha => {
      if (!fecha) {
        return '';
      }

      if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        const [year, month, day] = fecha.split('-');
        const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        return date.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }

      try {
        const date = new Date(fecha);
        if (isNaN(date.getTime())) {
          return fecha;
        }
        return date.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      } catch (e) {
        return fecha;
      }
    };

    // Reorganizar columnas en el orden solicitado
    const rows = movimientos.map(m => {
      const movimientoId =
        m.id ||
        m.movimientoId ||
        String(m.fecha || m.fechaConsumo || m.fechaconsumo || '') + (m.economico || '');
      const comentarios = limpiarTexto(m.descripcionObservaciones || m.observaciones || '');

      return {
        ID: movimientoId,
        Fecha: formatearFecha(m.fecha || m.fechaConsumo || m.fechaconsumo || ''),
        'Estación de Servicio': limpiarTexto(m.estacionServicio || m.estacionservicio || ''),
        'Económico Tractocamion': limpiarTexto(m.economico || m.tractocamion || ''),
        Kilometraje: m.kilometraje || '',
        Placas: limpiarTexto(m.placas || m.Placas || ''),
        'Litros Consumidos': m.litros || m.litrosconsumidos || '',
        'Costo por Litro': m.costoPorLitro || m.costoporlitro || '',
        'Costo Total': m.costoTotal || m.costototal || '',
        'Forma de Pago': limpiarTexto(m.formaPago || m.formapago || ''),
        'Operador Principal': limpiarTexto(m.operadorPrincipal || m.operadorprincipal || ''),
        'Operador Secundario': limpiarTexto(m.operadorSecundario || m.operadorsecundario || ''),
        Comentarios: comentarios
      };
    });

    // Usar función base común
    try {
      await window.exportarDatosExcel({
        datos: rows,
        nombreArchivo: 'diesel',
        nombreHoja: 'Diesel',
        mensajeVacio: 'No hay movimientos de Diesel para exportar.'
      });

      console.log('✅ Excel exportado exitosamente');
    } catch (e) {
      console.error('Error exportando Excel:', e);
      // Fallback a CSV con encoding correcto
      const headers = Object.keys(rows[0] || {});
      const csv = `\ufeff${headers.join(',')}\n${rows
        .map(row =>
          headers
            .map(h => {
              const val = row[h] == null ? '' : String(row[h]).replace(/"/g, '""');
              return `"${val}"`;
            })
            .join(',')
        )
        .join('\n')}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const filename = `diesel_${new Date().toISOString().split('T')[0]}.csv`;
      link.download = filename.replace(/\.xlsx$/, '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  console.log('✅ Módulo diesel-export.js cargado');
})();
