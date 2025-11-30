import { BadRequestException } from '@nestjs/common';
import { TrimValidationPipe } from '../app/core/common/pipes/trim-validator.pipe';

export const ValidationPipeConfig = () => {
  return new TrimValidationPipe({
    transform: true,
    whitelist: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    forbidNonWhitelisted: true,
    // skipNullProperties: true,
    exceptionFactory: (errors) => {
      // Function to build full property path
      const buildPath = (error: any, parentPath = ''): any => {
        const path = parentPath
          ? `${parentPath}.${error.property}`
          : error.property;

        if (error.children && error.children.length > 0) {
          // If there are child errors, we bypass them recursively
          return error.children.flatMap((childError) =>
            buildPath(childError, path),
          );
        }

        // If there are no errors, return a formatted error
        return {
          property: path,
          error:
            typeof error.constraints === 'object'
              ? Object.values(error.constraints).join(', ')
              : error.constraints || 'Invalid value',
          value: error.value,
        };
      };

      // We go through all the mistakes and build full paths
      const formattedErrors = errors.flatMap((error) => buildPath(error));

      return new BadRequestException({
        message: 'Validation errors',
        errors: formattedErrors,
      });
    },
  });
};
