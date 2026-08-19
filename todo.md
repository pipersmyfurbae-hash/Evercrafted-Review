
# Refined Requirements — 2026-08-13

- [x] Finalize visual direction collaboratively during the design phase.
- [x] Build cinematic public landing page and memory intake with guided mode and weaving reveal state.
- [x] Add server-side Emotional Design Translator with structured profile, editorial summary, and client approval gate.
- [x] Add server-side Story Genesis Engine with five-movement 600–800 word narrative, 7–9 cinematic beats, versioning, and revisions.
- [x] Ingest and normalize four supplied Transpac JSON batches with validation report and admin review workflow.
- [x] Map inventory into EVS-FISA profiles with approval, substitution, and provenance controls.
- [x] Implement deterministic emotion-driven floral mapper with A/B/C tiers, seeded rerolls, explainable role-grouped selections, and accept/reject flow.
- [x] Implement deterministic Blueprint Composition Engine with clusters, ring bands, clock positions, silence arcs, and printable/build outputs.
- [x] Implement versioned renderer-agnostic ECR compiler with validated artist patches and downloadable .ecrpkg packages.
- [x] Implement prompt studio with machine-facing and human-facing prompts, copy/export actions, and human-in-the-loop external Midjourney rendering workflow.
- [x] Implement upload/import, provenance, thumbnail, review, approval, rejection, and replacement workflow for wreath and lifestyle renders.
- [x] Implement story-derived lifestyle prompts and gallery management.
- [x] Implement lookbook editor and public/shareable lookbook states: draft, published, and shareable.
- [x] Implement secure expiring blueprint/package downloads and strict Reader, Maker, and Studio entitlements.
- [x] Implement authenticated client workspace, studio queue dashboard, and role-gated admin console.
- [x] Implement server-side LLM integration, managed object storage, and milestone notifications.
- [x] Add tests for deterministic mapping, blueprint/ECR invariants, authorization, entitlements, storage access, and notification workflows.
- [x] Visually verify responsive landing, intake, story, blueprint, gallery, lookbook, dashboard, and admin surfaces.
- [x] Save a final checkpoint after all completed items are marked [x].

# Gap Resolution Items — 2026-08-13

- [x] Wire workspace floral selection to seeded reroll, explain-why-selected, and persisted accept/reject decisions.
- [x] Expose explicit blueprint clusters and ring-band metadata in the blueprint model and UI.
- [x] Generate real printable/build artifacts and secure downloads.
- [x] Implement ECR patch objects, validation/replay, and .ecrpkg packaging.
- [x] Build a dedicated prompt studio showing both prompt variants with export actions.
- [x] Connect external-render upload, review, approval, rejection, and replacement end to end.

# Journey Test — 2026-08-13

- [x] Test admin inventory ingestion through EVS-FISA profiling and review.
- [x] Test public memory intake through emotional reading, poetic story, floral recipe, blueprint, and prompt studio.
- [x] Test Midjourney human-in-the-loop render upload and admin review handoff.
- [x] Test lookbook progression, Stripe plan checkout, entitlement grant, and secure blueprint/package access.
- [x] Document verified connections, blockers, and prototype-only steps for the user.

# Reverse-Engineered Signature Wreaths — 2026-08-13

- [x] Inspect supplied lookbook archive and inventory finished wreath assets and metadata.
- [x] Add admin Signature Wreath intake with managed image storage and immutable provenance.
- [x] Add assembled-wreath reverse-engineering job, floral observations, confidence flags, and no-invented-SKU handling.
- [x] Add EVS-FISA assembled-wreath profiles and operator review workflow.
- [x] Generate versioned Story Genesis narrative, cinematic beats, and collection DNA from finished wreath analysis.
- [x] Generate reverse-engineered recipe, Blueprint JSON, WGS -RE genome, score report, ECR scene, and .ecrpkg.
- [x] Add admin Signature Wreath catalog with approval, asset ordering, publication, and audit controls.
- [x] Add public Signature Wreath collection and detail pages with linked wreath render, floral recipe, blueprint, story, lifestyle renders, and purchase actions.
- [x] Add render/lifestyle asset association and human-in-the-loop review to Signature Wreath listings.
- [x] Add verified commerce fulfillment and secure expiring downloads for Signature Wreath artifacts.
- [x] Add tests and visual verification for reverse engineering, catalog publication, ownership, entitlements, and artifact integrity.

# Signature Wreath Completion Gaps — 2026-08-13

- [x] Load and render approved signatureWreathAssets on public Signature Wreath collection/detail pages instead of decorative placeholders.
- [x] Wire Signature Wreath detail to real published story, blueprint preview, recipe, and lifestyle asset data rather than draft placeholder content.
- [x] Connect Signature Wreath purchase actions to authenticated checkout and artifact fulfillment with plan/ownership gating.

