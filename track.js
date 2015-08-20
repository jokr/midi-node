'use strict';

var Message = require('./message');

var constants = {
	START_OF_TRACK: 0x4d54726b
};

function Track(params) {
	this.size = params.size;
	this.events = [];
}

Track.prototype.addEvent = function (ticks, message) {
	this.events.push({
		ticks: ticks,
		message: message
	});
};

Track.prototype.length = function() {
	return this.size + 8;
};

Track.parseTrack = function (buffer) {
	var offset = 0;
	if (buffer.readUInt32BE(offset) !== constants.START_OF_TRACK) {
		throw new Error("Track did not start with 'MTrk'.");
	}
	offset += 4;

	var size = buffer.readUInt32BE(offset);
	offset += 4;

	var track = new Track({size: size});
	var message;
	var runningStatus = null;
	var ticks = 0;
	do {
		var delta = parseVLV(buffer.slice(offset));
		if (delta > 0x7F) {
			offset += 2;
		} else {
			offset += 1;
		}
		ticks += delta;

		message = Message.parse(buffer.slice(offset), runningStatus);
		track.addEvent(ticks, message);
		offset += message.length;
		runningStatus = message.getStatus();
	} while (!message.isEndOfTrack());

	return track;
};

/**
 * Parse a VLV.
 * @param buffer
 */
function parseVLV(buffer) {
	var delta = buffer.readUInt8(0);

	if (delta & 0x80) {
		// we will have to read two bytes
		var leftValue = (delta & 0x7F) << 7;
		var rightValue = buffer.readUInt8(1);
		return leftValue | rightValue;
	} else {
		return delta;
	}
}

module.exports = Track;