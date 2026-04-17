/**
 * Standardized API Response Helper
 *
 * Ensures all API responses follow a consistent format:
 * {
 *   success: boolean,
 *   statusCode: number,
 *   message: string,
 *   data: any,
 *   cached?: boolean,
 *   timestamp: string
 * }
 */

class ApiResponse {
  /**
   * Send a success response.
   * @param {import('express').Response} res
   * @param {any} data - Response payload
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status (default 200)
   * @param {object} extra - Additional fields (e.g., { cached: true })
   */
  static success(res, data = null, message = 'Success', statusCode = 200, extra = {}) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
      ...extra,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send a created response (201).
   */
  static created(res, data = null, message = 'Created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Send an error response.
   * @param {import('express').Response} res
   * @param {number} statusCode
   * @param {string} message
   * @param {any} errors - Validation errors or additional details
   */
  static error(res, statusCode = 500, message = 'Internal Server Error', errors = null) {
    const response = {
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }
}

module.exports = ApiResponse;
