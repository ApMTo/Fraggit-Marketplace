import { BadRequestException } from '@nestjs/common';
import { FileValidationPipe } from './file-validation.pipe';

const IMAGE_OPTIONS = {
  maxSizeInBytes: 1024,
  allowedMimeTypes: ['image/png', 'image/jpeg'],
};

function createFile(
  overrides: Partial<{
    originalname: string;
    mimetype: string;
    size: number;
  }> = {},
) {
  return {
    originalname: 'photo.png',
    mimetype: 'image/png',
    size: 512,
    ...overrides,
  };
}

describe('FileValidationPipe', () => {
  it('returns undefined for optional pipe when value is missing', () => {
    const pipe = new FileValidationPipe({ ...IMAGE_OPTIONS, optional: true });

    expect(
      pipe.transform(undefined, { type: 'custom' } as never),
    ).toBeUndefined();
  });

  it('throws when required file is missing', () => {
    const pipe = new FileValidationPipe(IMAGE_OPTIONS);

    expect(() =>
      pipe.transform(undefined, { type: 'custom' } as never),
    ).toThrow(BadRequestException);
  });

  it('validates a single file', () => {
    const pipe = new FileValidationPipe(IMAGE_OPTIONS);
    const file = createFile();

    expect(pipe.transform(file, { type: 'custom' } as never)).toBe(file);
  });

  it('throws when file exceeds max size', () => {
    const pipe = new FileValidationPipe(IMAGE_OPTIONS);
    const file = createFile({ size: 2048 });

    expect(() => pipe.transform(file, { type: 'custom' } as never)).toThrow(
      'file_size_exceeded',
    );
  });

  it('throws for invalid mime type', () => {
    const pipe = new FileValidationPipe(IMAGE_OPTIONS);
    const file = createFile({ mimetype: 'application/pdf' });

    expect(() => pipe.transform(file, { type: 'custom' } as never)).toThrow(
      'invalid_file_type',
    );
  });

  it('validates file arrays and enforces maxFiles', () => {
    const pipe = new FileValidationPipe({ ...IMAGE_OPTIONS, maxFiles: 2 });
    const files = [createFile(), createFile()];

    expect(pipe.transform(files, { type: 'custom' } as never)).toBe(files);

    const tooMany = [createFile(), createFile(), createFile()];
    expect(() => pipe.transform(tooMany, { type: 'custom' } as never)).toThrow(
      'too_many_files',
    );
  });

  it('validates multi-field file objects', () => {
    const pipe = new FileValidationPipe({ ...IMAGE_OPTIONS, maxFiles: 1 });
    const filesObject = { avatar: [createFile()], cover: [createFile()] };

    expect(pipe.transform(filesObject, { type: 'custom' } as never)).toBe(
      filesObject,
    );
  });
});
