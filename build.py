#!/usr/bin/env python3
"""
Inline the multi-file site into one self-contained page.

Two outputs:
  dist/index.html    full standalone page (doctype + head) — deployable anywhere
  dist/artifact.html body fragment only — what the Artifact tool wants
"""
import base64
import mimetypes
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
DIST = ROOT / "dist"


def data_uri(rel: str) -> str:
    p = (ROOT / rel).resolve()
    mime = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def build(src: str = "index.html", tag: str = "") -> None:
    html = (ROOT / src).read_text()
    css = (ROOT / "assets/css/shell.css").read_text()
    js = (ROOT / "assets/js/shell.js").read_text()

    # images referenced from CSS are relative to assets/css/
    css = re.sub(
        r"url\(['\"]?\.\./img/([^'\")]+)['\"]?\)",
        lambda m: f"url('{data_uri('assets/img/' + m.group(1))}')",
        css,
    )

    html = html.replace(
        '<link rel="stylesheet" href="assets/css/shell.css">',
        f"<style>\n{css}\n</style>",
    )
    # the switcher references wallpapers from JS, so inline those paths as well
    js = re.sub(
        r"""(['"])(assets/img/[^'"]+)\1""",
        lambda m: m.group(1) + data_uri(m.group(2)) + m.group(1),
        js,
    )
    html = html.replace(
        '<script src="assets/js/shell.js"></script>',
        f"<script>\n{js}\n</script>",
    )

    # images referenced from index.html
    html = re.sub(
        r'src="assets/img/([^"]+)"',
        lambda m: 'src="' + data_uri("assets/img/" + m.group(1)) + '"',
        html,
    )

    DIST.mkdir(exist_ok=True)
    (DIST / f"index{tag}.html").write_text(html)

    # artifact build: strip the document skeleton, keep head contents + body
    m_head = re.search(r"<head>(.*?)</head>", html, re.S)
    m_body = re.search(r"<body>(.*?)</body>", html, re.S)
    if not (m_head and m_body):
        raise SystemExit("index.html is missing <head> or <body>")
    head, body = m_head.group(1), m_body.group(1)
    head = re.sub(r"<meta[^>]*charset[^>]*>|<meta[^>]*viewport[^>]*>", "", head)
    # the gallery wants a short product name; the deployed site keeps its real <title>
    head = re.sub(r"<title>.*?</title>", "<title>Omarchy Workspaces</title>", head, flags=re.S)
    (DIST / f"artifact{tag}.html").write_text(head.strip() + "\n" + body.strip() + "\n")

    for f in (f"index{tag}.html", f"artifact{tag}.html"):
        kb = (DIST / f).stat().st_size / 1024
        print(f"dist/{f:<14} {kb:8.1f} KB")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 2:
        build(sys.argv[1], sys.argv[2])
    else:
        build()
