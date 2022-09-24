# Overview

### Context

1. [Demo](#demo)
2. [About](#about)
3. [Objective](#objective)
4. [The nitty-gritty](#the-nitty-gritty)
5. [Training the neural networks](#training-the-neural-networks)
   - [Genetic Algorithm](#genetic-algorithm)
     - [Fitness function used for GA](#fitness-function-used-for-ga)
     - [Selection, crossover, and mutation implementations](#selection-crossover-and-mutation-implementations)
6. [Results](#results)
7. [Conclusion](#conclusion)

## Demo

<br>

### Training snake agent

https://user-images.githubusercontent.com/90083668/191706530-2344e53e-18b8-42cc-a2a4-12609ff445cd.mp4

<br>

### Testing snake agent

https://user-images.githubusercontent.com/90083668/191706424-1ae1a367-f081-426a-bb87-027ff4fadaca.mp4

<br>

## About

Snake is a popular game where player controls the snake within the matrix/grid and keep it inside that grid to maximize the score. The score increases when the snake eats fruit appearing on screen. These fruits appear at random positions one at a time. Everytime the snake eats a fruit, it grows in size and thus making the game difficult. The player loses the game when either of these conditions are met:

- The snake crashes into the wall.
- The snake crashes into its own body.

<br>

## Objective

To create an autonomous snake agent to perform the necessary functions to maximize the score in the game.

<br>

## The nitty-gritty

I coded the game for myself so I can understand the functions aspects of the game and make developing the intelligent agents easier. It was accomplished using modules from [three.js](https://threejs.org/). The game can be accessed [here](https://snakecatch.blob.core.windows.net/$web/index.html){:target="\_blank"} and click **PLAY** (manual)

Once the game was created, I needed to develop an algorithm through which the snake can make intelligent decisions. I decided to perform the decisions based on the direction the snake turns. This was accomplished using neural network with two hidden layers, each with 10 nodes. Here are the inputs:

- [Manhattan Distance](https://iq.opengenus.org/manhattan-distance/#:~:text=Manhattan%20distance%20is%20a%20distance,all%20dimensions%20of%20two%20points.) from snake's head to the fruit in all 4 directions.
- The amount of available space left in the grid if the snake decides to move in each of the 4 directions (used [BFS](https://www.hackerearth.com/practice/algorithms/graphs/breadth-first-search/tutorial/) to achieve these movements).
- The length of the snake.

**The inputs relating to the amount of available space are not as intuitive as the others, so let's look at a particular example state of the game:**

<br>

<img src="docs/errorCase.png?raw=true" width="60%">

<br>
The head of the snake is indicated by the dark green block with eyes. The other green blocks are parts of the snake's body. The amount of available space if it moves in any direction in the next frame once it eats the fruit is 0, since the head will hit its own body no matter in which direction it moves, the game ends. The amount of available space if it goes left or right in the next frame is 3, since there are 3 open spaces enclosed around the snake's body in that direction. Finally, the amount of available space if it decides to go right in the next frame is 46, because this is the amount of spaces left in the grid that are not closed off by its body. But even with so many open spaces, the test case still fails.

<br>
As for the outputs of the network, there are four nodes each representing a decision to move up, down, left or right. Each decision for each direction is a value between 0 and 1, and the snake moves in the direction that has the highest value associated with it (between 0 and 1).

<br>
It is worth noting that the snake agent performed the best with this input/output scheme, but many other frameworks were tried and tested. For example, originally the neural network did not calculate the amount of available space with BFS. Instead, there were four inputs to determine if there was a wall directly next to the snake in each of the four directions, and four more inputs to determine if there was a body part of the snake in each of the four directions. These inputs did not allow the snake to plan an optimal path far in advance, so the snake agents performed better when it could see how much space it has to move around in for each direction.

<br>

## Training the neural networks

Since the agent needed to learn the movements from scratch, the NN was trained by learning its weights using a genetic algorithm.

<figure>
<img src="docs/data.jpg?raw=true" width="70%">
<figcaption align = "center">Neural Network and Dataflow</figcaption>
</figure>

- ## Genetic Algorithm

  - A genetic algorithm (GA) is a type of algorithm that achieves learning through emulating the process of natural selection in nature. This involves creating an initial population of randomly generated chromosomes, each of which are bit strings consisting all values of 0 or 1. Later, these bit strings are systematically decoded into the parameters that are being learned, such as the weights for the neural network in the case of this game. The population then undertakes a series of four processes to simulate natural selection, which are as follows: Fitness Calculations, Selection, Crossover, and Mutation.

    1. **Fitness Calculations**
       - Involves letting the game play for each chromosome in the population, and assigning a score to each chromosome based on a predetermined fitness function.
       - The fitness function determines how well the agent performed with a given chromosome.
    2. **Selection**
       - After all of the fitness scores have been calculated for a population, two chromosomes are (usually) selected in a "roulette-wheel" fashion to be used for crossover. In other words, chromosomes with higher fitness scores are more likely to be selected for crossover.
    3. **Crossover**
       - Crossover is the process of creating new chromosomes to be used for the population in the next generation. It involves using some bits from each of the two chromosomes picked in selection to create a child chromosome.
    4. **Mutation**
       - For each new child chromosome, each bit has a random chance of being "mutated", i.e. flipped from 0 to 1 or from 1 to 0.
       - Mutation is necessary to prevent the population from being stuck at a local maximum.

    <br>
    For sake of clarity, first all of the fitness calculations occur for a population. Then the processes of selection, crossover, and mutation occur in sequence until there is a population of child chromosomes equal to the chromosomes in the original population with traditional methods. However, the GA created for this project used a slightly different approach, where the half of the population with the highest fitness scores was merged with the newly generated child chromosomes. This is formally known as the (n+n) method. Then, this whole process of creating a new generation of chromosomes repeats indefinitely until intelligent agents that use the parameters from chromosomes in the population start to emerge.

    <br>

    ### Fitness function used for GA

    The genetic algorithm was run many different times with many different fitness functions. Formulaically, the first fitness function was:

    `((score**3)*(frame_score)`

    Score is equivalent to the length of the snake subtracted by 1 (since the snake always starts at len 1), and frame_score is the amount of frames that the snake was alive. However, originally this fitness function resulted in many snakes that looped in circles endlessly without eating any fruit to maximize the frame_score component of the function. Thus, the training was modified such that all snakes are killed off if they do not eat a fruit in 50 frames. Also, if a snake died due to not eating any fruit for 50 frames, 50 points were subtracted from the frame_score to discourage the behavior even further.

    Then, after 570 generations, the fitness function was manually changed to be:

    `((score*2)**2)*(frame_score**1.5)`

    <figure>
    <img src="docs/pareto.png?raw=true" width="70%">
    <figcaption align = "center">Pareto Fronts and Scatter Plots</figcaption>
    </figure>

    This function was used encourage the snakes to prioritize survival a little more over trying to get the fruit, since they came to a point where they would often hit their own body while trying to eat fruit.

    <br>

    ### Selection, crossover, and mutation implementations

    Selection was implemented in a standard "roulette-wheel" fashion, where two chromosomes are selected to create each child chromosome with a probability proportional to the fitness scores. Crossover was implemented through Single-point crossover. This involves selecting a single point randomly to split the bits between each parent chromosome to create the child chromosome. As for mutation, the rate for mutating each bit was .008.

    It is also important to reiterate that the process of selection, crossover, and mutation only occurred to create half of the chromosomes in each new population, and the other half was the half of the previous population with the highest fitness scores. This is known as the (n+n) method, and is described in the paper [Snake game AI: Movement rating functions and evolutionary algorithm-based optimization](https://ieeexplore.ieee.org/document/7880166). The (n+n) method decently improved the performance of the genetic algorithm because it prevents the best chromosomes from being lost due to the randomness crossover and mutation.

    Also, an interesting fact was there were 8 bits used per each weight in a chromosome, so the total length of a single chromosome ended up being 2032 bits.

  <br>

## Results

<figure>
<img src="docs/best_game_scores_20220920212126.png?raw=true" width="70%">
<figcaption align = "center">Game Scores w.r.t no. of generations trained</figcaption>

<br>

<img src="docs/scatter_20220920212126.gif?raw=true" width="70%">
<figcaption align = "center">Best Fitness</figcaption>
</figure>

(see [GAdata.txt](data/GAdata_20220922212126_upd3.txt)):

```
Generation 4007 Best Game Score: 79
Generation 3186 Best Game Score: 73
Generation 3465 Best Game Score: 73
Generation 4141 Best Game Score: 73
Generation 3448 Best Game Score: 72
Generation 4035 Best Game Score: 72
Generation 4223 Best Game Score: 72
Generation 4368 Best Game Score: 72
Generation 4449 Best Game Score: 72
Generation 3825 Best Game Score: 71
Generation 4077 Best Game Score: 71
Generation 4332 Best Game Score: 71
Generation 4333 Best Game Score: 71
```

**Generation #4140:**

Gen#4140 showed the most accurate way to maximize score. See the plot for more info.

  <figure>
  <table>
  <tr>
    <td><img src="docs/scatter_4140_1.png?raw=true" width="100%"></td>
    <td><img src="docs/scatter_4140_2.png?raw=true" width="100%"></td>
  </tr>
  </table>
  <figcaption align = "center">Scatterplot for gen#4140</figcaption>
  </figure>

<br>

**Failures: Generation #4152:**

Here is an example where the snake agent fails to make an efficient decision, in both cases you can see that the agent could have moved in a different, successful direction and increased the score, but due to too many factors coming into play, the agent took the safest option possible in order to not crash into the grid or to itself.

  <figure>
  <table>
  <tr>
    <td><img src="docs/failures_20220921124030_gen4152_1.gif?raw=true" width="100%"></td>
    <td><img src="docs/failures_20220921124030_gen4152_2.gif?raw=true" width="100%"></td>
  </tr>
  </table>
  <figcaption align = "center">Scatterplot for gen#4140</figcaption>
  </figure>

<br>

## Conclusion

As the results suggest, the snake agents learned to play the game quite well! They certainly have gotten better than human play. Even so, they are far from achieving a perfect score, so in the future they might need more complex inputs so they can avoid getting stuck in situatons where they will inevitably run into their own body.
