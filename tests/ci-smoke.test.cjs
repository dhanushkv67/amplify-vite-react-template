const test = require('node:test');
const assert = require('node:assert/strict');

test('test_ac1_trims_edges_preserving_internal_whitespace', () => {
 const { normalizeTodo } = require('../src/ci-smoke.cjs');
 assert.equal(normalizeTodo(' buy milk\t tomorrow '), 'buy milk\t tomorrow');
 assert.equal(normalizeTodo('\n first\n second \t'), 'first\n second');
});

test('test_ac2_empty_and_whitespace_only_return_null', () => {
 const { normalizeTodo } = require('../src/ci-smoke.cjs');
 for (const input of ['', ' ', '\t', '\n \t ']) {
 assert.equal(normalizeTodo(input), null, `input: ${JSON.stringify(input)}`);
 }
});

test('test_ac3_every_non_string_input_throws_type_error', () => {
 const { normalizeTodo } = require('../src/ci-smoke.cjs');
 const nonStrings = [
 undefined, null, 0, 1, NaN, Infinity, 1n, true, false,
 {}, [], new String('todo'), Symbol('todo'), () => 'todo',
 ];
 for (const input of nonStrings) {
 assert.throws(() => normalizeTodo(input), TypeError);
 }
});
