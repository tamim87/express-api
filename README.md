# express-api

REST API using expressJS.

## Setup Instructions
### 1. Install dependencies:

```bash
npm install
```

### 2. Environment Variables

This project requires environment variables to be set up. Copy the `.env.example` file to `.env` and update your environment variables.

```bash
cp .env.example .env
```

### 3. Run the project

#### Run the development server
```bash
npm run dev
```
The server will be listening on port 3000. 

## API Endpoints

-   **POST /register** - Register a new user.
-   **POST /login** - User login.
-   **GET /profile** - Get user profile (JWT required).
-   **PUT /profile** - Update user profile (JWT required).
-   **DELETE /profile** - Delete user profile (JWT required).
-   **POST /upload** - Upload profile image (JWT required).

### API examples

1. **Register a New User**

```bash
curl -X POST http://localhost:3000/register \
-H "Content-Type: application/json" \
-d '{
  "username": "testuser",
  "password": "testpass",
  "email": "test@example.com"
}'
```

2. **Login (Receive JWT Token)**

```bash
curl -X POST http://localhost:3000/login \
-H "Content-Type: application/json" \
-d '{
  "username": "testuser",
  "password": "testpass"
}'
```

-   Response: This will return a JWT token in the format:

```json
{
    "token": "your_jwt_token"
}
```

3. **Get User Profile (Authenticated Route)**

```bash
curl -X GET http://localhost:3000/profile \
-H "Authorization: your_jwt_token"
```

-   Replace *your_jwt_token* with the token obtained from the login response.

4. **Update User Profile (Authenticated Route)**

```bash
curl -X PUT http://localhost:3000/profile \
-H "Authorization: your_jwt_token" \
-H "Content-Type: application/json" \
-d '{
  "username": "newUsername",
  "email": "newemail@example.com"
}'
```

-   You can provide either username, email, or both in the body.

5. **Delete User Profile (Authenticated Route)**

```bash
curl -X DELETE http://localhost:3000/profile \
-H "Authorization: your_jwt_token"
```

6. **Upload a Profile Image (Authenticated Route)**

```bash
curl -X POST http://localhost:3000/upload \
-H "Authorization: your_jwt_token" \
-F "image=@/path_to_your_image.jpg"
```

-   Replace /path_to_your_image.jpg with the path to the actual image file.
-   Make sure to use the -F flag for file uploads with curl.

    #### Explanation

-   -X specifies the HTTP method (e.g., POST, GET, PUT, DELETE).
-   -H sets the headers, like Content-Type and Authorization.
-   -d sets the JSON data to be sent in the body of the request.
-   -F is used for file upload via form-data.

    #### Test Flow

-   Register a new user with the /register endpoint.
-   Login with the /login endpoint to get a JWT token.
-   Use the token from login for authenticated requests such as getting the profile (/profile), updating the profile (/profile), deleting the profile (/profile), and uploading a profile image (/upload).
