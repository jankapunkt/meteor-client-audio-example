import '../../imports/ui/helpers/templateHelpers'
import '../../imports/api/sounds/client/subscriptions'

import { Meteor } from 'meteor/meteor'
import { SoundCache } from '../../imports/api/sounds/SoundCache'
import { Sounds } from '../../imports/api/sounds/Sounds'

Meteor.startup(() => {
  SoundCache.init()

  let context
  window.addEventListener('load', init, false)

  function init () {
    try {
      // Fix up for prefixing
      window.AudioContext = window.AudioContext || window.webkitAudioContext
      context = new AudioContext()
      Sounds.usingWebAudio = true
    }
    catch (e) {
      alert('Web Audio API is not supported in this browser')
    }
  }
})