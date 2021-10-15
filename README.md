# Base

It's a web application that allows modeling different systems as state machines, play with it, check available states and transactions and show its graph.
The application inspired by [TLA+](https://lamport.azurewebsites.net/tla/tla.html) 
and has a goal to provide something similar but written in javascript and thus more adoptable by developers.

The application functionality is separated into two repositories:
- [state-machine-analyzer](https://github.com/shnax0210/state-machine-analyzer) - repository with core functionality (core library) that can be used like [npm package](https://www.npmjs.com/package/state-machine-analyzer)
- [state-machine-analyzer-ui](https://github.com/shnax0210/state-machine-analyzer-ui) - repository with web UI of the application, depends on the `state-machine-analyzer` npm package.

# Try it out

- [Code editor](http://dev-support.org/state-machine/code-area)
- [Available examples](http://dev-support.org/state-machine/examples)
- [Documentation](http://dev-support.org/state-machine/documentation)

# How it works

## Base usage
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

### Human language description of state machine building process:
1. We remember `initalStates`, since they are fist states of our state machine that we build.

2. During first iteration, we apply each `command` to all `initalStates`. 
If `command` changes the passed to it state, than we create and remember state machine transaction for it (with same name as command one).
And if the changed state is new one (means we didn't see it before) - then we remember the state.

3. On next iteration we do the same but apply each `command` to the remembered states from previous iteration (instead of `initalStates`).

4. Ones we don't have remembered states from previous iteration we stop the loop and return remembered states and transactions.

### Javascript pseudo code description of state machine building process:
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

## Chain usage

There is one more concept called `chain`. To understand its purpose, lets consider next example of state machine definition without `chain`:

```javascript
{
    initialStates: [{
        number: 0
   }],
   commands: [
       {
            name: "command1",
            handle: (state) => { state.number = 1 }
       },
       {
            name: "command2",
            handle: (state) => { state.number = 2 }
       }
   ]
}
```

In this example, from the start we have `number=0` and there are two commands that updates the number to `1` and to `2` correspondingly.
`command1` and `command2` will be performed in all possible orders, so there will such scenarios:

{number: 0} -(command1)-> {number: 1} -(command2)-> {number: 2}
and
{number: 0} -(command2)-> {number: 2} -(command1)-> {number: 1}

But what if we want to have `command2` executed each time only after `command1`? There is such possibility by adding some flag to the state and conditions to the commands like this:

```javascript
{
    initialStates: [{
        number: 0,
        isCommand1Performed: false
   }],
   commands: [
       {
            name: "command1",
            handle: (state) => { 
                if(!state.command1IsPerformed) {
                    state.number = 1;
                    state.isCommand1Performed = true;
                }
            }
       },
       {
            name: "command2",
            handle: (state) => { if(state.isCommand1Performed) state.number = 2 }
       }
   ]
}
```

but it can become very complicated in case of many commands, so the same behaviour we can achieve with `chain`:

```javascript
{
    initialStates: [{
        number: 0
   }],
   commands: [
       {
            name: "command1",
            isChainHead: true,
            chainName: "chain1",
            handle: (state, chain) => { 
                state.number = 1 
                chain.addNextCommand("command2")
            }
       },
       {
            name: "command2",
            chainName: "chain1",
            handle: (state) => { state.number = 2 }
       }
   ]
}
```

There are extra properties called `activeChains` and `complitedChains` that are added to `state` and used for by internal chain mechanism.
As one more advantage chain has internal state that can be used to pass some data between commands in same chain, like: `chain.state.someProperty = "someValue""`
Also `chain` is executed only ones, if you need to execute it several times just generate several similar chains.

So `chain` adds ordering in commands execution, provides internal state and is executed only ones. It makes it convenient for threads emulation. 

# API
## Facade API

In the [Code editor](http://dev-support.org/state-machine/code-area) or [Available examples](http://dev-support.org/state-machine/examples) you have only one predefined variable called `facade`.
The `facade` is an object and its code can be found [here](https://github.com/shnax0210/state-machine-analyzer-ui/blob/main/src/js/state-machine-facade.js).
It contains next methods:
- `createStateMachine(input)` - creates [state machine](https://github.com/shnax0210/state-machine-analyzer/blob/main/cjs/state-machine.js) and returns it.
    * `input` - ether `state machine definition`, `transactions` or `transactional paths`;
- `renderGraph(stateMachine)` - render state machine graph
    * `stateMachine` - state machine created by `createStateMachine(input)`

## State machine definition API

State machine definition is an object that can be passed to `facade.createStateMachine(input)` method or to function with same name in [core library](https://github.com/shnax0210/state-machine-analyzer/blob/main/index.js) to create state machine.  It contains next properties:
- `initalStates` - required array of objects field. Has arbitrary API defined by end customer. The initial states will be used during fist iteration of state machine building process.
- `commands` - required array of objects field. Each command is applied to each state and forces transaction creation in case if the command changes the passed state. Command has next API:
    * `name` - required field. String will be used for transaction creation in case if the command will produce one.
    * `handle(state, chain)` - required field. Function that will be called for each possible state.
        * `state` - state object (during first iteration it will be a state from `initalStates` and then one from new faced states);
        * `chain` - optional parameter that is passed only in case of `chain` usage. It is an object with next API:
            * `state` - chain internal state, it's initialized by an empty object from the beginning and then can be used to pass any data between commands in same chain.
            * `addNextCommand(commandName)` - schedules passed command name for execution during next iteration;
            * `isNextCommand(commandName)` - checks if passed command name is already scheduled for execution during next iteration;
            * `hasNextCommands()`  - checks if there are at least one command scheduled for execution during next iteration;
            * `removeNextCommand(commandName)` - removes passed command name for execution during next iteration;
- `isStateValid(state)` - optional function field. Determines if state should be marked as `Valid` or `InValid`. `InValid` states and transactional paths to them are highlighted with on UI.
- `continueOnInvalidState` - optional boolean field. By default, state machine building will be stopped after first invalid state found. It can be avoided by setting this field to `true`;
- `isTransactionValid(transaction)` -  optional function field. Similar to `isStateValid(state)` but for transactions;
- `continueOnInvalidTransaction` -  optional boolean field. Similar to `continueOnInvalidState` but for transactions;
- `isChainHead` - optional boolean field. If set to true, the command creates a `chain` with name provided in `chainName` (must be provided with) if it's not already created;
- `chainName` - optional boolean field (required if `isChainHead` set to true). Identifies a chain. Commands with this filed are executed only in next cases: 
    * it's chain head (`isChainHead` is set to true) and chain with provided name is not created yet;
    * it was scheduled from another command with same chain name.

## State machine API

State machine can be created by `facade.createStateMachine(input)` function. It contains next properties:
- `getTransactions()` - returns all transactions of the state machine;
- `getWrappedStates()` - returns all states, each state is wrapped with object that contains some additional fields like unique `id` and `mark`.
- `findPathsToInvalidStates()` - finds transactional paths between initial and invalid states. Returns object contains information about found paths;
- `findPaths(destinationStates, sourceStates)` - finds transactional paths between passed states. Returns object contains information about found paths;
    * `destinationStates` - array that should contain wrapped destination states (states to find paths to);
    * `sourceStates` -  array that should contain wrapped source states (states to find paths from). The parameter is optional. if it's not passed initial states will be used instead.
    
## Transaction API

Transactions that can be fetched from state machine by `getTransactions()` method has next API:
- `id` - unique transaction identifier;
- `name` - is equal to `command` name (or chain name + command name in case of chains usage);
- `from` - wrapped state from which the transaction leads;
- `to` - wrapped state to which the transaction leads;
- `mark` - there cab be next marks:
    * InValid - identifiers invalid transactions (invalid transactions determined by `isTransactionValid(transaction)` method of state machine definition)
    * LeadsToInValid - identifiers transactions that are part of path to invalid states or transactions
    * Valid - identifiers valid transaction (all transactions that are not initial or invalid are valid ones)

## Wrapped state (or state wrapper) API

Wrapped states (or state wrappers) that can be fetched from state machine by `getWrappedStates()` method has next API:
- `id` - unique state identifier;
- `state` - real state object that is passed to `command.handle(state)` method. (`initalStates` also contains these real states, but not state wrappers)
- `mark` - there cab be next marks: 
    * Initial - identifiers initial states (ones that were passed as `initalStates` in state machine definition)
    * InValid - identifiers invalid states (invalid states determined by `isStateValid(state)` method of state machine definition)
    * Valid - identifiers valid states (all states that are not `Initial` or `InValid` are valid ones)

## State API

State is passed to `command.handle(state)` and contains arbitrary API that is defined in `initalStates` of state machine definition and can be anyhow changed in `command.handle(state)` method.
So you can define whatever state you want, except next properties:
- `activeChains` - the property can be added automatically in case of `chain` usage, and it contains currently active `chains` in this case.
- `complitedChains` - the property can be added automatically in case of `chain` usage, and it contains currently completed `chains` in this case.

## Transactional paths API

Transactional paths can be got by `findPathsToInvalidStates()` and `findPaths(destinationStates, sourceStates)` state machine methods.
The returned value is an object with next properties:
- `stat` - an object that represents statistic of found transactional paths, it has next API:
    * `count` - number of found transactional paths;
    * `minLength` - length of the shortest transactional paths;
    * `maxLength` - length of the longest transactional paths;
    * `allLengths` - an array of object with next API (objects are sorted from the lowest length to highest):
        * `length` - length of transactional paths;
        * `count` - number of transactional paths with same `length`;
- `getAll()` - returns an array of all transactional paths. So it's an array of arrays with transactions;
- `getMin()` - returns the shortest array of transactional paths. So it's an array of arrays with transactions;
- `getMax()` - returns the longest array of transactional paths. So it's an array of arrays with transactions;
