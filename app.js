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
const scriptURL = "https://script.google.com/macros/s/AKfycby20Z7DIW9JnW9nfl28XD6OyceRz42cHOsVMVSNFLTzf32rln6O9Tt5ouApJuKT9lms/exec";

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
handleForm('roastForm');

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