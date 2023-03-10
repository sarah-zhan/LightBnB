SELECT p.id, title, cost_per_night, AVG(pv.rating) AS average_rating
FROM properties p
LEFT JOIN property_reviews pv
ON p.id = pv.property_id
WHERE p.city = 'Vancouver'
GROUP BY p.id, title, cost_per_night
HAVING AVG(pv.rating) >= 4
ORDER BY cost_per_night
LIMIT 10;