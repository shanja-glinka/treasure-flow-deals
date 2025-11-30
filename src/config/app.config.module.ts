import { configuration } from '@config/configuration';
import { validationSchema } from '@config/validation';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

/** The AppConfigModule class imports and exports the configModule. */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `./.env`,

      load: [configuration],
      validationSchema,
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
