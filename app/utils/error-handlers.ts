import { AxiosError } from "axios";

const defaultStatus = 400;

type ApiErrorShape = {
  message?: string;
  errors?: Record<string, unknown>;
};

interface NetworkResponse<T> {
  data?: T;
  status: number;
  error?: ApiErrorShape | string;
  message?: string;
}

const normalizeResponseData = (data: unknown): ApiErrorShape => {
  if (!data) return {};

  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return { message: data };
    }
  }

  return data as ApiErrorShape;
};

const extractFirstError = (errors: unknown): string | undefined => {
  if (!errors || typeof errors !== "object") return undefined;

  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (!value) continue;

    if (Array.isArray(value)) {
      const first = value.find(Boolean);
      if (typeof first === "string") return first;
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "object") {
      const nested = extractFirstError(value);
      if (nested) return nested;
    }
  }

  return undefined;
};

export const handleAxiosErrors = (
  error: Error | AxiosError
): NetworkResponse<undefined> => {
  const axiosErr = error instanceof AxiosError;
  if (axiosErr && error.response) {
    console.log(error.response);

    const statusCode = error.response.status;
    const parsed = normalizeResponseData(error.response.data);

    const message =
      extractFirstError(parsed.errors) ||
      parsed.message ||
      "Something went wrong";

    // optional: don’t mutate axios response (avoid side effects)
    const normalizedError = {
      status: statusCode,
      message,
      error: parsed,
    };
    console.log({ errMsg: message });

    if (statusCode >= 500) {
      return {
        ...normalizedError,
        message:
          normalizedError.message ??
          "Our server is having troubles. Please try again later",
      };
    }

    if (statusCode === 404) {
      return {
        ...normalizedError,
        message:
          normalizedError.message ??
          "Unable to complete your request. Try again later.",
      };
    }

    return normalizedError;
  } else if (axiosErr && error.request) {
    console.log(error.request);

    return {
      error: "Connection Error",
      message: "No internet connection found. Please, check your network.",
      status: defaultStatus,
    };
  } else {
    return {
      error: "Unexpected Error",
      message: error.message,
      status: defaultStatus,
    };
  }
};

export const catchErr = (
  fallbackError: unknown,
  fallbackMessage: string | undefined = "An error occured"
) => {
  if (fallbackError instanceof Error || fallbackError instanceof AxiosError) {
    return handleAxiosErrors(fallbackError);
  }

  return {
    status: defaultStatus,
    error: "Error",
    message: fallbackMessage,
  };
};

export const getEnhancedError = (error: unknown, defaultMsg?: string) => {
  const { message, status } = catchErr(error);
  const enhancedError = new Error(message);
  (enhancedError as any).status = status;

  throw enhancedError;
};

export const deviceFileErrorHandler = (error: unknown) => {
  if (!(error instanceof Error)) {
    return "Something went wrong";
  }

  let errorMessage = "";
  if (error?.message?.includes("No directory selected")) {
    errorMessage = "No directory selected";
  } else if (
    error?.message?.includes("Unable to resolve host") ||
    error?.message?.includes("Network request failed")
  ) {
    errorMessage = "Please check your internet connection";
  } else if (
    error.message
      .toLowerCase()
      .includes("Destination already exists".toLowerCase())
  ) {
    errorMessage = "File already exists";
  } else if (error?.message?.includes("FileSystem.downloadFileAsync")) {
    errorMessage = "Failed to download file";
  } else if (
    error?.message?.includes("permission") ||
    error?.message?.includes("denied")
  ) {
    errorMessage = "Your denied permission to your storage access";
  } else if (
    error?.message?.includes("ENOSPC") ||
    error?.message?.includes("No space left")
  ) {
    errorMessage = "Not enough storage space";
  } else if (
    error?.message?.includes("Malformed URL") ||
    error?.message?.includes("Invalid URL")
  ) {
    errorMessage = "Invalid file URL";
  }

  return errorMessage;
};
