import Vue from 'vue'
import App from './App'
import router from './router'
import 'babel-polyfill'
import fastclick from 'fastclick'
import VueLazyload from 'vue-lazyload'


Vue.config.productionTip = false
import 'common/stylus/index.styl'
fastclick.attach(document.body)

Vue.use(VueLazyload, {
  loading: require('common/image/default.png')
})
/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
