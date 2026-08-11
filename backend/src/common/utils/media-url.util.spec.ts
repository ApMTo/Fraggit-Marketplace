import {
  buildCloudinaryBaseUrl,
  isAllowedStoredMediaRef,
  resolveMediaUrl,
  resolveMediaUrlsInTree,
  toStoredMediaPath,
} from './media-url.util';

describe('media-url.util', () => {
  const base = 'https://res.cloudinary.com/demo/image/upload';

  describe('resolveMediaUrl', () => {
    it('returns nullish as-is', () => {
      expect(resolveMediaUrl(null, base)).toBeNull();
      expect(resolveMediaUrl(undefined, base)).toBeNull();
      expect(resolveMediaUrl('', base)).toBe('');
    });

    it('leaves absolute URLs untouched', () => {
      expect(
        resolveMediaUrl('https://lh3.googleusercontent.com/a/x', base),
      ).toBe('https://lh3.googleusercontent.com/a/x');
      expect(resolveMediaUrl('http://example.com/a.jpg', base)).toBe(
        'http://example.com/a.jpg',
      );
    });

    it('prefixes relative public_id', () => {
      expect(resolveMediaUrl('lots/abc.jpg', base)).toBe(
        'https://res.cloudinary.com/demo/image/upload/lots/abc.jpg',
      );
      expect(resolveMediaUrl('/avatars/x', `${base}/`)).toBe(
        'https://res.cloudinary.com/demo/image/upload/avatars/x',
      );
    });
  });

  describe('isAllowedStoredMediaRef', () => {
    it('allows https and relative paths', () => {
      expect(isAllowedStoredMediaRef('https://cdn.example/a.jpg')).toBe(true);
      expect(isAllowedStoredMediaRef('lots/previews/x.webp')).toBe(true);
    });

    it('rejects http and traversal', () => {
      expect(isAllowedStoredMediaRef('http://cdn.example/a.jpg')).toBe(false);
      expect(isAllowedStoredMediaRef('../etc/passwd')).toBe(false);
      expect(isAllowedStoredMediaRef('')).toBe(false);
    });
  });

  describe('toStoredMediaPath', () => {
    it('strips Cloudinary delivery prefix', () => {
      expect(
        toStoredMediaPath(
          'https://res.cloudinary.com/demo/image/upload/v1710000/lots/a.jpg',
        ),
      ).toBe('lots/a.jpg');
      expect(
        toStoredMediaPath(
          'https://res.cloudinary.com/demo/image/upload/avatars/b.png',
        ),
      ).toBe('avatars/b.png');
    });

    it('leaves non-Cloudinary URLs alone', () => {
      expect(toStoredMediaPath('https://lh3.googleusercontent.com/a')).toBe(
        'https://lh3.googleusercontent.com/a',
      );
    });
  });

  describe('resolveMediaUrlsInTree', () => {
    it('resolves known media keys nested in the tree', () => {
      const payload = {
        avatarUrl: 'avatars/a',
        lot: {
          previewUrl: 'lots/previews/b',
          images: [{ url: 'lots/c.jpg' }],
        },
        external: 'https://example.com/x.png',
        coverUrl: 'https://example.com/cover.png',
      };

      resolveMediaUrlsInTree(payload, base);

      expect(payload.avatarUrl).toBe(`${base}/avatars/a`);
      expect(payload.lot.previewUrl).toBe(`${base}/lots/previews/b`);
      expect(payload.lot.images[0].url).toBe(`${base}/lots/c.jpg`);
      expect(payload.coverUrl).toBe('https://example.com/cover.png');
    });
  });

  describe('buildCloudinaryBaseUrl', () => {
    it('builds delivery base', () => {
      expect(buildCloudinaryBaseUrl('demo')).toBe(
        'https://res.cloudinary.com/demo/image/upload',
      );
    });
  });
});
