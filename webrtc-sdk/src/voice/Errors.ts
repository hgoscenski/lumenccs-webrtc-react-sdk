import { VoiceState } from "./Voice"

// Errors
export class InvalidAudioElementError extends Error {
  constructor() {
    super("Audio element must be a HTML element of type HTMLAudioElement")
  }
}

export class InvalidAuthTokenError extends Error {
  constructor() {
    super("Authorization token must be set")
  }
}

export class InvalidStateError extends Error {
  constructor(method: string, state: VoiceState) {
    super(`${method} not allowed in state ${state}`)
  }
}

export class InvalidUserError extends Error {
  constructor(user: string | undefined) {
    super(`User ${user} is invalid`)
  }
}

export class ProxyUriSetError extends Error {
  constructor() {
    super(`The proxy URI can not be set. Make sure to define proxy and port`)
  }
}

export class InvalidDomainError extends Error {
  constructor() {
    super(`Invalid domain`)
  }
}