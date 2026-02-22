/**
 * Configuración de horario y día operativo del negocio.
 * Horario: 21:00 a 02:00 → el día operativo comienza a las 21 y termina a las 02.
 * Todas las operaciones se guardan según este día operativo (p. ej. 01:30 = día anterior).
 * Modificable en cualquier momento.
 */
(function (global) {
  'use strict';

  /** Hora de inicio del turno (21 = 21:00). */
  var HORA_INICIO = 21;
  /** Hora de fin del turno (2 = 02:00 del día siguiente). */
  var HORA_FIN = 2;

  /**
   * Devuelve la fecha operativa actual (YYYY-MM-DD).
   * Entre 21:00 y 23:59 → hoy.
   * Entre 00:00 y 01:59 → ayer (el turno empezó el día anterior).
   * Entre 02:00 y 20:59 → hoy (fuera del turno nocturno; se asigna mismo día).
   */
  function getFechaOperativa(fechaReferencia) {
    var d = fechaReferencia ? new Date(fechaReferencia) : new Date();
    var h = d.getHours();
    if (h >= HORA_INICIO) {
      return formatFecha(d);
    }
    if (h < HORA_FIN) {
      var ayer = new Date(d);
      ayer.setDate(ayer.getDate() - 1);
      return formatFecha(ayer);
    }
    return formatFecha(d);
  }

  /**
   * Nombre de la hoja/tab del Sheet donde guardar (por mes).
   * Usa los nombres: ENERO, FEBRERO, MARZO, ... DICIEMBRE (según APP_TABLES.NOMBRES_HOJAS_MES).
   */
  function getNombreHojaMes(fechaOperativa) {
    var nombres = (global.APP_TABLES && global.APP_TABLES.NOMBRES_HOJAS_MES) || [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    var d = typeof fechaOperativa === 'string'
      ? new Date(fechaOperativa + 'T12:00:00')
      : (fechaOperativa || new Date());
    var idx = d.getMonth();
    return nombres[idx] || nombres[0];
  }

  function formatFecha(d) {
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return y + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }

  var Negocio = {
    HORA_INICIO: HORA_INICIO,
    HORA_FIN: HORA_FIN,
    getFechaOperativa: getFechaOperativa,
    getNombreHojaMes: getNombreHojaMes
  };

  global.APP_NEGOCIO = Negocio;
})(typeof window !== 'undefined' ? window : this);
