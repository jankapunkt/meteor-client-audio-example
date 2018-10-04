import { Meteor } from 'meteor/meteor'
import { SoundFiles } from '../SoundFiles'
import { Sounds } from '../Sounds'

Meteor.subscribe(SoundFiles.publications.all.name)
Meteor.subscribe(Sounds.publications.all.name)