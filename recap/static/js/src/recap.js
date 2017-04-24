/* Javascript for RecapXBlock. */
function RecapXBlock(runtime, element, data) {
	$(function ($) {
 		$('#' + data.recap_cmd_id).click(function () {
 				var doc = new jsPDF('p', 'pt', 'letter');
				doc.fromHTML($('#' + data.recap_answers_id).get(0), 30, 20, {
					'width': 550,
					'elementHandlers': {
						'#' + data.recap_editor_id: function(element, renderer){
							return true;
						}
					}
				}, function(){
					doc.save('recap.pdf')
				}, { top: 10, bottom: 10 });
		});
	});
}
