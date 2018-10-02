import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import SimpleSchema from 'simpl-schema'

import './upload.html'

const uploadSchema = new SimpleSchema({
  sound: {
    type: String,
    autoform: {
      afFieldInput: {
        type: 'fileUpload',
        collection: 'soundFiles',
        uploadTemplate: 'uploadField',
        previewTemplate: 'uploadPreview'
      }
    }
  }
}, {tracker: Tracker})

Template.upload.onCreated(function onUploadCreated () {

})

Template.upload.helpers({
  uploadSchema () {
    return uploadSchema
  }
})
