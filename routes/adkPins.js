const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// Correct the path to the JSON files
const dataPath = path.join(__dirname, '..', 'api', 'adk');


// Function to read and parse JSON files
const createDataEndpoint = async (filename) => {
  try {
    const data = await fs.readFile(path.join(dataPath, filename), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    throw new Error('Internal server error');
  }
};

// Store available endpoints
let availableEndpoints = [];

// Dynamically create endpoints based on files in the directory
const setupEndpoints = async () => {
  try {
    const files = await fs.readdir(dataPath);
    availableEndpoints = files.map(file => {
      const route = `/${path.basename(file, '.json')}`;
      router.get(route, async (req, res) => {
        console.log(`Received request for ${req.originalUrl}`);
        try {
          const data = await createDataEndpoint(file);
          console.log(`Successfully fetched data for ${route}`);
          res.json(data);
        } catch (error) {
          console.error(`Error fetching data for ${route}:`, error);
          res.status(500).json({ error: error.message });
        }
      });
      return route;
    });
  } catch (error) {
    console.error('Error setting up endpoints:', error);
  }
};

// Call the function to set up endpoints
setupEndpoints();

// Endpoint to get all available endpoints
router.get('/endpoints', (req, res) => {
  res.json(availableEndpoints);
});

// Aggregate all data into one endpoint
router.get('/all', async (req, res) => {
  try {
    const files = await fs.readdir(dataPath);
    const data = await Promise.all(
      files.map(file => createDataEndpoint(file))
    );
    res.json(data.flat());
  } catch (error) {
    console.error('Error fetching aggregated data:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
