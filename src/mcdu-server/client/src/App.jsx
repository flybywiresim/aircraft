import './App.css';
import React, { useState, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { McduScreen } from './McduScreen';
import { McduButtons } from './McduButtons';
import { WebsocketContext } from './WebsocketContext';

function App() {
    const [fullscreen, setFullscreen] = useState(window.location.href.endsWith('fullscreen'));
    const socketUrl = `ws://${window.location.hostname}:8080`;

    const [content, setContent] = useState(
        {
            lines: [
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
            ],
            scratchpad: '',
            title: '',
            titleLeft: '',
            page: '',
            arrows: [false, false, false, false],
        },
    );

    const {
        sendMessage,
        lastMessage,
        readyState,
    } = useWebSocket(socketUrl, {
        shouldReconnect: () => true,
        reconnectAttempts: Infinity,
        reconnectInterval: 500,
    });

    useEffect(() => {
        if (readyState === ReadyState.OPEN) {
            sendMessage('requestUpdate');
        }
    }, [readyState]);

    useEffect(() => {
        if (lastMessage != null) {
            const messageType = lastMessage.data.split(':')[0];
            if (messageType === 'update') {
                setContent(JSON.parse(lastMessage.data.substring(lastMessage.data.indexOf(':') + 1)).left);
            }
        }
    }, [lastMessage]);

    return (
        <div className={fullscreen ? 'fullscreen' : 'normal'}>
            <div className="App">
                <WebsocketContext.Provider value={{ sendMessage, lastMessage, readyState }}>
                    {!fullscreen && (
                        <>
                            <McduScreen content={content} />
                            <McduButtons />
                            <div className="button-grid" style={{ left: `${184 / 10.61}%`, top: `${158 / 16.50}%`, width: `${706 / 10.61}%`, height: `${60 / 16.50}%` }}>
                                <div className="button-row">
                                    <div className="button" title="Fullscreen" onClick={() => setFullscreen(!fullscreen)} />
                                </div>
                            </div>
                        </>
                    )}
                    {fullscreen && (
                        <div title="Exit fullscreen" onClick={() => setFullscreen(false)}>
                            <McduScreen content={content} />
                        </div>
                    )}
                </WebsocketContext.Provider>
            </div>
        </div>
    );
}

export default App;
