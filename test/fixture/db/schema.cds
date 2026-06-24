using { cuid } from '@sap/cds/common';
using { cap.userinfo.UserTracked } from 'cap-user-info';
namespace fixture;

entity Thing : cuid, UserTracked {
  name : String;
}

entity Parent : cuid, UserTracked {
  name     : String;
  children : Composition of many Child on children.parent = $self;
}

entity Child : cuid, UserTracked {
  parent : Association to Parent;
  label  : String;
}
