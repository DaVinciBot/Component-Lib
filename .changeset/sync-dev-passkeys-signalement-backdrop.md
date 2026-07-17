---
'@davincibot/components': minor
---

Rattrapage de la branche dev du 17/07 : gestion des passkeys (PasskeysManageModal,
PasskeyNameModal, intégration dans MfaSection et mode webauthn du StepUpDialog),
panneau « Signaler un problème » (ReportPanel, option d'envoi anonyme), backdrop
unifié des overlays (OverlayBackdrop + pile globale, suppression de la prop
dimmed). Requiert @davincibot/lib ≥ 1.2.0 (settings/passkeys, settings/report,
step-up webauthn, catégorie signalement).
