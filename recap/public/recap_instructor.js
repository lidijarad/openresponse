
/* Javascript for RecapDashboard. */
(
    function RecapDashboard(runtime, element, data) {
        
        // Get the date for the pdf file name

        current_date = new Date();
        month = current_date.getMonth() + 1;
        pdf_name = ''
        pdf_name =  String(current_date.getDate()) + '/' + String(month) + '/' + String(current_date.getFullYear());

        $('#recap-table').DataTable();
        // Callback for showing and hiding spinner
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
            console.log('I was changed')
            console.log($(element))
            var url = $('.recap-select').attr('action');
            var selected_recap_index = $('#recap-options option:selected').index();
            var data = {'selected_recap_index' : selected_recap_index}
            $('#recap-table').hide()
            $.ajax({
                type: 'POST',
                url: url,
                data: JSON.stringify(data),
                dataType: 'json',
                success: function(data) {
                    $('#recap-table').html(data['html'])
                    $('#recap-table').DataTable();
                }
            });
        });
       

        // Download pdf asynchronously using html2pdf library

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
        });
    }
)
();
