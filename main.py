import streamlit as st

st.set_page_config(layout="wide")

# Leer archivos
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

with open("style.css", "r", encoding="utf-8") as f:
    css = f.read()

with open("app.js", "r", encoding="utf-8") as f:
    js = f.read()

# Insertar CSS antes de </head>
html = html.replace(
    "</head>",
    f"<style>{css}</style></head>"
)

# Insertar JS antes de </body>
html = html.replace(
    "</body>",
    f"<script>{js}</script></body>"
)

# Mostrar web
st.components.v1.html(
    html,
    height=1000,
    scrolling=True
)
