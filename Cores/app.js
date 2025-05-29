
import { html, render, useState, Component } from 'https://esm.sh/htm/preact/standalone'

class CoreUnit {
    static letterZero = 'A'.codePointAt(0) - 1;
    value = 0;
    text = null;
    operation = null;

    constructor({value, text, operation}) {
        this.value = value;
        this.text = text;
        if (operation != null) {
            this.operation = operation;
        }
    }

    evaluate(accumulator) {
        if (accumulator == null) {
            return this.value;
        }
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

    appendTo(lhs) {
        if (lhs == null) {
            return this;
        }
        return new CoreUnit({
            value: parseInt(`${lhs.value}${this.value}`),
            text: `${lhs.toString()}${this.toString()}`
        });
    }

    toString() {
        if (this.text) {
            return this.text;
        }
        try {
            return String.fromCodePoint(this.value + CoreUnit.letterZero);
        }
        catch {
            return '';
        }
    }

    static parse(text) {
        let value;
        if (!text.match(/[^-0-9]/)) {
            value = parseInt(text);
            return new CoreUnit({value});
        }
        else if (text.length > 1 && !text.match(/[^MDCXLVI]/i)) {
            return RomanUnit.parse(text);
        }
        else {
            return LatinUnit.parse(text);
        }
    }
}

class LatinUnit extends CoreUnit {
    static parse(text) {
        // how to handle a multi-letter unit? base 26?
        const value = text.toUpperCase().codePointAt(0) - CoreUnit.letterZero;
        return new LatinUnit({value, text});
    }
}

class RomanUnit extends CoreUnit {
    static romanSymbols = {
        'M' : 1000,
        'CM': 900,
        'D' : 500,
        'CD': 400,
        'C' : 100,
        'XC': 90,
        'L' : 50,
        'XL': 40,
        'X' : 10,
        'IX': 9,
        'V' : 5,
        'IV': 4,
        'I' : 1,
    }

    static parse(text) {
        let value = 0;
        let roman = text.toUpperCase();
        for (const [symbol, amount] of Object.entries(RomanUnit.romanSymbols)) {
            while (roman.indexOf(symbol) == 0) {
                roman = roman.substring(symbol.length);
                value += amount;
            }
        }
        return new RomanUnit({value, text})
    }

    appendTo(lhs) {
        if (lhs == null) {
            return this;
        }
        return RomanUnit.parse(`${lhs.toString()}${this.toString()}`)
    }
}

class CoreWord extends Array {
    static parse(word) {
        // if (word.length > 1 && !word.match(/[^MDCXLVI]/i)) {
        //     return CoreWord.from(word.split('').map(RomanUnit.parse));
        // }
        return CoreWord.from(word.split('').map(CoreUnit.parse));
    }

    static parseWordList(words) {
        return words.split(/\s+/).map(CoreWord.parse);
    }

    toString() {
        return this.map((unit)=>unit.toString()).join('');
    }

    toUnit() {
        return this.reduce(((a, b)=>b.appendTo(a)), null);
    }

    evaluate() {
        return this.reduce(((a, b)=>b.evaluate(a)), 0);
    }

    copyWithOperations(operations=[]) {
        if (operations.length != this.length) {
            throw new Error("operation length mismatch");
        }
        return this.map((unit, i)=>(new CoreUnit({
            value: unit.value,
            text: unit.text,
            operation: operations[i]
        })));
    }

    groupings(n=4) {
        if (this.length < n) {
            return [];
        }
        else if (n == 1) {
            return [CoreWord.from([this.toUnit()])];
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
    return html`
        <span class="unit-view" data-operation=${unit.operation}>
            ${unit.value}
            <br/>
            ${unit.toString()}
        </span>
    `;
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
            </div>
        `;
    }
    else {
        return html`
            <div class="unit-list-view">
                ${word.map((unit)=>UnitView({unit}))}
            </div>
        `;
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

Object.assign(globalThis, {CoreUnit, CoreWord, RomanUnit})
