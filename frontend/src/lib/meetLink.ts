const ADJECTIVES = [
  'swift', 'bold', 'calm', 'clear', 'bright', 'smart', 'sharp', 'quick',
  'prime', 'solid', 'agile', 'eager', 'fresh', 'keen', 'lean', 'vast',
];

const NOUNS = [
  'falcon', 'horizon', 'summit', 'orbit', 'pulse', 'signal', 'vertex',
  'nexus', 'bridge', 'canvas', 'forge', 'spark', 'vector', 'anchor',
];

export function generateMeetLink(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `https://meet.jit.si/VidPort-${adj}-${noun}-${num}`;
}
