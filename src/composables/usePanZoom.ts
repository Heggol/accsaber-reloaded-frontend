import { computed, onMounted, onUnmounted, ref, type Ref } from 'vue'

export function usePanZoom(containerRef: Ref<HTMLElement | null>, options?: {
  minZoom?: number
  maxZoom?: number
}) {
  const minZoom = options?.minZoom ?? 0.5
  const maxZoom = options?.maxZoom ?? 4

  const scale = ref(1)
  const translateX = ref(0)
  const translateY = ref(0)

  let isPanning = false
  let startX = 0
  let startY = 0
  let startTx = 0
  let startTy = 0

  const transformStyle = computed(() =>
    `scale(${scale.value}) translate(${translateX.value}px, ${translateY.value}px)`,
  )

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    const el = containerRef.value
    if (!el) return

    const rect = el.getBoundingClientRect()
    const cursorX = e.clientX - rect.left
    const cursorY = e.clientY - rect.top

    const prev = scale.value
    const factor = e.deltaY > 0 ? 0.9 : 1.1
    const next = Math.min(maxZoom, Math.max(minZoom, prev * factor))

    translateX.value += cursorX * (1 / next - 1 / prev)
    translateY.value += cursorY * (1 / next - 1 / prev)
    scale.value = next
  }

  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('button')) return

    isPanning = true
    startX = e.clientX
    startY = e.clientY
    startTx = translateX.value
    startTy = translateY.value
    containerRef.value?.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent) {
    if (!isPanning) return
    translateX.value = startTx + (e.clientX - startX) / scale.value
    translateY.value = startTy + (e.clientY - startY) / scale.value
  }

  function onPointerUp() {
    isPanning = false
  }

  function reset() {
    scale.value = 1
    translateX.value = 0
    translateY.value = 0
  }

  function setTransform(s: number, tx: number, ty: number) {
    scale.value = Math.min(maxZoom, Math.max(minZoom, s))
    translateX.value = tx
    translateY.value = ty
  }

  onMounted(() => {
    const el = containerRef.value
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointerleave', onPointerUp)
  })

  onUnmounted(() => {
    const el = containerRef.value
    if (!el) return
    el.removeEventListener('wheel', onWheel)
    el.removeEventListener('pointerdown', onPointerDown)
    el.removeEventListener('pointermove', onPointerMove)
    el.removeEventListener('pointerup', onPointerUp)
    el.removeEventListener('pointerleave', onPointerUp)
  })

  return { scale, transformStyle, reset, setTransform }
}
