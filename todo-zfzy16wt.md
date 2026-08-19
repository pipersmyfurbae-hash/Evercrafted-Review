# Project TODO

- [x] Inspect the current lookbook creation experience and existing project structure
- [x] Review the provided Wreath Lifestyle Story reference package and extract its creation-flow stages
- [x] Map reference stages to the current Evercrafted lookbook product flow
- [x] Implement the agreed lookbook-flow improvements in the existing project
- [x] Add or update Vitest coverage for the new lookbook-flow behavior
- [x] Run type checks, tests, and visual verification
- [x] Save a checkpoint with all completed items marked [x]

---

## Change history

- [x] User provided Wreathlifestylestory.zip as a reference for lookbook creation flow
- [x] User requested editing the attached Evercrafted project using that reference


## Verification follow-ups

- [x] Wire workspace lookbook stage labels and preview metadata to persisted lookbook data where available
- [x] Add behavior-level coverage for the stage-to-tab mapping and preview route contract
- [x] Save a checkpoint after the follow-ups are complete

## New request: PDF export and share links

- [x] Inspect the existing lookbook schema, router, preview page, and workspace actions
- [x] Implement persisted generated share links for lookbooks
- [x] Implement finished-lookbook PDF export
- [x] Add Vitest coverage for share-link and PDF export behavior
- [x] Verify the workspace and preview flows visually
- [x] Save a checkpoint with the new functionality published

## New request: full end-to-end flow repair

- [x] Audit intake, workspace stages, entitlements, router procedures, and render/upload paths
- [x] Identify and document the wreath-anchor blocker and all missing transitions
- [x] Grant admin full access to every gated capability and verify the access path
- [x] Make prompt generation and scene prompt creation explicit and actionable
- [x] Add rendered-scene upload and review controls in the scene workflow
- [x] Connect rendered assets to the lookbook/gallery flow
- [x] Add behavior-level tests for admin access and render upload/review transitions
- [x] Run type checks, tests, and visual end-to-end verification
- [x] Save a checkpoint with the repaired full flow published

## New request: approved florals to split prompt flow

- [x] Audit the floral approval state, wreath-anchor controls, prompt generation, and lifestyle scene handoffs
- [x] Ensure approved florals are the only floral inputs used in the wreath prompt
- [x] Add a clear wreath-anchor action to transfer approved florals into the wreath prompt
- [x] Create a separate wreath-only prompt surface and export/copy actions
- [x] Keep lifestyle scene prompts separate from the wreath-only prompt
- [x] Verify the full sequence from floral approval through wreath prompt, scene prompts, uploads, review, and lookbook
- [x] Add behavior-level tests for approved-floral prompt composition and prompt separation
- [x] Run type checks, tests, and visual verification
- [x] Save a checkpoint with the repaired flow published

## Prompt-flow verification follow-ups

- [x] Fix the workspace stage-state mapping so the lifestyle tab maps to the scenes flow stage and wreath prompt stages are represented correctly
- [x] Add behavior-level tests for accepted floral decisions, anchor handoff, wreath prompt composition, and separate lifestyle prompt generation
- [x] Perform end-to-end verification of floral approval, wreath anchor, wreath-only prompt, scene prompts, upload/review, and lookbook stages
- [x] Save a checkpoint after the prompt-flow fixes and verification

## New request: restore Workspace procedures and wreath render review

- [x] Audit the missing memory.currentProject and lookbook.mine procedure errors
- [x] Restore or replace the missing Workspace tRPC procedures without breaking existing persisted flows
- [x] Add a dedicated wreath-render upload card separate from lifestyle scene uploads
- [x] Add wreath-render review status and approve/reject controls
- [x] Add behavior-level tests for the restored procedures and wreath-render handoff
- [x] Run type checks, tests, error-log review, and visual verification
- [x] Save a checkpoint with the repaired Workspace published

## New request: automatic lifestyle prompts from approved wreath render

