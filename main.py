from __future__ import annotations

import base64
import mimetypes
import re
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components


BASE_DIR = Path(__file__).parent


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def image_to_data_uri(match: re.Match[str]) -> str:
    image_path = BASE_DIR / match.group(0)
    if not image_path.exists():
        return match.group(0)

    mime_type, _ = mimetypes.guess_type(image_path.name)
    mime_type = mime_type or "application/octet-stream"
    encoded = base64.b64encode(image_path.read_bytes()).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


def build_app_html() -> str:
    html = read_text(BASE_DIR / "index.html")
    css = read_text(BASE_DIR / "style.css")
    js = read_text(BASE_DIR / "app.js")

    streamlit_css = """
    @media (max-width: 768px) {
      .header-inner {
        height: auto;
        min-height: 72px;
        align-items: flex-start;
        flex-wrap: wrap;
        padding: 0.75rem 1rem;
      }

      .nav-menu {
        position: static;
        order: 3;
        width: 100%;
        transform: none;
        opacity: 1;
        pointer-events: auto;
        flex-direction: row;
        flex-wrap: wrap;
        padding: 0;
        box-shadow: none;
      }

      .nav-menu.active {
        transform: none;
      }

      .nav-link {
        width: auto;
        flex: 1 1 140px;
        justify-content: center;
      }

      .mobile-menu-btn {
        display: none;
      }
    }
    """

    image_pattern = r"Imagenes/[^\"']+\.(?:jpg|jpeg|png|gif|webp|JPG|JPEG|PNG)"
    js = re.sub(image_pattern, image_to_data_uri, js)

    html = html.replace('<link rel="stylesheet" href="style.css">', f"<style>{css}\n{streamlit_css}</style>")
    html = html.replace('<script src="app.js"></script>', f"<script>{js}</script>")

    return html


st.set_page_config(
    page_title="SRE UNI | Sistema de Reserva de Ambientes",
    page_icon=":mortar_board:",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.markdown(
    """
    <style>
      .block-container { padding: 0; max-width: 100%; }
      header[data-testid="stHeader"], div[data-testid="stToolbar"] { display: none; }
      iframe { display: block; }
    </style>
    """,
    unsafe_allow_html=True,
)

components.html(build_app_html(), height=1200, scrolling=True)
