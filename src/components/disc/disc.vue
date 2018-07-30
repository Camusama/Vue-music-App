<template>
  <transition name="slide">
    <music-list :title="title" :bg-image="bgImage" :songs="songs"></music-list>
  </transition>
</template>

<script type="text/ecmascript-6">
  import MusicList from 'components/music-list/music-list'
  import {getSongList} from 'api/recommend'
  import {ERR_OK} from 'api/config'
  import {mapGetters} from 'vuex'
  import {createSong} from 'common/js/song'
  import {getMusic} from "../../api/getMusic";


  export default {
    computed: {
      title() {
        return this.disc.dissname
      },
      bgImage() {
        return this.disc.imgurl
      },
      ...mapGetters([
        'disc'
      ])
    },
    data() {
      return {
        songs: []
      }
    },
    created() {
      this._getSongList()
    },
    methods: {
      _getSongList() {
        // 如果没有歌单id，则回退
        if (!this.disc.dissid) {
          this.$router.push('/recommend')
          return
        }
        // 请求歌单
        getSongList(this.disc.dissid).then((res) => {
          if (res.code === ERR_OK) {
            this.songs = this._normalizeSongs(res.cdlist[0].songlist)
          }
        })
      },
      // 歌单数据结构处理
      _normalizeSongs(list) {
        let ret = []
        // console.log(list)
        list.forEach((item) => {
          if (item.songmid && item.albummid) {
            // 找到songvkey，传入才可获取音乐地址
            getMusic(item.songmid).then((res)=>{
              if(res.code === ERR_OK){
                const svkey=res.data.items
                const songVkey= svkey[0].vkey
                const newSong =createSong(item,songVkey)
                // console.log(newSong)
                ret.push(newSong)
              }
            })

          }
          // console.log(ret)
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
    transition: all 0.3s

  .slide-enter, .slide-leave-to
    transform: translate3d(100%, 0, 0)
</style>
