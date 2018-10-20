import { Meteor } from 'meteor/meteor'
import { FilesCollection } from 'meteor/ostrio:files'
import { MongoInternals } from 'meteor/mongo'
import Grid from 'gridfs-stream'
import fs from 'fs'
import mime from 'mime'

let gfs, ffmpeg
if (Meteor.isServer) {
  gfs = Grid(
    MongoInternals.defaultRemoteCollectionDriver().mongo.db,
    MongoInternals.NpmModule
  )
  ffmpeg = require('fluent-ffmpeg')
}

function convertFormats (image, callback) {
  let sourceFile = ffmpeg(image.path)
  sourceFile.noVideo() // use for audio-only
  const paths = []
  const endings = ['ogg', 'mp4', 'webm']
  const data = endings.map(function (extension) {
    const name = image.name.replace(image.extension, extension)
    const path = `${image._storagePath}/${name}`
    const type = mime.getType(extension).replace('video', 'audio')
    paths.push(path)
    sourceFile.audioCodec('libvorbis')
    sourceFile.output(path)
    return {extension, path, type, name}
  })

  const resCb = Meteor.bindEnvironment(() => callback(null, data))
  const errCb = Meteor.bindEnvironment((err) => callback(err))

  sourceFile.on('end', resCb)
  sourceFile.on('error', errCb)
  sourceFile.run()
}

const asyncFFProbe = Meteor.isServer ? Meteor.wrapAsync(ffmpeg.ffprobe) : null

function getCodec (path) {
  let audioCodec = null
  const metadata = asyncFFProbe(path)
  metadata.streams.forEach(stream => {
    if (stream.codec_type === 'audio') {
      audioCodec = stream.codec_name
    }
  })
  return audioCodec
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
  debug: true,
  onBeforeUpload (file) {
    if (file.size <= 104857600 && /mp3|wav|ogg|mp4|webm/i.test(file.ext)) {
      return true
    } else {
      return 'Please upload audio, with size equal or less than 100MB'
    }
  },
  onAfterUpload (image) {
    convertFormats(image, (err, data = []) => {
      if (err) {
        console.error(err)
      }

      // update meta entries
      data.forEach(entry => {
        const stats = fs.statSync(entry.path)
        const codec = getCodec(entry.path)
        const upd = {$set: {}}
        upd['$set']['versions.' + entry.extension] = {
          path: entry.path,
          size: stats.size,
          type: entry.type,
          name: entry.name,
          extension: entry.extension,
          codec: codec
        }
        SoundFiles.update(image._id, upd)
      })

      // we need to re-load the document
      // because we might have updated the
      // versions entries.
      const updatedImage = SoundFiles.findOne(image._id)

      // Move file / version to GridFS
      Object.keys(updatedImage.versions).forEach(versionName => {
        const metadata = {versionName, updatedImageId: updatedImage._id, storedAt: new Date()} // Optional
        const writeStream = gfs.createWriteStream({filename: updatedImage.name, metadata})
        const versionPath = updatedImage.versions[versionName].path



        // create gridfs writestreams
        if (this.debug) {
          console.log(`[${versionName}] -> gfs writeStream on path [${versionPath}]`)
        }
        fs.createReadStream(versionPath).pipe(writeStream)

        writeStream.on('close', Meteor.bindEnvironment(file => {
          const gfsId = file._id.toString()

          if (this.debug) {
            console.log(`[${versionName}] -> writestream closed with gfsId [${gfsId}] `)
          }
          const property = `versions.${versionName}.meta.gridFsFileId`

          // If we store the ObjectID itself, Meteor (EJSON?) seems to convert it to a
          // LocalCollection.ObjectID, which GFS doesn't understand.
          this.collection.update(updatedImage._id, {$set: {[property]: gfsId}})
          this.unlink(this.collection.findOne(updatedImage._id), versionName) // Unlink files from FS
        }))
      })
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




