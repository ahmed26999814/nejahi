// Server-side adapter is enabled ONLY on the dedicated Neon preview branch.
// Production retains the unchanged global fetch implementation.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEON_ENABLE_API_BRIDGE !== "1") return;
  const { neonRestFetch } = await import("./lib/neon/restCompat.mjs");
  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (input, init) => {
    const neonResponse = await neonRestFetch(input, init);
    return neonResponse ?? originalFetch(input, init);
  };
}
