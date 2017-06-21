
/* Javascript for RecapDashboard. */
(
    function RecapDashboard(runtime, element, data) {

         $('.download_answer').click(function(event) {
            var pdf_element = "TEST"
            html2pdf(pdf_element, {
              margin: [0.8, 1, 0.5, 1],
              filename: 'testInstructor.pdf',
              image: { type: 'jpeg',quality: 0.98 },
              html2canvas: { dpi: 192, letterRendering: true },
              jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            }, function(pdf) {});
        });
    }
)
();