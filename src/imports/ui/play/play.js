/* global Blob fetch */
import { check } from 'meteor/check'
import { Template } from 'meteor/templating'
import { ReactiveDict } from 'meteor/reactive-dict'
import FileSaver from 'file-saver'
import { Howl, Howler } from 'howler'
import { SoundCache } from '../../api/sounds/SoundCache'
import { Sounds } from '../../api/sounds/Sounds'
import { SoundFiles } from '../../api/sounds/SoundFiles'

import './play.css'
import './play.html'

import { callback, errorCallback, wrap } from '../helpers/callbacks'
import StreamLoader from '../../api/stream/StreamLoader'
import { segmentedPlayback } from '../helpers/segmentPlayback'

const updateInterval = 0.025
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
const audioBase = new Audio()
const hasMediaSource = 'MediaSource' in window

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
  instance.state.set('showSubversions', {})
  instance.state.set('selectedSubversion', {})

  instance.showSubversions = function showSubversions (fileId, value) {
    const obj = instance.state.get('showSubversions')
    if(typeof value !== 'undefined') {
      obj[fileId] = value
      instance.state.set('showSubversions', obj)
    }
    return obj[fileId]
  }

  instance.selectedSubversion = function selectedSubversion (fileId, version) {
    const obj = instance.state.get('selectedSubversion')
    if(typeof version !== 'undefined') {
      obj[fileId] = version
      instance.state.set('selectedSubversion', obj)
    }
    return obj[fileId]
  }

  instance.play = function play (fileId) {
    if (howls[fileId]) {
      howls[fileId].play()
    } else {
      const file = SoundFiles.findOne(fileId)
      const version = instance.selectedSubversion(fileId)
      const link = file.link(version)
      const sound = instance.load(fileId, link)
      sound.play()
    }
    instance.state.set('currentFile', fileId)
  }

  instance.seek = function (perc) {
    const cue = instance.state.get('cue')
    const current = instance.state.get('currentFile')
    const sound = howls[current]
    const duration = sound.duration()
    const progress = duration * perc

    // start updating
    sound.seek(progress)
    instance.state.set('cue', progress)
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
    if (sound) {
      sound.stop()
    }
  }

  instance.clear = function clear (fileId) {
    instance.state.set('currentFile', null)
    instance.state.set('currentVersion', null)
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

  instance.load = function load (fileId, url, extensions) {
    instance.loadState(fileId, {loading: true})
    console.log('load', fileId, url)
    const sound = new Howl({
      src: [url],
      html5: true,
      preload: true,
      format: extensions,
      onload: function () {
        console.log('onload', fileId)
        instance.loadState(fileId, {loading: false, loaded: true})
      },
      onloaderror (soundId, err) {
        console.log("url:", url)
        errorCallback(new Error(err))
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
      onplayerror (soundId, err) {
        errorCallback(new Error(err))
      },
      onpause: function () {
        timer.clear()
        instance.state.set('playing', false)
      }
    })

    howls[fileId] = sound
    console.log(sound)
    return sound
  }

  instance.cache = function cache (fileId, onComplete) {
    const file = SoundFiles.findOne(fileId)
    const link = file.link()
    const fileType = file.type

    instance.loadState(fileId, {caching: true})

    const loader = new StreamLoader(link, {step: 4096})
    loader.on(StreamLoader.event.response, function (result) {
      const progress = (result.range[1] / file.size) * 100
      instance.loadState(fileId, {cacheProgress: Math.round(progress)})
    })
    loader.once(StreamLoader.event.complete, function (result) {
      instance.loadState(fileId, {caching: false, cached: true})
      const resource = new Blob([...Object.values(result)], {type: fileType})
      SoundCache.save(fileId, resource, function (...args) {
        console.log('saved to cache')
      })
      if (typeof onComplete === 'function') {
        onComplete(resource)
      }
    })
    loader.load()
  }

  // initial clearing to setup variables
  instance.clear()


  instance.autorun(() => {
    if (Sounds.subscription && Sounds.subscription.ready()) {
      console.log(SoundFiles.find().fetch())
      if (SoundCache.size > 0) {
        Sounds.collection.find().fetch().forEach(doc => {
          const {fileId} = doc
          const file = SoundFiles.findOne(fileId)
          SoundCache.load(fileId, (resource) => {
            if (resource && !howls[fileId]) {
              console.log('resource', resource)
              instance.load(fileId, global.URL.createObjectURL(resource), [file.ext])
              instance.loadState(fileId, {cached: true})
            }
          }, (err) => {
            errorCallback(err)
          })
        })
      }
      instance.state.set('subsComplete', true)
    }
  })

  instance.state.set('instanceComplete', true)
})

// Meteor.connection._stream.on('message', console.log.bind(console))

Template.play.onDestroyed(function () {
  timer.clear()
})

