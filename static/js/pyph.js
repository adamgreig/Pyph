// Pyph
// A simple photo editor
// Copyright 2011 Adam Greig
// Released under the simplified BSD license, see LICENSE
// ******************************************************************

/********************************************************************
 * Helper Functions
 * goto:func
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
                var element = options.buildDownloadRow(file)[0];
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
    var l = $('#l-image');
    var r = $('#r-image');
    l.detach();
    r.detach();
    $('#l-image-wrapper').children('#wrap').remove();
    $('#r-image-wrapper').children('#wrap').remove();
    $('#l-image-wrapper').prepend(l);
    $('#r-image-wrapper').prepend(r);
}

// Generate a link such as /delete/127.0.0.1/abcdef.jpg
function link(src, noun) {
    var parts = src.split('/');
    length = parts.length;
    return '/' + noun + '/' + parts[length - 2] + '/' + parts[length - 1];
}

// Put the coordinates from jCrop into the boxes
function crophandler(c) {
    $('#crop-x').attr('value', c.x);
    $('#crop-x2').attr('value', c.x2);
    $('#crop-y').attr('value', c.y);
    $('#crop-y2').attr('value', c.y2);
}

/********************************************************************
 * Set up jQuery plugins
 * goto:plugins
 *******************************************************************/

// Set up the file upload button.
$('#picture-upload').fileUploadUI({
    uploadTable: $('#picture-bar'),
    cancelSelector: ".picture-upload-cancel",
    sequentialUploads: true,
    dragDropSupport: false,
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
                link(file.url, 'download') + '"><img src="' +
                '\/static\/icons\/disk.png" alt="Download" \/><\/a>' +
                '<a class="picture-delete tip" title="Delete" href="' +
                link(file.url, 'delete') + '"><img src="' +
                '\/static\/icons\/bin_closed.png" alt="Delete" \/><\/a>' +
                '<\/span><img class="picture-thumb" src="' + file.url +
                '.t.jpg"\/><\/li>"');
        } else {
            // there was an error or something, so deal
            return false;
        }
    },
    onError: function(event, files, index, xhr, handler) {
        alert("Error uploading file. Check file size and format.");
        handler.uploadRow.remove();
        var pics = $('#picture-bar li');
        var c = $('#picture-bar').data('jcarousel');
        pics.detach();
        var index = c.first;
        c.scroll(0, false);
        c.reset();
        pics.each(function(i,e){$('#picture-bar').jcarousel('add',i + 1,e);});
        c.size(pics.length);
        c.scroll(index, false); 
        bind_thumbs();
        check_for_no_pictures();
        return false;
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
            c.add(i, node[0]);
            c.size(i);
            c.scroll(i, false);
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

// Make the help window a dialogue
$('#help').dialog({
    autoOpen: false,
    title: "Help",
    modal: true,
    width: 500
});

// Make the keyboard shortcuts window a dialogue
$('#keyboard-shortcuts').dialog({
    autoOpen: false,
    title: "Keyboard Shortcuts",
    modal: true,
    width: 500
});

/********************************************************************
 * Bind event handlers
 * goto:bind
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
        var index = c.first;
        c.reset();
        pics.each(function(i,e){$('#picture-bar').jcarousel('add',i + 1,e);});
        c.size(pics.length);
        c.scroll(index, false); 
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

// Bind zoom button
$('#zoom-label').click(function(e) {
    if($('.cloud-zoom').length) {
        remove_zoom();
    } else {
        apply_zoom();
    }
    e.stopPropagation();
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

// Bind "Save image to session" button
$('#save').click(function() {
    $.getJSON(link($('#r-image').attr('src'), 'save'), function(data) {
        if(data.url) {
            var options = $('#picture-upload').fileUploadUI('option');
            var element = options.buildDownloadRow(data)[0];
            var c = $('#picture-bar').data('jcarousel');
            var i = $('#picture-bar li').length + 1;
            c.add(i, element);
            c.size(i);
            c.scroll(i);
            bind_thumbs();
        }
    });
});

// Bind "Download image to PC" button
$('#download').click(function() {
    location.href = link($('#r-image').attr('src'), 'download');
});

// Bind "Help?" link
$('#show-help').click(function(e) {
    e.preventDefault();
    $('#help').dialog('open');
});

// Bind "Keyboard Shortcuts" link
$('#show-keyboard-shortcuts').click(function(e) {
    e.preventDefault();
    $('#keyboard-shortcuts').dialog('open');
});

// Bind toolpane close buttons
$('.toolpane-close').click(function() {
    if($(this).parent().is(':visible')) {
        $(this).parent().hide('blind');
    }
});

// Bind tool buttons to hide any open panes, stopping propagation if the
// button's own pane was the open one.
$('.tool').click(function(e) {
    if($('.toolpane:visible').length) {
        var tp = $(this).attr('id') + '-pane';
        var own = $('.toolpane:visible').attr('id') == tp;
        $('.toolpane:visible .toolpane-close').click();
        if(own) {
            e.stopImmediatePropagation();
        }
    }
});

/********************************************************************
 * Crop Tool
 * goto:crop
 *******************************************************************/

function click_crop_go() {
    $('#crop-go').click();
}

// Bind crop tool button
var jcrop_api;
$('#crop').click(function() {
    // Take off zoom if it's on, as it'l mess stuff up
    if($('#zoom').attr('checked')) {
        $('#zoom-label').click();
    }

    // Remove any old jCrop instances
    if(jcrop_api) { jcrop_api.destroy(); }

    // Make the images non-draggable
    $('#l-image').draggable('option', 'disabled', true);
    $('#l-image').droppable('option', 'disabled', true);
    
    // Slight hack to find the original image size
    $("<img />").attr('src', $('#l-image').attr('src')).load(function() {
        jcrop_api = $.Jcrop('#l-image', {
            trueSize: [this.width, this.height],
            onChange: crophandler,
            onSelect: crophandler,
            setSelect: [10, 10, 100, 100]
        });
        $('#crop-pane').show('blind');
    });
});

// Bind crop close button
$('#crop-pane .toolpane-close').click(function() {
    jcrop_api.destroy();
    $('#l-image').draggable('option', 'disabled', false);
    $('#l-image').droppable('option', 'disabled', false);
});

// Bind crop button itself
$('#crop-go').click(function() {
    var data = {
        'x': $('#crop-x').attr('value'),
        'y': $('#crop-y').attr('value'),
        'x2': $('#crop-x2').attr('value'),
        'y2': $('#crop-y2').attr('value')
    };
    $.post(link($('#l-image').attr('src'), 'crop'), data, function(d, s) {
        if(d.url) {
            $('#r-image').attr('src', d.url);
            $('#r-image-h').attr('src', d.url+'.h.png');
        }
    });
});

/********************************************************************
 * Resize Tool
 * goto:resize
 */

// Bind resize tool button
$('#resize').click(function() {
    $('#resize-pane').show('blind');
});

// Bind resize button
$('#resize-go').click(function() {
    var data = {
        'x': $('#resize-x').attr('value'),
        'y': $('#resize-y').attr('value'),
        'sf': $('#resize-sf').attr('value')
    };
    $.post(link($('#l-image').attr('src'), 'resize'), data, function(d, s) {
        if(d.url) {
            $('#r-image').attr('src', d.url);
            $('#r-image-h').attr('src', d.url+'.h.png');
        }
    });
});

/********************************************************************
 * Keyboard shortcuts
 * goto:keyboard
 *******************************************************************/

// z for zoom
$(document).bind('keypress', 'z', function(){$('#zoom-label').click();});

// l for copy left to right
$(document).bind('keypress', 'l', function(){$('#l2r').click();});

// h for copy right to left (vim-style hjkl nav)
$(document).bind('keypress', 'h', function(){$('#r2l').click();});

// s for save image to session
$(document).bind('keypress', 's', function(){$('#save').click();});

// d for download image
$(document).bind('keypress', 'd', function(){$('#download').click();});

// c for crop
$(document).bind('keypress', 'c', function(){$('#crop').click();});

// r for resize
$(document).bind('keypress', 'r', function(){$('#resize').click();});

// o for rotate
$(document).bind('keypress', 'o', function(){$('#rotate').click();});

// m for morph
$(document).bind('keypress', 'm', function(){$('#morph').click();});

// c for colour shift
$(document).bind('keypress', 'shift+c', function(){
    $('#colour-shift').click();});

// i for lighting shift
$(document).bind('keypress', 'shift+l', function(){
    $('#lighting-shift').click();});

// n for add noise
$(document).bind('keypress', 'n', function(){$('#add-noise').click();});

// f for filter
$(document).bind('keypress', 'f', function(){$('#filter').click();});

// e for enhance
$(document).bind('keypress', 'e', function(){$('#enhance').click();});

// ? for help
$(document).bind('keypress', 'shift+?', function(){$('#show-help').click();});

// k for keyboard shortcuts
$(document).bind('keypress', 'k', function(){
    $('#show-keyboard-shortcuts').click();});

// Escape for closing toolpanes
$(document).bind('keydown', 'esc', function(){
    $('.toolpane-close').click();
});


/********************************************************************
 * Code to be executed at startup
 * goto:exec
 *******************************************************************/

// Get the first pictures
refresh_pictures();
