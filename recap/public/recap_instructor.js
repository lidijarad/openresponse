/* Javascript for OpenResponseXBlock. */
(function RecapDashboard(runtime, element, data) {

    	var user_id = '#' + data.user_id;

        $('#user_1').click(function(event) {
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
})(RecapDashboard);

