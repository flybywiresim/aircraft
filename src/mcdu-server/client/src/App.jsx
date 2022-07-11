import './App.css';
import React, { useState, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { McduScreen } from './McduScreen';
import { McduButtons } from './McduButtons';
import { WebsocketContext } from './WebsocketContext';

function App() {
    const [fullscreen, setFullscreen] = useState(window.location.href.endsWith('fullscreen') || window.location.href.endsWith('43'));
    const [aspect43] = useState(window.location.href.endsWith('43'));
    const [dark, setDark] = useState(false);
    const [sound] = useState(window.location.href.endsWith('sound'));
    const socketUrl = `ws://${window.location.hostname}:__WEBSOCKET_PORT__`;

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

    let backgroundImageUrl = 'mcdu-a32nx.png';
    if (dark) {
        backgroundImageUrl = 'mcdu-a32nx-dark.png';
    }

    return (
        <>
            {!fullscreen && (
                <div className="normal">
                    <div className="App" style={{ backgroundImage: `url(${backgroundImageUrl})` }}>
                        <WebsocketContext.Provider value={{ sendMessage, lastMessage, readyState }}>
                            <McduScreen content={content} />
                            <McduButtons sound={sound} />
                            <div className="button-grid" style={{ left: `${184 / 10.61}%`, top: `${158 / 16.50}%`, width: `${706 / 10.61}%`, height: `${60 / 16.50}%` }}>
                                <div className="button-row">
                                    <div className="button" title="Fullscreen" onClick={() => setFullscreen(!fullscreen)} />
                                </div>
                            </div>
                            <div className="button-grid" style={{ left: '82%', top: '50%', width: '8%', height: '8%' }}>
                                <div className="button-row">
                                    <div className="button" title="Dark" onClick={() => setDark(!dark)} />
                                </div>
                            </div>
                        </WebsocketContext.Provider>
                    </div>
                </div>
            )}
            {fullscreen && (
                <div className={aspect43 ? 'fullscreen aspect43' : 'fullscreen'}>
                    <div className="App">
                        <WebsocketContext.Provider value={{ sendMessage, lastMessage, readyState }}>
                            <div title="Exit fullscreen" onClick={() => setFullscreen(false)}>
                                <McduScreen content={content} aspect43={aspect43} />
                            </div>
                        </WebsocketContext.Provider>
                    </div>
                </div>
            )}
        </>
    );
}

export default App;
