import streamlit as st
from pathlib import Path
import streamlit.components.v1 as components
import base64

st.set_page_config(
    page_title="SRE UNI",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Ocultar UI de streamlit
st.markdown("""
<style>
#MainMenu {visibility:hidden;}
footer {visibility:hidden;}
header {visibility:hidden;}

.block-container{
    padding:0rem !important;
    margin:0rem !important;
    max-width:100% !important;
}

iframe {
    width:100% !important;
    border:none !important;
}
</style>
""", unsafe_allow_html=True)

BASE_DIR = Path(__file__).parent

# Leer archivos
html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
css = (BASE_DIR / "style.css").read_text(encoding="utf-8")
js = (BASE_DIR / "app.js").read_text(encoding="utf-8")

# Inyectar CSS
html = html.replace(
    '<link rel="stylesheet" href="style.css">',
    f"<style>{css}</style>"
)

# Inyectar JS
html = html.replace(
    '<script src="app.js"></script>',
    f"<script>{js}</script>"
)

# Fix de imágenes
imagenes_path = BASE_DIR / "Imagenes"

for img in imagenes_path.iterdir():
    if img.is_file():
        with open(img, "rb") as f:
            encoded = base64.b64encode(f.read()).decode()

        mime = "image/jpeg"
        if img.suffix.lower() == ".png":
            mime = "image/png"

        html = html.replace(
            f'Imagenes/{img.name}',
            f'data:{mime};base64,{encoded}'
        )

# Render grande
components.html(
    html,
    height=2500,
    scrolling=True
)
