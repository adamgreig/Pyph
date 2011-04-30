# Pyph
# A simple photo editor
# Copyright 2011 Adam Greig
# CC-BY 2.0 UK:England & Wales

import Image
import os
import uuid
from flask import Flask, render_template, request, jsonify, abort, session
from flaskext import uploads

from histogram import gen_histogram

app = Flask(__name__)
app.config.from_object("config")

photos = uploads.UploadSet('files', uploads.IMAGES)
uploads.configure_uploads(app, photos)

def handle_upload():
    """
    Store an incoming file, generate a thumbnail and histogram, add the details
    to the session and return the required data for the page to update.
    """
    ip = request.environ["REMOTE_ADDR"]
    name = uuid.uuid4().hex
    name += os.path.splitext(request.files['file'].filename)[1]
    filename = photos.save(request.files['file'], folder=ip, name=name)
    path = photos.path(filename)
    image = Image.open(path)
    image.thumbnail((64,64))
    image.save(path + ".t.jpg")
    gen_histogram(path, path+".h.png")
    photo = {"name": filename, "url": photos.url(filename)}
    session['files'].append(photo)
    session.modified = True
    return jsonify(photo)
    
def setup_session():
    session['files'] = []
    for filename in os.listdir("images/stock/"):
        if filename[-5:] != "t.jpg" and filename[-5:] != "h.png":
            session['files'].append({"name": "stock/"+filename,
                "url": photos.url("stock/"+filename)})
            session.modified = True

@app.before_request
def pre_check():
    """Put the stock images into the session to start with."""
    if 'files' not in session:
        setup_session()

@app.route("/")
def index():
    """Load the main page."""
    return render_template('index.html')

@app.route("/upload", methods=['GET', 'POST'])
def upload():
    """Handle a new file upload."""
    if request.method == 'GET':
        return jsonify(files=session['files'])
    elif request.method == 'POST' and 'file' in request.files:
        return handle_upload()
    else:
        abort(400)

@app.route("/delete/<path:filename>")
def delete(filename):
    """Delete an uploaded photo from the session and filesystem."""

    # Remove the image from the session
    photo = {"name": filename, "url": photos.url(filename)}
    if photo in session['files']:
        session['files'].remove(photo)
        session.modified = True

    # Don't delete stock images
    if filename.split("/")[0] == "stock":
        return "OK"

    # Check the IP part of the filename is right
    ip = filename.split("/")[0]
    if ip != request.environ["REMOTE_ADDR"]:
        abort(403)

    # Verify the path, check the IP again
    # This also verifies that there's no trickery going on
    #  with the filename part (i.e., it's a canonical path
    #  and the filename is at the end)
    path = os.path.realpath(photos.path(filename))
    ip = os.path.split(os.path.split(path)[0])[1]
    if ip != request.environ["REMOTE_ADDR"]:
        abort(403)

    # Check the file exists and if so delete it
    if os.path.exists(path):
        os.remove(path)

    # If we can find a thumbnail, delete that too
    if os.path.exists(path+".t.jpg"):
        os.remove(path+".t.jpg")

    # Same again for histogram
    if os.path.exists(path+".h.png"):
        os.remote(path+".h.png")

    return "OK"

@app.route("/reset")
def reset():
    """Delete all user images in session, then reset the session."""
    to_delete = []
    for f in session['files']:
        if f['name'][:5] != "stock":
            to_delete.append(f['name'])
    for name in to_delete:
        delete(name)
    setup_session()
    return "OK"

if __name__ == "__main__":
    app.debug = True
    app.run()
