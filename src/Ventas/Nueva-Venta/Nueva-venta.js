(function () {
  'use strict';

  var TABLA = window.APP_TABLES && window.APP_TABLES.PRODUCTOS_MARKET;
  var TABLA_VENTAS = window.APP_TABLES && (window.APP_TABLES.ENERO || window.APP_TABLES.VENTAS_MARKET);
  var APP_SCRIPT_URL = window.APP_CONFIG && window.APP_CONFIG.APP_SCRIPT_URL;
  var CORS_PROXY = window.APP_CONFIG && window.APP_CONFIG.CORS_PROXY;
  var HOJA_PRODUCTOS = 'PRODUCTOS-MARKET';
  var NEGOCIO = window.APP_NEGOCIO;
  var STORAGE_KEY_CLIENTE = 'APP_CLIENTE_VENTA';
  /** Unidades (PRESENTACION-UNIDAD-MEDIDA) que usan cantidad decimal con 2 decimales (config.js). */
  var UNIDADES_CANTIDAD_DECIMAL = (window.APP_CONFIG && window.APP_CONFIG.UNIDADES_CANTIDAD_DECIMAL) || ['GRAMOS', 'KG'];
  /** Config del cálculo Precio Unitario = columnaCosto / columnaCantidad (config.js). */
  var PRECIO_UNITARIO_CALCULO = (window.APP_CONFIG && window.APP_CONFIG.PRECIO_UNITARIO_CALCULO) || { columnaCosto: 'COSTO', columnaCantidad: 'PRESENTACION-CANTIDAD-UNIDAD-MEDIDA' };
  /** Cliente por defecto cuando no hay uno seleccionado en sesión (Nueva Venta Market: SILVINA / COSTO). */
  var CLIENTE_DEFAULT = { 'NOMBRE-APELLIDO': 'SILVINA', 'TIPO-LISTA-PRECIO': 'COSTO' };
  var clienteSeleccionado = null;

  function getPrecioUnitario(producto) {
    var colCosto = PRECIO_UNITARIO_CALCULO.columnaCosto || 'COSTO';
    var colCant = PRECIO_UNITARIO_CALCULO.columnaCantidad || 'PRESENTACION-CANTIDAD-UNIDAD-MEDIDA';
    var costoVal = parseFloat(producto[colCosto], 10) || parseFloat(producto.PRECIO, 10) || 0;
    var cantVal = parseFloat(String(producto[colCant] || '').replace(',', '.'), 10) || 0;
    if (cantVal <= 0) return 0;
    return Math.round((costoVal / cantVal) * 100) / 100;
  }

  function esUnidadCantidadDecimal(unidad) {
    var u = (unidad || '').toString().trim().toUpperCase();
    return u && UNIDADES_CANTIDAD_DECIMAL.indexOf(u) !== -1;
  }
  var productos = [];
  var carrito = [];

  function getBtnGuardar() {
    return document.getElementById('nueva-venta-btn-guardar');
  }
  function getMsgGuardar() {
    return document.getElementById('nueva-venta-guardar-msg');
  }

  function claveEnFila(fila, columna) {
    if (fila[columna] !== undefined && fila[columna] !== null) return fila[columna];
    var norm = (columna || '').trim().toUpperCase();
    for (var k in fila) {
      if (fila.hasOwnProperty(k) && (k || '').trim().toUpperCase() === norm) return fila[k];
    }
    return undefined;
  }

  /** Normaliza filas de PRODUCTOS-MARKET: COSTO se expone como PRECIO para el carrito y totales. */
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
          if (c === 'COSTO' || c === 'PRECIO') {
            p[c] = Number(val) || 0;
          } else {
            p[c] = val !== undefined && val !== null ? String(val).trim() : '';
          }
        });
        var costo = Number(claveEnFila(f, 'COSTO')) || 0;
        p.PRECIO = costo;
        if (p.COSTO === undefined) p.COSTO = costo;
        return p;
      });
  }

  function getPrecioParaCliente(p) {
    return Number(p.PRECIO) || 0;
  }

  function aplicarPreciosSegunCliente() {
    productos.forEach(function (p) {
      p.PRECIO = getPrecioParaCliente(p);
    });
  }

  function getTextoBusqueda() {
    var input = document.getElementById('nueva-venta-buscar');
    return (input && input.value) ? input.value.trim() : '';
  }

  function cargarProductos() {
    var mensaje = document.getElementById('nueva-venta-mensaje');
    if (!TABLA) {
      mensaje.textContent = 'Falta configurar Tables (PRODUCTOS_MARKET).';
      return;
    }

    function aplicarProductosYFiltro(filas) {
      productos = normalizarProductos(filas);
      aplicarPreciosSegunCliente();
      mensaje.textContent = '';
      pintarListado();
    }

    if (!APP_SCRIPT_URL) {
      mensaje.textContent = 'Configura APP_SCRIPT_URL en config.js. Los productos se cargan de la hoja "' + HOJA_PRODUCTOS + '".';
      return;
    }
    var payload = { accion: 'productoMarketLeer' };
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
    var textoBusqueda = getTextoBusqueda().toUpperCase();
    var listado = productos;
    if (textoBusqueda) {
      listado = productos.filter(function (p) {
        var nombre = (p['NOMBRE-PRODUCTO'] || '').toUpperCase();
        var categoria = (p.CATEGORIA || '').toUpperCase();
        return nombre.indexOf(textoBusqueda) !== -1 || categoria.indexOf(textoBusqueda) !== -1;
      });
    }
    var porCategoria = {};
    listado.forEach(function (p) {
      var c = (p.CATEGORIA || '').trim() || 'Otros';
      var cNorm = c.toUpperCase();
      if (!porCategoria[cNorm]) porCategoria[cNorm] = { label: c, items: [] };
      porCategoria[cNorm].items.push(p);
    });
    var categoriasOrden = Object.keys(porCategoria).sort();
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
        var presentacionCant = (p['PRESENTACION-CANTIDAD-UNIDAD-MEDIDA'] || '').toString().trim();
        var presentacionUd = (p['PRESENTACION-UNIDAD-MEDIDA'] || '').toString().trim();
        var presentacionTexto = [presentacionCant, presentacionUd].filter(Boolean).join(' ') || '';
        var precio = getPrecioParaCliente(p);
        var idProd = (p[TABLA.pk] || '').toString().trim();
        var qtyEnCarrito = getCantidadEnCarrito(idProd);
        var textoBoton = qtyEnCarrito > 0
          ? '✓ ' + qtyEnCarrito + (qtyEnCarrito === 1 ? ' agregado' : ' en carrito')
          : 'Agregar';
        var claseBoton = 'nueva-venta__btn-add' + (qtyEnCarrito > 0 ? ' nueva-venta__btn-add--added' : '');
        li.innerHTML =
          '<span class="nueva-venta__item-nombre">' + escapeHtml(nombre) + '</span>' +
          (presentacionTexto ? '<span class="nueva-venta__item-presentacion">' + escapeHtml(presentacionTexto) + '</span>' : '') +
          '<span class="nueva-venta__item-precio">' + formatearPrecio(precio) + '</span>' +
          '<button type="button" class="' + claseBoton + '" data-id="' + escapeHtml(idProd) + '">' + escapeHtml(textoBoton) + '</button>';
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

  /** Cantidad en carrito para un producto (por id). */
  function getCantidadEnCarrito(idProducto) {
    var item = carrito.find(function (x) { return x.producto[TABLA.pk] === idProducto; });
    return item ? item.cantidad : 0;
  }

  /** Actualiza el texto y estado visual de todos los botones "Agregar" según el carrito. */
  function actualizarBotonesCantidadCarrito() {
    var botones = document.querySelectorAll('.nueva-venta__btn-add');
    botones.forEach(function (btn) {
      var id = btn.getAttribute('data-id');
      var qty = getCantidadEnCarrito(id);
      if (qty > 0) {
        btn.textContent = '✓ ' + qty + (qty === 1 ? ' agregado' : ' en carrito');
        btn.classList.add('nueva-venta__btn-add--added');
      } else {
        btn.textContent = 'Agregar';
        btn.classList.remove('nueva-venta__btn-add--added');
      }
    });
  }

  function agregarAlCarrito(producto) {
    var pk = TABLA.pk;
    var id = producto[pk];
    var item = carrito.find(function (x) { return x.producto[pk] === id; });
    var esDecimal = esUnidadCantidadDecimal(producto['PRESENTACION-UNIDAD-MEDIDA']);
    if (item) {
      if (!esDecimal) item.cantidad += 1;
    } else {
      var p = producto;
      var precioEfectivo = getPrecioParaCliente(p);
      if (p.PRECIO !== precioEfectivo) {
        p = Object.assign({}, p);
        p.PRECIO = precioEfectivo;
      }
      carrito.push({ producto: p, cantidad: esDecimal ? 0 : 1 });
    }
    pintarResumen();
    actualizarBotonesCantidadCarrito();
  }

  function quitarDelCarrito(idProducto) {
    carrito = carrito.filter(function (x) { return x.producto[TABLA.pk] !== idProducto; });
    pintarResumen();
    actualizarBotonesCantidadCarrito();
  }

  function actualizarCantidad(idProducto, cantidad) {
    var item = carrito.find(function (x) { return x.producto[TABLA.pk] === idProducto; });
    if (!item) return;
    var esDecimal = esUnidadCantidadDecimal(item.producto['PRESENTACION-UNIDAD-MEDIDA']);
    var n;
    if (esDecimal) {
      n = parseFloat(String(cantidad).replace(',', '.'), 10);
      if (isNaN(n) || n < 0) n = 0;
      n = Math.min(99999.99, Math.round(n * 100) / 100);
    } else {
      n = parseInt(cantidad, 10);
      if (isNaN(n) || n < 1) n = 1;
      n = Math.floor(n);
    }
    item.cantidad = n;
    pintarResumen();
    actualizarBotonesCantidadCarrito();
  }

  function pintarResumen() {
    var vacio = document.getElementById('nueva-venta-resumen-vacio');
    var tabla = document.getElementById('nueva-venta-tabla');
    var tbody = document.getElementById('nueva-venta-tabla-body');
    var totalEl = document.getElementById('nueva-venta-total');
    var btnGuardar = getBtnGuardar();
    var msgGuardar = getMsgGuardar();
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
      var precioUnitario = getPrecioUnitario(item.producto);
      var subtotal = precioUnitario * item.cantidad;
      total += subtotal;
      var tr = document.createElement('tr');
      var qty = item.cantidad;
      var esDecimal = esUnidadCantidadDecimal(item.producto['PRESENTACION-UNIDAD-MEDIDA']);
      var qtyVal = esDecimal ? (qty === 0 || qty === '' ? '' : (typeof qty === 'number' ? qty.toFixed(2) : parseFloat(qty).toFixed(2))) : qty;
      var trashSvg = '<svg class="nueva-venta__icon-trash" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
      var qtyCellHtml;
      if (esDecimal) {
        qtyCellHtml = '<td class="nueva-venta__th-num nueva-venta__td-qty">' +
          '<input type="number" min="0" max="99999.99" step="0.01" value="' + escapeHtml(String(qtyVal)) + '" placeholder="" class="nueva-venta__input-qty nueva-venta__input-qty--decimal" data-id="' + escapeHtml(id) + '" aria-label="Cantidad" inputmode="decimal">' +
          '</td>';
      } else {
        qtyCellHtml = '<td class="nueva-venta__th-num nueva-venta__td-qty">' +
          '<div class="nueva-venta__qty-wrap">' +
          '<button type="button" class="nueva-venta__qty-btn nueva-venta__qty-minus" data-id="' + escapeHtml(id) + '" aria-label="Disminuir cantidad">−</button>' +
          '<input type="number" min="1" value="' + qty + '" class="nueva-venta__input-qty" data-id="' + escapeHtml(id) + '" aria-label="Cantidad">' +
          '<button type="button" class="nueva-venta__qty-btn nueva-venta__qty-plus" data-id="' + escapeHtml(id) + '" aria-label="Aumentar cantidad">+</button>' +
          '</div></td>';
      }
      var um = (item.producto['PRESENTACION-UNIDAD-MEDIDA'] || '').toString().trim() || '—';
      var cantUm = (item.producto['PRESENTACION-CANTIDAD-UNIDAD-MEDIDA'] || '').toString().trim() || '—';
      tr.innerHTML =
        '<td>' + escapeHtml(item.producto['NOMBRE-PRODUCTO']) + '</td>' +
        '<td class="nueva-venta__td-um">' + escapeHtml(um) + '</td>' +
        '<td class="nueva-venta__td-cant-um">' + escapeHtml(cantUm) + '</td>' +
        '<td class="nueva-venta__th-num">' + formatearPrecio(item.producto.PRECIO) + '</td>' +
        '<td class="nueva-venta__th-num">' + formatearPrecio(precioUnitario) + '</td>' +
        qtyCellHtml +
        '<td class="nueva-venta__th-num nueva-venta__subtotal">' + formatearPrecio(subtotal) + '</td>' +
        '<td><button type="button" class="nueva-venta__btn-quitar" data-id="' + escapeHtml(id) + '" aria-label="Quitar del resumen" title="Quitar">' + trashSvg + '</button></td>';
      var inputQty = tr.querySelector('.nueva-venta__input-qty');
      if (esDecimal) {
        function parseQtyDecimal(raw) {
          if (raw === '') return 0;
          var val = parseFloat(raw, 10);
          if (isNaN(val) || val < 0) return 0;
          return Math.min(99999.99, Math.round(val * 100) / 100);
        }
        function syncQtyDecimal(allowFormatInput) {
          var raw = String(inputQty.value).replace(',', '.').trim();
          if (raw === '') {
            actualizarCantidad(id, 0);
            if (allowFormatInput) inputQty.value = '';
            return;
          }
          var val = parseQtyDecimal(raw);
          actualizarCantidad(id, val);
          if (allowFormatInput) inputQty.value = val === 0 ? '' : val.toFixed(2);
        }
        inputQty.addEventListener('input', function () { syncQtyDecimal(false); });
        inputQty.addEventListener('change', function () { syncQtyDecimal(true); });
      } else {
        var btnMinus = tr.querySelector('.nueva-venta__qty-minus');
        var btnPlus = tr.querySelector('.nueva-venta__qty-plus');
        function syncQty() {
          var val = parseInt(inputQty.value, 10);
          if (isNaN(val) || val < 1) val = 1;
          inputQty.value = val;
          actualizarCantidad(id, val);
          if (btnMinus) btnMinus.disabled = val <= 1;
        }
        inputQty.addEventListener('input', function () { syncQty(); });
        inputQty.addEventListener('change', function () { syncQty(); });
        if (btnMinus) {
          btnMinus.addEventListener('click', function () {
            var v = parseInt(inputQty.value, 10) || 1;
            if (v > 1) { inputQty.value = v - 1; syncQty(); }
          });
          btnMinus.disabled = qty <= 1;
        }
        if (btnPlus) {
          btnPlus.addEventListener('click', function () {
            var v = parseInt(inputQty.value, 10) || 0;
            inputQty.value = v + 1;
            syncQty();
          });
        }
      }
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
      t += getPrecioUnitario(item.producto) * item.cantidad;
    });
    return Math.round(t * 100) / 100;
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
    var total = getTotalVenta();
    var ahora = new Date();
    var hora = ahora.getHours() + ':' + (ahora.getMinutes() < 10 ? '0' : '') + ahora.getMinutes();
    var idVenta = 'V-' + Date.now();
    var cliente = clienteSeleccionado || CLIENTE_DEFAULT;
    var nombreApellido = (cliente['NOMBRE-APELLIDO'] || '').trim();
    var tipoListaPrecio = (cliente['TIPO-LISTA-PRECIO'] || '').trim();
    var payload = {
      accion: 'ventaMarketAlta',
      idVenta: idVenta,
      fechaOperativa: fechaOp,
      hora: hora,
      nombreApellido: nombreApellido,
      tipoListaPrecio: tipoListaPrecio,
      usuario: (window.APP_CONFIG && window.APP_CONFIG.USUARIO) || 'USR-MATIAS',
      total: total,
      // Al presionar "Realizar venta", el valor de la variable subtotal de cada línea se guarda en la columna MONTO de VENTAS-MARKET.
      items: carrito.filter(function (item) { return item.cantidad > 0; }).map(function (item) {
        var precioUnit = getPrecioUnitario(item.producto);
        var subtotal = Math.round(precioUnit * item.cantidad * 100) / 100;
        return {
          idProducto: item.producto[TABLA.pk],
          categoria: item.producto.CATEGORIA,
          producto: item.producto['NOMBRE-PRODUCTO'],
          cantidad: item.cantidad,
          presentacionUnidadMedida: (item.producto['PRESENTACION-UNIDAD-MEDIDA'] || '').toString().trim(),
          precio: precioUnit,
          monto: subtotal  // columna MONTO = valor de la variable subtotal
        };
      })
    };
    if (payload.items.length === 0) {
      mostrarMensajeGuardar('Agregá la cantidad en al menos un producto.', true);
      return;
    }
    var btnGuardar = getBtnGuardar();
    var msgGuardar = getMsgGuardar();
    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.setAttribute('aria-busy', 'true');
    }
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
          mostrarMensajeGuardar('Venta realizada. Redirigiendo al inicio…', false);
          setTimeout(function () {
            window.location.href = '../../../index.html';
          }, 1200);
        } else {
          mostrarMensajeGuardar(data && (data.error || data.mensaje) || 'Error al guardar.', true);
          if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.removeAttribute('aria-busy'); }
        }
      })
      .catch(function (err) {
        var msg = err && err.message ? err.message : String(err);
        var esCors = /failed to fetch|networkerror|cors|blocked|access-control/i.test(msg);
        if (esCors) {
          mostrarMensajeGuardar('Venta enviada. Redirigiendo al inicio…', false);
          setTimeout(function () {
            window.location.href = '../../../index.html';
          }, 1200);
        } else {
          mostrarMensajeGuardar('Error: ' + msg, true);
          if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.removeAttribute('aria-busy'); }
        }
      });
  }

  function mostrarMensajeGuardar(texto, esError) {
    var msg = getMsgGuardar();
    if (!msg) return;
    msg.textContent = texto;
    msg.className = 'nueva-venta__guardar-msg ' + (esError ? 'err' : 'ok');
  }

  function aplicarClienteEnPantalla() {
    var cliente = clienteSeleccionado || CLIENTE_DEFAULT;
    var bloqueCliente = document.getElementById('nueva-venta-cliente-info');
    var tipoEl = document.getElementById('nueva-venta-cliente-tipo');
    if (bloqueCliente) {
      bloqueCliente.classList.add('nueva-venta__cliente-info--visible');
      var nombreEl = bloqueCliente.querySelector('.nueva-venta__cliente-nombre');
      if (nombreEl) nombreEl.textContent = (cliente['NOMBRE-APELLIDO'] || '').trim() || '(Sin nombre)';
    }
    if (tipoEl) tipoEl.textContent = (cliente['TIPO-LISTA-PRECIO'] || '').trim() ? ' · ' + (cliente['TIPO-LISTA-PRECIO'] || '').trim() : '';
  }

  function init() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY_CLIENTE);
      if (raw) clienteSeleccionado = JSON.parse(raw);
      else clienteSeleccionado = null;
    } catch (e) {
      clienteSeleccionado = null;
    }
    aplicarClienteEnPantalla();
    var inputBuscar = document.getElementById('nueva-venta-buscar');
    var btnLimpiar = document.getElementById('nueva-venta-limpiar-busqueda');
    if (inputBuscar) inputBuscar.addEventListener('input', pintarListado);
    if (btnLimpiar) {
      btnLimpiar.addEventListener('click', function () {
        if (inputBuscar) inputBuscar.value = '';
        pintarListado();
        inputBuscar && inputBuscar.focus();
      });
    }
    var btnGuardar = getBtnGuardar();
    if (btnGuardar) btnGuardar.addEventListener('click', guardarVenta);
    cargarProductos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
