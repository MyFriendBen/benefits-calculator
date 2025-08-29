declare module 'text-readability' {
  export function fleschKincaidGrade(text: string): number;
  export function fleschKincaidReadingEase(text: string): number;
  export function daleChallReadabilityScore(text: string): number;
  export function automatedReadabilityIndex(text: string): number;
  export function colemanLiauIndex(text: string): number;
  export function gunningFog(text: string): number;
  export function smogIndex(text: string): number;
  export function getPolysyllabicWords(text: string): string[];
  export function getSentenceCount(text: string): number;
  export function getWordCount(text: string): number;
  export function getLongestSentence(text: string): string;
  export function getPassiveVoice(text: string): string[];
}
