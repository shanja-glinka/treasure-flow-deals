import {
  isMongoId,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

const slugRegExp = /^[a-zA-Z0-9]+(?:[-_][a-zA-Z0-9]+)*$/;

function isStringSlug(value: unknown): boolean {
  return typeof value === 'string' && slugRegExp.test(value);
}

function validateValue(value: unknown): boolean {
  if (typeof value === 'string') {
    return isMongoId(value) || isStringSlug(value);
  }

  if (Array.isArray(value)) {
    return value.every((entry) => validateValue(entry));
  }

  return false;
}

export function IsMongoIdOrSlug(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      name: 'IsMongoIdOrSlug',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return validateValue(value);
        },
        defaultMessage(validationArguments?: ValidationArguments) {
          const prop = validationArguments?.property ?? 'value';
          return `${prop} must be a valid MongoId or slug`;
        },
      },
    });
  };
}
