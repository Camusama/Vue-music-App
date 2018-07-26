<template>
  <scroll @scroll="scroll"
          :listen-scroll="listenScroll"
          :probe-type="probeType"
          :data="data"
          class="listview"
          ref="listview">
    <ul>
      <!--data=singer 数据结构为对象数组[{items:[Singer:{avatar:'头像图',id:'',name:'周杰伦'}...],title:"A or 热门"}...]-->
      <li v-for="group in data" class="list-group" ref="listGroup">
        <h2 class="list-group-title">{{group.title}}</h2>
        <uL>
          <li @click="selectItem(item)" v-for="item in group.items" class="list-group-item">
            <img class="avatar" v-lazy="item.avatar">
            <span class="name">{{item.name}}</span>
          </li>
        </uL>
      </li>
    </ul>
    <div class="list-shortcut"
         @touchstart.stop.prevent="onShortcutTouchStart" @touchmove.stop.prevent="onShortcutTouchMove"
         @touchend.stop>
      <ul>
        <!--属性赋值data-index用于dom获取-->
        <li v-for="(item, index) in shortcutList" :data-index="index" class="item"
            :class="{'current':currentIndex===index}">{{item}}
        </li>
      </ul>
    </div>
    <!--固定title的实现，下面不是滚动的部分，直接获取当前滚动title值-->
    <div class="list-fixed" ref="fixed" v-show="fixedTitle">
      <div class="fixed-title">{{fixedTitle}} </div>
    </div>
    <div v-show="!data.length" class="loading-container">
      <loading></loading>
    </div>
  </scroll>
</template>

