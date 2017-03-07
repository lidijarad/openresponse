/* Javascript for OpenResponseXBlock. */
function OpenResponseXBlock(runtime, element) {
	$(function ($) {

 		$('#cmd').click(function () {
 				var doc = new jsPDF('p', 'pt', 'letter');

				// We'll make our own renderer to skip this editor
				var specialElementHandlers = {
					'#editor': function(element, renderer){
						return true;
					}
				};

				// All units are in the set measurement for the document
				// This can be changed to "pt" (points), "mm" (Default), "cm", "in"
				doc.fromHTML($('#answers').get(0), 15, 15, {
					'elementHandlers': specialElementHandlers
				});

				doc.save('summary.pdf')
		}); 

	});
}
