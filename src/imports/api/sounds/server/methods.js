import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { Sounds } from '../Sounds'
import { SoundFiles } from '../SoundFiles'

Meteor.methods({
  [Sounds.methods.create.name] ({fileId}) {
    check(fileId, String)
    return Sounds.collection.insert({fileId})
  }
})

Meteor.methods({
  [Sounds.methods.get.name] ({fileId}) {
    check(fileId, String)
    return SoundFiles.findOne(fileId)
  }
})
