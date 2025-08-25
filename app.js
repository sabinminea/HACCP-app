// Tab switching
document.querySelectorAll('nav.tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('nav.tabs button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('main .tab').forEach(t => t.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

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

        fetch(scriptURL, { method: 'POST', body: new FormData(form) })
            .then(response => {
                statusBox.textContent = "Synced to Google Sheets!";
                statusBox.style.color = "green";
                form.reset();
            })
            .catch(error => {
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