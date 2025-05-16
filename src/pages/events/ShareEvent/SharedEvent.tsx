import { FC, useState, useEffect, useContext } from 'react'
import { Container } from 'react-bootstrap'
import Alert from 'react-bootstrap/Alert'
import CardView from '../../../components/UI/CardView/CardView'
import { dateToTitle } from '../../../utils/dateTransforms'
import { useParams } from 'react-router-dom'
import { useGetEventMutation } from '../../../generated/graphql'
import { EventFull } from '../../../generated/graphql'
import Spinner from '../../../components/UI/Spinner/Spinner'
import AuthContext from '../../../store/auth-context'
import EventStatsPanel from '../../../components/EventStatsPanel/EventStatsPanel'
import EventRating from '../../../components/EventRating/EventRating'
import { useChatBot } from '../../../components/ChatBot/ChatBotProvider'
import UIAlert from '../../../components/UI/Alert/Alert'

const SharedEvent: FC = () => {
  const { id } = useParams() as { id: string }
  const { auth } = useContext(AuthContext)
  const { addContextualQuestion } = useChatBot()
  const [attendees, setAttendees] = useState<any[]>([])
  const [attendeesLoading, setAttendeesLoading] = useState(false)
  const [totalAttendees, setTotalAttendees] = useState<number>(0)

  const [getEvent, { loading, data }] = useGetEventMutation({
    variables: { id }
  })

  // Fetch event and attendees data when component loads
  useEffect(() => {
    if (id) {
      getEvent({ variables: { id } })
      fetchAttendees()
    }
  }, [id, getEvent])

  // Add contextual help for shared events
  useEffect(() => {
    if (data?.getEvent.title) {
      const eventTitle = data.getEvent.title;
      // Wait a moment before showing the suggestion
      setTimeout(() => {
        addContextualQuestion(`help with ${eventTitle} event`);
      }, 3000);
    }
  }, [data, addContextualQuestion]);

  const fetchAttendees = async () => {
    if (!id) return
    
    setAttendeesLoading(true)
    try {
      const response = await fetch(`/api/attendees/${id}`)
      const data = await response.json()
      
      if (data.success && data.attendees) {
        setAttendees(data.attendees)
        setTotalAttendees(data.attendees.length)
      } else {
        setAttendees([])
        setTotalAttendees(0)
      }
    } catch (error) {
      console.error('Error fetching attendees:', error)
      setAttendees([])
      setTotalAttendees(0)
    } finally {
      setAttendeesLoading(false)
    }
  }

  if (loading) {
    return <Spinner />
  }

  if (!data?.getEvent) {
    return <Alert variant="danger">Event not found</Alert>
  }

  // Calculate available spots
  const maxAttendees = data?.getEvent.number_of_attendees || 0
  const availableSpots = Math.max(0, maxAttendees - totalAttendees)

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
        <UIAlert 
          msg="You are the event owner but no attendee data was found. This might be a data loading issue." 
          type="info" 
          dismissible={true} 
        />
      )}
      
      {/* Show event statistics */}
      {id && data?.getEvent.title && (
        <>
          <EventStatsPanel 
            eventId={id}
            totalSeats={maxAttendees}
            attendees={attendees} // Always pass the attendees data, the panel will handle permissions
            title={data?.getEvent.title || ''}
          />
          
          {/* Event Ratings and Reviews Section */}
          <EventRating 
            eventId={id} 
            title={data?.getEvent.title || ''} 
          />
        </>
      )}
    </Container>
  )
}

export default SharedEvent
