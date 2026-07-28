import { assertDevOnly } from './assert-dev-only';

describe('assertDevOnly', () => {
  const originalEnv = process.env;
  let exitCode: number | undefined;

  beforeEach(() => {
    process.env = { ...originalEnv };
    exitCode = undefined;
    jest.spyOn(process, 'exit').mockImplementation((code) => {
      exitCode = code as number;
      throw new Error('process.exit');
    });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('allows development', () => {
    process.env.NODE_ENV = 'development';
    expect(() => assertDevOnly('test')).not.toThrow();
  });

  it('allows test', () => {
    process.env.NODE_ENV = 'test';
    expect(() => assertDevOnly('test')).not.toThrow();
  });

  it('blocks production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_DEV_DB_SCRIPTS;
    expect(() => assertDevOnly('seed')).toThrow('process.exit');
    expect(exitCode).toBe(1);
  });

  it('allows production with explicit override', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_DEV_DB_SCRIPTS = '1';
    expect(() => assertDevOnly('seed')).not.toThrow();
  });
});
