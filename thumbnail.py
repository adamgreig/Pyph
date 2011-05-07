# Pyph Thumbnail
# Generate a thumbnail for an image
# Copyright 2011 Adam Greig
# Released under the simplified BSD license, see LICENSE

import Image

def gen_thumbnail(infile, outfile):
    """Create a thumbnail of infile, saving to outfile."""
    print "generating thumb,", infile, outfile
    im = Image.open(infile)
    im.thumbnail((64,64))
    im.save(outfile)
