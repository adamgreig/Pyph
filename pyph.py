# Pyph
# A simple photo editor
# Copyright 2011 Adam Greig
# CC-BY 2.0 UK:England & Wales

import Image
import os
from flask import Flask, render_template, request, jsonify, abort

app = Flask(__name__)

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/upload", methods=['GET', 'POST'])
def upload():
    if request.method == 'GET':
        return jsonify(files=[])
    elif request.method == 'POST':
        data_file = request.files.get('file')
        filename = data_file.filename
        image = Image.open(data_file)
        thumb = image.copy()
        thumb.thumbnail((64, 64))
        thumb.save("static/images/t-"+filename)
        return jsonify(name=filename, thumb="/static/images/t-"+filename)


if __name__ == "__main__":
    app.debug = True
    app.run()
