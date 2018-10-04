import '../../imports/ui/helpers/templateHelpers'
import '../../imports/api/sounds/client/subscriptions'

import { Meteor } from 'meteor/meteor'
import { SoundCache } from '../../imports/api/sounds/SoundCache'

Meteor.startup(() => {

  SoundCache.init()
})