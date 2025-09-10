// Google Apps Script code for HACCP App

// This function handles form submissions (POST requests)
function doPost(e) {
  try {
    // Log incoming data for debugging
    Logger.log("Received POST data: " + JSON.stringify(e.parameter));
    
    // Process form data
    var data = e.parameter;
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet;
    
    // Determine which sheet to use based on form data or form_id
    if (data.form_id === 'dailyForm' || data.daily_date) {
      Logger.log("Processing Daily Check form");
      sheet = spreadsheet.getSheetByName("Daily Checks") || spreadsheet.getSheets()[0];
    } else if (data.form_id === 'monthlyForm' || data.monthly_date) {
      Logger.log("Processing Monthly Pastry Check form");
      sheet = spreadsheet.getSheetByName("Monthly Pastry Check") || spreadsheet.getSheets()[0];
    } else if (data.form_id === 'roastForm' || data.roast_date || data['roast_date[]']) {
      Logger.log("Processing Roast Log form");
      sheet = spreadsheet.getSheetByName("Roast Log") || spreadsheet.getSheets()[0];
    } else {
      // Default to first sheet if we can't determine
      Logger.log("Could not determine form type, using default sheet");
      sheet = spreadsheet.getSheets()[0];
    }
    
    // If this is the first submission, create headers
    if (sheet.getLastRow() === 0) {
      createHeaders(sheet, data);
    }
    
    // Get headers from the first row
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log("Headers found: " + headers.join(", "));
    
    // Prepare row data
    var row = [];
    
    // Add timestamp as first column
    row.push(new Date());
    
    // Process each header (except timestamp) and find matching data
    for (var i = 1; i < headers.length; i++) {
      var header = headers[i];
      var value = "";
      
      // Check for array notation in form data
      if (data[header]) {
        value = data[header];
      } else if (data[header + '[]']) {
        // Handle array fields (for roast log)
        value = data[header + '[]'];
      }
      
      // Handle checkbox values which might be "on" or undefined
      if (header.startsWith("clean_") || header.includes("check")) {
        value = value === "on" ? "Yes" : "No";
      }
      
      row.push(value);
      Logger.log("Added value for " + header + ": " + value);
    }
    
    // Append the row
    sheet.appendRow(row);
    Logger.log("Row added successfully");
    
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

// This function handles testing (GET requests)
function doGet(e) {
  return ContentService
    .createTextOutput("Google Apps Script is running!")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*');
}

// This function creates headers for a new sheet based on the submitted data
function createHeaders(sheet, data) {
  var headers = ["timestamp"];
  
  // Add all keys from the data as headers
  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      headers.push(key);
    }
  }
  
  // Set the headers in the first row
  sheet.appendRow(headers);
  
  // Format the header row
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  sheet.setFrozenRows(1);
}

// This function is used to set up the script when first deployed
function setup() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create sheets if they don't exist
  if (!spreadsheet.getSheetByName("Daily Checks")) {
    var dailySheet = spreadsheet.insertSheet("Daily Checks");
    dailySheet.appendRow(["timestamp", "daily_date", "fridge1", "freezer1", "fridge2", "freezer2", 
                         "clean_floor", "clean_bar", "clean_windows", "daily_signed"]);
    dailySheet.getRange(1, 1, 1, 10).setFontWeight("bold");
    dailySheet.setFrozenRows(1);
  }
  
  if (!spreadsheet.getSheetByName("Monthly Pastry Check")) {
    var monthlySheet = spreadsheet.insertSheet("Monthly Pastry Check");
    monthlySheet.appendRow(["timestamp", "monthly_date", "pastry_name", "pastry_temp", "pastry_notes", 
                           "rodent_check", "insect_check", "pastry_signed"]);
    monthlySheet.getRange(1, 1, 1, 8).setFontWeight("bold");
    monthlySheet.setFrozenRows(1);
  }
  
  if (!spreadsheet.getSheetByName("Roast Log")) {
    var roastSheet = spreadsheet.insertSheet("Roast Log");
    // Use field names as in the form, with or without array notation
    roastSheet.appendRow(["timestamp", "trace_num", "coffee_name", "roast_date", "quantity", "form_id"]);
    roastSheet.getRange(1, 1, 1, 6).setFontWeight("bold");
    roastSheet.setFrozenRows(1);
  }
}
