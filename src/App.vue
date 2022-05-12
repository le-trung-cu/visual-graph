<script lang="ts">
export enum actionStatus {
  none,
  select,
  delete,
  paintWall
}

</script>

<script setup lang="ts">
import { computed } from '@vue/reactivity'
import { onMounted, ref, toRef } from 'vue'
import { Graph, depthFirstSearch, breadthFistSearch, aStart, aStartShortest, Position, CellType } from "./algorithms";

enum CellTypeUI {
  wall,
  empty,
  startTemporary,
  endTemporaty,
}
type Cell = {
  position: Position,
  type: CellTypeUI,
}

const actionSatusSelected = ref(actionStatus.none)
const algorithmRun = ref(aStart)
const reRenderKey = ref(1);
let percent = ref(0.2)
const cols = 20
const rows = 20
const cells = computed(() => cols * rows)
const grid = ref<Array<Array<Cell>>>()
const start = ref<Position>(new Position(5, 5))
const end = ref<Position>(new Position(10, 10))
const _pp = computed(() => {
  let wall = 0
  grid.value?.forEach(row => {
    row.forEach(cell => {
      cell.type == CellTypeUI.wall && wall++;
    })
  })
  return wall / cells.value;
})
onMounted(() => {
  grid.value = new Array(rows);
  for (let row = 0; row < rows; row++) {
    grid.value[row] = new Array<Cell>(cols)
  }

  // init
  for (let i = 0; i < rows; i++) {
    const arrayRow = new Array<Cell>(cols)
    for (let j = 0; j < cols; j++) {
      arrayRow[j] = { position: new Position(i, j), type: CellTypeUI.empty }
    }
    grid.value[i] = arrayRow
  }
})
function createGrid() {
  const _grid: Array<Array<Cell>> = new Array(rows)

  for (let i = 0; i < rows; i++) {
    const arrayRow = new Array<Cell>(cols)
    for (let j = 0; j < cols; j++) {
      const cell: Cell = { position: new Position(i, j), type: Math.random() > percent.value ? CellTypeUI.empty : CellTypeUI.wall }
      arrayRow[j] = cell
    }
    _grid[i] = arrayRow
  }
  grid.value = _grid;
}

function run() {
  run2(start.value as Position, end.value as Position);
}

function run2(start: Position, end: Position) {
  const _grid = grid.value?.map(t => t.map(a => a.type !== CellTypeUI.empty ? CellType.wall : CellType.empty))!;
  const graph = new Graph(rows, cols, _grid)
  const { graphPath, visitedTrack } = algorithmRun.value!(graph, start, end)
  let drawVisited = Promise.resolve()
  visitedTrack.forEach(cell => {
    const cellDOM = document.getElementById(cell.Key)
    if (cellDOM) {
      drawVisited = drawVisited.then(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            cellDOM.style.backgroundColor = 'blue'
            resolve()
          }, 50)
        })
      })
    }
  })
  let drawPath = drawVisited.then();
  graphPath.forEach(key => {
    const cellDOM = document.getElementById(key)
    if (cellDOM) {
      drawPath = drawPath.then(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            cellDOM.style.background = 'yellow'
            resolve()
          }, 50)
        })
      })
    }
  })
}

function runWithoutTimeOut(start: any, end: any) {
  const _grid = grid.value?.map(t => t.map(a => a.type === CellTypeUI.wall ? CellType.wall : CellType.empty))!;
  const graph = new Graph(rows, cols, _grid)
  const { graphPath, visitedTrack } = algorithmRun.value!(graph, start, end)
  let drawVisited = Promise.resolve()
  visitedTrack.forEach(cell => {
    const cellDOM = document.getElementById(cell.Key)
    if (cellDOM) {
      cellDOM.style.backgroundColor = 'blue'
    }
  })
  let drawPath = drawVisited.then();
  drawPath.then(() => {
    graphPath.forEach(key => {
      const cellDOM = document.getElementById(key)
      if (cellDOM) {
        cellDOM.style.background = 'yellow'
      }
    })
  })
}

const cellSelected = ref<Cell | null>(null)

