# Meteor Client Audio Example

Offline first approach to stream audio to clients. 
Exploring an efficient way of caching audio files for client devices (browser, mobile) for scenarios, where many smaller audio files are played back very often.  

## Features to explore:

* [ ] Upload using meteor files
* [ ] Stream audio files from gridfs
* [ ] Playback using howler
* [ ] Cache using ground db


## Approach / concept

* No initial download on app download or app init.
* Download (better: steam) file (plus get hash signature), once on the first usage is demanded. 
Caching the file locally, if no local file could be found by given hash.  
* Playing the local file, if a local file could be found by given hash.
* Provide the option to remove the local file.

## Packages used:

**Meteor packages**

[ostrio:files](https://github.com/VeliovGroup/Meteor-Files) - upload files to gridFs

[aldeed:autoform](https://github.com/aldeed/meteor-autoform) - quick form generation from schema

[ostrio:autoform-files](https://github.com/VeliovGroup/Meteor-Files) - files upload form

[ground:db](https://github.com/GroundMeteor/db) - client side cache

[fortawesome:fontawesome]() - icon font set


**NPM Packages**


[bootstrap](https://github.com/twbs/bootstrap) - grid design for ui

[howler](https://github.com/goldfire/howler.js) - playback audio

[simpl-schema](https://github.com/aldeed/simple-schema-js) - provide document schema for mongo collections


## Related

[Use GridFS as a storage](https://github.com/VeliovGroup/Meteor-Files/wiki/GridFS-Integration)
