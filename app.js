const R_BASE = 80

const COIN_OPTIONS = [
  {
    id: 'nt10',
    name: '10元硬幣 (NT$10 · 26mm)',
    label: '10',
    ratio: 1.0,
    fillLight: '#e5e9f0',
    fillDark: '#b8c1cf',
    rimColor: '#8d99ae',
    textColor: '#334155',
    hasPortrait: true
  },
  {
    id: 'nt5',
    name: '5元硬幣 (NT$5 · 22mm)',
    label: '5',
    ratio: 22 / 26,
    fillLight: '#eef2f6',
    fillDark: '#c5cdd8',
    rimColor: '#94a3b8',
    textColor: '#334155',
    hasPortrait: false
  },
  {
    id: 'nt1',
    name: '1元硬幣 (NT$1 · 20mm)',
    label: '1',
    ratio: 20 / 26,
    fillLight: '#e8b382',
    fillDark: '#b87440',
    rimColor: '#8c5124',
    textColor: '#4a250a',
    hasPortrait: false
  },
  {
    id: 'virtual05',
    name: '虛擬小幣 (1/2 半徑 · 0.5x)',
    label: '0.5x',
    ratio: 0.5,
    fillLight: '#a5f3fc',
    fillDark: '#22d3ee',
    rimColor: '#0891b2',
    textColor: '#083344',
    hasPortrait: false
  },
  {
    id: 'virtual2',
    name: '虛擬大幣 (大一倍 · 2x)',
    label: '2x',
    ratio: 2.0,
    fillLight: '#fde68a',
    fillDark: '#eab308',
    rimColor: '#b45309',
    textColor: '#451a03',
    hasPortrait: false
  },
  {
    id: 'virtual3',
    name: '虛擬巨幣 (大兩倍 · 3x)',
    label: '3x',
    ratio: 3.0,
    fillLight: '#d8b4fe',
    fillDark: '#9333ea',
    rimColor: '#f59e0b',
    textColor: '#2e1065',
    hasPortrait: false
  }
]

const canvas = document.getElementById('simCanvas')
const ctx = canvas.getContext('2d')
const centerCoinSelect = document.getElementById('centerCoinSelect')
const outerCoinSelect = document.getElementById('outerCoinSelect')
const playPauseBtn = document.getElementById('playPauseBtn')
const resetBtn = document.getElementById('resetBtn')
const angleSlider = document.getElementById('angleSlider')
const angleReadout = document.getElementById('angleReadout')
const ratioReadout = document.getElementById('ratioReadout')
const formulaReadout = document.getElementById('formulaReadout')
const rotationCounter = document.getElementById('rotationCounter')

const state = {
  centerCoinId: 'nt10',
  outerCoinId: 'nt10',
  progress: 0, // 0 to 1 (0 to 360 deg)
  isPlaying: false,
  isDragging: false,
  lastTime: 0,
  canvasWidth: 800,
  canvasHeight: 600
}

const ORBIT_DURATION_SEC = 6

function getCoinById(id) {
  return COIN_OPTIONS.find((coin) => coin.id === id) || COIN_OPTIONS[0]
}

function populateSelect(selectEl, defaultId) {
  COIN_OPTIONS.forEach((coin) => {
    const option = document.createElement('option')
    option.value = coin.id
    option.textContent = coin.name
    if (coin.id === defaultId) {
      option.selected = true
    }
    selectEl.appendChild(option)
  })
}

function getGeometry() {
  const centerCoin = getCoinById(state.centerCoinId)
  const outerCoin = getCoinById(state.outerCoinId)
  const R = R_BASE * centerCoin.ratio
  const r = R_BASE * outerCoin.ratio

  const padding = 44
  const maxExtent = R + 2 * r
  const halfMinDim = Math.min(state.canvasWidth, state.canvasHeight) / 2 - padding
  const scale = Math.min(1, Math.max(0.15, halfMinDim / maxExtent))

  return {
    centerCoin,
    outerCoin,
    R,
    r,
    scale,
    cx: state.canvasWidth / 2,
    cy: state.canvasHeight / 2
  }
}

