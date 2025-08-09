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

    form.addEventListener('submit', e => {
        e.preventDefault();

        fetch(scriptURL, {
            method: 'POST',
            body: new FormData(form)
        })
        .then(response => {
            alert('Form submitted successfully!');
            form.reset();
        })
        .catch(error => {
            alert('Error submitting form: ' + error);
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