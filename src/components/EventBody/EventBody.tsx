import { DateTime } from 'luxon'
import { useEffect, useState, ChangeEvent, FC, useContext } from 'react'
import AuthContext from '../../store/auth-context'
import Alert from '../UI/Alert/Alert'

export type EventType = {
  id?: string
  title: string
  start: string
  end: string
  isPrivate: boolean
  description: string
  createdById?: string
  venue: string
  hosted_by: string
  contact_number: string
  number_of_attendees: number
  speaker: string
}

type Props = {
  event: EventType
  disableEdit: boolean
  resetForm?: boolean
  onChangeValue: (prop: string, value: string | boolean) => void
  onValidate: (valid: boolean) => void
}

const EventBody: FC<Props> = ({
  event,
  disableEdit,
  resetForm,
  onChangeValue,
  onValidate,
}) => {
  const [localEvent, setLocalEvent] = useState<EventType>({ ...event })
  const [errorMsg, setErrorMsg] = useState<string>('')

  const authCtx = useContext(AuthContext)

  const validateEventDates = (start: string, end: string, title: string) => {
    const today = DateTime.now()
    const startDate = DateTime.fromISO(start)
    const endDate = DateTime.fromISO(end)
    const diffInMonths = endDate.diff(startDate, 'months')

    if (!startDate.isValid || !endDate.isValid) {
      onValidate(false)
    } else if (startDate.valueOf() >= endDate.valueOf()) {
      setErrorMsg('End date must be greater than start date.')
      onValidate(false)
    } else if (startDate.valueOf() < today.valueOf()) {
      setErrorMsg('Start date can not be in the past.')
      onValidate(false)
    } else if (diffInMonths.months > 1) {
      setErrorMsg('Event can not be more than a month long.')
      onValidate(false)
    } else if (!title.trim()) {
      setErrorMsg('')
      onValidate(false)
    } else {
      setErrorMsg('')
      onValidate(true)
    }
  }

  const handleValueChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    prop: string,
  ) => {
    const { value } = event.target

    const getValue = () =>
      prop === 'isPrivate' ? (event.target as HTMLInputElement).checked : value

    if (prop == 'number_of_attendees') {
    }
    setLocalEvent({
      ...localEvent,
      [prop]: getValue(),
    })

    if (prop === 'title') {
      validateEventDates(localEvent.start, localEvent.end, value)
    }
    if (prop === 'start') {
      validateEventDates(value, localEvent.end, localEvent.title)
    }
    if (prop === 'end') {
      validateEventDates(localEvent.start, value, localEvent.title)
    }

    onChangeValue(prop, getValue())
  }

  useEffect(() => {
    const auth = authCtx.getAuth()
    if (auth) {
      if (
        auth.userId === localEvent.createdById ||
        localEvent.createdById === ''
      ) {
        validateEventDates(localEvent.start, localEvent.end, localEvent.title)
      }
    }
    if (resetForm) {
      setLocalEvent({ ...event })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authCtx, resetForm])

  return (
    <div className='row g-3'>
      <div className='col-12 required'>
        <label htmlFor='title' className='form-label'>
          Title
        </label>
        <input
          type='text'
          className='form-control'
          disabled={disableEdit}
          id='title'
          placeholder='Title'
          maxLength={50}
          value={localEvent.title}
          onChange={(e) => handleValueChange(e, 'title')}
        />
      </div>
      <div className='col-md-6 required'>
        <label htmlFor='start' className='form-label'>
          Start
        </label>
        <input
          type='datetime-local'
          className='form-control'
          disabled={disableEdit}
          id='start'
          placeholder='Start'
          value={localEvent.start}
          onChange={(e) => handleValueChange(e, 'start')}
        />
      </div>
      <div className='col-md-6 required'>
        <label htmlFor='end' className='form-label'>
          End
        </label>
        <input
          type='datetime-local'
          className='form-control'
          disabled={disableEdit}
          id='end'
          min={localEvent.start}
          value={localEvent.end}
          placeholder='End'
          onChange={(e) => handleValueChange(e, 'end')}
        />
      </div>
      {errorMsg && !disableEdit && (
        <div className='col-12'>
          <Alert
            msg={errorMsg}
            type='warning'
            onClose={() => setErrorMsg('')}
          />
        </div>
      )}
      <div className='col-12'>
        <label htmlFor='description' className='form-label'>
          Description
        </label>
        <textarea
          className='form-control'
          disabled={disableEdit}
          id='description'
          rows={3}
          value={localEvent.description}
          maxLength={1000}
          onChange={(e) => handleValueChange(e, 'description')}
        ></textarea>
      </div>
      <div className='col-6 required'>
        <label htmlFor='venue' className='form-label'>
          Venue
        </label>
        <input
          type='text'
          className='form-control'
          disabled={disableEdit}
          id='venue'
          placeholder='Venue'
          maxLength={50}
          value={localEvent.venue}
          onChange={(e) => handleValueChange(e, 'venue')}
        />
      </div>
      <div className='col-6 required'>
        <label htmlFor='speaker' className='form-label'>
          Speaker
        </label>
        <input
          type='text'
          className='form-control'
          disabled={disableEdit}
          id='speaker'
          placeholder='Speaker'
          maxLength={50}
          value={localEvent.speaker}
          onChange={(e) => handleValueChange(e, 'speaker')}
        />
      </div>

      <div className='col-6 required'>
        <label htmlFor='contact_number' className='form-label'>
          Contact Number
        </label>
        <input
          type='tel'
          className='form-control'
          disabled={disableEdit}
          id='contact_number'
          placeholder='Enter Contact Number'
          // pattern='009[0-9]{10,12}'
          value={localEvent.contact_number}
          onChange={(e) => handleValueChange(e, 'contact_number')}
          required
        />
      </div>

      <div className='col-6 required'>
        <label htmlFor='number_of_attendees' className='form-label'>
          Number Of Attendees
        </label>
        <input
          type='number'
          className='form-control'
          disabled={disableEdit}
          id='number_of_attendees'
          placeholder='Number of Attendees'
          value={localEvent.number_of_attendees}
          onChange={(e) => handleValueChange(e, 'number_of_attendees')}
        />
      </div>

      <div className='col-6 required'>
        <label htmlFor='hosted_by' className='form-label'>
          Hosted By
        </label>
        <input
          type='text'
          className='form-control'
          disabled={disableEdit}
          id='hosted_by'
          placeholder='Hosted  By'
          maxLength={50}
          value={localEvent.hosted_by}
          onChange={(e) => handleValueChange(e, 'hosted_by')}
        />
      </div>
      <div className='col-6 '>
        <div className='form-check' style={{ marginTop: '40px' }}>
          <input
            className='form-check-input'
            type='checkbox'
            disabled={disableEdit}
            id='gridCheck'
            checked={localEvent.isPrivate}
            onChange={(e) => handleValueChange(e, 'isPrivate')}
          />
          <label className='form-check-label' htmlFor='gridCheck'>
            Private (event is only visible to you)
          </label>
        </div>
      </div>
    </div>
  )
}

export default EventBody
