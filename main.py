from flask import Flask, send_from_directory

app = Flask(__name__, static_folder='.')

# Ruta principal -> index.html
@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

# Servir archivos estáticos (css, js, imágenes)
@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
