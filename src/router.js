import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import CategoryView from './views/CategoryView.vue'
import DesignView from './views/DesignView.vue'
import PanelView from './views/PanelView.vue'
import { categoryKeys, getCategory } from './data/categories.js'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/materials/:category',
      name: 'category',
      component: CategoryView,
      beforeEnter: to => categoryKeys.includes(to.params.category) || { name: 'home' },
    },
    {
      path: '/materials/:category/:code',
      name: 'panel',
      component: PanelView,
      beforeEnter: to => getCategory(to.params.category)?.data.some(i => i.code === to.params.code && i.examples)
        || { name: 'category', params: { category: to.params.category } },
    },
    { path: '/design', name: 'design', component: DesignView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) {
      // wait for the home sections to mount before scrolling to an anchor
      return new Promise(resolve =>
        setTimeout(() => resolve({ el: to.hash, top: 64, behavior: 'smooth' }), from.name === to.name ? 0 : 150))
    }
    return { top: 0 }
  },
})
