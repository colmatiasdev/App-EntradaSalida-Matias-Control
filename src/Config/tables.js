/**
 * Definición de tablas (columnas y claves primarias).
 * Debe cargarse después de config.js si se usa APP_CONFIG.
 *
 * Tablas de ventas por mes: ENERO, FEBRERO, MARZO, ABRIL, MAYO, JUNIO,
 * JULIO, AGOSTO, SEPTIEMBRE, OCTUBRE, NOVIEMBRE, DICIEMBRE.
 * Todas tienen las mismas columnas y PK = ID-VENTA.
 */
(function (global) {
  'use strict';

  /** Columnas y PK comunes a todas las hojas de ventas (ENERO … DICIEMBRE). */
  var COLUMNAS_VENTAS = ['ID-VENTA', 'FECHA_OPERATIVA', 'HORA', 'ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'MONTO'];
  var NOMBRES_HOJAS_VENTAS = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];

  var Tables = {
    PRODUCTOS: {
      pk: 'ID-PRODUCTO',
      columns: ['ID-PRODUCTO', 'CATEGORIA', 'NOMBRE-PRODUCTO', 'PRECIO', 'HABILITADO']
    },
    /** Nombres de las hojas/tabs de ventas por mes (1=ENERO … 12=DICIEMBRE). */
    NOMBRES_HOJAS_MES: NOMBRES_HOJAS_VENTAS,
    /** Definición común para todas las tablas de ventas (ENERO … DICIEMBRE). */
    VENTAS: {
      pk: 'ID-VENTA',
      columns: COLUMNAS_VENTAS
    },
    /** Definición explícita por mes (misma estructura en todas). */
    ENERO:    { pk: 'ID-VENTA', columns: COLUMNAS_VENTAS },
    FEBRERO:  { pk: 'ID-VENTA', columns: COLUMNAS_VENTAS },
    MARZO:    { pk: 'ID-VENTA', columns: COLUMNAS_VENTAS },
    ABRIL:    { pk: 'ID-VENTA', columns: COLUMNAS_VENTAS },
    MAYO:     { pk: 'ID-VENTA', columns: COLUMNAS_VENTAS },
    JUNIO:    { pk: 'ID-VENTA', columns: COLUMNAS_VENTAS },
    JULIO:    { pk: 'ID-VENTA', columns: COLUMNAS_VENTAS },
    AGOSTO:   { pk: 'ID-VENTA', columns: COLUMNAS_VENTAS },
    SEPTIEMBRE: { pk: 'ID-VENTA', columns: COLUMNAS_VENTAS },
    OCTUBRE:  { pk: 'ID-VENTA', columns: COLUMNAS_VENTAS },
    NOVIEMBRE: { pk: 'ID-VENTA', columns: COLUMNAS_VENTAS },
    DICIEMBRE: { pk: 'ID-VENTA', columns: COLUMNAS_VENTAS }
  };

  global.APP_TABLES = Tables;
})(typeof window !== 'undefined' ? window : this);
