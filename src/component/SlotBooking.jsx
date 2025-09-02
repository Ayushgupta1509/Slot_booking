import React, { useState, useEffect } from 'react';
import './SlotBooking.css';
const SlotBooking = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    console.log("Initializing from localStorage...");
    try {
      const storedBookings = localStorage.getItem('timeSlotBookings');
      console.log("Stored bookings:", storedBookings);
      
      if (storedBookings) {
        const parsedBookings = JSON.parse(storedBookings);
        console.log("Parsed bookings:", parsedBookings);
        setBookings(parsedBookings);
      } else {
        console.log("No existing bookings found");
        setBookings({});
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      setBookings({});
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      console.log("Saving to localStorage:", bookings);
      try {
        localStorage.setItem('timeSlotBookings', JSON.stringify(bookings));
        console.log("Successfully saved to localStorage");
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    }
  }, [bookings, isInitialized]);

  const resetAllBookings = () => {
    if (window.confirm("Are you sure you want to reset all bookings? This action cannot be undone.")) {
      localStorage.removeItem('timeSlotBookings');
      setBookings({});
      setSelectedDate(null);
      setSelectedTime(null);
      setShowConfirmation(false);
      alert("All bookings have been reset!");
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 10; hour <= 17; hour++) {
      slots.push(`${hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`);
      if (hour !== 17) {
        slots.push(`${hour}:30 ${hour >= 12 ? 'PM' : 'AM'}`);
      }
    }
    console.log("slots:",slots)
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const generateDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    const daysInMonth = lastDay.getDate();
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    console.log("days:",days)
    return days;
  };

  const days = generateDays();

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setShowConfirmation(false);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setShowConfirmation(false);
  };

  const changeMonth = (direction) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const formatDate = (date) => {
    return date ? date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : '';
  };

  const formatDateKey = (date) => {
    if (!date) return '';
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    return utcDate.toISOString().split('T')[0];
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isPastDate = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getBookingsForSelectedDate = () => {
    if (!selectedDate) return {};
    const dateKey = formatDateKey(selectedDate);
    return bookings[dateKey] || {};
  };

  const getBookingCountForTimeSlot = (time) => {
    const dateBookings = getBookingsForSelectedDate();
    return dateBookings[time] || 0;
  };

  const isTimeSlotFull = (time) => {
    return getBookingCountForTimeSlot(time) >= 5;
  };

  const handleBookingConfirmation = () => {
    if (!selectedDate || !selectedTime) return;
    
    const dateKey = formatDateKey(selectedDate);
    const currentCount = getBookingCountForTimeSlot(selectedTime);
    
    if (currentCount >= 5) {
      alert('This time slot is already fully booked!');
      return;
    }
    
    setBookings(prevBookings => {
      const updatedBookings = { ...prevBookings };
      if (!updatedBookings[dateKey]) {
        updatedBookings[dateKey] = {};
      }
      
      updatedBookings[dateKey][selectedTime] = currentCount + 1;
      return updatedBookings;
    });
    
    setShowConfirmation(true);
  };


  return (
    <div className="slot-booking-container">
      <div className="header-section">
        <h2>Select Date & Time</h2>
        <div>
          <button className="reset-button" onClick={resetAllBookings}>
            Reset All Bookings
          </button>
        </div>
      </div>
      
      <div className="slot-booking-nav">
        <button onClick={() => changeMonth(-1)}>&lt; Previous</button>
        <h3>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
        <button onClick={() => changeMonth(1)}>Next &gt;</button>
      </div>

      <div className="slot-booking-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="day-header">{day}</div>
        ))}
        
        {days.map((day, index) => (
          <div
            key={index}
            className={`calendar-day ${
              day ? (
                selectedDate && day.getDate() === selectedDate.getDate() && 
                day.getMonth() === selectedDate.getMonth() ? 'selected' :
                isToday(day) ? 'today' :
                isPastDate(day) ? 'past' : 'available'
              ) : 'empty'
            }`}
            onClick={() => day && !isPastDate(day) && handleDateSelect(day)}
          >
            {day ? day.getDate() : ''}
          </div>
        ))}
      </div>

      {selectedDate && (
        <div className="selected-date">
          <h3>Selected Date: {formatDate(selectedDate)}</h3>
        </div>
      )}
      
      {selectedDate && !isPastDate(selectedDate) && (
        <div className="time-slots">
          <h3>Select Time Slot:</h3>
          <div className="time-grid">
            {timeSlots.map((time, index) => {
              const isFull = isTimeSlotFull(time);
              return (
                <button
                  key={index}
                  className={`time-slot ${selectedTime === time ? 'selected' : ''} ${isFull ? 'full' : 'available'}`}
                  onClick={() => !isFull && handleTimeSelect(time)}
                  disabled={isFull}
                >
                  {time} {isFull ? '(Fully Booked)' : `(${getBookingCountForTimeSlot(time)}/5)`}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {selectedDate && selectedTime && !showConfirmation && (
        <div className="booking-actions">
          <button className="confirm-button" onClick={handleBookingConfirmation}>
            Confirm Booking
          </button>
        </div>
      )}
      
      {showConfirmation && (
        <div className="confirmation-message">
          <h3>Booking Confirmed!</h3>
          <p>Your appointment on {formatDate(selectedDate)} at {selectedTime} has been booked.</p>
          <p>Current bookings for this slot: {getBookingCountForTimeSlot(selectedTime)}/5</p>
        </div>
      )}
    </div>
  );
};

export default SlotBooking;