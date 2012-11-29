Restful Node.hs server for Foobar project - More details coming soon

[![Build Status](https://secure.travis-ci.org/rajaraodv/foobarnode.png?branch=master)](https://travis-ci.org/rajaraodv/foobarnode)

# Foobarnode - RESTful Node.js server APIs



The server follows near ‘strict’ RESTful patterns and provides about 18 API end-points to support foobar project. The server also handles nearly 30 different error-checks. 

#### API Notes:
1. Send HTTP POST to create, HTTP GET to get, HTTP PUT to update, and HTTP DELETE to delete an item. 
2. Pass X-foobar-username and X-foobar-accesstoken for auth.
3. A user is uniquely identified by “username” and “access_token” together.

#### Other Notes: 
Server is running at: [http://foobarnode.cloudfoundry.com](http://foobarnode.cloudfoundry.com/)

# Users
### Create user: 
#### Request:
* HTTP POST: server/users/

* Headers: 
  * Content-Type: application/json (required)
  * X-foobar-username: <username>
  * X-foobar-access-token: <access token> (optional)

* Request Body

```
{
"username": "rajaraodv", //REQUIRED This is twtrUser.name or fbUser.username
"access_token":"a123", 
"account_type": "facebook", 
“first_name”: “raja”, 
“account_id”, “1234567” //REQUIRED: This is <twitterUser>.id or <facebookUser>.id
“photo_url”, “http://facebook.com/photo.jpg”
}

```

#### Response(s):
```

HTTP 200

{
"createdAt":"2012-09-30T17:06:54.983Z",
"updatedAt":"2012-09-30T17:06:54.983Z",
"account_type":"facebook",
"username":"rajaraodv",
"first_name":"raja",
"photo_url":"http://facebook.com/photo.jpg",
"_id":"50687c2e9455fe0000000006",
“access_token”: “994adb5eedb5fb83636bf1cf498e4cb5” //Note: Use this for all further requests
}

HTTP 403
{
   "Error”: "User with this username & access_token already exists
}

HTTP 400 (Invalid Request - when content-type or something are improperly sent/not sent)
{
  "Error": "invalid json. Tip: Check if headers (e.g. content-type), body(e.g. valid json) & query(e.g. encoding) parameters are all valid"
}
```
#### Notes / Tips for create user: 
1. Content-type application/json is required
2. You can send `username` and `access_token` in POST body, or, in `X-foobar-username` and `X-foobar-access-token` headers. In general setting in header is preferred for most cases.
3. `account_type` parameter is required and can be either `twitter` or `facebook`.
4. `username` REQUIRED. After login via FB/TW, get `twtrUser.name` or `fbUser.username` and pass that.
5. `account_id` REQUIRED. After login via FB/TW, get `twitterUser.id` or `facebookUser.id` & pass that.

### Get user: 
#### Request:
* HTTP GET: Two ways: 
  1. `<server>/users/{id}`  
  2. `<server>/users/me`

* Example: `<server>/users/50688fc9eadee00000000001 or <sever>/users/me`

* Headers: 
  * Content-Type: application/json  must not send
  * X-foobar-username: <username> required
  * X-foobar-access-token: <access token> required

#### Response(s):
```
HTTP 200
{
  "createdAt": "2012-09-30T18:30:33.961Z",
  "updatedAt": "2012-09-30T18:30:33.961Z",
  "account_type": "facebook",
  "username": "rajaraodv",
  "last_name": "rao",
  "photo_url": "http://facebook.com/photo.jpg",
  "_id": "50688fc9eadee00000000001"
}

HTTP 400 (Invalid Request - when content-type or something are improperly sent/not sent)
{
  "Error": "invalid json. Tip: Check if headers (e.g. content-type), body(e.g. valid json) & query(e.g. encoding) parameters are all valid"
}

HTTP 404 (Not found - when requested user not found)
{
  "Error": "User with id 50688fc9eadee00000000003 does not exist"
}

HTTP 401 (Permission denied - Since everything is public, it’s usually when user w/ username + access_token does not exist)
{
  "Error": "User not authorized or does not exist"
}
HTTP 400 (Invalid Request)
{
  "Error": "Invalid Id. It must conform to MongoDB's objectId format"
}
```

#### Notes / Tips for get user: 
1. Must NOT send Content-type application/json header as there is no body-content. 
2. X-foobar-username and X-foobar-access-token headers are Required.
3. id is required. MongoDB’s default id(like 50688fc9eadee00000000001) or “me”

### Update user: 
#### Request:
* HTTP PUT: Two ways: `1. <server>/users/{id} or 2. <server>/users/me`

* Example: `<server>/users/50688fc9eadee00000000001 or <server>/users/me`

* Headers: 
  * Content-Type: application/json (required)
  * X-foobar-username: <username> (required)
  * X-foobar-access-token: <access token> (required)
  * X-foobar-access-token-new: <new access token> (Optional - Only required (as header) if you want to update access_token itself;  Pass both access_token and this one to update it)

* Request Body:
 
 ```
{
"username": "rajaraodv", 
"account_type": "facebook", 
"last_name": "new last name", 
“photo_url”, “http://facebook.com/photo.jpg”
}

```
####Response(s):

```
HTTP 200
{
"createdAt":"2012-09-30T17:06:54.983Z",
"updatedAt":"2012-09-30T17:06:54.983Z",
"account_type":"facebook",
"username":"rajaraodv",
"last_name":"rao",
"photo_url":"http://facebook.com/photo.jpg",
"_id":"50687c2e9455fe0000000006"
}


HTTP 400 (Invalid Request - when content-type or something are improperly sent/not sent)
{
  "Error": "invalid json. Tip: Check if headers (e.g. content-type), body(e.g. valid json) & query(e.g. encoding) parameters are all valid"
}
HTTP 400 (Invalid Request)
{
  "Error": "Invalid Id. It must conform to MongoDB's objectId format"
}
```

#### Notes / Tips for update user: 
1. You can update currently logged in user only and not other users as there is no ACL.
2. `{id}` is required & must be currently logged in user’s MongoDB id.
Content-type `application/json` is required if you are updating something in the body.
3. To just update `access_token`: set `X-foobar-access-token-new` header and send {} in the body


### Delete user: 
#### Request:
* HTTP DELETE: `<server>/users/{id}`

* Example: `<server>/users/50688fc9eadee00000000001`

* Headers: 
  * Content-Type: application/json (Don’t send)
  * X-foobar-username: <username> (required)
  * X-foobar-access-token: <access token> (required)


* Request Body

  N/A

* Response(s):

 ```
 HTTP 200
 {
 "status”: “OK”
 }

HTTP 400 (Invalid Request - when content-type or something are improperly sent/not sent)
{
  "Error": "invalid json. Tip: Check if headers (e.g. content-type), body(e.g. valid json) & query(e.g. encoding) parameters are all valid"
}
HTTP 400 (Invalid Request)
{
  "Error": "Invalid Id. It must conform to MongoDB's objectId format"
}

```
#### Notes / Tips for delete user: 
1. You can delete currently logged in user only and not other users as there is no ACL.
2. {id} is required & must be currently logged in user’s MongoDB id.
3. Don’t send Content-type application/json 

#Photo Posts (Individual Post w/ a Photo)
### Create photoposts: 
####Request:
* HTTP POST: `<server>/photoposts/`

* Headers: 
  * Content-Type: multipart/form-data (required)
  * X-foobar-username: <username>
  * X-foobar-access-token: <access token>
  * X-foobar-product-id: <product_id> required

* Request Body (Note: Create a form w/ the following details):
	1. Upload Photo’s Field name `must` be: `pic` (required)
Headers `X-foobar-username (username) and X-foobar-access-token` is required.
    2. `X-foobar-product-id`: Simply a number (like 1, 2 etc), indicating the foobar product’s id.
    3. Upload the photo to `/photoposts/` end point with `enctype=multipart/form-data`

####Response(s):

```
HTTP 200
{
  "__v": 0,
  "createdAt": "2012-10-01T01:58:05.323Z",
  "updatedAt": "2012-10-01T01:58:05.323Z",
  "creator": {
    "_id": "50687c2e9455fe0000000006",
    "username": "rajaraodv",
    "first_name": "Raja",
    "photo_url": "http://facebook.com/photo.jpg"
  },
  "photo": {
    "_id": "5068f8ad28f5dc0000000001",
    "url": "/photos/5068f8ad28f5dc0000000001",
    "filename": "1-mainPhoto.png",
    "width": "640",
    "height": "960"
  },

  "_id": "5068f8ad28f5dc0000000006",
   "product_id": "1",
  "comments": [],
   "liked_by": ["506f89bab95a52d66b000001"], //User Ids of those who liked
  "comments_cnt": 0,
  "likes_cnt": 1, //# of likes
  "photo_caption": “” //Text user would add as a caption or description of the photo
}
```

### Get PhotoPost (Returns detailed information of a given photopost - Could be used for Detailed-view)

#### Request:
* HTTP POST: `<server>/photoposts/{id}`

* Headers: 
  * Content-Type: application/json (Don’t send)  
  * X-foobar-username: <username>  (not required)
  * X-foobar-access-token: <access token> (not required)

#### Response(s):

```
HTTP 200
{
  "_id": "5068ed9f00c0f50000000008",
  "creator": {
    "photo_url": "http://facebook.com/photo.jpg",
    "username": "rajaraodv",
    "first_name": "Raja",
    "_id": "50687c2e9455fe0000000006"
  },
  "photo": {
    "height": "960",
    "width": "640",
    "filename": "1-mainPhoto.png",
    "url": "/photos/5068ed9f00c0f50000000003",
    "_id": "5068ed9f00c0f50000000003"
  },
  "updatedAt": "2012-10-01T01:24:43.994Z",
  "comments": [
    {
      "updatedAt": "2012-10-01T01:13:04.108Z",
      "creator": {
        "photo_url": "http://facebook.com/photo.jpg",
        "username": "rrrr",
"first_name": "Raja",
        "_id": "5068e8bea789370000000001"
      },
      "text": "some comment",
      "_id": "5068ee2000c0f50000000009"
    },
    {
      "updatedAt": "2012-10-01T01:24:43.992Z",
      "creator": {
        "photo_url": "http://facebook.com/photo.jpg",
        "username": "rrrr",
"first_name": "Raja",
        "_id": "5068e8bea789370000000001"
      },
      "text": "2nd Comment",
      "_id": "5068f0db01aeb10000000001"
    }
  ],
  "comments_cnt": 2,
  "likes_cnt": 0,
   “photo_caption”: “Golden Gate Bridge”
}
```

#### Notes / Tips for creating photoposts: 
1. `{id}` is required. This is the id of `post_id`. 
2. This provides detailed info of a given photopost, including photos, all the comments, likes, etc.

### Update PhotoPost: (Use this to add caption/description to photo)
####Request:
* HTTP PUT: `<server>/photoposts/{id}`

* Headers: 
  * Content-Type: application/json (required)
  * X-foobar-username: <username> (required)
  * X-foobar-access-token: <access token> (required)

* Request Body

```
{
"photo_caption": "This is photo of Golden Gate bridge", 
}
```

####Response(s):

```
HTTP 200
{
  "__v": 0,
  "createdAt": "2012-10-01T01:58:05.323Z",
  "updatedAt": "2012-10-01T01:58:05.323Z",
  "creator": {
    "_id": "50687c2e9455fe0000000006",
    "username": "rajaraodv",
     "first_name": "Raja",
    "photo_url": "http://facebook.com/photo.jpg"
  },
  "photo": {
    "_id": "5068f8ad28f5dc0000000001",
    "url": "/photos/5068f8ad28f5dc0000000001",
    "filename": "1-mainPhoto.png",
    "width": "640",
    "height": "960"
  },

  "_id": "5068f8ad28f5dc0000000006",
  "comments": [],
  "comments_cnt": 0,
  "likes_cnt": 0,
  "photo_caption": “This is photo of Golden Gate bridge” 
}

HTTP 401 
{
   "Error":"You can only update currently authenticated user's comment"
}
```

####Notes / Tips for updating comments: 
1. `{id}` is the `_id` of the PhotoPost that’s being updated.
2. `photo_caption` is required field.


###Delete PhotoPost: 
####Request:
* HTTP DELETE: `<server>/photoposts/{id}`

* Example: `<server>/photoposts/50688fc9eadee00000000001`

* Headers: 
  * Content-Type: application/json (Don’t send)
  * X-foobar-username: <username> (required)
  * X-foobar-access-token: <access token> (required)


* Request Body

N/A

* Response(s):

```
HTTP 200
{
"status”: “OK”
}

HTTP 400 (Invalid Request - when content-type or something are improperly sent/not sent)
{
  "Error": "invalid json. Tip: Check if headers (e.g. content-type), body(e.g. valid json) & query(e.g. encoding) parameters are all valid"
}
HTTP 400 (Invalid Request)
{
  "Error": "Invalid Id. It must conform to MongoDB's objectId format"
}
```

####Notes / Tips for delete user: 
1. This will delete PhotoPost, all associated Comments, all associated Likes and Photo itself. 
2. You can only delete currently authenticated user’s PhotoPosts.

###Get Photo (photo itself): 
####Request:
* HTTP GET: `<server>/photos/{id}`

* Example: `<server>/photos/5068ed9f00c0f50000000003`

* Headers: 
  * Content-Type: application/json (Don’t send)
  * X-foobar-username: <username>
  * X-foobar-access-token: <access token>

* Request Body

N/A

* Response(s):

HTTP 200  (actual photo will be sent back)

#Comments
###Create comment: 
####Request:
* HTTP POST: `<server>/comments/`

* Headers: 
  * Content-Type: application/json (required)
  * X-foobar-username: <username> (required)
  * X-foobar-access-token: <access token> (required)

* Request Body

```
{
"post_id": "5068ed9f00c0f50000000008", 
"text": "2nd Comment"
}
```

####Response(s):
```
HTTP 200
{
  "createdAt": "2012-10-01T01:24:43.992Z",
  "updatedAt": "2012-10-01T01:24:43.992Z",
  "creator": {
    "photo_url": "http://facebook.com/photo.jpg",
    "username": "rrrr",
     "first_name": "Raja",
    "_id": "5068e8bea789370000000001"
  },
  "text": "2nd Comment",
  "post_id": "5068ed9f00c0f50000000008",
  "_id": "5068f0db01aeb10000000001"
}

HTTP 400
{
  "Error": ‘Either ‘post_id’ or ‘text’ parameter missing"
}

HTTP 404
{
  "Error": "PhotoPost Not Found"
}
```

####Notes / Tips for create comments: 
1. Creating comment needs only `text` field and `post_id` fields and both are required.
2. `text` field is where you send comment’s text.
3. `post_id` is the PhotoPost’s id to which this comment is meant for.
4. Note - When a comment is created, it’s parent PhotoPost’s updatedAt timestamp & comments_cnt fields are also updated.
5. Todo - Currently there is no limit to comment’s length


###Get Comment: 
####Request:
* HTTP GET: `<server>/comments/{id}`

* Example: `<server>/photos/5068f0db01aeb10000000001`

* Headers: 
  * Content-Type: application/json (Don’t send)
  * X-foobar-username: <username>
  * X-foobar-access-token: <access token>

* Request Body

N/A

* Response(s):

```
HTTP 200

{
  "createdAt": "2012-10-01T03:58:11.773Z",
  "updatedAt": "2012-10-01T03:58:11.773Z",
  "creator": {
    "photo_url": "http://facebook.com/photo.jpg",
    "username": "rrrr",
     "first_name": "Raja",
    "_id": "5068fdb6b545cf0000000002"
  },
  "text": "2nd Comment",
  "post_id": "5068ed9f00c0f50000000008",
  "_id": "506914d3ea65ab0000000005"
}
```

###Update comment: 
####Request:
`HTTP PUT: <server>/comments/{id}`

* Headers: 
  * Content-Type: application/json (required)
  * X-foobar-username: <username> (required)
  * X-foobar-access-token: <access token> (required)

* Request Body

```
{
"post_id": "5068ed9f00c0f50000000008", 
"text": " updated Comment"
}
```

####Response(s):

```
HTTP 200
{
  "createdAt": "2012-10-01T01:24:43.992Z",
  "updatedAt": "2012-10-01T01:24:43.992Z",
  "creator": {
    "photo_url": "http://facebook.com/photo.jpg",
    "username": "rrrr",
     "first_name": "Raja",
    "_id": "5068e8bea789370000000001"
  },
  "text": "updated Comment",
  "post_id": "5068ed9f00c0f50000000008",
  "_id": "5068f0db01aeb10000000001"
}

HTTP 401 
{
   "Error":"You can only update currently authenticated user's comment"
}
```

####Notes / Tips for updating comments: 
1. `{id}` is _id of the comment that’s being updated
2. You can only update `text` field & is required.
3. Note - When you update a comment, in addition to the text, it’s updateAt timestamp & it’s parent PhotoPost’s updatedAt timestamp will also be updated. 


###Delete comment: 
###Request:
`HTTP DELETE: <server>/comments/{id}`

`Example: <server>/comments/50688fc9eadee00000000001`

* Headers: 
  * Content-Type: application/json (Don’t send)
  * X-foobar-username: <username> (required)
  * X-foobar-access-token: <access token> (required)


* Request Body

   N/A

####Response(s):

```
HTTP 200
{
"status”: “OK”
}

HTTP 400 (Invalid Request - when content-type or something are improperly sent/not sent)
{
  "Error": "invalid json. Tip: Check if headers (e.g. content-type), body(e.g. valid json) & query(e.g. encoding) parameters are all valid"
}
HTTP 400 (Invalid Request)
{
  "Error": "Invalid Id. It must conform to MongoDB's objectId format"
}
```

####Notes / Tips for delete comment: 
1. You can only delete currently logged in user’s comment
2. `{id}` is required & must be currently logged in user’s MongoDB id.
3. Don’t send `Content-type application/json`


#Likes
###Create like: 
####Request:
`HTTP POST: <server>/likes/`

* Headers: 
  * Content-Type: application/json (required)
  * X-foobar-username: <username> (required)
  * X-foobar-access-token: <access token> (required)

* Request Body

```
{
"post_id": "5068ed9f00c0f50000000008"
}
```

####Response(s):

```
HTTP 200
{
  "__v": 0,
  "createdAt": "2012-10-02T00:56:01.216Z",
  "updatedAt": "2012-10-02T00:56:01.216Z",
  "creator": {
    "_id": "5069c1ed17f7eb0000000003",
    "username": "rrrr",
     "first_name": "Raja",
    "photo_url": "http://facebook.com/photo.png"
  },
  "post_id": "5069f0ddc2cdc00000000014",
  "_id": "506a3ba16a60a8f302000001"
}

HTTP 403 (Forbidden)
{
  "Error": "You can 'like' a post only once"
}

HTTP 400
{
  "Error": ‘post_id’ parameter missing"
}

HTTP 404
{
  "Error": "PhotoPost Not Found"
}
```

####Notes / Tips for create like: 
1. Creating comment needs only ‘post_id’ field.
2. You can’t ‘like’ a post more than once, server will throw error.

###Get Like: 
####Request:
`HTTP GET: <server>/likes/{id}`

`Example: <server>/likes/5068f0db01aeb10000000001`

* Headers: 
  * Content-Type: application/json (Don’t send)
  * X-foobar-username: <username>
  * X-foobar-access-token: <access token>

* Request Body

   N/A

####Response(s):

```
HTTP 200
{
  "__v": 0,
  "createdAt": "2012-10-02T00:56:01.216Z",
  "updatedAt": "2012-10-02T00:56:01.216Z",
  "creator": {
    "_id": "5069c1ed17f7eb0000000003",
    "username": "rrrr",
     "first_name": "Raja",
    "photo_url": "http://facebook.com/photo.png"
  },
  "post_id": "5069f0ddc2cdc00000000014",
  "_id": "506a3ba16a60a8f302000001"
}
```


###Delete ‘Like’ (Method 1): 
####Request:
`HTTP DELETE: <server>/likes/{id}`

`Example: <server>/likes/50688fc9eadee00000000001`

* Headers: 
  * Content-Type: application/json (Don’t send)
  * X-foobar-username: <username> (required)
  * X-foobar-access-token: <access token> (required)


* Request Body

  N/A

####Response(s):

```
HTTP 200
{
"status”: “OK”
}

HTTP 400 (Invalid Request - when content-type or something are improperly sent/not sent)
{
  "Error": "invalid json. Tip: Check if headers (e.g. content-type), body(e.g. valid json) & query(e.g. encoding) parameters are all valid"
}
HTTP 400 (Invalid Request)
{
  "Error": "Invalid Id. It must conform to MongoDB's objectId format"
}

```

####Notes / Tips for delete user: 
1. You can only delete currently logged in user’s comment
2. `{id}` is required & must be currently logged in user’s MongoDB id.
3. Don’t send Content-type `application/json `



### Delete ‘Like’ (Method 2): 
####Request:
`HTTP DELETE: <server>/likes/photoposts/{:photoPostId}`

`Example: <server>/likes/photoposts/50688fc9eadee00000000001`

* Headers: 
  * Content-Type: application/json (Don’t send)
  * X-foobar-username: <username> (required)
  * X-foobar-access-token: <access token> (required)


* Request Body

  N/A

#### Response(s):
```
HTTP 200
{
"status”: “OK”
}

HTTP 400 (Invalid Request - when content-type or something are improperly sent/not sent)
{
  "Error": "invalid json. Tip: Check if headers (e.g. content-type), body(e.g. valid json) & query(e.g. encoding) parameters are all valid"
}
HTTP 400 (Invalid Request)
{
  "Error": "Invalid Id. It must conform to MongoDB's objectId format"
}
```

####Notes / Tips for delete Like: 
1. I have added another endpoint for un-liking a post via photoPostId (instead of likeId). Because if the user is un-liking a post that they had already liked, but want to un-like it at a later date, the mobile-clients won't have the the like’s id. So, this new endpoint will allow us to simply send the post’s id {photoPostId} and the server will take care of deleting the like as long as the user has already liked it before.

#Feeds
###Get like: 
####Request:
`HTTP GET: <server>/feeds/${pageNumber}/${numberOfItems}`

`Example:  <server>/feeds/1/10`

* Headers: 
  * Content-Type: application/json (Don’t send)
  * X-foobar-username: <username> (required)
  * X-foobar-access-token: <access token> (required)

* Request Body

  N/A

#### Response(s):

```
HTTP 200
[
  {
    "_id": "5069f0ddc2cdc00000000014",
    "createdAt": "2012-10-01T19:37:01.593Z",
    "creator": {
      "photo_url": "http://facebook.com/photo.png",
      "username": "rajaraodv",
      "first_name": "Raja",
      "_id": "5069c1e617f7eb0000000002"
    },
    "photo": {
      "height": "960",
      "width": "640",
      "filename": "1-mainPhoto.png",
      "url": "/photos/5069f0ddc2cdc0000000000f",
      "_id": "5069f0ddc2cdc0000000000f"
    },
    "updatedAt": "2012-10-02T00:56:01.218Z",
    "comments": [
      {
        "updatedAt": "2012-10-02T00:16:13.282Z",
        "creator": {
          "photo_url": "http://facebook.com/photo.png",
          "username": "rajaraodv",
          "first_name": "Raja",
          "_id": "5069c1e617f7eb0000000002"
        },
        "text": " from rajaraodv",
        "_id": "506a324d5d1dc00000000001"
      },
      {
        "updatedAt": "2012-10-02T00:16:14.926Z",
        "creator": {
          "photo_url": "http://facebook.com/photo.png",
          "username": "rajaraodv",
          "first_name": "Raja",
          "_id": "5069c1e617f7eb0000000002"
        },
        "text": " from rajaraodv",
        "_id": "506a324e5d1dc00000000002"
      }
    ],
    "comments_cnt": 2,
    "likes_cnt": 1,
    "liked_by": [506a10bae770810000000001],
    "photo_caption": ""
  },
  {
    "createdAt": "2012-10-01T21:52:58.584Z",
    "updatedAt": "2012-10-01T21:52:58.584Z",
    "creator": {
      "photo_url": "http://facebook.com/photo.png",
      "username": "rajaraodv",
      "first_name": "Raja",
      "_id": "5069c1e617f7eb0000000002"
    },
    "photo": {
      "height": "960",
      "width": "640",
      "filename": "1-mainPhoto.png",
      "url": "/photos/506a10bae770810000000001",
      "_id": "506a10bae770810000000001"
    },
    "_id": "506a10bae770810000000006",
    "comments": [],
    "comments_cnt": 0,
    "likes_cnt": 1,
    "liked_by": [506a10bae770810000000001],
    "photo_caption": ""
  }
]
```

####Notes / Tips for create like: 
1. Returns an array of PhotoPosts.
2. `${pageNumber}` - Required. Which page to return. Page number starts from 1.
3.  `${numberOfItems} - Required`. How many PhotoPost items to return (10 is typical).


#Products
###Get Products: 

####Request:
`HTTP GET: <server>/products`

`Example:  <server>/products`

* Headers: 
  * Content-Type: application/json (Don’t send)
  * X-foobar-username: <username> (required)
  * X-foobar-access-token: <access token> (required)

* Request Body

  N/A

* Response(s):

```
HTTP 200
[
  {
    "id": 1,
    "name": "foobar1",
    "desc": "This is chocolate bar0"
  },
  {
    "id": 2,
    "name": "foobar1",
    "desc": "This is chocolate bar1"
  },
  {
    "id": 3,
    "name": "foobar1",
    "desc": "This is chocolate bar2"
  }
…
…
]
```

####Notes / Tips for create Products: 
1. Returns an array of foobar products. Use the `id` of the product. 
2. Associate the id to foobar-logo that will be appended to the user’s photo and send this id as `X-foobar-product-id` when user uploads the photo.




