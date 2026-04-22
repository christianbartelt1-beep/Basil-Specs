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
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'tools-2024-04-04',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `Eres un experto en instalación de electrodomésticos para cocinas y espacios residenciales premium en México.
Tu tarea es buscar las especificaciones técnicas de instalación de electrodomésticos para que un carpintero pueda fabricar el mueble que lo recibirá correctamente.

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin backticks, sin markdown. El JSON debe tener exactamente esta estructura:
{
  "modelo": "nombre completo del modelo",
  "tipo": "tipo de electrodoméstico (horno, refrigerador, campana, parrilla, lavavajillas, etc.)",
  "marca": "marca",
  "dimensiones_instalacion": "ancho x alto x profundidad del hueco requerido en mm",
  "espacios_libres": "espacios mínimos requeridos alrededor del equipo en mm",
  "tipo_conexion": "eléctrica 220V/127V/gas LP/natural, amperaje, etc.",
  "voltaje": "voltaje y potencia en watts",
  "apertura_puerta": "de qué lado abre, ángulo, espacio requerido",
  "restricciones_especiales": "ventilación, temperatura máxima entorno, protecciones requeridas, etc.",
  "notas_fabricacion": "recomendaciones específicas para el carpintero al fabricar el mueble receptor",
  "fuente": "URL o nombre de la fuente consultada",
  "confianza": "alta/media/baja según qué tan específicos fueron los datos encontrados"
}

Si no encuentras información específica para un campo, indica 'No especificado'. Prioriza siempre la ficha técnica oficial del fabricante.`,
        messages: [
          {
            role: 'user',
            content: `Busca las especificaciones técnicas de instalación para el electrodoméstico: ${model}

Necesito específicamente los datos de dimensiones de hueco de instalación, espacios libres requeridos, tipo de conexión, y cualquier restricción especial para que el carpintero pueda fabricar el mueble receptor correctamente.`,
          },
        ],
      }),
    });

    const data = await response.json();
    const textBlocks = (data.content || []).filter((b) => b.type === 'text');
    const rawText = textBlocks.map((b) => b.text).join('');

    let specs = null;
    try {
      const clean = rawText.replace(/```json|```/g, '').trim();
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) specs = JSON.parse(jsonMatch[0]);
    } catch {
      specs = null;
    }

    return new Response(JSON.stringify({ specs, raw: specs ? null : rawText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
export const config = { runtime: 'edge' };
