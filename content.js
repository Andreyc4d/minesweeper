console.log("Контентный скрипт запущен");

if (!window.__my_content_script_loaded__) {
  window.__my_content_script_loaded__ = true;

  // Инициализация логики ожидания игры
  waitForGameReady();
} else {
  // Если уже загружен — просто запустить повторно
  runBotIfGameExists();
}

function waitForGameReady() {
  const checkInterval = setInterval(() => {
    const game_mine = document.getElementById("game");
    if (game_mine) {
      clearInterval(checkInterval);
      initBot(game_mine);
    }
  }, 100);
}

function runBotIfGameExists() {
  const game_mine = document.getElementById("game");
  if (game_mine) {
    initBot(game_mine);
  } else {
    console.warn("Элемент #game не найден. Повторная инициализация невозможна.");
  }
}

// Основная логика
function initBot(game_mine) {
  const square = new Map();
  square.set("square blank", "blank");
  square.set("square open0", 0);
  square.set("square open1", 1);
  square.set("square open2", 2);
  square.set("square open3", 3);
  square.set("square open4", 4);
  square.set("square open5", 5);
  square.set("square open6", 6);
  square.set("square open7", 7);
  square.set("square open8", 8);
  square.set("square bombflagged", "flag");

  const square_blank = "square blank";

  let matrix = [];

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function custom_sleep(ms) {
    await sleep(ms);
  }

  function right_click(x, y) {
    const id_square = `${x}_${y}`;
    const sq = document.getElementById(id_square);
    if (sq && sq.className === square_blank) {
      const mousedownEvent = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        button: 2
      });
      const mouseupEvent = new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        button: 2
      });
      sq.dispatchEvent(mousedownEvent);
      custom_sleep(200);
      sq.dispatchEvent(mouseupEvent);
    }
  }

  function two_buutons_click(x, y) {
    const id_square = `${x}_${y}`;
    const sq = document.getElementById(id_square);
    const sq_target = square.get(sq?.className);
    if (sq && typeof sq_target === 'number') {
      const mouseDownEvent1 = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 2,
        buttons: 3
      });
      const mouseDownEvent2 = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 0,
        buttons: 3
      });
      sq.dispatchEvent(mouseDownEvent1);
      sq.dispatchEvent(mouseDownEvent2);
      custom_sleep(200);
      const mouseUpEvent1 = new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 0,
        buttons: 3
      });
      const mouseUpEvent2 = new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 2,
        buttons: 3
      });
      sq.dispatchEvent(mouseUpEvent1);
      sq.dispatchEvent(mouseUpEvent2);
    }
  }

  function get_near_sq(x, y, raws, cols) {
    let res = [];
    if (x != 1 && x != raws && y != 1 && y != cols) {
      res = [[x+1,y],[x+1,y-1],[x,y-1],[x-1,y-1],[x-1,y],[x-1,y+1],[x,y+1],[x+1,y+1]];
    } else {
      // обработка краёв поля
      if (x == 1 && y == 1) res = [[x,y+1], [x+1,y+1], [x+1,y]];
      else if (x == raws && y == 1) res = [[x,y+1], [x-1,y+1], [x-1,y]];
      else if (x == 1 && y == cols) res = [[x,y-1], [x+1,y-1], [x+1,y]];
      else if (x == raws && y == cols) res = [[x-1,y], [x-1,y-1], [x,y-1]];
      else if (x == 1) res = [[x,y-1], [x+1,y-1], [x+1,y], [x+1,y+1], [x,y+1]];
      else if (x == raws) res = [[x,y-1], [x-1,y-1], [x-1,y], [x-1,y+1], [x,y+1]];
      else if (y == 1) res = [[x-1,y], [x-1,y+1], [x,y+1], [x+1,y+1], [x+1,y]];
      else if (y == cols) res = [[x-1,y], [x-1,y-1], [x,y-1], [x+1,y-1], [x+1,y]];
    }
    return res;
  }

  function get_value(x, y) {
    const id_square = `${x}_${y}`;
    const sq = document.getElementById(id_square);
    return sq ? square.get(sq.className) : undefined;
  }

  function test_sq(test_arr, val_sq, coor) {
    let temp_blank = 0;
    let temp_flag = 0;

    for (let [i, j] of test_arr) {
      const val = get_value(i, j);
      if (val === "blank") temp_blank++;
      else if (val === "flag") temp_flag++;
    }

    if (val_sq > temp_flag && (val_sq - temp_flag === temp_blank)) {
      for (let [i, j] of test_arr) {
        if (get_value(i, j) === "blank") {
          right_click(i, j);
        }
      }
    }

    if (val_sq === temp_flag && temp_blank > 0) {
      two_buutons_click(coor[0], coor[1]);
    }
  }

  const mine_field = game_mine.getElementsByClassName("square");
  let temp = 0;
  for (let elem of mine_field) {
    if (elem.style.display === "none") continue;
    if (elem.id) {
      const raw = Number(elem.id.split('_')[0]);
      const col = Number(elem.id.split('_')[1]);
      if (col === 1) matrix[raw - 1] = [];
      matrix[raw - 1][col - 1] = square.get(elem.className);
      temp++;
    }
  }

  const cols = matrix[1].length;
  const raws = matrix.length;

  for (let i = 0; i < raws; i++) {
    for (let j = 0; j < cols; j++) {
      const x = i + 1;
      const y = j + 1;
      const val = get_value(x, y);
      if (typeof val === "number" && val !== 0) {
        const near = get_near_sq(x, y, raws, cols);
        test_sq(near, val, [x, y]);
      }
    }
  }

  console.log("Игра захвачена!!!");
}
