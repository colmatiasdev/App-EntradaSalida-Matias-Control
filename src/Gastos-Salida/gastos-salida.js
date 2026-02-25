/**
 * =============================================================================
 * MÓDULO GASTOS DE SALIDA — LÓGICA COMPLETA
 * =============================================================================
 *
 * OBJETIVO
 * --------
 * Permitir cargar operaciones (gastos de salida) en la tabla OPERACIONES-GENERALES.
 * CORRESPONDE-A = nombre del responsable (#gastos-salida-nombre-apellido, ej. SILVINA).
 * TIPO-OPERACION = valor del combo. DESCRIPCION = texto del campo descripción. IMPORTE = número.
 *
 * DEPENDENCIAS (cargadas en gastos-salida.html antes de este script)
 * ------------
 * - config.js     → APP_CONFIG.APP_SCRIPT_URL, APP_CONFIG.CORS_PROXY
 * - tables.js     → APP_TABLES (opcional; el backend usa sus propias definiciones)
 * - negocio.js    → APP_NEGOCIO.getFechaOperativa(), APP_NEGOCIO.getNombreHojaMes()
 *
 * ELEMENTOS DEL DOM (IDs)
 * -----------------------
 * - gastos-salida-nombre-apellido  : <strong> responsable → CORRESPONDE-A (ej. SILVINA)
 * - gastos-salida-tipo-operacion   : <select> → TIPO-OPERACION (COMPONENTE-COMBO)
 * - gastos-salida-descripcion      : <input text> → DESCRIPCION
 * - gastos-salida-importe          : <input number> → IMPORTE
 * - gastos-salida-form             : <form> envío con submit → guardar()
 * - gastos-salida-btn-guardar      : <button type="submit"> Guardar
 * - gastos-salida-guardar-msg      : <p> mensaje de éxito/error del guardado
 *
 * FLUJO AL CARGAR LA PÁGINA
 * -------------------------
 * 1. init() se ejecuta (al DOMContentLoaded o de inmediato).
 * 2. cargarComboTipoOperacion():
 *    - Hace POST a APP_SCRIPT_URL con accion: 'componenteComboLeer'.
 *    - Backend (Code.gs): lee la hoja COMPONENTE-COMBO del Sheet y devuelve
 *      { ok: true, datos: [ { 'COMBO-SUCURSAL-COMERCIO', 'TIPO-OPERACION', ... }, ... ] }.
 *    - Se extraen valores únicos de la columna TIPO-OPERACION, se ordenan y se
 *      rellenan las <option> del select (primera opción: "Seleccionar tipo de operación").
 * 3. Se registra el listener del formulario: submit → preventDefault() + guardar().
 *
 * FLUJO AL GUARDAR (botón Guardar / submit del form)
 * --------------------------------------------------
 * 1. guardar() valida:
 *    - APP_SCRIPT_URL definido.
 *    - APP_NEGOCIO.getFechaOperativa y getNombreHojaMes disponibles.
 *    - Tipo de operación seleccionado (obligatorio).
 * 2. Lee del DOM:
 *    - correspondeA   = #gastos-salida-nombre-apellido (getNombreApellido()); default 'SILVINA'.
 *    - tipoOperacion   = combo (getCategoria()).
 *    - descripcion     = input descripción (getDescripcion()).
 *    - importe        = input importe (getImporte()); si vacío → 0.
 * 3. fechaOperativa = NEGOCIO.getFechaOperativa(), hora = HH:MM, idOperacionGral = 'OG-' + Date.now().
 * 4. Payload: accion 'operacionesGralAlta', idOperacionGral, fechaOperativa, hora, correspondeA, tipoOperacion, descripcion, importe.
 * 5. POST → Backend operacionesGralAlta() escribe una fila en la hoja OPERACIONES-GENERALES.
 * 6. Si ok: mensaje "Operación guardada en OPERACIONES-GENERALES.", se vacían descripción e importe.
 *
 * HOJAS DEL SHEET
 * ---------------
 * - COMPONENTE-COMBO: valores para el combo TIPO-OPERACION.
 * - OPERACIONES-GENERALES: ID-OPERACION-GRAL, FECHA_OPERATIVA, HORA, CORRESPONDE-A, TIPO-OPERACION, DESCRIPCION, IMPORTE.
 *
 * API: componenteComboLeer, operacionesGralAlta.
 * EXPUESTO: getCategoria(), getDescripcion(), getImporte(), getNombreApellido(), getCantidad(), CANTIDAD.
 * =============================================================================
 */
