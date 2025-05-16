import { Schema, model } from 'mongoose'

export interface IRating {
  eventId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  rating: number;
  review: string;
  createdAt: Date;
  updatedAt: Date;
  username: string;
}

const RatingSchema = new Schema<IRating>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    }
  },
  { timestamps: true },
)

// Compound index to ensure a user can only review an event once
RatingSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const RatingModel = model<IRating>('Rating', RatingSchema) 