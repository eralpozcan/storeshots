const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const moduleExports = {}
const source = fs.existsSync('app/utils/ai-preferences.ts') ? fs.readFileSync('app/utils/ai-preferences.ts', 'utf8') : ''
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: moduleExports })
assert.equal(typeof moduleExports.saveAiPreferences, 'function', 'AI preferences need storage separate from projects')
const { loadAiPreferences, saveAiPreferences } = moduleExports
let stored
const storage = { getItem: () => stored ?? null, setItem: (_, value) => { stored = value } }
assert.equal(loadAiPreferences(storage), undefined)
saveAiPreferences({ provider: 'openrouter', openrouterModel: 'vendor/model', claudeModel: 'existing-model', apiKey: 'test-only-secret' }, storage)
assert.ok(!stored.includes('apiKey') && !stored.includes('test-only-secret'), 'persistent preferences must never contain credentials')
assert.deepEqual(JSON.parse(JSON.stringify(loadAiPreferences(storage))), { provider: 'openrouter', openrouterModel: 'vendor/model', claudeModel: 'existing-model' })
stored = JSON.stringify({ provider: 'claude', openrouterModel: 'other/model', claudeModel: 'model-id', apiKey: 'ignore-this' })
assert.equal(loadAiPreferences(storage).apiKey, undefined)
stored = '{invalid'
assert.equal(loadAiPreferences(storage), undefined)
stored = JSON.stringify({ provider: 'unknown', openrouterModel: 123, claudeModel: null })
assert.equal(loadAiPreferences(storage), undefined)
assert.equal(loadAiPreferences({ getItem() { throw new Error('unavailable') } }), undefined)
assert.throws(() => saveAiPreferences({ provider: 'claude', openrouterModel: '', claudeModel: '' }, { setItem() { throw new Error('quota') } }), /quota/)
console.log('AI preferences survive project changes without persisting credentials')
