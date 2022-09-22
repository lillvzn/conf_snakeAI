import * as GA from './geneticAlgorithm.js';
import * as NN from './neuralNetwork.js';

import * as CHARTS from '../charts.js'

import Snake from './snake.js';
import SnakeGameGATest from './snakeGameGATest.js';

export default class SnakeGameGATrain extends SnakeGameGATest {
    constructor(delay, population, chroms_per_gen, bits_per_weight, num_inputs, num_hidden_layer_nodes, num_outputs) {
        super(delay, "", bits_per_weight, num_inputs, num_hidden_layer_nodes, num_outputs)
        
        this.num_generations = 0
        this.chroms_per_gen = chroms_per_gen
        this.cur_chrom = 0
        this.frames_alive = 0
        
        this.population = population
        this.weights = NN.mapChrom2Weights(this.population[this.cur_chrom], this.bits_per_weight, this.num_inputs, this.num_hidden_layer_nodes, this.num_outputs)
        this.fitness_scores = []
        this.frame_scores = []
        this.game_scores = []
        
        this.onGameOver = undefined;
        this.onGenerationOver = undefined;
    }

    game_over() {
        // Make necessary updates to move onto the next chromosome.
        this.fitness = this.calc_fitness();
        this.fitness_scores.push(this.fitness._3);
        this.frame_scores.push(this.fitness.frame_score);
        this.game_scores.push(this.score);

        this.onGameOver?.(this.num_generations, this.cur_chrom, this.score, this.frames_alive, this.fitness)

        //console.log("gen:", this.num_generations, "chrom:", this.cur_chrom, "score:", this.score, "alive:", this.frames_alive, "fitness:", this.fitness);

        this.cur_chrom +=1

        // If we are done testing all the chromsomes in the population.
        if (this.cur_chrom == this.chroms_per_gen) {
            // Move onto next generation
            this.num_generations +=1
            const { next_generation, best_individual, best_fitness, average_fitness, fitnessRatios, fitnessRouletteCutoffs, bestParents} = 
                GA.createNextGeneration(this.population, this.fitness_scores, this.num_generations)
            
            this.population = next_generation;
            this.cur_chrom  = 0;

            const average_game_score = this.game_scores.reduce((sum, a) => sum + a, 0) / this.game_scores.length;
            const average_frame_score = this.frame_scores.reduce((sum, a) => sum + a, 0) / this.frame_scores.length;

            const high_score_per_cur_gen = Math.max(...this.game_scores)

            //console.log(this.num_generations, this.high_score, average_game_score, high_score_per_cur_gen, average_fitness)

            this.onGenerationOver?.( 
                average_game_score, 
                average_frame_score, 
                average_fitness, 
                best_individual,
                fitnessRatios,
                fitnessRouletteCutoffs,
                bestParents,
            );

            this.fitness_scores.length = 0;
            this.frame_scores.length = 0;
            this.game_scores.length = 0;
        }

        this.weights = NN.mapChrom2Weights(
            this.population[this.cur_chrom], 
            this.bits_per_weight, 
            this.num_inputs, 
            this.num_hidden_layer_nodes, 
            this.num_outputs
        );

        super.game_over();
        this.frames_alive = 0;
        this.fitness = 0;
    }
    
    calc_fitness() {
        let frame_score = this.frames_alive
        
        // If the frames since the last fruit was eaten is at least 50
        if (this.frames_since_last_fruit >= 50) {
            
            // Subtract the number of frames since the last fruit was eaten from the fitness
            // This is to discourage snakes from trying to gain fitness by avoiding fruit
            frame_score = this.frames_alive - this.frames_since_last_fruit
            
            // Ensure we do not multiply fitness by a factor of 0
            if (frame_score <= 0) { frame_score = 1 }
        }

        let _1 = (this.score*2)**2 //  nrsharip
        let _2 = frame_score**1.5  //  nrsharip
        let _3 = _1 * _2           //  nrsharip ((this.score*2)**2)*(frame_score**1.5)

        return { frame_score, _1, _2, _3 }
    }
}