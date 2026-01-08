// src/utils/slugify.ts
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // split an accented letter into the base letter and the accent
    .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}
