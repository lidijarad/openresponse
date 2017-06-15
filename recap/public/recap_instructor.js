/* Javascript for RecapDashboard. */
(
    function RecapDashboard(runtime, element, data) {
        var runtime = {
            handlerUrl: function(el, handler) {
                return '/' + handler;
        }
    };

    window.XBlock = {
        initializeBlock: function(el){}
    };

        console.log(runtime);
        console.log(this);
         $('#user_1').click(function(event) {
            console.log('hiii');
            var handlerUrl = runtime.handlerUrl(element, 'generate_pdf');
            //var answer_html = $('#student-input').val();
            var recap_answers = "THIS IS MY TEST STRING";
            console.log(recap_answers)
            event.preventDefault();
            $.ajax({
                type: "POST",
                url: handlerUrl,
                data: JSON.stringify({"recap_answers": recap_answers}),
                success: function(data){
                console.log(data)
                }
            });
        });
    }
)
();
