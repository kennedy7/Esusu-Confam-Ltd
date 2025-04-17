import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GroupDocument = Group & Document;

@Schema({ timestamps: true })
export class Group {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: ['public', 'private'] })
  visibility: 'public' | 'private';

  @Prop({ required: true })
  maxCapacity: number;

  @Prop({ type: [{ type: String, ref: 'User' }], default: [] })
  members: string[];

  @Prop({ type: [{ type: String, ref: 'User' }], default: [] })
  joinRequests: string[];

  @Prop()
  inviteCode?: string; // Optional field, only for private groups

  @Prop({ required: true, type: String, ref: 'User' })
  admin: string;

}

export const GroupSchema = SchemaFactory.createForClass(Group);
