
/* Javascript for RecapDashboard. */
(
    function RecapDashboard(runtime, element, data) {
        
        window.XBlock = {
            initializeBlock: function(el){}
        };

        current_date = new Date();
        month = current_date.getMonth() + 1;
        pdf_name = ''
        pdf_name =  String(current_date.getDate()) + '/' + String(month) + '/' + String(current_date.getFullYear());

        // Try add pagination

        var totalRows = $('#recap-table').find('tbody tr:has(td)').length;
        var recordPerPage = 10;
        var totalPages = Math.ceil(totalRows / recordPerPage);
        var $pages = $('<br/><div class="recap-page-wrapper" id="pages"></div>');
        for (i = 0; i < totalPages; i++) {
            $('<span class="pageNumber">&nbsp;' + (i + 1) + '</span>').appendTo($pages);
        }

        $pages.appendTo('#recap-table');

        $('.pageNumber').hover(
            function() {
                $(this).addClass('focus');
            },
            function() {
                $(this).removeClass('focus');
            }
        );

        $('#recap-table').find('tbody tr:has(td)').hide();
        var tr = $('#recap-table').find('tbody tr:has(td)');
        for (var i = 0; i <= recordPerPage - 1; i++) {
          $(tr[i]).show();
        }
        $('.pageNumber').click(function(event) {
          $('.recap-page-wrapper span').removeClass('active');
          $(this).addClass('active');
          $('#recap-table').find('tbody tr:has(td)').hide();
            var nBegin = ($(this).text() - 1) * recordPerPage;
            var nEnd = $(this).text() * recordPerPage - 1;
            for (var i = nBegin; i <= nEnd; i++) {
              $(tr[i]).show();
            }
        });  
 

        $('.test_function').on('click', function() {
            var pdf_element_id = $(this).closest('td').prev('.ans').attr('id');
            var pdf_element = document.getElementById(String(pdf_element_id)).innerHTML;
            var pdf_name_user = pdf_name + '_' + String(pdf_element_id) + '.pdf'

            $.ajax({    
                url: "recap_handler_url",
                type: "post",
                data: {"pdf_element": pdf_element},
                success: function(data) {
    
                    console.log(data);
                    //fillTags();
                }
            });

        });

        $('#notifications-btn').click(function(event){
            event.preventDefault();
            event.stopImmediatePropagation()
            var noteFormUrl;
            noteFormUrl = $('#notifications-frm').attr('action');
            $.ajax({
                url: noteFormUrl,
                method: 'post',
                data: {'text': 'hi'},
                beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
              xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
            }
            }).done(function(data){
                var message = $('#note-msg')
                if (data.hasOwnProperty('error')){
                    message.append("There was an error.")
                } 
                else if (data.hasOwnProperty('statusCode')){
                    if (data['statusCode'] == 200) {
                        alert('The notification was sent.')
                        message.append(note_text)
                    }
                } else if (data['statusCode'] != 200) {
                    alert('There was a problem and the notification was not sent.')
                    message.append(data.message)
                }
            })
        });



        $('.download_answer').click(function(event) {
            
            var pdf_element_id = $(this).closest('td').prev('.ans').attr('id');
            var pdf_element = document.getElementById(String(pdf_element_id)).innerHTML;
            var pdf_name_user = pdf_name + '_' + String(pdf_element_id) + '.pdf'

            html2pdf(pdf_element, {
              margin: [0.8, 1, 0.5, 1],
              filename: pdf_name_user,
              image: { type: 'jpeg',quality: 0.98 },
              html2canvas: { dpi: 192, letterRendering: true },
              jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            }, function(pdf) {});
        });
    }
)
();
