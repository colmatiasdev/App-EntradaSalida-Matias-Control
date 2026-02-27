/**
 * Cierre operaciones del día — 2H Market
 * Muestra el día seleccionado (por defecto hoy) y permite moverse entre días.
 * Resumen: Compras Panadería (hoja del mes), Ventas Market, Gastos de Salida (OPERACIONES-GENERALES).
 */
(function () {
  'use strict';

  var APP_CONFIG = window.APP_CONFIG;
  var APP_TABLES = window.APP_TABLES;
  var APP_SCRIPT_URL = APP_CONFIG && APP_CONFIG.APP_SCRIPT_URL;
  var CORS_PROXY = APP_CONFIG && APP_CONFIG.CORS_PROXY;

  var NOMBRES_MES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  var fechaActual = ''; // YYYY-MM-DD

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function hoyKey() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function dateFromKey(key) {
    if (!key || key.length < 10) return null;
    var d = new Date(key + 'T12:00:00');
    return isNaN(d.getTime()) ? null : d;
  }

  function keyFromDate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function sumarDias(key, delta) {
    var d = dateFromKey(key);
    if (!d) return key;
    d.setDate(d.getDate() + delta);
    return keyFromDate(d);
  }

  function formatearFechaCorta(key) {
    var d = dateFromKey(key);
    if (!d) return key;
    var dia = DIAS_SEMANA[d.getDay()];
    return dia + ' ' + d.getDate() + ' ' + NOMBRES_MES[d.getMonth()];
  }

  function formatearFechaNum(key) {
    var d = dateFromKey(key);
    if (!d) return key;
    return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function nombreMesDesdeKey(key) {
    if (!key || key.length < 10) return '';
    var mes = parseInt(key.substring(5, 7), 10);
    if (isNaN(mes) || mes < 1 || mes > 12) return '';
    return NOMBRES_MES[mes - 1];
  }

  function formatImporte(n) {
    return '$ ' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function escapeHtml(s) {
    if (s === undefined || s === null) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  /** Devuelve { color: '#hex', etiqueta: 'Nombre' } para la columna USUARIO según APP_CONFIG.USUARIO_ETIQUETAS, o null. */
  function estiloUsuario(usuario) {
    var etiquetas = APP_CONFIG && APP_CONFIG.USUARIO_ETIQUETAS;
    if (!etiquetas || !usuario) return null;
    var key = String(usuario).trim().toUpperCase().replace(/\s+/g, '-');
    if (key.indexOf('USR-') !== 0 && key.length > 0) key = 'USR-' + key;
    var info = etiquetas[key];
    if (info && (info.color || info.etiqueta)) return { color: info.color || null, etiqueta: info.etiqueta || null };
    var nombreLower = String(usuario).toLowerCase().trim();
    for (var k in etiquetas) {
      var e = etiquetas[k];
      if (e && e.etiqueta && String(e.etiqueta).toLowerCase() === nombreLower)
        return { color: e.color || null, etiqueta: e.etiqueta || null };
    }
    return null;
  }

  /** Genera el HTML de la celda USUARIO con color y etiqueta si están definidos. */
  function celdaUsuario(r) {
    var val = r.USUARIO != null ? String(r.USUARIO).trim() : '';
    var estilo = estiloUsuario(val);
    var texto = (estilo && estilo.etiqueta) ? estilo.etiqueta : (val || '—');
    var style = (estilo && estilo.color) ? ' style="color:' + escapeHtml(estilo.color) + ';font-weight:600;"' : '';
    return '<td class="td-usuario"' + style + '>' + escapeHtml(texto) + '</td>';
  }

  function setMensaje(texto, esError) {
    var el = document.getElementById('status-msg');
    if (el) {
      el.textContent = texto;
      el.classList.toggle('error', !!esError);
    }
  }

  function setCargando(cargando) {
    var el = document.getElementById('status-pill');
    var txt = document.getElementById('status-text');
    if (el) el.classList.toggle('loading', cargando);
    if (txt) txt.textContent = cargando ? 'Cargando…' : 'Listo';
  }

  function pintarCabeceraDia() {
    var labelEl = document.getElementById('day-label');
    var dateEl = document.getElementById('day-date');
    var badgeEl = document.getElementById('badge-hoy');
    if (!labelEl || !dateEl) return;
    labelEl.textContent = formatearFechaCorta(fechaActual);
    dateEl.textContent = formatearFechaNum(fechaActual);
    if (badgeEl) badgeEl.hidden = fechaActual !== hoyKey();
  }

  function pintarTablaCompras(datos) {
    var vacioEl = document.getElementById('compras-vacio');
    var wrapEl = document.getElementById('compras-wrap');
    var theadEl = document.getElementById('compras-thead');
    var tbodyEl = document.getElementById('compras-tbody');
    var tfootEl = document.getElementById('compras-tfoot');
    var mesEl = document.getElementById('mes-compras');
    if (!vacioEl || !wrapEl || !theadEl || !tbodyEl || !tfootEl) return;

    if (mesEl) mesEl.textContent = '(' + nombreMesDesdeKey(fechaActual) + ')';

    if (!datos || datos.length === 0) {
      vacioEl.hidden = false;
      wrapEl.hidden = true;
      return;
    }
    vacioEl.hidden = true;
    wrapEl.hidden = false;

    theadEl.innerHTML = '<tr><th>HORA</th><th>NOMBRE-APELLIDO</th><th>PRODUCTO</th><th class="th-num">CANT.</th><th class="th-num">MONTO</th><th>USUARIO</th></tr>';
    tbodyEl.innerHTML = '';
    var total = 0;
    datos.forEach(function (r) {
      var monto = parseFloat(r.MONTO);
      if (!isNaN(monto)) total += monto;
      tbodyEl.innerHTML +=
        '<tr><td>' + escapeHtml(String(r.HORA || '—')) + '</td>' +
        '<td>' + escapeHtml(String(r['NOMBRE-APELLIDO'] || '')) + '</td>' +
        '<td>' + escapeHtml(String(r.PRODUCTO || '')) + '</td>' +
        '<td class="td-num">' + escapeHtml(String(r.CANTIDAD != null ? r.CANTIDAD : '')) + '</td>' +
        '<td class="td-num">' + formatImporte(monto || 0) + '</td>' +
        celdaUsuario(r) + '</tr>';
    });
    tfootEl.innerHTML = '<tr><td colspan="5"><strong>Total Compras Panadería</strong></td><td class="td-num td-total">' + formatImporte(total) + '</td></tr>';
  }

  function pintarTablaVentas(datos) {
    var vacioEl = document.getElementById('ventas-vacio');
    var wrapEl = document.getElementById('ventas-wrap');
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

    theadEl.innerHTML = '<tr><th>HORA</th><th>NOMBRE-APELLIDO</th><th>PRODUCTO</th><th class="th-num">CANT.</th><th class="th-num">MONTO</th><th>USUARIO</th></tr>';
    tbodyEl.innerHTML = '';
    var total = 0;
    datos.forEach(function (r) {
      var monto = parseFloat(r.MONTO);
      if (!isNaN(monto)) total += monto;
      tbodyEl.innerHTML +=
        '<tr><td>' + escapeHtml(String(r.HORA || '—')) + '</td>' +
        '<td>' + escapeHtml(String(r['NOMBRE-APELLIDO'] || '')) + '</td>' +
        '<td>' + escapeHtml(String(r.PRODUCTO || '')) + '</td>' +
        '<td class="td-num">' + escapeHtml(String(r.CANTIDAD != null ? r.CANTIDAD : '')) + '</td>' +
        '<td class="td-num">' + formatImporte(monto || 0) + '</td>' +
        celdaUsuario(r) + '</tr>';
    });
    tfootEl.innerHTML = '<tr><td colspan="5"><strong>Total Ventas Market</strong></td><td class="td-num td-total">' + formatImporte(total) + '</td></tr>';
  }

  function pintarTablaGastos(datos) {
    var vacioEl = document.getElementById('gastos-vacio');
    var wrapEl = document.getElementById('gastos-wrap');
    var theadEl = document.getElementById('gastos-thead');
    var tbodyEl = document.getElementById('gastos-tbody');
    var tfootEl = document.getElementById('gastos-tfoot');
    if (!vacioEl || !wrapEl || !theadEl || !tbodyEl || !tfootEl) return;

    if (!datos || datos.length === 0) {
      vacioEl.hidden = false;
      wrapEl.hidden = true;
      return;
    }
    vacioEl.hidden = true;
    wrapEl.hidden = false;

    theadEl.innerHTML = '<tr><th>HORA</th><th>TIPO-OPERACION</th><th>DESCRIPCION</th><th class="th-num">IMPORTE</th><th>USUARIO</th></tr>';
    tbodyEl.innerHTML = '';
    var total = 0;
    datos.forEach(function (r) {
      var imp = parseFloat(r.IMPORTE);
      if (!isNaN(imp)) total += imp;
      tbodyEl.innerHTML +=
        '<tr><td>' + escapeHtml(String(r.HORA || '—')) + '</td>' +
        '<td>' + escapeHtml(String(r['TIPO-OPERACION'] || '')) + '</td>' +
        '<td>' + escapeHtml(String(r.DESCRIPCION || '')) + '</td>' +
        '<td class="td-num">' + formatImporte(imp || 0) + '</td>' +
        celdaUsuario(r) + '</tr>';
    });
    tfootEl.innerHTML = '<tr><td colspan="4"><strong>Total Gastos de Salida</strong></td><td class="td-num td-total">' + formatImporte(total) + '</td></tr>';
  }

  function sumarMonto(datos) {
    var t = 0;
    if (!datos || !datos.length) return t;
    datos.forEach(function (r) {
      var n = parseFloat(r.MONTO);
      if (!isNaN(n)) t += n;
    });
    return t;
  }

  function sumarImporte(datos) {
    var t = 0;
    if (!datos || !datos.length) return t;
    datos.forEach(function (r) {
      var n = parseFloat(r.IMPORTE);
      if (!isNaN(n)) t += n;
    });
    return t;
  }

  function pintarResumenTotales(totalCompras, totalVentas, totalGastos) {
    var elCompras = document.getElementById('resumen-compras');
    var elVentas = document.getElementById('resumen-ventas');
    var elGastos = document.getElementById('resumen-gastos');
    var elResultado = document.getElementById('resumen-resultado');
    if (!elCompras || !elVentas || !elGastos || !elResultado) return;
    elCompras.textContent = formatImporte(totalCompras);
    elVentas.textContent = formatImporte(totalVentas);
    elGastos.textContent = formatImporte(totalGastos);
    var resultado = totalCompras - (totalVentas + totalGastos);
    elResultado.textContent = formatImporte(Math.abs(resultado));
    elResultado.classList.remove('resumen-totales__resultado--rojo', 'resumen-totales__resultado--verde', 'resumen-totales__resultado--neutro');
    if (resultado > 0) {
      elResultado.classList.add('resumen-totales__resultado--rojo');
    } else if (resultado < 0) {
      elResultado.classList.add('resumen-totales__resultado--verde');
    } else {
      elResultado.classList.add('resumen-totales__resultado--neutro');
    }
  }

  function cargarDatos() {
    if (!APP_SCRIPT_URL) {
      setMensaje('No está configurada APP_SCRIPT_URL en config.js.', true);
      setCargando(false);
      pintarTablaCompras([]);
      pintarTablaVentas([]);
      pintarTablaGastos([]);
      pintarResumenTotales(0, 0, 0);
      return;
    }
    setMensaje('Cargando cierre del ' + formatearFechaNum(fechaActual) + '…');
    setCargando(true);
    var url = (CORS_PROXY && CORS_PROXY.length) ? CORS_PROXY + encodeURIComponent(APP_SCRIPT_URL) : APP_SCRIPT_URL;
    fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(JSON.stringify({ accion: 'cierreOperacionesDiaLeer', fecha: fechaActual }))
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
          setMensaje(data && (data.error || data.mensaje) || 'Error al cargar.', true);
          pintarTablaCompras([]);
          pintarTablaVentas([]);
          pintarTablaGastos([]);
          pintarResumenTotales(0, 0, 0);
          return;
        }
        setMensaje('Cierre del ' + formatearFechaNum(data.fecha || fechaActual) + ' cargado.');
        var compras = data.comprasPanaderia || [];
        var ventas = data.ventasMarket || [];
        var gastos = data.gastosSalida || [];
        pintarTablaCompras(compras);
        pintarTablaVentas(ventas);
        pintarTablaGastos(gastos);
        pintarResumenTotales(sumarMonto(compras), sumarMonto(ventas), sumarImporte(gastos));
      })
      .catch(function (err) {
        setCargando(false);
        setMensaje('Error: ' + (err && err.message ? err.message : String(err)), true);
        pintarTablaCompras([]);
        pintarTablaVentas([]);
        pintarTablaGastos([]);
        pintarResumenTotales(0, 0, 0);
      });
  }

  function render() {
    pintarCabeceraDia();
    cargarDatos();
  }

  function init() {
    fechaActual = hoyKey();
    var btnPrev = document.getElementById('btn-prev');
    var btnNext = document.getElementById('btn-next');
    var btnHoy = document.getElementById('btn-hoy');

    if (btnPrev) {
      btnPrev.addEventListener('click', function () {
        fechaActual = sumarDias(fechaActual, -1);
        render();
      });
    }
    if (btnNext) {
      btnNext.addEventListener('click', function () {
        fechaActual = sumarDias(fechaActual, 1);
        render();
      });
    }
    if (btnHoy) {
      btnHoy.addEventListener('click', function () {
        fechaActual = hoyKey();
        render();
      });
    }

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
