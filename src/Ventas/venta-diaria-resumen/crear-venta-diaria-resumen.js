/**
 * Crear resumen venta diaria — 2H Market
 * Selector de día + formulario para guardar en hoja RESUMEN-VENTA (resumenVentaAlta).
 */
(function () {
  'use strict';

  var APP_CONFIG = window.APP_CONFIG;
  var APP_SCRIPT_URL = APP_CONFIG && APP_CONFIG.APP_SCRIPT_URL;
  var CORS_PROXY = APP_CONFIG && APP_CONFIG.CORS_PROXY;

  /** Valor por defecto para el combo CATEGORIA (label y value). */
  var CARGA_MANUAL = 'CARGA MANUAL';

  var MES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  var fechaActual = '';

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function hoyKey() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function dateFromKey(k) {
    if (!k || k.length < 10) return null;
    var d = new Date(k + 'T12:00:00');
    return isNaN(d.getTime()) ? null : d;
  }
  function keyFromDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function sumarDias(k, n) {
    var d = dateFromKey(k);
    if (!d) return k;
    d.setDate(d.getDate() + n);
    return keyFromDate(d);
  }
  function fmtCorta(k) {
    var d = dateFromKey(k);
    if (!d) return k;
    return DIA[d.getDay()] + ' ' + d.getDate() + ' ' + MES[d.getMonth()];
  }
  function fmtNum(k) {
    var d = dateFromKey(k);
    if (!d) return k;
    return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function horaActual() {
    var d = new Date();
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function setDayMsg(txt) {
    var e = document.getElementById('status-day');
    if (e) e.textContent = txt;
  }

  function pintarCabecera() {
    var l = document.getElementById('day-label');
    var d = document.getElementById('day-date');
    var b = document.getElementById('badge-hoy');
    var inputFecha = document.getElementById('fecha-operativa');
    if (l) l.textContent = fmtCorta(fechaActual);
    if (d) d.textContent = fmtNum(fechaActual);
    if (b) b.hidden = fechaActual !== hoyKey();
    if (inputFecha) inputFecha.value = fechaActual;
    setDayMsg('Fecha del resumen: ' + fmtNum(fechaActual) + '. Completá el formulario y guardá.');
  }

  function request(url, payload) {
    return fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(JSON.stringify(payload))
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var ct = (res.headers.get('Content-Type') || '').toLowerCase();
      if (ct.indexOf('json') !== -1) return res.json();
      return res.text().then(function (t) {
        try { return JSON.parse(t); } catch (e) { return { ok: false, error: t }; };
      });
    });
  }

  function cargarCombos() {
    if (!APP_SCRIPT_URL) return Promise.resolve();
    var url = (CORS_PROXY && CORS_PROXY.length) ? CORS_PROXY + encodeURIComponent(APP_SCRIPT_URL) : APP_SCRIPT_URL;
    return request(url, { accion: 'componenteComboLeer' }).then(function (data) {
      if (!data || !data.ok || !data.datos) return;
      var datos = data.datos;
      var tipoSelect = document.getElementById('tipo-operacion');
      var tipos = {};
      datos.forEach(function (r) {
        var t = (r['TIPO-OPERACION-VENTA-DIARIA'] || '').trim();
        if (t) tipos[t] = true;
      });
      if (tipoSelect) {
        Object.keys(tipos).sort().forEach(function (v) {
          var opt = document.createElement('option');
          opt.value = v;
          opt.textContent = v;
          tipoSelect.appendChild(opt);
        });
      }
    }).catch(function () {});
  }

  function setFormMsg(txt, isError) {
    var e = document.getElementById('form-msg');
    if (e) {
      e.textContent = txt;
      e.className = 'crear-resumen__msg' + (isError ? ' error' : (txt ? ' success' : ''));
    }
  }

  function validarFormularioCompleto() {
    var inputFecha = document.getElementById('fecha-operativa');
    var turno = (document.getElementById('turno') && document.getElementById('turno').value) || '';
    var tipoOperacion = (document.getElementById('tipo-operacion') && document.getElementById('tipo-operacion').value) || '';
    var categoria = (document.getElementById('categoria') && document.getElementById('categoria').value) || '';
    var cantidadEl = document.getElementById('cantidad-ventas');
    var importeEl = document.getElementById('importe');
    var fechaOperativa = (inputFecha && inputFecha.value) || fechaActual;
    if (!fechaOperativa) return false;
    if (!turno || !turno.trim()) return false;
    if (!tipoOperacion || !tipoOperacion.trim()) return false;
    if (!categoria || !categoria.trim()) return false;
    var cant = cantidadEl ? parseInt(cantidadEl.value, 10) : NaN;
    if (!cantidadEl || cantidadEl.value === '' || isNaN(cant) || cant < 1 || cant > 9999) return false;
    var imp = importeEl ? parseFloat(importeEl.value) : NaN;
    if (!importeEl || importeEl.value === '' || isNaN(imp) || imp <= 0) return false;
    return true;
  }

  function actualizarBotonGuardar() {
    var btn = document.getElementById('btn-guardar');
    if (btn) btn.disabled = !validarFormularioCompleto();
  }

  var IMPORTE_MAX = 9999999999.99;
  var CANTIDAD_MAX = 9999;

  function normalizarCantidadOperacionesInput() {
    var el = document.getElementById('cantidad-ventas');
    if (!el) return;
    var val = parseInt(String(el.value).replace(/\D/g, ''), 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > CANTIDAD_MAX) val = CANTIDAD_MAX;
    el.value = val;
    actualizarBotonGuardar();
  }

  function normalizarImporteInput() {
    var el = document.getElementById('importe');
    if (!el) return;
    var val = parseFloat(String(el.value).replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      el.value = '';
      actualizarBotonGuardar();
      return;
    }
    if (val > IMPORTE_MAX) val = IMPORTE_MAX;
    val = Math.round(val * 100) / 100;
    el.value = val.toFixed(2);
    actualizarBotonGuardar();
  }

  function init() {
    fechaActual = hoyKey();
    var params = new URLSearchParams(window.location.search);
    var f = params.get('fecha');
    if (f && f.length >= 10) {
      var d = dateFromKey(f);
      if (d) fechaActual = keyFromDate(d);
    }

    var btnPrev = document.getElementById('btn-prev');
    var btnNext = document.getElementById('btn-next');
    var btnHoy = document.getElementById('btn-hoy');
    if (btnPrev) btnPrev.addEventListener('click', function () { fechaActual = sumarDias(fechaActual, -1); pintarCabecera(); actualizarBotonGuardar(); });
    if (btnNext) btnNext.addEventListener('click', function () { fechaActual = sumarDias(fechaActual, 1); pintarCabecera(); actualizarBotonGuardar(); });
    if (btnHoy) btnHoy.addEventListener('click', function () { fechaActual = hoyKey(); pintarCabecera(); actualizarBotonGuardar(); });

    pintarCabecera();
    cargarCombos().then(function () { actualizarBotonGuardar(); });

    var turnoEl = document.getElementById('turno');
    var tipoOpEl = document.getElementById('tipo-operacion');
    var cantidadEl = document.getElementById('cantidad-ventas');
    var importeEl = document.getElementById('importe');
    if (turnoEl) turnoEl.addEventListener('change', actualizarBotonGuardar);
    if (tipoOpEl) tipoOpEl.addEventListener('change', actualizarBotonGuardar);
    if (cantidadEl) {
      cantidadEl.addEventListener('input', actualizarBotonGuardar);
      cantidadEl.addEventListener('change', normalizarCantidadOperacionesInput);
      cantidadEl.addEventListener('blur', normalizarCantidadOperacionesInput);
    }
    if (importeEl) {
      importeEl.addEventListener('input', actualizarBotonGuardar);
      importeEl.addEventListener('change', normalizarImporteInput);
      importeEl.addEventListener('blur', normalizarImporteInput);
    }
    actualizarBotonGuardar();

    var form = document.getElementById('form-resumen-venta');
    if (form) {
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var inputFecha = document.getElementById('fecha-operativa');
        var horaEl = document.getElementById('hora');
        var hora = (horaEl && horaEl.value && String(horaEl.value).trim()) ? String(horaEl.value).trim() : horaActual();
        var turno = (document.getElementById('turno') && document.getElementById('turno').value) || '';
        var tipoOperacion = (document.getElementById('tipo-operacion') && document.getElementById('tipo-operacion').value) || '';
        var categoria = (document.getElementById('categoria') && document.getElementById('categoria').value) || '';
        var cantidadEl = document.getElementById('cantidad-ventas');
        var importeEl = document.getElementById('importe');
        var valorCantidad = cantidadEl ? parseInt(cantidadEl.value, 10) : NaN;
        var valorImporte = importeEl ? parseFloat(String(importeEl.value).replace(',', '.')) : NaN;
        if (isNaN(valorCantidad)) valorCantidad = 1;
        if (isNaN(valorImporte)) valorImporte = 0;
        var cantidadVentas = Math.max(1, Math.min(9999, Math.floor(valorCantidad)));
        var importe = Math.max(0, valorImporte);

        var fechaOperativa = (inputFecha && inputFecha.value) || fechaActual;
        if (!fechaOperativa) {
          setFormMsg('Seleccioná un día para la fecha operativa.', true);
          return;
        }
        if (!turno || !turno.trim()) {
          setFormMsg('Seleccioná un turno (MAÑANA, TARDE o NOCHE).', true);
          return;
        }
        if (!tipoOperacion || !tipoOperacion.trim()) {
          setFormMsg('Seleccioná un tipo de operación.', true);
          return;
        }
        if (!categoria || !categoria.trim()) {
          setFormMsg('La categoría es obligatoria.', true);
          return;
        }
        if (cantidadEl && (cantidadEl.value === '' || isNaN(parseInt(cantidadEl.value, 10)) || parseInt(cantidadEl.value, 10) < 1 || parseInt(cantidadEl.value, 10) > 9999)) {
          setFormMsg('Cantidad de ventas: número entero mayor a 0 (entre 1 y 9999).', true);
          return;
        }
        if (importeEl && (importeEl.value === '' || isNaN(parseFloat(importeEl.value)) || parseFloat(importeEl.value) <= 0)) {
          setFormMsg('El importe debe ser mayor a cero.', true);
          return;
        }

        if (!APP_SCRIPT_URL) {
          setFormMsg('No está configurada APP_SCRIPT_URL en config.js.', true);
          return;
        }

        var btn = document.getElementById('btn-guardar');
        if (btn) btn.disabled = true;
        setFormMsg('Guardando…');

        var url = (CORS_PROXY && CORS_PROXY.length) ? CORS_PROXY + encodeURIComponent(APP_SCRIPT_URL) : APP_SCRIPT_URL;
        request(url, {
          accion: 'resumenVentaAlta',
          fechaOperativa: fechaOperativa,
          hora: hora,
          turno: turno,
          tipoOperacion: tipoOperacion,
          categoria: categoria,
          cantidadVentas: cantidadVentas,
          importe: importe
        }).then(function (data) {
          if (btn) btn.disabled = false;
          if (data && data.ok) {
            setFormMsg('Guardado correctamente. Redirigiendo al resumen…', false);
            setTimeout(function () {
              window.location.href = 'venta-diaria-resumen.html';
            }, 1200);
          } else {
            setFormMsg((data && (data.error || data.mensaje)) || 'Error al guardar.', true);
          }
        }).catch(function (err) {
          if (btn) btn.disabled = false;
          setFormMsg('Error: ' + (err && err.message ? err.message : String(err)), true);
        });
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
