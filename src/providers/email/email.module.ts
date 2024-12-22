import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import sendGridTransport from 'nodemailer-sendgrid-transport';
import { envConfig } from '@/common/config/env.config';
import { EmailService } from '@/providers/email/email.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: sendGridTransport({
        auth: {
          api_key: envConfig().email.sendgridApiKey,
        },
      }),
      defaults: {
        from: envConfig().email.emailSender,
      },
      preview: envConfig().mode === 'development',
      template: {
        dir: process.cwd() + '/src/providers/email/templates',
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
