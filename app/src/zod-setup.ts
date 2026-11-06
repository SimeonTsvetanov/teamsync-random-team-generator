// Must be the FIRST import of main.ts: Zod decides at schema-creation time whether to use its JIT
// (`new Function`), which our CSP blocks — Firefox logs a violation. jitless before any schema exists.
import { config } from "zod";

config({ jitless: true });
