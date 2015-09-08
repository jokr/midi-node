# MIDI for Node.js

A very basic node library to parse and write MIDI messages.

## Usage

The library supports three major types of MIDI structures:

1. A sequence, representing a full MIDI file with multiple tracks.
2. A track, a ordered collection of messages.
3. A message, the basic component for the MIDI protocol.

These can all be parsed from a [Buffer](https://nodejs.org/api/buffer.html).

### Parsing a Message

```js
var midi = require('midi-node');
var noteOff = new Buffer('803c00', 'hex'); // Channel 0, middle C4, 0 velocity
var message = midi.Message.fromBuffer(noteOff);

message.getStatus(); // 0x80
message.getCommand(); // "NOTE_OFF"
message.getChannel(); // 0
message.getData(); // [0x3c, 0x00]
```
    
### Parsing messages from a stream

Anything that emits a 'data' event can be used as a stream.

```js
var midi = require('midi-node');
var input = <something readable>;
var stream = new midi.Stream(input);

stream.on('startTrack', function (track) {
		// do something with the track
});

stream.on('event', function (delta, message) {
		message.getStatus(); // 0x80
		message.getCommand(); // "NOTE_OFF"
		message.getChannel(); // 0
		message.getData(); // [0x3c, 0x00]
});
```
    
The following events are emitted:

* `startFile`, parameter is the file header
* `startTrack`, parameter is the track object
* `event`, parameters are delta and message
* `endTrack`, parameter is the track object
* `error`, parameter is the error object
    
### Writing a Message

```js
var midi = require('midi-node');
var stream = <something writable>;
var writer = new midi.Writer(stream);

writer.startFile(0, 1, 128);
writer.startTrack();
writer.noteOn(0, 0, 0x3c, 100); // Channel 0, middle C4, 100 velocity
```

## Resources

[http://www.midi.org/techspecs/midimessages.php](http://www.midi.org/techspecs/midimessages.php)

