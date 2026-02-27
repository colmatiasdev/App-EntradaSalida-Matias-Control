/**
 * Web App - ÚNICO origen de datos para la app (productos, clientes, ventas).
 * Desplegar como "Aplicación web": ejecutar como yo, quién tiene acceso: cualquiera.
 * La URL de despliegue debe estar en src/Config/config.js como APP_SCRIPT_URL.
 *
 * IMPORTANTE: SPREADSHEET_ID debe ser el mismo que en config.js. Este script debe estar
 * vinculado al mismo Google Sheet que usa la app (o pegar aquí el ID de ese Sheet).
 *
 * Tablas (hojas): CLIENTES, PRODUCTOS, PRODUCTOS-MARKET, ENERO..DICIEMBRE, RESUMEN-VENTAS, OPERACIONES-GENERALES, RESUMEN-OPERATIVO, COMPONENTE-COMBO.
 * Columnas según TABLAS más abajo (coincidir con src/Config/tables.js).
 */

/** ID del Google Sheet. DEBE coincidir con SPREADSHEET_ID en src/Config/config.js. */
var SPREADSHEET_ID = '1FOjy3jePjs0u76-tVf7QdRiufVWGbdHZVtHJH9beePU';

/** Definición de tablas (hoja, PK, columnas). Coincidir con src/Config/tables.js */
var TABLAS = {
  CLIENTES: {
    sheet: 'CLIENTES',
    pk: 'ID-CLIENTE',
    columns: ['ID-CLIENTE', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO', 'WHATSAPP', 'OBSERVACION', 'HABILITADO']
  },
  PRODUCTOS: {
    sheet: 'PRODUCTOS',
    pk: 'ID-PRODUCTO',
    columns: ['ID-PRODUCTO', 'COMERCIO-SUCURSAL', 'CATEGORIA', 'NOMBRE-PRODUCTO', 'PRECIO', 'HABILITADO']
  },
  PRODUCTOS_MARKET: {
    sheet: 'PRODUCTOS-MARKET',
    pk: 'ID-PRODUCTO',
    columns: ['ID-PRODUCTO', 'COMERCIO-SUCURSAL', 'CATEGORIA', 'NOMBRE-PRODUCTO', 'DESCRIPCION', 'PRESENTACION-CANTIDAD-UNIDAD-MEDIDA', 'PRESENTACION-UNIDAD-MEDIDA', 'COSTO', 'HABILITADO']
  },
  ENERO: {
    sheet: 'ENERO',
    pk: 'ID-VENTA',
    columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO', 'ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO']
  },
  FEBRERO: { sheet: 'FEBRERO', pk: 'ID-VENTA', columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO', 'ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO'] },
  MARZO: { sheet: 'MARZO', pk: 'ID-VENTA', columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO', 'ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO'] },
  ABRIL: { sheet: 'ABRIL', pk: 'ID-VENTA', columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO', 'ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO'] },
  MAYO: { sheet: 'MAYO', pk: 'ID-VENTA', columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO', 'ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO'] },
  JUNIO: { sheet: 'JUNIO', pk: 'ID-VENTA', columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO', 'ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO'] },
  JULIO: { sheet: 'JULIO', pk: 'ID-VENTA', columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO', 'ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO'] },
  AGOSTO: { sheet: 'AGOSTO', pk: 'ID-VENTA', columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO', 'ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO'] },
  SEPTIEMBRE: { sheet: 'SEPTIEMBRE', pk: 'ID-VENTA', columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO', 'ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO'] },
  OCTUBRE: { sheet: 'OCTUBRE', pk: 'ID-VENTA', columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO', 'ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO'] },
  NOVIEMBRE: { sheet: 'NOVIEMBRE', pk: 'ID-VENTA', columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO', 'ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO'] },
  DICIEMBRE: { sheet: 'DICIEMBRE', pk: 'ID-VENTA', columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO', 'ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO'] },
  RESUMEN_VENTAS: {
    sheet: 'RESUMEN-VENTAS',
    pk: 'MES',
    columns: ['MES', 'DIA', 'CATEGORIA', 'NOMBRE-PRODUCTO', 'CANTIDAD', 'MONTO']
  },
  RESUMEN_OPERATIVO: {
    sheet: 'RESUMEN-OPERATIVO',
    pk: 'ID-RESUMEN',
    columns: ['ID-RESUMEN', 'FECHA_OPERATIVA', 'HORA', 'CORRESPONDE-A', 'TIPO-OPERACION', 'CATEGORIA', 'IMPORTE']
  },
  OPERACIONES_GENERALES: {
    sheet: 'OPERACIONES-GENERALES',
    pk: 'ID-OPERACION-GRAL',
    columns: ['ID-OPERACION-GRAL', 'FECHA_OPERATIVA', 'HORA', 'CORRESPONDE-A', 'TIPO-OPERACION', 'DESCRIPCION', 'IMPORTE', 'USUARIO']
  },
  COMPONENTE_COMBO: {
    sheet: 'COMPONENTE-COMBO',
    columns: ['COMBO-SUCURSAL-COMERCIO', 'TIPO-OPERACION', 'COMBO-CATEGORIA-PANADERIA', 'COMBO-CATEGORIA-MARKET']
  },
  VENTAS_MARKET: {
    sheet: 'VENTAS-MARKET',
    pk: 'ID-VENTA',
    columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO', 'ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRESENTACION-UNIDAD-MEDIDA', 'PRECIO', 'MONTO', 'USUARIO']
  }
};

function doGet(e) {
  return respuestaJson({ ok: true, mensaje: 'Usar POST con accion y parametros.' });
}

function doPost(e) {
  try {
    var params = parseBody(e);
    var accion = params.accion || '';

    switch (accion) {
      case 'clienteAlta':       return clienteAlta(params);
      case 'clienteBaja':       return clienteBaja(params);
      case 'clienteModificacion': return clienteModificacion(params);
      case 'clienteLeer':      return clienteLeer(params);
      case 'productoAlta':       return productoAlta(params);
      case 'productoBaja':       return productoBaja(params);
      case 'productoModificacion': return productoModificacion(params);
      case 'productoLeer':      return productoLeer(params);
      case 'productoMarketAlta':       return productoMarketAlta(params);
      case 'productoMarketBaja':        return productoMarketBaja(params);
      case 'productoMarketModificacion': return productoMarketModificacion(params);
      case 'productoMarketLeer':       return productoMarketLeer(params);
      case 'ventaAlta':
      case 'guardarVenta':      return ventaAlta(params);
      case 'ventaMarketAlta':   return ventaMarketAlta(params);
      case 'ventaBaja':         return ventaBaja(params);
      case 'ventaModificacion': return ventaModificacion(params);
      case 'ventaLeer':         return ventaLeer(params);
      case 'resumenAlta':       return resumenAlta(params);
      case 'resumenBaja':       return resumenBaja(params);
      case 'resumenModificacion': return resumenModificacion(params);
      case 'resumenLeer':       return resumenLeer(params);
      case 'resumenOperativoAlta':       return resumenOperativoAlta(params);
      case 'resumenOperativoBaja':       return resumenOperativoBaja(params);
      case 'resumenOperativoModificacion': return resumenOperativoModificacion(params);
      case 'resumenOperativoLeer':       return resumenOperativoLeer(params);
      case 'componenteComboLeer':        return componenteComboLeer(params);
      case 'operacionesGralAlta':        return operacionesGralAlta(params);
      case 'cierreOperacionesDiaLeer':   return cierreOperacionesDiaLeer(params);
      default:
        return respuestaJson({ ok: false, error: 'Acción no reconocida: ' + accion });
    }
  } catch (err) {
    return respuestaJson({ ok: false, error: err.toString() });
  }
}

function parseBody(e) {
  var params = {};
  if (e.postData && e.postData.contents) {
    var raw = e.postData.contents;
    if (raw.indexOf('data=') !== -1) {
      params = JSON.parse(decodeURIComponent(raw.substring(raw.indexOf('data=') + 5).replace(/\+/g, ' ')));
    } else if (raw.trim().indexOf('{') === 0) {
      params = JSON.parse(raw);
    }
  }
  return params;
}

function getIdSpreadsheet() {
  var id = SPREADSHEET_ID || '';
  if (!id || id.indexOf('REEMPLAZAR') !== -1) {
    throw new Error('Configura SPREADSHEET_ID en Code.gs (solo el ID del documento).');
  }
  var match = id.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return id.trim();
}

function getSS() {
  var id = getIdSpreadsheet();
  if (id.length < 40) {
    throw new Error('SPREADSHEET_ID inválido. Usa solo el ID (ej: .../d/ESTE_ID/edit).');
  }
  return SpreadsheetApp.openById(id);
}

function getHoja(ss, nombreHoja, columnas) {
  var sheet = ss.getSheetByName(nombreHoja);
  if (!sheet) {
    sheet = ss.insertSheet(nombreHoja);
    if (columnas && columnas.length) {
      sheet.getRange(1, 1, 1, columnas.length).setValues([columnas]);
      sheet.getRange(1, 1, 1, columnas.length).setFontWeight('bold');
    }
  }
  return sheet;
}

function buscarFilaPorPK(sheet, def, pkValor) {
  var datos = sheet.getDataRange().getValues();
  if (datos.length < 2) return -1;
  var headers = datos[0];
  var colIdx = headers.indexOf(def.pk);
  if (colIdx === -1) return -1;
  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][colIdx]) === String(pkValor)) return i + 1;
  }
  return -1;
}

function objetoAFila(def, obj) {
  var fila = [];
  for (var c = 0; c < def.columns.length; c++) {
    fila.push(obj[def.columns[c]] !== undefined ? obj[def.columns[c]] : '');
  }
  return fila;
}

// --- CLIENTES ---

function clienteAlta(params) {
  var def = TABLAS.CLIENTES;
  var dato = params.dato || params;
  if (!dato[def.pk]) return respuestaJson({ ok: false, error: 'Falta ' + def.pk });
  var ss = getSS();
  var sheet = getHoja(ss, def.sheet, def.columns);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, def.columns.length).setValues([def.columns]);
    sheet.getRange(1, 1, 1, def.columns.length).setFontWeight('bold');
  }
  var fila = objetoAFila(def, dato);
  var rowNum = buscarFilaPorPK(sheet, def, dato[def.pk]);
  if (rowNum > 0) return respuestaJson({ ok: false, error: 'Ya existe un cliente con ese ' + def.pk });
  sheet.appendRow(fila);
  return respuestaJson({ ok: true, mensaje: 'Cliente dado de alta.' });
}

function clienteBaja(params) {
  var def = TABLAS.CLIENTES;
  var pkValor = params[def.pk] || params.id;
  if (!pkValor) return respuestaJson({ ok: false, error: 'Falta ' + def.pk });
  var ss = getSS();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet) return respuestaJson({ ok: false, error: 'No existe la hoja ' + def.sheet });
  var rowNum = buscarFilaPorPK(sheet, def, pkValor);
  if (rowNum === -1) return respuestaJson({ ok: false, error: 'No encontrado.' });
  sheet.deleteRow(rowNum);
  return respuestaJson({ ok: true, mensaje: 'Cliente dado de baja.' });
}

function clienteModificacion(params) {
  var def = TABLAS.CLIENTES;
  var dato = params.dato || params;
  if (!dato[def.pk]) return respuestaJson({ ok: false, error: 'Falta ' + def.pk });
  var ss = getSS();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet) return respuestaJson({ ok: false, error: 'No existe la hoja ' + def.sheet });
  var rowNum = buscarFilaPorPK(sheet, def, dato[def.pk]);
  if (rowNum === -1) return respuestaJson({ ok: false, error: 'No encontrado.' });
  var fila = objetoAFila(def, dato);
  sheet.getRange(rowNum, 1, rowNum, def.columns.length).setValues([fila]);
  return respuestaJson({ ok: true, mensaje: 'Cliente actualizado.' });
}

function clienteLeer(params) {
  var def = TABLAS.CLIENTES;
  var ss = getSS();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet) return respuestaJson({ ok: true, datos: [] });
  var datos = sheet.getDataRange().getValues();
  if (datos.length < 2) return respuestaJson({ ok: true, datos: [] });
  var headers = datos[0];
  var filas = [];
  for (var i = 1; i < datos.length; i++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var val = datos[i][c];
      obj[headers[c]] = (val !== undefined && val !== null) ? val : '';
    }
    var pkVal = (obj[def.pk] !== undefined && obj[def.pk] !== null) ? String(obj[def.pk]).trim() : '';
    if (pkVal === '') continue;
    filas.push(obj);
  }
  var id = params[def.pk] || params.id;
  if (id) {
    filas = filas.filter(function (f) { return String(f[def.pk]).trim() === String(id).trim(); });
  }
  return respuestaJson({ ok: true, datos: filas });
}

// --- PRODUCTOS ---

function productoAlta(params) {
  var def = TABLAS.PRODUCTOS;
  var dato = params.dato || params;
  if (!dato[def.pk]) return respuestaJson({ ok: false, error: 'Falta ' + def.pk });
  var ss = getSS();
  var sheet = getHoja(ss, def.sheet, def.columns);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, def.columns.length).setValues([def.columns]);
    sheet.getRange(1, 1, 1, def.columns.length).setFontWeight('bold');
  }
  var fila = objetoAFila(def, dato);
  var rowNum = buscarFilaPorPK(sheet, def, dato[def.pk]);
  if (rowNum > 0) return respuestaJson({ ok: false, error: 'Ya existe un producto con ese ' + def.pk });
  sheet.appendRow(fila);
  return respuestaJson({ ok: true, mensaje: 'Producto dado de alta.' });
}

