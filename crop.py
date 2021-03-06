# Pyph Crop
# Crop an image
# Copyright 2011 Adam Greig
# Released under the simplified BSD license, see LICENSE

import Image
import numpy

def do_crop(infile, outfile, c):
    """Crop infile, saving the result to outfile, by geometry in c."""
    img = numpy.asarray(Image.open(infile))
    img = img[int(c['y']):int(c['y2']), int(c['x']):int(c['x2'])]
    Image.fromarray(img).save(outfile)
