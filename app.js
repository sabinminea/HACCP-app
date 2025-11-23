// Tab switching
document.querySelectorAll('nav.tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('nav.tabs button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('main .tab').forEach(t => t.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// Auto-open calendar when date input is focused
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners to all date inputs
    document.querySelectorAll('input[type="date"]').forEach(dateInput => {
        dateInput.addEventListener('focus', function() {
            // Trigger the calendar to open
            try {
                this.showPicker();
            } catch (e) {
                // showPicker() might not be supported in all browsers
                // Fallback: try clicking the input
                this.click();
            }
        });
    });
});

// Google Sheets Web App URL
const scriptURL = "https://script.google.com/macros/s/AKfycbwV78ySObn8p9qdKd0wHUB-9H3ecxJMb0gpW4LBwe9L2jS-gDiAOqp3xQ0cKP2Nkg/exec";

// Store coffee data globally
let coffeeData = {};

// Fetch existing coffee data and refresh all dropdowns
function loadCoffeeData() {
    const refreshStatus = document.getElementById('refreshStatus');
    if (refreshStatus) {
        refreshStatus.textContent = 'Loading coffee data...';
        refreshStatus.style.color = '#2196F3';
    }
    
    fetch(scriptURL + '?action=getCoffeeData', {
        method: 'GET'
    })
        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response OK:', response.ok);
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.result === 'success' && data.data) {
                // Clear and recreate the coffee data map
                coffeeData = {};
                
                // Get all coffee select dropdowns
                const coffeeSelects = document.querySelectorAll('.coffee-name-input');
                
                // First, populate the coffeeData map
                data.data.forEach(item => {
                    coffeeData[item.coffeeName] = item.traceNum;
                });
                
                console.log('Loaded coffee data:', coffeeData);
                console.log('Total unique coffees:', Object.keys(coffeeData).length);
                
                // Now update all dropdowns
                coffeeSelects.forEach(select => {
                    // Store the current selection
                    const currentValue = select.value;
                    
                    // Remove all options except the first two (placeholder and "Add New")
                    while (select.options.length > 2) {
                        select.remove(2);
                    }
                    
                    // Add all coffee names from coffeeData
                    for (let coffeeName in coffeeData) {
                        const option = document.createElement('option');
                        option.value = coffeeName;
                        option.textContent = coffeeName;
                        // Insert before the last option (which is "+ Add New Coffee")
                        select.insertBefore(option, select.options[select.options.length - 1]);
                    }
                    
                    // Restore previous selection if it still exists
                    if (currentValue && currentValue !== '' && currentValue !== '__NEW__') {
                        if (coffeeData[currentValue]) {
                            select.value = currentValue;
                        }
                    }
                });
                
                if (refreshStatus) {
                    refreshStatus.textContent = `✓ Loaded ${Object.keys(coffeeData).length} coffees`;
                    refreshStatus.style.color = '#4CAF50';
                    setTimeout(() => {
                        refreshStatus.textContent = '';
                    }, 3000);
                }
            } else {
                if (refreshStatus) {
                    refreshStatus.textContent = 'No coffee data found';
                    refreshStatus.style.color = '#FF9800';
                }
            }
        })
        .catch(error => {
            console.error('Error loading coffee data:', error);
            if (refreshStatus) {
                refreshStatus.textContent = '⚠ Error loading data';
                refreshStatus.style.color = '#f44336';
            }
        });
}

// Call loadCoffeeData when page loads
loadCoffeeData();

// Add refresh button handler
document.addEventListener('DOMContentLoaded', function() {
    const refreshButton = document.getElementById('refreshCoffeeList');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            console.log('Refreshing coffee list...');
            loadCoffeeData();
        });
    }
});

