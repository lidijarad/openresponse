"""TO-DO: Write a description of what this XBlock is."""
# -*- coding: utf-8 -*-
import re
import ast
import logging
import pkg_resources
from django.utils.translation import ugettext_lazy as _
from xblock.core import XBlock
from xblock.fields import Scope, String, List, Boolean
from xblock.fragment import Fragment
from xblock.runtime import KvsFieldData
from xblock.validation import ValidationMessage
from xblockutils.studio_editable import StudioEditableXBlockMixin
from xblockutils.settings import XBlockWithSettingsMixin
from xblockutils.resources import ResourceLoader
from django.contrib.auth.models import User
from courseware.model_data import DjangoKeyValueStore, FieldDataCache
from lms.djangoapps.lms_xblock.models import XBlockAsidesConfig
from xmodule.modulestore.django import modulestore
from opaque_keys import InvalidKeyError
from submissions import api
logger = logging.getLogger(__name__)
loader = ResourceLoader(__name__)

@XBlock.needs("field-data")
@XBlock.needs("i18n")
class RecapXBlock(StudioEditableXBlockMixin, XBlock, XBlockWithSettingsMixin):
    """
    TO-DO: document what your XBlock does.
    """

    # Fields are defined on the class.  You can access them in your code as
    # self.<fieldname>.

    display_name = String(
        display_name="Display Name",
        help="This is the name of the component",
        scope=Scope.settings,
        default="Recap"
    )

    xblock_list = List(
        display_name="Problems",
        help="Component ID's of the XBlocks you wish to include in the summary.",
        allow_reset=False,
        scope=Scope.settings
    )

    string_html = String(
        display_name="Layout",
        help="Include HTML formatting (introductory paragraphs or headings)that"
        " you would like to accompany the summary of questions and answers.",
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

    download_text = String(
        display_name="Download Button Text",
        help="Text to display on the download button",
        default="Download",
        scope=Scope.settings,
    )

    editable_fields = (
        'display_name',
        'xblock_list',
        'string_html',
        'allow_download',
        'download_text',
    )
    show_in_read_only_mode = True

    def validate_field_data(self, validation, data):
        """
        Validate this block's field data. We are validating that the chosen
        freetextresponse xblocks ID's exist in the course
        """
        for x_id, x_type in data.xblock_list:
            try:
                usage_key =\
                    self.scope_ids.usage_id.course_key.make_usage_key(
                        x_type,
                        x_id
                    )
                self.runtime.get_block(usage_key)
            except Exception as e:
                logger.warn(e)
                validation.add(
                    ValidationMessage(
                        ValidationMessage.ERROR,
                        u"Component freetextresponse ID: {} does not exist.".format(x_id)
                    )
                )

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")


    def get_block(self, xblock):
        '''
        Get a single freetextresponse block
        '''
        try:
            usage_key =\
                self.scope_ids.usage_id.course_key.make_usage_key(
                    xblock[1],
                    xblock[0]
                )
            return usage_key, xblock[1]
        except:
            InvalidKeyError


    def get_blocks(self, xblock_list):
        for x_id, x_type in xblock_list:
            try:
                usage_key = \
                    self.scope_ids.usage_id.course_key.make_usage_key(
                        x_type,
                        x_id
                    )
                yield usage_key, x_type
            except:
                InvalidKeyError


    def get_field_names(self, xblock_type):
        """
        Returns the correct question and answer field names for an XBlock type
        """
        if xblock_type == 'freetextresponse':
            return "display_name", "student_answer"
        else:
            raise Exception('The XBlock type selected does not exist.')


    def get_submission_key(self, usage_key):
        """
        Returns submission key needed for submissions api
        """
        try:
            logger.info('Attempting to retrieve student item dictionary.')
            user = self.runtime.get_real_user(self.runtime.anonymous_student_id)
            student_item_dictionary = dict(
                student_id=user.id,
                course_id=unicode(usage_key.course_key),
                item_id=unicode(usage_key),
                item_type=usage_key.block_type,
            )
        except AttributeError:
            student_item_dictionary = ''
            logger.error('Studio cannot access self.runtime.get_real_user')
        return student_item_dictionary


    def get_submission(self, usage_key):
        """
        Returns submission from submissions api
        """
        try:
            submission_key = self.get_submission_key(usage_key)
            submission = api.get_submissions(submission_key, limit=1)
            if submission is not None:
                logger.info(
                    'Attempting to retreive submission from submissions api.'
                )
            value = submission[0]["answer"]
        except IndexError:
            logger.warn(
                'IndexError: no submssion matched given student item dict.'
            )
            value = _("Nothing to recap.")
        return value


    def get_display_answer(self, answer):
        """
        Returns formatted answer or placeholder string
        """
        answer_str = _("Nothing to recap.")
        if answer:
            answer_str = re.sub(r'\n+', '<div></div>', unicode(answer))
        return answer_str


    def get_answer(self, usage_key, block, field):
        """
        Returns value from Scope.user_state field in any xblock
        """
        value = None
        field_data = block.runtime.service(block, 'field-data')
        if field_data.has(block, field):
            value = field_data.get(block, field)
        else:
            descriptor = modulestore().get_item(usage_key, depth=1)
            if block.runtime.get_real_user:
                real_user = \
                    block.runtime.get_real_user(
                        self.runtime.anonymous_student_id
                    )
                field_data_cache = \
                    FieldDataCache.cache_for_descriptor_descendents(
                        usage_key.course_key,
                        real_user,
                        descriptor,
                        asides=XBlockAsidesConfig.possible_asides(),
                    )
                student_data = KvsFieldData(
                    DjangoKeyValueStore(field_data_cache)
                )
                if student_data.has(block, field):
                    value = student_data.get(block, field)
        return value

    def get_user_answer(self, usage_key, block, field, user):
        """
        Returns value from Scope.user_state field in any xblock
        """
        value = None
        field_data = block.runtime.service(block, 'field-data')
        if field_data.has(block, field):
            value = field_data.get(block, field)
        else:
            descriptor = modulestore().get_item(usage_key, depth=1)
            if block.runtime.get_real_user:
                real_user = user
                field_data_cache = FieldDataCache.cache_for_descriptor_descendents(
                    usage_key.course_key,
                    real_user,
                    descriptor,
                    asides=XBlockAsidesConfig.possible_asides(),
                )
                student_data = KvsFieldData(DjangoKeyValueStore(field_data_cache))
                if student_data.has(block, field):
                    value = student_data.get(block, field)
        return value


    @XBlock.supports("multi_device")
    def student_view(self, context=None):
        """
        The primary view of the RecapXBlock seen in LMS
        """
        blocks = []
        for usage_key, xblock_type in self.get_blocks(self.xblock_list):
            if xblock_type == 'freetextresponse':
                try:
                    block = self.runtime.get_block(usage_key)
                    question_field, answer_field = self.get_field_names(xblock_type)
                    # Get the answer using submissions api
                    try:
                        answer = self.get_submission(usage_key)
                        blocks.append((getattr(block, question_field), answer))
                        # if submissions api wasn't used
                    except Exception as e:
                        logger.info(
                            'The submissions api failed, using default module store.'
                        )
                        answer = self.get_answer(usage_key, block, answer_field)
                        blocks.append((getattr(block, question_field), answer))
                except Exception as e:
                    logger.warn(str(e))
                    logger.info(
                        'The submissions api failed, using default module store.'
                    )
            elif xblock_type == 'problem':
                answer = u""
                question = u""
                try:
                    block = self.runtime.get_block(usage_key)
                    question = unicode(block.display_name)
                    answer = self.get_submission(usage_key)
                    if answer is None:
                        answer = block.lcp.get_question_answer_text()                   
                    blocks.append((question, answer))
                except Exception as e:
                    logger.warn(str(e))
                    answer = block.lcp.get_question_answer_text()
                    blocks.append((question, answer))
            

        block_layout = (
            '<p class="recap_question"><strong>{}</strong></p>'
            '<div class="recap_answer" '
            'style="page-break-before:always">{}</div>'
        )
        qa_str = unicode(
            ''.join(
                unicode(block_layout).format(q , self.get_display_answer(a))
                for q, a in blocks
            )
        )
        layout = self.string_html.replace('[[CONTENT]]', qa_str)

        current = 0
        block_sets = []
        pattern = re.compile(r'\[\[BLOCKS\(([0-9]+)\)\]\]')
        for m in re.finditer(pattern, layout):
            subblocks = []
            for x in range(current, current+int(m.group(1))):
                if len(self.xblock_list) > x:
                    usage_key, xblock_type = self.get_block(self.xblock_list[x])
                    if xblock_type == 'freetextresponse':
                        block = self.runtime.get_block(usage_key)
                        question_field, answer_field = self.get_field_names(xblock_type)
                        # Get the answer using submissions api
                        try:
                            answer = self.get_submission(usage_key)
                        except Exception as e:
                            logger.warn('Studio does not have access to get_real_user')
                            answer = self.get_answer(usage_key, block, answer_field)
                        # if submissions api wasn't used
                        if answer is None:
                            answer = self.get_answer(usage_key, block, answer_field)
                        subblocks.append((getattr(block, question_field), answer))
                    elif xblock_type == 'problem':
                        answer = u""
                        question = u""
                        try:
                            block = self.runtime.get_block(usage_key)
                            question = unicode(block.display_name)
                            answer = self.get_submission(usage_key)
                            if answer is None:
                                answer = block.lcp.get_question_answer_text()                    
                            subblocks.append((question, answer))
                        except Exception as e:
                            if answer is None:
                                answer = block.lcp.get_question_answer_text()  
                            subblocks.append((question, answer))
                    current += 1
            qa_str = unicode(
                ''.join(
                    unicode(block_layout).format(q, self.get_display_answer(a))
                    for q, a in subblocks
                )
            )
            block_sets.append((m.start(0), m.end(0), qa_str))

        for start, end, string in reversed(block_sets):
            layout = layout[0:start] + string + layout[end:]

        idArray = self.scope_ids.usage_id._to_string().split('@')
        xblockId = idArray[len(idArray) -1]
        context = {
            'recap_answers_id': 'recap_answers_' + xblockId,
            'recap_editor_id': 'recap_editor_' + xblockId,
            'recap_cmd_id': 'recap_cmd_' + xblockId,
            'blocks': blocks,
            'layout': layout,
            'allow_download': self.allow_download,
            'download_text': self.download_text,
        }

        frag = Fragment(
            loader.render_django_template(
                "static/html/recap.html",
                context).format(self=self)
        )
        frag.add_css(self.resource_string("static/css/recap.css"))
        frag.add_javascript_url(
            self.runtime.local_resource_url(
                self,
                'public/FileSaver.js/FileSaver.min.js'
            )
        )
        frag.add_javascript_url(
            self.runtime.local_resource_url(
                self,
                'public/jsPDF-1.3.2/jspdf.min.js'
            )
        )

        frag.add_javascript_url(
            self.runtime.local_resource_url(
                self,
                'public/jsPDF-1.3.2/html2canvas.min.js'
            )
        )
        frag.add_javascript_url(
            self.runtime.local_resource_url(
                self,
                'public/jsPDF-1.3.2/html2pdf.js'
            )
        )

        frag.add_javascript(self.resource_string("static/js/src/recap.js"))
        frag.initialize_js('RecapXBlock', {
            'recap_answers_id': 'recap_answers_' + xblockId,
            'recap_editor_id': 'recap_editor_' + xblockId,
            'recap_cmd_id': 'recap_cmd_' + xblockId,
        })

        return frag


    def get_blocks_list(self, user, block_list):
        blocks = []
        for usage_key, xblock_type in self.get_blocks(block_list):
            try:
                if xblock_type == 'freetextresponse':
                    try:
                        block = self.runtime.get_block(usage_key)
                        question_field, answer_field = self.get_field_names(xblock_type)
                        answer = self.get_user_answer(usage_key, block, answer_field, user)
                        blocks.append((getattr(block, question_field), answer))
                    except Exception as e:
                        logger.warn(str(e))
                        logger.info(
                            'The submissions api failed, using default module store.'
                        )
                elif xblock_type == 'problem':
                    answer = ""
                    question = ""
                    try:
                        block = self.runtime.get_block(usage_key)
                        question = unicode(block.display_name)
                        answer = self.get_submission(usage_key)
                        blocks.append((question, answer))
                    except Exception as e:
                        blocks.append((str(usage_key), str(e)))
            except Exception as e:
                logger.warn(str(e))
        return blocks

    def get_user_layout(self, blocks, user):
        '''
        For the Recap Instructor dashboard, get HTML layout of user's answers
        '''
        layout = ''
        block_layout = (
            '<p class="recap_question">{}</p>'
            '<div class="recap_answer" '
            'style="page-break-before:always">{}</div>'
        )
        qa_str = unicode(
            ''.join(
                unicode(block_layout).format(q, a)
                for q, a in blocks
            )
        )
        layout = self.string_html.replace('[[CONTENT]]', qa_str)

        # deal with multiple blocks

        current = 0
        block_sets = []
        pattern = re.compile(r'\[\[BLOCKS\(([0-9]+)\)\]\]')
        for m in re.finditer(pattern, layout):
            subblocks = []
            for x in range(current, current+int(m.group(1))):
                if len(self.xblock_list) > x:
                    usage_key, xblock_type = self.get_block(self.xblock_list[x])
                    block = self.runtime.get_block(usage_key)
                    question_field, answer_field = self.get_field_names(xblock_type)
                    answer = self.get_user_answer(usage_key, block, answer_field, user)
                    subblocks.append((getattr(block, question_field), answer))
                    current += 1
            qa_str =\
                unicode(
                    ''.join(
                        unicode(block_layout).format(
                            q,
                            self.get_display_answer(a)) for q, a in subblocks
                    )
                )
            block_sets.append((m.start(0), m.end(0), qa_str))

        for start, end, string in reversed(block_sets):
            layout = layout[0:start] + string + layout[end:]

        return layout

    def studio_view(self, context):
        """
        Render a form for editing this XBlock
        """
        frag = Fragment()
        context = {
            'fields': [],
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


    def recap_blocks_listing_view(self, context=None):
        """This view is used in the Racap tab in the LMS Instructor Dashboard
        to display all available course ORA blocks.

        Args:
            context: contains two items:
                "recap_items" - all course items with names and parents, example:
                    [{"parent_name": "Vertical name",
                      "name": "Recap Display Name",
                      "url_base": "/grade_available_responses_view",
                     }, ...]
        Returns:
            (Fragment): The HTML Fragment for this XBlock.
        """
        users = context.get('users', []) if context else []
        recap_items = context.get('recap_items', []) if context else []
        number_of_blocks = len(self.xblock_list)

        recap_name_list = []
        for i in range(len(recap_items)):
            recap_name_list.append((recap_items[i]['name'], recap_items[i]['block_list']))

        context_dict = {
            "users": users,
            "download_text": self.download_text,
            "make_pdf_json": recap_items[0]['make_pdf_json'],
            'some_list': recap_name_list
        }

        instructor_dashboard_fragment = Fragment()
        instructor_dashboard_fragment.content = loader.render_django_template(
            'static/html/recap_dashboard.html',
            context_dict
        )
        instructor_dashboard_fragment.add_css(
            self.resource_string("static/css/recap.css")
        )
        instructor_dashboard_fragment.add_javascript_url(
            self.runtime.local_resource_url(
                self,
                'public/FileSaver.js/FileSaver.min.js'
            )
        )
        instructor_dashboard_fragment.add_javascript_url(
            self.runtime.local_resource_url(
                self,
                'public/jsPDF-1.3.2/jspdf.min.js'
            )
        )
        instructor_dashboard_fragment.add_javascript_url(
            self.runtime.local_resource_url(
                self,
                'public/jsPDF-1.3.2/html2canvas.min.js'
            )
        )
        instructor_dashboard_fragment.add_javascript_url(
            self.runtime.local_resource_url(
                self,
                'public/jsPDF-1.3.2/html2pdf.js'
            )
        )
        instructor_dashboard_fragment.add_javascript_url(
            self.runtime.local_resource_url(
                self,
                "public/recap_instructor.js"
            )
        )
        instructor_dashboard_fragment.initialize_js('RecapDashboard')

        return instructor_dashboard_fragment


    @XBlock.json_handler
    def make_pdf_json(self, data, suffix=''):

        '''
        This is a XBlock json handler for the async pdf download
        '''
        user = User.objects.get(id=data['user_id'])
        which_blocks = ast.literal_eval(data['these_blocks'])
        blocks = self.get_blocks_list(user, which_blocks)
        html = self.get_user_layout(blocks, user)

        return {'html': html, 'user_name': user.username}


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
