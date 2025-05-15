import { FC, useEffect } from 'react'
import { useParams } from 'react-router'
import CardView from '../../../components/UI/CardView/CardView'
import Alert from '../../../components/UI/Alert/Alert'
import Spinner from '../../../components/UI/Spinner/Spinner'
import { EventFull, useGetEventMutation } from '../../../generated/graphql'
import { dateToTitle } from '../../../utils/dateTransforms'

const SharedEvent: FC = () => {
  const [getEvent, { data, loading, error }] = useGetEventMutation()

  const { id } = useParams()

  useEffect(() => {
    getEvent({ variables: { id: id ?? '' } })
  }, [getEvent, id])

  if (loading) {
    return <Spinner />
  }

  if (error) {
    return <Alert msg={error.message} type='danger' dismissible={false} />
  }

  const card = {
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
  }

  return <CardView card={card} />
}

export default SharedEvent
