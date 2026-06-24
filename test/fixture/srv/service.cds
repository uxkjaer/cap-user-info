using { fixture } from '../db/schema';
service TestService {
  entity Things  as projection on fixture.Thing;
  entity Parents as projection on fixture.Parent;
  entity Children as projection on fixture.Child;
}
