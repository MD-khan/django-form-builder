from django.contrib import admin
from .models import FieldType, Form, FormSection, FormField, FormSubmission, FormFieldValue


@admin.register(FieldType)
class FieldTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'input_type', 'has_options', 'is_active']
    list_filter = ['is_active', 'input_type']
    search_fields = ['name']


@admin.register(Form)
class FormAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'status', 'created_by', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(FormSection)
class FormSectionAdmin(admin.ModelAdmin):
    list_display = ['title', 'form', 'order']
    list_filter = ['form']


@admin.register(FormField)
class FormFieldAdmin(admin.ModelAdmin):
    list_display = ['label', 'form', 'field_type', 'is_required', 'order']
    list_filter = ['form', 'field_type', 'is_required']
    search_fields = ['label']


@admin.register(FormSubmission)
class FormSubmissionAdmin(admin.ModelAdmin):
    list_display = ['form', 'submitted_by', 'submitted_at']
    list_filter = ['form', 'submitted_at']


@admin.register(FormFieldValue)
class FormFieldValueAdmin(admin.ModelAdmin):
    list_display = ['submission', 'field', 'value']
    list_filter = ['submission__form']