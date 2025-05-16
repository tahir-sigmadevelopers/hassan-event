import React, { FC, useEffect, useState, useContext } from 'react';
import { Card, Form, Button, Row, Col, Spinner, Badge, Alert } from 'react-bootstrap';
import { FaStar, FaRegStar } from 'react-icons/fa';
import toast from 'react-hot-toast';
import AuthContext from '../../store/auth-context';
import './EventRating.css';

interface Rating {
  _id: string;
  eventId: string;
  userId: string;
  username: string;
  rating: number;
  review: string;
  createdAt: string;
  updatedAt: string;
}

interface EventRatingProps {
  eventId: string;
  title: string;
}

const EventRating: FC<EventRatingProps> = ({ eventId, title }) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [userRating, setUserRating] = useState<number>(0);
  const [review, setReview] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userHasRated, setUserHasRated] = useState<boolean>(false);
  const [userRatingId, setUserRatingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const { auth } = useContext(AuthContext);

  // Fetch all ratings for this event
  useEffect(() => {
    if (eventId) {
      fetchRatings();
    }
  }, [eventId]);

  // Check if the current user has already rated this event
  useEffect(() => {
    if (eventId && auth?.userId) {
      checkUserRating();
    }
  }, [eventId, auth]);

  const fetchRatings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ratings/${eventId}`);
      const data = await response.json();
      
      if (data.success) {
        setRatings(data.ratings);
        setAverageRating(data.averageRating);
      } else {
        setError('Failed to fetch ratings');
      }
    } catch (err) {
      setError('An error occurred while fetching ratings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkUserRating = async () => {
    try {
      const response = await fetch(`/api/ratings/check/${eventId}/${auth?.userId}`);
      const data = await response.json();
      
      if (data.success && data.hasRated) {
        setUserHasRated(true);
        setUserRating(data.rating.rating);
        setReview(data.rating.review);
        setUserRatingId(data.rating._id);
      }
    } catch (err) {
      console.error('Error checking if user has rated:', err);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth) {
      toast.error('You must be logged in to rate events');
      return;
    }
    
    if (userRating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    if (!review.trim()) {
      toast.error('Please provide a review');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      let response;
      
      if (isEditing && userRatingId) {
        // Update existing rating
        response = await fetch(`/api/ratings/${userRatingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          },
          body: JSON.stringify({
            rating: userRating,
            review,
            userId: auth.userId
          })
        });
      } else {
        // Submit new rating
        response = await fetch('/api/ratings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          },
          body: JSON.stringify({
            eventId,
            rating: userRating,
            review,
            userId: auth.userId,
            username: auth.username
          })
        });
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(isEditing ? 'Your rating has been updated!' : 'Your rating has been submitted!');
        setUserHasRated(true);
        setIsEditing(false);
        
        // Refresh ratings
        fetchRatings();
        
        if (!isEditing) {
          setUserRatingId(data.rating._id);
        }
      } else {
        toast.error(data.message || 'Failed to submit rating');
      }
    } catch (err) {
      toast.error('An error occurred while submitting your rating');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!auth || !userRatingId) return;
    
    if (!window.confirm('Are you sure you want to delete your rating?')) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/ratings/${userRatingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          userId: auth.userId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Your rating has been deleted');
        setUserHasRated(false);
        setUserRating(0);
        setReview('');
        setUserRatingId(null);
        
        // Refresh ratings
        fetchRatings();
      } else {
        toast.error(data.message || 'Failed to delete rating');
      }
    } catch (err) {
      toast.error('An error occurred while deleting your rating');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, size = 20) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rating ? (
          <FaStar key={i} className="text-warning" size={size} />
        ) : (
          <FaRegStar key={i} className="text-warning" size={size} />
        )
      );
    }
    return stars;
  };

  const renderRatingForm = () => (
    <Card className="mb-4">
      <Card.Header>
        <h5>{isEditing ? 'Edit Your Rating' : 'Rate This Event'}</h5>
      </Card.Header>
      <Card.Body>
        {!auth ? (
          <Alert variant="info">Please log in to rate this event</Alert>
        ) : (
          <Form onSubmit={handleSubmitRating}>
            <Form.Group className="mb-3">
              <Form.Label>Your Rating</Form.Label>
              <div className="star-rating mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setUserRating(star)}
                    className="star-rating-btn"
                  >
                    {star <= userRating ? (
                      <FaStar className="text-warning" size={30} />
                    ) : (
                      <FaRegStar className="text-warning" size={30} />
                    )}
                  </span>
                ))}
              </div>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Your Review</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                required
              />
            </Form.Group>
            
            <div className="d-flex gap-2">
              <Button 
                variant="primary" 
                type="submit" 
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Submitting...
                  </>
                ) : isEditing ? 'Update Rating' : 'Submit Rating'}
              </Button>
              
              {isEditing && (
                <>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => {
                      setIsEditing(false);
                      checkUserRating(); // Reset form to original values
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  
                  <Button 
                    variant="outline-danger" 
                    onClick={handleDeleteRating}
                    disabled={submitting}
                    className="ms-auto"
                  >
                    Delete Rating
                  </Button>
                </>
              )}
            </div>
          </Form>
        )}
      </Card.Body>
    </Card>
  );

  const renderRatings = () => (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5>Reviews & Ratings</h5>
        <div className="d-flex align-items-center">
          <span className="me-2 fw-bold">{averageRating}</span>
          {renderStars(averageRating, 24)}
          <Badge bg="secondary" className="ms-2">
            {ratings.length} {ratings.length === 1 ? 'review' : 'reviews'}
          </Badge>
        </div>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center p-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : ratings.length === 0 ? (
          <p className="text-center">No reviews yet. Be the first to review this event!</p>
        ) : (
          <div className="reviews-list">
            {ratings.map((rating) => (
              <div key={rating._id} className="review-item mb-4">
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="mb-0">{rating.username}</h6>
                    <div className="mb-2 small text-muted">
                      {new Date(rating.createdAt).toLocaleDateString()} 
                      {rating.createdAt !== rating.updatedAt && ' (edited)'}
                    </div>
                  </div>
                  <div className="d-flex align-items-center">
                    {renderStars(rating.rating, 18)}
                    
                    {auth?.userId === rating.userId && !isEditing && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 ms-2" 
                        onClick={() => setIsEditing(true)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mb-0">{rating.review}</p>
                <hr className="my-3" />
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );

  return (
    <div className="event-rating-section">
      <h4 className="mb-4">Feedback for "{title}"</h4>
      <Row className="g-4">
        <Col lg={4} md={12}>
          {!userHasRated || isEditing ? renderRatingForm() : (
            <Card className="mb-4">
              <Card.Header>
                <h5>Your Rating</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  {renderStars(userRating, 24)}
                </div>
                <p>{review}</p>
                <Button 
                  variant="outline-primary" 
                  onClick={() => setIsEditing(true)}
                >
                  Edit Rating
                </Button>
              </Card.Body>
            </Card>
          )}
        </Col>
        <Col lg={8} md={12}>
          {renderRatings()}
        </Col>
      </Row>
    </div>
  );
};

export default EventRating; 