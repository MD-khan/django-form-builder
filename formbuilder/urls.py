from django.urls import path
from . import views

app_name = 'formbuilder'

urlpatterns = [
    # Form builder admin views
    path('', views.form_list, name='form_list'),
    path('create/', views.form_create, name='form_create'),
    path('<int:pk>/edit/', views.form_edit, name='form_edit'),
    path('<int:pk>/delete/', views.form_delete, name='form_delete'),
    path('<int:pk>/submissions/', views.form_submissions, name='form_submissions'),
    
    # Public form views
    path('f/<slug:slug>/', views.form_display, name='form_display'),
    path('f/<slug:slug>/submit/', views.form_submit, name='form_submit'),
    path('f/<slug:slug>/success/', views.form_success, name='form_success'),
    
    # API endpoints - Forms
    path('api/forms/<int:pk>/update/', views.api_update_form, name='api_update_form'),
    
    # API endpoints - Sections
    path('api/forms/<int:pk>/sections/add/', views.api_add_section, name='api_add_section'),
    path('api/sections/<int:pk>/', views.api_get_section, name='api_get_section'),
    path('api/sections/<int:pk>/update/', views.api_update_section, name='api_update_section'),
    path('api/sections/<int:pk>/delete/', views.api_delete_section, name='api_delete_section'),
    
    # API endpoints - Fields
    path('api/forms/<int:pk>/fields/add/', views.api_add_field, name='api_add_field'),
    path('api/forms/<int:pk>/fields/reorder/', views.api_reorder_fields, name='api_reorder_fields'),
    path('api/fields/<int:pk>/', views.api_get_field, name='api_get_field'),
    path('api/fields/<int:pk>/update/', views.api_update_field, name='api_update_field'),
    path('api/fields/<int:pk>/delete/', views.api_delete_field, name='api_delete_field'),
]