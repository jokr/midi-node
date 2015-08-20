# MIDI for Node.js

A very basic node library to parse and write MIDI messages.

## Usage

The library supports three major types of MIDI structures:

1. A sequence, representing a full MIDI file with multiple tracks.
2. A track, a ordered collection of messages.
3. A message, the basic component for the MIDI protocol.

These can all be parsed from a [Buffer](https://nodejs.org/api/buffer.html).

### Message

    var midi = require('midi');
    var noteOff = new Buffer('803c00', 'hex'); // Channel 0, middle C4, 0 velocity
    var message = midi.Message.parse(noteOff);
    
    message.getStatus(); // 0x80
    message.getCommand(); // "NOTE_OFF"
    message.getChannel(); // 0
    message.getData(); // [0x3c, 0x00]

## Resources

http://www.midi.org/techspecs/midimessages.php

