# Base info

Web application that allows model different systems as state machines, play with it, check available states and transactions and show its graph.
The application inspired by [TLA+](https://lamport.azurewebsites.net/tla/tla.html) 
and has a goal to provide something similar but written in javascript and thus more adoptable by modern developers.

# Try it out

- [Code editor](http://dev-support.org/state-machine/code-area)
- [Available examples](http://dev-support.org/state-machine/examples)
- [Documentation](http://dev-support.org/state-machine/documentation)

# How it works

Result state machine consists from `states` (`stateMachine.getWrappedStates()`) and `transactions` (`stateMachine.getTransactions()`).
And can be built from `state machine definition`, like this one:

```javascript
{
   initialStates: [{
        status: "Open"
   }],
   commands: [
       {
            name: "StartWorking",
            handle: (state) => { if(state.status === "Open") state.status = "InProgress" }
       },
       {
            name: "CompleteWorking",
            handle: (state) => { if(state.status === "InProgress") state.status = "Done" }
       },
       {
            name: "Reopen",
            handle: (state) => { if(state.status === "Done" || state.status === "InProgress") state.status = "Open" }
       }
   ]
}
``` 

As we can see the `state machine definition` contains two properties `initialStates` and `commands`. 
There are some other possible properties as well, but these two are required and most essential ones.

In general, state machine building is an iterative process to obtain `states` and `transactions` from `initialStates` and `commands`.

## Human language description of state machine building process:
1. We remember `initalStates`, since they are fist states of our state machine that we build.

2. During first iteration, we apply each `command` to all `initalStates`. 
If `command` changes the passed to it state, than we create and remember state machine transaction for it (with same name as command one).
And if the changed state is new one (means we didn't see it before) - then we remember the state.

3. On next iteration we do the same but apply each `command` to the remembered states from previous iteration (instead of `initalStates`).

4. Ones we don't have remembered states from previous iteration we stop the loop and return remembered states and transactions.

## Javascript pseudo code description of state machine building process:
```javascript
function buildStatesAndTransactions(initialStates, commands) {
    const resultStates = initialStates;
    const resultTransactions = []

    let statesToProcess = initialStates;
    while(statesToProcess.length) {
        const newStates = [];
        
        commands.forEach(command => {
            statesToProcess.forEach(state => {
                const stateCopy = _.cloneDeep(state);

                command.handle(stateCopy);

                if(!_.isEqual(state, stateCopy)) {
                    resultTransactions.push({
                        name: command.name,
                        from: state,
                        to: stateCopy
                    });
                    if(!resultStates.includes(stateCopy)) {
                        newStates.push(stateCopy);
                        resultStates.push(stateCopy);
                    }
                }
           })
        })
        
        statesToProcess = newStates;
    }
    
    return [resultStates, resultTransactions];
}
```

In reality the code is a bit more complicated and can be found [here](https://github.com/shnax0210/state-machine-analyzer/blob/main/cjs/state-machine-transactions-builder.js).

# API
## Facade API

In the [Code editor](http://dev-support.org/state-machine/code-area) or [Available examples](http://dev-support.org/state-machine/examples) you will be able to access only one variable called `facade`.
The `facade` code can be found [here](https://github.com/shnax0210/state-machine-analyzer-ui/blob/main/src/js/state-machine-facade.js).
It contains next methods:
- `createStateMachine(input)` - creates state machine and return [it](https://github.com/shnax0210/state-machine-analyzer/blob/main/cjs/state-machine.js).
    * `input` - ether `state machine definition`, `transactions` or transactional `paths`;
- `renderGraph(stateMachine)` - render state machine graph
    * `stateMachine` - state machine created by `createStateMachine(input)`
    
## State machine API

State machine can be created by `facade.createStateMachine(input)` function. It contains next methods:
- `getTransactions()` - returns all transactions of the state machine;
- `getWrappedStates()` - returns all states, each state is wrapped with object that contains some additional fields like unique `id` and `mark`.
- `findPathsToInvalidStates()` - finds transactional paths between initial and invalid states. Returns object contains information about found paths;
- `findPaths(destinationStates, sourceStates)` - finds transactional paths between passed states. Returns object contains information about found paths;
    * destinationStates - array that should contain wrapped destination states (states to find paths to);
    * sourceStates -  array that should contain wrapped source states (states to find paths from). The parameter is optional. if it's not passed initial states will be used instead.
    
## Transaction API

Transaction that can be fetched from state machine by `getTransactions()` method has next API:
- `id` - unique transaction identifier;
- `name` - is equal to `command` name (or chain name + command name in case of chains usage);
- `from` - wrapped state from which the transaction is performed;
- `to` - wrapped state to which the transaction is performed;
