import os
import sys
import glob
import base64
import re
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

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

    new_content = "---\n" + "\n".join(new_lines) + "\n---\n"

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Encrypting {file_path}... OK!")


def main():
    args = sys.argv[1:]
    target = args[0] if len(args) > 0 else os.getcwd()

    if os.path.isfile(target):
        encrypt_file(target)
        return

    if os.path.isdir(target):
        for file_path in glob.glob(os.path.join(target, '**/*.md'), recursive=True):
            encrypt_file(file_path)

if __name__ == "__main__":
    main()
