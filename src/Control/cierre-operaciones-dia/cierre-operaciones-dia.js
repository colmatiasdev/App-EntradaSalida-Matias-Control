/**
 * Cierre operaciones del día — 2H Market (template: Cards / Tabla, resumen)
 */
(function () {
  'use strict';

  var APP_CONFIG = window.APP_CONFIG;
  var APP_SCRIPT_URL = (APP_CONFIG && APP_CONFIG.APP_SCRIPT_URL) || null;
  var CORS_PROXY = (APP_CONFIG && APP_CONFIG.CORS_PROXY) || '';

  var VIEWS = { compras: 'cards', ventas: 'cards', gastos: 'cards' };
  var _compras = [], _ventas = [], _gastos = [];
  var fechaActual = '';

  var MES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var DIA = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

  function pad(n) { return n < 10 ? '0'+n : String(n); }
  function hoyKey() { var d = new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function dateFromKey(k) { if (!k || k.length < 10) return null; var d = new Date(k+'T12:00:00'); return isNaN(d.getTime()) ? null : d; }
  function keyFromDate(d) { return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function sumarDias(k, n) { var d = dateFromKey(k); if (!d) return k; d.setDate(d.getDate()+n); return keyFromDate(d); }
  function fmtCorta(k) { var d = dateFromKey(k); if (!d) return k; return DIA[d.getDay()]+' '+d.getDate()+' '+MES[d.getMonth()]; }
  function fmtNum(k) { var d = dateFromKey(k); if (!d) return k; return d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear(); }
  function nombreMes(k) { if (!k) return ''; var m = parseInt(k.substring(5,7),10); return (m>=1&&m<=12) ? MES[m-1] : ''; }
  function fi(n) { return '$ '+Number(n).toLocaleString('es-AR',{minimumFractionDigits:0,maximumFractionDigits:0}); }
  function esc(s) { if (s==null) return ''; var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function isMobile() { return window.innerWidth <= 600; }

  function estiloUsuario(usuario) {
    var etiquetas = APP_CONFIG && APP_CONFIG.USUARIO_ETIQUETAS;
    if (!etiquetas || !usuario) return null;
    var key = String(usuario).trim().toUpperCase().replace(/\s+/g, '-');
    if (key.indexOf('USR-') !== 0 && key.length > 0) key = 'USR-' + key;
    var info = etiquetas[key];
    if (info && (info.color || info.etiqueta)) return { color: info.color || null, etiqueta: info.etiqueta || null };
    var nombreLower = String(usuario).toLowerCase().trim();
    for (var k in etiquetas) {
      var e = etiquetas[k];
      if (e && e.etiqueta && String(e.etiqueta).toLowerCase() === nombreLower) return { color: e.color || null, etiqueta: e.etiqueta || null };
    }
    return null;
  }
  function celdaUsuario(r) {
    var val = r.USUARIO != null ? String(r.USUARIO).trim() : '';
    var estilo = estiloUsuario(val);
    var texto = (estilo && estilo.etiqueta) ? estilo.etiqueta : (val || '—');
    var style = (estilo && estilo.color) ? ' style="color:'+esc(estilo.color)+';font-weight:600;"' : '';
    return '<td class="td-usuario"'+style+'>'+esc(texto)+'</td>';
  }
  function chipUsuario(r) {
    var val = r.USUARIO != null ? String(r.USUARIO).trim() : '';
    if (!val) return '';
    var estilo = estiloUsuario(val);
    var texto = (estilo && estilo.etiqueta) ? estilo.etiqueta : val;
    var style = (estilo && estilo.color) ? ' style="color:'+esc(estilo.color)+';border-color:'+esc(estilo.color)+'40;background:'+esc(estilo.color)+'12;"' : '';
    return '<span class="chip chip-user"'+style+'>👤 '+esc(texto)+'</span>';
  }

  function setMsg(txt, err) { var e = document.getElementById('status-msg'); if (e) { e.textContent = txt; e.classList.toggle('error', !!err); } }
  function setCargando(v) {
    var pill = document.getElementById('status-pill');
    var txt  = document.getElementById('status-text');
    if (pill) pill.classList.toggle('loading', v);
    if (txt)  txt.textContent = v ? 'Cargando…' : 'Listo';
  }
  function pintarCabecera() {
    var l = document.getElementById('day-label');
    var d = document.getElementById('day-date');
    var b = document.getElementById('badge-hoy');
    if (l) l.textContent = fmtCorta(fechaActual);
    if (d) d.textContent = fmtNum(fechaActual);
    if (b) b.hidden = (fechaActual !== hoyKey());
  }

  function buildToggle(id) {
    var cont = document.getElementById('vt-'+id);
    if (!cont) return;
    var svgCards = '<svg viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="0" width="14" height="5.5" rx="1.5"/><rect x="0" y="7.5" width="14" height="5.5" rx="1.5"/></svg>';
    var svgTable = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6"><rect x=".8" y=".8" width="12.4" height="12.4" rx="1.5"/><line x1=".8" y1="4.8" x2="13.2" y2="4.8"/><line x1="4.8" y1="4.8" x2="4.8" y2="13.2"/></svg>';
    cont.innerHTML = '<button class="view-btn" data-v="cards">'+svgCards+' Cards</button><button class="view-btn" data-v="table">'+svgTable+' Tabla</button>';
    var def = isMobile() ? 'cards' : 'table';
    VIEWS[id] = def;
    cont.querySelectorAll('.view-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.v === def);
      btn.addEventListener('click', function() {
        VIEWS[id] = btn.dataset.v;
        cont.querySelectorAll('.view-btn').forEach(function(b){ b.classList.toggle('active', b === btn); });
        repintarBloque(id);
      });
    });
  }

  function renderCardsCompras(datos) {
    return '<div class="cards-list">'+datos.map(function(r,i){
      var m = parseFloat(r.MONTO)||0;
      return '<div class="reg-card" style="animation-delay:'+(i*.03)+'s">'+
        '<div class="reg-card__top"><span class="reg-card__nombre">'+esc(r.PRODUCTO||'—')+'</span>'+
        '<span class="reg-card__monto compra">'+fi(m)+'</span></div>'+
        '<div class="reg-card__chips">'+
        (r.HORA ? '<span class="chip hora">⏱ '+esc(r.HORA)+'</span>' : '')+
        (r.CATEGORIA ? '<span class="chip cat">'+esc(r.CATEGORIA)+'</span>' : '')+
        (r.CANTIDAD!=null ? '<span class="chip cant">×'+esc(r.CANTIDAD)+'</span>' : '')+
        chipUsuario(r)+
        '</div></div>';
    }).join('')+'</div>';
  }
  function renderCardsVentas(datos) {
    return '<div class="cards-list">'+datos.map(function(r,i){
      var m = parseFloat(r.MONTO)||0;
      return '<div class="reg-card" style="animation-delay:'+(i*.03)+'s">'+
        '<div class="reg-card__top"><span class="reg-card__nombre">'+esc(r.PRODUCTO||'—')+'</span>'+
        '<span class="reg-card__monto venta">'+fi(m)+'</span></div>'+
        '<div class="reg-card__chips">'+
        (r.HORA ? '<span class="chip hora">⏱ '+esc(r.HORA)+'</span>' : '')+
        (r.CATEGORIA ? '<span class="chip cat">'+esc(r.CATEGORIA)+'</span>' : '')+
        (r.CANTIDAD!=null ? '<span class="chip cant">×'+esc(r.CANTIDAD)+'</span>' : '')+
        chipUsuario(r)+
        '</div></div>';
    }).join('')+'</div>';
  }
  function renderCardsGastos(datos) {
    return '<div class="cards-list">'+datos.map(function(r,i){
      var m = parseFloat(r.IMPORTE)||0;
      return '<div class="reg-card" style="animation-delay:'+(i*.03)+'s">'+
        '<div class="reg-card__top"><span class="reg-card__nombre">'+esc(r.DESCRIPCION||r['TIPO-OPERACION']||'—')+'</span>'+
        '<span class="reg-card__monto gasto">'+fi(m)+'</span></div>'+
        '<div class="reg-card__chips">'+
        (r.HORA ? '<span class="chip hora">⏱ '+esc(r.HORA)+'</span>' : '')+
        (r['TIPO-OPERACION'] ? '<span class="chip tipo">'+esc(r['TIPO-OPERACION'])+'</span>' : '')+
        chipUsuario(r)+
        '</div></div>';
    }).join('')+'</div>';
  }

  function renderTableCompras(datos) {
    var total = datos.reduce(function(s,r){return s+(parseFloat(r.MONTO)||0);},0);
    return '<div class="bloque__scroll"><table class="bloque-tabla">'+
      '<thead><tr><th>HORA</th><th>PRODUCTO</th><th>CATEGORÍA</th><th class="th-num">CANT.</th><th class="th-num">MONTO</th><th>USUARIO</th></tr></thead><tbody>'+
      datos.map(function(r){ return '<tr><td>'+esc(r.HORA||'—')+'</td><td>'+esc(r.PRODUCTO||'')+'</td><td>'+esc(r.CATEGORIA||'')+'</td><td class="td-num">'+esc(r.CANTIDAD!=null?r.CANTIDAD:'')+'</td><td class="td-num">'+fi(parseFloat(r.MONTO)||0)+'</td>'+celdaUsuario(r)+'</tr>'; }).join('')+
      '</tbody><tfoot><tr><td colspan="5"><strong>Total</strong></td><td class="td-num td-total">'+fi(total)+'</td></tr></tfoot></table></div>';
  }
  function renderTableVentas(datos) {
    var total = datos.reduce(function(s,r){return s+(parseFloat(r.MONTO)||0);},0);
    return '<div class="bloque__scroll"><table class="bloque-tabla">'+
      '<thead><tr><th>HORA</th><th>PRODUCTO</th><th>CATEGORÍA</th><th class="th-num">CANT.</th><th class="th-num">MONTO</th><th>USUARIO</th></tr></thead><tbody>'+
      datos.map(function(r){ return '<tr><td>'+esc(r.HORA||'—')+'</td><td>'+esc(r.PRODUCTO||'')+'</td><td>'+esc(r.CATEGORIA||'')+'</td><td class="td-num">'+esc(r.CANTIDAD!=null?r.CANTIDAD:'')+'</td><td class="td-num">'+fi(parseFloat(r.MONTO)||0)+'</td>'+celdaUsuario(r)+'</tr>'; }).join('')+
      '</tbody><tfoot><tr><td colspan="5"><strong>Total</strong></td><td class="td-num td-total">'+fi(total)+'</td></tr></tfoot></table></div>';
  }
  function renderTableGastos(datos) {
    var total = datos.reduce(function(s,r){return s+(parseFloat(r.IMPORTE)||0);},0);
    return '<div class="bloque__scroll"><table class="bloque-tabla">'+
      '<thead><tr><th>HORA</th><th>TIPO-OPERACIÓN</th><th>DESCRIPCIÓN</th><th class="th-num">IMPORTE</th><th>USUARIO</th></tr></thead><tbody>'+
      datos.map(function(r){ return '<tr><td>'+esc(r.HORA||'—')+'</td><td>'+esc(r['TIPO-OPERACION']||'')+'</td><td>'+esc(r.DESCRIPCION||'')+'</td><td class="td-num">'+fi(parseFloat(r.IMPORTE)||0)+'</td>'+celdaUsuario(r)+'</tr>'; }).join('')+
      '</tbody><tfoot><tr><td colspan="4"><strong>Total</strong></td><td class="td-num td-total">'+fi(total)+'</td></tr></tfoot></table></div>';
  }

  function repintarBloque(id) {
    var datos   = id==='compras' ? _compras : (id==='ventas' ? _ventas : _gastos);
    var bodyEl  = document.getElementById(id+'-body');
    var footEl  = document.getElementById(id+'-foot');
    var countEl = document.getElementById(id+'-count');
    var footTot = document.getElementById(id+'-total-foot');
    var emojis  = { compras:'🛒', ventas:'💰', gastos:'💸' };
    var labels  = { compras:'Sin compras para este día.', ventas:'Sin ventas para este día.', gastos:'Sin gastos para este día.' };
    if (!bodyEl) return;

    if (!datos || datos.length === 0) {
      bodyEl.innerHTML = '<div class="bloque__vacio"><span class="bloque__vacio-icon">'+emojis[id]+'</span>'+labels[id]+'</div>';
      if (footEl)  footEl.hidden  = true;
      if (countEl) countEl.hidden = true;
      return;
    }

    var view = VIEWS[id] || 'cards';
    var html;
    if (id === 'compras') html = view === 'cards' ? renderCardsCompras(datos) : renderTableCompras(datos);
    else if (id === 'ventas') html = view === 'cards' ? renderCardsVentas(datos) : renderTableVentas(datos);
    else html = view === 'cards' ? renderCardsGastos(datos) : renderTableGastos(datos);
    bodyEl.innerHTML = html;

    if (footEl)  footEl.hidden  = false;
    if (countEl) { countEl.hidden = false; countEl.textContent = datos.length + ' reg.'; }
    if (footTot) {
      var total = id === 'gastos'
        ? datos.reduce(function(s,r){return s+(parseFloat(r.IMPORTE)||0);},0)
        : datos.reduce(function(s,r){return s+(parseFloat(r.MONTO)||0);},0);
      footTot.textContent = fi(total);
    }
  }

  function pintarResumen() {
    var tc = _compras.reduce(function(s,r){return s+(parseFloat(r.MONTO)||0);},0);
    var tv = _ventas.reduce(function(s,r){return s+(parseFloat(r.MONTO)||0);},0);
    var tg = _gastos.reduce(function(s,r){return s+(parseFloat(r.IMPORTE)||0);},0);
    var ec = document.getElementById('resumen-compras');
    var ev = document.getElementById('resumen-ventas');
    var eg = document.getElementById('resumen-gastos');
    var er = document.getElementById('resumen-resultado');
    if (ec) ec.textContent = fi(tc);
    if (ev) ev.textContent = fi(tv);
    if (eg) eg.textContent = fi(tg);
    if (er) {
      var res = tc - (tv + tg);
      er.textContent = fi(Math.abs(res));
      er.className = 'resumen-resultado__num ' + (res > 0 ? 'rojo' : res < 0 ? 'verde' : 'neutro');
    }
  }

  function pintarTodo(compras, ventas, gastos) {
    _compras = compras || [];
    _ventas  = ventas  || [];
    _gastos  = gastos  || [];
    var mesEl = document.getElementById('mes-compras');
    if (mesEl) mesEl.textContent = nombreMes(fechaActual) ? '('+nombreMes(fechaActual)+')' : '';
    repintarBloque('compras');
    repintarBloque('ventas');
    repintarBloque('gastos');
    pintarResumen();
  }

  function datosDemo(fecha) {
    if (fecha !== hoyKey()) return { ok:true, fecha:fecha, comprasPanaderia:[], ventasMarket:[], gastosSalida:[] };
    return {
      ok: true, fecha: fecha,
      comprasPanaderia: [
        { HORA:'07:15', PRODUCTO:'Medialunas x12', CATEGORIA:'Panadería', CANTIDAD:2, MONTO:3600, USUARIO:'USR-MATIAS' },
        { HORA:'07:40', PRODUCTO:'Pan francés', CATEGORIA:'Panadería', CANTIDAD:10, MONTO:1200, USUARIO:'USR-MATIAS' },
        { HORA:'08:00', PRODUCTO:'Facturas surtidas', CATEGORIA:'Panadería', CANTIDAD:24, MONTO:8400, USUARIO:'USR-SILVINA' },
      ],
      ventasMarket: [
        { HORA:'09:15', PRODUCTO:'Bebidas varias', CATEGORIA:'Bebidas', CANTIDAD:8, MONTO:6400, USUARIO:'USR-MATIAS' },
        { HORA:'10:30', PRODUCTO:'Snacks surtidos', CATEGORIA:'Almacén', CANTIDAD:15, MONTO:4500, USUARIO:'USR-SILVINA' },
      ],
      gastosSalida: [
        { HORA:'11:00', 'TIPO-OPERACION':'Transporte', DESCRIPCION:'Flete mercadería', IMPORTE:2500, USUARIO:'USR-MATIAS' },
      ]
    };
  }

  function cargarDatos() {
    setMsg('Cargando cierre del '+fmtNum(fechaActual)+'…');
    setCargando(true);

    if (!APP_SCRIPT_URL) {
      setTimeout(function() {
        setCargando(false);
        var d = datosDemo(fechaActual);
        var tiene = d.comprasPanaderia.length || d.ventasMarket.length || d.gastosSalida.length;
        setMsg(tiene ? 'Datos de demo — '+fmtNum(fechaActual) : 'Sin registros para '+fmtNum(fechaActual));
        pintarTodo(d.comprasPanaderia, d.ventasMarket, d.gastosSalida);
      }, 550);
      return;
    }

    var url = (CORS_PROXY && CORS_PROXY.length) ? CORS_PROXY+encodeURIComponent(APP_SCRIPT_URL) : APP_SCRIPT_URL;
    fetch(url, {
      method:'POST', mode:'cors',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:'data='+encodeURIComponent(JSON.stringify({accion:'cierreOperacionesDiaLeer', fecha:fechaActual}))
    })
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP '+res.status);
      var ct = (res.headers.get('Content-Type')||'').toLowerCase();
      if (ct.indexOf('json')!==-1) return res.json();
      return res.text().then(function(t){ try{return JSON.parse(t);}catch(e){return{ok:false,error:t};} });
    })
    .then(function(data) {
      setCargando(false);
      if (!data||!data.ok) { setMsg((data&&(data.error||data.mensaje))||'Error al cargar.',true); pintarTodo([],[],[]); return; }
      setMsg('Cierre del '+fmtNum(data.fecha||fechaActual)+' cargado.');
      pintarTodo(data.comprasPanaderia, data.ventasMarket, data.gastosSalida);
    })
    .catch(function(err) {
      setCargando(false);
      setMsg('Error: '+(err&&err.message?err.message:String(err)),true);
      pintarTodo([],[],[]);
    });
  }

  function render() { pintarCabecera(); cargarDatos(); }

  function init() {
    fechaActual = hoyKey();
    ['compras','ventas','gastos'].forEach(buildToggle);
    var btnPrev = document.getElementById('btn-prev');
    var btnNext = document.getElementById('btn-next');
    var btnHoy = document.getElementById('btn-hoy');
    if (btnPrev) btnPrev.addEventListener('click', function(){ fechaActual=sumarDias(fechaActual,-1); render(); });
    if (btnNext) btnNext.addEventListener('click', function(){ fechaActual=sumarDias(fechaActual,1); render(); });
    if (btnHoy) btnHoy.addEventListener('click', function(){ fechaActual=hoyKey(); render(); });
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
