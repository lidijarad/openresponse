/* Javascript for RecapXBlock. */
function RecapXBlock(runtime, element, data) {
	$(function ($) {
		var recap_cmd = '#' + data.recap_cmd_id;
		var recap_answers = '#' + data.recap_answers_id;
		var recap_editor = '#' + data.recap_editor_id;
 		$(recap_cmd).click(function () {
 				var doc = new jsPDF('p', 'pt', 'letter');
				doc.fromHTML($(recap_answers).get(0), 30, 20, {
					'width': 550,
					'elementHandlers': {
						recap_editor: function(element, renderer){
							return true;
						}
					}
				}, function(){
					doc.save('recap.pdf')
				}, { top: 10, bottom: 10 });
		});
	});
}
