import * as GAME from './game.js';
import * as GA from './AI-for-Snake-Game/geneticAlgorithm.js';

import * as CHARTS from './charts.js'

import * as POPS from './populations.js'

import SnakeGame from './AI-for-Snake-Game/snakeGame.js';
import SnakeGameGATest from './AI-for-Snake-Game/snakeGameGATest.js';
import SnakeGameGATrain from './AI-for-Snake-Game/snakeGameGATrain.js';

// https://stackoverflow.com/questions/23593052/format-javascript-date-as-yyyy-mm-dd
const timeOffset = new Date().getTimezoneOffset();
const date = new Date(new Date().getTime() - (timeOffset*60*1000));
// 2011-10-05T14:48:00.000Z
const fileLabel = date.toISOString().replaceAll('-','').replaceAll(':','').replace('T','_').split('.')[0];

// 4007 2022-07-24 21:21:26 update 3 (max score:79)
let chromosome = '1101011101010110000010111010000001011100000000110001011111000001010000101000101110001010010101011101001001010011100000111000011111011011000010010111111110110100100111100111111100001100110010000001000010010110101101111111000010000000000101000011100101111010100010110100001100100101000010100110010100100110011010111001000011100101101010101111100011100101111001001011110001111111100011001011010101100110101100010101101100000011010010101001100101100100011111000000100100000001101000100011011010000100101110000100000101111111011000100100101000011100001000011100101101100010011101100011110011100000110000101111001000011011001010111000000100010011000010011000101011111001011101001111000000000001001110111000010101111111110101110010011011111001010110011000111001110111010000101101100101110110100000000011001000111111111000100010011101110001000101011000011000111111110011100011111010100100001011111010100000011110000011011011110001001110110010111011111110101100011000101001010011001101110010010000111101100010010010001001010111011010001110001011111011010000010111100110000000100110111110101100001010101000111100000011001101100000000101100100010011101001111110101011000001101111011101100000111011001010001110100010000110010110001100010111111001001010010101110100100011101100011000000010010011010011001010100011000000111110001000100011011010000100000011001011001111101110010100010101100010101111000110110101101011010110100010101010001110011100001011111010101000010100101111101000011111011011010100011100001111101000011001000011000110000010001001100010101110101011001110100101100100100111011101111111000101011101001100100111100011101101101101011101110000110101101001011111111101101101110001111000111000011011110111000001111100101000010101010000111100011110100001011011001100011001100111101101011111011010011000101111000111101111000100000001110010000101100001011111010110001011101101001011000001100111010101011001100011111011011101101101101111000101101000111000010000011001110100011011111110100011000110100101001011011000011100000000001110110001';

let bits_per_weight = 8;

let num_inputs = 9;
let num_hiddens = 10;
let num_outputs = 4;

let chroms_per_gen = 200;
let total_bits = ((num_inputs + 1) * num_hiddens + num_hiddens * (num_hiddens + 1) + num_outputs * (num_hiddens + 1)) * bits_per_weight;
//let population = POPS.population_20220723_085133_gen_2200;
let population = GA.genPopulation(chroms_per_gen, total_bits);

const snakeGame = new SnakeGame(500);
let snakeGameGATest = new SnakeGameGATest(25, chromosome, bits_per_weight, num_inputs, num_hiddens, num_outputs);
let snakeGameGATrain = new SnakeGameGATrain(0, population, chroms_per_gen, bits_per_weight, num_inputs, num_hiddens, num_outputs);

window.snakeGame = snakeGame;
window.snakeGameGATest = snakeGameGATest;
window.snakeGameGATrain = snakeGameGATrain;
window.CHARTS = CHARTS;

let isTraining = false;
let isTesting = false;
let isPlaying = false;

