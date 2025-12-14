// CODE.GS - COPY THIS CONTENT TO YOUR GOOGLE APPS SCRIPT EDITOR

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const sheetDataName = "Data";
    const sheetSchoolListName = "SchoolList";
    const sheetStatusName = "Status"; // New Sheet Name
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Parse the request body
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;

    if (action === 'getSchoolDetails') {
      const udiseToFind = String(requestData.udise).trim();
      const listSheet = ss.getSheetByName(sheetSchoolListName);
      const listData = listSheet.getDataRange().getValues();
      
      let schoolDetails = null;
      
      // 1. Find School Details
      for (let i = 1; i < listData.length; i++) {
        // Column A is Udise Code (Index 0)
        if (String(listData[i][0]).trim() === udiseToFind) {
          schoolDetails = {
            udise: listData[i][0],
            name: listData[i][1],
            panchayat: listData[i][2],
            type: listData[i][3]
          };
          break;
        }
      }
      
      if (!schoolDetails) {
        return createResponse({ success: false, message: 'School not found' });
      }

      // 2. Check for existing data in Data Sheet
      const dataSheet = ss.getSheetByName(sheetDataName);
      const dataRows = dataSheet.getDataRange().getValues();
      let existingData = null;

      // Iterate to find if data already exists for this UDISE
      for (let i = 1; i < dataRows.length; i++) {
        if (String(dataRows[i][0]).trim() === udiseToFind) {
          existingData = {};
          // Map columns to class data
          // Structure: Udise(0), Name(1), Panchayat(2), Type(3)
          // Class 1 Enr(4), Class 1 App(5), Class 2 Enr(6), Class 2 App(7)...
          for (let c = 1; c <= 8; c++) {
            const enrIdx = 4 + (c - 1) * 2;
            const appIdx = enrIdx + 1;
            
            // Safety check if columns exist
            if (enrIdx < dataRows[i].length) {
              existingData[c] = {
                enrolled: String(dataRows[i][enrIdx] !== "" ? dataRows[i][enrIdx] : ""),
                appeared: String(dataRows[i][appIdx] !== "" ? dataRows[i][appIdx] : "")
              };
            }
          }
          break; // Stop at the first match
        }
      }

      return createResponse({
        success: true,
        data: {
          ...schoolDetails,
          existingData: existingData
        }
      });
    }

    if (action === 'submitData') {
      const sheet = ss.getSheetByName(sheetDataName);
      const payload = requestData.payload;
      const timestamp = new Date().toLocaleString();
      const udise = String(payload.udise).trim();
      
      const data = sheet.getDataRange().getValues();
      let rowIndexToUpdate = -1;

      // Check if row exists to update in Data Sheet
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === udise) {
          rowIndexToUpdate = i + 1; // 1-based index for Sheet API
          break;
        }
      }

      // Prepare Data Sheet row content
      const row = [
        payload.udise,
        payload.name,
        payload.panchayat,
        payload.type
      ];

      // Loop for classes 1 to 8 for Data Sheet
      for (let i = 1; i <= 8; i++) {
        const entry = payload.classData[i];
        if (entry) {
          row.push(entry.enrolled);
          row.push(entry.appeared);
        } else {
          row.push("");
          row.push("");
        }
      }

      row.push(timestamp);

      // Update or Append to Data Sheet
      if (rowIndexToUpdate > 0) {
        sheet.getRange(rowIndexToUpdate, 1, 1, row.length).setValues([row]);
      } else {
        sheet.appendRow(row);
      }

      // --- START STATUS SHEET UPDATE LOGIC ---
      try {
        const statusSheet = ss.getSheetByName(sheetStatusName);
        if (statusSheet) {
          const statusData = statusSheet.getDataRange().getValues();
          let statusRowIndex = -1;
          
          // Find row in Status Sheet
          for (let i = 1; i < statusData.length; i++) {
            if (String(statusData[i][0]).trim() === udise) {
              statusRowIndex = i + 1;
              break;
            }
          }

          let totalEnrolled = 0;
          let totalAppeared = 0;
          const percentages = [];

          // Calculate Percentages for Class 1 to 8
          for (let i = 1; i <= 8; i++) {
            const entry = payload.classData[i];
            let percentStr = "";
            
            if (entry && entry.enrolled && entry.appeared) {
              const enr = parseFloat(entry.enrolled) || 0;
              const app = parseFloat(entry.appeared) || 0;
              
              if (enr > 0) {
                // Calculate % and format to 2 decimal places
                const pct = (app / enr) * 100;
                percentStr = pct.toFixed(2) + "%";
                
                // Add to totals
                totalEnrolled += enr;
                totalAppeared += app;
              }
            }
            percentages.push(percentStr);
          }

          // Calculate Total School Percentage
          let schoolPct = "";
          if (totalEnrolled > 0) {
            schoolPct = ((totalAppeared / totalEnrolled) * 100).toFixed(2) + "%";
          }

          // Prepare Status Row Updates
          // Columns structure in Status Sheet:
          // Col 1: Udise, Col 2: Name, Col 3: Panchayat
          // Col 4: % Class 1 ... Col 11: % Class 8
          // Col 12: Total %
          
          const statusUpdates = [
            ...percentages, // 8 columns
            schoolPct       // 1 column
          ];

          if (statusRowIndex > 0) {
            // Update existing row, starting at Column 4 (D)
            statusSheet.getRange(statusRowIndex, 4, 1, statusUpdates.length).setValues([statusUpdates]);
          } else {
            // Append new row if not found (Upsert logic for Status Sheet)
            const newStatusRow = [
              payload.udise,
              payload.name,
              payload.panchayat,
              ...statusUpdates
            ];
            statusSheet.appendRow(newStatusRow);
          }
        }
      } catch (statusError) {
        // Log error but don't fail the whole request if status update fails
        console.error("Error updating status sheet: " + statusError.toString());
      }
      // --- END STATUS SHEET UPDATE LOGIC ---

      if (rowIndexToUpdate > 0) {
        return createResponse({ success: true, message: 'Data updated successfully' });
      } else {
        return createResponse({ success: true, message: 'Data saved successfully' });
      }
    }

    return createResponse({ success: false, message: 'Invalid action' });

  } catch (err) {
    return createResponse({ success: false, message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Setup CORS for testing
function doGet(e) {
  return createResponse({ success: false, message: "Use POST method" });
}