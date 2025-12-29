// Conditional logic handling
function evaluateConditions() {
    document.querySelectorAll('.field-wrapper').forEach(wrapper => {
        const fieldId = wrapper.dataset.fieldId;
        const conditional = fieldConditions[fieldId];
        
        // If no conditional logic, always show
        if (!conditional || Object.keys(conditional).length === 0) {
            wrapper.style.display = 'block';
            return;
        }
        
        // If no rules, always show
        if (!conditional.rules || conditional.rules.length === 0) {
            wrapper.style.display = 'block';
            return;
        }
        
        // Evaluate each rule
        const results = [];
        
        conditional.rules.forEach(rule => {
            const targetField = document.querySelector(`[name="field_${rule.field_id}"]`);
            if (!targetField) {
                results.push(false);
                return;
            }
            
            let fieldValue = '';
            if (targetField.type === 'radio') {
                const checked = document.querySelector(`[name="field_${rule.field_id}"]:checked`);
                fieldValue = checked ? checked.value : '';
            } else {
                fieldValue = targetField.value;
            }
            
            let result = false;
            switch (rule.operator) {
                case 'equals':
                    result = fieldValue === rule.value;
                    break;
                case 'not_equals':
                    result = fieldValue !== rule.value;
                    break;
                case 'contains':
                    result = fieldValue.includes(rule.value);
                    break;
                case 'is_empty':
                    result = fieldValue === '';
                    break;
                case 'is_not_empty':
                    result = fieldValue !== '';
                    break;
            }
            
            results.push(result);
        });
        
        // Determine if field should show based on logic type
        let shouldShow = false;
        if (conditional.logic_type === 'AND') {
            shouldShow = results.every(r => r === true);
        } else {
            shouldShow = results.some(r => r === true);
        }
        
        // Show or hide the field
        wrapper.style.display = shouldShow ? 'block' : 'none';
        
        // Handle required attribute
        const inputs = wrapper.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (!shouldShow) {
                input.dataset.wasRequired = input.hasAttribute('required');
                input.removeAttribute('required');
            } else if (input.dataset.wasRequired === 'true') {
                input.setAttribute('required', 'required');
            }
        });
    });
}

// Run on page load
document.addEventListener('DOMContentLoaded', function() {
    evaluateConditions();
    
    // Add change listeners to all inputs
    document.querySelectorAll('input, select, textarea').forEach(el => {
        el.addEventListener('change', evaluateConditions);
        el.addEventListener('input', evaluateConditions);
    });
});