// Google Apps Script code for HACCP App

// This function handles form submissions (POST requests)
function doPost(e) {
  try {
    // Log incoming data for debugging - detailed logging
    Logger.log("========================");
    Logger.log("NEW FORM SUBMISSION");
    Logger.log("========================");
    Logger.log("Received POST data: " + JSON.stringify(e.parameter));
    
    // Process form data
    var data = e.parameter;
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet;
    
    // Log all form data keys and values for debugging
    Logger.log("Form data details:");
    for (var key in data) {
      Logger.log("  " + key + ": " + data[key]);
    }
    
    // Determine which sheet to use based on form data or form_id
    var formType = "";
    
    if (data.form_id === 'dailyForm' || data.daily_date) {
      formType = "Daily Check";
      Logger.log("Processing Daily Check form");
      sheet = spreadsheet.getSheetByName("Daily Checks");
      if (!sheet) {
        Logger.log("Daily Checks sheet not found, running setup");
        setup();
        sheet = spreadsheet.getSheetByName("Daily Checks");
      }
    } else if (data.form_id === 'monthlyForm' || data.monthly_date) {
      formType = "Monthly Pastry Check";
      Logger.log("Processing Monthly Pastry Check form");
      sheet = spreadsheet.getSheetByName("Monthly Pastry Check");
      if (!sheet) {
        Logger.log("Monthly Pastry Check sheet not found, running setup");
        setup();
        sheet = spreadsheet.getSheetByName("Monthly Pastry Check");
      }
    } else if (data.form_id === 'roastForm' || data.roast_date || data['roast_date[]'] || 
              (data.trace_num && data.coffee_name)) {
      formType = "Roast Log";
      Logger.log("Processing Roast Log form");
      sheet = spreadsheet.getSheetByName("Roast Log");
      if (!sheet) {
        Logger.log("Roast Log sheet not found, running setup");
        setup();
        sheet = spreadsheet.getSheetByName("Roast Log");
      }
    } else {
      // Default to first sheet if we can't determine
      Logger.log("Could not determine form type, trying to guess");
      
      // Try to guess based on field presence
      for (var key in data) {
        if (key.includes("daily")) {
          formType = "Daily Check";
          Logger.log("Guessed Daily Check form based on fields");
          sheet = spreadsheet.getSheetByName("Daily Checks");
          break;
        } else if (key.includes("pastry") || key.includes("monthly")) {
          formType = "Monthly Pastry Check";
          Logger.log("Guessed Monthly Pastry Check form based on fields");
          sheet = spreadsheet.getSheetByName("Monthly Pastry Check");
          break;
        } else if (key.includes("roast") || key.includes("coffee") || key.includes("trace")) {
          formType = "Roast Log";
          Logger.log("Guessed Roast Log form based on fields");
          sheet = spreadsheet.getSheetByName("Roast Log");
          break;
        }
      }
      
      // If still no sheet found, create the sheets
      if (!sheet) {
        Logger.log("No matching sheet found, running setup");
        setup();
        // Default to first sheet after setup
        sheet = spreadsheet.getSheets()[0];
      }
    }
    
    // If this is the first submission, create headers
    if (sheet.getLastRow() === 0) {
      createHeaders(sheet, data);
    }
    
    // Get headers from the first row
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log("Headers found: " + headers.join(", "));
    
    // Ensure headers are correctly ordered for each form type
    if (formType === "Roast Log" && headers.length > 0) {
      // Check if the first header is not trace_num
      if (headers[0] !== "trace_num") {
        Logger.log("Fixing Roast Log headers - trace_num should be first column");
        // Reset the sheet with correct headers
        sheet.clear();
        sheet.appendRow(["trace_num", "coffee_name", "roast_date", "quantity", "batch_index", "form_id"]);
        sheet.getRange(1, 1, 1, 6).setFontWeight("bold");
        headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        Logger.log("Updated headers: " + headers.join(", "));
      }
    } else if (formType === "Daily Check" && headers.length > 0) {
      // Check if the first header is not daily_date
      if (headers[0] !== "daily_date") {
        Logger.log("Fixing Daily Checks headers - daily_date should be first column");
        // Reset the sheet with correct headers
        sheet.clear();
        sheet.appendRow(["daily_date", "fridge1", "freezer1", "fridge2", "freezer2", 
                         "clean_floor", "clean_bar", "clean_windows", "daily_signed", "form_id"]);
        sheet.getRange(1, 1, 1, 10).setFontWeight("bold");
        headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        Logger.log("Updated headers: " + headers.join(", "));
      }
    } else if (formType === "Monthly Pastry Check" && headers.length > 0) {
      // Check if the first header is not monthly_date
      if (headers[0] !== "monthly_date") {
        Logger.log("Fixing Monthly Pastry Check headers - monthly_date should be first column");
        // Reset the sheet with correct headers
        sheet.clear();
        sheet.appendRow(["monthly_date", "pastry_name", "pastry_temp", "pastry_notes", 
                         "rodent_check", "insect_check", "pastry_signed", "form_id"]);
        sheet.getRange(1, 1, 1, 8).setFontWeight("bold");
        headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        Logger.log("Updated headers: " + headers.join(", "));
      }
    }
    
    // Prepare row data
    var row = [];
    
    // Process each header and find matching data
    Logger.log("Processing " + headers.length + " columns");
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      var value = "";
      
      // Log current header being processed
      Logger.log("Processing header #" + i + ": '" + header + "'");
      
      // Special handling for form_id if it's in the header
      if (header === "form_id" && formType) {
        if (data.form_id) {
          value = data.form_id;
        } else {
          // If we guessed the form type but don't have form_id in data
          value = formType === "Daily Check" ? "dailyForm" : 
                 (formType === "Monthly Pastry Check" ? "monthlyForm" : "roastForm");
        }
        Logger.log("Using form_id: " + value);
      }
      // For all other fields, try to find a match
      else {
        // Check for direct match
        if (data[header] !== undefined) {
          value = data[header];
          Logger.log("Found direct match for '" + header + "': " + value);
        } 
        // Check for array notation
        else if (data[header + '[]'] !== undefined) {
          value = data[header + '[]'];
          Logger.log("Found array match for '" + header + "[]': " + value);
        }
        // Try removing array notation if present in header
        else if (header.endsWith('[]') && data[header.slice(0, -2)] !== undefined) {
          value = data[header.slice(0, -2)];
          Logger.log("Found match after removing array notation from header: " + value);
        }
        // Try case-insensitive match
        else {
          for (var key in data) {
            if (key.toLowerCase() === header.toLowerCase()) {
              value = data[key];
              Logger.log("Found case-insensitive match for '" + header + "' using key '" + key + "': " + value);
              break;
            }
          }
        }
        
        // Handle checkbox values
        if ((header.startsWith("clean_") || header.includes("check"))) {
          if (value === "on" || value === "true" || value === "yes" || value === "1") {
            value = "Yes";
            Logger.log("Converting value to 'Yes' for checkbox field: " + header);
          } else if (!value) {
            value = "No"; // Default to "No" if not set
            Logger.log("Setting default 'No' for checkbox field: " + header);
          }
        }
      }
      
      row.push(value);
      Logger.log("Added final value for column '" + header + "': " + value);
    }
    
    // Append the row
    sheet.appendRow(row);
    Logger.log("Row added successfully");
    
    // Return success
    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    // Log errors
    Logger.log("Error: " + error.toString());
    
    // Return error
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// This function handles GET requests
function doGet(e) {
  try {
    // Check if the request is asking for coffee data
    if (e.parameter.action === 'getCoffeeData') {
      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = spreadsheet.getSheetByName("Roast Log");
      
      if (!sheet || sheet.getLastRow() <= 1) {
        // No data yet
        return ContentService
          .createTextOutput(JSON.stringify({ result: "success", data: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      // Get all data from the sheet
      var dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
      var values = dataRange.getValues();
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      // Find the column indices for trace_num and coffee_name
      var traceNumIndex = headers.indexOf("trace_num");
      var coffeeNameIndex = headers.indexOf("coffee_name");
      
      if (traceNumIndex === -1 || coffeeNameIndex === -1) {
        Logger.log("Could not find trace_num or coffee_name columns");
        return ContentService
          .createTextOutput(JSON.stringify({ result: "error", error: "Column not found" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      // Create a map of unique coffee names to their most recent trace numbers
      var coffeeMap = {};
      
      for (var i = 0; i < values.length; i++) {
        var traceNum = values[i][traceNumIndex];
        var coffeeName = values[i][coffeeNameIndex];
        
        if (coffeeName && traceNum) {
          // Store the most recent trace number for each coffee name
          // Since we're reading from top to bottom, the last entry will be kept
          coffeeMap[coffeeName] = traceNum;
        }
      }
      
      // Convert map to array of objects
      var coffeeData = [];
      for (var name in coffeeMap) {
        coffeeData.push({
          coffeeName: name,
          traceNum: coffeeMap[name]
        });
      }
      
      Logger.log("Returning " + coffeeData.length + " unique coffee entries");
      
      return ContentService
        .createTextOutput(JSON.stringify({ result: "success", data: coffeeData }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Default response for testing
    return ContentService
      .createTextOutput("Google Apps Script is running!")
      .setMimeType(ContentService.MimeType.TEXT);
      
  } catch(error) {
    Logger.log("Error in doGet: " + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// This function creates headers for a new sheet based on the submitted data
function createHeaders(sheet, data) {
  var headers = [];
  var sheetName = sheet.getName();
  
  // Use predefined headers based on sheet name to ensure correct order
  if (sheetName === "Daily Checks") {
    headers = ["daily_date", "fridge1", "freezer1", "fridge2", "freezer2", 
               "clean_floor", "clean_bar", "clean_windows", "daily_signed", "form_id"];
  } else if (sheetName === "Monthly Pastry Check") {
    headers = ["monthly_date", "pastry_name", "pastry_temp", "pastry_notes", 
               "rodent_check", "insect_check", "pastry_signed", "form_id"];
  } else if (sheetName === "Roast Log") {
    headers = ["trace_num", "coffee_name", "roast_date", "quantity", "batch_index", "form_id"];
  } else {
    // Fallback to using data keys for unknown sheets
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        headers.push(key);
      }
    }
  }
  
  // Set the headers in the first row
  sheet.appendRow(headers);
  
  // Format the header row
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  sheet.setFrozenRows(1);
  
  // Log the headers created
  Logger.log("Created headers for " + sheetName + ": " + headers.join(", "));
}

// This function is used to set up the script when first deployed
function setup() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    // Safer approach: Update existing sheets or create new ones without deleting
    // Removed timestamp as the first column as requested
    setupSheet(spreadsheet, "Daily Checks", ["daily_date", "fridge1", "freezer1", "fridge2", "freezer2", 
                       "clean_floor", "clean_bar", "clean_windows", "daily_signed", "form_id"]);
                       
    setupSheet(spreadsheet, "Monthly Pastry Check", ["monthly_date", "pastry_name", "pastry_temp", "pastry_notes", 
                           "rodent_check", "insect_check", "pastry_signed", "form_id"]);
                           
    setupSheet(spreadsheet, "Roast Log", ["trace_num", "coffee_name", "roast_date", "quantity", "batch_index", "form_id"]);
    
    // Log for confirmation
    Logger.log("All sheets set up with correct headers (timestamp removed)");
    return "Setup complete! All sheets set up with proper headers (timestamp removed).";
  } catch(error) {
    Logger.log("Error in setup: " + error.toString());
    return "Error in setup: " + error.toString();
  }
}

// Helper function to set up a single sheet
function setupSheet(spreadsheet, sheetName, headers) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    // Create new sheet if it doesn't exist
    Logger.log("Creating new sheet: " + sheetName);
    sheet = spreadsheet.insertSheet(sheetName);
  } else {
    // Clear existing sheet but keep it
    Logger.log("Clearing existing sheet: " + sheetName);
    sheet.clear();
  }
  
  // Special handling for Roast Log to ensure trace_num is always the first column
  if (sheetName === "Roast Log") {
    Logger.log("Setting up Roast Log with trace_num as first column");
    // Explicitly ensure trace_num is first
    if (headers[0] !== "trace_num") {
      // Reorder headers if needed
      var traceNumIndex = headers.indexOf("trace_num");
      if (traceNumIndex > 0) {
        // Move trace_num to the front
        headers.splice(0, 0, headers.splice(traceNumIndex, 1)[0]);
      }
    }
  }
  
  // Add headers to the first row
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  sheet.setFrozenRows(1);
  
  return sheet;
}
