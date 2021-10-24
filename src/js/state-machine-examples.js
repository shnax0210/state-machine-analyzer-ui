exports.EXAMPLES = [
    {
        groupName: "Simple examples",
        elements: [
            {
                name: "Task workflow (simple state)",
                code: `/*
This is first example for emulation of working on some task. 

Here we have very simple state that consists from one variable with name "status".
There is single initial state where status="Open".

And there are a bunch of commands that change "status" variable.
*/

const stateMachineDefinition = {
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
};

facade.renderGraph(facade.createStateMachine(stateMachineDefinition));`
            },
            {
                name: "Task workflow (object state)",
                code: `/*
This is second example for emulation of working on some task. 

Here state is not just one variable but object named "task".
This object has two fields: "status" and "assignee".

And there are a bunch of commands that change "status" and "assignee" variable values.

But let's look to the states on final graph, there is one that may look not right:
task={
  status=InProgress,
  assignee=Nobody
}

Please check next examples to see what we can do with it.
*/

const stateMachineDefinition = {
    initialStates: [{
        task: {
            status: "Open",
            assignee: "Nobody"
        }
   }],
   commands: [
       {
            name: "AssignTask",
            handle: (state) => { state.task.assignee = "Somebody" }
       },
       {
            name: "UnAssignTask",
            handle: (state) => { if(state.task.status !== "InProgress") state.task.assignee = "Nobody" }
       },
       {
            name: "StartWorking",
            handle: (state) => { if(state.task.status === "Open") state.task.status = "InProgress" }
       },
       {
            name: "CompleteWorking",
            handle: (state) => { if(state.task.status === "InProgress" && state.task.assignee !== "Nobody") state.task.status = "Done" }
       },
       {
            name: "Reopen",
            handle: (state) => { if(state.task.status === "Done" || state.task.status === "InProgress") state.task.status = "Open" }
       }
   ]
};

facade.renderGraph(facade.createStateMachine(stateMachineDefinition));`
            },
            {
                name: "Task workflow (invalid state highlighting)",
                code: `/*
This is third example for emulation of working on some task. 

In previous example we found that state:
task={
  status=InProgress,
  assignee=Nobody
}

is not right. So here we define "isStateValid" function to check it.

As you may see from final graph there are only few states and our invalid state is colored red. 
This is because when state machine finds invalid state it stops and highlights the state with red.

However if you want not to stop state machine when it finds invalid state 
you can uncomment "continueOnInvalidState: true," line to achive it.
*/

const stateMachineDefinition = {
    initialStates: [{
        task: {
            status: "Open",
            assignee: "Nobody"
        }
   }],
   isStateValid: (state) => {
       if(state.task.status === "InProgress" && state.task.assignee === "Nobody") {
           return false;
       }
       
       return true;
   },
   /*continueOnInvalidState: true,*/
   commands: [
       {
            name: "AssignTask",
            handle: (state) => { state.task.assignee = "Somebody" }
       },
       {
            name: "UnAssignTask",
            handle: (state) => { if(state.task.status !== "InProgress") state.task.assignee = "Nobody" }
       },
       {
            name: "StartWorking",
            handle: (state) => { if(state.task.status === "Open") state.task.status = "InProgress" }
       },
       {
            name: "CompleteWorking",
            handle: (state) => { if(state.task.status === "InProgress") state.task.status = "Done" }
       },
       {
            name: "Reopen",
            handle: (state) => { if(state.task.status === "Done" || state.task.status === "InProgress") state.task.status = "Open" }
       }
   ]
}

facade.renderGraph(facade.createStateMachine(stateMachineDefinition));`
            },
            {
                name: "Task workflow (invalid state fix)",
                code: `/*
This is fourth example for emulation of working on some task. 

In previous example we highlighted invalid state.

Here we just fix "StartWorking" command handler in order to make the invalid state not possible.
*/

const stateMachineDefinition = {
    initialStates: [{
        task: {
            status: "Open",
            assignee: "Nobody"
        }
   }],
   isStateValid: (state) => {
       if(state.task.status === "InProgress" && state.task.assignee === "Nobody") {
           return false;
       }
       
       return true;
   },
   /*continueOnInvalidState: true,*/
   commands: [
       {
            name: "AssignTask",
            handle: (state) => { state.task.assignee = "Somebody" }
       },
       {
            name: "UnAssignTask",
            handle: (state) => { if(state.task.status !== "InProgress") state.task.assignee = "Nobody" }
       },
       {
            name: "StartWorking",
            handle: (state) => { if(state.task.status === "Open" && state.task.assignee !== "Nobody" ) state.task.status = "InProgress" }
       },
       {
            name: "CompleteWorking",
            handle: (state) => { if(state.task.status === "InProgress") state.task.status = "Done" }
       },
       {
            name: "Reopen",
            handle: (state) => { if(state.task.status === "Done" || state.task.status === "InProgress") state.task.status = "Open" }
       }
   ]
};

facade.renderGraph(facade.createStateMachine(stateMachineDefinition));`
            }
        ],
    },
    {
        groupName: "Advantage examples",
        elements: [
            {
                name: "Billing address update",
                code: `/*
This example with "chain usage. Please check documentation for details regarding chains.

Let's imagine a situation that there is a UI web page where a user inputs his billing address
and then press button "calculate taxes", after it front end makes an ajax call to backend server 
with the billing address, the backend server calculates taxes, update it in the user cart and return taxes back to the front end,
and then finally the front end updates the taxes UI

And let's imagine that there is no any prevention mechanism from pressing the button multiple times.
So user can put one billing address, press the button and then quickly put another billing address and press the button again. 
So second request will be sent to the server in time when first one is not finished yet.

Can we have inconsistent state in this case? Let's emulate it and see.

Here we have two addresses: ADDRESS1 and ADDRESS2.
And we create two chains (one per address), each consist from two commands: 
 - SetBillingAddress - emulates processing of the ajax call on backend server
 - UpdatePriceOnUi - emulates returning of calculated tax response via network and updating it on UI. 
 
As we can see after model running, there are two red states, 
each of them contains mismatch of taxes on UI and in the user cart on backend.

So that is why good practical is: disabling buttons after their pressing till completion of the operation started (by the button pressing);
*/

const ADDRESS1 = {
    name: "ADDRESS1",
    tax: 5
}

const ADDRESS2 = {
    name: "ADDRESS2",
    tax: 10
}

function createSetBillingAddressActionsChain(chainName, address) {    
    return [
       {
            name: "SetBillingAddress",
            isChainHead: true,
            chainName: chainName,
            handle: (state, chain) => { 
                state.cart.billingAddress = address;
                chain.state.tax = state.cart.billingAddress.tax;
                chain.addNextCommand("UpdatePriceOnUi");
            }
       },
       {
           name: "UpdatePriceOnUi",
           chainName: chainName,
           handle: (state, chain) => { 
               state.ui.tax = chain.state.tax;
           }
       }
    ]
}

const stateMachineDefinition = {
    initialStates: [{
        cart: {
            billingAddress: null
        },
        ui: {
            tax: 0
        }
   }],
   isStateValid(state) {
       if(Object.keys(state.activeChains).length === 0 && state.ui.tax !== state.cart.billingAddress.tax) {
           return false;
       }
       
       return true;
   },
   continueOnInvalidState: true,
   commands: [
       ...createSetBillingAddressActionsChain(1, ADDRESS1),
       ...createSetBillingAddressActionsChain(2, ADDRESS2),
   ]
};

facade.renderGraph(facade.createStateMachine(stateMachineDefinition));`
            }]
    }
]
