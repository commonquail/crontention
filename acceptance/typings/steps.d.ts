/// <reference types='codeceptjs' />
type steps_file = typeof import('typings/steps_file.js');
type about = typeof import('page/about.page');
type home = typeof import('page/home.page');

declare namespace CodeceptJS {
  interface SupportObject { I: CodeceptJS.I, about: about, home: home }
  interface CallbackOrder { [0]: CodeceptJS.I; [1]: about; [2]: home }
  interface Methods extends CodeceptJS.Puppeteer {}
  interface I extends ReturnType<steps_file> {}
  namespace Translation {
    interface Actions {}
  }
}
