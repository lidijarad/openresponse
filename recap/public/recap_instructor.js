
/* Javascript for RecapDashboard. */
(
    function RecapDashboard(runtime, element, data) {
        

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
 

        $('.recap-download-btn').click(function(event){
            event.preventDefault();
            event.stopImmediatePropagation()
            console.log('I was clicked');
            var noteFormUrl;
            var pdf_element_id = $(this).closest('td').prev('.ans').attr('id');
            noteFormUrl = $('.recap-instructor-form').attr('action');
            var csrftoken = getCookie('csrftoken');
            $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
              xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
            }
            });
            $.ajax({
                url: noteFormUrl,
                method: 'post',
                data: {'user_id': pdf_element_id},
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
        function getCookie(name) {
            var cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = jQuery.trim(cookies[i]);
                    // Does this cookie string begin with the name we want?
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }
        function csrfSafeMethod(method) {
            // these HTTP methods do not require CSRF protection
            return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
        }

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
