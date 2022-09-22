//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

export function genPopulation(popSize, numBits) {

    const chromosomes = []

    for (let i = 0; i < popSize; i++) {
        let chromosome = "";

        for (let j = 0; j < numBits; j++) {
            let bit = getRandomInt(0, 2);
            chromosome += bit;
        }
        chromosomes.push(chromosome)
    }

    return chromosomes
}

export function createNextGeneration(parentPop, fitnessScores) {
    // Assign fitness scores
    const { fitnessRouletteCutoffs, bestIndividual, bestFitness, averageFitness, fitnessRatios } = 
        assignFitnessRatios(parentPop, fitnessScores)

    const childPop = []

    // Save the best individuals from the previous generation
    const bestParents = extractBestParents(parentPop, fitnessScores)

    // Create a child population the same size as the parent population
    for (let i = 0; i < parentPop.length - bestParents.length; i++) { // CHECK
        // Selection
        let selectedPair = selection(parentPop, fitnessRouletteCutoffs)
        // Crossover
        let child = crossOver(selectedPair)
        // Mutation
        child = mutation(child)

        childPop.push(child)
    }

    for (let parent of bestParents) {
        // Combine the best parents from the old generation with the new generation
        childPop.push(parent.chromosome);
    }

    return { 
        next_generation: childPop, 
        best_individual: bestIndividual, 
        best_fitness: bestFitness, 
        average_fitness: averageFitness,
        fitnessRatios: fitnessRatios,
        fitnessRouletteCutoffs: fitnessRouletteCutoffs,
        bestParents: bestParents,
    }
}

export function assignFitnessRatios(parentPop, fitnessScores) {
    // Get data about the fitness scores
    const bestFitness = Math.max(...fitnessScores)
    const bestIndividual = parentPop[fitnessScores.indexOf(bestFitness)]
    const totalScore = fitnessScores.reduce((sum, a) => sum + a, 0);
    if (totalScore <= 0) { throw new Error("total score cannot be <= zero: " + totalScore); }
    const averageFitness = totalScore/fitnessScores.length;
    
    // Calculate the fitness ratios
    // Each score in the list of fitness ratios corresponds to
    // the chromosome in the parentPop list at the same index
    const fitnessRatios = []

    for (let score of fitnessScores) {
        let ratio = score / totalScore;
        fitnessRatios.push(ratio);
    }

    // Get the cutoffs for roulette wheel selection
    // each cutoff corresponds to the chromosome in the parentPop list at the same index
    // https://stackoverflow.com/questions/20477177/creating-an-array-of-cumulative-sum-in-javascript
    const fitnessRouletteCutoffs = fitnessRatios.map((sum => value => sum += value)(0));

    return { fitnessRouletteCutoffs, bestIndividual, bestFitness, averageFitness, fitnessRatios }
}

export function extractBestParents(parentPop, fitnessScores) {
    const fitnessScoresCopy = [...fitnessScores];
    fitnessScoresCopy.sort((a, b) => a - b);

    const maxIndex = fitnessScores.length - 1

    const bestScoresCutoffIndex = Math.round(maxIndex * (1/2));

    // Get a cutoff value for the median fitness score
    const bestScoresCutoff = fitnessScoresCopy[bestScoresCutoffIndex]

    const bestParents = []

    // Find the chromsomes with fitness scores above the cutoff
    for (let i = 0; i < parentPop.length; i++) {
        if (fitnessScores[i] > bestScoresCutoff) {
            bestParents.push({ chromosome: parentPop[i], index: i, fitness: fitnessScores[i] })
        }
    }
    return bestParents
}

export function selection(parentPop, fitnessRouletteCutoffs) {
    const pair = []
    
    // Select two individuals randomly from the parent population to mate
    for (let i = 0; i < 2; i++) {
        // Get a random value between 0 and 1
        let randVal = Math.random()

        for (let i = 0; i < fitnessRouletteCutoffs.length; i++) {
            let cutoff = fitnessRouletteCutoffs[i];
            // If the random value is less than the cutoff, then select the 
            // chromosome in the parent population with the corresponding index
            if (randVal < cutoff) {
                pair.push(parentPop[i]);
                break;
            }
        }
    }

    return pair;
}

export function crossOver(pair) {
    // Randomly determine which chromosome that is crossed over at the first
    // half and which is cross over at the second half

    const randVal = getRandomInt(0, 2);
    let startWithFirst = true
    if (randVal == 0) {
        startWithFirst = false
    }

    // Randomly determine the crossover point
    // Start by getting the number of bits in an individual chromosome
    const numBits = pair[0].length
    const crossOverPoint = getRandomInt(0, numBits);

    // Create child offpsring with crossover
    let child = ""
    if (startWithFirst) {
        // If the crossoverpoint is past the final bit, no need for concatenation
        if (crossOverPoint == numBits - 1) {
            child = pair[1]
        } else {
            child = pair[0].substring(0, crossOverPoint) + pair[1].substring(crossOverPoint);
        }
    } else {
        // If the crossoverpoint is past the final bit, no need for concatenation
        if (crossOverPoint == numBits - 1) {
            child = pair[0]
        } else {
            child = pair[1].substring(0, crossOverPoint) + pair[0].substring(crossOverPoint);
        }
    }

    return child
}

export function mutation(chromosome) {
    // Probability each bit is mutated
    const MUTATION_RATE = .008
    // Convert the chromsome bit string into a list
    let bitArray = chromosome.split('');
    for (let i = 0; i < bitArray.length; i++) { // CHECK

        let randVal = Math.random();

        // If the random chance of mutation occured
        if (randVal < MUTATION_RATE) {
            // Flip the bit
            if (bitArray[i] == "0") {
                bitArray[i] = "1";
            } else {
                bitArray[i] = "0";
            }
        }
    
    }

    const newString = bitArray.join('')

    return newString
}