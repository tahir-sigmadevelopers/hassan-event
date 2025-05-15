import React, { FC, useState } from 'react';
import { useGetEventAttendeesQuery } from '../../interfaces/graphql-types';
import { Table, Badge, Spinner, Alert } from 'react-bootstrap';

interface EventAttendeesProps {
  eventId: string;
}

const EventAttendees: FC<EventAttendeesProps> = ({ eventId }) => {
  const { data, loading, error } = useGetEventAttendeesQuery(eventId);

  // Return loading state
  if (loading) {
    return <Spinner animation="border" role="status" className="m-3" />;
  }

  // Return error state
  if (error) {
    return (
      <Alert variant="danger">
        Error loading attendees: {error.message}
      </Alert>
    );
  }

  // Return empty state
  if (!data || !data.getEventAttendees || data.getEventAttendees.length === 0) {
    return (
      <Alert variant="info">
        No attendees have registered for this event yet.
      </Alert>
    );
  }

  // Render attendees table
  return (
    <div className="event-attendees mt-4">
      <h4>Event Attendees ({data.getEventAttendees.length})</h4>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.getEventAttendees.map((attendee, index) => (
            <tr key={attendee.id}>
              <td>{index + 1}</td>
              <td>{attendee.name}</td>
              <td><a href={`mailto:${attendee.email}`}>{attendee.email}</a></td>
              <td><a href={`tel:${attendee.phone}`}>{attendee.phone}</a></td>
              <td>
                <Badge bg={
                  attendee.status === 'registered' ? 'primary' : 
                  attendee.status === 'attended' ? 'success' : 
                  'secondary'
                }>
                  {attendee.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default EventAttendees; 