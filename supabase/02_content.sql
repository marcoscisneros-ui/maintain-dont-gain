-- =====================================================================
-- Maintain, Don't Gain — starter content
-- Paste into Supabase → SQL Editor → New query → Run (once).
-- 49 daily coaching messages + 49 tips (one per day, Nov 16 – Jan 3),
-- a starter Recipes & Tips library, and a welcome announcement.
-- Everything here can be edited, reordered or deleted later in the admin area.
-- Day 11 = Thanksgiving (Nov 26) · Day 40 = Christmas · Day 47 = New Year's Day
-- =====================================================================

insert into public.daily_content (kind, position, title, body) values
('coach', 1, null, $$Day 1. Welcome in! Here's the whole game plan for the next seven weeks: walk into January the same weight you are today. That's it. No crash diets, no punishment workouts. Log your food, get some movement in, and check in here every day. I'm proud of you for signing up. Let's go.$$),
('coach', 2, null, $$A lot of the weight people put on over the years sneaks on between Thanksgiving and New Year's, and it never comes back off. Not this year. Every day you hold steady is a win, even when it doesn't feel like one.$$),
('coach', 3, null, $$Confession: I don't love logging food either. But the days I write it down are the days I make better choices. It doesn't have to be perfect. A rough number beats no number every time.$$),
('coach', 4, null, $$Remember why you signed up. Put it in your phone or tape it to the fridge. On the days motivation runs out, your "why" is what gets you out the door.$$),
('coach', 5, null, $$Showing up is the hard part. Once you're moving, the workout takes care of itself. Twenty minutes counts. A walk around the block counts. Just don't let today be a zero.$$),
('coach', 6, null, $$Weekends are where good weeks go to die. Not this one. Plan one workout and one solid meal today, and enjoy the rest. Balance, not perfection.$$),
('coach', 7, null, $$Sunday reset. Take 10 minutes tonight: look at your week, pick your workout days, and think about what you're eating Monday through Wednesday. Thanksgiving week is a lot easier with a plan.$$),
('coach', 8, null, $$Thanksgiving week is here. My challenge to you: get three workouts in before Thursday. Bank them. Then you get to sit down at that table feeling great instead of guilty.$$),
('coach', 9, null, $$You don't need to "save up" for Thursday by starving yourself this week. That almost always backfires. Eat normally, drink your water, keep your routine. Steady wins.$$),
('coach', 10, null, $$Tomorrow's game plan: move in the morning (a walk, a class, a home workout, anything), eat a real breakfast with some protein, then fill your plate with the food you actually love. Skip the stuff that's just there.$$),
('coach', 11, null, $$Happy Thanksgiving! Today is not a test you can fail. Enjoy your family, enjoy the food, and if you can, get everybody out for a walk after the meal. Tomorrow we're right back at it. I'm grateful for every one of you.$$),
('coach', 12, null, $$One big meal doesn't undo a week of good work, the same way one salad doesn't fix a bad week. Today we get back to normal: water, protein, steps. And yes, walking the mall counts.$$),
('coach', 13, null, $$If the scale jumped a couple pounds since Thursday, don't panic. Most of that is salt, carbs and water, not fat. Keep logging, keep moving, and watch it settle back down this week.$$),
('coach', 14, null, $$Two weeks down. Take a second and look at what you've done: the workouts, the logging, the choices nobody saw you make. That's how you win this thing.$$),
('coach', 15, null, $$December starts tomorrow, and it's the big one: parties, cookies, late nights. We go in with a plan, not a hope. Pick your workout days for this week right now.$$),
('coach', 16, null, $$Welcome to December. My one rule for this month: never miss twice. Skipped a workout? Fine, just don't skip the next one. Went over your calories? Fine, nail the next meal. That's it.$$),
('coach', 17, null, $$Protein is your best friend this time of year. It keeps you full, protects your muscle, and makes it a lot harder to go overboard on the cookie tray. Get some at every meal.$$),
('coach', 18, null, $$Your workout doesn't have to be long to count. On busy days, 20 minutes at home beats 0 minutes waiting for the perfect hour that never comes. Get your point and move on with your day.$$),
('coach', 19, null, $$Real talk: drinks are where a lot of holiday gain hides. Eggnog, hot cocoa, cocktails, fancy coffees. They add up fast. Enjoy the ones you really love and swap the rest for water.$$),
('coach', 20, null, $$Party season tip from experience: eat something with protein before you go. Showing up starving is how you end up eating half the queso. Ask me how I know.$$),
('coach', 21, null, $$Three weeks in. Check the leaderboard. Whether you're at the top or still climbing, every point on there is a day you showed up for yourself. I'm proud of this group.$$),
('coach', 22, null, $$Sleep matters more than people think. When you're short on sleep, hunger and cravings go way up. Try to protect 7 hours this week. Your waistline will thank you.$$),
('coach', 23, null, $$Don't let "I already blew it today" turn into a blown weekend. Every meal is a fresh start. You're always one good choice away from being right back on track.$$),
('coach', 24, null, $$Movement doesn't only happen at the gym. Park farther out, take the stairs, walk while you're on the phone. In December those little steps add up to a lot.$$),
('coach', 25, null, $$We're almost at the halfway point. If you haven't done a weigh-in or InBody scan since you started, this week is a great time. Data beats guessing.$$),
('coach', 26, null, $$It's Friday. Plan your weekend workout right now, before the weekend plans it for you. Pick a time, put it in your calendar, and treat it like an appointment you can't miss.$$),
('coach', 27, null, $$Treats aren't the enemy. Guilt is. Have the cookie, enjoy it, log it, move on. Consistency isn't about being perfect. It's about not quitting.$$),
('coach', 28, null, $$Four weeks done, three to go. You've made it through Thanksgiving and the start of party season. Most people have already decided to "start over in January" by now. You haven't. Big difference.$$),
('coach', 29, null, $$Halfway there! Open your Progress tab. If you're holding steady, that IS the win. Maintaining through December is harder than losing weight in March, and you're doing it.$$),
('coach', 30, null, $$Stress eating is real, especially this time of year. Before you grab something, ask yourself: am I hungry, or am I stressed, tired or bored? Sometimes a walk does more than a snack.$$),
('coach', 31, null, $$Small challenge for this week: get a vegetable on your plate at every meal. Nothing fancy. A handful of baby carrots counts. More food, fewer calories, more energy.$$),
('coach', 32, null, $$Feeling stuck in a rut? Try a class you've never taken. New moves, new people, new energy. Plus it's 3 points on the board.$$),
('coach', 33, null, $$Last full weekend before Christmas, and it's going to be busy. Lock in one workout, keep logging, and give yourself some grace on the rest.$$),
('coach', 34, null, $$Shopping, wrapping, cooking, traveling. If your routine is falling apart, shrink it instead of quitting it: 10 push-ups, 20 squats, a 15-minute walk. Keep the streak alive.$$),
('coach', 35, null, $$Five weeks in. Whatever the scale says today, you've built habits most people only talk about. Those habits last a lot longer than this challenge.$$),
('coach', 36, null, $$Christmas week. Same game plan that worked at Thanksgiving: bank a few workouts early in the week, eat normally, and enjoy the big day without guilt.$$),
('coach', 37, null, $$Traveling this week? Pack your sneakers. A hotel gym, a living-room workout, a walk around your relatives' neighborhood. Something counts. Log it so you get your point.$$),
('coach', 38, null, $$Quick reminder: the holidays are about the people, not the plate. Load up on conversations and laughs. The leftovers will still be there tomorrow.$$),
('coach', 39, null, $$Merry Christmas Eve! Try to fit in a morning workout or a family walk today. Then put the phone down and be with your people. You've earned it.$$),
('coach', 40, null, $$Merry Christmas from me and the whole team. Thank you for being part of this. Enjoy today fully, with no logging guilt and no stress. We'll pick it right back up tomorrow.$$),
('coach', 41, null, $$Back to basics today: water, protein, a walk, a normal dinner. Just like after Thanksgiving, some water weight will show up on the scale. It'll pass. Stay the course.$$),
('coach', 42, null, $$One week left. ONE. You've made it through Thanksgiving AND Christmas. This is where the challenge gets decided. Finish what you started.$$),
('coach', 43, null, $$The week between Christmas and New Year's is a weird one: no routine, lots of leftovers. Give yourself some structure. Pick a workout time each day this week and stick to it.$$),
('coach', 44, null, $$The leftovers aren't going anywhere, and neither are you. Freeze some, share some, and don't feel like you have to finish the whole tin of cookies before January.$$),
('coach', 45, null, $$Final stretch. Check where you stand on the leaderboard. A couple of classes this week could change everything. Let's see some movement!$$),
('coach', 46, null, $$New Year's Eve! Get your workout in early so you can celebrate tonight. Eat a real dinner before the party, alternate every drink with water, and get home safe. See you in 2027.$$),
('coach', 47, null, $$Happy New Year! Everybody else is starting their resolutions today, and you're finishing strong. You don't need a fresh start, because you never fell off. That's huge.$$),
('coach', 48, null, $$Tomorrow's the last day. If you can, get a final weigh-in or InBody scan this weekend so we can see how far you've come. Be proud, no matter what the number says.$$),
('coach', 49, null, $$Day 49. You did it. Seven weeks, every holiday, and you held the line. Whatever your final number is, you showed up when it would have been easy not to. Thank you for letting me be part of it. Now let's keep this going in 2027.$$),

('tip', 1, 'Know your number', $$Your calorie target is set to maintain, not cut. Landing within 100–200 calories of it on most days means you're doing it right. Some days over, some under. That's normal.$$),
('tip', 2, 'Protein at every meal', $$Aim for a palm-sized portion of protein at each meal: eggs, Greek yogurt, chicken, lean beef, fish, cottage cheese or beans. It keeps you full longer and protects your muscle.$$),
('tip', 3, 'Drink before you eat', $$Drink a big glass of water before each meal. Thirst often feels like hunger, and starting a meal hydrated makes it easier to stop when you're satisfied.$$),
('tip', 4, 'The plate method', $$No counting required: fill half your plate with vegetables, a quarter with protein, and a quarter with carbs. It works at home, at restaurants and at holiday tables.$$),
('tip', 5, 'Walk after meals', $$A 10–15 minute walk after eating helps digestion and keeps your blood sugar steadier. They're the easiest steps you'll get all day.$$),
('tip', 6, 'Log as you go', $$Log food right after you eat, not at night. You'll remember better, it takes 10 seconds, and you'll make smarter choices for the rest of the day.$$),
('tip', 7, 'Plan the weekend', $$Before Saturday hits, decide on one meal out and one workout. When you plan the fun, you're less likely to drift into an all-weekend free-for-all.$$),
('tip', 8, 'Front-load Thanksgiving week', $$Schedule three workouts between Monday and Wednesday. You'll go into Thursday feeling strong, and if the rest of the week gets crazy, you're already covered.$$),
('tip', 9, 'Smarter Thanksgiving plate', $$Start with turkey and vegetables, then add small scoops of the sides you truly love. For dessert, pick one slice of your favorite pie instead of a sliver of everything.$$),
('tip', 10, 'Eat breakfast on big days', $$Skipping meals to "save room" usually means overeating later. A protein-heavy breakfast (eggs, Greek yogurt, a shake) keeps you from showing up to dinner starving.$$),
('tip', 11, 'Start a walking tradition', $$After the big meal, round everybody up for a 20-minute walk. It helps you feel better, gets the kids moving, and might become your family's new favorite tradition.$$),
('tip', 12, 'Leftover makeover', $$Leftover turkey makes great protein for salads, wraps, soup or chili. Lean on the turkey and go easy on the casseroles and desserts.$$),
('tip', 13, 'Scale swings are normal', $$Your weight can swing 2–4 lbs from day to day because of water, salt, carbs and hormones. Look at the trend over a couple of weeks, not one morning.$$),
('tip', 14, 'Weigh in the same way', $$Weigh first thing in the morning, after the bathroom and before eating, in similar clothes. Consistent conditions give you honest numbers.$$),
('tip', 15, 'Sunday 15-minute prep', $$Block your workout times for the week, then prep two protein options (grilled chicken, hard-boiled eggs, taco meat). Busy weeknights get a lot easier.$$),
('tip', 16, 'Never miss twice', $$Missing one day is life. Missing two starts a new habit. If you slip, make the very next meal or workout count and keep going.$$),
('tip', 17, 'Grab-and-go protein snacks', $$Keep a few of these around: Greek yogurt cups, string cheese, jerky, hard-boiled eggs, cottage cheese, turkey roll-ups or a protein shake.$$),
('tip', 18, 'The 20-minute home workout', $$Do 4 rounds of 10 squats, 10 push-ups (knees are fine), 10 lunges per leg and a 30-second plank. No equipment, about 20 minutes, 1 point.$$),
('tip', 19, 'Watch the liquid calories', $$A cup of eggnog can run around 350 calories, and a large specialty coffee 300–500. Enjoy them on purpose, not on autopilot, and drink water in between.$$),
('tip', 20, 'Pre-party snack', $$Eat a small protein-and-fiber snack before a party, like an apple with string cheese or yogurt with berries. You'll make calmer choices once you get there.$$),
('tip', 21, 'Party plate strategy', $$Grab a plate instead of grazing, fill it with protein and veggies first, then step away from the snack table. Out of sight really is out of mind.$$),
('tip', 22, 'Protect your sleep', $$Aim for 7+ hours. Stop caffeine by early afternoon, keep your room cool and dark, and put screens down 30 minutes before bed. Better sleep means fewer cravings.$$),
('tip', 23, 'Fiber fills you up', $$Beans, berries, oats, apples and vegetables are full of fiber. It keeps you full and steady, so try to get some at every meal.$$),
('tip', 24, 'Sneak in more steps', $$Park at the far end of the lot, take the stairs, walk during phone calls, or do laps during the kids' practice. Little steps add up to big totals.$$),
('tip', 25, 'Lift to protect muscle', $$Strength training 2–3 times a week helps you hold on to muscle, and muscle helps keep your metabolism up. It's the best insurance for holiday eating.$$),
('tip', 26, 'Restaurant game plan', $$Look at the menu ahead of time, choose grilled over fried, ask for sauces on the side, and box up half when the food arrives if portions are huge.$$),
('tip', 27, 'The one-treat rule', $$Pick the treat you really want, put it on a plate, sit down and enjoy it slowly. Eating it mindfully is a lot more satisfying than grabbing five things while you walk by.$$),
('tip', 28, 'Measure the sneaky stuff', $$Oils, butter, peanut butter and dressings are easy to underestimate. One tablespoon of oil is about 120 calories. Measure them for a few days to recalibrate your eye.$$),
('tip', 29, 'Progress isn''t just the scale', $$Track your waist, how your clothes fit, your energy, your strength and your progress photos. Sometimes the scale stays flat while everything else improves.$$),
('tip', 30, 'Hungry or HALT?', $$Before you snack, check in with HALT: are you Hungry, Angry, Lonely or Tired? If it's not hunger, try water, a walk, a call to a friend or an early night instead.$$),
('tip', 31, 'Add, don''t just subtract', $$Add a vegetable, a glass of water or a 10-minute walk. When you add good stuff, it naturally crowds out the less helpful stuff, with no willpower battle.$$),
('tip', 32, 'Try a new class', $$Classes bring built-in accountability, great energy and a coach who does the planning for you. They're also worth 3 points.$$),
('tip', 33, 'Set up your kitchen', $$Keep fruit and healthy snacks on the counter and put treats in a cabinet. You tend to eat what you see, so make the easy choice the good one.$$),
('tip', 34, 'The 10-minute minimum', $$When you're slammed, commit to just 10 minutes. You'll usually keep going, and if you don't, 10 minutes still counts.$$),
('tip', 35, 'Hydrate in cold weather', $$You still lose plenty of water in winter, you just notice thirst less. Keep a bottle with you and aim for pale yellow.$$),
('tip', 36, 'Christmas week game plan', $$Bank workouts Monday through Wednesday, eat normal meals around the celebrations, and enjoy the big day. Get right back to your routine the day after.$$),
('tip', 37, 'Travel workout kit', $$Pack sneakers and a resistance band. Use the hotel gym, do a bodyweight circuit in your room, or explore on foot. Moving helps with travel stiffness too.$$),
('tip', 38, 'Slow down at the table', $$Put your fork down between bites and talk more. It takes about 20 minutes for your brain to register that you're full, so slowing down helps you eat less without trying.$$),
('tip', 39, 'Healthier holiday baking', $$Swap Greek yogurt for some sour cream, use applesauce for part of the oil, or cut the sugar by about a quarter. Most recipes still turn out great.$$),
('tip', 40, 'Enjoy the day', $$On the biggest holidays, skip the tracking stress. One day doesn't define this challenge. What you do in the days around it does.$$),
('tip', 41, 'No "detox" needed', $$After a big holiday, skip the juice cleanses and starving. Water, protein, vegetables, a walk and a normal meal schedule are all the reset you need.$$),
('tip', 42, 'Smarter drinking', $$Decide how many drinks you'll have before you go, alternate each one with water, and choose lighter options like a spirit with soda water or a wine spritzer.$$),
('tip', 43, 'Limit the leftover dessert', $$Freeze extra desserts, send them home with guests, or bring them to work. Keep the turkey and the vegetables.$$),
('tip', 44, 'Rest days are part of the plan', $$Take 1–2 easier days a week. Light walking, stretching or yoga help you recover so you come back stronger, and you avoid burning out.$$),
('tip', 45, 'Five minutes of mobility', $$Stretch your hips, hamstrings and chest for 5–10 minutes a day. You'll feel better from all the sitting, driving and couch time the holidays bring.$$),
('tip', 46, 'New Year''s Eve plan', $$Work out in the morning, eat a real dinner before you go out, keep water in your hand between drinks, and have a safe ride home planned.$$),
('tip', 47, 'Resolutions that stick', $$Make them small and specific: "3 workouts a week" beats "get in shape." Write them down and attach them to something you already do.$$),
('tip', 48, 'Final weigh-in tips', $$Weigh in under the same conditions as your first scan: morning, before eating, similar clothes. Book your InBody if you can. Apples to apples.$$),
('tip', 49, 'Keep what worked', $$The challenge ends, but the habits don't have to. Pick the 2–3 things that helped you most over these seven weeks and keep them going in 2027.$$);

-- ---------- Starter Recipes & Tips library -------------------------------
insert into public.library_items (kind, category, title, body) values
('recipe', 'Breakfast', 'Protein Overnight Oats', $$About 380 calories · 28g protein · 1 serving

## Ingredients
- 1/2 cup old-fashioned oats
- 1/2 cup plain nonfat Greek yogurt
- 1/2 cup unsweetened almond milk
- 1/2 scoop vanilla protein powder
- 1 tsp chia seeds
- 1/2 cup berries
- Cinnamon to taste

## Steps
1. Stir everything except the berries together in a jar.
2. Refrigerate overnight (or at least 4 hours).
3. Top with berries in the morning and eat it cold.$$),
('recipe', 'Breakfast', 'Grab-and-Go Egg Muffins', $$About 80 calories each · 7g protein · makes 12

## Ingredients
- 10 eggs
- 1 cup chopped spinach
- 1/2 cup diced bell pepper
- 1/2 cup diced onion
- 1/2 cup shredded cheese
- Salt, pepper, garlic powder

## Steps
1. Heat the oven to 350°F and spray a 12-cup muffin tin.
2. Divide the veggies and cheese between the cups.
3. Whisk the eggs with the seasoning and pour over the top.
4. Bake 20–22 minutes until set. They keep 4–5 days in the fridge, so grab two for breakfast.$$),
('recipe', 'Lunch & Dinner', 'Sheet Pan Chicken Fajitas', $$About 400 calories per serving (with 2 small tortillas) · 38g protein · serves 4

## Ingredients
- 1.5 lb chicken breast, sliced thin
- 3 bell peppers, sliced
- 1 large onion, sliced
- 1 tbsp olive oil
- 2 tbsp fajita seasoning
- Small tortillas, salsa, Greek yogurt (instead of sour cream)

## Steps
1. Heat the oven to 425°F.
2. Toss the chicken, peppers and onion with the oil and seasoning on a sheet pan.
3. Roast 20–25 minutes, stirring once halfway.
4. Serve in tortillas or over rice, with salsa and a scoop of Greek yogurt.$$),
('recipe', 'Lunch & Dinner', 'Leftover Turkey Chili', $$About 350 calories per serving · 32g protein · serves 6

## Ingredients
- 3 cups leftover turkey, shredded (or 1.5 lb lean ground turkey, browned)
- 1 onion, diced
- 2 cans beans (black or kidney), drained
- 1 can diced tomatoes with green chiles
- 1 can tomato sauce
- 2 cups broth
- 2 tbsp chili powder, 1 tsp cumin, salt

## Steps
1. Cook the onion in a big pot until soft.
2. Add everything else and simmer 25–30 minutes.
3. Top with a little cheese, cilantro or Greek yogurt. It freezes great.$$),
('recipe', 'Lunch & Dinner', 'Turkey Taco Bowls', $$About 450 calories per bowl · 35g protein · serves 4

## Ingredients
- 1 lb lean ground turkey
- 1 packet taco seasoning (or homemade)
- 2 cups cooked rice
- 1 can black beans, drained
- Shredded lettuce, pico de gallo, a little cheese, salsa

## Steps
1. Brown the turkey and add the seasoning with a splash of water.
2. Build bowls: 1/2 cup rice, a big handful of lettuce, beans, turkey, pico and salsa.
3. Pack the extras for lunches this week.$$),
('recipe', 'Snacks', 'Greek Yogurt Ranch Dip', $$About 40 calories per 1/4 cup · 6g protein

## Ingredients
- 1 cup plain nonfat Greek yogurt
- 1 tbsp ranch seasoning mix
- Squeeze of lemon
- Fresh dill (optional)

## Steps
1. Stir it all together and chill 30 minutes.
2. Serve with carrots, cucumbers, bell peppers and snap peas. Bring it to a party so you know there's a good option there.$$),
('recipe', 'Holiday Swaps', 'Lighter Garlic Mashed Potatoes', $$About 140 calories per 3/4 cup · serves 6

## Ingredients
- 1.5 lb Yukon Gold potatoes
- 1 head cauliflower, cut into florets
- 3 cloves garlic
- 1/2 cup plain Greek yogurt
- 2 tbsp butter
- Salt, pepper, chives

## Steps
1. Boil the potatoes, cauliflower and garlic until fork-tender, about 15–18 minutes. Drain well.
2. Mash with the yogurt and butter, then season to taste.
3. Nobody at the table will know the difference.$$),
('recipe', 'Holiday Swaps', 'Cinnamon Roasted Sweet Potatoes', $$About 130 calories per serving · serves 4

## Ingredients
- 2 large sweet potatoes, cubed
- 1 tbsp olive oil
- 1 tsp cinnamon
- Pinch of salt
- 1 tbsp maple syrup (optional)

## Steps
1. Heat the oven to 425°F.
2. Toss everything together and spread on a sheet pan.
3. Roast 25–30 minutes until caramelized. All the flavor of the marshmallow casserole at a fraction of the sugar.$$),
('recipe', 'Drinks', 'Pumpkin Pie Protein Shake', $$About 250 calories · 27g protein

## Ingredients
- 1 cup unsweetened almond milk
- 1/3 cup canned pumpkin
- 1 scoop vanilla protein powder
- 1/2 frozen banana
- 1/2 tsp pumpkin pie spice
- Handful of ice

## Steps
1. Blend until smooth.
2. Tastes like dessert and works as breakfast or a post-workout shake.$$),
('recipe', 'Drinks', 'Sparkling Cranberry Mocktail', $$About 30 calories

## Ingredients
- Sparkling water
- 2 oz light cranberry juice
- Squeeze of lime
- Fresh cranberries and a rosemary sprig to garnish

## Steps
1. Fill a nice glass with ice, add the juice and lime, and top with sparkling water.
2. Garnish it. A festive glass in your hand makes it easy to skip the 300-calorie cocktails.$$),

('tip', 'Holiday Survival', 'How to Build a Holiday Plate', $$- Start with protein: turkey, ham, brisket.
- Fill half the plate with vegetables and salad.
- Add small scoops of the two or three sides you really love.
- Pick one dessert you'll truly enjoy.
- Sit down, eat slowly, and wait 15 minutes before thinking about seconds.$$),
('tip', 'Nutrition', 'Maintenance Grocery List', $$## Protein
- Chicken breast, lean ground turkey, eggs, Greek yogurt, cottage cheese, tuna packets, deli turkey

## Produce
- Bagged salad, baby carrots, bell peppers, frozen veggies, berries, apples, bananas

## Smart carbs
- Oats, rice, potatoes, whole-grain tortillas, beans

## Extras
- Salsa, hot sauce, mustard, sparkling water, a protein powder you like$$),
('tip', 'Nutrition', 'Eating Out Cheat Sheet', $$- **Tex-Mex:** fajitas or a burrito bowl; go easy on the chips (that basket is easily 500+ calories).
- **Burgers:** a single patty, skip the mayo, side salad or split the fries.
- **Steakhouse:** a sirloin or filet, a veggie side, a baked potato with toppings on the side.
- **Fast food:** grilled chicken, kids' size fries, water or diet soda.
- **Everywhere:** sauces on the side, and box half when it arrives.$$),
('tip', 'Training', 'No-Equipment Hotel Room Workout', $$Do 3–4 rounds:
- 15 bodyweight squats
- 10 push-ups (hands on the bed to make it easier)
- 10 reverse lunges per leg
- 15 glute bridges
- 30-second plank
- 20 jumping jacks

Rest a minute between rounds. About 20 minutes. Log it as "At home" for 1 point.$$),
('tip', 'Training', 'Understanding Your InBody Results', $$- **Weight:** your total, which includes water and food.
- **SMM (skeletal muscle mass):** the muscle you can train. Holding or growing it is a big win.
- **Body fat %:** the share of your weight that's fat. Small drops matter.
- Scan under the same conditions each time (morning, before eating or a workout) so you're comparing apples to apples.
- Ask staff to walk you through your printout anytime.$$),
('tip', 'Mindset', 'Bounce Back After a Big Day', $$1. Don't skip meals the next day. Eat normally.
2. Drink plenty of water.
3. Get a workout or a long walk in.
4. Expect a little water weight on the scale for a day or two.
5. Log honestly and move on. One day is one day.$$);

-- ---------- Welcome announcement (edit or delete in admin) ---------------
insert into public.announcements (kind, title, body, pinned) values
('news', 'Welcome to Maintain, Don''t Gain!', $$Thanks for joining! A few quick things:

- Log your food and steps every day. It only takes a minute.
- Log every workout to earn points: home = 1, gym = 2, class = 3.
- Check the Crew tab to see the leaderboard.
- Jump into our GroupMe to cheer each other on.

Let's walk into 2027 stronger than ever.$$, true);
