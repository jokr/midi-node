'use strict';

var assert = require("assert");
var Message = require('../message');

describe('parse simple messages on different channels', function () {
	it('should return a message with a status of 0x80 and a note of 0x3c', function () {
		var noteOff = new Buffer('803c00', 'hex'); // Channel 0, middle C4, 0 velocity
		var message = Message.fromBuffer(noteOff);
		assert.equal(message.getStatus(), 0x80, 'Status did not match.');
		assert.equal(message.getCommand(), 'NOTE_OFF', 'Command did not match.');
		assert.equal(message.getChannel(), 0, 'Channel did not match.');
		assert.deepEqual(message.getData(), [0x3c, 0], 'Data bytes did not match.');
		assert.equal(message.isChannelMessage(), true, 'Should be channel message.');
		assert.equal(message.isSystemMessage(), false, 'Should not be system message.');
		assert.equal(message.isEndOfTrack(), false, 'Should not be end of track.');
		assert.equal(message.length, 3, 'Length did not match.');
	});

	it('should return a message with a status of 0x90 and a note of 0x3c', function () {
		var noteOn = new Buffer('913c64', 'hex'); // Channel 1, middle C4, 100 velocity
		var message = Message.fromBuffer(noteOn);
		assert.equal(message.getStatus(), 0x90, 'Status did not match.');
		assert.equal(message.getCommand(), 'NOTE_ON', 'Command did not match.');
		assert.equal(message.getChannel(), 1, 'Channel did not match.');
		assert.deepEqual(message.getData(), [0x3c, 100], 'Data bytes did not match.');
		assert.equal(message.isChannelMessage(), true, 'Should be channel message.');
		assert.equal(message.isSystemMessage(), false, 'Should not be system message.');
		assert.equal(message.isEndOfTrack(), false, 'Should not be end of track.');
		assert.equal(message.length, 3, 'Length did not match.');
	});

	it('should return a message with a status of 0xC0 and a data byte of 0x4a', function () {
		var prgChange = new Buffer('CF4F', 'hex'); // Channel 15, middle C4, 100 velocity
		var message = Message.fromBuffer(prgChange);
		assert.equal(message.getStatus(), 0xC0, 'Status did not match.');
		assert.equal(message.getCommand(), 'PROGRAM_CHANGE', 'Command did not match.');
		assert.equal(message.getChannel(), 15, 'Channel did not match.');
		assert.deepEqual(message.getData(), [0x4F], 'Data bytes did not match.');
		assert.equal(message.isChannelMessage(), true, 'Should be channel message.');
		assert.equal(message.isSystemMessage(), false, 'Should not be system message.');
		assert.equal(message.isEndOfTrack(), false, 'Should not be end of track.');
		assert.equal(message.length, 2, 'Length did not match.');
	});

	it('should return a message with a running status', function () {
		var noteOff = new Buffer('3c00', 'hex'); // middle C4, 0 velocity
		var message = Message.fromBuffer(noteOff, 0x80);
		assert.equal(message.getStatus(), 0x80, 'Status did not match.');
		assert.equal(message.getCommand(), 'NOTE_OFF', 'Command did not match.');
		assert.equal(message.getChannel(), 0, 'Channel did not match.');
		assert.deepEqual(message.getData(), [0x3c, 0], 'Data bytes did not match.');
		assert.equal(message.isChannelMessage(), true, 'Should be channel message.');
		assert.equal(message.isSystemMessage(), false, 'Should not be system message.');
		assert.equal(message.isEndOfTrack(), false, 'Should not be end of track.');
		assert.equal(message.length, 2, 'Length did not match.');
	});
});

describe('parse system messages', function () {
	it('should return a message with a status of 0xFF and 6 data bytes', function () {
		var meta = new Buffer('FF580404023008', 'hex'); // Time Signature
		var message = Message.fromBuffer(meta);
		assert.equal(message.getStatus(), 0xFF, 'Status did not match.');
		assert.equal(message.getCommand(), 'META_MESSAGE', 'Command did not match.');
		assert.equal(message.getChannel(), null, 'Channel should be null.');
		assert.deepEqual(message.getData(), [0x58, 0x04, 0x04, 0x02, 0x30, 0x08], 'Data bytes did not match.');
		assert.equal(message.isChannelMessage(), false, 'Should not be channel message.');
		assert.equal(message.isSystemMessage(), true, 'Should not be system message.');
		assert.equal(message.isEndOfTrack(), false, 'Should not be end of track.');
		assert.equal(message.length, 7, 'Length did not match.');
	});

	it('should return a end of track message', function () {
		var meta = new Buffer('FF2F00', 'hex'); // End of track
		var message = Message.fromBuffer(meta);
		assert.equal(message.getStatus(), 0xFF, 'Status did not match.');
		assert.equal(message.getCommand(), 'META_MESSAGE', 'Command did not match.');
		assert.equal(message.getChannel(), null, 'Channel should be null.');
		assert.deepEqual(message.getData(), [0x2F, 0x00], 'Data bytes did not match.');
		assert.equal(message.isChannelMessage(), false, 'Should not be channel message.');
		assert.equal(message.isSystemMessage(), true, 'Should not be system message.');
		assert.equal(message.isEndOfTrack(), true, 'Should be end of track.');
		assert.equal(message.length, 3, 'Length did not match.');
	});
});

describe('message error cases', function () {
	it('should return null on missing length byte (meta)', function () {
		var meta = new Buffer('FF2F', 'hex'); // End of track
		var message = Message.fromBuffer(meta);
		assert.equal(message, null);
	});

	it('should return null on too few data bytes (meta)', function () {
		var meta = new Buffer('FF5804040230', 'hex'); // Time Signature
		var message = Message.fromBuffer(meta);
		assert.equal(message, null);
	});

	it('should return null on too few data bytes (channel)', function () {
		var noteOn = new Buffer('913c', 'hex'); // End of track
		var message = Message.fromBuffer(noteOn);
		assert.equal(message, null);
	});
});