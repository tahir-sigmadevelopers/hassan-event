import express from 'express';
import { RatingModel } from '../models/rating';
import { EventModel } from '../models/event';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// Get ratings for an event
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Check if the event exists
    const event = await EventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Get all ratings for this event
    const ratings = await RatingModel.find({ 
      eventId: eventId
    }).sort({ createdAt: -1 }); // Sort by most recent
    
    // Calculate average rating
    let averageRating = 0;
    if (ratings.length > 0) {
      const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
      averageRating = parseFloat((totalRating / ratings.length).toFixed(1));
    }
    
    return res.status(200).json({
      success: true,
      ratings,
      averageRating,
      count: ratings.length
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching ratings'
    });
  }
});

// Add a new rating
router.post('/', verifyToken, async (req, res) => {
  try {
    const { eventId, rating, review, userId, username } = req.body;
    
    if (!eventId || !rating || !review || !userId || !username) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check if rating is between 1 and 5
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    // Check if the event exists
    const event = await EventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if the user has already rated this event
    const existingRating = await RatingModel.findOne({ eventId, userId });
    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this event'
      });
    }
    
    // Create a new rating
    const newRating = new RatingModel({
      eventId,
      userId,
      rating,
      review,
      username
    });
    
    await newRating.save();
    
    return res.status(201).json({
      success: true,
      rating: newRating,
      message: 'Rating added successfully'
    });
  } catch (error) {
    console.error('Error adding rating:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while adding rating'
    });
  }
});

// Update a rating
router.put('/:ratingId', verifyToken, async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { rating, review, userId } = req.body;
    
    // Find the rating
    const existingRating = await RatingModel.findById(ratingId);
    if (!existingRating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }
    
    // Check if the user is the one who created the rating
    if (existingRating.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this rating'
      });
    }
    
    // Update the rating
    existingRating.rating = rating || existingRating.rating;
    existingRating.review = review || existingRating.review;
    await existingRating.save();
    
    return res.status(200).json({
      success: true,
      rating: existingRating,
      message: 'Rating updated successfully'
    });
  } catch (error) {
    console.error('Error updating rating:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating rating'
    });
  }
});

// Delete a rating
router.delete('/:ratingId', verifyToken, async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { userId } = req.body;
    
    // Find the rating
    const rating = await RatingModel.findById(ratingId);
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }
    
    // Check if the user is the one who created the rating
    if (rating.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this rating'
      });
    }
    
    // Delete the rating
    await RatingModel.findByIdAndDelete(ratingId);
    
    return res.status(200).json({
      success: true,
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting rating:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while deleting rating'
    });
  }
});

// Check if a user has rated an event
router.get('/check/:eventId/:userId', async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    
    const rating = await RatingModel.findOne({ eventId, userId });
    
    return res.status(200).json({
      success: true,
      hasRated: !!rating,
      rating: rating || null
    });
  } catch (error) {
    console.error('Error checking rating:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while checking rating'
    });
  }
});

export default router; 