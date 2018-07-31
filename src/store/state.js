import {playMode} from 'common/js/config'
import {loadSearch, loadPlay, loadFavorite} from 'common/js/cache'

const state={
  singer:{},
  playing: false,
  fullScreen: false,
  // 播放列表
  playlist: [],
  // 播放模式列表
  sequenceList: [],
  // 播放模式
  mode: playMode.sequence,
  // 当前播放在playlist里的索引值
  currentIndex: -1,
  // 歌单
  disc: {},
  // 排行榜
  topList: {},
  // 搜索历史
  searchHistory: loadSearch(),
  // 播放历史
  playHistory: loadPlay(),
  // 收藏列表
  favoriteList: loadFavorite()
}

export default state
