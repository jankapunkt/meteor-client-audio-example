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
  progress () {
    return 50
  },
})

Template.stream.events({
  'click .play-button' (event, tInstance) {
    event.preventDefault()
    const fileId = tInstance.$(event.currentTarget).data('target')
    const current = tInstance.state.get('current')
    if (fileId === current) {
      return
    }

    const link = tInstance.$(event.currentTarget).data('link')

    if (howls[fileId]) {
      howls[fileId].play()
    } else {
      const sound = new Howl({
        src: [link],
        //html5: true,
        onload: function () {
          console.log('onload', this)
        },
        onend: function() {
          console.log('Ended');
        },
        onplay: function() {
          console.log('Playing');
        },
        onpause: function() {
          console.log('Paused');
        }
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