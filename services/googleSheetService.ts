import { GOOGLE_SCRIPT_URL } from '../constants';
import { ApiResponse, SchoolDetails, SubmitPayload } from '../types';

/**
 * Fetches school details based on UDISE code.
 */
export const fetchSchoolDetails = async (udise: string): Promise<ApiResponse<SchoolDetails>> => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'getSchoolDetails', udise }),
    });
    
    const json = await response.json();
    return json;
  } catch (error) {
    console.error("API Error:", error);
    return { success: false, message: 'Network error or Invalid API URL.' };
  }
};

/**
 * Submits the form data to the Google Sheet.
 */
export const submitSchoolData = async (payload: SubmitPayload): Promise<ApiResponse> => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'submitData', payload }),
    });
    
    const json = await response.json();
    return json;
  } catch (error) {
    console.error("API Error:", error);
    return { success: false, message: 'Failed to submit data.' };
  }
};
