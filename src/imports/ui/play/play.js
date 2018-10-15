/* global Blob fetch */
import { Template } from 'meteor/templating'
import { ReactiveDict } from 'meteor/reactive-dict'
import { Howl, Howler } from '../../api/howler/client/howler'

import { SoundCache } from '../../api/sounds/SoundCache'
import { Sounds } from '../../api/sounds/Sounds'
import { SoundFiles } from '../../api/sounds/SoundFiles'

import './play.html'

import { callback, errorCallback } from '../helpers/callbacks'
import StreamLoader from '../../api/stream/StreamLoader'
import { getAudioData } from '../../api/stream/BufferStream'

const howls = {}

Template.play.onCreated(function onPlayCreated () {
  const instance = this
  instance.state = new ReactiveDict()
  instance.state.set('current', null)
  instance.state.set('cue', 0)

})

// Meteor.connection._stream.on('message', console.log.bind(console))

Template.play.helpers({
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
  loaded () {
    return Template.instance().state.get('loaded')
  },
  progress (sound) {
    const cue = Template.instance().state.get('cue')
    return cue ? (cue / sound._duration) * 100 : 0
  }
})

let timerId

Template.play.events({
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


/*


    // Creates an AudioContext and AudioContextBuffer
    var audioCtx = new AudioContext();
    var startTime = 0;
    const loader = new StreamLoader(link, {step: audioCtx.sampleRate/2})
    loader.on(StreamLoader.event.response, (audioChunk) => {
      // Create/set audio buffer for each chunk
      var audioBuffer = audioCtx.createBuffer(2, audioCtx.sampleRate/2, audioCtx.sampleRate);
      audioBuffer.getChannelData(0).set(audioChunk);

      var source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start(0)
      startTime += audioBuffer.duration;
    })

    loader.once(StreamLoader.event.complete, (data) => {
      console.log('complete', data)
      const blob = new Blob(Object.values(data), {type: fileType})
      console.log(blob)
      const objectURL = URL.createObjectURL(blob)
      console.log(objectURL)
    })
    loader.load()

    fetch(link).then((response) => {
      console.log(response)
      const reader = response.body.getReader();
      const stream = new ReadableStream({
        start(controller) {
          // The following function handles each data chunk
          function push() {
            // "done" is a Boolean and value a "Uint8Array"
            reader.read().then(({ done, value }) => {
              // Is there no more data to read?
              if (done) {
                // Tell the browser that we have finished sending data
                controller.close();
                return;
              }

              // Get the data and send it to the browser via the controller
              controller.enqueue(value);
              push();
            });
          };

          push();
        }
      });

      return new Response(stream, { headers: { "Content-Type": "text/html" } });
    });


*/




    SoundCache.load(fileId, (err, res, type) => {
      if (err) errorCallback(err)
      if (res) {
        console.log('file exists', type, res.byteLength)
      }
    })

    /*
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
    })*/

    /*
    function getAllEvents(element) {
      var result = [];
      for (var key in element) {
        if (key.indexOf('on') === 0) {
          result.push(key.slice(2));
        }
      }
      return result.join(' ');
    }



    var el = $(sound);
    el.bind(getAllEvents(el[0]), function(e) {
      console.log(e.type)
    });

*/

    tInstance.state.set('current',fileId)
    //howls[fileId] = sound



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