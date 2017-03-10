/* Javascript for StudioEditableXBlockMixin. */
function StudioEditableXBlockMixin(runtime, element) {
    "use strict";
    
    var fields = [];
    var tinyMceAvailable = (typeof $.fn.tinymce !== 'undefined'); // Studio includes a copy of tinyMCE and its jQuery plugin
    var datepickerAvailable = (typeof $.fn.datepicker !== 'undefined'); // Studio includes datepicker jQuery plugin

    $(element).find('.field-data-control').each(function() {
        var $field = $(this);
        var $wrapper = $field.closest('li');
        var $resetButton = $wrapper.find('button.setting-clear');
        var type = $wrapper.data('cast');
        fields.push({
            name: $wrapper.data('field-name'),
            isSet: function() { return $wrapper.hasClass('is-set'); },
            hasEditor: function() { return tinyMceAvailable && $field.tinymce(); },
            val: function() {
                var val = $field.val();
                // Cast values to the appropriate type so that we send nice clean JSON over the wire:
                if (type == 'boolean')
                    return (val == 'true' || val == '1');
                if (type == "integer")
                    return parseInt(val, 10);
                if (type == "float")
                    return parseFloat(val);
                if (type == "generic" || type == "list" || type == "set") {
                    val = val.trim();
                    if (val === "")
                        val = null;
                    else
                        val = JSON.parse(val); // TODO: handle parse errors
                }
                return val;
            },
            removeEditor: function() {
                $field.tinymce().remove();
            }
        });
        var fieldChanged = function() {
            // Field value has been modified:
            $wrapper.addClass('is-set');
            $resetButton.removeClass('inactive').addClass('active');
        };
        $field.bind("change input paste", fieldChanged);
        $resetButton.click(function() {
            $field.val($wrapper.attr('data-default')); // Use attr instead of data to force treating the default value as a string
            $wrapper.removeClass('is-set');
            $resetButton.removeClass('active').addClass('inactive');
        });
        if (type == 'html' && tinyMceAvailable) {
            tinyMCE.baseURL = baseUrl + "/js/vendor/tinymce/js/tinymce";
            $field.tinymce({
                theme: 'modern',
                skin: 'studio-tmce4',
                height: '200px',
                formats: { code: { inline: 'code' } },
                codemirror: { path: "" + baseUrl + "/js/vendor" },
                convert_urls: false,
                plugins: "link codemirror",
                menubar: false,
                statusbar: false,
                toolbar_items_size: 'small',
                toolbar: "formatselect | styleselect | bold italic underline forecolor wrapAsCode | bullist numlist outdent indent blockquote | link unlink | code",
                resize: "both",
                setup : function(ed) {
                    ed.on('change', fieldChanged);
                }
            });
        }

        if (type == 'datepicker' && datepickerAvailable) {
            $field.datepicker('destroy');
            $field.datepicker({dateFormat: "m/d/yy"});
        }
    });

    $(element).find('.wrapper-list-settings .list-set').each(function() {
        var $optionList = $(this);
        var $checkboxes = $(this).find('input');
        var $wrapper = $optionList.closest('li');
        var $resetButton = $wrapper.find('button.setting-clear');

        fields.push({
            name: $wrapper.data('field-name'),
            isSet: function() { return $wrapper.hasClass('is-set'); },
            hasEditor: function() { return false; },
            val: function() {
                var val = [];
                $checkboxes.each(function() {
                    if ($(this).is(':checked')) {
                        val.push(JSON.parse($(this).val()));
                    }
                });
                return val;
            }
        });
        var fieldChanged = function() {
            // Field value has been modified:
            $wrapper.addClass('is-set');
            $resetButton.removeClass('inactive').addClass('active');
        };
        $checkboxes.bind("change input", fieldChanged);

        $resetButton.click(function() {
            var defaults = JSON.parse($wrapper.attr('data-default'));
            $checkboxes.each(function() {
                var val = JSON.parse($(this).val());
                $(this).prop('checked', defaults.indexOf(val) > -1);
            });
            $wrapper.removeClass('is-set');
            $resetButton.removeClass('active').addClass('inactive');
        });
    });

    var studio_submit = function(data) {
        var handlerUrl = runtime.handlerUrl(element, 'submit_studio_edits');
        runtime.notify('save', {state: 'start', message: gettext("Saving")});
        $.ajax({
            type: "POST",
            url: handlerUrl,
            data: JSON.stringify(data),
            dataType: "json",
            global: false,  // Disable Studio's error handling that conflicts with studio's notify('save') and notify('cancel') :-/
            success: function(response) { runtime.notify('save', {state: 'end'}); }
        }).fail(function(jqXHR) {
            var message = gettext("This may be happening because of an error with our server or your internet connection. Try refreshing the page or making sure you are online.");
            if (jqXHR.responseText) { // Is there a more specific error message we can show?
                try {
                    message = JSON.parse(jqXHR.responseText).error;
                    if (typeof message === "object" && message.messages) {
                        // e.g. {"error": {"messages": [{"text": "Unknown user 'bob'!", "type": "error"}, ...]}} etc.
                        message = $.map(message.messages, function(msg) { return msg.text; }).join(", ");
                    }
                } catch (error) { message = jqXHR.responseText.substr(0, 300); }
            }
            runtime.notify('error', {title: gettext("Unable to update settings"), message: message});
        });
    };

    // var array = Array();
    // var x = 0;
    // $(function ($) {
    //     $('#addButton').click(function(eventObject) {
    //         console.log('hi')
            
    //         array[x] = $('#xblock-list').val();
    //         x++;
    //         $('#xblock-list').val("");
    //         console.log(array)
    //         var handlerUrl = runtime.handlerUrl(element, "get_xblocks_async");
    //         var xblock_list = array;
    //         console.log(xblock_list)
    //         eventObject.preventDefault();
    //         $.ajax({
    //             type: "POST",
    //             url: handlerUrl,
    //             data: JSON.stringify({"xblock_list": xblock_list}),
    //             success: function(data){
    //                 console.log(data)
    //             }
    //         });

    //     });
    // });
    
    

    $(function ($) {

        // Count all the number of items in the Xblock list
        var counter = 0;
        $(element).find('.xblock-list-item').each(function (i) {
           
           counter++;
           console.log(counter)
        });
        console.log(counter)

        $("#add-btn").click(function () {
            var newTextBoxDiv = $(document.createElement('div')).attr("id", 'TextBoxDiv' + counter+1);
            newTextBoxDiv.after().html('<label>Xblock #'+ (counter+1) + ' : </label>' +
                '<div class="xblock-list-item"><input type="text"' + '" id="xblock-id' + (counter+1) + '" value=""/>' +
                '<input type="text"' + '" id="xblock-type' + (counter+1) + '" value=""/></div>'
                );

            newTextBoxDiv.appendTo("#TextBoxesGroup");
            counter++;

        });


    });

    // On submit I need to somehow send my data and save it to the correct field value
    // Some thing like this

    


    $('.save-button', element).bind('click', function(e) {
        e.preventDefault();
        var values = {};
        var notSet = []; // List of field names that should be set to default values

        var xblockList = [];

        $(element).find('.xblock-list-item').each(function (i) {
           console.log(i)

           console.log($('#xblock-id'+(i+1)).val());
           console.log($('#xblock-type'+(i+1)).val());

           var xblockID = $('#xblock-id'+(i+1)).val();

           var xblockType = $('#xblock-type'+(i+1)).val();

           xblockList.push([xblockID, xblockType]);
        });

        console.log(xblockList)
        for (var i in fields) {
            var field = fields[i];
            if (field.isSet()) {
                values[field.name] = field.val();
            } else {
                notSet.push(field.name);
            }
            // Remove TinyMCE instances to make sure jQuery does not try to access stale instances
            // when loading editor for another block:
            if (field.hasEditor()) {
                field.removeEditor();
            }
        }
        values['xblock_list'] = xblockList;
        studio_submit({values: values, defaults: notSet});
    });

    $(element).find('.cancel-button').bind('click', function(e) {
        // Remove TinyMCE instances to make sure jQuery does not try to access stale instances
        // when loading editor for another block:
        for (var i in fields) {
            var field = fields[i];
            if (field.hasEditor()) {
                field.removeEditor();
            }
        }
        e.preventDefault();
        runtime.notify('cancel', {});
    });
}