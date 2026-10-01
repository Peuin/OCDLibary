import fs from 'fs';
import { parse } from '@formatjs/icu-messageformat-parser';

const vi = JSON.parse(fs.readFileSync('./client/src/locales/vi.json', 'utf-8'));

function validateNode(node, path) {
  if (typeof node === 'string') {
    try {
      parse(node);
    } catch (err) {
      console.error(`ICU Error in path: ${path} - ${err.message}`);
      process.exit(1);
    }
  } else if (typeof node === 'object' && node !== null) {
    for (const key in node) {
      validateNode(node[key], path ? `${path}.${key}` : key);
    }
  }
}

validateNode(vi, '');
console.log('All valid!');
