function mapChrom2Weights(chromosome, bitsPerWeight, numInputs, numHiddenLayerNodes, numOutputs) {
    if (!chromosome) { throw new Error("chromosome should be a string"); }
    let weightList = initializeWeightList(numInputs, numHiddenLayerNodes, numOutputs)

    // Add an empty space at the beginning of the string for the sake of using 1-based indexing
    chromosome  =  " " + chromosome
    
    // Calculate/store weights from input to hidden layer 1
    // First, determine where the bits representing the weights for hidden layer 1 end (add 1 to numInputs to include threshold)
    let hiddenLayer1BitsEnd = bitsPerWeight*(numInputs+1)*numHiddenLayerNodes
    let index = 1
    let node_num = 0
    let numWeightsPerCurNode = 0

    // While we are still looking at the bits representing wieghts going into hidden layer 1
    while (index < hiddenLayer1BitsEnd) {
        let weightBitString = chromosome.substring(index, index+bitsPerWeight);
        // weightList[0] accesses the data for weights going into hidden layer 1
        //console.log(index, weightBitString, weightList);
        weightList[0][node_num][numWeightsPerCurNode] = bin2Weight(weightBitString)
        numWeightsPerCurNode +=1
        // if we are at the end of the bits of weights per this node
        if (numWeightsPerCurNode == numInputs + 1) {
            node_num += 1
            numWeightsPerCurNode = 0
        }
        index += bitsPerWeight
    }

    //Calculate/store weights from hidden layer 1 to hidden layer 2
    //Add 1 to the calculation for the side of hidden layer 2 to include the threshold
    let hiddenLayer2BitsEnd = hiddenLayer1BitsEnd + numHiddenLayerNodes*(numHiddenLayerNodes + 1)*bitsPerWeight
    node_num = 0
    numWeightsPerCurNode = 0

    //While we are still looking at the bits representing wieghts going into hidden layer 2
    while (index < hiddenLayer2BitsEnd) {
        let weightBitString = chromosome.substring(index, index+bitsPerWeight);
        //weightList[1] accesses the data for weights going into hidden layer 2
        weightList[1][node_num][numWeightsPerCurNode] = bin2Weight(weightBitString)
        numWeightsPerCurNode +=1
        //if we are at the end of the bits of weights per this node
        if (numWeightsPerCurNode == numHiddenLayerNodes + 1) {
            node_num += 1
            numWeightsPerCurNode = 0
        }
        index += bitsPerWeight
    }

    //Calculate/store weights from hidden layer 2 to the output node
    let outputBitsEnd = hiddenLayer2BitsEnd + numOutputs*(numHiddenLayerNodes + 1)*bitsPerWeight
    node_num = 0
    numWeightsPerCurNode = 0

    //While we are still looking at the bits representing wieghts going into the output layer
    while (index < outputBitsEnd) {
        let weightBitString = chromosome.substring(index, index+bitsPerWeight);
        //weightList[2] accesses the data for weights to output node
        weightList[2][node_num][numWeightsPerCurNode] = bin2Weight(weightBitString)
        numWeightsPerCurNode +=1
        if (numWeightsPerCurNode == numHiddenLayerNodes + 1) {
            node_num += 1
            numWeightsPerCurNode = 0
        }
        index += bitsPerWeight
    }
    return weightList
}

function initializeWeightList(numInputs, numHiddenNodes, numOutputs) {
    let inputToHidden1Ws = []
    let hidden1ToHidden2Ws = []
    let hidden2ToOutputWs = []

    //Create structure for weights from input to hidden layer 1
    for (let i = 0; i < numHiddenNodes; i++) {
        //Initialize each weight connecting to hidden layer 1 node i as 0
        let curInputWs = []
        for (let j = 0; j < numInputs + 1; j++) { // +1 to include threshold
            curInputWs.push(0)
        }
        inputToHidden1Ws.push(curInputWs)
    }


    // Create structure for weights from hidden layer 1 to hidden layer 2
    for (let i = 0; i < numHiddenNodes; i++) {
        // Initialize each weight connecting to hidden layer 2 node i as 0
        let curInputWs = [];
        for (let j = 0; j < numHiddenNodes + 1; j++) { // +1 to include threshold
            curInputWs.push(0);
        }
        hidden1ToHidden2Ws.push(curInputWs);
    }

    //Create structure for weights from hidden layer 2 to the output layer
    for (let i = 0; i < numOutputs; i++) {
        //Initialize each weight connecting to output node i as 0
        let curInputWs = [];
        for (let j = 0; j < numHiddenNodes + 1; j++) { // +1 to include threshold
            curInputWs.push(0);
        }
        hidden2ToOutputWs.push(curInputWs);
    }

    let weightStructure = [inputToHidden1Ws, hidden1ToHidden2Ws, hidden2ToOutputWs]

    return weightStructure
}


function bin2Weight(binString) {

    const bitsPerWeight = binString.length

    const integer = parseInt(binString, 2)

    //Convert integer to a value between -3 and 3
    // E.g. bitsPerWeight = 8
    //  0 ... 128 ... 256
    // -3 ...  0  ...  3
    // intValue > 128 : intValue/128 > 1 and <=2 : 3*(intValue/128) > 3 <= 6
    // intValue < 128 : intValue/128 < 1 and >=0 : 3*(intValue/128) < 3 >= 0
    const product = 3/(2**(bitsPerWeight-1))

    const normalized_weight = integer * product - 3

    return normalized_weight
}

function testNetwork(inputList, weightList, numHiddenLayerNodes, numOutputs) {
    //Add -1 to be the threshold for the inputList
    inputList.push(-1)

    //Calculate output for each node in hidden layer 1
    let hiddenLayer1Outputs = calcHiddenLayerOutputs(inputList, weightList[0], numHiddenLayerNodes)
    //Add threshold for next layer
    hiddenLayer1Outputs.push(-1)

    //Calculate output for each node in hidden layer 2
    let hiddenLayer2Outputs = calcHiddenLayerOutputs(hiddenLayer1Outputs, weightList[1], numHiddenLayerNodes)
    //add threshold for next layer
    hiddenLayer2Outputs.push(-1)

    //Calculate output for final nodes
    let finalOutputs = []
    for (let outputWeightList of weightList[2]) {
        let finalOutput = calcOutputForNeuron(hiddenLayer2Outputs, outputWeightList) 
        finalOutputs.push(finalOutput)
    }

    return finalOutputs
}

function calcHiddenLayerOutputs(inputList, weightList, numHiddenLayerNodes) {
    let hiddenLayerOutputs = []

    for (let i = 0; i < numHiddenLayerNodes; i++) {
        let output = calcOutputForNeuron(inputList, weightList[i])
        hiddenLayerOutputs.push(output)
    }

    return hiddenLayerOutputs
}

function calcOutputForNeuron(inputList, weights) {
    //Compute the weighted sum of inputs
    let weightedSum = 0
    
    for (let j = 0; j < weights.length; j++) {
        let inputVal = inputList[j]
        weightedSum += inputVal * weights[j]
    }

    //Use the sigmoid function
    let output = sigmoid(weightedSum)
    
    return output
}

function sigmoid(s) { return 1 / (1 + Math.exp(-s)) }

export {
    mapChrom2Weights,
    initializeWeightList,
    bin2Weight,
    testNetwork,
    calcHiddenLayerOutputs,
    calcOutputForNeuron,
    sigmoid
}