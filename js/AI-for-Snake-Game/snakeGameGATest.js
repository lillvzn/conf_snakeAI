import * as NN from "./neuralNetwork.js";

import SnakeGame from "./snakeGame.js";

export default class SnakeGameGATest extends SnakeGame {
  constructor(
    delay,
    chromosome,
    bits_per_weight,
    num_inputs,
    num_hidden_layer_nodes,
    num_outputs
  ) {
    super(delay);
    this.frames_since_last_fruit = 0;
    this.bits_per_weight = bits_per_weight;
    this.num_inputs = num_inputs;
    this.num_hidden_layer_nodes = num_hidden_layer_nodes;
    this.num_outputs = num_outputs;

    // chromsome will be an empty string if this class was inhereted from the class SnakeGameGATrain
    // This is because there will be a population of chromosomes, and not just one chromosome to test
    if (chromosome != "") {
      this.weights = NN.mapChrom2Weights(
        chromosome,
        this.bits_per_weight,
        this.num_inputs,
        this.num_hidden_layer_nodes,
        this.num_outputs
      );
    }
  }

  move_snake(keys) {
    const head = this.snake.body[0];

    // Get the manhattan ditance of the fruit from the head if it moves in each direction
    const dist_left_fruit = this.manhattan_distance(head.x, head.y - 1);
    const dist_up_fruit = this.manhattan_distance(head.x - 1, head.y);
    const dist_right_fruit = this.manhattan_distance(head.x, head.y + 1);
    const dist_down_fruit = this.manhattan_distance(head.x + 1, head.y);

    // Calculate the space available for turning in each of the four directions, reduced by a constant factor
    const FACTOR = 20;
    const open_spaces_left =
      this.calc_open_spaces({ x: head.x, y: head.y - 1 }) / FACTOR;
    const open_spaces_up =
      this.calc_open_spaces({ x: head.x - 1, y: head.y }) / FACTOR;
    const open_spaces_right =
      this.calc_open_spaces({ x: head.x, y: head.y + 1 }) / FACTOR;
    const open_spaces_down =
      this.calc_open_spaces({ x: head.x + 1, y: head.y }) / FACTOR;

    // Get the length of the snake
    const length = this.score + 1;

    const network_inputs = [
      dist_left_fruit,
      dist_up_fruit,
      dist_right_fruit,
      dist_down_fruit,
      open_spaces_left,
      open_spaces_up,
      open_spaces_down,
      open_spaces_right,
      length,
    ];

    // Get all of the outputs from the neural network indicating a value of "goodness" for turning in each direction
    const outputs = NN.testNetwork(
      network_inputs,
      this.weights,
      this.num_hidden_layer_nodes,
      this.num_outputs
    );

    // Get the maximum of all the ouputs, and this is the direction to turn
    const max_output = Math.max(...outputs);

    //console.log(this.fruit_pos.x, this.fruit_pos.y, head.x, head.y)
    //console.log(dist_left_fruit, dist_up_fruit, dist_right_fruit, dist_down_fruit, open_spaces_left, open_spaces_up, open_spaces_down, open_spaces_right, length);
    //console.log(outputs[0], outputs[1], outputs[2], outputs[3], max_output);

    // Systematically decide which direction to turn based on the max output
    let direct;
    if (max_output == outputs[0]) {
      direct = "left";
    } else if (max_output == outputs[1]) {
      direct = "up";
    } else if (max_output == outputs[2]) {
      direct = "right";
    } else {
      direct = "down";
    }
    // https://stackoverflow.com/questions/8073673/how-can-i-add-new-array-elements-at-the-beginning-of-an-array-in-javascript
    this.snake.directions.unshift(direct);
    if (this.snake.directions.length > this.snake.body.length) {
      this.snake.directions.pop();
    }
    this.snake.update_body_positions();
  }

  manhattan_distance(y_head, x_head) {
    return (
      Math.abs(this.fruit_pos.x - y_head) + Math.abs(this.fruit_pos.y - x_head)
    );
  }

  calc_open_spaces(start_pos) {
    let open_spaces = 0;

    const start_y = start_pos.y; //[1]
    const start_x = start_pos.x; //[0]

    // If the start position is in the snake's body or out of bounds
    for (let segment of this.snake.body) {
      if (start_pos.x == segment.x && start_pos.y == segment.y) {
        return 0; // no open spaces
      }
    }
    if (
      start_x < 0 ||
      start_x >= this.cols ||
      start_y < 0 ||
      start_y >= this.rows
    ) {
      return 0; // no open spaces
    }

    // Breadth first search is used
    // Create a set to represent the visited spaces
    // https://stackoverflow.com/questions/5657219/set-of-objects-in-javascript
    const visited = new Set([JSON.stringify(start_pos)]);
    // Create a queue to keep track of which spaces need to be expanded
    const queue = [start_pos];

    // While there are still unvisited open spaces to search from
    while (queue.length > 0) {
      // CHECK
      // https://stackoverflow.com/questions/8073673/how-can-i-add-new-array-elements-at-the-beginning-of-an-array-in-javascript
      let cur = queue.shift();

      let possible_moves = this.get_possible_moves(cur);

      for (let move of possible_moves) {
        // CHECK
        if (!visited.has(JSON.stringify(move))) {
          // stringifying to keep the unique objects only
          visited.add(JSON.stringify(move)); // https://stackoverflow.com/questions/41404607/why-does-javascript-set-not-do-unique-objects

          let isInBody = false;
          for (let segment of this.snake.body) {
            if (move.x == segment.x && move.y == segment.y) {
              isInBody = true;
              break;
            }
          }
          // if the move is an open space
          if (!isInBody) {
            open_spaces += 1;
            // add the open space to the queue for further searching
            queue.push(move);
          }
        }
      }
    }
    return open_spaces;
  }

  get_possible_moves(cur) {
    let adjacent_spaces = [
      { x: cur.x, y: cur.y - 1 },
      { x: cur.x - 1, y: cur.y },
      { x: cur.x, y: cur.y + 1 },
      { x: cur.x + 1, y: cur.y },
    ];
    let possible_moves = [];
    for (let move of adjacent_spaces) {
      // CHECK
      let move_y = move.y; //[1]
      let move_x = move.x; //[0]
      // If the move is not out of bounds
      if (
        move_x >= 0 &&
        move_x < this.cols &&
        move_y >= 0 &&
        move_y < this.rows
      ) {
        possible_moves.push(move);
      }
    }
    return possible_moves;
  }

  check_fruit_collision() {
    if (
      this.snake.body[0].x == this.fruit_pos.x &&
      this.snake.body[0].y == this.fruit_pos.y
    ) {
      this.frames_since_last_fruit = 0;
    }
    super.check_fruit_collision();
  }

  update_frames_since_last_fruit() {
    this.frames_since_last_fruit += 1;

    if (
      (this.frames_since_last_fruit == 50 && this.score < 6) ||
      this.frames_since_last_fruit == 250
    ) {
      this.game_over();
    }
  }

  game_over() {
    super.game_over();
    this.frames_since_last_fruit = 0;
  }
}
