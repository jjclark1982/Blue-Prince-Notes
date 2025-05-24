
import { html, render, useState, Component } from 'https://esm.sh/htm/preact/standalone'

class CoreUnit {
    static letterZero = 'A'.codePointAt(0) - 1;
    value = 0;
    operation = '';

    constructor({value, operation}) {
        this.value = value;
        if (operation != null) {
            this.operation = operation;
        }
    }

    evaluate(accumulator=0) {
        if (this.operation == 'add') {
            return accumulator + this.value;
        }
        else if (this.operation == 'sub') {
            return accumulator - this.value;
        }
        else if (this.operation == 'mul') {
            return accumulator * this.value;
        }
        else if (this.operation == 'div') {
            return accumulator / this.value;
        }
        else return this.value;
    }

    toString() {
        try {
            return String.fromCodePoint(this.value + CoreUnit.letterZero);
        }
        catch {
            return '';
        }
    }

    static parse(letter) {
        let value;
        if (!letter.match(/[^0-9]/)) {
            value = parseInt(letter);
        }
        else {
            value = letter.toUpperCase().codePointAt(0) - CoreUnit.letterZero;
        }
        return new CoreUnit({value});
    }
}

class CoreWord extends Array {
    static parse(word) {
        return CoreWord.from(word.split('').map(CoreUnit.parse));
    }

    static parseWordList(words) {
        return words.split(/\s+/).map(CoreWord.parse);
    }

    evaluate() {
        return this.reduce((a, b)=>{
            return b.evaluate(a)
        }, 0);
    }

    copyWithOperations(operations=[]) {
        if (operations.length != this.length) {
            throw new Error("operation length mismatch");
        }
        return this.map((unit, i)=>(new CoreUnit({value:unit.value, operation: operations[i]})));
    }

    findPotentialCores() {
        if (this.length != 4) {
            return [];
        }
        return [
            this.copyWithOperations(["add", "sub", "mul", "div"]),
            this.copyWithOperations(["add", "sub", "div", "mul"]),
            this.copyWithOperations(["add", "mul", "sub", "div"]),
            this.copyWithOperations(["add", "mul", "div", "sub"]),
            this.copyWithOperations(["add", "div", "sub", "mul"]),
            this.copyWithOperations(["add", "div", "mul", "sub"]),
        ];
    }

    findCore() {
        const bestCore = this.findPotentialCores()
            .map((w)=>[w, w.evaluate()])
            .filter(([w, c]) => c > 0 && Number.isInteger(c))
            .toSorted((a, b) => a[1] - b[1])
            .at(0);
        if (bestCore != null) {
            return bestCore[0];
        }
    }
}

function UnitView ({unit}) {
  const op = unit.operation || "";
  return html`<span class="unit-view" data-operation=${op}>${unit.value}<br/>${unit.toString()}</span>`;
}

function UnitListView ({word}) {
    const core = word.findCore();
    if (core) {
        const coreUnit = new CoreUnit({value: core.evaluate()});
        return html`
            <div class="unit-list-view">
            ${core.map((unit)=>UnitView({unit}))}
            ${" "}=${" "}
            <${UnitView} unit=${coreUnit} />
            </div>`;
    }
    else {
        return html`
            <div class="unit-list-view">
            ${word.map((unit)=>UnitView({unit}))}
            </div>`;
    }
}


function App (props) {
  const [message, setMessage] = useState(props.message || '');
  const words = CoreWord.parseWordList(message);
  return html`
  <h1>Numeric Core Solver</h1>
  <textarea value=${message} onKeyup=${function(event){setMessage(event.target.value)}} />
  ${words.map((word)=>(UnitListView({word})))}
  `;
}


render(html`<${App} message="clue"/>`, document.body);

Object.assign(globalThis, {CoreUnit, CoreWord})
