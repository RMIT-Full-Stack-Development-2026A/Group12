# Merge Checklist - feature/edit-profile -> main

## Before creating Pull Request

- [ ] npm test -> all tests pass
- [ ] No console.log() in production files
- [ ] All stub imports replaced with real imports (or smart fallback pattern is in place)
- [ ] _stubs/ folder is listed in .gitignore or removed before final merge
- [ ] _stubs/ folder removed or confirmed in .gitignore
- [ ] Run with USE_STUBS=false npm test to verify no stub is active
- [ ] Check NODE_ENV=production start does not trigger any stub warning
- [ ] MOUNT_INSTRUCTIONS.md reviewed by app.js owner
- [ ] DEPENDENCIES_TO_ADD.md reviewed by team lead
- [ ] git fetch origin && git merge origin/main run locally
- [ ] No conflicts in: app.js, server.js, package.json, auth.middleware.js, user.model.js

## Design Decision: Email is read-only in Edit Profile

SRS 3.1.1 requires Email to be editable.
Team decision: Email is displayed but not editable.
Reason: Email is the unique login identifier.
		 Changing it requires re-verification (out of scope for this sprint).
Impact: Partial compliance with SRS 3.1.1.
Fields editable: Username, Password, Country.
Field read-only: Email (shown in UI but PUT request ignores email field).

## Files I OWN (no other branch should touch)

- modules/user/* (all files)
- modules/preference/* (all files)
- tests/profile/* (all files)
- _stubs/* (temporary, remove before final release)

## Files I IMPORT but do NOT own

- middleware/auth.middleware.js -> feature/login
- models/user.model.js -> feature/register
- models/tokenBlacklist.model.js -> feature/login
- app.js -> project setup
