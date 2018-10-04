import localforage from 'localforage'

export const SoundCache = {}
SoundCache.init = function () {
  localforage.config({
    name: 'Sound Cache',
    description: 'cached sound data, obtained by gridFs Stream'
  })

  console.log('init cache')

  // The same code, but using ES6 Promises.
  localforage.iterate(function (value, key, iterationNumber) {
    // Resulting key/value pair -- this callback
    // will be executed for every item in the
    // database.
    console.log([key, value])
  }).then(function () {
    console.log('Iteration has completed')
  }).catch(function (err) {
    // This code runs if there were any errors
    console.log(err)
  })
}

SoundCache.save = function (key, value, callback) {
  localforage.setItem(key, value)
  .then(res => callback(null, res))
  .catch(er => callback(er, null))
}

SoundCache.load = function (key, callback) {
  localforage.getItem(key)
  .then(res => callback(null, res))
  .catch(er => callback(er, null))
}
