import { HttpException } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let json: jest.Mock;
  let status: jest.Mock;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
  });

  const createHost = (request: { method?: string; url?: string } = {}) =>
    ({
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => request,
      }),
    }) as never;

  it('formats HttpException responses', () => {
    filter.catch(
      new HttpException({ code: 'invalid_credentials' }, 401),
      createHost({ method: 'POST', url: '/api/auth/login' }),
    );

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      status: 'error',
      error: {
        message: { code: 'invalid_credentials' },
        code: 401,
      },
    });
  });

  it('returns 500 for unknown errors', () => {
    filter.catch(new Error('boom'), createHost());

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      status: 'error',
      error: {
        message: 'Internal server error',
        code: 500,
      },
    });
  });
});
