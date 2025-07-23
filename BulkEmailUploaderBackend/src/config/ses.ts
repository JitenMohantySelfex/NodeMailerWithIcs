import { SES } from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

export const ses = new SES({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
  apiVersion: '2010-12-01'
});