GAME.state.onPhaseChange.push( function(phase) {
    switch (phase) {
        case GAME.PHASES.INIT:
            console.log("init");
            break;
        case GAME.PHASES.LOAD_STARTED:
            console.log("load started");
            break;
        case GAME.PHASES.LOAD_COMPLETED:
            console.log("load completed");

            switchTab(false, true, false);
            $("#testChromosome").val(chromosome);
            $("#testChromosome").change( function () {
                if ($(this).val().length == total_bits) {
                    GAME.managers.releaseAllInstances();

                    snakeGameGATest = new SnakeGameGATest(25, $(this).val(), bits_per_weight, num_inputs, num_hiddens, num_outputs);
                
                    $("#testChromosomeInfo").css("color", "#008800");
                    $("#testChromosomeInfo").html("Accepted")
                } else {
                    $("#testChromosomeInfo").css("color", "#880000");
                    $("#testChromosomeInfo").html("Denied")
                }
            })

            GAME.state.phase = GAME.PHASES.GAME_STARTED;
            break;
        case GAME.PHASES.GAME_STARTED:
            break;
        case GAME.PHASES.GAME_PAUSED:
            break;
        case GAME.PHASES.GAME_RESUMED:
            break;
    }
});

const keys = []

let max_1 = -Infinity;
let max_2 = -Infinity;
let max_score = -Infinity;
let max_frame_score = -Infinity;
function onGameOver(num_generations, cur_chrom, score, frames_alive, fitness) {
    let cur_gen = snakeGameGATrain.num_generations;

    CHARTS.data1.push({ x: cur_chrom, score: score, frame_score: fitness.frame_score });
    CHARTS.cfg1.data.labels.push(cur_chrom);
    
    CHARTS.data3.push({ x: cur_chrom, _1: fitness._1, _2: fitness._2 });
    CHARTS.cfg3.data.labels.push(cur_chrom);

    //console.log(fitness._3);
    CHARTS.data4.push({ x: cur_chrom, _3: fitness._3 });
    CHARTS.cfg4.data.labels.push(cur_chrom);

    // CHART 10
    if (fitness._3 > 0) {
        CHARTS.cfg10.data.datasets[cur_gen].data.push({ x: fitness._1, y: fitness._2 });

        if (max_1 < fitness._1) { 
            max_1 = fitness._1; 
            CHARTS.cfg10.options.scales.x.max = 1.3 * max_1;
        }
        if (max_2 < fitness._2) { 
            max_2 = fitness._2;
            CHARTS.cfg10.options.scales.y.max = 1.3 * max_2;
            CHARTS.cfg10.options.scales.y.ticks.stepSize = Math.round((max_2 / 40) / 10) * 10;
        }

        CHARTS.chart10.update();
    }

    // CHART 11
    if (fitness._3 > 0) {
        CHARTS.cfg11.data.datasets[cur_gen].data.push({ x: score, y: fitness.frame_score });

        if (max_score < score) { 
            max_score = score; 
            CHARTS.cfg11.options.scales.x.max = 1.3 * max_score;
        }
        if (max_frame_score < fitness.frame_score) { 
            max_frame_score = fitness.frame_score;
            CHARTS.cfg11.options.scales.y.max = 1.3 * max_frame_score;
            CHARTS.cfg11.options.scales.y.ticks.stepSize = Math.round((max_frame_score / 40) / 10) * 10;
        }

        CHARTS.chart11.update();
    }

    CHARTS.chart1.update();
    CHARTS.chart3.update();
    CHARTS.chart4.update();

    $("#generation").html(`GENERATION: ${cur_gen}`);
    $("#chromosome").html(`CHROM: ${snakeGameGATrain.cur_chrom} / ${chroms_per_gen}`);
    $("#score").html(`SCORE: ${snakeGameGATrain.score}`);
    $("#high_score").html(`HIGHSCORE: ${snakeGameGATrain.high_score}`);
}

const palettes = [
    '#f3a935', '#c73558', '#6ebe9f', '#2586a4', '#55596a', // https://www.color-hex.com/color-palette/32566
    '#fe0000', '#fdfe02', '#0bff01', '#011efe', '#fe00f6', // https://www.color-hex.com/color-palette/1131
    '#feda75', '#fa7e1e', '#d62976', '#962fbf', '#4f5bd5', // https://www.color-hex.com/color-palette/44340
]
palettes.counter = 0;

