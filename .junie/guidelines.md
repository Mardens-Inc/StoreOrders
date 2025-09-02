Project Development Guidelines (Store Orders)

Scope and audience
- This document captures project-specific knowledge for advanced contributors working on the Store Orders monorepo (Rust Actix backend + Vite/React frontend).
- It focuses on what is unique in this repository: build topology, environment flags, runtime behavior, testing strategy, and gotchas.

1. Build and configuration
1.1 Top-level overview
- Backend: Rust (edition 2024), Actix Web. Entry point: src-actix/main.rs; library crate in src-actix/lib.rs.
- Frontend: Vite + React + TypeScript (vite.config.ts), Tailwind present.
- Combined DX: In debug builds, the backend spawns a Vite dev server automatically and reverse proxies via vite-actix.

1.2 Commands (package.json)
- Frontend dev: npm run dev (starts Vite).
- Backend run (dev): npm run run-api (cargo run --bin store_orders).
- Build frontend: npm run build-frontend (tsc && vite build).
- Build backend (release): npm run build-api (WSL requirement; see below).
- Full build: npm run build (runs build-frontend then build-api).
- Lint frontend: npm run lint.
- Watch (dev helper): npm run watch uses cargo watch; optional and requires cargo-watch installed.

Notes on build-api
- package.json uses: wsl bash -ic "cargo build --release".
  - This requires WSL to be available and a Rust toolchain installed in the default WSL distro.
  - If you are on native Windows without WSL, run cargo build --release directly instead of npm run build-api.

1.3 Backend runtime behavior
- Port: 1422 (const PORT in src-actix/lib.rs).
- Debug vs Release: DEBUG is a crate-level static: pub static DEBUG: bool = cfg!(debug_assertions).
  - In DEBUG (i.e., cargo run, cargo test), the server:
    - Adjusts the current working directory to target/dev-env (created if missing). Any relative file I/O should account for this.
    - Spawns a Vite dev server thread and uses vite-actix to proxy frontend in development.
- Static files: Products are served from /products mapped to the products directory.

1.4 Environment variables
- JWT secrets (src-actix/auth/jwt.rs):
  - Access token: JWT_ACCESS_SECRET (fallback JWT_SECRET). In DEBUG only, a hardcoded dev secret is used if env vars are missing.
  - Refresh token: JWT_REFRESH_SECRET (fallback JWT_SECRET). In DEBUG only, a hardcoded dev secret is used if env vars are missing.
  - Production: Do not rely on debug fallbacks; set proper secrets. The code refuses to operate without secrets in non-debug builds.
- Database: Uses database_common_lib to resolve a database connection and sqlx (MySQL). The code sets the database name to "stores". Connection credentials are resolved via database_common_lib; configure your local environment accordingly (see that library’s documentation). Do not commit credentials.
- dev-server.json exists in the repo; treat it as legacy/local tooling metadata. Do not rely on committed secrets; prefer environment-level configuration.

1.5 Tooling versions
- Rust: Edition 2024. Works with Tokio runtime and Actix Web 4.9.
- TypeScript: 5.7.x; Vite: 6.x; React: 18.x. ESLint + @typescript-eslint configured.

2. Testing
2.1 How to run tests
- Backend (Rust): cargo test from the repository root runs unit tests for the src-actix crate.
- Frontend: No test runner is configured in package.json. If you need frontend tests, add your preferred stack (e.g., Vitest + React Testing Library) and document it before enabling in CI.

2.2 Adding backend tests
- Preferred: Unit tests colocated with modules via #[cfg(test)] mod tests in the relevant Rust file. This keeps tests near the code and leverages debug-only behavior (e.g., JWT secrets fallback).
- Integration tests: Place in tests/ directory at the workspace root; each file is a separate test crate. Ensure any integration tests do not require external services unless guarded/feature-flagged.
- Async tests: Use #[actix_rt::test] or Tokio test if you need async context; keep them hermetic (no external DB) unless explicitly intended.

