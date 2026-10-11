const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const maxBytes = 2 * 1024 * 1024

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read this image.'))
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.readAsDataURL(blob)
  })
}

async function openImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.')
  try {
    return await createImageBitmap(file)
  } catch {
    throw new Error('This image could not be opened. Try a JPEG or PNG.')
  }
}

// Draws the source rectangle onto a white canvas and re-encodes it as JPEG.
async function encodeJpeg(bitmap, source, width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(bitmap, source.x, source.y, source.width, source.height, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  if (!blob || blob.size > maxBytes) throw new Error('This image is too large to send.')
  return { mime_type: 'image/jpeg', base64: await blobToBase64(blob) }
}

// Profile photos: center-cropped square, at most 512 px.
export async function prepareAvatar(file) {
  const bitmap = await openImage(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const size = Math.min(512, side)
  return encodeJpeg(bitmap, { x: (bitmap.width - side) / 2, y: (bitmap.height - side) / 2, width: side, height: side },
    size, size)
}

// Chat photos: sent unchanged when already small enough (keeps GIF animation), otherwise scaled to 1600 px.
export async function prepareChatImage(file) {
  if (allowedTypes.includes(file.type) && file.size <= maxBytes) {
    return { mime_type: file.type, base64: await blobToBase64(file) }
  }
  const bitmap = await openImage(file)
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  return encodeJpeg(bitmap, { x: 0, y: 0, width: bitmap.width, height: bitmap.height },
    Math.round(bitmap.width * scale), Math.round(bitmap.height * scale))
}
