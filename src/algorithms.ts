import PriorityQueue from "js-priority-queue";

export enum CellType {
    wall,
    empty,
}

export class Position {
    row: number
    col: number
    private key: string
    constructor(row: number, col: number) {
        this.row = row
        this.col = col
        this.key = `${this.row}:${this.col}`
    }
    equal(position: Pick<Position, 'row' | 'col'>) {
        
        return position && this.row === position.row && this.col === position.col
    }
    get Key() {
        return this.key
    }
}
export class Node {
    position: Position
    cost: number
    heuristic: number

    constructor(position: Position, cost: number, heuristic: number){
        this.position = position
        this.cost = cost
        this.heuristic = heuristic
    }
}
type GraphPath = Array<Position>

export class Graph {
    rows: number
    cols: number
    grid: Array<Array<CellType>>
    constructor(rows: number, cols: number, grid: Array<Array<CellType>>) {
        this.rows = rows
        this.cols = cols
        this.grid = grid
    }

    isCellEmpty(position: Position) {
        return this.grid[position.row][position.col] === CellType.empty
    }
}

type SearchResult = { graphPath: GraphPath, visitedTrack: Array<Position> }

export function depthFirstSearch(graph: Graph, start: Position, end: Position) {
    const visitedCheck = new Set<string>() //'row:col'
    const visitedTrack = new Array<Position>()
    const visitedStack = new Array<Position>()
    const visitedPathTrack = new Map<string, string | null>() // <currentKey, pre_Key>
    // visitedTrack.push(start)
    visitedCheck.add(start.Key)
    visitedStack.push(start)
    visitedPathTrack.set(start.Key, null)
    let currentVisited: Position | undefined = visitedStack.pop()!
    while (currentVisited !== undefined) {
        if (currentVisited?.equal(end)) {
            break
        }
        const nextPosint = getNextPoints(currentVisited, graph)
            .find(p => !visitedCheck.has(p.Key)) as Position;
        if (nextPosint) {
            visitedCheck.add(nextPosint.Key)
            visitedTrack.push(nextPosint)
            visitedStack.push(nextPosint)
            visitedPathTrack.set(nextPosint.Key, currentVisited.Key)
            currentVisited = nextPosint
        } else {
            currentVisited = visitedStack.pop();
        }
    }
    const graphPath = getGraphPath(visitedPathTrack, start.Key, end.Key)
    return { graphPath, visitedTrack }
}

export function breadthFistSearch(graph: Graph, start: Position, end: Position) {
    const visitedCheck = new Set<string>() //'row:col'
    const visitedTrack = new Array<Position>()
    const visitedQueue = new Array<Position>()
    const visitedPathTrack = new Map<string, string | null>() // <currentKey, pre_Key>
    // visitedTrack.push(start)
    visitedCheck.add(start.Key)
    visitedQueue.push(start)
    visitedPathTrack.set(start.Key, null)
    while (visitedQueue.length > 0) {
        let currentVisited = visitedQueue.shift()!
        if (currentVisited?.equal(end)) {
            break
        }
        const nextPosints = getNextPoints(currentVisited, graph)
            .filter(p => !visitedCheck.has(p.Key))

        for (let i = 0; i < nextPosints.length; i++) {
            const nextPosint = nextPosints[i]
            visitedCheck.add(nextPosint.Key)
            visitedTrack.push(nextPosint)
            visitedQueue.push(nextPosint)
            visitedPathTrack.set(nextPosint.Key, currentVisited.Key)
            if (currentVisited.equal(end)) {
                const graphPath = getGraphPath(visitedPathTrack, start.Key, end.Key)
                return { graphPath, visitedTrack }
            }
        }
    }
    const graphPath = getGraphPath(visitedPathTrack, start.Key, end.Key)
    return { graphPath, visitedTrack }
}

