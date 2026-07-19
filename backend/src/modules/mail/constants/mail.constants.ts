export const MAIL_QUEUE = 'mail';
export const MAIL_JOB_SEND = 'send';

export type SendMailJobData = {
  to: string;
  subject: string;
  html: string;
  type?:
    | 'registration'
    | 'password_reset'
    | 'email_change'
    | 'chat_notification'
    | 'order_notification';
};
