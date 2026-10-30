// Runtime contract of the published bundle (dist/index.js): what it exports,
// the version it reports, and that every abstract member refuses to run.
// Run with `npm test` (builds first).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The bundle defines `class WamNode extends AudioWorkletNode` at module load,
// so it cannot be imported where Web Audio is missing (Node, SSR, build
// tools) without these globals. Install inert stand-ins before importing.
globalThis.AudioWorkletNode ??= class AudioWorkletNode {};
globalThis.AudioWorkletProcessor ??= class AudioWorkletProcessor {};

const api = await import('../dist/index.js');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('exports exactly the documented names', () => {
	assert.deepEqual(Object.keys(api).sort(), [
		'AbstractWamNode',
		'AbstractWamParameter',
		'AbstractWamParameterInfo',
		'AbstractWebAudioModule',
		'VERSION',
		'getAbstractWamEnv',
		'getAbstractWamGroup',
		'getAbstractWamProcessor',
	]);
});

test('VERSION matches package.json', () => {
	assert.equal(api.VERSION, pkg.version);
});

/**
 * Calls every own getter, setter and method of `target` and returns the
 * names that did not throw (or reject) with "Not Implemented.".
 */
async function membersThatRun(target) {
	const running = [];
	for (const name of Object.getOwnPropertyNames(target)) {
		if (['constructor', 'prototype', 'length', 'name'].includes(name)) continue;
		const { get, set, value } = Object.getOwnPropertyDescriptor(target, name);
		for (const [kind, fn] of [['get', get], ['set', set], ['call', typeof value === 'function' ? value : undefined]]) {
			if (!fn) continue;
			try {
				const result = fn.call(Object.create(target), undefined);
				if (result instanceof Promise) await result;
				running.push(`${kind} ${name}`);
			} catch (error) {
				if (!/Not Implemented/.test(error.message)) running.push(`${kind} ${name} threw: ${error.message}`);
			}
		}
	}
	return running;
}

const abstractClasses = {
	AbstractWebAudioModule: api.AbstractWebAudioModule,
	AbstractWamNode: api.AbstractWamNode,
	AbstractWamParameter: api.AbstractWamParameter,
	AbstractWamParameterInfo: api.AbstractWamParameterInfo,
	'getAbstractWamEnv()': api.getAbstractWamEnv('2.0.0'),
	'getAbstractWamGroup()': api.getAbstractWamGroup('group', 'key'),
	'getAbstractWamProcessor()': api.getAbstractWamProcessor('module'),
};

for (const [name, AbstractClass] of Object.entries(abstractClasses)) {
	test(`${name}: every member throws "Not Implemented."`, async () => {
		assert.equal(typeof AbstractClass, 'function', `${name} is not a class`);
		const members = Object.getOwnPropertyNames(AbstractClass.prototype).filter((m) => m !== 'constructor');
		assert.ok(members.length > 0, `${name} has no members to check`);
		assert.deepEqual(await membersThatRun(AbstractClass.prototype), [], 'instance members that did not throw');
		assert.deepEqual(await membersThatRun(AbstractClass), [], 'static members that did not throw');
	});
}
