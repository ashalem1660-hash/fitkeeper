# DroneOps Field OS — Release Log

## v0.2 — Productive Field Operations Workspace

**Status:** Live production demo / operational foundation

**Delivered:**
- Replaced the prototype appearance with a clean light interface using white, blue and green operational styling.
- Introduced ongoing customer project files with multiple linked field visits, rather than single one-off jobs.
- Added worker-focused execution flow: checklist, visit progress, notes, customer update, before/after evidence controls and daily closing.
- Added follow-up visit planning so active work can continue across multiple days.
- Linked visit updates to customer service status and latest customer communication state.
- Branded login and signup screens for DroneOps.
- Redirected the legacy authenticated dashboard path back into the DroneOps workspace.

**Production verification:**
- Merged production commit: `04a467b44e5026bca08958c53a8bec9a085f99db`.
- Vercel production deployment built from that merge reached `READY`.
- Production deployment `/droneops` returned HTTP 200 and rendered the light DroneOps operations workspace with active projects and visit-based workflow.

**Known limitations before full operational rollout:**
- Authenticated persistence and phone-based before/after photo upload require a real pilot-user smoke test.
- Secure photo URLs must be validated after refresh and expiry before relying on evidence storage in daily operations.
- The Vercel/GitHub hosting project still carries the legacy `fitkeeper` name until a dedicated DroneOps migration is executed.
- Mobile browser theme-bar metadata remains a minor cosmetic follow-up; the in-app visual system is already light themed.

## v0.1 — Live Operations Pilot

**Status:** Live pilot / management demo

**Delivered:**
- Mobile-first operations calendar at `/droneops`.
- Today's field-work view, management view and daily closing view.
- Work order detail drawer with client, contact, phone, address and navigation access.
- Job status progression, checklist, notes and reschedule action in the UI.
- Supabase-isolated DroneOps workspace and private attachment bucket.
- Public demo route with authenticated cloud-saving design.

**Production verification:**
- GitHub commit for the live application route: `33fb9e5d6c7186005dec2083a4e9607588a18963`.
- GitHub commit allowing public pilot route: `91aef2076a7bdddb7493cb0df6081c315107bcfb`.
- Vercel production deployment reached `READY`.
- Live `/droneops` route returned HTTP 200 and displayed DroneOps calendar data.

**Known limitations before operational rollout:**
- Login/signup UI still carries legacy FitKeeper content.
- Authenticated return route and full cloud-persistence workflow require final verification.
- Photo before/after upload requires end-to-end mobile verification.
- Hosting project is still named `fitkeeper` until dedicated project migration.

## Required format for future releases

For every new visible release, add:
- Version and release name.
- Commit SHA.
- Preview or production deployment status.
- Live route tested.
- Smoke tests completed.
- Known limitations and next build target.
