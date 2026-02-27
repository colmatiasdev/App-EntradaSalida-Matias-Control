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
  var selectedDayKey = ''; // Fecha operativa seleccionada (YYYY-MM-DD) para el detalle
  var cargaInicial = true;

  /** Devuelve el color del usuario (APP_CONFIG.USUARIO_ETIQUETAS) para CORRESPONDE-A, o null si no hay. */
  function getColorForCorrespondeA(correspondeA) {
    var etiquetas = APP_CONFIG && APP_CONFIG.USUARIO_ETIQUETAS;
    if (!etiquetas || !correspondeA) return null;
    var key = 'USR-' + String(correspondeA).toUpperCase().trim().replace(/\s+/g, '-');
    var info = etiquetas[key];
    if (info && info.color) return info.color;
    var nameLower = String(correspondeA).toLowerCase().trim();
    for (var k in etiquetas) {
      if (etiquetas[k].etiqueta && etiquetas[k].etiqueta.toLowerCase() === nameLower && etiquetas[k].color) return etiquetas[k].color;
    }
    return null;
  }

  /** Convierte #hex en un tono muy claro para fondo (mezcla con blanco). */
  function colorFondoSuave(hex) {
    if (!hex || hex.indexOf('#') !== 0) return '#f5f5f5';
    var h = hex.slice(1);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    var mix = 0.92;
    r = Math.round(r * (1 - mix) + 255 * mix);
    g = Math.round(g * (1 - mix) + 255 * mix);
    b = Math.round(b * (1 - mix) + 255 * mix);
    return '#' + (r < 16 ? '0' : '') + r.toString(16) + (g < 16 ? '0' : '') + g.toString(16) + (b < 16 ? '0' : '') + b.toString(16);
  }

  function normalizarFila(obj, headers) {
    var out = {};
    var keys = Object.keys(obj || {});
    (headers || COLUMNAS).forEach(function (col) {
      var val = obj[col];
      if (val === undefined) {
        var colAlt = col.replace(/_/g, ' ');
        if (obj[colAlt] !== undefined) val = obj[colAlt];
      }
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

  /** FECHA_OPERATIVA → YYYY-MM-DD. Acepta "YYYY-MM-DD", ISO string, o DD/MM/YYYY (sin cambiar por zona horaria). */
  function fechaKey(val) {
    if (val === undefined || val === null || val === '') return '';
    var s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}(T|$|\s)/.test(s)) return s.substring(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    var d = new Date(val);
    if (isNaN(d.getTime())) {
      var parts = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (parts) {
        d = new Date(parseInt(parts[3], 10), parseInt(parts[2], 10) - 1, parseInt(parts[1], 10));
        if (!isNaN(d.getTime())) {
          var y = d.getFullYear();
          var m = d.getMonth() + 1;
          var day = d.getDate();
          return y + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
        }
      }
      return s;
    }
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

  /** Formatea valor HORA para mostrar (ej. 14:30 o texto tal cual si no es hora). */
  function formatHora(val) {
    if (val === undefined || val === null || val === '') return '—';
    var s = String(val).trim();
    var d = new Date(val);
    if (!isNaN(d.getTime())) {
      var h = d.getHours();
      var m = d.getMinutes();
      return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    }
    return s;
  }

  /** Para cada día de la semana (lun..dom) devuelve { date, key, labelDia, labelNum, esHoy, total, cantidad }. */
  function getSieteDias(lunes) {
    var hoy = hoyKey();
    var result = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(lunes);
      d.setDate(d.getDate() + i);
      var key = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
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
      var esSelected = dia.key === selectedDayKey;
      card.className = 'ver-resumen-operativo-card' +
        (dia.esHoy ? ' ver-resumen-operativo-card--hoy' : '') +
        (esSelected ? ' ver-resumen-operativo-card--selected' : '');
      card.setAttribute('data-fecha', dia.key);
      var resumen = info.cantidad === 0 ? 'Sin datos' : (info.cantidad === 1 ? '1 operación' : info.cantidad + ' operaciones');
      var importeStr = info.cantidad === 0 ? '—' : formatImporte(info.total);
      card.innerHTML =
        (dia.esHoy ? '<span class="ver-resumen-operativo-card__hoy-badge">HOY</span>' : '') +
        '<span class="ver-resumen-operativo-card__dia">' + dia.labelDia + '</span>' +
        '<span class="ver-resumen-operativo-card__num">' + dia.labelNum + '</span>' +
        '<span class="ver-resumen-operativo-card__resumen">' + resumen + '</span>' +
        '<span class="ver-resumen-operativo-card__importe">' + importeStr + '</span>';
      card.addEventListener('click', function () {
        selectedDayKey = dia.key;
        renderWeek();
        pintarDetalleDia(selectedDayKey);
      });
      container.appendChild(card);
    });
  }

  /** Pinta la tabla de detalle del día: filas de RESUMEN-OPERATIVO filtradas por FECHA_OPERATIVA. */
  function pintarDetalleDia(fechaKeyVal) {
    var tituloEl = document.getElementById('ver-resumen-operativo-detalle-titulo');
    var vacioEl = document.getElementById('ver-resumen-operativo-detalle-vacio');
    var wrapEl = document.getElementById('ver-resumen-operativo-detalle-tabla-wrap');
    var theadEl = document.getElementById('ver-resumen-operativo-detalle-thead');
    var tbodyEl = document.getElementById('ver-resumen-operativo-detalle-tbody');
    var tfootEl = document.getElementById('ver-resumen-operativo-detalle-tfoot');
    if (!tituloEl || !vacioEl || !wrapEl || !theadEl || !tbodyEl || !tfootEl) return;

    var key = (fechaKeyVal !== undefined && fechaKeyVal !== null) ? String(fechaKeyVal).trim() : '';
    if (key && /^\d{4}-\d{4}$/.test(key)) {
      key = key.substring(0, 6) + '-' + key.substring(6);
    }
    if (!key) {
      tituloEl.textContent = 'Detalle del día';
      vacioEl.hidden = false;
      vacioEl.textContent = 'Seleccioná un día en la semana para ver los datos filtrados por fecha operativa.';
      wrapEl.hidden = true;
      return;
    }

    var filas = datosCompletos.filter(function (r) { return fechaKey(r.FECHA_OPERATIVA) === key; });
    var totalImporte = 0;
    filas.forEach(function (r) {
      var n = parseFloat(r.IMPORTE);
      if (!isNaN(n)) totalImporte += n;
    });

    var d = new Date(key + 'T12:00:00');
    var labelDia = isNaN(d.getTime()) ? key : d.getDate() + ' ' + MESES_ABREV[d.getMonth()] + ' ' + d.getFullYear();
    tituloEl.textContent = 'Detalle del día — ' + labelDia;

    if (filas.length === 0) {
      vacioEl.hidden = false;
      vacioEl.textContent = 'Sin registros para esta fecha.';
      wrapEl.hidden = true;
      return;
    }

    vacioEl.hidden = true;
    wrapEl.hidden = false;

    var grupos = [];
    var mapCorresponde = {};
    filas.forEach(function (r) {
      var clave = String(r['CORRESPONDE-A'] !== undefined && r['CORRESPONDE-A'] !== null ? r['CORRESPONDE-A'] : '').trim() || '—';
      if (!mapCorresponde[clave]) {
        mapCorresponde[clave] = [];
        grupos.push(clave);
      }
      mapCorresponde[clave].push(r);
    });

    theadEl.innerHTML = '<tr><th>HORA</th><th>TIPO-OPERACION</th><th>CATEGORIA</th><th class="th-num">IMPORTE</th></tr>';
    tbodyEl.innerHTML = '';
    grupos.forEach(function (correspondeA) {
      var grupoFilas = mapCorresponde[correspondeA];
      var subtotalGrupo = 0;
      grupoFilas.forEach(function (r) {
        var n = parseFloat(r.IMPORTE);
        if (!isNaN(n)) subtotalGrupo += n;
      });
      var userColor = getColorForCorrespondeA(correspondeA);
      var groupStyle = '';
      var subtotalStyle = '';
      if (userColor) {
        var bgSuave = colorFondoSuave(userColor);
        groupStyle = ' background:' + bgSuave + '; color:' + userColor + ';';
        subtotalStyle = ' background:' + bgSuave + '; color:' + userColor + ';';
      }
      var trHeader = document.createElement('tr');
      trHeader.className = 'ver-resumen-operativo-detalle-grupo' + (userColor ? ' ver-resumen-operativo-detalle-grupo--usuario' : '');
      trHeader.innerHTML = '<td colspan="4" class="ver-resumen-operativo-detalle-grupo__titulo"' + (groupStyle ? ' style="' + groupStyle + '"' : '') + '>' + escapeHtml(correspondeA) + '</td>';
      tbodyEl.appendChild(trHeader);
      grupoFilas.forEach(function (r) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + escapeHtml(formatHora(r.HORA)) + '</td>' +
          '<td>' + escapeHtml(r['TIPO-OPERACION']) + '</td>' +
          '<td>' + escapeHtml(r.CATEGORIA) + '</td>' +
          '<td class="td-num">' + escapeHtml(formatImporte(parseFloat(r.IMPORTE) || 0)) + '</td>';
        tbodyEl.appendChild(tr);
      });
      var trSubtotal = document.createElement('tr');
      trSubtotal.className = 'ver-resumen-operativo-detalle-subtotal' + (userColor ? ' ver-resumen-operativo-detalle-subtotal--usuario' : '');
      trSubtotal.innerHTML =
        '<td colspan="3" class="ver-resumen-operativo-detalle-subtotal__label"' + (subtotalStyle ? ' style="' + subtotalStyle + '"' : '') + '>Subtotal ' + escapeHtml(correspondeA) + '</td>' +
        '<td class="td-num ver-resumen-operativo-detalle-subtotal__valor"' + (subtotalStyle ? ' style="' + subtotalStyle + '"' : '') + '>' + formatImporte(subtotalGrupo) + '</td>';
      tbodyEl.appendChild(trSubtotal);
    });
    tfootEl.innerHTML = '<tr><td colspan="3">Total del día</td><td class="td-num td-total">' + formatImporte(totalImporte) + '</td></tr>';
  }

  function escapeHtml(s) {
    if (s === undefined || s === null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function renderWeek() {
    if (!weekStart) return;
    var porFecha = agruparPorFecha(datosCompletos);
    pintarCabeceraSemana(weekStart);
    pintarTarjetas(weekStart, porFecha);
    pintarDetalleDia(selectedDayKey);
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
    selectedDayKey = hoyKey();
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
