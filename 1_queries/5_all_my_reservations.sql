SELECT r.id, p.title, p.cost_per_night, r.start_date, AVG(pr.rating) average_rating
FROM reservations r
JOIN properties p
ON r.property_id = p.id
JOIN property_reviews pr
ON pr.property_id = p.id
JOIN users u
ON u.id = pr.guest_id
WHERE u.id = 1
GROUP BY r.id, p.title, p.cost_per_night, r.start_date
ORDER BY r.start_date
LIMIT 10;