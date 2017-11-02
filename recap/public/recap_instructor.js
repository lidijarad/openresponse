
/* Javascript for RecapDashboard. */
(
    function RecapDashboard(runtime, element, data) {

    // Get the date for the pdf file name

        current_date = new Date();
        month = current_date.getMonth() + 1;
        pdf_name = ''
        pdf_name =  String(current_date.getDate()) + '/' + String(month) + '/' + String(current_date.getFullYear());

        //Paginate users using jquery

        $('#recap-table').after('<div id="nav"></div>');
        var rowsShown = 10;
        var numLimit = 3;
        var rowsTotal = $('#recap-table tbody tr').length;
        var numPages = rowsTotal / rowsShown;
        for (var i = 0; i < numPages; i++) {
            var pageNum = i + 1;
            $('#nav').append('<a class="btn nums" href="#" rel="' + i + '">' + pageNum + '</a> ');
        }
        $('.nums').hover(
            function() {
                $(this).addClass('focus');
            },
            function() {
                $(this).removeClass('focus');
            }
        );

        $('#recap-table').find('tbody tr:has(td)').hide();
        var tr = $('#recap-table').find('tbody tr:has(td)');
        for (var i = 0; i <= rowsShown - 1; i++) {
          $(tr[i]).show();
        }
        $('.nums').click(function(event) {
          $('.recap-page-wrapper span').removeClass('active');
          $(this).addClass('active');
          $('#recap-table').find('tbody tr:has(td)').hide();
            var nBegin = ($(this).text() - 1) * rowsShown;
            var nEnd = $(this).text() * rowsShown - 1;
            for (var i = nBegin; i <= nEnd; i++) {
              $(tr[i]).show();
            }
        });

        $('#recap-table tbody tr').hide();
        $('#recap-table tbody tr').slice(0, rowsShown).show();
        $('#nav a:first').addClass('active').css("color", "blue");
        if (numPages > numLimit) {
            $('#nav').append('<a class="btn np" href="#" rel="next">></a> ');
            $('#nav').prepend('<a class="btn np" href="#" rel="prev" style="display:none"><</a> ');
            $('#nav').append('<a class="btn np" href="#" rel="last">>|</a> ');
            $('#nav').prepend('<a class="btn np" href="#" rel="first" style="display:none">|<</a> ');
        }
        $('#nav').on('click', 'a', function () {
            var $nums = $('.nums');
            var currPage = $(this).attr('rel');
            if (currPage == "next") {
                currPage = $('#nav a.active').attr('rel');
                currPage++;
            } else if (currPage == "prev") {
                currPage = $('#nav a.active').attr('rel');
                currPage--;
            }
            if (currPage == "first") {
                $nums.first().trigger('click');
                return false;
            } else if (currPage == "last") {
                $nums.last().trigger('click');
                return false;
            }
            var startItem = currPage * rowsShown;
            var endItem = startItem + rowsShown;
            $('#nav a').removeClass('active').css("color", "black");;
            $('#nav a[rel="' + currPage + '"]').addClass('active').css("color", "blue");
            $('#recap-table tbody tr').css('opacity', '0.0').hide().slice(startItem, endItem).
            css('display', 'table-row').animate({
                opacity: 1
            }, 300);
            if ($nums.last().hasClass('active')) 
                $('#nav a[rel="next"]').hide();
            else 
                $('#nav a[rel="next"]').show();
            if (!$nums.first().hasClass('active')) 
                $('#nav a[rel="prev"]').show();
            else 
                $('#nav a[rel="prev"]').hide();
            $nums.hide();
            if(numLimit < 1)
                numLimit = 2;
            var $temp = {};
            if ($nums.filter('.active').is($nums.first())){
                $('#nav a[rel="first"]').hide();
                $('#nav a[rel="last"]').show();
                $temp = $nums.first().show();
                for (var j = 0; j < numLimit; j++) {
                    $temp = $temp.next().show();
                }
            }
            else if ($nums.filter('.active').is($nums.last())){
                $('#nav a[rel="last"]').hide();
                $('#nav a[rel="first"]').show();
                $temp = $nums.last().show();
                for (var j = 0; j < numLimit; j++) {
                    $temp = $temp.prev().show();
                }
            }
            else {
                $('#nav a[rel="first"]').show();
                $('#nav a[rel="last"]').show();
                $temp = $('#nav a[rel="' + currPage + '"]').show();
                for (var j = 0; j < numLimit; j++) {
                    $temp = $temp.prev().show();
                }
                $temp = $('#nav a[rel="' + currPage + '"]').show();
                for (var j = 0; j < numLimit; j++) {
                    $temp = $temp.next().show();
                }
            }
        }).find('a.active').trigger('click');


        $("#search").keyup(function(){
            _this = this;
             // Show only matching TR, hide rest of them
            $.each($("#recap-table tbody tr"), function() {
                if($(this).text().toLowerCase().indexOf($(_this).val().toLowerCase()) === -1) {
                    $(this).hide();
                }
                else {
                   $(this).show();
                } 
            });
         });  

        // Callback for showing and hiding spinner
        function SpinnerCallback(shouldShowSpinner, cb) {
           if (shouldShowSpinner) {
                $('#lean_overlay').show();
                $('.recap-loader').show('fast', 'linear', function() { cb()});
           } else {
                $('#lean_overlay').hide();
                $('.recap-loader').hide('fast', 'linear', function() { cb()});
            }
        }
 
        // Download pdf asynchronously using html2pdf library

        $('.recap-download-btn').click(function(event){
            event.preventDefault();
            event.stopImmediatePropagation()
            var selected = $('#recap-options option:selected');
            var selected_id = selected.attr('id');
            var noteFormUrl;
            var pdf_element_id = $(this).closest('td').prev('.ans').attr('id');
            noteFormUrl = $('.recap-instructor-form').attr('action');
            var my_data = { 'user_id': pdf_element_id, 'these_blocks': selected_id}
            SpinnerCallback(true, function() {
                $.ajax({
                    url: noteFormUrl,
                    method: 'POST',
                    data: JSON.stringify(my_data),
                    success: function(data) {
                        pdf_element = data['html'];
                        if (pdf_element.indexOf('Nothing to recap') !== -1) {
                            SpinnerCallback(false, function() {
                                alert("The user has not submitted all their answers.")
                            });
                        } else {
                            file_name = pdf_name + '_' + String(data['user_name']) + '.pdf'
                            html2pdf(pdf_element, {
                                margin: [0.8, 1, 0.5, 1],
                                filename: file_name,
                                image: { type: 'jpeg',quality: 0.98 },
                                html2canvas: { dpi: 192, letterRendering: true },
                                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                           }, function(pdf) {
                               SpinnerCallback(false, function () {});
                           })
                        }
                    }
                });
            });
        });
    }
)
();
