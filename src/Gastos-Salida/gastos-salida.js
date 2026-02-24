/**
 * =============================================================================
 * MÓDULO GASTOS DE SALIDA — LÓGICA COMPLETA
 * =============================================================================
 *
 * OBJETIVO
 * --------
 * Permitir cargar operaciones (gastos/ventas especiales) asociadas a un responsable
 * (NOMBRE-APELLIDO), con un tipo de operación, producto y precio. Cada registro
 * se guarda como una fila en la hoja del mes correspondiente a la fecha operativa
 * (ENERO, FEBRERO, … DICIEMBRE), usando la misma estructura que el módulo Nueva venta.
 *
 * DEPENDENCIAS (cargadas en gastos-salida.html antes de este script)
 * ------------
 * - config.js     → APP_CONFIG.APP_SCRIPT_URL, APP_CONFIG.CORS_PROXY
 * - tables.js     → APP_TABLES (opcional; el backend usa sus propias definiciones)
 * - negocio.js    → APP_NEGOCIO.getFechaOperativa(), APP_NEGOCIO.getNombreHojaMes()
 *
 * ELEMENTOS DEL DOM (IDs)
 * -----------------------
 * - gastos-salida-nombre-apellido  : <strong> con el nombre del responsable (ej. MATIAS)
 * - gastos-salida-tipo-operacion   : <select> con opciones desde COMPONENTE-COMBO
 * - gastos-salida-producto         : <input text> nombre del producto
 * - gastos-salida-precio           : <input number> precio (decimal)
 * - gastos-salida-form             : <form> envío con submit → guardar()
 * - gastos-salida-btn-guardar      : <button type="submit"> Guardar
 * - gastos-salida-guardar-msg      : <p> mensaje de éxito/error del guardado
 *
 * FLUJO AL CARGAR LA PÁGINA
 * -------------------------
 * 1. init() se ejecuta (al DOMContentLoaded o de inmediato).
 * 2. cargarComboTipoOperacion():
 *    - Hace POST a APP_SCRIPT_URL con accion: 'componenteComboLeer'.
 *    - Backend (Code.gs): lee la hoja COMPONENTE-COMBO del Sheet y devuelve
 *      { ok: true, datos: [ { 'COMBO-SUCURSAL-COMERCIO', 'TIPO-OPERACION', ... }, ... ] }.
 *    - Se extraen valores únicos de la columna TIPO-OPERACION, se ordenan y se
 *      rellenan las <option> del select (primera opción: "Seleccionar tipo de operación").
 * 3. Se registra el listener del formulario: submit → preventDefault() + guardar().
 *
 * FLUJO AL GUARDAR (botón Guardar / submit del form)
 * --------------------------------------------------
 * 1. guardar() valida:
 *    - APP_SCRIPT_URL definido.
 *    - APP_NEGOCIO.getFechaOperativa y getNombreHojaMes disponibles.
 *    - Tipo de operación seleccionado (obligatorio).
 * 2. Lee del DOM:
 *    - CATEGORIA     = valor del combo tipo operación (getCategoria()).
 *    - PRODUCTO      = texto del input producto (getProducto()).
 *    - PRECIO        = número del input precio (getPrecio()); si vacío → 0.
 *    - CANTIDAD      = 1 (constante CANTIDAD_DEFAULT en este módulo).
 *    - NOMBRE-APELLIDO = texto de #gastos-salida-nombre-apellido (getNombreApellido()); default 'MATIAS'.
 * 3. Calcula:
 *    - MONTO = CANTIDAD * PRECIO (en este módulo = 1 * precio).
 *    - fechaOperativa = NEGOCIO.getFechaOperativa() → formato YYYY-MM-DD según horario negocio (ej. 21:00–02:00).
 *    - nombreHoja = NEGOCIO.getNombreHojaMes(fechaOperativa) → ENERO | FEBRERO | … | DICIEMBRE.
 *    - hora = HH:MM actual.
 *    - idVenta = 'GS-' + Date.now() (prefijo GS para distinguir de Nueva venta).
 * 4. Arma el payload para guardarVenta:
 *    - accion: 'guardarVenta'
 *    - hoja: nombreHoja (mes)
 *    - idVenta, fechaOperativa, hora, nombreApellido, tipoListaPrecio: ''
 *    - items: [ { idProducto: '', categoria, producto, cantidad: 1, precio, monto } ]
 * 5. POST a APP_SCRIPT_URL (o CORS_PROXY + URL) con body: data=JSON.stringify(payload).
 * 6. Backend (Code.gs): doPost → ventaAlta(params):
 *    - Obtiene la hoja del Sheet por nombre (ENERO, FEBRERO, etc.).
 *    - Si la hoja está vacía, escribe la fila de encabezados (COLUMNAS_VENTAS).
 *    - Añade una fila por cada ítem con: ID-VENTA, AÑO, FECHA_OPERATIVA, HORA,
 *      NOMBRE-APELLIDO, TIPO-LISTA-PRECIO, ID-PRODUCTO, CATEGORIA, PRODUCTO, CANTIDAD, PRECIO, MONTO.
 * 7. Respuesta: { ok: true, mensaje: 'Venta guardada.' } o { ok: false, error: '...' }.
 * 8. En el frontend:
 *    - Si ok: mensaje "Operación guardada en la hoja [nombreHoja].", se vacían producto y precio.
 *    - Si error: se muestra el mensaje de error.
 *    - El botón se deshabilita durante la petición y se vuelve a habilitar al terminar.
 *
 * HOJAS DEL SHEET IMPLICADAS
 * --------------------------
 * - COMPONENTE-COMBO: columnas COMBO-SUCURSAL-COMERCIO, TIPO-OPERACION,
 *   COMBO-CATEGORIA-PANADERIA, COMBO-CATEGORIA-MARKET. Solo se usa TIPO-OPERACION
 *   para llenar el combo.
 * - ENERO, FEBRERO, … DICIEMBRE: mismas columnas que ventas (ID-VENTA, AÑO,
 *   FECHA_OPERATIVA, HORA, NOMBRE-APELLIDO, TIPO-LISTA-PRECIO, ID-PRODUCTO,
 *   CATEGORIA, PRODUCTO, CANTIDAD, PRECIO, MONTO). Las filas de Gastos de Salida
 *   tienen idVenta con prefijo "GS-", idProducto vacío y tipoListaPrecio vacío.
 *
 * API USADA (backend appscript/Code.gs)
 * -------------------------------------
 * - componenteComboLeer: GET lógico de la hoja COMPONENTE-COMBO; devuelve todas las columnas.
 * - guardarVenta (ventaAlta): escribe en la hoja del mes según params.hoja.
 *
 * EXPUESTO EN window.GastosSalida
 * -------------------------------
 * - getCategoria(), getCantidad(), getProducto(), getPrecio(), CANTIDAD (1).
 * =============================================================================
 */
