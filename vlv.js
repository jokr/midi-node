'use strict';

exports.fromBuffer = function (buffer) {
	var offset = 0;
	var value = 0;
	var byte;

	do {
		if (offset >= buffer.length) {
			throw new Error('Buffer not long enough for vlv.');
		}
		byte = buffer.readUInt8(offset);
		value |= byte & 0x7F;

		if (byte & 0x80) {
			value = value << 7;
			offset++;
		}
	} while (byte & 0x80);

	return value;
};

exports.toBuffer = function (value) {
	if (!value) {
		return new Buffer([0]);
	}

	var result = [];

	while (value !== 0) {
		result.push(value & 0x7f | 0x80);
		value = value >>> 7;
	}

	result[0] = result[0] & 0x7F;
	result = result.reverse();

	return new Buffer(result);
};