Template.play.helpers({
  templateReady () {
    const subsComplete = Template.instance().state.get('subsComplete')
    const instanceComplete = Template.instance().state.get('instanceComplete')
    console.log("ready", subsComplete && instanceComplete)
    return subsComplete && instanceComplete
  },
  sounds () {
    const cursor = Sounds.collection.find()
    if (cursor && cursor.count() > 0) {
      return cursor
    } else {
      return null
    }
  },
  supportedType(type) {
    return audioBase.canPlayType(type)
  },
  streamSupport (type, codec) {
    const mimeCodec = `${type}; codecs="${codec}"`
    return hasMediaSource && MediaSource.isTypeSupported(mimeCodec)
  },
  getFile (fileId) {
    check(fileId, String)
    return SoundFiles.findOne(fileId)
  },
  noEnding(name, ext) {
    return name.replace(`.${ext}`, '')
  },
  isPlaying (fileId) {
    check(fileId, String)
    const current = Template.instance().state.get('currentFile')
    if (current !== fileId) return false
    return Template.instance().state.get('playing')
  },
  caching (fileId) {
    check(fileId, String)
    const state = Template.instance().loadState(fileId)
    return state && state.caching
  },
  isCached (fileId) {
    check(fileId, String)
    const state = Template.instance().loadState(fileId)
    return state && state.cached
  },
  cacheProgress (fileId) {
    check(fileId, String)
    const state = Template.instance().loadState(fileId)
    return (state && state.cacheProgress) || 0
  },
  loading (fileId) {
    check(fileId, String)
    const state = Template.instance().loadState(fileId)
    return state && state.loading
  },
  loaded (fileId) {
    const state = Template.instance().loadState(fileId)
    return state && state.loaded
  },
  loadSubversion (fileId, version) {
    const state = Template.instance().loadState(fileId)
    const selectedSubversion = Template.instance().selectedSubversion(fileId)
    return state && state.loaded && selectedSubversion === version
  },
  current () {
    return Template.instance().state.get('currentFile')
  },
  getSound (fileId) {
    check(fileId, String)
    return howls[fileId]
  },
  subversions (file) {
    const {versions} = file
    const _showSubversions = Template.instance().state.get('showSubversions')[file._id]
    if (!_showSubversions) return null

    return Object.values(versions)
  },
  showSubversions (fileId) {
    return Template.instance().showSubversions(fileId)
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
    return Template.instance().state.get('currentFile') === fileId
  }
})

Template.play.events({
  'click .play-button' (event, tInstance) {
    event.preventDefault()
    const fileId = tInstance.$(event.currentTarget).data('target')
    const current = tInstance.state.get('currentFile')

    if (current && fileId !== current) {
      tInstance.stop(current)
      tInstance.clear()
    }

    if (!tInstance.selectedSubversion(fileId)) {
      // determine which subversion is supported
      // and has the smallest size
      const file = SoundFiles.findOne(fileId)
      const version = Object.keys(file.versions)
        .sort((a, b) => {
          const versionA = file.versions[a]
          const versionB = file.versions[b]
          return versionA.size - versionB.size
        })
        .find(versionName => audioBase.canPlayType(file.versions[versionName].type))
      tInstance.selectedSubversion(fileId, version)
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
  'click .load-button' (event, tInstance) {
    event.preventDefault()
    const target = tInstance.$(event.currentTarget)
    const fileId = target.data('target')
    const version = target.data('version')
    const file = SoundFiles.findOne(fileId)
    tInstance.stop(fileId)
    tInstance.selectedSubversion(fileId, version)
    tInstance.load(fileId, file.link(version))
  },
  'click .cache-button' (event, tInstance) {
    event.preventDefault()
    const fileId = tInstance.$(event.currentTarget).data('target')
    tInstance.cache(fileId)
  },
  'click .download-button' (event, tInstance) {
    event.preventDefault()
    const fileId = tInstance.$(event.currentTarget).data('target')
    const fileState = tInstance.loadState(fileId)
    const file = SoundFiles.findOne(fileId)

    const saveResource = (resource) => {
      const downloadUrl = global.URL.createObjectURL(resource)
      FileSaver.saveAs(downloadUrl, file.name)
    }

    if (fileState && fileState.cached) {
      SoundCache.load(fileId, (err, res) => {
        if (err) {
          errorCallback(err)
          return
        }
        saveResource(res)
      })
    } else {
      const file = SoundFiles.findOne(fileId)
      tInstance.cache(fileId, saveResource)
    }
  },
  'click .pause-button' (event, tInstance) {
    event.preventDefault()
    const fileId = tInstance.$(event.currentTarget).data('target')
    tInstance.pause(fileId)
  },

  'click .progress-active' (event, tInstance) {
    event.preventDefault()
    const target = event.currentTarget
    const perc = (event.offsetX / target.clientWidth)
    tInstance.seek(perc)
  },
  'click .toggle-subversionsbutton'(event, tInstance) {
    event.preventDefault()
    const fileId = tInstance.$(event.currentTarget).data('target')
    const showSubversions = !!(tInstance.showSubversions(fileId))
    tInstance.showSubversions(fileId, !showSubversions)
  },
  'click .stream-button' (event, tInstance) {
    event.preventDefault()

    const fileId = tInstance.$(event.currentTarget).data('target')
    const file = SoundFiles.findOne(fileId)
    const versionNames = Object.keys(file.versions)
    let target, targetCodec

    for (const version of versionNames) {
      const subversion = file.versions[version]
      const mimeCodec = `${subversion.type}; codecs="${subversion.codec}"`
      if (MediaSource.isTypeSupported(mimeCodec)) {
        target = version
        targetCodec = mimeCodec
        break
      }
    }

    if (!targetCodec) {
      errorCallback('No codec suported to be streamed')
      return
    }

    const assetURL = file.link(target)
    const audio = new Audio()
    segmentedPlayback(audio, assetURL, targetCodec)
    $('body').append(audio)
  }
})
