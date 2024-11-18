"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidDomainError = exports.ProxyUriSetError = exports.InvalidUserError = exports.InvalidStateError = exports.InvalidAuthTokenError = exports.InvalidAudioElementError = void 0;
// Errors
class InvalidAudioElementError extends Error {
    constructor() {
        super("Audio element must be a HTML element of type HTMLAudioElement");
    }
}
exports.InvalidAudioElementError = InvalidAudioElementError;
class InvalidAuthTokenError extends Error {
    constructor() {
        super("Authorization token must be set");
    }
}
exports.InvalidAuthTokenError = InvalidAuthTokenError;
class InvalidStateError extends Error {
    constructor(method, state) {
        super(`${method} not allowed in state ${state}`);
    }
}
exports.InvalidStateError = InvalidStateError;
class InvalidUserError extends Error {
    constructor(user) {
        super(`User ${user} is invalid`);
    }
}
exports.InvalidUserError = InvalidUserError;
class ProxyUriSetError extends Error {
    constructor() {
        super(`The proxy URI can not be set. Make sure to define proxy and port`);
    }
}
exports.ProxyUriSetError = ProxyUriSetError;
class InvalidDomainError extends Error {
    constructor() {
        super(`Invalid domain`);
    }
}
exports.InvalidDomainError = InvalidDomainError;
