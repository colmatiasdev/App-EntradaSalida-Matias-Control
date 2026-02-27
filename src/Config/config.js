/**
 * Configuración centralizada de la aplicación.
 *
 * ÚNICO ORIGEN DE DATOS: APP_SCRIPT_URL (Web App de Google Apps Script).
 * - Productos → productoLeer → hoja PRODUCTOS
 * - Clientes  → clienteLeer  → hoja CLIENTES
 * - Ventas   → ventaLeer / guardarVenta → hojas ENERO..DICIEMBRE
 * El Sheet usado está definido en appscript/Code.gs (SPREADSHEET_ID). Debe coincidir con SPREADSHEET_ID de abajo.
 */
(function (global) {
  'use strict';

  var Config = {
    /**
     * ID del Google Sheet. DEBE SER EL MISMO que en appscript/Code.gs (variable SPREADSHEET_ID).
     * Se obtiene de la URL de edición: .../spreadsheets/d/ESTE_ID/edit
     */
    SPREADSHEET_ID: '1FOjy3jePjs0u76-tVf7QdRiufVWGbdHZVtHJH9beePU',

    /**
     * URL del Web App de Google Apps Script (despliegue). ÚNICA fuente de datos de la app.
     * Copiar aquí la URL que da "Implementar" > "Aplicación web" en el proyecto Apps Script vinculado al Sheet anterior.
     */
    APP_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwo69-zJdBIwkGQmf3hyMcBwaSKEitIeC0IbP35w25-Nl3w-PcBiNCX7TBwKvEfYK8K2Q/exec',

    /** Nombres de las hojas (igual que en Code.gs y tables.js). */
    HOJA_PRODUCTOS: 'PRODUCTOS',
    HOJA_CLIENTES: 'CLIENTES',

    /** Valor fijo para la columna USUARIO al guardar ventas/compras en el Sheet. */
    USUARIO: 'USR-MATIAS',

   /**
   * Cómo se muestra cada código de usuario en pantalla (etiqueta y color de identificación).
   * Clave = valor guardado en el Sheet (columna USUARIO).
   * Valor = { etiqueta: 'Nombre', color: '#hex' }.
   */
    USUARIO_ETIQUETAS: {
      'USR-SILVINA': { etiqueta: 'Silvina', color: '#c0392b' },
      'USR-MATIAS': { etiqueta: 'Matias', color: '#2980b9' },
      'USR-MILY': { etiqueta: 'Mily', color: '#27ae60' },
      'USR-VICKY': { etiqueta: 'Vicky', color: '#8e44ad' }
    },

    /**
     * Unidades de medida (PRESENTACION-UNIDAD-MEDIDA) que usan cantidad decimal en el resumen de venta.
     * Para estos valores la cantidad es un campo numérico libre con 2 decimales (ej. GRAMOS, KG).
     * Cualquier otra unidad usa cantidad entera con botones +/-.
     */
    UNIDADES_CANTIDAD_DECIMAL: ['GRAMOS', 'KG'],

    /**
     * Cálculo de la columna "Precio Unitario" en el resumen de venta (Nueva Venta Market).
     * Precio Unitario = columnaCosto / columnaCantidad (2 decimales).
     */
    PRECIO_UNITARIO_CALCULO: {
      columnaCosto: 'COSTO',
      columnaCantidad: 'PRESENTACION-CANTIDAD-UNIDAD-MEDIDA'
    },

    /**
     * Categorías para el filtro en Nueva venta. Mismo orden que en la hoja PRODUCTOS (columna CATEGORIA).
     */
    CATEGORIAS: [
      'ALFAJOR',
      'BUDINES',
      'ROSCAS',
      'HOJALDRE',
      'GALLETAS',
      'PANADERIA',
      'ESPECIALIDADES',
      'VARIOS'
    ],

    /** Proxy CORS. Dejar '' para usar directo APP_SCRIPT_URL. */
    CORS_PROXY: ''
  };

  global.APP_CONFIG = Config;
})(typeof window !== 'undefined' ? window : this);
