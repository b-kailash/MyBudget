### **1. Security Gaps & Vulnerabilities**

Security should be built-in from the start, not added on at the end. Several critical items are either missing or scheduled too late in the plan.

*   **1.1. Inadequate Authentication & Authorization Policies:**
    *   **Missing Password Policy:** The spec does not define minimum password length or complexity. This is a fundamental security requirement to prevent weak passwords. **Recommendation:** Add a clear password policy (e.g., OWASP recommendations) in `Specs.md` and implement it during the registration flow (Phase 1D).
    *   **Rate Limiting is an Afterthought:** The `todo.md` defers rate limiting to Phase 9. This is extremely risky. Auth endpoints (`/login`, `/register`, `/refresh`) and password reset endpoints are primary targets for brute-force and credential-stuffing attacks. **Recommendation:** Implement rate limiting on sensitive endpoints as part of Phase 1D (Authentication).
    *   **Vague Role Permissions:** The spec defines roles (`family_admin`, `member`, `viewer`), but the implementation plan is not specific enough about enforcement. This ambiguity can lead to privilege escalation bugs. **Recommendation:** For each endpoint in the spec, explicitly define which roles can access it and what actions they can perform. These rules must be enforced in a middleware and have dedicated integration tests. For example, verify that a `member` can only modify their own transactions.

*   **1.2. Transaction Import Feature is a Major Attack Vector (Phase 3A):**
    *   The file import feature is a significant security risk. Maliciously crafted files can lead to Denial of Service (DoS), data corruption, or even remote code execution if the parsers have vulnerabilities.
    *   **Recommendations:**
        1.  **Strict File Validation:** Do not trust file extensions. Validate files by their content/magic numbers.
        2.  **Resource Limits:** Enforce strict file size limits (e.g., < 5MB) via the web server (Nginx/Cloudflare) and the backend.
        3.  **Sandboxed Processing:** Run the file parsing in a separate, resource-constrained process or worker thread to prevent it from blocking or crashing the main API server.
        4.  **Input Sanitization:** Treat all data from imported files as untrusted. Sanitize every field to prevent cross-site scripting (XSS) or other injection attacks, especially in fields like `payee` or `notes`.

*   **1.3. Missing Security Hardening in CI/CD:**
    *   The plan lacks automated security checks. **Recommendation:** Add `npm audit` and a dependency vulnerability scanner (like Dependabot) to the CI pipeline (Phase 8, but should be earlier) to be alerted of known vulnerabilities in third-party packages.
