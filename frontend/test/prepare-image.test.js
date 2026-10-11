import test from 'node:test'
import assert from 'node:assert/strict'
import { detectImageType } from '../src/images/prepare.js'

const blob = (...parts) => new Blob(parts.map(part => typeof part === 'string' ? part : new Uint8Array(part)))

test('photo type comes from the file contents, not its name or label', async () => {
  assert.equal(await detectImageType(blob([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg')
  assert.equal(await detectImageType(blob([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'image/png')
  assert.equal(await detectImageType(blob('GIF89a')), 'image/gif')
  assert.equal(await detectImageType(blob('RIFF', [0, 0, 0, 0], 'WEBP')), 'image/webp')
  assert.equal(await detectImageType(new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: 'image/png' })), 'image/jpeg')
  assert.equal(await detectImageType(blob('<svg></svg>')), null)
  assert.equal(await detectImageType(blob()), null)
})
