/**
 * EF Skin Science — Cloudflare Worker backend.
 * Set OPENAI_API_KEY with Wrangler secret; never store keys in GitHub.
 * Configure ALLOWED_ORIGIN for the production Enfederma site.
 */
const ALLOWED_ORIGIN = "https://infoporlibre-sudo.github.io";
const INSTRUCTIONS = `Eres EF Skin Science, un asistente de IA de educación dermoestética de Enfederma.
No eres una enfermera humana, no emites diagnósticos ni prescribes tratamientos.
Ayuda a entender ingredientes cosméticos y cuidado cutáneo con lenguaje claro y prudente.
Consulta bibliografía médica actualizada para cada pregunta dermatológica mediante búsqueda web,
prioriza PubMed, Cochrane, guías profesionales y artículos revisados por pares.
Distingue evidencia sólida, limitada y experimental. Incluye enlaces verificables y no inventes citas.
Nunca tomes opiniones de foros como prueba clínica; úsalos solo como temas a investigar.
No solicites ni retengas datos identificativos ni historiales médicos. No respondas a peticiones sobre
medicación personalizada, dosis o diagnóstico; orienta a consultar un profesional adecuado.
Ante signos preocupantes, recomienda valoración médica. Aclara incertidumbres.
No promuevas inseguridades corporales ni prácticas de alimentación o ejercicio dañinas.
Responde en español salvo que la consulta esté en otro idioma.`;
const systemHeaders = (origin) => ({
  "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : "null",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin",
  "Cache-Control": "no-store",
});
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = systemHeaders(origin);
    if (origin !== ALLOWED_ORIGIN) return new Response("Origen no autorizado", { status: 403, headers });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return new Response("Método no permitido", { status: 405, headers });
    if (!env.OPENAI_API_KEY) return Response.json({ error:"Servicio no configurado" }, { status: 503, headers });
    let body;
    try { body = await request.json(); } catch { return Response.json({error:"JSON inválido"}, {status:400,headers}); }
    const question = typeof body?.question === "string" ? body.question.trim() : "";
    if (!question || question.length > 1500) return Response.json({error:"Pregunta inválida"}, {status:400,headers});
    // This is a prototype: add user authentication, abuse protection, spending limits,
    // privacy review, and subscription checks before enabling production/premium access.
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type":"application/json" },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-5-mini",
          store: false,
          tools: [{ type:"web_search", filters: { allowed_domains: ["pubmed.ncbi.nlm.nih.gov","pmc.ncbi.nlm.nih.gov","cochranelibrary.com","aad.org","europepmc.org"] } }],
          instructions: INSTRUCTIONS,
          input: question,
          max_output_tokens: 1000,
        })
      });
      const data = await response.json();
      if (!response.ok) return Response.json({ error:"No se pudo completar la consulta" }, {status:502,headers});
      const answer = (data.output || []).flatMap(x => x.content || []).filter(x=>x.type==="output_text").map(x=>x.text).join("\n").trim();
      const citations = (data.output || []).flatMap(x=>x.content||[]).flatMap(x=>x.annotations||[]).filter(x=>x.type==="url_citation" && /^https:\/\//.test(x.url)).map(x=>({url:x.url,title:x.title||"Fuente"}));
      return Response.json({answer:answer||"No he podido generar una respuesta fiable.",citations:[...new Map(citations.map(x=>[x.url,x])).values()]}, {headers});
    } catch {
      return Response.json({error:"Error temporal del servicio"}, {status:502,headers});
    }
  }
};
