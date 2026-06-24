# cap-user-info

CDS plugin that tracks created/modified user details on managed entities.

## Install

```bash
npm install cap-user-info
```

## Usage

```cds
using { UserTracked, UserInfo } from 'cap-user-info';

entity MyEntity : cuid, UserTracked {
  // your fields
}
```

The plugin auto-registers `.after("CREATE" | "UPDATE")` handlers on every
application-service entity that includes the `UserTracked` aspect. Each
handler UPSERTs the current user (`req.user`) into `UserInfo`. The
associations `_toCreatedUserInfo` / `_toModifiedUserInfo` resolve via
`createdBy` / `modifiedBy`.

## How it works

`UserTracked` extends `managed`, so consuming entities automatically
inherit `createdBy` / `modifiedBy` (and the corresponding timestamps):

It will add a quickview to the createdBy and modifiedBy to show the user details. The details are stored from the req.user upon changes to the entity.
![alt text](image.png)
```cds
aspect UserTracked : managed { ... }
```

This means no extra `managed` declaration is required on the consuming
entity — including `UserTracked` is enough.