- [x] Audit approved wreath review state, render provenance, and current lifestyle prompt construction
- [x] Add approved-wreath-based lifestyle prompt generation and persistence
- [x] Trigger or expose automatic scene prompt generation after wreath approval
- [x] Connect generated prompts to the Workspace lifestyle scene cards and upload handoff
- [x] Add behavior-level tests for approved-wreath prompt generation and persistence
- [x] Run type checks, tests, error-log review, and visual verification
- [x] Save a checkpoint with automatic scene prompts published

## New request: persist Collection Studio builds

- [x] Audit the Collection Studio reference behavior, project schema, and authenticated API patterns
- [x] Add a backend procedure to create and persist a collection/project from the Build collection brief
- [x] Connect the Collection Studio Build collection action to the persisted procedure
- [x] Add readback/navigation from the created collection into the Evercrafted workspace
- [x] Add behavior-level tests for authenticated collection creation and persistence
- [x] Run type checks, tests, error-log review, and browser verification
- [x] Save a checkpoint with Collection Studio persistence published

## New request: floral Accept/Reject fix

- [x] Audit floral decision mutation, query refresh, project readiness, and current controls
- [x] Add immediate optimistic feedback and persisted decision refresh behavior
- [x] Surface decision errors instead of failing silently
- [x] Redesign Accept and Reject controls with prominent color, icons, labels, and selected states
- [x] Verify the floral decision and wreath-anchor handoff flow
- [x] Run type checks, tests, error-log review, and visual verification
- [x] Save a checkpoint with the floral decision fix published

## New request: restore memory.latestIntake

- [x] Audit the Workspace memory.latestIntake call and the server memory router contract
- [x] Restore the missing memory.latestIntake procedure or remove the stale client dependency safely
- [x] Add regression coverage for the repaired memory contract
- [x] Run type checks, tests, error-log review, and Workspace verification
- [x] Save a checkpoint with the error fix published

## New request: transfer button visual state

- [x] Audit approved-floral state and transfer-button styling
- [x] Synchronize transfer state after floral approval and make the button visibly darken/lock
- [x] Add regression coverage for the approval-to-anchor handoff state
- [x] Run type checks, tests, logs, and visual verification
- [x] Save a checkpoint with the transfer-state fix published

## New request: transfer click actually completes

- [x] Audit why the Transfer approved florals button click is blocked or produces no visible transition
- [x] Repair the click handler and active-project/approval conditions
- [x] Add explicit completion feedback and verify the next-stage navigation
- [x] Add regression coverage for the actual click-path contract
- [x] Run type checks, tests, logs, and browser verification
- [x] Save a checkpoint with the working transfer action published

## New request: live transfer click still unresponsive

- [x] Reproduce the reported click failure against the current live Workspace
- [x] Trace button disabled state, click handler, and active-project/approval data
- [x] Repair the live blocker with visible success or error feedback
- [x] Add focused regression coverage for the failing condition
- [x] Run type checks, tests, logs, and browser verification
- [x] Save a checkpoint with the verified repair published

## New request: dynamic lifestyle scene prompts

- [x] Reproduce the repeated wreath prompt in the Scene prompts stage
- [x] Trace scene prompt generation, persistence, and Workspace rendering
- [x] Generate distinct scene prompts from approved Story Genesis beats and wreath context
- [x] Ensure each scene prompt adds setting, action, camera, light, atmosphere, and wreath placement
- [x] Add regression coverage proving scene prompts are distinct and story-enhancing
- [x] Run type checks, tests, logs, and browser verification
- [x] Save a checkpoint with the dynamic scene-prompt repair published

## New request: CometAPI automatic rendering

- [x] Confirm CometAPI endpoint, authentication, model, and response format
- [x] Decide the trigger and approval-safe render lifecycle
- [x] Add secure server-side CometAPI configuration
- [x] Add a CometAPI render adapter with timeout and error handling
- [x] Connect approved wreath and lifestyle prompts to automatic scene-specific render requests
- [x] Persist returned render assets to the matching wreath or scene review card
- [x] Add regression coverage without making live external API calls
- [x] Run type checks, tests, logs, and integration verification
- [x] Save a checkpoint with the CometAPI integration published

