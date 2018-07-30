import {playMode} from 'common/js/config'

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

}

export default state
