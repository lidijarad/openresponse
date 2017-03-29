/* Javascript for RecapXBlock. */
function RecapXBlock(runtime, element) {
	$(function ($) {
 		$('#recap_cmd').click(function () {
 				var doc = new jspdf('p', 'pt', 'letter');
				doc.fromHTML($('#recap_answers').get(0), 30, 20, {
					'width': 550,
					'elementHandlers': {
						'#recap_editor': function(element, renderer){
							return true;
						}
					}
				}, function(){
					doc.save('recap.pdf')
				}, { top: 10, bottom: 10 });
		});
	});
}
