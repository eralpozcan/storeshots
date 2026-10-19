const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
function load(file) {
  const exports = {}
  vm.runInNewContext(ts.transpileModule(fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replaceAll('import.meta.server', 'false') : '', { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports, require: name => load(path.resolve(path.dirname(file), `${name}.ts`)),
  })
  return exports
}
const workflow = load('app/utils/v2-workflow.ts')
const { copyForScreenshots } = load('app/utils/editor-v2.ts')
assert.equal(typeof workflow.prepareSet, 'function', 'wizard must create the full selected set')
const { DEFAULT_CONFIG } = load('app/utils/defaults.ts')
const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG))
config.appName = 'Focus App'
config.appDescription = 'Plan your day. Track your progress.'
config.images.iphone[0] = 'screen-a'
config.images.iphone[1] = 'screen-b'
config.images.androidPhone[0] = 'android-specific'
const prepared = workflow.prepareSet(config, ['iphone', 'android'], 'iphone')
assert.equal(prepared.images.androidPhone[0], 'android-specific', 'never overwrite device-specific uploads')
assert.equal(prepared.images.androidPhone[1], 'screen-b')
assert.equal(config.images.androidPhone[1], null, 'preparation must not mutate the original')
assert.equal(prepared.copy[0].headline, 'Plan your day')
assert.notEqual(prepared.copy[0].variant, prepared.copy[1].variant)
assert.equal(prepared.copy[9].variant, 10)
const jobs = workflow.bundleJobs(prepared, ['iphone', 'android'])
assert.equal(jobs.length, 15, '3 slides times 4 iPhone sizes plus Android')
assert.equal(new Set(jobs.map(job => job.path)).size, jobs.length)
assert.ok(jobs.every(job => job.format === 'png'))
assert.ok(jobs.some(job => job.path.includes('1320x2868')))
assert.ok(jobs.some(job => job.path.includes('1080x1920')))
for (let i = 0; i < 10; i++) config.images.iphone[i] = `screen-${i}`
const ten = workflow.prepareSet(config, ['iphone'], 'iphone')
assert.notEqual(ten.copy[9].variant, 10, 'a closing card must never hide the tenth upload')
assert.equal(workflow.bundleJobs(ten, ['iphone']).length, 40)
const generated = copyForScreenshots(ten.copy, [
  { imageIndex: 9, label: 'LAST', headline: 'Tenth image' },
  { imageIndex: 0, label: 'FIRST', headline: 'First image' },
  { imageIndex: 0, label: 'DUPLICATE', headline: 'Must not replace first' },
], ten.images.iphone)
assert.equal(generated[0].headline, 'First image')
assert.equal(generated[9].headline, 'Tenth image')
assert.equal(generated[9].variant, ten.copy[9].variant)
assert.deepEqual(generated[9].elements, ten.copy[9].elements)
assert.equal(ten.copy[9].headline, 'Focus App', 'AI must not mutate the prepared layout')
const sparse = copyForScreenshots(ten.copy, [{ imageIndex: 1, label: 'SECOND', headline: 'Second uploaded image' }], ['a', null, 'c'])
assert.equal(sparse[2].headline, 'Second uploaded image')
const localizedClosing = copyForScreenshots(prepared.copy, [{ imageIndex: null, label: 'SON', headline: 'Sizin için' }], prepared.images.iphone)
assert.equal(localizedClosing[9].headline, 'Sizin için')
assert.throws(() => workflow.bundleJobs(prepared, []), /output/i)
assert.throws(() => workflow.bundleJobs(prepared, ['apple-header']), /artwork/i)
prepared.images.appleHeader[0] = 'artwork'
const header = workflow.bundleJobs(prepared, ['apple-header'])
assert.equal(header.length, 1)
assert.equal(header[0].format, 'jpeg')
assert.equal(header[0].size.w, 3840)
prepared.selectedLocales = ['en', 'tr']
assert.throws(() => workflow.bundleJobs(prepared, ['iphone']), /tr/)
prepared.copyByLocale.tr = prepared.copy.map(slide => ({ ...slide, headline: 'Türkçe' }))
assert.equal(workflow.bundleJobs(prepared, ['iphone']).length, 24)
console.log('Complete-set preparation, all-size ZIP planning, image preservation and missing-content checks passed')
// Linked adaptations follow their source; explicit target uploads remain independent.
const linkedBase = JSON.parse(JSON.stringify(DEFAULT_CONFIG))
linkedBase.images.iphone[0] = 'original'
linkedBase.images.androidPhone[1] = 'custom'
let linked = workflow.prepareSet(linkedBase, ['iphone', 'android'], 'iphone')
assert.equal(linked.v2Workflow.sourceKey, 'iphone')
linked = workflow.updateWorkflowImages(linked, 'iphone', ['replacement', ...linked.images.iphone.slice(1)])
assert.equal(linked.images.androidPhone[0], 'replacement')
assert.equal(linked.images.androidPhone[1], 'custom')
linked = workflow.updateWorkflowImages(linked, 'androidPhone', ['override', ...linked.images.androidPhone.slice(1)])
linked = workflow.updateWorkflowImages(linked, 'iphone', ['latest', ...linked.images.iphone.slice(1)])
assert.equal(linked.images.androidPhone[0], 'override')
let removed = workflow.prepareSet(linkedBase, ['iphone', 'android'], 'iphone')
removed = workflow.updateWorkflowImages(removed, 'iphone', Array(10).fill(null))
assert.equal(removed.images.androidPhone[0], null)
const restored = load('app/utils/defaults.ts').restoreConfig(linked)
assert.equal(restored.v2Workflow.sourceKey, 'iphone')
assert.equal(workflow.outputsMatch(['android','iphone'], ['iphone','android']), true)
assert.equal(workflow.outputsMatch(['iphone'], ['iphone','android']), false)
// Reordering keeps every device, locale and per-frame reference attached to its image.
const reorderBase = workflow.prepareSet(linkedBase, ['iphone', 'android'], 'iphone')
reorderBase.images.iphone[1] = 'second'
reorderBase.images.appleHeader[0] = 'header'
reorderBase.copy[0].elements = [{ id: 'front', type: 'device', imageIdx: 1 }]
reorderBase.copyByLocale.tr = reorderBase.copy.map((s, i) => ({ ...s, headline: `tr-${i}` }))
const moved = workflow.reorderSet(reorderBase, 0, 1)
assert.equal(moved.images.iphone[0], 'second')
assert.equal(moved.images.iphone[1], 'original')
assert.equal(moved.images.appleHeader[0], 'header')
assert.equal(moved.copyByLocale.tr[1].headline, 'tr-0')
assert.equal(moved.copy[1].elements[0].imageIdx, 0)
assert.equal(reorderBase.images.iphone[0], 'original')
assert.throws(() => workflow.reorderSet(reorderBase, -1, 1), /slide/i)
const layoutBefore = workflow.captureLayouts(reorderBase.copy)
const layoutChanged = JSON.parse(JSON.stringify(reorderBase.copy))
layoutChanged[0].headline = 'New words after layout change'
layoutChanged[0].elements = []
const undone = workflow.restoreLayouts(layoutChanged, layoutBefore)
assert.equal(undone[0].headline, 'New words after layout change')
assert.equal(undone[0].elements[0].imageIdx, 1)
const legacyOrder = JSON.parse(JSON.stringify(linkedBase))
const legacyMoved = workflow.reorderSet(legacyOrder, 0, 1)
assert.equal(legacyMoved.copy[1].variant, 1)
assert.equal(legacyMoved.copy[1].elements.find(el => el.type === 'device').imageIdx, 1)
const sparseLocale = JSON.parse(JSON.stringify(reorderBase))
sparseLocale.copyByLocale.fr = [{ headline: 'Bonjour', label: 'FR' }]
const sparseMoved = workflow.reorderSet(sparseLocale, 0, 1)
assert.equal(sparseMoved.copyByLocale.fr[1].headline, 'Bonjour')
assert.throws(() => workflow.bundleJobs({ ...sparseMoved, selectedLocales: ['en', 'fr'] }, ['iphone']), /fr/)
const noOverride = workflow.restoreLayouts(layoutChanged, workflow.captureLayouts(legacyOrder.copy))
assert.equal(noOverride[0].elements, undefined)
// Download options affect planning, survive project restore, and never discard images.
const delivery = workflow.prepareSet(linkedBase, ['iphone', 'android'], 'iphone')
delivery.v2Workflow.includeClosing = false
delivery.v2Workflow.exportSizes = { iphone: ['1320x2868'] }
const filteredJobs = workflow.bundleJobs(delivery, ['iphone', 'android'])
assert.equal(filteredJobs.length, 3, 'one iPhone slide plus two Android screenshots; no closing cards')
assert.ok(filteredJobs.filter(job => job.output.id === 'iphone').every(job => job.size.w === 1320))
assert.ok(filteredJobs.every(job => job.variant !== 10))
const deliveryRestored = load('app/utils/defaults.ts').restoreConfig(delivery)
assert.equal(deliveryRestored.v2Workflow.includeClosing, false)
assert.equal(deliveryRestored.v2Workflow.exportSizes.iphone[0], '1320x2868')
const deliveryPrepared = workflow.prepareSet(deliveryRestored, ['iphone', 'android'], 'iphone')
assert.equal(workflow.bundleJobs(deliveryPrepared, ['iphone', 'android']).length, 3)
assert.equal(deliveryPrepared.images.iphone[0], 'original')
const noSizes = JSON.parse(JSON.stringify(delivery))
noSizes.v2Workflow.exportSizes.iphone = []
assert.throws(() => workflow.bundleJobs(noSizes, ['iphone']), /size/i)
const closingWithImage = JSON.parse(JSON.stringify(delivery))
closingWithImage.copy[0].variant = 10
assert.ok(workflow.bundleJobs(closingWithImage, ['iphone']).some(job => job.index === 0), 'closing preference never hides an uploaded screenshot')
const { exportableSlides: visibleSlides } = load('app/utils/editor-v2.ts')
assert.deepEqual(Array.from(visibleSlides(['a', null], [1, 10], false)), [0])
