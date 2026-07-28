export function assertDevOnly(scriptName: string): void {
  const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase();

  if (nodeEnv !== 'production') {
    return;
  }

  if (process.env.ALLOW_DEV_DB_SCRIPTS === '1') {
    console.warn(
      `[${scriptName}] ALLOW_DEV_DB_SCRIPTS=1 — running despite NODE_ENV=production.`,
    );
    return;
  }

  console.error(
    `[${scriptName}] Refusing to run: seed and mock data are development-only (NODE_ENV=production).`,
  );
  process.exit(1);
}
