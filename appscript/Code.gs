/**
 * Web App - Toti Sanguicería Ventas
 * Desplegar como "Aplicación web": ejecutar como yo, quién tiene acceso: cualquiera.
 * Copiar la URL de despliegue en config.js → APP_SCRIPT_URL.
 *
 * Tablas (hojas) del documento: ENERO, FEBRERO, MARZO, ABRIL, MAYO, JUNIO,
 * JULIO, AGOSTO, SEPTIEMBRE, OCTUBRE, NOVIEMBRE, DICIEMBRE.
 * Todas con las mismas columnas y PK = ID-VENTA.
 */

/** ID del Google Sheet (solo el ID, no la URL completa).
 *  Obtenerlo de: https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
 *  No usar la URL de publicación (/pub?output=csv). */
var SPREADSHEET_ID = 'REEMPLAZAR_CON_ID_DE_TU_HOJA';

/** Nombres de las hojas/tabs de ventas por mes (índice 0 = ENERO … 11 = DICIEMBRE). */
var NOMBRES_HOJAS_MES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

/** Columnas de todas las tablas de ventas (ENERO … DICIEMBRE). PK = ID-VENTA. */
var COLUMNAS_VENTAS = [
  'ID-VENTA',
  'FECHA_OPERATIVA',
  'HORA',
  'ID-PRODUCTO',
  'CATEGORIA',
  'PRODUCTO',
  'MONTO'
];

function doGet(e) {
  return respuestaJson({ ok: true, mensaje: 'Usar POST para operaciones.' });
}

function doPost(e) {
  try {
    var params = {};
    if (e.postData && e.postData.contents) {
      var raw = e.postData.contents;
      var dataIdx = raw.indexOf('data=');
      if (dataIdx !== -1) {
        var jsonStr = decodeURIComponent(raw.substring(dataIdx + 5).replace(/\+/g, ' '));
        params = JSON.parse(jsonStr);
      } else if (raw.trim().indexOf('{') === 0) {
        params = JSON.parse(raw);
      }
    }
    var accion = params.accion || '';

    if (accion === 'guardarVenta') {
      return guardarVenta(params);
    }

    return respuestaJson({ ok: false, error: 'Acción no reconocida: ' + accion });
  } catch (err) {
    return respuestaJson({ ok: false, error: err.toString() });
  }
}

function guardarVenta(params) {
  var hojaNombre = params.hoja || '';
  var idVenta = params.idVenta || '';
  var fechaOperativa = params.fechaOperativa || '';
  var hora = params.hora || '';
  var items = params.items || [];

  if (!hojaNombre) {
    return respuestaJson({ ok: false, error: 'Falta nombre de hoja (mes).' });
  }
  if (!idVenta) {
    return respuestaJson({ ok: false, error: 'Falta ID-VENTA.' });
  }
  if (!items.length) {
    return respuestaJson({ ok: false, error: 'Falta detalle de ítems.' });
  }

  if (!SPREADSHEET_ID || SPREADSHEET_ID.indexOf('REEMPLAZAR') !== -1 || SPREADSHEET_ID.length < 40) {
    return respuestaJson({ ok: false, error: 'Configura SPREADSHEET_ID en Code.gs con el ID de tu Google Sheet (ver URL del documento, no la URL de publicación).' });
  }

  var ss;
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (err) {
    return respuestaJson({ ok: false, error: 'No se pudo abrir el Sheet. Revisa que SPREADSHEET_ID sea correcto y que el script tenga acceso al documento.' });
  }

  var sheet = obtenerOCrearHoja(ss, hojaNombre);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, COLUMNAS_VENTAS.length).setValues([COLUMNAS_VENTAS]);
    sheet.getRange(1, 1, 1, COLUMNAS_VENTAS.length).setFontWeight('bold');
  }

  var filas = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    filas.push([
      idVenta,
      fechaOperativa,
      hora,
      it.idProducto || '',
      it.categoria || '',
      it.producto || '',
      it.monto || 0
    ]);
  }
  if (filas.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, sheet.getLastRow() + filas.length, COLUMNAS_VENTAS.length)
      .setValues(filas);
  }

  return respuestaJson({ ok: true, mensaje: 'Venta guardada.' });
}

function obtenerOCrearHoja(ss, nombreHoja) {
  var sheet = ss.getSheetByName(nombreHoja);
  if (!sheet) {
    sheet = ss.insertSheet(nombreHoja);
    sheet.getRange(1, 1, 1, COLUMNAS_VENTAS.length).setValues([COLUMNAS_VENTAS]);
    sheet.getRange(1, 1, 1, COLUMNAS_VENTAS.length).setFontWeight('bold');
  }
  return sheet;
}

function respuestaJson(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
