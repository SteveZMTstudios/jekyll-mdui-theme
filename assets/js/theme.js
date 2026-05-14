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
  const DRAWER_STORAGE_KEY = 'drawer-state';
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
    'chinese-simplified': 'chinese_simplified',
    'chinese-traditional': 'chinese_traditional',
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
  let pendingTranslateLanguage = '';
  let pendingTranslateReason = '';
  let pendingTranslateSnackbarShown = false;
  let translateSuccessCheckTimer = null;
  let translateLoadingStopTimer = null;
  let translateLoadingHardStopTimer = null;

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

    const icon = mode === 'dark' ? 'dark_mode' : mode === 'light' ? 'light_mode' : 'brightness_4';
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

  function getStoredDrawerState(isMobile) {
    const drawerMode = isMobile ? 'mobile' : 'desktop';
    try {
      const rawState = window.localStorage.getItem(DRAWER_STORAGE_KEY);
      if (!rawState) {
        return null;
      }

      const parsedState = JSON.parse(rawState);
      if (!parsedState || typeof parsedState !== 'object') {
        return null;
      }

      if (typeof parsedState[drawerMode] === 'boolean') {
        return parsedState[drawerMode];
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  function saveDrawerState(isMobile, isOpen) {
    const drawerMode = isMobile ? 'mobile' : 'desktop';
    let state = {};

    try {
      const rawState = window.localStorage.getItem(DRAWER_STORAGE_KEY);
      if (rawState) {
        const parsedState = JSON.parse(rawState);
        if (parsedState && typeof parsedState === 'object') {
          state = parsedState;
        }
      }

      state[drawerMode] = Boolean(isOpen);
      window.localStorage.setItem(DRAWER_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function updateDrawerToggleState(isOpen) {
    if (!sidebarToggle) {
      return;
    }

    sidebarToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
  }

  function syncDrawerState() {
    if (!sidebar) {
      return;
    }

    const isMobile = drawerMediaQuery.matches;
    const savedOpenState = getStoredDrawerState(isMobile);
    const fallbackOpenState = !isMobile;
    const shouldOpen = typeof savedOpenState === 'boolean' ? savedOpenState : fallbackOpenState;

    sidebar.modal = isMobile;
    sidebar.open = shouldOpen;
    body.classList.toggle('drawer-mobile', isMobile);
    body.classList.toggle('drawer-desktop', !isMobile);
    updateDrawerToggleState(shouldOpen);
  }

  function toggleDrawer() {
    if (!sidebar) {
      return;
    }

    sidebar.open = !sidebar.open;
    updateDrawerToggleState(sidebar.open);
    saveDrawerState(drawerMediaQuery.matches, sidebar.open);
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

  function registerDrawerStateListener() {
    if (!sidebar) {
      return;
    }

    const persistDrawerState = function () {
      const isOpen = Boolean(sidebar.open);
      updateDrawerToggleState(isOpen);
      saveDrawerState(drawerMediaQuery.matches, isOpen);
    };

    sidebar.addEventListener('opened', persistDrawerState);
    sidebar.addEventListener('closed', persistDrawerState);
  }

  function normalizeTranslateLanguageCode(code) {
    const input = String(code || '').trim().toLowerCase();
    const raw = input.replace(/_/g, '-');
    if (!raw) {
      return 'chinese_simplified';
    }

    if (translateLanguageLabels[input]) {
      return input;
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

  function getTranslateDoneMessage(targetLanguageCode) {
    const normalized = normalizeTranslateLanguageCode(targetLanguageCode);
    const messages = {
      chinese_simplified: '页面已翻译为简体中文',
      chinese_traditional: '頁面已翻譯為繁體中文',
      english: 'Page translated to English',
      japanese: 'ページは日本語に翻訳されました',
      korean: '페이지가 한국어로 번역되었습니다',
      russian: 'Страница переведена на русский язык',
      french: 'La page a ete traduite en francais',
      deutsch: 'Die Seite wurde ins Deutsche uebersetzt',
      spanish: 'La pagina se tradujo al espanol',
      portuguese: 'A pagina foi traduzida para portugues',
      italian: 'La pagina e stata tradotta in italiano',
      vietnamese: 'Trang da duoc dich sang tieng Viet',
      thai: 'หน้านี้ถูกแปลเป็นภาษาไทยแล้ว',
      indonesian: 'Halaman telah diterjemahkan ke Bahasa Indonesia',
      arabic: 'تمت ترجمة الصفحة إلى العربية',
      hindi: 'पेज का हिंदी में अनुवाद हो गया है',
      bengali: 'পৃষ্ঠাটি বাংলায় অনুবাদ করা হয়েছে',
      turkish: 'Sayfa Turkceye cevrildi',
      polish: 'Strona zostala przetlumaczona na jezyk polski',
      ukrainian: 'Сторінку перекладено українською',
      dutch: 'De pagina is vertaald naar het Nederlands',
      malay: 'Halaman telah diterjemahkan ke Bahasa Melayu',
      filipino: 'Na-translate na ang pahina sa Filipino'
    };

    return messages[normalized] || ('Page translated to ' + getTranslateLanguageLabel(normalized));
  }

  function showTranslateFinishedSnackbar(targetLanguageCode) {
    const message = getTranslateDoneMessage(targetLanguageCode);
    if (!message) {
      return;
    }

    console.info("[Translate] " + message);
    if (window.mdui && typeof window.mdui.snackbar === 'function') {
      window.mdui.snackbar({
        message: message,
        closeable: true,
        autoCloseDelay: 5000
      });
      return;
    }

    const fallback = document.createElement('mdui-snackbar');
    fallback.textContent = message;
    fallback.closeable = true;
    document.body.appendChild(fallback);
    fallback.open = true;

    window.setTimeout(function () {
      if (fallback.parentNode) {
        fallback.parentNode.removeChild(fallback);
      }
    }, 5300);
  }

  function setTranslateDirection(languageCode) {
    const normalized = normalizeTranslateLanguageCode(languageCode);
    if (normalized === 'arabic') {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }

  function clearTranslateSuccessMonitor() {
    if (!translateSuccessCheckTimer) {
      return;
    }

    window.clearInterval(translateSuccessCheckTimer);
    translateSuccessCheckTimer = null;
  }

  function finalizeTranslateSuccess(languageCode) {
    const normalized = normalizeTranslateLanguageCode(languageCode);
    updateTranslateLanguageState(normalized);

    if (!pendingTranslateSnackbarShown) {
      showTranslateFinishedSnackbar(normalized);
      pendingTranslateSnackbarShown = true;
    }

    pendingTranslateLanguage = '';
    pendingTranslateReason = '';
    stopTranslateLoading(40);
    syncTranslateMenu(normalized);
    setTranslateDirection(normalized);
  }

  function startTranslateSuccessMonitor(expectedLanguage, baselineLanguage) {
    const expected = expectedLanguage ? normalizeTranslateLanguageCode(expectedLanguage) : '';
    const baseline = baselineLanguage ? normalizeTranslateLanguageCode(baselineLanguage) : '';
    let attempts = 0;

    clearTranslateSuccessMonitor();
    translateSuccessCheckTimer = window.setInterval(function () {
      attempts += 1;
      const currentLanguage = getTranslateCurrentLanguage();

      if (expected && currentLanguage === expected) {
        clearTranslateSuccessMonitor();
        finalizeTranslateSuccess(currentLanguage);
        return;
      }

      if (!expected && currentLanguage && (!baseline || currentLanguage !== baseline)) {
        clearTranslateSuccessMonitor();
        finalizeTranslateSuccess(currentLanguage);
        return;
      }

      if (attempts >= 40) {
        clearTranslateSuccessMonitor();
      }
    }, 160);
  }

  function requestTranslateLanguage(nextLanguage, reason) {
    const normalized = normalizeTranslateLanguageCode(nextLanguage);
    pendingTranslateLanguage = normalized;
    pendingTranslateReason = reason || 'unknown';
    pendingTranslateSnackbarShown = false;
    startTranslateLoading();

    if (typeof window.translate.changeLanguage === 'function') {
      window.translate.changeLanguage(normalized);
    }

    if (typeof window.translate.execute === 'function') {
      window.translate.execute();
    }

    startTranslateSuccessMonitor(normalized, '');
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
    const currentLanguage = getTranslateCurrentLanguage();
    const normalized = currentLanguage || normalizeTranslateLanguageCode(code);
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
      const currentLanguage = getTranslateCurrentLanguage();
      const normalizedCurrentLanguage = currentLanguage || activeTranslateLanguage;

      if (pendingTranslateLanguage && currentLanguage === pendingTranslateLanguage) {
        clearTranslateSuccessMonitor();
        finalizeTranslateSuccess(currentLanguage);
      }

      stopTranslateLoading(60);
      syncTranslateMenu(normalizedCurrentLanguage);
      setTranslateDirection(normalizedCurrentLanguage);
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
      stopTranslateLoading(1200);

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

      const savedLanguage = getStoredTranslateLanguage();

      if (savedLanguage && window.translate.language && typeof window.translate.language.setDefaultTo === 'function') {
        window.translate.language.setDefaultTo(savedLanguage);
      }

      if (typeof window.translate.setAutoDiscriminateLocalLanguage === 'function') {
        window.translate.setAutoDiscriminateLocalLanguage();
      }

      if (savedLanguage) {
        requestTranslateLanguage(savedLanguage, 'init-restore');
      } else if (typeof window.translate.execute === 'function') {
        const initialCurrentLanguage = getTranslateCurrentLanguage() || sourceLanguage;
        pendingTranslateLanguage = '';
        pendingTranslateReason = 'init-auto';
        pendingTranslateSnackbarShown = false;
        startTranslateLoading();
        window.translate.execute();
        startTranslateSuccessMonitor('', initialCurrentLanguage);
      }

      syncTranslateMenu(sourceLanguage);
    } catch (error) {
      console.warn('translate init failed', error);
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

      requestTranslateLanguage(nextLanguage, 'manual');
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

  function resolveShareDisplayUrl(shareUrl) {
    const displayUrl = new URL(shareUrl);
    displayUrl.hash = '';
    return decodeURI(displayUrl.toString());
  }

  function canUseNativeShare(shareData) {
    if (typeof navigator.share !== 'function') {
      return false;
    }

    if (typeof navigator.canShare !== 'function') {
      return true;
    }

    try {
      return navigator.canShare(shareData);
    } catch (error) {
      return false;
    }
  }

  function initSharePanel() {
    const shareUrl = resolveShareUrl();
    const shareDisplayUrl = resolveShareDisplayUrl(shareUrl);
    const shareTitle = articleTitleText ? articleTitleText.textContent.trim() : document.title;

    if (articleUrlText) {
      articleUrlText.href = shareUrl;
      articleUrlText.textContent = shareDisplayUrl;
    }

    if (qrDialogUrl) {
      qrDialogUrl.textContent = shareDisplayUrl;
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

    if (shareButton) {
      const shareData = {
        title: shareTitle,
        text: shareTitle,
        url: shareUrl
      };
      const canShare = canUseNativeShare(shareData);

      shareButton.hidden = !canShare;

      if (!canShare) {
        return;
      }

      shareButton.addEventListener('click', function () {
        navigator.share(shareData).catch(function () {
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

  window.ThemeAPI = {
    buildToc: buildToc,
    enhanceCodeBlocks: enhanceCodeBlocks
  };

  setHoverCapable(hoverMediaQuery.matches);

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

  registerDrawerStateListener();
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
