(function () {
  const article = document.getElementById('articleContent');
  const toc = document.getElementById('toc');

  function uint8ArrayFromBase64(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; ++i) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  async function decryptData(passwordStr, base64Salt, base64Iv, base64Ciphertext, base64Tag) {
    const salt = uint8ArrayFromBase64(base64Salt);
    const iv = uint8ArrayFromBase64(base64Iv);
    // Construct aes-256-gcm payload: ciphertext + tag
    const ciphertextBytes = uint8ArrayFromBase64(base64Ciphertext);
    const tagBytes = uint8ArrayFromBase64(base64Tag);
    const encryptedBytes = new Uint8Array(ciphertextBytes.length + tagBytes.length);
    encryptedBytes.set(ciphertextBytes, 0);
    encryptedBytes.set(tagBytes, ciphertextBytes.length);

    const encoder = new TextEncoder();
    const passwordKey = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(passwordStr),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      aesKey,
      encryptedBytes
    );

    return new TextDecoder().decode(decryptedBuffer);
  }

  function initCrypto() {
    const dataScript = document.getElementById('crypto-data');
    if (!dataScript || !article) {
      return;
    }

    let cryptoData = null;
    try {
      cryptoData = JSON.parse(dataScript.textContent);
    } catch (e) {
      console.error('Failed to parse crypto data', e);
      return;
    }

    if (!cryptoData || !cryptoData.encrypted) return;

    const dialog = document.getElementById('passwordDialog');
    const input = document.getElementById('cryptoPasswordInput');
    const btn = document.getElementById('decryptButtonText');
    const legacyFallback = document.getElementById('legacyCryptoFallback');
    const legacyForm = document.getElementById('legacyCryptoForm');
    const legacyInput = document.getElementById('legacyCryptoPassword');
    const pasteBtn = document.getElementById('pastePasswordButton');
    const rememberCheckbox = document.getElementById('rememberPassword');
    const credentialWarning = document.getElementById('cryptoCredentialWarning');
    const storageKey = 'crypto-password:' + window.location.pathname;
    const urlPassword = new URL(window.location.href).searchParams.get('pwd') || '';
    const savePassMode = String(cryptoData.savePass || '').trim().toLowerCase();
    const savePassDisabled = savePassMode === 'disabled' || savePassMode === 'disable';
    const savePassDefaultOn = savePassMode === 'on' || savePassMode === 'true' || savePassMode === 'yes';

    // Show initial TOC skeleton if encrypted
    if (toc) {
      toc.innerHTML = `
        <div style="padding: 16px;">
          <div class="skeleton-line" style="width: 80%; height: 14px; margin-bottom: 12px;"></div>
          <div class="skeleton-line" style="width: 60%; height: 14px; margin-bottom: 12px;"></div>
          <div class="skeleton-line" style="width: 90%; height: 14px; margin-bottom: 12px;"></div>
          <div class="skeleton-line" style="width: 50%; height: 14px; margin-bottom: 18px;"></div>
          <div class="skeleton-line" style="width: 80%; height: 14px; margin-bottom: 12px;"></div>
          <div class="skeleton-line" style="width: 60%; height: 14px; margin-bottom: 12px;"></div>
          <div class="skeleton-line" style="width: 90%; height: 14px; margin-bottom: 12px;"></div>
          <div class="skeleton-line" style="width: 50%; height: 14px;"></div>
        </div>
      `;
    }

    let storedPassword = '';
    if (!savePassDisabled) {
      try {
        storedPassword = window.localStorage.getItem(storageKey) || '';
      } catch (error) {
        storedPassword = '';
      }
    }

    if (rememberCheckbox) {
      if (savePassDisabled) {
        rememberCheckbox.checked = false;
        rememberCheckbox.disabled = true;
      } else if (storedPassword) {
        rememberCheckbox.checked = true;
      } else {
        rememberCheckbox.checked = savePassDefaultOn;
      }
    }
    if (savePassDisabled && input) {
      input.setAttribute('autocomplete', 'off');
    }

    let resolving = false;

    function clearStoredPassword() {
      try {
        window.localStorage.removeItem(storageKey);
      } catch (error) {
        // Ignore storage failures.
      }
    }

    function clearPasswordFromUrl() {
      try {
        const currentUrl = new URL(window.location.href);
        if (!currentUrl.searchParams.has('pwd')) {
          return;
        }

        currentUrl.searchParams.delete('pwd');
        const cleanedUrl = currentUrl.pathname + currentUrl.search + currentUrl.hash;
        window.history.replaceState({}, document.title, cleanedUrl);
      } catch (error) {
        // Ignore URL cleanup failures.
      }
    }

    function setPasswordError(message) {
      if (!input) {
        return;
      }

      if (typeof input.setCustomValidity === 'function') {
        input.setCustomValidity(message);
      }

      input.helper = message;

      if (typeof input.reportValidity === 'function') {
        input.reportValidity();
      }

      input.value = '';
      input.classList.remove('shake-once');
      void input.offsetWidth; // trigger reflow
      input.classList.add('shake-once');
    }

    function clearPasswordError() {
      if (!input) {
        return;
      }

      if (typeof input.setCustomValidity === 'function') {
        input.setCustomValidity('');
      }

      input.helper = '';

      if (typeof input.reportValidity === 'function') {
        input.reportValidity();
      }
    }

    async function attemptDecrypt(password, options) {
      const useOptions = options || {};
      const source = useOptions.source || 'manual';
      const isAuto = source !== 'manual';
      const isUrlSource = source === 'url';
      if (resolving) return;
      if (!password) {
        if (!isAuto) {
          setPasswordError('请输入密码');
        }
        return;
      }
      resolving = true;
      if (btn) btn.loading = true;

      try {
        const markdown = await decryptData(password, cryptoData.salt, cryptoData.iv, cryptoData.ciphertext, cryptoData.tag);
        
        // Dynamically load marked
        const script = document.createElement('script');
        script.src = 'https://s4.zstatic.net/npm/marked@12.0.2/marked.min.js';
        script.onload = () => {
          article.innerHTML = window.marked.parse(markdown);
          article.classList.remove('encrypted-content-placeholder');
          if (window.ThemeAPI) {
            if (window.ThemeAPI.buildToc) window.ThemeAPI.buildToc();
            if (window.ThemeAPI.enhanceCodeBlocks) window.ThemeAPI.enhanceCodeBlocks();
          }
          if (window.translate && typeof window.translate.execute === 'function') {
            try {
              window.translate.execute();
            } catch (error) {
              console.warn('translate execute failed', error);
            }
          }
        };
        script.onerror = () => {
          alert('Failed to load markdown parser.');
        };
        document.head.appendChild(script);

        if (!savePassDisabled && !isUrlSource) {
          if (rememberCheckbox && rememberCheckbox.checked) {
            try {
              window.localStorage.setItem(storageKey, password);
            } catch (error) {
              // Ignore storage failures.
            }
          } else {
            clearStoredPassword();
          }
        }

        if (credentialWarning) {
          credentialWarning.hidden = true;
        }

        clearPasswordError();
        clearPasswordFromUrl();
        if (dialog) dialog.open = false;
        if (legacyFallback) legacyFallback.hidden = true;
      } catch (err) {
        console.error(err);
        const msg = '密码不正确或解密失败';
        if (isAuto) {
          if (credentialWarning && !isUrlSource) {
            credentialWarning.hidden = false;
          }
          if (rememberCheckbox && !isUrlSource) {
            rememberCheckbox.checked = false;
          }
          if (!isUrlSource) {
            clearStoredPassword();
          }
          if (dialog && window.customElements) {
            window.customElements.whenDefined('mdui-dialog').then(() => {
              dialog.open = true;
            });
          } else if (legacyFallback) {
            legacyFallback.hidden = false;
          }
        } else if (input) {
          setPasswordError(msg);
        } else if (legacyInput) {
          legacyInput.value = '';
          legacyInput.classList.remove('shake-once');
          void legacyInput.offsetWidth;
          legacyInput.classList.add('shake-once');
          if (window.mdui && window.mdui.snackbar) {
            window.mdui.snackbar({ message: msg, position: 'bottom' });
          } else {
            alert(msg);
          }
        } else {
           if (window.mdui && window.mdui.snackbar) {
            window.mdui.snackbar({ message: msg, position: 'bottom' });
          } else {
            alert(msg);
          }
        }
      } finally {
        resolving = false;
        if (btn) btn.loading = false;
      }
    }

    if (dialog && window.customElements) {
      if (!storedPassword) {
        window.customElements.whenDefined('mdui-dialog').then(() => {
          if (!resolving && article.classList.contains('encrypted-content-placeholder')) {
            dialog.open = true;
          }
        });
      }
      if (btn) {
        btn.addEventListener('click', () => attemptDecrypt(input.value));
      }
      if (input) {
        input.addEventListener('invalid', (event) => {
          event.preventDefault();
          input.helper = input.validationMessage || '请输入有效的密码';
        });
        input.addEventListener('input', () => {
          clearPasswordError();
          if (credentialWarning) {
            credentialWarning.hidden = true;
          }
        });
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') attemptDecrypt(input.value);
        });
      }
      if (pasteBtn && navigator.clipboard && navigator.clipboard.readText) {
        pasteBtn.addEventListener('click', async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (input && text) {
              input.value = text;
              input.invalid = false;
              input.helper = '';
              input.focus();
            }
          } catch (e) {
            console.warn('Failed to read clipboard', e);
          }
        });
      } else if (pasteBtn) {
        pasteBtn.hidden = true;
      }
    } else if (legacyFallback && legacyForm) {
      // Use fallback
      if (!storedPassword) {
        legacyFallback.hidden = false;
      }
      legacyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        attemptDecrypt(legacyInput.value);
      });
    }

    if (urlPassword) {
      attemptDecrypt(urlPassword, { source: 'url' });
    } else if (storedPassword) {
      attemptDecrypt(storedPassword, { source: 'stored' });
    }
  }

  initCrypto();
})();