// Function to setup auto-fill for a batch entry
function setupBatchAutoFill(batchEntry) {
    const coffeeSelect = batchEntry.querySelector('.coffee-name-input');
    const newCoffeeInput = batchEntry.querySelector('.new-coffee-input');
    const traceNumInput = batchEntry.querySelector('.trace-num-input');
    
    if (coffeeSelect && traceNumInput) {
        coffeeSelect.addEventListener('change', function() {
            const selectedValue = this.value;
            
            console.log('Coffee selected:', selectedValue);
            
            if (selectedValue === '__NEW__') {
                // Show the new coffee input field
                if (newCoffeeInput) {
                    newCoffeeInput.style.display = 'block';
                    newCoffeeInput.required = true;
                    newCoffeeInput.value = ''; // Clear any previous input
                    this.required = false;
                }
                // Clear and enable trace number field
                traceNumInput.value = '';
                traceNumInput.readOnly = false;
                traceNumInput.style.backgroundColor = '';
                console.log('New coffee mode activated');
            } else if (selectedValue === '') {
                // Nothing selected
                if (newCoffeeInput) {
                    newCoffeeInput.style.display = 'none';
                    newCoffeeInput.required = false;
                    this.required = true;
                }
                traceNumInput.value = '';
                traceNumInput.readOnly = false;
                traceNumInput.style.backgroundColor = '';
                console.log('Selection cleared');
            } else {
                // Existing coffee selected
                if (newCoffeeInput) {
                    newCoffeeInput.style.display = 'none';
                    newCoffeeInput.required = false;
                    newCoffeeInput.value = '';
                    this.required = true;
                }
                
                // Auto-fill trace number if available
                if (coffeeData[selectedValue]) {
                    traceNumInput.value = coffeeData[selectedValue];
                    traceNumInput.style.backgroundColor = '#e8f5e9'; // Light green
                    traceNumInput.readOnly = false; // Allow manual override
                    console.log('Auto-filled trace number:', coffeeData[selectedValue]);
                } else {
                    console.log('No trace number found for:', selectedValue);
                    traceNumInput.value = '';
                    traceNumInput.style.backgroundColor = '';
                }
            }
        });
        
        // Handle new coffee input
        if (newCoffeeInput) {
            newCoffeeInput.addEventListener('input', function() {
                // Keep the select on __NEW__ option
                if (coffeeSelect.value !== '__NEW__') {
                    coffeeSelect.value = '__NEW__';
                }
            });
        }
        
        // Allow manual editing of trace number
        traceNumInput.addEventListener('input', function() {
            this.style.backgroundColor = ''; // Remove highlight when manually edited
        });
    }
}

// Setup auto-fill for the initial batch entry
document.addEventListener('DOMContentLoaded', function() {
    const initialBatch = document.querySelector('.batch-entry');
    if (initialBatch) {
        setupBatchAutoFill(initialBatch);
    }
});

// Form submission handler
function handleForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const statusBox = document.getElementById(formId.replace('Form', 'Status'));
    if (!statusBox) return;

    form.addEventListener('submit', e => {
        e.preventDefault();
        statusBox.textContent = "Syncing...";
        statusBox.style.color = "blue";

        // Create a new FormData object
        const formData = new FormData(form);
        
        // Log data for debugging
        console.log("Form data being sent:");
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }
        
        // Handle form identifier - add formId to help identify the form type on server
        formData.append('form_id', formId);
        
        // Create URL-encoded form data
        const urlEncodedData = new URLSearchParams(formData).toString();
        console.log("URL encoded data:", urlEncodedData);
        
        // Go back to using fetch, but with mode: 'no-cors'
        fetch(scriptURL, { 
            method: 'POST', 
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: urlEncodedData,
            mode: 'no-cors'
        })
        .then(response => {
            console.log("Response received:", response);
            // With no-cors mode, we can't read the response
            // but at least the request should go through
            statusBox.textContent = "Synced to Google Sheets!";
            statusBox.style.color = "green";
            form.reset();
        })
        .catch(error => {
            console.error("Error details:", error);
            statusBox.textContent = "Sync failed. Please try again.";
            statusBox.style.color = "red";
        });
    });
}

handleForm('dailyForm');
handleForm('monthlyForm');

