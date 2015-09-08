'use strict';

var constants = require('./constants');

var commands = {
	0x80: {
		name: 'NOTE_OFF',
		length: 2
	},
	0x90: {
		name: 'NOTE_ON',
		length: 2
	},
	0xA0: {
		name: 'POLYPHONIC_AFTERTOUCH',
		length: 2
	},
	0xB0: {
		name: 'CONTROL_CHANGE',
		length: 2
	},
	0xC0: {
		name: 'PROGRAM_CHANGE',
		length: 1
	},
	0xD0: {
		name: 'CHANNEL_AFTERTOUCH',
		length: 1
	},
	0xE0: {
		name: 'PITCH_BEND_CHANGE',
		length: 2
	},
	0xFF: {
		name: 'META_MESSAGE',
		length: null // variable
	}
};

function Message(status, data, length) {
	this.statusByte = status;
	this.data = data;
	this.length = length;
}

Message.prototype.getStatus = function () {
	return this.statusByte === constants.META_EVENT ? this.statusByte : this.statusByte & 0xF0;
};

Message.prototype.getCommand = function () {
	return commands[this.getStatus()].name;
};

Message.prototype.getChannel = function () {
	if (!this.isChannelMessage()) {
		return null;
	}
	return this.statusByte & 0x0F;
};

Message.prototype.getData = function () {
	return this.data;
};

Message.prototype.isChannelMessage = function () {
	return this.statusByte < 0xF0;
};

Message.prototype.isSystemMessage = function () {
	return this.statusByte >= 0xF0;
};

Message.prototype.isEndOfTrack = function () {
	return this.statusByte === constants.META_EVENT && this.data[0] === constants.END_OF_TRACK;
};

Message.prototype.toString = function () {
	if (this.statusByte === constants.META_EVENT) {
		return 'Meta Event: 0x' + this.data[0].toString(16);
	}

	if (commands[this.getStatus()]) {
		var channel = this.getChannel();
		return 'Channel ' + channel + ': ' + commands[this.getStatus()].name + ' ' + this.data;
	}

	return this.statusByte.toString(16);
};

/**
 * Parses a MIDI Message out of a buffer and returns it. Returns null
 * if there are too few bytes for the type of message.
 *
 * @param buffer
 * @param runningStatus
 * @returns {Message}
 */
Message.fromBuffer = function (buffer, runningStatus) {
	if (buffer.length === 0) {
		return null;
	}

	var status = buffer.readUInt8(0);
	var length = 0;
	var dataOffset = 0;

	if (!(status & 0x80)) {
		if (runningStatus) {
			status = runningStatus;
		} else {
			throw new Error('Message does not start with status byte and no running status known.');
		}
	} else {
		length += 1;
		dataOffset += 1;
	}

	if (status === constants.META_EVENT) {
		if (buffer.length < 3) {
			return null;
		}
		length += buffer.readUInt8(2) + 2;
	} else {
		if (commands[status & 0xF0]) {
			length += commands[status & 0xF0].length;
		}
	}

	if (buffer.length < length) {
		return null;
	}

	var data = [];
	for (; dataOffset < length; dataOffset++) {
		data.push(buffer[dataOffset]);
	}

	return new Message(status, data, length);
};

module.exports = Message;