/**
 * Módulo Ver Resumen Operativo — 2H Market
 * Vista semanal: 7 tarjetas (LUN–DOM), carga automática, datos de RESUMEN-OPERATIVO agrupados por FECHA_OPERATIVA.
 */
(function () {
  'use strict';

  var APP_CONFIG = window.APP_CONFIG;
  var APP_TABLES = window.APP_TABLES;
  var APP_SCRIPT_URL = APP_CONFIG && APP_CONFIG.APP_SCRIPT_URL;
  var CORS_PROXY = APP_CONFIG && APP_CONFIG.CORS_PROXY;

  var COLUMNAS = (APP_TABLES && APP_TABLES.RESUMEN_OPERATIVO && APP_TABLES.RESUMEN_OPERATIVO.columns) ||
    ['ID-RESUMEN', 'FECHA_OPERATIVA', 'HORA', 'CORRESPONDE-A', 'TIPO-OPERACION', 'CATEGORIA', 'IMPORTE'];

  var DIAS_ABREV = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  var MESES_ABREV = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  var datosCompletos = [];
  var weekStart = null; // Date: lunes de la semana mostrada
  var cargaInicial = true;

  function normalizarFila(obj, headers) {
    var out = {};
    var keys = Object.keys(obj || {});
    (headers || COLUMNAS).forEach(function (col) {
      var val = obj[col];
      if (val === undefined) {
        var colLower = col.toLowerCase();
        for (var k = 0; k < keys.length; k++) {
          if (keys[k].toLowerCase() === colLower) { val = obj[keys[k]]; break; }
        }
      }
      out[col] = val !== undefined && val !== null ? val : '';
    });
    return out;
  }

  /** FECHA_OPERATIVA → YYYY-MM-DD */
  function fechaKey(val) {
    if (val === undefined || val === null || val === '') return '';
    var d = new Date(val);
    if (isNaN(d.getTime())) return String(val).trim();
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return y + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }

  /** Hoy en YYYY-MM-DD */
  function hoyKey() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  /** Devuelve el lunes de la semana que contiene la fecha d (lunes = inicio semana). */
  function getMonday(d) {
    var date = new Date(d);
    date.setHours(0, 0, 0, 0);
    var day = date.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return date;
  }

  /** Número de semana del año (1-53) según ISO. */
  function getWeekNumber(d) {
    var date = new Date(d);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    var week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  /** Formato "23 Feb – 1 Mar 2026" */
  function formatRange(lunes) {
    var d0 = new Date(lunes);
    var d1 = new Date(lunes);
    d1.setDate(d1.getDate() + 6);
    var day0 = d0.getDate();
    var day1 = d1.getDate();
    var mes0 = MESES_ABREV[d0.getMonth()];
    var mes1 = MESES_ABREV[d1.getMonth()];
    var year = d0.getFullYear();
    if (mes0 === mes1) return day0 + ' ' + mes0 + ' – ' + day1 + ' ' + mes1 + ' ' + year;
    return day0 + ' ' + mes0 + ' – ' + day1 + ' ' + mes1 + ' ' + year;
  }

  /** Formato "Semana #9 • 2026" */
  function formatWeekMeta(lunes, esActual) {
    var num = getWeekNumber(lunes);
    var year = lunes.getFullYear();
    return 'Semana #' + num + ' • ' + year + (esActual ? ' ACTUAL' : '');
  }

  function formatImporte(n) {
    return '$ ' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  /** Para cada día de la semana (lun..dom) devuelve { date, key, labelDia, labelNum, esHoy, total, cantidad }. */
  function getSieteDias(lunes) {
    var hoy = hoyKey();
    var result = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(lunes);
      d.setDate(d.getDate() + i);
      var key = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
      result.push({
        date: d,
        key: key,
        labelDia: DIAS_ABREV[i],
        labelNum: d.getDate(),
        esHoy: key === hoy
      });
    }
    return result;
  }

  /** Agrupa datos por fecha y devuelve mapa key → { total, cantidad }. */
  function agruparPorFecha(datos) {
    var map = {};
    datos.forEach(function (r) {
      var key = fechaKey(r.FECHA_OPERATIVA);
      if (!key) return;
      if (!map[key]) map[key] = { total: 0, cantidad: 0 };
      var imp = parseFloat(r.IMPORTE);
      if (!isNaN(imp)) map[key].total += imp;
      map[key].cantidad += 1;
    });
    return map;
  }

  function mostrarMensaje(texto, esError) {
    var el = document.getElementById('ver-resumen-operativo-mensaje');
    if (el) {
      el.textContent = texto;
      el.style.color = esError ? '#c62828' : '';
    }
  }

  function setCargando(cargando) {
    var el = document.getElementById('ver-resumen-operativo-loaded');
    if (el) el.classList.toggle('cargando', cargando);
  }

  function pintarCabeceraSemana(lunes) {
    var rangeEl = document.getElementById('ver-resumen-operativo-range-text');
    var metaEl = document.getElementById('ver-resumen-operativo-week-meta');
    var badgeEl = document.getElementById('ver-resumen-operativo-badge-actual');
    if (!rangeEl || !metaEl) return;
    var hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    var lunesHoy = getMonday(hoy);
    var esActual = lunes.getTime() === lunesHoy.getTime();
    rangeEl.textContent = formatRange(lunes);
    metaEl.textContent = 'Semana #' + getWeekNumber(lunes) + ' • ' + lunes.getFullYear();
    if (badgeEl) badgeEl.hidden = !esActual;
  }

  function pintarTarjetas(lunes, porFecha) {
    var container = document.getElementById('ver-resumen-operativo-cards');
    if (!container) return;
    var siete = getSieteDias(lunes);
    container.innerHTML = '';
    siete.forEach(function (dia) {
      var info = porFecha[dia.key] || { total: 0, cantidad: 0 };
      var card = document.createElement('div');
      card.className = 'ver-resumen-operativo-card' + (dia.esHoy ? ' ver-resumen-operativo-card--hoy' : '');
      card.setAttribute('data-fecha', dia.key);
      var resumen = info.cantidad === 0 ? 'Sin datos' : (info.cantidad === 1 ? '1 operación' : info.cantidad + ' operaciones');
      var importeStr = info.cantidad === 0 ? '—' : formatImporte(info.total);
      card.innerHTML =
        (dia.esHoy ? '<span class="ver-resumen-operativo-card__hoy-badge">HOY</span>' : '') +
        '<span class="ver-resumen-operativo-card__dia">' + dia.labelDia + '</span>' +
        '<span class="ver-resumen-operativo-card__num">' + dia.labelNum + '</span>' +
        '<span class="ver-resumen-operativo-card__resumen">' + resumen + '</span>' +
        '<span class="ver-resumen-operativo-card__importe">' + importeStr + '</span>';
      container.appendChild(card);
    });
  }

  function renderWeek() {
    if (!weekStart) return;
    var porFecha = agruparPorFecha(datosCompletos);
    pintarCabeceraSemana(weekStart);
    pintarTarjetas(weekStart, porFecha);
  }

  function cargarDatos() {
    if (!APP_SCRIPT_URL) {
      mostrarMensaje('No está configurada APP_SCRIPT_URL en config.js.', true);
      setCargando(false);
      return;
    }
    mostrarMensaje('Cargando resumen operativo…');
    setCargando(true);
    var payload = { accion: 'resumenOperativoLeer' };
    var body = 'data=' + encodeURIComponent(JSON.stringify(payload));
    var url = (CORS_PROXY && CORS_PROXY.length) ? CORS_PROXY + encodeURIComponent(APP_SCRIPT_URL) : APP_SCRIPT_URL;
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
          try { return JSON.parse(t); } catch (e) { return { ok: false, error: t }; };
        });
      })
      .then(function (data) {
        setCargando(false);
        if (!data || !data.ok || !Array.isArray(data.datos)) {
          mostrarMensaje(data && (data.error || data.mensaje) || 'No se recibieron datos.', true);
          datosCompletos = [];
          renderWeek();
          return;
        }
        datosCompletos = data.datos.map(function (r) { return normalizarFila(r, COLUMNAS); });
        mostrarMensaje('Semana cargada. Los totales se agrupan por fecha operativa.');
        renderWeek();
      })
      .catch(function (err) {
        setCargando(false);
        var txt = err && err.message ? err.message : String(err);
        mostrarMensaje('Error al cargar: ' + txt, true);
        datosCompletos = [];
        renderWeek();
      });
  }

  function init() {
    weekStart = getMonday(new Date());
    var btnPrev = document.getElementById('ver-resumen-operativo-prev');
    var btnNext = document.getElementById('ver-resumen-operativo-next');
    var btnActual = document.getElementById('ver-resumen-operativo-btn-actual');

    if (btnPrev) {
      btnPrev.addEventListener('click', function () {
        weekStart = new Date(weekStart);
        weekStart.setDate(weekStart.getDate() - 7);
        renderWeek();
      });
    }
    if (btnNext) {
      btnNext.addEventListener('click', function () {
        weekStart = new Date(weekStart);
        weekStart.setDate(weekStart.getDate() + 7);
        renderWeek();
      });
    }
    if (btnActual) {
      btnActual.addEventListener('click', function () {
        weekStart = getMonday(new Date());
        renderWeek();
      });
    }

    renderWeek();
    cargarDatos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
