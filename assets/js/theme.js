(function () {
  const root = document.documentElement;
  const body = document.body;
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const themeToggle = document.getElementById('themeToggle');
  const translateDropdown = document.getElementById('translateDropdown');
  const translateToggle = document.getElementById('translateToggle');
  const translateMenu = document.getElementById('translateMenu');
  const translateDialog = document.getElementById('translateDialog');
  const closeTranslateDialogButton = document.getElementById('closeTranslateDialogButton');
  const toc = document.getElementById('toc');
  const article = document.getElementById('articleContent');
  const legacyBanner = document.getElementById('legacyBanner');
  const scrollTopFab = document.getElementById('scrollToTop');
  const copyLinkButton = document.getElementById('copyArticleUrlButton');
  const openQrDialogButton = document.getElementById('openQrDialogButton');
  const shareButton = document.getElementById('shareArticleButton');
  const qrDialog = document.getElementById('qrDialog');
  const closeQrDialogButton = document.getElementById('closeQrDialogButton');
  const articleUrlText = document.getElementById('articleUrlText');
  const articleTitleText = document.getElementById('articleTitleText');
  const articleQrCode = document.getElementById('articleQrCode');
  const qrDialogUrl = document.getElementById('qrDialogUrl');

  const THEME_STORAGE_KEY = 'theme-mode';
  const drawerMediaQuery = window.matchMedia('(max-width: 959px)');
  const hoverMediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const themeModes = ['auto', 'light', 'dark'];
  const TRANSLATE_STORAGE_KEY = 'translate-language';
  const translateSourceFromConfig = root.dataset.translateSource || 'zh-CN';
  const themeClassMap = {
    auto: 'mdui-theme-auto',
    light: 'mdui-theme-light',
    dark: 'mdui-theme-dark'
  };
  const translateLanguageLabels = {
    chinese_simplified: '简体中文',
    chinese_traditional: '繁體中文',
    english: 'English',
    japanese: '日本語',
    korean: '한국어',
    russian: 'Русский',
    french: 'Français',
    deutsch: 'Deutsch',
    spanish: 'Español',
    portuguese: 'Português',
    italian: 'Italiano',
    vietnamese: 'Tiếng Việt',
    thai: 'ไทย',
    indonesian: 'Bahasa Indonesia',
    arabic: 'العربية',
    hindi: 'हिन्दी',
    bengali: 'বাংলা',
    turkish: 'Türkçe',
    polish: 'Polski',
    ukrainian: 'Українська',
    dutch: 'Nederlands',
    malay: 'Bahasa Melayu',
    filipino: 'Pilipino'
  };
  const translateLocaleMap = {
    zh: 'chinese_simplified',
    'zh-cn': 'chinese_simplified',
    'zh-sg': 'chinese_simplified',
    'zh-hans': 'chinese_simplified',
    'zh-tw': 'chinese_traditional',
    'zh-hk': 'chinese_traditional',
    'zh-mo': 'chinese_traditional',
    'zh-hant': 'chinese_traditional',
    en: 'english',
    'en-us': 'english',
    ja: 'japanese',
    ko: 'korean',
    ru: 'russian',
    fr: 'french',
    de: 'deutsch',
    es: 'spanish',
    pt: 'portuguese',
    it: 'italian',
    vi: 'vietnamese',
    th: 'thai',
    id: 'indonesian',
    ar: 'arabic',
    hi: 'hindi',
    bn: 'bengali',
    tr: 'turkish',
    pl: 'polish',
    uk: 'ukrainian',
    nl: 'dutch',
    ms: 'malay',
    fil: 'filipino',
    tl: 'filipino'
  };

  let activeTranslateLanguage = 'chinese_simplified';
  let translateLoadingStopTimer = null;
  let translateLoadingHardStopTimer = null;

  function setLegacyMode(enabled) {
    body.classList.toggle('legacy-mode', enabled);
    if (legacyBanner) {
      legacyBanner.hidden = !enabled;
    }
  }

  function setHoverCapable(enabled) {
    body.classList.toggle('hover-capable', enabled);
  }

  function initColorScheme() {
    const seedColor = root.dataset.seedColor || '#0b57d0';
    if (window.mdui && typeof window.mdui.setColorScheme === 'function') {
      try {
        window.mdui.setColorScheme(seedColor);
      } catch (error) {
        console.warn('setColorScheme failed', error);
      }
    }
  }

  function getCurrentThemeMode() {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return themeModes.includes(saved) ? saved : 'auto';
  }

  function updateThemeButton(mode) {
    if (!themeToggle) {
      return;
    }

    const icon = mode === 'dark' ? 'dark_mode' : mode === 'light' ? 'light_mode' : 'brightness_auto';
    const labels = {
      auto: '自动主题',
      light: '浅色主题',
      dark: '深色主题'
    };

    themeToggle.setAttribute('icon', icon);
    themeToggle.setAttribute('aria-label', '切换主题（当前：' + labels[mode] + '）');
  }

  function applyTheme(mode) {
    const safeMode = themeModes.includes(mode) ? mode : 'auto';
    Object.keys(themeClassMap).forEach(function (key) {
      root.classList.remove(themeClassMap[key]);
    });
    root.classList.add(themeClassMap[safeMode]);
    window.localStorage.setItem(THEME_STORAGE_KEY, safeMode);
    updateThemeButton(safeMode);
  }

  function cycleTheme() {
    const current = getCurrentThemeMode();
    const currentIndex = themeModes.indexOf(current);
    const next = themeModes[(currentIndex + 1) % themeModes.length];
    applyTheme(next);
  }

  function syncDrawerState() {
    if (!sidebar) {
      return;
    }

    const isMobile = drawerMediaQuery.matches;
    sidebar.modal = isMobile;
    sidebar.open = !isMobile;
    body.classList.toggle('drawer-mobile', isMobile);
    body.classList.toggle('drawer-desktop', !isMobile);

    if (sidebarToggle) {
      sidebarToggle.setAttribute('aria-expanded', String(!isMobile));
    }
  }

  function toggleDrawer() {
    if (!sidebar) {
      return;
    }

    sidebar.open = !sidebar.open;
    if (sidebarToggle) {
      sidebarToggle.setAttribute('aria-expanded', String(sidebar.open));
    }
  }

  function registerDrawerResizeListener() {
    if (typeof drawerMediaQuery.addEventListener === 'function') {
      drawerMediaQuery.addEventListener('change', syncDrawerState);
      return;
    }

    if (typeof drawerMediaQuery.addListener === 'function') {
      drawerMediaQuery.addListener(syncDrawerState);
    }
  }

  function normalizeTranslateLanguageCode(code) {
    const raw = String(code || '').trim().toLowerCase().replace(/_/g, '-');
    if (!raw) {
      return 'chinese_simplified';
    }

    if (translateLanguageLabels[raw]) {
      return raw;
    }

    if (translateLocaleMap[raw]) {
      return translateLocaleMap[raw];
    }

    if (raw.indexOf('zh') === 0) {
      if (/(-tw|-hk|-mo|hant)/.test(raw)) {
        return 'chinese_traditional';
      }
      return 'chinese_simplified';
    }

    const primary = raw.split('-')[0];
    return translateLocaleMap[primary] || 'chinese_simplified';
  }

  function getTranslateLanguageLabel(code) {
    const normalized = normalizeTranslateLanguageCode(code);
    return translateLanguageLabels[normalized] || translateLanguageLabels.chinese_simplified;
  }

  function getStoredTranslateLanguage() {
    try {
      const saved = window.localStorage.getItem(TRANSLATE_STORAGE_KEY);
      if (!saved) {
        return '';
      }
      return normalizeTranslateLanguageCode(saved);
    } catch (error) {
      return '';
    }
  }

  function getTranslateCurrentLanguage() {
    if (window.translate && window.translate.language && typeof window.translate.language.getCurrent === 'function') {
      try {
        const current = window.translate.language.getCurrent();
        return normalizeTranslateLanguageCode(current);
      } catch (error) {
        return '';
      }
    }

    return '';
  }

  function setTranslateTriggerLabel(code) {
    if (!translateToggle) {
      return;
    }

    const label = getTranslateLanguageLabel(code);
    translateToggle.setAttribute('aria-label', '翻译（当前：' + label + '）');
    translateToggle.setAttribute('title', '翻译（当前：' + label + '）');
  }

  function syncTranslateMenu(code) {
    const normalized = normalizeTranslateLanguageCode(code);
    if (translateMenu) {
      translateMenu.value = normalized;
    }

    setTranslateTriggerLabel(normalized);
  }

  function setTranslateLoading(loading) {
    if (!translateToggle) {
      return;
    }

    if (loading) {
      translateToggle.setAttribute('loading', '');
      translateToggle.setAttribute('aria-busy', 'true');
    } else {
      translateToggle.removeAttribute('loading');
      translateToggle.removeAttribute('aria-busy');
    }
  }

  function startTranslateLoading() {
    if (translateLoadingStopTimer) {
      window.clearTimeout(translateLoadingStopTimer);
      translateLoadingStopTimer = null;
    }

    if (translateLoadingHardStopTimer) {
      window.clearTimeout(translateLoadingHardStopTimer);
      translateLoadingHardStopTimer = null;
    }

    setTranslateLoading(true);

    translateLoadingHardStopTimer = window.setTimeout(function () {
      setTranslateLoading(false);
      translateLoadingHardStopTimer = null;
    }, 8000);
  }

  function stopTranslateLoading(delay) {
    const safeDelay = typeof delay === 'number' ? delay : 240;
    if (translateLoadingStopTimer) {
      window.clearTimeout(translateLoadingStopTimer);
    }

    translateLoadingStopTimer = window.setTimeout(function () {
      setTranslateLoading(false);
      translateLoadingStopTimer = null;
      if (translateLoadingHardStopTimer) {
        window.clearTimeout(translateLoadingHardStopTimer);
        translateLoadingHardStopTimer = null;
      }
    }, safeDelay);
  }

  function updateTranslateLanguageState(nextLanguage) {
    const normalized = normalizeTranslateLanguageCode(nextLanguage);
    activeTranslateLanguage = normalized;
    syncTranslateMenu(normalized);

    try {
      window.localStorage.setItem(TRANSLATE_STORAGE_KEY, normalized);
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function bindTranslateLoadingHooks() {
    if (!window.translate || !window.translate.listener || window.translate.__mduiTranslateHooksBound) {
      return;
    }

    window.translate.__mduiTranslateHooksBound = true;
    const listener = window.translate.listener;

    const finishHook = function () {
      stopTranslateLoading(120);
      const currentLanguage = getTranslateCurrentLanguage();
      if (currentLanguage) {
        updateTranslateLanguageState(currentLanguage);
      }

      if (currentLanguage === 'arabic') {
        document.documentElement.setAttribute('dir', 'rtl');
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
      }
    };

    if (typeof listener.addListener === 'function') {
      listener.addListener('renderTaskFinish', finishHook);
    }

    ['renderTaskFinish', 'onTaskFinish', 'taskFinish'].forEach(function (hookName) {
      const previous = listener[hookName];
      listener[hookName] = function (task) {
        if (typeof previous === 'function') {
          try {
            previous.call(this, task);
          } catch (error) {
            console.warn('translate finish hook failed', error);
          }
        }
        finishHook(task);
      };
    });
  }

  function patchTranslateExecute() {
    if (!window.translate || typeof window.translate.execute !== 'function' || window.translate.__mduiTranslateExecutePatched) {
      return;
    }

    const originalExecute = window.translate.execute;
    window.translate.execute = function () {
      startTranslateLoading();
      const result = originalExecute.apply(this, arguments);
      stopTranslateLoading(3000);

      return result;
    };

    window.translate.__mduiTranslateExecutePatched = true;
  }

  function renderTranslateLanguageSelect() {
    if (!window.translate || !window.translate.selectLanguageTag) {
      return;
    }

    const container = document.getElementById('translate');
    if (!container) {
      return;
    }

    const selectLanguageTag = window.translate.selectLanguageTag;
    selectLanguageTag.documentId = 'translate';
    selectLanguageTag.show = true;

    if (typeof selectLanguageTag.refreshRender === 'function') {
      selectLanguageTag.refreshRender();
    } else if (typeof selectLanguageTag.render === 'function') {
      selectLanguageTag.alreadyRender = false;
      selectLanguageTag.render();
    }

    selectLanguageTag.show = false;

    const nativeSelect = container.querySelector('select');
    if (nativeSelect && nativeSelect.dataset.translateLoadingBound !== 'true') {
      nativeSelect.dataset.translateLoadingBound = 'true';
      nativeSelect.addEventListener('change', function () {
        startTranslateLoading();
        stopTranslateLoading(4500);
      });
    }
  }

  function registerTranslateIgnoreRules() {
    if (!window.translate) {
      return;
    }

    const ignore = window.translate.ignore || {};

    if (Array.isArray(ignore.tag)) {
      ['i', 'pre', 'code'].forEach(function (tagName) {
        if (ignore.tag.indexOf(tagName) === -1) {
          ignore.tag.push(tagName);
        }
      });
    }

    if (Array.isArray(ignore.class)) {
      ['material-icons', 'ignore-translate'].forEach(function (className) {
        if (ignore.class.indexOf(className) === -1) {
          ignore.class.push(className);
        }
      });
    }
  }

  function initTranslate() {
    if (!translateDropdown || !translateMenu || typeof window.translate === 'undefined') {
      if (translateDropdown) {
        translateDropdown.hidden = true;
      }
      return;
    }

    registerTranslateIgnoreRules();
    patchTranslateExecute();
    bindTranslateLoadingHooks();

    const sourceLanguage = normalizeTranslateLanguageCode(translateSourceFromConfig);

    try {
      if (window.translate.service && typeof window.translate.service.use === 'function') {
        window.translate.service.use('client.edge');
      }

      if (window.translate.language && typeof window.translate.language.setLocal === 'function') {
        window.translate.language.setLocal(sourceLanguage);
      }

      if (window.translate.selectLanguageTag) {
        window.translate.selectLanguageTag.show = false;
        window.translate.selectLanguageTag.documentId = 'translate';
      }

      if (typeof window.translate.setAutoDiscriminateLocalLanguage === 'function') {
        window.translate.setAutoDiscriminateLocalLanguage();
      }
    } catch (error) {
      console.warn('translate init failed', error);
    }

    const savedLanguage = getStoredTranslateLanguage();
    const detectedLanguage = getTranslateCurrentLanguage();
    const initialLanguage = savedLanguage || detectedLanguage || sourceLanguage;
    updateTranslateLanguageState(initialLanguage);

    if (typeof window.translate.changeLanguage === 'function') {
      window.translate.changeLanguage(initialLanguage);
    }

    if (typeof window.translate.execute === 'function') {
      window.translate.execute();
    }

    if (window.translate.listener && typeof window.translate.listener.start === 'function') {
      try {
        window.translate.listener.start();
      } catch (error) {
        console.warn('translate listener start failed', error);
      }
    }

    translateMenu.addEventListener('change', function () {
      const selectedValue = translateMenu.value || activeTranslateLanguage;

      if (selectedValue === 'other_language') {
        syncTranslateMenu(activeTranslateLanguage);
        renderTranslateLanguageSelect();
        if (translateDialog) {
          translateDialog.open = true;
        }
        return;
      }

      const nextLanguage = normalizeTranslateLanguageCode(selectedValue);
      if (nextLanguage === activeTranslateLanguage) {
        return;
      }

      updateTranslateLanguageState(nextLanguage);

      if (typeof window.translate.changeLanguage === 'function') {
        window.translate.changeLanguage(nextLanguage);
      }

      if (typeof window.translate.execute === 'function') {
        window.translate.execute();
      }
    });

    if (closeTranslateDialogButton && translateDialog) {
      closeTranslateDialogButton.addEventListener('click', function () {
        translateDialog.open = false;
      });
    }
  }

  function slugify(text) {
    return (text || '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\u4e00-\u9fa5 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function ensureHeadingId(heading, index, usedIds) {
    if (heading.id) {
      usedIds.add(heading.id);
      return heading.id;
    }

    const base = slugify(heading.textContent) || 'section-' + (index + 1);
    let nextId = base;
    let suffix = 2;

    while (usedIds.has(nextId)) {
      nextId = base + '-' + suffix;
      suffix += 1;
    }

    heading.id = nextId;
    usedIds.add(nextId);
    return nextId;
  }

  function buildToc() {
    if (!toc || !article) {
      return;
    }

    const headings = article.querySelectorAll('h1, h2, h3');
    toc.innerHTML = '';

    if (!headings.length) {
      toc.hidden = true;
      return;
    }

    toc.hidden = false;
    const usedIds = new Set();

    headings.forEach(function (heading, index) {
      const headingId = ensureHeadingId(heading, index, usedIds);
      const item = document.createElement('mdui-list-item');
      item.setAttribute('href', '#' + headingId);
      item.setAttribute('rounded', '');
      item.classList.add('toc-item', 'toc-' + heading.tagName.toLowerCase());
      item.textContent = heading.textContent ? heading.textContent.trim() : 'Untitled';

      item.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href').slice(1);
        const targetHeading = document.getElementById(targetId);

        if (targetHeading) {
          e.preventDefault();
          history.pushState(null, '', '#' + targetId);

          let delay = 0;
          if (drawerMediaQuery.matches && sidebar) {
            sidebar.open = false;
            if (sidebarToggle) {
              sidebarToggle.setAttribute('aria-expanded', 'false');
            }
            // Wait for drawer close animation and focus restoration
            delay = 250;
          }

          window.setTimeout(function () {
            targetHeading.scrollIntoView({ behavior: 'smooth' });
          }, delay);
        }
      });

      toc.appendChild(item);
    });

    const tocItems = Array.from(toc.querySelectorAll('mdui-list-item'));
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          const hash = '#' + entry.target.id;
          tocItems.forEach(function (item) {
            const isActive = item.getAttribute('href') === hash;
            item.classList.toggle('active', isActive);
            item.toggleAttribute('active', isActive);
          });
        });
      },
      {
        rootMargin: '-94px 0px -80% 0px',
        threshold: 0
      }
    );

    headings.forEach(function (heading) {
      observer.observe(heading);
    });
  }

  function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }

    document.body.removeChild(textArea);
    return copied;
  }

  function copyText(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text).then(function () {
        return true;
      }).catch(function () {
        return fallbackCopy(text);
      });
    }

    return Promise.resolve(fallbackCopy(text));
  }

  function enhanceCodeBlocks() {
    const codeBlocks = article ? article.querySelectorAll('pre > code') : document.querySelectorAll('pre > code');
    codeBlocks.forEach(function (codeBlock) {
      const pre = codeBlock.parentElement;
      if (!pre || pre.closest('.code-shell')) {
        return;
      }

      const shell = document.createElement('div');
      shell.className = 'code-shell';
      const scroller = document.createElement('div');
      scroller.className = 'code-scroll';
      pre.parentNode.insertBefore(shell, pre);
      shell.appendChild(scroller);
      scroller.appendChild(pre);

      let langName = '';
      const rougeParent = shell.closest('.highlighter-rouge');
      if (rougeParent) {
        const langMatch = rougeParent.className.match(/language-([a-zA-Z0-9_-]+)/);
        if (langMatch) {
          langName = langMatch[1];
        }
      }

      if (langName) {
        const badge = document.createElement('div');
        badge.className = 'code-lang-badge ignore-translate';
        badge.textContent = langName;
        shell.appendChild(badge);
        pre.classList.add('has-lang');
      }

      const button = document.createElement('mdui-button-icon');
      button.className = 'code-copy';
      button.setAttribute('icon', 'content_copy');
      button.setAttribute('variant', 'filled');
      button.setAttribute('aria-label', '复制代码');

      button.addEventListener('click', function () {
        copyText(codeBlock.innerText).then(function (copied) {
          button.setAttribute('icon', copied ? 'check' : 'error');
          window.setTimeout(function () {
            button.setAttribute('icon', 'content_copy');
          }, 1200);
        });
      });

      shell.appendChild(button);
    });
  }

  function resolveShareUrl() {
    return window.location.href;
  }

  function initSharePanel() {
    const shareUrl = resolveShareUrl();
    const shareTitle = articleTitleText ? articleTitleText.textContent.trim() : document.title;

    if (articleUrlText) {
      articleUrlText.href = shareUrl;
      articleUrlText.textContent = shareUrl;
    }

    if (qrDialogUrl) {
      qrDialogUrl.textContent = shareUrl;
    }

    if (copyLinkButton) {
      copyLinkButton.addEventListener('click', function () {
        copyText(shareTitle + '\n' + shareUrl).then(function (copied) {
          if (!copied) {
            return;
          }

          const originalIcon = copyLinkButton.getAttribute('icon') || 'content_copy';
          copyLinkButton.setAttribute('icon', 'check');
          window.setTimeout(function () {
            copyLinkButton.setAttribute('icon', originalIcon);
          }, 1000);
        });
      });
    }

    if (openQrDialogButton && qrDialog && articleQrCode) {
      if (typeof window.QRCode === 'function') {
        openQrDialogButton.hidden = false;
        openQrDialogButton.addEventListener('click', function () {
          articleQrCode.innerHTML = '';

          const qrOptions = {
            text: shareUrl,
            width: 176,
            height: 176,
            colorDark: '#111111',
            colorLight: '#ffffff'
          };

          if (window.QRCode.CorrectLevel) {
            qrOptions.correctLevel = window.QRCode.CorrectLevel.M;
          }

          new window.QRCode(articleQrCode, qrOptions);
          qrDialog.open = true;
        });

        if (closeQrDialogButton) {
          closeQrDialogButton.addEventListener('click', function () {
            qrDialog.open = false;
          });
        }
      } else {
        openQrDialogButton.hidden = true;
      }
    }

    if (shareButton && typeof navigator.share === 'function') {
      shareButton.hidden = false;
      shareButton.addEventListener('click', function () {
        navigator.share({
          title: shareTitle,
          text: shareTitle,
          url: shareUrl
        }).catch(function () {
          // Ignore cancellation.
        });
      });
    }

  }

  function initScrollTopFab() {
    if (!scrollTopFab) {
      return;
    }

    function syncFabVisibility() {
      scrollTopFab.classList.toggle('show', window.scrollY > 280);
    }

    scrollTopFab.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    window.addEventListener('scroll', syncFabVisibility, { passive: true });
    syncFabVisibility();
  }

  const hasWebComponents = 'customElements' in window;
  setLegacyMode(!hasWebComponents);
  setHoverCapable(hoverMediaQuery.matches);
  if (!hasWebComponents) {
    return;
  }

  if (typeof hoverMediaQuery.addEventListener === 'function') {
    hoverMediaQuery.addEventListener('change', function (event) {
      setHoverCapable(event.matches);
    });
  }

  initColorScheme();
  applyTheme(getCurrentThemeMode());

  if (themeToggle) {
    themeToggle.addEventListener('click', cycleTheme);
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', toggleDrawer);
  }

  syncDrawerState();
  registerDrawerResizeListener();
  buildToc();
  enhanceCodeBlocks();
  initSharePanel();
  initTranslate();
  initScrollTopFab();

  window.addEventListener('load', function () {
    if (window.location.hash) {
      const targetId = window.location.hash.slice(1);
      const targetHeading = document.getElementById(targetId);
      if (targetHeading) {
        window.setTimeout(function () {
          targetHeading.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      }
    }
  });
})();
