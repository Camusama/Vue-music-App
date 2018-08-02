<template>
  <scroll ref="suggest"
          class="suggest"
          :data="result"
          :pullup="pullup"
          :beforeScroll="beforeScroll"
          @scrollToEnd="searchMore"
          @beforeScroll="listScroll"
  >
    <ul class="suggest-list">
      <li @click="selectItem(item)" class="suggest-item" v-for="item in result">
        <div class="icon">
          <i :class="getIconCls(item)"></i>
        </div>
        <div class="name">
          <p class="text" v-html="getDisplayName(item)"></p>
        </div>
      </li>
      <loading v-show="hasMore" title=""></loading>
    </ul>
    <div v-show="!hasMore && !result.length" class="no-result-wrapper">
      <no-result title="抱歉，暂无搜索结果"></no-result>
    </div>
  </scroll>
</template>

<script type="text/ecmascript-6">
  import Scroll from 'base/scroll/scroll'
  import Loading from 'base/loading/loading'
  import NoResult from 'base/no-result/no-result'
  import {search} from 'api/search'
  import {ERR_OK} from 'api/config'
  import {createSong} from 'common/js/song'
  import {mapMutations, mapActions} from 'vuex'
  import Singer from 'common/js/singer'
  import {getMusic} from "api/getMusic";


  const TYPE_SINGER = 'singer'
  const perpage = 20

  export default {
    props: {
      // 对应检索条件里zhida,是否显示歌手
      showSinger: {
        type: Boolean,
        default: true
      },
      // 接受检索词
      query: {
        type: String,
        default: ''
      }
    },
    data() {
      return {
        // 查询结果的分页
        page: 1,
        // 传入scroll开启下拉加载，和初始化功能
        pullup: true,
        beforeScroll: true,
        // 下拉加载更多结果
        hasMore: true,
        // 搜索结果
        result: [],
        // 查找歌手信息
        singerFLag:true
      }
    },
    methods: {
      // query改变则刷新
      refresh() {
        this.$refs.suggest.refresh()
      },
      // 搜索传参，
      search() {
        this.page = 1
        this.hasMore = true
        //第一次检索时 跳转到scroll头
        this.$refs.suggest.scrollTo(0, 0)
        if(this.query === ""){
          this.singerFLag = true
        }
        search(this.query, this.page, this.showSinger, perpage).then((res) => {
          if (res.code === ERR_OK) {
            console.log("1",res.data)
            this.result = this._genResult(res.data)
            // console.log("34",this.result)
            this._checkMore(res.data)
          }
        })
      },
      // @scrolltoEnd时加载。触发检索页数改变
      searchMore() {
        if (!this.hasMore) {
          return
        }
        // 检索条件的页数++
        this.page++
        search(this.query, this.page, this.showSinger, perpage).then((res) => {
          if (res.code === ERR_OK) {
            // 拼接结果
            let temp = this.result
            this.result = this._genResult(res.data)
            console.log("temp",temp)
            this.result.splice(0,0,...temp)
            console.log("more",this.result)
            this._checkMore(res.data)
          }
          // 此处同下_genResult,由于对歌曲链接的修正需要调用_normalizeSongs里getMusic的异步，
          // 生成的新歌单永远会在concat操作之后执行，
          // 因此必须用组件内的数据 如this.result调用此异步方法，保证其执行完后再进行操作
          // if (res.code === ERR_OK) {
          //   this.result = this.result.concat(this._genResult(res.data))
          //   this._checkMore(res.data)
          // }
        })
      },
      // @beforeScroll时触发，模糊input框
      listScroll() {
        this.$emit('listScroll')
      },
      selectItem(item) {
        // 如果选中的类型是歌手,直接跳到歌手列表
        if (item.type === TYPE_SINGER) {
          const singer = new Singer({
            id: item.singermid,
            name: item.singername
          })
          this.$router.push({
            path: `/search/${singer.id}`
          })
          this.setSinger(singer)
        } else {
          // 否则直接将歌曲插入播放列表
          this.insertSong(item)
        }
        // 对应search.vue里saveSearch => actions里saveSearchHistory => cache里将检索加入localstorage
        this.$emit('select', item)
      },
      // li项title，如果是歌手则只有名，如果是歌则为歌+歌手名
      getDisplayName(item) {
        if (item.type === TYPE_SINGER) {
          return item.singername
        } else {
          return `${item.name}-${item.singer}`
        }
      },
      // 列表行头图标控制
      getIconCls(item) {
        if (item.type === TYPE_SINGER) {
          return 'icon-mine'
        } else {
          return 'icon-music'
        }
      },
      // 对结果处理

      _genResult(data) {
        //对歌曲数据作对象处理
        // 如果检索条件里包含歌手,歌手在数组头
        let ret =[]
        if (data.song) {
          ret = this._normalizeSongs(data.song.list)
        }
        if (data.zhida && data.zhida.singermid && this.singerFLag) {
          ret.splice(0,0,{...data.zhida, ...{type: TYPE_SINGER}})
          this.singerFLag=false
        }
        console.log(".1.",ret)
        // this._fixResult(data,ret)
        // console.log(".2.",ret)
        return ret
      },
      _normalizeSongs(list) {
        let ret = []
        list.forEach((musicData) => {
          if (musicData.songid && musicData.albummid) {
            getMusic(musicData.songmid).then((res)=>{
              if(res.code === ERR_OK){
                let svkey=res.data.items
                let songVkey= svkey[0].vkey
                let newSong =createSong(musicData,songVkey)
                // console.log(newSong)
                ret.push(newSong)
                console.log("6",ret)
              }
            })
          }
        })
        return ret
      },

      _checkMore(data) {
        const song = data.song
        // 当前歌单总长度大于检索来的总个数时
        if (!song.list.length || (song.curnum + song.curpage * perpage) > song.totalnum) {
          this.hasMore = false
        }
      },
      ...mapMutations({
        setSinger: 'SET_SINGER'
      }),
      ...mapActions([
        'insertSong'
      ])
    },
    watch: {
      // 每当query变化就请求接口
      query(newQuery) {
        this.search(newQuery)
      }
    },
    components: {
      Scroll,
      Loading,
      NoResult
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"

  .suggest
    height: 100%
    overflow: hidden
    .suggest-list
      padding: 0 30px
      .suggest-item
        display: flex
        align-items: center
        padding-bottom: 20px
      .icon
        flex: 0 0 30px
        width: 30px
        [class^="icon-"]
          font-size: 14px
          color: $color-text-d
      .name
        flex: 1
        font-size: $font-size-medium
        color: $color-text-d
        overflow: hidden
        .text
          no-wrap()
    .no-result-wrapper
      position: absolute
      width: 100%
      top: 50%
      transform: translateY(-50%)
</style>
