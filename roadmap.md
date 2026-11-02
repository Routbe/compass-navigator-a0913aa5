# Roadmap — Fase 2 Completion & System Harmonization

## 1. Workspace Studio pariteit
- [x] Workspace "studio" feature rendert de volledige ProfileEditor (variant="workspace") via nieuwe route `/studio/w/<slug>/studio`
- [x] ScopeGate verwijst workspace-studio naar de nieuwe route

## 2. Chronos Audit Log, rollbacks & webhooks
- [x] db/0168: agent_audit_logs (previous_state/new_state JSONB, reverted_at) + oauth_clients.agent_webhook_url — live toegepast en geverifieerd (tabel 1, functies 3, kolom 1)
- [x] chronos.ts/.server.ts: recordAgentMutation, revertAgentMutation, emitAgentWebhook + 6 tests groen
- [x] POST /api/audit/revert/$logId (sessie-auth, eigenaar/admin of delegerende mens)
- [x] Instrumentatie in agent-routes (links, profile draft, workspaces)
- [x] Outbound webhooks bij workspace.upgraded (redeemPlusWorkspace) en domain.verified (verifyWorkspaceDomain)
- [x] Chronos-tijdlijn UI in workspace-instellingen met terugdraai-knop

## 3. Unified dark mode & mobile polish
- [x] Auth (AuthNeon), claim-pagina's (Claim, claim_.$token, claim_.workspace.$token) geforceerd dark zoals /connect en /console
- [x] WorkspaceSwitcher- en ProfileMenu-dropdowns: viewport-safe op < md (collisionPadding, max-h 70vh, scroll)

## Verificatie
- [x] bunx tsgo --noEmit exit 0
- [x] Build OK
