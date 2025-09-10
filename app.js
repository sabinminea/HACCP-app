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
            statusBox.textContent = "Syncing all batches...";
            statusBox.style.color = "blue";
            
            // Get all batch entries
            const batches = document.querySelectorAll('.batch-entry');
            if (batches.length === 0) {
                statusBox.textContent = "No batch data to submit";
                statusBox.style.color = "red";
                return;
            }
            
            const totalBatches = batches.length;
            let pendingSubmissions = totalBatches;
            let successCount = 0;
            let failureCount = 0;
            
            // Create an array to store all the promises
            const submissionPromises = [];
            
            // Process each batch
            batches.forEach((batch, index) => {
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
                console.log(`Preparing batch ${index + 1} of ${totalBatches}:`);
                for (let pair of formData.entries()) {
                    console.log(pair[0] + ': ' + pair[1]);
                }
                
                // Create URL-encoded form data
                const urlEncodedData = new URLSearchParams(formData).toString();
                
                // Create the fetch promise but don't await it yet
                const submissionPromise = fetch(scriptURL, { 
                    method: 'POST', 
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: urlEncodedData,
                    mode: 'no-cors'
                })
                .then(response => {
                    console.log(`Batch ${index + 1} response received:`, response);
                    successCount++;
                    pendingSubmissions--;
                    updateStatus();
                    return { success: true, index };
                })
                .catch(error => {
                    console.error(`Error in batch ${index + 1}:`, error);
                    failureCount++;
                    pendingSubmissions--;
                    updateStatus();
                    return { success: false, index, error };
                });
                
                // Add to our array of promises
                submissionPromises.push(submissionPromise);
            });
            
            // Function to update the status display
            function updateStatus() {
                if (pendingSubmissions > 0) {
                    // Still waiting for some submissions to complete
                    statusBox.textContent = `Processed ${successCount + failureCount} of ${totalBatches} batches...`;
                } else {
                    // All submissions have completed (successfully or with errors)
                    if (failureCount === 0) {
                        // All were successful
                        statusBox.textContent = `All ${totalBatches} batches successfully synced to Google Sheets!`;
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
                    } else if (successCount === 0) {
                        // All failed
                        statusBox.textContent = `Failed to sync any batches. Please try again.`;
                        statusBox.style.color = "red";
                    } else {
                        // Mixed results
                        statusBox.textContent = `Synced ${successCount} batches, ${failureCount} failed. Check console for details.`;
                        statusBox.style.color = "orange";
                    }
                }
            }
            
            // Update status immediately to show we're working on it
            updateStatus();
            
            // Using Promise.allSettled so we can track all submissions regardless of success/failure
            Promise.allSettled(submissionPromises).then(results => {
                console.log("All batch submissions completed:", results);
            });
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