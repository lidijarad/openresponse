/* Javascript for RecapXBlock. */
function RecapXBlock(runtime, element, data) {
	$(function ($) {
		var recap_cmd = '#' + data.recap_cmd_id;
		var recap_answers = '#' + data.recap_answers_id;
		var recap_editor = '#' + data.recap_editor_id;

		current_date = new Date();
		month = current_date.getMonth() + 1;
		pdf_name = ''
		pdf_name = 'recap' + String(current_date.getDate()) + '/' + String(month) + '/' + String(current_date.getFullYear()) + '.pdf';  

		$(recap_cmd).click(function() {

     var pdf_element = document.getElementById(String(data.recap_answers_id)).innerHTML;


			html2pdf(pdf_element, {
			  margin: [1, 1, 0.5, 1],
			  filename: pdf_name,
			  image: { type: 'jpeg',quality: 0.98 },
			  html2canvas: { dpi: 192, letterRendering: true },
			  jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
			}, function(pdf) {});
		});
	});
}
