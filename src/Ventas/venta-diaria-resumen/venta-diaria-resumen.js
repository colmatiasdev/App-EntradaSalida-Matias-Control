/**
 * Resumen de Venta Market — 2H Market
 * Selector de día y listado de la tabla RESUMEN-VENTA para esa fecha (resumenVentaLeer).
 */
(function () {
  'use strict';

  var APP_CONFIG = window.APP_CONFIG;
  var APP_SCRIPT_URL = APP_CONFIG && APP_CONFIG.APP_SCRIPT_URL;
  var CORS_PROXY = APP_CONFIG && APP_CONFIG.CORS_PROXY;

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
  function fi(n) {
    return '$ ' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  function esc(s) {
    if (s == null) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function setMsg(txt, err) {
    var e = document.getElementById('status-msg');
    if (e) {
      e.textContent = txt;
      e.className = 'venta-diaria__status' + (err ? ' error' : '');
    }
  }

  function setCargando(cargando) {
    setMsg(cargando ? 'Cargando…' : 'Listo');
  }

  function pintarCabecera() {
    var l = document.getElementById('day-label');
    var d = document.getElementById('day-date');
    var b = document.getElementById('badge-hoy');
    if (l) l.textContent = fmtCorta(fechaActual);
    if (d) d.textContent = fmtNum(fechaActual);
    if (b) b.hidden = fechaActual !== hoyKey();
  }

  function pintarTabla(datos) {
    var vacioEl = document.getElementById('vacio-msg');
    var wrapEl = document.getElementById('tabla-wrap');
    var theadEl = document.getElementById('ventas-thead');
    var tbodyEl = document.getElementById('ventas-tbody');
    var tfootEl = document.getElementById('ventas-tfoot');
    if (!vacioEl || !wrapEl || !theadEl || !tbodyEl || !tfootEl) return;

    if (!datos || datos.length === 0) {
      vacioEl.hidden = false;
      wrapEl.hidden = true;
      return;
    }

    vacioEl.hidden = true;
    wrapEl.hidden = false;

    theadEl.innerHTML = '<tr><th>ID</th><th>HORA</th><th>TURNO</th><th>TIPO-OPERACION</th><th>CATEGORÍA</th><th class="th-num">CANT.</th><th class="th-num">IMPORTE</th></tr>';
    tbodyEl.innerHTML = '';
    var total = 0;
    datos.forEach(function (r) {
      var imp = parseFloat(r.IMPORTE);
      if (!isNaN(imp)) total += imp;
      tbodyEl.innerHTML +=
        '<tr><td>' + esc(String(r['ID-RESUMEN'] || '—')) + '</td>' +
        '<td>' + esc(String(r.HORA || '—')) + '</td>' +
        '<td>' + esc(String(r.TURNO || '')) + '</td>' +
        '<td>' + esc(String(r['TIPO-OPERACION'] || '')) + '</td>' +
        '<td>' + esc(String(r.CATEGORIA || '')) + '</td>' +
        '<td class="td-num">' + esc(String(r['CANTIDAD-OPERACIONES'] != null ? r['CANTIDAD-OPERACIONES'] : '')) + '</td>' +
        '<td class="td-num">' + fi(imp || 0) + '</td></tr>';
    });
    tfootEl.innerHTML = '<tr><td colspan="6"><strong>Total</strong></td><td class="td-num td-total">' + fi(total) + '</td></tr>';
  }

  function cargarDatos() {
    if (!APP_SCRIPT_URL) {
      setMsg('No está configurada APP_SCRIPT_URL en config.js.', true);
      pintarTabla([]);
      return;
    }

    setMsg('Cargando resumen del ' + fmtNum(fechaActual) + '…');
    setCargando(true);

    var url = (CORS_PROXY && CORS_PROXY.length) ? CORS_PROXY + encodeURIComponent(APP_SCRIPT_URL) : APP_SCRIPT_URL;
    fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(JSON.stringify({ accion: 'resumenVentaLeer', fecha: fechaActual }))
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
        setCargando(false);
        if (!data || !data.ok) {
          setMsg((data && (data.error || data.mensaje)) || 'Error al cargar.', true);
          pintarTabla([]);
          return;
        }
        setMsg('Resumen del ' + fmtNum(data.fecha || fechaActual) + ' cargado.');
        pintarTabla(data.datos || []);
      })
      .catch(function (err) {
        setCargando(false);
        setMsg('Error: ' + (err && err.message ? err.message : String(err)), true);
        pintarTabla([]);
      });
  }

  function render() {
    pintarCabecera();
    cargarDatos();
  }

  function getUrlCrearConFecha() {
    var path = window.location.pathname || '';
    var dir = path.substring(0, path.lastIndexOf('/') + 1);
    var base = (window.location.origin || '') + dir + 'crear-venta-diaria-resumen.html';
    return base + (fechaActual ? '?fecha=' + encodeURIComponent(fechaActual) : '');
  }

  function leerFechaDesdeUrl() {
    var params = new URLSearchParams(window.location.search);
    var f = params.get('fecha');
    if (f && f.length >= 10) {
      var d = dateFromKey(f);
      if (d) fechaActual = keyFromDate(d);
    }
  }

  function init() {
    fechaActual = hoyKey();
    leerFechaDesdeUrl();
    var btnPrev = document.getElementById('btn-prev');
    var btnNext = document.getElementById('btn-next');
    var btnHoy = document.getElementById('btn-hoy');
    var btnNueva = document.getElementById('btn-nueva-pestana');
    if (btnPrev) btnPrev.addEventListener('click', function () { fechaActual = sumarDias(fechaActual, -1); render(); });
    if (btnNext) btnNext.addEventListener('click', function () { fechaActual = sumarDias(fechaActual, 1); render(); });
    if (btnHoy) btnHoy.addEventListener('click', function () { fechaActual = hoyKey(); render(); });
    if (btnNueva) btnNueva.addEventListener('click', function () { window.open(getUrlCrearConFecha(), '_blank', 'noopener'); });
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
