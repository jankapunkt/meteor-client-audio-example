import { Meteor } from 'meteor/meteor'
import { SoundFiles } from '../../imports/api/sounds/SoundFiles'
import { Sounds } from '../../imports/api/sounds/Sounds'

Meteor.startup(() => {
  const toDelete = []
  SoundFiles.find().forEach(file => {
    if (!Sounds.collection.findOne({fileId: file._id})) {
      toDelete.push(file._id)
    }
  })
  console.log('delete unused files: ', toDelete)
  SoundFiles.remove({_id: {$in: toDelete}})

  toDelete.length = 0
  Sounds.collection.find().forEach(sound => {
    if (!SoundFiles.findOne({_id: sound.fileId})) {
      toDelete.push(sound._id)
    }
  })
  console.log('delete unused sounds: ', toDelete)
  Sounds.collection.remove({_id: {$in: toDelete}})
})