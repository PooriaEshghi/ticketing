import {
  Subjects,
  Publisher,
  ExpirationCompleteEvent,
} from "@petickets/common";

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}
