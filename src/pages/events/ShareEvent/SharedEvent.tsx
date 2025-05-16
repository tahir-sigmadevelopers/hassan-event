import { FC, useEffect, useState, useContext } from 'react'
import { useParams } from 'react-router'
import CardView from '../../../components/UI/CardView/CardView'
import Alert from '../../../components/UI/Alert/Alert'
import Spinner from '../../../components/UI/Spinner/Spinner'
import { EventFull, useGetEventMutation } from '../../../generated/graphql'
import { dateToTitle } from '../../../utils/dateTransforms'
import EventStatsPanel from '../../../components/EventStatsPanel'
import AuthContext from '../../../store/auth-context'
import { Container } from 'react-bootstrap'

const SharedEvent: FC = () => {
  const [getEvent, { data, loading, error }] = useGetEventMutation()
  const [attendees, setAttendees] = useState<any[]>([])
  const [totalAttendees, setTotalAttendees] = useState<number>(0)
  const [attendeesLoading, setAttendeesLoading] = useState<boolean>(false)
  const { auth } = useContext(AuthContext)

  const { id } = useParams()

  useEffect(() => {
    getEvent({ variables: { id: id ?? '' } })
  }, [getEvent, id])

  useEffect(() => {
    // If we have an event ID, fetch attendees
    if (id) {
      setAttendeesLoading(true)
      fetch(`/api/attendees/${id}`)
        .then(response => response.json())
        .then(data => {
          console.log('Raw attendee data:', data);
          
          if (data.success && data.attendees) {
            // Format attendees data to match what EventStatsPanel expects
            const formattedAttendees = data.attendees.map((attendee: any) => ({
              id: attendee._id || attendee.id || String(Math.random()),
              name: attendee.name || 'Unknown',
              email: attendee.email || '',
              phone: attendee.phone || '',
              status: attendee.status || 'registered',
              createdAt: attendee.createdAt ? new Date(attendee.createdAt).getTime() : Date.now()
            }));
            
            console.log('Formatted attendees:', formattedAttendees);
            setAttendees(formattedAttendees);
            setTotalAttendees(data.attendees.length);
          } else {
            // If no attendees or error, set empty array
            setAttendees([]);
            setTotalAttendees(0);
            console.log('No attendees found or error in response');
          }
        })
        .catch(error => {
          console.error('Error fetching attendees:', error)
          setAttendees([]);
          setTotalAttendees(0);
        })
        .finally(() => {
          setAttendeesLoading(false)
        })
    }
  }, [id])

  if (loading || attendeesLoading) {
    return <Spinner />
  }

  if (error) {
    return <Alert msg={error.message} type='danger' dismissible={false} />
  }

  // Calculate available spots
  const maxAttendees = data?.getEvent.number_of_attendees || 0
  const availableSpots = Math.max(0, maxAttendees - totalAttendees)

  // Check if the current user is the event creator
  const creatorData = data?.getEvent.createdBy as any;
  const creatorId = creatorData?._id || creatorData?.id;
  const isEventOwner = auth && auth.userId === creatorId && id;

  console.log('Auth check:', { 
    authUserId: auth?.userId, 
    creatorId, 
    isMatch: auth?.userId === creatorId,
    isEventOwner,
    attendeesCount: attendees.length,
    attendeesData: attendees
  });

  // If the user is the event creator, ensure they can see the statistics
  const shouldShowFullStats = isEventOwner;

  const card = {
    id: id,
    title: data?.getEvent.title,
    subtitle: data?.getEvent && dateToTitle(data?.getEvent as EventFull),
    content: data?.getEvent.description,
    createdBy: data?.getEvent.createdBy?.username,
    createdAt: data?.getEvent.createdAt,
    updatedAt: data?.getEvent.updatedAt,
    venue: data?.getEvent.venue,
    hosted_by: data?.getEvent.hosted_by,
    contact_number: data?.getEvent.contact_number ?? '',
    number_of_attendees: data?.getEvent.number_of_attendees ?? 0,
    speaker: data?.getEvent.speaker,
    availableSpots: availableSpots,
    attendees: attendees
  }

  return (
    <Container>
      <CardView card={card} />
      
      {/* Debug message for event owners */}
      {isEventOwner && attendees.length === 0 && !attendeesLoading && (
        <Alert 
          msg="You are the event owner but no attendee data was found. This might be a data loading issue." 
          type="info" 
          dismissible={true} 
        />
      )}
      
      {/* Show event statistics */}
      {id && data?.getEvent.title && (
        <>
          {console.log('Sending to EventStatsPanel:', { 
            eventId: id,
            totalSeats: maxAttendees,
            isEventOwner,
            attendees,
            attendeesLength: attendees.length,
            title: data?.getEvent.title
          })}
          <EventStatsPanel 
            eventId={id}
            totalSeats={maxAttendees}
            attendees={attendees} // Always pass the attendees data, the panel will handle permissions
            title={data?.getEvent.title || ''}
          />
        </>
      )}
    </Container>
  )
}

export default SharedEvent
