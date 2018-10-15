import { Meteor } from 'meteor/meteor'
import { SoundCache } from '../../imports/api/sounds/SoundCache'
import { Sounds } from '../../imports/api/sounds/Sounds'
import { SoundFiles } from '../../imports/api/sounds/SoundFiles'
import '../../imports/ui/helpers/templateHelpers'

Meteor.startup(() => {
  SoundCache.init()

    SoundFiles.subscription = Meteor.subscribe(SoundFiles.publications.all.name)
    Sounds.subscription = Meteor.subscribe(Sounds.publications.all.name)
})

