import { GraphQLError } from 'graphql'
import { AttendeeModel } from '../../models/attendee'
import { EventModel } from '../../models/event'
import { IAuthParams, IAttendee } from '../../interfaces/types'

// Define the AttendeeInput interface here since it's not available in the generated GraphQL types yet
interface AttendeeInput {
  name: string
  email: string
  phone: string
  event: string
  additionalInfo?: string
}

export const Attendees = {
  Query: {
    getEventAttendees: async (
      _: any,
      { eventId }: { eventId: string },
      context: IAuthParams
    ) => {
      // Check if the event exists
      const event = await EventModel.findById(eventId)
      if (!event) {
        throw new GraphQLError('Event not found')
      }

      // If the event is private, only the creator can see attendees
      if (event.isPrivate && (!context.isAuthorized || event.createdBy.toString() !== context.userId)) {
        throw new GraphQLError('Unauthorized to view attendees for this event')
      }

      // Get all attendees for this event
      const attendees = await AttendeeModel.find({ event: eventId })
      return attendees
    }
  },
  Mutation: {
    registerForEvent: async (
      _: any,
      { attendee }: { attendee: AttendeeInput }
    ) => {
      // Check if the event exists
      const event = await EventModel.findById(attendee.event)
      if (!event) {
        throw new GraphQLError('Event not found')
      }

      // Check if the event has already started
      const now = new Date()
      const eventStart = new Date(event.start)
      if (eventStart < now) {
        throw new GraphQLError('Cannot register for an event that has already started')
      }

      // Check if there are still available spots
      const attendeeCount = await AttendeeModel.countDocuments({ 
        event: attendee.event,
        status: { $ne: 'cancelled' }
      })
      
      if (attendeeCount >= event.number_of_attendees) {
        throw new GraphQLError('This event is already at full capacity')
      }

      // Check if the email is already registered for this event
      const existingAttendee = await AttendeeModel.findOne({ 
        event: attendee.event,
        email: attendee.email,
        status: { $ne: 'cancelled' }
      })
      
      if (existingAttendee) {
        throw new GraphQLError('You are already registered for this event')
      }

      // Create a new attendee record
      const newAttendee = new AttendeeModel({
        name: attendee.name,
        email: attendee.email,
        phone: attendee.phone,
        event: attendee.event,
        status: 'registered',
        additionalInfo: attendee.additionalInfo || '',
      })

      const savedAttendee = await newAttendee.save()
      return savedAttendee
    },

    updateAttendeeStatus: async (
      _: any,
      { id, status }: { id: string, status: string },
      context: IAuthParams
    ) => {
      if (!context.isAuthorized) {
        throw new GraphQLError('Unauthorized')
      }

      // Find the attendee record
      const attendee = await AttendeeModel.findById(id)
      if (!attendee) {
        throw new GraphQLError('Attendee not found')
      }

      // Check if the user is the event creator
      const event = await EventModel.findById(attendee.event)
      if (!event) {
        throw new GraphQLError('Event not found')
      }

      if (event.createdBy.toString() !== context.userId) {
        throw new GraphQLError('Only the event creator can update attendee status')
      }

      // Update the status
      if (!['registered', 'attended', 'cancelled'].includes(status)) {
        throw new GraphQLError('Invalid status')
      }

      attendee.status = status as 'registered' | 'attended' | 'cancelled'
      const updatedAttendee = await attendee.save()
      return updatedAttendee
    },

    cancelRegistration: async (
      _: any,
      { id }: { id: string }
    ) => {
      // Find the attendee record
      const attendee = await AttendeeModel.findById(id)
      if (!attendee) {
        throw new GraphQLError('Registration not found')
      }

      // Check if the event has already started
      const event = await EventModel.findById(attendee.event)
      if (!event) {
        throw new GraphQLError('Event not found')
      }

      const now = new Date()
      const eventStart = new Date(event.start)
      if (eventStart < now) {
        throw new GraphQLError('Cannot cancel registration for an event that has already started')
      }

      // Update the status to cancelled
      attendee.status = 'cancelled'
      await attendee.save()
      return true
    }
  }
} 