// Pyph
// A simple photo editor
// Copyright 2011 Adam Greig
// Released under the simplified BSD license, see LICENSE
// ******************************************************************

/********************************************************************
 * Helper Functions
 *******************************************************************/

// Check if any pictures are in the picture bar and if not add the
// no pictures message.
function check_for_no_pictures() {
    if($('.picture-thumb').length == 0) {
        $('#picture-bar').append(
            "<span id='no-pictures'>No pictures yet. Upload one!<\/span>"
        );
    }
}

// Bind useful things to just-made pictures in the carousel
function bind_thumbs() {
    $('.tip').tipsy();
    $('.picture-thumb').draggable({
        revert: true,
        helper: 'clone',
        appendTo: 'body',
        containment: 'window'
    });
}

// Given a thumbnail source, set the display images and histos
function set_display(src) {
    src = src.slice(0, -6);
    var src_h = src + ".h.png";
    
    //if(jcrop_api !== undefined) {
        //jcrop_api.destroy();
    //}

    if($('#zoom').attr('checked')) {
        remove_zoom();
        $('#zoom').attr('checked', false);
        $('#zoom').button("refresh");
    }

    $('#l-image').attr('src', src);
    $('#r-image').attr('src', src);

    $('#l-image-h').attr('src', src_h);
    $('#r-image-h').attr('src', src_h);

}

// Fetch the starting items, removing the "No pictures" note if appropriate
function refresh_pictures() {
    $.getJSON("/upload", function(data) {
        $('#picture-bar').jcarousel('reset');
        if(data.files.length > 0) {
            $('#no-pictures').fadeOut(400, function(){$(this).remove();});
            var options = $('#picture-upload').fileUploadUI('option');
            $.each(data.files, function(index, file) {
                element = options.buildDownloadRow(file)[0];
                $('#picture-bar').jcarousel('add', index + 1, element);
            });

            $('#picture-bar').jcarousel('size', data.files.length);
            bind_thumbs();

            set_display($('.picture-thumb').attr('src'));
        } else {
            check_for_no_pictures();
        }
    });
}

// Apply zoom to the pictures
function apply_zoom() {
    $('#l-image').wrap('<a href="' + $('#l-image').attr('src') +
        '" class="cloud-zoom" id="l-a" />');
    $('#l-a').attr('rel', 'position: "inside"');
    $('#r-image').wrap('<a href="' + $('#r-image').attr('src') +
        '" class="cloud-zoom" id="r-a" />');
    $('#r-a').attr('rel', 'position: "inside"');
    $('.cloud-zoom').CloudZoom();
}

// Remove zoom from the pictures
function remove_zoom() {
    var l = $('#l-image').clone();
    var r = $('#r-image').clone();
    $('#l-image-wrapper').children().first().remove();
    $('#r-image-wrapper').children().first().remove();
    $('#l-image-wrapper').prepend(l);
    $('#r-image-wrapper').prepend(r);
}

// Generate a link such as /delete/127.0.0.1/abcdef.jpg
function link(src, noun) {
    var parts = src.split('/');
    length = parts.length;
    return '/' + noun + '/' + parts[length - 2] + '/' + parts[length - 1];
}

// Generate /download links
function download_link(src) {
    return link(src, 'download');
}

// Generate /delete links
function delete_link(src) {
    return link(src, 'delete');
}

/********************************************************************
 * Set up jQuery plugins
 *******************************************************************/

// Set up the file upload button.
$('#picture-upload').fileUploadUI({
    uploadTable: $('#picture-bar'),
    cancelSelector: ".picture-upload-cancel",
    sequentialUploads: true,
    buildUploadRow: function(files, index, handler) {
        // Returns an <li> suitable for inserting into the jCarousel,
        //  containing a loading animation and a box with a cancel button.
        return $('<li><span><a class="picture-upload-cancel tip" href="#"' +
            ' title="Cancel Upload"><img src="\/static\/icons\/cancel.png"'+
            ' alt="cancel" \/><\/a><\/span>' +
            '<img src="\/static\/icons\/loading.gif" alt="..."\/><\/li>');
    },
    buildDownloadRow: function(file) {
        // Returns an <li> suitable for inserting into the jCarousel,
        //  containing the image plus a little box with save/delete icons.
        if(file !== undefined) {
            return $('<li><span><a class="tip" title="Download" href="' +
                download_link(file.url) + '"><img src="' +
                '\/static\/icons\/disk.png" alt="Download" \/><\/a>' +
                '<a class="picture-delete tip" title="Delete" href="' +
                delete_link(file.url) + '"><img src="' +
                '\/static\/icons\/bin_closed.png" alt="Delete" \/><\/a>' +
                '<\/span><img class="picture-thumb" src="' + file.url +
                '.t.jpg"\/><\/li>"');
        } else {
            return;
        }
    },
    onError: function(event, files, index, xhr, handler) {
        alert("Error uploading file.");
    },
    beforeSend: function(event, files, index, xhr, handler, callBack) {
        // Get rid of any "no-pictures" message
        $('#no-pictures').fadeOut(400, function(){$(this).remove();});
        callBack();
    },
    addNode: function(parentNode, node, callBack) {
        // addNode overridden to call c.add() so the carousel updates properly
        if(parentNode) {
            var i = $('#picture-bar li').length + 1;
            var c = $('#picture-bar').data('jcarousel');
            console.log("adding a new node to index " + i);
            c.add(i, node[0]);
            c.size(i);
            c.scroll(c.last + 1);
            bind_thumbs();
        }
        if(typeof callBack === 'function') {
            callBack();
        }
    },
    replaceNode: function(oldNode, newNode, callBack) {
        // replaceNode also overridden so the carousel functions properly
        if(oldNode && newNode) {
            var c = $('#picture-bar').data('jcarousel');
            i = oldNode.attr('jcarouselindex');
            c.remove(i);
            c.add(i, newNode[0]);
            c.scroll(i);
            bind_thumbs();
        }
        if(typeof callBack === 'function') {
            callBack();
        }
    }
});

