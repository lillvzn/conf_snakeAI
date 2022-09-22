export default class Snake {
    constructor(rows,cols) {
        this.rows = rows;
        this.cols = cols;
        this.body = [];
        this.body.push(this.initialize_snake());
        this.directions = [];
    }

    initialize_snake () {
        let snake_row = this.rows / 2;
        let snake_col = this.cols / 2;

        return { x: snake_row, y: snake_col }
    }

    update_body_positions () {
        //Iterate through each square that is part of the snake's body
        for (let i = 0; i < this.body.length; i++) {
            let pos = this.body[i];
            //Get the direction to move next that corresponds to the body position
            let direct = this.directions[i];
            //Update the body position after moving in the direction
            if (direct == "left") {
                this.body[i] = { x: pos.x,     y: pos.y - 1}; // Move left
            } else if (direct == "up") {
                this.body[i] = { x: pos.x - 1, y: pos.y};     // Move up
            } else if (direct == "right") {
                this.body[i] = { x: pos.x,     y: pos.y + 1}; // Move right
            } else {
                this.body[i] = { x: pos.x + 1, y: pos.y};     // Move down
            }
        }
    }

    extend_snake () {
        let snake_tail = this.body[this.body.length - 1]
        //Get the direction of the tail of the body
        let tail_dir = this.directions[this.body.length - 1]

        // https://stackoverflow.com/questions/8073673/how-can-i-add-new-array-elements-at-the-beginning-of-an-array-in-javascript
        if (tail_dir == "left") {
            this.body.push({ x: snake_tail.x,     y: snake_tail.y + 1 }) // If tail is going left, add new tail to right of old tail
        } else if (tail_dir == "up") {
            this.body.push({ x: snake_tail.x + 1, y: snake_tail.y })     // If tail is going up, add new tail below old tail
        } else if (tail_dir == "right") {
            this.body.push({ x: snake_tail.x,     y: snake_tail.y - 1 }) // If tail is going right, add new tail to the left of old tail
        } else {
            this.body.push({ x: snake_tail.x - 1, y: snake_tail.y })     // If tail is going down, add new tail above old tail
        }
    }
}
