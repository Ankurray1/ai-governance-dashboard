// Official logo for each AI tool (site icons, in src/assets/logos). Looked up by tool name.
const files = import.meta.glob('../assets/logos/*.png', { eager: true, import: 'default' }) as Record<string, string>;
const byFile = (f: string) => files[`../assets/logos/${f}.png`];

const LOGOS: Record<string, string> = {
  'ChatGPT Enterprise': byFile('chatgpt'),
  'Microsoft 365 Copilot': byFile('copilot'),
  'Claude Enterprise': byFile('claude'),
  'Claude Pro (personal plan)': byFile('claude'),
  Synthesia: byFile('synthesia'),
  Runway: byFile('runway'),
  ElevenLabs: byFile('elevenlabs'),
  'Otter.ai': byFile('otter'),
  Midjourney: byFile('midjourney'),
  'Adobe Firefly': byFile('firefly'),
  Perplexity: byFile('perplexity'),
  'Fireflies.ai': byFile('fireflies'),
  'Leonardo.ai': byFile('leonardo'),
  DeepSeek: byFile('deepseek'),
  HeyGen: byFile('heygen'),
  Suno: byFile('suno'),
};

export default function ToolLogo({ name, size = 28 }: { name: string; size?: number }) {
  const src = LOGOS[name];
  if (!src) return null;
  return <img className="tool-logo" src={src} alt="" width={size} height={size} loading="lazy" />;
}
