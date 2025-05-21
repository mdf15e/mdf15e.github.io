import os
import re
import sys

if len(sys.argv) != 2:
    print("使い方: python update.py <lang: ja or en>")
    sys.exit(1)

template_path = f"./includes/head-{sys.argv[1]}.html"
target_dir = f"./{sys.argv[1]}"
key_name = "head"

with open(template_path, 'r', encoding='utf-8') as f:
    template_content = f.read()

pattern = re.compile(
    rf'<!--\s*KEY:{re.escape(key_name)}\s*-->(.*?)<!--\s*ENDKEY\s*-->',
    re.DOTALL
)

for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            replacement = f'<!-- KEY:{key_name} -->\n{template_content}\n<!-- ENDKEY -->'
            new_content = re.sub(pattern, replacement, content)

            if content != new_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated: {filepath}")
            else:
                print(f"No change: {filepath}")