2.3 Example tests we validated
- We added minimal unit tests in src-actix/auth/jwt.rs that exercise token creation and verification for both access and refresh tokens. These tests depend on the DEBUG fallback secrets and do not require environment configuration.
- Verified results (cargo test):
  - 2 passed; 0 failed; 0 ignored (auth::jwt::tests::create_and_verify_access_token_round_trip, auth::jwt::tests::create_and_verify_refresh_token_round_trip).
- You may use these as a template when adding tests to other modules.

2.4 Guidelines for new tests
- Keep tests hermetic:
  - Prefer pure/unit tests over DB- or network-dependent tests unless the test is specifically for integration.
  - If you must touch the filesystem, remember that in DEBUG runs, runtime code may change the working directory; but unit tests run in the crate’s target/test harness and won’t execute run(). Use absolute paths or temp dirs where needed.
- JWT-related tests:
  - In debug builds, you can rely on the hardcoded dev secrets. In release or CI configured to mimic prod, set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET (or JWT_SECRET) explicitly.
- Name tests descriptively and assert invariants beyond mere success (e.g., exp > iat, token_type == "refresh").

3. Additional development information
3.1 Code organization and startup
- Entry point: src-actix/main.rs calls store_orders_lib::run(). The run() function in lib.rs initializes logging, sets DB name (stores), initializes tables across modules (auth, categories, products, orders, stores), then starts Actix HttpServer and (in debug) a Vite dev proxy.
- Route structure: /api scope configures auth, categories, products, orders, stores, upload. 404s under /api return JSON error; non-API routes are handled by vite-actix frontend router config.

3.2 Style and static analysis
- Rust:
  - Use rustfmt (cargo fmt) and clippy (cargo clippy) before submitting. Target edition 2024 idioms.
  - Error handling uses anyhow and thiserror; prefer anyhow::Result<T> in application code and bubbling errors with context.
  - Prefer small, focused modules with explicit pub use exports where crossing boundaries.
- TypeScript/React:
  - Run npm run lint. ESlint is configured with @typescript-eslint, react-hooks, and react-refresh plugins; code should adhere to their defaults in this repo.
  - TS strictness aligns with tsconfig.json; prefer explicit types when crossing module boundaries or serializing to API.

3.3 Environment and DX tips
- When developing endpoints that touch files, remember DEBUG changes CWD to target/dev-env. Use PathBuf::from and create_dir_all to ensure directories exist relative to the working directory, or switch to absolute paths for robustness in tests.
- Serving static files from /products: drop images into products/ relative to the working directory (debug: target/dev-env/products) or adjust path mapping if you change where media lives.
- Vite proxy:
  - In debug, the backend will keep trying to start the Vite server and proxy to it. If Vite crashes, the thread restarts it; check logs for crash loops.

3.4 Security notes
- Never ship with fallback JWT dev secrets. For production, set at least JWT_ACCESS_SECRET and JWT_REFRESH_SECRET. Alternatively, set JWT_SECRET to the same strong value for both, but separate secrets are recommended.
- Do not commit internal credentials. The dev-server.json present in the repo contains environment-specific values; treat it as legacy and replace with environment configuration or local, git-ignored files.

3.5 Deployment and packaging
- npm run publish and build.bat reference an internal pwp tool and a specific SSH key path. These are for internal deployment and will not work outside the intended environment.
- For external deployments, build backend via cargo build --release and host the resulting binary; serve the built frontend from dist/ via the Actix static configuration or your preferred CDN/origin setup.

Appendix A: Reproducing the validated test run
- Pre-req: Rust toolchain installed. No env vars required due to debug fallbacks.
- Steps:
  1) From repo root: cargo test
  2) Expected: 2 tests pass under auth::jwt (access and refresh token round-trips).
- If running in a production-like CI where debug fallbacks are disabled, set:
  - JWT_ACCESS_SECRET and JWT_REFRESH_SECRET (or JWT_SECRET) to non-empty values before cargo test.
