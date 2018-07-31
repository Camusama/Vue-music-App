<template>
  <transition name="slide">
    <music-list :rank="rank" :title="title" :bg-image="bgImage" :songs="songs"></music-list>
  </transition>
</template>

<script type="text/ecmascript-6">
  import MusicList from 'components/music-list/music-list'
  import {getMusicList} from 'api/rank'
  import {ERR_OK} from 'api/config'
  import {mapGetters} from 'vuex'
  import {createSong} from 'common/js/song'
  import {getMusic} from "api/getMusic";


  export default {
    computed: {
      // 排行榜标题图
      title() {
        return this.topList.topTitle
      },
      // 排行榜背景图，取的第一首歌背景图
      bgImage() {
        if (this.songs.length) {
          return this.songs[0].image
        }
        return ''
      },
      ...mapGetters([
        'topList'
      ])
    },
    data() {
      return {
        songs: [],
        rank: true
      }
    },
    created() {
      this._getMusicList()
    },
    methods: {
      _getMusicList() {
        // 如果没有排行榜id，则回退
        if (!this.topList.id) {
          this.$router.push('/rank')
          return
        }
        // 获取播放列表
        getMusicList(this.topList.id).then((res) => {
          if (res.code === ERR_OK) {
            // console.log(res)
            this.songs = this._normalizeSongs(res.songlist)
            // console.log(this.songs)
          }
        })
      },
      _normalizeSongs(list) {
        let ret = []
        list.forEach((item) => {
          const musicData = item.data
          if (musicData.songmid && musicData.albummid) {
            getMusic(musicData.songmid).then((res)=>{
              if(res.code === ERR_OK){
                const svkey=res.data.items
                const songVkey= svkey[0].vkey
                const newSong =createSong(musicData,songVkey)
                // console.log(newSong)
                ret.push(newSong)
              }
            })
          }
        })
        return ret
      }
    },
    components: {
      MusicList
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  .slide-enter-active, .slide-leave-active
    transition: all 0.3s ease

  .slide-enter, .slide-leave-to
    transform: translate3d(100%, 0, 0)
</style>
