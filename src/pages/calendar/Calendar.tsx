import { FC, Fragment, useContext, useEffect, useRef, useState } from 'react'
import { Button, Col, Nav, Row, Tab } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { NetworkStatus, ApolloError } from '@apollo/client'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { DateClickArg } from '@fullcalendar/interaction'
import { EventClickArg } from '@fullcalendar/core'

import Alert from '../../components/UI/Alert/Alert'
import Modal from '../../components/UI/Modal/Modal'
import Spinner from '../../components/UI/Spinner/Spinner'
import { ServerErrorAlert } from '../../components/ServerErrorAlert/ServerErrorAlert'
import AuthContext from '../../store/auth-context'
import EventBody from '../../components/EventBody/EventBody'
import EventRegistration from '../../components/EventRegistration'
import EventAttendees from '../../components/EventAttendees'
import EventStatsPanel from '../../components/EventStatsPanel'
import EventRating from '../../components/EventRating'
import LoginContainer from '../user/LoginContainer/LoginContainer'

import {
  useDeleteEventMutation as useRemoveEventMutation,
  useSaveEventMutation,
  useGetEventsQuery,
  useGetEventsLazyQuery
} from '../../generated/graphql'
import { removeEvent } from '../../utils/apolloCache'
import client from '../../apollo'
import { EventType } from '../../components/EventBody/EventBody'
import { IAuth } from '../../types'

interface ModalBodyType {
  auth: IAuth | null
  event: EventType
  disableEdit: boolean
  onChangeValue: (prop: string, value: string | boolean) => void
  onValidate: (valid: boolean) => void
  onLogin: () => void
}

