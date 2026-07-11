import { slugify } from './slug.util';

describe('slugify', () => {
  it('lowercases and trims input', () => {
    expect(slugify('  Hello World  ')).toBe('hello-world');
  });

  it('replaces spaces and underscores with hyphens', () => {
    expect(slugify('foo_bar baz')).toBe('foo-bar-baz');
  });

  it('removes special characters', () => {
    expect(slugify('C++ & C#')).toBe('c-c');
  });

  it('collapses consecutive hyphens', () => {
    expect(slugify('foo---bar')).toBe('foo-bar');
  });

  it('strips leading and trailing hyphens', () => {
    expect(slugify('-hello-')).toBe('hello');
  });
});
