// Tab switching
document.querySelectorAll('nav.tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('nav.tabs button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('main .tab').forEach(t => t.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// Replace this URL with the new URL you get after redeploying your Google Script
const scriptURL = "https://script.google.com/macros/s/AKfycbwiRRpSDs4y4TJJXecpeqU9WfW_cLCmxic7tvwAc2rk841PQSQ_OQ0WOlZKxfJZTu0DgA/exec";

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
        // Convert FormData to JSON
        const jsonData = {};
        formData.forEach((value, key) => {
            jsonData[key] = value;
        });

        // Use JSONP approach to bypass CORS
        const script = document.createElement('script');
        const callback = 'callback_' + Math.floor(Math.random() * 100000);
        
        window[callback] = function(data) {
            delete window[callback];
            document.body.removeChild(script);
            
            if (data.result === 'success') {
                statusBox.textContent = "Synced to Google Sheets!";
                statusBox.style.color = "green";
                form.reset();
            } else {
                statusBox.textContent = "Sync failed. Please try again.";
                statusBox.style.color = "red";
            }
        };

        // Convert the URL to use JSONP
        let jsonpUrl = scriptURL + '?callback=' + callback;
        for (const key in jsonData) {
            jsonpUrl += `&${key}=${encodeURIComponent(jsonData[key])}`;
        }
        
        script.src = jsonpUrl;
        document.body.appendChild(script);
        
        script.onerror = function() {
            statusBox.textContent = "Sync failed. Please try again.";
            statusBox.style.color = "red";
            delete window[callback];
            document.body.removeChild(script);
        };
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