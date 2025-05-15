import { Schema, model } from 'mongoose'
import { IAttendee } from '../interfaces/types'

const schema = new Schema<IAttendee>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'cancelled'],
      default: 'registered',
    },
    additionalInfo: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
)

export const AttendeeModel = model<IAttendee>('Attendee', schema) 