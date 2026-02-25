/**
 * Otro tipo de ventas.
 * Tipo de operación fijo: VENTA. Formulario Producto/Precio, guardar en hoja del mes (guardarVenta). Prefijo idVenta: OTV-
 */
(function () {
  'use strict';

  var APP_SCRIPT_URL = window.APP_CONFIG && window.APP_CONFIG.APP_SCRIPT_URL;
  var CORS_PROXY = window.APP_CONFIG && window.APP_CONFIG.CORS_PROXY;
  var CANTIDAD_DEFAULT = 1;
  var PREFIJO_ID = 'OTV-';
  /** TIPO-LISTA-PRECIO fijo en este módulo. */
  var TIPO_LISTA_PRECIO = 'DISTRIBUIDOR';
  /** ID-PRODUCTO genérico para registros de este módulo (no hay producto del catálogo). */
  var ID_PRODUCTO_GENERICO = 'OTV-GEN';

  /** Tipo de operación fijo: OTRA-VENTA (label estático en el formulario). */
  function getCategoria() {
    var el = document.getElementById('otro-tipo-compras-tipo-operacion');
    if (!el) return 'OTRA-VENTA';
    var v = (el.textContent || el.innerText || '').trim();
    return v || 'OTRA-VENTA';
  }

  function getProducto() {
    var input = document.getElementById('otro-tipo-compras-producto');
    if (!input) return '';
    return (input.value !== undefined && input.value !== null) ? String(input.value).trim() : '';
  }

  function getPrecio() {
    var input = document.getElementById('otro-tipo-compras-precio');
    if (!input || input.value === '' || input.value === null) return '';
    var n = parseFloat(String(input.value).replace(',', '.'), 10);
    return isNaN(n) ? '' : n;
  }

  function getNombreApellido() {
    var el = document.getElementById('otro-tipo-compras-nombre-apellido');
    if (!el) return 'MATIAS';
    var t = (el.textContent || '').trim();
    return t || 'MATIAS';
  }

  function getBtnGuardar() { return document.getElementById('otro-tipo-compras-btn-guardar'); }
  function getMsgGuardar() { return document.getElementById('otro-tipo-compras-guardar-msg'); }

  function mostrarMensajeGuardar(texto, esError) {
    var msg = getMsgGuardar();
    if (!msg) return;
    msg.textContent = texto;
    msg.hidden = !texto;
    msg.className = 'otro-tipo-compras__guardar-msg ' + (esError ? 'err' : 'ok');
  }

  function guardar() {
    if (!APP_SCRIPT_URL) {
      mostrarMensajeGuardar('Configura APP_SCRIPT_URL en config.js', true);
      return;
    }
    var NEGOCIO = window.APP_NEGOCIO;
    if (!NEGOCIO || !NEGOCIO.getFechaOperativa || !NEGOCIO.getNombreHojaMes) {
      mostrarMensajeGuardar('Falta cargar negocio.js (tables.js y negocio.js)', true);
      return;
    }
    var categoria = getCategoria();
    if (!categoria) {
      mostrarMensajeGuardar('Tipo de operación no definido.', true);
      return;
    }
    var producto = getProducto();
    var precioNum = getPrecio();
    if (precioNum === '') precioNum = 0;
    else precioNum = Number(precioNum);
    var cantidad = CANTIDAD_DEFAULT;
    var monto = cantidad * precioNum;

    var fechaOp = NEGOCIO.getFechaOperativa();
    var nombreHoja = NEGOCIO.getNombreHojaMes(fechaOp);
    var ahora = new Date();
    var hora = ahora.getHours() + ':' + (ahora.getMinutes() < 10 ? '0' : '') + ahora.getMinutes();
    var idVenta = PREFIJO_ID + Date.now();
    var nombreApellido = getNombreApellido();

    var payload = {
      accion: 'guardarVenta',
      hoja: nombreHoja,
      idVenta: idVenta,
      fechaOperativa: fechaOp,
      hora: hora,
      nombreApellido: nombreApellido,
      tipoListaPrecio: TIPO_LISTA_PRECIO,
      usuario: (window.APP_CONFIG && window.APP_CONFIG.USUARIO) || 'USR-MATIAS',
      items: [{
        idProducto: ID_PRODUCTO_GENERICO,
        categoria: categoria,
        producto: producto,
        cantidad: cantidad,
        precio: precioNum,
        monto: monto
      }]
    };

    var btnGuardar = getBtnGuardar();
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
          mostrarMensajeGuardar('Operación guardada en la hoja ' + nombreHoja + '.', false);
          var inpProducto = document.getElementById('otro-tipo-compras-producto');
          var inpPrecio = document.getElementById('otro-tipo-compras-precio');
          if (inpProducto) inpProducto.value = '';
          if (inpPrecio) inpPrecio.value = '';
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

  function init() {
    var form = document.getElementById('otro-tipo-compras-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        guardar();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.OtroTipoCompras = window.OtroTipoCompras || {};
  window.OtroTipoCompras.getCategoria = getCategoria;
  window.OtroTipoCompras.getCantidad = function () { return CANTIDAD_DEFAULT; };
  window.OtroTipoCompras.CANTIDAD = CANTIDAD_DEFAULT;
  window.OtroTipoCompras.getProducto = getProducto;
  window.OtroTipoCompras.getPrecio = getPrecio;
})();