// Special handler for Roast Log form (with array fields)
const roastForm = document.getElementById('roastForm');
if (roastForm) {
    const statusBox = document.getElementById('roastStatus');
    if (statusBox) {
        roastForm.addEventListener('submit', e => {
            e.preventDefault();
            statusBox.textContent = "Preparing to sync...";
            statusBox.style.color = "blue";
            
            // Get all batch entries
            const batches = document.querySelectorAll('.batch-entry');
            if (batches.length === 0) {
                statusBox.textContent = "No batch data to submit";
                statusBox.style.color = "red";
                return;
            }
            
            try {
                // Process all batches sequentially with a single sync at the end
                statusBox.textContent = "Syncing all batches to Google Sheets...";
                
                // For each batch, create and submit a separate request
                let batchIndex = 0;
                
                function processNextBatch() {
                    if (batchIndex >= batches.length) {
                        // All batches processed
                        statusBox.textContent = `All ${batches.length} batches successfully synced to Google Sheets!`;
                        statusBox.style.color = "green";
                        
                        // Reload coffee data to include newly added coffees
                        loadCoffeeData();
                        
                        // Clear the form and add an empty batch template back
                        const container = document.getElementById('batchContainer');
                        container.innerHTML = '';
                        
                        const newBatch = document.createElement('div');
                        newBatch.classList.add('batch-entry');
                        newBatch.innerHTML = `
                            <label>Coffee Name: 
                                <select name="coffee_name[]" class="coffee-name-input" required>
                                    <option value="">-- Select or type new coffee --</option>
                                    <option value="__NEW__">+ Add New Coffee</option>
                                </select>
                            </label>
                            <label>Or Enter New Coffee Name: 
                                <input type="text" class="new-coffee-input" placeholder="Type new coffee name here" style="display:none;">
                            </label>
                            <label>Traceability Number: <input type="text" name="trace_num[]" class="trace-num-input" required></label>
                            <label>Date of Roast: <input type="date" name="roast_date[]" required></label>
                            <label>Quantity (kg): <input type="number" step="0.01" name="quantity[]" required></label>
                        `;
                        container.appendChild(newBatch);
                        
                        // Setup auto-fill for the new batch entry
                        setupBatchAutoFill(newBatch);
                        
                        // Reload coffee data to populate the dropdown
                        setTimeout(() => loadCoffeeData(), 500);
                        
                        return;
                    }
                    
                    const batch = batches[batchIndex];
                    
                    // Create form data for this batch
                    const formData = new FormData();
                    formData.append('form_id', 'roastForm');
                    formData.append('batch_index', batchIndex);
                    
                    // Get batch data
                    const coffeeSelect = batch.querySelector('select[name="coffee_name[]"]');
                    const newCoffeeInput = batch.querySelector('.new-coffee-input');
                    const traceNum = batch.querySelector('input[name="trace_num[]"]');
                    const roastDate = batch.querySelector('input[name="roast_date[]"]');
                    const quantity = batch.querySelector('input[name="quantity[]"]');
                    
                    // Determine the coffee name
                    let coffeeName = '';
                    if (coffeeSelect && coffeeSelect.value === '__NEW__' && newCoffeeInput) {
                        coffeeName = newCoffeeInput.value;
                    } else if (coffeeSelect) {
                        coffeeName = coffeeSelect.value;
                    }
                    
                    if (coffeeName) formData.append('coffee_name', coffeeName);
                    if (traceNum) formData.append('trace_num', traceNum.value);
                    if (roastDate) formData.append('roast_date', roastDate.value);
                    if (quantity) formData.append('quantity', quantity.value);
                    
                    // Create URL-encoded form data
                    const urlEncodedData = new URLSearchParams(formData).toString();
                    
                    console.log(`Submitting batch ${batchIndex + 1} of ${batches.length}:`, urlEncodedData);
                    statusBox.textContent = `Syncing batch ${batchIndex + 1} of ${batches.length}...`;
                    
                    // Submit this batch
                    fetch(scriptURL, { 
                        method: 'POST', 
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: urlEncodedData,
                        mode: 'no-cors'
                    })
                    .then(response => {
                        console.log(`Batch ${batchIndex + 1} response:`, response);
                        
                        // Move to next batch
                        batchIndex++;
                        setTimeout(processNextBatch, 500); // Small delay between submissions
                    })
                    .catch(error => {
                        console.error(`Error submitting batch ${batchIndex + 1}:`, error);
                        statusBox.textContent = `Error submitting batch ${batchIndex + 1}. Please try again.`;
                        statusBox.style.color = "red";
                    });
                }
                
                // Start processing the batches
                processNextBatch();
                
            } catch (error) {
                console.error("Error processing batches:", error);
                statusBox.textContent = "Error processing batches. Please try again.";
                statusBox.style.color = "red";
            }
        });
    }
}

// Add unlimited batch entries in Roast Log
document.getElementById('addBatch').addEventListener('click', () => {
    const container = document.getElementById('batchContainer');
    const newBatch = document.createElement('div');
    newBatch.classList.add('batch-entry');
    newBatch.innerHTML = `
        <label>Coffee Name: 
            <select name="coffee_name[]" class="coffee-name-input" required>
                <option value="">-- Select or type new coffee --</option>
                <option value="__NEW__">+ Add New Coffee</option>
            </select>
        </label>
        <label>Or Enter New Coffee Name: 
            <input type="text" class="new-coffee-input" placeholder="Type new coffee name here" style="display:none;">
        </label>
        <label>Traceability Number: <input type="text" name="trace_num[]" class="trace-num-input" required></label>
        <label>Date of Roast: <input type="date" name="roast_date[]" required></label>
        <label>Quantity (kg): <input type="number" step="0.01" name="quantity[]" required></label>
    `;
    container.appendChild(newBatch);
    
    // Setup auto-fill for the new batch entry
    setupBatchAutoFill(newBatch);
    
    // Populate the dropdown with existing coffee data
    if (Object.keys(coffeeData).length > 0) {
        const select = newBatch.querySelector('.coffee-name-input');
        for (let coffeeName in coffeeData) {
            const option = document.createElement('option');
            option.value = coffeeName;
            option.textContent = coffeeName;
            select.insertBefore(option, select.options[select.options.length - 1]);
        }
    }
});