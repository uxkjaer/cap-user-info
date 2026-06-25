# cap-user-info

CDS plugin that adds user details on managed entities.

## Install

```bash
npm install cap-user-info
```

## Usage

The userinfo has the following properties by default that is added to the database
``` cds
entity UserInfo {
        @UI.Hidden
    key ID         : UUID;

        @assert.unique: true  @title: 'Email Address'
        @Communication: {IsEmailAddress: true}
        Email      : String;

        GivenName  : String @title: 'Given Name';
        FamilyName : String @title: 'Family Name';
        FullName   : String = concat(
            GivenName, ' ', FamilyName
        );
}
```

Import it into your cds file.
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

The fields for createdBy and modifiedBy will automatically be shown as links with a quickview with the user details.
![alt text](image-1.png)


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

## Using the plugin for other purposes

Add a field to your entity and a association

```cds

using { UserTracked, UserInfo } from 'cap-user-info';

entity MyEntity : cuid, UserTracked {
  // The cds.on.insert is only to insert the userid automatically, otherwise handle it via code.
  Responsible: User @cds.on.insert: $user.id;,
  _toResponsibleUser: association to one UserInfo on _toResponsibleUser.ID = $self.Responsible
}

```

Then the quickview will automatically be active
![alt text](image-2.png)

## Extending the quickview

You can extend the UserInfo to add more data into the quickview by adding to the fieldgroup in a cds file.

``` cds
  // Change the quickview
extend cap.userinfo.UserInfo with
  @UI.FieldGroup: {Data: [
    // Leave the original properties
    {
      $Type: 'UI.DataField',
      Value: GivenName
    },
    {
      $Type: 'UI.DataField',
      Value: FamilyName
    },
    {
      $Type: 'UI.DataField',
      Value: Email
    },
    // your new field
    {
      $Type: 'UI.DataField',
      Value: Department
    }, 
  ]}

  //Change the 
  @UI.HeaderInfo     : {
    ImageUrl    : '',
    TypeImageUrl: 'sap-icon://employee',
    Title       : {
        Value: FullName,
    },
    TypeName    : '',
}
  {
    // your new field iin the entity
    Department : String @title                        : 'Department';
  }
```

Then register your event handler to populate the data. It's important this piece of code isn't added within your srv.init method. It needs to be in the root context.
``` javascript
cds.on("served", () => {
  const { db } = cds.services;
  const { UserInfo } = cds.entities("cap.userinfo");

  //Register the handler for the Upsert
  db.before("UPSERT", UserInfo, async (req) => {
    //Change the data
    req.data.Department = "Admin";
  });
});
```