// Set up the file list carousel
$('#picture-bar').jcarousel();

// Set up tipsy for appropriate elements
$('.tip').tipsy();

// Make buttons out of buttons
$('button').button();
$('#zoom').button();

// Make pictures draggable
$('.image').draggable({revert: 'invalid', helper: 'clone'});

// ...and droppable
$('.image').droppable({
    tolerance: 'pointer',
    accept: '.image, .picture-thumb',
    activate: function(e, ui) {
        $(this).css('opacity', '.8');
    },
    deactivate: function(e, ui) {
        $(this).css('opacity', '1');
    },
    drop: function(e, ui) {
        var src = ui.draggable.attr('src');
        if(src.slice(-6) == '.t.jpg') {
            // A thumbnail got dropped, handle it appropriately
            $(this).attr('src', src.slice(0, -6));
            var h_src = src.slice(0, -6) + '.h.png';
            $(this).siblings().children().attr('src', h_src);
        } else {
            // It was an actual image
            $(this).attr('src', src);
            $(this).siblings().children().attr('src', src+'.h.png');
        }
    },
});

// Make the help window a dialog
$('#help').dialog({
    autoOpen: false,
    title: "Help",
    modal: true,
    width: 500
});

/********************************************************************
 * Bind event handlers
 *******************************************************************/

// Bind the delete icons to submit an AJAX deletion request, then fade out
// and delete themselves from the picture bar. If the current image is
// the one just deleted, reset to first image.
$('.picture-delete').live('click', function(e) {
    // Stop the link being clicked and prevent the picture beneath getting the
    //  event.
    e.preventDefault();
    e.stopPropagation();
    
    // Check what we're deleting to see if we need to swap out the display
    //  images.
    src = $(this).parent().siblings().attr('src')
    l_src = $('#l-image').attr('src');
    if(l_src == src.slice(0, -6)) {
        new_src = $('#picture-bar').children().children(':eq(1)').attr('src');
        if(new_src.slice(0, -6) == l_src) {
            if($('#picture-bar').children().children().length > 3) {
                new_src = $('#picture-bar').children().
                    children(':eq(3)').attr('src');
            } else {
                new_src = "/static/icons/picture.png.t.png";
            }
        }
        set_display(new_src);
    }

    // Fire off the AJAX request
    $.get($(this).attr('href'));
    $(this).parent().parent().fadeOut(400, function(){
        // Once faded out, remove from carousel and update it
        // Updating the carousel involves detaching all images,
        // resetting it, then readding all the images one by one
        // to get the IDs sorted. eurgh!
        var c = $('#picture-bar').data('jcarousel');
        $(this).remove();
        var pics = $('#picture-bar li');
        pics.detach();
        c.reset();
        pics.each(function(i,e){$('#picture-bar').jcarousel('add',i + 1,e);});
        $('#picture-bar').jcarousel('size', pics.length);
        bind_thumbs();
        check_for_no_pictures();
    });
});


// Bind the reset link
$('#reset-link').click(function(e) {
    e.preventDefault();
    $.get("/reset", null, function() { refresh_pictures(); });
});

// Bind each photo to load them onto the display panes
$('.picture-thumb').live('click', function() {
    set_display($(this).attr('src'));
});

// Bind clicking on l-image to enable jCrop
$('#l-image').live('click', function() {
    //jcrop_api = $.Jcrop('#l-image', {boxWidth: 500, boxHeight: 500});
});

// Bind zoom button
$('#zoom-label').click(function() {
    if($("#zoom").attr('checked')) {
        remove_zoom();
    } else {
        apply_zoom();
    }
});

// Bind "copy left to right" button
$('#l2r').click(function() {
    $('#r-image').attr('src', $('#l-image').attr('src'));
    $('#r-image-h').attr('src', $('#l-image-h').attr('src'));
});

// Bind "copy right to left" button
$('#r2l').click(function() {
    $('#l-image').attr('src', $('#r-image').attr('src'));
    $('#l-image-h').attr('src', $('#r-image-h').attr('src'));
});

// Bind "Download image to PC" button
$('#download').click(function() {
    location.href = download_link($('#r-image').attr('src'));
});

// Bind "Help?" link
$('#show_help').click(function(e) {
    e.preventDefault();
    $('#help').dialog('open');
});

/********************************************************************
 * Code to be executed at startup
 *******************************************************************/

// Get the first pictures
refresh_pictures();
