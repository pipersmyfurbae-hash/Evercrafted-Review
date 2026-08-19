const response = await fetch("https://api.cometapi.com/v1/models", {
  headers: { Authorization: `Bearer ${process.env.COMETAPI_API_KEY}` },
});
if (!response.ok) throw new Error(`CometAPI models request failed: ${response.status}`);
const payload = await response.json();
const models = Array.isArray(payload?.data) ? payload.data : [];
for (const model of models) {
  const id = String(model?.id ?? "");
  const owner = String(model?.owned_by ?? "");
  if (/claude|sonnet|anthropic/i.test(`${id} ${owner}`)) {
    console.log(JSON.stringify({ id, owner, endpoints: model?.supported_endpoint_types ?? [] }));
  }
}
