/* Javascript for OpenResponseXBlock. */
function RecapDashboard(runtime, element, data) {

    $(function ($) {
    	$('#recap-table tr button').click(function (event) {
          alert($(this).attr('id')); 

    	var user_id = '#' + data.user_id;

        $('#').click(function(eventObject) {
            console.log('hiii');
            var handlerUrl = runtime.handlerUrl(element, 'generate_pdf');
            //var answer_html = $('#student-input').val();
            var recap_answers = "THIS IS MY TEST STRING";
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