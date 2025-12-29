// Form Builder JavaScript

let formId = null;
let csrfToken = null;
let existingFields = [];
let existingSections = [];

// Initialize the form builder
function initFormBuilder(config) {
    formId = config.formId;
    csrfToken = config.csrfToken;
    existingFields = config.existingFields || [];
    existingSections = config.existingSections || [];
    
    setupFieldTypeCards();
    setupAddFieldModal();
    setupEditFieldModal();
    setupDeleteButtons();
    setupSettingsButton();
    setupSortable();
    setupSectionHandlers();
}

// Create condition rule HTML
function createConditionRule(prefix, fields, existingRule = null) {
    const ruleId = Date.now();
    const fieldOptions = fields.map(f => 
        `<option value="${f.id}" ${existingRule && existingRule.field_id == f.id ? 'selected' : ''}>${f.label}</option>`
    ).join('');
    
    const html = `
        <div class="condition-rule mb-2 p-2 border rounded" data-rule-id="${ruleId}">
            <div class="row g-2">
                <div class="col-md-4">
                    <select class="form-select form-select-sm condition-field" data-rule-id="${ruleId}">
                        <option value="">Select field...</option>
                        ${fieldOptions}
                    </select>
                </div>
                <div class="col-md-3">
                    <select class="form-select form-select-sm condition-operator" data-rule-id="${ruleId}">
                        <option value="equals" ${existingRule && existingRule.operator == 'equals' ? 'selected' : ''}>equals</option>
                        <option value="not_equals" ${existingRule && existingRule.operator == 'not_equals' ? 'selected' : ''}>not equals</option>
                        <option value="contains" ${existingRule && existingRule.operator == 'contains' ? 'selected' : ''}>contains</option>
                        <option value="is_empty" ${existingRule && existingRule.operator == 'is_empty' ? 'selected' : ''}>is empty</option>
                        <option value="is_not_empty" ${existingRule && existingRule.operator == 'is_not_empty' ? 'selected' : ''}>is not empty</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <input type="text" class="form-control form-control-sm condition-value" data-rule-id="${ruleId}" placeholder="Value" value="${existingRule ? existingRule.value || '' : ''}">
                </div>
                <div class="col-md-1">
                    <button type="button" class="btn btn-sm btn-outline-danger remove-condition" data-rule-id="${ruleId}">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    return html;
}

// Update value field based on selected field
function updateValueField(ruleElement, fields) {
    const fieldId = ruleElement.querySelector('.condition-field').value;
    const valueContainer = ruleElement.querySelector('.condition-value').parentElement;
    const field = fields.find(f => f.id == fieldId);
    
    if (!field) return;
    
    let valueHtml = '';
    if (field.input_type === 'yes_no') {
        valueHtml = `
            <select class="form-select form-select-sm condition-value" data-rule-id="${ruleElement.dataset.ruleId}">
                <option value="Yes">Yes</option>
                <option value="No">No</option>
            </select>
        `;
    } else if (['select', 'radio', 'checkbox'].includes(field.input_type) && field.options && field.options.choices) {
        const options = field.options.choices.map(c => `<option value="${c.value}">${c.label}</option>`).join('');
        valueHtml = `
            <select class="form-select form-select-sm condition-value" data-rule-id="${ruleElement.dataset.ruleId}">
                ${options}
            </select>
        `;
    } else {
        valueHtml = `<input type="text" class="form-control form-control-sm condition-value" data-rule-id="${ruleElement.dataset.ruleId}" placeholder="Value">`;
    }
    
    valueContainer.innerHTML = valueHtml;
}

// Toggle logic type visibility
function updateLogicTypeVisibility(prefix) {
    const rulesContainer = document.getElementById(prefix + 'condition-rules');
    const logicTypeGroup = document.getElementById(prefix + 'logic-type-group');
    if (!rulesContainer || !logicTypeGroup) return;
    
    const ruleCount = rulesContainer.querySelectorAll('.condition-rule').length;
    logicTypeGroup.style.display = ruleCount > 1 ? 'block' : 'none';
}

// Collect conditional logic data
function collectConditionalLogic(prefix) {
    const enableCheckbox = document.getElementById(prefix + 'enable-conditional');
    if (!enableCheckbox || !enableCheckbox.checked) return {};
    
    const rules = [];
    document.querySelectorAll('#' + prefix + 'condition-rules .condition-rule').forEach(rule => {
        const fieldId = rule.querySelector('.condition-field').value;
        const operator = rule.querySelector('.condition-operator').value;
        const value = rule.querySelector('.condition-value').value;
        
        if (fieldId) {
            rules.push({
                field_id: parseInt(fieldId),
                operator: operator,
                value: value
            });
        }
    });
    
    if (rules.length === 0) return {};
    
    const logicType = document.querySelector(`input[name="${prefix}logic_type"]:checked`)?.value || 'AND';
    
    return {
        action: 'show',
        logic_type: logicType,
        rules: rules
    };
}

// Setup field type cards click handlers
function setupFieldTypeCards() {
    document.querySelectorAll('.field-card').forEach(card => {
        card.addEventListener('click', function() {
            const fieldTypeId = this.dataset.fieldTypeId;
            const fieldTypeName = this.dataset.fieldTypeName;
            const hasOptions = this.dataset.hasOptions === 'true';
            
            document.getElementById('field-type-id').value = fieldTypeId;
            document.getElementById('field-type-name').value = fieldTypeName;
            document.getElementById('field-label').value = '';
            document.getElementById('field-help').value = '';
            document.getElementById('field-placeholder').value = '';
            document.getElementById('field-options').value = '';
            document.getElementById('field-required').checked = false;
            document.getElementById('field-section').value = '';
            document.getElementById('enable-conditional').checked = false;
            document.getElementById('conditional-logic-section').style.display = 'none';
            document.getElementById('condition-rules').innerHTML = '';
            
            document.getElementById('options-group').style.display = hasOptions ? 'block' : 'none';
            
            new bootstrap.Modal(document.getElementById('addFieldModal')).show();
        });
    });
}

// Setup add field modal
function setupAddFieldModal() {
    // Toggle conditional logic section
    document.getElementById('enable-conditional').addEventListener('change', function() {
        document.getElementById('conditional-logic-section').style.display = this.checked ? 'block' : 'none';
    });
    
    // Add condition rule
    document.getElementById('add-condition-rule').addEventListener('click', function() {
        const container = document.getElementById('condition-rules');
        container.insertAdjacentHTML('beforeend', createConditionRule('', existingFields));
        updateLogicTypeVisibility('');
        
        const newRule = container.lastElementChild;
        newRule.querySelector('.condition-field').addEventListener('change', function() {
            updateValueField(newRule, existingFields);
        });
    });
    
    // Remove condition rule
    document.getElementById('condition-rules').addEventListener('click', function(e) {
        if (e.target.closest('.remove-condition')) {
            e.target.closest('.condition-rule').remove();
            updateLogicTypeVisibility('');
        }
    });
    
    // Save new field
    document.getElementById('save-field').addEventListener('click', async function() {
        const fieldTypeId = document.getElementById('field-type-id').value;
        const label = document.getElementById('field-label').value;
        const helpText = document.getElementById('field-help').value;
        const placeholder = document.getElementById('field-placeholder').value;
        const options = document.getElementById('field-options').value;
        const isRequired = document.getElementById('field-required').checked;
        const sectionId = document.getElementById('field-section').value;
        const conditionalLogic = collectConditionalLogic('');
        
        if (!label) {
            alert('Please enter a label');
            return;
        }
        
        const response = await fetch(`/forms/api/forms/${formId}/fields/add/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                field_type_id: fieldTypeId,
                label: label,
                help_text: helpText,
                placeholder: placeholder,
                options: options,
                is_required: isRequired,
                section_id: sectionId || null,
                conditional_logic: conditionalLogic
            })
        });
        
        if (response.ok) {
            location.reload();
        } else {
            alert('Error adding field');
        }
    });
}

