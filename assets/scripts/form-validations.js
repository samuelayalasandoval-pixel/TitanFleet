/**
 * Módulo de Validaciones Mejoradas para Formularios - TitanFleet ERP
 *
 * Proporciona validaciones estrictas y reutilizables para todos los formularios
 */

(function () {
  'use strict';

  const FormValidations = {
    /**
     * Validar número de registro
     * Formato: 25XXXXX (7 caracteres, empieza con año)
     */
    validarNumeroRegistro(numero) {
      if (!numero || typeof numero !== 'string') {
        return {
          valido: false,
          mensaje: 'El número de registro es requerido'
        };
      }

      const trimmed = numero.trim();
      const year = new Date().getFullYear().toString().slice(-2);

      if (trimmed.length !== 7) {
        return {
          valido: false,
          mensaje: 'El número de registro debe tener 7 caracteres'
        };
      }

      if (!trimmed.startsWith(year)) {
        return {
          valido: false,
          mensaje: `El número de registro debe empezar con ${year} (año actual)`
        };
      }

      if (!/^\d{7}$/.test(trimmed)) {
        return {
          valido: false,
          mensaje: 'El número de registro debe contener solo dígitos'
        };
      }

      return {
        valido: true,
        mensaje: ''
      };
    },

    /**
     * Validar RFC
     * Formato: 12-13 caracteres alfanuméricos
     */
    validarRFC(rfc) {
      if (!rfc || typeof rfc !== 'string') {
        return {
          valido: false,
          mensaje: 'El RFC es requerido'
        };
      }

      const trimmed = rfc.trim().toUpperCase();

      // RFC persona física: 13 caracteres
      // RFC persona moral: 12 caracteres
      if (trimmed.length < 12 || trimmed.length > 13) {
        return {
          valido: false,
          mensaje: 'El RFC debe tener entre 12 y 13 caracteres'
        };
      }

      // Formato: 3-4 letras, 6 dígitos, 3 caracteres alfanuméricos
      if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(trimmed)) {
        return {
          valido: false,
          mensaje: 'El formato del RFC no es válido'
        };
      }

      return {
        valido: true,
        mensaje: ''
      };
    },

    /**
     * Validar email
     */
    validarEmail(email) {
      if (!email || typeof email !== 'string') {
        return {
          valido: false,
          mensaje: 'El email es requerido'
        };
      }

      const trimmed = email.trim();
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!regex.test(trimmed)) {
        return {
          valido: false,
          mensaje: 'El formato del email no es válido'
        };
      }

      return {
        valido: true,
        mensaje: ''
      };
    },

    /**
     * Validar monto (no negativo)
     */
    validarMonto(monto) {
      if (monto === null || monto === undefined || monto === '') {
        return {
          valido: false,
          mensaje: 'El monto es requerido'
        };
      }

      const num = parseFloat(monto);

      if (isNaN(num)) {
        return {
          valido: false,
          mensaje: 'El monto debe ser un número válido'
        };
      }

      if (num < 0) {
        return {
          valido: false,
          mensaje: 'El monto no puede ser negativo'
        };
      }

      return {
        valido: true,
        mensaje: ''
      };
    },

    /**
     * Validar teléfono
     */
    validarTelefono(telefono) {
      if (!telefono || typeof telefono !== 'string') {
        return {
          valido: false,
          mensaje: 'El teléfono es requerido'
        };
      }

      const trimmed = telefono.trim();

      // Permitir números con o sin guiones, espacios, paréntesis
      const cleaned = trimmed.replace(/[\s\-()]/g, '');

      if (cleaned.length < 10 || cleaned.length > 15) {
        return {
          valido: false,
          mensaje: 'El teléfono debe tener entre 10 y 15 dígitos'
        };
      }

      if (!/^\d+$/.test(cleaned)) {
        return {
          valido: false,
          mensaje: 'El teléfono debe contener solo números'
        };
      }

      return {
        valido: true,
        mensaje: ''
      };
    },

    /**
     * Validar campo requerido
     */
    validarRequerido(valor, nombreCampo = 'Este campo') {
      if (valor === null || valor === undefined || valor === '') {
        return {
          valido: false,
          mensaje: `${nombreCampo} es requerido`
        };
      }

      if (typeof valor === 'string' && valor.trim() === '') {
        return {
          valido: false,
          mensaje: `${nombreCampo} no puede estar vacío`
        };
      }

      return {
        valido: true,
        mensaje: ''
      };
    },

    /**
     * Validar fecha
     */
    validarFecha(fecha) {
      if (!fecha || typeof fecha !== 'string') {
        return {
          valido: false,
          mensaje: 'La fecha es requerida'
        };
      }

      const date = new Date(fecha);

      if (isNaN(date.getTime())) {
        return {
          valido: false,
          mensaje: 'La fecha no es válida'
        };
      }

      return {
        valido: true,
        mensaje: ''
      };
    },

    /**
     * Validar fecha futura
     */
    validarFechaFutura(fecha) {
      const validacion = this.validarFecha(fecha);
      if (!validacion.valido) {
        return validacion;
      }

      const date = new Date(fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (date <= hoy) {
        return {
          valido: false,
          mensaje: 'La fecha debe ser futura'
        };
      }

      return {
        valido: true,
        mensaje: ''
      };
    },

    /**
     * Validar fecha pasada
     */
    validarFechaPasada(fecha) {
      const validacion = this.validarFecha(fecha);
      if (!validacion.valido) {
        return validacion;
      }

      const date = new Date(fecha);
      const hoy = new Date();
      hoy.setHours(23, 59, 59, 999);

      if (date > hoy) {
        return {
          valido: false,
          mensaje: 'La fecha debe ser pasada o actual'
        };
      }

      return {
        valido: true,
        mensaje: ''
      };
    },

    /**
     * Validar longitud mínima
     */
    validarLongitudMinima(valor, longitudMinima, nombreCampo = 'Este campo') {
      if (!valor || typeof valor !== 'string') {
        return {
          valido: false,
          mensaje: `${nombreCampo} es requerido`
        };
      }

      if (valor.trim().length < longitudMinima) {
        return {
          valido: false,
          mensaje: `${nombreCampo} debe tener al menos ${longitudMinima} caracteres`
        };
      }

      return {
        valido: true,
        mensaje: ''
      };
    },

    /**
     * Validar longitud máxima
     */
    validarLongitudMaxima(valor, longitudMaxima, nombreCampo = 'Este campo') {
      if (!valor || typeof valor !== 'string') {
        return {
          valido: true, // Si está vacío, la validación de requerido lo manejará
          mensaje: ''
        };
      }

      if (valor.length > longitudMaxima) {
        return {
          valido: false,
          mensaje: `${nombreCampo} no puede tener más de ${longitudMaxima} caracteres`
        };
      }

      return {
        valido: true,
        mensaje: ''
      };
    },

    /**
     * Aplicar validación a un campo del formulario
     */
    aplicarValidacion(input, tipoValidacion, opciones = {}) {
      const valor = input.value;
      let resultado;

      switch (tipoValidacion) {
        case 'numeroRegistro':
          resultado = this.validarNumeroRegistro(valor);
          break;
        case 'rfc':
          resultado = this.validarRFC(valor);
          break;
        case 'email':
          resultado = this.validarEmail(valor);
          break;
        case 'monto':
          resultado = this.validarMonto(valor);
          break;
        case 'telefono':
          resultado = this.validarTelefono(valor);
          break;
        case 'requerido':
          resultado = this.validarRequerido(valor, opciones.nombreCampo);
          break;
        case 'fecha':
          resultado = this.validarFecha(valor);
          break;
        case 'fechaFutura':
          resultado = this.validarFechaFutura(valor);
          break;
        case 'fechaPasada':
          resultado = this.validarFechaPasada(valor);
          break;
        case 'longitudMinima':
          resultado = this.validarLongitudMinima(valor, opciones.longitud, opciones.nombreCampo);
          break;
        case 'longitudMaxima':
          resultado = this.validarLongitudMaxima(valor, opciones.longitud, opciones.nombreCampo);
          break;
        default:
          resultado = { valido: true, mensaje: '' };
      }

      // Aplicar clases de Bootstrap
      input.classList.remove('is-valid', 'is-invalid');

      if (resultado.valido) {
        input.classList.add('is-valid');
      } else {
        input.classList.add('is-invalid');
      }

      // Mostrar mensaje de error
      let feedback = input.parentElement.querySelector('.invalid-feedback');
      if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        input.parentElement.appendChild(feedback);
      }

      if (!resultado.valido) {
        feedback.textContent = resultado.mensaje;
        feedback.style.display = 'block';
      } else {
        feedback.style.display = 'none';
      }

      return resultado;
    },

    /**
     * Validar formulario completo
     */
    validarFormulario(form, reglas = {}) {
      const errores = [];
      const campos = form.querySelectorAll('input, select, textarea');

      campos.forEach(campo => {
        const campoId = campo.id;
        const regla = reglas[campoId];

        if (regla) {
          const resultado = this.aplicarValidacion(campo, regla.tipo, regla.opciones || {});

          if (!resultado.valido) {
            errores.push({
              campo: campoId,
              mensaje: resultado.mensaje
            });
          }
        } else if (campo.hasAttribute('required')) {
          // Validación por defecto para campos requeridos
          const resultado = this.validarRequerido(
            campo.value,
            campo.labels?.[0]?.textContent || campoId
          );

          if (!resultado.valido) {
            errores.push({
              campo: campoId,
              mensaje: resultado.mensaje
            });
          }
        }
      });

      return {
        valido: errores.length === 0,
        errores: errores
      };
    }
  };

  // Exponer globalmente
  window.FormValidations = FormValidations;

  console.log('✅ Form Validations cargado');
})();
