const { createCanvas, loadImage, registerFont } = require('node-canvas')
const { join } = require('path')
registerFont(join(__dirname, 'minecraft.otf'), { family: 'minecraft' })
registerFont(join(__dirname, 'minecraft-bold.otf'), { family: 'minecraft-bold' })

const COLOR_CODES = {
  0: [0, 0, 0],
  1: [0, 0, 170],
  2: [0, 170, 0],
  3: [0, 170, 170],
  4: [170, 0, 0],
  5: [170, 0, 170],
  6: [255, 170, 0],
  7: [170, 170, 170],
  8: [85, 85, 85],
  9: [85, 85, 254],
  a: [85, 254, 85],
  b: [85, 254, 254],
  c: [254, 85, 85],
  d: [254, 85, 254],
  e: [255, 255, 85],
  f: [255, 255, 255]
}

const SHADOW_COLOR_CODES = {
  0: [0, 0, 0],
  1: [0, 0, 42],
  2: [0, 42, 0],
  3: [0, 42, 42],
  4: [42, 0, 0],
  5: [42, 0, 42],
  6: [64, 42, 0],
  7: [42, 42, 42],
  8: [21, 21, 21],
  9: [21, 21, 63],
  a: [21, 63, 21],
  b: [21, 63, 63],
  c: [63, 21, 21],
  d: [63, 21, 63],
  e: [63, 63, 21],
  f: [63, 63, 63]
}
const FONT_WIDTH = 16
const BOLD_FONT_WIDTH = (37 / 30) * FONT_WIDTH
module.exports = async (txt, { background, crop } = {}) => {
  let [height, width] = getTextSize(txt, createCanvas(500, 500).getContext('2d'))
  let image
  if (background !== undefined && background !== '') {
    image = await loadImage(background)
    width = image.width
    height = image.height
  }
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (image) ctx.drawImage(image, 0, 0)
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2

  const arr = txt.split('\n')
  setFont(ctx, false)
  let currHeight = 0
  for (let i = arr.length - 1; i >= 0; i--) {
    currHeight += renderLine(ctx, arr[i], canvas.height, currHeight, ctx.shadowOffsetY)
    setFont(ctx, false)
  }

  const [h, w] = getTextSize(txt, createCanvas(500, 500).getContext('2d'))
  return crop ? cropCanvas(canvas, 0, canvas.height - h, w, h) : canvas
}

function setColor (ctx, colorCode) {
  ctx.fillStyle = `rgb(${COLOR_CODES[colorCode].join(',')})`
  ctx.shadowColor = `rgb(${SHADOW_COLOR_CODES[colorCode].join(',')})`
}

function setFont (ctx, bold) {
  ctx.font = `${FONT_WIDTH}px "minecraft"`
  if (bold) {
    ctx.font = `${BOLD_FONT_WIDTH}px "minecraft-bold"`
  }
}

function renderLine (ctx, str, canvasHeight, currHeight, shadowOffsetY) {
  let currWidth = 0
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '&') {
      const next = str[++i]
      if (next === 'l') {
        setFont(ctx, true)
      } else if (next === 'r') {
        setFont(ctx, false)
      } else {
        setColor(ctx, next)
      }
      continue
    }
    const { width, emHeightDescent } = ctx.measureText(str[i])
    ctx.fillText(str[i], 1 + currWidth, canvasHeight - currHeight - emHeightDescent - shadowOffsetY)
    currWidth += width
  }
  return getTextSize(str, createCanvas(500, 500).getContext('2d'))[0] // height
}

function getTextSize (txt, ctx, b) {
  setFont(ctx, false)
  const lines = []
  let maxHeight = 0
  for (const line of txt.split('\n')) {
    let currTotal = 0
    let currHeightMax = 0
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '&') {
        const next = line[++i]
        if (next === 'l') {
          setFont(ctx, true)
        } else if (next === 'r') {
          setFont(ctx, false)
        }
        continue
      }
      const out = ctx.measureText(line[i])
      currHeightMax = Math.max(currHeightMax, out.emHeightAscent + out.emHeightDescent)
      currTotal += out.width
    }
    lines.push(currTotal)
    maxHeight += currHeightMax
  }
  const width = lines.reduce((acc, curr) => Math.max(acc, curr))
  return [maxHeight, width]
}

const cropCanvas = (sourceCanvas, left, top, width, height) => {
  const destCanvas = createCanvas(width, height)
  destCanvas.getContext('2d').drawImage(
    sourceCanvas,
    left, top, width, height, // source rect with content to crop
    0, 0, width, height) // newCanvas, same size as source rect
  return destCanvas
}
