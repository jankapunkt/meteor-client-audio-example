import { Meteor } from 'meteor/meteor'
import { FilesCollection } from 'meteor/ostrio:files'

export const SoundFiles = new FilesCollection({
  collectionName: 'soundFiles',
  allowClientCode: true, // Required to let you remove uploaded file
  onBeforeUpload (file) {
    if (file.size <= 104857600 && /mp3|wav/i.test(file.ext)) {
      return true
    } else {
      return 'Please upload audio, with size equal or less than 100MB'
    }
  }
})

SoundFiles.publications = {}
SoundFiles.publications.all = {}
SoundFiles.publications.all.name = 'files.soundFiles.all'
