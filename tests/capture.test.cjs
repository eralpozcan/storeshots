const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

async function check(format) {
  const calls = []
  let attached = 0
  const element = () => ({ style: {}, setAttribute() {}, appendChild() {}, offsetHeight: 1 })
  const mod = { exports: {} }
  const source = fs.readFileSync('app/utils/capture.ts', 'utf8')
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports: mod.exports,
    require: () => ({
      getFontEmbedCSS: async () => '',
      toPng: async (_, options) => { calls.push({ format: 'png', ...options }); return 'data:image/png;base64,test' },
      toJpeg: async (_, options) => { calls.push({ format: 'jpeg', ...options }); return 'data:image/jpeg;base64,test' },
    }),
    document: { fonts: { ready: Promise.resolve() }, createElement: element, body: {
      appendChild: () => { attached++ }, removeChild: () => { attached-- },
    } },
    requestAnimationFrame: callback => callback(),
    setTimeout: callback => callback(),
    console,
  })
  const result = await mod.exports.captureElement({ cloneNode: element }, 3840, 1646, format)
  const expected = format || 'png'
  assert.ok(result.startsWith(`data:image/${expected}`))
  assert.equal(calls.length, 2)
  assert.equal(calls[1].format, expected)
  assert.equal(calls[1].pixelRatio, 1)
  assert.equal(calls[1].width, 3840)
  assert.equal(calls[1].height, 1646)
  if (format === 'jpeg') assert.equal(calls[1].backgroundColor, '#ffffff')
  assert.equal(attached, 0, 'capture containers must be removed')
}
Promise.all([check(), check('jpeg')]).then(() => console.log('PNG compatibility, opaque JPEG options and capture cleanup checks passed')).catch(error => {
  console.error(error)
  process.exitCode = 1
})
