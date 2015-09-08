'use strict';

var assert = require('assert');
var fs = require('fs');
var Writer = require('../writer');

describe('writer', function () {
	it('should write a valid header to a file', function (done) {
		var file = fs.createWriteStream('./test/test');
		var writer = new Writer(file);
		assert.ok(writer.startFile(0, 1, 128, function () {
			assert.equal(file.bytesWritten, 14);
			done();
		}));
	});

	it('should write the start of a track to a file', function (done) {
		var file = fs.createWriteStream('./test/test');
		var writer = new Writer(file);
		assert.ok(writer.startTrack(null, function () {
			assert.equal(file.bytesWritten, 8);
			done();
		}));
	});

	it('should write an event to a file', function (done) {
		var file = fs.createWriteStream('./test/test');
		var writer = new Writer(file);
		assert.ok(writer.event(10, 0xFF, [0x58, 0x04, 0x04, 0x02, 0x30, 0x08], function () {
			assert.equal(file.bytesWritten, 8);
			done();
		}));
	});

	it('should write an note off event to a file', function (done) {
		var file = fs.createWriteStream('./test/test');
		var writer = new Writer(file);
		assert.ok(writer.noteOff(0x10, 0, 0x3c, 100, function () {
			assert.equal(file.bytesWritten, 4);
			done();
		}));
	});

	it('should write an note on event to a file', function (done) {
		var file = fs.createWriteStream('./test/test');
		var writer = new Writer(file);
		assert.ok(writer.noteOn(0x10, 1, 0x3c, 100, function () {
			assert.equal(file.bytesWritten, 4);
			done();
		}));
	});

	it('should write an end of track event to a file', function (done) {
		var file = fs.createWriteStream('./test/test');
		var writer = new Writer(file);
		assert.ok(writer.endOfTrack(0x10, function () {
			assert.equal(file.bytesWritten, 4);
			done();
		}));
	});

	it('should write with running status', function (done) {
		var file = fs.createWriteStream('./test/test');
		var writer = new Writer(file);
		assert.ok(writer.noteOn(0x10, 1, 0x3c, 100));
		assert.ok(writer.noteOn(0x0, 1, 0x3d, 100, function () {
			assert.equal(file.bytesWritten, 7);
			done();
		}));
	});

	after(function (done) {
		fs.unlink('./test/test', done);
	});
});
