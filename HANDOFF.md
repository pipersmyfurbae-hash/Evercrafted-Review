# Evercrafted production handoff

## Verified connections

The authenticated memory journey now has a server-authoritative Emotional Intelligence Profile gate. Profile generation persists an `awaiting_approval` version; approval applies bounded overrides and downstream procedures resolve only the latest approved version. Story Genesis, floral mapping, blueprint composition, and prompt compilation remain protected by that approval contract.

The workspace reads the persisted Story Genesis record through `memory.latestStory`. The Story tab displays the saved narrative and cinematic beats, while the Lifestyle tab reads the same persisted beat array and presents each beat as an explicit external-render handoff with setting, camera, light, prompt, and `awaiting external render` status. The latest Story Genesis readback path is covered by a router test.

Lookbook editing is owner-scoped. The editor can save title, subtitle, and maker-note content, move the lookbook through draft, shareable, or published status, generate a tokenized share URL, and export a print/PDF copy. Public routes expose only shareable or published records; draft records remain available through the authenticated owner query. Update and status mutations reject lookbooks outside the user’s projects.

The current regression suite passes with 14 test files and 58 tests, and TypeScript validation passes. Visual captures were taken for `/workspace` and `/lookbook` at a desktop viewport. The workspace screenshot intentionally shows the approval gate when no authoritative profile is present; downstream generation remains disabled in that state.

## Human-operated prototype steps

Midjourney remains a deliberate human-in-the-loop step. The application compiles and displays the server-approved human-facing and machine-facing prompts, but it does not claim to have rendered an image automatically. The operator copies a prompt into the selected external renderer, chooses the strongest result, uploads the returned image through the Admin render-return surface, and completes the review queue by approving or requesting a replacement. Approved render assets can then be associated with Signature Wreath assets or used in the lookbook gallery workflow.

Stripe checkout is implemented through the configured test-sandbox integration. A live purchase verification still requires the project owner to claim the test sandbox, complete a checkout, and confirm the webhook-created entitlement before treating commerce as production-verified. Signature blueprint and ECR package downloads remain plan- and ownership-gated and are fulfilled through short-lived signed URLs rather than direct object URLs.

## Suggested verification script

1. Submit a memory and create or load the authenticated project.
2. Generate the server-side emotional profile, approve it, and confirm the gate changes to `approved`.
3. Generate Story Genesis, approve the story, and confirm the full narrative and 7–9 cinematic beats appear in Story.
4. Open Lifestyle and copy a persisted beat prompt into Midjourney; upload the selected result through Admin and approve it.
5. Review the deterministic floral mapping, blueprint, prompt studio, and build artifact controls.
6. Edit title, subtitle, and maker note in Lookbook, save the content, generate a share link, and verify the public token route hides drafts.
7. Complete Stripe test checkout and verify the resulting entitlement and 15-minute artifact download responses.

## Entitlement matrix evidence

| Access state | Story | Blueprint download | ECR package | Publish lookbook | Upload render |
|---|---:|---:|---:|---:|---:|
| Reader | Yes | No | No | No | No |
| Maker | Yes | Yes | No | No | No |
| Studio | Yes | Yes | Yes | Yes | Yes |
| Purchased Signature ownership | Subject to plan | Eligible artifact | Eligible artifact | Not implied | Not implied |

The plan capability matrix is covered by the entitlement tests, while Signature ownership is granted separately through the verified Stripe webhook path and checked by the protected artifact download procedures.

## Final evidence pass

The final regression run passed 17 test files with 67 tests, including emotional gates, deterministic composition, ECR integrity, lookbook ownership, render upload/review, Signature fulfillment, entitlement boundaries, prompt flow, and notification validation/dispatch fallback. Responsive captures were taken at a 390px viewport for the public intake, workspace, lookbook, admin inventory/render queue, Signature collection, and Signature detail routes. Desktop captures were also taken for the public landing, workspace, lookbook, and admin surfaces.

The consolidated journey is: submit a public memory; generate and approve the server-side emotional profile; generate Story Genesis and approve the narrative; retrieve the persisted beats for floral, blueprint, and prompt stages; copy a scene prompt into the external renderer; upload the chosen image through Admin and complete review; edit and share the lookbook; complete test checkout; and verify ownership- and plan-gated signed artifact access. External Midjourney rendering and Stripe sandbox claiming remain operator actions rather than automated claims.

## Guided-flow and profile-retry update — 2026-08-14

The public intake remains the sole memory source. It persists the submitted memory and derived collection name, then routes into the project Workspace without duplicate memory or story entry. Workspace gating is now strictly sequential: memory, emotional-profile generation and approval, Story Genesis generation and approval, florals, blueprint, renders, and lookbook.

The emotional-profile mutation now makes one bounded repair request when the first structured LLM response fails canonical `validateEmotionalProfile`. The server persists nothing until the repaired candidate passes validation and deterministic formula/ring-band derivation. A partial-first/complete-second router test covers this path. The latest regression suite passes with 19 test files and 82 tests, and TypeScript validation passes.

A direct browser check of `/workspace?projectId=30001` from an unauthenticated preview session correctly displayed the protected return-to-intake state. A fully authenticated manual generation check still requires an active logged-in browser session; it should be run using the operator test sequence above.

## Recurring emotional-reading fix — 2026-08-14

A second production failure showed that the earlier two-call retry was insufficient: project 60001 received a partial first response and another incomplete repair response. Profile generation now requires all nine top-level emotional-profile sections in the structured response contract, requests up to three bounded attempts with a 5,000-token output budget, and extracts both string and text-block response content.

If all provider attempts remain incomplete, the server creates a deterministic, schema-valid intake-safe profile and persists it in `awaiting_approval`. This fallback is deliberately neutral and is still subject to the same canonical validation, formula derivation, ring-band derivation, and human approval gate. It prevents the client from being trapped by a transient provider omission while preserving downstream authorization.

Regression coverage now includes repeated incomplete responses followed by a valid repair and repeated incomplete responses followed by the canonical fallback. The full suite passes with 19 test files and 83 tests; TypeScript validation passes. The preview browser reached the protected opening state for `/workspace?projectId=60001`; an authenticated click-through remains the final operator check.
