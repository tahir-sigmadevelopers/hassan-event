import React, { FC, useState } from 'react';
import { Card, Row, Col, Badge, Container, Nav, Tab } from 'react-bootstrap';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface Attendee {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  createdAt?: number;
}

interface EventStatsProps {
  eventId: string;
  totalSeats: number;
  attendees: Attendee[];
  title: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const EventStatsPanel: FC<EventStatsProps> = ({ 
  eventId, 
  totalSeats, 
  attendees,
  title
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  console.log('EventStatsPanel received props:', { 
    eventId, 
    totalSeats, 
    attendeesCount: attendees?.length || 0,
    isPublicView: attendees === undefined || attendees.length === 0,
    title,
    attendeesSample: attendees?.slice(0, 2)
  });
  
  // Calculate stats
  const registeredCount = attendees?.length || 0;
  const availableSeats = Math.max(0, totalSeats - registeredCount);
  const occupancyRate = totalSeats > 0 ? Math.round((registeredCount / totalSeats) * 100) : 0;
  
  // Data for pie chart
  const occupancyData = [
    { name: 'Registered', value: registeredCount },
    { name: 'Available', value: availableSeats }
  ];
  
  // Convert registration dates to days for trend analysis
  const registrationsByDate = attendees?.reduce((acc, attendee) => {
    if (attendee.createdAt) {
      const date = new Date(attendee.createdAt).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>) || {};
  
  const registrationTrend = Object.entries(registrationsByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Count attendees by status
  const attendeesByStatus = attendees?.reduce((acc, attendee) => {
    acc[attendee.status] = (acc[attendee.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  
  const statusData = Object.entries(attendeesByStatus)
    .map(([status, count]) => ({ status: status.charAt(0).toUpperCase() + status.slice(1), count }));

  // Check if this is a public view (no attendee details)
  const hasAttendeeData = attendees !== undefined && Array.isArray(attendees) && attendees.length > 0;
  const isPublicView = !hasAttendeeData;

  // Render Overview Tab Content
  const renderOverviewTab = () => (
    <>
      <Row className="text-center mb-4">
        <Col md={4} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h5 className="card-title">Total Seats</h5>
              <h2>{totalSeats}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h5 className="card-title">Registered</h5>
              <h2>{registeredCount > 0 || !isPublicView ? registeredCount : "—"}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h5 className="card-title">Occupancy</h5>
              <h2>
                {registeredCount > 0 || !isPublicView ? `${occupancyRate}%` : "—"}
                {(registeredCount > 0 || !isPublicView) && (
                  <Badge 
                    bg={occupancyRate > 90 ? 'danger' : occupancyRate > 70 ? 'warning' : 'success'} 
                    className="ms-2"
                  >
                    {occupancyRate > 90 ? 'Almost Full' : occupancyRate > 70 ? 'Filling Up' : 'Available'}
                  </Badge>
                )}
              </h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {!isPublicView || registeredCount > 0 ? (
        <Row>
          <Col lg={6} className="mb-4">
            <Card className="shadow-sm h-100">
              <Card.Header>Seat Allocation</Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={occupancyData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {occupancyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6} className="mb-4">
            <Card className="shadow-sm h-100">
              <Card.Header>Attendance Status</Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={statusData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="status" />
                        <YAxis />
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center mt-4">
                      <p>No attendee status data available</p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : (
        <div className="text-center py-4">
          {totalSeats > 0 ? (
            <p className="lead">Detailed statistics are only visible to event owners</p>
          ) : (
            <p className="lead">No attendees registered for this event yet</p>
          )}
        </div>
      )}
    </>
  );

  // Render Trends Tab Content
  const renderTrendsTab = () => (
    <Card className="shadow-sm">
      <Card.Header>Registration Timeline</Card.Header>
      <Card.Body>
        <div className="my-3" style={{ height: '400px' }}>
          {registrationTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={registrationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" name="Registrations" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center mt-4">
              <p>No registration trend data available</p>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );

  // Render Attendees Tab Content
  const renderAttendeesTab = () => (
    <Card className="shadow-sm">
      <Card.Header>
        Registered Attendees ({registeredCount} / {totalSeats})
      </Card.Header>
      <Card.Body>
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Registration Date</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map((attendee, index) => (
                <tr key={attendee.id}>
                  <td>{index + 1}</td>
                  <td>{attendee.name}</td>
                  <td>{attendee.email}</td>
                  <td>
                    <Badge bg={
                      attendee.status === 'registered' ? 'primary' : 
                      attendee.status === 'attended' ? 'success' : 
                      'secondary'
                    }>
                      {attendee.status}
                    </Badge>
                  </td>
                  <td>
                    {attendee.createdAt 
                      ? new Date(attendee.createdAt).toLocaleString() 
                      : 'N/A'}
                  </td>
                </tr>
              ))}
              {attendees.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center">No attendees registered yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <Container fluid className="px-0">
      <Card className="mt-4">
        <Card.Header>
          <h4>Event Statistics: {title}</h4>
        </Card.Header>
        <Card.Body>
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')}>
            <Nav variant="tabs" className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="overview">Overview</Nav.Link>
              </Nav.Item>
              {(hasAttendeeData || registeredCount > 0) && (
                <>
                  <Nav.Item>
                    <Nav.Link eventKey="trends">Registration Trends</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="details">Attendee Details</Nav.Link>
                  </Nav.Item>
                </>
              )}
            </Nav>
            <Tab.Content>
              <Tab.Pane eventKey="overview">
                {renderOverviewTab()}
              </Tab.Pane>
              {(hasAttendeeData || registeredCount > 0) && (
                <>
                  <Tab.Pane eventKey="trends">
                    {renderTrendsTab()}
                  </Tab.Pane>
                  <Tab.Pane eventKey="details">
                    {renderAttendeesTab()}
                  </Tab.Pane>
                </>
              )}
            </Tab.Content>
          </Tab.Container>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EventStatsPanel; 