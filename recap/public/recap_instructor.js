
/* Javascript for RecapDashboard. */
(
    function RecapDashboard(runtime, element, data) {
        
        current_date = new Date();
        month = current_date.getMonth() + 1;
        pdf_name = ''
        pdf_name = 'recap' + String(current_date.getDate()) + '/' + String(month) + '/' + String(current_date.getFullYear()) + '.pdf';  

        // Try add pagination

        var totalRows = $('#recap-table').find('tbody tr:has(td)').length;
        var recordPerPage = 5;
        var totalPages = Math.ceil(totalRows / recordPerPage);
        var $pages = $('<div id="pages"></div>');
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

        $('table').find('tbody tr:has(td)').hide();
        var tr = $('table tbody tr:has(td)');
        for (var i = 0; i <= recordPerPage - 1; i++) {
          $(tr[i]).show();
        }
        $('span').click(function(event) {
          $('#recap-table').find('tbody tr:has(td)').hide();
            var nBegin = ($(this).text() - 1) * recordPerPage;
            var nEnd = $(this).text() * recordPerPage - 1;
            for (var i = nBegin; i <= nEnd; i++) {
              $(tr[i]).show();
            }
        });  


        $('.download_answer').click(function(event) {
            
            var pdf_element = $(this).closest('td').prev('.ans').html();

            html2pdf(pdf_element, {
              margin: [0.8, 1, 0.5, 1],
              filename: pdf_name,
              image: { type: 'jpeg',quality: 0.98 },
              html2canvas: { dpi: 192, letterRendering: true },
              jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            }, function(pdf) {});
        });
    }
)
();
