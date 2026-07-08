import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PinoLogger } from 'nestjs-pino';
import { MAIL_QUEUE, SendMailJobData } from './constants/mail.constants';
import { MailService } from './mail.service';

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  constructor(
    private readonly mailService: MailService,
    private readonly logger: PinoLogger,
  ) {
    super();
    this.logger.setContext(MailProcessor.name);
  }

  async process(job: Job<SendMailJobData>): Promise<void> {
    const { to, subject, type } = job.data;

    this.logger.info(
      { jobId: job.id, to, subject, type, attempt: job.attemptsMade + 1 },
      'Processing mail job',
    );

    await this.mailService.sendMailOrThrow(
      job.data.to,
      job.data.subject,
      job.data.html,
    );
  }
}
