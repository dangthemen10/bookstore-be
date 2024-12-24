import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '@modules/auth/auth.module';
import { AvatarModule } from '@modules/avatar/avatar.module';
import { BookModule } from '@modules/books/book.module';
import { UserModule } from '@modules/users/user.module';
import { Connection } from 'mongoose';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { envConfig } from '@/common/config/env.config';
import { EmailModule } from '@/providers/email/email.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: envConfig().mongodbUri,
        connectionFactory: (connection: Connection) => {
          connection.set('useNewUrlParser', true);
          connection.set('useFindAndModify', false);
          connection.set('useCreateIndex', true);
          return connection;
        },
        onConnectionCreate: (connection: Connection) => {
          connection.on('connected', () => console.log('connected'));
          connection.on('open', () => console.log('open'));
          connection.on('disconnected', () => console.log('disconnected'));
          connection.on('reconnected', () => console.log('reconnected'));
          connection.on('disconnecting', () => console.log('disconnecting'));
          return connection;
        },
      }),
    }),
    EmailModule,
    UserModule,
    AuthModule,
    BookModule,
    AvatarModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
