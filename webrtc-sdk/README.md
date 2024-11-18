# FC+WebRTC

## Purpose

TypeScript library designed to enable developers to implement real-time voice calls from a browser to a phone, simplifying the integration of WebRTC technology into modern web applications.

## Features

Browser-to-Phone Connectivity: Enables real-time communication between web applications and phone systems.

Plug-and-Play SDK: Minimal setup required, making it easy to integrate into your project.

## Usage Example

```ts
import { Voice } from "@lumenccs/webrtc-sdk";
import React from "react";
import { getAWebToken } from "myApi";

const VoiceComponent = () => {
  const [voice] = React.useState<Voice>(new Voice({ user: "example" }));

  function handleCall() {
    getAWebToken("+16303838688", voice.getUser(), 1).then(async (token) => {
      voice.setAuth(token);
      if (voice.isStopped()) {
        await voice.start();
      }
      voice.call("+16303838688");
    });
  }

  return (
    <div>
      <button onClick={handleCall}>Call</button>
    </div>
  );
};
```

## Running the Sample App

First create a new file `sample-app/.env` with the following values to be defined:

```
REACT_APP_LUMENCCS_ACCOUNT_ID=
REACT_APP_LUMENCCS_API_KEY=
REACT_APP_LUMENCCS_NUMBER_TO_DIAL=
```

Remember the REACT_APP_LUMENCCS_NUMBER_TO_DIAL should be in e.164 form.

Then, run the following commands to launch the UI:

```sh
cd sample-app
yarn install
yarn start
```

## Project status

Ongoing testing & development is taking place. Initial steps to introduce to a production environment are underway.

If you have any questions or want to become a contributor reach out to me at wjones@vailsys.com or just message me on teams.
