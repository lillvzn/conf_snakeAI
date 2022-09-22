import * as THREE from "three";
import * as GAME from "../game.js";

import Snake from "./snake.js";

const tmpV3$1 = new THREE.Vector3();
const tmpV3$2 = new THREE.Vector3();
const tmpV3$3 = new THREE.Vector3();

//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

export default class SnakeGame {
  constructor(delay) {
    this.play = true;
    this.restart = false;

    this.delay = delay;
    this.elapsed = 0;

    this.rows = 10;
    this.cols = this.rows;
    this.snake = new Snake(this.rows, this.cols);

    this.fruit = undefined;
    this.fruit_pos = { x: 0, y: 0 };

    //this.fruit_poss_i = 0
    //this.fruit_poss = [ { x: 3, y: 3}, { x: 3, y: 7 }, { x: 7, y: 7}, { x: 7, y: 3 } ]

    this.generate_fruit();

    this.score = 0;
    this.high_score = 0;
  }

  redraw_window(self) {
    this.draw_grid_updates();
  }

  generate_fruit() {
    let fruit_row = undefined;
    let fruit_col = undefined;

    while (!fruit_row && !fruit_col) {
      fruit_row = getRandomInt(0, this.rows);
      fruit_col = getRandomInt(0, this.cols);

      for (let position of this.snake.body) {
        if (fruit_row == position.x && fruit_col == position.y) {
          fruit_row = undefined;
          fruit_col = undefined;
        }
      }
    }

    this.fruit_pos.x = fruit_row;
    this.fruit_pos.y = fruit_col;

    //this.fruit_pos = this.fruit_poss[this.fruit_poss_i++]
  }

  move_snake(keys) {
    //keys = pygame.key.get_pressed()

    let direct;

    //Determine which arrow key the user selected
    if (keys[0] == "ArrowLeft") {
      direct = "left";
    } else if (keys[0] == "ArrowUp") {
      direct = "up";
    } else if (keys[0] == "ArrowRight") {
      direct = "right";
    } else if (keys[0] == "ArrowDown") {
      direct = "down";
    } else {
      if (this.snake.directions.length == 0) {
        direct = "down"; // Move "down" at beginning of game
      } else {
        direct = this.snake.directions[0]; //Otherwise continue with previous direction if no key pressed
      }
    }
    // https://stackoverflow.com/questions/8073673/how-can-i-add-new-array-elements-at-the-beginning-of-an-array-in-javascript
    this.snake.directions.unshift(direct);
    if (this.snake.directions.length > this.snake.body.length) {
      this.snake.directions.pop();
    }
    this.snake.update_body_positions();
  }

  draw_grid_updates() {
    GAME.managers.releaseAllInstances();

    //Draw the fruit
    let fruit_z = this.fruit_pos.x + 0.5 - 5;
    let fruit_x = this.fruit_pos.y + 0.5 - 5;

    this.fruit = GAME.managers.cubeRed.addInstanceTo(
      GAME.graphics.scene,
      tmpV3$1.set(fruit_x, 0, fruit_z)
    );
    //console.log(this.fruit_pos.x, this.fruit_pos.y, tmpV3$1.x, tmpV3$1.y, tmpV3$1.z);

    let pos_x;
    let pos_z;

    //Draw the updated snake since last movement
    for (let pos of this.snake.body) {
      // CHECK
      pos_z = pos.x + 0.5 - 5;
      pos_x = pos.y + 0.5 - 5;
      GAME.managers.cubeGreen.addInstanceTo(
        GAME.graphics.scene,
        tmpV3$1.set(pos_x, 0, pos_z)
      );
    }

    let head = this.snake.body[0];
    let head_z = head.x + 0.5 - 5;
    let head_x = head.y + 0.5 - 5;
    let head_dir = this.snake.directions[0];
    //console.log(head_dir);

    //Draw eyes on the head of the snake, determining which direction they should face
    if (head_dir == "left") {
      // if head facing left
      GAME.managers.sphereBlack.addInstanceTo(
        GAME.graphics.scene,
        tmpV3$1.set(head_x - 0.5, 0.65, head_z + 0.3)
      );
      GAME.managers.sphereBlack.addInstanceTo(
        GAME.graphics.scene,
        tmpV3$1.set(head_x - 0.5, 0.65, head_z - 0.3)
      );
    } else if (head_dir == "up") {
      // if head facing up
      GAME.managers.sphereBlack.addInstanceTo(
        GAME.graphics.scene,
        tmpV3$1.set(head_x + 0.3, 0.65, head_z - 0.5)
      );
      GAME.managers.sphereBlack.addInstanceTo(
        GAME.graphics.scene,
        tmpV3$1.set(head_x - 0.3, 0.65, head_z - 0.5)
      );
    } else if (head_dir == "right") {
      // if head facing right
      GAME.managers.sphereBlack.addInstanceTo(
        GAME.graphics.scene,
        tmpV3$1.set(head_x + 0.5, 0.65, head_z + 0.3)
      );
      GAME.managers.sphereBlack.addInstanceTo(
        GAME.graphics.scene,
        tmpV3$1.set(head_x + 0.5, 0.65, head_z - 0.3)
      );
    } else {
      // if head is facing down
      GAME.managers.sphereBlack.addInstanceTo(
        GAME.graphics.scene,
        tmpV3$1.set(head_x + 0.3, 0.65, head_z + 0.5)
      );
      GAME.managers.sphereBlack.addInstanceTo(
        GAME.graphics.scene,
        tmpV3$1.set(head_x - 0.3, 0.65, head_z + 0.5)
      );
    }
  }

  check_collisions() {
    this.check_fruit_collision();
    this.check_wall_collision();
    this.check_body_collision();
  }

  check_fruit_collision() {
    //If we found a fruit
    if (
      this.snake.body[0].x == this.fruit_pos.x &&
      this.snake.body[0].y == this.fruit_pos.y
    ) {
      //this.fruit?.userData.releaseInstance();

      //Add the new body square to the tail of the snake
      this.snake.extend_snake();

      //Generate a new fruit in a random position
      this.generate_fruit();

      this.score += 1;
    }
  }

  check_wall_collision() {
    //Only need to check the colisions of the head of the snake
    let head = this.snake.body[0];
    let head_z = head.x;
    let head_x = head.y;

    //If there is a wall collision, game over
    if (
      head_x == this.cols ||
      head_z == this.rows ||
      head_x < 0 ||
      head_z < 0
    ) {
      this.game_over();
    }
  }

  check_body_collision() {
    if (this.snake.body.length > 1) {
      //Only need to check the colisions of the head of the snake
      let head = this.snake.body[0];
      let body_without_head = this.snake.body.slice(1);

      for (let segment of body_without_head) {
        if (head.x == segment.x && head.y == segment.y) {
          this.game_over();
        }
      }
    }
  }

  game_over() {
    this.snake = new Snake(this.rows, this.cols);
    this.generate_fruit();
    this.restart = true;
    if (this.score > this.high_score) {
      this.high_score = this.score;
    }
    this.score = 0;
  }
}
