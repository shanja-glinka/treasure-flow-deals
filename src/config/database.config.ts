import { ConfigService } from '@nestjs/config';
import { MongooseModuleFactoryOptions } from '@nestjs/mongoose';

export const dbConfiguration = (
  configService: ConfigService,
): MongooseModuleFactoryOptions => {
  const dbConfig = configService.get('db');
  const { host, port, name, user, password } = dbConfig;

  const uri =
    user && password
      ? `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}?authSource=admin`
      : `mongodb://${host}:${port}/${name}`;

  return {
    uri,
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  };
};
