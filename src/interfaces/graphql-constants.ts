import { gql } from '@apollo/client';

export const GET_EVENT_ATTENDEES_QUERY = gql`
  query getEventAttendees($eventId: ID!) {
    getEventAttendees(eventId: $eventId) {
      id
      name
      email
      phone
      event
      status
      additionalInfo
      createdAt
      updatedAt
    }
  }
`;

export const REGISTER_FOR_EVENT_MUTATION = gql`
  mutation registerForEvent($attendee: AttendeeInput!) {
    registerForEvent(attendee: $attendee) {
      id
      name
      email
      phone
      event
      status
      additionalInfo
    }
  }
`;

export const CANCEL_REGISTRATION_MUTATION = gql`
  mutation cancelRegistration($id: ID!) {
    cancelRegistration(id: $id)
  }
`; 