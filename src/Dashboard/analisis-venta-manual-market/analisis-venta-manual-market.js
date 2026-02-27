/**
 * Análisis venta manual Market — Dashboard (RESUMEN-VENTA)
 * Tipos: Semanal, Mensual, Anual. KPIs, gráficos, distribución, crecimiento.
 */
(function () {
  'use strict';

  var APP_CONFIG = window.APP_CONFIG;
  var APP_SCRIPT_URL = APP_CONFIG && APP_CONFIG.APP_SCRIPT_URL;
  var CORS_PROXY = APP_CONFIG && APP_CONFIG.CORS_PROXY;

  var DIA_ABREV = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  var MES_NOMBRE = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  var MES_NOMBRE_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  var tipoAnalisis = 'semanal';
  var periodStart = null;
  var periodEnd = null;
  var datosActual = [];
  var datosAnterior = [];
  var datosMesAnterior = [];

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function hoy() { return new Date(); }
  function toKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fromKey(s) {
    var d = new Date(s + 'T12:00:00');
    return isNaN(d.getTime()) ? null : d;
  }
  function getMonday(d) {
    var day = d.getDay();
    var diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
  }
  function addDays(d, n) {
    var r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  }
  function addWeeks(d, n) { return addDays(d, n * 7); }
  function addMonths(d, n) {
    var r = new Date(d);
    r.setMonth(r.getMonth() + n);
    return r;
  }
  function addYears(d, n) {
    var r = new Date(d);
    r.setFullYear(r.getFullYear() + n);
    return r;
  }
  function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
  function startOfYear(d) { return new Date(d.getFullYear(), 0, 1); }
  function endOfYear(d) { return new Date(d.getFullYear(), 11, 31); }
  function weekNumber(d) {
    var mon = getMonday(d);
    var first = getMonday(new Date(mon.getFullYear(), 0, 1));
    return Math.floor((mon - first) / 604800000) + 1;
  }

  function getSemanaRange(weekDelta) {
    var hoyDate = hoy();
    var mon = getMonday(hoyDate);
    mon = addWeeks(mon, weekDelta);
    var dom = addDays(mon, 6);
    return { start: mon, end: dom };
  }
  function getMesRange(monthDelta) {
    var hoyDate = hoy();
    var start = startOfMonth(hoyDate);
    start = addMonths(start, monthDelta);
    var end = endOfMonth(start);
    return { start: start, end: end };
  }
  function getAnioRange(yearDelta) {
    var hoyDate = hoy();
    var start = startOfYear(hoyDate);
    start = addYears(start, yearDelta);
    var end = endOfYear(start);
    return { start: start, end: end };
  }

  function setPeriodFromTipo() {
    if (tipoAnalisis === 'semanal') {
      var r = getSemanaRange(0);
      periodStart = r.start;
      periodEnd = r.end;
    } else if (tipoAnalisis === 'mensual') {
      var r = getMesRange(0);
      periodStart = r.start;
      periodEnd = r.end;
    } else {
      var r = getAnioRange(0);
      periodStart = r.start;
      periodEnd = r.end;
    }
  }

  function fmtMoneda(n) {
    return '$ ' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  function fmtFechaCorta(d) {
    return d.getDate() + ' ' + MES_NOMBRE[d.getMonth()];
  }
  function fmtRango(d1, d2) {
    return d1.getDate() + ' ' + MES_NOMBRE[d1.getMonth()] + ' — ' + d2.getDate() + ' ' + MES_NOMBRE[d2.getMonth()] + ' ' + d2.getFullYear();
  }
  function esc(s) {
    if (s == null) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function requestRango(fechaDesde, fechaHasta) {
    if (!APP_SCRIPT_URL) return Promise.reject(new Error('APP_SCRIPT_URL no configurada'));
    var url = (CORS_PROXY && CORS_PROXY.length) ? CORS_PROXY + encodeURIComponent(APP_SCRIPT_URL) : APP_SCRIPT_URL;
    return fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(JSON.stringify({
        accion: 'resumenVentaLeerRango',
        fechaDesde: fechaDesde,
        fechaHasta: fechaHasta
      }))
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json().catch(function () { return res.text().then(function (t) { try { return JSON.parse(t); } catch (e) { return { ok: false }; }; }); });
    });
  }

  function parseNum(val) {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number' && !isNaN(val)) return val;
    var s = String(val).trim().replace(',', '.');
    var n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }
  function parseIntSafe(val) {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number' && !isNaN(val)) return Math.floor(val);
    var s = String(val).trim().replace(',', '.');
    var n = parseInt(s, 10);
    return isNaN(n) ? 0 : n;
  }
  function agregarPorDia(datos) {
    var porDia = {};
    (datos || []).forEach(function (r) {
      var f = (r.FECHA_OPERATIVA != null ? String(r.FECHA_OPERATIVA) : '').trim();
      if (!f) return;
      if (!porDia[f]) porDia[f] = { importe: 0, cantidad: 0, ventas: 0 };
      porDia[f].importe += parseNum(r.IMPORTE);
      porDia[f].cantidad += parseIntSafe(r['CANTIDAD-VENTAS']);
      porDia[f].ventas += 1;
    });
    return porDia;
  }
  function agregarPorTipo(datos) {
    var out = {};
    (datos || []).forEach(function (r) {
      var t = (r['TIPO-OPERACION'] || '').trim() || '—';
      if (!out[t]) out[t] = { importe: 0, cantidad: 0 };
      out[t].importe += parseNum(r.IMPORTE);
      out[t].cantidad += parseIntSafe(r['CANTIDAD-VENTAS']);
    });
    return out;
  }
  function agregarPorTurno(datos) {
    var out = {};
    (datos || []).forEach(function (r) {
      var t = (r.TURNO || '').trim() || '—';
      if (!out[t]) out[t] = { importe: 0, cantidad: 0 };
      out[t].importe += parseNum(r.IMPORTE);
      out[t].cantidad += parseIntSafe(r['CANTIDAD-VENTAS']);
    });
    return out;
  }
  function agregarPorCategoria(datos) {
    var out = {};
    (datos || []).forEach(function (r) {
      var c = (r.CATEGORIA || '').trim() || '—';
      if (!out[c]) out[c] = { importe: 0, cantidad: 0 };
      out[c].importe += parseNum(r.IMPORTE);
      out[c].cantidad += parseIntSafe(r['CANTIDAD-VENTAS']);
    });
    return out;
  }
  function agregarPorMes(datos) {
    var out = {};
    for (var m = 1; m <= 12; m++) out[m] = { importe: 0, cantidad: 0 };
    (datos || []).forEach(function (r) {
      var f = (r.FECHA_OPERATIVA != null ? String(r.FECHA_OPERATIVA) : '').substring(0, 7);
      var mes = parseInt(f.split('-')[1], 10);
      if (mes >= 1 && mes <= 12) {
        out[mes].importe += parseNum(r.IMPORTE);
        out[mes].cantidad += parseIntSafe(r['CANTIDAD-VENTAS']);
      }
    });
    return out;
  }

  function totalImporte(datos) {
    var t = 0;
    (datos || []).forEach(function (r) { t += parseNum(r.IMPORTE); });
    return t;
  }
  function totalCantidad(datos) {
    var t = 0;
    (datos || []).forEach(function (r) { t += parseIntSafe(r['CANTIDAD-VENTAS']); });
    return t;
  }
  function mejorDia(datos) {
    var porDia = agregarPorDia(datos);
    var best = { key: null, importe: 0, label: '—' };
    for (var k in porDia) {
      if (porDia[k].importe > best.importe) {
        best.importe = porDia[k].importe;
        best.key = k;
        var d = fromKey(k);
        best.label = d ? (DIA_ABREV[d.getDay()] + ' ' + d.getDate()) : k;
      }
    }
    return best;
  }

  function pintarTituloYSegment() {
    var label = document.getElementById('dash-tipo-label');
    if (label) label.textContent = tipoAnalisis;
    var btnNow = document.getElementById('btn-periodo-actual-text');
    if (btnNow) {
      btnNow.textContent = tipoAnalisis === 'semanal' ? 'Semana actual' : tipoAnalisis === 'mensual' ? 'Mes actual' : 'Año actual';
    }
    document.querySelectorAll('.dash-segment__btn').forEach(function (btn) {
      btn.classList.toggle('active', (btn.getAttribute('data-tipo') || '') === tipoAnalisis);
    });
  }

  function pintarNav() {
    var rangeEl = document.getElementById('nav-range');
    var periodEl = document.getElementById('nav-period');
    var badgeEl = document.getElementById('nav-badge-actual');
    if (!periodStart || !periodEnd) return;
    if (rangeEl) rangeEl.textContent = fmtRango(periodStart, periodEnd);
    var hoyDate = hoy();
    var esActual = (periodStart <= hoyDate && periodEnd >= hoyDate);
    if (badgeEl) badgeEl.hidden = !esActual;
    if (tipoAnalisis === 'semanal') {
      if (periodEl) periodEl.textContent = 'Semana #' + weekNumber(periodStart) + ' - ' + periodStart.getFullYear();
    } else if (tipoAnalisis === 'mensual') {
      if (periodEl) periodEl.textContent = MES_NOMBRE_FULL[periodStart.getMonth()] + ' ' + periodStart.getFullYear();
    } else {
      if (periodEl) periodEl.textContent = 'Año ' + periodStart.getFullYear();
    }
  }

  function pintarDiasSemana() {
    var cont = document.getElementById('dash-days');
    if (!cont) return;
    if (tipoAnalisis !== 'semanal') {
      cont.innerHTML = '';
      cont.style.display = 'none';
      return;
    }
    cont.style.display = 'grid';
    var porDia = agregarPorDia(datosActual);
    var hoyKeyStr = toKey(hoy());
    var html = '';
    for (var i = 0; i < 7; i++) {
      var d = addDays(periodStart, i);
      var key = toKey(d);
      var info = porDia[key] || { importe: 0, ventas: 0 };
      var esHoy = key === hoyKeyStr;
      html += '<div class="dash-day dash-day--clickable' + (esHoy ? ' dash-day--hoy' : '') + (info.ventas === 0 ? ' dash-day--sin' : '') + '" data-fecha="' + esc(key) + '" role="button" tabindex="0">';
      if (esHoy) html += '<span class="dash-day__badge">HOY</span>';
      html += '<div class="dash-day__dia">' + esc(DIA_ABREV[d.getDay()]) + '</div>';
      html += '<div class="dash-day__fecha">' + d.getDate() + '</div>';
      html += '<div class="dash-day__monto">' + (info.ventas > 0 ? fmtMoneda(info.importe) : '—') + '</div>';
      html += '<div class="dash-day__ventas">' + (info.ventas > 0 ? info.ventas + ' venta' + (info.ventas !== 1 ? 's' : '') : 'Sin ventas') + '</div>';
      html += '</div>';
    }
    cont.innerHTML = html;
  }

  function pintarKPIs() {
    var totalImp = totalImporte(datosActual);
    var totalCant = totalCantidad(datosActual);
    var countVentas = datosActual.length;
    var mejor = mejorDia(datosActual);
    var diasConActividad = 0;
    var porDia = agregarPorDia(datosActual);
    for (var k in porDia) { if (porDia[k].ventas > 0) diasConActividad++; }
    var ticketPromedio = countVentas > 0 ? totalImp / countVentas : 0;

    var factLabel = document.getElementById('kpi-fact-label');
    if (factLabel) factLabel.textContent = tipoAnalisis === 'semanal' ? 'FACTURACIÓN SEMANA' : tipoAnalisis === 'mensual' ? 'FACTURACIÓN MES' : 'FACTURACIÓN AÑO';
    setText('kpi-fact-value', fmtMoneda(totalImp));
    setText('kpi-fact-sub', diasConActividad + ' días con actividad');
    setText('kpi-mejor-value', fmtMoneda(mejor.importe));
    setText('kpi-mejor-sub', mejor.label);
    setText('kpi-ventas-value', countVentas);
    setText('kpi-unidades-value', totalCant);
    setText('kpi-ticket-value', fmtMoneda(ticketPromedio));
  }
  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function pintarChartBarras() {
    var cont = document.getElementById('chart-bars');
    if (!cont) return;
    var porDia = agregarPorDia(datosActual);
    var maxImp = 0;
    for (var k in porDia) { if (porDia[k].importe > maxImp) maxImp = porDia[k].importe; }
    if (maxImp === 0) maxImp = 1;
    var hoyKeyStr = toKey(hoy());
    var html = '';
    if (tipoAnalisis === 'semanal') {
      for (var i = 0; i < 7; i++) {
        var d = addDays(periodStart, i);
        var key = toKey(d);
        var info = porDia[key] || { importe: 0 };
        var pct = (info.importe / maxImp) * 100;
        var esHoy = key === hoyKeyStr;
        var barHeight = maxImp > 0 ? Math.max(4, pct) : 0;
        html += '<div class="dash-chart-bar-wrap"><div class="dash-chart-bar-container"><div class="dash-chart-bar" style="height:' + barHeight + '%"' + (esHoy ? ' class="dash-chart-bar--hoy"' : '') + '">' + (esHoy ? '<span class="dash-chart-bar__hoy">HOY</span>' : '') + '</div></div><div class="dash-chart-bar-wrap__label">' + esc(DIA_ABREV[d.getDay()]) + '</div><div class="dash-chart-bar-wrap__value">' + (info.importe > 0 ? fmtMoneda(info.importe) : '—') + '</div></div>';
      }
    } else if (tipoAnalisis === 'mensual') {
      var daysInMonth = (endOfMonth(periodStart).getDate());
      var step = Math.max(1, Math.floor(daysInMonth / 7));
      for (var j = 1; j <= daysInMonth; j += step) {
        var d = new Date(periodStart.getFullYear(), periodStart.getMonth(), j);
        var key = toKey(d);
        var info = porDia[key] || { importe: 0 };
        var pct = (info.importe / maxImp) * 100;
        var esHoy = key === hoyKeyStr;
        var barHeight = maxImp > 0 ? Math.max(4, pct) : 0;
        html += '<div class="dash-chart-bar-wrap"><div class="dash-chart-bar-container"><div class="dash-chart-bar" style="height:' + barHeight + '%"' + (esHoy ? ' class="dash-chart-bar--hoy"' : '') + '">' + (esHoy ? '<span class="dash-chart-bar__hoy">HOY</span>' : '') + '</div></div><div class="dash-chart-bar-wrap__label">' + j + '</div><div class="dash-chart-bar-wrap__value">' + (info.importe > 0 ? fmtMoneda(info.importe) : '—') + '</div></div>';
      }
    } else {
      var porMes = agregarPorMes(datosActual);
      var maxMes = 0;
      for (var m = 1; m <= 12; m++) { if (porMes[m].importe > maxMes) maxMes = porMes[m].importe; }
      if (maxMes === 0) maxMes = 1;
      for (var m = 1; m <= 12; m++) {
        var pct = (porMes[m].importe / maxMes) * 100;
        html += '<div class="dash-mes-bar"><div class="dash-mes-bar__bar" style="height:' + Math.max(8, pct) + '%"></div><div class="dash-mes-bar__label">' + esc(MES_NOMBRE[m - 1]) + '</div><div class="dash-mes-bar__value">' + (porMes[m].importe > 0 ? fmtMoneda(porMes[m].importe) : '—') + '</div></div>';
      }
    }
    cont.innerHTML = html;
  }

  var PIE_COLORS = ['#c62828', '#e57373', '#d84315', '#ff8f00', '#2e7d32', '#1565c0', '#6a1b9a', '#00838f'];
  function pintarTorta(obj, totalImp, pieId) {
    var pieEl = document.getElementById(pieId);
    if (!pieEl) return;
    var keys = Object.keys(obj).sort();
    if (keys.length === 0 || totalImp <= 0) {
      pieEl.style.background = 'conic-gradient(#eee 0deg 360deg)';
      pieEl.title = 'Sin datos';
      return;
    }
    var parts = [];
    var acum = 0;
    keys.forEach(function (k, i) {
      var pct = (obj[k].importe / totalImp) * 100;
      if (pct <= 0) return;
      var start = acum;
      acum += pct;
      parts.push(PIE_COLORS[i % PIE_COLORS.length] + ' ' + start + '% ' + acum + '%');
    });
    if (parts.length === 0) {
      pieEl.style.background = 'conic-gradient(#eee 0deg 360deg)';
      return;
    }
    pieEl.style.background = 'conic-gradient(' + parts.join(', ') + ')';
    pieEl.title = keys.map(function (k) {
      var pct = totalImp > 0 ? ((obj[k].importe / totalImp) * 100).toFixed(0) : 0;
      return k + ': ' + pct + '%';
    }).join(' · ');
  }
  function pintarDistribucion() {
    var porTipo = agregarPorTipo(datosActual);
    var porTurno = agregarPorTurno(datosActual);
    var porCat = agregarPorCategoria(datosActual);
    var totalImp = totalImporte(datosActual);
    pintarTorta(porTipo, totalImp, 'dist-tipo-pie');
    pintarTorta(porTurno, totalImp, 'dist-turno-pie');
    pintarTorta(porCat, totalImp, 'dist-categoria-pie');
    function listar(obj, id) {
      var cont = document.getElementById(id);
      if (!cont) return;
      var keys = Object.keys(obj).sort();
      if (keys.length === 0) { cont.innerHTML = '<p class="dash-dist-item">Sin datos</p>'; return; }
      cont.innerHTML = keys.map(function (k, idx) {
        var imp = obj[k].importe;
        var pct = totalImp > 0 ? ((imp / totalImp) * 100).toFixed(0) : 0;
        var color = PIE_COLORS[idx % PIE_COLORS.length];
        return '<div class="dash-dist-item"><span class="dash-dist-item__dot" style="background:' + color + '"></span><span class="dash-dist-item__label">' + esc(k) + '</span><span class="dash-dist-item__value">' + fmtMoneda(imp) + ' (' + pct + '%)</span></div>';
      }).join('');
    }
    listar(porTipo, 'dist-tipo');
    listar(porTurno, 'dist-turno');
    listar(porCat, 'dist-categoria');
  }

  function pintarCrecimiento() {
    var totActual = totalImporte(datosActual);
    var totSemAnt = totalImporte(datosAnterior);
    var totMesAnt = totalImporte(datosMesAnterior);
    var growthSem = document.getElementById('growth-semana');
    var growthMes = document.getElementById('growth-mes');
    function pctStr(ant, act) {
      if (ant === 0) return act > 0 ? '+100%' : '—';
      var pct = ((act - ant) / ant) * 100;
      var sign = pct >= 0 ? '+' : '';
      return sign + pct.toFixed(1) + '%';
    }
    function setGrowth(el, ant, act) {
      if (!el) return;
      el.textContent = ant > 0 || act > 0 ? pctStr(ant, act) : '—';
      el.className = 'dash-growth__value' + (act > ant ? ' positive' : act < ant ? ' negative' : '');
    }
    setGrowth(growthSem, totSemAnt, totActual);
    setGrowth(growthMes, totMesAnt, totActual);
  }

  function pintarComparativaMeses() {
    var cont = document.getElementById('comparativa-meses');
    if (!cont) return;
    if (tipoAnalisis !== 'anual') { cont.innerHTML = ''; return; }
    var porMes = agregarPorMes(datosActual);
    var maxMes = 0;
    for (var m = 1; m <= 12; m++) { if (porMes[m].importe > maxMes) maxMes = porMes[m].importe; }
    if (maxMes === 0) maxMes = 1;
    var html = '';
    for (var m = 1; m <= 12; m++) {
      var pct = (porMes[m].importe / maxMes) * 100;
      html += '<div class="dash-mes-bar"><div class="dash-mes-bar__bar" style="height:' + Math.max(8, pct) + '%"></div><div class="dash-mes-bar__label">' + esc(MES_NOMBRE[m - 1]) + '</div><div class="dash-mes-bar__value">' + (porMes[m].importe > 0 ? fmtMoneda(porMes[m].importe) : '—') + '</div></div>';
    }
    cont.innerHTML = html;
  }

  function pintarTablaResumen() {
    var thead = document.getElementById('tabla-resumen-thead');
    var tbody = document.getElementById('tabla-resumen-tbody');
    var title = document.getElementById('resumen-title');
    var desc = document.getElementById('resumen-desc');
    if (!tbody) return;
    if (tipoAnalisis === 'semanal') {
      if (title) title.textContent = 'RESUMEN DIARIO DE LA SEMANA';
      if (desc) desc.textContent = 'Detalle por día.';
      if (thead) thead.innerHTML = '<tr><th>Día</th><th class="td-num">Ventas</th><th class="td-num">Unidades</th><th class="td-num">Importe</th></tr>';
      var porDia = agregarPorDia(datosActual);
      var rows = [];
      for (var i = 0; i < 7; i++) {
        var d = addDays(periodStart, i);
        var key = toKey(d);
        var info = porDia[key] || { importe: 0, cantidad: 0, ventas: 0 };
        rows.push('<tr><td>' + esc(DIA_ABREV[d.getDay()] + ' ' + d.getDate()) + '</td><td class="td-num">' + info.ventas + '</td><td class="td-num">' + info.cantidad + '</td><td class="td-num">' + fmtMoneda(info.importe) + '</td></tr>');
      }
      tbody.innerHTML = rows.join('');
    } else if (tipoAnalisis === 'mensual') {
      if (title) title.textContent = 'RESUMEN DIARIO DETALLADO (MES)';
      if (desc) desc.textContent = 'Detalle por día del mes.';
      if (thead) thead.innerHTML = '<tr><th>Fecha</th><th class="td-num">Ventas</th><th class="td-num">Unidades</th><th class="td-num">Importe</th></tr>';
      var porDia = agregarPorDia(datosActual);
      var rows = [];
      for (var j = 1; j <= endOfMonth(periodStart).getDate(); j++) {
        var d = new Date(periodStart.getFullYear(), periodStart.getMonth(), j);
        var key = toKey(d);
        var info = porDia[key] || { importe: 0, cantidad: 0, ventas: 0 };
        if (info.ventas > 0 || j === hoy().getDate()) rows.push('<tr><td>' + esc(key) + '</td><td class="td-num">' + info.ventas + '</td><td class="td-num">' + info.cantidad + '</td><td class="td-num">' + fmtMoneda(info.importe) + '</td></tr>');
      }
      tbody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="4">Sin registros en el mes.</td></tr>';
    } else {
      if (title) title.textContent = 'RESUMEN MENSUAL DETALLADO (AÑO)';
      if (desc) desc.textContent = 'Detalle por mes.';
      if (thead) thead.innerHTML = '<tr><th>Mes</th><th class="td-num">Ventas</th><th class="td-num">Unidades</th><th class="td-num">Importe</th></tr>';
      var porMes = agregarPorMes(datosActual);
      var rows = [];
      for (var m = 1; m <= 12; m++) {
        rows.push('<tr><td>' + esc(MES_NOMBRE_FULL[m - 1]) + '</td><td class="td-num">—</td><td class="td-num">' + porMes[m].cantidad + '</td><td class="td-num">' + fmtMoneda(porMes[m].importe) + '</td></tr>');
      }
      tbody.innerHTML = rows.join('');
    }
  }

  function setStatus(msg, err) {
    var el = document.getElementById('dash-status-msg');
    if (el) { el.textContent = msg; el.style.color = err ? '#c62828' : ''; }
  }
  function setNavStatus(msg) {
    var el = document.getElementById('nav-status');
    if (el) el.textContent = msg;
  }

  function cargarDatos() {
    if (!periodStart || !periodEnd) return;
    var desde = toKey(periodStart);
    var hasta = toKey(periodEnd);
    setStatus('Cargando…');
    setNavStatus('Cargando…');
    requestRango(desde, hasta).then(function (data) {
      if (!data || !data.ok) {
        setStatus((data && data.error) || 'Error al cargar.', true);
        setNavStatus('Error');
        datosActual = [];
        datosAnterior = [];
        pintarTodo();
        return;
      }
      datosActual = Array.isArray(data.datos) ? data.datos : [];
      var diasConVentas = 0;
      var porDia = agregarPorDia(datosActual);
      for (var k in porDia) { if (porDia[k].ventas > 0) diasConVentas++; }
      setNavStatus('Período cargado - ' + diasConVentas + ' días con ventas');
      setStatus('');
      var prevMonthStart = addMonths(periodStart, -1);
      var prevMonthEnd = endOfMonth(prevMonthStart);
      var reqMesAnt = requestRango(toKey(prevMonthStart), toKey(prevMonthEnd)).then(function (r) {
        datosMesAnterior = (r && r.ok && r.datos) ? r.datos : [];
      }).catch(function () { datosMesAnterior = []; });
      if (tipoAnalisis === 'semanal') {
        var prevWeek = addWeeks(periodStart, -1);
        var prevEnd = addDays(prevWeek, 6);
        return requestRango(toKey(prevWeek), toKey(prevEnd)).then(function (prevData) {
          datosAnterior = (prevData && prevData.ok && prevData.datos) ? prevData.datos : [];
          return reqMesAnt;
        }).then(function () { pintarTodo(); }).catch(function () { datosAnterior = []; pintarTodo(); });
      }
      if (tipoAnalisis === 'mensual') {
        var prevMonth = addMonths(periodStart, -1);
        var prevEnd = endOfMonth(prevMonth);
        return requestRango(toKey(prevMonth), toKey(prevEnd)).then(function (prevData) {
          datosAnterior = (prevData && prevData.ok && prevData.datos) ? prevData.datos : [];
          return reqMesAnt;
        }).then(function () { pintarTodo(); }).catch(function () { datosAnterior = []; pintarTodo(); });
      }
      var prevYear = addYears(periodStart, -1);
      return requestRango(toKey(prevYear), toKey(endOfYear(prevYear))).then(function (prevData) {
        datosAnterior = (prevData && prevData.ok && prevData.datos) ? prevData.datos : [];
        return reqMesAnt;
      }).then(function () { pintarTodo(); }).catch(function () { datosAnterior = []; pintarTodo(); });
    }).catch(function (err) {
      setStatus('Error: ' + (err && err.message ? err.message : 'red'), true);
      setNavStatus('Error');
      datosActual = [];
      datosAnterior = [];
      datosMesAnterior = [];
      pintarTodo();
    });
  }

  function pintarTodo() {
    pintarTituloYSegment();
    pintarNav();
    pintarDiasSemana();
    pintarKPIs();
    var sub = document.getElementById('chart-subtitle');
    if (sub) sub.textContent = 'Rendimiento por día • ' + (periodStart && periodEnd ? fmtRango(periodStart, periodEnd) : '');
    pintarChartBarras();
    pintarDistribucion();
    pintarCrecimiento();
    pintarComparativaMeses();
    pintarTablaResumen();
  }

  function abrirModalDia(fechaKey) {
    var filas = (datosActual || []).filter(function (r) {
      var f = (r.FECHA_OPERATIVA != null ? String(r.FECHA_OPERATIVA) : '').trim().substring(0, 10);
      return f === fechaKey;
    });
    var overlay = document.getElementById('modal-dia-overlay');
    var titleEl = document.getElementById('modal-dia-title');
    var kpisEl = document.getElementById('modal-dia-kpis');
    var theadEl = document.getElementById('modal-dia-thead');
    var tbodyEl = document.getElementById('modal-dia-tbody');
    var emptyEl = document.getElementById('modal-dia-empty');
    if (!overlay || !titleEl) return;
    var d = fromKey(fechaKey);
    var tituloStr = d ? (DIA_ABREV[d.getDay()] + ' ' + d.getDate() + ' ' + MES_NOMBRE[d.getMonth()] + ' ' + d.getFullYear()) : fechaKey;
    titleEl.textContent = 'Detalle del día — ' + tituloStr;
    var totalImp = 0;
    var totalCant = 0;
    filas.forEach(function (r) {
      totalImp += parseNum(r.IMPORTE);
      totalCant += parseIntSafe(r['CANTIDAD-VENTAS']);
    });
    var ticketProm = filas.length > 0 ? totalImp / filas.length : 0;
    kpisEl.innerHTML = '<div class="dash-modal-kpi"><span class="dash-modal-kpi__label">Facturación</span><span class="dash-modal-kpi__value">' + fmtMoneda(totalImp) + '</span></div>' +
      '<div class="dash-modal-kpi"><span class="dash-modal-kpi__label">Operaciones</span><span class="dash-modal-kpi__value">' + filas.length + '</span></div>' +
      '<div class="dash-modal-kpi"><span class="dash-modal-kpi__label">Unidades</span><span class="dash-modal-kpi__value">' + totalCant + '</span></div>' +
      '<div class="dash-modal-kpi"><span class="dash-modal-kpi__label">Ticket promedio</span><span class="dash-modal-kpi__value">' + fmtMoneda(ticketProm) + '</span></div>';
    if (filas.length === 0) {
      theadEl.innerHTML = '';
      tbodyEl.innerHTML = '';
      if (emptyEl) { emptyEl.hidden = false; }
      if (document.querySelector('.dash-modal__table-wrap')) document.querySelector('.dash-modal__table-wrap').hidden = true;
    } else {
      if (emptyEl) emptyEl.hidden = true;
      var wrap = document.querySelector('.dash-modal__table-wrap');
      if (wrap) wrap.hidden = false;
      theadEl.innerHTML = '<tr><th>Hora</th><th>Turno</th><th>Tipo</th><th>Categoría</th><th>Cant.</th><th>Importe</th></tr>';
      tbodyEl.innerHTML = filas.map(function (r) {
        return '<tr><td>' + esc(r.HORA || '—') + '</td><td>' + esc(r.TURNO || '—') + '</td><td>' + esc(r['TIPO-OPERACION'] || '—') + '</td><td>' + esc(r.CATEGORIA || '—') + '</td><td>' + esc(String(parseIntSafe(r['CANTIDAD-VENTAS']))) + '</td><td>' + fmtMoneda(parseNum(r.IMPORTE)) + '</td></tr>';
      }).join('');
    }
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    setTimeout(function () {
      if (btnClose) btnClose.focus();
    }, 50);
  }
  function cerrarModalDia() {
    var overlay = document.getElementById('modal-dia-overlay');
    if (overlay) {
      overlay.hidden = true;
      overlay.setAttribute('aria-hidden', 'true');
    }
  }
  function isModalDiaAbierto() {
    var overlay = document.getElementById('modal-dia-overlay');
    return overlay && !overlay.hidden;
  }

  function navPrev() {
    if (!periodStart || !periodEnd) return;
    if (tipoAnalisis === 'semanal') {
      periodStart = addWeeks(periodStart, 1);
      periodEnd = addDays(periodStart, 6);
    } else if (tipoAnalisis === 'mensual') {
      periodStart = addMonths(periodStart, 1);
      periodEnd = endOfMonth(periodStart);
    } else {
      periodStart = addYears(periodStart, 1);
      periodEnd = endOfYear(periodStart);
    }
    cargarDatos();
  }

  function init() {
    setPeriodFromTipo();
    pintarTituloYSegment();
    pintarNav();
    document.getElementById('btn-semanal').addEventListener('click', function () { tipoAnalisis = 'semanal'; setPeriodFromTipo(); cargarDatos(); });
    document.getElementById('btn-mensual').addEventListener('click', function () { tipoAnalisis = 'mensual'; setPeriodFromTipo(); cargarDatos(); });
    document.getElementById('btn-anual').addEventListener('click', function () { tipoAnalisis = 'anual'; setPeriodFromTipo(); cargarDatos(); });
    document.getElementById('btn-prev').addEventListener('click', navPrev);
    document.getElementById('btn-next').addEventListener('click', navNext);
    document.getElementById('btn-periodo-actual').addEventListener('click', function () { setPeriodFromTipo(); cargarDatos(); });
    var dashDays = document.getElementById('dash-days');
    if (dashDays) {
      dashDays.addEventListener('click', function (e) {
        var card = e.target.closest('.dash-day--clickable');
        if (card && card.dataset.fecha) abrirModalDia(card.dataset.fecha);
      });
      dashDays.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var card = e.target.closest('.dash-day--clickable');
        if (card && card.dataset.fecha) { e.preventDefault(); abrirModalDia(card.dataset.fecha); }
      });
    }
    var btnClose = document.getElementById('modal-dia-close');
    var overlayModal = document.getElementById('modal-dia-overlay');
    var modalDia = document.getElementById('modal-dia');
    if (btnClose) btnClose.addEventListener('click', cerrarModalDia);
    if (overlayModal) {
      overlayModal.addEventListener('click', function (e) {
        if (e.target === overlayModal) cerrarModalDia();
      });
    }
    if (modalDia) {
      modalDia.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isModalDiaAbierto()) {
        e.preventDefault();
        cerrarModalDia();
      }
    });
    cargarDatos();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
