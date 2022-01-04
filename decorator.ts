import { Application, Context } from 'egg';
import { TSchema } from "./typebox";
import { ErrorObject } from 'ajv/dist/2019';
import Ajv from 'ajv';

type CustomErrorMessage = (ctx: Context, errors: ErrorObject[]) => string;
type GetData =  (ctx: Context, args: unknown[]) => unknown;
export type ValidateRule = [TSchema, GetData, CustomErrorMessage?];

export function ValidateFactory(customHandler: (ctx: Context, data: unknown, schema: TSchema, customError?: CustomErrorMessage) => void) {
  return function Validate(rules: ValidateRule[]): MethodDecorator {
    return (_, __, descriptor: PropertyDescriptor): PropertyDescriptor => {
      const fn = descriptor.value;
      descriptor.value = async function (...args) {
        const { ctx } = this;
        for (const rule of rules) {
          const [schema, getData, customError] = rule;
          const data = getData(ctx, args);
          const valid = ctx.tValidateWithoutThrow(schema, data);
          if (!valid && customHandler) {
            return customHandler(ctx, data, schema, customError);
          }
        }
        return await fn.apply(this, args);
      };
      return descriptor;
    }
  }
}

export const Validate = ValidateFactory((ctx, data, schema, customError) => {
  const app = ctx.app as Application & {ajv: Ajv};
  const message = customError ? customError(ctx, app.ajv.errors) : 'Validation Failed';
  ctx.throw(422, message, {
    code: 'invalid_param',
    errorData: data,
    currentSchema: JSON.stringify(schema),
    errors: app.ajv.errors,
  });
});
