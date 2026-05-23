import streamlit as st
from pathlib import Path
import streamlit.components.v1 as components

# Configuración de página
st.set_page_config(
    page_title="SRE UNI | Sistema de Reserva de Ambientes",
    page_icon="🎓",
    layout="wide"
)

# Ocultar menú de streamlit (opcional)
st.markdown("""
<style>
#MainMenu {visibility:hidden;}
footer {visibility:hidden;}
header {visibility:hidden;}
.block-container {
    padding-top: 0rem;
    padding-bottom: 0rem;
    padding-left: 0rem;
    padding-right: 0rem;
    max-width: 100%;
}
iframe {
    border: none !important;
}
</style>
""", unsafe_allow_html=True)

# Ruta base del proyecto
BASE_DIR = Path(__file__).parent

# Leer archivos
html_path = BASE_DIR / "index.html"
css_path = BASE_DIR / "style.css"
js_path = BASE_DIR / "app.js"

# Verificar existencia
if not html_path.exists():
    st.error("No se encontró index.html")
    st.stop()

if not css_path.exists():
    st.error("No se encontró style.css")
    st.stop()

if not js_path.exists():
    st.error("No se encontró app.js")
    st.stop()

# Leer contenido
html_content = html_path.read_text(encoding="utf-8")
css_content = css_path.read_text(encoding="utf-8")
js_content = js_path.read_text(encoding="utf-8")

# Inyectar CSS y JS dentro del HTML
html_content = html_content.replace(
    '<link rel="stylesheet" href="style.css">',
    f"<style>{css_content}</style>"
)

html_content = html_content.replace(
    '<script src="app.js"></script>',
    f"<script>{js_content}</script>"
)

# Mantener CDN de Lucide y Google Fonts
# Fix de imágenes para Streamlit Cloud
html_content = html_content.replace(
    'src="Imagenes/',
    'src="./Imagenes/'
)

# Renderizar app completa
components.html(
    html_content,
    height=900,
    scrolling=True
)
