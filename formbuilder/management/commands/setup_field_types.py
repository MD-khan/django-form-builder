from django.core.management.base import BaseCommand
from formbuilder.models import FieldType


class Command(BaseCommand):
    help = 'Creates default field types for the form builder'

    def handle(self, *args, **options):
        field_types = [
            {
                'name': 'Short Text',
                'input_type': 'text',
                'has_options': False,
                'default_validations': {'max_length': 255},
                'icon': 'ki-text',
            },
            {
                'name': 'Long Text',
                'input_type': 'textarea',
                'has_options': False,
                'default_validations': {},
                'icon': 'ki-document',
            },
            {
                'name': 'Email',
                'input_type': 'email',
                'has_options': False,
                'default_validations': {'pattern': 'email'},
                'icon': 'ki-sms',
            },
            {
                'name': 'Phone Number',
                'input_type': 'tel',
                'has_options': False,
                'default_validations': {'pattern': 'phone'},
                'icon': 'ki-phone',
            },
            {
                'name': 'Number',
                'input_type': 'number',
                'has_options': False,
                'default_validations': {},
                'icon': 'ki-number',
            },
            {
                'name': 'Date',
                'input_type': 'date',
                'has_options': False,
                'default_validations': {},
                'icon': 'ki-calendar',
            },
            {
                'name': 'Dropdown',
                'input_type': 'select',
                'has_options': True,
                'default_validations': {},
                'icon': 'ki-arrow-down',
            },
            {
                'name': 'Radio Buttons',
                'input_type': 'radio',
                'has_options': True,
                'default_validations': {},
                'icon': 'ki-check-circle',
            },
            {
                'name': 'Checkboxes',
                'input_type': 'checkbox',
                'has_options': True,
                'default_validations': {},
                'icon': 'ki-check-square',
            },
            {
                'name': 'Yes/No',
                'input_type': 'yes_no',
                'has_options': False,
                'default_validations': {},
                'icon': 'ki-toggle-on',
            },
            {
                'name': 'File Upload',
                'input_type': 'file',
                'has_options': False,
                'default_validations': {'max_size_mb': 10},
                'icon': 'ki-file-up',
            },
        ]

        created_count = 0
        for ft in field_types:
            obj, created = FieldType.objects.get_or_create(
                name=ft['name'],
                defaults={
                    'input_type': ft['input_type'],
                    'has_options': ft['has_options'],
                    'default_validations': ft['default_validations'],
                    'icon': ft['icon'],
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created: {ft["name"]}'))
            else:
                self.stdout.write(f'Already exists: {ft["name"]}')

        self.stdout.write(self.style.SUCCESS(f'\nDone! Created {created_count} new field types.'))