(function () {
  'use strict';

  var APP_SCRIPT_URL = window.APP_CONFIG && window.APP_CONFIG.APP_SCRIPT_URL;
  var CORS_PROXY = window.APP_CONFIG && window.APP_CONFIG.CORS_PROXY;

  /** Columna de la tabla COMPONENTE-COMBO que alimenta este combo. */
  var COLUMNA_COMBO_TIPO_OPERACION = 'TIPO-OPERACION';

  /** CANTIDAD por defecto en este módulo (para guardarVenta). */
  var CANTIDAD_DEFAULT = 1;

  /**
   * Devuelve el valor seleccionado en el combo "Tipo de operación".
   * Ese valor debe asignarse a CATEGORIA en el payload al llamar guardarVenta.
   * @returns {string} CATEGORIA para la venta (ej. DEVOLUCION, EMPLEADOS, PAGOS, REPARACIONES, VENTA).
   */
  function getCategoria() {
    var select = document.getElementById('gastos-salida-tipo-operacion');
    if (!select) return '';
    var v = (select.value !== undefined && select.value !== null) ? String(select.value).trim() : '';
    return v;
  }

  function getProducto() {
    var input = document.getElementById('gastos-salida-producto');
    if (!input) return '';
    return (input.value !== undefined && input.value !== null) ? String(input.value).trim() : '';
  }

  function getPrecio() {
    var input = document.getElementById('gastos-salida-precio');
    if (!input || input.value === '' || input.value === null) return '';
    var n = parseFloat(String(input.value).replace(',', '.'), 10);
    return isNaN(n) ? '' : n;
  }

  function getNombreApellido() {
    var el = document.getElementById('gastos-salida-nombre-apellido');
    if (!el) return 'MATIAS';
    var t = (el.textContent || '').trim();
    return t || 'MATIAS';
  }

  function getBtnGuardar() { return document.getElementById('gastos-salida-btn-guardar'); }
  function getMsgGuardar() { return document.getElementById('gastos-salida-guardar-msg'); }

  function mostrarMensajeGuardar(texto, esError) {
    var msg = getMsgGuardar();
    if (!msg) return;
    msg.textContent = texto;
    msg.hidden = !texto;
    msg.className = 'gastos-salida__guardar-msg ' + (esError ? 'err' : 'ok');
  }

  function guardar() {
    if (!APP_SCRIPT_URL) {
      mostrarMensajeGuardar('Configura APP_SCRIPT_URL en config.js', true);
      return;
    }
    var NEGOCIO = window.APP_NEGOCIO;
    if (!NEGOCIO || !NEGOCIO.getFechaOperativa || !NEGOCIO.getNombreHojaMes) {
      mostrarMensajeGuardar('Falta cargar negocio.js (tables.js y negocio.js)', true);
      return;
    }
    var categoria = getCategoria();
    if (!categoria) {
      mostrarMensajeGuardar('Seleccioná un tipo de operación.', true);
      return;
    }
    var producto = getProducto();
    var precioNum = getPrecio();
    if (precioNum === '') precioNum = 0;
    else precioNum = Number(precioNum);
    var cantidad = CANTIDAD_DEFAULT;
    var monto = cantidad * precioNum;

    var fechaOp = NEGOCIO.getFechaOperativa();
    var nombreHoja = NEGOCIO.getNombreHojaMes(fechaOp);
    var ahora = new Date();
    var hora = ahora.getHours() + ':' + (ahora.getMinutes() < 10 ? '0' : '') + ahora.getMinutes();
    var idVenta = 'GS-' + Date.now();
    var nombreApellido = getNombreApellido();

    var payload = {
      accion: 'guardarVenta',
      hoja: nombreHoja,
      idVenta: idVenta,
      fechaOperativa: fechaOp,
      hora: hora,
      nombreApellido: nombreApellido,
      tipoListaPrecio: '',
      items: [{
        idProducto: '',
        categoria: categoria,
        producto: producto,
        cantidad: cantidad,
        precio: precioNum,
        monto: monto
      }]
    };

    var btnGuardar = getBtnGuardar();
    var msgGuardar = getMsgGuardar();
    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.setAttribute('aria-busy', 'true');
    }
    mostrarMensajeGuardar('Guardando…', false);

    var bodyForm = 'data=' + encodeURIComponent(JSON.stringify(payload));
    var url = (CORS_PROXY && CORS_PROXY.length > 0)
      ? CORS_PROXY + encodeURIComponent(APP_SCRIPT_URL)
      : APP_SCRIPT_URL;

    fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyForm
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
        var ok = data && (data.ok === true || data.success === true);
        if (ok) {
          mostrarMensajeGuardar('Operación guardada en la hoja ' + nombreHoja + '.', false);
          document.getElementById('gastos-salida-producto').value = '';
          document.getElementById('gastos-salida-precio').value = '';
        } else {
          mostrarMensajeGuardar((data && (data.error || data.mensaje)) || 'Error al guardar.', true);
        }
        if (btnGuardar) {
          btnGuardar.disabled = false;
          btnGuardar.removeAttribute('aria-busy');
        }
      })
      .catch(function (err) {
        var msg = err && err.message ? err.message : String(err);
        mostrarMensajeGuardar('Error: ' + msg, true);
        if (btnGuardar) {
          btnGuardar.disabled = false;
          btnGuardar.removeAttribute('aria-busy');
        }
      });
  }

  function cargarComboTipoOperacion() {
    var select = document.getElementById('gastos-salida-tipo-operacion');
    if (!select) return;
    if (!APP_SCRIPT_URL) {
      select.innerHTML = '<option value="">Configurar APP_SCRIPT_URL</option>';
      return;
    }
    // Backend lee hoja COMPONENTE-COMBO y devuelve filas con TIPO-OPERACION, etc.
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
            var v = (fila[COLUMNA_COMBO_TIPO_OPERACION] !== undefined && fila[COLUMNA_COMBO_TIPO_OPERACION] !== null)
              ? String(fila[COLUMNA_COMBO_TIPO_OPERACION]).trim() : '';
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
    var form = document.getElementById('gastos-salida-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        guardar();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /** Expuesto para uso al guardar: CATEGORIA, CANTIDAD, PRODUCTO, PRECIO. */
  window.GastosSalida = window.GastosSalida || {};
  window.GastosSalida.getCategoria = getCategoria;
  window.GastosSalida.getCantidad = function () { return CANTIDAD_DEFAULT; };
  window.GastosSalida.CANTIDAD = CANTIDAD_DEFAULT;
  window.GastosSalida.getProducto = getProducto;
  window.GastosSalida.getPrecio = getPrecio;
})();
