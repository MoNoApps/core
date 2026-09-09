declare module "restify" {
  const restify: any;
  export default restify;
}

declare module "hamper" {
  export class Hamper {
    constructor(key: string);
    Roll(text: any): { type: string; value: string };
    Show(ink: any): any;
  }
}

declare module "mpill" {
  export class MPill {
    constructor(name: string, dburl: string);
    [key: string]: any;
  }
}

declare module "*.css" {
  const content: any;
  export default content;
}
