import { ApolloError, NetworkStatus } from '@apollo/client'
import { ChangeEvent, useContext, useEffect, useState, FC } from 'react'
import useDebounce from '../../../hooks/useDebounce'
import Spinner from '../../../components/UI/Spinner/Spinner'
import Card, { CardType } from '../../../components/UI/Card/Card'
import Alert from '../../../components/UI/Alert/Alert'
import Pagination from '../../../components/Pagination/Pagination'
import AuthContext from '../../../store/auth-context'
import Modal from '../../../components/UI/Modal/Modal'
import EventBody, { EventType } from '../../../components/EventBody/EventBody'
import { Form, Row, Col, Button, Tabs, Tab, Nav } from 'react-bootstrap'
import {
  EventFull,
  useDeleteEventMutation,
  useGetEventsQuery,
  useSaveEventMutation,
} from '../../../generated/graphql'
import styled from 'styled-components'
import { dateToTitle } from '../../../utils/dateTransforms'
import { ServerErrorAlert } from '../../../components/ServerErrorAlert/ServerErrorAlert'
import toast from 'react-hot-toast'
import { removeEvent } from '../../../utils/apolloCache'
import { DateTime } from 'luxon'
import EventRegistration from '../../../components/EventRegistration'
import EventAttendees from '../../../components/EventAttendees'
import EventStatsPanel from '../../../components/EventStatsPanel'
import EventRating from '../../../components/EventRating'
import { useNavigate } from 'react-router-dom'

const EVENTS_PER_PAGE = 15

