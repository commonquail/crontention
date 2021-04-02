/// <reference types='codeceptjs' />
type steps_file = typeof import('typings/steps_file.js');
type about = typeof import('page/about.page');
type home = typeof import('page/home.page');

declare namespace CodeceptJS {
  interface SupportObject { I: I, current: any, about: about, home: home }
  interface Methods extends Puppeteer {}
  interface I extends ReturnType<steps_file> {}
  namespace Translation {
    interface Actions {}
  }
}
