import { RequestMethod, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import { AllExceptionsFilter } from './app/core/common/filters/http-exception.filter';
import { ResponseInterceptor } from './app/core/interceptors';
import { LoggerService } from './app/core/middlewares';
import { setupSwagger } from './config/swagger.config';
import { ValidationPipeConfig } from './config/validation-pipe.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  const configService = app.get(ConfigService);
  app.setGlobalPrefix('api', {
    exclude: [{ path: '/s/*', method: RequestMethod.GET }],
  });
  app.enableVersioning({ type: VersioningType.URI });

  const httpAdapterHost = app.get(HttpAdapterHost);
  const loggerService = app.get(LoggerService);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost, loggerService));
  app.useGlobalPipes(ValidationPipeConfig());

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.use(helmet());
  app.enableCors();
  setupSwagger(app);
  app.use(cookieParser());

  const port = configService.get<number>('app.port');
  await app.listen(port, () => {
    loggerService.info(
      `'${process.env.APP_NAME}' is live on and serving traffic on port ${port}`,
    );
  });
}
bootstrap();
