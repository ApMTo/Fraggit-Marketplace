export const describeE2e =
  process.env.E2E_SERVICES_AVAILABLE === '1' ? describe : describe.skip;
