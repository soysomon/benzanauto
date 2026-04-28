import Groq from 'groq-sdk'

let groq

function getClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY no configurada.')
  }

  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }

  return groq
}

/**
 * Groq uses OpenAI-compatible format.
 */
export async function askGroq({ message, history = [], systemPrompt }) {
  const client = getClient()
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((messageItem) => ({
      role: messageItem.role === 'assistant' ? 'assistant' : 'user',
      content: messageItem.content,
    })),
    { role: 'user', content: message },
  ]

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.65,
    max_tokens: 900,
  })

  return completion.choices[0]?.message?.content ?? ''
}