function productoBaja(params) {
  var def = TABLAS.PRODUCTOS;
  var pkValor = params[def.pk] || params.id;
  if (!pkValor) return respuestaJson({ ok: false, error: 'Falta ' + def.pk });
  var ss = getSS();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet) return respuestaJson({ ok: false, error: 'No existe la hoja ' + def.sheet });
  var rowNum = buscarFilaPorPK(sheet, def, pkValor);
  if (rowNum === -1) return respuestaJson({ ok: false, error: 'No encontrado.' });
  sheet.deleteRow(rowNum);
  return respuestaJson({ ok: true, mensaje: 'Producto dado de baja.' });
}

function productoModificacion(params) {
  var def = TABLAS.PRODUCTOS;
  var dato = params.dato || params;
  if (!dato[def.pk]) return respuestaJson({ ok: false, error: 'Falta ' + def.pk });
  var ss = getSS();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet) return respuestaJson({ ok: false, error: 'No existe la hoja ' + def.sheet });
  var rowNum = buscarFilaPorPK(sheet, def, dato[def.pk]);
  if (rowNum === -1) return respuestaJson({ ok: false, error: 'No encontrado.' });
  var fila = objetoAFila(def, dato);
  sheet.getRange(rowNum, 1, rowNum, def.columns.length).setValues([fila]);
  return respuestaJson({ ok: true, mensaje: 'Producto actualizado.' });
}

