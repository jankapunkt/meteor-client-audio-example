import { Template } from 'meteor/templating'
import { ReactiveDict } from 'meteor/reactive-dict'
import { Howl, Howler } from 'howler'

import { Sounds } from '../../api/sounds/Sounds'
import { SoundFiles } from '../../api/sounds/SoundFiles'

import './stream.html'

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
    console.log(fileId, Template.instance().state.get('current'))
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

    const link = tInstance.$(event.currentTarget).data('link')

    tInstance.state.set('cue', 0)
    window.clearInterval(timerId)

    if (howls[fileId]) {
      howls[fileId].play()
    } else {
      const sound = new Howl({
        src: [link],
        //html5: true,
        onload: function () {
          console.log('onload', this)
        },
        onend: function () {
          console.log('Ended')
          window.clearInterval(timerId)
        },
        onstop: function () {
          window.clearInterval(timerId)
        },
        onplay: function () {
          timerId = window.setInterval(() => {
            const cue = tInstance.state.get('cue')
            tInstance.state.set('cue', cue + 1)
          }, 1000)
        },
        onpause: function () {
          console.log('Paused')
        },
      })
      console.log(sound)
      howls[fileId] = sound
      sound.play()
    }

    tInstance.state.set('current', fileId)
  },
  'click .delete-button' (event, tInstance) {
    event.preventDefault()
    const fileId = tInstance.$(event.currentTarget).data('target')
    allert('not yet implemented')
  },
  'click .stop-button' (event, tInstance) {
    event.preventDefault()
    const fileId = tInstance.$(event.currentTarget).data('target')
    howls[fileId].stop()
    tInstance.state.set('current', null)
  }
})