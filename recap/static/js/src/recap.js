/* Javascript for RecapXBlock. */
function RecapXBlock(runtime, element) {
	$(function ($) {

 		$('#cmd').click(function () {
 				var doc = new jsPDF('p', 'pt', 'letter');

				// We'll make our own renderer to skip this editor
				var specialElementHandlers = {
					'#recap_editor': function(element, renderer){
						return true;
					}
				};

				doc.fromHTML($('#recap_answers').get(0), 20, 20, {
					'elementHandlers': specialElementHandlers,
					'width': 7.5
				});

				doc.save('summary.pdf')
		});

	});
}
