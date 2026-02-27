(function () {
  'use strict';

  var container = document.getElementById('footer-container');
  if (!container) return;

  var src = container.getAttribute('data-footer-src') || 'src/Footer/footer.html';
  fetch(src)
    .then(function (res) { return res.text(); })
    .then(function (html) {
      container.innerHTML = html;
    })
    .catch(function () {
      container.innerHTML = '<footer class="footer"><p class="footer__text">© 2H Market — Sistema de Control de MATIAS</p></footer>';
    });
})();
