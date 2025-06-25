import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react-native';

interface CalendarDatePickerProps {
  visible: boolean;
  date: Date;
  onDateChange: (date: Date) => void;
  onClose: () => void;
}

export default function CalendarDatePicker({ 
  visible, 
  date, 
  onDateChange, 
  onClose 
}: CalendarDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(date));

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const today = new Date();
  const selectedDate = new Date(date);

  // Get first day of the month
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  // Get starting day (0 = Sunday, 1 = Monday, etc.)
  const startingDayOfWeek = firstDayOfMonth.getDay();
  
  // Get number of days in month
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Get previous month's last few days
  const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 0);
  const daysInPrevMonth = prevMonth.getDate();

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(currentMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const isToday = (day: number) => {
    return (
      currentMonth.getFullYear() === today.getFullYear() &&
      currentMonth.getMonth() === today.getMonth() &&
      day === today.getDate()
    );
  };

  const isSelected = (day: number) => {
    return (
      currentMonth.getFullYear() === selectedDate.getFullYear() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      day === selectedDate.getDate()
    );
  };

  const isFutureDate = (day: number) => {
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return checkDate > today;
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    // Don't allow future dates
    if (newDate > today) return;
    
    onDateChange(newDate);
    onClose();
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDay = daysInPrevMonth - startingDayOfWeek + i + 1;
      days.push(
        <TouchableOpacity
          key={`prev-${i}`}
          style={[styles.dayCell, styles.otherMonthDay]}
          disabled
        >
          <Text style={styles.otherMonthText}>{prevDay}</Text>
        </TouchableOpacity>
      );
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const isCurrentDay = isToday(day);
      const isSelectedDay = isSelected(day);
      const isFuture = isFutureDate(day);
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isCurrentDay && styles.todayCell,
            isSelectedDay && styles.selectedCell,
            isFuture && styles.futureDateCell,
          ]}
          onPress={() => handleDateSelect(day)}
          disabled={isFuture}
        >
          <Text style={[
            styles.dayText,
            isCurrentDay && styles.todayText,
            isSelectedDay && styles.selectedText,
            isFuture && styles.futureDateText,
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    // Add empty cells for remaining days to complete the grid
    const totalCells = Math.ceil((startingDayOfWeek + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (startingDayOfWeek + daysInMonth);
    
    for (let i = 1; i <= remainingCells; i++) {
      days.push(
        <TouchableOpacity
          key={`next-${i}`}
          style={[styles.dayCell, styles.otherMonthDay]}
          disabled
        >
          <Text style={styles.otherMonthText}>{i}</Text>
        </TouchableOpacity>
      );
    }
    
    return days;
  };

  const quickDateButtons = [
    { label: 'Today', date: new Date() },
    { label: 'Yesterday', date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { label: 'Last Week', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    { label: 'Last Month', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Calendar size={24} color="#722F37" />
              <Text style={styles.title}>Select Date</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#722F37" />
            </TouchableOpacity>
          </View>

          {/* Quick Date Selection */}
          <View style={styles.quickDatesContainer}>
            <Text style={styles.quickDatesTitle}>Quick Select</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.quickDatesRow}>
                {quickDateButtons.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickDateButton}
                    onPress={() => {
                      onDateChange(item.date);
                      onClose();
                    }}
                  >
                    <Text style={styles.quickDateText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
              <ChevronLeft size={24} color="#722F37" />
            </TouchableOpacity>
            
            <Text style={styles.monthYear}>
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            
            <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
              <ChevronRight size={24} color="#722F37" />
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdaysContainer}>
            {weekdays.map((weekday, index) => (
              <View key={index} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{weekday}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {renderCalendarDays()}
          </View>

          {/* Note about future dates */}
          <Text style={styles.noteText}>
            Future dates are disabled. Select when you tried this wine.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#722F37',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  quickDatesContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  quickDatesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#722F37',
    marginBottom: 12,
  },
  quickDatesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickDateButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  quickDateText: {
    fontSize: 14,
    color: '#722F37',
    fontWeight: '500',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navButton: {
    padding: 8,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#722F37',
  },
  weekdaysContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  weekdayCell: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B5A5F',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  dayCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  dayText: {
    fontSize: 16,
    color: '#333',
  },
  todayCell: {
    backgroundColor: '#D4AF37',
  },
  todayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  selectedCell: {
    backgroundColor: '#722F37',
  },
  selectedText: {
    color: 'white',
    fontWeight: 'bold',
  },
  futureDateCell: {
    backgroundColor: 'transparent',
  },
  futureDateText: {
    color: '#CCC',
  },
  otherMonthDay: {
    backgroundColor: 'transparent',
  },
  otherMonthText: {
    fontSize: 16,
    color: '#E0E0E0',
  },
  noteText: {
    fontSize: 12,
    color: '#8B5A5F',
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
});