export interface AiTool {
  name: string
  url: string
}

export const AI_TOOLS: AiTool[] = [
  { name: 'ChatGPT', url: 'https://chatgpt.com' },
  { name: 'Gemini', url: 'https://gemini.google.com' },
  { name: 'Claude', url: 'https://claude.ai' },
  { name: 'Copilot', url: 'https://copilot.microsoft.com' },
  { name: 'Perplexity', url: 'https://www.perplexity.ai' },
  { name: 'Firefly', url: 'https://firefly.adobe.com' },
]
