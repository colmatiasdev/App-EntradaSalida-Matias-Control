(function () {
  'use strict';

  var APP_SCRIPT_URL = window.APP_CONFIG && window.APP_CONFIG.APP_SCRIPT_URL;
  var CORS_PROXY = window.APP_CONFIG && window.APP_CONFIG.CORS_PROXY;

  function cargarComboTipoOperacion() {
    var select = document.getElementById('gastos-salida-tipo-operacion');
    if (!select) return;
    if (!APP_SCRIPT_URL) {
      select.innerHTML = '<option value="">Configurar APP_SCRIPT_URL</option>';
      return;
    }
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
            var v = (fila['TIPO-OPERACION'] !== undefined && fila['TIPO-OPERACION'] !== null)
              ? String(fila['TIPO-OPERACION']).trim() : '';
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
