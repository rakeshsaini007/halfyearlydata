export type SchoolType = 'PS' | 'UPS' | 'COMP' | string;

export interface SchoolDetails {
  udise: string;
  name: string;
  panchayat: string;
  type: SchoolType;
  existingData?: FormDataMap;
}

export interface ClassEntry {
  enrolled: string;
  appeared: string;
}

export interface FormDataMap {
  [classNumber: number]: ClassEntry;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface SubmitPayload {
  udise: string;
  name: string;
  panchayat: string;
  type: string;
  classData: FormDataMap;
}
