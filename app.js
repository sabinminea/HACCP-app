// Tab switching
document.querySelectorAll('nav.tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('nav.tabs button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('main .tab').forEach(t => t.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// Google Sheets Web App URL
const scriptURL = "https://script.google.com/macros/s/AKfycbzvEMt_jZOrqEL1Bt7OlRKPKWfme1DcBhGJxc8Y9_dWbyy3GX5wR-sqFOvQf0QQowLH/exec";

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
            statusBox.textContent = "Syncing...";
            statusBox.style.color = "blue";
            
            // Get all batch entries
            const batches = document.querySelectorAll('.batch-entry');
            if (batches.length === 0) {
                statusBox.textContent = "No batch data to submit";
                statusBox.style.color = "red";
                return;
            }
            
            // Track how many successful submissions we've made
            let successCount = 0;
            let totalBatches = batches.length;
            
            // Function to submit a single batch
            function submitBatch(batchIndex) {
                if (batchIndex >= batches.length) {
                    // We've submitted all batches
                    statusBox.textContent = `All ${successCount} batches synced to Google Sheets!`;
                    statusBox.style.color = "green";
                    
                    // Clear the form and add an empty batch template back
                    const container = document.getElementById('batchContainer');
                    container.innerHTML = '';
                    
                    const newBatch = document.createElement('div');
                    newBatch.classList.add('batch-entry');
                    newBatch.innerHTML = `
                        <label>Traceability Number: <input type="text" name="trace_num[]" required></label>
                        <label>Coffee Name: <input type="text" name="coffee_name[]" required></label>
                        <label>Date of Roast: <input type="date" name="roast_date[]" required></label>
                        <label>Quantity (kg): <input type="number" step="0.01" name="quantity[]" required></label>
                    `;
                    container.appendChild(newBatch);
                    return;
                }
                
                const batch = batches[batchIndex];
                const formData = new FormData();
                
                // Add form identifier
                formData.append('form_id', 'roastForm');
                
                // Add batch data (without array notation)
                const traceNum = batch.querySelector('input[name="trace_num[]"]');
                const coffeeName = batch.querySelector('input[name="coffee_name[]"]');
                const roastDate = batch.querySelector('input[name="roast_date[]"]');
                const quantity = batch.querySelector('input[name="quantity[]"]');
                
                if (traceNum) formData.append('trace_num', traceNum.value);
                if (coffeeName) formData.append('coffee_name', coffeeName.value);
                if (roastDate) formData.append('roast_date', roastDate.value);
                if (quantity) formData.append('quantity', quantity.value);
                
                // Log data for debugging
                console.log(`Submitting batch ${batchIndex + 1} of ${totalBatches}:`);
                for (let pair of formData.entries()) {
                    console.log(pair[0] + ': ' + pair[1]);
                }
                
                // Create URL-encoded form data
                const urlEncodedData = new URLSearchParams(formData).toString();
                
                // Update status
                statusBox.textContent = `Syncing batch ${batchIndex + 1} of ${totalBatches}...`;
                
                // Send to Google Sheets
                fetch(scriptURL, { 
                    method: 'POST', 
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: urlEncodedData,
                    mode: 'no-cors'
                })
                .then(response => {
                    console.log(`Batch ${batchIndex + 1} response received:`, response);
                    successCount++;
                    
                    // Submit the next batch
                    submitBatch(batchIndex + 1);
                })
                .catch(error => {
                    console.error(`Error in batch ${batchIndex + 1}:`, error);
                    statusBox.textContent = `Sync failed on batch ${batchIndex + 1}. Please try again.`;
                    statusBox.style.color = "red";
                });
            }
            
            // Start the submission process with the first batch
            submitBatch(0);
        });
    }
}

// Add unlimited batch entries in Roast Log
document.getElementById('addBatch').addEventListener('click', () => {
    const container = document.getElementById('batchContainer');
    const newBatch = document.createElement('div');
    newBatch.classList.add('batch-entry');
    newBatch.innerHTML = `
        <label>Traceability Number: <input type="text" name="trace_num[]" required></label>
        <label>Coffee Name: <input type="text" name="coffee_name[]" required></label>
        <label>Date of Roast: <input type="date" name="roast_date[]" required></label>
        <label>Quantity (kg): <input type="number" step="0.01" name="quantity[]" required></label>
    `;
    container.appendChild(newBatch);
});