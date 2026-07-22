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

  function copyTextToClipboard(text, callback) {
    if (!text) {
      if (callback) callback(false);
      return;
    }

    if (win.clipboardData && typeof win.clipboardData.setData === 'function') {
      try {
        var success = win.clipboardData.setData('Text', text);
        if (callback) callback(Boolean(success));
        return;
      } catch (e) {}
    }

    if (win.navigator && win.navigator.clipboard && typeof win.navigator.clipboard.writeText === 'function') {
      win.navigator.clipboard.writeText(text).then(function () {
        if (callback) callback(true);
      }, function () {
        fallbackDomCopy(text, callback);
      });
      return;
    }

    fallbackDomCopy(text, callback);
  }

  function fallbackDomCopy(text, callback) {
    var textArea = doc.createElement('textarea');
    var copied = false;
    var range;
    var selection;

    textArea.value = text;
    textArea.style.fontSize = '12pt';
    textArea.style.border = '0';
    textArea.style.padding = '0';
    textArea.style.margin = '0';
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    textArea.setAttribute('readonly', '');

    doc.body.appendChild(textArea);

    if (win.navigator && win.navigator.userAgent && /ipad|iphone/i.test(win.navigator.userAgent)) {
      range = doc.createRange();
      range.selectNodeContents(textArea);
      selection = win.getSelection ? win.getSelection() : null;
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      if (typeof textArea.setSelectionRange === 'function') {
        textArea.setSelectionRange(0, 999999);
      }
    } else {
      if (typeof textArea.select === 'function') {
        textArea.select();
      }
    }

    try {
      copied = doc.execCommand('copy');
    } catch (error) {
      copied = false;
    }

    doc.body.removeChild(textArea);
    if (callback) callback(copied);
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
          copyTextToClipboard(readPreText(pre), function (copied) {
            setText(button, copied ? 'Copied' : 'Copy failed');
            win.setTimeout(function () {
              setText(button, 'Copy');
            }, 1200);
          });
        });

        shell.appendChild(button);
      })();
    }
  }

  function enableLegacyMode() {
    var body = doc.body;
    var legacyBanner;
    var legacyThemeToggle;

    if (!body || hasClass(body, 'legacy-mode')) {
      return;
    }

    var legacyCss = doc.getElementById('legacyThemeCss');
    if (legacyCss) {
      legacyCss.media = 'all';
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

  function initLegacyExperience() {
    var body = doc.body;

    if (!body) {
      return;
    }

    removeClass(doc.documentElement, 'no-js');

    if (shouldForceLegacyMode()) {
      enableLegacyMode();
      return;
    }

    if (!hasMduiRuntime()) {
      win.setTimeout(function () {
        if (!hasMduiRuntime()) {
          enableLegacyMode();
        }
      }, 6000);
    }
  }

  if (doc.readyState === 'loading') {
    on(doc, 'DOMContentLoaded', initLegacyExperience);
  } else {
    initLegacyExperience();
  }
})();
