import './stream.html'
import { Sounds } from '../../api/sounds/Sounds'

Template.stream.helpers({
  sounds () {
    return Sounds.collection.find()
  }
})
