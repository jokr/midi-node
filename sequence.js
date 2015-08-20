'use strict';

var Track = require('./track');

var constants = {
	START_OF_FILE: 0x4d546864 // MThd
};

var fileTypes = {
	TYPE_0: 0x0, // single track
	TYPE_1: 0x1 // multi track
};

function Sequence(params) {
	this.tracks = new Array(params.tracks);
	this.fileType = params.fileType;
	this.ticks = params.ticks;
}

Sequence.prototype.getTracks = function () {
	return this.tracks;
};

Sequence.prototype.getFileType = function () {
	return this.fileType;
};

Sequence.prototype.getTicks = function () {
	return this.ticks;
};

Sequence.fromBuffer = function (buffer) {
	var offset = 0;

	if (buffer.readUInt32BE(offset, false) !== constants.START_OF_FILE) {
		throw new Error("Expected start of file marker 'MThd'.");
	}
	offset += 4;

	if (buffer.readUInt32BE(offset) !== 0x6) {
		throw new Error('Invalid header size (expected 6 bytes).');
	}
	offset += 4;

	var fileType = buffer.readUInt16BE(offset);
	offset += 2;

	var tracks = buffer.readUInt16BE(offset);
	offset += 2;

	if (fileType === fileTypes.TYPE_0 && tracks !== 1) {
		throw new Error('Number of tracks mismatch file type (expected 1 track).');
	}

	var ticks = buffer.readUInt16BE(offset);
	offset += 2;

	var sequence = new Sequence({
		fileType: fileType,
		ticks: ticks,
		tracks: tracks
	});

	for (var i = 0; i < tracks; i++) {
		var track = Track.parseTrack(buffer.slice(offset));
		sequence.tracks[i] = track;
		offset += track.length();
	}

	return sequence;
};

Sequence.fromStream = function (stream) {
	return new Promise(function (resolve, reject) {
		stream.on('data', function (chunk) {
			try {
				resolve(Sequence.fromBuffer(chunk));
			} catch (error) {
				reject(error);
			}
		})
	});
};

Sequence.fromFile = function (filename) {
	return Sequence.fromStream(require('fs').createReadStream(filename, 'binary'));
};

module.exports = Sequence;
