# Roadmap — Workspace Studio Pariteit & Opschoning

## 1. Workspace Studio = persoonlijke Studio
- [x] Kritieke bug gefixt: wsCanvas werd nooit gezet → workspace saves/publishes stuurden leeg workspaceId
- [x] Alle tabs beschikbaar (Links, Design, Analytics, Domains, Settings) — Domains-tab niet langer verified-only voor workspaces
- [x] Bedrijfsverificatie i.p.v. identiteitsverificatie: verified = DNS-geverifieerd domein of Business-plan
- [x] WorkspaceDomainPanel op het Domains-tabblad: claim domein → DNS TXT → rout.be/<domein> (bv. rout.be/google.com)
- [x] Username = vaste slug (geen vrije invoer); live URL = /w/<slug> of /<domein> na verificatie
- [x] Publieke /w/<slug> rendert gepubliceerde Studio-payload via dezelfde ProfileView als persoonlijke profielen
- [x] Robuustheid: misvormde blokken worden gefilterd in readPublishedStudio; ProfileView toont geen "u/null" meer zonder username

## 2. Dubbele editor vernietigd
- [x] /studio/w/<slug>/hub is een permanente redirect naar /studio/w/<slug>/studio
- [x] getWorkspaceHub/saveWorkspaceHub verwijderd uit workspaces.functions.ts
- [x] Studio.tsx en ScopeGate verwijzen alleen nog naar de volledige Studio

## Verificatie
- [x] bunx tsgo --noEmit exit 0, build OK, workspace-tests groen
- [x] Browser: publieke Studio-pagina rendert (thema, blokken, audiospeler), hub-URL redirect correct
- [ ] Ingelogde Studio-editor zelf niet browser-getest (geen sessie beschikbaar in sandbox)
