import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Only allow our Replit dev domain (or localhost in dev). Credentials are
// required so the session cookie is included in cross-path requests within
// the same repl domain.
const allowedOrigins = new Set<string>([
  `https://${process.env.REPLIT_DEV_DOMAIN}`,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:80',
]);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin requests (origin is undefined for non-cross-origin)
      if (!origin || allowedOrigins.has(origin)) return cb(null, true);
      cb(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  }),
);

// ── Session ───────────────────────────────────────────────────────────────────
// HttpOnly + SameSite=Strict ensures the cookie cannot be read by JavaScript
// and is not sent on cross-site requests, making session hijacking from a
// cross-origin context impossible.
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? 'dev-fallback-secret-change-me',
    name: 'ft_sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