const BestParents = {
    longest: 0,
    update(bps) {
        for (let i = 0; i < bps.length; i++) { 
            let chromosome = bps[i].chromosome;
            let fitness = bps[i].fitness;
            let generationNum = snakeGameGATrain.num_generations - 1;
    
            if (!this[chromosome]) { this[chromosome] = [] }
            this[chromosome].push({ gen: generationNum, fitness: fitness});

            if (this[chromosome].length > this.longest) { this.longest = this[chromosome].length; }
        }
    }
};
let bestParents = Object.create(BestParents);

window.bestParents = bestParents;

function onGenerationOver(average_game_score, average_frame_score, average_fitness, best_individual, fitnessRatios, fitnessRouletteCutoffs, bps) {
    let cur_gen = snakeGameGATrain.num_generations;
    
    CHARTS.data1.length = 0
    CHARTS.cfg1.data.labels.length = 0
    CHARTS.data3.length = 0
    CHARTS.cfg3.data.labels.length = 0
    CHARTS.data4.length = 0
    CHARTS.cfg4.data.labels.length = 0

    CHARTS.data5.length = 0
    CHARTS.cfg5.data.labels.length = 0
    CHARTS.data6.length = 0
    CHARTS.cfg6.data.labels.length = 0

    CHARTS.cfg8.data.labels.length = 0
    CHARTS.cfg8.data.datasets.length = 0
    CHARTS.cfg9.data.labels.length = 0
    CHARTS.cfg9.data.datasets.length = 0

    for (let i = 0; i < fitnessRatios.length; i++) {
        CHARTS.data5.push({ x: i, ratio: fitnessRatios[i] });
        CHARTS.cfg5.data.labels.push(i);
    }
    for (let i = 0; i < fitnessRouletteCutoffs.length; i++) {
        CHARTS.data6.push({ x: i, cutoff: fitnessRouletteCutoffs[i] });
        CHARTS.cfg6.data.labels.push(i);
    }

    CHARTS.data2.push({ x: cur_gen - 1, average_game_score: average_game_score, average_frame_score: average_frame_score });
    CHARTS.cfg2.data.labels.push(cur_gen - 1);
    
    CHARTS.data7.push({ x: cur_gen - 1, average_fitness: average_fitness });
    CHARTS.cfg7.data.labels.push(cur_gen - 1);

    bestParents.update(bps);
    // CHART 8
    let forDownload = [];
    let entries = Object.entries(bestParents)
        .filter((a) => a[1][0])                                   // keeping only those with array as a value
        .filter((a) => a[1][a[1].length - 1].gen == cur_gen - 1); // keeping only lasted until this generation
    // entry[0] - key (chromosome); entry[1] - value ({gen: N, fitness: S});
    entries.sort((a, b) => {
        const avgA = a[1].map((element, index, array) => element.fitness).reduce((sum, a) => sum + a, 0) / a[1].length;
        const avgB = b[1].map((element, index, array) => element.fitness).reduce((sum, a) => sum + a, 0) / b[1].length;
        
        // https://stackoverflow.com/questions/10759018/how-can-i-reliably-subsort-arrays-using-dom-methods
        return (b[1].length - a[1].length) || (avgB - avgA);
    });   // sorting descending by the number of generations and by the average fitness
    
    let bottom = Math.floor(cur_gen - bestParents.longest * 1.1);
    let top = Math.ceil(cur_gen + bestParents.longest * 0.1);
    for (let i = bottom; i < top; i++) { CHARTS.cfg8.data.labels.push(i); }

    let range = entries.length < 5 ? entries.length : 5; // taking top-5 results of sort
    for (let i = 0; i < range; i++) { // taking top-5 results of sort
        let chromosome = entries[i][0];
        let infos = entries[i][1];

        forDownload.push({ chromosome, infos });

        let dataset = {
            label: chromosome.substring(0,8),
            data: [],
            borderColor: palettes[palettes.counter % palettes.length],
            backgroundColor: palettes[palettes.counter++ % palettes.length],
            yAxisID: 'y',
        }
        for (const info of infos) { dataset.data.push({ x: info.gen, y: info.fitness }); }
        CHARTS.cfg8.data.datasets.push(dataset);
    }

    // https://www.codegrepper.com/code-examples/javascript/save+array+file
    let a = document.getElementById("downloadBestParents1").appendChild(document.createElement("a"));
    a.download = `best_parents_top5_1_${fileLabel}_gen_${cur_gen}.txt`;
    a.href = "data:text/plain;base64," + btoa(JSON.stringify(forDownload));
    a.innerHTML = `${cur_gen}`;
    let span = document.getElementById("downloadBestParents1").appendChild(document.createElement("span"));
    span.innerHTML = " • ";

    // CHART 9
    forDownload = [];
    entries = Object.entries(bestParents)
        .filter((a) => a[1][0])                                     // keeping only those with array as a value
        .filter((a) => a[1][a[1].length - 1].gen == cur_gen - 1)    // keeping only lasted until this generation
        .filter((a) => a[1].length >= bestParents.longest * (1/3)); // keeping those lasted at least 1/3 of the longest living
    // entry[0] - key (chromosome); entry[1] - value ({gen: N, fitness: S});
    entries.sort((a, b) => { // sorting descending by fitness averages
        const avgA = a[1].map((element, index, array) => element.fitness).reduce((sum, a) => sum + a, 0) / a[1].length;
        const avgB = b[1].map((element, index, array) => element.fitness).reduce((sum, a) => sum + a, 0) / b[1].length;
        
        return avgB - avgA;
    }); 
    
    bottom = Math.floor(cur_gen - bestParents.longest * 1.1);
    top = Math.ceil(cur_gen + bestParents.longest * 0.1);
    for (let i = bottom; i < top; i++) { CHARTS.cfg9.data.labels.push(i); }
    
    range = entries.length < 5 ? entries.length : 5; // taking top-5 results of sort
    for (let i = 0; i < range; i++) { 
        let chromosome = entries[i][0];
        let infos = entries[i][1];

        forDownload.push({ chromosome, infos });

        let dataset = {
            label: chromosome.substring(0,8),
            data: [],
            borderColor: palettes[palettes.counter % palettes.length],
            backgroundColor: palettes[palettes.counter++ % palettes.length],
            yAxisID: 'y',
        }
        for (const info of infos) { dataset.data.push({ x: info.gen, y: info.fitness }); }
        CHARTS.cfg9.data.datasets.push(dataset);
    }

    // https://www.codegrepper.com/code-examples/javascript/save+array+file
    a = document.getElementById("downloadBestParents2").appendChild(document.createElement("a"));
    a.download = `best_parents_top5_2_${fileLabel}_gen_${cur_gen}.txt`;
    a.href = "data:text/plain;base64," + btoa(JSON.stringify(forDownload));
    a.innerHTML = `${cur_gen}`;
    span = document.getElementById("downloadBestParents2").appendChild(document.createElement("span"));
    span.innerHTML = " • ";

    // CHART 10
    CHARTS.cfg10.data.datasets.push({ 
        label: `${cur_gen}`, 
        data: [], 
        backgroundColor: palettes[palettes.counter % palettes.length] 
    });

    // CHART 11
    CHARTS.cfg11.data.datasets.push({ 
        label: `${cur_gen}`, 
        data: [], 
        backgroundColor: palettes[palettes.counter++ % palettes.length] 
    });

    CHARTS.chart5.update();
    CHARTS.chart6.update();
    CHARTS.chart2.update();
    CHARTS.chart7.update();
    CHARTS.chart8.update();
    CHARTS.chart9.update();

    document.getElementById("bestIndividual").textContent = best_individual;

    // https://www.codegrepper.com/code-examples/javascript/save+array+file
    a = document.getElementById("downloadPopulation").appendChild(document.createElement("a"));
    a.download = `population_${fileLabel}_gen_${cur_gen}.txt`;
    a.href = "data:text/plain;base64," + btoa(JSON.stringify(snakeGameGATrain.population));
    a.innerHTML = `${cur_gen}`;
    span = document.getElementById("downloadPopulation").appendChild(document.createElement("span"));
    span.innerHTML = " • ";

}

