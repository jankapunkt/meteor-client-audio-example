const StreamLoaderEvent = {
  response: 'response',
  complete: 'complete',
  error: 'error'
}

function emit (instance, name, data) {
  const {_on} = instance
  const {_once} = instance
  if (_on[name]) {
    _on[name].forEach(fct => {
      setTimeout(fct.call(instance, data), 0)
    })
  }
  if (_once[name]) {
    _once[name].forEach(fct => {
      setTimeout(fct.call(instance, data), 0)
    })
    delete instance.once[name]
  }
}

export default class StreamLoader {

  static get event () {
    return StreamLoaderEvent
  }

  constructor (url, options) {
    const opts = options || {}
    this.url = url
    this.buffers = {}
    this.start = opts.start || 0
    this.step = opts.step || 2048
    this.end = opts.end || (this.start + this.step - 1)
    this._on = {}
    this._once = {}
  }

  range () {
    const self = this
    return [self.start, self.end]
  }

  on (name, fct) {
    const self = this
    if (self._on[name]) {
      self._on[name].push(fct)
    } else {
      self._on[name] = [fct]
    }
  }

  once (name, fct) {
    const self = this
    if (self._once[name]) {
      self._once[name].push(fct)
    } else {
      self._once[name] = [fct]
    }
  }

  off (name, fct) {
    const self = this
    const all = self._on[name]
    if (all) {
      if (!fct) {
        // search for fct
        for (let i = all.length - 1; i >= 0; i--) {
          // we check by reference
          const listenerFct = all[i]
          if (listenerFct === fct) {
            delete all[i]
          }
        }
      } else {
        // delete all if no fct is given
        delete self._on[name]
      }
    }
  }

  load () {
    const xhr = new global.XMLHttpRequest()
    const self = this
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) {
        return
      }

      const {response} = xhr
      const {responseType} = xhr

      if (!response || xhr.response.byteLength === 0) {
        emit(self, StreamLoaderEvent.complete, self.buffers)
        return
      }

      // response
      emit(self, StreamLoaderEvent.response, {response, responseType, range: self.range()})

      // cache and re-load
      self.buffers[self.start] = xhr.response
      self.start = (self.start + 1 + self.step - 1)
      self.end = (self.end + 1 + self.step - 1)
      self.load()
    }

    xhr.onerror = function (event) {
      emit(self, StreamLoaderEvent.error, event.error)
    }

    xhr.open('GET', self.url, true)
    xhr.responseType = 'arraybuffer'
    xhr.setRequestHeader('Range', `bytes=${self.start}-${self.end}`) // the bytes (incl.) you request
    try {
      xhr.send(null)
    } catch (e) {
      emit(self, StreamLoaderEvent.error, e)
    }
  }
}