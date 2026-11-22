# Copyright (c) 2026 FlyByWire Simulations
# SPDX-License-Identifier: GPL-3.0

"""
Builds the PDF of the A380X virtual crew user manual from fbw-a380x/docs/virtual-crew/README.md.

The Markdown is converted to HTML with a print style sheet and printed with a Chromium based browser in headless mode
(Google Chrome, Microsoft Edge or Chromium). See README.md of this folder.
"""

import argparse
import datetime
import html
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import markdown

REPO = Path(__file__).resolve().parents[2]
MANUAL = REPO / 'fbw-a380x' / 'docs' / 'virtual-crew' / 'README.md'
OUTPUT = REPO / 'build' / 'virtual-crew-manual' / 'A380X-Virtual-Crew-User-Manual.pdf'
STYLE = Path(__file__).resolve().parent / 'manual.css'

BROWSERS = [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/opt/pw-browsers/chromium',
    'google-chrome',
    'chromium',
    'chromium-browser',
    'microsoft-edge',
]

ALERTS = {'NOTE': 'Note', 'TIP': 'Tip', 'WARNING': 'Warning', 'IMPORTANT': 'Important', 'CAUTION': 'Caution'}


def find_browser(requested):
    for candidate in [requested] if requested else BROWSERS:
        path = shutil.which(candidate) or (candidate if os.path.isfile(candidate) else None)
        if path:
            return path
    sys.exit('No Chromium based browser found, pass its path with --browser')


def github_alerts(text):
    """Converts the GitHub alerts ("> [!NOTE]" blocks) into HTML boxes"""

    def replace(match):
        kind = match.group(1)
        body = re.sub(r'^> ?', '', match.group(2), flags=re.MULTILINE)
        inner = markdown.markdown(body)
        return (
            f'\n<div class="alert alert-{kind.lower()}"><p class="alert-title">{ALERTS[kind]}</p>{inner}</div>\n'
        )

    return re.sub(r'^> \[!(\w+)\]\n((?:>.*\n?)+)', replace, text, flags=re.MULTILINE)


def build_html(source):
    text = source.read_text(encoding='utf-8')
    title = text.splitlines()[0].lstrip('# ').strip()
    # the title is on the cover, the table of contents is generated for the PDF
    text = text.split('\n', 1)[1]
    text = re.sub(r'## Contents\n.*?(?=\n## )', '', text, flags=re.DOTALL)
    text = github_alerts(text)
    # the introduction, before the first chapter, gets its own heading
    text = '## Introduction\n' + text.lstrip()
    body = markdown.markdown(text, extensions=['tables', 'toc', 'attr_list'])
    # a figure for each screenshot, with its description as caption
    body = re.sub(
        r'<p><img alt="([^"]*)" src="([^"]*)" ?/?></p>',
        r'<figure><img alt="\1" src="\2"><figcaption>\1</figcaption></figure>',
        body,
    )

    chapters = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', body)
    contents = ''.join(f'<li><a href="#{anchor}">{name}</a></li>' for anchor, name in chapters[1:])
    name, subtitle = (part.strip() for part in title.split(' - ', 1)) if ' - ' in title else (title, '')

    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>{html.escape(title)}</title>
<style>{STYLE.read_text(encoding='utf-8')}</style></head>
<body>
<section class="cover">
  <div class="cover-band"></div>
  <p class="cover-kicker">FlyByWire A380X</p>
  <h1>{html.escape(name)}</h1>
  <p class="cover-subtitle">{html.escape(subtitle)}</p>
  <img class="cover-image" src="images/crew-idle.png" alt="">
  <p class="cover-date">{datetime.date.today().strftime('%B %Y')}</p>
</section>
<section class="contents"><h2>Contents</h2><ul>{contents}</ul></section>
<main>{body}</main>
</body></html>"""


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--browser', help='path of Chrome, Edge or Chromium')
    parser.add_argument('--output', type=Path, default=OUTPUT, help=f'PDF file (default: {OUTPUT})')
    args = parser.parse_args()

    browser = find_browser(args.browser)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    # the page is written next to the manual, so that the images are found with their relative paths
    with tempfile.NamedTemporaryFile('w', suffix='.html', dir=MANUAL.parent, delete=False, encoding='utf-8') as page:
        page.write(build_html(MANUAL))
    try:
        subprocess.run(
            [
                browser,
                '--headless',
                '--no-sandbox',
                '--disable-gpu',
                '--no-pdf-header-footer',
                '--allow-file-access-from-files',
                f'--print-to-pdf={args.output.resolve()}',
                Path(page.name).resolve().as_uri(),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    finally:
        os.unlink(page.name)
    print(f'Written {args.output}')


if __name__ == '__main__':
    main()
