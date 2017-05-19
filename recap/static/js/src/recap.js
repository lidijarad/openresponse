/* Javascript for RecapXBlock. */
function RecapXBlock(runtime, element, data) {
	$(function ($) {
		var recap_cmd = '#' + data.recap_cmd_id;
		var recap_answers = '#' + data.recap_answers_id;
		var recap_editor = '#' + data.recap_editor_id;

		$(recap_cmd).click(function() {

			var questions = [];
			var chunks = [];

			$(recap_answers).find('.recap_question').each(function() {
				questions.push($(this))
			});

			$(recap_answers).find('.recap_answer').each(function() {
				chunks.push($(this));
			});

			questions.sort(function(field_a, field_b) {
				return field_a.attr("id") < field_b.attr("id")
			});

			chunks.sort(function(field_a, field_b) {
				return field_a.attr("id") < field_b.attr("id")
			});

      // Get htmlInner from chunks, and split chunks with <p></p>
      var chunk_lines = [];

      chunks.forEach(function(chunk, index) {
        var chunk_html = document.getElementById('a' + index.toString()).innerHTML;
        var position = 3500;
        var add_line = 3500;
        var previous_position = 0;
        var new_element = '';

        // Check if there are page breaks
        if (chunk_html.length > position) {

          while ( position < chunk_html.length ) {
            var b = '<p></p>';
            new_element += [chunk_html.slice(previous_position, position), b].join('');
            position += add_line;
            previous_position += add_line;
          }

          if (new_element != chunk_html) {
            new_element += [chunk_html.slice(previous_position)].join('')
          }          
        } else {
          new_element = document.getElementById('a' + index.toString()).innerHTML;
        }
        var sub_chunks = new_element.split('<p></p>');
        var sub_chunk_lines = [];

        sub_chunks.forEach(function(sub_chunk, index2) {
          var lines = sub_chunk.length / 80;
          var lines_mod = sub_chunk.length % 80;

          if ( lines_mod != 0) {
                  lines +=1
          }
          sub_chunk_lines.push([sub_chunk, lines])
        })
        chunk_lines.push(sub_chunk_lines);
      })
	
			var blocks = []
			questions.forEach(function(question, index) {
				blocks.push([document.getElementById('q' + index.toString()).innerHTML, chunk_lines[index]])
			})
	
			var element = '';
			var lines = 0;
			for (var i=0; i < blocks.length; i++) {
				element += '<p>' + blocks[i][0] + '</p><p></p>'
				lines += 2;
				element += '<div class="recap_answer">';
				var chunks = blocks[i][1];
				for (var j=0; j < chunks.length; j++ ) {
					var chunk = chunks[j]
					lines += chunk[1]
					if (lines >= 48) { // the PDF will have a maximum of 48 lines
						lines = 0;
						element += '<div class="html2pdf__page-break"></div>';
					}
					element += chunk[0] + '<p></p>';
					lines += 1;
				}
				element += '</div>'
				element += '<div class="html2pdf__page-break"></div>'
			}

			html2pdf(element, {
			  margin: 1,
			  filename: 'myfile.pdf',
			  image: { type: 'jpeg',quality: 0.98 },
			  html2canvas: { dpi: 192, letterRendering: true },
			  jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
			}, function(pdf) {});
		});
	});
}
