# Roadmap

- [x] Logo shape: header/footer now use the official brand-kit bunny (traced vector in public/logo.svg + src/assets/rout-logo.svg)
- [x] Studio crash hardening: workspace/block null-safety, useUrlStyle catch, identity-space storage guards, ErrorBoundary reset clears Cache Storage
- [x] Contact portal: 4 categories with dynamic fields + local triage seeding (DB columns added to Neon)
- [x] Bug attachments: /api/public/contact/attachment (5 MiB, png/jpg/txt/log/json, magic-byte sniffed)
- [x] Sitemap: added /contact, /press, /explore, /wifi-qr, /vcard-qr; 97 URLs, valid XML
- [x] SEO: Organization + SoftwareApplication JSON-LD on homepage, Article fallback JSON-LD + og:url for all MDX docs
- [x] Footer: 4 balanced columns (Platform / Infrastructure / Ecosystem / Support & Legal)
- [x] Verify: tsgo exit 0, 1415/1415 tests pass, browser check of contact/footer/sitemap/JSON-LD
- [x] Performance: duplicate-call check done — the two double fetches (health, showcase) are dev-only effect remounts of idempotent GETs, no production impact

## Sovereign OS refactor (Nov 2026)
- [x] Link Neon database connection
- [x] `/` Omni-Bar gateway: smart parser (URL → Studio QR, @handle, commands), below-the-fold reveal
- [x] Signed-in visitors on `/` redirected server-side to `/dashboard` (not on custom-domain profiles)
- [x] `/dashboard` cockpit: bento widgets left + Chronos event stream right
- [x] Old dashboard content moved to `/dashboard/assets`, `/dashboard/qr`, `/dashboard/links`
- [x] `/dashboard/identity`: connected apps + primary-email change with per-app push selection
- [x] `identity_relays` table (migration + schema)
- [x] Local-first snapshot cache for dashboard state
- [x] tsgo exit 0 + tests
- [x] Short-link resolver: isolate edge cache (15 s) with a KV-ready store interface
- [x] Account merge (0150–0152 + 0158 applied): relays move to the primary, same-app duplicates archived with a warning
- [x] Identity relays are the primary model: relay registry kept in lockstep with forwarding rules, targets self-heal on email change, push protocol is the fallback
- [x] Local-first outbox for relay pause/resume (0 ms UI, persisted queue, background flush)
- [x] Obsidian gateway with ecosystem section (Login met ROUT, Workspaces, API); custom-domain profile lazy-loaded out of the gateway bundle
- [x] Cockpit without QR statistics (moved to /dashboard/assets); Chronos stream adds hub contact messages and relay mail
- [x] rout_app least privilege (0158) verified live: read/write OK; truncate/create/drop/alter/temp refused
- [x] GEO: Organization + Person (founder) + SoftwareApplication (ROUT OS, AGPLv3) + SoftwareSourceCode in the head of /
- [ ] Switch the Neon connection login from the owner to rout_app — the linked Neon connection still logs in as neondb_owner (checked 2 Nov); every app request already steps down to rout_app

## Approval & GEO (Nov 2026)
- [x] North star updated to the founder's wording
- [x] 0153, 0155, 0156 applied; 96, 0149, 0154 registered (already live); nothing pending
- [x] Sitewide knowledge graph in __root (Organization, founder, ROUT OS, source code), keywords meta
- [x] Title convention `PageName | ROUT - Sovereign Digital Identity OS` on every ROUT page
- [x] "What is ROUT?" section on /manifesto (4 languages)

## Trust, age gating & go-live (Nov 2026)
- [x] North star metric → Login met ROUT bij externe apps per week
- [ ] Neon link in Lovable still logs in as neondb_owner (DATABASE_URL is only used where no Neon link exists, e.g. Vercel) — waits on the user replacing the Neon connection string
- [x] Sign-up: required terms/privacy/16+ checkbox (server refuses without it); implicit notice above social buttons
- [x] Remove birth-date fields (vCard block, verification requirement, birthdate dialog)
- [x] Drop the empty user_birthdates table (0161, merge routine cleaned first)
- [x] user_verified_claims table (0159, rout_app read-only) + Sovereign Trust widget on /dashboard/identity
- [x] OIDC scopes verify_human / verify_18_plus prepared (boolean payload, not yet issued)
- [x] Final check: tsgo 0, 1,456 tests, 59 internal links on 12 key pages OK

## Agentic web — phase 1 (now)
- [x] Agent scopes assets:write, profile:draft, identity:read_public (never identity_relays) only via short-lived (≤1 h) OAuth access tokens; static API keys can never carry them; validated on every request
- [x] Standard agent responses: human_action_required (safe temporary action_url) and 402 upgrade (upgrade_url + reason)
- [x] /llms.txt and /.well-known/openapi.json
- [x] Headless Profile Hub: JSON for Accept: application/json / AI user agents on /<handle> and /u/<alias>
- [x] /connect reverse-handshake entry onto the existing OIDC consent (/oauth/authorize)
- [x] GET /api/badge/verify: verified human + requesting origin matches a registered domain

## Agentic web — phase 2 (after phase 1)
- [ ] Agent-provisioned workspaces: no owner, claim token only, NO email (agent delivers the link), hard delete after 48 h incl. OAuth apps, QR codes, drafts
- [ ] Claim handoff: claimer becomes Owner, agent becomes a visible Connected App/Bot (revocable)
- [ ] Agent M2M API: workspaces, oauth-apps (secret once), assets; quota checker + 402 before every mutation
- [ ] Chronos audit log with the agent as actor; bots visible in Team settings
- [ ] Custom domains M2M: pending + DNS records, verify endpoint
- [ ] Agent rollbacks: previous_state snapshot only for Agent/Bot mutations (none for humans) + POST /api/audit/revert/{log_id}
- [ ] Outbound agent webhooks: agent_webhook_url, signed events (workspace.upgraded, domain.verified)

## Workspace Studio parity (after agent phase 1)
- [ ] Workspace Studio (/studio/w/<slug>/hub) uses the same Studio engine as the personal Studio (all tabs, design, block types, QR, advanced settings), loading/saving by workspace_id