function onCellClick(cell: Cell) {
  if (cellSelected.value === null && !cell.position.equal(start.value) && !cell.position.equal(end.value)) {
    if (actionSatusSelected.value === actionStatus.delete) {
      cell.type = CellTypeUI.empty
    } else if (actionSatusSelected.value === actionStatus.paintWall) {
      cell.type = CellTypeUI.wall
    }
  } else if (cellSelected.value) {
    if (cell.type === CellTypeUI.startTemporary) {
      start.value = cell.position
    } else if (cell.type === CellTypeUI.endTemporaty) {
      end.value = cell.position
    }
    cellSelected.value = null
    cell.type = CellTypeUI.empty
  } else {
    cellSelected.value = cell
  }
}

let timeoutId: number | null = null
function onCellEnter(cell: Cell) {
  if (timeoutId !== null) {
    clearTimeout(timeoutId)
  }
  let _start = start.value
  let _end = end.value
  if (cellSelected.value) {
    if (cell.type === CellTypeUI.empty) {
      if (cellSelected.value.position.equal(start.value)) {
        cell.type = CellTypeUI.startTemporary
        _start = cell.position
      } else if (cellSelected.value.position.equal(end.value)) {
        cell.type = CellTypeUI.endTemporaty
        _end = cell.position
      }
    }
    timeoutId = setTimeout(() => {
      runWithoutTimeOut(_start, _end)
      timeoutId = null
    }, 0)
  }
}

function onCellLeave(cell: Cell) {
  if (cellSelected.value) {
    if (cell.type === CellTypeUI.startTemporary || cell.type === CellTypeUI.endTemporaty) {
      cell.type = CellTypeUI.empty
    }
  }
}

const algorithms = {
  'aStart Shortest': aStartShortest,
  'aStart Fastest': aStart,
  'depth First Search': depthFirstSearch,
  'breadth Fist Search': breadthFistSearch,
}

</script>

<template>
  <div>
    <div class="menu">
      <button @click="createGrid">Create Grid</button>
      <label>
        <input type="radio" v-model="actionSatusSelected" :value="actionStatus.delete"><span>delete wall</span>
      </label>
      <label>
        <input type="radio" v-model="actionSatusSelected" :value="actionStatus.paintWall"><span>paint wall</span>
      </label>
      <div class="algorithmRun">
        <label for="algorithmRun">algorithm:</label>
        <select id="algorithmRun" v-model="algorithmRun">
          <option v-for="item in Object.keys(algorithms)" :value="algorithms[item]">{{ item }}</option>
        </select>
      </div>
      <button @click="run">Run</button>
      <span>{{ _pp }}</span>
    </div>
    <div v-if="grid" class="grid" :key="reRenderKey">
      <div class="row" v-for="row in grid" :key="row[0].position.Key">
        <div :id="cell.position.Key" class="cell" v-for="cell in row" :key="cell.position.Key" :style="{
          backgroundColor: cell.type == CellTypeUI.wall ? 'gainsboro' :
            cell.type === CellTypeUI.startTemporary ? 'aqua' :
              cell.type === CellTypeUI.endTemporaty ? 'green' : 'white',
          opacity: cell.position.equal(cellSelected?.position) ? 0.4 : 1
        }" @pointerdown="onCellClick(cell)" @pointerenter="onCellEnter(cell)" @pointerleave="onCellLeave(cell)">
          <div v-if="start.Key === cell.position.Key" class="start"></div>
          <div v-if="end.Key === cell.position.Key" class="end"></div>
          <!-- <span style="font-size: 12px;">{{ cell.position.Key }}</span> -->
        </div>
      </div>
    </div>
  </div>

</template>

<style scoped>
input,
button,
label {
  cursor: pointer;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.menu {
  display: flex;
  justify-items: center;
  height: 50px;
  padding: 10px;
}

.menu>* {
  margin-right: 20px;
}

label {
  display: flex;
  align-items: center;
}
.algorithmRun{
  display: flex;
}
.row {
  display: flex;
  background-color: gray;
  justify-content: center;
  margin: auto;
}

.cell {
  border: 1px solid black;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  position: relative;
}

.start {
  background-color: aqua;
  position: absolute;
  width: 100%;
  height: 100%;
}

.end {
  background-color: green;
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>