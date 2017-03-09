"""TO-DO: Write a description of what this XBlock is."""

import pkg_resources
from xblock.core import XBlock
from xblock.fields import Scope, Integer, String, Float, List, Boolean
from xblock.fragment import Fragment
from xblockutils.studio_editable import StudioEditableXBlockMixin
from xblockutils.settings import XBlockWithSettingsMixin
from xblockutils.resources import ResourceLoader
from xmodule.modulestore.split_mongo import BlockKey
from opaque_keys.edx.locations import BlockUsageLocator
from opaque_keys.edx.keys import CourseKey
from opaque_keys import InvalidKeyError
_ = lambda text: text
loader = ResourceLoader(__name__)


class OpenResponseXBlock(XBlock, StudioEditableXBlockMixin, XBlockWithSettingsMixin):
    """
    TO-DO: document what your XBlock does.
    """

    # Fields are defined on the class.  You can access them in your code as
    # self.<fieldname>.

    display_name = String(
        display_name="Display Name",
        help="This name appears in the horizontal navigation at the top of the page.",
        scope=Scope.settings,
        default="Aggregate XBlock"
    )

    xblock_type = String(
	display_name='XBlock type',
	default = 'freetextresponse',
	scope=Scope.settings
    )


    xblock_list = List(
	help='''Add the component ID's of the XBlocks you wish to include in the summary. 
             Make sure your ID's are wrapped in double quote marks and are separated by a comma.
             Eg:["ffd9bcbd65ac454e9c5c0aae26edb5db", "6899073dca1e4d9b83d54a846f141031"]''',
	default=[],
	list_style='set',
	scope=Scope.settings
    )	
    
    string_html = String(
	help="Include some HTML formatting (introductory paragraphs or headings) that you would like to"
	     " accompany the summary of questions and answers.",
	multiline_editor='html',
	default="<p>CONTENT</p>",
	scope=Scope.settings
    )
  
    allow_pdf = Boolean(
    	help="Allow the user to download a pdf summary",
    	default=True,
    	scope=Scope.settings,
    )

    editable_fields = ('display_name', 'string_html', 'xblock_type', 'xblock_list', 'allow_pdf',)

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    def get_blocks(self, xblock_list):
       
        for compid in xblock_list:
            try:
                usage_key = self.scope_ids.usage_id.course_key.make_usage_key(self.xblock_type, compid)
                yield self.runtime.get_block(usage_key)
            except:
                InvalidKeyError

    @XBlock.json_handler
    def get_xblocks_async(self, data, suffix=''):
    	"""
    	Called when submitting the form in studio to get the xblock question and answer

    	"""
    	self.new_xblock_list = data['xblock_list']
    	return { 'xblock_list': self.new_xblock_list}

    def get_freetextresponse_field_names(self):

        question_field_name = "prompt"
        answer_field_name = "student_answer"

        return question_field_name, answer_field_name

    def get_field_names(self, xblock_type):

        if xblock_type == 'freetextresponse':

            answer, question = self.get_freetextresponse_field_names()
            return answer, question
        else:
            raise Exception('The xblock_type field names do not exist. Add function to handle your specific XBlock.')


    def student_view(self, context=None):
		"""
		The primary view of the OpenResponseXBlock, shown to students
		when viewing courses.
		"""
	        
		question, answer = self.get_field_names(self.xblock_type)
		blocks = []

		for block in self.get_blocks(self.xblock_list):
			blocks.append((getattr(block, question), getattr(block, answer)))

		qa_str = ''.join('''<p>{}</p> <br/>
							<p>{}</p>'''.format(q, a) for q, a in blocks)

		layout = self.string_html
		layout = layout.replace('<p>CONTENT</p>', qa_str)

		context = {
        	'blocks': blocks,
        	'layout': layout,
        	'pdf': self.allow_pdf,
		}

		html = loader.render_django_template("static/html/openresponse.html", context)
		frag = Fragment(html.format(self=self))
		frag.add_css(self.resource_string("static/css/openresponse.css"))
		frag.add_javascript_url(self.runtime.local_resource_url(self, 'public/FileSaver.js-master/FileSaver.js'))
		frag.add_javascript_url(self.runtime.local_resource_url(self, 'public/jsPDF-1.3.2/jspdf.js'))
		frag.add_javascript_url(self.runtime.local_resource_url(self, 'public/jsPDF-1.3.2/plugins/from_html.js'))
		frag.add_javascript_url(self.runtime.local_resource_url(self, 'public/jsPDF-1.3.2/plugins/split_text_to_size.js'))
		frag.add_javascript_url(self.runtime.local_resource_url(self, 'public/jsPDF-1.3.2/plugins/standard_fonts_metrics.js'))
		frag.add_javascript_url(self.runtime.local_resource_url(self, 'public/jsPDF-1.3.2/libs/html2canvas/dist/html2canvas.js'))
		frag.add_javascript(self.resource_string("static/js/src/openresponse.js"))
		frag.initialize_js('OpenResponseXBlock')
		return frag

    def studio_view(self, context):
        """
        Render a form for editing this XBlock
        """
        fragment = Fragment()
        context = {'fields': []}
        # Build a list of all the fields that can be edited:
        for field_name in self.editable_fields:
            field = self.fields[field_name]
            assert field.scope in (Scope.content, Scope.settings), (
                "Only Scope.content or Scope.settings fields can be used with "
                "StudioEditableXBlockMixin. Other scopes are for user-specific data and are "
                "not generally created/configured by content authors in Studio."
            )
            field_info = self._make_field_info(field_name, field)
            if field_info is not None:
                context["fields"].append(field_info)
        fragment.content = loader.render_django_template("static/html/openresponse_edit.html", context)
        fragment.add_javascript(loader.load_unicode("static/js/src/openresponse_edit.js"))
        fragment.initialize_js('StudioEditableXBlockMixin')
        return fragment

    # TO-DO: change this to create the scenarios you'd like to see in the
    # workbench while developing your XBlock.
    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("OpenResponseXBlock",
             """<openresponse/>
             """),
            ("Multiple OpenResponseXBlock",
             """<vertical_demo>
                <openresponse/>
                <openresponse/>
                <openresponse/>
                </vertical_demo>
             """),
        ]
