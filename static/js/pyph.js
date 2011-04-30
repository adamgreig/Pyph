// Pyph
// A simple photo editor
// Copyright 2011 Adam Greig
// CC-BY 2.0 UK:England & Wales

// Set up the file upload button.
$('#picture-upload').fileUploadUI({
    uploadTable: $('#picture-bar'),
    cancelSelector: ".picture-upload-cancel",
    sequentialUploads: true,
    buildUploadRow: function(files, index, handler) {
        return $('<div class="picture-thumb">' +
            '<img src="\/static\/icons\/loading.gif" alt="..." \/>' +
            '<img src="\/static\/icons\/cancel.png" alt="cancel"' +
            ' class="picture-upload-cancel" \/>' +
            '<\/div>');
    },
    buildDownloadRow: function(file) {
        if(file !== undefined) {
            return $('<div class="picture-thumb">' +
                '<img src="' + file.url + '.t.jpg" \/>' +
                '<a href="/delete/' + file.name + '" title="Delete"' +
                ' class="picture-delete">' +
                '<img src="\/static\/icons\/delete.png" alt="delete"\/>' +
                '<\/a><\/div>');
        } else {
            return $('<div class="picture-thumb">' +
                '<img src="\/static\/icons\/error.png" alt="error"' +
                ' title="Error uploading file. Click to hide."' +
                ' class="picture-error" \/>' +
                '<\/div>');
        }
    },
    onError: function(event, files, index, xhr, handler) {
        var newNode = $('<div class="picture-thumb">' +
            '<img src="\/static\/icons\/error.png" alt="error"' +
            ' title="Error uploading file. Click to hide."' +
            ' class="picture-error" \/>' +
            '<\/div>');
        handler.replaceNode(handler.uploadRow, newNode);
    },
    beforeSend: function(event, files, index, xhr, handler, callBack) {
        $('#no-pictures').fadeOut(400, function(){$(this).remove();});
        callBack();
    }
});

// Store a handle to the jcrop API so we can later delete instances
var jcrop_api;

// Check if any pictures are in the picture bar and if not add the
// no pictures message.
function check_for_no_pictures() {
    if($('.picture-thumb').length == 0) {
        $('#picture-bar').append(
            "<span id='no-pictures'>No pictures yet. Upload one!<\/span>"
        );
    }
}

// Bind the error icons to fade out and remove themselves when clicked.
$('.picture-error').live('click', function() {
    $(this).parent().fadeOut(400, function(){
        $(this).remove();
        check_for_no_pictures();
    });
});

// Bind the delete icons to submit an AJAX deletion request, then fade out
// and delete themselves from the picture bar. If the current image is
// the one just deleted, reset to first image.
$('.picture-delete').live('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    src = $(this).siblings()[0].src
    l_src = $('#l-image')[0].src;
    if(l_src == src.slice(0, -6)) {
        new_src = $('#picture-bar').children().children()[0].src;
        if(new_src.slice(0, -6) == l_src) {
            if($('#picture-bar').children().children().length > 2) {
                new_src = $('#picture-bar').children().children()[2].src;
            } else {
                new_src = "/static/icons/picture.png.t.png";
            }
        }
        set_display(new_src);
    }

    $.get($(this)[0].href);
    $(this).parent().fadeOut(400, function(){
        $(this).remove();
        check_for_no_pictures();
    });
});

// Given a thumbnail source, set the display images and histos
function set_display(src) {
    src = src.slice(0, -6);
    var src_h = src + ".h.png";
    
    if(jcrop_api !== undefined) {
        jcrop_api.destroy();
    }

    $('#l-image')[0].src = src;
    $('#r-image')[0].src = src;

    $('#l-image-h')[0].src = src_h;
    $('#r-image-h')[0].src = src_h;
}

// Fetch the starting items, removing the "No pictures" note if appropriate
function refresh_pictures() {
    $.getJSON("/upload", function(data) {
        $('#picture-bar').children().remove();
        if(data.files.length > 0) {
            $('#no-pictures').fadeOut(400, function(){$(this).remove();});
            var options = $('#picture-upload').fileUploadUI('option');

            $.each(data.files, function(index, file) {
                element = options.buildDownloadRow(file)[0];
                $('#picture-bar').append(element);
            });

            set_display($('#picture-bar').children().children()[0].src);
        } else {
            check_for_no_pictures();
        }
    });
}

// Bind the reset link
$('#reset-link').click(function(e) {
    e.preventDefault();
    $.get("/reset", null, function() { refresh_pictures(); });
});

// Bind each photo to load them onto the display panes
$('.picture-thumb').live('click', function() {
    set_display($(this).children()[0].src);
});

// Bind clicking on l-image to enable jCrop
$('#l-image').live('click', function() {
    //jcrop_api = $.Jcrop('#l-image', {boxWidth: 500, boxHeight: 500});
});

// Make buttons out of buttons
$('button').button();

// Set up tipsy for appropriate elements
$('.tip').tipsy();

// Get the first pictures
refresh_pictures();
