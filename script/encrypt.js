const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

function encryptFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Simple regex to extract front matter and body
  const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return;
  }

  let frontMatter = match[1];
  const body = match[2].trim();

  const encryptMatch = frontMatter.match(/^(?:encrypt|password):\s*(?:"([^"]+)"|'([^']+)'|(\S+))/m);
  if (!encryptMatch) {
    return;
  }

  const password = encryptMatch[1] || encryptMatch[2] || encryptMatch[3];
  if (!password) {
    return;
  }

  if (frontMatter.includes('encrypted: true')) {
    console.log(`Skipping ${filePath}, already encrypted.`);
    return;
  }

  // Cryptography
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(body, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag().toString('base64');

  // Modify front matter
  const newFrontMatterLines = frontMatter.split(/\r?\n/).filter(line => {
    return line.trim() !== '' && !line.startsWith('encrypt:') && !line.startsWith('password:');
  });
  newFrontMatterLines.push(`encrypted: true`);
  newFrontMatterLines.push(`crypto_salt: "${salt.toString('base64')}"`);
  newFrontMatterLines.push(`crypto_iv: "${iv.toString('base64')}"`);
  newFrontMatterLines.push(`crypto_tag: "${authTag}"`);
  newFrontMatterLines.push(`ciphertext: "${encrypted}"`);
  
  const fallbackText = `
<!-- Fallback content for unsupported environments -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:36px; height:36px"><title>lock-alert-outline</title><path d="M10 17C8.9 17 8 16.1 8 15C8 13.9 8.9 13 10 13C11.1 13 12 13.9 12 15S11.1 17 10 17M16 20V10H4V20H16M16 8C17.1 8 18 8.9 18 10V20C18 21.1 17.1 22 16 22H4C2.9 22 2 21.1 2 20V10C2 8.9 2.9 8 4 8H5V6C5 3.2 7.2 1 10 1S15 3.2 15 6V8H16M10 3C8.3 3 7 4.3 7 6V8H13V6C13 4.3 11.7 3 10 3M22 7H20V13H22V7M22 15H20V17H22V15Z" /></svg>

<span style="font-weight: bold;font-size: 1.5em;">无法正确加载此页</span>

此文档受加密保护，但是您的阅读器似乎没有能力解密。   
This document is protected by encryption, but your reader doesn't seem to be able to decrypt it.  

请尝试以下解决办法:   
Try the following solutions:  
<noscript>
<ul>
<li><b><a href="https://www.enable-javascript.com/">启用 JavaScript</a></b>，然后再试一次。（推荐）<br />
<a href="https://www.enable-javascript.com/">Enable JavaScript</a>, then try again.</li> </ul>
</noscript>

- 使用[受支持的浏览器](https://browser-update.org/zh/update-browser.html)打开网页。  
  Use a supported browser.  
- 清理浏览器缓存后重试。  
  Clear your browser cache and try again.
- 下载[离线解密脚本](https://github.com/SteveZMTstudios/jekyll-mdui-theme/raw/main/script/decrypt.py)（需要 Python3+，参考[文档](https://github.com/SteveZMTstudios/jekyll-mdui-theme#3-%E8%BF%98%E5%8E%9F%E4%B8%BA%E6%9C%AA%E5%8A%A0%E5%AF%86%E7%8A%B6%E6%80%81)）。   
  Download [offline decryption script](https://github.com/SteveZMTstudios/jekyll-mdui-theme/raw/main/script/decrypt.py) (Required Python 3+, see [documentation](https://github.com/SteveZMTstudios/jekyll-mdui-theme#3-%E8%BF%98%E5%8E%9F%E4%B8%BA%E6%9C%AA%E5%8A%A0%E5%AF%86%E7%8A%B6%E6%80%81) for details).
  
`;

  const newContent = `---\n${newFrontMatterLines.join('\n')}\n---\n${fallbackText}`;

  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`Encrypting ${filePath}... OK!`);
}

function scanAndEncrypt(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanAndEncrypt(fullPath);
    } else if (fullPath.endsWith('.md')) {
      encryptFile(fullPath);
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const target = args[0];

  if (!target) {
    scanAndEncrypt(process.cwd());
  } else if (fs.statSync(target).isDirectory()) {
    scanAndEncrypt(target);
  } else {
    encryptFile(target);
  }
}

main();
