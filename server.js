import express from "express";
import cors from "cors";
import crypto from "crypto";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const stringStorage = new Map(); // In-memory storage

function analyzeString(inputString) {
  const length = inputString.length;

  const normalizedString = inputString.toLowerCase().replace(/[^a-z0-9]/g, "");
  const reversedString = normalizedString.split("").reverse().join("");
  const is_palindrome = normalizedString === reversedString;

  const uniqueCharacters = new Set(inputString.toLowerCase()).size;

  const word_count = inputString.split(" ").length;

  const sha256_hash = crypto
    .createHash("sha256")
    .update(inputString)
    .digest("hex");

  const character_frequency_map = {};

  inputString.split("").forEach((char) => {
    character_frequency_map[char] = (character_frequency_map[char] || 0) + 1;
  });

  return {
    length,
    is_palindrome,
    unique_characters: uniqueCharacters,
    word_count,
    sha256_hash,
    character_frequency_map,
  };
}

function validateStringInput(req, res, next) {
  const { value } = req.body;

  if (value === undefined || value === null) {
    return res.status(400).json({
      error: "Bad Request",
      message: 'Missing "value" field in request body',
    });
  }

  if (typeof value !== "string") {
    return res.status(422).json({
      error: "Unprocessable Entity",
      message: 'Invalid data type for "value" (must be string)',
    });
  }

  next();
}

app.post("/strings", validateStringInput, (req, res) => {
  const { value } = req.body;
  const properties = analyzeString(value);
  const id = properties.sha256_hash;

  // Check if string already exists
  if (stringStorage.has(id)) {
    return res.status(409).json({
      error: "Conflict",
      message: "String already exists in the system",
    });
  }

  const stringData = {
    id,
    value,
    properties,
    created_at: new Date().toISOString(),
  };

  stringStorage.set(id, stringData);

  res.status(201).json(stringData);
});

app.get("/strings/filter-by-natural-language", (req, res) => {
  const { query } = req.query;

  const example_queries = {
    "all single word palindromic strings": {
      word_count: 1,
      is_palindrome: true,
    },
    "strings longer than 10 characters": {
      min_length: 11,
    },
    "palindromic strings that contain the first vowel": {
      is_palindrome: true,
      contains_character: "a",
    },
    "strings containing the letter z": {
      contains_character: "z",
    },
  };

  if (!query) {
    return res.status(400).json({
      error: "Bad Request",
      message: 'Missing "query" parameter',
    });
  }

  try {
    const parsedFilters = example_queries[decodeURIComponent(query).toLowerCase()];

    let filteredStrings = Array.from(stringStorage.values());

    if (parsedFilters.is_palindrome !== undefined) {
      filteredStrings = filteredStrings.filter(
        (str) => str.properties.is_palindrome === parsedFilters.is_palindrome
      );
    }

    if (parsedFilters.min_length !== undefined) {
      filteredStrings = filteredStrings.filter(
        (str) => str.properties.length >= parsedFilters.min_length
      );
    }

    if (parsedFilters.word_count !== undefined) {
      filteredStrings = filteredStrings.filter(
        (str) => str.properties.word_count === parsedFilters.word_count
      );
    }

    if (parsedFilters.contains_character !== undefined) {
      filteredStrings = filteredStrings.filter((str) =>
        str.character_frequency_map
          [parsedFilters.contains_character.toLowerCase()] > 0
      ); 
    }

    res.json({
      data: filteredStrings,
      count: filteredStrings.length,
      interpreted_query: {
        original: query,
        parsed_filters: parsedFilters,
      },
    });
  } catch (error) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Unable to parse natural language query",
    });
  }
});

app.get("/strings/:string_value", (req, res) => {
    const { string_value } = req.params;
    const decodedString = decodeURIComponent(string_value);
    const properties = analyzeString(decodedString);
    const id = properties.sha256_hash;
  
    if (!stringStorage.has(id)) {
      return res.status(404).json({
        error: "Not Found",
        message: "String does not exist in the system",
      });
    }
  
    res.json(stringStorage.get(id));
  });
  
  app.get("/strings", (req, res) => {
    const filter_query = req.query;
    let filteredStrings = Array.from(stringStorage.values());
  
    if (filter_query.is_palindrome) {
      filteredStrings = filteredStrings.filter(
        (str) => str.properties.is_palindrome === filter_query.is_palindrome
      );
    }
  
    if (filter_query.min_length) {
      filteredStrings = filteredStrings.filter(
        (str) => str.properties.length >= filter_query.min_length
      );
    }
  
    if (filter_query.max_length) {
      filteredStrings = filteredStrings.filter(
        (str) => str.properties.length <= filter_query.max_length
      );
    }
  
    if (filter_query.word_count) {
      filteredStrings = filteredStrings.filter(
        (str) => str.properties.word_count === filter_query.word_count
      );
    }
  
    if (filter_query.contains_character) {
      filteredStrings = filteredStrings.filter((str) =>
        str.value
          .toLowerCase()
          .includes(filter_query.contains_character.toLowerCase())
      );
    }
  
    res.json({
      data: filteredStrings,
      count: filteredStrings.length,
      filters_applied: filter_query,
    });
  });

app.delete("/strings/:string_value", (req, res) => {
  const { string_value } = req.params;
  const decodedString = decodeURIComponent(string_value);
  const properties = analyzeString(decodedString);
  const id = properties.sha256_hash;

  if (!stringStorage.has(id)) {
    return res.status(404).json({
      error: "Not Found",
      message: "String does not exist in the system",
    });
  }

  stringStorage.delete(id);
  res.status(204).send();
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: "Something went wrong!",
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "Endpoint not found",
  });
});

app.listen(PORT, () => {
  console.log(`String Analyzer API server is running on port ${PORT}`);
});

export default app;
