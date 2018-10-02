import { Mongo } from 'meteor/mongo'
import { SoundFiles } from './SoundFiles'

export const Sounds = {}

Sounds.collection = new Mongo.Collection('sounds')
Sounds.files = SoundFiles

Sounds.methods = {}
Sounds.methods.create = {}
Sounds.methods.create.name = 'sounds.method.create'
Sounds.methods.create.schema = {fileId: String}
Sounds.methods.get = {}
Sounds.methods.create.name = 'sounds.method.get'
Sounds.methods.create.schema = {fileId: String}

Sounds.publications = {}
Sounds.publications.all = {}
Sounds.publications.all.name = 'sounds.publications.all'
