/*
 * Copyright:  Nick Desaulniers
 * Website:    https://github.com/nickdesaulniers/netfix/blob/gh-pages/demo/bufferWhenNeeded.html
 */

export const segmentedPlayback = function (target, assetURL, mimeCodec) {
  let totalSegments = 5
  let segmentLength = 0
  let segmentDuration = 0
  let bytesFetched = 0
  let requestedSegments = []
  for (let i = 0; i < totalSegments; ++i) requestedSegments[i] = false

  let mediaSource = null
  if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
    mediaSource = new MediaSource
    //console.log(mediaSource.readyState); // closed
    target.src = URL.createObjectURL(mediaSource)
    mediaSource.addEventListener('sourceopen', sourceOpen)
  } else {
    console.error('Unsupported MIME type or codec: ', mimeCodec)
  }
  let sourceBuffer = null

  function sourceOpen (_) {
    sourceBuffer = mediaSource.addSourceBuffer(mimeCodec)
    getFileLength(assetURL, function (fileLength) {
      console.log((fileLength / 1024 / 1024).toFixed(2), 'MB')
      //totalLength = fileLength;
      segmentLength = Math.round(fileLength / totalSegments)
      //console.log(totalLength, segmentLength);
      fetchRange(assetURL, 0, segmentLength, appendSegment)
      requestedSegments[0] = true
      target.addEventListener('timeupdate', checkBuffer)
      target.addEventListener('canplay', function () {
        segmentDuration = target.duration / totalSegments
        target.play()
      })
      target.addEventListener('seeking', seek)
    })
  }

  function getFileLength (url, cb) {
    let xhr = new XMLHttpRequest
    xhr.open('head', url)
    xhr.onload = function () {
      cb(xhr.getResponseHeader('content-length'))
    }
    xhr.send()
  }

  function fetchRange (url, start, end, cb) {
    let xhr = new XMLHttpRequest
    xhr.open('get', url)
    xhr.responseType = 'arraybuffer'
    xhr.setRequestHeader('Range', 'bytes=' + start + '-' + end)
    xhr.onload = function () {
      console.log('fetched bytes: ', start, end)
      bytesFetched += end - start + 1
      cb(xhr.response)
    }
    xhr.send()
  }

  function appendSegment (chunk) {
    sourceBuffer.appendBuffer(chunk)
  }

  function checkBuffer (_) {
    let currentSegment = getCurrentSegment()
    if (currentSegment === totalSegments && haveAllSegments()) {
      console.log('last segment', mediaSource.readyState)
      mediaSource.endOfStream()
      target.removeEventListener('timeupdate', checkBuffer)
    } else if (shouldFetchNextSegment(currentSegment)) {
      requestedSegments[currentSegment] = true
      console.log('time to fetch next chunk', target.currentTime)
      fetchRange(assetURL, bytesFetched, bytesFetched + segmentLength, appendSegment)
    }
    //console.log(target.currentTime, currentSegment, segmentDuration);
  }

  function seek (e) {
    console.log(e)
    if (mediaSource.readyState === 'open') {
      sourceBuffer.abort()
      console.log(mediaSource.readyState)
    } else {
      console.log('seek but not open?')
      console.log(mediaSource.readyState)
    }
  }

  function getCurrentSegment () {
    return ((target.currentTime / segmentDuration) | 0) + 1
  }

  function haveAllSegments () {
    return requestedSegments.every(function (val) { return !!val })
  }

  function shouldFetchNextSegment (currentSegment) {
    return target.currentTime > segmentDuration * currentSegment * 0.8 &&
      !requestedSegments[currentSegment]
  }
}

