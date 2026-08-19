# CometAPI integration research

CometAPI official documentation: https://apidoc.cometapi.com/

The official docs state that CometAPI uses an OpenAI-compatible API base URL of `https://api.cometapi.com/v1` and bearer API-key authentication. The image-generation route is `POST https://api.cometapi.com/v1/images/generations`. The documented request includes `model`, `prompt`, `n`, and `size`; GPT image models can return base64 image data in `data[].b64_json`. The docs recommend starting with `gpt-image-2`, `n: 1`, and `1024x1024`.

The docs also describe an asynchronous extension using `async: true`, returning `data.task_id`, with polling through `GET /v1/images/generations/{task_id}` until status is `success` or `failure`. Async support is documented for `gpt-image-2` and `doubao-seedream-4-0-250828`. Synchronous generation is simpler for an initial integration; async is preferable for long-running scene batches if the deployment can persist task state and poll safely.

The official CometAPI site is https://www.cometapi.com/ and confirms one API key, pay-as-you-go usage, and OpenAI-compatible routing across image and other model families. API key must remain server-side and should be configured as a project secret, not exposed to the browser.

Primary sources:
- https://apidoc.cometapi.com/
- https://apidoc.cometapi.com/api/image/openai/images
- https://www.cometapi.com/

## User-supplied Midjourney model detail

The first requested model is `mj-fast-imagine`. The user supplied a CometAPI request example using `POST https://api.cometapi.com/v1/responses` with `Authorization: Bearer $COMETAPI_API_KEY`, JSON content type, and body `{ "model": "mj-fast-imagine", "input": "..." }`. The supplied documentation also references a model operation route `POST /mj/submit/imagine`. The adapter must confirm which route returns the final image versus task metadata, preserve the original input prompt, and handle task completion, retries, and output validation before creating a review asset.

## User-supplied Midjourney Blend detail

The Blend operation uses `POST https://api.cometapi.com/mj/submit/blend` with `Content-Type: application/json`, bearer authentication, a text `prompt`, `botType: "MID_JOURNEY"`, and `accountFilter.modes: ["FAST"]`. The API returns a task object with a task ID. The adapter must poll `GET https://api.cometapi.com/mj/task/{task_id}/fetch` until a terminal status and then validate the returned image URL before creating a review asset linked to the parent render.

## User-supplied Midjourney subtle upscale detail

The subtle upscale operation uses `POST https://api.cometapi.com/v1/tasks` with model `mj-fast-upscale-subtle`. The payload includes an `input` object with the source CometAPI `task_id` and selected image `index`. The adapter must treat this as an edit child of the source task, retrieve the resulting task output, validate that resolution increased and that the result remains visually close to the selected source, and create a new review asset without replacing the source.

## User-supplied Photo Edits / Omni detail

The Photo Edits dashboard should accept an uploaded wreath reference and use the Omni-compatible workflow to place that wreath into a scene render. The supplied operation uses model `mj-turbo-pic-reader`, `POST https://api.cometapi.com/mj/submit/describe`, bearer authentication, `botType: "MID_JOURNEY"`, and `accountFilter.modes: ["TURBO"]`. The API returns a task ID; poll `GET https://api.cometapi.com/mj/task/{task_id}/fetch` until terminal status, validate the output image, and persist it as a new reviewable child render linked to the uploaded wreath source.

## User-supplied Midjourney Vary detail

The Vary operation uses model `mj-turbo-low-variation` through `POST https://api.cometapi.com/mj/submit/action`, with bearer authentication, `botType: "MID_JOURNEY"`, and `accountFilter.modes: ["TURBO"]`. The response returns a task ID; poll `GET https://api.cometapi.com/mj/task/{task_id}/fetch` until terminal status and validate the output URL. The Edit Lab should preserve the source render and create the variation as a new child asset.

## User-supplied prompt analyzer detail

The prompt analyzer uses model `mj-fast-prompt-analyzer-extended` through CometAPI’s `POST https://api.cometapi.com/mj/submit/imagine` route, with bearer authentication, `botType: "MID_JOURNEY"`, and `accountFilter.modes: ["FAST"]`. The task is polled through `GET https://api.cometapi.com/mj/task/{task_id}/fetch`. In the product, this should be represented as a prompt-analysis/refinement operation whose output is reviewable text or metadata before a user sends the refined prompt to an image-generation operation.

## User-supplied second prompt analyzer detail

The user also supplied model `mj-fast-prompt-analyzer` through `POST https://api.cometapi.com/mj/submit/imagine`, with bearer authentication, `botType: "MID_JOURNEY"`, and `accountFilter.modes: ["FAST"]`; results are polled through `GET https://api.cometapi.com/mj/task/{task_id}/fetch`. The system should offer this as a selectable prompt-refinement model alongside `mj-fast-prompt-analyzer-extended`, with the refined prompt requiring user approval before it enters the final Midjourney imagine lane.

## Cost estimate research (Aug 18, 2026)

CometAPI’s official pricing guidance states that models without official APIs, including Midjourney-compatible services, are billed per call and that CometAPI determines the per-call price; it also notes that account discounts may apply. The public model pages were dynamically rendered and did not expose stable price text through extraction. The implementation therefore uses a clearly labeled reference estimate table rather than claiming invoice accuracy: `mj-fast-imagine` $0.056/task, `mj-fast-upscale-subtle` $0.056/task, and Turbo reference operations $0.168/task. The UI explicitly states that account pricing and discounts may differ, and unknown models show no invented total.

Sources:
- https://apidoc.cometapi.com/pricing/about-pricing
- https://www.cometapi.com/models/midjourney/mj-fast-imagine/
- https://www.cometapi.com/models/midjourney/mj-fast-upscale-subtle/
- https://www.cometapi.com/midjourney-api/
