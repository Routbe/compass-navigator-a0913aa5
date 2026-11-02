# Roadmap — Fase 2 Completion & System Harmonization

## 1. Workspace Studio pariteit
- [ ] Workspace "studio" feature rendert de volledige ProfileEditor (variant="workspace") i.p.v. alleen de vereenvoudigde hub-editor
- [ ] ScopeGate verwijst workspace-studio naar de nieuwe route

## 2. Chronos Audit Log, rollbacks & webhooks
- [ ] db/0168: agent_audit_logs (previous_state/new_state JSONB, reverted_at) + agent webhook_url opslag
- [ ] chronos.server.ts: recordAgentMutation, revertAgentMutation, emitAgentWebhook
- [ ] POST /api/audit/revert/$logId (eigenaar/admin, sessie-auth)
- [ ] Instrumentatie in agent-routes (links, profile draft, workspaces)
- [ ] Outbound webhooks bij workspace.upgraded en domain.verified
- [ ] Chronos-tijdlijn UI in workspace-instellingen met terugdraai-knop

## 3. Unified dark mode & mobile polish
- [ ] Auth-/claim-/connect-pagina's en Developer Console in het diepzwarte hoofdthema
- [ ] Account-switcher/dropdowns < md als bottom sheet of binnen viewport

## Verificatie
- [ ] bunx tsgo --noEmit exit 0
- [ ] Tests voor chronos-regels
