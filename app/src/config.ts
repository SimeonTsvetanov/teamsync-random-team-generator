// Single import point for the app config inside app/. Widens the `as const` literal types so
// optional fields (null today) type-check when they are enabled later.
import { app as config, type AppConfig } from "../../app.config.ts";

export const app: AppConfig = config;