// Setup edit field modal
function setupEditFieldModal() {
    // Toggle conditional logic section
    document.getElementById('edit-enable-conditional').addEventListener('change', function() {
        document.getElementById('edit-conditional-logic-section').style.display = this.checked ? 'block' : 'none';
    });
    
    // Add condition rule
    document.getElementById('edit-add-condition-rule').addEventListener('click', function() {
        const container = document.getElementById('edit-condition-rules');
        const currentFieldId = document.getElementById('edit-field-id').value;
        const availableFields = existingFields.filter(f => f.id != currentFieldId);
        container.insertAdjacentHTML('beforeend', createConditionRule('edit-', availableFields));
        updateLogicTypeVisibility('edit-');
        
        const newRule = container.lastElementChild;
        newRule.querySelector('.condition-field').addEventListener('change', function() {
            updateValueField(newRule, availableFields);
        });
    });
    
    // Remove condition rule
    document.getElementById('edit-condition-rules').addEventListener('click', function(e) {
        if (e.target.closest('.remove-condition')) {
            e.target.closest('.condition-rule').remove();
            updateLogicTypeVisibility('edit-');
        }
    });
    
    // Edit field buttons
    document.querySelectorAll('.edit-field').forEach(btn => {
        btn.addEventListener('click', async function() {
            const fieldId = this.dataset.fieldId;
            
            const response = await fetch(`/forms/api/fields/${fieldId}/`);
            const field = await response.json();
            
            document.getElementById('edit-field-id').value = field.id;
            document.getElementById('edit-field-label').value = field.label;
            document.getElementById('edit-field-help').value = field.help_text || '';
            document.getElementById('edit-field-placeholder').value = field.placeholder || '';
            document.getElementById('edit-field-required').checked = field.is_required;
            document.getElementById('edit-field-section').value = field.section_id || '';
            
            if (field.has_options) {
                document.getElementById('edit-options-group').style.display = 'block';
                const optionsText = field.options.choices ? field.options.choices.map(c => c.label).join('\n') : '';
                document.getElementById('edit-field-options').value = optionsText;
            } else {
                document.getElementById('edit-options-group').style.display = 'none';
            }
            
            const rulesContainer = document.getElementById('edit-condition-rules');
            rulesContainer.innerHTML = '';
            
            const availableFields = existingFields.filter(f => f.id != fieldId);
            
            if (field.conditional_logic && field.conditional_logic.rules && field.conditional_logic.rules.length > 0) {
                document.getElementById('edit-enable-conditional').checked = true;
                document.getElementById('edit-conditional-logic-section').style.display = 'block';
                
                field.conditional_logic.rules.forEach(rule => {
                    rulesContainer.insertAdjacentHTML('beforeend', createConditionRule('edit-', availableFields, rule));
                });
                
                if (field.conditional_logic.logic_type === 'OR') {
                    document.getElementById('edit-logic-or').checked = true;
                } else {
                    document.getElementById('edit-logic-and').checked = true;
                }
                
                updateLogicTypeVisibility('edit-');
                
                rulesContainer.querySelectorAll('.condition-rule').forEach(rule => {
                    updateValueField(rule, availableFields);
                    rule.querySelector('.condition-field').addEventListener('change', function() {
                        updateValueField(rule, availableFields);
                    });
                });
            } else {
                document.getElementById('edit-enable-conditional').checked = false;
                document.getElementById('edit-conditional-logic-section').style.display = 'none';
            }
            
            new bootstrap.Modal(document.getElementById('editFieldModal')).show();
        });
    });
    
    // Update field
    document.getElementById('update-field').addEventListener('click', async function() {
        const fieldId = document.getElementById('edit-field-id').value;
        const label = document.getElementById('edit-field-label').value;
        const helpText = document.getElementById('edit-field-help').value;
        const placeholder = document.getElementById('edit-field-placeholder').value;
        const options = document.getElementById('edit-field-options').value;
        const isRequired = document.getElementById('edit-field-required').checked;
        const sectionId = document.getElementById('edit-field-section').value;
        const conditionalLogic = collectConditionalLogic('edit-');
        
        const response = await fetch(`/forms/api/fields/${fieldId}/update/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                label: label,
                help_text: helpText,
                placeholder: placeholder,
                options: options,
                is_required: isRequired,
                section_id: sectionId || null,
                conditional_logic: conditionalLogic
            })
        });
        
        if (response.ok) {
            location.reload();
        } else {
            alert('Error updating field');
        }
    });
}

// Setup delete buttons
function setupDeleteButtons() {
    document.querySelectorAll('.delete-field').forEach(btn => {
        btn.addEventListener('click', async function() {
            if (!confirm('Are you sure you want to delete this field?')) return;
            
            const fieldId = this.dataset.fieldId;
            
            const response = await fetch(`/forms/api/fields/${fieldId}/delete/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken
                }
            });
            
            if (response.ok) {
                location.reload();
            } else {
                alert('Error deleting field');
            }
        });
    });
}

