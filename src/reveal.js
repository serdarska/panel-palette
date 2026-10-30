import { onMounted, onUnmounted } from 'vue'

export function useReveal() {
  let io
  onMounted(() => {
    io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) }
      }),
      { threshold: 0.08, rootMargin: '-20px 0px' }
    )
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el))
  })
  onUnmounted(() => io?.disconnect())
}
