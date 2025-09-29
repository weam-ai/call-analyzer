/**
 * Utility functions for formatting text content
 */

/**
 * Converts markdown-like text to properly formatted HTML
 * Handles basic markdown formatting like bold, italic, lists, etc.
 */
export function formatText(text: string): string {
  if (!text) return '';

  // Convert markdown bold (**text** or __text__) to HTML bold
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Convert markdown italic (*text* or _text_) to HTML italic
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');

  // Convert markdown headers to HTML headers
  formatted = formatted.replace(/^#### (.*$)/gim, '<h4 class="text-base font-semibold text-slate-900 mt-3 mb-2">$1</h4>');
  formatted = formatted.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-slate-900 mt-4 mb-2">$1</h3>');
  formatted = formatted.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-slate-900 mt-4 mb-2">$1</h2>');
  formatted = formatted.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-slate-900 mt-4 mb-2">$1</h1>');

  // Convert markdown numbered lists (1. item, 2. item, etc.) to HTML ordered lists
  formatted = formatted.replace(/^[\s]*\d+\.\s+(.*$)/gim, '<li class="ml-4">$1</li>');
  
  // Convert markdown bullet lists (- item or * item) to HTML unordered lists
  formatted = formatted.replace(/^[\s]*[-*]\s+(.*$)/gim, '<li class="ml-4">$1</li>');
  
  // Wrap consecutive list items in appropriate list tags
  formatted = formatted.replace(/(<li class="ml-4">.*<\/li>)/gs, (match) => {
    // Check if it's a numbered list by looking for numbers
    if (match.match(/\d+\./)) {
      return `<ol class="list-decimal list-inside space-y-1 my-2">${match}</ol>`;
    } else {
      return `<ul class="list-disc list-inside space-y-1 my-2">${match}</ul>`;
    }
  });

  // Convert line breaks to HTML breaks, but preserve headers and lists
  formatted = formatted.replace(/\n(?![<])/g, '<br>');

  // Convert multiple line breaks to paragraph breaks
  formatted = formatted.replace(/(<br>){2,}/g, '</p><p class="mb-2">');
  
  // Wrap the entire content in paragraphs if not already wrapped
  if (!formatted.startsWith('<h') && !formatted.startsWith('<ul') && !formatted.startsWith('<ol')) {
    formatted = '<p class="mb-2">' + formatted + '</p>';
  }

  // Clean up empty paragraphs and unnecessary breaks
  formatted = formatted.replace(/<p class="mb-2"><\/p>/g, '');
  formatted = formatted.replace(/<p class="mb-2"><br><\/p>/g, '');
  formatted = formatted.replace(/(<br>\s*){3,}/g, '<br><br>');

  return formatted;
}

/**
 * Converts text to plain text by removing markdown formatting
 */
export function toPlainText(text: string): string {
  if (!text) return '';

  // Remove markdown bold
  let plain = text.replace(/\*\*(.*?)\*\*/g, '$1');
  plain = plain.replace(/__(.*?)__/g, '$1');

  // Remove markdown italic
  plain = plain.replace(/\*(.*?)\*/g, '$1');
  plain = plain.replace(/_(.*?)_/g, '$1');

  // Remove markdown headers (all levels)
  plain = plain.replace(/^#{1,6}\s+/gm, '');

  // Remove markdown list markers
  plain = plain.replace(/^[\s]*[-*]\s+/gm, '• ');

  // Clean up extra whitespace
  plain = plain.replace(/\n\s*\n/g, '\n\n');
  plain = plain.trim();

  return plain;
}

/**
 * Truncates text to a specified length and adds ellipsis
 */
export function truncateText(text: string, maxLength: number = 200): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}