## New requirement: Midjourney-first production lane and Edit Lab

- [x] Collect the user’s CometAPI Midjourney, upscale, blend, vary, and alternate-model details
- [x] Define separate production and editing areas in the Workspace
- [x] Preserve source prompts, parent-child render relationships, model parameters, and review history
- [x] Add model-specific request adapters without assuming all models share one request shape
- [x] Add secure CometAPI secret configuration after the user supplies the API key
- [x] Connect initial Midjourney production renders to approved wreath and lifestyle prompts automatically
- [x] Add Edit Lab actions for upscale, blend, vary, and model selection
- [x] Add router-level provenance and review-gating tests for Comet-generated assets
- [x] Run type checks, tests, logs, and browser verification
- [x] Save a checkpoint with the render studio published

## New requirement: Photo Edits dashboard and Omni wreath references

- [x] Add a dedicated Photo Edits dashboard area separate from initial prompt production
- [x] Support wreath image upload as a persistent source reference for Omni scene renders
- [x] Connect `mj-turbo-pic-reader` / `/mj/submit/describe` with TURBO account mode
- [x] Preserve uploaded source, prompt, task ID, output URL, and parent-child render provenance
- [x] Keep Omni scene outputs in review and prevent source overwrite

## CometAPI completion gaps

- [x] Wire Comet-generated lifestyle renders to the exact Workspace scene card using sceneIndex and sceneTitle
- [x] Wire Comet-generated wreath renders to the wreath review card
- [x] Add persistent review-history events for Comet submission, completion, approval, rejection, and replacement
- [x] Add an in-Workspace entry point or clearly linked studio access for Production and Edit Lab controls
- [x] Move Vary into Edit Lab and add a real model selector
- [x] Add router-level provenance and review-gating tests for Comet-generated assets
- [x] Perform timestamp-scoped browser and server-log verification after exercising the CometAPI UI

## New requirement: Midjourney parameter profile

- [x] Apply the default initial-render parameters `--raw --exp 5 --q 2 --chaos 10 --stylize 125 --v 7`
- [x] Persist the assembled parameterized prompt in CometAPI render provenance
- [x] Keep parameter overrides available without changing Edit Lab operation defaults

## CometAPI final wiring gaps

- [x] Make approved scene prompts invoke the persisted scene-batch path automatically after wreath approval
- [x] Make the approved wreath prompt trigger the initial Midjourney render automatically, or explicitly document manual launch if provider cost control requires it
- [x] Expose Midjourney parameter overrides in the render router and Photo Edits/Workspace UI
- [x] Persist the effective override string and default fallback in render provenance
- [x] Add router-level tests for automatic scene creation, provenance, and review gating
- [x] Perform a timestamp-scoped browser/server log review after the final trigger tests

## New request: real-time CometAPI render progress

- [x] Inspect current CometAPI task submission, polling, and render asset persistence
- [x] Define persisted task lifecycle states and progress metadata
- [x] Add backend task status query with owner/admin access controls
- [x] Add real-time refresh or polling for queued and active tasks
- [x] Build a status panel with task ID, operation, model, scene, timestamps, and review state
- [x] Surface failed tasks and retry/recovery guidance without fabricating progress
- [x] Add Vitest coverage for task states and status transitions
- [x] Run type checks, tests, logs, and browser verification
- [x] Save a checkpoint with the render-status panel published

## New blocker: CometAPI response shape not recognized

- [x] Capture and inspect the raw CometAPI submission response shape safely
- [x] Expand task-ID extraction for provider response variants
- [x] Expand image/output URL extraction for provider response variants
- [x] Preserve raw provider diagnostics in failed task status without exposing credentials
- [x] Add regression tests for the observed response shape and failure behavior
- [x] Verify the retry/recovery path and publish the parsing fix

## New blocker: CometAPI task exceeded polling window

- [x] Inspect persisted task `1787067184447095` and its current review-asset state
- [x] Poll CometAPI directly to distinguish pending, completed, and failed provider state
- [x] Preserve long-running tasks as observable rather than failing ambiguously at the worker timeout
- [x] Add late-completion recovery or a manual refresh/retry path
- [x] Add regression coverage for provider timeout and late completion
- [x] Verify the status panel and publish the timeout repair

