import React, { useState } from 'react';
import { 
  format, 
  startOfWeek, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  parseISO 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { Reservation, ReservationStatus } from '../types';

interface CalendarProps {
  reservations: Reservation[];
  onSelectEvent: (res: Reservation) => void;
  onSelectSlot: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ reservations, onSelectEvent, onSelectSlot }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  const getStatusColor = (status: ReservationStatus) => {
    switch(status) {
      case ReservationStatus.APPROVED: return 'bg-green-500';
      case ReservationStatus.PENDING: return 'bg-yellow-500';
      case ReservationStatus.REJECTED: // Fallthrough
      case ReservationStatus.CANCELLED: return 'bg-red-500';
      case ReservationStatus.COMPLETED: return 'bg-gray-500';
      default: return 'bg-eccos-blue';
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4 p-2 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex items-center space-x-2">
          <button onClick={() => setCurrentDate(addDays(currentDate, view === 'month' ? -30 : -7))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <ChevronLeft className="w-5 h-5 dark:text-white" />
          </button>
          <span className="text-lg font-bold capitalize dark:text-white">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button onClick={() => setCurrentDate(addDays(currentDate, view === 'month' ? 30 : 7))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <ChevronRight className="w-5 h-5 dark:text-white" />
          </button>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setView('month')}
            className={`px-3 py-1 rounded ${view === 'month' ? 'bg-eccos-blue text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-white'}`}
          >
            Mês
          </button>
          <button 
            onClick={() => setView('week')}
            className={`px-3 py-1 rounded ${view === 'week' ? 'bg-eccos-blue text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-white'}`}
          >
            Semana
          </button>
        </div>
      </div>
    );
  };

  const renderMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        
        const dayReservations = reservations.filter(r => isSameDay(parseISO(r.startTime), cloneDay));

        days.push(
          <div
            className={`min-h-[100px] border dark:border-gray-700 p-1 relative cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition
              ${!isSameMonth(day, monthStart) ? "text-gray-400 bg-gray-50 dark:bg-gray-900" : "bg-white dark:bg-gray-800 dark:text-white"}`}
            key={day.toString()}
            onClick={(e) => {
              // Prevent firing when clicking an event
              if(e.target === e.currentTarget) onSelectSlot(cloneDay);
            }}
          >
            <div className="font-semibold text-right text-sm mb-1">{formattedDate}</div>
            <div className="space-y-1">
              {dayReservations.slice(0, 3).map(res => (
                <div 
                  key={res.id}
                  onClick={(e) => { e.stopPropagation(); onSelectEvent(res); }}
                  className={`${getStatusColor(res.status)} text-white text-xs p-1 rounded truncate cursor-pointer shadow-sm`}
                >
                  {format(parseISO(res.startTime), 'HH:mm')} - {res.userName}
                </div>
              ))}
              {dayReservations.length > 3 && (
                <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                  + {dayReservations.length - 3} mais
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border dark:border-gray-700 rounded-lg overflow-hidden">{rows}</div>;
  };

  const renderWeek = () => {
    const startDate = startOfWeek(currentDate);
    const days = [];
    for(let i=0; i<7; i++) {
      days.push(addDays(startDate, i));
    }

    return (
      <div className="flex flex-col h-[600px] overflow-y-auto bg-white dark:bg-gray-800 rounded border dark:border-gray-700">
        <div className="grid grid-cols-8 sticky top-0 bg-white dark:bg-gray-800 z-10 border-b dark:border-gray-700">
          <div className="p-2"></div> {/* Time col */}
          {days.map(d => (
            <div key={d.toString()} className="p-2 text-center border-l dark:border-gray-700 font-bold dark:text-white">
              {format(d, 'EEE d', { locale: ptBR })}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-8 flex-grow">
          {/* Time column */}
          <div className="flex flex-col">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="h-12 border-b dark:border-gray-700 text-xs text-gray-500 text-right pr-2 pt-1">
                {i + 7}:00
              </div>
            ))}
          </div>
          {/* Days columns */}
          {days.map(day => {
            const dayRes = reservations.filter(r => isSameDay(parseISO(r.startTime), day));
            return (
              <div 
                key={day.toString()} 
                className="relative border-l border-b dark:border-gray-700 min-h-full hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => onSelectSlot(day)}
              >
                {dayRes.map(res => {
                  const start = parseISO(res.startTime);
                  const end = parseISO(res.endTime);
                  const startHour = start.getHours();
                  const duration = end.getHours() - startHour;
                  // Simple positioning: (Hour - 7) * 48px (height of slot)
                  const top = (startHour - 7) * 48; 
                  const height = duration * 48;
                  
                  return (
                    <div
                      key={res.id}
                      onClick={(e) => { e.stopPropagation(); onSelectEvent(res); }}
                      className={`absolute left-1 right-1 rounded p-1 text-xs text-white overflow-hidden z-10 ${getStatusColor(res.status)}`}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      {format(start, 'HH:mm')} {res.userName}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {renderHeader()}
      <div className="grid grid-cols-7 mb-2 text-center text-gray-500 dark:text-gray-400 font-medium">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d}>{d}</div>)}
      </div>
      {view === 'month' ? renderMonth() : renderWeek()}
    </div>
  );
};
