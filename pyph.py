# Pyph
# A simple photo editor
# Copyright 2011 Adam Greig
# Released under the simplified BSD license, see LICENSE

import Image
import os
import shutil
import uuid
from flask import Flask, render_template, request, jsonify, abort, session
from flask import send_file
from flaskext import uploads

from histogram import gen_histogram
from thumbnail import gen_thumbnail
from crop import do_crop
from resize import do_resize

app = Flask(__name__)
app.config.from_object("config")
if app.config['UPLOADED_FILES_DEST'][-1] != '/':
    app.config['UPLOADED_FILES_DEST'] += '/'

photos = uploads.UploadSet('files', uploads.IMAGES)
uploads.configure_uploads(app, photos)

def setup_session():
    """Add all the images in the stock folder to a new session."""
    session['files'] = []
    for filename in os.listdir("images/stock/"):
        if filename[-5:] != "t.jpg" and filename[-5:] != "h.png":
            session['files'].append({"name": "stock/"+filename,
                "url": photos.url("stock/"+filename)})
            session.modified = True

def temp_file_path(ip, ext):
    """Generate a temporary file path."""
    name = uuid.uuid4().hex + ext
    return photos.path(ip + '/tmp-' + name)

def url_from_path(path):
    """Turn a file path into a URL."""
    return photos.url('/'.join(path.split('/')[-2:]))

def remove_temp_files(ip, butnot):
    """Remove tmp-* files from a given IP except the path in butnot"""
    path = photos.path(ip+'/tmp')
    user_dir = os.path.split(path)[0]
    files = os.listdir(user_dir)
    for f in files:
        if f[:4] == 'tmp-':
            path = photos.path(ip+'/'+f)
            if path[:len(butnot)] != butnot:
                os.remove(path)

def operate(func, filename):
    """
    Given an image editing function and filename, perform the operation,
    generate required histograms and thumbnails, then return the new
    image's URL.
    """
    path = photos.path(filename)
    if(os.path.exists(path)):
        ip = request.environ["REMOTE_ADDR"]
        remove_temp_files(ip, path)
        ext = os.path.splitext(path)[1]
        tmp = temp_file_path(request.environ["REMOTE_ADDR"], ext)
        func(path, tmp, request.form)
        gen_histogram(tmp, tmp+".h.png")
        gen_thumbnail(tmp, tmp+".t.jpg")
        return jsonify({'url': url_from_path(tmp)})
    else:
        abort(400)

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
        ip = request.environ['REMOTE_ADDR']
        name = uuid.uuid4().hex
        name += os.path.splitext(request.files['file'].filename)[1].lower()
        filename = photos.save(request.files['file'], folder=ip, name=name)
        path = photos.path(filename)
        gen_thumbnail(path, path+".t.jpg")
        gen_histogram(path, path+".h.png")
        photo = {"name": filename, "url": photos.url(filename)}
        session['files'].append(photo)
        session.modified = True
        return jsonify(photo)
    else:
        abort(400)

@app.route("/download/<path:filename>")
def download(filename):
    return send_file(photos.path(filename), as_attachment=True)

@app.route("/save/<path:filename>")
def save(filename):
    """Save an existing file into the session"""
    path = photos.path(filename)
    e = os.path.exists
    if e(path) and e(path+'.t.jpg') and e(path+'.h.png'):
        ip = request.environ['REMOTE_ADDR']
        name = uuid.uuid4().hex
        name += os.path.splitext(path)[1]
        dst = app.config['UPLOADED_FILES_DEST'] + ip + '/' + name
        shutil.copy(path, os.path.abspath(dst))
        shutil.copy(path+'.t.jpg', os.path.abspath(dst+'.t.jpg'))
        shutil.copy(path+'.h.png', os.path.abspath(dst+'.h.png'))
        filename = ip + '/' + name
        photo = {"name": filename, "url": photos.url(filename)}
        session['files'].append(photo)
        session.modified = True
        return jsonify(photo)
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
        os.remove(path+".h.png")

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

@app.route("/crop/<path:filename>", methods=['POST'])
def crop(filename):
    return operate(do_crop, filename)

@app.route("/resize/<path:filename>", methods=['POST'])
def resize(filename):
    return operate(do_resize, filename)

if __name__ == "__main__":
    app.debug = True
    app.run()