## New request: provider cost estimates before large scene batches

- [x] Inspect the existing scene-batch submission path and model/operation inputs
- [x] Confirm authoritative CometAPI pricing or define a clearly labeled configurable estimate table
- [x] Add a cost-estimate contract with scene count, model, operation, currency, and assumptions
- [x] Show the estimate before queueing large batches
- [x] Require explicit confirmation before submitting a batch above the warning threshold
- [x] Preserve estimate inputs and confirmation in task provenance
- [x] Add Vitest coverage for estimate calculations, missing pricing, and confirmation gating
- [x] Run type checks, tests, logs, and browser verification
- [x] Save a checkpoint with the cost-preflight feature published

## New request: split Midjourney four-panel grids

- [x] Inspect current CometAPI output persistence and review-card rendering
- [x] Define safe four-panel quadrant detection and crop boundaries
- [x] Preserve the original grid as the parent/source asset
- [x] Create four individual reviewable child assets with panel indices
- [x] Add panel-specific provenance and source-task lineage
- [x] Add server and image-processing regression tests
- [x] Verify the separated images in Photo Edits and Workspace review surfaces
- [x] Save a checkpoint with grid separation published

## Grid-splitting hardening follow-ups

- [x] Add actual 2x2 grid validation or narrow the split assumption to verified provider output shapes
- [x] Persist upstream sourceTaskId lineage on parent and child split assets
- [x] Add router-level persistence tests for parent grid plus four child assets
- [x] Update Workspace review UI to label source grids and individual panels
- [x] Verify split children in both Workspace and Photo Edits with runtime checks

## New request: render lifestyle images directly from Story Genesis

- [x] Audit the Story Genesis beat cards, Lifestyle Scenes tab, and current CometAPI scene-render triggers
- [x] Define beat-indexed lifestyle render persistence and shared handoff behavior
- [x] Add Story-page controls to render the existing lifestyle beat prompts
- [x] Persist generated lifestyle assets with beat index and scene provenance
- [x] Make the Lifestyle Scenes tab read and review the same persisted assets automatically
- [x] Add regression coverage for Story-to-Lifestyle render handoff
- [x] Verify the flow in the browser and save a checkpoint

## New request: manual-only CometAPI rendering

- [x] Audit every automatic CometAPI render trigger in server and Workspace flows
- [x] Disable automatic wreath rendering after anchor approval
- [x] Disable automatic lifestyle batch rendering after wreath approval
- [x] Keep Story Genesis, Workspace, and Photo Edits render buttons as explicit manual actions
- [x] Add regression coverage proving approval and page refresh do not queue provider tasks
- [x] Run type checks, tests, logs, and browser verification
- [x] Save a checkpoint with manual-only rendering published

## New request: Photo Edits does not show persisted render assets

- [x] Trace Photo Edits project ID, reviewQueue query, and asset filtering
- [x] Make persisted parent grids and split child panels visible for the active project
- [x] Preserve manual-only rendering while repairing the review queue
- [x] Add regression coverage for project-scoped parent and panel asset visibility
- [x] Run type checks, tests, logs, and browser verification
- [x] Save a checkpoint with the Photo Edits visibility fix published

## New request: complete fresh-project and manual-rendering audit

- [x] Audit project creation, active-project selection, asset queries, render task queries, and all provider submission call sites
- [x] Ensure a new project never displays render assets, tasks, prompts, or story content from another project
- [x] Remove stale fallback assets and legacy render hydration that can populate a new wreath
- [x] Disable every automatic CometAPI submission path, including approval, stage transitions, effects, polling, refresh, and page-load callbacks
- [x] Preserve explicit manual render buttons and project-scoped task/review visibility
- [x] Add end-to-end regression coverage for fresh-project isolation and zero automatic provider submissions
- [x] Run full type checks, tests, browser flow, and timestamp-scoped log verification
- [x] Save a checkpoint with the complete audit fix published

