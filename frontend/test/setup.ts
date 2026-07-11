import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { clearCsrfToken } from '@/lib/csrf';

afterEach(() => {
  cleanup();
  clearCsrfToken();
  document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
});
