/* global Blob fetch */
import {check} from 'meteor/check'
import { Template } from 'meteor/templating'
import { ReactiveDict } from 'meteor/reactive-dict'
import { Howl, Howler } from '../../api/howler/client/howler'

import { SoundCache } from '../../api/sounds/SoundCache'
import { Sounds } from '../../api/sounds/Sounds'
import { SoundFiles } from '../../api/sounds/SoundFiles'

import './play.css'
import './play.html'

import { callback, errorCallback, wrap } from '../helpers/callbacks'
import StreamLoader from '../../api/stream/StreamLoader'

const updateInterval = 0.125
const howls = {}
const timer = {
  timerId: null,
  start (fct, interval) {
    this.clear()
    this.timerId = window.setInterval(fct, interval)
  },
  clear () {
    if (this.timerId) {
      window.clearInterval(this.timerId)
    }
  }
}

const SoundStates = {
  loading: 'loading',
  loaded: 'loaded',
  caching: 'caching',
  cached: 'cached'
}

Template.play.onCreated(function onPlayCreated () {
  const instance = this
  instance.state = new ReactiveDict()
  instance.state.set('loadState', {})

  instance.play = function play (fileId) {
    (howls[fileId] || instance.load(fileId)).play()
    instance.state.set('current', fileId)
  }

  instance.pause = function pause (fileId) {
    const sound = howls[fileId]
    sound.pause()
  }

  instance.remove = function remove (fileId) {
    instance.stop(fileId)
    if (howls[fileId]) {
      delete howls[fileId]
    }
  }

  instance.stop = function stop (fileId) {
    const sound = howls[fileId]
    sound.stop()
  }

  instance.clear = function clear (fileId) {
    instance.state.set('current', null)
    instance.state.set('playing', false)
    instance.state.set('cue', 0)
    timer.clear()
  }


  instance.loadState = function (fileId, value) {
    const loadState = instance.state.get('loadState')
    const state = loadState[fileId]

    if (typeof value !== 'undefined') {
      loadState[fileId] = Object.assign({}, state || {}, value)
      instance.state.set('loadState', loadState)
    }
    return state
  }

  instance.load = function load (fileId) {
    instance.loadState(fileId, {loading: true})
    const file = SoundFiles.findOne(fileId)
    const fileType = file.type
    const link = file.link()

    SoundCache.load(fileId, (err, res, type) => {
      if (err) errorCallback(err)
      if (res) {
        console.log('file exists', type, res.byteLength)
      }
    })

    const sound = new Howl({
      src: [link],
      html5: true,
      preload: false,
      onload: function () {
        console.log('onload', fileId)
        instance.loadState(fileId, {loading: false, loaded: true})
      },
      onend: function () {
        timer.clear()
        instance.clear()
      },
      onstop: function () {
        timer.clear()
      },
      onplay: function () {
        instance.state.set('playing', true)
        timer.start(() => {
          const cue = instance.state.get('cue')
          instance.state.set('cue', cue + updateInterval)
        }, updateInterval * 1000)
      },
      onpause: function () {
        timer.clear()
        instance.state.set('playing', false)
      },
    })

    howls[fileId] = sound
    return sound
  }

  // initial clearing to setup variables
  instance.clear()
})

// Meteor.connection._stream.on('message', console.log.bind(console))

Template.play.onDestroyed(function () {
  timer.clear()
})

Template.play.helpers({
  sounds () {
    return Sounds.collection.find()
  },
  getFile (fileId) {
    check(fileId, String)
    return SoundFiles.findOne(fileId)
  },
  isPlaying (fileId) {
    check(fileId, String)
    const current = Template.instance().state.get('current')
    if (current !== fileId) return false
    return Template.instance().state.get('playing')
  },
  isCached () {
    return false
  },
  loaded (fileId) {
    check(fileId, String)
    const state = Template.instance().loadState(fileId)
    return state && state.loaded
  },
  current () {
    return Template.instance().state.get('current')
  },
  getSound (fileId) {
    check(fileId, String)
    return howls[fileId]
  },
  loading (fileId) {
    check(fileId, String)
    const state = Template.instance().loadState(fileId)
    return state && state.loading
  },
  progress (fileId) {
    const sound = howls[fileId]
    if (!sound) return 0
    const cue = Template.instance().state.get('cue')
    const progress = (cue / sound._duration) * 100
    return progress
  },
  isCurrent (fileId) {
    check(fileId, String)
    return Template.instance().state.get('current') === fileId
  }
})

Template.play.events({
  'click .play-button' (event, tInstance) {
    event.preventDefault()
    const fileId = tInstance.$(event.currentTarget).data('target')
    const current = tInstance.state.get('current')

    if (current && fileId !== current) {
      tInstance.stop(current)
      tInstance.clear()
    }

    tInstance.play(fileId)
  },
  'click .delete-button' (event, tInstance) {
    event.preventDefault()
    const fileId = tInstance.$(event.currentTarget).data('target')

    if (confirm('Delete sound completely?')) {
      tInstance.remove(fileId)
      SoundFiles.remove(fileId)
      Sounds.collection.remove({fileId})
    }
  },
  'click .stop-button' (event, tInstance) {
    event.preventDefault()
    const fileId = tInstance.$(event.currentTarget).data('target')
    tInstance.stop(fileId)
    tInstance.clear()
  },

  'click .download-button' (event, tInstance) {
    event.preventDefault()
    const fileId = tInstance.$(event.currentTarget).data('target')
    const file = SoundFiles.findOne(fileId)
    const link = file.link()

    tInstance.state.set('downloading', true)

    const loader = new StreamLoader(link, {step: 4096})
    loader.once(StreamLoader.event.complete, function (result) {
      tInstance.state.set('downloading', false)
    })
    loader.load()
  },
  'click .pause-button' (event, tInstance) {
    event.preventDefault()
    const fileId = tInstance.$(event.currentTarget).data('target')
    tInstance.pause(fileId)
  }
})