'use strict';

var assert = require('assert');
var events = require('events');
var MIDIStream = require('../stream');
var util = require('util');

function DummyStream() {
	events.EventEmitter.call(this);
}

util.inherits(DummyStream, events.EventEmitter);

DummyStream.prototype.write = function (data) {
	this.emit('data', new Buffer(data, 'hex'));
};

describe('stream opens a sequence', function () {
	it('too few bytes do nothing but get buffered', function () {
		var stream = new DummyStream();
		var midiStream = new MIDIStream(stream);
		midiStream.on('startFile', function () {
			assert.fail('should not have triggered');
		});
		stream.write('4d546864');
		assert.equal(midiStream.buffer.length, 4);
	});

	it('should parse header through multiple writes', function (done) {
		var stream = new DummyStream();
		var midiStream = new MIDIStream(stream);
		midiStream.on('startFile', function (header) {
			assert.equal(header.fileType, 0);
			assert.equal(header.noTracks, 1);
			assert.equal(header.ticks, 128);
			done();
		});
		stream.write('4d546864');
		stream.write('00000006000000010080');
		assert.equal(midiStream.buffer.length, 0);
	});

	it('should parse start of track after file start', function (done) {
		var stream = new DummyStream();
		var midiStream = new MIDIStream(stream);
		midiStream.on('startTrack', function (track) {
			assert.equal(track.length(), 1845 + 8);
			done();
		});
		stream.write('4d54686400000006000000010080');
		stream.write('4d54726b');
		stream.write('00000735');
		assert.equal(midiStream.buffer.length, 0);
	});

	it('should parse start of track after file start', function (done) {
		var stream = new DummyStream();
		var midiStream = new MIDIStream(stream);
		midiStream.on('startTrack', function (track) {
			assert.equal(track.length(), 1845 + 8);
			done();
		});
		stream.write('4d54726b');
		stream.write('00000735');
		assert.equal(midiStream.buffer.length, 0);
	});
});

