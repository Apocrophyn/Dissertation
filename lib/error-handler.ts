export class APIError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleError(error: unknown) {
  console.error('Error:', error);

  if (error instanceof APIError) {
    return {
      error: error.message,
      code: error.code,
      status: error.status,
    };
  }

  // OpenAI API errors
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    'message' in error
  ) {
    return {
      error: error.message as string,
      status: error.status as number,
    };
  }

  // Default error
  return {
    error: 'An unexpected error occurred',
    status: 500,
  };
}

export function createErrorResponse(error: unknown) {
  const errorData = handleError(error);
  return new Response(JSON.stringify(errorData), {
    status: errorData.status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
} 