// Setup settings button
function setupSettingsButton() {
    document.getElementById('save-settings').addEventListener('click', async function() {
        const status = document.getElementById('form-status').value;
        
        const response = await fetch(`/forms/api/forms/${formId}/update/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                status: status
            })
        });
        
        if (response.ok) {
            location.reload();
        } else {
            alert('Error saving settings');
        }
    });
}

// Setup drag and drop sorting
function setupSortable() {
    const canvas = document.getElementById('form-canvas');
    if (!canvas) return;
    
    // Sortable for main canvas (fields without section)
    new Sortable(canvas, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'bg-light',
        draggable: '.field-item',
        onEnd: async function(evt) {
            await saveFieldOrder();
        }
    });
    
    // Sortable for each section
    document.querySelectorAll('.section-fields').forEach(sectionEl => {
        new Sortable(sectionEl, {
            animation: 150,
            handle: '.drag-handle',
            ghostClass: 'bg-light',
            group: 'fields',
            draggable: '.field-item',
            onEnd: async function(evt) {
                await saveFieldOrder();
            }
        });
    });
}

// Save field order
async function saveFieldOrder() {
    const fieldItems = document.querySelectorAll('.field-item');
    const newOrder = [];
    
    fieldItems.forEach((item, index) => {
        newOrder.push({
            id: item.dataset.fieldId,
            order: index + 1
        });
    });
    
    const response = await fetch(`/forms/api/forms/${formId}/fields/reorder/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ fields: newOrder })
    });
    
    if (!response.ok) {
        alert('Error saving field order');
        location.reload();
    }
}

