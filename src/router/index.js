import Vue from 'vue'
import VueRouter from 'vue-router'
import Collect from '../views/Collect.vue'
import Organise from '../views/Organise.vue'
import Cards from '../views/Cards.vue'
import Discarded from '../views/Discarded.vue'
import Find from '../views/Find.vue'
import Leave from '../views/Leave.vue'
import About from '../views/About.vue'
import NotFound from '../views/NotFound.vue'
import NitPicky from '../views/NitPicky.vue'
//import store from '../store'
// import Oldhome from '../views/Oldhome'
//import Test from '../views/Test'

Vue.use(VueRouter)

export const routes = [
  {
    path: '/',
    name: 'Collect',
    component: Collect,
  },
  {
    path: '/organise',
    name: 'Organise',
    component: Organise,
  },

  {
    path: '/cards',
    name: 'Cards',
    component: Cards,
  },

  {
    path: '/discarded',
    name: 'Discarded',
    component: Discarded,
  },
  {
    path: '/find',
    name: 'Find',
    component: Find,
  },
  {
    path: '/leave',
    name: 'Leave',
    component: Leave,
  },
  {
    path: '/about',
    name: 'About',
    component: About,
  },
  {
    path: '/nitpicky',
    name: 'NitPicky',
    component: NitPicky,
  },

  {
    // catches 404 errors
    path: '*',
    name: '404',
    component: NotFound,
  },

  // dynamic segement `:microcosm` is added to the path
  {
    path: '/microcosm/:microcosm',
    component: Collect,
  },
]

const router = new VueRouter({
  mode: 'history',
  //base: 'https://alpha.nodenogg.in/',
  //base: process.env.VUE_APP_HTTP + '://' + process.env.VUE_APP_URL + '',
  //base: process.env.VUE_APP_HTTP,
  routes,
})

export default router
