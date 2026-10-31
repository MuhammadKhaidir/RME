/* Titik masuk aplikasi. Dijalankan setelah semua skrip lain dimuat. */
(function () {
  const App = window.App;
  App.store.init();
  App.auth.restore();
  App.router.start();
})();
