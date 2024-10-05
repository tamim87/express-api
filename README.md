# express-api

REST API using expressJS.

## Features

-   **User Registration**: Register a new user with a unique username and email.
-   **User Login**: Authenticate users and generate JWT tokens.
-   **Profile Management**: View, update, and delete user profiles.
-   **Image Upload**: Users can upload a profile image.
-   **Security**: Password hashing using bcrypt and JWT-based authentication.

## Prerequisites

-   Node.js (v14+)
-   PostgreSQL (v12+)
-   A basic understanding of RESTful APIs

## Setup Instructions

1. **Clone the repository**:

    ```bash
    git clone https://github.com/yourusername/express-api.git
    cd express-api
    ```

2. **Install dependencies**:

    ```bash
    npm install
    ```

3. **Set Environment Variables**:

    This project requires environment variables to be set up. Copy the `.env.example` file to `.env` and update your environment variables.

    ```bash
    cp .env.example .env
    ```

4. **Set up PostgreSQL database**:
   Create a PostgreSQL database and update your .env file with the correct database credentials:
5. **Run database migrations**:

    Ensure you have the required tables by running your SQL scripts or a migration tool (if available).

6. **Run the app**

    Run the development server

    ```bash
    npm run dev
    ```

The server will be listening on port 3000.

## API Endpoints

-   **POST /register** - Register a new user.
-   **POST /login** - Logs in a user and returns a JWT token.
-   **GET /profile** - Returns the logged-in user's profile details, including the URL to the profile image (JWT required).
-   **PUT /profile** - Updates the username or email of the logged-in user (JWT required).
-   **DELETE /profile** - Deletes the logged-in user's profile (JWT required).
-   **POST /upload** - Uploads a profile image for the logged-in user (JWT required).
-   **PUT /profile/image**: Allows the user to upload a new profile image, replacing the existing one, with file cleanup and integrity checks.

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

-   Replace _your_jwt_token_ with the token obtained from the login response.

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

7. **Update user profile image**

```bash
curl -X POST http://localhost:3000/upload \
-H "Authorization: your_jwt_token_here" \
-F "image=@your_image_file.png"
```

#### Explanation

-   -X specifies the HTTP method (e.g., `POST`, `GET`, `PUT`, `DELETE`).
-   -H sets the headers, like Content-Type and Authorization.
-   -d sets the JSON data to be sent in the body of the request.
-   -F is used for file upload via form-data.

#### Test Flow

-   Register a new user with the /register endpoint.
-   Login with the /login endpoint to get a JWT token.
-   Use the token from login for authenticated requests such as getting the profile (/profile), updating the profile (/profile), deleting the profile (/profile), and uploading a profile image (/upload).
