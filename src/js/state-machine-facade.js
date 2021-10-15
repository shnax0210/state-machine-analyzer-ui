const constants = require('./constans').constants;

const createStateMachine = require('state-machine-analyzer').createStateMachine;
const renderStateMachineGraph = require('./state-machine-graph').renderStateMachineGraph;

exports.facade = {
    createStateMachine: (input) => createStateMachine(input),
    renderGraph: (stateMachine) => renderStateMachineGraph(`#${constants.GRAPH_ID}`, stateMachine)
}
