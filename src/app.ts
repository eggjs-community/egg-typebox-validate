import type { EggCore, ILifecycleBoot } from '@eggjs/core';
import addFormats from 'ajv-formats';
import { Ajv2019 as Ajv } from 'ajv/dist/2019.js';
import keyWords from 'ajv-keywords';

const getAjvInstance = () => {
  const ajv = new Ajv();
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  keyWords(ajv, 'transform');
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  addFormats(ajv, [
    'date-time',
    'time',
    'date',
    'email',
    'hostname',
    'ipv4',
    'ipv6',
    'uri',
    'uri-reference',
    'uuid',
    'uri-template',
    'json-pointer',
    'relative-json-pointer',
    'regex',
  ])
    .addKeyword('kind')
    .addKeyword('modifier');
  return ajv;
};

export default class AppBootHook implements ILifecycleBoot {
  public app: EggCore;

  constructor(app: EggCore) {
    this.app = app;
    this.app.ajv = getAjvInstance();
  }

  async configDidLoad() {
    const config = this.app.config;
    const typeboxValidate = config.typeboxValidate;
    if (typeboxValidate) {
      typeboxValidate.patchAjv?.(this.app.ajv);
    }
  }
}

declare module '@eggjs/core' {
  interface EggCore {
    ajv: Ajv;
  }
}
