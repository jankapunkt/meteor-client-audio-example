/* global Blob fetch */
import { Template } from 'meteor/templating'
import { ReactiveDict } from 'meteor/reactive-dict'
import { Howl, Howler } from '../../api/howler/client/howler'

import { SoundCache } from '../../api/sounds/SoundCache'
import { Sounds } from '../../api/sounds/Sounds'
import { SoundFiles } from '../../api/sounds/SoundFiles'

import './stream.html'
import { callback, errorCallback } from '../helpers/callbacks'
import StreamLoader from '../../api/stream/StreamLoader'

const howls = {}

Template.stream.onCreated(function onStreamCreated () {
  const instance = this
  instance.state = new ReactiveDict()
  instance.state.set('current', null)
  instance.state.set('cue', 0)

})

Template.stream.helpers({
  sounds () {
    return Sounds.collection.find()
  },
  getFile (fileId) {
    return SoundFiles.findOne(fileId)
  },
  isPlaying (fileId) {
    return Template.instance().state.get('current') === fileId
  },
  isCached () {
    return false
  },
  current () {
    return Template.instance().state.get('current')
  },
  getSound (fileId) {
    return howls[fileId]
  },
  progress (sound) {
    const cue = Template.instance().state.get('cue')
    return (cue / sound._duration) * 100
  },
  loaded () {
    return Template.instance().state.get('loaded')
  }
})

let timerId

Template.stream.events({
  'click .play-button' (event, tInstance) {
    event.preventDefault()

    const fileId = tInstance.$(event.currentTarget).data('target')
    const current = tInstance.state.get('current')
    if (fileId === current) {
      return
    }

    const fileType = tInstance.$(event.currentTarget).data('type')
    const link = tInstance.$(event.currentTarget).data('link')

    tInstance.state.set('cue', 0)
    window.clearInterval(timerId)

    if (howls[fileId]) {
      tInstance.state.set('current', fileId)
      howls[fileId].play()
      return
    }

    tInstance.state.set('loaded', false)

    const audioContext = new AudioContext()
    const loader = new StreamLoader(link)

    // Creates an AudioContext and AudioContextBuffer
    loader.on(StreamLoader.event.response, (data) => {
      console.log(data.response.byteLength)
      const floats = new Float32Array(data.response)
      const audioBuffer = audioContext.createBuffer(1, 2048, 4410)
      audioBuffer.getChannelData(0).set(floats)
      const sourceNode = new AudioBufferSourceNode(audioContext, {buffer: audioBuffer})
      sourceNode.connect(audioContext.destination)
      sourceNode.start(0)
    })

    loader.once(StreamLoader.event.complete, (data) => {
      console.log('complete', data)
      const blob = new Blob(Object.values(data), {type: fileType})
      console.log(blob)
      //const objectURL = URL.createObjectURL(blob)
      //console.log(objectURL)
    })
    loader.load()
    return

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
        tInstance.state.set('loaded', true)

        // HTMLAudioElement -> event canplaythrough is used
        // to know when the data is completely buffered
        // at this point we want to get the buffer to save
        // it to our internal cache
        const node = sound._sounds[0]._node
        $(node).on('canplaythrough', function (e) {
          const buffer = sound._getBuffer()
          console.log(buffer)
        })
      },
      onend: function () {
        window.clearInterval(timerId)
        tInstance.state.set('current', null)
        const self = this
        console.log('ended', self)
        return
      },
      onstop: function () {
        window.clearInterval(timerId)
        tInstance.state.set('current', null)
      },
      onplay: function () {
        timerId = window.setInterval(() => {
          const cue = tInstance.state.get('cue')
          tInstance.state.set('cue', cue + 1)
        }, 1000)
      },
      onpause: function () {
        // console.log('Paused')
      },
    })
    tInstance.state.set('current', fileId)
    howls[fileId] = sound
    sound.play()

  },
  'click .delete-button' (event, tInstance) {
    event.preventDefault()
    const fileId = tInstance.$(event.currentTarget).data('target')
    alert('not yet implemented')
  },
  'click .stop-button' (event, tInstance) {
    event.preventDefault()
    const fileId = tInstance.$(event.currentTarget).data('target')
    howls[fileId].stop()
    tInstance.state.set('current', null)
  },

  'click .download-button' (event, tInstance) {
    event.preventDefault()
    fetch(self._src)
    .then(response => {
      response.arrayBuffer().then(function (buffer) {
        // do something with buffer
        SoundCache.save(fileId, new Blob([buffer], {type: fileType}), callback)
      })
    })
    .catch(e => console.error(e))
  }
})

/*


 */