function productoLeer(params) {
  var def = TABLAS.PRODUCTOS;
  var ss = getSS();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet) return respuestaJson({ ok: true, datos: [] });
  var datos = sheet.getDataRange().getValues();
  if (datos.length < 2) return respuestaJson({ ok: true, datos: [] });
  var headers = datos[0];
  var filas = [];
  for (var i = 1; i < datos.length; i++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var val = c < datos[i].length ? datos[i][c] : '';
      obj[headers[c]] = (val !== undefined && val !== null) ? val : '';
    }
    var pkVal = (obj[def.pk] !== undefined && obj[def.pk] !== null) ? String(obj[def.pk]).trim() : '';
    if (pkVal === '') continue;
    filas.push(obj);
  }
  var id = params[def.pk] || params.id;
  if (id) {
    filas = filas.filter(function (f) { return String(f[def.pk]).trim() === String(id).trim(); });
  }
  return respuestaJson({ ok: true, datos: filas });
}

// --- PRODUCTOS-MARKET (ID secuencial IDPROD-MK-1, IDPROD-MK-2, ...) ---

var PREFIJO_ID_PRODUCTOS_MARKET = 'IDPROD-MK-';

function siguienteIdProductosMarket(sheet, def) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return PREFIJO_ID_PRODUCTOS_MARKET + '1';
  var colPk = def.columns.indexOf(def.pk);
  if (colPk === -1) return PREFIJO_ID_PRODUCTOS_MARKET + '1';
  var datos = sheet.getRange(2, colPk + 1, lastRow, colPk + 1).getValues();
  var maxNum = 0;
  var re = /^IDPROD-MK-(\d+)$/i;
  for (var i = 0; i < datos.length; i++) {
    var val = String(datos[i][0] || '').trim();
    var m = val.match(re);
    if (m) {
      var n = parseInt(m[1], 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
  }
  return PREFIJO_ID_PRODUCTOS_MARKET + (maxNum + 1);
}

function productoMarketAlta(params) {
  var def = TABLAS.PRODUCTOS_MARKET;
  var dato = params.dato || params;
  var ss = getSS();
  var sheet = getHoja(ss, def.sheet, def.columns);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, def.columns.length).setValues([def.columns]);
    sheet.getRange(1, 1, 1, def.columns.length).setFontWeight('bold');
  }
  var idProducto = (dato[def.pk] || '').toString().trim();
  if (!idProducto) idProducto = siguienteIdProductosMarket(sheet, def);
  dato[def.pk] = idProducto;
  var rowNum = buscarFilaPorPK(sheet, def, idProducto);
  if (rowNum > 0) return respuestaJson({ ok: false, error: 'Ya existe un producto con ese ' + def.pk });
  var fila = objetoAFila(def, dato);
  sheet.appendRow(fila);
  return respuestaJson({ ok: true, mensaje: 'Producto Market dado de alta.', id: idProducto });
}

