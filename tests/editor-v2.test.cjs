const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

const source = fs.existsSync('app/utils/editor-v2.ts') ? fs.readFileSync('app/utils/editor-v2.ts', 'utf8') : ''
const exportsObject = {}
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exportsObject })
assert.equal(typeof exportsObject.placeUploads, 'function', 'V2 needs safe upload placement')
const { placeUploads, exportableSlides, applyLayoutTemplate } = exportsObject
const original = ['existing', null, 'keep', null]
assert.deepEqual(Array.from(placeUploads(original, ['a', 'b'])), ['existing', 'a', 'keep', 'b'])
assert.deepEqual(original, ['existing', null, 'keep', null])
assert.throws(() => placeUploads(original, ['a', 'b', 'c']), /2 empty slots/)
assert.deepEqual(Array.from(exportableSlides([null, 'image', null], [1, 2, 10])), [1, 2])
assert.deepEqual(Array.from(exportableSlides([null, null], [1, 2])), [])
const copy = [{ label: 'One', headline: 'First', position: { dx: 4, dy: 8 } }, { label: 'Two', headline: 'Second' }]
const laidOut = applyLayoutTemplate(copy, [3, 1], { 1: [{ id: 'phone', type: 'device', imageIdx: 0 }], 3: [{ id: 'phone', type: 'device', imageIdx: 0 }] })
assert.deepEqual(JSON.parse(JSON.stringify(laidOut)), [
  { label: 'One', headline: 'First', variant: 3, elements: [{ id: 'phone', type: 'device', imageIdx: 0 }] },
  { label: 'Two', headline: 'Second', variant: 1, elements: [{ id: 'phone', type: 'device', imageIdx: 1 }] },
])
console.log('V2 upload, layout template and export checks passed')

function loadTs(file) {
  const mod = { exports: {} }
  const path = require('node:path')
  // Nuxt replaces this build-time flag before serving modules.
  const source = fs.readFileSync(file, 'utf8').replaceAll('import.meta.server', 'false')
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports: mod.exports,
    require: name => name.startsWith('.') ? loadTs(path.resolve(path.dirname(file), `${name}.ts`)) : require(name),
  }, { filename: file })
  return mod.exports
}
const apple = loadTs('app/utils/apple-assets.ts')
assert.deepEqual(JSON.parse(JSON.stringify(apple.appleAssetSpec('iphone-duo-outer', 'portrait'))), {
  label: 'iPhone Duo · Outer display', w: 1398, h: 2034, imageKey: 'duoOuter', kind: 'duo',
})
assert.equal(apple.appleAssetSpec('iphone-duo-outer', 'landscape').w, 2034)
assert.equal(apple.appleAssetSpec('iphone-duo-inner', 'portrait').h, 2853)
assert.equal(apple.appleAssetSpec('iphone-duo-inner', 'landscape').h, 2007)
assert.equal(apple.appleAssetSpec('apple-header', 'portrait').w, 3840)
assert.equal(apple.appleAssetSpec('apple-header', 'landscape').h, 1646)
assert.equal(apple.appleAssetSpec('apple-search', 'portrait').w, 1920)
assert.equal(apple.appleAssetSpec('iphone', 'portrait'), undefined)
assert.equal(apple.appleAssetSpec('iphone-duo-inner', 'landscape').imageKey, 'duoInnerLandscape')

const { restoreConfig, DEFAULT_CONFIG } = loadTs('app/utils/defaults.ts')
const legacy = { appName: 'Keep my work', images: { iphone: ['existing'] }, ai: { apiKey: 'do not restore' } }
const restored = restoreConfig(legacy, 'tab-key')
assert.equal(restored.appName, 'Keep my work')
assert.equal(restored.images.iphone[0], 'existing')
assert.equal(restored.images.duoInner.length, 10)
assert.equal(restored.images.appleHeader.length, 1)
assert.equal(restored.ai.apiKey, 'tab-key')
restored.images.duoInner[0] = 'new'
assert.equal(DEFAULT_CONFIG.images.duoInner[0], null, 'restoring must not mutate shared defaults')
assert.equal(restoreConfig({ images: { duoInner: null }, selectedLocales: [] }).images.duoInner.length, 10)
assert.equal(restoreConfig({ images: { iphone: ['a', 123] } }).images.iphone[1], null)
assert.equal(restoreConfig(null).copy.length, 10)
assert.equal(restoreConfig({ locale: 'tr' }).selectedLocales[0], 'tr')
const malformed = restoreConfig({ appName: null, ai: { provider: 'unknown', claudeModel: 12, openrouterModel: null } })
assert.equal(malformed.appName, DEFAULT_CONFIG.appName, 'invalid project names must not break export')
assert.equal(malformed.ai.provider, DEFAULT_CONFIG.ai.provider)
assert.equal(malformed.ai.claudeModel, DEFAULT_CONFIG.ai.claudeModel, 'invalid model IDs must not crash AI readiness')
assert.equal(malformed.ai.openrouterModel, DEFAULT_CONFIG.ai.openrouterModel)
console.log('Apple asset dimensions, image isolation and legacy restore checks passed')

assert.equal(typeof apple.artworkStyle, 'function', 'Apple artwork needs shared preview/export placement')
assert.deepEqual(JSON.parse(JSON.stringify(apple.artworkStyle())), { objectFit: 'contain', objectPosition: '50% 50%' })
assert.deepEqual(JSON.parse(JSON.stringify(apple.artworkStyle({ fit: 'cover', x: 20, y: 80, background: '#abcdef' }))), {
  objectFit: 'cover', objectPosition: '20% 80%',
})
const artworkConfig = restoreConfig({ appleArtwork: {
  appleHeader: { fit: 'cover', x: -10, y: 150, background: '#123456' },
  appleSearch: { fit: 'invalid', x: '10', y: null, background: 'not-a-color' },
} })
assert.deepEqual(JSON.parse(JSON.stringify(artworkConfig.appleArtwork.appleHeader)), { fit: 'cover', x: 0, y: 100, background: '#123456' })
assert.deepEqual(JSON.parse(JSON.stringify(artworkConfig.appleArtwork.appleSearch)), { fit: 'contain', x: 50, y: 50, background: DEFAULT_CONFIG.colors.bgFrom })
assert.equal(artworkConfig.appleArtwork.duoInner, undefined, 'one placement must not change other targets')
assert.deepEqual(JSON.parse(JSON.stringify(restoreConfig({}).appleArtwork)), {}, 'legacy projects keep the existing fit behavior')
console.log('Artwork fit, focal point and target isolation checks passed')
