# Pyph Histogram
# Generate histograms of images
# Copyright 2011 Adam Greig
# Released under the simplified BSD license, see LICENSE

import Image
import numpy
from matplotlib.backends.backend_agg import FigureCanvasAgg
from matplotlib.figure import Figure

def gen_histogram(infile, outfile):
    """Generate a colour histogram for the infile, saving to outfile."""
    im = Image.open(infile)
    a = numpy.asarray(im)
    w, h, c = a.shape
    a2 = a.reshape(w*h, c)
    f = Figure(figsize=(3,1), dpi=96, frameon=False)
    ax = f.add_axes((0,0,1,1))
    ax.set_color_cycle([(1,0,0),(0,1,0),(0,0,1)])
    ax.hist(a2, bins=20)
    ax.axis('tight')
    ax.set_xticks([])
    ax.set_yticks([])
    c = FigureCanvasAgg(f)
    c.print_png(outfile)
