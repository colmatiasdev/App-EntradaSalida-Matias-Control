/**
 * Definición de tablas (columnas y claves primarias).
 * Debe cargarse después de config.js si se usa APP_CONFIG.
 */
(function (global) {
  'use strict';

  var Tables = {
    PRODUCTOS: {
      pk: 'ID-PRODUCTO',
      columns: ['ID-PRODUCTO', 'CATEGORIA', 'NOMBRE-PRODUCTO', 'PRECIO', 'HABILITADO']
    },
    /** Nombres de las hojas/tabs por mes (1=ENERO … 12=DICIEMBRE). */
    NOMBRES_HOJAS_MES: [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ],
    VENTAS: {
      /** Columnas comunes a todas las hojas de ventas (ENERO … DICIEMBRE). */
      columns: ['ID-VENTA', 'FECHA_OPERATIVA', 'HORA', 'ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'MONTO']
    }
  };

  global.APP_TABLES = Tables;
})(typeof window !== 'undefined' ? window : this);
