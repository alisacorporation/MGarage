/**
 * MGarage — app.js
 * Application bootstrap: DB init, routing, install prompt, service worker.
 */

(function () {
  let deferredInstallPrompt = null;

  function hideSplash() {
    const splash = document.getElementById('splash');
    splash.classList.add('hide');
    setTimeout(() => splash.remove(), 600);
  }

  function wireNav() {
    document.getElementById('bottomNav').addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-item');
      if (!btn) return;
      Router.navigate(btn.dataset.route);
    });
  }

  function wireInstallPrompt() {
    const installBtn = document.getElementById('installBtn');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      installBtn.classList.remove('hidden');
    });

    installBtn.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      installBtn.classList.add('hidden');
    });

    window.addEventListener('appinstalled', () => {
      installBtn.classList.add('hidden');
      toast('MGarage установлен');
    });
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch((err) => {
          console.warn('Service worker registration failed:', err);
        });
      });
    }
  }

  async function init() {
    try {
      await openDB();
    } catch (err) {
      console.error('DB init failed', err);
      toast('Ошибка инициализации базы данных', 'error');
    }

    wireNav();
    wireInstallPrompt();
    registerServiceWorker();

    await Router.navigate('home');

    setTimeout(hideSplash, 350);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
