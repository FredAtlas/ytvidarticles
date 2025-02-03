
import htmlToRtf from 'html-to-rtf';

export function convertToRtf(content: string): string {
  try {
    return htmlToRtf.convertHtmlToRtf(`<div>${content}</div>`);
  } catch (error) {
    console.error('RTF conversion error:', error);
    return '';
  }
}
