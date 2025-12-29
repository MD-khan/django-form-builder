import json
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db import models
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET
from .models import Form, FormField, FormSection, FormSubmission, FormFieldValue, FieldType


@login_required
def form_list(request):
    """List all forms for admin"""
    forms = Form.objects.all()
    return render(request, 'formbuilder/form_list.html', {'forms': forms})


@login_required
def form_create(request):
    """Create a new form"""
    if request.method == 'POST':
        name = request.POST.get('name')
        description = request.POST.get('description', '')
        
        form = Form.objects.create(
            name=name,
            description=description,
            created_by=request.user
        )
        messages.success(request, f'Form "{name}" created successfully!')
        return redirect('formbuilder:form_edit', pk=form.pk)
    
    return render(request, 'formbuilder/form_create.html')


@login_required
def form_edit(request, pk):
    """Edit form and its fields"""
    form = get_object_or_404(Form, pk=pk)
    field_types = FieldType.objects.filter(is_active=True)
    sections = form.sections.all().order_by('order')
    
    return render(request, 'formbuilder/form_edit.html', {
        'form': form,
        'field_types': field_types,
        'sections': sections,
    })


@login_required
def form_delete(request, pk):
    """Delete a form"""
    form = get_object_or_404(Form, pk=pk)
    
    if request.method == 'POST':
        name = form.name
        form.delete()
        messages.success(request, f'Form "{name}" deleted successfully!')
        return redirect('formbuilder:form_list')
    
    return render(request, 'formbuilder/form_delete.html', {'form': form})


@login_required
def form_submissions(request, pk):
    """View all submissions for a form"""
    form = get_object_or_404(Form, pk=pk)
    submissions = form.submissions.all()
    
    return render(request, 'formbuilder/form_submissions.html', {
        'form': form,
        'submissions': submissions,
    })


def form_display(request, slug):
    """Display form for users to fill out"""
    form = get_object_or_404(Form, slug=slug, status='published')
    sections = form.sections.all().order_by('order')
    fields_without_section = form.fields.filter(section__isnull=True).order_by('order')
    
    return render(request, 'formbuilder/form_display.html', {
        'form': form,
        'sections': sections,
        'fields_without_section': fields_without_section,
    })