export function aStart(graph: Graph, start: Position, end: Position) {
    const visitedQueue = new PriorityQueue<Position>({
        comparator: (a, b) => {
            const d1 = (a.col - end.col) * (a.col - end.col) + (a.row - end.row) * (a.row - end.row)
            const d2 = (b.col - end.col) * (b.col - end.col) + (b.row - end.row) * (b.row - end.row)
            // const d1 = Math.abs(a.col - end.col) + Math.abs(a.row - end.row)
            // const d2 = Math.abs(b.col - end.col) + Math.abs(b.row - end.row)
            return d1 - d2
        }
    })
    const visitedCheck = new Set<string>() //'row:col'
    const visitedTrack = new Array<Position>()
    const visitedPathTrack = new Map<string, string | null>() // <currentKey, pre_Key>
    // visitedTrack.push(start)
    visitedCheck.add(start.Key)
    visitedQueue.queue(start)
    visitedPathTrack.set(start.Key, null)
    while (visitedQueue.length > 0) {
        let currentVisited = visitedQueue.dequeue()!
        if (currentVisited?.equal(end)) {
            break
        }
        const nextPosints = getNextPoints(currentVisited, graph)
            .filter(p => !visitedCheck.has(p.Key))

        for (let i = 0; i < nextPosints.length; i++) {
            const nextPosint = nextPosints[i]
            visitedCheck.add(nextPosint.Key)
            visitedTrack.push(nextPosint)
            visitedQueue.queue(nextPosint)
            visitedPathTrack.set(nextPosint.Key, currentVisited.Key)
            if (currentVisited.equal(end)) {
                const graphPath = getGraphPath(visitedPathTrack, start.Key, end.Key)
                return { graphPath, visitedTrack }
            }
        }
    }
    const graphPath = getGraphPath(visitedPathTrack, start.Key, end.Key)
    return { graphPath, visitedTrack }
}

export function aStartShortest(graph: Graph, start: Position, end: Position) {
    function heuristic(a: Position){
        return Math.abs (a.col - end.col) + Math.abs(a.row - end.row)
    }
    const visitedQueue = new PriorityQueue<Node>({
        comparator: (a, b) => {
            const d1 = a.cost + heuristic(a.position)
            const d2 = b.cost + heuristic(b.position)
            // const d1 = Math.abs(a.col - end.col) + Math.abs(a.row - end.row)
            // const d2 = Math.abs(b.col - end.col) + Math.abs(b.row - end.row)
            return d1 - d2
        }
    })
    const visitedCheck = new Set<string>() //'row:col'
    const visitedTrack = new Array<Position>()
    const visitedPathTrack = new Map<string, string | null>() // <currentKey, pre_Key>
    const visitedCost = new Map<string, number>()
    visitedCost.set(start.Key, 0)
    // visitedTrack.push(start)
    visitedQueue.queue(new Node(start, 0, heuristic(start)))
    visitedPathTrack.set(start.Key, null)
    while (visitedQueue.length > 0) {
        let currentVisited = visitedQueue.dequeue()!
        if (currentVisited?.position.equal(end)) {
            break
        }
        const nextPositions = getNextPoints(currentVisited.position, graph)
        for (let i = 0; i < nextPositions.length; i++) {
            const nextPosition = nextPositions[i];
            const oldCost = visitedCost.has(nextPosition.Key)? visitedCost.get(nextPosition.Key)! : 999999999
            const newCost = currentVisited.cost + 1
            visitedTrack.push(nextPosition)
            if(newCost < oldCost){
                visitedQueue.queue(new Node(nextPosition, newCost, heuristic(nextPosition)))
                visitedCost.set(nextPosition.Key, newCost)
                visitedPathTrack.set(nextPosition.Key, currentVisited.position.Key)
            }
        }
    }
    const graphPath = getGraphPath(visitedPathTrack, start.Key, end.Key)
    return { graphPath, visitedTrack }
}

// <currentKey, pre_Key>
function getGraphPath(pathTrack: Map<string, string | null>, start: string, end: string) {
    if(!pathTrack.has(end)){
        
        return []
    }
    const path = Array<string>()
    let preKey = end;
    while (preKey !== null) {
        path.push(preKey)
        preKey = pathTrack.get(preKey)!
    }
    path.unshift()
    path.pop()
    console.log(path.length);
    
    return path.reverse()
}

function getNextPoints(position: Position, graph: Graph) {
    const nextPositions = new Array<Position>()
    if (position.row < graph.rows - 1) {
        const p = new Position(position.row + 1, position.col)
        if (graph.isCellEmpty(p)) {
            nextPositions.push(p)
        }
    }
    if (position.col < graph.cols - 1) {
        const p = new Position(position.row, position.col + 1)
        if (graph.isCellEmpty(p)) {
            nextPositions.push(p)
        }
    }
    if (position.row > 0) {
        const p = new Position(position.row - 1, position.col)
        if (graph.isCellEmpty(p)) {
            nextPositions.push(p)
        }
    }

    if (position.col > 0) {
        const p = new Position(position.row, position.col - 1)
        if (graph.isCellEmpty(p)) {
            nextPositions.push(p)
        }
    }
    return nextPositions
}