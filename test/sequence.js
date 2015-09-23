'use strict';

var assert = require("assert");
var Sequence = require('../sequence');

describe('parse a sequence from a buffer', function () {
	it('should parse a sequence with 1 track', function () {
		var midi = new Buffer(
			'4d54686400000006000000010080' + // File header
			'4d54726b0000000400ff2f00', // Empty track
			'hex');

		var sequence = Sequence.fromBuffer(midi);
		assert.equal(sequence.getTracks().length, 1, "Expected one track.");
		assert.equal(sequence.getFileType(), 0, "Expected file type 0.");
		assert.equal(sequence.getTicks(), 128, "Expected 128 ticks.");
		var track = sequence.getTracks()[0];
		assert.equal(track.size, 4, "Expected track size 4.");
		assert.equal(track.events.length, 1, "Expected one event.");
		assert.equal(track.complete, true, "Expected track to be complete.");
	});

	it('should parse a sequence with 1 track and multiple events', function () {
		var midi = new Buffer(
			'4d54686400000006000000010080' + // File header
			'4d54726b0000000c' + // track header
			'00ff580404026008' + // tempo set to 105 bpm
			'00ff2f00', // End of track
			'hex');

		var sequence = Sequence.fromBuffer(midi);
		assert.equal(sequence.getTracks().length, 1, "Expected one track.");
		assert.equal(sequence.getFileType(), 0, "Expected file type 0.");
		assert.equal(sequence.getTicks(), 128, "Expected 128 ticks.");
		var track = sequence.getTracks()[0];
		assert.equal(track.size, 12, "Expected track size 12.");
		assert.equal(track.events.length, 2, "Expected two events.");
		assert.equal(track.complete, true, "Expected track to be complete.");
	});

	it('should parse a sequence with 1 track and multiple events with large delta', function () {
		var midi = new Buffer(
				'4d54686400000006000000010080' + // File header
				'4d54726b0000000c' + // track header
				'Da824fff580404026008' + // tempo set to 105 bpm
				'Da824fff2f00', // End of track
				'hex');

		var sequence = Sequence.fromBuffer(midi);
		assert.equal(sequence.getTracks().length, 1, "Expected one track.");
		assert.equal(sequence.getFileType(), 0, "Expected file type 0.");
		assert.equal(sequence.getTicks(), 128, "Expected 128 ticks.");
		var track = sequence.getTracks()[0];
		assert.equal(track.size, 12, "Expected track size 12.");
		assert.equal(track.events.length, 2, "Expected two events.");
		assert.equal(track.complete, true, "Expected track to be complete.");

		assert.equal(track.events[0].delta, 1474895);
		assert.equal(track.events[1].delta, 1474895);
	});

	it('should parse a sequence with 1 track and a running status', function () {
		var midi = new Buffer(
			'4d54686400000006000000010080' + // File header
			'4d54726b0000000b' + // track header
			'00803c64' + // note off
			'003c64' + // note off
			'00ff2f00', // End of track
			'hex');

		var sequence = Sequence.fromBuffer(midi);
		assert.equal(sequence.getTracks().length, 1, "Expected one track.");
		assert.equal(sequence.getFileType(), 0, "Expected file type 0.");
		assert.equal(sequence.getTicks(), 128, "Expected 128 ticks.");
		var track = sequence.getTracks()[0];
		assert.equal(track.size, 11, "Expected track size 12.");
		assert.equal(track.events.length, 3, "Expected three events.");
		assert.equal(track.complete, true, "Expected track to be complete.");
	});


	it('should parse a sequence with 2 tracks and multiple events', function () {
		var midi = new Buffer(
			'4d54686400000006000100020080' + // File header
			'4d54726b0000000c' + // track header
			'00ff580404026008' + // tempo set to 105 bpm
			'00ff2f00' + // End of track
			'4d54726b00000004' + // track header
			'00ff2f00', // End of track
			'hex');

		var sequence = Sequence.fromBuffer(midi);
		assert.equal(sequence.getTracks().length, 2, "Expected two tracks.");
		assert.equal(sequence.getFileType(), 1, "Expected file type 1.");
		assert.equal(sequence.getTicks(), 128, "Expected 128 ticks.");

		var track = sequence.getTracks()[0];
		assert.equal(track.size, 12, "Expected track size 12.");
		assert.equal(track.events.length, 2, "Expected two events.");
		assert.equal(track.complete, true, "Expected track to be complete.");

		track = sequence.getTracks()[1];
		assert.equal(track.size, 4, "Expected track size 4.");
		assert.equal(track.events.length, 1, "Expected one event.");
		assert.equal(track.complete, true, "Expected track to be complete.");
	});
});

describe('parse a sequence from a file', function () {
	it('should parse a sequence with 2 tracks and multiple events', function (done) {
		Sequence.fromFile('test/supermario.mid', function (error, sequence) {
			assert.ifError(error);
			assert.equal(sequence.getTicks(), 96, 'Expected 96 ticks.');
			assert.equal(sequence.getTracks().length, 1, 'Expected 1 track.');

			var track = sequence.getTracks()[0];
			assert.equal(track.complete, true, 'Expected complete track.');
			assert.equal(track.events.length, 604, 'Expected 604 events.');
			done();
		});
	});
});