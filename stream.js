'use strict';

var constants = require('./constants');
var events = require('events');
var Message = require('./message');
var Sequence = require('./sequence');
var Track = require('./track');
var util = require('util');
var vlv = require('./vlv');

function MIDIStream(stream) {
	events.EventEmitter.call(this);
	this.tracks = [];
	this.header = null;
	this.buffer = new Buffer(0);
	this.readingTrack = false;
	this.runningStatus = null;

	stream.on('data', this.addData.bind(this));
}

util.inherits(MIDIStream, events.EventEmitter);

MIDIStream.prototype.getTracks = function () {
	return this.tracks;
};

MIDIStream.prototype.getFileType = function () {
	return this.header.fileType;
};

MIDIStream.prototype.getTicks = function () {
	return this.header.ticks;
};

MIDIStream.prototype.addData = function (data) {
	try {
		this.buffer = Buffer.concat([this.buffer, data]);
		var track = null;

		if (!this.readingTrack) {
			if (this.buffer.length < 4) {
				return;
			}

			if (this.buffer.readUInt32BE(0) === constants.START_OF_FILE) {
				if (this.buffer.length < constants.FILE_HEADER_LENGTH) {
					// We cannot read the header yet.
					return;
				}

				this.header = readHeader(this.buffer.slice(0, constants.FILE_HEADER_LENGTH));
				this.buffer = this.buffer.slice(constants.FILE_HEADER_LENGTH);
				this.emit('startFile', this.header);
			}
		} else {
			track = this.tracks[this.tracks.length - 1];
		}

		while (this.buffer.length >= 2) {
			// we need at least a delta byte and a command byte

			if (!this.readingTrack) {
				if (this.buffer.length < constants.TRACK_HEADER_LENGTH) {
					// We cannot read the header yet.
					return;
				}

				track = Track.fromBuffer(this.buffer);
				this.readingTrack = true;
				this.tracks.push(track);
				this.buffer = this.buffer.slice(constants.TRACK_HEADER_LENGTH);
				this.emit('startTrack', track);
			} else {
				var offset = 0;
				var delta = vlv.fromBuffer(this.buffer);
				offset += 1;
				if (delta) {
					offset += Math.floor(Math.log(delta) / Math.log(0x80));
				}

				var message = Message.fromBuffer(this.buffer.slice(offset), this.runningStatus);
				if (!message) {
					return;
				}

				track.addEvent(delta, message);
				this.buffer = this.buffer.slice(offset + message.length);
				this.emit('event', delta, message);
				this.runningStatus = message.statusByte;

				if (message.isEndOfTrack()) {
					this.emit('endTrack', track);
					this.readingTrack = false;
					this.runningStatus = null;
				}
			}
		}
	} catch (error) {
		this.emit('error', error);
	}
};

function readHeader(buffer) {
	var offset = 0;
	if (buffer.readUInt32BE(offset) !== constants.START_OF_FILE) {
		throw new Error("Expected start of file marker 'MThd'.");
	}
	offset += 4;

	if (buffer.readUInt32BE(offset) !== 0x6) {
		throw new Error('Invalid header size (expected 6 bytes).');
	}
	offset += 4;

	var fileType = buffer.readUInt16BE(offset);
	offset += 2;

	var noTracks = buffer.readUInt16BE(offset);
	offset += 2;

	if (fileType === constants.TYPE_0 && noTracks !== 1) {
		throw new Error('Number of tracks mismatch file type (expected 1 track).');
	}

	var ticks = buffer.readUInt16BE(offset);

	return {
		fileType: fileType,
		ticks: ticks,
		noTracks: noTracks
	};
}

module.exports = MIDIStream;