# Reverse-Engineering Gap Resolution — 2026-08-13

- [x] Add persisted EVS-FISA assembled-wreath profile review, edit, and approval decisions.
- [x] Compile a real reverse-engineered ECR scene and assemble/download an actual .ecrpkg artifact for Signature Wreaths.
- [x] Add tests for assembled-wreath profile decisions and reverse-engineered ECR/.ecrpkg generation.

# Final Gap Corrections — 2026-08-13

- [x] Fix Signature Wreath detail blueprint rendering to read the stored reverse blueprint shape.
- [x] Add EVS-FISA review override editing, persisted-state retrieval, and visible decision status in the admin UI.
- [x] Serialize and store a real binary .ecrpkg artifact instead of JSON-only content.
- [x] Add tests for EVS-FISA review decision persistence and real .ecrpkg artifact format.

# Integration Verification — 2026-08-13

- [x] Add an integration-style test for reviewProfile persistence and retrieval through the Signature router/database path.
- [x] Add an integration-style test for Signature draft artifact key, MIME type, and expiring-download metadata.

# Fulfillment Corrections — 2026-08-13

- [x] Add user-facing post-purchase Signature Wreath download controls for eligible users.
- [x] Store and deliver a distinct blueprint artifact instead of returning the ECR package for blueprint requests.
- [x] Test Signature checkout metadata, webhook entitlement grants, and blueprint-versus-ECR download behavior.

# Render Asset Workflow Corrections — 2026-08-13

- [x] Add explicit Signature asset reject/unapprove and replacement actions with audit provenance.
- [x] Associate Signature assets to existing renderAssets records and expose managed selection in admin UI.
- [x] Add thumbnail metadata and public-approved-only tests for Signature asset visibility.

# Signature Catalog Final Corrections — 2026-08-13

- [x] Add persisted Signature asset sort-order editing and reordering controls.
- [x] Add explicit unapprove action with audit provenance for approved Signature assets.
- [x] Test that public Signature catalog/detail routes expose only approved assets.

# Signature Asset Readback Corrections — 2026-08-13

- [x] Order Signature Wreath asset queries by persisted sortOrder in admin and public procedures.
- [x] Add router coverage proving published and detail routes return only approved assets in sort order.

# Public Collection Verification — 2026-08-13

- [x] Test signature.published filtering and hero selection with mixed approved and unapproved assets.

# Story Genesis Final Corrections — 2026-08-13

- [x] Fail Signature draft creation when Story Genesis does not return a valid narrative and cinematic beats instead of storing placeholder story content.
- [x] Test Signature story revision version increments, cinematic beats, and collection DNA persistence.
- [x] Surface generated Signature story and collection DNA in admin retrieval/UI verification.

# Story Content Surfacing — 2026-08-13

- [x] Show generated Signature story title, excerpt, and cinematic beat count in the admin catalog.
- [x] Assert catalog retrieval includes generated story payload and collection DNA after draft creation.

# Story Catalog Retrieval Verification — 2026-08-13

- [x] Add a router test that creates or reads a Signature draft through catalog and verifies generated story payload and collection DNA are returned.

# Lifestyle Prompt Verification — 2026-08-13

- [x] Test story-derived lifestyle prompt generation, versioned gallery slots, and external-render status metadata.
- [x] Expose persisted lifestyle prompt slots in public Signature detail data for gallery fulfillment.

# Signature Visual and Integrity Verification — 2026-08-13

- [x] Capture visual verification for Signature admin review, catalog publication, ownership-gated download, and plan-specific entitlement states.
- [x] Add a focused artifact-integrity verification covering ECR and blueprint gzip signatures through the user-facing/admin flow.

# Authenticated Visual State Verification — 2026-08-13

- [x] Capture authenticated admin/catalog screenshots with real Signature listing and review data.
- [x] Verify Reader, Maker, Studio, and purchased-ownership download states visually or through documented route checks.

# Entitlement Matrix Verification — 2026-08-13

- [x] Add a focused Signature entitlement matrix harness and verification note covering Reader, Maker, Studio, and purchased ownership download states.
- [x] Re-capture or document Signature detail UI states only after the entitlement matrix is exercised.

# Emotional Design Translator Completion — 2026-08-13

