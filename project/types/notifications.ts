// src/types/notifications.ts
export type NotificationType = 'appointment' | 'cancellation' | 'reminder' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  appointmentId?: string;
  clientName?: string;
  serviceType?: string;
  scheduledDate?: Date;
  read: boolean;
  createdAt: Date;
}