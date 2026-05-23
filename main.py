import streamlit as st
from pathlib import Path

# Configuración de página
st.set_page_config(
    page_title="SRE UNI",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Ocultar UI innecesaria de Streamlit
st.markdown("""
<style>
#MainMenu {visibility: hidden;}
header {visibility: hidden;}
footer {visibility: hidden;}

.block-container {
    padding: 0 !important;
    max-width: 100% !important;
}

iframe {
    width: 100% !important;
}
</style>
""", unsafe_allow_html=True)

# Leer archivos
html = Path("index.html").read_text(encoding="utf-8")
css = Path("style.css").read_text(encoding="utf-8")
js = Path("app.js").read_text(encoding="utf-8")

# Eliminar referencias externas del HTML
html = html.replace(
    '<link rel="stylesheet" href="style.css">',
    ''
)

html = html.replace(
    '<script src="app.js"></script>',
    ''
)

# Inyectar CSS
html = html.replace(
    "</head>",
    f"<style>{css}</style></head>"
)

# Inyectar JS
html = html.replace(
    "</body>",
    f"<script>{js}</script></body>"
)

# Renderizar app
st.components.v1.html(
    html,
    height=1200,
    scrolling=True
)