(function () {
  'use strict';

  var APP_SCRIPT_URL = window.APP_CONFIG && window.APP_CONFIG.APP_SCRIPT_URL;
  var CORS_PROXY = window.APP_CONFIG && window.APP_CONFIG.CORS_PROXY;

  /** Columna de la tabla COMPONENTE-COMBO que alimenta este combo. */
  var COLUMNA_COMBO_TIPO_OPERACION = 'TIPO-OPERACION';

  /** CANTIDAD por defecto en este módulo (para guardarVenta). */
  var CANTIDAD_DEFAULT = 1;

  /**
   * Devuelve el valor seleccionado en el combo "Tipo de operación".
   * Ese valor debe asignarse a CATEGORIA en el payload al llamar guardarVenta.
   * @returns {string} CATEGORIA para la venta (ej. DEVOLUCION, EMPLEADOS, PAGOS, REPARACIONES, VENTA).
   */
  function getCategoria() {
    var select = document.getElementById('gastos-salida-tipo-operacion');
    if (!select) return '';
    var v = (select.value !== undefined && select.value !== null) ? String(select.value).trim() : '';
    return v;
  }

  function getDescripcion() {
    var input = document.getElementById('gastos-salida-descripcion');
    if (!input) return '';
    return (input.value !== undefined && input.value !== null) ? String(input.value).trim() : '';
  }

  function getImporte() {
    var input = document.getElementById('gastos-salida-importe');
    if (!input || input.value === '' || input.value === null) return '';
    var n = parseFloat(String(input.value).replace(',', '.'), 10);
    return isNaN(n) ? '' : n;
  }

  function getNombreApellido() {
    var el = document.getElementById('gastos-salida-nombre-apellido');
    if (!el) return 'SILVINA';
    var t = (el.textContent || '').trim();
    return t || 'SILVINA';
  }

  function getBtnGuardar() { return document.getElementById('gastos-salida-btn-guardar'); }
  function getMsgGuardar() { return document.getElementById('gastos-salida-guardar-msg'); }

  function mostrarMensajeGuardar(texto, esError) {
    var msg = getMsgGuardar();
    if (!msg) return;
    msg.textContent = texto;
    msg.hidden = !texto;
    msg.className = 'gastos-salida__guardar-msg ' + (esError ? 'err' : 'ok');
  }

  /** Oculta la leyenda de guardado al interactuar con los campos (mejor UX). */
  function ocultarMensajeGuardar() {
    mostrarMensajeGuardar('', false);
  }

  function guardar() {
    if (!APP_SCRIPT_URL) {
      mostrarMensajeGuardar('Configura APP_SCRIPT_URL en config.js', true);
      return;
    }
    var NEGOCIO = window.APP_NEGOCIO;
    if (!NEGOCIO || !NEGOCIO.getFechaOperativa) {
      mostrarMensajeGuardar('Falta cargar negocio.js (tables.js y negocio.js)', true);
      return;
    }
    var tipoOperacion = getCategoria();
    if (!tipoOperacion) {
      mostrarMensajeGuardar('Seleccioná un tipo de operación.', true);
      return;
    }
    var descripcion = getDescripcion();
    var importeNum = getImporte();
    if (importeNum === '') importeNum = 0;
    else importeNum = Number(importeNum);

    var fechaOp = NEGOCIO.getFechaOperativa();
    var ahora = new Date();
    var hora = ahora.getHours() + ':' + (ahora.getMinutes() < 10 ? '0' : '') + ahora.getMinutes();
    var idOperacionGral = 'OG-' + Date.now();
    var correspondeA = getNombreApellido();

    var payload = {
      accion: 'operacionesGralAlta',
      idOperacionGral: idOperacionGral,
      fechaOperativa: fechaOp,
      hora: hora,
      correspondeA: correspondeA,
      tipoOperacion: tipoOperacion,
      descripcion: descripcion,
      importe: importeNum
    };

    var btnGuardar = getBtnGuardar();
    var msgGuardar = getMsgGuardar();
    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.setAttribute('aria-busy', 'true');
    }
    mostrarMensajeGuardar('Guardando…', false);

    var bodyForm = 'data=' + encodeURIComponent(JSON.stringify(payload));
    var url = (CORS_PROXY && CORS_PROXY.length > 0)
      ? CORS_PROXY + encodeURIComponent(APP_SCRIPT_URL)
      : APP_SCRIPT_URL;

    fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyForm
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var ct = (res.headers.get('Content-Type') || '').toLowerCase();
        if (ct.indexOf('json') !== -1) return res.json();
        return res.text().then(function (t) {
          try { return JSON.parse(t); } catch (e) { return { ok: false, error: t }; };
        });
      })
      .then(function (data) {
        var ok = data && (data.ok === true || data.success === true);
        if (ok) {
          mostrarMensajeGuardar('Operación guardada en OPERACIONES-GENERALES.', false);
          var inpDesc = document.getElementById('gastos-salida-descripcion');
          var inpImp = document.getElementById('gastos-salida-importe');
          if (inpDesc) inpDesc.value = '';
          if (inpImp) inpImp.value = '';
        } else {
          mostrarMensajeGuardar((data && (data.error || data.mensaje)) || 'Error al guardar.', true);
        }
        if (btnGuardar) {
          btnGuardar.disabled = false;
          btnGuardar.removeAttribute('aria-busy');
        }
      })
      .catch(function (err) {
        var msg = err && err.message ? err.message : String(err);
        mostrarMensajeGuardar('Error: ' + msg, true);
        if (btnGuardar) {
          btnGuardar.disabled = false;
          btnGuardar.removeAttribute('aria-busy');
        }
      });
  }

  function cargarComboTipoOperacion() {
    var select = document.getElementById('gastos-salida-tipo-operacion');
    if (!select) return;
    if (!APP_SCRIPT_URL) {
      select.innerHTML = '<option value="">Configurar APP_SCRIPT_URL</option>';
      return;
    }
    // Backend lee hoja COMPONENTE-COMBO y devuelve filas con TIPO-OPERACION, etc.
    var payload = { accion: 'componenteComboLeer' };
    var body = 'data=' + encodeURIComponent(JSON.stringify(payload));
    var url = (CORS_PROXY && CORS_PROXY.length > 0)
      ? CORS_PROXY + encodeURIComponent(APP_SCRIPT_URL)
      : APP_SCRIPT_URL;
    fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var ct = (res.headers.get('Content-Type') || '').toLowerCase();
        if (ct.indexOf('json') !== -1) return res.json();
        return res.text().then(function (t) {
          try { return JSON.parse(t); } catch (e) { return { ok: false, datos: [] }; };
        });
      })
      .then(function (data) {
        select.innerHTML = '<option value="">Seleccionar tipo de operación</option>';
        if (data && data.ok && Array.isArray(data.datos)) {
          var valores = [];
          data.datos.forEach(function (fila) {
            var v = (fila[COLUMNA_COMBO_TIPO_OPERACION] !== undefined && fila[COLUMNA_COMBO_TIPO_OPERACION] !== null)
              ? String(fila[COLUMNA_COMBO_TIPO_OPERACION]).trim() : '';
            if (v && valores.indexOf(v) === -1) valores.push(v);
          });
          valores.sort();
          valores.forEach(function (v) {
            var opt = document.createElement('option');
            opt.value = v;
            opt.textContent = v;
            select.appendChild(opt);
          });
        }
      })
      .catch(function () {
        select.innerHTML = '<option value="">Error al cargar tipos</option>';
      });
  }

  function init() {
    cargarComboTipoOperacion();
    var form = document.getElementById('gastos-salida-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        guardar();
      });
    }
    // Ocultar leyenda de guardado al enfocar o escribir en los campos
    var idsCampos = ['gastos-salida-tipo-operacion', 'gastos-salida-descripcion', 'gastos-salida-importe'];
    var eventos = ['focus', 'input', 'change'];
    idsCampos.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        eventos.forEach(function (ev) {
          el.addEventListener(ev, ocultarMensajeGuardar);
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.GastosSalida = window.GastosSalida || {};
  window.GastosSalida.getCategoria = getCategoria;
  window.GastosSalida.getCantidad = function () { return CANTIDAD_DEFAULT; };
  window.GastosSalida.CANTIDAD = CANTIDAD_DEFAULT;
  window.GastosSalida.getDescripcion = getDescripcion;
  window.GastosSalida.getImporte = getImporte;
  window.GastosSalida.getNombreApellido = getNombreApellido;
})();
