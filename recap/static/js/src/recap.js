/* Javascript for RecapXBlock. */
function RecapXBlock(runtime, element) {
	$(function ($) {
 		$('#recap_cmd').click(function () {
 				var doc = new jsPDF('p', 'pt', 'letter');
				var specialElementHandlers = {
					'#recap_editor': function(element, renderer){
						return true;
					}
				};
				doc.fromHTML($('#recap_answers').get(0), 30, 20, {
					'elementHandlers': specialElementHandlers,
					'width': 550,
					'pagesplit': true,
					'margin': 1
				});
				doc.save('recap.pdf')
		});
	});
}