function updateReadouts() {
  const centerCoin = getCoinById(state.centerCoinId)
  const outerCoin = getCoinById(state.outerCoinId)
  const ratioR = centerCoin.ratio
  const ratior = outerCoin.ratio
  const totalRotations = 1 + ratioR / ratior
  const currentRotations = state.progress * totalRotations
  const degrees = state.progress * 360

  angleSlider.value = degrees.toFixed(1)
  angleReadout.textContent = `${degrees.toFixed(1)}°`
  ratioReadout.textContent = `${ratioR.toFixed(2)} : ${ratior.toFixed(2)}`
  formulaReadout.innerHTML = `總自轉圈數 = 1 (公轉) + (${ratioR.toFixed(2)} ÷ ${ratior.toFixed(2)}) = <strong>${totalRotations.toFixed(2)} 圈</strong>`
  rotationCounter.textContent = `${currentRotations.toFixed(2)} 圈`
}

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  state.canvasWidth = Math.max(300, rect.width)
  state.canvasHeight = Math.max(300, rect.height)
  canvas.width = Math.round(state.canvasWidth * dpr)
  canvas.height = Math.round(state.canvasHeight * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  render()
}

function drawGrid() {
  const step = 32
  ctx.save()
  ctx.strokeStyle = '#eef2f6'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = step; x < state.canvasWidth; x += step) {
    ctx.moveTo(x, 0)
    ctx.lineTo(x, state.canvasHeight)
  }
  for (let y = step; y < state.canvasHeight; y += step) {
    ctx.moveTo(0, y)
    ctx.lineTo(state.canvasWidth, y)
  }
  ctx.stroke()
  ctx.restore()
}

