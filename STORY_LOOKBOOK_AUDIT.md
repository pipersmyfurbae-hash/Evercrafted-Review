# Evercrafted Story-to-Lookbook Audit

## Executive finding

The journey was not adding up because the final Lookbook surface was not a true projection of the active project pipeline. Several stages generated or displayed valid data, but the final surface relied on unrelated or decorative fallbacks.

| Stage | Intended source | Audit finding | Correction |
|---|---|---|---|
| Story Genesis | `stories.projectId` | Persisted story existed, but lifestyle prompts could fall back to fixed lake-house scenes instead of the saved beat fields. | `buildLifestyleScenePrompts` now accepts persisted Story Genesis beats and uses their title, role, setting, camera, light, and prompt. |
| Florals | `floralSelections.projectId` | Accepted floral decisions were available to Workspace, but the public/owner Lookbook read did not expose them. | Lookbook presentation now loads accepted floral decisions for the project. |
| Blueprint | `blueprints.projectId` | Blueprint composition was present in the Workspace, but Lookbook had no project-linked blueprint read. | Lookbook presentation now loads the latest project blueprint. |
| Render/gallery | `renderAssets.projectId` and approval status | Workspace filtered approved lifestyle assets, while Lookbook could show a decorative gradient or unrelated static content. | Lookbook presentation now loads approved project render assets. |
| Lookbook identity | `lookbooks.projectId` | Workspace selected `ownedLookbooks[0]`, which could be another project; when none existed, the page fell back to static copy. | Workspace selects the lookbook matching the active project and idempotently ensures a project-owned draft exists. |
| Public/share reads | slug/share token | Reads returned lookbook metadata only. | Public slug and share-token reads now include the joined project presentation while still hiding drafts. |

## Primary Guided Flow Correction

The public intake memory is now the single source of truth. After the first reading is approved, the user continues into a persisted project-specific Workspace URL. Workspace loads that saved intake and no longer asks the user to paste the memory or rewrite the story. The intended sequence is: **saved memory → server-side emotional reading → user approval → Story Genesis generation → Story Genesis approval → Florals → wreath anchor → render studio → lifestyle scenes → gallery → Lookbook**.

Florals, Blueprint, Render Studio, Lifestyle, Gallery, and Lookbook are visibly locked until their prerequisites are met, and direct later-tab URLs are returned to Story when the prerequisite is missing. Older projects without a saved intake show a clear return-to-intake action instead of a misleading downstream workflow. If an unauthenticated user approves the first reading, the intake is held through login and resumed automatically.

## Corrected flow

The authoritative chain is now:

> active project → approved emotional profile → Story Genesis version → accepted floral decisions → deterministic blueprint → external wreath/lifestyle renders → approved render assets → project-owned lookbook presentation → shareable or published public surface.

The external Midjourney step remains human-operated. A returned image is not treated as public lookbook content until it is uploaded to the active project and approved through the render-review workflow.

## Verification

TypeScript validation passes. The focused lookbook and prompt-flow tests pass, including project-owned lookbook provisioning and Story Genesis beat-to-lifestyle prompt mapping. The complete regression suite passes with 18 test files and 78 tests, including no-project bootstrap, idempotent lookbook provisioning, and Story Genesis beat-to-lifestyle mapping.

The screenshot pass also exposed an operational limitation: an unauthenticated or still-opening `/workspace` capture can show the loading state, while `/lookbook` correctly shows a draft state when no public lookbook record has been published. This is expected access/status behavior, not evidence that a draft should be presented as a public sales lookbook.

## Remaining human-operated steps

An operator must approve the emotional profile, accept floral decisions, lock the wreath anchor, render externally, upload returned assets, approve the assets, edit the lookbook content, generate a share link or publish it, and complete checkout verification in the Stripe sandbox. The software now preserves the project identifier and source records across those steps rather than substituting unrelated or decorative data.

## Root-cause summary

The primary defect was **pipeline bootstrap plus projection disconnect**, not a single failed generator. In the live authenticated session, `memory.currentProject` returned `null`, so Workspace converted that to `projectId: 0`, disabled all project-dependent reads and mutations, and never reached Story Genesis, florals, blueprint, renders, or lookbook. Even when a project existed, Workspace selected the first owned lookbook and the Lookbook page could fall back to decorative static content. The secondary defect was **scene-source divergence**: the lifestyle prompt builder used fixed copy even when persisted Story Genesis beats were available. The correction now idempotently bootstraps a project, ensures a project-owned draft lookbook, makes the Lookbook a project-scoped read model, and makes lifestyle prompts inherit the persisted story beats.


## Emotional-profile resilience update — 2026-08-14

The first profile response is parsed and validated against the canonical Emotional Design Profile schema. When the provider returns an incomplete or malformed candidate, `memory.generateProfile` makes exactly one repair request containing the failed candidate and an explicit instruction to return every required field. The repaired response is validated again, then receives deterministic composition-formula and ring-band derivation before persistence. No partial profile is inserted; if the bounded repair also fails, the mutation returns the existing actionable error.

This preserves the distinction between resilience and schema weakening: transient provider omissions are retried without accepting incomplete emotional data into Story Genesis, florals, blueprint, or lookbook stages. A router regression covers the partial-first/complete-second path.

The current regression suite passes with **19 test files and 82 tests**, and TypeScript validation passes. The unauthenticated preview browser correctly showed the protected return-to-intake state for `/workspace?projectId=30001`; an authenticated operator session is still required for the final live click-through of that project’s profile-generation button.

The finalized operator sequence is: confirm the saved memory, generate or repair the emotional profile, approve it, generate and approve Story Genesis, open Florals, lock the wreath anchor, review the blueprint and prompt, approve a wreath render, and inspect the project-owned Lookbook presentation.

## Recurring profile failure update — 2026-08-14

Project 60001 demonstrated that a single repair attempt was not enough when the provider omitted most profile sections in both the initial and repair responses. The structured response contract now requires all nine top-level profile sections, requests up to three bounded attempts with a 5,000-token output budget, and accepts both ordinary JSON strings and text-block content responses.

When all provider attempts fail canonical validation, the server uses a deterministic, intake-safe profile that is itself passed through the canonical validator and deterministic composition derivation before it is stored as `awaiting_approval`. This is not an approved design interpretation; it is a neutral continuity profile that keeps the sequential gate intact and requires human approval before Story Genesis or downstream floral composition.

The regression suite now passes with **19 test files and 83 tests**, including repeated incomplete responses followed by a successful repair and repeated incomplete responses followed by the canonical fallback. TypeScript validation passes. The preview browser reached the protected opening state for project 60001; an authenticated operator click-through remains required to verify the UI mutation completion on that specific persisted project.
