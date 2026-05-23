import streamlit as st
import base64
from pathlib import Path

st.set_page_config(layout="wide")


def img_to_base64(img_path):
    """Convierte imagen a base64"""
    path = Path(img_path)

    if not path.exists():
        print(f"No existe: {img_path}")
        return ""

    ext = path.suffix.lower()

    mime = {
        ".jpg": "jpeg",
        ".jpeg": "jpeg",
        ".png": "png",
        ".gif": "gif",
        ".webp": "webp"
    }.get(ext, "jpeg")

    with open(path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode()

    return f"data:image/{mime};base64,{encoded}"


# Leer archivos
html = Path("index.html").read_text(encoding="utf-8")
css = Path("style.css").read_text(encoding="utf-8")
js = Path("app.js").read_text(encoding="utf-8")

# Reemplazar TODAS las imágenes de /Imagenes
imagenes_dir = Path("Imagenes")

if imagenes_dir.exists():
    for img in imagenes_dir.iterdir():

        if img.is_file():

            base64_img = img_to_base64(img)

            # Variantes de ruta posibles
            rutas = [
                f"./Imagenes/{img.name}",
                f"Imagenes/{img.name}",
                f"/Imagenes/{img.name}"
            ]

            for ruta in rutas:
                html = html.replace(ruta, base64_img)
                css = css.replace(ruta, base64_img)
                js = js.replace(ruta, base64_img)

# Insertar CSS y JS
html = html.replace(
    "</head>",
    f"<style>{css}</style></head>"
)

html = html.replace(
    "</body>",
    f"<script>{js}</script></body>"
)

# Mostrar web
st.components.v1.html(
    html,
    height=1200,
    scrolling=True
)
