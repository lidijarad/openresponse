/* Javascript for RecapDashboard. */
(
    function RecapDashboard(runtime, element, data) {
        var current_date = new Date();
        var month = current_date.getMonth() + 1;
        var pdf_name =  String(current_date.getDate()) + '/' + String(month) + '/' + String(current_date.getFullYear());
        var url = $('.recap-select').attr('action')
        
        var langMap = {
          'en': {
            path: 'English',
            mods: {
              sLengthMenu: "Display _MENU_ records per page - custom test"
            }
          },
          'es-419': {
            path: 'Spanish',
            mods: {
              sLengthMenu: "Mostrar _MENU_ registros - algo muy especial..."
            }
          },
          'es': {
            path: 'Spanish',
            mods: {
              sLengthMenu: "Mostrar _MENU_ registros - algo muy especial..."
            }
          },
          'cy': {
            path: 'Welsh',
            mods: {
              sLengthMenu: ""
            }
          },
          'fr': {
            path: 'French',
            mods: {
              sLengthMenu: ""
            }
          },
          'ar': {
            path: 'Arabic',
            mods: {
              sLengthMenu: ""
            }
          }
        };

        function getLanguage() {
          var lang = $('.recap-nav-ul').attr('id');
          var result = null;
          var path = '//cdn.datatables.net/plug-ins/1.10.13/i18n/';
          $.ajax({
            async: false,  
            url: path + langMap[lang].path + '.json',
            success: function(obj) {
              result = $.extend({}, obj, langMap[lang].mods)
            }
          })
          return result
        }


        var download_text = $('#recap-heading-download').text()
        var table = $('#recap-table').DataTable({
            language: getLanguage(),
            ajax: {
                url: url,
                processing: true,
                type: "POST",
                data : function ( d ) {
                    return JSON.stringify({"recap_id": $('#recap-options option:selected').index()});
                },
                dataType : "json",
                contentType : "application/json; charset=utf-8",
            },
            columns: [
                {
                  data: "username",   
                },
                {
                  data: "email",
                },
                {
                  "defaultContent" : "<button>" + download_text + "</button>"
                },
                {
                  "data": "id", "visible": false
                }
            ],
        });

        function SpinnerCallback(shouldShowSpinner, cb) {
            if (shouldShowSpinner) {
                $('#lean_overlay').show();
                $('.recap-loader').show('fast', 'linear', function() { cb()});
            } else {
                $('#lean_overlay').hide();
                $('.recap-loader').hide('fast', 'linear', function() { cb()});
            }
        }

        $('#recap-options').change(function() {
            var selected = $('#recap-options option:selected').index();
            table.ajax.reload(); 
        });

        $('#recap-table tbody').on( 'click', 'button',function(event){
            event.preventDefault();
            event.stopImmediatePropagation()
            var selected = $('#recap-options option:selected');
            var selected_id = selected.attr('id');
            var document_heading = selected.text()
            var noteFormUrl;
            var currentRow = $(this).closest("tr");
            var data = $('#recap-table').DataTable().row(currentRow).data();
            var user_id = data['id']
            noteFormUrl = $('.recap-instructor-form').attr('action');
            var my_data = { 'user_id': user_id, 'these_blocks': selected_id, 'document_heading': document_heading}
            SpinnerCallback(true, function() {
                $.ajax({
                    url: noteFormUrl,
                    method: 'POST',
                    data: JSON.stringify(my_data),
                    success: function(data) {
                        pdf_element = data['html'];
                        if (pdf_element.indexOf('Nothing to recap') !== -1) {
                            SpinnerCallback(false, function() {
                                alert("The user has not submitted all their answers.")
                            });
                        } else {
                            file_name = pdf_name + '_' + String(data['user_name']) + '.pdf'
                            html2pdf(pdf_element, {
                                margin: [0.8, 1, 0.5, 1],
                                filename: file_name,
                                image: { type: 'jpeg',quality: 0.98 },
                                html2canvas: { dpi: 192, letterRendering: true },
                                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                           }, function(pdf) {
                               SpinnerCallback(false, function () {});
                           })
                        }
                    }
                });
            });
        })
    }
)();
