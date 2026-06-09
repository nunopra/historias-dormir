module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { personagem, animal, cenario, nome } = req.body || {};

  if (!personagem || !animal || !cenario) {
    return res.status(400).json({ error: 'Por favor escolhe personagem, animal e cenário.' });
  }

  const nomeFrase = nome ? `, chamada ${nome},` : '';

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: 'És um contador de histórias especializado em histórias para dormir para crianças portuguesas de 4 a 6 anos. Escreves sempre em português europeu — nunca brasileiro. A tua linguagem é simples, suave, poética e calmante. As tuas histórias têm sempre um ritmo lento e tranquilo, imagens delicadas e um final onde os personagens adormecem felizes e em paz.',
        messages: [
          {
            role: 'user',
            content: `Cria uma história para dormir em português europeu para uma criança de 4 a 6 anos. A história deve ter entre 420 e 520 palavras.

Personagem principal: ${personagem}${nomeFrase}
Animal amigo: ${animal}
Cenário: ${cenario}

Regras:
- Começa sempre com "Era uma vez..."
- Usa linguagem simples, suave, com imagens poéticas e delicadas
- Ritmo lento e sonolento — como se a própria história estivesse a adormecer
- Sem conflitos violentos, sustos ou situações assustadoras
- Final tranquilo em que o personagem e o animal amigo adormecem juntos, felizes
- Escreve apenas a história — sem título separado, sem introdução, sem comentários`
          }
        ]
      })
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      console.error('Anthropic error:', JSON.stringify(data));
      throw new Error(data.error?.message || 'Erro na API Anthropic');
    }

    const story = data.content?.[0]?.text;
    if (!story) throw new Error('Resposta vazia da API');

    return res.status(200).json({ story });

  } catch (err) {
    console.error('Erro ao gerar história:', err.message);
    return res.status(500).json({
      error: 'Não foi possível gerar a história. Aguarda uns segundos e tenta novamente.'
    });
  }
};
