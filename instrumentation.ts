// Server-side adapter is enabled only by explicit Neon mode.
// Production retains the unchanged global fetch implementation.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PUBLIC_NEON_MODE !== "1") return;
  const { neonRestFetch } = await import("./lib/neon/restCompat.mjs");
  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (input, init) => {
    const neonResponse = await neonRestFetch(input, init);
    return neonResponse ?? originalFetch(input, init);
  };
}