<script type="text/ecmascript-6">
  import Scroll from 'base/scroll/scroll'
  import Loading from 'base/loading/loading'
  import {getData} from 'common/js/dom'

  const TITLE_HEIGHT = 30
  const ANCHOR_HEIGHT = 18

  export default {
    props: {
      data: {
        type: Array,
        default: []
      }
    },
    computed: {
      // 获取一个只含title的数组
      shortcutList() {
        return this.data.map((group) => {
          return group.title.substr(0, 1)
        })
      },
      // 没有滚动时修正
      fixedTitle() {
        if (this.scrollY > 0) {
          return ''
        }
        return this.data[this.currentIndex] ? this.data[this.currentIndex].title : ''
      }
    },
    data() {
      return {
        scrollY: -1,
        currentIndex: 0,
        // 实现title过渡
        diff: -1
      }
    },
    created() {
      // 3表示swiper时也派发事件，bs配置项
      this.probeType = 3
      this.listenScroll = true
      // 下面两个值用于在函数间传递数据，所以不用data(){}
      // touch用于传递点击变化的y值
      this.touch = {}
      // listHeight用于获取一个高度区间数组，[0,17,52...]
      this.listHeight = []
    },
    methods: {
      // 调用父组件选择歌手方法跳转页面
      selectItem(item) {
        this.$emit('select', item)
      },
      //touchstart结束时，侧边栏点击跳转scroll
      onShortcutTouchStart(e) {
        //等于 anchorIndex= e.target.getAttribute(data-index)，取得目标在数组里的索引值（0..），但为字符串
        let anchorIndex = getData(e.target, 'index')
        // 获取第一个触碰对象
        let firstTouch = e.touches[0]
        this.touch.y1 = firstTouch.pageY
        this.touch.anchorIndex = anchorIndex

        this._scrollTo(anchorIndex)
      },
      // touchmove结束时，滑动跳转scroll
      onShortcutTouchMove(e) {
        let firstTouch = e.touches[0]
        this.touch.y2 = firstTouch.pageY
        // |0即向下取整，二进制运算，ANCHOR_HEIGHT为层高，样式值18
        let delta = (this.touch.y2 - this.touch.y1) / ANCHOR_HEIGHT | 0
        // touchstart时的值加上增加值delta，因为是字符串所以转换
        let anchorIndex = parseInt(this.touch.anchorIndex) + delta

        this._scrollTo(anchorIndex)
      },
      refresh() {
        this.$refs.listview.refresh()
      },
      scroll(pos) {
        this.scrollY = pos.y
      },
      // 计算整个scroll部分的每层group离最上顶部绝对值作数组
      _calculateHeight() {
        this.listHeight = []
        const list = this.$refs.listGroup
        let height = 0
        this.listHeight.push(height)
        for (let i = 0; i < list.length; i++) {
          let item = list[i]
          height += item.clientHeight
          this.listHeight.push(height)
        }
      },
      // 统一钩子跳转至数组索引位置
      _scrollTo(index) {
        if (!index && index !== 0) {
          return
        }
        if (index < 0) {
          index = 0
          // 实际层数length-1，比其小1
        } else if (index > this.listHeight.length - 2) {
          index = this.listHeight.length - 2
        }
        this.scrollY = -this.listHeight[index]
        this.$refs.listview.scrollToElement(this.$refs.listGroup[index], 0)
      }
    },
    watch: {
      data() {
        setTimeout(() => {
          this._calculateHeight()
        }, 20)
      },
      // 旨在使左边滚动影响右边高亮
      scrollY(newY) {
        const listHeight = this.listHeight
        // 当滚动到顶部以上，newY>0
        if (newY > 0) {
          this.currentIndex = 0
          return
        }
        // 在中间部分滚动
        for (let i = 0; i < listHeight.length - 1; i++) {
          let height1 = listHeight[i]
          let height2 = listHeight[i + 1]
          if (-newY >= height1 && -newY < height2) {
            this.currentIndex = i
            // diff指group的顶部，也是title的底部距离上一标签的高度
            this.diff = height2 + newY
            return
          }
        }
        // 当滚动到底部，且-newY大于最后一个元素的上限
        this.currentIndex = listHeight.length - 2
      },
      // 对于左侧滑动影响右侧高亮，需要获得此时的index值，方法是获取滚动的距离，再对左侧group区间高度作一个数组，将距离在此数组区间内判断
      diff(newVal) {
        // 实现title过渡效果
        let fixedTop = (newVal > 0 && newVal < TITLE_HEIGHT) ? newVal - TITLE_HEIGHT : 0
        if (this.fixedTop === fixedTop) {
          return
        }
        this.fixedTop = fixedTop
        this.$refs.fixed.style.transform = `translate3d(0,${fixedTop}px,0)`
      }
    },
    components: {
      Scroll,
      Loading
    }
  }

</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"

  .listview
    position: relative
    width: 100%
    height: 100%
    overflow: hidden
    background: $color-background
    .list-group
      padding-bottom: 30px
      .list-group-title
        height: 30px
        line-height: 30px
        padding-left: 20px
        font-size: $font-size-small
        color: $color-text-l
        background: $color-highlight-background
      .list-group-item
        display: flex
        align-items: center
        padding: 20px 0 0 30px
        .avatar
          width: 50px
          height: 50px
          border-radius: 50%
        .name
          margin-left: 20px
          color: $color-text-l
          font-size: $font-size-medium
    .list-shortcut
      position: absolute
      z-index: 30
      right: 0
      top: 50%
      transform: translateY(-50%)
      width: 20px
      padding: 20px 0
      border-radius: 10px
      text-align: center
      background: $color-background-d
      font-family: Helvetica
      .item
        padding: 3px
        line-height: 1
        color: $color-text-l
        font-size: $font-size-small
        &.current
          color: $color-theme
    .list-fixed
      position: absolute
      top: 0
      left: 0
      width: 100%
      .fixed-title
        height: 30px
        line-height: 30px
        padding-left: 20px
        font-size: $font-size-small
        color: $color-text-l
        background: $color-highlight-background
    .loading-container
      position: absolute
      width: 100%
      top: 50%
      transform: translateY(-50%)
</style>
