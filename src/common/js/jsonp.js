import originJsonp from 'jsonp'
// url不带参数，data为参数对象，option为query条件
export default function jsonp(url, data, option) {
  url += (url.indexOf('?') < 0 ? '?' : '&') + param(data)

  return new Promise((resolve, reject) => {
    // 整个为promise嵌套使用，原始jsonp方法，第二个参数为query条件，第三个参数为回调，其中第一个参数为错误，第二个为返回数据
    originJsonp(url, option, (err, data) => {
      if (!err) {
        resolve(data)
      } else {
        reject(err)
      }
    })
  })
}
// data解构拼成url
export function param(data) {
  let url = ''
  for (var k in data) {
    let value = data[k] !== undefined ? data[k] : ''
    url += '&' + k + '=' + encodeURIComponent(value)
  }
  return url ? url.substring(1) : ''
  // 如果url非空，去掉第一个&
}