// Setup section handlers
function setupSectionHandlers() {
    // Add section button
    document.getElementById('add-section-btn').addEventListener('click', function() {
        document.getElementById('section-title').value = '';
        document.getElementById('section-description').value = '';
        new bootstrap.Modal(document.getElementById('addSectionModal')).show();
    });
    
    // Save new section
    document.getElementById('save-section').addEventListener('click', async function() {
        const title = document.getElementById('section-title').value;
        const description = document.getElementById('section-description').value;
        
        if (!title) {
            alert('Please enter a section title');
            return;
        }
        
        const response = await fetch(`/forms/api/forms/${formId}/sections/add/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                title: title,
                description: description
            })
        });
        
        if (response.ok) {
            location.reload();
        } else {
            alert('Error adding section');
        }
    });
    
    // Edit section buttons
    document.querySelectorAll('.edit-section').forEach(btn => {
        btn.addEventListener('click', async function() {
            const sectionId = this.dataset.sectionId;
            
            const response = await fetch(`/forms/api/sections/${sectionId}/`);
            const section = await response.json();
            
            document.getElementById('edit-section-id').value = section.id;
            document.getElementById('edit-section-title').value = section.title;
            document.getElementById('edit-section-description').value = section.description || '';
            
            new bootstrap.Modal(document.getElementById('editSectionModal')).show();
        });
    });
    
    // Update section
    document.getElementById('update-section').addEventListener('click', async function() {
        const sectionId = document.getElementById('edit-section-id').value;
        const title = document.getElementById('edit-section-title').value;
        const description = document.getElementById('edit-section-description').value;
        
        if (!title) {
            alert('Please enter a section title');
            return;
        }
        
        const response = await fetch(`/forms/api/sections/${sectionId}/update/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                title: title,
                description: description
            })
        });
        
        if (response.ok) {
            location.reload();
        } else {
            alert('Error updating section');
        }
    });
    
    // Delete section buttons
    document.querySelectorAll('.delete-section').forEach(btn => {
        btn.addEventListener('click', async function() {
            if (!confirm('Are you sure you want to delete this section? Fields in this section will be moved outside.')) return;
            
            const sectionId = this.dataset.sectionId;
            
            const response = await fetch(`/forms/api/sections/${sectionId}/delete/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken
                }
            });
            
            if (response.ok) {
                location.reload();
            } else {
                alert('Error deleting section');
            }
        });
    });
}