// Validation utilities
export const validateUsername = (username: string): boolean => {
  // Username should be 3-20 characters, alphanumeric with underscores
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
};

export const validateTimezone = (timezone: string): boolean => {
  // Timezone should be in format Region/City
  return /^[A-Za-z]+\/[A-Za-z_]+$/.test(timezone);
};

export function validateDeadline(deadline: string): { isValid: boolean; error: string } {
  // Check if the deadline is in the correct format (HH:mm)
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(deadline)) {
    return {
      isValid: false,
      error: 'Please enter a valid time in 24-hour format (HH:MM)'
    };
  }

  return {
    isValid: true,
    error: ''
  };
}

export const validateTaskTitle = (title: string): boolean => {
  // Title should be 3-100 characters, no special characters
  return /^[a-zA-Z0-9\s.,!?-]{3,100}$/.test(title);
};

export const validateTaskDescription = (description: string): boolean => {
  // Description should be 0-500 characters
  return description.length <= 500;
};

export const sanitizeInput = (input: string): string => {
  // Remove any potentially harmful characters
  return input.replace(/[<>]/g, '');
};

// File validation
export const validateFile = (file: File): { isValid: boolean; error: string } => {
  // Check file size (max 1MB)
  const maxSize = 1 * 1024 * 1024; // 1MB
  if (file.size > maxSize) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `File size (${fileSizeMB}MB) exceeds the 1MB limit. Please choose a smaller file.`
    };
  }

  // Check file type
  const allowedTypes = [
    'application/pdf',                    // PDF
    'image/jpeg',                         // JPEG
    'image/png',                          // PNG
    'text/plain',                         // Text
    'application/msword',                 // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.ms-excel',           // XLS
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'application/vnd.ms-powerpoint',      // PPT
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
    'text/csv',                           // CSV
    'application/zip',                    // ZIP
    'application/x-rar-compressed'        // RAR
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'File type not supported. Allowed types: PDF, Images (JPEG, PNG), Office Documents (DOC, DOCX, XLS, XLSX, PPT, PPTX), Text, CSV, ZIP, RAR'
    };
  }

  return { isValid: true, error: '' };
};

// Rating validation
export const validateRating = (rating: number): boolean => {
  return rating >= -2 && rating <= 1;
};

// Date validation
export const isValidDate = (date: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;
  
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}; 