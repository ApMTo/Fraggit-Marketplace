import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { areE2eServicesAvailable } from './helpers/services-available';

export default async function globalSetup(): Promise<void> {
  loadEnv({ path: resolve(__dirname, '../.env') });
  loadEnv({ path: resolve(__dirname, '../../.env') });

  const available = await areE2eServicesAvailable();
  process.env.E2E_SERVICES_AVAILABLE = available ? '1' : '0';

  if (!available) {
    console.warn(
      '\n[e2e] Postgres/Redis unavailable — e2e tests will be skipped.\n' +
        'Start services with: docker compose up -d\n',
    );
  }
}
