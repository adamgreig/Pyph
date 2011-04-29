# Pyph
# A simple photo editor
# Copyright 2011 Adam Greig
# CC-BY 2.0 UK:England & Wales

from flask import Flask, render_template, request, jsonify, abort

app = Flask(__name__)

@app.route("/")
def hello():
    return render_template('index.html')

@app.route("/upload", methods=['GET', 'POST'])
def upload():
    if request.method == 'GET':
        return jsonify(files=[])
    elif request.method == 'POST':
        data_file = request.files.get('file')
        file_name = data_file.filename
        return jsonify(name=file_name, size=1234, url="/static/lena.jpg")


if __name__ == "__main__":
    app.debug = True
    app.run()
