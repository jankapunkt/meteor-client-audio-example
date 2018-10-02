import { Template } from 'meteor/templating'
import { ReactiveDict } from 'meteor/reactive-dict'
import '../startup/both/schema'
import '../startup/both/files'
import '../startup/client/subscriptions'

import '../imports/ui/stream/stream'
import '../imports/ui/upload/upload'

import './main.html'

const States = {
  stream: 'stream',
  upload: 'upload'
}

Template.body.onCreated(function onBodyCreated () {
  const instance = this
  instance.state = new ReactiveDict()
  instance.state.set('active', States.stream)
})

Template.body.helpers({
  active (key) {
    return Template.instance().state.get('active') === key
  }
})

Template.body.events({
  'click .tab' (event, tInstance) {
    event.preventDefault()
    const target = tInstance.$(event.currentTarget).data('target')
    tInstance.state.set('active', target)
  }
})