snakeGameGATrain.onGameOver = onGameOver;
snakeGameGATrain.onGenerationOver = onGenerationOver;

let trainingStarted = true;
let drawModels = true;

function train(redraw) {
    if (!trainingStarted || !isTraining) { return; }

    snakeGameGATrain.move_snake(keys);
    snakeGameGATrain.check_collisions();
    snakeGameGATrain.update_frames_since_last_fruit();
    snakeGameGATrain.frames_alive++;
    if (redraw) { snakeGameGATrain.draw_grid_updates(); }
}

GAME.callbacks.onUpdate = function(delta, elapsed) {
    
    if ( isPlaying && (snakeGame.elapsed == 0 || (elapsed - snakeGame.elapsed > snakeGame.delay)) ) {
        snakeGame.elapsed = elapsed

        snakeGame.move_snake(keys);
        snakeGame.check_collisions();
        snakeGame.draw_grid_updates();

        $("#generation").html(``);
        $("#chromosome").html(``);
        $("#score").html(`SCORE: ${snakeGame.score}`);
        $("#high_score").html(`HIGHSCORE: ${snakeGame.high_score}`);

        if (snakeGame.restart) {
            snakeGame.restart = false;
        }

        keys.length = 0;
    }
    
    if ( isTesting && (snakeGameGATest.elapsed == 0 || (elapsed - snakeGameGATest.elapsed > snakeGameGATest.delay)) ) {
        snakeGameGATest.elapsed = elapsed

        snakeGameGATest.move_snake(keys);
        snakeGameGATest.check_collisions();
        snakeGameGATest.update_frames_since_last_fruit();
        snakeGameGATest.draw_grid_updates();

        $("#generation").html(``);
        $("#chromosome").html(``);
        $("#score").html(`SCORE: ${snakeGameGATest.score}`);
        $("#high_score").html(`HIGHSCORE: ${snakeGameGATest.high_score}`);

        if (snakeGameGATest.restart) {
            snakeGameGATest.restart = false;
        }

    }
    
    if ( isTraining && drawModels && (snakeGameGATrain.elapsed == 0 || (elapsed - snakeGameGATrain.elapsed > snakeGameGATrain.delay)) ) {
        snakeGameGATrain.elapsed = elapsed

        train(true);
    }
}

