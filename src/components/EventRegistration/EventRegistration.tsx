import React, { FC, useState } from 'react';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useRegisterForEventMutation } from '../../interfaces/graphql-types';

interface EventRegistrationProps {
  eventId: string;
  availableSpots: number | undefined | null;
  onSuccess?: () => void;
}

const EventRegistration: FC<EventRegistrationProps> = ({ 
  eventId, 
  availableSpots,
  onSuccess 
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [registerForEvent, { loading }] = useRegisterForEventMutation({
    onError: (error) => {
      setError(error.message);
      setSuccess(false);
    },
    onCompleted: () => {
      setSuccess(true);
      setError(null);
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setAdditionalInfo('');
      
      if (onSuccess) {
        onSuccess();
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Simple phone validation (at least 10 digits)
    const phoneRegex = /^\d{10,}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      setError('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    await registerForEvent({
      variables: {
        attendee: {
          name,
          email,
          phone,
          event: eventId,
          additionalInfo: additionalInfo || undefined
        }
      }
    });
  };

  // Use a variable to safely check for capacity
  const isAtCapacity = typeof availableSpots === 'number' && availableSpots <= 0;
  if (isAtCapacity) {
    return (
      <Alert variant="warning">
        This event is at full capacity. Registration is closed.
      </Alert>
    );
  }

  if (success) {
    return (
      <Alert variant="success">
        Thank you for registering! We've sent a confirmation to your email.
      </Alert>
    );
  }

  // Use another variable to safely check for displaying spots
  const hasAvailableSpots = typeof availableSpots === 'number' && availableSpots > 0;

  return (
    <div className="event-registration-form mt-4">
      <h3>Register for this Event</h3>
      {hasAvailableSpots && (
        <p className="text-muted">
          {availableSpots} {availableSpots === 1 ? 'spot' : 'spots'} available
        </p>
      )}
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Email <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
              />
            </Form.Group>
          </Col>
        </Row>
        
        <Form.Group className="mb-3">
          <Form.Label>Phone <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your phone number"
            required
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Additional Information</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="Any additional information you'd like to provide"
          />
        </Form.Group>
        
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register Now'}
        </Button>
      </Form>
    </div>
  );
};

export default EventRegistration; 