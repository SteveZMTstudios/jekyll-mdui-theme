(function () {
  var win = window;
  var doc = document;
  var LEGACY_THEME_STORAGE_KEY = 'legacy-theme-mode';

  function hasClass(el, className) {
    if (!el || !className) {
      return false;
    }

    return (' ' + el.className + ' ').indexOf(' ' + className + ' ') > -1;
  }

  function addClass(el, className) {
    if (!el || !className || hasClass(el, className)) {
      return;
    }

    el.className = el.className ? el.className + ' ' + className : className;
  }

  function removeClass(el, className) {
    var current;
    if (!el || !className) {
      return;
    }

    current = ' ' + el.className + ' ';
    while (current.indexOf(' ' + className + ' ') > -1) {
      current = current.replace(' ' + className + ' ', ' ');
    }

    el.className = current.replace(/^\s+|\s+$/g, '');
  }

  function setText(el, text) {
    if (!el) {
      return;
    }

    if (typeof el.textContent === 'string') {
      el.textContent = text;
      return;
    }

    el.innerText = text;
  }

  function on(el, eventName, handler) {
    if (!el) {
      return;
    }

    if (typeof el.addEventListener === 'function') {
      el.addEventListener(eventName, handler, false);
      return;
    }

    if (typeof el.attachEvent === 'function') {
      el.attachEvent('on' + eventName, handler);
    }
  }

  function safeStorageGet(key) {
    try {
      if (win.localStorage) {
        return win.localStorage.getItem(key) || '';
      }
    } catch (error) {
      return '';
    }

    return '';
  }

  function safeStorageSet(key, value) {
    try {
      if (win.localStorage) {
        win.localStorage.setItem(key, value);
      }
    } catch (error) {
      // Ignore write failures.
    }
  }

  function hasMduiRuntime() {
    var registry = win.customElements;
    if (!registry || typeof registry.get !== 'function') {
      return false;
    }

    return Boolean(
      registry.get('mdui-top-app-bar') &&
        registry.get('mdui-navigation-drawer') &&
        registry.get('mdui-button-icon') &&
        registry.get('mdui-dialog')
    );
  }

  function shouldForceLegacyMode() {
    var ua = (win.navigator && win.navigator.userAgent) || '';
    var script = doc.createElement('script');

    if (doc.documentMode || /MSIE|Trident/i.test(ua)) {
      return true;
    }

    if (!('noModule' in script)) {
      return true;
    }

    if (!('customElements' in win)) {
      return true;
    }

    return false;
  }

  function shouldUseLegacyMode() {
    if (shouldForceLegacyMode()) {
      return true;
    }

    return !hasMduiRuntime();
  }

  function applyLegacyTheme(body, themeToggle, mode) {
    var safeMode = mode === 'dark' ? 'dark' : 'light';
    var nextMode;
    var actionLabel;

    removeClass(body, 'legacy-theme-light');
    removeClass(body, 'legacy-theme-dark');
    addClass(body, 'legacy-theme-' + safeMode);
    safeStorageSet(LEGACY_THEME_STORAGE_KEY, safeMode);

    if (!themeToggle) {
      return;
    }

    nextMode = safeMode === 'dark' ? 'light' : 'dark';
    actionLabel = safeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    setText(themeToggle, actionLabel);
    themeToggle.setAttribute('title', actionLabel);
    themeToggle.setAttribute('aria-label', actionLabel);
    themeToggle.setAttribute('data-next-theme', nextMode);
  }

  function getInitialTheme() {
    var storedMode = safeStorageGet(LEGACY_THEME_STORAGE_KEY);
    if (storedMode === 'light' || storedMode === 'dark') {
      return storedMode;
    }

    return 'light';
  }

  function fallbackCopy(text) {
    var textArea = doc.createElement('textarea');
    var copied = false;

    textArea.value = text;
    textArea.setAttribute('readonly', 'readonly');
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    doc.body.appendChild(textArea);

    if (typeof textArea.select === 'function') {
      textArea.select();
    }

    try {
      copied = doc.execCommand('copy');
    } catch (error) {
      copied = false;
    }

    doc.body.removeChild(textArea);
    return copied;
  }

  function readPreText(pre) {
    var code = pre.getElementsByTagName('code')[0] || pre;
    if (typeof code.textContent === 'string') {
      return code.textContent;
    }

    return code.innerText || '';
  }

  function enhanceLegacyCodeBlocks() {
    var blocks;
    var i;

    if (!doc.querySelectorAll) {
      return;
    }

    blocks = doc.querySelectorAll('article pre, main pre');

    for (i = 0; i < blocks.length; i += 1) {
      (function () {
        var pre = blocks[i];
        var parent;
        var shell;
        var button;

        if (!pre || pre.getAttribute('data-legacy-copy') === 'true') {
          return;
        }

        pre.setAttribute('data-legacy-copy', 'true');
        parent = pre.parentNode;

        if (!parent) {
          return;
        }

        shell = doc.createElement('div');
        shell.className = 'legacy-code-shell';
        parent.insertBefore(shell, pre);
        shell.appendChild(pre);

        button = doc.createElement('button');
        button.type = 'button';
        button.className = 'legacy-code-copy';
        setText(button, 'Copy');

        on(button, 'click', function () {
          var copied = fallbackCopy(readPreText(pre));
          setText(button, copied ? 'Copied' : 'Copy failed');
          win.setTimeout(function () {
            setText(button, 'Copy');
          }, 1200);
        });

        shell.appendChild(button);
      })();
    }
  }

  function initLegacyExperience() {
    var body = doc.body;
    var legacyBanner;
    var legacyThemeToggle;

    if (!body) {
      return;
    }

    removeClass(doc.documentElement, 'no-js');

    if (!shouldUseLegacyMode()) {
      return;
    }

    legacyBanner = doc.getElementById('legacyBanner');
    legacyThemeToggle = doc.getElementById('legacyThemeToggle');

    addClass(body, 'legacy-mode');

    if (legacyBanner) {
      legacyBanner.removeAttribute('hidden');
    }

    applyLegacyTheme(body, legacyThemeToggle, getInitialTheme());

    if (legacyThemeToggle) {
      on(legacyThemeToggle, 'click', function () {
        var nextMode = legacyThemeToggle.getAttribute('data-next-theme');
        applyLegacyTheme(body, legacyThemeToggle, nextMode === 'dark' ? 'dark' : 'light');
      });
    }

    enhanceLegacyCodeBlocks();
  }

  if (doc.readyState === 'loading') {
    on(doc, 'DOMContentLoaded', initLegacyExperience);
  } else {
    initLegacyExperience();
  }
})();
