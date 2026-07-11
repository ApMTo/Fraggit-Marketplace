import { of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  it('wraps handler data in a success envelope', (done) => {
    const interceptor = new ResponseInterceptor();
    const next = { handle: () => of({ id: 'job-1' }) };

    interceptor.intercept({} as never, next).subscribe((result) => {
      expect(result).toEqual({
        status: 'success',
        result: { id: 'job-1' },
      });
      done();
    });
  });
});
