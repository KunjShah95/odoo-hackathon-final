// Utility to call HuggingFace Inference API for creative suggestions
// Docs: https://huggingface.co/docs/api-inference/index

const HF_API_URL = 'https://api-inference.huggingface.co/models/gpt2';
const HF_API_TOKEN = '';

export async function generateCreativeSuggestion(prompt: string) {
  const res = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(HF_API_TOKEN ? { Authorization: `Bearer ${HF_API_TOKEN}` } : {})
    },
    body: JSON.stringify({ inputs: prompt })
  });
  if (!res.ok) throw new Error('Failed to generate suggestion');
  const data = await res.json();
  // HuggingFace returns an array of generated texts
  return data[0]?.generated_text || '';
}
