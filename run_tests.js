// Minimal shims for testing
global.localStorage = {
  data: {},
  getItem(key) { return this.data[key] || null; },
  setItem(key, val) { this.data[key] = val; },
  removeItem(key) { delete this.data[key]; }
};
global.location = { href: 'http://localhost?test=1' };
global.URL = URL;
global.document = {
  getElementById() { return { innerHTML: '', textContent: '', classList: { add() {}, remove() {} }, querySelector() { return null; }, querySelectorAll() { return []; }, appendChild() {}, addEventListener() {} }; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  addEventListener() {},
  createElement() { return { className: '', dataset: {}, textContent: '', appendChild() {}, classList: { add() {}, remove() {}, contains() { return false; } } }; },
  body: { addEventListener() {} }
};

// Extract the script content
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (!match) { console.log('Failed to extract script'); process.exit(1); }

// Eval the script
eval(match[1]);

// Run tests
runSelfTests();
