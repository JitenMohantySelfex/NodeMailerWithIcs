import mongoose, { Schema, model, Document } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

interface IEmailLog extends Document {
  email: string;
  status: 'sent' | 'failed';
  error?: string;
  timestamp: Date;
}

// Optional: extend the Document to include paginate
export interface EmailLogModel<T extends Document> extends mongoose.PaginateModel<T> {}

const emailLogSchema = new Schema<IEmailLog>({
  email: { type: String, required: true },
  status: { type: String, enum: ['sent', 'failed'], required: true },
  error: { type: String },
  timestamp: { type: Date, default: Date.now }
});

emailLogSchema.plugin(mongoosePaginate);

// Export with paginate model type
export const EmailLog = model<IEmailLog, EmailLogModel<IEmailLog>>('EmailLog', emailLogSchema);
