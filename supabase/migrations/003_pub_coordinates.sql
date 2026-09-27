-- Coordinates used to calculate nearby PubGolf routes.
-- Existing custom bars are left untouched and can be positioned separately.

update public.bars set latitude = 63.8252626, longitude = 20.2639714
where lower(name) = lower('Megazone') and city = 'Umeå';

update public.bars set latitude = 63.8246476, longitude = 20.2650788
where lower(name) = lower('Lion Bar') and city = 'Umeå';

update public.bars set latitude = 63.8261478, longitude = 20.2662790
where lower(name) = lower('Kappa Bar') and city = 'Umeå';

update public.bars set latitude = 63.8262021, longitude = 20.2658656
where lower(name) = lower('O''Learys') and city = 'Umeå';

update public.bars set latitude = 63.8252778, longitude = 20.2669558
where lower(name) = lower('Orangeriet') and city = 'Umeå';

update public.bars set latitude = 63.8266274, longitude = 20.2660339
where lower(name) = lower('Allstar') and city = 'Umeå';

update public.bars set latitude = 63.8259768, longitude = 20.2598299
where lower(name) = lower('Harrys') and city = 'Umeå';

update public.bars set latitude = 63.8246561, longitude = 20.2569966
where lower(name) = lower('Sjöbris') and city = 'Umeå';

update public.bars set latitude = 63.8274496, longitude = 20.2642640
where lower(name) = lower('Lottas Krog & Pub') and city = 'Umeå';
