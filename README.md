# String Analyzer API

A RESTful API service that analyzes strings and stores their computed properties including palindrome detection, character frequency analysis, and more.

## Features

- **String Analysis**: Computes length, palindrome status, unique character count, word count, SHA-256 hash, and character frequency map
- **CRUD Operations**: Create, read, and delete analyzed strings
- **Advanced Filtering**: Filter strings by various properties with query parameters
- **Natural Language Queries**: Parse natural language requests to filter strings
- **In-memory Storage**: Fast storage using JavaScript Map (suitable for development and testing)

## API Endpoints

### 1. Create/Analyze String
**POST** `/strings`

Creates a new string analysis and stores it in the system.

**Request Body:**
```json
{
  "value": "string to analyze"
}
```

**Success Response (201 Created):**
```json
{
  "id": "sha256_hash_value",
  "value": "string to analyze",
  "properties": {
    "length": 17,
    "is_palindrome": false,
    "unique_characters": 12,
    "word_count": 3,
    "sha256_hash": "abc123...",
    "character_frequency_map": {
      "s": 2,
      "t": 3,
      "r": 2
    }
  },
  "created_at": "2025-08-27T10:00:00Z"
}
```

**Error Responses:**
- `409 Conflict`: String already exists in the system
- `400 Bad Request`: Invalid request body or missing "value" field
- `422 Unprocessable Entity`: Invalid data type for "value" (must be string)

### 2. Get Specific String
**GET** `/strings/{string_value}`

Retrieves a specific string analysis by its value.

**Success Response (200 OK):**
```json
{
  "id": "sha256_hash_value",
  "value": "requested string",
  "properties": { /* same as above */ },
  "created_at": "2025-08-27T10:00:00Z"
}
```

**Error Response:**
- `404 Not Found`: String does not exist in the system

### 3. Get All Strings with Filtering
**GET** `/strings?is_palindrome=true&min_length=5&max_length=20&word_count=2&contains_character=a`

Retrieves all strings with optional filtering.

**Query Parameters:**
- `is_palindrome`: boolean (true/false)
- `min_length`: integer (minimum string length)
- `max_length`: integer (maximum string length)
- `word_count`: integer (exact word count)
- `contains_character`: string (single character to search for)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "hash1",
      "value": "string1",
      "properties": { /* ... */ },
      "created_at": "2025-08-27T10:00:00Z"
    }
  ],
  "count": 15,
  "filters_applied": {
    "is_palindrome": true,
    "min_length": 5,
    "max_length": 20,
    "word_count": 2,
    "contains_character": "a"
  }
}
```

**Error Response:**
- `400 Bad Request`: Invalid query parameter values or types

### 4. Natural Language Filtering
**GET** `/strings/filter-by-natural-language?query=all%20single%20word%20palindromic%20strings`

Filters strings using natural language queries.

**Example Queries:**
- `"all single word palindromic strings"` → word_count=1, is_palindrome=true
- `"strings longer than 10 characters"` → min_length=11
- `"palindromic strings that contain the first vowel"` → is_palindrome=true, contains_character=a
- `"strings containing the letter z"` → contains_character=z

**Success Response (200 OK):**
```json
{
  "data": [ /* array of matching strings */ ],
  "count": 3,
  "interpreted_query": {
    "original": "all single word palindromic strings",
    "parsed_filters": {
      "word_count": 1,
      "is_palindrome": true
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Unable to parse natural language query
- `422 Unprocessable Entity`: Query parsed but resulted in conflicting filters

### 5. Delete String
**DELETE** `/strings/{string_value}`

Deletes a string from the system.

**Success Response (204 No Content):**
Empty response body

**Error Response:**
- `404 Not Found`: String does not exist in the system

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-27T10:00:00Z",
  "total_strings": 42
}
```

## Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd string-analyzer-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Running Locally

1. **Development mode (with auto-restart):**
   ```bash
   npm run dev
   ```

2. **Production mode:**
   ```bash
   npm start
   ```

The server will start on `http://localhost:3000` by default.

### Environment Variables

The following environment variables can be configured:

- `PORT`: Server port (default: 3000)

Example:
```bash
PORT=8080 npm start
```

## Dependencies

### Production Dependencies
- **express**: ^5.1.0 - Web framework for Node.js
- **cors**: ^2.8.5 - Cross-Origin Resource Sharing middleware

### Development Dependencies
- **nodemon**: ^3.1.10 - Development tool that automatically restarts the server

### Built-in Node.js Modules Used
- **crypto**: For generating SHA-256 hashes

## Testing the API

### Using curl

1. **Create a string:**
   ```bash
   curl -X POST http://localhost:3000/strings \
     -H "Content-Type: application/json" \
     -d '{"value": "hello world"}'
   ```

2. **Get a specific string:**
   ```bash
   curl http://localhost:3000/strings/hello%20world
   ```

3. **Get all strings:**
   ```bash
   curl http://localhost:3000/strings
   ```

4. **Filter strings:**
   ```bash
   curl "http://localhost:3000/strings?is_palindrome=true&min_length=5"
   ```

5. **Natural language query:**
   ```bash
   curl "http://localhost:3000/strings/filter-by-natural-language?query=all%20single%20word%20palindromic%20strings"
   ```

6. **Delete a string:**
   ```bash
   curl -X DELETE http://localhost:3000/strings/hello%20world
   ```

### Using Postman or similar tools

Import the following collection or create requests manually:

1. **POST** `http://localhost:3000/strings`
   - Body (JSON): `{"value": "test string"}`

2. **GET** `http://localhost:3000/strings/test%20string`

3. **GET** `http://localhost:3000/strings?is_palindrome=false`

4. **GET** `http://localhost:3000/strings/filter-by-natural-language?query=strings%20longer%20than%205%20characters`

5. **DELETE** `http://localhost:3000/strings/test%20string`

## String Analysis Properties

For each analyzed string, the API computes and stores:

- **length**: Number of characters in the string
- **is_palindrome**: Boolean indicating if the string reads the same forwards and backwards (case-insensitive, ignores non-alphanumeric characters)
- **unique_characters**: Count of distinct characters in the string (case-insensitive)
- **word_count**: Number of words separated by whitespace
- **sha256_hash**: SHA-256 hash of the string for unique identification
- **character_frequency_map**: Object mapping each character to its occurrence count (case-insensitive)

## Error Handling

The API includes comprehensive error handling with appropriate HTTP status codes:

- `200 OK`: Successful GET requests
- `201 Created`: Successful POST requests
- `204 No Content`: Successful DELETE requests
- `400 Bad Request`: Invalid request parameters or malformed requests
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `422 Unprocessable Entity`: Invalid data types or conflicting filters
- `500 Internal Server Error`: Server errors

## Notes
- The API uses in-memory storage (JavaScript Map) which means data is lost when the server restarts
- All string comparisons are case-insensitive where applicable
- The SHA-256 hash serves as the unique identifier for each string
- URL encoding is handled automatically for string values in URLs
