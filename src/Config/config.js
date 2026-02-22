/**
 * Configuración centralizada de la aplicación.
 * Rutas para Google Sheet (lectura CSV) y Apps Script (operaciones).
 */
(function (global) {
  'use strict';

  var Config = {
    /** URL pública del Google Sheet en formato CSV (solo lectura). */
    GOOGLE_SHEET_CSV_URL:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRNYUmSj5Zpu85PtNg_8ZQPXbj1HsL8H8Or06RpoHpDW5EPj4TpXwVWvumDpujNQdlBnQhXDIujlt2A/pub?output=csv',

    /** URL del Web App de Google Apps Script para operaciones con la hoja (guardar, actualizar, etc.). */
    APP_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzmkTO9GCcZeF-umpyXJKN4SqCSJi8GgnhEII0LuSICHuutgraRn6wEjz3xwr0GlGC9/exec'
  };

  global.APP_CONFIG = Config;
})(typeof window !== 'undefined' ? window : this);
