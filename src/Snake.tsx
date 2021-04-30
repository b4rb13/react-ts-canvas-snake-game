import React, { useEffect, useState } from 'react';

import './Snake.css';

enum Direction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right'
}

interface ICell {
  x: number,
  y: number,
}

interface ISnakeProps {
  cellSize: number,
}

// interface ISnakeState {
//   snakeSize: number,
//   snakeCoordinates: Array<ICell>,
//   direction: Direction,
//   foodCoordinates: ICell,
//   score: number,
// }

const GRAY_COLOR = '#949494';
const WHITE_COLOR = '#ffffff';
const FIELD_LENGTH = 20;
const INITIAL_SNAKE_SIZE = 5;

/**
 * @function getRandomCoordinate
 * @param {number} cellSize
 * @returns ICell
 * @description Returns random coordinate.
 */

const getRandomCoordinate = (cellSize: number): number => Math.floor(Math.random() * FIELD_LENGTH) * cellSize;

/**
 * @function isSameCoordinates
 * @param {ICell} a
 * @param {ICell} b
 * @returns {boolean}
 * @description Compares two coordinates.
 */

const isSameCoordinates = (a: ICell, b: ICell): boolean => a.x === b.x && a.y === b.y;

/**
 *
 * @param {ICell} headCoordinates
 * @param {Direction} direction
 * @param {number} canvasSize
 * @param {number} cellSize
 * @returns {ICell | null}
 * @description Computes snake's head next coordinate.
 */

const getComputedNextHeadCoordinates = (
  headCoordinates: ICell,
  direction: Direction,
  canvasSize: number,
  cellSize: number
): ICell | null => {
  if (headCoordinates) {
    let { x, y } = headCoordinates;

    switch (direction) {
      case Direction.Right:
        x += cellSize;
        break;
      case Direction.Left:
        x -= cellSize;
        break;
      case Direction.Up:
        y -= cellSize;
        break;
      case Direction.Down:
        y += cellSize;
        break;
      default:
        return null;
    }

    if (x < 0) {
      x = canvasSize - cellSize;
    }

    if (y < 0) {
      y = canvasSize - cellSize;
    }

    if (x > canvasSize - cellSize) {
      x = 0;
    }

    if (y > canvasSize - cellSize) {
      y = 0;
    }

    return { x, y };
  }

  return null;
};