function drawCoinBase(x, y, radius, coin, rotationAngle, isRolling) {
  ctx.save()
  ctx.translate(x, y)

  // Drop shadow
  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 3, radius, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.14)'
  ctx.fill()
  ctx.restore()

  ctx.rotate(rotationAngle)

  // Metallic radial gradient
  const grad = ctx.createRadialGradient(
    -radius * 0.28,
    -radius * 0.28,
    radius * 0.1,
    0,
    0,
    radius
  )
  grad.addColorStop(0, coin.fillLight)
  grad.addColorStop(1, coin.fillDark)

  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.lineWidth = Math.max(2, radius * 0.06)
  ctx.strokeStyle = coin.rimColor
  ctx.stroke()

  // Inner rim & knurled ticks
  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.84, 0, Math.PI * 2)
  ctx.lineWidth = 1.2
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.stroke()

  const tickCount = 24
  ctx.save()
  ctx.strokeStyle = coin.rimColor
  ctx.globalAlpha = 0.45
  ctx.lineWidth = 1.2
  for (let i = 0; i < tickCount; i++) {
    const a = (i / tickCount) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * radius * 0.88, Math.sin(a) * radius * 0.88)
    ctx.lineTo(Math.cos(a) * radius * 0.96, Math.sin(a) * radius * 0.96)
    ctx.stroke()
  }
  ctx.restore()

  // Portrait silhouette for NT$10
  if (coin.hasPortrait) {
    ctx.save()
    ctx.fillStyle = 'rgba(71, 85, 105, 0.22)'
    // Head
    ctx.beginPath()
    ctx.arc(0, -radius * 0.12, radius * 0.22, 0, Math.PI * 2)
    ctx.fill()
    // Shoulders
    ctx.beginPath()
    ctx.ellipse(0, radius * 0.28, radius * 0.34, radius * 0.2, 0, Math.PI, 0)
    ctx.fill()
    ctx.restore()
  }

  // Coin label
  ctx.save()
  ctx.fillStyle = coin.textColor
  ctx.font = `700 ${Math.max(12, Math.round(radius * 0.42))}px -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.globalAlpha = isRolling ? 0.45 : 0.85
  ctx.fillText(coin.label, 0, isRolling ? radius * 0.34 : 2)
  ctx.restore()

  // Rolling coin orientation cues: upward arrow + bold red radial pointer
  if (isRolling) {
    // Bold red radial pointer line pointing straight up in local coordinates (0, -radius)
    ctx.save()
    ctx.strokeStyle = '#dc2626'
    ctx.fillStyle = '#dc2626'
    ctx.lineWidth = Math.max(3, radius * 0.075)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, -radius * 0.78)
    ctx.stroke()

    // Distinct upward-pointing arrowhead
    const headLen = Math.max(8, radius * 0.24)
    const headWidth = Math.max(6, radius * 0.18)
    ctx.beginPath()
    ctx.moveTo(0, -radius * 0.92)
    ctx.lineTo(-headWidth, -radius * 0.92 + headLen)
    ctx.lineTo(headWidth, -radius * 0.92 + headLen)
    ctx.closePath()
    ctx.fill()

    // Center hub dot
    ctx.beginPath()
    ctx.arc(0, 0, Math.max(3.5, radius * 0.08), 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  ctx.restore()
}

function drawMilestones(geom) {
  const { cx, cy, R, r, scale } = geom
  const orbitR = (R + r) * scale
  const totalRotations = 1 + R / r
  const currentRotations = state.progress * totalRotations
  const maxMilestone = Math.floor(currentRotations + 1e-6)

  for (let k = 1; k <= maxMilestone; k++) {
    const p = k / totalRotations
    const theta = -Math.PI / 2 + p * Math.PI * 2
    const mx = cx + orbitR * Math.cos(theta)
    const my = cy + orbitR * Math.sin(theta)

    ctx.save()
    // Milestone dot
    ctx.beginPath()
    ctx.arc(mx, my, 5.5, 0, Math.PI * 2)
    ctx.fillStyle = '#2563eb'
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()

    // Label offset slightly outward from orbit
    const labelDist = orbitR + 20
    const lx = cx + labelDist * Math.cos(theta)
    const ly = cy + labelDist * Math.sin(theta)
    const text = `${k}圈`

    ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif'
    const textW = ctx.measureText(text).width
    const pillW = textW + 12
    const pillH = 20

    ctx.fillStyle = 'rgba(37, 99, 235, 0.92)'
    ctx.beginPath()
    ctx.roundRect(lx - pillW / 2, ly - pillH / 2, pillW, pillH, 999)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, lx, ly + 0.5)
    ctx.restore()
  }
}

function render() {
  const geom = getGeometry()
  const { centerCoin, outerCoin, R, r, scale, cx, cy } = geom
  const scaledR = R * scale
  const scaledr = r * scale
  const orbitR = (R + r) * scale

  ctx.clearRect(0, 0, state.canvasWidth, state.canvasHeight)
  drawGrid()

  // Dashed circular orbit path
  ctx.save()
  ctx.setLineDash([6, 6])
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.arc(cx, cy, orbitR, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  // Stationary center coin
  drawCoinBase(cx, cy, scaledR, centerCoin, 0, false)

  // Rolling outer coin physics
  const theta = -Math.PI / 2 + state.progress * Math.PI * 2
  const x = cx + orbitR * Math.cos(theta)
  const y = cy + orbitR * Math.sin(theta)
  const phi = -Math.PI / 2 + (theta + Math.PI / 2) * (1 + R / r)

  // Draw rolling coin (local "up" is -PI/2, so rotate by phi + PI/2)
  drawCoinBase(x, y, scaledr, outerCoin, phi + Math.PI / 2, true)

  // Dashed green vertical reference line through moving center pointing straight up
  ctx.save()
  ctx.setLineDash([5, 4])
  ctx.strokeStyle = '#16a34a'
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x, y - (scaledr + 28))
  ctx.stroke()

  // Small green cap arrow at top of vertical reference line
  ctx.setLineDash([])
  ctx.fillStyle = '#16a34a'
  ctx.beginPath()
  ctx.arc(x, y - (scaledr + 28), 3.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Milestone dots & labels along orbit
  drawMilestones(geom)
}

function setProgress(newProgress) {
  state.progress = Math.max(0, Math.min(1, newProgress))
  updateReadouts()
  render()
}

function togglePlay() {
  if (state.isPlaying) {
    state.isPlaying = false
    playPauseBtn.textContent = '播放'
    return
  }
  if (state.progress >= 1) {
    state.progress = 0
  }
  state.isPlaying = true
  state.lastTime = performance.now()
  playPauseBtn.textContent = '暫停'
  requestAnimationFrame(tick)
}

function resetSimulation() {
  state.isPlaying = false
  playPauseBtn.textContent = '播放'
  setProgress(0)
}

function tick(now) {
  if (!state.isPlaying) return
  const dt = Math.min(0.05, (now - state.lastTime) / 1000)
  state.lastTime = now

  const next = state.progress + dt / ORBIT_DURATION_SEC
  if (next >= 1) {
    state.isPlaying = false
    playPauseBtn.textContent = '播放'
    setProgress(1)
    return
  }

  setProgress(next)
  requestAnimationFrame(tick)
}

function updateProgressFromPointer(clientX, clientY) {
  const rect = canvas.getBoundingClientRect()
  const px = clientX - rect.left
  const py = clientY - rect.top
  const cx = state.canvasWidth / 2
  const cy = state.canvasHeight / 2

  const angle = Math.atan2(py - cy, px - cx)
  let delta = angle - -Math.PI / 2
  while (delta < 0) delta += Math.PI * 2
  while (delta >= Math.PI * 2) delta -= Math.PI * 2

  let nextProgress = delta / (Math.PI * 2)

  // Smooth wrap clamping at 12 o'clock (0° / 360°)
  if (state.progress > 0.82 && nextProgress < 0.18) {
    nextProgress = 1
  } else if (state.progress < 0.18 && nextProgress > 0.82) {
    nextProgress = 0
  }

  setProgress(nextProgress)
}

populateSelect(centerCoinSelect, state.centerCoinId)
populateSelect(outerCoinSelect, state.outerCoinId)

centerCoinSelect.addEventListener('change', (e) => {
  state.centerCoinId = e.target.value
  updateReadouts()
  render()
})

outerCoinSelect.addEventListener('change', (e) => {
  state.outerCoinId = e.target.value
  updateReadouts()
  render()
})

playPauseBtn.addEventListener('click', togglePlay)
resetBtn.addEventListener('click', resetSimulation)

angleSlider.addEventListener('input', (e) => {
  if (state.isPlaying) {
    state.isPlaying = false
    playPauseBtn.textContent = '播放'
  }
  const deg = parseFloat(e.target.value)
  setProgress(deg / 360)
})

canvas.addEventListener('pointerdown', (e) => {
  state.isDragging = true
  if (state.isPlaying) {
    state.isPlaying = false
    playPauseBtn.textContent = '播放'
  }
  canvas.setPointerCapture(e.pointerId)
  updateProgressFromPointer(e.clientX, e.clientY)
})

canvas.addEventListener('pointermove', (e) => {
  if (!state.isDragging) return
  updateProgressFromPointer(e.clientX, e.clientY)
})

function stopDragging(e) {
  if (!state.isDragging) return
  state.isDragging = false
  if (canvas.hasPointerCapture(e.pointerId)) {
    canvas.releasePointerCapture(e.pointerId)
  }
}

canvas.addEventListener('pointerup', stopDragging)
canvas.addEventListener('pointercancel', stopDragging)

window.addEventListener('resize', resizeCanvas)

updateReadouts()
resizeCanvas()