function productoMarketBaja(params) {
  var def = TABLAS.PRODUCTOS_MARKET;
  var pkValor = params[def.pk] || params.id;
  if (!pkValor) return respuestaJson({ ok: false, error: 'Falta ' + def.pk });
  var ss = getSS();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet) return respuestaJson({ ok: false, error: 'No existe la hoja ' + def.sheet });
  var rowNum = buscarFilaPorPK(sheet, def, pkValor);
  if (rowNum === -1) return respuestaJson({ ok: false, error: 'No encontrado.' });
  sheet.deleteRow(rowNum);
  return respuestaJson({ ok: true, mensaje: 'Producto Market dado de baja.' });
}

function productoMarketModificacion(params) {
  var def = TABLAS.PRODUCTOS_MARKET;
  var dato = params.dato || params;
  if (!dato[def.pk]) return respuestaJson({ ok: false, error: 'Falta ' + def.pk });
  var ss = getSS();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet) return respuestaJson({ ok: false, error: 'No existe la hoja ' + def.sheet });
  var rowNum = buscarFilaPorPK(sheet, def, dato[def.pk]);
  if (rowNum === -1) return respuestaJson({ ok: false, error: 'No encontrado.' });
  var fila = objetoAFila(def, dato);
  sheet.getRange(rowNum, 1, rowNum, def.columns.length).setValues([fila]);
  return respuestaJson({ ok: true, mensaje: 'Producto Market actualizado.' });
}

function productoMarketLeer(params) {
  var def = TABLAS.PRODUCTOS_MARKET;
  var ss = getSS();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet) return respuestaJson({ ok: true, datos: [] });
  var datos = sheet.getDataRange().getValues();
  if (datos.length < 2) return respuestaJson({ ok: true, datos: [] });
  var headers = datos[0];
  var filas = [];
  for (var i = 1; i < datos.length; i++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var val = c < datos[i].length ? datos[i][c] : '';
      obj[headers[c]] = (val !== undefined && val !== null) ? val : '';
    }
    var pkVal = (obj[def.pk] !== undefined && obj[def.pk] !== null) ? String(obj[def.pk]).trim() : '';
    if (pkVal === '') continue;
    filas.push(obj);
  }
  var id = params[def.pk] || params.id;
  if (id) {
    filas = filas.filter(function (f) { return String(f[def.pk]).trim() === String(id).trim(); });
  }
  return respuestaJson({ ok: true, datos: filas });
}

// --- VENTAS (ENERO y futuras hojas por mes) ---

var COLUMNAS_VENTAS = ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO', 'ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO'];

function ventaAlta(params) {
  var hojaNombre = params.hoja || 'ENERO';
  var def = TABLAS[hojaNombre] || { sheet: hojaNombre, pk: 'ID-VENTA', columns: COLUMNAS_VENTAS };
  var idVenta = params.idVenta || '';
  var fechaOperativa = params.fechaOperativa || '';
  var hora = params.hora || '';
  var nombreApellido = params.nombreApellido || params['NOMBRE-APELLIDO'] || '';
  var tipoListaPrecio = params.tipoListaPrecio || params['TIPO-LISTA-PRECIO'] || '';
  var usuario = String(params.usuario || params.USUARIO || '').trim() || nombreApellido || 'USR-MATIAS';
  var items = params.items || [];
  if (!idVenta || !items.length) return respuestaJson({ ok: false, error: 'Falta idVenta o items.' });
  var anio = new Date().getFullYear();
  var ss = getSS();
  var sheet = getHoja(ss, def.sheet, def.columns);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, def.columns.length).setValues([def.columns]);
    sheet.getRange(1, 1, 1, def.columns.length).setFontWeight('bold');
  }
  var filas = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    filas.push([
      idVenta,
      anio,
      fechaOperativa,
      hora,
      nombreApellido,
      tipoListaPrecio,
      it.idProducto || '',
      it.categoria || '',
      it.producto || '',
      it.cantidad !== undefined ? it.cantidad : 0,
      it.precio !== undefined ? it.precio : 0,
      it.monto !== undefined ? it.monto : 0,
      usuario
    ]);
  }
  if (filas.length === 0) return respuestaJson({ ok: true, mensaje: 'Sin ítems.' });
  var startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, filas.length, def.columns.length).setValues(filas);
  return respuestaJson({ ok: true, mensaje: 'Venta guardada.' });
}

