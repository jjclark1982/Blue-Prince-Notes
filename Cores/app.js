
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

    concat(rhs) {
        const catValue = parseInt(`${this.value}${rhs.value}`);
        return new CoreUnit({value: catValue});
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

    toString() {
        return this.map((c)=>c.toString()).join('');
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

    groupings(n=4) {
        if (this.length < n) {
            return [];
        }
        else if (n == 1) {
            return [CoreWord.from([this.reduce(((a,b)=>a.concat(b)), new CoreUnit({value:0}))])];
        }
        else if (this.length == n) {
            return [this];
        }
        const results = [];
        for (let i = 1; i < this.length - n + 2; i++) {
            const head = this.slice(0, i).groupings(1)[0];
            const tail = this.slice(i, this.length).groupings(n-1);
            for (const t of tail) {
                results.push(CoreWord.from(head.concat(t)));
            }
        }
        return results;
    }

    *findPotentialCores() {
        for (const grouping of this.groupings(4)) {
            yield grouping.copyWithOperations(["add", "sub", "mul", "div"]);
            yield grouping.copyWithOperations(["add", "sub", "div", "mul"]);
            yield grouping.copyWithOperations(["add", "mul", "sub", "div"]);
            yield grouping.copyWithOperations(["add", "mul", "div", "sub"]);
            yield grouping.copyWithOperations(["add", "div", "sub", "mul"]);
            yield grouping.copyWithOperations(["add", "div", "mul", "sub"]);
        }
    }

    findCore() {
        const bestCore = [...this.findPotentialCores()]
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

function WordView ({word}) {
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
  ${words.map((word)=>(WordView({word})))}
  `;
}


render(html`<${App} message="clue"/>`, document.body);

Object.assign(globalThis, {CoreUnit, CoreWord})
