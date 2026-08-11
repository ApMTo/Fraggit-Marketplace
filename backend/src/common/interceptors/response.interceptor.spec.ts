import { of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';
import { MediaUrlService } from '../../modules/cloudinary/media-url.service';

describe('ResponseInterceptor', () => {
  it('wraps handler data in a success envelope', (done) => {
    const resolveInTree = jest.fn((value) => value);
    const mediaUrl = { resolveInTree } as unknown as MediaUrlService;
    const interceptor = new ResponseInterceptor(mediaUrl);
    const next = { handle: () => of({ id: 'job-1' }) };

    interceptor.intercept({} as never, next).subscribe((result) => {
      expect(result).toEqual({
        status: 'success',
        result: { id: 'job-1' },
      });
      expect(resolveInTree).toHaveBeenCalledWith({ id: 'job-1' });
      done();
    });
  });
});
