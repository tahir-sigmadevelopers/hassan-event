import { FC, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import CardView from '../../../components/UI/CardView/CardView'
import Alert from '../../../components/UI/Alert/Alert'
import Spinner from '../../../components/UI/Spinner/Spinner'
import { EventFull, useGetEventMutation } from '../../../generated/graphql'
import { dateToTitle } from '../../../utils/dateTransforms'

const SharedEvent: FC = () => {
  const [getEvent, { data, loading, error }] = useGetEventMutation()
  const [attendees, setAttendees] = useState<any[]>([])
  const [attendeesLoading, setAttendeesLoading] = useState<boolean>(false)

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
          if (data.success && data.attendees) {
            setAttendees(data.attendees)
          }
        })
        .catch(error => {
          console.error('Error fetching attendees:', error)
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
  const attendeeCount = attendees.length
  const availableSpots = Math.max(0, maxAttendees - attendeeCount)

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

  return <CardView card={card} />
}

export default SharedEvent