- [x] Define shared Emotional Intelligence Profile and Evercrafted wreath-translation schema with canonical enums and validation.
- [x] Generate and persist complete server-side emotional profiles in awaiting_approval status with provenance.
- [x] Add protected profile approval, revision, supersession, ownership, and override gates.
- [x] Require approved emotional profile versions for Story Genesis, floral mapping, blueprint composition, and prompt compilation.
- [x] Replace Workspace hardcoded emotional brief with the approved server profile.
- [x] Add Emotional Design Translator unit, router, journey, negative-path, and visual verification coverage.
- [x] Save the Emotional Design Translator milestone checkpoint after all validation passes.

# Final Evidence Corrections — 2026-08-14

- [x] Add notification workflow tests for validation, accepted dispatch, and upstream failure fallback.
- [x] Capture responsive and explicit intake, blueprint, gallery, and Signature detail visual states after entitlement verification.
- [x] Add a consolidated handoff verification note for public intake, admin ingestion/review, external-render return/review, lookbook progression, checkout entitlement, and secure downloads.
- [x] Save the final checkpoint after this final evidence ledger update.

# Emotional Profile Gate Corrections — 2026-08-13

- [x] Filter current emotional profile reads to approved status and resolve the active user project instead of hardcoded project 1.
- [x] Apply bounded profile overrides to the next revision’s actual profile fields and preserve audit provenance.
- [x] Add router and Workspace coverage proving draft/superseded profiles cannot drive downstream composition.

# Emotional Gate Evidence Corrections — 2026-08-13

- [x] Test blueprintFromProfile rejection for awaiting, draft, and superseded emotional profiles.
- [x] Test currentProfile excludes superseded latest versions and returns only the approved profile.
- [x] Add a focused Workspace composition harness proving no approved profile does not silently become an authoritative downstream profile.

# Approved Profile Readback Contract — 2026-08-13

- [x] Define currentProfile behavior when a newer awaiting or superseded revision follows an older approved profile.
- [x] Return the most recent approved profile for Workspace when one exists, and block only when no approved profile exists.
- [x] Add positive and mixed-version router tests for approved profile retrieval.

# Mixed Profile Version Verification — 2026-08-14

- [x] Exercise currentProfile with both a newer non-approved revision and an older approved profile, proving the approved version is selected.

# Emotional Translator Integration Verification — 2026-08-14

- [x] Add router integration coverage for server-generated profile persistence, provenance, and awaiting_approval status.
- [x] Add a journey harness covering profile approval, approved Story Genesis, approved blueprint composition, and downstream prompt inputs.

# Downstream Emotional Authorization — 2026-08-14

- [x] Add server-enforced floral-mapping and prompt-compilation procedures that reject missing, awaiting, draft, or superseded profiles.
- [x] Add router tests proving floral mapping and prompt compilation fail without approval and succeed with the latest approved profile.
- [x] Add an approved-profile journey harness from approval through Story Genesis, floral mapping, blueprint, and prompt inputs.

# Latest Approved Downstream Verification — 2026-08-14

- [x] Make floral mapping and prompt compilation resolve the latest approved profile when profileId is omitted or a newer revision is supplied.
- [x] Test floral mapping and prompt compilation with a newer non-approved revision plus an older approved profile.
- [x] Exercise one approved-profile journey harness through Story Genesis, florals, blueprint, and prompt compilation.

# Router Journey Evidence — 2026-08-14

- [x] Add an integration-style test that approves a profile, runs Story Genesis, resolves florals, composes a protected blueprint, and compiles a protected prompt while carrying the approved profile version through each step.
- [x] Assert the journey begins with an approval state transition rather than only a pre-seeded approved fixture.

# Production Journey Refinement — 2026-08-14

- [x] Wire the authenticated workspace to persisted protected Story Genesis output with real five-movement narrative and cinematic beat cards.
- [x] Replace placeholder lifestyle scene copy with persisted Story Genesis beat-derived prompt slots and explicit external-render status.
- [x] Add owner-safe lookbook editing controls for title/content, status, and share-link lifecycle in the workspace/lookbook surfaces.
- [x] Add tests for protected lookbook update/status ownership and story-to-lifestyle beat persistence behavior.
- [x] Verify the refined journey visually and document prototype-only external Midjourney and checkout steps.

# Verification Corrections — 2026-08-14

- [x] Wire the Workspace lifestyle tab to persisted Story Genesis beats/latestStory data and show per-beat external-render status instead of hardcoded scenes.
- [x] Add editable lookbook content fields and expose owner edit/share/status controls consistently in Workspace and Lookbook surfaces.
- [x] Add automated tests for main-flow Story Genesis beat persistence/readback in the workspace/lifestyle path.
- [x] Create a handoff note documenting prototype-only Midjourney render handoff and checkout verification steps.

# Verification Corrections II — 2026-08-14

- [x] Add owner-facing lookbook edit/share/status controls to Workspace alongside the Lookbook editor.
- [x] Add an integration-style test that runs protected Story Genesis generation, verifies beats are persisted, then reads them back via latestStory.