GAME.callbacks.onKeyDown = function(event) {
    keys.push(event.code);
}

$("#startStopTraining").click(function () {
    trainingStarted = !trainingStarted;
    if (trainingStarted) {
        $(this).html("Training: OFF");
    } else {
        $(this).html("Training: ON");
    }
});

let intervalID = -1;
$("#startStopDrawing").click(function () {
    drawModels = !drawModels;
    if (drawModels) {
        $(this).html("Draw Models: OFF");

        if (intervalID != -1) {
            clearInterval(intervalID);
            intervalID = -1;
        }

    } else {
        $(this).html("Draw Models: ON");

        intervalID = setInterval(train, 0);
    }
});

$("#populationFileInput").on("change", function() {
    const reader = new FileReader();

    $(reader).on("load", (event) => {
        try {
            let temp = JSON.parse(event.target.result.replaceAll("'","\""));
            snakeGameGATrain = new SnakeGameGATrain(0, temp, chroms_per_gen, bits_per_weight, num_inputs, num_hiddens, num_outputs);
            snakeGameGATrain.onGameOver = onGameOver;
            snakeGameGATrain.onGenerationOver = onGenerationOver;

            bestParents = Object.create(BestParents);
            CHARTS.clearAll();
        } catch (e) {
            console.log(e);
        }
    });

    reader.readAsText($(this)[0].files[0]);

    $(this).val('');
});

$("#uploadPopulation").on("click", function() {
    $("#populationFileInput").trigger("click");
});

$("#trainButton").click(() => switchTab(true, false, false));
$("#testButton").click(() => switchTab(false, true, false));
$("#playButton").click(() => switchTab(false, false, true));

function switchTab(tr, te, pl) {
    $("#trainTab").hide();
    $("#testTab").hide();
    $("#playTab").hide();
    
    if (tr) {
        $("#trainTab").show();
    } else if (te) {
        $("#testTab").show();
    } else if (pl) {
        $("#playTab").show();
    }
    
    GAME.managers.releaseAllInstances();

    isTraining = tr;
    isTesting = te;
    isPlaying = pl;
}

GAME.state.phase = GAME.PHASES.INIT;