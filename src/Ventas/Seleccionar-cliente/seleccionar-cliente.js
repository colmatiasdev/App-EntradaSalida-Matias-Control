(function () {
  'use strict';

  var APP_SCRIPT_URL = window.APP_CONFIG && window.APP_CONFIG.APP_SCRIPT_URL;
  var CORS_PROXY = window.APP_CONFIG && window.APP_CONFIG.CORS_PROXY;
  /** Clave en sessionStorage donde se guarda el cliente elegido para la venta. */
  var STORAGE_KEY_CLIENTE = 'APP_CLIENTE_VENTA';

  function cargarClientes() {
    var mensaje = document.getElementById('seleccionar-cliente-mensaje');
    var lista = document.getElementById('seleccionar-cliente-lista');
    if (!APP_SCRIPT_URL) {
      mensaje.textContent = 'Configura APP_SCRIPT_URL en config.js.';
      return;
    }
    var payload = { accion: 'clienteLeer' };
    var bodyForm = 'data=' + encodeURIComponent(JSON.stringify(payload));
    var url = (CORS_PROXY && CORS_PROXY.length) ? CORS_PROXY + encodeURIComponent(APP_SCRIPT_URL) : APP_SCRIPT_URL;
    fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyForm
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var ct = res.headers.get('Content-Type') || '';
        if (ct.indexOf('json') !== -1) return res.json();
        return res.text().then(function (t) {
          try { return JSON.parse(t); } catch (e) { return { ok: false, datos: [] }; }
        });
      })
      .then(function (data) {
        if (!data || !data.ok || !Array.isArray(data.datos)) {
          mensaje.textContent = 'No se pudieron cargar los clientes.';
          return;
        }
        var clientes = data.datos.filter(function (c) {
          var h = (c.HABILITADO || '').toString().trim().toUpperCase().replace(/Í/g, 'I');
          return h === 'SI';
        });
        mensaje.textContent = '';
        if (clientes.length === 0) {
          mensaje.textContent = 'No hay clientes habilitados.';
          return;
        }
        lista.innerHTML = '';
        clientes.forEach(function (cliente) {
          var li = document.createElement('li');
          li.className = 'seleccionar-cliente__item';
          var nombre = (cliente['NOMBRE-APELLIDO'] || '').trim() || '(Sin nombre)';
          var tipoLista = (cliente['TIPO-LISTA-PRECIO'] || '').trim() || '—';
          li.innerHTML =
            '<span class="seleccionar-cliente__nombre">' + escapeHtml(nombre) + '</span>' +
            '<span class="seleccionar-cliente__tipo">' + escapeHtml(tipoLista) + '</span>' +
            '<a href="../Nueva-venta/Nueva-venta.html" class="seleccionar-cliente__btn" data-cliente>Hacer venta</a>';
          var btn = li.querySelector('[data-cliente]');
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            try {
              sessionStorage.setItem(STORAGE_KEY_CLIENTE, JSON.stringify(cliente));
            } catch (err) {}
            window.location.href = btn.getAttribute('href');
          });
          lista.appendChild(li);
        });
      })
      .catch(function () {
        mensaje.textContent = 'No se pudieron cargar los clientes. Revisa APP_SCRIPT_URL y la hoja CLIENTES.';
      });
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function init() {
    cargarClientes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
