
import { FleschKincaid, ColemanLiau, AutomatedReadability } from 'readability-metrics';

export function analyzeReadability(text: string) {
  const fk = new FleschKincaid(text);
  const cl = new ColemanLiau(text);
  const ar = new AutomatedReadability(text);

  return {
    fleschKincaid: fk.score(),
    colemanLiau: cl.score(),
    automatedReadability: ar.score(),
    averageGradeLevel: (fk.score() + cl.score() + ar.score()) / 3,
    suggestions: getReadabilitySuggestions(text)
  };
}

function getReadabilitySuggestions(text: string) {
  const suggestions = [];
  const sentences = text.split(/[.!?]+/);
  
  if (sentences.some(s => s.split(' ').length > 25)) {
    suggestions.push('Consider breaking down long sentences');
  }
  
  if (text.match(/\b\w{13,}\b/g)) {
    suggestions.push('Consider using simpler words');
  }

  return suggestions;
}
