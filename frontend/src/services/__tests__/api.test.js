import { handleApiError, createApiCall } from '../api';

describe('API Error Handling', () => {
  test('should handle network errors', () => {
    const networkError = {
      request: {},
      code: 'ECONNABORTED'
    };
    
    const result = handleApiError(networkError);
    expect(result).toBe('İstek zaman aşımına uğradı');
  });

  test('should handle 400 validation errors', () => {
    const validationError = {
      response: {
        status: 400,
        data: {
          message: 'Validation failed',
          errors: [
            { message: 'Name is required' },
            { message: 'Amount must be positive' }
          ]
        }
      }
    };
    
    const result = handleApiError(validationError);
    expect(result).toBe('Name is required, Amount must be positive');
  });

  test('should handle 401 authentication errors', () => {
    const authError = {
      response: {
        status: 401,
        data: { message: 'Unauthorized' }
      }
    };
    
    const result = handleApiError(authError);
    expect(result).toBe('Oturum süreniz dolmuş, lütfen tekrar giriş yapın');
  });

  test('should handle 404 not found errors', () => {
    const notFoundError = {
      response: {
        status: 404,
        data: { message: 'Resource not found' }
      }
    };
    
    const result = handleApiError(notFoundError);
    expect(result).toBe('Aranan kaynak bulunamadı');
  });

  test('should handle 500 server errors', () => {
    const serverError = {
      response: {
        status: 500,
        data: { message: 'Internal server error' }
      }
    };
    
    const result = handleApiError(serverError);
    expect(result).toBe('Sunucu hatası oluştu, lütfen tekrar deneyin');
  });
});

describe('API Call Wrapper', () => {
  test('should handle successful API calls', async () => {
    const mockApiFunction = jest.fn().mockResolvedValue({ data: 'success' });
    const mockSetLoading = jest.fn();
    
    const result = await createApiCall(mockApiFunction, mockSetLoading);
    
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
    expect(result).toEqual({ data: 'success' });
  });

  test('should handle API call errors', async () => {
    const mockApiFunction = jest.fn().mockRejectedValue(new Error('API Error'));
    const mockSetLoading = jest.fn();
    const mockErrorHandler = jest.fn();
    
    await createApiCall(mockApiFunction, mockSetLoading, mockErrorHandler);
    
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
    expect(mockErrorHandler).toHaveBeenCalledWith('API Error');
  });
});