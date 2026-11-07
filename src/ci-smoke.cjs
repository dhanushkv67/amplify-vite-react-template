'use strict';

function normalizeTodo(text) {
if (typeof text !== 'string') {
throw new TypeError('Expected a string');
}

const normalized = text.trim();
return normalized === '' ? null : normalized;
}

module.exports = { normalizeTodo };
