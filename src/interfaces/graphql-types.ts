// Custom GraphQL types for Attendee functionality
import { DocumentNode } from 'graphql';
import { MutationHookOptions, MutationTuple, useMutation, QueryHookOptions, QueryResult, useQuery } from '@apollo/client';
import { REGISTER_FOR_EVENT_MUTATION, CANCEL_REGISTRATION_MUTATION, GET_EVENT_ATTENDEES_QUERY } from './graphql-constants';

export interface AttendeeInput {
  name: string;
  email: string;
  phone: string;
  event: string;
  additionalInfo?: string;
}

export interface Attendee {
  id: string;
  name: string;
  email: string;
  phone: string;
  event: string;
  status: string;
  additionalInfo?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface RegisterForEventMutationVariables {
  attendee: AttendeeInput;
}

export interface RegisterForEventMutationResult {
  registerForEvent: Attendee;
}

export interface CancelRegistrationMutationVariables {
  id: string;
}

export interface CancelRegistrationMutationResult {
  cancelRegistration: boolean;
}

export interface GetEventAttendeesQueryVariables {
  eventId: string;
}

export interface GetEventAttendeesQueryResult {
  getEventAttendees: Attendee[];
}

// Custom hooks
export function useRegisterForEventMutation(
  options?: MutationHookOptions<RegisterForEventMutationResult, RegisterForEventMutationVariables>
): MutationTuple<RegisterForEventMutationResult, RegisterForEventMutationVariables> {
  return useMutation<RegisterForEventMutationResult, RegisterForEventMutationVariables>(
    REGISTER_FOR_EVENT_MUTATION,
    options
  );
}

export function useCancelRegistrationMutation(
  options?: MutationHookOptions<CancelRegistrationMutationResult, CancelRegistrationMutationVariables>
): MutationTuple<CancelRegistrationMutationResult, CancelRegistrationMutationVariables> {
  return useMutation<CancelRegistrationMutationResult, CancelRegistrationMutationVariables>(
    CANCEL_REGISTRATION_MUTATION,
    options
  );
}

export function useGetEventAttendeesQuery(
  eventId: string,
  options?: QueryHookOptions<GetEventAttendeesQueryResult, GetEventAttendeesQueryVariables>
): QueryResult<GetEventAttendeesQueryResult, GetEventAttendeesQueryVariables> {
  return useQuery<GetEventAttendeesQueryResult, GetEventAttendeesQueryVariables>(
    GET_EVENT_ATTENDEES_QUERY,
    {
      variables: { eventId },
      ...options
    }
  );
} 