import { Meteor } from 'meteor/meteor'
import { FilesCollection } from 'meteor/ostrio:files'
import { MongoInternals } from 'meteor/mongo'
import Grid from 'gridfs-stream'
import fs from 'fs'

let gfs
if (Meteor.isServer) {
  gfs = Grid(
    MongoInternals.defaultRemoteCollectionDriver().mongo.db,
    MongoInternals.NpmModule
  )
}

/**
 * Provide 206 partial streaming, derived from https://github.com/VeliovGroup/Meteor-Files/wiki/GridFS---206-Streaming
 */
function interceptDownloadServe (http, fileRef, vRef, version, readableStream, responseType, force200) {
  var array, dispositionEncoding, dispositionName, dispositionType, end, headers, key, partiral, reqRange, self,
    start, stream, streamErrorHandler, take, text, value
  if (version == null) {
    version = 'original'
  }
  if (readableStream == null) {
    readableStream = null
  }
  if (responseType == null) {
    responseType = '200'
  }
  if (force200 == null) {
    force200 = false
  }
  self = this
  partiral = false
  reqRange = false
  if (http.params.query.download && http.params.query.download === 'true') {
    dispositionType = 'attachment; '
  } else {
    dispositionType = 'inline; '
  }
  dispositionName = 'filename="' + (encodeURIComponent(fileRef.name)) + '"; filename=*UTF-8"' + (encodeURIComponent(fileRef.name)) + '"; '
  dispositionEncoding = 'charset=utf-8'
  http.response.setHeader('Content-Disposition', dispositionType + dispositionName + dispositionEncoding)
  if (http.request.headers.range && !force200) {
    partiral = true
    array = http.request.headers.range.split(/bytes=([0-9]*)-([0-9]*)/)
    start = parseInt(array[1])
    end = parseInt(array[2])
    if (isNaN(end)) {
      end = vRef.size - 1
    }
    take = end - start
  } else {
    start = 0
    end = vRef.size - 1
    take = vRef.size
  }
  if (partiral || (http.params.query.play && http.params.query.play === 'true')) {
    reqRange = {
      start: start,
      end: end
    }
    if (isNaN(start) && !isNaN(end)) {
      reqRange.start = end - take
      reqRange.end = end
    }
    if (!isNaN(start) && isNaN(end)) {
      reqRange.start = start
      reqRange.end = start + take
    }
    if ((start + take) >= vRef.size) {
      reqRange.end = vRef.size - 1
    }
    if (self.strict && (reqRange.start >= (vRef.size - 1) || reqRange.end > (vRef.size - 1))) {
      responseType = '416'
    } else {
      responseType = '206'
    }
  } else {
    responseType = '200'
  }
  streamErrorHandler = function (error) {
    http.response.writeHead(500)
    http.response.end(error.toString())
    if (self.debug) {
      console.error('[FilesCollection] [serve(' + vRef.path + ', ' + version + ')] [500]', error)
    }
  }
  headers = http.request.headers

  switch (responseType) {
  case '400':
    if (self.debug) {
      console.warn('[FilesCollection] [serve(' + vRef.path + ', ' + version + ')] [400] Content-Length mismatch!')
    }
    text = 'Content-Length mismatch!'
    http.response.writeHead(400, {
      'Content-Type': 'text/plain',
      'Content-Length': text.length
    })
    http.response.end(text)
    break
  case '404':
    return self._404(http)
    break
  case '416':
    if (self.debug) {
      console.warn('[FilesCollection] [serve(' + vRef.path + ', ' + version + ')] [416] Content-Range is not specified!')
    }
    http.response.writeHead(416)
    http.response.end()
    break
  case '200':
    if (self.debug) {
      console.info('[FilesCollection] [serve(' + vRef.path + ', ' + version + ')] [200]')
    }
    stream = readableStream || fs.createReadStream(vRef.path)
    if (readableStream) {
      http.response.writeHead(200)
    }
    stream.on('open', function () {
      http.response.writeHead(200)
    }).on('error', streamErrorHandler).on('end', function () {
      http.response.end()
    }).pipe(http.response)
    break
  case '206':
    if (self.debug) {
      console.info('[FilesCollection] [serve(' + vRef.path + ', ' + version + ')] [206]')
    }
    http.response.setHeader('Content-Range', 'bytes ' + reqRange.start + '-' + reqRange.end + '/' + vRef.size)
    var myid = (fileRef.versions[version].meta || {}).gridFsFileId
    stream = readableStream || gfs.createReadStream({
      _id: myid,
      range: {
        startPos: reqRange.start,
        endPos: reqRange.end
      }
    })
    if (readableStream) {
      http.response.writeHead(206)
    }
    stream.on('open', function () {
      http.response.writeHead(206)
    }).on('error', streamErrorHandler).on('end', function () {
      http.response.end()
    }).pipe(http.response)
    break
  }
}

/**
 * Derived from example: https://github.com/VeliovGroup/Meteor-Files/wiki/GridFS-Integration
 */
export const SoundFiles = new FilesCollection({
  collectionName: 'soundFiles',
  allowClientCode: false,
  onBeforeUpload (file) {
    if (file.size <= 104857600 && /mp3|wav/i.test(file.ext)) {
      return true
    } else {
      return 'Please upload audio, with size equal or less than 100MB'
    }
  },
  onAfterUpload (image) {
    // Move file to GridFS
    Object.keys(image.versions).forEach(versionName => {
      const metadata = {versionName, imageId: image._id, storedAt: new Date()} // Optional
      const writeStream = gfs.createWriteStream({filename: image.name, metadata})

      fs.createReadStream(image.versions[versionName].path).pipe(writeStream)

      writeStream.on('close', Meteor.bindEnvironment(file => {
        const property = `versions.${versionName}.meta.gridFsFileId`

        // If we store the ObjectID itself, Meteor (EJSON?) seems to convert it to a
        // LocalCollection.ObjectID, which GFS doesn't understand.
        this.collection.update(image._id, {$set: {[property]: file._id.toString()}})
        this.unlink(this.collection.findOne(image._id), versionName) // Unlink files from FS
      }))
    })
  },
  onAfterRemove (images) {
    // Remove corresponding file from GridFS
    images.forEach(image => {
      Object.keys(image.versions).forEach(versionName => {
        const _id = (image.versions[versionName].meta || {}).gridFsFileId
        if (_id) gfs.remove({_id}, err => { if (err) throw err })
      })
    })
  },
  interceptDownload (http, image, versionName) {
    // Serve file from GridFS
    const _id = (image.versions[versionName].meta || {}).gridFsFileId
    if (_id) {
      interceptDownloadServe(http, image, image.versions[versionName], versionName, null, '206', false)
    }
    return Boolean(_id) // Serve file from either GridFS or FS if it wasn't uploaded yet
  },
})

if (Meteor.isServer) {
  SoundFiles.denyClient()
}

SoundFiles.publications = {}
SoundFiles.publications.all = {}
SoundFiles.publications.all.name = 'files.soundFiles.all'




