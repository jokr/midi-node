'use strict';

var constants = require('./constants');
var vlv = require('./vlv');

function isInteger(value) {
	return typeof value === "number" &&
		isFinite(value) &&
		Math.floor(value) === value;
}

function Writer(stream) {
	this.stream = stream;
	this.lastEvent = null;
}

Writer.prototype.startFile = function (fileType, noTracks, ticks, cb) {
	if (fileType !== 0 && fileType !== 1) {
		throw new Error('Invalid file type.');
	}

	if (fileType === 0 && noTracks !== 1) {
		throw new Error('Expect only one track for file type 0.');
	}

	if (noTracks < 1) {
		throw new Error('Must at least have one track.');
	}

	if (ticks < 0) {
		throw new Error('Must at least specify one tick.');
	}

	var buffer = new Buffer(constants.FILE_HEADER_LENGTH);
	buffer.writeInt32BE(constants.START_OF_FILE, 0);
	buffer.writeInt32BE(0x6, 4);
	buffer.writeInt16BE(fileType, 8);
	buffer.writeInt16BE(noTracks, 10);
	buffer.writeInt16BE(ticks, 12);

	return this.stream.write(buffer, cb);
};

Writer.prototype.startTrack = function (size, cb) {
	var buffer = new Buffer(constants.TRACK_HEADER_LENGTH);
	buffer.writeInt32BE(constants.START_OF_TRACK, 0);
	if (!size) {
		size = 0;
	}
	buffer.writeInt32BE(size, 4);

	return this.stream.write(buffer, cb);
};

Writer.prototype.event = function (delta, statusByte, dataBytes, cb) {
	if (!isInteger(delta) || delta < 0) {
		throw new Error('Invalid delta.');
	}

	if (statusByte < 0x80 || statusByte > 0xFF) {
		throw new Error('Invalid status byte.');
	}

	dataBytes.forEach(function (dataByte) {
		if (dataByte > 0x80) {
			throw new Error('Invalid data byte.');
		}
	});

	var eventBuffer;

	if (this.lastEvent === statusByte) {
		eventBuffer = Buffer.concat([
			vlv.toBuffer(delta),
			new Buffer(dataBytes)
		]);
	} else {
		eventBuffer = Buffer.concat([
			vlv.toBuffer(delta),
			new Buffer([statusByte]),
			new Buffer(dataBytes)
		]);
		this.lastEvent = statusByte;
	}

	return this.stream.write(eventBuffer, cb);
};

Writer.prototype.noteOff = function (delta, channel, note, velocity, cb) {
	if (!isInteger(channel) || channel > 15 || channel < 0) {
		throw new Error('Invalid channel (0-15).');
	}

	return this.event(delta, constants.NOTE_OFF | channel, [note, velocity], cb);
};

Writer.prototype.noteOn = function (delta, channel, note, velocity, cb) {
	if (!isInteger(channel) || channel > 15 || channel < 0) {
		throw new Error('Invalid channel (0-15).');
	}

	return this.event(delta, constants.NOTE_ON | channel, [note, velocity], cb);
};

Writer.prototype.endOfTrack = function (delta, cb) {
	return this.event(delta, constants.META_EVENT, [constants.END_OF_TRACK, 0x00], cb);
};

module.exports = Writer;
