import express from 'express';
import { AttendeeModel } from '../models/attendee';
import { EventModel } from '../models/event';

const router = express.Router();

// GET attendees for an event
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

    // Get all attendees for this event
    const attendees = await AttendeeModel.find({ 
      event: eventId,
      status: { $ne: 'cancelled' } // Only get non-cancelled registrations
    });
    
    return res.status(200).json({
      success: true,
      attendees
    });
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching attendees'
    });
  }
});

export default router; 