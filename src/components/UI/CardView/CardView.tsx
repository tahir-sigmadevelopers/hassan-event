import { FC, Fragment } from 'react'
import { formatDateTime } from '../../../utils/dateTransforms'

type CardViewType = {
  title: string | undefined
  subtitle?: string
  content: string | undefined
  createdAt?: number | undefined | null
  updatedAt?: number | undefined | null
  createdBy: string | undefined
  venue?: string
  hosted_by?: string
  contact_number?: string
  number_of_attendees?: number
  speaker?: string
}

type Props = {
  card: CardViewType
}

const CardView: FC<Props> = ({ card }) => {
  const {
    title,
    subtitle,
    content,
    createdBy,
    createdAt,
    updatedAt,
    number_of_attendees,
    hosted_by,
    contact_number,
    speaker,
    venue,
  } = card

  return (
    <div className='card'>
      <div className='card-body'>
        <h5 className='card-title'>{title}</h5>
        <h6 className='card-subtitle mb-2 text-muted'>{subtitle}</h6>
        <p className='card-text m-0'>Speaker : {speaker}</p>
        <p className='card-text m-0'>Venue : {venue}</p>
        <p className='card-text m-0'>Contact Number : {contact_number}</p>
        <p className='card-text m-0'>Hosted By : {hosted_by}</p>
        <p className='card-text m-0'>
          Number of Attendees: {number_of_attendees}
        </p>
        <p className='card-text'>
          <small className='text-muted'>
            posted by: {createdBy}{' '}
            {createdAt ? `on ${formatDateTime(createdAt)}` : null}
          </small>
          {updatedAt ? (
            new Date(updatedAt).getTime() !==
            new Date(createdAt ?? '').getTime() ? (
              <Fragment>
                <br />
                <small className='text-muted'>
                  updated on: {formatDateTime(updatedAt)}
                </small>
              </Fragment>
            ) : null
          ) : null}
        </p>
      </div>
    </div>
  )
}

export default CardView
