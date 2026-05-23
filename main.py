import streamlit as st
import base64
import os
import re

st.set_page_config(layout="wide")


def image_to_base64(path):
    """Convierte imagen a base64"""
    with open(path, "rb") as img_file:
        ext = path.split(".")[-1].lower()

        mime_types = {
            "jpg": "jpeg",
            "jpeg": "jpeg",
            "png": "png",
            "gif": "gif",
            "webp": "webp",
            "svg": "svg+xml"
        }

        mime = mime_types.get(ext, "jpeg")

        encoded = base64.b64encode(img_file.read()).decode()
        return f"data:image/{mime};base64,{encoded}"


# Leer archivos
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

with open("style.css", "r", encoding="utf-8") as f:
    css = f.read()

with open("app.js", "r", encoding="utf-8") as f:
    js = f.read()


# Reemplazar rutas de imágenes por base64
imagenes_folder = "Imagenes"

if os.path.exists(imagenes_folder):
    for archivo in os.listdir(imagenes_folder):
        ruta = os.path.join(imagenes_folder, archivo)

        if os.path.isfile(ruta):
            try:
                base64_img = image_to_base64(ruta)

                # Reemplaza todas las formas posibles
                html = html.replace(f"Imagenes/{archivo}", base64_img)
                css = css.replace(f"Imagenes/{archivo}", base64_img)
                js = js.replace(f"Imagenes/{archivo}", base64_img)

                html = html.replace(f"./Imagenes/{archivo}", base64_img)
                css = css.replace(f"./Imagenes/{archivo}", base64_img)
                js = js.replace(f"./Imagenes/{archivo}", base64_img)

            except Exception as e:
                print(f"Error cargando {archivo}: {e}")


# Inyectar CSS y JS
html = html.replace(
    "</head>",
    f"<style>{css}</style></head>"
)

html = html.replace(
    "</body>",
    f"<script>{js}</script></body>"
)

# Mostrar página
st.components.v1.html(
    html,
    height=1200,
    scrolling=True
)
