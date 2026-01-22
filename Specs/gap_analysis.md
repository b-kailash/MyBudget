# MyBudget Application: Gap Analysis

## Introduction

This document provides a critical analysis of the `Specs.md` and `todo.md` for the MyBudget application. While the project is well-documented and the plan is detailed, this review identifies several critical gaps and risks, particularly concerning security and core functionality.

Addressing these issues early will prevent significant architectural problems and vulnerabilities later.

---

### 1. Critical Security Vulnerabilities & Gaps

These are issues that pose a direct risk to the application's users and data integrity.

#### **1.1. Incomplete User and Family Management Lifecycle**
This is the single largest gap in the specification. The current plan only allows a new user to create a *new* family. It does not define how additional members can join or be managed.

*   **Risk:** Without a secure invitation and management system, there is no way to form a "family" beyond a single user, making the core feature of the app unusable and potentially leading to insecure workarounds.
*   **Recommendations:**
    *   **Spec:** Define a complete user lifecycle: inviting new members (e.g., via a secure, single-use link or code), revoking invitations, removing members, and promoting members to `family_admin`.
    *   **Spec:** Add safeguards to prevent a family from being left without an administrator.
    *   **`todo.md`:** Add a new, high-priority phase (`Phase 1.5`) dedicated to building these family management endpoints before starting the frontend.

#### **1.2. Unsafe Offline Sync Conflict Resolution**
The "last write wins" strategy defined in `Specs.md` (4.2) is dangerous for a financial application. It guarantees data loss.

*   **Risk:** If two users edit the same transaction offline and online, one of those changes will be silently overwritten, leading to incorrect financial records and user frustration.
*   **Recommendations:**
    *   **Spec:** Change the conflict resolution strategy. The backend API (`/api/v1/sync`) must detect stale updates (e.g., by comparing timestamps) and respond with a `409 Conflict` error.
    *   **Spec:** The mobile client must be responsible for handling this `409` error by fetching the latest data and prompting the user to manually resolve the conflict.

#### **1.3. Foundational Security Measures are Deprioritized**
Essential security features are either missing from the spec or planned for the final "Polish" phase.

*   **Risk:** Deferring security leaves the application vulnerable to common attacks during its entire development and initial deployment.
    *   **No Rate Limiting:** The `login` endpoint is exposed to brute-force and credential-stuffing attacks.
    *   **No Account Lockout:** There is no policy to temporarily lock an account after multiple failed login attempts.
    *   **No Password Policy:** The spec does not enforce password complexity or length, allowing users to choose weak passwords.
*   **Recommendations:**
    *   **`todo.md`:** Move "Add rate limiting" from Phase 9 to Phase 1B (Backend Setup).
    *   **`todo.md`:** Add new tasks to Phase 1D (Authentication) for implementing account lockout and mandatory password policies (e.g., using `zod` for validation).

#### **1.4. Insecure JWT Handling**
The spec mentions JWTs but offers no guidance on secure storage. Storing JWTs in `localStorage` on the web is common but makes them vulnerable to XSS attacks.

*   **Risk:** An XSS vulnerability on the web app could allow an attacker to steal the user's JWT and take over their session.
*   **Recommendations:**
    *   **Spec:** Update the authentication spec (`5.1`) to recommend using secure, `HttpOnly` cookies for storing tokens on the web. This is the single best defense against token theft via XSS. JWTs are still appropriate for the mobile client.

#### **1.5. File Import Attack Surface**
The file import feature (`todo.md`, Phase 3A) introduces a significant new attack surface that is not adequately addressed.

*   **Risk:** Maliciously crafted files (e.g., CSV, XLSX) could lead to remote code execution, denial-of-service, or other server-side vulnerabilities if not handled with extreme care.
*   **Recommendations:**
    *   **`todo.md`:** Add explicit security tasks to Phase 3A:
        *   "Implement strict server-side file type validation (checking magic numbers, not just MIME type/extension)."
        *   "Enforce and document strict file size limits."
        *   "Configure parsing libraries to disable potentially dangerous features (e.g., XML external entities in XLSX files)."

---

### 2. Major Functional & Specification Gaps

These are ambiguities or missing features that will likely cause implementation delays or require significant rework.

#### **2.1. Ambiguous Multi-Currency Support**
The schema allows for different currencies on accounts and transactions, but the logic for handling them is not defined.

*   **Problem:** How should the application calculate the total balance of an account in `USD` that has transactions in `EUR`? Without a defined exchange rate mechanism, all financial calculations are unreliable.
*   **Recommendations:**
    *   **Spec:** Make a firm decision. Either:
        1.  **Single Currency First:** Explicitly state that for V1, all transactions *must* be in the account's currency, and enforce this with validation.
        2.  **Plan for Multi-Currency:** Define the architecture for handling exchange rates (e.g., a service to fetch rates, a field to store the rate at the time of transaction), even if the UI is deferred.

#### **2.2. Missing "Forgot Password" Flow**
This is marked as "Future Work" in `todo.md`, but it's a day-one feature for any application with user accounts.

*   **Problem:** Users will inevitably forget their passwords. Without a self-service reset flow, they will be permanently locked out of their accounts, which is a critical usability failure.
*   **Recommendations:**
    *   **`todo.md`:** Elevate the password reset feature from "Future Work" to a core phase, likely as part of Phase 1D (Authentication) or a new dedicated phase. This will require integrating an email sending service.

---

### Conclusion

The project has a solid foundation, but the gaps identified above are critical. It is strongly recommended to update the `Specs.md` and `todo.md` to incorporate these changes **before** proceeding with frontend development. Prioritizing security and clarifying functional requirements now will build a much more robust, secure, and successful application.
