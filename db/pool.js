const { Pool } = require('pg');

module.exports = new Pool({
  host: "localhost",
  user: "postgres",
  database: "inventorydb",
  password: "123",
  port: 5432
});