function Calendar() {
  const [modal, setModal] = useState({
    title: '',
    show: false,
  })

  const [event, setEvent] = useState<EventType>({
    title: '',
    start: '',
    end: '',
    isPrivate: false,
    description: '',
    createdById: '',
    venue: '',
    hosted_by: '',
    contact_number: '',
    number_of_attendees: 0,
    speaker: '',
  })

  const [actionBtns, setActionBtns] = useState({
    displayDeleteBtn: false,
    hideSaveBtn: true,
    disableSaveBtn: true,
    disableDeleteBtn: false,
  })

  const [showLoginModal, setShowLoginModal] = useState(false)
  const [disableEdit, setDisableEdit] = useState<boolean>(false)
  const [serverError, setServerError] = useState<ApolloError | null>(null)
  const [calendarReady, setCalendarReady] = useState<boolean>(false)

  const calendarApiRef = useRef<{
    value: DateClickArg['view']['calendar'] | null
  }>({
    value: null,
  })
  const clickInfoRef = useRef<{ value: EventClickArg | null }>({
    value: null,
  })

  const { displayDeleteBtn, hideSaveBtn, disableSaveBtn, disableDeleteBtn } =
    actionBtns

  const [
    getEvents,
    { loading: getEventsLoading, data: events, refetch, networkStatus },
  ] = useGetEventsLazyQuery({
    notifyOnNetworkStatusChange: true,
    onError: setServerError,
    fetchPolicy: 'cache-and-network',
  })

  const {
    title,
    start,
    end,
    isPrivate,
    description,
    venue,
    hosted_by,
    contact_number,
    number_of_attendees,
    speaker,
  } = event

  const [saveEvent, { loading: saveEventLoading }] = useSaveEventMutation({
    onError: setServerError,
  })

  const [deleteEvent, { loading: deleteEventLoading }] = useRemoveEventMutation(
    {
      onError: setServerError,
    },
  )

  const { auth } = useContext(AuthContext)

  useEffect(() => {
    calendarReady && refetch()
    setDisableEdit(!auth)
    setActionBtns({
      ...actionBtns,
      disableSaveBtn: true,
      disableDeleteBtn: !auth,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, refetch])

  const onCompleteApiRequest = () => {
    setActionBtns({
      ...actionBtns,
      disableSaveBtn: false,
      disableDeleteBtn: false,
    })
    setModal({ ...modal, show: false })
  }

  const handleSaveEvent = async () => {
    setActionBtns({
      ...actionBtns,
      disableSaveBtn: true,
      disableDeleteBtn: true,
    })

    calendarApiRef.current?.value?.unselect()

    setServerError(null)

    const id = clickInfoRef.current?.value?.event?.id ?? ''

    const res = await saveEvent({
      variables: {
        event: {
          id,
          title,
          start,
          end,
          isPrivate,
          description,
          venue,
          hosted_by,
          contact_number,
          number_of_attendees: Number(number_of_attendees),
          speaker,
        },
      },
    })

    if (res.data) {
      if (clickInfoRef.current?.value) {
        clickInfoRef.current.value.event.setProp('title', title)
        clickInfoRef.current.value.event.setExtendedProp('isPrivate', isPrivate)
        clickInfoRef.current.value.event.setExtendedProp(
          'description',
          description,
        )
        clickInfoRef.current.value.event.setStart(start)
        clickInfoRef.current.value.event.setEnd(end)
      } else {
        await client.resetStore()
      }

      if (!serverError) {
        toast.success('Event was successfully saved!')
      }
    }

    onCompleteApiRequest()
  }

  const handleDateClick = async (selectedDate: DateClickArg) => {
    if (clickInfoRef.current) clickInfoRef.current.value = null
    if (calendarApiRef.current)
      calendarApiRef.current.value = selectedDate.view.calendar

    setDisableEdit(!auth)
    setActionBtns({
      disableSaveBtn: true,
      disableDeleteBtn: !auth,
      displayDeleteBtn: false,
      hideSaveBtn: !auth,
    })
    setEvent({
      title: '',
      start: `${selectedDate.dateStr}T00:00:00`,
      end: `${selectedDate.dateStr}T01:00:00`,
      isPrivate: false,
      description: '',
      createdById: '',
      venue: '',
      hosted_by: '',
      contact_number: '',
      number_of_attendees: 0,
      speaker: '',
    })
    setModal({
      title: 'New Event',
      show: true,
    })
  }

  const handleEventClick = (clickInfo: EventClickArg) => {
    clickInfo.jsEvent.preventDefault()
    if (clickInfoRef.current) clickInfoRef.current.value = clickInfo
    const isTheOwner =
      (auth && auth.userId === clickInfo.event.extendedProps.createdBy._id) ??
      false

    if (auth) {
      setDisableEdit(!isTheOwner)
      setActionBtns({
        disableSaveBtn: !isTheOwner,
        disableDeleteBtn: !isTheOwner,
        displayDeleteBtn: isTheOwner,
        hideSaveBtn: !isTheOwner,
      })
    } else {
      setDisableEdit(true)
      setActionBtns({
        disableSaveBtn: true,
        disableDeleteBtn: true,
        displayDeleteBtn: false,
        hideSaveBtn: true,
      })
    }

    const start = clickInfo.event.startStr.substring(
      0,
      clickInfo.event.startStr.lastIndexOf('-'),
    )
    const end = clickInfo.event.endStr.substring(
      0,
      clickInfo.event.endStr.lastIndexOf('-'),
    )

    const { title } = clickInfo.event
    const {
      isPrivate,
      description,
      createdBy,
      venue,
      hosted_by,
      contact_number,
      number_of_attendees,
      speaker,
    } = clickInfo.event.extendedProps

    setEvent({
      id: clickInfo.event.id,
      title,
      start,
      end,
      isPrivate,
      description,
      createdById: createdBy._id,
      venue,
      hosted_by,
      contact_number,
      number_of_attendees,
      speaker,
      attendees: [],
    })
    setModal({
      title: isTheOwner ? 'Edit Event' : 'Event (read only)',
      show: true,
    })

    if (clickInfo.event.id) {
      fetch(`/api/attendees/${clickInfo.event.id}`)
        .then(response => response.json())
        .then(data => {
          if (data.success && data.attendees) {
            setEvent(prevEvent => ({
              ...prevEvent,
              attendees: data.attendees
            }));
          }
        })
        .catch(error => {
          console.error('Error fetching attendees:', error);
        });
    }
  }

  const handleDeleteEvent = async () => {
    setActionBtns({
      ...actionBtns,
      disableSaveBtn: true,
      disableDeleteBtn: true,
    })

    setServerError(null)

    const id = clickInfoRef.current?.value?.event?.id

    if (!id) {
      throw new Error('Event ID is missing!')
    }

    const res = await deleteEvent({
      variables: { id },
      update(cache) {
        removeEvent(cache, id)
      },
    })

    if (res.data) {
      clickInfoRef.current.value?.event.remove()
      clickInfoRef.current.value = null

      if (!serverError) {
        toast.success('Event was successfully deleted!')
      }
    }

    onCompleteApiRequest()
  }

  const onChangeValueHandler = (prop: string, value: string | boolean) => {
    setEvent({ ...event, [prop]: value })
  }

  const handleShowLoginModal = (flag: boolean) => {
    setShowLoginModal(flag)
    setModal({ ...modal, show: false })
  }

  return (
    <Fragment>
      {showLoginModal && (
        <LoginContainer
          view={'Login'}
          onClose={() => handleShowLoginModal(false)}
        />
      )}
      <ServerErrorAlert
        error={serverError}
        onClose={() => setServerError(null)}
      />

      <Modal
        title={modal.title}
        show={modal.show}
        size="xl"
        actionBtnFlags={{
          hideSubmitBtn: hideSaveBtn,
          disableSubmitBtn: disableSaveBtn,
          disableDeleteBtn,
          displayDeleteBtn,
        }}
        actionBtnLoading={{
          isSubmitLoading: saveEventLoading,
          isDeleteLoading: deleteEventLoading,
        }}
        onClose={() => setModal({ ...modal, show: false })}
        onDelete={handleDeleteEvent}
        onSubmit={handleSaveEvent}
      >
        <ModalBody
          auth={auth}
          event={event}
          disableEdit={disableEdit}
          onChangeValue={(prop, value) => onChangeValueHandler(prop, value)}
          onValidate={(valid) =>
            setActionBtns({ ...actionBtns, disableSaveBtn: !valid })
          }
          onLogin={() => handleShowLoginModal(true)}
        />
      </Modal>

      <FullCalendarWrapper>
        {getEventsLoading || networkStatus === NetworkStatus.refetch ? (
          <Spinner />
        ) : null}

        <FullCalendar
          initialView='dayGridMonth'
          lazyFetching={true}
          events={events?.eventsData?.events as EventType[]}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          datesSet={(dateRange) => {
            setCalendarReady(true)
            getEvents({
              variables: {
                filter: {
                  startDate: DateTime.fromISO(dateRange.startStr)
                    .minus({ months: 1 })
                    .toISO(),
                  endDate: DateTime.fromISO(dateRange.endStr)
                    .plus({ months: 1 })
                    .toISO(),
                },
              },
            })
          }}
        />
      </FullCalendarWrapper>
    </Fragment>
  )
}

const ModalBody = ({
  auth,
  event,
  disableEdit,
  onChangeValue,
  onValidate,
  onLogin,
}: ModalBodyType) => {
  const [showRegistration, setShowRegistration] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  // Calculate available spots if we have the necessary data
  const attendeeCount = event.attendees?.length || 0;
  const maxAttendees = event.number_of_attendees || 0;
  const availableSpots = Math.max(0, maxAttendees - attendeeCount);
  
  // Determine if user is the event owner
  const isEventOwner = auth && auth.userId === event.createdById && event.id;
  
  // Only allow registration for events that aren't being created/edited and have spots
  const canRegister = event.id && disableEdit && availableSpots > 0 && !isEventOwner;
  
  // Hide the event details when showing the registration form
  if (showRegistration && event.id) {
    return (
      <EventRegistration 
        eventId={event.id}
        availableSpots={availableSpots}
        onSuccess={() => setShowRegistration(false)}
      />
    );
  }
  
  return (
    <div className="pb-3">
      {!auth && (
        <Alert
          msg='You must login to be able to add or edit events.'
          type='warning'
          dismissible={false}
          btn={
            <Button variant='primary' size='sm' type='button' onClick={onLogin}>
              Login
            </Button>
          }
        />
      )}
      
      {canRegister && !showRegistration && (
        <Row className="mb-4">
          <Col className="d-flex justify-content-center">
            <Alert
              type="info"
              dismissible={false}
              msg={`This event has ${availableSpots} ${availableSpots === 1 ? 'spot' : 'spots'} available.`}
              btn={
                <Button 
                  variant="success" 
                  size="lg"
                  onClick={() => setShowRegistration(true)}
                >
                  Register for this Event
                </Button>
              }
            />
          </Col>
        </Row>
      )}
      
      {(attendeeCount >= maxAttendees && maxAttendees > 0) && !isEventOwner && (
        <Alert
          type="warning"
          dismissible={false}
          msg="This event is at full capacity. Registration is closed."
        />
      )}
      
      {/* Show tabs for event details and statistics for event owners */}
      {isEventOwner && event.id ? (
        <Tab.Container defaultActiveKey="details">
          <Nav variant="tabs" className="mb-3">
            <Nav.Item>
              <Nav.Link eventKey="details">Event Details</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="stats">Event Statistics</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="rating">Event Rating</Nav.Link>
            </Nav.Item>
          </Nav>
          <Tab.Content>
            <Tab.Pane eventKey="details">
              <EventBody
                event={event}
                disableEdit={disableEdit}
                onChangeValue={onChangeValue}
                onValidate={onValidate}
              />
              <EventAttendees eventId={event.id} />
            </Tab.Pane>
            <Tab.Pane eventKey="stats">
              <EventStatsPanel 
                eventId={event.id}
                totalSeats={event.number_of_attendees}
                attendees={event.attendees || []}
                title={event.title}
              />
            </Tab.Pane>
            <Tab.Pane eventKey="rating">
              <EventRating eventId={event.id} title={event.title} />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      ) : (
        <>
          {/* For regular users */}
          {event.id ? (
            <Tab.Container defaultActiveKey="details">
              <Nav variant="tabs" className="mb-3">
                <Nav.Item>
                  <Nav.Link eventKey="details">Event Details</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="rating">Event Rating</Nav.Link>
                </Nav.Item>
              </Nav>
              <Tab.Content>
                <Tab.Pane eventKey="details">
                  <EventBody
                    event={event}
                    disableEdit={disableEdit}
                    onChangeValue={onChangeValue}
                    onValidate={onValidate}
                  />
                </Tab.Pane>
                <Tab.Pane eventKey="rating">
                  <EventRating eventId={event.id} title={event.title} />
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          ) : (
            <EventBody
              event={event}
              disableEdit={disableEdit}
              onChangeValue={onChangeValue}
              onValidate={onValidate}
            />
          )}
        </>
      )}
    </div>
  );
}

export const FullCalendarWrapper = styled.div`
  a.fc-event,
  a.fc-event:hover {
    cursor: pointer;
  }

  .fc-prev-button,
  .fc-next-button,
  .fc-today-button {
    background-color: white !important;
  }

  .fc-icon-chevron-left,
  .fc-icon-chevron-right,
  .fc-today-button {
    color: black !important;
  }

  .fc .fc-toolbar-title {
    font-size: 20px !important;
  }
`

export default Calendar