describe('stream parses full track', function () {
	var stream, midiStream;

	beforeEach(function () {
		stream = new DummyStream();
		midiStream = new MIDIStream(stream);
		stream.write('4d54686400000006000000010080');
		stream.write('4d54726b00000735');
	});

	it('should parse nothing with only the delta', function () {
		midiStream.on('event', function () {
			assert.fail('We do not expect a event.');
		});
		stream.write('00');
		assert.equal(midiStream.buffer.length, 1);
	});

	it('should parse note on', function () {
		midiStream.on('event', function (delta, message) {
			assert.equal(delta, 0);
			assert.equal(message.getCommand(), 'NOTE_ON', 'Command did not match.');
			assert.equal(message.getChannel(), 0, 'Channel should be 0.');
			assert.deepEqual(message.getData(), [0x3c, 0x64], 'Data bytes did not match.');
			assert.equal(message.isChannelMessage(), true, 'Should be channel message.');
			assert.equal(message.isSystemMessage(), false, 'Should not be system message.');
			assert.equal(message.isEndOfTrack(), false, 'Should not be end of track.');
			assert.equal(message.length, 3, 'Length did not match.');
		});
		stream.write('00903c64');
		assert.equal(midiStream.buffer.length, 0);
	});

	it('should parse note on with running status', function () {
		stream.write('00903c64');
		midiStream.on('event', function (delta, message) {
			assert.equal(delta, 0);
			assert.equal(message.getCommand(), 'NOTE_ON', 'Command did not match.');
			assert.equal(message.getChannel(), 0, 'Channel should be 0.');
			assert.deepEqual(message.getData(), [0x3c, 0x64], 'Data bytes did not match.');
			assert.equal(message.isChannelMessage(), true, 'Should be channel message.');
			assert.equal(message.isSystemMessage(), false, 'Should not be system message.');
			assert.equal(message.isEndOfTrack(), false, 'Should not be end of track.');
			assert.equal(message.length, 2, 'Length did not match.');
		});
		stream.write('003c64');
		assert.equal(midiStream.buffer.length, 0);
	});

	it('should parse a meta event', function (done) {
		midiStream.on('event', function (delta, message) {
			assert.equal(delta, 0);
			assert.equal(message.getCommand(), 'META_MESSAGE', 'Command did not match.');
			assert.equal(message.getChannel(), null, 'Channel should be null.');
			assert.deepEqual(message.getData(), [0x21, 0x01, 0x00], 'Data bytes did not match.');
			assert.equal(message.isChannelMessage(), false, 'Should not be channel message.');
			assert.equal(message.isSystemMessage(), true, 'Should be system message.');
			assert.equal(message.isEndOfTrack(), false, 'Should not be end of track.');
			assert.equal(message.length, 4, 'Length did not match.');
			done();
		});
		stream.write('00FF210100');
		assert.equal(midiStream.buffer.length, 0);
	});

	it('should parse a meta event and end of track', function (done) {
		midiStream.on('event', function (delta, message) {
			assert.equal(delta, 0);
			assert.equal(message.getCommand(), 'META_MESSAGE', 'Command did not match.');
			assert.equal(message.getChannel(), null, 'Channel should be null.');
			assert.deepEqual(message.getData(), [0x03, 0x04, 0x4C, 0x65, 0x61, 0x64], 'Data bytes did not match.');
			assert.equal(message.isChannelMessage(), false, 'Should not be channel message.');
			assert.equal(message.isSystemMessage(), true, 'Should be system message.');
			assert.equal(message.isEndOfTrack(), false, 'Should not be end of track.');
			assert.equal(message.length, 7, 'Length did not match.');
		});
		stream.write('00FF03044C656164'); // delta=0, meta=03, 4 data bytes
		midiStream.removeAllListeners();

		var receivedOneEvent = false;

		midiStream.on('event', function (delta, message) {
			assert.equal(delta, 10);
			assert.equal(message.getCommand(), 'META_MESSAGE', 'Command did not match.');
			assert.equal(message.getChannel(), null, 'Channel should be null.');
			assert.deepEqual(message.getData(), [0x2F, 0x00], 'Data bytes did not match.');
			assert.equal(message.isChannelMessage(), false, 'Should not be channel message.');
			assert.equal(message.isSystemMessage(), true, 'Should be system message.');
			assert.equal(message.isEndOfTrack(), true, 'Should be end of track.');
			assert.equal(message.length, 3, 'Length did not match.');
			if (receivedOneEvent) {
				done();
			} else {
				receivedOneEvent = true;
			}
		});

		midiStream.on('endTrack', function (track) {
			assert.equal(track.events.length, 2);
			if (receivedOneEvent) {
				done();
			} else {
				receivedOneEvent = true;
			}
		});
		stream.write('0AFF2F00'); // delta=10, meta=2F (end), 0 data bytes
		assert.equal(midiStream.buffer.length, 0);
	});

	it('should parse a long meta with different deltas', function (done) {
		midiStream.on('event', function (delta, message) {
			assert.equal(delta, 2069397);
		});
		stream.write('fea715ff031853657175656e63656420627920502e4a2e204261726e6573');
		midiStream.removeAllListeners();

		midiStream.on('event', function (delta, message) {
			assert.equal(delta, 16383);
		});
		stream.write('ff7fff031853657175656e63656420627920502e4a2e204261726e6573');
		midiStream.removeAllListeners();

		midiStream.on('event', function (delta, message) {
			assert.equal(delta, 2097151);
		});
		stream.write('ffff7fff031853657175656e63656420627920502e4a2e204261726e6573');
		midiStream.removeAllListeners();

		midiStream.on('event', function (delta, message) {
			assert.equal(delta, 268435455);
			done();
		});
		stream.write('ffffff7fff031853657175656e63656420627920502e4a2e204261726e6573');
	});
});