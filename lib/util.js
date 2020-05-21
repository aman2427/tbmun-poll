"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pick = void 0;

const pick = (object, ...props) => {
  const accumulator = {};

  for (const prop of props) {
    accumulator[prop] = object[prop];
  }

  return accumulator;
};

exports.pick = pick;