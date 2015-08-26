var constants = require('./constants');
var vlv = require('./vlv');

function Writer(stream) {
	this.stream = stream;
	this.lastEvent = null;
	this.ongoingTrack = false;
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
	buffer.writeInt32BE(constants.START_OF_FILE);
	buffer.writeInt32BE(0x6, 4);
	buffer.writeInt16BE(fileType, 8);
	buffer.writeInt16BE(noTracks, 10);
	buffer.writeInt16BE(ticks, 12);

	return this.stream.write(buffer, cb);
};

Writer.prototype.startTrack = function (size, cb) {
	var buffer = new Buffer(constants.TRACK_HEADER_LENGTH);
	buffer.writeInt32BE(constants.START_OF_TRACK);
	if (!size) {
		size = 0;
	}
	buffer.writeInt32BE(size, 4);

	return this.stream.write(buffer, cb);
};

Writer.prototype.event = function (delta, statusByte, dataBytes, cb) {
	var eventBuffer = Buffer.concat([
		vlv.toBuffer(delta),
		new Buffer([statusByte]),
		new Buffer(dataBytes)
	]);

	return this.stream.write(eventBuffer, cb);
};

Writer.prototype.noteOff = function (delta, note, velocity, cb) {
	return this.event(delta, constants.NOTE_OFF, [note, velocity], cb);
};

Writer.prototype.noteOn = function (delta, note, velocity, cb) {
	return this.event(delta, constants.NOTE_ON, [note, velocity], cb);
};

Writer.prototype.endOfTrack = function (delta, cb) {
	return this.event(delta, constants.META_EVENT, [constants.END_OF_TRACK, 0x00], cb)
};

module.exports = Writer;
