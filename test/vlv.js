'use strict';

var assert = require('assert');
var vlv = require('../vlv');

describe('variable length values', function () {
	it('should parse a variable length value smaller than 0x80', function () {
		var buffer = new Buffer('53', 'hex'); // 0101 0011
		assert.equal(vlv.fromBuffer(buffer), 0x53);
	});

	it('should parse a variable length value larger than 0x80', function () {
		var buffer = new Buffer('8253', 'hex'); // 1000 0010 0101 0011
		assert.equal(vlv.fromBuffer(buffer), 0x153);
	});

	it('should write a variable length value smaller than 0x80', function () {
		var value = 0x53;
		var buffer = vlv.toBuffer(value);
		assert.equal(buffer.length, 1);
		assert.equal(buffer[0], 0x53);
	});

	it('should write a variable length value larger than 0x80', function () {
		var value = 0x153;
		var buffer = vlv.toBuffer(value);
		assert.equal(buffer.length, 2);
		assert.equal(buffer[0], 0x82);
		assert.equal(buffer[1], 0x53);
	});

	it('should parse a long variable length value', function () {
		var value = 1474895;
		var buffer = vlv.toBuffer(value);
		assert.equal(buffer.length, 3);
		assert.equal(buffer[0], 0xDA);
		assert.equal(buffer[1], 0x82);
		assert.equal(buffer[2], 0x4F);
	});

	it('should write a long variable length value', function () {
		var buffer = new Buffer('DA824F', 'hex');
		assert.equal(vlv.fromBuffer(buffer), 1474895);
	});
});