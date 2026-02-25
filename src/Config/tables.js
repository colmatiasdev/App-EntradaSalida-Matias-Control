/**
 * Definición de tablas del Sheet (columnas y PK).
 * Cada tabla = una hoja en el documento. Se pueden agregar más tablas luego.
 */
(function (global) {
  'use strict';

  var Tables = {
    /** Tabla CLIENTES: hoja "CLIENTES". PK = ID-CLIENTE */
    CLIENTES: {
      sheet: 'CLIENTES',
      pk: 'ID-CLIENTE',
      columns: ['ID-CLIENTE', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO', 'WHATSAPP', 'OBSERVACION', 'HABILITADO']
    },

    /** Tabla PRODUCTOS: hoja "PRODUCTOS". PK = ID-PRODUCTO */
    PRODUCTOS: {
      sheet: 'PRODUCTOS',
      pk: 'ID-PRODUCTO',
      columns: ['ID-PRODUCTO', 'COMERCIO-SUCURSAL', 'CATEGORIA', 'NOMBRE-PRODUCTO', 'PRECIO', 'HABILITADO']
    },

    /** Tabla PRODUCTOS-MARKET: hoja "PRODUCTOS-MARKET". PK = ID-PRODUCTO (secuencial IDPROD-MK-1, IDPROD-MK-2, ...) */
    PRODUCTOS_MARKET: {
      sheet: 'PRODUCTOS-MARKET',
      pk: 'ID-PRODUCTO',
      columns: ['ID-PRODUCTO', 'COMERCIO-SUCURSAL', 'CATEGORIA', 'NOMBRE-PRODUCTO', 'PRESENTACION-CANTIDAD-UNIDAD-MEDIDA', 'PRESENTACION-UNIDAD-MEDIDA', 'COSTO', 'HABILITADO']
    },

    /** Tablas de ventas por mes. PK = ID-VENTA (puede haber varias filas por venta). */
    ENERO: {
      sheet: 'ENERO',
      pk: 'ID-VENTA',
      columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO','ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO']
    },
    FEBRERO: {
      sheet: 'FEBRERO',
      pk: 'ID-VENTA',
      columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO','ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO']
    },
    MARZO: {
      sheet: 'MARZO',
      pk: 'ID-VENTA',
      columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO','ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO']
    },
    ABRIL: {
      sheet: 'ABRIL',
      pk: 'ID-VENTA',
      columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO','ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO']
    },
    MAYO: {
      sheet: 'MAYO',
      pk: 'ID-VENTA',
      columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO','ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO']
    },
    JUNIO: {
      sheet: 'JUNIO',
      pk: 'ID-VENTA',
      columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO','ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO']
    },
    JULIO: {
      sheet: 'JULIO',
      pk: 'ID-VENTA',
      columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO','ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO']
    },
    AGOSTO: {
      sheet: 'AGOSTO',
      pk: 'ID-VENTA',
      columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO','ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO']
    },
    SEPTIEMBRE: {
      sheet: 'SEPTIEMBRE',
      pk: 'ID-VENTA',
      columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO','ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO']
    },
    OCTUBRE: {
      sheet: 'OCTUBRE',
      pk: 'ID-VENTA',
      columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO','ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO']
    },
    NOVIEMBRE: {
      sheet: 'NOVIEMBRE',
      pk: 'ID-VENTA',
      columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO','ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO']
    },
    DICIEMBRE: {
      sheet: 'DICIEMBRE',
      pk: 'ID-VENTA',
      columns: ['ID-VENTA', 'AÑO', 'FECHA_OPERATIVA', 'HORA', 'NOMBRE-APELLIDO', 'TIPO-LISTA-PRECIO','ID-PRODUCTO', 'CATEGORIA', 'PRODUCTO', 'CANTIDAD', 'PRECIO', 'MONTO', 'USUARIO']
    },

    /** Tabla RESUMEN-VENTAS: resumen por mes, día, categoría y producto. */
    RESUMEN_VENTAS: {
      sheet: 'RESUMEN-VENTAS',
      pk: 'MES',
      columns: ['MES', 'DIA', 'CATEGORIA', 'NOMBRE-PRODUCTO', 'CANTIDAD', 'MONTO']
    },

    /** Tabla OPERACIONES-GENERALES: operaciones generales con descripción e importe. */
    OPERACIONES_GENERALES: {
      sheet: 'OPERACIONES-GENERALES',
      pk: 'ID-OPERACION-GRAL',
      columns: ['ID-OPERACION-GRAL', 'FECHA_OPERATIVA', 'HORA', 'CORRESPONDE-A', 'TIPO-OPERACION', 'DESCRIPCION', 'IMPORTE', 'USUARIO']
    },

    /** Tabla RESUMEN-OPERATIVO: resumen operativo por fecha, hora, tipo y categoría. */
    RESUMEN_OPERATIVO: {
      sheet: 'RESUMEN-OPERATIVO',
      pk: 'ID-RESUMEN',
      columns: ['ID-RESUMEN', 'FECHA_OPERATIVA', 'HORA', 'CORRESPONDE-A', 'TIPO-OPERACION', 'CATEGORIA', 'IMPORTE']
    },

    /** Tabla COMPONENTE-COMBO: valores para combos (sucursal, tipo operación, categorías). */
    COMPONENTE_COMBO: {
      sheet: 'COMPONENTE-COMBO',
      columns: ['COMBO-SUCURSAL-COMERCIO', 'TIPO-OPERACION', 'COMBO-CATEGORIA-PANADERIA', 'COMBO-CATEGORIA-MARKET']
    }
  };

  /** Nombres de hojas por mes (1=ENERO … 12=DICIEMBRE). Ir agregando tablas ENERO, FEBRERO, etc. */
  Tables.NOMBRES_HOJAS_MES = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];

  global.APP_TABLES = Tables;
})(typeof window !== 'undefined' ? window : this);
