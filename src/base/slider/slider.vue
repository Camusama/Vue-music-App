<template>
  <!--只要想要在Vue中直接操作DOM元素，就必须用ref属性进行注册-->
  <div class="slider" ref="slider">
    <div class="slider-group" ref="sliderGroup">
      <slot>
      </slot>
    </div>
    <div class="dots">
      <span class="dot" :class="{active: currentPageIndex === index }" v-for="(item, index) in dots"></span>
    </div>
  </div>
</template>

<script type="text/ecmascript-6">
  import {addClass} from 'common/js/dom'
  import BScroll from 'better-scroll'

  export default {
    name: 'slider',
    props: {
      loop: {
        type: Boolean,
        default: true
      },
      autoPlay: {
        type: Boolean,
        default: true
      },
      interval: {
        type: Number,
        default: 4000
      }
    },
    data() {
      return {
        dots: [],
        currentPageIndex: 0
      }
    },
    mounted() {
      // 数据获取为异步，则此处异步，数据获取后才能渲染
      setTimeout(() => {
        this._setSliderWidth()
        this._initDots()
        this._initSlider()

        if (this.autoPlay) {
          this._play()
        }
      }, 20)
      // 窗口宽度切换时自动刷新轮播大小
      window.addEventListener('resize', () => {
        if (!this.slider) {
          return
        }
        this._setSliderWidth(true)
        this.slider.refresh()
      })
    },
    activated() {
      if (this.autoPlay) {
        this._play()
      }
    },
    deactivated() {
      clearTimeout(this.timer)
    },
    beforeDestroy() {
      clearTimeout(this.timer)
    },
    methods: {
      _setSliderWidth(isResize) {
        // 获取每一张图的dom
        this.children = this.$refs.sliderGroup.children
        let width = 0
        // slider标签自动占满屏幕宽，clientwidth获取
        let sliderWidth = this.$refs.slider.clientWidth
        for (let i = 0; i < this.children.length; i++) {
          let child = this.children[i]
          addClass(child, 'slider-item')
          // 添加类并赋宽
          child.style.width = sliderWidth + 'px'
          width += sliderWidth
        }
        if (this.loop && !isResize) {
          width += 2 * sliderWidth
        }
        this.$refs.sliderGroup.style.width = width + 'px'
      },
      _initSlider() {
        // 初始化组件配置
        this.slider = new BScroll(this.$refs.slider, {
          scrollX: true,
          scrollY: false,
          momentum: false,
          snap: true,
          snapLoop: this.loop,
          snapThreshold: 0.3,
          snapSpeed: 400
        })
        // 监听事件，添加循环轮播
        this.slider.on('scrollEnd', () => {
          let pageIndex = this.slider.getCurrentPage().pageX
          // 插件自动首尾各增加一个div，则真实page应减一
          if (this.loop) {
            pageIndex -= 1
          }
          this.currentPageIndex = pageIndex

          if (this.autoPlay) {
            this._play()
          }
        })
        // 更新autoplay时间
        this.slider.on('beforeScrollStart', () => {
          if (this.autoPlay) {
            clearTimeout(this.timer)
          }
        })
      },
      // 浮点数量
      _initDots() {
        this.dots = new Array(this.children.length)
      },
      // 自动滑动
      _play() {
        let pageIndex = this.currentPageIndex + 1
        if (this.loop) {
          pageIndex += 1
        }
        this.timer = setTimeout(() => {
          this.slider.goToPage(pageIndex, 0, 400)
        }, this.interval)
      }
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"

  .slider
    min-height: 1px
    .slider-group
      position: relative
      overflow: hidden
      white-space: nowrap
      .slider-item
        float: left
        box-sizing: border-box
        overflow: hidden
        text-align: center
        a
          display: block
          width: 100%
          overflow: hidden
          text-decoration: none
        img
          display: block
          width: 100%
    .dots
      position: absolute
      right: 0
      left: 0
      bottom: 12px
      text-align: center
      font-size: 0
      .dot
        display: inline-block
        margin: 0 4px
        width: 8px
        height: 8px
        border-radius: 50%
        background: $color-text-l
        /*dot的active样式*/
        &.active
          width: 20px
          border-radius: 5px
          background: $color-text-ll
</style>
