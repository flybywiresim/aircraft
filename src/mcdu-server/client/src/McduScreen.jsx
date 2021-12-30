import React from 'react';
import './McduScreen.css';

function escapeHTML(unsafeText) {
    const div = document.createElement('div');
    div.innerText = unsafeText;
    return div.innerHTML;
}

function formatCell(str) {
    return escapeHTML(str)
        .replace(/{big}/g, "<span class='b-text'>")
        .replace(/{small}/g, "<span class='s-text'>")
        .replace(/{big}/g, "<span class='b-text'>")
        .replace(/{amber}/g, "<span class='amber'>")
        .replace(/{red}/g, "<span class='red'>")
        .replace(/{green}/g, "<span class='green'>")
        .replace(/{cyan}/g, "<span class='cyan'>")
        .replace(/{white}/g, "<span class='white'>")
        .replace(/{magenta}/g, "<span class='magenta'>")
        .replace(/{yellow}/g, "<span class='yellow'>")
        .replace(/{inop}/g, "<span class='inop'>")
        .replace(/{sp}/g, '&nbsp;')
        .replace(/{left}/g, "<span class='left'>")
        .replace(/{right}/g, "<span class='right'>")
        .replace(/{end}/g, '</span>');
}

const Line = ({ label, cols }) => (
    <div className="line">
        <span className={`fmc-block ${label ? 'label' : 'line'} line-left`} dangerouslySetInnerHTML={{ __html: formatCell(cols[0]) }} />
        <span className={`fmc-block ${label ? 'label' : 'line'} line-right`} dangerouslySetInnerHTML={{ __html: formatCell(cols[1]) }} />
        <span className={`fmc-block ${label ? 'label' : 'line'} line-center`} dangerouslySetInnerHTML={{ __html: formatCell(cols[2]) }} />
    </div>
);

export const McduScreen = ({ content }) => {
    const lines = [];
    for (let i = 0; i < content.lines.length; i++) {
        lines.push(<Line label={i % 2 === 0} cols={content.lines[i] || ['', '', '']} />);
    }
    return (
        <div className="screen" xmlns="http://www.w3.org/1999/xhtml">
            <Line cols={['', '', '']} />
            <span className="arrow-horizontal" dangerouslySetInnerHTML={{ __html: `${content.arrows[2] ? '←' : '\xa0'}${content.arrows[3] ? '→' : '\xa0'}\xa0` }} />
            <Line cols={[content.titleLeft, content.page, content.title]} />
            {lines}
            <Line cols={[content.scratchpad, `${content.arrows[1] ? '↓' : ' '}${content.arrows[0] ? '↑' : ' '}`, '']} />
        </div>
    );
};
