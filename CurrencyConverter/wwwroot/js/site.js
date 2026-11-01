const $ = (id) => document.getElementById(id);

let currentEffect = null;

function signal(initialValue){
    let value = initialValue;
    const subscribers = new Set();

    return {
        get value(){
            if(currentEffect){
                subscribers.add(currentEffect);
            }
            return value;
        },
        set value(newValue){
            if(value !== newValue){
                value = newValue;
                subscribers.forEach(subscriber => subscriber());
            }
        }
    };
}

function effect(callback){
    const run = () => {
        const previous = currentEffect;
        currentEffect = run;
        try{
            callback();
        }finally{
            currentEffect = previous;
        }
    };
    run();
}

function computed(fn){
    const result = signal(undefined);
    effect(() => {
        result.value = fn();
    });
    return {
        get value(){
            return result.value;
        }
    }
}

const success = (message) => {
    bulmaToast.toast({ message: message, type: "is-success" });
}
const warning = (message) => {
    bulmaToast.toast({ message: message, type: "is-warning" });
}
const danger = (message) => {
    bulmaToast.toast({ message: message, type: "is-danger" });
}
