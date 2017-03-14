"""TO-DO: Write a description of what this XBlock is."""

import re
import logging
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

logger = logging.getLogger(__name__)
loader = ResourceLoader(__name__)

class RecapXBlock(XBlock, StudioEditableXBlockMixin, XBlockWithSettingsMixin):
    """
    TO-DO: document what your XBlock does.
    """

    # Fields are defined on the class.  You can access them in your code as
    # self.<fieldname>.

    display_name = String(
        display_name="Display Name",
        help="This name appears in the horizontal navigation at the top of the page.",
        scope=Scope.settings,
        default="Recap"
    )

    xblock_list = List(
        display_name="Problems",
        help="Add the component ID\'s of the XBlocks you wish to include in the summary.",
        allow_reset=False,
        scope=Scope.settings
    )

    string_html = String(
        display_name="Layout",
        help="Include some HTML formatting (introductory paragraphs or headings) that you "
             "would like to accompany the summary of questions and answers.",
        multiline_editor='html',
        default="<p>[[CONTENT]]</p>",
        scope=Scope.settings
    )

    allow_download = Boolean(
        display_name="Allow Download",
        help="Allow the user to download a pdf summary",
        default=True,
        scope=Scope.settings,
    )

    editable_fields = ('display_name', 'xblock_list', 'string_html', 'allow_download',)


    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")


    def get_block(self, xblock):
        try:
            usage_key = self.scope_ids.usage_id.course_key.make_usage_key(xblock[1], xblock[0])
            return self.runtime.get_block(usage_key), xblock[1]
        except:
            InvalidKeyError


    def get_blocks(self, xblock_list):
        for x_id, x_type in xblock_list:
            try:
                usage_key = self.scope_ids.usage_id.course_key.make_usage_key(x_type, x_id)
                yield self.runtime.get_block(usage_key), x_type
            except:
                InvalidKeyError


    @XBlock.json_handler
    def get_xblocks_async(self, data, suffix=''):
        """
        Called when submitting the form in studio to get the xblock question and answer
        """
        self.xblock_list = data['xblock_list']
        return { 'xblock_list': self.xblock_list }


    def get_field_names(self, xblock_type):
        """
        Returns the correct question and answer field names for a specific XBlock type
        """
        if xblock_type == 'freetextresponse':
            return "display_name", "student_answer"
        else:
            raise Exception('The XBlock type selected does not exist.')


    def student_view(self, context=None):
        """
        The primary view of the RecapXBlock, shown to students when viewing courses.
        """
        blocks = []
        for block, xblock_type in self.get_blocks(self.xblock_list):
            question, answer = self.get_field_names(xblock_type)
            blocks.append((getattr(block, question), getattr(block, answer)))

        block_layout = '<p class="recap_question">{}</p><p class="recap_answer"><em>{}</em></p>'
        qa_str = ''.join(block_layout.format(q, (a or "Nothing to recap.")) for q, a in blocks)

        layout = self.string_html.replace('[[CONTENT]]', qa_str)

        current = 0
        block_sets = []
        pattern = re.compile(r'\[\[BLOCKS\(([0-9]+)\)\]\]')
        #for m in sorted(re.finditer(pattern, layout), key=lambda m:int(m.start(0)), reverse=True):
        for m in re.finditer(pattern, layout):
            subblocks = []
            for x in range(current, current+int(m.group(1))):
                if len(self.xblock_list) > x:
                    block, xblock_type = self.get_block(self.xblock_list[x])
                    question, answer = self.get_field_names(xblock_type)
                    subblocks.append((getattr(block, question), getattr(block, answer)))
                    current += 1
            qa_str = ''.join(block_layout.format(q, (a or "Nothing to recap.")) for q, a in subblocks)
            block_sets.append((m.start(0), m.end(0), qa_str))

        for start, end, string in reversed(block_sets):
            layout = layout[0:start] + string + layout[end:]

        context = {
            'blocks': blocks,
            'layout': layout,
            'download': self.allow_download,
        }

        frag = Fragment(loader.render_django_template("static/html/recap.html", context).format(self=self))
        frag.add_css(self.resource_string("static/css/recap.css"))
        frag.add_javascript_url(self.runtime.local_resource_url(self, 'public/FileSaver.js/FileSaver.min.js'))
        frag.add_javascript_url(self.runtime.local_resource_url(self, 'public/jsPDF-1.3.2/jspdf.min.js'))
        frag.add_javascript(self.resource_string("static/js/src/recap.js"))
        frag.initialize_js('RecapXBlock')
        return frag


    def studio_view(self, context):
        """
        Render a form for editing this XBlock
        """
        frag = Fragment()
        context = {'fields': [],
                    'xblock_list': self.xblock_list,
                  }
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
        frag.content = loader.render_django_template("static/html/recap_edit.html", context)
        frag.add_javascript(loader.load_unicode("static/js/src/recap_edit.js"))
        frag.initialize_js('StudioEditableXBlockMixin')
        return frag


    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("RecapXBlock",
             """<recap/>
             """),
            ("Multiple RecapXBlock",
             """<vertical_demo>
                <recap/>
                <recap/>
                <recap/>
                </vertical_demo>
             """),
        ]