function ventaMarketAlta(params) {
  var def = TABLAS.VENTAS_MARKET;
  var idVenta = params.idVenta || '';
  var fechaOperativa = params.fechaOperativa || '';
  var hora = params.hora || '';
  var nombreApellido = params.nombreApellido || params['NOMBRE-APELLIDO'] || '';
  var tipoListaPrecio = params.tipoListaPrecio || params['TIPO-LISTA-PRECIO'] || '';
  var usuario = String(params.usuario || params.USUARIO || '').trim() || nombreApellido || 'USR-MATIAS';
  var items = params.items || [];
  if (!idVenta || !items.length) return respuestaJson({ ok: false, error: 'Falta idVenta o items.' });
  var anio = new Date().getFullYear();
  var ss = getSS();
  var sheet = getHoja(ss, def.sheet, def.columns);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, def.columns.length).setValues([def.columns]);
    sheet.getRange(1, 1, 1, def.columns.length).setFontWeight('bold');
  }
  var filas = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    // PRECIO = Precio Unitario; MONTO = Subtotal (Precio Unitario × Cantidad)
    filas.push([
      idVenta,
      anio,
      fechaOperativa,
      hora,
      nombreApellido,
      tipoListaPrecio,
      it.idProducto || '',
      it.categoria || '',
      it.producto || '',
      it.cantidad !== undefined ? it.cantidad : 0,
      it.presentacionUnidadMedida || '',
      it.precio !== undefined ? it.precio : 0,  // Precio Unitario
      it.monto !== undefined ? it.monto : 0,
      usuario
    ]);
  }
  if (filas.length === 0) return respuestaJson({ ok: true, mensaje: 'Sin ítems.' });
  var startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, filas.length, def.columns.length).setValues(filas);
  return respuestaJson({ ok: true, mensaje: 'Venta guardada en VENTAS-MARKET.' });
}

function ventaBaja(params) {
  var hojaNombre = params.hoja || 'ENERO';
  var idVenta = params.idVenta || params['ID-VENTA'];
  if (!idVenta) return respuestaJson({ ok: false, error: 'Falta idVenta.' });
  var def = TABLAS[hojaNombre] || { sheet: hojaNombre, pk: 'ID-VENTA' };
  var ss = getSS();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet) return respuestaJson({ ok: false, error: 'No existe la hoja ' + def.sheet });
  var datos = sheet.getDataRange().getValues();
  if (datos.length < 2) return respuestaJson({ ok: true, mensaje: 'Nada que borrar.' });
  var colIdx = datos[0].indexOf('ID-VENTA');
  if (colIdx === -1) return respuestaJson({ ok: false, error: 'Columna ID-VENTA no encontrada.' });
  var filasABorrar = [];
  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][colIdx]) === String(idVenta)) filasABorrar.push(i + 1);
  }
  for (var j = filasABorrar.length - 1; j >= 0; j--) sheet.deleteRow(filasABorrar[j]);
  return respuestaJson({ ok: true, mensaje: 'Venta dada de baja.', filasBorradas: filasABorrar.length });
}

function ventaModificacion(params) {
  var hojaNombre = params.hoja || 'ENERO';
  var idVenta = params.idVenta || params['ID-VENTA'];
  var items = params.items || [];
  if (!idVenta) return respuestaJson({ ok: false, error: 'Falta idVenta.' });
  var def = TABLAS[hojaNombre] || { sheet: hojaNombre, pk: 'ID-VENTA', columns: COLUMNAS_VENTAS };
  var ss = getSS();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet) return respuestaJson({ ok: false, error: 'No existe la hoja ' + def.sheet });
  var datos = sheet.getDataRange().getValues();
  var headers = datos[0];
  var colIdx = headers.indexOf('ID-VENTA');
  var colAnio = headers.indexOf('AÑO');
  var colNombre = headers.indexOf('NOMBRE-APELLIDO');
  var colTipoLista = headers.indexOf('TIPO-LISTA-PRECIO');
  var colUsuario = headers.indexOf('USUARIO');
  if (colIdx === -1) return respuestaJson({ ok: false, error: 'Columna ID-VENTA no encontrada.' });
  var nombreApellido = params.nombreApellido || params['NOMBRE-APELLIDO'];
  var tipoListaPrecio = params.tipoListaPrecio || params['TIPO-LISTA-PRECIO'];
  var usuario = params.usuario || params.USUARIO;
  var filasActualizadas = 0;
  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][colIdx]) === String(idVenta) && items[filasActualizadas]) {
      var it = items[filasActualizadas];
      var anio = colAnio >= 0 ? datos[i][colAnio] : new Date().getFullYear();
      var nom = nombreApellido !== undefined ? nombreApellido : (colNombre >= 0 ? datos[i][colNombre] : '');
      var tipo = tipoListaPrecio !== undefined ? tipoListaPrecio : (colTipoLista >= 0 ? datos[i][colTipoLista] : '');
      var usr = usuario !== undefined ? usuario : (colUsuario >= 0 ? datos[i][colUsuario] : '');
      var fila = [
        idVenta,
        anio,
        it.fechaOperativa !== undefined ? it.fechaOperativa : (headers.indexOf('FECHA_OPERATIVA') >= 0 ? datos[i][headers.indexOf('FECHA_OPERATIVA')] : ''),
        it.hora !== undefined ? it.hora : (headers.indexOf('HORA') >= 0 ? datos[i][headers.indexOf('HORA')] : ''),
        nom,
        tipo,
        it.idProducto !== undefined ? it.idProducto : (headers.indexOf('ID-PRODUCTO') >= 0 ? datos[i][headers.indexOf('ID-PRODUCTO')] : ''),
        it.categoria !== undefined ? it.categoria : (headers.indexOf('CATEGORIA') >= 0 ? datos[i][headers.indexOf('CATEGORIA')] : ''),
        it.producto !== undefined ? it.producto : (headers.indexOf('PRODUCTO') >= 0 ? datos[i][headers.indexOf('PRODUCTO')] : ''),
        it.cantidad !== undefined ? it.cantidad : (headers.indexOf('CANTIDAD') >= 0 ? datos[i][headers.indexOf('CANTIDAD')] : 0),
        it.precio !== undefined ? it.precio : (headers.indexOf('PRECIO') >= 0 ? datos[i][headers.indexOf('PRECIO')] : 0),
        it.monto !== undefined ? it.monto : (headers.indexOf('MONTO') >= 0 ? datos[i][headers.indexOf('MONTO')] : 0),
        usr
      ];
      sheet.getRange(i + 1, 1, i + 1, def.columns.length).setValues([fila]);
      filasActualizadas++;
    }
  }
  return respuestaJson({ ok: true, mensaje: 'Venta actualizada.', filasActualizadas: filasActualizadas });
}

