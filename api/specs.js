export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { model } = await req.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || process.env.anthropic_api_key,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'tools-2024-04-04',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `Eres un experto en instalación de electrodomésticos para cocinas premium en México. Responde ÚNICAMENTE con JSON válido sin backticks:\n{"modelo":"","tipo":"","marca":"","dimensiones_instalacion":"","espacios_libres":"","tipo_conexion":"","voltaje":"","apertura_puerta":"","restricciones_especiales":"","notas_fabricacion":"","fuente":"","confianza":"alta/media/baja"}`,
        messages: [{ role: 'user', content: `Especificaciones técnicas de instalación para: ${model}` }],
      }),
    });

    const data = await response.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    let specs = null;
    try {
      const match = text.replace(/```json|```/g, '').trim().match(/\{[\s\S]*\}/);
      if (match) specs = JSON.parse(match[0]);
    } catch {}

    return new Response(JSON.stringify({ specs }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
