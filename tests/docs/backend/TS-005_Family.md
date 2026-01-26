# Test Case: TS-005 - Family & Collaboration

## Description
Validate family group management, member invitations, and administrative safeguards.

## Pre-conditions
- Backend API is running at `http://192.168.1.235:3000/api/v1`.
- User is authenticated and has `FAMILY_ADMIN` role.

## Manual Test Steps

### 1. Invite New Member
1. Send a `POST` request to `/family/invite` with:
   - `email`: "new_member@example.com"
   - `role`: "FAMILY_MEMBER"
2. **Expected Result**: 
   - Status Code: 201 Created
   - Response contains invitation details (id, email, role, expiry).
   - Console logs show the clear-text token (for manual dev testing).

### 2. List Invitations
1. Send a `GET` request to `/family/invitations`.
2. **Expected Result**: 
   - Status Code: 200 OK
   - List includes the invitation from Step 1.

### 3. List Members
1. Send a `GET` request to `/family/members`.
2. **Expected Result**: 
   - Status Code: 200 OK
   - List includes the current admin user.

### 4. Admin Safeguard: Prevent Self-Demotion
1. Attempt to change your own role to `FAMILY_MEMBER` via `PUT /family/members/{id}/role` if you are the only admin.
2. **Expected Result**: 
   - Status Code: 400 Bad Request
   - Error: `LAST_ADMIN`.

### 5. Admin Safeguard: Prevent Self-Disabling
1. Attempt to set your own status to `DISABLED` via `PUT /family/members/{id}/status`.
2. **Expected Result**: 
   - Status Code: 400 Bad Request
   - Error: `CANNOT_DISABLE_SELF`.

### 6. Revoke Invitation
1. Send a `DELETE` request to `/family/invitations/{id}`.
2. **Expected Result**:
   - Status Code: 200 OK.

## Automated Script
- **File**: `tests/testScripts/backend/TS-005_Family.test.ts`
- **Command**: `npx jest tests/testScripts/backend/TS-005_Family.test.ts`

## Sign-off
- **Tester**: ____________________
- **Date**: ______________________
- **Result**: PASS / FAIL
- **Notes**: ____________________________________________________