function ventaLeer(params) {
  var hojaNombre = params.hoja || 'ENERO';
  var idVenta = params.idVenta || params['ID-VENTA'];
  var def = TABLAS[hojaNombre] || { sheet: hojaNombre, columns: COLUMNAS_VENTAS };
  var ss = getSS();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet) return respuestaJson({ ok: true, datos: [] });
  var datos = sheet.getDataRange().getValues();
  if (datos.length < 2) return respuestaJson({ ok: true, datos: [] });
  var headers = datos[0];
  var filas = [];
  for (var i = 1; i < datos.length; i++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var val = c < datos[i].length ? datos[i][c] : '';
      obj[headers[c]] = (val !== undefined && val !== null) ? val : '';
    }
    filas.push(obj);
  }
  if (idVenta) filas = filas.filter(function (f) { return String(f['ID-VENTA'] || '').trim() === String(idVenta).trim(); });
  return respuestaJson({ ok: true, datos: filas });
}

// --- RESUMEN-VENTAS ---

function resumenAlta(params) {
  var def = TABLAS.RESUMEN_VENTAS;
  var dato = params.dato || params;
  if (!dato.MES) return respuestaJson({ ok: false, error: 'Falta MES.' });
  var ss = getSS();
  var sheet = getHoja(ss, def.sheet, def.columns);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, def.columns.length).setValues([def.columns]);
    sheet.getRange(1, 1, 1, def.columns.length).setFontWeight('bold');
  }
  var fila = [
    dato.MES || '',
    dato.DIA !== undefined ? dato.DIA : '',
    dato.CATEGORIA || '',
    dato['NOMBRE-PRODUCTO'] || '',
    dato.CANTIDAD !== undefined ? dato.CANTIDAD : '',
    dato.MONTO !== undefined ? dato.MONTO : ''
  ];
  sheet.appendRow(fila);
  return respuestaJson({ ok: true, mensaje: 'Resumen dado de alta.' });
}

function resumenBaja(params) {
  var def = TABLAS.RESUMEN_VENTAS;
  var mes = params.MES || params.mes;
  var categoria = params.CATEGORIA;
  var nombreProducto = params['NOMBRE-PRODUCTO'] || params.nombreProducto;
  if (!mes) return respuestaJson({ ok: false, error: 'Falta MES.' });
  var ss = getSS();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet) return respuestaJson({ ok: false, error: 'No existe la hoja ' + def.sheet });
  var datos = sheet.getDataRange().getValues();
  if (datos.length < 2) return respuestaJson({ ok: true, mensaje: 'Nada que borrar.' });
  var headers = datos[0];
  var colMes = headers.indexOf('MES');
  var colCat = headers.indexOf('CATEGORIA');
  var colNom = headers.indexOf('NOMBRE-PRODUCTO');
  var filasABorrar = [];
  for (var i = 1; i < datos.length; i++) {
    var coincide = String(datos[i][colMes]) === String(mes);
    if (categoria != null && categoria !== '') coincide = coincide && String(datos[i][colCat]) === String(categoria);
    if (nombreProducto != null && nombreProducto !== '') coincide = coincide && String(datos[i][colNom]) === String(nombreProducto);
    if (coincide) filasABorrar.push(i + 1);
  }
  for (var j = filasABorrar.length - 1; j >= 0; j--) sheet.deleteRow(filasABorrar[j]);
  return respuestaJson({ ok: true, mensaje: 'Resumen dado de baja.', filasBorradas: filasABorrar.length });
}

function resumenModificacion(params) {
  var def = TABLAS.RESUMEN_VENTAS;
  var dato = params.dato || params;
  if (!dato.MES) return respuestaJson({ ok: false, error: 'Falta MES.' });
  var ss = getSS();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet) return respuestaJson({ ok: false, error: 'No existe la hoja ' + def.sheet });
  var datos = sheet.getDataRange().getValues();
  var headers = datos[0];
  var colMes = headers.indexOf('MES');
  var colCat = headers.indexOf('CATEGORIA');
  var colNom = headers.indexOf('NOMBRE-PRODUCTO');
  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][colMes]) === String(dato.MES) &&
        (dato.CATEGORIA == null || String(datos[i][colCat]) === String(dato.CATEGORIA)) &&
        (dato['NOMBRE-PRODUCTO'] == null || String(datos[i][colNom]) === String(dato['NOMBRE-PRODUCTO']))) {
      var fila = [
        dato.MES !== undefined ? dato.MES : datos[i][0],
        dato.DIA !== undefined ? dato.DIA : datos[i][1],
        dato.CATEGORIA !== undefined ? dato.CATEGORIA : datos[i][2],
        dato['NOMBRE-PRODUCTO'] !== undefined ? dato['NOMBRE-PRODUCTO'] : datos[i][3],
        dato.CANTIDAD !== undefined ? dato.CANTIDAD : datos[i][4],
        dato.MONTO !== undefined ? dato.MONTO : datos[i][5]
      ];
      sheet.getRange(i + 1, 1, i + 1, def.columns.length).setValues([fila]);
      return respuestaJson({ ok: true, mensaje: 'Resumen actualizado.' });
    }
  }
  return respuestaJson({ ok: false, error: 'No encontrado.' });
}

