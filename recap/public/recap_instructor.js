
/* Javascript for RecapDashboard. */
(
    function RecapDashboard(runtime, element, data) {
        
        // Get the date for the pdf file name

        current_date = new Date();
        month = current_date.getMonth() + 1;
        pdf_name = ''
        pdf_name =  String(current_date.getDate()) + '/' + String(month) + '/' + String(current_date.getFullYear());

        // Paginate users using jquery

        var totalRows = $('#recap-table').find('tbody tr:has(td)').length;
        var recordPerPage = 10;
        var totalPages = Math.ceil(totalRows / recordPerPage);
        var $pages = $('<br/><div class="recap-page-wrapper" id="pages"></div>');
        for (i = 0; i < totalPages; i++) {
            $('<span class="pageNumber">&nbsp;' + (i + 1) + '</span>').appendTo($pages);
        }

        $pages.appendTo('#recap-table');

        $('.pageNumber').hover(
            function() {
                $(this).addClass('focus');
            },
            function() {
                $(this).removeClass('focus');
            }
        );

        $('#recap-table').find('tbody tr:has(td)').hide();
        var tr = $('#recap-table').find('tbody tr:has(td)');
        for (var i = 0; i <= recordPerPage - 1; i++) {
          $(tr[i]).show();
        }
        $('.pageNumber').click(function(event) {
          $('.recap-page-wrapper span').removeClass('active');
          $(this).addClass('active');
          $('#recap-table').find('tbody tr:has(td)').hide();
            var nBegin = ($(this).text() - 1) * recordPerPage;
            var nEnd = $(this).text() * recordPerPage - 1;
            for (var i = nBegin; i <= nEnd; i++) {
              $(tr[i]).show();
            }
        });  
 
        // Download pdf asynchronously using html2pdf library

        $('.recap-download-btn').click(function(event){
            event.preventDefault();
            event.stopImmediatePropagation()
            var noteFormUrl;
            console.log('click')
            var pdf_element_id = $(this).closest('td').prev('.ans').attr('id');
            noteFormUrl = $('.recap-instructor-form').attr('action');
            $('#lean_overlay').fadeToggle();
            $('.recap-loader').show();
            $.ajax({
                url: noteFormUrl,
                method: 'POST',
                data: JSON.stringify({ 'user_id': pdf_element_id}) ,
                success: function(data) {
                    $('.recap-loader').hide();
                    $('#lean_overlay').fadeToggle();
                    pdf_element = data['html'];
                    console.log('html', pdf_element);
                    if (pdf_element.indexOf('Nothing to recap') !== -1) {
                        alert("The user has not submitted all their answers.")
                    } else {
                        file_name = pdf_name + '_' + String(data['user_name']) + '.pdf'
                        html2pdf(pdf_element, {
                            margin: [0.8, 1, 0.5, 1],
                            filename: file_name,
                            image: { type: 'jpeg',quality: 0.98 },
                            html2canvas: { dpi: 192, letterRendering: true },
                            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                       }, function(pdf) {})
                    }
                }

            });
        });

    }
)
();
                     
