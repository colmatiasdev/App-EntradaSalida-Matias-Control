(function () {
  'use strict';

  // Marcar en el menú la opción correspondiente a la página actual
  function marcarOpcionActiva() {
    var path = window.location.pathname || '';
    var links = document.querySelectorAll('.nav__link');
    links.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      link.classList.remove('nav__link--active');
      if (path.toLowerCase().indexOf('nueva-venta') !== -1 && href.toLowerCase().indexOf('nueva-venta') !== -1) {
        link.classList.add('nav__link--active');
      }
      if (path.indexOf('listado-ventas') !== -1 && href.indexOf('listado-ventas') !== -1) {
        link.classList.add('nav__link--active');
      }
      if (path.indexOf('gastos-salida') !== -1 && href.indexOf('gastos-salida') !== -1) {
        link.classList.add('nav__link--active');
      }
      if (path.indexOf('otro-tipo-ventas') !== -1 && href.indexOf('otro-tipo-ventas') !== -1) {
        link.classList.add('nav__link--active');
      }
    });
    // Si estamos en index, marcar según hash o dejar la primera
    if (path.endsWith('/') || path.endsWith('index.html') || path === '') {
      var primera = document.querySelector('.nav__link[href*="Nueva-venta"]');
      if (primera) primera.classList.add('nav__link--active');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', marcarOpcionActiva);
  } else {
    marcarOpcionActiva();
  }
})();