def form_submit(request, slug):
    """Handle form submission"""
    form = get_object_or_404(Form, slug=slug, status='published')
    
    if request.method == 'POST':
        # Create submission
        submission = FormSubmission.objects.create(
            form=form,
            submitted_by=request.user if request.user.is_authenticated else None,
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        # Save field values
        for field in form.fields.all():
            value = request.POST.get(f'field_{field.id}', '')
            
            # Handle multiple values (checkboxes)
            if field.field_type.input_type == 'checkbox':
                values = request.POST.getlist(f'field_{field.id}')
                value = ','.join(values)
            
            FormFieldValue.objects.create(
                submission=submission,
                field=field,
                value=value
            )
        
        messages.success(request, form.success_message)
        return redirect('formbuilder:form_success', slug=slug)
    
    return redirect('formbuilder:form_display', slug=slug)


def form_success(request, slug):
    """Show success page after submission"""
    form = get_object_or_404(Form, slug=slug)
    return render(request, 'formbuilder/form_success.html', {'form': form})


# =============================================================================
# API ENDPOINTS - FORMS
# =============================================================================

@login_required
@require_POST
def api_update_form(request, pk):
    """API: Update form settings"""
    form = get_object_or_404(Form, pk=pk)
    data = json.loads(request.body)
    
    if 'status' in data:
        form.status = data['status']
    if 'name' in data:
        form.name = data['name']
    if 'description' in data:
        form.description = data['description']
    
    form.save()
    
    return JsonResponse({'success': True})


# =============================================================================
# API ENDPOINTS - SECTIONS
# =============================================================================

@login_required
@require_POST
def api_add_section(request, pk):
    """API: Add a section to a form"""
    form = get_object_or_404(Form, pk=pk)
    data = json.loads(request.body)
    
    # Get next order number
    max_order = form.sections.aggregate(models.Max('order'))['order__max'] or 0
    
    section = FormSection.objects.create(
        form=form,
        title=data['title'],
        description=data.get('description', ''),
        order=max_order + 1
    )
    
    return JsonResponse({'success': True, 'section_id': section.id})


@login_required
@require_GET
def api_get_section(request, pk):
    """API: Get section details"""
    section = get_object_or_404(FormSection, pk=pk)
    
    return JsonResponse({
        'id': section.id,
        'title': section.title,
        'description': section.description,
    })


@login_required
@require_POST
def api_update_section(request, pk):
    """API: Update a section"""
    section = get_object_or_404(FormSection, pk=pk)
    data = json.loads(request.body)
    
    section.title = data.get('title', section.title)
    section.description = data.get('description', '')
    section.save()
    
    return JsonResponse({'success': True})


@login_required
@require_POST
def api_delete_section(request, pk):
    """API: Delete a section"""
    section = get_object_or_404(FormSection, pk=pk)
    
    # Move fields in this section to no section
    section.fields.update(section=None)
    
    section.delete()
    
    return JsonResponse({'success': True})


# =============================================================================
# API ENDPOINTS - FIELDS
# =============================================================================

@login_required
@require_POST
def api_add_field(request, pk):
    """API: Add a field to a form"""
    form = get_object_or_404(Form, pk=pk)
    data = json.loads(request.body)
    
    field_type = get_object_or_404(FieldType, pk=data['field_type_id'])
    
    # Get section if provided
    section = None
    if data.get('section_id'):
        section = get_object_or_404(FormSection, pk=data['section_id'], form=form)
    
    # Parse options if provided
    options = {}
    if data.get('options'):
        choices = []
        for line in data['options'].strip().split('\n'):
            line = line.strip()
            if line:
                choices.append({'value': line, 'label': line})
        options = {'choices': choices}
    
    # Get conditional logic
    conditional_logic = data.get('conditional_logic', {})
    
    # Get next order number
    max_order = form.fields.aggregate(models.Max('order'))['order__max'] or 0
    
    field = FormField.objects.create(
        form=form,
        section=section,
        field_type=field_type,
        label=data['label'],
        help_text=data.get('help_text', ''),
        placeholder=data.get('placeholder', ''),
        is_required=data.get('is_required', False),
        options=options,
        conditional_logic=conditional_logic,
        order=max_order + 1
    )
    
    return JsonResponse({'success': True, 'field_id': field.id})


@login_required
@require_GET
def api_get_field(request, pk):
    """API: Get field details"""
    field = get_object_or_404(FormField, pk=pk)
    
    return JsonResponse({
        'id': field.id,
        'label': field.label,
        'help_text': field.help_text,
        'placeholder': field.placeholder,
        'is_required': field.is_required,
        'options': field.options,
        'has_options': field.field_type.has_options,
        'conditional_logic': field.conditional_logic,
        'section_id': field.section_id,
    })


@login_required
@require_POST
def api_update_field(request, pk):
    """API: Update a field"""
    field = get_object_or_404(FormField, pk=pk)
    data = json.loads(request.body)
    
    field.label = data.get('label', field.label)
    field.help_text = data.get('help_text', '')
    field.placeholder = data.get('placeholder', '')
    field.is_required = data.get('is_required', False)
    
    # Update section if provided
    if 'section_id' in data:
        if data['section_id']:
            field.section = get_object_or_404(FormSection, pk=data['section_id'])
        else:
            field.section = None
    
    # Parse options if provided
    if data.get('options'):
        choices = []
        for line in data['options'].strip().split('\n'):
            line = line.strip()
            if line:
                choices.append({'value': line, 'label': line})
        field.options = {'choices': choices}
    
    # Update conditional logic
    field.conditional_logic = data.get('conditional_logic', {})
    
    field.save()
    
    return JsonResponse({'success': True})


@login_required
@require_POST
def api_delete_field(request, pk):
    """API: Delete a field"""
    field = get_object_or_404(FormField, pk=pk)
    field.delete()
    
    return JsonResponse({'success': True})


@login_required
@require_POST
def api_reorder_fields(request, pk):
    """API: Reorder fields in a form"""
    form = get_object_or_404(Form, pk=pk)
    data = json.loads(request.body)
    
    for field_data in data['fields']:
        FormField.objects.filter(
            id=field_data['id'],
            form=form
        ).update(order=field_data['order'])
    
    return JsonResponse({'success': True})