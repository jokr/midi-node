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
	this.tracks = [];
	this.noTracks = params.noTracks;
	this.fileType = params.fileType;
	this.ticks = params.ticks;
}

Sequence.prototype.addTrack = function (track) {
	if (this.tracks.length >= this.noTracks) {
		console.warn('Tracks exceed specified number of tracks in header field.');
	}
	this.tracks.push(track);
};

Sequence.prototype.getTracks = function () {
	return this.tracks;
};

Sequence.prototype.getFileType = function () {
	return this.fileType;
};

Sequence.prototype.getTicks = function () {
	return this.ticks;
};

/**
 *
 * @param buffer
 * @returns {Sequence}
 */
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

	var noTracks = buffer.readUInt16BE(offset);
	offset += 2;

	if (fileType === fileTypes.TYPE_0 && noTracks !== 1) {
		throw new Error('Number of tracks mismatch file type (expected 1 track).');
	}

	var ticks = buffer.readUInt16BE(offset);
	offset += 2;

	var sequence = new Sequence({
		fileType: fileType,
		ticks: ticks,
		noTracks: noTracks
	});

	for (var i = 0; i < noTracks; i++) {
		var track = Track.parseTrack(buffer.slice(offset));
		sequence.addTrack(track);
		offset += track.length();
	}

	return sequence;
};

/**
 * Returns a promise of a midi sequence read directly from a stream.
 * @param stream
 * @see https://nodejs.org/api/stream.html
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */
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

/**
 * Returns a promise of a midi sequence read directly from a file.
 * @param filename
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */
Sequence.fromFile = function (filename) {
	return Sequence.fromStream(require('fs').createReadStream(filename, 'binary'));
};

module.exports = Sequence;
