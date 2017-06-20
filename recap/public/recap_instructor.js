
/* Javascript for RecapDashboard. */
(
    function RecapDashboard(runtime, element, data) {
        var runtime = {
            handlerUrl: function(block, handlerName, suffix, query) {
                suffix = typeof suffix !== 'undefined' ? suffix : '';
                query = typeof query !== 'undefined' ? query : '';
                var usage = $(block).data('usage');
                var url_selector = $(block).data('url_selector');
                baseUrl = window[url_selector];

      // studentId and handlerBaseUrl are both defined in block.html
                return (baseUrl + usage +
                            "/" + handlerName +
                            "/" + suffix +
                   // "?student=" + studentId +
                            "&" + query);
            }
        };

         $('#user_3').click(function(event) {
            //console.log('hiii');
            //var handlerUrl = runtime.handlerUrl(element, 'generate_pdf');
            //var answer_html = $('#student-input').val();
            //var recap_answers = "THIS IS MY TEST STRING";
            //console.log(recap_answers)
            //event.preventDefault();
            //$.ajax({
            //    type: "POST",
            //    url: handlerUrl,
            //    data: JSON.stringify({"recap_answers": recap_answers}),
            //    success: function(data){
            //    console.log(data)
            //    }
            //});
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