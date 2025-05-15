import { FC, Fragment, useState } from 'react'
import { formatDateTime } from '../../../utils/dateTransforms'
import EventRegistration from '../../EventRegistration'
import { Button } from 'react-bootstrap'
import toast from 'react-hot-toast'

type CardViewType = {
  id?: string
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
  availableSpots?: number | null
  attendees?: any[]
}

type Props = {
  card: CardViewType
}

const CardView: FC<Props> = ({ card }) => {
  const [showRegistration, setShowRegistration] = useState(false);
  // Track remaining spots locally
  const [remainingSpots, setRemainingSpots] = useState<number | null | undefined>(card.availableSpots);
  
  const {
    id,
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

  const handleRegisterClick = () => {
    setShowRegistration(true);
  };
  
  const handleRegistrationSuccess = () => {
    // Decrease available spots
    if (typeof remainingSpots === 'number') {
      setRemainingSpots(Math.max(0, remainingSpots - 1));
    }
    
    // Hide registration form
    setShowRegistration(false);
    
    // Show success message
    toast.success('You have successfully registered for this event!');
  };

  // Create a safe check for availableSpots
  const hasAvailableSpots = typeof remainingSpots === 'number' && remainingSpots > 0;
  // Create a safe spot count for display
  const spotCount = hasAvailableSpots ? remainingSpots : 0;

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <h6 className="card-subtitle mb-2 text-muted">{subtitle}</h6>
        <p className="card-text">{content}</p>
        <p className="card-text m-0">Speaker : {speaker}</p>
        <p className="card-text m-0">Venue : {venue}</p>
        <p className="card-text m-0">Contact Number : {contact_number}</p>
        <p className="card-text m-0">Hosted By : {hosted_by}</p>
        <p className="card-text m-0">
          Number of Attendees: {number_of_attendees}
          {hasAvailableSpots && (
            <span className="text-muted ms-2">
              ({spotCount} {spotCount === 1 ? 'spot' : 'spots'} available)
            </span>
          )}
        </p>
        <p className="card-text">
          <small className="text-muted">
            posted by: {createdBy}{' '}
            {createdAt ? `on ${formatDateTime(createdAt)}` : null}
          </small>
          {updatedAt ? (
            new Date(updatedAt).getTime() !==
            new Date(createdAt ?? '').getTime() ? (
              <Fragment>
                <br />
                <small className="text-muted">
                  updated on: {formatDateTime(updatedAt)}
                </small>
              </Fragment>
            ) : null
          ) : null}
        </p>
        
        {id && !showRegistration && hasAvailableSpots && (
          <Button 
            variant="primary" 
            onClick={handleRegisterClick}
            className="mt-3"
          >
            Register for this Event ({spotCount} {spotCount === 1 ? 'spot' : 'spots'} available)
          </Button>
        )}
        
        {id && !showRegistration && !hasAvailableSpots && (
          <Button 
            variant="secondary" 
            disabled 
            className="mt-3"
          >
            Event is at full capacity
          </Button>
        )}
        
        {id && showRegistration && (
          <EventRegistration 
            eventId={id} 
            availableSpots={remainingSpots}
            onSuccess={handleRegistrationSuccess}
          />
        )}
      </div>
    </div>
  )
}

export default CardView
