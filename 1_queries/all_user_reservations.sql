SELECT properties.id, properties.title, properties.cost_per_night, start_date, AVG(rating) AS average_rating
FROM reservations
JOIN properties ON properties.id = property_id
JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE reservations.guest_id = 1 AND reservations.end_date < now()::date
GROUP BY properties.id, reservations.id
ORDER BY reservations.start_date
LIMIT 10;

