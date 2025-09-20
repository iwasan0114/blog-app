export function extractBearerToken(authorizationHeader: string): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const parts = authorizationHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  const token = parts[1];
  if (!token || token.trim() === '') {
    return null;
  }

  return token;
}

export function createErrorResponse(
  error: Error | string,
  status: number = 500
): Response {
  const errorMessage = error instanceof Error ? error.message : error;

  return new Response(
    JSON.stringify({
      success: false,
      error: errorMessage,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

export function createSuccessResponse(
  data: any,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
}

export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): ValidationResult {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      missingFields.push(field);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}