function SearchEvents() {
  const [modal, setModal] = useState({
    title: '',
    show: false,
  })
  const [serverError, setServerError] = useState<ApolloError | null>(null)

  const [event, setEvent] = useState<EventType>({
    id: '',
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
    disableSaveBtn: false,
    disableDeleteBtn: false,
  })

  const [formProps, setFormProps] = useState({
    searchText: '',
    currentPage: 1,
    allCheck: true,
    currentCheck: false,
    expiredCheck: false,
  })

  const [skipFirstRun, setSkipFirstRun] = useState<boolean>(true)

  const { auth } = useContext(AuthContext)
  const { searchText, currentPage, allCheck, currentCheck, expiredCheck } =
    formProps
  const {
    id,
    title,
    start,
    end,
    isPrivate,
    description,
    createdById,
    venue,
    hosted_by,
    contact_number,
    number_of_attendees,
    speaker,
  } = event
  const { displayDeleteBtn, hideSaveBtn, disableSaveBtn, disableDeleteBtn } =
    actionBtns

  const debouncedSearchText = useDebounce(searchText)

  const filter = {
    searchText: debouncedSearchText.trim(),
    pageSize: EVENTS_PER_PAGE,
    pageNumber: currentPage,
    currentCheck,
    expiredCheck,
  }

  const { loading, data, refetch, networkStatus } = useGetEventsQuery({
    notifyOnNetworkStatusChange: true,
    variables: {
      filter,
    },
    onError: setServerError,
    fetchPolicy: 'cache-and-network',
  })

  const [saveEvent, { loading: saveEventLoading }] = useSaveEventMutation({
    onError: setServerError,
  })

  const [deleteEvent, { loading: deleteEventLoading }] = useDeleteEventMutation(
    {
      onError: setServerError,
    },
  )

  const handleOnSubmit = (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault()
    refetch()
  }

  const handleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormProps({ ...formProps, searchText: event.target.value })
  }

  const onCompleteApiRequest = () => {
    setActionBtns({
      ...actionBtns,
      disableDeleteBtn: false,
      disableSaveBtn: false,
    })
    setModal({ ...modal, show: false })
  }

  const getExSubTitle = (endTime: string) => {
    const today = DateTime.now()
    const endDate = DateTime.fromISO(endTime)

    return endDate < today ? 'Expired' : 'Active'
  }

  const clickEventHandler = (event: EventFull) => {
    const {
      id,
      title,
      start,
      end,
      isPrivate,
      description,
      createdBy,
      venue,
      hosted_by,
      contact_number,
      number_of_attendees,
      speaker,
    } = event
    const createdById = createdBy?._id ?? ''
    const isTheOwner = (auth && auth.userId === createdById) ?? false

    if (auth) {
      setActionBtns({
        ...actionBtns,
        displayDeleteBtn: isTheOwner,
        hideSaveBtn: !isTheOwner,
        disableSaveBtn: !isTheOwner,
      })
    } else {
      setActionBtns({
        ...actionBtns,
        displayDeleteBtn: false,
        hideSaveBtn: true,
      })
    }

    setEvent({
      id: id ?? '',
      title,
      start,
      end,
      description,
      isPrivate,
      createdById,
      venue,
      hosted_by,
      contact_number,
      number_of_attendees,
      speaker,
      attendees: [], // Initialize with empty array
    })
    
    setModal({
      title: isTheOwner ? 'Edit Event' : 'Event (read only)',
      show: true,
    })
    
    // If we have an event ID, fetch attendees
    if (id) {
      fetch(`/api/attendees/${id}`)
        .then(response => response.json())
        .then(data => {
          if (data.success && data.attendees) {
            // Update the event with attendees data
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
      disableDeleteBtn: true,
      disableSaveBtn: true,
    })

    if (!id) {
      throw new Error('Event ID is missing!')
    }

    const res = await deleteEvent({
      variables: { id },
      update(cache) {
        removeEvent(cache, id)
      },
    })

    if (res.data && !serverError) {
      toast.success('Event was successfully deleted!')
    }

    onCompleteApiRequest()
  }

  const handleSaveEvent = async () => {
    setActionBtns({
      ...actionBtns,
      disableDeleteBtn: true,
      disableSaveBtn: true,
    })

    if (!id) {
      throw new Error('Event ID is missing!')
    }

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

    if (res.data && !serverError) {
      toast.success('Event was successfully saved!')
    }

    onCompleteApiRequest()
  }

  const resetCurrentPage = () => setFormProps({ ...formProps, currentPage: 1 })

  useEffect(() => {
    resetCurrentPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchText])

  useEffect(() => {
    skipFirstRun && setSkipFirstRun(false)
    !skipFirstRun && refetch()
    resetCurrentPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, refetch])

  const handleFilterByAllEventsChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.persist()
    setFormProps({
      ...formProps,
      currentPage: 1,
      currentCheck: false,
      allCheck: !allCheck,
      expiredCheck: false,
    })
  }

  const handleFilterByCurrentEventsChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    e.persist()
    setFormProps({
      ...formProps,
      currentPage: 1,
      currentCheck: !currentCheck,
      allCheck: false,
      expiredCheck: false,
    })
  }

  const handleFilterByExpiredEventsChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    e.persist()
    setFormProps({
      ...formProps,
      currentPage: 1,
      currentCheck: false,
      allCheck: false,
      expiredCheck: !expiredCheck,
    })
  }

  const onChangeValueHandler = (prop: string, value: string | boolean) => {
    setEvent({ ...event, [prop]: value })
  }

  const isTheOwner = () => {
    return auth && auth.userId === event.createdById
  }

  const eventToCard = (event: EventFull): CardType => ({
    title: event.title,
    subtitle: dateToTitle(event),
    exSubTitle: getExSubTitle(event.end),
    content: event.description,
    url: event.url,
    createdBy: event?.createdBy?.username ?? '',
    createdAt: event.createdAt ?? 0,
    updatedAt: event.updatedAt ?? 0,
    isPrivate: event.isPrivate,
    venue: event.venue,
    hosted_by: event.hosted_by,
    contact_number: event.contact_number ?? '',
    number_of_attendees: event.number_of_attendees ?? 0,
    speaker: event.speaker,
  })

  return (
    <>
      <ServerErrorAlert
        error={serverError}
        onClose={() => setServerError(null)}
      />

      <Form>
        <div className='mb-4'>
          <span className='me-3 fs-5'>Filter by: </span>
          <Form.Check
            inline
            label='All'
            name='group'
            type='radio'
            defaultChecked={allCheck}
            onChange={handleFilterByAllEventsChange}
          />
          <Form.Check
            inline
            label='Active'
            name='group'
            type='radio'
            defaultChecked={currentCheck}
            onChange={handleFilterByCurrentEventsChange}
          />
          <Form.Check
            inline
            label='Expired'
            name='group'
            type='radio'
            defaultChecked={expiredCheck}
            onChange={handleFilterByExpiredEventsChange}
          />
        </div>
      </Form>

      <form
        className='d-flex'
        onSubmit={handleOnSubmit}
        data-testid='SearchBoxForm'
      >
        <input
          value={searchText}
          data-testid='SearchBoxInput'
          className='form-control'
          type='search'
          placeholder='Search events by title'
          aria-label='Search'
          onChange={handleOnChange}
        />
      </form>

      <EventCardContainer>
        {loading || networkStatus === NetworkStatus.refetch ? (
          <Spinner />
        ) : data?.eventsData?.events?.length ? (
          data.eventsData.events.map((event) => {
            return (
              <EventCardWrapper key={event.id}>
                <Card
                  card={eventToCard(event)}
                  onClick={() => clickEventHandler(event)}
                />
              </EventCardWrapper>
            )
          })
        ) : !serverError ? (
          <div className='event-card'>
            <Alert
              msg='No results were found.'
              type='warning'
              dismissible={false}
            />
          </div>
        ) : null}
      </EventCardContainer>

      {!loading && (
        <div className='float-end'>
          <Pagination
            total={data?.eventsData?.totalCount || 0}
            itemsPerPage={EVENTS_PER_PAGE}
            currentPage={currentPage}
            onPageChange={(page) =>
              setFormProps({ ...formProps, currentPage: page })
            }
          />
        </div>
      )}

      <Modal
        title={modal.title}
        show={modal.show}
        size="xl"
        actionBtnFlags={{
          disableSubmitBtn: disableSaveBtn,
          hideSubmitBtn: hideSaveBtn,
          displayDeleteBtn,
          disableDeleteBtn,
          closeBtnName: auth?.userId === createdById ? 'Cancel' : 'Close',
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
          disableEdit={!isTheOwner()}
          onChangeValue={(prop, value) => onChangeValueHandler(prop, value)}
          onValidate={(valid) =>
            setActionBtns({ ...actionBtns, disableSaveBtn: !valid })
          }
        />
      </Modal>
    </>
  )
}

export const EventCardContainer = styled.div({
  paddingTop: 10,
  paddingBottom: 20,
})

export const EventCardWrapper = styled.div({
  paddingTop: 20,
})

export default SearchEvents

// ModalBody component for SearchEvents
interface ModalBodyProps {
  auth: any;
  event: EventType;
  disableEdit: boolean;
  onChangeValue: (prop: string, value: string | boolean) => void;
  onValidate: (valid: boolean) => void;
}

const ModalBody = ({
  auth,
  event,
  disableEdit,
  onChangeValue,
  onValidate,
}: ModalBodyProps) => {
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
        eventTitle={event.title}
      />
    );
  }
  
  return (
    <div className="pb-3">
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
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || 'details')}
          className="mb-3"
        >
          <Tab eventKey="details" title="Event Details">
            <EventBody
              event={event}
              disableEdit={disableEdit}
              onChangeValue={onChangeValue}
              onValidate={onValidate}
            />
            <EventAttendees eventId={event.id} />
          </Tab>
          <Tab eventKey="stats" title="Event Statistics">
            <EventStatsPanel 
              eventId={event.id}
              totalSeats={event.number_of_attendees}
              attendees={event.attendees || []}
              title={event.title}
            />
          </Tab>
          <Tab eventKey="rating" title="Event Rating">
            <EventRating eventId={event.id} title={event.title} />
          </Tab>
        </Tabs>
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
