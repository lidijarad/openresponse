import datatableview
from datatableview import Datatable
from datatableview.views import DatatableView

from .models import Entry, Blog

class DemoMixin(object):
    description = """Missing description!"""
    implementation = """Missing implementation details!"""

    def get_template_names(self):
        """ Try the view's snake_case name, or else use default simple template. """
        name = self.__class__.__name__.replace("DatatableView", "")
        name = re.sub(r'([a-z]|[A-Z]+)(?=[A-Z])', r'\1_', name)
        return ["demos/" + name.lower() + ".html", "example_base.html"]

    def get_context_data(self, **kwargs):
        context = super(DemoMixin, self).get_context_data(**kwargs)
        context['implementation'] = self.implementation

        # Unwrap the lines of description text so that they don't linebreak funny after being put
        # through the ``linebreaks`` template filter.
        alert_types = ['info', 'warning', 'danger']
        paragraphs = []
        p = []
        alert = False
        for line in self.__doc__.splitlines():
            line = line[4:].rstrip()
            if not line:
                if alert:
                    p.append(u"""</div>""")
                    alert = False
                paragraphs.append(p)
                p = []
            elif line.lower()[:-1] in alert_types:
                p.append(u"""<div class="alert alert-{type}">""".format(type=line.lower()[:-1]))
                alert = True
            else:
                p.append(line)
        description = "\n\n".join(" ".join(p) for p in paragraphs)
        context['description'] = re.sub(r'``(.*?)``', r'<code>\1</code>', description)

        return context

class SatelliteDatatableView(DatatableView):
    """
    External view powering the embedded table for ``EmbeddedTableDatatableView``.
    """
    template_name = "blank.html"
    model = Entry
    class datatable_class(Datatable):
        class Meta:
            columns = ['id', 'headline', 'pub_date']

    def get_datatable_kwargs(self):
        kwargs = super(SatelliteDatatableView, self).get_datatable_kwargs()
        kwargs['url'] = reverse('satellite')
        return kwargs



class EmbeddedTableDatatableView(DemoMixin, TemplateView):
    """
    To embed a datatable onto a page that shouldn't be responsible for generating all of the ajax
    queries, you can easily just create the structure object that serves as the context variable,
    but base it on the options of some other view.  The other view will indeed need access to those
    options once queries begin to autonomously route to it over AJAX, so you won't be able to
    specify the column options directly inside of the ``get_context_data()``, but you can get pretty
    close.

    In this example, we've created a separate view, called ``SatelliteDatatableView``, which houses
    all of the options and machinery for getting the structure object for the context.

    Just add a ``get_context_data()`` method, instantiate the other view, and ask it to generate
    the options object via its ``get_datatable()`` method.
    """

    def get_context_data(self, **kwargs):
        context = super(EmbeddedTableDatatableView, self).get_context_data(**kwargs)
        context['datatable'] = SatelliteDatatableView().get_datatable()
        return context