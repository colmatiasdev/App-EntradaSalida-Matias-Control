(function () {
  'use strict';

  var APP_CONFIG = window.APP_CONFIG;
  var APP_TABLES = window.APP_TABLES;
  var APP_SCRIPT_URL = APP_CONFIG && APP_CONFIG.APP_SCRIPT_URL;
  var CORS_PROXY = APP_CONFIG && APP_CONFIG.CORS_PROXY;
  var NOMBRES_MESES = (APP_TABLES && APP_TABLES.NOMBRES_HOJAS_MES) || [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];

  /** Columnas de ventas por mes (desde tables.js). Se usan para orden y normalización. */
  var COLUMNAS_VENTAS_DEF = (APP_TABLES && APP_TABLES.ENERO && APP_TABLES.ENERO.columns)
    ? APP_TABLES.ENERO.columns
    : ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO', 'ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO'];

  /** Orden de columnas: MES + columnas de la tabla del mes (según APP_TABLES). */
  var columnasTabla = ['MES'].concat(COLUMNAS_VENTAS_DEF);

  /** Columnas que no se muestran en la tabla. */
  var columnasOcultas = ['MES', 'AÑO', 'ID-VENTA', 'ID-PRODUCTO'];

  var allData = [];
  var filteredData = [];
  var currentColumnas = [];
  var currentNombreMes = '';
  var currentPage = 1;
  var pageSize = 25;

  /**
   * Normaliza una fila de venta para usar las claves esperadas (columnas de APP_TABLES).
   * Así se muestran correctamente los datos aunque el Sheet devuelva cabeceras con distinta capitalización.
   */
  function normalizarFilaVenta(fila, columnasEsperadas) {
    var cols = columnasEsperadas || COLUMNAS_VENTAS_DEF;
    var out = {};
    var keys = Object.keys(fila || {});
    cols.forEach(function (col) {
      var val = fila[col];
      if (val === undefined) {
        var colLower = col.toLowerCase();
        for (var k = 0; k < keys.length; k++) {
          if (keys[k].toLowerCase() === colLower) { val = fila[keys[k]]; break; }
        }
      }
      out[col] = val !== undefined && val !== null ? val : '';
    });
    return out;
  }

  function fmtMoney(n) {
    return '$\u00a0' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  /** Formatea fecha a dd-MM-YYYY (ej: 22-02-2026). Acepta ISO con hora (2026-02-22T03:00:00.000Z) o solo fecha. */
  function fmtFecha(val) {
    if (val === undefined || val === null || val === '') return '';
    var s = String(val).trim();
    if (!s) return '';
    if (s.indexOf('T') !== -1) s = s.substring(0, s.indexOf('T'));
    var parts = s.split(/[-/]/);
    if (parts.length === 3 && parts[0].length === 4 && parts[1].length <= 2 && parts[2].length <= 2) {
      var dd = ('0' + parts[2]).slice(-2);
      var mm = ('0' + parts[1]).slice(-2);
      var yyyy = parts[0];
      return dd + '-' + mm + '-' + yyyy;
    }
    var d = new Date(val);
    if (isNaN(d.getTime())) return s;
    var dd = ('0' + d.getDate()).slice(-2);
    var mm = ('0' + (d.getMonth() + 1)).slice(-2);
    var yyyy = d.getFullYear();
    return dd + '-' + mm + '-' + yyyy;
  }

  /** Formatea hora a HH:mm (24h). Acepta ISO (1899-12-30T14:35:48.000Z) o solo hora; usa hora local. */
  function fmtHora(val) {
    if (val === undefined || val === null || val === '') return '';
    var s = String(val).trim();
    if (!s) return '';
    var d = new Date(val);
    if (isNaN(d.getTime())) return s;
    var h = d.getHours();
    var m = d.getMinutes();
    return ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2);
  }

  function getMesActual() {
    if (!NOMBRES_MESES || !NOMBRES_MESES.length) return '';
    var idx = new Date().getMonth();
    return NOMBRES_MESES[idx] || NOMBRES_MESES[0];
  }

  function getAnioActual() {
    return new Date().getFullYear();
  }

  function getAniosDisponibles() {
    var actual = getAnioActual();
    var lista = [];
    for (var a = actual; a >= actual - 4; a--) lista.push(a);
    return lista;
  }

  function init() {
    var selectAnio = document.getElementById('listado-ventas-anio');
    var selectMes = document.getElementById('listado-ventas-mes');
    var btnCargar = document.getElementById('listado-ventas-btn-cargar');
    if (!selectMes || !btnCargar) return;

    if (selectAnio) {
      getAniosDisponibles().forEach(function (anio) {
        var opt = document.createElement('option');
        opt.value = anio;
        opt.textContent = anio;
        selectAnio.appendChild(opt);
      });
      selectAnio.value = getAnioActual();
    }

    if (NOMBRES_MESES && NOMBRES_MESES.length) {
      NOMBRES_MESES.forEach(function (nombre) {
        var opt = document.createElement('option');
        opt.value = nombre;
        opt.textContent = nombre;
        selectMes.appendChild(opt);
      });
      selectMes.value = getMesActual();
      cargarVentasDelMes();
    }

    btnCargar.addEventListener('click', cargarVentasDelMes);

    var tableSearch = document.getElementById('table-search');
    if (tableSearch) {
      tableSearch.addEventListener('input', function () {
        currentPage = 1;
        renderTable(this.value);
      });
    }

    var pageSizeSelect = document.getElementById('table-page-size');
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', function () {
        pageSize = parseInt(this.value, 10) || 25;
        currentPage = 1;
        renderTable(document.getElementById('table-search').value);
      });
    }

  }

  function mostrarMensaje(texto, esError) {
    var msg = document.getElementById('listado-ventas-mensaje');
    if (!msg) return;
    msg.textContent = texto;
    msg.className = 'listado-ventas__mensaje' + (esError ? ' listado-ventas__mensaje--error' : '');
  }

  function cargarVentasDelMes() {
    var selectAnio = document.getElementById('listado-ventas-anio');
    var selectMes = document.getElementById('listado-ventas-mes');
    var mes = selectMes ? selectMes.value : '';
    var anio = selectAnio ? parseInt(selectAnio.value, 10) : getAnioActual();
    if (!mes) {
      mostrarMensaje('Seleccione un mes.', true);
      return;
    }
    if (!APP_SCRIPT_URL) {
      mostrarMensaje('No está configurada la URL del Apps Script (APP_SCRIPT_URL).', true);
      return;
    }

    mostrarMensaje('Cargando ventas de ' + mes + '…');
    var payload = { accion: 'ventaLeer', hoja: mes };
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
          try { return JSON.parse(t); } catch (e) { return { ok: false, error: t }; };
        });
      })
      .then(function (data) {
        if (data && data.ok && Array.isArray(data.datos)) {
          var columnasMes = (APP_TABLES && APP_TABLES[mes] && APP_TABLES[mes].columns) ? APP_TABLES[mes].columns : COLUMNAS_VENTAS_DEF;
          var datos = data.datos
            .map(function (r) { return normalizarFilaVenta(r, columnasMes); })
            .filter(function (r) {
              var rowAnio = r.AÑO !== undefined && r.AÑO !== null && r.AÑO !== '' ? parseInt(String(r.AÑO), 10) : null;
              if (rowAnio === null) return true;
              return rowAnio === anio;
            });
          pintarTabla(mes, datos);
          mostrarMensaje('Se cargaron ' + datos.length + ' registro(s) de ' + mes + ' ' + anio + '.');
        } else {
          mostrarMensaje(data && (data.error || data.mensaje) || 'No se recibieron datos.', true);
          ocultarTabla();
        }
      })
      .catch(function (err) {
        var txt = err && err.message ? err.message : String(err);
        if (/failed to fetch|cors|blocked|access-control/i.test(txt)) {
          mostrarMensaje('No se pudo conectar con el servidor (CORS). Compruebe APP_SCRIPT_URL y despliegue.', true);
        } else {
          mostrarMensaje('Error: ' + txt, true);
        }
        ocultarTabla();
      });
  }

  function pintarTabla(nombreMes, datos) {
    var wrapper = document.getElementById('listado-ventas-tabla-wrapper');
    var subtitulo = document.getElementById('listado-ventas-subtitulo');
    var thead = document.getElementById('listado-ventas-thead');
    var tbody = document.getElementById('listado-ventas-tbody');
    if (!wrapper || !thead || !tbody) return;

    allData = datos;
    currentNombreMes = nombreMes;
    subtitulo.textContent = 'Ventas de ' + nombreMes;
    var tableSearch = document.getElementById('table-search');
    if (tableSearch) tableSearch.value = '';

    var columnasMes = (APP_TABLES && APP_TABLES[nombreMes] && APP_TABLES[nombreMes].columns) ? APP_TABLES[nombreMes].columns : COLUMNAS_VENTAS_DEF;
    var columnas = ['MES'].concat(columnasMes).filter(function (c) { return columnasOcultas.indexOf(c) === -1; });
    currentColumnas = columnas;

    thead.innerHTML = '';
    var trHead = document.createElement('tr');
    columnas.forEach(function (col) {
      var th = document.createElement('th');
      th.textContent = col === 'FECHA_OPERATIVA' ? 'FECHA' : col;
      if (['CANTIDAD', 'PRECIO', 'MONTO'].indexOf(col) !== -1) th.className = 'th-num';
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    currentPage = 1;
    var pageSizeEl = document.getElementById('table-page-size');
    if (pageSizeEl) pageSize = parseInt(pageSizeEl.value, 10) || 25;
    renderTable('', currentNombreMes, currentColumnas);
    wrapper.hidden = false;
  }

  function renderTable(searchTerm, nombreMes, columnas) {
    var tbody = document.getElementById('listado-ventas-tbody');
    var footer = document.getElementById('table-footer');
    var pagination = document.getElementById('table-pagination');
    var paginationInfo = document.getElementById('table-pagination-info');
    var paginationPages = document.getElementById('table-pagination-pages');
    if (!tbody || !footer) return;

    var s = (searchTerm || '').toLowerCase().trim();
    filteredData = s
      ? allData.filter(function (r) {
          return Object.values(r).some(function (v) {
            return String(v).toLowerCase().indexOf(s) !== -1;
          });
        })
      : allData;

    if (!columnas) columnas = currentColumnas.length ? currentColumnas : columnasTabla;
    if (!nombreMes) nombreMes = currentNombreMes;

    var totalFilt = filteredData.reduce(function (s, r) {
      return s + (parseFloat(r.MONTO) || 0);
    }, 0);

    var totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    var start = (currentPage - 1) * pageSize;
    var end = Math.min(start + pageSize, filteredData.length);
    var pageData = filteredData.slice(start, end);

    tbody.innerHTML = '';
    pageData.forEach(function (fila) {
      var tr = document.createElement('tr');
      columnas.forEach(function (col) {
        var td = document.createElement('td');
        var val = fila[col];
        if (val === undefined || val === null) val = '';
        if (col === 'MES') val = nombreMes;
        if (col === 'FECHA_OPERATIVA') val = fmtFecha(val);
        if (col === 'HORA') val = fmtHora(val);
        if (col === 'ID-VENTA') {
          td.className = 'id-venta';
          td.textContent = val;
        } else if (col === 'CATEGORIA') {
          var cat = String(val).toLowerCase();
          var badgeClass = 'badge-cat';
          if (cat.indexOf('promo') !== -1) badgeClass += ' badge-cat--promos';
          else if (cat.indexOf('bebida') !== -1) badgeClass += ' badge-cat--bebida';
          else if (cat.indexOf('empanada') !== -1) badgeClass += ' badge-cat--empanada';
          else if (cat.indexOf('postre') !== -1) badgeClass += ' badge-cat--postre';
          td.innerHTML = '<span class="' + badgeClass + '">' + (val || '') + '</span>';
        } else if (col === 'MONTO' && typeof val === 'number') {
          td.className = 'td-num td-monto';
          td.textContent = fmtMoney(val);
        } else if (['CANTIDAD', 'PRECIO'].indexOf(col) !== -1 && typeof val === 'number') {
          td.className = 'td-num';
          td.textContent = Number(val).toLocaleString('es-AR');
        } else {
          td.textContent = val;
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    footer.innerHTML =
      '<span>Mostrando <strong>' + (filteredData.length ? start + 1 : 0) + '-' + end + '</strong> de ' + filteredData.length + ' registros' +
      (allData.length !== filteredData.length ? ' (filtrado de ' + allData.length + ')' : '') + '</span>' +
      '<span>Subtotal: <strong>' + fmtMoney(totalFilt) + '</strong></span>';

    if (pagination && paginationInfo && paginationPages) {
      var firstBtn = document.getElementById('table-pagination-first');
      var prevBtn = document.getElementById('table-pagination-prev');
      var nextBtn = document.getElementById('table-pagination-next');
      var lastBtn = document.getElementById('table-pagination-last');

      paginationInfo.textContent = 'Página ' + currentPage + ' de ' + totalPages;
      paginationPages.textContent = currentPage + ' / ' + totalPages;

      if (firstBtn) {
        firstBtn.disabled = currentPage <= 1;
        firstBtn.onclick = function () { currentPage = 1; renderTable(document.getElementById('table-search').value); };
      }
      if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
        prevBtn.onclick = function () { currentPage = currentPage - 1; renderTable(document.getElementById('table-search').value); };
      }
      if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.onclick = function () { currentPage = currentPage + 1; renderTable(document.getElementById('table-search').value); };
      }
      if (lastBtn) {
        lastBtn.disabled = currentPage >= totalPages;
        lastBtn.onclick = function () { currentPage = totalPages; renderTable(document.getElementById('table-search').value); };
      }
    }
  }

  function ocultarTabla() {
    var wrapper = document.getElementById('listado-ventas-tabla-wrapper');
    if (wrapper) wrapper.hidden = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
