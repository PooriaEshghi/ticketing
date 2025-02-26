import { Publisher, Subjects, TicketCreatedEvent } from '@petickets/common';

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
}
