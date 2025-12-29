from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify

class FieldType(models.Model):
    INPUT_TYPE_CHOICES = [
        ('text', 'Text'),
        ('textarea', 'Textarea'),
        ('email', 'Email'),
        ('tel', 'Phone'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('select', 'Dropdown'),
        ('radio', 'Radio Buttons'),
        ('checkbox', 'Checkboxes'),
        ('yes_no', 'Yes/No'),
        ('file', 'File Upload'),
    ]


    name = models.CharField(max_length=100)
    input_type = models.CharField(max_length=50, choices=INPUT_TYPE_CHOICES)
    has_options = models.BooleanField(default=False, help_text="Does this field requre options (for dropsowns, radio, checkboxes)?")
    default_validations  =models.JSONField(default=dict, blank=True)
    icon = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
    def __str__(self):
        return self.name
    

class Form(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')  # ◄── This line
    is_multi_section = models.BooleanField(default=False)
    success_message = models.TextField(default="Thank you for your submission!", blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_forms')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class FormSection(models.Model):
    """Optional sections for organizing form fields"""
    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='sections')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveBigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.form_name} - {self.title}"
    
class FormField(models.Model):
    """
    Individual fields withing a form
    """

    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='fields')
    section = models.ForeignKey(FormSection, on_delete=models.SET_NULL, null=True, blank=True, related_name='fields')
    field_type = models.ForeignKey(FieldType, on_delete=models.PROTECT, related_name='form_fields')
    label = models.CharField(max_length=300)
    help_text = models.TextField(blank=True)
    placeholder = models.CharField(max_length=200, blank=True)
    is_required = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    options = models.JSONField(default=dict, blank=True, help_text="Options for select/radio/checkbox fields")
    validations = models.JSONField(default=dict, blank=True, help_text="Validation rules")
    conditional_logic = models.JSONField(default=dict, blank=True, help_text="Show/hide conditions")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.form.name} - {self.label}"

class FormSubmission(models.Model):
    """A completed form submission"""
    
    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='submissions')
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='form_submissions')
    submitted_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f"{self.form.name} - {self.submitted_at.strftime('%Y-%m-%d %H:%M')}"


class FormFieldValue(models.Model):
    """Individual field values within a submission"""
    
    submission = models.ForeignKey(FormSubmission, on_delete=models.CASCADE, related_name='values')
    field = models.ForeignKey(FormField, on_delete=models.CASCADE, related_name='values')
    value = models.TextField(blank=True)
    
    class Meta:
        ordering = ['field__order']
    
    def __str__(self):
        return f"{self.field.label}: {self.value[:50]}"