/* Javascript for RecapDashboard. */
(
    function RecapDashboard(runtime, element, data) {
    var url = $('.recap-select').attr('action')
    var getRequest ={"id":-1,"filterName":"assetFilter"};
    getRequest =  JSON.stringify(getRequest);  
    var table = $('#example').DataTable( {
        ajax: {
            url: url,
            type: "POST",
            data : function ( d ) {
                return getRequest;
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
            }
        ],
        "columnDefs": [ {
            "targets": -1,
            "data": null,
            "defaultContent": "<button>Click!</button>"
        } ]
    });

    $('#example tbody').on( 'click', 'button', function () {
        var data = table.row( $(this).parents('tr') ).data();
        alert( data[0] +"'s email is: "+ data[ 1 ] );
    });

    $('.recap-download-btn').click(function(event){
            event.preventDefault();
            event.stopImmediatePropagation()
            var selected = $('#recap-options option:selected');
            var selected_id = selected.attr('id');
            var document_heading = selected.text()
            var noteFormUrl;
            var pdf_element_id = $(this).closest('td').prev('.ans').attr('id');
            noteFormUrl = $('.recap-instructor-form').attr('action');
            var my_data = { 'user_id': pdf_element_id, 'these_blocks': selected_id, 'document_heading': document_heading}
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
)
();
