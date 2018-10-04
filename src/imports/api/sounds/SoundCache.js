import localforage from 'localforage'

export const SoundCache = {}
SoundCache.init = function () {
  localforage.config({
    name: 'Sound Cache',
    description: 'cached sound data, obtained by gridFs Stream'
  })
}