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

pool.query(`SELECT email FROM users LIMIT 10;`)
  .then(response => {
    console.log(response);
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
      if (result.email.rows.length > 0) {
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
  if (users.id === guest_id) {
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
      LIMIT $2;`,[guest_id, limit])
      .then((result) => {
        return result.rows;
      })
      .catch((err) => {
        console.log(err.message);
      });
  }
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
  return pool
    .query(`SELECT * FROM properties LIMIT $1`,[limit])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
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
