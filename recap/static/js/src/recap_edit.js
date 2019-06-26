/* Javascript for StudioEditableXBlockMixin. */
function StudioEditableXBlockMixin(runtime, element) {
    "use strict";

    var fields = [];
    var tinyMceAvailable = (typeof $.fn.tinymce !== 'undefined'); // Studio includes a copy of tinyMCE and its jQuery plugin
    var datepickerAvailable = (typeof $.fn.datepicker !== 'undefined'); // Studio includes datepicker jQuery plugin
    var htmlResult, cssResult;

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
                    script_url: "" + baseUrl + "/js/vendor/tinymce/js/tinymce/tinymce.full.min.js",
                    theme: "modern",
                    skin: 'studio-tmce4',
                    schema: "html5",
                    convert_urls: false,
                    formats: {
                      code: {
                        inline: 'code'
                      }
                    },
                    visual: false,
                    plugins: "textcolor, link, image, codemirror",
                    codemirror: {
                      path: "" + baseUrl + "/js/vendor"
                    },
                    image_advtab: true,
                    toolbar: "formatselect | fontselect | bold italic underline forecolor wrapAsCode | bullist numlist outdent indent blockquote | link unlink image | code",
                    block_formats: interpolate("%(paragraph)s=p;%(preformatted)s=pre;%(heading3)s=h3;%(heading4)s=h4;%(heading5)s=h5;%(heading6)s=h6", {
                      paragraph: gettext("Paragraph"),
                      preformatted: gettext("Preformatted"),
                      heading3: gettext("Heading 3"),
                      heading4: gettext("Heading 4"),
                      heading5: gettext("Heading 5"),
                      heading6: gettext("Heading 6")
                    }, true),
                    width: '100%',
                    height: '400px',
                    menubar: false,
                    statusbar: false,
                    valid_children: "+body[style]",
                    valid_elements: "*[*]",
                    extended_valid_elements: "*[*]",
                    invalid_elements: "",
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

    $(function ($) {

        // Count all the number of items in the Xblock list
        var counter = 0;
        var inputHtmlFile= $('#xb-field-edit-html_file');
        var inputCssFile= $('#xb-field-edit-css_file');
        $(element).find('.xblock-list-item').each(function (i) {
           counter++;
        });

        // Add more XBlocks

        $("#add-btn").on('click', function () {
            var newTextBoxDiv = $(document.createElement('div')).attr("id", 'TextBoxDiv' + (counter+1));
            newTextBoxDiv.append(
                '<div class="xblock-list-item">'+
                '<input type="text"' + '" id="xblock-id' + (counter+1) + '" value="" />' +
                '<select id="xblock-type{{forloop.counter}}"' + '" id="xblock-type' + (counter+1) + '">' +
                    '<option value="freetextresponse">Free Text Response</option>' +
                     '<option value="problem">Problem</option>' +
                     '<option value="activetable">Active Table</option>' +
                '</select>' +
                '<button type="button" class="remove" style="padding: 8px 10px;">-</button>' +
                '</div>'
            );

            newTextBoxDiv.on('click', '.remove', function (e) {

                var target = $(e.target);
                var parent = target.parent();
                parent.hide("fast", function() {
                    var grandparent = $(this).parent();
                    $(this).remove()
                    grandparent.remove();
                });
            });
            newTextBoxDiv.appendTo("#TextBoxesGroup");
            counter++;
        });
        htmlResult = $('#xb-field-download-html_file').attr("value");
        cssResult = $('#xb-field-download-css_file').attr("value");
        inputHtmlFile.change(readInputFile);
        inputCssFile.change(readInputFile);
    });

    $(".remove").on('click', function (e) {

        var target = $(e.target);
        var parent = target.parent();

        parent.hide("fast", function() {
            var grandparent = $(this).parent();
            $(this).remove()
            grandparent.remove();
        });

    });

    $('.save-button', element).bind('click', function(e) {
        e.preventDefault();
        var values = {};
        var notSet = []; // List of field names that should be set to default values
        var xblockList = [];

        $(element).find('.xblock-list-item').each(function (i) { //Add XBlock-list to fields array
            var xblockID, xblockType;
            $(this).find('input,select').each(function(index, value) {
                if (index == 0) {
                    xblockID = $(this).val();
                }
                else if (index == 1) {
                    xblockType = $(this).val();
                }
            })
             xblockList.push([xblockID, xblockType])
        });
        for (var i in fields) {
            var field = fields[i];
            if (field.isSet() && field.name == 'html_file') {
                values[field.name] = htmlResult;
            } else if (field.isSet() && field.name == 'css_file') {
                values[field.name] = cssResult;
            } else if (field.isSet()) {
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
        values['xblock_list'] = xblockList; //Add XBlock-list to fields array
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

    function readInputFile(input){
        var file = input.target.files[0];
        var targetId = input.target.id;
        var reader = new FileReader();
        if (file) {
            reader.onload = function(e) {
                if (targetId == 'xb-field-edit-html_file'){
                    htmlResult = e.target.result;
                } else {
                    cssResult = e.target.result;
                }
            };
            reader.readAsText(file);
        }

    }
}
