-- Clean up all test orders and related data
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders);
DELETE FROM deliveries WHERE order_id IN (SELECT id FROM orders);
DELETE FROM courier_earnings WHERE order_id IN (SELECT id FROM orders);
DELETE FROM courier_location_history WHERE order_id IN (SELECT id FROM orders);
DELETE FROM geofence_checks WHERE order_id IN (SELECT id FROM orders);
DELETE FROM courier_messages WHERE order_id IN (SELECT id FROM orders);
DELETE FROM coupon_usage WHERE order_id IN (SELECT id FROM orders);
DELETE FROM order_status_history WHERE order_id IN (SELECT id FROM orders);
DELETE FROM recent_purchases;
DELETE FROM orders;

-- Clean up data for non-admin and non-courier users
DELETE FROM cart_items 
WHERE user_id NOT IN (SELECT user_id FROM admin_users UNION SELECT user_id FROM couriers);

DELETE FROM addresses 
WHERE user_id NOT IN (SELECT user_id FROM admin_users UNION SELECT user_id FROM couriers);

DELETE FROM age_verifications 
WHERE user_id NOT IN (SELECT user_id FROM admin_users UNION SELECT user_id FROM couriers);

DELETE FROM device_fingerprints 
WHERE user_id NOT IN (SELECT user_id FROM admin_users UNION SELECT user_id FROM couriers);

DELETE FROM fraud_flags 
WHERE user_id NOT IN (SELECT user_id FROM admin_users UNION SELECT user_id FROM couriers);

DELETE FROM user_ip_addresses 
WHERE user_id NOT IN (SELECT user_id FROM admin_users UNION SELECT user_id FROM couriers);

DELETE FROM giveaway_entries 
WHERE user_id NOT IN (SELECT user_id FROM admin_users UNION SELECT user_id FROM couriers);

DELETE FROM giveaway_referrals 
WHERE referrer_user_id NOT IN (SELECT user_id FROM admin_users UNION SELECT user_id FROM couriers)
   OR referred_user_id NOT IN (SELECT user_id FROM admin_users UNION SELECT user_id FROM couriers);

DELETE FROM loyalty_points 
WHERE user_id NOT IN (SELECT user_id FROM admin_users UNION SELECT user_id FROM couriers);

DELETE FROM profiles 
WHERE user_id NOT IN (SELECT user_id FROM admin_users UNION SELECT user_id FROM couriers);

DELETE FROM account_logs 
WHERE user_id NOT IN (SELECT user_id FROM admin_users UNION SELECT user_id FROM couriers);

DELETE FROM user_roles 
WHERE user_id NOT IN (SELECT user_id FROM admin_users UNION SELECT user_id FROM couriers);