'use strict';

exports.fromBuffer = function (buffer) {
	var delta = buffer.readUInt8(0);

	if (delta & 0x80) {
		// we will have to read two bytes
		var leftValue = (delta & 0x7F) << 7;
		var rightValue = buffer.readUInt8(1);
		return leftValue | rightValue;
	} else {
		return delta;
	}
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