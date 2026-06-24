using { managed } from '@sap/cds/common';
namespace cap.userinfo;

@UI.FieldGroup #contactDetails: {Data: [
    {
        $Type: 'UI.DataField',
        Value: GivenName,
    },
    {
        $Type: 'UI.DataField',
        Value: FamilyName,
    },
    {
        $Type: 'UI.DataField',
        Value: Email,
    }
]}
@UI.QuickViewFacets         : [{
    $Type : 'UI.ReferenceFacet',
    Target: '@UI.FieldGroup#contactDetails',
    Label : 'Contact Details',
}]
@UI.HeaderInfo              : {
    ImageUrl    : '',
    TypeImageUrl: 'sap-icon://customer',
    Title       : {
        Label: 'Name',
        Value: FullName,
    },
    TypeName    : '',
}
@cds.autoexpose
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

aspect UserTracked : managed {
    _toCreatedUserInfo  : Association to one UserInfo
                            on _toCreatedUserInfo.ID = $self.createdBy;
    _toModifiedUserInfo : Association to one UserInfo
                            on _toModifiedUserInfo.ID = $self.modifiedBy;
}
