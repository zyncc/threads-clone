export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: number;
  type: string;
  details?: string;
}

export function SuccessResponse<T>({
  data,
  message = "Success",
}: {
  data: T;
  message?: string;
}): ApiResponse<T> {
  return { success: true, message, data };
}

export function ErrorResponse({
  message,
  error,
}: {
  message: string;
  error?: ApiError;
}): ApiResponse<null> {
  return { success: false, message, error };
}

export function AuthErrorResponse({
  message = "Unauthorized",
}: {
  message?: string;
} = {}): ApiResponse<null> {
  return {
    success: false,
    message,
    error: { code: 401, type: "Auth" },
  };
}
