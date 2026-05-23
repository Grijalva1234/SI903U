import streamlit as st
from pathlib import Path

st.set_page_config(layout="wide")

html_file = Path("index.html")

with open(html_file, "r", encoding="utf-8") as f:
    html_content = f.read()

st.components.v1.html(html_content, height=900, scrolling=True)
