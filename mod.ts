import { clearCache } from "./clear-caches.ts";

export { clearCache };

if (import.meta.main) {
  const repo = Deno.args[1];
  console.log(repo);
  clearCache(repo);
}
