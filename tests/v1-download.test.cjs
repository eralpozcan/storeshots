const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const JSZip = require('jszip')
const test = require('node:test')

test('V1 downloads captured bytes through a revocable Blob URL', async () => {
  const source = fs.readFileSync('app/pages/editor.vue', 'utf8').split('<script setup lang="ts">')[1].split('</script>')[0]
  const ast = ts.createSourceFile('editor.ts', source, ts.ScriptTarget.Latest, true)
  const fn = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'downloadPng')
  assert.ok(fn, 'V1 needs its image download action')
  let blob
  let clicked = false
  let revoked
  const anchor = { click() { clicked = true } }
  const context = { JSZip, document: { createElement: () => anchor }, URL: {
    createObjectURL(value) { blob = value; return 'blob:qa-image' },
    revokeObjectURL(value) { revoked = value },
  }, setTimeout: callback => callback() }
  vm.createContext(context)
  vm.runInContext(ts.transpileModule(fn.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context)
  const fixture = JSON.parse(fs.readFileSync('tests/fixtures/apple-assets.storeshots.json', 'utf8')).config.images.appleHeader[0]
  await context.downloadPng(fixture, 'test-image.png')
  assert.equal(anchor.download, 'test-image.png')
  assert.equal(anchor.href, 'blob:qa-image', 'direct data URL downloads must not return')
  assert.equal(clicked, true)
  assert.equal(revoked, anchor.href)
  assert.deepEqual(Buffer.from(await blob.arrayBuffer()), Buffer.from(fixture.split(',')[1], 'base64'))
})
