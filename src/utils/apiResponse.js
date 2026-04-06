class ApiResponse {
  static success(res, { statusCode = 200, message = 'Success', data = null, pagination = null } = {}) {
    const response = {
      success: true,
      statusCode,
      message,
      data,
    };
    if (pagination) response.pagination = pagination;
    return res.status(statusCode).json(response);
  }

  static created(res, { message = 'Created successfully', data = null } = {}) {
    return ApiResponse.success(res, { statusCode: 201, message, data });
  }

  static error(res, { statusCode = 500, message = 'Something went wrong', errors = null } = {}) {
    const response = {
      success: false,
      statusCode,
      message,
      data: null,
    };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  }

  static notFound(res, { message = 'Resource not found' } = {}) {
    return ApiResponse.error(res, { statusCode: 404, message });
  }

  static badRequest(res, { message = 'Bad request', errors = null } = {}) {
    return ApiResponse.error(res, { statusCode: 400, message, errors });
  }

  static unauthorized(res, { message = 'Unauthorized' } = {}) {
    return ApiResponse.error(res, { statusCode: 401, message });
  }

  static forbidden(res, { message = 'Forbidden' } = {}) {
    return ApiResponse.error(res, { statusCode: 403, message });
  }
}

module.exports = ApiResponse;
