# Calcifer

A simple, AI-powered calorie counter for android/ios. UI is built using capacitor/shadcn/tailwind/svelte. No login, no account, device-only storage.

For reference, I have included some @screenshots from OpenNutriTracker. Use these only for design inspiration; prefer the spec when it conflicts with the spec.

## Screens

### Navigation

Include a bottom nav menu with Dashboard, Stats, and Settings buttons.

### Dashboard

At the top, a radial chart of today's calories with a breakdown below it of macros (see @screenshots/screenshot1.png).

Below that, the following headings: Activity, Breakfast, Lunch, Dinner, Snack with activities/meals recorded below (seen @screenshot2.png). Each activity items shows title, duration, and calories burned. Each food item shows title, calories, and macros in a compact format (e.g., "10 c, 12 f, 3 p").

To add an activity, press plus button below Activity. To add a meal, press plus button below the meal heading. Activities and meals can be deleted by pressing a trash icon on the item. Confirm before deleting.

Swiping left/right goes to the previous/next day.

### Add Activity

Show a list of recent activities with an "add activity" button at the top. Add activity opens a form with Title, Description, and calories/hr burned inputs. As the user types, use a local LLM to calculate calories/hr and auto-populate. If the user has touched calories/hr, don't modify it. Include an x button to clear it.

Once an activity is selected, the user enters how many minutes they spent on the activity. Calories burned are a simple calculation.

### Add Meal

Show a list of recent meals with an "add meal" button at the top. Add meal opens a form with Title, Description, and separate macros per gram inputs. As the user types title/description, use a local LLM to calculate macros and auto-populate. If the user has touched macros, don't modify it. Include an x button to clear each macro input.

Once a meal is selected, the user enters how many grams they ate. Calories consumed are calculated automatically from macros.

### Stats

A line graph of the past month including calories, carbs, fat, and protein as different colored lines. Default to 7d, with selectors for 30, 90, and all. Include daily average as bars below that. See @screenshot3.png.

### Settings

Inputs for age, height, weight, activity level, goal.

Also include a section with sliders which allows the user to select their macro breakdown.

Food units are always grams, energy unit is kcal, body weight unit is lbs.

See screenshots 4-7 for details on how calorie/macro targets are calculated and some example UI. Don't put macros in a modal, this should just be one form, no submit button.

## Design details

When a macro or calories exceeds the day's budget, show a secondary version of the accent color overlapping the primary version. For example:

```
// Under budget
===========------------------------

//Over budget
#####==============================
```

## Acceptance criteria

- No tests, minimal comments.
- Entire codebase must be <10k LOC
- Logic should be in the typescript layer as much as possible - reserve native code for accessing platform functionality.
- Application should be well-architected with clear separation of responsibilities. Separate general-purpose library functions, stateless application domain logic, application state, routes/views, and networking/llm/storage/etc adapters.
- Code should not be clever or obscure; avoid single-use wrappers or premature abstractions.
- Abstractions should be written in domain terms - no ad-hoc types or functions. Complex logic should be stateless - state should be injected either as function arguments or into class constructors.
