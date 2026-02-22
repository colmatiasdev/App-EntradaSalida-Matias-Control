(function () {
  'use strict';

  var TABLA = window.APP_TABLES && window.APP_TABLES.PRODUCTOS;
  var TABLA_VENTAS = window.APP_TABLES && window.APP_TABLES.VENTAS;
  var APP_SCRIPT_URL = window.APP_CONFIG && window.APP_CONFIG.APP_SCRIPT_URL;
  var CORS_PROXY = window.APP_CONFIG && window.APP_CONFIG.CORS_PROXY;
  var HOJA_PRODUCTOS = (window.APP_CONFIG && window.APP_CONFIG.HOJA_PRODUCTOS) || 'PRODUCTOS';
  var NEGOCIO = window.APP_NEGOCIO;
  var STORAGE_KEY_CLIENTE = 'APP_CLIENTE_VENTA';
  var clienteSeleccionado = null;
  var productos = [];
  var carrito = [];

  function claveEnFila(fila, columna) {
    if (fila[columna] !== undefined && fila[columna] !== null) return fila[columna];
    var norm = (columna || '').trim().toUpperCase();
    for (var k in fila) {
      if (fila.hasOwnProperty(k) && (k || '').trim().toUpperCase() === norm) return fila[k];
    }
    return undefined;
  }

  function normalizarProductos(filas) {
    if (!TABLA || !TABLA.columns || !filas.length) return [];
    var cols = TABLA.columns;
    return filas
      .filter(function (f) {
        var hab = (claveEnFila(f, 'HABILITADO') || '').toString().trim().toUpperCase().replace(/Í/g, 'I');
        return hab === 'SI';
      })
      .map(function (f) {
        var p = {};
        cols.forEach(function (c) {
          var val = claveEnFila(f, c);
          if (c === 'PRECIO-MAYORISTA' || c === 'PRECIO-DISTRIBUIDOR') {
            p[c] = Number(val) || 0;
          } else {
            p[c] = val !== undefined && val !== null ? String(val).trim() : '';
          }
        });
        var precioMay = Number(claveEnFila(f, 'PRECIO-MAYORISTA')) || 0;
        var precioDist = Number(claveEnFila(f, 'PRECIO-DISTRIBUIDOR')) || 0;
        p.PRECIO = precioMay || precioDist;
        return p;
      });
  }

  function getPrecioParaCliente(p) {
    if (!clienteSeleccionado) return p.PRECIO || p['PRECIO-MAYORISTA'] || 0;
    var tipo = (clienteSeleccionado['TIPO-LISTA-PRECIO'] || '').toUpperCase();
    if (tipo === 'DISTRIBUIDOR' && (p['PRECIO-DISTRIBUIDOR'] !== undefined && p['PRECIO-DISTRIBUIDOR'] !== ''))
      return Number(p['PRECIO-DISTRIBUIDOR']) || 0;
    return Number(p['PRECIO-MAYORISTA']) || Number(p['PRECIO-DISTRIBUIDOR']) || 0;
  }

  function aplicarPreciosSegunCliente() {
    productos.forEach(function (p) {
      p.PRECIO = getPrecioParaCliente(p);
    });
  }

  function llenarSelectCategoria() {
    var selectCat = document.getElementById('nueva-venta-categoria');
    if (!selectCat) return;
    selectCat.innerHTML = '<option value="">Todas</option>';
    // Categorías definidas en config (configurable); si no hay, se derivan de los productos cargados
    var categoriasConfig = (window.APP_CONFIG && window.APP_CONFIG.CATEGORIAS) || [];
    var categorias = categoriasConfig.length
      ? categoriasConfig.filter(function (c) { return c != null && String(c).trim() !== ''; })
      : [];
    if (categorias.length === 0) {
      productos.forEach(function (p) {
        var cat = (p.CATEGORIA || '').trim();
        if (cat && categorias.indexOf(cat) === -1) categorias.push(cat);
      });
      categorias.sort();
    }
    categorias.forEach(function (cat) {
      var opt = document.createElement('option');
      opt.value = typeof cat === 'string' ? cat : String(cat);
      opt.textContent = opt.value;
      selectCat.appendChild(opt);
    });
  }

  function cargarProductos() {
    var mensaje = document.getElementById('nueva-venta-mensaje');
    if (!TABLA) {
      mensaje.textContent = 'Falta configurar Tables (PRODUCTOS).';
      return;
    }

    function aplicarProductosYFiltro(filas) {
      productos = normalizarProductos(filas);
      aplicarPreciosSegunCliente();
      mensaje.textContent = '';
      llenarSelectCategoria();
      pintarListado();
    }

    // Los productos se consumen solo desde la hoja PRODUCTOS vía Apps Script (productoLeer).
    if (!APP_SCRIPT_URL) {
      mensaje.textContent = 'Configura APP_SCRIPT_URL en config.js. Los productos se cargan de la hoja "' + HOJA_PRODUCTOS + '" del Sheet.';
      return;
    }
    var payload = { accion: 'productoLeer' };
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
        if (data && data.ok && Array.isArray(data.datos)) {
          aplicarProductosYFiltro(data.datos);
        } else {
          throw new Error(data && data.error ? data.error : 'Sin datos');
        }
      })
      .catch(function (err) {
        mensaje.textContent = 'No se pudieron cargar los productos desde la hoja "' + HOJA_PRODUCTOS + '". Revisa APP_SCRIPT_URL y que el Sheet tenga la hoja "' + HOJA_PRODUCTOS + '".';
      });
  }

  function pintarListado() {
    var contenedor = document.getElementById('nueva-venta-productos');
    if (!contenedor) return;
    var catFiltro = (document.getElementById('nueva-venta-categoria') || {}).value || '';
    var catFiltroNorm = (catFiltro || '').trim().toUpperCase();
    // Agrupar por categoría (clave normalizada en mayúsculas para que coincida con el combo)
    var porCategoria = {};
    productos.forEach(function (p) {
      var c = (p.CATEGORIA || '').trim() || 'Otros';
      var cNorm = c.toUpperCase();
      if (!porCategoria[cNorm]) porCategoria[cNorm] = { label: c, items: [] };
      porCategoria[cNorm].items.push(p);
    });
    var categoriasOrden = Object.keys(porCategoria).sort();
    if (catFiltroNorm) {
      categoriasOrden = categoriasOrden.filter(function (c) { return c === catFiltroNorm; });
    }
    contenedor.innerHTML = '';
    categoriasOrden.forEach(function (categoriaNorm) {
      var grupo = porCategoria[categoriaNorm];
      var productosCat = grupo ? grupo.items : [];
      var labelCategoria = grupo ? grupo.label : categoriaNorm;
      var seccion = document.createElement('div');
      seccion.className = 'nueva-venta__grupo';
      seccion.innerHTML = '<h3 class="nueva-venta__grupo-titulo">' + escapeHtml(labelCategoria) + '</h3>';
      var ul = document.createElement('ul');
      ul.className = 'nueva-venta__productos';
      productosCat.forEach(function (p) {
        var li = document.createElement('li');
        li.className = 'nueva-venta__item';
        var nombre = (p['NOMBRE-PRODUCTO'] || '').trim() || '(Sin nombre)';
        var precio = getPrecioParaCliente(p);
        var idProd = (p[TABLA.pk] || '').toString().trim();
        li.innerHTML =
          '<span class="nueva-venta__item-nombre">' + escapeHtml(nombre) + '</span>' +
          '<span class="nueva-venta__item-precio">' + formatearPrecio(precio) + '</span>' +
          '<button type="button" class="nueva-venta__btn-add" data-id="' + escapeHtml(idProd) + '">Agregar</button>';
        li.querySelector('.nueva-venta__btn-add').addEventListener('click', function () {
          agregarAlCarrito(p);
        });
        ul.appendChild(li);
      });
      seccion.appendChild(ul);
      contenedor.appendChild(seccion);
    });
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function formatearPrecio(n) {
    return '$ ' + Number(n).toLocaleString('es-AR');
  }

  function agregarAlCarrito(producto) {
    var pk = TABLA.pk;
    var id = producto[pk];
    var item = carrito.find(function (x) { return x.producto[pk] === id; });
    if (item) {
      item.cantidad += 1;
    } else {
      var p = producto;
      var precioEfectivo = getPrecioParaCliente(p);
      if (p.PRECIO !== precioEfectivo) {
        p = Object.assign({}, p);
        p.PRECIO = precioEfectivo;
      }
      carrito.push({ producto: p, cantidad: 1 });
    }
    pintarResumen();
  }

  function quitarDelCarrito(idProducto) {
    carrito = carrito.filter(function (x) { return x.producto[TABLA.pk] !== idProducto; });
    pintarResumen();
  }

  function actualizarCantidad(idProducto, cantidad) {
    var n = parseInt(cantidad, 10);
    if (isNaN(n) || n < 1) n = 1;
    var item = carrito.find(function (x) { return x.producto[TABLA.pk] === idProducto; });
    if (item) item.cantidad = n;
    pintarResumen();
  }

  function pintarResumen() {
    var vacio = document.getElementById('nueva-venta-resumen-vacio');
    var tabla = document.getElementById('nueva-venta-tabla');
    var tbody = document.getElementById('nueva-venta-tabla-body');
    var totalEl = document.getElementById('nueva-venta-total');
    var btnGuardar = document.getElementById('nueva-venta-btn-guardar');
    var msgGuardar = document.getElementById('nueva-venta-guardar-msg');
    if (msgGuardar) { msgGuardar.textContent = ''; msgGuardar.className = 'nueva-venta__guardar-msg'; }
    if (carrito.length === 0) {
      vacio.hidden = false;
      tabla.hidden = true;
      totalEl.textContent = '0';
      if (btnGuardar) btnGuardar.disabled = true;
      return;
    }
    vacio.hidden = true;
    tabla.hidden = false;
    if (btnGuardar) btnGuardar.disabled = false;
    tbody.innerHTML = '';
    var total = 0;
    carrito.forEach(function (item) {
      var id = item.producto[TABLA.pk];
      var subtotal = item.producto.PRECIO * item.cantidad;
      total += subtotal;
      var tr = document.createElement('tr');
      var qty = item.cantidad;
      var trashSvg = '<svg class="nueva-venta__icon-trash" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
      tr.innerHTML =
        '<td>' + escapeHtml(item.producto['NOMBRE-PRODUCTO']) + '</td>' +
        '<td class="nueva-venta__th-num">' + formatearPrecio(item.producto.PRECIO) + '</td>' +
        '<td class="nueva-venta__th-num nueva-venta__td-qty">' +
        '<div class="nueva-venta__qty-wrap">' +
        '<button type="button" class="nueva-venta__qty-btn nueva-venta__qty-minus" data-id="' + escapeHtml(id) + '" aria-label="Disminuir cantidad">−</button>' +
        '<input type="number" min="1" value="' + qty + '" class="nueva-venta__input-qty" data-id="' + escapeHtml(id) + '" aria-label="Cantidad">' +
        '<button type="button" class="nueva-venta__qty-btn nueva-venta__qty-plus" data-id="' + escapeHtml(id) + '" aria-label="Aumentar cantidad">+</button>' +
        '</div></td>' +
        '<td class="nueva-venta__th-num nueva-venta__subtotal">' + formatearPrecio(subtotal) + '</td>' +
        '<td><button type="button" class="nueva-venta__btn-quitar" data-id="' + escapeHtml(id) + '" aria-label="Quitar del resumen" title="Quitar">' + trashSvg + '</button></td>';
      var inputQty = tr.querySelector('.nueva-venta__input-qty');
      var btnMinus = tr.querySelector('.nueva-venta__qty-minus');
      var btnPlus = tr.querySelector('.nueva-venta__qty-plus');
      function syncQty() {
        var val = parseInt(inputQty.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        inputQty.value = val;
        actualizarCantidad(id, val);
        btnMinus.disabled = val <= 1;
      }
      inputQty.addEventListener('input', function () { syncQty(); });
      inputQty.addEventListener('change', function () { syncQty(); });
      btnMinus.addEventListener('click', function () {
        var v = parseInt(inputQty.value, 10) || 1;
        if (v > 1) { inputQty.value = v - 1; syncQty(); }
      });
      btnPlus.addEventListener('click', function () {
        var v = parseInt(inputQty.value, 10) || 0;
        inputQty.value = v + 1;
        syncQty();
      });
      btnMinus.disabled = qty <= 1;
      tr.querySelector('.nueva-venta__btn-quitar').addEventListener('click', function () {
        quitarDelCarrito(id);
      });
      tbody.appendChild(tr);
    });
    totalEl.textContent = formatearPrecio(total);
  }

  function getTotalVenta() {
    var t = 0;
    carrito.forEach(function (item) {
      t += item.producto.PRECIO * item.cantidad;
    });
    return t;
  }

  function guardarVenta() {
    if (carrito.length === 0) return;
    if (!APP_SCRIPT_URL) {
      mostrarMensajeGuardar('Configura APP_SCRIPT_URL en config.js', true);
      return;
    }
    if (!NEGOCIO || !NEGOCIO.getFechaOperativa) {
      mostrarMensajeGuardar('Falta cargar negocio.js', true);
      return;
    }
    var fechaOp = NEGOCIO.getFechaOperativa();
    var nombreHoja = NEGOCIO.getNombreHojaMes(fechaOp);
    var total = getTotalVenta();
    var ahora = new Date();
    var hora = ahora.getHours() + ':' + (ahora.getMinutes() < 10 ? '0' : '') + ahora.getMinutes();
    var idVenta = 'V-' + Date.now();
    var nombreApellido = clienteSeleccionado ? (clienteSeleccionado['NOMBRE-APELLIDO'] || '').trim() : '';
    var tipoListaPrecio = clienteSeleccionado ? (clienteSeleccionado['TIPO-LISTA-PRECIO'] || '').trim() : '';
    var payload = {
      accion: 'guardarVenta',
      hoja: nombreHoja,
      idVenta: idVenta,
      fechaOperativa: fechaOp,
      hora: hora,
      nombreApellido: nombreApellido,
      tipoListaPrecio: tipoListaPrecio,
      total: total,
      items: carrito.map(function (item) {
        return {
          idProducto: item.producto[TABLA.pk],
          categoria: item.producto.CATEGORIA,
          producto: item.producto['NOMBRE-PRODUCTO'],
          cantidad: item.cantidad,
          precio: item.producto.PRECIO,
          monto: item.producto.PRECIO * item.cantidad
        };
      })
    };
    var btnGuardar = document.getElementById('nueva-venta-btn-guardar');
    var msgGuardar = document.getElementById('nueva-venta-guardar-msg');
    if (btnGuardar) btnGuardar.disabled = true;
    if (msgGuardar) { msgGuardar.textContent = 'Guardando…'; msgGuardar.className = 'nueva-venta__guardar-msg'; }
    var bodyForm = 'data=' + encodeURIComponent(JSON.stringify(payload));
    var urlGuardar = (CORS_PROXY && CORS_PROXY.length > 0)
      ? CORS_PROXY + encodeURIComponent(APP_SCRIPT_URL)
      : APP_SCRIPT_URL;
    fetch(urlGuardar, {
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
          try {
            return JSON.parse(t);
          } catch (err) {
            return { ok: false, error: t };
          }
        });
      })
      .then(function (data) {
        var ok = data && (data.ok === true || data.success === true);
        if (ok) {
          carrito = [];
          pintarResumen();
          mostrarMensajeGuardar('Venta guardada correctamente.', false);
        } else {
          mostrarMensajeGuardar(data && (data.error || data.mensaje) || 'Error al guardar.', true);
        }
      })
      .catch(function (err) {
        var msg = err && err.message ? err.message : String(err);
        var esCors = /failed to fetch|networkerror|cors|blocked|access-control/i.test(msg);
        if (esCors) {
          carrito = [];
          pintarResumen();
          mostrarMensajeGuardar('Venta enviada. Revisa el Sheet para confirmar (la respuesta fue bloqueada por CORS).', false);
        } else {
          mostrarMensajeGuardar('Error: ' + msg, true);
        }
      })
      .then(function () {
        if (btnGuardar) btnGuardar.disabled = carrito.length === 0;
      });
  }

  function mostrarMensajeGuardar(texto, esError) {
    var msg = document.getElementById('nueva-venta-guardar-msg');
    if (!msg) return;
    msg.textContent = texto;
    msg.className = 'nueva-venta__guardar-msg ' + (esError ? 'err' : 'ok');
  }

  function aplicarClienteEnPantalla() {
    var bloqueCliente = document.getElementById('nueva-venta-cliente-info');
    var tipoEl = document.getElementById('nueva-venta-cliente-tipo');
    if (!clienteSeleccionado) return;
    var nombre = (clienteSeleccionado['NOMBRE-APELLIDO'] || '').trim();
    var tipoLista = (clienteSeleccionado['TIPO-LISTA-PRECIO'] || '').trim();
    if (bloqueCliente) {
      bloqueCliente.querySelector('.nueva-venta__cliente-nombre').textContent = nombre || '(Sin nombre)';
      bloqueCliente.classList.add('nueva-venta__cliente-info--visible');
    }
    if (tipoEl) tipoEl.textContent = tipoLista ? ' · ' + tipoLista : '';
  }

  function init() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY_CLIENTE);
      if (!raw) {
        window.location.href = '../Seleccionar-cliente/seleccionar-cliente.html?volver=Nueva-venta';
        return;
      }
      clienteSeleccionado = JSON.parse(raw);
    } catch (e) {
      window.location.href = '../Seleccionar-cliente/seleccionar-cliente.html?volver=Nueva-venta';
      return;
    }
    aplicarClienteEnPantalla();
    document.getElementById('nueva-venta-categoria').addEventListener('change', pintarListado);
    var btnGuardar = document.getElementById('nueva-venta-btn-guardar');
    if (btnGuardar) btnGuardar.addEventListener('click', guardarVenta);
    cargarProductos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
