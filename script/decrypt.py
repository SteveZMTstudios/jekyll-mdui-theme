import os
import sys
import glob
import base64
import re
import getpass
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes


def parse_value(front_matter, key):
    pattern = r'^' + re.escape(key) + r':\s*(?:"([^"]+)"|\'([^\']+)\'|(\S+))'
    match = re.search(pattern, front_matter, re.MULTILINE)
    if not match:
        return None
    return match.group(1) or match.group(2) or match.group(3)


def yaml_quote(value):
    escaped = value.replace('\\', '\\\\').replace('"', '\\"')
    return f'"{escaped}"'


def read_encrypted_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    match = re.match(r'^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$', content)
    if not match:
        return None

    front_matter = match.group(1)
    if 'encrypted: true' not in front_matter:
        return None

    return front_matter


def decrypt_file(file_path, password):
    front_matter = read_encrypted_file(file_path)
    if not front_matter:
        return True

    salt_b64 = parse_value(front_matter, 'crypto_salt')
    iv_b64 = parse_value(front_matter, 'crypto_iv')
    tag_b64 = parse_value(front_matter, 'crypto_tag')
    ciphertext_b64 = parse_value(front_matter, 'ciphertext')

    if not salt_b64 or not iv_b64 or not tag_b64 or not ciphertext_b64:
        print(f"Missing crypto fields in {file_path}")
        return False

    salt = base64.b64decode(salt_b64)
    iv = base64.b64decode(iv_b64)
    tag = base64.b64decode(tag_b64)
    ciphertext = base64.b64decode(ciphertext_b64)

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = kdf.derive(password.encode('utf-8'))

    aesgcm = AESGCM(key)
    try:
        plaintext = aesgcm.decrypt(iv, ciphertext + tag, None).decode('utf-8')
    except Exception as exc:
        print(f"Failed to decrypt {file_path}: {exc}")
        return False

    lines = front_matter.split('\n')
    filtered = []
    for line in lines:
        if line.startswith('encrypted:'):
            continue
        if line.startswith('crypto_salt:'):
            continue
        if line.startswith('crypto_iv:'):
            continue
        if line.startswith('crypto_tag:'):
            continue
        if line.startswith('ciphertext:'):
            continue
        filtered.append(line)

    filtered.append(f'password: {yaml_quote(password)}')

    new_front_matter = "---\n" + "\n".join(filtered) + "\n---\n"
    new_content = new_front_matter + "\n" + plaintext + "\n"

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"Decrypted {file_path}")
    return True


def prompt_password_for_file(file_path):
    print(f"Preparing to decrypt {file_path}")
    answer = getpass.getpass('Enter password: ')
    answer = answer.strip()
    return answer if answer else None


def decrypt_with_retry(file_path, password):
    current_password = password
    while True:
        if not current_password:
            current_password = prompt_password_for_file(file_path)
            if not current_password:
                print(f"Skipping {file_path}: password is required.")
                return

        if decrypt_file(file_path, current_password):
            return

        print(f"Password did not work for {file_path}. Please try again.")
        current_password = None


def scan_and_decrypt(target, password):
    if os.path.isfile(target):
        decrypt_with_retry(target, password)
        return

    if os.path.isdir(target):
        for file_path in glob.glob(os.path.join(target, '**/*.md'), recursive=True):
            decrypt_with_retry(file_path, password)


def prompt_password():
    answer = getpass.getpass('Enter password: ')
    answer = answer.strip()
    return answer if answer else None


def main():
    args = sys.argv[1:]
    target = args[0] if len(args) > 0 else os.getcwd()
    password = args[1] if len(args) > 1 else prompt_password()

    if not password:
        print('Password is required to decrypt files.')
        sys.exit(1)

    scan_and_decrypt(target, password)


if __name__ == '__main__':
    main()
