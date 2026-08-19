# Evercrafted End-to-End Journey Test Findings — 2026-08-13

## Verified public client path

The deployed public landing route `/` loaded successfully. A representative lake-house memory was submitted with honoree, location, people, and dusk context. The progressive intake counter reached 6/6 signals, the weaving state appeared during submission, and the server returned an emotional reading titled “Cedar Dusk” with an editorial summary, narrative paragraph, and five-color palette. The explicit “Approve emotional direction” gate was visible.

## Verified authenticated workspace path

After Manus sign-in, `/workspace` loaded successfully. The workspace exposed Story, Florals, Blueprint, Render Studio, Lifestyle, and Lookbook stages. Florals showed role grouping, A/B/C tiers, explainable selection reasons, seeded reroll, and Accept/Reject controls. Blueprint showed EC_WR_V2, seed 42, silence arc 45–135 degrees, four placed stems, ring bands, clusters, deterministic status, Maker package, and ECR package actions. Render Studio exposed a human-facing Midjourney prompt and a machine-facing structured prompt containing identity, formula, composition, floral placements, style DNA, photography, negative constraints, and parameters.

## Verified authenticated admin path

After authentication, `/admin/inventory` loaded as Studio / Inventory Operations Room for the admin account. The supplied `transpac_everyday_batch.json` was attached successfully and the UI staged 370 records. The Persist Batch action entered an “Importing” state, but the test did not observe completion or populated review rows before the session ended; this remains an ingestion-runtime blocker to investigate.

## Verified plans and lookbook

`/plans` loaded with Reader, Maker ($19/month), and Studio ($79/month) descriptions and checkout entry points. The deployed lookbook route is `/lookbook/demo`, not `/lookbook`; `/lookbook` correctly returned 404. `/lookbook/demo` loaded with draft, shareable, and published state controls, share-link preparation, PDF export, and package-purchase actions. No publication or payment action was submitted during this test.

## Important boundary

The Midjourney step is explicitly human-in-the-loop. Evercrafted generates and exports/copies the prompts; a person renders externally in Midjourney and uploads the resulting image through the admin Render Return workflow. No live Midjourney render was created in this test, and no external render asset was uploaded.
