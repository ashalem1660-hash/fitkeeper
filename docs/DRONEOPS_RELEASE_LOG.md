# DroneOps Field OS — Release Log

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
