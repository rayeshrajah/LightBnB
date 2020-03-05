const properties = require("./json/properties.json");
const users = require("./json/users.json");

const { Pool } = require("pg");
const pool = new Pool({
  user: "vagrant",
  password: "123",
  host: "localhost",
  database: "lightbnb"
});

/// Users
/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  let values = [email];
  let queryString = `SELECT * 
                     FROM users
                     WHERE email = $1;`;
  return pool.query(queryString, values).then(res => res.rows[0]);
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  let values = [id];
  let queryString = `SELECT * FROM users
                     WHERE id = $1;`;
  return pool.query(queryString, values).then(res => res.rows[0]);
};
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  let values = [user.name, user.email, user.password];
  let queryString = `INSERT INTO users(name, email, password) 
                     VALUES ($1, $2, $3)
                     RETURNING *;`;
  return pool.query(queryString, values).then(res => res.rows[0]);
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const limiter = limit;
  const values = [guest_id, limiter];
  let queryString = `SELECT properties.*, start_date, end_date, AVG(rating) AS average_rating
                     FROM reservations
                     JOIN properties ON properties.id = property_id
                     JOIN property_reviews ON properties.id = property_reviews.property_id
                     WHERE reservations.guest_id = $1 
                     GROUP BY properties.id, reservations.id
                     ORDER BY reservations.start_date
                     LIMIT $2;`;

  return pool.query(queryString, values).then(res => res.rows);
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  let queryParams = [];
  let queryString = `SELECT properties.*, AVG(rating) AS average_rating 
                     FROM properties
                     JOIN property_reviews ON properties.id = property_id `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $1 `;
  }

  if (options.minimum_price_per_night) {
    if (queryParams.length === 0) {
      queryParams.push(options.minimum_price_per_night);
      queryString += `WHERE cost_per_night >= $1 `;
    } else if (queryParams > 0) {
      queryParams.push(options.minimum_price_per_night);
      queryString += `AND cost_per_night >= $2 `;
    }
  }

  if (options.maximum_price_per_night) {
    if (queryParams.length === 0) {
      queryParams.push(options.maximum_price_per_night);
      queryString += `WHERE cost_per_night <= $1 `;
    } else if (queryParams === 1) {
      queryParams.push(options.maximum_price_per_night);
      queryString += `AND cost_per_night >= $2 `;
    } else if (queryParams === 2) {
      queryParams.push(options.maximum_price_per_night);
      queryString += `AND cost_per_night >= $2 `;
    }
  }

  if (options.minimum_rating) {
    if (queryParams.length === 0) {
      queryParams.push(options.minimum_rating);
      queryString += `WHERE average_rating >= $1 `;
    } else if (queryParams === 1) {
      queryParams.push(options.minimum_rating);
      queryString += `WHERE average_rating >= $2 `;
    } else if (queryParams === 2) {
      queryParams.push(options.minimum_rating);
      queryString += `WHERE average_rating >= $3 `;
    } else if (queryParams === 3) {
      queryParams.push(options.minimum_rating);
      queryString += `WHERE average_rating >= $4 `;
    }
  }

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += `WHERE owner_id = $1 `;
  }

  queryParams.push(limit);
  queryString += `GROUP BY properties.id
                  ORDER BY cost_per_night
                  LIMIT $${queryParams.length};`;
  return pool.query(queryString, queryParams).then(res => res.rows);
};
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};
exports.addProperty = addProperty;
