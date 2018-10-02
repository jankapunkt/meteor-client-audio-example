/* global AutoForm */
import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import SimpleSchema from 'simpl-schema'
import { Sounds } from '../../api/sounds/Sounds'
import { callback } from '../helpers/callbacks'

import './upload.html'

const uploadSchema = new SimpleSchema({
  fileId: {
    type: String,
    autoform: {
      afFieldInput: {
        type: 'fileUpload',
        collection: Sounds.files.collectionName,
      }
    }
  }
}, {tracker: Tracker})

Template.upload.helpers({
  uploadSchema () {
    return uploadSchema
  }
})

Template.upload.events({
  'submit #uploadForm' (event) {
    event.preventDefault()

    const {fileId} = AutoForm.getFormValues('uploadForm').insertDoc
    Meteor.call(Sounds.methods.create.name, {fileId}, callback({
      onErr (err) {
        console.log(err)
      },
      onRes (res) {
        AutoForm.resetForm('uploadForm')
        console.log(res)
      }
    }))
  }
})
