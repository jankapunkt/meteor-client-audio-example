import localforage from 'localforage'

export const SoundCache = {}
SoundCache.init = function () {
  localforage.config({
    name: 'Sound Cache',
    description: 'cached sound data, obtained by gridFs Stream'
  })

  localforage.length().then(res => {
    SoundCache.size = res
  })
}

SoundCache.save = function (key, value, callback) {
  localforage.setItem(key, value).then(res => SoundCache.size ++ && callback(null, res)).catch(er => callback(er, null))
}

SoundCache.load = function (key, onRes, onErr) {
  console.log(key)
  localforage.getItem(key).then(res => onRes(res)).catch(err => onErr(err))
}

SoundCache.getAll = function getAll (onRes, onErr) {
  // The same code, but using ES6 Promises.
  let all =[]
  localforage.iterate(function (value, key, iterationNumber) {
    // Resulting key/value pair -- this callback
    // will be executed for every item in the
    // database.
    all.push([key, value])
  }).then(() => onRes(all)).catch(err => onErr())
}
