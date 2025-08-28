// Google Apps Script code for your sheet
function doPost(e) {
  try {
    // Get the sheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Log incoming data for debugging
    Logger.log("Received POST data: " + JSON.stringify(e.parameter));
    
    // Process form data
    var data = e.parameter;
    
    // Get headers from the first row
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Prepare row data
    var row = [];
    
    // Add timestamp
    var timestamp = new Date();
    row.push(timestamp);
    
    // Process each header and find matching data
    for (var i = 1; i < headers.length; i++) { // Start at 1 to skip timestamp column
      var header = headers[i];
      row.push(data[header] || "");
    }
    
    // Append the row
    sheet.appendRow(row);
    
    // Return success
    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  } catch(error) {
    // Log errors
    Logger.log("Error: " + error.toString());
    
    // Return error
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput("Google Apps Script is running!")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*');
}
