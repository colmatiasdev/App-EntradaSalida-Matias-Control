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
    APP_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxlV3L6Q6AeZmXFFpKCv8PZ4ACO9Om6V5nDpU2kbEl_Jr4s_VvgEBCS-0nv4CJ62Feh9g/exec',

    /** Nombres de las hojas (igual que en Code.gs y tables.js). */
    HOJA_PRODUCTOS: 'PRODUCTOS',
    HOJA_CLIENTES: 'CLIENTES',

    /** Valor fijo para la columna USUARIO al guardar ventas/compras en el Sheet. */
    USUARIO: 'MATIAS',

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
