const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const test = require('node:test')

function harness() {
  const messages = [], saved = []
  let blob, requestCount = 0
  const context = { Blob, console, $fetch() { requestCount++; throw new Error('Unexpected provider request') }, ref: value => ({ value }), computed: fn => ({ get value() { return fn() } }),
    useToast: () => ({ add: message => messages.push(message) }),
    document: { createElement: () => ({ click() {} }) },
    URL: { createObjectURL: value => { blob = value; return 'blob:test-project' }, revokeObjectURL() {} },
  }
  const modules = new Map()
  function load(file) {
    file = path.resolve(file)
    if (modules.has(file)) return modules.get(file)
    const exports = {}; modules.set(file, exports)
    const source = fs.readFileSync(file, 'utf8').replaceAll('import.meta.server', 'false')
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, {
      ...context, exports, require: name => load(name.startsWith('~/') ? `app/${name.slice(2)}.ts` : path.resolve(path.dirname(file), `${name}.ts`)),
    }, { filename: file })
    return exports
  }
  const { DEFAULT_CONFIG } = load('app/utils/defaults.ts')
  const { useScreenshots } = load('app/composables/useScreenshots.ts')
  return { create: () => useScreenshots({ load: () => JSON.parse(JSON.stringify(DEFAULT_CONFIG)), save: value => saved.push(value) }), messages, saved, requests: () => requestCount, project: async () => JSON.parse(await blob.text()) }
}
const file = payload => ({ size: 100, name: 'transfer.storeshots.json', text: async () => JSON.stringify(payload) })

test('project import preserves the complete active AI connection', async () => {
  const h = harness(), editor = h.create()
  const ai = { provider: 'claude', apiKey: 'test-only-active-key', claudeModel: 'active-model', openrouterModel: 'active-router-model' }
  editor.updateConfig({ ai })
  await editor.importProject(file({ __storeshots: 1, config: { appName: 'Imported project', ai: { provider: 'openrouter', apiKey: 'untrusted-file-key', openrouterModel: 'file-model' } } }))
  assert.equal(editor.config.value.appName, 'Imported project')
  assert.deepEqual(JSON.parse(JSON.stringify(editor.config.value.ai)), ai)
})

test('project export and import retain both editors data without credentials', async () => {
  const h = harness(), v1 = h.create(), v2 = h.create()
  v1.updateConfig({ appName: 'Roundtrip', ai: { ...v1.config.value.ai, apiKey: 'test-only-key' },
    selectedLocales: ['en', 'tr'], copyByLocale: { tr: v1.config.value.copy.map(s => ({ ...s, headline: 'Türkçe' })) },
    images: { ...v1.config.value.images, iphone: ['first', 'second', ...Array(8).fill(null)], appleHeader: ['header'] },
    appleArtwork: { appleHeader: { fit: 'cover', x: 20, y: 30, background: '#123456' } },
    v2Workflow: { outputs: ['iphone'], prepared: true, includeClosing: false, exportSizes: { iphone: ['1320x2868'] }, sourceKey: 'iphone', linkedSlots: { androidPhone: [0] } },
  })
  v1.exportProject()
  const first = await h.project()
  assert.equal(first.config.ai.apiKey, '')
  assert.ok(!JSON.stringify(first).includes('test-only-key'))
  assert.equal(await v2.importProject(file(first)), true)
  v2.updateConfig({ appName: 'Edited in V2' })
  v2.exportProject()
  const second = await h.project()
  assert.equal(await v1.importProject(file(second)), true)
  assert.equal(v1.config.value.appName, 'Edited in V2')
  assert.equal(v1.config.value.ai.apiKey, 'test-only-key')
  for (const field of ['images', 'copy', 'copyByLocale', 'appleArtwork', 'selectedLocales', 'v2Workflow']) {
    assert.equal(JSON.stringify(v1.config.value[field]), JSON.stringify(first.config[field]), field)
  }
})

test('invalid import reports failure and leaves the active draft untouched', async () => {
  const h = harness(), editor = h.create()
  editor.updateConfig({ appName: 'Keep this draft' })
  const before = JSON.stringify(editor.config.value), writes = h.saved.length
  assert.equal(await editor.importProject(file({ invalid: true })), false)
  assert.equal(JSON.stringify(editor.config.value), before)
  assert.equal(h.saved.length, writes)
})

test('missing AI credentials never start a provider request or change the project', async () => {
  const h = harness(), editor = h.create()
  const before = JSON.stringify(editor.config.value)
  await editor.generateCopy()
  assert.equal(await editor.generateFullDesign(), false)
  await editor.generateLocales()
  assert.equal(h.requests(), 0)
  assert.equal(JSON.stringify(editor.config.value), before)
  assert.equal(h.messages.filter(message => message.title === 'API key missing').length, 3)
})
