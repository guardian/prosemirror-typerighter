declare module "prosemirror-test-builder";
declare module "prosemirror-example-setup";
// Taken from https://github.com/developit/snarkdown/blob/master/snarkdown.d.ts –
// at time of writing the typescript definition file is not yet in the npm release.
declare module "snarkdown" {
  interface Links {
    [index: string]: string;
  }
  export default function (urlStr: string, prevLinks?: Links): string;
}
declare module "*.scss";
