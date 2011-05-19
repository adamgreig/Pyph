# Pyph Resize
# Resize an image
# Copyright 2011 Adam Greig
# Released under the simpified BSD license, see LICENSE

import Image
import numpy as np

def do_resize(infile, outfile, c):
    """Resize infile, saving the result to outfile, going by sizes in c."""
    img = np.asarray(Image.open(infile))

    old_h = img.shape[0]
    old_w = img.shape[1]

    # get new w/h
    w, h = 0, 0
    if c['w'] and c['h']:
        w = int(c['w'])
        h = int(c['h'])
    elif c['sf']:
        h = int(float(c['sf']) * old_h)
        w = int(float(c['sf']) * old_w)
    else:
        # it all went wrong, save and quit
        Image.fromarray(img).save(outfile)
        return

    # calculate sampling points in x and y
    sample_x = np.linspace(0.5, w - 0.5, w) * (float(old_w) / float(w))
    sample_y = np.linspace(0.5, h - 0.5, h) * (float(old_h) / float(h))

    # clip the sampling points to 1..w,h to prevent silly gradients
    sample_x.clip(1, old_w - 2, sample_x)
    sample_y.clip(1, old_h - 2, sample_y)

    # space for new image
    new = np.empty((h, w, 3), np.uint8)

    # for each colour in the image, filter
    for colour_index in np.arange(3):
        colour = img[:, :, colour_index]

        # Compute the first row of interpolations
        prev_row = np.empty((w))
        for col in range(w):
            p = sample_x[col]
            x1 = int(p)
            x2 = int(p) + 1
            v1 = int(colour[0, x1])
            v2 = int(colour[0, x2])
            prev_row[col] = linear(x1, v1, x2, v2, p)

        # a) I know scipy.interp2d exists, but using functions like that
        #    is not the point of this exercise
        # b) for now, bilinear only, despite what the web interface suggests
        for row in range(h):
            for col in range(w):
                # get the sampling co-ords
                sample = (sample_y[row], sample_x[col])

                # get the x, y co-ords of surrounding points
                x1 = int(sample[1])
                x2 = int(sample[1]) + 1
                y1 = int(sample[0])
                y2 = int(sample[0]) + 1

                # get the values of those points
                x1y1 = int(colour[y1, x1])
                x1y2 = int(colour[y2, x1])
                x2y1 = int(colour[y1, x2])
                x2y2 = int(colour[y2, x2])

                # look up first row
                r1 = prev_row[col]

                # interpolate along the second row
                r2 = linear(x1, x1y2, x2, x2y2, sample[1])

                # Update stored results
                prev_row[col] = r2

                # interpolate between r1 and r2 and save the result
                new[row, col, colour_index] = linear(y1, r1, y2, r2, sample[0])

    Image.fromarray(new).save(outfile, quality=95)

def linear(x1, v1, x2, v2, p):
    """
    Return the one dimensional linear interpolation of p between x1 and x2.
    x1 and x2 are the two x-coordinates, v1 and v2 their respective values.
    p is the to-be-interpolated x-coordinate.
    """
    return v1 + ((v2 - v1) / (x2 - x1)) * (p - x1)