function resumenLeer(params) {
  var def = TABLAS.RESUMEN_VENTAS;
  var mes = params.MES || params.mes;
  var ss = getSS();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet) return respuestaJson({ ok: true, datos: [] });
  var datos = sheet.getDataRange().getValues();
  if (datos.length < 2) return respuestaJson({ ok: true, datos: [] });
  var headers = datos[0];
  var filas = [];
  for (var i = 1; i < datos.length; i++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) obj[headers[c]] = datos[i][c];
    filas.push(obj);
  }
  if (mes) filas = filas.filter(function (f) { return String(f.MES) === String(mes); });
  return respuestaJson({ ok: true, datos: filas });
}

// --- RESUMEN-OPERATIVO ---

function resumenOperativoAlta(params) {
  var def = TABLAS.RESUMEN_OPERATIVO;
  var dato = params.dato || params;
  if (!dato[def.pk]) return respuestaJson({ ok: false, error: 'Falta ' + def.pk });
  var ss = getSS();
  var sheet = getHoja(ss, def.sheet, def.columns);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, def.columns.length).setValues([def.columns]);
    sheet.getRange(1, 1, 1, def.columns.length).setFontWeight('bold');
  }
  var fila = objetoAFila(def, dato);
  var rowNum = buscarFilaPorPK(sheet, def, dato[def.pk]);
  if (rowNum > 0) return respuestaJson({ ok: false, error: 'Ya existe un registro con ese ' + def.pk });
  sheet.appendRow(fila);
  return respuestaJson({ ok: true, mensaje: 'Resumen operativo dado de alta.' });
}

function resumenOperativoBaja(params) {
  var def = TABLAS.RESUMEN_OPERATIVO;
  var pkValor = params[def.pk] || params.id;
  if (!pkValor) return respuestaJson({ ok: false, error: 'Falta ' + def.pk });
  var ss = getSS();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet) return respuestaJson({ ok: false, error: 'No existe la hoja ' + def.sheet });
  var rowNum = buscarFilaPorPK(sheet, def, pkValor);
  if (rowNum === -1) return respuestaJson({ ok: false, error: 'No encontrado.' });
  sheet.deleteRow(rowNum);
  return respuestaJson({ ok: true, mensaje: 'Resumen operativo dado de baja.' });
}

function resumenOperativoModificacion(params) {
  var def = TABLAS.RESUMEN_OPERATIVO;
  var dato = params.dato || params;
  if (!dato[def.pk]) return respuestaJson({ ok: false, error: 'Falta ' + def.pk });
  var ss = getSS();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet) return respuestaJson({ ok: false, error: 'No existe la hoja ' + def.sheet });
  var rowNum = buscarFilaPorPK(sheet, def, dato[def.pk]);
  if (rowNum === -1) return respuestaJson({ ok: false, error: 'No encontrado.' });
  var fila = objetoAFila(def, dato);
  sheet.getRange(rowNum, 1, rowNum, def.columns.length).setValues([fila]);
  return respuestaJson({ ok: true, mensaje: 'Resumen operativo actualizado.' });
}

function resumenOperativoLeer(params) {
  var def = TABLAS.RESUMEN_OPERATIVO;
  var ss = getSS();
  var sheet = ss.getSheetByName(def.sheet) || ss.getSheetByName('RESUMEN OPERATIVO');
  if (!sheet) {
    return respuestaJson({ ok: false, error: 'No existe la hoja RESUMEN-OPERATIVO. Revisá que la pestaña del Sheet se llame exactamente así.' });
  }
  var datos = sheet.getDataRange().getValues();
  if (datos.length < 2) return respuestaJson({ ok: true, datos: [] });
  var headers = datos[0];
  var colCount = Math.min(headers.length, def.columns.length);
  var tz = Session.getScriptTimeZone() || 'America/Argentina/Buenos_Aires';
  var filas = [];
  for (var i = 1; i < datos.length; i++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var val = c < datos[i].length ? datos[i][c] : '';
      if (val === undefined || val === null) val = '';
      var key = (c < colCount) ? def.columns[c] : (headers[c] || '');
      if (key) obj[key] = val;
    }
    for (var k = 0; k < def.columns.length; k++) {
      if (obj[def.columns[k]] === undefined) obj[def.columns[k]] = '';
    }
    if (obj.FECHA_OPERATIVA && obj.FECHA_OPERATIVA instanceof Date) {
      obj.FECHA_OPERATIVA = Utilities.formatDate(obj.FECHA_OPERATIVA, tz, 'yyyy-MM-dd');
    }
    if (obj.HORA && obj.HORA instanceof Date) {
      obj.HORA = Utilities.formatDate(obj.HORA, tz, 'HH:mm');
    }
    filas.push(obj);
  }
  var id = params[def.pk] || params.id;
  if (id) {
    filas = filas.filter(function (f) { return String(f[def.pk] || '').trim() === String(id).trim(); });
  }
  return respuestaJson({ ok: true, datos: filas });
}

// --- OPERACIONES-GENERALES (Gastos de Salida) ---

