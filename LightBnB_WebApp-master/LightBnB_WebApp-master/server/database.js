const pg = require('pg');
const Pool = pg.Pool;
const properties = require('./json/properties.json');
const users = require('./json/users.json');

/// Users

const config = {
  host: process.env.host,
  port: process.env.port,
  user: process.env.user,
  password: process.env.pass,
  database: process.env.name
};

const pool = new Pool(config);
pool.connect();

pool.query(`SELECT * FROM users LIMIT 1;`)
  .then(response => {
    console.log(response.rows[0]);
  });

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {

  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [email])
    .then((result) => {
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      return null;
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {

  return pool
    .query(`SELECT * FROM users WHERE $1 = id`, [id])
    .then((result) => {
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      return null;
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {

  return pool
    .query(`
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)`, [user.name, user.email, user.password])
    .then((result) => {
      if (user.name && user.email && user.password) {
        return result.rows[0];
      }
      return null;
    })
    .catch((err) => {
      console.log(err);
    });

};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {

  return pool
    .query(`
      SELECT r.id, p.*, r.start_date, AVG(pr.rating) average_rating
      FROM reservations r
      JOIN properties p
      ON r.property_id = p.id
      JOIN property_reviews pr
      ON pr.property_id = p.id
      JOIN users u
      ON u.id = pr.guest_id
      WHERE u.id = $1
      GROUP BY r.id, p.title, p.cost_per_night, r.start_date
      ORDER BY r.start_date
      LIMIT $2;`, [guest_id, limit])
    .then((result) => {
      if (result.rows.length > 0) {
        return result.rows;
      }
      return null;
    })
    .catch((err) => {
      console.log(err.message);
    });
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

  // 1
  let queryParams = [];
  
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  WHERE 1 = 1
  `;

  //3
  if (options.city) {
    queryParams.push(`${options.city}`);
    queryString += `AND city LIKE $1 `;
  }
  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `AND owner_id = ${queryParams.length} `;
  }
  if (options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night * 100}`);
    queryString += `AND cost_per_night >= $${queryParams.length} `;
  }
  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night * 100}`);
    queryString += `AND cost_per_night <= $${queryParams.length} `;
  }


  // // 4

  queryString += `
  GROUP BY properties.id

  `;
  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
  }

  queryParams.push(limit);
  queryString += 'ORDER BY cost_per_night ';
  queryString += `LIMIT $${queryParams.length};`;


  // // 5
  console.log(queryString, queryParams);

  // // 6
  return pool.query(queryString, queryParams).then((res) => res.rows);
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  return pool
    .query(`INSERT INTO properties (title, description, owner_id, cover_photo_url, thumbnail_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, province, city, country, street, post_code) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);`, [property.title, property.description, property.owner_id, property.cover_photo_url, property.thumbnail_photo_url, property.cost_per_night, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms, property.province, property.city, property.country, property.street, property.post_code])
    .then((res) => res.rows[0])
    .catch((err) => {
      console.log(err.message);
    });
};
exports.addProperty = addProperty;

