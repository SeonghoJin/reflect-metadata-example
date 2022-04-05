function first(this: any) {
    console.log(this);
    console.log("first(): factory evaluated");
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        console.log("first(): called");
    };
}

function second() {
    console.log("second(): factory evaluated");
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        console.log("second(): called");
    };
}

function third(this: any, target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    console.log(`this=${this}`);
    console.log(`target=`, target);
    console.log(`propertyKey=${propertyKey}`);
    console.log(`descriptor=`, descriptor);

}

function classDeco(constructor: Function) {
    console.log(constructor);
}

function reportableClassDecorator<T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
        test = "hello";
    }
}

function accessorDeco(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<string>) {
    console.log("acessorDeco");
    console.log(target);
    console.log(propertyKey);
    console.log(descriptor);
}

import "reflect-metadata";
const formatMetadataKey = Symbol("format");

function format(formatString: string) {
    return Reflect.metadata(formatMetadataKey, formatString);
}
function getFormat(target: any, propertyKey: string) {
    return Reflect.getMetadata(formatMetadataKey, target, propertyKey);
}

class Greeter {
    @format("Hello, %s")
    greeting: string;
    constructor(message: string) {
        this.greeting = message;
    }
    greet() {
        let formatString = getFormat(this, "greeting");
        return formatString.replace("%s", this.greeting);
    }
}

const requiredMetadataKey = Symbol("required");

function required(target: Object, propertyKey: string | symbol, parameterIndex: number) {
    let existingRequiredParameters: number[] = Reflect.getOwnMetadata(requiredMetadataKey, target, propertyKey) || [];
    existingRequiredParameters.push(parameterIndex);
    Reflect.defineMetadata(requiredMetadataKey, existingRequiredParameters, target, propertyKey);
}

function validate(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<(verbos: boolean) => string>) {
    let method = descriptor.value!;

    descriptor.value = function () {
        let requiredParameters: number[] = Reflect.getOwnMetadata(requiredMetadataKey, target, propertyName);
        if (requiredParameters) {
            for (let parameterIndex of requiredParameters) {
                if (parameterIndex >= arguments.length || arguments[parameterIndex] === undefined) {
                    throw new Error("Missing required argument.");
                }
            }
        }
        //@ts-ignore
        return method.apply(this, arguments);
    };
}

class BugReport {
    type = "report";
    title: string;

    constructor(t: string) {
        this.title = t;
    }

    @validate
    print(@required verbose: boolean) {
        if (verbose) {
            return this.title;
        } else {
            return `type: ${this.type}\ntitle: ${this.title}`;
        }
    }
}

const report = new BugReport("Bug!!");
console.log(report.print(false));
//@ts-ignore
console.log(report.print())

const greeter = new Greeter("hello");
console.log(greeter.greet());


@reportableClassDecorator
@classDeco
class ExampleClass {
    hi = "test";

    @accessorDeco
    get accessor() {
        return this.hi
    }
    @third
    method() {
        console.log(1);
    }
}


const example = new ExampleClass();
example.method();
console.log((example as any).test);