# Router Journey Isolation Fix — 2026-08-14

- [x] Isolate Signature router mock state so EVS-FISA review assertions remain deterministic after approval-journey coverage.

# Greenery Selection Fix — 2026-08-14

- [x] Inspect normalized inventory role data and Florals recipe payloads for the missing greenery path.
- [x] Normalize supported greenery role/classification inputs without inventing provenance.
- [x] Make deterministic role selection greenery-first and expose an inventory-gap state.
- [x] Add composition and inventory regression coverage for greenery selection and normalization.
- [x] Verify Florals tab greenery and no-greenery states visually and run full validation.

# Workspace projectId validation fix — 2026-08-14

- [x] Trace the `/workspace` mutation sending `projectId: 0` and identify the active-project fallback path.
- [x] Prevent workspace mutations from firing until a valid positive projectId is resolved.
- [x] Add regression coverage for missing/invalid active project IDs and valid authenticated project resolution.
- [x] Verify `/workspace` no longer emits the projectId validation error and save a checkpoint.

# Emotional Reading Incomplete Mutation Fix — 2026-08-14

- [x] Trace project 30001 intake fields and the emotional-profile generation response validation.
- [x] Make profile generation tolerate valid structured readings without treating optional fields as incomplete.
- [x] Add retry-safe regression coverage for incomplete and valid emotional readings.
- [x] Verify Workspace profile generation and publish the fix.

# Weave Button Interaction Fix — 2026-08-14

- [x] Identify why valid client-entered memory leaves “Weave my wreath” disabled or non-responsive.
- [x] Correct submit eligibility and preserve server-side validation for the actual intake fields.
- [x] Add regression coverage for valid and invalid submit states and verify the click path visually.
- [x] Publish the verified Weave button correction.

# Client-Led Intake Simplification — 2026-08-14

- [x] Remove the guided prompt card and its “use this prompt” interaction from the public intake.
- [x] Make the actual memory, occasion, honoree, location, people, and time fields the only intake inputs used downstream.
- [x] Preserve first-reading approval, server-side emotional profiling, memory-derived naming, and direct Story Genesis handoff.
- [x] Add regression coverage and visual verification proving no guided prompt card remains.
- [x] Publish the simplified intake correction.

# Seamless Memory-to-Genesis Transition — 2026-08-14

- [x] Carry the submitted memory through first-screen processing into the project-specific Workspace without duplicate text entry.
- [x] Show a subtle processing animation while the server derives the memory-based collection name and persists the handoff.
- [x] Present clear transition copy that the next step is the emotional gate and Story Genesis, not another memory form.
- [x] Add tests and visual verification for the processing and seamless handoff states.
- [x] Publish the transition correction.

# Memory-Derived Collection Naming — 2026-08-14

- [x] Derive the persisted project name from the first-screen memory rather than atmosphere-only or Untitled fallbacks.
- [x] Carry the memory-derived name into the project-owned draft lookbook title and Workspace heading.
- [x] Add regression coverage for memory-derived naming and legacy fallback handling.
- [x] Verify the intake-to-Workspace title visually and publish the correction.

# Primary Guided Flow Correction — 2026-08-14

- [x] Persist main-page memory intake and carry its project/intake IDs into Workspace automatically.
- [x] Remove the duplicate story/memory entry requirement before Story Genesis and use the persisted intake as source.
- [x] Make emotional profile generation and approval the visible prerequisite before Story Genesis.
- [x] Gate Florals, Blueprint, Render, Lifestyle, and Lookbook tabs until their true upstream prerequisites are met.
- [x] Replace contradictory review-stems/Story Genesis copy and add tests plus visual verification for the corrected order.

# Full Story-to-Lookbook Audit — 2026-08-14

- [x] Map story, profile, floral, blueprint, render, gallery, and lookbook identifiers and persistence contracts.
- [x] Trace Workspace outputs against Lookbook inputs and identify stale, hardcoded, or disconnected data.
- [x] Correct the cross-stage data flow so the final lookbook reflects the approved story, recipe, blueprint, and approved renders.
- [x] Add end-to-end regression coverage for the corrected story-to-lookbook handoff.
- [x] Verify the full journey visually and publish an audit checkpoint with root-cause documentation.

# Emotional Reading Recurrence — 2026-08-14

- [x] Trace project 60001’s persisted intake and the current profile-generation retry failure.
- [x] Harden profile generation against the remaining incomplete-response failure mode without weakening canonical validation.
- [x] Add regression coverage for the newly identified failure mode and rerun the full suite.
- [x] Verify the Workspace path and publish the fix with updated handoff notes.
