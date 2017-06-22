
/* Javascript for RecapDashboard. */
(
    function RecapDashboard(runtime, element, data) {
        
        current_date = new Date();
        month = current_date.getMonth() + 1;
        pdf_name = ''
        pdf_name = 'recap' + String(current_date.getDate()) + '/' + String(month) + '/' + String(current_date.getFullYear()) + '.pdf';  

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
