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
  
  const newContent = `---\n${newFrontMatterLines.join('\n')}\n---\n`;

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