## New request: manual render progress and audit panel

- [x] Audit current manual render mutations, task lifecycle, and persisted metadata
- [x] Define audit provenance for explicit user-triggered provider actions
- [x] Add loading and progress states to every manual render control
- [x] Add a project-scoped render audit panel with task, action, prompt, timing, and outcome details
- [x] Prove page load, approval, refresh, and stage transitions create no provider tasks or audit events
- [x] Add regression coverage for manual progress and audit provenance
- [x] Run full type checks, tests, logs, and browser verification
- [x] Save a checkpoint with render observability published

## New request: Claude Sonnet 5 Story Genesis provider

- [x] Confirm the CometAPI Claude endpoint and exact Sonnet 5 model identifier
- [x] Configure a dedicated Claude/CometAPI credential without exposing it in client code
- [x] Encode the Story Genesis Engine emotional archaeology, five-movement story, and 7–14 cinematic prompt contract
- [x] Replace built-in Forge Story generation with Claude-backed structured generation
- [x] Validate narrative and prompt output, including camera, lens, light, color grade, DOF, negative prompts, and locked rules
- [x] Keep image rendering manual through CometAPI Midjourney controls
- [x] Add provider, schema, and no-automatic-render regression tests
- [x] Run type checks, tests, browser verification, and save a checkpoint

## New request: Emotional Design Translator memory pipeline

- [x] Audit memory intake and emotional-profile generation for the current provider and saved provenance
- [x] Enforce the Emotional Design Translator EIP dimensions and Evercrafted structural translation fields
- [x] Preserve client memory lineage into the translated profile and approved Story Genesis request
- [x] Ensure Claude Sonnet 5 receives only the approved translated emotional profile as its design intelligence input
- [x] Persist translator/provider provenance without exposing secrets
- [x] Add tests for profile schema, approval gating, memory lineage, and prompt provenance
- [x] Verify the complete flow without automatic image rendering and publish a checkpoint

## New request: Blueprint Composition Engine integration

- [x] Audit the current approved-profile-to-blueprint route and persisted blueprint lineage
- [x] Map approved Emotional Design Translator output, inventory, and wreath size into BCE inputs
- [x] Enforce deterministic 360-degree placement, odd focal-cluster counts, asymmetry, layers, density, and mass balance
- [x] Compile the BCE blueprint into the required high-end faux-botanical Midjourney v7 prompt
- [x] Preserve profile, Story, inventory, and blueprint provenance without triggering automatic renders
- [x] Add regression coverage for blueprint structure, prompt suffix rules, and approval gates
- [x] Verify the flow and publish a checkpoint

## New request: purchased blueprint reverse-engineering and approval workflow

- [x] Audit purchase, render upload, reverse-engineering, blueprint persistence, and manual-render paths
- [x] Send purchased rendered wreath images through the Blueprint Reverse Engineer contract
- [x] Persist scored/repairable reverse-engineered blueprint versions and image provenance
- [x] Build a visual radial placement map with editable layer controls
- [x] Require explicit blueprint approval before enabling manual wreath rendering
- [x] Export a build-sheet with clock positions, stem counts, and layer order
- [x] Add regression coverage for reverse-engineering, approval gating, edits, and export
- [x] Verify the full flow and publish a checkpoint

## Scope correction: reverse engineering is post-render only

- [x] Remove any initial-blueprint dependency on Blueprint Reverse Engineer
- [x] Ensure initial blueprint creation uses only approved Emotional Design Translator, Story Genesis, inventory, and BCE inputs
- [x] Keep visual blueprint review and explicit approval before manual wreath rendering
- [x] Preserve Blueprint Reverse Engineer as an optional post-render analysis action only
- [x] Add regression coverage proving fresh blueprint creation does not call reverse engineering
- [x] Verify and publish the corrected workflow

## Scope correction: post-purchase reverse-engineering delivery

