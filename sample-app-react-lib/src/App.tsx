import React, { ReactNode, useCallback } from 'react'
import axios from 'axios';
import {useCall, useCallAudioRef } from '@lumenccs/webrtc-react'
import './app.css'

const ACCOUNT_ID = process.env.REACT_APP_ACCOUNT_ID;
const API_KEY = process.env.REACT_APP_API_KEY;
const TOKEN_URL = process.env.REACT_APP_TOKEN_URL;
const NUMBER_TO_DIAL = process.env.REACT_APP_NUMBER_TO_DIAL;

const CENTERED_ASTERISK = String.fromCharCode(parseInt("2217", 16));
const DIGITS: Array<number | string> = [1, 2, 3, 4, 5, 6, 7, 8, 9, CENTERED_ASTERISK, 0, "#"];
const DIGIT_TO_SUBDIGIT_MAP: Map<number | string, string> = new Map()
  .set(2, "ABC")
  .set(3, "DEF")
  .set(4, "GHI")
  .set(5, "JKL")
  .set(6, "MNO")
  .set(7, "PQRS")
  .set(8, "TUV")
  .set(9, "WXYZ")
  .set(0, "+")
  .set(CENTERED_ASTERISK, "‘")
  .set("#", ";");

function App() {
  const { call, hangup, sendDTMF, callState, voiceClient, error } = useCall();
  const ref = useCallAudioRef();

  const handleCall = useCallback(() => {
    if(!NUMBER_TO_DIAL) {
      throw new Error("ADD A NUMBER TO DIAL");
    }

    getToken(NUMBER_TO_DIAL, voiceClient.getUser(), 1).then((token) => {
      if(callState === "PENDING" || callState === "ENDED") {
        call(NUMBER_TO_DIAL, token);
      }
    })
  }, [callState])

  const handleHangUp = useCallback(() => {
    if(callState === "IN_PROGRESS") {
      hangup();
    }
  }, [callState])

  const handleSendDtmf = useCallback((digit: number) => {
    if(callState === "IN_PROGRESS") {
      sendDTMF(digit)
    }
  }, [callState])

  function renderButtonsForColNumber(colNumber: 1 | 2 | 3): Array<ReactNode> {
    const nodes: Array<ReactNode> = [];
    for (let i = colNumber - 1; i < DIGITS.length; i += 3) {
      const digit = DIGITS[i];
      nodes.push(
        <button
          key={`digit_${digit}`}
          id={`digit_${digit}`}
          className="c-dtmfButton"
          // TODO: update sendDTMF to accept * and #
          onClick={typeof digit !== 'string' ? () => handleSendDtmf(digit) : undefined}
          disabled={typeof digit === 'string'}
        >
          {digit}
          <div className='c-dtmfButtonSubtext'>
            {DIGIT_TO_SUBDIGIT_MAP.get(digit)}
          </div>
        </button>,
      );
    }
    return nodes;
  }

  return (
      <div className='c-app'>
        <div className='c-appContent'>
          <audio ref={ref} />
          <div className="c-header">
            <div className="c-display">
              <div className="">{NUMBER_TO_DIAL}</div>
            </div>
            <div className="c-status">
              {callState}
            </div>
          </div>
          <div className='c-dtmfContainer'>
            <div className='c-col'>{renderButtonsForColNumber(1)}</div>
            <div className='c-col'>{renderButtonsForColNumber(2)}</div>
            <div className='c-col'>{renderButtonsForColNumber(3)}</div>
          </div>
          <div>
            <button 
              onClick={handleCall}
            >
              Execute Call
            </button>
            <button 
              onClick={handleHangUp}
            >
              Hang up
            </button>
          </div>
        </div>
      </div>
  );
}

async function getToken(to: string, from: string,  uses: number): Promise<string> {
  if(ACCOUNT_ID === undefined || API_KEY === undefined || TOKEN_URL === undefined) {
    throw new Error("Be sure to make and fill out a .env that includes REACT_APP_TOKEN_URL, REACT_APP_ACCOUNT_ID, & REACT_APP_API_KEY")
  }

  const resp = await axios.post(`https://${TOKEN_URL}/apiserver/Accounts/${ACCOUNT_ID}/Calls/WebRTC/Token`, {
      to: to,
      from: from,
      uses: uses,
    },
    { auth: {
      username: ACCOUNT_ID,
      password: API_KEY,
    },
  })

  return resp.data
}

export default App;