import { Meteor } from 'meteor/meteor'
import { SoundFiles } from '../SoundFiles'
import { Sounds } from '../Sounds'

Meteor.publish(SoundFiles.publications.all.name, () => {
  return SoundFiles.collection.find({})
})

Meteor.publish(Sounds.publications.all.name, () => {
  return Sounds.collection.find({})
})