const Snake = ({cellSize}: ISnakeProps) => {

  const canvas = React.createRef() as React.RefObject<HTMLCanvasElement>;
  let timerId: any;
  const [direction, setDirection] = useState<Direction>(Direction.Right);
  const [snakeSize, setSnakeSize] = useState<number>(INITIAL_SNAKE_SIZE);
  const [snakeCoordinates, setSnakeCoordinates] = useState<ICell[]>([]);
  const [foodCoordinates, setFoodCoordinates] = useState<ICell>({x: -100, y: -100});
  const [score, setScore] = useState<number>(0);


  useEffect(() => {
    focusCanvas()
    setCanvasSize()
    startGame()
    
  }, []);

  useEffect(() => {
    renderSnake()

  }, [snakeCoordinates, snakeSize]);


  const focusCanvas = () => {
  
    if (canvas && canvas.current) {
      canvas.current.focus();
    }
  }

  /**
   * @method getCanvasContext
   * @returns {CanvasRenderingContext2D | null}
   * @description Gets canvas context.
   */

  const getCanvasContext = (): CanvasRenderingContext2D | null => {

    if (canvas && canvas.current) {
      return canvas.current.getContext('2d');
    }

    return null;
  };

  /**
   * @method setCanvasSize
   * @description Sets canvas size from cell size (props) and field length (constants).
   */

  const setCanvasSize = (): void  =>{

    if (canvas && canvas.current) {
      canvas.current.width = cellSize * FIELD_LENGTH;
      canvas.current.height = cellSize * FIELD_LENGTH;
    }
  };

  /**
   * @method getCanvasSize
   * @returns {number | null}
   * @description Gets canvas size (width = height).
   */

  const getCanvasSize = (): number | null => {

    if (canvas && canvas.current) {
      const { width: canvasSize } = canvas.current.getBoundingClientRect();

      return canvasSize;
    }

    return null;
  }

  /**
   * @method renderSquare
   * @param {number} x
   * @param {number} y
   * @param {string} color
   * @description Gets canvas context and renders rectangle.
   */

  const renderSquare = (x: number, y: number, color: string): void => {
    const ctx = getCanvasContext();

    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, cellSize, cellSize);
    }
  }

  /**
   * @method renderGrid
   * @description Gets canvas context, size and renders grid with cell size step.
   */

  const renderGrid = (): void => {
    const ctx = getCanvasContext();
    const canvasSize = getCanvasSize();

    if (ctx && canvasSize) {
      ctx.fillStyle = GRAY_COLOR;
      ctx.strokeStyle = WHITE_COLOR;
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      for (let x = cellSize; x < canvasSize; x += cellSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasSize);
      }

      for (let y = 0; y < canvasSize; y += cellSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvasSize, y);
      }

      ctx.stroke();
    }
  }

  /**
   * @method setInitialSnake
   * @description Set initial snake position (tail on {x: 0, y: 0}), size (constants), direction and score.
   * Renders snake.
   */

  const setInitialSnake = (): void => {
    const snakeSize = INITIAL_SNAKE_SIZE;
    const snakeCoordinates = [];

    for (let i = snakeSize; i > 0; i--) {
      const part = (i - 1) * cellSize;

      snakeCoordinates.push({ x: part, y: 0 })
    }

    setSnakeCoordinates(snakeCoordinates)


    // this.setState({ snakeCoordinates, snakeSize, direction: Direction.Right, score: 0 }, () => this.renderSnake());
  }

  /**
   * @method renderSnake
   * @description Gets snake coordinates from state and renders it to canvas. Re-renders grid and food.
   */

  const renderSnake = (): void => {

    renderGrid();
    renderFood();
    snakeCoordinates.forEach((coordinate: ICell) => renderSquare(coordinate.x, coordinate.y, WHITE_COLOR));
  }

  /**
   * @method moveSnake
   * @description Computes new head coordinate on the tick and changes snake size if head is on the food coordinate.
   * Renders snake.
   */

  const moveSnake =  (): void => {
    let newSnakeCoordinates = [];
    const canvasSize = getCanvasSize() as number;
    const headCoordinates = snakeCoordinates[0] as ICell;
    const newHeadCoordinates = getComputedNextHeadCoordinates(headCoordinates, direction, canvasSize, cellSize);

    if (newHeadCoordinates) {

      if (isSameCoordinates(newHeadCoordinates, foodCoordinates)) {
        setSnakeSize(snakeSize + 1);
        setScore(score+1)
        newSnakeCoordinates = [ newHeadCoordinates, ...snakeCoordinates ];
        setFood();
      } else {
        newSnakeCoordinates = [ newHeadCoordinates, ...snakeCoordinates.slice(0, -1) ]
      }

       setSnakeCoordinates(newSnakeCoordinates)
       setSnakeSize(snakeSize)
       setScore(score)
      
      
    }
  };

  /**
   * @method handleKeyDown
   * @description Changes direction if event keyCode matches with arrows keyCodes.
   */

  const handleKeyDown = (e: any): void => {
    
    let newDirection = null;

    switch (e.keyCode) {
      case 37:
        if (direction !== Direction.Left && direction !== Direction.Right) newDirection = Direction.Left;
        break;
      case 38:
        if (direction !== Direction.Up && direction !== Direction.Down) newDirection = Direction.Up;
        break;
      case 39:
        if (direction !== Direction.Left && direction !== Direction.Right) newDirection = Direction.Right;
        break;
      case 40:
        if (direction !== Direction.Up && direction !== Direction.Down) newDirection = Direction.Down;
        break;
      default:
        return;
    }

    if (newDirection) {
      setDirection(newDirection)
    }
  };

  /**
   * @method setFood
   * @description Sets food random coordinate. Checks collision with snake.
   */

  const setFood = (): void => {
    const [ x, y ] = [ getRandomCoordinate(cellSize), getRandomCoordinate(cellSize) ];

    if (snakeCoordinates.some(part => isSameCoordinates({ x, y }, part))) {
      setFood();

    } else {
      setFoodCoordinates({ x, y })
    }
  }

  /**
   * @method renderFood
   * @description Gets food coordinate from state. Renders food.
   */

  const renderFood = () => {

    if (foodCoordinates) {
      const { x, y } = foodCoordinates;

      renderSquare(x, y, WHITE_COLOR);
    }
  }

  /**
   * @method loop
   * @description Main game loop. Checks collision when snake's head hits the body.
   */

  const loop = (): void => {
    timerId = setTimeout(() => {

      if (snakeCoordinates.slice(1).some(item => isSameCoordinates(item, snakeCoordinates[0]))) {
        clearTimeout(timerId);
        startGame();

      } else {
        moveSnake();
        window.requestAnimationFrame(loop);
      }
    }, 100);
  };

  /**
   * @method startGame
   * @description Starts game, renders grid, snake and food.
   */

  const startGame = (): void => {
    renderGrid();
    setInitialSnake();
    setFood();
    loop();
  }


    return (
      <div className="wrapper">
        <canvas onKeyDown={handleKeyDown} className="canvas" ref={canvas} tabIndex={0} />
        <div className="scoreboard">
          <span>Score: {score}</span>
        </div>
      </div>
    );
  
}

export default Snake;
