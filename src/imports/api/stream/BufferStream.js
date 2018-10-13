export const getAudioData = function (url) {
  var _this = this;

  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  var source;

  var play = document.querySelector('.play');
  var stop = document.querySelector('.stop');

  //var url = 'viper.ogg';
  var myRequest = new Request(url);
  var myInit = { mode: 'no-cors' };

  // use fetch to load an audio track, and
  // decodeAudioData to decode it and stick it in a buffer.
  // Then we put the buffer into the source
  function getData() {
    source = audioCtx.createBufferSource();
    fetch(myRequest, myInit)
      .then(function (response) {
        return response.arrayBuffer();
      })
      .then(function (buffer) {
        audioCtx.decodeAudioData(buffer, function (decodedData) {
          source.buffer = decodedData;
          source.connect(audioCtx.destination);
        });
      });
  };


}