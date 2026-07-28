const normalizeToPosix = (file) => file.replaceAll('\\', '/');

const stripPrefix = (file, prefix) =>
  normalizeToPosix(file).replace(new RegExp(`^${prefix}/`), '');

const joinArgs = (files) => files.map((file) => `"${file}"`).join(' ');

export default {
  'backend/**/*.{ts,js,mjs}': (files) => {
    const backendFiles = files.map((file) => stripPrefix(file, 'backend'));

    return [
      `pnpm -C backend exec eslint --fix ${joinArgs(backendFiles)}`,
      `pnpm -C backend exec prettier --write ${joinArgs(backendFiles)}`,
    ];
  },
  'frontend/**/*.{ts,tsx,js,jsx,mjs}': (files) => {
    const frontendFiles = files.map((file) => stripPrefix(file, 'frontend'));

    return [`pnpm -C frontend exec eslint --fix ${joinArgs(frontendFiles)}`];
  },
};
