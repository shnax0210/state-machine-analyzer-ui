const React = require('react');

const Showdown  = require('showdown');

function collectDocumentation() {
    const converter = new Showdown.Converter();
    const text = `@ReadmeFileContent@`;

    return converter.makeHtml(text);
}

function Documentation() {
    return <div dangerouslySetInnerHTML={{__html: collectDocumentation()}}/>
}

exports.Documentation = Documentation;
