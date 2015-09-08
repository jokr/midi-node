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
	});
});
