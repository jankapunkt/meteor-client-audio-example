# Meteor Client Media Example

Chunk-wise stream video/audio to clients from gridFs. Files are uploaded via [ostrio:files](https://github.com/VeliovGroup/Meteor-Files).

Explore an efficient way of caching media files for client devices (browser, mobile) for scenarios, where many smaller media files are played back very often.  

## Features to explore:

* [x] Upload using meteor files
* [x] Server side conversion to ogg/mp4/webm formats using ffmpeg
* [x] Download media files from gridfs
* [x] Playback using howler
* [x] Stream files as partial response (HTTP 206) using HTMLAudio
* [x] Stream as webm / mp4 from partial response into MediaSource
* [ ] Extract streamed buffer for local caching
* [x] Cache buffer using ~~ground db~~ localForage
* [ ] Cache only segements of buffers, when streamning into MediaSource
* [x] Play from cached buffer, if exists
* [ ] Bonus: end to end encryption of the files (feasible?)

## Approach / concept

* [ ] No initial download of file or data on app-download or app-init
* [ ] Download (steam) file, once on the first usage is demanded. Cache the file locally, if no local file could be found by given id.
* [ ] Playing the local file, if a local file could be found by given hash.
* [ ] Provide the option to remove the local file.
* [ ] Provide the option to choose between HTML5 / MediaSource and their respective compatible formats/codecs

## Scenario descriptions

#### Upload

User

* [ ] As a user I want to upload a video/audio file by a form.
* [ ] I want to be notified when the upload is finished and when the background processing is finished.
* [ ] If I cancel the upload, the file and all it's subversions will be deleted.

System

* [ ] The backend should convert it to the right format.

#### Playback mode detection

User

* [ ] As a user I want an automatic playback detection with priority of streaming chunks (support lower bandwidth)
* [ ] I also want to be able to manually set/switch the playback mode, it it's supported

System

* [ ] Prefer [MediaSource mode](#markdown-header-5-play-mediasource-mode), if my Browser supports MediaSource
* [ ] else fallback [HTML5 mode](#markdown-header-5-play-html5-mode), if my browser does not support MediaSource or no compatible format/codec is found
* [ ] else display a browser update notification, if my browser does not support HTML5 MediaElements


#### Play

User

* [ ] As a user I want to select a file to be played by clicking the play button next to it's name.
* [ ] I also want to see the progress of the playback in a bar.
* [ ] I also want to see how much of the file has already been loaded inside the same or another bar.


System

* [ ] If the selected file is already (fully) cached - load from cache and play using HTML5
* [ ] else


<h5 id='markdown-header-5-play-mediasource-mode'>MediaSource mode</h5>

* [ ] select the file type/codec that is compatible with it.
* [ ] if more than one type/codec are available, select by the smallest size
* [ ] initialize segmented bffer loading
  * [ ] if a buffer segment is already cached, load it from cache instead
  * [ ] else 
    * [ ] download it
    * [ ] add it to the MediaSource
    * [ ] add it to cache by fileId / segmentId
* [ ] start playing, once ready
* [ ] once all buffer 

<h5 id='markdown-header-5-play-html5-mode'>HTML5 mode</h5>


  * [ ] select a HTML5 video/audio compatible format
  * [ ] if more than one type/codec are available, select by the smallest size
  * [ ] if no compatible type is found - throw an error / notify user

#### Pause

User

* [ ] As a user I want to hit the pause button to pause the playback. If hitting play again, the media will continue from the last cue.
* [ ] If paused I also expect the progress bar to stop moving but maybe see the loading bar to continue to move.

System


#### Stop

User

* [ ] As a user I want to hit the pause button to stop button to stop the current playback.
* [ ] If stopped I also expected the progress bar to be "empty" while the loading bar still may move.


#### Seek

User

* [ ] As a user I want to click/tap on the progress bar to play from a certain point (seekin).
* [ ] If the media does not play but I click the bar the current selected media starts playing immediately from the selected point.
* [ ] If the selected part has not been loaded yet, I want to be notified (for example using a loading icon) about the fact, that this part is yet to be loaded.

#### Download

User 

* [ ] As a user I want to click the download button to download the original uploaded file by default.
* [ ] I also want to manually choose one of the other available formats to download.



## Packages used:

**Meteor packages**

[ostrio:files](https://github.com/VeliovGroup/Meteor-Files) - upload files to gridFs

[aldeed:autoform](https://github.com/aldeed/meteor-autoform) - quick form generation from schema

[ostrio:autoform-files](https://github.com/VeliovGroup/Meteor-Files) - files upload form

[fortawesome:fontawesome]() - icon font set


**NPM Packages**

[localforage](https://github.com/localForage/localForage) - cache files in the browser

[bootstrap](https://github.com/twbs/bootstrap) - grid design for ui

[howler](https://github.com/goldfire/howler.js) - playback audio

[simpl-schema](https://github.com/aldeed/simple-schema-js) - provide document schema for mongo collections


## Related

[Use GridFS as a storage](https://github.com/VeliovGroup/Meteor-Files/wiki/GridFS-Integration)
