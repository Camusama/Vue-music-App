<template>
  <transition name="slide">
    <music-list :title="title" :bg-image="bgImage" :songs="songs"></music-list>
    <div class="div1"></div>
  </transition>
</template>

<script type="text/ecmascript-6">
  import MusicList from 'components/music-list/music-list'
  import {getSingerDetail} from 'api/singer'
  import {ERR_OK} from 'api/config'
  import {createSong} from 'common/js/song'
  import {mapGetters} from 'vuex'
  import {getMusic} from "../../api/getMusic";

  export default {
    components:{
      MusicList
    },
    computed: {
      ...mapGetters([
        'singer'
      ]),
      // 传入music-list
      title() {
        return this.singer.name
      },
      bgImage() {
        return this.singer.avatar
      }
    },
    data() {
      return {
        songs: []
      }
    },
    created() {
      this._getDetail()
    },
    methods: {
      _getDetail() {
        // 如果无id，回弹
        if (!this.singer.id) {
          this.$router.push('/singer')
          return
        }
        // 获取歌手歌曲数据
        getSingerDetail(this.singer.id).then((res) => {
          if (res.code === ERR_OK) {
            // console.log(res.data)
            this.songs = this._normalizeSongs(res.data.list)
          }
        })
      },
      _normalizeSongs(list) {
        let ret = []
        list.forEach((item) => {
          let {musicData} = item
          // 解构赋值等同于let musicData = item.musicData
          if (musicData.songid && musicData.albummid) {
            // 找到songvkey，传入才可获取音乐地址
            getMusic(musicData.songmid).then((res)=>{
              if(res.code === ERR_OK){
                const svkey=res.data.items
                const songVkey= svkey[0].vkey
                const newSong =createSong(musicData,songVkey)
                // console.log(newSong)
                ret.push(newSong)
              }
            })
            // createSong方法返回一个song类，包含一些默认值
            // ret.push(createSong(musicData))
          }
          // console.log(ret)
        })
        return ret
      }
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  .div1
    position:fixed;
    background-color :black;
    widh:100%;
    height :100%;
    z-index: 99
  .slide-enter-active, .slide-leave-active
    transition: all 0.3s

  .slide-enter, .slide-leave-to
    transform: translate3d(100%, 0, 0)
</style>
