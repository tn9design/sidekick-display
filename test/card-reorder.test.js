import test from 'node:test';
import assert from 'node:assert/strict';
import {installCardReorder} from '../src/card-reorder.js';

function element() {
  const listeners = {}, classes = new Set();
  return {listeners, classes, append() {}, setAttribute() {}, contains:()=>false,
    classList:{add:value=>classes.add(value),remove:value=>classes.delete(value)},
    addEventListener(type, handler) {listeners[type] = handler;}};
}

test('card handles reorder on drop and clear target highlighting', () => {
  globalThis.document = {createElement:element};
  const moves = [], first = element(), second = element();
  const handle = installCardReorder(first, 0, (from,to)=>moves.push([from,to]));
  installCardReorder(second, 1, (from,to)=>moves.push([from,to]));
  const dataTransfer = {setData(type,value){assert.equal(type,'text/plain');assert.equal(value,'0');}};
  handle.listeners.dragstart({dataTransfer});
  second.listeners.dragover({dataTransfer,preventDefault(){}});
  assert.ok(second.classes.has('drag-over'));
  second.listeners.drop({preventDefault(){},stopPropagation(){}});
  assert.deepEqual(moves, [[0,1]]);
  assert.equal(second.classes.has('drag-over'), false);
});

test('card handles support keyboard moves and ignore unrelated nested drags', () => {
  globalThis.document = {createElement:element};
  const moves = [], entry = element();
  const handle = installCardReorder(entry, 2, (from,to)=>moves.push([from,to]));
  handle.listeners.keydown({key:'ArrowUp',preventDefault(){},stopPropagation(){}});
  handle.listeners.keydown({key:'ArrowDown',preventDefault(){},stopPropagation(){}});
  entry.listeners.drop({preventDefault(){throw new Error('Should not intercept nested drag');}});
  assert.deepEqual(moves, [[2,1],[2,3]]);
});
