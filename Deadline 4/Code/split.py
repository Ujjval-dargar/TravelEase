import os
import shutil
import re

TEMPLATES_DIR = './templates'
STATIC_DIR = './static'
SCRIPTS_DIR = os.path.join(STATIC_DIR, 'scripts')
STYLES_DIR = os.path.join(STATIC_DIR, 'styles')

css_link_pattern = re.compile(
    r'<link[^>]+href=["\']{{\s*url_for\(\s*\'static\',\s*filename\s*=\s*\'([^\'"]+_style\.css)\'\)\s*}}["\']',
    re.IGNORECASE
)

js_script_pattern = re.compile(
    r'<script[^>]+src=["\']{{\s*url_for\(\s*\'static\',\s*filename\s*=\s*\'([^\'"]+_script\.js)\'\)\s*}}["\']',
    re.IGNORECASE
)

def move_static_files():
    os.makedirs(SCRIPTS_DIR, exist_ok=True)
    os.makedirs(STYLES_DIR, exist_ok=True)

    for filename in os.listdir(STATIC_DIR):
        full_path = os.path.join(STATIC_DIR, filename)

        if filename.endswith('_style.css'):
            shutil.move(full_path, os.path.join(STYLES_DIR, filename))
            print(f'🎨 Moved {filename} to /styles/')
        elif filename.endswith('_script.js'):
            shutil.move(full_path, os.path.join(SCRIPTS_DIR, filename))
            print(f'📜 Moved {filename} to /scripts/')

def update_html_references():
    for filename in os.listdir(TEMPLATES_DIR):
        if not filename.endswith('.html'):
            continue

        html_path = os.path.join(TEMPLATES_DIR, filename)
        with open(html_path, 'r', encoding='utf-8') as f:
            html = f.read()

        # Update CSS references
        html = css_link_pattern.sub(
            lambda m: m.group(0).replace(f"filename='{m.group(1)}'", f"filename='styles/{m.group(1)}'"), html
        )

        # Update JS references
        html = js_script_pattern.sub(
            lambda m: m.group(0).replace(f"filename='{m.group(1)}'", f"filename='scripts/{m.group(1)}'"), html
        )

        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html)

        print(f'🔗 Updated links in {filename}')

def main():
    move_static_files()
    update_html_references()
    print('✅ Static assets reorganized and references updated.')

if __name__ == '__main__':
    main()
