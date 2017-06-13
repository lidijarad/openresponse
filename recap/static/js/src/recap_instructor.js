/* Javascript for OpenResponseXBlock. */
function RecapDashboard(runtime, element) {

    $(function ($) {

        $('#download').click(function(eventObject) {
            console.log('hiii');
            var handlerUrl = runtime.handlerUrl(element, 'generate_pdf');
            //var answer_html = $('#student-input').val();
            var recap_answers = '#' + data.recap_answers_id;
            console.log(recap_answers)
            eventObject.preventDefault();
            $.ajax({
                type: "POST",
                url: handlerUrl,
                data: JSON.stringify({"recap_answers": recap_answers}),
                success: function(data){
                    console.log(data)
                }
            });
        });
    });
}