import os
import sys
import glob
import base64
import re
import traceback
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes


def pause_before_exit():
    if not sys.stdin.isatty():
        return

    try:
        input("Press Enter to exit...")
    except EOFError:
        pass

def encrypt_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match YAML Front Matter
    match = re.match(r'^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$', content)
    if not match:
        return

    front_matter = match.group(1)
    body = match.group(2).strip()

    # Search for "encrypt: password" or "password: password" in front matter
    encrypt_match = re.search(r'^(?:encrypt|password):\s*(?:"([^"]+)"|\'([^\']+)\'|(\S+))', front_matter, re.MULTILINE)
    if not encrypt_match:
        return

    password = encrypt_match.group(1) or encrypt_match.group(2) or encrypt_match.group(3)
    if not password:
        return

    if 'encrypted: true' in front_matter:
        print(f"Skipping {file_path}, already encrypted.")
        return
    
    print(f"Encrypting {file_path} with password {password}...", end='') 
    # Cryptography
    salt = os.urandom(16)
    iv = os.urandom(12)

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = kdf.derive(password.encode('utf-8'))

    aesgcm = AESGCM(key)
    encrypted_data = aesgcm.encrypt(iv, body.encode('utf-8'), None)

    ciphertext_bytes = encrypted_data[:-16]
    auth_tag_bytes = encrypted_data[-16:]

    ciphertext_b64 = base64.b64encode(ciphertext_bytes).decode('utf-8')
    auth_tag_b64 = base64.b64encode(auth_tag_bytes).decode('utf-8')
    salt_b64 = base64.b64encode(salt).decode('utf-8')
    iv_b64 = base64.b64encode(iv).decode('utf-8')

    # Modify front matter
    lines = front_matter.split('\n')
    new_lines = []
    for line in lines:
        if line.startswith('encrypt:') or line.startswith('password:'):
            continue # Remove the encrypt field
        new_lines.append(line)
    
    new_lines.append(f'encrypted: true')
    new_lines.append(f'crypto_salt: "{salt_b64}"')
    new_lines.append(f'crypto_iv: "{iv_b64}"')
    new_lines.append(f'crypto_tag: "{auth_tag_b64}"')
    new_lines.append(f'ciphertext: "{ciphertext_b64}"')

    fallback_text = """<!-- Fallback content for unsupported environments -->
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
  Download [offline decryption script](https://github.com/SteveZMTstudios/jekyll-mdui-theme/raw/main/script/decrypt.py) (Required Python 3+, see [documentation](https://github.com/SteveZMTstudios/jekyll-mdui-theme#3-%E8%BF%98%E5%8E%9F%E4%B8%BA%E6%9C%AA%E5%8A%A0%E5%AF%86%E7%8A%B6%E6%80%81) for details)."""

    new_content = "---\n" + "\n".join(new_lines) + "\n---\n" + fallback_text

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(" OK!")


def main():
    exit_code = 0

    try:
        args = sys.argv[1:]
        target = args[0] if len(args) > 0 else os.getcwd()

        if os.path.isfile(target):
            encrypt_file(target)
        elif os.path.isdir(target):
            for file_path in glob.glob(os.path.join(target, '**/*.md'), recursive=True):
                encrypt_file(file_path)

            print("Encryption complete.")
            print("WARNING: You may want to save the output somewhere safe, as it cannot be recovered if lost.")
            print("警告：请务必妥善保存加密后的文件和密码，丢失后无法恢复。")
        else:
            print(f"Target not found: {target}")
            exit_code = 1
    except Exception:
        traceback.print_exc()
        exit_code = 1
    finally:
        if exit_code != 0:
            pause_before_exit()

    return exit_code

if __name__ == "__main__":
    sys.exit(main())
