# Pyph Resize
# Resize an image
# Copyright 2011 Adam Greig
# Released under the simpified BSD license, see LICENSE

import Image
import numpy

def do_resize(infile, outfile, c):
    """Resize infile, saving the result to outfile, going by sizes in c."""
    im = Image.open(infile)
    a = numpy.asarray(im)
    # magic here
    im = Image.fromarray(a)
    im.save(outfile)