- [x] Audit blueprint purchase records, customer entitlements, source wreath renders, and delivery routes
- [x] Trigger reverse engineering only after a blueprint purchase is confirmed
- [x] Send the purchased blueprint’s existing wreath render to the Blueprint Reverse Engineer
- [x] Persist reverse-engineering job, score/repair status, source render, and purchaser ownership
- [x] Return the validated blueprint package and build sheet only to the purchasing customer
- [x] Ensure pre-purchase creation and manual rendering never invoke reverse engineering
- [x] Add regression coverage for purchase gating, customer isolation, and delivery states
- [x] Verify and publish the post-purchase workflow

## New request: integrated memory, Story Genesis, and post-purchase reverse engineering

- [x] Configure Emotional Design Translator to process client memory inputs for initial story creation
- [x] Route Story Genesis and prompt generation explicitly through Claude Sonnet 5 using the Story Genesis contract
- [x] Trigger Blueprint Reverse Engineer only after a blueprint purchase is confirmed
- [x] Send the purchased wreath render to reverse engineering and persist customer-scoped delivery state
- [x] Return the validated reverse-engineered blueprint package to the purchasing customer
- [x] Preserve approval gates and manual-only rendering throughout all stages
- [x] Add regression coverage for provider selection, purchase gating, ownership, and delivery
- [x] Verify and publish the integrated workflow

## Inherited continuation: Blueprint review and post-purchase delivery

- [x] Add a visible Blueprint review status and explicit approval control before wreath rendering
- [x] Keep manual wreath rendering disabled until the blueprint approval control is confirmed
- [x] Verify radial placement map, editable layer review affordances, and build-sheet export in the Blueprint stage
- [x] Verify the entitlement-bound post-purchase reverse-engineering delivery action and status UI
- [x] Add regression coverage for the approval gate and build-sheet generation
- [x] Run TypeScript, Vitest, logs, and browser verification; save a checkpoint

## Session history
- [x] Inherited prior production-studio implementation and current 111-test baseline
- [x] Confirmed existing radial placement map and build-sheet export code paths in Workspace
- [x] Confirmed existing post-purchase reverse-engineering mutation and customer delivery state in routers and SignatureWreaths

## New request: Workspace page legend

- [x] Inspect Workspace shell and all available page routes
- [x] Add a persistent left-side page legend with links for Inventory, Library, Workspace, Photo Edits, Signature Wreaths, Collection Studio, and related pages
- [x] Preserve the high-end white/black/gold visual language and responsive behavior
- [x] Add regression coverage for the page legend route definitions
- [x] Run TypeScript, Vitest, logs, and browser verification; save a published checkpoint

## New request: repair memory-driven Workspace pipeline

- [x] Persist the generated emotional reading and display its full content before approval
- [x] Remove static/canonical fallback copy from visible reading and atmosphere surfaces when project data is available
- [x] Ensure Story Genesis content is generated from the current project memory and visibly displayed before story approval
- [x] Bind floral selection to the approved profile/story emotion and current inventory instead of a fixed fallback recipe
- [x] Bind the visible blueprint to the current project’s approved emotional/floral inputs and make it available for review
- [x] Repair render button and stage unlock conditions so valid approved content can be rendered manually
- [x] Add regression tests for memory variance, floral variance, blueprint variance, and render gate behavior
- [x] Run TypeScript, Vitest, logs, and browser verification; save a published checkpoint

## New request: Claude full-flow audit verification

- [ ] Map each Claude audit finding to current code, route, query, mutation, and persisted data contract
- [ ] Verify intake defaults, reflow/input persistence, reading display/loading, story beat content, floral matching, wreath-size selection, blueprint counts, render submission, parameter duplication, progress/checklist truthfulness, emotional-gate state, public gallery language, pricing, and project switching
- [ ] Classify each finding as confirmed, already fixed, stale from an older build, or not reproducible before implementation
- [ ] Add a visible “why this stem” emotion-match panel for every inventory selection using the actual profile, role, tags, palette, and compatibility data
- [ ] Implement only the verified fixes approved after the audit comparison
- [ ] Add regression coverage and run TypeScript, Vitest, logs, and browser verification; publish a checkpoint
