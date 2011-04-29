// Pyph
// A simple photo editor
// Copyright 2011 Adam Greig
// CC-BY 2.0 UK:England & Wales

$('#picture-upload').fileUploadUI({
    uploadTable: $('#picture-bar'),
    cancelSelector: ".picture-upload-cancel",
    buildUploadRow: function(files, index, handler) {
        return $('<div class="picture-thumb">' +
            '<img src="\/static\/css\/loading.gif" alt="..." \/>' +
            '<img src="\/static\/icons\/cancel.png" alt="cancel"' +
            ' class="picture-upload-cancel" \/>' +
            '<\/div>');
    },
    buildDownloadRow: function(file) {
        if(file !== undefined) {
            return $('<div class="picture-thumb">' +
                '<img src="' + file.thumb + '" \/>' +
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

$('.picture-error').live('click', function() {
    $(this).parent().fadeOut(400, function(){
        $(this).remove();
        if($('.picture-thumb').length == 0) {
            $('#picture-bar').append(
                "<span id='no-pictures'>No pictures yet. Upload one!<\/span>");
        }
    });
});

$('.picture-delete').live('click', function(e) {
    $(this).parent().fadeOut(400, function(){
        $(this).remove();
        if($('.picture-thumb').length == 0) {
            $('#picture-bar').append(
                "<span id='no-pictures'>No pictures yet. Upload one!<\/span>");
        }
    });
    e.preventDefault();
});