function operacionesGralAlta(params) {
  var def = TABLAS.OPERACIONES_GENERALES;
  var dato = params.dato || params;
  var idGral = dato['ID-OPERACION-GRAL'] || params.idOperacionGral || '';
  if (!idGral) return respuestaJson({ ok: false, error: 'Falta ID-OPERACION-GRAL.' });
  var ss = getSS();
  var sheet = getHoja(ss, def.sheet, def.columns);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, def.columns.length).setValues([def.columns]);
    sheet.getRange(1, 1, 1, def.columns.length).setFontWeight('bold');
  }
  var usuario = String(params.usuario || params.USUARIO || dato.USUARIO || '').trim() || 'USR-MATIAS';
  var obj = {
    'ID-OPERACION-GRAL': idGral,
    'FECHA_OPERATIVA': dato['FECHA_OPERATIVA'] !== undefined ? dato['FECHA_OPERATIVA'] : (params.fechaOperativa || ''),
    'HORA': dato['HORA'] !== undefined ? dato['HORA'] : (params.hora || ''),
    'CORRESPONDE-A': dato['CORRESPONDE-A'] !== undefined ? dato['CORRESPONDE-A'] : (params.correspondeA || ''),
    'TIPO-OPERACION': dato['TIPO-OPERACION'] !== undefined ? dato['TIPO-OPERACION'] : (params.tipoOperacion || ''),
    'DESCRIPCION': dato['DESCRIPCION'] !== undefined ? dato['DESCRIPCION'] : (params.descripcion || ''),
    'IMPORTE': dato['IMPORTE'] !== undefined ? dato['IMPORTE'] : (params.importe !== undefined ? params.importe : 0),
    'USUARIO': usuario
  };
  var fila = objetoAFila(def, obj);
  sheet.appendRow(fila);
  return respuestaJson({ ok: true, mensaje: 'Operación guardada en OPERACIONES-GENERALES.' });
}

// --- COMPONENTE-COMBO (valores para combos: sucursal, tipo operación, categorías) ---

function componenteComboLeer(params) {
  var def = TABLAS.COMPONENTE_COMBO;
  var ss = getSS();
  var sheet = ss.getSheetByName(def.sheet);
  if (!sheet) return respuestaJson({ ok: true, datos: [] });
  var datos = sheet.getDataRange().getValues();
  if (datos.length < 2) return respuestaJson({ ok: true, datos: [] });
  var headers = datos[0];
  var colNames = ['COMBO-SUCURSAL-COMERCIO', 'TIPO-OPERACION', 'COMBO-CATEGORIA-PANADERIA', 'COMBO-CATEGORIA-MARKET'];
  var indices = colNames.map(function (name) { return headers.indexOf(name); });
  var filas = [];
  for (var i = 1; i < datos.length; i++) {
    var row = datos[i];
    var obj = {};
    colNames.forEach(function (name, idx) {
      var j = indices[idx];
      var val = (j !== -1 && row[j] !== undefined && row[j] !== null) ? String(row[j]).trim() : '';
      obj[name] = val;
    });
    filas.push(obj);
  }
  return respuestaJson({ ok: true, datos: filas });
}

// --- CIERRE OPERACIONES DÍA (Compras Panadería + Ventas Market + Gastos Salida por fecha) ---

var NOMBRES_HOJAS_MES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

function normalizarFechaOperativa(val, tz) {
  if (val === undefined || val === null || val === '') return '';
  if (val instanceof Date) {
    tz = tz || Session.getScriptTimeZone() || 'America/Argentina/Buenos_Aires';
    return Utilities.formatDate(val, tz, 'yyyy-MM-dd');
  }
  var s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  return s;
}

function leerHojaYFiltrarPorFecha(ss, nombreHoja, columnas, fechaYyyyMmDd) {
  var sheet = ss.getSheetByName(nombreHoja);
  if (!sheet) return [];
  var datos = sheet.getDataRange().getValues();
  if (datos.length < 2) return [];
  var headers = datos[0];
  var colFecha = headers.indexOf('FECHA_OPERATIVA');
  if (colFecha === -1) return [];
  var tz = Session.getScriptTimeZone() || 'America/Argentina/Buenos_Aires';
  var filas = [];
  for (var i = 1; i < datos.length; i++) {
    var fechaVal = datos[i][colFecha];
    var fechaStr = normalizarFechaOperativa(fechaVal, tz);
    if (fechaStr !== fechaYyyyMmDd) continue;
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var v = c < datos[i].length ? datos[i][c] : '';
      if (v instanceof Date && headers[c] === 'HORA') v = Utilities.formatDate(v, tz, 'HH:mm');
      else if (v instanceof Date && headers[c] === 'FECHA_OPERATIVA') v = Utilities.formatDate(v, tz, 'yyyy-MM-dd');
      obj[headers[c]] = (v !== undefined && v !== null) ? v : '';
    }
    filas.push(obj);
  }
  return filas;
}

function cierreOperacionesDiaLeer(params) {
  var fechaParam = params.fecha || params.fechaOperativa || '';
  if (!fechaParam) return respuestaJson({ ok: false, error: 'Falta fecha (YYYY-MM-DD).' });
  var fechaStr = normalizarFechaOperativa(fechaParam);
  if (fechaStr.length !== 10) return respuestaJson({ ok: false, error: 'Fecha inválida. Usar YYYY-MM-DD.' });
  var partes = fechaStr.split('-');
  var anio = parseInt(partes[0], 10);
  var mes = parseInt(partes[1], 10);
  if (isNaN(mes) || mes < 1 || mes > 12) return respuestaJson({ ok: false, error: 'Mes inválido.' });
  var nombreHojaMes = NOMBRES_HOJAS_MES[mes - 1];
  var ss = getSS();
  var comprasPanaderia = leerHojaYFiltrarPorFecha(ss, nombreHojaMes, TABLAS[nombreHojaMes] ? TABLAS[nombreHojaMes].columns : COLUMNAS_VENTAS, fechaStr);
  var defMarket = TABLAS.VENTAS_MARKET;
  var ventasMarket = leerHojaYFiltrarPorFecha(ss, defMarket.sheet, defMarket.columns, fechaStr);
  var defOpGral = TABLAS.OPERACIONES_GENERALES;
  var gastosSalida = leerHojaYFiltrarPorFecha(ss, defOpGral.sheet, defOpGral.columns, fechaStr);
  return respuestaJson({
    ok: true,
    fecha: fechaStr,
    comprasPanaderia: comprasPanaderia,
    ventasMarket: ventasMarket,
    gastosSalida: gastosSalida
  });
}

function respuestaJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
